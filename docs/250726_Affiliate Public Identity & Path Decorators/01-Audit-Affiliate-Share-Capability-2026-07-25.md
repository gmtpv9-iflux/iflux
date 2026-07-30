# Audit — Affiliate / Share Capability

| Trường | Giá trị |
|--------|---------|
| **Ngày audit** | 2026-07-25 (UTC `2026-07-25T10:34:45Z`) |
| **Phạm vi** | Logic + hiện trạng Production (`https://iflux.vn`) |
| **Không gồm** | Attribution hoa hồng, conversion tracking, thay đổi Product Architecture V2 |
| **Plan nguồn** | [`06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md`](06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md) |
| **Governance** | [`docs/SoT — Engineering Change Governance.md`](./SoT%20%E2%80%94%20Engineering%20Change%20Governance.md) |
| **Product SoT** | [`docs/SoT — iFlux Product Architecture (V2).md`](./SoT%20%E2%80%94%20iFlux%20Product%20Architecture%20(V2).md) |
| **Permission** | [`docs/SoT — Interaction Permission (IP-001).md`](./SoT%20%E2%80%94%20Interaction%20Permission%20(IP-001).md) — Guest `share_url` = Allow |
| **Backup pre-change** | `_bak/share-affiliate-20260725-153345/` |
| **Fingerprint deploy** | `?v=shareAff20260725` |

---

## 0. Tóm tắt điều hành (Owner)

### Mục tiêu sản phẩm đã khóa

`?ref=` là **decorator của Share Capability** (Share Foundation), không phải feature của Widget hay Community.

- **Outgoing:** link do hệ thống tạo khi user chia sẻ = URL entity sạch + `?ref=` = `referral_code` của **user đang đăng nhập**.
- **Incoming:** bắt `?ref=` → cookie / localStorage (Loyalty) — **không** dùng cookie để tạo link share đi.
- **SEO / Article Metadata:** canonical / `og:url` **không** chứa `ref`.

### Verdict hiện trạng (sau bằng chứng §8)

| Hạng mục | Kết luận |
|----------|----------|
| Kiến trúc ownership | **Đúng hướng** — Foundation = URL; Loyalty = mã + capture |
| Community `share_url` code path | **Đã gọi** `buildShareUrl` (CDN catalog `shareAff20260725`) |
| Guest share | **URL sạch**, không bịa `DEMO` |
| Login + có `referral_code` | Foundation **có** gắn `?ref=` (unit + contract) |
| Metadata / OG chứa `ref` | **Không** (API SoT đã đo) |
| Feed `/cong-dong` | **Không có nút Chia sẻ** — card chỉ là link điều hướng sạch |
| Nghiệm thu giấy Plan §9 / DoD | **Chưa đóng** — thiếu Evidence package Owner + Cleanup statement chính thức |
| Rủi ro còn lại | Manifest post còn `?v=feedDto20260724`; Loyalty fallback ad-hoc `?ref=`; UI `IFLUX10` |

**Một câu:** Code Production đã migrate đúng contract; người dùng **chỉ thấy `?ref=`** khi (1) bấm Chia sẻ trên bài (không phải feed card), (2) đã login, (3) có `referral_code`, (4) browser nạp đúng bản Interaction `shareAff20260725`.

---

## 1. Ngữ cảnh toàn cục

### 1.1 Vị trí trong Product

```
Product Architecture V2
        │
   Share Capability (chung)
        │
   ┌────┴────┐
   │         │
Widget    Community / Entity
Share     share_url
   │         │
   └────┬────┘
        │
 Share Foundation  ──buildShareUrl──►  shareUrl (± ?ref=)
        │
        │  ref code only
        ▼
 Loyalty Affiliate Store  ──captureRefFromUrl──►  cookie iflux_ref_code
        │
        ▼
 Auth / Register  ──referral_code──►  Backend referred_by
```

### 1.2 Hai chiều hoàn toàn tách

| Chiều | Owner | Input | Output |
|-------|-------|-------|--------|
| **Outgoing (share đi)** | Share Foundation | `referral_code` user hiện tại | `shareUrl` có thể có `?ref=` |
| **Incoming (ai đó mở link)** | Loyalty | URL `?ref=` / `?r=` | Cookie + payload đăng ký |

**Cấm đã khóa:** lấy cookie / URL incoming để gắn vào link share của user khác (re-share leak).

### 1.3 Quan hệ với Metadata SoT (Task Preview A/B)

| Pipeline | Vai trò | `?ref=` |
|----------|---------|---------|
| Article Metadata SoT | title / desc / image / canonical / og:* | **Không bao giờ** |
| Pipeline A (bot OG) | Preview crawler | Consume SoT sạch |
| Pipeline B (SPA + SoT head) | Human / In-App | Consume SoT sạch |
| Share Foundation | Link clipboard / `navigator.share` | Decorate trên **shareUrl** |

