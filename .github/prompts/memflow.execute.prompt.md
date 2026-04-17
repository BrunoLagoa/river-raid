---
name: execute
description: Implementa código com base na decisão do /workflow respeitando `model-policy.md` do target ativo (via `_shared/target-adapter.md`) — executa direto ou bloqueia e exige /plan. Inclui recomendação inteligente de persistência de memória ao final.
license: MIT
metadata:
  author: BrunoCastro
  version: "3.0.0"
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

Executar a implementação:

- respeitando a decisão do `/workflow`
- seguindo `model-policy.md` resolvido pelo target ativo (via `_shared/target-adapter.md`)
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
- NÃO → aplicar fallback controlado

---

## Fallback controlado

Classificar:

- Complexidade
- Impacto
- Risco

---

### EXECUTAR DIRETO se:

- baixa complexidade
- baixo impacto
- baixo risco

---

### EXIGIR `/plan` se:

- média ou alta complexidade
- médio ou alto impacto
- médio ou alto risco

---

### Se exigir plano:

- Status: Parcial
- Motivo: ausência de planejamento
- Próximo passo: `/plan`

E PARAR.

---

## Integração com `/workflow`

- EXECUTAR DIRETO → executar
- PLANEJAR → bloquear e exigir `/plan`

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

Se erro:
→ corrigir automaticamente

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

## Persistência sugerida (AUTO MEMORY)

Após a execução, avaliar se há conteúdo relevante para memória.

---

### Avaliação de relevância

Verificar se houve:

- decisões técnicas
- mudanças relevantes
- padrões definidos
- escolhas arquiteturais
- contexto útil para futuras sessões

---

### Detecção de decisões

Identificar padrões como:

- “vamos usar…”
- “decidimos…”
- “padronizar…”
- “não usar mais…”
- “a partir de agora…”

---

## Score de relevância (0–100)

Calcular com base nos critérios:

- Mudança de stack: +40
- Decisão arquitetural: +30
- Definição de padrão global: +20
- Impacto em múltiplos arquivos: +10
- Mudança local relevante: +5
- Ajuste trivial: 0

Regras:

- Somar apenas critérios aplicáveis
- Limite máximo: 100
- Não duplicar critérios equivalentes

---

## Interpretação do score

- 0–20   → Não salvar
- 21–50  → Pode salvar
- 51–80  → Recomendar salvar
- 81–100 → Recomendar fortemente salvar

---

## Resultado da avaliação

### Se score >= 51:

Recomendar:

→ Executar `/memory-save`

---

### Se score < 51:

Recomendar:

→ Não é necessário salvar

---

## Formato obrigatório de saída

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

## Próximos passos

- `/review`
- `/review-enforce-rules` (opcional/recomendado em cenários críticos)
- `/test-plan` (se aplicável)
- Se `/review` não for executado: rodar check silencioso de versão do MEMFLOW ao final (exibir aviso somente quando houver atualização)
- Executar check de versão usando comandos remotos (sem depender de binário local no PATH):
  - macOS/Linux: `curl -fsSL https://raw.githubusercontent.com/BrunoLagoa/memflow-command-system/main/scripts/install.sh | bash -s -- check --non-interactive`
  - Windows/PowerShell: `powershell -ExecutionPolicy Bypass -Command "iwr https://raw.githubusercontent.com/BrunoLagoa/memflow-command-system/main/scripts/install.ps1 -OutFile $env:TEMP\install.ps1; & $env:TEMP\install.ps1 check -NonInteractive"`

---

## Persistência sugerida

- Score de relevância: X/100
- Conteúdo relevante detectado: SIM / NÃO
- Decisões detectadas: SIM / NÃO
- Recomendação:
  - Executar `/memory-save`
  - Não necessário salvar

---

## Bloqueios

- Plano necessário → PARAR
- Conflito com `.agents` → PARAR
- Falta de contexto → PARAR

---

## Importante

- NÃO decidir estratégia
- NÃO pular validações
- NÃO finalizar com erro
- NÃO executar sem entendimento
