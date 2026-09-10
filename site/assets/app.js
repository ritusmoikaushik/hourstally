'use strict';

const PERIODS = { week: 7, biweekly: 14, semimonthly: 15, monthly: 31 };
const DAYNAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function parseTime(raw) {
  if (!raw) return null;
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, '').replace(/\./g, '');
  if (!s) return null;

  let mer = null;
  if (/a m?$/.test(s) || s.endsWith('am') || s.endsWith('a')) { mer = 'am'; s = s.replace(/am?$/, ''); }
  else if (s.endsWith('pm') || s.endsWith('p')) { mer = 'pm'; s = s.replace(/pm?$/, ''); }

  let h, m;
  if (s.includes(':')) {
    const parts = s.split(':');
    h = parseInt(parts[0], 10);
    m = parseInt(parts[1] || '0', 10);
  } else if (/^\d{1,2}$/.test(s)) {
    h = parseInt(s, 10); m = 0;
  } else if (/^\d{3}$/.test(s)) {
    h = parseInt(s.slice(0, 1), 10); m = parseInt(s.slice(1), 10);
  } else if (/^\d{4}$/.test(s)) {
    h = parseInt(s.slice(0, 2), 10); m = parseInt(s.slice(2), 10);
  } else {
    return null;
  }

  if (isNaN(h) || isNaN(m) || m > 59 || m < 0) return null;

  if (mer === 'am') { if (h === 12) h = 0; else if (h > 12) return null; }
  else if (mer === 'pm') { if (h !== 12) h += 12; if (h > 23) return null; }

  if (h > 23 || h < 0) return null;
  return h * 60 + m;
}

function segmentMinutes(inRaw, outRaw) {
  const a = parseTime(inRaw), b = parseTime(outRaw);
  if (a === null || b === null) return null;
  let d = b - a;
  if (d < 0) d += 1440;
  return d;
}

function dayMinutes(day) {
  let total = 0, any = false, bad = false;
  for (const seg of day.segments) {
    if (!seg.in && !seg.out) continue;
    const m = segmentMinutes(seg.in, seg.out);
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
  for (const d of days) {
    const s = splitDay(d.minutes, rule);
    reg += s.reg; ot += s.ot; dt += s.dt;
  }
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

function blankDay(date, label) {
  return { date, label, segments: [{ in: '', out: '' }, { in: '', out: '' }], breakMins: '' };
}

function buildDays(startISO, period) {
  const n = PERIODS[period] || 7;
  const out = [];
  const start = startISO ? new Date(startISO + 'T00:00:00') : null;
  for (let i = 0; i < n; i++) {
    if (start) {
      const d = new Date(start.getTime());
      d.setDate(d.getDate() + i);
      out.push(blankDay(d.toISOString().slice(0, 10), DAYNAMES[d.getDay()]));
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
    if (parsed && Array.isArray(parsed.days) && parsed.days.length) state = parsed;
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

function renderRows() {
  const tbody = document.getElementById('rows');
  tbody.textContent = '';

  state.days.forEach(day => {
    const res = dayMinutes(day);
    const tr = el('tr', { class: res.bad ? 'bad' : '' });

    tr.append(el('td', { class: 'daycell' }, [
      el('span', { class: 'dayname' }, [day.label || '']),
      el('input', {
        type: 'date', value: day.date, 'aria-label': 'Date',
        oninput: e => {
          day.date = e.target.value;
          if (day.date) day.label = DAYNAMES[new Date(day.date + 'T00:00:00').getDay()];
          save(); render();
        }
      })
    ]));

    const punchCell = el('td', { class: 'punches' });
    day.segments.forEach((seg, si) => {
      punchCell.append(el('div', { class: 'pair' }, [
        el('input', {
          class: 'time', placeholder: si === 0 ? '9:00am' : 'in', value: seg.in,
          'aria-label': 'Clock in ' + (si + 1),
          oninput: e => { seg.in = e.target.value; save(); renderTotals(); }
        }),
        el('span', { class: 'arrow' }, ['→']),
        el('input', {
          class: 'time', placeholder: si === 0 ? '5:30pm' : 'out', value: seg.out,
          'aria-label': 'Clock out ' + (si + 1),
          oninput: e => { seg.out = e.target.value; save(); renderTotals(); }
        }),
        si > 1 ? el('button', {
          class: 'x', type: 'button', title: 'Remove this pair',
          onclick: () => { day.segments.splice(si, 1); save(); render(); }
        }, ['×']) : null
      ]));
    });
    punchCell.append(el('button', {
      class: 'addpair', type: 'button',
      onclick: () => { day.segments.push({ in: '', out: '' }); save(); render(); }
    }, ['+ another in / out']));
    tr.append(punchCell);

    tr.append(el('td', {}, [el('input', {
      class: 'brk', type: 'number', min: '0', step: '5', placeholder: '0', value: day.breakMins,
      'aria-label': 'Unpaid break minutes',
      oninput: e => { day.breakMins = e.target.value; save(); renderTotals(); }
    })]));

    tr.append(el('td', { class: 'num' }, [res.worked ? fmtHM(res.minutes) : '—']));
    tr.append(el('td', { class: 'num' }, [res.worked ? fmtDec(res.minutes / 60) : '—']));
    tbody.append(tr);
  });
}

function renderTotals() {
  const r = compute(state);
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set('t-total-hm', fmtHM(r.totalMinutes));
  set('t-total-dec', fmtDec(r.totalMinutes / 60));
  set('t-reg', fmtDec(r.reg));
  set('t-ot', fmtDec(r.ot));
  set('t-dt', fmtDec(r.dt));
  set('t-days', String(r.daysWorked));

  const payBox = document.getElementById('paybox');
  if (r.pay > 0) { payBox.hidden = false; set('t-pay', money(r.pay)); } else { payBox.hidden = true; }

  const dtRow = document.getElementById('dtrow');
  if (dtRow) dtRow.hidden = r.dt <= 0;

  document.querySelectorAll('#rows tr').forEach((tr, i) => {
    const res = dayMinutes(state.days[i]);
    const cells = tr.querySelectorAll('td.num');
    if (cells.length === 2) {
      cells[0].textContent = res.worked ? fmtHM(res.minutes) : '—';
      cells[1].textContent = res.worked ? fmtDec(res.minutes / 60) : '—';
    }
    tr.classList.toggle('bad', res.bad);
  });
}

function render() {
  document.getElementById('period').value = state.period;
  document.getElementById('start').value = state.start;
  document.getElementById('rule').value = state.rule;
  document.getElementById('rate').value = state.rate;
  document.getElementById('employee').value = state.employee;
  renderRows();
  renderTotals();
}

function tableRows() {
  const r = compute(state);
  const head = ['Date', 'Day', 'In / out', 'Unpaid break (min)', 'Hours (h:mm)', 'Hours (decimal)'];
  const body = state.days.map((d, i) => {
    const punches = d.segments.filter(s => s.in || s.out)
      .map(s => (s.in || '?') + ' - ' + (s.out || '?')).join('; ');
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
  module.exports = { parseTime, segmentMinutes, dayMinutes, splitDay, computeWeek, compute, fmtHM, fmtDec };
}
