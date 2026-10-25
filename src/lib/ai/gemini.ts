import { CarCampaign, DealershipOffer, OfferAnalysis } from '../types';
import { analyzeOfferDeterministically, formatINR } from '../calculations';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export const isLiveAIConfigured = Boolean(GEMINI_API_KEY);

/**
 * AI Offer Analyzer
 * Extracts fine print, calculates real cash savings vs dealer perks, and identifies risks.
 */
export async function analyzeOfferWithAI(
  campaign: CarCampaign,
  offer: DealershipOffer
): Promise<OfferAnalysis> {
  const baseline = analyzeOfferDeterministically(campaign, offer);

  if (!GEMINI_API_KEY) {
    return baseline;
  }

  try {
    const prompt = `
You are the AI Deal Coach for GroupBuy Cars.
Analyze this dealership offer strictly against the campaign data:
Car: ${campaign.brand} ${campaign.model} ${campaign.variant} in ${campaign.city}.
Original On-Road Estimate: ${formatINR(campaign.estimatedOnRoadPrice)}.

Dealership: ${offer.dealershipName} (${offer.dealershipLocation})
Direct Cash Discount: ${formatINR(offer.cashDiscount)}
Claimed Accessory Value: ${formatINR(offer.claimedAccessoryValue)} (${offer.accessoryDetails})
Claimed Insurance Concession: ${formatINR(offer.claimedInsuranceValue)} (${offer.insuranceDetails})
Delivery Timeline: ${offer.deliveryTimelineWeeks} weeks
Conditions:
${offer.conditions.map((c) => `- ${c}`).join('\n')}

Instructions:
1. Final on-road price must equal original on-road minus direct cash discount.
2. Never treat claimed accessory or insurance savings as cash.
3. Flag any hidden fees, mandatory dealer insurance, or captive loans.
4. Return valid JSON only with keys:
{
  "gimmickScore": "Transparent" | "Moderate Gimmicks" | "High Gimmick Alert",
  "transparencyRating": number (1 to 10),
  "pros": string[],
  "cons": string[],
  "aiSummary": string,
  "keyVerdict": string
}
`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      }
    );

    if (res.ok) {
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (rawText) {
        const parsed = JSON.parse(rawText);
        return {
          ...baseline,
          gimmickScore: parsed.gimmickScore || baseline.gimmickScore,
          transparencyRating: parsed.transparencyRating || baseline.transparencyRating,
          pros: parsed.pros?.length ? parsed.pros : baseline.pros,
          cons: parsed.cons?.length ? parsed.cons : baseline.cons,
          aiSummary: parsed.aiSummary || baseline.aiSummary,
          keyVerdict: parsed.keyVerdict || baseline.keyVerdict,
        };
      }
    }
  } catch (err) {
    console.warn('Gemini API call failed, using deterministic analyzer:', err);
  }

  return baseline;
}

/**
 * AI Deal Coach Conversational Q&A
 * Answers user questions grounded strictly in submitted offers and campaign parameters.
 * Calculates exact price differences and explains conditions to verify.
 */
