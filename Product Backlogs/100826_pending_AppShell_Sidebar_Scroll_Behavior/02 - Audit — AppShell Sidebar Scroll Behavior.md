# 02 — Mandatory Audit — AppShell Sidebar Scroll Behavior

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Document** | Mandatory Audit (Current State Evidence) |
| **Status** | 🔒 **AUDIT COMPLETE** (2026-08-10) · **Amended by [`02a`](02a%20-%20Audit%20Amendment%20—%20Reverse%20Sync.md)** + **[`02b`](02b%20-%20Audit%20Amendment%20—%20Post-Foundation%20Convergence.md)** · SoT 03 LOCKED |
| **Input** | 🔒 [`01 - BRD`](01%20-%20BRD%20—%20AppShell%20Sidebar%20Scroll%20Behavior.md) §23 BR Checklist (+ Reverse Sync amendment) |
| **Authority** | Audit **không** đổi BRD · **không** khóa Solution / mechanism |
| **Evidence date** | 2026-08-10 · Codebase local + Production runtime `iflux.vn` (Playwright 1280×800 / 390×844) |
| **Amendment** | Bắt buộc đọc [`02a`](02a%20-%20Audit%20Amendment%20—%20Reverse%20Sync.md) cho BR-01.3 · BR-04.* · BR-AUD.H · INV-11/12; và [`02b`](02b%20-%20Audit%20Amendment%20—%20Post-Foundation%20Convergence.md) cho Inventory/renderer sau khi Foundation `100826` đóng (2026-08-11) |

---

## 0. Audit method (Governance)

```text
BR Checklist (§23) → Audit Check / Evidence → Status
```

**CẤM** trong audit này: chọn sticky/fixed/JS làm “đáp án”; map ngược từ code rồi đánh BR DONE.

**Status legend**

| Status | Meaning |
| --- | --- |
| **GAP** | BR yêu cầu behavior/ownership chưa có (hoặc trái hiện trạng) |
| **PARTIAL** | Có bề mặt liên quan nhưng ownership / coverage / behavior chưa khớp BR |
| **PASS-AS-IS** | Hiện trạng đúng như BR mô tả *current state* / constraint (vd. Header fixed) |
| **N/A (runtime)** | Không đo được (auth gate / empty) — code evidence vẫn ghi |
| **FINDING** | Compatibility / ownership classification (không đổi BR) |

---

## 1. Executive finding (facts)

1. **Không tồn tại** AppShell shared “Sidebar viewport-following” behavior (24px trigger / bidirectional).  
2. **AppShell-owned left section sidebar** chỉ có trên **`market`** và **`home`** (`ensureSections` + `applyMarketLayout` / `applyHubLayout`).  
3. **Không có** page manifest nào khai `sidebar-right` qua AppShell `ensureSections`. Right column hiện là **page/widget-owned** (Cộng đồng feed / article aside).  
4. Vertical scroll owner User Web AppShell pages = **`html`/`body` / window** (`overflow-y: auto`), không phải nested main scroller.  
5. AppShell market/hub sidebars: `position: static` — scroll theo document; khi Main dài hơn Sidebar → Sidebar **rời viewport** (đúng pain BRD §2–3).  
6. Sticky đã có ở **Stock entity columns** và **Pricing order summary** — **không** phải AppShell Sidebar scroll capability; ownership page/CSS riêng.  
7. Mobile: content 2-col **collapse → 1fr** (không drawer). Drawer chỉ là **topnav** AppShell.

---

## 2. Audit A — Complete Sidebar Inventory

