# VanGuard — Reddit Distribution Playbook
_Built 16 Aug 2026. Subscriber counts and rules pulled live from Reddit the same day._

---

## Read this first — what the research actually found

I used Map of Reddit to walk the graph outward from r/foodtrucks, r/restaurateur, r/smallbusinessuk and r/KitchenConfidential, then verified every candidate's real subscriber count and rule set directly against Reddit.

**The brief as written can't be met honestly.** Here's why:

1. **There is no large UK mobile-catering subreddit.** r/streetfooduk has **77 members**. r/FoodTruckBusiness has **132** and is restricted. r/catering has **3,531**. r/streetfood has **4,644** and is restricted (approved posters only). The UK caterer niche simply has not formed on Reddit — it lives on Facebook and Instagram, which is exactly where your existing playbook already points.

2. **Almost every sub that has 5,000+ of the right people bans promotional links.** r/foodtrucks (46.9k): _"Do not post links to social media accounts, websites, phone numbers, emails, etc. without prior moderator approval."_ r/restaurantowners (60.5k): _"No spam or self promotion"_ + _"No data collection for business services, app ideas."_ r/smallbusinessuk (78k): _"Do not advertise or promote your business"_ + _"90% of your reddit activity must be non-self-promotional."_ r/smallbusiness (2.5M): _"No links, product recommendations… No business promotion posts."_ r/Entrepreneur (5.3M): _"No promotion, sales, or solicitation."_

3. **The subs that DO welcome links are full of founders, not caterers.** r/SideProject, r/SaaS, r/microsaas, r/indiehackers, r/alphaandbetausers, r/roastmystartup — combined ~2M members, all happy to take your link. None of them contain your buyer. They'll give you clicks and product feedback. They will give you approximately **zero trials that convert to paying caterers.** This is the exact failure mode that burned £140 on Meta: reach without the right audience.

**So the plan below is altered.** It gets you to 15 subreddits, but sorts them by what they're actually for, and the trial-generating tier is the small one — because that's the truth of the channel.

### Honest expectation setting

Reddit is a **slow-burn, credibility-first** channel for this product. Realistic outcome from doing everything below properly over 3–4 weeks: **200–600 clicks, 5–20 trials, 1–3 of which are genuine UK caterers.** If someone promised you more from 15 link-drops, they were wrong. The value here is (a) a handful of high-intent trials, (b) free product feedback from founders, (c) backlinks and brand searches that help the SEO you've already built.

**The single highest-value Reddit action is #1 in Tier A: get mod permission in r/foodtrucks.** Everything else is secondary.

---

## Before you post anything — account mechanics

This is where most people fail before the copy ever matters.

| Check | Why |
|---|---|
| **Account age 30+ days, 100+ comment karma** | Most of these subs auto-remove posts from new/low-karma accounts before a human ever sees them. If your account is fresh, spend 5 days commenting genuinely first. |
| **Don't post the same link twice in a week** | Reddit's site-wide spam filter shadowbans domains posted repeatedly across subs in a short window. You won't get a warning — your posts will just be invisible to everyone but you. |
| **Max one promotional post per day, across all of Reddit** | Two in a day is the classic shadowban trigger. |
| **Check your own posts in a logged-out browser** | The only reliable way to know you haven't been shadowbanned. Do this after your first two posts. |
| **Fill in your Reddit profile** | Bio: "Built VanGuard — food safety record-keeping for UK mobile caterers." Pin a post about it on your own profile. People who find you helpful in comments will click through. This converts better than any link-drop and breaks no rules. |
| **Comment 3–5 times in a sub before you post in it** | Mods look at this. So does the automod. |

### Tracking
Every link below already carries a UTM per your `GROWTH_TRACKER.md` scheme:

```
https://vanguardapp.co.uk/<page>?utm_source=reddit&utm_medium=community&utm_content=<subreddit>&utm_campaign=launch2026
```

Swap `<subreddit>` per post so GA4 tells you which sub actually produced trials. Kill anything that produces clicks but no trials after two attempts.

> ⚠️ Verify the guide URLs resolve without `.html` before posting (your source files are `eho-inspection-checklist-mobile-caterers.html` etc.). Netlify usually serves both, but a 404 in a Reddit post is unrecoverable.

