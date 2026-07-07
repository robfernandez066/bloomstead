import Phaser from 'phaser';
import type { CropDefinition, CropId } from '../models/CropTypes';
import type { CropSellingSystem } from '../systems/CropSellingSystem';
import type { GameStateSystem } from '../systems/GameStateSystem';
import { createItemIcon } from './ItemIcon';

const ENABLED_FILL = 0xe8f0bb;
const DISABLED_FILL = 0x9ca28e;
const BUTTON_STROKE = 0x5e6b45;
const TEXT_COLOR = '#263522';
const DISABLED_TEXT = '#ece7d7';
const ICON_SIZE = 14;
const LABEL_FONT_SIZE = 10;
const MIN_LABEL_FONT_SIZE = 8;
const TEXT_LEFT_PADDING = 21;
const TEXT_RIGHT_PADDING = 4;

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
  icon: Phaser.GameObjects.Container;
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
    this.sellButtons.forEach(({ crop, button, icon, cropLabel, sellLabel }) => {
      const canSell = this.cropSellingSystem.canSell(crop.id);
      const count = this.gameState.getState().cropInventory[crop.id];

      button.setFillStyle(canSell ? ENABLED_FILL : DISABLED_FILL);
      button.setAlpha(canSell ? 1 : 0.72);
      icon.setAlpha(canSell ? 1 : 0.58);
      this.setTextToFit(cropLabel, `${crop.name} x${count}`, this.getLabelMaxWidth());
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

    const icon = createItemIcon(this.scene, crop.id, x + 11, config.y + config.buttonHeight / 2, ICON_SIZE, {
      alpha: 0.58
    });

    const cropLabel = this.scene.add
      .text(x + TEXT_LEFT_PADDING, config.y + 7, `${crop.name} x0`, {
        color: DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: `${LABEL_FONT_SIZE}px`,
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    const sellLabel = this.scene.add
      .text(x + TEXT_LEFT_PADDING, config.y + 21, `Sell +${crop.sellValue}c`, {
        color: DISABLED_TEXT,
        fontFamily: 'Arial, sans-serif',
        fontSize: `${LABEL_FONT_SIZE}px`,
        fontStyle: 'bold'
      })
      .setOrigin(0, 0);

    this.setTextToFit(cropLabel, `${crop.name} x0`, this.getLabelMaxWidth());
    this.setTextToFit(sellLabel, `Sell +${crop.sellValue}c`, this.getLabelMaxWidth());

    this.sellButtons.push({ crop, button, icon, cropLabel, sellLabel });
  }

  private getLabelMaxWidth(): number {
    return (this.config?.buttonWidth ?? 84) - TEXT_LEFT_PADDING - TEXT_RIGHT_PADDING;
  }

  private setTextToFit(text: Phaser.GameObjects.Text, value: string, maxWidth: number): void {
    text.setText(value);
    text.setFontSize(LABEL_FONT_SIZE);

    for (let fontSize = LABEL_FONT_SIZE; text.width > maxWidth && fontSize > MIN_LABEL_FONT_SIZE; fontSize -= 1) {
      text.setFontSize(fontSize - 1);
    }
  }
}