| ID | Position | Selector / structure | Renderer | Route coverage (evidence) | AppShell ownership? | Page/Widget ownership? | Shared / unique | Responsive mode |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **SB-AS-MKT** | Left | `aside.ifx-rt-section--sidebar.ifx-mkt-sidebar[data-ifx-section=sidebar]` under `[data-ifx-page-runtime].ifx-mkt-layout` | `runtime/app-shell.js` `ensureSections` + `applyMarketLayout`; mount `page-runtime.js` | `market` `/thi-truong` — `pages/market.manifest.js` sections `sidebar`+`main` | **YES** (section host + layout class) | Widget content *inside* via PagePublished | Unique CSS `market.css` | ≤768px → 1 col (`market.css`) |
| **SB-AS-HUB** | Left | `aside…ifx-hub-sidebar[data-ifx-section=sidebar]` under `.ifx-hub-grid` | `ensureSections` + `applyHubLayout` | `home` `/nha-cua-toi` — `home.manifest.js` | **YES** | PRF widgets in sidebar slots | Unique CSS `hub.css` | ≤768px → 1 col |
| **SB-WGT-FLW** | Left | `aside.ifx-flow-market-sidebar[data-ifx-section=sidebar]` | Widget `widgets/flow-page` | `flow` — manifest **main only** | **NO** (host AppShell outlet only) | **YES** | Unique `flow.css` | ≤1024px → 1 col |
| **SB-WGT-ELP** | Left | `aside.ifx-mkt-sidebar` built inside ELP (reuses market CSS classes) | `widgets/entity-list-page` | `stocks` / `sectors` / `ecosystems` / `cau-chuyen` — manifests **main only** | **NO** | **YES** | Reuses `.ifx-mkt-*` CSS, not AppShell apply | Same as market CSS ≤768 |
| **SB-PG-COM-R** | Right | `aside.ifx-com-feed-sidebar[data-ifx-section=sidebar-right]` | `community-page.js` | `community` `/cong-dong` — manifest **main only** | **NO** | **YES** | Unique community | ≤768 → 1 col; may `hidden` if empty |
| **SB-PG-POST-R** | Right | `aside.ifx-com-story-aside` (no `data-ifx-section`) | `community-post-page.js` | `communityPost` | **NO** | **YES** | Unique | ≤768 → 1 col; comments surface swap mobile |
| **SB-PG-STOCK-L** | Left col | `.ifx-stock-col--left` (may wrap `[data-ifx-section=sidebar]`) | `stock-page.js` / `group-page.js` + `stock.css` | `stock` / `sector` / `family` / detail | **NO** | **YES** | Unique; **sticky** desktop | ≤1024 sticky→static; mobile remount |
| **SB-PG-STOCK-R** | Right col | `.ifx-stock-col--right` | same | entity pages (when present) | **NO** | **YES** | sticky desktop | same |
| **SB-PG-PRICE** | N/A (card) | `.ix-order-summary` | `pricing.css` | `pricing` | **NO** | **YES** | sticky card ≠ sidebar inventory BR | — |
| **SB-AS-RIGHT** | Right via `ensureSections('sidebar-right')` | *(API comment only in `app-shell.js`)* | — | **No current manifest** declares `sidebar-right` | Capability **stub / unused** | — | — | — |

**Chrome ≠ content sidebar:** `header.ifx-topnav` fixed; mobile **nav drawer** `.ifx-topnav-overlay` — không thuộc content Left/Right Sidebar BR.

---

## 3. Audit B — Scroll Context

| Question | Evidence | Result |
| --- | --- | --- |
| Actual vertical scroll owner | `app-shell.css` L27–36: `html/body:has(.ifx-app)` → `overflow-y: auto`; comment “User Web scroll cả trang”. Runtime: `htmlOverflowY=auto`, `bodyOverflowY=auto`; `window.scrollY` thay đổi khi `scrollBy`. | **`window` / document scrolling on `html`/`body`** |
| AppShell wrapper scroller? | `.ifx-app` flex; no vertical overflow scroller | **No** |
| Main scroller? | `.ifx-main` padding/max-width only | **No** |
| Nested scroll on AppShell sidebars? | `.ifx-mkt-sidebar` / `.ifx-hub-sidebar` overflow visible | **No** |
| Nested scroll elsewhere | `.ifx-com-toc`, comments side list, stock chat feed | **Yes — inner widgets only** |
| Assume `window` always? | Auth/onboarding may lock overflow (`body.ifx-nav-drawer-open`, onboard) | **Default App pages = window; exceptions = overlay modes** |

---

## 4. Audit C — Geometry (measured Production 2026-08-10)

Viewport probe desktop **1280×800** unless noted.

### C.1 Header

| Metric | Value |
| --- | --- |
| Header height | **56px** |
| Header `position` | **fixed** |
| Content offset (sidebar top typical) | **~80px** (below fixed header) |

### C.2 Market — SB-AS-MKT (guest)

