"""
OCR Pipeline — LEX FINDER
Processa PDFs escaneados usando Tesseract + OpenCV.
Converte cada página em imagem e extrai texto via OCR.

Dependências: pytesseract, opencv-python, pdf2image, Pillow
Tesseract deve estar instalado no sistema:
  Windows: https://github.com/UB-Mannheim/tesseract/wiki
  Linux: sudo apt install tesseract-ocr tesseract-ocr-por
"""

import re
import tempfile
from pathlib import Path
from dataclasses import dataclass, asdict

# Imports opcionais — não falham na inicialização
try:
    import pytesseract
    import cv2
    import numpy as np
    from pdf2image import convert_from_path
    from PIL import Image
    OCR_DISPONIVEL = True
except ImportError:
    OCR_DISPONIVEL = False

from parser_bradesco import (
    Lancamento,
    _eh_data,
    _eh_valor,
    _parse_valor,
    DATE_RE,
    VALUE_RE,
)

# ── Configurações OCR ──────────────────────────────────────────────────────────

# Caminho do executável do Tesseract no Windows
# Altere se instalou em local diferente
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# DPI para renderizar as páginas do PDF como imagem
PDF_DPI = 300

# Config Tesseract: PSM 6 = bloco de texto uniforme; lang = por (português)
TESSERACT_CONFIG = "--psm 6 -l por"


# ── Pré-processamento de imagem ───────────────────────────────────────────────

def _preprocessar_imagem(pil_img) -> "np.ndarray":
    """
    Converte PIL Image para array OpenCV e aplica filtros para melhorar OCR:
    - Escala de cinza
    - Binarização adaptativa (Otsu)
    - Leve denoising
    """
    img = np.array(pil_img)

    # Converter para cinza
    if len(img.shape) == 3:
        cinza = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
    else:
        cinza = img

    # Denoising leve
    denoised = cv2.fastNlMeansDenoising(cinza, h=10)

    # Binarização Otsu
    _, binaria = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    return binaria


def _imagem_para_texto(pil_img) -> str:
    """Aplica OCR em uma imagem PIL e retorna o texto bruto."""
    if not OCR_DISPONIVEL:
        raise RuntimeError(
            "Dependências OCR não instaladas. Execute:\n"
            "  pip install pytesseract opencv-python pdf2image Pillow\n"
            "E instale o Tesseract: https://github.com/UB-Mannheim/tesseract/wiki"
        )

    # Configurar caminho do Tesseract no Windows
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

    img_processada = _preprocessar_imagem(pil_img)
    pil_processada = Image.fromarray(img_processada)

    texto = pytesseract.image_to_string(pil_processada, config=TESSERACT_CONFIG)
    return texto


# ── Parser de texto OCR ───────────────────────────────────────────────────────

def _parse_texto_ocr(texto: str, num_pagina: int, banco: str = "desconhecido") -> list[Lancamento]:
    """
    Recebe texto bruto do OCR e extrai lançamentos.
    Estratégia: linha por linha, detecta data no início.
    """
    lancamentos = []
    lancamento_atual = None

    for linha_bruta in texto.splitlines():
        linha = linha_bruta.strip()
        if not linha:
            continue

        tokens = linha.split()
        if not tokens:
            continue

        primeiro = tokens[0]

        # Corrigir erros comuns do OCR em datas (0 vs O, 1 vs I)
        primeiro_corrigido = re.sub(r"[OoIl]", lambda m: "0" if m.group() in "Oo" else "1", primeiro)
        # Verificar se parece data após correção
        if DATE_RE.match(primeiro_corrigido):
            if lancamento_atual:
                lancamentos.append(lancamento_atual)

            lancamento_atual = Lancamento(
                data=primeiro_corrigido,
                pagina=num_pagina,
                banco=banco,
            )

            hist_tokens = []
            valores = []
            for t in tokens[1:]:
                t_clean = t.replace(" ", "")
                if VALUE_RE.match(t_clean):
                    valores.append(_parse_valor(t_clean))
                else:
                    hist_tokens.append(t)

            lancamento_atual.historico = " ".join(hist_tokens).strip()

            if len(valores) >= 2:
                lancamento_atual.debito = valores[-2]
                lancamento_atual.saldo = valores[-1]
            elif len(valores) == 1:
                lancamento_atual.saldo = valores[0]

        elif lancamento_atual:
            # Linha de continuação
            for t in tokens:
                t_clean = t.replace(" ", "")
                if VALUE_RE.match(t_clean) and lancamento_atual.saldo is None:
                    lancamento_atual.saldo = _parse_valor(t_clean)
                else:
                    lancamento_atual.historico = (
                        lancamento_atual.historico + " " + t
                    ).strip()

    if lancamento_atual:
        lancamentos.append(lancamento_atual)

    return lancamentos


