---
name: plan
description: Cria plano de implementação detalhado quando /workflow decide PLANEJAR PRIMEIRO, alinhado a `model-policy.md` do target ativo (via `_shared/target-adapter.md`) — sequência de passos, arquivos afetados, impacto, riscos e critérios de sucesso. Não escreve código. Saída: Status (Plano criado/Bloqueado), Análise com 9 subseções, Problemas e Próximos passos. Bloqueia se houver ambiguidade. Próximo passo: /execute.
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

Criar um plano de implementação:

- claro
- completo
- sem ambiguidades
- pronto para execução via `/execute`

---

## Integração com sistema (CRÍTICO)

Este comando:

- DEVE ser usado quando `/workflow` decidir → PLANEJAR PRIMEIRO
- NÃO deve ser usado fora desse contexto sem validação

---

## Uso de ferramentas MCP

Se disponível:

### Serena MCP (PRIORIDADE)

- validar estrutura real do código
- identificar pontos exatos de implementação
- localizar arquivos e dependências
- evitar duplicação

Priorizar:

- find_symbol
- find_referencing_symbols
- search_for_pattern
- get_symbols_overview

Evitar:

- assumir estrutura
- planejar arquivos inexistentes

---

## Uso de modelo (ALINHADO AO MODEL-POLICY)

Este comando deve:

- utilizar modelo mais inteligente (ex: GPT-5.4)
- priorizar qualidade sobre custo

---

### Regra principal

- Planejamento → modelo mais forte
- Execução → modelo mais econômico

---

## Regras obrigatórias

1. Basear-se em:
   - `.agents` (quando disponível)
   - `docs`
   - `model-policy.md` resolvido pelo target ativo (via `_shared/target-adapter.md`)
   - estrutura real (via Serena, se disponível)
   - resolver `model-policy.md` com as regras do target ativo (via `_shared/target-adapter.md`)

2. NÃO escrever código

3. NÃO assumir comportamento não definido

4. Se houver ambiguidade → PARAR

5. Se houver conflito → PARAR

---

## Validação antes de planejar

Antes de gerar o plano:

- O problema está claro?
- O escopo está definido?
- Existe contexto suficiente?

Se NÃO:
→ PARAR e solicitar esclarecimento

---

## Formato obrigatório de saída

## Status

- Plano criado / Bloqueado

---

## Análise

### Entendimento

- O que precisa ser feito

---

### Regras aplicáveis

- `.agents` relevantes (ou ausência em modo degradado)
- segurança (se aplicável)

---

### Estratégia

- abordagem de alto nível
- alinhamento com arquitetura existente

---

### Passos de implementação

- sequência clara e executável
- baseada em estrutura real (quando possível)
- quando a atividade for grande, sugerir divisão em tarefas menores/subtarefas para facilitar execução

---

### Arquivos afetados

- arquivos a criar ou alterar
- validar com Serena (se disponível)

---

### Impacto

- áreas afetadas
- dependências envolvidas

---

### Riscos

- técnicos
- de negócio
- efeitos colaterais

---

### Critérios de sucesso

- como validar após `/execute`

---

### Fora de escopo

- o que NÃO será feito

---

### Confiança no plano

- Baixa / Média / Alta

---

### Modo de operação

- Normal / Degradado
- Impacto da ausência de `.agents` (quando aplicável)

---

## Problemas

- ambiguidades
- falta de contexto
- conflitos com `.agents` ou `docs`
- limitações de Serena

Se não houver:
→ Nenhum

---

## Próximos passos

- Aguardar confirmação
- Ajustar plano (se necessário)
- Seguir para `/execute`

---

## Modelo recomendado

- Modelo: (ex: GPT-5.4)
- Justificativa:
  - complexidade
  - impacto
  - risco

---

## Regras específicas

- NÃO planejar com base em suposição
- NÃO criar arquivos sem validar necessidade
- NÃO ignorar padrões existentes
- Sugestão: se a atividade envolver muitas áreas, arquivos ou dependências, quebrar em tarefas menores/subtarefas para facilitar desenvolvimento, validação e acompanhamento

---

## Limitações

Se Serena NÃO estiver disponível:

- avisar limitação
- planejar com base nos arquivos disponíveis

Se `.agents` NÃO estiver disponível:

- avisar limitação
- manter plano em modo degradado
- não bloquear automaticamente por esse motivo

---

## Bloqueios

- Falta de contexto → PARAR
- Ambiguidade → PARAR
- Conflito com `.agents` (quando existir) → PARAR
- Estrutura desconhecida → PARAR

---

## Importante

- NÃO implementar
- NÃO avançar sem clareza total
- NÃO seguir para `/execute` sem validação
- Este comando define a qualidade da execução
