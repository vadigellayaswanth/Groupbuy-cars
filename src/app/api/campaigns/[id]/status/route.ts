import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserFromRequest } from '@/lib/api-auth';
import { DEMO_CAMPAIGNS } from '@/lib/mock-data';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = getAuthenticatedUserFromRequest(req);

  const isStaff = user?.role === 'super_admin' || user?.role === 'offer_manager' || user?.role === 'admin';
  if (!user || !isStaff) {
    return NextResponse.json(
      { error: 'Permission Denied: Staff authorization required to change campaign status.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { status } = body;
    if (!['active', 'completed', 'closed'].includes(status)) {
      return NextResponse.json({ error: 'Invalid campaign status.' }, { status: 400 });
    }

    const campaign = DEMO_CAMPAIGNS.find((c) => c.id === id);
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    campaign.status = status;

    return NextResponse.json({
      success: true,
      campaign,
      message: `Campaign marked ${status.toUpperCase()}.`,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed updating campaign status' }, { status: 400 });
  }
}
