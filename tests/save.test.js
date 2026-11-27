import test from 'node:test';
import assert from 'node:assert/strict';
import { writeSave, loadSave, clearSave } from '../src/engine/save.js';
const key = 'starlight-hollow-save-v1';
let store;
test.beforeEach(() => { store = new Map(); Object.defineProperty(globalThis, 'localStorage', { configurable:true, value: { getItem:k=>store.get(k) ?? null, setItem:(k,v)=>store.set(k,v), removeItem:k=>store.delete(k) } }); });
test('old saves keep progress and default to the meadow', () => {
  writeSave({solved:['peaks-ab'], sparkles:9});
  assert.deepEqual(loadSave().solved,['peaks-ab']); assert.equal(loadSave().zone,'meadow'); assert.equal(loadSave().sparkles,9);
});
test('malformed fields cannot break game initialization', () => {
  writeSave({solved:{}, scanned:'bad', visited:[1,'cove','cove'], stars:{cove:true,grove:'false'},sparkles:-1,ended:'yes'});
  assert.deepEqual(loadSave(), {solved:[],scanned:[],visited:['cove'],stars:{cove:true},sparkles:0,upgrades:[],ended:false,zone:'meadow'});
});
test('truncated primary recovers previous checkpoint without rotating corruption into backup', () => {
  writeSave({sparkles:11}); writeSave({sparkles:12}); store.set(key,'{'); assert.equal(loadSave().sparkles,11);
  writeSave({sparkles:13}); store.set(key,'null'); assert.equal(loadSave().sparkles,11); clearSave(); assert.equal(loadSave(),null);
});
test('storage refusal signals a failed write and preserves the last save', () => {
  writeSave({sparkles:6}); localStorage.setItem=()=>{throw Error('full')}; assert.equal(writeSave({sparkles:7}),false); assert.equal(loadSave().sparkles,6);
});