| Metric | Value |
| --- | --- |
| Sidebar H×W | **355 × 303** |
| `position` | **static** |
| Clearance bottom @ scrollY=0 | **365px** (> 24px) |
| Document height | **800** (= viewport) — Main không đủ dài để đẩy Sidebar khỏi viewport trong session guest này |
| Available viewport below header | ~744px; Sidebar **Case A (short)** |

### C.3 Flow — SB-WGT-FLW

| Metric | Value |
| --- | --- |
| Sidebar H×W | **889 × 300** |
| `position` | **static** |
| @ scrollY=0 | top 161, bottom 1050, clearance **−250** (đã vượt đáy viewport) |
| @ scroll max | top **−113**, bottom 776 — **Case C (taller than viewport)**; top bị cuốn khỏi view; **không** viewport-following |
| Doc H | 1074 |

### C.4 Community right — SB-PG-COM-R

| Metric | Value |
| --- | --- |
| Sidebar H×W | **1020 × 300** |
| `position` | **static** |
| @ scrollY=0 | bottom 1100, clearance **−300** — Case C |
| @ scrollY≈920 | top **−840**, bottom 180 — vẫn partial in-view; tiếp tục document flow |
| Doc H | 2730 |
| 24px following? | **Không** — không đổi `position`; không khóa đáy viewport |

### C.5 Market mobile 390×844

| Metric | Value |
| --- | --- |
| Layout | `.ifx-mkt-layout` full-width sidebar **358px** (stacked) |
| `position` | static |
| Doc H | 1027 |

### C.6 Home / Stock sticky runtime

| Surface | Runtime |
| --- | --- |
| Home SB-AS-HUB | **N/A (runtime)** — auth gate; code ownership AppShell confirmed |
| Stock sticky cols | `/co-phieu/HPG` → redirect login — **N/A (runtime)**; CSS evidence `stock.css` sticky + topnav offset |

---

## 5. Audit D — Existing Behavior (sticky / fixed / observers)

| Mechanism | Where | AppShell Sidebar scroll? |
| --- | --- | --- |
| `position: fixed` | `.ifx-topnav`, nav drawer, tabbar, modals | Header/chrome only |
| `position: sticky` | `.ifx-stock-col--left/--right`; `.ix-order-summary` | **No** — page-owned |
| sticky on `.ifx-mkt-sidebar` / `.ifx-hub-sidebar` / `.ifx-flow-market-sidebar` / `.ifx-com-feed-sidebar` | **None** | — |
| Scroll listener on AppShell sidebar | **None** | — |
| IO/RO for sidebar stickiness | **None** (IO on community feed lazy; RO trending) | — |
| Soft-nav layout class cleanup | `page-runtime.js` remove `ifx-mkt-layout`/`ifx-hub-grid` | Prevents layout residue; **not** scroll-follow |

**Reuse candidate (FINDING only):** Stock column sticky là precedent kỹ thuật page-level — **không** tự động = AppShell shared behavior (BR-01 / INV-09 / ownership).

---

## 6. Audit E — Bidirectional Scroll (current)

Protocol: scroll down → observe sidebar vs viewport → scroll up. **Expected BR target:** following @ 24px + no jump on reverse. **Observed:** document-flow only.

| Route | Sidebar | Down | Reverse | Jump / sync note | vs BR target |
| --- | --- | --- | --- | --- | --- |
| `/thi-truong` | SB-AS-MKT | Page ngắn — không ra khỏi viewport | N/A trigger | position static | **GAP** (behavior chưa có; pain chưa lộ vì Main ngắn) |
| `/dong-tien` | SB-WGT-FLW | Top âm; bottom còn trong view | Top trở lại khi scroll up (document sync) | Không “follow state”; không jump kiểu fixed | **GAP** (không có following state) |
| `/cong-dong` | SB-PG-COM-R | Tall sidebar cuốn theo document | Cùng document sync | Không immediate-unfix artifact vì **không ever enter following** | **GAP** |
| Immediate reverse after “would-be trigger” | — | — | — | Không có state machine → không có jump-from-fixed | GAP semantics chưa test được trên following state |

---

## 7. Audit F — Height Matrix (coverage)

