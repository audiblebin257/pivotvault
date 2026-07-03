/**
 * Shared helpers for the SEC module: CIK normalization, form<->enum mapping,
 * accession-number formatting, and a lightweight fuzzy string score.
 */

const _ = require('lodash');

/** SEC form string -> Prisma SecFilingType enum value. */
const FORM_TO_ENUM = {
  '10-K': 'TEN_K',
  '10-Q': 'TEN_Q',
  '8-K': 'EIGHT_K',
  'S-1': 'S_1',
  'DEF 14A': 'DEF_14A',
  '20-F': 'TWENTY_F',
};

/** The reverse map, enum -> canonical SEC form string. */
const ENUM_TO_FORM = _.invert(FORM_TO_ENUM);

/** The set of forms Phase 1 tracks. */
const SUPPORTED_FORMS = Object.keys(FORM_TO_ENUM);

/**
 * Map a raw SEC form value to our enum. SEC sometimes appends amendment
 * suffixes (e.g. "10-K/A"); we fold amendments onto their base form.
 * @returns {string|null} enum value or null if unsupported.
 */
function formToEnum(form) {
  if (!form) return null;
  const base = String(form).replace('/A', '').trim().toUpperCase();
  // FORM_TO_ENUM keys are upper except "DEF 14A" already upper.
  const key = Object.keys(FORM_TO_ENUM).find((k) => k.toUpperCase() === base);
  return key ? FORM_TO_ENUM[key] : null;
}

/** Pad a numeric/string CIK to the canonical 10-digit zero-filled form. */
function padCik(cik) {
  const digits = String(cik).replace(/[^0-9]/g, '');
  if (!digits) throw new Error(`Invalid CIK: ${cik}`);
  return digits.padStart(10, '0');
}

/** "0000320193-23-000106" -> "000032019323000106" (folder form). */
function accessionNoDashes(accession) {
  return String(accession).replace(/-/g, '');
}

/** Normalize a company name for comparison (drop punctuation/suffixes). */
function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\b(inc|incorporated|corp|corporation|co|company|ltd|limited|plc|llc|lp|holdings?|group|the)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Levenshtein distance (iterative, O(n*m)). */
function levenshtein(a, b) {
  a = a || '';
  b = b || '';
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_v, i) => i);
  let curr = new Array(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

/**
 * Fuzzy similarity in [0,1] combining normalized-edit-distance with a
 * token-overlap (Jaccard) bonus, so "Apple" vs "Apple Inc." scores high.
 */
function similarity(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;

  const maxLen = Math.max(na.length, nb.length);
  const editScore = 1 - levenshtein(na, nb) / maxLen;

  const ta = new Set(na.split(' ').filter(Boolean));
  const tb = new Set(nb.split(' ').filter(Boolean));
  const inter = [...ta].filter((t) => tb.has(t)).length;
  const union = new Set([...ta, ...tb]).size;
  const jaccard = union ? inter / union : 0;

  // If one name's tokens are a subset of the other, that's a strong signal.
  const subset = inter === Math.min(ta.size, tb.size) ? 0.15 : 0;

  return Math.min(1, Math.max(editScore, jaccard) * 0.85 + jaccard * 0.15 + subset);
}

/** Looks like a CIK: all digits, up to 10 chars. */
function looksLikeCik(input) {
  return /^\d{1,10}$/.test(String(input).trim());
}

/** Looks like a ticker: 1-6 uppercase letters, optional dot class (BRK.B). */
function looksLikeTicker(input) {
  return /^[A-Za-z]{1,6}([.\-][A-Za-z]{1,3})?$/.test(String(input).trim());
}

module.exports = {
  FORM_TO_ENUM,
  ENUM_TO_FORM,
  SUPPORTED_FORMS,
  formToEnum,
  padCik,
  accessionNoDashes,
  normalizeName,
  levenshtein,
  similarity,
  looksLikeCik,
  looksLikeTicker,
};
