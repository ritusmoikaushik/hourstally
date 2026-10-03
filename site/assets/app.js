'use strict';

const PERIODS = { week: 7, biweekly: 14, semimonthly: 15, monthly: 31 };
const DAYNAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseTime(raw) {
  const r = parseTimeEx(raw);
  return r === null ? null : r.minutes;
}

// Returns { minutes, ambiguous } - ambiguous means a 12-hour reading with no am/pm,
// so "4" could be 04:00 or 16:00.
function parseTimeEx(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (!s) return null;

  let mer = null;
  if (/a m?$/.test(s) || s.endsWith('am') || s.endsWith('a')) { mer = 'am'; s = s.replace(/am?$/, ''); }
  else if (s.endsWith('pm') || s.endsWith('p')) { mer = 'pm'; s = s.replace(/pm?$/, ''); }

  let h, m, explicit24 = false;
  if (s.includes(':')) {
    const parts = s.split(':');
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1] || '0', 10);
    explicit24 = parts[0].length === 2 && parts[0][0] === '0';
  } else if (/^\d{1,2}$/.test(s)) {
    h = parseInt(s, 10); m = 0;
    explicit24 = s.length === 2 && s[0] === '0';
  } else if (/^\d{3}$/.test(s)) {
    h = parseInt(s.slice(0, 1), 10); m = parseInt(s.slice(1), 10);
  } else if (/^\d{4}$/.test(s)) {
    h = parseInt(s.slice(0, 2), 10); m = parseInt(s.slice(2), 10);
    explicit24 = true;
  } else {
    return null;
  }

  if (isNaN(h) || isNaN(m) || m > 59 || m < 0) return null;

  if (mer === 'am') { if (h === 12) h = 0; else if (h > 12) return null; }
  else if (mer === 'pm') { if (h !== 12) h += 12; if (h > 23) return null; }

  if (h > 23 || h < 0) return null;
  return { minutes: h * 60 + m, ambiguous: mer === null && !explicit24 && h >= 1 && h <= 12 };
}

// The am/pm switch only decides times that were typed without one.
function applyMeridian(t, mer) {
  if (!t || !t.ambiguous || !mer) return t;
  let h = Math.floor(t.minutes / 60), m = t.minutes % 60;
  if (mer === 'pm' && h < 12) h += 12;
  if (mer === 'am' && h === 12) h = 0;
  return { minutes: h * 60 + m, ambiguous: false };
}

// A time typed without am or pm is read as the first time on the clock after the
// punch before it: 7 to 11 is 7am to 11am, and back from lunch at 11:30 is 11:30am.
// The day's first clock-in has nothing before it, so its switch decides. A switch
// that was tapped (inL / outL) or an am/pm typed into the box is never overridden.
function inferMeridians(segs) {
  let prev = null;
  for (const seg of segs) {
    for (const [key, merKey, lockKey] of [['in', 'inM', 'inL'], ['out', 'outM', 'outL']]) {
      const t = parseTimeEx(seg[key]);
      if (t === null) continue;
      if (t.ambiguous && !seg[lockKey] && prev !== null) {
        let best = null;
        for (const mer of ['am', 'pm']) {
          let d = applyMeridian(t, mer).minutes - prev;
          if (d < 0 || (d === 0 && key === 'out')) d += 1440;
          if (best === null || d < best.d) best = { d, mer };
        }
        seg[merKey] = best.mer;
      }
      prev = applyMeridian(t, seg[merKey]).minutes;
    }
  }
}

function segmentMinutes(inRaw, outRaw, inMer, outMer) {
  const a = applyMeridian(parseTimeEx(inRaw), inMer), b = applyMeridian(parseTimeEx(outRaw), outMer);
  if (a === null || b === null) return null;
  const candidates = [b.minutes];
  if (b.ambiguous) candidates.push((b.minutes + 720) % 1440);
  let best = null;
  for (const c of candidates) {
    let d = c - a.minutes;
    if (d <= 0) d += 1440;
    if (best === null || d < best) best = d;
  }
  return best;
}

