# Ferramentas de conferência (ver e ouvir o app)

Servem para conferir a tela e o som sem depender de alguém olhando ou ouvindo. Usam sempre a **porta de teste 5181** e o **arquivo de progresso de teste** (`teste-local/Progresso-teste.md`), nunca o app real nem o vault.

1. **Gravar** (Playwright, navegador invisível): `npm run build` e depois `node ferramentas/conferir.mjs 300`
   - o número é quantos segundos de loop gravar (300 = 5 minutos);
   - a saída vai para `teste-local/conferencia/<data-hora>/`: fotos das abas, `video.webm`, quadros do vídeo, `audio.webm`/`audio.wav` e `meta.json`.
2. **Ouvir acordes e ritmo** (librosa): `ferramentas/.venv-audio/Scripts/python.exe ferramentas/analisar_audio.py <pasta>`
   - confere batidas do metrônomo (faltando, desvio, atraso ao longo do tempo), o acorde de cada compasso e compassos mudos.
3. **Ouvir nota por nota** (Basic Pitch, modelo ONNX): `ferramentas/.venv-basicpitch/Scripts/python.exe ferramentas/transcrever_notas.py <pasta> <primeiro_ataque_s>`
   - transcreve os 8 primeiros compassos e compara com o baixo + mão direita esperados.

O modo teste do app (`?teste` na URL) só existe para a gravação do som; sem ele, o app funciona normalmente.

**Ambientes Python** (fora do git): `.venv-audio` (Python 3.14, librosa, pip-audit, uv) e `.venv-basicpitch` (Python 3.11, Basic Pitch sem TensorFlow, numpy 1.x). Segurança conferida em 24/10/2026: `npm audit` = 0 vulnerabilidades; `pip-audit` nos dois ambientes = nenhuma vulnerabilidade conhecida (TensorFlow e keras removidos; protobuf, resampy e setuptools atualizados).
