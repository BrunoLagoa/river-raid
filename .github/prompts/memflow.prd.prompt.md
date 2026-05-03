---
name: prd
description: Transforma ideia ou problema em um PRD estruturado, mensurável e pronto para execução. Inclui definição estratégica, experiência do usuário, requisitos técnicos e critérios de validação. Base do sistema — alimenta /spec → /plan → /execute. Não implementa. Em ambiguidade ou trade-off, pode apresentar opções e bloqueia até decisão do usuário. Bloqueia se faltar informação ou houver ambiguidade não resolvida.
license: MIT
metadata:
  author: BrunoCastro
  version: "2.1.0"
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

Transformar uma ideia ou problema em um PRD:

- claro
- completo
- mensurável
- sem ambiguidades
- pronto para alimentar `/spec` e `/plan`
- utilizável como fonte única de verdade

---

## Integração com sistema

Este comando:

- é a base do sistema
- alimenta `/spec` → `/plan` → `/execute`
- influencia decisões do `/workflow`
- define escopo e limites do sistema

---

## Uso de modelo (ALINHADO AO MODEL-POLICY)

Este comando deve:

- utilizar modelo intermediário ou superior
- priorizar precisão sobre velocidade
- evitar inferências não validadas

---

## Entrada esperada

O usuário deve fornecer:

- ideia / problema
- contexto
- objetivo desejado

Se incompleto:
→ solicitar mais informações antes de continuar (OBRIGATÓRIO)

---

## Fase obrigatória: Discovery (ANTES DE GERAR PRD)

Antes de gerar o PRD, validar:

- Qual problema real está sendo resolvido?
- Por que isso é importante agora?
- Como o sucesso será medido?
- Existem restrições técnicas ou de negócio?

Se qualquer resposta estiver indefinida:
→ BLOQUEAR geração do PRD

### Ambiguidade, trade-offs e escolha do usuário

Quando houver **mais de uma interpretação válida**, **trade-off relevante** entre alternativas ou **conflito de escopo/comportamento** ainda não decidido pelo usuário:

- **Não** escolher sozinho a direção de produto, escopo ou comportamento esperado.
- Apresentar **2 a 4 opções** com prós e contras breves; pode incluir **recomendação fundamentada**, sem substituir a decisão do usuário.
- **BLOQUEAR** a geração (ou continuação) do PRD até o usuário **escolher uma opção** ou **definir critério decisório** explícito.

---

# Estrutura do PRD

---

## 1. Executive Summary

### Problem Statement
- Descrição objetiva do problema (1–2 frases)

### Proposed Solution
- Descrição objetiva da solução (1–2 frases)

### Success Criteria (KPIs obrigatórios)
- Métricas mensuráveis
- Devem conter valor numérico + condição

Exemplo:
- Tempo de resposta < 200ms em 95% dos casos
- Taxa de sucesso ≥ 90%

---

## 2. Contexto

- Cenário atual
- Impacto do problema
- Por que resolver isso agora

---

## 3. Objetivo

- Resultado esperado
- KPIs obrigatórios (não opcional)

---

## 4. Usuário e Experiência

### Personas
- Quem será impactado
- Dor atual

### User Stories (OBRIGATÓRIO)
Formato:
> As a [user], I want to [action] so that [benefit]

### Critérios de aceite por história (OBRIGATÓRIO)

**Escopo:** cada User Story acima.

- O que precisa ser verdadeiro para **aquela história** estar pronta (incluir referência à história).
- Casos positivos e negativos **no recorte da história** (comportamento, dados, permissões).
- **Não** repetir aqui a validação global da entrega ou do incremento — isso fica na seção **11** (nível PRD / release).

---

## 5. Escopo

### Inclui
- Lista clara do que será feito

### Non-Goals (OBRIGATÓRIO)
- O que NÃO será feito nesta fase
- Decisões conscientes de exclusão

---

## 6. Regras de negócio

- Regras obrigatórias
- Restrições
- Comportamentos esperados

---

## 7. AI Requirements (Se aplicável)

### Modelos e ferramentas
- LLMs utilizados
- APIs externas
- Ferramentas auxiliares

### Estratégia de fallback
- O que acontece em falhas

---

## 8. Estratégia de Avaliação

- Como validar qualidade
- Benchmarks
- Métricas de precisão
- Testes obrigatórios

Exemplo:
- ≥ 85% precisão
- ≤ 5% inconsistência

---

## 9. Especificação Técnica

### Arquitetura (alto nível)
- Fluxo de dados
- Componentes

### Integrações
- APIs
- Banco de dados
- autenticação

### Segurança
- tratamento de dados
- privacidade

---

## 10. Fluxo funcional

- Passo a passo da interação
- Comportamento do sistema

---

## 11. Critérios de aceite (nível PRD / release)

**Escopo:** conjunto da entrega, incremento ou objetivo deste PRD — não substitui os critérios **por história** da seção 4.

- Como validar sucesso **do todo** (demo, go-live, critérios de aceite de release).
- Casos positivos e de erro **transversais** (fluxos ponta a ponta, integrações, SLAs agregados, regressão esperada).
- Deve ser **consistente** com os critérios por história (seção 4); **não** contradizer.

---

## 12. Riscos e dependências

- Pontos indefinidos
- Dependências externas
- riscos técnicos

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
- Se KPIs não forem definidos → PARAR
- Se não houver Non-Goals → PARAR
- Se Discovery não foi realizado → PARAR
- Se existir ambiguidade/trade-off não resolvido e o usuário ainda não escolheu opção nem critério decisório (ver *Ambiguidade, trade-offs e escolha do usuário*) → PARAR

---

## Importante

- NÃO implementar
- NÃO gerar código
- NÃO assumir comportamento
- NÃO inventar requisitos
- Este comando define a base de todo o sistema

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
