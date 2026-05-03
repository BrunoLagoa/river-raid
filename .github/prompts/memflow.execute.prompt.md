---
name: execute
description: Implementa código com base na decisão do /workflow respeitando `model-policy.md` do target ativo. Sem decisão explícita do /workflow, bloqueia e retorna para orquestração. Inclui integração com persistência inteligente e métricas de qualidade.
license: MIT
metadata:
  author: BrunoCastro
  version: "3.2.0"
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

---

## Próximos passos

- `/review`  
- `/review-code` (se aplicável)  
- `/memory-save` (recomendado após validação)  
- `/review-enforce-rules` (opcional)  
- `/test-plan` (se aplicável)  
