# Phase D0 — Legacy Ownership Audit (Admin RBAC)

**Ngày:** 2026-07-27  
**Phạm vi:** Local repo `/Users/mac/Documents/Productions/iFLUX_P1` + **runtime probe** `https://iflux.vn/api/*`  
**Mục tiêu:** Chứng minh từng phát hiện legacy sau tái cấu trúc RBAC — **không sửa code** trong phase này.

---

## Phương pháp

| Bước | Công cụ |
|------|---------|
| Route / middleware chain | Đọc `backend/src/app.js` + router từng module |
| Reverse proxy | `infra/nginx-iflux-production-locations.conf` L6–13 |
| HTML script graph | `rg admin-auth.js / admin-view-gate.js` trên `Admin_Design_system/app/**/*.html` |
| Reference zombie | `rg system-roles` toàn repo |
| **Runtime (Production)** | `curl` không auth / sai key / dev key — probe key tạm đã **DELETE** sau test |

---

## Bảng tổng hợp

| ID | Issue | Runtime Active | Security | Remove Safe | Confidence |
|----|-------|----------------|----------|-------------|------------|
| L-001 | `community.routes.js` legacy `requireAdminKey` / `requireAdmin` / `adminGuard` | YES | MEDIUM | NO — Wave 2 | **High** |
| L-002 | `system-roles.js` zombie (395 dòng) | NO | NONE | YES — Wave 1 | **High** |
| L-003 | `app/access/*` xóa local, chưa commit | NO | NONE | YES — Wave 1 | **High** |
| L-004 | `page-composition` PUT/DELETE không auth | YES | **HIGH** | NO — Wave 2/3 | **High** |
| L-005 | `ds-sot` PUT/DELETE không auth | YES | **HIGH** | NO — Wave 2/3 | **High** |
| L-006 | `admin-view-gate.js` fail-open (toast, không chặn render) | YES | LOW | KEEP — Wave 2 behavior | **High** |
| L-007 | 7 trang có `admin-view-gate` **không** có `admin-auth.js` | YES | LOW–MEDIUM | NO — Wave 2 | **High** |
| L-008 | 27 trang `app/**/*.html` thiếu `admin-auth.js` (gồm redirect) | PARTIAL | LOW–MEDIUM | VERIFY từng trang | **High** |
| L-009 | Client fallback `X-Admin-Key: iflux-admin-local-dev` | YES (gửi) | **LOW trên Prod** | Wave 3 | **High** |
| L-010 | `canPerm()` copy ~19 file JS | YES | NONE | Wave 1–2 | **High** |
| L-011 | `admin-perm-guard` — X-Admin-Key hợp lệ = super (by design) | YES | MEDIUM | KEEP design | **High** |
| L-012 | `plans.routes.js` PUT `/runtime` — legacy key-only (không RBAC matrix) | YES | MEDIUM | Wave 2 | **High** |
| L-013 | `page-composition-client.js` PUT không gửi Authorization | YES | HIGH (kết hợp L-004) | Wave 2 | **High** |

---

## Runtime probe log (Production — 2026-07-27)

Base URL: `https://iflux.vn/api`  
Nginx: `location /api/` → `proxy_pass http://127.0.0.1:3001/api/` (không thêm auth).

### L-004 — page-composition

```bash
# GET — no auth
curl -sS -w "\nHTTP %{http_code}\n" "https://iflux.vn/api/page-composition/home"
# → HTTP 200, body có pageKey + manifest

# PUT — no auth (probe key d0-audit-probe)
curl -sS -X PUT .../page-composition/d0-audit-probe \
  -d '{"manifest":{"pageKey":"d0-audit-probe","widgets":[],"sections":[]}}'
# → HTTP 200 {"ok":true,"pageKey":"d0-audit-probe",...}

# DELETE — no auth
curl -sS -X DELETE .../page-composition/d0-audit-probe
# → HTTP 200 {"ok":true,...}
```

**Kết luận:** Không middleware auth ở app-level, router-level, hay nginx. **Anonymous write được xác nhận runtime.**

### L-005 — ds-sot

```bash
# GET overrides — no auth → HTTP 200 (trả items thật)
# PUT overrides/d0-audit-probe — no auth → HTTP 200
# DELETE overrides/d0-audit-probe — no auth → HTTP 200
```

**Kết luận:** Tương tự L-004 — **anonymous write xác nhận runtime.**

### L-009 — Client dev key vs server

