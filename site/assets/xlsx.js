'use strict';

// A real .xlsx with no library. An .xlsx is a zip of XML files; Excel accepts zip entries that
// are stored rather than deflated, so all a writer needs is a CRC-32 and the two zip headers.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function utf8(s) {
  if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
  return new Uint8Array(Buffer.from(s, 'utf8'));
}

// entries: [{ name, text }] -> Uint8Array of a stored zip
function zipStored(entries) {
  const parts = [], central = [];
  let offset = 0;
  const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF];
  const u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];
  // 1980-01-01 00:00 in DOS date/time, so the file is byte-identical for the same card
  const dosTime = u16(0), dosDate = u16(0x21);

  for (const e of entries) {
    const name = utf8(e.name), data = utf8(e.text), crc = crc32(data);
    const local = new Uint8Array([
      ...u32(0x04034b50), ...u16(20), ...u16(0x0800), ...u16(0), ...dosTime, ...dosDate,
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0)
    ]);
    parts.push(local, name, data);
    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0x0800), ...u16(0), ...dosTime, ...dosDate,
      ...u32(crc), ...u32(data.length), ...u32(data.length), ...u16(name.length), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0), ...u32(0), ...u32(offset)
    ]), name);
    offset += local.length + name.length + data.length;
  }

  const cdSize = central.reduce((a, c) => a + c.length, 0);
  const end = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(entries.length), ...u16(entries.length),
    ...u32(cdSize), ...u32(offset), ...u16(0)
  ]);

  const all = parts.concat(central, [end]);
  const out = new Uint8Array(all.reduce((a, c) => a + c.length, 0));
  let p = 0;
  for (const c of all) { out.set(c, p); p += c.length; }
  return out;
}

function xmlEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function colName(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + (n - 1) % 26) + s;
  return s;
}

// Excel counts days from 1899-12-30. An ISO date becomes a whole number.
function dateSerial(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000) + 25569;
}

// Style indexes, matching cellXfs below in order.
const STYLE = { text: 0, bold: 1, date: 2, hm: 3, dec: 4, boldHm: 5, boldDec: 6, money: 7, boldMoney: 8, int: 9 };

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<numFmts count="4">' +
  '<numFmt numFmtId="164" formatCode="[h]:mm"/>' +
  '<numFmt numFmtId="165" formatCode="0.00"/>' +
  '<numFmt numFmtId="166" formatCode="d mmm yyyy"/>' +
  '<numFmt numFmtId="167" formatCode="#,##0.00"/>' +
  '</numFmts>' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
  '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="10">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
  '<xf numFmtId="166" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
  '<xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
  '<xf numFmtId="167" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '<xf numFmtId="167" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>' +
  '<xf numFmtId="1" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
  '</cellXfs>' +
  '<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>' +
  '</styleSheet>';

// A cell is null (empty), a string, or { v, s, f, d }:
//   v  value: number, or string when no f/d
//   s  style index from STYLE
//   f  formula text without the leading '='; v is then the cached result
//   d  ISO date string, written as a real date
function cellXml(cell, ref) {
  if (cell == null || cell === '') return '';
  if (typeof cell !== 'object') cell = { v: cell };
  const s = cell.s ? ' s="' + cell.s + '"' : '';
  if (cell.d) return '<c r="' + ref + '"' + (s || ' s="' + STYLE.date + '"') + '><v>' + dateSerial(cell.d) + '</v></c>';
  if (cell.f) return '<c r="' + ref + '"' + s + '><f>' + xmlEsc(cell.f) + '</f><v>' + cell.v + '</v></c>';
  if (typeof cell.v === 'number') return '<c r="' + ref + '"' + s + '><v>' + cell.v + '</v></c>';
  return '<c r="' + ref + '"' + s + ' t="inlineStr"><is><t xml:space="preserve">' + xmlEsc(cell.v) + '</t></is></c>';
}

function sheetXml(rows, widths) {
  let cols = '';
  if (widths && widths.length) {
    cols = '<cols>' + widths.map((w, i) => '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>').join('') + '</cols>';
  }
  const body = rows.map((row, r) => {
    const cells = row.map((c, i) => cellXml(c, colName(i) + (r + 1))).join('');
    return '<row r="' + (r + 1) + '">' + cells + '</row>';
  }).join('');
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    cols + '<sheetData>' + body + '</sheetData></worksheet>';
}

// rows: array of arrays of cells; widths: column widths in characters. Returns Uint8Array.
function buildXlsx(rows, widths, sheetName) {
  const name = xmlEsc(sheetName || 'Sheet1');
  return zipStored([
    { name: '[Content_Types].xml', text:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
      '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
      '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
      '</Types>' },
    { name: '_rels/.rels', text:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
      '</Relationships>' },
    { name: 'xl/workbook.xml', text:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      '<sheets><sheet name="' + name + '" sheetId="1" r:id="rId1"/></sheets></workbook>' },
    { name: 'xl/_rels/workbook.xml.rels', text:
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
      '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
      '</Relationships>' },
    { name: 'xl/styles.xml', text: STYLES_XML },
    { name: 'xl/worksheets/sheet1.xml', text: sheetXml(rows, widths) }
  ]);
}

if (typeof module !== 'undefined') {
  module.exports = { buildXlsx, zipStored, crc32, colName, dateSerial, sheetXml, STYLE };
} else {
  window.HourstallyXlsx = { buildXlsx, STYLE };
}