Affiliate **không** được viết vào `article.metadata`. Preview 3 dòng stub trước đây là lỗi shell Pipeline B — đã xử lý riêng Task 3 Metadata, **không** phải Affiliate “phá SoT”.

---

## 2. Ownership (SoT / Plan)

| Layer | Owner file | Phải sở hữu | Không được sở hữu | Audit |
|-------|------------|-------------|-------------------|-------|
| Share Foundation | `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` (`IfluxShareFoundation`) | `buildShareUrl`, `decorateAffiliateRef`, `normalizeShareUrl`, `createShare` | Cookie, attribution | **PASS** |
| Loyalty | `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | `referral_code` usage, `captureRefFromUrl`, cookie | Tự là owner URL hệ thống | **Gần PASS** (còn fallback) |
| Community Interaction | `User_Web/iflux-web-ui/interaction/catalog/index.js` | Gọi Foundation trong `share_url` | Tự `location.href` / tự `?ref=` | **PASS** (CDN) |
| Auth | `User_Web/iflux-web-ui/auth.js` | Session + `syncReferralLink` | Decorator | Delegate Loyalty/Foundation |
| Backend Auth | `backend/src/modules/legacy-auth/auth.service.js` | Persist `referral_code` / `referred_by` | Build FE URL | OK |
| Metadata | `community-articles.service.js` `resolveArticleMetadata` | Canonical sạch | `ref` | **PASS** |

---

## 3. Contract kỹ thuật (chi tiết)

### 3.1 Share Foundation — API

File: `share-action-store.js`

| Symbol | Hành vi |
|--------|---------|
| `getOutgoingAffiliateRef()` | Chỉ `IfluxAuth.getUser().referral_code` |
| `normalizeShareUrl(raw)` | Absolute; xóa hash; xóa `ref`/`r` |
| `decorateAffiliateRef(url, code)` | Gắn `?ref=CODE` trên URL sạch |
| `buildShareUrl(opts)` | Normalize → decorate → `{ shareUrl, sharePayload, canonicalUrl, ref }` |
| `createShare(payload)` | Insight → mặc định canonical **Home** `/nha-cua-toi` |
| `buildReferralHomeUrl(ref)` | Thin wrapper → `buildShareUrl` home |
| `registerUrlAttribution` | Gọi Loyalty `captureRefFromUrl` |
| Alias | `IfluxInsightShareStore` = `IfluxShareFoundation` |

### 3.2 Quy tắc entity → canonical mặc định

| `entityType` | Canonical mặc định | Ghi chú |
|--------------|---------------------|---------|
| `home` / `widget_insight` / `insight` | `/nha-cua-toi` | Insight share về Nhà |
| `community_post` | Caller truyền `metadata.canonical` | Bài Cộng đồng |
| Khác | `opts.canonicalUrl` hoặc `location` đã normalize | Entity tương lai |

### 3.3 Loyalty — capture & referral link

| Symbol | Hành vi |
|--------|---------|
| Cookie | `iflux_ref_code` |
| `captureRefFromUrl()` | Parse `ref`/`r`/`return` → cookie + LS |
| `buildReferralLink(code)` | Prefer Foundation; **fallback** home+`?ref=` nếu SF chưa load |
| `getReferralLinkForUser(user)` | `''` nếu thiếu code (**đã bỏ DEMO**) |

### 3.4 Permission

IP-001: Guest `share_url` = **Allow** → Guest được copy link; không có mã → URL sạch.

---

## 4. Luồng end-to-end

### 4.1 Outgoing — User chia sẻ bài Cộng đồng

```
User mở /cong-dong/bai-viet/{slug}
  → Interaction Host mount action bar
  → Bấm Chia sẻ (share_url)
  → ensureShareFoundation()
  → resolveCommunityCanonical(target)  // metadata.canonical ưu tiên
  → buildShareUrl({ entityType:'community_post', affiliate:true })
  → navigator.share({ url }) | clipboard.writeText(url)
```

**Kết quả mong đợi**

| User | shareUrl |
|------|----------|
| Guest / chưa có `referral_code` | `https://iflux.vn/cong-dong/bai-viet/{slug}` |
| Login + `referral_code=ABC` | `https://iflux.vn/cong-dong/bai-viet/{slug}?ref=ABC` |

### 4.2 Outgoing — Insight Widget

```
Nút Insight Share → createShare(...)
  → shareUrl = https://iflux.vn/nha-cua-toi?ref=USER_CODE  (nếu có mã)
```

### 4.3 Outgoing — Link giới thiệu (Loyalty / Profile)

