# Phase 7 · Step 2 — Implementation Design  
## Share Boundary · BR-12 · Brief §6B Native Share Sheet

**Date:** 2026-07-30  
**Status:** ✅ **ACCEPT / PASS** — Owner ACCEPT (Business Goal) · Step 3 **DONE** · Step 4 Verification ✅ **PASS** [`37`](37-Phase-07-Step4-Verification-Audit.md) · Step 5 **OPEN**  
**Neo Discovery:** [`34-Phase-07-Discovery-Audit-Share-Boundary.md`](34-Phase-07-Discovery-Audit-Share-Boundary.md) ✅ **ACCEPT**  
**Neo:** Solution §5.3 · BR-12 · R-URL-02 · Brief §6B · Plan Phase 7 · CG-011 / §2.1  
**Owner decisions (LOCKED):** P7-DQ-01 · **02=A Self** · **03=A no Writer**  
**Change List:** [`36-Phase-07-Step3-Change-List.md`](36-Phase-07-Step3-Change-List.md)

**§6A:** Contribution (Self artifact đúng) · **không** Pass §6A · **không** Final Program PASS · Native Sheet ≠ tuyên bố kênh “hỗ trợ đầy đủ”.

---

# 0. Business Goal Phase 7 (Owner ACCEPT neo đây)

> **Logged-in user bấm Share → hệ điều hành mở Native Share Sheet → URL mang đi luôn là Self Owner URL (`/IFL{Self}/…`).**

Mọi quyết định kỹ thuật bên dưới **chỉ** để phục vụ Goal này.

```text
Guest bấm Share     →  yêu cầu Login
Logged-in bấm Share →  Native Share Sheet
Share URL           →  /IFL{Self}/…   (không A / cookie / URL Owner đang xem)
Share ≠ Writer      →  R-URL-02
```

| Owner ACCEPT (business) | Không cần Owner duyệt chi tiết |
|-------------------------|--------------------------------|
| Business Flow trên | `navigator.share` / `canShare` / tên helper |
| Guest không Share · Self only | `throw SHARE_LOGIN_REQUIRED` wording |
| Native Share Sheet primary | copy fallback chi tiết |
| Boundary Share ≠ Writer | `ensureShareAction` internals |
| Một entry Share + verification cases | — |

---

# 0.1 Engineering Rule — New File Creation

| # | Điều kiện Create New | Phase 7? |
|---|----------------------|----------|
| 1 | Module hiện tại không mở rộng hợp lý | **FAIL** — Foundation `share-action-store` + `share-action` đã own Share |
| 2 | Responsibility mới chưa thuộc module hiện có | Native Sheet = **hành vi** trên Share Action UI — Modify Existing |
| 3–4 | Replacement + no dual | N/A nếu Modify |

**Quyết định:** **Không** tạo `share-v2.js` / parallel Foundation.  
**Modify:** `share-action-store.js` · `share-action.js` · interaction permission/catalog · lazy share gate.

---

# 1. Map Owner Decisions → Design

| DQ / BR | Khóa | Design |
|---------|------|--------|
| **P7-DQ-01** | Guest không Share Foundation | Gate Login trước Share / Native Sheet; `share_url` Guest = LoginRequired; Copy link ≠ Share |
| **P7-DQ-02 A** | Artifact luôn Self | `getOutgoingAffiliateRef` = Self only; cấm opts.ref ghi đè bằng Active Owner / URL Owner |
| **P7-DQ-03 A** | Không Writer | Grep gate; Share chỉ `decorateAffiliateRef` nội bộ Foundation |
| **Brief §6B** | Nút Share → Native Share Sheet | Primary path = `navigator.share` (khi có) + payload Self URL; fallback documented |

---

# 2. Target Business Flow (TO-BE)

```text
[Guest]
  Share / Like / Comment  → LoginRequired (redirect / CTA đăng nhập)
  Copy link (URL bar / copy current href) → OK (URL đang xem, có thể /IFLA/…)

[Logged-in Self = B]
  Click Share
       ↓
  ensureShareAction() + require Self ref
       ↓
  buildShareUrl({ canonicalUrl }) → shareUrl = /IFLB/…
       ↓
  Prefer: navigator.share({ url, title, text })  ← Native Share Sheet (§6B)
       ↓
  Fallback (no Web Share API): Foundation UI — Copy Self URL + kênh phụ (không thay Primary intent)
```

