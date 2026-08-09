# 01 — Root Cause Report + Fix Plan  
## Affiliate Registration Attribution Context (Task B)

**Date:** 2026-07-28  
**Parent discovery:** [00-Discovery-Registration-Attribution-Context.md](00-Discovery-Registration-Attribution-Context.md)  
**Status:** Root cause **LOCKED** · Fix Plan **locked in** [02-Root-Cause-Locked-and-Fix-Plan.md](02-Root-Cause-Locked-and-Fix-Plan.md) · doc này giữ bản đề xuất ban đầu  

**Scope:** Chỉ boundary Register UI (lock vs suggest) · **không** đổi server `referred_by` / IdentityCreated / first-touch capture

---

## Executive Summary

| | |
|--|--|
| **Symptom** | Đăng ký tự điền mã · mã không phải sharer “hiện tại” · **không sửa được** |
| **Root cause** | **Bug implementation — state conflation:** `isRefFromAffiliateLink()` ≡ `!!readActive()`, trong khi `readActive()` gồm **CTX còn hạn + fallback cookie/LS**. Nhánh UI “mã lưu cũ → chỉ gợi ý, không lock” trong `auth-register-init.js` trở thành **dead code**. Flag `iflux_ref_from_link` được **ghi** lúc path capture nhưng **không bao giờ được đọc** để quyết định lock. |
| **Không phải** | Bug Google · OAuth · Cloudflare · server overwrite `referred_by` · thiếu SoT attribution |
| **SoT** | Attribution bảo vệ commission tại **Identity Created** (server). UI Register label **“tuỳ chọn”** + nhánh suggest chứng minh lock **không** được thiết kế cho mọi stale storage. |
| **Fix (một plan)** | Tách **attribution-active** (submit/identity) vs **path-capture lock** (UI). Stale storage → prefill gợi ý, cho override. Path capture (`iflux_ref_from_link` / CTX từ `/IFL…`) → giữ lock. |

---

## 1. Root Cause Report

### 1.1 Symptom → mechanism

```text
User mở /dang-ky
        │
        ▼
affiliateContextCode() = getCodeForIdentityCreation()
        │  ← đọc readActive()
        ▼
isRefFromAffiliateLink() = !!readActive()   ← BUG BOUNDARY
        │
        ├─ truthy (CTX hoặc cookie/LS bất kỳ)
        │     → LOCK readOnly + submit bỏ qua input
        │
        └─ nhánh "mã lưu cũ / có thể xóa" (L88–106)
              → KHÔNG BAO GIỜ chạy khi còn cookie/CTX
```

### 1.2 Lifecycle đầy đủ (capture → register)

| Bước | Khi nào | Ai ghi/đọc | Storage | TTL / rule |
|------|---------|------------|---------|------------|
| **C1 Capture** | Visitor hit `/IFLxxxxx…` (mọi HTML có AR) | `affiliate-resolver.resolve()` | cookie `iflux_ref_code` · LS `iflux_ref_code` · LS `iflux_ref_from_link=1` · CTX `iflux_aff_context_v1` | Cookie/CTX **30 ngày** (`COOKIE_DAYS`) |
| **C2 First-touch** | `storeContextOnce` | Nếu CTX đã có `referral_code` → **không overwrite** | CTX | First-write-wins (SoT R-02) |
| **C3 Active?** | `readActive()` | 1) CTX còn hạn + IFL hợp lệ 2) else cookie \|\| LS code | — | Expired CTX → `clearContext()` (xóa cả flag + cookie keys trong clear) |
| **C4 Phân biệt path vs stale?** | **Không** ở Register | Flag `iflux_ref_from_link` **write-only** | LS | Dead for UI |
| **C5 Register lock** | `initReferralField` | `isRefFromAffiliateLink() && refCode` | UI `readOnly` | Mọi active read → lock |
| **C6 Identity Created** | Register/social submit | body `referral_code` · server Attribution | `users.referred_by` | Existing user: **không** overwrite (server) |
| **C7 Clear** | Attribution consume / invalid / `clearContext` | Resolver / LAS delegate | all keys | Re-capture allowed |

### 1.3 Vì sao Register lock cả stale?

