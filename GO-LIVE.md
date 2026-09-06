# VanGuard — add yearly plan + go live

Two parts: (A) make the yearly plan work, (B) switch everything from test to live. You can do A in test mode first if you want to try yearly before charging real cards.

## New env var either way
The app now needs `STRIPE_YEARLY_PRICE_ID`. Create a **£69.99/year** recurring price in Stripe, copy its `price_…` id, and set it (see commands below).

---

## PART A — Yearly plan (test mode first, optional)
1. Stripe (Test mode) → Product catalog → your VanGuard product → **Add another price** → Recurring, **Yearly**, **£69.99 GBP** → save → copy the `price_…` id.
2. In PowerShell (still linked):
   ```
   netlify env:set STRIPE_YEARLY_PRICE_ID price_YOUR_TEST_YEARLY_ID
   netlify deploy --prod
   ```
3. Test: start a new trial, pick **Yearly** on the trial screen, use card `4242 4242 4242 4242`.

---

## PART B — Go live (real cards will be charged)

Do all of this with the Stripe **Live mode** toggle ON. Live and test are completely separate — nothing you made in test carries over.

### 1. Recreate the Stripe objects in LIVE
- **Monthly price** — confirm your live £7.99/month price (you may already have one). Copy its `price_…` id.
- **Yearly price** — add a live £69.99/year recurring price. Copy its `price_…` id.
- **Referral coupon** — Coupons → New → 100% off, Duration **Repeating**, **2** months. Copy the coupon id.
- **Customer portal** — Settings → Billing → Customer portal → enable "update payment method" + "cancel subscription" → Save.
- **Webhook** — Developers → Webhooks → add endpoint `https://vanguardapp.co.uk/.netlify/functions/stripe-webhook`, events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`. Copy the live signing secret (`whsec_…`).
- **API key** — Developers → API keys → copy the live **Secret key** (`sk_live_…`).

### 2. Set the live values (PowerShell)
```
netlify env:set STRIPE_SECRET_KEY sk_live_YOUR_LIVE_KEY
netlify env:set STRIPE_WEBHOOK_SECRET whsec_YOUR_LIVE_WEBHOOK_SECRET
netlify env:set STRIPE_MONTHLY_PRICE_ID price_YOUR_LIVE_MONTHLY_ID
netlify env:set STRIPE_YEARLY_PRICE_ID price_YOUR_LIVE_YEARLY_ID
netlify env:set STRIPE_REFERRAL_COUPON YOUR_LIVE_COUPON_ID
```

### 3. Redeploy
```
netlify deploy --prod
```

### 4. Final live check
Do one real sign-up (you can cancel in the trial window so you're not charged). Confirm the trial starts, the manage/cancel button opens the portal, and — ideally with a second account — the referral coupon lands on the referrer in Stripe.

That's it. If a button errors it's almost always a missing env var, the yearly price not set, the portal not activated, or webhook events not added.
