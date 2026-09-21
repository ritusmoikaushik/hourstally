'use strict';

// Time card with a lunch break. One clock in and one clock out a day, and the
// lunch comes off automatically by a rule - the way most employer systems do
// it, and the reason most pay disputes about lunch exist. The arithmetic for
// reading a time, splitting overtime and building the period is in app.js;
// this file is only what is different about this card.

const L = typeof module !== 'undefined' ? require('./app.js') : window;
const LX = typeof module !== 'undefined' ? require('./xlsx.js') : window.HourstallyXlsx;
const LUNCH_KEY = 'hourstally.lunch.v1';

// When the lunch comes off. The number is the shift length, in minutes, the
// shift has to run past before anything is deducted; 0 deducts every day.
const LUNCH_WHEN = { always: 0, over5: 300, over6: 360, over8: 480 };

function lunchBlankDay(date, label) {
  return { date, label, in: '', out: '', inM: 'am', outM: 'pm', lunch: '', through: false };
}

function lunchBuildDays(startISO, period) {
  return L.buildDays(startISO, period).map(d => lunchBlankDay(d.date, d.label));
}

// How much lunch comes off one day. The day's own box wins, then "worked
// through", then the rule. Returns { minutes, auto } - auto is true when the
// rule decided it, so the screen can show it as a given rather than as typed.
function lunchMinutes(shift, cfg, day) {
  if (day.through) return { minutes: 0, auto: false };
  if (day.lunch !== '' && day.lunch != null) {
    const n = parseInt(day.lunch, 10);
    return { minutes: isNaN(n) || n < 0 ? 0 : n, auto: false };
  }
  const after = LUNCH_WHEN[cfg.when] == null ? LUNCH_WHEN.over6 : LUNCH_WHEN[cfg.when];
  const len = parseInt(cfg.minutes, 10);
  const lunch = isNaN(len) || len < 0 ? 0 : len;
  return { minutes: shift > after ? lunch : 0, auto: true };
}

function lunchDay(day, cfg) {
  const bad = (day.in && L.parseTimeEx(day.in) === null) || (day.out && L.parseTimeEx(day.out) === null);
  const missingIn = !day.in && !!day.out, missingOut = !!day.in && !day.out;
  if (!day.in || !day.out || bad) {
    return { shift: 0, lunch: 0, auto: true, minutes: 0, worked: false, bad, missingIn, missingOut, long: false };
  }
  const shift = L.segmentMinutes(day.in, day.out, day.inM, day.outM);
  if (shift === null) {
    return { shift: 0, lunch: 0, auto: true, minutes: 0, worked: false, bad: true, missingIn, missingOut, long: false };
  }
  const l = lunchMinutes(shift, cfg, day);
  const minutes = Math.max(0, shift - l.minutes);
  return { shift, lunch: l.minutes, auto: l.auto, minutes, worked: true, bad: false,
           missingIn: false, missingOut: false, long: shift > 16 * 60, through: !!day.through };
}

function lunchCompute(state) {
  const cfg = { minutes: state.lunchMinutes, when: state.lunchWhen };
  const rows = state.days.map(d => {
    const r = lunchDay(d, cfg);
    return Object.assign({ date: d.date, label: d.label }, r);
  });

  let reg = 0, ot = 0, dt = 0;
  for (let i = 0; i < rows.length; i += 7) {
    const w = L.computeWeek(rows.slice(i, i + 7), state.rule);
    reg += w.reg; ot += w.ot; dt += w.dt;
  }

  const totalMinutes = rows.reduce((a, r) => a + r.minutes, 0);
  const shiftMinutes = rows.reduce((a, r) => a + r.shift, 0);
  const lunchTotal = rows.reduce((a, r) => a + r.lunch, 0);
  const lunchDays = rows.filter(r => r.lunch > 0).length;
  const throughDays = rows.filter(r => r.worked && r.through).length;
  const rate = parseFloat(state.rate) || 0;
  const pay = rate > 0 ? reg * rate + ot * rate * 1.5 + dt * rate * 2 : 0;

  return { rows, reg, ot, dt, totalMinutes, shiftMinutes, lunchTotal, lunchDays, throughDays, pay,
           daysWorked: rows.filter(r => r.worked).length };
}

// ------------------------------------------------------------------ screen