# ── Pipeline principal ────────────────────────────────────────────────────────

class OCRPipeline:
    """
    Processa um PDF escaneado página a página:
    1. Renderiza cada página como imagem (DPI 300)
    2. Pré-processa com OpenCV
    3. Extrai texto com Tesseract
    4. Parseia o texto para lançamentos
    """

    def __init__(self, caminho_pdf: str, banco: str = "desconhecido"):
        self.caminho = caminho_pdf
        self.banco = banco
        self.lancamentos: list[Lancamento] = []

    def processar(self, on_progress=None) -> list[dict]:
        if not OCR_DISPONIVEL:
            raise RuntimeError(
                "Dependências OCR não instaladas.\n"
                "Execute: pip install pytesseract opencv-python pdf2image Pillow\n"
                "Instale Tesseract: https://github.com/UB-Mannheim/tesseract/wiki"
            )

        # Converter PDF para imagens
        imagens = convert_from_path(self.caminho, dpi=PDF_DPI)
        total = len(imagens)

        for i, img in enumerate(imagens):
            if on_progress:
                on_progress(i + 1, total)

            texto = _imagem_para_texto(img)
            lancamentos_pagina = _parse_texto_ocr(texto, i + 1, self.banco)
            self.lancamentos.extend(lancamentos_pagina)

        return [asdict(l) for l in self.lancamentos]

    @property
    def meta(self) -> dict:
        return {
            "total_lancamentos": len(self.lancamentos),
            "pipeline": "ocr",
            "banco": self.banco,
        }


def verificar_dependencias() -> dict:
    """Verifica se todas as dependências OCR estão disponíveis."""
    status = {
        "pytesseract": False,
        "opencv": False,
        "pdf2image": False,
        "tesseract_exec": False,
    }

    try:
        import pytesseract
        status["pytesseract"] = True
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
        pytesseract.get_tesseract_version()
        status["tesseract_exec"] = True
    except Exception:
        pass

    try:
        import cv2
        status["opencv"] = True
    except ImportError:
        pass

    try:
        from pdf2image import convert_from_path
        status["pdf2image"] = True
    except ImportError:
        pass

    return status


# ── Teste rápido ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    deps = verificar_dependencias()
    print("Dependências OCR:")
    for dep, ok in deps.items():
        print(f"  {'✓' if ok else '✗'} {dep}")

    if not all(deps.values()):
        print("\nFaltam dependências. Instale com:")
        print("  pip install pytesseract opencv-python pdf2image Pillow")
        print("  + Tesseract: https://github.com/UB-Mannheim/tesseract/wiki")
        sys.exit(1)

    if len(sys.argv) < 2:
        print("\nUso: python ocr_pipeline.py <extrato_escaneado.pdf>")
        sys.exit(0)

    pipeline = OCRPipeline(sys.argv[1])
    lancamentos = pipeline.processar(
        on_progress=lambda a, t: print(f"  OCR página {a}/{t}...", end="\r")
    )
    print(f"\nTotal lançamentos extraídos via OCR: {len(lancamentos)}")
    for l in lancamentos[:5]:
        print(f"  {l['data']}  {l['historico'][:60]}")
