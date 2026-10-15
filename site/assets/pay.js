'use strict';

// The time card with overtime and pay. Rate first: one hourly rate, or two for
// someone who worked two jobs at two rates in the same week. Each clock in and
// out pair is tagged with the rate it was worked at. Overtime is paid the FLSA
// way: every hour at its own straight-time rate, then the overtime premium on
// the week's weighted average of those rates (29 CFR 778.115), with any shift
// differential counted into that average (29 CFR 778.207(b)). The arithmetic
// for reading a time and totalling a day is app.js; this file is the pay.

const P = typeof module !== 'undefined' ? require('./app.js') : window;
const PX = typeof module !== 'undefined' ? require('./xlsx.js') : window.HourstallyXlsx;
const PAY_KEY = 'hourstally.pay.v1';
const PAY_RULES = { weekly40: 'over 40 a week', daily8: 'over 8 a day', both: 'over 8 a day and 40 a week',
  california: 'California 8 / 12', none: 'none' };

const num = v => { const n = parseFloat(v); return isFinite(n) && n > 0 ? n : 0; };

// A multiplier left empty or typed as nonsense falls back to the usual one; below 1 it is 1,
// since an overtime hour is never paid less than a straight-time hour.
function multiplier(v, fallback) {
  const n = parseFloat(v);
  if (!isFinite(n)) return fallback;
  return Math.max(1, n);
}

// The settings that turn hours into money, read once from the card.
function payConfig(state) {
  const rateA = num(state.rateA), rateB = num(state.rateB);
  return {
    rates: [rateA, rateB],
    two: rateA > 0 && rateB > 0,
    otMult: multiplier(state.otMult, 1.5),
    dtMult: multiplier(state.dtMult, 2),
    diff: num(state.diffAmount),
    diffKind: state.diffKind === 'percent' ? 'percent' : 'dollar',
    diffFrom: parseInt(state.diffFrom, 10) || 0,
    diffTo: parseInt(state.diffTo, 10) || 0,
    rule: state.rule
  };
}

// Minutes of [from, to) that fall inside the daily differential window. Times are minutes after
// midnight of the day the shift started, so a night shift runs past 1440. fromHour === toHour
// means the differential is paid on every hour.
function windowOverlap(from, to, fromHour, toHour) {
  if (to <= from) return 0;
  if (fromHour === toHour) return to - from;
  const ws = fromHour * 60, len = ((toHour - fromHour + 24) % 24) * 60;
  let total = 0;
  for (let k = -1; k <= 2; k++) {
    const a = Math.max(from, ws + 1440 * k), b = Math.min(to, ws + 1440 * k + len);
    if (b > a) total += b - a;
  }
  return total;
}

// One day, pair by pair: the minutes worked at each rate, in the order they were worked, and the
// minutes of each that the differential covers. Flags come from the shared day total.
function payDay(day, cfg) {
  const base = P.dayMinutes(day);
  const segs = [];
  let pos = null;
  for (const seg of day.segments) {
    if (!seg.in || !seg.out) continue;
    const m = P.segmentMinutes(seg.in, seg.out, seg.inM, seg.outM);
    if (m === null) continue;
    const a = P.applyMeridian(P.parseTimeEx(seg.in), seg.inM).minutes;
    const from = pos === null ? a : pos + (a - pos % 1440 + 1440) % 1440;
    pos = from + m;
    const minutes = m + P.clockChange(day.date, from, pos);
    const diff = cfg.diff > 0 ? Math.min(minutes, windowOverlap(from, from + m, cfg.diffFrom, cfg.diffTo)) : 0;
    segs.push({ job: cfg.two && seg.job === 1 ? 1 : 0, minutes, diff });
  }
  return Object.assign({}, base, { segs });
}

// Straight-time pay for one stretch: every hour at its rate, plus the differential on the hours it covers.
function straightPay(seg, cfg) {
  const rate = cfg.rates[seg.job];
  const diffRate = cfg.diffKind === 'percent' ? rate * cfg.diff / 100 : cfg.diff;
  return seg.minutes / 60 * rate + seg.diff / 60 * diffRate;
}