let lstate = {
  period: 'week', start: '', rule: 'weekly40', rate: '', employee: '',
  lunchMinutes: '30', lunchWhen: 'over6',
  days: lunchBuildDays('', 'week')
};

function lsave() {
  try { localStorage.setItem(LUNCH_KEY, JSON.stringify(lstate)); } catch (e) { /* private mode */ }
}

function lload() {
  try {
    const raw = localStorage.getItem(LUNCH_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days) && parsed.days.length) lstate = parsed;
  } catch (e) { /* ignore */ }
}

function lunchNote(res) {
  if (res.bad) return 'Cannot read a time on this line';
  if (res.missingIn) return 'A clock-in is missing';
  if (res.missingOut) return 'A clock-out is missing';
  if (res.long) return 'A shift over 16 hours — check am and pm';
  if (res.worked && res.through) return 'Worked through lunch — nothing deducted';
  return '';
}

function lunchRenderDays() {
  const host = document.getElementById('days');
  host.textContent = '';
  const cfg = { minutes: lstate.lunchMinutes, when: lstate.lunchWhen };

  lstate.days.forEach((day, di) => {
    const res = lunchDay(day, cfg);
    const row = L.el('div', { class: 'day' + (res.bad ? ' bad' : '') });

    row.append(L.el('div', { class: 'day-name' }, [
      day.label || ('Day ' + (di + 1)),
      day.date ? L.el('small', {}, [L.shortDate(day.date)]) : null
    ]));

    const inSwitch = L.merSwitch(day, 'inM', (day.label || 'Day') + ' clock in');
    const outSwitch = L.merSwitch(day, 'outM', (day.label || 'Day') + ' clock out');
    const pairs = L.el('div', { class: 'pairs' }, [
      L.el('div', { class: 'pair single' + ((day.in || day.out) ? '' : ' blank') }, [
        L.el('input', {
          class: 'time', placeholder: di === 0 ? '8:00' : '', value: day.in, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': (day.label || 'Day') + ' clock in',
          oninput: e => { day.in = e.target.value; lsave(); lunchRenderTotals(); },
          onblur: e => L.tidyTime(e.target, day, 'in', 'inM', inSwitch)
        }),
        inSwitch,
        L.el('span', { class: 'to' }, ['to']),
        L.el('input', {
          class: 'time', placeholder: di === 0 ? '4:30' : '', value: day.out, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': (day.label || 'Day') + ' clock out',
          oninput: e => { day.out = e.target.value; lsave(); lunchRenderTotals(); },
          onblur: e => L.tidyTime(e.target, day, 'out', 'outM', outSwitch)
        }),
        outSwitch
      ])
    ]);
    row.append(pairs);

    // The lunch box shows what the rule decided as a placeholder, and holds
    // what was typed over it. "Worked through" zeroes the day and says so.
    const lunchInput = L.el('input', {
      class: 'brk', type: 'number', min: '0', step: '5', placeholder: '', value: day.lunch,
      'aria-label': (day.label || 'Day') + ' lunch minutes deducted',
      oninput: e => { day.lunch = e.target.value; if (e.target.value !== '') day.through = false; lsave(); lunchRenderTotals(); }
    });
    const through = L.el('button', {
      class: 'through' + (day.through ? ' on' : ''), type: 'button',
      title: 'No lunch was taken this day - deduct nothing',
      'aria-pressed': day.through ? 'true' : 'false',
      'aria-label': (day.label || 'Day') + ': worked through lunch',
      onclick: () => { day.through = !day.through; if (day.through) day.lunch = ''; lsave(); lunchRenderTotals(); }
    }, ['worked through']);
    row.append(L.el('div', { class: 'brkwrap lunchwrap' }, [
      L.el('span', {}, ['Lunch']), lunchInput, L.el('span', {}, ['min']), through
    ]));

    row.append(L.el('div', { class: 'totals' + (res.worked ? '' : ' empty') }, [
      L.el('div', { class: 'hm' }, [res.worked ? L.fmtHMlabel(res.minutes) : '—']),
      L.el('div', { class: 'dec' }, [res.worked ? L.fmtDec(res.minutes / 60) : ''])
    ]));
    row.append(L.el('div', { class: 'daynotes' }, [L.el('span', { class: 'note' }, [lunchNote(res)])]));
    host.append(row);
  });
  lunchRenderTotals();
}

