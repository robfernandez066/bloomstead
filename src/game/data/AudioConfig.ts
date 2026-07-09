import type { SoundEventId } from '../models/AudioTypes';

export const AUDIO_KEYS = {
  music: 'music.main',
  plant: 'sfx.plant',
  harvest: 'sfx.harvest',
  coin: 'sfx.coin',
  tap: 'sfx.tap',
  fanfare: 'sfx.fanfare',
  levelup: 'sfx.levelup'
} as const;

export const AUDIO_ASSETS = [
  {
    key: AUDIO_KEYS.music,
    url: new URL('../../../assets/audio/music.mp3', import.meta.url).href
  },
  {
    key: AUDIO_KEYS.plant,
    url: new URL('../../../assets/audio/plant.ogg', import.meta.url).href
  },
  {
    key: AUDIO_KEYS.harvest,
    url: new URL('../../../assets/audio/harvest.mp3', import.meta.url).href
  },
  {
    key: AUDIO_KEYS.coin,
    url: new URL('../../../assets/audio/coin.ogg', import.meta.url).href
  },
  {
    key: AUDIO_KEYS.tap,
    url: new URL('../../../assets/audio/tap.ogg', import.meta.url).href
  },
  {
    key: AUDIO_KEYS.fanfare,
    url: new URL('../../../assets/audio/fanfare.ogg', import.meta.url).href
  },
  {
    key: AUDIO_KEYS.levelup,
    url: new URL('../../../assets/audio/levelup.ogg', import.meta.url).href
  }
] as const;

export const DEFAULT_MUSIC_VOLUME = 0.2;
export const DEFAULT_SFX_VOLUME = 0.72;
export const MUSIC_VOLUME = DEFAULT_MUSIC_VOLUME;
export const HARVEST_CLIP_MS = 1000;
export const HARVEST_SOUND_COOLDOWN_MS = 180;

export const SOUND_KEYS: Record<SoundEventId, string> = {
  buttonTap: AUDIO_KEYS.tap,
  plantSeed: AUDIO_KEYS.plant,
  cropReady: 'sfx.cropReady',
  harvest: AUDIO_KEYS.harvest,
  sellCrop: 'sfx.sellCrop',
  coinGain: AUDIO_KEYS.coin,
  xpGain: 'sfx.xpGain',
  orderComplete: AUDIO_KEYS.fanfare,
  levelUp: AUDIO_KEYS.levelup,
  plotUnlock: AUDIO_KEYS.fanfare,
  productionStart: AUDIO_KEYS.tap,
  productionCollect: AUDIO_KEYS.coin,
  disabledTap: AUDIO_KEYS.tap,
  tutorialComplete: AUDIO_KEYS.fanfare
};

export const SOUND_VOLUME: Partial<Record<SoundEventId, number>> = {
  buttonTap: 0.22,
  plantSeed: 0.3,
  cropReady: 0.24,
  harvest: 0.44,
  sellCrop: 0.26,
  coinGain: 0.32,
  xpGain: 0.22,
  orderComplete: 0.5,
  levelUp: 0.58,
  plotUnlock: 0.46,
  productionStart: 0.28,
  productionCollect: 0.42,
  disabledTap: 0.16,
  tutorialComplete: 0.55
};
