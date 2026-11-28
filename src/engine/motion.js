// Reduced-motion preference. The operating system setting is the default, and a
// child (or grown-up) can turn calm motion on from the pause screen. It only
// ever softens animation; nothing in the game depends on it.

const KEY = 'starlight-hollow-calm-motion';

export function reducedMotion() {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'on') return true;
    if (stored === 'off') return false;
  } catch { /* storage unavailable: fall back to the system setting */ }
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function setReducedMotion(on) {
  try {
    localStorage.setItem(KEY, on ? 'on' : 'off');
  } catch { /* storage unavailable: the choice lasts for this session only */ }
  return !!on;
}
