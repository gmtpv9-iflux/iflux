# Audit PromptMomentNotification — Production

**Date:** 2026-07-29  
**Type:** Mapping callback → hành vi · **không sửa code** · **không đưa solution**  
**Production:** `auth-social.js?v=googleProxy20260728` · `startGoogleLoginFromUserGesture` → `google.accounts.id.prompt(notification => …)`  
**Artifact đo:** `.tmp/phase5-task3/exec-path/prompt-moment-notification-audit.json`  
**Môi trường đo:** Chromium headless · `https://iflux.vn/dang-nhap` · 1 click `#btn-google`

---

## 1. Phạm vi

Khi callback `prompt(notification)` chạy trên Production:

* Ghi đủ field `PromptMomentNotification` (SDK có).
* Map từng branch trong code → **resolve** / **reject** / **không làm gì**.
* Không sửa code. Không đề xuất fix.

---

## 2. Code callback trên Production (toàn bộ nhánh trong `prompt`)

Nguồn: `startGoogleLoginFromUserGesture` — đoạn `google.accounts.id.prompt(function (notification) { … })`:

```js
google.accounts.id.prompt(function (notification) {
  if (!notification) return;
  if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
    if (settled) return;
    settled = true;
    global.__ifxOnGoogleCredential = null;
    clearTimeout(timer);
    reject(
      new Error(
        'Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba.'
      )
    );
  }
});
```

**Không** đọc trong callback:

* `isDisplayMoment()` / `isDisplayed()`
* `getNotDisplayedReason()`
* `getSkippedReason()`
* `isDismissedMoment()` / `getDismissedReason()`
* `getMomentType()`

---

## 3. Mapping callback → hành vi Promise

| Điều kiện trong `prompt` callback | Hành vi Promise | Ghi chú |
|-----------------------------------|-----------------|---------|
| `!notification` | **Không làm gì** (`return`) | Promise vẫn pending (chờ credential hoặc timeout 120s) |
| `isNotDisplayed() === true` (dù skip false) | **reject** | Message toast cửa sổ Google |
| `isSkippedMoment() === true` (dù notDisplayed false) | **reject** | Cùng message; **không** đọc `getSkippedReason()` |
| `isNotDisplayed() \|\| isSkippedMoment()` đã true nhưng `settled === true` | **Không làm gì** | Guard chống double-settle |
| Mọi trường hợp còn lại trong callback (display / dismiss / …) | **Không làm gì** trong callback | Không `resolve`, không `reject` tại đây |

### Resolve / reject **ngoài** callback `prompt` (cùng Promise)

| Nguồn | Hành vi |
|-------|---------|
| `global.__ifxOnGoogleCredential` nhận `response.credential` | **resolve** (qua `finishSocialLogin`) |
| `__ifxOnGoogleCredential` thiếu credential | **reject** (`Đăng nhập Google bị hủy.`) |
| `setTimeout` 120s, chưa settled | **reject** (`Đăng nhập Google bị hủy.`) |
| Overlay click path (`activate === true`) — không vào `prompt` | Promise chờ credential / timeout (không reject ngay từ `prompt`) |

**Kết luận mapping:** Trong callback `prompt`, **không có branch nào `resolve`**. Chỉ có **reject** (notDisplayed / skipped) hoặc **no-op**.

---

## 4. Snapshot đo được khi callback chạy (Chrome · Production)

`promptCalls: 1` · `momentCount: 1` · toast xuất hiện sau reject.

| Field | SDK có method? | Giá trị đo |
|-------|----------------|------------|
| `isDisplayMoment()` | Có | `false` |
| `isDisplayed()` | Có | `false` |
| `isNotDisplayed()` | Có | `false` |
| `getNotDisplayedReason()` | Có | `undefined` (method trả về `undefined`) |
| `isSkippedMoment()` | Có | **`true`** |
| `getSkippedReason()` | Có | **`unknown_reason`** |
| `isDismissedMoment()` | Có | `false` |
| `getDismissedReason()` | Có | `undefined` |
| `getMomentType()` | Có | **`skipped`** |

`protoMethods` trên object notification (GIS):

`getMomentType`, `isDisplayMoment`, `isDisplayed`, `isNotDisplayed`, `getNotDisplayedReason`, `isSkippedMoment`, `getSkippedReason`, `isDismissedMoment`, `getDismissedReason`

### Branch Production đã đi (lần đo này)

```text
isSkippedMoment() === true
  → reject(toast)
  → "Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba."
```

`getSkippedReason()` **có sẵn trên SDK** và trả về **`unknown_reason`**, nhưng **code Production không đọc** field này trước khi reject.

---

## 5. SkippedReason — đúng thông tin cần cho bước sau

Log đủ cho lần đo Chrome hiện tại:

```text
getMomentType:     skipped
isSkippedMoment:   true
SkippedReason:     unknown_reason
```

Không phải (trên lần đo này):

* `auto_cancel`
* `user_cancel`
* `credential_returned`

Console liên quan cùng lần đo (không phải field notification, chỉ ngữ cảnh):

* `Provider's accounts list is empty.`
* `[GSI_LOGGER]: FedCM get() rejects with NetworkError: Error retrieving a token.`

---

## 6. Tóm tắt mapping (một dòng)

```text
prompt(notification)
  → momentType=skipped
  → isSkippedMoment=true
  → getSkippedReason=unknown_reason   ← SDK trả; app không đọc
  → code: skip ⇒ reject(toast)
  → resolve: không xảy ra trong callback prompt
```
