import Phaser from 'phaser';
import { HudSystem } from '../ui/HudSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { GridSystem } from '../systems/GridSystem';
import { PlotStateSystem } from '../systems/PlotStateSystem';

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('FarmScene');
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x8fcf8a);
    this.add.rectangle(width / 2, height * 0.72, width * 0.82, height * 0.34, 0x6aa45f);

    const gameStateSystem = new GameStateSystem();
    const plotStateSystem = new PlotStateSystem({
      rows: 6,
      columns: 6,
      unlockedTileCount: 12
    });

    const gridSystem = new GridSystem(this, {
      tileWidth: 56,
      tileHeight: 28,
      originX: width / 2,
      originY: height * 0.38
    }, plotStateSystem.getPlots());

    gridSystem.render();

    const hudSystem = new HudSystem(this, gameStateSystem);
    hudSystem.render(18, 18, width - 36);

    const seedSelectorSystem = new SeedSelectorSystem(this, gameStateSystem);
    seedSelectorSystem.render({
      x: 18,
      y: height - 104,
      buttonWidth: 108,
      buttonHeight: 64,
      gap: 15,
      onSeedSelected: () => hudSystem.refresh()
    });

    this.add
      .text(width / 2, height * 0.2, 'Bloomstead Farm Scene Loaded', {
        color: '#243524',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: width * 0.82 }
      })
      .setOrigin(0.5);
  }
}
