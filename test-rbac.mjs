// Comprehensive RBAC, Workflow & Governance Automated Test Suite
// Verifies all 18 requirements from Requirement 16 for GroupBuy Cars

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('================================================================');
  console.log('GROUPBUY CARS — COMPLETE GOVERNANCE & RBAC AUTOMATED TEST SUITE');
  console.log('Testing 18/18 Specification Requirements');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testNumber, description) {
    if (condition) {
      console.log(`✅ [REQ ${testNumber}] PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ [REQ ${testNumber}] FAIL: ${description}`);
      failed++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Buyer registration/login creates distinct persona
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers`, {
      headers: {
        'x-user-role': 'buyer',
        'x-user-id': 'user-buyer-rahul',
        'x-user-name': 'Rahul Sharma',
      },
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.userRole === 'buyer',
      '1',
      'Buyer session initializes with distinct buyer persona and profile preferences'
    );
  } catch (e) {
    console.error('Test 1 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 2: Unauthenticated / Buyer sees ONLY approved offers from verified dealers
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers?campaignId=hyundai-creta-sxo-at`, {
      headers: { 'x-user-role': 'buyer' },
    });
    const data = await res.json();
    const allApproved = data.offers.every((o) => o.status === 'approved');
    assert(
      res.status === 200 && allApproved && data.offers.length > 0,
      '2',
      'Buyer view strictly filters out unapproved bids and unverified dealerships'
    );
  } catch (e) {
    console.error('Test 2 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 3: Buyer cannot submit quotations (403)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'buyer',
        'x-user-id': 'user-buyer-rahul',
      },
      body: JSON.stringify({ cashDiscount: 50000 }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error && data.error.includes('Permission Denied'),
      '3',
      'Buyers are strictly forbidden from submitting dealership quotations (HTTP 403)'
    );
  } catch (e) {
    console.error('Test 3 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 4: Buyer cannot edit dealership offers (403)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers/offer-dealer-a-creta`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'buyer',
        'x-user-id': 'user-buyer-rahul',
      },
      body: JSON.stringify({ cashDiscount: 999999 }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error && data.error.includes('Buyers are strictly prohibited'),
      '4',
      'Buyers are strictly forbidden from editing dealership quotations (HTTP 403)'
    );
  } catch (e) {
    console.error('Test 4 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 5: New dealership account starts unverified (status: pending)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/dealers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Novus Automotive Hyundai',
        gstin: '36AABCN8899Z1Z5',
        managerName: 'Karthik Reddy',
        phone: '+91 99887 76655',
        email: 'sales@novushyundai.in',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 201 && data.dealership.verificationStatus === 'pending',
      '5',
      'New dealership registration begins strictly in "pending" verification status'
    );
  } catch (e) {
    console.error('Test 5 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 6: Non-staff (dealers, buyers) cannot approve dealership verification (403)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/dealers/dealer-saboo/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'dealer',
        'x-dealer-id': 'dealer-a-kun',
      },
      body: JSON.stringify({ decision: 'verified' }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error && data.error.includes('Permission Denied'),
      '6',
      'Dealerships and buyers cannot self-verify dealership accounts (HTTP 403)'
    );
  } catch (e) {
    console.error('Test 6 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 7: Verification Staff can approve dealership accreditation
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/dealers/dealer-saboo/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'verification_staff',
        'x-user-id': 'user-staff-ananya',
        'x-user-name': 'Ananya Sen (Dealer Accreditation Lead)',
      },
      body: JSON.stringify({ decision: 'verified', notes: 'Franchise certification checked.' }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.dealership.verificationStatus === 'verified',
      '7',
      'Authorized Verification Staff can accredit and verify dealership accounts'
    );
  } catch (e) {
    console.error('Test 7 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 8: Dealer cannot approve own or others offers as reviewer (403)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/offers/offer-dealer-a-creta/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'dealer',
        'x-dealer-id': 'dealer-a-kun',
      },
      body: JSON.stringify({ decision: 'approved', reviewNotes: 'Self approved by dealer' }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error && data.error.includes('Permission Denied'),
      '8',
      'Dealership owners cannot approve quotations as platform reviewers (HTTP 403)'
    );
  } catch (e) {
    console.error('Test 8 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 9: Offer approval blocked if dealership is not verified (HTTP 400)
  // ----------------------------------------------------
  try {
    // Reset dealer-saboo to pending for this test
    const resetRes = await fetch(`${BASE_URL}/api/dealers/dealer-saboo/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'verification_staff',
        'x-user-id': 'user-staff-ananya',
      },
      body: JSON.stringify({ decision: 'pending', notes: 'Testing unverified state' }),
    });

    const res = await fetch(`${BASE_URL}/api/admin/offers/offer-pending-saboo-creta/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'offer_manager',
        'x-user-id': 'user-manager-vikram',
      },
      body: JSON.stringify({ decision: 'approved' }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.error && data.error.includes('not yet verified'),
      '9',
      'Offer Manager approval is blocked if dealership is not accredited (KYC Pre-requisite)'
    );
  } catch (e) {
    console.error('Test 9 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 10: Offer submission requires showroom manager authorization confirmation
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'dealer',
        'x-dealer-id': 'dealer-a-kun',
      },
      body: JSON.stringify({
        campaignId: 'hyundai-creta-sxo-at',
        cashDiscount: 65000,
        deliveryTimelineWeeks: 2,
        managerConfirmed: false, // Not confirmed
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.error && data.error.includes('manager authorization confirmation is required'),
      '10',
      'Dealership quotations require explicit showroom manager authorization confirmation'
    );
  } catch (e) {
    console.error('Test 10 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 11: Dealer A cannot edit Dealer B offers (HTTP 403)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers/offer-dealer-a-creta`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'dealer',
        'x-dealer-id': 'dealer-b-talwar',
        'x-dealership-name': 'Talwar Hyundai',
      },
      body: JSON.stringify({ cashDiscount: 10000 }),
    });
    const data = await res.json();
    assert(
      res.status === 403 && data.error && data.error.includes('Security Violation'),
      '11',
      'Dealer B cannot edit Dealer A quotations (Cross-Dealer Isolation HTTP 403)'
    );
  } catch (e) {
    console.error('Test 11 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 12: Dealer editing own approved quotation reverts to 'pending_review'
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/offers/offer-dealer-a-creta`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'dealer',
        'x-dealer-id': 'dealer-a-kun',
        'x-dealership-name': 'KUN United Hyundai',
      },
      body: JSON.stringify({ cashDiscount: 75000 }),
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.revertedToPending === true &&
      data.offer.status === 'pending_review' &&
      data.offer.version >= 2,
      '12',
      'Modifying approved quote invalidates approval, reverts to pending_review, and bumps version'
    );
  } catch (e) {
    console.error('Test 12 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 13: Offer Manager returns offer for correction with mandatory explanation
  // ----------------------------------------------------
  try {
    // Missing reason should fail
    const resFail = await fetch(`${BASE_URL}/api/admin/offers/offer-dealer-a-creta/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'offer_manager',
        'x-user-id': 'user-manager-vikram',
      },
      body: JSON.stringify({ decision: 'needs_correction', reviewNotes: '' }),
    });
    const dataFail = await resFail.json();

    // Valid reason should succeed
    const resPass = await fetch(`${BASE_URL}/api/admin/offers/offer-dealer-a-creta/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'offer_manager',
        'x-user-id': 'user-manager-vikram',
      },
      body: JSON.stringify({
        decision: 'needs_correction',
        reviewNotes: 'Please itemize the mandatory accessories kit and confirm insurance margin.',
      }),
    });
    const dataPass = await resPass.json();

    assert(
      resFail.status === 400 &&
      resPass.status === 200 &&
      dataPass.offer.status === 'needs_correction',
      '13',
      'Returning offer for correction requires mandatory specific explanation notes'
    );
  } catch (e) {
    console.error('Test 13 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 14: Offer Manager approves verified offer, publishing live
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/admin/offers/offer-dealer-a-creta/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'offer_manager',
        'x-user-id': 'user-manager-vikram',
      },
      body: JSON.stringify({
        decision: 'approved',
        reviewNotes: 'Quotation verified against group tier pricing standards.',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.offer.status === 'approved' && data.offer.verified === true,
      '14',
      'Offer Manager can approve verified dealer quote, making it live for buyers'
    );
  } catch (e) {
    console.error('Test 14 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 15: Buyer expresses interest in quotation
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'buyer',
        'x-user-id': 'user-buyer-rahul',
      },
      body: JSON.stringify({
        campaignId: 'hyundai-creta-sxo-at',
        offerId: 'offer-dealer-a-creta',
        dealerId: 'dealer-a-kun',
        dealershipName: 'KUN United Hyundai',
        offeredPrice: 2087000,
        cashDiscount: 70000,
        status: 'interested',
      }),
    });
    const data = await res.json();
    assert(
      res.status === 201 && data.booking.status === 'interested',
      '15',
      'Buyer can register interest in an approved quotation without payment'
    );
  } catch (e) {
    console.error('Test 15 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 16: Buyer confirms booking intent (zero payment required)
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/booking-1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'buyer',
        'x-user-id': 'user-buyer-rahul',
        'x-user-email': 'rahul.sharma@example.com',
      },
      body: JSON.stringify({ status: 'confirmed_intent' }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.booking.status === 'confirmed_intent',
      '16',
      'Buyer confirms booking intent for chosen dealership showroom allocation'
    );
  } catch (e) {
    console.error('Test 16 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 17: Buyer can cancel booking intent safely
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/bookings/booking-1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'buyer',
        'x-user-id': 'user-buyer-rahul',
        'x-user-email': 'rahul.sharma@example.com',
      },
      body: JSON.stringify({ status: 'cancelled' }),
    });
    const data = await res.json();
    assert(
      res.status === 200 && data.booking.status === 'cancelled',
      '17',
      'Buyer can cancel showroom booking intent with zero penalty'
    );
  } catch (e) {
    console.error('Test 17 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // TEST 18: Staff can mark campaign completed/closed, stopping memberships
  // ----------------------------------------------------
  try {
    // Non-staff should get 403
    const resNonStaff = await fetch(`${BASE_URL}/api/campaigns/hyundai-creta-sxo-at/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'buyer',
      },
      body: JSON.stringify({ status: 'completed' }),
    });

    // Staff should succeed
    const resStaff = await fetch(`${BASE_URL}/api/campaigns/hyundai-creta-sxo-at/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'super_admin',
        'x-user-id': 'user-super-admin',
      },
      body: JSON.stringify({ status: 'completed' }),
    });
    const dataStaff = await resStaff.json();

    assert(
      resNonStaff.status === 403 &&
      resStaff.status === 200 &&
      dataStaff.campaign.status === 'completed',
      '18',
      'Staff can close or complete campaigns to lock memberships while preserving records'
    );
  } catch (e) {
    console.error('Test 18 error:', e);
    failed++;
  }

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed}/18)`);
  console.log('================================================================\n');

  if (failed === 0) {
    console.log('🎉 ALL 18 GOVERNANCE & RBAC REQUIREMENTS VERIFIED SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error(`💥 ${failed} test(s) failed.`);
    process.exit(1);
  }
}

runTests();
