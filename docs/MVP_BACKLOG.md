# MVP Backlog

## Current MVP Gameplay

Bloomstead currently starts new games and Dev Reset saves with 100 coins.

The MVP includes:

* Planting, crop growth, harvesting, inventory, coins, XP, and farm levels.
* Three crops: Sunwheat, Carrot, and Glowberry.
* A 3x4 starting crop bed with rectangular plot upgrades to 4x4, 5x4, and 6x4.
* Level-aware order availability:
  * Level 1 orders should only require Sunwheat.
  * Level 2 orders may require Sunwheat and Carrot, plus the Flour order.
  * Level 3+ orders may use any MVP crop, Bread, and mixed crop/processed-good requirements.
  * Level 4+ orders add larger Bread/Flour and Glowberry goals.
  * Level 5 includes the Village Feast capstone MVP order.
* Crop selling as a fallback way to regain seed money.
* Readable crop sell/inventory rows for each MVP crop, with simple generated item icons.
* A compact read-only processed-goods strip near Craft/production shows Flour and Bread counts with generated icons and text labels.
  * The strip appears once Craft/production is relevant, the tutorial is completed, or Flour/Bread counts are nonzero.
  * It stays hidden during the early tutorial to avoid clutter.
  * It updates after collecting Flour/Bread, after Flour/Bread are spent, and on save/load.
  * Crop sell rows are unchanged and still sell crops only; Flour and Bread are not sellable from this strip.
  * With two active production chips, the strip hides to avoid crowding.
* MVP production buildings:
  * Mill: `2 Sunwheat -> 1 Flour`, 15 seconds per Flour.
  * Bakery: `2 Flour -> 1 Bread`, 30 seconds per Bread.
  * Flour and Bread are processed goods, not plantable crops.
  * Production state is keyed by building/system id, currently `mill` and `bakery`.
  * Mill and Bakery can run independently at the same time.
  * Each building still runs only one active job at a time.
  * Mill and Bakery support batch production quantities from the `Production` menu.
  * Batch quantity uses a whole-number slider, `Max` button, and `Start` button.
  * Batch quantity is capped by available ingredients and a max batch size of 10.
  * Ingredients are consumed upfront when a batch starts.
  * Batch production is partial-ready incremental: some output can become claimable while the rest continues producing.
  * Collecting partial output does not stop the remaining production.
  * Older single-Mill production saves migrate into the keyed production state.
  * Older production saves without `quantity` / `collectedQuantity` default safely to `quantity: 1` and `collectedQuantity: 0`.
  * Production continues offline.
  * Save/load and offline production preserve quantity, collected quantity, ready output, and active progress.
  * Finished production loads as ready but does not auto-collect.
  * Farm screen production uses a compact `Craft` button.
  * Full production details live in the `Production` menu.
  * Farm screen production status uses compact chips only while a job is producing or ready.
  * Idle production systems should not take farm-screen space.
  * Tapping a production status chip opens the `Production` menu.
  * Tapping outside the `Production` menu closes it.
  * Production status wording uses player-facing labels such as `Status: Producing Flour x4`, `Status: Ready Flour x1 | Producing x3`, and `Status: Ready Flour x2`.
  * Farm chips use compact labels and a cleaned-up timer layout so timers stay inside the chip.
  * Starting Mill/Bakery production shows a brief ingredient icon fly/pulse toward the production/status area and keeps the existing `Mill Started` / `Bakery Started` text.
  * Collecting Flour/Bread shows the actual collected amount, such as `+1 Flour`, `+3 Flour`, or `+1 Bread`, with the output icon moving toward the processed-goods/status area.
  * Partial-ready batch collection feedback uses only the amount actually collected, not the full batch quantity.
