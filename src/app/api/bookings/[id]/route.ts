import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_BOOKINGS } from '@/lib/mock-data';
import { BuyerBooking } from '@/lib/types';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getAuthenticatedUserFromRequest(req);

  const booking = DEMO_BOOKINGS.find((b) => b.id === id);
  if (!booking) {
    return NextResponse.json({ error: 'Booking record not found' }, { status: 404 });
  }

  const isStaff = user?.role === 'super_admin' || user?.role === 'offer_manager' || user?.role === 'verification_staff' || user?.role === 'admin';
  const isOwnerBuyer = user?.role === 'buyer' && (user.id === (booking as any).userId || user.id === (booking as any).buyerId || user.email === booking.buyerEmail);
  const isOwnerDealer = user?.role === 'dealer' && (user.dealershipId === booking.dealerId || user.dealerId === booking.dealerId);

  if (!isStaff && !isOwnerBuyer && !isOwnerDealer) {
    return NextResponse.json(
      { error: 'Permission Denied: You cannot modify bookings belonging to another user or dealership.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updatedBooking: BuyerBooking = {
      ...booking,
      ...body,
      confirmedIntentAt: body.status === 'confirmed_intent' ? new Date().toISOString() : booking.confirmedIntentAt,
      cancelledAt: body.status === 'cancelled' ? new Date().toISOString() : (booking as any).cancelledAt,
      purchasedAt: body.status === 'purchased' ? new Date().toISOString() : (booking as any).purchasedAt,
    };

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: `Booking status updated to ${updatedBooking.status.toUpperCase()}.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Update failed' }, { status: 400 });
  }
}
