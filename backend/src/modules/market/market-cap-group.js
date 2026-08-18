'use strict';

/** Cap Group Master: large | medium | small. Micro+ → small (Solution LOCK). */

const CANON = new Set(['large', 'medium', 'small']);

function normalizeCapGroup(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (CANON.has(s)) return s;
  if (s === 'mid' || s === 'trung_binh' || s === 'trung bình') return 'medium';
  if (s === 'lớn' || s === 'lon') return 'large';
  if (s === 'nhỏ' || s === 'nho') return 'small';
  if (s === 'micro' || s === 'nano' || s === 'xs' || s === 'tiny') return 'small';
  if (s.includes('micro') || s.includes('nano')) return 'small';
  if (s.includes('large') || s.includes('big')) return 'large';
  if (s.includes('mid') || s.includes('medium')) return 'medium';
  if (s.includes('small')) return 'small';
  return null;
}

/**
 * Empty-fill helper từ MARKETCAP (VND) khi FA Cap Group không có live adapter (FiinPro).
 * Không phải Cap Classification Engine product — chỉ gán large|medium|small khi Master trống.
 * Ngưỡng (VND): large ≥ 10 nghìn tỷ · medium ≥ 1 nghìn tỷ · else small.
 */
function capGroupFromMarketCap(marketCap) {
  const n = Number(marketCap);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n >= 1e13) return 'large';
  if (n >= 1e12) return 'medium';
  return 'small';
}

function isEmptyMasterValue(v) {
  if (v == null || v === '') return true;
  if (typeof v === 'number' && !Number.isFinite(v)) return true;
  const s = String(v).trim();
  if (!s) return true;
  /* 0 / 0.00 = trống cho shares_outstanding, market_cap demo */
  const n = Number(s);
  if (Number.isFinite(n) && n === 0) return true;
  return false;
}

/** market_cap dưới 1 triệu VND = rác/demo → coi như trống để FA Trusted empty-fill. */
function isEmptyMarketCapMaster(v) {
  if (isEmptyMasterValue(v)) return true;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 && n < 1e6;
}

function valuesEqual(a, b) {
  if (isEmptyMasterValue(a) && isEmptyMasterValue(b)) return true;
  if (isEmptyMasterValue(a) || isEmptyMasterValue(b)) return false;
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && String(a).trim() !== '' && String(b).trim() !== '') {
    return Math.abs(na - nb) < 1e-9;
  }
  return String(a).trim() === String(b).trim();
}

module.exports = {
  normalizeCapGroup,
  capGroupFromMarketCap,
  isEmptyMasterValue,
  isEmptyMarketCapMaster,
  valuesEqual,
  CANON_CAP_GROUPS: ['large', 'medium', 'small']
};
