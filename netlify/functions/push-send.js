// Sends daily push notifications to all subscribed users
// This function runs on a schedule (configured in netlify.toml)
// It can also be called manually for testing
const webpush = require('web-push');

exports.handler = async (event) => {
  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const SUPA_URL = process.env.SUPABASE_URL || 'https://qzzwkxborlmmyaukvhga.supabase.co';
  const SUPA_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  if (!VAPID_PUBLIC || !VAPID_PRIVATE || !SUPA_SERVICE_KEY) {
    console.error('Missing env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, or SUPABASE_SERVICE_KEY');
    return { statusCode: 500, body: 'Server misconfigured' };
  }

  webpush.setVapidDetails(
    'mailto:hello@vanguardapp.co.uk',
    VAPID_PUBLIC,
    VAPID_PRIVATE
  );

  // Fetch all push subscriptions
  const res = await fetch(`${SUPA_URL}/rest/v1/push_subscriptions?select=*`, {
    headers: {
      'apikey': SUPA_SERVICE_KEY,
      'Authorization': `Bearer ${SUPA_SERVICE_KEY}`,
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch subscriptions:', await res.text());
    return { statusCode: 500, body: 'Failed to fetch subscriptions' };
  }

  const subs = await res.json();

  if (!subs.length) {
    return { statusCode: 200, body: 'No subscribers' };
  }

  const payload = JSON.stringify({
    title: 'VanGuard — daily check',
    body: "Time to log your opening temperatures and start today's compliance record",
    url: '/',
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints = [];

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key },
        },
        payload
      );
      sent++;
    } catch (e) {
      failed++;
      // 410 Gone = subscription no longer valid, clean it up
      if (e.statusCode === 410 || e.statusCode === 404) {
        staleEndpoints.push(sub.endpoint);
      } else {
        console.error('Push error for', sub.endpoint.slice(0, 40), e.statusCode || e.message);
      }
    }
  }

  // Delete stale subscriptions
  for (const endpoint of staleEndpoints) {
    await fetch(
      `${SUPA_URL}/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      {
        method: 'DELETE',
        headers: {
          'apikey': SUPA_SERVICE_KEY,
          'Authorization': `Bearer ${SUPA_SERVICE_KEY}`,
        },
      }
    ).catch(() => {});
  }

  const summary = `Sent: ${sent}, Failed: ${failed}, Cleaned: ${staleEndpoints.length}`;
  console.log(summary);
  return { statusCode: 200, body: summary };
};
