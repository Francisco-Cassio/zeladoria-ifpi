import { chamadosController } from '../controllers/chamados.controller.js';

/**
 * Tabela declarativa de rotas RESTful para o recurso /api/v1/chamados
 */
export const ROTAS_CHAMADOS = [
  { method: 'POST', path: '/api/v1/chamados', handler: chamadosController.criar },
  { method: 'GET', path: '/api/v1/chamados', handler: chamadosController.listar },
  { method: 'GET', path: '/api/v1/chamados/:id', handler: chamadosController.obterPorId },
  { method: 'PUT', path: '/api/v1/chamados/:id', handler: chamadosController.atualizar },
  { method: 'DELETE', path: '/api/v1/chamados/:id', handler: chamadosController.remover }
];
