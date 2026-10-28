# Sprint 09: Cinemática de Abertura

## 🎯 Objetivo da Sprint
Abrir a **Patrulha Clássica** com uma introdução cinematográfica que roda **dentro da própria engine** — mesmo canvas, mesmo rio e os mesmos sistemas do gameplay — apresentando o universo e o conflito e terminando com o jogador assumindo o controle **sem troca de cena**.

Fluxo: **menu → INICIAR → cinemática → faixas de cinema viram o HUD → jogador pilota.**

A cena dispara no INICIAR (e não ao abrir o app) por um motivo técnico: sem gesto do usuário o navegador não libera o áudio, e a cinemática depende da trilha, do rádio e da voz.

---

## 🎬 Roteiro (~37 s + 2 s de transição, pulável)

| Tempo | Ato | O que acontece | Sistemas reaproveitados |
|---|---|---|---|
| 0–2,4 s | **Abertura** | O monitor "liga" como um CRT (filete de fósforo que se abre em imagem). Letterbox, carimbo `SETOR 07 · DELTA DO RIO · 04:52`. Noite de chuva, câmera fechada no rio, recuando. | `World`, `Scenery`, `Atmosphere` (ciclo dia/noite), `WeatherSystem`, `LightingSystem` |
| 2,4–15,5 s | **Ambientação** | O QG narra pelo rádio, em máquina de escrever. Patrulhas são travadas pela mira (**HOSTIL**, **PONTE DE SUPRIMENTOS**); um relâmpago revela a ponte com um tanque; um caça inimigo passa rasante. | `EnemyRenderer`/`SpriteCache` (atores), SFX de rádio, radar e rasante |
| 15,5–22,5 s | **Conflito** | O rio quase para e a trilha abafa. Uma silhueta imensa desce no escuro — o Dreadnought, apenas vislumbrado: relâmpago duplo, **CONTATO DESCONHECIDO**, o núcleo acende em vermelho. | `BossRenderer` (silhueta), luz pontual do núcleo, sirene, haptics |
| 22,5–30,5 s | **Contexto** | Corte seco para o preto. O caça do jogador (a skin equipada no Hangar) sobe do fundo com o farol aquecendo enquanto amanhece. Ficha do piloto com o nome da aeronave e o codinome. | `Player` + `PlayerSkinRenderer`, farol do `LightingSystem`, rastro do `Fx`, amanhecer do `Atmosphere` |
| 30,5–37 s | **Clímax** | Enquadramento de jogo; a percussão pesada entra. O caça abre fogo e derruba uma ponte (explosão em cadeia, onda de choque) e o título **RIVER RAID** bate na tela com o subtítulo e o lema do menu. | Tiros do próprio `Player`, `Fx` (explosões, shockwave, shake, flash), camadas adaptativas da trilha |
| 37–39 s | **Transição** | As faixas recolhem e o HUD desce no lugar delas; a voz 8-bit anuncia **"Missão iniciada"** e a trilha da floresta assume. O gameplay já está rodando. | `UI`, `SpeechSynth8Bit`, trilha do bioma |

Transmissões do QG (pt-BR / en em `src/i18n.ts`):
1. *Eles tomaram o rio durante a noite.*
2. *Cada ponte é uma linha de suprimento. Cada patrulha, uma muralha.*
3. *E algo muito maior está descendo o rio.*
4. *Um piloto. Um caça. Um tanque de combustível.*
5. *Você é tudo o que nos resta, piloto. Retome o rio.*

O chefe nunca aparece inteiro à luz: a cena cria expectativa sem entregar o encontro dos 90 s de jogo.

---

## 🧱 Arquitetura

