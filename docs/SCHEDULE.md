# Schedule

Dated plan from launch. Built from `PLAN.md` (what and in what order) and `GOOGLE-RULES.md`
(how fast is allowed). The rules cap a seven-day window at two new indexable pages and the
first ninety days at eight.

**Pace: one page a week — decided 2026-09-21.** It ran at one every two weeks from launch.
The founder asked whether faster was unsafe. The honest reading of the two incidents is that
neither site died of speed alone: gradekar put up 33 find-and-replace pages, gstextract 38 in a
day. What killed them was templated pages in a burst, and the swap test is the lock on that
door. One a week stays inside the seven-day cap, every page still gets the founder's read, and
the eight pages are indexed four weeks earlier — Google's clock on each starts sooner. The cost
is seven idle weeks between the eighth page and the ninety-day review; those go to distribution,
bugs and reading what people typed. The eight-in-ninety cap stays. Bursts stay banned.

Launch day: **2026-09-11**. Ninety-day cap lifts: **2026-12-10**.

Pages are counted as *indexable* only when they are in the sitemap without `noindex`.

## The calendar

| Date | Who | What | Indexable pages after |
|---|---|---|---|
| 2026-09-11 | done | `/`, `/time-to-decimal`, `/about` live. Search Console verified, sitemap submitted, indexing requested | 3 |
| 2026-09-11 | done | Email routing live · `www` answers · Cloudflare Web Analytics found already on · privacy page updated · phone test done on the founder's handset, both tools, print and CSV included. Every finding fixed the same day: number keypad, am/pm switches, aligned rows, row notes, print as a document, chart layout, logo, favicon | 3 |
| 2026-09-21 | done | www → root 301 as a Cloudflare Redirect Rule; http → https was already on. Search Console had filed the www and http copies as "alternative page with proper canonical tag" — harmless, now gone. `_redirects` cannot do host rules | 3 |
| 2026-09-25 | done 2026-09-28 | `/how-it-counts` moves from noindex into the sitemap. Three days late. Every claim re-checked against the code first; byline, share tags and author schema added. The same day: a bare time now reads forward from the punch before it, and `/with-lunch` stopped writing over the home page's saved card | 4 |
| 2026-10-02 | done 2026-09-30 | `/with-lunch` — time card with lunch break, auto-deduct rule, meal-break table. Indexed two days early on the founder's instruction, after he ran a test week through it and the print was fixed. Second page in seven days, which the cap allows. The state table was checked row by row against each statute or labor department first: North Dakota and West Virginia were wrong, Maine and Nevada lacked a condition, Vermont was missing | 5 |
| 2026-10-09 | done 2026-10-12 | **First 28-day measurement.** `python scripts/gsc_export.py` and analytics into `MEASUREMENTS.md`. Sitemap status, indexed pages, impressions, any Google update in the window. Competitor watch rows for countworkhours.com and hourtally.app | 5 |
| 2026-10-09 | done 2026-10-12 | `/biweekly` — two-week grid, week subtotals, pay-period calendar, plus the hospital 8 and 80 rule. Three days late. Live noindex the same morning; a scripted UI check at four widths and the founder's eight-test pass on his PC found and fixed a two-page printout, `#####` dates in all three Excel sheets, and a tablet-width overlap on the home and lunch cards, both older than today | 6 |
| 2026-10-16 | done 2026-10-15 | `/with-overtime-and-pay` — rate first, two rates in one week, FLSA blended rate. Built and published 2026-10-15, a day early, on the founder's "push all". The founder read every paragraph on 2026-10-17 and changed nothing, which ticks the last line of the publish checklist. His six-test pass (PC and phone) found and fixed: `#####` for the period end date and cut-off bold headers in the Excel file (the date test allowed 11 wide; now 12, plus a label-fit test, which also widened the other three sheets), three dropdowns cut off by Windows' wider arrow, and on paper a cut-off name label and a differential amount printed at zero width. Two rates tagged A or B on every punch pair, overtime on the week's weighted average (29 CFR 778.115), shift differential by time window counted into it (778.207(b)), 1.5x and 2x editable, gross pay per day, the rate-in-effect figure (778.419) shown beside it; each claim checked at the source. Comp time left out: public agencies only (29 U.S.C. 207(o)), 7(k) periods and a balance across years do not fit a week's card; a FAQ says so. Who is there, 15 Oct: Omni, Homebase, Toggl, TimeChamp, Clockify, num8ers on page one, countworkhours.com's overtime page takes one rate and hours typed as totals — none takes two rates in a week, a blended rate or a differential. `/how-it-counts` now links to it where it said the blended rate was "on the list" | 7 |
| 2026-10-23 | done 2026-10-23 | `/military-time` — 24-hour entry, conversion chart, 0000 vs 2400. Built and committed noindex, unlinked, on its date; goes live when the founder says push. No am or pm anywhere (an am/pm typed by habit is refused with the 24-hour time to type); 2400 only as a clock-out, 0000 as midnight at the start of a day, a 2359 clock-out flagged as a minute short; night shifts across midnight by default, with the day each ended on beside it; several pairs a day; the Excel file has real `[hh]:mm` times and an hours formula per line that survives midnight; converter both ways and a printable chart. Claims checked at the source: Pennsylvania HR's chart (0000 starts a shift, 2400 ends one), the Navy correspondence manual of June 2015 (0000 to 2359, no colon), Open RN *Nursing Skills* on medication times, 29 CFR 778.105, California DIR's workday glossary (Labor Code 500), 15 U.S.C. 260a, Microsoft on `#####`. Who is there, 23 Oct (a search tool, not Google; two runs differed): Toggl, TimeCamp, timecardcalculator.net, CalculatorSoup, OnTheClock, calculatehours, LogMyHours, timecardcalculator.app, timecardmaker, Livetecs, Everhour, Harvest. None does all of 24-hour only, 2400 as the end of a day, night shifts by default, more than one pair and Excel. Closest is timecardcalculator.net: 24-hour is a setting, 2400 accepted but 0000 refused, up to three pairs, print only. The page titled "Military Time Card Calculator" (timecardcalculator.app) gives 0 hours for 2200–0600; Everhour turns 2400 into 23:00; clocktally and timecardmaker refuse 2400; countworkhours reads 0600 as 6pm. No time card handles the clock change. The same day, the scripted print check found the clock-change note squeezed into the day-name column on every card's printout (shared CSS, older than today); fixed. Pushed live noindex on the founder's "push". **Founder's test, 23 Oct:** phone night shift with the number keypad; 2400 and 0000 on his PC; the red and amber notes, two pairs in a night, the converter and the clock-change night he watched run in a visible Chrome window on the live site, so they were not repeated; Excel opened in real Excel — `24:00` and `00:00` shown, no `#####`, the line formula in the formula bar, an edited Out time carried to the total; print preview of a week and of the chart, one page each. His preview showed the settings in two columns, which the scripted check (1366px window) had not: re-run at real paper width, a fortnight printed on two pages; fixed to one on A4 and Letter. **The read:** the founder delegated it ("you read") — he does not know the subject. The assistant read every paragraph against Rules 4 and 8 and the sources: the California workday sentence was wrong for nights back to back and was rewritten; "prints its rule" (the Pennsylvania chart has moved since the 2024 copy) and "never as 7" softened; the article's twelve long dashes removed. Into the sitemap the same day; linked from every page and from `/how-it-counts`; pin 6 made. **Full check of all six tools the same evening**, in installed Chrome on the live site at seven widths (360–1920), every answer hand-worked first, every formula in every downloaded sheet worked out again, every card printed at real A4 and Letter width, links, titles and canonicals: 1,240 checks passed. Found and fixed: "Over 8 a day, 40 a week" and "Biweekly, 14 days" cut off in the dropdowns of the home, lunch and military cards (the fault the pay card had on 15 Oct). Also found: a missing page answered 404 with an empty body, so Chrome showed its own error screen instead of `404.html`, probably since launch. The founder's dashboard showed why: the site is a Cloudflare **Worker** serving the files in `site/` (Workers Builds, `npx wrangler deploy` on every push), not the Pages project the plan describes, and with no config in the repo Cloudflare guessed one on each build. `wrangler.jsonc` now pins those settings and adds `not_found_handling: "404-page"`; checked with `wrangler dev` before the push (missing pages get the 404 page, everything else unchanged) and pushed the same evening. README and PLAN corrected | 8 — **ninety-day cap reached** |
| 2026-10-29 | founder + assistant | **Blog section and `/blog/how-to-calculate-overtime-pay` — a deliberate exception to the 90-day cap, the founder's decision.** He asked for a blog section and a researched article; offered: index now (one page over the cap), live but noindex until 10 Dec, or wait. He chose index now. `/blog/` itself is `noindex, follow` (a list, not a page anyone searches for) and is not in the sitemap, so the count is **9**, not 10. Reasoning: Rule 3 exists to stop templated bursts; one researched article, 6 days after the last page, is not that, and the seven-day rule (two a week) holds. Topic picked on pytrends (US, 12 months, `time card calculator` = 100): `how to calculate overtime` 24, `how to calculate hours worked` 6.5, `how to calculate double time` 2.4. Every rule from DOL Fact Sheets #23 and #56C, 29 CFR 778.115/.207/.209/.419, California DIR, Colorado's COMPS poster, AS 23.10.060, NRS 608.018 (Nevada's and Alaska's official sites refused automated reads; statute text as quoted). Every worked figure checked by hand. Blog link added to every header (hidden below 900px) and footer | 9 |
| 2026-11-06 | founder + assistant | **Second measurement**. Also: is hourstally.substack.com still `noindex`? Any new comments on the two dev.to articles? | 8 |
| 2026-11-06 | — | No pages until the review. Bing and Search Console queries read, titles adjusted, bugs to tests, Pinterest pins for every page | 8 |
| 2026-12-04 | founder + assistant | **Third measurement** | 8 |
| 2026-12-10 | founder + assistant | **Ninety-day review.** See below. Decides whether the schedule continues. Also decides whether one or two practical articles take slots beside the tool pages (founder agreed to put it on the list, 2026-10-29) | 8 |
| 2026-12-11 | assistant | `/monthly` — real calendar month, working-day count, pro-rata | 9 |
| 2026-12-18 | assistant | `/hours-and-minutes` | 10 |
| 2027-01-01 | founder + assistant | **Fourth measurement** | 10 |
| 2027-01-08 | assistant | `/payroll-hours` — many employees, one sheet | 11 |
| 2027-01-15 | assistant | `/schedule-maker` | 12 |
| 2027-01-22 | assistant | `/rounding` | 13 |
| 2027-01-29 | founder + assistant | **Fifth measurement** | 13 |
| 2027-02-05 | assistant | `/hourly-to-salary` | 14 |
| 2027-02-12 | assistant | `/minutes-to-decimal-chart` — only if it can stand on its own; else it stays inside `/time-to-decimal` | 14 or 15 |
| 2027-02-26 | founder + assistant | **Sixth measurement.** First check against the 1,000-sessions milestone | 14 or 15 |
| 2027-04-15 | founder + assistant | **Uneed free launch day.** Needs an upvote score of 10 to stay listed and 20 for the dofollow link: share the launch page that morning where people already know the site (never paid votes, never vote rings) | — |

