---
name: spec
description: Transforma PRD em especificação técnica detalhada, determinística e executável. Define comportamento do sistema, contratos de entrada/saída, fluxos, estados e regras. Base para /plan — sem suposições. Em ambiguidade ou trade-off técnico, pode apresentar opções e bloqueia até decisão do usuário. Não implementa. Bloqueia se houver ambiguidade não resolvida.
license: MIT
metadata:
  author: BrunoCastro
  version: "2.1.1"
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

Transformar um PRD em uma especificação técnica:

- clara
- determinística
- sem ambiguidades
- validável
- pronta para execução via `/plan`

---

## Integração com sistema

Este comando:

- recebe entrada de `/prd`
- serve como base para `/plan`
- define comportamento técnico do sistema
- NÃO implementa

---

## Escopo do documento

- Detalhar **como** o sistema se comporta tecnicamente (contratos, estados, fluxos).
- Não repetir storytelling de negócio do PRD; **referenciar** o PRD quando a decisão já estiver lá.
- Não incluir métricas de negócio ou narrativa não acionável para implementação.

---

## Uso de modelo

- utilizar modelo intermediário ou superior
- priorizar precisão técnica absoluta
- evitar inferências

---

## Pré-condição obrigatória

- PRD deve estar completo
- Se PRD estiver incompleto → BLOQUEAR

### Ambiguidade técnica, trade-offs e escolha do usuário

Quando houver **mais de uma solução técnica válida** (ex.: protocolo, persistência, idempotência, granularidade de API, estratégia de erro) ou **lacuna técnica** não coberta pelo PRD:

- **Não** escolher sozinho sem alinhamento quando o trade-off impactar comportamento observável ou contratos.
- Apresentar **2 a 4 opções** com prós e contras breves; pode incluir **recomendação fundamentada**, sem substituir a decisão do usuário.
- **BLOQUEAR** a geração (ou continuação) da especificação até o usuário **escolher uma opção** ou **definir critério decisório** explícito.

Se a decisão já estiver **explícita no PRD** → seguir o PRD; não reabrir como ambiguidade.

---

# Estrutura da Especificação

---

## 1. Objetivo técnico

- O que será construído (visão técnica)
- Resultado esperado do sistema

---

## 2. Arquitetura da solução

### Componentes
- serviços
- módulos
- responsabilidades

### Fluxo de dados
- origem → processamento → saída

---

## 3. Tecnologia

- stack obrigatória
- integrações externas
- bibliotecas

---

## 4. Contratos de Entrada (Inputs)

**Escopo:** validação e formato **no limite de entrada** (parse, tipo, obrigatoriedade, limites por campo).

Para cada input:

- nome
- tipo
- formato (JSON, string, etc)
- origem (user, API, sistema)
- validações obrigatórias **por campo ou payload**

**Não** duplicar aqui a tabela global de erros de negócio ou códigos HTTP — isso fica na seção **6** (transversal / operação).

Exemplo:
```json
{
  "address": "string",
  "zipcode": "string (8 digits)"
}
```

---

## 5. Contratos de Saída (Outputs)

**Escopo:** o que o sistema **retorna** ou **emite** (resposta síncrona, evento, UI binding técnico).

Para cada saída:

- nome / canal (API response, evento, fila)
- tipo e formato
- semântica (sucesso vs falha legível pelo cliente)
- efeitos colaterais observáveis quando aplicável

Deve ser **consistente** com os inputs e fluxos; **não** contradizer a seção **4** nem a **6**.

---

## 6. Estados, erros e códigos

**Escopo:** comportamento **transversal** após entrada válida — erros de domínio, conflitos, indisponibilidade, códigos HTTP/gRPC, máquina de estados se houver.

- Contrato de erro (código, mensagem, retry, idempotência)
- Estados do recurso (rascunho, ativo, cancelado, etc.) se aplicável

**Diferença em relação à seção 4:** a seção 4 cobre **rejeição de entrada inválida**; esta seção cobre **falhas e estados durante ou após** o processamento válido.

---

## 7. Fluxos e sequências

- Fluxo principal (passo a passo: ator → sistema → efeitos)
- Fluxos alternativos e ramificações
- Concorrência ou ordenação obrigatória (se aplicável)

---

## 8. Modelo de dados (se aplicável)

**Escopo:** forma **estrutural** do dado persistido ou do domínio (esquema, entidades, relações).

Para cada entidade ou agregado:

- nome
- campos e tipos
- restrições de esquema (único, obrigatório, FK, checks) e **índices** relevantes
- relação com inputs/outputs (referência cruzada, sem repetir verbosamente o contrato JSON se já definido na 4/5)

**Invariantes nesta seção:** os que se expressam como **regra de dados ou de integridade** (ex.: coluna única, saldo não negativo **no modelo**).

---

## 9. Casos extremos e garantias operacionais

**Escopo:** comportamento sob condições adversas ou incomuns **no tempo de execução** — não substitui a validação de entrada da seção 4.

- Entradas limítrofes já não cobertas na 4
- timeouts, reexecução, duplicidade (filas, idempotência)
- estados vazios ou parciais
- **Garantias operacionais:** o que deve permanecer verdadeiro **em qualquer fluxo** (incluindo erro, retry, concorrência) — ex.: consistência após evento duplicado, limites sob carga

**Invariantes nesta seção:** os que são **promessas de comportamento do sistema**, não só colunas no banco (podem referenciar regras da §8, mas descrevem **como** o código as preserva).

---

## Integração com `/plan` (CRÍTICO)

- Esta especificação deve permitir criação de plano **sem suposições**
- Se o `/plan` precisar assumir algo → spec está incompleta

---

## Validação obrigatória

Antes de finalizar, responder:

- Especificação completa: SIM / NÃO
- Ambiguidades: (listar)
- Conflito com `.agents`: SIM / NÃO
- Conflito com `docs`: SIM / NÃO

---

## Regras de bloqueio

- Se PRD estiver incompleto → PARAR
- Se houver ambiguidade → PARAR
- Se faltar informação técnica necessária para implementar → PARAR
- Se houver conflito com `.agents` → PARAR
- Se existir trade-off técnico não resolvido e o usuário ainda não escolheu opção nem critério decisório (ver *Ambiguidade técnica, trade-offs e escolha do usuário*) → PARAR

---

## Importante

- NÃO implementar
- NÃO gerar código
- NÃO assumir comportamento não derivável do PRD + decisões explícitas nesta spec
- Este comando define base técnica para o plano

---

## Formato obrigatório de saída

## Status

- Especificação criada / Bloqueado

---

## Análise

### Estrutura da solução

- visão geral técnica

---

### Clareza da especificação

- completa / incompleta

---

### Pronto para planejamento

- SIM / NÃO

---

## Problemas

- ambiguidades
- lacunas
- inconsistências

Se não houver:
→ Nenhum

---

## Próximos passos

Se completo:

- Seguir para `/plan`

Se incompleto:

- Ajustar especificação
- Solicitar informações
