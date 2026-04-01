import { detectBank, BANK_PROFILES } from "./banks/index.js";

/* ─────────────────────────────────────────────
   CATEGORIAS / MATCHING
───────────────────────────────────────────── */
const THEME = {
  color: "#60a5fa",
  glow: "rgba(59,130,246,0.35)",
  gradient: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(29,78,216,0.06) 100%)",
  border: "rgba(59,130,246,0.28)",
};

function normalizeText(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const CATEGORIAS = [
  {
    id: "tarifas",
    label: "Cobranças Indevidas",
    sublabel: "Tarifas bancárias cobradas indevidamente",
    icon: "!",
    ...THEME,
    keywords: ["tarifa bancaria", "saqueterminal", "saquecorrespondente", "saquepessoal", "saquetermi", "saquecorre", "pend.tarifas bancaria", "lancamento a debito", "recebimento fornecedor", "tar bancaria", "tar saqueterminal", "tar saquecorre", "tar receb fornecedor", "saque bradesco", "saque compartilhado", "saque terminal", "tar manut conta", "manutencao de conta", "tar renovacao cartao", "tar transferencia"],
    fundamento: "Art. 3º, Res. CMN 3.919/10; Súmula 297 STJ",
    acao: "Pleitear restituição em dobro das tarifas cobradas sem prévia contratação expressa (Art. 42, CDC). Verificar se houve autorização expressa em contrato.",
    descricao: "Cobrança Indevida",
  },
  {
    id: "adiantamento",
    label: "Adiantamento ao Depositante",
    sublabel: "Cobranças por adiantamento ao depositante",
    icon: "!",
    ...THEME,
    keywords: ["vr.parcial adiant.depositant", "tar adiant.depositante", "adiant.depositante", "adiantamento depositante", "adiantamento ao depositante", "tar adiant deposito", "adiant deposito", "adiantamento dep"],
    fundamento: "Art. 52 e 422, CC; Res. CMN 3.919/10",
    acao: "Verificar se houve efetiva utilização do adiantamento. Cobranças de adiantamento ao depositante sem solicitação expressa são passíveis de repetição de indébito.",
    descricao: "Adiantamento ao Depositante",
  },
  {
    id: "cesta",
    label: "Pacotes e Cestas",
    sublabel: "Mensalidades de pacotes de serviços",
    icon: "!",
    ...THEME,
    keywords: ["vr.parcial cesta b.expresso", "cesta b.expresso", "vr.parcial cesta facil", "vr.parcial cesta", "cesta facil economica", "cesta facil master", "cesta facil super", "cesta facil mais", "cesta facil", "cesta exclusive", "cesta exclus mais", "cesta exclus. max", "cesta classic mais", "cesta classic", "cesta prime classica", "cesta poupanca", "cesta universitaria", "cesta beneficiario", "cesta benefic", "cesta bradesco expre", "cesta celular", "cesta expresso", "cesta", "pacote de servicos", "pacote servico padro", "pacote servico", "pacote servicos", "pacote", "padronizado prioritarios ii", "padronizado prioritarios i", "padronizado prioritarios", "pserv", "binclub servicos", "binclub", "pagto eletron cobranca (pserv)", "cesta smart", "cesta digital", "cesta basica", "cesta plus", "cesta master plus", "cesta classic super", "cesta exclusive plus", "cesta especial", "cesta personalizada", "pacote de servicos essencial"],
    fundamento: "Art. 3º e 4º, Res. CMN 3.919/10; Art. 39, CDC",
    acao: "Verificar se o cliente efetivamente contratou o pacote. Em caso negativo, pleitear restituição de todos os valores cobrados nos últimos 5 anos.",
    descricao: "Pacote/Cesta de Serviços",
  },
  {
    id: "encargos",
    label: "Encargos e IOF",
    sublabel: "Encargos sobre limite de crédito e IOF",
    icon: "!",
    ...THEME,
    keywords: ["encargos limite de cred", "encargos limite credito", "encargos descoberto cc", "encargos descoberto", "encargos saldo vinculado", "encargo saldo vinculado", "encargos excesso limite", "encargos", "iof s/ utilizacao limite", "iof s/utilizacao", "iof s/", "encargos cheque especial", "encargos conta garantida", "encargos atraso", "encargos financeiros", "iof complementar"],
    fundamento: "Art. 52 e 422, CC; Res. CMN 3.919/10; Dec. 6.306/07",
    acao: "Verificar se houve efetiva utilização do limite. Encargos e IOF cobrados sem utilização ou em duplicidade são passíveis de repetição de indébito.",
    descricao: "Encargo sobre Limite / IOF",
  },
  {
    id: "mora",
    label: "Mora de Crédito",
    sublabel: "Juros de mora em operações de crédito",
    icon: "!",
    ...THEME,
    keywords: ["mora credito pessoal", "mora cred pess", "mora conta de telefone", "mora cta telef", "mora de operacao", "mora operacao de credito", "mora cartao de credito", "mora cartao", "mora encargos", "mora vida e previdencia", "mora enc descoberto", "mora enc descoberto c.c", "mora limite credito", "mora consignado", "mora financiamento", "mora cdc", "juros mora", "juros atraso"],
    fundamento: "Art. 52, §1º, CDC; Súmula 379 STJ",
    acao: "Verificar legalidade da cobrança. Mora decorrente de cobranças indevidas é igualmente indevida. Pleitear cancelamento da mora sobre débitos contestados.",
    descricao: "Mora de Crédito",
  },
  {
    id: "seguros",
    label: "Seguro",
    sublabel: "Seguros e previdência cobrados indevidamente",
    icon: "!",
    ...THEME,
    keywords: ["bradesco vida e previdencia s/a", "bradesco vida e previdencia", "bradesco vida e prev", "bradesco vida prev-seg", "bradesco vida prev", "bradesco seg-resid/outros", "bradesco seg-resid", "prev-seg", "vida e previdencia", "sabemi segurado", "sabemi", "seguro prestamista", "seguro protecao financeira", "seguro mais protegido", "seg protecao cheque esp", "seg protecao cheque", "seguro cart deb bradesco", "servico cartao protegido", "seguradora secon", "aspecir - uniao seguradora", "aspecir", "odontoprev s/a", "odontoprev", "mbm previdencia complementar", "mbm previdencia", "previplan clube", "previplan", "aquisicao/devolucao-seg", "liberty seguros", "viza prev seguros", "sebraseg clube de beneficios", "sebraseg", "sudamerica clube de servicos", "sudamerica clube", "previsul", "crefisa sa credito financiamento", "pagto eletron cobranca (brades resi)", "pagto eletron cobranca (vida pre)", "pagto eletron cobranca (dental saude)", "pagto eletron cobranca (ace seguradora", "pagto eletron cobranca (centro de assistencia)", "pagto eletron cobranca cenasp", "bradesco auto", "bradesco saude", "bradesco dental", "seguro residencial", "seguro vida", "seguro acidentes pessoais", "seguro desemprego", "seguro perda involuntaria", "zurich seguros", "mapfre seguros", "porto seguro", "pagto eletron cobranca (mapfre)", "pagto eletron cobranca (zurich)"],
    fundamento: "Art. 39, III, CDC; Súmula 473 STJ; Art. 757, CC",
    acao: "Verificar se o seguro foi contratado voluntariamente. Seguros vinculados a financiamentos sem opção de recusa são abusivos (Súmula 473 STJ). Pleitear cancelamento e devolução.",
    descricao: "Seguro",
  },
  {
    id: "tit_cap",
    label: "Título de Capitalização",
    sublabel: "Títulos de capitalização cobrados indevidamente",
    icon: "!",
    ...THEME,
    keywords: ["titulo de capitalizacao", "bradesco capitalizacao", "resg.tit.capitalizacao", "capitalizacao 1171", "tit capitalizacao", "titulo cap", "cap periodica", "bradesco cap"],
    fundamento: "Art. 39, I e V, CDC; Súmula 473 STJ",
    acao: "Verificar se houve contratação voluntária do título de capitalização. Títulos vinculados a abertura de conta ou crédito sem consentimento são abusivos. Pleitear cancelamento e restituição integral.",
    descricao: "Título de Capitalização",
  },
  {
    id: "credito",
    label: "Parcela de Crédito Pessoal",
    sublabel: "Parcelas de empréstimos e operações de crédito",
    icon: "!",
    ...THEME,
    keywords: ["emprestimo pessoal", "parcela oper de credito", "parcela credito pessoal", "parc cred pess", "parcela oper", "bx.ant.financ/emp", "bx.ant.fin/emp", "bx.ant.financ", "bx ant financ", "bx ant fin", "bx ant", "bx.antecipacao", "operacoes vencidas", "operacoes venvidas", "div. em atraso", "divida em atraso", "jbcred sociedade", "jbcred", "crefisa", "sudacred", "suda", "agiplan financeira", "agiplan", "easycob", "eagle", "gasto e credito", "pagto eletron cobranca (eagle)", "parcela emprestimo", "parcela financiamento", "amort emprestimo", "amortizacao emprestimo", "prestacao credito", "parcela consignado", "parcela cdc", "cdc credito"],
    fundamento: "Art. 52, CDC; Lei 10.931/04; Res. CMN 4.559/17",
    acao: "Solicitar demonstrativo completo da operação. Verificar CET e taxa de juros. Contestar cobranças acima do contratado ou sem autorização expressa.",
    descricao: "Parcela de Crédito Pessoal",
  },
  {
    id: "anuidade",
    label: "Anuidade e Cartão",
    sublabel: "Anuidades e tarifas de cartão de crédito",
    icon: "!",
    ...THEME,
    keywords: ["anuidade", "cartao credito anuidade", "gasto c/cartao de credito", "gastos cartao de credito", "gastos cartao credito", "gasto c credito", "gasto cartao de credito", "gasto cartao credito", "provisao gasto cart cred", "gasto c/cartao", "gastos c/cartao", "gasto cart cred", "anuidade cartao visa", "anuidade cartao master", "anuidade cartao elo", "anuidade internacional", "anuidade platinum", "anuidade gold", "gasto cartao debito", "compra cartao debito"],
    fundamento: "Res. CMN 3.919/10; Art. 39, CDC",
    acao: "Verificar se a anuidade foi informada no momento da contratação. Anuidades cobradas sem previsão contratual expressa são indevidas.",
    descricao: "Anuidade/Tarifa de Cartão",
  },
  {
    id: "extrato",
    label: "Emissão de Documentos",
    sublabel: "Tarifas por extratos e segunda via",
    icon: "!",
    ...THEME,
    keywords: ["emissao extrato", "tarifa emissao extrato", "emissao extratos unificado", "extratomes", "extratomomovimento", "extratomovimento", "2via de extrato", "extrato unificado", "tar demonst.consolidade", "tar demonstr consolidado", "2 via cartaodebito", "tar 2 via cartao debito", "tar 2 via cartao", "2 via", "segunda via", "tarifa emissao doc", "tarifa 2via cartao", "tarifa 2via senha", "emissao comprovante", "emissao informe rendimentos"],
    fundamento: "Art. 6º, VIII, CDC; Res. CMN 3.919/10",
    acao: "Emissão de extratos é direito do consumidor (Art. 6º, VIII, CDC). Cobrança por acesso à informação bancária é abusiva. Pleitear devolução dos valores.",
    descricao: "Emissão de Extrato/Documento",
  },
  {
    id: "invest_facil",
    label: "Invest Fácil",
    sublabel: "Aplicações compulsórias sem rendimento real",
    icon: "⚠",
    ...THEME,
    keywords: ["aplic.invest facil", "invest facil", "aplicacao invest facil", "aplic invest facil", "aplic.invest", "investfacil", "invest.facil", "resgate invest facil", "aplicacao automatica", "invest facil auto"],
    fundamento: "Art. 39, IV, CDC; Art. 422, CC; Art. 187, CC",
    acao: "ATENÇÃO — Os valores de Invest Fácil NÃO são para reembolso direto. O dinheiro aplicado retorna ao cliente, porém sem rendimento real. A prática é abusiva por si só: o banco utiliza os recursos do cliente em benefício próprio, sem transparência sobre rentabilidade. Documentar a prática abusiva como fundamento adicional na ação principal.",
    descricao: "Invest Fácil (prática abusiva)",
    naoReembolsavel: true,
  },
  {
    id: "outros",
    label: "Outras Cobranças",
    sublabel: "Cobranças irregulares diversas",
    icon: "!",
    ...THEME,
    keywords: ["msg", "regularizacao manual", "regularizacao lancamento", "reorganizacao financeira", "debito automatico", "doc/ted internet", "sms aviso", "notificacao sms", "tar notificacao", "debito automatico tarifa"],
    fundamento: "Art. 39, CDC; Res. CMN 3.919/10",
    acao: "Verificar natureza da cobrança e se houve autorização contratual expressa. Solicitar memória de cálculo e contestar cobranças sem fundamento contratual.",
    descricao: "Cobrança Diversa",
  },
];

function matchCategoria(historico) {
  const h = normalizeText(historico);
  // REM: = remetente de PIX/TED, DES: = destinatário — nunca são tarifas bancárias
  if (/\brem\s*:/.test(h) || /\bdes\s*:/.test(h)) return null;
  // Busca o match com keyword MAIS LONGA (mais específica) entre todas as categorias.
  // Desempate: keyword que aparece MAIS TARDE no texto é mais específica.
  // Ex: "TARIFA BANCARIA CESTA B.EXPRESSO" → "cesta b.expresso" (pos 16) vence "tarifa bancaria" (pos 0)
  let bestCat = null;
  let bestLen = 0;
  let bestPos = -1;
  for (const cat of CATEGORIAS) {
    for (const kw of cat.keywords) {
      const nkw = normalizeText(kw);
      const pos = h.indexOf(nkw);
      if (pos === -1) continue;
      if (nkw.length > bestLen || (nkw.length === bestLen && pos > bestPos)) {
        bestLen = nkw.length;
        bestCat = cat;
        bestPos = pos;
      }
    }
  }
  return bestCat;
}

function analyzeAll(transactions) {
  const grouped = {};
  for (const t of transactions) {
    const cat = matchCategoria(t.historico);
    if (!cat) continue;
    if (!grouped[cat.id]) grouped[cat.id] = { cat, items: [] };
    grouped[cat.id].items.push(t);
  }
  return grouped;
}

/* ─────────────────────────────────────────────
   PDF PARSER
───────────────────────────────────────────── */
const PDFJS_VERSION = "3.11.174";

async function loadPdfJs() {
  if (window.__pdfjsLib) return window.__pdfjsLib;
  await new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;
  window.__pdfjsLib = window.pdfjsLib;
  return window.__pdfjsLib;
}

/* ── OCR Fallback (PDFs com texto renderizado como paths vetoriais) ── */
const OCR_SCALE = 4; // 4x = ~288 DPI — mais pixels entre rows, melhor segmentacao

async function loadTesseract() {
  if (window.__tesseractWorker) return window.__tesseractWorker;
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por");
  // PSM 3 = "Fully automatic page segmentation" — default, melhor para pagina completa
  // A separação de linhas é feita pelo strip detection, não pelo Tesseract
  await worker.setParameters({ tessedit_pageseg_mode: "3" });
  window.__tesseractWorker = worker;
  return worker;
}

function ocrCleanText(text) {
  if (!text) return "";
  text = text.trim();
  // Colapsar espacos dentro de sequencias numericas: "1. 234,56" → "1.234,56"
  text = text.replace(/(\d)\s*\.\s*(\d)/g, "$1.$2");
  text = text.replace(/(\d)\s*,\s*(\d)/g, "$1,$2");
  text = text.replace(/^-\s+(\d)/, "-$1");
  return text;
}

function otsuThreshold(histogram, total) {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];
  let sumB = 0, wB = 0, wF = 0;
  let maxVariance = 0, threshold = 0;
  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    wF = total - wB;
    if (wF === 0) break;
    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) { maxVariance = variance; threshold = t; }
  }
  return threshold;
}

