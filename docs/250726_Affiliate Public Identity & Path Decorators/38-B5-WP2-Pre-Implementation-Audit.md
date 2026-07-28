# B5-WP2 — Share Boundary Pre-Implementation Audit

**Date:** 2026-07-27 (rev.3 — WP-2 implemented)  
**Status:** **IMPLEMENTED — Share Boundary Contract v1**  
**Evidence:** [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md)  
**Scope lock:** [`35-B5-SEO-Share-Scope-Lock.md`](35-B5-SEO-Share-Scope-Lock.md) · Writer/Context/Route **FROZEN**

---

## 0. Owner lock — Share Boundary (thay framing cũ)

### ❌ Framing cũ (đã bác)

WP-2 **không** phải chốt:

```text
mọi share → /{publicId}
mọi share → /{publicId}/nha-cua-toi
Insight share → home hay root?
```

Đó là ép mọi outgoing share về một landing page — **ngược kiến trúc B4**.

### ✅ Framing đúng (Owner — LOCK)

```text
Share Intent
      ↓
Object được share là gì?  (Article / Widget / Stock / Profile / Page hiện tại)
      ↓
Canonical URL của object đó  (object owner quyết)
      ↓
Share Foundation decorate affiliate identity  (publicId chỉ là decorator)
      ↓
Share URL
```

**Nguyên tắc UX (Owner):**

- User đang ở link nào → copy link trên trình duyệt = chia sẻ (sau khi normalize + decorate nếu cần).
- Muốn share Nhà của tôi → phải **vào** Nhà của tôi trước — không cần rule hệ thống ép.
- Tab affiliate `https://iflux.vn/IFLYZ2NC` = **hướng dẫn referral**, không ép mọi share engine theo URL đó.

**publicId = decorator, không phải destination.**

---

## 1. Hai lớp Share — phân biệt bắt buộc

| Module | Vai trò | Phạm vi |
|--------|---------|---------|
| **`share-action-store.js`** | Share Foundation — URL math: `normalizeShareUrl`, `decorateAffiliateRef`, `buildShareUrl`, `createShare` | **Hạ tầng dùng chung** — chỉ decorate, **không** tự quyết destination |
| **`share-action.js`** | Insight Card UI — chụp block → modal → Copy link / PNG | **Consumer cụ thể** — **KHÔNG** phải global share cho mọi trang |

Tên `share-action.js` dễ gây hiểu nhầm là “toàn hệ thống”. Thực tế audit: **Case B — một feature (Insight Export)**, không phải Case A (global Foundation).

---

## 2. Trả lời 4 câu hỏi Owner — `share-action.js`

### Q1. `share-action.js` được import / load bởi module nào?

| Loader | Cách load | Ghi chú |
|--------|-----------|---------|
| `User_Web/iflux-web-ui/iflux-web-ui.js` | Lazy `ensureShareAction()` — click `.ifx-insight-share-btn` hoặc `[data-ifx-share-action]` | Load chain: `share-action-store.js` → `share-action.js` → `init()` |
| `User_Web/iflux-web-ui/insight-share-ui.js` | Stub redirect → Foundation | Legacy alias |
| `User_Web/iflux-web-ui/bug-reports-ui.js` | Gọi `IfluxInsightShare.patchAll(document)` sau render bug UI | Re-patch DOM |

**Không load `share-action.js`:**

- `interaction/catalog/index.js` (share bài viết) — chỉ load **`share-action-store.js`**
- `loyalty-affiliate-store.js` — chỉ dùng store API

---

### Q2. Có bao nhiêu nút UI gọi nó?

**Chỉ nút Insight Card** — class `.ifx-insight-share-btn` (title: "Chia sẻ Insight Card").

**Cơ chế gắn nút:**

1. `share-action.js` → `patchAll()` quét `BLOCK_DEFS` (12 loại block) trên DOM
2. `observeDynamicBlocks()` — block render sau vẫn được patch
3. `dashboard-engine.js` → `bindWidgetShare()` (alias `IfluxInsightShare.bindWidgetShare`)
4. `block-templates.js` — HTML tĩnh có slot share actions

**Trang User Web có nút Insight Share (theo `sourcePage` / pathname):**

| Trang | Block types (BLOCK_DEFS) |
|-------|--------------------------|
| **Nhà của tôi** (`dashboard`) | `.ifx-widget`, `.ifx-mkt-liq-block` (khi trên home), `.ifx-wl-block` |
| **Thị trường** (`market`) | `.ifx-mkt-card`, `.ifx-mkt-sidebar-widget`, `.ifx-mkt-section`, `.ifx-mkt-liq-block` |
| **Dòng tiền** (`flow`) | `.ifx-flow-card`, `.ifx-mcmp` |
| **Cộng đồng** (`community`) | `.ifx-com-overview`, `.ifx-com-breadth-sidebar`, `.ifx-com-trending-panel--stocks`, `.ifx-com-trending-panel--stories` |
| **Theo dõi** (`watchlist`) | `.ifx-wl-block` |

