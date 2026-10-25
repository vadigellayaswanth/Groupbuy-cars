'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth-store';
import { useCampaignStore } from '@/lib/campaign-store';
import { formatCrores, formatINR } from '@/lib/calculations';
import FindGroupModal from '@/components/campaigns/FindGroupModal';
import TierProgressBar from '@/components/campaigns/TierProgressBar';
import { City, BuyerPreferences } from '@/lib/types';
import {
  Users,
  Car,
  ShieldCheck,
  Calendar,
  CreditCard,
  Paintbrush,
  LogOut,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Search,
  PlusCircle,
  FileText,
  Clock,
  Building2,
  Check,
  X,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Tag,
  MapPin,
  ExternalLink,
  Info,
} from 'lucide-react';

export default function BuyerPortalPage() {
  const { user, isBuyer, updateBuyerPreferences, switchPersona } = useAuthStore();
  const {
    campaigns,
    members,
    bookings,
    buyerLeaveCampaign,
    cancelBooking,
    confirmBookingIntent,
    offers,
    getApprovedOffers,
  } = useCampaignStore();

  const [findGroupModalOpen, setFindGroupModalOpen] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // Preference form state
  const [city, setCity] = useState<City>(user?.preferences?.city || user?.city || 'Hyderabad');
  const [prefBrand, setPrefBrand] = useState(user?.preferences?.preferredBrand || 'Hyundai');
  const [prefModel, setPrefModel] = useState(user?.preferences?.preferredModel || 'Creta');
  const [fuelType, setFuelType] = useState<any>(user?.preferences?.fuelType || 'Petrol');
  const [transmission, setTransmission] = useState<any>(user?.preferences?.transmission || 'Automatic');
  const [budgetMax, setBudgetMax] = useState<number>(user?.preferences?.budgetMax || 2200000);
  const [timelineDays, setTimelineDays] = useState<number>(user?.preferences?.timelineDays || 30);

  // Find memberships belonging to current buyer
  const myMemberships = members.filter(
    (m) =>
      m.email.toLowerCase() === (user?.email || '').toLowerCase() ||
      m.phone.replace(/\D/g, '') === (user?.phone || '').replace(/\D/g, '') ||
      (m.userId && m.userId === user?.id)
  );

  // Find bookings belonging to current buyer
  const myBookings = bookings.filter((b) => b.buyerId === user?.id && b.status !== 'cancelled');

  // Calculate potential unlocked savings across active groups or bookings
  const calculatedSavings = myMemberships.reduce((total, member) => {
    const bids = getApprovedOffers(member.campaignId);
    const topBid = bids[0];
    return total + (topBid ? topBid.cashDiscount : 50000);
  }, 0);
  const displaySavings = calculatedSavings > 0 ? calculatedSavings : 70000;

  // Recommended campaigns based on city / preference that user has not joined
  const joinedCampaignIds = new Set(myMemberships.map((m) => m.campaignId));
  const recommendedCampaigns = campaigns
    .filter((c) => !joinedCampaignIds.has(c.id) && c.status === 'active')
    .slice(0, 3);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    updateBuyerPreferences({
      city,
      preferredBrand: prefBrand,
      preferredModel: prefModel,
      fuelType,
      transmission,
      budgetMin: 500000,
      budgetMax,
      timelineDays,
    });
    setPreferencesSaved(true);
    setTimeout(() => setPreferencesSaved(false), 2500);
  };

  const handleLeaveGroup = async (memberId: string, campaignName: string) => {
    if (confirm(`Leave the buyer group for ${campaignName}? Your reserved slot will be released.`)) {
      try {
        await buyerLeaveCampaign(memberId, user);
      } catch (e: any) {
        alert(e?.message || 'Error leaving group.');
      }
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (confirm('Cancel your booking intent for this dealership offer? You can re-select or compare other offers at any time.')) {
      try {
        await cancelBooking(bookingId, user);
      } catch (e: any) {
        alert(e?.message || 'Error cancelling booking.');
      }
    }
  };

  return (
    <div className="site-container py-10 space-y-10">
      {/* Executive Header & HUD */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/[0.08] p-6 sm:p-8 bg-gradient-to-br from-[#0c1017]/90 via-[#07090e]/95 to-black">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                <Users className="w-3.5 h-3.5 mr-1.5" />
                Individual Buyer Hub
              </span>
              <span className="badge-pill bg-white/[0.05] text-slate-300 border border-white/10 text-xs font-mono">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                {city}
              </span>
              <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Verified Buyer Persona
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-gradient-champagne">{user?.fullName || 'Buyer'}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Consolidate your volume buying power. Track your joined pools, compare verified dealership quotes with unbundled cash discounts, and manage showroom quotation intents.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-lg shadow-amber-300/10 transition-all flex items-center gap-2 transform hover:scale-[1.02]"
            >
              <Search className="w-4 h-4 text-slate-950" />
              <span>Find or Form Group</span>
            </button>

            <Link
              href="/campaigns"
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center gap-2"
            >
              <span>Explore Pools</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* 4 HUD Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/[0.08]">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Active Groups</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {myMemberships.length}
            </div>
            <div className="text-[10px] text-slate-400">
              Cluster negotiations
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Showroom Quotes</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {myBookings.length}
            </div>
            <div className="text-[10px] text-slate-400">
              Active booking intent
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
              <span>Potential Savings</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              ~{formatINR(displaySavings)}
            </div>
            <div className="text-[10px] text-slate-400">
              Verified dealer cash off
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <Car className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target Specs</span>
            </div>
            <div className="text-base font-bold text-white truncate font-mono">
              {prefBrand} {prefModel}
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Budget: {formatINR(budgetMax)}
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Security & Zero Online Payment Assurance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-amber-400/20 bg-amber-950/[0.08] flex items-start gap-3.5 text-xs text-slate-300">
          <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4 text-amber-300" />
          </div>
          <div className="space-y-1.5">
            <span className="font-semibold text-amber-200 text-sm">Zero Online Payment Guarantee</span>
            <p className="text-slate-400 leading-relaxed text-xs">
              Joining pools and confirming quotation intent on GroupBuy Cars is completely free with ₹0 online charges. All booking token advances (typically ₹25,000) and vehicle balance invoices are paid directly to your chosen authorized dealership upon showroom verification.
            </p>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] bg-[#0c1017]/60 flex items-start gap-3.5 text-xs text-slate-300">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <span className="font-semibold text-white text-sm">Role-Based Autonomy & Freedom</span>
            <p className="text-slate-400 leading-relaxed text-xs">
              Individual buyers receive transparent, unbundled dealer quotations without unsolicited spam or aggressive dealer calls. You maintain full self-service control to cancel booking intent or leave group buying pools at any point prior to vehicle invoicing.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Vehicle Purchase Preferences Card */}
      <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">My Vehicle Purchase Preferences</h2>
              <p className="text-[11px] text-slate-400">Update your criteria to auto-match with active city fleet pools and upcoming dealership batches.</p>
            </div>
          </div>
          {preferencesSaved && (
            <span className="badge-pill bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono self-start sm:self-auto animate-pulse">
              <Check className="w-3.5 h-3.5 mr-1" />
              Preferences Saved Successfully
            </span>
          )}
        </div>

        <form onSubmit={handleSavePreferences} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* City */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Hub City</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value as City)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 transition-colors"
              >
                <option value="Hyderabad" className="bg-slate-900">Hyderabad</option>
                <option value="Bengaluru" className="bg-slate-900">Bengaluru</option>
                <option value="Mumbai" className="bg-slate-900">Mumbai</option>
                <option value="Delhi-NCR" className="bg-slate-900">Delhi-NCR</option>
              </select>
            </div>

            {/* Preferred Brand */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Preferred Brand</label>
              <select
                value={prefBrand}
                onChange={(e) => setPrefBrand(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 transition-colors"
              >
                <option value="Hyundai" className="bg-slate-900">Hyundai</option>
                <option value="Tata" className="bg-slate-900">Tata Motors</option>
                <option value="Maruti Suzuki" className="bg-slate-900">Maruti Suzuki</option>
                <option value="Mahindra" className="bg-slate-900">Mahindra</option>
                <option value="Kia" className="bg-slate-900">Kia Motors</option>
                <option value="Toyota" className="bg-slate-900">Toyota</option>
                <option value="Volkswagen" className="bg-slate-900">Volkswagen</option>
              </select>
            </div>

            {/* Target Model */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Target Model</label>
              <input
                type="text"
                value={prefModel}
                onChange={(e) => setPrefModel(e.target.value)}
                placeholder="e.g. Creta, Nexon, Grand Vitara"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-300/50 transition-colors"
              />
            </div>

            {/* Fuel Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Powertrain</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 transition-colors"
              >
                <option value="Petrol" className="bg-slate-900">Petrol</option>
                <option value="EV" className="bg-slate-900">EV (Electric)</option>
                <option value="Diesel" className="bg-slate-900">Diesel</option>
                <option value="Hybrid" className="bg-slate-900">Strong Hybrid</option>
                <option value="All" className="bg-slate-900">Any Powertrain</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Transmission */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 transition-colors"
              >
                <option value="Automatic" className="bg-slate-900">Automatic (DCT / CVT / AT)</option>
                <option value="Manual" className="bg-slate-900">Manual</option>
                <option value="All" className="bg-slate-900">Any Transmission</option>
              </select>
            </div>

            {/* Purchase Timeline */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Purchase Timeline</label>
              <select
                value={timelineDays}
                onChange={(e) => setTimelineDays(Number(e.target.value))}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 transition-colors"
              >
                <option value={15} className="bg-slate-900">Immediate (Within 15 Days)</option>
                <option value={30} className="bg-slate-900">Standard (Within 30 Days)</option>
                <option value={60} className="bg-slate-900">Flexible (Within 60 Days)</option>
                <option value={90} className="bg-slate-900">Planning (Within 90 Days)</option>
              </select>
            </div>

            {/* Max Budget Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] uppercase font-bold text-slate-400 font-mono">Max Budget Target</label>
                <span className="text-xs font-mono font-bold text-amber-300">{formatINR(budgetMax)}</span>
              </div>
              <input
                type="range"
                min={700000}
                max={5000000}
                step={50000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(Number(e.target.value))}
                className="w-full accent-amber-300 h-2 bg-slate-900 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>₹7 Lakh</span>
                <span>₹50 Lakh</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-white/[0.08]">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-md transition-all flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Update Match Criteria</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 1: My Confirmed Dealership Quotation Selections */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>My Showroom Quotations & Booking Intents</span>
              <span className="badge-pill bg-white/[0.06] text-amber-300 border border-white/10 text-xs font-mono">
                {myBookings.length} Active
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Track dealer quotations you have selected. Visit the showroom directly to inspect stock and finalize token advance.
            </p>
          </div>
        </div>

        {myBookings.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] text-center space-y-3 bg-[#0c1017]/60">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center text-slate-400">
              <Building2 className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Confirmed Showroom Quotes Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                When you compare verified dealership bids in a buying pool and lock in your intent, your showroom quotation details and delivery timeline will appear here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/campaigns/hyundai-creta-sxo-at"
                className="inline-flex items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 underline"
              >
                <span>View verified dealership quotes on Hyundai Creta pool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {myBookings.map((b) => {
              const camp = campaigns.find((c) => c.id === b.campaignId);
              const offer = offers.find((o) => o.id === b.offerId);

              const statusColor =
                b.status === 'booking_confirmed'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : b.status === 'purchased'
                  ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
                  : 'bg-amber-400/10 text-amber-300 border-amber-400/20';

              return (
                <div
                  key={b.id}
                  className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-amber-300/30 transition-all space-y-5 bg-[#0c1017]/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider">
                        {camp?.brand || b.carBrand} {camp?.model || b.carModel}
                      </span>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {b.dealershipName}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                        <span>{b.branchName || 'Authorized Showroom Network'}</span>
                      </p>
                    </div>

                    <span className={`badge-pill text-xs font-bold font-mono uppercase ${statusColor}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Pricing Breakdown Card */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans uppercase">Quoted On-Road Price</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {formatINR(b.quotedOnRoadPrice || b.offeredPrice || 0)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-sans uppercase">Direct Cash Discount</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {offer ? formatINR(offer.cashDiscount) : formatINR(b.cashDiscount || 70000)}
                      </div>
                    </div>
                  </div>

                  {/* Showroom Guidance Steps */}
                  <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/15 text-[11px] text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Showroom Allocation Instructions</span>
                    </div>
                    <p className="text-[10px] leading-relaxed text-slate-400 pl-5">
                      Present your registered phone ({user?.phone || 'Your contact'}) at the dealership desk. Pay the refundable token advance (₹25,000) directly to the showroom cashier. Allocation occurs individually in your name.
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
                    <Link
                      href={`/campaigns/${b.campaignId}`}
                      className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1"
                    >
                      <span>View Campaign & Quotes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => handleCancelBooking(b.id)}
                      className="text-xs text-rose-400 hover:text-rose-300 font-medium underline transition-colors"
                    >
                      Cancel Booking Intent
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Active Group Memberships */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>My Active Group Participations</span>
              <span className="badge-pill bg-white/[0.06] text-amber-300 border border-white/10 text-xs font-mono">
                {myMemberships.length} Pools Joined
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Clusters you are currently negotiating through. Dealers bid against the aggregated volume of the group.
            </p>
          </div>

          <button
            onClick={() => setFindGroupModalOpen(true)}
            className="text-xs text-amber-300 hover:text-amber-200 flex items-center gap-1.5 font-semibold self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Find or Create Another Group</span>
          </button>
        </div>

        {myMemberships.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 border border-white/[0.08] text-center space-y-4 bg-[#0c1017]/60">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center text-slate-400">
              <Car className="w-6 h-6 text-amber-300" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">No Active Buying Groups Joined</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                You haven&apos;t joined any car buying pools yet. Joining costs ₹0 and unlocks volume group discounts that single buyers cannot get on their own.
              </p>
            </div>
            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 transition-all shadow-md"
            >
              <Search className="w-4 h-4 text-slate-950" />
              <span>Find My Car Group</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myMemberships.map((member) => {
              const camp = campaigns.find((c) => c.id === member.campaignId);
              if (!camp) return null;
              const approvedBids = getApprovedOffers(camp.id);
              const topOffer = approvedBids[0];

              return (
                <div
                  key={member.id}
                  className="glass-panel rounded-2xl border border-white/[0.08] hover:border-amber-300/30 transition-all overflow-hidden bg-[#0c1017]/80 flex flex-col justify-between"
                >
                  <div>
                    {/* Vehicle Header with Image */}
                    <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                      <img
                        src={camp.imageUrl}
                        alt={`${camp.brand} ${camp.model}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0c1017] via-[#0c1017]/40 to-transparent"></div>

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="badge-pill bg-black/70 backdrop-blur-md text-amber-200 border border-amber-300/20 text-[10px] font-mono">
                          {camp.city} Fleet Pool
                        </span>
                        <span className="badge-pill bg-black/70 backdrop-blur-md text-slate-200 border border-white/10 text-[10px] font-mono">
                          {camp.currentBuyers}/{camp.targetBuyers} Buyers
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white">
                          {camp.brand} {camp.model}
                        </h3>
                        <p className="text-xs text-slate-300">{camp.variant}</p>
                      </div>
                    </div>

                    <div className="p-5 space-y-4">
                      {/* Tier Progress Bar */}
                      <TierProgressBar
                        currentBuyers={camp.currentBuyers}
                        targetBuyers={camp.targetBuyers}
                        tiers={camp.tiers}
                        compact={true}
                      />

                      {/* Personal Configuration Specs */}
                      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                        <div className="space-y-0.5">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <Paintbrush className="w-3 h-3 text-amber-300" />
                            <span>Color Choice</span>
                          </div>
                          <div className="font-semibold text-white truncate">
                            {member.colorPreference || 'Any Preferred'}
                          </div>
                        </div>

                        <div className="space-y-0.5">
                          <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                            <CreditCard className="w-3 h-3 text-emerald-400" />
                            <span>Payment Route</span>
                          </div>
                          <div className="font-semibold text-white">
                            {member.financeRequirement || 'Bank Loan'}
                          </div>
                        </div>
                      </div>

                      {/* Top Unlocked Discount */}
                      {topOffer ? (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                          <span className="text-emerald-300 font-medium">Top Approved Cash Discount:</span>
                          <span className="font-bold text-white font-mono text-sm">
                            {formatINR(topOffer.cashDiscount)} off
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                          <span className="text-slate-400">Target Volume Discount:</span>
                          <span className="font-bold text-amber-300 font-mono">
                            ~{formatINR(camp.tiers[camp.tiers.length - 1]?.discountTarget || 75000)} target
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="p-5 pt-0 flex items-center gap-3">
                    <Link
                      href={`/campaigns/${camp.id}`}
                      className="flex-1 text-center py-2.5 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-sm transition-all"
                    >
                      Compare Dealer Offers ({approvedBids.length})
                    </Link>

                    <button
                      onClick={() => handleLeaveGroup(member.id, `${camp.brand} ${camp.model}`)}
                      title="Leave this pool"
                      className="p-2.5 rounded-xl text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 3: Recommended Pools Matching Preferences */}
      {recommendedCampaigns.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Recommended Buying Pools In Your Hub</span>
              </h2>
              <p className="text-xs text-slate-400">
                Active group buy pools with strong volume and verified dealer quotations available.
              </p>
            </div>
            <Link
              href="/campaigns"
              className="text-xs text-amber-300 hover:text-amber-200 font-semibold flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendedCampaigns.map((camp) => (
              <div
                key={camp.id}
                className="glass-panel p-4 rounded-2xl border border-white/[0.08] hover:border-amber-300/30 transition-all space-y-3 bg-[#0c1017]/70 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/10">
                      {camp.city}
                    </span>
                    <span className="text-emerald-400 font-semibold">
                      {camp.currentBuyers}/{camp.targetBuyers} Buyers
                    </span>
                  </div>

                  <h3 className="font-bold text-white text-sm">
                    {camp.brand} {camp.model}
                  </h3>
                  <p className="text-[11px] text-slate-400 truncate">{camp.variant}</p>
                </div>

                <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-300">
                    ~{formatINR(camp.tiers[0].discountTarget)} target
                  </span>
                  <Link
                    href={`/campaigns/${camp.id}`}
                    className="text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1"
                  >
                    <span>View Deal</span>
                    <ChevronRight className="w-3.5 h-3.5 text-amber-300" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Find My Group Modal */}
      <FindGroupModal
        isOpen={findGroupModalOpen}
        onClose={() => setFindGroupModalOpen(false)}
      />
    </div>
  );
}