| Scenario | Evidence surface | Covered? |
| --- | --- | --- |
| Short Sidebar + Long Main | Market guest = short sidebar nhưng Main **không** long | **PARTIAL** — cần session/page có Main dài hơn (published widgets) để chứng minh pain SB-AS-MKT |
| Sidebar ≈ viewport | Flow ~889 vs ~744 available | **PASS-AS-IS** (case boundary) |
| Tall Sidebar + Long Main | Community right 1020 + doc 2730 | **YES** |
| Sidebar > available viewport | Flow / Community right | **YES** |
| Different Left heights | Market 355 vs Flow 889 | **YES** |
| Different Right heights | Community feed 1020; post aside (code) | **PARTIAL** — post aside không đo runtime trong round này |

---

## 8. Audit G — Route Compatibility Matrix

| Route / pageKey | AppShell page | Left Sidebar | Right Sidebar | Scroll Context | Compatibility vs BR shared AppShell behavior |
| --- | --- | --- | --- | --- | --- |
| `/thi-truong` `market` | ✓ | SB-AS-MKT ✓ | — | window/html | **FAIL** — host AppShell OK; **thiếu** shared scroll behavior |
| `/nha-cua-toi` `home` | ✓ | SB-AS-HUB ✓ | — | window/html (code) | **FAIL** (same) · runtime auth N/A |
| `/dong-tien` `flow` | ✓ outlet | SB-WGT-FLW (widget) | — | window/html | **FAIL** — not AppShell sidebar owner; no shared behavior |
| `/cong-dong` `community` | ✓ outlet | — | SB-PG-COM-R (page) | window/html | **FAIL** — right page-owned; no shared behavior |
| `/cong-dong/...` post | ✓ outlet | — | SB-PG-POST-R | window/html | **FAIL** |
| `/co-phieu` list ELP | ✓ outlet | SB-WGT-ELP | — | window/html | **FAIL** — widget-built; mimics market CSS |
| `/co-phieu/:ticker` etc. | ✓ outlet | SB-PG-STOCK-L sticky | optional R sticky | window/html | **FINDING** — page sticky ≠ AppShell capability; auth may gate |
| `/goi-cuoc` | ✓ | — | sticky card only | window/html | **N/A** content sidebar |
| watchlist / messages / search / faq / loyalty | ✓ | — | — | window/html | **N/A** |
| account / checkout / write / share / comments | shell-only / empty sections | — | — | varies | **N/A** |

---

## 9. BR Checklist → Audit Status

| BR | Atomic | Audit Check | Evidence | Status |
| --- | --- | --- | --- | --- |
| BR-01 | BR-01.1 | AppShell owns sidebar **scroll** behavior? | Chỉ có section host layout; **không** có scroll-follow owner module | **GAP** |
| BR-01 | BR-01.2 | Không có logic scroll riêng theo page cho cùng capability? | Stock sticky + pricing sticky = page-specific; Flow/Com side columns tự build | **FINDING / GAP** (chưa có shared capability; đã có page sticky lệch ownership) |
| BR-01 | BR-01.3 | Objective 2 reversible geometry-aware relationship? | → **[`02a`](02a%20-%20Audit%20Amendment%20—%20Reverse%20Sync.md)** | **GAP** |
| BR-02 | BR-02.1 | Left + Right trong AppShell inventory? | Left AppShell: market/home. Right AppShell section: **unused**. Right thực tế: page-owned | **PARTIAL** |
| BR-02 | BR-02.2 | Left ≢ Right documented? | §2 inventory — khác renderer/CSS/routes | **PASS-AS-IS** (audit documented) |
| BR-03 | BR-03.1 | Normal = document flow? | `position:static` market/hub/flow/com | **PASS-AS-IS** |
| BR-03 | BR-03.2 | Trigger ViewportBottom−24px → following? | Không mechanism; runtime không đổi state | **GAP** |
| BR-03 | BR-03.3 | Following giữ sidebar; main scrolls? | Behavior chưa có | **GAP** |
| BR-03 | BR-03.4 | Mechanism chưa khóa ở BRD? | BRD/Audit không chọn sticky/fixed | **PASS-AS-IS** |
| BR-04 | BR-04.1–5 · INV-11/12 | Reverse Sync / Synchronized Return / reversible position | → **[`02a`](02a%20-%20Audit%20Amendment%20—%20Reverse%20Sync.md)** §5 | **GAP** (capability) |
| BR-05 | BR-05.1–2 | Geometry-aware cases | Case A/C measured; behavior chưa geometry-aware | **PARTIAL** (geometry known) / **GAP** (behavior) |
| BR-06 | BR-06.1–2 | No jump / sync in transitions | Transitions chưa tồn tại | **GAP** |
| BR-07 | BR-07.1 | Header fixed intact | Header 56px fixed; không đụng task | **PASS-AS-IS** |
| BR-08 | BR-08.1 | Scroll container identified | window/html/body | **PASS-AS-IS** |
| BR-09 | BR-09.1 | Responsive | Collapse 1-col; no content-sidebar drawer | **PASS-AS-IS** (constraint) |
| BR-10 | BR-10.1 | Page = consumer; remediation findings | Flow/ELP/Com/Stock side columns = compatibility surfaces | **FINDING** |
| BR-11 | BR-11.1 | Existing infra reuse candidates | `ensureSections`, layout classes, stock sticky (page), soft-nav class cleanup | **PASS-AS-IS** (candidates listed; Solution quyết) |
| BR-12 | BR-12.1 | NFR baseline | Chưa có scroll JS AppShell → chưa có jank từ feature; Header ổn | **PASS-AS-IS** (baseline) |
| BR-AUD | A–G | §16 groups | This document §§2–8 | **PASS-AS-IS** (audit deliverable) |
| BR-AUD | BR-AUD.H | §16.H Reverse Sync matrix | → **[`02a`](02a%20-%20Audit%20Amendment%20—%20Reverse%20Sync.md)** §3 | **PASS-AS-IS** (baseline recorded) |