* Harvest-to-inventory feedback when crops are collected.
* Order completion coin/XP fly-to-HUD reward feedback.
* Swipe harvesting aggregate `Gathered X Crop` text to reduce clutter.
* Accidental replant protection after harvest:
  * After a successful harvest, empty-plot planting is silently suppressed for 400ms.
  * Harvesting other ready crops and tapping UI buttons still work during the suppression window.
  * Suppressed planting spends no coins and does not change the selected seed.
  * Deliberate planting works normally after the short delay.
* Save/load, active order persistence, and offline crop growth.
* Tutorial flow that starts automatically on new saves and Dev Reset, with target-specific pulsing highlights and a sell-crop step after the first plot upgrade.
* One-time 75 coin tutorial completion reward with improved visible reward feedback.
* Craft onboarding is part of the tutorial flow and guides the player through making Flour in the Mill.

Current MVP processed-good and advanced orders:

* Baker's Flour: requires 2 Flour, rewards 90 coins and 20 XP, gated at farm level 2.
* Fresh Bread: requires 1 Bread, rewards 130 coins and 30 XP, gated at farm level 3.
* Glowberry Toast: requires 1 Bread and 2 Glowberry, rewards 210 coins and 42 XP, gated at farm level 3.
* Harvest Lunchbox: requires 3 Sunwheat, 2 Carrot, and 1 Bread, rewards 180 coins and 36 XP, gated at farm level 3.
* Baker's Basket: requires 2 Bread and 2 Flour, rewards 300 coins and 60 XP, gated at farm level 4.
* Lanternberry Crate: requires 4 Glowberry and 2 Carrot, rewards 230 coins and 48 XP, gated at farm level 4.
* Village Feast: requires 2 Bread, 4 Glowberry, and 4 Carrot, rewards 420 coins and 85 XP, gated at farm level 5.

## Tutorial Notes

The tutorial starts automatically on new saves and Dev Reset. The old tutorial `Start` button has been removed.

Tutorial guidance now uses pulsing highlights on the actual target the player should tap instead of generic line/circle indicators. Plot steps pulse the starter crop bed, the first order step pulses the `Sunwheat Sack` order card, production steps pulse Craft/Mill controls, and the final step pulses the tutorial completion panel.

The tutorial teaches the core loop in this order: plant the full starter Sunwheat field, wait for crop, harvest all starter Sunwheat, complete the first order, buy the first plot upgrade, sell a crop, use Craft to make Flour, start another Mill job, close the Production menu, then complete the tutorial.

Plot upgrades are locked until the tutorial reaches the upgrade step. The upgrade action is labeled `Purchase More Plots`, shows the price, and uses a `Yes / No` confirmation before spending coins.

Empty plots now appear as brown dirt instead of green, while growing and ready crops remain visually distinct.

The final tutorial completion reward is 75 coins, has clearer visible reward feedback, and must only be granted once per save. Dev Reset clears the save, so the reward can be earned again from a fresh start.

Tutorial and hint guidance should be unified: only one tutorial/hint message should be visible at a time.

Craft onboarding is integrated into the tutorial flow:

* Open Craft.
* Start Mill production: `2 Sunwheat -> 1 Flour`; tutorial Craft onboarding keeps Mill quantity simple and locked to 1.
* Wait for Flour.
* Tap the `Mill Ready` chip.
* Collect Flour.
* Start another Mill production job.
* Tap outside the Production menu to close it.
* Complete the tutorial.

## MVP Stabilization Notes

Recent focused QA passes have verified the current tutorial, production, save/load, mobile usability, and legacy production migration behavior for MVP.

Latest smoke QA checkpoint after the ready-crop color, production feedback, batch production, and upgrade panel completion API fixes:

* Empty/harvested plots return to brown dirt.
* Growing crop plots remain darker green.
* Ready/finished crop plots now use light green and remain readable at mobile size.
* Plot upgrade flow still uses `Purchase More Plots`, clear price display, and a `Yes / No` confirmation.
* The upgrade panel safely handles the no-upgrades-remaining state with a brief, non-blocking `All plots purchased` completion notice.
* Batch production, partial-ready collection, production start/collect feedback, and the processed-goods strip passed smoke QA.
* Mobile smoke QA passed at `390x844` and `360x740`.
* Build passes with only the existing Vite large chunk warning.

