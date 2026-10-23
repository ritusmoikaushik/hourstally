'use strict';

// Military time card. Times go in on the 24-hour clock and nothing else: there is no am or pm
// anywhere on it, so 1900 to 0700 is a twelve hour night shift with nothing to tap. 2400 is
// read as the end of a day, and only as that; 0000 is midnight at the start of one. Overtime,
// the week split, the clock change and the Excel writer come from app.js and xlsx.js; this
// file is what is different about a 24-hour card.

const M = typeof module !== 'undefined' ? require('./app.js') : window;
const MX = typeof module !== 'undefined' ? require('./xlsx.js') : window.HourstallyXlsx;
const MIL_KEY = 'hourstally.military.v1';
const MIL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// app.js keeps its short day names in a const, which a browser does not put on window.
const MIL_SHORT = MIL_DAYS.map(d => d.slice(0, 3));

// Reads a 24-hour time: 7, 07, 700, 0700, 07:00, 7.00, 0700h, 19h30. Returns { minutes } from
// 0 (0000) to 1440 (2400), null for an empty box, or { error } saying why it cannot be read:
//   ampm  - an am or pm was typed; this card has none. as is what it would be in 24-hour time
//   hour  - an hour past 24, or anything past 2400
//   min   - minutes past 59
//   bad   - not a time at all
function milParse(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  if (/[ap]\.?m?\.?$/.test(s) && /\d/.test(s)) {
    const t = M.parseTimeEx(s);
    return { error: 'ampm', as: t && !t.ambiguous ? milFmt(t.minutes) : null };
  }
  s = s.replace(/^(\d{1,2})h(\d{2})$/, '$1:$2').replace(/(hours|hrs|hr|h)$/, '');
  let h, m;
  let p = /^(\d{1,2})[:.](\d{2})$/.exec(s);
  if (p) { h = +p[1]; m = +p[2]; }
  else if (/^\d{1,2}$/.test(s)) { h = +s; m = 0; }
  else if (/^\d{3}$/.test(s)) { h = +s[0]; m = +s.slice(1); }
  else if (/^\d{4}$/.test(s)) { h = +s.slice(0, 2); m = +s.slice(2); }
  else return { error: 'bad' };
  if (m > 59) return { error: 'min' };
  if (h > 24 || (h === 24 && m > 0)) return { error: 'hour' };
  return { minutes: h * 60 + m };
}

// 0 is 0000, 1440 is 2400. Four digits, no colon: the way the military writes it.
function milFmt(minutes) {
  return String(Math.floor(minutes / 60)).padStart(2, '0') + String(minutes % 60).padStart(2, '0');
}

// The same moment on a 12-hour clock, in words a person would write on a form.
function milStd(minutes) {
  if (minutes === 0) return '12:00 am (midnight)';
  if (minutes === 720) return '12:00 pm (noon)';
  if (minutes === 1440) return '12:00 am (midnight, end of the day)';
  const h = Math.floor(minutes / 60), m = minutes % 60;
  return (h % 12 === 0 ? 12 : h % 12) + ':' + String(m).padStart(2, '0') + (h < 12 ? ' am' : ' pm');
}

// One clock in and out. 2400 can only end a shift; an out at or before the in means the shift
// ran past midnight, and an out equal to the in is read as a whole 24 hours, the way the
// other cards read it. Returns { minutes } or null when the pair cannot be counted.
function milSpan(inMin, outMin) {
  if (inMin == null || outMin == null || inMin === 1440) return null;
  let d = outMin - inMin;
  if (d <= 0) d += 1440;
  return d;
}

const milBlankDay = (date, label) => ({ date, label, segments: [{ in: '', out: '' }], breakMins: '' });

// app.js has the same test, but as a const, so a browser does not put it on window either.
const milDayEmpty = d => d.segments.every(s => !s.in && !s.out) && !d.breakMins;

function milBuildDays(startISO, period) {
  return M.buildDays(startISO, period).map(d => milBlankDay(d.date, d.label));
}

