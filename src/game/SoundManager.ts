// ---------------------------------------------------------------------------
// Trilhas ambiente "MIDI-style" — compostas e tocadas pelo motor de osciladores.
// Cada bioma do mapa tem a sua própria música, trocada em tempo real conforme o
// rio avança (ver `setBiomeMusic`).  Composição fundamentada em referências de
// shmups clássicos (Aleste/MUSHA, Gradius, Twin Cobra): 4/4 allegro, menor com
// alívios de maior, baixo dobrado, loop sem emendas e tempo casado à rolagem.
//   • forest     — tema heroico de aventura, Ré menor/dórico, 160 BPM
//   • desert     — miragem exótica, cadência andaluza + cor frígia-dom., 150 BPM
//   • industrial — céu de ferro, Mi frígio sombrio, four-on-the-floor, 167 BPM
//   • menu        — synthwave neon, Lá menor sonhador, 100 BPM
// Apenas o som de fundo usa estes dados; os demais SFX permanecem como antes.
// ---------------------------------------------------------------------------

const NOTE: Record<string, number> = {
  G1: 49.0, A1: 55.0, Bb1: 58.27, B1: 61.74,
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61, Gb3: 185.0, G3: 196.0, Ab3: 207.65, A3: 220.0, Bb3: 233.08, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, Gb4: 369.99, G4: 392.0, Ab4: 415.3, A4: 440.0, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Gb5: 739.99, G5: 783.99, A5: 880.0,
}

interface NoteEvent {
  freq: number
  steps: number
}

interface CompiledSong {
  lead: Map<number, NoteEvent>
  bass: Map<number, NoteEvent>
  pad: Map<number, number[]>
}

// Uma trilha = melodia ('.' sustenta, '-' pausa), raízes de baixo e acordes de
// pad por compasso (16 semicolcheias cada), timbre, estilo de bateria e, opcio-
// nalmente, o padrão rítmico do baixo (índices de semicolcheia onde ele pulsa).
interface MusicTrack {
  stepMs: number
  leadType: OscillatorType
  drums: 'full' | 'soft' | 'none' | 'four'
  lead: string[]
  bassRoots: string[]
  padChords: string[][]
  /** Semicolcheias do compasso em que o baixo ataca. Padrão: semínimas. */
  bassPattern?: number[]
}

const DRIVING_BASS = [0, 2, 4, 6, 8, 10, 12, 14]   // colcheias incessantes

// --- FOREST · tema heroico de aventura (Ré menor/dórico, 160 BPM) -------------
// i–VI–III–VII com elevação dórica (Sol maior) e dominante de menor harmônica.
// Progressão: Dm | Bb | F | C | Dm | G | A | A
const FOREST_TRACK: MusicTrack = {
  stepMs: 94,
  leadType: 'square',
  drums: 'full',
  bassPattern: DRIVING_BASS,
  lead: [
    // 1 · Dm — chamado heroico
    'A4', '.', '.', '.', 'D5', '.', '.', '.', 'F5', '.', 'E5', '.', 'D5', '.', '.', '.',
    // 2 · Bb — resposta descendente, deixa espaço pro baixo responder
    '-', '.', 'F5', '.', 'D5', '.', 'Bb4', '.', 'D5', '.', '.', '.', '.', '.', '.', '.',
    // 3 · F — abertura luminosa
    'C5', '.', '.', '.', 'A4', '.', '.', '.', 'F4', '.', 'A4', '.', 'C5', '.', '.', '.',
    // 4 · C — clímax com arpejo de fechamento (C–E–G)
    'E5', '.', 'D5', '.', 'C5', '.', '.', '.', 'G4', '.', 'C5', '.', 'E5', '.', 'G5', '.',
    // 5 · Dm — retomada do tema
    'A4', '.', '.', '.', 'D5', '.', '.', '.', 'F5', '.', 'E5', '.', 'D5', '.', '.', '.',
    // 6 · G — elevação dórica heroica (Si natural)
    'B4', '.', '.', '.', 'G4', '.', '.', '.', 'D5', '.', '.', '.', 'B4', '.', '.', '.',
    // 7 · A — voo épico, pico em A5 (dominante maior, C#)
    'Db5', '.', '.', '.', 'E5', '.', '.', '.', 'A5', '.', 'G5', '.', 'E5', '.', 'Db5', '.',
    // 8 · A — resolução suspensa que prepara o loop
    'D5', '.', '.', '.', 'Db5', '.', '.', '.', 'A4', '.', '.', '.', 'E4', '.', 'A4', '.',
  ],
  bassRoots: ['D2', 'Bb1', 'F2', 'C2', 'D2', 'G2', 'A1', 'A1'],
  padChords: [
    ['D3', 'F3', 'A3'],   // Dm
    ['D3', 'F3', 'Bb3'],  // Bb — só uma voz se move (condução suave)
    ['F3', 'A3', 'C4'],   // F
    ['E3', 'G3', 'C4'],   // C
    ['D3', 'F3', 'A3'],   // Dm
    ['D3', 'G3', 'B3'],   // G (IV maior dórico)
    ['A3', 'Db4', 'E4'],  // A
    ['A3', 'Db4', 'E4'],  // A
  ],
}