// Where in a day overtime and double time begin, in hours worked that day. A weekly rule caps the
// regular hours at what is left of the 40, so the hours past the 40th land on the day they were
// worked. The totals are the same as computeWeek in app.js; this also says which day.
function dayThresholds(i, hours, rule, capLeft, seventh) {
  let otAt = Infinity, dtAt = Infinity;
  if (rule === 'daily8' || rule === 'both') otAt = 8;
  if (rule === 'california') { otAt = 8; dtAt = 12; if (seventh && i === 6) { otAt = 0; dtAt = 8; } }
  if (rule === 'weekly40' || rule === 'both' || rule === 'california') otAt = Math.min(otAt, capLeft);
  return { otAt, dtAt };
}

function splitHours(h, otAt, dtAt) {
  return {
    reg: Math.min(h, otAt),
    ot: otAt >= h ? 0 : Math.min(h, dtAt) - otAt,
    dt: dtAt >= h ? 0 : h - dtAt
  };
}

// One workweek. The regular rate is the week's straight-time pay divided by every hour worked in
// it (29 CFR 778.115); overtime adds (multiplier - 1) of that rate on each overtime hour, because
// the hour itself is already in the straight-time pay (29 CFR 778.110, 778.111).
function payWeek(days, cfg) {
  const rule = cfg.rule;
  const weekly = rule === 'weekly40' || rule === 'both' || rule === 'california';
  const seventh = rule === 'california' && days.length === 7 && days.every(d => d.worked);
  let capLeft = 40;
  const perJob = [{ reg: 0, ot: 0, dt: 0 }, { reg: 0, ot: 0, dt: 0 }];
  const out = days.map((d, i) => {
    const h = d.minutes / 60;
    const { otAt, dtAt } = dayThresholds(i, h, rule, capLeft, seventh);
    const s = splitHours(h, otAt, dtAt);
    if (weekly) capLeft = Math.max(0, capLeft - s.reg);
    // Which rate each of the day's hours was worked at, in order - for the rate-in-effect check.
    let p = 0;
    d.segs.forEach(sg => {
      const a = p, b = p + sg.minutes / 60; p = b;
      const part = (lo, hi) => Math.max(0, Math.min(b, hi) - Math.max(a, lo));
      perJob[sg.job].reg += part(0, otAt);
      perJob[sg.job].ot += part(otAt, dtAt);
      perJob[sg.job].dt += part(dtAt, Infinity);
    });
    const straight = d.segs.reduce((t, sg) => t + straightPay(sg, cfg), 0);
    const diffPay = d.segs.reduce((t, sg) => t + sg.diff / 60 * (cfg.diffKind === 'percent' ? cfg.rates[sg.job] * cfg.diff / 100 : cfg.diff), 0);
    return Object.assign({}, s, { minutes: d.minutes, worked: d.worked, straight, diffPay,
      jobMinutes: [0, 1].map(j => d.segs.filter(sg => sg.job === j).reduce((t, sg) => t + sg.minutes, 0)),
      diffMinutes: d.segs.reduce((t, sg) => t + sg.diff, 0) });
  });

  const hours = out.reduce((t, d) => t + d.minutes / 60, 0);
  const straight = out.reduce((t, d) => t + d.straight, 0);
  const regularRate = hours > 0 ? straight / hours : 0;
  const otPrem = (cfg.otMult - 1) * regularRate, dtPrem = (cfg.dtMult - 1) * regularRate;
  out.forEach(d => { d.premium = d.ot * otPrem + d.dt * dtPrem; d.gross = d.straight + d.premium; });
  const sum = k => out.reduce((t, d) => t + d[k], 0);
  const reg = sum('reg'), ot = sum('ot'), dt = sum('dt'), premium = sum('premium');

  // The rate-in-effect method (29 CFR 778.419): each overtime hour at the multiplier times the
  // rate of the job worked in it. Lawful only by advance agreement; shown so a stub paid that way
  // can be recognised. Left out when a differential applies, since the differential then needs
  // its own overtime on top (778.417(b)) and the comparison would mislead.
  let rateInEffect = null;
  if (cfg.two && cfg.diff === 0 && ot + dt > 0 && [0, 1].every(j => out.some(d => d.jobMinutes[j] > 0))) {
    rateInEffect = [0, 1].reduce((t, j) => t + cfg.rates[j] *
      (perJob[j].reg + perJob[j].ot * cfg.otMult + perJob[j].dt * cfg.dtMult), 0);
  }
  const jobsUsed = [0, 1].filter(j => out.some(d => d.jobMinutes[j] > 0)).length;
  return { days: out, hours, minutes: sum('minutes'), straight, regularRate, reg, ot, dt, premium,
           diffPay: sum('diffPay'), blended: jobsUsed > 1 || sum('diffPay') > 0, jobsUsed, gross: straight + premium, perJob, rateInEffect,
           daysWorked: out.filter(d => d.worked).length };
}

