'use strict';

// The biweekly time card. Fourteen days, any number of clock in and out pairs a
// day, and the two weeks totalled on their own lines - because overtime is owed
// week by week, never on the fortnight. Under it, the pay-period calendar: every
// biweekly period and payday in a year, from one start date, with the 27-payday
// years called out. The arithmetic for a day is app.js; this file is what is
// different about a two-week card.

const B = typeof module !== 'undefined' ? require('./app.js') : window;
const BX = typeof module !== 'undefined' ? require('./xlsx.js') : window.HourstallyXlsx;
const BIWEEKLY_KEY = 'hourstally.biweekly.v1';
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

const weekdayOf = iso => new Date(iso + 'T00:00:00').getDay();

// Payday is the first chosen weekday after the period's last day. A period that
// ends on a Saturday and is paid on Friday is paid six days later.
function paydayAfter(endISO, weekday) {
  let gap = (weekday - weekdayOf(endISO) + 7) % 7;
  if (gap === 0) gap = 7;
  return addDays(endISO, gap);
}

// Every biweekly period whose payday falls in the year, found by stepping fourteen
// days at a time from any one period's first day. Payroll counts a year by its
// paydays, which is why one period can belong to the year after the one it was worked in.
function payCalendar(anchorISO, weekday, year) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(anchorISO || '')) return [];
  const pay = s => paydayAfter(addDays(s, 13), weekday);
  const first = year + '-01-01', last = year + '-12-31';
  let s = anchorISO;
  while (pay(s) >= first) s = addDays(s, -14);
  while (pay(s) < first) s = addDays(s, 14);
  const out = [];
  for (; pay(s) <= last; s = addDays(s, 14)) out.push({ start: s, end: addDays(s, 13), payday: pay(s) });
  return out;
}

// The year a card belongs to on the calendar: the year of its payday.
function cardYear(startISO, weekday) {
  return /^\d{4}-\d{2}-\d{2}$/.test(startISO || '') ? +paydayAfter(addDays(startISO, 13), weekday).slice(0, 4) : null;
}

// Hospitals and nursing homes may agree with staff to count overtime over 8 hours
// a day and over 80 in the fourteen days, instead of over 40 a week - FLSA section
// 7(j), the "8 and 80" system. It exists only on a two-week period, so it is only here.
function compute880(rows) {
  let reg = 0, ot = 0;
  rows.forEach(r => { const h = r.minutes / 60; reg += Math.min(h, 8); ot += Math.max(0, h - 8); });
  if (reg > 80) { ot += reg - 80; reg = 80; }
  return { reg, ot, dt: 0 };
}

function biweeklyCompute(state) {
  const rows = state.days.map(d => {
    const r = B.dayMinutes(d);
    return { date: d.date, label: d.label, minutes: r.minutes, worked: r.worked, bad: r.bad, clocks: r.clocks };
  });
  const weeks = [0, 7].map(i => {
    const w = rows.slice(i, i + 7);
    const minutes = w.reduce((a, r) => a + r.minutes, 0);
    const split = state.rule === 'hosp880' ? compute880(w) : B.computeWeek(w, state.rule);
    return Object.assign({ minutes, days: w.filter(r => r.worked).length }, split);
  });
  // Under 8 and 80 the week lines carry the daily overtime only; anything over 80
  // belongs to the fourteen days and is added once, here.
  const t = state.rule === 'hosp880' ? compute880(rows)
    : { reg: weeks[0].reg + weeks[1].reg, ot: weeks[0].ot + weeks[1].ot, dt: weeks[0].dt + weeks[1].dt };
  const totalMinutes = weeks[0].minutes + weeks[1].minutes;
  const rate = parseFloat(state.rate) || 0;
  const pay = rate > 0 ? t.reg * rate + t.ot * rate * 1.5 + t.dt * rate * 2 : 0;
  return { rows, weeks, reg: t.reg, ot: t.ot, dt: t.dt, totalMinutes, pay, daysWorked: weeks[0].days + weeks[1].days };
}

function biweeklyBuildDays(startISO) { return B.buildDays(startISO, 'biweekly'); }

// ------------------------------------------------------------------ screen

let bstate = {
  start: '', rule: 'weekly40', rate: '', employee: '', payday: 5, calYear: null,
  days: biweeklyBuildDays('')
};

function bsave() {
  try { localStorage.setItem(BIWEEKLY_KEY, JSON.stringify(bstate)); } catch (e) { /* private mode */ }
}

