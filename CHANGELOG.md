# Changelog

Every public Windows beta, newest first. Player-facing changes only; the development detail lives in
`DEVELOPMENT_LOG.md` and `docs/ITERATIONS.md`.

## 0.1.5-beta.1 — Smooth frames, six gates and Android (2026-11-28)

**A smoother engine, on the devices children actually use.** The island dressing no longer asks the
GPU to draw every leaf, stone, flower and keepsake one at a time. Static scenery is baked into a few
merged meshes, the leaf and frost doors bake their frames, curios bake everything that does not move,
and only the island being explored stays in the scene graph. In the meadow's opening view that took
the frame from 203 draw calls and 168k triangles to 61 calls and 110k triangles; a deliberately busy
Grove view fell from 887 calls to 699. Render resolution now starts at a sane 1.5× instead of up to
2× and adapts down in 10% steps after a sustained slow patch, then back up when there is headroom.
MSAA is off on touch devices, where high-DPI screens hide the jaggies and the fill-rate cost is real.

**Android beta.** The same offline game now ships as a landscape, fullscreen Android APK built with
Capacitor. Touch controls, the adaptive resolution and reduced-motion setting are unchanged. This is
a debug-signed sideload build, not a Play Store upload; it has not run on a physical phone yet.

**Words and numbers that move the world.** Six places now answer to what a child knows, not to a
sign. They are built into the islands as real things, not floating questions, and every one can be
re-read, re-heard and tried again forever.

- **The Sleepy Bramble** (Letterleaf Grove) — a curtain of bramble across a glade will not open until
  someone reads the word on the standing stone. Pip says the word slowly and sounds it out; three
  carved stones wait nearby. Zap *moss* and the bramble pulls back into the arch for good.
- **The Lily Crossing** (Tallybrook Falls) — five stepping stones sleep under a pond, and six lilies
  float on it. Count the flowers, then zap the stone that says how many: the stones rise one after
  another into a path you can walk. Pip deliberately does not say the number.
- **The Listening Path** (Storysong Glade) — a rune path lies dark until a child matches the croak
  they hear to the friend who made it. The frog, the chick and the owl are carved in stone; the right
  one wakes six runes one at a time and lights the path.
- **The Sky Stair** (Pattern Peaks) — a row of tiles carries a pattern the world repeats in its crystals
  and moon. Step on the matching choice stones in order: the deck rises and only then reaches a shelf
  with a shrine, a crystal and a pocket of sky that cannot be reached any other way.
- **The Great Shell** (Pebblecount Cove) — three pebbles on one plinth and two on another; the shell
  answers only to the numeral that means five. Its valves creak open into a tidepool nook with its own
  creature.
- **The Moonword** (Lantern Hollow) — a word is carved on the moonstone. Say *moon* to the right stone
  and the moth curtain shivers up into the lintel, opening a moon garden behind it.
- **The bramble now opens somewhere.** The Grove's Sleepy Bramble no longer lifts onto bare grass: a
  hedge ring hides a small pocket with a seat, flowers and a Bramble Puff, and the curtain is the only
  way in.

Wrong stones never fail a child: the stone flickers, Pip repeats the sound or the hint, and after a
few misses the wrong choices dim one by one until only the answer and one friendlier stone are left.
Solving one is worth 8 sparkles, one sound, one line and a saved world that stays changed. The three
new rules live in `src/game/worldPuzzles.js`, and the places themselves are authored in
`src/world/puzzleArt.js`.

**Lantern Hollow: the first place you unlock.** Walk to the arch on the west edge of Sunbeam Meadow
and you will find it asleep under a curtain of bramble, with no shimmer over it and no beacon in the
sky. Make a wish at the arbor — a real one, carried up from the garden — and the bramble opens for
good: the arch lights, Pip says one line, and a whole second island is there to walk into. It is not
a menu; it is a path that was always there.

Inside, the meadow's blue afternoon becomes a violet dusk. A still pond holds moonpetal flowers and an
old lantern tree on its islet, a stone walk of six paper lanterns curves down from the landing, a
stream crosses the middle on stepping stones and moths drift in the warm light. Two things are out
there for a child who wanders: a **Moon Moth Lantern** in a quiet corner you could easily walk past,
and a **Ferny Music Box** behind a curtain of sleepy ferns that the Leafwhisk sips away. Both save, and
both stay taken. Nothing is timed, counted or graded in the hollow; it is a place to be.

**The Leafwhisk: a second tool.** The hollow now has two things in your hands, and a small chip
beside the sparkle counter shows which one is out. The **Starbolt** is the blaster you know. The
**Leafwhisk** is new: point it at a drift of leaves and hold the zap button, and the leaves lift off
the ground and swirl into the glowing nozzle with a soft whoosh that grows as more of them arrive.
When the drift is empty it pops out a little ribboned bundle, and Pip keeps it safe by the shelf.

