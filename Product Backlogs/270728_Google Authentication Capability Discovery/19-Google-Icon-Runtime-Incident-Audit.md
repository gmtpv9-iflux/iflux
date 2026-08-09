# 19 — Production Runtime Incident Audit: Google Login Icon Click

**Date:** 2026-07-28 (ICT)  
**Scope:** Audit only — **không sửa code**, không đổi OAuth/redirect, không thêm onclick.  
**Environment:** Production `https://iflux.vn` (WP7 **chưa** deploy).  
**Artifacts:** [`runtime-incident-artifacts/`](runtime-incident-artifacts/)  
**Method:** Fetch asset Production + `node --check` + Playwright/CDP trên `/dang-nhap` (runtime), đối chiếu source.

---

## Executive Summary

| Câu hỏi | Kết luận |
|---------|----------|
| Script fail đầu tiên? | **`iflux-user-data-sync.js`** — `SyntaxError: missing ) after argument list` (L49) |
| Fail có dừng init chain? | **Không.** `loadScript` resolve theo HTTP `load`; sequential vẫn nạp script sau. |
| `auth-social.js` có execute? | **Có.** `typeof IfluxAuthSocial === "object"`; GIS client + offscreen button load được. |
| Click handler `#btn-google` có attach? | **Có** (CDP `getEventListeners`) — handler `bindSocialButtons` L344 có `e.preventDefault()`. |
| Hypothesis “handler không attach”? | **Không đủ** so với bằng chứng Production hiện tại. |
| `/User_Web/auth/#` → 403? | ✅ **Tái hiện (headed race):** click trước bind + `<base href="/User_Web/auth/">` → `/User_Web/auth/#` → 403 |
| Owner class | **B** (sync SyntaxError) + **E** (race + path-base `<base>`) |

**Không kết luận bằng grep.** Không fix trong báo cáo này.

---

## Incident as reported (Owner)

| Quan sát | Chi tiết |
|----------|----------|
| OK | Mở `https://iflux.vn/User_Web/auth/login.html` (thực tế **301 → `/dang-nhap`**) |
| Bug | Click icon Google → `https://iflux.vn/User_Web/auth/#` → **403** |
| HTML | `<a class="ix-social-btn google" href="#" id="btn-google">` |
| Network | `auth-social.js?v=googleProxy20260728` 200 · GIS `client` 200 · `button?type=icon…` 200 |
| Console | `iflux-user-data-sync.js:49 Uncaught SyntaxError: missing ) after argument list` · resource 404 · `favicon.ico` 404 |

**Hypothesis Owner:** handler không attach → fallback `href="#"`.  
**Không giả định** lỗi Google OAuth.

---

## 1. Timeline runtime (Production boot)

Entry thực tế: **`/dang-nhap`**  
Boot module (Production fetch):

`auth-login-boot.js?v=googleProxy20260728` → `loadScriptsSequential(SHELL.concat(FEATURE))`

### Thứ tự FEATURE (source Production)

| # | Script | Vai trò |
|---|--------|---------|
| 1 | `iflux-customers-store.js` | shell data |
| 2 | `iflux-credentials-store.js?v=20260706` | credentials |
| 3 | `loyalty-affiliate-store.js?v=shareAffP5_20260727` | loyalty |
| 4 | **`auth-social.js?v=googleProxy20260728`** | `IfluxAuthSocial` + GIS proxy |
| 5 | **`iflux-user-data-sync.js`** | **PARSE FAIL** |
| 6 | `iflux-admin-ui.js` | admin UI helpers |
| 7 | `iflux-web-ui.js?v=phaseA20260721c` | web UI |
| 8 | **`auth-login-init.js?v=zombieKill20260724`** | gọi `IfluxAuthSocial.initPage` |

`legacy-bridge.js` `loadScript` (L63–66): `load` event → `resolve` — **không** kiểm tra parse/execute thành công.

```text
auth-social execute ✅
    ↓
iflux-user-data-sync PARSE ❌  → IfluxUserDataSync = undefined
    ↓ (sequential vẫn tiếp)
auth-login-init execute ✅ → initPage → bindSocialButtons ✅
```

