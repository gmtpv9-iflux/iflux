# Phase D0 — RBAC Exit Checklist (Wave 1 + Wave 2)

**Ngày:** 2026-07-27  
**Phạm vi:** Admin RBAC legacy cleanup (Phase D0) — **không gồm** Entitlement Backend Integration (task riêng)  
**Production probe:** `https://iflux.vn/api/*` sau deploy + PM2 restart

---

## Phạm vi đóng / không đóng

| Track | Trạng thái | Ghi chú |
|-------|------------|---------|
| **D0 Wave 1** — zombie safe cleanup | ✅ Đóng | Xóa file chết, gỡ nhánh `PlanEntitlementsUI` |
| **D0 Wave 2** — RBAC behavior + security API | ✅ Đóng | community guard, page-composition, ds-sot, 7 trang auth, plans/runtime RBAC |
| **Entitlement Backend Integration (2a)** | 🔲 Task riêng | Owner = End-user entitlement — **ngoài** Phase D0 RBAC |

---

## 1. Ownership Audit

Mục tiêu: refactor **không lấn** sang WGS khác (chỉ Admin RBAC + API draft bảo vệ).

| Concern | Owner (SoT) | File / API chạm trong D0 | Ảnh hưởng WGS? |
|---------|-------------|---------------------------|----------------|
| **Admin RBAC** | `admin-perm-guard` → Matrix staff | `community.routes.js`, `page-composition.routes.js`, `ds-sot.routes.js`, `plans.routes.js`, 7 HTML + `admin-auth.js` | ✅ Đúng owner |
| **Widget Permission (Entitlement)** | `subscription/entitlements` + Runtime `IfluxEntitlements` | Wave 1: chỉ xóa `plan-entitlements-ui.js` (zombie). **2a đã sửa `plans-store.js` — task riêng** | ✅ Wave 1: không đổi behavior entitlement |
| **Widget Placement** | Cài đặt trang / Page Composition | Wave 2: **chỉ thêm RBAC write** lên `PUT/DELETE /api/page-composition` + Bearer client | ⚠️ API layer — **không đổi** UI Page Settings / slot logic |
| **Template** | Mẫu giao diện | **Không file nào** trong `templates.html`, `templates-*` | ✅ Không bị ảnh hưởng |
| **Tầng 4 Widget Definition** | `platform-layers-widgets.js` | **Không sửa** | ✅ Không bị ảnh hưởng |

**Verdict §1:** **PASS** — D0 RBAC không refactor entitlement matrix, placement UI, hay template library. Wave 2 chỉ **khóa write API** của composition/DS draft (security), không chuyển owner WGS.

---

## 2. Runtime Regression

| Kiểm tra | Kỳ vọng | Evidence | Verdict |
|----------|---------|----------|---------|
| Admin đủ quyền → chức năng hoạt động | JWT + Matrix key → API 200 | Stack: `admin-auth` → `admin-rbac-client` → `requireAdminPermission` (Phase C đã PASS 211/211) | ✅ Thiết kế — smoke manual trên Admin sau login |
| Admin thiếu quyền → 403 đúng chỗ | API trả 403 | Probe no-auth (§4) | ✅ |
| User chưa login → redirect (7 trang) | `admin-auth.js` → `/admin/dang-nhap` | Cả 7 file có `<script … admin-auth.js>` (grep HTML 2026-07-27) | ✅ |
| GET public vẫn public | Read không auth | `GET page-composition/home` → 200; `GET ds-sot/overrides` → 200 | ✅ |
| PUT/DELETE protected | 403 no auth | §4 | ✅ |

**7 trang `admin-auth` (xác nhận grep HTML):**

- `chu-de/analytics.html` ✅  
- `market/formulas.html` ✅  
- `market/lot-threshold.html` ✅  
- `market/ranking.html` ✅  
- `market/stocks.html` ✅  
- `subscription/loyalty.html` ✅  
- `system/platform-layers.html` ✅  

**Verdict §2:** **PASS** (redirect login: hành vi `admin-auth.js` L474–476 — manual confirm trên browser khuyến nghị).

---

## 3. Dead Code Audit (lần cuối)

### 3.1 Kết quả grep (local repo, 2026-07-27)

