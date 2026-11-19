# Especificação Técnica do MVP — Zeladoria IFPI

Documento normativo de requisitos funcionais e contratos comportamentais (**BDD — Behavior-Driven Development**) do projeto **Zeladoria IFPI**.

---

## RF-01: Registro de Chamado de Manutenção (RF-CORE)

- **Ator:** Aluno, Docente ou Técnico-Administrativo do IFPI.
- **Entradas:**
  - `titulo` (`VARCHAR(120)`, obrigatório): Resumo curto do problema (ex.: `"Ar-condicionado pingando"`).
  - `descricao` (`TEXT`, obrigatório): Descrição detalhada do defeito observado na sala ou equipamento.
  - `sala_bloco` (`VARCHAR(30)`, obrigatório): Identificação do local no campus (ex.: `"CTC-B3-18"`, `"CTC-B2-07"`).
  - `categoria` (`VARCHAR(30)`, obrigatório): Categoria técnica pertencente ao conjunto `('climatizacao', 'eletrica', 'rede_ti', 'mobiliario', 'projetor_av', 'estrutura')`.
  - `solicitante_nome` (`VARCHAR(80)`, opcional): Nome ou identificação do relator.
- **Regras de Negócio:**
  1. Todos os campos obrigatórios devem ser validados no cliente (*Fail Fast*) antes do envio e garantidos no banco via `NOT NULL`.
  2. A coluna `categoria` deve ser validada no PostgreSQL por constraint `CHECK` aceitando exclusivamente os 6 valores oficiais do domínio.
  3. Todo registro criado recebe automaticamente `id` do tipo `UUID` (`gen_random_uuid()`) e `created_at` do tipo `TIMESTAMPTZ` (`now()`).
- **Saída Observável:**
  - **Na interface/terminal:** Retorno estruturado `{ sucesso: true, dados: { id, created_at, ... } }` confirmando a gravação.
  - **No banco de dados (Supabase):** Nova linha persistida na tabela `public.chamados_manutencao`.
- **Cenário de Sucesso (BDD):**
  - **Dado que** o usuário informa o título `"Projetor sem sinal HDMI"`, descrição detalhada do defeito, local `"CTC-B3-18"` e categoria `"projetor_av"`,
  - **Quando** confirma o envio do chamado de manutenção,
  - **Então** o sistema persiste o registro no Supabase com `UUID` gerado, `status` inicial `"aberto"` e retorna confirmação de sucesso.
- **Cenário de Falha (BDD):**
  - **Dado que** o usuário tenta enviar o formulário com o campo `sala_bloco` vazio ou com uma `categoria` inexistente (`"outros_aleatorio"`),
  - **Quando** solicita o cadastro do chamado,
  - **Então** o sistema bloqueia a operação (no cliente ou via constraint do banco) e retorna mensagem de erro explicando o motivo da rejeição.

---

## RF-02: Triagem e Classificação de Criticidade (Princípio do Oráculo)

- **Ator:** Sistema de Triagem / Agente Classificador de IA validado pelo Banco Relacional (Oráculo).
- **Entradas:**
  - `criticidade` (`VARCHAR(20)`, obrigatório, padrão `'media'`): Nível de urgência atribuído ao chamado.
- **Regras de Negócio:**
  1. **Princípio do Oráculo:** Mesmo que um modelo de IA ou cliente externo tente classificar a urgência com termos inventados (ex.: `"super_urgente"`, `"altissima"`, `"10"`), o PostgreSQL deve impor a constraint `CHECK (criticidade IN ('baixa', 'media', 'critica'))`.
  2. Chamados que afetam diretamente o funcionamento de laboratórios de aula prática ou segurança elétrica recebem criticidade `'critica'`.
- **Saída Observável:**
  - **Na interface/terminal:** Chamado salvo com a coluna `criticidade` preenchida com um dos 3 valores determinísticos.
  - **No banco de dados (Supabase):** Constraint `chamados_criticidade_check` ativa bloqueando qualquer valor fora da lista permitida.
- **Cenário de Sucesso (BDD):**
  - **Dado que** um chamado da categoria `"eletrica"` na sala `"CTC-B3-18"` é classificado com criticidade `"critica"`,
  - **Quando** o registro é enviado para persistência no Supabase,
  - **Então** o banco valida a constraint e armazena o chamado com `criticidade = 'critica'`.
