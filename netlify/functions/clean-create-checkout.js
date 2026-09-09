const Stripe = require('stripe');

const PRICE_ENV = {
  starter: { monthly: 'CLEAN_STRIPE_STARTER_MONTHLY_PRICE_ID', yearly: 'CLEAN_STRIPE_STARTER_YEARLY_PRICE_ID' },
  business: { monthly: 'CLEAN_STRIPE_BUSINESS_MONTHLY_PRICE_ID', yearly: 'CLEAN_STRIPE_BUSINESS_YEARLY_PRICE_ID' },
  pro: { monthly: 'CLEAN_STRIPE_PRO_MONTHLY_PRICE_ID', yearly: 'CLEAN_STRIPE_PRO_YEARLY_PRICE_ID' }
};

const json=(statusCode,body)=>({statusCode,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});

async function authenticatedUser(event){
  const supabaseUrl=process.env.SUPABASE_URL,serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const auth=event.headers?.authorization||event.headers?.Authorization||'';
  if(!supabaseUrl||!serviceKey)throw new Error('Authentication is not configured');
  if(!/^Bearer\s+\S+/i.test(auth))return null;
  const r=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:serviceKey,Authorization:auth}});
  if(!r.ok)return null;
  return r.json();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405,{error:'Method not allowed'});
  try {
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) throw new Error('Stripe is not configured');
    const user=await authenticatedUser(event);
    if(!user?.id)return json(401,{error:'Please sign in again before starting your trial.'});
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
      customer_email: user.email || undefined,
      client_reference_id: user.id,
      subscription_data: { trial_period_days: 14, metadata: { product:'vanguard-clean', user_id:user.id, plan } },
      metadata: { product:'vanguard-clean', user_id:user.id, plan },
      success_url: `${process.env.URL || 'https://vanguardapp.co.uk'}/clean?checkout=success`,
      cancel_url: `${process.env.URL || 'https://vanguardapp.co.uk'}/clean?checkout=cancelled`
    });
    return json(200,{url:session.url});
  } catch (e) {
    return json(400,{error:e.message || 'Checkout failed'});
  }
};
