---
name: brainstorm
description: Brainstorming estruturado antes de qualquer implementação — explora o problema, gera 2 a 5 abordagens alternativas com prós/contras, riscos e recomendação. Saída: seções Status, Análise, Problemas e Próximos passos. Pré-requisito: /context. Próximo passo: /plan. Não implementa nada.
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

## Uso de ferramentas MCP

Se disponível:

### Serena MCP

- Utilize para:
  - entender a estrutura real do código
  - identificar padrões existentes
  - localizar implementações similares
  - validar suposições sobre arquitetura
- Priorizar:
  - find_symbol
  - find_referencing_symbols
  - search_for_pattern
- Evitar:
  - assumir estrutura sem validação
  - basear decisões apenas em nomes de arquivos

---

## Objetivo

Explorar múltiplas abordagens possíveis antes de definir uma solução.

---

## Regras

1. Baseie-se em:
  - `.agents` (restrições técnicas)
  - `docs` (objetivos do produto)
  - Serena MCP (quando disponível, para validar o código real)
2. NÃO escolha uma única solução ainda.
3. NÃO implemente nada.
4. Sempre que necessário:
  - validar suposições com Serena
  - evitar decisões baseadas apenas em contexto estático

---

## Formato obrigatório de saída

Responda **sempre** com estes quatro títulos `##`, **nesta ordem** e **com estes nomes exatos**:

1. **Status** — ex.: `Em exploração`, `Bloqueado (dúvida)`, `Pronto para /plan` (um valor claro).
2. **Análise** — conteúdo principal; use apenas `###` para subdividir (ver lista abaixo).
3. **Problemas** — violações a `.agents`, lacunas de contexto, riscos inaceitáveis; se não houver: **Nenhum**.
4. **Próximos passos** — ex.: perguntas ao usuário, rodar `/plan`, descartar opção X (ações concretas).

Não omita seções. Não renomeie os títulos.

---

## Produza (conteúdo de **Análise**)

Em **Análise**, inclua obrigatoriamente estas subseções `###`:

### Problema

- O que precisa ser resolvido

### Possíveis abordagens

- Liste 2 a 5 opções diferentes
- Sempre que possível:
  - basear em padrões reais do código (via Serena)

### Prós e contras

- Para cada abordagem

### Complexidade

- Baixa / Média / Alta (por abordagem ou síntese)

### Riscos

- Técnicos ou de negócio
- Considerar impacto no código existente

### Aderência ao projeto

- Compatível com `.agents`?
- Alinhado com `docs`?
- Coerente com o código atual (via Serena)?

### Recomendação

- Melhor opção (com justificativa)

### Confiança na recomendação

- Baixa / Média / Alta

---

## Regras específicas

- NÃO assumir arquitetura sem validar no código
- NÃO propor soluções que contradizem padrões existentes
- Se Serena estiver disponível:
  - validar pelo menos uma hipótese no código real
- Se Serena NÃO estiver disponível:
  - avisar limitação na análise

---

## Importante

- Se alguma abordagem violar `.agents` → DESCARTAR
- Se houver dúvida → PERGUNTAR
- NÃO implementar nada
- NÃO inferir comportamento sem evidência

---

## Final

Aguardar confirmação do usuário para seguir para `/plan`.
