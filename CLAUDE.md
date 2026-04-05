# CLAUDE.md — LEX FINDER (RA Tecnologia)

## Contexto do Projeto

Ferramenta jurídica multi-banco que analisa extratos bancários em PDF e identifica cobranças indevidas. Suporta **Bradesco**, **Itaú**, **Santander** e **Agibank**. Extrai automaticamente dados do titular, cruza lançamentos com categorias de descontos irregulares e gera relatórios com fundamento jurídico.

**Cliente:** RA Reclame AI (empresa de tecnologia, cliente da AW LEGALTECH)
**Desenvolvido por:** AW LEGALTECH (João Winícius)
**Repo:** `AWLEGALTECH/LEXFINDER` (privado, branch `master`)
**Deploy:** Vercel — https://lexfinder.vercel.app
**Time Vercel:** `awlegaltech-5909s-projects` (projectId: `prj_Q3S6Fq8S1WhUN8YH92bFxkZEuwih`)

## Stack

- **Frontend:** React 19 + Vite 8 (SPA, arquivo único `src/App.jsx`)
- **PDF parsing:** PDF.js 3.11.174 (CDN, client-side)
- **Export:** XLSX.js 0.18.5 (CDN, client-side)
- **Gráficos:** Recharts 3.8
- **Backend:** Python CLI (parser alternativo, roda localmente — independente do frontend)
- **Deploy:** Vercel (auto-deploy desativado — usar `npx vercel --prod --yes`)
- **Package manager:** npm
- **Branch:** `master` (não `main`)

## Regras Obrigatórias

1. **Zero falsos positivos** — JAMAIS classificar um lançamento legítimo como cobrança indevida
2. **Commits** em português, prefixo convencional (feat, fix, refactor)
3. **Push** para `master` (não `main`), sempre confirmar com o usuário antes
4. **Deploy** manual via `npx vercel --prod --yes`
5. O `dist/` NÃO deve ser commitado (está no .gitignore)

## Estrutura do Projeto

```
LEXFINDER/
├── src/
│   ├── App.jsx          # Frontend (~1200 linhas) — UI + orquestração
│   ├── parser.js         # Parser multi-banco (~1600 linhas) — toda lógica de parsing
│   ├── main.jsx         # Entry point React
│   └── banks/           # Perfis de bancos
│       ├── index.js     # detectBank() score-based + registry
│       ├── bradesco.js  # Perfil Bradesco (score, detect, patterns)
│       ├── itau.js      # Perfil Itaú (score, detect, patterns)
│       ├── santander.js # Perfil Santander (score, detect, patterns)
│       ├── agibank.js   # Perfil Agibank (score, detect, patterns)
│       ├── bb.js        # Perfil BB (stub — todos image-based)
│       └── caixa.js     # Perfil Caixa (stub — todos image-based)
├── backend/             # Parser Python (alternativo, CLI local)
│   ├── main.py          # Orquestrador CLI
│   ├── parser_bradesco.py
│   ├── motor_regras.py
│   ├── rubricas.json
│   └── requirements.txt
├── tests/
│   ├── parser.test.js   # 34 testes unitários (baselines)
│   ├── baselines/*.json # Snapshots de resultados esperados
│   └── fixtures/*.pdf   # PDFs de teste
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .gitignore
```

## Arquivos Principais

### src/parser.js — Parser Multi-Banco

```
├── CATEGORIAS[]                  — 15 categorias de descontos
├── normalizeText()               — remove acentos para matching case-insensitive
├── matchCategoria()              — cruza histórico com keywords (guard REM:/DES:)
├── analyzeAll()                  — agrupa transações por categoria
├── groupByY()                    — agrupa text items por coordenada Y (±4pt)
├── parseValor()                  — converte "1.234,56" → 1234.56 (abs)
├── parseDocumentoPDF()           — orquestra: scan → detect → route → parse
├── PARSERS POR BANCO
│   ├── assembleTransactions()    — Parser Bradesco (2 layouts)
│   ├── parseItauTransactions()   — Parser Itaú (formato padrão + sufixo +/-)
│   ├── parseItauTarifasAnuais()  — Parser Itaú (extrato anual DD/MMM)
│   ├── parseSantanderTransactions() — Parser Santander
│   └── parseAgibankTransactions()   — Parser Agibank
└── DETECÇÃO
    └── detectBank() via src/banks/index.js (score-based, multi-page)
```

