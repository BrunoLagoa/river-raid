---
name: plan
description: Cria plano de implementação detalhado quando /workflow decide PLANEJAR PRIMEIRO, alinhado a `model-policy.md` do target ativo (via `_shared/target-adapter.md`) — sequência de passos, arquivos afetados, impacto, riscos e critérios de sucesso. Não escreve código. Saída: Status (Plano criado/Bloqueado), Análise com 9 subseções, Problemas e Próximos passos. Bloqueia se houver ambiguidade. Próximo passo: /execute.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.1.0"
---

## Referência normativa comum

Aplicar obrigatoriamente:

### Conteúdo injetado: _shared/base-output.md
---
description: Não é um comando executável. Base compartilhada de formato de saída.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.3.0"
---

# Base de saída (referência normativa)

Aplicar obrigatoriamente este formato base de resposta em comandos do sistema:

## Idioma obrigatório

- Todas as respostas e comunicações devem ser em **Português do Brasil (pt-BR)**.

## Invariantes de identidade do sistema (anti-compaction)

- Preservar o contexto operacional do projeto **Memflow Command System** em todas as respostas.
- Tratar as regras normativas compartilhadas como invariantes recarregáveis em qualquer retomada de contexto.
- Em caso de resumo/compactação de contexto pela LLM, revalidar explicitamente:
  - idioma obrigatório (pt-BR)
  - identidade e escopo do projeto (Memflow)

## Regras de uso

- Se um comando tiver formato próprio mais específico, ele pode estender este padrão.
- Campos que podem ser especializados por comando:
  - vocabulário de `Status`
  - subseções internas de `Análise` e `Problemas`
- Invariantes não sobrescrevíveis:
  - resposta em pt-BR
  - seção `## Próximos passos` como último `##`
  - continuidade do fluxo somente em `## Próximos passos`
- Nunca executar automaticamente o próximo comando do fluxo sem confirmação explícita do usuário.
- **`## Próximos passos` é sempre o último `##` da resposta:** não incluir nenhuma outra seção com título `##` depois de `## Próximos passos`.
- **Continuidade do fluxo só em `## Próximos passos`:** não usar bullets ou linhas do tipo `Próximo passo:` fora dessa seção (inclui modos compacto, ultra-light ou qualquer resumo intermediário).

## Status

- Estado atual claro do comando (ex.: concluído, bloqueado, parcial)

---

## Análise

- Conteúdo principal da avaliação, planejamento ou execução
- Subdivisões com `###` quando necessário

---

## Problemas

- Violações, riscos, ambiguidades, limitações ou falhas detectadas
- Se não houver: `Nenhum`

---

## Próximos passos

- Ações concretas para continuidade do fluxo
### Conteúdo injetado: _shared/base-preconditions.md
---
description: Não é um comando executável. Base compartilhada de pré-condições.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.4.0"
---

# Base comum de pré-condições (referência normativa)

Aplicar este bloco de pré-condições em comandos operacionais.

---

## Pré-condição de contexto (OBRIGATÓRIO)

Antes de qualquer execução:

- Verificar se o comando `/context` foi executado

Se NÃO:

- BLOQUEAR execução
- Solicitar execução de `/context`
- NÃO continuar

---

## Invariantes anti-compaction (OBRIGATÓRIO)

Antes de qualquer comando operacional (exceto `/context`), validar se o `/context` confirmou:

- idioma obrigatório: pt-BR
- identidade e escopo do projeto: Memflow Command System

Se invariantes estiverem ausentes ou com falha:

- BLOQUEAR execução
- exigir nova execução de `/context`
- NÃO continuar em modo parcial silencioso

---

## Checklist de continuidade segura (anti-bypass)

Antes de seguir para qualquer etapa crítica, confirmar:

- decisão explícita do `/workflow` disponível (quando aplicável)
- invariantes anti-compaction válidos (pt-BR + Memflow)
- confirmação explícita do usuário antes de executar o próximo comando do fluxo

