# Implementation Mapping Audit — Google Login (Priority 1)

**Date:** 2026-07-29  
**Type:** Evidence-only · không sửa code  
**Priority:** 1 — khóa mapping **audit ↔ implementation đang chạy trên Production**  
**Artifacts:** `.tmp/phase5-task3/impl-mapping/`

---

## 0. Verdict (locked)

| Question | Answer |
|----------|--------|
| Audit Chrome fail đang phân tích implementation nào? | **Production `auth-social.js` (googleProxy / offscreen `renderButton`)** |
| Source local `social-auth/google-provider.js` (`getProof` → `prompt`) có phải bundle Login Production không? | **Không** — file **không được load** bởi Production login boot; CDN **404**; disk thiếu file |
| Audit và source Owner vừa mở có cùng implementation không? | **Không** — **hai implementation khác nhau** (Production googleProxy vs Local WP2 Provider/UseCase) |

**Hệ quả:** Failure-point audit (`clickOffscreenGoogleActivator`) **đúng với Production đang serve**. Local `google-provider.js` là implementation **khác / chưa deploy lên login path**.

---

## 1. Bundle đang deploy (Production Login)

### 1.1 HTML entry

URL: `https://iflux.vn/dang-nhap`  
Artifact: `impl-mapping/dang-nhap.html`

```html
<button … id="btn-google" …>
…
<script type="module" src="/User_Web/iflux-web-ui/runtime/auth-login-boot.js?v=regAffLock20260728"></script>
```

### 1.2 Boot feature list (Production)

File CDN + disk: `/User_Web/iflux-web-ui/runtime/auth-login-boot.js?v=regAffLock20260728`  
**md5:** `5bf58830b2335bb3243ad93cfd928b96` (CDN fetch = disk)

```js
var FEATURE = [
  …
  ASSET + 'auth-social.js?v=googleProxy20260728',   // ← Google GIS path
  …
  ASSET + 'auth-login-init.js?v=btnRace20260728'
];
```

**Không có** trong Production boot:

- `social-auth/identity-proof.js`
- `social-auth/google-provider.js`
- `social-auth/provider-registry.js`
- `social-auth/social-login-usecase.js` (file có trên disk một phần nhưng **boot không load**)

### 1.3 Google implementation file (Production)

| Field | Value |
|-------|--------|
| Path (web) | `/User_Web/iflux-web-ui/auth-social.js?v=googleProxy20260728` |
| Path (disk) | `/var/www/iflux/production/User_Web/iflux-web-ui/auth-social.js` |
| HTTP | **200** · 13954 bytes |
| **md5** | `8b16bbe7cd56116eea883756f843ebc3` |
| mtime disk | 2026-07-28 17:30 |
| Contains | `ensureOffscreenGoogleActivator` · `renderButton` · `clickOffscreenGoogleActivator` · `startGoogleLoginFromUserGesture` · `loginGoogle` |

Symbols (line refs trên artifact `prod-auth-social.js` = disk):

| Symbol | Line (approx) |
|--------|----------------|
| `ensureOffscreenGoogleActivator` | 136 |
| `google.accounts.id.renderButton` | 155 |
| `clickOffscreenGoogleActivator` | 166 |
| `startGoogleLoginFromUserGesture` | 180 |
| `loginGoogle` | 215 |
| `bindSocialButtons` → `google: loginGoogle` | 337 |
| `initPage` → `ensureOffscreenGoogleActivator` | 374–379 |

---

## 2. Call chain — `#btn-google` → `clickOffscreenGoogleActivator`

```text
https://iflux.vn/dang-nhap
  │
  ├─ #btn-google  (dang-nhap.html)
  │
  └─ auth-login-boot.js?v=regAffLock20260728
        loadScriptsSequential(…)
          ├─ auth-social.js?v=googleProxy20260728
          │     IfluxAuthSocial.initPage
          │       → ensureOffscreenGoogleActivator
          │           → google.accounts.id.initialize
          │           → google.accounts.id.renderButton(#ifx-google-auth-proxy)
          │       → bindSocialButtons(#btn-google → loginGoogle / startGoogleLoginFromUserGesture)
          │
          └─ auth-login-init.js?v=btnRace20260728
                IfluxAuthSocial.initPage({ onSuccess, onError })
                enable #btn-google

User click #btn-google
  → bindSocialButtons listener (auth-social.js)
      → if googleActivatorReady:
            startGoogleLoginFromUserGesture(opts)
          else:
            loginGoogle(opts) → ensureOffscreen… → startGoogleLoginFromUserGesture
        → clickOffscreenGoogleActivator()     ← FAILURE POINT AUDIT
              proxy.querySelector('[role="button"]') || proxy.querySelector('div[tabindex]')
        → on false: reject → onError → socialAuthError (toast)
        → on credential: finishSocialLogin → IfluxAuth.loginWithSocial → POST /api/auth/social
```

