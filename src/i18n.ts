import type { AchievementId } from './game/AchievementService'
import type { PowerUpType } from './game/PowerUpSystem'

export type Language = 'en' | 'pt-BR'

export interface Strings {
  // Menu
  menuSubtitle: string
  menuTagline: string
  menuLabelMove: string
  menuLabelFire: string
  menuBtnStart: string
  menuBtnTutorial: string
  menuBtnSettings: string
  menuBtnHangar: string
  menuBtnStats: string
  menuBtnDaily: string
  menuDailyBest: string
  menuPressEnter: string
  menuMute: string
  menuUnmute: string
  dailyBadge: string

  // Tutorial
  tutorialSubtitle: string
  tutorialTitle: string
  tutorialObjective: string
  tutorialCardNavigate: string
  tutorialCardCombat: string
  tutorialCardSurvive: string
  tutorialNavigate1: string
  tutorialNavigate2: string
  tutorialNavigate3: string
  tutorialCombat1: string
  tutorialCombat2: string
  tutorialCombat3: string
  tutorialSurvive1: string
  tutorialSurvive2: string
  tutorialSurvive3: string
  tutorialBtnStart: string
  tutorialBtnBack: string

  // Settings
  settingsTitle: string
  settingsSubtitle: string
  settingsLabelVolume: string
  settingsLabelMusicVolume: string
  settingsLabelSfxVolume: string
  settingsLabelVoiceVolume: string
  settingsLabelVoiceEnabled: string
  settingsLabelMute: string
  settingsLabelReducedMotion: string
  settingsLabelWeather: string
  settingsLabelLighting: string
  settingsLabelColorblind: string
  settingsLabelGamepad: string
  settingsLabelHaptics: string
  settingsLabelGhostReplay: string
  settingsLabelControls: string
  settingsBtnConfigureKeys: string
  settingsSectionAudio: string
  settingsSectionGameplay: string
  settingsLabelKeyboard: string
  settingsLabelMobileControl: string
  mobileControlJoystick: string
  mobileControlDpad: string
  mobileControlSwipe: string
  keybindModalTitle: string
  keybindModalSubtitle: string
  keybindActionLeft: string
  keybindActionRight: string
  keybindActionAccelerate: string
  keybindActionBrake: string
  keybindActionShoot: string
  keybindActionOverdrive: string
  keybindActionPause: string
  keybindListeningPrompt: string
  keybindBtnReset: string
  keybindBtnDone: string
  settingsLabelObjectiveProfile: string
  settingsProfileConservative: string
  settingsProfileAggressive: string
  settingsLabelDifficulty: string
  difficultyEasy: string
  difficultyNormal: string
  difficultyHard: string
  settingsLabelLanguage: string
  settingsLangEn: string
  settingsLangPt: string
  settingsLabelAchievements: string
  settingsAchievementUnlocked: string
  settingsAchievementLocked: string
  settingsTooltipHowTo: string
  settingsTooltipLore: string
  achievementLore: Record<AchievementId, string>
  settingsBtnBack: string
  settingsBtnPlay: string

  // Game Modes
  modeSelectTitle: string
  modeSelectSubtitle: string
  modeBtnPlay: string
  modeBtnBack: string
  modeClassicName: string
  modeClassicDesc: string
  modeDailyName: string
  modeDailyDesc: string
  modeBossRushName: string
  modeBossRushDesc: string
  modeHardcoreName: string
  modeHardcoreDesc: string
  modeZenName: string
  modeZenDesc: string
  modeTag1Life: string
  modeTagFastFuel: string
  modeTagNoMinimap: string
  modeTagInfiniteLives: string
  modeTagNoFuelDrain: string
  modeTagRapidBosses: string
  modeTagDeterministic: string
  menuBtnModes: string

  // Hangar & Skins
  hangarTitle: string
  hangarSubtitle: string
  hangarBtnEquip: string
  hangarBtnEquipped: string
  hangarBtnLocked: string
  hangarRequiredScore: string
  hangarRequiredAchievement: string
  hangarBtnBack: string
  skinClassicName: string
  skinClassicDesc: string
  skinStealthName: string
  skinStealthDesc: string
  skinBiplaneName: string
  skinBiplaneDesc: string
  skinCyberNeonName: string
  skinCyberNeonDesc: string
  skinRequirementDefault: string
  skinRequirementSharpshooter: string
  skinRequirementFirstBridge: string
  skinRequirementScore25k: string