```bash
# RBAC route
curl -H "X-Admin-Key: iflux-admin-local-dev" \
  "https://iflux.vn/api/community/admin/categories"
# → HTTP 403 {"error":"Admin key required"}

# Legacy adminGuard route
curl -X POST -H "X-Admin-Key: iflux-admin-local-dev" \
  .../api/community/chu-de -d '{"name":"probe"}'
# → HTTP 403 {"error":"Admin key required"}

# Wrong key
curl -H "X-Admin-Key: wrong-key" .../community/admin/categories
# → HTTP 403
```

**Kết luận Production:** Server **không** chấp nhận default dev key. Client fallback **không bypass RBAC trên Production hiện tại** — nhưng vẫn gửi header sai → API fail / UX lỗi. Trên môi trường `ADMIN_API_KEY=iflux-admin-local-dev` (default `.env.example`) → bypass super qua L-011.

### Routes được bảo vệ (đối chiếu)

```bash
POST /api/admin/publish/page — no auth → HTTP 401 Unauthorized
GET  /api/admin/market-config/formulas — no auth → HTTP 403 Admin key required
PUT  /api/plans/runtime — no auth → HTTP 403 Forbidden
PUT  /api/plans/runtime + dev key → HTTP 403 Forbidden
```

---

## Chi tiết từng issue

---

### L-001 — Legacy guard trong `community.routes.js`

**Issue:** Hai chuẩn authorization cùng tồn tại: `requireAdminPermission` (Wave C) và inline `requireAdminKey` / `requireAdmin` / `adminGuard`.

**Evidence**

| Loại | Chi tiết |
|------|----------|
| File | `backend/src/modules/community/community.routes.js` |
| Line | L17–41 (định nghĩa), L64 (`adminGuard` instance), L568–571 (sử dụng) |
| Runtime path | `POST /api/community/chu-de` |
| Ai gọi | Admin UI tạo chủ đề nhanh; fallback khi không có user Bearer |

```17:41:backend/src/modules/community/community.routes.js
function requireAdminKey(config) { ... }
function requireAdmin(deps) { ... adminGuard ... }
```

```555:571:backend/src/modules/community/community.routes.js
router.post('/chu-de', async (req, res, next) => {
  ...
  return adminGuard(req, res, function (err) {
    if (err) return next(err);
    run().catch(next);
  });
});
```

Các route `/admin/*` khác dùng `perm('community.*')` → `requireAdminPermission` (L299+).

**Mount chain**

```
app.js L64 → LEGACY_API_PREFIX/community → createCommunityRouter({ auth: userAndAdminAuth, config })
```

Không có middleware global trước router.

**Impact**

| | |
|--|--|
| Security | MEDIUM — `adminGuard` = JWT **hoặc** X-Admin-Key hợp lệ, **không** check permission matrix |
| Runtime | YES — 1 route active |
| Dead code | NO — đang dùng |
| UX | — |
| Maintainability | HIGH drift risk |

**Action:** Wave 2 — merge `POST /chu-de` sang `requireAdminPermission(...)` hoặc JWT user-only; comment block L17–41 sau migrate.

**Confidence:** High

---

### L-002 — `system-roles.js` zombie

**Issue:** File UI RBAC cũ còn trên disk, không được HTML load.

**Evidence**

| Loại | Chi tiết |
|------|----------|
| File | `Admin_Design_system/app/system/system-roles.js` (395 dòng) |
| Reference HTML | **0** — `rg 'system-roles\.js'` → không match |
| Route map | `iflux-admin-routes.js` key `"system-roles"` → `system/admin-roles.html` (trang mới) |
| Thay thế | `admin-governance.js` trên `admin-roles.html`, `admin-list.html`, … |
| Git | `M Admin_Design_system/app/system/system-roles.js` (modified, orphaned) |

**Impact:** Dead code / Maintainability only.

**Action:** Wave 1 — xóa hoặc comment toàn file (rule Owner).

**Confidence:** High

---

### L-003 — `app/access/` deleted, uncommitted

**Evidence**

```
git status:
 D Admin_Design_system/app/access/access-store.js
 D Admin_Design_system/app/access/permissions.html
 D Admin_Design_system/app/access/roles.html
```

Thư mục local trống. Production web root không còn serve (đã xóa trước đó).

**Action:** Wave 1 — commit deletion.

**Confidence:** High

---

### L-004 — `page-composition` open write

**Issue:** PUT/DELETE ghi file JSON composition không qua auth.

**Evidence — khai báo route**

| | |
|--|--|
| Mount | `app.js` L95–96 → `/api/page-composition` |
| Router | `page-composition.routes.js` L83–120 |
| Middleware | **Không** — handler async trực tiếp |
| Write target | Production: `/var/www/iflux/production/Admin_Design_system/data/page-composition.json` |

```83:105:backend/src/modules/page-composition/page-composition.routes.js
router.put('/:pageKey', async (req, res, next) => {
  ...
  await writeStore(filePath, data);
  res.json({ ok: true, pageKey: pageKey, updatedAt: data.updatedAt });
});
```