// A day: every pair counted, each read forward from the one before it so a second shift that
// starts after midnight lands on the right date. pairs[i] says, for the screen and the sheet,
// how many days after this line's date the clock-out fell (0 for 2400, 1 for 0000) and what a
// clock change did to that pair. why is the first thing on the line that could not be read.
function milDay(day) {
  let total = 0, any = false, why = null, missingIn = false, missingOut = false, long = false, short = false;
  let pos = null, clocks = 0;
  const pairs = [];
  for (const seg of day.segments) {
    if (!seg.in && !seg.out) { pairs.push(null); continue; }
    const a = milParse(seg.in), b = milParse(seg.out);
    if (a && a.error) why = why || Object.assign({ raw: seg.in }, a);
    if (b && b.error) why = why || Object.assign({ raw: seg.out }, b);
    if (a && a.minutes === 1440) why = why || { error: 'in2400', raw: seg.in };
    if (!seg.in) missingIn = true;
    if (!seg.out) missingOut = true;
    const m = a && b && !a.error && !b.error ? milSpan(a.minutes, b.minutes) : null;
    if (m === null) { pairs.push(null); continue; }
    if (m > 16 * 60) long = true;
    if (b.minutes === 1439) short = true;
    const from = pos === null ? a.minutes : pos + (a.minutes - pos % 1440 + 1440) % 1440;
    pos = from + m;
    const c = M.clockChange(day.date, from, pos);
    // 2400 is the last moment of a date, so a pair ending on it ends on that date, not the next.
    const ends = Math.floor((b.minutes === 1440 ? pos - 1 : pos) / 1440);
    pairs.push({ minutes: m, clocks: c, ends, inMin: a.minutes, outMin: b.minutes });
    clocks += c; total += m; any = true;
  }
  total += clocks;
  const brk = parseInt(day.breakMins, 10);
  if (any && brk > 0) total -= brk;
  if (total < 0) total = 0;
  return { minutes: any ? total : 0, worked: any, bad: !!why, why, missingIn, missingOut,
           incomplete: missingIn || missingOut, long, short, clocks, pairs };
}

function milCompute(state) {
  const rows = state.days.map(d => Object.assign({ date: d.date, label: d.label }, milDay(d)));
  let reg = 0, ot = 0, dt = 0;
  for (let i = 0; i < rows.length; i += 7) {
    const w = M.computeWeek(rows.slice(i, i + 7), state.rule);
    reg += w.reg; ot += w.ot; dt += w.dt;
  }
  const totalMinutes = rows.reduce((a, r) => a + r.minutes, 0);
  const rate = parseFloat(state.rate) || 0;
  const pay = rate > 0 ? reg * rate + ot * rate * 1.5 + dt * rate * 2 : 0;
  return { rows, reg, ot, dt, totalMinutes, pay, daysWorked: rows.filter(r => r.worked).length };
}

function milWhy(w) {
  if (w.error === 'ampm') {
    return 'No am or pm on a military card' + (w.as ? ' — ' + w.raw.trim() + ' is ' + w.as : ' — type the 24-hour time');
  }
  if (w.error === 'in2400') return '2400 ends a day. A shift that starts at midnight starts at 0000 on the next day';
  if (w.error === 'hour') return w.raw.trim() + ' is past the end of the day — after 2359 the clock starts again at 0000';
  if (w.error === 'min') return w.raw.trim() + ' is not a time — minutes run from 00 to 59';
  return 'Cannot read a time on this line';
}

// Red for anything that stops the card being submitted; amber for a doubt.
function milNote(res) {
  if (res.bad) return milWhy(res.why);
  if (res.missingIn && res.missingOut) return 'A clock-in and a clock-out are missing';
  if (res.missingIn) return 'A clock-in is missing';
  if (res.missingOut) return 'A clock-out is missing';
  if (res.long) return 'A shift over 16 hours — check the times';
  if (res.short) return '2359 is one minute before midnight. If the shift ended at midnight, type 2400';
  return M.clockText(res.clocks);
}

// The day a clock-out fell on, when it is not the line's own day: "Sat", or "Sat 1 Nov".
function milEndsOn(day, ends) {
  if (!ends) return '';
  if (day.date) {
    const d = new Date(day.date + 'T00:00:00');
    d.setDate(d.getDate() + ends);
    return MIL_SHORT[d.getDay()] + ' ' + M.shortDate(M.isoLocal(d));
  }
  const i = MIL_SHORT.indexOf(day.label);
  return i < 0 ? 'next day' : MIL_SHORT[(i + ends) % 7];
}

