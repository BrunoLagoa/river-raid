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
  settingsLabelGamepad: string
  settingsLabelObjectiveProfile: string
  settingsProfileConservative: string
  settingsProfileAggressive: string
  settingsLabelLanguage: string
  settingsLangEn: string
  settingsLangPt: string
  settingsLabelAchievements: string
  settingsAchievementUnlocked: string
  settingsAchievementLocked: string
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

  tutorialSubtitle: '— MISSION BRIEFING —',
  tutorialTitle: 'HOW TO PLAY',
  tutorialObjective: 'Fly down the river. Destroy enemies and bridges. Keep your fuel above 0%.',
  tutorialCardNavigate: 'NAVIGATE',
  tutorialCardCombat: 'COMBAT',
  tutorialCardSurvive: 'SURVIVE',
  tutorialNavigate1: 'Arrow keys or A / D',
  tutorialNavigate2: 'Touch controls on mobile',
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
  settingsLabelGamepad: 'Enable gamepad',
  settingsLabelObjectiveProfile: 'Objective Profile',
  settingsProfileConservative: 'Conservative',
  settingsProfileAggressive: 'Aggressive',
  settingsLabelLanguage: 'Language',
  settingsLangEn: 'English',
  settingsLangPt: 'Português',
  settingsLabelAchievements: 'ACHIEVEMENTS',
  settingsAchievementUnlocked: 'UNLOCKED',
  settingsAchievementLocked: 'LOCKED',
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

  tutorialSubtitle: '— INSTRUÇÕES —',
  tutorialTitle: 'COMO JOGAR',
  tutorialObjective: 'Voe pelo rio. Destrua inimigos e pontes. Mantenha o combustível acima de 0%.',
  tutorialCardNavigate: 'NAVEGAR',
  tutorialCardCombat: 'COMBATE',
  tutorialCardSurvive: 'SOBREVIVER',
  tutorialNavigate1: 'Setas ou A / D',
  tutorialNavigate2: 'Controles de toque no mobile',
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
  settingsLabelGamepad: 'Ativar gamepad',
  settingsLabelObjectiveProfile: 'Perfil de Objetivos',
  settingsProfileConservative: 'Conservador',
  settingsProfileAggressive: 'Agressivo',
  settingsLabelLanguage: 'Idioma',
  settingsLangEn: 'English',
  settingsLangPt: 'Português',
  settingsLabelAchievements: 'CONQUISTAS',
  settingsAchievementUnlocked: 'DESBLOQUEADO',
  settingsAchievementLocked: 'BLOQUEADO',
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
}

const translations: Record<Language, Strings> = { en, 'pt-BR': ptBR }

export function getStrings(lang: Language): Strings {
  return translations[lang] ?? translations['en']
}
