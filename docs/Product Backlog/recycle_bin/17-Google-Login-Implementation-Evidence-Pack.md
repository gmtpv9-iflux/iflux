# Implementation Evidence Pack — Google Login (Production ↔ Workspace)

**Date:** 2026-07-29  
**Type:** Evidence only · không phân tích · không kết luận  
**Related audits:** [`15`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md) · [`16`](16-Google-Login-Implementation-Mapping-Audit.md) · [`13`](13-Phase-05-Step4-Verification-Audit.md) §4.7.2

---

## 0. Artifact index (md5)

| Link | Role | md5 |
|------|------|-----|
| [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) | Production Google GIS (googleProxy) | `8b16bbe7cd56116eea883756f843ebc3` |
| [`artifacts-auth-social.workspace.js`](artifacts-auth-social.workspace.js) | Workspace thin auth-social | `6d93754b2055ec38386d59594fa0a906` |
| [`artifacts-google-provider.workspace.js`](artifacts-google-provider.workspace.js) | Workspace Google Provider (`prompt`) | `87640b8a68d1abf38de9f915eb5d087f` |
| [`artifacts-social-login-usecase.workspace.js`](artifacts-social-login-usecase.workspace.js) | Workspace UseCase | `25b8369e163ea8e9d27806de9d27cf35` |
| [`artifacts-provider-registry.workspace.js`](artifacts-provider-registry.workspace.js) | Workspace Registry | `c5a7e7127b5e28347901c812c95d77ff` |
| [`artifacts-identity-proof.workspace.js`](artifacts-identity-proof.workspace.js) | Workspace IdentityProof | `868cd171778499ea2f57866c74e6f87f` |
| [`artifacts-auth-login-boot.production.regAffLock20260728.js`](artifacts-auth-login-boot.production.regAffLock20260728.js) | Production login boot | `5bf58830b2335bb3243ad93cfd928b96` |
| [`artifacts-auth-login-boot.workspace.js`](artifacts-auth-login-boot.workspace.js) | Workspace login boot | `ca231f6e0f12c104e7bdc6d2b25236e1` |
| [`artifacts-auth-login-init.production.btnRace20260728.js`](artifacts-auth-login-init.production.btnRace20260728.js) | Production login init | `90d48f49119c32ec8bdc2c3b310702c3` |
| [`artifacts-auth-login-init.workspace.js`](artifacts-auth-login-init.workspace.js) | Workspace login init | `fd35300691fe4c3982d74a1eb216e401` |
| [`artifacts-auth-social.production.google-functions.js`](artifacts-auth-social.production.google-functions.js) | Extract 5 Google fns (from same Production file) | (slice of `8b16bbe7…`) |

**Same file? Production `auth-social` vs Workspace `auth-social`:** **NO** (`8b16bbe7…` ≠ `6d93754b…`)  
**Same file? Production boot vs Workspace boot:** **NO** (`5bf58830…` ≠ `ca231f6e…`)  
**Same file? Production init vs Workspace init:** **NO** (`90d48f49…` ≠ `fd353006…`)

---

## 1. Global mapping lock

### Production (đang chạy trên `https://iflux.vn/dang-nhap`)

| Field | Value |
|-------|--------|
| Page | `https://iflux.vn/dang-nhap` · `#btn-google` (HTML L77) |
| Boot URL | `/User_Web/iflux-web-ui/runtime/auth-login-boot.js?v=regAffLock20260728` |
| Boot disk/CDN file | [`artifacts-auth-login-boot.production.regAffLock20260728.js`](artifacts-auth-login-boot.production.regAffLock20260728.js) · md5 `5bf58830…` |
| Google impl URL | `/User_Web/iflux-web-ui/auth-social.js?v=googleProxy20260728` |
| Google impl disk | `/var/www/iflux/production/User_Web/iflux-web-ui/auth-social.js` |
| Google impl artifact | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) · md5 `8b16bbe7…` |
| Init URL | `/User_Web/iflux-web-ui/auth-login-init.js?v=btnRace20260728` |
| Init artifact | [`artifacts-auth-login-init.production.btnRace20260728.js`](artifacts-auth-login-init.production.btnRace20260728.js) · md5 `90d48f49…` |
| Loads `social-auth/google-provider.js`? | **No** (not in Production FEATURE list; CDN 404) |