function preprocessCanvas(ctx, width, height) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  // Grayscale conversion
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = data[i + 1] = data[i + 2] = gray;
  }
  // Build histogram
  const hist = new Uint32Array(256);
  const totalPixels = width * height;
  for (let i = 0; i < data.length; i += 4) hist[data[i]]++;
  // Otsu threshold
  const threshold = otsuThreshold(hist, totalPixels);
  // Binarize
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] < threshold ? 0 : 255;
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
}

async function ocrPage(pdfPage, worker, scale = OCR_SCALE) {
  const viewport = pdfPage.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  await pdfPage.render({ canvasContext: ctx, viewport }).promise;
  preprocessCanvas(ctx, canvas.width, canvas.height);
  const { data } = await worker.recognize(canvas, {}, { blocks: true });
  canvas.width = 0; canvas.height = 0;

  // Word-level com Y central — groupByY com tolerance tight separa rows
  const words = (data.blocks || [])
    .flatMap(b => (b.paragraphs || []))
    .flatMap(p => (p.lines || []))
    .flatMap(l => (l.words || []));

  const items = [];
  const warnings = [];
  for (const word of words) {
    // Filter out low-confidence words (likely noise)
    if (word.confidence < 30) continue;
    const text = ocrCleanText(word.text);
    if (!text) continue;
    // Warn on low-confidence values
    if (word.confidence < 60 && IS_VALUE.test(text)) {
      warnings.push({ text, confidence: word.confidence, page: pdfPage.pageNumber || 0 });
    }
    const centerY = (word.bbox.y0 + word.bbox.y1) / 2;
    items.push({
      text,
      x: word.bbox.x0 / scale,
      y: (viewport.height - centerY) / scale,
    });
  }
  return { items, warnings };
}

