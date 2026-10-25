'use client';

import React, { useState, useEffect, use, Suspense } from 'react';
import Link from 'next/link';
import { notFound, useSearchParams } from 'next/navigation';
import { useCampaignStore } from '@/lib/campaign-store';
import TierProgressBar from '@/components/campaigns/TierProgressBar';
import JoinCampaignModal from '@/components/campaigns/JoinCampaignModal';
import OfferAnalysisCard from '@/components/ai/OfferAnalysisCard';
import DealCoachDrawer from '@/components/ai/DealCoachDrawer';
import RfqModal from '@/components/ai/RfqModal';
import FindGroupModal from '@/components/campaigns/FindGroupModal';
import { formatINR, formatCrores, calculateRealCashSavings, calculateNetEffectivePrice } from '@/lib/calculations';
import {
  ArrowLeft,
  Sparkles,
  Users,
  ShieldCheck,
  FileText,
  Clock,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Scale,
  ShoppingBag,
  Building2,
  AlertTriangle,
  Lock,
  Search,
} from 'lucide-react';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

function CampaignDetailContent({ campaignId }: { campaignId: string }) {
  const searchParams = useSearchParams();
  const { campaigns, dealers, offers, bookings } = useCampaignStore();

  const [joinModalOpen, setJoinModalOpen] = useState(() => searchParams?.get('join') === 'true');
  const [rfqModalOpen, setRfqModalOpen] = useState(false);
  const [findGroupModalOpen, setFindGroupModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'cash' | 'price' | 'delivery' | 'transparent'>('cash');

  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) {
    notFound();
  }

  // Filter verified dealership IDs
  const verifiedDealerIds = new Set(
    dealers.filter((d) => d.verificationStatus === 'verified').map((d) => d.id)
  );

  // Filter offers for this campaign (BUYER VIEW: Only Admin-Approved offers from verified dealerships are visible)
  const campaignOffers = offers.filter(
    (o) => o.campaignId === campaign.id && o.status === 'approved' && verifiedDealerIds.has(o.dealerId)
  );

  // Group bookings
  const campBookings = bookings.filter((b) => b.campaignId === campaign.id);
  const interestedCount = campBookings.filter((b) => b.status === 'interested').length;
  // Count both 'booking_confirmed' and 'confirmed_intent' — both represent confirmed buyer intent
  const confirmedBookingsCount = campBookings.filter(
    (b) => b.status === 'booking_confirmed' || b.status === 'confirmed_intent'
  ).length;
  const deliveredCount = campBookings.filter((b) => b.status === 'purchased').length;

  const isClosedOrCompleted = campaign.status === 'closed' || campaign.status === 'completed';

  // Sorting offers based on user preference
  const sortedOffers = [...campaignOffers].sort((a, b) => {
    if (sortBy === 'cash') {
      return calculateRealCashSavings(b) - calculateRealCashSavings(a);
    }
    if (sortBy === 'price') {
      return (
        calculateNetEffectivePrice(campaign.estimatedOnRoadPrice, a) -
        calculateNetEffectivePrice(campaign.estimatedOnRoadPrice, b)
      );
    }
    if (sortBy === 'delivery') {
      return a.deliveryTimelineWeeks - b.deliveryTimelineWeeks;
    }
    if (sortBy === 'transparent') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return 0;
  });

  const bestCashOfferId = [...campaignOffers].sort(
    (a, b) => calculateRealCashSavings(b) - calculateRealCashSavings(a)
  )[0]?.id;

  const buyersRemaining = Math.max(0, campaign.targetBuyers - campaign.currentBuyers);

  return (
    <div className="site-container py-8 space-y-10">
      {/* Back Link & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-amber-200 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:-translate-x-1 transition-transform" />
          <span>Back to All Demand Pools</span>
        </Link>

        {isClosedOrCompleted && (
          <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/[0.08] text-xs font-mono">
            Status: {campaign.status.toUpperCase()}
          </span>
        )}
      </div>

      {/* Closed Notice Banner */}
      {isClosedOrCompleted && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-300">
            <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <div>
              <strong className="text-white">This demand pool is {campaign.status}.</strong> New buyer memberships are no longer accepted, but existing members can track their quotation bookings.
            </div>
          </div>
          <button
            onClick={() => setFindGroupModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl font-semibold text-xs text-slate-900 bg-amber-200 hover:bg-white transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Find Another Active Group</span>
          </button>
        </div>
      )}

      {/* The 4 Distinct Platform Counters Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.06] backdrop-blur-md">
        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 font-mono">
            <Users className="w-3.5 h-3.5 text-amber-300" />
            <span>1. Group Members</span>
          </div>
          <div className="text-xl font-extrabold text-white font-mono">
            {campaign.currentBuyers} <span className="text-xs text-slate-400 font-sans">/ target {campaign.targetBuyers}</span>
          </div>
          <div className="text-[10px] text-slate-400">Pool Demand Organized</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 font-mono">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Approved Bids</span>
          </div>
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {campaignOffers.length} Live Quote{campaignOffers.length !== 1 ? 's' : ''}
          </div>
          <div className="text-[10px] text-slate-400">Verified Showrooms</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 font-mono">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Booking Intents</span>
          </div>
          <div className="text-xl font-extrabold text-amber-200 font-mono">
            {confirmedBookingsCount} Confirmed
          </div>
          <div className="text-[10px] text-slate-400">{interestedCount} Evaluating</div>
        </div>

        <div className="space-y-0.5">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-300" />
            <span>4. Cars Delivered</span>
          </div>
          <div className="text-xl font-extrabold text-slate-200 font-mono">
            {deliveredCount} Finalized
          </div>
          <div className="text-[10px] text-slate-400">Direct Showroom Handover</div>
        </div>
      </div>

      {/* Hero Header Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Car Image & Specifications */}
        <div className="lg:col-span-7 space-y-6">
          <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/[0.08] shadow-2xl h-80 sm:h-96 group">
            <img
              src={campaign.imageUrl}
              alt={`${campaign.brand} ${campaign.model}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-black/40 to-transparent"></div>

            {/* Badges on image */}
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="badge-pill bg-black/70 backdrop-blur-md text-slate-200 border border-white/10 text-[11px] font-mono">
                {campaign.brand}
              </span>
              <span className="badge-pill bg-white/[0.08] backdrop-blur-md text-amber-200 border border-amber-300/30 text-[11px] font-mono">
                {campaign.fuelType} • {campaign.transmission}
              </span>
            </div>

            <div className="absolute bottom-5 left-5 right-5 flex items-baseline justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {campaign.brand} {campaign.model}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
                  {campaign.variant} • {campaign.city}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block font-mono">
                  Original Est. On-Road
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                  {formatINR(campaign.estimatedOnRoadPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div className="glass-panel p-5 rounded-2xl border border-white/[0.08]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 font-mono">
              Vehicle Highlights & Architecture
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {campaign.keySpecs.map((spec) => (
                <div key={spec.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{spec.label}</div>
                  <div className="text-xs font-semibold text-slate-100 mt-0.5">{spec.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Live Pool Progress & Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <span className="badge-pill bg-white/[0.04] text-amber-200 border border-amber-300/30 text-xs font-mono">
                <Users className="w-3.5 h-3.5 mr-1 text-amber-300" />
                Live Buyer Pool
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Deadline: {campaign.deadline}
              </span>
            </div>

            {/* Live Progress Bar with Tier Badges */}
            <TierProgressBar
              currentBuyers={campaign.currentBuyers}
              targetBuyers={campaign.targetBuyers}
              tiers={campaign.tiers}
              compact={false}
            />

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed">
              {campaign.description}
            </p>

            {/* CTAs */}
            <div className="space-y-3 pt-2">
              {!isClosedOrCompleted ? (
                <button
                  onClick={() => setJoinModalOpen(true)}
                  className="w-full py-4 rounded-xl font-semibold text-sm text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-xl shadow-amber-500/10 transition-all duration-200 transform hover:scale-[1.01] flex items-center justify-center gap-2 border border-amber-200/50"
                >
                  <Sparkles className="w-4 h-4 text-slate-900" />
                  <span>Join Group Buy ({campaign.currentBuyers} joined • {buyersRemaining} needed for Tier 3)</span>
                </button>
              ) : (
                <button
                  onClick={() => setFindGroupModalOpen(true)}
                  className="w-full py-4 rounded-xl font-semibold text-sm text-slate-900 bg-amber-200 hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Pool Closed • Find Another Car Group</span>
                </button>
              )}

              <button
                onClick={() => setRfqModalOpen(true)}
                className="w-full py-3 rounded-xl font-medium text-xs text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-amber-300" />
                <span>View Dealership Tender RFQ Brief</span>
              </button>
            </div>

            {/* Safe participation pledge */}
            <div className="flex items-start gap-2.5 text-[11px] text-slate-400 border-t border-white/[0.06] pt-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Financial Obligation:</strong> Joining this demand pool does not commit you to an automatic purchase. Group members can independently choose their preferred showroom or cancel anytime.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* DEALERSHIP OFFERS SECTION */}
      <section className="space-y-6 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="badge-pill bg-white/[0.04] text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                {campaignOffers.length} Verified Dealership Quotes
              </span>
              <span className="text-[11px] text-slate-300 bg-white/[0.03] px-2.5 py-0.5 rounded-full border border-white/[0.08] font-mono">
                Approved by Platform Offer Managers
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Decomposed Quotation Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Final on-road prices calculated transparently from ₹{campaign.estimatedOnRoadPrice.toLocaleString('en-IN')} original price minus cash discounts.
            </p>
          </div>

          {/* Preferences / Sorting Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <span className="text-[11px] text-slate-400 font-semibold font-mono flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3 h-3 text-slate-400" />
              Sort:
            </span>
            <button
              onClick={() => setSortBy('cash')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                sortBy === 'cash'
                  ? 'bg-amber-200/20 text-amber-200 border border-amber-300/40 font-semibold'
                  : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              Highest Cash Discount
            </button>
            <button
              onClick={() => setSortBy('price')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                sortBy === 'price'
                  ? 'bg-amber-200/20 text-amber-200 border border-amber-300/40 font-semibold'
                  : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              Lowest Net Price
            </button>
            <button
              onClick={() => setSortBy('delivery')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                sortBy === 'delivery'
                  ? 'bg-amber-200/20 text-amber-200 border border-amber-300/40 font-semibold'
                  : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
              }`}
            >
              Fastest Delivery
            </button>
          </div>
        </div>

        {/* Offers Cards List */}
        <div className="space-y-6">
          {sortedOffers.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-white/10 text-center space-y-2">
              <Building2 className="w-8 h-8 text-gray-500 mx-auto" />
              <div className="text-sm font-semibold text-white">No approved dealer quotations yet</div>
              <div className="text-xs text-gray-400">
                Showrooms are preparing competitive quotes for this demand pool. Quotes will appear once reviewed by Platform Offer Managers.
              </div>
            </div>
          ) : (
            sortedOffers.map((offer) => (
              <OfferAnalysisCard
                key={offer.id}
                campaign={campaign}
                offer={offer}
                isBestCash={offer.id === bestCashOfferId}
              />
            ))
          )}
        </div>
      </section>

      {/* Floating AI Deal Coach Drawer */}
      <DealCoachDrawer campaign={campaign} offers={campaignOffers} />

      {/* Modals */}
      <JoinCampaignModal
        campaign={campaign}
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />

      <RfqModal
        campaign={campaign}
        isOpen={rfqModalOpen}
        onClose={() => setRfqModalOpen(false)}
      />

      <FindGroupModal
        isOpen={findGroupModalOpen}
        onClose={() => setFindGroupModalOpen(false)}
      />
    </div>
  );
}

function CampaignDetailAsync({ params }: CampaignDetailPageProps) {
  const resolvedParams = use(params);
  return <CampaignDetailContent campaignId={resolvedParams.id} />;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">Loading campaign details...</div>}>
      <CampaignDetailAsync params={params} />
    </Suspense>
  );
}
