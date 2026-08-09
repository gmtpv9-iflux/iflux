# 04 — Breakpoint Discovery Audit · Phase A

**Date:** 2026-07-27 (rev.3)  
**Status:** **DRAFT — Phase A in progress (per-file registry seeded)**  
**Scope:** `User_Web/` · `Admin_Design_system/` (exclude `_bak/` · `vendor/`)

---

## 1. Methodology

### 1.0 Taxonomy (bắt buộc mọi hàng)

| Type | In inventory? |
|------|----------------|
| Foundation Breakpoint | ✅ |
| Runtime Breakpoint | ✅ |
| Feature Threshold | ✅ |
| Layout Constraint | ❌ **Exclude** |

Chi tiết → [`01-Solution.md`](01-Solution.md) §1.1 · [`02-SoT.md`](02-SoT.md) §0.1

### 1.1 Signals scanned

| Signal | Pattern |
|--------|---------|
| CSS `@media` | `max-width` · `min-width` |
| CSS `@container` | container queries |
| JS viewport | `window.innerWidth <= N` |
| JS constants | `DRAWER_MAX` · `MOBILE_*_MAX` |
| JS `matchMedia` | `(max-width: Npx)` |
| `ResizeObserver` | Appendix only — layout repaint, not breakpoint |

### 1.2 Excluded from this audit (Layout Constraint)

- Component sizing `min-width: 120px` · `240px` · `280px` · `minmax(…)` trong grid item
- Avatar · input · table cell · card min-width
- **Không** đưa vào bảng §3 — không migrate

### 1.3 Vendor / appendix

- Vendor bundles (`tabler-icons`, `tiptap`, …) — note only
- `ResizeObserver` — §8 appendix · **not a breakpoint**

### 1.5 Per-file rule (LOCKED rev.3)

**Cấm gộp theo giá trị số.** Cùng `900px` ở hai file có thể là hai semantic khác nhau.

**Authority:** [`04b-Per-File-Occurrence-Registry.md`](04b-Per-File-Occurrence-Registry.md) — **66 rows** · mỗi occurrence một dòng.

| Column | Phase A | Phase C |
|--------|---------|---------|
| Value | ✅ | ✅ |
| File (+ line) | ✅ | ✅ |
| Semantic | draft · Owner confirm | locked |
| Owner | draft · Owner confirm | locked |
| Consumers | CSS · JS | locked |
| Decision | REVIEW | MAP · KEEP · EXCEPTION |
| Regression scope | — | Phase C fill |

Decision Matrix §7 = **rollup theo semantic** · derive từ 04b tại Phase C — **không** thay thế 04b.

**Authority split (LOCKED):**

| Artifact | Role |
|----------|------|
| **04b** | Discovery · draft semantic · per-file inventory |
| **Phase C Decision Matrix** | **Quyết định** MAP/KEEP/EXCEPTION · source for D4 catalog · Slice migration |
| **09** | Exception registry · populated from Matrix GO rows only |

Agent **cấm** migrate theo semantic draft 04b chưa có Decision GO trên Matrix.

### 1.4 Scan command (reproducible)

```bash
# Responsive-only scan — re-run before Phase A sign-off
python3 scripts/bp-audit.py   # TBD: extract to script in Phase A close
```

Draft scan: 2026-07-27 — agent inline Python over `User_Web` + `Admin_Design_system`.

---

## 2. Executive summary

| Metric | Value |
|--------|-------|
| **Per-file occurrences** (non-Foundation) | **66** → [`04b`](04b-Per-File-Occurrence-Registry.md) |
| Unique px values (non-Foundation) | **11** |
| Semantic groups (distinct) | **~40** |
| `mobile-shell` (`1023.98`) occurrences | **9** CSS+JS bundle · AC-BP-06 |
| `900px` occurrences | **8 files** · **6+ semantics** |
| `ResizeObserver` (non-BP) | **3** files · §9 |

**De-facto mobile/desktop boundary:** `1023.98px` — CSS + JS + `@container` — **highest risk** row in Matrix.

---

## 3. Rollup by px (summary only — detail in 04b)

**Không dùng bảng này để quyết Decision.** Chỉ overview.

| BP | Occurrences (04b) | Distinct semantics (draft) | Type dominant |
|----|-------------------|----------------------------|---------------|
| 480 | 2 | 2 | Feature Threshold |
| 520 | 1 | 1 | Feature Threshold |
| 720 | 5 | 4 | Feature Threshold |
| 767 / 767.98 | 5 | 4 | Feature Threshold |
| **900** | **8** | **6+** | Feature Threshold |
| 960 | 10 | 7 | Feature Threshold |
| **1023.98** | **29** | **~12** (incl. `mobile-shell`) | **Runtime** |
| 1100 | 4 | 4 | Feature Threshold |
| 1199.98 / 1200 | 2 | 2 | Feature Threshold |

→ Full rows: [`04b-Per-File-Occurrence-Registry.md`](04b-Per-File-Occurrence-Registry.md) §3

---

## 4. File detail — `1023.98` (App Shell boundary)

