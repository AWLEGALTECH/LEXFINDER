"""
LEX FINDER — Orquestrador Principal
Nicolas Gomes Advocacia | RA TECNOLOGIA

Uso:
  python main.py <pasta_ou_pdf> [opcoes]

Exemplos:
  python main.py extratos/                          # Processa todos os PDFs na pasta
  python main.py extratos/jan2024.pdf               # Processa um PDF específico
  python main.py extratos/ --banco bradesco         # Força banco (padrão: auto)
  python main.py extratos/ --saida resultados/      # Pasta de saída customizada
  python main.py extratos/ --sem-pdf                # Apenas Excel, sem PDF consolidado
  python main.py extratos/ --banco bb --saida ./    # BB + saída na pasta atual
"""

import argparse
import sys
import time
from pathlib import Path
from datetime import datetime

# ── Imports dos módulos ────────────────────────────────────────────────────────

from detector import detectar_tipo
from motor_regras import MotorRegras
from gerador_output import gerar_excel, mesclar_pdfs

# Imports opcionais — falham graciosamente
try:
    from parser_bradesco import ParserBradesco
    BRADESCO_OK = True
except ImportError as e:
    BRADESCO_OK = False
    _BRADESCO_ERRO = str(e)

try:
    from parser_generico import criar_parser as criar_parser_generico
    GENERICO_OK = True
except ImportError:
    GENERICO_OK = False

try:
    from ocr_pipeline import OCRPipeline, verificar_dependencias as _verificar_ocr
    OCR_OK = True
except ImportError:
    OCR_OK = False


# ── Constantes ────────────────────────────────────────────────────────────────

BANCOS_SUPORTADOS = {"bradesco", "bb", "itau", "caixa", "santander"}
SAIDA_PADRAO = Path("output")
TIMESTAMP = datetime.now().strftime("%Y%m%d_%H%M%S")


# ── Utilitários ───────────────────────────────────────────────────────────────

def _log(msg: str, nivel: str = "INFO"):
    prefixos = {"INFO": "  ", "OK": "✓ ", "ERRO": "✗ ", "AVISO": "⚠ "}
    print(f"{prefixos.get(nivel, '  ')}{msg}")


def _coletar_pdfs(caminho: Path) -> list[Path]:
    """Coleta todos os PDFs no caminho (arquivo único ou pasta)."""
    if caminho.is_file() and caminho.suffix.lower() == ".pdf":
        return [caminho]
    elif caminho.is_dir():
        pdfs = sorted(caminho.glob("*.pdf")) + sorted(caminho.glob("**/*.pdf"))
        # Deduplicar mantendo ordem
        vistos = set()
        result = []
        for p in pdfs:
            if p not in vistos:
                vistos.add(p)
                result.append(p)
        return result
    return []


def _detectar_banco(nome_arquivo: str) -> str:
    """Tenta inferir o banco pelo nome do arquivo."""
    nome = nome_arquivo.lower()
    if "bradesco" in nome:
        return "bradesco"
    if "banco do brasil" in nome or "_bb_" in nome or "bb-" in nome:
        return "bb"
    if "itau" in nome or "itaú" in nome:
        return "itau"
    if "caixa" in nome or "cef" in nome:
        return "caixa"
    if "santander" in nome:
        return "santander"
    return "bradesco"  # default


# ── Processamento de PDF ──────────────────────────────────────────────────────

def processar_pdf(caminho_pdf: Path, banco: str, verbose: bool = False) -> tuple[list[dict], dict]:
    """
    Processa um PDF e retorna (lancamentos, meta).
    Detecta automaticamente se é digital ou escaneado.
    """
    tipo = detectar_tipo(str(caminho_pdf))

    if verbose:
        _log(f"{caminho_pdf.name} → tipo: {tipo}, banco: {banco}")

    if tipo == "digital":
        if banco == "bradesco" and BRADESCO_OK:
            parser = ParserBradesco(str(caminho_pdf))
        elif GENERICO_OK:
            parser = criar_parser_generico(banco, str(caminho_pdf))
        else:
            _log(f"Parser não disponível para {banco}", "ERRO")
            return [], {}

        def prog(atual, total):
            if verbose:
                print(f"    Página {atual}/{total}...", end="\r")

        lancamentos = parser.processar(on_progress=prog)
        if verbose:
            print()  # nova linha após progresso
        meta = parser.meta
        meta["banco"] = banco

    else:  # escaneado
        if not OCR_OK:
            _log(
                f"PDF escaneado detectado mas OCR não está disponível. "
                f"Instale: pip install pytesseract opencv-python pdf2image",
                "AVISO"
            )
            return [], {"banco": banco, "tipo": "escaneado", "total_lancamentos": 0}

        pipeline = OCRPipeline(str(caminho_pdf), banco=banco)

        def prog_ocr(atual, total):
            if verbose:
                print(f"    OCR página {atual}/{total}...", end="\r")

        lancamentos = pipeline.processar(on_progress=prog_ocr)
        if verbose:
            print()
        meta = pipeline.meta
        meta["banco"] = banco

    return lancamentos, meta


# ── Orquestrador principal ────────────────────────────────────────────────────

