/**
 * Puzzles that live in the world, not in a panel.
 *
 * A board asks a child to remember a picture. These ask them to *do* something
 * with what they know: read a word carved on a stone to unbind a bramble, count
 * the lilies on the brook to raise the crossing, or match a creature's call to
 * the friend who makes it so a sleeping path wakes. The reward is always the
 * same shape: the place itself changes.
 *
 * Rules only — no scene, no DOM, no save, no sound. The art lives in
 * `src/world/puzzleArt.js`, the wiring in `src/game/game.js`, and the save key is
 * `puzzles` (an array of solved ids, sanitised below).
 */

import { narrowAfter } from './progress.js';

export const PUZZLE_SPARKLES = 8;

/** How close a child must be before a puzzle stirs and Pip explains it. */
export const PUZZLE_WAKE_RADIUS = 13;
/** How far a choice stone can be read and zapped. */
export const PUZZLE_AIM_RANGE = 15;

export const WORLD_PUZZLES = [
  // ------------------------------------------------------- Letterleaf Grove --
  {
    id: 'grove-bramble',
    zone: 'grove',
    kind: 'word',
    subject: 'words',
    title: 'The Sleepy Bramble',
    at: { x: 36, z: 16 },
    faceTo: { x: 0, z: 0 },
    icon: '🌿',
    instruction:
      'This sleepy bramble only opens for a word. Listen: mmm... oss... moss. Zap the stone that says moss.',
    hint: 'Mmm... oss... moss. Say it with me, then zap the stone with that word.',
    success: 'Moss! You read the word, and the bramble curled away. The path is open!',
    wrong: 'Almost! Try another stone. Listen again: mmm... oss... moss.',
    choices: [
      { id: 'moss', glyph: { kind: 'word', text: 'moss', marker: '🌿' }, at: { x: 30.6, z: 12.8 } },
      { id: 'milk', glyph: { kind: 'word', text: 'milk', marker: '🥛' }, at: { x: 33.8, z: 10.2 } },
      { id: 'mud', glyph: { kind: 'word', text: 'mud', marker: '🟤' }, at: { x: 37.4, z: 11.4 } },
    ],
    answer: 'moss',
    // The gate hides a real dell: a hedge ring with the arch as its only way in.
    pocket: { x: 42.4, z: 18.8, r: 7 },
  },

  // ------------------------------------------------------- Tallybrook Falls --
  {
    id: 'falls-bridge',
    zone: 'falls',
    kind: 'count',
    subject: 'numbers',
    title: 'The Sunken Crossing',
    at: { x: 30, z: 20 },
    faceTo: { x: 0, z: 0 },
    icon: '🪷',
    instruction:
      'The stones are sleeping under the water. How many lily flowers are floating? Count them, then zap the stone with your number.',
    hint: 'Count with me: one, two, three, four, five, six. Six lilies! Zap the stone with six.',
    success: 'Six lilies! The stones heard you and rose up out of the water. Walk across!',
    wrong: 'Not that one yet. Count the lilies slowly, then try again.',
    lilyCount: 6,
    choices: [
      { id: '5', glyph: { kind: 'number', text: '5' }, at: { x: 26.4, z: 16.4 } },
      { id: '6', glyph: { kind: 'number', text: '6' }, at: { x: 30.0, z: 15.2 } },
      { id: '7', glyph: { kind: 'number', text: '7' }, at: { x: 33.6, z: 16.4 } },
    ],
    answer: '6',
  },

  // ------------------------------------------------------ Storysong Glade ---
  {
    id: 'words-path',
    zone: 'words',
    kind: 'sound',
    subject: 'letters',
    title: 'The Listening Path',
    at: { x: -34, z: 26 },
    faceTo: { x: 0, z: 0 },
    icon: '🐸',
    instruction:
      'The path is fast asleep. Listen to the sound... which friend makes it? Zap that friend to wake the path.',
    hint: 'Croak... croak! It is the frog. Zap the frog and the path will wake.',
    success: 'You matched the call! The rune stones woke up one by one and lit the way.',
    wrong: 'That friend is still sleeping. Listen once more... croak, croak!',
    call: 'frog',
    callLine: 'Croak... croak...',
    choices: [
      { id: 'frog', glyph: { kind: 'icon', text: '🐸' }, at: { x: -30.2, z: 22.0 } },
      { id: 'bird', glyph: { kind: 'icon', text: '🐤' }, at: { x: -34.0, z: 20.4 } },
      { id: 'owl', glyph: { kind: 'icon', text: '🦉' }, at: { x: -37.8, z: 22.0 } },
    ],
    answer: 'frog',
  },

  // --------------------------------------------------------- Pattern Peaks --
  {
    id: 'peaks-lift',
    zone: 'peaks',
    kind: 'pattern',
    subject: 'patterns',
    title: 'The Humming Lift',
    at: { x: 34, z: 24 },
    faceTo: { x: 0, z: 0 },
    icon: '🎶',
    instruction:
      'Look at the shapes on the arch: moon, star, moon, star, moon. Which three shapes come next? Zap them in order, and the Humming Lift will carry you up.',
    hint: 'The row goes moon, star, moon, star, moon. So next comes star, then moon, then star. Zap star, then moon, then star!',
    success: 'Star, moon, star! The lift hums a happy note. Step on and ride up to the sky shelf!',
    wrong: 'That shape is not next in the row. Look at the pattern again, then try.',
    pattern: [
      { kind: 'icon', text: '🌙' },
      { kind: 'icon', text: '⭐' },
      { kind: 'icon', text: '🌙' },
      { kind: 'icon', text: '⭐' },
      { kind: 'icon', text: '🌙' },
    ],
    sequence: ['star', 'moon', 'star'],
    choices: [
      { id: 'star', glyph: { kind: 'icon', text: '⭐' }, at: { x: 33.3, z: 18.0 } },
      { id: 'moon', glyph: { kind: 'icon', text: '🌙' }, at: { x: 31.6, z: 20.5 } },
      { id: 'sun', glyph: { kind: 'icon', text: '☀️' }, at: { x: 29.8, z: 22.9 } },
      { id: 'leaf', glyph: { kind: 'icon', text: '🍃' }, at: { x: 28.1, z: 25.4 } },
    ],
    answer: 'star',
    shelf: { x: 40.7, z: 28.7, r: 6 },
  },

  // -------------------------------------------------------- Pebblecount Cove --
  {
    id: 'cove-pebbles',
    zone: 'cove',
    kind: 'add',
    subject: 'numbers',
    title: 'The Great Shell',
    at: { x: 32, z: 6 },
    faceTo: { x: 0, z: 0 },
    icon: '🐚',
    instruction:
      'Three pebbles sit on the round rock, and two more on the flat rock. How many pebbles altogether? Zap the stone with your answer.',
    hint: 'Count every pebble: one, two, three, four, five. Five pebbles! Zap the stone with five.',
    success: 'Five pebbles! The great shell heard you and creaked open. A little tidepool is waiting inside.',
    wrong: 'Not that one yet. Count every pebble, on both rocks, then try again.',
    pebbles: [3, 2],
    choices: [
      { id: '4', glyph: { kind: 'number', text: '4' }, at: { x: 30.0, z: 12.3 } },
      { id: '5', glyph: { kind: 'number', text: '5' }, at: { x: 28.9, z: 13.9 } },
      { id: '6', glyph: { kind: 'number', text: '6' }, at: { x: 27.8, z: 15.6 } },
    ],
    answer: '5',
    pocket: { x: 36.3, z: 6.8, r: 4.4 },
  },

  // ---------------------------------------------------------- Lantern Hollow --
  {
    id: 'hollow-moon',
    zone: 'hollow',
    kind: 'word',
    subject: 'words',
    title: 'The Moonword',
    at: { x: -18, z: 22 },
    faceTo: { x: 0, z: 0 },
    icon: '🌕',
    instruction:
      'A word is carved on the moonstone: mmm... ooo... nnn. Moon. Zap the stone that says moon, and the moth curtain will lift.',
    hint: 'Sound it out with me: mmm... ooo... nnn... moon! Zap the stone that says moon.',
    success: 'Moon! The moth curtain shivered and lifted. A little moon garden is open.',
    wrong: 'Almost. Listen again: mmm... ooo... nnn... moon.',
    veil: 'moths',
    choices: [
      { id: 'moon', glyph: { kind: 'word', text: 'moon', marker: '🌕' }, at: { x: -12.4, z: 21.4 } },
      { id: 'moth', glyph: { kind: 'word', text: 'moth', marker: '🦋' }, at: { x: -15.7, z: 19.3 } },
      { id: 'moss', glyph: { kind: 'word', text: 'moss', marker: '🌿' }, at: { x: -18.6, z: 16.1 } },
    ],
    answer: 'moon',
    pocket: { x: -21.4, z: 26.2, r: 5.2 },
  },
];

