/* FN-CMS-ED-001 — Article body editor (TipTap wrapper · IMG-A · raw HTML mode) */
(function (global) {
  'use strict';

  function contract() {
    return global.IfluxArticleHtmlContract || null;
  }

  function sanitize(html) {
    var c = contract();
    if (!c || typeof c.sanitizeArticleHtml !== 'function') return '';
    return c.sanitizeArticleHtml(html);
  }

  function vendor() {
    return global.IfluxTipTapVendor || null;
  }

  function toast(msg, type) {
    if (typeof global.ixToast === 'function') global.ixToast(msg, type || 'info');
    else if (global.console) global.console.warn(msg);
  }

  function promptUrl(title) {
    var v = global.prompt(title || 'Nhập URL', 'https://');
    return v == null ? '' : String(v).trim();
  }

  /**
   * @param {HTMLElement} root
   * @returns {{ getBodyHtml: Function, setBodyHtml: Function, destroy: Function }}
   */
  function mount(root) {
    if (!root) throw new Error('article-body-editor: missing root');
    var v = vendor();
    if (!v || !v.Editor) throw new Error('TipTap vendor missing');
    if (!contract()) throw new Error('Article HTML Contract missing');
    if (!global.DOMPurify) throw new Error('DOMPurify vendor missing');

    var mode = 'rich';
    var toolbar = root.querySelector('[data-abody-toolbar]');
    var richHost = root.querySelector('[data-abody-rich]');
    var htmlTa = root.querySelector('[data-abody-html]');
    var preview = root.querySelector('[data-abody-preview]');
    var previewFrame = root.querySelector('[data-abody-preview-frame]');
    var modeBtns = root.querySelectorAll('[data-abody-mode]');
    var hiddenField = root.querySelector('#fld-body') || document.getElementById('fld-body');

    if (!richHost || !htmlTa) throw new Error('article-body-editor: missing rich/html hosts');

    var Editor = v.Editor;
    var StarterKit = v.StarterKit;
    var Link = v.Link;
    var Image = v.Image;
    var Table = v.Table;
    var TableRow = v.TableRow;
    var TableCell = v.TableCell;
    var TableHeader = v.TableHeader;

    function syncHidden(html) {
      if (hiddenField) hiddenField.value = html || '';
    }

    function renderPreview(html) {
      var clean = sanitize(html || '');
      if (previewFrame && previewFrame.tagName === 'IFRAME') {
        var doc = previewFrame.contentDocument || (previewFrame.contentWindow && previewFrame.contentWindow.document);
        if (!doc) return;
        doc.open();
        doc.write(
          '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"/>' +
          '<link rel="stylesheet" href="/User_Web/iflux-web-ui/iflux-web-ui.css"/>' +
          '<link rel="stylesheet" href="/User_Web/iflux-web-ui/news.css"/>' +
          '<style>body{margin:0;padding:16px;background:transparent}</style>' +
          '</head><body><div class="ifx-com-article__body">' + clean + '</div></body></html>'
        );
        doc.close();
        return;
      }
      if (preview) preview.innerHTML = clean;
    }

    function getHtmlFromEditor() {
      if (!editor) return '';
      return sanitize(editor.getHTML());
    }

    var editor = new Editor({
      element: richHost,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          code: false,
          codeBlock: false,
          strike: false,
          horizontalRule: true
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { rel: 'noopener', target: '_blank' },
          validate: function (href) {
            return contract().isAllowedHref(href);
          }
        }),
        Image.configure({
          allowBase64: false,
          HTMLAttributes: {}
        }),
        Table.configure({ resizable: false }),
        TableRow,
        TableHeader,
        TableCell
      ],
      content: '',
      editorProps: {
        attributes: {
          class: 'ix-article-tiptap',
          'aria-label': 'Nội dung bài viết'
        },
        handlePaste: function (_view, event) {
          var cd = event.clipboardData;
          if (!cd) return false;
          /* IMG-A: reject file image paste */
          if (cd.files && cd.files.length) {
            var hasImgFile = false;
            for (var i = 0; i < cd.files.length; i++) {
              if (cd.files[i] && String(cd.files[i].type || '').indexOf('image/') === 0) {
                hasImgFile = true;
                break;
              }
            }
            if (hasImgFile) {
              event.preventDefault();
              toast('v1 chỉ hỗ trợ ảnh bằng URL https/http — chưa có Upload Media', 'warning');
              return true;
            }
          }
          var html = cd.getData('text/html');
          if (html) {
            event.preventDefault();
            var clean = sanitize(html);
            editor.commands.insertContent(clean);
            queuePreview();
            return true;
          }
          return false;
        },
        handleDrop: function (_view, event) {
          var dt = event.dataTransfer;
          if (!dt || !dt.files || !dt.files.length) return false;
          for (var i = 0; i < dt.files.length; i++) {
            if (dt.files[i] && String(dt.files[i].type || '').indexOf('image/') === 0) {
              event.preventDefault();
              toast('v1 chỉ hỗ trợ ảnh bằng URL https/http — chưa có Upload Media', 'warning');
              return true;
            }
          }
          return false;
        }
      },
      onUpdate: function () {
        if (mode === 'rich') {
          var h = getHtmlFromEditor();
          syncHidden(h);
          queuePreview();
        }
      }
    });

    var previewTimer = null;
    function queuePreview() {
      clearTimeout(previewTimer);
      previewTimer = setTimeout(function () {
        renderPreview(getBodyHtml());
      }, 120);
    }

    function setModeBtnState() {
      modeBtns.forEach(function (btn) {
        var m = btn.getAttribute('data-abody-mode');
        var active = m === mode;
        btn.classList.toggle('ix-btn-primary', active);
        btn.classList.toggle('ix-btn-outline', !active);
      });
    }

    function setMode(next) {
      if (next === mode) return;
      if (next === 'html') {
        var fromRich = getHtmlFromEditor();
        htmlTa.value = fromRich;
        syncHidden(fromRich);
        richHost.hidden = true;
        if (toolbar) toolbar.hidden = true;
        htmlTa.hidden = false;
        mode = 'html';
        setModeBtnState();
        renderPreview(fromRich);
        return;
      }
      if (next === 'rich') {
        /* Mode Gate: sanitize before TipTap setContent — no beautify */
        var clean = sanitize(htmlTa.value || '');
        htmlTa.value = clean;
        editor.commands.setContent(clean, false);
        htmlTa.hidden = true;
        richHost.hidden = false;
        if (toolbar) toolbar.hidden = false;
        mode = 'rich';
        setModeBtnState();
        syncHidden(clean);
        renderPreview(clean);
      }
    }

    function getBodyHtml() {
      if (mode === 'html') {
        var clean = sanitize(htmlTa.value || '');
        syncHidden(clean);
        return clean;
      }
      var h = getHtmlFromEditor();
      syncHidden(h);
      return h;
    }

    function setBodyHtml(html) {
      var clean = sanitize(html || '');
      htmlTa.value = clean;
      editor.commands.setContent(clean, false);
      syncHidden(clean);
      renderPreview(clean);
    }

    function run(cmd) {
      if (mode !== 'rich') return;
      cmd(editor.chain().focus());
      queuePreview();
    }

    function bindToolbar() {
      if (!toolbar) return;
      toolbar.addEventListener('click', function (ev) {
        var btn = ev.target.closest('[data-abody-cmd]');
        if (!btn) return;
        ev.preventDefault();
        var cmd = btn.getAttribute('data-abody-cmd');
        if (cmd === 'h2') return run(function (c) { c.toggleHeading({ level: 2 }).run(); });
        if (cmd === 'h3') return run(function (c) { c.toggleHeading({ level: 3 }).run(); });
        if (cmd === 'p') return run(function (c) { c.setParagraph().run(); });
        if (cmd === 'bold') return run(function (c) { c.toggleBold().run(); });
        if (cmd === 'italic') return run(function (c) { c.toggleItalic().run(); });
        if (cmd === 'bullet') return run(function (c) { c.toggleBulletList().run(); });
        if (cmd === 'ordered') return run(function (c) { c.toggleOrderedList().run(); });
        if (cmd === 'quote') return run(function (c) { c.toggleBlockquote().run(); });
        if (cmd === 'hr') return run(function (c) { c.setHorizontalRule().run(); });
        if (cmd === 'link') {
          var href = promptUrl('URL liên kết (https / http / mailto)');
          if (!href) return;
          if (!contract().isAllowedHref(href)) {
            toast('URL liên kết không hợp lệ', 'warning');
            return;
          }
          return run(function (c) {
            c.extendMarkRange('link').setLink({ href: href, target: '_blank', rel: 'noopener' }).run();
          });
        }
        if (cmd === 'unlink') return run(function (c) { c.unsetLink().run(); });
        if (cmd === 'image') {
          var src = promptUrl('URL ảnh (https / http / /media/…)');
          if (!src) return;
          if (!contract().isAllowedImgSrc(src)) {
            toast('URL ảnh không hợp lệ (https/http hoặc /media/…)', 'warning');
            return;
          }
          return run(function (c) { c.setImage({ src: src }).run(); });
        }
        if (cmd === 'table') {
          return run(function (c) {
            c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
          });
        }
      });
    }

    modeBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setMode(btn.getAttribute('data-abody-mode'));
      });
    });

    htmlTa.addEventListener('input', function () {
      if (mode !== 'html') return;
      /* raw: no beautify — preview via sanitized pipeline only */
      clearTimeout(previewTimer);
      previewTimer = setTimeout(function () {
        renderPreview(sanitize(htmlTa.value || ''));
        syncHidden(sanitize(htmlTa.value || ''));
      }, 200);
    });

    bindToolbar();
    setModeBtnState();
    queuePreview();

    return {
      getBodyHtml: getBodyHtml,
      setBodyHtml: setBodyHtml,
      destroy: function () {
        clearTimeout(previewTimer);
        if (editor) editor.destroy();
      }
    };
  }

  global.IfluxArticleBodyEditor = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
