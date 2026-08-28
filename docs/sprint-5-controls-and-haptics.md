# Sprint 05: Controles Customizados, Haptics & Mobile Joystick

## 🎯 Objetivo da Sprint
Oferecer máxima acessibilidade e controle fluido em qualquer dispositivo, implementando:
1. **Remapeamento Completo de Teclado (Custom Keybindings)**: Interface interativa para configurar qualquer tecla para Esquerda, Direita, Acelerar, Frear, Atirar, Overdrive e Pausa.
2. **Feedback Tátil Háptico (Vibration API)**: Vibração imersiva no Gamepad (`vibrationActuator`) e no Mobile (`navigator.vibrate`) para disparos, impactos e destruição de pontes.
3. **Joystick Virtual Analógico Flutuante (Floating Dynamic Joystick)**: Controle touch que surge sob o toque do jogador em qualquer ponto do lado esquerdo da tela.

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 5.1: Sistema de Gerenciamento de Teclas (`KeybindingService.ts`)
- **Arquivos impactados:**
  - `src/game/KeybindingService.ts` [NEW]
  - `src/game/KeybindingService.test.ts` [NEW]
  - [SettingsService.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SettingsService.ts)
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
- **Sub-etapas:**
  1. Criar interfaces e tipos para as ações mapeáveis:
     ```ts
     export interface Keybindings {
       left: string[]
       right: string[]
       accelerate: string[]
       brake: string[]
       shoot: string[]
       overdrive: string[]
       pause: string[]
     }
     ```
  2. Implementar valores padrão (`ArrowLeft`/`KeyA`, `ArrowRight`/`KeyD`, `ArrowUp`/`KeyW`, `ArrowDown`/`KeyS`, `Space`, `ShiftLeft`/`KeyX`, `KeyP`/`Escape`).
  3. Criar métodos de validação para detectar conflitos de teclas e persistir no `localStorage`.
  4. Testes unitários em `KeybindingService.test.ts`.
- **Critérios de Aceite:**
  - Permite atribuir teclas primárias e secundárias por ação.
  - Carrega e salva com segurança no `SettingsService`.

---

### Task 5.2: Tela de Configuração de Controles no Menu React
- **Arquivos impactados:**
  - `src/components/KeybindingModal.tsx` [NEW]
  - `src/components/KeybindingModal.test.tsx` [NEW]
  - [SettingsScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/SettingsScreen.tsx)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Sub-etapas:**
  1. Desenhar modal interativo retrô onde o usuário clica em uma ação e pressiona a nova tecla desejada ("Pressione qualquer tecla...").
  2. Adicionar botão para "Restaurar Padrões".
  3. Prevenir travamento com teclas de sistema como F5 ou F12.
  4. Testes com `@testing-library/react` em `KeybindingModal.test.tsx`.
- **Critérios de Aceite:**
  - Teclas atribuídas são refletidas instantaneamente na jogabilidade.

---

### Task 5.3: Motor de Vibração e Feedback Háptico (`HapticsEngine.ts`)
- **Arquivos impactados:**
  - `src/game/HapticsEngine.ts` [NEW]
  - `src/game/HapticsEngine.test.ts` [NEW]
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Sub-etapas:**
  1. Implementar `HapticsEngine`:
     - Disparar pulsos curtos (15ms) no tiro contínuo.
     - Pulso médio (80ms) ao abater helicópteros e caças.
     - Pulso longo duplo (180ms, 250ms) ao destruir pontes ou levar dano.
     - Vibração contínua e forte no Gamepad via `vibrationActuator.playEffect('dual-rumble', ...)` com intensidades balanceadas para motores de baixa e alta frequência.
  2. Respeitar a configuração de `reducedMotion` e toggle de vibração no menu de configurações.
  3. Testes unitários com mocks de `navigator.vibrate` e `Gamepad` em `HapticsEngine.test.ts`.
- **Critérios de Aceite:**
  - Responde instantaneamente sem atraso perceptual em controles compatíveis (Xbox, DualShock/DualSense e smartphones Android/iOS).

---

### Task 5.4: Joystick Analógico Flutuante para Mobile (`FloatingJoystick.tsx`)
- **Arquivos impactados:**
  - `src/components/FloatingJoystick.tsx` [NEW]
  - `src/components/FloatingJoystick.css` [NEW]
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
  - [SettingsScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/SettingsScreen.tsx)
- **Sub-etapas:**
  1. Criar componente touch que posiciona o centro do joystick no ponto de contato do dedo (`touchstart`), com anel exterior e manopla interna que segue o movimento com clamping radial.
  2. Converter o vetor analógico $(dx, dy)$ em intensidade de movimento horizontal e ajuste de velocidade.
  3. Permitir selecionar o modo de controle móvel nas configurações: **D-Pad Fixo**, **Swipe** ou **Joystick Flutuante**.
  4. Testes de render e interação touch.
- **Critérios de Aceite:**
  - Suavidade de resposta a 60 FPS com cancelamento apropriado de scroll padrão do navegador (`touch-action: none`).

---

## 🧪 Plano de Verificação e Resultados da Sprint 05
1. **Testes Automatizados:**
   - `npm run typecheck`: **0 erros** (Strict TypeScript).
   - `npm test`: **570 testes passando (40 arquivos de teste)**.
   - `npm run lint`: **0 warnings / 0 erros** (ESLint flat config).
   - `npm run test:coverage`:
     - Statements: **84.52%** (meta >= 82%)
     - Branches: **77.72%** (meta >= 75%)
     - Functions: **83.06%** (meta >= 75%)
     - Lines: **85.60%** (meta >= 82%)
   - `npm run build`: Bundle de produção gerado com sucesso em **90ms**.

2. **Validação Funcional:**
   - Remapeamento de teclado via `KeybindingModal.tsx` com suporte a slots primário e secundário e aliases automáticos.
   - Motor de vibração `HapticsEngine.ts` integrado a Gamepad (`vibrationActuator`) e Mobile (`navigator.vibrate`) para tiro, overdrive, alertas de chefe, destruição de pontes e danos.
   - `FloatingJoystick.tsx` implementado com tracking radial suave, clamping geométrico, e botões ergonômicos de Tiro e Overdrive.
   - Seletor de Modo de Controle Mobile (`joystick` | `dpad` | `swipe`) integrado ao menu de configurações.

---

## 🏁 Status: CONCLUÍDO (100% Entregue)

