import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { server } from '../src/server.js';

let baseUrl = '';
let idCriado = '';

before(async () => {
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('1. GET /api/v1/chamados deve retornar 200 OK e um array JSON (Seguro e Idempotente)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/chamados`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.ok(Array.isArray(body), 'O corpo da resposta deve ser um array');
  assert.ok(body.length >= 1, 'Deve retornar os chamados persistidos no Supabase');
});

test('2. POST /api/v1/chamados com dados validos deve retornar 201 Created e header Location (Roy Fielding)', async () => {
  const payload = {
    titulo: 'Teste Contrato REST - Projetor Sala B2-07',
    descricao: 'Validando criacao via endpoint RESTful com status 201 Created e header Location.',
    sala_bloco: 'CTC-B2-07',
    categoria: 'projetor_av',
    criticidade: 'media',
    solicitante_nome: 'Suite de Teste Automatizado'
  };

  const res = await fetch(`${baseUrl}/api/v1/chamados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const location = res.headers.get('location');
  const body = await res.json();

  assert.ok(body.id, 'O registro criado deve possuir UUID');
  assert.equal(location, `/api/v1/chamados/${body.id}`, 'Header Location deve apontar para a URI do novo recurso');
  idCriado = body.id;
});

test('3. GET /api/v1/chamados/:id deve retornar 200 OK para recurso existente', async () => {
  const res = await fetch(`${baseUrl}/api/v1/chamados/${idCriado}`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.id, idCriado);
});

test('4. POST /api/v1/chamados com payload vazio deve retornar 400 Bad Request (sem explodir 500)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/chamados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.erro, 'Deve retornar mensagem explicativa na chave erro');
});

test('5. POST /api/v1/chamados com criticidade alucinada deve ser barrado com 400 Bad Request (Principio do Oraculo)', async () => {
  const res = await fetch(`${baseUrl}/api/v1/chamados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titulo: 'Teste Oraculo Criticidade Invalida',
      descricao: 'Tentando enviar uma criticidade inventada fora do schema.',
      sala_bloco: 'CTC-B3-18',
      categoria: 'eletrica',
      criticidade: 'urgencia_alucinada_999'
    })
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.match(body.erro, /Criticidade invalida/i);
});

test('6. GET /api/v1/chamados/:id para UUID inexistente deve retornar 404 Not Found', async () => {
  const res = await fetch(`${baseUrl}/api/v1/chamados/00000000-0000-0000-0000-000000000000`);
  assert.equal(res.status, 404);
});

test('7. POST /api/v1/chamados deve rejeitar chamado com titulo menor que 5 caracteres com status 400 (Aula 12 - RF-01)', async () => {
  const payloadInvalido = {
    titulo: 'Oi', // Inválido: menor que 5 caracteres
    descricao: 'Descricao valida com mais de vinte caracteres para o teste.',
    sala_bloco: 'CTC-B3-18',
    categoria: 'eletrica',
    criticidade: 'media'
  };

  const res = await fetch(`${baseUrl}/api/v1/chamados`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadInvalido)
  });

  assert.equal(res.status, 400);
  const body = await res.json();
  assert.ok(body.erro, 'Deve retornar propriedade erro no JSON');
  assert.match(body.erro, /pelo menos 5 caracteres/i);
});