function groupByY(items, tolerance = 4) {
  const rows = [];
  const used = new Set();
  const sorted = [...items].sort((a, b) => b.y - a.y);
  for (let i = 0; i < sorted.length; i++) {
    if (used.has(i)) continue;
    const base = sorted[i];
    const row = [base];
    used.add(i);
    for (let j = i + 1; j < sorted.length; j++) {
      if (!used.has(j) && Math.abs(sorted[j].y - base.y) <= tolerance) {
        row.push(sorted[j]);
        used.add(j);
      }
    }
    row.sort((a, b) => a.x - b.x);
    rows.push({ y: base.y, items: row, text: row.map(r => r.text).join(" ") });
  }
  return rows.sort((a, b) => b.y - a.y);
}

function parseValor(s) {
  if (!s) return null;
  const clean = s.replace(/[DC]$/i, "").replace(/\./g, "").replace(",", ".");
  const v = parseFloat(clean);
  return isNaN(v) || v === 0 ? null : Math.abs(v);
}

const IS_DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const IS_VALUE = /^-?\d{1,3}(?:\.\d{3})*,\d{2}[DC]?$/i;
// Detecta linhas de cabeçalho/rodapé de página que NÃO são transações
const IS_HEADER = /bradesco\s+celular|extrato\s+de\s*:|folha\s*:\s*\d+\/\d+|data\s+hist[oó]rico|cr[eé]dito\s*\(r\$\)|d[eé]bito\s*\(r\$\)|saldo\s*\(r\$\)|movimenta[cç][aã]o\s+entre|transf\s+saldo\s+c\/sal\s+p\/cc|[uú]ltimos\s+lan[cç]amentos|total\s+data\s*:|^data\s*:\s*\d{2}\/\d{2}\/\d{4}|^nome\s*:\s*[A-Z]/i;
// Detecta linhas de TOTAL / sumário do extrato — não são transações reais
const IS_SUMMARY = /^\s*total\b|\btotal\s*$|[uú]ltimos\s+lan[cç]amentos/i;
const IS_SEPARATE_TX = /\b(transfer[eê]ncia\s*pix|pix\s+(enviado|recebido|qrcode)|compra\s*(elo|visa|master|d[eé]bito|cr[eé]dito)|saque\s*(dinheiro|terminal|compartilhado|bradesco|pessoal|correspon)|ted\s|dep[oó]sito\s|pagamento\s+(de\s+)?titulo|pagto\s|cr[eé]dito\s+de\s+sal[aá]rio|credito\s+salario|pgto\s+fornecedor)\b/i;

