# Account Page — Wave A Cleanup · Exit Evidence

**Route:** https://iflux.vn/tai-khoan  
**Wave:** A — Cleanup (ít rủi ro)  
**Ngày:** 2026-07-28  
**Phạm vi:** Xóa rác / demo HTML · **không** đổi kiến trúc boot · **không** đổi ownership SoT

---

## 1. Mục tiêu Wave A

| Làm | Không làm (wave sau) |
|-----|----------------------|
| Xóa HTML demo / file chết | Giảm `FEATURE_SCRIPTS` (Wave C) |
| Xóa toast fake / stub giả thành công | localStorage scope · server SoT owner (Wave B) |
| Xóa `$284.50` và persona demo | Bind DOM payout / security thật (Wave B) |
| Gỡ `ensureSeed()` affiliate (P1) | Lazy load · preload · defer (Wave C) |

---

## 2. Thay đổi đã ship

### 2.1 File xóa

| File | Lý do |
|------|--------|
| `User_Web/account/profile-panels.html` | Không có reference trong repo · bản hub IA cũ · chứa `$284.50` + demo affiliate |

### 2.2 `User_Web/account/profile.html`

| Trước | Sau |
|-------|-----|
| Nút **Rút hoa hồng** → `ixToast('Yêu cầu rút tiền đã gửi!')` | `disabled` · title «Đang triển khai» |
| Tab **Bảo mật** · Lưu mật khẩu → toast fake thành công | Form + nút `disabled` · copy «Tính năng đang được triển khai» |
| 2FA chip **Đã bật** + nút Tắt → toast fake | Chip **Chưa triển khai** · nút `disabled` |
| Nút **Xuất** hoa hồng (không handler) | `disabled` · title «Đang triển khai» |
| Placeholder affiliate `$284.50` | Đã xóa cùng `profile-panels.html` · `profile.html` dùng `—` + bind API (P0) |

### 2.3 P1 (cùng chuỗi cleanup · đã deploy trước Wave A HTML)

| File | Thay đổi |
|------|----------|
| `loyalty-affiliate-store.js` | Xóa `ensureSeed()` · purge demo legacy · API replace events |
| `profile-affiliate.js` | Bỏ `reconcileReferralCommissions()` trong paint |
| `subscription-orders-store.js` | `reconcileReferralCommissions()` no-op khi `useApi()` |

**Cache bust:** `affWaveA_20260728` (`profile.html`)

---

## 3. Regression checklist (Wave A)

| # | Kiểm tra | Kỳ vọng | Kết quả |
|---|----------|---------|---------|
| R1 | Mở `/tai-khoan` đã đăng nhập | Trang load · không 404 script | ⬜ |
| R2 | Tab **Affiliate** | Loading → dữ liệu API · không số demo | ⬜ |
| R3 | Tab **Thanh toán** | Form hiện · Lưu vẫn hoạt động (`profile-my-page`) | ⬜ |
| R4 | Tab **Quyền riêng tư** | Toggle + Lưu · toast thật từ JS | ⬜ |
| R5 | Tab **Bảo mật** | Không toast fake khi bấm nút | ⬜ |
| R6 | Bấm **Rút hoa hồng** | Nút disabled · không toast | ⬜ |
| R7 | `profile-panels.html` | 404 (đã xóa) | ⬜ |
| R8 | Console | Không lỗi boot / missing import mới | ⬜ |
| R9 | Mobile bottom nav account | Tab chuyển bình thường | ⬜ |

**PASS Wave A** khi R1–R9 ✅ · không regression tab / shell.

---

## 4. Wave tiếp theo (chưa mở)

### Wave B — Ownership / SoT
- Scope localStorage affiliate theo `userId`
- Wire **Rút hoa hồng** → `affiliate-payout-ui.js` + API
- Tab **Bảo mật** → API đổi mật khẩu / 2FA
- Một owner bind DOM mỗi tab

### Wave C — Performance
- Giảm `FEATURE_SCRIPTS` (community · stock · chat · admin bundle)
- Lazy load theo tab
- Preload / defer boot

---

## 5. Applicable SoT

- [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md) — cleanup trước · không trộn wave
- [`docs/SoT — iFlux Product Architecture (V2).md`](../../SoT%20—%20iFlux%20Product%20Architecture%20(V2).md) — `/tai-khoan` account route

---

*Wave A = diff xóa > thêm · boot sequence giữ nguyên.*
