# Plan — Persistent App Shell Soft Navigation · Phase 1

**Epic:** `100826_Persistent_App_Shell_Soft_Navigation`  
**Date:** 2026-08-10  
**Status:** 🔒 **CLOSED** (2026-08-10) · Deployed softNavP1 + layoutFix · Owner đóng task  
**Input:**  
- 🔒 [`01 - BRD`](01%20-%20BRD%20—%20Persistent%20App%20Shell%20Soft%20Navigation.md)  
- 🔒 [`02 - Audit`](02%20-%20Audit%20—%20Persistent%20Shell%20Soft%20Navigation.md) (Architecture APPROVED)

---

## 0. Impact Analysis (CG-005)

| Feature | Current owner | Files | Decision |
|---------|---------------|-------|----------|
| Soft navigation | *không có* | — | **Create minimal** coordinator (1 module) |
| URL navigate | `IfluxShellUrlWriter` / `IfluxHref` | `shell-url-writer.js`, `iflux-href.js` | **Modify** — soft vs hard path |
| Shell boot | `bootShell` | `shell-boot.js` | **Modify** — reuse `booted`; không re-chrome soft |
| Page mount | `bootPage` | `page-runtime` + widget-loader | **Modify** — gọi teardown trước remount |
| Page teardown | `unloadWidget` (unused) | `widget-loader.js` | **Reuse / wire** |
| Header/nav paint | `IfluxAppShellHeader` | `iflux-platform-boot.js` | **Modify** — soft: chỉ sync active (tránh remount logo) |
| Logo / SEO | `enrichManifestWithSiteSeo` | `bootstrap.js` | **Modify** — tách shell logo once vs page SEO |
| Primary menu HTML | ~25 HTML | `User_Web/**` | **Reuse as-is P1** — không gộp shell HTML |
| Active state | `IfluxAppShell.activePage` | platform-boot | **Reuse** |

**File mới?** Tối đa **một** coordinator soft-nav (vd. `runtime/soft-navigation.js`) — responsibility: intercept + sequence teardown/pushState/bootPage.  
**Why cannot modify only Writer?** Writer chỉ biết hard `location.assign`; thiếu page teardown + outlet swap ownership. Coordinator gọi Writer/Href + bootPage — không nhân bản Routes/Nav.

**Cấm P1:** React/Vue, router framework, preload all pages, gộp 25 HTML, soft Account/Write soft, API mới.

---

## 1. Scope P1 (LOCKED)

### Soft-nav allowlist (cùng-origin, primary)

| Route key | Path mẫu | Outlet |
|-----------|----------|--------|
| `dashboard` | `/nha-cua-toi`, `/home` | `[data-ifx-page-runtime]` |
| `market` | `/thi-truong` | có |
| `flow` | `/dong-tien` | có |
| `community` | `/cong-dong` (list, không write/post detail nếu hazard) | có — **chỉ index cộng đồng** |
| `pricing` | `/bang-gia` / pricing route SoT | có |

### Hard-nav (fallback / ngoài P1)

- Account, Checkout, Write, Comments, Share, Auth  
- Entity detail (cổ phiếu/ngành/HST/câu chuyện) — P2  
- Home greet sibling phức tạp: nếu soft Home↔X khó → soft chỉ giữa market/flow/community/pricing trước; Home hard tạm **hoặc** soft Home nếu outlet-only sau smoke test  
- Modifier-click / middle-click / `target=_blank` → browser default  
- JS error trong soft → `location.assign` hard

### Logo policy (LOCKED)

- Soft-nav: **không** `hidden`, không clear `src`, không gọi SEO chỉ để logo.  
- Page SEO soft: chỉ `document.title` / meta description (và tương đương) từ `/seo/effective` pageKey mới.

---

## 2. Architecture P1 (đã APPROVED)