Se qualquer item falhar:

- BLOQUEAR continuidade
- registrar problema no output
- solicitar ação corretiva antes de prosseguir

---

## Validação de memória (OBRIGATÓRIO)

Se existir memória persistente no projeto:

- .agents/memory/memory.md
- .agents/memory/session-memory.md
- .agents/memory/decisions.md
- .agents/memory/quality-metrics.md

Então:

- garantir que foi carregada pelo `/context`
- utilizar como base primária de contexto

---

## Memória não carregada

Se memória existir mas NÃO foi carregada:

- considerar contexto incompleto
- NÃO prosseguir com execução crítica
- recomendar reexecução de `/context`

---

## Ausência de memória

Se memória NÃO existir:

- operar normalmente
- utilizar docs, código e MCPs como fallback

---

## Exceção: comando `/context`

- NÃO exige contexto prévio
- Este comando é responsável por:
  - carregar contexto
  - carregar memória
  - validar ambiente

---

## Exceção: comando `/memory-init`

- pode executar bootstrap da estrutura de memória sem contexto prévio
- após bootstrap, deve exigir reentrada pelo `/context` antes de qualquer execução crítica

---

## Ordem canônica de inicialização

1. `/memory-init` (somente quando estrutura de memória não existir)
2. `/context` (carregamento obrigatório de contexto e memória)
3. comandos de decisão/execução (`/workflow`, `/execute`, `/plan`, etc.)

## Regra de consistência global

- Nenhum comando pode executar sem contexto válido
- Nenhum comando pode ignorar memória disponível
- Evitar execução com contexto parcial ou inconsistente
- Nenhum comando crítico pode executar sem invariantes anti-compaction válidos

---

## Resolução de caminhos (obrigatória)

- Regras de resolução de caminhos normativos e de `model-policy.md` devem seguir `_shared/target-adapter.md`.
- Nunca inferir caminhos fora do adaptador de target.
- Quando o comando ativo já estiver carregado:
  - assumir a raiz desse comando como contexto de resolução normativa
  - não solicitar confirmação manual ao usuário sobre localização de `_shared/*.md` e `model-policy.md`
- Se o adaptador não estiver disponível:
  - reportar ausência
  - NÃO usar fallback

---

## Regra de precedência

- Este arquivo define invariantes globais de execução.
- Comandos podem estender regras operacionais, sem invalidar invariantes.
- Invariantes não sobrescrevíveis:
  - nenhuma execução crítica sem `/context`
  - memória disponível não pode ser ignorada
  - resolução normativa deve seguir `_shared/target-adapter.md`
  - invariantes anti-compaction (pt-BR + Memflow) devem estar válidos antes de execução crítica

---

## Importante

- Este arquivo garante consistência do sistema
- Evita execução sem contexto
- Garante uso correto da memória
### Conteúdo injetado: _shared/base-degraded-mode.md
---
description: Não é um comando executável. Base compartilhada de modo degradado.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.1.0"
---

# Base comum de modo degradado (referência normativa)

Aplicar este bloco quando `.agents` não estiver disponível, ausente ou incompleto.

## Modo degradado

- Não bloquear automaticamente apenas por ausência de `.agents`.
- Ativar modo degradado e avisar explicitamente na resposta.
- Prosseguir com fontes disponíveis:
  - `docs`
  - `model-policy.md` resolvido pelo target ativo (via `_shared/target-adapter.md`)
  - código real do projeto
  - MCPs disponíveis
- Reduzir confiança nas conclusões e registrar limitações.

## Regra de precedência

- Este arquivo define o padrão comum.
- Regras específicas de cada comando podem estender este padrão.
- Invariantes não sobrescrevíveis:
  - ausência de `.agents` não bloqueia automaticamente
  - limitações devem ser reportadas explicitamente
  - confiança da análise deve ser reduzida
### Conteúdo injetado: _shared/target-adapter.vscode.md
---
description: Não é um comando executável. Adaptador de target para prompts gerados no VSCode.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.2.0"
---

