# Affiliate Registration Attribution Context — Discovery Audit

**Date:** 2026-07-28  
**Status:** Discovery only — **không sửa code** · **không đổi attribution SoT** · **không đổi API**  
**Mục tiêu:** Trả lời ownership / lifecycle / ai thắng trên ô `#reg-referral` khi User báo “tự điền mã người khác, không sửa được”.  
**Tách biệt:** Không gộp Google Login Incident Fix · không gộp WP7.

---

## 1. Symptom (Owner)

- Form đăng ký **tự điền** mã giới thiệu.
- Mã có thể **không phải** mã User muốn / “mã người khác”.
- **Không sửa được** (locked).

Không giả định ngay là “readonly CSS bug” — audit context boundary.

---

## 2. Impact Analysis (discovery)

| Item | Current evidence |
|------|------------------|
| Feature | Prefill + lock mã giới thiệu trên Register |
| Owners | **Affiliate Context:** `IfluxAffiliateResolver` · **Register UI:** `auth-register-init.js` · **Validate/display:** `IfluxLoyaltyAffiliateStore` |
| Files | `runtime/affiliate-resolver.js` · `auth-register-init.js` · `loyalty-affiliate-store.js` · `auth/register.html` (`#reg-referral`, `.is-ref-locked`) |
| Storage | `localStorage iflux_aff_context_v1` · `iflux_ref_code` · cookie `iflux_ref_code` · `iflux_ref_from_link` |
| Decision (discovery) | **Audit only** — Fix Plan sau khi Owner chốt intent |

---

## 3. Ai set `referral_code`?

| Source | Module | Khi nào | Ghi gì |
|--------|--------|---------|--------|
| **S1 Path capture** | `affiliate-resolver.resolve()` | Load mọi page có script AR; pathname `/IFL…` | `storeAttribution` (cookie + LS) · `storeContextOnce` (CTX_KEY) · `REF_FROM_LINK_KEY=1` |
| **S2 Context read** | `getCodeForIdentityCreation()` / `readActive()` | Register init | Đọc CTX_KEY; nếu hết hạn → clear; **fallback cookie \|\| LS** |
| **S3 Register prefill** | `auth-register-init.js` `initReferralField` | IIFE lúc load init | `applyRefToField(refCode)` từ `affiliateContextCode()` |
| **S4 User input** | `#reg-referral` | User gõ | Chỉ khi **không** lock |
| **S5 Draft restore** | `auth-register-init` (~L179) | Draft local | Chỉ nếu `!isRefFromAffiliateLink()` |
| **S6 Submit** | `getEffectiveRefCode()` | Submit | Lock → context code; else → `input.value` |

---

## 4. Khi nào set / khóa?

### 4.1 `isRefFromAffiliateLink()` (Register)

```9:14:User_Web/iflux-web-ui/auth-register-init.js
function isRefFromAffiliateLink() {
  if (window.IfluxAffiliateResolver && IfluxAffiliateResolver.readActive) {
    return !!IfluxAffiliateResolver.readActive();
  }
  return false;
}
```

**Không** đọc `iflux_ref_from_link` trực tiếp.  
**Tương đương:** “có Affiliate Context / cookie / LS code đang active”.

### 4.2 `readActive()` (Resolver)

1. CTX_KEY còn hạn + publicId hợp lệ → return ctx  
2. Else fallback: **cookie `iflux_ref_code` || localStorage `iflux_ref_code`** → object giả `{ referral_code, referrerPublicId }`  
3. Hết hạn CTX → `clearContext()`

### 4.3 Lock UI

Khi `isRefFromAffiliateLink() && refCode`:

- `input.readOnly = true`
- class `is-ref-locked`
- `aria-readonly`
- Hint: “không thể sửa”
- `getEffectiveRefCode()` **bỏ qua** ô nhập → luôn lấy context

Khi chỉ có code nhưng validate fail (locked path): clear store + unlock.

Khi **không** coi là from-link nhưng vẫn có code (nhánh “mã lưu cũ”): prefill **gợi ý**, hint “có thể xóa” — **không** set `readOnly` trong nhánh validate success (L100–104).

---

## 5. Source nào thắng? (priority)

