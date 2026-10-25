import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_OFFERS, DEMO_DEALERSHIPS } from '@/lib/mock-data';
import { DealershipOffer } from '@/lib/types';

const apiOffersStore: DealershipOffer[] = [...DEMO_OFFERS];

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUserFromRequest(req);
  const { searchParams } = new URL(req.url);
  const campaignId = searchParams.get('campaignId');

  let filtered = apiOffersStore;
  if (campaignId) {
    filtered = filtered.filter((o) => o.campaignId === campaignId);
  }

  const verifiedDealerIds = new Set(
    DEMO_DEALERSHIPS.filter((d) => d.verificationStatus === 'verified').map((d) => d.id)
  );

  const isStaff = user?.role === 'super_admin' || user?.role === 'offer_manager' || user?.role === 'verification_staff' || user?.role === 'admin';

  // RBAC Enforcement on GET
  if (!user || user.role === 'buyer') {
    // Public / Buyers can ONLY see approved offers from verified dealerships
    filtered = filtered.filter((o) => o.status === 'approved' && verifiedDealerIds.has(o.dealerId));
  } else if (user.role === 'dealer') {
    // Dealers can see approved offers + their own offers regardless of status
    filtered = filtered.filter(
      (o) => (o.status === 'approved' && verifiedDealerIds.has(o.dealerId)) || (user.dealershipId && o.dealerId === user.dealershipId)
    );
  }
  // Staff can see all offers

  return NextResponse.json({
    offers: filtered,
    userRole: user?.role || 'public_buyer',
    count: filtered.length,
  });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUserFromRequest(req);

  // 1. RBAC Check: Only dealers can submit offers
  if (!user || user.role !== 'dealer') {
    return NextResponse.json(
      {
        error: 'Permission Denied: Only authenticated dealership partners can submit quotations.',
        requiredRole: 'dealer',
        currentRole: user?.role || 'unauthenticated',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();

    // Check manager authorization confirmation (Requirement 6)
    if (!body.managerConfirmed) {
      return NextResponse.json(
        { error: 'Showroom manager authorization confirmation is required before submitting a quotation.' },
        { status: 400 }
      );
    }

    const newOffer: DealershipOffer = {
      ...body,
      id: `offer-${Date.now()}`,
      dealerId: user.dealershipId || `dealer-${user.id}`,
      dealershipName: user.dealershipName || body.dealershipName || 'Verified Dealership',
      branchId: user.branchId || body.branchId,
      branchName: body.branchName,
      status: 'pending_review', // Strictly starts in pending_review
      version: 1,
      submittedAt: new Date().toISOString(),
      managerConfirmed: true,
      managerConfirmedAt: new Date().toISOString(),
      managerConfirmedBy: user.fullName,
      isDemo: true,
    };

    apiOffersStore.unshift(newOffer);

    return NextResponse.json(
      {
        success: true,
        offer: newOffer,
        message: 'Offer submitted for Platform Offer Manager review. It will become visible to buyers once approved.',
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid quotation data' }, { status: 400 });
  }
}