# Adaptador de target (VSCode)

Aplicar este adaptador quando o target ativo for `vscode`.

## Resolução normativa

- Em prompts gerados para VSCode, as bases normativas `_shared/*.md` devem ser tratadas como conteúdo local injetado no próprio prompt.
- Em prompts gerados para VSCode, `model-policy.md` também vem como bloco injetado no mesmo arquivo do prompt (não existe prompt separado `memflow.model-policy` na instalação VS Code).
- Não aplicar resolução por caminhos globais/locais de OpenCode.
- `model-policy.md` deve ser interpretado no contexto do prompt gerado para VSCode (texto completo já presente no prompt quando a linha injetável foi expandida pelo instalador).

## Ausência de conteúdo

- Se uma base normativa necessária não estiver presente no prompt gerado:
  - reportar ausência
  - bloquear execução crítica

## Precedência

- Este adaptador define a resolução para `vscode`.
- Comandos podem estender regras operacionais sem remover os requisitos deste adaptador.
- Invariantes não sobrescrevíveis:
  - `_shared/*.md` devem estar injetados no prompt
  - `model-policy.md` deve estar injetado no prompt (mesmo mecanismo que `_shared`)
  - ausência de base normativa necessária bloqueia execução crítica
### Conteúdo injetado: model-policy.md
---
description: Não é um comando executável. Base compartilhada de política de modelos.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.0.0"
---

# Model Policy — Orquestração de Modelos

Este arquivo define as regras de uso, seleção e escalada de modelos de IA no projeto.

Ele garante:

- redução de custo
- consistência de decisões
- qualidade técnica
- previsibilidade do sistema

---

## Objetivo

Padronizar como os modelos são utilizados em cada etapa do workflow:

- `/workflow`
- `/brainstorm`
- `/plan`
- `/execute`
- `/review`
- `/review-enforce-rules` (opcional/recomendado)

---

## Princípio fundamental

👉 Começar com o modelo mais econômico
👉 Escalar apenas quando necessário

---

## Papéis dos modelos

### Modelo free (ex: GPT-4.1, GPT-5 mini)

Usar para:

- exploração inicial de contexto
- dúvidas rápidas
- triagem de tarefas simples
- validações preliminares

Características:

- custo mínimo
- resposta rápida
- menor robustez para implementação complexa

---

### Modelo econômico (ex: Haiku, GPT-5.4 mini, Gemini 3 Flash)

Usar para:

- execução de código
- CRUD
- componentes UI
- ajustes simples
- correções pontuais

Características:

- rápido
- barato
- menor capacidade de raciocínio complexo

---

### Modelo intermediário (ex: Gemini 3.1 Pro, GPT-5.3-Codex, GPT-5.4, Sonnet)

Usar para:

- planejamento (`/plan`)
- arquitetura
- integração de sistemas
- regras de negócio
- decisões técnicas

Características:

- melhor equilíbrio custo/qualidade
- principal modelo de raciocínio

---

### Modelo avançado (ex: GPT-5.4, Opus)

Usar apenas para:

- refatoração complexa
- debugging difícil
- análise de código grande
- problemas persistentes

Características:

- alto custo
- alta capacidade de raciocínio

---

## Estratégia padrão

### Separação obrigatória

- Planejamento → modelo mais inteligente
- Execução → modelo mais econômico
- Triagem inicial opcional → modelo free

---

### Fluxo ideal

```
/workflow → decide
   ↓
/brainstorm (opcional — exploração e trade-offs)
   ↓
/plan (modelo inteligente)
   ↓
/execute (modelo econômico)
```

---

## Regras de seleção

### Por complexidade

| Complexidade | Modelo                    |
| ------------ | ------------------------- |
| Muito baixa  | Free                      |
| Baixa        | Econômico                 |
| Média        | Intermediário             |
| Alta         | Intermediário ou Avançado |

---

### Por tipo de tarefa

#### Econômico

