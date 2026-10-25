'use client';

import { useState, useEffect } from 'react';
import {
  CarCampaign,
  DealershipAccount,
  DealershipOffer,
  BuyerBooking,
  JoinedBuyer,
  OfferAuditLog,
  OfferStatus,
  UserProfile,
  BuyerPreferences,
  CampaignStatus,
} from './types';
import {
  DEMO_CAMPAIGNS,
  DEMO_DEALERSHIPS,
  DEMO_OFFERS,
  DEMO_BOOKINGS,
  DEMO_AUDIT_LOGS,
} from './mock-data';
import { supabase, isSupabaseConfigured } from './supabase/client';

const STORAGE_KEY_CAMPAIGNS = 'groupbuy_cars_campaigns_v5';
const STORAGE_KEY_DEALERS = 'groupbuy_cars_dealers_v5';
const STORAGE_KEY_OFFERS = 'groupbuy_cars_offers_v5';
const STORAGE_KEY_BOOKINGS = 'groupbuy_cars_bookings_v5';
const STORAGE_KEY_MEMBERS = 'groupbuy_cars_members_v5';
const STORAGE_KEY_AUDIT = 'groupbuy_cars_audit_v5';

export function getInitialCampaigns(): CarCampaign[] {
  if (typeof window === 'undefined') return DEMO_CAMPAIGNS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed reading campaigns from storage', e);
  }
  return DEMO_CAMPAIGNS;
}

export function getInitialDealers(): DealershipAccount[] {
  if (typeof window === 'undefined') return DEMO_DEALERSHIPS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DEALERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed reading dealers from storage', e);
  }
  return DEMO_DEALERSHIPS;
}

export function getInitialOffers(): DealershipOffer[] {
  if (typeof window === 'undefined') return DEMO_OFFERS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_OFFERS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed reading offers from storage', e);
  }
  return DEMO_OFFERS;
}

export function getInitialBookings(): BuyerBooking[] {
  if (typeof window === 'undefined') return DEMO_BOOKINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BOOKINGS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed reading bookings from storage', e);
  }
  return DEMO_BOOKINGS;
}

export function getInitialMembers(): JoinedBuyer[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MEMBERS);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed reading members from storage', e);
  }
  return [];
}

export function getInitialAuditLogs(): OfferAuditLog[] {
  if (typeof window === 'undefined') return DEMO_AUDIT_LOGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed reading audit logs from storage', e);
  }
  return DEMO_AUDIT_LOGS;
}

