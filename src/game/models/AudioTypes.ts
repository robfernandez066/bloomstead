export interface AudioState {
  muted: boolean;
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
  | 'disabledTap'
  | 'tutorialComplete';