**Evidence bind:** `prod-auth-social.js` L333–361 · `prod-auth-login-init.js` L153–156.

---

## 3. Local source Owner mở — implementation khác

| Asset | Local workspace | Production Login |
|-------|-----------------|------------------|
| `runtime/auth-login-boot.js` | Loads `social-auth/*` + `auth-social.js?v=wp2Ggl20260728` | Loads **only** `auth-social.js?v=googleProxy20260728` · **md5 khác** (`ca231f6e…` local vs `5bf58830…` prod) |
| `auth-social.js` | Thin residual → `IfluxSocialLoginUseCase.execute` · **md5** `6d93754b…` | googleProxy monolith · **md5** `8b16bbe7…` |
| `social-auth/google-provider.js` | `getProof()` → `google.accounts.id.prompt()` | **CDN 404** · **absent on disk** (dir chỉ có `social-login-usecase.js`) |
| `prompt()` path | Có trong local provider | **Không** trên Production login call chain |
| `renderButton` / `clickOffscreen*` | **Không** trong local provider | **Có** — đây là path audit đã đo |

Local git tip touching `auth-social.js`:

```text
9df7509a1274dc861174884198985de7ec152853 2026-07-28T20:38:21+07:00
feat(auth): rebuild Google social login as Provider/UseCase/Verifier
```

Production disk `auth-social.js` mtime **17:30** cùng ngày — **trước** (hoặc không phải) bản rebuild workspace; boot Production **không** trỏ WP2 chain.

> **Commit trên Production web root:** không có `.git` evidence trong mapping này. Identity của bundle = **path + query + md5 + disk mtime** (đủ để khóa file đang chạy).

---

## 4. CDN sanity (cùng file bất kể query WP2)

| Request | Status | Size | Note |
|---------|--------|------|------|
| `auth-social.js?v=googleProxy20260728` | 200 | 13954 | googleProxy content |
| `auth-social.js?v=wp2Ggl20260728` | 200 | 13954 | **cùng md5 / cùng content** — query không đổi file trên disk |
| `social-auth/google-provider.js?v=wp2Ggl20260728` | **404** | — | Không deploy |

---

## 5. Mapping → Chrome Fail Audit

| Audit claim | Mapped implementation |
|-------------|----------------------|
| `ensureOffscreenGoogleActivator` / `renderButton` | Production `auth-social.js` (md5 `8b16bbe7…`) |
| `clickOffscreenGoogleActivator` → `querySelector` null | **Cùng file** — Failure Point audit hợp lệ cho Production |
| Local `getProof` / `prompt` | **Ngoài** Production login surface — không dùng để phủ nhận/đối chứng Failure Point Production |

**Safari DOM snapshot (Priority 2)** chỉ có ý nghĩa khi chạy trên **cùng** Production googleProxy path (không phải local `google-provider.js`).

---

## 6. Disposition

| Item | Status |
|------|--------|
| Priority 1 mapping | **LOCKED** |
| Production Google Login impl | `auth-social.js` googleProxy (`clickOffscreen*`) |
| Local WP2 `google-provider.js` | Not on Production login boot |
| Two implementations | **Confirmed skew** local ≠ prod login |
| Next | Priority 2 Safari DOM trên Production `/dang-nhap` |

---

## Appendix — Production source dump (Owner cross-check)

| Artifact | md5 | Nội dung |
|----------|-----|----------|
| [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) | `8b16bbe7cd56116eea883756f843ebc3` | **Full** Production `auth-social.js` |
| [`artifacts-auth-social.production.google-functions.js`](artifacts-auth-social.production.google-functions.js) | (extract from same file) | `initGoogle` · `ensureOffscreenGoogleActivator` · `clickOffscreenGoogleActivator` · `startGoogleLoginFromUserGesture` · `loginGoogle` |

**Evidence pack (mọi failure point + Prod↔Workspace):** [`17-Google-Login-Implementation-Evidence-Pack.md`](17-Google-Login-Implementation-Evidence-Pack.md)  
**Execution path + failure point + first abnormal state:** [`18-Production-Google-Login-Execution-Path-Audit.md`](18-Production-Google-Login-Execution-Path-Audit.md)

*Evidence-first · 2026-07-29.*