- Switch with **Q**, a **right-click**, the **🌀 button** on a touchscreen, or **B** on a gamepad.
- Nothing is lost or timed: the drift gathers itself back a little later, and the whisk works as
  often as you like. The first bundle of each play session is worth a few sparkles.
- Calm motion makes the leaves fly straight and holds the whisk still.

**Two secret doors.** Two of the Hollow's hidden keepsakes now sleep behind a little door you open
with a tool you already carry: hold the Leafwhisk at a curtain of sleepy leaves and sip it away in the
grove, or ring a frost bell with a bolt in the peaks and watch the veil melt. Both doors stay open
once you have opened them, and Pip tells you which tool each one wants.

**A moon with real phases.** The Moon Arbor's moon is no longer just a small ball: each wish carves a
true crescent, then a half moon, then a gibbous, then a full round face, then a dark new moon with a
cool halo, and the lanterns stay warm the whole way round. You can see the shape change from the
garden path, and the fireflies you called stay where they are.

**The moon keeps turning.** The Moon Arbor's moon now changes with every wish you make: full and
round at first, then a little waning, then half, then a thin crescent, then a dark new moon with a cool
blue halo, and round again. The lanterns stay cosy and warm the whole way round, and the fireflies you
called stay exactly where they are. Keep whisking for as long as you like — the sky above the arbor
always has something new to show you.

**The Moon Arbor.** When Pip's flower bed, sun bowl and lantern post are all full, look behind
them: there is an arbor waiting, with six paper lanterns hanging dark. Every bundle you bring after
the garden is full hangs one light, and when the sixth goes up the arbor wakes — a moon moth moves in
and lives there, fluttering under the arch. After that the arbor takes your gifts as wishes: each one
sends up a firefly to join the little constellation. It never says no and never fills up, so gathering
always has somewhere to go, and nothing is ever counted at you.

**Pip's garden.** Everything you whisk now has somewhere to go. On the meadow path, just off the
lantern row, Pip has been digging a little garden with three spots: a flower bed, a stone bowl and a
lantern post. Aim at one and zap, and the bundle in your basket becomes something you can see: posies
bloom into three bushes and bring a butterfly, sun puffs warm the bowl until it glows and crackles,
and mote lanterns light one hanging lantern at a time until the post is a small constellation. Each
spot takes three, so there is always a next one to look forward to; when a spot is full Pip says so and
keeps your bundle for another day. The basket sits beside your tool chip and only appears when it has
something in it. Nothing is lost, nothing is timed and none of it is needed to finish the story.

**Every world has something to whisk.** The grove grows a **windflower patch** that sends petals
fluttering into the nozzle and pops out a ribboned posy. The falls and the peaks keep **dust vents** —
a ring of stones round a warm golden glow — and gathering one puffs out a little sun-warmed cloud. The
words cliffs and the cove have **glow-mote perches**: driftwood hung with sea glass, where the motes
spiral in and come back out as a tiny lantern. Each family says hello once per play session, then
keeps working forever; nothing is lost, nothing is timed, and every patch grows back by itself.

**The hollow is full of curious things.** Every island now hides two bits of
scenery that answer when you play with them. A **leaf drift** bursts into a
swirl of leaves when you zap it (there are usually a few sparkles underneath),
and gathers itself back a little later. A **sun crystal** rings like a tiny bell
— three glassy notes — and grows back. A **listening stone** is quieter: stand
close and look at it, and its carved rune lights up while it tells you a true
little fact, like "A snail carries its little house on its back."

- Sparkles are a small hello the first time you play with each one; nothing is
  lost, nothing is timed, and the drift and crystal come back by themselves.
- The listening stone will tell you its fact as often as you like.
- Everything uses the zap and the looking you already do — no new buttons on any
  device.

**The meadow tells you when it grows.** Every time a keepsake brings a new
lantern, flagstone, pennant, flag, planter bloom or moonwell stone, that thing
answers on the spot: a soft glow and a little rising ribbon of light, its own
warm four-note chime (quite different from the keepsake sparkle), and a line
from Pip that names exactly what grew — "The planter for Tallybrook Falls is in
full bloom!" While there are still keepsakes out there, the same line adds a
gentle "The far lanterns are still sleeping."

- The flourish only happens when something really grew. Coming back to a
  meadow you already grew, or picking up ordinary sparkles, stays quiet — no
  replay, no nagging.
- The moonwell chest has its own version at the chest itself, and the grotto
  waking still gets its own announcement.
- A new **Calm motion** switch on the pause screen (next to Sound) turns the
  flourish into a simple glow with no movement or sparkle burst. If your device
  is already set to reduce motion, the game starts that way.

