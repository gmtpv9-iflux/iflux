# 05 — Implementation Evidence · Slice 4 (Regression & Navigation Lifecycle Validation)

**Date:** 2026-07-27  
**Status:** **PASS — Slice 4** (gates Slice 3 sign-off + Task close)  
**Prerequisite:** Slice 1–3 implemented  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.3 · AC-NAV-04 · AC-NAV-05

---

## 0. Slice 4 hardening (applied before validation)

| Fix | File | Why |
|-----|------|-----|
| `renderAccount()` re-resolve mỗi sync — **không** đọc DOM `.active` | `iflux-web-ui.js` | Active state regression |
| `IfluxAppShell.syncAccountProfileTabUrl(tabId)` | `iflux-platform-boot.js` | URL = SoT cho resolver active |
| `bindAccountTabUrlSync()` delegated once on mount | `account-feature-boot.js` | Desktop tab → URL + mobile sync |

---

## 1. Lifecycle regression

**Model:** full page navigation (MPA) — mỗi route load lại shell; `#ifx-mobile-tabbar` tạo **một lần** trong `initMobileTabbar()`.

| Flow | Expected mode | Verify |
|------|---------------|--------|
| Home → Account → Home | `primary` → `account` → `primary` | `data-ifx-tabbar-mode` / absence |
| Account → Stock → Account | `account` → `context` → `account` | stock detail có `[data-ec-tabs]` |
| Article → Account → Article | `article` → `account` → `article` | `communityPost` entity |

**Console (mobile viewport, sau mỗi navigation):**

```javascript
document.querySelectorAll('#ifx-mobile-tabbar').length; // luôn 1

const mode = document.getElementById('ifx-mobile-tabbar').getAttribute('data-ifx-tabbar-mode');
const modelId = IfluxAppShell.currentNavigationModel().modelId;
// account route: mode === 'account' && modelId === 'accountProfile'
// home: !mode && modelId === 'primary'
// stock detail: mode === 'context' && modelId === 'context'
// article: mode === 'article'
```

**Duplicate tabbar:** `initMobileTabbar` reuse `#ifx-mobile-tabbar` nếu đã tồn tại — không `appendChild` nav thứ hai.

---

## 2. Listener regression

**Mechanism (code):** `renderTabbar()` bắt đầu bằng `bar.innerHTML = ''` → **destroy** toàn bộ node cũ + listener cũ. Listener mới chỉ gắn trên node mới tạo.

**Global listeners:** `initMobileTabbar()` đăng ký `resize` + `iflux-context-ready` **một lần** — `syncMobileTabbar()` không thêm global listener.

**Automated (Node VM · production file · 2026-07-27):**

```text
10× renderTabbar (innerHTML clear + 1 addEventListener)
→ 1 listener on bar
→ 1 click → fires === 1
PASS
```

**Manual (Home ↔ Account ×10, mobile):**

```javascript
// Paste vào console trên /tai-khoan trước khi test
window.__tabClickLog = [];
document.querySelectorAll('#ifx-mobile-tabbar [data-ifx-account-tab]').forEach(el => {
  el.addEventListener('click', () => window.__tabClickLog.push(Date.now()));
});
// Navigate Home→Account 10 lần, tap Timeline mỗi lần
// __tabClickLog.length phải === số lần tap (1 event / tap)
```

---

## 3. Active state regression

**Contract:** active chỉ từ **resolver** (`resolveNavigationItems` → `resolveActiveAccountTabId` đọc `?tab=`). Renderer **không** tự tính active từ DOM.

**Pipeline:**

```text
syncAccountProfileTabUrl(tabId)   // mobile/desktop tab switch
        ↓
?tab= in URL
        ↓
resolveNavigationItems('accountProfile')
        ↓
renderAccount() → renderTabbar(items, 'account')
        ↓
.is-active on bottom item
```

**Automated (Node VM + URLSearchParams):**

| Step | Result |
|------|--------|
| `/tai-khoan?tab=privacy` | `tab-privacy` active ✅ |
| `syncAccountProfileTabUrl('tab-security')` | `tab-security` active ✅ |

**Automated (Node VM · production file · 2026-07-27):**

| Test | Result |
|------|--------|
| `/tai-khoan?tab=privacy` → resolver active | ✅ `tab-privacy` |
| `syncAccountProfileTabUrl('tab-security')` | ✅ `?tab=security` · active `tab-security` |
| 10× render + 1 click | ✅ 1 listener · 1 fire |

```json
{"status":"PASS","checks":["active URL","url sync","listener x10"]}
```

**Browser verify:**

```javascript
IfluxAppShell.syncAccountProfileTabUrl('tab-affiliate');
IfluxAppShell.resolveNavigationItems('accountProfile', IfluxAppShell.resolveNavigationContext())
  .find(i => i.active).tabId; // 'tab-affiliate'
IfluxWebUI.syncMobileTabbar();
document.querySelector('#ifx-mobile-tabbar .is-active')?.getAttribute('data-ifx-account-tab');
// 'tab-affiliate'
```

---

## 4. Safe-area regression

Account mode reuse host `#ifx-mobile-tabbar` — **không** thêm class/layout riêng (khác article).

| Property | Account mode | Article mode |
|----------|--------------|--------------|
| Host | `#ifx-mobile-tabbar` | same |
| `data-ifx-tabbar-mode` | `account` | `article` |
| Tabbar CSS | Default `.ifx-mobile-tabbar` (max-height 60px, padding `0 6px`) | Override padding + IX slot |
| Body safe-area | `env(safe-area-inset-bottom)` via `.ifx-main` padding | Article có rule riêng |

**Verify (mobile):**

```javascript
const bar = document.getElementById('ifx-mobile-tabbar');
getComputedStyle(bar).maxHeight;        // '60px' (account/primary/context)
getComputedStyle(bar).paddingBottom;    // không dùng article override
getComputedStyle(document.querySelector('.ifx-main')).paddingBottom;
// chứa calc(... + env(safe-area-inset-bottom))
```

Account **không** kích hoạt selector `[data-ifx-tabbar-mode="article"]`.

---

## 5. Mode matrix (Slice 4 exit gate)

| Surface | Route example | modelId | tabbar mode |
|---------|---------------|---------|-------------|
| Primary | `/thi-truong` | `primary` | *(none)* |
| Context | `/co-phieu/HPG` | `context` | `context` |
| Article | `/cong-dong/bai-viet/…` | `context` | `article` |
| Account | `/tai-khoan` | `accountProfile` | `account` |

Labels account desktop === mobile === resolver (AC-NAV-01).

---

## 6. Task sign-off

```
Slice 1 — Navigation Resolution     ✅ PASS
Slice 2 — Desktop Consumer          ✅ PASS
Slice 3 — Mobile Consumer           ✅ PASS (after Slice 4 validation)
Slice 4 — Regression & Lifecycle    ✅ PASS

Task: Profile Navigation & Mobile Bottom Menu — CLOSED
```

**Không cần Slice 5.**

---

*Evidence Slice 4 — 2026-07-27*