---

## TIER A — Real caterers. This is where trials come from.
_Small, slow, rule-bound. Worth 10× the rest._

| # | Subreddit | Members | Links allowed? | Play |
|---|---|---|---|---|
| 1 | **r/foodtrucks** | 46,866 | Only with **prior mod approval** — and that's written into the rule | Message mods first (script below). Highest-value single action on this whole list. |
| 2 | **r/restaurantowners** | 60,478 | No promo, no app posts, no referral links | Comment-only. Answer inspection/record-keeping questions. Profile does the selling. |
| 3 | **r/restaurateur** | 28,332 | "Do Not Advertise Your Business" | Comment-only. Same play. |
| 4 | **r/smallbusinessuk** | 78,006 | No advertising, no blog links, 90% non-promo activity required | **Best UK audience on Reddit.** Comment-only, plus one genuine "here's what I learned" post after you've built karma there. |
| 5 | **r/catering** | 3,531 | **No rules configured at all** — link-friendly by default | Under 5k, but it's caterers and you can post freely. Post the checklist. |
| 6 | **r/streetfood** | 4,644 | Restricted — approved submitters only | Message mods for posting access. Low effort, might work. |
| 7 | **r/KitchenConfidential** | 1,844,058 | "No self promotion of any kind without explicit permission" | Comment-only. Huge, chef-heavy, some own vans. Pure credibility play. |

**Also noted, too small to be worth your time:** r/streetfooduk (77), r/FoodTruckBusiness (132, restricted), r/FoodService (4,391), r/eventplanning (1,174, restricted).

---

## TIER B — Founder/maker subs. Links welcome. Feedback, not caterers.
_Use these for product feedback, backlinks and a small traffic bump. Do not expect paying customers._

| # | Subreddit | Members | Links allowed? | Notes |
|---|---|---|---|---|
| 8 | **r/SideProject** | 810,631 | ✅ Yes — the sub exists for it | No rule list at all, but the sidebar mandates a title format: `[Project name] - [Short description]`. |
| 9 | **r/EntrepreneurRideAlong** | 720,153 | ✅ Yes — only 3 rules, all civility | Loves build-in-public stories. Your £140 Meta failure is the hook. |
| 10 | **r/indiehackers** | 187,650 | ✅ Yes — self-promo is literally a rule category | Post revenue/journey content. |
| 11 | **r/microsaas** | 209,702 | ✅ Yes, if substantive ("No low-effort self-promotion") | Good fit — VanGuard is textbook micro-SaaS. |
| 12 | **r/alphaandbetausers** | 42,255 | ✅ Yes — the sidebar *requires* a product link | Must tag the title with stage and system, e.g. `[Beta]`. Straight beta-tester call. |
| 13 | **r/roastmystartup** | 33,863 | ✅ Yes — a link is required | You'll get harsh, useful feedback. Thick skin needed. |
| 14 | **r/SaaS** | 781,912 | ⚠️ Weekly promo thread only — "No Promotional or Advertising SaaS" as top-level posts. No shortened URLs. | Post in their pinned promo thread, or write a genuine lessons post. |

---

## TIER C — Big UK subs. Comments only, never links.
_Where your buyers' neighbours are. Zero promo tolerance. Use for spotting questions to answer._

| # | Subreddit | Members | Use |
|---|---|---|---|
| 15 | **r/UKfood** | 181,320 | "No Spam or Pure Advertising." Watch for food-business threads. |
| — | r/smallbusiness | 2,522,833 | US-heavy. Comment-only. |
| — | r/Entrepreneur | 5,257,923 | Comment-only. |
| — | r/AskUK / r/CasualUK / r/unitedkingdom | 2.4M / 2.8M / 5.5M | Only if a food-business question appears. Never post. |
| — | r/LegalAdviceUK | 1,311,596 | EHO/hygiene-rating questions land here surprisingly often. Answer them well. |
| — | r/selfemployed | 16,796 | "No Advertising." Comment-only. |

