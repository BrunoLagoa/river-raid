## Status
- Plano criado

## Análise
### Entendimento
- Evoluir o sistema de objetivos em três frentes:
- Rebalancear objetivos em dois perfis (conservador e agressivo).
- Adicionar novos tipos de missão (tempo limite, score alvo e objetivos por trecho do rio).
- Tornar isso configurável na tela de settings.
- A dúvida sobre troca automática vs configurada foi interpretada como: configurar manualmente no settings agora, sem automação nesta etapa inicial.

### Regras aplicáveis
- Preservar arquitetura React shell + engine Canvas (AGENTS.md).
- Evoluir decisão existente de objetivos dinâmicos (score 60/100), sem substituir abruptamente.
- Persistência de configurações deve seguir o padrão de SettingsService e integração via GameCanvas.
- Sem conflito com regras de segurança/stack.

### Estratégia
- Introduzir perfil de balanceamento de objetivos dentro de settings (conservador/agressivo).
- Refatorar ObjectiveSystem para usar tabelas de parâmetros por perfil, em vez de valores fixos.
- Adicionar novos tipos de missão no mesmo pipeline de progresso/validação existente.
- Expor seleção do perfil no settings e repassar para o Game durante execução.

### Passos de implementação
1. Expandir o modelo de configuração:
- Adicionar campo objectiveBalanceProfile em settings com valores conservador e agressivo.
- Definir valor padrão conservador e normalização na leitura/salvamento.

2. Integrar perfil na ponte React -> engine:
- Ajustar props/fluxo de settings para que GameCanvas aplique o perfil no Game em tempo real.
- Adicionar método no Game para atualizar perfil sem reiniciar sessão (ou com reset controlado, se necessário).

3. Refatorar ObjectiveSystem para parâmetros por perfil:
- Mover ranges de alvo/recompensa para estruturas por perfil.
- Conservador: ajustes pequenos de pontuação e faixas próximas do atual.
- Agressivo: mudanças mais amplas de alvo, recompensa e pesos de sorteio.
- Preservar anti-repetição e ciclo completed -> próximo objetivo.

4. Adicionar pesos de sorteio por perfil:
- Conservador: pesos próximos ao uniforme atual.
- Agressivo: priorização mais clara por risco/ritmo.

5. Implementar novos tipos de missão:
- Tempo limite: destruir N inimigos em T segundos.
- Score alvo: ganhar X pontos em uma janela de tempo.
- Trecho do rio: sobreviver dentro do rio por Y segundos sem sair dos limites.
- Incluir estado, progresso, condição de sucesso/falha e texto de HUD para cada tipo.

6. Atualizar HUD:
- Exibir tempo restante quando a missão tiver janela temporal.
- Exibir progresso específico por tipo (contagem, score, trecho).

7. Atualizar testes unitários e integração:
- Cobrir seleção de perfil e ranges esperados.
- Cobrir sorteio com pesos por perfil.
- Cobrir novos tipos de missão (sucesso/falha/reset).
- Cobrir persistência do novo setting e integração App/Game.

8. Validar qualidade:
- Rodar typecheck, testes e build.
- Ajustar ranges/pesos se houver missão impossível/trivial em testes simulados.

### Arquivos afetados
- src/game/ObjectiveSystem.ts
- src/game/Game.ts
- src/game/UI.ts
- src/game/SettingsService.ts
- src/components/GameCanvas.tsx
- src/App.tsx
- src/game/ObjectiveSystem.test.ts
- src/game/Game.test.ts
- src/game/SettingsService.test.ts

### Impacto
- Gameplay: alto impacto no ritmo e na percepção de risco/recompensa.
- Engine: impacto médio na lógica de objetivos e eventos.
- UI: impacto médio no settings e HUD.
- Persistência: impacto baixo-médio (novo campo de configuração).

### Riscos
- Regressão no progresso de objetivos já existentes.
- Objetivos temporais injustos sem tuning fino.
- Perfil agressivo punitivo demais.
- Perfil conservador sem diferencial perceptível.
- Troca de perfil durante run pode gerar inconsistência sem regra clara.

### Critérios de sucesso
- Settings permite escolher perfil e persistir corretamente.
- Objetivos atuais continuam funcionando no perfil conservador.
- Novos objetivos aparecem, progridem e concluem/falham conforme regras.
- Perfil agressivo altera faixas e distribuição de missões de forma perceptível.
- HUD comunica bem progresso/tempo.
- Typecheck, testes e build passam.

### Fora de escopo
- Automação inteligente de troca de perfil por desempenho do jogador (fase 2).
- Backend/leaderboard online.
- Rework visual completo além de settings e HUD.
- Mudanças em sistemas não relacionados fora do necessário para eventos de objetivo.

### Confiança no plano
- Média-alta

### Modo de operação
- Normal
- .agents e memória disponíveis.
- Limitação: sem validação simbólica via Serena nesta sessão.

## Problemas
- Ambiguidades:
- Definir se troca de perfil durante partida aplica imediatamente ou só na próxima missão.
- Sem conflitos com .agents/docs detectados.

## Próximos passos
- Confirmar regra de aplicação da troca de perfil (imediata vs próxima missão).
- Após confirmação, seguir para /execute.

## Modelo recomendado
- Modelo: GPT-5.4
- Justificativa:
- Complexidade média-alta com impacto em gameplay, UI e persistência.
- Risco de regressão exige execução e validação cuidadosas.