**Boot sequence (Production)** — file [`artifacts-auth-login-boot.production.regAffLock20260728.js`](artifacts-auth-login-boot.production.regAffLock20260728.js) L9–L24:

```text
SHELL: iflux-platform-boot → iflux-api-bundle → auth.js?v=regSoT_20260728
FEATURE: …
  → auth-social.js?v=googleProxy20260728
  → …
  → auth-login-init.js?v=btnRace20260728
```

### Workspace (local tree — chưa map = Production login)

| Field | Value |
|-------|--------|
| Boot | [`artifacts-auth-login-boot.workspace.js`](artifacts-auth-login-boot.workspace.js) · md5 `ca231f6e…` |
| FEATURE Google chain | `social-auth/identity-proof.js?v=wp2Ggl20260728` → `google-provider.js?v=wp2Ggl20260728` → `provider-registry.js?v=wp2Ggl20260728` → `social-login-usecase.js?v=wp4Ggl20260728` → `auth-social.js?v=wp2Ggl20260728` → `auth-login-init.js?v=wp4Ggl20260728` |
| Google Provider | [`artifacts-google-provider.workspace.js`](artifacts-google-provider.workspace.js) · md5 `87640b8a…` |
| auth-social | [`artifacts-auth-social.workspace.js`](artifacts-auth-social.workspace.js) · md5 `6d93754b…` |

**Production Google login path == Workspace Google login path?** **NO**

---

## 2. Evidence by audit item

### E1 — Failure point: `clickOffscreenGoogleActivator() → false`

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L166–L178** |
| **Also in extract** | [`artifacts-auth-social.production.google-functions.js`](artifacts-auth-social.production.google-functions.js) (cùng body) |
| Selector in source | `proxy.querySelector('[role="button"]') \|\| proxy.querySelector('div[tabindex]')` — L169 |
| **Call chain** | `#btn-google` click → `bindSocialButtons` L345–361 → `startGoogleLoginFromUserGesture` L180–213 → **`clickOffscreenGoogleActivator` L166–178** → on false reject L205–210 |
| **Boot** | Production boot FEATURE loads `auth-social.js?v=googleProxy20260728` |
| **Path + md5 + query** | `/User_Web/iflux-web-ui/auth-social.js?v=googleProxy20260728` · `8b16bbe7…` |
| **Workspace counterpart** | **Không có** function cùng tên. Workspace Google path: `runGoogle` → `IfluxSocialLoginUseCase.execute` → `IfluxGoogleProvider.getProof` → `prompt` — xem E8 |
| **Same as workspace?** | **NO** |

---

### E2 — `ensureOffscreenGoogleActivator` / `renderButton` options

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L136–L164** |
| `renderButton` options (source) | L154–159: `{ type: 'icon', theme: 'outline', size: 'medium', shape: 'circle' }` |
| Proxy DOM setup | L140–152 (`#ifx-google-auth-proxy`, offscreen styles) |
| **Call chain** | `initPage` L374–379 → `ensureOffscreenGoogleActivator` · and/or `loginGoogle` L221–226 → `ensureOffscreenGoogleActivator` |
| **Boot** | same Production `auth-social.js?v=googleProxy20260728` |
| **Path + md5 + query** | same · `8b16bbe7…` · `?v=googleProxy20260728` |
| **Workspace counterpart** | **Không có** `ensureOffscreenGoogleActivator` / `renderButton` trong workspace Google Provider |
| **Same as workspace?** | **NO** |

---

### E3 — `initGoogle` / `initialize` options (`use_fedcm_for_prompt`)

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L111–L133** |
| `initialize` options (source) | L118–129: `client_id`, `callback`, `auto_select: false`, `cancel_on_tap_outside: true`, **`use_fedcm_for_prompt: true`**, `itp_support: true` |
| **Call chain** | `ensureOffscreenGoogleActivator` L138 → `initGoogle` |
| **Boot** | Production `auth-social.js?v=googleProxy20260728` |
| **Path + md5 + query** | `8b16bbe7…` · `?v=googleProxy20260728` |
| **Workspace counterpart** | [`artifacts-google-provider.workspace.js`](artifacts-google-provider.workspace.js) **`ensureGis` L60–L78** — `initialize` L66–75: `client_id`, `callback`, `auto_select: false`, `cancel_on_tap_outside: true` — **no `use_fedcm_for_prompt` / `itp_support` in source** |
| **Same as workspace?** | **NO** |

