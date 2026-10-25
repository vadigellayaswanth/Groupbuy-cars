import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_DEALERSHIPS } from '@/lib/mock-data';
import { DealershipAccount } from '@/lib/types';

const apiDealersStore: DealershipAccount[] = [...DEMO_DEALERSHIPS];

export async function GET(req: NextRequest) {
  const user = getAuthenticatedUserFromRequest(req);
  const isStaff = user?.role === 'verification_staff' || user?.role === 'super_admin' || user?.role === 'offer_manager' || user?.role === 'admin';

  let list = apiDealersStore;
  if (!isStaff) {
    // Public/Buyers only see verified dealerships
    list = list.filter((d) => d.verificationStatus === 'verified' || (user?.role === 'dealer' && user.dealershipId === d.id));
  }

  return NextResponse.json({
    dealerships: list,
    count: list.length,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.gstin || !body.managerName || !body.email || !body.phone) {
      return NextResponse.json(
        { error: 'Dealership name, GSTIN, manager contact, and email are required.' },
        { status: 400 }
      );
    }

    const newDealer: DealershipAccount = {
      id: `dealer-${Date.now()}`,
      name: body.name,
      brand: body.brand || 'Hyundai',
      city: body.city || 'Hyderabad',
      authorizedBrands: body.authorizedBrands || ['Hyundai'],
      gstin: body.gstin,
      managerName: body.managerName,
      phone: body.phone,
      email: body.email,
      address: body.address || 'Hyderabad',
      showroomAddress: body.showroomAddress || body.address || 'Hyderabad',
      verificationStatus: 'pending', // Starts in pending verification
      createdAt: new Date().toISOString(),
      branches: body.branches || [],
    };

    apiDealersStore.unshift(newDealer);

    return NextResponse.json(
      {
        success: true,
        dealership: newDealer,
        message: 'Dealership registered successfully. It is currently PENDING verification by Verification Staff.',
      },
      { status: 201 }
    );
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Registration failed' }, { status: 400 });
  }
}
