import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  COIN_RATE_MAX,
  COIN_RATE_MIN,
  HARVEST_CHAIN_RATE_MAX,
  HARVEST_CHAIN_RATE_STEP,
  HARVEST_CHAIN_WINDOW_MS,
  MUSIC_VOLUME,
  SOUND_KEYS,
  SOUND_VOLUME
} from '../data/AudioConfig';
import type { AudioState, SoundEventId } from '../models/AudioTypes';

interface ResolvedAudioState {
  muted: boolean;
  sfxOn: boolean;
  musicOn: boolean;
}

const DEFAULT_AUDIO_STATE: ResolvedAudioState = {
  muted: false,
  sfxOn: true,
  musicOn: true
};

interface ToneStep {
  frequency: number;
  durationMs: number;
  delayMs?: number;
  gain?: number;
  type?: OscillatorType;
}

type WebAudioWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

const GENERATED_TONES: Partial<Record<SoundEventId, ToneStep[]>> = {
  buttonTap: [{ frequency: 520, durationMs: 42, gain: 0.025, type: 'triangle' }],
  plantSeed: [
    { frequency: 180, durationMs: 45, gain: 0.028, type: 'triangle' },
    { frequency: 260, durationMs: 55, delayMs: 35, gain: 0.022, type: 'sine' }
  ],
  cropReady: [
    { frequency: 640, durationMs: 70, gain: 0.025, type: 'sine' },
    { frequency: 860, durationMs: 80, delayMs: 55, gain: 0.02, type: 'sine' }
  ],
  harvest: [
    { frequency: 740, durationMs: 58, gain: 0.032, type: 'triangle' },
    { frequency: 980, durationMs: 42, delayMs: 24, gain: 0.018, type: 'sine' }
  ],
  orderComplete: [
    { frequency: 784, durationMs: 85, gain: 0.034, type: 'sine' },
    { frequency: 988, durationMs: 100, delayMs: 70, gain: 0.033, type: 'sine' },
    { frequency: 1568, durationMs: 70, delayMs: 150, gain: 0.018, type: 'triangle' }
  ],
  levelUp: [
    { frequency: 523, durationMs: 85, gain: 0.035, type: 'sine' },
    { frequency: 784, durationMs: 95, delayMs: 75, gain: 0.036, type: 'sine' },
    { frequency: 1047, durationMs: 115, delayMs: 155, gain: 0.034, type: 'sine' },
    { frequency: 1319, durationMs: 150, delayMs: 250, gain: 0.028, type: 'triangle' }
  ],
  plotUnlock: [
    { frequency: 330, durationMs: 85, gain: 0.03, type: 'triangle' },
    { frequency: 494, durationMs: 95, delayMs: 72, gain: 0.03, type: 'sine' },
    { frequency: 740, durationMs: 105, delayMs: 150, gain: 0.024, type: 'sine' }
  ],
  productionStart: [{ frequency: 220, durationMs: 95, gain: 0.03, type: 'triangle' }],
  productionCollect: [
    { frequency: 587, durationMs: 70, gain: 0.033, type: 'triangle' },
    { frequency: 880, durationMs: 90, delayMs: 55, gain: 0.031, type: 'sine' },
    { frequency: 1175, durationMs: 90, delayMs: 125, gain: 0.022, type: 'sine' }
  ],
  disabledTap: [{ frequency: 140, durationMs: 45, gain: 0.014, type: 'sine' }],
  tutorialComplete: [
    { frequency: 523, durationMs: 85, gain: 0.034, type: 'sine' },
    { frequency: 784, durationMs: 95, delayMs: 75, gain: 0.034, type: 'sine' },
    { frequency: 1047, durationMs: 150, delayMs: 155, gain: 0.03, type: 'sine' }
  ]
};

export class AudioSystem {
  private readonly scene: Phaser.Scene;
  private readonly state: ResolvedAudioState;
  private readonly lastPlayedAt = new Map<SoundEventId, number>();
  private audioContext?: AudioContext;
  private music?: Phaser.Sound.BaseSound;
  private musicUnlockQueued = false;
  private lastHarvestAt = 0;
  private harvestRate = 1;

  constructor(scene: Phaser.Scene, initialState?: AudioState) {
    this.scene = scene;
    const sfxOn = initialState?.sfxOn ?? (initialState?.muted === undefined ? true : !initialState.muted);

    this.state = {
      ...DEFAULT_AUDIO_STATE,
      ...initialState,
      muted: !sfxOn,
      sfxOn,
      musicOn: initialState?.musicOn ?? DEFAULT_AUDIO_STATE.musicOn
    };
  }

  getState(): AudioState {
    return {
      muted: !this.state.sfxOn,
      sfxOn: this.state.sfxOn,
      musicOn: this.state.musicOn
    };
  }

  isMuted(): boolean {
    return !this.state.sfxOn;
  }

  isSfxOn(): boolean {
    return this.state.sfxOn;
  }

  isMusicOn(): boolean {
    return this.state.musicOn;
  }

  setMuted(muted: boolean): void {
    this.setSfxOn(!muted);
  }

  toggleMuted(): boolean {
    this.toggleSfx();
    return this.isMuted();
  }

  setSfxOn(sfxOn: boolean): void {
    this.state.sfxOn = sfxOn;
    this.state.muted = !sfxOn;
  }