---

### E4 — `startGoogleLoginFromUserGesture` (toast false-path + credential callback)

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L180–L213** |
| False-path reject string | L209 — exact toast source |
| Credential handler | L192–204 `__ifxOnGoogleCredential` → `finishSocialLogin` |
| **Call chain** | `bindSocialButtons` L353–354 **or** `loginGoogle` L216/L226 → **`startGoogleLoginFromUserGesture`** |
| **Boot** | Production `auth-social.js?v=googleProxy20260728` |
| **Path + md5 + query** | `8b16bbe7…` · `?v=googleProxy20260728` |
| **Workspace counterpart** | **Không có** function cùng tên |
| **Same as workspace?** | **NO** |

---

### E5 — `loginGoogle`

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L215–L229** |
| **Call chain** | `bindSocialButtons` map `google: loginGoogle` L337 · click L347/`run` L363 |
| **Boot** | Production `auth-social.js?v=googleProxy20260728` |
| **Path + md5 + query** | `8b16bbe7…` · `?v=googleProxy20260728` |
| **Workspace counterpart** | [`artifacts-auth-social.workspace.js`](artifacts-auth-social.workspace.js) **`runGoogle` L99–L105** (không tên `loginGoogle`) |
| **Same as workspace?** | **NO** |

---

### E6 — `bindSocialButtons` + page click wiring

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L333–L372** |
| Google branch | L337 `google: loginGoogle` · L353–361 shortcut `startGoogleLoginFromUserGesture` when `googleActivatorReady` |
| **Call chain** | `initPage` L386/L389 → `bindSocialButtons` → `#btn-google` click |
| **Page event** | `#btn-google` on `https://iflux.vn/dang-nhap` |
| **Init wiring** | [`artifacts-auth-login-init.production.btnRace20260728.js`](artifacts-auth-login-init.production.btnRace20260728.js) **L153–L156** `IfluxAuthSocial.initPage({ onSuccess, onError, referral_code })` |
| **Error display** | same init file **`socialAuthError` L125–L130** |
| **Boot** | boot → auth-social → auth-login-init |
| **Workspace counterpart** | [`artifacts-auth-social.workspace.js`](artifacts-auth-social.workspace.js) **`bindSocialButtons` L205–L233** · map `google: runGoogle` L209 · **no** `googleActivatorReady` shortcut |
| **Same as workspace?** | **NO** |

---

### E7 — `initPage` (boot-time activator)

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L374–L393** |
| Preload activator | L378–379 `ensureOffscreenGoogleActivator(c.google)` |
| **Call chain** | `auth-login-init` → `IfluxAuthSocial.initPage` |
| **Workspace counterpart** | [`artifacts-auth-social.workspace.js`](artifacts-auth-social.workspace.js) **`initPage` L235–L249** — no `ensureOffscreenGoogleActivator` |
| **Same as workspace?** | **NO** |

---

### E8 — Workspace-only Google path (`getProof` / `prompt`) — mapping contrast

| Field | Evidence |
|-------|----------|
| **Workspace `getProof` (full)** | [`artifacts-google-provider.workspace.js`](artifacts-google-provider.workspace.js) **L83–L120** |
| **Workspace `ensureGis` (full)** | same file **L60–L78** |
| **Workspace UseCase `execute` (full)** | [`artifacts-social-login-usecase.workspace.js`](artifacts-social-login-usecase.workspace.js) **L81–L97** |
| **Workspace `runGoogle` (full)** | [`artifacts-auth-social.workspace.js`](artifacts-auth-social.workspace.js) **L99–L105** |
| **Call chain (workspace)** | `#btn-google` → `bindSocialButtons` → `runGoogle` → `IfluxSocialLoginUseCase.execute('google')` → `adapter.getProof()` → `google.accounts.id.prompt(...)` |
| **Boot (workspace)** | [`artifacts-auth-login-boot.workspace.js`](artifacts-auth-login-boot.workspace.js) L19–L27 |
| **On Production login?** | **Not loaded** (boot FEATURE thiếu; `google-provider.js` CDN 404) |
| **Same as Production googleProxy?** | **NO** |