function bload() {
  try {
    const raw = localStorage.getItem(BIWEEKLY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days) && parsed.days.length === 14) bstate = Object.assign(bstate, parsed);
  } catch (e) { /* ignore */ }
}

const bchanged = () => { bsave(); bRenderTotals(); };
// app.js keeps its empty-day test in a const, which another script cannot reach.
const bDayEmpty = d => d.segments.every(s => !s.in && !s.out) && !d.breakMins;
const cardFilled = () => bstate.days.some(d => d.segments.some(s => s.in || s.out) || d.breakMins);

function bRenderDays() {
  const host = document.getElementById('days');
  host.textContent = '';
  bstate.days.forEach((day, di) => {
    const res = B.dayMinutes(day);
    const row = B.el('div', { class: 'day' + (res.bad ? ' bad' : '') });
    row.append(B.el('div', { class: 'day-name' }, [
      day.label || ('Day ' + (di + 1)),
      day.date ? B.el('small', {}, [B.shortDate(day.date)]) : null
    ]));

    const pairs = B.el('div', { class: 'pairs' });
    day.segments.forEach((seg, si) => {
      const last = si === day.segments.length - 1;
      const name = (day.label || 'Day') + ' week ' + (di < 7 ? 1 : 2);
      const inSwitch = B.merSwitch(seg, 'inM', name + ' clock in ' + (si + 1), bchanged);
      const outSwitch = B.merSwitch(seg, 'outM', name + ' clock out ' + (si + 1), bchanged);
      pairs.append(B.el('div', { class: 'pair' + ((seg.in || seg.out) ? '' : ' blank') }, [
        B.el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '9:00' : (si === 0 ? '' : 'in'), value: seg.in, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': name + ' clock in ' + (si + 1),
          oninput: e => { seg.in = e.target.value; seg.inL = false; bchanged(); },
          onblur: e => B.tidyTime(e.target, seg, 'in', 'inM', inSwitch, bchanged)
        }),
        inSwitch,
        B.el('span', { class: 'to' }, ['to']),
        B.el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '5:30' : (si === 0 ? '' : 'out'), value: seg.out, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': name + ' clock out ' + (si + 1),
          oninput: e => { seg.out = e.target.value; seg.outL = false; bchanged(); },
          onblur: e => B.tidyTime(e.target, seg, 'out', 'outM', outSwitch, bchanged)
        }),
        outSwitch,
        si > 0 ? B.el('button', {
          class: 'x', type: 'button', title: 'Remove this in and out', 'aria-label': 'Remove in and out ' + (si + 1),
          onclick: () => { day.segments.splice(si, 1); bsave(); bRenderDays(); }
        }, ['×']) : B.el('span', { class: 'slot' }),
        last ? B.el('button', {
          class: 'add', type: 'button', title: 'Add another clock in and out for this day',
          'aria-label': 'Add another in and out for ' + name,
          onclick: () => {
            day.segments.push({ in: '', out: '', inM: 'pm', outM: 'pm' });
            bsave(); bRenderDays();
            const ins = document.querySelectorAll('#days .day')[di].querySelectorAll('input.time');
            ins[ins.length - 2].focus();
          }
        }, ['+']) : B.el('span', { class: 'slot' })
      ]));
    });
    pairs.append(B.copyButton(() => { B.copyInto(bstate.days, di); bsave(); bRenderDays(); }));
    row.append(pairs);

    row.append(B.el('div', { class: 'brkwrap' }, [
      B.el('span', {}, ['Unpaid break']),
      B.el('input', {
        class: 'brk', type: 'number', min: '0', step: '5', placeholder: '0', value: day.breakMins,
        'aria-label': (day.label || 'Day') + ' week ' + (di < 7 ? 1 : 2) + ' unpaid break minutes',
        oninput: e => { day.breakMins = e.target.value; bchanged(); }
      }),
      B.el('span', {}, ['min'])
    ]));
    row.append(B.el('div', { class: 'totals' + (res.worked ? '' : ' empty') }, [
      B.el('div', { class: 'hm' }, ['—']), B.el('div', { class: 'dec' }, [''])
    ]));
    row.append(B.el('div', { class: 'daynotes' }, [B.el('span', { class: 'note' }, [''])]));
    host.append(row);

    if (di === 6 || di === 13) {
      const w = di === 6 ? 1 : 2;
      host.append(B.el('div', { class: 'weekband', id: 'week-' + w }, [
        B.el('span', { class: 'wk-name' }, ['Week ' + w]),
        B.el('span', { class: 'wk-split' }, ['']),
        B.el('span', { class: 'wk-hm' }, ['0h 00m']),
        B.el('span', { class: 'wk-dec' }, ['0.00'])
      ]));
    }
  });
  bRenderTotals();
}

