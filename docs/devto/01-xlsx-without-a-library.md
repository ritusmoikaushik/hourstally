---
title: "A Real .xlsx With Working Formulas in Plain JavaScript, No Library"
published: false
description: An .xlsx is a zip of six XML files. Here's the 177-line writer behind a free time card calculator, the [h]:mm trap, Excel's 1900 date quirk, and the ##### bug a real Excel test caught.
tags: javascript, excel, webdev, tutorial
cover_image:
canonical_url:
---

For its first few days my time card calculator offered a CSV download. CSV is fine for data. It's bad at being a timesheet, because Excel has to guess what every cell is. A total like 41:30 might stay text, or turn into a time, and if anyone then formats that column the usual way it reads 17:30. Nobody wants to explain to their manager why their timesheet says seventeen and a half hours.

So I wanted a proper .xlsx. Real dates, real time cells, and a total that is an actual `=SUM()` formula, so if you fix a typo in Tuesday's hours the week total moves with it.

The obvious answer is a library. I didn't take it. The whole site ships about 80 KB of JavaScript across five files, and I wasn't keen on a dependency several times that size for one button. What I ended up with is 177 lines and 9 KB, unminified. This is how it works, and the one bug that got through anyway.

## An .xlsx is a zip you can write by hand

Rename any .xlsx to .zip and open it. Strip out everything Excel doesn't strictly need and you're left with six small files:

```
[Content_Types].xml          what each part is
_rels/.rels                  "the workbook is over there"
xl/workbook.xml              the list of sheets
xl/_rels/workbook.xml.rels   "sheet 1 and the styles are over there"
xl/styles.xml                number formats, bold
xl/worksheets/sheet1.xml     the actual cells
```

Five of those are boilerplate you write once and never touch. The interesting one is the sheet.

The zip part sounds like the scary bit. It isn't, because Excel happily opens a zip whose entries are *stored* (not compressed). No deflate, no compression library. You need a CRC-32 per file and two kinds of header:

```js
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
```

Then, for each file: a local header (signature `0x04034b50`, the CRC, the size twice because compressed and uncompressed are the same, the name), the bytes, and later a central directory entry pointing back at it. One end-of-directory record closes the lot. All little-endian, which is where most of the fiddly bits live:

```js
const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF];
const u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
```

One small trick I'd recommend. Every entry gets the same fixed timestamp, 1 January 1980, which is the zero point of the old DOS date format. That means the same time card always produces a byte-identical file. You'd be surprised how much easier that makes testing.

## Cells: strings, numbers, and formulas that already know their answer

A row in the sheet looks like this:

```xml
<row r="9">
  <c r="A9" s="1" t="inlineStr"><is><t>Total hours</t></is></c>
  <c r="E9" s="5"><f>SUM(E2:E8)</f><v>1.7291666666666667</v></c>
</row>
```

Two things worth noticing.

Strings are written inline (`t="inlineStr"`). The "proper" way is a shared strings table, where every distinct string is stored once and cells point at it by index. For a sheet with forty cells, honestly, that's ceremony. Inline strings are part of the spec and Excel reads them fine.

The formula cell carries both the formula *and* its result. The `<f>` is what Excel keeps and recalculates. The `<v>` is the cached value, and I compute it myself in JavaScript before writing the file. Excel shows it straight away, and so does anything that previews the file without calculating. Leave `<v>` out and those previews can show an empty total, which is exactly the thing people look at first.

The cell objects I build are tiny:

```js
{ v: r.totalMinutes / 1440, s: STYLE.boldHm, f: 'SUM(E2:E8)' }
```

`v` is the cached value, `s` a style index, `f` the formula without its `=`.

## Time is a fraction of a day, and h:mm lies

Excel stores a duration as a fraction of one day. Eight hours is `0.3333…`, which is why the value above is `minutes / 1440`. So far so normal.

The catch is the number format. The everyday `h:mm` format *wraps at 24 hours*, like a clock. Put 41 hours 30 minutes in a cell formatted `h:mm` and Excel shows `17:30`. Nothing is wrong with the number. The display is just a clock face, and a clock doesn't know about Thursday.

The fix is a custom format with square brackets:

```xml
<numFmt numFmtId="164" formatCode="[h]:mm"/>
```

`[h]` means "total hours, don't wrap". It's one character pair, and it's the difference between a time card and a broken one. Custom formats start at ID 164 because 0 to 163 are reserved for Excel's built-ins. I also keep a plain `0.00` decimal column next to it, because payroll people want 41.50, not 41:30.

## Dates start in 1899, because of a bug from the 80s

An Excel date is a whole number: days since an epoch. You'd expect the epoch to be 1 January 1900. In practice the maths only works if you count from **30 December 1899**:

```js
function dateSerial(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569;
}
```

25569 is the number of days from 1899-12-30 to the Unix epoch. The odd start date is there because Lotus 1-2-3 treated 1900 as a leap year (it wasn't), Excel copied that for compatibility, and the cheapest way to make modern dates come out right is to shift the origin back a day. Dates from March 1900 onwards are correct. Dates in January and February 1900 are off by one, and I'm fairly sure no one is filling in a time card for those.

I have two tests pinning it: 2026-09-07 is 46272, and 1900-03-01 is 61. If either ever changes, something upstream broke.

## The ##### bug

Here's the part I didn't see coming.

Everything above passed my tests. The zip was valid, every CRC checked out, every formula was where it should be. Then the first real test on a real PC, in real Excel, opened the two-week sheet and the pay period dates read `#####`.

That isn't an error. It's Excel saying "this number doesn't fit in this column". I'd made column B six characters wide, because on most rows it only holds the weekday: "Mon", "Tue". On the summary rows the same column holds a date like "28 Sep 2026", and six characters is nowhere near enough. All three of my sheets had the same mistake. None of my tests knew how wide a date is, so none of them caught it.

The fix was boring: column B became 12 wide. The more useful change was a new test that walks every cell, and if it's a date, checks that its column is at least 11 characters wide. Whatever Excel will refuse to display, I'd rather fail on before anyone sees it.

The lesson I took from it, for what it's worth: a file format test tells you the file is valid, not that a person can read it. Open the thing in the real program, on a real machine, before calling it done.

## Testing a zip without a zip library

The tests run in plain Node with no dependencies, so I couldn't just `require` an unzip package either. Instead the test file has a small zip *reader*, about twenty lines: find the end-of-directory record, walk the central directory, jump to each local header, and check every entry's CRC against the bytes.

And CRC-32 has a published check value, which is handy: the CRC of the ASCII string `123456789` must be `0xCBF43926`. If your table is wrong, that test tells you in a millisecond.

## When I wouldn't do this

If you need charts, several sheets with thousands of rows, or reading .xlsx files back in, use a library. Shared strings and compression start to matter at that size, and you'd be rebuilding something well-tested for no good reason.

But for "give the user a tidy spreadsheet of what they just typed", a hand-written writer is small and fast, and you understand every byte of it. Mine downloads with the week's punches, regular and overtime hours, and a total that is a live `=SUM()`. It's the Excel button on [hourstally.com](https://hourstally.com), a free time card calculator that runs entirely in the browser, and the code is just `assets/xlsx.js` if you want to read the whole thing.

If you've written .xlsx by hand and hit a different trap than these, I'd genuinely like to hear about it.
