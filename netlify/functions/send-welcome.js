exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { email, firstName } = JSON.parse(event.body || '{}');

  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email required' }) };
  }

  const name = firstName || 'there';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Welcome to VanGuard</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:32px 40px;text-align:center;">
            <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-1px;">
              Van<span style="color:#00d4aa;">Guard</span>
            </div>
            <div style="font-size:12px;color:#888;margin-top:4px;letter-spacing:2px;text-transform:uppercase;">Food Safety Compliance</div>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <h1 style="margin:0 0 16px;font-size:24px;color:#1a1a2e;font-weight:700;">Welcome, ${name}! 🎉</h1>
            <p style="margin:0 0 16px;color:#444;line-height:1.6;font-size:15px;">
              You're all set up on VanGuard — the easiest way to stay food safety compliant on the go.
            </p>
            <p style="margin:0 0 24px;color:#444;line-height:1.6;font-size:15px;">
              Here's what you can do right now:
            </p>

            <!-- Feature list -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#00d4aa;font-size:18px;margin-right:10px;">🌡️</span>
                  <span style="color:#333;font-size:14px;"><strong>Log temperatures</strong> — fridge, freezer, hot holding in seconds</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#00d4aa;font-size:18px;margin-right:10px;">📋</span>
                  <span style="color:#333;font-size:14px;"><strong>Run checklists</strong> — opening, closing, and custom job checklists</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="color:#00d4aa;font-size:18px;margin-right:10px;">📝</span>
                  <span style="color:#333;font-size:14px;"><strong>EHO-ready records</strong> — everything logged and timestamped automatically</span>
                </td>
              </tr>
              <tr>
                <td style="padding:10px 0;">
                  <span style="color:#00d4aa;font-size:18px;margin-right:10px;">📱</span>
                  <span style="color:#333;font-size:14px;"><strong>Install as an app</strong> — tap "Add to Home Screen" for quick access</span>
                </td>
              </tr>
            </table>

            <!-- CTA -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="https://vanguardapp.co.uk" style="display:inline-block;background:#00d4aa;color:#1a1a2e;text-decoration:none;font-weight:700;font-size:15px;padding:14px 36px;border-radius:8px;">
                    Open VanGuard →
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#888;font-size:13px;line-height:1.6;">
              Questions? Just reply to this email or reach us at
              <a href="mailto:hello@vanguardapp.co.uk" style="color:#00d4aa;">hello@vanguardapp.co.uk</a>
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
            <p style="margin:0;color:#aaa;font-size:12px;">
              © 2026 VanGuard · <a href="https://vanguardapp.co.uk" style="color:#aaa;">vanguardapp.co.uk</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
  `.trim();

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'VanGuard <hello@vanguardapp.co.uk>',
        to: [email],
        subject: 'Welcome to VanGuard 🎉',
        html,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Resend error:', err);
      return { statusCode: 500, body: JSON.stringify({ error: 'Failed to send email' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('Send welcome error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
