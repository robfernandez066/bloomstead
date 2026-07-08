import Phaser from 'phaser';
import type { AudioState, SoundEventId } from '../models/AudioTypes';

const DEFAULT_AUDIO_STATE: AudioState = {
  muted: false
};

const SOUND_KEYS: Record<SoundEventId, string> = {
  buttonTap: 'sfx.buttonTap',
  plantSeed: 'sfx.plantSeed',
  cropReady: 'sfx.cropReady',
  harvest: 'sfx.harvest',
  sellCrop: 'sfx.sellCrop',
  coinGain: 'sfx.coinGain',
  xpGain: 'sfx.xpGain',
  orderComplete: 'sfx.orderComplete',
  levelUp: 'sfx.levelUp',
  plotUnlock: 'sfx.plotUnlock',
  productionStart: 'sfx.productionStart',
  productionCollect: 'sfx.productionCollect',
  disabledTap: 'sfx.disabledTap',
  tutorialComplete: 'sfx.tutorialComplete'
};

const SOUND_VOLUME: Partial<Record<SoundEventId, number>> = {
  buttonTap: 0.35,
  plantSeed: 0.45,
  cropReady: 0.45,
  harvest: 0.45,
  sellCrop: 0.45,
  coinGain: 0.45,
  xpGain: 0.4,
  orderComplete: 0.55,
  levelUp: 0.6,
  plotUnlock: 0.55,
  productionStart: 0.42,
  productionCollect: 0.5,
  disabledTap: 0.28,
  tutorialComplete: 0.6
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
  private readonly state: AudioState;
  private readonly lastPlayedAt = new Map<SoundEventId, number>();
  private audioContext?: AudioContext;

  constructor(scene: Phaser.Scene, initialState?: AudioState) {
    this.scene = scene;
    this.state = {
      ...DEFAULT_AUDIO_STATE,
      ...initialState
    };
  }

  getState(): AudioState {
    return this.state;
  }

  isMuted(): boolean {
    return this.state.muted;
  }

  setMuted(muted: boolean): void {
    this.state.muted = muted;
  }

  toggleMuted(): boolean {
    this.state.muted = !this.state.muted;
    return this.state.muted;
  }

  play(eventId: SoundEventId): void {
    if (this.state.muted) {
      return;
    }

    const key = SOUND_KEYS[eventId];
    let assetPlayed = false;

    try {
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, {
          volume: SOUND_VOLUME[eventId] ?? 0.45
        });
        assetPlayed = true;
      }
    } catch {
      // Audio hooks are optional for the MVP until real assets are loaded.
    }

    if (!assetPlayed) {
      this.playGeneratedTone(eventId);
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
    this.playThrottled('harvest', 85);
  }

  playSellCrop(): void {
    this.play('sellCrop');
  }

  playCoinGain(): void {
    this.play('coinGain');
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

  private playGeneratedTone(eventId: SoundEventId): void {
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
      const pitchMultiplier = eventId === 'harvest'
        ? Phaser.Math.FloatBetween(0.96, 1.07)
        : 1;

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
