// The primary key stays compatible with earlier adventures. Keep the previous
// readable checkpoint separately so interrupted/corrupt writes are recoverable.
const KEY = 'starlight-hollow-save-v1';
const BACKUP = `${KEY}-backup`;
const record = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const ids = (x) => Array.isArray(x) ? [...new Set(x.filter(v => typeof v === 'string'))] : [];

function decode(raw) {
  try {
    const s = JSON.parse(raw);
    if (!record(s) || !['sparkles', 'solved', 'stars', 'visited', 'scanned', 'ended'].some(k => Object.hasOwn(s, k))) return null;
    return {
      sparkles: Number.isSafeInteger(s.sparkles) && s.sparkles >= 0 ? s.sparkles : 0,
      stars: Object.fromEntries(Object.entries(record(s.stars) ? s.stars : {}).filter(([, v]) => v === true)),
      solved: ids(s.solved), scanned: ids(s.scanned), visited: ids(s.visited),
      ended: s.ended === true, zone: typeof s.zone === 'string' ? s.zone : 'meadow',
    };
  } catch { return null; }
}

export function loadSave() {
  try { return decode(localStorage.getItem(KEY)) ?? decode(localStorage.getItem(BACKUP)); }
  catch { return null; }
}

export function writeSave(data) {
  try {
    const previous = localStorage.getItem(KEY);
    if (decode(previous)) {
      try { localStorage.setItem(BACKUP, previous); } catch { /* Prefer the primary if space is tight. */ }
    }
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(BACKUP); localStorage.removeItem(KEY); } catch { /* unavailable */ }
}
