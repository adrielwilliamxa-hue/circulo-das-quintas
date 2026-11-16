"""Ouvido absoluto: transcreve as notas dos primeiros compassos com o Basic Pitch e compara com o esperado.

Uso: ferramentas/.venv-basicpitch/Scripts/python.exe ferramentas/transcrever_notas.py <pasta da conferência> [inicio_s]
"""
import json
import sys
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

from basic_pitch import ICASSP_2022_MODEL_PATH  # noqa: E402
from basic_pitch.inference import predict  # noqa: E402

LIMITE_DO_METRONOMO = 78  # cliques do metrônomo são G5 (79) e C6 (84)


def main(pasta: Path, inicio: float) -> None:
    meta = json.loads((pasta / "meta.json").read_text(encoding="utf-8"))
    compasso = 4 * 60 / meta["bpm"]
    _, _, notas = predict(str(pasta / "audio.wav"), ICASSP_2022_MODEL_PATH)
    linhas, certos, total = [], 0, 0
    for m in range(8):
        a = inicio + m * compasso
        tocadas = sorted({int(n[2]) for n in notas if a - 0.15 <= n[0] < a + 0.35 and n[2] < LIMITE_DO_METRONOMO})
        esperado = meta["esperado"][m % len(meta["esperado"])]
        ok = set(esperado["midis"]) <= set(tocadas)
        certos += ok
        total += 1
        linhas.append({"compasso": m + 1, "acorde": esperado["acorde"], "esperado": esperado["midis"], "ouvido": tocadas, "ok": ok})
    resultado = {"compassos": total, "com_todas_as_notas_esperadas": certos, "detalhe": linhas}
    (pasta / "transcricao.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(resultado, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]), float(sys.argv[2]) if len(sys.argv) > 2 else 0.0)
