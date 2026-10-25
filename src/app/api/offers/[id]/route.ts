import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_OFFERS } from '@/lib/mock-data';
import { DealershipOffer, OfferStatus } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getAuthenticatedUserFromRequest(req);

  // 1. RBAC Check: Buyers cannot edit offers
  if (!user || user.role === 'buyer') {
    return NextResponse.json(
      {
        error: 'Permission Denied: Buyers are strictly prohibited from modifying dealership offers.',
        role: user?.role || 'guest_buyer',
      },
      { status: 403 }
    );
  }

  // Find target offer
  const existing = DEMO_OFFERS.find((o) => o.id === id);
  if (!existing) {
    return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
  }

  // 2. Ownership Check: A dealer cannot modify another dealer's offer
  if (user.role === 'dealer' && user.dealershipId && existing.dealerId !== user.dealershipId) {
    return NextResponse.json(
      {
        error: `Security Violation: Your account (${user.dealershipName || user.dealershipId}) cannot modify bids owned by "${existing.dealershipName}".`,
        owningDealerId: existing.dealerId,
        yourDealerId: user.dealershipId,
      },
      { status: 403 }
    );
  }

  try {
    const updates = await req.json();

    // 3. Workflow Rule: If an approved offer is edited, it reverts to pending_review
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

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
      revertedToPending: wasApproved,
      message: wasApproved
        ? 'Notice: Modifying an approved quotation has returned it to "Pending Review". It will remain hidden from buyers until an Offer Manager approves the revised terms.'
        : 'Quotation updated successfully.',
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 400 });
  }
}
