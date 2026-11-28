/**
 * Per-subject learning progress and adaptive difficulty.
 *
 * Two rules shape this file:
 *
 * 1. Every subject is judged on its own. A child who is flying through
 *    counting but still sounding out letters must not have letters made harder
 *    just because numbers are easy.
 * 2. Difficulty changes the *question*, never the reward. A gentler sign still
 *    pays its 6 sparkles, so being helped is never a punishment.
 *
 * Everything here is pure: no DOM, no scene, no save. `save.js` sanitises the
 * same shapes, and the tests drive the rules directly.
 */

/** The five things this game teaches. Order is the order the panel shows. */
export const SUBJECTS = ['letters', 'words', 'numbers', 'patterns', 'memory'];

export const SUBJECT_LABELS = {
  letters: 'Letters & sounds',
  words: 'Words & rhymes',
  numbers: 'Numbers & counting',
  patterns: 'Patterns & shapes',
  memory: 'Memory & listening',
};

export const LEVELS = ['gentle', 'normal', 'stretch'];

export const LEVEL_LABELS = {
  gentle: 'Gentle',
  normal: 'Just right',
  stretch: 'Stretch',
  auto: 'Auto',
};

const LEARN_SUBJECT = {
  'Letter sounds': 'letters',
  'Beginning sounds': 'letters',
  Listening: 'letters',
  'Word building': 'words',
  Syllables: 'words',
  Rhyming: 'words',
  Spelling: 'words',
  Counting: 'numbers',
  Adding: 'numbers',
  'Taking away': 'numbers',
  Comparing: 'numbers',
  'Number order': 'numbers',
  'Numbers and groups': 'numbers',
  Patterns: 'patterns',
  Shapes: 'patterns',
  Colors: 'patterns',
  Memory: 'memory',
  'Picture memory': 'memory',
};

const ZONE_SUBJECT = {
  grove: 'letters',
  words: 'words',
  falls: 'numbers',
  cove: 'numbers',
  peaks: 'patterns',
  meadow: 'patterns',
};

/** Which subject a sign belongs to. Falls back to its island, then to patterns. */
export function subjectOfStation(def = {}, zoneId = null) {
  if (def.subject && SUBJECTS.includes(def.subject)) return def.subject;
  if (def.learn && LEARN_SUBJECT[def.learn]) return LEARN_SUBJECT[def.learn];
  if (def.type === 'memory') return 'memory';
  if (def.type === 'pattern') return 'patterns';
  if (def.pads?.some((p) => p.kind === 'letter' || p.kind === 'word')) return 'letters';
  const zone = zoneId ?? def.zoneId ?? null;
  return ZONE_SUBJECT[zone] ?? 'patterns';
}

/** A fresh, empty tally per subject. */
export function emptyReport() {
  const out = {};
  for (const subject of SUBJECTS) out[subject] = { attempts: 0, firstTry: 0, misses: 0 };
  return out;
}

const count = (v) => (Number.isSafeInteger(v) && v >= 0 ? v : 0);

/** Whatever shape a save or an old report is in, return a complete tally. */
export function sanitizeReport(raw) {
  const out = emptyReport();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const subject of SUBJECTS) {
    const entry = raw[subject];
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    out[subject] = {
      attempts: count(entry.attempts),
      firstTry: Math.min(count(entry.firstTry), count(entry.attempts)),
      misses: count(entry.misses),
    };
  }
  return out;
}

/** Difficulty settings only ever hold 'auto' or a real level. */
export function sanitizeDifficulty(raw) {
  const out = {};
  for (const subject of SUBJECTS) out[subject] = 'auto';
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const subject of SUBJECTS) {
    const value = raw[subject];
    if (LEVELS.includes(value)) out[subject] = value;
  }
  return out;
}

/**
 * Record one finished sign. `misses` is how many wrong zaps happened before it
 * was solved; a first-try solve is the evidence that the child already knows
 * this one.
 */
export function recordAttempt(report, subject, { misses = 0, solved = true } = {}) {
  const next = sanitizeReport(report);
  if (!SUBJECTS.includes(subject) || solved !== true) return next;
  const entry = next[subject];
  const wrong = count(misses);
  entry.attempts += 1;
  entry.misses += wrong;
  if (wrong === 0) entry.firstTry += 1;
  return next;
}

export function firstTryRate(entry) {
  const attempts = count(entry?.attempts);
  return attempts === 0 ? null : count(entry.firstTry) / attempts;
}

/**
 * The level to use for a subject right now.
 *
 * - 'gentle' / 'stretch' from a grown-up always wins: a parent watching their
 *   child should not be overruled by statistics.
 * - 'auto' needs a little evidence before it moves: two solved signs for
 *   gentle, three for stretch. Gentle triggers on a low first-try rate, and
 *   stretch only when almost everything lands first time.
 */
export function levelFor(report, subject, setting = 'auto') {
  if (LEVELS.includes(setting)) return setting;
  const entry = sanitizeReport(report)[subject];
  if (!entry || entry.attempts < 2) return 'normal';
  const rate = firstTryRate(entry);
  if (rate <= 0.4) return 'gentle';
  if (entry.attempts >= 3 && rate >= 0.8) return 'stretch';
  return 'normal';
}

/**
 * How many misses before a wrong choice starts fading away. A gentle sign
 * narrows after the first miss, a stretch sign waits for the third.
 */
export function narrowAfter(level) {
  if (level === 'gentle') return 1;
  if (level === 'stretch') return 3;
  return 2;
}

/** How long before the spoken hint arrives, in seconds. */
export function hintDelay(level) {
  if (level === 'gentle') return 1.9;
  if (level === 'stretch') return 3.6;
  return 2.7;
}

/**
 * A calm one-line summary for the grown-up corner, e.g.
 * "Letters & sounds — 3 signs, 2 first try".
 */
export function summaryOf(report, subject) {
  const entry = sanitizeReport(report)[subject];
  const label = SUBJECT_LABELS[subject] ?? subject;
  if (!entry.attempts) return { label, text: 'not tried yet', attempts: 0, level: 'normal' };
  const firsts = entry.firstTry;
  return {
    label,
    text: `${entry.attempts} ${entry.attempts === 1 ? 'sign' : 'signs'} · ${firsts} first try`,
    attempts: entry.attempts,
    level: levelFor(report, subject, 'auto'),
  };
}

/** Total solved signs across every subject, for the pause line. */
export function totalAttempts(report) {
  const clean = sanitizeReport(report);
  return SUBJECTS.reduce((sum, subject) => sum + clean[subject].attempts, 0);
}
