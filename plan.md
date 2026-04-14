# Plano de Implementacao - IA de Inimigos e Controle de Saturacao

Data: 2026-04-14
Escopo aprovado: combinar abordagens (1) orcamento dinamico de populacao + (2) controle de densidade espacial agora; preparar abordagem (3) IA por nivel para fase seguinte.

## Status de execucao

- [x] Tarefa 1 - Parametros de controle no `constants.ts`
- [x] Tarefa 2 - Orcamento dinamico de populacao no `EnemyManager`
- [x] Tarefa 3 - Controle de densidade espacial no `spawn`
- [x] Tarefa 4 - Limitador de burst por ciclo de spawn
- [x] Tarefa 5 - Preparacao da fase 2 (IA por nivel)
- [x] Tarefa 6 - Testes e validacao

## Entendimento

Objetivo desta fase:
- Reduzir acumulacao extrema de inimigos em tela (encavalamento/saturacao).
- Melhorar qualidade do spawn sem quebrar progressao de dificuldade.
- Manter arquitetura atual (engine em `src/game/*`, React desacoplado).

Objetivo da fase seguinte (somente preparacao neste plano):
- Introduzir niveis de inteligencia por tipo de inimigo (`basic/smart/elite`) de forma incremental e controlada.

## Regras aplicaveis

- Fonte arquitetural: `AGENTS.md` (engine no Canvas/TS puro, React shell).
- Estrutura validada com Serena:
  - `src/game/EnemyManager.ts` concentra spawn, update e tiro inimigo.
  - `src/game/constants.ts` concentra tuning de spawn.
  - `src/game/EnemyManager.test.ts` cobre spawn basico e descarte offscreen.
  - `src/game/Game.ts` integra `enemyManager.update(...)` no loop.
- `docs/` nao encontrado no repositorio; plano baseado em `AGENTS.md` + codigo real.
- `model-policy`: planejamento com modelo mais forte; execucao depois com modelo economico.

## Estrategia

1) Introduzir limite dinamico de populacao ativa (global + por categoria de inimigo).
2) Introduzir validacao de densidade espacial antes de spawnar (distancia minima em Y e faixa em X).
3) Evitar picos de spawn no mesmo ciclo quando a densidade estiver alta.
4) Preparar ganchos para IA por nivel (sem habilitar logica complexa agora).

Essa estrategia ataca o problema principal (saturacao) com baixa/media complexidade e baixo risco arquitetural.

## Passos de implementacao

### Tarefa 1 - Parametros de controle no `constants.ts`

Adicionar constantes para tuning de spawn/saturacao, por exemplo:
- limite maximo de inimigos ativos total (base + crescimento por tempo com teto).
- limite por tipo (ex.: helicopter, plane, gunboat, tank, boat, bridge).
- distancias minimas para spawn (Y e X).
- maximo de spawns por ciclo (dinamico por fase/tempo).

Resultado esperado:
- Todo tuning centralizado em constantes, sem numeros magicos no `EnemyManager`.

### Tarefa 2 - Orcamento dinamico de populacao no `EnemyManager`

No fluxo de `update`/`spawn`:
- calcular capacidade atual (`enemyBudget`) baseada em `gameTime` com teto.
- antes de qualquer tentativa de spawn, checar:
  - ativos totais < budget total;
  - ativos do tipo candidato < cap do tipo;
  - condicao especial para `bridge` (manter rara e legivel).
- se o budget for excedido, cancelar tentativas adicionais do ciclo.

Resultado esperado:
- nunca ultrapassar densidade alvo por fase, evitando crescimento descontrolado.

### Tarefa 3 - Controle de densidade espacial no `spawn`

Antes de materializar inimigo:
- validar distancia minima em Y para inimigos ativos proximos.
- validar sobreposicao/faixa em X para reduzir encavalamento visual.
- limitar tentativas de encontrar ponto valido (ex.: N tentativas) e abortar se falhar.

Resultado esperado:
- distribuicao de inimigos mais limpa e jogavel, com menos sobreposicao injusta.

### Tarefa 4 - Limitador de burst por ciclo de spawn

No bloco que hoje pode chamar spawn base + dual + triple + quad:
- converter em fila de tentativas com prioridade.
- aplicar `maxSpawnsPerCycle` condicionado por tempo/budget.
- impedir que um unico frame gere pico acima da capacidade espacial.

Resultado esperado:
- curva de dificuldade mantida, sem picos abruptos por empilhamento de spawns no mesmo tick.

### Tarefa 5 - Preparacao da fase 2 (IA por nivel, sem ativar comportamento avancado)

Preparar estrutura leve para evolucao futura:
- adicionar campo de perfil de IA no inimigo (ex.: `aiTier: 'basic' | 'smart' | 'elite'`) apenas para classificacao.
- atribuir tier por tempo/tipo no spawn (sem grande alteracao de comportamento nesta fase).
- manter compatibilidade com renderer e colisao.

Resultado esperado:
- base pronta para proxima iteracao sem retrabalho estrutural.

### Tarefa 6 - Testes e validacao

Expandir `EnemyManager.test.ts` com cenarios novos:
- nao excede limite total de ativos apos multiplos updates longos.
- respeita cap por tipo em ciclos intensos.
- evita spawn quando densidade minima nao e atendida.
- nao quebra regra existente de inimigo offscreen ficar inativo.

Validacoes obrigatorias apos execucao:
- `npm run lint`
- `npx tsc -b`
- `npx vitest src/game/EnemyManager.test.ts`
- (opcional) `npx vitest` para regressao geral da engine.

## Arquivos afetados

Arquivos para alterar:
- `src/game/constants.ts`
- `src/game/EnemyManager.ts`
- `src/game/EnemyManager.test.ts`

Arquivos para verificar impacto indireto (sem alterar, salvo necessidade):
- `src/game/Game.ts` (assinatura/chamada permanece compativel)
- `src/game/CollisionSystem.ts` (consumo de `enemyManager.enemies`)

## Impacto

- Areas afetadas: spawn, distribuicao de inimigos, dificuldade percebida, legibilidade de combate.
- Dependencias envolvidas: constantes de gameplay, loop de update do manager, testes de engine.

## Riscos

Tecnicos:
- caps muito baixos podem deixar jogo facil/desequilibrado.
- checks espaciais agressivos podem gerar poucos inimigos em alguns trechos.

Negocio/gameplay:
- ajuste de dificuldade pode alterar sensacao do jogo para jogadores habituados.

Efeitos colaterais:
- mudancas no spawn podem impactar score-rate e ritmo de fuel de forma indireta.

Mitigacao:
- iniciar com limites conservadores e validar em partidas de 2-5 minutos.
- manter tuning em constantes para ajuste rapido sem refatoracao.

## Criterios de sucesso

- Em partidas longas, nao ocorre acumulacao extrema de inimigos encavalados.
- Quantidade maxima de inimigos simultaneos permanece dentro do budget esperado.
- Dificuldade continua progressiva sem picos injustos por saturacao.
- Testes de `EnemyManager` passam com novos cenarios e sem regressao dos atuais.
- Lint e typecheck sem erros.

## Fora de escopo

- Reescrever sistema completo de IA nesta fase.
- Alterar arquitetura React/Canvas.
- Criar novos tipos de inimigo.
- Balanceamento fino de pontuacao/fuel em toda economia do jogo.

## Confiança no plano

Alta.

## Modo de operacao

Normal.

- `.agents` disponivel e utilizado.
- Serena disponivel e usada para validar estrutura real.
- Limitacao registrada: ausencia de `docs/` no repositorio.
