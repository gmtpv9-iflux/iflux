# Plan — Affiliate Attribution Capability Refactor

**Date:** 2026-07-28  
**Revision:** **rev-2** — theo Owner feedback (Human Journey · Identity Creation Contract · Capability ownership · AC-16 · Journey Independence Law)  
**Trạng thái:** ⏳ **Chờ Owner duyệt rev-2** — SoT + Solution **DRAFT** · chưa code  
**Input audit:** [00-Audit-Architecture-Production.md](00-Audit-Architecture-Production.md) · [00-Audit-D5-R1-Referral-Failure.md](00-Audit-D5-R1-Referral-Failure.md)  
**Unblocks:** Notification Platform D5 (R1/R2/R3 referral E2E)

---

## 0. Principles (khóa trước mọi deliverable)

### 0.1 Human Journey First

> Hệ thống phải mô hình hóa **hành trình thực tế** của người dùng.  
> **Không** được yêu cầu người dùng đi đúng một luồng kỹ thuật cụ thể để nghiệp vụ hoạt động.  
> Nếu nhiều hành trình hợp lệ đều dẫn tới cùng kết quả nghiệp vụ (ví dụ: **Identity Created** lần đầu), thì hệ thống **phải** đảm bảo kết quả nghiệp vụ **giống nhau** trên mọi hành trình.

*Gốc bug Path C: Affiliate → Login Google — hành trình hợp lệ nhưng attribution FAIL vì hệ thống bind theo page kỹ thuật.*

### 0.2 Product Capability (không thuộc page / provider)

> **Affiliate Attribution là Product Capability — không phải Register, Login hay OAuth capability.**

> **Mọi hành trình có thể tạo Identity mới đều bắt buộc đi qua cùng Identity Creation Contract và consume một Affiliate Context duy nhất.**

> **Nghiêm cấm pipeline Attribution riêng theo entry point, UI page, hay authentication provider.**

### 0.3 Architecture Law — Journey Independence

> **Journey Independence Law**
>
> Affiliate Attribution được quyết định bởi **ngữ nghĩa hành trình** (anonymous visitor → identity created → account created), **không** được quyết định bởi entry point, UI page, hay authentication provider.
>
> Mọi implementation mới phải chứng minh **không** tạo pipeline Attribution mới. Nếu cần logic riêng cho từng provider (Google, Apple, One Tap…), thiết kế mặc định được coi là **FAIL** cho tới khi chứng minh đó chỉ là **thin wiring** vào **cùng một Identity Creation Contract** — không phải attribution logic mới.

### 0.4 SoT vs Implementation boundary

> SoT Product/Architecture **không** mô tả cookie · localStorage · session · header · body · token.  
> Chỉ contract: capture → persist → read → expire → clear · và **Identity Creation Contract** phải mang Affiliate Context.  
> Cơ chế lưu / vận chuyển = **Solution Design** (sau G1).

---

## 1. Owner Decision — cần duyệt formal (OD-AFF-01…09)

| ID | Nội dung | Plan ghi nhận |
|----|----------|---------------|
| OD-AFF-01 | Affiliate Attribution = Business Capability | ✅ |
| OD-AFF-02 | Affiliate Context — **một capability owner** | ✅ |
| OD-AFF-03 | Capture ngay khi vào Affiliate URL lần đầu | ✅ |
| OD-AFF-04 | Context sống độc lập UI → Identity Created hoặc Expired | ✅ |
| OD-AFF-05 | Mọi Identity Creation → cùng Attribution Contract | ✅ |
| OD-AFF-06 | `users.referred_by` = server SoT cuối | ✅ |
| OD-AFF-07 | Notification / Commission / History chỉ đọc kết quả server | ✅ |
| OD-AFF-08 | Cấm “Register mới có referral”, provider riêng | ✅ |
| OD-AFF-09 | Provider mới không sửa Affiliate Logic | ✅ |