  toggleSfx(): boolean {
    this.setSfxOn(!this.state.sfxOn);
    return this.state.sfxOn;
  }

  setMusicOn(musicOn: boolean): void {
    this.state.musicOn = musicOn;

    if (musicOn) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  toggleMusic(): boolean {
    this.setMusicOn(!this.state.musicOn);
    return this.state.musicOn;
  }

  startMusic(): void {
    if (!this.state.musicOn) {
      return;
    }

    if (!this.scene.cache.audio.exists(AUDIO_KEYS.music)) {
      return;
    }

    try {
      if (this.scene.sound.locked) {
        if (!this.musicUnlockQueued) {
          this.musicUnlockQueued = true;
          this.scene.sound.once(Phaser.Sound.Events.UNLOCKED, () => {
            this.musicUnlockQueued = false;
            this.startMusic();
          });
        }

        return;
      }

      if (this.music === undefined) {
        this.music = this.scene.sound.add(AUDIO_KEYS.music, {
          loop: true,
          volume: MUSIC_VOLUME
        });
      }

      if (!this.music.isPlaying) {
        this.music.play({
          loop: true,
          volume: MUSIC_VOLUME
        });
      }
    } catch {
      // Audio should never break gameplay if browser policy or assets disagree.
    }
  }

  stopMusic(): void {
    try {
      this.music?.stop();
    } catch {
      // Optional audio should fail silently.
    }
  }

  play(eventId: SoundEventId, rate = 1): void {
    if (!this.state.sfxOn) {
      return;
    }

    const key = SOUND_KEYS[eventId];
    let assetPlayed = false;

    try {
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, {
          volume: SOUND_VOLUME[eventId] ?? 0.45,
          rate
        });
        assetPlayed = true;
      }
    } catch {
      // Audio hooks are optional for the MVP until real assets are loaded.
    }

    if (!assetPlayed) {
      this.playGeneratedTone(eventId, rate);
    }
  }

  playButtonTap(): void {
    this.play('buttonTap');
  }

  playPlantSeed(): void {
    this.playThrottled('plantSeed', 90);
  }

  playCropReady(): void {
    this.playThrottled('cropReady', 180);
  }

  playHarvest(): void {
    const now = Date.now();

    this.harvestRate = now - this.lastHarvestAt <= HARVEST_CHAIN_WINDOW_MS
      ? Math.min(HARVEST_CHAIN_RATE_MAX, this.harvestRate + HARVEST_CHAIN_RATE_STEP)
      : 1;
    this.lastHarvestAt = now;
    this.play('harvest', this.harvestRate);
  }

  playSellCrop(): void {
    this.play('sellCrop');
  }

  playCoinGain(): void {
    this.play('coinGain', Phaser.Math.FloatBetween(COIN_RATE_MIN, COIN_RATE_MAX));
  }

  playXpGain(): void {
    this.play('xpGain');
  }

  playOrderComplete(): void {
    this.play('orderComplete');
  }

  playLevelUp(): void {
    this.play('levelUp');
  }

  playPlotUnlock(): void {
    this.play('plotUnlock');
  }

  playProductionStart(): void {
    this.playThrottled('productionStart', 120);
  }

  playProductionCollect(): void {
    this.playThrottled('productionCollect', 120);
  }

  playDisabledTap(): void {
    this.playThrottled('disabledTap', 180);
  }

  playTutorialComplete(): void {
    this.play('tutorialComplete');
  }

  private playThrottled(eventId: SoundEventId, cooldownMs: number): void {
    const now = this.scene.time.now;
    const lastPlayedAt = this.lastPlayedAt.get(eventId) ?? -Infinity;

    if (now - lastPlayedAt < cooldownMs) {
      return;
    }

    this.lastPlayedAt.set(eventId, now);
    this.play(eventId);
  }

  private playGeneratedTone(eventId: SoundEventId, rate = 1): void {
    const toneSteps = GENERATED_TONES[eventId];

    if (toneSteps === undefined) {
      return;
    }

    const audioContext = this.getAudioContext();

    if (audioContext === null) {
      return;
    }

    try {
      void audioContext.resume();
      const now = audioContext.currentTime;
      const pitchMultiplier = rate * (eventId === 'harvest'
        ? Phaser.Math.FloatBetween(0.96, 1.07)
        : 1);

      toneSteps.forEach((step) => {
        const startAt = now + (step.delayMs ?? 0) / 1000;
        const stopAt = startAt + step.durationMs / 1000;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const peakGain = step.gain ?? 0.025;

        oscillator.type = step.type ?? 'sine';
        oscillator.frequency.setValueAtTime(step.frequency * pitchMultiplier, startAt);
        gain.gain.setValueAtTime(0.0001, startAt);
        gain.gain.exponentialRampToValueAtTime(peakGain, startAt + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);

        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start(startAt);
        oscillator.stop(stopAt + 0.02);
      });
    } catch {
      // Browsers may block WebAudio until a user gesture; SFX should never break gameplay.
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') {
      return null;
    }

    if (this.audioContext !== undefined) {
      return this.audioContext;
    }

    try {
      const audioWindow = window as WebAudioWindow;
      const AudioContextConstructor = window.AudioContext ?? audioWindow.webkitAudioContext;

      if (AudioContextConstructor === undefined) {
        return null;
      }

      this.audioContext = new AudioContextConstructor();
      return this.audioContext;
    } catch {
      return null;
    }
  }
}
