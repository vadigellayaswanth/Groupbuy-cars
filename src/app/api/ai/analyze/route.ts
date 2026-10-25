import { NextRequest, NextResponse } from 'next/server';
import { analyzeOfferWithAI } from '@/lib/ai/gemini';
import { CarCampaign, DealershipOffer } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { campaign, offer } = body as {
      campaign: CarCampaign;
      offer: DealershipOffer;
    };

    if (!campaign || !offer) {
      return NextResponse.json({ error: 'Missing campaign or offer data' }, { status: 400 });
    }

    const analysis = await analyzeOfferWithAI(campaign, offer);
    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error('Analyze Offer API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to analyze offer' },
      { status: 500 }
    );
  }
}
