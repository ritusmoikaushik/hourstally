# hourstally — project spec

**Domain:** hourstally.com
**What it is:** a free time card / timesheet calculator site, funded by display ads.
**What it is not:** SaaS. No signup, no login, no billing, no support queue.

## Why this niche was chosen — 2026-09-10

Screened against a scorecard fixed before the data was read. Seven dimensions, bar of
25/35 with nothing below 3.

| | Timesheet | Roofing (rejected) |
|---|---|---|
| Demand | 5 | 4 |
| Money | 3 | 5 |
| Who is there | 3 | 2 |
| Can we win | 3 | 3 |
| AI resistance | 5 | 2 |
| Monetisable | 4 | 4 |
| Durability | 5 | 3 |
| **Total** | **28** | **23** |

Evidence behind the scores:

- **Demand.** Keyword Planner, US+UK+CA+AU, English. `timesheet calculator`,
  `timecard calculator`, `work hours calculator`, `time clock calculator` each
  100K–1M/month. ~40 more terms at 10K–100K. 1,755 keywords in the cluster.
- **Money.** Top-of-page bids ₹70–₹850 typical, peaks ₹1,805. Payroll SaaS bids hard.
- **AI resistance.** Google shows no AI Overview on `timesheet calculator` or
  `biweekly time card calculator`; on `time card calculator with lunch` the Overview
  sits *below* three organic results. Transactional queries carry AI Overviews ~5% of
  the time vs 86% for question-shaped queries.
- **Who is there.** miraclesalad, redcort (1999), calculatehours (2009),
  calculatorsoup, calculator.net, timecardcalculatorgeek (2012), timeclockmts,
  free-online-calculator-use — small, old, plain. Plus SaaS bait pages from QuickBooks,
  Jibble, Harvest, Toggl, Clockify. Google ranks a **Pinterest pin** at #10 for
  `biweekly time card calculator`, which is what a thin SERP looks like.
- **Durability.** Payroll runs every week of every year. No seasonality.

Roofing was rejected despite 5–20x the click value: nine competitor domains registered
between Jul 2025 and Jul 2026, **none of which rank on Google page one**, and the
question-shaped half of its volume is now answered by AI Overviews directly.

## The wedge

Google's own "people also search for" strip surfaced **`time card calculator with
multiple in and out`** under two different searches. Redcort, Clockify and
Calculator.net were each checked by hand: **none of them support more than one in/out
pair per day.** Demand shown twice, supply absent.

Second repeated signal in the same strips: **Excel**. `timesheet calculator excel`,
`bi weekly timesheet with lunch break excel`. People want a file to keep, not only a
number on a screen. gstextract's own Search Console data measured file-word queries
converting ~11x better than screen-answer queries.

So v1 must have, on day one:
1. Several in/out punches per day.
2. Excel and PDF download of the finished card.

## Monetisation

Milestone 1 — **1,000 sessions/month from US/UK/CA/AU** unlocks Mediavine Journey
($15–40 RPM). AdSense alone pays $2–6. Ezoic has no traffic minimum as a fallback.

Both networks reject tool-only sites as "low value content". **Every page carries real
written explanation, not just a form.**

## Rules for this repo

- Static site. No backend, no database, no accounts.
- No page exists that is a template with a word swapped — that is the exact pattern
  Google's scaled-content-abuse policy names, and it is the top enforcement priority
  of 2026.
- Every calculator page must be usable on a phone.
