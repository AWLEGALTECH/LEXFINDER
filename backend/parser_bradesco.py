"""
Parser Bradesco — LEX FINDER
Extrai lançamentos de extratos bancários do Bradesco (PDF digital).

Suporta dois layouts:
  - DATA SUPERIOR: data na mesma linha do histórico (mais comum)
  - DATA INFERIOR: data aparece abaixo do bloco histórico+valores

Auto-detecta o layout analisando a posição das datas no PDF.
"""

import re
from dataclasses import dataclass, field, asdict
from pathlib import Path

import pdfplumber

# ── Constantes ────────────────────────────────────────────────────────────────

DATE_RE = re.compile(r"^\d{2}/\d{2}/\d{4}$")
VALUE_RE = re.compile(r"^\d{1,3}(?:\.\d{3})*,\d{2}[CD]?$")  # ex: 1.234,56 ou 1.234,56D
Y_TOLERANCE = 4   # pixels de tolerância para agrupar na mesma linha
X_TOLERANCE = 10  # pixels de tolerância para alinhar colunas


@dataclass
class Lancamento:
    data: str = ""
    historico: str = ""
    docto: str = ""
    credito: float | None = None
    debito: float | None = None
    saldo: float | None = None
    pagina: int = 0
    banco: str = "Bradesco"


# ── Utilitários ───────────────────────────────────────────────────────────────

def _parse_valor(s: str) -> float | None:
    """Converte string BR para float. Ex: '1.234,56' → 1234.56"""
    if not s:
        return None
    s = s.strip().rstrip("CD")  # remove sufixo crédito/débito se houver
    try:
        return float(s.replace(".", "").replace(",", "."))
    except ValueError:
        return None


def _eh_data(texto: str) -> bool:
    return bool(DATE_RE.match(texto.strip()))


def _eh_valor(texto: str) -> bool:
    return bool(VALUE_RE.match(texto.strip().replace(" ", "")))


def _agrupar_por_y(palavras: list[dict], tolerancia: float = Y_TOLERANCE) -> list[list[dict]]:
    """
    Recebe lista de dicts com 'text', 'x0', 'top', 'x1', 'bottom'.
    Agrupa por y aproximado (linhas do PDF).
    Retorna lista de linhas, cada linha = lista de palavras ordenadas por x0.
    """
    if not palavras:
        return []

    ordenadas = sorted(palavras, key=lambda w: w["top"])
    linhas = []
    linha_atual = [ordenadas[0]]

    for palavra in ordenadas[1:]:
        y_ref = linha_atual[0]["top"]
        if abs(palavra["top"] - y_ref) <= tolerancia:
            linha_atual.append(palavra)
        else:
            linhas.append(sorted(linha_atual, key=lambda w: w["x0"]))
            linha_atual = [palavra]

    linhas.append(sorted(linha_atual, key=lambda w: w["x0"]))
    return linhas


def _texto_da_linha(linha: list[dict]) -> str:
    return " ".join(w["text"] for w in linha)


def _detectar_colunas(paginas_pdfplumber: list) -> dict:
    """
    Varre as primeiras páginas para encontrar a linha de cabeçalho e
    extrair os X das colunas: debito_x, credito_x, saldo_x, docto_x.
    Retorna dict com as posições ou None se não encontrado.
    """
    cabecalho_keywords = {"debito", "débito", "debito(r$)", "debito r$"}
    for page in paginas_pdfplumber[:3]:
        palavras = page.extract_words()
        linhas = _agrupar_por_y(palavras)
        for linha in linhas:
            textos_lower = [w["text"].lower() for w in linha]
            if any(k in textos_lower for k in cabecalho_keywords):
                colunas = {}
                for w in linha:
                    tl = w["text"].lower()
                    if tl in {"débito", "debito", "débito(r$)"}:
                        colunas["debito_x"] = w["x0"]
                    elif tl in {"crédito", "credito", "crédito(r$)"}:
                        colunas["credito_x"] = w["x0"]
                    elif tl in {"saldo", "saldo(r$)"}:
                        colunas["saldo_x"] = w["x0"]
                    elif tl in {"docto.", "docto", "documento"}:
                        colunas["docto_x"] = w["x0"]
                if "debito_x" in colunas:
                    return colunas
    return {}


def _coluna_da_palavra(palavra: dict, colunas: dict) -> str:
    """Identifica a qual coluna pertence uma palavra pelo seu X."""
    if not colunas:
        return "unknown"
    x = palavra["x0"]
    tolerancia = 50  # pixels de margem

    if "debito_x" in colunas and abs(x - colunas["debito_x"]) < tolerancia:
        return "debito"
    if "credito_x" in colunas and abs(x - colunas["credito_x"]) < tolerancia:
        return "credito"
    if "saldo_x" in colunas and abs(x - colunas["saldo_x"]) < tolerancia:
        return "saldo"
    if "docto_x" in colunas and abs(x - colunas.get("docto_x", -9999)) < tolerancia:
        return "docto"
    return "historico"