function milEndsTitle(day, ends) {
  if (!ends) return '';
  if (day.date) {
    const d = new Date(day.date + 'T00:00:00');
    d.setDate(d.getDate() + ends);
    return 'Ends on ' + MIL_DAYS[d.getDay()] + ', past midnight';
  }
  return 'Ends the next day, past midnight';
}

// ------------------------------------------------------------------ the converter

// Either way round. A time with am or pm, or the words noon and midnight, is read as a
// 12-hour time and turned into 24-hour; anything else is read as 24-hour. A bare 1:00 to
// 12:59 could be either, so the answer gives the pm reading as well.
function milConvert(raw) {
  const s = String(raw || '').trim().toLowerCase().replace(/\s+/g, '');
  if (!s) return null;
  if (s === 'noon' || s === 'midday') return { mil: '1200', std: milStd(720), minutes: 720 };
  if (s === 'midnight') return { mil: '0000', std: milStd(0), minutes: 0, midnight: true };
  if (/[ap]\.?m?\.?$/.test(s)) {
    const t = M.parseTimeEx(s);
    if (!t || t.ambiguous) return { error: 'Cannot read that time' };
    return { mil: milFmt(t.minutes), std: milStd(t.minutes), minutes: t.minutes, from12: true, midnight: t.minutes === 0 };
  }
  const r = milParse(s);
  if (!r || r.error) {
    return { error: r && r.error === 'hour' ? 'The 24-hour clock stops at 2400 — after 2359 it starts again at 0000'
                   : r && r.error === 'min' ? 'Minutes run from 00 to 59' : 'Cannot read that time' };
  }
  const out = { mil: milFmt(r.minutes), std: milStd(r.minutes), minutes: r.minutes };
  const h = Math.floor(r.minutes / 60);
  if (h >= 1 && h <= 11 && !/^0/.test(s)) out.orPm = { mil: milFmt(r.minutes + 720), std: milStd(r.minutes + 720) };
  out.midnight = r.minutes === 0;
  out.end = r.minutes === 1440;
  return out;
}

// ------------------------------------------------------------------ screen

let mstate = {
  period: 'week', start: '', rule: 'weekly40', rate: '', employee: '',
  days: milBuildDays('', 'week')
};

function msave() {
  try { localStorage.setItem(MIL_KEY, JSON.stringify(mstate)); } catch (e) { /* private mode */ }
}

function mload() {
  try {
    const raw = localStorage.getItem(MIL_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days) && parsed.days.length) mstate = parsed;
  } catch (e) { /* ignore */ }
}

// On leaving a box, show the time the way it was read: 7 -> 0700, 19:30 -> 1930.
function milTidy(input, seg, key) {
  const r = milParse(input.value);
  if (!r || r.error) return;
  seg[key] = input.value = milFmt(r.minutes);
  msave(); milRenderTotals();
}

