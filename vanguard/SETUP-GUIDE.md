# VanGuard — Supabase & Stripe setup guide

Do these once, in **test mode first**, then repeat the Stripe parts in live mode when you're happy. Estimated time: 30–40 min. Nothing here touches your users' existing data destructively.

Have these tabs open: your Supabase project, your Stripe dashboard, and your Netlify site settings.

---

## PART 1 — Supabase (database)

### Step 1.1 — Run the migration
1. Supabase → your project → **SQL Editor** → **New query**.
2. Open `vanguard/migration-pre-ads.sql`, copy everything, paste it in.
3. Click **Run**. You should see "Success. No rows returned."

This adds the new profile columns (subscription status, Stripe customer id, the new onboarding answers, custom checklists, and referral tracking) and updates the signup trigger so referral codes are captured. It's safe to run more than once.

### Step 1.2 — Confirm it worked
1. Supabase → **Table Editor** → `profiles`.
2. Check the columns now include: `subscription_status`, `stripe_customer_id`, `referred_by`, `referral_rewarded`, `custom_checklists`, `water_enabled`, `team_size`, `food_type`.

### Step 1.3 — Decide on email confirmation (affects onboarding)
1. Supabase → **Authentication** → **Sign In / Providers** (or **Settings**) → find **"Confirm email"**.
2. Two valid choices:
   - **ON (recommended for real launch):** new users must click a link in their email before they can sign in. The app now handles this correctly — after signing up they see "Account created — check your inbox to confirm, then sign in."
   - **OFF (fastest for testing):** users go straight into the app after signing up.
3. Either is fine — just know which you picked when you test.

---

## PART 2 — Stripe

> Make sure the **Test mode** toggle (top-right) is ON for now.

### Step 2.1 — Confirm your monthly price
1. Stripe → **Product catalogue** → your VanGuard product.
2. Confirm there's a **recurring £7.99 / month (GBP)** price. If not, add one.
3. Click the price and copy its ID (looks like `price_1Xxxx…`). Keep it for Part 3.
   - *Note:* the code already falls back to your existing price ID, so this is only needed if you want to point it at a different price. The 14-day free trial is added automatically at checkout — you do **not** need a separate "trial price".

### Step 2.2 — Create the referral coupon (2 months free)
1. Stripe → **Product catalogue** → **Coupons** → **New**.
2. Set:
   - **Type:** Percentage discount — **100%**
   - **Duration:** **Repeating**
   - **Number of months:** **2**
   - (Name it e.g. "Referral – 2 months free".)
3. **Create**, then open it and copy the **coupon ID** (e.g. `abc123XY`). Keep it for Part 3.

### Step 2.3 — Activate the Customer Portal (needed for the manage/cancel button)
1. Stripe → **Settings** (top right cog) → **Billing** → **Customer portal**.
2. Turn on at least:
   - **Customers can update payment methods** ✅
   - **Customers can cancel subscriptions** ✅ (choose "immediately" or "at end of period" — your call)
   - **Invoice history** ✅ (optional but nice)
3. Under **Business information**, set your business name / a support link if prompted.
4. Click **Save**.
   - If you skip this, the in-app "Manage or cancel subscription" button will return an error.

### Step 2.4 — Set up the webhook
1. Stripe → **Developers** → **Webhooks** → **Add endpoint** (or open your existing VanGuard endpoint).
2. **Endpoint URL:** `https://vanguardapp.co.uk/.netlify/functions/stripe-webhook`
3. **Events to send** — add these four:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Save, then click **Reveal** on the **Signing secret** (`whsec_…`) and copy it for Part 3.

---

## PART 3 — Netlify (environment variables)

1. Netlify → your site → **Site configuration** → **Environment variables**.
2. Make sure these are set (add the new one, check the rest):

   | Variable | Value |
   |---|---|
   | `STRIPE_SECRET_KEY` | your Stripe secret key (`sk_test_…` now, `sk_live_…` later) |
   | `STRIPE_WEBHOOK_SECRET` | the `whsec_…` from Step 2.4 |
   | `STRIPE_REFERRAL_COUPON` | the coupon ID from Step 2.2 |
   | `SUPABASE_URL` | your Supabase project URL |
   | `SUPABASE_SERVICE_KEY` | Supabase **service role** key (Project settings → API) |
   | `STRIPE_MONTHLY_PRICE_ID` | *(optional)* the price ID from Step 2.1 |

3. **Redeploy** the site (Deploys → Trigger deploy → Deploy site) so the functions pick up the new variables.

---

## PART 4 — Test it (test mode, card `4242 4242 4242 4242`, any future expiry/CVC)

1. **Trial + card:** Sign up a new account → go through onboarding (try removing a checklist line and adding one) → **Start free trial** → Stripe Checkout → you land back in the app. Account → Plan should show "Solo Plan · Free trial · X days left".
2. **Manage/cancel:** In Account → Plan, click **Manage or cancel subscription** → the Stripe portal opens → try "cancel" → you're returned to the app.
3. **Referral:** In account A, copy the referral link (Account → Refer a friend). Open it in a private window, sign up account B through it, complete checkout. In Stripe, open account A's **customer** → you should see the 2-month coupon applied.
4. **Checklists saved:** Sign in as the trial user on another browser — your custom checklist lines should still be there (they're saved to the profile).

---

## PART 5 — Go live

When the tests pass:
1. Flip Stripe to **Live mode** and repeat **Steps 2.1–2.4** in live (coupon, portal activation, and webhook are per-mode — you must recreate them live; the portal settings usually carry over but confirm).
2. In Netlify, swap `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to the **live** values, and `STRIPE_REFERRAL_COUPON` to the **live** coupon ID.
3. Redeploy.
4. Do one real (or £0-trial) end-to-end signup to confirm.

That's everything. If a button ever errors, it's almost always one of: portal not activated (2.3), a missing/typo'd env var (Part 3), or the webhook events not added (2.4).
