# Plan — Extend Share Capability to support Affiliate URL Decoration

**Trạng thái:** Ready for implementation — Acceptance Gate §9 đã khóa theo review nghiệm thu Plan  
**Tên task (giữ nguyên):** Extend Share Capability to support Affiliate URL Decoration  
**Product SoT:** [`docs/SoT — iFlux Product Architecture (V2).md`](./SoT%20%E2%80%94%20iFlux%20Product%20Architecture%20(V2).md)  
**Governance:** [`docs/SoT — Engineering Change Governance.md`](./SoT%20%E2%80%94%20Engineering%20Change%20Governance.md)  
**Không sửa Product Architecture V2** — chỉ bổ sung Share Capability Contract trong Share Foundation / plan này.

---

## 0. Mục tiêu

Đưa `?ref=` thành **decorator của Share Capability**, không phải feature của Widget hay Community.

```
              Share Capability
                    |
        +-----------+-----------+
        |                       |
     Widget Share          Community Share
        |                       |
        +-----------+-----------+
                    |
          Affiliate Link Decorator
                    |
              ?ref=CODE
```

Sau migration: Home / Widget / Community / Entity share tương lai đều đi **một** Share URL pipeline.

---

## 1. Scope

### In scope

* Home share
* Widget / Insight share
* Community share (`share_url`)
* Entity share tương lai (cùng contract — không implement hết entity trong đợt này, chỉ để pipeline sẵn)

### Out of scope

* Affiliate attribution logic (ai được hoa hồng)
* Cookie persistence / capture (đã có Loyalty owner)
* Conversion tracking
* SEO / Article Metadata SoT (cấm `ref` trong metadata)

---

## 2. Ownership (khóa)

| Layer | SoT / Owner | Quyết định |
|-------|-------------|------------|
| Product | Product Architecture **V2** | Share = capability chung, không thuộc Widget |
| Interaction | IP-001 / IA | Community có action `share_url` |
| Widget | Widget Definition SoT | Chỉ khai báo có share capability; **không** sở hữu affiliate |
| **Share Runtime** | **Share Foundation** | **Owner tạo share URL** (`buildShareUrl`, decorate) |
| Affiliate Runtime | Loyalty Affiliate Store | Owner **ref code**, capture, cookie — **không** build URL hệ thống |
| SEO Metadata | Article Metadata SoT | Cấm `ref` trong `url` / `canonical` / `og:url` / schema |
| Route | Product Route / `seo-url.js` | URL gốc = URL entity chuẩn (sạch) |

---

## 3. Share Capability Contract

```
Share Capability Contract

Input:
- entityType     (ví dụ: home | community_post | widget_insight | stock | …)
- canonicalUrl   (URL sạch, không ref)
- title?         (optional payload)
- description?   (optional)
- image?         (optional)
- affiliate?     (default true khi user có referral_code)

Output:
- shareUrl       (canonical đã decorate ?ref= khi affiliate)
- sharePayload   { url, title?, text?, … } cho navigator.share / clipboard

Rules:
- canonicalUrl luôn sạch (không chứa ref)
- affiliate decoration chỉ ở output shareUrl
- không mutate entity metadata / article.metadata / og:* / schema.org url
- outgoing ref = referral_code của user đang share — KHÔNG lấy từ URL đang mở / cookie incoming
```

API đề xuất (một owner — không duplicate helper):

```javascript
ShareFoundation.buildShareUrl({
  entityType: 'community_post',
  canonicalUrl: 'https://iflux.vn/cong-dong/bai-viet/post-123',
  title: '…',
  description: '…',
  image: '…',
  affiliate: true
})
// → { shareUrl: 'https://iflux.vn/cong-dong/bai-viet/post-123?ref=ABC123', sharePayload: {…} }
```

---

## 4. Thứ tự decorator (bắt buộc)

**Sai:**

```
url → append ?ref → canonicalize
→ có thể ra /article?id=1?ref=A
```

**Đúng:**

```
Raw URL
  ↓
Normalize URL
  ↓
Validate canonical share URL
  ↓
Affiliate Decorator  (chỉ khi affiliate:true và có USER referral_code)
  ↓
Share output
```

Ví dụ:

| Input | Output |
|-------|--------|
| `https://iflux.vn/cong-dong/bai-viet/a/` | `https://iflux.vn/cong-dong/bai-viet/a/?ref=ABC` (hoặc normalize slash theo rule Normalize) |
| `/cong-dong/bai-viet/test` | absolute + `?ref=USER_CODE` |

Normalize phải: absolute origin, strip hash, strip existing `ref`/`r` query trước khi gắn ref mới (outgoing).

---

## 5. Rule outgoing vs incoming ref

