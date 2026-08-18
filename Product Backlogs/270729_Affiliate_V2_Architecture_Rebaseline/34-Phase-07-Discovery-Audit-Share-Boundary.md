# Phase 7 · Step 1 — Discovery Audit (AS-IS)  
## Share Boundary · BR-12 · R-URL-02 · Native Share Sheet

**Date:** 2026-07-30  
**Program:** Affiliate V2 Architecture Re-baseline  
**Phase:** 7 — Share boundary (P1)  
**Step:** 1 Discovery Audit — ✅ **ACCEPT** 2026-07-30 (docs only · **không code**)  
**Opened after:** Phase 6 **PASS** — [`33-Phase-06-Acceptance.md`](33-Phase-06-Acceptance.md)  
**Neo Plan:** [`05-Plan.md`](05-Plan.md) Phase 7 · §3A Program End-to-End Business Verification Gate  
**Neo Solution:** [`04-Solution.md`](04-Solution.md) §5.3 · BR-12 · R-URL-02  
**Neo Brief:** [`Business requirement brief.md`](Business%20requirement%20brief.md) — **§6B Native Share Sheet** LOCKED 2026-07-30  
**Evidence:** `share-action-store.js` · callers · Phase 5 Guest Share ([`13`](13-Phase-05-Step4-Verification-Audit.md) §4.7.4)  
**Owner Design Decisions:** §9 **P7-DQ-01 · 02 · 03 LOCKED**

**Gate tiếp:** Step 2 Design — [`35-Phase-07-Implementation-Design-Share-Boundary.md`](35-Phase-07-Implementation-Design-Share-Boundary.md) · chờ Owner ACCEPT Step 2 trước Step 3.

**§6A contribution:** Share artifact đúng Self — **không** đủ Pass §6A · **không** Final Program PASS · **không** tuyên bố kênh “hỗ trợ đầy đủ” trước Program Gate (Native Sheet *mở* kênh OS; bảo toàn Context sau Open vẫn thuộc Gate).

---

# 0. Owner Decisions — **LOCKED** 2026-07-30

| ID | Quyết định |
|----|------------|
| **P7-DQ-01** | **Guest không Share Foundation.** Chỉ **Copy link** (URL hiện tại — có thể vẫn là Owner URL trước). Nút Share / Like / Comment **chỉ sau Login**. **Không** có business case Share Foundation tạo artifact cho Guest. |
| **P7-DQ-02** | **A — Luôn Self.** Logged-in Share artifact = Public ID **người đang Share** (Self). Không dùng Active Owner / Incoming URL Owner (khớp BD-08). |
| **P7-DQ-03** | **A — Không bao giờ** gọi `IfluxShellUrlWriter`. Share ≠ App navigation (R-URL-02). |

### Business Flow khóa (Brief §6B)

```text
B Login (Self = IFLBBB123)
      ↓
B bấm Share
      ↓
OS Native Share Sheet
      ↓
User chọn Copy / Zalo / Facebook / Messenger / Telegram / Email / …
      ↓
Payload URL = https://iflux.vn/IFLBBB123/…  (Self — không IFLAAA)
```

Phase 7 Design/Implement theo **Native Share Sheet + Self artifact** — **không** chỉ Copy Link nội bộ.

---

# 1. Scope Step 1

**Trong phạm vi**

| Concern | TO-BE |
|---------|--------|
| Share Business Contract (BR-12 + §6B) | Artifact = Owner URL của **người chia sẻ (Self)** |
| Guest: cấm Share Foundation / cấm nút Share | DQ-01 |
| Logged-in: luôn Self | DQ-02 |
| Share ≠ Writer | DQ-03 · R-URL-02 |
| Native Share Sheet là hành vi nút Share | Brief §6B |
| One Foundation builder · no shadow | Engineering |

**Ngoài phạm vi**

| Concern | Owner |
|---------|-------|
| App navigation Writer | Phase 6 DONE |
| Parse / Attribution | Phase 8 / 9 |
| E2E Context sau Open IAB (Zalo strip URL…) | **Program End-to-End Business Verification Gate** |
| Tuyên bố kênh “hỗ trợ đầy đủ” | Sau Gate Business PASS |

