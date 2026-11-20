import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Carrega .env.local automaticamente quando executado via Node.js no terminal (Smoke Test)
function carregarEnvLocalNoNode() {
  if (typeof process === 'undefined' || !process.env) return;
  const raizProjeto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
  const diretoriosBusca = [process.cwd(), raizProjeto];
  for (const dir of diretoriosBusca) {
    for (const nomeArquivo of ['.env.local', '.env']) {
      const caminho = path.resolve(dir, nomeArquivo);
      if (fs.existsSync(caminho)) {
        const conteudo = fs.readFileSync(caminho, 'utf-8');
        for (const linha of conteudo.split(/\r?\n/)) {
          const limpa = linha.trim();
          if (!limpa || limpa.startsWith('#')) continue;
          const idx = limpa.indexOf('=');
          if (idx === -1) continue;
          const chave = limpa.slice(0, idx).trim();
          const valor = limpa.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (!process.env[chave]) {
            process.env[chave] = valor;
          }
        }
      }
    }
  }
}

carregarEnvLocalNoNode();

// 1. Carregamento defensivo seguro (compatível com Vite, Next.js e Node sem quebrar por 'process is not defined')
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL);

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY);

// 2. Validação defensiva precoce (evita falhas silenciosas)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[ERRO CRÍTICO] Variáveis de ambiente do Supabase não configuradas no .env.local!');
  throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY antes de inicializar o app.');
}

// 3. Exportação da instância singleton do cliente
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
