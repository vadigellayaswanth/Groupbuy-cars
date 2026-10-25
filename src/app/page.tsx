'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import CampaignCard from '@/components/campaigns/CampaignCard';
import FindGroupModal from '@/components/campaigns/FindGroupModal';
import {
  Sparkles,
  ShieldCheck,
  TrendingDown,
  Users,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Car,
  Building2,
  Search,
  MapPin,
  Tag,
  Scale,
  Award,
  ChevronRight,
} from 'lucide-react';
import { formatCrores, formatINR } from '@/lib/calculations';

export default function HomePage() {
  const { campaigns, offers } = useCampaignStore();
  const { user } = useAuthStore();
  const [findGroupModalOpen, setFindGroupModalOpen] = useState(false);

  const totalBuyers = campaigns.reduce((acc, c) => acc + c.currentBuyers, 0);
  const totalVolume = campaigns.reduce(
    (acc, c) => acc + c.currentBuyers * c.estimatedOnRoadPrice,
    0
  );

  return (
    <div className="space-y-28 pb-24">
      {/* LUXURY AUTOMOTIVE HERO SECTION */}
      <section className="relative pt-10 sm:pt-16 pb-20 overflow-hidden">
        {/* Cinematic Studio Lighting Ambience */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-amber-200/5 via-sky-400/5 to-transparent blur-[140px] rounded-full pointer-events-none"></div>
        <div className="absolute top-1/3 -right-20 w-[500px] h-[300px] bg-slate-400/5 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="site-container relative z-10 space-y-12">
          {/* Header & Main Positioning */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            {/* Sub-headline Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.03] border border-white/[0.08] text-slate-300 shadow-xl backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-300 uppercase tracking-wider text-[11px] font-mono">
                Collective Car Buying Concierge
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">Hyderabad Hub Active</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Stop Negotiating Alone.{' '}
              <br className="hidden sm:inline" />
              <span className="text-gradient-champagne">Buy Smarter Together.</span>
            </h1>

            {/* Value Proposition Description */}
            <p className="text-base sm:text-xl text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed">
              GroupBuy Cars connects car buyers within the same city into unified purchasing groups. 
              Dealerships compete with bulk-order discounts, while our AI unbundles hidden dealer add-ons into transparent cash savings.
            </p>

            {/* Primary & Secondary Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/campaigns"
                className="w-full sm:w-auto px-8 py-4 rounded-xl font-semibold text-sm text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-xl shadow-amber-500/10 transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 border border-amber-200/50"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Explore Group Deals</span>
                <ArrowRight className="w-4 h-4 text-slate-900" />
              </Link>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto px-7 py-4 rounded-xl font-medium text-sm text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] hover:border-white/[0.15] transition-all flex items-center justify-center gap-2"
              >
                <span>How It Works</span>
              </a>

              <Link
                href="/dealer"
                className="w-full sm:w-auto px-6 py-4 rounded-xl font-medium text-sm text-slate-400 hover:text-white bg-transparent hover:bg-white/[0.03] border border-transparent hover:border-white/[0.06] transition-all flex items-center justify-center gap-2"
              >
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>Dealership Portal</span>
              </Link>
            </div>
          </div>

          {/* Quick City & Car Discovery Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel p-3.5 sm:p-4 rounded-2xl border border-white/[0.08] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 bg-gradient-to-r from-white/[0.03] via-white/[0.01] to-white/[0.03]">
              <div className="flex items-center gap-3 w-full md:w-auto px-2">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-amber-300 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
                    Select Your City & Preferences
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <span>{user?.city || 'Hyderabad'}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-slate-300 text-xs">Creta, Nexon EV, Brezza & more</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <button
                  onClick={() => setFindGroupModalOpen(true)}
                  className="w-full md:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.1] hover:border-amber-200/40 transition-all flex items-center justify-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-amber-300/80" />
                  <span>Match My Car Group</span>
                </button>
              </div>
            </div>
          </div>

          {/* High-End 3D Automotive Visual Showcase */}
          <div className="max-w-5xl mx-auto perspective-container pt-2">
            <div className="relative rounded-3xl overflow-hidden glass-panel border border-white/[0.1] shadow-2xl bg-gradient-to-b from-white/[0.03] to-[#040608] group">
              {/* Studio Backdrop Light Bar */}
              <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-200/40 to-transparent"></div>

              <div className="relative h-64 sm:h-96 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1600&q=80"
                  alt="Hyundai Creta Group Negotiation Showcase"
                  className="w-full h-full object-cover object-center group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05070a] via-[#05070a]/30 to-transparent"></div>

                {/* Floating Showcase Badges */}
                <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="badge-pill bg-black/70 backdrop-blur-md text-amber-200 border border-amber-300/30 text-[11px] font-mono">
                      🔥 Most Popular Group • Hyderabad
                    </span>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Hyundai Creta SX(O) Petrol IVT
                    </h3>
                    <p className="text-xs text-slate-400">
                      17 verified buyers pooled together into ₹3.47 Crore leverage
                    </p>
                  </div>

                  <Link
                    href="/campaigns/hyundai-creta-sxo-at"
                    className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-amber-200 hover:bg-white shadow-lg transition-all duration-200 flex items-center gap-1.5 shrink-0"
                  >
                    <span>Inspect Pool & Bids</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-900" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Refined Live Metrics HUD */}
          <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                Verified Buyers
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-1">
                {totalBuyers}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Across 3 live clusters</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                Order Volume
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono mt-1">
                {formatCrores(totalVolume)}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Collective bargaining clout</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                Max Cash Cut
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-200 font-mono mt-1">
                ₹70,000
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Direct invoice reduction</div>
            </div>

            <div className="glass-panel p-5 rounded-2xl text-center border border-white/[0.06] hover:border-white/[0.12] transition-colors">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">
                Active Hub
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-200 font-mono mt-1">
                Hyderabad
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Demonstration city</div>
            </div>
          </div>
        </div>
      </section>

      {/* THREE-STEP CUSTOMER JOURNEY */}
      <section id="how-it-works" className="site-container space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/[0.08] text-[11px] font-mono">
            Clear 3-Step Journey
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            How Group Car Buying Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            From individual search to collective dealership savings in three transparent stages.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] space-y-4 relative group hover:border-white/[0.16] transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-base text-amber-200">
              01
            </div>
            <h3 className="text-lg font-bold text-white">1. Choose Your Car</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Select your city, preferred brand, and variant. Find active groups matching your exact car preference, or request a new demand cluster with zero upfront cost.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300/80" />
              <span>Zero lock-in commitment</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] space-y-4 relative group hover:border-white/[0.16] transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-base text-slate-200">
              02
            </div>
            <h3 className="text-lg font-bold text-white">2. Join a Buying Group</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Pool together with fellow buyers in your city. As the group size grows across volume milestones (5+, 15+, 20+ buyers), larger discount tiers unlock automatically.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bulk purchasing leverage</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-8 rounded-2xl border border-white/[0.08] space-y-4 relative group hover:border-white/[0.16] transition-all">
            <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center font-mono font-bold text-base text-amber-300">
              03
            </div>
            <h3 className="text-lg font-bold text-white">3. Compare Dealer Offers</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dealerships submit competitive bids to win the collective pool. Our AI Deal Coach analyzes every proposal, separating real cash discounts from accessory inflation.
            </p>
            <div className="pt-2 text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-300/80" />
              <span>AI-verified invoice cuts</span>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVE CAMPAIGNS SPOTLIGHT */}
      <section className="site-container space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/[0.08] text-[11px] font-mono mb-2">
              <Car className="w-3.5 h-3.5 mr-1 text-amber-300" />
              Active Hyderabad Clusters
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Trending Group Campaigns
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Join active buyer pools or inspect verified showroom quotations.
            </p>
          </div>

          <Link
            href="/campaigns"
            className="text-xs font-semibold text-slate-300 hover:text-amber-200 flex items-center gap-1.5 transition-colors self-start md:self-auto"
          >
            <span>View All Campaigns</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Campaign Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {campaigns.map((camp) => {
            const campOffers = offers.filter((o) => o.campaignId === camp.id);
            return (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                offersCount={campOffers.length}
              />
            );
          })}
        </div>
      </section>

      {/* PROBLEM VS SOLUTION COMPARISON */}
      <section className="site-container">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/[0.08] text-[11px] font-mono">
            <Scale className="w-3.5 h-3.5 mr-1 text-slate-400" />
            Market Inefficiency
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Solo Negotiation vs. Group Clout
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Why negotiating for one vehicle places the customer at an extreme information disadvantage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Traditional Way */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-red-500/15 space-y-5 bg-gradient-to-b from-red-500/[0.02] to-transparent">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-400 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Buying Individually (The Asymmetry)
              </h3>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Bargaining Clout:</strong> You negotiate alone for 1 car. Dealerships have zero reason to provide real invoice cuts.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Accessory Markups:</strong> Sales teams offer inflated accessory bundles with high retail tags but little actual cost.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Tied Insurance Policies:</strong> Dealerships often mandate expensive in-house policies, charging extra fees above open-market rates.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Time-Consuming Showroom Visits:</strong> Spending weekends driving between multiple dealerships with zero transparent comparisons.
                </span>
              </li>
            </ul>
          </div>

          {/* GroupBuy Cars Way */}
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-amber-300/25 space-y-5 bg-gradient-to-b from-amber-200/[0.02] to-transparent shadow-xl">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400/10 text-amber-300 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">
                Via GroupBuy Cars (The Concierge Edge)
              </h3>
            </div>
            <ul className="space-y-3.5 text-xs text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Fleet-Scale Leverage:</strong> Multiple buyers aggregate into multi-crore order volume, motivating dealers to offer bulk prices.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong>AI Fine-Print Analysis:</strong> The AI Offer Analyzer unbundles true cash savings from cosmetic accessories and warranty packages.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong>Digital Structured Bids:</strong> Certified dealerships submit formal offers through a standardized, verified portal.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span>
                  <strong>100% Risk-Free Exploration:</strong> Zero upfront payment or lock-in to join active pools or review incoming offers.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="site-container">
        <div className="glass-panel rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden border border-white/[0.1] shadow-2xl bg-gradient-to-b from-white/[0.02] to-[#040608]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-200/5 blur-[120px] rounded-full pointer-events-none"></div>

          <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/[0.08] text-[11px] font-mono">
            Join the Active Pilot
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white max-w-2xl mx-auto leading-tight">
            Stop Negotiating Alone. Start Saving as a Fleet.
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Experience our active Hyundai Creta (17/20 buyers), Tata Nexon EV, and Maruti Brezza groups with live bids and AI deal analysis.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/campaigns/hyundai-creta-sxo-at"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 transition-all shadow-xl shadow-amber-500/10"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Inspect Hyundai Creta Group Deal</span>
              <ArrowRight className="w-4 h-4 text-slate-900" />
            </Link>

            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="px-6 py-4 rounded-xl font-medium text-sm text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all"
            >
              <span>Match Another Vehicle</span>
            </button>
          </div>
        </div>
      </section>

      {/* Global Interactive "Find My Car Group" Modal */}
      <FindGroupModal
        isOpen={findGroupModalOpen}
        onClose={() => setFindGroupModalOpen(false)}
      />
    </div>
  );
}