export function useCampaignStore() {
  const [campaigns, setCampaigns] = useState<CarCampaign[]>(getInitialCampaigns);
  const [dealers, setDealers] = useState<DealershipAccount[]>(getInitialDealers);
  const [offers, setOffers] = useState<DealershipOffer[]>(getInitialOffers);
  const [bookings, setBookings] = useState<BuyerBooking[]>(getInitialBookings);
  const [members, setMembers] = useState<JoinedBuyer[]>(getInitialMembers);
  const [auditLogs, setAuditLogs] = useState<OfferAuditLog[]>(getInitialAuditLogs);

  useEffect(() => {

    function handleStorageChange() {
      setCampaigns(getInitialCampaigns());
      setDealers(getInitialDealers());
      setOffers(getInitialOffers());
      setBookings(getInitialBookings());
      setMembers(getInitialMembers());
      setAuditLogs(getInitialAuditLogs());
    }

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('groupbuy_state_updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('groupbuy_state_updated', handleStorageChange);
    };
  }, []);

  const notifyUpdate = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('groupbuy_state_updated'));
    }
  };

  /**
   * BUYER SAFE ACCESS:
   * Only approved, active offers from verified dealerships are returned to buyers!
   */
  const getApprovedOffers = (campaignId?: string): DealershipOffer[] => {
    const verifiedDealerIds = new Set(
      dealers.filter((d) => d.verificationStatus === 'verified').map((d) => d.id)
    );

    const approved = offers.filter(
      (o) => o.status === 'approved' && verifiedDealerIds.has(o.dealerId)
    );

    if (campaignId) {
      return approved.filter((o) => o.campaignId === campaignId);
    }
    return approved;
  };

  /**
   * DEALER ACCESS:
   * Returns offers belonging specifically to this dealership.
   */
  const getDealerOffers = (dealerId: string): DealershipOffer[] => {
    return offers.filter((o) => o.dealerId === dealerId);
  };

  /**
   * "FIND MY CAR GROUP" MATCHING ENGINE:
   * Searches active compatible campaigns based on buyer preferences.
   */
  const findMatchingGroups = (preferences: BuyerPreferences): CarCampaign[] => {
    return campaigns.filter((camp) => {
      // Must be active
      if (camp.status !== 'active') return false;

      // City match
      if (preferences.city && camp.city !== preferences.city) return false;

      // Brand match
      if (
        preferences.preferredBrand &&
        preferences.preferredBrand !== 'All' &&
        camp.brand.toLowerCase() !== preferences.preferredBrand.toLowerCase()
      ) {
        return false;
      }

      // Fuel match
      if (
        preferences.fuelType &&
        preferences.fuelType !== 'All' &&
        camp.fuelType !== preferences.fuelType
      ) {
        return false;
      }

      // Transmission match
      if (
        preferences.transmission &&
        preferences.transmission !== 'All' &&
        camp.transmission !== preferences.transmission
      ) {
        return false;
      }

      // Budget check
      if (preferences.budgetMax > 0 && camp.estimatedOnRoadPrice > preferences.budgetMax * 1.15) {
        return false;
      }

      return true;
    });
  };

  /**
   * CREATE NEW BUYER GROUP:
   * When no compatible active group exists, buyer can create one.
   */
  const createCustomGroup = async (
    groupData: {
      brand: string;
      model: string;
      variant: string;
      city: any;
      fuelType: any;
      transmission: any;
      estimatedOnRoadPrice: number;
      targetBuyers: number;
      maxCapacity?: number;
      description?: string;
    },
    buyer: UserProfile
  ): Promise<{ campaign: CarCampaign; message: string }> => {
    const newId = `${groupData.brand.toLowerCase()}-${groupData.model.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString().slice(-4)}`;

    const newCampaign: CarCampaign = {
      id: newId,
      brand: groupData.brand,
      model: groupData.model,
      variant: groupData.variant,
      city: groupData.city,
      fuelType: groupData.fuelType,
      transmission: groupData.transmission,
      exShowroomPrice: Math.round(groupData.estimatedOnRoadPrice * 0.85),
      estimatedOnRoadPrice: groupData.estimatedOnRoadPrice,
      imageUrl: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80',
      targetBuyers: groupData.targetBuyers || 15,
      maxCapacity: groupData.maxCapacity || (groupData.targetBuyers || 15) + 5,
      currentBuyers: 1, // Buyer who created it is the 1st member!
      interestedCount: 1,
      confirmedBookingsCount: 0,
      purchasedCount: 0,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      description:
        groupData.description ||
        `Community group buy for ${groupData.brand} ${groupData.model} in ${groupData.city}. Pooling demand to secure dealer fleet discounts.`,
      keySpecs: [
        { label: 'Transmission', value: groupData.transmission },
        { label: 'Fuel Type', value: groupData.fuelType },
        { label: 'City Hub', value: groupData.city },
      ],
      tiers: [
        {
          minBuyers: 5,
          discountTarget: 30000,
          label: 'Tier 1: Starter Circle (5+ Buyers)',
          unlocked: false,
        },
        {
          minBuyers: 10,
          discountTarget: 50000,
          label: 'Tier 2: Volume Advantage (10+ Buyers)',
          unlocked: false,
        },
        {
          minBuyers: groupData.targetBuyers || 15,
          discountTarget: 70000,
          label: `Tier 3: Fleet Target (${groupData.targetBuyers || 15} Buyers)`,
          unlocked: false,
        },
      ],
      createdByBuyerId: buyer.id,
      createdAt: new Date().toISOString(),
    };

    // Auto-join the creator
    const creatorMember: JoinedBuyer = {
      id: `member-${Date.now()}`,
      campaignId: newId,
      userId: buyer.id,
      fullName: buyer.fullName,
      phone: buyer.phone || '+91 98765 43210',
      email: buyer.email,
      colorPreference: 'Any Preferred',
      financeRequirement: 'Bank Loan',
      willingToBuyInDays: 30,
      joinedAt: new Date().toISOString(),
    };

    const updatedCampaigns = [newCampaign, ...campaigns];
    const updatedMembers = [creatorMember, ...members];

    setCampaigns(updatedCampaigns);
    setMembers(updatedMembers);

    // Audit Log
    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'campaign',
      targetId: newId,
      campaignName: `${newCampaign.brand} ${newCampaign.model}`,
      action: 'group_created',
      performedByRole: buyer.role,
      performedByName: buyer.fullName,
      performedByEmail: buyer.email,
      timestamp: new Date().toISOString(),
      newStatus: 'active',
      notes: `New car buyer group formed by ${buyer.fullName} in ${newCampaign.city}.`,
    };

    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaigns));
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return {
      campaign: newCampaign,
      message: `Group created successfully for ${newCampaign.brand} ${newCampaign.model}! It is now open for other buyers to join.`,
    };
  };

  /**
   * BUYER: Join Campaign
   */
  const joinCampaign = async (
    buyerData: Omit<JoinedBuyer, 'id' | 'joinedAt'>,
    user?: UserProfile
  ): Promise<{ member: JoinedBuyer; message: string }> => {
    const targetCamp = campaigns.find((c) => c.id === buyerData.campaignId);
    if (!targetCamp) throw new Error('Target group not found.');

    // Requirement 4: Stop accepting new members when group is closed/completed
    if (targetCamp.status === 'completed' || targetCamp.status === 'closed') {
      throw new Error(
        `This car group is currently ${targetCamp.status.toUpperCase()}. New memberships are closed for this batch. You can join another active group or start a new group!`
      );
    }

    // Capacity check
    if (targetCamp.maxCapacity && targetCamp.currentBuyers >= targetCamp.maxCapacity) {
      throw new Error(
        `Group has reached its maximum capacity of ${targetCamp.maxCapacity} members. Please join another pool or start a new batch.`
      );
    }

    const cleanName = (buyerData.fullName || user?.fullName || '').trim();
    const cleanPhone = (buyerData.phone || user?.phone || '').trim().replace(/[\s-]/g, '');
    const cleanEmail = (buyerData.email || user?.email || '').trim().toLowerCase();

    if (cleanName.length < 2) throw new Error('Please enter a valid full name.');
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) throw new Error('Please enter a valid 10-digit phone number.');

    // Duplicate Prevention (Requirement 3)
    const isDuplicate = members.some(
      (m) =>
        m.campaignId === buyerData.campaignId &&
        (m.phone.replace(/\D/g, '') === phoneDigits || m.email.toLowerCase().trim() === cleanEmail)
    );
    if (isDuplicate) {
      throw new Error(
        'Duplicate entry detected: You are already a registered member of this car group.'
      );
    }

    const newMember: JoinedBuyer = {
      ...buyerData,
      userId: user?.id,
      fullName: cleanName,
      phone: cleanPhone,
      email: cleanEmail,
      id: `member-${Date.now()}`,
      joinedAt: new Date().toISOString(),
    };

    const updated = campaigns.map((camp) => {
      if (camp.id === buyerData.campaignId) {
        const newCount = camp.currentBuyers + 1;
        const updatedTiers = camp.tiers.map((t) => ({
          ...t,
          unlocked: newCount >= t.minBuyers,
        }));
        return {
          ...camp,
          currentBuyers: newCount,
          tiers: updatedTiers,
        };
      }
      return camp;
    });

    setCampaigns(updated);
    const updatedMembersList = [newMember, ...members];
    setMembers(updatedMembersList);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'campaign',
      targetId: buyerData.campaignId,
      campaignName: `${targetCamp.brand} ${targetCamp.model}`,
      action: 'group_joined',
      performedByRole: user?.role || 'buyer',
      performedByName: cleanName,
      performedByEmail: cleanEmail,
      timestamp: new Date().toISOString(),
      notes: `${cleanName} joined group. Total members: ${targetCamp.currentBuyers + 1}.`,
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updated));
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembersList));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return { member: newMember, message: 'Successfully joined car group!' };
  };

  /**
   * BUYER: Leave Group
   */
  const buyerLeaveCampaign = async (
    memberId: string,
    user: UserProfile
  ): Promise<{ success: boolean; message: string }> => {
    const target = members.find((m) => m.id === memberId);
    if (!target) throw new Error('Membership record not found.');

    if (user.role === 'buyer' && target.email !== user.email && target.phone !== user.phone) {
      throw new Error('Unauthorized: You can manage only your own group memberships.');
    }

    const updatedMembers = members.filter((m) => m.id !== memberId);
    const updatedCampaigns = campaigns.map((camp) => {
      if (camp.id === target.campaignId) {
        const newCount = Math.max(0, camp.currentBuyers - 1);
        return {
          ...camp,
          currentBuyers: newCount,
          tiers: camp.tiers.map((t) => ({ ...t, unlocked: newCount >= t.minBuyers })),
        };
      }
      return camp;
    });

    setMembers(updatedMembers);
    setCampaigns(updatedCampaigns);

    try {
      localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(updatedMembers));
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaigns));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return { success: true, message: 'You have left the group.' };
  };

  /**
   * DEALERSHIP VERIFICATION (Verification Staff or Super Admin):
   * Requirement 5: "Only authorized verification staff or Super Admins may approve dealership verification."
   */
  const verifyDealership = async (
    dealerId: string,
    decision: 'verified' | 'rejected' | 'suspended',
    notes: string,
    staffUser: UserProfile
  ): Promise<{ dealer: DealershipAccount; message: string }> => {
    if (staffUser.role !== 'verification_staff' && staffUser.role !== 'super_admin') {
      throw new Error(
        'Permission Denied: Only authorized Verification Staff or Super Admins can verify dealerships.'
      );
    }

    const target = dealers.find((d) => d.id === dealerId);
    if (!target) throw new Error('Dealership record not found.');

    const updatedDealer: DealershipAccount = {
      ...target,
      verificationStatus: decision,
      verificationNotes: notes,
      verifiedAt: decision === 'verified' ? new Date().toISOString() : undefined,
      verifiedBy: staffUser.fullName,
    };

    const updatedDealers = dealers.map((d) => (d.id === dealerId ? updatedDealer : d));
    setDealers(updatedDealers);

    // If dealer was suspended or rejected, demote their live offers
    let updatedOffers = offers;
    if (decision === 'suspended' || decision === 'rejected') {
      updatedOffers = offers.map((o) =>
        o.dealerId === dealerId && o.status === 'approved'
          ? { ...o, status: 'needs_correction' as OfferStatus, adminReviewNotes: `Dealership ${decision}.` }
          : o
      );
      setOffers(updatedOffers);
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedOffers));
    }

    // Audit Log
    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'dealership',
      targetId: dealerId,
      dealershipName: target.name,
      action:
        decision === 'verified'
          ? 'dealer_verified'
          : decision === 'rejected'
          ? 'dealer_rejected'
          : 'dealer_suspended',
      performedByRole: staffUser.role,
      performedByName: staffUser.fullName,
      performedByEmail: staffUser.email,
      timestamp: new Date().toISOString(),
      previousStatus: target.verificationStatus,
      newStatus: decision,
      notes: notes || `Dealership marked ${decision}.`,
    };

    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_DEALERS, JSON.stringify(updatedDealers));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return {
      dealer: updatedDealer,
      message: `Dealership "${target.name}" status updated to ${decision.toUpperCase()}.`,
    };
  };

  /**
   * REGISTER NEW DEALERSHIP:
   * Requirement 5: "New dealerships must not become verified automatically."
   */
  const registerDealership = async (
    data: Omit<DealershipAccount, 'id' | 'verificationStatus' | 'createdAt'>
  ): Promise<{ dealer: DealershipAccount; message: string }> => {
    const newId = `dealer-${Date.now()}`;
    const newDealer: DealershipAccount = {
      ...data,
      id: newId,
      verificationStatus: 'pending', // Starts in pending verification
      createdAt: new Date().toISOString(),
    };

    const updatedDealers = [newDealer, ...dealers];
    setDealers(updatedDealers);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'dealership',
      targetId: newId,
      dealershipName: newDealer.name,
      action: 'dealer_registered',
      performedByRole: 'dealer',
      performedByName: newDealer.managerName,
      performedByEmail: newDealer.email,
      timestamp: new Date().toISOString(),
      newStatus: 'pending',
      notes: 'Dealership registered online. Awaiting platform verification.',
    };

    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_DEALERS, JSON.stringify(updatedDealers));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return {
      dealer: newDealer,
      message: 'Dealership registered successfully! Your account is currently Pending Verification.',
    };
  };

  /**
   * DEALER: Submit Offer
   * Requirement 6 & 7: "An authorized dealership owner/manager submits or confirms an offer. The offer enters Pending Review."
   */
  const submitDealerOffer = async (
    offerData: Omit<
      DealershipOffer,
      'id' | 'submittedAt' | 'status' | 'version' | 'dealerId' | 'managerConfirmed'
    >,
    user: UserProfile
  ): Promise<{ offer: DealershipOffer; message: string }> => {
    if (user.role !== 'dealer') {
      throw new Error('Permission Denied: Only registered dealership accounts can submit quotations.');
    }

    const assignedDealerId = user.dealershipId || `dealer-${user.id}`;
    const dealerAccount = dealers.find((d) => d.id === assignedDealerId);

    // Check verification status
    const isDealerVerified = dealerAccount?.verificationStatus === 'verified';

    const newOfferId = `offer-${Date.now()}`;
    const newOffer: DealershipOffer = {
      ...offerData,
      id: newOfferId,
      dealerId: assignedDealerId,
      dealershipName: dealerAccount?.name || user.dealershipName || offerData.dealershipName,
      dealershipLocation: dealerAccount?.showroomAddress || offerData.dealershipLocation,
      branchId: user.branchId || offerData.branchId,
      branchName: offerData.branchName || 'Main Showroom',
      verified: isDealerVerified,
      status: 'pending_review',
      version: 1,
      submittedAt: new Date().toISOString(),
      managerConfirmed: true, // Confirmed by submitting manager
      managerConfirmedAt: new Date().toISOString(),
      managerConfirmedBy: user.fullName,
      minConfirmedBookings: offerData.minConfirmedBookings || 3,
      confirmedBookingsCount: 0,
      interestedCount: 0,
      isDemo: true,
    };

    const updatedOffers = [newOffer, ...offers];
    setOffers(updatedOffers);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'offer',
      targetId: newOfferId,
      campaignName: offerData.campaignId,
      dealershipName: newOffer.dealershipName,
      action: 'offer_submitted',
      performedByRole: 'dealer',
      performedByName: user.fullName,
      performedByEmail: user.email,
      timestamp: new Date().toISOString(),
      newStatus: 'pending_review',
      notes: `Quotation submitted with ₹${offerData.cashDiscount.toLocaleString('en-IN')} cash discount. Manager confirmed.`,
      version: 1,
    };

    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedOffers));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return {
      offer: newOffer,
      message:
        'Quotation confirmed and submitted! It has entered the Offer Manager Review Queue.',
    };
  };

  /**
   * DEALER: Edit Offer
   * Requirement 6 & 8: "If an approved offer is edited, invalidate its existing approval and require review again."
   */
  const updateDealerOffer = async (
    offerId: string,
    updates: Partial<DealershipOffer>,
    user: UserProfile
  ): Promise<{ offer: DealershipOffer; revertedToPending: boolean; message: string }> => {
    if (user.role !== 'dealer' && user.role !== 'super_admin') {
      throw new Error('Permission Denied: Buyers cannot modify dealership offers.');
    }

    const existing = offers.find((o) => o.id === offerId);
    if (!existing) throw new Error('Quotation not found.');

    // Strict ownership isolation check
    if (user.role === 'dealer' && existing.dealerId !== user.dealershipId) {
      throw new Error(
        `Security Boundary: You belong to "${user.dealershipName || user.dealershipId}" and cannot edit offers belonging to "${existing.dealershipName}".`
      );
    }

    const wasApproved = existing.status === 'approved';
    const newStatus: OfferStatus = wasApproved ? 'pending_review' : (updates.status || existing.status);
    const newVersion = existing.version + 1;

    const updatedOffer: DealershipOffer = {
      ...existing,
      ...updates,
      status: newStatus,
      version: newVersion,
      submittedAt: new Date().toISOString(),
      managerConfirmed: true,
      managerConfirmedAt: new Date().toISOString(),
      managerConfirmedBy: user.fullName,
    };

    const updatedList = offers.map((o) => (o.id === offerId ? updatedOffer : o));
    setOffers(updatedList);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'offer',
      targetId: offerId,
      dealershipName: existing.dealershipName,
      action: 'offer_updated',
      performedByRole: user.role,
      performedByName: user.fullName,
      performedByEmail: user.email,
      timestamp: new Date().toISOString(),
      previousStatus: existing.status,
      newStatus,
      notes: wasApproved
        ? `Offer modified by dealer (v${newVersion}). Invalidated approval and reverted to Pending Review.`
        : `Offer updated by dealer (v${newVersion}).`,
      version: newVersion,
    };

    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedList));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    const message = wasApproved
      ? 'Notice: Modifying an approved quotation has returned it to "Pending Review". It will remain hidden from buyers until an Offer Manager approves the revised terms.'
      : 'Quotation updated successfully.';

    return { offer: updatedOffer, revertedToPending: wasApproved, message };
  };

  /**
   * PLATFORM OFFER REVIEW (Offer Manager or Super Admin):
   * Requirement 7 & 8: "A dealership owner cannot approve an offer as the platform reviewer merely because they own the dealership."
   * "Only approved, active, non-expired offers from verified, non-suspended dealerships may be shown as live offers."
   */
  const reviewDealerOffer = async (
    offerId: string,
    decision: 'approved' | 'rejected' | 'needs_correction',
    reviewNotes: string,
    staffUser: UserProfile
  ): Promise<{ offer: DealershipOffer; message: string }> => {
    if (staffUser.role !== 'offer_manager' && staffUser.role !== 'super_admin') {
      throw new Error(
        'Permission Denied: Only authorized Platform Offer Managers or Super Admins can review quotations.'
      );
    }

    const existing = offers.find((o) => o.id === offerId);
    if (!existing) throw new Error('Quotation not found.');

    // Dealership verification check (Requirement 8)
    const owningDealer = dealers.find((d) => d.id === existing.dealerId);
    if (decision === 'approved' && owningDealer?.verificationStatus !== 'verified') {
      throw new Error(
        `Cannot Approve: The dealership "${existing.dealershipName}" is currently ${owningDealer?.verificationStatus.toUpperCase() || 'UNVERIFIED'}. It must be verified by Verification Staff before any of its offers can go live.`
      );
    }

    // Require reason for return or reject (Requirement 8)
    if ((decision === 'needs_correction' || decision === 'rejected') && (!reviewNotes || reviewNotes.trim().length < 5)) {
      throw new Error('Please enter a specific reason/instructions for returning or rejecting this offer.');
    }

    const updatedOffer: DealershipOffer = {
      ...existing,
      status: decision,
      adminReviewNotes: reviewNotes,
      reviewedAt: new Date().toISOString(),
      reviewedBy: staffUser.fullName,
      verified: decision === 'approved',
    };

    const updatedList = offers.map((o) => (o.id === offerId ? updatedOffer : o));
    setOffers(updatedList);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'offer',
      targetId: offerId,
      dealershipName: existing.dealershipName,
      action:
        decision === 'approved'
          ? 'offer_approved'
          : decision === 'needs_correction'
          ? 'offer_returned_correction'
          : 'offer_rejected',
      performedByRole: staffUser.role,
      performedByName: staffUser.fullName,
      performedByEmail: staffUser.email,
      timestamp: new Date().toISOString(),
      previousStatus: existing.status,
      newStatus: decision,
      notes: reviewNotes || `Decision: ${decision}`,
      version: existing.version,
    };

    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedList));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    const message =
      decision === 'approved'
        ? `Offer from "${existing.dealershipName}" approved! It is now live in the Buyer comparison matrix.`
        : decision === 'needs_correction'
        ? `Offer returned to "${existing.dealershipName}" with correction request.`
        : `Offer rejected.`;

    return { offer: updatedOffer, message };
  };

  /**
   * BUYER OFFER SELECTION & BOOKING FLOW (Requirements 10 & 12):
   * Selecting an offer / expressing interest != confirmed booking.
   * Multiple members of 1 group can choose DIFFERENT dealership offers!
   */
  const selectOfferInterest = async (
    offerId: string,
    campaignId: string,
    buyer: UserProfile
  ): Promise<{ booking: BuyerBooking; message: string }> => {
    const targetOffer = offers.find((o) => o.id === offerId);
    if (!targetOffer) throw new Error('Offer not found.');

    const existingBooking = bookings.find(
      (b) => b.offerId === offerId && b.buyerId === buyer.id && b.status !== 'cancelled'
    );

    if (existingBooking) {
      return { booking: existingBooking, message: 'You have already expressed interest in this offer.' };
    }

    const newBooking: BuyerBooking = {
      id: `booking-${Date.now()}`,
      buyerId: buyer.id,
      buyerName: buyer.fullName,
      buyerEmail: buyer.email,
      buyerPhone: buyer.phone || '+91 98765 43210',
      campaignId,
      offerId,
      dealerId: targetOffer.dealerId,
      dealershipName: targetOffer.dealershipName,
      branchName: targetOffer.branchName,
      status: 'interested',
      quotedOnRoadPrice: 2040000 - targetOffer.cashDiscount,
      statusHistory: [
        {
          status: 'interested',
          timestamp: new Date().toISOString(),
          note: 'Expressed interest in offer.',
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedBookings = [newBooking, ...bookings];
    setBookings(updatedBookings);

    // Update interested count on offer
    const updatedOffers = offers.map((o) =>
      o.id === offerId ? { ...o, interestedCount: (o.interestedCount || 0) + 1 } : o
    );
    setOffers(updatedOffers);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'booking',
      targetId: newBooking.id,
      dealershipName: targetOffer.dealershipName,
      action: 'booking_interest',
      performedByRole: 'buyer',
      performedByName: buyer.fullName,
      performedByEmail: buyer.email,
      timestamp: new Date().toISOString(),
      newStatus: 'interested',
      notes: `${buyer.fullName} expressed interest in ${targetOffer.dealershipName} quotation.`,
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedBookings));
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedOffers));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return { booking: newBooking, message: 'Expressed interest! You can now confirm your booking intent.' };
  };

  /**
   * BUYER: Explicitly Confirm Booking Intent:
   * Requirement 10: "Selecting an offer or expressing interest is not automatically a confirmed booking. Require an explicit buyer confirmation for the booking status."
   */
  const confirmBookingIntent = async (
    bookingId: string,
    buyer: UserProfile
  ): Promise<{ booking: BuyerBooking; message: string }> => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) throw new Error('Booking record not found.');

    const targetOffer = offers.find((o) => o.id === targetBooking.offerId);
    if (!targetOffer) throw new Error('Offer not found.');

    const updatedBooking: BuyerBooking = {
      ...targetBooking,
      status: 'booking_confirmed',
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(targetBooking.statusHistory || []),
        {
          status: 'booking_confirmed',
          timestamp: new Date().toISOString(),
          note: 'Buyer confirmed purchase intent. Ready to finalize at showroom.',
        },
      ],
    };

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
    setBookings(updatedBookings);

    // Increment confirmed bookings on this specific offer!
    const newOfferConfirmedCount = (targetOffer.confirmedBookingsCount || 0) + 1;
    const updatedOffers = offers.map((o) =>
      o.id === targetOffer.id ? { ...o, confirmedBookingsCount: newOfferConfirmedCount } : o
    );
    setOffers(updatedOffers);

    // Update campaign level confirmed count
    const updatedCampaigns = campaigns.map((c) =>
      c.id === targetBooking.campaignId
        ? { ...c, confirmedBookingsCount: (c.confirmedBookingsCount || 0) + 1 }
        : c
    );
    setCampaigns(updatedCampaigns);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'booking',
      targetId: bookingId,
      dealershipName: targetOffer.dealershipName,
      action: 'booking_confirmed',
      performedByRole: 'buyer',
      performedByName: buyer.fullName,
      performedByEmail: buyer.email,
      timestamp: new Date().toISOString(),
      previousStatus: targetBooking.status,
      newStatus: 'booking_confirmed',
      notes: `${buyer.fullName} confirmed booking intent on ${targetOffer.dealershipName} (Confirmed: ${newOfferConfirmedCount}/${targetOffer.minConfirmedBookings}).`,
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedBookings));
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedOffers));
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaigns));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    const isThresholdMet = newOfferConfirmedCount >= targetOffer.minConfirmedBookings;
    const message = isThresholdMet
      ? `Booking confirmed! The minimum booking target of ${targetOffer.minConfirmedBookings} has been reached for ${targetOffer.dealershipName}!`
      : `Booking confirmed! (${newOfferConfirmedCount}/${targetOffer.minConfirmedBookings} confirmed bookings for ${targetOffer.dealershipName}). Waiting for ${targetOffer.minConfirmedBookings - newOfferConfirmedCount} more buyer(s).`;

    return { booking: updatedBooking, message };
  };

  /**
   * BUYER / DEALER: Cancel Booking
   */
  const cancelBooking = async (
    bookingId: string,
    user: UserProfile
  ): Promise<{ success: boolean; message: string }> => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) throw new Error('Booking not found.');

    const targetOffer = offers.find((o) => o.id === targetBooking.offerId);

    const updatedBooking: BuyerBooking = {
      ...targetBooking,
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(targetBooking.statusHistory || []),
        {
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          note: `Cancelled by ${user.fullName} (${user.role}).`,
        },
      ],
    };

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
    setBookings(updatedBookings);

    // Decrement confirmed bookings count if it was confirmed
    if (targetBooking.status === 'booking_confirmed' && targetOffer) {
      const newOfferConfirmed = Math.max(0, (targetOffer.confirmedBookingsCount || 1) - 1);
      const updatedOffers = offers.map((o) =>
        o.id === targetOffer.id ? { ...o, confirmedBookingsCount: newOfferConfirmed } : o
      );
      setOffers(updatedOffers);
      localStorage.setItem(STORAGE_KEY_OFFERS, JSON.stringify(updatedOffers));
    }

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'booking',
      targetId: bookingId,
      action: 'booking_cancelled',
      performedByRole: user.role,
      performedByName: user.fullName,
      performedByEmail: user.email,
      timestamp: new Date().toISOString(),
      previousStatus: targetBooking.status,
      newStatus: 'cancelled',
      notes: `Booking cancelled by ${user.fullName}.`,
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedBookings));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return { success: true, message: 'Booking cancelled.' };
  };

  /**
   * DEALER / ADMIN: Mark Car Purchased
   */
  const markCarPurchased = async (
    bookingId: string,
    user: UserProfile
  ): Promise<{ booking: BuyerBooking; message: string }> => {
    const targetBooking = bookings.find((b) => b.id === bookingId);
    if (!targetBooking) throw new Error('Booking not found.');

    const updatedBooking: BuyerBooking = {
      ...targetBooking,
      status: 'purchased',
      updatedAt: new Date().toISOString(),
      statusHistory: [
        ...(targetBooking.statusHistory || []),
        {
          status: 'purchased',
          timestamp: new Date().toISOString(),
          note: `Vehicle delivery confirmed and finalized at showroom.`,
        },
      ],
    };

    const updatedBookings = bookings.map((b) => (b.id === bookingId ? updatedBooking : b));
    setBookings(updatedBookings);

    // Update campaign purchased count
    const updatedCampaigns = campaigns.map((c) =>
      c.id === targetBooking.campaignId ? { ...c, purchasedCount: (c.purchasedCount || 0) + 1 } : c
    );
    setCampaigns(updatedCampaigns);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'booking',
      targetId: bookingId,
      action: 'car_purchased',
      performedByRole: user.role,
      performedByName: user.fullName,
      performedByEmail: user.email,
      timestamp: new Date().toISOString(),
      previousStatus: targetBooking.status,
      newStatus: 'purchased',
      notes: `Car delivery finalized for ${targetBooking.buyerName} at ${targetBooking.dealershipName}.`,
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_BOOKINGS, JSON.stringify(updatedBookings));
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaigns));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return { booking: updatedBooking, message: 'Car purchase recorded successfully!' };
  };

  /**
   * ADMIN / SUPER ADMIN: Close or Complete Group
   * Requirement 4: "Stop accepting new members when it is marked completed or closed. Preserve historical records."
   */
  const closeOrCompleteCampaign = async (
    campaignId: string,
    newStatus: 'completed' | 'closed',
    user: UserProfile
  ): Promise<{ campaign: CarCampaign; message: string }> => {
    if (user.role !== 'super_admin' && user.role !== 'offer_manager') {
      throw new Error('Permission Denied: Staff authorization required to change group status.');
    }

    const target = campaigns.find((c) => c.id === campaignId);
    if (!target) throw new Error('Campaign not found.');

    const updatedCampaign: CarCampaign = {
      ...target,
      status: newStatus,
    };

    const updatedCampaigns = campaigns.map((c) => (c.id === campaignId ? updatedCampaign : c));
    setCampaigns(updatedCampaigns);

    const audit: OfferAuditLog = {
      id: `audit-${Date.now()}`,
      recordType: 'campaign',
      targetId: campaignId,
      campaignName: `${target.brand} ${target.model}`,
      action: 'group_closed',
      performedByRole: user.role,
      performedByName: user.fullName,
      performedByEmail: user.email,
      timestamp: new Date().toISOString(),
      previousStatus: target.status,
      newStatus,
      notes: `Group marked ${newStatus.toUpperCase()} by ${user.fullName}. New buyer registrations stopped. Historical records preserved.`,
    };
    const updatedAudit = [audit, ...auditLogs];
    setAuditLogs(updatedAudit);

    try {
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCampaigns));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(updatedAudit));
      notifyUpdate();
    } catch (e) {
      console.error(e);
    }

    return {
      campaign: updatedCampaign,
      message: `Group marked ${newStatus.toUpperCase()}. New memberships are now closed.`,
    };
  };

  /**
   * Reset Demo Defaults
   */
  const resetToDemoDefaults = () => {
    localStorage.removeItem(STORAGE_KEY_CAMPAIGNS);
    localStorage.removeItem(STORAGE_KEY_DEALERS);
    localStorage.removeItem(STORAGE_KEY_OFFERS);
    localStorage.removeItem(STORAGE_KEY_BOOKINGS);
    localStorage.removeItem(STORAGE_KEY_MEMBERS);
    localStorage.removeItem(STORAGE_KEY_AUDIT);
    setCampaigns(DEMO_CAMPAIGNS);
    setDealers(DEMO_DEALERSHIPS);
    setOffers(DEMO_OFFERS);
    setBookings(DEMO_BOOKINGS);
    setMembers([]);
    setAuditLogs(DEMO_AUDIT_LOGS);
    notifyUpdate();
  };

  return {
    campaigns,
    dealers,
    offers,
    bookings,
    members,
    auditLogs,
    isSupabaseConfigured,
    getApprovedOffers,
    getDealerOffers,
    findMatchingGroups,
    createCustomGroup,
    joinCampaign,
    buyerLeaveCampaign,
    registerDealership,
    verifyDealership,
    submitDealerOffer,
    updateDealerOffer,
    reviewDealerOffer,
    selectOfferInterest,
    confirmBookingIntent,
    cancelBooking,
    markCarPurchased,
    closeOrCompleteCampaign,
    resetToDemoDefaults,
  };
}
