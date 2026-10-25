'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useCampaignStore } from '@/lib/campaign-store';
import { formatCrores, formatINR, calculateNetEffectivePrice } from '@/lib/calculations';
import { DealershipOffer, DealershipAccount, OfferStatus, CampaignStatus, BuyerBooking } from '@/lib/types';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Clock,
  Building2,
  Users,
  Car,
  FileText,
  TrendingUp,
  Search,
  Filter,
  Check,
  X,
  MessageSquare,
  Lock,
  ArrowRight,
  Sparkles,
  UserCheck,
  UserX,
  Award,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
  Eye,
  RefreshCw,
  Layers,
  KeyRound,
  FileCheck,
  Info,
  DollarSign,
  Tag,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const {
    user,
    isVerificationStaff,
    isOfferManager,
    isSuperAdmin,
    hasStaffPrivileges,
    switchPersona,
  } = useAuthStore();

  const {
    campaigns,
    dealers,
    offers,
    bookings,
    members,
    auditLogs,
    reviewDealerOffer,
    verifyDealership,
    closeOrCompleteCampaign,
    markCarPurchased,
    resetToDemoDefaults,
  } = useCampaignStore();

  // Active tab state: defaults to review_queue for offer_manager, dealerships for verification_staff
  const defaultTab = isVerificationStaff && !isSuperAdmin ? 'dealerships' : 'review_queue';
  const [activeTab, setActiveTab] = useState<
    'review_queue' | 'dealerships' | 'campaigns' | 'bookings' | 'buyers' | 'audit_trail' | 'staff_access'
  >(defaultTab);

  // Offer Action Modal
  const [selectedOfferForAction, setSelectedOfferForAction] = useState<{
    offer: DealershipOffer;
    action: 'approved' | 'rejected' | 'needs_correction';
  } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Dealership Action Modal
  const [selectedDealerForAction, setSelectedDealerForAction] = useState<{
    dealer: DealershipAccount;
    decision: 'verified' | 'rejected' | 'suspended';
  } | null>(null);
  const [dealerNotes, setDealerNotes] = useState('');

  // Status Filter for offers
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'correction' | 'rejected'>('all');

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // If not authorized staff or super admin, show RBAC Access Denied guard
  if (!hasStaffPrivileges) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/20 shadow-xl shadow-rose-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <span className="badge-pill bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-mono">
            403 Forbidden • Governance Clearance Required
          </span>
          <h1 className="text-3xl font-extrabold text-white">
            Staff Access Control Enforced
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            This dashboard contains privileged governance tools: accrediting dealerships, reviewing quotations, managing group capacities, and inspecting buyer bookings. Your active persona is <strong className="text-white uppercase font-mono">[{user?.role || 'Guest'}]</strong>.
          </p>
        </div>

        {/* Demo Persona Switcher */}
        <div className="glass-panel p-6 rounded-2xl border border-white/[0.08] max-w-md mx-auto space-y-3 text-left bg-[#0c1017]/90">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Lock className="w-3.5 h-3.5 text-amber-300" />
            <span>Test with Authorized Staff Personas</span>
          </div>
          <p className="text-xs text-slate-400">
            Switch your active session to one of the authorized governance roles to test role-separated administration:
          </p>
          <div className="space-y-2 pt-1">
            <button
              onClick={() => switchPersona('verification-staff')}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-300" />
                <span>Verification Staff (Ananya Sen)</span>
              </div>
              <span className="text-[10px] text-amber-300/80 font-mono">Accredit Dealers</span>
            </button>

            <button
              onClick={() => switchPersona('offer-manager')}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Offer Manager (Vikram Malhotra)</span>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono">Review Quotations</span>
            </button>

            <button
              onClick={() => switchPersona('super-admin')}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 transition-all flex items-center justify-between shadow-md"
            >
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-950" />
                <span>Super Administrator</span>
              </div>
              <span className="text-[10px] text-slate-950 font-mono font-bold">Full Authority</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Offer Metrics
  const pendingCount = offers.filter((o) => o.status === 'pending_review').length;
  const correctionCount = offers.filter((o) => o.status === 'needs_correction').length;
  const approvedCount = offers.filter((o) => o.status === 'approved').length;
  const rejectedCount = offers.filter((o) => o.status === 'rejected').length;

  // Dealership Metrics
  const verifiedDealersCount = dealers.filter((d) => d.verificationStatus === 'verified').length;
  const pendingDealersCount = dealers.filter((d) => d.verificationStatus === 'pending').length;

  // Bookings Metrics
  const confirmedBookingsCount = bookings.filter((b) => b.status === 'confirmed_intent' || b.status === 'booking_confirmed').length;
  const deliveredCarsCount = bookings.filter((b) => b.status === 'purchased').length;

  // Aggregate Pipeline
  const totalBuyers = campaigns.reduce((acc, c) => acc + c.currentBuyers, 0);
  const totalVolume = campaigns.reduce(
    (acc, c) => acc + c.currentBuyers * c.estimatedOnRoadPrice,
    0
  );

  // Filter offers
  const filteredOffers = offers.filter((o) => {
    if (statusFilter === 'pending') return o.status === 'pending_review';
    if (statusFilter === 'approved') return o.status === 'approved';
    if (statusFilter === 'correction') return o.status === 'needs_correction';
    if (statusFilter === 'rejected') return o.status === 'rejected';
    return true;
  });

  // Handle Offer Review Action
  const handleConfirmReview = async () => {
    if (!selectedOfferForAction) return;
    try {
      await reviewDealerOffer(
        selectedOfferForAction.offer.id,
        selectedOfferForAction.action,
        reviewNotes,
        user
      );
      setSelectedOfferForAction(null);
      setReviewNotes('');
    } catch (e: any) {
      alert(e?.message || 'Error processing review action');
    }
  };

  // Handle Dealer Verification Action
  const handleConfirmDealerVerification = async () => {
    if (!selectedDealerForAction) return;
    try {
      await verifyDealership(
        selectedDealerForAction.dealer.id,
        selectedDealerForAction.decision,
        dealerNotes,
        user
      );
      setSelectedDealerForAction(null);
      setDealerNotes('');
    } catch (e: any) {
      alert(e?.message || 'Error updating dealership verification status');
    }
  };

  // Close or Complete Campaign
  const handleCampaignStatusChange = async (
    campaignId: string,
    newStatus: 'completed' | 'closed'
  ) => {
    if (!confirm(`Are you sure you want to mark this group as ${newStatus.toUpperCase()}? New buyer registrations will stop.`)) {
      return;
    }
    try {
      await closeOrCompleteCampaign(campaignId, newStatus, user);
    } catch (e: any) {
      alert(e?.message || 'Error modifying campaign status');
    }
  };

  // Mark Booking as Delivered & Purchased
  const handleMarkPurchased = async (booking: BuyerBooking) => {
    const defaultPrice = (booking.offeredPrice || booking.quotedOnRoadPrice || 0).toString();
    const input = prompt(`Confirm vehicle delivery & invoice completion for ${booking.buyerName}:`, defaultPrice);
    if (!input) return;
    try {
      await markCarPurchased(booking.id, user);
      alert('Vehicle purchase recorded successfully!');
    } catch (e: any) {
      alert(e?.message || 'Error finalizing purchase record');
    }
  };

  return (
    <div className="site-container py-10 space-y-10">
      {/* Demo Environment Notice (Requirement: Clearly identify demo data) */}
      <div className="p-3 rounded-xl bg-amber-400/5 border border-amber-400/20 text-xs text-slate-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <strong className="text-amber-200">Governance Sandbox & Demo Environment:</strong> All dealership bids, buyer groups, and booking statistics reflect current seed state and real platform store methods.
          </span>
        </div>
        <button
          onClick={() => {
            if (confirm('Reset demo state back to default seed?')) {
              resetToDemoDefaults();
              alert('Reset complete.');
            }
          }}
          className="text-[11px] text-amber-300 hover:text-amber-200 font-mono underline shrink-0"
        >
          Reset Demo Seed
        </button>
      </div>

      {/* Executive Header with Role Clearance Badge */}
      <div className="relative overflow-hidden rounded-3xl glass-panel border border-white/[0.08] p-6 sm:p-8 bg-gradient-to-br from-[#0c1017]/90 via-[#07090e]/95 to-black">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                {isSuperAdmin && <KeyRound className="w-3.5 h-3.5 mr-1.5 text-amber-300" />}
                {isVerificationStaff && <FileCheck className="w-3.5 h-3.5 mr-1.5 text-amber-300" />}
                {isOfferManager && !isSuperAdmin && <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />}
                {isSuperAdmin
                  ? 'Super Admin Terminal'
                  : isVerificationStaff
                  ? 'Verification Staff Terminal'
                  : 'Offer Manager Terminal'}
              </span>
              <span className="badge-pill bg-white/[0.05] text-slate-300 border border-white/10 text-xs font-mono">
                Role Governance Enforcement
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Platform Operations & <span className="text-gradient-champagne">Governance Board</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              {isVerificationStaff && !isSuperAdmin
                ? 'Accredit franchise dealerships, inspect GSTIN and showroom credentials, and maintain dealer integrity.'
                : isOfferManager && !isSuperAdmin
                ? 'Moderate dealership quotations, verify cash discount transparency against OEM pricing, and publish live offers.'
                : 'Complete platform oversight: dealer accreditation, quotation review, campaign capacities, and buyer booking pipeline.'}
            </p>
          </div>

          {/* Current Operator Card */}
          <div className="glass-panel p-4 rounded-2xl border border-white/[0.08] flex items-center gap-3.5 bg-slate-900/60">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-300 border border-amber-400/20 flex items-center justify-center shrink-0">
              {isSuperAdmin ? (
                <KeyRound className="w-5 h-5" />
              ) : isVerificationStaff ? (
                <FileCheck className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-semibold">
                {user.staffTitle || user.role.replace('_', ' ')}
              </div>
              <div className="text-xs font-bold text-white font-mono">
                {user.fullName}
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {user.email}
              </div>
            </div>
          </div>
        </div>

        {/* 6 Real-Data Overview Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/[0.08]">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Bids</span>
            </div>
            <div className="text-2xl font-black text-amber-300 font-mono">
              {pendingCount}
            </div>
            <div className="text-[10px] text-slate-400">Offer Review Queue</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Live Offers</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {approvedCount}
            </div>
            <div className="text-[10px] text-slate-400">Published to Buyers</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-300 font-mono tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Dealerships</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {verifiedDealersCount} <span className="text-xs text-slate-500 font-normal">/ {dealers.length}</span>
            </div>
            <div className="text-[10px] text-slate-400">{pendingDealersCount} Pending KYC</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-300 font-mono tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-amber-300" />
              <span>Group Demand</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {totalBuyers}
            </div>
            <div className="text-[10px] text-slate-400">{campaigns.length} Active Pools</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-emerald-400 font-mono tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bookings</span>
            </div>
            <div className="text-2xl font-black text-white font-mono">
              {confirmedBookingsCount}
            </div>
            <div className="text-[10px] text-slate-400">{deliveredCarsCount} Delivered</div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-300" />
              <span>Batch Value</span>
            </div>
            <div className="text-xl font-black text-white font-mono truncate">
              {formatCrores(totalVolume)}
            </div>
            <div className="text-[10px] text-slate-400 truncate">Total Group Volume</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-4 overflow-x-auto">
        {/* Tab 1: Offer Review Queue */}
        <button
          onClick={() => setActiveTab('review_queue')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'review_queue'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Quotation Review Queue ({pendingCount})</span>
        </button>

        {/* Tab 2: Dealership Accreditation */}
        <button
          onClick={() => setActiveTab('dealerships')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'dealerships'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Dealership Accreditation ({dealers.length})</span>
          {pendingDealersCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          )}
        </button>

        {/* Tab 3: Campaign Governance */}
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'campaigns'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Group Pools & Capacities ({campaigns.length})</span>
        </button>

        {/* Tab 4: Bookings Pipeline */}
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'bookings'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Showroom Bookings ({bookings.length})</span>
        </button>

        {/* Tab 5: Registered Buyers */}
        <button
          onClick={() => setActiveTab('buyers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'buyers'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Group Members ({members.length})</span>
        </button>

        {/* Tab 6: Staff Directory & Access Rules (Super Admin Only) */}
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('staff_access')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'staff_access'
                ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Staff Roles & RBAC Matrix</span>
          </button>
        )}

        {/* Tab 7: Audit Logs */}
        <button
          onClick={() => setActiveTab('audit_trail')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'audit_trail'
              ? 'bg-amber-400/10 text-amber-300 border border-amber-400/30'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.03]'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Trail ({auditLogs.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OFFER REVIEW QUEUE (Offer Manager & Super Admin) */}
      {/* ========================================================= */}
      {activeTab === 'review_queue' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Sub Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.02] p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-amber-400/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                All ({offers.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'pending'
                    ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pending Review ({pendingCount})
              </button>
              <button
                onClick={() => setStatusFilter('correction')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'correction'
                    ? 'bg-orange-500/20 text-orange-300 font-bold border border-orange-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Needs Correction ({correctionCount})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Approved & Live ({approvedCount})
              </button>
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Visibility Rule: Only verified dealerships can have quotations published live to public buyers.
            </div>
          </div>

          {/* Offers List */}
          <div className="space-y-4">
            {filteredOffers.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl border border-white/[0.08] text-center space-y-2 bg-[#0c1017]/60">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <div className="text-sm font-semibold text-white">No quotations found in this filter</div>
                <div className="text-xs text-slate-400">Select another filter above or wait for dealers to submit bids.</div>
              </div>
            ) : (
              filteredOffers.map((offer) => {
                const camp = campaigns.find((c) => c.id === offer.campaignId);
                const owningDealer = dealers.find((d) => d.id === offer.dealerId);
                const finalPrice = camp
                  ? calculateNetEffectivePrice(camp.estimatedOnRoadPrice, offer)
                  : 0;

                const isDealerVerified = owningDealer?.verificationStatus === 'verified';

                // Misleading Perk Detection Warning
                const isHeavyAccessoryInflation =
                  offer.claimedAccessoryValue >= 25000 && offer.cashDiscount <= 25000;

                return (
                  <div
                    key={offer.id}
                    className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-5 hover:border-amber-300/30 transition-all bg-[#0c1017]/80"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider">
                            {camp ? `${camp.brand} ${camp.model} (${camp.city})` : 'Target Pool'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">Quotation v{offer.version}</span>
                          {offer.branchName && (
                            <span className="text-xs text-slate-300 bg-white/[0.03] px-2 py-0.5 rounded border border-white/10 font-mono">
                              📍 {offer.branchName}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <span>{offer.dealershipName}</span>
                          {/* Dealership verification badge */}
                          {isDealerVerified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                              <CheckCircle2 className="w-3 h-3" /> Verified Dealer
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20 font-mono">
                              <AlertTriangle className="w-3 h-3" /> KYC {owningDealer?.verificationStatus.toUpperCase() || 'UNVERIFIED'}
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {offer.dealershipLocation} • Authorized Contact: {offer.dealerContact}
                        </p>
                      </div>

                      {/* Offer Status Badge */}
                      <div>
                        {offer.status === 'approved' && (
                          <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Approved (Live to Buyers)
                          </span>
                        )}
                        {offer.status === 'pending_review' && (
                          <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            Pending Review
                          </span>
                        )}
                        {offer.status === 'needs_correction' && (
                          <span className="badge-pill bg-orange-500/10 text-orange-300 border border-orange-500/20 text-xs font-mono">
                            <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                            Needs Correction
                          </span>
                        )}
                        {offer.status === 'rejected' && (
                          <span className="badge-pill bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono">
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Rejected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unverified Dealer Guard Warning */}
                    {!isDealerVerified && (
                      <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-start gap-2.5 text-xs text-amber-200">
                        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-100">KYC Accreditation Guard:</strong> Dealership &ldquo;{offer.dealershipName}&rdquo; is currently unaccredited. Platform governance rules strictly prevent approving any quotation until Verification Staff completes showroom KYC.
                        </div>
                      </div>
                    )}

                    {/* Misleading Accessory Package Warning */}
                    {isHeavyAccessoryInflation && (
                      <div className="p-3.5 rounded-xl bg-orange-950/30 border border-orange-500/30 flex items-start gap-2.5 text-xs text-orange-200">
                        <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-orange-300">Auditor Warning — Heavy Accessory Inflation:</strong> Dealer offers only {formatINR(offer.cashDiscount)} cash cut but bundles {formatINR(offer.claimedAccessoryValue)} in non-cash accessories. Request clarification before approval.
                        </div>
                      </div>
                    )}

                    {/* Commercial Pricing Matrix: Cash strictly separated from Perks */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-sans">Cash Discount</div>
                        <div className="text-base font-bold text-emerald-400 mt-0.5">
                          {formatINR(offer.cashDiscount)}
                        </div>
                        <div className="text-[9px] text-emerald-500 font-sans">Pure invoice deduction</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-sans">Accessories Claim</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          {formatINR(offer.claimedAccessoryValue)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-sans">
                          {offer.mandatoryAccessories ? '⚠️ Mandatory Pack' : '✓ Optional Pack'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-sans">Surcharges / Handling</div>
                        <div className={`text-base font-bold mt-0.5 ${offer.additionalCharges ? 'text-rose-400' : 'text-slate-400'}`}>
                          {offer.additionalCharges ? formatINR(offer.additionalCharges) : '₹0'}
                        </div>
                        <div className="text-[9px] text-slate-500 font-sans">0 for full transparency</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-sans">Net Invoiced Price</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          {formatINR(finalPrice)}
                        </div>
                        <div className="text-[9px] text-slate-400 font-sans">Direct to dealership</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-sans">Min Quota Required</div>
                        <div className="text-base font-bold text-amber-300 mt-0.5">
                          {offer.minConfirmedBookingsRequired || offer.minConfirmedBookings || 3} Buyers
                        </div>
                        <div className="text-[9px] text-slate-400 font-sans">
                          Current: {offer.confirmedBookingsCount || 0}
                        </div>
                      </div>
                    </div>

                    {/* Commercial Conditions & Supporting Evidence */}
                    <div className="text-xs text-slate-400 space-y-2">
                      <div className="flex flex-wrap gap-2 text-[11px]">
                        <span className="bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-slate-300 font-mono">
                          🚚 Delivery: ~{offer.deliveryTimelineWeeks || 2} weeks
                        </span>
                        <span className="bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-slate-300 font-mono">
                          🛡️ Warranty: {offer.warrantyDetails || offer.warrantyIncluded || 'Standard OEM'}
                        </span>
                        {offer.managerConfirmed && (
                          <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-500/20 font-mono">
                            ✓ Showroom Manager Authorized
                          </span>
                        )}
                      </div>

                      <div>
                        <strong className="text-slate-300">Quotation Terms:</strong> {offer.conditions.join(' • ')}
                      </div>

                      {offer.accessoryDetails && (
                        <div>
                          <strong className="text-slate-300">Accessory Kit Items:</strong> {offer.accessoryDetails}
                        </div>
                      )}

                      {offer.supportingEvidence && (
                        <div>
                          <strong className="text-slate-300">Supporting Sanction Ref:</strong> {offer.supportingEvidence}
                        </div>
                      )}

                      {offer.adminReviewNotes && (
                        <div className="p-3 rounded-xl bg-orange-950/30 border border-orange-500/20 text-orange-300 text-xs">
                          <strong className="text-orange-400 font-semibold block mb-0.5">Previous Platform Review Notes:</strong>
                          {offer.adminReviewNotes}
                        </div>
                      )}
                    </div>

                    {/* Review Actions */}
                    <div className="pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                      <span className="text-[11px] text-slate-500 font-mono">
                        Offer ID: {offer.id.slice(0, 16)}... • Dealership ID: {offer.dealerId}
                      </span>

                      {/* Action buttons (Only for offer_manager or super_admin) */}
                      {isOfferManager || isSuperAdmin ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedOfferForAction({ offer, action: 'needs_correction' });
                              setReviewNotes(offer.adminReviewNotes || '');
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-orange-500/10 text-orange-300 hover:bg-orange-500/20 border border-orange-500/20 transition-colors flex items-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Return for Correction</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedOfferForAction({ offer, action: 'rejected' });
                              setReviewNotes('');
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject Offer</span>
                          </button>

                          <button
                            disabled={!isDealerVerified}
                            onClick={() => {
                              setSelectedOfferForAction({ offer, action: 'approved' });
                              setReviewNotes('Quotation verified against OEM transparency guidelines and group bulk tier.');
                            }}
                            title={!isDealerVerified ? 'Cannot approve: Dealership must be verified first' : 'Publish offer live to buyers'}
                            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                              isDealerVerified
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-slate-950 hover:from-emerald-300 hover:to-emerald-400'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve & Publish Live</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs text-amber-300 font-mono">
                          Review actions require Offer Manager clearance.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DEALERSHIP ACCREDITATION (Verification Staff & Admin) */}
      {/* ========================================================= */}
      {activeTab === 'dealerships' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-300" />
                <span>Dealership Accreditation & KYC Directory</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect GSTIN, franchise dealership licenses, and manager authorization before granting quotation privileges.
              </p>
            </div>
            <div className="text-xs text-amber-300 font-mono">
              {verifiedDealersCount} of {dealers.length} Verified
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dealers.map((dealer) => {
              const isVerified = dealer.verificationStatus === 'verified';
              const isPending = dealer.verificationStatus === 'pending';
              const isSuspended = dealer.verificationStatus === 'suspended';

              return (
                <div
                  key={dealer.id}
                  className="glass-panel p-6 rounded-2xl border border-white/[0.08] space-y-4 hover:border-amber-300/30 transition-all bg-[#0c1017]/80"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider">
                          {(dealer.authorizedBrands || [dealer.brand || 'Hyundai']).join(', ')} Authorized
                        </span>
                        <span className="text-xs text-slate-500 font-mono">ID: {dealer.id}</span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-0.5">
                        {dealer.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {dealer.city} • Head Office: {dealer.address || dealer.showroomAddress}
                      </p>
                    </div>

                    {/* Verification Status Pill */}
                    <div>
                      {isVerified && (
                        <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs font-mono">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified
                        </span>
                      )}
                      {isPending && (
                        <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-xs font-mono">
                          <Clock className="w-3.5 h-3.5 mr-1" /> Pending KYC
                        </span>
                      )}
                      {isSuspended && (
                        <span className="badge-pill bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-mono">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Suspended
                        </span>
                      )}
                      {dealer.verificationStatus === 'rejected' && (
                        <span className="badge-pill bg-slate-800 text-slate-400 border border-slate-700 text-xs font-mono">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
                        </span>
                      )}
                    </div>
                  </div>

                  {/* KYC Data Grid */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">GSTIN Registration:</span>
                      <span className="font-bold text-white">{dealer.gstin || 'GSTIN Provided'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">Dealership Principal:</span>
                      <span className="font-bold text-white">{dealer.managerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">Corporate Email:</span>
                      <span className="font-bold text-amber-300 truncate block">{dealer.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-sans">Direct Hotline:</span>
                      <span className="font-bold text-white">{dealer.phone}</span>
                    </div>
                  </div>

                  {/* Registered Branches */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-slate-400 font-semibold block">Registered Showroom Branches:</span>
                    <div className="flex flex-wrap gap-2">
                      {dealer.branches && dealer.branches.length > 0 ? (
                        dealer.branches.map((b) => (
                          <div
                            key={b.id}
                            className="bg-white/[0.03] px-2.5 py-1 rounded-lg border border-white/5 text-slate-300 text-[11px]"
                          >
                            📍 <strong>{b.name}</strong> ({b.area || b.city})
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-500">Main Showroom Only</span>
                      )}
                    </div>
                  </div>

                  {/* Accreditation History */}
                  <div className="text-xs text-slate-400 space-y-1 border-t border-white/[0.08] pt-3">
                    {dealer.verifiedBy && (
                      <div className="text-[11px]">
                        <strong>Accredited by:</strong> {dealer.verifiedBy} on {new Date(dealer.verifiedAt || '').toLocaleDateString()}
                      </div>
                    )}
                    {dealer.verificationNotes && (
                      <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                        <strong>KYC Notes:</strong> {dealer.verificationNotes}
                      </div>
                    )}
                  </div>

                  {/* Actions for Verification Staff & Super Admin */}
                  {(isVerificationStaff || isSuperAdmin) && (
                    <div className="pt-2 flex flex-wrap items-center justify-end gap-2 border-t border-white/[0.08]">
                      {!isVerified && (
                        <button
                          onClick={() => {
                            setSelectedDealerForAction({ dealer, decision: 'verified' });
                            setDealerNotes('Franchise authorization certificate and GSTIN validated.');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 text-slate-950 hover:from-amber-100 hover:to-amber-300 transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify & Accredit</span>
                        </button>
                      )}

                      {isVerified && (
                        <button
                          onClick={() => {
                            setSelectedDealerForAction({ dealer, decision: 'suspended' });
                            setDealerNotes('Dealership suspended pending compliance check.');
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1.5"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Suspend Showroom</span>
                        </button>
                      )}

                      {isPending && (
                        <button
                          onClick={() => {
                            setSelectedDealerForAction({ dealer, decision: 'rejected' });
                            setDealerNotes('GSTIN or franchise certificate could not be confirmed.');
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject KYC</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CAMPAIGNS & CAPACITIES (Staff & Super Admin) */}
      {/* ========================================================= */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-300" />
                <span>Group Pools, Capacities & Lifecycle Governance</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor live participation, enforce minimum/maximum capacities, and mark groups as completed or closed.
              </p>
            </div>
            <div className="text-xs text-amber-300 font-mono">
              {campaigns.filter((c) => c.status === 'active').length} Active Groups
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {campaigns.map((camp) => {
              const campOffers = offers.filter((o) => o.campaignId === camp.id && o.status === 'approved');
              const campBookings = bookings.filter((b) => b.campaignId === camp.id);
              const confirmedBids = campBookings.filter((b) => b.status === 'confirmed_intent' || b.status === 'booking_confirmed').length;
              const deliveredCount = campBookings.filter((b) => b.status === 'purchased').length;

              const isClosed = camp.status === 'closed';
              const isCompleted = camp.status === 'completed';

              return (
                <div
                  key={camp.id}
                  className="glass-panel p-5 rounded-2xl border border-white/[0.08] hover:border-amber-300/30 transition-all space-y-4 flex flex-col justify-between bg-[#0c1017]/80"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-amber-300 font-mono">
                        {camp.city} Hub
                      </span>
                      <span
                        className={`badge-pill text-[10px] font-bold uppercase font-mono ${
                          camp.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : camp.status === 'completed'
                            ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-lg font-bold text-white">
                        {camp.brand} {camp.model}
                      </h4>
                      <p className="text-xs text-slate-400">{camp.variant}</p>
                    </div>

                    {/* 4 Separate Counters */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">1. Joined Buyers:</span>
                        <span className="font-bold text-white text-sm">
                          {camp.currentBuyers} <span className="text-[10px] text-slate-500 font-sans">/ {camp.targetBuyers}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">2. Live Dealer Bids:</span>
                        <span className="font-bold text-emerald-400 text-sm">
                          {campOffers.length} Bids
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">3. Confirmed Bookings:</span>
                        <span className="font-bold text-amber-300 text-sm">
                          {confirmedBids} Intents
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-sans">4. Delivered Cars:</span>
                        <span className="font-bold text-white text-sm">
                          {deliveredCount} Finalized
                        </span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-400">
                      <strong>Target Quorum:</strong> {camp.targetBuyers} buyers • <strong>Est. Value:</strong> {formatCrores(camp.currentBuyers * camp.estimatedOnRoadPrice)}
                    </div>
                  </div>

                  {/* Lifecycle Controls */}
                  {(isOfferManager || isSuperAdmin) && (
                    <div className="pt-3 border-t border-white/[0.08] space-y-2">
                      <div className="text-[11px] text-slate-400 font-semibold font-mono">Governance Lifecycle Actions:</div>
                      <div className="flex flex-wrap gap-2">
                        {camp.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleCampaignStatusChange(camp.id, 'completed')}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10 transition-all flex items-center gap-1"
                            >
                              <Award className="w-3 h-3 text-amber-300" />
                              <span>Mark Completed</span>
                            </button>
                            <button
                              onClick={() => handleCampaignStatusChange(camp.id, 'closed')}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] border border-white/10 transition-all flex items-center gap-1"
                            >
                              <Lock className="w-3 h-3 text-slate-400" />
                              <span>Close Group</span>
                            </button>
                          </>
                        )}
                        {(isClosed || isCompleted) && (
                          <div className="text-[11px] text-slate-500 italic">
                            This campaign is finalized. Buyer allocation records preserved.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: BOOKINGS PIPELINE */}
      {/* ========================================================= */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-300" />
                <span>Showroom Booking Intents & Finalized Purchases</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Track buyer selections per dealership showroom. Buyers in the same pool can select different dealerships based on quota, location, and timeline.
              </p>
            </div>
            <div className="text-xs text-amber-300 font-mono">
              {bookings.length} Total Registered Intents
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0c1017]/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400 font-mono font-semibold border-b border-white/[0.08]">
                  <tr>
                    <th className="p-3.5">Buyer Name</th>
                    <th className="p-3.5">Campaign & Vehicle</th>
                    <th className="p-3.5">Selected Dealership & Showroom</th>
                    <th className="p-3.5">Offered Final Price</th>
                    <th className="p-3.5">Booking Status</th>
                    <th className="p-3.5 text-right">Showroom Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white font-sans">{b.buyerName}</div>
                        <div className="text-[10px] text-slate-400">{b.buyerPhone}</div>
                        <div className="text-[10px] text-slate-500">{b.buyerEmail}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white font-sans">{b.carModel}</div>
                        <div className="text-[10px] text-slate-400">{b.carVariant}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{b.dealershipName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">📍 {b.branchName || 'Main Hub'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">ID: {b.id.slice(0, 12)}...</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-emerald-400 text-sm">
                          {formatINR(b.offeredPrice || b.quotedOnRoadPrice || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {b.timelineDays ? `Within ~${b.timelineDays} days` : 'Immediate'}
                        </div>
                      </td>
                      <td className="p-3.5">
                        {(b.status === 'confirmed_intent' || b.status === 'booking_confirmed') && (
                          <span className="badge-pill bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Confirmed Intent
                          </span>
                        )}
                        {b.status === 'interested' && (
                          <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-mono">
                            <Eye className="w-3 h-3 mr-1" /> Interested
                          </span>
                        )}
                        {b.status === 'purchased' && (
                          <span className="badge-pill bg-white/[0.06] text-white border border-white/20 text-[10px] font-mono">
                            <Award className="w-3 h-3 mr-1" /> Delivered & Invoiced
                          </span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="badge-pill bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-mono">
                            <X className="w-3 h-3 mr-1" /> Cancelled
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-sans">
                        {(b.status === 'confirmed_intent' || b.status === 'booking_confirmed') && (isOfferManager || isSuperAdmin) && (
                          <button
                            onClick={() => handleMarkPurchased(b)}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 text-slate-950 hover:from-amber-100 hover:to-amber-300 transition-colors inline-flex items-center gap-1 shadow-sm"
                          >
                            <Award className="w-3.5 h-3.5 text-slate-950" />
                            <span>Finalize Delivery</span>
                          </button>
                        )}
                        {b.status === 'purchased' && (
                          <span className="text-xs text-emerald-400 font-semibold font-mono">Invoiced ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: REGISTERED BUYERS */}
      {/* ========================================================= */}
      {activeTab === 'buyers' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Joined Group Buy Members</h3>
            <span className="text-xs text-slate-400 font-mono">{members.length} Registered Buyers</span>
          </div>

          {members.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] text-center text-xs text-slate-400 bg-[#0c1017]/60">
              No new buyer registrations in current session. Join a group from the Buyer Portal or Homepage to see records.
            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-white/[0.08] overflow-hidden bg-[#0c1017]/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-slate-400 font-mono font-semibold border-b border-white/[0.08]">
                    <tr>
                      <th className="p-3.5">Buyer Name</th>
                      <th className="p-3.5">Contact</th>
                      <th className="p-3.5">Campaign Pool</th>
                      <th className="p-3.5">Preferences</th>
                      <th className="p-3.5">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                    {members.map((m) => {
                      const camp = campaigns.find((c) => c.id === m.campaignId);
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3.5 font-bold text-white font-sans">{m.fullName}</td>
                          <td className="p-3.5 text-slate-400">{m.phone} • {m.email}</td>
                          <td className="p-3.5 text-amber-300">{camp?.brand} {camp?.model || m.campaignId}</td>
                          <td className="p-3.5 text-slate-300">{m.colorPreference || 'Any'} • {m.financeRequirement || 'Self-Financed'}</td>
                          <td className="p-3.5 text-slate-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 6: STAFF DIRECTORY & RBAC MATRIX (Super Admin Only) */}
      {/* ========================================================= */}
      {activeTab === 'staff_access' && isSuperAdmin && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-[#0c1017]/80 border border-white/[0.08] p-5 rounded-2xl space-y-2">
            <div className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 font-mono">
              <KeyRound className="w-4 h-4 text-amber-300" />
              <span>Super Administrator Staff Governance & RBAC Matrix</span>
            </div>
            <p className="text-xs text-slate-300">
              Platform governance enforces strict separation of duties between Dealership Showroom Managers, Verification Staff, and Platform Offer Managers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Verification Staff */}
            <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3 bg-[#0c1017]/80">
              <div className="flex items-center gap-2 text-amber-300">
                <FileCheck className="w-5 h-5" />
                <h4 className="font-bold text-white">Verification Staff</h4>
              </div>
              <p className="text-xs text-slate-400">
                Authorized to accredit and verify dealership accounts, inspect GSTIN and showroom licenses.
              </p>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                <div className="text-emerald-400 font-semibold">✓ Can Verify Dealerships</div>
                <div className="text-emerald-400 font-semibold">✓ Can Suspend Dealerships</div>
                <div className="text-rose-400 font-semibold">✗ Cannot Approve Commercial Bids</div>
                <div className="text-rose-400 font-semibold">✗ Cannot Edit Dealer Quotes</div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Assigned: Ananya Sen (verification@groupbuycars.internal)
              </div>
            </div>

            {/* Platform Offer Manager */}
            <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-3 bg-[#0c1017]/80">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-bold text-white">Platform Offer Manager</h4>
              </div>
              <p className="text-xs text-slate-400">
                Authorized to review quotations submitted by verified dealerships, return with feedback, or publish live.
              </p>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                <div className="text-emerald-400 font-semibold">✓ Can Approve Quotations</div>
                <div className="text-emerald-400 font-semibold">✓ Can Return for Correction</div>
                <div className="text-rose-400 font-semibold">✗ Cannot Accredit Dealerships</div>
                <div className="text-rose-400 font-semibold">✗ Cannot Approve Unverified Dealers</div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Assigned: Vikram Malhotra (offer.manager@groupbuycars.internal)
              </div>
            </div>

            {/* Super Admin */}
            <div className="glass-panel p-5 rounded-2xl border border-amber-400/20 space-y-3 bg-[#0c1017]/80">
              <div className="flex items-center gap-2 text-amber-300">
                <KeyRound className="w-5 h-5" />
                <h4 className="font-bold text-white">Super Administrator</h4>
              </div>
              <p className="text-xs text-slate-400">
                Ultimate governance authority: manage staff accounts, adjust campaign capacities, and audit platform security.
              </p>
              <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs space-y-1">
                <div className="text-emerald-400 font-semibold">✓ Full System Clearance</div>
                <div className="text-emerald-400 font-semibold">✓ Manage Staff Clearances</div>
                <div className="text-emerald-400 font-semibold">✓ Close & Complete Groups</div>
                <div className="text-emerald-400 font-semibold">✓ Full Audit Trail Access</div>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                Assigned: Chief Platform Administrator
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 7: GOVERNANCE AUDIT TRAIL */}
      {/* ========================================================= */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Platform Governance Audit Trail</h3>
            <span className="text-xs text-slate-400 font-mono">{auditLogs.length} Records</span>
          </div>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="glass-panel p-4 rounded-xl border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-amber-300/30 transition-all bg-[#0c1017]/80"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`badge-pill text-[10px] font-bold font-mono uppercase ${
                        log.action.includes('approved') || log.action.includes('verified')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action.includes('submitted') || log.action.includes('interest')
                          ? 'bg-amber-400/10 text-amber-300 border border-amber-400/20'
                          : log.action.includes('correction')
                          ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                          : log.action.includes('booking')
                          ? 'bg-white/[0.05] text-white border border-white/10'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {log.action.replace('_', ' ')}
                    </span>
                    <span className="font-bold text-white">{log.dealershipName || log.campaignName || log.recordType}</span>
                    {log.version && (
                      <span className="text-slate-500 text-[11px] font-mono">v{log.version}</span>
                    )}
                  </div>
                  <p className="text-slate-400 leading-relaxed">{log.notes}</p>
                </div>

                <div className="text-right sm:shrink-0 text-[11px] font-mono text-slate-400">
                  <div>
                    By: <span className="text-slate-200">{log.performedByName}</span>{' '}
                    <span className="text-[10px] uppercase text-amber-300 font-bold">[{log.performedByRole}]</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: Offer Review Action Modal */}
      {/* ========================================================= */}
      {selectedOfferForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg glass-panel rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-6 space-y-5 bg-[#080c14]/95">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Confirm Offer Action:</span>
                <span className="uppercase text-amber-300 font-mono">{selectedOfferForAction.action.replace('_', ' ')}</span>
              </h3>
              <button
                onClick={() => setSelectedOfferForAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl font-mono">
              <div><strong>Dealership:</strong> {selectedOfferForAction.offer.dealershipName}</div>
              <div><strong>Direct Cash Discount:</strong> {formatINR(selectedOfferForAction.offer.cashDiscount)}</div>
              <div><strong>Min Bookings Required:</strong> {selectedOfferForAction.offer.minConfirmedBookingsRequired || selectedOfferForAction.offer.minConfirmedBookings || 3}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 block font-semibold font-mono">
                {selectedOfferForAction.action === 'approved'
                  ? 'Approval Review Notes (Optional):'
                  : 'Correction Instructions / Rejection Reason (Required):'}
              </label>
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  selectedOfferForAction.action === 'approved'
                    ? 'Quotation verified against group discount standards.'
                    : 'Specify required corrections (e.g. clarify mandatory accessories fee, delivery timeline, or insurance conditions)...'
                }
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-300/50 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOfferForAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                  selectedOfferForAction.action === 'approved'
                    ? 'text-slate-950 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400'
                    : selectedOfferForAction.action === 'needs_correction'
                    ? 'text-slate-950 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-300 hover:to-orange-400'
                    : 'text-white bg-rose-500 hover:bg-rose-400'
                }`}
              >
                Confirm {selectedOfferForAction.action.replace('_', ' ')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: Dealership Verification Modal */}
      {/* ========================================================= */}
      {selectedDealerForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg glass-panel rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-6 space-y-5 bg-[#080c14]/95">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Accreditation Decision:</span>
                <span className="uppercase text-amber-300 font-mono">{selectedDealerForAction.decision}</span>
              </h3>
              <button
                onClick={() => setSelectedDealerForAction(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-1 bg-white/[0.02] border border-white/5 p-3.5 rounded-xl font-mono">
              <div><strong>Dealership:</strong> {selectedDealerForAction.dealer.name}</div>
              <div><strong>GSTIN:</strong> {selectedDealerForAction.dealer.gstin}</div>
              <div><strong>Franchise Brands:</strong> {(selectedDealerForAction.dealer.authorizedBrands || [selectedDealerForAction.dealer.brand || 'Hyundai']).join(', ')}</div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 block font-semibold font-mono">
                Verification Findings & KYC Notes:
              </label>
              <textarea
                rows={3}
                value={dealerNotes}
                onChange={(e) => setDealerNotes(e.target.value)}
                placeholder="Enter details of GSTIN verification, franchise agreement check, or reason for suspension..."
                className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-300/50 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDealerForAction(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-white/[0.04]"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDealerVerification}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-md"
              >
                Confirm {selectedDealerForAction.decision.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