After that the list in `PLAN.md §4` is exhausted. Anything further is a new decision, taken on
the measurement numbers, not on a feeling that the site needs more pages.

## What happens in the weeks between pages

No new URLs. Work goes into the pages that exist:

- Bugs and edge cases reported by real users become tests, then fixes
- ~~A true `.xlsx` download to replace the CSV~~ — done 2026-09-14, no library, formulas for total and pay
- Speed and phone checks on every page
- Reading the Search Console queries report for what people actually typed to arrive, and
  adjusting titles and explanations to match — the single cheapest ranking lever there is

- Distribution that is not Google organic — Bing, IndexNow, Pinterest, a YouTube Short, directories —
  is listed in `DISTRIBUTION.md` with who does what. IndexNow ping after every publish.

None of this creates a page, so none of it counts against the cadence.

## The ninety-day review — 2026-12-10

Three measurements will exist by then. The review asks one question: **is Google serving the
site at all?** Impressions on the three original pages, trend across the three pulls, and
whether indexed pages equal sitemap pages.

- Impressions rising, pages indexed → continue on schedule, one a week
- Flat at near zero → continue, but slower: one page a month. Gstextract took four to five months
  in a weaker market; day ninety is early
- A drop of 50% or more between two pulls on every page at once → stop publishing, follow
  `GOOGLE-RULES.md §4`, and the schedule is void until the incident is written up

