(function () {
  'use strict';

  var channel = 'web';
  var steps = [];
  var editingId = null;

  function canPerm(key) {
    return !!(window.IfluxAdminRbac && IfluxAdminRbac.hasPermission && IfluxAdminRbac.hasPermission(key));
  }

  var WEB_TARGETS = [
    { id: 'home', label: 'Nhà của tôi' },
    { id: 'market', label: 'Thị trường' },
    { id: 'flow', label: 'Dòng tiền' },
    { id: 'community', label: 'Cộng đồng' },
    { id: 'search', label: 'Tìm kiếm' },
    { id: 'pricing', label: 'Gói cước' },
    { id: 'loyalty', label: 'Membership' },
    { id: 'profile', label: 'Hồ sơ / Avatar' }
  ];

  function esc(s) {
    var d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  }

  function toast(msg, type) {
    if (window.ixToast) ixToast(msg, type || 'info');
  }

  function api() {
    return window.IfluxApiClient;
  }

  function loadSteps() {
    if (!api()) {
      toast('Chưa tải API client', 'danger');
      return Promise.resolve();
    }
    return api().listOnboardingStepsAdmin(channel).then(function (res) {
      steps = (res && res.steps) || [];
      renderTable();
    }).catch(function (e) {
      toast(e.message, 'danger');
    });
  }

  function renderTable() {
    var tbody = document.getElementById('ob-steps-body');
    if (!tbody) return;
    if (!steps.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--ix-text-muted);padding:24px">Chưa có bước nào</td></tr>';
      return;
    }
    tbody.innerHTML = steps.map(function (s) {
      return '<tr>' +
        '<td>' + s.step_order + '</td>' +
        '<td><strong>' + esc(s.title) + '</strong></td>' +
        '<td style="max-width:280px">' + esc((s.body_text || '').slice(0, 80)) + ((s.body_text || '').length > 80 ? '…' : '') + '</td>' +
        '<td>' + (channel === 'web' ? esc(s.target_key || '—') : '—') + '</td>' +
        '<td>' + (s.is_active ? '<span class="ix-chip ix-chip-success">Bật</span>' : '<span class="ix-chip">Tắt</span>') + '</td>' +
        '<td style="white-space:nowrap">' +
          (canPerm('marketing.onboarding.edit')
            ? '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ob-edit="' + s.id + '">Sửa</button> '
            : '') +
          (canPerm('marketing.onboarding.edit')
            ? '<button type="button" class="ix-btn ix-btn-ghost ix-btn-sm" data-ob-del="' + s.id + '">Xóa</button>'
            : '') +
        '</td></tr>';
    }).join('');

    tbody.querySelectorAll('[data-ob-edit]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openModal(btn.getAttribute('data-ob-edit'));
      });
    });
    tbody.querySelectorAll('[data-ob-del]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        deleteStep(btn.getAttribute('data-ob-del'));
      });
    });
  }

  function showModal() {
    var modal = document.getElementById('ob-modal');
    if (!modal) return;
    if (window.ixOpenModal) {
      ixOpenModal('ob-modal');
    } else {
      modal.style.display = 'flex';
      modal.setAttribute('aria-hidden', 'false');
    }
  }

  function hideModal() {
    var modal = document.getElementById('ob-modal');
    if (!modal) return;
    if (window.ixCloseModal) {
      ixCloseModal('ob-modal');
    } else {
      modal.style.display = 'none';
      modal.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = '';
    editingId = null;
  }

  function setChannel(next) {
    channel = next;
    document.querySelectorAll('[data-ob-channel]').forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-ob-channel') === channel);
    });
    var targetGroup = document.getElementById('ob-target-group');
    if (targetGroup) targetGroup.hidden = channel !== 'web';
    var hint = document.getElementById('ob-channel-hint');
    if (hint) {
      hint.textContent = channel === 'web'
        ? 'User Web: spotlight menu — vùng xung quanh tối, highlight từng mục menu.'
        : 'Mobile App: slide toàn màn — hình, tiêu đề, mô tả, có Bỏ qua.';
    }
    loadSteps();
  }

  function openModal(id) {
    var modal = document.getElementById('ob-modal');
    var title = document.getElementById('ob-modal-title');
    if (!modal || !title) return;

    var step = id ? steps.find(function (s) { return String(s.id) === String(id); }) : null;
    if (id && !step) {
      toast('Không tìm thấy bước onboarding', 'warning');
      return;
    }

    editingId = id || null;

    title.textContent = step ? 'Sửa bước onboarding' : 'Thêm bước onboarding';
    document.getElementById('ob-f-order').value = step ? step.step_order : (steps.length + 1);
    document.getElementById('ob-f-title').value = step ? step.title : '';
    document.getElementById('ob-f-body').value = step ? step.body_text : '';
    document.getElementById('ob-f-image').value = step ? (step.image_url || '') : '';
    document.getElementById('ob-f-target').value = step ? (step.target_key || '') : '';
    document.getElementById('ob-f-active').checked = step ? step.is_active !== false : true;
    document.getElementById('ob-target-group').hidden = channel !== 'web';
    showModal();
  }

  function closeModal() {
    hideModal();
  }

  function saveStep() {
    var payload = {
      channel: channel,
      step_order: Number(document.getElementById('ob-f-order').value) || 0,
      title: document.getElementById('ob-f-title').value.trim(),
      body_text: document.getElementById('ob-f-body').value.trim(),
      image_url: document.getElementById('ob-f-image').value.trim() || null,
      target_key: channel === 'web' ? (document.getElementById('ob-f-target').value || null) : null,
      is_active: document.getElementById('ob-f-active').checked
    };
    if (!payload.title) {
      toast('Nhập tiêu đề', 'warning');
      return;
    }
    var req = editingId
      ? api().updateOnboardingStepAdmin(editingId, payload)
      : api().createOnboardingStepAdmin(payload);
    req.then(function () {
      toast('Đã lưu', 'success');
      closeModal();
      loadSteps();
    }).catch(function (e) { toast(e.message, 'danger'); });
  }

  function deleteStep(id) {
    if (!confirm('Xóa bước onboarding này?')) return;
    api().deleteOnboardingStepAdmin(id).then(function () {
      toast('Đã xóa', 'success');
      loadSteps();
    }).catch(function (e) { toast(e.message, 'danger'); });
  }

  function previewChannel() {
    if (channel === 'web') {
      toast('Đăng nhập User Web để xem spotlight tour (hoặc gọi IfluxOnboarding.tryStart({ force: true }))', 'info');
      return;
    }
    api().listOnboardingSteps('app').then(function (res) {
      var list = (res && res.steps) || [];
      if (!list.length) { toast('Chưa có bước App', 'warning'); return; }
      if (!window.IfluxOnboardingSlides) {
        var s = document.createElement('script');
        s.src = '../../../User_Web/iflux-web-ui/iflux-onboarding-slides.js';
        s.onload = function () { IfluxOnboardingSlides.startSlides(list); };
        document.body.appendChild(s);
      } else {
        IfluxOnboardingSlides.startSlides(list);
      }
    });
  }

  document.querySelectorAll('[data-ob-channel]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      setChannel(tab.getAttribute('data-ob-channel'));
    });
  });

  document.getElementById('btn-ob-add').addEventListener('click', function () { openModal(null); });
  document.getElementById('btn-ob-preview').addEventListener('click', previewChannel);
  document.getElementById('ob-modal-close').addEventListener('click', closeModal);
  document.getElementById('ob-modal-close2').addEventListener('click', closeModal);
  document.getElementById('ob-modal-save').addEventListener('click', saveStep);

  var targetSel = document.getElementById('ob-f-target');
  if (targetSel) {
    targetSel.innerHTML = '<option value="">— Chọn vị trí menu —</option>' +
      WEB_TARGETS.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.label) + ' (' + t.id + ')</option>';
      }).join('');
  }

  setChannel('web');
})();