// The hour a clock change adds to, or takes from, a stretch of work. A card holds what the
// wall clock said, and on the night the clocks go back 10pm to 6am is nine hours worked, not
// eight - pay is owed on the hours worked. The browser's own time zone knows when its clocks
// change, and that Arizona's never do, so no table of dates is kept. from and to are minutes
// after midnight on dateISO as the clock read them; without a date nothing can be known.
function clockChange(dateISO, from, to) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateISO || '');
  if (!m) return 0;
  const y = +m[1], mo = +m[2] - 1, d = +m[3];
  const real = Math.round((new Date(y, mo, d, 0, to) - new Date(y, mo, d, 0, from)) / 60000);
  return real - (to - from);
}

function clockText(clocks) {
  if (clocks > 0) return 'Clocks went back during this shift — the extra hour is counted';
  if (clocks < 0) return 'Clocks went forward during this shift — the lost hour is not counted';
  return '';
}

// bad = something typed that cannot be read. incomplete = one box of a pair still empty.
// clocks = minutes a clock change added (+60) or took away (-60), already in the total.
function dayMinutes(day) {
  let total = 0, any = false, bad = false, missingIn = false, missingOut = false, long = false;
  let pos = null, clocks = 0;
  inferMeridians(day.segments);
  for (const seg of day.segments) {
    if (!seg.in && !seg.out) continue;
    if (seg.in && parseTimeEx(seg.in) === null) bad = true;
    if (seg.out && parseTimeEx(seg.out) === null) bad = true;
    if (!seg.in) missingIn = true;
    if (!seg.out) missingOut = true;
    if (!seg.in || !seg.out) continue;
    const m = segmentMinutes(seg.in, seg.out, seg.inM, seg.outM);
    if (m === null) continue;
    if (m > 16 * 60) long = true;
    // Each pair reads forward from the one before, the way inferMeridians reads the times.
    const a = applyMeridian(parseTimeEx(seg.in), seg.inM).minutes;
    const from = pos === null ? a : pos + (a - pos % 1440 + 1440) % 1440;
    pos = from + m;
    clocks += clockChange(day.date, from, pos);
    total += m; any = true;
  }
  total += clocks;
  const brk = parseInt(day.breakMins, 10);
  if (any && brk > 0) total -= brk;
  if (total < 0) total = 0;
  return { minutes: any ? total : 0, worked: any, bad, missingIn, missingOut, incomplete: missingIn || missingOut, long, clocks };
}

function splitDay(minutes, rule) {
  const h = minutes / 60;
  if (rule === 'daily8' || rule === 'both') {
    return { reg: Math.min(h, 8), ot: Math.max(0, h - 8), dt: 0 };
  }
  if (rule === 'california') {
    return {
      reg: Math.min(h, 8),
      ot: Math.max(0, Math.min(h, 12) - 8),
      dt: Math.max(0, h - 12)
    };
  }
  return { reg: h, ot: 0, dt: 0 };
}

function computeWeek(days, rule) {
  let reg = 0, ot = 0, dt = 0;
  const seventh = rule === 'california' && days.length === 7 && days.every(d => d.worked);
  days.forEach((d, i) => {
    let s = splitDay(d.minutes, rule);
    if (seventh && i === 6) {
      const h = d.minutes / 60;
      s = { reg: 0, ot: Math.min(h, 8), dt: Math.max(0, h - 8) };
    }
    reg += s.reg; ot += s.ot; dt += s.dt;
  });
  if (rule === 'weekly40' || rule === 'both' || rule === 'california') {
    if (reg > 40) { ot += reg - 40; reg = 40; }
  }
  return { reg, ot, dt };
}

function compute(state) {
  const rows = state.days.map(d => {
    const r = dayMinutes(d);
    return { date: d.date, label: d.label, minutes: r.minutes, worked: r.worked, bad: r.bad, clocks: r.clocks };
  });

  let reg = 0, ot = 0, dt = 0;
  for (let i = 0; i < rows.length; i += 7) {
    const w = computeWeek(rows.slice(i, i + 7), state.rule);
    reg += w.reg; ot += w.ot; dt += w.dt;
  }

  const totalMinutes = rows.reduce((a, r) => a + r.minutes, 0);
  const rate = parseFloat(state.rate) || 0;
  const pay = rate > 0 ? reg * rate + ot * rate * 1.5 + dt * rate * 2 : 0;

  return { rows, reg, ot, dt, totalMinutes, pay, daysWorked: rows.filter(r => r.worked).length };
}

