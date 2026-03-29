import { useState, useCallback, useEffect } from "react";

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
    label: "Tarifas Avulsas",
    sublabel: "Cobranças por serviços avulsos",
    icon: "!",
    ...THEME,
    keywords: ["tarifa bancaria", "saqueterminal", "saquecorrespondente", "saquepessoal", "saquetermi", "saquecorre", "pend.tarifas bancaria", "adiant.depositante", "tar adiant.depositante"],
    fundamento: "Art. 3º, Res. CMN 3.919/10; Súmula 297 STJ",
    acao: "Pleitear restituição em dobro das tarifas cobradas sem prévia contratação expressa (Art. 42, CDC). Verificar se houve autorização expressa em contrato.",
    descricao: "Tarifa Bancária Avulsa",
  },
  {
    id: "cesta",
    label: "Pacotes e Cestas",
    sublabel: "Mensalidades de pacotes de serviços",
    icon: "!",
    ...THEME,
    keywords: ["cesta", "vr.parcial cesta", "pacote de servicos", "pacote servico", "pacote", "padronizado prioritarios", "pserv", "binclub"],
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
    keywords: ["encargos limite de cred", "encargos limite credito", "encargos descoberto", "encargos saldo vinculado", "encargo saldo vinculado", "encargos excesso limite", "encargos", "iof s/ utilizacao limite", "iof s/utilizacao", "iof s/"],
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
    keywords: ["mora credito pessoal", "mora cred pess", "mora conta de telefone", "mora cta telef", "mora de operacao", "mora operacao de credito", "mora cartao de credito", "mora cartao", "mora encargos", "mora vida e previdencia"],
    fundamento: "Art. 52, §1º, CDC; Súmula 379 STJ",
    acao: "Verificar legalidade da cobrança. Mora decorrente de cobranças indevidas é igualmente indevida. Pleitear cancelamento da mora sobre débitos contestados.",
    descricao: "Mora de Crédito",
  },
  {
    id: "seguros",
    label: "Seguros e Previdência",
    sublabel: "Prêmios e mensalidades de seguros",
    icon: "!",
    ...THEME,
    keywords: ["bradesco vida e previdencia", "bradesco vida e prev", "bradesco vida prev", "prev-seg", "vida e previdencia", "bradesco seg-resid", "bradesco capitalizacao", "sabemi", "seguro prestamista", "seguro protecao financeira", "seguro mais protegido", "seg protecao cheque", "seguro cart deb bradesco", "servico cartao protegido", "seguradora secon", "aspecir", "odontoprev", "mbm previdencia", "previplan", "aquisicao/devolucao-seg", "liberty seguros", "titulo de capitalizacao"],
    fundamento: "Art. 39, III, CDC; Súmula 473 STJ; Art. 757, CC",
    acao: "Verificar se o seguro foi contratado voluntariamente. Seguros vinculados a financiamentos sem opção de recusa são abusivos (Súmula 473 STJ). Pleitear cancelamento e devolução.",
    descricao: "Seguro ou Previdência",
  },
  {
    id: "credito",
    label: "Crédito Pessoal",
    sublabel: "Empréstimos, financiamentos e operações vencidas",
    icon: "!",
    ...THEME,
    keywords: ["emprestimo pessoal", "parcela oper de credito", "parcela credito pessoal", "parc cred pess", "parcela oper", "bx.ant.financ/emp", "bx.ant.fin/emp", "bx ant", "operacoes vencidas", "operacoes venvidas", "div. em atraso", "jbcred", "crefisa", "sudacred", "agiplan", "easycob", "eagle", "bx"],
    fundamento: "Art. 52, CDC; Lei 10.931/04; Res. CMN 4.559/17",
    acao: "Solicitar demonstrativo completo da operação. Verificar CET e taxa de juros. Contestar cobranças acima do contratado ou sem autorização expressa.",
    descricao: "Operação de Crédito Pessoal",
  },
  {
    id: "anuidade",
    label: "Anuidade e Cartão",
    sublabel: "Anuidades e tarifas de cartão de crédito",
    icon: "!",
    ...THEME,
    keywords: ["anuidade", "cartao credito anuidade", "gasto c/cartao de credito", "gastos cartao de credito", "gasto c credito", "provisao gasto cart cred"],
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
    keywords: ["emissao extrato", "tarifa emissao extrato", "extratomes", "extratomomovimento", "2via de extrato", "extrato unificado", "tar demonst.consolidade", "tar demonstr consolidado", "2 via cartaodebito", "tar 2 via cartao", "2 via"],
    fundamento: "Art. 6º, VIII, CDC; Res. CMN 3.919/10",
    acao: "Emissão de extratos é direito do consumidor (Art. 6º, VIII, CDC). Cobrança por acesso à informação bancária é abusiva. Pleitear devolução dos valores.",
    descricao: "Emissão de Extrato/Documento",
  },
  {
    id: "outros",
    label: "Outras Cobranças",
    sublabel: "Cobranças irregulares diversas",
    icon: "!",
    ...THEME,
    keywords: ["msg", "regularizacao manual", "regularizacao lancamento", "reorganizacao financeira"],
    fundamento: "Art. 39, CDC; Res. CMN 3.919/10",
    acao: "Verificar natureza da cobrança e se houve autorização contratual expressa. Solicitar memória de cálculo e contestar cobranças sem fundamento contratual.",
    descricao: "Cobrança Diversa",
  },
];

function matchCategoria(historico) {
  const h = normalizeText(historico);
  // REM: = remetente de PIX/TED, DES: = destinatário — nunca são tarifas bancárias
  if (/\brem\s*:/.test(h) || /\bdes\s*:/.test(h)) return null;
  for (const cat of CATEGORIAS) {
    for (const kw of cat.keywords) {
      if (h.includes(normalizeText(kw))) return cat;
    }
  }
  return null;
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

const fmt = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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
  return isNaN(v) || v <= 0 ? null : v;
}

const IS_DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const IS_VALUE = /^\d{1,3}(?:\.\d{3})*,\d{2}[DC]?$/i;

function pickDebit(rowValues, debitoX) {
  // Last value is almost always saldo — exclude it when 2+ values exist
  const candidates = rowValues.length >= 2 ? rowValues.slice(0, -1) : rowValues;
  if (!candidates.length) return null;
  if (debitoX !== null) {
    const best = candidates.reduce((b, c) =>
      Math.abs(c.x - debitoX) < Math.abs(b.x - debitoX) ? c : b, candidates[0]);
    return parseValor(best.text);
  }
  // Fallback: last candidate (debit follows credit in column order)
  return parseValor(candidates[candidates.length - 1].text);
}

