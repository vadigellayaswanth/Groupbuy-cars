'use client';

import React from 'react';
import { AlertCircle, MapPin } from 'lucide-react';

export default function DemoBanner() {
  return (
    <div className="bg-[#090d14]/90 border-b border-white/[0.06] px-4 py-2 text-xs text-slate-400">
      <div className="site-container flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80"></span>
          <span className="font-semibold tracking-wide uppercase text-[10px] text-slate-300">
            Concierge Demonstration
          </span>
          <span className="text-slate-600">•</span>
          <span className="hidden md:inline text-slate-400 text-[11px]">
            Vehicle campaigns and quotes reflect simulated demo structures for collective bargaining.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] bg-white/[0.03] px-2.5 py-0.5 rounded-full border border-white/[0.08]">
          <MapPin className="w-3 h-3 text-amber-300/80" />
          <span>Active Hub: Hyderabad</span>
        </div>
      </div>
    </div>
  );
}
