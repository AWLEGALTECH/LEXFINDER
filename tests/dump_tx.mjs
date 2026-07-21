/**
 * Dumps all parsed transactions for a fixture, for debugging.
 * Usage: node tests/dump_tx.mjs <fixtureFile> [grepRegex]
 */
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'fs';

globalThis.window = globalThis.window || {};
globalThis.document = globalThis.document || { createElement: () => ({}), head: { appendChild: () => {} } };
globalThis.window.__pdfjsLib = pdfjsLib;
globalThis.window.__tesseractWorker = null;

const { parseDocumentoPDF, analyzeAll, matchCategoria } = await import('../src/parser.js');

const file = process.argv[2];
const grep = process.argv[3] ? new RegExp(process.argv[3], 'i') : null;

function createFakeFile(buffer, name) {
  const ab = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return { name, arrayBuffer() { return Promise.resolve(ab); } };
}

const buf = readFileSync(`tests/fixtures/${file}`);
const result = await parseDocumentoPDF(createFakeFile(buf, file), null);
const grouped = analyzeAll(result.transactions);

console.log(`\n=== ${result.clientName} | ${result.banco} | ${result.transactions.length} tx ===\n`);
for (const t of result.transactions) {
  const cat = matchCategoria(t.historico);
  const line = `${(t.data||'—').padEnd(11)} ${String(cat?.id||'?').padEnd(16)} ${String(t.valor).padStart(10)}  ${t.historico}`;
  if (!grep || grep.test(t.historico) || grep.test(cat?.id||'')) console.log(line);
}
