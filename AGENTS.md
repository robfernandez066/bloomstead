# AGENTS.md - Bloomstead Project Instructions

## Project Identity

This project is a mobile-first cozy fantasy farming optimization game currently called **Bloomstead**.

The game is being built as a browser prototype first, with the intent to wrap for mobile later.

Primary stack:

* Phaser
* TypeScript
* Vite
* Later mobile wrapper: Capacitor

## Product Direction

Bloomstead is a cozy fantasy farming optimization game. The player builds a magical farm by planting crops, harvesting fields, fulfilling village orders, earning coins and XP, unlocking new crops, expanding the farm, and eventually automating production.

The game should feel:

* Cozy
* Snappy
* Responsive
* Satisfying
* Low-stress
* Optimizable without becoming overwhelming

The player fantasy is:

> Build a tiny magical farm into a smooth, efficient, satisfying production machine.

## Design Pillars

1. Cozy surface, optimization underneath.
2. Passive optimization dopamine, not skill-based combos.
3. Snappy mobile interactions.
4. Small MVP first, then expand.
5. No hard energy system.
6. No crop withering.
7. No dragging goods between buildings.
8. No merge mechanics.
9. Avoid scope creep.

## MVP Scope

The MVP should include:

* One farm screen
* Isometric 2D farm grid
* 12 unlocked crop plots
* Three crops:
  * Sunwheat
  * Carrot
  * Glowberry
* Paint-mode planting
* Tap/swipe harvesting
* Crop growth timers
* Coins
* Crop and processed-good inventory
* Crop selling fallback
* Seed purchasing
* Order board
* MVP orders, including Baker's Flour, Fresh Bread, and level 3-5 advanced orders
* MVP production buildings: Mill and Bakery
* Flour and Bread as processed goods
* Lightweight tutorial/onboarding prompts
* Farm XP
* Farm level
* Crop unlocks
* Plot count upgrades
* Save/load
* Offline crop growth
* Basic particles
* Floating reward text
* Sound hook placeholders

The MVP should not include:

* Animals
* Fishing
* Combat
* Seasons
* Multiplayer
* Relationships
* Huge town map
* Complex crafting
* Worker AI
* Procedural maps
* Real-money store
* Daily events

## Current Gameplay Decisions

* Layout: hybrid long-term; crops use fixed grid, buildings/decorations may be placeable later.
* Camera: one-screen farm for MVP; no scrolling yet.
* Planting: paint mode in MVP.
* Smart replant: later.
* Crop death: never.
* Storage limits: not in MVP; add later.
* Orders: no deadlines in MVP; timed premium orders later.
* Order availability: active orders should not require crops above the current farm level.
* Offline progress: crops and production jobs progress offline.
* Starting coins: 100 coins for new game and Dev Reset.
* Crop selling: harvested crops can be sold using current crop sell values as a fallback for seed money.
* Crop sell UI: current readable text rows are functional for MVP; future art/UI polish can replace or augment them with icons.
* Production:
  * Mill recipe: 2 Sunwheat -> 1 Flour, 15 seconds.
  * Bakery recipe: 2 Flour -> 1 Bread, 30 seconds.
  * Flour and Bread are processed goods and are not plantable.
  * Production state is keyed by building/system id, currently `mill` and `bakery`.
  * Mill and Bakery can run independently at the same time.
  * Older single-Mill production saves migrate into the keyed production state.
  * Production continues offline.
  * Finished production loads as ready but does not auto-collect.
* Baker's Flour order: requires 2 Flour, rewards 90 coins and 20 XP, and is gated at farm level 2.
* Fresh Bread order: requires 1 Bread, rewards 130 coins and 30 XP, and is gated at farm level 3.
* Level 3-5 advanced MVP orders:
  * Glowberry Toast: requires 1 Bread and 2 Glowberry, rewards 210 coins and 42 XP, gated at level 3.
  * Harvest Lunchbox: requires 3 Sunwheat, 2 Carrot, and 1 Bread, rewards 180 coins and 36 XP, gated at level 3.
  * Baker's Basket: requires 2 Bread and 2 Flour, rewards 300 coins and 60 XP, gated at level 4.
  * Lanternberry Crate: requires 4 Glowberry and 2 Carrot, rewards 230 coins and 48 XP, gated at level 4.
  * Village Feast: requires 2 Bread, 4 Glowberry, and 4 Carrot, rewards 420 coins and 85 XP, gated at level 5.
* The level 3-5 order pass added no new crops, goods, production buildings, tutorial steps, save/load changes, or UI systems.
* Starting plot layout: 3x4 centered crop bed, 12 unlocked plots.
* Plot upgrades should preserve a uniform rectangular crop bed:
  * Start: 3x4 crop bed, 12 plots.
  * Upgrade 1: 4x4 crop bed, unlocks 4 plots.
  * Upgrade 2: 5x4 crop bed, unlocks 4 plots.
  * Upgrade 3: 6x4 crop bed, unlocks 4 plots.
