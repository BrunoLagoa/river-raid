# Session Memory

> Memoria de sessao ativa para continuidade entre ciclos /workflow -> /plan -> /execute -> /review.

## Sessao Atual

- Data: 2026-04-17
- Contexto: evolucao do sistema de objetivos com perfis configuraveis, novos tipos de missao e integracao entre settings, engine e HUD.
- Escopo executado: implementar plano de objetivos (balanceamento conservador/agressivo + missoes temporais e por trecho), validar com testes e revisar aderencia.

## Estado consolidado

- `ObjectiveSystem` expandido para suportar perfis de balanceamento (`conservative`/`aggressive`) e pesos por perfil.
- Novos tipos de missao implementados: `timed_enemy_kills`, `score_target`, `river_survival`.
- Integracao concluida em `Game` para eventos de score ganho e permanencia no trecho do rio.
- Settings com novo campo persistido (`objectiveBalanceProfile`) e controle exposto na tela de configuracoes.
- HUD atualizado para exibir tempo restante em objetivos temporais.
- Decisao funcional adotada: troca de perfil em runtime aplica na proxima missao (sem reiniciar objetivo atual).

## Arquivos centrais alterados

- Engine/UI: `src/game/ObjectiveSystem.ts`, `src/game/Game.ts`, `src/game/UI.ts`.
- Settings/bridge: `src/game/SettingsService.ts`, `src/components/GameCanvas.tsx`, `src/App.tsx`.
- Testes: `src/game/ObjectiveSystem.test.ts`, `src/game/SettingsService.test.ts`, `src/game/Game.test.ts`.

## Validacao tecnica

- Comandos executados e aprovados: `npm run typecheck`, `npm test -- src/game/ObjectiveSystem.test.ts src/game/SettingsService.test.ts src/game/Game.test.ts`, `npm run build`.
- Resultado dos focados: 75 testes passando.

## Fluxo e compliance

- Fluxo respeitado: `/workflow` -> `/execute` -> `/review`.
- Revisao principal retornou reprovacao por um desvio funcional especifico (primeiro objetivo pode nascer em perfil conservador quando o jogador inicia com perfil agressivo persistido).
- Sem evidencia de exposicao de segredo e sem mudanca de stack.

## Pendencias abertas

- Corrigir inicializacao do primeiro objetivo da run para respeitar imediatamente o perfil persistido no inicio da partida.
- Reexecutar `/review` apos o ajuste.

## Proximo contexto util

- Manter coerencia entre perfil de objetivos salvo e primeira missao gerada no inicio da run.
- Apos correção, validar novamente com typecheck, testes focados e build.

## Atualizacao 2026-04-17 (IA inimigos em curva)

- Contexto: melhoria da inteligencia de movimento dos inimigos para evitar efeito de "grudar" nas margens quando o rio fecha/abre em curva.
- Implementacao concluida em `src/game/EnemyManager.ts` com steering para centro seguro do corredor, recentralizacao de origem de oscilacao e desaceleracao de strafe perto de borda.
- Regra de compatibilidade adotada: aplicar steering avancado apenas quando inimigo estiver visivel (`y > 0`), preservando comportamento de spawn fora da tela.
- Testes adicionados em `src/game/EnemyManager.test.ts` cobrindo recentralizacao em bounds dinamicos e evitacao de borda para inimigo smart.

## Validacao tecnica (update)

- Comandos executados e aprovados: `npm run typecheck`, `npm test -- src/game/EnemyManager.test.ts`, `npm run build`.
- Resultado focado: 15/15 testes do `EnemyManager` passando apos ajuste final.

## Pendencias abertas (update)

- Executar `/review` para validacao final de risco/regressao da mudanca de IA.

## Atualizacao 2026-04-17 (IA borda + spawn risco)

- Evolucao implementada em `src/game/EnemyManager.ts`: recuperacao curta ao tocar borda, histerese anti-serrilha e push para centro por tier.
- Spawn agora considera risco local de curva/estreitamento para reduzir peso de tipos agressivos e diminuir amplitude inicial de movimento.
- Compatibilidade preservada: campos de recuperacao no tipo base ficaram opcionais para nao quebrar testes que montam inimigos manualmente.
- Testes novos em `src/game/EnemyManager.test.ts`: recuperacao de borda e spawn em curva de alto risco.

## Validacao tecnica (update 2)

- Comandos executados e aprovados: `npm run typecheck`, `npm test -- src/game/EnemyManager.test.ts`, `npm run build`.
- Resultado focado atual: 17/17 testes do `EnemyManager` passando.

## Pendencias abertas (update 2)

- Rodar `/review` final para validar aderencia completa apos esta segunda iteracao da IA.