### src/App.jsx — Frontend

```
├── Modal            — detalhes de uma categoria com export XLSX
├── CategoryCard     — card resumo de uma categoria
└── App              — upload, parsing, resultados, analytics
```

## Detecção de Banco — Score-Based

`detectBank()` em `src/banks/index.js` usa sistema de scores com scan multi-page (páginas 1-3):

| Banco | Markers fortes (+5) | Markers fracos | Negativos |
|-------|---------------------|----------------|-----------|
| Bradesco | `bradesco celular` | `bradesco` (+1) | `banco bradesco s.a` sem celular (-1) |
| Santander | `extrato consolidado inteligente`, `BALP_UY_` | `santander` (+2) | — |
| Itaú | `combinaqui`, `extrato anual de tarifas` | `itaú` (+3) | — |
| Agibank | `agibank` | `banco 121` (+3) | — |

Fallback: Bradesco (se todos scores = 0).

## Parsers por Banco

### Bradesco — `assembleTransactions()`
- 2 layouts auto-detectados: "Data Superior" vs "Data Inferior"
- 3 colunas: Crédito, Débito, Saldo (posição X)
- `justEmitted` tipado para controle de fluxo multi-line
- `pickDebit()` seleciona valor mais próximo de `debitoX`

### Itaú — `parseItauTransactions()` + `parseItauTarifasAnuais()`
- Formato padrão: 1 linha/txn, coluna "Valor (R$)" com sinal `-`
- Formato B (sufixo): valores "97,00 (-)" via IS_SUFFIX_VALUE
- Formato Tarifas Anuais: datas DD/MMM, all-debit, dedup 5x

### Santander — `parseSantanderTransactions()`
- Multi-line (descrição + detalhe)
- Datas DD/MM (ano do cabeçalho)
- Débito: sufixo `-` (ex: "75,00-")

### Agibank — `parseAgibankTransactions()`
- Valores `+/- R$ xxx,xx` (IS_AGIBANK_VALUE)
- Datas DD/MM (ano do header)
- 1 coluna Valor, saldo filtrado por x>480

## Pitfalls Conhecidos

- **REM: e DES:** são prefixos de remetente/destinatário de PIX/TED — NUNCA são tarifas. Guard em `matchCategoria()` retorna null.
- **IS_VALUE regex** aceita valores negativos (`-15,00`) — débitos podem ter sinal negativo
- **parseValor** usa `Math.abs()` — valores negativos viram positivos
- **Saldo ≠ Débito** — saldo é o que resta na conta, débito é o que foi cobrado. SEMPRE pegar da coluna Débito.
- **Docto** (ex: "0090126") NÃO é valor monetário — não tem vírgula decimal, não casa com IS_VALUE
- **Continuações** (ex: "CESTA B.EXPRESSO4" abaixo de "TARIFA BANCARIA") — `lastPushed` permite append ao histórico

## Categorias de Descontos (15)

| ID | Label | Keywords principais |
|----|-------|-------------------|
| tarifas | Cobranças Indevidas | tarifa bancaria, recebimento fornecedor, tar manut conta |
| saque_terminal | Saque Terminal | saqueterminal, saquecorrespondente, saquepessoal |
| adiantamento | Adiantamento ao Depositante | adiant.depositante, tar adiant.depositante |
| cesta | Pacotes e Cestas | cesta, pacote de servicos, pserv, binclub |
| encargos | Encargos e IOF | encargos limite de cred, iof s/ |
| mora | Mora de Crédito | mora credito pessoal, mora cartao |
| seguros | Seguro | bradesco vida e previdencia, seguro prestamista |
| tit_cap | Título de Capitalização | tit cap, titulo capitalizacao |
| credito | Parcela de Crédito Pessoal | emprestimo pessoal, parcela credito pessoal |
| anuidade | Anuidade e Cartão | anuidade, cartao credito anuidade |
| extrato | Emissão de Extrato | emissao extrato, extrato movimento, 2via de extrato |
| invest_facil | Invest Fácil | invest facil, aplic.invest facil |
| bx_ant_financ | BX Antecipação Financeira | bx.ant.financ/emp, bx ant financ, bx.antecipacao |
| gastos_cartao | Gastos com Cartão | gasto c/cartao de credito, gastos cartao credito |
| outros | Outras Cobranças | msg, regularizacao manual, doc/ted internet |

