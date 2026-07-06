# AGENTS.md — Bloomstead Project Instructions

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
* Crop inventory
* Seed purchasing
* Order board
* 5–10 basic orders
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
* Offline progress: crops grow offline.
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