def _detectar_layout(paginas_pdfplumber: list, colunas: dict) -> str:
    """
    Auto-detecta se é 'data_superior' ou 'data_inferior'.
    Estratégia: nas primeiras linhas com lançamentos, verifica se a data
    aparece na mesma linha que o histórico ou em linha separada.
    """
    datas_junto_historico = 0
    datas_isoladas = 0

    for page in paginas_pdfplumber[:3]:
        palavras = page.extract_words()
        linhas = _agrupar_por_y(palavras)
        for linha in linhas:
            textos = [w["text"] for w in linha]
            tem_data = any(_eh_data(t) for t in textos)
            tem_historico = any(
                not _eh_data(t) and not _eh_valor(t)
                for t in textos
            )
            if tem_data and tem_historico:
                datas_junto_historico += 1
            elif tem_data and not tem_historico:
                datas_isoladas += 1

    return "data_superior" if datas_junto_historico >= datas_isoladas else "data_inferior"


# ── Parser principal ──────────────────────────────────────────────────────────

class ParserBradesco:
    def __init__(self, caminho_pdf: str):
        self.caminho = caminho_pdf
        self._pdf = None
        self.layout = None
        self.colunas = {}
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

    def _extrair_cabecalho(self, texto_pagina: str):
        """Extrai nome, agência, conta e período do texto completo da página."""
        if not self.cliente:
            m = re.search(r"Nome:\s+([A-ZÁÀÂÃÉÊÍÓÔÕÚÇa-záàâãéêíóôõúç\s]+?)(?:\s{2,}|Extrato|Folha|Agência)", texto_pagina)
            if m:
                self.cliente = m.group(1).strip()

        if not self.agencia:
            m = re.search(r"Ag[eê]ncia:\s*(\d+)", texto_pagina)
            if m:
                self.agencia = m.group(1)

        if not self.conta:
            m = re.search(r"Conta:\s*([\d\-]+)", texto_pagina)
            if m:
                self.conta = m.group(1)

        if not self.periodo:
            m = re.search(r"entre:\s*([\d/]+)\s+e\s+([\d/]+)", texto_pagina)
            if m:
                self.periodo = f"{m.group(1)} a {m.group(2)}"

    def _parse_data_superior(self, page, num_pagina: int):
        """
        Layout DATA SUPERIOR:
        [data]  [historico...]  [docto]  [credito]  [debito]  [saldo]
        tudo na mesma linha.
        """
        palavras = page.extract_words(keep_blank_chars=False)
        linhas = _agrupar_por_y(palavras)

        lancamento_atual = None

        for linha in linhas:
            textos = [w["text"] for w in linha]
            texto_completo = " ".join(textos)

            # Pular linhas de cabeçalho/rodapé
            if any(k in texto_completo.lower() for k in [
                "débito", "crédito", "saldo", "histórico", "data", "docto",
                "bradesco", "folha", "total", "extrato", "agência"
            ]):
                continue

            primeira = textos[0] if textos else ""

            # Linha começa com data → novo lançamento
            if _eh_data(primeira):
                if lancamento_atual:
                    self.lancamentos.append(lancamento_atual)

                lancamento_atual = Lancamento(data=primeira, pagina=num_pagina)
                resto = linha[1:]

                # Separar histórico, docto e valores
                hist_tokens = []
                for w in resto:
                    col = _coluna_da_palavra(w, self.colunas)
                    if _eh_valor(w["text"]):
                        v = _parse_valor(w["text"])
                        if col == "debito":
                            lancamento_atual.debito = v
                        elif col == "credito":
                            lancamento_atual.credito = v
                        elif col == "saldo":
                            lancamento_atual.saldo = v
                        elif col == "docto":
                            lancamento_atual.docto = w["text"]
                        else:
                            # Valor sem coluna detectada: inferir pela posição
                            if "debito_x" in self.colunas and w["x0"] >= self.colunas.get("debito_x", 9999) - 20:
                                if lancamento_atual.debito is None:
                                    lancamento_atual.debito = v
                            else:
                                hist_tokens.append(w["text"])
                    else:
                        hist_tokens.append(w["text"])

                lancamento_atual.historico = " ".join(hist_tokens).strip()

            elif lancamento_atual:
                # Linha de continuação do histórico
                for w in linha:
                    if _eh_valor(w["text"]):
                        v = _parse_valor(w["text"])
                        col = _coluna_da_palavra(w, self.colunas)
                        if col == "debito" and lancamento_atual.debito is None:
                            lancamento_atual.debito = v
                        elif col == "credito" and lancamento_atual.credito is None:
                            lancamento_atual.credito = v
                        elif col == "saldo" and lancamento_atual.saldo is None:
                            lancamento_atual.saldo = v
                    else:
                        if not _eh_data(w["text"]):
                            lancamento_atual.historico = (lancamento_atual.historico + " " + w["text"]).strip()

        if lancamento_atual:
            self.lancamentos.append(lancamento_atual)

    def _parse_data_inferior(self, page, num_pagina: int):
        """
        Layout DATA INFERIOR:
        [historico...]  [docto]  [credito]  [debito]
        [data]                                         [saldo]
        A data aparece na linha abaixo do histórico, geralmente à esquerda.
        """
        palavras = page.extract_words(keep_blank_chars=False)
        linhas = _agrupar_por_y(palavras)

        lancamento_pendente = None  # acumula histórico+valores sem data ainda

        for linha in linhas:
            textos = [w["text"] for w in linha]
            texto_completo = " ".join(textos)

            # Pular cabeçalhos
            if any(k in texto_completo.lower() for k in [
                "débito", "crédito", "saldo", "histórico", "data", "docto",
                "bradesco", "folha", "total", "extrato", "agência"
            ]):
                continue

            primeira = textos[0] if textos else ""

            # Linha começa com data → fecha o lançamento pendente
            if _eh_data(primeira) and lancamento_pendente:
                lancamento_pendente.data = primeira
                # Pode ter saldo na mesma linha da data
                for w in linha[1:]:
                    if _eh_valor(w["text"]):
                        col = _coluna_da_palavra(w, self.colunas)
                        if col == "saldo" and lancamento_pendente.saldo is None:
                            lancamento_pendente.saldo = _parse_valor(w["text"])
                self.lancamentos.append(lancamento_pendente)
                lancamento_pendente = None

            else:
                # Linha de histórico+valores (sem data no início)
                tem_valor = any(_eh_valor(t) for t in textos)
                tem_historico = any(not _eh_valor(t) and not _eh_data(t) for t in textos)

                if tem_historico or tem_valor:
                    if lancamento_pendente:
                        # Continuação de um bloco (pouco provável, mas cobre edge case)
                        self.lancamentos.append(lancamento_pendente)

                    lancamento_pendente = Lancamento(pagina=num_pagina)
                    hist_tokens = []
                    for w in linha:
                        if _eh_valor(w["text"]):
                            v = _parse_valor(w["text"])
                            col = _coluna_da_palavra(w, self.colunas)
                            if col == "debito":
                                lancamento_pendente.debito = v
                            elif col == "credito":
                                lancamento_pendente.credito = v
                            elif col == "saldo":
                                lancamento_pendente.saldo = v
                            elif col == "docto":
                                lancamento_pendente.docto = w["text"]
                        else:
                            hist_tokens.append(w["text"])
                    lancamento_pendente.historico = " ".join(hist_tokens).strip()

        # Descarta lançamento sem data (final de página sem resolução)
        if lancamento_pendente and lancamento_pendente.data:
            self.lancamentos.append(lancamento_pendente)

    def processar(self, on_progress=None) -> list[dict]:
        """
        Processa o PDF completo.
        on_progress: callable(pagina_atual, total_paginas) opcional.
        Retorna lista de dicts com os lançamentos.
        """
        self._abrir()
        try:
            paginas = self._pdf.pages
            total = len(paginas)

            # Detectar colunas e layout nas primeiras páginas
            self.colunas = _detectar_colunas(paginas)
            self.layout = _detectar_layout(paginas, self.colunas)

            # Processar página a página
            for i, page in enumerate(paginas):
                if on_progress:
                    on_progress(i + 1, total)

                texto_pagina = page.extract_text() or ""
                self._extrair_cabecalho(texto_pagina)

                if self.layout == "data_superior":
                    self._parse_data_superior(page, i + 1)
                else:
                    self._parse_data_inferior(page, i + 1)

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
            "layout": self.layout or "—",
            "total_lancamentos": len(self.lancamentos),
        }


# ── Teste rápido ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    import json

    if len(sys.argv) < 2:
        print("Uso: python parser_bradesco.py <extrato.pdf>")
        sys.exit(1)

    pdf_path = sys.argv[1]
    parser = ParserBradesco(pdf_path)

    def progresso(atual, total):
        print(f"  Página {atual}/{total}...", end="\r")

    print(f"Processando: {pdf_path}")
    lancamentos = parser.processar(on_progress=progresso)
    print()  # nova linha após progresso

    meta = parser.meta
    print(f"\nCliente  : {meta['cliente']}")
    print(f"Agência  : {meta['agencia']}")
    print(f"Conta    : {meta['conta']}")
    print(f"Período  : {meta['periodo']}")
    print(f"Layout   : {meta['layout']}")
    print(f"Lançamentos encontrados: {meta['total_lancamentos']}")

    if lancamentos:
        print("\nPrimeiros 10 lançamentos:")
        for l in lancamentos[:10]:
            debito = f"R$ {l['debito']:.2f}" if l['debito'] else "—"
            print(f"  {l['data']}  {l['historico'][:50]:<50}  {debito}")
