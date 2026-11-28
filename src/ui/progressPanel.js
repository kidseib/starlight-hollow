import { SUBJECTS, SUBJECT_LABELS, LEVEL_LABELS, LEVELS, summaryOf } from '../game/progress.js';

const CYCLE = ['auto', ...LEVELS];

/**
 * The grown-up corner on the pause screen.
 *
 * A parent can see, per subject, how many signs their child has met and how
 * often the answer landed first try, then choose Auto, Gentle or Stretch for
 * that subject alone. Nothing here is a score or a grade: it is a small honest
 * record, and the buttons only change how big the next question is.
 */
export function renderProgressPanel(root, { report, difficulty, onSet } = {}) {
  if (!root) return null;
  root.textContent = '';

  const head = document.createElement('div');
  head.className = 'grownup-head';
  const title = document.createElement('span');
  title.className = 'grownup-title';
  title.textContent = 'Grown-up corner';
  const sub = document.createElement('span');
  sub.className = 'grownup-sub';
  sub.textContent = 'Each subject adapts on its own';
  head.append(title, sub);
  root.append(head);

  for (const subject of SUBJECTS) {
    const summary = summaryOf(report, subject);
    const setting = difficulty?.[subject] ?? 'auto';

    const row = document.createElement('div');
    row.className = 'grownup-row';

    const info = document.createElement('div');
    info.className = 'grownup-info';
    const label = document.createElement('b');
    label.textContent = SUBJECT_LABELS[subject];
    const detail = document.createElement('span');
    detail.textContent = summary.attempts ? summary.text : 'not tried yet';
    info.append(label, detail);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = `grownup-btn level-${setting}`;
    button.dataset.subject = subject;
    button.textContent = LEVEL_LABELS[setting] ?? 'Auto';
    button.setAttribute('aria-label', `${SUBJECT_LABELS[subject]}: ${LEVEL_LABELS[setting] ?? 'Auto'}. Tap to change.`);
    button.addEventListener('click', () => {
      const index = CYCLE.indexOf(setting);
      const next = CYCLE[(index + 1) % CYCLE.length];
      onSet?.(subject, next);
    });

    row.append(info, button);
    root.append(row);
  }

  const foot = document.createElement('p');
  foot.className = 'grownup-foot';
  foot.textContent = 'Auto follows each subject’s own record. Gentle and Stretch change the size of the question, never the sparkles.';
  root.append(foot);
  return root;
}
