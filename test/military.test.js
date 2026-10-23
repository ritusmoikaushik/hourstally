// The military time card. Every rule the page claims is pinned here: 24-hour entry with no am or
// pm, 2400 as the end of a day and only that, night shifts across midnight, the converter, and a
// sheet whose clock times are real Excel times with a formula per line that survives midnight.
const assert = require('assert');
process.env.TZ = 'America/New_York';
const m = require('../site/assets/military.js');
const e = require('../site/assets/app.js');
const x = require('../site/assets/xlsx.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

const mins = raw => m.milParse(raw).minutes;
const err = raw => m.milParse(raw).error;
const day = (date, label, pairs, breakMins) => ({ date, label, segments: pairs.map(([a, b]) => ({ in: a, out: b })), breakMins: breakMins || '' });

console.log('reading a time');
check('four digits: 0700 is 7:00, 1930 is 19:30', () => { assert.strictEqual(mins('0700'), 420); assert.strictEqual(mins('1930'), 1170); });
check('short forms: 7, 07, 700, 07:00, 7.00 are all 0700', () => ['7', '07', '700', '07:00', '7.00'].forEach(s => assert.strictEqual(mins(s), 420, s)));
check('a trailing h or hrs is allowed, and 19h30', () => { assert.strictEqual(mins('0700h'), 420); assert.strictEqual(mins('0700 hrs'), 420); assert.strictEqual(mins('19h30'), 1170); });
check('0, 00 and 0000 are midnight at the start of the day', () => ['0', '00', '0000', '00:00'].forEach(s => assert.strictEqual(mins(s), 0, s)));
check('24 and 2400 are midnight at the end of the day', () => { assert.strictEqual(mins('2400'), 1440); assert.strictEqual(mins('24'), 1440); assert.strictEqual(mins('24:00'), 1440); });
check('nothing after 2400: 2401, 2430 and 2500 are refused', () => ['2401', '2430', '2500', '25'].forEach(s => assert.strictEqual(err(s), 'hour', s)));
check('minutes past 59 are refused', () => { assert.strictEqual(err('1260'), 'min'); assert.strictEqual(err('960'), 'min'); });
check('am or pm is refused, with the 24-hour time it would be', () => {
  assert.deepStrictEqual(m.milParse('7pm'), { error: 'ampm', as: '1900' });
  assert.strictEqual(m.milParse('12am').as, '0000');
  assert.strictEqual(m.milParse('12:30 p.m.').as, '1230');
  assert.strictEqual(m.milParse('7:15 AM').as, '0715');
});
check('not a time', () => { assert.strictEqual(err('abc'), 'bad'); assert.strictEqual(err('7.5'), 'bad'); assert.strictEqual(err('12345'), 'bad'); });
check('an empty box is nothing, not an error', () => { assert.strictEqual(m.milParse(''), null); assert.strictEqual(m.milParse('  '), null); });
check('written back as four digits, 2400 included', () => {
  assert.strictEqual(m.milFmt(0), '0000'); assert.strictEqual(m.milFmt(455), '0735'); assert.strictEqual(m.milFmt(1440), '2400');
});

console.log('one shift');
const one = (a, b, date) => m.milDay(day(date || '', 'Fri', [[a, b]]));
check('0700 to 1530 is 8:30', () => assert.strictEqual(one('0700', '1530').minutes, 510));
check('1900 to 0700 is 12 hours, across midnight, nothing to tap', () => {
  const r = one('1900', '0700'); assert.strictEqual(r.minutes, 720); assert.strictEqual(r.pairs[0].ends, 1);
});
check('1600 to 2400 is 8 hours and ends on its own day', () => {
  const r = one('1600', '2400'); assert.strictEqual(r.minutes, 480); assert.strictEqual(r.pairs[0].ends, 0);
});
check('1600 to 0000 is the same 8 hours, ending on the next day', () => {
  const r = one('1600', '0000'); assert.strictEqual(r.minutes, 480); assert.strictEqual(r.pairs[0].ends, 1);
});
check('0000 to 2400 is a whole day', () => assert.strictEqual(one('0000', '2400').minutes, 1440));
check('2400 cannot start a shift', () => {
  const r = one('2400', '0800'); assert.ok(r.bad); assert.ok(!r.worked); assert.strictEqual(r.why.error, 'in2400');
  assert.match(m.milNote(r), /starts at 0000/);
});
check('the same time in and out is read as 24 hours and flagged', () => {
  const r = one('0700', '0700'); assert.strictEqual(r.minutes, 1440); assert.ok(r.long);
});
check('a 2359 clock-out is counted as typed, with a doubt noted', () => {
  const r = one('1600', '2359'); assert.strictEqual(r.minutes, 479); assert.ok(r.short);
  assert.match(m.milNote(r), /type 2400/);
});
check('am or pm on the card says what to type instead', () => {
  const r = one('7pm', '0700'); assert.ok(r.bad);
  assert.strictEqual(m.milNote(r), 'No am or pm on a military card — 7pm is 1900');
});
check('2430 says the clock starts again at 0000', () => assert.match(m.milNote(one('1700', '2430')), /starts again at 0000/));
check('a missing clock-out is flagged, not counted', () => {
  const r = one('1900', ''); assert.ok(r.missingOut); assert.ok(!r.worked); assert.match(m.milNote(r), /clock-out is missing/);
});

console.log('a night with more than one clock in and out');
check('1900-2300, 2330-0300, 0330-0700 is 11 hours, the last two ending the next day', () => {
  const r = m.milDay(day('', 'Fri', [['1900', '2300'], ['2330', '0300'], ['0330', '0700']]));
  assert.strictEqual(r.minutes, 660);
  assert.deepStrictEqual(r.pairs.map(p => p.ends), [0, 1, 1]);
});
check('a break comes off the day', () => assert.strictEqual(m.milDay(day('', 'Fri', [['1900', '0700']], '30')).minutes, 690));
check('the day a clock-out falls on, with and without a date', () => {
  assert.strictEqual(m.milEndsOn(day('2026-10-30', 'Fri', []), 1), 'Sat 31 Oct');
  assert.strictEqual(m.milEndsOn(day('', 'Sat', []), 1), 'Sun');
  assert.strictEqual(m.milEndsOn(day('', 'Sat', []), 0), '');
});

console.log('the night the clocks go back, New York');
check('2200 on Sat 31 Oct 2026 to 0600 is 9 hours worked', () => {
  const r = one('2200', '0600', '2026-10-31'); assert.strictEqual(r.minutes, 540); assert.strictEqual(r.clocks, 60);
  assert.match(m.milNote(r), /went back/);
});
check('a shift that ends at 2400 that night is untouched', () => assert.strictEqual(one('1600', '2400', '2026-10-31').minutes, 480));
check('0000 to 0800 on Sun 1 Nov is 9 hours', () => assert.strictEqual(one('0000', '0800', '2026-11-01').minutes, 540));
check('the night they go forward, 7 Mar 2026, is 7', () => assert.strictEqual(one('2200', '0600', '2026-03-07').minutes, 420));

console.log('the week');
const nights = (n, rule, rate) => {
  const days = m.milBuildDays('2026-10-04', 'week');
  for (let i = 0; i < n; i++) days[i].segments = [{ in: '1900', out: '0700' }];
  return m.milCompute({ days, rule, rate: rate || '' });
};
check('four 12-hour nights: 48 hours, 8 over 40', () => { const r = nights(4, 'weekly40'); assert.strictEqual(r.totalMinutes, 2880); assert.strictEqual(r.reg, 40); assert.strictEqual(r.ot, 8); });
check('over 8 a day: 4 overtime hours a night', () => assert.strictEqual(nights(4, 'daily8').ot, 16));
check('gross pay: 40 at $20 and 8 at $30', () => assert.strictEqual(nights(4, 'weekly40', '20').pay, 1040));
check('a week built from a date has its dates and day names', () => {
  const d = m.milBuildDays('2026-10-04', 'biweekly'); assert.strictEqual(d.length, 14); assert.strictEqual(d[0].label, 'Sun');
  assert.deepStrictEqual(d[0].segments, [{ in: '', out: '' }]);
});
check('copy to rest of week takes the night to the other empty weekdays', () => {
  const days = m.milBuildDays('2026-10-04', 'week');
  days[1].segments = [{ in: '1900', out: '0700' }];
  e.copyInto(days, 1);
  assert.deepStrictEqual(days.map(d => d.segments[0].in), ['', '1900', '1900', '1900', '1900', '1900', '']);
});

console.log('the converter');
const cv = s => m.milConvert(s);
check('7:45 pm is 1945', () => assert.strictEqual(cv('7:45 pm').mil, '1945'));
check('1945 is 7:45 pm', () => assert.strictEqual(cv('1945').std, '7:45 pm'));
check('the twelve o\'clock hours: 12:15 am is 0015, 12:15 pm is 1215', () => {
  assert.strictEqual(cv('12:15 am').mil, '0015'); assert.strictEqual(cv('12:15pm').mil, '1215');
  assert.strictEqual(cv('0015').std, '12:15 am'); assert.strictEqual(cv('1215').std, '12:15 pm');
});
check('a bare 7:45 is read as 24-hour, and the pm reading is offered', () => {
  const c = cv('7:45'); assert.strictEqual(c.mil, '0745'); assert.deepStrictEqual(c.orPm, { mil: '1945', std: '7:45 pm' });
  assert.strictEqual(cv('0745').orPm, undefined);
});
check('midnight is 0000, and 2400 is the end of the day', () => {
  assert.strictEqual(cv('midnight').mil, '0000'); assert.ok(cv('12am').midnight);
  assert.ok(cv('2400').end); assert.match(cv('2400').std, /end of the day/);
});
check('noon is 1200', () => assert.strictEqual(cv('noon').mil, '1200'));
check('2430 is refused', () => assert.match(cv('2430').error, /stops at 2400/));

console.log('the sheet');
function sheet(opts) {
  const days = m.milBuildDays('2026-10-25', 'week');
  days[0].segments = [{ in: '1900', out: '0700' }];
  days[0].breakMins = '30';
  days[1].segments = [{ in: '1600', out: '2400' }];
  days[2].segments = [{ in: '1900', out: '2300' }, { in: '2330', out: '0300' }];
  days[6].segments = [{ in: '2200', out: '0600' }];   // Sat 31 Oct, the clocks go back
  m._setState(Object.assign({ period: 'week', start: '2026-10-25', rule: 'weekly40', rate: '', employee: 'A. Nurse', days }, opts));
  return m.milXlsxRows();
}
const lineAt = (rows, iso) => rows.findIndex(r => r[0] && r[0].d === iso);
// The line's formula, worked out here from its own cells, the way Excel will.
const excelHours = r => { const C = r[2].v, D = r[3].v, E = r[4] ? r[4].v || 0 : 0, F = r[5] ? r[5].v || 0 : 0; return Math.max(0, (D > C ? D - C : D + 1 - C) + E / 24 - F / 1440); };
check('in and out are real times of day in the 24-hour style', () => {
  const rows = sheet(); const r = rows[lineAt(rows, '2026-10-25')];
  assert.strictEqual(r[2].v, 1140 / 1440); assert.strictEqual(r[3].v, 420 / 1440);
  assert.strictEqual(r[2].s, x.STYLE.clock); assert.strictEqual(r[3].s, x.STYLE.clock);
});
check('2400 is held as a whole day, so it shows as 24:00', () => {
  const rows = sheet(); assert.strictEqual(rows[lineAt(rows, '2026-10-26')][3].v, 1);
});
check('each line\'s hours are a formula on its own times that survives midnight', () => {
  const rows = sheet(); const i = lineAt(rows, '2026-10-25'); const n = i + 1;
  assert.strictEqual(rows[i][6].f, 'MAX(0,IF(D' + n + '>C' + n + ',D' + n + '-C' + n + ',D' + n + '+1-C' + n + ')+E' + n + '/24-F' + n + '/1440)');
  assert.strictEqual(rows[i][7].f, 'G' + n + '*24');
});
check('every formula, worked out from its cells, equals the card', () => {
  const rows = sheet();
  rows.filter(r => r[6] && r[6].f && /^MAX/.test(r[6].f)).forEach(r => assert.ok(Math.abs(excelHours(r) - r[6].v) < 1e-12, r[6].f));
});
check('the break sits on the day\'s first line: 12 hours less 30 minutes', () => {
  const rows = sheet(); const r = rows[lineAt(rows, '2026-10-25')];
  assert.strictEqual(r[5].v, 30); assert.strictEqual(r[7].v, 11.5);
});
check('a day with two pairs is two lines, the date only on the first', () => {
  const rows = sheet(); const i = lineAt(rows, '2026-10-27');
  assert.strictEqual(rows[i + 1][0], ''); assert.strictEqual(rows[i + 1][2].v, 1410 / 1440); assert.strictEqual(rows[i + 1][7].v, 3.5);
});
check('the clock change is its own cell, counted in the formula', () => {
  const rows = sheet(); const r = rows[lineAt(rows, '2026-10-31')];
  assert.strictEqual(r[4].v, 1); assert.strictEqual(r[7].v, 9);
  assert.ok(rows.some(row => typeof row[0] === 'string' && /^Clock change: 1 where/.test(row[0])));
});
check('an empty day is one line with its date and nothing else', () => {
  const rows = sheet(); const r = rows[lineAt(rows, '2026-10-29')]; assert.strictEqual(r.length, 2);
});
check('the total is a SUM over every line and equals the card', () => {
  const rows = sheet(); const head = rows.findIndex(r => r[0] && r[0].v === 'Date');
  const total = rows.find(r => r[0] && r[0].v === 'Total hours');
  const last = rows.findIndex(r => r.length === 0 && rows.indexOf(r) > head);
  assert.strictEqual(total[7].f, 'SUM(H' + (head + 2) + ':H' + last + ')');
  assert.strictEqual(total[7].v, 11.5 + 8 + 4 + 3.5 + 9);
});
check('a rate gives a pay formula off the rate cell', () => {
  const rows = sheet({ rate: '20' });
  const pay = rows.find(r => r[0] && r[0].v === 'Gross pay');
  assert.ok(/^H\d+\*H\d+\+H\d+\*H\d+\*1\.5$/.test(pay[7].f)); assert.strictEqual(pay[7].v, 36 * 20);
});
check('file name carries the start date', () => { sheet(); assert.strictEqual(m.milXlsxName(), 'military-timecard-2026-10-25.xlsx'); });
check('builds a workbook whose styles carry the 24-hour time format', () => {
  const bytes = x.buildXlsx(sheet(), m.MIL_XLSX_WIDTHS, 'Time card');
  const text = Buffer.from(bytes).toString('latin1');
  assert.ok(text.includes('formatCode="[hh]:mm"')); assert.ok(text.includes('<cellXfs count="11">'));
  assert.ok(text.includes('<f>MAX(0,IF(D'));
});

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
