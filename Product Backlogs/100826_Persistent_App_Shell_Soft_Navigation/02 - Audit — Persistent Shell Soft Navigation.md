# Audit — Persistent App Shell & Soft Navigation (User Web)

**Epic:** `100826_Persistent_App_Shell_Soft_Navigation`  
**Date:** 2026-08-10  
**Status:** 🔒 **AUDIT APPROVED** (Owner 2026-08-10) · Architecture APPROVED · Plan OPEN · **không code cho đến Plan PASS**  
**Input:** [`01 - BRD — Persistent App Shell Soft Navigation.md`](01%20-%20BRD%20—%20Persistent%20App%20Shell%20Soft%20Navigation.md)  
**Plan:** [`03 - Plan — Persistent Shell Soft Navigation P1.md`](03%20-%20Plan%20—%20Persistent%20Shell%20Soft%20Navigation%20P1.md)

---

## 1. Current State

| Concern | Hiện trạng |
|---------|------------|
| **Header owner** | HTML tĩnh **nhân bản ~25 page** (`User_Web/**/index.html` …) — `.ifx-app > header.ifx-topnav`. Không có single shared shell document. |
| **Logo owner (bind)** | `runtime/bootstrap.js` → `enrichManifestWithSiteSeo()` — đọc `/api/seo/effective` → `logo_url` → set `src` + bỏ `hidden` trên `.ix-brand-logo[data-ifx-seo-logo]`. |
| **Logo DOM** | Mỗi HTML: `<img class="ix-brand-logo" … hidden>` **không `src`**. CSS SoT: Admin `components.css` `height: 36px`. |
| **Navigation owner (data)** | `iflux-platform-boot.js`: `IfluxNavRegistry` + `IfluxAppShell` (`getPrimaryNav`, `hrefFor`, `activePage`). |
| **Navigation owner (paint)** | `IfluxAppShellHeader.render` / `renderNav` — `innerHTML` vào `.ifx-topnav-menu`. Mobile: `IfluxWebUI.syncMobileTabbar`. |
| **SEO owner** | Site SEO API `/api/seo/effective?pageKey=` (PAGE > GLOBAL). User Web gọi **1 lần / document** trong bootstrap. |
| **Bootstrap owner** | `runtime/bootstrap.js` `start()` → `bootShell` (`shell-boot.js`) → `resolveManifest` / SEO → `bootPage` (`page-runtime`). Nginx inject early scripts (PNC / Writer / Href). |
| **Page boundary** | Intended: `[data-ifx-page-runtime]` trong `<main class="ifx-main …">`. ~19 page dùng outlet này. |
| **Page lifecycle** | Mount: `bootPage` → widget `mount`. Destroy soft-nav: **chưa wired** (`unloadWidget` có sẵn nhưng không gắn navigation). |

### A–F Evidence (tóm tắt)

**A. App Shell** — Header/logo/nav nằm trong mỗi document; Header paint = `IfluxAppShellHeader`; logo bind = bootstrap SEO; GuestShell sync brand href + actions.

**B. Navigation** — Menu = `<a href>` thật → **full navigation**. Active = `IfluxAppShell.activePage()` từ pathname/`IfluxRoutes.detectRoute`. Logic nav **không** copy nhiều file; **HTML shell** thì copy ~25 lần.

**C. Bootstrap** — Mỗi full load chạy lại: early nginx scripts + ESM bootstrap + SEO + bootShell + bootPage. Trong **một** document: script globals / `booted` flag = once-capable. **Không** có session soft-nav giữ shell.

**D. SEO** — User Web: chỉ `enrichManifestWithSiteSeo`. `logo_url` thường GLOBAL nhưng request vẫn theo `pageKey`. Soft-nav **không cần** re-bind logo nếu shell giữ cùng `<img>` instance (trừ khi Owner muốn page-level logo override — hiện hiếm).

**E. Page Outlet** — An toàn nhất Phase-1: giữ `header` + `#ifx-mobile-tabbar`; swap `[data-ifx-page-runtime]` **và** cập nhật `main.ifx-main--*`. Hazard: Home greet **ngoài** outlet; Account / Write / Comments / Share = shell-only hoặc host khác.

**F. Lifecycle risk** — Entity list `setInterval`; GuestShell thêm listener `iflux-plans-updated` mỗi `bootstrapPage`; widget ESM remount không `unloadWidget` → leak. Không thấy User Web WebSocket; polling/timer là class chính.

---

## 2. Root Cause (trace lifecycle — không chỉ “vì MPA”)

Khi user click `Thị trường`:

```text
1. <a href="/thi-truong"> → location full navigation
2. Browser destroy Document A (Header + Logo DOM + listeners chết)
3. Document B parse: header mới + <img hidden không src>
4. Paint: chỗ logo trống / collapse
5. bootstrap.start() → bootShell → … → enrichManifestWithSiteSeo
6. GET /api/seo/effective?pageKey=…
7. setAttribute('src', logo_url) + removeAttribute('hidden')
8. Logo “xuất hiện lại”; Header “load lại”
9. IfluxAppShellHeader.renderNav() tạo lại toàn bộ <a> menu
```

