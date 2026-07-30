# SoT — Affiliate Attribution Capability

**Date:** 2026-07-28  
**Trạng thái:** 📝 **DRAFT** — chờ Gate G1  
**Owner Decisions:** [01-Owner-Decisions-LOCK.md](01-Owner-Decisions-LOCK.md) (OD-AFF-01…09)  
**Plan:** [00-Plan-Owner-Review.md](00-Plan-Owner-Review.md) rev-2  
**Audit:** [00-Audit-Architecture-Production.md](00-Audit-Architecture-Production.md) · [00-Audit-D5-R1-Referral-Failure.md](00-Audit-D5-R1-Referral-Failure.md)

---

## 1. Definition

**Affiliate Attribution** là **Business Capability** của iFlux: ghi nhận **một lần duy nhất** khi một **Anonymous Visitor** (đã có **Affiliate Context** hợp lệ) hoàn thành **Identity Created** lần đầu, bằng cách set **`users.referred_by`** trên server và phát **ReferralCreated** cho consumer.

Affiliate Attribution **không** thuộc Register, Login, OAuth hay bất kỳ UI page nào.

---

## 2. Capability model

```text
┌─────────────────────────────────────┐
│  Affiliate Context Capability       │
│  capture · persist · read · expire  │
│  · clear                            │
└──────────────┬──────────────────────┘
               │ read at Identity Created
               ▼
┌─────────────────────────────────────┐
│  Identity Creation Contract         │  ← mọi đường tạo identity
│  (Register · Google · One Tap · …)  │
└──────────────┬──────────────────────┘
               │ Identity Created (semantic)
               ▼
┌─────────────────────────────────────┐
│  Affiliate Attribution Capability   │
│  → users.referred_by                │
│  → ReferralCreated                  │
│  → invalidate context               │
└──────────────┬──────────────────────┘
               │ read-only
               ▼
   Notification · Commission · Dashboard · History
```

| Capability | Trách nhiệm | Không được |
|------------|-------------|------------|
| **Affiliate Context** | Capture first-touch Affiliate URL · persist · read · expire · clear | Ghi `referred_by` · gửi notification |
| **Identity Creation Contract** | Chuẩn hóa mọi đường tạo identity · **mang Affiliate Context** vào attribution | Logic referral riêng theo provider |
| **Affiliate Attribution** | Consume context tại Identity Created · set server SoT · emit ReferralCreated | Đọc cookie/LS từ consumer |
| **Consumers** | Đọc `referred_by` / ReferralCreated | Capture context · mutate attribution |

---

## 3. Business rules

| ID | Rule |
|----|------|
| **R-01** | Affiliate URL hợp lệ = path segment `IFL[A-Z0-9]{5,17}` (theo production contract hiện tại). Legacy `MINH10` = out of scope task này. |
| **R-02** | **First-touch:** Context capture một lần khi visitor vào Affiliate URL lần đầu trong lifecycle context. |
| **R-03** | Context **sống độc lập UI** — visitor có thể điều hướng bất kỳ trước Identity Created. |
| **R-04** | Context **hết hiệu lực** khi: (a) **Identity Created** và attribution đã consume, hoặc (b) **Expired** theo product lifetime (xem [03-SoT-Affiliate-Context-Contract.md](03-SoT-Affiliate-Context-Contract.md)). |
| **R-05** | **`users.referred_by`** = server Source of Truth cuối cùng · **immutable** sau khi set (không user-facing clear trong scope này). |
| **R-06** | Một identity chỉ được attribute **một lần** — dedupe nếu request lặp. |
| **R-07** | Identity đã tồn tại (login lại) **không** re-attribute — context vẫn có thể clear/expire. |
| **R-08** | Consumer (Notification, Commission, Dashboard, History) **chỉ** đọc kết quả server — **cấm** đọc client transport. |
| **R-09** | **PNC** (Personal Navigation Context) = capability navigation · **không** owner attribution · **không** dual-read với Affiliate Context. |
| **R-10** | Outgoing Share URL decorate (`?ref=`) thuộc Share Foundation — **out of scope** task này. |

---

## 4. Journey Independence Law

> Affiliate Attribution được quyết định bởi **ngữ nghĩa hành trình**  
> (Anonymous Visitor → Identity Created → Account Created),  
> **không** được quyết định bởi entry point, UI page, hay authentication provider.

**Hệ quả bắt buộc:**

1. Mọi hành trình hợp lệ dẫn tới **Identity Created** lần đầu phải cho **cùng kết quả** `referred_by` (nếu context còn hiệu lực).
2. Implementation mới **không** được tạo pipeline attribution riêng theo provider/page.
3. Provider wiring chỉ được là **thin wiring** vào **Identity Creation Contract** — không thêm attribution branch.

**FAIL mặc định:** Journey A PASS · Journey B FAIL chỉ vì page/provider/UI khác.

---

## 5. Human Journey First

Hệ thống mô hình hóa **hành trình thực tế** — không ép user đi một luồng kỹ thuật.

