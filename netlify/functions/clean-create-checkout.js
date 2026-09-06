const Stripe = require('stripe');

const PRICE_ENV = {
  starter: { monthly: 'CLEAN_STRIPE_STARTER_MONTHLY_PRICE_ID', yearly: 'CLEAN_STRIPE_STARTER_YEARLY_PRICE_ID' },
  business: { monthly: 'CLEAN_STRIPE_BUSINESS_MONTHLY_PRICE_ID', yearly: 'CLEAN_STRIPE_BUSINESS_YEARLY_PRICE_ID' },
  pro: { monthly: 'CLEAN_STRIPE_PRO_MONTHLY_PRICE_ID', yearly: 'CLEAN_STRIPE_PRO_YEARLY_PRICE_ID' }
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('Stripe is not configured');
    const stripe = Stripe(secret);
    const body = JSON.parse(event.body || '{}');
    const yearly = body.priceType === 'yearly';
    const plan = ['starter','business','pro'].includes(body.plan) ? body.plan : 'business';
    const envName = PRICE_ENV[plan][yearly ? 'yearly' : 'monthly'];
    const price = process.env[envName];
    if (!price) throw new Error(`${plan} ${yearly ? 'yearly' : 'monthly'} price is not configured`);
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
