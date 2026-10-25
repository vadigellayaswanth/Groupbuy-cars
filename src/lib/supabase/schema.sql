-- GroupBuy Cars — Multi-Role Governance Database Schema
-- Production PostgreSQL & Supabase RLS Schema with 5 Defined Roles:
-- 1. buyer
-- 2. dealer (dealership owner / fleet manager)
-- 3. verification_staff (dealer onboarding & accreditation)
-- 4. offer_manager (quotation review & market moderation)
-- 5. super_admin (full governance & audit oversight)

-- =========================================================================
-- 1. EXTENSIONS
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. USER PROFILES & RBAC ROLES (Linked to auth.users)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'dealer', 'verification_staff', 'offer_manager', 'super_admin')) DEFAULT 'buyer',
  dealership_id TEXT, -- E.g. 'dealer-a-kun' if role is 'dealer'
  dealership_name TEXT,
  branch_id TEXT,
  staff_title TEXT,
  city TEXT DEFAULT 'Hyderabad',
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 3. DEALERSHIP ACCOUNTS & SHOWROOM BRANCHES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.dealership_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  authorized_brands TEXT[] NOT NULL,
  gstin TEXT NOT NULL UNIQUE,
  manager_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  address TEXT NOT NULL,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('pending', 'verified', 'rejected', 'suspended')) DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.dealership_branches (
  id TEXT PRIMARY KEY,
  dealership_id TEXT NOT NULL REFERENCES public.dealership_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  manager_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. CAR CAMPAIGNS (DEMAND POOLS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  variant TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Hyderabad',
  ex_showroom_price BIGINT NOT NULL,
  estimated_on_road_price BIGINT NOT NULL,
  image_url TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  target_buyers INT NOT NULL,
  min_buyers INT NOT NULL DEFAULT 5,
  max_buyers INT NOT NULL DEFAULT 50,
  current_buyers INT NOT NULL DEFAULT 0,
  deadline DATE NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 5. CAMPAIGN MEMBERS (JOINED BUYERS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.campaign_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  color_preference TEXT,
  finance_requirement TEXT,
  willing_to_buy_days INT DEFAULT 30,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_buyer_per_campaign UNIQUE(campaign_id, phone)
);

-- =========================================================================
-- 6. DEALERSHIP OFFERS (STRUCTURED COMMERCIAL QUOTATIONS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.dealer_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE CASCADE,
  dealer_id TEXT NOT NULL REFERENCES public.dealership_accounts(id) ON DELETE CASCADE,
  dealership_name TEXT NOT NULL,
  dealership_location TEXT NOT NULL,
  branch_id TEXT REFERENCES public.dealership_branches(id) ON DELETE SET NULL,
  branch_name TEXT,
  dealer_contact TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_review', 'approved', 'rejected', 'needs_correction')) DEFAULT 'pending_review',
  version INT NOT NULL DEFAULT 1,
  cash_discount BIGINT NOT NULL,
  claimed_accessory_value BIGINT DEFAULT 0,
  mandatory_accessories BOOLEAN DEFAULT FALSE,
  accessory_details TEXT,
  claimed_insurance_value BIGINT DEFAULT 0,
  insurance_details TEXT,
  corporate_discount BIGINT DEFAULT 0,
  exchange_bonus BIGINT DEFAULT 0,
  other_benefits TEXT,
  delivery_timeline_weeks INT NOT NULL,
  offer_validity_date DATE NOT NULL,
  additional_charges BIGINT DEFAULT 0,
  financing_requirements TEXT,
  warranty_included TEXT DEFAULT 'Standard 3 Year OEM Warranty',
  min_confirmed_bookings_required INT DEFAULT 3,
  max_booking_quota INT,
  supporting_evidence_notes TEXT,
  manager_confirmed BOOLEAN DEFAULT FALSE,
  manager_confirmed_at TIMESTAMPTZ,
  manager_confirmed_by TEXT,
  conditions JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC(2,1) DEFAULT 4.5,
  admin_review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. BUYER BOOKINGS & PURCHASES PIPELINE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.buyer_bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.dealer_offers(id) ON DELETE CASCADE,
  dealer_id TEXT NOT NULL REFERENCES public.dealership_accounts(id) ON DELETE CASCADE,
  branch_id TEXT,
  branch_name TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  car_brand TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_variant TEXT NOT NULL,
  dealership_name TEXT NOT NULL,
  offered_price BIGINT NOT NULL,
  cash_discount BIGINT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('interested', 'confirmed_intent', 'purchased', 'cancelled')) DEFAULT 'interested',
  timeline_days INT DEFAULT 30,
  color_preference TEXT,
  finance_needed BOOLEAN DEFAULT FALSE,
  confirmed_intent_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  final_invoiced_price BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_booking_buyer_offer UNIQUE (user_id, offer_id)
);

-- =========================================================================
-- 8. PLATFORM AUDIT TRAIL (IMMUTABLE LOGS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.offer_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_type TEXT NOT NULL DEFAULT 'offer',
  target_id TEXT NOT NULL,
  campaign_name TEXT,
  dealership_name TEXT,
  action TEXT NOT NULL,
  performed_by_role TEXT NOT NULL,
  performed_by_name TEXT NOT NULL,
  performed_by_email TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  previous_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  version INT
);

-- =========================================================================
-- 9. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_auth_dealer_id()
RETURNS TEXT AS $$
  SELECT dealership_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN AS $$
  SELECT role IN ('verification_staff', 'offer_manager', 'super_admin')
  FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =========================================================================
-- 10. AUTOMATED TRIGGER: INVALIDATE APPROVED STATUS ON DEALER EDIT
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_dealer_offer_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If modified by a dealer and previously approved, automatically demote to pending_review
  IF (public.get_auth_role() = 'dealer') THEN
    IF (OLD.status = 'approved') THEN
      NEW.status := 'pending_review';
    END IF;
    NEW.version := OLD.version + 1;
    NEW.submitted_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_dealer_offer_update ON public.dealer_offers;
CREATE TRIGGER tr_dealer_offer_update
  BEFORE UPDATE ON public.dealer_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_dealer_offer_update();

-- =========================================================================
-- 11. ENABLE ROW LEVEL SECURITY (RLS)
-- =========================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealer_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 12. RLS POLICIES
-- =========================================================================

-- USER PROFILES
CREATE POLICY "Users read own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id OR public.is_staff());

CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- DEALERSHIP ACCOUNTS
CREATE POLICY "Verified dealerships publicly visible" ON public.dealership_accounts
  FOR SELECT USING (verification_status = 'verified' OR public.is_staff() OR id = public.get_auth_dealer_id());

CREATE POLICY "Dealers can register dealership" ON public.dealership_accounts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can verify or modify dealership" ON public.dealership_accounts
  FOR UPDATE USING (public.get_auth_role() IN ('verification_staff', 'super_admin'));

-- CAMPAIGNS (DEMAND POOLS)
CREATE POLICY "Public read campaigns" ON public.campaigns
  FOR SELECT USING (true);

CREATE POLICY "Buyers can create new pools" ON public.campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update campaign status" ON public.campaigns
  FOR UPDATE USING (public.get_auth_role() IN ('offer_manager', 'super_admin'));

-- CAMPAIGN MEMBERS
CREATE POLICY "Buyers read own memberships" ON public.campaign_members
  FOR SELECT USING (auth.uid() = user_id OR public.is_staff());

CREATE POLICY "Buyers can join pool" ON public.campaign_members
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyers can leave pool" ON public.campaign_members
  FOR DELETE USING (auth.uid() = user_id OR public.is_staff());

-- DEALER OFFERS
-- Buyers see ONLY approved offers from verified dealerships!
CREATE POLICY "Buyers view approved verified offers" ON public.dealer_offers
  FOR SELECT USING (
    (status = 'approved' AND EXISTS (
      SELECT 1 FROM public.dealership_accounts d
      WHERE d.id = dealer_offers.dealer_id AND d.verification_status = 'verified'
    ))
    OR public.is_staff()
    OR (public.get_auth_role() = 'dealer' AND dealer_id = public.get_auth_dealer_id())
  );

CREATE POLICY "Dealers insert offers for own showroom" ON public.dealer_offers
  FOR INSERT WITH CHECK (
    public.get_auth_role() = 'dealer' AND dealer_id = public.get_auth_dealer_id()
  );

CREATE POLICY "Dealers update own offers" ON public.dealer_offers
  FOR UPDATE USING (
    (public.get_auth_role() = 'dealer' AND dealer_id = public.get_auth_dealer_id())
    OR public.get_auth_role() IN ('offer_manager', 'super_admin')
  );

-- BUYER BOOKINGS
CREATE POLICY "Buyers view own bookings" ON public.buyer_bookings
  FOR SELECT USING (
    auth.uid() = user_id
    OR (public.get_auth_role() = 'dealer' AND dealer_id = public.get_auth_dealer_id())
    OR public.is_staff()
  );

CREATE POLICY "Buyers create booking intents" ON public.buyer_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Buyers can cancel own booking" ON public.buyer_bookings
  FOR UPDATE USING (
    auth.uid() = user_id
    OR (public.get_auth_role() = 'dealer' AND dealer_id = public.get_auth_dealer_id())
    OR public.is_staff()
  );

-- AUDIT LOGS
CREATE POLICY "Staff and dealers view audit logs" ON public.offer_audit_logs
  FOR SELECT USING (public.is_staff() OR public.get_auth_role() = 'dealer');

CREATE POLICY "System inserts audit logs" ON public.offer_audit_logs
  FOR INSERT WITH CHECK (true);
