import test from 'node:test';
import assert from 'node:assert/strict';
import { ZONES, ZONE_BY_ID } from '../src/content.js';
import { SECRETS } from '../src/game/secrets.js';
import {
  WORLD_PUZZLES,
  PUZZLE_IDS,
  PUZZLE_KINDS,
  PUZZLE_SPARKLES,
  puzzleFor,
  puzzlesInZone,
  sanitizePuzzles,
  isSolvedIn,
  choiceById,
  dimmedChoices,
  choiceIsDim,
  isCorrect,
  successLine,
  wrongLine,
  puzzleSkill,
} from '../src/game/worldPuzzles.js';
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

test('three puzzles, three different kinds of knowing, all in real places', () => {
  assert.equal(WORLD_PUZZLES.length, 3);
  assert.equal(new Set(PUZZLE_IDS).size, 3);
  assert.deepEqual([...new Set(WORLD_PUZZLES.map((p) => p.kind))].sort(), [...PUZZLE_KINDS].sort());
  for (const puzzle of WORLD_PUZZLES) {
    const zone = ZONE_BY_ID[puzzle.zone];
    assert.ok(zone, `${puzzle.id} lives in a real zone`);
    assert.notEqual(zone.kind, 'hub', `${puzzle.id} is out in a themed world`);
    assert.ok(puzzle.title && puzzle.instruction && puzzle.hint && puzzle.success && puzzle.wrong,
      `${puzzle.id} has all its spoken lines`);
    assert.ok(puzzle.choices.length >= 3, `${puzzle.id} offers real choices`);
    assert.ok(choiceById(puzzle, puzzle.answer), `${puzzle.id}'s answer is one of its choices`);
    assert.equal(new Set(puzzle.choices.map((c) => c.id)).size, puzzle.choices.length, 'no duplicate stones');
    assert.ok(puzzle.instruction.length > 30, `${puzzle.id} explains itself in a sentence`);
  }
});

test('the reading puzzle really asks to read, the counting really asks to count', () => {
  const word = puzzleFor('grove-bramble');
  assert.equal(word.kind, 'word');
  assert.equal(word.answer, 'moss');
  assert.ok(word.instruction.toLowerCase().includes('moss'), 'the word is spoken');
  assert.ok(word.instruction.toLowerCase().includes('mmm'), 'phonics are sounded out');
  // Every wrong choice is a real, short, readable word, not a random string.
  for (const choice of word.choices) {
    assert.match(choice.id, /^[a-z]{3,5}$/);
  }

  const count = puzzleFor('falls-bridge');
  assert.equal(count.kind, 'count');
  assert.equal(count.lilyCount, Number(count.answer));
  assert.ok(!count.instruction.includes(count.answer), 'the count is never given away in the instruction');
  assert.match(count.hint, /one, two, three/, 'the hint counts aloud, slowly');

  const sound = puzzleFor('words-path');
  assert.equal(sound.kind, 'sound');
  assert.equal(sound.call, sound.answer);
  assert.ok(!sound.instruction.toLowerCase().includes(sound.answer), 'the animal is not named in the question');
  assert.match(sound.hint, /croak/i);
});

test('each puzzle sits off the walking route and clear of signs and keepsakes', () => {
  for (const puzzle of WORLD_PUZZLES) {
    const zone = ZONE_BY_ID[puzzle.zone];
    const fromSpawn = Math.hypot(puzzle.at.x - zone.spawn.x, puzzle.at.z - zone.spawn.z);
    assert.ok(fromSpawn > 18, `${puzzle.id} is a walk from the landing`);
    assert.ok(Math.hypot(puzzle.at.x, puzzle.at.z) < zone.radius - 6, `${puzzle.id} is still on the island`);
    for (const choice of puzzle.choices) {
      assert.ok(Math.hypot(choice.at.x, choice.at.z) < zone.radius - 4, `${puzzle.id} ${choice.id} is on the island`);
      assert.ok(Math.hypot(choice.at.x - puzzle.at.x, choice.at.z - puzzle.at.z) < 12,
        `${puzzle.id} ${choice.id} can be read from the puzzle`);
    }
    for (const station of zone.stations) {
      assert.ok(Math.hypot(station.x - puzzle.at.x, station.z - puzzle.at.z) > 8,
        `${puzzle.id} does not crowd a sign`);
    }
    for (const secret of SECRETS.filter((s) => s.zone === zone.id)) {
      for (const choice of puzzle.choices) {
        assert.ok(Math.hypot(secret.at.x - choice.at.x, secret.at.z - choice.at.z) > 3,
          `${puzzle.id} does not bury a keepsake`);
      }
    }
  }
});