**Saved search to run daily (2 minutes):** search Reddit for `EHO inspection`, `hygiene rating`, `food safety records`, `fridge temperature log` sorted by New. Answer anything from a real trader, properly, with no link. That is the single most reliable trial source on Reddit.

---

# THE POSTS

---

## POST 1 — Mod message to r/foodtrucks (do this first)

**Send to:** r/foodtrucks modmail
**Subject:** Permission to share a free EHO/health-inspection checklist?

> Hi mods,
>
> I read rule 2 about no links without prior approval, so asking before posting rather than after.
>
> I've built a free, no-signup checklist covering what health inspectors actually look for in a mobile unit — temperature logs, cleaning records, the paperwork gaps that cost people ratings. It's a plain web page, no email capture, no paywall.
>
> Full disclosure: I also run a paid app that automates the same record-keeping for UK caterers. The checklist itself is free and standalone, and I'm happy to post it with no mention of the app at all if you'd prefer, or to not post it if it's not a fit.
>
> Would that be OK, and if so is there a format you'd rather I used?
>
> Thanks either way.

_If they say yes, use Post 2. If they say no, respect it — do not post anyway. Getting banned from the one good sub is the worst outcome available._

---

## POST 2 — r/foodtrucks (only after mod approval)

**Title:** Made a free health-inspection checklist after watching a mate lose two rating points over paperwork

> Not selling anything with this post — it's a free page, no signup, no email.
>
> A friend of mine runs a burger trailer and got marked down at his last inspection. Food was fine. Handling was fine. He lost points purely on "confidence in management" — meaning he couldn't produce written records for his fridge temps and cleaning schedule. He'd been doing all of it. He just hadn't been writing it down.
>
> That's apparently the most common way mobile units lose points, so I put together a checklist of what officers actually ask to see and what records you should have ready:
>
> [LINK: /eho-inspection-checklist-mobile-caterers?utm_source=reddit&utm_medium=community&utm_content=foodtrucks&utm_campaign=launch2026]
>
> It's written for the UK system (EHO / Food Hygiene Rating Scheme) so the terminology won't map perfectly if you're in the US, but the underlying principle does: **if it isn't written down, it didn't happen.**
>
> Happy to answer questions about the UK side in the comments if it's useful.

**Note:** be honest in comments if asked what you do. "I build an app that does this digitally — link's in my profile if you want it, not going to push it here" performs far better than deflecting.

---

## POST 3 — r/catering (no rules, link freely)

**Title:** Free checklist: what an inspector actually asks to see in a mobile unit

> Put this together for UK mobile caterers — food trucks, trailers, coffee vans. It covers the records an environmental health officer will ask for on the day: fridge and hot-hold temperatures, cleaning schedule, supplier records, allergen info, and the "confidence in management" section that quietly decides most of your score.
>
> Free page, no signup: [LINK: ?utm_content=catering]
>
> The single most common thing that costs people points isn't dirty equipment — it's not being able to produce written records for things they genuinely were doing. Worth a look before your next visit.

---

## POST 4 — r/EntrepreneurRideAlong (build-in-public; your strongest Tier B post)

**Title:** Burned £140 on Meta ads for my B2B micro-SaaS and got exactly zero signups. Here's what the data actually showed.

> Context: I built a food-safety compliance app for UK mobile caterers — food trucks, coffee vans, trailers. Launched mid-July. It solves a real, boring, expensive problem: caterers lose hygiene-rating points not for bad food but for missing paperwork, and a dropped rating costs them event bookings.
>
> I ran Meta ads. £140.64 spent, 36,056 people reached, **0 trials.**
>
> When I finally sat down with the numbers instead of the dashboard:
>
> - 323 visitors in 28 days, **average engagement time 15 seconds.** That's bounce-level. People were landing and leaving instantly.
> - 66% of that traffic was paid. Revenue across every channel: £0.00.
> - My biggest ad set was literally named "uk broad" — broad UK targeting, no niche filter. £34.91, 8,025 people reached, zero trial starts.
> - Worse: I found a *second*, forgotten Google Ads campaign still running at £10/day, flagged "Misconfigured — your website is missing a Google tag." It had been spending blind for weeks with no conversion tracking at all.
>
> The lesson wasn't "Meta doesn't work." It was that **I was optimising for a purchase event that had never once fired**, so the algorithm had no signal to learn from, and I was showing a niche B2B tool to the general UK population.
>
> What I'm doing instead: direct outreach to caterers on Instagram, partnerships with the trailer builders who sell them their vans in the first place, and content aimed at the exact search terms they use. Slower, free, and the early signals are better than anything the £140 bought.
>
> Happy to share the actual campaign screenshots if useful. And if you're running paid on a niche B2B product, please go check whether you have a stray campaign running — I genuinely didn't know mine existed.
>
> [Link in profile if you want to see what the product is — not the point of the post.]