function fmtHM(minutes) {
  const m = Math.abs(Math.round(minutes));
  return (minutes < 0 ? '-' : '') + Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
}

function fmtHMlabel(minutes) {
  const m = Math.abs(Math.round(minutes));
  return (minutes < 0 ? '-' : '') + Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
}

function fmtDec(hours) { return (Math.round(hours * 100) / 100).toFixed(2); }

function money(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const XLSX = typeof module !== 'undefined' ? require('./xlsx.js') : window.HourstallyXlsx;

const KEY = 'hourstally.v1';

function newSeg(index) {
  return { in: '', out: '', inM: index === 0 ? 'am' : 'pm', outM: 'pm' };
}

function blankDay(date, label) {
  return { date, label, segments: [newSeg(0)], breakMins: '' };
}

function periodLength(startISO, period) {
  if (!startISO) return PERIODS[period] || 7;
  const start = new Date(startISO + 'T00:00:00');
  if (period === 'monthly') {
    const next = new Date(start.getTime());
    next.setMonth(next.getMonth() + 1);
    return Math.round((next - start) / 86400000);
  }
  if (period === 'semimonthly') {
    const daysInMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
    return start.getDate() <= 15 ? Math.min(15, daysInMonth - start.getDate() + 1) : daysInMonth - start.getDate() + 1;
  }
  return PERIODS[period] || 7;
}

function isoLocal(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function buildDays(startISO, period) {
  const n = periodLength(startISO, period);
  const out = [];
  const start = startISO ? new Date(startISO + 'T00:00:00') : null;
  for (let i = 0; i < n; i++) {
    if (start) {
      const d = new Date(start.getTime());
      d.setDate(d.getDate() + i);
      out.push(blankDay(isoLocal(d), DAYNAMES[d.getDay()]));
    } else {
      out.push(blankDay('', DAYNAMES[i % 7]));
    }
  }
  return out;
}

let state = {
  period: 'week',
  start: '',
  rule: 'weekly40',
  rate: '',
  employee: '',
  days: buildDays('', 'week')
};

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days) && parsed.days.length) {
      parsed.days.forEach(d => d.segments.forEach((sg, i) => {
        if (!sg.inM) sg.inM = i === 0 ? 'am' : 'pm';
        if (!sg.outM) sg.outM = 'pm';
      }));
      state = parsed;
    }
  } catch (e) { /* ignore */ }
}

function el(tag, attrs, kids) {
  const n = document.createElement(tag);
  for (const k in (attrs || {})) {
    if (k === 'class') n.className = attrs[k];
    else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), attrs[k]);
    else n.setAttribute(k, attrs[k]);
  }
  for (const kid of (kids || [])) { if (kid) n.append(kid); }
  return n;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function shortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.getDate() + ' ' + MONTHS[d.getMonth()];
}

