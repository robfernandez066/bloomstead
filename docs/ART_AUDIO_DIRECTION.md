# Art & Audio Direction v0.1

This document defines the practical visual and audio direction for the Bloomstead MVP before replacing placeholder graphics, improving UI, or adding sound/music. It is not final art production guidance.

## Visual North Star

Bloomstead should look cozy, soft, warm, and readable. The farm should feel magical and handmade, not industrial or factory-like. At rest, the screen should feel calm and low-stress; during rewards, it should feel juicy, bright, and satisfying without becoming chaotic.

## Color Direction

Use warm greens for the farm, soft soil browns for plots, cream UI panels, golden reward accents, and gentle magical glow colors for special feedback. Avoid harsh neon colors except for rare reward highlights.

## Isometric Farm Plot Direction

Plots should become readable isometric soil tiles. Unlocked plots should feel fertile and inviting. Locked or future plots should be subtle or hidden, not large gray debug tiles. Crop visuals must sit clearly on their own tile. The MVP now uses brown dirt for empty/harvested plots, darker green for growing plots, and light green for ready/finished crop plots. Simple generated crop shapes on farm plots make Sunwheat, Carrot, and Glowberry read differently; final crop art remains future polish.

## Crop Art Direction

Each crop should have at least a planted/growing state and a ready-to-harvest state. The MVP currently uses simple generated shapes:

* Sunwheat: small green shoots while growing, then a golden wheat bundle or bright grain tuft when ready.
* Carrot: leafy green tops while growing, then a visible orange carrot crown or clustered carrot top when ready.
* Glowberry: small vine or sprout while growing, then glowing berries with a gentle magical accent when ready.

Ready crops should look clearly harvestable without relying only on a circle marker. Future art can replace the generated shapes with final sprites or more polished generated art.

## Production Building Direction

The MVP now includes the Mill and Bakery as the first production buildings. Their current UI is functional placeholder art.

The current production UI pattern is:

* Farm screen has a compact `Craft` button.
* Full production details live in the `Production` menu.
* Farm screen shows compact production status chips only when a job is producing or ready.
* Idle production systems should not take farm-screen space.
* Tapping a production chip opens the `Production` menu.
* Tapping outside the `Production` menu closes it.

Use this pattern for future production systems such as Press, Brewery, etc. Future Mill and Bakery art should read as cozy small farm buildings or workbenches, not industrial factory machinery. They should support simple chains without implying a large crafting system:

* Mill: `2 Sunwheat -> 1 Flour`
* Bakery: `2 Flour -> 1 Bread`

Flour and Bread have simple generated MVP icons for production output, inventory, and orders. Final icons remain future art polish.

## UI Direction

UI should use rounded cream panels, soft borders, readable mobile text, large tap targets, and minimal clutter. Controls should be compact but understandable.

Onboarding guidance should feel unified and lightweight. The tutorial starts automatically on new saves and Dev Reset; the old Start button is no longer part of the intended experience. Only one tutorial or hint message should be visible at a time.

Craft guidance uses the existing tutorial/onboarding panel instead of a separate floating popup. When Craft becomes relevant, the player should see `Use Craft to turn Sunwheat into Flour.` and the Craft button should receive a clear but non-intrusive highlight. Opening Craft dismisses that guidance. Future polish may add a stronger arrow or pointer if the highlight is not enough.

Readable crop sell/inventory rows are implemented for MVP. They include simple generated icons and should stay clear and mobile-tappable, using crop names, counts, and sell values:

* `Sunwheat x7 - Sell +4c`
* `Carrot x0 - Sell +12c`
* `Glowberry x0 - Sell +32c`

Generated icons are implemented for Sunwheat, Carrot, Glowberry, Flour, and Bread. They appear in sell/inventory rows, order requirements, and production recipe inputs/outputs. Final art assets can replace these generated icons later without changing gameplay.

