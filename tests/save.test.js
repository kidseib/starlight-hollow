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
    learning:emptyReport(), difficulty:sanitizeDifficulty(null), ended:false, zone:'meadow'});
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
