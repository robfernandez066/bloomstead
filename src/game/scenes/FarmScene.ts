import Phaser from 'phaser';
import { FeedbackSystem } from '../ui/FeedbackSystem';
import { HudSystem } from '../ui/HudSystem';
import { SeedSelectorSystem } from '../ui/SeedSelectorSystem';
import { GameStateSystem } from '../systems/GameStateSystem';
import { GridSystem } from '../systems/GridSystem';
import { HarvestingSystem, type HarvestResult } from '../systems/HarvestingSystem';
import { PlantingSystem } from '../systems/PlantingSystem';
import { PlotStateSystem } from '../systems/PlotStateSystem';

type DragMode = 'none' | 'plant' | 'harvest';

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
    const plantingSystem = new PlantingSystem(gameStateSystem, plotStateSystem);
    const harvestingSystem = new HarvestingSystem(gameStateSystem, plotStateSystem);
    const feedbackSystem = new FeedbackSystem(this);
    let dragMode: DragMode = 'none';

    const hudSystem = new HudSystem(this, gameStateSystem);
    const seedSelectorSystem = new SeedSelectorSystem(this, gameStateSystem);
    let gridSystem: GridSystem;

    const handleHarvestResult = (harvestResult: HarvestResult): void => {
      gridSystem.refreshPlotVisuals();
      hudSystem.refresh();
      feedbackSystem.showHarvestFeedback(
        gridSystem.getPlotScreenPosition(harvestResult.plot),
        harvestResult.crop.name
      );

      if (harvestResult.xpResult.leveledUp) {
        seedSelectorSystem.refresh();
        feedbackSystem.showLevelUp(harvestResult.xpResult.currentLevel, width / 2, height * 0.28);
      }
    };

    gridSystem = new GridSystem(this, {
      tileWidth: 56,
      tileHeight: 28,
      originX: width / 2,
      originY: height * 0.38
    }, plotStateSystem.getPlots(), {
      onPlotPressed: (plot) => {
        const harvestResult = harvestingSystem.beginHarvest(plot);

        if (harvestResult !== null) {
          dragMode = 'harvest';
          handleHarvestResult(harvestResult);
          return;
        }

        if (plantingSystem.beginPaint(plot)) {
          dragMode = 'plant';
          gridSystem.refreshPlotVisuals();
          hudSystem.refresh();
          return;
        }

        dragMode = 'none';
      },
      onPlotDraggedOver: (plot) => {
        if (dragMode === 'harvest') {
          const harvestResult = harvestingSystem.harvestOver(plot);

          if (harvestResult !== null) {
            handleHarvestResult(harvestResult);
          }

          return;
        }

        if (dragMode === 'plant' && plantingSystem.paintOver(plot)) {
          gridSystem.refreshPlotVisuals();
          hudSystem.refresh();
        }
      }
    });

    gridSystem.render();

    hudSystem.render(18, 18, width - 36);

    this.input.on('pointerup', () => {
      plantingSystem.endPaint();
      harvestingSystem.endHarvest();
      dragMode = 'none';
    });

    this.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        plotStateSystem.refreshReadyStates();
        gridSystem.refreshPlotVisuals();
      }
    });

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
