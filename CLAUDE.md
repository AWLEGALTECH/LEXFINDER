# CLAUDE.md — LEX FINDER (RA Tecnologia)

## Contexto do Projeto

Ferramenta jurídica que analisa extratos bancários Bradesco Celular em PDF e identifica cobranças indevidas. Extrai automaticamente dados do titular, cruza lançamentos com categorias de descontos irregulares e gera relatórios com fundamento jurídico.

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
│   ├── App.jsx          # Frontend completo (~1200 linhas) — parser JS + UI
│   └── main.jsx         # Entry point React
├── backend/             # Parser Python (alternativo, CLI local)
│   ├── main.py          # Orquestrador CLI
│   ├── parser_bradesco.py
│   ├── motor_regras.py
│   ├── rubricas.json
│   └── requirements.txt
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .gitignore
```

## Arquivo Principal — src/App.jsx

Tudo está em `src/App.jsx`:

```
├── CATEGORIAS[]           — 12 categorias de descontos
├── normalizeText()        — remove acentos para matching case-insensitive
├── matchCategoria()       — cruza histórico com keywords (com guard REM:/DES:)
├── analyzeAll()           — agrupa transações por categoria
├── PDF PARSER
│   ├── loadPdfJs()        — carrega PDF.js do CDN
│   ├── groupByY()         — agrupa text items por coordenada Y (±4pt)
│   ├── parseValor()       — converte "1.234,56" → 1234.56 (abs)
│   ├── pickDebit()        — seleciona valor da coluna Débito via posição X
│   ├── detectLayout()     — detecta "superior" vs "inferior" automaticamente
│   ├── extractFromRow()   — extrai histórico + valor de uma row
│   └── parseDocumentoPDF()— orquestra parsing em 4 fases
├── Modal                  — detalhes de uma categoria com export XLSX
├── CategoryCard           — card resumo de uma categoria
└── App                    — componente principal (upload, parsing, resultados, analytics)
```

## Dois Layouts de Bradesco Celular

O parser detecta automaticamente qual layout o PDF usa:

| Layout | Regra | Parser |
|--------|-------|--------|
| **Data Superior** | Data na 1ª linha do grupo → herda para baixo | `lastDate` + `lastPushed` para continuações |
| **Data Inferior** | Data na última linha do grupo → herda para cima | Buffer de transações sem data, flush quando data aparece |

## Detecção de Colunas

O parser detecta as posições X de 3 colunas do cabeçalho da tabela:
- `creditoX` — posição do texto "Crédito (R$)"
- `debitoX` — posição do texto "Débito (R$)"
- `saldoX` — posição do texto "Saldo (R$)"

`pickDebit()` pega o valor mais próximo de `debitoX` que NÃO esteja mais perto de `creditoX` ou `saldoX`.

## Pitfalls Conhecidos

- **REM: e DES:** são prefixos de remetente/destinatário de PIX/TED — NUNCA são tarifas. Guard em `matchCategoria()` retorna null.
- **IS_VALUE regex** aceita valores negativos (`-15,00`) — débitos podem ter sinal negativo
- **parseValor** usa `Math.abs()` — valores negativos viram positivos
- **Saldo ≠ Débito** — saldo é o que resta na conta, débito é o que foi cobrado. SEMPRE pegar da coluna Débito.
- **Docto** (ex: "0090126") NÃO é valor monetário — não tem vírgula decimal, não casa com IS_VALUE
- **Continuações** (ex: "CESTA B.EXPRESSO4" abaixo de "TARIFA BANCARIA") — `lastPushed` permite append ao histórico

## Categorias de Descontos (12)

| ID | Label | Keywords principais |
|----|-------|-------------------|
| tarifas | Cobranças Indevidas | tarifa bancaria, saqueterminal, recebimento fornecedor |
| adiantamento | Adiantamento ao Depositante | adiant.depositante, tar adiant.depositante |
| cesta | Pacotes e Cestas | cesta, pacote de servicos, pserv, binclub |
| encargos | Encargos e IOF | encargos limite de cred, iof s/ |
| mora | Mora de Crédito | mora credito pessoal, mora cartao |
| seguros | Seguros e Previdência | bradesco vida e previdencia, seguro prestamista |
| tit_cap | Título de Capitalização | tit cap, titulo capitalizacao |
| credito | Crédito Pessoal | emprestimo pessoal, parcela credito pessoal |
| anuidade | Anuidade e Cartão | anuidade, gasto c/cartao de credito |
| extrato | Emissão de Documentos | emissao extrato, 2via de extrato |
| invest_facil | Invest Fácil | invest facil, bx ant financ |
| outros | Outras Cobranças | msg, regularizacao manual |

## justEmitted — Controle de Fluxo do Parser

O parser usa `justEmitted` tipado (`"pending-close"` vs `"standalone"`) para resolver a tensão entre:
- **Abel Mota** (formato 2-line): detalhes devem ser anexados à transação anterior
- **Adailton** (formato regular): textos pós-standalone são novas transações

**CUIDADO:** Qualquer mudança no parser DEVE ser testada com AMBOS os cases. Foram 7+ commits iterativos para equilibrar.

## Test Cases Validados

| Case | Páginas | Ocorrências | Valor | PDF |
|------|---------|-------------|-------|-----|
| ABEL MOTA NOGUEIRA | 7 processos | ~107 baseline | — | `Z:\1. PROCESSOS CIVEIS\ABEL MOTA NOGUEIRA\` (15033-15039) |
| ABRÃO GONÇALVES ARAUJO | 18 pgs | 56 | R$ 4.235 | `Z:\...\(11834) BANCO BRADESCO - MORA\` |
| ADAILTON DA SILVA PEREIRA | 59 pgs | 391 + 8 Invest Fácil | R$ 36.026,99 | `Z:\...\21054-BANCO BRADESCO S.A- MORA\` |

## Optijus Infla Valores (Descoberta Crítica)

O Optijus processa páginas "Últimos Lançamentos" como transações reais (duplicatas massivas) e conta entradas de CRÉDITO como descontos. No case Adailton: Optijus R$ 197.800 vs LEXFINDER R$ 36.026 (correto).

## Referência: Optijus

O Optijus (optijus.com.br) é o sistema concorrente/referência. O LEX FINDER deve produzir resultados idênticos ou melhores — zero falsos positivos, zero detecções perdidas.

## Pendências

1. Re-testar ABEL MOTA — commit b0fa8e6 pode ter regredido de 107 para ~96 ocorrências
2. Testes com PDFs mais variados
3. Expandir keywords (~120 → mais perto das 265 do Optijus)
4. Exportação Excel/PDF
5. Testes automatizados (sem test runner configurado)

## Documentação

- Obsidian vault: `C:\Users\winic\OneDrive\Desktop\AW-Brain\03 - Clientes Futuros\RA Reclame AI\`
- Notas-chave: `Home RA`, `Briefing RA`, `LEX FINDER`