function pickDebit(rowValues, cols) {
  if (!rowValues.length) return null;
  const { debitoX, creditoX, saldoX } = cols;

  if (debitoX !== null) {
    // Pegar o valor mais próximo da coluna Débito que NÃO esteja mais perto de Crédito ou Saldo
    let best = null, bestDist = Infinity;
    for (const rv of rowValues) {
      const distDeb = Math.abs(rv.x - debitoX);
      if (creditoX !== null && Math.abs(rv.x - creditoX) < distDeb) continue;
      if (saldoX !== null && Math.abs(rv.x - saldoX) < distDeb) continue;
      if (distDeb < bestDist) { bestDist = distDeb; best = rv; }
    }
    return best ? parseValor(best.text) : null;
  }

  // Fallback sem detecção de colunas: remove último (provável saldo), pega penúltimo
  const candidates = rowValues.length >= 2 ? rowValues.slice(0, -1) : rowValues;
  return candidates.length ? parseValor(candidates[candidates.length - 1].text) : null;
}

function clusterColumns(allValueItems) {
  const xPositions = allValueItems.map(it => it.x);
  if (xPositions.length < 6) return null;
  // Histogram binning (bin width = 15pt)
  const bins = {};
  for (const x of xPositions) {
    const bin = Math.round(x / 15) * 15;
    bins[bin] = (bins[bin] || 0) + 1;
  }
  // Top 3 bins = credito, debito, saldo (sorted by X)
  const peaks = Object.entries(bins)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([x]) => parseFloat(x))
    .sort((a, b) => a - b);
  if (peaks.length === 3) return { creditoX: peaks[0], debitoX: peaks[1], saldoX: peaks[2] };
  if (peaks.length === 2) return { creditoX: null, debitoX: peaks[0], saldoX: peaks[1] };
  return null;
}

