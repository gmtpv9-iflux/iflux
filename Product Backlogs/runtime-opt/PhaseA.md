# Phase A — App Shell (một file kết quả · làm lại từ đầu)

**Trạng thái:** ✅ **PASS** (Owner 2026-07-21) · Runtime Shell toàn trang bổ sung 2026-07-21d  
**Ngày lập:** 2026-07-21 · **Deploy:** `?v=phaseA20260721d` (fix detectPageKey Viết bài) · **Exit:** 2026-07-21  
**Môi trường bằng chứng:** Production `https://iflux.vn`  
**Quy ước:** Một file / Phase · Chuỗi: Plan → Implementation → Verification → Acceptance → Exit → PASS  
**Verification bắt buộc A:** HTML Entry (toàn trang) + **Runtime Shell** (toàn trang) · Runtime Feature = không (C/Gate)  
**Ghi chú Owner:** trước Gate — OI-RT-MOUNT (mount counters); giữ Open Issues.

---

## 0. Neo task + tài liệu (đầu Phase — bắt buộc)

### Đích task tổng thể
Hoàn thiện tải & sở hữu runtime: đúng thứ tự · đúng chủ · chỉ tải khi cần → Gate → MR.

### Hành trình

| Phase | Mục đích | TT |
|-------|----------|-----|
| 0 Baseline | Đóng băng mốc | **PASS** · `Phase0.md` |
| **A App Shell** | Nền dùng chung — trang chỉ *consume* | **PASS** · `PhaseA.md` |
| B Definition | Nhận diện trang một nguồn | **Plan v2** · `PhaseB.md` (Overview + Gap) |
| C Feature | Đường tải Feature riêng | Chưa |
| Gate | Kiểm tra toàn hệ thống | Chưa · nhận Open Issues từ A |

### Tài liệu tham chiếu

| Vai trò | Tài liệu |
|---------|----------|
| **Nguồn sự thật phải tuân thủ** | SoT — Trình tự tối ưu Runtime (Phase 0 → A → B → C → Gate) |
| **Tư liệu bắt buộc từ Phase 0** | `docs/runtime-opt/Phase0.md` (N0 PASS) |
| **Tham khảo lập plan** | 80 nội dung đặc thù — Owner (không tối ưu Page/Feature/Widget trong A) |

### Vì sao làm lại từ đầu
Thi công A trước khi có Phase 0 PASS → Production N0 **nửa vời**. Làm tiếp trên nửa vời chỉ khoét gap.  
**Nguyên tắc A mới:** coi N0 là hiện trạng thật · Catalog/Audit/Plan viết lại sạch · **không** coi Critical cũ «đã xong». Thi công chỉ sau duyệt Plan mới.

### Invariant Phase A
`One Object → One Owner → One Entry → One Runtime`

### Scope Boundary

| | Nghĩa | Phase A |
|--|-------|---------|
| **Allowed** | Được sửa | App Shell Objects · Infra phục vụ Shell · Resource Shell |
| **Not Allowed** | Không được sửa | Page Definition · Page Feature · Widget Pipeline/Runtime |

### Out of Scope (khác Not Allowed)
Thấy vấn đề nhưng **cố tình bỏ qua** trong A:

- Không refactor kiến trúc Feature  
- Không đổi Widget Runtime  
- Không migrate Definition  
- Không tối ưu Business Logic  
- Không đổi API Contract  
- Không cắt CORE_TIERS Feature (để Phase C) — A chỉ **guard** phía Shell nếu cần  

**Không thêm hardcode mới khi chưa Human phê duyệt.**

---

## 1. Inventory — App Shell Catalog (neo N0)

Nguồn: Phase0 §1.3 + đối chiếu Production 2026-07-21.

