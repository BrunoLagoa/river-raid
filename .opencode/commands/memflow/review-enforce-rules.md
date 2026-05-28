---
name: review-enforce-rules
description: Validação rígida adicional (opcional/recomendada) para cenários críticos — valida conformidade total com .agents, segurança client/server, arquitetura, fluxo do sistema e `model-policy.md` do target ativo (via `_shared/target-adapter.md`). Saída exclusiva: OK ou BLOQUEADO. Qualquer dúvida ou ambiguidade = BLOQUEADO. Não flexibiliza regras. Executar após /review quando necessário.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.2.0"
---

Valide rigorosamente qualquer código, plano, decisão ou execução contra as regras do projeto.

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

---

## Objetivo

Garantir que:

- nenhuma regra de `.agents` foi violada
- a implementação é segura
- a arquitetura foi respeitada
- o workflow do sistema foi seguido corretamente
- o uso de modelos está alinhado com `model-policy.md` do target ativo (via `_shared/target-adapter.md`)

Este é um **gate rígido opcional**, recomendado antes da conclusão em tarefas de maior risco ou criticidade.

---

## Importante

- Este comando é uma validação rígida opcional
- NÃO permitir continuidade com dúvidas
- NÃO aprovar parcialmente
- NÃO ignorar inconsistências
- Deve garantir consistência total do sistema

Este comando complementa validações anteriores com um critério mais estrito.

---

## Base de validação

Fonte de verdade absoluta:

- `.agents/**/*` (quando disponível)

Complementar:

- `docs/**/*`
- `model-policy.md` do target ativo (via `_shared/target-adapter.md`)
- decisões do `/workflow`
- plano (`/plan`)
- execução (`/execute`)

---

## Regras críticas

1. NÃO aceitar violações
2. NÃO flexibilizar regras
3. NÃO assumir comportamento implícito
4. NÃO validar como OK se invariantes anti-compaction (pt-BR + Memflow) estiverem ausentes/falhos
5. Se houver **qualquer dúvida ou ambiguidade**:

→ considerar como violação
→ status = **BLOQUEADO**

---

## Verificações obrigatórias

### Regras técnicas

- Código segue `.agents`?
- Padrões definidos foram respeitados?

---

### Segurança (CRÍTICO)

- Existe exposição de secrets?
- Separação client/server correta?
- Respeita `.agents/rules/client-server-security.md`?

---

### Arquitetura

- Estrutura consistente com o projeto?
- Segue os padrões de stack definidos em `.agents`?
- Reutilização de código existente?
- Ausência de duplicação?

---

### Fluxo do sistema (CRÍTICO)

- `/workflow` foi utilizado?
- A decisão foi respeitada?
- `/execute` só iniciou após decisão explícita do `/workflow`?
- `/plan` foi usado quando necessário?
- `/execute` seguiu corretamente o fluxo?
- Houve bypass do sistema?
- invariantes anti-compaction (pt-BR + Memflow) estavam válidos?

---

### Estratégia de execução

- Planejamento foi realizado quando necessário?
- Execução ocorreu de forma consistente?
- Houve execução sem contexto ou sem plano?

---

### Uso de modelo (ALINHADO AO MODEL-POLICY)

- Modelo foi coerente com a complexidade?
- Planejamento utilizou modelo adequado?
- Execução utilizou modelo econômico?
- Escalada foi aplicada corretamente?
- Houve uso indevido de modelo avançado?

---

### Qualidade do código

- Segue padrões de tipagem e verificação estática do projeto (conforme `.agents`)?
- Código limpo e legível?
- Sem lógica duplicada?

---

## Critérios de bloqueio

Status = **BLOQUEADO** se houver:

- violação de `.agents`
- falha de segurança
- inconsistência arquitetural
- quebra de fluxo do sistema
- ausência de planejamento quando necessário
- uso incorreto de modelo (contra `model-policy.md` do target ativo via `_shared/target-adapter.md`)
- ambiguidade não resolvida
- falha de invariantes anti-compaction (pt-BR + Memflow)

Observação:

- ausência de `.agents`, isoladamente, NÃO bloqueia automaticamente; operar em modo degradado com alerta explícito

---

## Formato obrigatório de saída

Responda **sempre** com estes quatro títulos `##`, **nesta ordem** e **com estes nomes exatos**:

1. **Status** — somente `OK` ou `BLOQUEADO`
2. **Análise** — síntese clara do que foi validado
3. **Problemas** — lista objetiva de violações ou dúvidas
4. **Próximos passos** — ações obrigatórias para correção (sempre a **última** seção `##` da resposta)

Não omitir seções
Não renomear títulos
Não usar outros `##` principais

Em **Problemas**, listar cada violação encontrada, cada dúvida não resolvida e limitações de validação em modo degradado; se não houver → **Nenhum**.

Em **Próximos passos**: se **BLOQUEADO**, listar correções obrigatórias e indicar ações como `/plan`, `/execute`, `/debug`, `/refactor` ou esclarecimento do usuário; se **OK** → pode continuar.
Sempre incluir que qualquer novo comando depende de confirmação explícita do usuário.