```text
Document
├── Persistent Shell (Header + Logo img + Nav + Tabbar)
└── Page Outlet [data-ifx-page-runtime]
     teardown → mount
```

Sequence:

```text
intercept allowlist <a>
  → preventDefault
  → teardown (unloadWidget / feature dispose / page timers hook)
  → history.pushState (canonical + Owner decorate qua Href/Writer)
  → sync active: Header.renderNav + syncMobileTabbar (DOM header giữ)
  → update main.ifx-main--*
  → resolveManifest + bootPage(outlet)  [không bootShell chrome lại]
  → enrich page SEO (skip logo if already bound)
  → on failure: location.assign(href)
```

popstate: cùng teardown/mount pipeline (không reload document).

---

## 3. Work packages

### WP-1 — Soft-nav coordinator (minimal new)

- Intercept capture-phase trên `document` cho `a[href]` internal allowlist.  
- Guards: same-origin, left-click, no meta/ctrl/shift, no download, allowlist match qua `IfluxRoutes.detectRoute`.  
- API: `softNavigate(url)` / `canSoftNavigate(url)`.

### WP-2 — Writer / Href

- `IfluxShellUrlWriter.navigate({ soft: true })` hoặc delegate soft → coordinator; default hard giữ nguyên.  
- Không phá consumer hiện tại (auth/guest `consumerNavigate`).

### WP-3 — Teardown + remount

- Trước `bootPage`: iterate mounted widgets → `unloadWidget`.  
- Feature dispose nếu có.  
- Registry nhẹ “page cleanup fn” nếu timer page-level (entity-list) — chỉ khi page trong allowlist cần; **không** abstraction thừa.

### WP-4 — Bootstrap split

- `bootShell`: soft path = skip chrome script reload nếu `booted`.  
- `enrichManifestWithSiteSeo({ bindLogo: false })` khi soft.  
- Idempotent `GuestShell.bootstrapPage` listeners (fix leak).

### WP-5 — Active + main class

- Sau soft: `IfluxAppShellHeader.renderNav()` + `IfluxWebUI.syncMobileTabbar()` trên **cùng** header DOM.  
- Map route → `ifx-main--market|flow|community|hub|pricing`.

### WP-6 — Verify

- Manual: soft A→B→C, Back/Forward, new tab, refresh, JS-off link.  
- Network evidence: soft không document mới; logo không re-request; seo không bắt buộc cho logo.  
- Không duplicate interval sau 3 soft hops.

---

## 4. Out of scope P1

- Gộp 25 HTML thành 1 shell host (P4)  
- Soft entity / account / write  
- Animation chuyển trang  
- Admin soft-nav  

---

## 5. DoD P1 (map BRD §15 — thu hẹp allowlist)

### UX
- [ ] Soft giữa allowlist: Header/logo không biến mất / không hidden→visible lại  
- [ ] Active menu đúng  
- [ ] Chỉ outlet (+ main class) đổi  

### Architecture
- [ ] MPA direct URL / refresh OK  
- [ ] Không framework mới; ≤1 module soft-nav mới  
- [ ] Reuse Routes/Nav/bootPage/unloadWidget  

### Perf
- [ ] Soft: không full HTML document; không rebind logo  
- [ ] Evidence network trước/sau  

### Reliability
- [ ] Back/Forward; new tab; hard fallback khi lỗi  
- [ ] Không leak listener/timer rõ trên allowlist hops  

### Code
- [ ] Không copy Header/nav  
- [ ] GuestShell listener idempotent nếu đụng  

---

## 6. Gate

```text
BRD LOCK ✅
Audit APPROVED ✅
Architecture APPROVED ✅
Plan PASS ✅ (Owner: triển khai)
Implement WP-1…WP-6 ✅
Layout residue fix ✅ (community after market/home)
Verify DoD P1 ✅
Owner CLOSE ✅ (2026-08-10)
```

**Epic P1 CLOSED.** Out-of-scope P2+ không thuộc close này.
