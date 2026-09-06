# Finish deploying VanGuard (test mode)

Claude already added the two non-secret Netlify variables (`STRIPE_MONTHLY_PRICE_ID`, `STRIPE_REFERRAL_COUPON`).
Two secret variables still need updating, and the new code needs deploying. The Netlify CLI does both from your computer.

## Option A — Netlify CLI (recommended, does everything)

Open a terminal (PowerShell) and run, one line at a time:

```powershell
cd "C:\Users\danie\Claude\Projects\Mobile caterer app"

npm install -g netlify-cli        # once. Needs Node.js — if "npm" isn't found, install from nodejs.org first
netlify login                     # opens a browser → Authorise
netlify link                      # choose:  vanguardapp

# set the two SECRET values (test mode):
netlify env:set STRIPE_WEBHOOK_SECRET whsec_YOUR_WEBHOOK_SECRET
netlify env:set STRIPE_SECRET_KEY sk_test_YOUR_TEST_SECRET_KEY   # from Stripe → Developers → API keys (test mode)

# deploy the new code + functions:
netlify deploy --prod
```

If `netlify deploy` asks for a **publish directory**, enter `vanguard`.
When it finishes it prints a "Website URL" — that's live.

## Option B — no CLI

1. **Secrets (Netlify UI):** Site → Configuration → Environment variables. Edit each and paste the new value:
   - `STRIPE_WEBHOOK_SECRET` → `whsec_YOUR_WEBHOOK_SECRET`
   - `STRIPE_SECRET_KEY` → your `sk_test_…` test secret key
2. **Deploy:** Netlify → your site → **Deploys** → drag the whole
   `C:\Users\danie\Claude\Projects\Mobile caterer app` folder onto the deploy area
   (it contains `netlify.toml`, so functions deploy too).

## After deploying — quick test (Stripe test mode, card 4242 4242 4242 4242)
1. Open vanguardapp.co.uk, sign up a new account, go through onboarding, click Start Free Trial → Stripe Checkout → back into the app.
2. Account → Plan → "Manage or cancel subscription" opens the Stripe portal.
3. Referral: copy your link, sign up a second account through it, complete checkout, then check account 1's Stripe customer for the 2-month coupon.

## Before advertising (go live)
Swap the secrets to live values and repeat the Stripe coupon/webhook/portal in live mode:
```powershell
netlify env:set STRIPE_SECRET_KEY sk_live_YOUR_LIVE_KEY
netlify env:set STRIPE_WEBHOOK_SECRET whsec_YOUR_LIVE_WEBHOOK_SECRET
netlify env:set STRIPE_MONTHLY_PRICE_ID price_YOUR_LIVE_PRICE
netlify env:set STRIPE_REFERRAL_COUPON YOUR_LIVE_COUPON_ID
netlify deploy --prod
```