**B đang xem `/IFLA/…` rồi Share:** artifact vẫn `/IFLB/…` (Self), không A.

---

# 3. Impact Analysis (CG-005)

| Feature | Current owner | Files | AS-IS | Decision |
|---------|---------------|-------|-------|----------|
| Share URL artifact | `share-action-store.js` | Foundation | Self via `referral_code`; Guest → Product URL | **Modify** — Guest reject; Self required |
| Share UI / modal | `share-action.js` | Foundation | Modal + copy + QR; **không** Native Sheet | **Modify** — Sheet primary (§6B) |
| Lazy load Share | `iflux-web-ui.js` | ensureShareAction | Click share btn loads Foundation | **Modify** — gate Login trước load/execute |
| Community share_url | `interaction/permission.js` · `catalog/index.js` | Interaction | **Guest share_url = Allow** (IP-001 cũ) · copy only | **Modify** — Guest LoginRequired; logged-in → Sheet path |
| Widget insight share | `dashboard-engine` · blocks | `.ifx-insight-share-btn` | Opens Foundation share | Gate Login + Sheet |
| App Writer | `shell-url-writer.js` | Phase 6 | — | **No touch** |

**Storage/API:** không đổi Attribution ledger · Identity Lifecycle.

**Conflict governance:** IP-001 “Guest share_url = Allow” **superseded** bởi Owner DQ-01 / Brief §6B / BR-12 Phase 7 LOCK — Design ghi rõ; không giữ dual policy.

---

# 4. Foundation API Design

## 4.1 `getOutgoingAffiliateRef` (Self only)

```text
TO-BE:
  if !loggedIn || !user.referral_code → return ''
  return Self Public ID (referral_code)
  CẤM: IfluxIdentityContext.getActiveOwner / cookie / URL parse
```

## 4.2 `buildShareUrl` / `createShare`

| Rule | TO-BE |
|------|--------|
| Guest / empty Self | **Throw** hoặc trả lỗi có mã `SHARE_LOGIN_REQUIRED` — **không** emit Product URL như “share thành công” |
| Logged-in | `decorateAffiliateRef(canonical, Self)` bắt buộc khi `affiliate !== false` |
| `opts.ref` | Chỉ cho phép nếu = Self (hoặc bỏ qua override từ consumer) — **cấm** consumer truyền Active Owner A |
| Writer | **Không** import / gọi |

## 4.3 Native Share Sheet helper (Modify `share-action.js`)

```text
function shareViaNativeSheet(built):
  if !navigator.share → return false
  return navigator.share({
    url: built.shareUrl,
    title: built.sharePayload.title,
    text: built.sharePayload.text
  })
```

**Primary:** Sheet khi `navigator.share` / `canShare` khả dụng (mobile / supported desktop).  
**Fallback:** UI Foundation hiện có (copy Self URL) — **không** đổi artifact; toast hướng dẫn. Design **không** khóa bắt buộc mọi desktop có Sheet (OS limitation) — AC: khi API có → phải dùng Sheet; khi không → fallback Self copy.

## 4.4 Entry `executeShare(canonicalOpts)`

Một entry cho nút Share (P7-API-01 — tương tự P6-API-01 tinh thần):

```text
executeShare(opts):
  1. if !loggedIn → requireAuth / LoginRequired  (DQ-01)
  2. built = createShare/buildShareUrl(opts)     (DQ-02 Self)
  3. if shareViaNativeSheet(built) → done         (§6B)
  4. else openFallbackShareUi(built)              (copy Self URL)
```

Callers (insight btn · interaction share · widget) → **chỉ** `executeShare` / Foundation API tương đương — không tự `clipboard` Product URL như Share.

---

# 5. Permission · Like / Comment · Copy

| Action | Guest | Logged-in |
|--------|-------|-----------|
| **Share** (Foundation / Sheet) | LoginRequired | Allow + Self artifact |
| **Like / Comment / reply…** | LoginRequired (đã gần AS-IS; giữ/khớp DQ-01) | Allow |
| **Copy link** (URL đang xem) | Allow — **không** qua Share Foundation | Allow |

**Sửa:** `interaction/permission.js` — `share_url` Guest: **LoginRequired** (bỏ Allow).  
Catalog `handleShareUrlClick`: sau Login → `executeShare` / Sheet, không chỉ `copyShareUrl` Product/Guest.

