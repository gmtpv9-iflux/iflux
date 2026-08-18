/* Cảnh báo CP — sandbox localStorage (thứ hạng nhóm / Hỗ trợ-Kháng cự) */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'iflux_alerts_v1';

  function us() { return global.IfluxUserStorage; }

  function readRaw() {
    var store = us();
    if (store) return store.readJson(STORAGE_KEY, { alerts: [] });
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    return { alerts: [] };
  }

  function writeRaw(state) {
    var store = us();
    if (store) store.writeJson(STORAGE_KEY, state);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  var GROUP_SOURCE_LABELS = {
    sector: 'Ngành',
    family: 'Họ CP',
    story: 'Chủ đề'
  };

  var SR_LEVEL_LABELS = {
    support: 'Hỗ trợ',
    resistance: 'Kháng cự'
  };

  function tax() { return global.IfluxWatchlistTaxonomy; }

  function uid() {
    return 'alr_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
  }

  function isSupportedAlert(a) {
    return isRankAlert(a) || isSrAlert(a);
  }

  function purgeLegacyAlerts(state) {
    var kept = state.alerts.filter(isSupportedAlert);
    if (kept.length !== state.alerts.length) {
      state.alerts = kept;
      write(state);
    }
  }

  function read() {
    try {
      var parsed = readRaw();
      if (parsed && parsed.alerts) {
        purgeLegacyAlerts(parsed);
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return { alerts: [] };
  }

  function write(state) {
    writeRaw(state);
    if (global.IfluxUserDataSync) {
      IfluxUserDataSync.scheduleAlertsSync(state);
    }
  }

  function isRankAlert(a) {
    return a.type === 'rank';
  }

  function isSrAlert(a) {
    return a.type === 'sr';
  }

  function fmtPct(n) {
    if (n == null || isNaN(n)) return '—';
    return (n >= 0 ? '+' : '') + n + '%';
  }

  function getCurrentRank(alert) {
    var t = tax();
    if (!t || !alert.groupSource || !alert.groupId) return null;
    return t.getGroupRank(alert.groupSource, alert.groupId);
  }

  function getCurrentSrPct(alert) {
    /* SOL-UNAVAIL / WP-3: SR LIVE UI nhưng không có runtime authority → luôn null. */
    return null;
  }

  function evaluateRankTriggered(alert) {
    if (!isRankAlert(alert) || alert.state === 'PAUSED') return false;
    var rank = getCurrentRank(alert);
    if (rank == null) return false;
    return rank <= alert.topN;
  }

  function evaluateSrTriggered(alert) {
    if (!isSrAlert(alert) || alert.state === 'PAUSED') return false;
    var pct = getCurrentSrPct(alert);
    if (pct == null) return false;
    if (alert.levelType === 'support') {
      return pct <= alert.pctThreshold;
    }
    return pct >= alert.pctThreshold;
  }

  function syncAlertStates() {
    var state = read();
    var changed = false;
    state.alerts.forEach(function (a) {
      if (a.state === 'PAUSED') return;
      var triggered = false;
      if (isRankAlert(a)) triggered = evaluateRankTriggered(a);
      else if (isSrAlert(a)) triggered = evaluateSrTriggered(a);
      else return;
      var next = triggered ? 'TRIGGERED' : 'ACTIVE';
      if (a.state !== next) {
        if (next === 'TRIGGERED' && global.IfluxInAppNotifications && global.IfluxAuth) {
          var user = IfluxAuth.getUser();
          if (user) IfluxInAppNotifications.pushAlertTriggered(user.id, a);
        }
        a.state = next;
        changed = true;
      }
    });
    if (changed) write(state);
  }

  function getAlerts() {
    syncAlertStates();
    return read().alerts.filter(isSupportedAlert).slice().sort(function (a, b) {
      return (b.created_at || '').localeCompare(a.created_at || '');
    });
  }

  function getAlert(id) {
    var found = null;
    getAlerts().forEach(function (a) {
      if (a.id === id) found = a;
    });
    return found;
  }

  function getAlertsForTicker(ticker) {
    return getAlerts().filter(function (a) {
      return a.ticker === ticker;
    });
  }

  function getRankAlertsForTicker(ticker) {
    return getAlertsForTicker(ticker).filter(isRankAlert);
  }

  function getSrAlertsForTicker(ticker) {
    return getAlertsForTicker(ticker).filter(isSrAlert);
  }

  function hasActiveAlert(ticker) {
    return getAlertsForTicker(ticker).some(function (a) {
      return a.state === 'ACTIVE' || a.state === 'TRIGGERED';
    });
  }

  function countForTicker(ticker) {
    return getAlertsForTicker(ticker).filter(function (a) {
      return a.state === 'ACTIVE' || a.state === 'TRIGGERED';
    }).length;
  }

  function createRankAlert(payload) {
    var ticker = (payload.ticker || '').trim().toUpperCase();
    var groupSource = payload.groupSource;
    if (!ticker) throw new Error('Thiếu mã CP');
    if (['sector', 'family', 'story'].indexOf(groupSource) < 0) {
      throw new Error('Loại nhóm không hợp lệ');
    }
    var topN = parseInt(payload.topN, 10);
    if (isNaN(topN) || topN < 1 || topN > 10) throw new Error('Chọn Top hợp lệ (1–10)');

    var t = tax();
    if (!t) throw new Error('Không tải được phân loại');
    var memberships = t.getTickerMemberships(ticker);
    var group = memberships[groupSource];
    if (!group) {
      throw new Error('Mã không thuộc nhóm ' + (GROUP_SOURCE_LABELS[groupSource] || groupSource));
    }

    var state = read();
    var dup = state.alerts.some(function (a) {
      return a.ticker === ticker && a.type === 'rank' && a.groupSource === groupSource;
    });
    if (dup) throw new Error('Đã có cảnh báo thứ hạng ' + (GROUP_SOURCE_LABELS[groupSource] || groupSource));

    var rank = t.getGroupRank(groupSource, group.id);
    var alert = {
      id: uid(),
      ticker: ticker,
      type: 'rank',
      groupSource: groupSource,
      groupId: group.id,
      groupName: group.name,
      topN: topN,
      state: rank <= topN ? 'TRIGGERED' : 'ACTIVE',
      version: 1,
      created_at: new Date().toISOString()
    };

    state.alerts.push(alert);
    write(state);
    return alert;
  }

  function createSrAlert(payload) {
    var ticker = (payload.ticker || '').trim().toUpperCase();
    var levelType = payload.levelType;
    if (!ticker) throw new Error('Thiếu mã CP');
    if (levelType !== 'support' && levelType !== 'resistance') {
      throw new Error('Chọn Hỗ trợ hoặc Kháng cự');
    }
    var sessions = parseInt(payload.sessions, 10);
    if (isNaN(sessions) || [5, 10, 20, 50].indexOf(sessions) < 0) {
      throw new Error('Chọn số phiên hợp lệ (5/10/20/50)');
    }
    var pctThreshold = parseFloat(payload.pctThreshold);
    if (isNaN(pctThreshold)) throw new Error('Nhập ngưỡng % hợp lệ');
    if (levelType === 'support' && pctThreshold > 0) {
      throw new Error('Hỗ trợ: ngưỡng % thường âm (VD: -3)');
    }
    if (levelType === 'resistance' && pctThreshold < 0) {
      throw new Error('Kháng cự: ngưỡng % thường dương (VD: +3)');
    }

    var state = read();
    var dup = state.alerts.some(function (a) {
      return a.ticker === ticker && a.type === 'sr' &&
        a.levelType === levelType && a.sessions === sessions;
    });
    if (dup) {
      throw new Error('Đã có cảnh báo ' + SR_LEVEL_LABELS[levelType] + ' ' + sessions + ' phiên');
    }

    var triggered = evaluateSrTriggered({
      ticker: ticker,
      levelType: levelType,
      sessions: sessions,
      pctThreshold: pctThreshold,
      state: 'ACTIVE'
    });

    var alert = {
      id: uid(),
      ticker: ticker,
      type: 'sr',
      levelType: levelType,
      sessions: sessions,
      pctThreshold: pctThreshold,
      state: triggered ? 'TRIGGERED' : 'ACTIVE',
      version: 1,
      created_at: new Date().toISOString()
    };

    state.alerts.push(alert);
    write(state);
    return alert;
  }

  function updateAlertState(id, nextState) {
    var state = read();
    var found = false;
    state.alerts.forEach(function (a) {
      if (a.id === id) {
        a.state = nextState;
        a.version = (a.version || 1) + 1;
        found = true;
      }
    });
    if (!found) throw new Error('Không tìm thấy cảnh báo');
    write(state);
  }

  function togglePause(id) {
    var a = getAlert(id);
    if (!a) throw new Error('Không tìm thấy cảnh báo');
    updateAlertState(id, a.state === 'PAUSED' ? 'ACTIVE' : 'PAUSED');
    syncAlertStates();
  }

  function deleteAlert(id) {
    var state = read();
    state.alerts = state.alerts.filter(function (a) { return a.id !== id; });
    write(state);
  }

  function formatCondition(alert) {
    if (isRankAlert(alert)) {
      var src = GROUP_SOURCE_LABELS[alert.groupSource] || alert.groupSource;
      return src + ' · ' + alert.groupName + ' · Top ' + alert.topN;
    }
    if (isSrAlert(alert)) {
      var label = SR_LEVEL_LABELS[alert.levelType] || alert.levelType;
      return label + ' · ' + alert.sessions + ' phiên · ' + fmtPct(alert.pctThreshold);
    }
    return 'Cảnh báo';
  }

  function getBadgeItemsForTicker(ticker) {
    var rankItems = getRankAlertsForTicker(ticker)
      .filter(function (a) { return a.state !== 'PAUSED'; })
      .map(function (a) {
        var rank = getCurrentRank(a) || '—';
        return {
          kind: 'rank',
          alertId: a.id,
          groupName: a.groupName,
          rank: rank,
          topN: a.topN,
          triggered: a.state === 'TRIGGERED' || evaluateRankTriggered(a)
        };
      });

    var srItems = getSrAlertsForTicker(ticker)
      .filter(function (a) { return a.state !== 'PAUSED'; })
      .map(function (a) {
        return {
          kind: 'sr',
          alertId: a.id,
          levelLabel: SR_LEVEL_LABELS[a.levelType] || a.levelType,
          sessions: a.sessions,
          pctThreshold: a.pctThreshold,
          pctDisplay: fmtPct(a.pctThreshold),
          triggered: a.state === 'TRIGGERED' || evaluateSrTriggered(a)
        };
      });

    return rankItems.concat(srItems);
  }

  function getTriggeredAlerts() {
    return getAlerts().filter(function (a) { return a.state === 'TRIGGERED'; });
  }

  function countTriggered() {
    return getTriggeredAlerts().length;
  }

  function stateLabel(state) {
    if (state === 'TRIGGERED') return 'Đã kích hoạt';
    if (state === 'PAUSED') return 'Tạm dừng';
    return 'Đang chạy';
  }

  global.IfluxAlertStore = {
    GROUP_SOURCE_LABELS: GROUP_SOURCE_LABELS,
    SR_LEVEL_LABELS: SR_LEVEL_LABELS,
    getAlerts: getAlerts,
    getTriggeredAlerts: getTriggeredAlerts,
    countTriggered: countTriggered,
    getAlert: getAlert,
    getAlertsForTicker: getAlertsForTicker,
    getRankAlertsForTicker: getRankAlertsForTicker,
    getSrAlertsForTicker: getSrAlertsForTicker,
    getBadgeItemsForTicker: getBadgeItemsForTicker,
    hasActiveAlert: hasActiveAlert,
    countForTicker: countForTicker,
    createRankAlert: createRankAlert,
    createSrAlert: createSrAlert,
    updateAlertState: updateAlertState,
    togglePause: togglePause,
    deleteAlert: deleteAlert,
    formatCondition: formatCondition,
    fmtPct: fmtPct,
    stateLabel: stateLabel,
    syncAlertStates: syncAlertStates,
    getCurrentRank: getCurrentRank,
    getCurrentSrPct: getCurrentSrPct,
    isRankAlert: isRankAlert,
    isSrAlert: isSrAlert
  };
})(window);
