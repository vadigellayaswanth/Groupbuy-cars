import { NextRequest, NextResponse } from 'next/server';
import { askDealCoach } from '@/lib/ai/gemini';
import { CarCampaign, DealershipOffer } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, campaign, offers, chatHistory } = body as {
      question: string;
      campaign: CarCampaign;
      offers: DealershipOffer[];
      chatHistory: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!question || !campaign || !offers) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const answer = await askDealCoach(question, campaign, offers, chatHistory);
    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Deal Coach API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process AI response' },
      { status: 500 }
    );
  }
}
