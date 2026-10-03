// "Copy to rest of week": which days it fills, and that it never writes over a typed day.
const assert = require('assert');
const e = require('../site/assets/app.js');
const l = require('../site/assets/lunch.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const card = n => Array.from({ length: n }, (_, i) => ({ date: '', label: NAMES[i % 7], segments: [{ in: '', out: '', inM: 'am', outM: 'pm' }], breakMins: '' }));
const fill = (d, a, b, brk) => { d.segments = [{ in: a, out: b, inM: 'am', outM: 'pm' }]; d.breakMins = brk || ''; };

console.log('home card');
check('Monday fills Tuesday to Friday, not Saturday', () => {
  const days = card(7); fill(days[1], '8:00', '4:30', '30');
  assert.deepStrictEqual(e.copyTargets(days, 1, e.dayEmpty), [2, 3, 4, 5]);
});
check('a typed day is skipped, not written over', () => {
  const days = card(7); fill(days[1], '8:00', '4:30'); fill(days[3], '9:00', '1:00');
  e.copyInto(days, 1);
  assert.strictEqual(days[3].segments[0].in, '9:00');
  assert.strictEqual(days[2].segments[0].in, '8:00'); assert.strictEqual(days[5].segments[0].out, '4:30');
});
check('a day with only a break typed counts as typed', () => {
  const days = card(7); fill(days[1], '8:00', '4:30'); days[2].breakMins = '15';
  assert.deepStrictEqual(e.copyTargets(days, 1, e.dayEmpty), [3, 4, 5]);
});
check('every pair and the break are copied, as separate copies', () => {
  const days = card(7);
  days[1].segments = [{ in: '7', out: '11', inM: 'am', outM: 'am' }, { in: '11:30', out: '3:30', inM: 'am', outM: 'pm' }];
  days[1].breakMins = '10';
  e.copyInto(days, 1);
  assert.strictEqual(days[4].segments.length, 2); assert.strictEqual(days[4].breakMins, '10');
  days[4].segments[0].in = '6';
  assert.strictEqual(days[1].segments[0].in, '7');
  assert.strictEqual(e.dayMinutes(days[2]).minutes, e.dayMinutes(days[1]).minutes);
});
check('a biweekly card stops at the end of the first week', () => {
  const days = card(14); fill(days[1], '8:00', '4:30');
  assert.deepStrictEqual(e.copyTargets(days, 1, e.dayEmpty), [2, 3, 4, 5]);
});
check('second week of a biweekly card copies within the second week', () => {
  const days = card(14); fill(days[8], '8:00', '4:30');
  assert.deepStrictEqual(e.copyTargets(days, 8, e.dayEmpty), [9, 10, 11, 12]);
});
check('Saturday copies to nothing after it in the week', () => {
  const days = card(7); fill(days[6], '8:00', '4:30');
  assert.deepStrictEqual(e.copyTargets(days, 6, e.dayEmpty), []);
});
check('a week that starts on Monday: Saturday copies to Sunday', () => {
  const days = card(8).slice(1); fill(days[5], '9:00', '1:00');
  assert.deepStrictEqual(days.map(d => d.label).slice(5), ['Sat', 'Sun']);
  assert.deepStrictEqual(e.copyTargets(days, 5, e.dayEmpty), [6]);
});

console.log('lunch card');
const lcard = n => Array.from({ length: n }, (_, i) => ({ date: '', label: NAMES[i % 7], in: '', out: '', inM: 'am', outM: 'pm', lunch: '', through: false }));
check('times, lunch and worked-through all copy', () => {
  const days = lcard(7); Object.assign(days[1], { in: '7:00', out: '3:30', lunch: '45', through: false });
  l.lunchCopyInto(days, 1);
  assert.strictEqual(days[5].in, '7:00'); assert.strictEqual(days[5].lunch, '45'); assert.strictEqual(days[6].in, '');
});
check('a day marked worked through is not empty', () => {
  const days = lcard(7); Object.assign(days[1], { in: '7:00', out: '3:30' }); days[2].through = true;
  assert.deepStrictEqual(e.copyTargets(days, 1, l.lunchDayEmpty), [3, 4, 5]);
});

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
