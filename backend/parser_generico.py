"""
Parser Genérico — LEX FINDER
Extrai lançamentos de extratos bancários de outros bancos (BB, Itaú, Caixa, Santander).
Estratégia: tenta extrair por heurística genérica — data + texto + valores.

TODO: Implementar parsers específicos por banco conforme PDFs reais forem testados.
"""

import re
from dataclasses import dataclass, asdict

import pdfplumber

from parser_bradesco import (
    Lancamento,
    _agrupar_por_y,
    _eh_data,
    _eh_valor,
    _parse_valor,
    _texto_da_linha,
)

# ── Heurística Genérica ────────────────────────────────────────────────────────

class ParserGenerico:
    """
    Parser de fallback para bancos sem parser específico.
    Tenta seguir a heurística: linha que começa com data DD/MM/AAAA
    contém o lançamento. O texto restante é o histórico.
    Valores são classificados por posição (último = saldo, penúltimo = débito/crédito).
    """

    def __init__(self, caminho_pdf: str, banco: str = "generico"):
        self.caminho = caminho_pdf
        self.banco = banco
        self._pdf = None
        self.lancamentos: list[Lancamento] = []
        self.cliente = ""
        self.agencia = ""
        self.conta = ""
        self.periodo = ""

    def _abrir(self):
        self._pdf = pdfplumber.open(self.caminho)

    def _fechar(self):
        if self._pdf:
            self._pdf.close()

    def _parse_pagina(self, page, num_pagina: int):
        palavras = page.extract_words(keep_blank_chars=False)
        linhas = _agrupar_por_y(palavras)

        lancamento_atual = None

        for linha in linhas:
            textos = [w["text"] for w in linha]
            if not textos:
                continue

            primeira = textos[0]

            if _eh_data(primeira):
                # Salva lançamento anterior
                if lancamento_atual:
                    self.lancamentos.append(lancamento_atual)

                lancamento_atual = Lancamento(
                    data=primeira,
                    pagina=num_pagina,
                    banco=self.banco,
                )

                # Separar valores e histórico
                valores = []
                hist_tokens = []
                for w in linha[1:]:
                    if _eh_valor(w["text"]):
                        valores.append(_parse_valor(w["text"]))
                    else:
                        hist_tokens.append(w["text"])

                lancamento_atual.historico = " ".join(hist_tokens).strip()

                # Atribuir valores por posição (convenção mais comum)
                if len(valores) >= 3:
                    lancamento_atual.debito = valores[0]
                    lancamento_atual.credito = valores[1]
                    lancamento_atual.saldo = valores[2]
                elif len(valores) == 2:
                    lancamento_atual.debito = valores[0]
                    lancamento_atual.saldo = valores[1]
                elif len(valores) == 1:
                    lancamento_atual.saldo = valores[0]

            elif lancamento_atual:
                # Linha de continuação
                for w in linha:
                    if _eh_valor(w["text"]) and lancamento_atual.saldo is None:
                        lancamento_atual.saldo = _parse_valor(w["text"])
                    elif not _eh_data(w["text"]) and not _eh_valor(w["text"]):
                        lancamento_atual.historico = (
                            lancamento_atual.historico + " " + w["text"]
                        ).strip()

        if lancamento_atual:
            self.lancamentos.append(lancamento_atual)

    def processar(self, on_progress=None) -> list[dict]:
        self._abrir()
        try:
            paginas = self._pdf.pages
            total = len(paginas)
            for i, page in enumerate(paginas):
                if on_progress:
                    on_progress(i + 1, total)
                self._parse_pagina(page, i + 1)
        finally:
            self._fechar()

        return [asdict(l) for l in self.lancamentos]

    @property
    def meta(self) -> dict:
        return {
            "cliente": self.cliente or "Não identificado",
            "agencia": self.agencia or "—",
            "conta": self.conta or "—",
            "periodo": self.periodo or "—",
            "layout": "generico",
            "total_lancamentos": len(self.lancamentos),
        }


# ── Fábrica de parsers ────────────────────────────────────────────────────────

def criar_parser(banco: str, caminho_pdf: str):
    """
    Retorna o parser adequado para o banco informado.
    Futuramente: criar ParserBB, ParserItau, ParserCaixa, ParserSantander.
    """
    from parser_bradesco import ParserBradesco

    banco_lower = banco.lower().strip()

    if banco_lower in {"bradesco"}:
        return ParserBradesco(caminho_pdf)
    else:
        # Fallback genérico para BB, Itaú, Caixa, Santander
        return ParserGenerico(caminho_pdf, banco=banco_lower)


# ── Teste rápido ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys, json

    if len(sys.argv) < 3:
        print("Uso: python parser_generico.py <banco> <extrato.pdf>")
        print("  Bancos: bradesco, bb, itau, caixa, santander")
        sys.exit(1)

    banco = sys.argv[1]
    pdf_path = sys.argv[2]

    parser = criar_parser(banco, pdf_path)
    lancamentos = parser.processar()

    print(f"Banco   : {banco}")
    print(f"Layout  : {parser.meta['layout']}")
    print(f"Total   : {parser.meta['total_lancamentos']} lançamentos")

    for l in lancamentos[:5]:
        print(f"  {l['data']}  {l['historico'][:60]}")