---

### E9 — `finishSocialLogin` / backend handoff (post-credential)

| Field | Evidence |
|-------|----------|
| **Production function (full)** | [`artifacts-auth-social.production.googleProxy20260728.js`](artifacts-auth-social.production.googleProxy20260728.js) **L106–L109** |
| **Call chain** | credential callback in `startGoogleLoginFromUserGesture` L201 → `finishSocialLogin` → `IfluxAuth.loginWithSocial` |
| **Workspace counterpart** | [`artifacts-social-login-usecase.workspace.js`](artifacts-social-login-usecase.workspace.js) **`completeWithTokens` L56–L75** |
| **Same as workspace?** | **NO** (different module / name) |

---

### E10 — Toast / UI error surface

| Field | Evidence |
|-------|----------|
| **Production `socialAuthError` (full)** | [`artifacts-auth-login-init.production.btnRace20260728.js`](artifacts-auth-login-init.production.btnRace20260728.js) **L125–L130** |
| **Reject string source** | Production auth-social **L209** (`startGoogleLoginFromUserGesture`) |
| **Call chain** | reject → `bindSocialButtons` `.catch` → `opts.onError` → `socialAuthError` → `showLoginError` + `ixToast` |
| **Workspace `socialAuthError`** | [`artifacts-auth-login-init.workspace.js`](artifacts-auth-login-init.workspace.js) **L125–L130** |
| **Same init file as Production?** | **NO** (md5 khác); body of `socialAuthError` lookalike — Owner tự diff |

---

## 3. Call chain sheets (copy-ready)

### Production (locked)

```text
https://iflux.vn/dang-nhap
  #btn-google
  auth-login-boot.js?v=regAffLock20260728
    → auth-social.js?v=googleProxy20260728   (md5 8b16bbe7…)
    → auth-login-init.js?v=btnRace20260728   (md5 90d48f49…)
         IfluxAuthSocial.initPage
           → initPage → ensureOffscreenGoogleActivator → initGoogle → renderButton
           → bindSocialButtons(#btn-google)
  click
    → startGoogleLoginFromUserGesture / loginGoogle
      → clickOffscreenGoogleActivator
      → (false) reject → socialAuthError
      → (credential) finishSocialLogin → IfluxAuth.loginWithSocial
```

### Workspace (not Production login)

```text
auth-login-boot.js (workspace)
  → social-auth/identity-proof.js?v=wp2Ggl20260728
  → social-auth/google-provider.js?v=wp2Ggl20260728
  → social-auth/provider-registry.js?v=wp2Ggl20260728
  → social-auth/social-login-usecase.js?v=wp4Ggl20260728
  → auth-social.js?v=wp2Ggl20260728
  → auth-login-init.js?v=wp4Ggl20260728
click #btn-google
  → runGoogle → UseCase.execute → GoogleProvider.getProof → accounts.id.prompt
```

---

## 4. Function location cheat-sheet

| Function | Production artifact + lines | Workspace artifact + lines | Identical? |
|----------|----------------------------|----------------------------|------------|
| `clickOffscreenGoogleActivator` | prod auth-social **166–178** | — | NO |
| `ensureOffscreenGoogleActivator` | prod auth-social **136–164** | — | NO |
| `initGoogle` | prod auth-social **111–133** | (≈ `ensureGis` ws provider **60–78**) | NO |
| `startGoogleLoginFromUserGesture` | prod auth-social **180–213** | — | NO |
| `loginGoogle` | prod auth-social **215–229** | (≈ `runGoogle` ws auth-social **99–105**) | NO |
| `bindSocialButtons` | prod auth-social **333–372** | ws auth-social **205–233** | NO |
| `initPage` | prod auth-social **374–393** | ws auth-social **235–249** | NO |
| `getProof` / `prompt` | — (not on Prod login) | ws google-provider **83–120** | N/A on Prod |
| `execute` | — | ws usecase **81–97** | N/A on Prod |
| `socialAuthError` | prod init **125–130** | ws init **125–130** | files differ (md5) |

---

*Evidence pack only · 2026-07-29.*
