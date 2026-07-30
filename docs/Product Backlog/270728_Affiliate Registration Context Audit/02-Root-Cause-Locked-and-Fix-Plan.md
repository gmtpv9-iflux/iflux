# 02 — Root Cause LOCKED + Fix Plan (duy nhất)

**Date:** 2026-07-28  
**Scope:** Form `/dang-ky` tự điền referral không đúng owner / không sửa được  
**Constraint:** **Không sửa code trong bước audit này** · **Không đổi Affiliate Attribution SoT**  
**Parent:** [00-Discovery…](00-Discovery-Registration-Attribution-Context.md) · [01…](01-Root-Cause-and-Fix-Plan.md)

---

## Verdict (1 dòng)

| | |
|--|--|
| **Root cause** | Register **đánh đồng** “có attribution context active” với “vừa đi từ affiliate link → phải lock”. Prefill lấy `readActive()` (CTX first-touch **hoặc** cookie/LS stale). Lock dùng `!!readActive()` → nhánh “gợi ý / có thể xóa” chết. |
| **Tầng fix** | **UI Register context boundary only** — không đụng server `referred_by` / first-touch SoT. |
| **Fix Plan** | **Một hướng:** path-captured → lock; storage-only/stale → prefill editable; Identity submit vẫn qua Resolver/server như SoT. |

---

## 1. Lifecycle — mở form đăng ký lấy mã từ đâu?

### 1.1 Nguồn prefill (duy nhất trên Register)

```text
initReferralField()
  → affiliateContextCode()
      → IfluxAffiliateResolver.getCodeForIdentityCreation()
          → readActive()
```

**File:** `User_Web/iflux-web-ui/auth-register-init.js` (`affiliateContextCode`, `initReferralField`)  
**File:** `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` (`getCodeForIdentityCreation`, `readActive`)

Register **không** parse URL `/IFL…` tại chỗ. Path capture chỉ chạy khi visitor hit path affiliate (nginx inject AR → `resolve()`).

### 1.2 Thứ tự ưu tiên trong `readActive()` (attribution read)

```text
1) localStorage iflux_aff_context_v1
     · còn hạn (expires_at)
     · referral_code / referrerPublicId hợp lệ IFL*
     → TRẢ CTX  (first-touch thắng mọi cookie/LS sau đó)
2) else cookie iflux_ref_code
3) else localStorage iflux_ref_code
4) else null
```

**Draft/session cũ:** `restoreRegistrationDraft()` chỉ ghi `reg-referral` **nếu** `!isRefFromAffiliateLink()` — **sau** `initReferralField`. Draft **không** đứng trên CTX/cookie trong thứ tự attribution; chỉ bổ sung khi UI không coi là “from link”.

| Nguồn | Vai trò trên Register | Có phải “link hiện tại”? |
|-------|----------------------|---------------------------|
| URL/path `/IFL…` | Capture lúc hit path (`resolve` → cookie + LS + flag + CTX once) | Có — lúc capture |
| CTX `iflux_aff_context_v1` | Ưu tiên #1 của `readActive` · **first-write-wins** | Có thể là first-touch cũ, không phải sharer vừa share |
| Cookie / LS `iflux_ref_code` | Fallback khi không có CTX hợp lệ | Stale storage — không = “vừa từ link” |
| Draft đăng ký | Chỉ khi không lock-from-link | Phụ |

---

## 2. Vì sao form nhận code của “owner khác”?

Ba cơ chế **cùng stack**; triệu chứng Owner thấy thường là **(A)+(C)** hoặc **(B)+(C)**.

| ID | Cơ chế | Evidence | Có phải bug SoT? |
|----|--------|----------|------------------|
| **A** | **First-touch CTX** — `/IFLA` trước → CTX giữ A; sau mở `/IFLB` **không** overwrite CTX | `storeContextOnce` early-return nếu CTX đã có code | **Không** — đúng SoT attribution |
| **B** | **Stale cookie/LS** — mã còn 30 ngày sau visit cũ; mở `/dang-ky` thẳng vẫn `readActive()` truthy | `readActive` fallback cookie \|\| LS | Storage đúng design; **UI xử lý sai** nếu lock |
| **C** | **Lock conflation** — mọi `readActive()` truthy bị coi “từ link” → `readOnly` | Trước fix: `isRefFromAffiliateLink ≡ !!readActive()`; nhánh suggest L88–106 unreachable | **Bug UI boundary** |

**Kết luận symptom “sai owner + không sửa được”:**

