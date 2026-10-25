'use client';

import { useSyncExternalStore } from 'react';
import { UserProfile, UserRole, BuyerPreferences } from './types';
import { isSupabaseConfigured, supabase } from './supabase/client';

const STORAGE_KEY_AUTH = 'groupbuy_cars_auth_v5';

export const DEMO_PERSONAS: Record<string, UserProfile> = {
  buyer: {
    id: 'user-buyer-rahul',
    email: 'rahul.sharma@example.com',
    fullName: 'Rahul Sharma',
    phone: '+91 98765 43210',
    role: 'buyer',
    city: 'Hyderabad',
    preferences: {
      city: 'Hyderabad',
      preferredBrand: 'Hyundai',
      preferredModel: 'Creta',
      fuelType: 'Petrol',
      transmission: 'Automatic',
      budgetMin: 1800000,
      budgetMax: 2200000,
      timelineDays: 30,
    },
    createdAt: '2026-10-24T08:00:00Z',
  },
  'dealer-a': {
    id: 'user-dealer-kun',
    email: 'fleet@kunhyundai.com',
    fullName: 'Rajesh Varma (Fleet Sales GM)',
    phone: '+91 98490 11223',
    role: 'dealer',
    dealershipId: 'dealer-a-kun',
    dealershipName: 'KUN United Hyundai',
    branchId: 'branch-kun-jubilee',
    createdAt: '2026-10-20T09:00:00Z',
  },
  'dealer-b': {
    id: 'user-dealer-talwar',
    email: 'fleet@talwarhyundai.com',
    fullName: 'Priya Sharma (Corporate GM)',
    phone: '+91 97000 44556',
    role: 'dealer',
    dealershipId: 'dealer-b-talwar',
    dealershipName: 'Talwar Hyundai',
    branchId: 'branch-talwar-somajiguda',
    createdAt: '2026-10-21T10:00:00Z',
  },
  'verification-staff': {
    id: 'user-staff-ananya',
    email: 'verification@groupbuycars.internal',
    fullName: 'Ananya Sen (Dealer Accreditation Lead)',
    phone: '+91 91234 56789',
    role: 'verification_staff',
    staffTitle: 'Senior Dealership Verification Officer',
    createdAt: '2026-10-01T00:00:00Z',
  },
  'offer-manager': {
    id: 'user-manager-vikram',
    email: 'offer.manager@groupbuycars.internal',
    fullName: 'Vikram Malhotra (Offer Manager)',
    phone: '+91 92345 67890',
    role: 'offer_manager',
    staffTitle: 'Platform Commercial Offer Manager',
    createdAt: '2026-10-01T00:00:00Z',
  },
  'super-admin': {
    id: 'user-super-admin',
    email: 'superadmin@groupbuycars.internal',
    fullName: 'Chief Platform Administrator',
    phone: '+91 99999 88888',
    role: 'super_admin',
    staffTitle: 'Super Administrator',
    createdAt: '2026-10-01T00:00:00Z',
  },
};

let cachedAuthUser: UserProfile = DEMO_PERSONAS.buyer;
let cachedAuthRaw: string | null = null;

function subscribeAuth(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('groupbuy_auth_updated', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('groupbuy_auth_updated', callback);
  };
}

function getAuthSnapshot(): UserProfile {
  if (typeof window === 'undefined') return DEMO_PERSONAS.buyer;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AUTH);
    if (raw !== cachedAuthRaw) {
      cachedAuthRaw = raw;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.role) {
          cachedAuthUser = parsed;
        } else {
          cachedAuthUser = DEMO_PERSONAS.buyer;
        }
      } else {
        cachedAuthUser = DEMO_PERSONAS.buyer;
      }
    }
  } catch (e) {
    console.error('Failed reading auth from storage', e);
  }
  return cachedAuthUser;
}

function getAuthServerSnapshot(): UserProfile {
  return DEMO_PERSONAS.buyer;
}

export function getInitialAuthUser(): UserProfile {
  return getAuthSnapshot();
}

export function useAuthStore() {
  const user = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthServerSnapshot);
  const isDemoMode = !isSupabaseConfigured;

  const switchPersona = (
    personaKey:
      | 'buyer'
      | 'dealer-a'
      | 'dealer-b'
      | 'verification-staff'
      | 'offer-manager'
      | 'super-admin'
  ) => {
    const target = DEMO_PERSONAS[personaKey];
    if (target) {
      try {
        localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(target));
        cachedAuthRaw = null; // Invalidate cache
        window.dispatchEvent(new Event('groupbuy_auth_updated'));
      } catch (e) {
        console.error(e);
      }
    }
  };

  const updateBuyerPreferences = (preferences: BuyerPreferences) => {
    if (!user) return;
    const updated: UserProfile = {
      ...user,
      preferences,
    };
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updated));
      cachedAuthRaw = null;
      window.dispatchEvent(new Event('groupbuy_auth_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const loginCustom = (customUser: UserProfile) => {
    try {
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(customUser));
      cachedAuthRaw = null;
      window.dispatchEvent(new Event('groupbuy_auth_updated'));
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    switchPersona('buyer');
  };

  return {
    user,
    role: user?.role || 'buyer',
    isBuyer: user?.role === 'buyer',
    isDealer: user?.role === 'dealer',
    isVerificationStaff: user?.role === 'verification_staff',
    isOfferManager: user?.role === 'offer_manager',
    isSuperAdmin: user?.role === 'super_admin',
    hasStaffPrivileges:
      user?.role === 'verification_staff' ||
      user?.role === 'offer_manager' ||
      user?.role === 'super_admin',
    isDemoMode,
    switchPersona,
    updateBuyerPreferences,
    loginCustom,
    logout,
  };
}