function weekSplitText(w, rule) {
  if (!w.days) return 'no days worked';
  const parts = [B.fmtDec(w.reg) + ' regular', B.fmtDec(w.ot) + ' overtime'];
  if (w.dt > 0) parts.push(B.fmtDec(w.dt) + ' double');
  return parts.join(' · ') + (rule === 'hosp880' ? ' (over 8 a day)' : '');
}

function bRenderTotals() {
  const r = biweeklyCompute(bstate);
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set('t-total-hm', B.fmtHMlabel(r.totalMinutes));
  const stub = document.querySelector('.stub-value'); if (stub) stub.classList.toggle('empty', r.totalMinutes === 0);
  set('t-total-dec', B.fmtDec(r.totalMinutes / 60));
  set('t-w1', B.fmtHMlabel(r.weeks[0].minutes));
  set('t-w2', B.fmtHMlabel(r.weeks[1].minutes));
  set('t-reg', B.fmtDec(r.reg));
  set('t-ot', B.fmtDec(r.ot));
  set('t-dt', B.fmtDec(r.dt));
  set('t-days', String(r.daysWorked));
  const payRow = document.getElementById('payrow');
  if (r.pay > 0) { payRow.hidden = false; set('t-pay', B.money(r.pay)); } else { payRow.hidden = true; }
  document.getElementById('dtrow').hidden = r.dt <= 0;
  document.getElementById('days').classList.toggle('filled', bstate.days.some(d => d.segments.some(s => s.in || s.out)));

  [1, 2].forEach(n => {
    const band = document.getElementById('week-' + n); if (!band) return;
    const w = r.weeks[n - 1];
    band.querySelector('.wk-split').textContent = weekSplitText(w, bstate.rule);
    band.querySelector('.wk-hm').textContent = B.fmtHMlabel(w.minutes);
    band.querySelector('.wk-dec').textContent = B.fmtDec(w.minutes / 60);
    band.classList.toggle('over', w.ot > 0);
  });

  document.querySelectorAll('#days .day').forEach((row, i) => {
    const day = bstate.days[i];
    const res = B.dayMinutes(day);
    B.syncSwitches(row, day.segments);
    row.querySelectorAll('.pair').forEach((el, si) => {
      const sg = day.segments[si];
      el.classList.toggle('blank', !(sg && (sg.in || sg.out)));
    });
    row.querySelector('.hm').textContent = res.worked ? B.fmtHMlabel(res.minutes) : '—';
    row.querySelector('.dec').textContent = res.worked ? B.fmtDec(res.minutes / 60) : '';
    row.querySelector('.totals').classList.toggle('empty', !res.worked);
    row.classList.toggle('bad', res.bad);
    row.classList.toggle('long', res.long);
    row.classList.toggle('clocked', !!res.clocks);
    row.classList.toggle('cancopy', res.worked && !res.bad && !res.incomplete && B.copyTargets(bstate.days, i, bDayEmpty).length > 0);
    const text = B.noteText(res);
    row.querySelector('.daynotes .note').textContent = text;
    row.classList.toggle('noted', !!text);
  });
  bRenderCalendar();
}

function longDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return WEEKDAYS[d.getDay()].slice(0, 3) + ' ' + B.shortDate(iso);
}