**Production vẫn là bản `googleProxy20260728` — không phải rebuild WP1–6** (đúng vì chưa deploy WP7).

---

## 2. Browser evidence (agent — Production)

Probe: Playwright + CDP · URL `https://iflux.vn/dang-nhap`  
File: `runtime-incident-artifacts/prod-browser-probe.json`

| Check | Actual |
|-------|--------|
| `typeof IfluxAuthSocial` | `"object"` |
| `typeof IfluxAuthSocial.initPage` | `"function"` |
| `typeof IfluxAuthSocial.loginGoogle` | `"function"` |
| `typeof IfluxUserDataSync` | **`"undefined"`** |
| `typeof IfluxAuth` | `"object"` |
| `__IFLUX_SHELL_READY` | `"auth"` |
| `#btn-google` | exists · `href="#"` |
| **Event listeners `#btn-google`** | **1× `click`** · script line **344** · body có **`e.preventDefault()`** + `loginGoogle` / `startGoogleLoginFromUserGesture` |
| After click (headless) | Vẫn `https://iflux.vn/dang-nhap` (không nhảy `/User_Web/auth/#`) |
| pageerror | `missing ) after argument list` |
| After click GIS | iframe `accounts.google.com/gsi/button?type=icon…` + `#ifx-google-auth-proxy` |

**Kết luận runtime:** bootstrap **đã** bind Google. Hypothesis “không attach listener” **bị bác** trên `/dang-nhap` tại thời điểm probe.

Owner Network (GIS `client` initiator `auth-social.js:85`) cũng khớp: **path Google đã chạy** — không phải “click chết vì không có JS”.

---

## 3. Source audit (Production assets đã fetch)

### 3.1 `iflux-user-data-sync.js` — lỗi cú pháp

`node --check` trên asset Production:

```text
SyntaxError: missing ) after argument list
(at iflux-user-data-sync.js:49)
```

Đoạn L41–49 (extra `}`):

```41:49:docs/Product Backlog/270728_Google Authentication Capability Discovery/runtime-incident-artifacts/iflux-user-data-sync.js
      if (payload.payment && global.IfluxProfilePaymentStore && global.IfluxAuth && IfluxAuth.getUser()) {
        IfluxProfilePaymentStore.hydrateFromServer(IfluxAuth.getUser().id, payload.payment);
        if (global.IfluxProfilePaymentPage && IfluxProfilePaymentPage.refresh) {
          IfluxProfilePaymentPage.refresh();
        } else if (global.IfluxProfileMyPage && IfluxProfileMyPage.refresh) {
          IfluxProfileMyPage.refresh();
        }
        }
      }
```

Brace balance trong `hydrateFromServer`: open 12 / close **13** → parse fail → **không** gán `global.IfluxUserDataSync`.

### 3.2 `auth-social.js` (googleProxy) — export / bind

- Export: `global.IfluxAuthSocial = { loadConfig, loginGoogle, …, bindSocialButtons, initPage, … }`
- `initPage` → `ensureOffscreenGoogleActivator` (optional catch) → `bindSocialButtons`
- `bindSocialButtons` L345–346: `addEventListener('click', … e.preventDefault())`
- GIS: `loadScript('https://accounts.google.com/gsi/client')` (≈ L85 / L114) — khớp Network Owner

### 3.3 `auth-login-init.js`

Cuối file:

```146:150:docs/Product Backlog/270728_Google Authentication Capability Discovery/runtime-incident-artifacts/auth-login-init.js
  IfluxAuthSocial.initPage({
    onSuccess: socialAuthSuccess,
    onError: socialAuthError,
    referral_code: affiliateReferralCodeForIdentity()
  });
```

Chạy **sau** sync trong boot list → vẫn chạy được vì sync fail không reject `loadScript`.

### 3.4 Dependency load order

Đúng theo thiết kế boot: **auth-social trước sync trước auth-login-init**.  
Thứ tự **không** phải nguyên nhân mất `IfluxAuthSocial`.

---

## 4. `/User_Web/auth/#` → 403

