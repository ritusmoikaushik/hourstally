# hourstally — build plan

**Read `GOOGLE-RULES.md` first.** Nothing in this plan overrides it. Where the plan and the rules
disagree, the rules win. In particular: the launch is three pages, the cadence is at most two new
pages a week, and every page must fail the swap test.

`PROJECT.md` records why this niche was chosen. This file records what gets built, in what order,
and what makes each page a genuinely different tool rather than a copy.

---

## 1. Milestones

| # | Milestone | Why it matters |
|---|---|---|
| M0 | Domain bought, repo pushed to a private remote, site live on Cloudflare Pages | Nothing exists until it is on a domain and off this machine |
| M1 | Three launch pages indexed, Search Console and GA4 wired, first 28-day measurement written down | The baseline. Without it nothing later can be judged |
| M2 | **1,000 sessions in 30 days from US, UK, Canada, Australia** | Unlocks Mediavine Journey. This is the first real business milestone |
| M3 | Ad network accepted, first payout | Proof the model works at all |
| M4 | 10,000 sessions a month | Where this becomes a line worth keeping |

There is no date on any of these. Google decides the pace. The record on this estate is that a new
site takes four to five months to rank at all, and the plan assumes that.

---

## 2. Launch — three pages, not thirteen

The domain is new. Three pages, each strong, is the safest shape a new domain can have. Everything
else waits for the cadence rule.

### Page 1 — `/` Time card calculator with multiple in and out punches

**Already built.** The main tool and the wedge. Unlimited punches per day, breaks, five overtime
rules, four pay periods, decimal and h:mm, Excel and PDF.

Target queries: `time card calculator`, `timecard calculator`, `time clock calculator`,
`time card calculator with multiple in and out`, `clock in and out calculator`.

### Page 2 — `/about` and `/how-it-counts`

Not for traffic. For Rule 7. Who runs this, why it exists, and a worked page showing every piece
of arithmetic the tool does — how a day is totalled, how breaks are deducted, how each overtime rule
splits hours, how decimal is derived — so a payroll clerk can check the tool against their own
method. This is the page that gives the site something to say when a classifier asks whether anyone
is accountable here.

### Page 3 — `/time-to-decimal` Time to decimal converter

Chosen for launch over the time card variants because it has the **highest click price in the
entire keyword cluster** — ₹454 to ₹1,899 — at 10K–100K searches a month, and it is a completely
different tool, so it cannot be mistaken for a variant of page 1.

Tool: type a time (`7:45`) get decimal (`7.75`); type decimal get time; paste a column of times and
convert them all at once; a printable 1–60 minutes chart underneath. Content: why payroll uses
decimal, the 0.083 problem, quarter-hour and tenth-hour rounding and where each is used, why
`8:30` is `8.50` and not `8.30`.

Target queries: `time to decimal calculator`, `time decimal converter`, `minutes to decimal`,
`hours and minutes to decimal calculator`, `payroll time converter`.

---

## 3. After launch — the time card variants, one at a time

Each of these targets a real query with its own demand, measured in Keyword Planner. Each is built
as a different tool. The table says what makes it different, and that column is the contract — if
the built page does not do what its "what makes it its own tool" cell says, it is a copy and it does
not ship.

Order is by search demand, highest first. One page at a time, at most two a week, never more than
eight indexable pages before the domain is ninety days old.

| # | Page | Searches / mo | What makes it its own tool | What its writing covers |
|---|---|---|---|---|
| 4 | `/with-lunch` Time card calculator with lunch break | 1K–10K | Single in/out per day by default, a fixed lunch deducted automatically, and an **auto-deduct rule** — deduct 30 min only when the shift runs over 6 hours, which is how most employer systems actually behave and the source of most disputes | Meal break law by state (which states require a break, after how many hours), the auto-deduction dispute, what to do when the system deducted a lunch you worked through |
| 5 | `/biweekly` Biweekly time card calculator | 1K–10K | Two-week grid with **week subtotals** shown separately, overtime split per week not per fortnight, and a **pay-period calendar** that lists every biweekly period for the year from one start date | 26 vs 27 pay-period years, why biweekly overtime is counted weekly, biweekly vs semi-monthly and why the gross differs |
| 6 | `/with-overtime-and-pay` Time card calculator with overtime and pay | 1K–10K | **Rate first.** Regular, 1.5x and 2x multipliers editable, **two rates in one week** (weighted average regular rate, the FLSA method), shift differential add-on, gross pay per day | How the FLSA regular rate is computed when someone works two jobs at two rates, why the overtime rate is not simply 1.5x the higher rate, blended rate worked examples |
| 7 | `/military-time` Military time card calculator | 100–1K | 24-hour entry only, no am/pm anywhere, a **military-to-standard conversion chart**, correct handling of `0000` vs `2400`, and night shift crossing midnight as the default case | Reading military time, the 2400 convention, why hospitals and security use it, converting a standard punch to military for a system that demands it |
| 8 | `/monthly` Monthly timesheet calculator | 100–1K | A **real calendar month** — pick the month, get its actual days with weekends greyed, working-day count, and a **pro-rata** box for salaried staff who started or left mid-month | Monthly vs semi-monthly, how many working days a month has, pro-rata salary arithmetic, contractor monthly invoicing from a timesheet |

