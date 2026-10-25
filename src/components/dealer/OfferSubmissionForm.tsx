'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { CarCampaign, DealershipOffer } from '@/lib/types';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import { formatCrores, formatINR } from '@/lib/calculations';
import {
  Building2,
  Tag,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileText,
  DollarSign,
  MapPin,
  Lock,
  Check,
  HelpCircle,
} from 'lucide-react';

interface OfferSubmissionFormProps {
  campaigns: CarCampaign[];
  initialOffer?: DealershipOffer;
  initialCampaignId?: string;
  isEdit?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function OfferSubmissionForm({
  campaigns,
  initialOffer,
  initialCampaignId,
  isEdit = false,
  onSuccess,
  onCancel,
}: OfferSubmissionFormProps) {
  const router = useRouter();
  const { user } = useAuthStore();
  const { dealers, submitDealerOffer, updateDealerOffer } = useCampaignStore();

  const currentDealer = dealers.find((d) => d.id === (user?.dealershipId || 'dealer-a-kun'));
  const branches = currentDealer?.branches || [
    {
      id: 'b1',
      name: 'Main Showroom',
      address: 'Road No. 36, Jubilee Hills',
      city: 'Hyderabad',
      contactPerson: user?.fullName || 'Manager',
      phone: user?.phone || '+91 98490 11223',
    },
  ];

  const [selectedCampaignId, setSelectedCampaignId] = useState(
    initialOffer?.campaignId || initialCampaignId || campaigns[0]?.id || ''
  );
  const [branchId, setBranchId] = useState(initialOffer?.branchId || branches[0]?.id || '');
  const [dealershipName, setDealershipName] = useState(
    initialOffer?.dealershipName || currentDealer?.name || user?.dealershipName || 'KUN United Hyundai'
  );
  const [dealershipLocation, setDealershipLocation] = useState(
    initialOffer?.dealershipLocation || currentDealer?.showroomAddress || 'Road No. 36, Jubilee Hills, Hyderabad'
  );
  const [dealerContact, setDealerContact] = useState(
    initialOffer?.dealerContact || `${user?.fullName || 'Fleet Sales GM'} - ${user?.phone || '+91 98490 11223'}`
  );

  // Pricing
  const [cashDiscount, setCashDiscount] = useState<number>(initialOffer?.cashDiscount || 70000);
  const [claimedAccessoryValue, setClaimedAccessoryValue] = useState<number>(
    initialOffer?.claimedAccessoryValue || 8000
  );
  const [mandatoryAccessories, setMandatoryAccessories] = useState<boolean>(
    initialOffer?.mandatoryAccessories || false
  );
  const [accessoryDetails, setAccessoryDetails] = useState(
    initialOffer?.accessoryDetails || 'OEM 3D all-weather matting, boot protector, magnetic sun blinds'
  );
  const [claimedInsuranceValue, setClaimedInsuranceValue] = useState<number>(
    initialOffer?.claimedInsuranceValue || 0
  );
  const [insuranceDetails, setInsuranceDetails] = useState(
    initialOffer?.insuranceDetails || 'Freedom to match online insurance quotes or bring own outside policy.'
  );
  const [additionalCharges, setAdditionalCharges] = useState<number>(
    initialOffer?.additionalCharges || 0
  );
  const [financingRequirements, setFinancingRequirements] = useState(
    initialOffer?.financingRequirements || 'Outside bank financing accepted with zero surcharge or penalties.'
  );
  const [warrantyDetails, setWarrantyDetails] = useState(
    initialOffer?.warrantyDetails || 'Standard 3-Year / 1,00,000 km Manufacturer Warranty + 3-Year RSA.'
  );

  // Quotas & Dates
  const [deliveryTimelineWeeks, setDeliveryTimelineWeeks] = useState<number>(
    initialOffer?.deliveryTimelineWeeks || 2
  );
  const [minConfirmedBookings, setMinConfirmedBookings] = useState<number>(
    initialOffer?.minConfirmedBookings || 3
  );
  const [maxEligibleBookings, setMaxEligibleBookings] = useState<number>(
    initialOffer?.maxEligibleBookings || 20
  );
  const [supportingEvidence, setSupportingEvidence] = useState(
    initialOffer?.supportingEvidence || 'OEM regional fleet sanction letter ref: HYD-FLT-2026-901'
  );

  const [conditionsText, setConditionsText] = useState(
    initialOffer?.conditions?.join('\n') ||
      'Valid for 15+ consolidated bookings from the GroupBuy pool\nRefundable token advance of ₹25,000 per buyer directly to showroom\nDelivery committed within 14 days of full invoice payment\nZero handling charges or depot logistics fees'
  );

  const [managerConfirmed, setManagerConfirmed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];
  const referenceOnRoad = selectedCampaign?.estimatedOnRoadPrice || 2040000;
  const calculatedFinalPrice = Math.max(
    0,
    referenceOnRoad - Number(cashDiscount || 0) + Number(additionalCharges || 0)
  );

  const selectedBranch = branches.find((b) => b.id === branchId) || branches[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setNoticeMessage('');

    // Field Validations
    if (!cashDiscount || cashDiscount <= 0) {
      setErrorMessage('Direct cash discount must be greater than ₹0.');
      setIsSubmitting(false);
      return;
    }

    if (cashDiscount > referenceOnRoad) {
      setErrorMessage(`Direct cash discount cannot exceed the on-road price (${formatINR(referenceOnRoad)}).`);
      setIsSubmitting(false);
      return;
    }

    if (deliveryTimelineWeeks < 1 || deliveryTimelineWeeks > 24) {
      setErrorMessage('Delivery timeline must be between 1 and 24 weeks.');
      setIsSubmitting(false);
      return;
    }

    if (minConfirmedBookings < 1) {
      setErrorMessage('Minimum confirmed bookings required must be at least 1.');
      setIsSubmitting(false);
      return;
    }

    if (!managerConfirmed) {
      setErrorMessage('Please confirm authorization as Dealership Showroom/Fleet Manager before submitting.');
      setIsSubmitting(false);
      return;
    }

    const conditions = conditionsText
      .split('\n')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const validity = new Date();
    validity.setDate(validity.getDate() + 30);

    try {
      if (isEdit && initialOffer) {
        const res = await updateDealerOffer(
          initialOffer.id,
          {
            campaignId: selectedCampaignId,
            branchId,
            branchName: selectedBranch?.name,
            dealershipName,
            dealershipLocation,
            dealerContact,
            cashDiscount: Number(cashDiscount),
            claimedAccessoryValue: Number(claimedAccessoryValue),
            mandatoryAccessories,
            accessoryDetails,
            claimedInsuranceValue: Number(claimedInsuranceValue),
            insuranceDetails,
            additionalCharges: Number(additionalCharges),
            financingRequirements,
            warrantyDetails,
            deliveryTimelineWeeks: Number(deliveryTimelineWeeks),
            minConfirmedBookings: Number(minConfirmedBookings),
            maxEligibleBookings: Number(maxEligibleBookings),
            supportingEvidence,
            conditions,
          },
          user
        );

        setNoticeMessage(res.message);
        setSubmitted(true);
        if (onSuccess) setTimeout(onSuccess, 1500);
      } else {
        const res = await submitDealerOffer(
          {
            campaignId: selectedCampaignId,
            branchId,
            branchName: selectedBranch?.name,
            dealershipName,
            dealershipLocation,
            dealerContact,
            verified: currentDealer?.verificationStatus === 'verified',
            cashDiscount: Number(cashDiscount),
            claimedAccessoryValue: Number(claimedAccessoryValue),
            mandatoryAccessories,
            accessoryDetails,
            claimedInsuranceValue: Number(claimedInsuranceValue),
            insuranceDetails,
            corporateDiscount: 0,
            exchangeBonus: 0,
            otherBenefits: 'Priority VIN allotment & Showroom PDI clearance',
            additionalCharges: Number(additionalCharges),
            financingRequirements,
            warrantyDetails,
            deliveryTimelineWeeks: Number(deliveryTimelineWeeks),
            minConfirmedBookings: Number(minConfirmedBookings),
            maxEligibleBookings: Number(maxEligibleBookings),
            offerStartDate: new Date().toISOString().split('T')[0],
            offerValidityDate: validity.toISOString().split('T')[0],
            supportingEvidence,
            conditions,
            rating: 4.8,
          },
          user
        );

        try {
          confetti({
            particleCount: 110,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#f5d77f', '#10b981', '#ffffff'],
          });
        } catch (err) {}

        setNoticeMessage(res.message);
        setSubmitted(true);
        if (onSuccess) setTimeout(onSuccess, 1500);
      }
    } catch (e: any) {
      setErrorMessage(e?.message || 'Error processing dealership offer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-emerald-500/30 text-center space-y-4 bg-[#0c1017]/90 animate-fadeIn">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">
            {isEdit ? 'Quotation Updated Successfully!' : 'Showroom Quotation Submitted!'}
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {noticeMessage ||
              'Your offer has entered the Platform Offer Manager review board. Once verified, it will be published live to buyers in this pool.'}
          </p>
        </div>
        <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-slate-400 max-w-md mx-auto font-mono">
          Workflow Status: <span className="text-amber-300 font-semibold">Pending Platform Review</span>
        </div>
        <button
          onClick={() => {
            setSubmitted(false);
            if (onSuccess) onSuccess();
          }}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 transition-all shadow-md"
        >
          Return to Dealership Dashboard
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error: </span>
            {errorMessage}
          </div>
        </div>
      )}

      {isEdit && initialOffer?.status === 'approved' && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Notice on Published Quotation Revision:</span>
            <p className="text-slate-300">
              This quotation is currently published live to buyers. Modifying commercial terms will submit a new version (v{(initialOffer.version || 1) + 1}) to the Platform Review board.
            </p>
          </div>
        </div>
      )}

      {/* Target Pool & Showroom Branch Selection */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 space-y-4">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
          1. Demand Pool & Showroom Branch
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Target Group Buy Campaign *</label>
            <select
              value={selectedCampaignId}
              disabled={isEdit}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 disabled:opacity-60 transition-colors"
            >
              {campaigns.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.brand} {c.model} ({c.city}) — {c.currentBuyers} Buyers ({formatCrores(c.currentBuyers * c.estimatedOnRoadPrice)})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-medium">Fulfilling Showroom Branch *</label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-300/50 transition-colors"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                  {b.name} ({b.address})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Commercial Pricing & Strict Separation of Cash Discounts */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
              2. Commercial Pricing & Discounts
            </label>
            <span className="text-[11px] text-slate-400">
              Reference On-Road: <strong className="text-white font-mono">{formatINR(referenceOnRoad)}</strong>
            </span>
          </div>

          {/* Strict Separation Notice */}
          <span className="badge-pill bg-amber-400/10 text-amber-300 border border-amber-400/20 text-[10px] font-mono self-start sm:self-auto">
            Direct Cash strictly separated from Perks
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Direct Cash Discount */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <label className="text-xs text-emerald-300 font-bold flex items-center justify-between">
              <span>Direct Cash Discount (INR) *</span>
              <span className="text-[10px] font-mono uppercase">Invoice Cut</span>
            </label>
            <input
              type="number"
              step="1000"
              required
              value={cashDiscount}
              onChange={(e) => setCashDiscount(Number(e.target.value))}
              placeholder="e.g. 70000"
              className="w-full bg-slate-900/90 border border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
            />
            <p className="text-[10px] text-slate-400">Pure deduction off invoice total.</p>
          </div>

          {/* Accessories Retail Value */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <label className="text-xs text-slate-300 flex items-center justify-between">
              <span>Accessories Retail Value</span>
              <span className="text-[10px] text-amber-300 font-mono">Non-Cash</span>
            </label>
            <input
              type="number"
              step="1000"
              value={claimedAccessoryValue}
              onChange={(e) => setClaimedAccessoryValue(Number(e.target.value))}
              placeholder="e.g. 10000"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
            />
            <p className="text-[10px] text-slate-500">Retail price of accessory bundle.</p>
          </div>

          {/* Additional Handling / Logistics Charges */}
          <div className="space-y-1.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <label className="text-xs text-slate-300 flex items-center justify-between">
              <span>Additional Surcharges</span>
              <span className="text-[10px] text-slate-400 font-mono">₹0 for transparency</span>
            </label>
            <input
              type="number"
              step="500"
              value={additionalCharges}
              onChange={(e) => setAdditionalCharges(Number(e.target.value))}
              placeholder="0"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
            />
            <p className="text-[10px] text-slate-500">Handling or depot logistics charges.</p>
          </div>
        </div>

        {/* Mandatory Accessories Toggle */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
          <input
            type="checkbox"
            id="mandatoryAccessories"
            checked={mandatoryAccessories}
            onChange={(e) => setMandatoryAccessories(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-300 cursor-pointer mt-0.5"
          />
          <label htmlFor="mandatoryAccessories" className="text-slate-300 cursor-pointer space-y-0.5">
            <span className="font-semibold text-white">Mandatory Accessory Pack Requirement:</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Check ONLY if your dealership requires buyers to take the accessory kit to qualify for the cash discount. (Unchecked = 100% optional, recommended for higher transparency score).
            </p>
          </label>
        </div>

        {/* Dynamic Buyer Invoiced Price Preview Banner */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-400/5 via-slate-900 to-emerald-500/10 border border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-300 font-mono tracking-wider">
              Automatic Net Invoiced Price Calculation
            </div>
            <div className="text-xs text-slate-300 mt-0.5 font-mono">
              Reference {formatINR(referenceOnRoad)} − Cash Cut {formatINR(cashDiscount)} + Surcharges {formatINR(additionalCharges)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatINR(calculatedFinalPrice)}
            </div>
            <div className="text-[10px] text-slate-400">
              Accessories ({formatINR(claimedAccessoryValue)}) separated
            </div>
          </div>
        </div>

        {/* Details & Warranty */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Accessory Items Specification</label>
            <input
              type="text"
              value={accessoryDetails}
              onChange={(e) => setAccessoryDetails(e.target.value)}
              placeholder="e.g. 3D all-weather floor mats, mud flaps, boot protector"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Warranty Package Specification</label>
            <input
              type="text"
              value={warrantyDetails}
              onChange={(e) => setWarrantyDetails(e.target.value)}
              placeholder="e.g. Standard 3-Year / 1,00,000 km Warranty + 2-Year Extended"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>
        </div>
      </div>

      {/* Quotas, Insurance & Conditions */}
      <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-white/[0.08] bg-[#0c1017]/80 space-y-4">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block font-mono">
          3. Booking Quotas, Operations & Fine Print
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 flex justify-between">
              <span>Min Confirmed Bookings *</span>
              <span className="text-[10px] text-amber-300 font-mono">Quota trigger</span>
            </label>
            <input
              type="number"
              min="1"
              max="25"
              required
              value={minConfirmedBookings}
              onChange={(e) => setMinConfirmedBookings(Number(e.target.value))}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Delivery Timeline (Weeks) *</label>
            <input
              type="number"
              min="1"
              max="12"
              required
              value={deliveryTimelineWeeks}
              onChange={(e) => setDeliveryTimelineWeeks(Number(e.target.value))}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300">Supporting Sanction Ref</label>
            <input
              type="text"
              value={supportingEvidence}
              onChange={(e) => setSupportingEvidence(e.target.value)}
              placeholder="e.g. OEM Regional Approval Letter Ref"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Insurance Policy Terms</label>
            <input
              type="text"
              value={insuranceDetails}
              onChange={(e) => setInsuranceDetails(e.target.value)}
              placeholder="e.g. Self-insurance allowed with zero dealer surcharge"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-medium">Financing / Bank Terms</label>
            <input
              type="text"
              value={financingRequirements}
              onChange={(e) => setFinancingRequirements(e.target.value)}
              placeholder="e.g. Open to all nationalized banks with 0 captive loan surcharge"
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-300/50"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-300 flex items-center justify-between">
            <span>Offer Conditions & Fine Print (One per line)</span>
            <span className="text-[10px] text-slate-400 font-mono">Analyzed by AI Deal Audit</span>
          </label>
          <textarea
            rows={3}
            value={conditionsText}
            onChange={(e) => setConditionsText(e.target.value)}
            className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-300/50 leading-relaxed"
          />
        </div>
      </div>

      {/* Showroom Manager Confirmation */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-400/20 bg-amber-950/[0.08] space-y-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="managerConfirmation"
            required
            checked={managerConfirmed}
            onChange={(e) => setManagerConfirmed(e.target.checked)}
            className="w-4 h-4 rounded accent-amber-300 cursor-pointer mt-0.5"
          />
          <label htmlFor="managerConfirmation" className="text-xs text-slate-300 cursor-pointer space-y-1">
            <span className="font-bold text-white block">
              Showroom Manager Authorization Confirmation
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              I, <strong className="text-amber-300">{user?.fullName || 'Dealership Manager'}</strong>, as authorized representative of <strong className="text-white">{dealershipName}</strong>, confirm that these discount terms, committed delivery timeline, and quota requirements are authentic showroom commitments and approved for submission to the Platform Offer Manager review board.
            </p>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 hover:from-amber-100 hover:to-amber-300 shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <span>Processing...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>{isEdit ? 'Save Changes & Submit for Review' : 'Confirm & Submit Showroom Quotation'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
