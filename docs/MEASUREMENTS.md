# Measurements

Search Console and GA4, pulled every 28 days, written here the same day. Anything not written here
does not exist. Rule 10 in `GOOGLE-RULES.md`.

**Visits:** `python scripts/cf_export.py` — Cloudflare Web Analytics, token in `.cf-token` (gitignored, Account Analytics: Read only). The data is sampled; read small counts as rough.

**The pull is one command:** `python scripts/gsc_export.py` — prints the 28-day totals, every page
and the top queries, and writes the rows to `docs/gsc/` so each pull is on the record. It reads
Search Console through the service account gstextract already uses, added as a Restricted user on
this property on 2026-09-21; the key stays in the gstextract repo and is never copied here.

## Publish log

| Date | Page | Indexable pages after this | Notes |
|---|---|---|---|
| 2026-09-11 | `/` time card calculator | 1 | site went live on hourstally.com via Cloudflare Pages, repo `main` |
| 2026-09-11 | `/time-to-decimal` | 2 | launched together with the time card |
| 2026-09-11 | `/about` | 3 | launch page three; `/how-it-counts` published noindex the same day, joins the index 2026-09-25 |
| 2026-09-28 | `/how-it-counts` | 4 | out of noindex, into the sitemap, three days after its slot. IndexNow pinged; indexing requested in Search Console by the founder the same day; crawled and "Submitted and indexed" by 30 Sep. Nothing else indexable within seven days either side until `/with-lunch` on 2026-10-02 |
| 2026-09-30 | `/with-lunch` | 5 | into the sitemap two days before its 2 Oct slot, on the founder's instruction; linked from every footer for the first time. IndexNow pinged |
| 2026-10-12 | `/biweekly` | 6 | out of noindex and into the sitemap the day it was built, after the founder's test pass; linked from every header, rail and footer. Twelve days after `/with-lunch`, so the only indexable page in seven days. IndexNow pinged |
| 2026-10-15 | `/with-overtime-and-pay` | 7 | out of noindex and into the sitemap the day it was built, after the founder's six-test pass; linked from every header, rail and footer, and from `/how-it-counts`. Three days after `/biweekly`, so two indexable pages in seven days — the cap. One page left in the first ninety days (`/military-time`, 23 Oct). IndexNow pinged; URL Inspection already showed it "Submitted and indexed" (crawled 15 Oct 10:53 UTC), and the founder requested indexing the same day |
| 2026-10-29 | `/blog/how-to-calculate-overtime-pay` | 9 | the ninth indexable page, a deliberate exception to the ninety-day cap (founder's decision; `SCHEDULE.md`). First article in the new `/blog/` section, whose list page is noindex and out of the sitemap. IndexNow and Bing pinged on the push (200); the founder requested indexing in Search Console the same day |
| 2026-10-23 | `/military-time` | 8 | out of noindex and into the sitemap on its date, the day it was built, after the founder's test pass (phone, real Excel, print preview) and a paragraph-by-paragraph read that he delegated to the assistant; linked from every header, rail and footer, and from `/how-it-counts`. Eight days after `/with-overtime-and-pay`, so the only indexable page in seven days. **The eighth page: the ninety-day cap is reached. No new indexable page until the review on 2026-12-10.** Live within a minute of the push; IndexNow and Bing both answered 200; the founder requested indexing in Search Console the same day |

## Early signal — not a pull

Written down because it exists, not because it decides anything. The first real pull is 2026-10-09.

| Seen | Window | Clicks | Impressions | Queries | Notes |
|---|---|---|---|---|---|
| 2026-09-28 | Cloudflare Web Analytics, 29 Aug–28 Sep | — | — | — | **About 260 page views and 140 visits, and Cloudflare samples at 1 in 10, so that is roughly 26 recorded page loads.** Launch day, 11 Sep, is 140 of the 260 views, nearly all from India on the `www` host: the founder's phone test. After that, about one recorded load a day to 16 Sep, then two in the week to 25 Sep, and none since. Every load after launch day is the home page, from the US, on desktop, with **no referrer**. Several are Chrome on Linux, which is what crawlers and SEO tools run. `/time-to-decimal` shows 20 views and 0 visits. **Reading: no person has yet arrived from a search engine.** That matches Search Console's 0 clicks. Pull with `python scripts/cf_export.py` (token in `.cf-token`, gitignored) |
| 2026-09-28 | 30 Aug–26 Sep, by API | 0 | 33 | 17 | Average position **51**. Seven impressions more than a week ago: one or two a day since 17 Sep, none at all on four days. By page: `/time-to-decimal` 13 at position 41, `/` 11 at 49, plus 9 on the `http` and `www` copies from before the 21 Sep redirects. Four days show position 5–7 from queries Google keeps anonymous, so they cannot be named. **Index:** URL Inspection says `/`, `/time-to-decimal` and `/about` are "Submitted and indexed". `/how-it-counts` was still "Excluded by noindex" at its last crawl on 12 Sep; it came off noindex today. `/with-lunch` is unknown to Google, as intended. The sitemap was last read 27 Sep with 0 errors. Two queries name pages already on the calendar: "time card calculator with breaks" (`/with-lunch`, 2 Oct) and "time card calculator military time" (`/military-time`, 23 Oct). **Visits:** the Cloudflare Web Analytics beacon is live on every page. There is no GA4. Visits are in the row above |
| 2026-09-21 | 23 Aug–19 Sep, by API | 0 | 26 | 14 | First API pull. Average position **57** — page five and beyond, which is why 26 impressions gave no click. Six of the impressions were on the `http://` and `www` copies, before the redirects of 21 Sep |
| 2026-09-19 | 10–16 Sep | 0 | 17 | 13 | Site six days old in the window. Every query is the target phrase or its neighbour: "time card calculator with multiple in and out" (3), "time punches" (3), "time punch calculator", "punch in punch out calculator", "payroll decimal", "20 mins in decimal". The page is being served for the words on it. Zero clicks on seventeen impressions means it sits deep; no title change on a sample this small |

## 28-day pulls

| Pulled | Window | Clicks | Impressions | Avg position | Tier-1 sessions | Google updates in window | Notes |
|---|---|---|---|---|---|---|---|
| 2026-10-15 (interim, founder asked) | 16 Sep–13 Oct | 0 | 97 | 31.3 | not pulled | none new | Founder: "impressions not increasing". By week, Sun–Sat: 13, 8, 24, 34, then 15 in the two days to 13 Oct (10 on 13 Oct, the best day yet). Rising, from a tiny base. **Not an indexing fault:** URL Inspection shows all seven pages "Submitted and indexed", `/with-overtime-and-pay` crawled the day it was published; sitemap last read 5 Oct, 0 errors (fileoholic's had gone unread since May, so this is now checked). **It is ranking:** the head phrases sit at 60–92 ("punch in and out calculator" 83, "time card calculator with lunch break" 84), where nobody scrolls; impressions come only from long-tail phrases at 1–21. Five-week-old domain, one dofollow link (dev.to, 13 Oct). By page: `/` 33 at 40, `/with-lunch` 24 at 30, `/time-to-decimal` 22 at 40, `/how-it-counts` 11 at 7, `/biweekly` 4 at 10, `/about` 3. Rows in `docs/gsc/2026-10-13_*.csv` |
| 2026-10-29 (interim, founder asked "are we missing something?") | 30 Sep–27 Oct | 0 | 397 | 46.6 | not pulled | none new; no October core update found | 93 queries. By week since launch: 25, 7, 11, 40, 63, 141, 110 (week 7 partial). Only 12 impressions on page one, 21 in the top 20. At these positions a standard click-through curve predicts **under one click** for the month, so zero is expected, not a fault. **Nothing technical wrong:** all pages 200 to a Googlebot user agent, robots allows all, canonicals self, no X-Robots-Tag. **fileoholic at the same age** (domain also registered on launch day, 2026-05-08): 6 clicks and ~790 impressions in weeks 1–7 at positions 50–70, then impressions x10 and clicks from weeks 10–13. hourstally is on that path at about half the impressions; weeks 10–13 here are 13 Nov–10 Dec. Since Google dropped `&num=100` (Sep 2025), impressions at position 50+ are mostly rank trackers, not people. The lever beside time is links: only the two dev.to links count so far. Title of `/with-overtime-and-pay` changed to lead with double time (16 of its 17 queries), committed, not pushed |
| 2026-10-12 | 13 Sep–10 Oct | 0 | 92 | 34.6 | ~0 (Cloudflare: every visit has no referrer; none from a search engine) | **Google September 2026 spam update**, 24 Sep, about two weeks to roll out. No core update since 21 May | Three days late; due 9 Oct. 32 queries. Impressions 33 → 92 and position 51 → 35 since the 28 Sep early read. By page: `/` 32 at 37, `/time-to-decimal` 24 at 42, `/with-lunch` 19 at 28 (twelve days in the index), `/how-it-counts` 9 at 7, `/about` 3, plus 5 on the old `http` copy. Best single positions: "time clock calculator with multiple punches" **1**, "copley time card calculator" 3, "calculator soup time card" 7, "clock in clock-out calculator" 12, "my time card calculator" 13. The wedge phrases are the ones finding us. Cloudflare (sampled 1 in 10): about 25 recorded visits in the window, US desktop, no referrer — crawlers and tools, not searchers. No drop on any page, so nothing from the spam update. AI Overview read 8 Oct, see below. Rows in `docs/gsc/2026-10-10_*.csv` |

## Bing

Bing Webmaster Tools has had the site since 2026-09-21; there is no API key here, so the founder
exports Search Performance → Keywords at each measurement (`docs/gsc/bing-keywords-<date>.csv`).

**First read, 2026-10-29** (`docs/gsc/bing-keywords-2026-10-29.csv`): 74 keywords, 134 impressions,
**8 clicks** — while Google sent 0 in 28 days. Bing already ranks the wedge on page one:
`time card calculator with multiple in and out` position 4.5, `time clock calculator multiple in out
per day` 3.8 (1 click), `2 week time clock calculator multiple in out per day` 2.0 (1 click),
`multiple punch time card calculator` 5.9, `hours tally` 1.0 (2 clicks). Bing ranks new small sites
far sooner than Google (gstextract has run on it since August). Some queries are people pasting
their own time-clock exports ("clocked in 0h : 28m", "total punches reviewed") into the search box.
The same day every meta description was cut to 148-159 characters (seven were 185-240 and lost
their point past the cut-off; `/about` was 84), leading with what each page does; Bing's own
phrasing, "multiple in and out", leads the home page's.

## AI Overview watch

Added 2026-10-08, after Google's AI Overview was seen *building* a working calculator on
`gpa calculator` and `final grade calculator` (see `NICHE-LOG.md`). Read in the founder's browser
(Guwahati) at every 28-day pull. What to look for: no Overview · text Overview · **a tool inside the
Overview**, which is the one that changes the plan.

| Seen | Query | Overview? | Where on the page | What it says | Notes |
|---|---|---|---|---|---|
| 2026-10-08 | `time card calculator` | Text, no tool | Below four organic results (Redcort, calculator.net, timecardcalculator.net, Time Clock Wizard) | Steps for entering punches, breaks, overtime; names Redcort and Calculator Soup; offers to work out pay if told the hours | **New since September**, when there was none on `timesheet calculator`. hourstally not on page one |
| 2026-10-08 | `time card calculator with lunch` | Text, no tool | Below one organic result (calculatehours.com) | Formula (out − in − lunch), decimals; recommends Calculator Soup, Redcort, Time Clock Wizard; offers to calculate a schedule | In September it sat below three organic results; now below one |

Google's "People also search for" strip on the same two pages, for the page plan:
`time card calculator with multiple in and out` (the home page's own title and wedge), `time card
calculator 2 weeks` and `2 weeks with lunch` (use "2 weeks" in `/biweekly`'s title and heading),
`hours and minutes`, `with pay`, `with breaks`, `30-minute lunch break calculator`.

## Competitor watch

Checked at every 28-day pull, same day as the numbers. Position is for `time card calculator`
and `biweekly time card calculator`, US, incognito.

| Pulled | countworkhours.com position | Ads showing? | Multiple in/out yet? | Excel yet? | Notes |
|---|---|---|---|---|---|
| 2026-09-14 | not checked — found today via a trucking query | no | no | no (PDF only) | © 2026, stamp-out site: time card tools next to IRS penalty and "Iran war cost" pages. Missed in the 2026-09-10 screen |

### clocktally.com — found 2026-10-03, the closest rival yet

Registered **2026-06-10**, three months before us, with about nineteen pages already: time card
with lunch, overtime pay, blended overtime, shift differential, rounding, pay period, decimal
converter, hours calculator, shift schedules (six pattern pages), timesheet templates, guides,
glossary, an embed page and a "best free time card calculators" list. Much of our page list is
already there. Found by the shift-pattern screen, not by a time card search — so check its
position for `time card calculator` and `time card calculator with lunch` at every pull, and
whether it has multiple in/out pairs and a real `.xlsx`. Its pace is the one our rules forbid;
watch whether Google rewards or drops it.

Compared tool by tool on 2026-10-03, running its own `time.js`. **Where we are ahead:** it has no
am/pm switch and reads a bare time as 24-hour, so `8:00` to `5:00` is 21 hours and `8:30` to
`4:30` is 20, with no warning; `8` to `5` cannot be read; phone boxes open the letter keyboard. No
Excel (print and blank PDFs only), no clock-change handling, no California seventh day, no state
meal-break table, anonymous About page. Analytics only, no ads yet (Astro build, GA4). **Where it
was ahead, and what we took:** signature lines on the printout and a fast way to repeat a week —
both shipped the same day as "Copy to rest of week" and the sign-off row. Still theirs: named
templates, configurable OT thresholds and punch rounding on the main card (ours is `/rounding`),
an iframe embed code that earns links from HR blogs — revisit after the first measurement.

### hourtally.app — name one letter from ours

Android shift and overtime tracker from Kumpir Software (Turkey), Turkish and English,
closed beta on 2026-10-03, free with ads plus a Pro tier. Its only web tool is
`/en/overtime-calculator/`: hours in, overtime pay out, no clock in/out times, no download,
but plenty of written explanation and an FAQ. Not a rival today; it targets
`overtime calculator`, which we do not. hourtally.com is a GoDaddy parked page (registered
2026-04-15), not theirs as far as we can tell.

Watch for two things: a web page that takes clock in/out times, and the brand name showing
up in our Search Console queries (confusion runs both ways).

| Pulled | Web time card tool yet? | Ranks for `time card calculator`? | "hourtally" in our GSC queries? | Notes |
|---|---|---|---|---|
| 2026-10-03 | no (overtime pay only) | not checked | no data yet | found when the founder asked about the name |
