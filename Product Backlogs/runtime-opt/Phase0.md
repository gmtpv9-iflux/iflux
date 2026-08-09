# Phase 0 — Baseline (một file kết quả)

**Trạng thái:** ✅ **PASS** — Owner duyệt «đủ làm mốc» · 2026-07-21  
**SoT:** Trình tự tối ưu Runtime (Phase 0 → A → B → C → Gate) §6  
**Freeze:** 2026-07-21 13:14 ICT (06:14 UTC)  
**Môi trường:** Production `User_Web` · https://iflux.vn  
**Quy ước Owner:** Kết quả mỗi Phase = **một file** trong `docs/runtime-opt/`.

> **Không sửa code trong Phase 0.**  
> N0 = Production lúc freeze (đã có thi công A một phần trước đó).  
> File này là **nguồn tư liệu bắt buộc** cho Phase A làm lại từ đầu.

---

## 0. Neo task (đầu mọi Phase)

**Đích:** hoàn thiện tải & sở hữu runtime (đúng thứ tự, đúng chủ, chỉ tải khi cần) → Gate → MR.

| Phase | Mục đích | TT |
|-------|----------|-----|
| **0 Baseline** | Đóng băng mốc so sánh / rollback | **PASS** |
| A App Shell | Nền dùng chung | Làm lại từ đầu (neo N0) |
| B Definition | Nhận diện trang một nguồn | Chưa |
| C Feature | Đường tải Feature riêng | Chưa |
| Gate | Kiểm tra toàn hệ thống | Chưa |

**Tài liệu tham chiếu:** SoT Runtime (bắt buộc) · 80 nội dung đặc thù (tham khảo plan).

---

## 1. Inventory + Owner (freeze)

### 1.1 Trang SoT §12

| # | Trang | Path | Entry Shell N0 |
|---|-------|------|----------------|
| 1 | Nhà của tôi | `/nha-cua-toi` | bootstrap |
| 2 | Thị trường | `/thi-truong` | bootstrap |
| 3 | Cộng đồng | `/cong-dong` | bootstrap |
| 4 | Dòng tiền | `/dong-tien` | bootstrap |
| 5 | Thành viên | `/thanh-vien` | bootstrap |
| 6 | Hỏi đáp | `/hoi-dap` | bootstrap |
| 7 | Tài khoản | `/tai-khoan` | bootstrap + account-feature-boot |
| 8 | Tin nhắn | `/tin-nhan` | bootstrap |
| 9–16 | DS / chi tiết CP, ngành, HST, câu chuyện | slug Việt | bootstrap |
| 17 | Gói cước | `/goi-cuoc` | bootstrap |
| 18 | Tìm kiếm | `/tim-kiem` | bootstrap |
| 19 | Theo dõi | `/theo-doi` | bootstrap |
| 20 | Viết bài CĐ | community write | bootstrap + write-feature-boot |
| 21 | Checkout | account/checkout | bootstrap + checkout-feature-boot |

### 1.2 Ngoài §12 (ghi để không sót)