| File | Signals |
|------|---------|
| `User_Web/iflux-web-ui/iflux-web-ui.js` | `DRAWER_MAX` · `innerWidth` · bottom bar |
| `User_Web/iflux-web-ui/runtime/account-feature-boot.js` | `isAccountMobileNav()` |
| `User_Web/iflux-web-ui/app-shell.css` | `@media max-width` |
| `User_Web/iflux-web-ui/profile.css` | AC-NAV-06 mobile |
| `User_Web/iflux-web-ui/profile-chat-page.js` | `MOBILE_CHAT_MAX` |
| `User_Web/iflux-web-ui/iflux-header-messages-ui.js` | mobile bar |
| `User_Web/iflux-web-ui/iflux-user-notifications-ui.js` | mobile bar |
| `User_Web/iflux-web-ui/community.css` | IX bottom surface |
| `User_Web/iflux-web-ui/block-templates.css` | `@media` + `@container` |
| `User_Web/iflux-web-ui/market-components.css` | responsive |
| `User_Web/iflux-web-ui/stock.css` | responsive |
| `User_Web/iflux-web-ui/community-post-page.js` | JS check |
| `User_Web/iflux-web-ui/group-page.js` | JS check |
| `User_Web/iflux-web-ui/iflux-onboarding.js` | JS check |
| `User_Web/iflux-web-ui/stock-page.js` | JS check |

**Semantic:** mobile drawer · bottom navigation · account profile mobile IA · chat list/detail — **không chỉ “responsive layout”**.

---

## 5. File detail — legacy / review breakpoints

### 480px

| File |
|------|
| `User_Web/iflux-web-ui/profile.css` |
| `User_Web/iflux-web-ui/block-templates.css` |

### 520px

| File |
|------|
| `User_Web/iflux-web-ui/alerts.css` |

### 720px

| File |
|------|
| `User_Web/iflux-web-ui/community.css` |
| `User_Web/iflux-web-ui/stock.css` |
| `User_Web/iflux-web-ui/widget-shell.css` |
| `Admin_Design_system/app/dashboard/dashboard.css` |

### 900px

| File |
|------|
| `User_Web/iflux-web-ui/app-shell.css` (`min-width: 900px`) |
| `User_Web/iflux-web-ui/profile.css` |
| `User_Web/iflux-web-ui/flow.css` |
| `User_Web/iflux-web-ui/pricing.css` |
| `Admin_Design_system/iflux-admin-ui/components.css` |
| `Admin_Design_system/app/chu-de/chu-de-admin.css` |
| `Admin_Design_system/ds-sot.css` |

### 960px

| File |
|------|
| `User_Web/iflux-web-ui/profile.css` |
| `User_Web/iflux-web-ui/community.css` |
| `User_Web/iflux-web-ui/hub.css` |
| `User_Web/iflux-web-ui/widget-shell.css` |
| `User_Web/iflux-web-ui/market.css` |
| `User_Web/iflux-web-ui/market-components.css` |
| `Admin_Design_system/ds-sot.css` |
| `Admin_Design_system/design-sandbox.css` |

### 1100px

| File |
|------|
| `User_Web/iflux-web-ui/market.css` |
| `User_Web/iflux-web-ui/stock.css` |
| `User_Web/iflux-web-ui/flow.css` |
| `User_Web/iflux-web-ui/pricing.css` |
| `Admin_Design_system/app/dashboard/dashboard.css` |

---

## 6. Phase B — Classification (draft)

**Trục 1 — Type:** Foundation · Runtime · Feature Threshold  
**Trục 2 — Category:** Foundation-aligned · Legacy · Review · Exception-TBD

| BP | Type | Category (draft) | Semantic Owner |
|----|------|------------------|----------------|
| 375 … 1600 (token) | Foundation | Foundation-aligned | DS Foundation |
| 1023.98 | **Runtime** | Review → MAP? | App Shell · Mobile Shell |
| 767 · 767.98 | Feature Threshold | Legacy | Admin Spacing · Watchlist |
| 480 · 520 | Feature Threshold | Legacy | Profile · Alert Form |
| 720 · 960 · 1100 | Feature Threshold | Legacy | per §3 · §5 |
| 900 | Feature Threshold | **Review** | **split §3.1** |
| 1199.98 · 1200 | Feature Threshold | Legacy | Admin Components |

---

## 7. Phase C — Decision Matrix (Owner fills)

**Source:** rollup từ [`04b`](04b-Per-File-Occurrence-Registry.md) — **một semantic có thể nhiều file · một Decision cho semantic** (hoặc per-file nếu Owner yêu cầu).

**Columns:** Existing (px) · Semantic · Decision · Result · Regression scope

**Decision enum:** `MAP` · `NO MAPPING · KEEP` · `EXCEPTION` · `REVIEW`

*(Example rows — replace after 04b Owner review)*

---

## 8. Appendix — ResizeObserver (not breakpoints)

| File | Purpose |
|------|---------|
| `User_Web/iflux-web-ui/market-heatmap.js` | Chart canvas resize |
| `User_Web/iflux-web-ui/community-trending.js` | Trend paint |
| `Admin_Design_system/app/system/templates-preview.js` | Preview canvas |

---

## 9. Appendix — Viewport Preview Registry (QA only)

| id | width | Note |
|----|-------|------|
| mobile | 375 | ≠ task migration target |
| tablet | 768 | overlaps bp-md |
| laptop | 1280 | overlaps bp-xl |
| desktop | 1440 | overlaps bp-2xl |

Regression Phase F uses **7 Foundation widths**, not Preview Registry count.

---

## 10. Phase A gate checklist

- [x] Per-file registry seeded — [`04b`](04b-Per-File-Occurrence-Registry.md) 66 rows
- [ ] Owner confirms Semantic + Owner (no TBD)
- [ ] Consumers verified per row
- [ ] Semantic Completeness Gate ready for Phase C → E
- [ ] Owner reviewed inventory completeness
- [ ] Classification draft approved (Phase B)
- [ ] Decision Matrix rows filled (Phase C)
- [ ] **Phase A PASS** signed in [`08-Owner-Signoff.md`](08-Owner-Signoff.md)

---

*Audit rev.3 — per-file authority: 04b.*