function bRenderCalendar() {
  const host = document.getElementById('pc-body'); if (!host) return;
  const count = document.getElementById('pc-count');
  host.textContent = '';
  document.getElementById('pc-payday').value = String(bstate.payday);
  const own = cardYear(bstate.start, bstate.payday);
  const year = bstate.calYear || own;
  document.getElementById('pc-year').textContent = year || '';
  document.querySelectorAll('.pc-nav').forEach(b => { b.hidden = !year; });
  if (!year) {
    count.textContent = 'Pick the first day of a pay period on the card above, and every period and payday of that year appears here.';
    return;
  }
  const list = payCalendar(bstate.start, bstate.payday, year);
  const day = WEEKDAYS[bstate.payday];
  count.textContent = list.length + ' paydays in ' + year + ', every other ' + day + '.' +
    (list.length === 27 ? ' That is one more than usual — see "26 or 27 paydays" below.' : '');
  count.classList.toggle('extra', list.length === 27);
  const months = {};
  list.forEach(p => { const m = p.payday.slice(0, 7); months[m] = (months[m] || 0) + 1; });
  list.forEach((p, i) => {
    const mine = p.start === bstate.start;
    const three = months[p.payday.slice(0, 7)] === 3;
    host.append(B.el('tr', { class: mine ? 'mine' : '' }, [
      B.el('td', { class: 'num' }, [String(i + 1)]),
      B.el('td', {}, [B.shortDate(p.start) + ' – ' + B.shortDate(p.end)]),
      B.el('td', {}, [longDate(p.payday), three ? B.el('small', {}, [' · 3 this month']) : null]),
      B.el('td', { class: 'noprint' }, [mine ? B.el('span', { class: 'pc-mine' }, ['on the card'])
        : B.el('button', { class: 'pc-use', type: 'button', onclick: () => useCalendarPeriod(p.start) }, ['Use this period'])])
    ]));
  });
}