function payCompute(state) {
  const cfg = payConfig(state);
  const rows = state.days.map(d => payDay(d, cfg));
  const weeks = [];
  for (let i = 0; i < rows.length; i += 7) weeks.push(payWeek(rows.slice(i, i + 7), cfg));
  const sum = k => weeks.reduce((t, w) => t + w[k], 0);
  return { cfg, rows, weeks, minutes: sum('minutes'), hours: sum('hours'), reg: sum('reg'), ot: sum('ot'), dt: sum('dt'),
           straight: sum('straight'), premium: sum('premium'), diffPay: sum('diffPay'), gross: sum('gross'),
           daysWorked: sum('daysWorked') };
}

// Money as payroll writes it: rounded to the cent once, from the exact figure.
const cents = n => Math.round(n * 100 + 1e-9) / 100;
const usd = n => '$' + cents(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function payBlankDays(startISO, period) {
  return P.buildDays(startISO, period === 'biweekly' ? 'biweekly' : 'week')
    .map(d => ({ date: d.date, label: d.label, segments: [{ in: '', out: '', inM: 'am', outM: 'pm', job: 0 }] }));
}

const HOURS12 = h => (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? 'am' : 'pm');

// ------------------------------------------------------------------ screen

let pstate = {
  rateA: '', rateB: '', otMult: '1.5', dtMult: '2',
  diffAmount: '', diffKind: 'dollar', diffFrom: '23', diffTo: '7',
  period: 'week', start: '', rule: 'weekly40', employee: '',
  days: payBlankDays('', 'week')
};

function psave() {
  try { localStorage.setItem(PAY_KEY, JSON.stringify(pstate)); } catch (e) { /* private mode */ }
}

function pload() {
  try {
    const raw = localStorage.getItem(PAY_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.days) && (parsed.days.length === 7 || parsed.days.length === 14)) pstate = Object.assign(pstate, parsed);
  } catch (e) { /* ignore */ }
}

const pchanged = () => { psave(); pRenderTotals(); };
const payDayEmpty = d => d.segments.every(s => !s.in && !s.out);

function jobChip(seg, label) {
  const name = j => 'rate ' + (j ? 'B' : 'A');
  const b = P.el('button', {
    class: 'job' + (seg.job === 1 ? ' b' : ''), type: 'button', title: 'Which rate these hours were worked at - tap to switch',
    'aria-label': label + ': ' + name(seg.job) + ', tap to switch',
    onclick: () => {
      seg.job = seg.job === 1 ? 0 : 1;
      b.textContent = seg.job ? 'B' : 'A';
      b.className = 'job' + (seg.job === 1 ? ' b' : '');
      b.setAttribute('aria-label', label + ': ' + name(seg.job) + ', tap to switch');
      pchanged();
    }
  }, [seg.job === 1 ? 'B' : 'A']);
  return b;
}

