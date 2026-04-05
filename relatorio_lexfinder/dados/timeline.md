# Timeline de Desenvolvimento — LEX FINDER

## 44 commits em 8 dias (29/mar - 05/abr/2026)

### Dia 1 — 29/mar/2026 (19 commits)
| Commit | Descricao |
|--------|-----------|
| 542f658 | Scaffold inicial LEX FINDER |
| 2b77a2f | Python backend completo |
| 358d2b7 | Vercel config + .gitignore |
| 2e0971e | Rewrite parser formato Bradesco Celular |
| 7b7c3c6 | Melhorar extracao nome do titular |
| eca6724 | Detectar layout Data Superior vs Data Inferior automaticamente |
| ac1444e | Usar posicao das 3 colunas (Credito/Debito/Saldo) |
| a572364 | Classificar por keyword mais longa (evitar misclassificacao) |
| 4110df2 | Rubrica AD DEPOSITANTE, filtrar headers |
| de8ff8e | Renomear categorias para rubricas reais |
| 4d44a88 | Separar Seguro e Titulo de Capitalizacao |
| b3cf2ce | Fix detalhe pos-valores (CESTA perdida) |
| 2238287 | Expandir keywords + corrigir desempate |
| 3720e48 | Fix justEmitted standalone + phantom creditos |
| b411ae3 | Filtrar linhas de Total/sumario |
| 3c092ca | Pular paginas "Ultimos Lancamentos" |
| c393fa8 | Corrigir concatenacao parser Bradesco |
| 08f259c | Heuristica justEmitted baseada em texto |
| b180f13 | Reverter justEmitted standalone (fix regressao Abel) |
| e8f99d3 | Heuristica standalone — texto+valores nao concatena |

### Dia 2 — 30/mar/2026 (7 commits)
| Commit | Descricao |
|--------|-----------|
| 59360e5 | Detectar nova transacao vs detalhe via matchCategoria |
| 513094f | justEmitted tipado (pending-close vs standalone) |
| 951a666 | Lookahead para decidir detalhe vs nova transacao |
| 59b177d | Nova categoria Invest Facil + expandir keywords |
| 8c45d41 | Combinar lookahead + matchCategoria |
| a38ad5c | Exigir categoria diferente para separar pos-standalone |
| b0fa8e6 | Separar transacao reconhecida apos SAQUE |

### Dia 3 — 31/mar/2026 (4 commits)
| Commit | Descricao |
|--------|-----------|
| 5164a05 | OCR fallback para PDFs vetoriais (Tesseract.js) |
| 3ce853e | **LEXFINDER v2** — parser 2-pass, Otsu, 265 keywords, test suite |
| b76029c | IS_SEPARATE_TX guard contra line-merge |
| 60f58aa | 5o test case: CLAUDIA NAYARA (69 pgs, 84 ocorr) |

### Dia 4 — 01/abr/2026 (3 commits)
| Commit | Descricao |
|--------|-----------|
| 2700784 | Check bidirecional de categoria para todos os estados |
| ea49131 | Date-row absorption + IS_SEPARATE_TX para pending |
| 41840c9 | Nova categoria Saque Terminal |

### Dia 5 — 02/abr/2026 (1 commit)
| Commit | Descricao |
|--------|-----------|
| c57fc7f | Keywords multi-banco + multi-select export peticao |

### Dia 6 — 03/abr/2026 (1 commit)
| Commit | Descricao |
|--------|-----------|
| ea62abf | Fallback Ultimos Lancamentos + Excel formato Optijus |

### Dia 7 — 04/abr/2026 (4 commits)
| Commit | Descricao |
|--------|-----------|
| f95602e | 15 categorias (BX Ant Financ + Gastos Cartao separados) |
| ff54279 | Exportacao Excel profissional |
| a6c4bb1 | **Parsers Itau + Santander** implementados |
| a252b42 | Re-deteccao banco apos OCR para multi-banco |

### Dia 8 — 05/abr/2026 (4 commits)
| Commit | Descricao |
|--------|-----------|
| 1f0c447 | **Deteccao score-based + parser Agibank + fix Itau** |
| f21f415 | CLAUDE.md atualizado multi-banco |
| 447f49f | Fix deteccao OCR + parser Itau mobile |
| bd72fcb | **Seguranca pre-deploy** — SRI, CSP, headers |

## Resumo por Area

| Area | Commits | Descricao |
|------|---------|-----------|
| Parser Bradesco | 20 | Layout detection, column clustering, justEmitted, guards |
| Parser Itau | 4 | 3 formatos (padrao, sufixo, tarifas anuais, mobile) |
| Parser Santander | 2 | Multi-line, datas curtas, debito sufixo |
| Parser Agibank | 1 | Prefixo +/- R$, filtro saldo |
| Keywords | 6 | 413 keywords, 15 categorias |
| OCR | 3 | Tesseract.js, Otsu binarization, re-deteccao |
| Export Excel | 3 | Formato peticao, multi-select, Art. 42 CDC |
| Seguranca | 1 | SRI, CSP, Security Headers |
| Infra | 4 | Scaffold, Vercel, CI/CD, docs |
