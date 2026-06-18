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
  menuPressEnter: string
  menuMute: string
  menuUnmute: string

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
  settingsLabelMute: string
  settingsLabelReducedMotion: string
  settingsLabelColorblind: string
  settingsLabelGamepad: string
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
  achievementLore: Record<string, string>
  settingsBtnBack: string
  settingsBtnPlay: string

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

  // Power-ups (tutorial + pickup toast)
  tutorialCardPowerups: string
  powerupNames: Record<string, string>
  powerupDescs: Record<string, string>

  // Localized achievement catalog (title + how-to), keyed by AchievementId
  achievementCatalog: Record<string, { title: string; description: string }>
}

const en: Strings = {
  menuSubtitle: '— CLASSIC ARCADE —',
  menuTagline: 'FLY. SHOOT. SURVIVE.',
  menuLabelMove: 'MOVE',
  menuLabelFire: 'FIRE',
  menuBtnStart: 'START',
  menuBtnTutorial: 'TUTORIAL',
  menuBtnSettings: 'SETTINGS',
  menuPressEnter: '▸ TAP OR PRESS ENTER TO START ◂',
  menuMute: 'MUTE SOUND',
  menuUnmute: 'UNMUTE SOUND',

  tutorialSubtitle: '— MISSION BRIEFING —',
  tutorialTitle: 'HOW TO PLAY',
  tutorialObjective: 'Fly down the river. Destroy enemies and bridges. Keep your fuel above 0%.',
  tutorialCardNavigate: 'NAVIGATE',
  tutorialCardCombat: 'COMBAT',
  tutorialCardSurvive: 'SURVIVE',
  tutorialNavigate1: 'Arrows / WASD — all directions',
  tutorialNavigate2: 'Drag anywhere on mobile',
  tutorialNavigate3: 'Left stick (gamepad)',
  tutorialCombat1: 'SPACE to shoot',
  tutorialCombat2: 'A button (gamepad)',
  tutorialCombat3: 'Destroy enemies & bridges',
  tutorialSurvive1: 'Collect fuel depots',
  tutorialSurvive2: 'Stay inside the river',
  tutorialSurvive3: 'P to pause · M to mute',
  tutorialBtnStart: 'START MISSION',
  tutorialBtnBack: 'BACK',

  settingsTitle: 'SETTINGS',
  settingsSubtitle: '— CONFIGURATION —',
  settingsLabelVolume: 'Master Volume',
  settingsLabelMute: 'Mute by default',
  settingsLabelReducedMotion: 'Reduced motion',
  settingsLabelColorblind: 'Colorblind cues',
  settingsLabelGamepad: 'Enable gamepad',
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
  menuPressEnter: '▸ TOQUE OU PRESSIONE ENTER PARA INICIAR ◂',
  menuMute: 'SILENCIAR SOM',
  menuUnmute: 'ATIVAR SOM',

  tutorialSubtitle: '— INSTRUÇÕES —',
  tutorialTitle: 'COMO JOGAR',
  tutorialObjective: 'Voe pelo rio. Destrua inimigos e pontes. Mantenha o combustível acima de 0%.',
  tutorialCardNavigate: 'NAVEGAR',
  tutorialCardCombat: 'COMBATE',
  tutorialCardSurvive: 'SOBREVIVER',
  tutorialNavigate1: 'Setas / WASD — todas as direções',
  tutorialNavigate2: 'Arraste em qualquer lugar no mobile',
  tutorialNavigate3: 'Analógico esquerdo (gamepad)',
  tutorialCombat1: 'ESPAÇO para atirar',
  tutorialCombat2: 'Botão A (gamepad)',
  tutorialCombat3: 'Destrua inimigos e pontes',
  tutorialSurvive1: 'Colete depósitos de combustível',
  tutorialSurvive2: 'Fique dentro do rio',
  tutorialSurvive3: 'P para pausar · M para mutar',
  tutorialBtnStart: 'INICIAR MISSÃO',
  tutorialBtnBack: 'VOLTAR',

  settingsTitle: 'OPÇÕES',
  settingsSubtitle: '— CONFIGURAÇÕES —',
  settingsLabelVolume: 'Volume Principal',
  settingsLabelMute: 'Mudo por padrão',
  settingsLabelReducedMotion: 'Movimento reduzido',
  settingsLabelColorblind: 'Indicadores p/ daltonismo',
  settingsLabelGamepad: 'Ativar gamepad',
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
