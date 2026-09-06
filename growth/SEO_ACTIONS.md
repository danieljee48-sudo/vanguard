# VanGuard SEO — work done 16 Aug 2026, and what's next

---

## The headline finding

**Four of your nine content pages have never been live.** You built `daily-food-safety-diary-mobile-caterers`, `how-to-log-food-temperatures-mobile-catering`, `lpg-gas-equipment-safety-checks-mobile-catering` and `how-to-create-eho-inspection-pack` on 7 August. They're on your laptop. They are not on the internet.

I confirmed this three ways: your live sitemap serves 8 URLs while your local one has 12; `vanguardapp.co.uk/daily-food-safety-diary-mobile-caterers` currently returns the **homepage**; and git shows those files as untracked, never committed.

So roughly 40% of your content has been earning nothing for ten days. Nothing else in this document matters as much as fixing that.

**Second finding, nearly as bad:** your `netlify.toml` had a catch-all rule sending every unmatched URL to the homepage with an HTTP **200**. I verified it live — `vanguardapp.co.uk/this-page-does-not-exist-test-12345` serves your homepage and reports success. Google reads that as a soft 404, and it means any typo'd, stale or scraped link can quietly index as another duplicate of `/`. On a four-week-old domain with almost no authority, duplicate-homepage signals are the last thing you want. Fixed.

---

## What I changed

Everything below is done, local, and waiting on a deploy. Originals backed up before I touched anything.

### Conversion — so organic readers actually start trials

Your guides read well but they were built to inform, not convert. Each one now has:

| Change | Why |
|---|---|
| **A closing CTA on all 9 pages**, written per page and leading with the loss, not the feature | You had one CTA mid-article and nothing at the end — the exact point where an engaged reader finishes and leaves. Copy follows the fear trigger your own playbook names as the messaging spine ("Don't lose your rating to missing paperwork"), not feature lists. |
| **Sticky trial bar on mobile** | Caterers read this on a phone between services. The bar stays visible without covering content. |
| **Your free PDF checklist is now linked** from every guide and the homepage footer | `checklist.pdf` has been sitting in the folder since 13 Aug, linked from nowhere. It's a no-signup, no-email offer — it raises dwell time, gives bouncing visitors something to take, and it's the asset other sites will actually link to. |
| **Fixed a CTA on your pillar page that pointed at the homepage instead of the signup flow** | `food-safety-app-mobile-caterers` is your second-highest-impression page. Its main "Start free trial →" button sent people to `/` — a dead end mid-funnel. |
| **CTA click tracking on every trial button**, tagged by position (`nav`, `mid`, `end`, `sticky`, `hero`, `pricing`, `closing`, `demo`) | This is the one that pays off long-term. In GA4 you'll now see a `cta_click` event with `page_path` and `cta_location`, so you can answer "which guide produces trials" instead of guessing. Given the £140 Meta lesson, measuring this before you scale anything seemed like the point. |

### Technical

- **Real 404 page** (`404.html`) replacing the soft-404 behaviour. It's `noindex, follow`, lists all nine guides, and carries a trial CTA — so a broken link recovers a visitor instead of dumping them on a confusing homepage.
- **Catch-all redirect scoped to `/app/*`** only. I checked your app code first: it only uses `replaceState` to tidy query strings and has no deep client-side routes, so nothing breaks. Your extensionless guide URLs resolve via Netlify's own file matching, which takes precedence over redirects — verified against pages that are already live.
- **Sitemap updated** — 12 URLs plus the checklist PDF, `lastmod` refreshed to today on everything genuinely edited.
- **Schema `dateModified` refreshed** on all nine pages; stripped the `| VanGuard` suffix out of Article `headline` values, where it was padding the headline field with brand boilerplate.
- Validated every JSON-LD block parses and every page's tag structure balances after editing.

---

## ⚠️ You need to run the deploy — I can't

I said I'd deploy it and then found I can't, so: the shell I can run on your machine has **no network access**, and the cloud sandbox I do have network in has no Netlify credentials. There's also no git remote on this repo, so there's no push-to-deploy path either. Nothing I can do about that from here.

It's one command. In a terminal at `C:\Users\danie\Claude\Projects\Mobile caterer app`:

```
npx netlify-cli deploy --prod
```

The site is already linked (`.netlify/state.json` has the site ID), so it should just go. First run will ask you to authorise in a browser.

**Please don't drag-and-drop the folder into Netlify instead.** Your `netlify.toml` disables asset post-processing, and the comment in that file says the minifier previously truncated `app/index.html` and broke the live site. A drag-drop deploy risks losing that setting.

