# Audit — PromptMomentNotification khi user đóng FedCM UI (Chrome)

**Date:** 2026-07-30  
**Type:** Evidence only · **không sửa code** · **không đề xuất fix**  
**Production:** `auth-social.js?v=googleProxy20260728` · `startGoogleLoginFromUserGesture` · `prompt` L222–236  
**Owner test matrix:** profile cũ / F5 / hard refresh / tab mới / Incognito / profile mới  
**Probe giới hạn:** `.tmp/phase5-task3/exec-path/fedcm-dismiss-lifecycle.json` (CDP `FedCm.enable` — **không** bắt được `dialogShown` vì probe không có Google session → **không** mô phỏng được bấm X)

---

## 0. Nghi ngờ (trả lời thẳng)

Có. Nghi ngờ chính (khớp reviewer):

> Khi user **đóng** FedCM UI, GIS bắn `PromptMomentNotification` mà app đang map vào **`reject(toast)`** — tức **coi hành động đóng của user như lỗi hệ thống**.

Owner bổ sung: toast hiện **ngay khi đóng**, **không cần bấm lần 2**. Đó là evidence mạnh hơn pattern “chỉ lần 2”.

Nghi ngờ phụ (cũng khớp reviewer + Owner matrix):

* Không còn nghi “cache JS / bind sót” (F5 / hard refresh / tab mới vẫn vậy).  
* Không còn đủ “chỉ cooldown profile cũ” (profile **mới** cũng: hiện UI → đóng → toast; Incognito khác vì thường **không** hiện UI lần đầu).

### Bổ sung đối chứng — Chromium probe vs Chrome Guest (2026-07-30)

| Môi trường | Google UI hiện? | Kết quả click |
|------------|-----------------|---------------|
| Agent: **Chromium** Playwright (profile sạch, không session Google) | **Không** | Toast lỗi ngay |
| Owner: **Chrome → Khách (Guest)** (không dùng Profile) | **Không** | Toast lỗi ngay (giống Chromium) |
| Owner: Chrome **Profile** (có / vừa có điều kiện hiện FedCM) | **Có** (lần đầu) | Đóng UI → toast ngay |

**Có bổ sung view:** Có.

* Lỗi “không hiện cửa sổ + toast” **không đặc thù Chromium probe**. Chrome Guest tái hiện **cùng class**.  
* Phân tách hai lớp môi trường:
  * **Không / thiếu điều kiện session Google (Guest, thường Incognito, Chromium sạch)** → `prompt()` **không** mở UI → skip/`NetworkError` → toast.  
  * **Profile có điều kiện hiện UI** → UI hiện → user đóng → toast (nhánh skip→reject đã audit).  
* Hệ quả điều tra: so sánh Chromium vs Chrome Guest **làm mạnh** giả thuyết “phụ thuộc trạng thái Google/FedCM trên browser”, **làm yếu** giả thuyết “chỉ do Playwright dùng sai trình duyệt”. Guest ≠ Profile mới đã đăng nhập Google.

Phần còn lại của tài liệu = audit evidence cho nghi ngờ chính.

---

## 1. Evidence Owner — timeline hành vi

### 1.1 Profile mới (và tương tự profile cũ khi còn “lần đầu”)

```text
click icon Google
  → FedCM / Google UI hiện (góc phải)
  → user đóng UI
  → toast lỗi hiện NGAY (không cần bấm lại)
  → click 2, 3… vẫn toast
```

### 1.2 Sau khi đã đóng / đã lỗi — F5, Ctrl+Shift+R, tab mới, Incognito

Trình tự console (Owner):

1. (có sẵn) `404` resource — **không** gắn stack `prompt`  
2. **Ngay sau click:** GSI warning One Tap status methods / FedCM migration  
3. **Cùng lúc:** `FedCM was disabled either temporarily based on previous user action or permanently via site settings`  
4. **Sau ~0,5–2s:** `[GSI_LOGGER]: FedCM get() rejects with NetworkError: Error retrieving a token`

### 1.3 Locality (Owner)

