# Production Google Login — Execution Path Audit

**Date:** 2026-07-29  
**Scope:** Call chain từ `#btn-google` → success **hoặc** error trên **Production only**  
**Type:** Audit + evidence · không sửa code · không giả thuyết  
**Page:** `https://iflux.vn/dang-nhap`

### Production files on path (md5)

| File | Query / load | md5 |
|------|----------------|-----|
| `auth-login-boot.js` | `?v=regAffLock20260728` | `5bf58830b2335bb3243ad93cfd928b96` |
| `auth-social.js` | `?v=googleProxy20260728` | `62dee0747706ef786080104c4a6a2872` |
| `auth-login-init.js` | `?v=btnRace20260728` | `90d48f49119c32ec8bdc2c3b310702c3` |
| `auth.js` | `?v=regSoT_20260728` (SHELL; success handoff only) | (surface pack) |

> md5 `auth-social.js` = `62dee074…` gồm probe suffix `[auth-social.js]` trong toast (instrument Owner). Logic call chain không đổi so với `8b16bbe7…`.

**Artifacts:**  
- Source dump: [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) (baseline) · live fetch `.tmp/phase5-task3/exec-path/auth-social.js`  
- Selector DOM proof: `.tmp/phase5-task3/chrome-selector-proof/selector-null-proof.json`  
- Evidence pack: [`17-Google-Login-Implementation-Evidence-Pack.md`](17-Google-Login-Implementation-Evidence-Pack.md)  
- Mapping: [`16-Google-Login-Implementation-Mapping-Audit.md`](16-Google-Login-Implementation-Mapping-Audit.md)

**Workspace `social-auth/google-provider.js`:** không nằm trên Production login boot → **không dùng** trong audit này.

---

## 1. Boot (trước click) — nodes trên path

```text
dang-nhap.html
  │  #btn-google
  │  script module auth-login-boot.js?v=regAffLock20260728
  ▼
auth-login-boot.js
  │  FEATURE includes auth-social.js?v=googleProxy20260728
  │               auth-login-init.js?v=btnRace20260728
  ▼
auth-login-init.js
  │  IfluxAuthSocial.initPage({ onSuccess, onError: socialAuthError })
  │  L153–L156
  ▼
auth-social.js · initPage                    L374–393
  │  ensureOffscreenGoogleActivator(c.google) L378–379
  ▼
auth-social.js · ensureOffscreenGoogleActivator  L136–164
  │  initGoogle(cfg)                         L138 → L111–133
  │  google.accounts.id.initialize({… use_fedcm_for_prompt: true …})  L118–129
  │  google.accounts.id.renderButton(proxy, { type:'icon', theme:'outline', size:'medium', shape:'circle' })  L155–159
  │  googleActivatorReady = true             L161
  ▼
auth-social.js · bindSocialButtons           L333–372
     #btn-google click listener              L345–
```

---

## 2. Call chain — User click `#btn-google`

### 2.A Error path (Chrome Desktop — measured)

```text
User click #btn-google
    │
    ▼
[1] bindSocialButtons click listener
    Function: anonymous (addEventListener)
    File: auth-social.js?v=googleProxy20260728
    Line: L345–361
    │  if (googleActivatorReady) → startGoogleLoginFromUserGesture
    │  else → loginGoogle → … → startGoogleLoginFromUserGesture
    ▼
[2] startGoogleLoginFromUserGesture(opts)
    Function: startGoogleLoginFromUserGesture
    File: auth-social.js
    Line: L180–213
    │  set __ifxOnGoogleCredential + 120s timer   L186–204
    ▼
[3] clickOffscreenGoogleActivator()
    Function: clickOffscreenGoogleActivator
    File: auth-social.js
    Line: L166–178
    │
    │  L168  proxy = #ifx-google-auth-proxy
    │  L170  btn = proxy.querySelector('[role="button"]')
    │           || proxy.querySelector('div[tabindex]')
    │
    │  ★ FIRST ABNORMAL STATE (observed):
    │       btn == null
    │       Evidence: selector-null-proof.json
    │         role_button_exists_light_dom.actual = false
    │         div_tabindex_exists_light_dom.actual = false
    │         combined_query_result.actual = "NULL"
    │         iframe_exists.actual = true
    │         iframe contentDocument not accessible (cross-origin)
    │
    │  L170–173  if (!btn) → return false
    │
    ▼
[4] ★ FAILURE POINT (control-flow stop in Google activator)
    Function: clickOffscreenGoogleActivator → returns false
    File: auth-social.js
    Line: L172 (return false)
    │
    ▼
[5] startGoogleLoginFromUserGesture reject
    Function: startGoogleLoginFromUserGesture
    File: auth-social.js
    Line: L205–210
    │  reject(Error('Không mở được cửa sổ Google… [auth-social.js]'))
    │  clear __ifxOnGoogleCredential
    ▼
[6] bindSocialButtons .catch → opts.onError
    File: auth-social.js
    Line: L358–360 (or L367–369)
    ▼
[7] socialAuthError(provider, err)
    Function: socialAuthError
    File: auth-login-init.js?v=btnRace20260728
    Line: L125–130
    │  showLoginError(err.message)
    │  ixToast(err.message, 'danger')
    ▼
UI: toast / #login-error
    (không credential callback · không finishSocialLogin · không POST /api/auth/social)
```

