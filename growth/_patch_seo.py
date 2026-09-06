#!/usr/bin/env python3
"""Conversion + SEO patch for VanGuard guide pages. Idempotent: safe to re-run."""
import re, sys, pathlib, datetime

ROOT = pathlib.Path(sys.argv[1])
TODAY_ISO = "2026-08-16"
TODAY_HUMAN = "16 August 2026"

GUIDES = [
    "5-star-food-hygiene-rating-mobile-caterers.html",
    "daily-food-safety-diary-mobile-caterers.html",
    "eho-inspection-checklist-mobile-caterers.html",
    "food-safety-app-mobile-caterers.html",
    "food-safety-records-mobile-caterers-uk.html",
    "fridge-temperature-records-food-truck.html",
    "how-to-create-eho-inspection-pack.html",
    "how-to-log-food-temperatures-mobile-catering.html",
    "lpg-gas-equipment-safety-checks-mobile-catering.html",
]

# Page-specific closing CTA: headline + supporting line. Leads with the loss, not the feature.
END_CTA = {
    "5-star-food-hygiene-rating-mobile-caterers.html": (
        "A 5 is worth more than a 4 at every booking",
        "Event organisers check ratings before they confirm pitches. The gap between 4 and 5 is almost always records. VanGuard keeps yours complete without the paperwork."),
    "daily-food-safety-diary-mobile-caterers.html": (
        "The diary is the bit people stop filling in",
        "Not because they're careless — because it's the end of a 12-hour day. VanGuard turns the whole diary into about 40 seconds on your phone."),
    "eho-inspection-checklist-mobile-caterers.html": (
        "Don't lose your rating to missing paperwork",
        "You can be doing everything right and still get marked down for not writing it down. VanGuard logs every check in seconds and hands the officer a full report in one tap."),
    "food-safety-app-mobile-caterers.html": (
        "Try it before your next inspection",
        "14-day free trial, no card required. Set it up in about five minutes and you'll have a complete record trail from day one."),
    "food-safety-records-mobile-caterers-uk.html": (
        "Every record on this page, kept automatically",
        "VanGuard covers temperatures, cleaning, deliveries and van checks — then exports the lot as an inspection-ready report."),
    "fridge-temperature-records-food-truck.html": (
        "Two taps a day beats a lost notebook",
        "Log fridge and hot-hold temps from your phone, get flagged when something's out of range, and keep a dated trail an EHO can't argue with."),
    "how-to-create-eho-inspection-pack.html": (
        "Build the whole pack in one tap",
        "VanGuard keeps every record as you go, then exports the complete inspection pack whenever you need it — no scrambling the night before."),
    "how-to-log-food-temperatures-mobile-catering.html": (
        "Stop writing temperatures on scraps of paper",
        "Log them on your phone in seconds, with the time and date stamped automatically. That timestamp is what makes a record credible."),
    "lpg-gas-equipment-safety-checks-mobile-catering.html": (
        "Gas checks logged and dated, not remembered",
        "VanGuard keeps your equipment and gas safety checks alongside your food records, so the whole compliance trail lives in one place."),
}

EXTRA_CSS = """
.leadmag{border:1px solid #d6e6e6;background:var(--teal-lt);border-radius:14px;padding:16px 18px;margin:22px 0;font-size:15px}
.leadmag strong{color:var(--navy);display:block;margin-bottom:4px}
.leadmag a{font-weight:700}
.cta-end{background:var(--navy);color:#fff;border-radius:18px;padding:30px 26px;margin:40px 0 10px;text-align:center}
.cta-end h2{color:#fff;font-size:22px;margin:0 0 8px}
.cta-end p{color:rgba(255,255,255,.72);font-size:15px;margin:0 auto 18px;max-width:460px}
.cta-end a.btn{display:inline-block;background:var(--teal);color:#fff;font-weight:800;padding:14px 30px;border-radius:12px;text-decoration:none;font-size:16px}
.cta-end small{display:block;margin-top:12px;color:rgba(255,255,255,.5);font-size:13px}
.stickybar{display:none}
@media(max-width:720px){
 body{padding-bottom:66px}
 .stickybar{display:flex;position:fixed;left:0;right:0;bottom:0;z-index:40;background:var(--navy);
  align-items:center;justify-content:space-between;gap:12px;padding:10px 14px;
  box-shadow:0 -4px 16px rgba(0,0,0,.18)}
 .stickybar span{color:#fff;font-size:13px;font-weight:600;line-height:1.3}
 .stickybar a{background:var(--teal);color:#fff;font-weight:800;font-size:14px;padding:11px 18px;
  border-radius:10px;text-decoration:none;white-space:nowrap}
}
"""