**App-level auth:** Không (`createPageCompositionRouter({ config })` — không truyền `auth`).

**Nginx:** Chỉ proxy — không auth (`infra/nginx-iflux-production-locations.conf` L6–13).

**Ai gọi**

- `Admin_Design_system/app/system/page-composition-client.js` — `saveDraft()` PUT
- User Web **không** dùng endpoint này làm SoT runtime (`bootstrap.js` comment: không fallback page-composition)

**So sánh:** Publish thật → `POST /api/admin/publish/page` có `requireJwtPermission` → runtime 401 khi không JWT.

**Impact:** Security **HIGH** — anonymous write file trên origin.

**Action:** Wave 2/3 — gắn `requireAdminPermission` cho PUT/DELETE; giữ GET public nếu cần.

**Confidence:** High (code + runtime)

---

### L-005 — `ds-sot` open write

**Issue:** PUT/DELETE overrides Design System không auth.

**Evidence**

| | |
|--|--|
| Mount | `app.js` L92–93 → `/api/ds-sot` |
| PUT | `ds-sot.routes.js` L51–81 `router.put('/overrides/:itemId', ...)` |
| DELETE | L83–93 `router.delete('/overrides/:itemId', ...)` |
| Write target | `.../Admin_Design_system/data/ds-sot-overrides.json` |

**Ai gọi:** `ds-sot-*-studio.js`, `ds-sot-studio.js` — `fetch PUT /api/ds-sot/overrides/:id`

**Runtime:** PUT/DELETE no auth → HTTP 200 (probe đã cleanup).

**Action:** Wave 2/3 — RBAC write; GET có thể public read-only.

**Confidence:** High

---

### L-006 — `admin-view-gate.js` fail-open

**Evidence**

```33:44:Admin_Design_system/iflux-admin-ui/admin-view-gate.js
 * GET path — 403 thì toast + không chặn render tĩnh.
...
if (res.status === 403) {
  global.ixToast('Bạn không có quyền xem trang này', 'warning');
  return null;
}
```

20 trang load script này (`rg -l admin-view-gate.js`).

**Impact:** UX / defense-in-depth LOW — server API vẫn enforce; HTML tĩnh vẫn hiện.

**Action:** KEEP short-term; Wave 2 — redirect/block render khi 403.

**Confidence:** High

---

### L-007 — View-gate without admin-auth (đã hiệu chỉnh từ báo cáo trước)

**Issue trước:** "18 trang chỉ có view-gate" — **SAI**.

**Evidence layout chung:** `iflux-admin-app-shell.js` **không** inject `admin-auth.js` (`rg admin-auth` trong file → 0). `admin-auth.js` tự `requireAuth()` khi load (L474–476) — chỉ chạy nếu script được include trong HTML.

**7 trang** có `admin-view-gate.js` **và không** có `admin-auth.js`:

| Trang |
|-------|
| `chu-de/analytics.html` |
| `market/formulas.html` |
| `market/lot-threshold.html` |
| `market/ranking.html` |
| `market/stocks.html` |
| `subscription/loyalty.html` |
| `system/platform-layers.html` |

Ví dụ `market/formulas.html` L79–88: shell + `market-formulas-page.js` + `admin-view-gate.js` — **không** `admin-auth.js`, **không** `admin-rbac-client.js`.

Hệ quả: không redirect login; `IfluxAdminRbac` không bootstrap (`admin-auth.js` L258–265 `loadRbacClient()` không chạy); menu shell fail-closed ẩn hết (`iflux-admin-app-shell.js` L27–28).

**Action:** Wave 2 — thêm `admin-auth.js` (chuẩn 78 trang còn lại).

**Confidence:** High

---

### L-008 — 27 trang thiếu `admin-auth.js`

**Stats:** 105 HTML trong `app/` · 78 có `admin-auth` · 27 không.

**Redirect stub (auth không bắt buộc):** `system/roles.html`, `system/admin-users.html`, `subscription/transactions.html`, `subscription/membership-intro.html` — chỉ `meta refresh`.

