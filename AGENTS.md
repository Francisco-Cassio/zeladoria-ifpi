# AGENTS.md — Diretrizes de Governança para Agentes de IA

Este documento define as regras inegociáveis para qualquer agente de codificação (Antigravity, OpenCode, Cursor, Copilot) que opere neste repositório.

---

## 1. Imutabilidade da Especificação Funcional
- **Proibição absoluta** de alterar requisitos, contratos BDD, nomes de colunas ou regras de negócio definidos em `ESPECIFICACAO-MVP.md` sem autorização explícita e prévia da equipe humana.
- O arquivo `ESPECIFICACAO-MVP.md` e o esquema relacional do PostgreSQL constituem o **Oráculo da Verdade** do projeto.

## 2. Implementação Incremental Estrita
- O desenvolvimento deve ocorrer **um Requisito Funcional (RF) por vez**, em commits atômicos e verificáveis.
- É proibido gerar código monolítico não solicitado ou adicionar funcionalidades presentes na seção **"Lista Proibida — FORA DO MVP 1"** do `README.md`.

## 3. Obrigação de Verificação (Sucesso e Falha)
- Toda função de persistência ou validação implementada deve contemplar tratamento defensivo (`try/catch`, validação *Fail Fast* de entrada vazia e verificação explícita do objeto `error` retornado pelo Supabase).
- Nenhum requisito é considerado concluído sem comprovação prática (via interface ou script de *Smoke Test* como `src/services/test-insert.js`) cobrindo tanto o cenário de sucesso quanto o comportamento defensivo em caso de falha.

## 4. Blindagem Estrita de Credenciais e Segredos
- **PROIBIÇÃO CRÍTICA:** Nunca inserir URLs reais de projeto, chaves `anon` reais ou, sob nenhuma hipótese, a chave administrativa `service_role` diretamente no código-fonte ou em arquivos rastreados pelo Git.
- É obrigatório manter `.env`, `.env.local`, `.env.*.local` e `*.env` listados no `.gitignore`.
- Apenas o arquivo `.env.example`, contendo placeholders genéricos sem valor sensível, pode ser versionado no repositório.

## 5. Comportamento ante Ambiguidade
- Diante de qualquer requisito ambíguo, ausência de variável de ambiente ou conflito entre código e schema do banco, o agente deve **parar imediatamente e perguntar à equipe humana** antes de assumir valores padrão silenciosos ou alterar a arquitetura.

## 6. Diretrizes Éticas, de Segurança e LGPD do Domínio
- **Minimização de Dados (Art. 6º, III da LGPD):** Os registros de chamados da Zeladoria IFPI devem conter apenas informações técnicas sobre o patrimônio/ambiente (bloco, sala, categoria, descrição do defeito no equipamento e nível de criticidade).
- É estritamente proibido criar campos ou solicitar dados pessoais sensíveis, CPF, endereço residencial, telefone particular ou imagens de pessoas.
- **Princípio do Oráculo:** Qualquer campo oriundo de classificação automática ou IA (`criticidade`, `categoria`, `status`) deve ser validado por constraints determinísticas (`CHECK`) no PostgreSQL do Supabase.

## 7. Estilo Arquitetural REST (Roy Fielding, 2000) e Semântica HTTP (Aula 10)
- **Substantivos no Plural:** Todas as URIs de recursos devem utilizar substantivos no plural (`/api/v1/chamados`). É proibido criar rotas baseadas em verbos/RPC (como `/criarChamado` ou `GET /excluir?id=10`).
- **Semântica Estrita de Métodos e Status Codes:**
  - `POST /api/v1/chamados` **DEVE** retornar `HTTP 201 Created` com o cabeçalho `Location: /api/v1/chamados/:id` e o recurso criado no corpo JSON.
  - `GET /api/v1/chamados` **DEVE** retornar `HTTP 200 OK` com array JSON (operação estritamente **segura** e **idempotente**).
  - `GET /api/v1/chamados/:id` **DEVE** retornar `HTTP 200 OK` com o objeto JSON ou `HTTP 404 Not Found`.
  - `PUT /api/v1/chamados/:id` **DEVE** ser **idempotente**, retornando `HTTP 200 OK` com o recurso atualizado, `HTTP 400 Bad Request` ou `HTTP 404 Not Found`.
  - `DELETE /api/v1/chamados/:id` **DEVE** ser **idempotente**, retornando `HTTP 204 No Content` **sem corpo** na resposta (ou `HTTP 404 Not Found` se inexistente).
  - Payloads inválidos ou campos obrigatórios ausentes **DEVEM** retornar `HTTP 400 Bad Request` com `{ "erro": "..." }` (nunca retornar `200 OK` com mensagem de erro nem estourar `500` não tratado).
  - **Statelessness:** O servidor não deve reter sessão em memória (`req.session` proibido).
- **Arquitetura em 4 Camadas:** `services/config` -> `repositories` -> `controllers` -> `routes` -> `server`.