- "crie função"
- "ajuste componente"
- "corrija bug simples"
- "implemente tarefa de baixo risco"

#### Intermediário

- "crie sistema"
- "arquitetura"
- "integração backend"
- "defina abordagem técnica"

#### Avançado

- "refatore projeto"
- "analise código inteiro"
- "debug complexo"

---

## Seleção operacional por nível

Para cada tarefa, definir:

1. nível recomendado
2. modelo principal
3. modelos alternativos do mesmo nível

Regra:

- indicar exatamente 1 modelo principal por execução
- listar 2-3 alternativas do mesmo nível para contingência de disponibilidade
- manter fallback no mesmo nível antes de escalar

---

## Fallback por indisponibilidade ou degradação operacional

Acionar fallback para alternativas do mesmo nível quando houver:

- indisponibilidade do modelo principal
- limite/cota atingido
- latência instável que comprometa continuidade

Fluxo:

1. tentar alternativas do mesmo nível na ordem definida
2. se nenhuma alternativa estiver disponível/viável, reavaliar risco e complexidade
3. escalar para nível superior apenas se necessário

Não permitido:

- reduzir nível em tarefas já classificadas como média/alta complexidade
- pular alternativas do mesmo nível sem justificativa

---

## Escalada automática

### Regra principal

Se houver falha:

1ª falha → tentar corrigir localmente
2ª falha → revisar abordagem (possível erro de plano)
3ª falha → escalar modelo

---

### Exemplo de escalada

```
Free/Econômico → Intermediário → Avançado
```

---

## Regras críticas

- NÃO usar modelo avançado por padrão
- NÃO usar modelo econômico para decisões complexas
- NÃO usar modelo free para implementação crítica
- NÃO pular planejamento em tarefas médias/altas
- NÃO insistir em modelo que falhou repetidamente

---

## Integração com comandos

### `/workflow`

- decide nível recomendado, modelo principal e alternativas do mesmo nível

---

### `/brainstorm`

- fases 1–2: modelo econômico por padrão
- validação no código e comparação de trade-offs: intermediário quando complexidade ≥ média
- recomendação final e DoD: modelo mais forte quando complexidade ≥ média ou risco ≥ médio

---

### `/plan`

- usar modelo intermediário ou superior

---

### `/execute`

- usar modelo econômico
- escalar se necessário

---

### `/review`

- validar se modelo foi adequado

---

### `/review-enforce-rules`

- aplicar validação rígida opcional de uso de modelo em cenários críticos

---

## Regras de consistência

- modelo deve ser coerente com complexidade
- modelo principal deve ter alternativas viáveis do mesmo nível
- decisões devem ser justificadas
- escalada deve ser progressiva

---

## Objetivo de performance

- reduzir custo em 50%–80%
- manter qualidade alta
- evitar retrabalho
- usar free/econômico sempre que o risco permitir

---

## Anti-patterns (evitar)

- usar modelo avançado para tarefas simples
- usar modelo free para tarefa de alto impacto
- executar sem planejamento em tarefas complexas
- ignorar falhas repetidas
- misturar responsabilidades (planejar + executar no mesmo nível)

---

## Resumo final

👉 Modelo NÃO é o cérebro
👉 Workflow é o cérebro
👉 Modelo é ferramenta

---

## Resultado esperado

- execução mais barata
- decisões mais inteligentes
- sistema previsível
- menor taxa de erro
- Resolver essas referências conforme `_shared/target-adapter.md` (sem fallback fora do target ativo).

---

## Objetivo

Criar um plano de implementação:

- claro
- completo
- sem ambiguidades
- pronto para execução via `/execute`

---

## Integração com sistema (CRÍTICO)

Este comando:

- DEVE ser usado quando `/workflow` decidir → PLANEJAR PRIMEIRO
- NÃO deve ser usado fora desse contexto sem validação

---

## Uso de ferramentas MCP

Se disponível:

### Serena MCP (PRIORIDADE)