| Thiết kế trong code (intent) | Thực thi |
|------------------------------|----------|
| Path affiliate → lock (“từ link Affiliate · không thể sửa”) | Dùng `isRefFromAffiliateLink()` |
| Mã lưu cũ → gợi ý · “có thể xóa” · **không** `readOnly` | Nhánh L88–106 |
| `isRefFromAffiliateLink` tên gợi ý “from link” | Implement = `!!readActive()` → **mọi** active storage |

→ **Thiếu phân biệt state** ở boundary UI, dù storage đã có `iflux_ref_from_link` và comment nhánh “mã lưu cũ”.

### 1.4 Classification

| Câu hỏi | Kết luận |
|---------|----------|
| Bug implementation hay thiếu SoT? | **Bug implementation / boundary** — conflate “attribution context active” với “UI must lock” |
| SoT muốn bảo vệ commission? | **Có — tại server Identity Created + first-touch CTX**, không yêu cầu Register readonly mọi cookie |
| Cho phép user override trên UI? | Label **tuỳ chọn** + nhánh suggest = **có** khi không phải path-lock; hiện tại bị khóa nhầm |
| First-touch mã “cũ” vs link share mới? | Nếu CTX còn hạn: SoT **cố ý** giữ mã first-touch (không phải bug lock). User thấy “không phải sharer hiện tại” có thể là **first-touch thắng** — attribution đúng SoT; UI vẫn có thể lock nếu đúng path-capture. Fix **không** phá first-touch. |

### 1.5 Evidence pointers (source)

| Evidence | Location |
|----------|----------|
| Lock predicate | `auth-register-init.js` L9–14, L34–35, L71–73 |
| Dead suggest branch | `auth-register-init.js` L88–106 (unreachable khi `readActive()` truthy) |
| `readActive` cookie fallback | `affiliate-resolver.js` L103–119 |
| Flag write-only | `affiliate-resolver.js` L53 set · L131 clear · **0 reads** trong User_Web cho quyết định UI |
| LAS `isRefFromAffiliateLink` | Cũng `!!readActive()` — cùng conflation |
| SoT Context consumer | `03-SoT-Affiliate-Context-Contract.md` §4.2 — read tại Identity Created; không quy định Register lock |
| OD-AFF | Attribution ≠ Register page ownership |

---

## 2. Impact Analysis (Fix)

| Item | Value |
|------|-------|
| Feature | Register referral field lock/prefill boundary |
| Current owner | Capture: `IfluxAffiliateResolver` · UI lock: `auth-register-init.js` |
| Files (dự kiến) | `auth-register-init.js` (chính) · có thể thin helper đọc flag qua Resolver API (ưu tiên **modify** resolver export `isPathCapturedContext()` thay vì Register đọc LS trực tiếp — giữ OD-AFF-02) |
| Functions | `isRefFromAffiliateLink` · `initReferralField` · `getEffectiveRefCode` · (optional) Resolver `isLinkCaptured` / `readActive` |
| Consumers | `/dang-ky` only cho UI lock · Identity submit vẫn gửi `referral_code` |
| Storage/API | **Không** đổi schema server · **Không** đổi first-touch `storeContextOnce` · **Không** đổi TTL 30d |
| Decision | **Modify** boundary UI · **Reuse** `iflux_ref_from_link` + CTX · **Không** Create capability mới |

**Cấm trong fix:**

- Đổi server Attribution / `referred_by` immutability  
- Cho second `/IFL` overwrite first-touch CTX  
- Register tự capture path  
- Inline CSS hack / bỏ SoT Affiliate ownership  

---

## 3. Proposed Fix Plan (duy nhất)

### Mục tiêu

> Google… *(n/a)* — **Register:** Google button không liên quan.  
> **Google…** → Task A.  
> Đây: **Google-free.**  
> **Affiliate Register:** Phân biệt *path-captured context* (lock) vs *stale storage-only context* (suggest + user override). Giữ attribution server + first-touch.

### 3.1 Định nghĩa state (Owner-aligned)

| State | Điều kiện | UI | Submit `referral_code` |
|-------|-----------|-----|-------------------------|
| **Path-locked** | `readActive()` có code **và** context được đánh dấu path capture (`iflux_ref_from_link === '1'` **hoặc** CTX có `captured_at` từ `storeContextOnce` đi kèm flag) | Prefill + **readOnly** + hint “từ link Affiliate” | Context code (bỏ qua input) |
| **Stale / storage-only** | `readActive()` có code nhưng **không** path-capture flag (cookie/LS fallback sau khi flag mất, hoặc tương đương) | Prefill gợi ý · **không** readOnly · “có thể xóa” | `input.value` (user thắng) |
| **Empty** | `readActive()` null | Ô trống · tuỳ chọn | Input / empty |

