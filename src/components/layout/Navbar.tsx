'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  MapPin,
  Sparkles,
  RotateCcw,
  Menu,
  X,
  Car,
  User,
  Building2,
  ShieldAlert,
  ChevronDown,
  Users,
  Search,
  FileCheck,
  KeyRound,
} from 'lucide-react';
import { useCampaignStore } from '@/lib/campaign-store';
import { useAuthStore } from '@/lib/auth-store';
import FindGroupModal from '@/components/campaigns/FindGroupModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { resetToDemoDefaults } = useCampaignStore();
  const {
    user,
    role,
    switchPersona,
    isBuyer,
    isDealer,
    isVerificationStaff,
    isOfferManager,
    isSuperAdmin,
    hasStaffPrivileges,
  } = useAuthStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [findGroupModalOpen, setFindGroupModalOpen] = useState(false);

  const navLinks = [
    { name: 'Discover Groups', href: '/campaigns' },
    { name: 'Buyer Portal', href: '/buyer', icon: Users },
    { name: 'Dealer Portal', href: '/dealer', icon: Building2 },
    {
      name: isVerificationStaff && !isSuperAdmin
        ? 'Verification Board'
        : isOfferManager && !isSuperAdmin
        ? 'Offer Review Board'
        : 'Admin Board',
      href: '/admin',
      icon: isVerificationStaff ? FileCheck : isOfferManager ? ShieldCheck : KeyRound,
      privileged: true,
    },
  ];

  const handleReset = () => {
    if (confirm('Reset demo state back to default (17/20 Creta buyers with verified dealerships)?')) {
      resetToDemoDefaults();
      alert('Demo data successfully reset to baseline!');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 glass-nav">
        <div className="site-container h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-slate-200 via-slate-400 to-amber-200/40 p-[1px] shadow-lg shadow-black/40 group-hover:shadow-amber-500/10 transition-all">
              <div className="w-full h-full bg-[#070b12] rounded-[11px] flex items-center justify-center border border-white/10 group-hover:border-amber-200/30 transition-colors">
                <Car className="w-5 h-5 text-slate-100 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white font-mono">
                  GROUPBUY<span className="text-gradient-champagne">CARS</span>
                </span>
                <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-300 border border-white/10 shadow-sm uppercase font-mono">
                  Concierge
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide font-medium">
                Collective Automotive Negotiation
              </p>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-md">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/[0.08] border border-white/[0.12] shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5 opacity-70" />}
                  <span>{link.name}</span>
                  {link.privileged && (
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-mono ${
                        isSuperAdmin
                          ? 'bg-purple-500/10 text-purple-300 border-purple-500/20'
                          : isVerificationStaff
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}
                    >
                      Staff
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* City Quick Badge Indicator */}
            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.08] transition-all"
              title="Click to change city or car preference"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300/80" />
              <span>{user?.city || 'Hyderabad'}</span>
            </button>

            {/* Find My Car Group Quick Trigger */}
            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-all hover:text-white"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Find Group</span>
            </button>

            {/* Role Persona Switcher Dropdown (5 Roles) */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  isSuperAdmin
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    : isVerificationStaff
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : isOfferManager
                    ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                    : isDealer
                    ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
                title="Switch persona to test multi-role governance"
              >
                {isSuperAdmin ? (
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" />
                ) : isVerificationStaff ? (
                  <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                ) : isOfferManager ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                ) : isDealer ? (
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span className="capitalize text-[11px]">
                  {isSuperAdmin
                    ? 'Super Admin'
                    : isVerificationStaff
                    ? 'Staff (KYC)'
                    : isOfferManager
                    ? 'Offer Manager'
                    : isDealer
                    ? (user?.dealershipName?.split(' ')[0] || 'Dealer')
                    : 'Buyer (Rahul)'}
                </span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel p-2.5 shadow-2xl z-50 border border-white/10 space-y-1 animate-fadeIn">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400 px-2.5 py-1 font-semibold flex items-center justify-between border-b border-white/10 pb-2 mb-1">
                    <span>Role Persona Switcher</span>
                    <span className="text-[9px] text-cyan-400 font-mono">5 RBAC Roles</span>
                  </div>

                  {/* 1. Buyer */}
                  <button
                    onClick={() => {
                      switchPersona('buyer');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      isBuyer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Rahul Sharma</div>
                        <div className="text-[10px] text-gray-400">1. Buyer (Search, Join, Book)</div>
                      </div>
                    </div>
                    {isBuyer && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>}
                  </button>

                  {/* 2. Dealer A */}
                  <button
                    onClick={() => {
                      switchPersona('dealer-a');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      user?.dealershipId === 'dealer-a-kun' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold">KUN United Hyundai</div>
                        <div className="text-[10px] text-gray-400">2. Dealer GM (Branch Quotes)</div>
                      </div>
                    </div>
                    {user?.dealershipId === 'dealer-a-kun' && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                  </button>

                  {/* 3. Dealer B */}
                  <button
                    onClick={() => {
                      switchPersona('dealer-b');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      user?.dealershipId === 'dealer-b-talwar' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Talwar Hyundai</div>
                        <div className="text-[10px] text-gray-400">2. Competitor Dealer GM</div>
                      </div>
                    </div>
                    {user?.dealershipId === 'dealer-b-talwar' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>}
                  </button>

                  {/* 4. Verification Staff */}
                  <button
                    onClick={() => {
                      switchPersona('verification-staff');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      isVerificationStaff && !isSuperAdmin ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Ananya Sen</div>
                        <div className="text-[10px] text-gray-400">3. Verification Staff (Accreditation)</div>
                      </div>
                    </div>
                    {isVerificationStaff && !isSuperAdmin && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  </button>

                  {/* 5. Platform Offer Manager */}
                  <button
                    onClick={() => {
                      switchPersona('offer-manager');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      isOfferManager && !isSuperAdmin ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Vikram Malhotra</div>
                        <div className="text-[10px] text-gray-400">4. Platform Offer Manager</div>
                      </div>
                    </div>
                    {isOfferManager && !isSuperAdmin && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>}
                  </button>

                  {/* 6. Super Admin */}
                  <button
                    onClick={() => {
                      switchPersona('super-admin');
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                      isSuperAdmin ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-purple-400 flex-shrink-0" />
                      <div>
                        <div className="font-bold">Super Admin</div>
                        <div className="text-[10px] text-gray-400">5. Chief Platform Admin</div>
                      </div>
                    </div>
                    {isSuperAdmin && <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>}
                  </button>

                  <div className="pt-1.5 border-t border-white/10 px-2 text-[10px] text-gray-400">
                    ⚡ Strict Role Boundaries enforced.
                  </div>
                </div>
              )}
            </div>

            {/* Reset Demo State Button */}
            <button
              onClick={handleReset}
              title="Reset demo data to 17/20 Creta baseline"
              className="p-2 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors hidden sm:flex items-center gap-1 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Reset</span>
            </button>

            {/* Primary CTA: Join / Find Group */}
            <button
              onClick={() => setFindGroupModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-slate-900 bg-gradient-to-r from-amber-100 via-amber-200 to-amber-300 hover:from-white hover:to-amber-200 shadow-md shadow-amber-500/10 transition-all duration-200 transform hover:scale-[1.02] border border-amber-200/50"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-900" />
              <span>Find Group</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white bg-white/5 border border-white/10"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass-panel border-t border-white/10 px-4 pt-3 pb-6 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-gray-200 hover:bg-white/5"
              >
                <span>{link.name}</span>
                {link.privileged && (
                  <span className="text-[10px] text-cyan-400 uppercase font-mono">Staff Only</span>
                )}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setFindGroupModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-black bg-gradient-to-r from-cyan-400 to-emerald-400"
              >
                <Sparkles className="w-4 h-4" />
                <span>Find My Car Group</span>
              </button>
              <button
                onClick={() => {
                  handleReset();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 bg-white/5 border border-white/10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo State (17/20)</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Global Interactive "Find My Car Group" Modal */}
      <FindGroupModal
        isOpen={findGroupModalOpen}
        onClose={() => setFindGroupModalOpen(false)}
      />
    </>
  );
}
