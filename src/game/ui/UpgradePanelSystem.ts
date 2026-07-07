import Phaser from 'phaser';
import type { UpgradeSystem } from '../systems/UpgradeSystem';

const PANEL_FILL = 0xf4e6b3;
const PANEL_STROKE = 0x6f5734;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0x9ca28e;
const LOCKED_FILL = 0xc3b89a;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#ece7d7';

interface UpgradePanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onPurchase: () => void;
  isLocked?: () => boolean;
  isHighlighted?: () => boolean;
}

export class UpgradePanelSystem {
  private readonly scene: Phaser.Scene;
  private readonly upgradeSystem: UpgradeSystem;
  private config?: UpgradePanelConfig;
  private confirmingPurchase = false;
  private readonly objects: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, upgradeSystem: UpgradeSystem) {
    this.scene = scene;
    this.upgradeSystem = upgradeSystem;
  }

  render(config: UpgradePanelConfig): void {
    this.config = config;
    this.refresh();
  }

  refresh(): void {
    if (this.config === undefined) {
      return;
    }

    this.clearObjects();

    const upgrade = this.upgradeSystem.getNextPlotUpgrade();
    const canAfford = this.upgradeSystem.canAffordNextPlotUpgrade();
    const locked = this.config.isLocked?.() === true;
    const highlighted = this.config.isHighlighted?.() === true;

    if (upgrade === null || locked || !canAfford) {
      this.confirmingPurchase = false;
    }

    if (this.confirmingPurchase && upgrade !== null) {
      this.renderConfirmation(upgrade.plotsToUnlock, upgrade.coinCost);
      return;
    }

    const fillColor = locked
      ? LOCKED_FILL
      : upgrade !== null && canAfford
        ? READY_FILL
        : DISABLED_FILL;
    const textColor = upgrade !== null && !locked && canAfford ? TEXT_COLOR : DISABLED_TEXT;

    const panel = this.scene.add
      .rectangle(this.config.x, this.config.y, this.config.width, this.config.height, fillColor)
      .setOrigin(0, 0)
      .setStrokeStyle(highlighted ? 3 : 2, highlighted ? 0xffe27a : PANEL_STROKE)
      .setAlpha(upgrade !== null && !locked && canAfford ? 1 : 0.78);

    this.objects.push(panel);

    if (highlighted) {
      this.scene.tweens.add({
        targets: panel,
        alpha: 0.72,
        duration: 520,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (upgrade !== null && !locked && canAfford) {
      panel.setInteractive({ useHandCursor: true });
      panel.on('pointerdown', () => {
        this.confirmingPurchase = true;
        this.refresh();
      });
    }

    const title =
      upgrade === null
        ? 'All plot upgrades purchased'
        : locked
          ? 'Plot Upgrade Locked'
          : 'Purchase More Plots';
    const details =
      upgrade === null
        ? 'All MVP plot upgrades are complete'
        : locked
          ? 'Follow the tutorial to unlock this'
          : `${upgrade.plotsToUnlock} plots  |  Price: ${upgrade.coinCost} coins`;

    this.objects.push(
      this.scene.add.text(this.config.x + 12, this.config.y + 6, title, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        fontStyle: 'bold'
      })
    );

    this.objects.push(
      this.scene.add.text(this.config.x + 12, this.config.y + 27, details, {
        color: textColor,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px'
      })
    );
  }

  private renderConfirmation(plotsToUnlock: number, coinCost: number): void {
    if (this.config === undefined) {
      return;
    }

    const panel = this.scene.add
      .rectangle(this.config.x, this.config.y, this.config.width, this.config.height, READY_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE);

    const text = this.scene.add.text(
      this.config.x + 12,
      this.config.y + 14,
      `Buy ${plotsToUnlock} plots for ${coinCost} coins?`,
      {
        color: TEXT_COLOR,
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold'
      }
    );

    this.objects.push(panel, text);
    this.renderConfirmButton(this.config.x + this.config.width - 112, this.config.y + 9, 'Yes', () => {
      this.confirmingPurchase = false;
      this.config?.onPurchase();
    });
    this.renderConfirmButton(this.config.x + this.config.width - 56, this.config.y + 9, 'No', () => {
      this.confirmingPurchase = false;
      this.refresh();
    });
  }

  private renderConfirmButton(x: number, y: number, label: string, onClick: () => void): void {
    const button = this.scene.add
      .rectangle(x, y, 48, 26, label === 'Yes' ? READY_FILL : DISABLED_FILL)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setInteractive({ useHandCursor: true });

    button.on('pointerdown', onClick);

    this.objects.push(
      button,
      this.scene.add
        .text(x + 24, y + 13, label, {
          color: label === 'Yes' ? TEXT_COLOR : DISABLED_TEXT,
          fontFamily: 'Arial, sans-serif',
          fontSize: '12px',
          fontStyle: 'bold'
        })
        .setOrigin(0.5)
    );
  }

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
