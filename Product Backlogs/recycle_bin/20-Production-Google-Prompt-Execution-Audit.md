# Production — Audit execution của `google.accounts.id.prompt()`

**Date:** 2026-07-29  
**Type:** Evidence / code extract hẹp · **không** gửi cả `auth-social.js`  
**Production:** `https://iflux.vn/User_Web/iflux-web-ui/auth-social.js?v=googleProxy20260728`  
**md5 (live):** `74be114283bdc68da31bc59e4c345cec`  
**Attribution artifact:** `.tmp/phase5-task3/exec-path/prompt-call-attribution.json`

---

## Yêu cầu khoanh vùng (giữ nguyên)

Có, nhưng **đừng bảo nó gửi cả file**. Hãy khoanh vùng rất hẹp.

Đến đây bạn đã có khá nhiều evidence rồi. Điều còn thiếu là **đoạn code quyết định chuyển sang `prompt()` và đoạn xử lý `PromptMomentNotification`**.

Tôi sẽ yêu cầu đúng những phần sau:

1. `loginGoogle()`
2. `startGoogleLoginFromUserGesture()`
3. Đoạn gọi `google.accounts.id.prompt()`
4. Callback của `prompt(notification)`
5. Đoạn xử lý:
   * `isNotDisplayed()`
   * `isSkippedMoment()`
   * `isDismissedMoment()` (nếu có)
6. Đoạn tạo/reject Promise tương ứng.
7. Nếu có wrapper hoặc helper quanh `prompt()` thì gửi luôn helper đó.

**Không cần gửi lại toàn bộ `auth-social.js`.**

---

Lý do là hiện tại failure point đã đổi:

**Trước:**

```text
renderButton
    ↓
querySelector == null
    ↓
return false
```

**Bây giờ:**

```text
prompt()
    ↓
notification.isSkippedMoment()
    ↓
reject(...)
```

Hai failure point khác nhau.

Điều tôi muốn kiểm tra là:

* Có đang **coi mọi `isSkippedMoment()` là lỗi** không?
* Có đang gọi `prompt()` **đúng thời điểm user gesture** không?
* Có đang gọi `prompt()` **sau khi đã initialize/renderButton nhiều lần** không?
* Có đang reject quá sớm không?

---

Có một điểm tôi thấy đáng nghi hơn cả.

Bạn nói log là:

```text
promptCalls: 3
```

Nếu đúng như vậy thì đây là dấu hiệu **rất bất thường**.

Một lần người dùng click Google mà:

```
promptCalls = 3
```

thì tôi sẽ audit ngay:

* Ai gọi prompt lần 1?
* Ai gọi prompt lần 2?
* Ai gọi prompt lần 3?

Có thể đang bị:

```
initPage()
    ↓
prompt()

click()
    ↓
prompt()

retry/fallback
    ↓
prompt()
```

hoặc bị bind event nhiều lần.

Đó là điều đáng kiểm tra trước cả việc sửa.

---

Vì vậy, thay vì bảo nó "gửi code đang sai", tôi sẽ yêu cầu:

> **Audit execution của `google.accounts.id.prompt()` trên Production.**
>
> Gửi:
>
> * Call chain đến `prompt()`.
> * Source code của `prompt()` wrapper.
> * Callback `PromptMomentNotification`.
> * Toàn bộ các vị trí có thể gọi `prompt()`.
> * Chứng minh vì sao một lần click sinh ra `promptCalls = 3`.

Nếu `promptCalls = 3` là thật, rất có thể bạn sẽ tìm ra vấn đề mới mà không cần đoán mò. Đây là một tín hiệu mạnh hơn nhiều so với việc chỉ nhìn vào thông báo lỗi.

---

## A. Inventory — mọi chỗ gọi `prompt()` trên Login surface

| Nguồn | `google.accounts.id.prompt(` |
|-------|------------------------------|
| Production `auth-social.js` (live) | **1** call site — dòng **222** trong `startGoogleLoginFromUserGesture` |
| `auth-login-init.js` | **0** |
| `initPage` / `ensureOffscreenGoogleActivator` | **0** (chỉ `initialize` + `renderButton`) |
| Helper/wrapper riêng quanh `prompt` (ngoài GIS SDK) | **Không** — gọi thẳng `google.accounts.id.prompt(...)` |

**Kết luận inventory:** Không có chuỗi `initPage → prompt` + `click → prompt` + `retry → prompt` trong source. Chỉ một nhánh fallback sau `clickOffscreenGoogleActivator` trả `'fedcm-iframe-only'` hoặc `false`.

---

## B. Call chain đến `prompt()` (Production hiện tại)

```text
auth-login-init.js
  → IfluxAuthSocial.initPage({ onSuccess, onError, referral_code })
      → loadConfig → ensureOffscreenGoogleActivator
          → google.accounts.id.initialize(...)
          → google.accounts.id.renderButton(#ifx-google-auth-proxy, ...)
          → googleActivatorReady = true
      → bindSocialButtons(document, opts)
          → #btn-google.addEventListener('click', ...)

User click #btn-google
  → (nếu googleActivatorReady) startGoogleLoginFromUserGesture(runOpts)
      → clickOffscreenGoogleActivator()
          → có overlay role=button  → btn.click() → return true  (Safari path; KHÔNG prompt)
          → chỉ iframe              → return 'fedcm-iframe-only' (Chrome path)
          → không gì                → return false
      → nếu activate === 'fedcm-iframe-only' || false
          → google.accounts.id.prompt(notification => ...)
```

