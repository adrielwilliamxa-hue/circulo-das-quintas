// Conferência automática da tela e do som (Playwright, navegador invisível).
// Uso: node ferramentas/conferir.mjs [segundos de loop]   (padrão: 300 = 5 minutos)
// Usa a porta de teste 5181 e o arquivo de progresso de teste — nunca a porta 5180 nem o vault.
import { chromium } from 'playwright';
import { spawn, execFileSync } from 'node:child_process';
import { mkdirSync, renameSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DURACAO = Number(process.argv[2] ?? 300);
const PORTA = 5181;
const URL_DO_APP = `http://127.0.0.1:${PORTA}/?teste=1`;
const carimbo = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const SAIDA = path.join(RAIZ, 'teste-local', 'conferencia', carimbo);
mkdirSync(path.join(SAIDA, 'fotos'), { recursive: true });

const log = (...msg) => console.log(`[${new Date().toLocaleTimeString('pt-BR')}]`, ...msg);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

const servidor = spawn(process.execPath, ['servidor/servidor.mjs', '--porta', String(PORTA), '--progresso', 'teste-local/Progresso-teste.md'], {
  cwd: RAIZ,
  stdio: 'ignore',
});

try {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${PORTA}/`)).ok) break;
    } catch {
      /* ainda subindo */
    }
    await espera(200);
  }

  const navegador = await chromium.launch({ headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const contexto = await navegador.newContext({
    viewport: { width: 1280, height: 1000 },
    recordVideo: { dir: SAIDA, size: { width: 1280, height: 1000 } },
  });
  const pagina = await contexto.newPage();
  const errosDoConsole = [];
  pagina.on('console', (m) => m.type() === 'error' && errosDoConsole.push(m.text()));
  pagina.on('pageerror', (e) => errosDoConsole.push(`pageerror: ${e.message}`));

  await pagina.goto(URL_DO_APP);
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '01-estudo-inicio.png'), fullPage: true });

  log('Selecionando o G (liga o som e começa a baixar o piano)…');
  await pagina.getByRole('button', { name: 'Selecionar G maior, grau V' }).click();
  let estadoDoPiano = 'pronto';
  for (let i = 0; i < 60; i++) {
    const texto = await pagina.locator('header').innerText();
    if (texto.includes('não carregou')) {
      estadoDoPiano = 'sintetizado';
      break;
    }
    if (!texto.includes('Carregando o piano')) break;
    await espera(500);
    if (i === 59) estadoDoPiano = 'ainda carregando após 30 s';
  }
  log('Piano:', estadoDoPiano);
  await pagina.locator('select').filter({ hasText: 'Só notas do acorde' }).selectOption('tudo');
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '02-estudo-G-tudo.png'), fullPage: true });

  await pagina.getByRole('tab', { name: 'Prática' }).click();
  await pagina.evaluate(() => {
    const { contexto, ganho } = window.__circuloSom;
    const destino = contexto.createMediaStreamDestination();
    ganho.connect(destino);
    const gravador = new MediaRecorder(destino.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 192000 });
    window.__pedacos = [];
    gravador.ondataavailable = (e) => window.__pedacos.push(e.data);
    gravador.start(1000);
    window.__gravador = gravador;
  });
  log(`Ligando o loop e gravando ${DURACAO} s de som…`);
  await pagina.getByRole('button', { name: 'Tocar o loop' }).click();

  const amostras = [];
  for (let s = 1; s <= DURACAO; s++) {
    await espera(1000);
    if (s <= 8) await pagina.screenshot({ path: path.join(SAIDA, 'fotos', `03-pratica-${String(s).padStart(2, '0')}s.png`) });
    if (s % 30 === 0) {
      const faixa = await pagina.locator('[aria-label="Faixa do loop"]').innerText();
      amostras.push({ segundo: s, faixa: faixa.split('\n').slice(3, 7).join(' | ') });
      log(`${s} s:`, amostras.at(-1).faixa);
    }
  }

  await pagina.getByRole('button', { name: 'Pausar o loop' }).click();
  const audioBase64 = await pagina.evaluate(
    () =>
      new Promise((resolve) => {
        window.__gravador.onstop = async () => {
          const blob = new Blob(window.__pedacos, { type: 'audio/webm' });
          const bytes = new Uint8Array(await blob.arrayBuffer());
          let binario = '';
          for (let i = 0; i < bytes.length; i += 0x8000) binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          resolve(btoa(binario));
        };
        window.__gravador.stop();
      }),
  );
  writeFileSync(path.join(SAIDA, 'audio.webm'), Buffer.from(audioBase64, 'base64'));

  // Fotos das correções do revisor: grafia da janela em Fá♯ maior e o B° sem "Só a quinta".
  await pagina.getByRole('tab', { name: 'Estudo' }).click();
  const seletorDeTom = pagina.locator('select').filter({ hasText: 'Dó maior' }).first();
  await seletorDeTom.selectOption('F#|maior');
  await espera(700); // deixa a janela terminar de girar
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '06-fa-sustenido-maior.png') });
  await seletorDeTom.selectOption('C|maior');
  await espera(700);
  await pagina.getByRole('button', { name: 'Selecionar B diminuta, grau vii°' }).click();
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '07-b-diminuto.png'), fullPage: true });

  await pagina.getByRole('tab', { name: 'Testes' }).click();
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '04-testes.png'), fullPage: true });
  await pagina.getByRole('button', { name: /Fazer teste/ }).nth(3).click();
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '08-pergunta-teclado.png'), fullPage: true });
  await pagina.getByRole('button', { name: 'Voltar ao mapa' }).first().click();
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await pagina.getByRole('tab', { name: 'Estudo' }).click();
  await pagina.evaluate(() => (document.documentElement.style.filter = 'grayscale(1)'));
  await pagina.screenshot({ path: path.join(SAIDA, 'fotos', '05-estudo-cinza.png'), fullPage: true });

  await contexto.close();
  await navegador.close();
  const video = readdirSync(SAIDA).find((f) => f.endsWith('.webm') && f !== 'audio.webm');
  if (video) renameSync(path.join(SAIDA, video), path.join(SAIDA, 'video.webm'));

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(SAIDA, 'audio.webm'), '-ac', '1', '-ar', '22050', path.join(SAIDA, 'audio.wav')]);
  mkdirSync(path.join(SAIDA, 'quadros'), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '20', '-t', '6', '-i', path.join(SAIDA, 'video.webm'), '-vf', 'fps=2', path.join(SAIDA, 'quadros', 'q_%02d.png')]);

  writeFileSync(
    path.join(SAIDA, 'meta.json'),
    JSON.stringify(
      {
        duracao: DURACAO,
        bpm: 70,
        progressao: 'Pop (I–V–vi–IV) em Dó maior',
        // Baixo + mão direita de cada compasso (vozes da 2ª volta, conferidas nos testes do cérebro).
        esperado: [
          { acorde: 'C', midis: [48, 64, 67, 72] },
          { acorde: 'G', midis: [55, 62, 67, 71] },
          { acorde: 'Am', midis: [57, 64, 69, 72] },
          { acorde: 'F', midis: [53, 65, 69, 72] },
        ],
        estadoDoPiano,
        amostrasDaFaixa: amostras,
        errosDoConsole,
      },
      null,
      2,
    ),
  );
  log('Pronto. Saída em', SAIDA);
} finally {
  servidor.kill();
}
