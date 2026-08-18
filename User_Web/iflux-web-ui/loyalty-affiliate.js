/* Loyalty — Affiliate UI (danh sách hoa hồng) */
(function (global) {
  'use strict';

  var Store = null;

  function esc(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function userRef() {
    var u = global.IfluxAuth && IfluxAuth.getUser();
    var link = '';
    if (Store && Store.getReferralLinkForUser) {
      link = Store.getReferralLinkForUser(u);
    } else if (u && u.referral_code) {
      link = u.referral_link || '';
    }
    return {
      link: link,
      code: (u && u.referral_code) || 'IFLUX10'
    };
  }

  function copyText(text, inputEl) {
    if (global.PatternUserProfile && PatternUserProfile.copyText) {
      PatternUserProfile.copyText(text, inputEl);
      return;
    }
    var ok = false;
    try {
      var ta = document.createElement('textarea');
      ta.value = String(text || '');
      ta.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      ok = document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) { /* ignore */ }
    if (global.ixToast) {
      ixToast(ok ? 'Đã sao chép!' : 'Không sao chép được', ok ? 'success' : 'warning');
    }
  }

  function layerClass(layer) {
    if (layer === 'F1') return 'ix-layer-f1';
    if (layer === 'F2') return 'ix-layer-f2';
    return 'ix-layer-f0';
  }

  function statusChip(e) {
    var meta = Store && Store.commissionStatusMeta
      ? Store.commissionStatusMeta(e)
      : { label: 'Đã ghi nhận', chip: 'ix-chip-info' };
    return '<span class="ix-chip ' + meta.chip + '">' + esc(meta.label) + '</span>';
  }

  function renderStats() {
    if (!Store) return;
    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;
    var stats = Store.getStatsForUser(user.id);
    var cfg = Store.getConfig();

    var map = {
      'ifx-aff-stat-total': Store.formatVnd(stats.totalEarn),
      'ifx-aff-stat-unpaid': Store.formatVnd(stats.unpaid),
      'ifx-aff-stat-signups': String(stats.signups),
      'ifx-aff-stat-conv': stats.convRate + '%'
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = map[id];
    });

    document.querySelectorAll('[data-ifx-aff-rate-f0]').forEach(function (el) {
      el.textContent = cfg.f0_pct + '%';
    });
    document.querySelectorAll('[data-ifx-aff-rate-f1]').forEach(function (el) {
      el.textContent = cfg.f1_pct + '%';
    });
    document.querySelectorAll('[data-ifx-aff-rate-f2]').forEach(function (el) {
      el.textContent = cfg.f2_pct + '%';
    });
  }

  function renderTable() {
    var tbody = document.querySelector('#ifx-aff-ref-table tbody');
    if (!tbody || !Store) return;

    var user = global.IfluxAuth && IfluxAuth.getUser();
    if (!user) return;

    var searchEl = document.querySelector('[data-ix-search="ifx-aff-ref-table"]');
    var q = searchEl ? searchEl.value.trim() : '';
    var rows = Store.listForUser(user.id, { q: q });

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:32px" class="ifx-body-s" style="color:var(--ix-text-muted)">Chưa có hoa hồng. Mỗi lượt mua gói từ chuỗi giới thiệu sẽ xuất hiện tại đây.</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (e) {
      return '<tr>' +
        '<td><div class="ix-user-cell"><div class="ix-avatar-sm ' + esc(e.buyerAvatarCls) + '">' + esc(e.buyerInitials) + '</div>' +
        '<div><div class="ix-user-name">' + esc(e.buyerName) + '</div><div class="ifx-caption-s">' + esc(e.sourceNote) + '</div></div></div></td>' +
        '<td><span class="' + layerClass(e.layer) + '">' + esc(e.layer) + '</span></td>' +
        '<td class="ifx-body-s">' + esc(e.productLabel) + '</td>' +
        '<td style="font-weight:600;color:var(--ix-text-primary)">' + Store.formatVnd(e.orderAmount) + '</td>' +
        '<td style="color:var(--ix-accent);font-weight:600">' + esc(e.commissionPct) + '%</td>' +
        '<td style="color:var(--ix-success);font-weight:700">+' + Store.formatVnd(e.commission) + '</td>' +
        '<td class="ifx-caption-m">' + esc(new Date(e.at).toLocaleDateString('vi-VN')) + '</td>' +
        '<td>' + statusChip(e) + '</td></tr>';
    }).join('');
  }

  function bind() {
    Store = global.IfluxLoyaltyAffiliateStore;
    if (!Store) return;

    var ref = userRef();
    var linkInput = document.getElementById('ifx-aff-ref-link');
    var codeInput = document.getElementById('ifx-aff-ref-code');
    if (linkInput) linkInput.value = ref.link;
    if (codeInput) codeInput.value = ref.code;

    var copyLink = document.getElementById('ifx-aff-copy-link');
    var copyCode = document.getElementById('ifx-aff-copy-code');
    var openLink = document.getElementById('ifx-aff-open-link');
    if (copyLink) copyLink.addEventListener('click', function () {
      copyText(linkInput && linkInput.value ? linkInput.value : ref.link, linkInput);
    });
    if (copyCode) copyCode.addEventListener('click', function () {
      copyText(ref.code, codeInput);
    });
    function openAffiliateLink(url) {
      if (!url) return;
      /* Absolute outbound / already-built referral URL — allowlist EVIDENCE */
      if (/^https?:\/\//i.test(url)) {
        global.location.href = url;
        return;
      }
      /* Same-origin path — P6-API-01 */
      if (global.IfluxShellUrlWriter && IfluxShellUrlWriter.navigate) {
        IfluxShellUrlWriter.navigate(url);
        return;
      }
      global.location.href = url;
    }
    if (openLink) openLink.addEventListener('click', function () {
      openAffiliateLink(linkInput && linkInput.value ? linkInput.value : ref.link);
    });
    if (linkInput) {
      linkInput.addEventListener('dblclick', function () {
        openAffiliateLink(linkInput.value || ref.link);
      });
      linkInput.title = 'Double-click để mở trang đăng ký';
    }

    var inviteBtn = document.getElementById('ifx-aff-invite-btn');
    var inviteEmail = document.getElementById('ifx-aff-invite-email');
    if (inviteBtn && inviteEmail) {
      inviteBtn.addEventListener('click', function () {
        if (!inviteEmail.value.trim()) {
          if (global.ixToast) ixToast('Nhập email bạn bè', 'warning');
          return;
        }
        if (global.ixToast) ixToast('Đã gửi lời mời tới ' + inviteEmail.value.trim(), 'success');
        inviteEmail.value = '';
      });
    }

    var searchEl = document.querySelector('[data-ix-search="ifx-aff-ref-table"]');
    if (searchEl) {
      searchEl.addEventListener('input', function () {
        renderTable();
      });
    }

    renderStats();
    renderTable();

    if (global.IfluxUserNotificationsUI) IfluxUserNotificationsUI.refresh();
  }

  function init() {
    bind();
  }

  function refresh() {
    renderStats();
    renderTable();
  }

  global.IfluxLoyaltyAffiliate = { init: init, refresh: refresh };
})(window);