_This is the post most likely to do well anywhere on Reddit. It's specific, numerical, self-critical, and the product is incidental. Do NOT put the link in the body here — put it in a comment if someone asks._

---

## POST 5 — r/SideProject / r/microsaas / r/indiehackers

**Title for r/microsaas and r/indiehackers:** Built a compliance app for food trucks. 5 signups in a month. Here's the unglamorous reality of B2B micro-SaaS.

**Title for r/SideProject — this sub mandates a title format** (`[Project name] - [Short description]`), so use: **VanGuard - Food safety record keeping for UK mobile caterers, 5 signups in a month and here's what I got wrong**

> **What it is:** UK mobile caterers (food trucks, coffee vans, trailers) have to log fridge temperatures, cleaning schedules and equipment checks. Most do it on paper, or don't. Environmental health inspectors mark them down for it, and a poor hygiene rating loses them event bookings. VanGuard turns it into a minute a day on a phone and generates the inspection report in one tap.
>
> **Stack:** static site on Netlify, Supabase for auth and data. No app store — it's a web app, because asking a caterer to install something is a conversion cliff.
>
> **Numbers, honestly:** live since mid-July. 5 total signups, of which realistically 1 is a genuine organic user. £140 wasted on Meta ads that produced nothing. ~20 SEO articles published, currently pulling 3 clicks a month from Google because the domain is four weeks old.
>
> **What I've learned so far:**
> - Cold paid ads for a niche B2B tool are a money incinerator. The audience isn't targetable at that scale.
> - The channel that's actually moving is embarrassingly manual: DMing individual food truck owners on Instagram after genuinely engaging with their posts.
> - The highest-leverage partner isn't a customer — it's the trailer builders and hygiene-course providers who already sell to caterers on day one.
>
> **What I'd like feedback on:** the landing page. I suspect I'm leading with features when I should be leading with the fear — "don't lose your hygiene rating to missing paperwork." Does the current page make that clear in five seconds?
>
> [LINK: https://vanguardapp.co.uk?utm_source=reddit&utm_medium=community&utm_content=sideproject&utm_campaign=launch2026]

_Change `utm_content` per sub. Post to one of these three per week, not all three in one day._

---

## POST 6 — r/alphaandbetausers

**Title:** [Beta] Food-safety record keeping for UK mobile caterers — free 14-day trial, no card, want brutal feedback

> **Who it's for:** UK food trucks, coffee vans, catering trailers, event caterers. If you're not one, the feedback I need is on clarity and onboarding rather than the domain itself.
>
> **What it does:** log fridge/hot-hold temperatures, cleaning schedules and van checks in seconds on your phone, then generate a complete inspection-ready report in one tap. Replaces the paper diary that inspectors mark people down for not having.
>
> **What I want to know:**
> 1. From landing page to first logged record — where do you stall?
> 2. Is it obvious within 5 seconds what this is and who it's for?
> 3. Anything that feels like it needs an explanation you'd have to read.
>
> 14-day trial, no card required. If you're an actual caterer, message me and I'll set you up free permanently as a founding user in exchange for honest feedback.
>
> [LINK: ?utm_content=alphaandbetausers]

---

## POST 7 — r/roastmystartup

**Title:** Roast my food-safety app for food trucks — £140 spent, 5 signups, 1 of them real

> [LINK: ?utm_content=roastmystartup]
>
> **What it is:** compliance record-keeping for UK mobile caterers. Log temps and cleaning checks, hand the inspector a full report in one tap.
>
> **Where I know it's weak:** I think the homepage explains what it does before it explains why anyone should care. The actual buying trigger is fear of losing a hygiene rating, and I'm not sure that lands.
>
> **The numbers, so you can roast accurately:** live 4 weeks. 5 signups total, ~1 genuine. £140.64 on Meta ads → 36,056 reach → 0 trials. 15-second average engagement time on site.
>
> Go on then. Particularly interested in whether the pricing (£7.99/mo, 14-day trial no card) is wrong for this market.

---

## POST 8 — r/smallbusinessuk (only after 2+ weeks of genuine commenting)

**No link. Text post only.** This sub requires 90% non-promotional activity and bans blog links outright.

**Title:** For anyone in food: your hygiene rating probably depends more on your paperwork than your kitchen

> Something I've learned the hard way talking to a lot of mobile caterers this year.
>
> The Food Hygiene Rating Scheme scores three things: hygiene, structure, and **confidence in management**. That last one is roughly a third of your score, and it's essentially "can you prove, in writing, that you do what you say you do."
>
> Loads of small food businesses lose points there while being genuinely clean and careful. They're checking their fridge temps. They're just not writing them down, or they're writing them on a scrap of paper that's gone by inspection day.
>
> If you run anything food-related, the cheap wins are:
> - Write the fridge temp down twice a day, dated, even in a notebook. Consistency matters more than the format.
> - Keep a cleaning schedule with initials and dates against it.
> - Keep supplier invoices — traceability gets asked about more than people expect.
> - Have your allergen matrix written and current.
>
> None of this costs anything and it's the difference between a 4 and a 5 for a lot of small operators. A 5 is worth real money if you do events, because organisers increasingly check.
>
> (Disclosure since it's relevant: I build software in this space. Not linking it — the advice above works fine with a notebook.)

_That disclosure line is what keeps you on the right side of the mods and, counterintuitively, is what makes people go look at your profile._

---

## 3-week posting schedule

Never more than one promotional post per day. Never the same link twice in a week.

**Week 1 — build standing, no promo**
- Day 1: Fill in Reddit profile. Send the r/foodtrucks modmail (Post 1). Message r/streetfood mods for submitter access.
- Days 1–5: Comment genuinely, 3–5 per day across r/foodtrucks, r/smallbusinessuk, r/restaurantowners, r/KitchenConfidential. Zero links.
- Day 3: Post 4 (the £140 Meta post) to **r/EntrepreneurRideAlong**. No link in body.
- Day 6: Post 5 to **r/SideProject**.

**Week 2**
- Day 8: Post 2 to **r/foodtrucks** — only if mods approved.
- Day 10: Post 3 to **r/catering**.
- Day 12: Post 6 to **r/alphaandbetausers**.
- Daily: run the saved search (`EHO inspection`, `hygiene rating`, `food safety records`) and answer anything real.

**Week 3**
- Day 15: Post 5 (reworded, different angle) to **r/microsaas**.
- Day 17: Post 7 to **r/roastmystartup**.
- Day 19: Post 5 (reworded) to **r/indiehackers**.
- Day 21: Post 8 to **r/smallbusinessuk** — text only, no link.
- Ongoing: r/SaaS weekly promo thread when it appears.

**Review at day 21:** open GA4, filter to `utm_source=reddit`, and look at trials by `utm_content`. Cut any sub that sent traffic and produced no trial. Double down on whichever one did.

---

## What I'd actually do instead, if you only have limited hours

Reddit is worth roughly 2–3 hours a week here, no more. The evidence from your own tracker says the trial-generating channels for this product are:

1. **Instagram DMs to the 8 caterers already shortlisted** in `GROWTH_TRACKER.md` — perfect targeting, £0, warm.
2. **NCASS-adjacent partnerships and trailer builders** — they own the customer relationship on day one.
3. **Facebook groups** — where UK caterers actually congregate, at a scale Reddit doesn't have for this niche.

Reddit's honest role is fourth: a credibility and backlink layer, plus free product feedback from Tier B. Treat it that way and it'll pay for the time. Treat it as a primary acquisition channel and it'll disappoint you the way Meta did.