---

# 2. Share Business Contract (BR-12 · Brief §6B) — **bắt buộc**

### Input

| Input | Rule |
|-------|------|
| `canonicalUrl` | Product URL sạch (Foundation contract) |
| Actor | **Phải logged-in** có Self Public ID — Guest **không** gọi Share Foundation |

### Output

| Output | Rule |
|--------|------|
| `shareUrl` / Share payload URL | Owner URL = `/{SelfPublicId}` + canonical path |
| Native Share Sheet | OS sheet nhận **cùng** URL artifact |

### Invariant — Share artifact **đại diện**

| Đại diện | Không đại diện |
|----------|----------------|
| **Self** = Public Identity **người đang Share** | Navigation / Active Owner trên trang |
| | Incoming URL Owner (A khi B đang xem link A) |
| | Cookie / Attribution storage Owner |
| | Application Writer navigation URL authority |

### Copy link (Guest) — **không** phải Share Foundation

| Hành vi | Allowed | URL |
|---------|---------|-----|
| Guest **Copy link** | ✅ | URL đang hiển thị (có thể `/IFLAAA/…`) — copy address bar / UI copy **không** qua Share Foundation artifact Self |
| Guest **Share** (nút Share / Foundation / Native Sheet) | ❌ | Gate Login |
| Logged-in **Share** | ✅ | Luôn `/IFL{Self}/…` qua Foundation → Native Sheet |

---

# 3. Owner Boundary (khóa thuật ngữ)

| Thuật ngữ | Nghĩa | Dùng cho Share? |
|-----------|--------|-----------------|
| **Self** | Public Identity user đã Login | **Yes — nguồn duy nhất artifact** (DQ-02) |
| **Active Owner / Navigation Owner** | Public Identity đang hiệu lực trên trải nghiệm (NC) | **No** cho Share artifact |
| **Incoming URL Owner** | Owner đọc từ path lúc mở link | **No** cho Share artifact |
| **Share Subject** | = **Self** (người bấm Share) | Yes |
| **Guest** | Chưa Login | **Không** Share Foundation (DQ-01) |

**Cấm đồng nhất:** Active Owner = Share Subject.

---

# 4. Business Scenario Matrix (BR-12 · §6B)

| Scenario | Share nút / Foundation / Native Sheet | Expected URL artifact |
|----------|----------------------------------------|------------------------|
| Guest · không Active Owner | **Cấm Share** · Copy link OK | Copy = Product URL hiện tại |
| Guest · Active Owner = A | **Cấm Share** · Copy link OK | Copy = có thể `/IFLA/…` (URL đang xem) — **không** Foundation Self |
| Logged-in Self = B · trang Product | Share ✅ · Sheet | `/IFLB/…` |
| Logged-in Self = B · đang xem `/IFLA/…` | Share ✅ · Sheet | `/IFLB/…` (**không** A) — BD-08 |
| Logged-in · Like / Comment | Chỉ khi Login (cùng gate UX — Design chi tiết) | Ngoài artifact Share; ghi nhận Product rule |

---

# 5. AS-IS map (evidence)

```text
Consumer → Share Foundation (share-action-store.js)
  getOutgoingAffiliateRef() → Auth.referral_code (Self) | '' nếu Guest
  decorateAffiliateRef → /{IFL}/…
  ✗ không gọi Writer  (đúng DQ-03 hướng)

Native Share Sheet (navigator.share / OS):
  AS-IS: chưa là SoT hành vi nút Share — Gap P7-G08
```

| Check | Evidence | Result |
|-------|----------|--------|
| Share ≠ Writer | Grep Foundation ↔ Writer | ✅ hướng R-URL-02 |
| Logged-in artifact Self | Phase 5 Task 2 | ✅ hướng DQ-02 |
| Guest Foundation → Product URL | Phase 5 §4.7.4 | AS-IS — **TO-BE: cấm Share Guest** (DQ-01), không “sửa thành Active Owner” |
| Native Share Sheet | Grep `navigator.share` | **Gap** — chưa khóa UX theo §6B |