| Check | Result |
|-------|--------|
| `GET https://iflux.vn/User_Web/auth/` | **403** |
| `GET https://iflux.vn/User_Web/auth/#` | **403** |
| `GET …/login.html` (follow redirect) | **301 → `/dang-nhap` 200** |

403 = nginx directory `/User_Web/auth/` (không phải lỗi token Google).

Agent click Google từ `/dang-nhap` **không** điều hướng tới `/User_Web/auth/#`.  
Do đó: **403 là endpoint thật**, nhưng **chuỗi nhân quả “click icon ⇒ URL đó” chưa tái hiện** trong probe.

Khả năng cần Owner xác nhận thêm (không khẳng định):

1. Click **trước** khi `initPage` xong (race) → `href="#"` / điều hướng lệch path.  
2. Quan sát URL/bar khác với document đã boot tại `/dang-nhap`.  
3. Bước trung gian ngoài click handler (extension, back/forward, mở tab).

---

## 5. Owner classification

| Option | Verdict |
|--------|---------|
| **A. Bootstrap loader regression** | ❌ Không — sequential hoàn tất (`__IFLUX_SHELL_READY === "auth"`) |
| **B. JS syntax/runtime error upstream** | ✅ **CONFIRMED** — `iflux-user-data-sync.js` SyntaxError · `IfluxUserDataSync` undefined |
| **C. auth-social bind regression** | ❌ Không hỗ trợ bởi CDP — listener L344 **có** |
| **D. Cache/version mismatch** | ⚠️ Một phần ngữ cảnh — Production = `googleProxy20260728` (cũ vs feature rebuild); **không** giải thích SyntaxError sync |
| **E. Khác** | ✅ **CONFIRMED (click → 403)** — race click trước bind + `<base href="/User_Web/auth/">` (`path-base.js`) → `href="#"` resolve thành `/User_Web/auth/#` → nginx 403 |

### Root cause (đã khóa cho phần Console)

> **Root cause (confirmed):** Production `iflux-user-data-sync.js` chứa **thừa một `}`** trong `hydrateFromServer` (khoảng L48) → SyntaxError → module không execute → `IfluxUserDataSync` undefined.

### Root cause (phần “click → 403”) — **ĐÃ KHÓA** (bổ sung headed)

> **Root cause (confirmed):** Click `#btn-google` **trước** khi `IfluxAuthSocial` / `bindSocialButtons` sẵn sàng → **không** có `preventDefault` → trình duyệt follow `<a href="#">` theo **`document.baseURI`** = `https://iflux.vn/User_Web/auth/` (do `path-base.js` inject `<base>` cho slug `/dang-nhap`) → navigation **`https://iflux.vn/User_Web/auth/#`** → nginx **403**.  
> Khi boot xong (listener L344 có), cùng click **không** 403 — GIS chạy.

---

## 6. Bổ sung điều tra — headed browser (không headless)

**Artifacts:** `runtime-incident-artifacts/headed-browser-probe.json` · `headed-race-href-resolve.json` · `prod-cache-headers.txt` · `headed-*.png`

### 6.1 Reproduce headed — sau hard reload, click khi đã boot

| Capture (trước click) | Actual |
|------------------------|--------|
| `location.href` | `https://iflux.vn/dang-nhap` |
| `document.location.href` | `https://iflux.vn/dang-nhap` |
| `typeof IfluxAuthSocial` | `"object"` |
| `typeof IfluxAuthSocial.loginGoogle` | `"function"` |
| `getEventListeners(#btn-google)` | **1× click** · line **344** · có `e.preventDefault()` |
| `typeof IfluxUserDataSync` | `"undefined"` (vẫn lỗi B) |
| Service Worker controller | **false** · registrations `[]` |

| Capture (click) | Actual |
|-----------------|--------|
| Target | `<i class="ti ti-brand-google-filled">` · `closestBtnGoogle: true` |
| document-capture `defaultPrevented` | `false` (lúc capture phase) |
| document-bubble `defaultPrevented` | **`true`** (sau listener bind) |
| DOM mutations trên `#btn-google` | **[]** — không bị replace |
| listeners sau click | vẫn **1× click** L344 |
| URL sau click | **vẫn** `https://iflux.vn/dang-nhap` |
| GIS | `#ifx-google-auth-proxy` + iframe `gsi/button?type=icon…` |

