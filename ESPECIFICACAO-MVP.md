# Especificação Técnica do MVP — Zeladoria IFPI

Documento normativo de requisitos funcionais e contratos comportamentais (**BDD — Behavior-Driven Development**) do projeto **Zeladoria IFPI**.

---

## RF-01: Registro de Chamado de Manutenção (RF-CORE)

- **Ator:** Aluno, Docente ou Técnico-Administrativo do IFPI.
- **Entradas:**
  - `titulo` (`VARCHAR(120)`, obrigatório): Resumo objetivo do problema com comprimento entre **5 e 120 caracteres úteis** após `trim()` (ex.: `"Ar-condicionado pingando"`).
  - `descricao` (`TEXT`, obrigatório): Relato técnico mensurável do defeito contendo obrigatoriamente entre **10 e 500 caracteres úteis** após `trim()`.
  - `sala_bloco` (`VARCHAR(30)`, obrigatório): Identificação padronizada do local no campus com **3 a 30 caracteres úteis** após `trim()` (ex.: `"CTC-B3-18"`, `"CTC-B2-07"`).
  - `categoria` (`VARCHAR(30)`, obrigatório): Categoria técnica pertencente estritamente ao conjunto `('climatizacao', 'eletrica', 'rede_ti', 'mobiliario', 'projetor_av', 'estrutura')`.
  - `solicitante_nome` (`VARCHAR(80)`, opcional): Nome ou identificação institucional do relator (máximo de 80 caracteres).
- **Regras de Negócio (Refinadas após Auditoria Técnica):**
  1. Todos os campos obrigatórios devem ser validados no cliente (*Fail Fast*) antes do envio e garantidos no banco via `NOT NULL` e constraints `CHECK` de comprimento mínimo (`char_length(trim(titulo)) >= 5`, `char_length(trim(descricao)) >= 10` e `char_length(trim(sala_bloco)) >= 3`).
  2. A coluna `categoria` deve ser validada no PostgreSQL por constraint `CHECK` aceitando exclusivamente os 6 valores oficiais do domínio.
  3. Todo registro criado recebe automaticamente `id` do tipo `UUID` (`gen_random_uuid()`) e `created_at` do tipo `TIMESTAMPTZ` (`now()`).
- **Saída Observável:**
  - **Na interface/terminal:** Retorno estruturado `{ sucesso: true, dados: { id, created_at, ... } }` confirmando a gravação em até 3 segundos.
  - **No banco de dados (Supabase):** Nova linha persistida na tabela `public.chamados_manutencao`.
- **Cenário de Sucesso (BDD):**
  - **Dado que** o usuário preenche `titulo = "Projetor sem sinal HDMI"` (23 caracteres), `descricao = "Projetor da bancada central liga a lâmpada mas não reconhece cabo HDMI"` (70 caracteres), `sala_bloco = "CTC-B3-18"` e `categoria = "projetor_av"`,
  - **Quando** confirma o envio do chamado de manutenção,
  - **Então** o sistema valida os comprimentos mínimos, persiste o registro no Supabase com `UUID` gerado e `status = "aberto"`, e retorna `{ sucesso: true }` com os dados gravados.
- **Cenário de Falha (BDD):**
  - **Dado que** o usuário tenta enviar o chamado com `descricao = "Ruim"` (menos de 10 caracteres úteis), `sala_bloco` vazio ou `categoria = "outros_aleatorio"`,
  - **Quando** solicita o cadastro do chamado,
  - **Então** o sistema bloqueia a operação (no cliente ou via `CHECK constraint` do PostgreSQL) e retorna mensagem de erro explícita sem persistir linha inválida.

---

## RF-02: Triagem e Classificação de Criticidade (Princípio do Oráculo)

- **Ator:** Sistema de Triagem / Agente Classificador de IA validado pelo Banco Relacional (Oráculo).
- **Entradas:**
  - `criticidade` (`VARCHAR(20)`, obrigatório, padrão `'media'`): Nível de urgência atribuído ao chamado, pertencente estritamente a `('baixa', 'media', 'critica')`.