function pRenderDays() {
  const host = document.getElementById('days');
  host.textContent = '';
  const two = payConfig(pstate).two;
  const n = pstate.days.length;
  pstate.days.forEach((day, di) => {
    const row = P.el('div', { class: 'day' });
    row.append(P.el('div', { class: 'day-name' }, [
      day.label || ('Day ' + (di + 1)),
      day.date ? P.el('small', {}, [P.shortDate(day.date)]) : null
    ]));

    const pairs = P.el('div', { class: 'pairs' });
    day.segments.forEach((seg, si) => {
      const last = si === day.segments.length - 1;
      const name = (day.label || 'Day') + (n > 7 ? ' week ' + (di < 7 ? 1 : 2) : '');
      const inSwitch = P.merSwitch(seg, 'inM', name + ' clock in ' + (si + 1), pchanged);
      const outSwitch = P.merSwitch(seg, 'outM', name + ' clock out ' + (si + 1), pchanged);
      pairs.append(P.el('div', { class: 'pair' + (two ? '' : ' nojob') + ((seg.in || seg.out) ? '' : ' blank') }, [
        P.el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '9:00' : (si === 0 ? '' : 'in'), value: seg.in, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': name + ' clock in ' + (si + 1),
          oninput: e => { seg.in = e.target.value; seg.inL = false; pchanged(); },
          onblur: e => P.tidyTime(e.target, seg, 'in', 'inM', inSwitch, pchanged)
        }),
        inSwitch,
        P.el('span', { class: 'to' }, ['to']),
        P.el('input', {
          class: 'time', placeholder: (di === 0 && si === 0) ? '5:30' : (si === 0 ? '' : 'out'), value: seg.out, autocomplete: 'off',
          inputmode: 'numeric', 'aria-label': name + ' clock out ' + (si + 1),
          oninput: e => { seg.out = e.target.value; seg.outL = false; pchanged(); },
          onblur: e => P.tidyTime(e.target, seg, 'out', 'outM', outSwitch, pchanged)
        }),
        outSwitch,
        two ? jobChip(seg, name + ' in and out ' + (si + 1)) : null,
        si > 0 ? P.el('button', {
          class: 'x', type: 'button', title: 'Remove this in and out', 'aria-label': 'Remove in and out ' + (si + 1),
          onclick: () => { day.segments.splice(si, 1); psave(); pRenderDays(); }
        }, ['×']) : P.el('span', { class: 'slot' }),
        last ? P.el('button', {
          class: 'add', type: 'button', title: 'Add another clock in and out for this day',
          'aria-label': 'Add another in and out for ' + name,
          onclick: () => {
            // A second pair starts on the rate of the one before; tap A or B if it was the other job.
            day.segments.push({ in: '', out: '', inM: 'pm', outM: 'pm', job: seg.job === 1 ? 1 : 0 });
            psave(); pRenderDays();
            const ins = document.querySelectorAll('#days .day')[di].querySelectorAll('input.time');
            ins[ins.length - 2].focus();
          }
        }, ['+']) : P.el('span', { class: 'slot' })
      ]));
    });
    pairs.append(P.copyButton(() => { P.copyInto(pstate.days, di); psave(); pRenderDays(); }));
    row.append(pairs);
    row.append(P.el('div', { class: 'totals empty' }, [
      P.el('div', { class: 'hm' }, ['—']), P.el('div', { class: 'gross' }, [''])
    ]));
    row.append(P.el('div', { class: 'daynotes' }, [P.el('span', { class: 'note' }, [''])]));
    host.append(row);

    if (di % 7 === 6) {
      const w = (di + 1) / 7;
      host.append(P.el('div', { class: 'weekband', id: 'week-' + w }, [
        P.el('span', { class: 'wk-name' }, [n > 7 ? 'Week ' + w : 'Week']),
        P.el('span', { class: 'wk-split' }, ['']),
        P.el('span', { class: 'wk-hm' }, ['0.00']),
        P.el('span', { class: 'wk-dec' }, [''])
      ]));
    }
  });
  pRenderTotals();
}

function weekLine(w, cfg) {
  if (!w.daysWorked) return 'no days worked';
  const parts = [P.fmtDec(w.reg) + ' regular', P.fmtDec(w.ot) + ' overtime'];
  if (w.dt > 0) parts.push(P.fmtDec(w.dt) + ' double');
  if (cfg.rates[0] > 0) parts.push((w.blended ? 'blended rate ' : 'rate ') + usd(w.regularRate));
  return parts.join(' · ');
}

// The sentence under the stub that says which overtime rate was used and why. It changes with the
// card: nothing without a rate, the plain rate for one job, the blend for two.
function payNote(r) {
  const cfg = r.cfg;
  const notes = [];
  if (cfg.otMult < 1.5) notes.push('Overtime is set below 1.5 times. Under the FLSA an overtime hour is paid at least one and a half times the regular rate.');
  if (!(cfg.rates[0] > 0)) {
    notes.push('Put in your hourly rate at the top of the card and each day shows its gross pay.');
    return notes;
  }
  r.weeks.forEach((w, i) => {
    if (!(w.ot + w.dt > 0) || !w.blended) return;
    let s = (r.weeks.length > 1 ? 'Week ' + (i + 1) + ': overtime is ' : 'Overtime is ') + cfg.otMult + ' × the blended ' + usd(w.regularRate) + ' = ' + usd(cfg.otMult * w.regularRate) + ' an hour';
    if (w.jobsUsed > 1) {
      s += ', not ' + cfg.otMult + ' × the higher ' + usd(Math.max(cfg.rates[0], cfg.rates[1])) + '.';
      if (w.rateInEffect !== null) {
        s += ' Paid at the rate of the job worked in the overtime hours, the week would be ' + usd(w.rateInEffect) +
          ' instead of ' + usd(w.gross) + ' — lawful only if you agreed to that before the work.';
      }
    } else {
      s += ', because the differential is part of the regular rate.';
    }
    notes.push(s);
  });
  return notes;
}

