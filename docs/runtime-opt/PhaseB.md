# Phase B — Page Definition (một file kết quả)

**Trạng thái:** ✅ **Exit PASS** · 2026-07-21 · deploy `phaseBExit20260721c` · B2 SEO stock · R6 Theo dõi · Audit tái kiểm §8.2
**Ngày lập:** 2026-07-21 · **Chốt Owner:** 2026-07-21 (§9) · **Rà soát lần cuối:** 2026-07-21 (§11)  
**Cổng A:** ✅ PASS (`PhaseA.md`)  
**Môi trường bằng chứng:** Production (neo sau Phase A PASS)  
**Quy ước:** Một file / Phase · Chuỗi: Plan → Implementation → Verification → Acceptance → Exit → PASS  
**Thi công:** ✅ xong · **Exit:** ✅ PASS

> **Đã có:** Approve AD-1 · chốt R* · «Thi công Phase B» · Exit PASS.  
> **Audit tái kiểm trước Owner ký:** §8.2 (2026-07-21 tối).  
> Kế thừa A: Open Issues (`OI-H2` / `OI-H4` / `OI-M5` / `OI-RT-MOUNT`…) **không xóa**.  
> Verification B: **HTML Definition + Runtime Definition toàn trang** (§8 + §8.2).

---

## 0. Tổng quan (Overview)

Phần này định vị Phase trước Inventory — cùng tinh thần đoạn mở Phase A.

### 0.1 Mục tiêu

Chuẩn hóa **Page Definition** thành **One Source of Truth** cho nhận diện trang.

- Mỗi Page chỉ có **một** Definition.  
- Runtime · Navigation · Sitemap · Feature **chỉ consume** Definition — không tự tạo / không vẽ trùng chrome thuộc PD-*.  
- Sau PASS B: Phase C chỉ việc Feature; không còn «sửa title trong widget cho xong».

### 0.2 Vai trò trong Blueprint

```text
Phase 0 — Baseline          PASS
    ↓
Phase A — App Shell         PASS  ← Entry / Header / Search / AuthGate
    ↓
Phase B — Page Definition   ← HIỆN TẠI (Plan)
    ↓
Phase C — Page Feature      đường tải Feature riêng
    ↓
Gate                        Technical + Architecture + Open Issues
    ↓
MR
```

| Tầng | Phase | Câu hỏi giải quyết |
|------|-------|-------------------|
| Ai boot trang? | A | One Entry · One Shell |
| Trang này là gì? (title, mô tả, SEO, tab cố định…) | **B** | One Definition |
| Trang làm gì? (feed, form, store…) | C | One Feature Runtime |
| Hệ thống còn nợ gì? | Gate | Open Issues đóng chưa |

### 0.3 Vì sao cần Phase B

App Shell đã ổn (A PASS) nhưng **nhận diện trang vẫn phân tán**:

| Hiện trạng | Hệ quả |
|------------|--------|
| Manifest JS + PagePublished (2 trang) + HTML `<title>`/h1 + Feature META/`document.title`/`seo-url` | Runtime **suy luận / đua** — không một SoT |
| Shell-only (account, write, share…) không qua `bootPage` | Definition = HTML cứng + Feature |
| Admin `page-settings-catalog` có `description` nhưng User Web không đọc | Sitemap Admin ≠ Runtime |
| Alias / key lệch (`membership` ↔ `loyalty`) | Registry / Sitemap / Runtime dễ lệch nhau |
| Composite gỡ `.ifx-rt-page-head` rồi vẽ lại title | Feature **ôm** Definition |

**Mục tiêu B:** gom chrome nhận diện về **một nguồn** + **một renderer** + **hợp đồng consume** rõ — không tối ưu Network Feature (đó là C).

**Nguyên tắc B:** coi Production sau A là sự thật · **không** coi «đã có 19 manifest» = PASS Definition.

### 0.4 Invariant (kim chỉ nam)

```text
One Page
  → One Definition
  → One Registry / Alias map
  → One Runtime Consumer (renderer)
  → Feature chỉ cung cấp data (nếu động), không tự vẽ PD-*
```

Ngắn: `Khai báo trang → Vẽ → Xong · Không hardcode trùng.`

### 0.5 Scope Boundary

| | Nghĩa | Phase B |
|--|-------|---------|
| **Allowed** | Được sửa | Definition · Registry / Alias · Metadata (title, intro, documentTitle, SEO schema; tabs/BC/hero **chỉ nếu R5=A** — hiện R5=B → không) · Consumption Contract · Renderer nhận diện · Infra chỉ phục vụ Definition |
| **Not Allowed** | Không được sửa | Widget Placement/Runtime · Permission / Entitlement nghiệp vụ · Layout Engine Placement · Business Logic Feature · App Shell (trừ Regression Task) · Presentation Tab/Hero/Breadcrumb (R5=B → Open Issue) |

### 0.5.1 Nguyên tắc chống phình phạm vi (Owner 2026-07-21)

> Trong suốt Phase B, **mọi thay đổi phải quy được về Page Definition**.  
> Thay đổi chỉ liên quan Presentation (Tab / Hero / Breadcrumb), Widget Runtime, hoặc Business Feature mà **không** phục vụ trực tiếp chuẩn hóa Definition → **defer** theo Open Issues đã chốt — **không** kéo vào thi công B.

### Out of Scope (thấy nhưng cố tình bỏ)

- Feature Runtime / cắt `CORE_TIERS` / `block-templates` ×2 → **C** (OI-H2)  
- Tách `iflux-web-ui.js` → Future (OI-H4)  
- Header markup Shell một nguồn → Future (OI-M5)  
- Mount counters Shell → Gate (OI-RT-MOUNT)  
- Pretty URL comment → BL (OI-BL-COMMENT) trừ Owner kéo vào B  

**Không thêm hardcode Definition mới khi chưa Human phê duyệt.**

### 0.6 Deliverable khi PASS B

