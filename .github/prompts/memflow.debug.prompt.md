---
name: debug
description: Diagnóstico estruturado de bugs — classifica o erro (Simples/Estrutural/Crítico), lista causas por probabilidade e elege uma única causa mais provável com evidências. Não corrige. Integrado ao workflow e ao `model-policy.md` do target ativo (via `_shared/target-adapter.md`). Saída: Status, Análise, Problemas e Próximos passos. Próximo passo: /execute, /refactor ou /plan conforme classificação.
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

Analisar profundamente um erro, bug ou comportamento inesperado:

- identificar causa raiz
- priorizar hipóteses
- orientar investigação
- preparar base para correção segura

---

## Integração com sistema

Este comando:

- NÃO executa correções
- NÃO substitui `/execute`
- NÃO decide fluxo

Ele prepara para:

→ `/execute` (correção)
→ `/refactor` (melhoria estrutural)
→ `/plan` (quando necessário)

---

## Uso de modelo (ALINHADO AO MODEL-POLICY)

Este comando deve:

- utilizar modelo intermediário ou avançado
- priorizar qualidade de diagnóstico

---

## Regras

1. Basear análise em:
   - `.agents`
   - `docs`
   - comportamento esperado do sistema

2. NÃO implementar correções

3. Após hipóteses:
   - escolher **uma única causa mais provável**

---

## Classificação do erro

Classificar o erro como:

- **Simples**
  - erro isolado
  - baixo impacto

- **Estrutural**
  - envolve arquitetura
  - múltiplos pontos

- **Crítico**
  - segurança
  - dados
  - fluxo do sistema

---

## Formato obrigatório de saída

## Status

- Diagnóstico preliminar / Aguardando dados / Pronto para correção

---

## Análise

### Problema

- Descrição clara do erro

---

### Comportamento esperado

- Baseado em docs ou regras

---

### Classificação do erro

- Simples / Estrutural / Crítico

---

### Possíveis causas

- Lista ordenada por probabilidade

---

### Causa mais provável

- Apenas UMA
- Justificar com evidências
- Grau de confiança: baixa / média / alta
- O que confirmaria ou refutaria

---

### Análise técnica

- Onde está o problema:
  - arquivos
  - fluxo
  - lógica

---

### Impacto

- O que pode quebrar

---

### Plano de investigação

- Passos para validar
- Começar pela causa mais provável

---

## Problemas

- Dados insuficientes
- Incertezas
- Riscos de correção errada

Se não houver:
→ Nenhum

---

## Próximos passos

- Solicitar logs / repro (se necessário)
- Validar hipótese principal
- Após confirmação:
  → `/execute` (erro simples)
  → `/refactor` (erro estrutural)
  → `/plan` (erro complexo)

---

## Importante

- NÃO corrigir ainda
- NÃO pular investigação
- NÃO listar múltiplas causas sem priorizar
- Sempre indicar causa mais provável