```
Incoming ref (?ref=A trên URL)
    ↓
Capture → Cookie iflux_ref_code=A
    (Loyalty Owner — không đổi trong task này)

Outgoing share
    ↓
Current user's referral_code (B)
    ↓
shareUrl …?ref=B

CẤM: copy ?ref=A từ location.href / cookie vào share output
```

---

## 6. Existing + Reuse / Migration Decision (CG — bắt buộc)

### Existing — Found

| Entry | File | Behavior hiện tại |
|-------|------|-------------------|
| Widget / Insight share | `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` | `buildReferralHomeUrl` → home + `?ref=` |
| Insight UI | `foundation/share-action.js` | Consumer store / `createShare` |
| Community `share_url` | `User_Web/iflux-web-ui/interaction/catalog/index.js` | `location.href` — **không** ref |
| Referral home helper | `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | `buildReferralLink` → home + `?ref=` |
| Capture | Loyalty store | `captureRefFromUrl` — **giữ** (không thuộc task build URL) |
| Article metadata | Backend `resolveArticleMetadata` | canonical sạch — **giữ, cấm ref** |

```
Existing
Found:
- buildReferralHomeUrl()
- share-action-store.js
- loyalty-affiliate-store.js (buildReferralLink + capture)
- interaction/catalog share_url → location.href
```

### Decision

```
Decision
Reuse:
  share-action-store.js  (Share Foundation — owner URL)

Modify:
  buildReferralHomeUrl → thin wrapper / buildShareUrl
  createShare → gọi buildShareUrl
  interaction/catalog share_url → gọi Share Foundation
  loyalty buildReferralLink → delegate Share Foundation (hoặc deprecate sau migrate)

Remove (sau migrate + verify):
  Community location.href làm share URL
  Direct url + "?ref=" ad-hoc ngoài Foundation
  Duplicate URL builder responsibility trên Loyalty (nếu còn)

Không tạo file mới song song nếu Modify share-action-store đủ (CG-012).
Nếu tạo share-url-builder.js riêng phải justify: existing không thể own decoration vì …
```

**FAIL Plan** nếu chỉ viết `Create share-url-builder.js` mà không nói cái gì bị thay thế / remove.

---

## 7. Change proposal

### Target owner

**Share Foundation** — ưu tiên **Modify** `share-action-store.js` thành owner duy nhất (`buildShareUrl` + decorate).  
Chỉ tạo file mới khi CG-012 PASS (justify không sửa được store hiện tại).

### Files (dự kiến)

| Action | Path |
|--------|------|
| **Modify** (ưu tiên) | `foundation/share-action-store.js` — thêm `buildShareUrl` |
| Modify | `foundation/share-action.js` — consumer |
| Modify | `interaction/catalog/index.js` (`share_url`) |
| Modify | `loyalty-affiliate-store.js` — bỏ own build URL sau migrate; giữ capture + referral_code |
| Guard verify | Article metadata / OG — không đổi SoT |
| **Remove** | Xem §9.4 Cleanup Acceptance |

### Removal (preview — bắt buộc điền đủ ở nghiệm thu)

| Deprecated | Condition | Verification |
|------------|-----------|--------------|
| Community `location.href` làm share URL | Sau migrate `share_url` | grep share path |
| Direct `url + '?ref='` ad-hoc | Sau Phase 2 | grep `?ref=` ngoài Foundation + capture |
| Duplicate `buildReferralHomeUrl` / Loyalty `buildReferralLink` (nếu gộp xong) | Consumers = 0 | grep rồi xóa |

---

## 8. Phases

### Phase 0 — Audit existing share entry points

Search bắt buộc:

```
location.href (trong share path)
navigator.share
clipboard.writeText
buildReferralHomeUrl
buildReferralLink
?ref=
```

Deliverable: inventory bảng Existing + Decision (Reuse / Modify / Delete).

### Phase 1 — Create Share URL Builder

* Implement contract §3 + pipeline §4.
* `decorateAffiliateRef` chỉ gắn ref của **current user**.
* Không đụng Loyalty capture/cookie.

### Phase 2 — Migrate

| Consumer | From | To |
|----------|------|-----|
| Widget / Insight | `buildReferralHomeUrl()` | `buildShareUrl({ entityType, canonicalUrl, … })` |
| Community | `location.href` | `buildShareUrl` với `metadata.canonical` / post canonical sạch |
| Home | link share / referral UI | `buildShareUrl({ entityType: 'home', canonicalUrl: home })` |

### Phase 3 — Guards + regression

* Cấm: `metadata.canonical + ref`, `og:url + ref`, `article.url + ref`, schema url + ref.
* Acceptance Gate §9.
* Cleanup helpers chết (CG-020).

---

## 9. Plan / Task Acceptance Gate (bắt buộc nghiệm thu)

Plan và task sau thi công **chỉ PASS** khi đủ 6 hạng mục dưới.  
Không chấp nhận evidence kiểu: «đã sửa share.js».

---

### 9.1 Objective Acceptance

Phải chứng minh **mục tiêu** đạt (Given / When / Then), không chỉ liệt kê file đã sửa.

**Community Share**

```
Given:
  Community Share đang dùng location.href