function renderDays() {
  const host = document.getElementById('days');
  host.textContent = '';

  state.days.forEach((day, di) => {
    const res = dayMinutes(day);
    const row = el('div', { class: 'day' + (res.bad ? ' bad' : '') });

    row.append(el('div', { class: 'day-name' }, [
      day.label || ('Day ' + (di + 1)),
      day.date ? el('small', {}, [shortDate(day.date)]) : null
    ]));

    const pairs = el('div', { class: 'pairs' });
    day.segments.forEach((seg, si) => {
      const last = si === day.segments.length - 1;
      const inSwitch = merSwitch(seg, 'inM', (day.label || 'Day') + ' clock in ' + (si + 1));
      const outSwitch = merSwitch(seg, 'outM', (day.label || 'Day') + ' clock out ' + (si + 1));
      pairs.append(el('div', { class: 'pair' + ((seg.in || seg.out) ? '' : ' blank') }, [
        el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '9:00' : (si === 0 ? '' : 'in'), value: seg.in, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': (day.label || 'Day') + ' clock in ' + (si + 1),
          oninput: e => { seg.in = e.target.value; seg.inL = false; save(); renderTotals(); },
          onblur: e => tidyTime(e.target, seg, 'in', 'inM', inSwitch)
        }),
        inSwitch,
        el('span', { class: 'to' }, ['to']),
        el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '5:30' : (si === 0 ? '' : 'out'), value: seg.out, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': (day.label || 'Day') + ' clock out ' + (si + 1),
          oninput: e => { seg.out = e.target.value; seg.outL = false; save(); renderTotals(); },
          onblur: e => tidyTime(e.target, seg, 'out', 'outM', outSwitch)
        }),
        outSwitch,
        si > 0 ? el('button', {
          class: 'x', type: 'button', title: 'Remove this in and out',
          'aria-label': 'Remove in and out ' + (si + 1),
          onclick: () => { day.segments.splice(si, 1); save(); render(); }
        }, ['×']) : el('span', { class: 'slot' }),
        last ? el('button', {
          class: 'add', type: 'button', title: 'Add another clock in and out for this day',
          'aria-label': 'Add another in and out for ' + (day.label || 'this day'),
          onclick: () => { day.segments.push(newSeg(day.segments.length)); save(); render(); focusLastIn(di); }
        }, ['+']) : el('span', { class: 'slot' })
      ]));
    });
    row.append(pairs);

    row.append(el('div', { class: 'brkwrap' }, [
      el('span', {}, ['Unpaid break']),
      el('input', {
        class: 'brk', type: 'number', min: '0', step: '5', placeholder: '0', value: day.breakMins,
        'aria-label': (day.label || 'Day') + ' unpaid break minutes',
        oninput: e => { day.breakMins = e.target.value; save(); renderTotals(); }
      }),
      el('span', {}, ['min'])
    ]));

    row.append(el('div', { class: 'totals' + (res.worked ? '' : ' empty') }, [
      el('div', { class: 'hm' }, [res.worked ? fmtHMlabel(res.minutes) : '—']),
      el('div', { class: 'dec' }, [res.worked ? fmtDec(res.minutes / 60) : ''])
    ]));
    row.append(el('div', { class: 'daynotes' }, [el('span', { class: 'note' }, [noteText(res)])]));
    row.classList.toggle('long', res.long);
    row.classList.toggle('clocked', !!res.clocks);
    row.classList.toggle('noted', !!noteText(res));

    host.append(row);
  });
}

// On leaving a box, show what was understood: 852 -> 8:52, 7 -> 7:00, 1930 -> 7:30 with pm.
// A typed am, pm or 24-hour time sets the switch and locks it, the same as a tap.
// onChange is the page's own save and redraw; /with-lunch passes its own, so it
// never writes over the time card saved by the home page.
function tidyTime(input, seg, key, merKey, switchEl, onChange) {
  const r = parseTimeEx(input.value);
  if (r === null) return;
  let h = Math.floor(r.minutes / 60), m = r.minutes % 60;
  if (!r.ambiguous) {
    seg[merKey] = h >= 12 ? 'pm' : 'am';
    seg[merKey.replace('M', 'L')] = true;
    paintSwitch(switchEl, seg[merKey]);
    h = h % 12 === 0 ? 12 : h % 12;
  }
  const clean = h + ':' + String(m).padStart(2, '0');
  seg[key] = clean;
  input.value = clean;
  (onChange || (() => { save(); renderTotals(); }))();
}

function paintSwitch(b, mer) {
  if (!b || b.textContent === mer) return;
  b.textContent = mer;
  b.className = 'mer ' + mer;
  b.setAttribute('aria-label', b.dataset.label + ' ' + mer + ', tap to switch');
}

// The switches show what the card is counting, including a reading guessed
// after they were drawn. A row's switches run in, out, in, out.
function syncSwitches(row, segs) {
  const b = row.querySelectorAll('.mer');
  segs.forEach((seg, i) => { paintSwitch(b[2 * i], seg.inM); paintSwitch(b[2 * i + 1], seg.outM); });
}

function merSwitch(seg, key, label, onChange) {
  const b = el('button', {
    class: 'mer ' + seg[key], type: 'button', 'data-label': label,
    'aria-label': label + ' ' + seg[key] + ', tap to switch',
    title: 'Switch am / pm',
    onclick: () => {
      seg[key] = seg[key] === 'am' ? 'pm' : 'am';
      seg[key.replace('M', 'L')] = true;
      paintSwitch(b, seg[key]);
      (onChange || (() => { save(); renderTotals(); }))();
    }
  }, [seg[key]]);
  return b;
}