  // Career Stats
  statsTitle: string
  statsSubtitle: string
  statsTotalFlightTime: string
  statsTotalScore: string
  statsTotalRuns: string
  statsTotalFuel: string
  statsAccuracy: string
  statsShotsFired: string
  statsShotsHit: string
  statsHighestCombo: string
  statsTotalKills: string
  statsHelicoptersKilled: string
  statsPlanesKilled: string
  statsBoatsKilled: string
  statsGunboatsKilled: string
  statsTanksKilled: string
  statsBridgesKilled: string
  statsBossesKilled: string
  statsBtnClose: string
  statsBtnReset: string
  statsResetConfirm: string

  // Game Over
  gameoverTitle: string
  gameoverLabelScore: string
  gameoverLabelBest: string
  gameoverNewBest: string
  gameoverTop10: string
  gameoverNoRecords: string
  gameoverTop10Label: string
  gameoverEnterName: string
  gameoverBtnSave: string
  gameoverPressEnter: string
  gameoverAchievementsHeader: string

  // HUD
  hudPaused: string
  hudPauseHint: string
  hudDistance: string
  hudPauseLabel: string
  hudMuteLabel: string
  hudExtraLife: string
  hudBossName: string
  hudBossPhase: string
  hudOverdriveActive: string
  hudOverdriveReady: string

  // Power-ups (tutorial + pickup toast)
  tutorialCardPowerups: string
  powerupNames: Record<PowerUpType, string>
  powerupDescs: Record<PowerUpType, string>

  // Localized achievement catalog (title + how-to), keyed by AchievementId
  achievementCatalog: Record<AchievementId, { title: string; description: string }>
}

