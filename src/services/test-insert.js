// src/services/test-insert.js
// Execute no terminal com: node src/services/test-insert.js
import { cadastrarNoSupabase } from './inserirRegistro.js';

async function rodarSmokeTest() {
  console.log('Testando inserção no Supabase via script direto...');

  const resultado = await cadastrarNoSupabase({
    titulo: 'Teste de Bancada IFPI - Tomada sem energia',
    descricao: 'Validando conexão com Supabase, política RLS e constraints determinísticas na bancada.',
    sala_bloco: 'CTC-B3-18',
    categoria: 'eletrica',
    criticidade: 'critica',
    solicitante_nome: 'Equipe Zeladoria IFPI'
  });

  console.log('Resultado do envio:', resultado);

  if (resultado.sucesso) {
    console.log('[OK] Sucesso! Abra o Table Editor do Supabase para conferir a nova linha.');
  } else {
    console.error('[ERRO] Falha na persistência:', resultado.erro);
  }
}

rodarSmokeTest();
