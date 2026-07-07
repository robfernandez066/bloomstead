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
  disabledTap: 0.28,
  tutorialComplete: 0.6
};

export class AudioSystem {
  private readonly scene: Phaser.Scene;
  private readonly state: AudioState;
  private readonly lastPlayedAt = new Map<SoundEventId, number>();

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

    try {
      if (this.scene.cache.audio.exists(key)) {
        this.scene.sound.play(key, {
          volume: SOUND_VOLUME[eventId] ?? 0.45
        });
      }
    } catch {
      // Audio hooks are optional for the MVP until real assets are loaded.
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
    this.playThrottled('harvest', 160);
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
}
