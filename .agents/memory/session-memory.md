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

- ~~Corrigir inicializacao do primeiro objetivo da run para respeitar imediatamente o perfil persistido no inicio da partida.~~ **RESOLVIDO** — O construtor do `Game` (linha 96) e `ObjectiveSystem` (linha 118) já aceitam `objectiveProfile` como parâmetro, e `GameCanvas.tsx` (linha 44) o injeta via `useRef` do settings salvo. Teste `Game.test.ts:122` (`'construtor aplica perfil de objetivos na primeira missao'`) verifica o comportamento com `'aggressive'`.
- ~~Reexecutar `/review` apos o ajuste.~~ **RESOLVIDO** — O código já estava correto, apenas o histórico não foi atualizado.

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

## Review 2026-05-27 — Aderencia completa

### Objetivo perfil persistido no construtor

- **Status:** RESOLVIDO (ja estava corrigido no codigo, faltava atualizar historico)
- `ObjectiveSystem` construtor (linha 118) aceita `profile`, `Game` construtor (linha 96) repassa, `GameCanvas` (linha 44) injeta do `useRef` com `settings.objectiveBalanceProfile`
- Teste `Game.test.ts:122` verifica target `6` para perfil `aggressive`

### IA inimigos steering + borda + spawn risco

- **Status:** APROVADO
- Typecheck: OK (`tsc --noEmit`)
- Testes: 364/364 (100%), sendo 30/30 do EnemyManager
- Build: OK (`npm run build`)
- Estrutura: steering por `aiTier` com constantes por tier, `chooseLaneIntent` com contagem de congestao, `getSpawnRisk` com reducao de amplitude e peso
- Histerese (`AI_BANK_HYSTERESIS = 5`) e cooldown (`AI_BANK_RECOVER_COOLDOWN = 0.16`) evitam serrilhamento em borda
- Recuperacao (`bankRecoverTimer`, `bankRecoverDir`, `recoverStrafeFactor`) com damp de `0.25` no strafe durante recuperacao
- Transicao `recover → reposition → patrol` preserva maquina de estados

### Observacoes (nao bloqueantes)

- Duplicacao de bloco de steering para helicopter/boat/tank/gunboat (~30 linhas × 4), aceitavel para escopo
- `getSafeBounds` com `halfSpan = 0` em corredor extremamente estreito e fallback seguro (amplitude minima `6px`)

## Atualizacao 2026-04-17 (IA borda + spawn risco)

- Evolucao implementada em `src/game/EnemyManager.ts`: recuperacao curta ao tocar borda, histerese anti-serrilha e push para centro por tier.
- Spawn agora considera risco local de curva/estreitamento para reduzir peso de tipos agressivos e diminuir amplitude inicial de movimento.
- Compatibilidade preservada: campos de recuperacao no tipo base ficaram opcionais para nao quebrar testes que montam inimigos manualmente.
- Testes novos em `src/game/EnemyManager.test.ts`: recuperacao de borda e spawn em curva de alto risco.

## Validacao tecnica (update 2)

- Comandos executados e aprovados: `npm run typecheck`, `npm test -- src/game/EnemyManager.test.ts`, `npm run build`.
- Resultado focado atual: 17/17 testes do `EnemyManager` passando.

## Pendencias abertas (update 2)

- ~~Rodar `/review` final para validar aderencia completa apos esta segunda iteracao da IA.~~ **CONCLUIDO** — Review executado e aprovado em 2026-05-27.

## Atualizacao 2026-05-27 — Redesign UI + i18n + Tooltip conquistas

### Contexto
Redesign completo das telas de menu, tutorial e settings com identidade visual arcade. Adição de i18n (en/pt-BR) com seletor persistido. Tooltip de conquistas com CSS puro.

### Commits desta sessão
- `b777db9` — MenuScreen e TutorialScreen extraídos; redesign arcade (scanlines, flicker, glow); Share Tech Mono
- `ca4ae28` — SettingsScreen extraída; i18n.ts criado (en/pt-BR); campo `language` em GameSettings; gameover traduzido; testes atualizados
- `207620e` — Tooltip ⓘ nas conquistas; descriptions do catálogo corrigidas para refletir condições reais do jogo
- `79361f7` — Correções: tooltip não cortado (overflow removido), barra scroll horizontal removida, slider volume acompanha valor via `--val` inline

### Arquivos centrais alterados
- `src/App.tsx` — integração i18n (`useMemo getStrings`), gameover traduzido
- `src/App.css` — estilos arcade + settings redesign + tooltip
- `src/i18n.ts` — novo; strings completas en/pt-BR para todas as telas
- `src/game/SettingsService.ts` — tipo `Language`, campo `language`, normalização
- `src/game/SettingsService.test.ts` — cobertura de `language` (leitura, persistência, fallback inválido)
- `src/game/AchievementService.ts` — descriptions corrigidas (50 inimigos, 10 power-ups, 60s/75%, 10k/50k pts)
- `src/components/MenuScreen.tsx` — recebe prop `t: Strings`
- `src/components/TutorialScreen.tsx` — recebe prop `t: Strings`
- `src/components/SettingsScreen.tsx` — novo; seletor de idioma, toggles, slider, conquistas + tooltip ⓘ

### Validação técnica
- `npm run typecheck` — OK
- `npm test` — 369/369 passando
- `npm run test:coverage` — Statements 100%, Functions 100%, Lines 100%, Branches 97.46%

### Estado final
- Sem pendências abertas desta sessão
- Coverage acima dos thresholds configurados (55 stmt/func/lines, 35 branches)