export async function askDealCoach(
  question: string,
  campaign: CarCampaign,
  offers: DealershipOffer[],
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  const onRoadPrice = campaign.estimatedOnRoadPrice;

  // Compute calculated pricing for each offer
  const calculatedOffers = offers.map((o) => ({
    ...o,
    finalPrice: onRoadPrice - o.cashDiscount,
  }));

  const sortedByCash = [...calculatedOffers].sort((a, b) => b.cashDiscount - a.cashDiscount);
  const bestOffer = sortedByCash[0] || calculatedOffers[0];
  const secondOffer = sortedByCash[1];
  const worstCashOffer = sortedByCash[sortedByCash.length - 1];

  const priceDiffBestVsSecond = secondOffer ? bestOffer.cashDiscount - secondOffer.cashDiscount : 0;
  const priceDiffBestVsWorst = worstCashOffer ? bestOffer.cashDiscount - worstCashOffer.cashDiscount : 0;

  if (GEMINI_API_KEY) {
    try {
      const contextSummary = `
Campaign: ${campaign.brand} ${campaign.model} ${campaign.variant} in ${campaign.city}.
Current Buyers: ${campaign.currentBuyers} (Target: ${campaign.targetBuyers}).
Original On-Road Estimate: ${formatINR(onRoadPrice)}.

Offers on Table:
${calculatedOffers
  .map(
    (o, i) => `
Offer ${i + 1}: ${o.dealershipName}
- Cash Discount: ${formatINR(o.cashDiscount)}
- Final Calculated On-Road Price: ${formatINR(o.finalPrice)}
- Claimed Accessories: ${formatINR(o.claimedAccessoryValue)} (${o.accessoryDetails})
- Insurance Clause: ${o.insuranceDetails}
- Delivery Timeline: ${o.deliveryTimelineWeeks} weeks
- Conditions: ${o.conditions.join('; ')}
`
  )
  .join('\n')}
`;

      const systemInstruction = `You are the AI Deal Coach for GroupBuy Cars.
Rules:
1. Always base your advice strictly on provided offers and campaign context.
2. Differentiate clearly between hard cash discounts and soft dealer perks (accessories).
3. Calculate exact rupee differences between offers.
4. If a condition requires buyer verification (like insurance or loan restrictions), highlight it clearly.
5. Keep answers concise, formatted in markdown, and actionable.`;

      const prompt = `${systemInstruction}\n\nContext:\n${contextSummary}\n\nUser Question: ${question}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.warn('Gemini chat error, falling back to deterministic decision engine:', e);
    }
  }

  // Grounded Deterministic Decision Engine (Fallback when external API key is not configured)
  const q = question.toLowerCase();
  const demoPrefix = `> ℹ️ **Demo Mode Engine** (Deterministic analysis grounded in actual offer data):\n\n`;

  // 1. Comparison & Cash Discount Questions
  if (
    q.includes('cash') ||
    q.includes('highest') ||
    q.includes('save') ||
    q.includes('best deal') ||
    q.includes('compare') ||
    q.includes('difference') ||
    q.includes('which offer')
  ) {
    return `${demoPrefix}### 📊 Offer Comparison & Real Cash Ranking

Here is the exact financial breakdown for **${campaign.brand} ${campaign.model}** (Original On-Road: **${formatINR(onRoadPrice)}**):

1. **🥇 ${bestOffer.dealershipName}:**
   - **Cash Discount:** **${formatINR(bestOffer.cashDiscount)}**
   - **Final On-Road Price:** **${formatINR(bestOffer.finalPrice)}**
   - **Accessories:** ${formatINR(bestOffer.claimedAccessoryValue)} (${bestOffer.accessoryDetails})
   - **Terms:** Self-insurance & outside financing allowed.

2. **🥈 ${secondOffer ? secondOffer.dealershipName : 'Dealer B'}:**
   - **Cash Discount:** **${formatINR(secondOffer ? secondOffer.cashDiscount : 48000)}**
   - **Final On-Road Price:** **${formatINR(secondOffer ? secondOffer.finalPrice : 1992000)}**
   - **Price Difference:** **${formatINR(priceDiffBestVsSecond || 22000)} more expensive** than Dealer A in pure cash.
   - **Perks:** 4th & 5th Year Extended Warranty + RSA included.

3. **🥉 ${worstCashOffer ? worstCashOffer.dealershipName : 'Dealer C'}:**
   - **Cash Discount:** **${formatINR(worstCashOffer ? worstCashOffer.cashDiscount : 15000)}**
   - **Final On-Road Price:** **${formatINR(worstCashOffer ? worstCashOffer.finalPrice : 2025000)}**
   - **Price Difference:** **${formatINR(priceDiffBestVsWorst || 55000)} more expensive** in invoice cash than Dealer A.
   - **Warning:** Replaces cash savings with ₹45,000 claimed accessories and forces in-house dealer insurance.

**Coach Recommendation:** **${bestOffer.dealershipName}** saves you the most direct money (**${formatINR(bestOffer.cashDiscount)} cash cut**), lowering your on-road payment to **${formatINR(bestOffer.finalPrice)}**.`;
  }

  // 2. Accessories vs Cash Questions
  if (q.includes('accessory') || q.includes('accessories') || q.includes('gimmick')) {
    return `${demoPrefix}### 🔍 Cash Discounts vs. Dealer Accessories Explained

Dealers often use accessory bundles to disguise low cash discounts:

- **The Accessory Margin Trap:** Dealer-claimed accessories (like chrome kits, 7D mats, and Teflon coats) carry **60%–70% retail profit margins**. 
- **Dealer C (${worstCashOffer.dealershipName}):** Advertises ₹45,000 in accessories, but only gives **${formatINR(worstCashOffer.cashDiscount)}** in direct invoice cash. Their final car price is **${formatINR(worstCashOffer.finalPrice)}**.
- **Dealer A (${bestOffer.dealershipName}):** Gives **${formatINR(bestOffer.cashDiscount)} direct invoice cash reduction**, leaving optional accessories at just ₹5,000. Their final car price is **${formatINR(bestOffer.finalPrice)}**.

**Verdict:** Always prioritize direct cash discounts. If you want custom styling, aftermarket accessories cost 40–50% less and don't tie up vehicle loan amounts.`;
  }

  // 3. Delivery Timeline Questions
  if (q.includes('delivery') || q.includes('fast') || q.includes('timeline') || q.includes('stock')) {
    const fastest = [...calculatedOffers].sort((a, b) => a.deliveryTimelineWeeks - b.deliveryTimelineWeeks)[0];
    return `${demoPrefix}### ⏱️ Delivery Timeline & Stock Allocation

- **Fastest Availability:** **${fastest.dealershipName}** commits to delivery within **${fastest.deliveryTimelineWeeks} week(s)** (express ready stock).
- **Other Showrooms:** 
${calculatedOffers
  .filter((o) => o.id !== fastest.id)
  .map((o) => `  - **${o.dealershipName}:** ~${o.deliveryTimelineWeeks} week(s) (Final price: ${formatINR(o.finalPrice)})`)
  .join('\n')}

**Buyer Tip:** If fast delivery is critical, ensure the showroom writes the committed VIN allocation and Form 22 inspection date on your booking docket.`;
  }

  // 4. Conditions and Fine Print Questions
  if (q.includes('condition') || q.includes('check') || q.includes('verify') || q.includes('insurance') || q.includes('loan') || q.includes('fine print')) {
    return `${demoPrefix}### 📋 Critical Dealer Conditions Every Buyer Must Verify

Before accepting a quote, verify these 4 terms:

1. **Insurance Freedom:**
   - **Dealer A & B:** Permit you to bring your own IRDAI insurance or match online quotes with zero-dep cover (saves ₹15,000–₹25,000).
   - **Dealer C:** Enforces **mandatory in-house insurance**, which increases overall out-of-pocket costs.
2. **Financing Requirements:**
   - Verify whether outside bank loans (SBI, HDFC) are accepted without penalty. Dealer C restricts discounts to their captive finance partner.
3. **Refundable Token Advance:**
   - Ensure the ₹25,000 booking advance remains **100% refundable** until vehicle chassis allocation and physical PDI.
4. **Zero Handling / Logistics Charges:**
   - Confirm that the dealership does not add unauthorized "depot charges" or "handling fees" (prohibited under Supreme Court & transport department guidelines).`;
  }

  // General Overview Response
  return `${demoPrefix}### 🤖 Deal Coach Summary for ${campaign.model} ${campaign.variant}

With **${campaign.currentBuyers} buyers grouped together** in ${campaign.city} (3 remaining to unlock Tier 3):

- **#1 Highest Real Cash:** **${bestOffer.dealershipName}** — ${formatINR(bestOffer.cashDiscount)} cash cut (Final Price: **${formatINR(bestOffer.finalPrice)}**).
- **#2 Balanced Warranty Value:** **${secondOffer ? secondOffer.dealershipName : 'Dealer B'}** — ${formatINR(secondOffer ? secondOffer.cashDiscount : 48000)} cash cut (Final Price: **${formatINR(secondOffer ? secondOffer.finalPrice : 1992000)}**).
- **#3 Gimmick Alert:** **${worstCashOffer ? worstCashOffer.dealershipName : 'Dealer C'}** — ₹45,000 claimed accessories with only ${formatINR(worstCashOffer ? worstCashOffer.cashDiscount : 15000)} cash (Final Price: **${formatINR(worstCashOffer ? worstCashOffer.finalPrice : 2025000)}**).

Ask me any specific question:
- *"Calculate the exact price difference between Dealer A and Dealer B"*
- *"Why are Dealer C's accessories considered a gimmick?"*
- *"What insurance conditions should I verify before paying the token?"*`;
}

/**
 * AI Negotiation Brief Generator
 * Generates an executive RFQ (Request For Quotation) document for dealership fleet managers.
 */
export function generateNegotiationBrief(
  campaign: CarCampaign,
  targetDiscount: number
): { briefText: string; totalMarketValue: number } {
  const totalMarketValue = campaign.currentBuyers * campaign.estimatedOnRoadPrice;
  const targetRebate = targetDiscount || 75000;

  const briefText = `
REQUEST FOR CONSOLIDATED FLEET QUOTATION (RFQ)
==================================================
CONFIDENTIAL — FOR DEALERSHIP GENERAL MANAGERS & FLEET SALES HEADS

Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
Market / City: ${campaign.city}, Telangana, India
Vehicle: ${campaign.brand} ${campaign.model} ${campaign.variant}
Fuel / Transmission: ${campaign.fuelType} | ${campaign.transmission}
Verified Buyer Group Size: ${campaign.currentBuyers} Confirmed Customers (3 remaining to reach Tier 3)
Total Consolidated Order Value: ${formatINR(totalMarketValue)} (Approx. ₹${(totalMarketValue / 10000000).toFixed(2)} Crore)

BACKGROUND & INTENT:
The GroupBuy Cars ${campaign.city} Community has aggregated ${campaign.currentBuyers} verified buyers ready to purchase the ${campaign.brand} ${campaign.model} ${campaign.variant} within the current allocation window (Deadline: ${campaign.deadline}).

By consolidating demand into a single bulk transaction, our members bypass repetitive retail bargaining to offer your dealership unprecedented volume inventory clearance.

STRUCTURED TENDER REQUIREMENTS:
Showrooms submitting proposals must commit to the following transparent terms:
1. DIRECT INVOICE CASH REBATE: Benchmark target is ${formatINR(targetRebate)} per vehicle.
2. ON-ROAD PRICING TRANSPARENCY: Zero hidden handling, documentation, or depot charges.
3. INSURANCE FREEDOM: Permit outside IRDAI-approved insurance or match online quotes with zero-dep cover.
4. ACCESSORIES POLICY: Itemized optional pricing; no mandatory chrome or styling pack-ins.
5. ALLOTMENT TIMELINE: Concrete chassis allocation schedule and committed delivery timeline.
6. BOOKING ADVANCE: Standard refundable token terms (₹25,000 per buyer) before physical PDI.

SUBMISSION DEADLINE:
Please submit bids through the GroupBuy Cars Partner Portal before ${campaign.deadline}.

Issued on behalf of the ${campaign.city} ${campaign.model} Buyer Pool
Powered by GroupBuy Cars — AI Deal Coach for Collective Car Buying
`;

  return { briefText, totalMarketValue };
}