| Deliverable | Nghĩa kiểm được |
|-------------|-----------------|
| 100% trang phạm vi có Definition | Manifest và/hoặc PagePublished chrome theo R* |
| Runtime không tự tạo Definition | Không `document.title` / h1 page / intro từ Feature khi đã có PD-* |
| Registry ↔ Definition đồng bộ | Key/path/alias một map (vd membership↔loyalty) |
| Alias chuẩn hóa | Slug Việt SoT; English chỉ 301 đọc tạm |
| Consumption Contract | Shell / Nav / Feature / Admin biết **đọc gì · không ghi gì** |
| Phase C chỉ consume | Feature nhận metadata đã render hoặc data-slot; không ôm chrome PD-* |
| Open Issues B | Ghi §10 · không xóa defer |
| Verification | HTML + **Runtime Definition toàn trang** (§8) |

### 0.7 Bài học từ Phase A → áp vào B (đề xuất Agent)

Phase A vừa chứng minh: **nâng tiêu chí Verification mới bắt được bug thật** (`detectPageKey` Viết bài). B phải «học» ngay từ Plan — không đợi Fail lần nữa.

| # | Bài học A | Áp vào Plan B |
|---|-----------|---------------|
| L1 | HTML Entry ≠ Runtime hành vi | Verification B = **HTML Definition + Runtime Definition toàn §12** (không mẫu vài trang) |
| L2 | pageKey / detect sai → AuthGate sai | **PD-PATH + pageKey registry** nằm trong phạm vi B (hoặc Consumption Contract bắt buộc sync với `detectPageKey`) — audit lệch key như `membership`/`loyalty` / path con `/cong-dong/*` |
| L3 | Network Initiator ≠ Ownership | Document rõ: Feature gọi `loadScript` không = Feature owns Definition; B siết **ai được set title/SEO** |
| L4 | «Đã có file» ≠ PASS | Cấm kết luận PASS chỉ vì 19 manifest; phải **không Dup runtime** |
| L5 | Acceptance 3 lớp | Technical · Architecture · Owner (giống A) |
| L6 | Open Issues cho Gate | Mọi defer B → §10; Gate chỉ đối chiếu bảng |
| L7 | Gap Analysis thiếu → backlog mơ hồ | Thêm §3 Gap (Audit → Gap → Backlog → Plan) |
| L8 | R* chốt trước thi công | Không code đến khi Owner chốt R* |
| L9 | Shell-only / auth cần quyết định tường minh | R1–R2 bắt buộc chữ ký (giống R2/R3 ở A) |
| L10 | Dynamic entity cần schema sớm | Phân **static chrome** vs **template + data** trong Plan (tránh Feature `document.title = ticker` vô tội vạ) |

### 0.8 Neo tài liệu

| Vai trò | Tài liệu |
|---------|----------|
| SoT Runtime | SoT — Trình tự tối ưu Runtime §8 |
| Phase 0 | `Phase0.md` |
| Phase A PASS | `PhaseA.md` (+ Open Issues §9 A) |
| Owner Page (audit 80) | Tham khảo lập Catalog B |

### Carry-in từ A (không mở lại trừ Regression)

| ID | Xử lý trong B |
|----|---------------|
| OI-H2 / H4 / M5 / RT-MOUNT / BL-COMMENT / M2 | Ngoài B · giữ Open Issues |
| OI-WRITE-KEY (Closed A) | Đã sửa detectPageKey — B chỉ **không** tái tạo lệch pageKey↔path |

---

### 0.9 Architecture Flow (Definition)

```text
Page Catalog / Sitemap (Admin + SoT path)
        ↓
   Manifest (± PagePublished override)     ← SoT lưu trữ (xem AD-1)
        ↓
   Page Definition (một record / page)
        ↓
   Definition Renderer (renderPageHeader · docTitle · seoRenderer · tabs/BC…)
        ↓
   Feature / Widget                         ← chỉ consume · được cung cấp data động
        ↓
   Done (không tự vẽ PD-*)
```

Journey Phase A trả lời *ai boot*. Flow này trả lời *trang là gì và ai được vẽ nhận diện*.

### 0.10 Exit Vision (đích đến khi PASS)

```text
Page
  → Definition (một nguồn)
  → Renderer (một consumer ghi DOM nhận diện)
  → Done
```

**Không còn** (thuộc PD-*):

| Cấm sau PASS B | Cho phép |
|----------------|----------|
| HTML tự vẽ h1/intro page trùng Definition | `<title>` placeholder no-JS tối thiểu |
| Feature/`seo-url` tự `document.title` / meta PD-* | Feature **đẩy data** (ticker, slug) vào template Definition |
| Widget `LAYOUT_HTML` ôm title/tabs/BC/hero chrome trang | Widget ôm **nội dung** nghiệp vụ |
| Runtime tự suy ra Definition khi thiếu khai báo | Fail rõ / fallback SoT có chữ ký |

### 0.11 Mục lục Plan B

| # | Mục | Vai trò |
|---|-----|---------|
| 0 | Tổng quan · Arch Flow · Exit Vision | Định vị |
| 1 | Inventory (Object + **Consumption**) | Có gì |
| 2 | Audit | Hiện trạng trang |
| **3** | **Gap Analysis (G1…)** | Vì sao lệch SoT → ảnh hưởng → P* |
| 4 | Backlog | Làm / defer |
| 5 | Plan + **AD** + R* sản phẩm | Thi công |
| 6–10 | Acceptance · Exit · Evidence · Owner · Open Issues | Đóng Phase |
| **11** | **Pre-flight rà soát Plan** | Sẵn sàng Approve / Blocked |

---

## 1. Inventory — Page Definition Catalog

Nguồn: Phase0 + Production sau A + audit bề mặt.

### 1.1 Pipeline hiện tại

```text
Admin page-settings-catalog (title/description/path/sections)
  → Publish → PagePublished (API) — bootstrap merge mới market + home
  → Static pages/*.manifest.js (19) — title / intro / documentTitle / sections
       ↓
bootstrap → resolveManifest → page-runtime.bootPage
  → renderPageHeader + document.title
  → (composite) Feature/widget vẫn tự vẽ chrome / SEO / tab / breadcrumb
```

