import test from 'node:test';
import assert from 'node:assert/strict';
import { SHOP_ITEMS, itemById, purchase, shopStatus } from '../src/game/shop.js';
import { writeSave, loadSave } from '../src/engine/save.js';

let store;
test.beforeEach(() => {
  store = new Map();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => store.set(k, v),
      removeItem: (k) => store.delete(k),
    },
  });
});

test('the market offers four distinct gifts a child can afford after one island', () => {
  assert.equal(SHOP_ITEMS.length, 4);
  assert.equal(new Set(SHOP_ITEMS.map((item) => item.id)).size, 4);
  for (const item of SHOP_ITEMS) {
    assert.ok(Number.isInteger(item.price) && item.price > 0, `${item.id} needs a whole-number price`);
    assert.ok(item.icon && item.name && item.line && item.blurb, `${item.id} needs pictures and a spoken line`);
  }
  // One island pays 6 sparkles per sign plus its scattered sparkles, which is
  // comfortably more than the cheapest gift.
  const oneIsland = 5 * 6 + 20;
  assert.ok(SHOP_ITEMS[0].price <= oneIsland);
  const prices = SHOP_ITEMS.map((item) => item.price);
  assert.deepEqual(prices, [...prices].sort((a, b) => a - b), 'prices climb so saving has a shape');
});

test('buying a gift takes exactly its price and remembers it', () => {
  const result = purchase({ owned: [], sparkles: 100 }, 'magnet');
  assert.equal(result.ok, true);
  assert.deepEqual(result.owned, ['magnet']);
  assert.equal(result.sparkles, 100 - itemById('magnet').price);
  assert.equal(result.item.id, 'magnet');
});

test('a child who cannot afford a gift keeps every sparkle', () => {
  const result = purchase({ owned: [], sparkles: 10 }, 'rainbow');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'cost');
  assert.equal(result.sparkles, 10);
  assert.deepEqual(result.owned, []);
  assert.equal(result.missing, itemById('rainbow').price - 10);
});

test('a gift already owned is never charged twice', () => {
  const result = purchase({ owned: ['bell'], sparkles: 500 }, 'bell');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'owned');
  assert.equal(result.sparkles, 500);
  assert.deepEqual(result.owned, ['bell']);
});

test('unknown gifts are refused instead of throwing', () => {
  const result = purchase({ owned: [], sparkles: 500 }, 'castle');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unknown');
  assert.equal(result.sparkles, 500);
});

test('cards read as owned, ready or saving', () => {
  const status = shopStatus({ owned: ['magnet'], sparkles: 80 });
  assert.deepEqual(status.map((item) => item.status), ['owned', 'ready', 'saving', 'saving']);
  assert.equal(status[0].owned, true);
  assert.equal(status[2].affordable, false);
  assert.equal(status[0].icon, '🧲');
});

test('every gift can be collected in one shopping trip', () => {
  let state = { owned: [], sparkles: 400 };
  for (const item of SHOP_ITEMS) {
    const result = purchase(state, item.id);
    assert.equal(result.ok, true);
    state = { owned: result.owned, sparkles: result.sparkles };
  }
  const spent = SHOP_ITEMS.reduce((sum, item) => sum + item.price, 0);
  assert.equal(state.sparkles, 400 - spent);
  assert.equal(state.owned.length, 4);
});

test('bought gifts survive a save and reload, and old saves still open', () => {
  writeSave({ sparkles: 12, upgrades: ['magnet', 'rainbow', 'magnet', 7, null] });
  assert.deepEqual(loadSave().upgrades, ['magnet', 'rainbow']);
  assert.equal(loadSave().sparkles, 12);

  writeSave({ sparkles: 3, solved: ['meadow-shape'] });
  assert.deepEqual(loadSave().upgrades, []);
  assert.deepEqual(loadSave().solved, ['meadow-shape']);
});
