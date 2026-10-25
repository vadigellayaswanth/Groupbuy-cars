export type City = 'Hyderabad' | 'Bengaluru' | 'Mumbai' | 'Delhi-NCR';

export type UserRole =
  | 'buyer'
  | 'dealer'
  | 'verification_staff'
  | 'offer_manager'
  | 'super_admin'
  | 'admin';

export interface BuyerPreferences {
  city: City;
  preferredBrand: string;
  preferredModel: string;
  fuelType: 'Petrol' | 'EV' | 'Diesel' | 'Hybrid' | 'All';
  transmission: 'Automatic' | 'Manual' | 'All';
  budgetMin: number;
  budgetMax: number;
  timelineDays: number;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  city?: City;
  preferences?: BuyerPreferences;
  dealershipId?: string; // Corresponds to DealershipAccount id if dealer
  dealerId?: string; // Alias for dealershipId
  dealershipName?: string;
  branchId?: string;
  staffTitle?: string;
  createdAt: string;
}

export interface VolumeTier {
  minBuyers: number;
  discountTarget: number; // In INR (e.g. 35000, 55000, 75000)
  label: string; // e.g., 'Tier 1: Starter Club', 'Tier 2: Power Circle', 'Tier 3: Mega Fleet'
  unlocked: boolean;
}

export interface KeySpec {
  label: string;
  value: string;
}

export type CampaignStatus = 'active' | 'negotiation' | 'completed' | 'closed';

export interface CarCampaign {
  id: string;
  brand: string;
  model: string;
  variant: string;
  city: City;
  exShowroomPrice: number;
  estimatedOnRoadPrice: number;
  imageUrl: string;
  fuelType: 'Petrol' | 'EV' | 'Diesel' | 'Hybrid';
  transmission: 'Automatic' | 'Manual';
  targetBuyers: number;
  maxBuyers?: number;
  maxCapacity?: number;
  currentBuyers: number;
  interestedCount?: number;
  confirmedBookingsCount?: number;
  purchasedCount?: number;
  deadline: string;
  expiryDate?: string;
  tiers: VolumeTier[];
  description: string;
  keySpecs: KeySpec[];
  status: CampaignStatus;
  createdByBuyerId?: string;
  createdAt: string;
}

export type DealershipVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface DealershipBranch {
  id: string;
  name: string;
  address: string;
  area?: string;
  city: City;
  contactPerson: string;
  phone: string;
}

export interface DealershipAccount {
  id: string;
  name: string;
  brand: string;
  authorizedBrands?: string[];
  city: City;
  showroomAddress: string;
  address?: string;
  gstin?: string;
  email: string;
  phone: string;
  managerName: string;
  verificationStatus: DealershipVerificationStatus;
  verificationDocRef?: string;
  verificationNotes?: string;
  verifiedAt?: string;
  verifiedBy?: string;
  branches: DealershipBranch[];
  createdAt: string;
}

export type OfferStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'needs_correction';

export interface DealershipOffer {
  id: string;
  campaignId: string;
  dealerId: string; // DealershipAccount ID
  dealershipName: string;
  dealershipLocation: string; // Showroom address / city
  branchId?: string;
  branchName?: string;
  dealerContact: string;
  verified: boolean;
  status: OfferStatus; // Only 'approved' offers are visible to public buyers
  version: number;
  submittedAt: string;
  
  // Pricing breakdown
  cashDiscount: number; // Pure cash deduction
  claimedAccessoryValue: number;
  mandatoryAccessories: boolean; // true if dealer forces accessories, false if optional
  accessoryDetails: string;
  claimedInsuranceValue: number;
  insuranceDetails: string;
  corporateDiscount: number;
  exchangeBonus: number;
  otherBenefits: string;
  additionalCharges?: number; // Handling, logistics, depot charges (0 if transparent)
  financingRequirements?: string; // Financing tie-in notes
  warrantyDetails?: string; // Manufacturer & dealer warranty
  warrantyIncluded?: string;
  
