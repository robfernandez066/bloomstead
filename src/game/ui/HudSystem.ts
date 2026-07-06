import Phaser from 'phaser';
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

  render(x: number, y: number, width: number): void {
    this.scene.add
      .rectangle(x, y, width, 86, PANEL_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE);

    this.coinsText = this.createText(x + 14, y + 12);
    this.levelText = this.createText(x + width - 106, y + 12);
    this.xpText = this.createText(x + 14, y + 48);
    this.selectedSeedText = this.createText(x + width - 174, y + 48);

    this.refresh();
  }

  refresh(): void {
    const state = this.gameState.getState();
    const selectedSeed = this.gameState.getSelectedSeed();

    this.coinsText?.setText(`Coins: ${state.coins}`);
    this.levelText?.setText(`Level: ${state.farmLevel}`);
    this.xpText?.setText(`XP: ${state.farmXp}`);
    this.selectedSeedText?.setText(`Seed: ${selectedSeed.name}`);
  }

  private createText(x: number, y: number): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, '', {
      color: TEXT_COLOR,
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold'
    });
  }
}