function useCalendarPeriod(startISO) {
  if (cardFilled() && !confirm('Start the card on ' + B.shortDate(startISO) + '? The times on it now will be cleared.')) return;
  bstate.start = startISO;
  bstate.days = biweeklyBuildDays(startISO);
  bstate.calYear = null;
  bsave(); bRender();
  document.querySelector('[data-tool="biweekly"]').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function bRender() {
  document.getElementById('start').value = bstate.start;
  document.getElementById('rule').value = bstate.rule;
  document.getElementById('rate').value = bstate.rate;
  document.getElementById('employee').value = bstate.employee;
  bRenderDays();
}

// The sheet: each week's days, then that week's own total with its own SUM and
// its regular and overtime, then the fortnight. Under the card, the year's pay
// periods, so the calendar travels with the timesheet.
function biweeklyXlsxRows() {
  const r = biweeklyCompute(bstate);
  const S = BX.STYLE;
  const rows = [];
  const employee = (bstate.employee || '').trim();
  if (employee) rows.push([{ v: 'Employee', s: S.bold }, employee]);
  if (bstate.days[0].date) {
    rows.push([{ v: 'Pay period', s: S.bold }, { d: bstate.days[0].date }, 'to', { d: bstate.days[13].date }]);
    rows.push([{ v: 'Payday', s: S.bold }, { d: paydayAfter(bstate.days[13].date, bstate.payday) }]);
  }
  const ruleName = { weekly40: 'over 40 a week', daily8: 'over 8 a day', both: 'over 8 a day and 40 a week',
    california: 'California 8 / 12', hosp880: '8 and 80 (over 8 a day, over 80 in the 14 days)', none: 'none' }[bstate.rule] || '';
  rows.push([{ v: 'Overtime', s: S.bold }, ruleName]);
  rows.push([]);

  rows.push(['Date', 'Day', 'In / out', 'Unpaid break (min)', 'Hours (h:mm)', 'Hours (decimal)'].map(v => ({ v, s: S.bold })));
  const weekTotals = [];
  [0, 7].forEach((first, w) => {
    const top = rows.length + 1;
    bstate.days.slice(first, first + 7).forEach((d, k) => {
      const row = r.rows[first + k];
      const punches = d.segments.filter(sg => sg.in || sg.out).map(B.segLabel).join('; ')
        + (row.clocks > 0 ? ' (clocks went back 1h)' : row.clocks < 0 ? ' (clocks went forward 1h)' : '');
      const brk = parseInt(d.breakMins, 10);
      rows.push([
        d.date ? { d: d.date } : '', d.label, punches,
        brk > 0 ? { v: brk, s: S.int } : '',
        row.worked ? { v: row.minutes / 1440, s: S.hm } : '',
        row.worked ? { v: row.minutes / 60, s: S.dec } : ''
      ]);
    });
    const bottom = rows.length;
    const wk = r.weeks[w];
    rows.push([
      { v: 'Week ' + (w + 1) + ' total', s: S.bold }, '', B.fmtDec(wk.reg) + ' regular, ' + B.fmtDec(wk.ot) + ' overtime' + (wk.dt > 0 ? ', ' + B.fmtDec(wk.dt) + ' double' : ''), '',
      { v: wk.minutes / 1440, s: S.boldHm, f: 'SUM(E' + top + ':E' + bottom + ')' },
      { v: wk.minutes / 60, s: S.boldDec, f: 'SUM(F' + top + ':F' + bottom + ')' }
    ]);
    weekTotals.push(rows.length);
  });
  rows.push([]);

  const line = label => v => { rows.push([{ v: label, s: S.text }, '', '', '', '', { v, s: S.dec }]); return rows.length; };
  const regRow = line('Regular hours')(r.reg);
  const otRow = line('Overtime hours')(r.ot);
  const dtRow = r.dt > 0 ? line('Double time hours')(r.dt) : 0;
  rows.push([
    { v: 'Total for the two weeks', s: S.bold }, '', '', '',
    { v: r.totalMinutes / 1440, s: S.boldHm, f: 'E' + weekTotals[0] + '+E' + weekTotals[1] },
    { v: r.totalMinutes / 60, s: S.boldDec, f: 'F' + weekTotals[0] + '+F' + weekTotals[1] }
  ]);
  const rate = parseFloat(bstate.rate) || 0;
  if (rate > 0) {
    rows.push([{ v: 'Hourly rate', s: S.text }, '', '', '', '', { v: rate, s: S.money }]);
    const rateRow = rows.length;
    let f = 'F' + regRow + '*F' + rateRow + '+F' + otRow + '*F' + rateRow + '*1.5';
    if (dtRow) f += '+F' + dtRow + '*F' + rateRow + '*2';
    rows.push([{ v: 'Gross pay', s: S.bold }, '', '', '', '', { v: Math.round(r.pay * 100) / 100, s: S.boldMoney, f }]);
  }

  const year = cardYear(bstate.start, bstate.payday);
  if (year) {
    const list = payCalendar(bstate.start, bstate.payday, year);
    rows.push([]);
    rows.push([{ v: 'Pay periods paid in ' + year + ' (' + list.length + ' paydays, every other ' + WEEKDAYS[bstate.payday] + ')', s: S.bold }]);
    rows.push(['#', '', 'Period starts', 'Period ends', 'Payday'].map(v => ({ v, s: S.bold })));
    list.forEach((p, i) => rows.push([{ v: i + 1, s: S.int }, '', { d: p.start }, { d: p.end }, { d: p.payday }]));
  }
  return rows;
}

const BIWEEKLY_XLSX_WIDTHS = [22, 6, 36, 18, 13, 15];

function biweeklyXlsxName() {
  const d = bstate.days[0].date;
  return 'biweekly-timecard' + (d ? '-' + d : '') + '.xlsx';
}

function bBind() {
  document.getElementById('start').addEventListener('change', e => {
    bstate.start = e.target.value; bstate.calYear = null;
    bstate.days = biweeklyBuildDays(bstate.start); bsave(); bRender();
  });
  document.getElementById('rule').addEventListener('change', e => { bstate.rule = e.target.value; bchanged(); });
  document.getElementById('rate').addEventListener('input', e => { bstate.rate = e.target.value; bchanged(); });
  document.getElementById('employee').addEventListener('input', e => { bstate.employee = e.target.value; bsave(); });
  document.getElementById('pc-payday').addEventListener('change', e => { bstate.payday = +e.target.value; bsave(); bRenderCalendar(); });
  document.getElementById('pc-prev').addEventListener('click', () => {
    bstate.calYear = (bstate.calYear || cardYear(bstate.start, bstate.payday)) - 1; bsave(); bRenderCalendar();
  });
  document.getElementById('pc-next').addEventListener('click', () => {
    bstate.calYear = (bstate.calYear || cardYear(bstate.start, bstate.payday)) + 1; bsave(); bRenderCalendar();
  });
  document.getElementById('btn-xlsx').addEventListener('click', () => {
    B.download(biweeklyXlsxName(), BX.buildXlsx(biweeklyXlsxRows(), BIWEEKLY_XLSX_WIDTHS, 'Time card'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
  document.getElementById('btn-print').addEventListener('click', () => { bRender(); window.print(); });
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every time you have entered?')) return;
    bstate.days = biweeklyBuildDays(bstate.start); bsave(); bRender();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-tool="biweekly"]')) { bload(); bBind(); bRender(); }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { addDays, paydayAfter, payCalendar, cardYear, compute880, biweeklyCompute, biweeklyBuildDays,
                     biweeklyXlsxRows, biweeklyXlsxName, _setState: s => { bstate = s; } };
}
