import { NextRequest, NextResponse } from 'next/server';
import { generateNegotiationBrief } from '@/lib/ai/gemini';
import { CarCampaign } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaign, targetDiscount } = body as {
      campaign: CarCampaign;
      targetDiscount?: number;
    };

    if (!campaign) {
      return NextResponse.json({ error: 'Missing campaign data' }, { status: 400 });
    }

    const result = generateNegotiationBrief(campaign, targetDiscount || 65000);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('RFQ API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate negotiation brief' },
      { status: 500 }
    );
  }
}
