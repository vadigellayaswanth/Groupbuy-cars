'use client';

import React, { useState } from 'react';
import { CarCampaign } from '@/lib/types';
import { generateNegotiationBrief } from '@/lib/ai/gemini';
import { formatCrores, formatINR } from '@/lib/calculations';
import { X, Copy, Check, FileText, Sparkles, Building2, Users } from 'lucide-react';

interface RfqModalProps {
  campaign: CarCampaign;
  isOpen: boolean;
  onClose: () => void;
}

export default function RfqModal({ campaign, isOpen, onClose }: RfqModalProps) {
  const [copied, setCopied] = useState(false);
  const targetRebate = campaign.tiers[campaign.tiers.length - 1]?.discountTarget || 75000;
  const { briefText, totalMarketValue } = generateNegotiationBrief(campaign, targetRebate);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(briefText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl overflow-hidden border border-white/15 shadow-2xl p-6 sm:p-8 flex flex-col max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-pill bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Dealership RFQ Generator
          </span>
          <span className="text-xs text-gray-400 font-mono">
            {campaign.city} Fleet Batch
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
          Dealer Negotiation Brief
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          A high-impact executive Request for Quotation (RFQ) formatted for dealership General Managers and Fleet Heads.
        </p>

        {/* Metrics Banner */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/10 mb-4 text-center">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Buyer Pool
            </div>
            <div className="text-lg font-bold text-cyan-400 font-mono">
              {campaign.currentBuyers} Buyers
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Total Order Volume
            </div>
            <div className="text-lg font-bold text-emerald-400 font-mono">
              {formatCrores(totalMarketValue)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Target Cash Cut
            </div>
            <div className="text-lg font-bold text-white font-mono">
              {formatINR(targetRebate)} Target
            </div>
          </div>
        </div>

        {/* RFQ Document View */}
        <div className="flex-1 overflow-y-auto p-4 rounded-xl bg-black/60 border border-white/5 font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap select-all">
          {briefText}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-white/10 mt-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-400 hidden sm:block">
            Share this document directly with dealership sales heads in {campaign.city}.
          </p>

          <button
            onClick={handleCopy}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs text-black bg-cyan-400 hover:bg-cyan-300 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-400/20"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-950" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy RFQ Document</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