// Detecta layout: "superior" (data no topo do grupo) vs "inferior" (data no final do grupo)
function detectLayout(allRows) {
  let beforeCount = 0, afterCount = 0;
  const dateIndices = [];
  for (let i = 0; i < allRows.length; i++) {
    if (IS_DATE.test(allRows[i].items[0]?.text || "")) dateIndices.push(i);
  }
  if (dateIndices.length < 2) return "superior";
  for (const di of dateIndices) {
    // Linha imediatamente ANTES da data tem valores sem data?
    if (di > 0) {
      const prev = allRows[di - 1];
      const prevHasDate = IS_DATE.test(prev.items[0]?.text || "");
      const prevHasValues = prev.items.some(it => IS_VALUE.test(it.text));
      if (!prevHasDate && prevHasValues) beforeCount++;
    }
    // Linha imediatamente DEPOIS da data tem valores sem data?
    if (di < allRows.length - 1) {
      const next = allRows[di + 1];
      const nextHasDate = IS_DATE.test(next.items[0]?.text || "");
      const nextHasValues = next.items.some(it => IS_VALUE.test(it.text));
      if (!nextHasDate && nextHasValues) afterCount++;
    }
  }
  return beforeCount > afterCount ? "inferior" : "superior";
}

// Extrai histórico e valor de débito de uma row
function extractFromRow(row, cols, skipDate) {
  const startIdx = skipDate ? 1 : 0;
  const afterStart = row.items.slice(startIdx);
  const firstValIdx = afterStart.findIndex(i => IS_VALUE.test(i.text));
  const histItems = firstValIdx >= 0 ? afterStart.slice(0, firstValIdx) : afterStart;
  const historico = histItems.map(i => i.text).join(" ").trim();
  const rowValues = row.items.filter(i => IS_VALUE.test(i.text));
  const debitVal = rowValues.length > 0 ? pickDebit(rowValues, cols) : null;
  return { historico, debitVal };
}

/* ── Pass 1: Classificar cada row (date / values / text / header / summary / empty) ── */
function classifyRows(allRows, cols, needsOCR) {
  const classified = [];
  for (let ri = 0; ri < allRows.length; ri++) {
    const row = allRows[ri];
    const first = row.items[0]?.text || "";
    const isDateRow = IS_DATE.test(first);
    const rowValues = row.items.filter(i => IS_VALUE.test(i.text));
    const hasValues = rowValues.length > 0;
    const text = row.items.map(i => i.text).join(" ").trim();

    // Skip empty rows
    if (!text) { classified.push({ type: "empty", ri }); continue; }

    // Headers and summaries
    if (IS_HEADER.test(text) && !matchCategoria(text)) { classified.push({ type: "header", ri }); continue; }
    if (IS_SUMMARY.test(text)) { classified.push({ type: "summary", ri }); continue; }

    if (isDateRow) {
      const { historico, debitVal } = extractFromRow(row, cols, true);
      if (IS_SUMMARY.test(historico)) { classified.push({ type: "summary", ri }); continue; }
      classified.push({
        type: "date",
        ri,
        date: first,
        historico,
        debitVal,
        hasValues,
        rowValues,
        row,
      });
    } else if (hasValues) {
      // Row with values but no date
      const { historico, debitVal } = extractFromRow(row, cols, false);
      classified.push({
        type: "values",
        ri,
        historico,
        debitVal,
        hasValues: true,
        rowValues,
        row,
      });
    } else {
      // Text-only row
      const cat = matchCategoria(text);
      classified.push({
        type: "text",
        ri,
        text,
        categoria: cat,
        row,
      });
    }
  }
  return classified;
}