function pRenderTotals() {
  const r = payCompute(pstate);
  const cfg = r.cfg;
  const set = (id, v) => { const n = document.getElementById(id); if (n) n.textContent = v; };
  const show = (id, on) => { const n = document.getElementById(id); if (n) n.hidden = !on; };
  const paid = cfg.rates[0] > 0;

  set('t-gross', usd(paid ? r.gross : 0));
  document.querySelector('.stub-value').classList.toggle('empty', !(paid && r.gross > 0));
  set('t-hours', P.fmtDec(r.hours));
  set('t-straight', usd(r.straight));
  set('t-premium', usd(r.premium));
  set('t-diffpay', usd(r.diffPay));
  show('diffrow', paid && cfg.diff > 0);
  show('straightrow', paid); show('premrow', paid);
  set('t-rr1', usd(r.weeks[0].regularRate));
  set('t-rr1-label', r.weeks.length > 1 ? 'Week 1 rate' : (cfg.two || cfg.diff > 0 ? 'Blended rate' : 'Regular rate'));
  show('rr1row', paid);
  if (r.weeks[1]) set('t-rr2', usd(r.weeks[1].regularRate));
  show('rr2row', paid && r.weeks.length > 1);
  set('t-reg', P.fmtDec(r.reg));
  set('t-ot', P.fmtDec(r.ot));
  set('t-dt', P.fmtDec(r.dt));
  show('dtrow', r.dt > 0);
  set('t-days', String(r.daysWorked));

  const note = document.getElementById('paynote');
  if (note) {
    note.textContent = '';
    payNote(r).forEach(t => note.append(P.el('span', {}, [t])));
    note.hidden = !note.childNodes.length;
  }
  document.getElementById('days').classList.toggle('filled', pstate.days.some(d => d.segments.some(s => s.in || s.out)));

  r.weeks.forEach((w, i) => {
    const band = document.getElementById('week-' + (i + 1)); if (!band) return;
    band.querySelector('.wk-split').textContent = weekLine(w, cfg);
    band.querySelector('.wk-hm').textContent = P.fmtDec(w.hours);
    band.querySelector('.wk-dec').textContent = paid ? usd(w.gross) : '';
    band.classList.toggle('over', w.ot > 0);
  });

  document.querySelectorAll('#days .day').forEach((row, i) => {
    const day = pstate.days[i];
    const res = r.rows[i];
    const d = r.weeks[Math.floor(i / 7)].days[i % 7];
    P.syncSwitches(row, day.segments);
    row.querySelectorAll('.pair').forEach((el, si) => {
      const sg = day.segments[si];
      el.classList.toggle('blank', !(sg && (sg.in || sg.out)));
    });
    row.querySelector('.hm').textContent = res.worked ? P.fmtDec(res.minutes / 60) : '—';
    row.querySelector('.gross').textContent = res.worked && paid ? usd(d.gross) : '';
    row.querySelector('.totals').classList.toggle('empty', !res.worked);
    row.classList.toggle('bad', res.bad);
    row.classList.toggle('long', res.long);
    row.classList.toggle('clocked', !!res.clocks);
    row.classList.toggle('cancopy', res.worked && !res.bad && !res.incomplete && P.copyTargets(pstate.days, i, payDayEmpty).length > 0);
    const text = P.noteText(res);
    row.querySelector('.daynotes .note').textContent = text;
    row.classList.toggle('noted', !!text);
  });
}

function pRender() {
  const ids = { 'rate-a': 'rateA', 'rate-b': 'rateB', 'ot-mult': 'otMult', 'dt-mult': 'dtMult', 'diff-amt': 'diffAmount',
    'diff-kind': 'diffKind', 'diff-from': 'diffFrom', 'diff-to': 'diffTo', period: 'period', start: 'start', rule: 'rule', employee: 'employee' };
  for (const id in ids) document.getElementById(id).value = pstate[ids[id]];
  pRenderDays();
}