// --- DESERT · miragem exótica (cadência andaluza, cor frígia-dominante, 150 BPM)
// Dm | C | Bb | A com a 2ª-aumentada exótica (Bb→Db) sobre a dominante maior.
// Timbre serrote = palheta nasal "encantador de serpentes". Baixo em semínimas
// para um balanço mais aberto, contrastando com os outros biomas.
const DESERT_TRACK: MusicTrack = {
  stepMs: 100,
  leadType: 'sawtooth',
  drums: 'full',
  lead: [
    // 1 · Dm — abre com meio-tom frígio (Bb→A)
    'D5', '.', '.', '.', 'A4', '.', 'Bb4', '.', 'A4', '.', '.', '.', 'F4', '.', '.', '.',
    // 2 · C — respira
    'E5', '.', '.', '.', 'C5', '.', '.', '.', 'G4', '.', '.', '.', 'E4', '.', '.', '.',
    // 3 · Bb — descida do tema
    'D5', '.', '.', '.', 'Bb4', '.', '.', '.', 'F4', '.', 'A4', '.', 'Bb4', '.', '.', '.',
    // 4 · A — floreio exótico (2ª aumentada Bb–Db) e descida frígia
    'A4', '.', 'Bb4', '.', 'Db5', '.', '.', '.', 'A4', '.', 'G4', '.', 'F4', '.', 'E4', '.',
    // 5 · Dm — frase voadora
    'D5', '.', 'F5', '.', 'E5', '.', 'D5', '.', 'A4', '.', '.', '.', 'D5', '.', '.', '.',
    // 6 · C — luz crescente, pico em G5
    'G5', '.', '.', '.', 'E5', '.', '.', '.', 'C5', '.', 'D5', '.', 'E5', '.', '.', '.',
    // 7 · Bb — eco do tema
    'F5', '.', '.', '.', 'D5', '.', '.', '.', 'Bb4', '.', 'D5', '.', 'F5', '.', '.', '.',
    // 8 · A — virada exótica que pede o recomeço
    'Db5', '.', '.', '.', 'A4', '.', 'Bb4', '.', 'A4', '.', 'G4', '.', '-', '.', '-', '.',
  ],
  bassRoots: ['D2', 'C2', 'Bb1', 'A1', 'D2', 'C2', 'Bb1', 'A1'],
  padChords: [
    ['D3', 'F3', 'A3'],   // Dm
    ['E3', 'G3', 'C4'],   // C
    ['D3', 'F3', 'Bb3'],  // Bb
    ['A3', 'Db4', 'E4'],  // A (frígia-dominante)
    ['D3', 'F3', 'A3'],   // Dm
    ['E3', 'G3', 'C4'],   // C
    ['D3', 'F3', 'Bb3'],  // Bb
    ['A3', 'Db4', 'E4'],  // A
  ],
}

