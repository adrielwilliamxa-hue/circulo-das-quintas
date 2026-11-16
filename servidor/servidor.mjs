// Servidor local do Círculo das Quintas: entrega o app pronto (dist/) e grava o progresso no vault.
// Escuta só em 127.0.0.1. Fechar a janela do atalho desliga o servidor.
import http from 'node:http';
import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIMITE_DO_CORPO = 5 * 1024 * 1024;

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

/** Versão do conteúdo do arquivo (ETag): muda sempre que o texto muda. */
function versaoDe(texto) {
  return `"${createHash('sha1').update(texto).digest('hex').slice(0, 20)}"`;
}

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    const partes = [];
    let tamanho = 0;
    req.on('data', (parte) => {
      tamanho += parte.length;
      if (tamanho > LIMITE_DO_CORPO) reject(new Error('corpo grande demais'));
      else partes.push(parte);
    });
    req.on('end', () => resolve(Buffer.concat(partes).toString('utf8')));
    req.on('error', reject);
  });
}

async function lerSeExistir(arquivo) {
  try {
    return await readFile(arquivo, 'utf8');
  } catch (erro) {
    if (erro.code === 'ENOENT') return null;
    throw erro;
  }
}

/**
 * Cria o servidor. `pastaDoApp` = dist/ pronto; `arquivo` = Markdown de progresso no vault.
 * As gravações passam por uma fila: uma de cada vez, cada uma com seu próprio arquivo temporário.
 */
export function criarServidor({ pastaDoApp, arquivo }) {
  let fila = Promise.resolve();
  let contador = 0;

  async function gravar(req, res) {
    if (!existsSync(path.dirname(arquivo))) return res.writeHead(503).end('A pasta do progresso não está acessível agora.');
    const texto = await lerCorpo(req);
    const atual = await lerSeExistir(arquivo);
    const seNaoExistir = req.headers['if-none-match'] === '*';
    const seVersao = req.headers['if-match'];
    if ((seNaoExistir && atual !== null) || (seVersao && (atual === null || versaoDe(atual) !== seVersao))) {
      return res.writeHead(409).end('O arquivo mudou desde a leitura.');
    }
    const temporario = `${arquivo}.${process.pid}.${++contador}.tmp`;
    try {
      await writeFile(temporario, texto, 'utf8');
      await rename(temporario, arquivo);
    } catch (erro) {
      await unlink(temporario).catch(() => {});
      throw erro;
    }
    return res.writeHead(204, { ETag: versaoDe(texto) }).end();
  }

  async function api(req, res) {
    if (req.method === 'GET') {
      if (!existsSync(path.dirname(arquivo))) return res.writeHead(503).end('A pasta do progresso não está acessível agora.');
      const texto = await lerSeExistir(arquivo);
      if (texto === null) return res.writeHead(404).end();
      return res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8', ETag: versaoDe(texto), 'Cache-Control': 'no-store' }).end(texto);
    }
    if (req.method === 'PUT') {
      const vez = fila.then(() => gravar(req, res));
      fila = vez.catch(() => {});
      return vez;
    }
    return res.writeHead(405).end();
  }

  async function arquivoDoApp(req, res) {
    let caminho;
    try {
      caminho = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    } catch {
      return res.writeHead(400).end('Endereço inválido.');
    }
    const alvo = path.resolve(pastaDoApp, `.${caminho === '/' ? '/index.html' : caminho}`);
    if (alvo !== pastaDoApp && !alvo.startsWith(pastaDoApp + path.sep)) return res.writeHead(403).end();
    try {
      const conteudo = await readFile(alvo);
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo)] ?? 'application/octet-stream' }).end(conteudo);
    } catch {
      res.writeHead(404).end('Não encontrado. Rode "npm run build" se o app ainda não foi preparado.');
    }
  }

  return http.createServer((req, res) => {
    const tratar = req.url?.startsWith('/api/progresso') ? api(req, res) : arquivoDoApp(req, res);
    tratar.catch(() => {
      if (!res.headersSent) res.writeHead(503);
      res.end();
    });
  });
}

async function principal() {
  const config = JSON.parse(await readFile(path.join(RAIZ, 'config.json'), 'utf8'));
  const args = process.argv.slice(2);
  const valor = (nome) => {
    const i = args.indexOf(nome);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const porta = Number(valor('--porta') ?? config.porta);
  const arquivo = path.resolve(RAIZ, valor('--progresso') ?? config.arquivoProgresso);
  const abrir = args.includes('--abrir');
  const abrirNavegador = () => exec(`start "" "http://127.0.0.1:${porta}"`);

  const servidor = criarServidor({ pastaDoApp: path.join(RAIZ, 'dist'), arquivo });
  servidor.on('error', (erro) => {
    if (erro.code === 'EADDRINUSE') {
      console.log('O app já está aberto. Abrindo o navegador nele.');
      if (abrir) abrirNavegador();
      process.exit(0);
    }
    throw erro;
  });
  servidor.listen(porta, '127.0.0.1', () => {
    console.log(`Círculo das Quintas aberto em http://127.0.0.1:${porta}`);
    console.log(`Progresso gravado em: ${arquivo}`);
    console.log('Feche esta janela para desligar o app.');
    if (abrir) abrirNavegador();
  });
}

// Só liga o servidor quando este arquivo é executado (não quando um teste o importa).
const executadoDireto = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === fileURLToPath(import.meta.url).toLowerCase();
if (executadoDireto) await principal();
