---
title: "The Night the Clocks Go Back: The Daylight-Saving Bug in Time Card Maths"
published: false  # draft 23 Oct 2026; the founder posts it in the week of 26 Oct, before US clocks go back on Sun 1 Nov
description: A 10pm to 6am shift on the night the clocks go back is nine hours, not eight. Here's the five-line fix that keeps no table of dates, the one case it still can't get right, and how to test it in four time zones from one Node script.
tags: javascript, webdev, testing, tutorial
cover_image:
canonical_url:
---

I run a small free website, a time card calculator. You type in when you clocked in and out each day, it adds up the week, splits out the overtime, and gives you a spreadsheet to hand over. Quite a few of the people it's built for work nights: nurses, security guards, the late shift at a warehouse.

On Sunday 1 November, at 2am, clocks in most of the US go back an hour. If you work 10pm to 6am that night, you'll be on shift for nine hours. Your punches will say 10:00 PM and 6:00 AM, which looks exactly like every other night of the year.

My calculator said eight.

This is the bug, the fix (five lines, and no table of dates anywhere), and the one case it still can't get right.

## The bug is a subtraction

Most time card maths looks roughly like this:

```js
// minutes after midnight, as the clock read them
function shiftMinutes(inMin, outMin) {
  let d = outMin - inMin;
  if (d <= 0) d += 1440;   // the shift ran past midnight
  return d;
}

shiftMinutes(22 * 60, 6 * 60); // 480
```

There's nothing wrong with it on 363 nights a year. On the other two, it subtracts what the clock *said*, and the clock lied. When US clocks go back, 1:59am is followed by 1:00am again, so the hour from 1 to 2 happens twice, and anyone on shift through it works both of them. In March it goes the other way. 1:59 is followed by 3:00, and the same shift is seven hours.

An hourly worker is paid for the hours they worked. That night they worked nine. If they were already near forty for the week, the missing hour is an overtime hour too, so it's the expensive kind.

I recently went through about twenty free time card calculators. None of them adjusted for this.

## The tempting fix is a table

My first thought was a list of changeover dates. Second Sunday in March, first Sunday in November, done.

It isn't done, though. That's only the US rule, and only since 2007, when the Energy Policy Act of 2005 moved the dates. Most of Arizona doesn't change its clocks at all. The UK went back on 25 October, a week before the US. Australia goes back in April, and only some of its states bother. A table means I own every one of those rules and every future change to them. I'm one person with a calculator site. I'd get one wrong eventually, and I'd find out from someone's payslip.

The browser already knows all of this. It has to, because it shows you the right local time all year round. So the real question was how to get the browser to tell me how long a shift actually lasted.

## Let Date do the arithmetic

A JavaScript `Date` is an instant: milliseconds since 1970, in UTC. When you build one from local parts (year, month, day, hours, minutes) the browser turns your wall-clock reading into that instant using its own time zone rules. Subtract two instants and you get elapsed time. Not clock time. Elapsed time.

The second half of the trick is that the `Date` constructor doesn't mind minutes past 59. It rolls them over. `new Date(2026, 9, 31, 0, 1800)` is midnight on 31 October plus 1,800 minutes, which is 6am on 1 November. So I can describe any shift as "minutes after midnight on the day it started", including one that runs into the next morning, and let the constructor sort out the dates.

That's the whole fix, simplified a little:

```js
// from and to: minutes after midnight on dateISO, as the clock read them.
// Returns the minutes a clock change added (+60) or took away (-60).
function clockChange(dateISO, from, to) {
  const [y, mo, d] = dateISO.split('-').map(Number);
  const real = Math.round(
    (new Date(y, mo - 1, d, 0, to) - new Date(y, mo - 1, d, 0, from)) / 60000);
  return real - (to - from);
}

clockChange('2026-10-31', 22 * 60, 30 * 60); // 60, in New York
```