export const PUZZLE_IDS = WORLD_PUZZLES.map((p) => p.id);

export const PUZZLE_KINDS = ['word', 'count', 'sound', 'pattern', 'add'];

export function puzzleFor(id) {
  return WORLD_PUZZLES.find((p) => p.id === id) ?? null;
}

export function puzzlesInZone(zoneId) {
  return WORLD_PUZZLES.filter((p) => p.zone === zoneId);
}

export function puzzleAt(zoneId, x, z, radius = 6) {
  return puzzlesInZone(zoneId).find((p) => Math.hypot(p.at.x - x, p.at.z - z) <= radius) ?? null;
}

export function sanitizePuzzles(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const id of raw) {
    if (typeof id === 'string' && PUZZLE_IDS.includes(id) && !out.includes(id)) out.push(id);
  }
  return out;
}

export function isSolvedIn(list, id) {
  return sanitizePuzzles(list).includes(id);
}

export function choiceById(puzzle, id) {
  return puzzle?.choices.find((c) => c.id === id) ?? null;
}

/** The choices a child can still try. Solved puzzles have none left. */
export function activeChoices(puzzle, solved = false) {
  if (!puzzle || solved) return [];
  return puzzle.choices;
}

/**
 * Narrowing. After enough misses some wrong stones lie back down and stop
 * answering, so the question gets smaller instead of repeating. The right stone
 * never dims, and nothing is ever hidden that could not be tapped.
 */
