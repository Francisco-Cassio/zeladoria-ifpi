import { supabase } from './supabaseClient.js';

/**
 * Insere um registro na tabela central do MVP (chamados_manutencao) com validação defensiva e tratamento de erro.
 * @param {Object} dadosFormulario Objeto contendo os campos coletados na interface ou script
 * @returns {Promise<{ sucesso: boolean, dados?: Object, erro?: string }>}
 */
export async function cadastrarNoSupabase(dadosFormulario) {
  try {
    // 1. Validação prévia no cliente (Fail Fast)
    if (!dadosFormulario || Object.keys(dadosFormulario).length === 0) {
      return { sucesso: false, erro: 'Os dados do formulário não podem estar vazios.' };
    }

    // 2. Chamada ao Supabase via SDK oficial
    const { data, error } = await supabase
      .from('chamados_manutencao')
      .insert([dadosFormulario])
      .select();

    // 3. Verificação de erro retornado pela API ou política de RLS
    if (error) {
      console.error('[Supabase Error]:', error.message, error.details);
      return {
        sucesso: false,
        erro: `Falha na persistência: ${error.message}`
      };
    }

    // 4. Retorno de sucesso com o registro persistido (incluindo UUID e created_at gerados)
    return {
      sucesso: true,
      dados: data[0]
    };
  } catch (err) {
    // 5. Captura de falhas de rede ou exceções inesperadas
    console.error('[Exceção Inesperada]:', err);
    return {
      sucesso: false,
      erro: 'Não foi possível conectar ao servidor. Verifique sua conexão de internet.'
    };
  }
}