`loginGoogle()` cũng ủy quyền sang `startGoogleLoginFromUserGesture` — nhưng khi activator đã ready, click handler **không** gọi `loginGoogle`, mà gọi thẳng `startGoogleLoginFromUserGesture`.

---

## C. Source hẹp (Production live)

### C1. `clickOffscreenGoogleActivator` — quyết định có vào `prompt` không

```js
function clickOffscreenGoogleActivator() {
  var proxy = document.getElementById('ifx-google-auth-proxy');
  if (!proxy) return false;
  proxy.style.pointerEvents = 'auto';
  /* Safari / non-FedCM: GIS chèn overlay role=button trong light DOM */
  var btn = proxy.querySelector('[role="button"]') || proxy.querySelector('div[tabindex]');
  if (btn) {
    btn.click();
    proxy.style.pointerEvents = 'none';
    return true;
  }
  /* Chrome FedCM: thường chỉ còn iframe — caller dùng prompt trong user gesture */
  if (proxy.querySelector('iframe')) {
    proxy.style.pointerEvents = 'none';
    return 'fedcm-iframe-only';
  }
  proxy.style.pointerEvents = 'none';
  return false;
}
```

### C2. `startGoogleLoginFromUserGesture` — gọi `prompt` + callback + reject Promise

```js
function startGoogleLoginFromUserGesture(opts) {
  return new Promise(function (resolve, reject) {
    if (!googleActivatorReady) {
      reject(new Error('Google Sign-In chưa sẵn sàng — tải lại trang.'));
      return;
    }
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      global.__ifxOnGoogleCredential = null;
      reject(new Error('Đăng nhập Google bị hủy.'));
    }, 120000);
    global.__ifxOnGoogleCredential = function (response) {
      if (settled) return;
      settled = true;
      global.__ifxOnGoogleCredential = null;
      clearTimeout(timer);
      if (!response || !response.credential) {
        reject(new Error('Đăng nhập Google bị hủy.'));
        return;
      }
      finishSocialLogin('google', { id_token: response.credential }, opts || {})
        .then(resolve)
        .catch(reject);
    };
    var activate = clickOffscreenGoogleActivator();
    if (activate === true) return;
    /* Chrome FedCM (không có overlay): GIS prompt trong cùng user gesture */
    if (
      (activate === 'fedcm-iframe-only' || activate === false) &&
      global.google &&
      google.accounts &&
      google.accounts.id &&
      typeof google.accounts.id.prompt === 'function'
    ) {
      google.accounts.id.prompt(function (notification) {
        if (!notification) return;
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          if (settled) return;
          settled = true;
          global.__ifxOnGoogleCredential = null;
          clearTimeout(timer);
          reject(
            new Error(
              'Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba.'
            )
          );
        }
      });
      return;
    }
    settled = true;
    global.__ifxOnGoogleCredential = null;
    clearTimeout(timer);
    reject(
      new Error(
        'Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba.'
      )
    );
  });
}
```

### C3. Callback `PromptMomentNotification` — trả lời checklist

| API | Có trong code? | Hành vi |
|-----|----------------|---------|
| `isNotDisplayed()` | **Có** | OR với skip → **reject** (toast lỗi) |
| `isSkippedMoment()` | **Có** | OR với not-displayed → **reject** (toast lỗi) |
| `isDismissedMoment()` | **Không** | Không đọc · không xử lý riêng |
| `getSkippedReason()` / `getNotDisplayedReason()` | **Không** | Không phân nhánh theo reason |

**Trả lời thẳng:** Có — đang **coi mọi `isSkippedMoment()` (và mọi `isNotDisplayed()`) là lỗi cứng**, không phân biệt reason.

### C4. `loginGoogle`

```js
function loginGoogle(opts) {
  if (googleActivatorReady) {
    return startGoogleLoginFromUserGesture(opts);
  }
  return loadConfig().then(function (c) {
    var cfg = c.google || {};
    if (!cfg.enabled || !cfg.clientId) return notConfigured('google');
    return ensureOffscreenGoogleActivator(cfg).then(function (ready) {
      if (!ready) {
        return Promise.reject(new Error('Google Sign-In chưa sẵn sàng — tải lại trang.'));
      }
      return startGoogleLoginFromUserGesture(opts);
    });
  });
}
```

### C5. Bind click (không phải wrapper `prompt`, nhưng là caller)

```js
// trong bindSocialButtons — khi googleActivatorReady:
startGoogleLoginFromUserGesture(runOpts)
  .then(...)
  .catch(...);
```

`auth-login-init.js` gọi `initPage` **một lần** (không gọi `prompt`).

### C6. Wrapper/helper quanh `prompt()`?

**Không có** helper riêng. Chỉ:

