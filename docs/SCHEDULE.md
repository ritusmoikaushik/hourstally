# Schedule

Dated plan from launch. Built from `PLAN.md` (what and in what order) and `GOOGLE-RULES.md`
(how fast is allowed). The rules cap a seven-day window at two new indexable pages and the
first ninety days at eight. This schedule runs slower than the cap on purpose: one page every
two weeks. A young domain gains nothing from speed and has lost everything to it twice.

Launch day: **2026-09-11**. Ninety-day cap lifts: **2026-12-10**.

Pages are counted as *indexable* only when they are in the sitemap without `noindex`.

## The calendar

| Date | Who | What | Indexable pages after |
|---|---|---|---|
| 2026-09-11 | done | `/`, `/time-to-decimal`, `/about` live. Search Console verified, sitemap submitted, indexing requested | 3 |
| 2026-09-11 | done | Email routing live · `www` answers · Cloudflare Web Analytics found already on · privacy page updated · phone test done on the founder's handset, both tools, print and CSV included. Every finding fixed the same day: number keypad, am/pm switches, aligned rows, row notes, print as a document, chart layout, logo, favicon | 3 |
| 2026-09-25 | assistant | `/how-it-counts` moves from noindex into the sitemap | 4 |
| 2026-10-09 | founder + assistant | **First 28-day measurement.** Search Console and analytics into `MEASUREMENTS.md`. Sitemap status, indexed pages, impressions, any Google update in the window. Competitor watch row for countworkhours.com | 4 |
| 2026-10-09 | assistant | `/with-lunch` — time card with lunch break, auto-deduct rule, meal-break table | 5 |
| 2026-10-23 | assistant | `/biweekly` — two-week grid, week subtotals, pay-period calendar | 6 |
| 2026-11-06 | founder + assistant | **Second measurement** | 6 |
| 2026-11-06 | assistant | `/with-overtime-and-pay` — rate first, two rates in one week, FLSA blended rate | 7 |
| 2026-11-20 | assistant | `/military-time` — 24-hour entry, conversion chart, 0000 vs 2400 | 8 — **ninety-day cap reached** |
| 2026-12-04 | founder + assistant | **Third measurement** | 8 |
| 2026-12-10 | founder + assistant | **Ninety-day review.** See below. Decides whether the schedule continues | 8 |
| 2026-12-11 | assistant | `/monthly` — real calendar month, working-day count, pro-rata | 9 |
| 2027-01-01 | founder + assistant | **Fourth measurement** | 9 |
| 2027-01-08 | assistant | `/hours-and-minutes` | 10 |
| 2027-01-22 | assistant | `/payroll-hours` — many employees, one sheet | 11 |
| 2027-01-29 | founder + assistant | **Fifth measurement** | 11 |
| 2027-02-05 | assistant | `/schedule-maker` | 12 |
| 2027-02-19 | assistant | `/rounding` | 13 |
| 2027-02-26 | founder + assistant | **Sixth measurement.** First check against the 1,000-sessions milestone | 13 |
| 2027-03-05 | assistant | `/hourly-to-salary` | 14 |
| 2027-03-19 | assistant | `/minutes-to-decimal-chart` — only if it can stand on its own; else it stays inside `/time-to-decimal` | 14 or 15 |

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

- Impressions rising, pages indexed → continue on schedule
- Flat at near zero → continue, but slower: one page a month. Gstextract took four to five months
  in a weaker market; day ninety is early
- A drop of 50% or more between two pulls on every page at once → stop publishing, follow
  `GOOGLE-RULES.md §4`, and the schedule is void until the incident is written up

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
