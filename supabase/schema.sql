-- ============================================================================
-- ZELADORIA IFPI - Script SQL DDL Idempotente (Aula 09 - Supabase & IA)
-- Banco: PostgreSQL 15+ (Supabase) | Esquema: public
-- ============================================================================

-- 1. TABELA PRINCIPAL: chamados_manutencao
CREATE TABLE IF NOT EXISTS public.chamados_manutencao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Dados obrigatórios do relato (RF-01) com validação de integridade defensiva
    titulo VARCHAR(120) NOT NULL
        CONSTRAINT chamados_titulo_min_len CHECK (char_length(trim(titulo)) >= 5),
    descricao TEXT NOT NULL
        CONSTRAINT chamados_descricao_len CHECK (
            char_length(trim(descricao)) >= 10 AND char_length(descricao) <= 500
        ),
    sala_bloco VARCHAR(30) NOT NULL
        CONSTRAINT chamados_sala_bloco_min_len CHECK (char_length(trim(sala_bloco)) >= 3),

    -- PRINCÍPIO DO ORÁCULO (RF-01 / RF-02 / RF-04):
    -- Impede que alucinações de IA ou payloads inválidos gravem categorias,
    -- níveis de criticidade ou status fora do contrato determinístico do MVP.
    categoria VARCHAR(30) NOT NULL DEFAULT 'estrutura'
        CONSTRAINT chamados_categoria_valida CHECK (
            categoria IN ('climatizacao', 'eletrica', 'rede_ti', 'mobiliario', 'projetor_av', 'estrutura')
        ),
    criticidade VARCHAR(20) NOT NULL DEFAULT 'media'
        CONSTRAINT chamados_criticidade_oraculo CHECK (
            criticidade IN ('baixa', 'media', 'critica')
        ),
    status VARCHAR(20) NOT NULL DEFAULT 'aberto'
        CONSTRAINT chamados_status_valido CHECK (
            status IN ('aberto', 'em_atendimento', 'resolvido', 'cancelado')
        ),

    -- Identificação funcional opcional (Minimização de Dados - LGPD)
    solicitante_nome VARCHAR(80)
);

COMMENT ON TABLE public.chamados_manutencao IS
    'Tabela central do MVP Zeladoria IFPI para registro e triagem determinística de chamados de manutenção.';

-- 2. SEGURANÇA, PERMISSÕES E ROW LEVEL SECURITY (RLS)
ALTER TABLE public.chamados_manutencao ENABLE ROW LEVEL SECURITY;

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.chamados_manutencao TO anon, authenticated;

-- Políticas idempotentes para a fase MVP 1 (sem auth.uid() na Aula 09)
DROP POLICY IF EXISTS "Permitir insercao publica anonima" ON public.chamados_manutencao;
CREATE POLICY "Permitir insercao publica anonima"
    ON public.chamados_manutencao
    FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura publica" ON public.chamados_manutencao;
CREATE POLICY "Permitir leitura publica"
    ON public.chamados_manutencao
    FOR SELECT
    USING (true);

-- 3. DADOS DE DEMONSTRAÇÃO (SEED)
INSERT INTO public.chamados_manutencao (
    titulo,
    descricao,
    sala_bloco,
    categoria,
    criticidade,
    status,
    solicitante_nome
) VALUES
(
    'Ar-condicionado pingando sobre bancada lateral',
    'Equipamento split da parede esquerda está gotejando continuamente sobre a bancada 03 durante as aulas práticas.',
    'CTC-B3-18',
    'climatizacao',
    'critica',
    'aberto',
    'Prof. Aislan Rafael'
),
(
    'Projetor multimídia com mau contato no cabo HDMI',
    'Projetor liga normalmente, mas perde o sinal de vídeo ao conectar notebooks na mesa do docente.',
    'CTC-B2-07',
    'projetor_av',
    'media',
    'em_atendimento',
    'Coordenação ADS'
);