- validar estrutura real do código
- identificar pontos exatos de implementação
- localizar arquivos e dependências
- evitar duplicação

Priorizar:

- find_symbol
- find_referencing_symbols
- search_for_pattern
- get_symbols_overview

Evitar:

- assumir estrutura
- planejar arquivos inexistentes

---

## Uso de modelo (ALINHADO AO MODEL-POLICY)

Este comando deve:

- utilizar modelo mais inteligente (ex: GPT-5.4)
- priorizar qualidade sobre custo

---

### Regra principal

- Planejamento → modelo mais forte
- Execução → modelo mais econômico

---

## Regras obrigatórias

1. Basear-se em:
   - `.agents` (quando disponível)
   - `docs`
   - `model-policy.md` resolvido pelo target ativo (via `_shared/target-adapter.md`)
   - estrutura real (via Serena, se disponível)
   - resolver `model-policy.md` com as regras do target ativo (via `_shared/target-adapter.md`)

2. NÃO escrever código

3. NÃO assumir comportamento não definido

4. Se houver ambiguidade → PARAR

5. Se houver conflito → PARAR

---

## Validação antes de planejar

Antes de gerar o plano:

- O problema está claro?
- O escopo está definido?
- Existe contexto suficiente?

Se NÃO:
→ PARAR e solicitar esclarecimento

---

## Confirmação obrigatória de salvamento (ANTES de qualquer planejamento)

Antes de iniciar a análise e criação do plano, PERGUNTAR ao usuário:

- Deseja salvar o plano que será criado para manter os dados documentados?

Apresentar obrigatoriamente opções claras:

- Sim, salvar o plano
- Não, apenas mostrar no chat

Regras:

- NÃO iniciar o planejamento antes da resposta do usuário
- Se a resposta estiver ambígua, perguntar novamente usando as mesmas opções
- Se já existir preferência explícita de salvamento na sessão atual, reutilizar essa preferência por padrão e apenas confirmar quando houver mudança solicitada
- Registrar no plano a preferência escolhida (salvar ou não salvar)
- Se o usuário escolher salvar, incluir no plano onde o conteúdo será documentado
- Se o usuário escolher salvar, estruturar o documento como plano vivo com checklist de progresso por tarefa/subtarefa para atualização durante `/execute`

---

## Regras específicas

- NÃO planejar com base em suposição
- NÃO criar arquivos sem validar necessidade
- NÃO ignorar padrões existentes
- DEVE dimensionar a quantidade de tarefas conforme complexidade e escopo real, sem reutilizar quantidade fixa entre planos
- DEVE aplicar sizing dinâmico para passos de implementação:
  - baixa complexidade: 3-5 tarefas
  - média complexidade: 6-10 tarefas
  - alta complexidade: 10+ tarefas com subtarefas obrigatórias

---

## Limitações

Se Serena NÃO estiver disponível:

- avisar limitação
- planejar com base nos arquivos disponíveis

Se `.agents` NÃO estiver disponível:

- avisar limitação
- manter plano em modo degradado
- não bloquear automaticamente por esse motivo

---

## Bloqueios

- Falta de contexto → PARAR
- Ambiguidade → PARAR
- Conflito com `.agents` (quando existir) → PARAR
- Estrutura desconhecida → PARAR

---

## Importante

- NÃO implementar
- NÃO avançar sem clareza total
- NÃO seguir para `/execute` sem validação
- Este comando define a qualidade da execução

---

## Formato obrigatório de saída

## Status

- Plano criado / Bloqueado

---

## Análise

### Entendimento

- O que precisa ser feito

---

### Preferência de salvamento

- Decisão do usuário: Salvar / Não salvar
- Quando salvar: destino de documentação definido

---

### Regras aplicáveis

- `.agents` relevantes (ou ausência em modo degradado)
- segurança (se aplicável)

---

### Estratégia

- abordagem de alto nível
- alinhamento com arquitetura existente

---

### Passos de implementação