const en: Strings = {
  menuSubtitle: '— CLASSIC ARCADE —',
  menuTagline: 'FLY. SHOOT. SURVIVE.',
  menuLabelMove: 'MOVE',
  menuLabelFire: 'FIRE',
  menuBtnStart: 'START',
  menuBtnTutorial: 'TUTORIAL',
  menuBtnSettings: 'SETTINGS',
  menuBtnHangar: 'HANGAR',
  menuBtnStats: 'PILOT LOG',
  menuBtnDaily: 'DAILY CHALLENGE',
  menuDailyBest: "Today's best",
  menuPressEnter: '▸ TAP OR PRESS ENTER TO START ◂',
  menuMute: 'MUTE SOUND',
  menuUnmute: 'UNMUTE SOUND',
  dailyBadge: 'DAILY CHALLENGE',

  tutorialSubtitle: '— MISSION BRIEFING —',
  tutorialTitle: 'HOW TO PLAY',
  tutorialObjective: 'Fly down the river. Destroy enemies and bridges. Keep your fuel above 0%.',
  tutorialCardNavigate: 'NAVIGATE',
  tutorialCardCombat: 'COMBAT',
  tutorialCardSurvive: 'SURVIVE',
  tutorialNavigate1: 'Arrows / WASD — all directions',
  tutorialNavigate2: 'Drag anywhere on mobile',
  tutorialNavigate3: 'Left stick (gamepad)',
  tutorialCombat1: 'SPACE to shoot · A button (gamepad)',
  tutorialCombat2: 'X to unleash the Overdrive Laser',
  tutorialCombat3: 'Destroy enemies, bridges & bosses',
  tutorialSurvive1: 'Collect fuel depots',
  tutorialSurvive2: 'Stay inside the river',
  tutorialSurvive3: 'P to pause · M to mute',
  tutorialBtnStart: 'START MISSION',
  tutorialBtnBack: 'BACK',

  settingsTitle: 'SETTINGS',
  settingsSubtitle: '— CONFIGURATION —',
  settingsLabelVolume: 'Master Volume',
  settingsLabelMusicVolume: 'Music Volume',
  settingsLabelSfxVolume: 'SFX Volume',
  settingsLabelVoiceVolume: 'Voice Volume',
  settingsLabelVoiceEnabled: 'Retro 8-Bit Voice',
  settingsLabelMute: 'Mute by default',
  settingsLabelReducedMotion: 'Reduced motion',
  settingsLabelWeather: 'Weather effects',
  settingsLabelLighting: 'Dynamic lighting',
  settingsLabelColorblind: 'Colorblind cues',
  settingsLabelGamepad: 'Enable gamepad',
  settingsLabelHaptics: 'Tactile Haptic Feedback',
  settingsLabelGhostReplay: 'Ghost Aircraft Replay',
  settingsLabelControls: 'Controls',
  settingsBtnConfigureKeys: 'Configure Keyboard...',
  settingsSectionAudio: 'Audio',
  settingsSectionGameplay: 'Gameplay & Accessibility',
  settingsLabelKeyboard: 'Keyboard',
  settingsLabelMobileControl: 'Mobile Control Mode',
  mobileControlJoystick: 'Floating Joystick',
  mobileControlDpad: 'Fixed D-Pad',
  mobileControlSwipe: 'Swipe Gestures',
  keybindModalTitle: 'CUSTOM CONTROLS',
  keybindModalSubtitle: '— KEYBOARD REMAPPING —',
  keybindActionLeft: 'Bank Left',
  keybindActionRight: 'Bank Right',
  keybindActionAccelerate: 'Accelerate',
  keybindActionBrake: 'Brake / Slow Down',
  keybindActionShoot: 'Fire Machine Gun',
  keybindActionOverdrive: 'Activate Overdrive',
  keybindActionPause: 'Pause Game',
  keybindListeningPrompt: 'PRESS ANY KEY TO BIND...',
  keybindBtnReset: 'RESTORE DEFAULTS',
  keybindBtnDone: 'DONE',
  settingsLabelObjectiveProfile: 'Objective Profile',
  settingsProfileConservative: 'Conservative',
  settingsProfileAggressive: 'Aggressive',
  settingsLabelDifficulty: 'Difficulty',
  difficultyEasy: 'Easy',
  difficultyNormal: 'Normal',
  difficultyHard: 'Hard',
  settingsLabelLanguage: 'Language',
  settingsLangEn: 'English',
  settingsLangPt: 'Português',
  settingsLabelAchievements: 'ACHIEVEMENTS',
  settingsAchievementUnlocked: 'UNLOCKED',
  settingsAchievementLocked: 'LOCKED',
  settingsTooltipHowTo: 'HOW TO UNLOCK',
  settingsTooltipLore: 'ABOUT',
  achievementLore: {
    first_bridge:    'The river holds many bridges — you brought the first one down. Concrete and steel met their match in your crosshairs.',
    combo_master:    'Chaos has a rhythm. You found it. Four targets down in perfect sequence, the river still burning behind you.',
    fuel_saver:      'Discipline under fire. While others burned through reserves, you kept your tank high and your cool intact.',
    sharpshooter:    'Fifty confirmed kills. The skies above the river learned to fear your approach.',
    survivor:        'Ten thousand points carved from hostile territory. The mission is far from over — but you proved you belong here.',
    power_collector: 'Ten upgrades seized from the battlefield. You turned enemy drops into your own arsenal.',
    high_flyer:      'Fifty thousand points. A name etched into the river\'s history, written in smoke and wreckage.',
    untouchable:     'An entire run. Not a single hit. The enemy fired — you were already somewhere else.',
  },
  settingsBtnBack: 'BACK',
  settingsBtnPlay: 'PLAY',

  // Game Modes
  modeSelectTitle: 'MISSION SELECT',
  modeSelectSubtitle: '— SELECT OPERATION MODE —',
  modeBtnPlay: 'LAUNCH MISSION',
  modeBtnBack: 'BACK',
  modeClassicName: 'Classic Patrol',
  modeClassicDesc: 'Standard flight rules. 3 lives, dynamic fuel depletion and full radar assistance.',
  modeDailyName: 'Daily Challenge',
  modeDailyDesc: 'Daily seeded river layout. Compete for the global top score of the day.',
  modeBossRushName: 'Boss Rush',
  modeBossRushDesc: 'Intense naval and aerial dreadnought encounters every 35 seconds. High danger, high fuel drops.',
  modeHardcoreName: 'Iron Man / Hardcore',
  modeHardcoreDesc: '1 single life. Faster fuel drain and no radar assistance. Only for veteran aces.',
  modeZenName: 'Zen Flight',
  modeZenDesc: 'Endless flight practice. Infinite fuel and no game over. Perfect for dodging practice and relaxation.',
  modeTag1Life: '1 Life Only',
  modeTagFastFuel: '+35% Fuel Drain',
  modeTagNoMinimap: 'No Radar',
  modeTagInfiniteLives: 'Infinite Lives',
  modeTagNoFuelDrain: 'No Fuel Drain',
  modeTagRapidBosses: 'Bosses Every 35s',
  modeTagDeterministic: 'Daily Seed',
  menuBtnModes: 'MODES',

  // Hangar & Skins
  hangarTitle: 'AIRCRAFT HANGAR',
  hangarSubtitle: '— CUSTOMIZE YOUR FIGHTER —',
  hangarBtnEquip: 'EQUIP',
  hangarBtnEquipped: 'EQUIPPED',
  hangarBtnLocked: 'LOCKED',
  hangarRequiredScore: 'Requires Score:',
  hangarRequiredAchievement: 'Requires Achievement:',
  hangarBtnBack: 'BACK',
  skinClassicName: 'Classic 2600',
  skinClassicDesc: 'The legendary yellow interceptor that started it all.',
  skinStealthName: 'Stealth Nighthawk',
  skinStealthDesc: 'Radar-absorbent faceted black jet with violet ion thrusters.',
  skinBiplaneName: 'Vintage Biplane',
  skinBiplaneDesc: 'Classic double-wing fighter with spinning wooden propeller.',
  skinCyberNeonName: 'Cyber-Viper',
  skinCyberNeonDesc: 'Futuristic forward-swept neon fighter with plasma pulse drives.',
  skinRequirementDefault: 'Available by default',
  skinRequirementSharpshooter: 'Unlock the "Sharpshooter" achievement (50 kills in one run)',
  skinRequirementFirstBridge: 'Unlock the "Bridge Breaker" achievement (Destroy 1 bridge)',
  skinRequirementScore25k: 'Reach a High Score of 25,000 points',

  // Career Stats
  statsTitle: 'PILOT LOGBOOK',
  statsSubtitle: '— LIFETIME CAREER STATS —',
  statsTotalFlightTime: 'Total Flight Time',
  statsTotalScore: 'Career Score Accumulated',
  statsTotalRuns: 'Total Missions Flown',
  statsTotalFuel: 'Fuel Depots Captured',
  statsAccuracy: 'Overall Accuracy',
  statsShotsFired: 'Total Shots Fired',
  statsShotsHit: 'Confirmed Hits',
  statsHighestCombo: 'Highest Combo Achieved',
  statsTotalKills: 'Total Targets Destroyed',
  statsHelicoptersKilled: 'Helicopters',
  statsPlanesKilled: 'Jets',
  statsBoatsKilled: 'Boats',
  statsGunboatsKilled: 'Gunboats',
  statsTanksKilled: 'Tanks',
  statsBridgesKilled: 'Bridges Demolished',
  statsBossesKilled: 'Dreadnought Bosses Defeated',
  statsBtnClose: 'CLOSE',
  statsBtnReset: 'RESET LOGBOOK',
  statsResetConfirm: 'Are you sure you want to reset all lifetime career stats?',

  gameoverTitle: 'GAME OVER',
  gameoverLabelScore: 'FINAL SCORE',
  gameoverLabelBest: 'BEST',
  gameoverNewBest: 'NEW BEST!',
  gameoverTop10: 'TOP 10',
  gameoverNoRecords: 'No records yet',
  gameoverTop10Label: 'TOP 10 - ENTER YOUR NAME',
  gameoverEnterName: 'TOP 10 - ENTER YOUR NAME',
  gameoverBtnSave: 'SAVE',
  gameoverPressEnter: '> TAP OR PRESS ENTER TO RETRY <',
  gameoverAchievementsHeader: 'ACHIEVEMENTS UNLOCKED',

  hudPaused: 'PAUSED',
  hudPauseHint: 'Press P or ESC to resume',
  hudDistance: 'DIST',
  hudPauseLabel: 'P  PAUSE',
  hudMuteLabel: 'M  MUTE',
  hudExtraLife: 'EXTRA LIFE!',
  hudBossName: 'DREADNOUGHT MK-I',
  hudBossPhase: 'PHASE',
  hudOverdriveActive: 'OVERDRIVE',
  hudOverdriveReady: 'OVERDRIVE READY! [X]',

  tutorialCardPowerups: 'POWER-UPS',
  powerupNames: {
    double_shot: 'Double Shot',
    shield: 'Shield',
    slow_motion: 'Slow Motion',
    rapid_fire: 'Rapid Fire',
    magnet_fuel: 'Fuel Magnet',
    bomb: 'Smart Bomb',
  },
  powerupDescs: {
    double_shot: 'Fires two bullets at once',
    shield: 'Absorbs one hit',
    slow_motion: 'Slows the world briefly',
    rapid_fire: 'Shoot much faster',
    magnet_fuel: 'Pulls fuel tanks toward you',
    bomb: 'Destroys all on-screen enemies',
  },
  achievementCatalog: {
    first_bridge:    { title: 'Bridge Breaker', description: 'Destroy a bridge' },
    combo_master:    { title: 'Combo Master', description: 'Finish a run with combo x4 active' },
    fuel_saver:      { title: 'Fuel Saver', description: 'Keep fuel above 75% for 60s' },
    sharpshooter:    { title: 'Sharpshooter', description: 'Destroy 50 enemies in a run' },
    survivor:        { title: 'Survivor', description: 'Reach 10,000 points in a run' },
    power_collector: { title: 'Power Collector', description: 'Collect 10 power-ups in a run' },
    high_flyer:      { title: 'High Flyer', description: 'Reach 50,000 points in a run' },
    untouchable:     { title: 'Untouchable', description: 'Complete a run without losing a life' },
  },
}

