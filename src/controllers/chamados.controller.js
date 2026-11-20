import { chamadosRepository } from '../repositories/chamados.repository.js';

const CATEGORIAS_VALIDAS = [
  'climatizacao',
  'eletrica',
  'rede_ti',
  'mobiliario',
  'projetor_av',
  'estrutura'
];
const CRITICIDADES_VALIDAS = ['baixa', 'media', 'critica'];
const STATUS_VALIDOS = ['aberto', 'em_atendimento', 'resolvido', 'cancelado'];

export const chamadosController = {
  async criar(req, res) {
    try {
      const {
        titulo,
        descricao,
        sala_bloco,
        categoria,
        criticidade = 'media',
        status = 'aberto',
        solicitante_nome
      } = req.body || {};

      if (!titulo || !descricao || !sala_bloco || !categoria) {
        return res.status(400).json({
          erro: 'Campos obrigatorios: titulo, descricao, sala_bloco e categoria.'
        });
      }

      if (titulo.trim().length < 5 || descricao.trim().length < 10 || descricao.length > 500 || sala_bloco.trim().length < 3) {
        return res.status(400).json({
          erro: 'Comprimento invalido: titulo (>=5), descricao (10 a 500) e sala_bloco (>=3).'
        });
      }

      if (!CATEGORIAS_VALIDAS.includes(categoria)) {
        return res.status(400).json({
          erro: `Categoria invalida. Validas: ${CATEGORIAS_VALIDAS.join(', ')}`
        });
      }

      if (!CRITICIDADES_VALIDAS.includes(criticidade)) {
        return res.status(400).json({
          erro: `Criticidade invalida (Oraculo). Validas: ${CRITICIDADES_VALIDAS.join(', ')}`
        });
      }

      if (!STATUS_VALIDOS.includes(status)) {
        return res.status(400).json({
          erro: `Status invalido. Validos: ${STATUS_VALIDOS.join(', ')}`
        });
      }

      const novo = await chamadosRepository.create({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        sala_bloco: sala_bloco.trim(),
        categoria,
        criticidade,
        status,
        solicitante_nome
      });

      // Roy Fielding (2000): 201 Created acompanhado do header Location com a URI canônica
      res.setHeader('Location', `/api/v1/chamados/${novo.id}`);
      return res.status(201).json(novo);
    } catch (err) {
      return res.status(500).json({ erro: `Erro ao persistir chamado: ${err.message}` });
    }
  },

  async listar(req, res) {
    try {
      const lista = await chamadosRepository.findAll(req.query || {});
      return res.status(200).json(lista);
    } catch (err) {
      return res.status(500).json({ erro: `Erro ao listar chamados: ${err.message}` });
    }
  },

  async obterPorId(req, res) {
    try {
      const { id } = req.params;
      const chamado = await chamadosRepository.findById(id);
      if (!chamado) {
        return res.status(404).json({ erro: 'Chamado nao encontrado.' });
      }
      return res.status(200).json(chamado);
    } catch (err) {
      return res.status(500).json({ erro: `Erro ao consultar chamado: ${err.message}` });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body || {};

      if (Object.keys(payload).length === 0) {
        return res.status(400).json({ erro: 'Corpo da requisicao nao pode ser vazio.' });
      }

      if (payload.categoria && !CATEGORIAS_VALIDAS.includes(payload.categoria)) {
        return res.status(400).json({ erro: 'Categoria invalida.' });
      }
      if (payload.criticidade && !CRITICIDADES_VALIDAS.includes(payload.criticidade)) {
        return res.status(400).json({ erro: 'Criticidade invalida.' });
      }
      if (payload.status && !STATUS_VALIDOS.includes(payload.status)) {
        return res.status(400).json({ erro: 'Status invalido.' });
      }

      const existente = await chamadosRepository.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Chamado nao encontrado.' });
      }

      const atualizado = await chamadosRepository.update(id, payload);
      return res.status(200).json(atualizado);
    } catch (err) {
      return res.status(500).json({ erro: `Erro ao atualizar chamado: ${err.message}` });
    }
  },

  async remover(req, res) {
    try {
      const { id } = req.params;
      const existente = await chamadosRepository.findById(id);
      if (!existente) {
        return res.status(404).json({ erro: 'Chamado nao encontrado.' });
      }
      await chamadosRepository.remove(id);
      // REST estrito: 204 No Content sem corpo!
      return res.status(204).end();
    } catch (err) {
      return res.status(500).json({ erro: `Erro ao remover chamado: ${err.message}` });
    }
  }
};