* The final MVP plot upgrade unlocks 4 plots, not 8.
* Tutorial/onboarding:
  * Starts automatically on new saves and Dev Reset; do not reintroduce a Start button.
  * Includes a sell-crop step after the first plot upgrade.
  * Uses pulsing highlights on the actual target instead of generic line/circle indicators.
  * Requires planting the full starter Sunwheat field.
  * Waits for all starter Sunwheat to be harvested before moving to the first order step.
  * Tutorial completion still grants a one-time 75 coin reward.
  * Tutorial completion reward feedback has improved visibility.
  * Tutorial and hint guidance should be unified so only one tutorial/hint message is visible at a time.
  * Craft onboarding is part of the tutorial flow: open Craft, start the Mill, wait for Flour, tap `Mill Ready`, collect Flour, start another Mill job, tap outside to close the Production menu, then complete the tutorial.
* Plot upgrade tutorial safety:
  * Plot upgrades are locked until the tutorial reaches the upgrade step.
  * The upgrade action is labeled `Purchase More Plots`.
  * Plot upgrade purchases use a `Yes / No` confirmation.
* Empty unlocked plots appear as brown dirt, not green.
* MVP stabilization status:
  * Tutorial auto-start, unified tutorial/hint behavior, Craft guidance, save/load, offline production, mobile portrait layouts, and legacy single-Mill production save migration have passed focused QA.
  * Mobile portrait QA passed at 390x844 and 360x740.
  * Sell/inventory rows and compact production chips received a small MVP mobile usability polish pass and passed QA at 360x740 and 390x844.
  * Very small phones and future added goods should still be watched, but sell rows and production chips are not an active MVP blocker.
  * Landscape is not ideal, but the layout recovers when returning to portrait.
  * Level 3 pacing is acceptable; level 4 pacing is acceptable but slightly fast; level 5 was reached and felt like a natural milestone.
  * Bread-heavy order clusters and Baker's Basket generosity are watch items, not current MVP blockers.
  * Build passes with only the existing Vite large chunk warning.
* Strategy level: 6/10.
* Randomness: some randomness later, not core MVP.

## MVP Crop Data

Initial placeholder crop tuning:

| Crop      | Unlock Level |  Grow Time | Seed Cost | Harvest Yield | Sell Value | XP |
| --------- | -----------: | ---------: | --------: | ------------: | ---------: | -: |
| Sunwheat  |            1 | 10 seconds |   2 coins |             1 |    4 coins |  1 |
| Carrot    |            2 | 30 seconds |   5 coins |             1 |   12 coins |  3 |
| Glowberry |            3 | 90 seconds |  12 coins |             1 |   32 coins |  8 |

These values are placeholders and may be tuned later.

## Coding Rules

* Use TypeScript.
* Prefer simple, readable code over clever abstractions.
* Keep systems modular.
* Do not add features outside the current task.
* Do not make product/design decisions unless explicitly asked.
* If a task is ambiguous, choose the smallest reasonable implementation and note the assumption.
* Do not install extra libraries unless the task explicitly requires them or there is a strong reason.
* Avoid large rewrites unless specifically requested.
* Keep mobile-first interaction in mind.
* Use clear filenames and folder structure.
* Do not hardcode large amounts of game data inside scene files.
* Put reusable game data in config/data files.
* Put reusable logic in systems/managers/helpers.

## Preferred Folder Direction

Use a structure similar to:

src/
main.ts
game/
scenes/
BootScene.ts
PreloadScene.ts
FarmScene.ts
systems/
data/
models/
ui/
utils/
managers/
save/

This can evolve as needed, but keep responsibilities separated.

## Scene Responsibilities

BootScene:

* Minimal startup work.
* Prepare game configuration if needed.

PreloadScene:

* Load assets.
* Use placeholders if final art is unavailable.

FarmScene:

* Main playable farm screen.
* Should coordinate systems, not contain all logic directly.

## Data Rules

Crop data should live outside the scene logic.

Order data should live outside the scene logic.

Upgrade data should live outside the scene logic.

Production/building data should live outside the scene logic.

Avoid scattering tuning numbers throughout the codebase.

## Testing / Validation Expectations

After each task, verify at minimum:

* The project builds.
* The game runs in browser.
* Existing functionality still works.
* No TypeScript errors.
* No console errors caused by the change.

When possible, run:

npm install
npm run dev
npm run build

If scripts differ, inspect package.json and use the correct available scripts.

## Communication Rules

When completing a task, summarize:

1. What changed.
2. Files modified.
3. How to test it.
4. Any assumptions made.
5. Any issues or follow-up tasks.

Do not present unfinished work as complete.
