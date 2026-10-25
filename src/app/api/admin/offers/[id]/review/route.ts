import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_OFFERS, DEMO_DEALERSHIPS } from '@/lib/mock-data';
import { DealershipOffer, OfferStatus } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getAuthenticatedUserFromRequest(req);

  // 1. RBAC Check: Only Platform Offer Managers or Super Admins can review offers
  const isAuthorizedReviewer = user?.role === 'offer_manager' || user?.role === 'super_admin' || user?.role === 'admin';
  if (!user || !isAuthorizedReviewer) {
    return NextResponse.json(
      {
        error: 'Permission Denied: Only authorized Platform Offer Managers or Super Admins can review quotations.',
        requiredRoles: ['offer_manager', 'super_admin'],
        currentRole: user?.role || 'unauthenticated',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { decision, reviewNotes } = body as {
      decision: 'approved' | 'rejected' | 'needs_correction';
      reviewNotes?: string;
    };

    if (!['approved', 'rejected', 'needs_correction'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid review decision. Must be approved, rejected, or needs_correction.' },
        { status: 400 }
      );
    }

    const existing = DEMO_OFFERS.find((o) => o.id === id);
    if (!existing) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }

    // 2. Requirement 8: Dealership must be verified before approval can be granted
    const owningDealer = DEMO_DEALERSHIPS.find((d) => d.id === existing.dealerId);
    if (decision === 'approved' && owningDealer?.verificationStatus !== 'verified') {
      return NextResponse.json(
        {
          error: `Cannot Approve: Dealership "${existing.dealershipName}" is not yet verified. Verification Staff must verify the dealership before its offers can be published live.`,
          dealerVerificationStatus: owningDealer?.verificationStatus || 'unverified',
        },
        { status: 400 }
      );
    }

    // 3. Requirement 8: Reason mandatory for needs_correction or rejected
    if ((decision === 'needs_correction' || decision === 'rejected') && (!reviewNotes || reviewNotes.trim().length < 5)) {
      return NextResponse.json(
        { error: 'A specific explanation/reason is mandatory when returning an offer for correction or rejecting it.' },
        { status: 400 }
      );
    }

    const updatedOffer: DealershipOffer = {
      ...existing,
      status: decision,
      adminReviewNotes: reviewNotes,
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.fullName || 'Platform Offer Manager',
      verified: decision === 'approved',
    };

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      message:
        decision === 'approved'
          ? `Offer approved! It is now live and visible in the buyer comparison matrix.`
          : decision === 'needs_correction'
          ? `Offer returned to dealer with notes for required correction.`
          : `Offer rejected.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Review failed' }, { status: 400 });
  }
}
