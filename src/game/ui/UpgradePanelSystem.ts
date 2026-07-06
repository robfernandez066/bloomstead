import Phaser from 'phaser';
import type { UpgradeSystem } from '../systems/UpgradeSystem';

const PANEL_FILL = 0xf4e6b3;
const PANEL_STROKE = 0x6f5734;
const READY_FILL = 0xdff0ad;
const DISABLED_FILL = 0x9ca28e;
const TEXT_COLOR = '#2f3b26';
const DISABLED_TEXT = '#ece7d7';

interface UpgradePanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  onPurchase: () => void;
}

export class UpgradePanelSystem {
  private readonly scene: Phaser.Scene;
  private readonly upgradeSystem: UpgradeSystem;
  private config?: UpgradePanelConfig;
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
    const fillColor = upgrade !== null && canAfford ? READY_FILL : DISABLED_FILL;
    const textColor = upgrade !== null && canAfford ? TEXT_COLOR : DISABLED_TEXT;

    const panel = this.scene.add
      .rectangle(this.config.x, this.config.y, this.config.width, this.config.height, fillColor)
      .setOrigin(0, 0)
      .setStrokeStyle(2, PANEL_STROKE)
      .setAlpha(upgrade !== null && canAfford ? 1 : 0.78);

    this.objects.push(panel);

    if (upgrade !== null && canAfford) {
      panel.setInteractive({ useHandCursor: true });
      panel.on('pointerdown', () => {
        this.config?.onPurchase();
      });
    }

    const title = upgrade === null ? 'All plot upgrades purchased' : 'Next Plot Upgrade';
    const details =
      upgrade === null
        ? 'All MVP plot upgrades are complete'
        : `${upgrade.plotsToUnlock} plots  |  ${upgrade.coinCost} coins`;

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

  private clearObjects(): void {
    for (const object of this.objects) {
      object.destroy();
    }

    this.objects.length = 0;
  }
}