- **Regras de Negócio (Refinadas após Auditoria Técnica):**
  1. **Princípio do Oráculo:** Mesmo que um modelo de IA ou cliente externo tente classificar a urgência com termos subjetivos ou alucinados (ex.: `"super_urgente"`, `"altissima"`, `"10"`), o PostgreSQL deve impor a constraint `CHECK (criticidade IN ('baixa', 'media', 'critica'))`.
  2. Critério determinístico de classificação:
     - `'critica'`: falhas de `eletrica` com risco/pane total, `rede_ti` ou `climatizacao` que paralisem laboratório de aula prática;
     - `'media'`: falha parcial de `projetor_av`, `climatizacao` ou `rede_ti` que permita continuidade parcial da atividade;
     - `'baixa'`: ajustes pontuais de `mobiliario` ou `estrutura` sem bloqueio de uso da sala.
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
- **Arquitetura da API RESTful (Aula 10):** 4 camadas (`repositories` -> `controllers` -> `routes` -> `server`) seguindo as restrições formais de Roy Fielding (2000)
- **Backend-as-a-Service (BaaS):** Supabase (PostgreSQL 15+ gerenciado, PostgREST sobre HTTPS porta 443, Row Level Security)
- **SDK Oficial:** `@supabase/supabase-js`
- **Gerenciamento de Segredos:** Variáveis de ambiente isoladas em `.env.local` (não versionado) com template documentado em `.env.example`

---

## Contrato de Comunicação da API RESTful (Aula 10)

### 1. Tabela de Endpoints RESTful (`/api/v1/chamados`)

| Método HTTP | URI (Substantivo no Plural) | Operação / Semântica | Seguro (Safe) | Idempotente | Status Sucesso | Status de Erro Esperados |
|---|---|---|---|---|---|---|
| `POST` | `/api/v1/chamados` | Criar novo chamado de manutenção (retorna header `Location: /api/v1/chamados/:id`) | Não | Não | `201 Created` | `400 Bad Request`, `422 Unprocessable Entity`, `500 Internal Server Error` |
| `GET` | `/api/v1/chamados` | Listar chamados cadastrados (suporta filtro opcional `?categoria=` ou `?status=`) | Sim | Sim | `200 OK` | `500 Internal Server Error` |
| `GET` | `/api/v1/chamados/:id` | Consultar chamado específico por `UUID` | Sim | Sim | `200 OK` | `400 Bad Request`, `404 Not Found`, `500 Internal Server Error` |
| `PUT` | `/api/v1/chamados/:id` | Atualizar dados/status ou criticidade de um chamado existente | Não | Sim | `200 OK` | `400 Bad Request`, `404 Not Found`, `500 Internal Server Error` |
| `DELETE` | `/api/v1/chamados/:id` | Remover chamado por `UUID` (resposta sem corpo) | Não | Sim | `204 No Content` | `404 Not Found`, `500 Internal Server Error` |

### 2. Modelos JSON de Payload

#### Requisição `POST /api/v1/chamados` (`Content-Type: application/json`)
```json
{
  "titulo": "Ar-condicionado sem refrigerar no laboratório",
  "descricao": "Aparelho central liga o ventilador, mas o compressor desarma após 5 minutos de aula.",
  "sala_bloco": "CTC-B3-18",
  "categoria": "climatizacao",
  "criticidade": "critica",
  "solicitante_nome": "Discente ADS IV"
}
```

#### Resposta de Sucesso `HTTP/1.1 201 Created`
- **Header obrigatório:** `Location: /api/v1/chamados/408547db-7579-473f-8f2a-45fdfa30c8a8`
```json
{
  "id": "408547db-7579-473f-8f2a-45fdfa30c8a8",
  "created_at": "2026-11-20T09:33:51.903317+00:00",
  "titulo": "Ar-condicionado sem refrigerar no laboratório",
  "descricao": "Aparelho central liga o ventilador, mas o compressor desarma após 5 minutos de aula.",
  "sala_bloco": "CTC-B3-18",
  "categoria": "climatizacao",
  "criticidade": "critica",
  "status": "aberto",
  "solicitante_nome": "Discente ADS IV"
}
```

#### Resposta de Erro de Validação `HTTP/1.1 400 Bad Request`
```json
{
  "erro": "Campos obrigatorios invalidos ou violacao de contrato: verifique titulo (>=5 chars), descricao (10 a 500 chars), sala_bloco, categoria e criticidade."
}
```