**Số lượng nút:** dynamic — mỗi block khớp `BLOCK_DEFS` trên trang = 1 nút. Không có single global Share button.

**Nút share KHÁC (không qua `share-action.js`):**

| Nút | File | UI |
|-----|------|-----|
| **Chia sẻ bài viết** | `interaction/catalog/index.js` | Interaction bar bài (`share_url` action) |
| **Copy link referral** | `loyalty-affiliate.js` / profile tab | Affiliate guidance — không Insight modal |

---

### Q3. Mỗi caller đang share object gì?

| Caller | Object share | Metadata có? | URL thực tế share |
|--------|--------------|--------------|-------------------|
| **`share-action.js` → `shareBlock()`** | Widget / block insight (PNG card) | `meta()` trả `entityType`, `entityId`, `title`, `sourcePage` | **Luôn home** — xem Q4 |
| **`interaction/catalog` → share action** | **Article** | `resolveCommunityCanonical(post)` | Article canonical A → decorate B |
| **`loyalty-affiliate-store` → `buildReferralLink()`** | **Referral guidance** (không phải page object) | N/A | `/{publicId}` root — Owner OK (chỉ hướng dẫn) |
| **Generic “copy thanh địa chỉ”** | Page hiện tại | — | **Chưa có** unified share engine — từng consumer tự build |

**Insight `meta()` entity types (có trong code, chưa dùng cho URL):**

`widget`, `market_liquidity`, `market_block`, `market_sidebar`, `market_section`, `flow_block`, `flow_score_block`, `watchlist`, `community_overview`, `community_breadth`, `community_trending`

---

### Q4. URL hiện tại được tạo ở đâu?

| Path | Ai tạo URL? | Input | Output hiện tại |
|------|-------------|-------|-----------------|
| **Insight share** | `share-action-store.createShare()` — **store default**, caller **không** truyền `canonicalUrl` | `createShare({ title, subtitle, ref })` only | `/nha-cua-toi` → `/IFLxxx/nha-cua-toi` |
| **Article share** | Caller truyền → `buildShareUrl({ canonicalUrl, affiliate:true })` | metadata / `IfluxSeoUrl.postCanonical` | `/IFLxxx/cong-dong/bai-viet/...` |
| **Referral tab** | `buildReferralLink()` → `decorateAffiliateRef(origin+'/', code)` | Không liên quan page object | `https://iflux.vn/IFLxxx` |
| **Insight fallback trong store** | `resolveCanonical()` khi thiếu input | `entityType: widget_insight` → **force home** | Home canonical |

**Không dùng `location.href` trong Insight path** — đây là gap kiến trúc, không phải “chọn home vs root”:

```javascript
// share-action.js — shareBlock() — KHÔNG truyền canonicalUrl / entityType từ meta
IfluxInsightShareStore.createShare({
  title: meta.title,
  subtitle: meta.subtitle,
  ref: IfluxInsightShareStore.getAffiliateRef()
});
```

```javascript
// share-action-store.js — createShare default
canonicalUrl: payload.canonicalUrl || homeCanonicalUrl()
```

**Kết luận Q4:** Insight share **Foundation tự chọn destination = home** — sai ownership model. Article share **caller chọn destination = article canonical** — đúng hướng.

---

## 3. Funnel policy — SEO (A) vs Share (B) — vẫn giữ

Hai output khác nhau **vẫn đúng** sau Owner correction:

```text
SEO meta read     →  canonical sạch (A)     /cong-dong/bai-viet/x
Outgoing share    →  navigation + owner (B)  /IFLYZ2NC/cong-dong/bai-viet/x
```

Share URL (B) phải derive từ **canonical của object đang share**, không từ SEO head trực tiếp cũng không từ landing cố định.

---

## 4. Object → Canonical matrix (target architecture)

| Share intent | Object owner | Canonical (A) | Share URL (B) |
|--------------|--------------|---------------|---------------|
| Share bài viết | Article pipeline | `/cong-dong/bai-viet/{slug}` | `/{publicId}/cong-dong/bai-viet/{slug}` |
| Share cổ phiếu | Stock entity | `/co-phieu/{ticker}` | `/{publicId}/co-phieu/{ticker}` |
| Share Widget Insight | Widget / Insight page | Trang HTML widget hoặc **page hiện tại** (Owner: bar URL) | Decorate prefix |
| Share Nhà của tôi | Profile / Owner space | `/{publicId}/nha-cua-toi` hoặc `/nha-cua-toi` + decorate | User đã **ở** trang đó |
| Referral guidance (affiliate tab) | Loyalty display | `/` (root) | `/{publicId}` — **chỉ hướng dẫn**, không rule engine |

