import * as THREE from 'three';
import { ZONES, ZONE_BY_ID, ZONE_STAR_ORDER, PIP_LINES, GARDEN } from '../content.js';
import { Island } from '../world/terrain.js';
import { buildScatter, buildSkyIslands, buildPortal, buildWishTree, buildCoveNook } from '../world/props.js';
import { SkySystem } from '../world/sky.js';
import { FX } from '../world/fx.js';
import { glyphTexture } from '../world/textures.js';
import { Station } from './station.js';
import { CreatureManager } from './creatures.js';
import { SparkleManager, Starberry } from './collectibles.js';
import { Player } from './player.js';
import { Blaster } from './blaster.js';
import { Companion } from './companion.js';
import { MarketStall, SHOP_ITEMS, itemById, purchase, shopStatus } from './shop.js';
import { ShardField, Workshop, ORNAMENTS, SHARD_IDS, collectShard, place, workshopStatus, isComplete } from './workshop.js';
import { shapeDataUrl } from '../world/ornaments.js';
import { loadSave, writeSave } from '../engine/save.js';
import {
  SUBJECTS,
  SUBJECT_LABELS,
  LEVELS,
  emptyReport,
  sanitizeDifficulty,
  recordAttempt,
  levelFor,
  hintDelay,
  totalAttempts,
} from './progress.js';
import { renderProgressPanel } from '../ui/progressPanel.js';
import { discover, sanitizeSecrets, sanitizeGates, collectionStatus, secretsForZone } from './secrets.js';
import { SecretSpot, DiscoveryShelf, KeepsakeCairn } from '../world/discoveries.js';
import { SecretGate } from '../world/gates.js';
import { buildSleepingVeil } from '../world/props.js';
import { dressLanternHollow, dressHollowNook, dressHollowPrize } from '../world/lanternHollow.js';
import { HOLLOW, HOLLOW_LOOT, HOLLOW_GATES, hollowAwake, sanitizeHollowLoot } from './hollow.js';
import {
  puzzlesInZone, sanitizePuzzles, isCorrect, isSequenceCorrect, patternComplete,
  dimmedChoices, successLine, wrongLine, PUZZLE_SPARKLES, PUZZLE_WAKE_RADIUS, PUZZLE_AIM_RANGE,
} from './worldPuzzles.js';
import { buildPuzzleSite } from '../world/puzzleArt.js';
import { HubGrowth } from '../world/growth.js';
import { Garden } from '../world/garden.js';
import { grottoLoot, GROTTO, growthChange } from './hubBloom.js';
import { CurioField } from '../world/curios.js';
import { Whisk } from '../world/whisk.js';
import { nextTool, toolInfo, inSuction, suctionStrength, gatherDone, GATHER_SECONDS } from './tools.js';
import { curioReward, curioScanReady, stoneFact, CURIO_LINES, CURIO_AGAIN, CURIO_SPARKLES, isGatherType, familyReward, GATHER_NAMES } from './curios.js';
import {
  emptyBundles,
  emptyGifts,
  sanitizeBundles,
  sanitizeGifts,
  giveGift,
  basketTotal,
  GIFT_LINES,
  GIFT_FULL,
  GIFT_EMPTY,
  GIFT_TOAST,
  BASKET_HINT,
  BUNDLE_KINDS,
  ARBOR_MAX,
  allSpotsFull,
  arborStage,
  giveArbor,
  wishCount,
  ARBOR_HINT,
  ARBOR_EMPTY,
  ARBOR_LINES,
  ARBOR_TOAST,
  ARBOR_WAKE_TOAST,
  WISH_TOAST,
  moonPhase,
  BUNDLE_NAMES,
  BASKET_MAX,
  GIFT_MAX,
} from './gifts.js';
import { reducedMotion } from '../engine/motion.js';
import { clamp, damp, mulberry32 } from '../engine/utils.js';

// Momo's Wisp Market: one stall in the hub, on the path between the landing
// spot and the Star Tree, so nobody can miss it.
const MARKET = { zone: 'meadow', x: 11, z: 10, faceTo: { x: 0, z: 18 } };

const ZONE_GREETINGS = {
  grove: 'Letterleaf Grove! The letters here sing when you zap them.',
  falls: 'Tallybrook Falls! I can hear numbers splashing everywhere.',
  peaks: 'Pattern Peaks! Up here, everything repeats in a lovely pattern.',
  meadow: 'Back in the sunny meadow!',
  words: 'Storysong Glade! The words up here sing when you say them. Listen!',
  cove: 'Pebblecount Cove! Pebbles here stack themselves into numbers. Let us count!',
  hollow: 'Lantern Hollow! The moon keeps a garden here. Listen to the water.',
};

export class Game {
  constructor({ scene, camera, renderer, input, audio, voice, hud }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.input = input;
    this.audio = audio;
    this.voice = voice;
    this.hud = hud;

    this.state = 'title';
    this.timers = [];
    this.islands = new Map();
    this.stations = [];
    // Per-subject learning record and the grown-up's difficulty choices.
    this.learning = emptyReport();
    this.difficulty = sanitizeDifficulty(null);
    this.starberries = {};
    this.currentZoneId = 'meadow';
    this.visited = new Set();
    this.solvedStations = new Set();
    this.scannedCreatures = new Set();
    // Hidden discoveries: ids already found, the caches in the world, and the
    // shelf in the meadow where the trophies live.
    this.secrets = [];
    this.secretSpots = [];
    // The two hollows shut behind a small door, and the ids of the doors a child
    // has already opened. A gate only ever opens, so a save never locks again.
    this.gates = [];
    this.gatesOpened = new Set();
    // Lantern Hollow: the meadow's sleeping arch wakes on the first real wish.
    this.hollowOpen = false;
    this.hollowPortal = null;
    this.hollowLife = null;
    this.hollowPrizes = new Map();
    this.hollowLoot = [];
    this._hollowTold = false;
    // World puzzles: stones to read, count and match, and what they open.
    this.puzzleSites = new Map();
    this.solvedPuzzles = new Set();
    // Steps already entered on a pattern lift, this session only. A wrong shape
    // never resets it; walking away and reloading starts the row fresh, which is
    // the only state a child can lose and it costs nothing.
    this.puzzleProgress = new Map();
    this.puzzleMisses = new Map();
    this._puzzleTold = new Set();
    this.aimPuzzle = null;
    this._gateTold = new Set();
    this._gateTick = 0;
    this.aimGate = null;
    this.curioFields = new Map();
    this.stoneTimer = 0;
    this.discoveryShelf = null;
    this.cairns = new Map();
    this.hubGrowth = null;
    this.grottoTaken = false;
    this._grottoTold = false;
    this.pickupStreak = 0;
    this.pickupStreakTimer = 0;
    this.sparkleCount = 0;
    this.stars = {};
    this.upgrades = new Set();
    this.market = null;
    this.marketZoneId = null;
    this.shopOpen = false;
    this._marketHinted = false;
    this.aimShop = null;
    this.aimHook = null;
    // The Leafwhisk's bundles and the little garden on the meadow path that
    // gives each family somewhere to go.
    this.bundles = emptyBundles();
    this.gifts = emptyGifts();
    this.garden = null;
    this.aimGift = null;
    this._basketTold = false;
    // The Moon Arbor behind the bed: six lights wake it, then each gift is a wish
    // that calls a firefly, so a full garden still has somewhere for a bundle.
    this.arbor = 0;
    this.wishes = 0;
    this._arborTold = false;
    this.shards = new Set();
    this.placed = new Set();
    this.shardField = null;
    this.workshop = null;
    this._shardHinted = false;
    this._images = new Map();
    this.transitioning = false;
    this.portalCooldown = 0;
    this.scanTimer = 0;
    this.aimPad = null;
    this.aimStation = null;
    this.aimCreature = null;
    this.endingPlayed = false;
    this.endingTimer = 0;
    this._chainToken = 0;
    this.confettiTimer = 0;
    this._saveDirty = false;
    this._saveAccum = 0;

    this.fx = new FX(scene, 1200);
    this.sky = new SkySystem(scene);
    this.sparkles = new SparkleManager(scene, this.fx, audio);
    // Sparkles answer back: a short rising run while a child keeps collecting,
    // so sweeping up a row of them sounds like a little tune instead of a beep.
    this.sparkles.onCollect = () => {
      this.addSparkles(1, false);
      this.pickupStreak = Math.min(this.pickupStreak + 1, 8);
      this.pickupStreakTimer = 0.9;
      this.audio?.chime(this.pickupStreak - 1);
      this.hud?.pulseSparkles();
    };
    this.creatures = new CreatureManager(scene, this.fx, audio);
    this.creatures.onGift = () => this.addSparkles(1, true);

    this.player = new Player(camera, input);
    this.player.onJump = () => audio.jump();
    this.player.onLand = () => audio.land();
    this.player.onStep = () => audio.step();
    this.player.onEdge = () => this.hud.showHint('✨ A soft magic breeze keeps you safe!', 2200);

    this.blaster = new Blaster(camera, scene, audio, this.fx);
    this.blaster.onHit = (ref, pos) => this.onBoltHit(ref, pos);
    this.blaster.groundFn = (x, z) => this._groundAnywhere(x, z);

    // The second tool: a first-person Leafwhisk that gathers loose leaves.
    this.whisk = new Whisk(camera, scene, this.fx);
    this.tool = 'bolt';
    this.toolTold = false;
    this.greeted = new Set();
    this.suckHeld = 0;
    this.suckTarget = null;
    this.suckTick = 0;

    this.companion = new Companion({ scene, camera, audio, fx: this.fx });
    this.idleTimer = 0;

    this.input.onLockChange = (locked) => {
      if (!locked && this.state === 'play' && !this.transitioning) this.pause();
    };

    this._buildWorld();
    this._load();
    this._applyUpgrades();
    this._applyWorkshopState();
    this._enterZone(this.currentZoneId, true);
  }

  // ------------------------------------------------------------ world build --

