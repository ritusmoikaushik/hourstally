'use strict';

// Time <-> decimal conversion. Accepts "7:45", "7h 45m", "7.75", "745", "0:05", "-1:30".
function parseDuration(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  let neg = false;
  if (s[0] === '-') { neg = true; s = s.slice(1); }

  let minutes = null;
  let m;
  if ((m = s.match(/^(\d+):(\d{1,2})$/))) {
    minutes = parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
    if (parseInt(m[2], 10) > 59) return null;
  } else if ((m = s.match(/^(\d+)h(?:(\d{1,2})m?)?$/))) {
    minutes = parseInt(m[1], 10) * 60 + parseInt(m[2] || '0', 10);
    if (parseInt(m[2] || '0', 10) > 59) return null;
  } else if ((m = s.match(/^(\d{1,2})m$/))) {
    minutes = parseInt(m[1], 10);
  } else if (/^\d+$/.test(s)) {
    // 745 -> 7:45 ; 45 -> 0:45 ; 8 -> 8:00
    if (s.length <= 2) minutes = parseInt(s, 10) * 60;
    else {
      const mm = parseInt(s.slice(-2), 10);
      if (mm > 59) return null;
      minutes = parseInt(s.slice(0, -2), 10) * 60 + mm;
    }
  } else {
    return null;
  }
  return neg ? -minutes : minutes;
}

function parseDecimal(raw) {
  if (raw == null) return null;
  const s = String(raw).trim().replace(/,/g, '.');
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return parseFloat(s);
}

function minutesToDecimal(minutes) { return minutes / 60; }
function decimalToMinutes(hours) { return Math.round(hours * 60); }

function roundHours(hours, mode) {
  if (mode === 'quarter') return Math.round(hours * 4) / 4;
  if (mode === 'tenth') return Math.round(hours * 10) / 10;
  if (mode === 'hundredth') return Math.round(hours * 100) / 100;
  return hours;
}

function fmtHM(minutes) {
  const neg = minutes < 0;
  const m = Math.abs(Math.round(minutes));
  return (neg ? '-' : '') + Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
}

function fmtDec(hours, places) {
  const p = places == null ? 2 : places;
  return (Math.round(hours * Math.pow(10, p)) / Math.pow(10, p)).toFixed(p);
}

// Bulk: one value per line, either time or decimal, converted the other way.
function convertLines(text, direction, rounding) {
  const out = [];
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (direction === 'toDecimal') {
      const mins = parseDuration(line);
      out.push(mins === null ? { input: line, ok: false }
        : { input: line, ok: true, result: fmtDec(roundHours(minutesToDecimal(mins), rounding)) });
    } else {
      const h = parseDecimal(line);
      out.push(h === null ? { input: line, ok: false }
        : { input: line, ok: true, result: fmtHM(decimalToMinutes(h)) });
    }
  }
  return out;
}

function sumLines(rows, direction) {
  let minutes = 0;
  for (const r of rows) {
    if (!r.ok) continue;
    minutes += direction === 'toDecimal' ? parseDuration(r.input) : decimalToMinutes(parseDecimal(r.input));
  }
  return minutes;
}

/* ------------------------------------------------------------------ ui */

function $(id) { return document.getElementById(id); }

function renderSingle() {
  const rounding = $('rounding').value;
  const tIn = $('time-in').value, dIn = $('dec-in').value;
  const last = renderSingle.last;

  if (last === 'time') {
    const mins = parseDuration(tIn);
    if (mins === null) { $('dec-in').value = ''; $('single-note').textContent = tIn ? 'Cannot read that time.' : ''; return; }
    const h = roundHours(minutesToDecimal(mins), rounding);
    $('dec-in').value = fmtDec(h);
    $('single-note').textContent = fmtHM(mins) + ' is ' + fmtDec(minutesToDecimal(mins), 4) + ' hours exactly' +
      (rounding !== 'exact' ? ', ' + fmtDec(h) + ' rounded' : '') + '.';
  } else {
    const h = parseDecimal(dIn);
    if (h === null) { $('time-in').value = ''; $('single-note').textContent = dIn ? 'Cannot read that number.' : ''; return; }
    const mins = decimalToMinutes(h);
    $('time-in').value = fmtHM(mins);
    $('single-note').textContent = fmtDec(h) + ' hours is ' + fmtHM(mins) + '.';
  }
}
renderSingle.last = 'time';

function renderBulk() {
  const direction = $('direction').value;
  const rounding = $('rounding').value;
  const rows = convertLines($('bulk-in').value, direction, rounding);
  const out = $('bulk-out');
  out.value = rows.map(r => r.ok ? r.result : '??').join('\n');
  const total = sumLines(rows, direction);
  const bad = rows.filter(r => !r.ok).length;
  $('bulk-note').textContent = rows.length
    ? rows.length + ' lines · total ' + fmtHM(total) + ' = ' + fmtDec(minutesToDecimal(total)) + ' hours' + (bad ? ' · ' + bad + ' could not be read' : '')
    : '';
  $('bulk-in').placeholder = direction === 'toDecimal' ? '7:45\n8:05\n0:30' : '7.75\n8.08\n0.5';
}

function renderChart() {
  const tbody = $('chart-rows');
  if (!tbody) return;
  tbody.textContent = '';
  for (let m = 1; m <= 60; m++) {
    const h = m / 60;
    const tr = document.createElement('tr');
    for (const v of [m, fmtDec(h), fmtDec(roundHours(h, 'quarter')), fmtDec(roundHours(h, 'tenth'), 1)]) {
      const td = document.createElement('td'); td.textContent = v; tr.append(td);
    }
    tbody.append(tr);
  }
}

function bind() {
  $('time-in').addEventListener('input', () => { renderSingle.last = 'time'; renderSingle(); });
  $('time-in').addEventListener('blur', () => {
    const mins = parseDuration($('time-in').value);
    if (mins !== null && $('time-in').value.trim()) $('time-in').value = fmtHM(mins);
  });
  $('dec-in').addEventListener('blur', () => {
    const h = parseDecimal($('dec-in').value);
    if (h !== null && $('dec-in').value.trim()) $('dec-in').value = fmtDec(h);
  });
  $('dec-in').addEventListener('input', () => { renderSingle.last = 'dec'; renderSingle(); });
  $('rounding').addEventListener('change', () => { renderSingle(); renderBulk(); });
  $('direction').addEventListener('change', renderBulk);
  $('bulk-in').addEventListener('input', renderBulk);
  $('btn-copy').addEventListener('click', () => {
    navigator.clipboard.writeText($('bulk-out').value).then(() => { $('btn-copy').textContent = 'Copied'; setTimeout(() => $('btn-copy').textContent = 'Copy results', 1500); });
  });
  $('btn-print-chart').addEventListener('click', () => window.print());
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => { bind(); renderBulk(); renderChart(); });
}

if (typeof module !== 'undefined') {
  module.exports = { parseDuration, parseDecimal, minutesToDecimal, decimalToMinutes, roundHours, fmtHM, fmtDec, convertLines, sumLines };
}