```
user.referral_code → buildReferralLink → /nha-cua-toi?ref=CODE
```

### 4.4 Incoming — Ai đó mở link có `?ref=`

```
Mọi trang load Loyalty (hoặc auth boot)
  → captureRefFromUrl()
  → cookie iflux_ref_code
  → Đăng ký: resolveRegistrationRefCode → backend referred_by
```

### 4.5 `/chia-se`

```
share-feature-boot.js
  → load Loyalty + Share store
  → registerUrlAttribution / capture
  → redirect /nha-cua-toi?ref=…  (giữ mã incoming — đúng chiều capture)
```

---

## 5. Bản đồ entry points

| # | Entry | File / symbol | Decorate qua Foundation? |
|---|-------|---------------|--------------------------|
| 1 | Community Chia sẻ | `interaction/catalog/index.js` → `share_url` | **Có** |
| 2 | Insight Widget | `foundation/share-action.js` → `createShare` | **Có** |
| 3 | Profile / Loyalty copy link | `loyalty-affiliate-store.js` → `buildReferralLink` | **Có** (fallback nếu thiếu SF) |
| 4 | Auth `user.referral_link` | `auth.js` → `syncReferralLink` | Qua Loyalty |
| 5 | `/chia-se` redirect | `runtime/share-feature-boot.js` | Incoming; tự ghép `?ref=` redirect |
| 6 | Feed `/cong-dong` card href | Card link bài | **Không** — không phải share action |
| 7 | Register / social | `auth-register-init`, `auth-social` | Incoming capture |

---

## 6. Hiện trạng Production (bằng chứng đo)

### 6.1 CDN assets (HTTP 200)

| URL | Kết quả đo |
|-----|------------|
| `/Admin_Design_system/.../share-action-store.js?v=shareAff20260725` | `buildShareUrl`×4 · `getOutgoingAffiliateRef`×7 |
| `/User_Web/.../interaction/catalog/index.js?v=shareAff20260725` | `ensureShareFoundation`×2 · `buildShareUrl`×4 |
| `/User_Web/.../loyalty-affiliate-store.js?v=shareAff20260725` | `DEMO`×**0** · có `IfluxShareFoundation` |
| `/User_Web/.../interaction/boot.js?v=shareAff20260725` | `V='?v=shareAff20260725'` · preload Share store |
| Widget `community-post-page/index.js` | `boot.js?v=shareAff20260725` |

### 6.2 Unit contract (cùng file Foundation local = Prod twin)

```
OUT home            → https://iflux.vn/nha-cua-toi?ref=AUDIT01
OUT article re-share→ https://iflux.vn/cong-dong/bai-viet/x?ref=AUDIT01
                      (incoming OTHER bị strip)
OUT guest           → https://iflux.vn/cong-dong/bai-viet/x
                      (không ?ref=, không DEMO)
```

### 6.3 Metadata SoT không chứa `ref`

Bài mẫu `he-lo-manh-moi-…-s447`:

```
meta.canonical = https://iflux.vn/cong-dong/bai-viet/he-lo-manh-moi-…-s447
meta.hasRef    = false
```

### 6.4 Hành vi UI thực tế người dùng

| Bề mặt | Có nút Chia sẻ? | Có `?ref=` trên href mặc định? |
|--------|-----------------|--------------------------------|
| `/cong-dong` (feed) | **Không** | Card href **sạch** |
| `/cong-dong/bai-viet/{slug}` Guest | Có | Share output **sạch** (đúng) |
| Cùng trang, Login + có mã | Có | **Phải** có `?ref=` nếu Foundation load |

> Lịch sử bug (đã sửa trong code CDN): catalog cũ dùng `location.href`, không gọi Foundation → user login cũng không thấy mã. Backup: `_bak/share-affiliate-20260725-153345/…/catalog/index.js`.

### 6.5 Cache / entry residual

| Điểm | Trạng thái |
|------|------------|
| `pages/community-post.manifest.js` `lazyModule` | Vẫn `?v=feedDto20260724` — **rủi ro** browser cache ESM widget cũ |
| Widget file nội dung | Đã trỏ boot `shareAff20260725` |
| Khuyến nghị | Bump `lazyModule` version + purge CF khi harden |

---

## 7. So khớp Plan Acceptance Gate §9

