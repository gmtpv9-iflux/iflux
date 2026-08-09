# Phase 7 · Step 4 — Verification Audit  
## Share Boundary · Implementation Uniformity (không business)

**Date:** 2026-07-30  
**Status:** ✅ **Verification PASS** — Owner business smoke PASS + static/grep PASS · Residual register ghi nợ (không chặn)  
**Design:** [`35-Phase-07-Implementation-Design-Share-Boundary.md`](35-Phase-07-Implementation-Design-Share-Boundary.md)  
**Change List:** [`36-Phase-07-Step3-Change-List.md`](36-Phase-07-Step3-Change-List.md)  
**Production:** `?v=p7ShareSheet20260730` · CDN `executeShare` · permission Guest→LoginRequired  

**Mục tiêu Step 4 (Owner):** xác nhận **đồng nhất implementation** — không Shadow · không tự build `/IFL…` trên Share path · không bypass Foundation · không Guest Share lọt · inventory code thừa/rủi ro trong phạm vi P7.

**§6A:** Pass Phase 7 ≠ Pass §6A · ≠ Final Program PASS · Native Sheet ≠ tuyên bố kênh “hỗ trợ đầy đủ”.

---

## 0. Verdict matrix

| Area | Result | Note |
|------|--------|------|
| Owner business smoke (B1–B4) | ✅ PASS | Owner xác nhận 2026-07-30 — tất cả pass |
| P7-API-01 / AC-D6 entry | ✅ PASS | `executeShare` export; catalog primary → `executeShare`; `navigator.share` **chỉ** Foundation |
| P7-DQ-01 Guest | ✅ PASS | Permission + lazy click + `requireShareLogin` + Store throw |
| P7-DQ-02 Self only | ✅ PASS | `getOutgoingAffiliateRef` = Auth Self; không cookie / Active Owner / IC |
| P7-DQ-03 ≠ Writer | ✅ PASS | Grep Foundation Share = 0 Writer |
| Shadow `/IFL` trên **Share** paths | ✅ PASS | Không prefix độc lập trên Share consumers |
| Residual debt (hygiene) | ⚠ Ghi nợ | §5 — không nâng FAIL nếu Owner smoke PASS |

### Overall

**Step 4 Verification: PASS.**  
→ Step 5 Phase Acceptance khi Owner mở.

---

## 1. Owner runtime evidence (Business — neo, không thay static)

Owner (2026-07-30): **tất cả đã pass** theo checklist Step 3:

| ID | Case | Owner |
|----|------|-------|
| **P7-V-B1** | Guest bấm Share → Login | ✅ |
| **P7-V-B2** | Guest Copy URL đang xem (có thể A) | ✅ |
| **P7-V-B3** | Login B · xem `/IFLA/…` · Share → `/IFLB/…` | ✅ |
| **P7-V-B4** | Native Share Sheet (khi OS hỗ trợ) | ✅ |
| **P7-V-B5** | Fallback Self URL (không Sheet) | ✅ (trong phạm vi Owner smoke) |

---

## 2. Static / Grep — Production (`/var/www/iflux/production`)

### P7-V-R1 — Share Foundation không gọi Writer

```text
rg IfluxShellUrlWriter|Writer.navigate
  foundation/share-action.js
  foundation/share-action-store.js
→ NO_MATCH_PASS
```

**PASS** (AC-D3)

### P7-V-R2 — Guest `share_url` không còn Allow

```text
interaction/permission.js
  share_url + guest → LoginRequired
CDN ?v=b5ixFlat20260727 (boot URL) — content có Guest LoginRequired ✅
```

**PASS** (AC-D1)

### P7-V-R3 — Shadow prefix `/IFL…` trên Share paths

| Consumer | Cách tạo Owner URL | Verdict |
|----------|--------------------|---------|
| Foundation `decorateAffiliateRef` / `prefixPublicIdPath` | Authority Share artifact | ✅ đúng chỗ |
| `interaction/catalog` Share | `executeShare` → Store `buildShareUrl` | ✅ |
| Insight `shareBlock` / `openFromPayload` | `createShare` → Store (cùng Foundation) + Sheet | ✅ không Shadow |
| `navigator.share` toàn User_Web + Foundation | **chỉ** `share-action.js` | ✅ |
| `_bak/**` old catalog `navigator.share` | Backup — **không** load runtime | ✅ bỏ qua |

**PASS** trên Share paths.

### P7-V-R4 — `getOutgoingAffiliateRef` không đọc Active Owner / cookie / URL

```text
getOutgoingAffiliateRef:
  IfluxAuth.getUser().referral_code
  + isLoggedIn guard
  CẤM cookie / URL incoming / Active Owner / Identity Context (comment + code)
```

`resolveShareRef`: foreign `opts.ref` → **ignore**, luôn Self.

**PASS**

### P7-API-01 — một entry Share (URL artifact)

| Path | Entry | Gate |
|------|-------|------|
| Community `share_url` | `IfluxShareAction.executeShare` | Permission LoginRequired → Guest |
| Lazy `.ifx-insight-share-btn` | load Foundation → `shareBlock` / Sheet | `isLoggedIn` + `requireShareLogin` |
| Widget `bindWidgetShare` | Foundation `shareBlock` | `requireShareLogin` |
| `openFromPayload` | Foundation + Sheet | `requireShareLogin` |

