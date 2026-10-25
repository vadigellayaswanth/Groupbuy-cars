import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_DEALERSHIPS } from '@/lib/mock-data';
import { DealershipAccount } from '@/lib/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getAuthenticatedUserFromRequest(req);

  // 1. RBAC Guard: Only Verification Staff or Super Admin can verify dealerships
  const isAuthorizedStaff = user?.role === 'verification_staff' || user?.role === 'super_admin';
  if (!user || !isAuthorizedStaff) {
    return NextResponse.json(
      {
        error: 'Permission Denied: Only authorized Verification Staff or Super Admins can accredit dealerships.',
        requiredRoles: ['verification_staff', 'super_admin'],
        currentRole: user?.role || 'unauthenticated',
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { decision, notes } = body as {
      decision: 'verified' | 'rejected' | 'suspended';
      notes?: string;
    };

    if (!['verified', 'rejected', 'suspended'].includes(decision)) {
      return NextResponse.json(
        { error: 'Invalid decision. Must be verified, rejected, or suspended.' },
        { status: 400 }
      );
    }

    const dealer = DEMO_DEALERSHIPS.find((d) => d.id === id);
    if (!dealer) {
      return NextResponse.json({ error: 'Dealership not found' }, { status: 404 });
    }

    const updatedDealer: DealershipAccount = {
      ...dealer,
      verificationStatus: decision,
      verificationNotes: notes || `Marked ${decision} by staff.`,
      verifiedAt: decision === 'verified' ? new Date().toISOString() : undefined,
      verifiedBy: user.fullName || 'Verification Staff',
    };

    return NextResponse.json({
      success: true,
      dealership: updatedDealer,
      message: `Dealership "${dealer.name}" accreditation status updated to ${decision.toUpperCase()}.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Verification update failed' }, { status: 400 });
  }
}