Ví dụ hành trình hợp lệ (Path C — audit evidence):

```text
Incognito → Affiliate Link (/IFL…) → duyệt site → Header「Đăng nhập」→ Google → Identity Created
```

Hành trình này **phải PASS** attribution giống Register email path.

---

## 6. SoT vs Implementation boundary

| Layer | Được mô tả | Không được mô tả |
|-------|------------|------------------|
| **SoT (file này + 03 + 04)** | Capability · contract semantic · rules · AC | cookie · localStorage · session · header · body field name · token |
| **Solution Design (05)** | Wiring cụ thể · module map · transport choice | Thay đổi business rule không qua Owner |

---

## 7. Acceptance Criteria (AC-1…AC-16)

| ID | Criterion | Verify |
|----|-----------|--------|
| **AC-1** | Visitor vào Affiliate URL → Context captured (first-touch) | T1 |
| **AC-2** | Context persist qua navigation trong cùng browser session/lifecycle | T2 |
| **AC-3** | Context expire theo product rule | T9 |
| **AC-4** | Register email → Identity Created → `referred_by` set | T4 |
| **AC-5** | Register social (page register) → Identity Created → `referred_by` set | T5 |
| **AC-6** | **Login Google (Path C)** → Identity Created lần đầu → `referred_by` set | **T3** |
| **AC-7** | One Tap → Identity Created → `referred_by` set | T6 |
| **AC-8** | Apple / Facebook / Zalo (nếu active) → cùng contract | T7, T8 |
| **AC-9** | Server `users.referred_by` = authority · client graph không override | DB query |
| **AC-10** | ReferralCreated → Notification inbox (template AFFILIATE_REFERRAL_SUCCESS) | D5 R1 |
| **AC-11** | Commission consumer đọc server `referred_by` (smoke) | T12 |
| **AC-12** | Affiliate Dashboard members sync từ server | T11 |
| **AC-13** | Context invalidate sau successful attribution | T10 |
| **AC-14** | Login lại (identity đã có) → không re-attribute | T14 |
| **AC-15** | Provider mới chỉ thin wiring — grep không có attribution branch mới | Code review |
| **AC-16** | **Journey Independence:** mọi hành trình §5 cho **cùng kết quả** | T3 + T4 + T5 + T6 matrix |
| **AC-17** | **Provider Independence:** Affiliate Context **không** reference provider/page/journey | T17 · [08-Acceptance-Gates-G1-G10.md](08-Acceptance-Gates-G1-G10.md) G9 |

---

## 8. Regression matrix (T1–T18) — reference

Chi tiết steps trong [06-Regression-Checklist.md](06-Regression-Checklist.md). Tóm tắt gate:

| ID | Journey | Gate |
|----|---------|------|
| T1 | Affiliate URL → capture | AC-1 |
| T2 | Navigate away → context còn | AC-2 |
| **T3** | **Affiliate → Login Google → new user** | **AC-6, AC-16, G1** |
| T4 | Affiliate → Register email | AC-4, AC-16 |
| T5 | Affiliate → Register social | AC-5, AC-16 |
| T6 | Affiliate → One Tap | AC-7, AC-16 |
| T7–T8 | Other providers | AC-8 |
| T9 | Context expiry | AC-3 |
| T10 | Post-attribute context clear | AC-13 |
| T11 | Dashboard sync | AC-12, G3 |
| T12 | Commission smoke | AC-11 |
| T13 | Invalid/expired code | negative |
| T14 | Existing user login | AC-14, G2 |
| T15 | Admin create user (contract) | AC-15 |
| **T16** | Mock provider add — AR unchanged | AC-17, G8 |
| **T17** | Forbidden grep AR = 0 | AC-17, G9 |
| **T18** | Dual-read grep outside AR = 0 | G6, G10 |

---

## 9. Open questions (Owner — G1)

| # | Câu hỏi | Default proposal |
|---|---------|------------------|
| R1 | PNC tách hẳn Affiliate Context? | ✅ Yes — R-09 |
| R2 | Context lifetime | 30 ngày **hoặc** until Identity Created — confirm product |
| R3 | `MINH10` legacy | Slice riêng — out of scope |
| R4 | Cross-device / incognito | Ghi product limit trong SoT khi Owner chốt |

---

## 10. Related documents

| File | Role |
|------|------|
| [03-SoT-Affiliate-Context-Contract.md](03-SoT-Affiliate-Context-Contract.md) | Context capability contract |
| [04-SoT-Identity-And-Event-Contract.md](04-SoT-Identity-And-Event-Contract.md) | Identity Creation + events |
| [05-Solution-Design-Identity-Creation.md](05-Solution-Design-Identity-Creation.md) | Implementation wiring (post-G1) |

---

## 11. G1 Sign-off

| Role | Name | Date | Status |
|------|------|------|--------|
| Owner | | | ☐ APPROVED ☐ REVISE |

*APPROVED → đổi trạng thái 🔒 LOCKED.*
