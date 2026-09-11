const assert = require('assert');
const e = require('../site/assets/app.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

console.log('parseTime');
check('bare hour', () => assert.strictEqual(e.parseTime('9'), 540));
check('colon', () => assert.strictEqual(e.parseTime('9:15'), 555));
check('am', () => assert.strictEqual(e.parseTime('9:15am'), 555));
check('pm', () => assert.strictEqual(e.parseTime('5:30pm'), 1050));
check('12am is midnight', () => assert.strictEqual(e.parseTime('12:00am'), 0));
check('12pm is noon', () => assert.strictEqual(e.parseTime('12:00pm'), 720));
check('military 4 digit', () => assert.strictEqual(e.parseTime('1345'), 825));
check('3 digit', () => assert.strictEqual(e.parseTime('915'), 555));
check('spaces and dots', () => assert.strictEqual(e.parseTime(' 5.30 p.m. '), 1050));
check('short suffix a', () => assert.strictEqual(e.parseTime('9a'), 540));
check('short suffix p', () => assert.strictEqual(e.parseTime('5p'), 1020));
check('24h', () => assert.strictEqual(e.parseTime('17:30'), 1050));
check('junk is null', () => assert.strictEqual(e.parseTime('lunch'), null));
check('bad minutes null', () => assert.strictEqual(e.parseTime('9:75'), null));
check('empty null', () => assert.strictEqual(e.parseTime(''), null));

console.log('segments');
check('normal shift', () => assert.strictEqual(e.segmentMinutes('9:00am', '5:30pm'), 510));
check('overnight shift', () => assert.strictEqual(e.segmentMinutes('10:00pm', '6:00am'), 480));
check('bare 8 to 4 is a day shift, not twenty hours', () => assert.strictEqual(e.segmentMinutes('8', '4'), 480));
check('bare 9 to 5:30 is eight and a half', () => assert.strictEqual(e.segmentMinutes('9', '5:30'), 510));
check('11pm to bare 4 is five hours', () => assert.strictEqual(e.segmentMinutes('11pm', '4'), 300));
check('1pm to bare 5 is four hours', () => assert.strictEqual(e.segmentMinutes('1pm', '5'), 240));
check('bare 8 to bare 12 is four hours', () => assert.strictEqual(e.segmentMinutes('8', '12'), 240));
check('explicit 8am to 4am stays overnight', () => assert.strictEqual(e.segmentMinutes('8am', '4am'), 1200));
check('24h 08:00 to 16:00', () => assert.strictEqual(e.segmentMinutes('08:00', '16:00'), 480));
check('24h 22:00 to 04:00 wraps', () => assert.strictEqual(e.segmentMinutes('22:00', '04:00'), 360));
check('zero-padded 08:00 to 04:00 is a deliberate overnight', () => assert.strictEqual(e.segmentMinutes('08:00', '04:00'), 1200));
check('0800 to 0400 likewise', () => assert.strictEqual(e.segmentMinutes('0800', '0400'), 1200));

console.log('day totals');
const day = (segs, brk) => ({ segments: segs, breakMins: brk });
check('two punch pairs add up', () => {
  const r = e.dayMinutes(day([{ in: '8', out: '12' }, { in: '1pm', out: '5pm' }], ''));
  assert.strictEqual(r.minutes, 480);
});
check('three pairs, the case nobody else handles', () => {
  const r = e.dayMinutes(day([
    { in: '7:00am', out: '11:00am' },
    { in: '11:30am', out: '2:00pm' },
    { in: '2:30pm', out: '6:00pm' }
  ], ''));
  assert.strictEqual(r.minutes, 600);
});
check('unpaid break subtracts', () => {
  const r = e.dayMinutes(day([{ in: '9am', out: '5pm' }], '30'));
  assert.strictEqual(r.minutes, 450);
});
check('break cannot go negative', () => {
  const r = e.dayMinutes(day([{ in: '9am', out: '9:10am' }], '60'));
  assert.strictEqual(r.minutes, 0);
});
check('bad input flagged, good pair still counted', () => {
  const r = e.dayMinutes(day([{ in: '9am', out: '5pm' }, { in: 'zz', out: 'yy' }], ''));
  assert.strictEqual(r.bad, true);
  assert.strictEqual(r.minutes, 480);
});
check('blank day is not worked', () => {
  assert.strictEqual(e.dayMinutes(day([{ in: '', out: '' }], '')).worked, false);
});

console.log('overtime');
const mkState = (hoursPerDay, rule, rate) => ({
  rule, rate: rate || '',
  days: hoursPerDay.map(h => ({
    date: '', label: '',
    segments: h ? [{ in: '0:00', out: (h === 24 ? '0:00' : String(h) + ':00') }] : [{ in: '', out: '' }],
    breakMins: ''
  }))
});

check('weekly40 splits at 40', () => {
  const r = e.compute(mkState([9, 9, 9, 9, 9, 0, 0], 'weekly40'));
  assert.strictEqual(e.fmtDec(r.reg), '40.00');
  assert.strictEqual(e.fmtDec(r.ot), '5.00');
});
check('daily8 pays OT even under 40 total', () => {
  const r = e.compute(mkState([10, 6, 0, 0, 0, 0, 0], 'daily8'));
  assert.strictEqual(e.fmtDec(r.ot), '2.00');
  assert.strictEqual(e.fmtDec(r.reg), '14.00');
});
check('none rule gives no OT', () => {
  const r = e.compute(mkState([12, 12, 12, 0, 0, 0, 0], 'none'));
  assert.strictEqual(e.fmtDec(r.ot), '0.00');
  assert.strictEqual(e.fmtDec(r.reg), '36.00');
});
check('california double time past 12', () => {
  const r = e.compute(mkState([14, 0, 0, 0, 0, 0, 0], 'california'));
  assert.strictEqual(e.fmtDec(r.reg), '8.00');
  assert.strictEqual(e.fmtDec(r.ot), '4.00');
  assert.strictEqual(e.fmtDec(r.dt), '2.00');
});
check('biweekly counts each week separately', () => {
  const s = mkState([9, 9, 9, 9, 9, 0, 0], 'weekly40');
  s.days = s.days.concat(s.days.map(d => JSON.parse(JSON.stringify(d))));
  const r = e.compute(s);
  assert.strictEqual(e.fmtDec(r.reg), '80.00');
  assert.strictEqual(e.fmtDec(r.ot), '10.00');
});
check('gross pay uses 1.5x and 2x', () => {
  const r = e.compute(mkState([14, 0, 0, 0, 0, 0, 0], 'california', '20'));
  assert.strictEqual(Math.round(r.pay), 8 * 20 + 4 * 30 + 2 * 40);
});

console.log('periods');
check('monthly from 1 Sep is 30 days', () => assert.strictEqual(e.periodLength('2026-09-01', 'monthly'), 30));
check('monthly from 1 Oct is 31 days', () => assert.strictEqual(e.periodLength('2026-10-01', 'monthly'), 31));
check('monthly from 1 Feb 2028 is 29 days', () => assert.strictEqual(e.periodLength('2028-02-01', 'monthly'), 29));
check('semi-monthly from the 1st is 15 days', () => assert.strictEqual(e.periodLength('2026-09-01', 'semimonthly'), 15));
check('semi-monthly from the 16th runs to month end', () => assert.strictEqual(e.periodLength('2026-09-16', 'semimonthly'), 15));
check('semi-monthly from 16 Oct is 16 days', () => assert.strictEqual(e.periodLength('2026-10-16', 'semimonthly'), 16));
check('no start date falls back to nominal length', () => assert.strictEqual(e.periodLength('', 'monthly'), 31));
check('buildDays labels weekdays from the date', () => {
  const d = e.buildDays('2026-09-14', 'week');
  assert.strictEqual(d[0].label, 'Mon'); assert.strictEqual(d[6].label, 'Sun'); assert.strictEqual(d[6].date, '2026-09-20');
});

console.log('california seventh day');
check('seven straight days: 7th day is all OT, over 8 is DT', () => {
  const r = e.compute(mkState([8, 8, 8, 8, 8, 8, 10], 'california'));
  assert.strictEqual(e.fmtDec(r.reg), '40.00');
  assert.strictEqual(e.fmtDec(r.ot), '16.00');
  assert.strictEqual(e.fmtDec(r.dt), '2.00');
});
check('six days worked: no seventh-day rule', () => {
  const r = e.compute(mkState([8, 8, 8, 8, 8, 8, 0], 'california'));
  assert.strictEqual(e.fmtDec(r.reg), '40.00');
  assert.strictEqual(e.fmtDec(r.ot), '8.00');
  assert.strictEqual(e.fmtDec(r.dt), '0.00');
});

console.log('formatting');
check('h:mm pads', () => assert.strictEqual(e.fmtHM(485), '8:05'));
check('decimal rounds', () => assert.strictEqual(e.fmtDec(485 / 60), '8.08'));

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