- sequência clara e executável
- baseada em estrutura real (quando possível)
- quantidade de tarefas definida por sizing dinâmico (complexidade + escopo real), sem quantidade fixa reutilizada entre planos
- para alta complexidade, incluir obrigatoriamente subtarefas
- checklist final obrigatório de granularidade: cada item pode ser executado sem ambiguidades?
- classificar cada tarefa como:
  - `[P]` paralelizável (pode executar em paralelo)
  - `[S]` sequencial (depende de ordem)

---

### Arquivos afetados

- arquivos a criar ou alterar
- validar com Serena (se disponível)

---

### Impacto

- áreas afetadas
- dependências envolvidas

---

### Riscos

- técnicos
- de negócio
- efeitos colaterais

---

### Critérios de sucesso

- como validar após `/execute`

---

### Rastreamento de execução (Plano vivo)

- obrigatório quando a preferência for salvar o plano
- incluir checklist por tarefa/subtarefa com status: pendente / em andamento / concluída / bloqueada
- incluir último checkpoint de execução e próximo passo objetivo para retomada
- incluir marcador de modo de execução por tarefa/subtarefa:
  - `[P]` paralelizável
  - `[S]` sequencial
- usar template padrão de checklist para consistência:
  - `[ ]` pendente
  - `[-]` em andamento
  - `[x]` concluída
  - `[!]` bloqueada
- critérios obrigatórios para marcar `[P]`:
  - sem dependência de saída de outra tarefa
  - sem conflito previsível de arquivos/áreas críticas
  - sem bloqueio por estado compartilhado sensível
  - com merge e rollback isoláveis
- se qualquer critério falhar, classificar como `[S]`
- aplicar consistência de status entre tarefa pai e subtarefas:
  - tarefa pai só pode ser `[x]` quando todas as subtarefas estiverem `[x]`
  - se existir subtarefa `[-]`, a tarefa pai deve ficar `[-]`
  - se existir subtarefa `[!]`, a tarefa pai não pode ficar `[x]`
  - manter atualização em ordem top-down (tarefa pai -> subtarefa) para evitar divergência
- para itens `[!]` (bloqueada), registrar obrigatoriamente:
  - motivo objetivo do bloqueio
  - ação necessária para desbloqueio
  - responsável esperado pela ação (usuário, agente ou sistema externo)
  - critério de saída do bloqueio para retornar a `[ ]` ou `[-]`

Template base recomendado:

```md
### Progresso de execução

- [P][ ] Tarefa 1
  - [S][-] Subtarefa 1.1
  - [P][x] Subtarefa 1.2
- [S][!] Tarefa 2 (motivo do bloqueio)
  - Ação de desbloqueio: <ação objetiva>
  - Responsável: <usuário | agente | sistema externo>
  - Critério de saída: <condição para voltar a [ ] ou [-]>

Último checkpoint: <resumo objetivo do último ponto executado>
Próximo passo: <ação objetiva para retomada>
```

---

### Fora de escopo

- o que NÃO será feito

---

### Confiança no plano

- Baixa / Média / Alta

---

### Modo de operação

- Normal / Degradado
- Impacto da ausência de `.agents` (quando aplicável)

---

## Problemas

- ambiguidades
- falta de contexto
- conflitos com `.agents` ou `docs`
- limitações de Serena

Se não houver:
→ Nenhum

---

## Modelo principal e alternativas

- Nível recomendado: (free/econômico/intermediário/avançado)
- Modelo principal: (ex: GPT-5.4)
- Modelos alternativos (2-3, mesmo nível):
  - alternativa 1
  - alternativa 2
  - alternativa 3 (opcional)
- Quando usar alternativas:
  - indisponibilidade do modelo principal
  - limite/cota atingido
  - latência instável
- Justificativa:
  - complexidade
  - impacto
  - risco

---

## Próximos passos

- Aguardar confirmação
- Ajustar plano (se necessário)
- Seguir para `/execute`
- Quando houver plano salvo: manter o checklist e checkpoint atualizados durante a execução