**Hidden treasures, and a shelf that fills up.** Five small secrets are tucked
away in the hollow: behind Momo's stall, around the back of the Star Tree, beside
the far arch, and in two quiet corners of Letterleaf Grove. Nothing points at
them — you find them by wandering. Each one answers with a puff of colour, a
chime, a line from Pip and ten sparkles.

- What you find stays found: each secret becomes a small trophy on the new
  **Discovery Shelf** between the landing spot and the market, and a gold counter
  beside your sparkles reads `2/5`. Both come back exactly as they were when you
  reopen the game, and older saves simply start at `0/5`.
- Collecting sparkles now answers back: sweeping up a row plays a little rising
  run of notes and bounces the sparkle counter, so picking things up feels like
  music rather than a single beep.
- Every island now hides its own pair of keepsakes — behind the falls, up on the
  ridge, in the shade of the glade and by the cove rocks — so nowhere in the
  Hollow is only a walk between signs.
- The collection now sits on one low bench in the meadow: six keepsakes in a
  single row, a gem per secret along the front, and the total on the HUD chip —
  readable in one look without walking around it.
- Pebblecount Cove's quiet corners are dressed like the rest of the Hollow: tide
  pools with wet stones, driftwood, shells, starfish and dune grass around each
  find, and softer sand ground without a lawn of pale spikes.
- Gamepads, touchscreens and keyboards all play the whole game now. The ribbon at
  the top always names the device you last touched, and a thumb pad with Zap and
  Jump buttons appears on a touchscreen.
- The meadow changes as you collect. Every keepsake lights one lantern along the
  path home, an island's flag appears the first time you find something there, and
  its flower bed blooms when that island is fully explored.
- All thirteen keepsakes wake the **Moonwell Grotto** behind the Star Tree: the
  veil parts, stepping stones appear, and a small chest inside holds thirty
  sparkles. Until then it whispers how many keepsakes would wake it.
- The keepsake bench is evened out, so the pebble and shell no longer read smaller
  than the egg and drum.
- The Moonwell Grotto's arch is now carved stone: plinths, banded columns, a keystone with a star cut
  into it, a little lantern on each column, ivy at the corners and a mossy threshold. Rock walls
  close the back of the grotto, and the moonwell has lily pads, a rim of stones, ferns, mushrooms and
  a stone bench.
- The clearing around the grotto is dressed with trees, shrubs and a worn stone path, so it reads as
  a hidden place rather than an arch standing alone.
- The keepsakes read better at a glance: an open book with pages, a rounder pebble, a kite tied to its
  dish, a flatter shell and a warmer drum — still one tidy row.
- Lanterns glow softly instead of blooming into white, and the flower beds are proper wooden planters
  with little flowers in them.
- The meadow now grows all the way, not just at the end: a worn stone path is laid two keepsakes at
  a time, a line of little bunting flags gains one for every keepsake, and each planter fills with
  flowers as its own island is explored.
- The grotto clearing wakes a little at a time too. Stones in the water, the stepping stones and the
  fireflies arrive one by one over the last keepsakes, and the veil gets thinner — it still only
  opens when all thirteen are home.
- The path lanterns are proper little lamps now, with a wooden frame, warm glass and a hook, so you
  can see at a glance which ones are lit.


- Each island also shows what you found *there*: a little stone cairn beside the
  way home holds that island's keepsakes. The meadow's Discovery Shelf has grown
  into a stepped stand with one dish per island and a row of gems that light as
  you find them, so the whole collection is readable at a glance.

**A grown-up corner, and questions that resize themselves.** Pausing the game now
opens a small panel under the pause card. For each of the five subjects — letters
and sounds, words and rhymes, numbers and counting, patterns and shapes, memory
and listening — it shows how many signs your child has met and how many were
answered first try, and lets you choose **Gentle**, **Just right** or **Stretch**
for that subject alone.

- **Every subject adapts on its own.** Doing well with numbers never makes letters
  harder. Auto keeps a subject at Just right until there is real evidence: two
  solved signs answered first try less than half the time turn that subject Gentle,
  and three almost-perfect signs turn it Stretch.
- **Gentle** makes the first wrong choice fade after a single miss and brings the
  spoken hint sooner. **Stretch** keeps every choice for three misses and waits
  longer before hinting. The sparkles and stars are identical at every level, so
  being helped is never a punishment.
- **Nothing is lost.** The record and your choices are saved with the rest of the
  adventure, and older saves open with a clean slate and everything on Auto.

## 0.1.4-beta.1 — 2026-11-27

