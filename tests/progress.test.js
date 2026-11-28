import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SUBJECTS,
  LEVELS,
  subjectOfStation,
  emptyReport,
  sanitizeReport,
  sanitizeDifficulty,
  recordAttempt,
  firstTryRate,
  levelFor,
  narrowAfter,
  hintDelay,
  summaryOf,
  totalAttempts,
} from '../src/game/progress.js';

test('every sign is filed under the subject it actually teaches', () => {
  assert.deepEqual(subjectOfStation({ learn: 'Letter sounds' }), 'letters');
  assert.deepEqual(subjectOfStation({ learn: 'Rhyming' }), 'words');
  assert.deepEqual(subjectOfStation({ learn: 'Adding' }), 'numbers');
  assert.deepEqual(subjectOfStation({ learn: 'Colors' }), 'patterns');
  assert.deepEqual(subjectOfStation({ learn: 'Picture memory' }), 'memory');
  // Types and pads are enough when a sign has no label of its own.
  assert.equal(subjectOfStation({ type: 'memory' }), 'memory');
  assert.equal(subjectOfStation({ type: 'pattern' }), 'patterns');
  assert.equal(subjectOfStation({ pads: [{ kind: 'letter' }] }), 'letters');
  // Islands are the last resort, so nothing is ever unsorted.
  assert.equal(subjectOfStation({}, 'grove'), 'letters');
  assert.equal(subjectOfStation({}, 'cove'), 'numbers');
  assert.equal(subjectOfStation({}, 'nowhere'), 'patterns');
  assert.ok(SUBJECTS.includes(subjectOfStation({ learn: 'Syllables' })));
});

test('a fresh report has a zero row for every subject and nothing shared', () => {
  const report = emptyReport();
  assert.deepEqual(Object.keys(report).sort(), [...SUBJECTS].sort());
  for (const subject of SUBJECTS) assert.deepEqual(report[subject], { attempts: 0, firstTry: 0, misses: 0 });
  report.letters.attempts = 9;
  assert.equal(emptyReport().letters.attempts, 0, 'emptyReport must not hand out shared objects');
});

test('recording a sign counts first tries and misses without mutating the old report', () => {
  const start = emptyReport();
  const afterOne = recordAttempt(start, 'numbers', { misses: 0 });
  assert.deepEqual(start.numbers, { attempts: 0, firstTry: 0, misses: 0 });
  assert.deepEqual(afterOne.numbers, { attempts: 1, firstTry: 1, misses: 0 });
  const afterTwo = recordAttempt(afterOne, 'numbers', { misses: 3 });
  assert.deepEqual(afterTwo.numbers, { attempts: 2, firstTry: 1, misses: 3 });
  // Other subjects are untouched by another subject's work.
  assert.deepEqual(afterTwo.letters, { attempts: 0, firstTry: 0, misses: 0 });
  // Unknown subjects and unsolved signs record nothing.
  assert.deepEqual(recordAttempt(afterTwo, 'astronomy', { misses: 0 }), afterTwo);
  assert.deepEqual(recordAttempt(afterTwo, 'numbers', { solved: false }), afterTwo);
});

test('difficulty stays out of the way until there is real evidence', () => {
  let report = emptyReport();
  assert.equal(levelFor(report, 'letters', 'auto'), 'normal', 'nothing known yet');
  report = recordAttempt(report, 'letters', { misses: 2 });
  assert.equal(levelFor(report, 'letters', 'auto'), 'normal', 'one hard sign is not a pattern');
  report = recordAttempt(report, 'letters', { misses: 2 });
  assert.equal(levelFor(report, 'letters', 'auto'), 'gentle', 'two hard signs in a row soften the third');
  assert.equal(firstTryRate(report.letters), 0);
});

test('a subject that keeps landing first try stretches, on its own', () => {
  let report = emptyReport();
  for (let i = 0; i < 3; i++) report = recordAttempt(report, 'numbers', { misses: 0 });
  assert.equal(levelFor(report, 'numbers', 'auto'), 'stretch');
  // The same child may be struggling elsewhere; that subject stays normal.
  assert.equal(levelFor(report, 'words', 'auto'), 'normal');
  report = recordAttempt(report, 'words', { misses: 2 });
  report = recordAttempt(report, 'words', { misses: 1 });
  assert.equal(levelFor(report, 'words', 'auto'), 'gentle');
  assert.equal(levelFor(report, 'numbers', 'auto'), 'stretch', 'one subject cannot drag another');
});

test('a grown-up choice always beats the statistics', () => {
  let report = emptyReport();
  for (let i = 0; i < 4; i++) report = recordAttempt(report, 'patterns', { misses: 0 });
  assert.equal(levelFor(report, 'patterns', 'auto'), 'stretch');
  assert.equal(levelFor(report, 'patterns', 'gentle'), 'gentle');
  assert.equal(levelFor(report, 'patterns', 'normal'), 'normal');
  assert.equal(levelFor(report, 'patterns', 'nonsense'), 'stretch', 'unknown settings fall back to auto');
});

test('gentler signs narrow sooner and hint sooner; stretch does the opposite', () => {
  assert.equal(narrowAfter('gentle'), 1);
  assert.equal(narrowAfter('normal'), 2);
  assert.equal(narrowAfter('stretch'), 3);
  assert.ok(hintDelay('gentle') < hintDelay('normal'));
  assert.ok(hintDelay('normal') < hintDelay('stretch'));
  for (const level of LEVELS) assert.ok(narrowAfter(level) >= 1);
});

test('garbage in a save cannot produce a broken report or difficulty', () => {
  assert.deepEqual(sanitizeReport(null), emptyReport());
  assert.deepEqual(sanitizeReport([1, 2, 3]), emptyReport());
  const cleaned = sanitizeReport({
    letters: { attempts: -4, firstTry: 99, misses: 'x' },
    numbers: 'nope',
    extra: { attempts: 5 },
  });
  assert.deepEqual(cleaned.letters, { attempts: 0, firstTry: 0, misses: 0 });
  assert.deepEqual(cleaned.numbers, { attempts: 0, firstTry: 0, misses: 0 });
  assert.equal(Object.hasOwn(cleaned, 'extra'), false);
  assert.deepEqual(sanitizeDifficulty({ letters: 'gentle', numbers: 'impossible' }), {
    letters: 'gentle', words: 'auto', numbers: 'auto', patterns: 'auto', memory: 'auto',
  });
});

test('the grown-up summary reads like a sentence, not a score', () => {
  let report = emptyReport();
  assert.equal(summaryOf(report, 'memory').text, 'not tried yet');
  report = recordAttempt(report, 'memory', { misses: 1 });
  report = recordAttempt(report, 'memory', { misses: 0 });
  const summary = summaryOf(report, 'memory');
  assert.equal(summary.text, '2 signs · 1 first try');
  assert.equal(summary.attempts, 2);
  assert.equal(totalAttempts(report), 2);
});
