# P3 — Pre-Implementation Audit (Owner gate)

**Ngày:** 2026-07-27  
**Task:** Affiliate Public Identity & Path Decorators  
**Phase:** P3 — Share Output Switch (**chưa code** — audit trước thi công)  
**Prerequisite:** P0 ✅ · P1 ✅ · P2 ✅ · ABH closed  
**Owner request:** Xác nhận 3 audit trước khi sửa `decorateAffiliateRef()`

---

## Verdict tổng

| Audit | Câu hỏi | Verdict |
|-------|---------|---------|
| **1** | Chỉ còn **một** Share URL builder (outgoing decorate)? | ✅ **PASS** — một owner active; fallback mỏng ghi nhận P5 |
| **2** | Chỉ còn **một** Affiliate incoming pipeline? | ✅ **PASS** — Resolver (path) + Loyalty capture (query) cùng contract; không sửa P3 |
| **3** | Preview / crawler / canonical khi path affiliate? | 🟡 **AWARENESS** — HTTP 200 OK · không redirect · static HTML chưa có og/canonical (P4) |

**Kết luận:** **Đủ điều kiện mở P3** với phạm vi **chỉ** `decorateAffiliateRef()` trong Share Foundation.

---

## Audit 1 — Inventory Share URL builders (outgoing)

### 1.1 Phương pháp

```bash
rg -n "buildShareUrl|decorateAffiliateRef|IfluxShareFoundation|IfluxInsightShareStore" --glob "*.js"
rg -n "searchParams\.(set|append)\(['\"]ref|['\"]\?ref=" --glob "*.js"
rg -n "navigator\.share|clipboard\.writeText|shareUrl|buildReferral" User_Web Admin_Design_system --glob "*.js"
```

Loại trừ: `_bak/**`, `Admin_Design_system/files (3)/**`, `patterns/**` (DS demo).

### 1.2 Owner duy nhất — outgoing decorate (ACTIVE)

| File | Vai trò | Ghi chú |
|------|---------|---------|
| `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` | **`decorateAffiliateRef()`** · **`buildShareUrl()`** · `createShare()` · `buildReferralHomeUrl()` | **P3 sửa tại đây** |

Export: `IfluxShareFoundation` + alias `IfluxInsightShareStore`.

### 1.3 Consumers — funnel vào Foundation (không tự decorate)

| Consumer | Cách dùng | Tự ghép `?ref=`? |
|----------|-----------|------------------|
| `interaction/catalog/index.js` | `SF.buildShareUrl({ entityType: 'community_post', … })` → `navigator.share` / clipboard | ❌ |
| `foundation/share-action.js` | `IfluxInsightShareStore.createShare()` → copyLink / QR | ❌ |
| `loyalty-affiliate-store.js` `buildReferralLink()` | **Ưu tiên** `SF.buildShareUrl()` | ❌ khi SF có |
| `auth.js` | `buildReferralLink(user.referral_code)` → profile `referral_link` | ❌ delegate |
| `runtime/share-feature-boot.js` | `registerUrlAttribution()` + redirect feature | Không phải share builder chung |

### 1.4 Fallback / edge (không phải builder song song — P5)

| File | Dòng | Hành vi | P3 action |
|------|------|---------|-----------|
| `loyalty-affiliate-store.js` | L94–106 | Fallback `?ref=` **chỉ khi** SF chưa load (`file://`, boot sớm) | Sau P3: fallback gọi path hoặc delegate SF — **P5 cleanup** |
| `runtime/share-feature-boot.js` | L37 | Redirect `/chia-se` → `/nha-cua-toi?ref=` | **P4** compat — không sửa P3 |
| `insight-share-store.js` | stub | Redirect load `share-action-store.js` | ✅ dead stub |

### 1.5 Canonical-only helpers (input sạch — OK)