### 6.2 Reproduce Owner 403 — race click (headed)

Điều kiện: `waitUntil: domcontentloaded` → `#btn-google` xuất hiện → click **ngay** (boot module chưa xong).

| Capture (trước click) | Actual |
|------------------------|--------|
| `location.href` | `https://iflux.vn/dang-nhap` |
| `typeof IfluxAuthSocial` | **`"undefined"`** |
| `__IFLUX_SHELL_READY` | **`null`** |
| `document.baseURI` | **`https://iflux.vn/User_Web/auth/`** |
| `<base href>` | **`https://iflux.vn/User_Web/auth/`** (`data-ifx-path-base`) |
| `btnHrefAttr` | `"#"` |

| Sau click | Actual |
|-----------|--------|
| Navigation | `dang-nhap` → **`https://iflux.vn/User_Web/auth/#`** |
| Khớp Owner | ✅ **trùng URL Owner báo** |

**Cơ chế resolve:** `path-base.js` map `'/dang-nhap' → '/User_Web/auth/'` và inject `<base>`. Click `<a href="#">` **không** `preventDefault` → browser resolve `#` theo **baseURI** → `/User_Web/auth/#` (không phải `/dang-nhap#`).

### 6.3 Listener order / overwrite DOM

| Check | Result |
|-------|--------|
| Listener trước `bindSocialButtons` trên `#btn-google` (khi đã boot) | Chỉ **một** click handler (L344) — không thấy overwrite |
| Click target | Icon `<i>` bên trong `#btn-google` (đúng nút) |
| `#btn-google` replace sau bind | **Không** (MutationObserver `mutations: []`; outerHTML ổn định) |
| Listener lúc click (đã boot) | Còn tồn tại |

### 6.4 Production cache / versions

| Asset | Version query | CF | Notes |
|-------|---------------|-----|--------|
| `auth-login-boot.js` | `?v=googleProxy20260728` | MISS (probe) · `max-age=14400` | Production boot cũ |
| `auth-social.js` | `?v=googleProxy20260728` | **HIT** · 13954 bytes | |
| `auth-login-init.js` | `?v=zombieKill20260724` | **HIT** | |
| `legacy-bridge.js` | `?v=phaseCW420260721` | **HIT** | |
| `iflux-user-data-sync.js` | (no `?v=`) | **HIT** · 4779 bytes | SyntaxError asset |
| Service Worker | — | none active | Không phải SW cache |

Evidence headers: `runtime-incident-artifacts/prod-cache-headers.txt`.

---

## 7. Việc không làm (đúng yêu cầu)

- Không sửa `iflux-user-data-sync.js` / `path-base` / `href="#"` trong task này  
- Không chỉnh Google OAuth / redirect / inline onclick  
- Không deploy WP7  
- Không dùng grep thay runtime proof  

---

## 8. Owner — checklist (đã có agent headed evidence)

Agent đã capture đầy đủ §1–4 bằng **headed Chromium**. Owner có thể xác nhận nhanh:

```js
document.baseURI
document.querySelector('base') && document.querySelector('base').href
typeof IfluxAuthSocial
getEventListeners(document.getElementById('btn-google'))
```

- Click **sau** khi `typeof IfluxAuthSocial === 'object'` → kỳ vọng GIS, không 403.  
- Click **ngay** khi trang vừa hiện nút / `IfluxAuthSocial === 'undefined'` → kỳ vọng `/User_Web/auth/#` 403.

---

## 9. Sign-off audit

| Role | Status |
|------|--------|
| Agent | ✅ **B** (sync SyntaxError) + **E** (race + `<base>` → 403) **locked bằng headed runtime** |
| Owner | ☐ Cho phép phase fix (chỉ sau khi chốt) |

---

*Audit only — evidence bổ sung. Fix = phase riêng sau Owner chốt.*
