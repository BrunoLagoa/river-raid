---
name: workflow
description: Comando central do sistema — classifica a tarefa e decide execução, considerando decisões, score e possíveis conflitos na memória do projeto.
license: MIT
metadata:
  author: BrunoCastro
  version: "4.0.0"
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

Decidir automaticamente:

1. Fluxo de execução:
   - `/execute`
   - `/plan`

2. Modelo ideal

3. Estratégia de execução

4. Respeitar decisões já tomadas (memória)

5. Priorizar decisões com base em score

6. Detectar conflitos antes de decidir

---

## Base de decisão

Utilizar obrigatoriamente:

- `.agents`
- `docs`
- `.agents/memory/decisions.md`
- `model-policy.md` resolvido pelo target ativo (via `_shared/target-adapter.md`)

---

## Etapa 0 — Verificação de decisões existentes (CRÍTICO)

Antes de qualquer classificação:

- Verificar `.agents/memory/decisions.md` (se existir)

Pergunta obrigatória:

> Já existe decisão registrada sobre este assunto?

---

### Se SIM:

#### Regra de versionamento

Se houver múltiplas decisões sobre o mesmo tema:

- priorizar a versão mais recente (pela data)
- priorizar entradas com "(update)"
- ignorar versões antigas

---

#### Leitura de score

Identificar o score da decisão mais recente.

---

#### Regra de prioridade por score

- Score 81–100:
  - decisão crítica
  - NÃO permitir redefinição

- Score 51–80:
  - decisão relevante
  - evitar redefinição, salvo forte justificativa

- Score 21–50:
  - decisão fraca
  - pode ser ajustada

- Score 0–20:
  - decisão irrelevante
  - pode ser ignorada

---

#### Detecção de conflito

Verificar se existem decisões incompatíveis sobre o mesmo tema.

Exemplos:

- múltiplas tecnologias conflitantes
- definições divergentes de arquitetura
- escolhas exclusivas entre si

---

### Se conflito detectado:

- NÃO decidir automaticamente
- sinalizar inconsistência
- recomendar revisão

---

### Ação (sem conflito)

- reutilizar decisão mais recente conforme score
- NÃO redefinir sem necessidade

---

### Se NÃO existir decisão:

- seguir fluxo normal

---

## Priorização de skills

(sem alteração)

---

## Classificação da tarefa

(sem alteração)

---

## Decisão de fluxo

(sem alteração)

---

## Orquestração de modelo

(sem alteração)

---

## Controle de fluxo

(sem alteração)

---

## Integração com sistema

- `/execute` deve respeitar esta decisão
- `/plan` deve ser seguido quando necessário

---

## Regras de consistência

- NÃO redefinir decisões fortes (score alto)
- SEMPRE verificar memória antes de decidir
- SEMPRE utilizar a decisão mais recente
- NÃO ignorar conflitos detectados

---

## Formato obrigatório de saída

## Status

- Decisão tomada
- Bloqueado por conflito (se aplicável)

---

## Análise

### Classificação

- Complexidade:
- Impacto:
- Risco:
- Clareza:

---

### Memória

- Decisão existente detectada: SIM / NÃO
- Score da decisão: X/100
- Tipo de decisão:
  - Atual
  - Atualizada (update)
- Conflito detectado: SIM / NÃO
- Ação tomada:
  - Reutilizada
  - Ajustada
  - Nova decisão
  - Bloqueada

---

### Avaliação geral

- Interpretação da tarefa
- Justificativa da decisão
- Uso do score
- Consideração de conflitos
- Modo de operação

---

## Problemas

- Ambiguidades
- Riscos
- Conflitos detectados
- Falta de contexto

Se não houver:
→ Nenhum

---

## Próximos passos

Se conflito:

- Revisar decisões no `.agents/memory/decisions.md`

Se EXECUTAR DIRETO:

- Executar `/execute`

Se PLANEJAR PRIMEIRO:

- Executar `/plan`

---

## Modelo recomendado

- Nível:
- Modelo principal:
- Justificativa

### Modelos alternativos (mesmo nível)

- ...

### Regra de fallback

- Se o modelo principal não estiver disponível, usar a primeira alternativa disponível do mesmo nível.
- Se nenhuma alternativa do mesmo nível estiver disponível, escalar de nível apenas quando risco/complexidade justificarem.
- Ordem de tentativa recomendada: principal → alternativa 1 → alternativa 2.

---

## Estratégia de execução

- Direta / Planejada
- Necessidade de escalada
- Risco de falha

---

## Regras

- NÃO implementar
- NÃO pular análise
- NÃO ignorar decisões existentes
- NÃO ignorar score
- NÃO ignorar conflitos

---

## Importante

- Este comando é stateful
- Deve respeitar memória do projeto
- Evita decisões duplicadas
- Usa score para priorização
- Detecta conflitos antes de decidir
