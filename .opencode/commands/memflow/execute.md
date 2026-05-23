---
name: execute
description: Implementa código com base na decisão do /workflow respeitando `model-policy.md` do target ativo. Sem decisão explícita do /workflow, bloqueia e retorna para orquestração. Inclui integração com persistência inteligente e métricas de qualidade.
license: MIT
metadata:
  author: BrunoCastro
  version: "3.3.0"
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
### Conteúdo injetado: _shared/target-adapter.md
---
description: Não é um comando executável. Adaptador de target para resolução normativa no OpenCode.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.3.0"
---

# Adaptador de target (OpenCode)

Aplicar este adaptador quando o target ativo for `opencode`.

## Resolução de caminhos normativos (obrigatória)

- Para arquivos normativos do sistema, usar os caminhos oficiais por escopo:
  - `~/.config/opencode/commands/memflow/...` (global)
  - `.opencode/commands/memflow/...` (local)
- Em instalações OpenCode geradas pelo instalador Memflow, comandos executáveis podem conter blocos normativos injetados (`_shared/*.md` e `model-policy.md`) no próprio arquivo.
- Nesses artefatos gerados, `_shared/` e `model-policy.md` podem não existir como arquivos separados no destino.
- Nunca resolver:
  - `model-policy.md`
  - `_shared/*.md`
  relativo ao projeto aberto.

## Detecção automática de escopo (obrigatória)

- Determinar escopo de instalação antes de pedir qualquer confirmação ao usuário.
- Ordem obrigatória:
  1. Detectar o diretório do comando em execução (`.../commands/memflow/<comando>.md`) e usar este diretório como raiz normativa.
  2. Se a raiz detectada estiver em `~/.config/opencode/commands/memflow`, classificar como **global**.
  3. Se a raiz detectada estiver em `.opencode/commands/memflow`, classificar como **local**.
  4. Resolver `_shared/*.md` e `model-policy.md` de forma relativa à raiz detectada.
- Só tentar descoberta por caminhos oficiais (`global -> local`) quando o caminho do comando em execução não estiver disponível.
- Não solicitar ao usuário confirmação de localização de arquivos normativos quando a detecção automática for possível.

## Ausência de arquivo oficial

- Se o arquivo não for encontrado em nenhum caminho oficial:
  - reportar ausência
  - NÃO usar fallback

## Precedência

- Este adaptador define a resolução para `opencode`.
- Comandos podem estender apenas regras operacionais de leitura.
- Invariantes não sobrescrevíveis:
  - detecção automática de escopo quando houver comando ativo
  - resolução normativa relativa à raiz detectada ou por bloco injetado no comando instalado
  - ausência em caminho oficial sem fallback fora do adaptador
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

---

## Objetivo

Executar a implementação:

- respeitando a decisão do `/workflow`
- seguindo `model-policy.md`
- mantendo consistência com `.agents` e `docs`

Este comando NÃO decide estratégia, apenas executa.

---

## Uso de ferramentas MCP

### Serena MCP (PRIORIDADE)

- localizar pontos exatos de alteração
- editar código com precisão
- evitar duplicação
- entender dependências

Priorizar:

- find_symbol
- find_referencing_symbols
- replace_symbol_body
- insert_before_symbol / insert_after_symbol

Evitar:

- editar arquivos inteiros sem necessidade

---

## Validação de decisão (OBRIGATÓRIO)

### Existe decisão do `/workflow`?

- SIM → seguir decisão  
- NÃO → BLOQUEAR e retornar ao `/workflow`

---

## Sem decisão do `/workflow`

- Status: Parcial
- Motivo: decisão de estratégia ausente
- Ação obrigatória: executar `/workflow`
- NÃO classificar complexidade/impacto/risco dentro de `/execute`

E PARAR.

---

## Gate anti-compaction (OBRIGATÓRIO)

Antes de executar implementação, validar no contexto ativo:

- idioma pt-BR confirmado
- identidade Memflow confirmada

Se qualquer um estiver ausente ou falhar:

- Status: Parcial
- Motivo: invariantes anti-compaction inválidos
- Ação obrigatória: reexecutar `/context`
- NÃO implementar até revalidação

E PARAR.

---

## Integração com `/workflow`

- EXECUTAR DIRETO → executar  
- PLANEJAR → bloquear  

---

## Uso de modelo

- seguir model-policy  
- execução → modelo econômico  
- escalar apenas se necessário  

---

## Escalada

1ª falha → corrigir  
2ª falha → revisar abordagem  
3ª falha → escalar modelo  

---

## Execução

- implementar código  
- ajustar arquivos  
- seguir padrões do projeto  

---

## Integração com plano salvo (Plano vivo)

Quando houver plano salvo em `.md`:

- ler o plano salvo antes de iniciar a implementação
- mapear tarefas/subtarefas planejadas para a execução atual
- respeitar o modo de execução definido no plano:
  - `[P]` paralelizável: pode executar em paralelo com outras `[P]` quando não houver conflito
  - `[S]` sequencial: executar na ordem planejada