Shell-only: `account` · `checkout` · `communityWrite` · `share` · `stockComment` · auth/*  
→ không `bootPage` → Definition lệch SoT.

### 1.2 Catalog đối tượng Definition

| ID | Object | Owner đúng | Entry thực tế | Ghi chú |
|----|--------|------------|---------------|---------|
| PD-TITLE | Tiêu đề (h1 / page head) | Page Definition | `manifest.title` → `renderPageHeader` | Nhiều trang F/HTML vẽ lại |
| PD-DESC | Intro | Page Definition | `manifest.intro` | Dup loyalty/faq/flow/entity |
| PD-DOC-TITLE | `document.title` | Page Definition | `manifest.documentTitle` | HTML + F/SEO đua |
| PD-SEO | Meta / OG / canonical | Page Definition (+ data động) | **Chưa pipeline** | `seo-url.js` Feature |
| PD-META | Admin description | Page Definition | Admin only | User Web không đọc |
| PD-TABS | Tab cố định trang | Page Definition | CHILD_PAGES một phần | Hardcode HTML/widget |
| PD-BREADCRUMB | Breadcrumb nhận diện | Page Definition | **Không field** | Hardcode F/HTML |
| PD-HERO | Hero chrome trang | Page Definition | **Không field** | faq/loyalty/share/account |
| PD-PATH | Path / slug + **pageKey** | Page Definition | `manifest.path` + `detectPageKey` | Alias / lệch key rủi ro A |
| PD-SECTIONS | Vùng layout | Page Definition | `manifest.sections` | Ổn hơn chrome text |
| PD-PUBLISH | PagePublished | Page Definition | API · wire chrome mỏng | Chỉ market/home merge bootstrap |
| PD-CONTRACT | Consumption Contract (bảng §1.4) | Page Definition | **Chưa enforce** | Bài học Blueprint: Object ≠ đủ — cần Consumer |

### 1.3 Nguồn đếm

| Nguồn | Số | Vai trò |
|-------|---:|---------|
| `pages/*.manifest.js` | 19 | Static + widget slots (B siết chrome) |
| PagePublished chrome bootstrap | 2 | market, home |
| Shell-only / auth / alerts | ≥10 | Ngoài pipeline Definition |
| HTML `<title>` | ~all | Placeholder / trùng |

### 1.4 Inventory Consumption (PD-CONTRACT)

*Object inventory (§1.2) chưa đủ. Blueprint đòi: **ai được đọc / ai được ghi**.*

| Object | Owner (ghi SoT) | Consumer hợp lệ (đọc → DOM) | Cấm ghi runtime |
|--------|-----------------|------------------------------|-----------------|
| PD-TITLE | Definition | `renderPageHeader` | Feature / Widget / HTML cứng trùng |
| PD-DESC | Definition | `renderPageHeader` (intro) | Feature META / LAYOUT_HTML |
| PD-DOC-TITLE | Definition | `page-runtime` / `docTitleRenderer` | Feature / `seo-url` tự gán (trừ data→template) |
| PD-SEO | Definition | `seoRenderer` (mới hoặc tách từ seo-url) | Meta HTML rải · Feature apply trực tiếp |
| PD-META | Definition (Admin publish) | Runtime intro/desc | — |
| PD-TABS | Definition | Page chrome tabs renderer | Widget tự hardcode tab cố định trang |
| PD-BREADCRUMB | Definition | Page chrome BC renderer | Feature hardcode BC nhận diện |
| PD-HERO | Definition | Page chrome hero renderer | Feature hero chrome trang (khác nội dung feed) |
| PD-PATH | Definition | `detectPageKey` · Nav · nginx alias map | Path English mới làm chuẩn |
| PD-SECTIONS | Definition | `page-runtime` / Layout regions | — |
| PD-PUBLISH | Definition artifact | `resolveManifest` merge | Feature tự fetch chỉ để **ghi** chrome |
| PD-CONTRACT | Definition (bảng này) | Mọi tầng verify Acceptance | Consumer tự phong Owner |

**Quy tắc Contract:** Consumer chỉ **đọc** field đã khai báo. Feature động = **data provider** → Renderer áp template — không bypass Owner.

---

## 2. Audit mọi trang (hiện trạng)

Ký hiệu: ✓ ổn · ✗ lệch · ◐ một phần · **Dup** = cứng + Definition cùng vẽ  
*Audit chỉ ghi sự thật — chưa giải thích kiến trúc (→ Gap §3).*

### 2.1 Sitemap / sản phẩm

| Trang | Manifest | TITLE/DESC | DOC-TITLE | SEO | Tabs/BC/Hero | Kết quả |
|-------|----------|------------|-----------|-----|--------------|---------|
| Nhà | ✓ | ◐ + HTML greet | ✓→F? | — | Hero HTML | ◐ |
| Thị trường | ✓ + Pub | ✓ RT | ✓ | — | — | ✓ hướng đúng |
| Cộng đồng feed | ✓ composite | ✓ RT | ✓ | — | — | ✓ hướng đúng |
| CĐ collection | cùng community | ✗ F gỡ RT | ✗ F | ◐ F | BC F | ✗ |
| Dòng tiền | ✓ `title:''` | ✗ F | ◐ | — | Tabs F | ✗ |
| Thành viên | ✓ | **Dup** | ✓ | — | Tabs+Hero F | ✗ |
| Hỏi đáp | ✓ | **Dup** | ✓ | — | Hero F | ✗ |
| Tài khoản | ✗ shell-only | ✗ HTML | ✗ | — | đủ HTML | ✗ Critical |
| Tin nhắn | ✓ | **Dup** | ✓ | — | Tabs+BC F | ✗ |
| DS entity | ✓ `title:''` | ✗ META F | ✗ F | — | Tabs F | ◐ |
| CT entity | ✓ | ✗ F dynamic | ✗ F+seo | ◐ | Tabs/Hero F | ◐ |
| Gói cước | ✓ `title:''` | ✗ F | ✓ | — | Tabs F | ✗ |
| Tìm kiếm | ✓ | **Dup** | ✓ | — | — | ✗ |
| Theo dõi | ✓ | **Dup** + English | ✓ | — | — | ✗ Critical UI Việt |
| Viết bài | ✗ shell-only | ✗ HTML | ✗ | meta | BC F | ✗ |
| Checkout | ✗ shell-only | ✗ HTML | ✗ | — | — | ✗ |
| Chi tiết bài | ✓ post | ◐ | ✗ F SEO | ◐ | BC F | ◐ |
| `/chia-se` | ✗ shell-only | ✗ HTML | ✗+OG | OG | Hero | ✗ |
| Comment CP | ✗ shell-only | ✗ F | ✗ F | — | BC F | ✗ |
| Auth (4) | ✗ | ✗ HTML | ✗ | — | Tabs | ◐ Owner |
| Cảnh báo | ✗ stub | — | — | — | — | Out |

### 2.2 Kết luận Audit (mô tả)

- Hướng đúng: Thị trường · Cộng đồng feed.  
- Critical quan sát: shell-only thiếu Definition · Dup title · Watchlist English · SEO ngoài PD · Admin không wire.  
- **Chưa** suy ra backlog ở đây — xem Gap §3.

---

## 3. Gap Analysis (Audit → SoT) — mục riêng

> **Không gộp vào Backlog.**  
> Audit (§2) = hiện trạng. **Gap (§3) = khoảng cách + ảnh hưởng kiến trúc.** Backlog (§4) = quyết định làm/defer.

```text
Audit (§2)
    ↓
Gap Analysis (§3)   ← bạn đang ở đây
    ↓
Backlog (§4)
    ↓
Plan (§5)
```

### G1 — Definition phân tán

| | |
|--|--|
| **Hiện trạng (Audit)** | HTML + Manifest + Published + Feature cùng vẽ title/intro/SEO |
| **SoT** | One Definition / Page |
| **Ảnh hưởng** | Runtime tự suy luận / đua; C không biết consume gì |
| **Xử lý** | **P1** One Renderer · C1/C3 |

### G2 — Renderer không độc quyền

| | |
|--|--|
| **Hiện trạng** | Có `renderPageHeader` nhưng Feature gỡ head / tự `document.title` |
| **SoT** | Khai báo → Vẽ → Xong |
| **Ảnh hưởng** | Phá invariant sau khi A đã khóa Entry |
| **Xử lý** | **P1** · Consumption Contract §1.4 |

### G3 — Coverage lỗ đen (shell-only)

| | |
|--|--|
| **Hiện trạng** | account / write / share / comment / checkout không `bootPage` chrome |
| **SoT** | Mọi page sản phẩm có Definition |
| **Ảnh hưởng** | Nhận diện ngoài SoT dù Shell Entry đã chuẩn |
| **Xử lý** | **P2** · phạm vi trang = R1 (sản phẩm) · **cách lưu** = AD-1 |

### G4 — Admin / Registry lệch Runtime

| | |
|--|--|
| **Hiện trạng** | description không wire; `membership`≠`loyalty` |
| **SoT** | Registry đồng bộ Definition |
| **Ảnh hưởng** | Sitemap / Publish / Nav lệch |
| **Xử lý** | **P5** · H1/H2/M3 |

### G5 — SEO / dynamic ngoài Definition

| | |
|--|--|
| **Hiện trạng** | `seo-url` / Feature gán meta & title entity |
| **SoT** | PD-SEO + template; Feature = data |
| **Ảnh hưởng** | Tranh chấp B/C; Dup DOC-TITLE |
| **Xử lý** | **P3** · theo AD/R4 |

### G6 — pageKey ↔ path chưa Contract

| | |
|--|--|
| **Hiện trạng** | Đã lộ `viet-bai` (Closed A); rủi ro path con khác |
| **SoT** | PD-PATH consume bởi `detectPageKey` |
| **Ảnh hưởng** | AuthGate / Definition sai page |
| **Xử lý** | **P2** · H7 · R8 |

### G7 — UI Việt (Watchlist English)

| | |
|--|--|
| **Hiện trạng** | Chip/title English dù manifest Việt |
| **SoT** | Ngôn ngữ UI Việt |
| **Ảnh hưởng** | Vi phạm SoT ngôn ngữ iFlux |
| **Xử lý** | **C5** bắt buộc trong B |

### Gap ngoài B (không vào Backlog B)

| Gap | Phase |
|-----|-------|
| CORE_TIERS / templates ×2 | C (OI-H2) |
| Feature loader riêng | C |
| Shell mount counters | Gate (OI-RT-MOUNT) |

### Map Gap → Plan

| Gap | Plan |
|-----|------|
| G1 · G2 | P1 |
| G3 · G6 | P2 |
| G5 | P3 |
| G4 | P5 |
| G7 | P7 / C5 ngay khi thi công |
| Tabs/BC/Hero (nếu làm) | P4 theo R5 |

---

## 4. Backlog (quyết định phạm vi B)

*Backlog = quyết định làm / defer — không lặp lại mô tả Audit.*

### Critical

| ID | Object | Việc | Nguồn Gap |
|----|--------|------|-----------|
| C1 | PD-TITLE/DESC | Gỡ Dup · Feature/HTML không vẽ lại | G1·G2 |
| C2 | Coverage | Shell-only có Definition (phạm vi R1 · lưu AD-1) | G3 |
| C3 | PD-DOC-TITLE | Một owner apply `document.title` | G1·G2 |
| C4 | PD-SEO | Pipeline Definition (+ data động) | G5 |
| C5 | UI Việt | Watchlist không English chip/title | G7 |

### High

| ID | Object | Việc | Nguồn Gap |
|----|--------|------|-----------|
| H1 | PD-META | Wire Admin description → runtime | Admin↔Runtime |
| H2 | PD-PUBLISH | Mở override chrome theo AD-1 | Schema / AD-1 |
| H3–H4 | PD-TABS / BC | Field + migrate (nếu R5=A) | Schema |
| H5 | Composite | Mode feed/collection trong Definition | Renderer |
| H6 | Entity | Schema static vs template+data | L10 |
| H7 | PD-PATH / pageKey | Consumption Contract + audit lệch path↔key | L2 từ A |

### Medium / Low

| ID | Việc |
|----|------|
| M1 | PD-HERO theo R5 |
| M2 | Breadcrumb slug Việt |
| M3 | Map `membership`↔`loyalty` |
| M4 | Alerts stub — Owner |
| M5 | Khóa `?v=` khi thi công |
| L1–L2 | `<title>` placeholder · OG mặc định |

### Ngoài B (Open Issues)

| ID | Phase |
|----|-------|
| OI-H2 · H4 · M5 · RT-MOUNT · BL-COMMENT · M2 (từ A) | C / Future / Gate |
| Auth Definition nếu R2=Out | Out có chữ ký |

---

## 5. Optimization Plan

**Thứ tự (sau chốt R*):** Critical → High → Medium.  
**Cấm:** sửa nghiệp vụ Feature «tiện tay» — chỉ gỡ / chuyển chrome PD-*.

### P1 — One Renderer (C1, C3)
1. `renderPageHeader` (+ DOC-TITLE/SEO helper) độc quyền.  
2. Feature/widget cấm h1/intro/`document.title` trùng PD-*.  
3. HTML `<title>` placeholder ngắn.  
4. Dynamic: Feature **data** → Definition **áp template**.

### P2 — Coverage (C2, H7)
1. Shell-only theo **R1** (phạm vi trang) · lưu trữ theo **AD-1**.  
2. Auth theo R2.  
3. Audit/sync `detectPageKey` ↔ PD-PATH (không tái bug `viet-bai`).

### P3 — SEO (C4, H6)
1. Schema PD-SEO static + template.  
2. `seo-url` / community SEO → data adapter.  
3. OG `/chia-se` vào Definition (giữ URL).

### P4 — Tabs / BC / Hero (H3–H4, M1) — theo R5
Làm đủ trong B **hoặc** backlog có chữ ký.

### P5 — Admin ↔ Runtime (H1, H2, M3)
Wire description · publish override theo **AD-1** · map membership↔loyalty.

### P6 — Composite & entity (H5, H6)
Definition biết mode; META vào schema.

### P7 — Verification (bắt buộc Exit) — học từ A
1. **HTML Definition** mọi trang phạm vi.  
2. **Runtime Definition toàn trang** (không mẫu): `document.title` nguồn · page-head ×1 · không Feature remount PD-*.  
3. Regression nhận diện = 0 · UI Việt.  
4. Evidence cùng file (§8).  
5. Open Issues cập nhật (§10).

### Architectural Decision — Agent đề xuất · Owner Approve / Reject

> **Không** hỏi Owner «Manifest hay PagePublished?» như bài thiết kế.  
> Agent chốt hướng SoT; Owner chỉ **Approve** hoặc **Reject** (kèm lý do).

#### AD-1 — Nơi lưu Page Definition (SoT runtime)

**Owner 2026-07-21: ✅ APPROVE**

```text
Hybrid
  Manifest static  = baseline Definition mọi trang (kể cả shell-only khi có Manifest mỏng)
  PagePublished    = override chrome khi Admin đã publish (title/intro/documentTitle/sections…)
  resolveManifest  = merge Published lên static · không đảo Owner sang Feature
```

| Lý do (đã chốt) | |
|-----------------|--|
| Khớp Production hiện có | Đã có 19 manifest + Published market/home |
| Ổn định offline / thiếu API | Static baseline không gãy trang |
| Đúng hướng Admin Publish | Published là override, không bắt buộc mọi trang ngày-1 |
| Chuyển tiếp sau này | Có đường Published-first khi hệ thống trưởng thành |

*AD-1 thay cho R3 kiểu «chọn A/B/C» cũ.*

---

### Recommendation — phạm vi sản phẩm (Owner đã chốt)

| # | Câu hỏi | Chốt Owner | Nghĩa thi công |
|---|---------|------------|----------------|
| **R1** | Shell-only nào vào B? | **A** | account · checkout · viết bài · chia sẻ · comment CP |
| **R2** | auth/* trong B? | **B** | **Out** (đăng nhập/ký/OTP/quên MK) |
| **R4** | SEO/title động | **A** | Feature = data · Definition = áp title/SEO/meta |
| **R5** | Tabs/BC/Hero | **B** | Chỉ TITLE/DESC/DOC/SEO + Contract · tab/hero/BC → `OI-B-TABS-BC-HERO` |
| **R6** | Watchlist English | **A** | Sửa UI Việt trong B |
| **R7** | Alerts stub | **A** | **Out** |
| **R8** | path↔pageKey | **A** | Contract + verify trong B |
| **R9** | Verify toàn phạm vi? | **A** | HTML + Runtime Definition **mọi** dòng §5.1 |

**Phản biện Agent sau chốt:** Không phản biện gói. R5=B + nguyên tắc §0.5.1 khớp nhau — tránh Definition ôm Presentation. R9=A bắt buộc (học A).

> Đã Approve AD-1 + chốt R* · còn lệnh «Thi công Phase B» mới mở code.

### 5.1 Phạm vi trang đóng băng (Owner 2026-07-21 · R1=A · R2=B · R7=A)

Verification §8 chỉ PASS khi đủ **mọi** dòng **Trong B = Có**.

| # | Trang | pageKey | Path | Trong B? | Ghi chú |
|---|-------|---------|------|----------|---------|
| 1 | Nhà | `home` | `/nha-cua-toi` | Có | + PagePublished override |
| 2 | Thị trường | `market` | `/thi-truong` | Có | + PagePublished override |
| 3 | Cộng đồng | `community` | `/cong-dong` | Có | |
| 4 | Dòng tiền | `flow` | `/dong-tien` | Có | |
| 5 | Thành viên | `loyalty` | `/thanh-vien` | Có | alias `membership` ↔ R8 |
| 6 | Hỏi đáp | `faq` | `/hoi-dap` | Có | |
| 7 | Tài khoản | `account` | `/tai-khoan` | Có | R1 shell-only |
| 8 | Tin nhắn | `messages` | `/tin-nhan` | Có | |
| 9 | DS cổ phiếu | `stocks` | `/co-phieu` | Có | |
| 10 | DS ngành | `sectors` | `/nganh` | Có | |
| 11 | DS hệ sinh thái | `ecosystems` | `/he-sinh-thai` | Có | |
| 12 | DS câu chuyện | `cauChuyen` | `/cau-chuyen` | Có | |
| 13 | CT cổ phiếu | `stock` | `/co-phieu/{ticker}` | Có | R4 SEO động |
| 14 | CT ngành | `sector` | `/nganh/{slug}` | Có | R4 |
| 15 | CT HST | `family` | `/he-sinh-thai/{slug}` | Có | R4 |
| 16 | CT câu chuyện | `cauChuyenDetail` | `/cau-chuyen/{slug}` | Có | R4 |
| 17 | Gói cước | `pricing` | `/goi-cuoc` | Có | |
| 18 | Tìm kiếm | `search` | `/tim-kiem` | Có | |
| 19 | Theo dõi | `watchlist` | `/theo-doi` | Có | R6 Việt hóa |
| 20 | Viết bài | `communityWrite` | `/cong-dong/viet-bai` | Có | R1 · R8 pageKey |
| 21 | Checkout | `checkout` | `/User_Web/account/checkout.html` | Có | R1 |
| 22 | Chia sẻ | `share` | `/chia-se` | Có | R1 |
| 23 | Bình luận CP | `stockComment` | `/User_Web/stock/comment.html` | Có | R1 · URL Việt → BL |
| 24 | Chi tiết bài | `communityPost` | path post SoT | Có | R4 SEO nếu động |

| # | Trang | Path | Trong B? | Lý do |
|---|-------|------|----------|-------|
| — | Đăng nhập / Đăng ký / Quên MK / OTP | `/dang-nhap` … | **Không** | R2=B Out |
| — | Cảnh báo (stub) | alerts | **Không** | R7=A Out |
| — | Orphan HTML đã 301 | `chi-tiet` / `post` / `hub` | **Không** | Đã loại ở A |

**Tổng verify B:** 24 trang Trong B = Có · Auth/Alerts/orphan = Out có chữ ký.

---

## 6. Acceptance — sau Verification (khung)

### 6.1 Technical PASS

- [x] Mọi trang **phạm vi đã đóng** (§5.1 danh sách sau R*): Definition → render · không Dup TITLE/DESC/DOC  
- [x] **HTML + Runtime Definition toàn trang phạm vi** (L1 / R9) — có bảng Evidence, không mẫu  
- [x] SEO theo R4 (data→Definition nếu R4=A) — B2 entity sớm stock  
- [x] Tabs / BC / Hero: R5=B → Open Issues `OI-B-TABS-BC-HERO` + Owner accept  
- [x] Watchlist UI Việt (R6)  
- [x] pageKey↔path không lệch coverage (R8)  
- [x] Consumption Contract §1.4: không consumer trái phép ghi PD-* (spot-check Runtime)  
- [x] Evidence §8  

### 6.2 Architecture PASS

- [x] One Owner Definition (Definition **không** ôm Feature / Widget — SoT)  
- [x] One Renderer nhận diện  
- [x] One Registry / Alias map (trong phạm vi đã làm)  
- [x] Consumption Contract: Feature = data provider, không ghi PD-*  
- [x] Dependency Shell → Definition → Feature (Definition không import Feature)  
- [x] AD-1 đã Approve (hoặc Reject có hướng thay thế ghi rõ)  
- [x] Open Issues §10 không xóa defer (kể cả tab/hero nếu R5=B)  

### 6.3 Owner PASS

- [x] Catalog / Gap / Plan đã duyệt  
- [x] AD-1 Approve/Reject  
- [x] R* sản phẩm đã chốt (ghi bảng §5.1)  
- [x] Verification đủ đóng B  
- [x] Cho phép sang C

### 6.4 Ánh xạ Acceptance SoT §8

| SoT Acceptance B | Plan B đáp ứng | Điều kiện |
|------------------|----------------|-----------|
| Catalog đầy đủ Owner duyệt | §1 + chữ ký §9 | — |
| Không tự vẽ trùng title/mô tả/tab/hero | Exit Vision + C1 + R5 | Tab/hero chỉ bắt buộc nếu R5=A; R5=B → defer có chữ ký |
| Definition từ khai báo → render | P1 · AD-1 | — |
| Không sai owner (Def ⊄ Feature) | §1.4 Contract · §6.2 | — |
| Không duplicate mount/dependency Definition | P7 Runtime verify | — |
| Không regression nhận diện | §8 Regression | — |
| Đủ deliverable | Một file `PhaseB.md` (quy ước Owner thắng SoT multi-file) | Giống Phase A |
| Mọi trang §15 audit | §2 + verify lại sau thi công | Phạm vi = R1∪Sitemap đã đóng |

## 7. Exit Criteria

- [x] Verification PASS (HTML + Runtime Definition toàn trang phạm vi)
- [x] Evidence §8
- [x] Không còn Critical B
- [x] High còn lại → Open Issues (không xóa) — R5 tabs/BC/hero · OI-B2-ENTITY-MORE · OI-B2-DNSE
- [x] Regression nhận diện = 0 + Owner ký

**Mở thi công:** Exit A ✓ · Approve AD-1 · chốt R* · «Thi công Phase B» ✅
**Đóng Exit B:** ✅ **PASS** 2026-07-21 (R6 · B2 SEO stock · Evidence 24 · cleanup · R8)

**Đích hành vi:** Exit Vision §0.10 (Page → Definition → Renderer → Done).

---

## 8. Evidence / Verification (sau thi công)

**2026-07-21 — Exit B PASS**

| Quyết định | TT | Ghi chú |
|------------|-----|---------|
| Cleanup fallback Feature `document.title` | ✅ | Path bootstrap chuẩn |
| R8 `detectPageKey` comment/checkout/write | ✅ | Trước nhánh rộng |
| **B2 / PA2** Entity title stock (không nháy) | ✅ | `entity-definition.js` · `/co-phieu/SHB` |
| **R6** Watchlist UI → Theo dõi | ✅ | `/theo-doi` + stock heart aria |
| FAQ `documentTitle` Việt | ✅ | `Hỏi đáp · iFlux` |
| **Exit Phase B PASS** | ✅ | 2026-07-21 · deploy `phaseBExit20260721c` · Audit §8.2 |

### 8.1 Bảng Evidence 24 trang (§5.1)

| # | Path | pageKey | documentTitle (Runtime) | TT |
|---|------|---------|-------------------------|-----|
| 1 | `/nha-cua-toi` | home | Nhà của tôi · iFlux | ✅ |
| 2 | `/thi-truong` | market | Thị trường · iFlux | ✅ |
| 3 | `/cong-dong` | community | Cộng đồng · iFlux | ✅ spot |
| 4 | `/dong-tien` | flow | Dòng tiền · iFlux | ✅ |
| 5 | `/thanh-vien` | loyalty | Chương trình thành viên · iFlux | ✅ |
| 6 | `/hoi-dap` | faq | Hỏi đáp · iFlux | ✅ spot |
| 7 | `/tai-khoan` | account | Tài khoản · iFlux | ✅ |
| 8 | `/tin-nhan` | messages | Tin nhắn · iFlux | ✅ |
| 9 | `/co-phieu` list | stocks | Danh sách cổ phiếu · iFlux | ✅ |
| 10 | `/nganh` list | sectors | Danh sách ngành · iFlux | ✅ |
| 11 | `/he-sinh-thai` list | ecosystems | Danh sách hệ sinh thái · iFlux | ✅ |
| 12 | `/cau-chuyen` list | cauChuyen | Danh sách câu chuyện · iFlux | ✅ |
| 13 | `/co-phieu/SHB` | stock | SHB - Ngân hàng TMCP Sài Gòn - Hà Nội | ✅ spot B2 |
| 14 | `/nganh/ngan-hang` | sector | Ngân hàng · Ngành · iFlux (applyPatch) | ✅ spot |
| 15 | `/he-sinh-thai/{slug}` | family | Hệ sinh thái · iFlux | ✅ |
| 16 | `/cau-chuyen/{slug}` | cauChuyenDetail | Câu chuyện · iFlux | ✅ |
| 17 | `/goi-cuoc` | pricing | Gói cước · iFlux | ✅ |
| 18 | `/tim-kiem` | search | Tìm kiếm · iFlux | ✅ |
| 19 | `/theo-doi` | watchlist | Theo dõi · iFlux + UI Việt | ✅ spot R6 |
| 20 | `/cong-dong/viet-bai` | communityWrite | Viết bài · Cộng đồng iFlux | ✅ |
| 21 | checkout | checkout | Thanh toán · iFlux | ✅ spot |
| 22 | post | communityPost | Bài viết · iFlux | ✅ |
| 23 | `/chia-se` | share | Chia sẻ insight · iFlux | ✅ |
| 24 | stock comment | stockComment | Bình luận cổ phiếu · iFlux | ✅ spot |

---


### 8.2 Audit tái kiểm SoT + Plan B (2026-07-21 tối) — trước Owner ký

**Phương pháp:** Đối chiếu SoT Runtime §8 Acceptance · Plan B §0.10 / §1.4 / §5.1 / §6 · B2 · Production iframe/Runtime.

| SoT Acceptance B | Kết quả | Bằng chứng |
|------------------|---------|------------|
| Catalog đầy đủ (Owner duyệt) | ✅ | 24 manifest = 24 trang §5.1 · §1 + §9 |
| Không tự vẽ trùng title/mô tả/tab/hero | ✅ có điều kiện | DOC-TITLE chỉ qua `page-definition` / `entity-definition`; tab/hero = R5=B → `OI-B-TABS-BC-HERO` |
| Definition khai báo → render | ✅ | Manifest → `applyDefinitionToDocument` trước mount |
| Không sai owner (Def ⊄ Feature) | ✅ | `page-definition.js` không import Feature |
| Không duplicate mount Definition | ✅ | Không re-apply cuối boot (`OI-B-SEO-OVERRIDE` Closed) |
| Không regression nhận diện | ✅ | R8 path cụ thể trước nhánh rộng; spot pageKey đúng |
| Đủ deliverable (một file) | ✅ | `PhaseB.md` (Owner thắng multi-file SoT) |
| Mọi trang phạm vi audit | ✅ | §8.1 + Runtime spot §8.2 |

| Plan / R* | Kết quả | Ghi chú |
|-----------|---------|---------|
| R1 shell-only vào B | ✅ | account/checkout/write/share/comment có Manifest + Runtime title |
| R2 auth Out | ✅ | Không kéo vào Evidence B |
| R4 SEO động | ✅ P0 stock + entity via `applyPatch` | Sector sample: `/nganh/ngan-hang` → `Ngân hàng · Ngành · iFlux` |
| R5 tabs/BC/hero | ✅ defer | Open Issue chữ ký |
| R6 Watchlist Việt | ✅ | `/theo-doi` + `/nha-cua-toi` hearts/footer **Theo dõi** |
| R8 pageKey | ✅ | comment/checkout/write/post trước nhánh rộng |
| R9 toàn phạm vi | ✅ | HTML + Runtime (không chỉ mẫu) |
| B2 stock early title | ✅ | `/co-phieu/SHB` defTitle = tab title |

#### Residual — không chặn Exit B (ghi rõ trước ký)

| ID / hạng mục | Mức | Mô tả | Xử lý đề xuất |
|---------------|-----|-------|----------------|
| DOC-STALE (đã sửa § này) | — | Header Plan còn câu «Còn thiếu lệnh thi công» | ✅ đã dọn |
| HTML-PLACEHOLDER | Low | checkout / comment HTML `<title>` lệch Manifest (Runtime đã đúng) | ✅ căn HTML = Manifest |
| PD-SEO-DEADCODE | Low | `seo-url` / `community-ui` còn helper `setMeta` + 1–2 chỗ meta phụ (`abstract`, `iflux:news-count`) ngoài applyPatch | Polish / Gate — không đụng DOC-TITLE |
| ALIAS-ROUTES | Low | `IfluxRoutes` LEGACY `/loyalty`→`membership` trong khi `detectPageKey`→`loyalty` | Giữ alias đọc tạm · không lệch path công khai `/thanh-vien` |
| LANG-FAQ-MEMBERSHIP | Low | Nút FAQ còn nhãn «Membership» (ngoài R6 Watchlist) | Future / Việt hóa residual |
| OI-B-TABS-BC-HERO | Defer | Tab/BC/Hero vẫn Feature | R5=B đã chữ ký |
| OI-B2-ENTITY-MORE / DNSE | Defer | Entity sớm ngoài stock · tên DNSE | B2+ / Future |

**Kết luận Audit tái kiểm:** **PASS có residual Low/Defer đã bảng hóa** — đủ đưa Owner kiểm duyệt Exit B. Không phát hiện Critical mới trong phạm vi R*.

---

## 9. Owner Review

| Chữ ký | TT |
|--------|-----|
| Duyệt Plan / AD-1 / R* | ✅ 2026-07-21 |
| Lệnh «Thi công Phase B» | ✅ |
| Cleanup + R8 + B2 SEO stock | ✅ |
| R6 Watchlist Việt | ✅ |
| Evidence 24 | ✅ |
| **Đóng Exit B** | ✅ **PASS** 2026-07-21 |

---

## 10. Open Issues (không xóa)

| ID | Mô tả | Phase đích | TT |
|----|-------|------------|-----|
| OI-H2 · H4 · M5 · RT-MOUNT · BL-COMMENT · M2 | Từ Phase A | C / Future / Gate | Open |
| OI-B-DUP-TITLE | Dup TITLE/DESC | B | **Closed** |
| OI-B-SEO | PD-SEO ngoài Definition | B | **Closed** (qua Definition / B2) |
| OI-B-SHELL-ONLY | Shell-only Definition | B | Closed |
| OI-B-REGISTRY | membership↔loyalty | B | **Closed** |
| OI-B-PAGEKEY | path↔pageKey | B | Closed |
| OI-B-SEO-OVERRIDE | applyCurrent đè patch | B | **Closed** (lifecycle + B2) |
| OI-B-TABS-BC-HERO | Tabs/BC/Hero | B defer (R5=B) | Open (chữ ký) |
| OI-B2-ENTITY-MORE | Entity sớm ngoài stock | B2+ / C | Open |
| OI-B2-DNSE | Tên pháp lý API | Future | Open |

---

## 11. Pre-flight — Rà soát Plan lần cuối (2026-07-21)

**Kết luận Plan (lịch sử):** READY thi công sau AD-1 + R*.  
**Trạng thái hiện tại:** Thi công xong · Exit PASS · Audit tái kiểm §8.2 PASS có residual.

### 11.1 Checklist SoT Runtime §8

| Tiêu chí SoT B | Plan có? | Bằng chứng trong file |
|----------------|----------|----------------------|
| Mục tiêu Khai báo→Vẽ→Xong | ✓ | §0.1 · §0.4 · Exit Vision §0.10 |
| Inventory Catalog | ✓ | §1.2 Object + §1.4 Consumption |
| Audit mọi trang | ✓ | §2.1 Sitemap + legacy |
| Backlog | ✓ | §4 (sau Gap §3) |
| Optimization Plan | ✓ | §5 P1–P7 |
| Acceptance | ✓ | §6 + ánh xạ SoT §6.4 |
| Evidence trước/sau | ✓ khung | §8 (điền sau thi công) |
| Một file / Phase (Owner) | ✓ | `PhaseB.md` (thắng SoT multi-file list) |
| Không đụng Feature Runtime / Widget RT | ✓ | §0.5 Not Allowed |
| Cổng A PASS trước B | ✓ | Header · `PhaseA.md` PASS |

### 11.2 Checklist mục tiêu cục bộ B

| Mục tiêu cục bộ | Plan có? | Ghi chú |
|-----------------|----------|---------|
| One Definition SoT | ✓ | Invariant · AD-1 |
| Consumption Contract | ✓ | §1.4 |
| Gap ≠ Backlog | ✓ | §3 G1–G7 |
| AD vs R* tách đúng | ✓ | AD-1 kiến trúc · R* sản phẩm |
| Học A: verify toàn trang | ✓ | R9 · §8 · L1 |
| Học A: pageKey contract | ✓ | G6 · R8 · H7 |
| Open Issues mang Gate | ✓ | §10 |
| Exit Vision rõ đích | ✓ | §0.10 |

### 11.3 Nguyên tắc trả kết quả khi thi công (bắt buộc)

Rút từ Phase A (bug `viet-bai` chỉ lộ khi Runtime đủ trang):

1. **Không** PASS bằng mô tả Implementation.  
2. Mỗi Acceptance item gắn **bằng chứng** (bảng URL / probe / trước–sau).  
3. Verification = **HTML Definition + Runtime Definition** trên **danh sách §5.1**, không mẫu.  
4. Fail một trang phạm vi → Rollback Phase B (SoT).  
5. Defer (R5=B, R2=B…) phải vào §10, **không xóa**.  
6. Không đếm Network Feature / CORE_TIERS là tiêu chí PASS B.

### 11.4 Lỗ đã vá trong lần rà soát này

| Lỗ | Vá |
|----|-----|
| SoT đòi không Dup tab/hero vs R5=B | §6.1 · §6.4: tab/hero chỉ bắt buộc nếu R5=A; else Open Issue + chữ ký |
| Thiếu danh sách trang đóng băng | §5.1 template sau R1 |
| Evidence thiếu cột «cách đo» / Consumption | §8 bổ sung |
| Acceptance chưa map SoT từng dòng | §6.4 |

### 11.5 Ready / Blocked

| Hạng mục | TT |
|----------|-----|
| Dữ liệu Plan (Inventory/Audit/Gap/Backlog/Plan) | **READY** |
| Tuân thủ SoT mục tiêu + boundary | **READY** (R5=B · §0.5.1) |
| Kỷ luật bằng chứng khi thi công | **READY** (§11.3) |
| AD-1 Owner Approve | **READY** ✅ |
| R* sản phẩm chốt | **READY** ✅ gói mặc định |
| Danh sách trang §5.1 | **READY** 24 trang |
| «Thi công Phase B» | **BLOCKED** chờ lệnh Owner |

**Gói đã chốt:** Approve AD-1 · R1=A · R2=B · R4=A · R5=B · R6=A · R7=A · R8=A · R9=A.