function milRenderDays() {
  const host = document.getElementById('days');
  host.textContent = '';

  mstate.days.forEach((day, di) => {
    const res = milDay(day);
    const row = M.el('div', { class: 'day' + (res.bad ? ' bad' : '') });
    row.append(M.el('div', { class: 'day-name' }, [
      day.label || ('Day ' + (di + 1)),
      day.date ? M.el('small', {}, [M.shortDate(day.date)]) : null
    ]));

    const pairs = M.el('div', { class: 'pairs' });
    day.segments.forEach((seg, si) => {
      const last = si === day.segments.length - 1;
      const name = (day.label || 'Day') + ' clock ';
      const first = di === 0 && si === 0;
      pairs.append(M.el('div', { class: 'pair' + ((seg.in || seg.out) ? '' : ' blank') }, [
        M.el('input', {
          class: 'time', placeholder: first ? '1900' : '', value: seg.in, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': name + 'in ' + (si + 1) + ', 24-hour',
          oninput: e => { seg.in = e.target.value; msave(); milRenderTotals(); },
          onblur: e => milTidy(e.target, seg, 'in')
        }),
        M.el('span', { class: 'to' }, ['to']),
        M.el('input', {
          class: 'time', placeholder: first ? '0700' : '', value: seg.out, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': name + 'out ' + (si + 1) + ', 24-hour',
          oninput: e => { seg.out = e.target.value; msave(); milRenderTotals(); },
          onblur: e => milTidy(e.target, seg, 'out')
        }),
        M.el('span', { class: 'ends' }),
        si > 0 ? M.el('button', {
          class: 'x', type: 'button', title: 'Remove this in and out',
          'aria-label': 'Remove in and out ' + (si + 1),
          onclick: () => { day.segments.splice(si, 1); msave(); milRenderDays(); }
        }, ['×']) : M.el('span', { class: 'slot' }),
        last ? M.el('button', {
          class: 'add', type: 'button', title: 'Add another clock in and out for this day',
          'aria-label': 'Add another in and out for ' + (day.label || 'this day'),
          onclick: () => {
            day.segments.push({ in: '', out: '' }); msave(); milRenderDays();
            const ins = document.querySelectorAll('#days .day')[di].querySelectorAll('input.time');
            ins[ins.length - 2].focus();
          }
        }, ['+']) : M.el('span', { class: 'slot' })
      ]));
    });
    pairs.append(M.copyButton(() => { M.copyInto(mstate.days, di); msave(); milRenderDays(); }));
    row.append(pairs);

    row.append(M.el('div', { class: 'brkwrap' }, [
      M.el('span', {}, ['Unpaid break']),
      M.el('input', {
        class: 'brk', type: 'number', min: '0', step: '5', placeholder: '0', value: day.breakMins,
        'aria-label': (day.label || 'Day') + ' unpaid break minutes',
        oninput: e => { day.breakMins = e.target.value; msave(); milRenderTotals(); }
      }),
      M.el('span', {}, ['min'])
    ]));
    row.append(M.el('div', { class: 'totals empty' }, [M.el('div', { class: 'hm' }, ['—']), M.el('div', { class: 'dec' })]));
    row.append(M.el('div', { class: 'daynotes' }, [M.el('span', { class: 'note' })]));
    host.append(row);
  });
  milRenderTotals();
}

function milRenderTotals() {
  const r = milCompute(mstate);
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  set('t-total-hm', M.fmtHMlabel(r.totalMinutes));
  const stub = document.querySelector('.stub-value'); if (stub) stub.classList.toggle('empty', r.totalMinutes === 0);
  set('t-total-dec', M.fmtDec(r.totalMinutes / 60));
  set('t-reg', M.fmtDec(r.reg));
  set('t-ot', M.fmtDec(r.ot));
  set('t-dt', M.fmtDec(r.dt));
  set('t-days', String(r.daysWorked));
  const payRow = document.getElementById('payrow');
  if (r.pay > 0) { payRow.hidden = false; set('t-pay', M.money(r.pay)); } else { payRow.hidden = true; }
  document.getElementById('dtrow').hidden = r.dt <= 0;
  document.getElementById('days').classList.toggle('filled', mstate.days.some(d => d.segments.some(s => s.in || s.out)));

  document.querySelectorAll('#days .day').forEach((row, i) => {
    const day = mstate.days[i], res = r.rows[i];
    row.querySelectorAll('.pair').forEach((el, si) => {
      const sg = day.segments[si], p = res.pairs[si];
      el.classList.toggle('blank', !(sg && (sg.in || sg.out)));
      // "Sat 31 Oct" sits on two lines, the day over the date, to fit beside the clock-out.
      const ends = el.querySelector('.ends');
      const text = p ? milEndsOn(day, p.ends) : '';
      const cut = text.indexOf(' ');
      ends.textContent = '';
      if (text) ends.append('→ ' + (cut < 0 ? text : text.slice(0, cut)), cut < 0 ? '' : M.el('small', {}, [text.slice(cut + 1)]));
      ends.title = p ? milEndsTitle(day, p.ends) : '';
    });
    row.querySelector('.hm').textContent = res.worked ? M.fmtHMlabel(res.minutes) : '—';
    row.querySelector('.dec').textContent = res.worked ? M.fmtDec(res.minutes / 60) : '';
    row.querySelector('.totals').classList.toggle('empty', !res.worked);
    row.classList.toggle('bad', res.bad);
    row.classList.toggle('long', res.long);
    row.classList.toggle('doubt', res.short && !res.long);
    row.classList.toggle('clocked', !!res.clocks);
    row.classList.toggle('cancopy', res.worked && !res.bad && !res.incomplete && M.copyTargets(mstate.days, i, milDayEmpty).length > 0);
    const note = milNote(res);
    row.querySelector('.daynotes .note').textContent = note;
    row.classList.toggle('noted', !!note);
  });
}

