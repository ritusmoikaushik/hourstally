// The time card with overtime and pay: the weighted average regular rate (29 CFR 778.115), shift
// differentials in the regular rate (778.207(b)), editable multipliers, gross per day, rounding,
// and the sheet. The worked examples quoted on the page are pinned here, so the page cannot drift
// from the code.
const assert = require('assert');
const p = require('../site/assets/pay.js');
const app = require('../site/assets/app.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}
const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, (msg || '') + ' expected ' + b + ', got ' + a);

// A card from a list of days; each day is a list of [in, out, inM, outM, job]. The week starts
// Sunday 11 October 2026.
function card(o, shifts) {
  const days = p.payBlankDays(o.start || '2026-10-11', o.period || 'week');
  shifts.forEach((s, i) => {
    if (!s) return;
    days[i].segments = s.map(x => ({ in: x[0], out: x[1], inM: x[2] || 'am', outM: x[3] || 'pm', inL: !!x[2], outL: !!x[3], job: x[4] || 0 }));
  });
  return Object.assign({ rateA: '', rateB: '', otMult: '1.5', dtMult: '2', diffAmount: '', diffKind: 'dollar', diffFrom: '23', diffTo: '7',
    period: 'week', start: '2026-10-11', rule: 'weekly40', employee: '', days }, o);
}
const reg6 = [['8', '2']];                         // 8am-2pm on the register, 6 hours at A
const grill = (a, b) => [[a, b, 'am', 'pm', 1]];   // on the grill, at B
const two = { rateA: '15', rateB: '21' };

console.log('one rate');
check('46 hours at $12 is $588, the regulation\'s own example (778.110)', () => {
  const w = p.payCompute(card({ rateA: '12' }, ['', [['7', '5']], [['7', '5']], [['7', '5']], [['7', '5']], [['8', '2']]])).weeks[0];
  near(w.hours, 46); near(w.ot, 6); near(w.regularRate, 12); near(w.gross, 588);
});
check('no rate, no pay, hours still counted', () => {
  const r = p.payCompute(card({}, [reg6]));
  near(r.hours, 6); near(r.gross, 0);
});
check('the regular rate with one rate is the rate', () => {
  const w = p.payCompute(card({ rateA: '18.40' }, [reg6, reg6])).weeks[0];
  near(w.regularRate, 18.4);
});

console.log('two rates - the worked example on the page');
// 8 on the grill Sunday, 7 Monday, 6 on the register Tuesday to Saturday.
const ex1 = card(two, [grill('9', '5'), grill('7', '2'), reg6, reg6, reg6, reg6, reg6]);
check('45 hours, 15 at $21 and 30 at $15', () => {
  const w = p.payCompute(ex1).weeks[0];
  near(w.hours, 45); near(w.ot, 5);
  assert.deepStrictEqual(w.days.map(d => d.jobMinutes[1] / 60), [8, 7, 0, 0, 0, 0, 0]);
});
check('straight time $765.00, blended rate $17.00', () => {
  const w = p.payCompute(ex1).weeks[0];
  near(w.straight, 765); near(w.regularRate, 17);
});
check('premium $42.50, gross $807.50', () => {
  const w = p.payCompute(ex1).weeks[0];
  near(w.premium, 42.5); near(w.gross, 807.5);
});
check('Saturday carries the overtime: $132.50', () => {
  const w = p.payCompute(ex1).weeks[0];
  near(w.days[6].ot, 5); near(w.days[6].gross, 132.5);
  assert.strictEqual(p.usd(w.days[0].gross), '$168.00');
});
check('rate in effect, overtime on the register: $802.50', () => near(p.payCompute(ex1).weeks[0].rateInEffect, 802.5));
check('turned round, overtime on the grill: rate in effect $817.50, blended still $807.50', () => {
  const w = p.payCompute(card(two, [reg6, reg6, reg6, reg6, reg6, grill('9', '5'), grill('7', '2')])).weeks[0];
  near(w.rateInEffect, 817.5); near(w.gross, 807.5);
});
check('the blended rate is weighted by hours, not the midpoint', () => assert.notStrictEqual(p.payCompute(ex1).weeks[0].regularRate, 18));
check('1.5 times the higher rate is never less than the blended overtime', () => {
  const w = p.payCompute(ex1).weeks[0];
  const atHigher = w.straight - 5 * 15 + 5 * 21 * 1.5; // overtime hours were on the register
  assert.ok(atHigher >= w.gross);
});
check('the note says blended, not the higher rate', () => {
  const n = p.payNote(p.payCompute(ex1)).join(' ');
  assert.ok(n.includes('Overtime is 1.5 × the blended $17.00 = $25.50 an hour, not 1.5 × the higher $21.00'), n);
  assert.ok(n.includes('$802.50 instead of $807.50'), n);
});
check('both jobs in one day: the pairs are priced separately', () => {
  const s = card(two, [[['7', '11', 'am', 'am', 0], ['12', '4', 'pm', 'pm', 1]]]);
  const d = p.payCompute(s).weeks[0].days[0];
  near(d.jobMinutes[0], 240); near(d.jobMinutes[1], 240); near(d.straight, 4 * 15 + 4 * 21);
});
check('a B pair is priced at A when no second rate is set', () => {
  const s = card({ rateA: '15' }, [grill('9', '5')]);
  near(p.payCompute(s).weeks[0].straight, 120);
});
check('a week that used only one of two rates is not called blended', () => {
  const r = p.payCompute(card(two, [[['7', '5']], [['7', '5']], [['7', '5']], [['7', '5']], [['7', '5']]]));
  assert.strictEqual(r.weeks[0].blended, false);
  assert.strictEqual(r.weeks[0].rateInEffect, null);
  assert.deepStrictEqual(p.payNote(r), []);
});