  _buildWorld() {
    const rng = mulberry32(4242);
    for (const zone of ZONES) {
      const island = new Island(zone);
      this.scene.add(island.group);

      const blockers = [
        { x: 0, z: 0, r: 6 },
        { x: zone.spawn.x, z: zone.spawn.z, r: 5 },
      ];
      for (const p of zone.portals) blockers.push({ x: p.x, z: p.z, r: 5 });
      for (const s of zone.stations) blockers.push({ x: s.x, z: s.z, r: 6 });
      for (const c of zone.curios ?? []) blockers.push({ x: c.x, z: c.z, r: 4.2 });
      // Keep a clearing around each puzzle and each standing stone, so the
      // scatter never grows through a stone the child has to read.
      for (const puzzle of puzzlesInZone(zone.id)) {
        blockers.push({ x: puzzle.at.x, z: puzzle.at.z, r: 8 });
        for (const choice of puzzle.choices) blockers.push({ x: choice.at.x, z: choice.at.z, r: 2.4 });
        if (puzzle.pocket) blockers.push({ x: puzzle.pocket.x, z: puzzle.pocket.z, r: puzzle.pocket.r + 2 });
        if (puzzle.shelf) blockers.push({ x: puzzle.shelf.x, z: puzzle.shelf.z, r: puzzle.shelf.r + 2 });
      }
      if (zone.kind === 'hub') {
        blockers.push({ x: 0, z: 4, r: 8 });
        // Keep the walk-up path clear for the lantern row, and leave the grotto
        // and its stepping stones a quiet pocket behind the Star Tree.
        for (let z = 9; z <= 29; z += 4) blockers.push({ x: 0, z, r: 3.4 });
        blockers.push({ x: GROTTO.local.x, z: GROTTO.local.z, r: 10 });
        // Pip's garden needs a clear pocket, but a child must be able to walk right
        // up to the bed and aim without feeling pushed away.
        blockers.push({ x: GARDEN.x, z: GARDEN.z, r: 2.2 });
      }
      if (zone.id === MARKET.zone) blockers.push({ x: MARKET.x, z: MARKET.z, r: 4.6 });

      buildScatter(island, blockers);
      const skyDecor = buildSkyIslands(this.scene, zone);

      // portals
      const portals = [];
      for (const def of zone.portals) {
        const portal = buildPortal(def);
        // A little star appears above an arch once that island is finished.
        const badge = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: glyphTexture({ kind: 'icon', text: '⭐' }),
            transparent: true,
            depthWrite: false,
          })
        );
        badge.scale.setScalar(1.4);
        badge.position.set(0, 7.05, 0.5);
        badge.visible = false;
        portal.group.add(badge);
        portal.badge = badge;
        // An arch that is not ready yet wears a sleeping veil of bramble.
        if (def.needs === HOLLOW.needs) {
          const veilLock = buildSleepingVeil(0xffb86b);
          veilLock.position.z = -0.1;
          portal.group.add(veilLock);
          portal.sleep = veilLock;
        }
        const y = island.heightAtLocal(def.x, def.z);
        portal.group.position.set(def.x, y, def.z);
        portal.group.rotation.y = Math.atan2(-def.x, -def.z);
        island.group.add(portal.group);
        portals.push({
          ...portal,
          def,
          worldPosition: new THREE.Vector3(zone.origin.x + def.x, zone.origin.y + y + 1.6, zone.origin.z + def.z),
        });
        // The sleeping arch is remembered by its finished portal, so the wake
        // burst has a world position to play at.
        if (portal.sleep) this.hollowPortal = portals[portals.length - 1];
      }

      // stations
      const stationCtx = {
        scene: this.scene,
        camera: this.camera,
        audio: this.audio,
        voice: this.voice,
        hud: this.hud,
        fx: this.fx,
        glyphTexture,
        onPrompt: () => this._cancelSayChain(),
        onWrong: () => this.companion?.droop(),
        onStationSolved: (s) => this.onStationSolved(s),
        // Each sign asks for its own subject's level, so a child who is quick
        // with numbers never has letters made harder because of it.
        levelFor: (subject) => levelFor(this.learning, subject, this.difficulty[subject]),
      };
      const stations = [];
      for (const def of zone.stations) {
        const station = new Station(def, island, stationCtx);
        station.zoneId = zone.id;
        stations.push(station);
        this.stations.push(station);
      }

      // Curious things: scenery that answers the blaster and the scanning gaze.
      this.curioFields.set(zone.id, new CurioField({ island, zone, fx: this.fx }));

      // Puzzles that change the place itself: a bramble gate, a sunken crossing,
      // a sleeping path. Built into the island group, so they sit in its ground.
      for (const puzzle of puzzlesInZone(zone.id)) {
        const site = buildPuzzleSite(island, puzzle);
        island.group.add(site.group);
        this.puzzleSites.set(puzzle.id, site);
      }

      // sparkles scattered around the island
      this.sparkles.spawnCluster(
        { x: zone.origin.x, y: 0, z: zone.origin.z },
        zone.sparkles,
        zone.radius * 0.78,
        zone.id,
        (x, z) => island.groundAt(x, z)
      );

      // creatures
      this.creatures.buildZone(zone, (x, z) => island.groundAt(x, z));
      for (const c of this.creatures.creatures) {
        if (c.zoneId === zone.id) c.key = `${zone.id}:${c.name ?? 'grump'}:${Math.round(c.home.x)}:${Math.round(c.home.z)}`;
      }

      // Momo's market: one stall, in the open between the arches and the tree.
      if (zone.id === MARKET.zone) {
        const m = MARKET;
        this.market = new MarketStall({
          scene: this.scene,
          position: new THREE.Vector3(
            zone.origin.x + m.x,
            island.heightAtLocal(m.x, m.z),
            zone.origin.z + m.z
          ),
          yaw: Math.atan2(m.faceTo.x - m.x, m.faceTo.z - m.z),
          owned: [...this.upgrades],
        });
        this.market.zoneId = zone.id;
        this.marketZoneId = zone.id;
      }

      // Hidden hollows, one per authored secret on this island.
      for (const secret of secretsForZone(zone.id)) {
        const spot = new SecretSpot({
          scene: this.scene,
          position: new THREE.Vector3(
            zone.origin.x + secret.at.x,
            island.heightAtLocal(secret.at.x, secret.at.z),
            zone.origin.z + secret.at.z
          ),
          secret,
          found: this.secrets.includes(secret.id),
        });
        spot.zoneId = zone.id;
        this.secretSpots.push(spot);
        // Two finds sleep behind their own small door, built from the same
        // boughs, leaves and stones as the rest of the island.
        if (secret.gate) {
          const g = secret.gate;
          const gate = new SecretGate({
            scene: this.scene,
            position: new THREE.Vector3(
              zone.origin.x + g.at.x,
              island.heightAtLocal(g.at.x, g.at.z),
              zone.origin.z + g.at.z
            ),
            yaw: Math.atan2(secret.at.x - g.at.x, secret.at.z - g.at.z),
            gate: { ...g, zone: zone.id },
            open: this.gatesOpened.has(g.id),
          });
          gate.zoneId = zone.id;
          gate.spot = spot;
          spot.gate = gate;
          spot.setObscured(!gate.isOpen);
          this.gates.push(gate);
        }
        // The cove's bare sand gets a proper corner around each find.
        if (zone.id === 'cove') {
          buildCoveNook(island, secret.at, (secret.at.x * 73 + secret.at.z * 19) | 0);
        }
      }

      // Every island that hides something also shows its own finds, so coming
      // back to a world reminds the child what they did there.
      if (zone.kind !== 'hub' && secretsForZone(zone.id).length) {
        const cx = 8;
        const cz = 42;
        this.cairns.set(zone.id, new KeepsakeCairn({
          scene: this.scene,
          position: new THREE.Vector3(zone.origin.x + cx, island.heightAtLocal(cx, cz), zone.origin.z + cz),
          yaw: Math.atan2(-cx, 46 - cz),
          zone: zone.id,
          found: this.secrets,
        }));
        if (zone.id === 'cove') buildCoveNook(island, { x: cx, z: cz }, 991);
      }

      this.islands.set(zone.id, { zone, island, portals, stations, sky: skyDecor });

      // Lantern Hollow's own art: the pond, the lantern walk, the stream and a
      // hidden corner for each of its keepsakes.
      if (zone.id === HOLLOW.zone) {
        this.hollowLife = dressLanternHollow(island);
        // Two quiet corners: one the child can simply walk past, and one behind
        // a curtain of ferns that only the Leafwhisk opens.
        for (const loot of HOLLOW_LOOT) {
          island.group.add(dressHollowNook(island, { x: loot.x, z: loot.z }, this.hollowLife.life));
          const prize = dressHollowPrize(island, loot);
          island.group.add(prize.group);
          this.hollowPrizes.set(loot.id, { ...prize, loot });
        }
        for (const def of HOLLOW_GATES) {
          const gate = new SecretGate({
            scene: this.scene,
            position: new THREE.Vector3(
              zone.origin.x + def.x,
              island.heightAtLocal(def.x, def.z),
              zone.origin.z + def.z
            ),
            yaw: Math.atan2(-def.x, -def.z),
            gate: { ...def, at: { x: def.x, z: def.z } },
            open: this.gatesOpened.has(def.id),
          });
          gate.zoneId = zone.id;
          this.gates.push(gate);
        }
      }

      if (zone.kind === 'hub') {
        const tree = buildWishTree(zone.palette);
        const gy = island.heightAtLocal(0, 4);
        tree.group.position.set(0, gy - 0.2, 4);
        island.group.add(tree.group);
        this.wishTree = tree;
        this.wishTree.moteBases = tree.motes.map((m) => m.sprite.position.clone());
        this.wishTreePosition = new THREE.Vector3(zone.origin.x, zone.origin.y + gy, zone.origin.z + 4);

        // The Discovery Shelf sits on the path between the landing spot and the
        // market, so every trophy collected anywhere is visible on the way past.
        this.discoveryShelf = new DiscoveryShelf({
          scene: this.scene,
          position: new THREE.Vector3(
            zone.origin.x + 6.4,
            island.heightAtLocal(6.4, 21.5),
            zone.origin.z + 21.5
          ),
          yaw: Math.atan2(-6.4, 8.5),
          found: this.secrets,
        });

        // Everything the hub has grown because of the keepsakes: lit lanterns,
        // island flags and beds, and the grotto behind the tree.
        this.hubGrowth = new HubGrowth({ island, found: this.secrets, taken: this.grottoTaken });

        // Pip's garden: the three spots where gathered bundles become something.
        this.garden = new Garden({
          island,
          position: new THREE.Vector3(
            zone.origin.x + GARDEN.x,
            island.heightAtLocal(GARDEN.x, GARDEN.z),
            zone.origin.z + GARDEN.z
          ),
          yaw: Math.atan2(GARDEN.faceTo.x - GARDEN.x, GARDEN.faceTo.z - GARDEN.z),
          fx: this.fx,
          gifts: this.gifts,
          arbor: this.arbor,
          wishes: this.wishes,
        });
      }
      void rng;
    }

    // The Star Tree Workshop: five shards hidden around the islands and six
    // empty hooks on the hub tree, one per shape.
    this.shardField = new ShardField({ scene: this.scene, islands: this.islands, collected: [...this.shards] });
    if (this.wishTree) {
      this.workshop = new Workshop({
        tree: this.wishTree,
        placed: [...this.placed],
        owned: [...this.upgrades],
        shards: [...this.shards],
      });
    }
  }

  // -------------------------------------------------------------- lifecycle --

  start() {
    this.hud.setVisible(true);
    this.hud.setBundles(this.bundles);
    this.input.enabled = true;
    this.state = 'play';
    this.input.requestLock();
    this.audio.resume();
    this.voice.warmUp();
    this.hud.setStars(this.starCount(), ZONE_STAR_ORDER.length);
    this.hud.setSparkles(this.sparkleCount);
    this._updateGoal();
    this.hud.setZone(ZONE_BY_ID[this.currentZoneId].name);
    this.hud.setTool?.(this.tool);
    this.whisk.setCalm(reducedMotion());

    const intro = this.visited.size > 0 ? [{ text: ZONE_GREETINGS[this.currentZoneId], face: this.currentZoneId === 'meadow' ? '🌻' : '✨' }] : [
      { text: PIP_LINES.intro, face: '🐣' },
      { text: PIP_LINES.intro2, face: '🐣' },
      { text: PIP_LINES.goal, face: '✨' },
    ];
    this._sayThen(intro);
    this.visited.add(this.currentZoneId);
    this._save();
    // The chip is right from the first frame, even before any save exists.
    this.hud?.setDiscoveries(this.secrets.length, collectionStatus(this.secrets).total);
  }

  pause() {
    if (this.state !== 'play') return;
    this._stopSuck();
    this.flushProgress();
    this.state = 'paused';
    this.input.enabled = false;
    this.input.releaseLock();
    this.voice.stop();
    this.audio.musicPlaying = false;
    this.hud.showPause(true, `✨ ${this.sparkleCount} sparkles · ★ ${this.starCount()} of ${ZONE_STAR_ORDER.length} starberries · ${totalAttempts(this.learning)} ${totalAttempts(this.learning) === 1 ? 'sign' : 'signs'} met`);
    this._renderGrownUpCorner();
    this.hud.hideHint();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'play';
    this.whisk.setCalm(reducedMotion());
    this.input.enabled = true;
    this.audio.musicPlaying = true;
    this.audio.resume();
    this.hud.showPause(false);
    this.input.requestLock();
  }

  /**
   * One solved sign is one data point for its own subject and nothing else.
   * First-try solves are the evidence that this subject is already easy.
   */
  _recordLearning(station) {
    if (!station?.subject) return;
    this.learning = recordAttempt(this.learning, station.subject, { misses: station.mistakes });
    this._saveDirty = true;
  }

  /** A grown-up's choice for one subject; 'auto' hands it back to the game. */
  setDifficulty(subject, level) {
    if (!SUBJECTS.includes(subject)) return;
    if (level !== 'auto' && !LEVELS.includes(level)) return;
    this.difficulty = sanitizeDifficulty({ ...this.difficulty, [subject]: level });
    this._save();
    this._renderGrownUpCorner();
    const wording =
      level === 'gentle' ? 'will ask smaller questions'
        : level === 'stretch' ? 'will ask bigger questions'
          : 'follows the game again';
    this.hud.showHint(`${SUBJECT_LABELS[subject]} ${wording}.`, 2800);
  }

  _renderGrownUpCorner() {
    renderProgressPanel(document.getElementById('progress-corner'), {
      report: this.learning,
      difficulty: this.difficulty,
      onSet: (subject, level) => this.setDifficulty(subject, level),
    });
  }

  repeatInstruction() {
    if (this.state !== 'play' || this.transitioning) return;
    let nearest = null;
    let distance = Infinity;
    for (const station of this.currentData?.stations ?? []) {
      if (!station.active || station.solved) continue;
      const candidate = station.distanceTo(this.player.position);
      if (candidate < distance) {
        nearest = station;
        distance = candidate;
      }
    }
    if (nearest) {
      this._cancelSayChain();
      nearest.repeatPrompt();
    } else {
      this.hud.replayBubble();
    }
  }

  starCount() {
    return ZONE_STAR_ORDER.filter((z) => this.stars[z]).length;
  }

  // ------------------------------------------------------------- wisp market --

  hasUpgrade(id) {
    return this.upgrades.has(id);
  }

  /** Zapping Momo opens the market; the world waits politely behind the panel. */
  openShop() {
    if (!this.market || this.shopOpen || this.state !== 'play') return;
    this.shopOpen = true;
    this.state = 'shop';
    this.input.enabled = false;
    this.input.releaseLock();
    this.voice.stop();
    this._cancelSayChain();
    this.hud.hideBubble();
    this.hud.hideHint();
    this.market.greet();
    this.audio.ui?.();
    const line = 'Welcome to my market! Your sparkles can buy my lovely gifts.';
    this.hud.showShop({
      items: this.marketItems(),
      sparkles: this.sparkleCount,
      line,
      handlers: {
        onBuy: (id) => this.buyItem(id),
        onSpeak: (id) => {
          const item = itemById(id);
          if (!item) return;
          this.voice.say(this.hasUpgrade(id) ? `${item.name} is already yours!` : `${item.name}. ${item.blurb}.`);
        },
        onClose: () => this.closeShop(),
      },
    });
    this.voice.say(line);
    this._saveDirty = true;
  }

  closeShop() {
    if (!this.shopOpen) return;
    this.shopOpen = false;
    this.state = 'play';
    this.hud.hideShop();
    this.input.enabled = true;
    this.input.requestLock();
    this.voice.say('Come back any time!');
  }

  buyItem(id) {
    const result = purchase({ owned: [...this.upgrades], sparkles: this.sparkleCount }, id);
    if (!result.ok) {
      this.market?.reject();
      this.hud.shakeShop(id);
      this.audio.ui?.();
      const line = result.reason === 'owned'
        ? 'You already have that one! It is yours for ever.'
        : `You need ${result.missing} more sparkles for that. Sparkles hide all over the islands!`;
      this.voice.say(line);
      return result;
    }
    this.upgrades = new Set(result.owned);
    this.sparkleCount = result.sparkles;
    this.hud.setSparkles(this.sparkleCount);
    this.hud.setUpgrades(
      SHOP_ITEMS.filter((it) => this.upgrades.has(it.id)).map((it) => ({ ...it, image: this.shapeImage(it.shape) }))
    );
    this.market?.setOwned(this.upgrades);
    this.market?.greet();
    this.audio.star?.();
    this.fx?.fountain(this.market.momoWorld(), 0xffc46b, 30);
    this.hud.toast(result.item.name, result.item.icon, this.shapeImage(result.item.shape));
    this.hud.showBanner(result.item.name, result.item.blurb, 3200);
    this.voice.say(result.item.line);
    this._applyUpgrades();
    this.hud.refreshShop({ items: this.marketItems(), sparkles: this.sparkleCount });
    this._saveDirty = true;
    this._save();
    return result;
  }

  /** A drawn picture for one shape, generated once per session. */
  shapeImage(shape, { plate = false } = {}) {
    if (!shape) return null;
    const key = plate ? `${shape}:plate` : shape;
    if (!this._images.has(key)) this._images.set(key, shapeDataUrl(shape, { plate }));
    return this._images.get(key);
  }

  /** Ornament cards for the pouch and badges, with their pictures attached. */
  ornamentItems({ includePlaced = true } = {}) {
    return workshopStatus({ shards: [...this.shards], placed: [...this.placed], owned: [...this.upgrades] })
      .filter((item) => includePlaced || !item.placed)
      .map((item) => ({ ...item, image: this.shapeImage(item.shape, { plate: true }) }));
  }

  heldOrnaments() {
    return this.ornamentItems({ includePlaced: false }).filter((item) => item.held);
  }

  marketItems() {
    return shopStatus({ owned: [...this.upgrades], sparkles: this.sparkleCount }).map((item) => ({
      ...item,
      image: this.shapeImage(item.shape),
    }));
  }

  _applyWorkshopState() {
    this.shardField?.setCollected([...this.shards]);
    if (this.workshop) {
      this.workshop.setState({ shards: [...this.shards], owned: [...this.upgrades] });
      this.workshop.setPlaced([...this.placed]);
    }
    this.hud.setShards(this.heldOrnaments());
    this.hud.setBadges(
      isComplete([...this.placed]) ? [{ name: 'Star Tree decorated', image: this.shapeImage('star') }] : []
    );
  }

  /** Upgrades are read by the systems themselves, so they survive a reload. */
  _applyUpgrades() {
    const magnet = this.hasUpgrade('magnet');
    this.sparkles.magnetRange = magnet ? 9.5 : 4.6;
    this.sparkles.magnetPull = magnet ? 3.6 : 2.5;
    this.blaster.setRainbow(this.hasUpgrade('rainbow'));
    this.workshop?.setState({ shards: [...this.shards], owned: [...this.upgrades] });
    this.hud.setUpgrades(
      SHOP_ITEMS.filter((it) => this.upgrades.has(it.id)).map((it) => ({ ...it, image: this.shapeImage(it.shape) }))
    );
    this.market?.setOwned(this.upgrades);
  }

  // ------------------------------------------------------- star tree workshop --

  _collectShard(id) {
    const result = collectShard({ shards: [...this.shards], placed: [...this.placed] }, id);
    if (!result.ok) return result;
    this.shards = new Set(result.shards);
    this.shardField?.collect(id);
    this.workshop?.setState({ shards: [...this.shards], owned: [...this.upgrades] });
    this.hud.setShards(this.heldOrnaments());
    this.audio.star();
    this.companion?.celebrate();
    const where = this.shardField?.worldPosition(id) ?? this.camera.position.clone();
    this.fx.fountain(where, result.item.color, 44);
    this.hud.showBanner('Star shard found!', `${this.shards.size} of ${SHARD_IDS.length}`, 4200);
    this.hud.toast(`Found the ${result.item.name}`, null, this.shapeImage(result.item.shape));
    this.voice.say(result.item.line);
    this._updateGoal();
    this._save();
    return result;
  }

  _updateShards(dt, time) {
    if (!this.shardField) return;
    const { collected, near } = this.shardField.update(
      dt,
      time,
      this.camera.position,
      this.player.position,
      this.currentZoneId
    );
    if (near && !this._shardHinted) {
      this._shardHinted = true;
      const line = 'A star shard is glowing nearby! Walk right into it.';
      this.hud.showHint(line, 4200);
      this.voice.say(line);
    }
    if (!near && !collected) this._shardHinted = false;
    if (collected) this._collectShard(collected.id);
  }

  /** Zap the outline that matches the shard in the pouch to hang it. */
  _hang(hook) {
    const result = place(
      { shards: [...this.shards], placed: [...this.placed], owned: [...this.upgrades] },
      hook.id
    );
    if (!result.ok) {
      const where = result.item?.market ? "Momo's market" : result.item?.island;
      const line = result.reason === 'placed'
        ? 'That shape is already hanging! Try one of the other outlines.'
        : `You need the ${result.item?.name ?? 'other'} shard for that outline. It is hiding on ${where}.`;
      this.voice.say(line);
      this.hud.showHint(line, 4200);
      this.audio.ui?.();
      return result;
    }
    this.placed = new Set(result.placed);
    this.workshop?.tryPlace(hook.id);
    this.hud.setShards(this.heldOrnaments());
    this.hud.toast(`${result.item.name} on the tree`, null, this.shapeImage(result.item.shape));
    this.audio.star();
    this.fx.fountain(hook.worldPosition.clone(), result.item.color, 50);
    this.voice.say(result.item.placeLine);
    this._updateGoal();
    if (result.complete) this._completeWorkshop();
    this._save();
    return result;
  }

  _completeWorkshop() {
    this.workshop?.decorate();
    this.hud.setBadges([{ name: 'Star Tree decorated', image: this.shapeImage('star') }]);
    this.hud.showBanner('The Star Tree is decorated!', 'Every shape is glowing', 6000);
    this.audio.star();
    this.fx.fountain(this.wishTreePosition.clone().setY(this.wishTreePosition.y + 8), 0xfff2b0, 90);
    this.market?.greet();
    this._sayThen([
      { text: 'Oh! Look at the Star Tree! Every single shape is glowing!', face: '🐌' },
      { text: 'You decorated the whole tree yourself. I will remember this forever!', face: '🐣' },
    ]);
    this.schedule(14, () => this.hud.showBanner('Star Tree decorated!', 'A brand new badge for you', 5200));
    this._saveDirty = true;
  }

  _updateMarket(dt, time) {
    const market = this.market;
    if (!market) return;
    market.update(dt, time, this.camera.position);
    if (market.zoneId !== this.currentZoneId || this.state !== 'play') return;
    const distance = market.distanceTo(this.player.position);
    if (!this._marketHinted && distance < 10) {
      this._marketHinted = true;
      const line = "That's Momo's market. Zap it to see what your sparkles can buy!";
      this.hud.showHint(line, 5200);
      this.voice.say(line);
    }
    if (distance > 22) this._marketHinted = false;
  }

  schedule(delay, fn) {
    this.timers.push({ t: delay, fn });
  }

  _sayThen(lines, index = 0, token = ++this._chainToken) {
    if (index >= lines.length || token !== this._chainToken) return;
    const line = lines[index];
    this.hud.showBubble(line.text, line.face ?? '🐣');
    if (!this.voice.supported) {
      this.schedule(4.2, () => this._sayThen(lines, index + 1, token));
      return;
    }
    this.voice.say(line.text, {
      onEnd: () => this.schedule(0.7, () => this._sayThen(lines, index + 1, token)),
    });
  }

  /** A sign the child walked up to interrupts any scripted narration. */
  _cancelSayChain() {
    this._chainToken += 1;
  }

  // ------------------------------------------------------------------ zones --

  _enterZone(zoneId, placePlayer) {
    const data = this.islands.get(zoneId);
    if (!data) return;
    this.currentZoneId = zoneId;
    this._stopSuck?.();
    this._marketHinted = false;
    this.sky.applyZone(data.zone);
    this.audio.setZone(zoneId);
    this.hud.setZone(data.zone.name);

    const { island, zone } = data;
    // The ground is the island — plus any puzzle surface underfoot. The lift
    // deck and its sky shelf are real floors, so a child who rides up can walk
    // around up there and step back down.
    this.player.setWorld(
      (x, z) => {
        let y = island.groundAt(x, z);
        for (const def of puzzlesInZone(zone.id)) {
          const top = this.puzzleSites.get(def.id)?.surfaceAt?.(x, z);
          if (Number.isFinite(top)) y = Math.max(y, top);
        }
        return y;
      },
      { x: zone.origin.x, z: zone.origin.z },
      zone.radius
    );

    if (placePlayer) {
      const wx = zone.origin.x + zone.spawn.x;
      const wz = zone.origin.z + zone.spawn.z;
      const yaw = Math.atan2(zone.spawn.x, zone.spawn.z);
      this.player.place(wx, wz, yaw);
      this.blaster.setVisible(true);
      this.companion?.snap();
    }

    const firstVisit = !this.visited.has(zoneId);
    if (firstVisit && this.state === 'play') {
      // Arriving somewhere new outranks whatever Pip was still saying.
      this._cancelSayChain();
      this.hud.showBanner(zone.name, zone.subtitle, 4200);
      this.audio.unlock();
      const greeting = ZONE_GREETINGS[zoneId] ?? zone.name;
      this.hud.showBubble(greeting, zone.kind === 'hub' ? '🌻' : '✨');
      this.voice.say(greeting);
      this.visited.add(zoneId);
    }
    if (this.state === 'play') this._save();
    this._updateGoal();
  }

  async travelTo(zoneId) {
    if (this.transitioning) return;
    this.transitioning = true;
    this.hud.hideBubble();
    this.audio.portal();
    this.voice.stop();
    await this.hud.fade(true);
    this._enterZone(zoneId, true);
    this.hud.setFadeImmediate(false);
    this.portalCooldown = 2.2;
    this.transitioning = false;
  }

  _updateZoneDetection() {
    const p = this.player.position;
    for (const [id, data] of this.islands) {
      if (data.island.distanceTo(p.x, p.z) < data.zone.radius * 1.02) {
        if (id !== this.currentZoneId) this._enterZone(id, true);
        return;
      }
    }
  }

  get currentData() {
    return this.islands.get(this.currentZoneId);
  }

  _groundAnywhere(x, z) {
    for (const data of this.islands.values()) {
      if (data.island.distanceTo(x, z) < data.zone.radius * 1.05) return data.island.groundAt(x, z);
    }
    return -120;
  }

  // -------------------------------------------------------------- progression --

  addSparkles(n, burst = true) {
    this.sparkleCount += n;
    this.hud.setSparkles(this.sparkleCount);
    if (burst) this.audio.collect();
    this._saveDirty = true;
  }

  onStationSolved(station) {
    this.companion?.celebrate();
    this.hud.setCrosshairHot(false);
    this.solvedStations.add(station.def.id);
    this._recordLearning(station);
    this.addSparkles(6, false);
    const zone = ZONE_BY_ID[station.zoneId];
    const allSolved = zone.stations.every((s) => this.solvedStations.has(s.id));
    if (ZONE_STAR_ORDER.includes(zone.id) && allSolved && !this.stars[zone.id] && !this.starberries[zone.id]) {
      this._spawnStarberry(zone);
    }
    this._updateGoal();
    this._save();
  }

  _spawnStarberry(zone) {
    const silent = this.state !== 'play';
    const data = this.islands.get(zone.id);
    const { island } = data;
    const pos = new THREE.Vector3(
      zone.origin.x,
      island.groundAt(zone.origin.x, zone.origin.z) + 1.9,
      zone.origin.z
    );
    const berry = new Starberry(this.scene, this.fx, pos, zone.id);
    berry.appear(24);
    this.starberries[zone.id] = berry;
    if (silent) return;
    this.audio.star();
    this.hud.showBanner('A Starberry appeared!', 'Follow the beam of light ✨', 4600);
    const line = 'You solved every sign here! A Starberry is waiting in the middle of the island. Follow the beam of light!';
    this.hud.showBubble(line, '💖');
    this.voice.say(line);
    this.fx?.fountain(pos, 0xffc0d8, 40);
  }

  _collectStarberry(zoneId) {
    const zone = ZONE_BY_ID[zoneId];
    this.stars[zoneId] = true;
    this.hud.setStars(this.starCount(), ZONE_STAR_ORDER.length);
    this.audio.star();
    this._fillWishSocket(zoneId);
    this.hud.showBanner('Starberry found!', `${this.starCount()} of ${ZONE_STAR_ORDER.length}`, 4000);
    this.fx.fountain(this.camera.position.clone().add(new THREE.Vector3(0, -1, -3)), 0xffc0d8, 50);

    let line = `You found the ${zone.name} Starberry! Wonderful!`;
    if (this.starCount() === ZONE_STAR_ORDER.length) {
      line = `All ${ZONE_STAR_ORDER.length} Starberries! Bring them to the Star Tree in the meadow. Hurry, hurry!`;
      this.hud.showBubble(line, '🌟');
    } else {
      line += ` ${ZONE_STAR_ORDER.length - this.starCount()} more to find.`;
      this.hud.showBubble(line, '💖');
    }
    this.voice.say(line);
    this._refreshPortalBadges();
    this._updateGoal();
    this._save();
  }

  /** Mark every arch whose island's Starberry is already safe. */
  _refreshPortalBadges() {
    for (const data of this.islands.values()) {
      for (const portal of data.portals) {
        if (!portal.badge) continue;
        const done = !!this.stars[portal.def.to];
        portal.badge.visible = done;
        portal.beam.material.opacity = done ? 0.04 : 0.1;
      }
    }
  }

  _fillWishSocket(zoneId) {
    if (!this.wishTree) return;
    const index = ZONE_STAR_ORDER.indexOf(zoneId);
    const socket = this.wishTree.sockets[index];
    if (!socket) return;
    socket.berry.visible = true;
    socket.glow.material.opacity = 0.75;
    socket.ring.material.emissiveIntensity = 1.4;
    this.fx.burst(socket.berry.getWorldPosition(new THREE.Vector3()), {
      color: 0xff9ec4,
      count: 26,
      speed: 4,
      life: 1.1,
      size: 0.6,
    });
  }

  _updateGoal() {
    const zone = ZONE_BY_ID[this.currentZoneId];
    if (!zone) return;
    let goal = '';
    if (zone.kind === 'hub') {
      const count = this.starCount();
      const holding = this.heldOrnaments().length;
      if (holding > 0) goal = '🪄 Hang your shard on the Star Tree';
      else if (isComplete([...this.placed])) goal = '🌟 The Star Tree is decorated';
      else if (this.placed.size > 0) goal = `🎀 ${this.placed.size} of ${ORNAMENTS.length} ornaments`;
      else if (this.endingPlayed) goal = '✨ Explore the hollow with Pip';
      else if (count >= ZONE_STAR_ORDER.length) goal = '🌟 Visit the Star Tree!';
      else if (count === 0) goal = '🍃 Choose a glowing arch';
      else goal = `💖 ${count} of ${ZONE_STAR_ORDER.length} Starberries · keep exploring`;
    } else if (zone.id === HOLLOW.zone) {
      goal = HOLLOW.goal;
    } else if (this.stars[zone.id]) {
      goal = '🏠 Back through the arch';
    } else {
      const solved = zone.stations.filter((s) => this.solvedStations.has(s.id)).length;
      goal = solved >= zone.stations.length ? '💖 Collect your Starberry!' : `${solved} of ${zone.stations.length} signs solved`;
    }
    this.hud.setGoal(goal);
  }

  // ------------------------------------------------------------------- aim --

  _updateAim() {
    const camPos = this.camera.position;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    let bestPad = null;
    let bestStation = null;
    let bestAngle = 0.3;
    for (const station of this.currentData?.stations ?? []) {
      for (const pad of station.aimCandidates()) {
        const v = pad.group.position.clone().sub(camPos);
        const dist = v.length();
        if (dist > 30) continue;
        const angle = v.normalize().angleTo(dir);
        if (angle < bestAngle) {
          bestAngle = angle;
          bestPad = pad;
          bestStation = station;
        }
      }
    }

    let bestCreature = null;
    let bestCreatureAngle = 0.26;
    for (const c of this.creatures.creatures) {
      if (c.zoneId !== this.currentZoneId || c.hidden) continue;
      const v = c.group.position.clone().setY(c.group.position.y + 0.7).sub(camPos);
      const dist = v.length();
      if (dist > 24) continue;
      const angle = v.normalize().angleTo(dir);
      if (angle < bestCreatureAngle) {
        bestCreatureAngle = angle;
        bestCreature = c;
      }
    }

    if (this.aimStation && this.aimStation !== bestStation) this.aimStation.highlight(null);
    if (bestStation) bestStation.highlight(bestPad);

    // Six ornament hooks on the hub tree: zapping one hangs the matching shard.
    let hookTarget = null;
    if (this.workshop && this.currentZoneId === 'meadow') {
      let hookAngle = 0.24;
      for (const hook of this.workshop.aimCandidates()) {
        const v = hook.worldPosition.clone().sub(camPos);
        const dist = v.length();
        if (dist > 15) continue;
        const angle = v.normalize().angleTo(dir);
        if (angle < hookAngle) {
          hookAngle = angle;
          hookTarget = hook;
        }
      }
    }

    // Momo is a zap target too, but a sign in the middle of the view still wins.
    let shopAngle = 0.3;
    let shopTarget = null;
    if (this.market?.group.visible && !bestPad && !hookTarget) {
      const v = this.market.momoWorld().sub(camPos);
      if (v.length() < 26) {
        const angle = v.normalize().angleTo(dir);
        if (angle < shopAngle) {
          shopAngle = angle;
          shopTarget = this.market;
        }
      }
    }
    if (shopTarget && (!bestCreature || shopAngle <= bestCreatureAngle)) {
      bestCreature = null;
      this.aimShop = shopTarget;
    } else {
      this.aimShop = null;
    }

    this.aimStation = bestStation;
    this.aimPad = bestPad;
    this.aimHook = bestPad ? null : hookTarget;
    this.aimCreature = bestPad || this.aimHook ? null : bestCreature;

    // Pip's garden: each spot is its own aim target, so looking at the bowl or
    // the post chooses that gift. Nothing else in the hub competes for it.
    let giftTarget = null;
    if (this.garden && this.currentZoneId === GARDEN.zone && !bestPad && !this.aimHook && !this.aimCreature && !this.aimShop) {
      let giftAngle = 0.2;
      for (const slot of this.garden.aimPoints()) {
        const v = slot.point.clone().sub(camPos);
        const dist = v.length();
        if (dist > 6.5) continue;
        const angle = v.normalize().angleTo(dir);
        if (angle < giftAngle) {
          giftAngle = angle;
          giftTarget = slot;
        }
      }
    }
    this.aimGift = giftTarget;

    // Puzzle stones are read from a distance, so they are a zap target of their
    // own. A sign, a creature, a hook or Momo still wins if it is in the way.
    let puzzleTarget = null;
    if (!bestPad && !this.aimHook && !this.aimCreature && !this.aimShop && !this.aimGift) {
      let puzzleAngle = 0.22;
      for (const def of puzzlesInZone(this.currentZoneId)) {
        if (this.solvedPuzzles.has(def.id)) continue;
        const site = this.puzzleSites.get(def.id);
        if (!site) continue;
        const level = this._puzzleLevel(def);
        const dim = dimmedChoices(
          def,
          this.puzzleMisses.get(def.id) ?? 0,
          level,
          this.puzzleProgress.get(def.id) ?? 0
        );
        for (const stone of site.choices) {
          if (dim.includes(stone.id)) continue;
          const point = stone.worldPoint();
          const v = point.sub(camPos);
          if (v.length() > PUZZLE_AIM_RANGE) continue;
          const angle = v.normalize().angleTo(dir);
          if (angle < puzzleAngle) {
            puzzleAngle = angle;
            puzzleTarget = { def, site, stone };
          }
        }
      }
    }
    this.aimPuzzle = puzzleTarget;

    // Curious things are scenery: a sign, a creature, a hook, Momo or a garden
    // spot wins first.
    let curioTarget = null;
    if (!bestPad && !this.aimHook && !this.aimCreature && !this.aimShop && !this.aimGift && !puzzleTarget) {
      curioTarget = this.curioFields.get(this.currentZoneId)?.pick(camPos, dir) ?? null;
    }
    this.aimCurio = curioTarget;

    // A frost bell is a zap target of its own, but only when nothing closer is
    // asking to be looked at.
    let gateTarget = null;
    if (!bestPad && !this.aimHook && !this.aimCreature && !this.aimShop && !this.aimGift && !curioTarget) {
      let gateAngle = 0.22;
      for (const gate of this.gates) {
        if (gate.zoneId !== this.currentZoneId || gate.isOpen || gate.gate.kind !== 'ring') continue;
        const v = gate.bellWorld().sub(camPos);
        const distance = v.length();
        if (distance > 14) continue;
        const angle = v.normalize().angleTo(dir);
        if (angle < gateAngle) {
          gateAngle = angle;
          gateTarget = gate;
        }
      }
    }
    this.aimGate = gateTarget;
    this.hud.setCrosshairHot(!!(bestPad || this.aimCreature || this.aimShop || this.aimHook || this.aimCurio || this.aimGate || this.aimPuzzle));
  }

  /** Switching, and the held trigger that turns the Leafwhisk on. */
  _updateTool(dt) {
    if (this.input.consumeTool()) this._switchTool();
    if (this.tool !== 'whisk') return;
    if (this.input.firingHeld && this.state === 'play' && !this.transitioning) this._suck(dt);
    else this._stopSuck();
  }

  _switchTool() {
    if (this.state !== 'play' || this.transitioning) return;
    this.tool = nextTool(this.tool);
    this._stopSuck();
    this.blaster.setActive(this.tool === 'bolt');
    this.whisk.setActive(this.tool === 'whisk');
    this.whisk.setCalm(reducedMotion());
    this.hud?.setTool(this.tool);
    this.audio?.tool();
    const info = toolInfo(this.tool);
    this.hud?.toast(`${info.icon} ${info.name}`, info.icon);
    if (!this.toolTold) {
      // The first switch is taught out loud; after that the chip is enough.
      this.toolTold = true;
      this.hud?.showBubble(info.line, info.icon);
      this.voice?.say(info.line);
    }
  }

  /** Hold the trigger with the Leafwhisk out: leaves curve to the mouth. */
  _suck(dt) {
    const field = this.curioFields.get(this.currentZoneId);
    const origin = this.camera.position;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    // A leaf drift is a curtain, not a curio: holding the whisk at it sips it.
    const gate = this._gateInSuction(origin, dir);
    if (gate) {
      this.whisk.setActive(true);
      this.audio?.suckStart();
      const load = Math.min(1, 0.3 + gate.progress * 0.7);
      this.audio?.suckSet(load);
      this.whisk.setLevel(load);
      this._gateTick += dt;
      if (this._gateTick > 0.07) {
        this._gateTick = 0;
        for (let i = 0; i < 2; i++) {
          const point = gate.sampleLeaf();
          if (point) this.whisk.emitLeaf(point);
        }
      }
      if (gate.sip(dt)) this._openGate(gate);
      return;
    }

    let target = null;
    let nearest = Infinity;
    for (const item of field?.items ?? []) {
      if (!isGatherType(item.type) || !item.ready) continue;
      const point = field.aimPoint(item, new THREE.Vector3());
      if (!inSuction(point, origin, dir)) continue;
      const distance = origin.distanceTo(point);
      if (distance < nearest) {
        nearest = distance;
        target = item;
      }
    }
    if (!target) {
      this._stopSuck();
      return;
    }
    this.whisk.setActive(true);
    this.audio?.suckStart();
    this.suckTarget = target;
    this.suckHeld += dt * (0.7 + suctionStrength(nearest) * 0.6);
    this.suckTick += dt;
    const load = Math.min(1, 0.3 + this.suckHeld / GATHER_SECONDS);
    this.audio?.suckSet(load);
    this.whisk.setLevel(load);
    if (this.suckTick > 0.07) {
      this.suckTick = 0;
      const kind = target.type;
      for (let i = 0; i < 2; i++) {
        const point = field.siphon(target);
        if (!point) continue;
        if (kind === 'petal') {
          this.whisk.emitPetal(point);
          if (Math.random() < 0.3) this.whisk.emitDust(point);
        } else if (kind === 'dust') {
          this.whisk.emitDust(point);
          if (Math.random() < 0.45) this.whisk.emitDust(point);
        } else if (kind === 'mote') {
          this.whisk.emitMote(point);
          if (Math.random() < 0.4) this.whisk.emitMote(point);
        } else {
          this.whisk.emitLeaf(point);
          if (Math.random() < 0.4) this.whisk.emitDust(point);
        }
      }
    }
    if (gatherDone(this.suckHeld)) this._finishGather(field, target);
  }

  _finishGather(field, item) {
    if (!item || !item.ready) return;
    const family = item.type;
    item.seen = true;
    // One small hello per family per session, however many patches are gathered.
    const reward = familyReward(family, this.greeted);
    this.greeted.add(family);
    field.drain(item);
    this.whisk.popBundle(family);
    this.audio?.pop();
    if (reward > 0) this.addSparkles(reward, true);
    const name = GATHER_NAMES[family] ?? 'bundle';
    this.hud?.toast(`A ${name}!`, { leaf: '🍂', petal: '🌸', dust: '🌾', mote: '✨' }[family] ?? '✨');
    if (reward > 0) {
      const line = CURIO_LINES[family];
      if (line) {
        this.hud?.showBubble(line, '🐣');
        this.voice?.say(line);
      }
    }
    // What was gathered goes into the basket, so it can be given a home.
    if (BUNDLE_KINDS.includes(family)) {
      const had = basketTotal(this.bundles);
      this.bundles[family] = Math.min(BASKET_MAX, this.bundles[family] + 1);
      this.hud?.setBundles(this.bundles);
      this._saveDirty = true;
      if (had === 0 && !this._basketTold) {
        this._basketTold = true;
        const hint = BASKET_HINT[family];
        if (hint) {
          this.schedule(2.1, () => {
            this.hud?.showBubble(hint, '🐣');
            this.voice?.say(hint);
          });
        }
      }
    }
    this.suckHeld = 0;
    this.suckTick = 0;
    this._stopSuck();
  }

  _stopSuck() {
    const wasWorking = this.suckTarget !== null || this.whisk.level > 0;
    this.suckTarget = null;
    this.suckHeld = 0;
    this.whisk.setLevel(0);
    if (wasWorking) this.audio?.suckStop();
    if (this.tool === 'whisk') this.whisk.setActive(true);
  }

  /**
   * Spend one bundle at a garden spot. A full spot or an empty basket is answered
   * with a friendly pointer and nothing is taken or lost.
   */
  _giveGift(slot) {
    if (!slot) return;
    // A full bed hands every further gift to the arbor behind it, whichever
    // family the child happens to have in the basket.
    if (allSpotsFull(this.gifts)) {
      const kind = this.bundles[slot.kind] > 0
        ? slot.kind
        : BUNDLE_KINDS.find((k) => this.bundles[k] > 0) ?? slot.kind;
      this._giveArbor(kind);
      return;
    }
    const result = giveGift(this.bundles, this.gifts, slot.kind);
    if (!result.ok) {
      const line = result.reason === 'full' ? GIFT_FULL[slot.kind] : GIFT_EMPTY[slot.kind];
      if (line) {
        this.hud.showBubble(line, '🐣');
        this.voice?.say(line);
      }
      return;
    }
    this.bundles = result.bundles;
    this.gifts = result.gifts;
    this.garden?.setGifts(this.gifts);
    this.garden?.flourish(slot.kind);
    this.audio?.give(slot.kind);
    this.hud?.setBundles(this.bundles);
    const [text, icon] = GIFT_TOAST[slot.kind] ?? ['Gift planted!', '✨'];
    this.hud?.toast(text, icon);
    const lines = GIFT_LINES[slot.kind] ?? [];
    const line = lines[Math.min(lines.length - 1, Math.max(0, result.stage - 1))];
    if (line) {
      this.hud?.showBubble(line, '🐣');
      this.voice?.say(line);
    }
    // The last spot filling is the one moment the arbor needs explaining.
    if (allSpotsFull(this.gifts) && !this._arborTold) {
      this._arborTold = true;
      this.schedule(2.2, () => {
        this.hud?.showBubble(ARBOR_HINT, '🐣');
        this.voice?.say(ARBOR_HINT);
      });
    }
    this._save();
  }

  /**
   * A gift for the Moon Arbor. It never turns one away: six lights wake it and a
   * moon moth moves in, then each gift is a wish that calls one more firefly.
   */
  _giveArbor(kind) {
    const result = giveArbor(this.bundles, this.arbor, this.wishes, kind);
    if (!result.ok) {
      const line = ARBOR_EMPTY;
      if (line) {
        this.hud?.showBubble(line, '🐣');
        this.voice?.say(line);
      }
      return;
    }
    this.bundles = result.bundles;
    this.arbor = result.arbor;
    this.wishes = result.wishes;
    this.garden?.setArbor(this.arbor, this.wishes);
    this.garden?.arborFlourish();
    // One sound per event: a light keeps its family's chime, the waking gets the
    // arbor's own low swell and a wish gets its rising sparkle.
    if (!result.woke && !result.wish) this.audio?.give(kind);
    this.hud?.setBundles(this.bundles);

    if (result.woke) {
      const [text, icon] = ARBOR_WAKE_TOAST;
      this.hud?.toast(text, icon);
      this.audio?.arbor();
      const line = ARBOR_LINES[ARBOR_MAX - 1];
      this.hud?.showBubble(line, '🐣');
      this.voice?.say(line);
    } else if (result.wish) {
      this._checkHollowUnlock();
      const [text, icon] = WISH_TOAST;
      this.hud?.toast(text, icon);
      this.audio?.wish();
      const line = moonPhase(this.wishes).line;
      this.hud?.showBubble(line, '🐣');
      this.voice?.say(line);
    } else {
      const [text, icon] = ARBOR_TOAST;
      this.hud?.toast(text, icon);
      const line = ARBOR_LINES[Math.min(ARBOR_LINES.length - 1, Math.max(0, result.stage - 1))];
      this.hud?.showBubble(line, '🐣');
      this.voice?.say(line);
    }
    this._save();
  }

  /** The nearest shut leaf drift the whisk is pointed at, if any. */
  _gateInSuction(origin, dir) {
    let best = null;
    let nearest = Infinity;
    for (const gate of this.gates) {
      if (gate.zoneId !== this.currentZoneId || gate.isOpen || gate.gate.kind !== 'drift') continue;
      const point = gate.centerWorld();
      if (!inSuction(point, origin, dir)) continue;
      const distance = origin.distanceTo(point);
      if (distance < nearest) {
        nearest = distance;
        best = gate;
      }
    }
    return best;
  }

  /**
   * A small door opens. It fires once, keeps one chime and one line, and the
   * hollow behind it is a plain walk-in from then on, in this session and every
   * save after it.
   */
  _openGate(gate) {
    if (!gate || gate.isOpen) return false;
    gate.setOpen(true, { animate: !reducedMotion() });
    gate.spot?.setObscured(false);
    this._refreshHollowPrizes();
    this.gatesOpened.add(gate.gate.id);
    this.audio?.chime(2);
    const ring = gate.gate.kind === 'ring';
    this.fx?.burst(gate.centerWorld(), {
      color: ring ? 0xbfe7ff : 0xd7f2a6,
      count: 22,
      speed: 3,
      life: 1,
      size: 0.5,
      gravity: -1.2,
    });
    this.hud?.showBubble(gate.gate.open, ring ? '🔔' : '🍃');
    this.voice?.say(gate.gate.open);
    this._save();
    return true;
  }

  _fire() {
    if (this.transitioning) return;
    if (this.tool === 'whisk') return;
    if (this.aimHook) {
      this.blaster.fire(this.aimHook.worldPosition.clone(), { type: 'hook', hook: this.aimHook });
      return;
    }
    if (this.aimShop) {
      this.blaster.fire(this.aimShop.momoWorld(), { type: 'momo' });
      return;
    }
    if (this.aimGift) {
      this.blaster.fire(this.aimGift.point.clone(), { type: 'gift', gift: this.aimGift });
      return;
    }
    if (this.aimPad) {
      this.blaster.fire(this.aimPad.group.position.clone(), this.aimPad);
    } else if (this.aimCreature) {
      const target = this.aimCreature.group.position.clone().setY(this.aimCreature.group.position.y + 0.7);
      this.blaster.fire(target, this.aimCreature);
    } else if (this.aimPuzzle) {
      this.blaster.fire(this.aimPuzzle.stone.worldPoint(), {
        type: 'puzzle',
        def: this.aimPuzzle.def,
        site: this.aimPuzzle.site,
        stone: this.aimPuzzle.stone,
      });
    } else if (this.aimCurio) {
      const field = this.curioFields.get(this.currentZoneId);
      const point = field?.aimPoint(this.aimCurio, new THREE.Vector3());
      this.blaster.fire(point ?? null, { type: 'curio', curio: this.aimCurio, field });
    } else if (this.aimGate) {
      this.blaster.fire(this.aimGate.bellWorld(), { type: 'gate', gate: this.aimGate });
    } else {
      this.blaster.fire(null);
    }
  }

  onBoltHit(ref, position) {
    this.fx.burst(position, { color: 0xfff2b0, count: 8, speed: 3, life: 0.5, size: 0.45 });
    if (ref?.type === 'momo') {
      this.openShop();
      return;
    }
    if (ref?.type === 'hook') {
      this._hang(ref.hook);
      return;
    }
    if (ref?.type === 'gift') {
      this._giveGift(ref.gift);
      return;
    }
    if (ref?.type === 'gate') {
      this._openGate(ref.gate);
      return;
    }
    if (ref?.type === 'puzzle') {
      this._answerPuzzle(ref.def, ref.site, ref.stone);
      return;
    }
    if (!ref) return;
    if (ref.type === 'curio') {
      this._hitCurio(ref.field, ref.curio);
      return;
    }
    if (ref.station) {
      ref.station.onPadHit(ref);
      return;
    }
    if (ref.type === 'puff') {
      this._befriend(ref, true);
      return;
    }
    if (ref.type === 'grump') {
      ref.poke();
      this.addSparkles(2, true);
      this.hud.toast('The Grumbleweed giggled away!', '🐛');
    }
  }

  _befriend(creature, byZap) {
    const key = creature.key ?? creature.name;
    if (!creature.scanned) {
      creature.scanned = true;
      this.scannedCreatures.add(key);
      const line = `This is a ${creature.name}. ${creature.fact}`;
      this.hud.showBubble(line, '🐣');
      this.voice.say(line);
      this.hud.toast(`New friend: ${creature.name}`, '💚');
      this.addSparkles(4, true);
      this._save();
    } else if (byZap) {
      this.audio.giggle();
    }
    creature.acknowledge();
    creature.befriended = byZap || creature.befriended;
    const pos = creature.group.position.clone().setY(creature.group.position.y + 1);
    this.fx.burst(pos, { color: 0xffb3d9, count: 14, speed: 3.4, life: 0.9, size: 0.5, gravity: -2 });
  }

  _updateScan(dt) {
    const target = this.creatures.scanTarget;
    if (target && !target.scanned) {
      this.scanTimer += dt;
      if (this.scanTimer > 0.7) {
        this._befriend(target, false);
        this.scanTimer = 0;
      }
    } else {
      this.scanTimer = 0;
    }

    // A listening stone opens to the same patient gaze, if it is close enough.
    const field = this.curioFields.get(this.currentZoneId);
    const stone = this.aimCurio?.type === 'stone' ? this.aimCurio : null;
    if (field && stone && !stone.lit) {
      const point = field.aimPoint(stone, new THREE.Vector3());
      const dist = this.camera.position.distanceTo(point);
      if (curioScanReady('stone', dist, 0)) {
        this.stoneTimer += dt;
        if (this.stoneTimer > 0.7) {
          this.stoneTimer = 0;
          this._listenStone(field, stone);
        }
        return;
      }
    }
    this.stoneTimer = 0;
  }

  /** A zap lands on curious scenery: scatter, ring, or nothing at all. */
  _hitCurio(field, item) {
    const result = field?.zap(item);
    if (!result) return;
    if (result.type === 'crystal' || result.type === 'mote') this.audio?.crystal();
    else this.audio?.rustle();
    const reward = curioReward(result.type, !result.first);
    if (reward > 0) {
      this.addSparkles(reward, true);
      const praise = {
        leaf: ['Leaves everywhere!', '🍂'],
        petal: ['Petal puff!', '🌸'],
        dust: ['Dust puff!', '🌾'],
        mote: ['Mote sparkle!', '✨'],
        crystal: ['Crystal song!', '💎'],
      }[result.type] ?? ['It sparkles!', '✨'];
      this.hud?.toast(praise[0], praise[1]);
      const line = CURIO_LINES[result.type];
      if (line) {
        this.hud?.showBubble(line, '🐣');
        this.voice?.say(line);
      }
    } else {
      this.hud?.toast(CURIO_AGAIN[result.type] ?? 'It hums softly.', '🍃');
    }
  }

  /** A listening stone tells a true little fact, as often as a child asks. */
  _listenStone(field, stone) {
    const result = field?.scan(stone);
    if (!result) return;
    const fact = stoneFact(stone.id);
    this.audio?.scan();
    this.audio?.chime(3);
    this.hud?.showBubble(fact, '🪨');
    this.voice?.say(fact);
    if (result.first) this.addSparkles(CURIO_SPARKLES.stone, true);
  }

  /** Walk near a hidden hollow and it is yours. No button, no question. */
  _updateSecrets(dt, time) {
    this.pickupStreakTimer = Math.max(0, this.pickupStreakTimer - dt);
    if (this.pickupStreakTimer === 0) this.pickupStreak = 0;
    for (const gate of this.gates) {
      if (gate.zoneId !== this.currentZoneId) continue;
      gate.update(dt, time, this.camera.position);
      // Pip says the one thing a non-reading child needs: which tool the door
      // wants. Once per gate per session, and never again once it is open.
      if (!gate.isOpen && this.state === 'play' && gate.distanceTo(this.player.position) < 7
        && !this._gateTold.has(gate.gate.id)) {
        this._gateTold.add(gate.gate.id);
        this.hud?.showBubble(gate.gate.teach, '🐣');
        this.voice?.say(gate.gate.teach);
      }
    }
    for (const spot of this.secretSpots) {
      if (spot.zoneId !== this.currentZoneId) continue;
      // A shut gate keeps its hollow asleep and out of sight.
      if (spot.gate && !spot.gate.isOpen) continue;
      spot.update(dt, time, this.camera.position);
      if (!spot.found && this.state === 'play' && spot.distanceTo(this.player.position) < 2.1) {
        this._findSecret(spot);
      }
    }
    this.discoveryShelf?.update(dt, time);
    this.cairns.get(this.currentZoneId)?.update(dt, time);
  }

  _findSecret(spot) {
    const result = discover(this.secrets, spot.secret.id);
    if (!result.ok) return false;
    this.secrets = result.found;
    spot.take();
    const secret = result.secret;
    const pos = spot.group.position.clone().setY(spot.group.position.y + 0.4);
    this.fx?.burst(pos, { color: secret.color, count: 26, speed: 4.2, life: 1.1, size: 0.55, gravity: -1.6 });
    this.fx?.burst(pos, { color: 0xfff2b0, count: 12, speed: 1.6, life: 1.4, size: 0.8, gravity: 0.4 });
    this.audio?.star();
    this.addSparkles(secret.sparkles, false);
    const status = collectionStatus(this.secrets);
    this.hud?.setDiscoveries(status.count, status.total);
    this.hud?.showBanner(secret.name, 'A hidden treasure!', 3600);
    this.hud?.showBubble(secret.hidden, '🐣');
    this.voice?.say(secret.hidden);
    this.companion?.celebrate();
    this.discoveryShelf?.refresh(this.secrets);
    this.cairns.get(spot.zoneId)?.refresh(this.secrets);
    const bloomBefore = this.hubGrowth?.bloom ?? null;
    this.hubGrowth?.refresh(this.secrets, this.grottoTaken);
    this._celebrateGrowth(bloomBefore);
    this._save();
    if (status.complete) {
      this.hud?.showHint('Every keepsake is home! The grotto behind the Star Tree is awake.', 5200);
      this.schedule(6, () => this.hud?.showBubble('The grotto behind my tree is glowing! Follow the lanterns.', '🌙'));
    }
    return true;
  }

  /**
   * The hub grew because of this find: a soft flourish at the new thing, a chime
   * of its own, and Pip naming what changed. Read from the same `hubBloom` data
   * the world renders from, so words and geometry cannot disagree. Returns the
   * change, or null when the find did not grow anything.
   */
  _celebrateGrowth(before) {
    const growth = this.hubGrowth;
    if (!growth || !before || !growth.bloom) return null;
    const change = growthChange(before, growth.bloom);
    if (!change) return null;
    const reduced = reducedMotion();
    growth.flourish(change, {
      reduced,
      burst: (point, colour) => this.fx?.burst(point, {
        color: colour,
        count: reduced ? 6 : 20,
        speed: reduced ? 0.9 : 1.5,
        life: 1.25,
        size: 0.34,
        gravity: 0.55,
      }),
    });
    this.audio?.grow(change.stageIndex);
    // Waking the grotto has its own announcement; do not say it twice.
    if (change.kinds[0]?.kind === 'grotto') {
      this._lastGrowth = change;
      return change;
    }
    // The keepsake has its own spoken line first; the hub answers just after.
    this.schedule(1.9, () => {
      this.hud?.showBubble(change.line, '🌱');
      this.voice?.say(change.line);
    });
    this._lastGrowth = change;
    return change;
  }

  /** The hub's grotto: whisper while it sleeps, treasure once it is awake. */
  _updateGrotto(dt, time) {
    const growth = this.hubGrowth;
    if (!growth) return;
    growth.update(dt, time);
    if (this.currentZoneId !== 'meadow' || this.state !== 'play') return;
    growth.constrain(this.player.position, (line) => {
      if (!line) return;
      this.hud?.showBubble(line, '🌙');
      this.voice?.say(line);
    }, time);
    if (!this._grottoTold && grottoLoot({ found: this.secrets, taken: this.grottoTaken }).open) {
      const d = Math.hypot(this.player.position.x - growth.grottoCenter.x, this.player.position.z - growth.grottoCenter.z);
      if (d < 14) {
        this._grottoTold = true;
        this.hud?.showBubble('You woke the grotto! There is something in the chest.', '🌙');
        this.voice?.say('You woke the grotto! There is something in the chest.');
      }
    }
    if (growth.atChest(this.player.position)) this._collectGrotto();
  }

  _collectGrotto() {
    const loot = grottoLoot({ found: this.secrets, taken: this.grottoTaken });
    if (!loot.canTake) return false;
    this.grottoTaken = true;
    this.hubGrowth?.takeChest();
    this.addSparkles(loot.sparkles, false);
    this.fx?.burst(this.hubGrowth.chestWorld, { color: 0xfff2b0, count: 30, speed: 3.4, life: 1.3, size: 0.6, gravity: -1.2 });
    this.fx?.burst(this.hubGrowth.chestWorld, { color: 0xffc0d8, count: 14, speed: 1.8, life: 1.5, size: 0.7, gravity: 0.3 });
    this.audio?.star();
    this.hud?.showBanner('Moonwell Treasure', `${loot.sparkles} sparkles!`, 4000);
    this.hubGrowth?.flourishAt(this.hubGrowth.chestWorld, {
      reduced: reducedMotion(),
      colour: 0xfff2b0,
      object: this.hubGrowth.chest,
      burst: (point, colour) => this.fx?.burst(point, { color: colour, count: 14, speed: 2.2, life: 1.1, size: 0.55, gravity: -0.9 }),
    });
    this.audio?.grow(5);
    this.hud?.showBubble(loot.line, '🌙');
    this.voice?.say(loot.line);
    this.companion?.celebrate();
    this._save();
    return true;
  }

  /** A prize hides while its fern door is shut, and forever once taken. */
  _refreshHollowPrizes() {
    for (const [id, prize] of this.hollowPrizes) {
      const taken = this.hollowLoot.includes(id);
      const blocked = prize.loot.gate && !this.gatesOpened.has(prize.loot.gate);
      prize.item.visible = !taken && !blocked;
      prize.glow.visible = !taken;
      prize.glow.material.opacity = taken ? 0.04 : blocked ? 0.14 : 0.26;
    }
  }

  /** Walk up to a prize in the hollow and it is yours. */
  _updateHollow(dt, time) {
    if (this.currentZoneId !== HOLLOW.zone) return;
    for (const [id, prize] of this.hollowPrizes) {
      if (this.hollowLoot.includes(id)) continue;
      const loot = prize.loot;
      if (loot.gate && !this.gatesOpened.has(loot.gate)) continue;
      // The prize hangs inside the island group, so measure in that island's
      // own space rather than against world coordinates.
      const origin = this.islands.get(this.currentZoneId).zone.origin;
      const point = prize.group.position;
      if (Math.hypot(this.player.position.x - origin.x - point.x, this.player.position.z - origin.z - point.z) < 2.1) {
        this._takeHollowLoot(loot);
      }
    }
    void dt;
    void time;
  }

  _takeHollowLoot(loot) {
    if (this.hollowLoot.includes(loot.id)) return false;
    this.hollowLoot.push(loot.id);
    const prize = this.hollowPrizes.get(loot.id);
    if (prize) {
      prize.item.visible = false;
      this.fx?.burst(prize.group.position.clone().setY(prize.group.position.y + 0.7), {
        color: loot.colour,
        count: 24,
        speed: 3.4,
        life: 1.2,
        size: 0.55,
        gravity: -1.3,
      });
    }
    this.audio?.star();
    this.addSparkles(loot.sparkles, false);
    this.hud?.showBanner(loot.name, 'A hidden treasure!', 3600);
    this.hud?.showBubble(loot.line, '🌙');
    this.voice?.say(loot.line);
    this.companion?.celebrate();
    this._save();
    return true;
  }

  // ------------------------------------------------------------- puzzles ----

  /** The level this puzzle asks for, from its own subject's record. */
  _puzzleLevel(def) {
    return levelFor(this.learning, def.subject, this.difficulty[def.subject]);
  }

  _updatePuzzles(dt, time) {
    const calm = reducedMotion();
    const zone = this.islands.get(this.currentZoneId)?.zone;
    if (!zone) return;
    for (const def of puzzlesInZone(zone.id)) {
      const site = this.puzzleSites.get(def.id);
      if (!site) continue;
      site.update(dt, time, this.camera, calm, this.player.position);
      if (this.solvedPuzzles.has(def.id)) {
        site.setReady(false);
        continue;
      }
      // A shut curtain is a real barrier: its hedge ring/valves keep a child
      // outside the pocket until the word or sum is answered.
      const fixed = site.blockPlayer?.(this.player.position);
      if (fixed) {
        this.player.position.x = fixed.x;
        this.player.position.z = fixed.z;
      }
      const d = Math.hypot(
        this.player.position.x - (zone.origin.x + def.at.x),
        this.player.position.z - (zone.origin.z + def.at.z)
      );
      site.setReady(d < PUZZLE_WAKE_RADIUS + 8);
      if (d < PUZZLE_WAKE_RADIUS && !this._puzzleTold.has(def.id)) this._teachPuzzle(def, site);
    }
  }

  /**
   * The only invitation is Pip, once, when the child is close enough to see the
   * stones. No marker, no arrow, no floating question.
   */
  _teachPuzzle(def, site) {
    this._puzzleTold.add(def.id);
    site.setReady(true);
    this.audio.chime(2);
    this.hud.showBubble(def.instruction, def.icon);
    this.voice.say(def.instruction);
    this.fx?.burst(site.centerWorld(), { color: 0xffe6b0, count: 12, speed: 1.5, life: 0.9, size: 0.4 });
    if (def.kind === 'sound') {
      this.timers.push({ t: 2.3, fn: () => this.audio.creatureCall(def.call) });
    }
    if (def.kind === 'pattern' && def.sequence) {
      // Three rising notes mirror the three shapes a child must enter.
      def.sequence.forEach((_, i) => {
        this.timers.push({ t: 2.1 + i * 0.55, fn: () => this.audio.chime(i) });
      });
    }
  }

  _answerPuzzle(def, site, stone) {
    if (!def || !site || !stone || this.solvedPuzzles.has(def.id)) return false;
    if (def.sequence?.length) return this._answerPattern(def, site, stone);
    if (isCorrect(def, stone.id)) {
      this._solvePuzzle(def, site);
      return true;
    }
    this._wrongPuzzle(def, site, stone, 0);
    return false;
  }

  /**
   * One shape at a time. A correct step lights that socket and plays one note;
   * a wrong one keeps every step already earned, so the row only ever grows.
   */
  _answerPattern(def, site, stone) {
    const progress = this.puzzleProgress.get(def.id) ?? 0;
    if (isSequenceCorrect(def, progress, stone.id)) {
      const next = progress + 1;
      this.puzzleProgress.set(def.id, next);
      site.applyStep(next);
      this.audio.chime(Math.min(4, next));
      stone.setState('correct');
      const thisStone = stone;
      this.timers.push({
        t: 0.45,
        fn: () => {
          if (!this.solvedPuzzles.has(def.id) && thisStone.state === 'correct') thisStone.setState('active');
        },
      });
      if (patternComplete(def, next)) this._solvePuzzle(def, site);
      return true;
    }
    this._wrongPuzzle(def, site, stone, progress);
    return false;
  }

  /** The shared reward for any world puzzle, whatever it asked. */
  _solvePuzzle(def, site) {
    const misses = this.puzzleMisses.get(def.id) ?? 0;
    this.learning = recordAttempt(this.learning, def.subject, { misses });
    this.puzzleMisses.delete(def.id);
    this.puzzleProgress.delete(def.id);
    this.solvedPuzzles.add(def.id);
    site.applySolved(true, !reducedMotion());
    this.addSparkles(PUZZLE_SPARKLES, false);
    this.audio.correct();
    this.companion?.celebrate();
    this.hud.showBanner(def.title, `${PUZZLE_SPARKLES} sparkles`, 3600);
    const line = successLine(def);
    this.hud.showBubble(line, def.icon);
    this.voice.say(line);
    this.fx?.fountain(site.centerWorld(), 0xffe6b0, 34);
    this._save();
    return true;
  }

  /**
   * A wrong stone flickers, Pip repeats the question and the hint arrives by
   * itself. After enough misses one wrong stone that is not needed any more
   * lies down; progress is never lost.
   */
  _wrongPuzzle(def, site, stone, progress = 0) {
    const misses = (this.puzzleMisses.get(def.id) ?? 0) + 1;
    this.puzzleMisses.set(def.id, misses);
    this.audio.wrong();
    this.companion?.droop();
    stone.setState('wrong');
    this.hud.showFeedback('Try again!', 'again');
    const level = this._puzzleLevel(def);
    const dim = dimmedChoices(def, misses, level, progress);
    this.timers.push({
      t: 0.7,
      fn: () => {
        if (this.solvedPuzzles.has(def.id)) return;
        for (const id of dim) site.setStateFor(id, 'dim');
        if (!dim.includes(stone.id)) stone.setState('active');
      },
    });
    const needed = new Set(def.sequence ? def.sequence.slice(progress) : [def.answer]);
    const wrongChoices = def.choices.filter((c) => !needed.has(c.id));
    const last = wrongChoices.length > 0 && wrongChoices.every((c) => dim.includes(c.id));
    this.voice.say(wrongLine(def, { last }));
    if (def.kind === 'sound') {
      this.timers.push({ t: 1.3, fn: () => this.audio.creatureCall(def.call) });
    }
    this.timers.push({
      t: hintDelay(level) + 1.4,
      fn: () => {
        if (this.solvedPuzzles.has(def.id)) return;
        const hint = def.hint;
        this.hud.showBubble(hint, def.icon);
        this.voice.say(hint);
        if (def.kind === 'sound') this.audio.creatureCall(def.call);
      },
    });
  }

  _portalLocked(def) {
    return def?.needs === HOLLOW.needs && !this.hollowOpen;
  }

  /**
   * The sleeping arch wakes on the child's first real wish. It fires on the
   * exact gift that grants it, says one thing, plays one sound and is saved, so
   * a resumed save is already awake and a legacy save stays asleep.
   */
  _checkHollowUnlock() {
    if (this.hollowOpen) return false;
    if (!hollowAwake({ wishes: this.wishes, hollow: false })) return false;
    this.hollowOpen = true;
    this._hollowTold = true;
    if (this.hollowPortal?.sleep) this.hollowPortal.sleep.visible = false;
    this.audio?.unlock();
    if (this.hollowPortal) {
      this.fx?.burst(this.hollowPortal.worldPosition.clone(), {
        color: 0xffc07a,
        count: 24,
        speed: 3.2,
        life: 1.1,
        size: 0.55,
        gravity: -1.1,
      });
    }
    this.hud?.showBubble(HOLLOW.wake, '🌙');
    this.voice?.say(HOLLOW.wake);
    this._save();
    return true;
  }

  _checkPortals() {
    if (this.transitioning || this.portalCooldown > 0) return;
    const data = this.currentData;
    if (!data) return;
    for (const portal of data.portals) {
      const distance = portal.worldPosition.distanceTo(this.camera.position);
      if (this._portalLocked(portal.def)) {
        // One hint, once a session, and no sound or toast: the arch simply
        // explains itself the first time a child walks up to it.
        if (distance < 6 && !this._hollowTold) {
          this._hollowTold = true;
          this.hud?.showBubble(HOLLOW.asleep, '🌙');
          this.voice?.say(HOLLOW.asleep);
        }
        continue;
      }
      if (distance < 3.4) {
        this.travelTo(portal.def.to);
        return;
      }
    }
  }

  /**
   * When a child stands still with nothing on screen to do, Pip drifts towards
   * the nearest unsolved sign and says where it is. It never fires while a sign
   * is already talking, so it cannot talk over an activity.
   */
  _updateCompanionHint(dt) {
    if (!this.companion) return;
    const moving = Math.hypot(this.player.velocity.x, this.player.velocity.z) > 0.4;
    this.idleTimer = moving || this.aimPad ? 0 : this.idleTimer + dt;
    // Pip's Bell makes the nudge arrive much sooner.
    if (this.idleTimer < (this.hasUpgrade('bell') ? 3.5 : 9)) return;
    const stations = this.currentData?.stations ?? [];
    if (stations.some((s) => s.active)) return;
    // A puzzle explains itself when the child arrives; Pip should not also
    // point at a sign across the island and talk over it.
    const zone = this.currentData?.zone;
    if (zone) {
      const nearPuzzle = puzzlesInZone(this.currentZoneId).some((p) => {
        if (this.solvedPuzzles.has(p.id)) return false;
        return Math.hypot(
          this.player.position.x - (zone.origin.x + p.at.x),
          this.player.position.z - (zone.origin.z + p.at.z)
        ) < 17;
      });
      if (nearPuzzle) return;
    }
    if (!this.companion.canPoint()) return;
    const next = stations
      .filter((s) => !s.solved)
      .sort((a, b) => a.distanceTo(this.player.position) - b.distanceTo(this.player.position))[0];
    if (!next) return;
    if (!this.companion.pointAt(next.center)) return;
    const line = 'Over there! A sign is waiting for you.';
    this.hud.showHint('Pip: over there — a sign is waiting!', 3600);
    this.voice.say(line);
    this.idleTimer = 3;
  }

  /**
   * Distant islands are deep inside the fog, so hiding them saves a lot of
   * drawing without changing anything a child can see.
   */
  _updateVisibility() {
    const cam = this.camera.position;
    for (const [id, data] of this.islands) {
      const near = data.island.distanceTo(cam.x, cam.z) < 210;
      if (data.island.group.visible !== near) data.island.group.visible = near;
      if (data.sky && data.sky.visible !== near) data.sky.visible = near;
      for (const station of data.stations) station.setVisible(near);
      this.creatures.setZoneVisible(id, near);
      if (this.market && this.marketZoneId === id) this.market.group.visible = near;
    }
  }

  // ------------------------------------------------------------------ tree --

  _updateWishTree(dt, time) {
    const tree = this.wishTree;
    if (!tree) return;
    const count = this.starCount();
    const targetAura = count >= ZONE_STAR_ORDER.length ? 0.16 + Math.sin(time * 0.9) * 0.04 : count * 0.025;
    tree.aura.material.opacity = damp(tree.aura.material.opacity, targetAura, 2, dt);

    tree.motes.forEach((m, i) => {
      const base = tree.moteBases[i];
      const a = m.a + time * 0.12 * m.speed;
      m.sprite.position.set(Math.cos(a) * m.r, base.y + Math.sin(time * 0.8 + m.phase) * 0.5, Math.sin(a) * m.r);
      m.sprite.material.opacity = 0.35 + Math.sin(time * 2 + m.phase) * 0.2;
    });

    if (count >= ZONE_STAR_ORDER.length) {
      tree.canopy.children.forEach((c, i) => {
        c.scale.setScalar(1 + Math.sin(time * 1.4 + i) * 0.03);
      });
    }
    tree.sockets.forEach((s, i) => {
      if (s.berry.visible) {
        s.ring.scale.setScalar(1 + Math.sin(time * 2.6 + i) * 0.06);
        s.glow.material.opacity = 0.5 + Math.sin(time * 2.2 + i) * 0.2;
      }
    });
  }

  _checkEnding() {
    if (this.endingPlayed || this.currentZoneId !== 'meadow') return;
    if (this.starCount() < ZONE_STAR_ORDER.length) return;
    if (this.wishTreePosition.distanceTo(this.player.position) > 9) return;
    this._playEnding();
  }

  _playEnding() {
    this.endingPlayed = true;
    this.state = 'ending';
    this.endingTimer = 0;
    this.input.enabled = false;
    this.input.releaseLock();
    this.audio.setZone('ending');
    this.audio.star();
    this.fx.fountain(this.wishTreePosition.clone().setY(this.wishTreePosition.y + 6), 0xfff2b0, 90);
    this.hud.showBanner('The Star Tree is awake!', '✨🌟✨', 5200);
    this.voice.stop();
    this._sayThen([
      { text: 'You did it! The Star Tree is awake, and every light in the hollow is singing.', face: '🌟' },
      { text: 'Thank you, explorer. The meadow will remember you forever.', face: '🐣' },
    ]);
    this.schedule(9.5, () => {
      this.hud.setVisible(false);
      this.hud.showEnding([
        ['Sparkles', this.sparkleCount],
        ['Starberries', `${this.starCount()}/${ZONE_STAR_ORDER.length}`],
        ['Signs solved', this.solvedStations.size],
        ['Friends met', this.scannedCreatures.size],
      ]);
    });
    this._save();
  }

  continueAfterEnding() {
    this.hud.hideEnding();
    this.hud.setVisible(true);
    this.state = 'play';
    this._updateGoal();
    this.input.enabled = true;
    this.audio.setZone(this.currentZoneId);
    this.input.requestLock();
    this.hud.showBubble('You can keep exploring forever. There are still sparkles hiding everywhere!', '🐣');
    this.voice.say('You can keep exploring forever. There are still sparkles hiding everywhere!');
  }

  // ------------------------------------------------------------------ save --

  flushProgress() {
    if (this._saveDirty) this._save();
  }

  _save() {
    this._saveDirty = !writeSave({
      zone: this.currentZoneId,
      sparkles: this.sparkleCount,
      stars: this.stars,
      solved: [...this.solvedStations],
      scanned: [...this.scannedCreatures],
      visited: [...this.visited],
      upgrades: [...this.upgrades],
      shards: [...this.shards],
      placed: [...this.placed],
      bundles: this.bundles,
      gifts: this.gifts,
      arbor: this.arbor,
      wishes: this.wishes,
      learning: this.learning,
      difficulty: this.difficulty,
      secrets: this.secrets,
      gates: [...this.gatesOpened],
      hollow: this.hollowOpen,
      hollowLoot: [...this.hollowLoot],
      puzzles: [...this.solvedPuzzles],
      grotto: this.grottoTaken,
      ended: this.endingPlayed,
    });
  }

  _load() {
    const save = loadSave();
    if (!save) return;
    this.sparkleCount = save.sparkles ?? 0;
    this.stars = save.stars ?? {};
    (save.solved ?? []).forEach((id) => this.solvedStations.add(id));
    (save.scanned ?? []).forEach((k) => this.scannedCreatures.add(k));
    this.visited = new Set(save.visited ?? []);
    this.upgrades = new Set(save.upgrades ?? []);
    this.shards = new Set(save.shards ?? []);
    this.placed = new Set(save.placed ?? []);
    this.learning = save.learning ?? emptyReport();
    this.difficulty = save.difficulty ?? sanitizeDifficulty(null);
    this.secrets = sanitizeSecrets(save.secrets);
    this.gatesOpened = new Set(sanitizeGates(save.gates));
    for (const gate of this.gates) {
      gate.setOpen(this.gatesOpened.has(gate.gate.id), { animate: false });
      gate.spot?.setObscured(!gate.isOpen);
    }
    this.solvedPuzzles = new Set(sanitizePuzzles(save.puzzles));
    this.puzzleProgress.clear();
    for (const [id, site] of this.puzzleSites) {
      const wasSolved = this.solvedPuzzles.has(id);
      site.applySolved(wasSolved, false);
      if (wasSolved) this._puzzleTold.add(id);
    }
    this.grottoTaken = save.grotto === true;
    this.bundles = sanitizeBundles(save.bundles);
    this.gifts = sanitizeGifts(save.gifts);
    this.arbor = arborStage(save.arbor);
    this.wishes = wishCount(save.wishes);
    // Awake on load means awake silently: no sound, no line, no repeat.
    this.hollowLoot = sanitizeHollowLoot(save.hollowLoot);
    this._refreshHollowPrizes();
    this.hollowOpen = save.hollow === true || hollowAwake({ wishes: this.wishes, hollow: false });
    this._hollowTold = this.hollowOpen;
    if (this.hollowPortal?.sleep) this.hollowPortal.sleep.visible = !this.hollowOpen;
    this.garden?.setGifts(this.gifts);
    this.garden?.setArbor(this.arbor, this.wishes);
    // A resumed save already has the arbor, so do not explain it again.
    this._arborTold = this.arbor > 0;
    for (const spot of this.secretSpots) spot.setFound(this.secrets.includes(spot.secret.id));
    this.discoveryShelf?.refresh(this.secrets);
    for (const cairn of this.cairns.values()) cairn.refresh(this.secrets);
    this.hubGrowth?.refresh(this.secrets, this.grottoTaken);
    const found = collectionStatus(this.secrets);
    this.hud.setDiscoveries(found.count, found.total);
    this.endingPlayed = save.ended && this.starCount() === ZONE_STAR_ORDER.length;
    if (this.islands.has(save.zone)) this.currentZoneId = save.zone;

    for (const station of this.stations) {
      if (this.solvedStations.has(station.def.id)) station.restoreSolved();
    }
    for (const c of this.creatures.creatures) {
      if (c.key && this.scannedCreatures.has(c.key)) c.scanned = true;
    }
    for (const zoneId of ZONE_STAR_ORDER) {
      if (!this.stars[zoneId]) continue;
      const socketIndex = ZONE_STAR_ORDER.indexOf(zoneId);
      const socket = this.wishTree?.sockets[socketIndex];
      if (socket) {
        socket.berry.visible = true;
        socket.glow.material.opacity = 0.7;
      }
    }
    // A zone that was finished but whose berry was never picked up gets one.
    for (const [id, data] of this.islands) {
      if (id === 'meadow' || this.stars[id] || !ZONE_STAR_ORDER.includes(id)) continue;
      const all = data.zone.stations.every((s) => this.solvedStations.has(s.id));
      if (all) this._spawnStarberry(data.zone);
    }
    this.hud.setStars(this.starCount(), ZONE_STAR_ORDER.length);
    this.hud.setSparkles(this.sparkleCount);
    this.hud.setBundles(this.bundles);
    this._applyUpgrades();
    this._applyWorkshopState();
    this._refreshPortalBadges();
  }

  // ----------------------------------------------------------------- update --

  update(dt, time) {
    for (let i = this.timers.length - 1; i >= 0; i--) {
      this.timers[i].t -= dt;
      if (this.timers[i].t <= 0) {
        const fn = this.timers[i].fn;
        this.timers.splice(i, 1);
        fn();
      }
    }

    this.sky.update(dt, this.camera, time);
    this._updateVisibility();
    this._updateWishTree(dt, time);
    this.workshop?.update(dt, time, this.camera.position);
    this.fx.update(dt);
    this.blaster.update(dt, time);
    this.whisk.update(dt, time);

    if (this.state === 'paused' || this.state === 'title') return;

    this.portalCooldown = Math.max(0, this.portalCooldown - dt);
    this._updateTool(dt);

    if (this.state === 'shop') {
      this.market?.update(dt, time, this.camera.position);
      this.audio.update(dt);
      return;
    }

    if (this.state === 'play') {
      this.player.update(dt);
      this.companion.update(dt, time, this.player);
      this._updateZoneDetection();

      const data = this.currentData;
      if (data) {
        const zonePuzzles = puzzlesInZone(data.zone.id);
        const atPuzzle = zonePuzzles.some((p) => {
          if (this.solvedPuzzles.has(p.id)) return false;
          const px = data.zone.origin.x + p.at.x;
          const pz = data.zone.origin.z + p.at.z;
          return Math.hypot(this.player.position.x - px, this.player.position.z - pz) < 11;
        });
        for (const station of data.stations) station.update(dt, time, this.camera, this.player.position, atPuzzle);
        for (const portal of data.portals) {
          // A sleeping arch is dim and still: no swirl, no pulse, no beacon. The
          // bramble over it is the only thing that moves, and only a little.
          const sleeping = this._portalLocked(portal.def);
          if (!sleeping) portal.swirl.rotation.z += dt * 0.7;
          portal.veil.material.opacity = sleeping ? 0.1 : 0.3 + Math.sin(time * 2 + portal.def.x) * 0.08;
          portal.icon.position.y = 5.9 + Math.sin(time * 1.5) * 0.12;
          portal.glow.material.opacity = sleeping ? 0.05 : 0.14 + Math.sin(time * 1.8) * 0.05;
          portal.beam.material.opacity = sleeping ? 0.02 : 0.1;
        }
        this._checkPortals();
      }

      const forward = this.player.forwardFlat();
      this.creatures.update(dt, time, this.camera.position, forward, this.currentZoneId);
      this.sparkles.update(dt, this.camera.position, time);
      this._updateShards(dt, time);
      this._updateScan(dt);
      this._updateSecrets(dt, time);
      this.curioFields.get(this.currentZoneId)?.update(dt, time);
      this._updatePuzzles(dt, time);
      this.garden?.update(dt, time);
      if (this.currentZoneId === HOLLOW.zone) {
        this.hollowLife?.update(dt, time);
        this._updateHollow(dt, time);
      }
      this._updateGrotto(dt, time);

      for (const [zoneId, berry] of Object.entries(this.starberries)) {
        if (berry.state === 'collected') {
          delete this.starberries[zoneId];
          continue;
        }
        berry.update(dt, time, this.camera.position);
        if (berry.state === 'collected') {
          this._collectStarberry(zoneId);
          delete this.starberries[zoneId];
        }
      }

      this._updateMarket(dt, time);
      this._updateAim();
      if (this.input.consumeFire()) this._fire();
      this._checkEnding();
      this._updateCompanionHint(dt);
    }

    if (this.state === 'ending') {
      this.endingTimer += dt;
      this.confettiTimer -= dt;
      if (this.confettiTimer <= 0) {
        this.confettiTimer = 0.5;
        const a = Math.random() * Math.PI * 2;
        const p = this.wishTreePosition
          .clone()
          .add(new THREE.Vector3(Math.cos(a) * 4, 6 + Math.random() * 5, Math.sin(a) * 4));
        this.fx.fountain(p, [0xfff2b0, 0xffc0d8, 0x8dffd0, 0xc9a8ff][Math.floor(Math.random() * 4)], 22);
      }
      this.wishTree?.canopy.children.forEach((c, i) => {
        c.scale.setScalar(1 + Math.sin(time * 3 + i) * 0.06);
      });
      this.creatures.update(dt, time, this.camera.position, this.player.forwardFlat(), this.currentZoneId);
      this.sparkles.update(dt, this.camera.position, time);
      this.companion.update(dt, time, this.player);
    }

    this._saveAccum += dt;
    if (this._saveDirty && this._saveAccum > 5) {
      this._saveAccum = 0;
      this._save();
    }

    this.audio.update(dt);
  }

  /** Called on window resize / first frame. */
  refreshCamera() {
    this.camera.updateProjectionMatrix();
  }

  clampSparklesForDisplay() {
    return clamp(this.sparkleCount, 0, 99999);
  }
}
