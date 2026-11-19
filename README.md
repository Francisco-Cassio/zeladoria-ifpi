# Zeladoria IFPI (`zeladoria-ifpi`)

> **Pitch Oficial do MVP:**  
> *"Para alunos e servidores do IFPI que sofrem com demora no reparo de salas e laboratórios, faremos um sistema web de chamados com triagem de criticidade por IA, diferente de avisos informais no WhatsApp, medindo o sucesso por 30 chamados no 1º mês."*

---

## 1. Contexto e Dor Real (Alinhamento LGPD)

No cotidiano acadêmico do **IFPI Campus Teresina Central**, problemas estruturais e de equipamentos em salas de aula e laboratórios (como ar-condicionado inoperante, projetores sem sinal, computadores com falha de hardware ou tomadas danificadas) são frequentemente comunicados de maneira informal pelos corredores, em grupos de mensagens ou verbalmente.

Essa ausência de canal padronizado gera três dores concretas validadas:
1. **Perda de histórico e retrabalho:** O mesmo defeito é reportado várias vezes sem rastreabilidade de protocolo (`UUID`) ou carimbo de tempo (`TIMESTAMPTZ`).
2. **Falta de priorização clara:** Falhas críticas que inviabilizam aulas práticas em laboratórios concorrem sem critério com solicitações de baixa urgência.
3. **Ausência de retorno à comunidade:** Alunos e docentes não sabem se o problema da sala já foi reportado ou se já está em atendimento.

> **Conformidade com a LGPD (Lei nº 13.709/2018):** O sistema opera sob o princípio da **minimização de dados**. Não são coletados CPF, telefone pessoal, fotos de usuários ou dados sensíveis. O registro restringe-se exclusivamente aos dados patrimoniais/ambientais da ocorrência (`sala_bloco`, `categoria`, `titulo`, `descricao`, `criticidade` e `status`) e identificação funcional opcional/mínima.

---

## 2. Solução e Alinhamento ao Edital

O **Zeladoria IFPI** é um MVP enxuto com persistência relacional em nuvem (**Supabase / PostgreSQL**) que aplica o **Princípio do Oráculo**: enquanto uma camada de triagem assistida (ou classificação de intenção) sugere a categoria e o nível de criticidade do chamado, o banco de dados relacional atua como oráculo determinístico por meio de tipos fortes, chaves `UUID`, auditoria temporal UTC e restrições `CHECK`, impedindo estados ou categorias alucinadas.

- **Edital Alvo Principal:** 🏢 **IdeiaLab 2026 (IFPI Central)** — Solução de impacto direto na infraestrutura, gestão pública e qualidade de ensino do campus.
- **Edital Secundário:** 📱 **15º Campus Mobile (Instituto Claro / USP)** — Interface responsiva de uso rápido em campo diretamente das salas e laboratórios.

---

## 3. Escopo do MVP 1 (Corte Radical)

### 3.1 RF-CORE (Funcionalidade Inegociável)
- **RF-01 — Registro Validado de Chamado de Manutenção:** Sem a capacidade de registrar de forma estruturada e persistente um defeito vinculado a um bloco/sala e categoria técnica, o produto não existe.

### 3.2 Requisitos Funcionais Indispensáveis (RF-01 a RF-04)
| ID | Requisito Funcional | Papel na Arquitetura |
|---|---|---|
| **RF-01** | **Registro de Chamado de Manutenção (RF-CORE)** | Coleta estruturada de sala/bloco, título, categoria técnica e descrição do problema com persistência em nuvem. |
| **RF-02** | **Triagem e Validação de Criticidade (Princípio do Oráculo)** | Classificação da urgência (`baixa`, `media`, `critica`) validada por constraint determinística no PostgreSQL. |
| **RF-03** | **Listagem e Consulta Pública de Chamados** | Exibição dos chamados persistidos ordenados por criticidade e data de abertura para evitar chamados duplicados. |
| **RF-04** | **Controle de Status de Atendimento** | Rastreamento do ciclo de vida do chamado (`aberto`, `em_atendimento`, `resolvido`, `cancelado`). |

---

## 4. Lista Proibida — FORA DO MVP 1

Para garantir entrega funcional, testável e auditável dentro do ciclo de 4 semanas, ficam **estritamente proibidos** na v1:
- ❌ Upload e armazenamento de fotos, áudios ou vídeos dos equipamentos;
- ❌ Planta baixa interativa 3D ou geolocalização GPS indoor;
- ❌ Chat em tempo real entre alunos e equipe de manutenção;
- ❌ Integração direta com API do SUAP, almoxarifado ou controle financeiro de peças;
- ❌ Aplicativo mobile nativo nas lojas (foco inicial em aplicação Web/Node conectada ao Supabase via HTTPS porta 443);
- ❌ Painel administrativo complexo de múltiplos níveis hierárquicos.
