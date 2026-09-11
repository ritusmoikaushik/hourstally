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

function dayMinutes(day) {
  let total = 0, any = false, bad = false;
  for (const seg of day.segments) {
    if (!seg.in && !seg.out) continue;
    const m = segmentMinutes(seg.in, seg.out, seg.inM, seg.outM);
    if (m === null) { bad = true; continue; }
    total += m; any = true;
  }
  const brk = parseInt(day.breakMins, 10);
  if (any && brk > 0) total -= brk;
  if (total < 0) total = 0;
  return { minutes: any ? total : 0, worked: any, bad };
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
    return { date: d.date, label: d.label, minutes: r.minutes, worked: r.worked, bad: r.bad };
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

function fmtDec(hours) { return (Math.round(hours * 100) / 100).toFixed(2); }

function money(n) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
      day.date ? el('small', {}, [shortDate(day.date)]) : null,
      el('span', { class: 'badnote' }, ['Check a time on this line'])
    ]));

    const pairs = el('div', { class: 'pairs' });
    day.segments.forEach((seg, si) => {
      const last = si === day.segments.length - 1;
      pairs.append(el('div', { class: 'pair' }, [
        el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '9:00' : (si === 0 ? '' : 'in'), value: seg.in, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': (day.label || 'Day') + ' clock in ' + (si + 1),
          oninput: e => { seg.in = e.target.value; save(); renderTotals(); }
        }),
        merSwitch(seg, 'inM', (day.label || 'Day') + ' clock in ' + (si + 1)),
        el('span', { class: 'to' }, ['to']),
        el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '5:30' : (si === 0 ? '' : 'out'), value: seg.out, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': (day.label || 'Day') + ' clock out ' + (si + 1),
          oninput: e => { seg.out = e.target.value; save(); renderTotals(); }
        }),
        merSwitch(seg, 'outM', (day.label || 'Day') + ' clock out ' + (si + 1)),
        si > 0 ? el('button', {
          class: 'x', type: 'button', title: 'Remove this in and out',
          'aria-label': 'Remove in and out ' + (si + 1),
          onclick: () => { day.segments.splice(si, 1); save(); render(); }
        }, ['×']) : null,
        last ? el('button', {
          class: 'add', type: 'button', title: 'Add another clock in and out for this day',
          'aria-label': 'Add another in and out for ' + (day.label || 'this day'),
          onclick: () => { day.segments.push(newSeg(day.segments.length)); save(); render(); focusLastIn(di); }
        }, ['+']) : null
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

    row.append(el('div', { class: 'totals' }, [
      el('div', { class: 'hm' + (res.worked ? '' : ' empty') }, [res.worked ? fmtHM(res.minutes) : '0:00']),
      el('div', { class: 'dec' + (res.worked ? '' : ' empty') }, [res.worked ? fmtDec(res.minutes / 60) : '0.00'])
    ]));

    host.append(row);
  });
}

function merSwitch(seg, key, label) {
  const b = el('button', {
    class: 'mer ' + seg[key], type: 'button',
    'aria-label': label + ' ' + seg[key] + ', tap to switch',
    title: 'Switch am / pm',
    onclick: () => {
      seg[key] = seg[key] === 'am' ? 'pm' : 'am';
      b.textContent = seg[key]; b.className = 'mer ' + seg[key];
      save(); renderTotals();
    }
  }, [seg[key]]);
  return b;
}

function focusLastIn(di) {
  const rows = document.querySelectorAll('#days .day');
  const ins = rows[di] && rows[di].querySelectorAll('input.time');
  if (ins && ins.length) ins[ins.length - 2].focus();
}

function renderTotals() {
  const r = compute(state);
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set('t-total-hm', fmtHM(r.totalMinutes));
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

  document.querySelectorAll('#days .day').forEach((row, i) => {
    const res = dayMinutes(state.days[i]);
    const hm = row.querySelector('.hm'), dec = row.querySelector('.dec');
    hm.textContent = res.worked ? fmtHM(res.minutes) : '0:00';
    dec.textContent = res.worked ? fmtDec(res.minutes / 60) : '0.00';
    hm.classList.toggle('empty', !res.worked);
    dec.classList.toggle('empty', !res.worked);
    row.classList.toggle('bad', res.bad);
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

function tableRows() {
  const r = compute(state);
  const head = ['Date', 'Day', 'In / out', 'Unpaid break (min)', 'Hours (h:mm)', 'Hours (decimal)'];
  const body = state.days.map((d, i) => {
    const punches = d.segments.filter(s => s.in || s.out)
      .map(segLabel).join('; ');
    const row = r.rows[i];
    return [d.date, d.label, punches, d.breakMins || '0',
      row.worked ? fmtHM(row.minutes) : '', row.worked ? fmtDec(row.minutes / 60) : ''];
  });
  const foot = [[], ['Regular hours', fmtDec(r.reg)], ['Overtime hours', fmtDec(r.ot)]];
  if (r.dt > 0) foot.push(['Double time hours', fmtDec(r.dt)]);
  foot.push(['Total hours', fmtDec(r.totalMinutes / 60)]);
  if (r.pay > 0) foot.push(['Gross pay', money(r.pay)]);
  return { head, body, foot };
}

function toCSV() {
  const t = tableRows();
  const esc = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const lines = [];
  if (state.employee) lines.push([esc('Employee'), esc(state.employee)].join(','));
  lines.push(t.head.map(esc).join(','));
  for (const row of t.body) lines.push(row.map(esc).join(','));
  for (const row of t.foot) lines.push(row.map(esc).join(','));
  return '﻿' + lines.join('\r\n');
}

function download(name, text, mime) {
  const blob = new Blob([text], { type: mime });
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

  document.getElementById('btn-csv').addEventListener('click', () => {
    download('timecard.csv', toCSV(), 'text/csv;charset=utf-8');
  });
  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every time you have entered?')) return;
    state.days = buildDays(state.start, state.period);
    save(); render();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => { load(); bind(); render(); });
}

if (typeof module !== 'undefined') {
  module.exports = { parseTime, parseTimeEx, applyMeridian, fmt12, segmentMinutes, dayMinutes, splitDay, computeWeek, compute, fmtHM, fmtDec, periodLength, buildDays };
}
