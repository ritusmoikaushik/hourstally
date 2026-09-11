# Google rules for hourstally

**Why this file exists.** Two of the founder's four sites were removed from Google search in the
space of three weeks — gradekar on 2026-07-25 and gstextract on 2026-08-15. Neither has recovered.
Both were built by the same person and the same assistant, with the same habits. This file exists so
that hourstally is not built with those habits.

Every rule below is written as a rule, not a suggestion. If a rule blocks something that seems like
a good idea, the rule wins. A page that is never published costs nothing. A domain that Google
stops trusting is dead, and the record shows it does not come back.

---

## 1. What actually happened, so the rules make sense

### gradekar — 2026-07-25

A four-month-old domain. It had:

- 15 "CGPA to percentage" converter pages, one per university — the same page with the university
  name and formula swapped
- 15 reverse converter pages, twins of the first 15
- 3 per-university calculator pages, pure template, 1 click in 85 days between them
- 6 blog posts published in 10 days in mid-July, AI-assisted, one per university

Overnight, organic traffic fell 74–96% on every page at once. Google refused to index the new blog
posts. The site stopped appearing for its own brand name. Manual actions: none. Security issues:
none. Crawling: normal. **This was an algorithmic reclassification of the whole domain as scaled,
low-value content.** 44 days later it had not recovered.

The pages that had genuinely different content — a real intro naming real colleges, a distinct
distinction rule, a source note — were the ones with traffic. They went down with the rest, because
the judgement was on the domain, not the page.

### gstextract — 2026-08-15

An older domain, ranking on commercial GST terms. On 2026-07-29 it published **38 per-state-code
pages in a single day** (`/gst-state-code/01` through `/38`). A risk audit the next day put 25 of
them on `noindex` and later all 38. Sixteen days after that, with the mitigation in place and
traffic rising, the whole site was demoted anyway — impressions from ~5,000 a day to ~70, position
from 8–9 to 40–60.

The incident report's own conclusion: the mitigation was *necessary but not sufficient*. The domain
still read as programmatic — 55 sitemap URLs, heavily templated format, calculator and reference
pages — and a later pass reclassified it. Two pages survived intact, and they were the two with the
most genuine unique utility: the state-codes hub and the interest calculator. Together they now carry
97 of the site's 111 Google clicks.

### The shared pattern

| | gradekar | gstextract |
|---|---|---|
| Pages made by swapping a name into a template | 33 | 38 |
| Published in a burst | 6 posts / 10 days | 38 pages / 1 day |
| Domain age at the time | 4 months | older, but the burst was recent |
| What survived | nothing | the two pages with real depth |
| Recovery | none after 44 days | none after 23 days; Bing carried it |

**One pattern, two sites, both gone. That pattern is banned here.**

### The 2026 policy that names it

Google's *scaled content abuse* policy is its top enforcement priority in 2026. Its own description
of the violation is "data-template pages that swap location names, product names, or keyword
variants into identical page structures, generating many pages with minimal unique value." Sites
caught by it in the March 2026 pass lost 50–80% of traffic. It does not matter whether the pages
were written by a person or a machine. It matters whether they exist to rank or to help.

---

## 2. The rules

### Rule 1 — The swap test. Every page must fail it.

> Could this page be produced from any other page on the site by find-and-replace?

If yes, it does not ship. Not with a different heading, not with a different intro paragraph, not
with a different FAQ. A biweekly time card page is not the weekly page with "biweekly" swapped in.
It has a two-week grid, week subtotals, a pay-period calendar and content about 26-versus-27 pay
period years. If it does not have its own tool behaviour and its own subject matter, it is the same
page, and the same page twice is the pattern that killed two sites.

### Rule 2 — No permutation pages. Ever.

No "time card calculator for **[state]**". No "timesheet calculator for **[job title]**". No
"hours calculator for **[city]**". No "**[tool]** for **[industry]**". These are the doorway pages of
2026. gradekar's per-university pages and gstextract's per-code pages were exactly this shape, and
both were argued for at the time with real search demand behind them. Demand does not make a
doorway page safe. There is no version of this that is allowed.

### Rule 3 — No bursts. Cadence is capped.

- **Never more than two new indexable pages in any seven-day window.**
- **Never more than eight indexable pages in the first ninety days of the domain.**
- The site launches with **three pages**, not thirteen.

A young domain that publishes fast in a templated pattern is the exact profile gradekar had. Speed
is not a virtue here. gstextract's 38-in-a-day is the single most damaging thing either site did.