| ID | Object | Owner đúng | Entry thực tế N0 | Lazy? | Ghi chú N0 |
|----|--------|------------|------------------|-------|------------|
| AS-BOOT | Runtime Bootstrap | App Shell | `bootstrap.js` → `shell-boot.js` trên 22 HTML | Không | Chuẩn Sitemap; legacy còn lệch |
| AS-PLATFORM | Platform Boot | App Shell | shell-boot nạp `iflux-platform-boot.js` | Không | Inject Market Status |
| AS-API | API Client | App Shell | `iflux-api-bundle.js` | Không | |
| AS-AUTH | Auth phiên | App Shell | `auth.js` | Không | |
| AS-ENT-STACK | Entitlements + templates + gate… | App Shell | shell-boot stack | Không | Feature vẫn request `block-templates` lần 2 |
| AS-GUEST | Guest Shell | App Shell | `iflux-guest-shell.js` | Không | `renderGuestActions` có thể xoá slot Search |
| AS-HEADER | Topnav markup | App Shell | HTML copy mỗi trang | Không | Chưa single markup |
| AS-NAV | Menu chính | App Shell | `IfluxAppShellHeader` | Không | |
| AS-BRAND | Logo link | App Shell | HTML + syncBrandHref | Không | N0: login→Nhà · khách→`/cong-dong` |
| AS-SEARCH | Ô tìm header | App Shell | **shell-boot** khi có slot | Có slot | Orphan HTML vẫn tự gắn; Guest có thể mất slot |
| AS-USER-MENU | Menu user | App Shell | `iflux-web-ui.js` (login) | Login | Bundle chung |
| AS-NOTIF | Chuông | App Shell | idle WebUI | Idle login | |
| AS-HDR-MSG | Tin nhắn header | App Shell | idle + `profile-chat-store` | Idle login | Nặng — chưa lazy-on-open |
| AS-LOGIN-CTA | Nút Đăng nhập | App Shell | Guest actions | — | |
| AS-LOGIN-FLOW | Luồng đăng nhập | App Shell | auth HTML legacy | — | auth/* chưa bootstrap |
| AS-PRICING-MODAL | Pricing modal | App Shell | idle WebUI | Idle | |
| AS-ONBOARD | Onboarding | App Shell | idle WebUI | Idle | |
| AS-ONE-TAP | Google One Tap | App Shell | idle WebUI | Idle | |
| AS-INSIGHT | Insight Share | App Shell | idle WebUI | Idle | |
| AS-BUG | Bug report | App Shell | WebUI | — | |
| AS-MKT-STATUS | Market status bar | App Shell | inject mọi topnav | Async | Policy: giữ (Phase0) |
| AS-CSS-SHELL | `app-shell.css` | App Shell | HTML | Không | |
| AS-FOOTER / TOAST / LOADING / LANG / CMD | — | — | Không / chưa thống nhất | — | Low — không làm trừ Owner thêm Catalog |

**Infra (không phải UI object):** BOOT, PLATFORM, API, AUTH, ENT-STACK.  
**Resource ≠ Object:** CSS/JS gắn đúng object.

---

## 2. Audit mọi trang (neo Phase0 §1.1–1.2)

Ký hiệu: ✓ ổn · ✗ backlog · ◐ lệch một phần · — không áp dụng

### 2.1 Sitemap §12 / sản phẩm (bootstrap)

| Trang | Boot | Header/Nav | Brand | Search Entry | WebUI path | Ghi chú |
|-------|------|------------|-------|--------------|------------|---------|
| Nhà | ✓ | ✓ | ✓ sync | ✓ shell nếu slot | login | |
| Thị trường | ✓ | ✓ | ✓ | ✓ | login | |
| Cộng đồng | ✓ | ✓ | ✓ khách `/cong-dong` | ✓ ×1; Guest có thể mất slot | — khách | templates ×2 |
| Dòng tiền | ✓ | ✓ | ✓ | ✓ | login | templates trong CORE |
| Thành viên | ✓ | ✓ | ✓ | slot? | login | |
| Hỏi đáp | ✓ | ✓ | ✓ | slot? | — | |
| Tài khoản | ✓ + feature-boot | ✓ | ✓ | ✓ | login | Feature tách Entry — **chưa verify Regression** |
| Tin nhắn | ✓ | ✓ | ✓ | slot? | login | |
| DS/CT CP·ngành·HST·câu chuyện | ✓ | ✓ | ✓ | ✓ (nếu slot) | login | |
| Gói cước | ✓ | ✓ | ✓ | ✓ | — | |
| Tìm kiếm / Theo dõi | ✓ | ✓ | ✓ | slot? | login | |
| Viết bài / Checkout | ✓ + feature-boot | ✓ | ✓ | ✓ | login | Cùng pattern Account |

### 2.2 Ngoài Sitemap — legacy / orphan (Phase0 §1.2) → **sau thi công R1–R6**

| Trang | Boot | Search | Kết quả |
|-------|------|--------|---------|
| auth/login·register·forgot·otp | ✓ `runtime/auth-*-boot.js` (Shell Entry tối thiểu) | — | **PASS** R3=A |
| hub.html | **đã xóa** · nginx `301 → /nha-cua-toi` | — | **PASS** R2a=A2 |
| stock/comment.html | ✓ bootstrap + `stock-comment-feature-boot` | Shell | **PASS** R2b=B1 · backlog URL Việt |
| share/`/chia-se` | ✓ bootstrap + `share-feature-boot` | Shell | **PASS** R2c=C1 · URL giữ |
| chi-tiet.html · post.html (Prod) | **đã xóa** · nginx `301 → /cong-dong` | — | **PASS** R1=A |
| `iflux-web-ui/shell-boot.js` (ngoài runtime/) | **đã xóa** trên Prod | — | **PASS** C4 |

### 2.3 Kết luận Audit (sau thi công)
- Critical C1–C4: **đã xử lý** theo R1–R3.  
- High H1 (Guest Search slot) · H3 (Messages lazy): **đã xử lý** trong A.  
- H2 templates ×2 · H4 WebUI bundle · H5 verify sâu · M5 header markup: **Owner chấp nhận defer** (R4/R5) hoặc Phase C.

---

## 3. Backlog (từ Audit N0)

### Critical — đã đóng sau thi công

| ID | Object | TT |
|----|--------|-----|
| C1 | Orphan `chi-tiet` / `post` | **Đóng** R1=A · xóa Prod · 301 `/cong-dong` |
| C2 | Legacy hub / comment / share / auth | **Đóng** R2a/R2b/R2c/R3 |
| C3 | Multi-path Search trên orphan | **Đóng** (orphan hết) |
| C4 | `shell-boot.js` thừa | **Đóng** · chỉ còn `runtime/shell-boot.js` |

### High

| ID | Object | Vấn đề |
|----|--------|--------|
| H1 | AS-SEARCH | **Đóng** — Guest giữ `[data-ifx-header-search]` khi render Login CTA |
| H2 | AS-ENT-STACK | `block-templates` ×2 — **defer Phase C** (cắt CORE) |
| H3 | AS-HDR-MSG | **Đóng** — lazy `profile-chat-store` khi click Messages |
| H4 | AS-WEB-UI | **Defer** R4=A — không tách bundle trong A |
| H5 | AS-BOOT | Account/Checkout/Write — smoke HTTP OK · UI Regression Owner xác nhận |

### Cleanup backlog (ngoài A · ghi nhận)

| ID | Mục | Ghi chú |
|----|-----|---------|
| BL-URL-COMMENT | Pretty URL Việt cho bình luận CP | Giữ `/User_Web/stock/comment.html` · sau: vd `/co-phieu/{ticker}/binh-luan/{id}` · **không 301 trong A** |

### Medium

| ID | Object | Vấn đề |
|----|--------|--------|
| M1 | AS-BOOT | `?v=` đã gần thống nhất — khóa một version khi thi công lại |
| M2 | AS-MKT-STATUS | Giữ inject mọi topnav (khuyến nghị Phase0 / plan cũ) |
| M3 | AS-INSIGHT/ONBOARD/ONE-TAP | Idle — giữ ngoài critical path; siết điều kiện nếu thiếu |
| M4 | AS-PRICING-MODAL | Chỉ khi cần / idle đã có — chốt policy |
| M5 | AS-HEADER | Markup copy mỗi HTML — ngắn hạn ổn định slot; dài hạn single source (defer) |
| M6 | Verify | Smoke §12 + `/tai-khoan` chưa đủ cho Regression = 0 |

### Low

| ID | Object | Vấn đề |
|----|--------|--------|
| L1–L5 | Footer/Toast/Loading/Lang/Cmd | Không làm trừ Owner thêm Catalog |

### Ngoài A (Phase C / B / Gate)

| Ghi chú | Phase |
|---------|-------|
| Cắt CORE_TIERS Feature | C |
| Title/SEO hardcode | B |
| Widget Placement | Gate / RL-1.0 |

---

## 4. Optimization Plan (theo đối tượng · neo N0)

**Thứ tự thi công (sau duyệt):** Critical → High → Medium → Low (nếu có).

### P1 — Đóng One Entry Shell (C1–C4, C2)
1. Xử lý orphan Prod `chi-tiet.html` / `post.html`: gỡ tự Search + đưa về bootstrap **hoặc** xóa/redirect nếu dead (Owner chốt).  
2. Legacy hub / comment / share: về bootstrap Shell Entry **hoặc** loại khỏi phạm vi sản phẩm (Owner chốt).  
3. Auth/*:  
   - **Khuyến nghị:** thuộc AS-LOGIN-FLOW — Entry Shell thống nhất (bootstrap shell-only hoặc shell-boot classic tối thiểu) **không** viết lại Feature auth.  
   - Hoặc Owner ghi Out of Scope có chủ đích.  
4. Xóa bản `iflux-web-ui/shell-boot.js` thừa (chỉ giữ `runtime/shell-boot.js`).

### P2 — Search hoàn chỉnh (H1 + invariant)
1. Shell là **duy nhất** nạp/init Search khi có slot.  
2. Guest: **không** xoá slot Search khi render Login CTA (giữ slot + nút Đăng nhập).  
3. Trang không có Search: không tải script.

### P3 — Entitlements / templates (H2)
1. Giữ guard `IfluxBlockTemplates` (đã có).  
2. Verify không execute hai lần.  
3. **Không** cắt CORE_TIERS (Out of Scope → C).

### P4 — WebUI siết (H3, H4, M3, M4)
1. Header Messages: lazy khi mở panel (hoặc store nhẹ) — đúng mục tiêu Plan.  
2. Pricing / Insight / Onboarding: idle + điều kiện DOM/login.  
3. H4 tách module: **Future Extraction** — chỉ làm nếu Owner bắt trong A; mặc định defer có chữ ký.

### P5 — Brand / Market / Bootstrap version (đã gần đúng N0)
1. Brand: giữ rule N0 (login→Nhà · khách→Cộng đồng).  
2. Market Status: **giữ** inject mọi topnav.  
3. Khóa một `bootstrap.js?v=` dùng chung khi thi công.

### P6 — Header markup (M5)
Ngắn hạn: slot/class ổn định. Dài hạn single source → defer trừ Owner yêu cầu.

### P7 — Verification (H5, M6) — bắt buộc trước Exit
1. Evidence trong **cùng file này** (mục 7) sau thi công.  
2. Smoke đủ §12 + legacy đã đưa vào phạm vi.  
3. Regression = 0.

### Recommendation — Owner đã chốt (2026-07-21)

| # | Quyết định |
|---|------------|
| **R1** | **A** — Orphan `chi-tiet.html` / `post.html`: xóa trên Production (sau xác minh) |
| **R2a** | **A2** — `hub.html`: gỡ link `index.html` → 301 URL cũ nếu cần → **xóa** `hub.html` |
| **R2b** | **B1** — `comment.html`: không xóa / không 301 · đưa về **bootstrap** · backlog URL chuẩn sau |
| **R2c** | **C1** — `/chia-se` (share): giữ URL · migrate **bootstrap** · không khai tử |
| **R3** | **A** — auth/* thuộc A · Shell Entry tối thiểu · không viết lại Feature |
| **R4** | **A** — Không tách WebUI bundle trong A (Future Extraction) |
| **R5** | **A** — Không làm header markup một nguồn trong A (defer) |
| **R6** | **A** — Market Status giữ như N0 |

---

## 5. Acceptance — sau Verification

Phạm vi = App Shell · R1–R6 · Sitemap §12 + legacy trong A.  
(Không đếm Dup title/SEO Definition — Phase B.)

### 5.1 Technical PASS

| # | Tiêu chí | TT | Bằng chứng |
|---|----------|-----|------------|
| T1 | HTML Entry đúng mọi trang §12 + legacy R* | ✓ | §7.2 — 21/21 · R* PASS |
| T2 | Search: slot HTML ≤1 · script chỉ khi có slot | ✓ | §7.2–7.3 · vd `/thanh-vien` hsJs=0 |
| T3 | Guest giữ slot Search + Login CTA | ✓ | §7.3 `guestActionsHasSearch=true` |
| T4 | Không `platform-boot` / `shell-boot` Entry trùng trên HTML | ✓ | plat_src=0 · legacy shell xóa |
| T5 | Auth-gate: redirect + `auth-*-boot` | ✓ | `/nha-cua-toi` · `/co-phieu` → login |
| T6 | Market Status policy R6 · Messages lazy H3 | ✓ | `__ifxMarketStatusLoaded` · chat-store=0 khách |
| T7 | Implementation Evidence | ✓ | §7.1 |
| T8 | Regression Shell bảng §7.4 = 0 FAIL | ✓ | §7.4 |
| T9 | **Runtime Shell toàn trang** (Header/Brand/Search/Guest/Ent/Mkt) | ✓ | §7.3 — 27/27 · không Feature |

**Technical: PASS**

### 5.2 Architecture PASS

| # | Tiêu chí | TT | Bằng chứng / giới hạn |
|---|----------|-----|------------------------|
| R1a | One Owner — Shell vs trang | ✓ | Không trang tự ôm Shell (R1–R3) |
| R1b | One Entry — một Entry / trang | ✓ | bootstrap \| auth-boot \| 301 |
| R1c | One Runtime — chuỗi Entry → Shell → (Feature) | ◐ | Chuỗi quan sát OK (§7.3b) · **chưa có bộ đếm mount ===1 toàn cục** → Open Issue `OI-RT-MOUNT` → Gate |
| R1d | Dependency: Feature không kéo lại Shell Entry | ✓ | feature-boot `waitShell` / `__IFLUX_SHELL_READY` · không plat_src trên HTML Feature |
| R1e | Out of Scope / defer ghi rõ, không xóa khỏi tài liệu | ✓ | Open Issues §9 · H2/H4/M5/BL-* |

**Architecture: PASS** (với OI-RT-MOUNT bắt buộc trước Gate — không chặn đóng A / mở B).

### 5.3 Owner PASS

| # | Tiêu chí | TT |
|---|----------|-----|
| O1 | Catalog + Plan + R1–R6 đã chốt | ✓ 2026-07-21 |
| O2 | Verification Report (HTML + mẫu runtime) đủ đóng A | ✓ Owner |
| O3 | Chấp nhận defer Open Issues đến C / Future / Gate | ✓ Owner |
| O4 | Cho phép chuyển Phase B | ✓ Owner 2026-07-21 |

**Owner: PASS**

### 5.4 Tổng Acceptance

| Lớp | Kết quả |
|-----|---------|
| Technical | **PASS** |
| Architecture | **PASS** (+ OI-RT-MOUNT → Gate) |
| Owner | **PASS** |
| **Acceptance Phase A** | **PASS** |

Một trang FAIL Shell → Rollback toàn A (SoT §0.6). Không phát sinh FAIL đóng A.

---

## 6. Exit Criteria (quản trị) — đóng Phase A

| # | Tiêu chí | TT |
|---|----------|-----|
| E1 | Verification PASS (§7.2–7.5) | [x] |
| E2 | Evidence Implementation (§7.1) | [x] |
| E3 | Không còn Critical (C1–C4 đóng) | [x] |
| E4 | High còn lại → Open Issues (§9), không xóa | [x] |
| E5 | Regression Shell = 0 + Owner ký | [x] 2026-07-21 |

**Exit Phase A: PASS** · được mở Phase B.  
**Không** đồng nghĩa Gate cuối PASS — xem §9 Open Issues.

---

## 7. Reports

### 7.0 Cấu trúc Phase A (đối chiếu Gate)

```text
Phase A
  Plan (mục 4) …………………… R1–R6 chốt
  Implementation Report (7.1) …
  Verification Report
    7.2 HTML Entry (toàn §12)
    7.3 Runtime mẫu + giới hạn
    7.3b Dependency
    7.4 Regression
    7.5 Kết luận
  Acceptance (mục 5) …………… Technical · Architecture · Owner
  Exit Criteria (mục 6) ……… PASS
  Open Issues (mục 9) ……… mang sang C / Future / Gate
```

### 7.1 Implementation Report (thi công)

**Deploy:** User_Web → Production · nginx `iflux-prod-app.conf` (hub/orphan 301) · Cloudflare purge · `?v=phaseA20260721c`

| Hạng mục | Trước (N0) | Sau |
|----------|------------|-----|
| Legacy tự ôm Shell | hub + comment + share + auth | bootstrap / auth-*-boot |
| Orphan tự Search | `chi-tiet` · `post` | xóa + 301 `/cong-dong` |
| hub.html | còn | xóa + 301 `/nha-cua-toi` |
| Guest Search slot | có thể mất | giữ slot + CTA |
| Messages chat-store | idle | lazy click |
| `shell-boot.js` thừa | có ngoài runtime/ | đã xóa |
| block-templates × | 2 | 2 (Open Issue H2 → C) |

### 7.2 Verification — HTML Entry (toàn Sitemap §12 + legacy)

Phương pháp: `curl` Production · đếm `bootstrap` / `feature-boot` / `auth-*-boot` / `platform-boot` src / `data-ifx-header-search` / brand / legacy shell-boot.  
**PASS Entry** = đúng Expect · boot≤1 · plat_src=0.

> HTML Entry PASS **không** thay Runtime Mount Verification (§7.3 / OI-RT-MOUNT).

#### §12 Sitemap

| # | Trang | URL | Expect | HTTP | Boot | Feat | Search slot | Brand | Entry |
|---|-------|-----|--------|------|------|------|-------------|-------|-------|
| 1 | Nhà | `/nha-cua-toi` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 2 | Thị trường | `/thi-truong` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 3 | Cộng đồng | `/cong-dong` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 4 | Dòng tiền | `/dong-tien` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 5 | Thành viên | `/thanh-vien` | bootstrap | 200 | 1 | 0 | 0 | 1 | ✓ |
| 6 | Hỏi đáp | `/hoi-dap` | bootstrap | 200 | 1 | 0 | 0 | 1 | ✓ |
| 7 | Tài khoản | `/tai-khoan` | bootstrap+feature | 200 | 1 | 1 | 1 | 1 | ✓ |
| 8 | Tin nhắn | `/tin-nhan` | bootstrap | 200 | 1 | 0 | 0 | 1 | ✓ |
| 9 | DS CP | `/co-phieu` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 10 | DS ngành | `/nganh` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 11 | DS HST | `/he-sinh-thai` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 12 | DS câu chuyện | `/cau-chuyen` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 13 | CT CP | `/co-phieu/HPG` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 14 | CT ngành | `/nganh/ngan-hang` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 15 | CT HST | `/he-sinh-thai/hoa-phat` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 16 | CT câu chuyện | `/cau-chuyen/demo` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 17 | Gói cước | `/goi-cuoc` | bootstrap | 200 | 1 | 0 | 1 | 1 | ✓ |
| 18 | Tìm kiếm | `/tim-kiem` | bootstrap | 200 | 1 | 0 | 0 | 1 | ✓ |
| 19 | Theo dõi | `/theo-doi` | bootstrap | 200 | 1 | 0 | 0 | 1 | ✓ |
| 20 | Viết bài | `/cong-dong/viet-bai` | bootstrap+feature | 200 | 1 | 1 | 1 | 1 | ✓ |
| 21 | Checkout | `/User_Web/account/checkout.html` | bootstrap+feature | 200 | 1 | 1 | 1 | 1 | ✓ |

#### Legacy / R*

| ID | URL | Expect | Kết quả |
|----|-----|--------|---------|
| R1 | `/User_Web/chi-tiet.html` · `post.html` | 301 → `/cong-dong` | ✓ 301 |
| R2a | `/User_Web/hub.html` | 301 → `/nha-cua-toi` | ✓ 301 |
| R2b | `/User_Web/stock/comment.html` | bootstrap+feature | ✓ boot=1 feat=1 |
| R2c | `/chia-se` | bootstrap+feature | ✓ boot=1 feat=1 |
| R3 | `/dang-nhap` · `/dang-ky` · `/quen-mat-khau` · `/xac-minh-otp` | auth-*-boot | ✓ auth=1 boot=0 |

**HTML Entry: 21/21 §12 PASS · Legacy R* PASS**

### 7.3 Verification — Runtime Shell (toàn phạm vi A)

**Quy tắc Owner (2026-07-21):**

| Mức | Tất cả trang? | Phase A? |
|-----|---------------|----------|
| HTML Entry | Có | Bắt buộc — §7.2 |
| **Runtime Shell** (Header · Brand · Search · Guest · Entitlement · Market Status) | **Có** | **Bắt buộc** — mục này |
| Runtime Feature (store/feed/page…) | Không | Không — Phase C / Gate |

Không Network dump. Không JS list Feature.

**Phương pháp:** Browser Production · khách · probe DOM/globals Shell · 2026-07-21 · raw `docs/runtime-opt/_phaseA-runtime-shell-raw.json` · hotfix `bootstrap.js?v=phaseA20260721d`.

**Ký hiệu PASS**

| Mode | Nghĩa |
|------|--------|
| **Guest** | Header≥1 · Brand · Guest CTA/Nav · Entitlements · Search slot đúng (0\|1) · hs.js khớp slot · Guest giữ Search nếu có slot · Mkt: `mktLoaded` (R6; DOM tùy trang) |
| **AuthGate** | Khách bị Shell `requireAuth` → `/dang-nhap?return=…` · auth-boot · HTML gốc vẫn có chrome Shell (§7.2) |
| **AuthEntry** | `auth-*-boot` · không bootstrap product |
| **Shell→Feature→Auth** | `/chia-se`: Shell Entry OK rồi Feature redirect Nhà → AuthGate (R2c) — không FAIL Shell |

#### 7.3.1 Bảng Runtime Shell

| Page | Mode | Header | Brand | Search | Guest | Ent | Mkt | PASS |
|------|------|--------|-------|--------|-------|-----|-----|------|
| `/cong-dong` | Guest | ✓ | `/cong-dong` | 1 | ✓ giữ slot | ✓ | loaded+DOM | ✓ |
| `/thi-truong` | Guest | ✓ | `/cong-dong` | 1 | ✓ | ✓ | loaded | ✓ |
| `/dong-tien` | Guest | ✓ | `/cong-dong` | 1 | ✓ | ✓ | loaded+DOM | ✓ |
| `/thanh-vien` | Guest | ✓ | `/cong-dong` | 0 · hs=0 | ✓ | ✓ | loaded | ✓ |
| `/hoi-dap` | Guest | ✓ | `/cong-dong` | 0 · hs=0 | ✓ | ✓ | loaded | ✓ |
| `/goi-cuoc` | Guest | ✓ | `/cong-dong` | 1 | ✓ | ✓ | loaded | ✓ |
| `/chia-se` | Shell→Feature→Auth | Entry HTML ✓ | — | 0 | — | — | — | ✓ (sau Shell → login `return=/nha-cua-toi`) |
| `/nha-cua-toi` | AuthGate | HTML chrome ✓ | — | 1 slot HTML | — | — | — | ✓ |
| `/tai-khoan` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/tin-nhan` | AuthGate | HTML ✓ | — | 0 | — | — | — | ✓ |
| `/co-phieu` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/nganh` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/he-sinh-thai` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/cau-chuyen` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/co-phieu/HPG` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/nganh/ngan-hang` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/he-sinh-thai/hoa-phat` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/cau-chuyen/demo` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/tim-kiem` | AuthGate | HTML ✓ | — | 0 | — | — | — | ✓ |
| `/theo-doi` | AuthGate | HTML ✓ | — | 0 | — | — | — | ✓ |
| `/cong-dong/viet-bai` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ (sau fix `detectPageKey` 21d) |
| `/User_Web/account/checkout.html` | AuthGate | HTML ✓ | — | 1 | — | — | — | ✓ |
| `/User_Web/stock/comment.html` | AuthGate | HTML ✓ | — | 0 | — | — | — | ✓ |
| `/dang-nhap` · `/dang-ky` · `/quen-mat-khau` · `/xac-minh-otp` | AuthEntry | n/a form | — | — | — | — | — | ✓ |

**Runtime Shell: 27/27 PASS** (sau hotfix Viết bài).

#### 7.3.2 Hotfix phát hiện khi Runtime Shell đủ trang

| Lỗi | Nguyên nhân | Sửa |
|-----|-------------|-----|
| `/cong-dong/viet-bai` khách vào được (thiếu AuthGate) | `detectPageKey`: nhánh `/cong-dong` **trước** `communityWrite` → pageKey=`community` | Đưa `communityWrite` lên trước · deploy `bootstrap.js?v=phaseA20260721d` · verify → `/dang-nhap?return=/cong-dong/viet-bai` |

#### 7.3.3 Runtime mount counters (vẫn Gate — OI-RT-MOUNT)

Chưa đủ `__ifxShellBooted` / `__ifxHeaderMounted` / `__ifxSearchMounted` === 1.  
Runtime Shell bảng trên = **hành vi Shell** (bắt buộc A). Mount counters = **Gate**.

#### 7.3b Dependency Verification

```text
HTML
  → bootstrap.js (hoặc auth-*-boot)
      → shell-boot / platform + guest + search(slot) + web-ui(login)
          → __IFLUX_SHELL_READY
              → page-runtime + manifest   (trang thường)
              → *-feature-boot            (shell-only)
                  → Feature / Widget   ← không verify trong A
```

| Kiểm | TT |
|-------|-----|
| Bootstrap trước Shell | ✓ |
| Shell trước Feature | ✓ (`waitShell` / `__IFLUX_SHELL_READY`) |
| Feature không nạp platform-boot Entry | ✓ |
| AuthGate đúng pageKey (sau 21d) | ✓ Viết bài |
| Feature remount Search | ◐ → OI-RT-MOUNT / OI-H2 |

### 7.4 Regression Report (Shell — toàn phạm vi A)

| Trang | Bootstrap OK | Header/Nav | Brand | Search policy | Market Status policy | Kết quả |
|-------|--------------|------------|-------|---------------|----------------------|---------|
| Nhà | ✓ HTML · gate login khách | ✓ (sau login / HTML) | ✓ | slot=1 | R6 | ✓ |
| Thị trường | ✓ | ✓ runtime | ✓ khách→CĐ | ✓ ×1 | R6 | ✓ |
| Cộng đồng | ✓ | ✓ | ✓ | ✓ ×1 + guest giữ | R6 | ✓ |
| Dòng tiền | ✓ | ✓ | ✓ | ✓ ×1 | DOM ✓ | ✓ |
| Thành viên | ✓ | ✓ | ✓ | ✓ không slot · không hs.js | R6 | ✓ |
| Hỏi đáp | ✓ | ✓ | ✓ | ✓ không slot | R6 | ✓ |
| Tài khoản | ✓ + feature | ✓ HTML | ✓ | slot=1 | R6 | ✓ (HTML; runtime cần login) |
| Tin nhắn | ✓ | ✓ HTML | ✓ | không slot | R6 | ✓ HTML |
| DS/CT CP·ngành·HST·câu chuyện | ✓ | ✓ HTML | ✓ | slot=1 | R6 | ✓ HTML · list/detail gate login khách |
| Gói cước | ✓ | ✓ runtime | ✓ | ✓ ×1 | R6 | ✓ |
| Tìm kiếm / Theo dõi | ✓ | ✓ HTML | ✓ | không slot | R6 | ✓ HTML |
| Viết bài / Checkout | ✓ + feature | ✓ HTML | ✓ | slot=1 | R6 | ✓ HTML |
| share / comment | ✓ + feature | ✓ | ✓ | không slot (đúng HTML) | R6 | ✓ |
| auth/* | auth-boot | n/a (form auth) | n/a | n/a | n/a | ✓ |
| orphan / hub | 301 | — | — | — | — | ✓ |

**Regression Shell = 0 FAIL** trong phạm vi Phase A.

Ngoài phạm vi A (không FAIL A): Dup h1 Thành viên · `document.title` «FAQ» English · Watchlist English — **Phase B**.

### 7.5 Verification — Kết luận

| Hạng mục | Kết quả |
|----------|---------|
| HTML Entry §12 + R* | **PASS** 21/21 |
| **Runtime Shell toàn trang** | **PASS** 27/27 (sau 21d) |
| Runtime Feature | **Không làm** (C) |
| Runtime mount counters | **Chưa** — OI-RT-MOUNT → Gate |
| Dependency Entry chuỗi | **PASS** |
| Regression Shell | **PASS** 0 FAIL |
| **Verification Phase A** | **PASS** (HTML + Runtime Shell · chưa đủ Gate counters) |

---

## 8. Owner Review — Phase A PASS

Owner chốt R1–R6: 2026-07-21.  
Owner đóng Exit / PASS chuyển B: **2026-07-21** (ký với ghi chú Runtime → Gate + giữ Open Issues).

| Chữ ký | TT |
|--------|-----|
| Chốt R1–R6 | ✓ 2026-07-21 |
| Duyệt Verification + Acceptance | ✓ Owner |
| Đóng Exit → mở Phase B | ✓ Owner 2026-07-21 |
| Gate cuối | Chưa — phụ thuộc §9 |

Plan B: `docs/runtime-opt/PhaseB.md`.

---

## 9. Open Issues (mang sang phase sau — không xóa)

Dùng cho Gate: chỉ cần đối chiếu bảng này đã đóng chưa.

| ID | Nguồn | Mô tả | Phase đích | TT |
|----|-------|-------|------------|-----|
| **OI-H2** | H2 | `block-templates.js` request ×2 (Shell + Feature CORE) | **C** | Open |
| **OI-H4** | H4 / R4 | Tách `iflux-web-ui.js` bundle | **Future Extraction** | Open |
| **OI-M5** | M5 / R5 | Header markup một nguồn | **Future** | Open |
| **OI-M2** | M2 / R6 | Market Status inject policy N0 — giữ; siết đo nếu cần | **Gate** (quan sát) | Open / accept |
| **OI-BL-COMMENT** | BL-URL-COMMENT | Pretty URL Việt cho bình luận CP | Backlog URL (ngoài A/B mặc định) | Open |
| **OI-WRITE-KEY** | Runtime Shell đủ trang | `detectPageKey` Viết bài trước `/cong-dong` | **A** | **Closed** 2026-07-21d |
| **OI-RT-MOUNT** | Review Owner A | Runtime Verification: mount/singleton counters (`__ifxShellBooted` / Header / Search / Platform === 1) + Feature không remount Search | **Gate** (bắt buộc trước MR) | Open |
| **OI-B-*** | Audit B | Dup title/SEO/Definition — xem `PhaseB.md` | **B** | Open |

**Quy tắc:** không xóa hàng Open Issues khi đóng Phase — chỉ đổi cột TT thành **Closed** khi phase đích PASS.
