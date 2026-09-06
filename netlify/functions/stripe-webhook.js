const crypto = require('crypto');

const STRIPE_API = 'https://api.stripe.com/v1';

function verifySignature(payload, header, secret) {
  try {
    const parts = header.split(',');
    const ts = parts.find(p => p.startsWith('t=')).slice(2);
    const sig = parts.find(p => p.startsWith('v1=')).slice(3);
    const signed = `${ts}.${payload}`;
    const expected = crypto.createHmac('sha256', secret).update(signed).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

function sbHeaders() {
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  return { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };
}

async function updateProfile(userId, fields) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: sbHeaders(),
    body: JSON.stringify(fields),
  });
}

async function getProfileById(userId) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=id,referred_by,referral_rewarded&limit=1`,
    { headers: sbHeaders() }
  );
  const rows = await res.json();
  return rows?.[0] || null;
}

async function getProfileByCustomer(customerId) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.${customerId}&select=id&limit=1`,
    { headers: sbHeaders() }
  );
  const rows = await res.json();
  return rows?.[0] || null;
}

// A referral code is the first 8 chars of the referrer's user id (see the app).
async function getReferrerByCode(code) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=like.${encodeURIComponent(code)}*&select=id,stripe_customer_id&limit=1`,
    { headers: sbHeaders() }
  );
  const rows = await res.json();
  return rows?.[0] || null;
}

async function stripeGet(path) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
  });
  return res.json();
}

async function stripePost(path, params) {
  const res = await fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

function mapStatus(s) {
  if (s === 'active') return 'active';
  if (s === 'trialing') return 'trialing';
  if (s === 'past_due' || s === 'unpaid') return 'past_due';
  if (s === 'canceled') return 'cancelled';
  return s;
}

// Pull the plan interval, renewal/expiry date and cancellation flag off a subscription.
function subFields(sub) {
  const item = sub.items && sub.items.data && sub.items.data[0];
  const interval = item && item.price && item.price.recurring && item.price.recurring.interval;
  return {
    subscription_status: mapStatus(sub.status),
    plan_interval: interval || null,
    cancel_at_period_end: !!sub.cancel_at_period_end,
    period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
  };
}

// Reward the referrer with 2 months free by attaching a repeating coupon to their
// Stripe customer. Guarded so each new user can only trigger the reward once.
async function rewardReferrer(newUserId) {
  const COUPON = process.env.STRIPE_REFERRAL_COUPON;
  if (!COUPON) return;
  const profile = await getProfileById(newUserId);
  if (!profile || !profile.referred_by || profile.referral_rewarded) return;
  const referrer = await getReferrerByCode(profile.referred_by);
  // Mark as processed regardless, so we never double-credit for this user.
  await updateProfile(newUserId, { referral_rewarded: true });
  if (!referrer || !referrer.stripe_customer_id) return;
  await stripePost(`/customers/${referrer.stripe_customer_id}`, { coupon: COUPON });
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = event.headers['stripe-signature'];

  if (WEBHOOK_SECRET && sig) {
    if (!verifySignature(event.body, sig, WEBHOOK_SECRET)) {
      return { statusCode: 400, body: 'Invalid signature' };
    }
  }

  let stripeEvent;
  try {
    stripeEvent = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { type, data } = stripeEvent;

  try {
    if (type === 'checkout.session.completed') {
      const session = data.object;
      const userId = session.client_reference_id;
      const customerId = session.customer;
      if (userId) {
        const fields = {
          stripe_customer_id: customerId,
          trial_start: new Date().toISOString().slice(0, 10),
        };
        // Resolve the real subscription status + plan details.
        if (session.subscription) {
          const sub = await stripeGet(`/subscriptions/${session.subscription}`);
          Object.assign(fields, subFields(sub));
        } else {
          fields.subscription_status = 'active';
        }
        await updateProfile(userId, fields);
        // Credit whoever referred this new user.
        await rewardReferrer(userId);
      }
    }

    if (type === 'customer.subscription.created' || type === 'customer.subscription.updated') {
      const sub = data.object;
      const userId = sub.metadata && sub.metadata.user_id;
      const profile = userId ? { id: userId } : await getProfileByCustomer(sub.customer);
      if (profile) {
        await updateProfile(profile.id, Object.assign(subFields(sub), { stripe_customer_id: sub.customer }));
      }
    }

    if (type === 'customer.subscription.deleted') {
      const sub = data.object;
      const userId = sub.metadata && sub.metadata.user_id;
      const profile = userId ? { id: userId } : await getProfileByCustomer(sub.customer);
      if (profile) {
        await updateProfile(profile.id, { subscription_status: 'cancelled' });
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  return { statusCode: 200, body: 'OK' };
};
