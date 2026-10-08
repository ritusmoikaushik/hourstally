# Niche log — ad-funded tool sites

Every niche screened for a second site like hourstally, with the verdict and the numbers, so
nothing is screened twice and nothing parked is forgotten. Same scorecard as `PROJECT.md`: seven
dimensions, bar 25/35, nothing below 3. Volume and bids are Keyword Planner, US+UK+CA+AU unless
noted, pulled by the founder. SERP checks by the assistant.

**Order of gates, learned the hard way on 2026-09-14:** volume first (Keyword Planner), SERP
second, wedge third. A thin SERP on a tiny query is empty, not open.

## Screening now — waiting on volumes

### New instrument, 2026-10-08 — Google Trends against a known anchor

`pytrends`, US, last 12 months, every term compared with `time card calculator` (= 100; Keyword
Planner 100K–1M across four countries). Calibration: `depreciation calculator` (KP 1K–10K) scores
about 21, `gs pay scale` (KP 10K–100K) about 170. **Under about 30 is probably too small.** Free,
needs no pull, runs about 40 terms in ten minutes. Use it before asking the founder for volumes.

Scores from the first run: grade 837 · date 812 · paycheck 689 · GPA 519 · age 505 · inflation 419 ·
retirement 380 · tip 211 · 401k 208 · CD 166 · sales tax 159 · roth 125 · budget 99 · discount 90 ·
bond 74 · annuity 72 · invoice generator 58 · salary to hourly 57 · hourly to salary 57 · overtime 52 ·
future value 36 · ROI 31 · simple interest 21 · PFT 20 · credit card payoff 18 · gas mileage 18 ·
gross pay 17 · military time converter 16 · present value 14 · pay raise 8 · labor cost 7 ·
employee cost 5 · debt snowball, debt payoff, turnover rate, cost per hire ~0.

**For hourstally, not a new site:** salary to hourly, hourly to salary and overtime score 52–57,
as big as each other. `/hourly-to-salary` sits at 2027-02-05 in `SCHEDULE.md`; the numbers say it
belongs nearer `/with-overtime-and-pay`. Founder's call.

### Grade and GPA calculators — opened 2026-10-08

- **Trends:** grade 837, GPA 519 — the biggest unowned heads found so far. Date, paycheck, age,
  retirement and 401k are bigger or similar but owned (timeanddate, payroll firms, brokers) or
  bid nothing.
