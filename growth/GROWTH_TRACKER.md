# VanGuard Growth — Command Centre

Rook runs this file. Single source of truth for who we're contacting, what's live, and what's working. Update after every action.

## North-star + current numbers
| Metric | Now | Target (30d) |
|---|---|---|
| Real caterers reached (DM/post/partner) | 0 | 300+ |
| Trials started | 0 (paid Meta wasted 100 visits) | 20 |
| Activated (logged ≥1 record) | 0 | 12 |
| Paying | 0 | first 1–3 |
| Spend | Meta (paused) | £0 unless approved |

## Strategic guardrails (learned the hard way)
- **No cold paid ads.** Meta = 0/100. Funnel works (verified); the problem was audience. Trust/intent channels only.
- **Target NON-NCASS caterers** — NCASS members already get a bundled compliance system.
- **Measure by source.** Every link tagged (below). Never spend blind again.
- **Spend stays approval-gated** (£182 runway). Creator fees need a yes before paying.

## UTM / tracking scheme
Base: `https://vanguardapp.co.uk/?utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=launch2026`
- FB groups → `utm_source=fbgroup&utm_medium=community`
- IG DMs → `utm_source=ig&utm_medium=dm`
- Creator → `utm_source=creator&utm_medium=influencer&utm_content=<creatorhandle>`
- Partner → `utm_source=partner&utm_medium=referral&utm_content=<partnername>`
- NCASS newsletter → `utm_source=ncass&utm_medium=article`
Rook generates the exact link per target and pastes it in the CRM row.

## Outreach CRM
Status: `todo → contacted → replied → trialing → paid / dead`

### A. Adjacent partners (highest trust — they already sell to new caterers)
| Target | Type | Handle/contact | Status | Next action |
|---|---|---|---|---|
| Tudor Catering Trailers | Trailer builder (active TikTok, audience = new caterers) | @tudorcateringtrailers | todo | Send partner msg (Kit §1) |
| _find 5 more trailer builders / van converters_ | Builder/converter | — | todo | Daniel/Rook shortlist |
| Local commissary / ghost kitchens | Shared kitchens | — | todo | Partner msg |
| Level 2/3 food-hygiene course providers | Training | — | todo | Partner/affiliate |
| Mobile-catering insurers / NCASS-alternative bodies | Adjacent | — | todo | Partner msg |

### B. Niche creators (audience = caterers)
| Creator | Platform | Followers | Status | Next action |
|---|---|---|---|---|
| _shortlist via method in Kit §2_ | TikTok/IG/YT | 5k–50k | todo | Rook drafts, Daniel sends |

### C. Communities
| Group | Platform | Status | Next action |
|---|---|---|---|
| UK street food / mobile catering groups (3–4) | Facebook | todo | Daniel joins + POST A |

### D. Instagram DM targets — warm-up queue (sourced live, 13 Aug 2026)
Found via the hashtags in `INSTAGRAM_OUTREACH.md` (`#streetfooduk #coffeevanuk #burgervanuk`). All UK, all small/solo operators actively posting — the right ICP, not big brands. Follower counts drift; re-check before messaging. Follow the warm-up sequence (follow → like 2–3 posts → 1 genuine comment → DM a day later) — do NOT DM cold on day one.
| Handle | Business | What to reference (personalise the opener) | Status | Next action |
|---|---|---|---|---|
| @street_bites_uk | Street Bites — Airstream food truck | Recent evening pop-up, good-vibes tone | todo | Follow + like + comment today |
| @ohlala_fries | OhLaLa Fries — loaded fries truck, "loading fries since '21" | Festival season posts (Neighbourhood Weekender etc.) | todo | Follow + like + comment today |
| @rolypolyeats | Roly Poly Eats — pulled meats & Greek, Pershore, Worcestershire | Posts full festival schedule weekly — solo trader, very warm/personal tone | todo | Follow + like + comment today |
| @prawnhubandburger | Prawnhub & Burger — grill van, regularly at The Red Lion | "Street food hits different" post, grilled chops/loaded fries | todo | Follow + like + comment today |
| @antojitostruck | Antojitos — plant-based/gluten-free Mexican street food truck | Slam Dunk Festival collab, birria tacos | todo | Follow + like + comment today |
| @dj.mobilecatering | DJ Mobile Catering — event/festival catering | Same Slam Dunk Festival post as Antojitos | todo | Follow + like + comment today |
| @woldandco.coffee | Wold & Co Coffee — run by Alice, horsebox coffee trailer | Trailer was written off in an accident; she's converting a VW van into a new setup — genuinely warm, human opener ("sorry to hear about the trailer — hope the VW build's going well!") | todo | Follow + like + comment today |
| @blinding_burgers | Blinding Burgers — smash burgers & loaded fries, Nantgarw, Wales | Just passed 6-month mark, upgrading to a new van — brand-new business, exactly the "needs compliance from day one" ICP | todo | Follow + like + comment today |

