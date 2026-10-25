'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import OfferSubmissionForm from '@/components/dealer/OfferSubmissionForm';
import { formatCrores, formatINR, calculateNetEffectivePrice } from '@/lib/calculations';
import { DealershipOffer, DealershipAccount } from '@/lib/types';
import {
  Building2,
  Users,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  Tag,
  Clock,
  AlertTriangle,
  Edit3,
  Lock,
  PlusCircle,
  FileText,
  X,
  ExternalLink,
  MapPin,
  Check,
  ShoppingBag,
  Award,
  ChevronRight,
  Filter,
  DollarSign,
  Info,
  ArrowRight,
} from 'lucide-react';

export default function DealerPortalPage() {
  const { user, isDealer, switchPersona } = useAuthStore();
  const {
    campaigns,
    offers,
    dealers,
    bookings,
    registerDealership,
    markCarPurchased,
  } = useCampaignStore();

  const [activeTab, setActiveTab] = useState<'my_offers' | 'bookings' | 'browse_pools' | 'create_offer' | 'register_dealer'>('my_offers');
  const [offerStatusFilter, setOfferStatusFilter] = useState<'all' | 'approved' | 'pending_review' | 'needs_correction' | 'rejected'>('all');
  const [editingOffer, setEditingOffer] = useState<DealershipOffer | null>(null);
  const [preselectedCampaignId, setPreselectedCampaignId] = useState<string | undefined>(undefined);
  const [rbacAlert, setRbacAlert] = useState<string | null>(null);

  // New dealer registration form state
  const [newDealerName, setNewDealerName] = useState('');
  const [newDealerBrand, setNewDealerBrand] = useState('Hyundai');
  const [newDealerCity, setNewDealerCity] = useState<'Hyderabad' | 'Bengaluru' | 'Mumbai' | 'Delhi-NCR'>('Hyderabad');
  const [newDealerAddress, setNewDealerAddress] = useState('');
  const [newDealerEmail, setNewDealerEmail] = useState('');
  const [newDealerPhone, setNewDealerPhone] = useState('');
  const [newDealerManager, setNewDealerManager] = useState('');
  const [newDealerDocRef, setNewDealerDocRef] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const currentDealerId = user?.dealershipId || 'dealer-a-kun';
  const currentDealer = dealers.find((d) => d.id === currentDealerId);
  const isVerified = currentDealer?.verificationStatus === 'verified';

  const myOffers = offers.filter((o) => o.dealerId === currentDealerId);
  const otherOffers = offers.filter((o) => o.dealerId !== currentDealerId);

  const filteredMyOffers = myOffers.filter((o) => {
    if (offerStatusFilter === 'all') return true;
    return o.status === offerStatusFilter;
  });

  // Bookings placed by buyers on this dealership's offers
  const myDealershipBookings = bookings.filter((b) => b.dealerId === currentDealerId);
  const confirmedBookingsCount = myDealershipBookings.filter((b) => b.status === 'booking_confirmed').length;
  const interestedBookingsCount = myDealershipBookings.filter((b) => b.status === 'interested').length;

  const totalBuyers = campaigns.reduce((acc, c) => acc + c.currentBuyers, 0);
  const totalVolume = campaigns.reduce(
    (acc, c) => acc + c.currentBuyers * c.estimatedOnRoadPrice,
    0
  );

  const handleEditAttempt = (offer: DealershipOffer) => {
    if (offer.dealerId !== currentDealerId) {
      setRbacAlert(
        `Security Boundary Enforced: You are logged in as "${user?.dealershipName || user?.fullName}". You are strictly prohibited from modifying bids submitted by rival showroom "${offer.dealershipName}".`
      );
      return;
    }
    setRbacAlert(null);
    setEditingOffer(offer);
  };

  const handleRegisterDealerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerDealership({
        name: newDealerName,
        brand: newDealerBrand,
        city: newDealerCity,
        showroomAddress: newDealerAddress,
        email: newDealerEmail,
        phone: newDealerPhone,
        managerName: newDealerManager,
        verificationDocRef: newDealerDocRef || 'GSTIN: 36AAACG1234F1Z9',
        branches: [
          {
            id: `branch-${Date.now()}`,
            name: `${newDealerName} Main Showroom`,
            address: newDealerAddress,
            city: newDealerCity,
            contactPerson: newDealerManager,
            phone: newDealerPhone,
          },
        ],
      });

      setRegisterSuccess(true);
      setTimeout(() => {
        setRegisterSuccess(false);
        setActiveTab('my_offers');
      }, 2500);
    } catch (e: any) {
      alert(e?.message || 'Error registering dealership.');
    }
  };

  const handleMarkPurchased = async (bookingId: string) => {
    if (confirm('Confirm vehicle delivery and invoice completion for this buyer?')) {
      try {
        await markCarPurchased(bookingId, user);
        alert('Car purchase and physical delivery recorded successfully!');
      } catch (e: any) {
        alert(e?.message || 'Error updating status.');
      }
    }
  };

  return (
    <div className="site-container py-10 space-y-10">
      {/* Persona Switcher / Role Notice for Hackathon Evaluation */}
      {!isDealer ? (
        <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider font-mono">
                Viewing Portal as {user?.role.toUpperCase()}
              </div>
              <p className="text-xs text-slate-300">
                To test dealership quotation submission and RBAC isolation, switch to an authorized showroom account:
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => switchPersona('dealer-a')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-300 text-slate-950 hover:bg-amber-200 transition-colors shadow-sm"
            >
              Dealer A (KUN United)
            </button>
            <button
              onClick={() => switchPersona('dealer-b')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-white/10 text-white hover:bg-white/20 border border-white/10 transition-colors"
            >
              Dealer B (Talwar)
            </button>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-[#0c1017]/80 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Building2 className="w-4 h-4 text-amber-300" />
            <span>
              Authorized Showroom: <strong className="text-white">{currentDealer?.name || user?.dealershipName}</strong> (ID: {currentDealerId})
            </span>
            <span
              className={`badge-pill text-[10px] font-bold font-mono ${
                isVerified
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
              }`}
            >
              {isVerified ? 'VERIFIED DEALERSHIP' : 'PENDING ACCREDITATION'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Switch Showroom to test RBAC isolation:</span>
            <button
              onClick={() => switchPersona(user?.dealershipId === 'dealer-a-kun' ? 'dealer-b' : 'dealer-a')}
              className="text-[11px] font-bold text-amber-300 underline hover:text-amber-200"
            >
              Switch to {user?.dealershipId === 'dealer-a-kun' ? 'Dealer B (Talwar Hyundai)' : 'Dealer A (KUN Hyundai)'}
            </button>
          </div>
        </div>
      )}

      {/* Verification Notice Warning if not verified */}
      {isDealer && !isVerified && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">
              Dealership Accreditation Pending Verification:
            </span>
            <p className="text-slate-300 leading-relaxed text-xs">
              Your showroom account is currently <strong>Pending Verification</strong> by Platform Staff. You can configure branches and prepare draft quotations, but bids will be published live to buyers only once your business registration documents are verified.
            </p>
          </div>
        </div>
      )}

      {/* Executive Header & HUD */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/[0.08] p-6 sm:p-8 bg-gradient-to-br from-[#0c1017]/90 via-[#07090e]/95 to-black">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                <Building2 className="w-3.5 h-3.5 mr-1.5" />
                Dealership Partner Terminal
              </span>
              <span className="badge-pill bg-white/[0.05] text-slate-300 border border-white/10 text-xs font-mono">
                <MapPin className="w-3 h-3 mr-1 text-slate-400" />
                {currentDealer?.city || user?.city || 'Hyderabad'} Hub
              </span>
              <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                Zero Cost Bulk Acquisition
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Compete for <span className="text-gradient-champagne">Bulk Buyer Clusters</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Access verified customer demand grouped in your city. Offer a consolidated fleet discount and win the entire batch without traditional showroom acquisition costs.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setPreselectedCampaignId(undefined);
                setActiveTab('create_offer');
              }}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-lg shadow-amber-300/10 transition-all flex items-center gap-2 transform hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Submit New Bid</span>
            </button>

            <button
              onClick={() => setActiveTab('browse_pools')}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center gap-2"
            >
              <span>Explore Demand Pools</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* 4 HUD Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/[0.08]">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Ready Buyer Demand</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalBuyers} Ready Buyers
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              Across {campaigns.length} regional buyer pools
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>My Submitted Bids</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {myOffers.length} Quotations
            </div>
            <div className="text-[10px] text-slate-400">
              {myOffers.filter((o) => o.status === 'approved').length} Live to public buyers
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirmed Bookings</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {confirmedBookingsCount} Confirmed
            </div>
            <div className="text-[10px] text-slate-400">
              Ready for showroom delivery
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Showroom Network</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {currentDealer?.branches.length || 1} Branches
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {currentDealer?.city || 'Hyderabad'} Hub
            </div>
          </div>
        </div>
      </div>

      {/* RBAC Violation Alert */}
      {rbacAlert && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-rose-300">RBAC Security Violation Blocked:</span>
              <p className="text-slate-300 leading-relaxed">{rbacAlert}</p>
            </div>
          </div>
          <button
            onClick={() => setRbacAlert(null)}
            className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_offers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'my_offers'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>My Dealership Bids ({myOffers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'bookings'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Buyer Bookings ({myDealershipBookings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('browse_pools')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'browse_pools'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Eligible Demand Pools ({campaigns.length})</span>
        </button>

        <button
          onClick={() => {
            setPreselectedCampaignId(undefined);
            setActiveTab('create_offer');
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'create_offer'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Submit New Proposal</span>
        </button>

        <button
          onClick={() => setActiveTab('register_dealer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'register_dealer'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Register New Showroom</span>
        </button>
      </div>

      {/* Tab 1: My Offers & Status */}
      {activeTab === 'my_offers' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                Bids Managed by {currentDealer?.name || user?.dealershipName || 'My Dealership'}
              </h3>
              <p className="text-xs text-slate-400">
                You can create and edit only offers belonging to your dealership showroom account.
              </p>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
              <button
                onClick={() => setOfferStatusFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  offerStatusFilter === 'all'
                    ? 'bg-amber-400/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({myOffers.length})
              </button>
              <button
                onClick={() => setOfferStatusFilter('approved')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  offerStatusFilter === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live ({myOffers.filter((o) => o.status === 'approved').length})
              </button>
              <button
                onClick={() => setOfferStatusFilter('pending_review')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  offerStatusFilter === 'pending_review'
                    ? 'bg-amber-400/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending ({myOffers.filter((o) => o.status === 'pending_review').length})
              </button>
              <button
                onClick={() => setOfferStatusFilter('needs_correction')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  offerStatusFilter === 'needs_correction'
                    ? 'bg-orange-500/20 text-orange-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Correction ({myOffers.filter((o) => o.status === 'needs_correction').length})
              </button>
            </div>
          </div>

          {filteredMyOffers.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] text-center space-y-3 bg-[#0c1017]/60">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 mx-auto flex items-center justify-center text-slate-400">
                <FileText className="w-6 h-6 text-amber-300" />
              </div>
              <p className="text-xs text-slate-400">
                No quotations found matching the selected status filter.
              </p>
              <button
                onClick={() => setActiveTab('create_offer')}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-sm"
              >
                Submit Proposal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredMyOffers.map((offer) => {
                const camp = campaigns.find((c) => c.id === offer.campaignId);
                const finalPrice = camp
                  ? calculateNetEffectivePrice(camp.estimatedOnRoadPrice, offer)
                  : 0;

                return (
                  <div
                    key={offer.id}
                    className="glass-panel p-6 rounded-2xl border border-white/[0.08] hover:border-amber-300/30 transition-all space-y-5 bg-[#0c1017]/80 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Status Header */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider">
                          {camp ? `${camp.brand} ${camp.model}` : 'Campaign Pool'}
                        </span>
                        {offer.status === 'approved' && (
                          <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Approved • Live to Buyers (v{offer.version})
                          </span>
                        )}
                        {offer.status === 'pending_review' && (
                          <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending Review (v{offer.version})
                          </span>
                        )}
                        {offer.status === 'needs_correction' && (
                          <span className="badge-pill bg-orange-500/10 text-orange-300 border border-orange-500/20 text-xs font-mono">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Correction Requested (v{offer.version})
                          </span>
                        )}
                        {offer.status === 'rejected' && (
                          <span className="badge-pill bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono">
                            Rejected
                          </span>
                        )}
                      </div>

                      {/* Branch & Confirmation info */}
                      <div className="text-xs text-slate-400 flex items-center justify-between">
                        <span>Showroom: <strong className="text-white">{offer.branchName || 'Main Showroom'}</strong></span>
                        <span className="text-[11px] text-amber-300 font-mono">
                          Min Quota: {offer.confirmedBookingsCount || 0}/{offer.minConfirmedBookings || 3}
                        </span>
                      </div>

                      {/* Pricing Summary */}
                      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans uppercase">Pure Cash Discount</div>
                          <div className="text-base font-bold text-emerald-400 mt-0.5">
                            {formatINR(offer.cashDiscount)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-sans uppercase">Calculated Invoiced Price</div>
                          <div className="text-base font-bold text-white mt-0.5">
                            {formatINR(finalPrice)}
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-1 text-xs text-slate-400">
                        <div>
                          <strong className="text-slate-300">Delivery:</strong> {offer.deliveryTimelineWeeks} week(s) committed
                        </div>
                        <div>
                          <strong className="text-slate-300">Warranty:</strong> {offer.warrantyDetails || 'Standard OEM'}
                        </div>
                        <div>
                          <strong className="text-slate-300">Accessories:</strong> {offer.accessoryDetails || 'Standard'} ({formatINR(offer.claimedAccessoryValue)}) {offer.mandatoryAccessories ? '(Mandatory)' : '(Optional)'}
                        </div>
                      </div>

                      {/* Admin Notes if returned */}
                      {offer.adminReviewNotes && (
                        <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-500/30 text-xs text-orange-200">
                          <strong className="block text-[11px] font-bold text-orange-300 mb-0.5">
                            Platform Review Feedback:
                          </strong>
                          {offer.adminReviewNotes}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        ID: {offer.id.slice(0, 16)}...
                      </span>
                      <button
                        onClick={() => handleEditAttempt(offer)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Edit Quotation</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* RBAC Isolation Demonstration */}
          <div className="pt-6 border-t border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">
                RBAC Security Test: Rival Dealerships&apos; Quotations
              </h4>
            </div>
            <p className="text-xs text-slate-400">
              Dealership accounts are isolated. You cannot edit bids submitted by rival showrooms. Click below to verify the security boundary:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {otherOffers.slice(0, 2).map((other) => (
                <div
                  key={other.id}
                  className="glass-panel p-4 rounded-xl border border-white/5 opacity-80 flex items-center justify-between gap-3 text-xs bg-[#0c1017]/60"
                >
                  <div>
                    <div className="font-bold text-white">{other.dealershipName}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Cash Cut: {formatINR(other.cashDiscount)} • Dealer ID: {other.dealerId}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEditAttempt(other)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.04] hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-white/10 flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Attempt Edit (Test RBAC)</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Buyer Bookings & Pipeline */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                Buyer Intent & Booking Pipeline
              </h3>
              <p className="text-xs text-slate-400">
                Customers who have selected or confirmed booking intent on your dealership quotations.
              </p>
            </div>
            <span className="badge-pill bg-white/[0.06] text-amber-300 border border-white/10 text-xs font-mono">
              {myDealershipBookings.length} Total Buyers
            </span>
          </div>

          {myDealershipBookings.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] text-center text-xs text-slate-400 bg-[#0c1017]/60">
              No buyer bookings registered on your quotations yet.
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0c1017]/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400 font-mono font-semibold border-b border-white/[0.08]">
                    <tr>
                      <th className="p-3.5">Customer Name</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Showroom Branch</th>
                      <th className="p-3.5">Quoted On-Road</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {myDealershipBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-3.5 font-bold text-white font-sans">{b.buyerName}</td>
                        <td className="p-3.5 text-slate-400">{b.buyerPhone}</td>
                        <td className="p-3.5 text-slate-300">{b.branchName || 'Main Showroom'}</td>
                        <td className="p-3.5 text-emerald-400 font-bold">{formatINR(b.quotedOnRoadPrice || b.offeredPrice || 0)}</td>
                        <td className="p-3.5">
                          <span
                            className={`badge-pill text-[10px] font-bold font-mono ${
                              b.status === 'booking_confirmed'
                                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                : b.status === 'purchased'
                                ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20'
                                : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                            }`}
                          >
                            {b.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-sans">
                          {b.status === 'booking_confirmed' && (
                            <button
                              onClick={() => handleMarkPurchased(b.id)}
                              className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 hover:from-emerald-300 hover:to-emerald-400 transition-colors shadow-sm"
                            >
                              Confirm Delivery
                            </button>
                          )}
                          {b.status === 'purchased' && (
                            <span className="text-xs text-cyan-300 font-semibold">Delivered ✓</span>
                          )}
                          {b.status === 'interested' && (
                            <span className="text-xs text-slate-400">Awaiting Advance</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Browse Eligible Demand Pools */}
      {activeTab === 'browse_pools' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">
              Active Demand Pools Open for Quotation
            </h3>
            <p className="text-xs text-slate-400">
              Demand clusters in {currentDealer?.city || 'Hyderabad'}. Submit your bulk quotation to secure the entire batch.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="glass-panel p-5 rounded-2xl border border-white/[0.08] hover:border-amber-300/30 transition-all space-y-4 flex flex-col justify-between bg-[#0c1017]/80"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/10">
                      {camp.city} Batch
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {camp.currentBuyers}/{camp.targetBuyers} Buyers
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white">
                      {camp.brand} {camp.model}
                    </h4>
                    <p className="text-xs text-slate-400">{camp.variant}</p>
                  </div>

                  <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-1 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Ready Buyers:</span>
                      <span className="font-bold text-white">{camp.currentBuyers} / {camp.targetBuyers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Total Batch Value:</span>
                      <span className="font-bold text-emerald-400">
                        {formatCrores(camp.currentBuyers * camp.estimatedOnRoadPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPreselectedCampaignId(camp.id);
                    setActiveTab('create_offer');
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 transition-all shadow-sm"
                >
                  Submit Proposal for this Batch
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Submit New Offer */}
      {activeTab === 'create_offer' && (
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-white">
              Submit Structured Dealership Quotation
            </h3>
            <p className="text-xs text-slate-400">
              Provide your direct cash discount, accessory items, delivery commitment, and minimum confirmed bookings. All submitted bids are reviewed by the Platform Offer Manager before being published to buyers.
            </p>
          </div>

          <OfferSubmissionForm
            campaigns={campaigns}
            initialCampaignId={preselectedCampaignId}
            onSuccess={() => setActiveTab('my_offers')}
          />
        </div>
      )}

      {/* Tab 5: Register New Showroom / Dealership Account */}
      {activeTab === 'register_dealer' && (
        <form onSubmit={handleRegisterDealerSubmit} className="space-y-6 max-w-2xl glass-panel p-6 sm:p-8 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80">
          <div>
            <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
              <Building2 className="w-3.5 h-3.5 mr-1" />
              New Showroom Partner
            </span>
            <h3 className="text-xl font-bold text-white mt-2">
              Register Dealership Showroom Account
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Enter your dealership business credentials. New registrations start as Pending Verification and are inspected by Verification Staff.
            </p>
          </div>

          {registerSuccess && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Dealership registered successfully! Your account is currently Pending Verification.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Dealership Business Name *</label>
              <input
                type="text"
                required
                value={newDealerName}
                onChange={(e) => setNewDealerName(e.target.value)}
                placeholder="e.g. Varun Motors Arena"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Manufacturer Brand *</label>
              <select
                value={newDealerBrand}
                onChange={(e) => setNewDealerBrand(e.target.value)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              >
                <option value="Hyundai">Hyundai</option>
                <option value="Tata">Tata Motors</option>
                <option value="Maruti Suzuki">Maruti Suzuki</option>
                <option value="Mahindra">Mahindra</option>
                <option value="Kia">Kia</option>
                <option value="Toyota">Toyota</option>
                <option value="Volkswagen">Volkswagen</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-slate-300 font-medium">Showroom Address *</label>
              <input
                type="text"
                required
                value={newDealerAddress}
                onChange={(e) => setNewDealerAddress(e.target.value)}
                placeholder="e.g. Plot No 42, Hitech City Main Road, Hyderabad"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">City Hub *</label>
              <select
                value={newDealerCity}
                onChange={(e) => setNewDealerCity(e.target.value as any)}
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              >
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi-NCR">Delhi-NCR</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Authorized Manager *</label>
              <input
                type="text"
                required
                value={newDealerManager}
                onChange={(e) => setNewDealerManager(e.target.value)}
                placeholder="e.g. Vikramaditya (Fleet GM)"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Business Email *</label>
              <input
                type="email"
                required
                value={newDealerEmail}
                onChange={(e) => setNewDealerEmail(e.target.value)}
                placeholder="fleet@dealership.com"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 font-medium">Business Phone *</label>
              <input
                type="tel"
                required
                value={newDealerPhone}
                onChange={(e) => setNewDealerPhone(e.target.value)}
                placeholder="+91 98499 XXXXX"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-slate-300 font-medium">GSTIN / Franchise Proof Document Reference *</label>
              <input
                type="text"
                required
                value={newDealerDocRef}
                onChange={(e) => setNewDealerDocRef(e.target.value)}
                placeholder="e.g. GSTIN: 36AABCS4412B1ZX • OEM Authorized Dealer Certificate Ref"
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-md transition-all"
          >
            Submit Dealership Registration for Verification
          </button>
        </form>
      )}

      {/* Edit Offer Modal */}
      {editingOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-3xl glass-panel rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh] overflow-y-auto bg-[#080c14]/95">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] mb-6">
              <div>
                <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit Quotation #{editingOffer.id.slice(0, 8)}
                </span>
                <h3 className="text-xl font-bold text-white mt-1">
                  Modify Terms for {editingOffer.dealershipName}
                </h3>
              </div>
              <button
                onClick={() => setEditingOffer(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <OfferSubmissionForm
              campaigns={campaigns}
              initialOffer={editingOffer}
              isEdit={true}
              onCancel={() => setEditingOffer(null)}
              onSuccess={() => setEditingOffer(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