| File | Hàm | Affiliate? |
|------|-----|------------|
| `community-ui.js` | `shareUrl(slug)` | ❌ canonical entity URL only |
| `interaction/catalog/index.js` | `resolveCommunityCanonical()` | ❌ metadata sạch |

### 1.6 Audit 1 — Kết luận

```text
Outgoing decorate ACTIVE:  1 file (share-action-store.js)
Outgoing consumers:        100% funnel qua buildShareUrl / createShare / buildReferralLink→SF
Parallel decorator logic:  0 (runtime active)
Thin fallback ?ref=:        1 (loyalty L94–106) — boot edge, không block P3
```

✅ **PASS** — P3 chỉ sửa **một** hàm decorate trong Foundation.

---

## Audit 2 — Inventory Affiliate incoming parse

### 2.1 Phương pháp

```bash
rg -n "captureRefFromUrl|parseRefFromLocation|parsePublicIdFromPath|IfluxAffiliateResolver|iflux_ref_code" --glob "*.js"
rg -n "referred_by|registerUrlAttribution" User_Web --glob "*.js"
```

### 2.2 Incoming pipeline (AS-IS)

```text
                    INCOMING
                        │
         ┌──────────────┴──────────────┐
         │                             │
    ?ref= / ?r=                   /{publicId}/path
         │                             │
         ▼                             ▼
  Loyalty captureRefFromUrl      affiliate-resolver.js
  parseRefFromLocation()         (nginx rewrite + head script)
  parseRefFromReturnParam()              │
  parsePublicIdFromPath() ───────────────┘ (delegate AR.parseAffiliatePath)
         │                             │
         └──────────────┬──────────────┘
                        ▼
              cookie iflux_ref_code
              LS iflux_ref_code / iflux_ref_from_link
              context iflux_aff_context_v1 (path only)
                        │
                        ▼
              auth-register / auth signup
                        │
                        ▼
              referred_by (server — KHÔNG đổi P3)
```

### 2.3 File map

| Layer | File | Vai trò | P3 touch? |
|-------|------|---------|-----------|
| **Path bootstrap** | `runtime/affiliate-resolver.js` | Detect IFL segment · cookie · `replaceState` | ❌ **Cấm** |
| **Nginx** | `infra/nginx-iflux-production-locations.conf` L24–36 | Internal rewrite `IFL…/path` → `/path` | ❌ |
| **Query capture** | `loyalty-affiliate-store.js` `captureRefFromUrl` | OR: query · return · path fallback | ❌ |
| **Auth delegate** | `auth.js` · `auth-register-init.js` | Gọi `LoyaltyAffiliateStore.captureRefFromUrl` | ❌ |
| **Share boot** | `share-action-store.js` `registerUrlAttribution` | Delegate Loyalty | ❌ |
| **Signup** | `auth-register-init.js` · backend `auth.service.js` | `referral_code` → `referred_by` | ❌ |
| **Checkout** | `checkout-page.js` · `subscription-orders-store.js` | Đọc `referred_by` đã persist | ❌ |

### 2.4 Ghi chú dual-write cookie

Resolver (path) và Loyalty (query) **cùng** key `iflux_ref_code` — không phải hai pipeline business khác nhau. Thứ tự: Resolver chạy sync trong `<head>` trước shell-boot; Loyalty `captureRefFromUrl` trên `DOMContentLoaded` bổ sung query era.

### 2.5 Audit 2 — Kết luận

✅ **PASS** — Một contract incoming; path owner = Resolver, query owner = Loyalty capture. **P3 không mở rộng** sang các file trên.

---

## Audit 3 — Share Preview / crawler (P4 awareness)

### 3.1 Production probe (2026-07-27)

```bash
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "https://iflux.vn/IFL9552M/cong-dong"
# → HTTP 200 (không 301/302)

curl -sS -I "https://iflux.vn/IFL9552M/cong-dong"
# → HTTP/2 200, cf-cache-status: DYNAMIC
```

