import Phaser from 'phaser';
import { getNextFarmLevelThreshold } from '../data/LevelProgression';
import type { GameStateSystem } from '../systems/GameStateSystem';

const PANEL_FILL = 0xf4e6b3;
const PANEL_STROKE = 0x6f5734;
const TEXT_COLOR = '#2f3b26';

export class HudSystem {
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameStateSystem;
  private coinsText?: Phaser.GameObjects.Text;
  private levelText?: Phaser.GameObjects.Text;
  private xpText?: Phaser.GameObjects.Text;
  private selectedSeedText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gameState: GameStateSystem) {
    this.scene = scene;
    this.gameState = gameState;
  }

  render(x: number, y: number, width: number, height: number): void {
    this.scene.add
      .rectangle(x, y, width, height, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE);

    this.coinsText = this.createText(x + 14, y + 10);
    this.levelText = this.createText(x + width - 106, y + 10);
    this.xpText = this.createText(x + 14, y + 40);
    this.selectedSeedText = this.createText(x + width - 174, y + 40);

    this.refresh();
  }

  refresh(): void {
    const state = this.gameState.getState();
    const selectedSeed = this.gameState.getSelectedSeed();
    const nextLevelThreshold = getNextFarmLevelThreshold(state.farmLevel);

    this.coinsText?.setText(`Coins: ${state.coins}`);
    this.levelText?.setText(`Level: ${state.farmLevel}`);
    this.xpText?.setText(
      nextLevelThreshold === null
        ? `XP: ${state.farmXp} | Max`
        : `XP: ${state.farmXp} / ${nextLevelThreshold.requiredXp}`
    );
    this.selectedSeedText?.setText(`Seed: ${selectedSeed.name}`);
  }

  playCoinsPulse(): void {
    this.playTextPulse(this.coinsText);
  }

  playXpPulse(): void {
    this.playTextPulse(this.xpText);
  }

  private playTextPulse(text?: Phaser.GameObjects.Text): void {
    if (text === undefined) {
      return;
    }

    this.scene.tweens.add({
      targets: text,
      scale: 1.16,
      yoyo: true,
      duration: 150,
      ease: 'Sine.easeOut'
    });
  }

  private createText(x: number, y: number, fontSize = '18px'): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, '', {
      color: TEXT_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize,
      fontStyle: 'bold'
    });
  }
}