// The sheet: the rates and multipliers at the top as cells, the days with their hours at each rate,
// and every pay figure a formula on those cells - change a rate in Excel and the card re-prices.
function payXlsxRows() {
  const r = payCompute(pstate);
  const cfg = r.cfg;
  const S = PX.STYLE;
  const rows = [];
  const employee = (pstate.employee || '').trim();
  if (employee) rows.push([{ v: 'Employee', s: S.bold }, employee]);
  if (pstate.days[0].date) {
    rows.push([{ v: 'Period', s: S.bold }, { d: pstate.days[0].date }, 'to', { d: pstate.days[pstate.days.length - 1].date }]);
  }
  rows.push([{ v: 'Overtime', s: S.bold }, PAY_RULES[cfg.rule] || '']);
  const cell = (label, v, s) => { rows.push([{ v: label, s: S.bold }, { v, s }]); return 'B' + rows.length; };
  const rateA = cell('Rate A', cfg.rates[0], S.money);
  const rateB = cell('Rate B', cfg.rates[1], S.money);
  const diffKindText = cfg.diffKind === 'percent' ? '% of the rate, an hour' : 'dollars an hour';
  const diff = cell('Shift differential', cfg.diff, cfg.diffKind === 'percent' ? S.dec : S.money);
  rows[rows.length - 1].push(diffKindText + ', ' + HOURS12(cfg.diffFrom) + ' to ' + HOURS12(cfg.diffTo));
  const otm = cell('Overtime multiplier', cfg.otMult, S.dec);
  const dtm = cell('Double time multiplier', cfg.dtMult, S.dec);
  rows.push([]);

  rows.push(['Date', 'Day', 'In / out', 'Hours at A', 'Hours at B', 'Differential hours', 'Differential pay', 'Hours',
    'Straight-time pay', 'Overtime hours', 'Double time hours', 'Gross pay'].map(v => ({ v, s: S.bold })));
  const abs = ref => '$' + ref.replace(/(\d+)$/, '$$$1');
  const A = abs(rateA), B = abs(rateB), D = abs(diff), OTM = abs(otm), DTM = abs(dtm);
  const weekRows = [];
  r.weeks.forEach((w, wi) => {
    const top = rows.length + 1, rrRow = top + 7; // the week's line sits under its seven days
    w.days.forEach((d, k) => {
      const day = pstate.days[wi * 7 + k];
      const n = rows.length + 1;
      const punches = day.segments.filter(sg => sg.in || sg.out)
        .map(sg => P.segLabel(sg) + (cfg.two ? ' (' + (sg.job === 1 ? 'B' : 'A') + ')' : '')).join('; ');
      const diffF = cfg.diffKind === 'percent'
        ? null // a percentage differential depends on which rate each covered hour was at; the value is written out
        : 'F' + n + '*' + D;
      rows.push([
        day.date ? { d: day.date } : '', day.label, punches,
        d.worked ? { v: d.jobMinutes[0] / 60, s: S.dec } : '',
        d.worked && cfg.two ? { v: d.jobMinutes[1] / 60, s: S.dec } : '',
        d.worked && cfg.diff > 0 ? { v: d.diffMinutes / 60, s: S.dec } : '',
        d.worked && cfg.diff > 0 ? (diffF ? { v: cents(d.diffPay), s: S.money, f: diffF } : { v: cents(d.diffPay), s: S.money }) : '',
        d.worked ? { v: d.minutes / 60, s: S.dec, f: 'D' + n + '+E' + n } : '',
        d.worked ? { v: cents(d.straight), s: S.money, f: 'D' + n + '*' + A + '+E' + n + '*' + B + '+G' + n } : '',
        d.worked ? { v: d.ot, s: S.dec } : '',
        d.worked && d.dt > 0 ? { v: d.dt, s: S.dec } : '',
        d.worked ? { v: cents(d.gross), s: S.money, f: 'I' + n + '+J' + n + '*(' + OTM + '-1)*$C$' + rrRow + '+K' + n + '*(' + DTM + '-1)*$C$' + rrRow } : ''
      ]);
    });
    const bottom = rows.length;
    const sum = c => 'SUM(' + c + top + ':' + c + bottom + ')';
    rows.push([
      { v: (r.weeks.length > 1 ? 'Week ' + (wi + 1) : 'Week') + ' - regular rate', s: S.bold }, '',
      { v: cents(w.regularRate), s: S.boldMoney, f: 'IF(H' + rrRow + '=0,0,I' + rrRow + '/H' + rrRow + ')' },
      { v: w.days.reduce((t, d) => t + d.jobMinutes[0], 0) / 60, s: S.boldDec, f: sum('D') },
      { v: w.days.reduce((t, d) => t + d.jobMinutes[1], 0) / 60, s: S.boldDec, f: sum('E') },
      { v: w.days.reduce((t, d) => t + d.diffMinutes, 0) / 60, s: S.boldDec, f: sum('F') },
      { v: cents(w.diffPay), s: S.boldMoney, f: sum('G') },
      { v: w.hours, s: S.boldDec, f: sum('H') },
      { v: cents(w.straight), s: S.boldMoney, f: sum('I') },
      { v: w.ot, s: S.boldDec, f: sum('J') },
      { v: w.dt, s: S.boldDec, f: sum('K') },
      { v: cents(w.gross), s: S.boldMoney, f: sum('L') }
    ]);
    weekRows.push(rows.length);
  });
  rows.push([]);
  const add = c => weekRows.map(n => c + n).join('+');
  const line = (label, v, s, f) => { rows.push([{ v: label, s: S.text }, '', '', '', '', '', '', '', '', '', '', { v, s, f }]); return rows.length; };
  line('Regular hours', r.reg, S.dec, add('H') + '-(' + add('J') + ')-(' + add('K') + ')');
  line('Overtime hours', r.ot, S.dec, add('J'));
  if (r.dt > 0) line('Double time hours', r.dt, S.dec, add('K'));
  line('Hours worked', r.hours, S.dec, add('H'));
  line('Straight-time pay', cents(r.straight), S.money, add('I'));
  line('Overtime premium', cents(r.premium), S.money, '(' + add('L') + ')-(' + add('I') + ')');
  rows.push([{ v: 'Gross pay', s: S.bold }, '', '', '', '', '', '', '', '', '', '', { v: cents(r.gross), s: S.boldMoney, f: add('L') }]);
  return rows;
}

