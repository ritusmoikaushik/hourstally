// Clock changes. The card counts in the visitor's own time zone, so each block
// sets one before it runs; Node reads a change to TZ on the next date it makes.
const assert = require('assert');
const e = require('../site/assets/app.js');
const l = require('../site/assets/lunch.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

const seg = (inT, outT, inM, outM) => ({ in: inT, out: outT, inM, outM, inL: true, outL: true });
const card = (date, segs, breakMins) => ({ date, label: '', segments: segs, breakMins: breakMins || '' });
const nightShift = date => card(date, [seg('10:00', '6:00', 'pm', 'am')]);

console.log('New York');
process.env.TZ = 'America/New_York';
check('clocks go back on 1 Nov 2026: 10pm to 6am is 9 hours', () => {
  const r = e.dayMinutes(nightShift('2026-10-31'));
  assert.strictEqual(r.minutes, 540); assert.strictEqual(r.clocks, 60);
});
check('clocks go forward on 8 Mar 2026: 10pm to 6am is 7 hours', () => {
  const r = e.dayMinutes(nightShift('2026-03-07'));
  assert.strictEqual(r.minutes, 420); assert.strictEqual(r.clocks, -60);
});
check('the same shift a week earlier is 8 hours', () => assert.strictEqual(e.dayMinutes(nightShift('2026-10-24')).minutes, 480));
check('a shift on the change day that ends before 2am is untouched', () =>
  assert.strictEqual(e.dayMinutes(card('2026-10-31', [seg('6:00', '11:30', 'pm', 'pm')])).minutes, 330));
check('a shift that starts after the change is untouched', () =>
  assert.strictEqual(e.dayMinutes(card('2026-11-01', [seg('7:00', '3:00', 'am', 'pm')])).minutes, 480));
check('no date on the card, no adjustment', () => {
  const r = e.dayMinutes(nightShift(''));
  assert.strictEqual(r.minutes, 480); assert.strictEqual(r.clocks, 0);
});
check('only the pair that crosses 2am gets the hour', () => {
  const r = e.dayMinutes(card('2026-10-31', [seg('8:00', '11:00', 'pm', 'pm'), seg('11:30', '1:00', 'pm', 'am'), seg('1:30', '5:00', 'am', 'am')]));
  // 3h + 1.5h + 3.5h on the wall, plus the hour the clocks gave back during the last pair
  assert.strictEqual(r.minutes, 540); assert.strictEqual(r.clocks, 60);
});
check('the break still comes off after the hour is added', () =>
  assert.strictEqual(e.dayMinutes(card('2026-10-31', [seg('10:00', '6:00', 'pm', 'am')], '30')).minutes, 510));
check('weekly overtime sees the real hours', () => {
  const days = ['2026-10-26', '2026-10-27', '2026-10-28', '2026-10-29', '2026-10-30', '2026-10-31', '2026-11-01']
    .map((d, i) => i < 5 ? nightShift(d) : card(d, [seg('', '', 'am', 'pm')]));
  days[4] = nightShift('2026-10-31');
  const r = e.compute({ days, rule: 'weekly40', rate: '' });
  assert.strictEqual(r.totalMinutes, 41 * 60); assert.strictEqual(r.reg, 40); assert.strictEqual(r.ot, 1);
});
check('the screen says why', () => assert.match(e.clockText(60), /went back/));
check('the Excel row says why', () => {
  e._setState({ days: [nightShift('2026-10-31')], rule: 'weekly40', rate: '', employee: '' });
  const row = e.toXlsxRows().find(r => r[0] && r[0].d === '2026-10-31');
  assert.match(row[2], /clocks went back 1h/);
  assert.strictEqual(row[5].v, 9);
});

console.log('with lunch, New York');
const lday = (date, extra) => Object.assign({ date, in: '10:00', out: '6:00', inM: 'pm', outM: 'am', inL: true, outL: true, lunch: '', through: false }, extra || {});
check('9 hour shift, 30 minutes lunch, 8.5 paid', () => {
  const r = l.lunchDay(lday('2026-10-31'), { minutes: '30', when: 'over6' });
  assert.strictEqual(r.shift, 540); assert.strictEqual(r.minutes, 510); assert.strictEqual(r.clocks, 60);
});
check('the lunch rule reads the real shift: 6:30 on the wall is 5:30 worked', () => {
  const r = l.lunchDay(lday('2026-03-07', { in: '11:00', out: '5:30', inM: 'pm', outM: 'am' }), { minutes: '30', when: 'over6' });
  assert.strictEqual(r.shift, 330); assert.strictEqual(r.lunch, 0);
});

console.log('Phoenix — Arizona does not change its clocks');
process.env.TZ = 'America/Phoenix';
check('1 Nov night shift stays 8 hours', () => assert.strictEqual(e.dayMinutes(nightShift('2026-10-31')).minutes, 480));

console.log('London');
process.env.TZ = 'Europe/London';
check('clocks go back on 25 Oct 2026', () => assert.strictEqual(e.dayMinutes(nightShift('2026-10-24')).minutes, 540));
check('the US date means nothing here', () => assert.strictEqual(e.dayMinutes(nightShift('2026-10-31')).minutes, 480));

console.log('Sydney');
process.env.TZ = 'Australia/Sydney';
check('clocks go back on 5 Apr 2026', () => assert.strictEqual(e.dayMinutes(nightShift('2026-04-04')).minutes, 540));
check('and forward on 4 Oct 2026', () => assert.strictEqual(e.dayMinutes(nightShift('2026-10-03')).minutes, 420));

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
