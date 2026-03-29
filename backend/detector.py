"""
Detector — LEX FINDER
Detecta se um PDF é digital (texto selecionável) ou escaneado (imagem).
Usa PyMuPDF (fitz) para verificar se há texto extraível nas páginas.
"""

import fitz  # PyMuPDF


THRESHOLD_CHARS_POR_PAGINA = 100  # mínimo de chars para considerar "digital"


def detectar_tipo(caminho_pdf: str) -> str:
    """
    Retorna "digital" ou "escaneado".
    Abre o PDF e verifica se há texto extraível em pelo menos metade das páginas.
    """
    doc = fitz.open(caminho_pdf)
    total_paginas = len(doc)
    if total_paginas == 0:
        return "escaneado"

    paginas_com_texto = 0
    for page in doc:
        texto = page.get_text("text")
        if len(texto.strip()) >= THRESHOLD_CHARS_POR_PAGINA:
            paginas_com_texto += 1

    doc.close()

    # Se pelo menos 50% das páginas têm texto → digital
    if paginas_com_texto / total_paginas >= 0.5:
        return "digital"
    return "escaneado"


def paginas_por_tipo(caminho_pdf: str) -> dict:
    """
    Retorna quais páginas são digitais e quais são escaneadas.
    Útil para PDFs mistos.
    Retorna: {"digital": [0, 1, ...], "escaneado": [2, 3, ...]}
    """
    doc = fitz.open(caminho_pdf)
    resultado = {"digital": [], "escaneado": []}
    for i, page in enumerate(doc):
        texto = page.get_text("text")
        if len(texto.strip()) >= THRESHOLD_CHARS_POR_PAGINA:
            resultado["digital"].append(i)
        else:
            resultado["escaneado"].append(i)
    doc.close()
    return resultado


# ── Teste rápido ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Uso: python detector.py <arquivo.pdf>")
        sys.exit(1)
    caminho = sys.argv[1]
    tipo = detectar_tipo(caminho)
    print(f"Tipo detectado: {tipo}")
    detalhes = paginas_por_tipo(caminho)
    print(f"  Digitais: páginas {detalhes['digital']}")
    print(f"  Escaneadas: páginas {detalhes['escaneado']}")