---

## 10. Answers to BRD §20 (Audit-layer only)

| # | Question | Audit answer |
| --- | --- | --- |
| 1 | Sidebar render ở đâu? | AppShell sections: `app-shell.js` + `page-runtime`; còn lại widget/page HTML |
| 2 | Bao nhiêu Left? | **2** AppShell (market, home) + **nhiều** widget/page left (flow, ELP, stock) |
| 3 | Bao nhiêu Right? | **0** AppShell section-right active; **≥2** page right (com feed, story aside); stock right optional |
| 4 | Cùng renderer/owner? | **Không** — phân mảnh AppShell vs Widget vs Page |
| 5 | Scroll container? | **window / html / body** |
| 6 | Geometry? | §4 measured |
| 7–14 | Mechanism / sync / tall / wrapper / remediation / reuse / regression / test matrix | **Solution phase** — Audit chỉ cung cấp evidence + GAP |

---

## 11. Compatibility / Remediation Findings (không đổi ownership BR)

| ID | Finding | Impact |
| --- | --- | --- |
| F-01 | Flow/ELP tự dựng sidebar trong composite widget | Muốn shared AppShell behavior → cần phân loại: promote host AppShell **hoặc** exclude khỏi “AppShell Sidebar” scope (Owner/SoT) |
| F-02 | Community right dùng `sidebar-right` attr nhưng **không** qua `ensureSections` | Right Sidebar BR không thể “tự nhiên” cover nếu chỉ sửa `applyMarketLayout` |
| F-03 | Stock sticky đã là page scroll-follow khác semantic (top offset header, không 24px bottom trigger) | Cấm nhầm = đã đạt BR; có thể conflict nếu bật AppShell behavior chồng |
| F-04 | Market guest Main ngắn → pain “sidebar biến mất” khó tái hiện | Verify AC cần Main dài (logged-in / published widgets) |
| F-05 | Soft-nav đã clear `ifx-mkt-layout`/`ifx-hub-grid` | Mọi Solution gắn class lên mount root phải tương thích soft-nav |

---

## 12. Audit DoD

* [x] Inventory Left/Right + ownership  
* [x] Scroll context  
* [x] Geometry measured (key routes)  
* [x] Existing sticky/fixed/listeners  
* [x] Bidirectional current-state probes  
* [x] Height matrix (partial noted)  
* [x] Route matrix từ codebase  
* [x] BR Checklist rows mapped  
* [x] **Không** khóa implementation mechanism  

**Next (Governance):** SoT `03` đã LOCKED (gồm Reverse Sync). Audit Amendment `02a` đã map BR mới.  
**Next phase:** Solution — **cấm** Implementation trước Solution + Plan.
