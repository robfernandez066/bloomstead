export interface AudioState {
  muted?: boolean;
  sfxOn?: boolean;
  musicOn?: boolean;
  sfxVolume?: number;
  musicVolume?: number;
}

export type SoundEventId =
  | 'buttonTap'
  | 'plantSeed'
  | 'cropReady'
  | 'harvest'
  | 'sellCrop'
  | 'coinGain'
  | 'xpGain'
  | 'orderComplete'
  | 'levelUp'
  | 'plotUnlock'
  | 'productionStart'
  | 'productionCollect'
  | 'disabledTap'
  | 'tutorialComplete';
