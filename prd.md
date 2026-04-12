# PRD — Clone de River Raid

## 1. Visão do Produto

Desenvolver um jogo arcade estilo vertical shooter inspirado no clássico River Raid, com mecânicas modernas e jogável diretamente no navegador usando React.js com Vite e Canvas.

O jogo deve ser simples de aprender, difícil de dominar e altamente rejogável.

## 2. Objetivo

* Criar um jogo leve e divertido
* Servir como base de estudo e portfólio em desenvolvimento de jogos com React
* Demonstrar domínio técnico em game loop, Canvas, arquitetura modular e integração entre React e engine 2D

## 3. Público-Alvo

* Jogadores casuais
* Desenvolvedores iniciantes ou intermediários em game dev web
* Fãs de jogos retrô
* Pessoas interessadas em aprender React aplicado a experiências interativas

## 4. Proposta de Valor

* Gameplay simples e desafiador
* Sessões rápidas de 1 a 5 minutos
* Alta rejogabilidade
* Feedback constante por pontuação, progressão e escassez de combustível
* Estrutura moderna baseada em React.js + Vite, fácil de evoluir

## 5. Loop Principal do Jogo

Avançar → Desviar → Atirar → Gerenciar combustível → Coletar → Sobreviver → Pontuar → Repetir

## 6. Funcionalidades (Features)

### Core (MVP)

* Movimento horizontal do avião
* Scroll vertical automático
* Sistema de tiro
* Inimigos básicos
* Sistema de combustível
* Sistema de colisão
* Pontuação
* Game over
* Tela inicial e reinício da partida

### Secundárias

* Dificuldade progressiva
* Sons básicos
* Animações simples
* Pause

### Futuras (Nice-to-have)

* Ranking em localStorage
* Skins do avião
* Fases ou níveis temáticos
* Power-ups
* Suporte refinado para mobile web

## 7. Requisitos Funcionais

* O jogador deve controlar o avião horizontalmente
* O jogo deve rolar automaticamente para frente
* O jogador deve conseguir atirar
* Inimigos devem aparecer progressivamente
* Combustível deve diminuir com o tempo
* Tanques devem reabastecer o jogador
* Colisões devem resultar em game over
* O jogo deve permitir reinício sem recarregar a página
* O HUD deve refletir score e combustível em tempo real

## 8. Requisitos Não Funcionais

* Rodar em navegadores modernos
* Manter performance estável próxima de 60 FPS
* Código modular e organizado
* Baixo tempo de carregamento
* Compatível com desktop e adaptável para mobile web
* Criado com React.js e Vite
* Renderização do gameplay em Canvas, evitando gargalos por re-renderização no React

## 9. Experiência do Usuário (UX)

* Controles simples via teclado, com possibilidade de touch futuramente
* Feedback visual imediato para tiros, explosões e coleta
* Interface minimalista e clara
* Curva de dificuldade progressiva
* Fluxo rápido entre iniciar, jogar, morrer e reiniciar

## 10. Métricas de Sucesso

* Tempo médio por sessão
* Pontuação média
* Maior pontuação atingida
* Taxa de replay
* Tempo até primeira falha
* Estabilidade de FPS durante a partida

## 11. Critérios de Aceite

* O jogo inicia corretamente no navegador
* O jogador consegue controlar o avião
* O sistema de tiro funciona
* Colisões funcionam corretamente
* Combustível impacta diretamente o gameplay
* O jogo termina corretamente em game over
* O jogo pode ser reiniciado sem recarregar a aplicação
* Não há travamentos perceptíveis ou quedas severas de performance

## 12. Arquitetura Técnica

### Stack

* React.js
* Vite
* TypeScript
* HTML5 Canvas

### Estrutura sugerida

* `App.tsx` para composição geral da interface
* `GameCanvas.tsx` para montar o canvas e iniciar a engine
* `Hud.tsx` para score e combustível
* `GameEngine.ts` para orquestração do loop
* `Player.ts`, `Enemy.ts`, `FuelTank.ts` para entidades
* `CollisionSystem.ts`, `FuelSystem.ts`, `SpawnSystem.ts`, `ScoreSystem.ts` para regras do jogo
* `RiverGenerator.ts` para mundo procedural

## 13. Roadmap

### Fase 1 — Base Técnica

* Setup do projeto com Vite
* Estrutura React
* Canvas inicial
* Loop principal
* Input do jogador

### Fase 2 — MVP Jogável

* Movimento do avião
* Scroll do mapa
* Sistema de tiro
* Colisão básica
* HUD inicial

### Fase 3 — Gameplay Completo

* Inimigos
* Sistema de combustível
* Pontuação
* Game over e restart

### Fase 4 — Polimento

* Sons
* Efeitos visuais
* Ajuste de dificuldade
* Melhor experiência visual

### Fase 5 — Extras

* Ranking
* Power-ups
* Melhorias de responsividade

## 14. Riscos

* Complexidade na geração procedural do mapa
* Balanceamento da dificuldade
* Performance em dispositivos mais fracos
* Acoplamento excessivo entre React e engine se a separação de responsabilidades não for bem feita

## 15. Entrega Final

* Jogo funcional no navegador
* Projeto em React.js com Vite
* Código organizado e documentado
* Instruções para execução local
* Estrutura escalável para melhorias futuras

## 16. Possíveis Extensões Futuras

* Versão PWA
* Ranking online
* Sistema de missões
* Temas visuais alternativos
* Uso como mini game dentro de aplicações maiores
