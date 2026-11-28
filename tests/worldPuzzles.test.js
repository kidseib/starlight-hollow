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
  patternStep,
  patternLength,
  patternComplete,
  isSequenceCorrect,
  remainingPatternChoices,
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

test('six puzzles, one in every world, and several kinds of knowing', () => {
  assert.equal(WORLD_PUZZLES.length, 6);
  assert.equal(new Set(PUZZLE_IDS).size, 6);
  assert.deepEqual([...new Set(WORLD_PUZZLES.map((p) => p.kind))].sort(), [...PUZZLE_KINDS].sort());
  for (const zone of ZONES.filter((z) => z.kind !== 'hub')) {
    assert.equal(puzzlesInZone(zone.id).length, 1, `${zone.id} has exactly one world challenge`);
  }
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
    assert.ok(['letters', 'words', 'numbers', 'patterns', 'memory'].includes(puzzle.subject));
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

test('the pattern lift asks for the next shapes in order, and never loses a step', () => {
  const lift = puzzleFor('peaks-lift');
  assert.equal(lift.kind, 'pattern');
  assert.equal(patternLength(lift), 3);
  assert.equal(patternStep(lift, 0), 'star');
  assert.equal(patternStep(lift, 1), 'moon');
  assert.equal(patternStep(lift, 2), 'star');
  assert.equal(patternStep(lift, 3), null);
  assert.equal(isSequenceCorrect(lift, 0, 'star'), true);
  assert.equal(isSequenceCorrect(lift, 1, 'star'), false);
  assert.equal(isSequenceCorrect(lift, 1, 'moon'), true);
  assert.equal(patternComplete(lift, 2), false);
  assert.equal(patternComplete(lift, 3), true);

  // The row on the arch really does continue into the answer.
  const row = lift.pattern.map((g) => g.text);
  assert.deepEqual(row, ['🌙', '⭐', '🌙', '⭐', '🌙']);
  assert.deepEqual(lift.sequence, ['star', 'moon', 'star']);

  // Narrowing only ever removes shapes that are not needed by the rest of the
  // sequence — a stone already used earlier can never be dimmed.
  assert.deepEqual(remainingPatternChoices(lift, 0).sort(), ['leaf', 'sun']);
  assert.deepEqual(dimmedChoices(lift, 2, 'normal', 0), ['sun']);
  assert.deepEqual(dimmedChoices(lift, 3, 'normal', 0), ['sun', 'leaf']);
  for (let progress = 0; progress <= 3; progress++) {
    for (let misses = 0; misses < 20; misses++) {
      const dim = dimmedChoices(lift, misses, 'normal', progress);
      for (const stillNeeded of lift.sequence.slice(progress)) {
        assert.equal(dim.includes(stillNeeded), false, 'a needed shape never dims');
      }
    }
  }
});

test('the cove shell asks a child to add two real groups of pebbles', () => {
  const shell = puzzleFor('cove-pebbles');
  assert.equal(shell.kind, 'add');
  assert.deepEqual(shell.pebbles, [3, 2]);
  assert.equal(Number(shell.answer), shell.pebbles[0] + shell.pebbles[1]);
  assert.ok(shell.instruction.includes('Three pebbles') && shell.instruction.includes('two more'));
  assert.ok(!shell.instruction.includes('five'), 'the sum is not spoken in the question');
  assert.match(shell.hint, /one, two, three/, 'the hint counts all five');
});

test('every gate and lift promises a real place on its island', () => {
  const grove = puzzleFor('grove-bramble');
  assert.ok(grove.pocket, 'the bramble opens into a pocket');
  const groveZone = ZONE_BY_ID.grove;
  const pocketFromGate = Math.hypot(grove.pocket.x - grove.at.x, grove.pocket.z - grove.at.z);
  assert.ok(pocketFromGate > 4 && pocketFromGate < 9, 'the pocket is just behind its gate');
  assert.ok(Math.hypot(grove.pocket.x, grove.pocket.z) + grove.pocket.r < groveZone.radius - 2);

  const lift = puzzleFor('peaks-lift');
  assert.ok(lift.shelf, 'the lift reaches a shelf');
  assert.ok(Math.hypot(lift.shelf.x, lift.shelf.z) + 3.4 < ZONE_BY_ID.peaks.radius - 2);
  assert.notEqual(lift.shelf.x, lift.at.x, 'the shelf is somewhere else');

  for (const id of ['cove-pebbles', 'hollow-moon']) {
    const p = puzzleFor(id);
    assert.ok(p.pocket, `${id} opens somewhere`);
  }
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
    assert.match(puzzleSkill(puzzle), /reading|counting|matching|pattern|adding/);
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
  writeSave({ sparkles: 12, puzzles: ['grove-bramble', 'words-path', 'peaks-lift', 'cove-pebbles', 'hollow-moon', 'invented'], solved: [], stars: {} });
  const save = loadSave();
  assert.deepEqual(save.puzzles, ['grove-bramble', 'words-path', 'peaks-lift', 'cove-pebbles', 'hollow-moon']);

  writeSave({ sparkles: 4, solved: [] });
  const legacy = loadSave();
  assert.deepEqual(legacy.puzzles, []);
  assert.equal(legacy.gates.length, 0);
  assert.equal(legacy.hollow, false);
});