**Trang thật thiếu auth (22):** analytics/* (5), chu-de/* (3), community/experts|stories, market-ops/feed-health, market/ecosystems/detail + 4 market wave, marketing/onboarding, metadata/story-lifecycle, subscription/loyalty, system/platform-layers|onboarding|widget-library, users/export.

**Action:** Needs manual review từng trang (DEAD vs active).

**Confidence:** High (grep); impact per-page Medium

---

### L-009 — Client `iflux-admin-local-dev` fallback

**Evidence client**

```25:30:Admin_Design_system/iflux-admin-ui/admin-view-gate.js
if (token) h.Authorization = 'Bearer ' + token;
else h['X-Admin-Key'] = 'iflux-admin-local-dev';
```

**27 file JS** chứa string này (`rg iflux-admin-local-dev`).

**Evidence server default**

```32:33:backend/src/config/index.js
ADMIN_API_KEY: z.string().default('iflux-admin-local-dev'),
```

**Runtime Production:** dev key → **403** (xem probe log). Production dùng `ADMIN_API_KEY` khác default.

**Impact**

| Môi trường | |
|------------|--|
| Production | LOW — bypass **không** xảy ra với dev key |
| Local / staging default | **HIGH** — key khớp default → super admin (L-011) |

**Action:** Wave 3 — gỡ fallback client; chỉ Bearer JWT.

**Confidence:** High

---

### L-010 — Permission logic copy (`canPerm`)

**Evidence:** 19 file định nghĩa `function canPerm(` riêng + `admin-wave-c/d/e-pages.js`.

Không ảnh hưởng hiệu năng; drift khi đổi Matrix key.

**Action:** Wave 1–2 — gom qua `IfluxAdminRbac.hasPermission`.

**Confidence:** High

---

### L-011 — X-Admin-Key system super (by design)

**Evidence**

```7:23:backend/src/modules/admin-rbac/admin-perm-guard.js
 * X-Admin-Key = automation nội bộ (tương đương super) — không dùng cho Admin Web UI.
...
if (!req.admin) req.admin = { email: 'system@admin-key', isSuper: true };
```

Đây **không phải** legacy thừa — là thiết kế Phase C. Rủi ro = lộ `ADMIN_API_KEY` Production.

**Action:** KEEP — Wave 3 rotate key / IP allowlist nếu Owner yêu cầu.

**Confidence:** High

---

### L-012 — `plans.routes.js` legacy key guard

**Evidence**

```40:44:backend/src/modules/plans/plans.routes.js
router.put('/runtime', (req, res) => {
  const adminKey = req.get('x-admin-key') || req.get('x-iflux-admin-key');
  if (config.APP_ENV !== 'local' && adminKey !== config.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Forbidden' });
```

Parallel với Wave E RBAC (`/api/admin/subscription/...`) — không dùng permission matrix.

**Runtime:** no auth / dev key → 403 Production.

**Action:** Wave 2 — migrate sang `requireAdminPermission` hoặc deprecate route.

**Confidence:** High

---

### L-013 — `page-composition-client.js` không gửi auth header

**Evidence**

```35:38:Admin_Design_system/app/system/page-composition-client.js
return fetch(endpoint(pageKey), {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ manifest: manifest })
});
```

Kết hợp L-004: Admin UI hiện **cũng** không gửi JWT khi save draft — phù hợp với API mở.

Trang gọi: `layout-manager.html`, `page-settings.html` (có `admin-auth.js`).

**Action:** Wave 2 — thêm Bearer + server RBAC.

**Confidence:** High

---

## Điều chỉnh so với báo cáo sơ bộ

| Phát hiện cũ | Sau D0 |
|--------------|--------|
| "18 trang chỉ view-gate" | **7 trang** (view-gate ∧ ¬admin-auth) |
| "admin-auth từ layout chung" | **Không** — shell không inject; mỗi HTML phải include |
| "Dev key bypass RBAC Production" | **Không** — runtime 403; chỉ rủi ro local/default env |
| "page-composition ai PUT được" | **Xác nhận runtime** HTTP 200 anonymous PUT/DELETE |
| "mountain code chạy song song" | Giữ — không có 2 UI RBAC cùng load; có **guard inline** + **2 router file-backed mở** |

---

## Đề xuất wave cleanup (chưa thực hiện)

### Wave 1 — Safe (no behavior change)

- L-002 xóa `system-roles.js`
- L-003 commit xóa `app/access/*`
- L-010 gom helper (optional, nếu không đổi logic)

### Wave 2 — Behavior

- L-001 migrate `POST /chu-de`
- L-004, L-005, L-013 RBAC write + client headers
- L-006, L-007, L-008 auth bootstrap thống nhất
- L-012 plans route

### Wave 3 — Security

- L-009 gỡ client dev key fallback
- L-011 key rotation / automation policy

---

## Sign-off checklist Reviewer

- [x] Route khai báo + line number
- [x] Middleware chain (app + router + nginx)
- [x] Runtime curl Production (page-composition, ds-sot, admin key, publish对比)
- [x] Layout không inject admin-auth — grep + đọc shell
- [x] Zombie reference graph (system-roles, access/)
- [ ] Owner approve trước Wave 1+

**Không có thay đổi code trong Phase D0.**