(The real one also returns 0 when the card has no date on it. Without a date there's nothing to know.)

The card adds that to the day's total and writes a note on the line: "Clocks went back during this shift — the extra hour is counted." Honestly, the note matters as much as the number. A payroll clerk who sees nine hours next to punches of 10pm and 6am will assume the calculator is broken unless it says why.

Here's the same 10pm to 6am shift, started on the Saturday night before each change:

| Time zone | Shift starts | Clock change |
|---|---|---|
| America/New_York | Sat 31 Oct 2026 | +60 |
| America/Phoenix | Sat 31 Oct 2026 | 0 |
| Europe/London | Sat 24 Oct 2026 | +60 |
| Australia/Sydney | Sat 4 Apr 2026 | +60 |
| America/New_York | Sat 7 Mar 2026 | −60 |

Phoenix gets zero because Arizona doesn't change its clocks. I didn't have to know that. The browser did.

## Shifts with more than one punch

The calculator lets you clock in and out as many times as you like in a day. A night might be 8pm to 11pm, 11:30pm to 1am, then 1:30am to 5am after a break. Only the last pair crosses 2am, and only that pair should get the extra hour.

So every pair goes on one running timeline for the night, each read forward from where the one before it ended:

```js
const from = pos === null ? inMin : pos + (inMin - pos % 1440 + 1440) % 1440;
pos = from + minutes;
clocks += clockChange(day.date, from, pos);
```

The 1:30am clock-in comes after a pair that ended at 1am, so it lands at minute 1530 of the timeline rather than minute 90, and `new Date(..., 0, 1530)` points at the right morning. Get this wrong and the hour goes to the wrong pair, or to nobody. It's the sort of thing you only notice when you write the test.

## The case it can't get right

There's one I can't fix, and I'd rather say so than pretend.

On the night clocks go back, 1:30am happens twice. If someone clocks in at 1:30, which one was it? A paper time card doesn't say. Neither does a time typed into a box. JavaScript has to pick, and MDN describes the rule (it's the same as Temporal's `"compatible"` setting): if a local time happens twice, the earlier one is chosen, and if it never happened, like 2:30 on the night clocks go forward, it moves forward by the size of the gap, so 2:30 becomes 3:30.

So a shift typed as 1am to 3am on 1 November comes out as three hours. That's right if they clocked in before the change and an hour too much if they clocked in after it.

Real time clocks avoid this by recording the instant, or the UTC offset, at the moment of the punch. If you're building anything that records punches, do that. Store the instant, and keep the wall-clock text for display. Rebuilding instants from wall-clock times, which is what I'm doing, is the fallback for when wall-clock times are all you've got. For one hour a year, it's a guess.

## It's the device's time zone, not the workplace's

The other limit is quieter. The browser uses its own time zone. If a payroll clerk in Phoenix checks a card for someone who works in Denver, it applies Arizona's rules and adds nothing.

I thought about a time zone dropdown and left it out, for now anyway. The site is built for people checking their own hours, on their own phone, where they work. A dropdown would be one more thing for everyone else to get wrong. Instead the card only adjusts when it has a date, and it always says on the line when it has. If the note is there and shouldn't be, a person can see it.

## Testing it without moving to Arizona

The tests run in plain Node, with no dependencies. Node's `Date` follows the `TZ` environment variable, and since Node 13 on Linux and macOS (16.2 on Windows) you can change `process.env.TZ` partway through a script and the next `Date` picks it up. So one test file visits four time zones in turn:

```js
process.env.TZ = 'America/New_York';
check('clocks go back on 1 Nov 2026: 10pm to 6am is 9 hours', () => {
  const r = e.dayMinutes(nightShift('2026-10-31'));
  assert.strictEqual(r.minutes, 540); assert.strictEqual(r.clocks, 60);
});

process.env.TZ = 'America/Phoenix';
check('1 Nov night shift stays 8 hours', () =>
  assert.strictEqual(e.dayMinutes(nightShift('2026-10-31')).minutes, 480));
```

Two of the tests I'd suggest to anyone doing this. The first is a shift on the change date that finishes before 2am, to prove it gets nothing. The second is the weekly total: four ordinary nights plus the change night is 41 hours, and the 41st is overtime. That's the one that costs real money if it's missing.

One thing that caught me out while writing this up. On Windows, running `TZ=America/New_York node script.js` from Git Bash didn't take for me, and the dates came out in my own zone, while setting `process.env.TZ` inside the script worked fine. If your daylight-saving tests pass suspiciously easily, print `new Date().toString()` once and check which zone you're really in.

## And the spreadsheet

The main thing the calculator produces is an Excel file, and that's where a payroll person actually checks the hours. A number that's quietly an hour bigger than the punches will get "corrected" by somebody. So the sheet says it too. The main card writes "(clocks went back 1h)" next to the punches. The newer 24-hour card has a Clock change column that feeds each line's hours formula, so if someone edits a time in Excel, the hour is still counted.

If you've got a time card, a rota tool or anything that bills by the hour and subtracts clock times, try it with a 10pm to 6am shift starting on 31 October. It takes a minute, and there are still a few days before it matters.

The calculator is at [hourstally.com](https://hourstally.com). It's free and runs entirely in the browser, and `clockChange` is in `assets/app.js` if you'd like to read the real thing. If you've hit a daylight-saving bug of your own, I'd love to hear it. They're always a bit funny once they're fixed.
