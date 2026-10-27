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
| 2026-10-03 | Pinterest | Business account HoursTally (founder's Gmail login, country India). `p:domain_verify` tag on the home page, Verify clicked. Board *Time card calculators and payroll hours*. Four pins live: time card, biweekly, decimal, and `pin4-with-lunch.png` → `/with-lunch`, made the same day because that page shipped 30 September without one. `/how-it-counts` gets no pin — it explains, it is not a tool |
| 2026-10-27 | Uneed | Listed and **free launch booked for 15 April 2027** (uneed.best/tool/hourstally, account ritusmoikaushik-4ce2). Name, URL and tagline from Uneed's robot; tag "Invoicing" removed (the site does none); description rewritten to lead with unlimited punches, overtime rules, the Excel file with formulas and all six tools; three 1600x1250 screenshots of real filled cards (`D:/tmp/hourstally-pins/uneed-home.png`, `uneed-pay.png`, `uneed-military.png`). **Rules on a free launch, from Uneed's own page: an upvote score under 10 on launch day sends it back to the dashboard; the dofollow link needs 20.** Fast-track (paid) declined: buying a link |
| 2026-10-27 | YouTube | HoursTally channel created; one Short, public (https://youtube.com/shorts/kJsmHVN7XII): the home card with three clock-ins, overtime and the Excel button |

## Links from other sites — which platforms give a dofollow link

Checked 2026-10-12 by reading the `rel` attribute on real pages in a browser, not from blog
claims. Founder's point the same day: most places are nofollow, and nobody answers cold email.

| Platform | Link in a post or listing | Verdict |
|---|---|---|
| **dev.to** | `noopener noreferrer`, also on accounts three days old | **Dofollow** |
| **Substack** | no `rel` at all on links in a post | **Dofollow**, but a new publication is `noindex` until Substack lifts it (seen 27 Oct) |
| **Uneed** (uneed.best) | listing's "Visit website" is `noopener` only, on small free calculators too. Free queue is about six months (founder, 2026-10-12); paying to skip it is buying a link — not allowed, here or on any launch site that sells a fast lane | **Dofollow**, slow |
| Medium | `noopener ugc nofollow` | Nofollow |
| Hashnode | `nofollow ugc` in the post body | Nofollow |
| Indie Hackers | posts and product pages `nofollow` | Nofollow |
| BetaList | goes through `/visit`, `nofollow` | Nofollow |
| SaaSHub | `nofollow` on every link | Nofollow |
| npm, GitHub README | homepage and README links `nofollow` | Nofollow |
| Product Hunt, AlternativeTo, Reddit, Quora | known nofollow; not re-tested | Nofollow |
| WordPress.com, Peerlist, HackerNoon | no sample with an outside link found; HackerNoon is editor-reviewed | Unknown |
| "Best free time card calculators" lists | written by time-tracking SaaS (jibble, Toggl, TMetric); TMetric links Redcort `nofollow` | Nofollow |

**The rule that goes with it.** A dofollow link we put there ourselves is still a link we made.
Google's link-spam policy lists links created mainly to manipulate ranking, low-quality directory
links and mass self-published posts. So: **one listing on Uneed per site, at most one or two real
articles per platform**, each one something a reader on that platform would want anyway. Never
bought links, link swaps or paid guest posts — the estate has lost two domains to signals.

**Articles worth writing** (the assistant drafts; the founder reads and posts):
- dev.to — "A real .xlsx with working formulas in plain JavaScript, no library" (`xlsx.js`) — **posted 13 Oct**: https://dev.to/ritusmoikaushik/a-real-xlsx-with-working-formulas-in-plain-javascript-no-library-50bc. Checked live the same day: the link to hourstally.com is `rel="noopener noreferrer"`, no `nofollow`, so dofollow; the page is indexable. Draft in `docs/devto/01-xlsx-without-a-library.md`, written to gstextract's voice rules (`gstextract/docs/GSTExtract_Growth_PRD.md`, "Writing Style") One comment, 14 Oct, from Yunus Emre Vurgun: column widths are counted in digits of the Normal font, so pin it. Right; answered 26 Oct (the founder posted the reply), and `test/xlsx.test.js` now fails if font 0 stops being Calibri 11
- dev.to — "The night the clocks go back: the daylight-saving bug in time card maths" — **posted 26 Oct**, six days before US clocks go back on Sun 1 Nov: https://dev.to/ritusmoikaushik/the-night-the-clocks-go-back-the-daylight-saving-bug-in-time-card-maths-hon. Tags javascript, webdev, testing, tutorial; cover image made the same day in the site's colours (`D:\tmp\hourstally-pins\devto-02-cover.png`: the 31 Oct night shift, 8:00 crossed out, 9:00 in red). Checked live the same minute: the link to hourstally.com is `rel="noopener noreferrer"`, no `nofollow`, so dofollow; the page is indexable. Draft in `docs/devto/02-the-night-the-clocks-go-back.md`, every code sample run against the real `clockChange`, every date and rule checked at its source (15 U.S.C. 260a, gov.uk, MDN, Node's `TZ` docs, the Energy Policy Act of 2005)
- Substack — "Some Friday payrolls get 27 paydays in 2027. Or in 2026." — **posted 27 Oct** on a new publication, hourstally.substack.com: https://hourstally.substack.com/p/some-friday-payrolls-get-27-paydays (tags Payroll, Paydays, Biweekly; no contacts imported, no subscribers added). Links to `/biweekly` and the home page carry no `rel`, so dofollow. **But the whole publication is `noindex`**, the home page as well as the post: Substack withholds indexing from new publications until they meet an unpublished bar (posting, subscribers). Not our doing; recheck at every measurement. Until it clears, worth far less than dev.to. Draft in `docs/substack/01-27-paydays.md`
- dev.to, for fileoholic — "Opening Microsoft Publisher files in the browser with WebAssembly"

## Founder's queue — short tasks, in order

### ~~1. Bing Webmaster Tools~~ — done 2026-09-21

### ~~2. Pinterest~~ — done 2026-10-03. From here: one pin per page, the day it ships

Google ranks a Pinterest pin at #10 for `biweekly time card calculator`. A pin is the one social
object Google indexes as a page of its own.

1. Create a Pinterest **business** account, name **HoursTally**, website hourstally.com (claim the
   site — it asks for a meta tag; send it to me and I add it).
2. Board: **Time card calculators and payroll hours**.
3. Upload the three pins from `D:\tmp\hourstally-pins\`. Title and link for each:

| File | Pin title | Link | Description |
|---|---|---|---|
| `pin1-time-card.png` | Free time card calculator with unlimited clock in and out per day | https://hourstally.com/ | Add every in and out pair you actually worked, deduct unpaid breaks, see overtime split out, and download the finished card as Excel with formula totals. No signup. |
| `pin2-biweekly.png` | Biweekly time card calculator that downloads as Excel | https://hourstally.com/biweekly (was `/` until the page shipped; the founder changed the live pin's link 2026-10-12) | Pick a 14-day pay period, type your punches, get regular and overtime hours per week and a real .xlsx you can send to payroll. |
| `pin3-decimal.png` | Time to decimal converter for payroll | https://hourstally.com/time-to-decimal | 7:45 is 7.75, not 7.45. Convert one time or paste a whole column, with a printable 1–60 minutes chart. |
| `pin5-overtime-and-pay.png` (made and posted 2026-10-15, the day the page shipped: https://in.pinterest.com/pin/1137721924650760481/ — first pin given Pinterest tagged topics; suggested Payroll, Overtime, Time card, Timesheet, Hourly wage, Small business, Bookkeeping, which were accepted not reported) | Time card calculator with overtime and pay for two pay rates | https://hourstally.com/with-overtime-and-pay | Worked two jobs at two rates this week? Tag each shift A or B and overtime is paid on the blended rate, the way federal law counts it. Gross pay for every day, Excel download with formulas. Free, no signup. |
| `pin6-military-time.png` (made and posted 23 Oct, the day the page shipped, from a real night-shift week typed into the card: https://in.pinterest.com/pin/1137721924651453642/ — tagged topics offered: Time card, Timesheet, Military time, 24 hour clock, Night shift, Nursing, Payroll, Shift work, Hourly wage; the live pin checked to link to the page) | Military time card calculator with night shifts and Excel download | https://hourstally.com/military-time | A time card on the 24-hour clock: type 1900 and 0700, no am or pm. Night shifts across midnight count on their own, 2400 ends the day, and the Excel file keeps real times. Conversion chart included. Free, no signup. |

Then one new pin for every page that ships, the day it ships. I make the image.

### ~~3. YouTube Short~~ — done 2026-10-27, on a new **HoursTally** channel. Recorded by the assistant in Chrome from the live home card (1080x1920, 25 s, captions on screen; `D:/tmp/hourstally-pins/short-time-card.mp4`), uploaded and made public by the founder. The description link is text only: YouTube wanted phone verification to make it clickable and the founder's number has hit its limit of two accounts a year; Shorts descriptions do not show clickable links anyway. Expected value small - no more YouTube work planned. The original brief, for the record:

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

- ~~**2026-09-25** — `/how-it-counts` into the sitemap; IndexNow ping the same hour~~ — done 2026-09-28. The new pin waits on the Pinterest account.
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
