// Emails a food-safety records report (HTML) to a recipient chosen by a signed-in user.
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const reply = (statusCode, obj) => ({
  statusCode,
  headers: { ...CORS, 'Content-Type': 'application/json' },
  body: JSON.stringify(obj),
});

exports.handler = async (event) => {
  // The report opens in an about:blank window (opaque origin on mobile), so the
  // request is cross-origin — handle the CORS preflight and allow it.
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return reply(405, { error: 'Method Not Allowed' });
  }

  let to, subject, html, token;
  try {
    ({ to, subject, html, token } = JSON.parse(event.body || '{}'));
  } catch {
    return reply(400, { error: 'Bad request' });
  }

  if (!to || !html) {
    return reply(400, { error: 'Recipient and report content are required' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return reply(400, { error: "That doesn't look like a valid email address" });
  }

  // Only allow signed-in users to send (prevents anonymous abuse of the endpoint).
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_KEY;
  try {
    const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: KEY, Authorization: `Bearer ${token || ''}` },
    });
    if (!u.ok) {
      return reply(401, { error: 'Please sign in again to email records' });
    }
  } catch {
    return reply(401, { error: 'Could not verify your session' });
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VanGuard <hello@vanguardapp.co.uk>',
        to: [to],
        subject: subject || 'Food Safety Records',
        html,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('Resend error:', err);
      return reply(500, { error: 'Email service failed to send' });
    }
    return reply(200, { ok: true });
  } catch (err) {
    return reply(500, { error: err.message });
  }
};