Order cards now include compact `From: X` source labels and simple generated source icons for cozy village flavor. Current source groups are Farm Stand, Village Market, Village Cook, Baker, and Lantern Guild. Source labels should stay visually secondary to order names. Order requirement item/material names use a warm accent color while quantities remain in the normal readable text color; Production menu recipe material names use the same accent treatment. This is flavor/readability only: order requirements, rewards, level gates, rotation, pacing, tutorial behavior, production behavior, and save/load behavior remain unchanged. Final order-board art, more polished source icons, villager/customer portraits, and order SFX remain future polish.

## Reward / Juice Direction

Reward moments should use coin bursts, floating reward text, small pops, light glow/pulse, HUD count-up, order completion bursts, level-up pops, and plot unlock pulses. Effects should make rewards feel good while preserving readability.

Basic tutorial `Complete` reward feedback is implemented for MVP: the one-time 75 coin reward has clear reward text, generated coin fly feedback, and a coin HUD pulse. Stronger coin animation and sound effects remain future polish.

Production start/collect feedback is implemented for MVP. Starting Mill/Bakery production shows a brief ingredient icon fly/pulse toward the production/status area while keeping the existing `Mill Started` / `Bakery Started` text. Collecting Flour/Bread shows the actual collected amount, such as `+1 Flour`, `+3 Flour`, or `+1 Bread`, and moves the output icon toward the processed-goods/status area. Partial-ready batch collection uses only the amount actually collected. Future polish can improve final animation timing, final art assets, and real SFX without changing production behavior.

## Animation Principles

Animations should be quick, snappy, softly eased, and non-blocking. They should add dopamine without visual spam. Animation should reinforce clarity and never hide the gameplay state.

## Sound Effects Direction

Selected staged audio assets are integrated for MVP feedback, with generated WebAudio tones kept as safe fallbacks when an asset is missing or blocked. The audio system creates/resumes `AudioContext` lazily during playback, respects the saved Sound toggle before attempting SFX, and fails silently if a browser blocks audio.

Current SFX coverage:

* Button tap
* Plant seed
* Crop ready
* Harvest
* Order complete
* Level up
* Plot unlock
* Disabled/error tap
* Tutorial complete
* Production start
* Production collect

The MVP audio pass now uses real staged assets for button taps, planting, harvesting, coin-style rewards, fanfare/reward moments, and level-up moments. Generated fallback tones still cover missing hooks such as crop ready and disabled taps. Harvest keeps spam protection with pitch/rate variation during rapid harvesting, production collect plays once per collect action including batch and partial-ready collects, and repeated XP/sell tones remain intentionally quiet or silent to avoid spam.

Style should stay soft, bright, and cozy: small wooden taps, chimes, coin jingles, and gentle magical sparkles. Avoid harsh arcade sounds. The current selected assets are acceptable MVP placeholders; final authored/mixed SFX remain future polish.

## Music Direction

Music should be a cozy magical farm loop with light plucked strings, soft bells, woodwinds, and gentle pads. The MVP now includes a single staged looping farm music track with a saved Music toggle. Final music composition and mixing remain future polish.

## Future Art/SFX Polish Pass

Future polish should improve presentation without changing MVP gameplay scope:

* Improved plot tile art
* Final crop sprites or more polished generated crop shapes
* Final crop and processed-good icons for inventory, selling, production, and orders
* Final order-board source icons and flavor art
* Optional villager/customer portraits if they stay readable on mobile
* Improved Craft button art/icon
* Stronger Craft pointer/arrow if needed
* Improved production status chip visuals/icons
* Improved Mill/Bakery menu/building placeholders
* Better processed-good/order onboarding if needed after playtesting
* Better final timing/easing for Mill/Bakery production start and collect feedback
* Stronger tutorial completion reward animation and audio polish
* Replace staged placeholder audio with final authored SFX for production, order, harvest, level-up, tutorial, and UI hooks
* Replace staged placeholder music with final loopable composition if playtesting supports it
* Better final audio mixing/timing, advanced settings, and optional haptics after MVP

## Out of Scope For First Art/Audio Pass

* Full character art
* Animals
* Town map
* Seasonal art
* Final music composition
* Cosmetic shop
* Large asset pack
* Complex particle systems
