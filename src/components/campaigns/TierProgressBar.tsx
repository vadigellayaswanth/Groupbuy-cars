import React from 'react';
import { VolumeTier } from '@/lib/types';
import { formatINR } from '@/lib/calculations';
import { CheckCircle2, Lock, Sparkles, AlertCircle, Info } from 'lucide-react';

interface TierProgressBarProps {
  currentBuyers: number;
  targetBuyers: number;
  tiers: VolumeTier[];
  compact?: boolean;
}

export default function TierProgressBar({
  currentBuyers,
  targetBuyers,
  tiers,
  compact = false,
}: TierProgressBarProps) {
  const percentage = Math.min(100, Math.round((currentBuyers / targetBuyers) * 100));

  // Find next tier to unlock
  const nextTier = tiers.find((t) => currentBuyers < t.minBuyers);
  const buyersNeeded = nextTier ? nextTier.minBuyers - currentBuyers : 0;

  return (
    <div className="space-y-3">
      {/* Top Header stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-300"></span>
          <span>
            <strong className="text-white font-mono text-sm">{currentBuyers}</strong> / {targetBuyers} Buyers Joined
            {buyersNeeded > 0 && (
              <span className="text-amber-200/90 ml-1.5 font-medium">
                ({buyersNeeded} remaining to reach Tier 3)
              </span>
            )}
          </span>
        </div>
        <span className="font-mono font-semibold text-slate-200 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.08] text-[11px]">
          {percentage}% Complete
        </span>
      </div>

      {/* Progress Track */}
      <div className="relative w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-white/[0.06]">
        <div
          className="h-full bg-gradient-to-r from-amber-200 via-amber-300 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Callout: buyers needed for next milestone */}
      {nextTier && !compact && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-500/5 border border-cyan-500/15 text-[11px] text-cyan-300">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>
              <strong>{buyersNeeded} more buyer{buyersNeeded > 1 ? 's' : ''}</strong> needed to unlock{' '}
              <strong>{nextTier.label}</strong>
            </span>
          </div>
          <span className="font-mono font-bold text-emerald-400">
            {formatINR(nextTier.discountTarget)} Target
          </span>
        </div>
      )}

      {/* Tiers Milestone Pills */}
      {!compact && (
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-3 gap-2">
            {tiers.map((tier, idx) => {
              const isUnlocked = currentBuyers >= tier.minBuyers;
              return (
                <div
                  key={tier.label}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isUnlocked
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10'
                      : 'bg-white/[0.02] border-white/5 text-gray-500'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {isUnlocked ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3 h-3 text-gray-500 shrink-0" />
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                      Tier {idx + 1}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-bold text-white">
                    {formatINR(tier.discountTarget)}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono">
                    {tier.minBuyers}+ Buyers {isUnlocked ? '✓ Unlocked' : `(${tier.minBuyers - currentBuyers} left)`}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Explicit Disclaimer and Requirement Notice as required by prompt */}
          <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-gray-400 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-300/90 font-semibold">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Illustrative campaign targets — not guaranteed discounts</span>
            </div>
            <p className="text-[10px] leading-relaxed text-gray-400 pl-5">
              Requirements for actual dealer discounts: Group reaches target quorum, dealerships submit competitive quotes, and individual buyers confirm with a refundable token advance (₹25,000) paid directly to the winning showroom.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
