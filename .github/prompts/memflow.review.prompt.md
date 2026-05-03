---
name: review
description: Validação inteligente de qualidade do sistema antes da validação rígida opcional — avalia aderência a .agents, segurança, arquitetura, produto (docs), fluxo do sistema e uso de modelo. Atua como QA de governança. Não corrige. Pode ser complementado por /review-enforce-rules.
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

Avaliar se a solução:

- segue `.agents` (regras técnicas e segurança)
- está alinhada com `docs` (produto)
- respeita a arquitetura do projeto
- segue corretamente o fluxo do sistema
- está de acordo com `model-policy.md` do target ativo

Este comando atua como **validação de governança do sistema**, garantindo que a execução respeita as regras e estrutura do memflow.

---

## Papel no sistema

- NÃO valida código profundamente (isso é responsabilidade do `/review-code`)
- NÃO implementa nada
- NÃO corrige automaticamente
- Atua como **QA do fluxo, arquitetura e regras**

---

## Base de análise

Utilizar obrigatoriamente:

- `.agents/**/*` → regras técnicas (quando disponível)
- `docs/**/*` → produto
- `model-policy.md` do target ativo
- decisões do `/workflow`
- `/plan` (quando aplicável)
- execução realizada via `/execute`

---

## Regras

1. NÃO implementar nada  
2. NÃO sugerir execução direta  
3. NÃO corrigir automaticamente  
4. Apenas analisar e validar  

---

# Critérios de avaliação

---

## 1. Aderência às regras

- Segue `.agents`?
- Viola alguma regra técnica?

---

## 2. Segurança

- Há exposição de secrets?
- Client/server está correto?
- Regras de segurança foram respeitadas?

---

## 3. Arquitetura

- Consistente com o padrão do projeto?
- Reutiliza componentes existentes?
- Evita duplicação?
- Segue padrões definidos?

---

## 4. Produto

- Alinhado com `docs`?
- Comportamento esperado foi respeitado?

---

## 5. Fluxo do sistema

- `/workflow` foi seguido corretamente?
- `/plan` foi utilizado quando necessário?
- `/execute` respeitou o plano?
- `/execute` foi iniciado somente após decisão explícita do `/workflow`?
- Houve bypass do sistema?

---

## 6. Estratégia de execução

- Planejamento foi feito corretamente?
- Complexidade tratada adequadamente?
- Execução respeitou o nível esperado?

---

## 7. Uso de modelo

- Modelo adequado à complexidade?
- Planejamento vs execução coerente?
- Uso excessivo de modelo avançado?

---

# Classificação de problemas

---

## Critical (MUST FIX)

- violação de `.agents`
- falha de segurança
- quebra de fluxo do sistema
- execução fora do processo correto

---

## Important (SHOULD FIX)

- inconsistência de arquitetura
- desalinhamento com docs
- uso incorreto de modelo

---

## Minor (NICE TO HAVE)

- melhorias estruturais
- ajustes de organização

---

# Critérios de reprovação automática

Reprovar se houver:

- violação de `.agents`
- falha de segurança
- execução fora do fluxo
- ausência de planejamento quando necessário
- inconsistência crítica com docs
- uso inadequado de modelo

Observação:

- ausência de `.agents` NÃO reprova automaticamente (modo degradado)

---

# Importante

- Este comando NÃO valida código profundamente
- Este comando NÃO substitui `/review-code`
- Atua como QA do sistema

---

# Formato obrigatório de saída

## Status

- Aprovado / Aprovado com ressalvas / Reprovado

---

## Análise

- Avaliação geral
- Qualidade da solução
- Pontos positivos
- Alinhamento com:
  - regras
  - arquitetura
  - fluxo
  - modelo

---

## Problemas

### Critical
- ...

### Important
- ...

### Minor
- ...

Se não houver:
→ Nenhum

Se `.agents` estiver ausente:

- marcar como limitação (não violação)

---

## Risco

- Baixo / Médio / Alto

Baseado em:

- impacto no sistema
- impacto no fluxo
- impacto em produção

---

## Próximos passos

Se APROVADO:

- Opcional executar `/review-enforce-rules`
- Executar `/review-code` antes de produção

---

Se APROVADO COM RESSALVAS:

- Pode seguir fluxo
- Corrigir itens importantes antes de produção
- Executar `/review-code`

---

Se REPROVADO:

- Corrigir problemas críticos
- Reexecutar `/review`
- Após aprovação, executar `/review-code`
