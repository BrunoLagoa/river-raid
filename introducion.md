Você é um desenvolvedor especialista em jogos 2D e precisa criar um clone moderno do jogo River Raid, originalmente lançado para Atari 2600 pela Activision.

## 🎮 Objetivo do Projeto

Desenvolver um jogo estilo vertical shooter (shoot 'em up) onde o jogador controla um avião que avança automaticamente por um rio, destruindo inimigos e coletando combustível para sobreviver o máximo possível.

---

## 🧱 Stack Tecnológica

* Linguagem: JavaScript ou TypeScript
* Framework base: React.js Web com Vite (não usar React Native)
* Renderização do jogo: HTML5 Canvas (preferencial) ou Phaser.js integrado ao app React
* Estrutura: modular, organizada por sistemas (Game Loop, Player, Enemies, World, UI)
* Compatível com navegador (desktop e mobile)

---

## 🔄 Mecânica Principal (Game Loop)

O jogo deve seguir este loop:

1. O avião avança automaticamente para frente (scroll vertical)
2. O jogador pode mover horizontalmente (esquerda/direita)
3. O jogador pode atirar continuamente ou sob input
4. Inimigos aparecem progressivamente
5. Combustível diminui ao longo do tempo
6. O jogador deve coletar combustível para continuar
7. O jogo termina ao colidir ou ficar sem combustível

---

## ✈️ Player (Avião)

* Movimento:

  * Horizontal livre dentro do rio
  * Velocidade ajustável
* Ações:

  * Atirar (tiros simples para frente)
* Estados:

  * Vivo
  * Explodindo
  * Game Over
* Colisão:

  * Margens do rio
  * Inimigos
* Coleta:

  * Combustível

---

## 🌍 Mundo / Mapa

* Geração procedural baseada em segmentos
* O rio deve variar:

  * Largura
  * Curvas
* Margens sólidas (colisão ativa)
* Elementos visuais:

  * Árvores
  * Casas
  * Terreno

---

## 👾 Inimigos

Tipos:

* Helicópteros (movimento leve)
* Aviões inimigos (movimento direto)
* Barcos (movimento lento)
* Pontes (bloqueiam progresso)

Comportamento:

* Spawn progressivo (dificuldade crescente)
* Movimentos simples porém variados
* Colisão destrutiva

---

## ⛽ Sistema de Combustível

* Combustível diminui constantemente
* Tanques aparecem no mapa
* Jogador deve:

  * Evitar atirar neles
  * Coletá-los passando por cima
* UI com barra de combustível

---

## 💥 Sistema de Pontuação

* Pontos por:

  * Destruir inimigos
  * Destruir pontes
* Multiplicador opcional
* Exibir score em tempo real

---

## 💣 Colisões

Implementar sistema de colisão baseado em:

* Bounding box simples (AABB)

Casos:

* Player vs inimigos → morte
* Player vs margem → morte
* Tiro vs inimigos → destrói inimigo
* Player vs combustível → coleta

---

## 🎨 Gráficos

* Estilo retrô (pixel art)
* Sprites simples (podem ser placeholders)
* Animações básicas:

  * Explosão
  * Movimento de água

---

## 🔊 Áudio (Opcional)

* Sons:

  * Tiro
  * Explosão
  * Coleta de combustível

---

## 📱 UI / HUD

* Pontuação
* Barra de combustível
* Tela de Game Over
* Botão de restart

---

## ⚙️ Estrutura de Código

Separar em módulos:

* `src/game/Game.ts` → loop principal
* `src/game/Player.ts`
* `src/game/EnemyManager.ts`
* `src/game/World.ts`
* `src/game/FuelSystem.ts`
* `src/game/CollisionSystem.ts`
* `src/game/UI.ts`
* `src/components/GameCanvas.tsx` → integração React + engine do jogo
* `src/App.tsx` → shell da aplicação web

---

## 🚀 Extras (diferencial)

* Aumentar dificuldade com tempo
* Velocidade progressiva
* Ranking local (localStorage)
* Sistema de fases (opcional)

---

## 📦 Entrega esperada

* Código completo funcional
* Estrutura organizada
* Comentários explicativos
* Instruções para rodar o projeto

---

## ⚠️ Regras importantes

* Código limpo e legível
* Evitar dependências desnecessárias
* Garantir boa performance
* Não usar bibliotecas pesadas

---

## 🎯 Resultado final

Um jogo jogável no navegador, fluido, com mecânicas fiéis ao River Raid original, mas com código moderno e organizado.

Comece criando a estrutura base do projeto e depois implemente cada sistema passo a passo.