function milRender() {
  // A fortnight prints tighter, so fourteen days fit one sheet (see style.css).
  document.querySelector('.tc.mil').classList.toggle('fortnight', mstate.days.length > 7);
  document.getElementById('period').value = mstate.period;
  document.getElementById('start').value = mstate.start;
  document.getElementById('rule').value = mstate.rule;
  document.getElementById('rate').value = mstate.rate;
  document.getElementById('employee').value = mstate.employee;
  milRenderDays();
}

// ------------------------------------------------------------------ the sheet

// One row for every clock in and out, because the clock times are real Excel times: a cell
// shown as 19:00 holds 19/24 of a day, and 2400 holds a whole day. Each row's hours are a
// formula on its own two times that survives midnight - a plain Out minus In goes negative
// on a night shift, and Excel shows a negative time as #####. A corrected time in Excel
// therefore carries through to the total.
function milXlsxRows() {
  const r = milCompute(mstate);
  const S = MX.STYLE;
  const rows = [];
  const employee = (mstate.employee || '').trim();
  if (employee) rows.push([{ v: 'Employee', s: S.bold }, employee]);
  if (mstate.days.length && mstate.days[0].date) {
    rows.push([{ v: 'Period', s: S.bold }, { d: mstate.days[0].date }, 'to', { d: mstate.days[mstate.days.length - 1].date }]);
  }
  if (rows.length) rows.push([]);

  rows.push(['Date', 'Day', 'In', 'Out', 'Clock change', 'Unpaid break (min)', 'Hours (h:mm)', 'Hours (decimal)'].map(v => ({ v, s: S.bold })));
  const firstLine = rows.length + 1;
  mstate.days.forEach((d, i) => {
    const res = r.rows[i];
    const brk = parseInt(d.breakMins, 10);
    let lines = 0;
    d.segments.forEach((sg, si) => {
      if (!sg.in && !sg.out) return;
      const p = res.pairs[si];
      const n = rows.length + 1;
      const head = lines === 0;
      const cells = [head && d.date ? { d: d.date } : '', head ? d.label : ''];
      if (p) {
        // The hours on the day's first line carry its break, so the lines add up to the day.
        const b = head && brk > 0 ? brk : 0;
        const v = Math.max(0, p.minutes + p.clocks - b);
        cells.push({ v: p.inMin / 1440, s: S.clock }, { v: p.outMin / 1440, s: S.clock },
          p.clocks ? { v: p.clocks / 60, s: S.int } : '', b ? { v: b, s: S.int } : '',
          { v: v / 1440, s: S.hm, f: 'MAX(0,IF(D' + n + '>C' + n + ',D' + n + '-C' + n + ',D' + n + '+1-C' + n + ')+E' + n + '/24-F' + n + '/1440)' },
          { v: v / 60, s: S.dec, f: 'G' + n + '*24' });
      } else {
        cells.push(sg.in || '', sg.out || '');
      }
      rows.push(cells);
      lines++;
    });
    if (!lines) rows.push([d.date ? { d: d.date } : '', d.label]);
  });
  const lastLine = rows.length;
  rows.push([]);

  const line = (label, v) => { rows.push([{ v: label, s: S.text }, '', '', '', '', '', '', { v, s: S.dec }]); return rows.length; };
  const regRow = line('Regular hours', r.reg);
  const otRow = line('Overtime hours', r.ot);
  const dtRow = r.dt > 0 ? line('Double time hours', r.dt) : 0;
  rows.push([
    { v: 'Total hours', s: S.bold }, '', '', '', '', '',
    { v: r.totalMinutes / 1440, s: S.boldHm, f: 'SUM(G' + firstLine + ':G' + lastLine + ')' },
    { v: r.totalMinutes / 60, s: S.boldDec, f: 'SUM(H' + firstLine + ':H' + lastLine + ')' }
  ]);

  const rate = parseFloat(mstate.rate) || 0;
  if (rate > 0) {
    rows.push([{ v: 'Hourly rate', s: S.text }, '', '', '', '', '', '', { v: rate, s: S.money }]);
    const rateRow = rows.length;
    let f = 'H' + regRow + '*H' + rateRow + '+H' + otRow + '*H' + rateRow + '*1.5';
    if (dtRow) f += '+H' + dtRow + '*H' + rateRow + '*2';
    rows.push([{ v: 'Gross pay', s: S.bold }, '', '', '', '', '', '', { v: Math.round(r.pay * 100) / 100, s: S.boldMoney, f }]);
  }
  if (r.rows.some(x => x.clocks)) {
    rows.push([]);
    rows.push(['Clock change: 1 where the clocks went back during the shift (an hour more worked), -1 where they went forward.']);
  }
  return rows;
}

