# Decisões do Projeto

## Críticas

<!-- Decisões arquiteturais ou de stack com impacto duradouro -->

## Técnicas

<!-- Decisões de implementação, padrões, ferramentas -->

## [2026-04-14] Power-up D com velocidade de tiro diferenciada

- Decisão: manter o power-up `double_shot` com comportamento atual de dois projéteis e aplicar multiplicador de velocidade `1.2x` nos dois tiros enquanto o efeito estiver ativo.
- Motivo: melhorar a diferenciação perceptível entre tiro normal e tiro com power-up D sem alterar a mecânica principal nem desbalancear o jogo de forma abrupta.
- Impacto: baixo
- Score: 15/100

## [2026-04-14] Power-up D com velocidade de tiro diferenciada (update)

- Decisão: manter o comportamento de tiro duplo no power-up `double_shot`, renomear a constante para `PLAYER_DOUBLE_SHOT_SPEED_MULTIPLIER` e ajustar o multiplicador de velocidade de `1.2x` para `1.5x`.
- Motivo: aumentar clareza semântica da configuração e deixar a diferença de velocidade mais perceptível em gameplay, mantendo uma alteração localizada e controlada.
- Impacto: baixo
- Score: 15/100

## [2026-04-14] Controle de saturacao no spawn de inimigos

- Decisão: aplicar orcamento dinamico de inimigos (cap total progressivo), limite por tipo, limitador de burst por ciclo e validacao de densidade espacial (gaps em X/Y) no `EnemyManager`.
- Motivo: evitar acumulacao extrema/encavalamento em partidas longas, mantendo dificuldade progressiva e jogabilidade justa.
- Impacto: baixo
- Score: 15/100

## [2026-04-14] Preparacao de IA por nivel para inimigos

- Decisão: introduzir classificacao `aiTier` (`basic|smart|elite`) na estrutura de inimigos apenas como base de evolucao futura, sem ativar comportamentos avancados nesta fase.
- Motivo: permitir evolucao de IA por etapas sem refatoracao estrutural posterior.
- Impacto: baixo
- Score: 15/100

## [2026-04-14] Gunboat com variacao de comportamento

- Decisão: gunboat agora tem comportamento variasi - 50% com movimento (oscilacao), 50% fixo; 80% chance de atirar.
- Motivo: adicionar variedade e dinamica ao jogo.
- Impacto: medio
- Score: 30/100

- Decisão: introduzir classificacao `aiTier` (`basic|smart|elite`) na estrutura de inimigos apenas como base de evolucao futura, sem ativar comportamentos avancados nesta fase.
- Motivo: permitir evolucao de IA por etapas sem refatoracao estrutural posterior.
- Impacto: baixo
- Score: 15/100

## UI/UX

<!-- Decisões de interface e experiência do usuário -->

## Outras

<!-- Decisões gerais que não se encaixam nas categorias acima -->

## Recentes

<!-- Últimas decisões tomadas -->

- [2026-04-14] Power-up D com velocidade de tiro diferenciada
- [2026-04-14] Power-up D com velocidade de tiro diferenciada (update)
- [2026-04-14] Controle de saturacao no spawn de inimigos
- [2026-04-14] Preparacao de IA por nivel para inimigos
- [2026-04-14] Gunboat com variacao de comportamento
