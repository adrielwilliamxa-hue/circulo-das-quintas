"""Ouve a gravação da conferência: ritmo (batidas do metrônomo) e acordes (notas presentes em cada compasso).

Uso: ferramentas/.venv-audio/Scripts/python.exe ferramentas/analisar_audio.py <pasta da conferência>
"""
import json
import sys
from pathlib import Path

import librosa
import numpy as np

NOMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


def main(pasta: Path) -> None:
    meta = json.loads((pasta / "meta.json").read_text(encoding="utf-8"))
    batida = 60 / meta["bpm"]
    compasso = 4 * batida
    sinal, taxa = librosa.load(pasta / "audio.wav", sr=22050, mono=True)
    duracao = len(sinal) / taxa

    # 1) Ritmo: ataques (piano + metrônomo) e uma grade de batidas a partir do 1º ataque.
    ataques = librosa.onset.onset_detect(y=sinal, sr=taxa, units="time", backtrack=False)
    inicio = float(ataques[0])
    total_batidas = int((duracao - inicio) // batida)
    desvios, faltando = [], 0
    for k in range(total_batidas):
        ideal = inicio + k * batida
        perto = ataques[np.abs(ataques - ideal) < 0.12]
        if len(perto) == 0:
            faltando += 1
        else:
            desvios.append(float(perto[np.argmin(np.abs(perto - ideal))] - ideal))
    desvios = np.array(desvios) * 1000
    metade = len(desvios) // 2
    deriva = float(np.mean(desvios[metade:]) - np.mean(desvios[:metade])) if metade else 0.0

    # 2) Acordes: cromagrama médio de cada compasso, ignorando os 80 ms do ataque.
    croma = librosa.feature.chroma_cqt(y=sinal, sr=taxa, hop_length=512)
    tempos = librosa.frames_to_time(np.arange(croma.shape[1]), sr=taxa, hop_length=512)
    acertos, total, erros = 0, 0, []
    for m in range(int((duracao - inicio) // compasso)):
        a = inicio + m * compasso + 0.08
        b = inicio + (m + 1) * compasso - 0.1
        janela = croma[:, (tempos >= a) & (tempos < b)]
        if janela.shape[1] == 0:
            continue
        media = janela.mean(axis=1)
        top3 = set(int(i) for i in np.argsort(media)[-3:])
        esperado = meta["esperado"][m % len(meta["esperado"])]
        classes = set(n % 12 for n in esperado["midis"])
        total += 1
        if top3 == classes:
            acertos += 1
        elif len(erros) < 8:
            erros.append(f"compasso {m + 1} ({esperado['acorde']}): ouvi {sorted(NOMES[i] for i in top3)}")

    # 3) Silêncios: compassos quase mudos.
    rms = librosa.feature.rms(y=sinal)[0]
    tempos_rms = librosa.frames_to_time(np.arange(len(rms)), sr=taxa)
    mudos = []
    for m in range(int((duracao - inicio) // compasso)):
        a, b = inicio + m * compasso, inicio + (m + 1) * compasso
        if rms[(tempos_rms >= a) & (tempos_rms < b)].mean() < 0.005:
            mudos.append(m + 1)

    resultado = {
        "duracao_gravada_s": round(duracao, 1),
        "primeiro_ataque_s": round(inicio, 2),
        "batidas_esperadas": total_batidas,
        "batidas_sem_ataque": faltando,
        "desvio_medio_ms": round(float(np.mean(np.abs(desvios))), 1) if len(desvios) else None,
        "desvio_maximo_ms": round(float(np.max(np.abs(desvios))), 1) if len(desvios) else None,
        "deriva_entre_metades_ms": round(deriva, 1),
        "compassos_analisados": total,
        "compassos_com_acorde_certo": acertos,
        "exemplos_de_acorde_diferente": erros,
        "compassos_mudos": mudos,
    }
    (pasta / "analise-audio.json").write_text(json.dumps(resultado, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(resultado, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main(Path(sys.argv[1]))
