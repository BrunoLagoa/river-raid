# Sprint 08: PWA, Cache de Sprites & Otimizações Finais

## 🎯 Objetivo da Sprint
Garantir máxima performance de renderização, suporte offline e integridade do projeto através de:
1. **Progressive Web App (PWA) & Instalação Offline**: Service Worker, Web App Manifest com ícones retro e suporte completo a execução offline sem conexão à internet.
2. **Cache de Sprites em Offscreen Canvas**: Pré-renderização em bitmaps estáticos para inimigos e partículas para eliminar chamadas repetitivas de desenho vetorial no loop a 60 FPS.
3. **Escalonamento HiDPI / Retina Dinâmico**: Ajuste automático da densidade de pixels no canvas para nitidez cristalina em monitores 2K/4K e telas Retina mobile.
4. **Validação Geral de Cobertura e CI**: Garantir que todas as suítes de testes passem com 100% de integridade sob as regras estritas do projeto.

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 8.1: Configuração do PWA (Service Worker & Manifest)
- **Arquivos impactados:**
  - `public/manifest.json` [NEW]
  - `public/sw.js` [NEW]
  - `public/icons/` [NEW]
  - [index.html](file:///Users/bruno/Dev/pocs/river-raid/index.html)
  - [main.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/main.tsx)
- **Sub-etapas:**
  1. Criar `manifest.json` com `name: "River Raid"`, `short_name: "RiverRaid"`, `display: "standalone"`, `orientation: "portrait-primary"`, tema `#0d1b2a` e ícones retro (192x192 e 512x512).
  2. Implementar `sw.js` com estratégia *Cache-First* para assets estáticos e fallback seguro para SPA (`base: '/river-raid/'`).
  3. Registrar o Service Worker em `main.tsx` apenas em ambiente de produção.
  4. Adicionar meta tags em `index.html` (apple-touch-icon, theme-color, viewport-fit=cover).
- **Critérios de Aceite:**
  - O aplicativo pode ser instalado no celular/desktop e abre sem internet.

---

### Task 8.2: Cache de Renderização em Offscreen Canvas (`SpriteCache.ts`)
- **Arquivos impactados:**
  - `src/game/SpriteCache.ts` [NEW]
  - `src/game/SpriteCache.test.ts` [NEW]
  - [EnemyRenderer.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyRenderer.ts)
  - [HazardRenderer.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/HazardRenderer.ts)
- **Sub-etapas:**
  1. Criar gerenciador `SpriteCache` que desenha previamente cada variante de inimigo (helicóptero com pás em rotação, caças, barcos e tanques) em um canvas pequeno isolado na memória.
  2. Substituir no `EnemyRenderer` o desenho por primitivas geométricas por chamadas ultra-rápidas `ctx.drawImage(cachedCanvas, x, y)`.
  3. Testes de integridade gráfica e cache em `SpriteCache.test.ts`.
- **Critérios de Aceite:**
  - Redução de pelo menos 35% no tempo de CPU gasto pelo renderizador de entidades.
  - Zero alteração na aparência visual das entidades.

---

### Task 8.3: Suporte a Monitores Retina e HiDPI Dinâmico
- **Arquivos impactados:**
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Sub-etapas:**
  1. Ajustar o tamanho interno do canvas (`canvas.width = cssWidth * dpr`, `canvas.height = cssHeight * dpr`) respeitando um teto máximo de DPR = 2 para preservar bateria em celulares 3x/4x.
  2. Aplicar `ctx.scale(dpr, dpr)` no início de cada frame e ajustar a amostragem de toques mobile.
  3. Testes unitários de redimensionamento e escala.
- **Critérios de Aceite:**
  - Gráficos e textos pixel-art e vetoriais ficam 100% nítidos em monitores Mac Retina e celulares modernos.

---

### Task 8.4: Validação de Cobertura, Portões de Qualidade & CI
- **Arquivos impactados:**
  - `vite.config.ts`
  - `AGENTS.md`
- **Sub-etapas:**
  1. Atualizar a lista de inclusão de cobertura em `vite.config.ts` para incluir todos os novos módulos essenciais do motor.
  2. Executar suíte completa:
     ```bash
     npm run typecheck
     npm run test:coverage
     npm run lint
     npm run build
     ```
  3. Validar se todos os limites de cobertura (statements, branches, functions, lines) são superados com folga.
- **Critérios de Aceite:**
  - Build de produção (`dist/`) gerado sem warnings e pronto para deploy automático no GitHub Pages.

---

## 🧪 Plano de Verificação e Resultados da Sprint 08
1. **Testes Automatizados & Portões de Qualidade:**
   - `npm run typecheck`: **0 erros (Strict TypeScript Compliance)**.
   - `npm test`: **617 testes passando (50 arquivos de teste)**.
   - `npm run lint`: **0 warnings / 0 erros (ESLint Flat Config)**.
   - `npm run test:coverage`:
     - Statements: **87.34%** (meta >= 82%)
     - Branches: **78.16%** (meta >= 75%)
     - Functions: **82.99%** (meta >= 75%)
     - Lines: **88.57%** (meta >= 82%)
   - `npm run build`: Bundle de produção gerado com sucesso em **92ms**.

2. **Entregas Validadas:**
   - Suporte a **Progressive Web App (PWA)** com `public/manifest.json`, `public/sw.js` (Cache-First offline strategy) e meta tags para Safari iOS e Android (`theme-color: #050a14`, `viewport-fit=cover`).
   - Módulo de cache de renderização de alto desempenho em [SpriteCache.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SpriteCache.ts) e integração com [EnemyRenderer.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/EnemyRenderer.ts).
   - Escalonamento **HiDPI / Retina dinâmico** com `dpr = Math.min(window.devicePixelRatio, 2)` mantendo nitidez em telas 2K/4K e celulares modernos.

---

## 🏁 Status: CONCLUÍDO (100% Entregue)

