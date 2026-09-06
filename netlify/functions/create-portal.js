// Creates a Stripe Billing Portal session so the user can manage or cancel their
// subscription (update card, cancel, view invoices) from inside the app.
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  let userId;
  try {
    ({ userId } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }
  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing user' }) };
  }

  const origin = event.headers.origin || 'https://vanguardapp.co.uk';

  try {
    // Look the customer id up server-side (don't trust the client for it).
    const pr = await fetch(
      SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=stripe_customer_id&limit=1',
      { headers: { apikey: SUPABASE_SERVICE_KEY, Authorization: 'Bearer ' + SUPABASE_SERVICE_KEY } }
    );
    const rows = await pr.json();
    const customerId = rows && rows[0] && rows[0].stripe_customer_id;
    if (!customerId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No subscription found for this account' }) };
    }

    const params = new URLSearchParams({
      customer: customerId,
      return_url: origin + '/app?screen=account',
    });

    const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + STRIPE_SECRET_KEY,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
    const session = await res.json();

    if (!res.ok) {
      const msg = (session.error && session.error.message) || 'Stripe error';
      return { statusCode: 400, body: JSON.stringify({ error: msg }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