console.log('shift differential - the worked example on the page');
// Five shifts, 3pm to 1am, $20, $2 an hour from 11pm to 7am.
const night = [['3', '1', 'pm', 'am']];
const ex2 = card({ rateA: '20', diffAmount: '2' }, ['', night, night, night, night, night]);
check('two differential hours a night, ten in all', () => {
  const w = p.payCompute(ex2).weeks[0];
  near(w.days.reduce((t, d) => t + d.diffMinutes, 0) / 60, 10); near(w.diffPay, 20);
});
check('straight time $1,020.00, regular rate $20.40', () => {
  const w = p.payCompute(ex2).weeks[0];
  near(w.straight, 1020); near(w.regularRate, 20.4);
});
check('premium $102.00, gross $1,122.00', () => {
  const w = p.payCompute(ex2).weeks[0];
  near(w.premium, 102); near(w.gross, 1122); assert.strictEqual(p.usd(w.gross), '$1,122.00');
});
check('on the $20 base it would be $1,120.00, two dollars short', () => {
  const w = p.payCompute(ex2).weeks[0];
  near(w.hours * 20 + w.diffPay + w.ot * 10, 1120);
});
check('Friday carries the ten overtime hours: $306.00', () => near(p.payCompute(ex2).weeks[0].days[5].gross, 306));
check('a percentage differential is a share of the pair\'s own rate', () => {
  const s = card({ rateA: '20', rateB: '30', diffAmount: '10', diffKind: 'percent' }, ['', [['3', '1', 'pm', 'am', 0]], [['3', '1', 'pm', 'am', 1]]]);
  near(p.payCompute(s).weeks[0].diffPay, 2 * 2 + 2 * 3);
});
check('the window: none before 11pm, all of a night shift inside it', () => {
  near(p.windowOverlap(15 * 60, 23 * 60, 23, 7), 0);
  near(p.windowOverlap(23 * 60, 31 * 60, 23, 7), 480);
  near(p.windowOverlap(5 * 60, 9 * 60, 23, 7), 120);        // 5am-9am: two hours before 7am
  near(p.windowOverlap(22 * 60, 32 * 60, 23, 7), 480);       // 10pm-8am
  near(p.windowOverlap(15 * 60, 23 * 60, 18, 22), 240);      // an evening window that does not cross midnight
  near(p.windowOverlap(9 * 60, 17 * 60, 0, 0), 480);         // same hour both ends: every hour
});
check('a second pair after midnight still finds the window', () => {
  const s = card({ rateA: '20', diffAmount: '1' }, [[['9', '11', 'pm', 'pm'], ['11:30', '3', 'pm', 'am']]]);
  near(p.payCompute(s).weeks[0].days[0].diffMinutes, 210); // 11:30pm to 3am, all inside
});
check('no differential without an amount', () => near(p.payCompute(card({ rateA: '20' }, [night])).weeks[0].diffPay, 0));

