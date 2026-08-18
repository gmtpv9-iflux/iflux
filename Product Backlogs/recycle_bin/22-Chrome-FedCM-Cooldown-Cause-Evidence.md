# Cause Evidence — Chrome Google Login “lần đầu được, tắt đi rồi lỗi”

**Date:** 2026-07-29  
**Type:** Điều tra nguyên nhân · **không sửa code** · **không đưa solution**  
**Owner observation:** Chrome — lần đầu bấm icon Google thấy nút/prompt góc phải; tắt đi rồi bấm lại → không hiện + báo lỗi.  
**Console Owner (Production `dang-nhap`):** stack `auth-social.js:222` (`prompt`) + message FedCM disabled + `FedCM get() rejects with NetworkError`.

---

## 1. Kết luận — tách Evidence / Hypothesis (errata theo reviewer)

> Reviewer: nhận định cooldown sau đóng popup **hợp lý một phần**, nhưng **chưa đủ** để kết luận root cause duy nhất.  
> Chi tiết + matrix locality: `23-Reviewer-FedCM-State-Locality-Audit.md`.

Hiện tượng **không còn khớp** mô hình “Chrome luôn fail tuyệt đối vì thiếu overlay”.

### Evidence (đã chứng minh)

```text
click → prompt() → Chrome/FedCM không hiện (trạng thái: FedCM disabled)
  → NetworkError → isSkippedMoment → app reject → toast
```

* Console Chrome (không phải app):  
  `FedCM was disabled either temporarily based on previous user action or permanently via site settings`  
  → chỉ chứng minh **FedCM đang bị disable**, **không** chứng minh nguyên nhân disable là “vừa đóng popup”.
* Overlay thiếu trên Chrome → app vào path `prompt()` (`use_fedcm_for_prompt: true`) — đúng.
* Pattern Owner: lần đầu UI góc phải → đóng → lần sau không UI — **evidence hành vi mạnh**, nhưng nhân quả “đóng ⇒ cooldown” vẫn là giả thuyết cho đến khi có matrix Incognito/profile/reset settings.

### Hypothesis (hợp lý, chưa chứng minh là duy nhất)

```text
User đóng FedCM/One Tap UI → Chrome cooldown / suppress → lần 2+ fail
```

Các nguyên nhân khác **cùng khớp** message OR của Chrome: site settings permanent, third-party sign-in block, policy, profile, account state, v.v.

**Nguyên nhân khiến Chrome đi vào path `prompt()` (Evidence):**  
Production gọi `prompt()` khi activator offscreen không có overlay (`fedcm-iframe-only` / `false`), với `use_fedcm_for_prompt: true`.

---

## 2. Evidence Owner (nguồn sự thật hành vi người dùng)

| Quan sát | Ý nghĩa điều tra |
|----------|------------------|
| Lần đầu: hiện nút/prompt Google góc phải | `prompt()` **đã chạy được** UI FedCM/One Tap — không phải “Chrome không bao giờ mở được Google” |
| Tắt đi rồi bấm lại: không hiện | Đúng pattern **cooldown / FedCM suppressed sau đóng UI** |
| Console: `FedCM was disabled either temporarily based on previous user action or permanently via site settings` | Message **của trình duyệt**, trỏ thẳng cooldown hoặc site setting third-party sign-in |
| Console: `FedCM get() rejects with NetworkError: Error retrieving a token` | Hệ quả khi FedCM get bị chặn/thất bại sau suppress |
| Stack: `auth-social.js:222` → `startGoogleLoginFromUserGesture:187` → click `:388` | Đúng call site `google.accounts.id.prompt` đã audit |

---

## 3. Evidence code Production (không đoán)

### 3.1 Khởi tạo GIS — FedCM bật cho prompt

```js
google.accounts.id.initialize({
  client_id: cfg.clientId,
  callback: ...,
  auto_select: false,
  cancel_on_tap_outside: true,
  use_fedcm_for_prompt: true,
  itp_support: true
});
```

* `use_fedcm_for_prompt: true` → One Tap/`prompt` đi qua **FedCM** trên Chrome.  
* `cancel_on_tap_outside: true` → đóng khi tap ngoài cũng là hành vi “đóng UI” phía GIS (liên quan cooldown One Tap/FedCM).

### 3.2 Nhánh vào `prompt`

```text
clickOffscreenGoogleActivator
  → không có [role=button] / div[tabindex]
  → có iframe → 'fedcm-iframe-only'
  → startGoogleLoginFromUserGesture → google.accounts.id.prompt(...)   // L222
```

### 3.3 Callback app

```text
isNotDisplayed() || isSkippedMoment()  →  reject(toast)
```

Không đọc `getSkippedReason()`. Audit trước đã đo: **`unknown_reason`**.

---

## 4. Evidence chuẩn Chrome / Google (đối chiếu message)

### 4.1 Message Owner = cooldown / site opt-out FedCM

