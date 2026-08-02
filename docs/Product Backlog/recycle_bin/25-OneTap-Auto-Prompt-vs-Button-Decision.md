# Quyết định hướng — One Tap tự hiện + Button (không code)

**Date:** 2026-07-30  
**Type:** Architecture decision support · **Owner đã khóa · đã implement Production**  
**SoT hành vi mong muốn (Owner):** Vào `/dang-nhap` → nếu đủ điều kiện thì **One Tap tự hiện**; nếu không hiện thì user vẫn đăng nhập qua **nút Google GIS**.  
**Khóa UX:** GIS `renderButton` visible · cấm icon custom → JS proxy · Apple/FB/Zalo giữ tạm. Chi tiết: `26-Google-SignIn-Target-Architecture.md`.

---

## 1. Reviewer vs Google docs — đồng ý đến đâu?

| Nội dung | Kết luận |
|----------|----------|
| One Tap ≠ Sign in with Google Button (hai flow) | **Fact** Google |
| One Tap nên hiện **tự động** (page load / window event), **không** nên gắn user gesture | **Fact** Google (warning) |
| Button **phải** do user gesture; GIS **không** có API gọi programmatic button flow | **Fact** Google |
| “Cấm `prompt()` sau click” | **Suy luận** — Google không viết cấm; nhưng Google **cảnh báo UX gãy** nếu One Tap gắn gesture (opt-out / cooldown / no session → user bấm mà không thấy UI) |
| Production dùng `prompt()` sau click = bug gốc duy nhất | **Chưa** — đó là **lệch mô hình khuyến nghị** + đã chứng minh gây toast/skip; chưa phải “API cấm” |

**Đồng ý reviewer:** cần tách fact / suy luận; đừng khẳng định “cấm prompt sau click”.  
**Bổ sung từ evidence iFlux:** gắn `prompt()` vào click **đã** tạo đúng class lỗi Google cảnh báo (Guest/cooldown/empty session → bấm icon → không UI → toast).

---

## 2. Audit kiến trúc Production (đã kiểm)

### Câu 1 — Page load có gọi `prompt()` không?

**Không.**

```text
initPage
  → ensureOffscreenGoogleActivator
      → initialize(...)
      → renderButton(#ifx-google-auth-proxy offscreen)
  → bindSocialButtons
```

Không có `google.accounts.id.prompt()` lúc load.

### Câu 2 — Có Sign in with Google Button chuẩn GIS không?

**Có `renderButton`, nhưng không phải nút user nhìn thấy.**

* GIS `renderButton` → `#ifx-google-auth-proxy` (offscreen, ẩn).  
* UI user thấy: `#btn-google` **custom** (DS icon).  
* Click custom → `clickOffscreenGoogleActivator` (giả lập click nút GIS) **hoặc** fallback `prompt()`.

Google: *Using your own button is not supported* (không có API initiate button flow khi click nút riêng).  
Production đang **tự điều phối**: custom icon + offscreen button ± One Tap `prompt` khi thiếu overlay.

### Mô hình hiện tại vs Google khuyến nghị

```text
Google khuyến nghị:
  Page load → prompt() One Tap (nếu được)
  + Nút GIS thật → user gesture → Button flow

Production hiện tại:
  Page load → KHÔNG prompt(); chỉ renderButton offscreen
  User click icon DS → click offscreen  HOẶC  prompt()   ← One Tap gắn gesture
```

→ Khác mô hình tài liệu. **Đây là lệch kiến trúc**, không chỉ “callback sai”.

---

## 3. Nên làm gì tiếp? (không đào thêm PromptMomentNotification)

Đã đủ để **chốt hướng sản phẩm**. Việc còn lại là **chốt UX/ownership**, không cần audit callback thêm.

Cần Owner chốt 2 quyết định trước khi code:

### Quyết định P1 — One Tap lúc vào trang

Owner muốn: **tự hiện**.  
→ Khớp Google: `prompt()` trên **page load** (sau `initialize`), không gắn `#btn-google`.

Khi không hiện (Guest, opt-out, cooldown, empty session): **im lặng** — không toast lỗi hệ thống.

### Quyết định P2 — Nút “Đăng nhập Google” khi One Tap không hiện / user chủ động

Phải là **Button flow**, không phải `prompt()` lần nữa trên click.

Ba phương án (trade-off):

| Phương án | Làm gì | Ưu | Nhược |
|-----------|--------|----|-------|
| **B1 — GIS button visible** | Hiện nút do `renderButton` (style GIS gần DS nhất có thể) | Đúng API Google; FedCM button ổn định hơn One Tap-on-click | Icon DS hiện tại có thể đổi / lệch brand một phần |
| **B2 — Giữ icon DS + offscreen GIS button** | Chỉ `click()` overlay/iframe activator; **cấm** `prompt()` trên click | Giữ UI DS | Chrome FedCM thường **không** có overlay → path này đã fail; cần chứng minh activator Chrome (vd. `use_fedcm_for_button`, DOM mới) **trước** khi chọn B2 là primary |
| **B3 — OAuth / popup ngoài GIS button API** | Click icon → flow OAuth riêng | Toàn quyền UI | Lệch GIS web button; thêm surface bảo mật/redirect |

**Khuyến nghị kỹ thuật (agent):** **P1 + B1** (hoặc B1 thu nhỏ cạnh hàng social).  
B2 chỉ giữ nếu audit Chrome chứng minh click activator FedCM ổn định — hiện evidence ngược lại.  
Không khuyến nghị tiếp tục **click → `prompt()`** làm đường chính.

### Quyết định P3 — Callback One Tap

Khi One Tap (load hoặc nếu còn fallback):

* `isSkippedMoment` / user đóng → **không** toast “Không mở được cửa sổ Google…”  
* Toast chỉ cho lỗi cấu hình / mạng / backend thật sự  

(Chi tiết message = implement sau khi P1/P2 chốt.)

---

## 4. Giải pháp đề xuất (mô hình đích)

```text
Page load /dang-nhap
  → initialize (GIS)
  → prompt()                    ← One Tap tự hiện nếu đủ điều kiện
  → nếu skip / không hiện       ← im lặng (không lỗi hệ thống)
  → renderButton (nút GIS thấy được, hoặc vùng Google chuẩn)

User chủ động
  → tương tác nút GIS Button    ← Button flow (gesture thật trên nút Google)
  → KHÔNG gọi prompt() từ #btn-google custom như One Tap giả
```

Khớp:

* Mong muốn Owner (“tab tự hiện”)  
* Mô hình Google (One Tap + Button song song)  
* Evidence bug hiện tại (prompt-on-click + skip→toast + FedCM disabled sau đóng)

---

## 5. Việc **không** cần làm thêm trước khi chốt

* Đào thêm `isSkippedMoment` / fingerprint toast — đã đủ.  
* Kết luận “Google cấm prompt sau click” — không có câu đó trong docs.  
* OAuth Console sâu làm root cause chính — UI đã hiện trên Profile có session → client/origin đủ để One Tap chạy; lệch nằm ở **orchestration flow**.

---

## 6. Chờ Owner chốt (rồi mới code)

1. **P1:** Bật One Tap tự hiện trên `/dang-nhap` — **Có** (Owner đã nghiêng Có)?  
2. **P2:** Nút thủ công = **B1** (GIS button) / **B2** (giữ icon + offscreen) / **B3** (OAuth)?  
3. **P3:** Skip/đóng One Tap = không toast lỗi hệ thống — **Có**?

Sau khi chốt 1–3 → Impact Analysis + implement trên Production theo Engineering Change Governance.