```text
1) readActive() truthy + code
      → Register coi là "from affiliate link"
      → LOCK + submit dùng context code (không dùng input)
2) storeContextOnce: CTX đã có → không overwrite bằng /IFL mới
      → First-write-wins trong TTL (~30 ngày)
3) Cookie/LS fallback trong readActive
      → Có thể LOCK dù user không vừa đi từ /IFL… trong session này
4) User input
      → Chỉ thắng khi readActive() falsy (hoặc unlock sau invalid)
```

**Hệ quả khớp symptom:** Stale cookie / CTX cũ / first capture cũ → prefill mã “người khác” + **không sửa được** vì `isRefFromAffiliateLink ≡ !!readActive()`.

---

## 6. User input có quyền override không?

| Tình huống | Override? |
|------------|-----------|
| `readActive()` active (CTX hoặc cookie/LS fallback) + valid | **Không** — readOnly + submit lấy context |
| `readActive()` active + invalid code | Có — unlock + clear |
| Không `readActive()` | Có — ô tự do; clear input có thể `clearStoredRefCode` |
| Draft restore | Chỉ khi không lock |

---

## 7. Existing user có bị overwrite `referred_by` không?

Ngoài scope UI register field — server rule (Affiliate SoT): existing identity **không** overwrite `referred_by` khi social/login có context.  
Discovery này **không** re-audit server; chỉ note: UI lock ≠ server overwrite.

---

## 8. Ownership matrix (hiện trạng)

| Concern | Owner | Ghi chú |
|---------|-------|---------|
| Capture `/IFL…` + persist context | `IfluxAffiliateResolver` | SoT Affiliate |
| “Có context đang active?” cho Register lock | **Dùng** `readActive()` | **Semantic lệch tên:** “from link” ≈ “any active code including cookie” |
| Prefill / readOnly / hint | `auth-register-init.js` | Register page |
| Validate mã + display name | `IfluxLoyaltyAffiliateStore` | Không sở hữu capture |
| `<base>` / path-base | Không liên quan attribution | (liên quan Google 403 — task khác) |

---

## 9. Hypotheses (chưa chốt Fix)

| ID | Hypothesis | Evidence hướng |
|----|------------|----------------|
| H1 | Cookie/LS stale → `readActive()` truthy → **lock nhầm** | Code `readActive` fallback + `isRefFromAffiliateLink` |
| H2 | `storeContextOnce` first-write-wins → mã cũ thắng `/IFL` mới trong TTL | L57–66 resolver |
| H3 | `REF_FROM_LINK_KEY` được set nhưng Register **không** dùng để phân biệt gợi ý vs lock | Key tồn tại; lock chỉ nhìn `readActive` |
| H4 | User expect “tuỳ chọn / sửa được” khi chỉ nhớ mã cũ | Nhánh L88–106 không lock; nhánh lock L45+ khác |

**Runtime Owner cần** (discovery tiếp, vẫn không fix):

1. Trên `/dang-ky` trước tương tác:  
   `localStorage iflux_aff_context_v1` · `iflux_ref_code` · `iflux_ref_from_link` · cookie `iflux_ref_code`  
2. `IfluxAffiliateResolver.readActive()`  
3. `#reg-referral.readOnly` · value  
4. Có vừa mở `/IFL…` trong 30 ngày không?

---

## 10. Không làm (khóa)

- Không sửa `auth-register-init` / resolver / clear cookie trong task này  
- Không đổi Attribution IdentityCreated rules  
- Không “unlock tạm” bằng CSS  
- Không trộn Google Incident Fix Plan  

---

## 11. Next

→ **Root cause + Fix Plan (duy nhất):** [01-Root-Cause-and-Fix-Plan.md](01-Root-Cause-and-Fix-Plan.md)

Chờ Owner **OD-REG-AFF-01/02** trước khi implement.

---

## 12. Sign-off discovery

| Role | Status |
|------|--------|
| Agent | ✅ Flow + ownership + win-order ghi nhận từ source |
| Owner | ☐ Runtime checklist §9 · ☐ Intent lock vs suggest · ☐ Mở Fix Plan riêng nếu cần |

---

*Discovery audit only. Không implementation.*
