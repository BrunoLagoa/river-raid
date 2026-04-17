---
name: prd
description: Transforma ideia ou problema em PRD com 8 seções (contexto, objetivo, persona, escopo, regras de negócio, fluxo funcional, critérios de aceite, riscos). Entrada: ideia + contexto + objetivo desejado. Base do sistema — alimenta /spec → /plan → /execute. Não implementa. Bloqueia se faltar informação ou houver ambiguidade.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.0.0"
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
  version: "1.0.0"
---

# Base de saída (referência normativa)

Aplicar obrigatoriamente este formato base de resposta em comandos do sistema:

## Idioma obrigatório

- Todas as respostas e comunicações devem ser em **Português do Brasil (pt-BR)**.

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

---

## Regras de uso

- Se um comando tiver formato próprio mais específico, ele pode estender este padrão.
- Em caso de conflito entre este arquivo e um comando específico, prevalece o comando específico.
### Conteúdo injetado: _shared/base-preconditions.md
---
description: Não é um comando executável. Base compartilhada de pré-condições.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.0.0"
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

## Regra de consistência global

- Nenhum comando pode executar sem contexto válido
- Nenhum comando pode ignorar memória disponível
- Evitar execução com contexto parcial ou inconsistente

---

## Resolução de caminhos (obrigatória)

- Regras de resolução de caminhos normativos e de `model-policy.md` devem seguir `_shared/target-adapter.md`.
- Nunca inferir caminhos fora do adaptador de target.
- Se o adaptador não estiver disponível:
  - reportar ausência
  - NÃO usar fallback

---

## Regra de precedência

- Este arquivo define o padrão global
- Comandos podem estender essas regras
- Em caso de conflito:
  → prevalece o comando específico

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
  version: "1.0.0"
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
- Em caso de conflito, prevalece o comando específico.
### Conteúdo injetado: _shared/target-adapter.vscode.md
---
description: Não é um comando executável. Adaptador de target para prompts gerados no VSCode.
license: MIT
hidden: true
metadata:
  author: BrunoCastro
  version: "1.0.0"
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
- Em caso de conflito com regra específica do comando:
  - prevalece o comando específico.

---

## Objetivo

Transformar uma ideia ou problema em um PRD:

- claro
- completo
- sem ambiguidades
- pronto para alimentar `/spec` e `/plan`

---

## Integração com sistema

Este comando:

- é a base do sistema
- alimenta `/spec` → `/plan` → `/execute`
- influencia decisões do `/workflow`

---

## Uso de modelo (ALINHADO AO MODEL-POLICY)

Este comando deve:

- utilizar modelo intermediário ou superior
- priorizar clareza e definição correta do problema

---

## Entrada esperada

O usuário deve fornecer:

- ideia / problema
- contexto
- objetivo desejado

Se incompleto:
→ solicitar mais informações antes de continuar

---

## Estrutura do PRD

### 1. Contexto

- Problema que está sendo resolvido
- Por que é importante

---

### 2. Objetivo

- Resultado esperado
- Métrica de sucesso (se possível)

---

### 3. Usuário / Persona

- Quem será impactado
- Dor atual

---

### 4. Escopo

#### Inclui:

- Lista clara do que será feito

#### Não inclui:

- O que está fora do escopo

---

### 5. Regras de negócio

- Regras obrigatórias
- Restrições
- Comportamentos esperados

---

### 6. Fluxo funcional

- Passo a passo da interação do usuário
- Comportamento do sistema

---

### 7. Critérios de aceite

- Como validar sucesso
- Casos positivos
- Casos de erro

---

### 8. Riscos e dúvidas

- Pontos indefinidos
- Dependências externas
- Possíveis conflitos

---

## Integração com `/spec` (CRÍTICO)

- Este PRD deve permitir criação de `/spec` sem suposições
- Se o `/spec` precisar assumir algo → PRD está incompleto

---

## Validação obrigatória

Antes de finalizar, responder:

- PRD está completo: SIM / NÃO
- Existem dúvidas abertas: (listar)
- Conflito com `.agents`: SIM / NÃO
- Conflito com `docs`: SIM / NÃO

---

## Regras de bloqueio

- Se houver ambiguidade → PARAR
- Se faltar informação → PARAR
- Se houver conflito com `.agents` → PARAR

---

## Formato obrigatório de saída

## Status

- PRD criado / Bloqueado

---

## Análise

### Clareza do problema

- bem definido / parcial / indefinido

---

### Qualidade do PRD

- completo / incompleto

---

### Pronto para especificação

- SIM / NÃO

---

## Problemas

- ambiguidades
- lacunas
- inconsistências

Se não houver:
→ Nenhum

---

## Próximos passos

Se completo:

- Seguir para `/spec`

Se incompleto:

- Ajustar PRD
- Solicitar mais informações

---

## Importante

- NÃO implementar
- NÃO gerar código
- NÃO assumir comportamento
- Este comando define a base de todo o sistema
