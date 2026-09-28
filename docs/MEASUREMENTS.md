# Measurements

Search Console and GA4, pulled every 28 days, written here the same day. Anything not written here
does not exist. Rule 10 in `GOOGLE-RULES.md`.

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
| 2026-09-28 | `/how-it-counts` | 4 | out of noindex, into the sitemap, three days after its slot. IndexNow pinged. Nothing else indexable within seven days either side until `/with-lunch` on 2026-10-02 |

## Early signal — not a pull

Written down because it exists, not because it decides anything. The first real pull is 2026-10-09.

| Seen | Window | Clicks | Impressions | Queries | Notes |
|---|---|---|---|---|---|
| 2026-09-28 | 30 Aug–26 Sep, by API | 0 | 33 | 17 | Average position **51**. Seven impressions more than a week ago: one or two a day since 17 Sep, none at all on four days. By page: `/time-to-decimal` 13 at position 41, `/` 11 at 49, plus 9 on the `http` and `www` copies from before the 21 Sep redirects. Four days show position 5–7 from queries Google keeps anonymous, so they cannot be named. **Index:** URL Inspection says `/`, `/time-to-decimal` and `/about` are "Submitted and indexed". `/how-it-counts` was still "Excluded by noindex" at its last crawl on 12 Sep; it came off noindex today. `/with-lunch` is unknown to Google, as intended. The sitemap was last read 27 Sep with 0 errors. Two queries name pages already on the calendar: "time card calculator with breaks" (`/with-lunch`, 2 Oct) and "time card calculator military time" (`/military-time`, 23 Oct). **Visits:** the Cloudflare Web Analytics beacon is live on every page. There is no GA4, and no API token in this repo, so visit counts need the dashboard |
| 2026-09-21 | 23 Aug–19 Sep, by API | 0 | 26 | 14 | First API pull. Average position **57** — page five and beyond, which is why 26 impressions gave no click. Six of the impressions were on the `http://` and `www` copies, before the redirects of 21 Sep |
| 2026-09-19 | 10–16 Sep | 0 | 17 | 13 | Site six days old in the window. Every query is the target phrase or its neighbour: "time card calculator with multiple in and out" (3), "time punches" (3), "time punch calculator", "punch in punch out calculator", "payroll decimal", "20 mins in decimal". The page is being served for the words on it. Zero clicks on seventeen impressions means it sits deep; no title change on a sample this small |

## 28-day pulls

| Pulled | Window | Clicks | Impressions | Avg position | Tier-1 sessions | Google updates in window | Notes |
|---|---|---|---|---|---|---|---|
| — | — | — | — | — | — | — | first pull due 2026-10-09 (28 days after launch) |

## Competitor watch

Checked at every 28-day pull, same day as the numbers. Position is for `time card calculator`
and `biweekly time card calculator`, US, incognito.

| Pulled | countworkhours.com position | Ads showing? | Multiple in/out yet? | Excel yet? | Notes |
|---|---|---|---|---|---|
| 2026-09-14 | not checked — found today via a trucking query | no | no | no (PDF only) | © 2026, stamp-out site: time card tools next to IRS penalty and "Iran war cost" pages. Missed in the 2026-09-10 screen |