**Gate G0:** Owner tick **APPROVED** → mới mở Phase 1.

---

## 2. Mục tiêu (tóm tắt)

| Lớp | Mục tiêu |
|-----|----------|
| **Business** | Visitor vào Affiliate Link → **Identity Created** (bất kỳ hành trình) → referral ghi đúng một lần |
| **Product** | Affiliate thuộc **Anonymous Visitor Lifecycle** — Journey Independence |
| **Architecture** | 2 capability · server authority · REPLACE không EXTEND |

---

## 3. Capability model (SoT-level — không ghi client/server)

```text
Affiliate Context Capability
  capture · persist · read · expire · clear

Identity Creation Contract          ← mọi đường tạo identity
  (implementation: Register / Google / One Tap / Apple / Admin / …)

Affiliate Attribution Capability
  input: Identity Created (semantic)
  output: users.referred_by · ReferralCreated (semantic)

Consumers (read-only server result)
  Notification · Commission · Affiliate Dashboard · History
  consume: ReferralCreated — không biết Affiliate Context
```

**Không dùng tên event kỹ thuật** (`UserCreated`, `user.created`) trong SoT — chỉ **Identity Created** / **ReferralCreated** (business semantics). Tên event runtime = Solution Design.

---

## 4. Deliverable map (thứ tự bắt buộc)

```text
G0 Owner duyệt OD-AFF
  → P1 SoT pack (+ Journey Independence Law · AC-16)
  → G1 Owner duyệt SoT
  → P2 Impact Analysis + DELETE inventory
  → G2 Owner duyệt scope DELETE / PNC boundary
  → P3 Solution Design (Identity Creation Contract wiring — không trong Plan)
  → P4 Implementation slices S1–S6
  → P5 Regression T1–T15 + AC-16 matrix
  → P6 Exit Evidence
```

**Cấm nhảy:** không Solution Design trước G1 · không code trước G2 + Solution Design sign-off.

---

## 5. Phase 0 — Audit (evidence — đã có)

| File | Nội dung | Status |
|------|----------|--------|
| [00-Audit-Architecture-Production.md](00-Audit-Architecture-Production.md) | Production lifecycle · ownership · Path C timeline · V1–V15 | ✅ LOCKED |
| [00-Audit-D5-R1-Referral-Failure.md](00-Audit-D5-R1-Referral-Failure.md) | D5 R1 triệu chứng · DB evidence · RC-1…5 · Path C | ✅ LOCKED |

## 6. Phase 1 — SoT pack (chỉ tài liệu)

| File | Nội dung | Status |
|------|----------|--------|
| [02-SoT-Affiliate-Attribution.md](02-SoT-Affiliate-Attribution.md) | Definition · Rules · **Journey Independence Law** · AC-1…**16** · T1–T15 | 📝 DRAFT |
| [03-SoT-Affiliate-Context-Contract.md](03-SoT-Affiliate-Context-Contract.md) | Capability contract: capture / persist / read / expire / clear | 📝 DRAFT |
| [04-SoT-Identity-And-Event-Contract.md](04-SoT-Identity-And-Event-Contract.md) | **Identity Creation Contract** · semantic events · consumer matrix | 📝 DRAFT |
| [01-Owner-Decisions-LOCK.md](01-Owner-Decisions-LOCK.md) | OD-AFF-01…09 formal | 📝 DRAFT |
| [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md) | Wiring proposal (post-G1) | 📝 DRAFT |
| [README.md](README.md) | Chỉ mục task pack | ✅ |

**Ghi rõ trong SoT:**

- **PNC** = navigation capability · **không** owner attribution · không dual-read.
- **Share outgoing** — out of scope task này.
- `referred_by` immutable sau set · context invalidate sau consume.

**Gate G1:** Owner APPROVED.

---

## 6. Acceptance Criteria (gate ship)

AC-1…AC-15: theo Owner draft (capture · persist · mọi entry · server SoT · dedupe · …).