Chrome / FedCM docs: nếu user **đóng thủ công** UI FedCM, site bị suppress một thời gian (cooldown tăng dần theo số lần đóng). User có thể bị liệt vào “Not allowed to show third-party sign-in prompts”, hoặc tắt hẳn third-party sign-in.

Cách mô tả khớp **nguyên văn** console Owner:

> FedCM was disabled either **temporarily based on previous user action** or **permanently via site settings**.

### 4.2 One Tap cooldown (GIS)

Google GIS: đóng One Tap (X góc phải) → prompt bị suppress một khoảng thời gian (exponential cooldown khi không FedCM; **khi FedCM bật thì browser tự định nghĩa cooldown**).

Owner: “hiện góc phải → tắt đi → bấm lại không hiện” = đúng UX cooldown.

### 4.3 Vì sao `SkippedReason = unknown_reason`

Google FedCM migration guide: với FedCM, `isSkippedMoment()` vẫn có, nhưng **`getSkippedReason()` không còn cung cấp reason chi tiết**.

→ Log `unknown_reason` **khớp đặc tả FedCM**, không đủ để phân `user_cancel` / `auto_cancel` / `credential_returned` từ app.

### 4.4 Warning GSI về display/skipped moment APIs

Warning Owner thấy (`One Tap prompt UI status methods… FedCM becomes mandatory`) là cảnh báo migration GIS — **không phải root cause**, nhưng xác nhận app đang dùng callback moment APIs trên path FedCM/`prompt`.

---

## 5. Map “lúc được lúc không”

| Trạng thái browser / phiên | Click Google | Kỳ vọng |
|----------------------------|--------------|---------|
| FedCM cho phép + chưa cooldown | `prompt()` | UI góc phải **có thể hiện** (Owner lần 1) |
| User vừa đóng UI → cooldown tạm | `prompt()` lại | UI **không** hiện; console FedCM disabled temporary; NetworkError; skip → toast |
| User / site tắt third-party sign-in vĩnh viễn | `prompt()` | Tương tự, message “permanently via site settings” |
| Safari / non-FedCM có overlay light DOM | `click()` overlay, **không** `prompt` | Không đi cooldown One Tap/`prompt` cùng cách (path khác) |

Automation headless trước đây thường đo được **skip + unknown_reason + toast** ngay — hợp lý nếu môi trường probe **không có** Google session / accounts list empty / FedCM không hiện UI (không phủ nhận Owner session thật lần đầu hiện được).

---

## 6. Phân tách với cause cũ (overlay)

| Cause | Vẫn đúng? | Giải thích gì |
|-------|-----------|----------------|
| Chrome light DOM không có overlay `role=button` | **Có** (đo đối chứng trước) | Vì sao Chrome **không** kích hoạt bằng click proxy như Safari |
| `querySelector == null → return false` (path cũ trước patch `prompt`) | Đúng với **bản trước** fallback | Failure point cũ |
| FedCM cooldown sau khi user tắt UI `prompt` | **Có** (Owner console + docs) | Vì sao **lần 2+** lỗi dù lần 1 đã thấy UI |

Không gộp thành một câu “chỉ do thiếu overlay”.  
Thiếu overlay giải thích **vào path nào**; FedCM disabled/cooldown giải thích **vì sao lần sau `prompt` fail sau khi user đã tắt UI**.

---

## 7. Cái gì **đã xác định** / **chưa**

### Đã xác định (đủ để dừng đoán mò về “lần 2”)

1. Lần fail sau khi tắt UI đi kèm message Chrome **FedCM disabled (temporary previous user action / site settings)**.  
2. Call site là **`prompt` L222**, không phải overlay click.  
3. App map mọi `isSkippedMoment` → toast; reason SDK = `unknown_reason` (đúng giới hạn FedCM).  
4. Pattern “thường chỉ lần đầu” khớp **cooldown sau đóng UI**, không khớp “Chrome hỏng vĩnh viễn một lần”.

### Chưa đo lại trên máy Owner (không cần để kết luận hướng, nhưng chưa có screenshot settings)

* Site `iflux.vn` có nằm trong list “Not allowed to show third-party sign-in prompts” sau khi tắt UI không.  
* Cooldown còn bao lâu trên đúng profile Owner.  
* Lần 1 Owner hoàn tất đăng nhập thành công hay chỉ thấy UI rồi tắt (ảnh hưởng reset cooldown theo GIS: cooldown reset sau **successful** One Tap / button sign-in — nếu chỉ đóng thì không reset).

Các điểm chưa đo **không** làm lung lay nguyên nhân lớp 2 đã có message console nguyên văn.

---

## 8. Tóm tắt một dòng

**Evidence:** sau tương tác lần đầu, Chrome báo FedCM disabled → `prompt()` lần sau skip/`NetworkError` → app toast.  
**Hypothesis (chưa duy nhất):** việc đóng UI tạo cooldown. Cần matrix Incognito/profile (doc 23) để chốt locality.