const PAY_XLSX_WIDTHS = [24, 12, 34, 11, 11, 11, 12, 9, 13, 11, 11, 12];

function payXlsxName() {
  const d = pstate.days[0].date;
  return 'timecard-pay' + (d ? '-' + d : '') + '.xlsx';
}

function pBind() {
  const field = (id, key, rebuild) => document.getElementById(id).addEventListener(
    document.getElementById(id).tagName === 'SELECT' ? 'change' : 'input', e => {
      pstate[key] = e.target.value;
      if (rebuild) { pstate.days = payBlankDays(pstate.start, pstate.period); psave(); pRenderDays(); }
      else pchanged();
    });
  field('rate-a', 'rateA'); field('ot-mult', 'otMult'); field('dt-mult', 'dtMult');
  field('diff-amt', 'diffAmount'); field('diff-kind', 'diffKind'); field('diff-from', 'diffFrom'); field('diff-to', 'diffTo');
  field('rule', 'rule'); field('employee', 'employee');
  field('period', 'period', true); field('start', 'start', true);
  // A second rate puts the A / B switch on every pair; taking it away takes the switches off.
  document.getElementById('rate-b').addEventListener('input', e => {
    const had = payConfig(pstate).two;
    pstate.rateB = e.target.value; psave();
    if (payConfig(pstate).two !== had) pRenderDays(); else pRenderTotals();
  });
  document.getElementById('btn-xlsx').addEventListener('click', () => {
    P.download(payXlsxName(), PX.buildXlsx(payXlsxRows(), PAY_XLSX_WIDTHS, 'Time card and pay'),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });
  document.getElementById('btn-print').addEventListener('click', () => { pRender(); window.print(); });
  document.getElementById('btn-clear').addEventListener('click', () => {
    if (!confirm('Clear every time you have entered? Your rates stay.')) return;
    pstate.days = payBlankDays(pstate.start, pstate.period); psave(); pRenderDays();
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('[data-tool="pay"]')) {
      const opts = h => Array.from({ length: 24 }, (_, i) => P.el('option', { value: String(i) }, [HOURS12(i)]));
      document.getElementById('diff-from').append(...opts());
      document.getElementById('diff-to').append(...opts());
      pload(); pBind(); pRender();
    }
  });
}

if (typeof module !== 'undefined') {
  module.exports = { payConfig, multiplier, windowOverlap, payDay, payWeek, payCompute, payBlankDays, payNote, cents, usd,
                     payXlsxRows, payXlsxName, PAY_XLSX_WIDTHS, _setState: s => { pstate = s; } };
}
