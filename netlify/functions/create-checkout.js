exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  if (!STRIPE_SECRET_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Stripe not configured' }) };
  }

  let userId, email, trial, plan;
  try {
    ({ userId, email, trial = false, plan = 'monthly' } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!userId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing user' }) };
  }

  const origin = event.headers.origin || 'https://vanguardapp.co.uk';
  const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TlxLZDCijNgP7Ybb24GGuBw';
  const YEARLY_PRICE_ID = process.env.STRIPE_YEARLY_PRICE_ID;

  if (plan === 'yearly' && !YEARLY_PRICE_ID) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Yearly plan is not configured yet' }) };
  }
  const priceId = plan === 'yearly' ? YEARLY_PRICE_ID : MONTHLY_PRICE_ID;

  // Subscription checkout. Card details are always collected in subscription mode,
  // including when a trial is attached — this is what gates the free trial behind a card.
  const params = new URLSearchParams({
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    'success_url': origin + '/app?checkout=success',
    'cancel_url': origin + '/app?checkout=cancelled',
    'client_reference_id': userId,
    // Require a payment method up front even during the trial.
    'payment_method_collection': 'always',
    // Pass the user id onto the subscription so webhooks can resolve the profile.
    'subscription_data[metadata][user_id]': userId,
  });

  if (trial) {
    params.set('subscription_data[trial_period_days]', '14');
  }

  if (email) {
    params.set('customer_email', email);
  }

  try {
    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
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