- **Page one (Brave):** `grade calculator` — calculator.net, rapidtables, canvasgradecalculator.com,
  gradecalculator.com, quickgra.de, omni. `final grade calculator` — rogerhub (one-person site,
  #1). `gpa calculator` — calculator.net, gpacalculator.io, gpacalculator.net, then universities.
  `high school gpa calculator` — gpacalculator.io/.net, gradecentric, gpanerd. Small independent
  sites, and new exact-match ones still getting in.
- **Opened:** canvasgradecalculator.com (© 2025) — manual entry only, weighted categories, what-if,
  final needed; pages for each LMS. quickgra.de — a teacher's EZ-grader (questions wrong → score),
  a second intent inside `grade calculator`.
- **Wedge, as proposed:** paste the grades page from Canvas, PowerSchool, Schoology or Infinite
  Campus; the tool reads assignments, categories and weights, then gives the current grade,
  what-if, and the score needed on the final. Nobody on page one does it; every rival is typing.
- **Against it, before the pull:** students are the heaviest AI users and ChatGPT will do the
  same sum from a paste. A student audience may pay little per thousand visits. gradekar is a
  grade site too, though Indian CGPA and a different market. Bids decide it.
- **Pass condition:** `grade calculator` or `gpa calculator` at 100K–1M, at least three cluster
  terms at 10K–100K, top bid ₹150+ on a head.

### Inflation — second, weaker

`inflation calculator` 419. Page one for `value of a dollar calculator`: usinflationcalculator,
dollartimes, measuringworth (small sites) beside BLS and the Minneapolis Fed. Question-shaped
("what is $100 from 1980 worth"), so AI Overview risk is high and no file wedge. Pull only alongside.

### Killed on page one, no pull needed

HR/employer calculators (employee cost, turnover rate, cost per hire, Bradford factor) — QuickBooks,
Deel, BambooHR, Breathe, Personio on page one, and Trends near zero in the US. Military fitness
(AFT, PFT, CFT, PRT, Air Force PT) — Trends PFT 20, ACFT ~1; page one already has several
all-branch hubs (thebattlebunker, combatfitness.co, vetrafi), and navy.mil / afpc.af.mil on two of
them. UK employment calculators — gov.uk owns holiday entitlement, redundancy, maternity and sick
pay; pension firms own salary sacrifice. UK Trends run failed on a script bug; not measured.

## Parked — passes the bar, not built yet

Nothing at present. VAT below is borderline and has no wedge.

### Marketplace fee calculators — was 26, killed 2026-09-14 after the adversarial pass

Parked at 26 in the morning; founder asked for failure cases before committing; killed the same
evening. Kept here in full so the reasoning is not redone.

- **Head terms:** `paypal fee calculator` 10K–100K (₹237–716), `ebay fee calculator` 10K–100K
  (₹147–815), `ebay calculator` 10K–100K (₹206–966), `stripe fee calculator` 1K–10K (₹205–777).
  Etsy 1K–10K and ₹3 bids. Cluster 449 keywords, US+CA. No AI Overview on either head term.
- **The wedge as proposed:** drop the seller's PayPal or eBay CSV, get the year summarised — gross,
  fees, shipping, refunds, net, by month — Excel back. Based on eBay community threads asking for
  exactly that.
- **Why it died:**
  1. **The platforms now do it.** eBay Seller Hub → Payments → Reports → *Financial overview*, custom
     date range, PDF or CSV. PayPal: annual financial summary, monthly statements with a fee
     summary, fees report on the 6th of each month, PDF/Excel/CSV. The threads I relied on were
     from the 2020 managed-payments changeover.
  2. **The #1 incumbent is funded.** ebayfeescalculator.com is run by Flyp, a reseller SaaS:
     category-accurate, store tiers, promoted listings, international, seven countries, nine
     platforms, iOS and Android apps, updated Jul 2026. I had called it a small ad site from the
     domain name without opening it.
  3. **Page one is bait all the way down:** 3Dsellers, ResellBot, Closo, ZIK, AutoDS, Spocket,
     Yotpo, Wise, Statrys, Mercury, Karbon. More every quarter.
  4. **The real accuracy gap cannot be closed from outside.** Sellers' loudest complaint is that no
     calculator matches the statement, because eBay nets promoted-listing fees from earlier
     unsettled sales that no outside tool can see. Platform withholds the data — same lesson as
     the Google education APIs.
  5. **Trademark.** eBay has taken thousands of "ebay…" domains by UDRP. Any domain must be generic.
- Rescored: Demand 4 · Money 4 · Who is there 2 · Can we win 2 · AI 4 · Monetisable 4 ·
  Durability 3 = **23**.

### VAT calculator — borderline 25 — parked 2026-09-14

`vat calculator` 100K–1M (₹84–490), `reverse vat calculator` 1K–10K (₹250–615). UK-heavy.
Page one (US view): Stripe, Omni, calculator.net, gigacalculator, and small sites
(vatcalculators.co.uk, calcx, cosmomath, vatcalconline). Nothing found to make a new one
different from thirty others. Revisit only with a wedge.

## Killed — do not screen again

| Date | Niche | Volume | Bids | Killed by |
|---|---|---|---|---|
| 2026-09-14 | Trucking hours of service | head 10–100, best 100–1K, 22 keywords | ₹140–440 | Demand 1. SERP looked thin because nobody searches. AI Overview present too |
| 2026-09-14 | Tire size / wheel offset | `tire size calculator` 100K–1M, 965 keywords | ₹77–620, peaks ₹1,873 | No wedge. tiresize.com is ad-funded, plain and complete (compare, visualiser, speedo error, plus-sizing, charts). Strips ask for nothing it lacks except "by vehicle", which needs a car database. `wheel offset` has an AI Overview and wheel retailers on page one |
| 2026-09-14 | Concrete / square footage | 100K–1M each | ₹16–315 | Quikrete, Sakrete, Cemex, ready-mix plants, calculator.net. Manufacturers own it |
| 2026-09-14 | Freight class / pallet / CBM | 10K–100K / 1K–10K / 1K–10K | ₹218–848 / ₹215–916 / ₹589–5,671 | FedEx, Estes, Schneider, BlueGrace. Carriers own it. CBM bids are wild but volume tiny |
| 2026-09-14 | Business days calculator | 10K–100K | ₹262–2,473 | timeanddate.com, then SaaS bait |
| 2026-09-14 | Prorated rent / rent increase | 10K–100K / 1K–10K | ₹46–319 | Zillow, Omni, TurboTenant, Baselane, RentSpree |
| 2026-09-14 | Mileage reimbursement | not pulled | — | Ramp, Brex, Zoho, Driversnote bait |
| 2026-09-14 | Tip pooling | not pulled | — | Nine SaaS bait pages (7shifts, Connecteam, MarketMan, eTip…) |
| 2026-09-14 | Recipe cost / converter / scaler | 1K–10K each | ₹135–354 | Demand. Also six new tool sites already |
| 2026-09-14 | Etsy fee calculator | 1K–10K | ₹3–102 | Demand and bids |
| 2026-09-14 | UK pro rata salary | 10K–100K, −90% YoY | ₹228–816 | Tiny exact-match domains already, falling volume, low money |
| 2026-09-14 | Golf handicap | not pulled | — | USGA, R&A, apps |
| 2026-09-14 | Aviation (crosswind, density altitude, E6B, W&B) | 10K–100K (−90%) / 1K–10K / 1K–10K / 100–1K | ₹0–507 | Cluster too small, head term falling, no bids on it |
| 2026-09-14 | Word counter, HEIC to JPG | 1M–10M / 100K–1M | ₹2–44 / ₹1–5 | Nobody bids. Ads pay nothing |
| 2026-09-14 | Board foot, gravel, paint, pool volume, gear ratio, voltage drop, wire size, tile | 10K–100K each | ₹1–265, mostly under ₹100 | Suppliers and retailers bid nothing and own page one |
| 2026-09-14 | Sleep calculator | 100K–1M | ₹116–559 | Sleep Foundation, AASM, Healthline, mattress brands. Health authority, YMYL |
| 2026-09-14 | One rep max | 100K–1M | ₹102–592 | strengthlevel.com is complete and ad-funded; NASM, Barbell Medicine behind it |
| 2026-09-14 | SAT score calculator | 10K–100K | ₹214–1,291 | Magoosh, Albert and five other test-prep companies; all use the same College Board tables |
| 2026-09-14 | BTU calculator | 10K–100K | ₹24–631 | Midea, retailers, heating shops |
| 2026-09-14 | Macro, TDEE, percentage, cap rate, roof pitch, puppy weight, random group, FERS, pdf to excel, cubic yard, stair, tank volume, running pace | 10K–1M | high bid under ₹150, or under ₹300 with retailers/YMYL on page one | Bids or ownership |
| 2026-09-14 | Wedding budget/alcohol, cake serving, cat age, passport photo, electricity cost, generator size, tow capacity, closing costs, real estate commission, csv/vcf, image/invoice to excel, gpx | 1K–10K or below | various | Demand |
| 2026-09-14 | Margin / markup / profit margin | 100K–1M / 10K–100K | ₹160–1,720 | Shopify, Sage, Zendesk, Mercury, Yotpo bait; forex brokers inflate the bid on `margin calculator` |
| 2026-09-14 | Dilution / ppm / density (lab) | 10K–100K | ₹594–4,250 | Sigma-Aldrich, Tocris, Qiagen, Selleck — the suppliers own it |
| 2026-09-14 | Body type / body shape | 10K–100K | ₹129–619 | Clothing retailers, omni, calculator.net |
| 2026-09-14 | Full Keyword Planner sweep — seeds `calculator`, `converter`, `generator`, `checker`, `template`, 2,791 terms | 449 at 10K+ and ₹150+ | — | Banks and lenders (mortgage, loan, tax, refinance), currency pairs (Google widget), maths solvers (Desmos), physical generators (Generac), payroll (hourstally's own cluster: `time card calculator` 100K–1M ₹137–1,568). `checker` is the board game; templates bid under ₹131. Nothing unowned with money that was not already screened |
| 2026-09-14 | Chart / graph makers | eight heads at 10K–100K (`bar graph maker`, `chart maker`, `graph maker`, `pie chart maker`, `line graph maker`, `flowchart maker`, `gantt chart maker`, `timeline maker`) | ₹265–623; flowchart ₹1,674, gantt ₹1,983 | AI. `line graph maker` and `timeline maker` down 90% YoY; AI Overview on `bar graph maker`; "AI bar graph maker" in the strip and in Google's ad block; Deepnote AI on page one. Generation, not transformation. Page one otherwise winnable (bargraphmaker.net #1, rapidtables, makechart.co beside Canva and Adobe) and the wedge — an .xlsx with a native chart — is real, but it would sit on a shrinking market. Score ~21 |
| 2026-09-14 | Second Keyword Planner sweep — seeds `planner`, `maker`, `tracker`, `estimator`, `counter`, `schedule`, `chart`, 3,079 terms | 538 at 10K+ and ₹150+ | — | Sports scores and fixtures (ESPN), hospital MyChart portals, parcel tracking (carriers), paper planners (products), tax calculators (TurboTax, banks). Charts were the only new cluster; killed above |
| 2026-09-14 | Shift, PTO accrual, FTE, day rate, soap, lye, candle, quilt, fabric, sourdough, DoorDash pay, rotating shift, 12-hour shift | all 1K–10K or below | various | Demand |
| 2026-10-08 | Depreciation / MACRS schedule | `depreciation calculator` 1K–10K; rental 1K–10K; macrs, section 179, bonus, schedule excel/template 100–1K; car 10K–100K (−90%) | head ₹345–1,178; schedule excel ₹728–2,184; car ₹53–275 | Demand. Pass condition (head 10K+, two more at 10K+) fixed before the pull; failed. Bids rich, searches few. SERP was the hourstally shape (calculator.net, calculatorsoup, goodcalculators, new rival mydepreciation.org) — a thin SERP on a small query again |
| 2026-10-08 | GS / federal pay | `gs pay scale` 10K–100K, `gs pay calculator` 1K–10K, `federal pay calculator` 100–1K | none on any | Money. Nobody bids on federal pay. Page one was small sites (federalpay.org, fedtools) — open, and worth nothing under ads |
| 2026-10-08 | Amazon order history to Excel | `amazon order history report` 1K–10K (−90%), others 10–1K | ₹97 or none | Demand and money |
| 2026-10-08 | Bank statement to Excel | `bank statement converter` 1K–10K, `bank statement to excel` 100–1K | ₹177–1,549 | Demand. Rich bids, few searches; page one is SaaS (DocuClipper, Nanonets, bankstatementconverter.com) |
| 2026-10-08 | iPhone texts / WhatsApp chat to PDF | `export text messages from iphone` 1K–10K (−90%), `export whatsapp chat` 1K–10K, the PDF terms 10–100 | ₹53–278 | Demand and money |
| 2026-10-08 | VA disability, trip fuel cost, blood alcohol | not pulled | — | Killed on page one before the pull: va.gov and law firms; fueleconomy.gov; universities and health bodies (YMYL) |
## Standing lessons

- Any calculator next to a funded SaaS category has bait pages from that SaaS on page one.
  Hourstally got through because its head terms are 100K–1M and old plain sites still hold.
- Manufacturers, carriers, retailers, banks, gov.uk and timeanddate cannot be beaten by a new
  domain. If one is on page one for the head term, stop.
- Volume without bids (image tools, word tools) is worthless under ads.
- The wedge that has worked: the user's own file in, an Excel out.
- **Open the incumbent before scoring it.** Twice in one day a domain name was read as "small ad
  site" — countworkhours (missed entirely) and ebayfeescalculator.com (run by a funded SaaS).
  The score for "who is there" comes from the page, not the URL.
- **Forum threads have dates.** An ask from 2020 may have been answered by the platform since.
  Check the platform's own reports page before calling a summary or export job unserved.
- A head term down 90% year on year with an AI Overview on it is AI eating the category. Two in
  one cluster is a kill, whatever the wedge.
- Google's "People also search for" strip is where the hourstally wedge came from. Read it before
  scoring "can we win".
- **Guessing candidates lands at 1K–10K.** Six guesses on 2026-10-08, all small. Heads at 100K+
  are few and the seed sweeps already listed them. Next instrument: Keyword Planner seeded with
  the *websites* of small tool sites that are visibly winning — their keyword list is both the
  demand and the proof a small site can rank there.
- **No general calculator site — founder agreed 2026-10-08.** A mix of unrelated calculators
  fights calculator.net, Omni and calculatorsoup on every page, has no topic for Google to
  credit, needs hundreds of pages our pace cannot reach, and is the shape the scaled-content
  crackdown targets. Route finds instead: work/hours/pay → a page on hourstally; a file job →
  a tool on fileoholic; a new site only for a related cluster of five or more terms with volume
  and bids.