test('wrong stones lie down until only the answer is left, and never the answer itself', () => {
  const puzzle = puzzleFor('grove-bramble');
  const wrongIds = puzzle.choices.filter((c) => c.id !== puzzle.answer).map((c) => c.id);

  // Gentle: the first miss already shrinks the question.
  assert.deepEqual(dimmedChoices(puzzle, 0, 'gentle'), []);
  assert.deepEqual(dimmedChoices(puzzle, 1, 'gentle'), [wrongIds[0]]);
  assert.deepEqual(dimmedChoices(puzzle, 2, 'gentle'), wrongIds);

  // Normal: the second miss.
  assert.deepEqual(dimmedChoices(puzzle, 1, 'normal'), []);
  assert.deepEqual(dimmedChoices(puzzle, 2, 'normal'), [wrongIds[0]]);
  assert.deepEqual(dimmedChoices(puzzle, 5, 'normal'), wrongIds);

  // Stretch: waits for the third, then still narrows.
  assert.deepEqual(dimmedChoices(puzzle, 2, 'stretch'), []);
  assert.deepEqual(dimmedChoices(puzzle, 3, 'stretch'), [wrongIds[0]]);

  // The right stone is never dimmed, at any level, ever.
  for (const level of ['gentle', 'normal', 'stretch']) {
    for (let misses = 0; misses < 20; misses++) {
      assert.equal(choiceIsDim(puzzle, puzzle.answer, misses, level), false);
    }
  }
});

test('answering is exact, and lines are written for the puzzle in hand', () => {
  for (const puzzle of WORLD_PUZZLES) {
    assert.equal(isCorrect(puzzle, puzzle.answer), true);
    for (const choice of puzzle.choices.filter((c) => c.id !== puzzle.answer)) {
      assert.equal(isCorrect(puzzle, choice.id), false);
    }
    assert.equal(successLine(puzzle), puzzle.success);
    assert.equal(wrongLine(puzzle), puzzle.wrong);
    assert.match(puzzleSkill(puzzle), /reading|counting|matching/);
  }
  assert.equal(isCorrect(puzzleFor('invented'), 'moss'), false);
});

test('junk saves cannot invent a solved puzzle, and solved ids are kept once', () => {
  assert.deepEqual(sanitizePuzzles(['grove-bramble', 'invented', 'grove-bramble', 7, null]), ['grove-bramble']);
  assert.deepEqual(sanitizePuzzles('grove-bramble'), []);
  assert.deepEqual(sanitizePuzzles(undefined), []);
  assert.equal(isSolvedIn(['falls-bridge'], 'falls-bridge'), true);
  assert.equal(isSolvedIn(['falls-bridge'], 'grove-bramble'), false);
  assert.ok(PUZZLE_SPARKLES >= 5 && PUZZLE_SPARKLES <= 12, 'a world change pays a real but modest reward');
});

test('solved puzzles survive a save, and a legacy save has none', () => {
  writeSave({ sparkles: 12, puzzles: ['grove-bramble', 'words-path', 'invented'], solved: [], stars: {} });
  const save = loadSave();
  assert.deepEqual(save.puzzles, ['grove-bramble', 'words-path']);

  writeSave({ sparkles: 4, solved: [] });
  const legacy = loadSave();
  assert.deepEqual(legacy.puzzles, []);
  assert.equal(legacy.gates.length, 0);
  assert.equal(legacy.hollow, false);
});
