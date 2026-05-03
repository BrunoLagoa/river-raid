---
name: context
description: Primeiro comando do fluxo — carrega memória (decisões, estado e métricas), interpreta padrões e prepara contexto inteligente para o /workflow.
license: MIT
metadata:
  author: BrunoCastro
  version: "8.1.0"
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

## Carregar contexto

---

# Memória persistente (ALTA PRIORIDADE)

Se existir:

- .agents/memory/memory.md
- .agents/memory/session-memory.md
- .agents/memory/decisions.md
- .agents/memory/quality-metrics.md

---

# Uso da memória

## Fonte primária (CRÍTICO)

- memory.md → identidade
- decisions.md → decisões

---

## Fonte secundária

- quality-metrics.md → desempenho

---

## Regra de confiança

Se existirem:

- memory.md
- decisions.md

→ memória confiável

---

# 🧠 Interpretação de métricas

Se existir:

.agents/memory/quality-metrics.md

---

## Extrair:

- taxa_aprovacao
- taxa_reprovacao
- observações

---

## Classificação de qualidade

- qualidade_alta → erro < 10%
- qualidade_media → 10–30%
- qualidade_baixa → >30%

---

# 🆕 Interpretação de padrões (INSIGHTS 🔥)

Se existirem observações:

Exemplo:

- "tasks com baixa clareza falham mais"
- "integrações externas têm alto erro"

---

## Gerar sinais estratégicos

Converter observações em sinais:

### Tipos de sinal:

- risco_alto_por_clareza
- risco_alto_por_integracao
- necessidade_de_planejamento
- necessidade_de_validacao_reforcada

---

## Resultado interno

Preparar estrutura:

- qualidade: alta | media | baixa
- sinais:
  - lista de sinais detectados

---

## Regras

- NÃO decidir ação
- NÃO modificar fluxo
- NÃO bloquear execução
- apenas enriquecer contexto

---

# Modo otimizado

Se memória confiável:

---

## NÃO fazer:

- varrer projeto
- carregar docs
- ler código sem necessidade

---

## FAZER:

- carregar memória
- interpretar métricas
- interpretar sinais
- usar Serena otimizado

---

# Modo fallback

Se memória ausente:

- comportamento padrão

---

# Contexto principal

- .agents/**
- AGENTS.md

---

# Contexto sob demanda

- docs
- código
- configs

---

# Integração MCP

(mantido)

---

# Prioridade de fontes

1. memory.md  
2. decisions.md  
3. quality-metrics.md  
4. .agents  
5. Serena  
6. docs  
7. código  

---

# Regras obrigatórias

- memória é fonte primária
- métricas são suporte
- sinais NÃO substituem regras
- evitar leitura desnecessária

---

# Saída

---

## 🟢 Ultra-light

- Contexto: OK
- Memória: carregada
- Métricas: SIM/NÃO
- Qualidade: alta/media/baixa
- Sinais: nenhum / detectados

---

## Status

- Contexto: OK / Falhou
- Memória: SIM / NÃO
- Métricas: SIM / NÃO
- Modo: Normal / Degradado / Otimizado

---

## Resumo

- uso da memória
- uso de métricas
- sinais detectados

---

## Estado do fluxo

- Etapa: context

---

# Regras de consistência

- NÃO decidir execução
- NÃO aplicar métricas diretamente
- NÃO aplicar sinais diretamente
- SEMPRE delegar para /workflow

---

# Limitações

- observações podem ser incompletas
- sinais dependem da qualidade dos dados
- ausência de sinais não indica ausência de problema

---

# Importante

- NÃO implementar
- NÃO decidir fluxo
- sinais são apoio estratégico

---

## Próximos passos

- Executar /workflow