// --- INDUSTRIAL · céu de ferro (Mi frígio, four-on-the-floor, 167 BPM) --------
// Cadência andaluza em Mi menor (Em | D | C | B) com dominante de menor harmônica
// (B maior, Ré#) e elevação de power-chords. Serrote agressivo, baixo incessante
// e bumbo em todas as semínimas: o bioma mais sombrio e mecânico.
const INDUSTRIAL_TRACK: MusicTrack = {
  stepMs: 90,
  leadType: 'sawtooth',
  drums: 'four',
  bassPattern: DRIVING_BASS,
  lead: [
    // 1 · Em — motivo sincopado (3+3+2)
    'E4', '.', '.', 'E5', '.', '.', 'B4', '.', 'E4', '.', '.', 'G4', '.', '.', 'E4', '.',
    // 2 · D — resposta
    'Gb4', '.', 'A4', '.', 'D5', '.', '.', '.', 'A4', '.', 'Gb4', '.', 'D4', '.', '.', '.',
    // 3 · C — tensão
    'G4', '.', '.', '.', 'E4', '.', '.', '.', 'C5', '.', 'B4', '.', 'G4', '.', '.', '.',
    // 4 · B — dominante harmônica (Ré# = sensível)
    'Eb5', '.', '.', '.', 'B4', '.', '.', '.', 'Gb4', '.', '.', '.', 'B4', '.', 'Eb5', '.',
    // 5 · Em — retomada uma oitava acima
    'E5', '.', '.', '.', 'B4', '.', '.', '.', 'E5', '.', '.', '.', 'G5', '.', 'E5', '.',
    // 6 · C — descida
    'C5', '.', '.', '.', 'G4', '.', '.', '.', 'E5', '.', 'D5', '.', 'C5', '.', '.', '.',
    // 7 · D — escalada ao pico (A5)
    'D5', '.', '.', '.', 'A4', '.', '.', '.', 'D5', '.', 'E5', '.', 'Gb5', '.', 'A5', '.',
    // 8 · B — virada que despenca de volta ao Em
    'B4', '.', '.', '.', 'Eb5', '.', '.', '.', 'Gb5', '.', '.', '.', 'B4', '.', '-', '.',
  ],
  bassRoots: ['E2', 'D2', 'C2', 'B2', 'E2', 'C2', 'D2', 'B2'],
  padChords: [
    ['E3', 'G3', 'B3'],    // Em
    ['Gb3', 'A3', 'D4'],   // D
    ['E3', 'G3', 'C4'],    // C
    ['B3', 'Eb4', 'Gb4'],  // B (dominante maior)
    ['E3', 'G3', 'B3'],    // Em
    ['E3', 'G3', 'C4'],    // C
    ['Gb3', 'A3', 'D4'],   // D
    ['B3', 'Eb4', 'Gb4'],  // B
  ],
}

// --- SNOW · neve cristalina (Lá menor com brilho de maior, ~140 BPM) ----------
// Etéreo e contemplativo: lead triangle vítreo, bateria suave, baixo placado em
// semínimas. Frases longas e sustentadas com "quedas de neve" descendentes —
// o oposto da agressão industrial. Am | F | C | G | F | C | Dm | E.
const SNOW_TRACK: MusicTrack = {
  stepMs: 107,
  leadType: 'triangle',
  drums: 'soft',
  lead: [
    // 1 · Am — abertura serena que sobe e descansa
    'A4', '.', '.', '.', 'C5', '.', '.', '.', 'E5', '.', '.', '.', 'D5', '.', 'C5', '.',
    // 2 · F — respira
    'C5', '.', '.', '.', 'A4', '.', '.', '.', 'F4', '.', 'A4', '.', 'C5', '.', '.', '.',
    // 3 · C — brilho cristalino no agudo
    'E5', '.', '.', '.', 'G5', '.', '.', '.', 'E5', '.', 'D5', '.', 'C5', '.', '.', '.',
    // 4 · G — frase suspensa
    'D5', '.', '.', '.', 'B4', '.', '.', '.', 'G4', '.', 'B4', '.', 'D5', '.', '.', '.',
    // 5 · F — queda de neve (descida)
    'F5', '.', '.', '.', 'E5', '.', '.', '.', 'C5', '.', '.', '.', 'A4', '.', '.', '.',
    // 6 · C — recolhe e reluz
    'E5', '.', '.', '.', 'C5', '.', '.', '.', 'G4', '.', 'C5', '.', 'E5', '.', '.', '.',
    // 7 · Dm — pequeno floreio
    'F5', '.', 'E5', '.', 'D5', '.', '.', '.', 'A4', '.', '.', '.', 'D5', '.', '.', '.',
    // 8 · E — sensível (G#) suspensa que pede o recomeço
    'Ab4', '.', '.', '.', 'B4', '.', '.', '.', 'E5', '.', '.', '.', '-', '.', '-', '.',
  ],
  bassRoots: ['A2', 'F2', 'C2', 'G2', 'F2', 'C2', 'D2', 'E2'],
  padChords: [
    ['A3', 'C4', 'E4'],   // Am
    ['F3', 'A3', 'C4'],   // F
    ['E3', 'G3', 'C4'],   // C
    ['G3', 'B3', 'D4'],   // G
    ['F3', 'A3', 'C4'],   // F
    ['E3', 'G3', 'C4'],   // C
    ['D3', 'F3', 'A3'],   // Dm
    ['E3', 'Ab3', 'B3'],  // E (maior, brilho)
  ],
}