---

# 6. Gap list (sau Owner LOCK)

| ID | Severity | Gap | TO-BE | Scope |
|----|----------|-----|-------|-------|
| **P7-G01** | P0 | Guest vẫn có thể gọi / thấy Share Foundation | **Cấm** Share Guest · gate Login · Like/Comment cùng policy | In |
| **P7-G02** | P0 | Nút Share ≠ Native Share Sheet | Implement §6B: Sheet + payload = Self artifact | In |
| **P7-G03** | P0 | Xác nhận mọi Share path logged-in = Self only | `getOutgoingAffiliateRef` / Self — không Active Owner | In |
| **P7-G04** | P1 | Grep Share không Writer · Writer không Share-decorate | Step 4 R-URL-02 | In |
| **P7-G05** | P1 | Consumer + Shadow: mọi share → một Foundation | Inventory · xóa/migrate shadow | In |
| **P7-G06** | P2 | Copy link Guest vs Share — UX tách rõ | Copy ≠ Share Foundation | In |
| **P7-G07** | — | Zalo/IAB Context after Open | **Out → Program Business Gate** | Out |

**Đóng nhầm Phase 5:** “Guest Share MISMATCH → phải decorate Active Owner” = **REJECT** theo DQ-01. TO-BE = **không Share Guest**.

---

# 7. Engineering — Consumer · Shadow · Artifact consistency (gộp)

| Audit | Mục tiêu | BR / Rule |
|-------|----------|-----------|
| Consumer | Mọi nút Share logged-in → Foundation `buildShareUrl` / `createShare` | One Source |
| Shadow Builder | Không `prefix IFL` / URL share ad-hoc ngoài Foundation | No Shadow |
| Artifact consistency | Copy-from-Share / Sheet / in-app share UI = **cùng** `shareUrl` Self | BR-12 · §6B |

**Không** = E2E từng app Zalo/FB sau Open (Program Gate).  
**Có** = trước khi OS nhận URL, artifact đã đúng Self.

---

# 8. File inventory (Step 2)

| File | Touch? |
|------|--------|
| `share-action-store.js` | **Yes** — Self-only · Guest reject · Sheet payload helper |
| Interaction / Share UI / heart-share buttons | **Yes** — gate Login · Native Sheet |
| Like / Comment entry | Gate Login (policy DQ-01) — tối thiểu |
| `shell-url-writer.js` | **No** |
| LAS / catalog | Audit consumer → Foundation only |

**§2.1:** Modify Existing — cấm Share Writer v2.

---

# 9. Owner Design Decisions — LOCKED (chi tiết)

| ID | Khóa | Lý do Owner |
|----|------|-------------|
| **P7-DQ-01** | Guest: không Share Foundation; Copy link giữ URL đang xem; Share/Like/Comment sau Login | Không business case artifact Guest |
| **P7-DQ-02** | **A — Luôn Self** | BR-12 người chia sẻ · BD-08 Self không bị URL A thay khi Share |
| **P7-DQ-03** | **A — Không bao giờ Writer** | R-URL-02 Share ≠ App navigation |

---

# 10. Step 1 Acceptance

| Check | Status |
|-------|--------|
| Business Contract + Owner Boundary + Scenario Matrix | ✅ |
| P7-DQ-01…03 LOCKED | ✅ |
| Brief §6B Native Share Sheet | ✅ neo |
| Consumer/Shadow gộp · không E2E kênh Gate | ✅ |
| Gaps cập nhật (cấm Guest Share, không Active Owner) | ✅ |
| Không code | ✅ |

**Step 1:** ✅ **ACCEPT** → Step 2 Design [`35`](35-Phase-07-Implementation-Design-Share-Boundary.md) **OPEN** (DRAFT).

---

*Phase 7 Step 1 Discovery · ACCEPT 2026-07-30 · DQ-01 Guest no Share · DQ-02 Self · DQ-03 no Writer · §6B Native Share Sheet*