* `clickOffscreenGoogleActivator` (quyết định có fallback),
* rồi gọi thẳng `google.accounts.id.prompt` trong Promise của `startGoogleLoginFromUserGesture`.

---

## D. Checklist kiểm tra (evidence)

### D1. Có đang coi mọi `isSkippedMoment()` là lỗi?

**Có.** Điều kiện:

```js
if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
  reject(new Error('Không mở được cửa sổ Google. ...'));
}
```

Không đọc `getSkippedReason()`. Đo attribution 2026-07-29:

* `isSkippedMoment: true`
* `getSkippedReason: "unknown_reason"`
* `isNotDisplayed: false`
* `isDismissedMoment: false`

→ reject → toast đúng message trên.

### D2. Có gọi `prompt()` đúng thời điểm user gesture?

**Theo call chain:** `prompt()` chạy **đồng bộ** trong click handler → `startGoogleLoginFromUserGesture` → sau `clickOffscreen...` (sync) → `prompt()` — vẫn trong cùng turn của user click. Không `await`/`setTimeout` trước `prompt`.

**Lưu ý:** Trước đó page đã `initialize` + `renderButton` lúc `initPage` (không phải lúc click). Fallback `prompt` là lần gọi GIS prompt UI sau gesture.

### D3. Có gọi `prompt()` sau initialize/renderButton nhiều lần?

* `prompt` trong source: **1** site.
* Attribution 1 click: **1** lần vào `google.accounts.id.prompt`.
* `initPage` **không** gọi `prompt`.
* Không thấy retry loop gọi lại `prompt` trong callback.

`initialize`/`renderButton` chạy lúc boot (offscreen proxy). `prompt` chỉ khi Chrome path không click được overlay.

### D4. Có reject quá sớm không?

**Có thể.** Skip moment với `unknown_reason` bị reject ngay → toast, dù FedCM/GIS có thể đang abort nội bộ (console: empty accounts / FedCM NetworkError). Code không chờ credential, không phân biệt “user đóng” vs “no session” vs “transient”.

`isDismissedMoment` không được xử lý — nếu GIS báo dismiss thay vì skip, Promise có thể treo tới timeout 120s (không xảy ra trên đo vừa rồi vì đã skip → reject).

---

## E. `promptCalls: 3` — chứng minh / bác bỏ

### E1. Log cũ (post-fix verify)

File: `.tmp/phase5-task3/chrome-vs-safari/post-fix-verify.json`

```json
"probe": {
  "promptCalls": 3,
  "activateResults": [],
  "lastNotif": { "isNotDisplayed": false, "isSkippedMoment": true }
}
```

`activateResults: []` — probe đó **không** ghi được kết quả `clickOffscreen` → đo đếm không sạch.

### E2. Attribution lại (cùng Production, 1 click `#btn-google`)

| Metric | Kết quả |
|--------|---------|
| Call sites trong source | **1** |
| `prompt()` invocations / 1 click | **1** |
| Stack | `HTMLButtonElement` (bindSocialButtons L388) → `startGoogleLoginFromUserGesture` (L187) → `prompt` (L222) |
| initPage gọi prompt? | **Không** |
| Lần 2 / lần 3 trong app source? | **Không tồn tại** |

Stack (rút gọn):

```text
google.accounts.id.prompt  (hook)
  ← auth-social.js:222
  ← startGoogleLoginFromUserGesture (auth-social.js:187)
  ← HTMLButtonElement.<anonymous> (auth-social.js:388)  // bindSocialButtons click
```

### E3. Kết luận về `promptCalls = 3`

* **Không chứng minh được** “một click app → 3 lần `prompt` từ product code”.
* Inventory + attribution hiện tại: **1 click → 1 `prompt` → `isSkippedMoment` → reject**.
* Giá trị `promptCalls: 3` ở post-fix verify nên coi là **nhiễu đo / probe không sạch** (wrapper/console AbortError nội bộ GIS ≠ 3 call site app), **không** dùng làm root cause cho multi-bind / init+click+retry cho đến khi có stack 3 lần tách biệt.

Giả thuyết `initPage → prompt` / bind 3 lần: **không khớp source + không khớp attribution mới**.

---

## F. Failure point hiện tại (tóm tắt)

```text
click #btn-google
  → clickOffscreen → 'fedcm-iframe-only' (Chrome, không overlay)
  → google.accounts.id.prompt()     // 1 lần / click (đo mới)
  → notification.isSkippedMoment() === true  (reason: unknown_reason)
  → reject(...) → toast
```

Khác failure point cũ (`querySelector == null → return false`) — path đã đổi vì patch fallback `prompt` trên Production.

---

## G. Artifact tham chiếu

* Live extract: `.tmp/phase5-task3/exec-path/auth-social.live.js`
* Snippets: `snip-startGoogleLoginFromUserGesture.js`, `snip-loginGoogle.js`, `snip-clickOffscreenGoogleActivator.js`, `snip-bindSocialButtons.js`
* Attribution: `.tmp/phase5-task3/exec-path/prompt-call-attribution.json`
* Log cũ `promptCalls:3`: `.tmp/phase5-task3/chrome-vs-safari/post-fix-verify.json`