**API Resolver (modify existing — không dual-read LS từ Register):**

Ví dụ semantic (tên cuối cùng lúc implement):

- `readActive()` — giữ nguyên (Identity / attribution read)
- `isPathCapturedAttribution()` — `!!readActive() && from_link flag` (hoặc field trong CTX)

Register:

- `isRefFromAffiliateLink()` → gọi `isPathCapturedAttribution()` (**đổi nghĩa cho đúng tên**)
- Nhánh suggest: khi `readActive()` && !pathCaptured → chạy logic L88–106 (revive)

### 3.2 Steps implement (sau Owner APPROVE)

1. Resolver: export predicate path-capture; không đổi `capture` / `storeContextOnce` / TTL.  
2. `auth-register-init.js`: lock chỉ khi path-captured; stale → suggest + editable.  
3. `getEffectiveRefCode`: lock → context; else → input (đã gần đúng — chỉ đổi `locked` predicate).  
4. Đồng bộ `IfluxLoyaltyAffiliateStore.isRefFromAffiliateLink` nếu còn consumer UI (cùng predicate).  
5. Cleanup: comment/dead path; không để Register `localStorage.getItem('iflux_ref_from_link')` trực tiếp.  
6. Verify checklist §4.

### 3.3 Non-goals

- Không đổi WP7 / Google incident  
- Không clear cookie hàng loạt trên mọi visit  
- Không bắt user mất first-touch attribution khi path-locked hợp lệ  

---

## 4. Test cases

| ID | Setup | Steps | Expected |
|----|-------|-------|----------|
| T1 | Clear all aff storage | Mở `/dang-ky` | Ô trống · editable · không hint lock |
| T2 | Visit `/IFL{valid}` rồi `/dang-ky` | Quan sát field | Prefill đúng mã · **readOnly** · hint từ link |
| T3 | T2 + cố sửa / xóa | Gõ | Không đổi (lock) · submit vẫn mã path |
| T4 | Chỉ cookie/LS code · **không** `iflux_ref_from_link` | Mở `/dang-ky` | Prefill · **editable** · có thể xóa · submit theo input |
| T5 | T4 + user xóa ô | Submit | `referral_code` empty (hoặc không gửi) · không ép stale |
| T6 | CTX first-touch IFLA còn hạn · sau đó mở `/IFLB…` | CTX không đổi (first-touch) · Register | Vẫn IFLA nếu path flag/CTX · **không** thành IFLB (SoT) |
| T7 | Path-lock mã invalid (validate fail) | Mở register | Unlock + clear (giữ behavior hiện có) |
| T8 | Existing user login + context | — | Server **không** đổi `referred_by` (regression Attribution) |
| T9 | New register + path-lock valid | Identity Created | `referred_by` set · context clear sau consume (nếu đã có) |
| T10 | Grep/ownership | Register không đọc raw cookie keys | Chỉ qua Resolver API |

---

## 5. Owner gate

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-REG-AFF-01** | Root cause = state conflation (lock dùng `!!readActive`) — **ACCEPT** | ☐ |
| **OD-REG-AFF-02** | Approve Fix Plan §3 (path-lock vs stale-suggest) — **một** hướng | ☐ |
| **OD-REG-AFF-03** | Giữ first-touch CTX / server Attribution — **không đổi** | ☐ (default YES) |
| **OD-REG-AFF-04** | Cho phép implement sau APPROVE | ☐ |

**Chỉ code sau OD-REG-AFF-01 + OD-REG-AFF-02.**

---

## 6. Liên kết

| Doc | Vai trò |
|-----|---------|
| [00-Discovery…](00-Discovery-Registration-Attribution-Context.md) | Discovery trước |
| Affiliate `03-SoT-Affiliate-Context-Contract.md` | Context ops · first-touch |
| Affiliate `01-Owner-Decisions-LOCK.md` | OD-AFF-01…09 |
| Google `20-Plan-…Race-Fix.md` | **Task khác** — không trộn |

---

*Task B only. Không implementation trong deliverable này.*