| File / nhóm | Entry | Ghi chú |
|-------------|-------|---------|
| auth/* | platform-boot legacy | Quyết định trong Phase A: có thuộc Shell không |
| hub.html, stock/comment.html, share | legacy | |
| `chi-tiet.html`, `post.html` (Prod orphan) | platform-boot + tự header-search | Orphan Prod |

### 1.3 Owner theo lớp

| Lớp | Owner đúng | N0 |
|-----|------------|-----|
| App Shell | App Shell | Sitemap bootstrap OK; còn legacy/orphan tự ôm |
| Page Definition | Page / Publish | → B |
| Page Feature | Feature trang | CORE_TIERS → C |
| Widget | Widget Runtime RL-1.0 | Không đụng A |

| ID Shell | Owner thực tế N0 |
|----------|------------------|
| AS-BOOT | ✓ Sitemap; legacy lệch |
| AS-SEARCH | ✓ shell-boot; ✗ orphan HTML tự gắn |
| AS-HEADER/NAV/BRAND | ✓; brand sync runtime |
| AS-USER-MENU / NOTIF / HDR-MSG | Trong một `iflux-web-ui.js` |
| AS-MKT-STATUS | Inject mọi topnav |
| AS-ENT-STACK | Shell nạp; Feature request templates lần 2 |

### 1.4 Số lượng file

| Kho | Số |
|-----|---:|
| JS `iflux-web-ui/` | 188 |
| CSS `iflux-web-ui/` | 19 |
| HTML có bootstrap | 22 |
| HTML còn platform-boot trực tiếp | 9 |

| File Shell (HTTP bytes) | Size |
|-------------------------|-----:|
| bootstrap.js | 10 818 |
| shell-boot.js | 5 671 |
| iflux-platform-boot.js | 31 761 |
| iflux-web-ui.js | 59 134 |
| iflux-header-search.js | 18 137 |
| iflux-guest-shell.js | 5 697 |
| block-templates.js | 42 233 |
| app-shell.css | 33 940 |

### 1.5 Hai mốc bằng chứng

| Mốc | Nguồn | Dùng |
|-----|-------|------|
| Pre-A (lịch sử) | PhaseA Audit cũ (nếu còn) | Tham khảo lịch sử |
| **N0** | **File này (PASS)** | **Nguồn bắt buộc cho Phase A làm lại** |

---

## 2. Dependency graph (freeze)

```text
App Shell (bootstrap → shell-boot → platform/auth/entitlements/guest/search/web-ui)
    ↓
Page Definition (manifest / PagePublished / page-runtime)
    ↓
Page Feature (composite CORE_TIERS / *-feature-boot)

Widget Pipeline (RL-1.0) — độc lập Placement
```

### Shell thực tế N0

```text
HTML → bootstrap.js
  → shell-boot:
      platform-boot (+ inject market-status-bar)
      api-bundle → auth
      layers / entitlements / plans
      block-templates → widget-shell → paywall → gate
      guest-shell → AppShellHeader.render
      header-search (nếu có slot)
      web-ui (chỉ login) → idle notif / messages / insight / onboarding / pricing
  → trang thường: page-runtime + manifest
  → account|checkout|write: iflux-shell-ready → *-feature-boot
```

| Từ | Được phép | Thực tế N0 | Lệch |
|----|-----------|------------|------|
| Shell | Shell | Sitemap OK | Legacy tự platform-boot |
| Definition | Shell | sau Shell | Title cứng → B |
| Feature | Shell+Def | không còn load Search (composite) | vẫn request block-templates ×2 |
| Widget | Widget RT | RL-1.0 | — |

**Cạnh mở:** legacy tự ôm Shell · templates request kép · WebUI một bundle · Guest actions xoá slot Search · file `shell-boot.js` thừa ngoài `runtime/` trên Prod.

---

## 3. Loading graph (freeze)

```text
1. HTML (CSS + topnav)
2. bootstrap.js
3. shell-boot stack
4. Search nếu có slot
5. WebUI nếu login
6. GuestShell.bootstrapPage
7a. manifest → page-runtime → composite
7b. shell-only → feature-boot
```

**Mẫu Cộng đồng (khách):** Search ×1 · block-templates ×2 · FCP ~376 ms · Resources 73 · JS 41.

---

## 4. Performance baseline (freeze)

### Curl HTML

| Path | TTFB (s) | Total (s) | Size |
|------|----------:|----------:|-----:|
| `/cong-dong` | 0.40 | 0.40 | 2 495 |
| `/nha-cua-toi` | 0.37 | 0.37 | 2 695 |
| `/thi-truong` | 0.46 | 0.46 | 2 492 |
| `/dong-tien` | 0.21 | 0.21 | 2 487 |
| `/tai-khoan` | 0.22 | 0.23 | 37 789 |

### Browser Cộng đồng khách

| Chỉ số | Giá trị |
|--------|--------:|
| TTFB / DCL / Load | ~261 / 331 / 422 ms |
| FCP | ~376 ms |
| Resources / JS / CSS | 73 / 41 / 23 |
| header-search × | 1 |
| block-templates × | 2 |

---

## 5. Acceptance Phase 0 — PASS

- [x] Đủ nội dung SoT §6 (một file)  
- [x] Có ngày giờ / phạm vi trang freeze  
- [x] **Owner duyệt «đủ làm mốc»** — 2026-07-21  

**Bước tiếp:** Phase A làm lại từ đầu · neo tư liệu Phase 0 · xem `PhaseA.md`.
