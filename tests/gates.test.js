import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SECRETS,
  GATES,
  GATE_IDS,
  gateById,
  gateForSecret,
  gatesForZone,
  sanitizeGates,
  gateVerb,
  gateBlocks,
  secretById,
} from '../src/game/secrets.js';
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

test('two keepsakes sleep behind a small door, one per tool', () => {
  assert.equal(GATES.length, 2);
  assert.equal(new Set(GATE_IDS).size, 2);
  for (const gate of GATES) {
    const secret = secretById(gate.secretId);
    assert.ok(secret, `${gate.id} must guard a real secret`);
    assert.equal(secret.zone, gate.zone, 'a gate sits on its secret’s island');
    assert.ok(['drift', 'ring'].includes(gate.kind));
    assert.ok(gate.teach && gate.open, `${gate.id} needs words for a child`);
    // Close enough to hide the hollow, far enough that the find is behind it.
    const gap = Math.hypot(secret.at.x - gate.at.x, secret.at.z - gate.at.z);
    assert.ok(gap > 2.1, `${gate.id} must not sit on the hollow itself`);
    assert.ok(gap < 4.5, `${gate.id} must be reachable in one step`);
    assert.equal(gateVerb(gate.kind), gate.kind === 'drift' ? 'whisk' : 'bolt');
  }
  assert.equal(gateForSecret('grove-book').id, 'grove-drift');
  assert.equal(gateForSecret('peaks-chart').id, 'peaks-frost');
  assert.equal(gateForSecret('meadow-nest'), null, 'only two are guarded');
  assert.deepEqual(gatesForZone('grove').map((g) => g.id), ['grove-drift']);
});

test('the other eleven hollows are still a plain walk-in', () => {
  const guarded = SECRETS.filter((s) => s.gate).map((s) => s.id);
  assert.deepEqual(guarded.sort(), ['grove-book', 'peaks-chart']);
  assert.equal(SECRETS.length - guarded.length, 11);
});

test('a gate id only counts once and only when it is real', () => {
  assert.deepEqual(sanitizeGates(['grove-drift', 'invented', 'grove-drift', 'peaks-frost']), [
    'grove-drift',
    'peaks-frost',
  ]);
  assert.deepEqual(sanitizeGates(undefined), []);
  assert.deepEqual(sanitizeGates('grove-drift'), []);
  assert.deepEqual(sanitizeGates([1, null, 'grove-drift']), ['grove-drift']);
});

test('a shut gate blocks its hollow, an opened one never does again', () => {
  const gate = gateById('peaks-frost');
  assert.equal(gateBlocks(gate, []), true);
  assert.equal(gateBlocks(gate, ['grove-drift']), true);
  assert.equal(gateBlocks(gate, ['peaks-frost']), false);
  assert.equal(gateBlocks(null, []), false, 'an unguarded hollow is always open');
});

test('opened doors survive a save, and a legacy save opens them shut', () => {
  writeSave({ sparkles: 4, gates: ['grove-drift', 'invented-gate', 'grove-drift'] });
  assert.deepEqual(loadSave().gates, ['grove-drift']);
  writeSave({ sparkles: 4, gates: ['peaks-frost', 'grove-drift'] });
  assert.deepEqual(loadSave().gates, ['peaks-frost', 'grove-drift'], 'order follows the save');
  // A save written before the gates existed still loads, with both doors shut.
  writeSave({ sparkles: 1, secrets: ['meadow-nest'] });
  assert.deepEqual(loadSave().gates, []);
  assert.deepEqual(loadSave().secrets, ['meadow-nest']);
});
