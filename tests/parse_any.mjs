/**
 * Parse an arbitrary PDF path with the LEXFINDER parser and dump results + raw trace.
 * Usage: node tests/parse_any.mjs <absPath> [traceTerm]
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { createElement: () => ({}), head: { appendChild: () => {} } };
globalThis.window.__pdfjsLib = pdfjsLib;
globalThis.window.__tesseractWorker = null;

const { parseDocumentoPDF, analyzeAll, groupByY } = await import('../src/parser.js');

const path = process.argv[2];
const term = process.argv[3];
const buf = readFileSync(path);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

function fakeFile(name) { return { name, arrayBuffer: () => Promise.resolve(ab) }; }

const result = await parseDocumentoPDF(fakeFile('_x.pdf'), null);
console.log('=== TITULAR:', result.titular, '| BANCO:', result.banco, '| páginas:', result.numPages ?? '?');
console.log('=== TRANSAÇÕES:', result.transactions.length);
const grouped = analyzeAll(result.transactions);
let tot = 0, cnt = 0;
for (const [id, g] of Object.entries(grouped)) {
  const v = g.items.reduce((s, i) => s + (i.valor || 0), 0);
  tot += v; cnt += g.items.length;
  console.log(`  ${id.padEnd(20)} ${String(g.items.length).padStart(4)}x  R$ ${v.toFixed(2)}`);
}
console.log(`  TOTAL ${cnt}x  R$ ${tot.toFixed(2)}`);

if (term) {
  console.log(`\n=== TRANSAÇÕES contendo "${term}" ===`);
  for (const t of result.transactions) {
    if (t.historico.toUpperCase().includes(term.toUpperCase()))
      console.log(`  ${t.data}  R$ ${String(t.valor).padStart(9)}  ${t.historico}`);
  }
  console.log(`\n=== LINHAS BRUTAS (groupByY) contendo "${term}" ===`);
  const buf2 = readFileSync(path);
  const ab2 = buf2.buffer.slice(buf2.byteOffset, buf2.byteOffset + buf2.byteLength);
  const pdf = await pdfjsLib.getDocument({ data: ab2 }).promise;
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    const allText = tc.items.map(it => it.str).join(' ');
    if (allText.toUpperCase().includes(term.toUpperCase())) {
      console.log(`\n--- página ${p} contém "${term}" (header: ${allText.slice(0,120).replace(/\s+/g,' ')}) ---`);
    }
    const items = tc.items.filter(it => it.str.trim()).map(it => ({ text: it.str.trim(), x: it.transform[4], y: it.transform[5] }));
    const rows = groupByY(items, 4);
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].text.toUpperCase().includes(term.toUpperCase())) {
        for (let j = Math.max(0, i - 1); j <= Math.min(rows.length - 1, i + 1); j++) {
          const mark = j === i ? '>>' : '  ';
          console.log(`p${p}${mark} y${Math.round(rows[j].y)}: ${rows[j].items.map(c => `${c.text}@${Math.round(c.x)}`).join('  ')}`);
        }
        console.log('   --');
      }
    }
  }
}
