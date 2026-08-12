# 28 — L7 Execution: Production Regression & Acceptance

**Layer:** L7 — tầng cuối (theo `20 - Master Verification Specification.md` §41).
**Gate trước:** L6 = ✅ PASS (`27`).

---

## L7-TC-01 — Full smoke (toàn bộ critical surface)

`curl` HTTP status trên Production cho toàn bộ surface liệt kê ở spec §41:

| Surface | URL | HTTP |
|---|---|---|
| Home | `/nha-cua-toi` | 200 |
| Market | `/thi-truong` | 200 |
| Money Flow | `/dong-tien` | 200 |
| Community | `/cong-dong` | 200 |
| Membership | `/thanh-vien` | 200 |
| FAQ | `/hoi-dap` | 200 |
| Article | `/cong-dong/bai-viet/{slug}` | 200 |
| Stock | `/co-phieu/HPG` | 200 |
| Sector | `/nganh` | 200 |
| Ecosystem | `/he-sinh-thai` | 200 |
| Story | `/cau-chuyen` | 200 |
| Search/Listing | `/tim-kiem` | 200 |
| Account | `/tai-khoan` | 200 |
| Checkout | `/tai-khoan/billing`, `/User_Web/account/checkout.html` | 200 (path đúng — `/thanh-toan` không phải route thật, không phải bug) |
| Write | `/cong-dong/viet-bai` | 200 |
| Comments | `/binh-luan` | 200 |
| Share | `/chia-se` | 200 |
| Admin | `/Admin_Design_system/app/dashboard/index.html` → 301 → `/admin/tong-quan` → 200 | OK (redirect canonical, không phải broken link) |

**Author/Tag/Collection:** đã verify ở L3-D (9 Entity surface PASS, bao gồm `com-author`, `com-cat`) — không lặp lại test.

**Verdict: PASS.** Không có surface nào lỗi (404/500) ngoài dự kiến.

---

## L7-TC-02 — Cross-feature regression

Verify chuỗi `Admin change → DB → Resolver → Runtime → HTML → SEO → Sitemap/public surface` bằng **chính 2 fix đã thực hiện trong L5** (bằng chứng end-to-end thật, không phải giả định):

**Chuỗi 1 — canonical_path (backend field mới → client → DOM):**
```text
site-seo.service.js (getPublicEffective)  → thêm canonical_path
      ↓ deploy + pm2 restart
/api/seo/effective?pageKey=community      → trả canonical_path: "/cong-dong"  (verify curl)
      ↓
bootstrap.js (enrichManifestWithSiteSeo)   → set seo.canonical/og:url
      ↓
DOM (Chrome thật)                          → <link rel="canonical" href="https://iflux.vn/cong-dong">  (verify Playwright)
```
Toàn chuỗi đã verify bằng evidence thật ở `26` (L5-TC-12) — PASS.

**Chuỗi 2 — BR-19/20 Content Quality Gate (Admin input → validation → block/warning):**
Đã verify ở L3 (`24`) — nhập title/description không hợp lệ ở Admin → `runContentQualityGate()` → block (HTML/invalid char) hoặc warning (length/duplicate) → response `seoWarnings` — chuỗi Admin→DB→Resolver hoạt động đúng.

**Verdict: PASS** (2 chuỗi thật đã chứng minh cơ chế end-to-end hoạt động đúng hướng).

---

## L7-TC-03 — Production regression sau deployment

Checklist sau mỗi lần deploy trong epic này (đã thực hiện lặp lại qua nhiều fix — P0 Zalo/OG image, BR-19/20, canonical/og:url, X-Robots-Tag):

```text
1. Smoke              → L7-TC-01 PASS
2. Critical API       → /api/seo/effective, /api/community/posts, /sitemap.xml đều 200 (đã verify L5)
3. Critical HTML       → title/canonical/OG/Twitter/structured-data đều đúng (L5)
4. SEO                 → L5 Exit Gate PASS
5. Authentication      → /tai-khoan yêu cầu login đúng (verify L4-TC-02), không bị vô tình mở public
6. Navigation          → soft-nav PASS (L4-TC-03), không lỗi console
7. Performance sanity  → TTFB ~0.17-0.2s, không phát hiện regression (L6-TC-01)
```

**Verdict: PASS.**

---

## L7-TC-04 — No regression from legacy migration + Compatibility (BR-46)

### Legacy residue

