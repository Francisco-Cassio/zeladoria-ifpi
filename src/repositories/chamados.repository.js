import { supabase } from '../services/supabaseClient.js';

const TABELA = 'chamados_manutencao';

export const chamadosRepository = {
  async create(dados) {
    const { data, error } = await supabase
      .from(TABELA)
      .insert([dados])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async findAll(filtros = {}) {
    let query = supabase
      .from(TABELA)
      .select('*')
      .order('created_at', { ascending: false });

    if (filtros.categoria) query = query.eq('categoria', filtros.categoria);
    if (filtros.status) query = query.eq('status', filtros.status);
    if (filtros.criticidade) query = query.eq('criticidade', filtros.criticidade);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from(TABELA)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async update(id, dados) {
    const { data, error } = await supabase
      .from(TABELA)
      .update(dados)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { data, error } = await supabase
      .from(TABELA)
      .delete()
      .eq('id', id)
      .select();
    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
  }
};