### AC-16 — Journey Independence *(bắt buộc)*

> Với **mọi hành trình hợp lệ**: Anonymous Visitor → **Identity Created** → Account Created, kết quả Affiliate Attribution **phải giống nhau**.

| Hành trình | Expected |
|------------|----------|
| Affiliate → Register (email) → Identity Created | PASS — cùng `referred_by` semantics |
| Affiliate → Login Google → Identity Created lần đầu | PASS |
| Affiliate → One Tap → Identity Created | PASS |
| Affiliate → Apple / Facebook / … | PASS (nếu provider active) |
| Affiliate → Magic Link → Identity Created | PASS (khi có provider) |

**FAIL mặc định:** Flow A PASS · Flow B FAIL **chỉ vì** UI / page / provider khác.

---

## 7. Phase 2 — Impact Analysis + DELETE inventory

### 7.1 DELETE / STOP (multi-owner capture & page consume)

| Hiện trạng (audit) | Hành động |
|--------------------|-----------|
| Capture rải: `affiliate-resolver`, `loyalty-affiliate-store`, `auth.js`, `auth-register-init` | DELETE — sole **Affiliate Context Capability** |
| Page/provider consume: register social init, login social, One Tap `{}` | DELETE — mọi path → **Identity Creation Contract** |
| Client-only bind: `applyReferrerToUser`, `linkNewUserToReferrer` | DELETE as authority |
| Duplicate stores / client graph SoT | DELETE / demote to projection |

### 7.2 REPLACE (backend — single attribution semantics)

| Hiện trạng | Hành động |
|------------|-----------|
| `referred_by` chỉ khi body mang `referral_code` | REPLACE → **Identity Creation Contract** carries context; **Affiliate Attribution Capability** consumes once |
| Notification hook rải trong `auth.service` | REPLACE → single producer **ReferralCreated** |
| OTP payload `referred_by` at register start | REPLACE → context lifecycle thuộc Context Capability (Solution Design) |
| Admin create không attribution | MODIFY → cùng Identity Creation Contract |

### 7.3 FORBIDDEN (Governance)

- Attribution pipeline per provider / per page
- Notification (hoặc consumer khác) đọc cookie / localStorage / page state
- dual-read · compat layer · fallback alias cho attribution
- SoT ghi client owner / server owner — chỉ **Capability owner**

**Allowed (Solution Design only):** thin wiring provider → **Identity Creation Contract** (không thêm attribution logic).

### 7.4 Out of scope

| Item | Ghi chú |
|------|---------|
| `MINH10` → IFL migration | Data · slice riêng |
| F1/F2 notify upline | Consumer sau Foundation |
| Commission re-architecture | AC-11 smoke only |

**Gate G2:** Owner duyệt DELETE + out-of-scope.

---

## 8. Phase 3 — Solution Design (sau G1, trước code)

**Không nằm trong Plan chi tiết** — deliverable riêng sau G1:

| Output | Nội dung |
|--------|----------|
| [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md) | Cách mọi provider gọi **Identity Creation Contract** · Affiliate Context được đưa vào contract **một lần** · invalidate rules |

Plan **không** khóa token/header/body — Owner duyệt Solution Design trước S2 thi công.

---

## 9. Phase 4 — Implementation slices (sau G2 + Solution Design)

| Slice | Capability | Mục tiêu (semantic) | Exit |
|-------|------------|---------------------|------|
| **S1 — Affiliate Context Capability** | Context | Sole owner capture/read/expire/clear · DELETE capture rải | AC-1…3 · grep single owner |
| **S2 — Identity Creation integration** | Identity Creation Contract | Context **phải** đi qua contract khi Identity Created — *Solution Design quyết cách* | AC-4…8 · AC-16 partial |
| **S3 — Affiliate Attribution Capability** | Attribution | Identity Created → `referred_by` → invalidate context → ReferralCreated | AC-9,12,13,14 |
| **S4 — Provider wiring** | Identity Creation | Mọi provider / admin / future — **cùng contract**, không attribution branch | AC-15 · **AC-16** |
| **S5 — Consumer Alignment** | Consumers | Notification · Commission · Affiliate Dashboard · History — **chỉ** consume ReferralCreated / server `referred_by` · không biết Context | AC-10,11,12 |
| **S6 — DELETE sweep** | Governance | Dead code · grep gate · D5 doc update | diff − > + |

