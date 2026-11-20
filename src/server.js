import http from 'node:http';
import { URL } from 'node:url';
import { chamadosController } from './controllers/chamados.controller.js';

const PORT = process.env.PORT || 3000;

function criarResHelper(res) {
  return {
    setHeader(k, v) {
      res.setHeader(k, v);
    },
    status(code) {
      res.statusCode = code;
      return {
        json(obj) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify(obj));
        },
        end() {
          res.end();
        }
      };
    }
  };
}

export const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const query = Object.fromEntries(parsedUrl.searchParams.entries());
  const resHelper = criarResHelper(res);

  // Leitura do corpo JSON para POST e PUT
  let body = {};
  if (req.method === 'POST' || req.method === 'PUT') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const raw = Buffer.concat(chunks).toString('utf-8').trim();
    if (raw) {
      try {
        body = JSON.parse(raw);
      } catch {
        return resHelper.status(400).json({ erro: 'JSON malformado no corpo da requisicao.' });
      }
    }
  }

  // Roteamento RESTful: /api/v1/chamados e /api/v1/chamados/:id
  if (pathname === '/api/v1/chamados') {
    if (req.method === 'GET') return chamadosController.listar({ query }, resHelper);
    if (req.method === 'POST') return chamadosController.criar({ body }, resHelper);
  }

  const matchId = pathname.match(/^\/api\/v1\/chamados\/([^/]+)$/);
  if (matchId) {
    const id = matchId[1];
    if (req.method === 'GET') return chamadosController.obterPorId({ params: { id } }, resHelper);
    if (req.method === 'PUT') return chamadosController.atualizar({ params: { id }, body }, resHelper);
    if (req.method === 'DELETE') return chamadosController.remover({ params: { id } }, resHelper);
  }

  return resHelper.status(404).json({ erro: 'Rota nao encontrada.' });
});

if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  server.listen(PORT, () => {
    console.log(`[Zeladoria IFPI API] Servidor RESTful rodando em http://localhost:${PORT}/api/v1/chamados`);
  });
}