Không có consumer thứ ba tự `navigator.share` hay tự prepend `/IFL` cho **Share button**.

**PASS** (AC-D6) — trong Foundation vẫn còn `shareBlock`/`createShare` song song `executeShare` (Insight card) nhưng **cùng owner Foundation**, không phải Shadow module.

### AC-D0 — không Share Foundation file mới song song

```text
foundation/share-action.js + share-action-store.js  (SoT)
insight-share-*.js = stub redirect Foundation ?v=p7ShareSheet20260730
```

**PASS**

---

## 3. Design Verification cases (static map)

| ID | Case | Result | Evidence |
|----|------|--------|----------|
| **P7-V-B1…B5** | Business | ✅ | Owner smoke |
| **P7-V-R1** | No Writer in Share | ✅ | Grep Prod |
| **P7-V-R2** | Guest LoginRequired | ✅ | permission.js + CDN |
| **P7-V-R3** | No shadow prefix Share | ✅ | Grep call sites |
| **P7-V-R4** | Self-only ref | ✅ | Store body |

---

## 4. AC-D checklist

| ID | Status |
|----|--------|
| AC-D0 No parallel Share Foundation | ✅ |
| AC-D1 Guest no Share artifact / Sheet success | ✅ Owner + gates |
| AC-D2 Logged-in = Self only | ✅ Owner + Store |
| AC-D3 Share ≠ Writer | ✅ |
| AC-D4 Native Sheet khi có API | ✅ Owner + `shareViaNativeSheet` |
| AC-D5 Fallback Self | ✅ Owner + `fallbackCopyShareUrl` |
| AC-D6 Consumers → Foundation entry | ✅ |
| AC-D7 No §6A / kênh claim | ✅ |

---

## 5. Residual register — code thừa / rủi ro trong hoặc sát phạm vi P7

> Không sửa code ở Step 4. Ghi nợ để Owner quyết cleanup sau (CG-020) hoặc phase khác.

| ID | Severity | Location | Vấn đề | Phân loại |
|----|----------|----------|--------|-----------|
| **R-P7-01** | Medium (mitigated) | `catalog/index.js` L186 | `!perm() → 'Allow'` cho `share_url` (fail-**open**); like/comment dùng fail-closed `LoginRequired` | **P7 scope** — boot load `permission.js` **trước** catalog → Guest path thực tế đóng; Owner smoke PASS. Nợ: đổi default thành `LoginRequired` khi cleanup |
| **R-P7-02** | Low (mitigated) | `catalog` `buildArticleShareUrl` catch | Catch `SHARE_LOGIN_REQUIRED`/`throw` → trả **canonical Product URL** rồi `copyShareUrl` nếu `executeShare` thiếu | Primary path luôn `ensureShareAction` → `executeShare`. Nợ: catch không copy Product như Share success |
| **R-P7-03** | Out of Share button | `loyalty-affiliate-store.js` `buildReferralLink` | Fallback `origin + '/' + code` khi Foundation chưa load | **Membership referral display**, không phải nút Share. Prefer Foundation `decorateAffiliateRef` khi có. Không fail P7-V-R3 Share paths |
| **R-P7-04** | Hygiene / dead risk | Prod `User_Web/loyalty-affiliate-store.js` | File **orphan** (md5 ≠ `iflux-web-ui/…`); local không có; **không** thấy loader | Ngoài P7 Share — candidate xóa prod orphan (CG-020) khi Owner mở cleanup |
| **R-P7-05** | Hygiene | `interaction/boot.js` | permission/catalog vẫn `?v=b5ixFlat20260727` trong khi Share store đã `p7ShareSheet…` | Content CDN đã đúng P7; cache-buster lệch — bump khi cleanup |
| **R-P7-06** | Info | Foundation | `shareBlock`/`createShare` + `executeShare` cùng module | Không Shadow; Insight giữ card path. Không bắt buộc gộp hết về `executeShare` trong P7 |

**Không phát hiện** trong phạm vi Share đã ship:

- Module Share Foundation song song (`share-v2`, dual full UI)
- Consumer tự `navigator.share` ngoài Foundation
- Share đọc cookie / Active Owner / Identity Context để decorate
- Share gọi Writer

---

## 6. Không được claim sau Step 4

* Program End-to-End Business Verification Gate / Final Program PASS  
* Facebook / Zalo / QR / Ads / Email “hỗ trợ đầy đủ”  
* Context sau Open Zalo IAB (§6A)  
* Cleanup R-P7-01…05 đã xong (chưa — chỉ ghi nợ)

---

## 7. Next

→ Step 5 Phase Acceptance — [`38-Phase-07-Acceptance.md`](38-Phase-07-Acceptance.md) (khi Owner mở)

Optional (không chặn Acceptance): Owner chốt có cleanup R-P7-01/02 fail-closed trong cùng Phase 7 hay backlog riêng.

---

*Phase 7 Step 4 Verification · **PASS** 2026-07-30 · Owner smoke + Prod grep · Residual §5 · Pass Phase ≠ Pass §6A*
