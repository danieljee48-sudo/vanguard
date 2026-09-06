const Stripe = require('stripe');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  const secret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.CLEAN_STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !webhookSecret || !supabaseUrl || !serviceKey) return { statusCode: 500, body: 'Billing webhook is not configured.' };
  try {
    const stripe = new Stripe(secret);
    const signature = event.headers?.['stripe-signature'] || event.headers?.['Stripe-Signature'];
    const stripeEvent = stripe.webhooks.constructEvent(event.body || '', signature, webhookSecret);
    const sub = stripeEvent.data?.object;
    if (['customer.subscription.created','customer.subscription.updated','customer.subscription.deleted'].includes(stripeEvent.type)) {
      const metadata = sub.metadata || {};
      const userId = metadata.user_id;
      if (metadata.product === 'vanguard-clean' && userId) {
        const item = sub.items?.data?.[0];
        const priceId = item?.price?.id || '';
        const plan = metadata.plan || (priceId === process.env.CLEAN_STRIPE_PRO_PRICE_ID ? 'pro' : priceId === process.env.CLEAN_STRIPE_STARTER_PRICE_ID ? 'starter' : 'business');
        const row = { user_id:userId, stripe_customer_id:String(sub.customer||''), stripe_subscription_id:sub.id, plan, billing_interval:item?.price?.recurring?.interval || 'month', status:sub.status, trial_end:sub.trial_end ? new Date(sub.trial_end*1000).toISOString() : null, current_period_end:sub.current_period_end ? new Date(sub.current_period_end*1000).toISOString() : null, cancel_at_period_end:!!sub.cancel_at_period_end, updated_at:new Date().toISOString() };
        const r = await fetch(`${supabaseUrl}/rest/v1/clean_subscriptions?on_conflict=user_id`, { method:'POST', headers:{apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}, body:JSON.stringify(row) });
        if (!r.ok) throw new Error(await r.text());
      }
    }
    return { statusCode:200, body:JSON.stringify({received:true}) };
  } catch(e) { return { statusCode:400, body:JSON.stringify({error:e.message||'Webhook error'}) }; }
};