// Mapa bioma → trilha. As chaves casam com BiomeId do BiomeSystem.
const BIOME_TRACKS: Record<string, MusicTrack> = {
  forest: FOREST_TRACK,
  desert: DESERT_TRACK,
  industrial: INDUSTRIAL_TRACK,
  snow: SNOW_TRACK,
}

// "Modo noturno": a mesma trilha do bioma é modulada conforme a fase do dia
// (Atmosphere: 0=dia, 1=pôr do sol, 2=noite, 3=amanhecer). Em vez de compor uma
// música por fase, ajustamos volume, bateria e timbre — a noite fica calma e
// atmosférica, o dia mantém a energia plena.
interface PhaseMood {
  /** Multiplica a amplitude de cada voz (não mexe no volume do usuário). */
  gain: number
  /** Bateria efetiva: 'inherit' usa a da trilha; senão sobrepõe. */
  drums: 'inherit' | 'soft' | 'none'
  /** Suaviza o lead para triangle (mais doce, menos agressivo). */
  softLead: boolean
}

const PHASE_MOODS: PhaseMood[] = [
  { gain: 1.0,  drums: 'inherit', softLead: false }, // 0 · Dia — energia plena
  { gain: 0.9,  drums: 'inherit', softLead: false }, // 1 · Pôr do sol — quente, um pouco mais suave
  { gain: 0.66, drums: 'soft',    softLead: true  }, // 2 · Noite — calma, atmosférica
  { gain: 0.82, drums: 'soft',    softLead: false }, // 3 · Amanhecer — despertar gradual
]

// --- Trilha do menu: synthwave neon, sonhador e nostálgico (100 BPM) ---------
// Tom Lá menor, progressão "épica" Am | F | C | G (vi-IV-I-V), com virada
// Am | F | G | E para um suspiro de expectativa antes do loop. Timbre suave
// (triangle), sem kick/snare — só um chimbal arejado segurando o pulso.
const MENU_TRACK: MusicTrack = {
  stepMs: 150,
  leadType: 'triangle',
  drums: 'soft',
  lead: [
    // 1 · Am — abertura serena
    'E4', '.', '.', '.', 'A4', '.', '.', '.', 'C5', '.', 'B4', '.', 'A4', '.', '.', '.',
    // 2 · F — respira
    '-', '.', 'C5', '.', 'A4', '.', 'F4', '.', 'A4', '.', '.', '.', '.', '.', '.', '.',
    // 3 · C — luz crescente
    'G4', '.', '.', '.', 'C5', '.', '.', '.', 'E5', '.', 'D5', '.', 'C5', '.', '.', '.',
    // 4 · G — frase suspensa
    'D5', '.', 'B4', '.', 'G4', '.', '.', '.', '-', '.', '.', '.', '.', '.', '.', '.',
    // 5 · Am — retomada do tema
    'E4', '.', '.', '.', 'A4', '.', '.', '.', 'C5', '.', 'B4', '.', 'A4', '.', '.', '.',
    // 6 · F — voo emotivo
    'F5', '.', '.', '.', 'E5', '.', '.', '.', 'C5', '.', 'A4', '.', 'F4', '.', '.', '.',
    // 7 · G — antecipação
    'G4', '.', '.', '.', 'B4', '.', '.', '.', 'D5', '.', '.', '.', 'G4', '.', '.', '.',
    // 8 · E — tensão doce (dominante maior, G#) que pede o recomeço
    'Ab4', '.', '.', '.', 'B4', '.', '.', '.', 'E5', '.', '.', '.', '-', '.', '-', '.',
  ],
  bassRoots: ['A1', 'F2', 'C2', 'G2', 'A1', 'F2', 'G2', 'E2'],
  padChords: [
    ['A3', 'C4', 'E4'],   // Am
    ['F3', 'A3', 'C4'],   // F
    ['C3', 'E3', 'G3'],   // C
    ['G3', 'B3', 'D4'],   // G
    ['A3', 'C4', 'E4'],   // Am
    ['F3', 'A3', 'C4'],   // F
    ['G3', 'B3', 'D4'],   // G
    ['E3', 'Ab3', 'B3'],  // E
  ],
}

