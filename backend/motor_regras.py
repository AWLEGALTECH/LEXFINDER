"""
Motor de Regras — LEX FINDER
Carrega rubricas.json e faz o match contra os históricos dos lançamentos.
Match: case-insensitive, sem acentos, substring.
"""

import json
import unicodedata
import re
from pathlib import Path

_RUBRICAS_PATH = Path(__file__).parent / "rubricas.json"


def _normalizar(texto: str) -> str:
    """Remove acentos, converte para maiúsculas, colapsa espaços."""
    if not texto:
        return ""
    # Remover acentos
    nfkd = unicodedata.normalize("NFKD", texto)
    sem_acento = "".join(c for c in nfkd if not unicodedata.combining(c))
    # Maiúsculas + colapsar espaços
    return re.sub(r"\s+", " ", sem_acento.upper()).strip()


class MotorRegras:
    def __init__(self, banco: str = "bradesco"):
        """
        banco: "bradesco" | "bb" | "itau" | "caixa" | "santander"
        """
        with open(_RUBRICAS_PATH, encoding="utf-8") as f:
            dados = json.load(f)

        banco_key = banco.lower().replace("banco do brasil", "bb")
        lista = dados.get(banco_key, [])

        # Deduplicar: normalizar rubricas e manter apenas entradas únicas
        vistas = set()
        self._rubricas = []
        for entry in lista:
            rubrica_norm = _normalizar(entry["rubrica"])
            if rubrica_norm and rubrica_norm not in vistas:
                vistas.add(rubrica_norm)
                self._rubricas.append({
                    "titulo": entry["titulo"],
                    "rubrica_original": entry["rubrica"],
                    "rubrica_norm": rubrica_norm,
                })

        self.banco = banco_key

    def match(self, historico: str) -> dict | None:
        """
        Retorna o primeiro match encontrado ou None.
        Resultado: {"titulo": str, "rubrica": str}
        """
        h_norm = _normalizar(historico)
        for entry in self._rubricas:
            if entry["rubrica_norm"] in h_norm:
                return {
                    "titulo": entry["titulo"],
                    "rubrica": entry["rubrica_original"],
                }
        return None

    def filtrar_transacoes(self, transacoes: list[dict]) -> list[dict]:
        """
        Recebe lista de transações e retorna apenas as que têm match.
        Cada transação deve ter: data, historico, valor (débito positivo).
        Adiciona 'titulo_desconto' e 'rubrica_matched' ao resultado.
        """
        resultado = []
        for t in transacoes:
            m = self.match(t.get("historico", ""))
            if m:
                resultado.append({
                    **t,
                    "titulo_desconto": m["titulo"],
                    "rubrica_matched": m["rubrica"],
                })
        return resultado

    def listar_rubricas(self) -> list[str]:
        """Lista todas as rubricas normalizadas carregadas."""
        return [r["rubrica_norm"] for r in self._rubricas]


# ── Teste rápido ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    motor = MotorRegras("bradesco")
    print(f"[motor_regras] {len(motor._rubricas)} rubricas carregadas para Bradesco")

    testes = [
        "TARIFA BANCARIA CESTA B.EXPRESSO4",
        "MORA CREDITO PESSOAL 9990026",
        "ENCARGOS LIMITE DE CRED ENCARGO - 07,73%",
        "BRADESCO VIDA E PREVIDENCIA S/A",
        "SAQUEterminal 0000001",
        "PIX RECEBIDO JOAO SILVA",          # não deve bater
        "COMPRA DEBITO MERCADO",             # não deve bater
    ]

    for h in testes:
        m = motor.match(h)
        status = f"✓ {m['titulo']} ({m['rubrica']})" if m else "✗ sem match"
        print(f"  [{status}] {h}")