console.log('multipliers');
check('overtime at 2x adds a whole regular rate per hour', () => {
  const s = card({ rateA: '20', otMult: '2' }, ['', [['7', '5']], [['7', '5']], [['7', '5']], [['7', '5']], [['7', '5']]]);
  const w = p.payCompute(s).weeks[0];
  near(w.gross, 50 * 20 + 10 * 20);
});
check('California double time at an edited 2.5x', () => {
  const s = card({ rateA: '20', dtMult: '2.5', rule: 'california' }, ['', [['6', '8', 'am', 'pm']]]); // 14 hours
  const w = p.payCompute(s).weeks[0];
  near(w.reg, 8); near(w.ot, 4); near(w.dt, 2);
  near(w.gross, 14 * 20 + 4 * 0.5 * 20 + 2 * 1.5 * 20);
});
check('an empty or nonsense multiplier falls back; below 1 is 1', () => {
  assert.strictEqual(p.multiplier('', 1.5), 1.5);
  assert.strictEqual(p.multiplier('abc', 2), 2);
  assert.strictEqual(p.multiplier('0.5', 1.5), 1);
  assert.strictEqual(p.multiplier('1.75', 1.5), 1.75);
});
check('overtime set below 1.5 is warned about', () => {
  const r = p.payCompute(card({ rateA: '20', otMult: '1.25' }, [reg6]));
  assert.ok(p.payNote(r)[0].includes('below 1.5'));
});

console.log('overtime falls on the right day, and the totals match the shared engine');
check('over 40: the hours past the fortieth are on the day they were worked', () => {
  const ten = [['7', '5']];
  const w = p.payCompute(card({ rateA: '10' }, ['', ten, ten, ten, ten, ten])).weeks[0];
  assert.deepStrictEqual(w.days.map(d => d.ot), [0, 0, 0, 0, 0, 10, 0]);
});
check('over 8 a day and 40 a week: no hour counted twice', () => {
  const ten = [['7', '5']];
  const w = p.payCompute(card({ rateA: '10', rule: 'both' }, ['', ten, ten, ten, ten, ten])).weeks[0];
  near(w.reg, 40); near(w.ot, 10);
  assert.deepStrictEqual(w.days.map(d => d.ot), [0, 2, 2, 2, 2, 2, 0]);
});
check('random weeks: same regular, overtime and double time as computeWeek, every rule', () => {
  let seed = 7;
  const rnd = n => { seed = (seed * 16807) % 2147483647; return seed % n; };
  for (const rule of ['weekly40', 'daily8', 'both', 'california', 'none']) {
    for (let t = 0; t < 200; t++) {
      const shifts = Array.from({ length: 7 }, () => rnd(4) === 0 ? '' : [[String(5 + rnd(5)), String(1 + rnd(11)), 'am', 'pm']]);
      const s = card({ rateA: '10', rule }, shifts);
      const w = p.payCompute(s).weeks[0];
      const rows = s.days.map(d => app.dayMinutes(d));
      const ref = app.computeWeek(rows, rule);
      near(w.reg, ref.reg, rule + ' reg'); near(w.ot, ref.ot, rule + ' ot'); near(w.dt, ref.dt, rule + ' dt');
      near(w.days.reduce((a, d) => a + d.gross, 0), w.gross, rule + ' days add up');
    }
  }
});
check('a biweekly card prices each week on its own blended rate', () => {
  const s = card(Object.assign({ period: 'biweekly' }, two),
    [grill('9', '5'), grill('7', '2'), reg6, reg6, reg6, reg6, reg6, reg6, reg6, reg6, reg6, reg6, reg6, reg6]);
  const r = p.payCompute(s);
  assert.strictEqual(r.weeks.length, 2);
  near(r.weeks[0].regularRate, 17); near(r.weeks[1].regularRate, 15);
  near(r.weeks[1].ot, 2); near(r.gross, 807.5 + 42 * 15 + 2 * 7.5);
});
check('the night the clocks go back pays the extra hour', () => {
  // Saturday 31 October 2026 into Sunday, in New York: 10pm to 6am is nine hours worked.
  const tz = process.env.TZ;
  process.env.TZ = 'America/New_York';
  try {
    const s = card({ rateA: '20', diffAmount: '1', start: '2026-10-25' }, ['', '', '', '', '', '', [['10', '6', 'pm', 'am']]]);
    const d = p.payCompute(s).weeks[0].days[6];
    near(d.minutes, 540);
    near(d.straight, 9 * 20 + d.diffMinutes / 60);
  } finally { if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz; }
});