### 2.B Success path (code path — Safari Owner PASS; not re-probed in this doc)

```text
User click #btn-google
    │
    ▼
[1] bindSocialButtons → startGoogleLoginFromUserGesture / loginGoogle
    auth-social.js  L345+ / L215–229 / L180–213
    ▼
[2] clickOffscreenGoogleActivator()
    auth-social.js  L166–178
    │  btn != null → btn.click() → return true     L174–177
    ▼
[3] GIS credential → __ifxOnGoogleCredential(response)
    auth-social.js  L192–204
    ▼
[4] finishSocialLogin('google', { id_token })
    Function: finishSocialLogin
    File: auth-social.js
    Line: L106–109
    ▼
[5] IfluxAuth.loginWithSocial(...)
    File: auth.js?v=regSoT_20260728
    ▼
[6] POST /api/auth/social → session
    ▼
[7] opts.onSuccess → socialAuthSuccess
    auth-login-init.js  L120–123
```

---

## 3. Diagram — Failure Point vs First Abnormal State

```text
                    (boot, before click)
ensureOffscreenGoogleActivator()
    │
    ▼
renderButton(#ifx-google-auth-proxy)     ← completes; iframe present (evidence)
    │
    ▼
Light DOM under proxy:
  DIV.S9gUrf-YoZ4jf
    DIV (empty)
    IFRAME accounts.google.com/gsi/button…   ← present
  [role=button]                              ← absent (evidence)
  div[tabindex]                              ← absent (evidence)
    │
    │  ※ Earliest measured mismatch vs what L170 will require
    │    (recorded before click in selector-null-proof)
    │
════╪════════════════════════════════════════════════
    │  USER CLICK
    ▼
startGoogleLoginFromUserGesture()
    │
    ▼
clickOffscreenGoogleActivator()
    │
    ▼
btn = querySelector(...)                 ★ FIRST ABNORMAL STATE
    │                                      btn == null
    ▼
return false                             ★ FAILURE POINT
    │
    ▼
reject → socialAuthError → toast
```

| Marker | Meaning | Location | Evidence |
|--------|---------|----------|----------|
| **Failure point** | Function returns `false` / reject branch taken | `clickOffscreenGoogleActivator` L172 · reject L205–210 | Production source + Owner toast (+ `[auth-social.js]` probe) |
| **First abnormal state** | `btn == null` after L170 selectors | same function L170 | `selector-null-proof.json`: combined query **NULL**; light DOM inventory không có A/B; iframe có mặt |

**Phân biệt (evidence only):**

- Failure point = điểm **dừng control flow** (`return false` → reject).  
- First abnormal state = **giá trị `btn == null`** — điều kiện trực tiếp khiến L172 chạy.  
- Trạng thái DOM (iframe có · A/B không có) đã đo **trước** click; L170 chỉ **đọc** trạng thái đó.

---

## 4. Node table (error path)

| # | Function / node | File | Line | Role |
|---|-----------------|------|------|------|
| 0 | `#btn-google` click | `dang-nhap.html` | — | Event |
| 1 | `bindSocialButtons` listener | `auth-social.js` | L345–361 | Dispatch |
| 2 | `startGoogleLoginFromUserGesture` | `auth-social.js` | L180–213 | Orchestrate |
| 3 | `clickOffscreenGoogleActivator` | `auth-social.js` | L166–178 | Activator |
| 3a | `btn == null` | `auth-social.js` | L170 | **First abnormal state** |
| 3b | `return false` | `auth-social.js` | L172 | **Failure point** |
| 4 | `reject(Error(…))` | `auth-social.js` | L205–210 | Error object |
| 5 | `socialAuthError` | `auth-login-init.js` | L125–130 | UI surface |

Nodes **not reached** on measured Chrome error path: `finishSocialLogin` L106 · `IfluxAuth.loginWithSocial` · `/api/auth/social`.

---

## 5. Evidence anchors (no interpretation)

| Claim | Anchor |
|-------|--------|
| Production Google impl = `auth-social.js` googleProxy | [`16`](16-Google-Login-Implementation-Mapping-Audit.md) · boot FEATURE |
| Toast string created in `auth-social.js` | L210 · Owner saw `[auth-social.js]` suffix |
| L170 selectors | `'[role="button"]'` \|\| `'div[tabindex]'` |
| `btn == null` / query NULL | `.tmp/phase5-task3/chrome-selector-proof/selector-null-proof.json` |
| iframe present after `renderButton` | same artifact · `iframe_exists: true` · full `proxy.innerHTML` |
| iframe not readable from parent | same · cross-origin Location blocked |
| `__ifxOnGoogleCredential` not invoked on error path | chrome-lifecycle probe · `credentialCallbackInvokes: []` |

---

*Production execution path only · 2026-07-29.*
