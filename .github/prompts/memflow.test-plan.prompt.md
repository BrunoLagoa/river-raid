---
name: test-plan
description: Gera plano de testes completo com cenários principais, casos de borda, segurança e regressão — detecta automaticamente o executor da stack (Vitest, Jest, Playwright, Pytest, RSpec) e inclui comandos concretos de execução. Saída: Status, Análise com executor detectado e comandos reais, Problemas e Próximos passos. Incompleto sem lista de execução concreta.
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
- Resolver essas referências conforme `_shared/target-adapter.md` (sem fallback fora do target ativo).

---

## Objetivo

Criar um plano de testes completo e alinhado ao projeto.

---

## Base

- `.agents` → regras técnicas
- `docs` → regras de negócio

---

## Produza:

## Cenários principais
- Fluxos principais do sistema

## Casos de teste
- Lista detalhada

## Casos de borda
- Edge cases

## Segurança
- Testes de segurança (se aplicável)

## Regressão
- O que precisa ser garantido

## Estratégia
- Como testar (manual, unitário, e2e)

## Detecção de stack e executor (OBRIGATÓRIO)

Antes de definir comandos, identificar:

- Runtime principal e linguagem do projeto
- Executor(es) de teste configurados (Vitest, Jest, Playwright, Pytest, RSpec, etc.)
- Comandos reais disponíveis no repositório (scripts/config/documentação)

## Execução dos testes (após o plano)

Sempre incluir:

- **Quais testes executar**: caminhos de arquivos, pastas, suítes ou filtros relevantes
- **Comandos concretos** para rodar só o necessário, conforme stack detectada
- **Mapeamento** de cada cenário crítico para ao menos um teste/filtro (ou marcar “criar teste”)

### Se usar Vitest

- Exemplos:
  - `npx vitest run <caminho/do/arquivo.test.ts>`
  - script do projeto (ex.: `npm run test -- <args>`)

### Se NÃO usar Vitest

- Avisar explicitamente
- Informar executor real e comandos equivalentes com o mesmo nível de detalhe
- Exemplos possíveis:
  - Jest: `npx jest <caminho/ou/filtro>`
  - Playwright: `npx playwright test <caminho/ou/grep>`
  - Pytest: `pytest <caminho/ou-k>`
  - RSpec: `bundle exec rspec <caminho/ou-tag>`

---

## Formato obrigatório de saída

Responda SEMPRE com:

## Status

- Plano de testes criado / Bloqueado

---

## Análise

- Cenários cobertos
- Estratégia de teste
- Executor(es) detectados
- Comandos concretos de execução

---

## Problemas

- Lacunas de cobertura
- Falta de contexto
- Se não houver: Nenhum

---

## Próximos passos

- Executar testes listados
- Ajustar plano (se necessário)

---

## Importante

- Priorize cenários críticos
- Se faltar contexto → AVISAR
- Não assumir Node/npm quando não for a stack do projeto
- Plano sem **lista de execução concreta do executor detectado** → **incompleto**; não tratar o passo como encerrado até isso constar na resposta
