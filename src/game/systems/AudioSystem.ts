import Phaser from 'phaser';
import {
  AUDIO_KEYS,
  DEFAULT_MUSIC_VOLUME,
  DEFAULT_SFX_VOLUME,
  HARVEST_CLIP_MS,
  HARVEST_SOUND_COOLDOWN_MS,
  SOUND_KEYS,
  SOUND_VOLUME
} from '../data/AudioConfig';
import type { AudioState, SoundEventId } from '../models/AudioTypes';

interface ResolvedAudioState {
  muted: boolean;
  sfxOn: boolean;
  musicOn: boolean;
  sfxVolume: number;
  musicVolume: number;
}

const DEFAULT_AUDIO_STATE: ResolvedAudioState = {
  muted: false,
  sfxOn: true,
  musicOn: true,
  sfxVolume: DEFAULT_SFX_VOLUME,
  musicVolume: DEFAULT_MUSIC_VOLUME
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

type VolumeAdjustableSound = Phaser.Sound.BaseSound & {
  setVolume: (value: number) => Phaser.Sound.BaseSound;
};

let activeMusic: Phaser.Sound.BaseSound | undefined;

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

  constructor(scene: Phaser.Scene, initialState?: AudioState) {
    this.scene = scene;
    const sfxOn = initialState?.sfxOn ?? (initialState?.muted === undefined ? true : !initialState.muted);
    const musicOn = initialState?.musicOn ?? true;
    const sfxVolume = initialState?.sfxVolume ?? (sfxOn ? DEFAULT_AUDIO_STATE.sfxVolume : 0);
    const musicVolume = initialState?.musicVolume ?? (musicOn ? DEFAULT_AUDIO_STATE.musicVolume : 0);

    this.state = {
      ...DEFAULT_AUDIO_STATE,
      ...initialState,
      sfxVolume: this.clampVolume(sfxVolume),
      musicVolume: this.clampVolume(musicVolume),
      muted: this.clampVolume(sfxVolume) <= 0,
      sfxOn: this.clampVolume(sfxVolume) > 0,
      musicOn: this.clampVolume(musicVolume) > 0
    };
  }

  getState(): AudioState {
    return {
      muted: !this.state.sfxOn,
      sfxOn: this.state.sfxOn,
      musicOn: this.state.musicOn,
      sfxVolume: this.state.sfxVolume,
      musicVolume: this.state.musicVolume
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

  getSfxVolume(): number {
    return this.state.sfxVolume;
  }

  getMusicVolume(): number {
    return this.state.musicVolume;
  }

  setMuted(muted: boolean): void {
    this.setSfxOn(!muted);
  }

  toggleMuted(): boolean {
    this.toggleSfx();
    return this.isMuted();
  }

  setSfxOn(sfxOn: boolean): void {
    this.setSfxVolume(sfxOn ? DEFAULT_SFX_VOLUME : 0);
  }

  toggleSfx(): boolean {
    this.setSfxOn(!this.state.sfxOn);
    return this.state.sfxOn;
  }

  setMusicOn(musicOn: boolean): void {
    this.setMusicVolume(musicOn ? DEFAULT_MUSIC_VOLUME : 0);
  }

  toggleMusic(): boolean {
    this.setMusicOn(!this.state.musicOn);
    return this.state.musicOn;
  }

  setSfxVolume(volume: number): void {
    this.state.sfxVolume = this.clampVolume(volume);
    this.state.sfxOn = this.state.sfxVolume > 0;
    this.state.muted = !this.state.sfxOn;
  }

  setMusicVolume(volume: number): void {
    this.state.musicVolume = this.clampVolume(volume);
    this.state.musicOn = this.state.musicVolume > 0;

    this.applyMusicVolume();

    if (this.state.musicOn && !this.isMusicPlaying()) {
      this.startMusic();
    }
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
        this.music = activeMusic ?? this.scene.sound.add(AUDIO_KEYS.music, {
          loop: true,
          volume: this.state.musicVolume
        });
        activeMusic = this.music;
      }

      if (this.music.isPlaying) {
        this.applyMusicVolume();
        return;
      }

      this.music.play({
        loop: true,
        volume: this.state.musicVolume
      });
    } catch {
      // Audio should never break gameplay if browser policy or assets disagree.
    }
  }

  stopMusic(): void {
    try {
      this.music?.stop();
      activeMusic?.stop();
    } catch {
      // Optional audio should fail silently.
    }
  }

  private isMusicPlaying(): boolean {
    return this.music?.isPlaying === true || activeMusic?.isPlaying === true;
  }

  private applyMusicVolume(): void {
    try {
      this.setSoundVolume(this.music);
      this.setSoundVolume(activeMusic);
    } catch {
      // Optional audio should fail silently.
    }
  }

  private setSoundVolume(sound: Phaser.Sound.BaseSound | undefined): void {
    if (sound === undefined || !('setVolume' in sound) || typeof sound.setVolume !== 'function') {
      return;
    }

    (sound as VolumeAdjustableSound).setVolume(this.state.musicVolume);
  }

  play(eventId: SoundEventId): void {
    if (!this.state.sfxOn || this.state.sfxVolume <= 0) {
      return;
    }

    const key = SOUND_KEYS[eventId];
    let assetPlayed = false;

    try {
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, {
          volume: (SOUND_VOLUME[eventId] ?? 0.45) * this.state.sfxVolume
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
    this.playThrottled('plantSeed', 120);
  }

  playCropReady(): void {
    this.playThrottled('cropReady', 180);
  }

  playHarvest(): void {
    this.playHarvestClip();
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

  private playHarvestClip(): void {
    if (!this.state.sfxOn || this.state.sfxVolume <= 0) {
      return;
    }

    const now = this.scene.time.now;
    const lastPlayedAt = this.lastPlayedAt.get('harvest') ?? -Infinity;

    if (now - lastPlayedAt < HARVEST_SOUND_COOLDOWN_MS) {
      return;
    }

    this.lastPlayedAt.set('harvest', now);

    try {
      if (this.scene.cache.audio.exists(AUDIO_KEYS.harvest)) {
        const sound = this.scene.sound.add(AUDIO_KEYS.harvest, {
          volume: (SOUND_VOLUME.harvest ?? 0.45) * this.state.sfxVolume
        });

        sound.play();
        this.scene.time.delayedCall(HARVEST_CLIP_MS, () => {
          try {
            if (sound.isPlaying) {
              sound.stop();
            }

            sound.destroy();
          } catch {
            // Optional audio should fail silently.
          }
        });
        return;
      }
    } catch {
      // Fall back to generated audio below.
    }

    this.playGeneratedTone('harvest');
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

      toneSteps.forEach((step) => {
        const startAt = now + (step.delayMs ?? 0) / 1000;
        const stopAt = startAt + step.durationMs / 1000;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const peakGain = (step.gain ?? 0.025) * this.state.sfxVolume;

        oscillator.type = step.type ?? 'sine';
        oscillator.frequency.setValueAtTime(step.frequency, startAt);
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

  private clampVolume(volume: number): number {
    return Phaser.Math.Clamp(Number.isFinite(volume) ? volume : 0, 0, 1);
  }
}
