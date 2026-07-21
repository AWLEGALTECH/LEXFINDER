/**
 * Traces raw grouped rows around a search term to diagnose value/date mis-picks.
 * Usage: node tests/trace_rows.mjs <fixtureFile> <searchTerm>
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { createElement: () => ({}), head: { appendChild: () => {} } };
globalThis.window.__pdfjsLib = pdfjsLib;
globalThis.window.__tesseractWorker = null;

const { loadPdfJs, groupByY, IS_VALUE, IS_DATE } = await import('../src/parser.js');

const file = process.argv[2];
const term = process.argv[3];
const buf = readFileSync(`tests/fixtures/${file}`);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const pdf = await pdfjsLib.getDocument({ data: ab }).promise;

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p);
  const tc = await page.getTextContent();
  const items = tc.items.filter(it => it.str.trim()).map(it => ({ text: it.str.trim(), x: it.transform[4], y: it.transform[5] }));
  const rows = groupByY(items, 4);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].text.includes(term)) {
      for (let j = Math.max(0, i - 2); j <= Math.min(rows.length - 1, i + 2); j++) {
        const mark = j === i ? ' >>' : '   ';
        const cells = rows[j].items.map(it => `${it.text}@${Math.round(it.x)}`).join('  ');
        console.log(`p${p}${mark} y${Math.round(rows[j].y)}: ${cells}`);
      }
      console.log('   ----');
    }
  }
}