/* ── Pass 2: Montar transações com contexto bidirecional ── */
function assembleTransactions(classified, layout) {
  const allTransactions = [];
  const buffer = []; // para layout "inferior"
  let lastDate = null;

  function emit(t) {
    if (IS_SUMMARY.test(t.historico)) return;
    if (layout === "inferior" && !t.data) {
      buffer.push(t);
    } else {
      allTransactions.push(t);
    }
  }

  function flushBuffer(date) {
    for (const t of buffer) { if (!t.data) t.data = date; }
    allTransactions.push(...buffer);
    buffer.length = 0;
  }

  // Helper: look ahead from index i+1 for consecutive "text" rows, then a "values" or "date" row
  function lookAhead(i) {
    let j = i + 1;
    while (j < classified.length && classified[j].type === "text") j++;
    if (j < classified.length) return classified[j];
    return null;
  }

  // Track what the last emitted transaction was (for detail appending)
  let lastEmitted = null;
  // Track if we're in a "just emitted" state (previous row produced a transaction)
  let justEmitted = false;
  // Pending transaction being built
  let pending = null;

  for (let i = 0; i < classified.length; i++) {
    const c = classified[i];

    if (c.type === "empty" || c.type === "header" || c.type === "summary") {
      if (c.type === "summary") { pending = null; justEmitted = false; }
      continue;
    }

    if (c.type === "date") {
      // Flush any pending with value
      if (pending?.valor) { emit(pending); lastEmitted = pending; pending = null; }
      justEmitted = false;

      // In inferior layout, date flushes buffer
      if (layout === "inferior") flushBuffer(c.date);
      lastDate = c.date;

      if (c.hasValues && c.debitVal) {
        // Complete transaction on one line
        const t = { data: c.date, historico: c.historico, valor: c.debitVal };
        emit(t);
        lastEmitted = t;
        pending = null;
        justEmitted = true;
      } else if (c.hasValues) {
        // Has values but no debit (credit-only) — phantom absorber
        pending = null;
        lastEmitted = { data: c.date, historico: c.historico, valor: null };
        justEmitted = true;
      } else {
        // Date with text but no values — start pending
        pending = { data: c.date, historico: c.historico, valor: null };
      }

    } else if (c.type === "text") {
      if (pending?.valor) { emit(pending); lastEmitted = pending; pending = null; justEmitted = "pending-close"; }

      if (pending) {
        // Continue building pending's historico
        if (IS_SUMMARY.test(pending.historico)) { pending = null; continue; }
        // Guard: if pending already has a value AND text is a separate transaction, close pending
        if (IS_SEPARATE_TX.test(c.text) && pending.valor) {
          emit(pending); lastEmitted = pending;
          pending = { data: pending.data, historico: c.text, valor: null };
          continue;
        }
        // Guard: text has recognized category but pending has no value and no category → start new pending
        if (c.categoria && !pending.valor && !matchCategoria(pending.historico)) {
          pending = { data: pending.data, historico: c.text, valor: null };
          continue;
        }
        pending.historico = (pending.historico + " " + c.text).trim();
      } else if (justEmitted && lastEmitted) {
        // BIDIRECTIONAL DECISION: Is this text a detail of lastEmitted, or title of a new transaction?

        // Look ahead: does the next non-text row have values?
        const nextNonText = lookAhead(i);
        const nextHasValues = nextNonText && (nextNonText.type === "values" || (nextNonText.type === "date" && nextNonText.hasValues));

        // Check categories (any justEmitted state, not just "standalone")
        const textCat = justEmitted && nextHasValues ? c.categoria : null;
        const lastCat = textCat ? matchCategoria(lastEmitted.historico) : null;

        // Case 1: standalone-emitted + next has values + different category → new transaction
        if (textCat && (!lastCat || textCat.id !== lastCat.id)) {
          // Exception: CESTA is sub-description of TARIFA
          if (lastCat && textCat.id === "cesta" && lastCat.id === "tarifas") {
            lastEmitted.historico = (lastEmitted.historico + " " + c.text).trim();
          } else {
            const date = layout === "superior" ? lastDate : null;
            if (date || layout === "inferior") {
              pending = { data: date, historico: c.text, valor: null };
            }
            justEmitted = false;
          }
        } else {
          // Guard: separate transaction patterns should never be merged as details
          if (IS_SEPARATE_TX.test(c.text)) {
            const date = layout === "superior" ? lastDate : null;
            if (date || layout === "inferior") {
              pending = { data: date, historico: c.text, valor: null };
            }
            justEmitted = false;
          } else if (c.categoria && lastEmitted.valor && !matchCategoria(lastEmitted.historico)) {
            // BIDIRECTIONAL CHECK: lastEmitted has value but no recognized category — prepend keyword text
            lastEmitted.historico = (c.text + " " + lastEmitted.historico).trim();
          } else {
            // Default: append as detail
            lastEmitted.historico = (lastEmitted.historico + " " + c.text).trim();
          }
        }
      } else {
        // No pending, not just emitted — check if this is sub-description of last
        if (lastEmitted && lastEmitted.valor) {
          const lCat = matchCategoria(lastEmitted.historico);
          const tCat = c.categoria;
          if (lCat?.id === "tarifas" && tCat?.id === "cesta") {
            lastEmitted.historico = (lastEmitted.historico + " " + c.text).trim();
            continue;
          }
        }
        // Start new pending
        const date = layout === "superior" ? lastDate : null;
        if (date || layout === "inferior") {
          pending = { data: date, historico: c.text, valor: null };
        }
        justEmitted = false;
      }

    } else if (c.type === "values") {
      if (pending) {
        // Close pending with these values
        const firstValIdx = c.row.items.findIndex(it => IS_VALUE.test(it.text));
        if (firstValIdx > 0) {
          const extra = c.row.items.slice(0, firstValIdx).map(it => it.text).join(" ").trim();
          if (extra) pending.historico = (pending.historico + " " + extra).trim();
        }
        if (c.debitVal) {
          pending.valor = c.debitVal;
          emit(pending);
          lastEmitted = pending;
          justEmitted = firstValIdx === 0 ? "pending-close" : false;
        }
        pending = null;
      } else {
        // Standalone transaction
        if (c.debitVal) {
          const date = layout === "superior" ? lastDate : null;
          const t = { data: date, historico: c.historico, valor: c.debitVal };
          emit(t);
          lastEmitted = t;
          justEmitted = "standalone";
        } else {
          // Credit-only standalone — phantom
          lastEmitted = { data: layout === "superior" ? lastDate : null, historico: c.historico, valor: null };
          justEmitted = "standalone";
        }
      }
    }
  }

  // Final flush
  if (pending?.valor) { emit(pending); lastEmitted = pending; }
  if (buffer.length > 0) flushBuffer(lastDate || "—");

  return allTransactions;
}