**Suggested pace:** warm up (follow/like/comment) on all 8 today; DM 3–4/day starting tomorrow so it's spread out, not a same-day blast (IG safety limit is 10–20/day max — this list alone is well under that). Log each DM sent + reply in `FEEDBACK_LOG.md`. Once these 8 are worked through, repeat the hashtag search (`#mobilecatering #cateringtrailer #streetfoodtrader #horseboxbar #pizzavanuk` still untapped) for the next batch.

## Weekly rhythm
- **Rook (me):** maintain this file, draft every message/link, shortlist targets, ship UI fixes from feedback, weekly summary of what converted.
- **Daniel:** send the messages / make the calls from your accounts, ~20–30 min/day; forward replies to me; approve any spend.
- Cadence: Rook reviews + reprioritises weekly (tied to the existing daily check).

---

## Activity log

### 20 Aug 2026 — Facebook session (agent-run)

**Blocker found and worked around: the checklist PDF is not reachable on the web.**
`vanguardapp.co.uk/checklist.pdf` returns the marketing homepage. The local `netlify.toml`
already removed the old `/* -> /index.html 200` catch-all, but **that fix has never been
deployed** — the live site still has it. Until someone runs `netlify deploy --prod`, every
`/checklist.pdf` link anyone saved is dead.
Second blocker: **Facebook will not let a Page DM a person who has not messaged the Page
first.** That is why a batch of "Sent you a DM" replies on the group posts were never
followed by an actual DM.

**Working link now in use everywhere** (verified live):
`https://vanguardapp.co.uk/eho-inspection-checklist-mobile-caterers`
Note this is the *guide page*, not the one-page PDF — it has the 10-point pre-inspection
list and "what an EHO checks", but **no temperature figures**. Do not describe it as
"temps, hot-holding, cooling" in copy; that describes the PDF.

**Done today**
| Action | Where | Detail |
|---|---|---|
| Top-level link comment (apology + straight link) | SSFC group post | Covers everyone who was promised a DM that never arrived |
| Top-level link comment (same) | Uk catering and street food group post | Same |
| 6 individual comment replies | both posts | Pamela Foster, Lcm Paintworks (SSFC); Sasi Saripalli, Jana Roberts, Kerry Fisher, Coffee & donuts hut (Uk catering) |
| New Page post | VanGuard Page | 63°C hot-holding + corrective-action value post, no ask |
| New group post | Street food / Food Trucks / Traders / Venders / Equipment U.K (57.8k) | "11pm paperwork" hook + link + explicit commercial disclosure |

**Checklist requesters seen so far (~26 named UK caterers):** all now have either a direct
reply or the link comment on their thread.

**Risk flagged:** the 57.8k group has **2 previous VanGuard posts removed by admins** —
both were overt product pitches ("check us out at vanguardapp.co.uk", free-months-for-
feedback). Today's post is value-first with disclosure, but watch whether it survives.
Group's only stated rule is price+location on for-sale ads, so links themselves are fine.

**Inconsistency to resolve:** live site and the DM script both say **14-day** free trial
(£7.99/mo). All the marketing docs in this repo say **30-day**. Pick one and make the docs
match the product — do not quote a trial length in posts until it is settled.

**Also fixed today:** `LEAD_MAGNET_food-safety-checklist.md` stated the 8°C chill figure and
the 2-hour hot-holding tolerance as UK-wide. Both are England/Wales/NI only — Food Standards
Scotland sets neither. Corrected inline, which matters because SSFC is a Scottish group.