**Lưu ý S5:** Notification **không** owner Affiliate — chỉ consumer ReferralCreated (OD-AFF-07).

---

## 10. Phase 5 — Regression

### 10.1 Matrix T1–T15 + AC-16

File: `05-Regression-Checklist.md` khi mở Phase 5.

**Gate bắt buộc:**

- **T3** + **AC-16** (Login Google path) = PASS
- T9, T10, T11, T12, T14 = PASS
- Không tồn tại journey PASS/FAIL không nhất quán

### 10.2 D5 re-run (Notification Platform)

R1 · R2 · R3 sau S3–S5 PASS.

---

## 11. Phase 6 — Exit Evidence

`06-Exit-Evidence.md` — DB · inbox · members · T-table · AC-16 sign-off.

---

## 12. Timeline (ước lượng)

| Phase | Công việc | Blocker |
|-------|-----------|---------|
| Tuần 0 | G0 · P1 SoT | Owner |
| Tuần 0 | G1 · P2 · G2 | Owner |
| Tuần 1 | Solution Design · S1–S2 | Owner SD sign-off |
| Tuần 1–2 | S3–S4 | — |
| Tuần 2 | S5–S6 · P5 regression | Owner AC-16 |
| Tuần 2 | P6 exit · D5 close | Owner |

---

## 13. Open questions (G1/G2)

| # | Câu hỏi |
|---|---------|
| R1 | PNC tách hẳn khỏi Affiliate Context? |
| R2 | Context lifetime: 30 ngày vs until Identity Created — product rule confirm |
| R3 | `MINH10` legacy — slice riêng |
| R4 | Cross-device / incognito — product limit ghi trong SoT |

---

## 14. Rev-2 changelog (Owner feedback)

| # | Thay đổi |
|---|----------|
| 1 | `UserCreated` → **Identity Created** + **Identity Creation Contract** |
| 2 | Bỏ “client owner” → **Affiliate Context Capability** |
| 3 | S2 bỏ token/header/body → Solution Design riêng |
| 4 | S5 → **Consumer Alignment** (Notification không owner Affiliate) |
| 5 | Thêm **Human Journey First** + **Journey Independence Law** |
| 6 | Thêm **AC-16 Journey Independence** |

---

## 15. Việc agent làm sau khi Owner duyệt rev-2

1. **Không code** cho tới G2 + Solution Design sign-off.
2. Owner tick G0 → lock [01-Owner-Decisions-LOCK.md](01-Owner-Decisions-LOCK.md).
3. Owner tick G1 → lock SoT [02](02-SoT-Affiliate-Attribution.md) · [03](03-SoT-Affiliate-Context-Contract.md) · [04](04-SoT-Identity-And-Event-Contract.md).
4. Owner tick Solution Design → lock [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md).
5. G2 Impact §7 → S1–S6 implementation.

---

## 16. Approval

| Gate | Owner | Date | Status |
|------|-------|------|--------|
| **Plan rev-2 (00)** | | | ☐ APPROVED ☐ REVISE |
| G0 OD-AFF-01…09 | | | ☐ |
| G1 SoT pack | | | ☐ |
| G2 DELETE scope | | | ☐ |
| Solution Design | | | ☐ |
| P5 Regression + AC-16 | | | ☐ |
| P6 Exit | | | ☐ |

---

*Plan rev-2 — Capability-first · Journey Independence · REPLACE not EXTEND.*