| Thao tác | Kết quả Owner |
|----------|----------------|
| F5 | Vẫn lỗi (thứ tự console như trên) |
| Hard refresh | Như F5 |
| Tab mới cùng profile | Như F5 |
| Incognito | Như F5 — **không** cứu; thường **không** hiện UI |
| Profile Chrome mới | Như bước 1: **hiện UI → đóng → toast ngay** |
| Chrome **Khách (Guest)** | **Không** hiện UI → toast lỗi ngay (khớp Chromium probe) |

**Loại trừ từ matrix Owner (reviewer Điều 1–2):** biến JS page, event bind sót, DOM chưa reset, cache `auth-social.js`, và giả thuyết “chỉ profile cũ nhớ cooldown”.

---

## 2. Branch Production — cái gì `resolve` / `reject` / no-op

Nguồn live `startGoogleLoginFromUserGesture` — callback `prompt`:

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

| Điều kiện | Hành vi |
|-----------|---------|
| `!notification` | **no-op** |
| `isNotDisplayed() === true` | **`reject`** → toast câu trên |
| `isSkippedMoment() === true` | **`reject`** → toast câu trên |
| `isDismissedMoment()` (mọi giá trị) | **không đọc** → **no-op** trong callback |
| `isDisplayMoment` / `isDisplayed` | **không đọc** → **no-op** |
| Credential `global.__ifxOnGoogleCredential` có `credential` | **`resolve`** (ngoài callback prompt) |
| Timeout 120s | **`reject`** message **khác**: `Đăng nhập Google bị hủy.` |

**Fingerprint toast Owner:**  
`Không mở được cửa sổ Google. Thử trình duyệt khác hoặc cho phép đăng nhập bên thứ ba.`

→ Khớp **duy nhất** nhánh `isNotDisplayed() || isSkippedMoment()` trong `prompt` (không khớp timeout / credential hủy).

---

## 3. Chứng minh: callback nào chạy ngay sau khi user bấm X?

### 3.1 Bằng fingerprint toast + timing Owner (Production thật)

```text
User bấm X / đóng FedCM UI
  → toast câu "Không mở được cửa sổ Google..." hiện NGAY
  → fingerprint = reject trong prompt callback
  → điều kiện bắt buộc: notification.isNotDisplayed() || notification.isSkippedMoment() === true
```

Không có nhánh nào khác trong `prompt` tạo đúng câu toast đó.

`isDismissedMoment` **không** được code đọc — nếu GIS chỉ bắn `dismissed` mà **không** `skipped`/`notDisplayed`, app **không** reject từ callback này.  
Vì Owner **có** toast ngay khi đóng → notification sau X **đã thỏa** `isNotDisplayed || isSkippedMoment`.

### 3.2 Credential callback sau X?

Owner: đóng → toast lỗi, **không** mô tả đăng nhập thành công.  
Trong code: `resolve` chỉ qua `__ifxOnGoogleCredential` có credential.

→ Sau X trong test Owner: **không** có evidence credential callback thành công; flow kết thúc bằng **reject** từ prompt notification.

### 3.3 Display / displayed moment?

Google FedCM migration (GIS): với FedCM, callback **không còn** display moment notifications (`isDisplayMoment` / `isDisplayed` / `isNotDisplayed` / `getNotDisplayedReason` không còn được hỗ trợ như One Tap cũ).

Probe không-UI (Chromium / Chrome channel, không `dialogShown`):

| Field | Giá trị đo |
|-------|------------|
| `getMomentType()` | `skipped` |
| `isSkippedMoment()` | `true` |
| `getSkippedReason()` | `unknown_reason` |
| `isDismissedMoment()` | `false` |
| `isDisplayMoment()` / `isDisplayed()` / `isNotDisplayed()` | `false` |
| `productionReject` | `true` → toast cùng câu |

Stack callback (probe):

```text
prompt.notification
  ← google.accounts.id.prompt (wrapped)
  ← auth-social.js:222
  ← startGoogleLoginFromUserGesture
  ← #btn-google click (bindSocialButtons)
```

### 3.4 CDP dismiss lifecycle — giới hạn đo