function lunchRenderTotals() {
  const r = lunchCompute(lstate);
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set('t-total-hm', L.fmtHMlabel(r.totalMinutes));
  const stub = document.querySelector('.stub-value'); if (stub) stub.classList.toggle('empty', r.totalMinutes === 0);
  set('t-total-dec', L.fmtDec(r.totalMinutes / 60));
  set('t-reg', L.fmtDec(r.reg));
  set('t-ot', L.fmtDec(r.ot));
  set('t-dt', L.fmtDec(r.dt));
  set('t-days', String(r.daysWorked));
  set('t-shift', L.fmtDec(r.shiftMinutes / 60));
  set('t-lunch', L.fmtHMlabel(r.lunchTotal) + (r.lunchDays ? ' on ' + r.lunchDays + (r.lunchDays === 1 ? ' day' : ' days') : ''));
  const throughRow = document.getElementById('throughrow');
  if (throughRow) { throughRow.hidden = r.throughDays === 0; set('t-through', String(r.throughDays)); }
  const payRow = document.getElementById('payrow');
  if (r.pay > 0) { payRow.hidden = false; set('t-pay', L.money(r.pay)); } else { payRow.hidden = true; }
  const dtRow = document.getElementById('dtrow');
  if (dtRow) dtRow.hidden = r.dt <= 0;

  const cfg = { minutes: lstate.lunchMinutes, when: lstate.lunchWhen };
  document.querySelectorAll('#days .day').forEach((row, i) => {
    const day = lstate.days[i];
    const res = lunchDay(day, cfg);
    row.querySelector('.hm').textContent = res.worked ? L.fmtHMlabel(res.minutes) : '—';
    row.querySelector('.dec').textContent = res.worked ? L.fmtDec(res.minutes / 60) : '';
    row.querySelector('.totals').classList.toggle('empty', !res.worked);
    row.classList.toggle('bad', res.bad);
    row.classList.toggle('long', res.long);
    const box = row.querySelector('input.brk');
    box.placeholder = res.worked && res.auto ? String(res.lunch) : '';
    box.value = day.lunch;
    const t = row.querySelector('.through');
    t.classList.toggle('on', !!day.through);
    t.setAttribute('aria-pressed', day.through ? 'true' : 'false');
    const text = lunchNote(res);
    row.querySelector('.daynotes .note').textContent = text;
    row.classList.toggle('noted', !!text);
    row.classList.toggle('nolunch', !!(res.worked && res.through));
  });
}

function lunchRender() {
  document.getElementById('period').value = lstate.period;
  document.getElementById('start').value = lstate.start;
  document.getElementById('rule').value = lstate.rule;
  document.getElementById('rate').value = lstate.rate;
  document.getElementById('employee').value = lstate.employee;
  document.getElementById('lunch-min').value = lstate.lunchMinutes;
  document.getElementById('lunch-when').value = lstate.lunchWhen;
  lunchRenderDays();
}

