---
name: workflow
description: Orquestrador central — decide execução, validação e adapta comportamento com base em decisões, métricas, insights e sugestões assistidas, com controle de previsibilidade e evolução. É a única fonte de decisão de estratégia para /execute.
license: MIT
metadata:
  author: BrunoCastro
  version: "9.2.0"
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
  version: "1.1.0"
---

# Base de saída (referência normativa)

Aplicar obrigatoriamente este formato base de resposta em comandos do sistema:

## Idioma obrigatório

- Todas as respostas e comunicações devem ser em **Português do Brasil (pt-BR)**.

## Regras de uso

- Se um comando tiver formato próprio mais específico, ele pode estender este padrão.
- Campos que podem ser especializados por comando:
  - vocabulário de `Status`
  - subseções internas de `Análise` e `Problemas`
- Invariantes não sobrescrevíveis:
  - resposta em pt-BR
  - seção `## Próximos passos` como último `##`
  - continuidade do fluxo somente em `## Próximos passos`
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
  version: "1.2.0"
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
  version: "1.1.0"
---

# Adaptador de target (VSCode)

Aplicar este adaptador quando o target ativo for `vscode`.

## Resolução normativa

- Em prompts gerados para VSCode, as bases normativas `_shared/*.md` devem ser tratadas como conteúdo local injetado no próprio prompt.
- Não aplicar resolução por caminhos globais/locais de OpenCode.
- `model-policy.md` deve ser interpretado no contexto do prompt gerado para VSCode.

## Ausência de conteúdo

- Se uma base normativa necessária não estiver presente no prompt gerado:
  - reportar ausência
  - bloquear execução crítica

## Precedência

- Este adaptador define a resolução para `vscode`.
- Comandos podem estender regras operacionais sem remover os requisitos deste adaptador.
- Invariantes não sobrescrevíveis:
  - `_shared/*.md` devem estar injetados no prompt
  - `model-policy.md` deve ser interpretado no contexto do prompt
  - ausência de base normativa necessária bloqueia execução crítica

---

## Objetivo

Decidir:

- execução (/execute ou /plan)
- validação (/review, /review-code)
- modelo
- adaptação inteligente baseada em histórico

---

## Base de decisão

- decisions.md
- quality-metrics.md
- decision-suggestions.md
- model-policy

---

# 🆕 Prioridade de decisão (CRÍTICO)

Ordem obrigatória:

1. **decisions.md (sempre prevalece)**
2. **regras do workflow**
3. **insights (ajuste leve)**
4. **decision-suggestions (modo assistido)**

---

## Regras

- decisões explícitas NUNCA podem ser sobrescritas  
- insights apenas ajustam comportamento  
- sugestões NUNCA executam automaticamente  
- em caso de conflito → respeitar ordem acima  
- `/workflow` é a única origem de decisão de estratégia (`/execute` vs `/plan`)

---

# Etapa 0 — Decisões existentes

- verificar decisões anteriores  
- priorizar por score  
- detectar conflitos  

---

# Etapa 0.5 — Métricas

Se existir:

- taxa aprovação  
- taxa reprovação  
- retrabalho médio  

---

# Etapa 0.6 — Insights

Detectar:

- baixa clareza  
- alta complexidade  
- integrações externas  
- alto retrabalho  

---

# Etapa 0.7 — Decision Suggestions

Se existir:

.agents/memory/decision-suggestions.md

---

## Analisar sugestões

Para cada sugestão:

- título  
- recomendação  
- impacto  
- confiança  

---

## Critérios de ativação

- confiança ≥ média  
- impacto ≥ médio  

---

## 🆕 Limite de uso (CRÍTICO)

- considerar no máximo **2 sugestões por execução**

---

## Modo assistido

- NÃO aplicar automaticamente  
- apenas sugerir  

---

# 🆕 Aplicação de sugestão (INLINE 🔥)

Quando uma sugestão for apresentada:

### O usuário pode decidir:

- **aplicar**
- **ignorar**

---

## Se aplicar:

- converter recomendação em decisão  
- registrar em `decisions.md`  
- remover da lista de sugestões  
- registrar via `/memory-save`  

---

## Se ignorar:

- manter sugestão (ou permitir expiração natural)  

---

## Importante

- aplicação deve ser explícita  
- nunca automática  
- deve gerar rastreabilidade  

---

## Resultado

Adicionar no output:

## Sugestões relevantes

- título: <nome>
- recomendação: <texto>
- ação disponível:
  - aplicar
  - ignorar  

---

# Etapa 1 — Classificação da tarefa

- Complexidade: baixa / média / alta  
- Impacto: baixo / médio / alto  
- Risco: baixo / médio / alto  
- Clareza: alta / média / baixa  

---

# Etapa 2 — Decisão de execução

---

## EXECUÇÃO DIRETA

- baixa complexidade  
- baixo risco  
- alta clareza  

---

## EXECUÇÃO COM /plan

- média/alta complexidade  
- risco médio/alto  
- baixa clareza  

---

## Ajuste por insights

- baixa clareza → FORÇAR /plan  
- alta complexidade → priorizar /plan  
- retrabalho alto → evitar execução direta  

---

# Etapa 3 — Estratégia de validação

---

## /review

- SEMPRE obrigatório  

---

## /review-code

Obrigatório quando:

- código modificado  
- risco ≥ médio  
- integração externa  
- mudança arquitetural  
- sugestão indicar risco técnico  

---

## Ajuste por insights

- integração externa → FORÇAR /review-code  
- histórico de erro alto → reforçar validação  

---

# Etapa 4 — Gate de qualidade

---

## BLOQUEAR

- review = Reprovado  
- review-code = Reprovado  

---

## PERMITIR COM RESSALVAS

- qualquer “com ressalvas”  

---

## APROVAR

- ambos aprovados  

---

# Etapa 5 — Orquestração de modelo

- modelo econômico por padrão  
- escalar quando necessário  

---

# Etapa 6 — Controle de consistência

- NÃO ignorar decisões  
- NÃO ignorar métricas  
- NÃO ignorar insights  
- NÃO ignorar sugestões  
- limitar influência de sugestões  

---

# Integração

- /execute  
- /review  
- /review-code  
- /memory-save  

---

# Regras

- NÃO implementar  
- NÃO permitir bypass  
- NÃO ignorar risco  
- exigir retorno ao `/workflow` se decisão estiver ausente

---

# Importante

- decisões são soberanas  
- insights ajustam  
- sugestões orientam  
- sistema deve permanecer previsível  

---

# Formato de saída

## Status

- Decisão tomada  

---

## Análise

### Classificação

- Complexidade:
- Impacto:
- Risco:
- Clareza:

---

### Métricas

- disponíveis: SIM / NÃO  
- taxa_reprovação:

---

### Insights

- sinais detectados:

---

### Sugestões

- lista de sugestões relevantes  
- ações disponíveis: aplicar / ignorar  

---

### Estratégia

- Execução: Direta / Planejada  
- Validação:

---

## Problemas

- ambiguidades  
- riscos  

Se não houver:
→ Nenhum  

---

## Próximos passos

1. /execute ou /plan  
2. /review  
3. /review-code  
4. /memory-save  
