const assert = require('assert');
const x = require('../site/assets/xlsx.js');
const e = require('../site/assets/app.js');

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('  ok   ' + name); }
  catch (err) { failures++; console.log('  FAIL ' + name + '\n       ' + err.message); }
}

// A small zip reader: walks the central directory, checks every CRC, returns { name: text }.
function unzip(bytes) {
  const b = Buffer.from(bytes);
  const eocd = b.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert(eocd >= 0, 'no end-of-central-directory record');
  const count = b.readUInt16LE(eocd + 10), cdOffset = b.readUInt32LE(eocd + 16);
  const out = {};
  let p = cdOffset;
  for (let i = 0; i < count; i++) {
    assert.strictEqual(b.readUInt32LE(p), 0x02014b50, 'central header signature');
    const crc = b.readUInt32LE(p + 16), size = b.readUInt32LE(p + 20);
    const nameLen = b.readUInt16LE(p + 28), extraLen = b.readUInt16LE(p + 30), commentLen = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const name = b.slice(p + 46, p + 46 + nameLen).toString('utf8');
    assert.strictEqual(b.readUInt32LE(local), 0x04034b50, 'local header signature for ' + name);
    const lNameLen = b.readUInt16LE(local + 26), lExtraLen = b.readUInt16LE(local + 28);
    const dataStart = local + 30 + lNameLen + lExtraLen;
    const data = b.slice(dataStart, dataStart + size);
    assert.strictEqual(x.crc32(new Uint8Array(data)), crc, 'crc for ' + name);
    out[name] = data.toString('utf8');
    p += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

console.log('zip and crc');
check('crc32 of "123456789" is the standard check value', () => assert.strictEqual(x.crc32(Buffer.from('123456789')), 0xCBF43926));
check('stored zip round-trips', () => {
  const z = unzip(x.zipStored([{ name: 'a.txt', text: 'hello' }, { name: 'd/b.xml', text: '<x>é</x>' }]));
  assert.deepStrictEqual(Object.keys(z), ['a.txt', 'd/b.xml']);
  assert.strictEqual(z['a.txt'], 'hello');
  assert.strictEqual(z['d/b.xml'], '<x>é</x>');
});
check('column names', () => {
  assert.strictEqual(x.colName(0), 'A'); assert.strictEqual(x.colName(5), 'F');
  assert.strictEqual(x.colName(25), 'Z'); assert.strictEqual(x.colName(26), 'AA');
});
check('date serial: 2026-09-07 is 46272', () => assert.strictEqual(x.dateSerial('2026-09-07'), 46272));
check('date serial: 1900-03-01 is 61', () => assert.strictEqual(x.dateSerial('1900-03-01'), 61));

console.log('workbook parts');
const parts = unzip(x.buildXlsx([['a', 1]], [10, 10], 'Time card'));
check('has every required part', () => {
  for (const n of ['[Content_Types].xml', '_rels/.rels', 'xl/workbook.xml', 'xl/_rels/workbook.xml.rels', 'xl/styles.xml', 'xl/worksheets/sheet1.xml']) {
    assert(parts[n], 'missing ' + n);
  }
});
check('sheet name carried', () => assert(parts['xl/workbook.xml'].includes('name="Time card"')));
check('string is inline, number is bare', () => {
  const s = parts['xl/worksheets/sheet1.xml'];
  assert(s.includes('<c r="A1" t="inlineStr"><is><t xml:space="preserve">a</t></is></c>'));
  assert(s.includes('<c r="B1"><v>1</v></c>'));
});
check('xml is escaped', () => {
  const s = unzip(x.buildXlsx([['a & <b>']]))['xl/worksheets/sheet1.xml'];
  assert(s.includes('a &amp; &lt;b&gt;'));
});
check('formula cell carries formula and cached value', () => {
  const s = x.sheetXml([[{ v: 3, f: 'SUM(A1:A2)', s: 4 }]]);
  assert(s.includes('<c r="A1" s="4"><f>SUM(A1:A2)</f><v>3</v></c>'));
});

console.log('time card sheet');
function card(opts) {
  const days = e.buildDays('2026-09-07', 'week');
  days[0].segments = [{ in: '9', out: '12', inM: 'am', outM: 'pm' }, { in: '1', out: '5:30', inM: 'pm', outM: 'pm' }];
  days[1].segments = [{ in: '8', out: '6', inM: 'am', outM: 'pm' }];
  days[1].breakMins = '30';
  e._setState(Object.assign({ period: 'week', start: '2026-09-07', rule: 'weekly40', rate: '', employee: '', days }, opts));
  return e.toXlsxRows();
}
check('day rows hold real numbers: 7h30 as fraction of a day and as 7.5', () => {
  const rows = card();
  const head = rows.findIndex(r => r[0] && r[0].v === 'Date');
  const mon = rows[head + 1];
  assert.strictEqual(mon[0].d, '2026-09-07');
  assert.strictEqual(mon[1], 'Mon');
  assert.strictEqual(mon[2], '9:00am - 12:00pm; 1:00pm - 5:30pm');
  assert.strictEqual(mon[3], '');
  assert.strictEqual(mon[4].v, 450 / 1440);
  assert.strictEqual(mon[5].v, 7.5);
  const tue = rows[head + 2];
  assert.strictEqual(tue[3].v, 30);
  assert.strictEqual(tue[5].v, 9.5);
});
check('empty day writes no hour cells', () => {
  const rows = card();
  const head = rows.findIndex(r => r[0] && r[0].v === 'Date');
  assert.strictEqual(rows[head + 3][4], '');
  assert.strictEqual(rows[head + 3][5], '');
});
check('total row is a SUM over exactly the day rows', () => {
  const rows = card();
  const head = rows.findIndex(r => r[0] && r[0].v === 'Date');
  const total = rows.find(r => r[0] && r[0].v === 'Total hours');
  assert.strictEqual(total[4].f, 'SUM(E' + (head + 2) + ':E' + (head + 8) + ')');
  assert.strictEqual(total[5].f, 'SUM(F' + (head + 2) + ':F' + (head + 8) + ')');
  assert.strictEqual(total[5].v, 17);
});
check('no rate: no rate or pay rows; no employee: no employee row', () => {
  const rows = card();
  assert(!rows.some(r => r[0] && r[0].v === 'Gross pay'));
  assert(!rows.some(r => r[0] && r[0].v === 'Employee'));
});
check('rate given: pay is a formula off the rate cell', () => {
  const rows = card({ rate: '20', employee: 'A. Clerk' });
  assert.strictEqual(rows[0][1], 'A. Clerk');
  const rateRow = rows.findIndex(r => r[0] && r[0].v === 'Hourly rate') + 1;
  const regRow = rows.findIndex(r => r[0] && r[0].v === 'Regular hours') + 1;
  const otRow = rows.findIndex(r => r[0] && r[0].v === 'Overtime hours') + 1;
  const pay = rows.find(r => r[0] && r[0].v === 'Gross pay');
  assert.strictEqual(pay[5].f, 'F' + regRow + '*F' + rateRow + '+F' + otRow + '*F' + rateRow + '*1.5');
  assert.strictEqual(pay[5].v, 340);
});
check('california double time adds a row and a pay term', () => {
  const days = e.buildDays('2026-09-07', 'week');
  days[0].segments = [{ in: '6', out: '9', inM: 'am', outM: 'pm' }];
  e._setState({ period: 'week', start: '2026-09-07', rule: 'california', rate: '10', employee: '', days });
  const rows = e.toXlsxRows();
  const dt = rows.find(r => r[0] && r[0].v === 'Double time hours');
  assert.strictEqual(dt[5].v, 3);
  const pay = rows.find(r => r[0] && r[0].v === 'Gross pay');
  assert(/\*2$/.test(pay[5].f));
  assert.strictEqual(pay[5].v, 8 * 10 + 4 * 15 + 3 * 20);
});
check('file name carries the start date', () => {
  card();
  assert.strictEqual(e.xlsxName(), 'timecard-2026-09-07.xlsx');
});
check('whole card builds into a valid zip', () => {
  const rows = card({ rate: '20', employee: 'A & B' });
  const p = unzip(x.buildXlsx(rows, e.XLSX_WIDTHS, 'Time card'));
  const s = p['xl/worksheets/sheet1.xml'];
  assert(s.includes('A &amp; B'));
  assert(s.includes('<f>SUM('));
  assert(s.includes('<cols>'));
});

console.log(failures ? '\n' + failures + ' failed' : '\nall passed');
process.exit(failures ? 1 : 0);