**Nguyên nhân kép (đúng BRD):**

1. **Document lifecycle = Shell lifecycle** — không có Persistent Shell; mỗi menu = remount Header/Logo/Nav.  
2. **Logo là deferred shell asset** — không nằm sẵn trong HTML; bind sau async SEO → flash hidden→visible **mỗi** full load.  
3. **Writer.navigate / menu href = hard nav** — chưa có soft-nav interceptor; comment “soft-nav” trong `shell-boot` chỉ là phòng thủ globals, không phải soft page swap.

---

## 3. Reuse Inventory

### Có thể reuse (không tạo lại)

| Asset | Path | Vai trò |
|-------|------|---------|
| `IfluxRoutes` / `IfluxNavRegistry` / `IfluxAppShell` | `iflux-platform-boot.js` | Route + nav model + active |
| `IfluxAppShellHeader` | cùng file | Paint menu (gọi lại chỉ để đổi active — không recreate header DOM) |
| `IfluxShellUrlWriter` / `IfluxHref` | `shell-url-writer.js` / `iflux-href.js` | Decorate URL; **cần mở rộng** soft path (hiện `navigate` = hard) |
| `IfluxPncLifecycle` popstate | `pnc-lifecycle.js` | Chỉ Owner bar — **có thể gắn thêm** page restore tối thiểu |
| `bootPage` + `[data-ifx-page-runtime]` | `page-runtime` / widgets | Mount page content |
| `unloadWidget` | `widget-loader.js` | Teardown (đã viết sẵn cho soft-nav tương lai) |
| Feature `dispose` | `feature-runtime.js` | Một số feature |
| SEO enrich | `bootstrap.enrichManifestWithSiteSeo` | Soft-nav: **tách** logo (giữ) vs title/meta page (cập nhật) |
| `app-shell.css` | User Web | Chrome layout |

### Có thể refactor

- Tách `enrichManifestWithSiteSeo`: **shell logo once** vs **page SEO fields mỗi soft-nav**.
- `IfluxShellUrlWriter.navigate`: nhánh soft vs hard theo flag/capability.
- `bootShell`: không re-run chrome khi soft-nav (đã có `booted` — cần productize).
- `GuestShell.bootstrapPage`: idempotent listeners (tránh leak).

### Có thể remove (sau khi soft-nav ổn — không xóa sớm)

- Nhân bản HTML header giữa các page (dài hạn: một shell host + outlet) — **Phase sau**; Phase-1 có thể soft-nav trong cùng document mà chưa gộp 25 HTML.
- Hard-nav-only assumptions trong comment nếu obsolete.

### Bắt buộc phải thêm (tối thiểu)

| Capability | Lý do | Không phải |
|------------|-------|------------|
| Click intercept primary/mobile internal `<a>` | Soft-nav enhancement | SPA router framework |
| `history.pushState` + popstate **page** handler | URL/Back-Forward | Full router lib |
| Page teardown pipeline | Gọi `unloadWidget` / dispose / clear timers trước swap | Lifecycle song song mới nếu reuse được |
| Soft load target page assets | Chỉ JS/CSS/data page đích | Preload toàn app |
| Policy allowlist routes Phase-1 | Chỉ page có outlet chuẩn | Soft-nav mọi URL ngay |

**Ước lượng:** thêm **một** module nhỏ (vd. soft-nav coordinator) + modify Writer/bootstrap/Header active — **không** framework. Nếu Owner đòi gộp 25 HTML shell ngay → diff lớn (cần chốt scope Phase-1).

---

## 4. Proposed Architecture

### BEFORE

```text
Document A                         Document B
├── Header (new)                   ├── Header (new)
│   ├── Logo hidden→SEO bind       │   ├── Logo hidden→SEO bind
│   └── Nav recreate               │   └── Nav recreate
└── Page A                         └── Page B

Mỗi click menu = destroy A → create B
```

### AFTER (mục tiêu BRD — Progressive trên MPA)

```text
Document (session)
├── Persistent App Shell          ← init 1 lần / document
│   ├── Header (DOM giữ nguyên)
│   ├── Logo (cùng <img>, không re-fetch/recreate)
│   ├── Navigation (chỉ đổi active class/ARIA)
│   └── Mobile tabbar (đổi active)
│
└── Page Outlet = [data-ifx-page-runtime] (+ main modifier)
     ├── Page A  → teardown
     └── Page B  → mount (load chỉ asset cần)

Direct URL / Refresh / New tab / JS-off
  → vẫn MPA full document (SEO intact)
```

### Soft-nav sequence (đề xuất)

```text
click <a href="/thi-truong"> (same-origin, allowlist, left-click, no modifier)
  → preventDefault
  → teardown current page (unloadWidget / dispose / timers)
  → pushState + sync PNC/Href nếu cần
  → update main class + active nav (IfluxAppShellHeader.renderNav hoặc patch active only)
  → fetch/import page definition + bootPage(outlet)
  → enrich PAGE seo (title/meta) — KHÔNG recreate logo
  → hard fallback nếu lỗi
```