---

## 4. Later — the helpers around the time card

Built only after section 3 is done and the ninety-day cap has passed. Same rules.

| # | Page | Searches / mo | What makes it its own tool | Note |
|---|---|---|---|---|
| 9 | `/hours-and-minutes` Hours and minutes calculator | 10K–100K | Add or subtract a list of durations — no dates, no punches, no pay. Between-two-times mode. | Big demand, generic, moderate click price |
| 10 | `/minutes-to-decimal-chart` Minutes to decimal chart | 100–1K | The printable lookup table clerks pin up, with quarter-hour and tenth-hour rounding columns | May fold into page 3 if it cannot stand alone; do not build a thin page to hold a chart |
| 11 | `/payroll-hours` Payroll hours calculator | 1K–10K | **Many employees, one sheet.** Names down the side, days across, one total per person, one grand total, CSV for the whole team | The employer-side tool; different user from pages 1–8 |
| 12 | `/hourly-to-salary` Hourly to salary calculator | 10K–100K | Converts both ways, with hours-per-week and weeks-per-year editable, monthly and biweekly gross shown | High demand, low click price (₹2–₹150). Fills the site out; does not pay |
| 13 | `/schedule-maker` Work schedule maker | 1K–10K | Builds a weekly rota — staff, shifts, days — and prints or exports it. Not a calculator at all | ₹380–₹1,614 a click, competition Medium. The one genuinely new tool shape on the list |
| 14 | `/rounding` Time card rounding calculator | 100–1K | Applies the 7-minute rule, nearest quarter hour, nearest tenth, and shows the difference against exact minutes over a period | Content is the legal point: rounding that always favours the employer is not lawful under the FLSA |

**What is not on the list and will not be.** Anything per state, per city, per job title or per
industry. Anything outside hours and pay. See `GOOGLE-RULES.md` Rules 2 and 5.

---

## 5. How each page is built

The same sequence every time. It is slow on purpose.

1. **Pull the query.** Confirm the target query in Keyword Planner and write the number in the
   table above. If the demand has moved, the table moves.
2. **Define the difference in one sentence** before writing any code — the "what makes it its own
   tool" cell. If that sentence cannot be written, the page is a copy and it stops here.
3. **Build the tool.** Shared engine in `assets/app.js` where the arithmetic is genuinely the same;
   separate page logic where it is not. Tests for every rule the page claims.
4. **Write the explanation.** Minimum 600 words, for a person, answering what they would ask. No
   paragraph reused from another page.
5. **Founder reads every paragraph.** Anything he would not say out loud is cut.
6. **Phone test.** The calculator must be the first thing on screen.
7. **Run the checklist** in `GOOGLE-RULES.md §3` and paste it into the commit.
8. **Check the cadence.** Fewer than two pages in the last seven days, fewer than eight in the
   first ninety days. If not, it waits.
9. **Add to sitemap. Publish. Note the date** in `docs/MEASUREMENTS.md`.

---

## 6. Technical shape

- Static HTML, CSS and JavaScript. No framework, no build step, no server, no database.
- One shared stylesheet, one shared engine file, one HTML file per page.
- Hosted on Cloudflare Pages, root `site/`. Free, fast, HTTPS, custom domain.
- Every page works with JavaScript disabled to the extent of showing its explanation; the tool
  itself needs JavaScript and says so.
- Nothing the visitor types leaves their browser. No analytics beyond GA4 and Search Console.
- Page weight under 100 KB before ads. Ads are the only third-party code that will ever load.

---

## 7. What this plan does not promise

It does not promise a ranking. Two sites in this estate followed a plan, ranked, and were removed.
What this plan promises is that hourstally will not be removed for the reason those two were,
because the reason is written down in `GOOGLE-RULES.md` and every page is checked against it
before it ships.