**The Star Tree Workshop.** The Star Tree is now something to build, and sparkles
have a second job. Five glowing star shards are hidden on the five adventure
islands — a golden star in Letterleaf Grove, a silver moon in Tallybrook Falls, a
pink blossom on Pattern Peaks, a song bell in Storysong Glade and a sea shell in
Pebblecount Cove. Each sits on a little stone plinth, ringed with light, under a
tall beam you can spot from across the island, and each sings a soft chime as you
come close. Walk into one to pop it in your pouch.

The pouch shows every shape as a picture under the sparkle counter. At the Star
Tree, two gold garlands now wrap the trunk with six hooks, each carrying a dashed
outline of the ornament that belongs there. Zap the outline that matches a shape
you are carrying: the ornament pops onto the branch with a bounce and a happy
line, and it is still there when you come back tomorrow. The sixth shape, a **Sky
Lantern**, is sold by Momo for 90 sparkles, so the market and the tree feed each
other.

Hang all six and the tree changes for good: the leaves turn a luminous
mint-gold, a garland of coloured lights gathers round the canopy and a warm star
glows above it. A new gold badge appears beside your shards, Pip and Momo both
say thank you, and the goal chip reads "The Star Tree is decorated" so you can
stand and admire it.

- Ornaments are modelled from the same shape painter that draws the pouch
  pictures, so a shard, its outline and the finished ornament all read as one
  object.
- For grown-ups: shards and placements live in the existing v1 save (`shards`,
  `placed`); saves from earlier betas open with an empty pouch. Zapping the wrong
  outline costs nothing — the game names the shape and the island where it hides.
- Art pass: drawn market icons for every gift (no emoji cards), the stall counter
  widened for four jars, a calmer shard beacon, and a two-by-two market grid.

Verified with 26 tests (9 new for the workshop), a clean production build, and the
whole loop played in the cloud browser: every shard collected, the Sky Lantern
bought from Momo, all six ornaments hung by zapping the tree, the decorated tree
and badge reached, and the result still there after a reload. A Windows playtest
is still outstanding.

## 0.1.3-beta.1 - 2026-11-27

**Momo's Wisp Market.** Sparkles finally have somewhere to go. Momo, a mossy
lantern-snail with a glowing spiral shell, keeps a striped stall beside the path
to the Star Tree in Sunbeam Meadow. Zap Momo to open the market.

- Three permanent gifts: **Star Magnet** (40 sparkles) pulls loose sparkles from
  much further away, **Pip's Bell** (70) makes Pip point out the next sign after
  four seconds instead of nine, and **Rainbow Blaster** (110) gives every zap the
  next colour of the rainbow.
- Cards show a picture, a price and Momo's spoken description, so a child who
  cannot read can shop by icon alone. Trying to buy with too few sparkles shakes
  the card and Momo says how many more are needed; nothing is ever lost.
- Bought gifts appear as gold badges under the sparkle counter and as stars in
  the stall jars, and they are saved with the rest of the adventure.
- Art pass: new Momo character (body, eyestalks, glowing shell, scarf), the
  striped-awning stall with glass jars and hanging lanterns, hand-drawn market
  and jar icons, and the hub altar rebuilt with moss, a gold band and five rune
  lights.

Verified with 17 tests (8 new for the market), a clean production build, and the
whole loop played in the cloud browser: walk up, zap Momo, be refused kindly,
buy all three gifts, feel the magnet pull, save and reload. A Windows playtest
is still outstanding.

## 0.1.2-beta.1 — 2026-11-27

**Smaller questions, clearer paths.**

- **Gentler second chances.** After two wrong answers at a picture or pattern sign, one wrong choice
  fades to a quiet grey and "Easier now!" appears, leaving the right answer and one friendlier
  choice. Each further miss removes one more, never below two choices and never the answer. The
  spoken hint still arrives on its own. Walking away and coming back restores every choice, so a
  fresh attempt is never already simplified. Order and memory signs keep all their pads, because
  their order is the puzzle.
- **Finished islands are marked.** An arch in Sunbeam Meadow now wears a small star once that
  island's Starberry is safely in the tree, and its beacon fades, so a child can see at a glance
  which paths still have work to do.
- New regression tests cover the narrowing rules, and the Windows workflow builds from a release
  tag passed as an input.

## 0.1.1-beta.1 — 2026-11-27

- **Repeat controls.** Press **R** or click the repeat button to hear the nearest sign again without
  releasing mouse look. Leaving an unsolved sign clears only that sign's prompt, never newer
  dialogue. Memory signs replay their lights and start a fresh copy round; extra presses during the
  demo do not queue another round.
- Save handling: pending sparkles are flushed on pause or exit, a previous checkpoint is kept, and
  malformed saves no longer break startup.

## 0.1.0 — 2026-11-27

- First public Windows beta: five floating islands, 29 learning signs, Pip the companion, friendly
  creatures, sparkles, Starberries, and the Star Tree ending. Portable EXE and per-user installer.