### Practical articles — on the list for the review

Added 2026-10-29. fileoholic's numbers for the 14 days to 25 Oct: 15 articles brought 87 clicks,
8 tools 51. But only the practical kind earned them: "HEIC files on Windows" 34 and "open a Numbers
file on Windows" 33, while "what is a JFIF file" drew 5,871 impressions and 11 clicks, because
Google answers a "what is" question itself. So for hourstally: only "how do I do this job"
articles that lead into a tool, never explainers. Candidates, **not yet checked**: "how to calculate
double time pay" (already in our Search Console queries, 2026-10-27 pull), "how to make a time card
in Excel" (the .xlsx with formulas is the answer). Before the review the assistant checks each
for volume (pytrends, then Keyword Planner) and whether Google's own answer box already settles
it; only survivors reach the review. An article is an indexable page: it counts against the caps.

## Milestones, restated with the dates they could plausibly land

| | Milestone | Earliest realistic |
|---|---|---|
| M0 | Domain, remote, live | done 2026-09-11 |
| M1 | Three pages indexed, first measurement written | 2026-10-09 |
| M2 | 1,000 sessions in 30 days from US/UK/CA/AU | spring 2027, if it ranks at all |
| M3 | Ad network accepted, first payout | one to two months after M2 |
| M4 | 10,000 sessions a month | not scheduled; earned or not |

## What this schedule is not

It is not a promise of traffic. It is a promise about behaviour: what gets built, in what order,
no faster than this, with the numbers written down every 28 days. If the numbers say stop, it
stops. If the founder wants a page sooner than its date, the answer is the date, and the reason is
the two sites that did it the other way.
