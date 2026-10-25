'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CarCampaign } from '@/lib/types';
import { useCampaignStore } from '@/lib/campaign-store';
import { X, Sparkles, ShieldCheck, CheckCircle2, ArrowRight, AlertCircle, Database } from 'lucide-react';
import { formatINR } from '@/lib/calculations';

import { useAuthStore } from '@/lib/auth-store';

interface JoinCampaignModalProps {
  campaign: CarCampaign;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function JoinCampaignModal({
  campaign,
  isOpen,
  onClose,
  onSuccess,
}: JoinCampaignModalProps) {
  const { joinCampaign, isSupabaseConfigured } = useCampaignStore();
  const { user } = useAuthStore();

  const [fullName, setFullName] = useState(user?.fullName || 'Vikram Reddy');
  const [phone, setPhone] = useState(user?.phone?.replace(/\D/g, '') || '9849023456');
  const [email, setEmail] = useState(user?.email || 'vikram.reddy@gmail.com');
  const [colorPreference, setColorPreference] = useState('Abyss Black');
  const [financeRequirement, setFinanceRequirement] = useState<'Bank Loan' | 'Cash / Self' | 'Lease'>('Bank Loan');
  const [willingToBuyInDays, setWillingToBuyInDays] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [backendMessage, setBackendMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const result = await joinCampaign(
        {
          campaignId: campaign.id,
          fullName,
          phone,
          email,
          colorPreference,
          financeRequirement,
          willingToBuyInDays,
        },
        user
      );

      setBackendMessage(result.message);

      // Fire celebratory confetti!
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00f2fe', '#38bdf8', '#10b981', '#fbbf24'],
        });
      } catch (err) {}

      setHasJoined(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error joining campaign. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg glass-panel rounded-2xl overflow-hidden border border-white/[0.1] shadow-2xl p-6 sm:p-8 bg-[#090d14]/95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {!hasJoined ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-pill bg-white/[0.04] text-amber-200 border border-amber-300/30 text-xs font-mono">
                <Sparkles className="w-3 h-3 mr-1 text-amber-300" />
                Collective Buying Pool
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {campaign.city}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight">
              Join {campaign.brand} {campaign.model}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Add your demand to the group. Currently <strong className="text-white">{campaign.currentBuyers} buyers</strong> joined ({campaign.targetBuyers - campaign.currentBuyers} remaining for Tier 3).
            </p>

            {/* Error Message Display */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setErrorMessage(null);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-300/40 transition-colors"
                  placeholder="e.g. Vikram Reddy"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-300/40 transition-colors font-mono"
                    placeholder="e.g. 9849023456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage(null);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-300/40 transition-colors"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    Color Preference
                  </label>
                  <select
                    value={colorPreference}
                    onChange={(e) => setColorPreference(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-300/40 transition-colors cursor-pointer"
                  >
                    <option value="Abyss Black" className="bg-slate-900 text-slate-200">Abyss Black</option>
                    <option value="Atlas White" className="bg-slate-900 text-slate-200">Atlas White</option>
                    <option value="Titan Grey" className="bg-slate-900 text-slate-200">Titan Grey</option>
                    <option value="Ranger Khaki" className="bg-slate-900 text-slate-200">Ranger Khaki</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">
                    Payment Preference
                  </label>
                  <select
                    value={financeRequirement}
                    onChange={(e) => setFinanceRequirement(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-sm focus:outline-none focus:border-amber-300/40 transition-colors cursor-pointer"
                  >
                    <option value="Bank Loan" className="bg-slate-900 text-slate-200">Bank Loan (SBI / HDFC / ICICI)</option>
                    <option value="Cash / Self" className="bg-slate-900 text-slate-200">Full Cash / Self Fund</option>
                    <option value="Lease" className="bg-slate-900 text-slate-200">Corporate Car Lease</option>
                  </select>
                </div>
              </div>

              {/* Zero-Risk Guarantee Note */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Lock-in:</strong> Participation expresses group intent. The refundable booking token (₹25,000) is paid directly to the winning showroom only after you review and accept the final quote.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-lg shadow-amber-500/10 transition-all duration-200 transform hover:scale-[1.01] flex items-center justify-center gap-2 border border-amber-200/50"
                >
                  {isSubmitting ? (
                    <span>Validating & Adding to Pool...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-slate-900" />
                      <span>Confirm & Join Group Buy</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Success Screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-1 tracking-tight">
                You&apos;re in the Group! 🎉
              </h3>
              <p className="text-xs text-slate-300 max-w-sm mx-auto">
                Welcome to the {campaign.city} {campaign.model} pool. The participant counter has updated to {campaign.currentBuyers} buyers.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] text-left space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Member Name:</span>
                <span className="text-white font-semibold">{fullName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Vehicle Model:</span>
                <span className="text-white font-semibold">{campaign.brand} {campaign.model} {campaign.variant}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Updated Group Size:</span>
                <span className="text-amber-200 font-mono font-bold">{campaign.currentBuyers} Buyers</span>
              </div>
            </div>

            {/* Honest Demo / Backend Status Box */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-left text-[11px] text-slate-400 flex items-start gap-2">
              <Database className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">
                  {isSupabaseConfigured ? 'Live Database Active: ' : 'Concierge Demo Notice: '}
                </span>
                <span>{backendMessage}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] transition-all flex items-center justify-center gap-2"
            >
              <span>Inspect Competing Dealer Quotes</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
