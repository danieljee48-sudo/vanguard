const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('Stripe is not configured');
    const stripe = Stripe(secret);
    const body = JSON.parse(event.body || '{}');
    const yearly = body.priceType === 'yearly';
    const plan = ['starter','business','pro'].includes(body.plan) ? body.plan : 'business';
    const price = yearly ? process.env.CLEAN_STRIPE_YEARLY_PRICE_ID : process.env.CLEAN_STRIPE_MONTHLY_PRICE_ID;
    if (!price) throw new Error(yearly ? 'Clean yearly price is not configured' : 'Clean monthly price is not configured');
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      payment_method_collection: 'always',
      customer_email: body.email || undefined,
      subscription_data: { trial_period_days: 14, metadata: { product:'vanguard-clean', user_id:String(body.user_id || ''), plan } },
      metadata: { product:'vanguard-clean', user_id:String(body.user_id || ''), plan },
      success_url: `${process.env.URL || 'https://vanguardapp.co.uk'}/clean?checkout=success`,
      cancel_url: `${process.env.URL || 'https://vanguardapp.co.uk'}/clean?checkout=cancelled`
    });
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: session.url }) };
  } catch (e) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message || 'Checkout failed' }) };
  }
};