**WP-2 không chốt một URL landing duy nhất** — chốt **contract**: caller (object owner) truyền canonical · Foundation chỉ `buildShareUrl`.

---

## 5. Inventory — toàn bộ outgoing share surfaces

### 5.1 Active consumers

| ID | File | Trigger | Object | URL source | Align Boundary? |
|----|------|---------|--------|--------------|-----------------|
| S1 | `interaction/catalog/index.js` | Nút Chia sẻ bài | Article | `resolveCommunityCanonical` → `buildShareUrl` | ✅ Mostly — fallback C cần review |
| S2 | `share-action.js` | Insight modal Copy link | Widget/block | `createShare()` default home | ❌ **Misaligned** |
| S3 | `loyalty-affiliate.js` | Copy referral | Guidance | `buildReferralLink()` | ✅ Guidance only |
| S4 | `loyalty-coupon-page.js` | Copy mã | Coupon code | N/A URL | EXCLUDED |

**`navigator.share` call sites:** chỉ **S1**.

### 5.2 Foundation (`share-action-store.js`)

| API | Role | WP-2 note |
|-----|------|-----------|
| `buildShareUrl(opts)` | A → B khi có ref | ✅ Giữ — caller phải truyền `canonicalUrl` |
| `decorateAffiliateRef` | Path prefix | ✅ Frozen |
| `createShare(payload)` | Insight wrapper | ⚠️ Default home — consumer bug, không phải policy lock |
| `resolveCanonical()` | Fallback | ⚠️ `widget_insight` → force home — cần caller explicit |

### 5.3 Dead / excluded

| Item | Finding |
|------|---------|
| `community-ui.shareUrl(slug)` | 0 consumers — delete candidate |
| `share-feature-boot.js` | **Incoming** capture + redirect — scope riêng, không outgoing share |
| Admin clipboard | Internal — EXCLUDED |

---

## 6. Gaps — reframed (không còn “home vs root”)

| ID | Issue | Owner model violation |
|----|-------|----------------------|
| **WP2-GAP-INSIGHT-01** | `shareBlock()` bỏ qua `meta.entityType/entityId/sourcePage` khi gọi `createShare` | Foundation chọn destination thay object owner |
| **WP2-GAP-INSIGHT-02** | Insight link luôn `/nha-cua-toi` dù user share block trên Market/Flow/Article page | Share ≠ object đang xem |
| **WP2-GAP-ARTICLE-01** | `resolveCommunityCanonical` fallback `location.href` | Class C — có thể OK nếu bar = decorated page URL; cần normalize idempotent |
| **WP2-GAP-STORE-01** | `resolveCanonical()` default `widget_insight` → home | Store không được assume destination |

**Không phải gap:** Referral tab `/{publicId}` vs Insight home — hai mục đích khác (guidance vs object share).

---

## 7. WP-2 implementation direction (after Owner review — NOT started)

1. **Lock Share Boundary contract** — object owner → `canonicalUrl` → `buildShareUrl` · Foundation không pick landing
2. **Fix Insight path (S2)** — `shareBlock()` truyền canonical từ page context / widget owner (không hardcode home)
3. **Review Article fallback (S1)** — `location.href` normalize vs metadata-first — align “bar URL = share”
4. **Remove dead** `community-ui.shareUrl`
5. **grep gate** — outgoing share không silent default home trong `createShare` callers
6. **Evidence** → `39-B5-WP2-Share-Evidence-Report.md`

**Frozen — 0 diff:**

- `shell-url-writer.js` · `navigation-context.js` · `pnc-lifecycle.js`
- `decorateAffiliateRef` algorithm
- SEO head / WP-1 article metadata

---

## 8. Status

| Item | Status |
|------|--------|
| Share Boundary audit (4 câu hỏi) | ✅ **COMPLETE** |
| Share Boundary Contract v1 (Reviewer lock) | ✅ **LOCKED** |
| WP-2 Implementation | ✅ **COMPLETE** — see Evidence Report |
| Code changes | **6 files** — backup `_bak/wp2-share-boundary-20260727/` |

---

*WP-2 = Share Boundary alignment · Object owner quyết canonical · Foundation chỉ decorate affiliate identity.*