---

# 6. Consumer · Shadow inventory (Step 3 checklist)

| Consumer | Path AS-IS | TO-BE |
|----------|------------|-------|
| `.ifx-insight-share-btn` / `data-ifx-share-action` | Lazy → share-action modal | Gate + `executeShare` |
| `interaction/catalog` share_url | Copy URL (Foundation nếu có) | Login gate + Sheet |
| `IfluxInsightShare.bindWidgetShare` | createShare + modal | Same |
| LAS `decorateAffiliateRef` | Delegate Foundation | Keep; không shadow prefix |
| `insight-share-store.js` stub | Redirect Foundation | Keep stub / cleanup optional |

**Shadow FAIL nếu:** tự ghép `/IFL` ngoài Foundation cho Share.

---

# 7. Change Plan (Step 3 — khi mở)

1. Permission: Guest `share_url` → LoginRequired.  
2. Store: reject Guest build; Self-only; chặn ref override.  
3. `share-action.js`: `executeShare` + Native Sheet primary + fallback.  
4. Wire insight / catalog / lazy click → `executeShare`.  
5. Like/Comment: xác nhận Guest LoginRequired (đã có) — không regress.  
6. Cache buster Foundation + deploy Production + CF purge.  
7. Step 4: P7-V-* .

**Rollback:** revert Foundation/UI · không schema.

**Không:** sửa Writer · Share E2E Zalo IAB Context (Program Gate).

---

# 8. Acceptance Criteria Design (AC-D)

| ID | Tiêu chí |
|----|----------|
| **AC-D0** | Không Share Foundation file mới song song |
| **AC-D1** | Guest không tạo Share artifact / không mở Sheet như Share thành công |
| **AC-D2** | Logged-in artifact = Self only (kể cả đang xem Owner URL A) |
| **AC-D3** | Share không gọi Writer (grep) |
| **AC-D4** | Khi `navigator.share` có → nút Share mở Native Sheet với Self URL |
| **AC-D5** | Fallback không Sheet → vẫn Self URL (copy/UI) |
| **AC-D6** | Consumers Share → một Foundation entry |
| **AC-D7** | Không claim §6A / kênh hỗ trợ đầy đủ |

### Verification (Step 4)

| ID | Case | PASS khi |
|----|------|----------|
| **P7-V-B1** | Guest bấm Share | LoginRequired — không Sheet / không artifact Self giả |
| **P7-V-B2** | Guest Copy link trên `/IFLA/…` | Copy được URL đang xem (có thể A) — không qua Foundation Share success |
| **P7-V-B3** | Login B · xem `/IFLA/…` · Share | Artifact `/IFLB/…` |
| **P7-V-B4** | Login B · Share · có Web Share API | Native Sheet nhận URL Self |
| **P7-V-B5** | Login B · không Web Share API | Fallback Self URL |
| **P7-V-R1** | Grep Writer trong Share Foundation | 0 |
| **P7-V-R2** | Grep Guest Allow share_url | 0 (LoginRequired) |
| **P7-V-R3** | Shadow prefix ngoài Foundation | 0 trên Share paths |
| **P7-V-R4** | `getOutgoingAffiliateRef` / build không đọc Active Owner | Grep PASS |

---

# 9. Out of scope

| Mục | Owner |
|-----|-------|
| Writer / app href | Phase 6 |
| Context sau Open Zalo/IAB | Program End-to-End Business Verification Gate |
| Tuyên bố FB/Zalo/… hỗ trợ đầy đủ | Sau Gate PASS |

---

# 10. Step 2 Acceptance

| Check | Status |
|-------|--------|
| Map DQ + §6B | ✅ |
| Impact + IP-001 supersede | ✅ |
| API executeShare · Sheet · Self | ✅ |
| AC-D + P7-V-* | ✅ |
| New File Gate | ✅ Modify Existing |
| Không code | ✅ |

| Vai trò | Quyết định | Ngày | Ký |
|---------|------------|------|-----|
| Reviewer | ACCEPT (Business Goal first) | 2026-07-30 | ☑ |
| Owner | **ACCEPT / PASS Step 2** | 2026-07-30 | ☑ |

**PASS Step 2 →** Step 3 Implementation **OPEN**.

---

*Phase 7 Step 2 Design · **ACCEPT / PASS** 2026-07-30 · Business Goal first · DQ-01/02/03 · §6B*
