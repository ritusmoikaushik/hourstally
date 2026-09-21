# Distribution — everything that brings a visitor that is not Google organic

Google decides the pace of organic. It does not decide everything. This file lists every channel
that is allowed under `GOOGLE-RULES.md` (none of them adds a page), who does each one, how long it
takes, and what has been done. Ranked by expected value per minute.

Standing rule for all of it: **never post a link where nobody asked.** Answer questions, list the
tool where tools are listed, pin where pins are pinned. Nothing that reads as spam, because spam is
also a Google signal, and this estate has lost two domains to signals.

## Done

| Date | Channel | What |
|---|---|---|
| 2026-09-11 | Google Search Console | Verified, sitemap submitted, indexing requested for the three launch pages |
| 2026-09-11 | Cloudflare Web Analytics | On |
| 2026-09-14 | IndexNow | Key file live at `/10206f9edaa086337d546f9fa7031118.txt`. All four URLs submitted to api.indexnow.org and bing.com — both returned 202. Bing, DuckDuckGo, Yandex and Naver read IndexNow. Bing carried gstextract when Google dropped it |
| 2026-09-14 | Structured data | Author, dates and feature list on both tool pages; sitemap carries `lastmod` |
| 2026-09-21 | Bing Webmaster Tools | Site added, sitemap submitted. Reports take up to 48 hours to appear |
| 2026-09-14 | Pinterest pin images | Three pins made, in `D:\tmp\hourstally-pins\` (time card, biweekly, decimal). Waiting on the account — see below |

## Founder's queue — short tasks, in order

### ~~1. Bing Webmaster Tools~~ — done 2026-09-21

### 2. Pinterest — 15 minutes once, then 2 minutes per page

Google ranks a Pinterest pin at #10 for `biweekly time card calculator`. A pin is the one social
object Google indexes as a page of its own.

1. Create a Pinterest **business** account, name **HoursTally**, website hourstally.com (claim the
   site — it asks for a meta tag; send it to me and I add it).
2. Board: **Time card calculators and payroll hours**.
3. Upload the three pins from `D:\tmp\hourstally-pins\`. Title and link for each:

| File | Pin title | Link | Description |
|---|---|---|---|
| `pin1-time-card.png` | Free time card calculator with unlimited clock in and out per day | https://hourstally.com/ | Add every in and out pair you actually worked, deduct unpaid breaks, see overtime split out, and download the finished card as Excel with formula totals. No signup. |
| `pin2-biweekly.png` | Biweekly time card calculator that downloads as Excel | https://hourstally.com/ | Pick a 14-day pay period, type your punches, get regular and overtime hours per week and a real .xlsx you can send to payroll. |
| `pin3-decimal.png` | Time to decimal converter for payroll | https://hourstally.com/time-to-decimal | 7:45 is 7.75, not 7.45. Convert one time or paste a whole column, with a printable 1–60 minutes chart. |

Then one new pin for every page that ships, the day it ships. I make the image.

### 3. YouTube Short — 10 minutes to record

A 30–45 second screen recording, no voice needed, captions on screen. YouTube results appear in
Google for `time card calculator excel` type queries and a Short is the cheapest video there is.
Script:

1. (0–5s) Home page. Caption: *Free time card calculator — no signup*
2. (5–20s) Type a day with two in/out pairs: 7:00–11:00, 11:30–15:30. Press +, add 16:00–18:00.
   Caption: *Add as many clock-ins a day as you worked*
3. (20–30s) Set overtime to "Over 8 a day". Total shows 10h with 2h overtime.
   Caption: *Overtime split out by the rule you pick*
4. (30–45s) Press "Download as Excel". Open the file, click the total cell — it is a formula.
   Caption: *Excel download, totals are formulas — hourstally.com*

Title: **Time card calculator with Excel download (free, no signup)**. Description: two lines and the
link. Record on the desktop with the built-in screen recorder (Win+Alt+R) or on the phone.

### 4. Directories — 20 minutes, once

Weak links, but real, and a young domain has none.

- **AlternativeTo** — add HoursTally as an alternative to Redcort Time Card Calculator and
  Calculator.net's time card calculator. Two sentences, the Excel and unlimited-punch points.
- **SaaSHub** — same listing.
- **Product Hunt** — launch on the day `/how-it-counts` enters the sitemap (2026-09-25), so the
  site has four pages to show. Tagline: *Time card calculator with unlimited punches and a real Excel
  download.* No hype in the copy; it is a calculator.

### 5. Forums — only when asked

Reddit (r/Payroll, r/smallbusiness, r/Bookkeeping), Quora, eBay and Etsy seller boards all get
"is there a time card calculator that…" questions. The rule: answer the question fully in plain
words first, mention the site once only if it actually does the thing asked, never start a thread,
never more than one link per week anywhere. I can draft answers; posting is yours.

## Assistant's queue

- **2026-09-25** — `/how-it-counts` into the sitemap; IndexNow ping the same hour; new pin.
- **2026-10-09, first measurement** — read the Search Console *queries* report and Bing's. Every
  query that brought an impression that the page title does not already say is a title or
  paragraph change. This is the cheapest ranking lever there is and it only exists once data does.
- **After every publish** — IndexNow ping:

```
curl -X POST https://api.indexnow.org/indexnow -H "Content-Type: application/json" -d "{\"host\":\"hourstally.com\",\"key\":\"10206f9edaa086337d546f9fa7031118\",\"keyLocation\":\"https://hourstally.com/10206f9edaa086337d546f9fa7031118.txt\",\"urlList\":[\"https://hourstally.com/<page>\"]}"
```

## One decision for the founder — the UK term

`timesheet calculator` is a 100K–1M head term in the cluster and it is the **UK and Australian**
word; nobody there says "time card". The site does not use the word anywhere prominent. A UK
timesheet page would fail the swap test for the right reasons: no FLSA overtime, a 48-hour Working
Time Regulations average instead, a 20-minute rest break after six hours, 24-hour clock by default,
pounds. It is a different tool, not a word swap. It is not in `PLAN.md §3–4`. If wanted, it takes a
schedule slot after the ninety-day cap — say, in place of `/hours-and-minutes` on 2027-01-08 — and
the decision is yours, not mine.
