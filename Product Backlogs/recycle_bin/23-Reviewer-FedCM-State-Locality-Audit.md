# Reviewer Check + Audit: trạng thái FedCM nằm ở browser hay app?

**Date:** 2026-07-29  
**Type:** Review acceptance · state locality audit · **không sửa code**  
**Artifact matrix:** `.tmp/phase5-task3/exec-path/browser-vs-app-state-matrix.json`

---

## 1. Reviewer có hợp lý không?

**Có — hợp lý và đúng chuẩn evidence.**

| Nhận định reviewer | Đánh giá |
|--------------------|----------|
| Chuỗi `prompt → FedCM không hiện → NetworkError → isSkippedMoment → toast` khá chắc | **Đồng ý** — khớp Owner console + audit 20/21 |
| “Chrome không overlay” đúng | **Đồng ý** |
| “App chuyển sang `prompt()`” đúng | **Đồng ý** |
| “FedCM bị disable” đúng theo console | **Đồng ý** — đây là **Evidence** |
| “Chính việc đóng popup tạo cooldown” chưa đủ để kết luận duy nhất | **Đồng ý** — đó là **Hypothesis** hợp lý, chưa chứng minh nhân quả duy nhất |
| Message Chrome là `temporarily OR permanently` — không chứng minh “vì vừa đóng” | **Đồng ý** — doc 22 đã viết quá chắc ở chỗ này |
| Pattern lần đầu hiện UI → đóng → lần sau không hiện = evidence mạnh | **Đồng ý** |
| Cần matrix F5 / Incognito / profile để tách browser vs app | **Đồng ý** — đúng bước tiếp theo |

### Sửa cách ghi (theo reviewer)

**Evidence (đã có):**

```text
FedCM disabled
(+ NetworkError + isSkippedMoment / unknown_reason + toast)
```

**Hypothesis (chưa chứng minh là nguyên nhân duy nhất):**

```text
User đóng popup → cooldown → lần 2 fail
```

Các nguyên nhân **cùng compatible** với message Chrome (chưa loại trừ):

* dismiss One Tap / FedCM UI  
* third-party sign-in bị block  
* site settings  
* Chrome policy / profile  
* account / session state  
* quyết định browser khác  

---

## 2. Audit locality: browser vs app (đã chạy)

Mục tiêu reviewer:

> Chứng minh trạng thái nằm ở browser hay app.  
> F5 / hard reload / tab mới / Incognito / profile mới.

### 2.1 Giới hạn đo automation

Playwright Chromium headless **không tái hiện** pattern Owner (lần đầu hiện UI góc phải).  
Thường fail ngay lần 1 với `Provider's accounts list is empty` + `NetworkError` + `unknown_reason`.

→ Matrix automation **không thay** được test tay Owner trên Chrome có Google session.  
→ Kết quả dưới đây chỉ trả lời: *app có “nhớ” lỗi qua F5/cache không?* trong môi trường probe.

### 2.2 Kết quả matrix (Production `dang-nhap`)

| Thao tác | Toast? | SkippedReason | Ghi chú |
|----------|--------|---------------|---------|
| A1 cùng context · click 1 | Có | `unknown_reason` | accounts empty + NetworkError |
| A2 cùng page · click 2 (không reload) | Có | **`tap_outside`** | Reason **khác** lần 1 — state moment đổi trong session |
| A3 F5 cùng context | Có | `unknown_reason` | F5 **không** “chữa” trong probe |
| A4 reload + bypass cache attempt | Có | `unknown_reason` | Vẫn fail |
| A5 tab mới cùng context | Có | `unknown_reason` | Vẫn fail |
| B1 context mới (Incognito-like) | Có | `unknown_reason` | Vẫn fail (headless, empty accounts) |
| C1 context mới khác | Không (trong cửa sổ chờ) | (không có moment) | `prompt` vẫn được gọi; không kết luận PASS |

### 2.3 Suy ra được gì / không được gì

**Được (hep):**

* App **không** cần “state JS riêng trên page” để tái hiện toast: mỗi click đều gọi lại `prompt()` (`promptDelta: 1`).  
* Fail sau F5 trong probe → **không** giải thích được bằng “biến JS trên page chưa clear”; JS reload rồi vẫn fail → trạng thái fail lần đo này nằm **ngoài** page memory app (browser/FedCM/account/probe env).  
* A2 `tap_outside` chứng minh `getSkippedReason` **đôi khi** cụ thể được — khác `unknown_reason` — tức browser/GIS đang trả reason theo tình huống, app chỉ reject chung.

**Không được (quan trọng):**

* **Không** chứng minh Incognito Owner sẽ PASS (headless B1 cũng fail vì empty accounts).  
* **Không** chứng minh “đóng popup → cooldown” là nguyên nhân duy nhất.  
* **Không** tách được “site settings permanent” vs “temporary previous action” chỉ từ log OR của Chrome.

---

## 3. Checklist còn lại — **Owner chạy tay trên Chrome thật** (bắt buộc để chốt locality)

Sau khi đã thấy UI lần đầu rồi **đóng** (đúng pattern bạn đã gặp):

| Thao tác | Còn lỗi? (ghi Có/Không) | UI Google còn hiện? | Console còn “FedCM was disabled…”? |
|----------|-------------------------|---------------------|-------------------------------------|
| F5 | | | |
| Ctrl+Shift+R (hard refresh) | | | |
| Tab mới cùng profile · `/dang-nhap` | | | |
| Cửa sổ Incognito | | | |
| Profile Chrome mới (hoặc Guest) | | | |
| Reset “Third-party sign-in” cho iflux.vn (icon trái URL bar) rồi thử lại | | | |

**Cách đọc (theo reviewer):**

* Incognito / profile mới **chạy được**, profile cũ sau dismiss **vẫn lỗi** → trạng thái gần như chắc trong **Chrome profile / site FedCM settings**.  
* Incognito **cũng lỗi giống hệt** ngay lần đầu → nghiêng **app / OAuth / cấu hình / path `prompt`**, không chỉ cooldown profile.  
* F5 hết lỗi ngay sau dismiss → nghiêng state **ngắn hạn trên page/session**; F5 vẫn lỗi → nghiêng **browser-persisted** (cooldown/settings), không phải biến app trên DOM.

---

## 4. Errata cho doc 22

Doc `22-Chrome-FedCM-Cooldown-Cause-Evidence.md` cần đọc lại với phân tầng:

| Câu trong 22 | Sau review |
|--------------|------------|
| “lần 2 fail vì user tắt → browser cooldown” | **Hạ xuống Hypothesis** |
| Evidence console FedCM disabled | **Giữ** |
| Chuỗi prompt → skip → toast | **Giữ** |
| Overlay thiếu → vào `prompt()` | **Giữ** |

Không sửa Production code trong bước này.
