# VanGuard — pre-advertising changes

What I changed in the app, and the steps you must do yourself before this goes live. **Please test on a Netlify deploy preview / branch first — these touch payments.** Originals are backed up in `_backup_pre_ads/`.

## 1. Lifetime membership removed
- Removed the £99 "Founding Member / lifetime" buy buttons from the landing page, the Account → Plan section, and the trial-expired paywall.
- The monthly £7.99 plan is now the single, featured option.
- Existing lifetime members (if any) keep full access — the display code for `subscription_status = 'lifetime'` is retained; only the ability to *buy* it is gone.

## 2. Referral bonus — 2 months free to the referrer
- The referral card now reads "get 2 months free" and explains the referrer is credited when a friend starts their trial.
- When a referred friend completes their trial checkout, the webhook attaches a repeating Stripe coupon to the **referrer's** customer, giving them 2 free months. Guarded by `referral_rewarded` so each new user credits at most once.
- **You must create the coupon** (see below). Without `STRIPE_REFERRAL_COUPON` set, referrals are tracked but no credit is applied.

## 3. Free trial now requires a card
- Signup flow is now: register → onboarding → **Start Trial screen** → Stripe Checkout (subscription mode, `trial_period_days = 14`, card required) → app.
- Card is collected up front; the customer is **not charged for 14 days** and auto-converts to £7.99/mo unless cancelled.
- Trial/subscription state is driven by Stripe webhooks (`trialing` / `active` / `past_due` / `cancelled`).
- All "no card required" copy has been updated.

## 4. Desktop — light polish
- On screens ≥768px the centred app column now sits on a branded navy gradient backdrop with a soft shadow frame, so it reads as an intentional desktop layout rather than a stranded phone view. (You chose "light polish only".)

## 5. Onboarding fixed + expanded
- **First-login bug:** if email confirmation is on, signup used to leave the button spinning forever. It now shows "Account created — check your inbox to confirm, then sign in."
- Onboarding writes the profile with `upsert`, so it works even if the profile row hasn't been created yet.
- **More questions:** water tank on board, solo vs. team, what you mainly serve (plus existing unit type, LPG, authority, hygiene rating). All are also editable later in Account → Profile.
- **Checklist step:** onboarding now shows the Opening / Closing / Cleaning checklists and lets users remove default lines or add their own. Choices are saved to `profiles.custom_checklists` and mirrored to local storage so the Daily Diary reflects them (and they follow the user across devices).

## 6. Animations
Left for you, as requested.

---

# What YOU need to do before advertising

### A. Run the database migration
Supabase → SQL Editor → paste and run `migration-pre-ads.sql` (idempotent). It adds the new profile columns and makes signup capture the referral code.

### B. Stripe setup (do in **test mode** first)
1. **Monthly price** — confirm your recurring £7.99/mo price ID. It's read from env `STRIPE_MONTHLY_PRICE_ID` (falls back to the existing hard-coded `price_1TlxLZ…`). No special "trial price" is needed — the 14-day trial is applied at checkout.
2. **Referral coupon** — create a coupon: 100% off, Duration = *Repeating*, Duration in months = **2**. Copy its ID into env `STRIPE_REFERRAL_COUPON`.
3. **Webhook** — in Stripe → Developers → Webhooks, ensure your endpoint (`/.netlify/functions/stripe-webhook`) is subscribed to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.

### C. Netlify environment variables
Confirm these are set: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, and the new `STRIPE_REFERRAL_COUPON` (and optionally `STRIPE_MONTHLY_PRICE_ID`).

### D. Test on a deploy preview (Stripe test mode, card 4242 4242 4242 4242)
- New signup → onboarding (try adding/removing checklist lines) → Start Trial → Checkout → land in app as `trialing`; Account shows "X days left".
- Referral: from account A copy the referral link, sign up account B via it and complete checkout, then confirm account A's Stripe customer shows the 2-month coupon.
- Trial-expired paywall and monthly subscribe still work.

## Manage / cancel subscription (Stripe Billing Portal) — added
- Account → Plan now has a **"Manage or cancel subscription"** button (and "Manage or cancel trial" while trialing, "Update payment details" if a payment fails). These open the official Stripe Billing Portal where the user can update their card, view invoices, or cancel — no emailing you required.
- New function: `netlify/functions/create-portal.js`. **You must activate the Customer Portal in Stripe once** (see the setup guide) or the button will error.

## Known caveats / suggested follow-ups
- **Existing accounts without a card** will now be routed to the Start Trial screen on next login (expected, since you're moving to card-required trials).
- **Water tank:** the answer is stored, but the Van screen still shows the water tab for everyone (not gated), to avoid hiding it from current users. Say the word if you want it gated on the toggle.
- End-to-end payment/DB behaviour could not be tested from here — hence the deploy-preview testing steps above.