async function parseDocumentoPDF(file, onProgress) {
  const pdfjsLib = await loadPdfJs();
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;

  let clientName = "";
  let agencia = "";
  let conta = "";
  let periodo = "";
  const allTransactions = [];
  let debitoX = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress && onProgress(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const tc = await page.getTextContent();
    const items = tc.items
      .filter(it => it.str.trim())
      .map(it => ({
        text: it.str.trim(),
        x: it.transform[4],
        y: it.transform[5],
      }));

    const rows = groupByY(items);
    const flat = items.map(i => i.text).join(" ");

    // Extrair cabeçalho nas primeiras páginas
    if (pageNum <= 3) {
      if (!clientName) {
        // Padrão 1: "Nome:" ou "Titular:" seguido de nome e depois agência/CPF/conta
        const m = flat.match(/nome\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,60}?)(?=\s+ag[eê]|\s+cpf|\s+conta|\s+cta\b|\d{3}\.)/i)
          || flat.match(/titular\s*:?\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{3,60}?)(?=\s+ag[eê]|\s+cpf|\s+conta|\d{3}\.)/i);
        if (m) clientName = m[1].replace(/\s+/g, " ").trim();

        // Padrão 2: nome em CAPS seguido de CPF (xxx.xxx.xxx-xx)
        if (!clientName) {
          const m2 = flat.match(/([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ][A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{5,60}?)\s+\d{3}\.\d{3}\.\d{3}[-.]?\d{2}/);
          if (m2) clientName = m2[1].replace(/\s+/g, " ").trim();
        }

        // Padrão 3: scan row-by-row — linha com nome em CAPS (2+ palavras ≥3 letras)
        if (!clientName) {
          const SKIP_NAME = /extrato|conta\s*corrente|bradesco|dados|lan[cç]amento|saldo|data|hist[oó]rico|d[eé]bito|cr[eé]dito|per[ií]odo|ag[eê]ncia|cpf|documento|c[oó]digo|cliente|favorecido|banco|celular|internet/i;
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

    // Detectar posição X da coluna "Débito"
    if (debitoX === null) {
      for (const item of items) {
        if (/^d[eé]bito/i.test(item.text)) { debitoX = item.x; break; }
      }
    }

    // Extrair lançamentos linha a linha
    // Bradesco Celular usa 2 linhas por transação:
    //   Linha 1 (título): data? + descrição (sem valores)
    //   Linha 2 (detalhe): continuação da descrição + docto + crédito? + débito? + saldo
    let pending = null;
    let lastDate = null;

    for (const row of rows) {
      const first = row.items[0]?.text || "";
      const isDateRow = IS_DATE.test(first);
      const rowValues = row.items.filter(i => IS_VALUE.test(i.text));
      const hasValues = rowValues.length > 0;

      if (isDateRow) {
        // Flush pending se estava completo
        if (pending?.valor) { allTransactions.push(pending); pending = null; }
        lastDate = first;

        const afterDate = row.items.slice(1);
        const firstValIdx = afterDate.findIndex(i => IS_VALUE.test(i.text));
        const histItems = firstValIdx >= 0 ? afterDate.slice(0, firstValIdx) : afterDate;
        const historico = histItems.map(i => i.text).join(" ").trim();

        if (hasValues) {
          // Formato linha única: data + desc + valores na mesma linha
          const debitVal = pickDebit(rowValues, debitoX);
          if (debitVal) allTransactions.push({ data: first, historico, valor: debitVal });
          pending = null;
        } else {
          // Linha título: aguarda linha de detalhe com valores
          pending = { data: first, historico, valor: null };
        }

      } else if (!hasValues) {
        // Sem data, sem valores = linha de título/continuação
        const text = row.items.map(i => i.text).join(" ").trim();
        if (!text) continue;

        if (pending?.valor) { allTransactions.push(pending); pending = null; }

        if (pending) {
          // Continuação do título pendente
          pending.historico = (pending.historico + " " + text).trim();
        } else if (lastDate) {
          // Nova transação sem data própria — herda lastDate
          pending = { data: lastDate, historico: text, valor: null };
        }

      } else {
        // Tem valores = linha de detalhe
        if (pending) {
          // Texto antes do primeiro valor é parte do histórico
          const firstValIdx = row.items.findIndex(i => IS_VALUE.test(i.text));
          if (firstValIdx > 0) {
            const extra = row.items.slice(0, firstValIdx).map(i => i.text).join(" ").trim();
            if (extra) pending.historico = (pending.historico + " " + extra).trim();
          }
          const debitVal = pickDebit(rowValues, debitoX);
          if (debitVal) { pending.valor = debitVal; allTransactions.push(pending); }
          pending = null;
        }
        // Se pending é null: linha de detalhe órfã (transação de crédito) — ignorar
      }
    }

    if (pending?.valor) { allTransactions.push(pending); pending = null; }
  }

  return {
    clientName: clientName || "Titular não identificado",
    agencia,
    conta,
    banco: "Bradesco",
    periodo: periodo || "—",
    transactions: allTransactions,
  };
}

/* ─────────────────────────────────────────────
   MODAL
───────────────────────────────────────────── */
function Modal({ group, onClose, clientName, onExported }) {
  const { cat, items } = group;
  const total = items.reduce((s, i) => s + i.valor, 0);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fn = e => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const exportXLS = useCallback(async () => {
    setExporting(true);
    try {
      if (!window.XLSX) {
        await new Promise((resolve, reject) => {
          const s = document.createElement("script");
          s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      const XLSX = window.XLSX;
      const header = ["Data/Ref.", "Rubrica", "Histórico Original", "Valor (R$)", "Fundamento Jurídico", "Ação Recomendada"];
      const rows = items.map(item => [item.data, cat.descricao, item.historico, item.valor, cat.fundamento, cat.acao]);
      const wsData = [header, ...rows];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      ws["!cols"] = [{ wch:12 },{ wch:28 },{ wch:46 },{ wch:14 },{ wch:30 },{ wch:60 }];
      const range = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r:0, c:C })];
        if (cell) cell.s = { font:{ bold:true } };
      }
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, cat.label.slice(0, 31));
      const safeName = (clientName || "cliente").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
      const wbOut = XLSX.write(wb, { bookType:"xlsx", type:"array" });
      const blob = new Blob([wbOut], { type:"application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `LexFinder_${safeName}_${cat.id}.xlsx`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onExported && onExported(cat.id);
    } catch (err) { console.error("Erro ao exportar:", err); }
    finally { setExporting(false); }
  }, [items, cat, clientName]);

  return (
    <div onClick={onClose} style={{ position:"fixed",inset:0,zIndex:1000,background:"rgba(2,6,23,0.88)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1.5rem",animation:"mFadeIn 0.18s ease" }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:"100%",maxWidth:760,maxHeight:"88vh",background:"rgba(10,17,32,0.97)",border:`1px solid ${cat.border}`,borderRadius:16,overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:`0 0 80px ${cat.glow},0 40px 80px rgba(0,0,0,0.7)`,animation:"mSlideUp 0.22s cubic-bezier(0.4,0,0.2,1)" }}>
        <div style={{ padding:"1.4rem 1.8rem",borderBottom:"1px solid rgba(255,255,255,0.06)",background:cat.gradient,display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1rem",flexWrap:"wrap" }}>
          <div style={{ display:"flex",alignItems:"center",gap:"1rem" }}>
            <div style={{ width:44,height:44,borderRadius:10,background:"rgba(59,130,246,0.1)",border:`1px solid ${cat.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:900,color:cat.color,fontFamily:"Inter,sans-serif",boxShadow:`0 0 18px ${cat.glow}` }}>!</div>
            <div>
              <div style={{ fontWeight:700,fontSize:"1.05rem",color:"#f1f5f9",fontFamily:"Inter,sans-serif" }}>{cat.label}</div>
              <div style={{ fontSize:"0.75rem",color:"#64748b",marginTop:2,fontFamily:"Inter,sans-serif" }}>{items.length} lançamento{items.length!==1?"s":""} · {cat.fundamento}</div>
            </div>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:"0.8rem" }}>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.6rem",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:"#475569",marginBottom:3,fontFamily:"Inter,sans-serif" }}>Total Identificado</div>
              <div style={{ fontWeight:800,fontSize:"1.35rem",color:cat.color,letterSpacing:"-0.5px",fontFamily:"Inter,sans-serif" }}>{fmt(total)}</div>
            </div>
            <button onClick={exportXLS} disabled={exporting} style={{ display:"flex",alignItems:"center",gap:7,background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"#94a3b8",fontFamily:"Inter,sans-serif",fontSize:"0.7rem",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",padding:"8px 14px",cursor:exporting?"wait":"pointer",transition:"all 0.18s",whiteSpace:"nowrap",flexShrink:0 }}
              onMouseEnter={e=>{ if(!exporting){ e.currentTarget.style.background="rgba(34,197,94,0.1)"; e.currentTarget.style.borderColor="rgba(34,197,94,0.35)"; e.currentTarget.style.color="#4ade80"; }}}
              onMouseLeave={e=>{ e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.12)"; e.currentTarget.style.color="#94a3b8"; }}>
              {exporting ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation:"spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
              {exporting ? "Gerando…" : "Extrair Relatório"}
            </button>
            <button onClick={onClose} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#64748b",width:34,height:34,cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif",transition:"all 0.15s",flexShrink:0 }} onMouseEnter={e=>{e.currentTarget.style.color="#e2e8f0";e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";}} onMouseLeave={e=>{e.currentTarget.style.color="#64748b";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}>✕</button>
          </div>
        </div>
        <div style={{ margin:"1.2rem 1.8rem 0",padding:"0.85rem 1.1rem",background:"rgba(255,255,255,0.02)",borderRadius:8,border:"1px solid rgba(255,255,255,0.05)",borderLeft:`3px solid ${cat.color}` }}>
          <div style={{ fontSize:"0.6rem",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:cat.color,marginBottom:5,fontFamily:"Inter,sans-serif" }}>Fundamento Jurídico</div>
          <div style={{ fontSize:"0.82rem",color:"#64748b",lineHeight:1.65,fontFamily:"Inter,sans-serif",fontWeight:400 }}>{cat.acao}</div>
        </div>
        <div style={{ overflow:"auto",flex:1,padding:"1rem 1.8rem 1.8rem" }}>
          <table style={{ width:"100%",borderCollapse:"collapse",fontFamily:"Inter,sans-serif" }}>
            <thead>
              <tr style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {["Data/Ref.","Rubrica Detectada","Valor"].map(h=>(
                  <th key={h} style={{ padding:"10px 12px 12px",textAlign:"left",fontSize:"0.6rem",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:cat.color,whiteSpace:"nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item,idx)=>(
                <tr key={idx} style={{ borderBottom:"1px solid rgba(255,255,255,0.04)",transition:"background 0.12s" }} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{ padding:"11px 12px",color:"#475569",fontSize:"0.8rem",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums" }}>{item.data}</td>
                  <td style={{ padding:"11px 12px" }}>
                    <div style={{ fontWeight:600,fontSize:"0.85rem",color:"#e2e8f0" }}>{cat.descricao}</div>
                    <div style={{ fontSize:"0.72rem",color:"#334155",marginTop:2 }}>{item.historico}</div>
                  </td>
                  <td style={{ padding:"11px 12px",fontWeight:700,fontSize:"0.9rem",color:"#f87171",whiteSpace:"nowrap",fontVariantNumeric:"tabular-nums" }}>{fmt(item.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   CATEGORY CARD
───────────────────────────────────────────── */
function CategoryCard({ cat, items, onClick, delay, downloaded }) {
  const [hov, setHov] = useState(false);
  const total = items.reduce((s,i)=>s+i.valor,0);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{ background:"rgba(12,19,35,0.7)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",border:`1px solid ${hov?cat.color:cat.border}`,borderRadius:12,padding:"1.1rem 1.6rem",cursor:"pointer",transition:"all 0.22s cubic-bezier(0.4,0,0.2,1)",boxShadow:hov?`0 0 36px ${cat.glow},0 8px 28px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.05)`:"0 2px 12px rgba(0,0,0,0.25),inset 0 1px 0 rgba(255,255,255,0.03)",transform:hov?"translateY(-2px)":"translateY(0)",position:"relative",overflow:"hidden",animation:`cIn 0.38s ease ${delay}s both`,fontFamily:"Inter,sans-serif",display:"flex",alignItems:"center",gap:"1.4rem" }}>
      <div style={{ position:"absolute",inset:0,background:cat.gradient,opacity:hov?1:0.5,transition:"opacity 0.22s",borderRadius:12,pointerEvents:"none" }}/>
      <div style={{ position:"absolute",right:-24,top:"50%",transform:"translateY(-50%)",width:70,height:70,borderRadius:"50%",background:cat.color,opacity:hov?0.14:0.05,filter:"blur(24px)",transition:"opacity 0.3s",pointerEvents:"none" }}/>
      <div style={{ position:"relative",zIndex:1,flexShrink:0,width:40,height:40,borderRadius:9,background:"rgba(59,130,246,0.08)",border:`1px solid ${hov?cat.color:"rgba(59,130,246,0.2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:cat.color,fontFamily:"Inter,sans-serif",boxShadow:hov?`0 0 12px ${cat.glow}`:"none",transition:"all 0.22s" }}>!</div>
      <div style={{ position:"relative",zIndex:1,flex:1,minWidth:0 }}>
        <div style={{ fontWeight:700,fontSize:"0.92rem",color:"#e2e8f0",letterSpacing:"-0.2px",marginBottom:2 }}>{cat.label}</div>
        <div style={{ fontSize:"0.72rem",color:"#475569",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{cat.sublabel}</div>
      </div>
      <div style={{ position:"relative",zIndex:1,flexShrink:0,background:"rgba(255,255,255,0.05)",border:`1px solid ${cat.border}`,borderRadius:20,padding:"4px 12px",fontSize:"0.68rem",fontWeight:700,color:cat.color,whiteSpace:"nowrap" }}>{items.length} ocorr.</div>
      {downloaded && (
        <div style={{ position:"relative",zIndex:1,flexShrink:0,display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.1)",border:"1px solid rgba(34,197,94,0.3)",borderRadius:20,padding:"4px 11px",fontSize:"0.65rem",fontWeight:700,color:"#4ade80",whiteSpace:"nowrap" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>Baixado
        </div>
      )}
      <div style={{ position:"relative",zIndex:1,flexShrink:0,width:1,height:32,background:"rgba(255,255,255,0.06)" }}/>
      <div style={{ position:"relative",zIndex:1,flexShrink:0,textAlign:"right" }}>
        <div style={{ fontSize:"0.55rem",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:"#334155",marginBottom:3 }}>Valor</div>
        <div style={{ fontWeight:800,fontSize:"1.25rem",color:cat.color,letterSpacing:"-0.8px" }}>{fmt(total)}</div>
      </div>
      <div style={{ position:"relative",zIndex:1,flexShrink:0,width:30,height:30,borderRadius:"50%",background:hov?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.03)",border:`1px solid ${hov?cat.color:"rgba(255,255,255,0.07)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:hov?cat.color:"#334155",transition:"all 0.22s",transform:hov?"rotate(-45deg)":"rotate(0)" }}>→</div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ANALYTICS DASHBOARD
───────────────────────────────────────────── */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Cell, PieChart, Pie } from "recharts";

const CHART_COLORS = ["#3b82f6","#60a5fa","#93c5fd","#bfdbfe","#dbeafe"];

function SectionLabel({ children }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:8,margin:"2.2rem 0 1.1rem" }}>
      <span style={{ fontSize:"0.62rem",fontWeight:700,letterSpacing:"2.5px",textTransform:"uppercase",color:"#334155",fontFamily:"Inter,sans-serif" }}>{children}</span>
      <div style={{ flex:1,height:1,background:"rgba(255,255,255,0.05)" }}/>
    </div>
  );
}

function InsightCard({ label, value, sub, icon, accent="#60a5fa", delay=0 }) {
  return (
    <div style={{ background:"rgba(12,19,35,0.65)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"1.1rem 1.3rem",position:"relative",overflow:"hidden",animation:`cIn 0.4s ease ${delay}s both`,flex:1,minWidth:160 }}>
      <div style={{ position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg, ${accent}, transparent)`,borderRadius:"12px 12px 0 0" }}/>
      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10 }}>
        <div style={{ fontSize:"0.6rem",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:"#334155",fontFamily:"Inter,sans-serif" }}>{label}</div>
        <div style={{ width:28,height:28,borderRadius:7,background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.15)",display:"flex",alignItems:"center",justifyContent:"center" }}>{icon}</div>
      </div>
      <div style={{ fontSize:"1.5rem",fontWeight:800,color:accent,letterSpacing:"-0.8px",lineHeight:1,marginBottom:5,fontFamily:"Inter,sans-serif" }}>{value}</div>
      <div style={{ fontSize:"0.7rem",color:"#334155",fontFamily:"Inter,sans-serif",lineHeight:1.5 }}>{sub}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(10,17,35,0.97)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"0.7rem 1rem",fontFamily:"Inter,sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#94a3b8",marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{ fontSize:"0.85rem",fontWeight:700,color:"#60a5fa" }}>{typeof p.value==="number"?p.value.toLocaleString("pt-BR",{style:"currency",currency:"BRL"}):p.value}</div>)}
    </div>
  );
};

const CustomCountTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"rgba(10,17,35,0.97)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,padding:"0.7rem 1rem",fontFamily:"Inter,sans-serif",boxShadow:"0 8px 32px rgba(0,0,0,0.5)" }}>
      <div style={{ fontSize:"0.72rem",fontWeight:700,color:"#94a3b8",marginBottom:6 }}>{label}</div>
      {payload.map((p,i)=><div key={i} style={{ fontSize:"0.85rem",fontWeight:700,color:"#60a5fa" }}>{p.value} lançamento{p.value!==1?"s":""}</div>)}
    </div>
  );
};

function AnalyticsDashboard({ groups }) {
  const allItems = groups.flatMap(g => g.items.map(it => ({ ...it, cat: g.cat })));
  const byCategory = groups.map(g => ({ name:g.cat.label.replace(" de ","\nde "), shortName:g.cat.label.split(" ")[0], valor:parseFloat(g.items.reduce((s,i)=>s+i.valor,0).toFixed(2)), ocorrencias:g.items.length }));
  const monthly = {};
  for (const item of allItems) {
    const parts = item.data.split("/");
    if (parts.length===3) {
      const key=`${parts[2]}-${parts[1]}`, label=`${parts[1]}/${parts[2]}`;
      if (!monthly[key]) monthly[key]={ key, label, valor:0, ocorrencias:0 };
      monthly[key].valor = parseFloat((monthly[key].valor+item.valor).toFixed(2));
      monthly[key].ocorrencias += 1;
    }
  }
  const timeline = Object.values(monthly).sort((a,b)=>a.key.localeCompare(b.key));
  const totalValor = allItems.reduce((s,i)=>s+i.valor,0);
  const mostValuableCat = [...groups].sort((a,b)=>b.items.reduce((s,i)=>s+i.valor,0)-a.items.reduce((s,i)=>s+i.valor,0))[0];
  const mostFreqCat = [...groups].sort((a,b)=>b.items.length-a.items.length)[0];
  const worstMonth = [...timeline].sort((a,b)=>b.valor-a.valor)[0];
  const avgPerOccurrence = totalValor/allItems.length;
  const donutData = groups.map(g=>({ name:g.cat.label, value:parseFloat(g.items.reduce((s,i)=>s+i.valor,0).toFixed(2)) }));
  const glassCard = { background:"rgba(12,19,35,0.65)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"1.4rem 1.6rem",backdropFilter:"blur(12px)" };

  return (
    <div style={{ marginTop:"2.5rem" }}>
      <SectionLabel>Análise Gráfica do Relatório</SectionLabel>
      <div style={{ display:"flex",gap:"0.85rem",flexWrap:"wrap",marginBottom:"1.4rem" }}>
        <InsightCard delay={0} label="Categoria Mais Onerosa" value={mostValuableCat?.cat.label.split(" ")[0]||"—"} sub={`${fmt(mostValuableCat?.items.reduce((s,i)=>s+i.valor,0)||0)} em descontos`} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>} />
        <InsightCard delay={0.05} label="Mais Frequente" value={mostFreqCat?.cat.label.split(" ")[0]||"—"} sub={`${mostFreqCat?.items.length||0} ocorrências registradas`} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>} />
        <InsightCard delay={0.1} label="Mês Mais Crítico" value={worstMonth?.label||"—"} sub={`${fmt(worstMonth?.valor||0)} em irregularidades`} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>} />
        <InsightCard delay={0.15} label="Média por Lançamento" value={fmt(avgPerOccurrence)} sub={`sobre ${allItems.length} descontos identificados`} icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
      </div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 340px",gap:"1rem",marginBottom:"1rem" }}>
        <div style={{ ...glassCard }}>
          <div style={{ fontSize:"0.7rem",fontWeight:700,color:"#475569",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"1.2rem",fontFamily:"Inter,sans-serif" }}>Valor por Categoria (R$)</div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byCategory} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="shortName" tick={{ fill:"#475569",fontSize:11,fontFamily:"Inter,sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#334155",fontSize:10,fontFamily:"Inter,sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v>=1000?(v/1000).toFixed(1)+"k":v}`} width={52} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill:"rgba(59,130,246,0.06)" }} />
              <Bar dataKey="valor" radius={[5,5,0,0]}>{byCategory.map((_,i)=><Cell key={i} fill={`rgba(59,130,246,${0.85-i*0.12})`} />)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ ...glassCard,display:"flex",flexDirection:"column" }}>
          <div style={{ fontSize:"0.7rem",fontWeight:700,color:"#475569",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"1rem",fontFamily:"Inter,sans-serif" }}>Proporção por Categoria</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={46} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>{donutData.map((_,i)=><Cell key={i} fill={CHART_COLORS[i%CHART_COLORS.length]} />)}</Pie>
              <Tooltip formatter={(v)=>fmt(v)} contentStyle={{ background:"rgba(10,17,35,0.97)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:8,fontFamily:"Inter,sans-serif",fontSize:12 }} itemStyle={{ color:"#60a5fa" }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"flex",flexDirection:"column",gap:5,marginTop:"auto" }}>
            {donutData.map((d,i)=>(
              <div key={i} style={{ display:"flex",alignItems:"center",gap:7,fontSize:"0.72rem",color:"#475569",fontFamily:"Inter,sans-serif" }}>
                <div style={{ width:8,height:8,borderRadius:2,background:CHART_COLORS[i%CHART_COLORS.length],flexShrink:0 }}/>
                <span style={{ flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{d.name}</span>
                <span style={{ color:"#60a5fa",fontWeight:700 }}>{fmt(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {timeline.length>1 && (
        <div style={{ ...glassCard,marginBottom:"1rem" }}>
          <div style={{ fontSize:"0.7rem",fontWeight:700,color:"#475569",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"1.2rem",fontFamily:"Inter,sans-serif" }}>Evolução Temporal dos Descontos</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={timeline}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="4 4" />
              <XAxis dataKey="label" tick={{ fill:"#475569",fontSize:10,fontFamily:"Inter,sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#334155",fontSize:10,fontFamily:"Inter,sans-serif" }} axisLine={false} tickLine={false} tickFormatter={v=>`R$${v>=1000?(v/1000).toFixed(1)+"k":v}`} width={52} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke:"rgba(59,130,246,0.2)",strokeWidth:1 }} />
              <Line type="monotone" dataKey="valor" stroke="#3b82f6" strokeWidth={2.5} dot={{ fill:"#3b82f6",strokeWidth:0,r:4 }} activeDot={{ r:6,fill:"#60a5fa" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div style={{ ...glassCard }}>
        <div style={{ fontSize:"0.7rem",fontWeight:700,color:"#475569",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"1.2rem",fontFamily:"Inter,sans-serif" }}>Frequência de Ocorrências por Categoria</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={byCategory} layout="vertical" barCategoryGap="25%">
            <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis type="number" tick={{ fill:"#334155",fontSize:10,fontFamily:"Inter,sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="shortName" tick={{ fill:"#475569",fontSize:11,fontFamily:"Inter,sans-serif" }} axisLine={false} tickLine={false} width={72} />
            <Tooltip content={<CustomCountTooltip />} cursor={{ fill:"rgba(59,130,246,0.05)" }} />
            <Bar dataKey="ocorrencias" radius={[0,5,5,0]}>{byCategory.map((_,i)=><Cell key={i} fill={`rgba(96,165,250,${0.85-i*0.12})`} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [phase, setPhase] = useState("upload");
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [fileName, setFileName] = useState("");
  const [parseProgress, setParseProgress] = useState({ page:0, total:0 });
  const [grouped, setGrouped] = useState({});
  const [meta, setMeta] = useState({});
  const [activeModal, setActiveModal] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [downloadedCats, setDownloadedCats] = useState(new Set());
  const [showDashboard, setShowDashboard] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [multipleClientsWarning, setMultipleClientsWarning] = useState(null);

  const addFiles = useCallback((fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.type==="application/pdf" || f.name.endsWith(".pdf"));
    if (!pdfs.length) return;
    setUploadedFiles(prev => { const existing=prev.map(f=>f.name); return [...prev,...pdfs.filter(f=>!existing.includes(f.name))]; });
  }, []);

  const removeFile = useCallback((idx) => { setUploadedFiles(prev=>prev.filter((_,i)=>i!==idx)); }, []);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const files = e.dataTransfer?.files || e.target?.files;
    if (files) addFiles(files);
  }, [addFiles]);

  const processFiles = useCallback(async (files) => {
    if (!files.length) return;
    setMultipleClientsWarning(null); setPhase("parsing"); setErrorMsg("");
    const results = [];
    for (let i=0; i<files.length; i++) {
      const file = files[i]; setFileName(file.name);
      try { const result = await parseDocumentoPDF(file,(page,total)=>setParseProgress({page,total})); results.push({result,file}); }
      catch(err) { console.error(err); }
    }
    if (!results.length) { setErrorMsg("Não foi possível processar nenhum PDF. Verifique se os arquivos são documentos válidos."); setPhase("error"); return; }
    const uniqueNames = [...new Set(results.map(r=>r.result.clientName).filter(n=>n&&n!=="Titular não identificado"))];
    if (uniqueNames.length>1) { setPhase("upload"); setMultipleClientsWarning({names:uniqueNames}); return; }
    setPhase("analyzing");
    await new Promise(r=>setTimeout(r,600));
    const allTransactions = results.flatMap(r=>r.result.transactions);
    const primary = results[0].result;
    const g = analyzeAll(allTransactions);
    setMeta(primary); setGrouped(g);
    setFileName(files.length===1?files[0].name:`${files.length} documentos analisados`);
    if (Object.keys(g).length>0) { setPhase("success"); setTimeout(()=>setPhase("results"),2200); }
    else { setPhase("noDiscount"); setTimeout(()=>setPhase("results"),3000); }
  }, []);

  const reset = useCallback(() => {
    setGrouped({}); setMeta({}); setFileName(""); setUploadedFiles([]);
    setDownloadedCats(new Set()); setShowDashboard(false); setConfirmReset(false);
    setMultipleClientsWarning(null); setPhase("upload"); setErrorMsg("");
  }, []);

  const groups = Object.values(grouped);
  const totalOcorrencias = groups.reduce((s,g)=>s+g.items.length,0);
  const totalValor = groups.reduce((s,g)=>s+g.items.reduce((ss,i)=>ss+i.valor,0),0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{background:#020617}
        @keyframes mFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes mSlideUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.35}}
        @keyframes fadeSlide{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes checkPop{0%{transform:scale(0) rotate(-20deg);opacity:0}60%{transform:scale(1.18) rotate(4deg);opacity:1}80%{transform:scale(0.94) rotate(-2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes checkRing{0%{transform:scale(0.6);opacity:0}50%{opacity:1}100%{transform:scale(1.7);opacity:0}}
        @keyframes checkFadeIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes xPop{0%{transform:scale(0) rotate(20deg);opacity:0}60%{transform:scale(1.15) rotate(-4deg);opacity:1}80%{transform:scale(0.96) rotate(2deg)}100%{transform:scale(1) rotate(0deg);opacity:1}}
        @keyframes xRing{0%{transform:scale(0.6);opacity:0}50%{opacity:1}100%{transform:scale(1.7);opacity:0}}
        @keyframes warnPop{0%{transform:scale(0);opacity:0}65%{transform:scale(1.12);opacity:1}100%{transform:scale(1);opacity:1}}
        .kpi-featured{transition:box-shadow 0.3s ease,border-color 0.3s ease;}
        .kpi-featured:hover{box-shadow:0 0 48px rgba(59,130,246,0.55),inset 0 1px 0 rgba(255,255,255,0.06) !important;border-color:rgba(59,130,246,0.75) !important;}
      `}</style>

      <div style={{ minHeight:"100vh",background:"radial-gradient(ellipse 90% 50% at 50% -5%,rgba(59,130,246,0.13) 0%,transparent 65%),radial-gradient(ellipse 50% 50% at 85% 90%,rgba(139,92,246,0.07) 0%,transparent 60%),#020617",color:"#e2e8f0",fontFamily:"Inter,sans-serif" }}>

        {/* HEADER */}
        <header style={{ position:"sticky",top:0,zIndex:50,height:60,borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(2,6,23,0.88)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 2rem" }}>
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <div style={{ width:30,height:30,borderRadius:7,background:"linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff",boxShadow:"0 0 18px rgba(59,130,246,0.5)" }}>§</div>
            <span style={{ fontSize:14,fontWeight:700,color:"#f1f5f9",letterSpacing:"-0.3px" }}>LEX FINDER</span>
            <span style={{ color:"rgba(255,255,255,0.12)",margin:"0 6px" }}>|</span>
            <span style={{ fontSize:12,color:"#475569",fontWeight:400 }}>Análise de Descontos Indevidos</span>
          </div>
          <div style={{ display:"flex",alignItems:"center",gap:6,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.22)",borderRadius:20,padding:"5px 12px",fontSize:11,fontWeight:600,color:"#60a5fa" }}>
            <div style={{ width:6,height:6,borderRadius:"50%",background:"#3b82f6",animation:"pulse 2s infinite",boxShadow:"0 0 6px #3b82f6" }}/>
            Motor Ativo · RA TECNOLOGIA
          </div>
        </header>

        {/* ── UPLOAD ── */}
        {phase==="upload" && (
          <div style={{ minHeight:"calc(100vh - 60px)",display:"flex",alignItems:"stretch",animation:"fadeSlide 0.35s ease" }}>
            <div style={{ flex:"0 0 420px",borderRight:"1px solid rgba(255,255,255,0.05)",display:"flex",flexDirection:"column",justifyContent:"center",padding:"3rem 2.5rem",background:"rgba(5,10,24,0.5)" }}>
              <div style={{ display:"inline-flex",alignItems:"center",gap:7,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.22)",borderRadius:20,padding:"5px 14px",fontSize:10,fontWeight:700,color:"#60a5fa",letterSpacing:"1.5px",textTransform:"uppercase",marginBottom:"1.8rem",width:"fit-content",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>⚖ &nbsp;Ferramenta Jurídica</div>
              <h1 style={{ fontSize:"1.9rem",fontWeight:800,lineHeight:1.18,color:"#f1f5f9",letterSpacing:"-0.8px",marginBottom:"0.9rem",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Detecção de<br/><span style={{ color:"#3b82f6" }}>Descontos Indevidos</span></h1>
              <p style={{ fontSize:"0.83rem",color:"#475569",lineHeight:1.8,fontWeight:400,marginBottom:"2rem",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Carregue os documentos em PDF. O motor extrai automaticamente os dados do titular, identifica descontos irregulares e cruza com os fundamentos jurídicos aplicáveis.</p>
              <label onDragOver={e=>{e.preventDefault();setDragOver(true);}} onDragLeave={()=>setDragOver(false)} onDrop={handleDrop} style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.7rem",border:`1.5px dashed ${dragOver?"#3b82f6":"rgba(59,130,246,0.22)"}`,borderRadius:14,padding:"2rem 1.5rem",cursor:"pointer",background:dragOver?"rgba(59,130,246,0.06)":"rgba(15,23,42,0.4)",backdropFilter:"blur(12px)",boxShadow:dragOver?"0 0 30px rgba(59,130,246,0.15)":"none",transition:"all 0.2s ease",textAlign:"center" }}>
                <input type="file" accept=".pdf" multiple style={{ display:"none" }} onChange={handleDrop}/>
                <div style={{ width:46,height:46,borderRadius:12,background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.2)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 18px rgba(59,130,246,0.15)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                </div>
                <div>
                  <p style={{ color:"#cbd5e1",fontSize:"0.88rem",fontWeight:600,marginBottom:3,fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Arraste os documentos aqui</p>
                  <p style={{ color:"#334155",fontSize:"0.75rem",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>ou clique para selecionar · PDF · múltiplos arquivos</p>
                </div>
              </label>
            </div>
            <div style={{ flex:1,display:"flex",flexDirection:"column",padding:"3rem 2.5rem",overflowY:"auto" }}>
              <div style={{ marginBottom:"1.8rem" }}>
                <div style={{ fontSize:"0.62rem",fontWeight:700,letterSpacing:"2.5px",textTransform:"uppercase",color:"#334155",marginBottom:6,fontFamily:"'Plus Jakarta Sans', sans-serif" }}>Fila de Análise</div>
                <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:"0.8rem" }}>
                  <p style={{ fontSize:"1.1rem",fontWeight:700,color:uploadedFiles.length?"#f1f5f9":"#1e293b",letterSpacing:"-0.3px",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
                    {uploadedFiles.length===0?"Nenhum documento adicionado":`${uploadedFiles.length} documento${uploadedFiles.length>1?"s":""} na fila`}
                  </p>
                  {uploadedFiles.length>0 && (
                    <button onClick={()=>processFiles(uploadedFiles)} style={{ display:"flex",alignItems:"center",gap:8,background:"linear-gradient(135deg,#3b82f6 0%,#1d4ed8 100%)",border:"none",borderRadius:9,color:"#fff",fontFamily:"'Plus Jakarta Sans', sans-serif",fontSize:"0.75rem",fontWeight:700,letterSpacing:"0.5px",textTransform:"uppercase",padding:"10px 22px",cursor:"pointer",boxShadow:"0 0 24px rgba(59,130,246,0.4)",transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 0 36px rgba(59,130,246,0.6)";e.currentTarget.style.transform="translateY(-1px)";}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 0 24px rgba(59,130,246,0.4)";e.currentTarget.style.transform="translateY(0)";}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                      Analisar {uploadedFiles.length>1?`(${uploadedFiles.length})`:""}
                    </button>
                  )}
                </div>
              </div>
              {uploadedFiles.length===0 && (
                <div style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1rem",opacity:0.4 }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <p style={{ fontSize:"0.82rem",color:"#475569",textAlign:"center",lineHeight:1.6,maxWidth:260 }}>Arraste os PDFs para a área à esquerda ou clique para selecionar os documentos</p>
                </div>
              )}
              {uploadedFiles.length>0 && (
                <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
                  {uploadedFiles.map((file,idx)=>(
                    <div key={`${file.name}-${idx}`} style={{ display:"flex",alignItems:"center",gap:"1rem",background:"rgba(12,19,35,0.65)",border:"1px solid rgba(59,130,246,0.18)",borderRadius:12,padding:"1rem 1.2rem",animation:`cIn 0.3s ease ${idx*0.06}s both`,backdropFilter:"blur(12px)" }}>
                      <div style={{ flexShrink:0,width:44,height:52,position:"relative",display:"flex",alignItems:"center",justifyContent:"center" }}>
                        <svg width="38" height="46" viewBox="0 0 24 28" fill="none"><rect x="1" y="1" width="18" height="26" rx="2" fill="rgba(59,130,246,0.08)" stroke="rgba(59,130,246,0.35)" strokeWidth="1.2"/><path d="M14 1v6h6" stroke="rgba(59,130,246,0.4)" strokeWidth="1.2" fill="none"/><line x1="5" y1="11" x2="15" y2="11" stroke="rgba(59,130,246,0.25)" strokeWidth="1"/><line x1="5" y1="14" x2="15" y2="14" stroke="rgba(59,130,246,0.25)" strokeWidth="1"/><line x1="5" y1="17" x2="11" y2="17" stroke="rgba(59,130,246,0.25)" strokeWidth="1"/></svg>
                        <div style={{ position:"absolute",bottom:-2,right:-4,background:"#1d4ed8",borderRadius:4,padding:"1px 5px",fontSize:"0.52rem",fontWeight:800,color:"#fff",letterSpacing:"0.5px" }}>PDF</div>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:600,fontSize:"0.88rem",color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",marginBottom:3,fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{file.name}</div>
                        <div style={{ fontSize:"0.72rem",color:"#334155",fontFamily:"'Plus Jakarta Sans', sans-serif" }}>{(file.size/1024).toFixed(0)} KB · PDF</div>
                      </div>
                      <div style={{ flexShrink:0,display:"flex",alignItems:"center",gap:5,background:"rgba(34,197,94,0.08)",border:"1px solid rgba(34,197,94,0.2)",borderRadius:20,padding:"3px 10px",fontSize:"0.65rem",fontWeight:700,color:"#4ade80",letterSpacing:"0.5px" }}>
                        <div style={{ width:5,height:5,borderRadius:"50%",background:"#22c55e" }}/>Pronto
                      </div>
                      <button onClick={()=>removeFile(idx)} style={{ flexShrink:0,background:"none",border:"none",cursor:"pointer",color:"#334155",display:"flex",alignItems:"center",justifyContent:"center",padding:4,borderRadius:6,transition:"all 0.15s" }} onMouseEnter={e=>{e.currentTarget.style.color="#f87171";e.currentTarget.style.background="rgba(239,68,68,0.08)";}} onMouseLeave={e=>{e.currentTarget.style.color="#334155";e.currentTarget.style.background="none";}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PARSING ── */}
        {phase==="parsing" && (
          <div style={{ minHeight:"calc(100vh - 60px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.8rem" }}>
            <div style={{ width:54,height:54,borderRadius:"50%",border:"2px solid rgba(59,130,246,0.12)",borderTop:"2px solid #3b82f6",animation:"spin 0.85s linear infinite",boxShadow:"0 0 24px rgba(59,130,246,0.3)" }}/>
            <div style={{ textAlign:"center" }}>
              <p style={{ fontSize:"1.05rem",fontWeight:700,color:"#e2e8f0",marginBottom:6 }}>Lendo Documento</p>
              <p style={{ fontSize:"0.72rem",color:"#475569",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"1.5rem" }}>{parseProgress.total>0?`Página ${parseProgress.page} de ${parseProgress.total}`:"Carregando motor de leitura…"}</p>
              {parseProgress.total>0 && <div style={{ width:280,height:4,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden" }}><div style={{ height:"100%",background:"#3b82f6",borderRadius:4,width:`${(parseProgress.page/parseProgress.total)*100}%`,transition:"width 0.3s ease",boxShadow:"0 0 8px rgba(59,130,246,0.6)" }}/></div>}
            </div>
            <p style={{ fontSize:"0.72rem",color:"#334155" }}>{fileName}</p>
          </div>
        )}

        {/* ── ANALYZING ── */}
        {phase==="analyzing" && (
          <div style={{ minHeight:"calc(100vh - 60px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.4rem" }}>
            <div style={{ width:54,height:54,borderRadius:"50%",border:"2px solid rgba(59,130,246,0.12)",borderTop:"2px solid #3b82f6",animation:"spin 0.85s linear infinite",boxShadow:"0 0 24px rgba(59,130,246,0.3)" }}/>
            <p style={{ fontSize:"1.05rem",fontWeight:700,color:"#e2e8f0" }}>Cruzando Dados</p>
            <p style={{ fontSize:"0.72rem",color:"#475569",letterSpacing:"2px",textTransform:"uppercase" }}>Identificando descontos irregulares…</p>
          </div>
        )}

        {/* ── NO DISCOUNT ── */}
        {phase==="noDiscount" && (
          <div style={{ minHeight:"calc(100vh - 60px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.6rem",animation:"mFadeIn 0.2s ease" }}>
            <div style={{ position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div style={{ position:"absolute",inset:0,borderRadius:"50%",border:"2px solid rgba(239,68,68,0.6)",animation:"xRing 1.4s ease-out 0.1s both" }}/>
              <div style={{ position:"absolute",inset:0,borderRadius:"50%",border:"2px solid rgba(239,68,68,0.3)",animation:"xRing 1.4s ease-out 0.35s both" }}/>
              <div style={{ width:88,height:88,borderRadius:"50%",background:"linear-gradient(135deg,rgba(239,68,68,0.18) 0%,rgba(185,28,28,0.1) 100%)",border:"2px solid rgba(239,68,68,0.5)",display:"flex",alignItems:"center",justifyContent:"center",animation:"xPop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",boxShadow:"0 0 48px rgba(239,68,68,0.35)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </div>
            </div>
            <div style={{ textAlign:"center",animation:"checkFadeIn 0.4s ease 0.5s both" }}>
              <p style={{ fontSize:"1.35rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.5px",marginBottom:8 }}>Nenhum Desconto Indevido Encontrado</p>
              <p style={{ fontSize:"0.82rem",color:"#475569" }}>Abrindo relatório…</p>
            </div>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {phase==="success" && (
          <div style={{ minHeight:"calc(100vh - 60px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.6rem",animation:"mFadeIn 0.2s ease" }}>
            <div style={{ position:"relative",width:120,height:120,display:"flex",alignItems:"center",justifyContent:"center" }}>
              <div style={{ position:"absolute",inset:0,borderRadius:"50%",border:"2px solid rgba(34,197,94,0.6)",animation:"checkRing 1.4s ease-out 0.1s both" }}/>
              <div style={{ position:"absolute",inset:0,borderRadius:"50%",border:"2px solid rgba(34,197,94,0.35)",animation:"checkRing 1.4s ease-out 0.35s both" }}/>
              <div style={{ width:88,height:88,borderRadius:"50%",background:"linear-gradient(135deg,rgba(34,197,94,0.18) 0%,rgba(16,185,129,0.1) 100%)",border:"2px solid rgba(34,197,94,0.5)",display:"flex",alignItems:"center",justifyContent:"center",animation:"checkPop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",boxShadow:"0 0 48px rgba(34,197,94,0.35)" }}>
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <div style={{ textAlign:"center",animation:"checkFadeIn 0.4s ease 0.5s both" }}>
              <p style={{ fontSize:"1.35rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.5px",marginBottom:8 }}>Descontos Irregulares Encontrados!</p>
              <p style={{ fontSize:"0.82rem",color:"#475569",letterSpacing:"0.5px" }}>Abrindo relatório detalhado…</p>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase==="error" && (
          <div style={{ minHeight:"calc(100vh - 60px)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"1.5rem",padding:"2rem",textAlign:"center" }}>
            <div style={{ width:56,height:56,borderRadius:14,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>⚠</div>
            <div><p style={{ fontSize:"1.1rem",fontWeight:700,color:"#f1f5f9",marginBottom:8 }}>Erro ao processar PDF</p><p style={{ fontSize:"0.85rem",color:"#64748b",maxWidth:420,lineHeight:1.6 }}>{errorMsg}</p></div>
            <button onClick={reset} style={{ background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.28)",borderRadius:8,color:"#60a5fa",fontFamily:"Inter,sans-serif",fontSize:"0.8rem",fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",padding:"11px 24px",cursor:"pointer" }}>← Tentar Novamente</button>
          </div>
        )}

        {/* ── MULTIPLE CLIENTS ── */}
        {multipleClientsWarning && phase==="upload" && (
          <div style={{ position:"fixed",inset:0,zIndex:200,background:"rgba(2,6,23,0.85)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",animation:"mFadeIn 0.2s ease" }}>
            <div style={{ width:"100%",maxWidth:480,background:"rgba(10,17,32,0.97)",border:"1px solid rgba(234,179,8,0.35)",borderRadius:16,padding:"2.2rem",boxShadow:"0 0 60px rgba(234,179,8,0.2),0 32px 64px rgba(0,0,0,0.6)",animation:"mSlideUp 0.25s ease",textAlign:"center" }}>
              <div style={{ width:72,height:72,borderRadius:"50%",background:"rgba(234,179,8,0.1)",border:"2px solid rgba(234,179,8,0.4)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.4rem",animation:"warnPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",boxShadow:"0 0 32px rgba(234,179,8,0.25)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="2" x2="22" y2="6"/><line x1="22" y1="2" x2="18" y2="6"/></svg>
              </div>
              <p style={{ fontSize:"1.15rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.4px",marginBottom:10,fontFamily:"Inter,sans-serif" }}>Documentos de Titulares Diferentes</p>
              <p style={{ fontSize:"0.82rem",color:"#64748b",lineHeight:1.7,marginBottom:"1.4rem",fontFamily:"Inter,sans-serif" }}>Foram detectados documentos de titulares distintos. Analise apenas documentos de um único titular por vez.</p>
              <div style={{ background:"rgba(234,179,8,0.05)",border:"1px solid rgba(234,179,8,0.15)",borderRadius:10,padding:"0.9rem 1.1rem",marginBottom:"1.6rem" }}>
                {multipleClientsWarning.names.map((n,i)=>(
                  <div key={i} style={{ display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:i<multipleClientsWarning.names.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <span style={{ fontSize:"0.82rem",color:"#94a3b8",fontFamily:"Inter,sans-serif" }}>{n}</span>
                  </div>
                ))}
              </div>
              <button onClick={()=>setMultipleClientsWarning(null)} style={{ width:"100%",background:"rgba(234,179,8,0.1)",border:"1px solid rgba(234,179,8,0.35)",borderRadius:9,color:"#eab308",fontFamily:"Inter,sans-serif",fontSize:"0.78rem",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",padding:"12px",cursor:"pointer",transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(234,179,8,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(234,179,8,0.1)";}}>Entendido — Ajustar Arquivos</button>
            </div>
          </div>
        )}

        {/* ── CONFIRM RESET ── */}
        {confirmReset && (
          <div style={{ position:"fixed",inset:0,zIndex:300,background:"rgba(2,6,23,0.88)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",animation:"mFadeIn 0.18s ease" }}>
            <div style={{ width:"100%",maxWidth:420,background:"rgba(10,17,32,0.97)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"2.2rem",boxShadow:"0 0 60px rgba(0,0,0,0.5)",animation:"mSlideUp 0.22s ease",textAlign:"center" }}>
              <div style={{ width:56,height:56,borderRadius:14,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 1.4rem" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <p style={{ fontSize:"1.1rem",fontWeight:800,color:"#f1f5f9",letterSpacing:"-0.3px",marginBottom:10,fontFamily:"Inter,sans-serif" }}>Tem certeza?</p>
              <p style={{ fontSize:"0.82rem",color:"#64748b",lineHeight:1.7,marginBottom:"1.8rem",fontFamily:"Inter,sans-serif" }}>O relatório atual será descartado e você voltará à tela inicial.</p>
              <div style={{ display:"flex",gap:"0.75rem" }}>
                <button onClick={()=>setConfirmReset(false)} style={{ flex:1,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#94a3b8",fontFamily:"Inter,sans-serif",fontSize:"0.78rem",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",padding:"12px",cursor:"pointer",transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.2)";e.currentTarget.style.color="#e2e8f0";}} onMouseLeave={e=>{e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";e.currentTarget.style.color="#94a3b8";}}>Cancelar</button>
                <button onClick={reset} style={{ flex:1,background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",borderRadius:9,color:"#f87171",fontFamily:"Inter,sans-serif",fontSize:"0.78rem",fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",padding:"12px",cursor:"pointer",transition:"all 0.2s" }} onMouseEnter={e=>{e.currentTarget.style.background="rgba(239,68,68,0.18)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(239,68,68,0.1)";}}>Sim, Nova Análise</button>
              </div>
            </div>
          </div>
        )}

        {/* ── RESULTS ── */}
        {phase==="results" && (
          <div style={{ maxWidth:1080,margin:"0 auto",padding:"2.5rem 2rem" }}>
            <div style={{ marginBottom:"2rem",paddingBottom:"2rem",borderBottom:"1px solid rgba(255,255,255,0.06)",animation:"fadeSlide 0.3s ease" }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:"1rem" }}>
                <div>
                  <div style={{ fontSize:"0.6rem",fontWeight:700,letterSpacing:"3px",textTransform:"uppercase",color:"#3b82f6",marginBottom:10 }}>Relatório de Análise · Descontos Indevidos</div>
                  <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:10 }}>
                    <div style={{ width:40,height:40,borderRadius:"50%",background:"rgba(59,130,246,0.1)",border:"1px solid rgba(59,130,246,0.22)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <h2 style={{ fontSize:"2rem",fontWeight:900,color:"#f1f5f9",letterSpacing:"-1px",lineHeight:1.1 }}>{meta.clientName}</h2>
                  </div>
                  <div style={{ display:"flex",alignItems:"center",gap:8,flexWrap:"wrap" }}>
                    {[meta.banco||"Bradesco", meta.agencia?`Ag. ${meta.agencia}`:null, meta.conta?`Cta. ${meta.conta}`:null, meta.periodo&&meta.periodo!=="—"?meta.periodo:null, fileName].filter(Boolean).map((tag,i)=>(
                      <span key={i} style={{ fontSize:"0.75rem",color:"#475569",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:6,padding:"3px 10px" }}>{tag}</span>
                    ))}
                  </div>
                </div>
                <button onClick={()=>setConfirmReset(true)} style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,color:"#475569",fontFamily:"Inter,sans-serif",fontSize:"0.7rem",fontWeight:600,letterSpacing:"1.5px",textTransform:"uppercase",padding:"9px 18px",cursor:"pointer",transition:"all 0.2s",alignSelf:"flex-start" }} onMouseEnter={e=>{e.currentTarget.style.color="#94a3b8";e.currentTarget.style.borderColor="rgba(255,255,255,0.14)";}} onMouseLeave={e=>{e.currentTarget.style.color="#475569";e.currentTarget.style.borderColor="rgba(255,255,255,0.07)";}}>← Nova Análise</button>
              </div>
            </div>

            <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem",marginBottom:"2rem" }}>
              {[
                { label:"Categorias de Irregularidade", val:groups.length, color:"#60a5fa", sub:"tipologias distintas identificadas", featured:true, icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
                { label:"Ocorrências Detectadas", val:totalOcorrencias, color:"#60a5fa", sub:"descontos irregulares", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
                { label:"Valor Total a Restituir", val:fmt(totalValor), color:"#60a5fa", sub:"sujeito à devolução com correção legal", icon:<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
              ].map((k,i)=>(
                <div key={i} style={{ background:k.featured?"rgba(5,15,35,0.9)":"rgba(12,19,35,0.7)",backdropFilter:"blur(16px)",border:k.featured?"1px solid rgba(59,130,246,0.35)":"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"1.3rem 1.5rem",position:"relative",overflow:"hidden",animation:`fadeSlide 0.35s ease ${i*0.07}s both`,boxShadow:k.featured?"0 0 22px rgba(59,130,246,0.18), inset 0 1px 0 rgba(255,255,255,0.06)":undefined }} className={k.featured?"kpi-featured":""}>
                  <div style={{ position:"absolute",top:0,left:0,right:0,height:1,background:k.featured?"linear-gradient(90deg,transparent,rgba(59,130,246,0.8),transparent)":"linear-gradient(90deg,transparent,rgba(59,130,246,0.35),transparent)" }}/>
                  {k.featured&&<div style={{ position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"#3b82f6",opacity:0.14,filter:"blur(28px)",pointerEvents:"none" }}/>}
                  <div style={{ position:"relative",zIndex:1 }}>
                    <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12 }}>
                      <div style={{ fontSize:"0.6rem",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:k.featured?"rgba(96,165,250,0.7)":"#334155" }}>{k.label}</div>
                      <div style={{ opacity:k.featured?1:0.7 }}>{k.icon}</div>
                    </div>
                    <div style={{ fontSize:"1.85rem",fontWeight:800,color:k.color,letterSpacing:"-1px",lineHeight:1 }}>{k.val}</div>
                    <div style={{ fontSize:"0.7rem",color:k.featured?"rgba(96,165,250,0.45)":"#334155",marginTop:6 }}>{k.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {groups.length===0 && (
              <div style={{ textAlign:"center",padding:"3rem 2rem",background:"rgba(12,19,35,0.4)",borderRadius:12,border:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize:"2rem",marginBottom:"1rem" }}>✅</div>
                <p style={{ fontWeight:700,color:"#e2e8f0",marginBottom:6 }}>Nenhum desconto irregular identificado</p>
                <p style={{ fontSize:"0.82rem",color:"#475569" }}>Não foram encontradas rubricas suspeitas no documento analisado.</p>
              </div>
            )}

            {groups.length>0 && (
              <>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:"1rem" }}>
                  <span style={{ fontSize:"0.62rem",fontWeight:700,letterSpacing:"2.5px",textTransform:"uppercase",color:"#334155" }}>Drill-down por Categoria</span>
                  <div style={{ flex:1,height:1,background:"rgba(255,255,255,0.05)" }}/>
                </div>
                <div style={{ display:"flex",flexDirection:"column",gap:"0.75rem" }}>
                  {groups.map((group,idx)=>(
                    <CategoryCard key={group.cat.id} cat={group.cat} items={group.items} delay={idx*0.07} downloaded={downloadedCats.has(group.cat.id)} onClick={()=>setActiveModal(group)} />
                  ))}
                </div>
                <div style={{ marginTop:"1.5rem",padding:"0.9rem 1.2rem",background:"rgba(59,130,246,0.04)",border:"1px solid rgba(59,130,246,0.1)",borderRadius:10,display:"flex",alignItems:"center",gap:10,fontSize:"0.77rem",color:"#475569" }}>
                  <span style={{ fontSize:14,flexShrink:0 }}>💡</span>
                  Clique em qualquer card para ver os lançamentos detalhados, com data, rubrica, valor e fundamentação jurídica.
                </div>
                <div style={{ marginTop:"1.8rem",display:"flex",justifyContent:"center" }}>
                  <button onClick={()=>setShowDashboard(v=>!v)} style={{ display:"flex",alignItems:"center",gap:10,background:showDashboard?"rgba(59,130,246,0.14)":"rgba(255,255,255,0.03)",border:showDashboard?"1px solid rgba(59,130,246,0.4)":"1px solid rgba(255,255,255,0.08)",borderRadius:12,color:showDashboard?"#60a5fa":"#475569",fontFamily:"Inter,sans-serif",fontSize:"0.78rem",fontWeight:600,letterSpacing:"0.5px",padding:"11px 24px",cursor:"pointer",transition:"all 0.22s ease",boxShadow:showDashboard?"0 0 24px rgba(59,130,246,0.2)":"none" }} onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(59,130,246,0.45)";e.currentTarget.style.color="#60a5fa";e.currentTarget.style.background="rgba(59,130,246,0.1)";}} onMouseLeave={e=>{e.currentTarget.style.borderColor=showDashboard?"rgba(59,130,246,0.4)":"rgba(255,255,255,0.08)";e.currentTarget.style.color=showDashboard?"#60a5fa":"#475569";e.currentTarget.style.background=showDashboard?"rgba(59,130,246,0.14)":"rgba(255,255,255,0.03)";}}>
                    {showDashboard?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>:<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    {showDashboard?"Ocultar Análise Gráfica":"Ver Análise Gráfica dos Dados"}
                  </button>
                </div>
                {showDashboard && <AnalyticsDashboard groups={groups} />}
              </>
            )}
          </div>
        )}
      </div>

      {activeModal && <Modal group={activeModal} onClose={()=>setActiveModal(null)} clientName={meta.clientName} onExported={(catId)=>setDownloadedCats(prev=>new Set([...prev,catId]))} />}
    </>
  );
}