Đã bật `FedCm.enable` + chờ `FedCm.dialogShown` rồi `dismissDialog`:

* **`dialogShown` = false`** (probe không có Google account session).  
* **Không** capture được chuỗi `display → … → X` bằng automation trên máy agent.

→ **Không** có timestamp nội bộ máy agent cho “đúng frame user bấm X” trên profile Owner.  
→ Kết luận nhánh reject sau X dựa trên **fingerprint toast Owner + điều kiện code**, không dựa trên CDP dismiss thành công.

### 3.5 Đối chiếu tài liệu GIS (tham chiếu hành vi SDK, không thay Owner log)

GIS JS reference: **Skipped moment** gồm đóng One Tap bởi auto cancel / **manual cancel** / fail issue credential.  
Với FedCM: `isSkippedMoment` vẫn có; `user_cancel` **không** được hỗ trợ trong skipped reason → thường thấy `unknown_reason`.  
`isDismissedMoment` dành cho flow khác (credential returned / `cancel()` / flow restarted) — **app không đọc**.

Báo cáo cộng đồng FedCM (Stack Overflow, non-auto “Continue as…” + bấm X): notification dạng **skipped** + **unknown_reason** + cooldown — **cùng shape** với probe skip và với fingerprint reject của app.

---

## 4. Lifecycle mapping (evidence tối đa hiện có)

### Trường hợp A — Owner: UI hiện rồi đóng (lần đầu profile mới/cũ)

| Bước | Evidence |
|------|----------|
| `prompt()` được gọi | Stack Owner / code L222; UI hiện chứng minh GIS chạy |
| Display moment callback | **Không** quan sát được trên Owner console; theo FedCM migration thường **không** còn |
| User đóng UI (X) | Owner quan sát |
| Notification khiến toast | **Bắt buộc** `isNotDisplayed \|\| isSkippedMoment` (fingerprint toast) |
| `isDismissedMoment` | Code **không** đọc; không có log Owner từng field |
| Credential callback | Không có evidence success |
| Toast | Ngay sau đóng |

### Trường hợp B — Owner: click sau / F5 / Incognito (FedCM disabled)

| Bước | Evidence Owner / probe |
|------|-------------------------|
| `prompt()` | Có (warning GSI từ L222) |
| Console | `FedCM was disabled…` rồi `NetworkError` |
| Notification (probe) | `skipped` + `unknown_reason` → `reject` |
| Toast | Có |

---

## 5. Nguyên nhân (chỉ từ evidence — không solution)

**Nguyên nhân toast ngay khi user đóng FedCM UI:**

```text
User đóng FedCM UI
  → GIS PromptMomentNotification với isSkippedMoment() === true
     (getMomentType: skipped; skippedReason thường unknown_reason dưới FedCM)
  → startGoogleLoginFromUserGesture: if (isNotDisplayed || isSkippedMoment) reject(...)
  → toast: "Không mở được cửa sổ Google..."
```

**Đối chiếu branch:** callback sau đóng **đi vào nhánh `reject(toast)`**, không vào `resolve`, không vào timeout message, không qua xử lý `isDismissedMoment` (vì không có).

**App đang coi điều kiện `isSkippedMoment` (gồm hệ quả đóng / skip FedCM) là lỗi hệ thống** — evidenced bằng map code + toast ngay khi đóng.

**Lần click sau:** console `FedCM was disabled…` + `NetworkError` + cùng nhánh skip → reject — evidenced Owner matrix; **không** cần cache JS.

---

## 6. Việc chưa đo được trên máy agent (nói rõ)

Chưa có file timestamp Owner ghi từng field `isDismissedMoment` / `isSkippedMoment` **đúng frame bấm X** trên Chrome profile có UI.

Muốn đóng nốt gap đó chỉ cần một lần inject log (Owner hoặc phase được mở) — **không** làm trong audit này vì cấm sửa code / không đề xuất fix.

Gap đó **không** làm lung lay fingerprint: toast câu reject-skip **đã** chứng minh nhánh nào chạy sau đóng.
