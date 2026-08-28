# Sprint 04: Áudio Adaptativo & Síntese de Voz Retrô

## 🎯 Objetivo da Sprint
Transformar a experiência sonora do jogo em uma trilha viva e imersiva através de:
1. **Camadas Musicais Dinâmicas (Adaptive Audio Layering)**: Intensidade musical que reage em tempo real ao combo 4x, ao perigo iminente de combustível baixo (<20%) e às batalhas com chefes.
2. **Síntese de Voz 8-Bit Procedural (Retro Speech Synthesizer)**: Anúncios audíveis clássicos de arcade via Web Audio API (*"Warning: Low Fuel"*, *"Combo Max"*, *"Boss Alert"*, *"Zone Cleared"*).
3. **Filtros Acústicos por Bioma**: Simulação de ambiência e eco espacial dependendo do terreno (ex: reverb de desfiladeiro no Canyon e atenuação abafada na Nevasca).

---

## 📋 Mapeamento de Tarefas Detalhadas

### Task 4.1: Arquitetura de Camadas Musicais no `SoundManager.ts`
- **Arquivos impactados:**
  - [SoundManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SoundManager.ts)
  - [SoundManager.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SoundManager.test.ts)
- **Sub-etapas:**
  1. Estruturar os nós de áudio do `SoundManager` com nós de ganho (`GainNode`) dedicados para:
     - `coreLeadGain`, `bassGain`, `arpeggioIntensityGain`, `drumTensionGain`.
  2. Implementar método `setDynamicIntensity({ comboMax: boolean, lowFuel: boolean, inBossFight: boolean })`:
     - **Combo x4**: Eleva o volume da camada de arpejos rápidos em 16-bits.
     - **Low Fuel (<20%)**: Aplica um filtro passa-baixa dramático (LowPass BiquadFilter a 650 Hz) e acelera o pulso do bumbo (*heartbeat effect*).
     - **Boss Fight**: Ativa a faixa de percussão pesada contínua.
  3. Atualizar testes unitários em `SoundManager.test.ts`.
- **Critérios de Aceite:**
  - As transições de volume entre camadas usam `gainNode.gain.linearRampToValueAtTime` para evitar cliques ou estalos de áudio.

---

### Task 4.2: Motor de Síntese de Voz Retrô 8-Bit (`SpeechSynth8Bit.ts`)
- **Arquivos impactados:**
  - `src/game/SpeechSynth8Bit.ts` [NEW]
  - `src/game/SpeechSynth8Bit.test.ts` [NEW]
  - [SoundManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SoundManager.ts)
- **Sub-etapas:**
  1. Implementar sintetizador baseado em formantes (formant synthesis) ou reprodução de fonemas PCM sintéticos de 4-bits com osciladores modulados por frequência (FM) + ruído filtrado:
     - Clips táticos gerados puramente via Web Audio API:
       - `playWarningLowFuel()`
       - `playComboMax()`
       - `playBossAlert()`
       - `playMissionComplete()`
  2. Adicionar controle de volume independente e cooldown para evitar sobreposição caótica de vozes.
  3. Testes unitários em `SpeechSynth8Bit.test.ts`.
- **Critérios de Aceite:**
  - Áudio soa autêntico como os chips de voz dos fliperamas dos anos 80 (estilo *Berzerk* / *Sinistar*).
  - 100% procedural, sem necessidade de arquivos `.mp3`/`.wav` externos pesados.

---

### Task 4.3: Filtros de Ambiência por Bioma
- **Arquivos impactados:**
  - [SoundManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SoundManager.ts)
  - [BiomeSystem.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/BiomeSystem.ts)
- **Sub-etapas:**
  1. Criar nós `ConvolverNode` / `DelayNode` para simular reverberação leve nos biomas de montanha/cânion e abafamento suave na neve.
  2. Conectar os efeitos aos tiros e explosões dependendo do bioma atual reportado pelo `BiomeSystem`.
  3. Validar no `SoundManager.test.ts`.
- **Critérios de Aceite:**
  - Tiro no desfiladeiro tem eco audível característico.
  - Zero sobrecarga de CPU no processamento de áudio.

---

### Task 4.4: Controles de Áudio no Menu React & Opções de Volume
- **Arquivos impactados:**
  - [SettingsService.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SettingsService.ts)
  - [SettingsScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/SettingsScreen.tsx)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Sub-etapas:**
  1. Adicionar sliders separados para **Volume da Música**, **Volume dos Efeitos (SFX)** e toggle para **Voz Retrô**.
  2. Atualizar UI de configurações com feedback auditivo ao arrastar os sliders (toca um beep de teste no volume escolhido).
  3. Atualizar traduções em `i18n.ts`.
- **Critérios de Aceite:**
  - O usuário pode mutar apenas a voz ou música sem afetar os SFX essenciais de tiros e combustível.

---

## 🧪 Plano de Verificação da Sprint 04
1. **Testes Automatizados:**
   ```bash
   npm run typecheck
   npm test
   ```
2. **Validação Sonora no Navegador:**
   - Jogar até alcançar combo x4 e notar o aumento da camada de arpejos na música.
   - Deixar o combustível cair abaixo de 20% e ouvir o anúncio vocal retrô *"Warning: Low Fuel"* e o filtro tenso na trilha.
   - Ajustar os sliders de música e voz no menu de configurações.