### Check these four things after it goes live

1. `vanguardapp.co.uk/daily-food-safety-diary-mobile-caterers` shows the diary guide, not the homepage.
2. `vanguardapp.co.uk/this-page-does-not-exist-test-12345` shows the new 404 page.
3. `vanguardapp.co.uk/app` still loads the app normally. **This is the one to check carefully** — it's the only change with any risk attached.
4. `vanguardapp.co.uk/checklist.pdf` downloads.

Then in Search Console: **Sitemaps → resubmit `sitemap.xml`**, and use **URL Inspection → Request indexing** on the four new guides. That's the difference between Google finding them this week and finding them next month.

---

## Backlinks — the actual constraint

Your on-page work is genuinely strong. It isn't what's holding you back. A domain that went live on 18 July with almost no inbound links cannot rank for competitive terms yet, no matter how good the schema is. This is the part that needs doing, roughly in this order.

### Tier 1 — do this week, highest return per hour

**1. Google Business Profile.** Free, high authority, and it's the single biggest missing signal for a UK service business. Set up as a service-area business (answer "No" to "location customers can visit", set service area to United Kingdom). Category: Software company. Details are already written out in your `VanGuard-distribution-playbook.md` §0 — use them verbatim so your NAP stays consistent.

**2. Bing Places** — mirrors the above, takes ten minutes.

**3. Capterra + GetApp.** One free listing appears on both. This is the highest-authority genuinely relevant directory for a B2B tool, and it sends buyer-intent traffic rather than just link equity.

### Tier 2 — niche relevance, which Google weights harder than generic directories

**4. Street Food Hub** (`streetfoodhub.co.uk`) — **your best single target.** I read their UK street food regulations page: it's an editorial publication that already links out to the FSA, Gas Safe Register, HSE and NCASS. A compliance guide from you is a natural fit for that page or a follow-up piece. They have a Contact page and a media pack, so they're open to approaches. Pitch a genuine contributed guide, not a link request.

**5. NCASS** (`ncass.org.uk`) — already flagged in your own playbook as the biggest lever, still not approached. Worth an email this week about the supplier/partner side.

**6. Mobilers** (`mobilers.co.uk`) — runs an active mobile-catering blog and publishes practical business content for exactly your audience. Approach with a contributed piece.

**7. Local council food-safety business pages.** Many councils publish "resources for food businesses" lists. A polite email offering your free checklist to your own council, plus two or three neighbouring ones, converts more often than it sounds like it should — these are `.gov.uk` links, which are worth a lot.

### Tier 3 — worth doing, don't over-invest

SaaSHub, AlternativeTo, and a Product Hunt launch when you're ready to plan the day around it.

### One thing I'd skip

`market-stalls.co.uk` has a links page and an explicit "Link Exchange Programme". Reciprocal link schemes are exactly what Google's guidelines name as a manipulative pattern, and the page is low quality. Not worth the risk for a domain with no authority buffer.

**Reality check on timing:** none of this shows up in rankings for four to eight weeks. Backlinks are the slowest-acting thing in SEO. Do them now precisely because of that lag.

---

## Two open items I can't resolve for you

**1. The £99 lifetime pricing claim.** Flagged in the 7 Aug session and still unresolved. `food-safety-app-mobile-caterers.html` says *"VanGuard offers a one-off lifetime access option for £99"*, and `terms.html` describes lifetime access as a real product. Nothing else — homepage, pricing, schema — mentions it. I've deliberately left both alone, because if it's genuine I shouldn't remove it, and if it isn't, that's a pricing claim in your terms of service and I shouldn't be the one guessing. **Tell me which it is and I'll make both files consistent.**

**2. Search Console access.** Chrome is signed into `danieljee93@gmail.com`, which has no properties on it — so I couldn't pull your ranking data. Sign into `vanguardappuk@gmail.com` and I'll check which queries are closest to page one, and whether the four new pages get indexed after you deploy. That last part is worth doing about a week after the deploy.

---

## What to expect

Deploying the four missing guides is the only change here with a near-term ranking effect, and even that is "Google finds four new pages on a young domain" rather than a jump. The conversion work should show up faster — you'll see it as a higher trial rate per visitor, not more visitors.

Honest framing: at ~60 impressions and 3 clicks a month, you don't have enough traffic for on-page tweaks to move a needle. The order of operations is get everything live → fix the measurement → build authority → then optimise on real data. That's what today did the first two of.
