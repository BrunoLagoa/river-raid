# Session Memory

> Arquivo de sessão. Atualizar durante o trabalho ativo.

## Sessão Atual

- Data: 2026-04-14
- Contexto: Ajuste incremental de gameplay com validação de fluxo completo
- Tarefa: Melhorar power-up D (double shot) com velocidade diferenciada

## Notas

- Fluxo seguido: /context -> /workflow -> /plan -> /execute -> /review -> /review-enforce-rules.
- Decisão funcional aprovada: power-up D permanece com tiro duplo e ganha velocidade maior nos projéteis.
- Parâmetro definido: multiplicador de velocidade 1.2x para os dois projéteis do double shot.
- Atualização aprovada: multiplicador alterado para 1.5x e nomenclatura da constante tornada explícita (`PLAYER_DOUBLE_SHOT_SPEED_MULTIPLIER`).
- Implementação aplicada nos módulos da engine em TypeScript, sem alteração de arquitetura React + Canvas.
- Arquivos de código ajustados: `src/game/constants.ts`, `src/game/Player.ts`, `src/game/Player.test.ts`.
- Salvaguarda adicionada na lógica: tiro normal seta explicitamente `PLAYER_BULLET_SPEED` para evitar efeito residual em objetos reutilizados do pool.
- Validação executada com sucesso: lint, typecheck e teste de player direcionado.
- Testes cobertos para decisão: double shot com velocidade maior e tiro normal mantendo velocidade base.
- Decisão registrada no dashboard `memory/decisions.md` na categoria Técnicas com score 15/100 e impacto baixo.
- Dashboard atualizado com versionamento de decisão equivalente usando sufixo `(update)`.