## justEmitted — Controle de Fluxo do Parser

O parser usa `justEmitted` tipado (`true`, `"pending-close"`, `"standalone"`) com check bidirecional de categoria:
- Quando `justEmitted` é truthy e o próximo row tem valores, verifica a categoria do texto
- Se a categoria do texto difere da do lastEmitted → cria novo pending (nova transação)
- Exceção: `cesta` e `saque_terminal` após `tarifas` → append como detalhe (sub-descrição)
- O branch `pending` também verifica: texto categorizado substitui pending sem valor/categoria

**CUIDADO:** Qualquer mudança no parser DEVE ser testada com TODOS os 7 cases. O equilíbrio Abel (2-line) vs Adailton (regular) vs Claudia (phantoms) vs Zeildo (93 pgs, 9 períodos) é crítico.

## Test Cases Validados (v7 — 15 categorias, bx_ant_financ + gastos_cartao separados)

| Case | Ocorrências | Valor | Categorias |
|------|-------------|-------|------------|
| ABEL MOTA NOGUEIRA | 105 | R$ 6.067,90 | 8 |
| ADAILTON DA SILVA PEREIRA | 443 | R$ 39.984,86 | 13 |
| ALCILENE PEREIRA PINHEIRO | 58 | R$ 7.455,35 | 7 |
| ALEXANDRE LUIS BARBOSA | 58 | R$ 2.579,95 | 6 |
| CLAUDIA NAYARA LIRA LEMOS | 129 | R$ 6.838,49 | 9 |
| DAVID PONCIANO DA SILVA | 8 | R$ 4.476,90 | 2 |
| ZEILDO ALMEIDA FREITAS | 467 | R$ 30.974,44 | 9 |
| LUIS CARLOS MARQUES | 207 | R$ 9.555,32 | 7 |

Baselines em `tests/baselines/*.json`. Fixtures em `tests/fixtures/*.pdf`.

**Teste em massa v7 (25 clientes):** Todos os 25 clientes Bradesco testados com zero keywords faltantes. Gaps encontrados são por PDFs diferentes entre pastas, não por falha do parser.

## Optijus Infla Valores (Descoberta Crítica)

O Optijus processa páginas "Últimos Lançamentos" como transações reais (duplicatas massivas) e conta entradas de CRÉDITO como descontos. No case Adailton: Optijus R$ 197.800 vs LEXFINDER R$ 36.026 (correto).

## Referência: Optijus

O Optijus (optijus.com.br) é o sistema concorrente/referência. O LEX FINDER deve produzir resultados idênticos ou melhores — zero falsos positivos, zero detecções perdidas.

## IS_SEPARATE_TX — Guard contra Line-Merge

O parser usa `IS_SEPARATE_TX` regex para impedir que textos de transações legítimas (PIX, COMPRA, SAQUE, TED, etc.) sejam merged como detalhes de transações categorizadas. O guard atua em dois pontos:
- Na branch `justEmitted` de `assembleTransactions()` — impede append ao lastEmitted
- Na branch `pending` — só separa se pending já tiver valor (para não quebrar 2-line format do Abel)

## Bancos Deferidos

| Banco | PDFs disponíveis | Motivo |
|-------|-----------------|--------|
| BB | 50 | Todos image-based — precisa OCR confiável |
| Caixa | 17 | Todos image-based — precisa OCR confiável |

## Pendências

1. Melhorar OCR para PDFs image-based (BB, Caixa, parte do Itaú/Agibank)
2. Exportação Excel/PDF aprimorada

## Documentação

- Obsidian vault: `C:\Users\winic\OneDrive\Desktop\AW-Brain\03 - Clientes Futuros\RA Reclame AI\`
- Notas-chave: `Home RA`, `Briefing RA`, `LEX FINDER`, `LEXFINDER v10 - Multi-Banco`