def processar_lote(
    caminho_entrada: Path,
    banco: str | None,
    pasta_saida: Path,
    gerar_pdf_consolidado: bool = True,
    verbose: bool = True,
) -> dict:
    """
    Processa um lote de PDFs e gera os artefatos finais.
    Retorna dict com estatísticas.
    """
    pdfs = _coletar_pdfs(caminho_entrada)

    if not pdfs:
        _log(f"Nenhum PDF encontrado em: {caminho_entrada}", "ERRO")
        return {}

    _log(f"PDFs encontrados: {len(pdfs)}")

    todos_lancamentos = []
    todos_filtrados = []
    meta_geral = {
        "cliente": "",
        "banco": banco or "auto",
        "periodo": "",
        "pdfs_processados": len(pdfs),
        "pdfs_com_erro": 0,
    }

    inicio = time.time()

    for i, pdf in enumerate(pdfs, 1):
        banco_pdf = banco or _detectar_banco(pdf.name)

        if verbose:
            _log(f"[{i}/{len(pdfs)}] {pdf.name}")

        try:
            lancamentos, meta = processar_pdf(pdf, banco_pdf, verbose=verbose)

            if not meta_geral["cliente"] and meta.get("cliente"):
                meta_geral["cliente"] = meta["cliente"]
            if not meta_geral["periodo"] and meta.get("periodo"):
                meta_geral["periodo"] = meta["periodo"]

            # Aplicar motor de regras
            motor = MotorRegras(banco_pdf)
            filtrados = motor.filtrar_transacoes(lancamentos)

            todos_lancamentos.extend(lancamentos)
            todos_filtrados.extend(filtrados)

            if verbose:
                _log(
                    f"   {len(lancamentos)} lançamentos, "
                    f"{len(filtrados)} descontos identificados",
                    "OK"
                )

        except Exception as e:
            _log(f"Erro ao processar {pdf.name}: {e}", "ERRO")
            meta_geral["pdfs_com_erro"] += 1

    # ── Gerar outputs ──
    pasta_saida.mkdir(parents=True, exist_ok=True)

    resultado = {
        **meta_geral,
        "total_lancamentos": len(todos_lancamentos),
        "total_descontos": len(todos_filtrados),
        "arquivos_gerados": [],
    }

    if todos_filtrados:
        nome_excel = f"descontos_{TIMESTAMP}.xlsx"
        caminho_excel = pasta_saida / nome_excel

        excel_path = gerar_excel(
            todos_filtrados,
            str(caminho_excel),
            meta_geral,
        )
        resultado["arquivos_gerados"].append(excel_path)
        _log(f"Excel gerado: {excel_path}", "OK")

    else:
        _log("Nenhum desconto identificado — Excel não gerado.", "AVISO")

    if gerar_pdf_consolidado and pdfs:
        nome_pdf = f"extratos_consolidados_{TIMESTAMP}.pdf"
        caminho_pdf_out = pasta_saida / nome_pdf
        try:
            pdf_path = mesclar_pdfs(
                [str(p) for p in pdfs],
                str(caminho_pdf_out),
                ordenar_por_nome=True,
            )
            resultado["arquivos_gerados"].append(pdf_path)
            _log(f"PDF consolidado: {pdf_path}", "OK")
        except Exception as e:
            _log(f"Não foi possível gerar PDF consolidado: {e}", "AVISO")

    elapsed = time.time() - inicio
    resultado["tempo_segundos"] = round(elapsed, 1)

    return resultado


# ── CLI ───────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="LEX FINDER — Extrator de Descontos Indevidos",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    parser.add_argument(
        "entrada",
        help="Pasta com PDFs ou arquivo PDF único",
    )
    parser.add_argument(
        "--banco",
        choices=list(BANCOS_SUPORTADOS),
        default=None,
        help="Banco (padrão: detectado automaticamente pelo nome do arquivo)",
    )
    parser.add_argument(
        "--saida",
        default=str(SAIDA_PADRAO),
        help=f"Pasta de saída (padrão: {SAIDA_PADRAO}/)",
    )
    parser.add_argument(
        "--sem-pdf",
        action="store_true",
        help="Não gerar PDF consolidado (apenas Excel)",
    )
    parser.add_argument(
        "--silencioso",
        action="store_true",
        help="Reduzir output no terminal",
    )

    args = parser.parse_args()

    entrada = Path(args.entrada)
    if not entrada.exists():
        _log(f"Caminho não encontrado: {entrada}", "ERRO")
        sys.exit(1)

    print()
    print("=" * 60)
    print("  LEX FINDER — Nicolas Gomes Advocacia")
    print("  RA TECNOLOGIA")
    print("=" * 60)
    print()

    resultado = processar_lote(
        caminho_entrada=entrada,
        banco=args.banco,
        pasta_saida=Path(args.saida),
        gerar_pdf_consolidado=not args.sem_pdf,
        verbose=not args.silencioso,
    )

    if resultado:
        print()
        print("─" * 60)
        print(f"  Total de lançamentos analisados : {resultado.get('total_lancamentos', 0)}")
        print(f"  Descontos identificados          : {resultado.get('total_descontos', 0)}")
        print(f"  PDFs com erro                    : {resultado.get('pdfs_com_erro', 0)}")
        print(f"  Tempo total                      : {resultado.get('tempo_segundos', 0)}s")
        print()
        arquivos = resultado.get("arquivos_gerados", [])
        if arquivos:
            print("  Arquivos gerados:")
            for arq in arquivos:
                print(f"    → {arq}")
        print("─" * 60)
        print()


if __name__ == "__main__":
    main()
