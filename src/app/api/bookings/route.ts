import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_BOOKINGS } from '@/lib/mock-data';
import { BuyerBooking } from '@/lib/types';

const apiBookingsStore: BuyerBooking[] = [...DEMO_BOOKINGS];

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUserFromRequest(req);
  const isStaff = user?.role === 'super_admin' || user?.role === 'offer_manager' || user?.role === 'verification_staff' || user?.role === 'admin';

  let list = apiBookingsStore;
  if (!isStaff) {
    if (user?.role === 'dealer' && user.dealershipId) {
      list = list.filter((b) => b.dealerId === user.dealershipId);
    } else if (user?.role === 'buyer') {
      list = list.filter((b) => b.userId === user.id || b.buyerEmail === user.email);
    } else {
      list = [];
    }
  }

  return NextResponse.json({
    bookings: list,
    count: list.length,
  });
}

export async function POST(req: NextRequest) {
  const user = getAuthenticatedUserFromRequest(req);

  try {
    const body = await req.json();

    const newBooking: BuyerBooking = {
      id: `booking-${Date.now()}`,
      campaignId: body.campaignId,
      offerId: body.offerId,
      dealerId: body.dealerId,
      branchId: body.branchId,
      branchName: body.branchName,
      userId: user?.id || `user-buyer-${Date.now()}`,
      buyerName: user?.fullName || body.buyerName || 'Verified Buyer',
      buyerPhone: user?.phone || body.buyerPhone || '+91 98765 43210',
      buyerEmail: user?.email || body.buyerEmail || 'buyer@example.com',
      carBrand: body.carBrand || 'Hyundai',
      carModel: body.carModel || 'Creta',
      carVariant: body.carVariant || 'SX (O) 1.5 Turbo Petrol DCT',
      dealershipName: body.dealershipName,
      offeredPrice: body.offeredPrice,
      cashDiscount: body.cashDiscount,
      status: body.status || 'interested',
      timelineDays: body.timelineDays || 30,
      colorPreference: body.colorPreference,
      financeNeeded: body.financeNeeded || false,
      confirmedIntentAt: body.status === 'confirmed_intent' ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    apiBookingsStore.unshift(newBooking);

    return NextResponse.json(
      {
        success: true,
        booking: newBooking,
        message: body.status === 'confirmed_intent'
          ? 'Booking intent confirmed! Showroom will prioritize your allocation. No payment collected online.'
          : 'Interest expressed for quotation.',
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed creating booking intent' }, { status: 400 });
  }
}
