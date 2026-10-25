import React from 'react';
import Link from 'next/link';
import { CarCampaign } from '@/lib/types';
import { formatINR } from '@/lib/calculations';
import TierProgressBar from './TierProgressBar';
import { ShieldCheck, Tag, ArrowRight, Users, CheckCircle2, ShoppingBag } from 'lucide-react';

interface CampaignCardProps {
  campaign: CarCampaign;
  offersCount?: number;
}

export default function CampaignCard({ campaign, offersCount = 0 }: CampaignCardProps) {
  const unlockedTiers = campaign.tiers.filter((t) => campaign.currentBuyers >= t.minBuyers);
  const currentMaxDiscount = unlockedTiers.length > 0
    ? unlockedTiers[unlockedTiers.length - 1].discountTarget
    : campaign.tiers[0].discountTarget;

  const isClosed = campaign.status === 'completed' || campaign.status === 'closed';

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col group border border-white/[0.08] hover:border-white/[0.16] card-3d-tilt transition-all duration-300">
      {/* Vehicle Image Header */}
      <div className="relative h-52 w-full overflow-hidden bg-slate-950">
        <img
          src={campaign.imageUrl}
          alt={`${campaign.brand} ${campaign.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#090d14] via-[#090d14]/20 to-black/50"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
          <span className="badge-pill bg-black/70 backdrop-blur-md text-slate-200 border border-white/10 text-[11px] font-mono">
            {campaign.brand}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`badge-pill backdrop-blur-md text-[10px] font-semibold uppercase font-mono ${
                isClosed
                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                  : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}
            >
              {campaign.status}
            </span>
            <span className="badge-pill bg-white/[0.05] backdrop-blur-md text-slate-300 border border-white/10 text-[10px] font-mono">
              {campaign.fuelType}
            </span>
          </div>
        </div>

        {/* Unlocked Discount Floating Pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/80 backdrop-blur-md border border-amber-300/30 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold shadow-md">
          <Tag className="w-3.5 h-3.5 text-amber-300" />
          <span>Tier Target (Est.): ~{formatINR(currentMaxDiscount)}</span>
        </div>
      </div>

      {/* Card Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          {/* Title & Variant */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg font-bold text-white group-hover:text-amber-200 transition-colors">
              {campaign.brand} {campaign.model}
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-full border border-white/[0.08]">
              {campaign.city}
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium mb-3">
            {campaign.variant}
          </p>

          {/* Pricing Row */}
          <div className="flex items-baseline justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] mb-3">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Est. On-Road Price
              </div>
              <div className="text-base font-bold text-white font-mono">
                {formatINR(campaign.estimatedOnRoadPrice)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                Ex-Showroom
              </div>
              <div className="text-xs font-mono text-slate-400">
                {formatINR(campaign.exShowroomPrice)}
              </div>
            </div>
          </div>

          {/* 4 Separate Counts (Requirement 3) */}
          <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/40 border border-white/[0.05] mb-3 text-center text-xs font-mono">
            <div>
              <div className="text-[9px] text-slate-400 font-sans">1. Joined</div>
              <div className="font-bold text-white">{campaign.currentBuyers}</div>
            </div>
            <div>
              <div className="text-[9px] text-amber-300 font-sans">2. Interested</div>
              <div className="font-bold text-amber-200">{campaign.interestedCount || 0}</div>
            </div>
            <div>
              <div className="text-[9px] text-emerald-400 font-sans">3. Confirmed</div>
              <div className="font-bold text-emerald-400">{campaign.confirmedBookingsCount || 0}</div>
            </div>
          </div>

          {/* Progress towards group target */}
          <TierProgressBar
            currentBuyers={campaign.currentBuyers}
            targetBuyers={campaign.targetBuyers}
            tiers={campaign.tiers}
            compact={true}
          />
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-slate-300" />
            <span>
              <strong className="text-white">{offersCount}</strong> Live Quote{offersCount !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isClosed && (
              <Link
                href={`/campaigns/${campaign.id}?join=true`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-100 to-amber-200 hover:from-white hover:to-amber-100 shadow-sm transition-all duration-200"
              >
                <span>Join Pool</span>
              </Link>
            )}

            <Link
              href={`/campaigns/${campaign.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-200 hover:text-white bg-white/[0.05] hover:bg-white/[0.12] border border-white/[0.1] hover:border-amber-200/30 transition-all duration-200 group/btn"
            >
              <span>{isClosed ? 'View Records' : 'View Deal'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-200 group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
