# Sprint 04: Áudio Adaptativo & Síntese de Voz Retrô

## 🎯 Objetivo da Sprint
Transformar a experiência sonora do jogo em uma trilha viva e imersiva através de:
1. **Camadas Musicais Dinâmicas (Adaptive Audio Layering)**: Intensidade musical que reage em tempo real ao combo 4x, ao perigo iminente de combustível baixo (<20%) e às batalhas com chefes.
2. **Síntese de Voz 8-Bit Procedural (Retro Speech Synthesizer)**: Anúncios audíveis clássicos de arcade via Web Audio API (*"Warning: Low Fuel"*, *"Combo Max"*, *"Boss Alert"*, *"Zone Cleared"*).
3. **Filtros Acústicos por Bioma**: Simulação de ambiência e eco espacial dependendo do terreno (ex: reverb de desfiladeiro no Canyon e atenuação abafada na Nevasca).

---

## 📋 Mapeamento de Tarefas Detalhadas

### [x] Task 4.1: Configurações, Persistência e Internacionalização dos Canais de Áudio
- **Arquivos impactados:**
  - [SettingsService.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SettingsService.ts)
  - [SettingsService.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SettingsService.test.ts)
  - [i18n.ts](file:///Users/bruno/Dev/pocs/river-raid/src/i18n.ts)
- **Entregas:**
  - Campos `musicVolume`, `sfxVolume`, `voiceVolume`, `voiceEnabled` adicionados ao modelo `GameSettings`, `DEFAULT_SETTINGS` e métodos `getStoredSettings()` / `saveStoredSettings()`.
  - Chaves de tradução em inglês (`en`) e português (`pt-BR`).

---

### [x] Task 4.2: Motor de Síntese de Voz Retrô 8-Bit (`SpeechSynth8Bit.ts`)
- **Arquivos impactados:**
  - [SpeechSynth8Bit.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SpeechSynth8Bit.ts)
  - [SpeechSynth8Bit.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SpeechSynth8Bit.test.ts)
- **Entregas:**
  - Síntese de formantes procedurais (F1/F2 filtros ressonantes + oscilador glótico em pulso dente de serra + modulação de ruído branco com envelope dedicado).
  - Suporte Bilíngue (`en` e `pt-BR`): Formantes e fonemas em Português (*"Alerta Combustível"*, *"Combo Máximo"*, *"Alerta Chefe"*, *"Sobrecarga Pronta"*, *"Missão Concluída"*) e Inglês.
  - Cooldowns inteligentes e canais de volume dedicados com mute.

---

### [x] Task 4.3: Canais de Áudio, Intensidade Adaptativa e Filtros por Bioma
- **Arquivos impactados:**
  - [SoundManager.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SoundManager.ts)
  - [SoundManager.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/SoundManager.test.ts)
- **Entregas:**
  - Árvore de canais Web Audio API (`musicGain`, `sfxGain`, `voiceGain`, `musicFilter`, `sfxFilter`).
  - Recuperação robusta de contexto de áudio em `resume()` e `init()` quando o estado estiver em `closed`.
  - Rampas de ganho suaves com `linearRampToValueAtTime` ao arrastar controles deslizantes de volume.
  - `setDynamicIntensity({ comboMax, lowFuel, inBossFight })`:
    - `lowFuel`: Filtro passa-baixa dramático (650 Hz) gerando atmosfera tensa e abafada.
    - `comboMax`: Camada rápida de arpejos em semicolcheias na melodia.
    - `inBossFight`: Bateria pesada ininterrupta em quatro tempos.
  - `setBiomeAcoustics(biomeId)`: Filtro acústico de atenuação para tempestade de neve (4500 Hz).

---

### [x] Task 4.4: Controles de Áudio no Menu React & Opções de Volume
- **Arquivos impactados:**
  - [SettingsScreen.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/SettingsScreen.tsx)
  - [GameCanvas.tsx](file:///Users/bruno/Dev/pocs/river-raid/src/components/GameCanvas.tsx)
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
- **Entregas:**
  - Sliders para Volume Master, Volume da Música, Volume de Efeitos (SFX) e Volume da Voz.
  - Checkbox para ativar/desativar Síntese de Voz Retrô 8-Bit.
  - Propagação reativa para o motor de jogo via `GameCanvas.tsx` e `Game.ts` (incluindo `setLanguage`).

---

### [x] Task 4.5: Disparadores de Voz e Loop de Jogo
- **Arquivos impactados:**
  - [Game.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.ts)
  - [Game.test.ts](file:///Users/bruno/Dev/pocs/river-raid/src/game/Game.test.ts)
- **Entregas:**
  - Disparo de aviso de combustível baixo ao atingir `<= 20%`.
  - Disparo de aviso *"Combo Max"* ao atingir multiplicador 4x.
  - Disparo de *"Overdrive Ready"* e *"Boss Alert"*.
  - Disparo de *"Zone Cleared"* na derrota do chefe dreadnought.

---

## 🧪 Plano de Verificação da Sprint 04
1. **Testes Automatizados:**
   ```bash
   npm run typecheck       # 0 erros
   npm test                # 541 testes passando (35 arquivos de teste)
   npm run test:coverage   # Statements 84.55%, Branches 78.36%, Functions 82.57%, Lines 85.52%
   npm run lint            # 0 erros, 0 warnings
   npm run build           # Build de produção otimizado com sucesso
   ```