const ptBR: Strings = {
  menuSubtitle: '— ARCADE CLÁSSICO —',
  menuTagline: 'VOE. ATIRE. SOBREVIVA.',
  menuLabelMove: 'MOVER',
  menuLabelFire: 'ATIRAR',
  menuBtnStart: 'INICIAR',
  menuBtnTutorial: 'TUTORIAL',
  menuBtnSettings: 'OPÇÕES',
  menuBtnHangar: 'HANGAR',
  menuBtnStats: 'DIÁRIO DE BORDO',
  menuBtnDaily: 'DESAFIO DIÁRIO',
  menuDailyBest: 'Melhor de hoje',
  menuPressEnter: '▸ TOQUE OU PRESSIONE ENTER PARA INICIAR ◂',
  menuMute: 'SILENCIAR SOM',
  menuUnmute: 'ATIVAR SOM',
  dailyBadge: 'DESAFIO DIÁRIO',

  tutorialSubtitle: '— INSTRUÇÕES —',
  tutorialTitle: 'COMO JOGAR',
  tutorialObjective: 'Voe pelo rio. Destrua inimigos e pontes. Mantenha o combustível acima de 0%.',
  tutorialCardNavigate: 'NAVEGAR',
  tutorialCardCombat: 'COMBATE',
  tutorialCardSurvive: 'SOBREVIVER',
  tutorialNavigate1: 'Setas / WASD — todas as direções',
  tutorialNavigate2: 'Arraste em qualquer lugar no mobile',
  tutorialNavigate3: 'Analógico esquerdo (gamepad)',
  tutorialCombat1: 'ESPAÇO para atirar · Botão A (gamepad)',
  tutorialCombat2: 'X para ativar o Overdrive Laser',
  tutorialCombat3: 'Destrua inimigos, pontes e chefes',
  tutorialSurvive1: 'Colete depósitos de combustível',
  tutorialSurvive2: 'Fique dentro do rio',
  tutorialSurvive3: 'P para pausar · M para mutar',
  tutorialBtnStart: 'INICIAR MISSÃO',
  tutorialBtnBack: 'VOLTAR',

  settingsTitle: 'OPÇÕES',
  settingsSubtitle: '— CONFIGURAÇÕES —',
  settingsLabelVolume: 'Volume Principal',
  settingsLabelMusicVolume: 'Volume da Música',
  settingsLabelSfxVolume: 'Volume dos Efeitos (SFX)',
  settingsLabelVoiceVolume: 'Volume da Voz',
  settingsLabelVoiceEnabled: 'Voz Retrô 8-Bit',
  settingsLabelMute: 'Mudo por padrão',
  settingsLabelReducedMotion: 'Movimento reduzido',
  settingsLabelWeather: 'Efeitos climáticos',
  settingsLabelLighting: 'Iluminação dinâmica',
  settingsLabelColorblind: 'Indicadores p/ daltonismo',
  settingsLabelGamepad: 'Ativar gamepad',
  settingsLabelHaptics: 'Feedback Tátil / Vibração',
  settingsLabelGhostReplay: 'Avião Fantasma (Replay)',
  settingsLabelControls: 'Controles',
  settingsBtnConfigureKeys: 'Configurar Teclado...',
  settingsSectionAudio: 'Áudio',
  settingsSectionGameplay: 'Jogo e Acessibilidade',
  settingsLabelKeyboard: 'Teclado',
  settingsLabelMobileControl: 'Modo de Controle Mobile',
  mobileControlJoystick: 'Joystick Flutuante',
  mobileControlDpad: 'D-Pad Fixo',
  mobileControlSwipe: 'Gestos Swipe',
  keybindModalTitle: 'CONTROLES PERSONALIZADOS',
  keybindModalSubtitle: '— MAPEAMENTO DE TECLADO —',
  keybindActionLeft: 'Inclinar p/ Esquerda',
  keybindActionRight: 'Inclinar p/ Direita',
  keybindActionAccelerate: 'Acelerar',
  keybindActionBrake: 'Frear / Desacelerar',
  keybindActionShoot: 'Disparar Metralhadora',
  keybindActionOverdrive: 'Ativar Sobrecarga (Overdrive)',
  keybindActionPause: 'Pausar Jogo',
  keybindListeningPrompt: 'PRESSIONE QUALQUER TECLA...',
  keybindBtnReset: 'RESTAURAR PADRÕES',
  keybindBtnDone: 'CONCLUÍDO',
  settingsLabelObjectiveProfile: 'Perfil de Objetivos',
  settingsProfileConservative: 'Conservador',
  settingsProfileAggressive: 'Agressivo',
  settingsLabelDifficulty: 'Dificuldade',
  difficultyEasy: 'Fácil',
  difficultyNormal: 'Normal',
  difficultyHard: 'Difícil',
  settingsLabelLanguage: 'Idioma',
  settingsLangEn: 'English',
  settingsLangPt: 'Português',
  settingsLabelAchievements: 'CONQUISTAS',
  settingsAchievementUnlocked: 'DESBLOQUEADO',
  settingsAchievementLocked: 'BLOQUEADO',
  settingsTooltipHowTo: 'COMO DESBLOQUEAR',
  settingsTooltipLore: 'SOBRE',
  achievementLore: {
    first_bridge:    'O rio é guardado por pontes — e você derrubou a primeira. Concreto e aço encontraram seu fim na sua mira.',
    combo_master:    'O caos tem um ritmo. Você encontrou. Quatro alvos abatidos em sequência perfeita, o rio ainda em chamas atrás de você.',
    fuel_saver:      'Disciplina sob fogo. Enquanto outros queimavam reservas, você manteve o tanque alto e a cabeça fria.',
    sharpshooter:    'Cinquenta abates confirmados. Os céus acima do rio aprenderam a temer sua aproximação.',
    survivor:        'Dez mil pontos conquistados em território hostil. A missão está longe do fim — mas você provou que pertence aqui.',
    power_collector: 'Dez melhorias arrancadas do campo de batalha. Você transformou os itens inimigos no seu próprio arsenal.',
    high_flyer:      'Cinquenta mil pontos. Um nome gravado na história do rio, escrito em fumaça e destroços.',
    untouchable:     'Uma run inteira. Nem um único acerto. O inimigo atirou — você já estava em outro lugar.',
  },
  settingsBtnBack: 'VOLTAR',
  settingsBtnPlay: 'JOGAR',

  // Game Modes
  modeSelectTitle: 'SELEÇÃO DE OPERAÇÃO',
  modeSelectSubtitle: '— ESCOLHA O MODO DE JOGO —',
  modeBtnPlay: 'INICIAR MISSÃO',
  modeBtnBack: 'VOLTAR',
  modeClassicName: 'Patrulha Clássica',
  modeClassicDesc: 'Regras originais de voo. 3 vidas, consumo dinâmico de combustível e radar completo.',
  modeDailyName: 'Desafio Diário',
  modeDailyDesc: 'Layout do rio gerado deterministicamente para o dia de hoje. Disputa pelo topo do placar diário.',
  modeBossRushName: 'Ataque de Chefes (Boss Rush)',
  modeBossRushDesc: 'Sequência veloz de confrontos com encouraçados a cada 35 segundos. Alto risco com drops generosos de combustível.',
  modeHardcoreName: 'Iron Man / Hardcore',
  modeHardcoreDesc: 'Apenas 1 vida. Drenagem de combustível +35% mais rápida e sem radar de auxílio. Somente para ases veteranos.',
  modeZenName: 'Voo Zen (Treino)',
  modeZenDesc: 'Prática de voo relaxante. Combustível infinito e sem Game Over. Ideal para treinar reflexos de desvio.',
  modeTag1Life: '1 Vida Única',
  modeTagFastFuel: '+35% Drenagem de Fuel',
  modeTagNoMinimap: 'Sem Radar',
  modeTagInfiniteLives: 'Vidas Infinitas',
  modeTagNoFuelDrain: 'Sem Drenagem de Fuel',
  modeTagRapidBosses: 'Chefes a cada 35s',
  modeTagDeterministic: 'Semente do Dia',
  menuBtnModes: 'MODOS',

  // Hangar & Skins
  hangarTitle: 'HANGAR DE AERONAVES',
  hangarSubtitle: '— PERSONALIZE SEU CAÇA —',
  hangarBtnEquip: 'EQUIPAR',
  hangarBtnEquipped: 'EQUIPADO',
  hangarBtnLocked: 'BLOQUEADO',
  hangarRequiredScore: 'Requer Pontuação:',
  hangarRequiredAchievement: 'Requer Conquista:',
  hangarBtnBack: 'VOLTAR',
  skinClassicName: 'Clássico 2600',
  skinClassicDesc: 'O lendário caça interceptor amarelo das origens do combate aéreo.',
  skinStealthName: 'Nighthawk F-117',
  skinStealthDesc: 'Fuselagem preta antirradar facetada com propulsores iônicos violeta.',
  skinBiplaneName: 'Biplano Vintage',
  skinBiplaneDesc: 'Caça histórico com asas duplas e hélice de madeira rotativa.',
  skinCyberNeonName: 'Cyber-Viper Neon',
  skinCyberNeonDesc: 'Aeronave futurista com asas invertidas e propulsão de plasma.',
  skinRequirementDefault: 'Disponível por padrão',
  skinRequirementSharpshooter: 'Desbloqueie a conquista "Atirador de Elite" (50 abates)',
  skinRequirementFirstBridge: 'Desbloqueie a conquista "Quebra-Pontes" (Destrua 1 ponte)',
  skinRequirementScore25k: 'Alcance um Recorde de 25.000 pontos',

  // Career Stats
  statsTitle: 'DIÁRIO DE BORDO DO PILOTO',
  statsSubtitle: '— ESTATÍSTICAS DE CARREIRA ACUMULADAS —',
  statsTotalFlightTime: 'Tempo Total de Voo',
  statsTotalScore: 'Pontuação Total Acumulada',
  statsTotalRuns: 'Missões Realizadas',
  statsTotalFuel: 'Depósitos Reabastecidos',
  statsAccuracy: 'Precisão Geral de Tiro',
  statsShotsFired: 'Total de Disparos',
  statsShotsHit: 'Tiros Certeiros',
  statsHighestCombo: 'Maior Combo Histórico',
  statsTotalKills: 'Total de Alvos Destruídos',
  statsHelicoptersKilled: 'Helicópteros',
  statsPlanesKilled: 'Caças Inimigos',
  statsBoatsKilled: 'Barcos',
  statsGunboatsKilled: 'Lanchas Armadas',
  statsTanksKilled: 'Tanques',
  statsBridgesKilled: 'Pontes Demolidas',
  statsBossesKilled: 'Encouraçados Dreadnought',
  statsBtnClose: 'FECHAR',
  statsBtnReset: 'ZERAR DIÁRIO',
  statsResetConfirm: 'Tem certeza que deseja zerar todas as estatísticas acumuladas de carreira?',

  gameoverTitle: 'FIM DE JOGO',
  gameoverLabelScore: 'PONTUAÇÃO FINAL',
  gameoverLabelBest: 'MELHOR',
  gameoverNewBest: 'NOVO RECORDE!',
  gameoverTop10: 'TOP 10',
  gameoverNoRecords: 'Nenhum registro ainda',
  gameoverTop10Label: 'TOP 10 - DIGITE SEU NOME',
  gameoverEnterName: 'TOP 10 - DIGITE SEU NOME',
  gameoverBtnSave: 'SALVAR',
  gameoverPressEnter: '> TOQUE OU PRESSIONE ENTER PARA TENTAR NOVAMENTE <',
  gameoverAchievementsHeader: 'CONQUISTAS DESBLOQUEADAS',

  hudPaused: 'PAUSADO',
  hudPauseHint: 'Pressione P ou ESC para continuar',
  hudDistance: 'DIST',
  hudPauseLabel: 'P  PAUSA',
  hudMuteLabel: 'M  MUDO',
  hudExtraLife: 'VIDA EXTRA!',
  hudBossName: 'DREADNOUGHT MK-I',
  hudBossPhase: 'FASE',
  hudOverdriveActive: 'OVERDRIVE',
  hudOverdriveReady: 'OVERDRIVE PRONTO! [X]',

  tutorialCardPowerups: 'POWER-UPS',
  powerupNames: {
    double_shot: 'Tiro Duplo',
    shield: 'Escudo',
    slow_motion: 'Câmera Lenta',
    rapid_fire: 'Tiro Rápido',
    magnet_fuel: 'Ímã de Combustível',
    bomb: 'Bomba',
  },
  powerupDescs: {
    double_shot: 'Dispara dois tiros de uma vez',
    shield: 'Absorve um dano',
    slow_motion: 'Desacelera o mundo por instantes',
    rapid_fire: 'Atire muito mais rápido',
    magnet_fuel: 'Atrai os tanques de combustível',
    bomb: 'Destrói todos os inimigos na tela',
  },
  achievementCatalog: {
    first_bridge:    { title: 'Quebra-Pontes', description: 'Destrua uma ponte' },
    combo_master:    { title: 'Mestre do Combo', description: 'Termine uma run com combo x4 ativo' },
    fuel_saver:      { title: 'Economista', description: 'Mantenha combustível acima de 75% por 60s' },
    sharpshooter:    { title: 'Atirador de Elite', description: 'Destrua 50 inimigos em uma run' },
    survivor:        { title: 'Sobrevivente', description: 'Alcance 10.000 pontos em uma run' },
    power_collector: { title: 'Colecionador', description: 'Colete 10 power-ups em uma run' },
    high_flyer:      { title: 'Ás dos Céus', description: 'Alcance 50.000 pontos em uma run' },
    untouchable:     { title: 'Intocável', description: 'Complete uma run sem perder nenhuma vida' },
  },
}

const translations: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function getStrings(lang: Language): Strings {
  return translations[lang] ?? translations['en']
}