export function dimmedChoices(puzzle, misses = 0, level = 'normal', progress = 0) {
  if (!puzzle) return [];
  const threshold = narrowAfter(level);
  // A pattern sequence may still need a stone several steps from now, so the
  // "wrong" list is everything not in the remaining sequence. That keeps every
  // stone the child still needs, even one that has already been used.
  const needed = new Set(
    puzzle.sequence ? puzzle.sequence.slice(Math.max(0, progress)) : [puzzle.answer]
  );
  const wrong = puzzle.choices.filter((c) => !needed.has(c.id));
  if (!wrong.length) return [];
  // Gentle: one wrong stone lies down on the first miss. Normal: second miss.
  // Stretch waits until the third. Each further miss dims one more, never a
  // stone that is still needed, and the child still taps the answer.
  const count = Math.max(0, Math.min(wrong.length, misses - threshold + 1));
  return wrong.slice(0, count).map((c) => c.id);
}

export function choiceIsDim(puzzle, id, misses = 0, level = 'normal', progress = 0) {
  return dimmedChoices(puzzle, misses, level, progress).includes(id);
}

/** How many shapes a pattern lift asks for. */
export function patternLength(puzzle) {
  return puzzle?.sequence?.length ?? 0;
}

/** The shape the pattern is waiting for right now, or null when finished. */
export function patternStep(puzzle, progress = 0) {
  if (!puzzle?.sequence) return null;
  return puzzle.sequence[Math.max(0, progress)] ?? null;
}

export function patternComplete(puzzle, progress = 0) {
  return patternLength(puzzle) > 0 && progress >= patternLength(puzzle);
}

/** One correct step advances the sequence; it never resets progress. */
export function isSequenceCorrect(puzzle, progress, choiceId) {
  return patternStep(puzzle, progress) === choiceId;
}

/** Every shape not needed by the rest of the sequence, for narrowing and tests. */
export function remainingPatternChoices(puzzle, progress = 0) {
  if (!puzzle?.sequence) return [];
  const needed = new Set(puzzle.sequence.slice(Math.max(0, progress)));
  return puzzle.choices.filter((c) => !needed.has(c.id)).map((c) => c.id);
}

/** True only for the stone the puzzle is waiting for. */
export function isCorrect(puzzle, choiceId) {
  return !!puzzle && choiceId === puzzle.answer;
}

/** Pip's line when a stone answers. `last` is the only remaining stone. */
export function wrongLine(puzzle, { last = false } = {}) {
  if (!puzzle) return 'Try again!';
  if (last) return puzzle.hint ?? puzzle.wrong ?? 'Try once more!';
  return puzzle.wrong ?? 'Try again!';
}

/** The line spoken when the world changes. */
export function successLine(puzzle) {
  return puzzle?.success ?? 'You did it!';
}

/**
 * A gentle nudge for the grown-up corner and tests: what this puzzle is really
 * checking, in words a report can use.
 */
export function puzzleSkill(puzzle) {
  switch (puzzle?.kind) {
    case 'word': return 'reading a word';
    case 'count': return 'counting a group';
    case 'sound': return 'matching a sound to its animal';
    case 'pattern': return 'completing a pattern';
    case 'add': return 'adding two groups';
    default: return 'problem solving';
  }
}