Batch-enabled pacing QA checkpoint:

* Batch production pacing QA passed with no code changes.
* An efficient automated run reached level 5 in about 5.7 minutes.
* Level 2 was fast but good for onboarding.
* Level 3 felt acceptable.
* Level 4 was brisk but still required crops and production.
* Level 5 was fast in automation but coherent.
* Batch production feels like convenience, not a loop skip.
* Partial-ready production is understandable during normal play.
* Mobile layout passed at `390x844` and `360x740`.
* Build passes with only the existing Vite large chunk warning.
* No tuning changes are recommended yet based only on efficient automated play.

Verified behavior:

* Tutorial guidance auto-starts on new saves and Dev Reset.
* The old tutorial `Start` button has been removed.
* Only one tutorial/hint panel should be visible at a time.
* Tutorial guidance uses pulsing highlights on exact targets instead of generic indicators.
* Tutorial requires the full starter Sunwheat field to be planted and harvested before moving to the first order step.
* Plot upgrades are locked until the tutorial reaches the upgrade step.
* The plot upgrade action is `Purchase More Plots` and uses a `Yes / No` confirmation.
* Empty plots use a brown dirt visual.
* Craft onboarding is part of the tutorial flow and guides the player through opening Craft, starting the Mill, waiting for Flour, tapping `Mill Ready`, collecting Flour, starting another Mill job, closing the Production menu, and then completing the tutorial.
* Mill and Bakery production work independently and can run at the same time.
* Mill and Bakery batch production controls are implemented with a whole-number slider, `Max` button, and capped batch size of 10.
* Batch jobs consume ingredients upfront and can expose partial-ready output while the rest of the batch continues producing.
* Partial output collection grants only the ready amount and does not stop remaining production.
* Save/load and offline production preserve `quantity`, `collectedQuantity`, ready output, and active progress.
* Offline finished production loads as ready and does not auto-collect.
* Older production saves without `quantity` / `collectedQuantity` default safely to `quantity: 1` and `collectedQuantity: 0`.
* Older single-Mill saves migrate safely into keyed production state under `mill`, with `bakery` initialized normally.
* Tutorial Craft onboarding keeps the required Mill production quantity locked to 1.
* Mobile portrait QA passed at `390x844` and `360x740`.
* Sell/inventory rows and compact production chips received a small MVP mobile usability polish pass and passed QA at `360x740` and `390x844`.
* The processed-goods visibility strip for Flour/Bread passed mobile QA at `390x844` and `360x740`.
* The 400ms post-harvest planting suppression passed manual QA at `390x844` and `360x740`.
* Simple generated icons for Sunwheat, Carrot, Glowberry, Flour, and Bread appear in sell/inventory rows, order requirements, and production recipe inputs/outputs.
* Sell row text overflow from icon spacing was addressed with tighter spacing and label sizing.
* Farm plot crop visuals now distinguish Sunwheat, Carrot, and Glowberry.
* Carrot visual style is aligned between farm plots and shared menu/order icons.
* The item-icon and farm-plot crop visual clarity pass passed mobile QA at `390x844` and `360x740`.
* Build passes with only the existing Vite large chunk warning.
* The item-icon and crop-visual pass changed no gameplay behavior.
* Production batch controls, partial-ready collection, status wording, compact chip timer layout, save/load defaults, and old-save migration build successfully.
* Production start/collect feedback passed QA: processed-goods counts updated after collection, no duplicate inventory rewards were found, tutorial Craft onboarding still worked with Mill quantity locked to 1, and mobile QA passed at `390x844` and `360x740`.
* The level 3-5 MVP order content pass is complete using only existing crops, Flour, and Bread.
* The level 3-5 order pass added no new crops, processed goods, production buildings, tutorial steps, save/load changes, or UI systems.
* Level 3 pacing is acceptable.
* Level 4 pacing is acceptable, though slightly fast.
* Level 5 was reached and felt like a natural milestone.

