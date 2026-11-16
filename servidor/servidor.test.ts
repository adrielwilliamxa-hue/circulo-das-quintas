// @vitest-environment node
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
// @ts-expect-error módulo JavaScript sem tipos
import { criarServidor } from './servidor.mjs';

let pasta: string;
let servidor: Server;
let base: string;
let arquivo: string;

beforeAll(async () => {
  pasta = await mkdtemp(path.join(tmpdir(), 'circulo-servidor-'));
  await mkdir(path.join(pasta, 'dist'));
  await writeFile(path.join(pasta, 'dist', 'index.html'), '<h1>app</h1>');
  await mkdir(path.join(pasta, 'dist-segredo'));
  await writeFile(path.join(pasta, 'dist-segredo', 'segredo.txt'), 'SEGREDO');
  await mkdir(path.join(pasta, 'vault'));
  arquivo = path.join(pasta, 'vault', 'Progresso.md');
  servidor = criarServidor({ pastaDoApp: path.join(pasta, 'dist'), arquivo });
  await new Promise<void>((r) => servidor.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${(servidor.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await new Promise((r) => servidor.close(r));
  await rm(pasta, { recursive: true, force: true });
});

describe('erro 11 — endereço malformado não derruba o servidor', () => {
  test('responde 400 e continua de pé', async () => {
    expect((await fetch(`${base}/%E0%A4%A`)).status).toBe(400);
    expect((await fetch(`${base}/`)).status).toBe(200);
  });
});

describe('erro 12 — não sai da pasta do app nem para pastas vizinhas', () => {
  test('pasta irmã com nome parecido (dist-segredo) é recusada', async () => {
    const resposta = await fetch(`${base}/..%2fdist-segredo%2fsegredo.txt`);
    expect(resposta.status).toBe(403);
  });
});

describe('versão do arquivo (para a gravação nunca apagar respostas)', () => {
  test('cria, lê com versão, recusa versão velha e aceita a atual', async () => {
    expect((await fetch(`${base}/api/progresso`)).status).toBe(404);
    const criar = await fetch(`${base}/api/progresso`, { method: 'PUT', headers: { 'If-None-Match': '*' }, body: 'um' });
    expect(criar.status).toBe(204);
    const lido = await fetch(`${base}/api/progresso`);
    const versao = lido.headers.get('ETag')!;
    expect(await lido.text()).toBe('um');
    expect((await fetch(`${base}/api/progresso`, { method: 'PUT', headers: { 'If-None-Match': '*' }, body: 'x' })).status).toBe(409);
    expect((await fetch(`${base}/api/progresso`, { method: 'PUT', headers: { 'If-Match': '"velha"' }, body: 'x' })).status).toBe(409);
    expect((await fetch(`${base}/api/progresso`, { method: 'PUT', headers: { 'If-Match': versao }, body: 'dois' })).status).toBe(204);
    expect(await readFile(arquivo, 'utf8')).toBe('dois');
  });
});

describe('erro 10 — gravações simultâneas não se atrapalham', () => {
  test('30 gravações ao mesmo tempo: nenhuma falha e o arquivo final é uma delas, inteira', async () => {
    const corpos = Array.from({ length: 30 }, (_, i) => `versão ${i} `.repeat(2000));
    const respostas = await Promise.all(corpos.map((body) => fetch(`${base}/api/progresso`, { method: 'PUT', body })));
    expect(respostas.map((r) => r.status).filter((s) => s !== 204)).toEqual([]);
    expect(corpos).toContain(await readFile(arquivo, 'utf8'));
  });
});

describe('pasta do vault inacessível (Google Drive fora)', () => {
  test('GET e PUT respondem 503', async () => {
    const outro = criarServidor({ pastaDoApp: path.join(pasta, 'dist'), arquivo: path.join(pasta, 'nao-existe', 'P.md') });
    await new Promise<void>((r) => outro.listen(0, '127.0.0.1', r));
    const url = `http://127.0.0.1:${(outro.address() as AddressInfo).port}/api/progresso`;
    expect((await fetch(url)).status).toBe(503);
    expect((await fetch(url, { method: 'PUT', body: 'x' })).status).toBe(503);
    await new Promise((r) => outro.close(r));
  });
});
