const assert = require('assert');
const b = require('../site/assets/biweekly.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

// A fortnight from a list of [in, out] per day; '' leaves the day empty.
function card(start, shifts, rule) {
  const days = b.biweeklyBuildDays(start);
  shifts.forEach((s, i) => {
    if (!s) return;
    days[i].segments = [{ in: s[0], out: s[1], inM: 'am', outM: 'pm' }];
  });
  return { start, rule: rule || 'weekly40', rate: '', employee: '', payday: 5, days };
}
const ten = ['7', '5'], six = ['8', '2'], eight = ['8', '4'], twelve = ['7', '7'];

console.log('overtime is counted week by week');
check('50 then 30 is 10 overtime, though the fortnight is 80', () => {
  const r = b.biweeklyCompute(card('2026-10-04', [ten, ten, ten, ten, ten, '', '', six, six, six, six, six]));
  assert.strictEqual(r.totalMinutes, 80 * 60);
  assert.strictEqual(r.weeks[0].ot, 10);
  assert.strictEqual(r.weeks[1].ot, 0);
  assert.strictEqual(r.ot, 10);
  assert.strictEqual(r.reg, 70);
});
check('40 and 40 is no overtime', () => {
  const r = b.biweeklyCompute(card('2026-10-04', [eight, eight, eight, eight, eight, '', '', eight, eight, eight, eight, eight]));
  assert.strictEqual(r.ot, 0);
  assert.strictEqual(r.reg, 80);
});
check('each week line carries its own hours', () => {
  const r = b.biweeklyCompute(card('2026-10-04', [ten, '', '', '', '', '', '', six]));
  assert.strictEqual(r.weeks[0].minutes, 600);
  assert.strictEqual(r.weeks[1].minutes, 360);
  assert.strictEqual(r.daysWorked, 2);
});
check('rows are dated from the first day', () => {
  const days = b.biweeklyBuildDays('2026-10-04');
  assert.strictEqual(days.length, 14);
  assert.strictEqual(days[0].date, '2026-10-04');
  assert.strictEqual(days[13].date, '2026-10-17');
  assert.strictEqual(days[0].label, 'Sun');
});

console.log('8 and 80');
check('a 12 hour day is 4 overtime even in a short fortnight', () => {
  const r = b.biweeklyCompute(card('2026-10-04', [twelve], 'hosp880'));
  assert.strictEqual(r.ot, 4);
  assert.strictEqual(r.reg, 8);
});
check('50 then 30 in 8 hour days is no overtime under 8 and 80', () => {
  const r = b.biweeklyCompute(card('2026-10-04', [eight, eight, eight, eight, eight, eight, '', eight, eight, eight, eight], 'hosp880'));
  assert.strictEqual(r.totalMinutes, 80 * 60);
  assert.strictEqual(r.ot, 0);
});
check('over 80 in the fourteen days is overtime', () => {
  const r = b.biweeklyCompute(card('2026-10-04', [eight, eight, eight, eight, eight, eight, '', eight, eight, eight, eight, eight], 'hosp880'));
  assert.strictEqual(r.totalMinutes, 88 * 60);
  assert.strictEqual(r.ot, 8);
  assert.strictEqual(r.reg, 80);
});
check('daily and fortnight overtime are not counted twice', () => {
  const shifts = Array(14).fill(['7', '5']); // 10 hours x 14 = 140
  const r = b.biweeklyCompute(card('2026-10-04', shifts, 'hosp880'));
  assert.strictEqual(r.reg + r.ot, 140);
  assert.strictEqual(r.reg, 80);
  assert.strictEqual(r.ot, 60);
});

console.log('payday');
check('a period ending Saturday is paid the Friday after', () => assert.strictEqual(b.paydayAfter('2026-10-17', 5), '2026-10-23'));
check('a period ending Friday is paid the next Friday, not the same day', () => assert.strictEqual(b.paydayAfter('2026-10-16', 5), '2026-10-23'));
check('a period ending Sunday is paid the Friday after', () => assert.strictEqual(b.paydayAfter('2026-10-18', 5), '2026-10-23'));

console.log('the pay-period calendar');
// Fridays from 2 January 2026: the 27th falls on 1 January 2027, and 2027 runs 1 Jan to 31 Dec.
const anchor = '2026-12-13'; // a Sunday; ends Sat 26 Dec, paid Fri 1 Jan 2027
check('the anchor period is paid 1 January 2027', () => assert.strictEqual(b.paydayAfter(b.addDays(anchor, 13), 5), '2027-01-01'));
check('2027 has 27 Friday paydays on that schedule', () => {
  const list = b.payCalendar(anchor, 5, 2027);
  assert.strictEqual(list.length, 27);
  assert.strictEqual(list[0].payday, '2027-01-01');
  assert.strictEqual(list[26].payday, '2027-12-31');
});
check('2026 has 26 on the same schedule', () => {
  const list = b.payCalendar(anchor, 5, 2026);
  assert.strictEqual(list.length, 26);
  assert.strictEqual(list[0].payday, '2026-01-02');
  assert.strictEqual(list[25].payday, '2026-12-18');
});
check('the other Friday schedule has 26 in 2027', () => assert.strictEqual(b.payCalendar('2026-12-20', 5, 2027).length, 26));
check('any period of the schedule gives the same year', () => {
  assert.deepStrictEqual(b.payCalendar('2027-06-13', 5, 2027), b.payCalendar(anchor, 5, 2027));
});
check('periods are fourteen days and follow on', () => {
  const list = b.payCalendar(anchor, 5, 2027);
  for (let i = 1; i < list.length; i++) assert.strictEqual(list[i].start, b.addDays(list[i - 1].end, 1));
  list.forEach(p => assert.strictEqual(p.end, b.addDays(p.start, 13)));
});
check('a leap year steps the payday back two days', () => {
  // Fridays from 5 Jan 2024 (leap): the same schedule's first 2025 payday is 3 Jan.
  const first2024 = b.payCalendar('2023-12-17', 5, 2024)[0].payday;
  const first2025 = b.payCalendar('2023-12-17', 5, 2025)[0].payday;
  assert.strictEqual(first2024, '2024-01-05');
  assert.strictEqual(first2025, '2025-01-03');
});
check('no start date, no calendar', () => assert.deepStrictEqual(b.payCalendar('', 5, 2027), []));
check('the card belongs to its payday year', () => assert.strictEqual(b.cardYear(anchor, 5), 2027));

console.log('the sheet');
check('week totals are SUM formulas over their own seven days', () => {
  b._setState(card('2026-10-04', [ten, ten, ten, ten, ten, '', '', six, six, six, six, six]));
  const rows = b.biweeklyXlsxRows();
  const w1 = rows.find(r => r[0] && r[0].v === 'Week 1 total');
  const w2 = rows.find(r => r[0] && r[0].v === 'Week 2 total');
  assert.ok(/^SUM\(E\d+:E\d+\)$/.test(w1[4].f));
  assert.ok(/^SUM\(F\d+:F\d+\)$/.test(w2[5].f));
  assert.strictEqual(w1[5].v, 50);
  assert.strictEqual(w2[5].v, 30);
  assert.ok(w1[2].includes('10.00 overtime'));
});
check('the fortnight total adds the two week lines', () => {
  const rows = b.biweeklyXlsxRows();
  const t = rows.find(r => r[0] && r[0].v === 'Total for the two weeks');
  assert.ok(/^F\d+\+F\d+$/.test(t[5].f));
  assert.strictEqual(t[5].v, 80);
});
check('the year of pay periods follows the card', () => {
  const rows = b.biweeklyXlsxRows();
  const head = rows.find(r => r[0] && typeof r[0].v === 'string' && r[0].v.startsWith('Pay periods paid in'));
  assert.ok(head && head[0].v.includes('2026'));
});
check('gross pay is a formula when a rate is given', () => {
  const s = card('2026-10-04', [ten, ten, ten, ten, ten]);
  s.rate = '20';
  b._setState(s);
  const rows = b.biweeklyXlsxRows();
  const pay = rows.find(r => r[0] && r[0].v === 'Gross pay');
  assert.strictEqual(pay[5].v, 40 * 20 + 10 * 30);
  assert.ok(pay[5].f.includes('*1.5'));
});
check('file is named for the first day', () => assert.strictEqual(b.biweeklyXlsxName(), 'biweekly-timecard-2026-10-04.xlsx'));

console.log('dates and labels fit their columns in every sheet');
// A date in a narrow column shows as ##### in Excel. "14 Oct 2026" in Excel's default font needs 12:
// a date in an 11-wide column showed ##### in the founder's Excel on 2026-10-15, one in a 12 did not.
// A bold label is cut off where the next cell on its row is filled; bold runs about a tenth wider.
function datesFit(name, rows, widths) {
  rows.forEach((r, ri) => r.forEach((c, ci) => {
    const col = 'ABCDEFGHIJKL'[ci] + (ri + 1);
    const w = widths[ci] || 8.43;
    if (c && c.d) assert.ok(w >= 12, name + ': date in ' + col + ' is ' + w + ' wide');
    const next = r[ci + 1];
    const filled = next !== undefined && next !== '' && !(next && next.v === '');
    if (c && typeof c.v === 'string' && filled) {
      const need = Math.ceil(c.v.length * (c.s === 1 ? 1.1 : 1) + 1);
      assert.ok(w >= need, name + ': "' + c.v + '" in ' + col + ' needs ' + need + ', column is ' + w);
    }
  }));
}
check('biweekly sheet', () => {
  b._setState(card('2026-10-04', [ten, ten]));
  datesFit('biweekly', b.biweeklyXlsxRows(), b.BIWEEKLY_XLSX_WIDTHS);
});
check('time card sheet', () => {
  const a = require('../site/assets/app.js');
  a._setState({ period: 'week', start: '2026-10-04', rule: 'weekly40', rate: '', employee: 'A', days: a.buildDays('2026-10-04', 'week') });
  datesFit('time card', a.toXlsxRows(), a.XLSX_WIDTHS);
});
check('lunch sheet', () => {
  const l = require('../site/assets/lunch.js');
  l._setState({ period: 'week', start: '2026-10-04', rule: 'weekly40', rate: '', employee: 'A', lunchMinutes: '30', lunchWhen: 'over6', days: l.lunchBuildDays('2026-10-04', 'week') });
  datesFit('lunch', l.lunchXlsxRows(), l.LUNCH_XLSX_WIDTHS);
});

check('pay sheet', () => {
  const p = require('../site/assets/pay.js');
  const days = p.payBlankDays('2026-10-04', 'biweekly');
  days[1].segments = [{ in: '9', out: '5', inM: 'am', outM: 'pm', job: 1 }];
  p._setState({ rateA: '15', rateB: '21', otMult: '1.5', dtMult: '2', diffAmount: '2', diffKind: 'dollar', diffFrom: '23', diffTo: '7',
    period: 'biweekly', start: '2026-10-04', rule: 'weekly40', employee: 'A', days });
  datesFit('pay', p.payXlsxRows(), p.PAY_XLSX_WIDTHS);
});

check('military sheet', () => {
  const m = require('../site/assets/military.js');
  const days = m.milBuildDays('2026-10-04', 'biweekly');
  days[0].segments = [{ in: '1900', out: '0700' }, { in: 'x', out: '0800' }];
  days[0].breakMins = '30';
  days[1].segments = [{ in: '1600', out: '2400' }];
  m._setState({ period: 'biweekly', start: '2026-10-04', rule: 'weekly40', rate: '20', employee: 'A', days });
  datesFit('military', m.milXlsxRows(), m.MIL_XLSX_WIDTHS);
});

if (failures) { console.log('\n' + failures + ' failing'); process.exit(1); }
console.log('\nall passing');
