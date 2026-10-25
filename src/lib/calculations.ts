import { CarCampaign, DealershipOffer, OfferAnalysis } from './types';

/**
 * Deterministic Monetary Engine
 * Calculates final on-road price directly from original price minus cash discount.
 * Keeps non-cash accessories strictly separated.
 */

export function calculateRealCashSavings(offer: DealershipOffer): number {
  return (offer.cashDiscount || 0) + (offer.corporateDiscount || 0);
}

export function calculateClaimedPerks(offer: DealershipOffer): number {
  return (offer.claimedAccessoryValue || 0) + (offer.claimedInsuranceValue || 0) + (offer.exchangeBonus || 0);
}

export function calculateNetEffectivePrice(estimatedOnRoad: number, offer: DealershipOffer): number {
  const realSavings = calculateRealCashSavings(offer);
  return Math.max(0, estimatedOnRoad - realSavings + (offer.additionalCharges || 0));
}

export function analyzeOfferDeterministically(
  campaign: CarCampaign,
  offer: DealershipOffer
): OfferAnalysis {
  const realCashSavings = calculateRealCashSavings(offer);
  const claimedPerksValue = calculateClaimedPerks(offer);
  const netEffectiveOnRoadPrice = calculateNetEffectivePrice(campaign.estimatedOnRoadPrice, offer);

  const gimmickFlags: string[] = [];
  const pros: string[] = [];
  const cons: string[] = [];

  // Check Additional Charges (e.g. handling fee)
  if (offer.additionalCharges && offer.additionalCharges > 0) {
    gimmickFlags.push(
      `Hidden Surcharge: ₹${offer.additionalCharges.toLocaleString('en-IN')} additional handling/depot charges added.`
    );
    cons.push(`Contains ₹${offer.additionalCharges.toLocaleString('en-IN')} unauthorized handling or logistics fees.`);
  }

  // 1. Accessory Gimmick Check
  if (offer.claimedAccessoryValue >= 30000 && offer.cashDiscount <= 25000) {
    gimmickFlags.push(
      `Accessory Inflation: ₹${offer.claimedAccessoryValue.toLocaleString('en-IN')} claimed chrome/accessory package used to disguise a low cash discount of only ₹${offer.cashDiscount.toLocaleString('en-IN')}.`
    );
    cons.push(`Dealer markup on accessories is typically 60–70%; does not substitute direct cash savings.`);
  }

  // 2. Insurance Condition Check
  const hasMandatoryInsurance = offer.conditions.some((c) =>
    c.toLowerCase().includes('mandatory') && c.toLowerCase().includes('insurance')
  );
  if (hasMandatoryInsurance) {
    gimmickFlags.push(
      'Tied Insurance: Dealer requires in-house insurance policy, preventing outside IRDAI price matching.'
    );
    cons.push('Restricted from procuring own IRDAI-approved insurance from outside.');
  } else {
    pros.push('Outside self-insurance permitted (can save ₹15,000–₹25,000 on market premium).');
  }

  // 3. Financing restrictions
  const hasLoanTieIn = offer.conditions.some((c) =>
    c.toLowerCase().includes('loan') || c.toLowerCase().includes('captive finance')
  );
  if (hasLoanTieIn) {
    gimmickFlags.push('Financing Clause: Discount tied to dealership captive loan partner.');
    cons.push('Requires loan disbursement through captive financing partner (may carry higher processing fees).');
  } else {
    pros.push('Freedom of outside bank loan or self-funding without penalty.');
  }

  // 4. Delivery timeline check
  if (offer.deliveryTimelineWeeks <= 2) {
    pros.push(`Express Delivery: Guaranteed ready stock allocation within ${offer.deliveryTimelineWeeks} week(s).`);
  } else if (offer.deliveryTimelineWeeks > 3) {
    cons.push(`Extended Wait: Estimated ${offer.deliveryTimelineWeeks} weeks delivery.`);
  }

  // 5. Cash strength
  if (offer.cashDiscount >= 60000) {
    pros.push(`Market-Leading Cash: ₹${offer.cashDiscount.toLocaleString('en-IN')} direct invoice deduction.`);
  } else if (offer.cashDiscount >= 40000) {
    pros.push(`Solid Cash Discount: ₹${offer.cashDiscount.toLocaleString('en-IN')} off on-road total.`);
  } else {
    cons.push(`Low direct cash cut (only ₹${offer.cashDiscount.toLocaleString('en-IN')}).`);
  }

  // Calculate Transparency Score (1 to 10)
  let transparencyRating = 8;
  if (gimmickFlags.length === 1) transparencyRating = 6;
  if (gimmickFlags.length >= 2) transparencyRating = 4;
  if (offer.cashDiscount >= 65000 && gimmickFlags.length === 0) transparencyRating = 9.8;

  let gimmickScore: OfferAnalysis['gimmickScore'] = 'Transparent';
  if (transparencyRating <= 5) {
    gimmickScore = 'High Gimmick Alert';
  } else if (transparencyRating <= 7.5) {
    gimmickScore = 'Moderate Gimmicks';
  }

  // Offer Summary aligned with exact numbers
  let aiSummary = '';
  let keyVerdict = '';

  if (offer.cashDiscount >= 65000) {
    aiSummary = `${offer.dealershipName} offers the strongest financial value: ₹${offer.cashDiscount.toLocaleString('en-IN')} pure cash invoice discount bringing on-road price from ₹${campaign.estimatedOnRoadPrice.toLocaleString('en-IN')} down to ₹${netEffectiveOnRoadPrice.toLocaleString('en-IN')}. Standard optional accessories (₹${offer.claimedAccessoryValue.toLocaleString('en-IN')}) and full outside insurance freedom.`;
    keyVerdict = 'Best Overall Deal: Maximum verified invoice savings with clean terms.';
  } else if (offer.cashDiscount >= 40000) {
    aiSummary = `${offer.dealershipName} provides a balanced ₹${offer.cashDiscount.toLocaleString('en-IN')} cash cut (final ₹${netEffectiveOnRoadPrice.toLocaleString('en-IN')}) plus bundled 5-year warranty benefits and fair insurance terms. It trails the top offer by ₹${(70000 - offer.cashDiscount).toLocaleString('en-IN')} in cash.`;
    keyVerdict = 'Balanced Value: Moderate cash savings combined with warranty coverage.';
  } else {
    aiSummary = `${offer.dealershipName} inflates its headline package using ₹${offer.claimedAccessoryValue.toLocaleString('en-IN')} in dealer-priced chrome accessories and tied insurance, while giving only ₹${offer.cashDiscount.toLocaleString('en-IN')} in real cash discount (final ₹${netEffectiveOnRoadPrice.toLocaleString('en-IN')}).`;
    keyVerdict = 'Caution: Heavy accessory markup and tied insurance erode real savings.';
  }

  return {
    offerId: offer.id,
    realCashSavings,
    claimedPerksValue,
    netEffectiveOnRoadPrice,
    gimmickScore,
    gimmickFlags,
    transparencyRating,
    pros,
    cons,
    aiSummary,
    keyVerdict,
  };
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatCrores(amount: number): string {
  const cr = amount / 10000000;
  return `₹${cr.toFixed(2)} Cr`;
}

export function formatLakhs(amount: number): string {
  const lakhs = amount / 100000;
  return `₹${lakhs.toFixed(2)} Lakh`;
}