TRACKER = """
<script>
(function(){
  function send(loc){
    try{ if(typeof gtag==='function'){
      gtag('event','cta_click',{cta_location:loc,page_path:location.pathname});
    }}catch(e){}
  }
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('a[href*="mode=register"]');
    if(!a)return;
    send(a.getAttribute('data-cta')||'unknown');
  },true);
})();
</script>
"""

LEADMAG = ('<div class="leadmag"><strong>Free: the one-page inspection checklist (PDF)</strong>'
           'Print it, stick it in the van. No sign-up, no email needed — '
           '<a href="/checklist.pdf" download>download the checklist</a>.</div>')

STICKY = ('<div class="stickybar"><span>14-day free trial<br>No card required</span>'
          '<a href="/app?mode=register" data-cta="sticky">Start free trial</a></div>')


def patch(path: pathlib.Path) -> list:
    html = path.read_text(encoding="utf-8")
    orig = html
    notes = []

    # --- 1. Pillar page CTA pointed at the homepage instead of registration ---
    if '<a href="/">Start free trial →</a>' in html:
        html = html.replace('<a href="/">Start free trial →</a>',
                            '<a href="/app?mode=register" data-cta="mid">Start free trial →</a>')
        notes.append("fixed CTA that linked to homepage instead of signup")

    # --- 2. Tag existing CTAs so clicks are attributable ---
    def tag(m):
        return m.group(0) if 'data-cta' in m.group(0) else m.group(0)[:-1] + ' data-cta="%s">' % m.group(1)
    html = re.sub(r'<a class="cta" href="/app\?mode=register">',
                  '<a class="cta" href="/app?mode=register" data-cta="nav">', html)
    html = re.sub(r'<a href="/app\?mode=register">(Start your free trial)',
                  r'<a href="/app?mode=register" data-cta="mid">\1', html)

    # --- 3. Extra CSS ---
    if '.cta-end{' not in html:
        html = html.replace('</style>', EXTRA_CSS + '</style>', 1)
        notes.append("added CSS for end CTA, lead magnet, sticky mobile bar")

    # --- 4. Lead magnet box after the intro paragraph ---
    if 'class="leadmag"' not in html:
        m = re.search(r'(<p class="intro">.*?</p>)', html, re.S)
        if m:
            html = html.replace(m.group(1), m.group(1) + "\n" + LEADMAG, 1)
            notes.append("linked the free PDF checklist (was unused)")

    # --- 5. Closing CTA immediately before the related-guides block ---
    if 'class="cta-end"' not in html:
        head, sub = END_CTA.get(path.name, (None, None))
        if head:
            block = ('<div class="cta-end">\n  <h2>%s</h2>\n  <p>%s</p>\n'
                     '  <a class="btn" href="/app?mode=register" data-cta="end">Start your free trial</a>\n'
                     '  <small>14 days free · no card required · £7.99/month after</small>\n</div>\n'
                     % (head, sub))
            m = re.search(r'\s*<div class="related">', html)
            if m:
                html = html[:m.start()] + "\n" + block + html[m.start():]
                notes.append("added closing CTA")

    # --- 6. Sticky mobile bar + click tracking ---
    if 'stickybar">' not in html:
        html = html.replace('</body>', STICKY + '\n</body>', 1)
        notes.append("added sticky mobile CTA bar")
    if "cta_click" not in html:
        html = html.replace('</body>', TRACKER + '</body>', 1)
        notes.append("added CTA click tracking")

    # --- 7. Freshness signals ---
    n_mod = len(re.findall(r'"dateModified": "[^"]*"', html))
    html = re.sub(r'"dateModified": "[^"]*"', '"dateModified": "%s"' % TODAY_ISO, html)
    if n_mod:
        notes.append("dateModified -> %s" % TODAY_ISO)
    if re.search(r'Last updated \d+ \w+ 2026', html):
        html = re.sub(r'Last updated \d+ \w+ 2026', 'Last updated ' + TODAY_HUMAN, html)

    # --- 8. Article headline should not carry the brand suffix ---
    html = re.sub(r'("headline": ")([^"]*?) \| VanGuard(")', r'\1\2\3', html)

    if html != orig:
        path.write_text(html, encoding="utf-8")
    return notes


for name in GUIDES:
    p = ROOT / name
    if not p.exists():
        print("MISSING %s" % name); continue
    n = patch(p)
    print("%-52s %s" % (name, "; ".join(n) if n else "no change"))
