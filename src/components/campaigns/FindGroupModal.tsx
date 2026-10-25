'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CarCampaign, City, BuyerPreferences } from '@/lib/types';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import { formatCrores, formatINR } from '@/lib/calculations';
import {
  Search,
  Sparkles,
  Car,
  MapPin,
  CheckCircle2,
  Users,
  Tag,
  ArrowRight,
  PlusCircle,
  X,
  SlidersHorizontal,
  Clock,
  ShieldCheck,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface FindGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FindGroupModal({ isOpen, onClose }: FindGroupModalProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    campaigns,
    offers,
    findMatchingGroups,
    createCustomGroup,
    joinCampaign,
    getApprovedOffers,
  } = useCampaignStore();

  const [step, setStep] = useState<'preferences' | 'results' | 'create_group'>('preferences');
  const [city, setCity] = useState<City>(user?.city || 'Hyderabad');
  const [brand, setBrand] = useState(user?.preferences?.preferredBrand || 'Hyundai');
  const [model, setModel] = useState(user?.preferences?.preferredModel || 'Creta');
  const [fuelType, setFuelType] = useState<any>('Petrol');
  const [transmission, setTransmission] = useState<any>('Automatic');
  const [budgetMax, setBudgetMax] = useState<number>(2500000);
  const [timelineDays, setTimelineDays] = useState<number>(30);

  // For Create New Group flow
  const [newVariant, setNewVariant] = useState('SX(O) Turbo Petrol DCT');
  const [newEstimatedPrice, setNewEstimatedPrice] = useState<number>(2040000);
  const [newTargetBuyers, setNewTargetBuyers] = useState<number>(20);
  const [newMaxCapacity, setNewMaxCapacity] = useState<number>(25);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchedGroups, setMatchedGroups] = useState<CarCampaign[]>([]);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const prefs: BuyerPreferences = {
      city,
      preferredBrand: brand,
      preferredModel: model,
      fuelType,
      transmission,
      budgetMin: 500000,
      budgetMax,
      timelineDays,
    };

    const results = findMatchingGroups(prefs);
    setMatchedGroups(results);
    setStep('results');
  };

  const handleJoin = async (campaignId: string) => {
    try {
      await joinCampaign(
        {
          campaignId,
          fullName: user?.fullName || 'Rahul Sharma',
          phone: user?.phone || '9876543210',
          email: user?.email || 'rahul.sharma@example.com',
          colorPreference: 'Any Preferred',
          financeRequirement: 'Bank Loan',
          willingToBuyInDays: timelineDays,
        },
        user
      );
      try {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      alert('Congratulations! You have joined this buyer group.');
      onClose();
      router.push(`/campaigns/${campaignId}`);
    } catch (e: any) {
      alert(e?.message || 'Failed to join group.');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createCustomGroup(
        {
          brand,
          model,
          variant: newVariant,
          city,
          fuelType,
          transmission,
          estimatedOnRoadPrice: Number(newEstimatedPrice),
          targetBuyers: Number(newTargetBuyers),
          maxCapacity: Number(newMaxCapacity),
        },
        user
      );

      try {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      } catch (e) {}

      alert(res.message);
      onClose();
      router.push(`/campaigns/${res.campaign.id}`);
    } catch (e: any) {
      alert(e?.message || 'Error creating group.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto bg-[#080c14]/95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: PREFERENCES SEARCH FORM */}
        {step === 'preferences' && (
          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-pill bg-white/[0.04] text-amber-200 border border-amber-300/30 text-xs font-mono">
                  <Search className="w-3.5 h-3.5 mr-1 text-amber-300" />
                  Find My Car Group
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Smart Buyer Demand Matcher
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Find Compatible Buyer Groups
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Tell us which car you want to buy. We will match you with active buyer groups in your city so you can negotiate together.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* City */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">City / Location *</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value as City)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
                >
                  <option value="Hyderabad" className="bg-slate-900">Hyderabad (Active Pilot)</option>
                  <option value="Bengaluru" className="bg-slate-900">Bengaluru</option>
                  <option value="Mumbai" className="bg-slate-900">Mumbai</option>
                  <option value="Delhi-NCR" className="bg-slate-900">Delhi-NCR</option>
                </select>
              </div>

              {/* Brand */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Car Brand *</label>
                <select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    if (e.target.value === 'Hyundai') setModel('Creta');
                    else if (e.target.value === 'Tata') setModel('Nexon EV');
                    else if (e.target.value === 'Maruti Suzuki') setModel('Brezza');
                    else setModel('');
                  }}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
                >
                  <option value="Hyundai" className="bg-slate-900">Hyundai</option>
                  <option value="Tata" className="bg-slate-900">Tata Motors</option>
                  <option value="Maruti Suzuki" className="bg-slate-900">Maruti Suzuki</option>
                  <option value="Mahindra" className="bg-slate-900">Mahindra</option>
                  <option value="Kia" className="bg-slate-900">Kia</option>
                  <option value="Toyota" className="bg-slate-900">Toyota</option>
                </select>
              </div>

              {/* Model */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Car Model *</label>
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. Creta, Nexon EV, Brezza, XUV700"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/50"
                />
              </div>

              {/* Fuel Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Fuel Type</label>
                <select
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
                >
                  <option value="Petrol" className="bg-slate-900">Petrol</option>
                  <option value="EV" className="bg-slate-900">Electric (EV)</option>
                  <option value="Diesel" className="bg-slate-900">Diesel</option>
                  <option value="Hybrid" className="bg-slate-900">Hybrid</option>
                  <option value="All" className="bg-slate-900">Any Fuel</option>
                </select>
              </div>

              {/* Transmission */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Transmission</label>
                <select
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
                >
                  <option value="Automatic" className="bg-slate-900">Automatic (AT / DCT / IVT)</option>
                  <option value="Manual" className="bg-slate-900">Manual (MT)</option>
                  <option value="All" className="bg-slate-900">Any Transmission</option>
                </select>
              </div>

              {/* Budget Limit */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex justify-between">
                  <span>Max Budget Range</span>
                  <span className="font-mono text-amber-300">{formatINR(budgetMax)}</span>
                </label>
                <input
                  type="range"
                  min="800000"
                  max="4000000"
                  step="50000"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full accent-amber-300 cursor-pointer h-2 bg-slate-900 rounded-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-lg shadow-amber-300/10 transition-all flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 text-slate-950" />
              <span>Search Compatible Active Groups</span>
            </button>
          </form>
        )}

        {/* STEP 2: SEARCH RESULTS */}
        {step === 'results' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">
                  Matching Groups for {brand} {model} in {city}
                </h3>
                <p className="text-xs text-slate-400">
                  {matchedGroups.length} active demand cluster(s) found
                </p>
              </div>
              <button
                onClick={() => setStep('preferences')}
                className="text-xs text-amber-300 hover:text-amber-200 underline font-medium"
              >
                Change Preferences
              </button>
            </div>

            {matchedGroups.length === 0 ? (
              /* No Compatible Group Found */
              <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] text-center space-y-4 bg-slate-900/40">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-300 mx-auto flex items-center justify-center border border-amber-400/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold text-white">
                    No Matching Active Group Found
                  </h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    There is currently no active group buy for <strong className="text-white">{brand} {model} ({fuelType})</strong> in {city}. You can start a new group and be the founding member!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setStep('preferences')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10"
                  >
                    Adjust Preferences
                  </button>
                  <button
                    onClick={() => setStep('create_group')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 flex items-center justify-center gap-2"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-950" />
                    <span>Create New Car Group</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Matching Groups List */
              <div className="space-y-4">
                {matchedGroups.map((camp) => {
                  const approvedOffersCount = getApprovedOffers(camp.id).length;
                  const remainingTarget = Math.max(0, camp.targetBuyers - camp.currentBuyers);

                  return (
                    <div
                      key={camp.id}
                      className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4 hover:border-amber-300/30 transition-all bg-slate-900/60"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider">
                              {camp.city} Active Batch
                            </span>
                            <span className="badge-pill bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                              {camp.status.toUpperCase()}
                            </span>
                          </div>
                          <h4 className="text-lg font-bold text-white mt-0.5">
                            {camp.brand} {camp.model}
                          </h4>
                          <p className="text-xs text-slate-400">{camp.variant}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Est. On-Road</div>
                          <div className="text-base font-bold text-white font-mono">
                            {formatINR(camp.estimatedOnRoadPrice)}
                          </div>
                        </div>
                      </div>

                      {/* 4 Separate Counts */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-sans">1. Members Joined</div>
                          <div className="text-sm font-bold text-white">
                            {camp.currentBuyers} / {camp.targetBuyers}
                          </div>
                          <div className="text-[10px] text-amber-300/90 font-sans">
                            {remainingTarget} needed for target
                          </div>
                        </div>

                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-sans">2. Offer Interest</div>
                          <div className="text-sm font-bold text-amber-300">
                            {camp.interestedCount || 0} Buyers
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">Exploring quotes</div>
                        </div>

                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-sans">3. Confirmed Bookings</div>
                          <div className="text-sm font-bold text-emerald-400">
                            {camp.confirmedBookingsCount || 0} Bookings
                          </div>
                          <div className="text-[10px] text-emerald-400 font-sans">Intent confirmed</div>
                        </div>

                        <div>
                          <div className="text-[9px] text-slate-400 uppercase font-sans">4. Approved Bids</div>
                          <div className="text-sm font-bold text-cyan-300">
                            {approvedOffersCount} Showrooms
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">Competing live</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <Link
                          href={`/campaigns/${camp.id}`}
                          onClick={onClose}
                          className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                        >
                          <span>View Approved Offers ({approvedOffersCount})</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          onClick={() => handleJoin(camp.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-md"
                        >
                          Join This Group
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: CREATE NEW GROUP FLOW */}
        {step === 'create_group' && (
          <form onSubmit={handleCreateGroup} className="space-y-6">
            <div>
              <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Launch New Demand Pool
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Form a New Group for {brand} {model}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Confirm your car preferences and group settings. Once created, your pool will be listed on Discover Campaigns for other buyers to join.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs text-slate-300">Car Brand & Model</label>
                <input
                  type="text"
                  disabled
                  value={`${brand} ${model}`}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">City Hub</label>
                <input
                  type="text"
                  disabled
                  value={city}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-300 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Specific Variant *</label>
                <input
                  type="text"
                  required
                  value={newVariant}
                  onChange={(e) => setNewVariant(e.target.value)}
                  placeholder="e.g. SX(O) Turbo Petrol DCT"
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-300/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Estimated On-Road Price (INR) *</label>
                <input
                  type="number"
                  step="10000"
                  required
                  value={newEstimatedPrice}
                  onChange={(e) => setNewEstimatedPrice(Number(e.target.value))}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Target Buyer Count (Quota) *</label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  required
                  value={newTargetBuyers}
                  onChange={(e) => setNewTargetBuyers(Number(e.target.value))}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-300">Maximum Group Capacity</label>
                <input
                  type="number"
                  min="10"
                  max="60"
                  value={newMaxCapacity}
                  onChange={(e) => setNewMaxCapacity(Number(e.target.value))}
                  className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
                />
              </div>
            </div>

            <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-white">Founding Member Privilege:</div>
              <p className="text-slate-400">
                You ({user?.fullName || 'Buyer'}) will be automatically enrolled as the first member (1/{newTargetBuyers}) of this group with zero payment.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('results')}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04] border border-white/5"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Group...' : 'Confirm & Launch Car Group'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
