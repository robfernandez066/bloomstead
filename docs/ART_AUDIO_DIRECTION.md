# Art & Audio Direction v0.1

This document defines the practical visual and audio direction for the Bloomstead MVP before replacing placeholder graphics, improving UI, or adding sound/music. It is not final art production guidance.

## Visual North Star

Bloomstead should look cozy, soft, warm, and readable. The farm should feel magical and handmade, not industrial or factory-like. At rest, the screen should feel calm and low-stress; during rewards, it should feel juicy, bright, and satisfying without becoming chaotic.

## Color Direction

Use warm greens for the farm, soft soil browns for plots, cream UI panels, golden reward accents, and gentle magical glow colors for special feedback. Avoid harsh neon colors except for rare reward highlights.

## Isometric Farm Plot Direction

Plots should become readable isometric soil tiles. Unlocked plots should feel fertile and inviting. Locked or future plots should be subtle or hidden, not large gray debug tiles. Crop visuals must sit clearly on their own tile. Crop markers and circles were temporary placeholders and should not be the final read for crop state.

## Crop Art Direction

Each crop should eventually have at least a planted/growing state and a ready-to-harvest state.

* Sunwheat: small green shoots while growing, then a golden wheat bundle or bright grain tuft when ready.
* Carrot: leafy green tops while growing, then a visible orange carrot crown or clustered carrot top when ready.
* Glowberry: small vine or sprout while growing, then glowing berries with a gentle magical accent when ready.

Ready crops should look clearly harvestable without relying only on a circle marker.

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

Flour and Bread should get clear, readable icons for production output, inventory, and orders.

## UI Direction

UI should use rounded cream panels, soft borders, readable mobile text, large tap targets, and minimal clutter. Controls should be compact but understandable.

Onboarding guidance should feel unified and lightweight. The tutorial starts automatically on new saves and Dev Reset; the old Start button is no longer part of the intended experience. Only one tutorial or hint message should be visible at a time.

Craft guidance uses the existing tutorial/onboarding panel instead of a separate floating popup. When Craft becomes relevant, the player should see `Use Craft to turn Sunwheat into Flour.` and the Craft button should receive a clear but non-intrusive highlight. Opening Craft dismisses that guidance. Future polish may add a stronger arrow or pointer if the highlight is not enough.

Known UI backlog item: current sell buttons like `S +4c`, `C +12c`, and `G +32c` are functional but ugly. Future direction should use readable crop rows and/or icons:

* `Sunwheat x7 — Sell +4c`
* `Carrot x0 — Sell +12c`
* `Glowberry x0 — Sell +32c`

## Reward / Juice Direction

Reward moments should use coin bursts, floating reward text, small pops, light glow/pulse, HUD count-up, order completion bursts, level-up pops, and plot unlock pulses. Effects should make rewards feel good while preserving readability.

Known backlog item: the tutorial `Complete` button should feel satisfying. Future direction: show `+75 Coins`, animate coins flying to the coin counter, add a button pop/glow, and pulse or count up the coin HUD.

## Animation Principles

Animations should be quick, snappy, softly eased, and non-blocking. They should add dopamine without visual spam. Animation should reinforce clarity and never hide the gameplay state.

## Sound Effects Direction

First SFX list:

* Button tap
* Plant seed
* Crop ready
* Harvest
* Sell crop
* Coin gain
* XP gain
* Order complete
* Level up
* Plot unlock
* Disabled/error tap
* Tutorial complete
* Mill start
* Mill production complete
* Flour collect
* Bakery start
* Bakery production complete
* Bread collect

Style should be soft, bright, and cozy: small wooden taps, chimes, coin jingles, and gentle magical sparkles. Avoid harsh arcade sounds.

## Music Direction

Music should be a cozy magical farm loop with light plucked strings, soft bells, woodwinds, and gentle pads. It should be calm, loopable, and pleasant over long sessions. Music can come after first SFX hooks.

## First Art/SFX Implementation Pass

Recommended first pass:

* Improved plot tile art
* Simple crop sprites or generated crop shapes
* Improved crop sell UI
* Improved Craft button art/icon
* Stronger Craft pointer/arrow if needed
* Improved production status chip visuals/icons
* Improved Mill/Bakery menu/building placeholders
* Clear Flour and Bread icons
* Better processed-good/order onboarding if needed after playtesting
* Improved tutorial completion reward feedback
* Sound manager foundation
* Placeholder/generated or temporary SFX hooks only if no assets exist yet, including Mill/Bakery start/complete/collect hooks

## Out of Scope For First Art/Audio Pass

* Full character art
* Animals
* Town map
* Seasonal art
* Final music composition
* Cosmetic shop
* Large asset pack
* Complex particle systems