Đã thực hiện **P0 cleanup toàn diện** trong epic này (trước khi vào L4/L5/L6/L7):
- Xóa `_quarantine_zombie_20260724183745/` (zombie snapshot công khai truy cập được)
- Xóa 9 file loose ở web root (`profile.html`, `post.html`, `boot.js`, `iflux-api-bundle.js`, `community-post-page.js`, `account-feature-boot.js`, `profile-security-page.js`, `community-post.manifest.js`, `robots.txt.bak-static-20260809`)
- Xóa backend orphan (`backend/backend/`, `app.js` cũ, `payouts.service.js`/`payouts.routes.js` trùng)
- Archive 89 file `.bak.*` nginx snippets + 2 config file orphan không được include

→ Verify lại: tất cả path cũ trả **404**, không còn public expose code/HTML cũ.

Header/Shell legacy đã migrate ở đầu epic (8 HTML → canonical `<img data-ifx-seo-logo>`, xóa `syncBrandHref()` song song) — không phát hiện regression mới ở L4 (chỉ 1 lần bootstrap/header load).

Sidebar Ownership (VR-04, Foundation task riêng `100826_...`) đã đóng toàn bộ wave — không còn structure song song App Shell cho sidebar (theo Owner xác nhận trước đó).

**Không phát hiện:** old hardcoded metadata mới, old API call mới, old JS/HTML owner cạnh tranh mới trong phạm vi thay đổi của epic này.

### Compatibility check (không phá các capability khác)

| Capability | Kiểm tra | Kết quả |
|---|---|---|
| Public Identity resolution | `/IFLxxxxx/...` resolve đúng path gốc (nginx rewrite) | ✅ (L5-TC-10) |
| Affiliate Referral/attribution capture | Cookie + localStorage `iflux_ref_code` set đúng khi vào link `publicId`/`?ref=` | ✅ (L5-TC-10, verify Chrome thật) |
| Clean Canonical URL policy | Canonical luôn Clean Public URL, không publicId/ref/tracking param | ✅ (L5-TC-03/10/12) |
| Community Article architecture | Article detail vẫn dùng canonical riêng qua `IfluxSeoUrl.setCanonical` — **không bị fix generic ghi đè** (guard `if (!seo.canonical)`) | ✅ verify lại sau deploy (L5-TC-12) |
| Entity Registry | Không đổi entity resolver/template — chỉ thêm field mới, không sửa logic entity | ✅ (không chạm code entity) |
| RBAC | Không đổi permission/route Admin | ✅ (không chạm code RBAC) |
| Design System | Không thêm CSS/class/token mới — fix chỉ JS logic (bootstrap.js) + backend field + nginx header, không có CSS/markup mới | ✅ |
| Existing routing | Không đổi regex routing/location match — chỉ thêm `add_header` vào block đã có, không đổi `rewrite`/`location` pattern | ✅ (verify `nginx -t` PASS + response code không đổi) |
| Existing product architecture | Không tạo abstraction/manager/lifecycle mới — chỉ nối field có sẵn (`PAGE_KEY_TO_PATH`, `IfluxNormalizePath`) vào chỗ đã có (`page-definition.js` `applySeo`) | ✅ (đúng nguyên tắc Modify-First) |

**Verdict: PASS.** Không phát hiện compatibility break.

---

## L7 Exit Gate

```text
L7-TC-01 Full smoke                  PASS
L7-TC-02 Cross-feature regression    PASS
L7-TC-03 Production regression       PASS
L7-TC-04 Legacy residue + Compat     PASS
```

**L7 Exit Gate: ✅ PASS.**

---

# Final Acceptance Gate

```text
L0 PASS
L1 PASS  (L1-TC-06 Sidebar Ownership → RESOLVED sau khi Foundation task đóng — xem 22)
L2 PASS  (L2-TC-09 Traceability PARTIAL non-blocking; L2-TC-10 Versioning OUT OF SCOPE Owner-locked — xem 23)
L3 PASS  (4 gap Owner đã chốt: Favicon defer, Health/CMS defer, Tên site P1 non-blocking, Title/Desc validation FIXED — xem 24)
L4 PASS  (xem 25)
L5 PASS  (2 gap phát hiện + fix trong layer này: canonical/og:url human-DOM, X-Robots-Tag private surface — xem 26)
L6 PASS  (xem 27)
L7 PASS  (trên)
─────────────────────────
RELEASE ACCEPTED
```
