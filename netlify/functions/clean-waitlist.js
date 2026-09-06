const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json(500, { error: 'Waitlist is not configured yet.' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }

  // Honeypot for simple bots.
  if (body.website) return json(200, { ok: true });

  const name = String(body.name || '').trim();
  const company = String(body.company || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const country = String(body.country || 'GB').trim().toUpperCase();
  const sites = String(body.sites || '1').trim();
  const process = String(body.process || '').trim();

  if (name.length < 1 || name.length > 100) return json(400, { error: 'Please enter your name.' });
  if (company.length < 1 || company.length > 150) return json(400, { error: 'Please enter your company name.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return json(400, { error: 'Please enter a valid email address.' });
  if (!['GB','US','CA','AU','OTHER'].includes(country)) return json(400, { error: 'Please select a valid country.' });
  if (!['1','2-5','6-20','21-50','50+'].includes(sites)) return json(400, { error: 'Please select a valid site range.' });
  if (process.length > 1000) return json(400, { error: 'Please keep the current-process answer under 1,000 characters.' });

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clean_waitlist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        name,
        company_name: company,
        email,
        country_code: country,
        sites_count: sites,
        current_process: process || null,
        source: 'waitlist'
      })
    });

    if (response.ok || response.status === 409) return json(200, { ok: true });
    return json(500, { error: 'We could not save your details. Please try again.' });
  } catch {
    return json(500, { error: 'We could not save your details. Please try again.' });
  }
};