// Red for anything that stops the card being submitted; amber for a doubt.
function noteText(res) {
  if (res.bad) return 'Cannot read a time on this line';
  if (res.missingIn && res.missingOut) return 'A clock-in and a clock-out are missing';
  if (res.missingIn) return 'A clock-in is missing';
  if (res.missingOut) return 'A clock-out is missing';
  if (res.long) return 'A shift over 16 hours — check am and pm';
  return clockText(res.clocks);
}

function focusLastIn(di) {
  const rows = document.querySelectorAll('#days .day');
  const ins = rows[di] && rows[di].querySelectorAll('input.time');
  if (ins && ins.length) ins[ins.length - 2].focus();
}

function renderTotals() {
  const r = compute(state);
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set('t-total-hm', fmtHMlabel(r.totalMinutes));
  const stub = document.querySelector('.stub-value'); if (stub) stub.classList.toggle('empty', r.totalMinutes === 0);
  set('t-total-dec', fmtDec(r.totalMinutes / 60));
  set('t-reg', fmtDec(r.reg));
  set('t-ot', fmtDec(r.ot));
  set('t-dt', fmtDec(r.dt));
  set('t-days', String(r.daysWorked));

  const payRow = document.getElementById('payrow');
  if (r.pay > 0) { payRow.hidden = false; set('t-pay', money(r.pay)); } else { payRow.hidden = true; }
  const dtRow = document.getElementById('dtrow');
  if (dtRow) dtRow.hidden = r.dt <= 0;
  document.getElementById('days').classList.toggle('filled',
    state.days.some(d => d.segments.some(s => s.in || s.out)));

  document.querySelectorAll('#days .day').forEach((row, i) => {
    const res = dayMinutes(state.days[i]);
    syncSwitches(row, state.days[i].segments);
    // A pair drawn empty is hidden in print; typing into it has to undo that.
    row.querySelectorAll('.pair').forEach((el, si) => {
      const sg = state.days[i].segments[si];
      el.classList.toggle('blank', !(sg && (sg.in || sg.out)));
    });
    const hm = row.querySelector('.hm'), dec = row.querySelector('.dec');
    hm.textContent = res.worked ? fmtHMlabel(res.minutes) : '—';
    dec.textContent = res.worked ? fmtDec(res.minutes / 60) : '';
    row.querySelector('.totals').classList.toggle('empty', !res.worked);
    row.classList.toggle('bad', res.bad);
    row.classList.toggle('long', res.long);
    row.classList.toggle('clocked', !!res.clocks);
    const text = noteText(res);
    row.querySelector('.daynotes .note').textContent = text;
    row.classList.toggle('noted', !!text);
  });
}

function render() {
  document.getElementById('period').value = state.period;
  document.getElementById('start').value = state.start;
  document.getElementById('rule').value = state.rule;
  document.getElementById('rate').value = state.rate;
  document.getElementById('employee').value = state.employee;
  renderDays();
  renderTotals();
}

function fmt12(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + String(m).padStart(2, '0') + (h < 12 ? 'am' : 'pm');
}

function segLabel(seg) {
  const a = applyMeridian(parseTimeEx(seg.in), seg.inM), b = applyMeridian(parseTimeEx(seg.out), seg.outM);
  return (a ? fmt12(a.minutes) : (seg.in || '?')) + ' - ' + (b ? fmt12(b.minutes) : (seg.out || '?'));
}

