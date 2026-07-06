import Phaser from 'phaser';
import type { CropDefinition } from '../models/CropTypes';
import type { GameStateSystem } from '../systems/GameStateSystem';

const SELECTED_FILL = 0xffd56f;
const UNLOCKED_FILL = 0xe8f0bb;
const LOCKED_FILL = 0x7d8377;
const BUTTON_STROKE = 0x5e6b45;
const LOCKED_TEXT = '#d4d4cc';
const UNLOCKED_TEXT = '#263522';

interface SeedSelectorConfig {
  x: number;
  y: number;
  buttonWidth: number;
  buttonHeight: number;
  gap: number;
  onSeedSelected: () => void;
}

export class SeedSelectorSystem {
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameStateSystem;
  private readonly buttons: Phaser.GameObjects.Rectangle[] = [];

  constructor(scene: Phaser.Scene, gameState: GameStateSystem) {
    this.scene = scene;
    this.gameState = gameState;
  }

  render(config: SeedSelectorConfig): void {
    const crops = this.gameState.getCrops();

    crops.forEach((crop, index) => {
      this.renderSeedButton(crop, index, config);
    });
  }

  refresh(): void {
    const selectedSeedId = this.gameState.getState().selectedSeedId;
    const crops = this.gameState.getCrops();

    this.buttons.forEach((button, index) => {
      const crop = crops[index];
      const unlocked = this.gameState.isCropUnlocked(crop);
      const fillColor = crop.id === selectedSeedId ? SELECTED_FILL : UNLOCKED_FILL;

      button.setFillStyle(unlocked ? fillColor : LOCKED_FILL);
      button.setAlpha(unlocked ? 1 : 0.72);
    });
  }

  private renderSeedButton(
    crop: CropDefinition,
    index: number,
    config: SeedSelectorConfig
  ): void {
    const unlocked = this.gameState.isCropUnlocked(crop);
    const selected = this.gameState.getState().selectedSeedId === crop.id;
    const x = config.x + index * (config.buttonWidth + config.gap);
    const fillColor = selected ? SELECTED_FILL : UNLOCKED_FILL;

    const button = this.scene.add
      .rectangle(x, config.y, config.buttonWidth, config.buttonHeight, unlocked ? fillColor : LOCKED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setAlpha(unlocked ? 1 : 0.72);

    this.buttons.push(button);

    if (unlocked) {
      button.setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => {
        if (this.gameState.selectSeed(crop.id)) {
          this.refresh();
          config.onSeedSelected();
        }
      });
    }

    this.scene.add
      .text(x + config.buttonWidth / 2, config.y + config.buttonHeight / 2, crop.name, {
        color: unlocked ? UNLOCKED_TEXT : LOCKED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: config.buttonWidth - 12 }
      })
      .setOrigin(0.5);
  }
}
