/* ADM-MKT-005 — Ranking Configuration */
(function (global) {
  'use strict';

  var Store = global.IfluxMarketRegistryStore;

  var WEIGHT_KEYS = [
    { key: 'performance', id: 'adm-mkt-rank-w-performance', label: 'Hiệu suất (PG)' },
    { key: 'flow', id: 'adm-mkt-rank-w-flow', label: 'Dòng tiền' },
    { key: 'volume', id: 'adm-mkt-rank-w-volume', label: 'Khối lượng' }
  ];

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'primary');
  }

  function parseVndInput(raw) {
    return Number(String(raw || '').replace(/[^\d]/g, '')) || 0;
  }

  function fmtVnd(n) {
    if (Store && typeof Store.formatVnd === 'function') return Store.formatVnd(n);
    return '₫' + Number(n || 0).toLocaleString('vi-VN');
  }

  function readWeights() {
    var weights = {};
    var sum = 0;
    WEIGHT_KEYS.forEach(function (w) {
      var el = document.getElementById(w.id);
      var val = el ? Number(el.value) : 0;
      if (isNaN(val)) val = 0;
      weights[w.key] = val;
      sum += val;
    });
    return { weights: weights, sum: sum };
  }

  function updateWeightWarning(sum) {
    var warn = document.getElementById('adm-mkt-rank-weight-warning');
    var sumEl = document.getElementById('adm-mkt-rank-weight-sum');
    if (sumEl) sumEl.textContent = String(sum);
    if (!warn) return;
    if (sum !== 100) {
      warn.style.display = '';
      warn.textContent = 'Tổng trọng số phải bằng 100 (hiện tại: ' + sum + ')';
    } else {
      warn.style.display = 'none';
    }
  }

  function syncSlidersFromInputs() {
    WEIGHT_KEYS.forEach(function (w) {
      var input = document.getElementById(w.id);
      var slider = document.getElementById(w.id + '-slider');
      if (input && slider) slider.value = input.value || 0;
    });
    updateWeightWarning(readWeights().sum);
  }

  function loadForm() {
    if (!Store) return;
    var cfg = Store.getRankingConfig();
    WEIGHT_KEYS.forEach(function (w) {
      var val = (cfg.weights && cfg.weights[w.key]) != null ? cfg.weights[w.key] : 0;
      var input = document.getElementById(w.id);
      var slider = document.getElementById(w.id + '-slider');
      if (input) input.value = val;
      if (slider) slider.value = val;
    });

    var lookback = document.getElementById('adm-mkt-rank-lookback');
    var flowLookback = document.getElementById('adm-mkt-rank-flow-lookback');
    var minLiq = document.getElementById('adm-mkt-rank-min-liquidity');
    var topN = document.getElementById('adm-mkt-rank-sector-topn');

    if (lookback) lookback.value = cfg.lookbackDays != null ? cfg.lookbackDays : 7;
    if (flowLookback) flowLookback.value = cfg.flowLookback != null ? cfg.flowLookback : 5;
    if (minLiq) minLiq.value = fmtVnd(cfg.minLiquidity);
    if (topN) topN.value = cfg.sectorTopN != null ? cfg.sectorTopN : 10;

    updateWeightWarning(readWeights().sum);
  }

  function saveForm() {
    if (!Store) return;
    var parsed = readWeights();
    if (parsed.sum !== 100) {
      toast('Tổng trọng số phải bằng 100', 'danger');
      updateWeightWarning(parsed.sum);
      return;
    }

    var lookback = Number((document.getElementById('adm-mkt-rank-lookback') || {}).value);
    var flowLookback = Number((document.getElementById('adm-mkt-rank-flow-lookback') || {}).value);
    var minLiquidity = parseVndInput((document.getElementById('adm-mkt-rank-min-liquidity') || {}).value);
    var sectorTopN = Number((document.getElementById('adm-mkt-rank-sector-topn') || {}).value);

    if (!lookback || lookback < 1) {
      toast('Lookback days phải ≥ 1', 'danger');
      return;
    }
    if (!minLiquidity) {
      toast('Min liquidity không hợp lệ', 'danger');
      return;
    }

    Store.saveRankingConfig({
      weights: parsed.weights,
      lookbackDays: lookback,
      flowLookback: flowLookback,
      minLiquidity: minLiquidity,
      sectorTopN: sectorTopN
    });

    loadForm();
    toast('Đã lưu cấu hình xếp hạng', 'success');
    var payload = {
      momentum: parsed.weights.momentum,
      flow: parsed.weights.flow,
      liquidity: parsed.weights.liquidity,
      quality: parsed.weights.quality,
      lookbackDays: lookback,
      flowLookback: flowLookback,
      minLiquidity: minLiquidity,
      sectorTopN: sectorTopN
    };
    var h = { 'Content-Type': 'application/json', Accept: 'application/json' };
    var token = null;
    if (global.IfluxAdminAuth && IfluxAdminAuth.getSession) {
      var s = IfluxAdminAuth.getSession();
      if (s && s.token) token = s.token;
    }
    if (token) h.Authorization = 'Bearer ' + token;
    else h['X-Admin-Key'] = 'iflux-admin-local-dev';
    var base = (global.IfluxAdminAuth && IfluxAdminAuth.apiBase) ? IfluxAdminAuth.apiBase() : '/api';
    fetch(base + '/admin/market-config/ranking', {
      method: 'PATCH', headers: h, body: JSON.stringify({ payload: payload })
    }).catch(function () { /* local OK */ });
  }

  function bindEvents() {
    WEIGHT_KEYS.forEach(function (w) {
      var input = document.getElementById(w.id);
      var slider = document.getElementById(w.id + '-slider');
      if (input) {
        input.addEventListener('input', function () {
          if (slider) slider.value = input.value;
          updateWeightWarning(readWeights().sum);
        });
      }
      if (slider) {
        slider.addEventListener('input', function () {
          if (input) input.value = slider.value;
          updateWeightWarning(readWeights().sum);
        });
      }
    });

    var minLiq = document.getElementById('adm-mkt-rank-min-liquidity');
    if (minLiq) {
      minLiq.addEventListener('blur', function () {
        minLiq.value = fmtVnd(parseVndInput(minLiq.value));
      });
    }

    var saveBtn = document.getElementById('btn-adm-mkt-rank-save');
    if (saveBtn) saveBtn.addEventListener('click', saveForm);
  }

  function init() {
    if (!Store) {
      toast('Thiếu IfluxMarketRegistryStore', 'danger');
      return;
    }
    loadForm();
    bindEvents();
  }

  global.AdmMarketRanking = { init: init, reload: loadForm };
})(window);