| Kiểm tra | Kết quả |
|----------|---------|
| HTTP redirect strip affiliate path? | ❌ Không — **200**, nginx internal rewrite |
| Resolver script trong HTML? | ✅ `affiliate-resolver.js` inject qua `sub_filter` |
| Static `<link rel="canonical">` trên `/cong-dong` HTML? | ❌ Không trong HTML tĩnh đầu |
| Static `og:url` trong HTML? | ❌ Không trong HTML tĩnh đầu |
| Meta SEO community | Set **client-side** (`community-ui.js`, `seo-url.js`, `page-definition.js`) sau boot |

### 3.2 Hệ quả crawler (Facebook / Zalo)

| Actor | URL thấy | Meta thấy | Rủi ro |
|-------|----------|-----------|--------|
| **User browser** | Sau JS: `/cong-dong` (replaceState) | canonical/og qua JS | ✅ UX OK |
| **Crawler không JS** | Request URL có thể còn `/IFL…/cong-dong` | Không og/canonical tĩnh trên list page | 🟡 P4 validate |
| **Share link outgoing (P3)** | User copy `/IFL…/cong-dong` | Preview tool fetch URL đó → 200, nội dung community | 🟡 P4 minimum 4 mẫu |

**Không phải blocker P3** — Plan đã giao P4 cho Preview validation. Biết trước: community **index** lean on client meta.

### 3.3 Audit 3 — Kết luận

🟡 **AWARENESS PASS** — Không có HTTP redirect sai; canonical/OG sạch trên **entity metadata** (bài viết) theo Audit 2026-07-25; **list page** cần P4 matrix Zalo/FB.

---

## P3 scope lock (Owner)

### Được phép

| Thay đổi | File |
|----------|------|
| `decorateAffiliateRef`: `?ref=` → `/{publicId}/{path}` | `share-action-store.js` |
| Cập nhật contract comment + cache bust | `share-action-store.js`, HTML/script `?v=` consumers |
| Evidence P3 deliverable | `docs/.../P3-*.md` |

### Cấm (P3)

- ❌ Sửa `affiliate-resolver.js` / nginx
- ❌ Sửa signup / `referred_by` / auth attribution
- ❌ Sửa cookie / Loyalty capture logic
- ❌ Sửa payout / referral engine
- ❌ Tạo URL builder file mới
- ❌ Widget/Page tự decorate

### Một thay đổi logic

```text
TRƯỚC:  cleanUrl → decorateAffiliateRef → canonical?ref=CODE
SAU:    cleanUrl → decorateAffiliateRef → origin/IFL…/path
```

---

## P3 Acceptance (Owner draft — locked for implementation)

### Functional

- [ ] User đăng nhập + `referral_code` → share URL dạng `https://iflux.vn/IFL…/…`
- [ ] Guest → URL canonical sạch (không publicId / ref)
- [ ] **Không** share URL **mới** sinh `?ref=` (outgoing)
- [ ] Incoming `/IFL…/path` + `?ref=` legacy vẫn capture (regression P2/P4)

### Boundary

- [ ] Chỉ **một** nơi path decorate: `decorateAffiliateRef`
- [ ] Mọi consumer vẫn qua `buildShareUrl` / `createShare` / `buildReferralLink→SF`
- [ ] Không file builder song song mới

### Regression pipeline

- [ ] Copy link (Insight modal + Community share)
- [ ] `navigator.share` (Community)
- [ ] QR (`share-action.js` dùng `shareUrl` từ store)
- [ ] Profile referral link (`auth.js` → `buildReferralLink`)
- [ ] Home referral (`buildReferralHomeUrl`)

---

## Recommendation

**GO P3** — Prerequisites đạt. Thi công theo scope lock trên.

**Sau P3:** P4 Preview matrix · cập nhật loyalty fallback path · `share-feature-boot` redirect path (compat).

---

*Audit reproduce: grep commands §1.1 · §2.1 · curl §3.1 · codebase 2026-07-27.*
