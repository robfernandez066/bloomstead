import Phaser from 'phaser';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { CropSellingSystem } from '../systems/CropSellingSystem';
import type { GameStateSystem } from '../systems/GameStateSystem';

const ENABLED_FILL = 0xe8f0bb;
const DISABLED_FILL = 0x9ca28e;
const BUTTON_STROKE = 0x5e6b45;
const TEXT_COLOR = '#263522';
const DISABLED_TEXT = '#ece7d7';

interface CropSellPanelConfig {
  x: number;
  y: number;
  buttonWidth: number;
  buttonHeight: number;
  gap: number;
  onSellCrop: (crop: CropDefinition) => void;
}

interface SellButton {
  crop: CropDefinition;
  button: Phaser.GameObjects.Rectangle;
  cropLabel: Phaser.GameObjects.Text;
  sellLabel: Phaser.GameObjects.Text;
}

export class CropSellPanelSystem {
  private readonly scene: Phaser.Scene;
  private readonly gameState: GameStateSystem;
  private readonly cropSellingSystem: CropSellingSystem;
  private readonly sellButtons: SellButton[] = [];
  private config?: CropSellPanelConfig;

  constructor(
    scene: Phaser.Scene,
    gameState: GameStateSystem,
    cropSellingSystem: CropSellingSystem
  ) {
    this.scene = scene;
    this.gameState = gameState;
    this.cropSellingSystem = cropSellingSystem;
  }

  render(config: CropSellPanelConfig): void {
    this.config = config;

    this.gameState.getCrops().forEach((crop, index) => {
      this.renderButton(crop, index, config);
    });

    this.refresh();
  }

  refresh(): void {
    this.sellButtons.forEach(({ crop, button, cropLabel, sellLabel }) => {
      const canSell = this.cropSellingSystem.canSell(crop.id);
      const count = this.gameState.getState().cropInventory[crop.id];

      button.setFillStyle(canSell ? ENABLED_FILL : DISABLED_FILL);
      button.setAlpha(canSell ? 1 : 0.72);
      cropLabel.setText(`${crop.name} x${count}`);
      cropLabel.setColor(canSell ? TEXT_COLOR : DISABLED_TEXT);
      sellLabel.setColor(canSell ? TEXT_COLOR : DISABLED_TEXT);

      if (canSell) {
        button.setInteractive({ useHandCursor: true });
      } else {
        button.disableInteractive();
      }
    });
  }

  getCropTargetPosition(cropId: CropId): Phaser.Math.Vector2 {
    const button = this.sellButtons.find((sellButton) => sellButton.crop.id === cropId);

    if (button !== undefined && this.config !== undefined) {
      return new Phaser.Math.Vector2(
        button.button.x + this.config.buttonWidth / 2,
        button.button.y + this.config.buttonHeight / 2
      );
    }

    return new Phaser.Math.Vector2(0, 0);
  }

  private renderButton(
    crop: CropDefinition,
    index: number,
    config: CropSellPanelConfig
  ): void {
    const x = config.x + index * (config.buttonWidth + config.gap);

    const button = this.scene.add
      .rectangle(x, config.y, config.buttonWidth, config.buttonHeight, DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, BUTTON_STROKE)
      .setAlpha(0.72);

    button.on('pointerdown', () => {
      config.onSellCrop(crop);
    });

    const cropLabel = this.scene.add
      .text(x + config.buttonWidth / 2, config.y + 8, `${crop.name} x0`, {
        color: DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    const sellLabel = this.scene.add
      .text(x + config.buttonWidth / 2, config.y + 22, `Sell +${crop.sellValue}c`, {
        color: DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontStyle: 'bold'
      })
      .setOrigin(0.5, 0);

    this.sellButtons.push({ crop, button, cropLabel, sellLabel });
  }
}