// The sheet. A Shift column and a Lunch column sit between the punches and
// the hours, so the deduction is on the record and not folded into a total.
function lunchXlsxRows() {
  const r = lunchCompute(lstate);
  const S = LX.STYLE;
  const rows = [];
  const employee = (lstate.employee || '').trim();
  if (employee) rows.push([{ v: 'Employee', s: S.bold }, employee]);
  if (lstate.days.length && lstate.days[0].date) {
    rows.push([{ v: 'Period', s: S.bold }, { d: lstate.days[0].date }, 'to', { d: lstate.days[lstate.days.length - 1].date }]);
  }
  const when = { always: 'every day', over5: 'when the shift runs over 5 hours',
                 over6: 'when the shift runs over 6 hours', over8: 'when the shift runs over 8 hours' }[lstate.lunchWhen] || '';
  rows.push([{ v: 'Lunch rule', s: S.bold }, (parseInt(lstate.lunchMinutes, 10) || 0) + ' minutes ' + when]);
  rows.push([]);

  rows.push(['Date', 'Day', 'In', 'Out', 'Shift (h:mm)', 'Lunch (min)', 'Hours (h:mm)', 'Hours (decimal)'].map(v => ({ v, s: S.bold })));
  const firstDay = rows.length + 1;
  lstate.days.forEach((d, i) => {
    const row = r.rows[i];
    const a = L.applyMeridian(L.parseTimeEx(d.in), d.inM), b = L.applyMeridian(L.parseTimeEx(d.out), d.outM);
    rows.push([
      d.date ? { d: d.date } : '',
      d.label,
      a ? L.fmt12(a.minutes) : (d.in || ''),
      b ? L.fmt12(b.minutes) : (d.out || ''),
      row.worked ? { v: row.shift / 1440, s: S.hm } : '',
      row.worked ? { v: row.lunch, s: S.int } : '',
      row.worked ? { v: row.minutes / 1440, s: S.hm } : '',
      row.worked ? { v: row.minutes / 60, s: S.dec } : ''
    ]);
  });
  const lastDay = rows.length;
  rows.push([]);

  const line = (label, v, bold) => { rows.push([{ v: label, s: bold ? S.bold : S.text }, '', '', '', '', '', '', { v, s: bold ? S.boldDec : S.dec }]); return rows.length; };
  rows.push([{ v: 'Lunch deducted (min)', s: S.text }, '', '', '', '', { v: r.lunchTotal, s: S.int, f: 'SUM(F' + firstDay + ':F' + lastDay + ')' }, '', '']);
  const regRow = line('Regular hours', r.reg);
  const otRow = line('Overtime hours', r.ot);
  const dtRow = r.dt > 0 ? line('Double time hours', r.dt) : 0;
  rows.push([
    { v: 'Total hours', s: S.bold }, '', '', '', '', '',
    { v: r.totalMinutes / 1440, s: S.boldHm, f: 'SUM(G' + firstDay + ':G' + lastDay + ')' },
    { v: r.totalMinutes / 60, s: S.boldDec, f: 'SUM(H' + firstDay + ':H' + lastDay + ')' }
  ]);

  const rate = parseFloat(lstate.rate) || 0;
  if (rate > 0) {
    rows.push([{ v: 'Hourly rate', s: S.text }, '', '', '', '', '', '', { v: rate, s: S.money }]);
    const rateRow = rows.length;
    let f = 'H' + regRow + '*H' + rateRow + '+H' + otRow + '*H' + rateRow + '*1.5';
    if (dtRow) f += '+H' + dtRow + '*H' + rateRow + '*2';
    rows.push([{ v: 'Gross pay', s: S.bold }, '', '', '', '', '', '', { v: Math.round(r.pay * 100) / 100, s: S.boldMoney, f }]);
  }
  return rows;
}

const LUNCH_XLSX_WIDTHS = [13, 6, 10, 10, 13, 12, 13, 15];

function lunchXlsxName() {
  const d = lstate.days.length && lstate.days[0].date;
  return 'timecard-lunch' + (d ? '-' + d : '') + '.xlsx';
}

function lunchBind() {
  const rebuild = () => { lstate.days = lunchBuildDays(lstate.start, lstate.period); lsave(); lunchRender(); };
  document.getElementById('period').addEventListener('change', e => { lstate.period = e.target.value; rebuild(); });
  document.getElementById('start').addEventListener('change', e => { lstate.start = e.target.value; rebuild(); });
  document.getElementById('rule').addEventListener('change', e => { lstate.rule = e.target.value; lsave(); lunchRenderTotals(); });
  document.getElementById('rate').addEventListener('input', e => { lstate.rate = e.target.value; lsave(); lunchRenderTotals(); });
  document.getElementById('employee').addEventListener('input', e => { lstate.employee = e.target.value; lsave(); });
  document.getElementById('lunch-min').addEventListener('input', e => { lstate.lunchMinutes = e.target.value; lsave(); lunchRenderTotals(); });
  document.getElementById('lunch-when').addEventListener('change', e => { lstate.lunchWhen = e.target.value; lsave(); lunchRenderTotals(); });

  document.getElementById('btn-xlsx').addEventListener('click', () => {
    L.download(lunchXlsxName(), LX.buildXlsx(lunchXlsxRows(), LUNCH_XLSX_WIDTHS, 'Time card'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
  document.getElementById('btn-print').addEventListener('click', () => { lunchRender(); window.print(); });
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every time you have entered?')) return;
    lstate.days = lunchBuildDays(lstate.start, lstate.period);
    lsave(); lunchRender();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-tool="lunch"]')) { lload(); lunchBind(); lunchRender(); }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { LUNCH_WHEN, lunchMinutes, lunchDay, lunchCompute, lunchBuildDays, lunchXlsxRows, lunchXlsxName,
                     _setState: s => { lstate = s; } };
}
