const assert = require('assert');
const l = require('../site/assets/lunch.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

const cfg30over6 = { minutes: '30', when: 'over6' };
const day = (inT, outT, extra) => Object.assign({ in: inT, out: outT, inM: 'am', outM: 'pm', lunch: '', through: false }, extra || {});

console.log('the rule');
check('30 off a shift over 6 hours', () => assert.deepStrictEqual(l.lunchMinutes(510, cfg30over6, day('8', '4:30')), { minutes: 30, auto: true }));
check('nothing off a 6 hour shift on the dot', () => assert.strictEqual(l.lunchMinutes(360, cfg30over6, day('8', '2')).minutes, 0));
check('one minute over 6 and it comes off', () => assert.strictEqual(l.lunchMinutes(361, cfg30over6, day('8', '2:01')).minutes, 30));
check('over 5 threshold', () => assert.strictEqual(l.lunchMinutes(301, { minutes: '30', when: 'over5' }, day('8', '1:01')).minutes, 30));
check('over 8 threshold leaves an 8 hour day alone', () => assert.strictEqual(l.lunchMinutes(480, { minutes: '30', when: 'over8' }, day('8', '4')).minutes, 0));
check('every day deducts a 2 hour shift', () => assert.strictEqual(l.lunchMinutes(120, { minutes: '30', when: 'always' }, day('8', '10')).minutes, 30));
check('lunch length is whatever was set', () => assert.strictEqual(l.lunchMinutes(600, { minutes: '45', when: 'over6' }, day('8', '6')).minutes, 45));
check('a paid lunch is 0 minutes', () => assert.strictEqual(l.lunchMinutes(600, { minutes: '0', when: 'over6' }, day('8', '6')).minutes, 0));
check('unknown rule falls back to over 6', () => assert.strictEqual(l.lunchMinutes(361, { minutes: '30', when: 'nonsense' }, day('8', '2')).minutes, 30));

console.log('the day wins over the rule');
check('typed minutes replace the rule', () => assert.deepStrictEqual(l.lunchMinutes(540, cfg30over6, day('8', '5', { lunch: '60' })), { minutes: 60, auto: false }));
check('typed 0 means no lunch that day', () => assert.strictEqual(l.lunchMinutes(540, cfg30over6, day('8', '5', { lunch: '0' })).minutes, 0));
check('worked through deducts nothing', () => assert.deepStrictEqual(l.lunchMinutes(540, cfg30over6, day('8', '5', { through: true })), { minutes: 0, auto: false }));
check('worked through beats a typed figure', () => assert.strictEqual(l.lunchMinutes(540, cfg30over6, day('8', '5', { lunch: '60', through: true })).minutes, 0));

console.log('a day');
check('8 to 4:30 is 8 hours after lunch', () => {
  const r = l.lunchDay(day('8', '4:30'), cfg30over6);
  assert.strictEqual(r.shift, 510); assert.strictEqual(r.lunch, 30); assert.strictEqual(r.minutes, 480); assert.ok(r.worked);
});
check('night shift over midnight', () => {
  const r = l.lunchDay(day('10', '6:30', { inM: 'pm', outM: 'am' }), cfg30over6);
  assert.strictEqual(r.shift, 510); assert.strictEqual(r.minutes, 480);
});
check('lunch never takes a day below zero', () => assert.strictEqual(l.lunchDay(day('8', '8:10', { lunch: '30', outM: 'am' }), cfg30over6).minutes, 0));
check('a missing clock-out is flagged', () => { const r = l.lunchDay(day('8', ''), cfg30over6); assert.ok(r.missingOut); assert.ok(!r.worked); });
check('a missing clock-in is flagged', () => { const r = l.lunchDay(day('', '5'), cfg30over6); assert.ok(r.missingIn); assert.ok(!r.worked); });
check('gibberish is bad', () => assert.ok(l.lunchDay(day('lunch', '5'), cfg30over6).bad));
check('an empty day is not worked', () => assert.ok(!l.lunchDay(day('', ''), cfg30over6).worked));

console.log('the period');
function week(opts) {
  const days = l.lunchBuildDays('2026-09-14', 'week');
  return Object.assign({ period: 'week', start: '2026-09-14', rule: 'weekly40', rate: '', employee: '',
                         lunchMinutes: '30', lunchWhen: 'over6', days }, opts || {});
}
check('seven days from a Monday', () => { const s = week(); assert.strictEqual(s.days.length, 7); assert.strictEqual(s.days[0].label, 'Mon'); });
check('five 8:30 shifts are 40 hours, 2h 30m of lunch on 5 days', () => {
  const s = week();
  for (let i = 0; i < 5; i++) { s.days[i].in = '8'; s.days[i].out = '4:30'; }
  const r = l.lunchCompute(s);
  assert.strictEqual(r.totalMinutes, 2400); assert.strictEqual(r.shiftMinutes, 2550);
  assert.strictEqual(r.lunchTotal, 150); assert.strictEqual(r.lunchDays, 5); assert.strictEqual(r.throughDays, 0);
  assert.strictEqual(r.reg, 40); assert.strictEqual(r.ot, 0);
});
check('one worked-through day pushes the week into overtime', () => {
  const s = week();
  for (let i = 0; i < 5; i++) { s.days[i].in = '8'; s.days[i].out = '4:30'; }
  s.days[2].through = true;
  const r = l.lunchCompute(s);
  assert.strictEqual(r.totalMinutes, 2430); assert.strictEqual(r.throughDays, 1); assert.strictEqual(r.lunchDays, 4);
  assert.strictEqual(r.reg, 40); assert.strictEqual(r.ot, 0.5);
});
check('daily overtime is on the hours after lunch', () => {
  const s = week({ rule: 'daily8' });
  s.days[0].in = '8'; s.days[0].out = '5';       // 9h shift, 30 off = 8.5
  const r = l.lunchCompute(s);
  assert.strictEqual(r.reg, 8); assert.strictEqual(r.ot, 0.5);
});
check('gross pay uses the after-lunch split', () => {
  const s = week({ rate: '20' });
  for (let i = 0; i < 5; i++) { s.days[i].in = '8'; s.days[i].out = '5'; }   // 8.5 x 5 = 42.5
  const r = l.lunchCompute(s);
  assert.strictEqual(r.pay, 40 * 20 + 2.5 * 30);
});
check('a short day gets no lunch and the summary says so', () => {
  const s = week();
  s.days[0].in = '9'; s.days[0].out = '1';
  const r = l.lunchCompute(s);
  assert.strictEqual(r.lunchDays, 0); assert.strictEqual(r.totalMinutes, 240);
});

console.log('the sheet');
check('has a lunch column and formula totals', () => {
  const s = week({ rate: '20' });
  s.days[0].in = '8'; s.days[0].out = '4:30';
  s.days[1].in = '8'; s.days[1].out = '5'; s.days[1].through = true;
  l._setState(s);
  const rows = l.lunchXlsxRows();
  const head = rows.find(r => r[0] && r[0].v === 'Date');
  assert.deepStrictEqual(head.map(c => c.v), ['Date', 'Day', 'In', 'Out', 'Shift (h:mm)', 'Lunch (min)', 'Hours (h:mm)', 'Hours (decimal)']);
  const monday = rows[rows.indexOf(head) + 1];
  assert.strictEqual(monday[2], '8:00am'); assert.strictEqual(monday[3], '4:30pm');
  assert.strictEqual(monday[5].v, 30); assert.strictEqual(monday[7].v, 8);
  const tuesday = rows[rows.indexOf(head) + 2];
  assert.strictEqual(tuesday[5].v, 0); assert.strictEqual(tuesday[7].v, 9);
  const lunchLine = rows.find(r => r[0] && r[0].v === 'Lunch deducted (min)');
  assert.strictEqual(lunchLine[5].v, 30); assert.ok(/^SUM\(F\d+:F\d+\)$/.test(lunchLine[5].f));
  const total = rows.find(r => r[0] && r[0].v === 'Total hours');
  assert.ok(/^SUM\(H\d+:H\d+\)$/.test(total[7].f));
  const pay = rows[rows.length - 1];
  assert.strictEqual(pay[0].v, 'Gross pay'); assert.ok(/^H\d+\*H\d+\+H\d+\*H\d+\*1\.5$/.test(pay[7].f));
  const rule = rows.find(r => r[0] && r[0].v === 'Lunch rule'); assert.strictEqual(rule[1], '30 minutes when the shift runs over 6 hours');
});
check('file name carries the date', () => { l._setState(week()); assert.strictEqual(l.lunchXlsxName(), 'timecard-lunch-2026-09-14.xlsx'); });

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