- atualizar o checklist de progresso no plano salvo durante a execução usando a legenda padrão:
  - `[ ]` pendente
  - `[-]` em andamento
  - `[x]` concluída
  - `[!]` bloqueada
- preservar os marcadores de modo `[P]` e `[S]` durante as atualizações de status
- manter consistência entre tarefa pai e subtarefas ao atualizar status:
  - só marcar tarefa pai como `[x]` quando todas as subtarefas estiverem `[x]`
  - quando houver subtarefa `[-]`, refletir tarefa pai como `[-]`
  - quando houver subtarefa `[!]`, não marcar tarefa pai como `[x]`
- atualizar em ordem top-down (tarefa pai -> subtarefa) para evitar estado contraditório
- quando houver item `[!]`, registrar no plano salvo:
  - motivo objetivo do bloqueio
  - ação necessária para desbloqueio
  - responsável esperado pela ação (usuário, agente ou sistema externo)
  - critério de saída para retornar a `[ ]` ou `[-]`
- atualizar o último checkpoint e o próximo passo ao final da execução
- se a execução parar no meio, registrar claramente onde parou e o que falta para retomar

Se não houver plano salvo:

- executar normalmente com base na decisão do `/workflow`

---

## Segurança

- respeitar `.agents`  
- evitar exposição de secrets  
- separar client/server corretamente  

Se `.agents` ausente:
- aplicar boas práticas  
- modo degradado  

---

## Testes

- detectar runtime  
- rodar testes relevantes  
- evitar regressão  

---

## Detecção de stack

Identificar:

- linguagem/runtime  
- gerenciador  
- comandos de lint/test  

---

## Qualidade obrigatória

Após implementar:

1. setup (se necessário)  
2. format  
3. lint/typecheck  
4. testes  

Se erro → corrigir automaticamente  

---

## Regras específicas

- NÃO sobrescrever sem análise  
- NÃO duplicar código  
- NÃO alterar múltiplos arquivos sem necessidade  
- NÃO autoexecutar próximos comandos do fluxo sem confirmação do usuário
- NÃO encerrar execução com plano salvo desatualizado quando houve avanço em tarefas/subtarefas

---

## Resiliência

- erro simples → corrigir  
- erro estrutural → revisar plano  
- erro recorrente → escalar  

---

# Persistência inteligente (AUTO MEMORY)

Após execução, avaliar relevância para memória.

---

## Avaliação de relevância

Verificar se houve:

- decisões técnicas  
- mudanças relevantes  
- padrões definidos  
- escolhas arquiteturais  
- contexto útil  

---

## Detecção de decisões

Detectar padrões:

- “vamos usar…”  
- “decidimos…”  
- “padronizar…”  
- “não usar mais…”  
- “a partir de agora…”  

---

## Score de relevância (0–100)

- Mudança de stack: +40  
- Decisão arquitetural: +30  
- Padrão global: +20  
- Impacto múltiplos arquivos: +10  
- Mudança local: +5  
- Ajuste trivial: 0  

---

## Interpretação

- 0–20 → Não salvar  
- 21–50 → Pode salvar  
- 51–80 → Recomendar  
- 81–100 → Recomendar fortemente  

---

## Resultado

Se score ≥ 51:

→ Executar `/memory-save`

Se score < 51:

→ Não necessário salvar  

---

# 🆕 Integração com métricas de qualidade (NOVO)

Se a execução for seguida de:

- `/review`
- `/review-code`

Então:

→ Priorizar execução do `/memory-save`

Objetivo:

- registrar qualidade da execução  
- alimentar histórico do sistema  
- permitir análise futura  

---

## Importante

- NÃO decidir estratégia  
- NÃO pular validações  
- NÃO finalizar com erro  
- NÃO executar sem entendimento  

---

# Formato obrigatório de saída

## Status

- Executado / Falhou / Parcial  

---

## Análise

- O que foi feito  
- Arquivos alterados  
- Uso de Serena  
- Uso de fallback  
- Aderência ao workflow  
- Modo: Normal / Degradado  
- Plano salvo atualizado: SIM / NÃO / N/A
- Checkpoint de retomada registrado: SIM / NÃO / N/A

---

## Problemas

- Erros ou riscos  
- Impactos  

Se não houver:
→ Nenhum  

---

## Persistência sugerida

- Score de relevância: X/100  
- Conteúdo relevante: SIM / NÃO  
- Decisões detectadas: SIM / NÃO  
- Métricas de qualidade elegíveis: SIM / NÃO  
- Recomendação:
  - Executar `/memory-save`
  - Não necessário salvar  

---

## Bloqueios

- Plano necessário → PARAR  
- Conflito com `.agents` → PARAR  
- Falta de contexto → PARAR  
- Falha de invariantes anti-compaction → PARAR

---

## Próximos passos

- `/review`  
- `/review-code` (se aplicável)  
- `/memory-save` (recomendado após validação)  
- `/review-enforce-rules` (opcional)  
- `/test-plan` (se aplicável)  
- Aguardar confirmação explícita do usuário antes de executar qualquer próximo comando