| Gate | Kết quả audit | Bằng chứng / thiếu |
|------|---------------|-------------------|
| **9.1 Objective** | **Gần PASS** | Contract + CDN đúng; thiếu gói Given/When/Then tay Owner (screenshot clipboard login) |
| **9.2 Ownership** | **PARTIAL** | Foundation/Community OK; Loyalty còn fallback `?ref=` ad-hoc; `/chia-se` tự ghép query (incoming — chấp nhận) |
| **9.3 Reuse/Migration** | **PASS** | Modify `share-action-store.js`; không tạo builder song song |
| **9.4 Cleanup** | **PARTIAL (kiểu B)** | Giữ thin alias `buildReferralHomeUrl` / `buildReferralLink` / `getAffiliateRef`; chưa ghi Cleanup Acceptance chính thức vào Plan |
| **9.5 Regression** | **LIKELY PASS (code)** | Re-share strip + metadata sạch đã đo unit/API; cần test tay User B |
| **9.6 Evidence** | **Thiếu trên Plan** | Audit này **là** evidence package; Plan DoD checkbox vẫn chưa tick |

**DoD Plan §10:** chưa đóng giấy tờ — **không tuyên bố task Affiliate đã PASS Owner** chỉ vì code đúng.

---

## 8. Lỗ hổng & rủi ro còn mở

| ID | Mức | Mô tả | Ảnh hưởng |
|----|-----|-------|-----------|
| R1 | Trung | Manifest `community-post` còn `feedDto20260724` | Có thể nạp widget/boot cũ → share không decorate |
| R2 | Thấp | Loyalty `buildReferralLink` fallback tự `?ref=` khi thiếu SF | Ownership leak khi boot sớm |
| R3 | Thấp | `loyalty-affiliate.js` display fallback `'IFLUX10'` | Gây hiểu nhầm UI (không đi Foundation) |
| R4 | Thấp | `ensureShareFoundation` timeout → share im lặng không ref | User login không thấy mã, khó debug |
| R5 | Info | Feed không có share action | User copy URL thanh địa chỉ / long-press card = **không** có affiliate (đúng scope hiện tại) |
| R6 | Info | Insight share về Home, Community về bài | Hai destination khác nhau — đúng Plan; cần truyền thông rõ |

---

## 9. Inventory file (task Affiliate)

### Modified (core)

- `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js`
- `User_Web/iflux-web-ui/interaction/catalog/index.js`
- `User_Web/iflux-web-ui/interaction/boot.js`
- `User_Web/iflux-web-ui/loyalty-affiliate-store.js`
- `User_Web/iflux-web-ui/widgets/community-post-page/index.js`
- `User_Web/iflux-web-ui/iflux-web-ui.js`
- `User_Web/iflux-web-ui/insight-share-store.js`
- `User_Web/iflux-web-ui/runtime/share-feature-boot.js`
- `User_Web/iflux-web-ui/runtime/auth-*-boot.js`, `account-feature-boot.js`, `checkout-feature-boot.js`
- `06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md`

### Added

- Alias runtime `IfluxShareFoundation` (cùng file store — không file mới)
- Backup `_bak/share-affiliate-20260725-153345/`

### Không xóa (Cleanup B)

- `buildReferralHomeUrl`, `buildReferralLink`, `getAffiliateRef` (thin / deprecated)
- Stub `insight-share-store.js` (loader)

---

## 10. Checklist nghiệm thu tay (Owner)

Thực hiện trên Production sau hard refresh:

1. **Guest** — mở bài → Chia sẻ → clipboard / share sheet **không** có `?ref=`.
2. **Login** user có `referral_code` — cùng bài → Chia sẻ → URL bài + `?ref=MÃ_BẠN`.
3. Mở link có `?ref=A` bằng user **B** đã login → Chia sẻ lại → phải `?ref=B`, không `A`.
4. Profile / Loyalty — copy link giới thiệu → `/nha-cua-toi?ref=MÃ`.
5. DevTools Network — `catalog/index.js?v=shareAff20260725` và `share-action-store.js?v=shareAff20260725` = 200.
6. Xem nguồn HTML bài (View Source / curl Human) — `og:url` **không** chứa `ref`.

---

## 11. Kết luận đóng / mở

| Câu hỏi | Trả lời audit |
|---------|----------------|
| Logic Affiliate đã đúng ownership chưa? | **Đúng** trên Foundation + Community catalog CDN |
| User luôn thấy mã trên mọi link? | **Không** — chỉ share do hệ thống tạo + đã login + có mã; feed card / address bar không gắn |
| Có phá Metadata SoT không? | **Không** (canonical/og sạch đã đo) |
| Có đóng được Plan §9 ngay không? | **Chưa** — cần Owner tick checklist §10 + ghi Cleanup B + (khuyến nghị) bump manifest cache |

**Trạng thái đề xuất ghi trên Plan:**  
`Implementation: migrated · Evidence: this Audit · Owner Acceptance: PENDING`

---

*Tài liệu này là bằng chứng audit thực tế tại thời điểm ghi — không thay cho chữ ký PASS của Owner.*
