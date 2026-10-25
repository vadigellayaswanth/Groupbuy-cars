import React from 'react';
import Link from 'next/link';
import { Car, ShieldCheck, Sparkles, Terminal } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#040608] text-slate-400 text-sm mt-28">
      <div className="site-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-200 via-slate-400 to-amber-200/40 p-[1px] shadow-sm">
                <div className="w-full h-full bg-[#070b12] rounded-[7px] flex items-center justify-center">
                  <Car className="w-4 h-4 text-slate-200" />
                </div>
              </div>
              <span className="text-lg font-bold text-white font-mono">
                GROUPBUY<span className="text-gradient-champagne">CARS</span>
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              GroupBuy Cars consolidates car buyer volume within key metropolitan hubs into unified bargaining power, bringing digital showroom clarity and transparent dealership negotiations to individual customers.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/[0.03] text-slate-300 border border-white/[0.08]">
                <Sparkles className="w-3 h-3 text-amber-300/80" />
                Next-Gen Automotive Marketplace
              </span>
            </div>
          </div>

          {/* Quick Demo Navigation */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-slate-200 font-semibold mb-4 font-mono">
              Active Clusters
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link
                  href="/campaigns/hyundai-creta-sxo-at"
                  className="hover:text-amber-200 transition-colors flex items-center justify-between group"
                >
                  <span className="text-slate-300 group-hover:text-white">Hyundai Creta SX(O)</span>
                  <span className="text-amber-300/90 font-mono text-[11px]">17/20 Joined</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/campaigns/tata-nexon-ev-empowered"
                  className="hover:text-amber-200 transition-colors flex items-center justify-between group"
                >
                  <span className="text-slate-300 group-hover:text-white">Tata Nexon EV LR</span>
                  <span className="text-emerald-400 font-mono text-[11px]">11/15 Joined</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/campaigns/maruti-brezza-zxi"
                  className="hover:text-amber-200 transition-colors flex items-center justify-between group"
                >
                  <span className="text-slate-300 group-hover:text-white">Maruti Brezza ZXi</span>
                  <span className="text-slate-400 font-mono text-[11px]">8/25 Joined</span>
                </Link>
              </li>
              <li className="pt-2">
                <Link
                  href="/dealer"
                  className="text-slate-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors"
                >
                  <Terminal className="w-3 h-3 text-slate-400" />
                  <span>Dealer Quote Console →</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Transparency & AI Architecture */}
          <div>
            <h4 className="text-[11px] uppercase tracking-wider text-slate-200 font-semibold mb-4 font-mono">
              Transparency & AI
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                <span>Deterministic invoice math calculated client and server side.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                <span>AI deal coach detects accessories inflation and unbundles real cash cuts.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                <span>Zero lock-in commitment for buyers exploring active pools.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 GroupBuy Cars. Premium Automotive Group Buying Platform.</p>
          <p className="font-mono text-[11px] text-slate-400">
            Active Hub: <span className="text-amber-200/90 font-medium">Hyderabad, Telangana</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
