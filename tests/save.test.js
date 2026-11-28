import test from 'node:test';
import assert from 'node:assert/strict';
import { writeSave, loadSave, clearSave } from '../src/engine/save.js';
import { emptyReport, sanitizeDifficulty, recordAttempt } from '../src/game/progress.js';
const key = 'starlight-hollow-save-v1';
let store;
test.beforeEach(() => { store = new Map(); Object.defineProperty(globalThis, 'localStorage', { configurable:true, value: { getItem:k=>store.get(k) ?? null, setItem:(k,v)=>store.set(k,v), removeItem:k=>store.delete(k) } }); });
test('old saves keep progress and default to the meadow', () => {
  writeSave({solved:['peaks-ab'], sparkles:9});
  assert.deepEqual(loadSave().solved,['peaks-ab']); assert.equal(loadSave().zone,'meadow'); assert.equal(loadSave().sparkles,9);
});
test('malformed fields cannot break game initialization', () => {
  writeSave({solved:{}, scanned:'bad', visited:[1,'cove','cove'], stars:{cove:true,grove:'false'},sparkles:-1,ended:'yes'});
  assert.deepEqual(loadSave(), {solved:[],scanned:[],visited:['cove'],stars:{cove:true},sparkles:0,upgrades:[],shards:[],placed:[],
    learning:emptyReport(), difficulty:sanitizeDifficulty(null), secrets:[], gates:[], grotto:false, hollow:false, hollowLoot:[], puzzles:[],
    bundles:{petal:0,dust:0,mote:0}, gifts:{petal:0,dust:0,mote:0}, arbor:0, wishes:0,
    ended:false, zone:'meadow'});
});
test('learning progress and grown-up settings survive a reload', () => {
  let learning = emptyReport();
  learning = recordAttempt(learning, 'numbers', { misses: 0 });
  learning = recordAttempt(learning, 'numbers', { misses: 2 });
  learning = recordAttempt(learning, 'letters', { misses: 1 });
  writeSave({ sparkles: 3, learning, difficulty: { letters: 'gentle', numbers: 'stretch' } });
  const save = loadSave();
  assert.deepEqual(save.learning.numbers, { attempts: 2, firstTry: 1, misses: 2 });
  assert.deepEqual(save.learning.letters, { attempts: 1, firstTry: 0, misses: 1 });
  assert.equal(save.difficulty.letters, 'gentle');
  assert.equal(save.difficulty.numbers, 'stretch');
  assert.equal(save.difficulty.memory, 'auto');
  // A save written before this feature still opens with a clean slate.
  writeSave({ sparkles: 1, solved: ['grove-a'] });
  assert.deepEqual(loadSave().learning, emptyReport());
  assert.deepEqual(loadSave().difficulty, sanitizeDifficulty(null));
  // Hidden treasures survive, and only real ones.
  writeSave({ sparkles: 2, secrets: ['meadow-nest', 'invented-secret', 'meadow-nest'] });
  assert.deepEqual(loadSave().secrets, ['meadow-nest']);
  writeSave({ sparkles: 2 });
  assert.deepEqual(loadSave().secrets, []);
  // The grotto chest only counts as taken when the save says so, literally.
  writeSave({ sparkles: 2, grotto: true });
  assert.equal(loadSave().grotto, true);
  for (const bad of ['yes', 1, {}, [], null]) {
    writeSave({ sparkles: 2, grotto: bad });
    assert.equal(loadSave().grotto, false);
  }
  writeSave({ sparkles: 2 });
  assert.equal(loadSave().grotto, false);
  // Bundles in the basket and gifts in the garden round-trip, and junk is dropped.
  writeSave({ sparkles: 4, bundles: { petal: 2, dust: 'x', mote: 99, leaf: 7 }, gifts: { petal: 1, dust: 3, mote: -2 } });
  assert.deepEqual(loadSave().bundles, { petal: 2, dust: 0, mote: 9 });
  assert.deepEqual(loadSave().gifts, { petal: 1, dust: 3, mote: 0 });
  writeSave({ sparkles: 4, gifts: { petal: 9 } });
  assert.deepEqual(loadSave().gifts, { petal: 3, dust: 0, mote: 0 });
  writeSave({ sparkles: 4, bundles: ['petal'], gifts: 'lots' });
  assert.deepEqual(loadSave().bundles, { petal: 0, dust: 0, mote: 0 });
  assert.deepEqual(loadSave().gifts, { petal: 0, dust: 0, mote: 0 });
  // The Moon Arbor round-trips: six lights, and wishes that keep counting so the
  // moon can keep turning; a wild value is clamped, not refused.
  writeSave({ sparkles: 4, arbor: 4, wishes: 7 });
  assert.equal(loadSave().arbor, 4);
  assert.equal(loadSave().wishes, 7);
  writeSave({ sparkles: 4, arbor: 99, wishes: -3 });
  assert.equal(loadSave().arbor, 6);
  assert.equal(loadSave().wishes, 0);
  writeSave({ sparkles: 4, arbor: 'lots', wishes: 99 });
  assert.equal(loadSave().arbor, 0);
  assert.equal(loadSave().wishes, 99);
  writeSave({ sparkles: 4, arbor: 6, wishes: 5000 });
  assert.equal(loadSave().wishes, 999);
  // Junk in the new fields is thrown away rather than trusted.
  writeSave({ sparkles: 1, learning: { letters: { attempts: 'lots' } }, difficulty: { letters: 'impossible', extra: 'gentle' } });
  assert.deepEqual(loadSave().learning.letters, { attempts: 0, firstTry: 0, misses: 0 });
  assert.equal(loadSave().difficulty.letters, 'auto');
  assert.equal(Object.hasOwn(loadSave().difficulty, 'extra'), false);
});
test('truncated primary recovers previous checkpoint without rotating corruption into backup', () => {
  writeSave({sparkles:11}); writeSave({sparkles:12}); store.set(key,'{'); assert.equal(loadSave().sparkles,11);
  writeSave({sparkles:13}); store.set(key,'null'); assert.equal(loadSave().sparkles,11); clearSave(); assert.equal(loadSave(),null);
});
test('storage refusal signals a failed write and preserves the last save', () => {
  writeSave({sparkles:6}); localStorage.setItem=()=>{throw Error('full')}; assert.equal(writeSave({sparkles:7}),false); assert.equal(loadSave().sparkles,6);
});
