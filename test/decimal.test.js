const assert = require('assert');
const d = require('../site/assets/decimal.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

console.log('parseDuration');
check('h:mm', () => assert.strictEqual(d.parseDuration('7:45'), 465));
check('h:m single digit minute', () => assert.strictEqual(d.parseDuration('7:5'), 425));
check('7h 45m', () => assert.strictEqual(d.parseDuration('7h 45m'), 465));
check('7h', () => assert.strictEqual(d.parseDuration('7h'), 420));
check('45m', () => assert.strictEqual(d.parseDuration('45m'), 45));
check('745 -> 7:45', () => assert.strictEqual(d.parseDuration('745'), 465));
check('8 -> 8:00', () => assert.strictEqual(d.parseDuration('8'), 480));
check('0:05', () => assert.strictEqual(d.parseDuration('0:05'), 5));
check('negative', () => assert.strictEqual(d.parseDuration('-1:30'), -90));
check('bad minutes', () => assert.strictEqual(d.parseDuration('7:75'), null));
check('junk', () => assert.strictEqual(d.parseDuration('seven'), null));

console.log('parseDecimal');
check('plain', () => assert.strictEqual(d.parseDecimal('7.75'), 7.75));
check('comma decimal', () => assert.strictEqual(d.parseDecimal('7,75'), 7.75));
check('leading dot', () => assert.strictEqual(d.parseDecimal('.5'), 0.5));
check('junk', () => assert.strictEqual(d.parseDecimal('7.7.5'), null));

console.log('conversion');
check('8:05 is 8.08 not 8.05', () => assert.strictEqual(d.fmtDec(d.minutesToDecimal(485)), '8.08'));
check('8:30 is 8.50', () => assert.strictEqual(d.fmtDec(d.minutesToDecimal(510)), '8.50'));
check('7.75 back to 7:45', () => assert.strictEqual(d.fmtHM(d.decimalToMinutes(7.75)), '7:45'));
check('8.08 back to 8:05', () => assert.strictEqual(d.fmtHM(d.decimalToMinutes(8.08)), '8:05'));
check('4 places', () => assert.strictEqual(d.fmtDec(d.minutesToDecimal(5), 4), '0.0833'));

console.log('rounding');
check('quarter: 7:52 -> 7.75', () => assert.strictEqual(d.fmtDec(d.roundHours(472 / 60, 'quarter')), '7.75'));
check('quarter: 7:53 -> 8.00', () => assert.strictEqual(d.fmtDec(d.roundHours(473 / 60, 'quarter')), '8.00'));
check('tenth: 7:52 -> 7.9', () => assert.strictEqual(d.fmtDec(d.roundHours(472 / 60, 'tenth'), 1), '7.9'));
check('exact untouched', () => assert.strictEqual(d.roundHours(7.123456, 'exact'), 7.123456));

console.log('bulk');
check('to decimal, mixed formats', () => {
  const r = d.convertLines('7:45\n8h05m\n30m\n\nbad', 'toDecimal', 'exact');
  assert.deepStrictEqual(r.map(x => x.ok ? x.result : null), ['7.75', '8.08', '0.50', null]);
});
check('to time', () => {
  const r = d.convertLines('7.75\n0.5', 'toTime', 'exact');
  assert.deepStrictEqual(r.map(x => x.result), ['7:45', '0:30']);
});
check('sum skips bad lines', () => {
  const r = d.convertLines('7:45\nbad\n0:15', 'toDecimal', 'exact');
  assert.strictEqual(d.sumLines(r, 'toDecimal'), 480);
});

console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
process.exit(failures ? 1 : 0);