  // Booking quotas & operational timelines
  deliveryTimelineWeeks: number;
  minConfirmedBookings: number; // Minimum bookings required to unlock discount (e.g. 3)
  minConfirmedBookingsRequired?: number;
  maxEligibleBookings?: number; // Max pool quota
  maxBookingQuota?: number;
  offerStartDate: string;
  offerValidityDate: string; // Expiry date
  supportingEvidence?: string;
  supportingEvidenceNotes?: string;
  
  // Confirmation & Review
  managerConfirmed: boolean;
  managerConfirmedAt?: string;
  managerConfirmedBy?: string;
  adminReviewNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  
  // Tracking
  interestedCount?: number;
  confirmedBookingsCount?: number;
  
  conditions: string[];
  rating: number;
  isDemo?: boolean;
}

export type BookingStatus =
  | 'interested'
  | 'booking_confirmed'
  | 'confirmed_intent'
  | 'purchased'
  | 'cancelled';

export interface BuyerBooking {
  id: string;
  buyerId?: string;
  userId?: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  campaignId: string;
  offerId: string;
  dealerId: string;
  dealershipName: string;
  branchId?: string;
  branchName?: string;
  status: BookingStatus;
  quotedOnRoadPrice?: number;
  offeredPrice?: number;
  cashDiscount?: number;
  carBrand?: string;
  carModel?: string;
  carVariant?: string;
  timelineDays?: number;
  colorPreference?: string;
  financeNeeded?: boolean;
  confirmedIntentAt?: string;
  purchasedAt?: string;
  cancelledAt?: string;
  finalInvoicedPrice?: number;
  statusHistory?: {
    status: BookingStatus;
    timestamp: string;
    note?: string;
  }[];
  createdAt: string;
  updatedAt?: string;
}

export interface OfferAuditLog {
  id: string;
  recordType: 'offer' | 'dealership' | 'campaign' | 'booking' | 'user';
  targetId: string;
  dealershipName?: string;
  campaignName?: string;
  action:
    | 'dealer_registered'
    | 'dealer_verified'
    | 'dealer_rejected'
    | 'dealer_suspended'
    | 'offer_submitted'
    | 'offer_manager_confirmed'
    | 'offer_updated'
    | 'offer_approved'
    | 'offer_rejected'
    | 'offer_returned_correction'
    | 'group_created'
    | 'group_joined'
    | 'group_closed'
    | 'booking_interest'
    | 'booking_confirmed'
    | 'booking_cancelled'
    | 'car_purchased'
    | 'role_assigned';
  performedByRole: UserRole;
  performedByName: string;
  performedByEmail: string;
  timestamp: string;
  previousStatus?: string;
  newStatus?: string;
  notes?: string;
  version?: number;
}

export interface OfferAnalysis {
  offerId: string;
  realCashSavings: number; // Pure cash + corporate (deterministic)
  claimedPerksValue: number; // Accessories + insurance claims
  netEffectiveOnRoadPrice: number;
  gimmickScore: 'Transparent' | 'Moderate Gimmicks' | 'High Gimmick Alert';
  gimmickFlags: string[];
  transparencyRating: number; // 1 to 10
  pros: string[];
  cons: string[];
  aiSummary: string;
  keyVerdict: string;
}

export interface JoinedBuyer {
  id: string;
  campaignId: string;
  userId?: string;
  fullName: string;
  phone: string;
  email: string;
  colorPreference: string;
  financeRequirement: 'Bank Loan' | 'Cash / Self' | 'Lease';
  willingToBuyInDays: number;
  joinedAt: string;
}

export interface NegotiationBrief {
  campaignId: string;
  carName: string;
  variant: string;
  city: string;
  buyerCount: number;
  totalMarketValue: number;
  targetDiscount: number;
  deadline: string;
  briefText: string;
}