// The sheet Excel opens. Hours are real numbers, not text: h:mm cells hold a fraction of a day
// with an [h]:mm format, decimal cells hold exact minutes / 60 shown to two places. The total,
// and the pay if a rate was given, are formulas, so a day corrected in Excel carries through.
function toXlsxRows() {
  const r = compute(state);
  const S = XLSX.STYLE;
  const rows = [];
  const employee = (state.employee || '').trim();
  if (employee) rows.push([{ v: 'Employee', s: S.bold }, employee]);
  if (state.days.length && state.days[0].date) {
    rows.push([{ v: 'Period', s: S.bold }, { d: state.days[0].date }, 'to', { d: state.days[state.days.length - 1].date }]);
  }
  if (rows.length) rows.push([]);

  rows.push(['Date', 'Day', 'In / out', 'Unpaid break (min)', 'Hours (h:mm)', 'Hours (decimal)'].map(v => ({ v, s: S.bold })));
  const firstDay = rows.length + 1;
  state.days.forEach((d, i) => {
    const row = r.rows[i];
    const punches = d.segments.filter(sg => sg.in || sg.out).map(segLabel).join('; ')
      + (row.clocks > 0 ? ' (clocks went back 1h)' : row.clocks < 0 ? ' (clocks went forward 1h)' : '');
    const brk = parseInt(d.breakMins, 10);
    rows.push([
      d.date ? { d: d.date } : '',
      d.label,
      punches,
      brk > 0 ? { v: brk, s: S.int } : '',
      row.worked ? { v: row.minutes / 1440, s: S.hm } : '',
      row.worked ? { v: row.minutes / 60, s: S.dec } : ''
    ]);
  });
  const lastDay = rows.length;
  rows.push([]);

  const line = (label, v, bold) => { rows.push([{ v: label, s: bold ? S.bold : S.text }, '', '', '', '', { v, s: bold ? S.boldDec : S.dec }]); return rows.length; };
  const regRow = line('Regular hours', r.reg);
  const otRow = line('Overtime hours', r.ot);
  const dtRow = r.dt > 0 ? line('Double time hours', r.dt) : 0;
  rows.push([
    { v: 'Total hours', s: S.bold }, '', '', '',
    { v: r.totalMinutes / 1440, s: S.boldHm, f: 'SUM(E' + firstDay + ':E' + lastDay + ')' },
    { v: r.totalMinutes / 60, s: S.boldDec, f: 'SUM(F' + firstDay + ':F' + lastDay + ')' }
  ]);

  const rate = parseFloat(state.rate) || 0;
  if (rate > 0) {
    rows.push([{ v: 'Hourly rate', s: S.text }, '', '', '', '', { v: rate, s: S.money }]);
    const rateRow = rows.length;
    let f = 'F' + regRow + '*F' + rateRow + '+F' + otRow + '*F' + rateRow + '*1.5';
    if (dtRow) f += '+F' + dtRow + '*F' + rateRow + '*2';
    rows.push([{ v: 'Gross pay', s: S.bold }, '', '', '', '', { v: Math.round(r.pay * 100) / 100, s: S.boldMoney, f }]);
  }
  return rows;
}

const XLSX_WIDTHS = [13, 6, 36, 18, 13, 15];

function xlsxName() {
  const d = state.days.length && state.days[0].date;
  return 'timecard' + (d ? '-' + d : '') + '.xlsx';
}

function download(name, data, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function bind() {
  document.getElementById('period').addEventListener('change', e => {
    state.period = e.target.value;
    state.days = buildDays(state.start, state.period);
    save(); render();
  });
  document.getElementById('start').addEventListener('change', e => {
    state.start = e.target.value;
    state.days = buildDays(state.start, state.period);
    save(); render();
  });
  document.getElementById('rule').addEventListener('change', e => { state.rule = e.target.value; save(); renderTotals(); });
  document.getElementById('rate').addEventListener('input', e => { state.rate = e.target.value; save(); renderTotals(); });
  document.getElementById('employee').addEventListener('input', e => { state.employee = e.target.value; save(); });

  document.getElementById('btn-xlsx').addEventListener('click', () => {
    download(xlsxName(), XLSX.buildXlsx(toXlsxRows(), XLSX_WIDTHS, 'Time card'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
  document.getElementById('btn-print').addEventListener('click', () => { render(); window.print(); });
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every time you have entered?')) return;
    state.days = buildDays(state.start, state.period);
    save(); render();
  });
}

// The engine is shared, the page is not: /with-lunch loads this file for the
// arithmetic and runs its own screen, so the time card only wires itself up
// where its own section is on the page.
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-tool="timecard"]')) { load(); bind(); render(); }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { fmtHMlabel, toXlsxRows, xlsxName, XLSX_WIDTHS, _setState: s => { state = s; }, parseTime, parseTimeEx, applyMeridian, inferMeridians, fmt12, segmentMinutes, clockChange, clockText, dayMinutes, splitDay, computeWeek, compute, fmtHM, fmtDec, periodLength, buildDays };
}