Current caveats:

* Sell rows and production chips are acceptable for MVP, but very small phones and future added goods should still be watched.
* The processed-goods strip is an MVP visibility fix, not a full inventory system; a future inventory drawer remains deferred polish only.
* Landscape layout is not ideal, but the UI recovers when returning to portrait.
* Bread-heavy order clusters and Baker's Basket generosity are watch items, not current MVP blockers.
* Goods shown in ready production chips are not spendable until collected; watch for player confusion, but this is not a current blocker.

## Implemented MVP UI / Game Feel Polish

The following polish items are implemented for the MVP:

* Crop sell/inventory rows now use readable crop names and counts, such as `Sunwheat x7` with `Sell +4c`.
* Simple generated item icons now support Sunwheat, Carrot, Glowberry, Flour, and Bread.
* Item icons appear in sell/inventory rows, order requirements, and production recipe inputs/outputs.
* Farm plot crop visuals now make Sunwheat, Carrot, and Glowberry visually distinct while preserving existing growth and harvest behavior.
* Harvested crops show visual feedback moving toward the crop inventory/sell area.
* Order completion now includes coin and XP fly-to-HUD reward feedback.
* Production start feedback now uses a brief ingredient icon fly/pulse and `Mill Started` / `Bakery Started` text.
* Production collect feedback now shows the actual collected amount, such as `+1 Flour`, `+3 Flour`, or `+1 Bread`, and moves the output icon toward the processed-goods/status area.
* Swipe harvesting now uses aggregate `Gathered X Crop` text instead of many separate `+1 Crop` popups.
* The tutorial `Complete` button now has basic reward juice for the one-time 75 coin reward, including reward text, generated coin fly feedback, and a coin HUD pulse.

## UI / Art Polish Backlog

The current crop sell/inventory rows are readable, functional, and include simple generated icons. They have passed MVP tap-comfort checks at `390x844` and `360x740`.

The current Flour/Bread processed-goods strip is readable, functional, and read-only. It is intentionally not an inventory drawer and does not add Flour/Bread selling.

In a future UI/art polish pass, replace generated placeholder icons and text rows with final readable art and a more polished row layout:

* `Sunwheat x7 - Sell +4c`
* `Carrot x0 - Sell +12c`
* `Glowberry x0 - Sell +32c`

Future production polish:

* The old full-width Mill farm-screen panel was replaced by the compact Craft button, Production menu, and status chip pattern.
* Use this Production menu/status chip pattern for future systems such as Bakery, Press, Brewery, etc.
* Give the Craft button/icon proper art so it reads clearly as production/crafting.
* Add a stronger visual pointer or arrow for Craft if playtesting shows the highlight is not enough.
* Production status chips have MVP tap-target polish, but future art passes can still add clearer visuals and icons.
* Production start/collect feedback is implemented for MVP; future polish can still improve final animation timing, easing, and art direction.
* Replace placeholder Mill/Bakery/menu visuals with clear production building/UI art.
* Replace generated Flour and Bread placeholder icons with final icons for inventory, orders, and production output.
* Replace generated crop plot visuals with final crop sprites or polished generated shapes.
* Improve processed-good and order onboarding later if Flour/Bread order goals are not obvious enough.
* Add SFX hooks/assets for Mill/Bakery start, production complete, and collect.
* Future production chains may expand from this pattern, but should stay simple and modular.

* Later, add a satisfying coin sound and light haptic feedback when mobile support exists.

## Scope Guardrails

Do not add storage, additional machines, workers, research, new crops, sound assets, haptics, daily rewards, monetization, or new gameplay systems unless explicitly requested.
