---
name: memory-save
description: Salva o estado da sessão e decisões relevantes — com detecção automática de decisões, validação de relevância, score, versionamento e gerenciamento de dashboard de decisões.
license: MIT
metadata:
  author: BrunoCastro
  version: "7.0.0"
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

Salvar o estado atual da sessão e preservar decisões importantes sem poluir a memória.

Gerenciar automaticamente o arquivo `.agents/memory/decisions.md` como dashboard estruturado com histórico de decisões.

---

## Etapa 1 — Validação de relevância (OBRIGATÓRIA)

Antes de salvar, analisar:

### NÃO salvar se for:

- Logs técnicos
- Execuções triviais
- Repetições de informações
- Conteúdo temporário
- Ações sem impacto futuro

---

### SALVAR apenas se houver:

- Decisões importantes
- Mudanças relevantes
- Definições técnicas
- Contexto útil para continuidade futura

---

## Regra de bloqueio

Se NÃO houver informação relevante:

- NÃO atualizar arquivos
- BLOQUEAR execução

---

## Etapa 2 — Auto-detecção de decisões

Analisar a sessão e identificar automaticamente decisões.

### Indicadores de decisão

Detectar padrões como:

- “decidimos que…”
- “vamos usar…”
- “não vamos mais usar…”
- “a partir de agora…”
- “padronizar…”
- “definido que…”

---

## Etapa 3 — Score de relevância (0–100)

Calcular o score com base nos critérios:

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

## Etapa 4 — Determinação de impacto

Definir impacto com base no score:

- 0–20 → baixo
- 21–50 → médio
- 51–100 → alto

---

## Etapa 5 — Classificação de categoria

Classificar automaticamente a decisão:

### Críticas
- stack
- arquitetura
- mudanças estruturais

### Técnicas
- padrões
- regras técnicas
- decisões de implementação

### UI/UX
- interface
- experiência
- navegação

### Outras
- fallback

---

## Etapa 6 — Estrutura do decisions.md (CRIAÇÃO AUTOMÁTICA)

Se `.agents/memory/decisions.md` NÃO existir:

Criar com a estrutura base:

# Decisões do Projeto

## Críticas

## Técnicas

## UI/UX

## Outras

## Recentes

---

## Etapa 7 — Versionamento de decisões (CRÍTICO)

Antes de adicionar uma nova decisão:

Verificar se já existe decisão equivalente.

### Se NÃO existir:
- adicionar normalmente

### Se EXISTIR e houver mudança:

- NÃO sobrescrever
- criar nova entrada com sufixo "(update)"

---

## Etapa 8 — Escrita das decisões

Adicionar na categoria correta:

## [YYYY-MM-DD] Título da decisão

- Decisão: descrição objetiva
- Motivo: justificativa
- Impacto: baixo | médio | alto
- Score: X/100

---

## Etapa 9 — Atualização de "Recentes"

Sempre adicionar também em:

## Recentes

Formato:

- [YYYY-MM-DD] Título da decisão

---

## Regras obrigatórias

- NÃO duplicar decisões idênticas
- NÃO sobrescrever decisões antigas
- Atualizações devem gerar nova entrada
- Garantir que toda decisão possua Score
- Garantir que toda decisão possua Impacto
- NÃO salvar informação irrelevante
- NÃO transformar session-memory em log
- Manter `.agents/memory/session-memory.md` entre 300–800 tokens
- Manter `.agents/memory/decisions.md` organizado por categoria

---

## Etapa 10 — Escrita final

Se validado:

- Atualizar `.agents/memory/session-memory.md`
- Criar ou atualizar `.agents/memory/decisions.md`

---

## Formato obrigatório de saída

## Status

- Atualizado / Bloqueado

---

## Análise

- Conteúdo relevante identificado: SIM / NÃO
- Decisões detectadas: SIM / NÃO
- Score calculado: X/100
- Impacto: baixo | médio | alto
- Categoria atribuída: Críticas | Técnicas | UI/UX | Outras
- Tipo de ação:
  - Nova decisão
  - Atualização de decisão
  - Sessão
- Justificativa

---

## Problemas

- Informação irrelevante (se bloqueado)
- Ambiguidades
- Possível conflito com decisões existentes
- Limitações de detecção

Se não houver:
→ Nenhum

---

## Próximos passos

Se BLOQUEADO:

- Nenhuma ação necessária

Se ATUALIZADO:

- Contexto salvo com sucesso
- Dashboard de decisões atualizado

---

## Boas práticas

- Usar ao final de cada tarefa relevante
- Evitar uso em tarefas triviais
- Priorizar qualidade sobre quantidade

---

## Importante

- Este comando mantém continuidade do sistema
- `.agents/memory/decisions.md` é a fonte de verdade das decisões
- Decisões nunca devem ser sobrescritas
- Histórico deve ser preservado
- Score deve refletir importância real
- Impacto deve ser coerente com o score
- Em caso de dúvida:
  → NÃO salvar