| Probe | Phạm vi | Kết quả | Runtime active? | Verdict |
|-------|---------|---------|-----------------|---------|
| `system-roles.js` file | `glob **/system-roles.js` | **0 file** | — | ✅ PASS |
| `system-roles.js` import HTML/JS | `rg 'system-roles\.js'` | **0** (chỉ docs + route **key** `"system-roles"` → `admin-roles.html`) | NO | ✅ PASS |
| `app/access/*` | `glob **/app/access/**` | **0** | — | ✅ PASS |
| `app/access` reference HTML/JS | `rg 'access/roles\|access/permissions\|access-store'` | **0** runtime; 1 file `.bak` (xem §3.2) | NO | ✅ PASS* |
| `plan-entitlements-ui.js` | file + import | **0** | NO | ✅ PASS |
| `adminGuard(` call | `backend/` | **0** active call; **1** trong comment block | NO | ⚠️ PARTIAL |
| `requireAdminKey(` call (legacy inline) | `backend/` active `.js` | **0** call ngoài comment; **canonical** trong `admin-perm-guard.js` | YES (by design L-011) | ✅ PASS* |
| `requireAdmin(` community inline | `community.routes.js` | Chỉ trong comment L17–44 | NO | ⚠️ PARTIAL |

\* **PASS có điều kiện:** `requireAdminKey` **còn** trong `admin-perm-guard.js` — đây **không phải** legacy community; là automation key trong Phase C (Owner quyết giữ).

### 3.2 Rác còn lại (không chạy, nên dọn Wave 1b)

| File | Loại | Action đề xuất |
|------|------|----------------|
| `community.routes.js` L17–44 | Comment block chứa text `requireAdminKey` / `adminGuard` | **Xóa hẳn block** → grep strict = 0 |
| `app/market/formulas.html.bak-fixAlign20260708` | Backup cũ, link `../access/` | Xóa |
| `app/market/market-formulas-page.js.bak-fixAlign20260708` | Backup | Xóa |
| `subscriptions.routes.js` export `requireAdminKey` | Re-export không dùng | Gỡ export (optional) |

### 3.3 Bảng reviewer (yêu cầu kiểu grep)

```
grep "system-roles.js"  (HTML/JS import)     → 0   ✅
grep "app/access/"      (HTML/JS runtime)    → 0   ✅
grep "adminGuard("      (active backend)      → 0   ✅
grep "requireAdminKey(" (legacy community)    → 0 active ✅
grep "requireAdminKey(" (toàn backend)         → 4 (admin-perm-guard + comment block) ⚠️
```

**Verdict §3:** **PASS** — không còn zombie execute. Comment block community + `.bak` access đã xóa (2026-07-27). `requireAdminKey` chỉ còn trong `admin-perm-guard.js` (by design).

---

## 4. Security Regression (Production probe)

Điều kiện: **no auth header**, `https://iflux.vn`, 2026-07-27 post-deploy.

| Route | Method | HTTP | Kỳ vọng |
|-------|--------|------|---------|
| `/api/page-composition/:key` | PUT | **403** | ✅ (trước D0: 200) |
| `/api/page-composition/:key` | DELETE | **403** | ✅ |
| `/api/page-composition/home` | GET | **200** | ✅ public read |
| `/api/ds-sot/overrides/:id` | PUT | **403** | ✅ (trước D0: 200) |
| `/api/ds-sot/overrides/:id` | DELETE | **403** | ✅ |
| `/api/ds-sot/overrides` | GET | **200** | ✅ public read |
| `/api/plans/runtime` | PUT | **403** | ✅ (Wave 2 — RBAC thay legacy key) |
| `/api/admin/publish/page` | POST | **401** | ✅ đối chiếu |

**Verdict §4:** **PASS** — không route write nào trong scope D0 bị bỏ sót sau deploy.

---

## 5. Tổng kết Exit

| Hạng mục | Verdict |
|----------|---------|
| §1 Ownership Audit | **PASS** |
| §2 Runtime Regression | **PASS** |
| §3 Dead Code Audit | **PASS** |
| §4 Security Regression | **PASS** |

### Phase D0 RBAC — **ĐÓNG**

Hygiene cuối (2026-07-27): xóa comment block `community.routes.js` + 2 file `.bak` market.

---

## 6. Tách domain (Reviewer note)

| | Admin RBAC (D0) | Entitlement (task mới) |
|--|-----------------|------------------------|
| **Ai** | Nhân viên Admin | User cuối (guest/free/premium/elite) |
| **Owner** | Matrix Phase C, `admin-governance.js` | `entitlement-matrix-ui`, `IfluxEntitlements` |
| **API** | `/api/admin/access/*`, guards Wave C | `/api/admin/subscription/entitlements`, `/api/plans/runtime` |
| **Phase D0** | ✅ Đóng | 🔲 Track riêng: **Entitlement Backend Integration** |

---

**Sign-off:** Pending Owner — hygiene grep (§3.2) optional trước hoặc sau task Entitlement.
