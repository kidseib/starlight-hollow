import * as THREE from 'three';
import { ZONES, ZONE_BY_ID, ZONE_STAR_ORDER, PIP_LINES } from '../content.js';
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
  totalAttempts,
} from './progress.js';
import { renderProgressPanel } from '../ui/progressPanel.js';
import { discover, sanitizeSecrets, collectionStatus, secretsForZone } from './secrets.js';
import { SecretSpot, DiscoveryShelf, KeepsakeCairn } from '../world/discoveries.js';
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
    this.discoveryShelf = null;
    this.cairns = new Map();
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
      if (zone.kind === 'hub') blockers.push({ x: 0, z: 4, r: 8 });
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
        const y = island.heightAtLocal(def.x, def.z);
        portal.group.position.set(def.x, y, def.z);
        portal.group.rotation.y = Math.atan2(-def.x, -def.z);
        island.group.add(portal.group);
        portals.push({
          ...portal,
          def,
          worldPosition: new THREE.Vector3(zone.origin.x + def.x, zone.origin.y + y + 1.6, zone.origin.z + def.z),
        });
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
    this.input.enabled = true;
    this.state = 'play';
    this.input.requestLock();
    this.audio.resume();
    this.voice.warmUp();
    this.hud.setStars(this.starCount(), ZONE_STAR_ORDER.length);
    this.hud.setSparkles(this.sparkleCount);
    this._updateGoal();
    this.hud.setZone(ZONE_BY_ID[this.currentZoneId].name);

    const intro = this.visited.size > 0 ? [{ text: ZONE_GREETINGS[this.currentZoneId], face: this.currentZoneId === 'meadow' ? '🌻' : '✨' }] : [
      { text: PIP_LINES.intro, face: '🐣' },
      { text: PIP_LINES.intro2, face: '🐣' },
      { text: PIP_LINES.goal, face: '✨' },
    ];
    this._sayThen(intro);
    this.visited.add(this.currentZoneId);
    this._save();
  }

  pause() {
    if (this.state !== 'play') return;
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
    this._marketHinted = false;
    this.sky.applyZone(data.zone);
    this.audio.setZone(zoneId);
    this.hud.setZone(data.zone.name);

    const { island, zone } = data;
    this.player.setWorld(
      (x, z) => island.groundAt(x, z),
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
    this.hud.setCrosshairHot(!!(bestPad || this.aimCreature || this.aimShop || this.aimHook));
  }

  _fire() {
    if (this.transitioning) return;
    if (this.aimHook) {
      this.blaster.fire(this.aimHook.worldPosition.clone(), { type: 'hook', hook: this.aimHook });
      return;
    }
    if (this.aimShop) {
      this.blaster.fire(this.aimShop.momoWorld(), { type: 'momo' });
      return;
    }
    if (this.aimPad) {
      this.blaster.fire(this.aimPad.group.position.clone(), this.aimPad);
    } else if (this.aimCreature) {
      const target = this.aimCreature.group.position.clone().setY(this.aimCreature.group.position.y + 0.7);
      this.blaster.fire(target, this.aimCreature);
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
    if (!ref) return;
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
  }

  /** Walk near a hidden hollow and it is yours. No button, no question. */
  _updateSecrets(dt, time) {
    this.pickupStreakTimer = Math.max(0, this.pickupStreakTimer - dt);
    if (this.pickupStreakTimer === 0) this.pickupStreak = 0;
    for (const spot of this.secretSpots) {
      if (spot.zoneId !== this.currentZoneId) continue;
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
    this._save();
    if (status.complete) {
      this.hud?.showHint('You found every hidden treasure in the Hollow!', 4200);
    }
    return true;
  }

  _checkPortals() {
    if (this.transitioning || this.portalCooldown > 0) return;
    const data = this.currentData;
    if (!data) return;
    for (const portal of data.portals) {
      if (portal.worldPosition.distanceTo(this.camera.position) < 3.4) {
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
      learning: this.learning,
      difficulty: this.difficulty,
      secrets: this.secrets,
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
    for (const spot of this.secretSpots) spot.setFound(this.secrets.includes(spot.secret.id));
    this.discoveryShelf?.refresh(this.secrets);
    for (const cairn of this.cairns.values()) cairn.refresh(this.secrets);
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
      if (id === 'meadow' || this.stars[id]) continue;
      const all = data.zone.stations.every((s) => this.solvedStations.has(s.id));
      if (all) this._spawnStarberry(data.zone);
    }
    this.hud.setStars(this.starCount(), ZONE_STAR_ORDER.length);
    this.hud.setSparkles(this.sparkleCount);
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

    if (this.state === 'paused' || this.state === 'title') return;

    this.portalCooldown = Math.max(0, this.portalCooldown - dt);

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
        for (const station of data.stations) station.update(dt, time, this.camera, this.player.position);
        for (const portal of data.portals) {
          portal.swirl.rotation.z += dt * 0.7;
          portal.veil.material.opacity = 0.3 + Math.sin(time * 2 + portal.def.x) * 0.08;
          portal.icon.position.y = 5.9 + Math.sin(time * 1.5) * 0.12;
          portal.glow.material.opacity = 0.14 + Math.sin(time * 1.8) * 0.05;
        }
        this._checkPortals();
      }

      const forward = this.player.forwardFlat();
      this.creatures.update(dt, time, this.camera.position, forward, this.currentZoneId);
      this.sparkles.update(dt, this.camera.position, time);
      this._updateShards(dt, time);
      this._updateScan(dt);
      this._updateSecrets(dt, time);

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