When:
  User bấm Share

Then:
  Share URL được tạo qua Share Foundation
  và có affiliate ref hợp lệ (referral_code của user đang share)
  — Guest không có code → canonical sạch, không bịa DEMO
```

**Widget / Insight Share**

```
Given:
  Widget/Insight dùng buildReferralHomeUrl / createShare

When:
  User tạo Insight share / copy link

Then:
  URL đi qua buildShareUrl (Share Foundation)
  affiliate decorate đúng ownership
```

**FAIL nếu chỉ báo:** `Đã sửa share.js` / `đã deploy`.

---

### 9.2 Ownership Acceptance

| Owner | Phải sở hữu | Không được sở hữu |
|-------|-------------|-------------------|
| **Share Foundation** | `buildShareUrl()`, affiliate decoration trên shareUrl | referral persistence / attribution |
| **Loyalty Store** | `referral_code`, `captureRefFromUrl()`, cookie | tự build share URL / `append ?ref=` ad-hoc |
| **Community** | gọi Share Capability (`share_url` → Foundation) | tự xử lý `?ref=` |

**PASS khi** ownership đúng bảng trên.

**FAIL nếu** ví dụ `community-share.js` (hoặc catalog) tự append `?ref=`.

---

### 9.3 Reuse / Migration Acceptance

Phải khớp §6 Decision:

```
Reuse:   share-action-store.js
Modify:  buildReferralHomeUrl → buildShareUrl; share_url consumers
Remove:  location.href share path; duplicate URL builders
```

**FAIL Plan** nếu chỉ:

```
Create share-url-builder.js
```

mà không nói cái gì bị thay thế / remove (CG-012 + CG-021).

---

### 9.4 Cleanup Acceptance

Bắt buộc điền một trong hai:

**A — Có xóa**

```
Deleted:
- old helper (liệt kê symbol/file)
- unused import
- old CSS (nếu có)
- dead config
```

**B — Không xóa**

```
No removal required because:
  <lý do cụ thể — ví dụ: buildReferralHomeUrl giữ thin alias tới buildShareUrl,
   deadline remove sau khi grep consumers = 0>
```

**Không được bỏ trống.** Migration không PASS nếu thiếu Cleanup (CG-020 / CG-021).

---

### 9.5 Regression Acceptance

| Case | Expected |
|------|----------|
| Share Home | home canonical sạch + `?ref=USER_CODE` (vd. `/nha-cua-toi?ref=…`) |
| Share Article / Community | `/cong-dong/bai-viet/x?ref=USER_CODE` |
| User click incoming `?ref=A` | capture cookie `iflux_ref_code=A` (Loyalty — không đổi logic) |
| User B đã login share lại | dùng `referral_code=B` — **không** `?ref=A` |
| Metadata canonical / `url` / `og:url` / schema url | **không** có `ref=` |

---

### 9.6 Evidence Acceptance (sau thi công)

Phải cung cấp:

```
Changed files:
Added files:     (+ CG-012 nếu có)
Deleted files:   (hoặc No removal required because …)

grep:
  ?ref=
  buildShareUrl
  location.href   (trong share path — không còn dùng làm share URL)

Test:
  Objective / Ownership / Regression → PASS (kèm evidence)
```

---

## 10. Definition of Done (checklist)

* [ ] §9.1 Objective Acceptance PASS  
* [ ] §9.2 Ownership Acceptance PASS  
* [ ] §9.3 Reuse / Migration Acceptance PASS  
* [ ] §9.4 Cleanup Acceptance điền đủ  
* [ ] §9.5 Regression matrix PASS  
* [ ] §9.6 Evidence package đủ  
* [ ] Impact Analysis / §6 Existing có trong Plan  
* [ ] Outgoing ref = current user only  
* [ ] Không tạo `new_` / `v2_` parallel builder  
* [ ] Review Evidence Package (SoT CG §13)  

---

## 11. Rủi ro

| Rủi ro | Mitigation |
|--------|------------|
| Insight vẫn muốn “chỉ về Home” | `entityType: 'home'` hoặc config share destination — vẫn qua builder |
| Guest share (IP-001 Allow) không có referral_code | `shareUrl` = canonical sạch, không bịa DEMO ref (trừ Owner chốt khác) |
| Double `?` query | Normalize trước decorate |

---

## 12. Lệnh triển khai (sau Owner approve)

Theo CG: Inventory (Phase 0) → Proposal đã có trong plan này → Implementation Phase 1–3 → Cleanup → Verification Acceptance Gate §9.

Không implement attribution / cookie / SEO trong task này.