function validateWithBalance(transactions, allRows, cols) {
  // Extract saldo values from rows that have 3 values (credito, debito, saldo)
  const warnings = [];
  let prevSaldo = null;
  for (const row of allRows) {
    const values = row.items.filter(i => IS_VALUE.test(i.text));
    if (values.length < 2 || !cols.saldoX) continue;
    // Find the saldo value (closest to saldoX)
    let saldoItem = null, minDist = Infinity;
    for (const v of values) {
      const dist = Math.abs(v.x - cols.saldoX);
      if (dist < minDist) { minDist = dist; saldoItem = v; }
    }
    if (!saldoItem) continue;
    const saldo = parseValor(saldoItem.text);
    if (saldo === null) continue;
    if (prevSaldo !== null) {
      const diff = Math.abs(saldo - prevSaldo);
      // Find the debit value for this row
      const debitItem = values.find(v => v !== saldoItem && cols.debitoX && Math.abs(v.x - cols.debitoX) < 50);
      if (debitItem) {
        const debit = parseValor(debitItem.text);
        if (debit && Math.abs(diff - debit) > debit * 0.1) {
          warnings.push({
            type: "balance_mismatch",
            expectedDiff: debit,
            actualDiff: diff,
            saldo,
            prevSaldo,
          });
        }
      }
    }
    prevSaldo = saldo;
  }
  return warnings;
}

