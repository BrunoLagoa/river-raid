---
name: review-enforce-rules
description: Validação rígida adicional (opcional/recomendada) para cenários críticos — valida conformidade total com .agents, segurança client/server, arquitetura, fluxo do sistema e `model-policy.md` do target ativo (via `_shared/target-adapter.md`). Saída exclusiva: OK ou BLOQUEADO. Qualquer dúvida ou ambiguidade = BLOQUEADO. Não flexibiliza regras. Executar após /review quando necessário.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.1.0"
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

4. Se houver **qualquer dúvida ou ambiguidade**:

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
