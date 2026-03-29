# LEX FINDER — Contexto do Projeto

## O que é

Ferramenta web que analisa extratos bancários (PDF) e identifica automaticamente cobranças indevidas, gerando relatório jurídico com fundamento legal para cada tipo de cobrança detectada.

**Cliente:** RA Tecnologia (Reclame AI)
**Desenvolvido por:** AW LEGALTECH (João Winícius)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 19 + Vite 8 + Recharts (SPA, arquivo único `src/App.jsx`) |
| Backend | Python (CLI local — parser de PDF com pdfplumber/PyMuPDF) |
| Deploy | Vercel (auto-deploy no push para `master`) |
| Repo | `AWLEGALTECH/LEXFINDER` no GitHub |

## Estrutura

```
LEXFINDER/
├── src/
│   ├── App.jsx          # Frontend completo (~1078 linhas) — parser JS + UI
│   └── main.jsx         # Entry point React
├── backend/             # Parser Python (alternativo, CLI local)
│   ├── main.py          # Orquestrador CLI
│   ├── parser_bradesco.py  # Parser específico Bradesco
│   ├── parser_generico.py  # Parser genérico outros bancos
│   ├── detector.py      # Detecção digital vs escaneado
│   ├── motor_regras.py  # Motor de regras jurídicas
│   ├── gerador_output.py   # Geração de Excel + PDF
│   ├── ocr_pipeline.py  # OCR para PDFs escaneados
│   ├── rubricas.json    # Mapeamento de rubricas bancárias
│   └── requirements.txt
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
└── .gitignore
```

## Como funciona o Frontend (App.jsx)

O App.jsx é um monolito que contém:

1. **CATEGORIAS** — array de categorias de cobranças (tarifas, cestas, encargos, seguros, etc.) com keywords, fundamento legal e ação sugerida
2. **parseDocumentoPDF()** — extrai texto do PDF via pdf.js, identifica titular, agência, conta, período
3. **Parser de transações** — formato Bradesco Celular (2 linhas por transação: título + detalhe com data/valor)
4. **Matching** — cruza transações extraídas com keywords das categorias
5. **UI** — upload de PDF, dashboard com gráficos (Recharts), tabela de cobranças detectadas, relatório jurídico

### Parser: pontos-chave

- Usa `lastDate` + `pending` para parear linhas de título com linhas de detalhe
- Detecta layout "Data Superior" vs "Data Inferior" automaticamente
- Identifica posição das 3 colunas (Crédito/Débito/Saldo) para classificar valores
- Extração do nome do titular: múltiplas regex + fallback para nome em CAPSLOCK

## Deploy

- **Branch:** `master`
- **Vercel project:** `lexfinder` (projectId: `prj_Q3S6Fq8S1WhUN8YH92bFxkZEuwih`)
- Push para `master` → deploy automático

## Regras

- Commits em português, prefixo convencional (feat, fix, refactor, etc.)
- Confirmar antes de push
- O `dist/` NÃO deve ser commitado (está no .gitignore)
- O backend Python é independente do frontend — roda localmente via CLI

## Categorias de cobranças detectadas

| ID | Label | Exemplo de keyword |
|----|-------|-------------------|
| tarifas | Tarifas Avulsas | "tarifa bancaria", "saqueterminal" |
| cesta | Pacotes e Cestas | "cesta", "pacote de servicos" |
| encargos | Encargos e IOF | "encargos limite de cred", "iof s/" |
| seguros | Seguros | "seguro", "prestamista" |
| capitalizacao | Capitalização | "titulo de capitalizacao", "cap parcela" |
| credito_pessoal | Crédito Pessoal | "parcela cred pessoal", "parcela emprestimo" |

## Documentação

- Obsidian vault: `AW-Brain/03 - Clientes Futuros/RA Reclame AI/`
- Nota técnica: `LEX FINDER.md` no vault