- **Mã “không phải sharer hiện tại”** → thường **A** (first-touch) và/hoặc **B** (stale), không phải server đổi `referred_by`.
- **Không sửa được** → **C** (đánh đồng context active = path link). Đây là root cause **implementation** cần fix.
- Flag `iflux_ref_from_link` được **ghi** lúc path capture (`storeAttribution`) nhưng **trước fix không được đọc** để quyết định lock → mất phân biệt A/B vs path-lock.

**Không phải:** Google OAuth · Cloudflare · server overwrite `referred_by` trên existing user · thiếu SoT commission.

---

## 3. Logic lock field

### Trước bug (root cause)

| Điều kiện lock | Thực thi |
|----------------|----------|
| Intent: “vừa từ affiliate link” | Tên hàm `isRefFromAffiliateLink` |
| Implement | `!!IfluxAffiliateResolver.readActive()` |
| Hệ quả | CTX **hoặc** cookie/LS bất kỳ → `readOnly` + hint “không thể sửa” |
| Nhánh “mã lưu cũ — có thể xóa” | Dead khi còn active storage |

→ **Đánh đồng** “user vừa đi từ affiliate link” với “user chỉ còn stored referral context”.

### Phân biệt đúng (Fix Plan — semantic)

| State | Điều kiện | UI |
|-------|-----------|-----|
| **Path-locked** | `readActive()` có code **và** path-capture (`iflux_ref_from_link === '1'`) | Prefill + readOnly |
| **Stale / storage-only** | `readActive()` có code **nhưng không** path flag | Prefill gợi ý · editable · có thể xóa |
| **Empty** | không active | Trống · tuỳ chọn |

---

## 4. Server boundary (không phải tầng fix symptom lock)

### Submit từ Register

- Body `referral_code` = `getEffectiveRefCode()` / draft (`auth-register-init.js`).
- Lock path → lấy context code; không lock → lấy `input.value` (user thắng).

### Server

| Flow | Xử lý `referred_by` | Existing user |
|------|---------------------|---------------|
| Email register | `resolveReferrer(referral_code)` lúc **create** user | N/A (new) |
| Social `socialLoginOrRegister` | `resolveReferrer` **chỉ khi** `!user` → `createSocialUser` | User đã có: **không** set lại `referred_by` |

**Evidence:** `backend/src/modules/legacy-auth/auth.service.js` — `socialLoginOrRegister` chỉ gọi `resolveReferrer` trong nhánh tạo user mới.

→ Server attribution **ổn theo SoT**. Không sửa server để “đúng owner trên form”.

---

## 5. Quyết định tầng fix

| Tầng | Quyết định | Lý do |
|------|------------|-------|
| **UI Register lock/prefill** | **FIX TẠI ĐÂY** | Bug conflation; label “tuỳ chọn” + nhánh suggest đã chứng minh intent |
| **Resolver `readActive` / first-touch** | **Không đổi** | SoT R-02 / commission first-touch |
| **Server `referred_by`** | **Không đổi** | Existing user immutability đúng; Identity Created đủ bảo vệ |

---

## 6. Fix Plan duy nhất

1. **Resolver (modify):** export predicate path-capture — ví dụ `isPathCapturedAttribution()` = `!!readActive() && iflux_ref_from_link === '1'`. Không đổi `capture` / `storeContextOnce` / TTL.
2. **Register:** `isRefFromAffiliateLink()` → predicate path-capture (đúng tên). Stale → revive nhánh suggest editable.
3. **`getEffectiveRefCode`:** lock → context; else → input (giữ contract).
4. **LAS `isRefFromAffiliateLink`:** cùng predicate (consumer `auth.js` `resolveRegistrationRefCode`).
5. **Cấm:** Register đọc raw cookie keys; second `/IFL` overwrite CTX; đổi server Attribution SoT.

### Verify (Owner)

| ID | Expected |
|----|----------|
| T1 | Clear storage → `/dang-ky` trống · editable |
| T2 | `/IFL{valid}` → `/dang-ky` prefill · **readOnly** |
| T4 | Chỉ cookie/LS, **không** `iflux_ref_from_link` → prefill · **editable** · xóa được |
| T6 | First-touch CTX A rồi `/IFLB` → CTX vẫn A (SoT) |
| T8 | Existing social login → `referred_by` không overwrite |

---

## 7. Trạng thái (tham chiếu — không phải bước audit này)

Audit này **không sửa code**.  
Cùng Fix Plan đã được Owner approve implement (sau Task A) trên nhánh làm việc / Production hotfix boundary Register — **không** deploy WP7 Google. Runtime verify dùng checklist §6.

---

*Deliverable khóa RC + một Fix Plan. Không multi-option. Không đổi Affiliate Attribution SoT.*
