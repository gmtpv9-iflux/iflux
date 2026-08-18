# Phase 5 — AC Gap Classification

**Date:** 2026-07-29  
**Purpose:** Phân loại mọi gap còn lại trong Step 4: **AC bắt buộc** vs **nice-to-have** vs **out of Phase 5**.  
**Neo AC:** Plan Phase 5 · Design `11` AC-D0…D8 · P5-V-* · Discovery Allowed Reader Matrix · Plan Verification note (không verify href = Phase 6)

---

## 1. Acceptance Criteria Phase 5 (canonical)

### 1.1 Plan (`05-Plan.md` · Phase 5)

| AC (Plan wording) | Nghĩa kiểm được |
|-------------------|-----------------|
| Không dual read Authority | Register/Social/Auth không đọc AR/storage làm Owner |
| Register/Social evidence chỉ Context | Callers đọc Active Owner qua Identity Context |
| Attribution storage tối đa Transport/Flag | `isPathCapturedAttribution` / cookie·LS không quyết Owner |
| NC ≠ User Identity · NC ≠ URL state | Projection only (Design/Architecture) |
| Verification Business | Capability **trong scope** đọc cùng Active Owner / Identity Context |
| **Không** verify href | Explicit → Phase 6 |

**Mục tiêu Plan (scope code):** Register / Social / Login đọc Context (R-AUTH-01 · R-CAP-01).

### 1.2 Design Gate (`11` · AC-D0…D8)

| ID | Tiêu chí |
|----|----------|
| AC-D0 | New File Governance — không `identity-context.js` |
| AC-D1 | Allowed Reader Matrix |
| AC-D2 | `IfluxIdentityContext` cùng `navigation-context.js` |
| AC-D3 | Xóa `getCodeForIdentityCreation` (không proxy) |
| AC-D4 | `isPathCapturedAttribution` = Transport Flag only |
| AC-D5 | 0 file Identity mới · cleanup AR rõ |
| AC-D6 | Không Writer / Lifecycle write scope |
| AC-D7 | P5-V-B* / P5-V-R* (+ R4) |
| AC-D8 | 1 runtime Owner Read path = `getActiveOwner()` (định nghĩa §3.0) |

### 1.3 Design Verification cases (`11` · P5-V-*)

| ID | Case |
|----|------|
| P5-V-B1 | Guest Active=B · Register prefill từ `getActiveOwner` |
| P5-V-B2 | Guest B → Login/Register C · consumers đọc **C** |
| P5-V-B3 | Self A · `getActiveOwner()=A` · không AR storage |
| P5-V-R1 | Grep Register/Social/Auth: không `getCode…` / `readActive` Owner |
| P5-V-R2 | `getCode…` không còn trên AR export |
| P5-V-R3 | Flag Transport only |
| P5-V-R4 | Không `identity-context.js` |

---

## 2. Trạng thái AC vs evidence hiện có

| AC / Case | Evidence | Status |
|-----------|----------|--------|
| Plan: không dual Authority | Grep + Register/Social/Auth migrate | **Met** |
| Plan: Register/Social chỉ Context | Register E2E §4.5 · Social source §4.6 | **Met** (Social = source/caller; không bắt OAuth E2E — xem §3) |
| Plan: storage = Transport/Flag | Flag fix + invalid-fixture Register clear | **Met** |
| Plan: không verify href | Step 4 không claim href menu | **Met** (đúng scope) |
| AC-D0…D6 | Design appendices + Change List + grep | **Met** |
| AC-D8 / P5-V-R* | Grep 0 `getCode…` · runtime `hasGetCode=false` | **Met** |
| P5-V-B1 | Register `IFLNU6MH` locked | **Met** |
| P5-V-B2 | Guest `IFLVJALL` → Login Self `IFLNU6MH` | **Met** (Login path = “Login/Register C”) |
| P5-V-B3 | After login `activeOwner=IFLNU6MH` = Self | **Met** |
| AC-D7 | Tổng hợp P5-V-* | **Met** nếu chấp nhận Social = source evidence |

**Gate 0 Recovery Point:** Process Deviation — **không** nằm trong AC product Phase 5 ở Plan/Design verification IDs.

---

## 3. Gap còn lại — phân loại