### Rule 4 — Every page carries real written explanation.

Minimum 600 words of genuine explanation on every calculator page, written for the person using it,
answering what they would actually ask. Not filler. Not a rewrite of another page's text. Both
AdSense and Mediavine reject tool-only pages as "low value content", and Google's classifier reads
a site of bare forms the same way.

The test for filler: would a payroll clerk who already knows how to do this learn one thing from
the page? If not, the text is padding and padding is noise the classifier counts against us.

### Rule 5 — One subject. Hours and pay.

Every page is about counting hours for pay or turning hours into pay. Nothing else. No mortgage
calculator, no BMI, no concrete, no "while we're at it". A site about one thing is a site; a site
about everything is a farm, and the classifier can tell the difference by the sitemap alone.

### Rule 6 — The sitemap lists only pages that pass every rule above.

Anything that is a draft, thin, experimental or a helper page (privacy, terms) is either `noindex`
or absent from the sitemap. gstextract's 55 sitemap URLs were themselves part of the problem. The
sitemap is what Google reads first about the site's shape. Keep it short and every entry earned.

### Rule 7 — A real person is behind the site.

- An `/about` page naming the founder, what he does, and why this site exists.
- A named author on every page, linked to `/about`.
- A real contact method.
- A `/how-it-counts` page showing the arithmetic — how overtime is split, how decimal is derived,
  what the rounding is — so anyone can check the tool's answers.

gradekar had these and still fell, so they are not a shield on their own. But a site without them
has nothing to argue with when the classifier looks. Google calls this E-E-A-T. In plain words: is
there someone accountable here.

### Rule 8 — No AI-written filler, and no content the tool does not back.

The assistant writes the code and drafts the words. Every paragraph is read by the founder before
it ships, and any paragraph he would not say out loud is cut. No paragraph makes a claim the tool
does not actually do. No "comprehensive guide". No "in today's fast-paced world". No word that is
there to reach a word count.

### Rule 9 — Ads follow the rules that exist for ads.

- No ads until the site is accepted by a network. No self-placed affiliate junk in the meantime.
- Never more ad than content above the fold. Google's page-layout signal demotes pages where the
  tool is pushed below a wall of ads. The calculator is the first thing on the screen, always.
- No pop-ups, no interstitials, no "click to reveal result", no forced scroll. The Better Ads
  Standards are a Chrome filter as well as a Google ranking signal; breaking them costs both.
- Nothing that fakes urgency, fakes reviews, or fakes a download button.

### Rule 10 — Measure every 28 days, in a tracked file.

Search Console and GA4 pulled every 28 days and written into `docs/MEASUREMENTS.md` in this repo.
Clicks, impressions, average position, Tier-1 sessions, and any Google update in the window. gstextract
had a watchdog and still lost three days to Search Console lag. Anything not written down does not
exist; both incident reports were only possible because the numbers had been kept.

---

## 3. Pre-publish checklist

A page ships only when every line is true. Copy this into the commit message that publishes it.

```
[ ] Fails the swap test — cannot be produced from another page by find-and-replace
[ ] Has its own tool behaviour, not just its own heading
[ ] Not a state / city / job / industry permutation of an existing page
[ ] Fewer than two other indexable pages published in the last seven days
[ ] Fewer than eight indexable pages total if the domain is under ninety days old
[ ] At least 600 words of explanation a payroll clerk would learn something from
[ ] Every claim in the text is something the tool actually does
[ ] Named author, linked to /about
[ ] Unique title and meta description, written for a person not a keyword
[ ] Calculator is the first thing on screen on a phone
[ ] Tested on a phone
[ ] Founder has read every paragraph
[ ] Added to sitemap only after all of the above
```

---

## 4. What to do if it happens anyway

If impressions fall more than 50% in 48 hours on every page at once:

1. **Stop publishing.** Immediately. More pages feed the classifier.
2. Check Search Console → Security & Manual Actions. If clean, it is algorithmic.
3. Check crawl stats and URL Inspection. If Google is still crawling, it is not a block.
4. Do **not** rewrite pages that were ranking. gradekar's report is explicit: rewriting good pages
   during a fragile window is risk with no upside.
5. `noindex` anything thin. Trim the sitemap to the pages with real utility.
6. Write the incident up in `docs/` the same day, with the numbers.
7. Wait. Recovery, if it comes, comes at a later Google update, weeks to months out.

And accept that it may not come. gradekar has not. gstextract has not. That is why sections 2 and 3
exist — prevention is the only strategy that has worked in this estate.
