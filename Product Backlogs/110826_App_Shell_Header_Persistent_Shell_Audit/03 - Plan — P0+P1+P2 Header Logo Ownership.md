# Plan — P0 + P1 + P2 Header Logo Ownership

**Owner LOCK:** đã chốt theo `02 - Reviewer Response` — P0 YES, P1 YES (mở lại Owner lock cũ), P2 YES, P3 YES (1 wave, sequencing P0→P1→P2→Verify).
**Trạng thái:** AUTHORIZED — implementation ngay.

---

## Impact Analysis

| Feature | Owner hiện tại | Files | Decision |
|---|---|---|---|
| Header brand/logo markup (8 entry point) | Từng file HTML tự quản (drift) | 7 file `User_Web/**` (git-tracked) + 1 orphan `profile.html` (production, không track git) | **Modify** — đổi `<div><svg>+<span>` → `<img data-ifx-seo-logo>` |
| Logo bind lifecycle | `bootstrap.js#start()` | `User_Web/iflux-web-ui/runtime/bootstrap.js` | **Modify** — bỏ gate `bindLogo:!soft`, mở lại Owner lock cũ |
| `logoUrl` cascade | `site-seo-resolver.js#resolveField` | `backend/src/modules/site-seo/site-seo-resolver.js` | **Modify** — thêm `logoUrl` vào exclusion GLOBAL-only (giống `faviconUrl`) |
| `logoUrl` PUT page-level | `site-seo.routes.js` | `backend/src/modules/site-seo/site-seo.routes.js` | **Modify** — strip `patch.logoUrl` trước khi lưu (giống `patch.faviconUrl`) |

Không tạo file/API/helper mới — toàn bộ là sửa đúng chỗ đang có, theo pattern đã tồn tại cho favicon.

---

## P0 — Migrate 8 legacy entry point

Đổi:
```html
<div class="ix-brand-logo"><svg width="18" height="18" viewBox="0 0 32 22" fill="white">...</svg></div>
<span class="ifx-topnav-name">iFlux</span>
```
→
```html
<img class="ix-brand-logo" data-ifx-seo-logo alt="iFlux" width="120" height="32" hidden />
```

Áp dụng đúng 8 điểm (khớp canonical đã dùng ở 13 file còn lại):

1. `User_Web/stock/index.html`
2. `User_Web/stocks/index.html`
3. `User_Web/sector/index.html`
4. `User_Web/sectors/index.html`
5. `User_Web/ecosystems/index.html`
6. `User_Web/family/index.html`
7. `User_Web/community/post.html`
8. `profile.html` (production root, **không có trong local repo/git** — orphan file, CSS relative path đã gãy (`../../Admin_Design_system` từ root sẽ 404), không phải route thật (`/tai-khoan` đã trỏ đúng `User_Web/account/profile.html` — file này ĐÃ đúng từ trước). Vẫn sửa theo yêu cầu Owner, ghi nhận là cosmetic/dead-file fix, patch trực tiếp qua SSH trên production (không có bản local để rsync).

---

## P1 — Bỏ gate `bindLogo: !soft`

File: `User_Web/iflux-web-ui/runtime/bootstrap.js`

- Dòng `resolveManifest(pageKey, { seo: { bindLogo: !soft } })` → bỏ tham số, dùng default `bindLogo=true` luôn (không phân biệt hard/soft).
- Cập nhật 2 comment liên quan (dòng ~274, ~339) để phản ánh quyết định mới: **Owner-approved reopen** — lý do là logo freshness giữa session dài, không phải bugfix.

---

## P2 — `logoUrl` GLOBAL-only (contract)

File: `backend/src/modules/site-seo/site-seo-resolver.js`
- `resolveField()`: đổi điều kiện loại trừ PAGE-layer từ `key !== 'faviconUrl'` → `key !== 'faviconUrl' && key !== 'logoUrl'`.

File: `backend/src/modules/site-seo/site-seo.routes.js`
- `PUT /pages/:pageKey`: thêm `delete patch.logoUrl;` cạnh `delete patch.faviconUrl; delete patch.faviconAssetId;` hiện có.

---

## P3 — Verification (bắt buộc trước khi coi Done)

1. Hard-load riêng lẻ 21 route (8 vừa sửa + 13 đã đúng) → tất cả cùng 1 `logo_url` từ Global SEO.
2. Soft-nav xuất phát từ **mỗi 1 trong 8 entry cũ** → `/cong-dong` (và ngược lại) → logo đúng suốt, không "kẹt" SVG cũ.
3. Đổi `logo_url` ở Admin SEO hệ thống trong lúc 1 tab đang mở session (không reload) → soft-nav kế tiếp phải thấy logo mới.
4. Không có flicker khi soft-nav liên tục (set lại cùng giá trị không gây tải lại ảnh / không toggle hidden giữa chừng).
5. `PUT /site-seo/pages/:pageKey` gửi kèm `logoUrl` → xác nhận field bị strip, không ảnh hưởng effective logo của trang đó.

**Không đụng:** orphan duplicate (`home/home/`, `stocks/stocks/`, `stock/stock/`, `flow/flow/`, `community/community/`), `syncBrandHref()/renderNav()` duplicate write, refactor Persistent Shell — đúng theo chốt Owner.