console.log('rounding');
check('money is rounded once, from the exact figure', () => {
  // 40 hours at $15 and 5 at $21: regular rate 15.6666..., gross 744.1666...
  const s = card(two, [[['9', '5']], [['9', '5']], [['9', '5']], [['9', '5']], [['9', '5']], grill('9', '2')]);
  const w = p.payCompute(s).weeks[0];
  near(w.regularRate, 705 / 45);
  assert.strictEqual(p.usd(w.gross), '$744.17');
  assert.strictEqual(p.usd(w.regularRate), '$15.67');
  assert.strictEqual(p.usd(w.days[5].gross), '$144.17');
});
check('half a cent rounds up', () => {
  assert.strictEqual(p.cents(10.005), 10.01);
  assert.strictEqual(p.cents(2.675), 2.68);
  assert.strictEqual(p.usd(1234.5), '$1,234.50');
});

console.log('the sheet');
check('rates and multipliers are cells; the day pay is a formula on them', () => {
  p._setState(ex1);
  const rows = p.payXlsxRows();
  const rateA = rows.findIndex(r => r[0] && r[0].v === 'Rate A');
  assert.strictEqual(rows[rateA][1].v, 15);
  const header = rows.findIndex(r => r[0] && r[0].v === 'Date');
  const sun = rows[header + 1];
  assert.ok(sun[8].f.includes('$B$' + (rateA + 1)), sun[8].f);
  assert.strictEqual(sun[8].v, 168);
  assert.ok(/\$C\$\d+/.test(sun[11].f));
});
check('the week line holds the regular rate as total pay over total hours', () => {
  const rows = p.payXlsxRows();
  const wk = rows.find(r => r[0] && typeof r[0].v === 'string' && r[0].v.includes('regular rate'));
  assert.strictEqual(wk[2].v, 17);
  assert.ok(/^IF\(H\d+=0,0,I\d+\/H\d+\)$/.test(wk[2].f), wk[2].f);
  assert.strictEqual(wk[11].v, 807.5);
});
check('gross pay is the sum of the week lines', () => {
  const rows = p.payXlsxRows();
  const g = rows.find(r => r[0] && r[0].v === 'Gross pay');
  assert.strictEqual(g[11].v, 807.5);
  assert.ok(/^L\d+$/.test(g[11].f));
});
check('the A or B of each pair is on the sheet', () => {
  const rows = p.payXlsxRows();
  const header = rows.findIndex(r => r[0] && r[0].v === 'Date');
  assert.ok(rows[header + 1][2].endsWith('(B)'));
  assert.ok(rows[header + 3][2].endsWith('(A)'));
});
check('the cached day values add up to the cached week', () => {
  p._setState(ex2);
  const rows = p.payXlsxRows();
  const header = rows.findIndex(r => r[0] && r[0].v === 'Date');
  const days = rows.slice(header + 1, header + 8);
  const sum = days.reduce((t, r) => t + (r[11] ? r[11].v : 0), 0);
  near(sum, 1122);
});
check('dates fit their columns', () => {
  p._setState(Object.assign(card(two, [reg6]), { employee: 'A' }));
  p.payXlsxRows().forEach((r, ri) => r.forEach((c, ci) => {
    if (c && c.d) assert.ok((p.PAY_XLSX_WIDTHS[ci] || 8.43) >= 11, 'date in column ' + ci + ' row ' + (ri + 1));
  }));
});
check('the sheet builds as a zip', () => {
  const x = require('../site/assets/xlsx.js');
  const bytes = x.buildXlsx(p.payXlsxRows(), p.PAY_XLSX_WIDTHS, 'Time card and pay');
  assert.strictEqual(bytes[0], 0x50); assert.strictEqual(bytes[1], 0x4b);
});
check('file is named for the first day', () => assert.strictEqual(p.payXlsxName(), 'timecard-pay-2026-10-11.xlsx'));

if (failures) { console.log('\n' + failures + ' failing'); process.exit(1); }
console.log('\nall passing');