### Phase đề xuất (giảm risk)

| Phase | Scope |
|-------|--------|
| **P0** | Audit + Owner duyệt (file này) |
| **P1** | Soft-nav **allowlist** primary nav pages có `[data-ifx-page-runtime]` thuần: Nhà / Thị trường / Dòng tiền / Cộng đồng / Pricing (và tương đương) |
| **P2** | Entity context pages + CSS main class; Home greet policy |
| **P3** | Account / Write / Comments / Share — hoặc giữ hard-nav |
| **P4** | Giảm nhân bản HTML shell (optional) nếu P1–P3 chứng minh giá trị |

---

## 5. Performance Impact

### Loại bỏ / tránh khi soft-nav (so với full reload hiện tại)

| Item | Hiện mỗi menu | Soft-nav P1 |
|------|----------------|-------------|
| Parse/recreate Header DOM | Có | **Không** |
| Logo `hidden`→SEO→`src` | Có | **Không** (giữ instance) |
| Re-download shell CSS/JS (cold) | Phụ thuộc cache; vẫn re-exec bootstrap | **Không** re-exec shell bootstrap đầy đủ |
| `/api/seo/effective` chỉ để lấy logo | Gọi full page SEO | **Tách:** page SEO fields only; logo skip nếu đã bind |
| `IfluxAppShellHeader` recreate toàn menu | Có | Chỉ update active (hoặc renderNav nhẹ trên DOM sẵn) |

### Vẫn cần mỗi soft-nav (hợp lệ)

- Load page manifest / widget JS chưa có trong session.
- Page-specific CSS nếu chưa load.
- Page data API.
- Update `document.title` / meta description (SEO UX tab).

### Không làm (BRD cấm)

- Preload mọi page.
- Bundle toàn hệ vào initial.
- API mới chỉ cho soft-nav (reuse `/seo/effective` + PagePublished hiện có).

### Evidence plan (khi implement)

Network panel: A→B hard vs soft — đếm document request, seo/effective, logo image, shell JS. Soft: **0** document HTML mới; **0** logo image re-request (cache + same node); seo chỉ nếu cần page fields.

---

## 6. Risk

| Risk | Mức | Mitigation |
|------|-----|------------|
| SEO / crawl | Cao nếu SPA-only | **MPA direct URL bắt buộc**; soft-nav chỉ enhancement |
| Refresh / bookmark | Trung bình | Server vẫn trả full HTML từng route |
| Back/Forward | Cao | popstate page handler + teardown/remount; reuse PNC cho Owner bar |
| Open in new tab | Thấp | Không preventDefault khi metaKey/button≠0 |
| JS disabled | Thấp | `<a href>` fallback |
| Auth walls | Trung bình | Soft-nav phải tôn trọng `requireAuth` / redirect soft hoặc hard |
| Page CSS `main--*` / extra link | Cao | Allowlist P1; update class; lazy CSS |
| Home greet ngoài outlet | Trung bình | Hard-nav Home↔khác hoặc đưa greet vào outlet |
| Account/Write/Comments | Cao | Phase sau hoặc luôn hard-nav |
| Memory leak timers/listeners | Cao | Bắt buộc teardown; fix GuestShell idempotent |
| Double bootShell | Trung bình | Productize `booted` + soft path |
| Page-level `logo_url` override | Thấp | Policy: soft-nav **không** đổi logo trừ Owner yêu cầu |
| Complexity tăng vô lý | — | Nếu P1 cần >N file mới lớn → **dừng báo Owner** (BRD §10/16) |

---

## 7. Decision Owner — LOCKED 2026-08-10

| # | Quyết định | LOCK |
|---|------------|------|
| 1 | Phase-1 allowlist primary nav có outlet chuẩn (Nhà / Thị trường / Dòng tiền / Cộng đồng / Pricing) | **YES** |
| 2 | Soft-nav giữ GLOBAL logo instance — không re-fetch/recreate logo | **YES** |
| 3 | Account / Write / Comments / Share / Home greet policy phức tạp → **hard-nav tạm** (P2+) | **YES** |
| 4 | Architecture §4 (Persistent Shell + Soft Nav trên MPA) | **APPROVED** |
| 5 | Mở Plan P1 | **YES** — implement chỉ sau Plan PASS |

**Next:** Plan P1 → Owner PASS Plan → mới Implement.

---

## 8. Kết luận audit

| Câu hỏi BRD | Trả lời |
|-------------|---------|
| Header reload vì sao? | Full document nav + logo deferred SEO bind + Header recreate mỗi load |
| Soft-nav đã có? | **Chưa** — chỉ hook/teardown dự phòng |
| Reuse đủ không? | **Đủ** Routes/Nav/Header/bootPage/unloadWidget/Writer — thiếu coordinator soft + teardown wiring |
| Có cần framework? | **Không** |
| Có thể đạt DoD mà net complexity chấp nhận được? | **Có** nếu Phase-1 allowlist + không gộp 25 HTML ngay |

**Next:** Owner duyệt §4 Architecture + §7 decisions → mới Plan/Implement.