export class SoundManager {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private muted = false
  private volume = 0.3
  private musicTimer: number | null = null
  private musicStep = 0
  private active: { track: MusicTrack; compiled: CompiledSong; totalSteps: number } | null = null
  private currentBiome = 'forest'
  private musicPhase = 0
  private crossfadeTimer: number | null = null

  private static readonly STEPS_PER_BAR = 16


  init(): void {
    if (this.ctx) return
    this.ctx = new AudioContext()
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = this.muted ? 0 : this.volume
    this.masterGain.connect(this.ctx.destination)
  }

  resume(): void {
    if (!this.ctx) return
    const state = this.ctx.state
    if (state === 'suspended' || state === 'interrupted') {
      void this.ctx.resume().catch(() => {
        if (this.ctx?.state === 'closed') this.init()
      })
    } else if (state === 'closed') {
      this.init()
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.volume
    }
    return this.muted
  }

  isMuted(): boolean {
    return this.muted
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.masterGain && !this.muted) {
      this.masterGain.gain.value = this.volume
    }
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) this.init()
    this.resume()
    return this.ctx
  }

  // Trilha de jogo — uma por bioma. Sem argumento, retoma o bioma atual
  // (usado ao despausar); com argumento, fixa o bioma antes de tocar.
  startMusic(biome?: string): void {
    if (biome) this.currentBiome = biome
    this.playTrack(BIOME_TRACKS[this.currentBiome] ?? FOREST_TRACK)
  }

  // Troca a trilha quando o rio entra em um novo bioma. Não faz nada se o bioma
  // não mudou; se a música estiver parada (pausa/menu), apenas memoriza o bioma
  // para o próximo startMusic.
  setBiomeMusic(biome: string): void {
    if (biome === this.currentBiome) return
    this.currentBiome = biome
    if (this.musicTimer === null) return
    this.crossfadeToBiome(biome)
  }

  private crossfadeToBiome(newBiome: string): void {
    const ctx = this.ctx
    if (!ctx || !this.masterGain) {
      this.stopMusic()
      this.playTrack(BIOME_TRACKS[newBiome] ?? FOREST_TRACK)
      return
    }
    const now = ctx.currentTime
    const fadeDur = 0.3
    const currentVol = this.masterGain.gain.value
    this.masterGain.gain.cancelScheduledValues(now)
    this.masterGain.gain.setValueAtTime(currentVol, now)
    this.masterGain.gain.exponentialRampToValueAtTime(0.001, now + fadeDur)
    this.crossfadeTimer = window.setTimeout(() => {
      this.crossfadeTimer = null
      this.stopMusic()
      this.playTrack(BIOME_TRACKS[newBiome] ?? FOREST_TRACK)
      if (this.masterGain) {
        const target = this.muted ? 0 : this.volume
        this.masterGain.gain.cancelScheduledValues(ctx.currentTime)
        this.masterGain.gain.setValueAtTime(0.001, ctx.currentTime)
        this.masterGain.gain.exponentialRampToValueAtTime(target, ctx.currentTime + fadeDur)
      }
    }, fadeDur * 1000 + 50)
  }

  // Define a fase do dia (0=dia, 1=pôr do sol, 2=noite, 3=amanhecer) que modula
  // a trilha em reprodução. Lida ao vivo no sequenciador — sem reiniciar a música.
  setMusicPhase(phase: number): void {
    if (phase >= 0 && phase < PHASE_MOODS.length) {
      this.musicPhase = phase
    }
  }

  // Trilha de menu — synthwave neon, sonhador.
  startMenuMusic(): void {
    this.playTrack(MENU_TRACK)
  }

  private playTrack(track: MusicTrack): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain || this.musicTimer !== null) return
    this.active = {
      track,
      compiled: SoundManager.compileSong(track),
      totalSteps: track.lead.length,
    }
    this.musicStep = 0
    this.playMusicStep()
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer)
      this.musicTimer = null
    }
    this.active = null
  }

  // Converte os tokens de uma trilha em eventos prontos para o sequenciador.
  private static compileSong(track: MusicTrack): CompiledSong {
    const { lead: tokens } = track
    const lead = new Map<number, NoteEvent>()
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i]
      if (tok === '.' || tok === '-') continue
      const freq = NOTE[tok]
      if (freq === undefined) continue
      let steps = 1
      while (tokens[i + steps] === '.') steps++
      lead.set(i, { freq, steps })
    }

    const bass = new Map<number, NoteEvent>()
    const pad = new Map<number, number[]>()
    const bars = tokens.length / SoundManager.STEPS_PER_BAR
    // Padrão do baixo (semicolcheias). Padrão: semínimas; trilhas de ação usam
    // colcheias incessantes para mais energia.
    const pattern = track.bassPattern ?? [0, 4, 8, 12]
    for (let b = 0; b < bars; b++) {
      const base = b * SoundManager.STEPS_PER_BAR
      const root = NOTE[track.bassRoots[b]]
      for (let p = 0; p < pattern.length; p++) {
        // Cada nota dura até a próxima batida (legato), no máximo 3 semicolcheias.
        const next = p + 1 < pattern.length
          ? pattern[p + 1]
          : SoundManager.STEPS_PER_BAR + pattern[0]
        const len = Math.min(next - pattern[p], 3)
        bass.set(base + pattern[p], { freq: root, steps: len })
      }
      // Pad sustentado pelo compasso inteiro.
      pad.set(base, track.padChords[b].map((n) => NOTE[n]))
    }

    return { lead, bass, pad }
  }

  startEngine(): void {
    // Engine sound removed as per user request
  }

  stopEngine(): void {
    // Engine sound removed
  }

  updateEngine(): void {
  }

  private playMusicStep(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain || !this.active) return

    const { track, compiled, totalSteps } = this.active
    const start = ctx.currentTime + 0.02
    const stepSec = track.stepMs / 1000
    const step = this.musicStep % totalSteps

    // Modulação pela fase do dia (modo noturno).
    const mood = PHASE_MOODS[this.musicPhase] ?? PHASE_MOODS[0]
    const g = mood.gain
    const leadType = mood.softLead ? 'triangle' : track.leadType
    const drums = mood.drums === 'inherit' ? track.drums : mood.drums

    // Pad emocional — acordes sustentados que dão profundidade à cena.
    const chord = compiled.pad.get(step)
    if (chord) {
      const barSec = SoundManager.STEPS_PER_BAR * stepSec
      for (const freq of chord) {
        this.playVoice(freq, start, barSec * 0.96, 'triangle', 0.014 * g, barSec * 0.25)
      }
    }

    // Baixo pulsante — motor da trilha.
    const bassEv = compiled.bass.get(step)
    if (bassEv) {
      this.playVoice(bassEv.freq, start, bassEv.steps * stepSec, 'triangle', 0.06 * g, 0.04)
    }

    // Melodia — timbre da trilha com camada grave (triangle) para calor/emoção.
    const leadEv = compiled.lead.get(step)
    if (leadEv) {
      const dur = leadEv.steps * stepSec
      this.playVoice(leadEv.freq, start, dur, leadType, 0.05 * g, Math.min(0.12, dur * 0.4))
      this.playVoice(leadEv.freq / 2, start, dur, 'triangle', 0.022 * g, Math.min(0.12, dur * 0.4))
    }

    // Bateria — estilo da trilha, possivelmente enxugado à noite/amanhecer.
    const beat = step % SoundManager.STEPS_PER_BAR
    if (drums === 'full') {
      if (beat === 0 || beat === 8) this.drumKick(start)
      if (beat === 4 || beat === 12) this.drumSnare(start)
      if (beat % 2 === 0) this.drumHat(start)
    } else if (drums === 'four') {
      // Four-on-the-floor: bumbo em toda semínima + chimbal nas contratempos.
      if (beat % 4 === 0) this.drumKick(start)
      if (beat === 4 || beat === 12) this.drumSnare(start)
      if (beat === 2 || beat === 6 || beat === 10 || beat === 14) this.drumHat(start)
    } else if (drums === 'soft') {
      if (beat === 0) this.drumKick(start)
      if (beat === 4 || beat === 12) this.drumHat(start)
    }

    this.musicStep += 1
    this.musicTimer = window.setTimeout(() => {
      this.playMusicStep()
    }, track.stepMs)
  }

  // Voz genérica com envelope ataque/sustentação/decaimento (ADSR simplificado).
  private playVoice(
    freq: number,
    start: number,
    dur: number,
    type: OscillatorType,
    peak: number,
    release: number,
  ): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    const attack = Math.min(0.03, dur * 0.3)
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(peak, start + attack)
    gain.gain.setValueAtTime(peak, start + Math.max(attack, dur - release))
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(start)
    osc.stop(start + dur + 0.02)
  }

  private drumKick(start: number): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, start)
    osc.frequency.exponentialRampToValueAtTime(45, start + 0.12)
    gain.gain.setValueAtTime(0.22, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(start)
    osc.stop(start + 0.18)
  }

  private drumSnare(start: number): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const dur = 0.14
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(1200, start)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.11, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start(start)
    noise.stop(start + dur)
  }

  private drumHat(start: number): void {
    if (!this.ctx || !this.masterGain) return
    const ctx = this.ctx
    const dur = 0.03
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(7000, start)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.04, start)
    gain.gain.exponentialRampToValueAtTime(0.001, start + dur)
    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start(start)
    noise.stop(start + dur)
  }

  shoot(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.08)
  }

  explosion(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const bufferSize = ctx.sampleRate * 0.4
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize)
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.4)

    const osc = ctx.createOscillator()
    const oscGain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.3)
    oscGain.gain.setValueAtTime(0.3, ctx.currentTime)
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    osc.connect(oscGain)
    oscGain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.3)
  }

  fuelCollect(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.06)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.2)
  }

  lowFuelBeep(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(880, ctx.currentTime) // High pitch
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)

    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.1)
  }

  enemyHit(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(this.masterGain)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  powerUpBomb(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Noise burst curto
    const bufferSize = ctx.sampleRate * 0.08
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.3, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)
    noise.connect(noiseGain)
    noiseGain.connect(master)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.08)

    // Pitch descendente
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(600, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  }

  bombShockwave(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Low-freq rumble descendente
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(120, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5)
    gain.gain.setValueAtTime(0.35, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)

    // Noise layer para textura
    const bufferSize = ctx.sampleRate * 0.3
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const noise = ctx.createBufferSource()
    noise.buffer = buffer
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 200
    const noiseGain = ctx.createGain()
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    noise.connect(filter)
    filter.connect(noiseGain)
    noiseGain.connect(master)
    noise.start(ctx.currentTime)
    noise.stop(ctx.currentTime + 0.3)
  }

  powerUpRapidFire(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Chirp ascendente agudo
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(master)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.12)
  }

  powerUpMagnet(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    const master = this.masterGain

    // Pulso suave ascendente
    const notes = [330, 495, 660]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      const start = ctx.currentTime + i * 0.07
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.12, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.1)
    })
  }

  gameOver(): void {
    const ctx = this.ensureCtx()
    if (!ctx || !this.masterGain) return

    this.stopMusic()
    this.stopEngine()

    const master = this.masterGain
    const notes = [440, 370, 311, 261]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      const start = ctx.currentTime + i * 0.2
      osc.frequency.setValueAtTime(freq, start)
      gain.gain.setValueAtTime(0.15, start)
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18)
      osc.connect(gain)
      gain.connect(master)
      osc.start(start)
      osc.stop(start + 0.18)
    })
  }

  destroy(): void {
    this.stopMusic()
    if (this.crossfadeTimer !== null) {
      window.clearTimeout(this.crossfadeTimer)
      this.crossfadeTimer = null
    }
    this.stopEngine()
    if (this.ctx) {
      void this.ctx.close()
      this.ctx = null
      this.masterGain = null
    }
  }
}