const MIL_XLSX_WIDTHS = [13, 12, 8, 12, 15, 21, 15, 16];

function milXlsxName() {
  const d = mstate.days.length && mstate.days[0].date;
  return 'military-timecard' + (d ? '-' + d : '') + '.xlsx';
}

// ------------------------------------------------------------------ wiring

function milConverterBind() {
  const box = document.getElementById('conv-in');
  const out = document.getElementById('conv-out');
  if (!box || !out) return;
  const show = () => {
    const c = milConvert(box.value);
    out.textContent = '';
    if (!c) { out.append(M.el('span', { class: 'cv-hint' }, ['Type 1945, or 7:45 pm'])); return; }
    if (c.error) { out.append(M.el('span', { class: 'cv-bad' }, [c.error])); return; }
    out.append(M.el('span', { class: 'cv-main' }, [M.el('b', {}, [c.mil]), ' = ' + c.std]));
    if (c.midnight) out.append(M.el('span', { class: 'cv-more' }, ['Midnight is 0000 when it starts a day or a shift, and 2400 when it ends one.']));
    if (c.end) out.append(M.el('span', { class: 'cv-more' }, ['2400 is the same moment as 0000 on the next day. Use it for a clock-out.']));
    if (c.orPm) out.append(M.el('span', { class: 'cv-more' }, ['If you meant ' + c.orPm.std + ', that is ' + c.orPm.mil + '.']));
  };
  box.addEventListener('input', show);
  show();
}

function milBind() {
  const rebuild = () => { mstate.days = milBuildDays(mstate.start, mstate.period); msave(); milRender(); };
  document.getElementById('period').addEventListener('change', e => { mstate.period = e.target.value; rebuild(); });
  document.getElementById('start').addEventListener('change', e => { mstate.start = e.target.value; rebuild(); });
  document.getElementById('rule').addEventListener('change', e => { mstate.rule = e.target.value; msave(); milRenderTotals(); });
  document.getElementById('rate').addEventListener('input', e => { mstate.rate = e.target.value; msave(); milRenderTotals(); });
  document.getElementById('employee').addEventListener('input', e => { mstate.employee = e.target.value; msave(); });

  document.getElementById('btn-xlsx').addEventListener('click', () => {
    M.download(milXlsxName(), MX.buildXlsx(milXlsxRows(), MIL_XLSX_WIDTHS, 'Time card'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
  document.getElementById('btn-print').addEventListener('click', () => { milRender(); window.print(); });
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every time you have entered?')) return;
    mstate.days = milBuildDays(mstate.start, mstate.period);
    msave(); milRender();
  });
  // The chart prints on its own sheet, without the card.
  document.getElementById('btn-print-chart').addEventListener('click', () => {
    document.body.classList.add('print-chart');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('print-chart'));
  milConverterBind();
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-tool="military"]')) { mload(); milBind(); milRender(); }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { milParse, milFmt, milStd, milSpan, milDay, milCompute, milNote, milWhy, milEndsOn, milConvert,
                     milBuildDays, milXlsxRows, milXlsxName, MIL_XLSX_WIDTHS, _setState: s => { mstate = s; } };
}