- **Cenário de Falha (BDD):**
  - **Dado que** uma saída alucinada ou requisição malformada envia `criticidade = "urgencia_maxima"`,
  - **Quando** tenta inserir o registro na tabela `chamados_manutencao`,
  - **Então** o PostgreSQL rejeita a transação por violação de `CHECK constraint` e nenhuma linha inválida é gravada.

---

## RF-03: Listagem e Consulta Pública de Chamados

- **Ator:** Comunidade acadêmica (Alunos, Docentes e Equipe de Manutenção).
- **Entradas:**
  - Consulta de leitura (`SELECT`) na tabela `public.chamados_manutencao` via Supabase SDK sob política RLS pública do MVP 1.
- **Regras de Negócio:**
  1. A política de Row Level Security (`Permitir leitura publica`) deve autorizar `SELECT` com `USING (true)` nesta etapa inicial do MVP 1.
  2. Os registros retornados devem conter `id`, `titulo`, `sala_bloco`, `categoria`, `criticidade`, `status` e `created_at`.
- **Saída Observável:**
  - Lista de chamados visível no Table Editor e retornada pela API REST (PostgREST) via porta 443 HTTPS.
- **Cenário de Sucesso (BDD):**
  - **Dado que** existem chamados previamente cadastrados na tabela `chamados_manutencao`,
  - **Quando** o cliente executa a leitura ou `.insert().select()`,
  - **Então** o Supabase retorna os dados do registro criado sem erro de permissão RLS (`42501`).
- **Cenário de Falha (BDD):**
  - **Dado que** o RLS está ativado na tabela mas a política de `SELECT` não foi criada,
  - **Quando** o cliente tenta ler os chamados ou usar `.insert().select()`,
  - **Então** o banco bloqueia a leitura com erro de política de segurança (`row-level security policy`).

---

## RF-04: Controle de Status de Atendimento

- **Ator:** Equipe de Zeladoria / Manutenção do Campus.
- **Entradas:**
  - `status` (`VARCHAR(20)`, obrigatório, padrão `'aberto'`): Estado atual do chamado no fluxo de atendimento.
- **Regras de Negócio:**
  1. Todo novo chamado nasce obrigatoriamente com `status = 'aberto'` se não informado.
  2. O banco de dados restringe a coluna `status` exclusivamente aos valores `('aberto', 'em_atendimento', 'resolvido', 'cancelado')` via constraint `CHECK`.
- **Saída Observável:**
  - Status determinístico persistido em cada linha da tabela `chamados_manutencao`.
- **Cenário de Sucesso (BDD):**
  - **Dado que** um novo chamado é enviado sem especificar manualmente o status,
  - **Quando** o PostgreSQL processa o `INSERT`,
  - **Então** a linha é gravada automaticamente com `status = 'aberto'`.
- **Cenário de Falha (BDD):**
  - **Dado que** uma requisição tenta gravar `status = 'esquecido'`,
  - **Quando** o comando chega ao PostgreSQL,
  - **Então** a operação falha pela constraint `CHECK` e preserva a integridade da base.

---

## Limitações Declaradas do MVP 1

1. **Autenticação Ausente na Fase 1 (Aula 09):** As políticas de RLS permitem inserção e leitura anônimas (`WITH CHECK (true)` e `USING (true)`). O vínculo estrito com `auth.uid()` será implementado na Aula 10.
2. **Sem Anexos Multimídia:** O relato é 100% textual para garantir baixo consumo de banda na rede acadêmica e conformidade imediata com a LGPD.
3. **Escopo Local:** Focado nas salas e laboratórios do IFPI Campus Teresina Central.

---

## Stack Tecnológica Inicial

- **Linguagem / Runtime:** JavaScript (ES Modules) / Node.js
- **Backend-as-a-Service (BaaS):** Supabase (PostgreSQL 15+ gerenciado, PostgREST sobre HTTPS porta 443, Row Level Security)
- **SDK Oficial:** `@supabase/supabase-js`
- **Gerenciamento de Segredos:** Variáveis de ambiente isoladas em `.env.local` (não versionado) com template documentado em `.env.example`