async function parseDocumentoPDF(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  // ── Fase 1: Extrair todas as páginas (com fallback OCR) ──
  const pageData = [];
  const cols = { debitoX: null, creditoX: null, saldoX: null };
  let needsOCR = false;
  let ocrWorker = null;

  // Tentar extração de texto na página 1 para decidir o path
  const firstPage = await pdf.getPage(1);
  const firstTc = await firstPage.getTextContent();
  const firstItems = firstTc.items.filter(it => it.str.trim());
  if (firstItems.length < 10) {
    // PDF sem texto extraível — ativar OCR
    needsOCR = true;
    ocrWorker = await loadTesseract();
  }

  // ── Detectar banco ──
  const firstPageText = firstItems.length > 0
    ? firstItems.map(it => it.str || it.text || "").join(" ")
    : (needsOCR ? "bradesco" : "");  // OCR fallback defaults to Bradesco
  const bankProfile = detectBank(firstPageText);
  if (!bankProfile.supported) {
    return {
      clientName: "—",
      agencia: "",
      conta: "",
      banco: bankProfile.name,
      periodo: "—",
      transactions: [],
      unsupported: true,
      bankName: bankProfile.name,
    };
  }

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress && onProgress(pageNum, pdf.numPages, needsOCR);
    const page = pageNum === 1 ? firstPage : await pdf.getPage(pageNum);

    let items;
    if (needsOCR) {
      const ocrResult = await ocrPage(page, ocrWorker, OCR_SCALE);
      items = ocrResult.items;
    } else {
      const tc = pageNum === 1 ? firstTc : await page.getTextContent();
      items = tc.items.filter(it => it.str.trim())
        .map(it => ({ text: it.str.trim(), x: it.transform[4], y: it.transform[5] }));
    }

    const rows = groupByY(items, needsOCR ? 3 : 4); // OCR: tight tolerance (line-level Y já normaliza same-line words)
    const flat = items.map(i => i.text).join(" ");
    // Detectar posições X das 3 colunas de valores no cabeçalho da tabela
    if (cols.debitoX === null) {
      for (const item of items) {
        if (/^cr[eé]dito/i.test(item.text) && cols.creditoX === null) cols.creditoX = item.x;
        if (/^d[eé]bito/i.test(item.text) && cols.debitoX === null) cols.debitoX = item.x;
        if (/^saldo/i.test(item.text) && cols.saldoX === null) cols.saldoX = item.x;
      }
    }
    // Pular páginas de "Últimos Lançamentos" (resumo que repete última transação)
    if (/[uú]ltimos\s+lan[cç]amentos/i.test(flat)) continue;
    pageData.push({ rows, flat, items });
  }

  // Column clustering fallback if header detection failed
  if (cols.debitoX === null) {
    const allValues = pageData.flatMap(p => p.items.filter(i => IS_VALUE.test(i.text)));
    const clustered = clusterColumns(allValues);
    if (clustered) Object.assign(cols, clustered);
  }

  // ── Fase 2: Extrair cabeçalho (primeiras 3 páginas) ──
  let clientName = "", agencia = "", conta = "", periodo = "";
  for (let i = 0; i < Math.min(3, pageData.length); i++) {
    const { flat, rows } = pageData[i];
    if (!clientName) {
      const m = flat.match(/nome\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,60}?)(?=\s+extrato|\s+ag[eê]|\s+cpf|\s+conta|\s+cta\b|\d{3}\.)/i)
        || flat.match(/titular\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,60}?)(?=\s+extrato|\s+ag[eê]|\s+cpf|\s+conta|\d{3}\.)/i);
      if (m) clientName = m[1].replace(/\s+/g, " ").trim();
      if (!clientName) {
        const m2 = flat.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{5,60}?)\s+\d{3}\.\d{3}\.\d{3}[-.]?\d{2}/);
        if (m2) clientName = m2[1].replace(/\s+/g, " ").trim();
      }
      if (!clientName) {
        const SKIP_NAME = /extrato|conta\s*corrente|bradesco|dados|lan[cç]amento|saldo|data|hist[oó]rico|d[eé]bito|cr[eé]dito|per[ií]odo|ag[eê]ncia|cpf|documento|c[oó]digo|cliente|favorecido|banco|celular|internet|saque|recibo|transf|deposito|pagamento|pix|ted|doc\b|boleto|parcela|tarifa|cesta|opera[cç]|encargo|mora\b|seguro|capitalizacao|adiant|emissao/i;
        for (const row of rows) {
          const text = row.text.trim();
          if (text.length < 8 || text.length > 60) continue;
          if (SKIP_NAME.test(text)) continue;
          if (/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{3,}\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{2,}(\s+[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ]{2,})*$/.test(text)) {
            clientName = text;
            break;
          }
        }
      }
    }
    if (!agencia) {
      const m = flat.match(/ag[eê]ncia\s*[:\-]?\s*(\d{3,6}(?:[-]\d)?)/i)
        || flat.match(/\bag\.?\s+(\d{3,6})\b/i);
      if (m) agencia = m[1];
    }
    if (!conta) {
      const m = flat.match(/conta\s*[:\-]?\s*([\d]{4,8}[-][\d])/i)
        || flat.match(/cta\.?\s*[:\-]?\s*([\d]{4,8}[-][\d])/i)
        || flat.match(/c\/c\s*[:\-]?\s*([\d]{4,8}[-][\d])/i);
      if (m) conta = m[1];
    }
    if (!periodo) {
      const m = flat.match(/entre\s+([\d\/]+)\s+e\s+([\d\/]+)/i)
        || flat.match(/per[ií]odo\s*[:\-]?\s*([\d\/]+)\s+a\s+([\d\/]+)/i);
      if (m) periodo = `${m[1]} a ${m[2]}`;
    }
  }

  // ── Fase 3: Detectar layout ──
  const allRows = pageData.flatMap(p => p.rows);
  const layout = detectLayout(allRows);

  // ── Fase 4: Parsear transações (2-pass) ──
  const classified = classifyRows(allRows, cols, needsOCR);
  const allTransactions = assembleTransactions(classified, layout);

  return {
    clientName: clientName || "Titular não identificado",
    agencia,
    conta,
    banco: bankProfile.name,
    periodo: periodo || "—",
    transactions: allTransactions,
  };
}

export { detectBank, BANK_PROFILES, CATEGORIAS, THEME, normalizeText, matchCategoria, analyzeAll, parseDocumentoPDF, parseValor, groupByY, pickDebit, detectLayout, extractFromRow, loadPdfJs, loadTesseract, ocrCleanText, ocrPage, OCR_SCALE, IS_DATE, IS_VALUE, IS_HEADER, IS_SUMMARY, preprocessCanvas, otsuThreshold, clusterColumns, validateWithBalance };