| Gap (từ Step 4 §5) | Có trong AC Phase 5? | Classification | Lý do |
|--------------------|----------------------|----------------|-------|
| **Social OAuth E2E** (Google/Apple complete) | **Không** bắt buộc trong P5-V-* / Plan AC | **Nice-to-have** (hoặc blocked tooling) | AC yêu cầu Social **đọc Context** (caller/source). Đã chứng minh `social-login-usecase.js` dùng `getActiveOwner`, không `getCode…`. OAuth provider complete = tích hợp auth provider, không phải Identity Context contract. |
| **Login User C thứ hai** (A→B→C multi-account) | **Không** đúng chữ P5-V-B2 | **Nice-to-have** | P5-V-B2 = Guest B → Login/Register **C** (một Self). Đã có Guest A → Login Self. Chuỗi nhiều account liên tiếp không có ID verification Phase 5. |
| **Multi-tab business rule đầy đủ** | **Không** trong AC-D / P5-V / Plan Phase 5 | **Nice-to-have** / ngoài Phase 5 | Không có AC Phase 5 yêu cầu multi-tab. |
| **Share khi Guest** | Matrix có hàng Share; Plan Phase 5 **không** đặt Share trong mục tiêu code; Phase **7** = Share boundary | **Out of Phase 5 AC core** → Phase 7 / nice-to-have tại P5 | Share logged-in probe đã đủ cho Representation sanity; Guest share + Foundation `getOutgoingAffiliateRef` = Auth Self thuộc **Share boundary (Phase 7)**, không chặn Phase 5 Identity Context Projection. |
| **Share dùng `IfluxIdentityContext` thay vì `Auth.referral_code`** | Allowed Reader Matrix: Share đọc “Identity Context (owner của người share)” | **Partial / Phase 7** | Logged-in Self `referral_code` ≡ Self Public Identity value; Foundation chưa gọi `getActiveOwner`. Không dual AR Authority. Siết API surface = Share phase, không FAIL Phase 5 nếu Self đúng. |
| **Semantic verification PARTIAL** (cookie/LS literals còn) | AC-D8 theo Owner Read §3.0 | **AC met nếu không còn Owner Read** | Literals storage ≠ Owner Read. Grep/runtime đã loại Owner Read qua AR. Giữ PARTIAL chỉ là thận trọng — **không** là AC gap mở nếu không chứng minh được Owner Read còn sống. |
| **Gate 0 Recovery Point** | Không trong AC-D / P5-V / Plan Phase 5 product AC | **Process Deviation** | Không block product AC; Owner accept deviation hoặc replay quy trình. |
| **href / menu / widget Owner URL** | Plan: **cấm** verify ở Phase 5 | **Out of scope** → Phase 6 | Không được dùng để giữ Phase 5 mở. |

---

## 4. Kết luận rà soát

### 4.1 AC Phase 5 product — còn gap bắt buộc nào không?

**Không.** Trong phạm vi Plan + Design AC-D* + P5-V-*:

- Dual Authority / cleanup / Register / Login transition / Self Active Owner / Transport Flag / no new file → **đã có evidence**.
- Social: **AC = đọc Context** → **đã met bằng source/caller evidence**. OAuth E2E **không** phải AC Phase 5.

### 4.2 Những gì đang làm Phase 5 “chưa Final PASS” sai loại

| Đang ghi trong Step 4 | Thực chất |
|----------------------|-----------|
| Social OAuth E2E thiếu | Nice-to-have / tooling limit — **không** AC blocker |
| Login User C / multi-tab | Nice-to-have — **không** AC blocker |
| Guest share / Share API surface | Phase 7 / Matrix follow-up — **không** AC blocker Phase 5 core |
| Gate 0 | Process Deviation — tách khỏi product PASS |
| Semantic PARTIAL | Có thể hạ còn **PASS với residual note** nếu Owner chấp nhận AC-D8 theo §3.0 |

### 4.3 Điều kiện ký Final PASS Phase 5 (đề xuất theo AC)

Được ký **Final PASS Phase 5** khi Owner đồng thời:

1. Chấp nhận evidence đã có đủ **mọi AC Plan + AC-D0…D8 + P5-V-*** (Social = source PASS).  
2. Ghi nhận **Gate 0 = Process Deviation** (accept hoặc replay — không lẫn product FAIL).  
3. Chuyển gap Share guest / Share Foundation API / href → **Phase 6 / Phase 7 backlog** — không giữ Phase 5.

**Không** yêu cầu Social OAuth E2E · Login User C · multi-tab để đóng Phase 5 theo AC đã khóa.

---

*AC Gap Classification · Phase 5 · 2026-07-29*
