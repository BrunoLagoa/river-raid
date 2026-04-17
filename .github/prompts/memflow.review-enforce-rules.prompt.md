---
name: review-enforce-rules
description: Validação rígida adicional (opcional/recomendada) para cenários críticos — valida conformidade total com .agents, segurança client/server, arquitetura, fluxo do sistema e `model-policy.md` do target ativo (via `_shared/target-adapter.md`). Saída exclusiva: OK ou BLOQUEADO. Qualquer dúvida ou ambiguidade = BLOQUEADO. Não flexibiliza regras. Executar após /review quando necessário.
license: MIT
metadata:
  author: BrunoCastro
  version: "1.0.0"
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

Garantir que:

- nenhuma regra de `.agents` foi violada
- a implementação é segura
- a arquitetura foi respeitada
- o workflow do sistema foi seguido corretamente
- o uso de modelos está alinhado com `model-policy.md` do target ativo (via `_shared/target-adapter.md`)

Este é um **gate rígido opcional**, recomendado antes da conclusão em tarefas de maior risco ou criticidade.

---

## Formato obrigatório de saída

Responda **sempre** com estes quatro títulos `##`, **nesta ordem** e **com estes nomes exatos**:

1. **Status** — somente `OK` ou `BLOQUEADO`
2. **Análise** — síntese clara do que foi validado
3. **Problemas** — lista objetiva de violações ou dúvidas
4. **Próximos passos** — ações obrigatórias para correção

Não omitir seções
Não renomear títulos
Não usar outros `##` principais

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

## Problemas

Listar:

- cada violação encontrada
- cada dúvida não resolvida
- limitações de validação (modo degradado)

Se não houver:
→ Nenhum

---

## Próximos passos

Se Status = BLOQUEADO:

- listar correções obrigatórias
- indicar ações como:
  - `/plan`
  - `/execute`
  - `/debug`
  - `/refactor`
  - esclarecimento do usuário

---

Se Status = OK:

→ Pode continuar

---

## Importante

- Este comando é uma validação rígida opcional
- NÃO permitir continuidade com dúvidas
- NÃO aprovar parcialmente
- NÃO ignorar inconsistências
- Deve garantir consistência total do sistema

Este comando complementa validações anteriores com um critério mais estrito.
