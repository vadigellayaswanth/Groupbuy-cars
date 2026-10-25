'use client';

import React, { useState } from 'react';
import { DealershipOffer, CarCampaign, OfferAnalysis } from '@/lib/types';
import { analyzeOfferDeterministically, formatINR, calculateNetEffectivePrice } from '@/lib/calculations';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import confetti from 'canvas-confetti';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  CreditCard,
  FileCheck,
  Package,
  MapPin,
  Check,
  X,
  Users,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface OfferAnalysisCardProps {
  campaign: CarCampaign;
  offer: DealershipOffer;
  isBestCash?: boolean;
}

export default function OfferAnalysisCard({
  campaign,
  offer,
  isBestCash = false,
}: OfferAnalysisCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { user, isBuyer } = useAuthStore();
  const {
    bookings,
    selectOfferInterest,
    confirmBookingIntent,
    cancelBooking,
  } = useCampaignStore();

  const analysis: OfferAnalysis = analyzeOfferDeterministically(campaign, offer);

  const originalOnRoad = campaign.estimatedOnRoadPrice;
  const calculatedFinalPrice = calculateNetEffectivePrice(originalOnRoad, offer);

  const isTransparent = analysis.gimmickScore === 'Transparent';
  const isHighGimmick = analysis.gimmickScore === 'High Gimmick Alert';

  // Check if current user has an active booking on this offer
  const myBooking = bookings.find(
    (b) => b.offerId === offer.id && b.buyerId === user?.id && b.status !== 'cancelled'
  );

  const minRequired = offer.minConfirmedBookings || 3;
  const currentConfirmed = offer.confirmedBookingsCount || 0;
  const isThresholdMet = currentConfirmed >= minRequired;
  const remainingNeeded = Math.max(0, minRequired - currentConfirmed);

  const handleInterest = async () => {
    try {
      const res = await selectOfferInterest(offer.id, campaign.id, user);
      alert(res.message);
    } catch (e: any) {
      alert(e?.message || 'Error recording interest.');
    }
  };

  const handleConfirmIntent = async () => {
    if (
      confirm(
        `Confirm your booking intent for ${offer.dealershipName}?\n\n• Quoted On-Road Price: ${formatINR(calculatedFinalPrice)}\n• Cash Discount: ${formatINR(offer.cashDiscount)}\n• Zero online payment collected.\n• Final invoice, color choice, and vehicle handover are arranged directly at the showroom.`
      )
    ) {
      try {
        let bookingId = myBooking?.id;
        if (!bookingId) {
          const interestRes = await selectOfferInterest(offer.id, campaign.id, user);
          bookingId = interestRes.booking.id;
        }

        const res = await confirmBookingIntent(bookingId, user);
        try {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}
        alert(res.message);
      } catch (e: any) {
        alert(e?.message || 'Error confirming booking.');
      }
    }
  };

  const handleCancel = async () => {
    if (!myBooking) return;
    if (confirm('Are you sure you want to cancel your booking intent for this dealership offer?')) {
      try {
        await cancelBooking(myBooking.id, user);
        alert('Booking cancelled successfully.');
      } catch (e: any) {
        alert(e?.message || 'Failed to cancel booking.');
      }
    }
  };

  return (
    <div
      className={`glass-panel rounded-2xl p-5 sm:p-7 transition-all duration-300 border ${
        isBestCash
          ? 'border-amber-300/40 shadow-xl shadow-amber-500/5 bg-gradient-to-b from-amber-200/[0.02] to-transparent'
          : isHighGimmick
          ? 'border-amber-500/30'
          : 'border-white/[0.08]'
      }`}
    >
      {/* Top Banner & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-2">
          {isBestCash && (
            <span className="badge-pill bg-amber-200/20 text-amber-200 border border-amber-300/40 flex items-center gap-1 font-mono text-[11px]">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              #1 Real Cash Winner
            </span>
          )}

          <span
            className={`badge-pill font-mono text-[11px] ${
              isTransparent
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : isHighGimmick
                ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'
            }`}
          >
            {analysis.gimmickScore} • Transparency {analysis.transparencyRating}/10
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-slate-500 font-mono uppercase">Certified Tender</span>
          <span className="text-slate-600">•</span>
          <div className="flex items-center gap-1 text-slate-300 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-amber-300/80" />
            <span>Delivery: ~{offer.deliveryTimelineWeeks} week(s)</span>
          </div>
        </div>
      </div>

      {/* Dealership Name, Branch and Location */}
      <div className="mb-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              {offer.dealershipName}
              {offer.verified && (
                <span title="Verified OEM Dealership Partner">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
              <span>{offer.branchName || offer.dealershipLocation}</span>
            </p>
          </div>

          {/* User Booking Status Pill if active */}
          {myBooking && (
            <div>
              {myBooking.status === 'booking_confirmed' && (
                <span className="badge-pill bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Intent Confirmed
                </span>
              )}
              {myBooking.status === 'interested' && (
                <span className="badge-pill bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                  Evaluating
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Structured Price Comparison Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-black/50 border border-white/[0.06] mb-5">
        {/* Metric 1: Original Est. Price */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold font-mono">
            Original On-Road
          </div>
          <div className="text-lg font-bold font-mono text-slate-300">
            {formatINR(originalOnRoad)}
          </div>
          <p className="text-[10px] text-slate-500">Benchmark Hyderabad</p>
        </div>

        {/* Metric 2: Direct Cash Discount (Real Cash Off) */}
        <div className="space-y-1 sm:border-l sm:border-white/[0.06] sm:pl-3">
          <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            1. Direct Cash Cut
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            - {formatINR(offer.cashDiscount)}
          </div>
          <p className="text-[10px] text-emerald-300/80">Direct invoice reduction</p>
        </div>

        {/* Metric 3: Calculated Final Price */}
        <div className="space-y-1 sm:border-l sm:border-white/[0.06] sm:pl-3">
          <div className="text-[10px] uppercase tracking-wider text-amber-200 font-semibold font-mono">
            Net Effective Price
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formatINR(calculatedFinalPrice)}
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {formatINR(originalOnRoad)} - {formatINR(offer.cashDiscount)}
            {offer.additionalCharges ? ` + ${formatINR(offer.additionalCharges)}` : ''}
          </p>
        </div>

        {/* Metric 4: Separate Accessories (Non-Cash Perk) */}
        <div className="space-y-1 sm:border-l sm:border-white/[0.06] sm:pl-3 bg-white/[0.01] p-1.5 rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1 font-mono">
            <Package className="w-3 h-3 text-amber-300" />
            <span>2. Add-on Packs</span>
          </div>
          <div className="text-base font-bold font-mono text-amber-200">
            {formatINR(offer.claimedAccessoryValue)}
          </div>
          <p className="text-[9px] text-slate-400 truncate">
            {offer.claimedAccessoryValue > 0 ? (offer.mandatoryAccessories ? 'Mandatory package' : 'Optional add-on') : 'None'}
          </p>
        </div>
      </div>

      {/* MINIMUM CONFIRMED BOOKINGS PROGRESS (Requirement 10) */}
      <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-300" />
            <span className="font-semibold text-white">
              Showroom Volume Quota: {currentConfirmed} / {minRequired} Confirmed Intent{minRequired > 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {isThresholdMet
              ? '✅ Booking quota unlocked! Dealership has committed to honoring this group discount tier.'
              : `⏳ Awaiting ${remainingNeeded} more confirmed buyer(s) to unlock this fleet price tier.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold font-mono ${
              isThresholdMet
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
            }`}
          >
            {isThresholdMet ? 'Tier Unlocked' : `${remainingNeeded} More Needed`}
          </span>
        </div>
      </div>

      {/* AI Transparency Summary Box */}
      <div
        className={`p-4 rounded-xl text-xs mb-4 ${
          isHighGimmick
            ? 'bg-amber-500/10 border border-amber-500/20 text-amber-200'
            : 'bg-white/[0.03] border border-white/[0.08] text-slate-300'
        }`}
      >
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-white">AI Deal Coach Audit: </span>
            {analysis.aiSummary}
          </div>
        </div>

        {/* Gimmick Flags callouts */}
        {analysis.gimmickFlags.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-500/20 space-y-1">
            {analysis.gimmickFlags.map((flag, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{flag}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BUYER INTERACTIVE ACTIONS (Requirement 10 & 12) */}
      <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 font-mono">
          <span className="text-slate-500">Fleet Desk:</span> {offer.dealerContact}
        </div>

        <div className="flex items-center gap-2">
          {myBooking?.status === 'booking_confirmed' ? (
            <button
              onClick={handleCancel}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
            >
              Cancel My Intent
            </button>
          ) : (
            <>
              {!myBooking && (
                <button
                  onClick={handleInterest}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-colors"
                >
                  Save to Shortlist
                </button>
              )}
              <button
                onClick={handleConfirmIntent}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-md shadow-amber-500/10 transition-all flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-slate-900" />
                <span>Confirm Booking Intent</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expand / Collapse Details Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-center gap-1 pt-3 text-xs font-medium text-slate-400 hover:text-white transition-colors"
      >
        <span>{expanded ? 'Hide Offer Details' : 'View Warranty, Insurance & Full Fine Print'}</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Collapsible Details */}
      {expanded && (
        <div className="pt-4 border-t border-white/[0.06] space-y-4 text-xs animate-fadeIn">
          {/* Key Conditions Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5 font-mono">
                Insurance Condition
              </span>
              <p className="text-slate-200 text-[11px]">{offer.insuranceDetails}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5 font-mono">
                Warranty & Perks
              </span>
              <p className="text-slate-200 text-[11px]">{offer.warrantyDetails || 'Standard manufacturer warranty'}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-0.5 font-mono">
                Additional Charges
              </span>
              <p className="text-emerald-400 text-[11px]">
                {offer.additionalCharges ? formatINR(offer.additionalCharges) : '₹0 handling or depot logistics fees'}
              </p>
            </div>
          </div>

          {/* Pros & Cons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.01] border border-white/[0.05]">
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] font-mono">
                Verified Advantages
              </span>
              {analysis.pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-1.5 text-slate-300 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1.5 p-3 rounded-xl bg-white/[0.01] border border-white/[0.05]">
              <span className="font-semibold text-amber-300 uppercase tracking-wider text-[10px] font-mono">
                Important Caveats to Verify
              </span>
              {analysis.cons.length > 0 ? (
                analysis.cons.map((con, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-400 text-[11px]">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span>{con}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-500 text-[11px]">No major hidden traps detected.</div>
              )}
            </div>
          </div>

          {/* Full clauses */}
          <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/[0.05] space-y-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px] block font-mono">
              Dealership Terms & Conditions:
            </span>
            <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
              {offer.conditions.map((cond, idx) => (
                <li key={idx}>{cond}</li>
              ))}
            </ul>
          </div>

          {/* Individual Purchase Notice */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-200">Individual Purchase Assurance:</strong> GroupBuy Cars organizes collective bargaining. Each car purchase is an individual agreement directly between you and {offer.dealershipName}. No vehicle payment is collected through this platform.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
