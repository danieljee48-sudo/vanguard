// Stores or removes a user's push subscription in Supabase
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const auth = event.headers['authorization'];
  if (!auth) return { statusCode: 401, body: 'Unauthorized' };

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { subscription, action } = body;
  if (!subscription?.endpoint) {
    return { statusCode: 400, body: 'Missing subscription' };
  }

  const SUPA_URL = process.env.SUPABASE_URL || 'https://qzzwkxborlmmyaukvhga.supabase.co';
  const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!SUPA_SERVICE_KEY) {
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  // Verify the JWT and get user id
  const userRes = await fetch(`${SUPA_URL}/auth/v1/user`, {
    headers: {
      'apikey': SUPA_SERVICE_KEY,
      'Authorization': auth,
    },
  });

  if (!userRes.ok) {
    return { statusCode: 401, body: 'Invalid token' };
  }

  const user = await userRes.json();
  const userId = user.id;

  if (action === 'unsubscribe') {
    await fetch(
      `${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(subscription.endpoint)}&user_id=eq.${userId}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPA_SERVICE_KEY,
          'Authorization': `Bearer ${SUPA_SERVICE_KEY}`,
        },
      }
    ).catch(() => {});
    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  }

  // Upsert subscription
  const record = {
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys?.p256dh || '',
    auth_key: subscription.keys?.auth || '',
  };

  const r = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_SERVICE_KEY,
      'Authorization': `Bearer ${SUPA_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(record),
  });

  if (!r.ok) {
    const err = await r.text();
    console.error('Supabase error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save subscription' }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