- **`IntroCinematic.ts`** — o diretor. Guarda o roteiro (tempos, curvas de velocidade do rio, hora do dia e escuridão), a câmera (zoom/foco sempre dentro do quadro, seguindo o rio), os atores (objetos no formato `Enemy` e um `BossDreadnought` usado só para desenho), as marcações de alvo, as luzes e o autopiloto do caça. Efeitos pontuais passam pelo `IntroContext`, no mesmo molde do `CollisionContext`: o diretor nunca alcança o `Game`.
- **`IntroRenderer.ts`** — desenha os atores dentro da câmera e a camada de cinema em espaço de tela (letterbox, carimbo, rádio, marcações, ficha do piloto, título, "missão iniciada", CRT e cortes). Tipografia e cores do menu.
- **`Game.ts`** — estágios `cinematic → handover → done`. Na cinemática o roteiro dita velocidade do rio, hora do dia, clima e farol; nenhum timer de gameplay corre e nada pontua. Na transição o gameplay já roda e o HUD entra com alpha/deslize.
- **`GameCanvas.tsx`** — prop `intro`; o estágio vira o atributo `data-intro` no container (sem re-render do React). O CSS esconde os controles touch e mostra o botão **PULAR**.
- **`App.tsx`** — arma a cena apenas na Patrulha Clássica (menu, tutorial, opções ou seleção de modo). Retry e desafio diário vão direto para a ação.

Extensões pequenas nos sistemas existentes:
- `Atmosphere.setCycleTime` · `WeatherSystem.forceWeather` / `triggerLightning`
- `World.holdCourse` — o trecho do clímax é gerado reto (sem RNG): com uma curva entre o caça e a ponte, a rajada não alcançaria o alvo
- `SoundManager.startIntroMusic` (tema `INTRO_TRACK`, Ré menor em meio-tempo — casa com a trilha da floresta) + SFX `radioClick`, `radarPing`, `jetFlyby`, `alarm`
- `SpeechSynth8Bit` — cue `mission_start` (en/pt-BR)
- `SettingsService.introCinematic` + toggle em Opções
- Strings `intro*` e `settingsLabelIntro` em `i18n.ts`

**Correção incluída:** `SoundManager.setDynamicIntensity` guardava a referência do objeto que o `Game` reaproveita a cada frame; depois da primeira mudança a comparação passava a ver sempre "sem mudança" e o filtro de combustível baixo ficava preso em 650 Hz pelo resto da partida. Agora os valores são copiados.

---

## 📐 Regras
- **Determinismo:** a cena rola o rio (o mundo consome o RNG ao gerar margens), então nunca é armada em partida com seed.
- **Pular:** Enter, Esc (ou a tecla de pausa) e o botão PULAR. A cena corta para a transição saindo do preto.
- **Acessibilidade:** com movimento reduzido o zoom é contido e relâmpagos/flash branco não piscam a tela; clima e iluminação seguem os toggles de Opções.
- **Zero alocação por frame:** atores, luzes, marcações e visões de texto são pré-alocados; a quebra de linha do rádio é cacheada.

---

## 🧪 Testes
- `IntroCinematic.test.ts` — curvas do roteiro, cues de áudio/FX, chefe, ponte (tiro e rede de segurança), pular, transição, câmera, movimento reduzido, marcações, textos e luzes.
- `IntroRenderer.test.ts` — CRT, letterbox, rádio com cursor, marcações, ficha do piloto, título, "missão iniciada", vinheta em cache, layout estreito.
- `Game.test.ts` (bloco *Game intro cinematic*) — início sem/com cena, Enter/Esc pulando, entradas travadas, cena completa entregando o controle sem pontuar, `restart`, rótulos.
- `SoundManager`, `SpeechSynth8Bit`, `WeatherSystem`, `Atmosphere`, `SettingsService`, `SettingsScreen` — extensões e a regressão do filtro.

## ✅ Verificação
```bash
npm run typecheck
npm test
npm run lint
npm run test:coverage
```
No navegador: INICIAR → assistir à cena inteira → confirmar que o HUD entra e o caça responde; repetir pulando com Enter/Esc e com o botão PULAR; desligar em Opções → "Cinemática de abertura" e confirmar que INICIAR vai direto para o jogo.
