'use client';

import React, { useState } from 'react';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import CampaignCard from '@/components/campaigns/CampaignCard';
import FindGroupModal from '@/components/campaigns/FindGroupModal';
import { Search, Filter, MapPin, Sparkles, Car, SlidersHorizontal, RotateCcw, ShieldCheck, PlusCircle } from 'lucide-react';
import { City } from '@/lib/types';
import { formatINR } from '@/lib/calculations';

const CITIES: City[] = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Delhi-NCR'];

export default function CampaignsPage() {
  const { campaigns, offers, dealers } = useCampaignStore();
  const { user } = useAuthStore();

  const [search, setSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedFuel, setSelectedFuel] = useState('All');
  const [selectedTransmission, setSelectedTransmission] = useState('All');
  const [maxBudget, setMaxBudget] = useState<number>(3000000);
  const [findGroupModalOpen, setFindGroupModalOpen] = useState(false);

  // Extract unique brands dynamically from campaigns
  const uniqueBrands = ['All', ...Array.from(new Set(campaigns.map((c) => c.brand)))];

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch =
      camp.brand.toLowerCase().includes(search.toLowerCase()) ||
      camp.model.toLowerCase().includes(search.toLowerCase()) ||
      camp.variant.toLowerCase().includes(search.toLowerCase());

    const matchesCity = selectedCity === 'All' || camp.city === selectedCity;
    const matchesBrand = selectedBrand === 'All' || camp.brand === selectedBrand;
    const matchesFuel = selectedFuel === 'All' || camp.fuelType === selectedFuel;
    const matchesTransmission = selectedTransmission === 'All' || camp.transmission === selectedTransmission;
    const matchesBudget = camp.estimatedOnRoadPrice <= maxBudget;

    return matchesSearch && matchesCity && matchesBrand && matchesFuel && matchesTransmission && matchesBudget;
  });

  const resetFilters = () => {
    setSearch('');
    setSelectedCity('All');
    setSelectedBrand('All');
    setSelectedFuel('All');
    setSelectedTransmission('All');
    setMaxBudget(3000000);
  };

  const hasActiveFilters =
    search !== '' ||
    selectedCity !== 'All' ||
    selectedBrand !== 'All' ||
    selectedFuel !== 'All' ||
    selectedTransmission !== 'All' ||
    maxBudget < 3000000;

  return (
    <div className="site-container py-10 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge-pill bg-white/[0.04] text-slate-300 border border-white/[0.08] text-[11px] font-mono">
            <MapPin className="w-3.5 h-3.5 mr-1 text-amber-300" />
            Verified Metropolitan Hubs
          </span>
          <span className="text-xs text-slate-400 font-mono">
            {campaigns.length} Active Demand Clusters
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-[11px] text-slate-400 font-mono">Simulated Demo Data</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Find Your Next Car. <span className="text-gradient-champagne">Unlock a Better Deal.</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-2 leading-relaxed">
              Explore active collective car buying clusters in your city. Pool together with verified buyers to unlock tier-based dealership fleet discounts and AI-verified invoice quotes.
            </p>
          </div>

          <button
            onClick={() => setFindGroupModalOpen(true)}
            className="self-start md:self-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-md transition-all shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Custom Car Pool</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-white/[0.08] space-y-4">
        {/* Top Row: Search and City Filter */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by brand or model (e.g. Creta, Nexon EV, Brezza)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/[0.08] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-300/40 transition-colors"
            />
          </div>

          {/* City Selection Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-[11px] text-slate-400 font-semibold font-mono hidden lg:inline mr-1">City:</span>
            {['All', ...CITIES].map((city) => (
              <button
                key={city}
                onClick={() => setSelectedCity(city)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                  selectedCity === city
                    ? 'bg-amber-200/20 text-amber-200 border border-amber-300/40 font-semibold'
                    : 'bg-white/[0.03] text-slate-300 hover:bg-white/[0.08] border border-white/[0.06]'
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Granular Filters (Brand, Fuel, Transmission, Budget) */}
        <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Brand Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium font-mono">Brand:</span>
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-black/60 border border-white/[0.08] text-slate-200 focus:outline-none focus:border-amber-300/40 cursor-pointer"
              >
                {uniqueBrands.map((b) => (
                  <option key={b} value={b} className="bg-slate-900 text-slate-200">
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuel Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium font-mono">Fuel:</span>
              <select
                value={selectedFuel}
                onChange={(e) => setSelectedFuel(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-black/60 border border-white/[0.08] text-slate-200 focus:outline-none focus:border-amber-300/40 cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-slate-200">All Fuels</option>
                <option value="Petrol" className="bg-slate-900 text-slate-200">Petrol</option>
                <option value="EV" className="bg-slate-900 text-slate-200">EV</option>
                <option value="Diesel" className="bg-slate-900 text-slate-200">Diesel</option>
                <option value="Hybrid" className="bg-slate-900 text-slate-200">Hybrid</option>
              </select>
            </div>

            {/* Transmission Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-medium font-mono">Gearbox:</span>
              <select
                value={selectedTransmission}
                onChange={(e) => setSelectedTransmission(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs bg-black/60 border border-white/[0.08] text-slate-200 focus:outline-none focus:border-amber-300/40 cursor-pointer"
              >
                <option value="All" className="bg-slate-900 text-slate-200">All</option>
                <option value="Automatic" className="bg-slate-900 text-slate-200">Automatic</option>
                <option value="Manual" className="bg-slate-900 text-slate-200">Manual</option>
              </select>
            </div>

            {/* Budget Slider */}
            <div className="flex items-center gap-2 pl-2">
              <span className="text-[11px] text-slate-400 font-medium font-mono">Max Budget:</span>
              <span className="text-xs font-mono font-semibold text-slate-200">{formatINR(maxBudget)}</span>
              <input
                type="range"
                min={1000000}
                max={3000000}
                step={100000}
                value={maxBudget}
                onChange={(e) => setMaxBudget(Number(e.target.value))}
                className="w-24 accent-amber-300 cursor-pointer"
              />
            </div>
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Campaigns Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredCampaigns.map((camp) => {
            const verifiedDealerIds = new Set(
              dealers.filter((d) => d.verificationStatus === 'verified').map((d) => d.id)
            );
            const campOffers = offers.filter(
              (o) => o.campaignId === camp.id && o.status === 'approved' && verifiedDealerIds.has(o.dealerId)
            );
            return (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                offersCount={campOffers.length}
              />
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-14 text-center rounded-2xl border border-white/[0.08] space-y-4 max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-slate-400 mx-auto">
            <Car className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white">No Matching Campaigns Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There are currently no active buying pools in <strong className="text-white">{selectedCity}</strong> matching your selected criteria. You can clear filters or start a new buyer pool.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={resetFilters}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] transition-all"
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 transition-all flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Create This Group Pool</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Find Group Modal */}
      <FindGroupModal
        isOpen={findGroupModalOpen}
        onClose={() => setFindGroupModalOpen(false)}
      />
    </div>
  );
}
