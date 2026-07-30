/* Composer bình luận dùng chung — attach ảnh | ô nhập | nút gửi tròn */
(function (global) {
  'use strict';

  var MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /**
   * @param {object} opts
   * @param {string=} opts.formClass
   * @param {string=} opts.placeholder
   * @param {string=} opts.bodyAttr  data-attr name for text input (default data-ifx-cmt-body)
   * @param {string=} opts.formAttrs extra attributes on <form>
   * @param {boolean=} opts.withMentionDrop
   * @param {string=} opts.extraTop  HTML above shell (tag preview, reply bar…)
   */
  function html(opts) {
    opts = opts || {};
    var bodyAttr = opts.bodyAttr || 'data-ifx-cmt-body';
    var formClass = 'ifx-cmt-composer' + (opts.formClass ? ' ' + opts.formClass : '');
    var placeholder = opts.placeholder || 'Viết bình luận…';
    var mention = opts.withMentionDrop
      ? '<div class="ifx-mention-drop" data-ifx-mention-drop hidden></div>'
      : '';
    return (
      '<form class="' + formClass + '" ' + (opts.formAttrs || '') + '>' +
        (opts.extraTop || '') +
        '<div class="ifx-cmt-composer__shell">' +
          '<button type="button" class="ifx-cmt-composer__attach" data-ifx-cmt-attach aria-label="Đính kèm hình ảnh">' +
            '<i class="ti ti-photo"></i>' +
          '</button>' +
          '<input type="file" accept="image/*" hidden data-ifx-cmt-file />' +
          '<div class="ifx-cmt-composer__field ifx-mention-wrap">' +
            '<input type="text" class="ifx-cmt-composer__input" ' + bodyAttr +
              ' placeholder="' + esc(placeholder) + '" autocomplete="off" />' +
            mention +
          '</div>' +
          '<button type="submit" class="ifx-cmt-composer__send" aria-label="Gửi bình luận">' +
            '<i class="ti ti-send"></i>' +
          '</button>' +
        '</div>' +
        '<div class="ifx-cmt-composer__preview" data-ifx-cmt-preview hidden></div>' +
      '</form>'
    );
  }

  function clearImage(form) {
    if (!form) return;
    form.__ifxCmtImage = null;
    var file = form.querySelector('[data-ifx-cmt-file]');
    if (file) file.value = '';
    var preview = form.querySelector('[data-ifx-cmt-preview]');
    if (preview) {
      preview.hidden = true;
      preview.innerHTML = '';
    }
  }

  function setImagePreview(form, dataUrl) {
    form.__ifxCmtImage = dataUrl || null;
    var preview = form.querySelector('[data-ifx-cmt-preview]');
    if (!preview) return;
    if (!dataUrl) {
      preview.hidden = true;
      preview.innerHTML = '';
      return;
    }
    preview.hidden = false;
    preview.innerHTML =
      '<div class="ifx-cmt-composer__thumb">' +
        '<img src="' + dataUrl + '" alt="Ảnh đính kèm" />' +
        '<button type="button" class="ifx-cmt-composer__thumb-remove" data-ifx-cmt-remove-img aria-label="Gỡ ảnh">' +
          '<i class="ti ti-x"></i>' +
        '</button>' +
      '</div>';
    var rm = preview.querySelector('[data-ifx-cmt-remove-img]');
    if (rm) {
      rm.addEventListener('click', function () { clearImage(form); });
    }
  }

  function bind(form, opts) {
    if (!form || form.getAttribute('data-ifx-cmt-bound') === '1') return;
    form.setAttribute('data-ifx-cmt-bound', '1');
    opts = opts || {};

    var attachBtn = form.querySelector('[data-ifx-cmt-attach]');
    var fileInput = form.querySelector('[data-ifx-cmt-file]');
    var bodyInput = form.querySelector('[data-ifx-cmt-body], [data-ifx-stock-comment-body], [data-ifx-stock-reply-body], [data-ifx-com-comment-body]');

    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', function () { fileInput.click(); });
      fileInput.addEventListener('change', function () {
        var file = fileInput.files && fileInput.files[0];
        if (!file) return;
        if (file.size > MAX_IMAGE_BYTES) {
          if (global.ixToast) ixToast('Ảnh tối đa 1.5MB', 'warning');
          fileInput.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          setImagePreview(form, String(reader.result || ''));
        };
        reader.readAsDataURL(file);
      });
    }

    if (typeof opts.onBind === 'function') opts.onBind(form, bodyInput);
  }

  function readPayload(form) {
    var bodyInput = form.querySelector('[data-ifx-cmt-body], [data-ifx-stock-comment-body], [data-ifx-stock-reply-body], [data-ifx-com-comment-body]');
    return {
      body: bodyInput ? String(bodyInput.value || '').trim() : '',
      image: form.__ifxCmtImage || null
    };
  }

  function reset(form) {
    if (!form) return;
    var bodyInput = form.querySelector('[data-ifx-cmt-body], [data-ifx-stock-comment-body], [data-ifx-stock-reply-body], [data-ifx-com-comment-body]');
    if (bodyInput) bodyInput.value = '';
    clearImage(form);
  }

  function imageHtml(url) {
    if (!url) return '';
    return '<div class="ifx-cmt-image"><img src="' + esc(url) + '" alt="Ảnh bình luận" loading="lazy" /></div>';
  }

  global.IfluxCommentComposer = {
    html: html,
    bind: bind,
    readPayload: readPayload,
    reset: reset,
    clearImage: clearImage,
    imageHtml: imageHtml
  };
})(window);
