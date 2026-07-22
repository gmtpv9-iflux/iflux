# SoT — Trình tự tối ưu Runtime (Phase 0 → A → B → C → Gate)

**Trạng thái:** Phase 0/A/B **PASS** · Phase C **Exit PASS** (Có điều kiện Perf · 2026-07-22) · **Task 3 đóng Ownership/Runtime** · tiếp **Task 4** = `SoT — Resource Loading Strategy (Task 4).md`  

**Nguồn thống nhất:** Runtime Blueprint RL-1.0 (FROZEN) + `Phase0.md` + Audit 80 (tham khảo)  
**Người ra lệnh từng Phase:** Owner (bạn). Agent **không** tự nhảy Phase.

---

## MỤC ĐÍCH TỔNG THỂ (đọc trước mọi Phase)

Phần này **bắt buộc đứng đầu** mọi tài liệu / canvas Phase (A, B, C, 0, Gate).

### Đích đến của cả task

Hoàn thiện **cách tải và sở hữu runtime** trên User Web:

- đúng thứ tự khởi động  
- đúng chủ (một resource → một owner)  
- **chỉ tải khi cần** — tắt / không dùng thì không kéo theo rác  

**Khi xong Gate + MR:** App Shell sạch · Page Definition một nguồn · Page Feature có đường tải riêng · Widget Pipeline không regression · ownership / dependency / loading rõ · có số đo trước–sau.

### Hành trình các Phase

| Phase | Nhắm vào | Mục đích trong hành trình |
|-------|----------|---------------------------|
| **0 · Baseline** | Đóng băng hiện trạng | Có mốc so sánh & rollback trước khi sửa |
| **A · App Shell** | Khung dùng chung mọi trang | Một Shell thống nhất — trang chỉ *consume*, không tự ôm / tải trùng dùng chung |
| **B · Page Definition** | Tiêu đề, mô tả, tab cố định, SEO… | Nhận diện trang: khai báo → vẽ → xong (không hardcode trùng) |
| **C · Page Feature** | Feed, chat, form, landing… | Sinh đường tải Feature riêng (RL-1.0 chưa có) rồi migrate từng phần |
| **Gate** (Technical + Architecture) | Kiểm tra toàn hệ thống | Chứng minh không regression · ownership sạch → mới MR |

**Widget Pipeline** đã hoàn thiện theo RL-1.0 — **không làm lại** trong 0/A/B/C; chỉ kiểm regression ở Gate.

**Thứ tự bắt buộc:** 0 → A → B → C → Gate → MR.

### Vai trò từng lớp (nhắc ngắn)

| Lớp | Việc của lớp |
|-----|----------------|
| App Shell | Header, menu, search toàn cục, thông báo… — dùng chung |
| Page Definition | Nhận diện / metadata trang |
| Page Feature | Việc làm riêng của từng trang |
| Widget | Ô tiện ích theo Placement (đã có pipeline) |

---

## 0. Invariant xuyên suốt (luật không được phá)

### 0.1 Ownership — một tài nguyên, một chủ

| Luật | Ý nghĩa tiếng người |
|------|---------------------|
| **Một resource chỉ có một Owner** | Không «ai cũng chịu trách nhiệm một chút» |
| **Không shared ownership** | Header không vừa thuộc Shell vừa thuộc trang Cộng đồng |
| **Phát hiện nhiều owner → Audit FAIL** | Dừng Phase; ghi backlog; không được PASS |

Đây là triết lý xuyên suốt toàn bộ kiến trúc.

### 0.2 Không tự tạo Source of Truth mới

Trong **mọi Phase**:

- Agent **chỉ được tiêu thụ** SoT / Catalog / Blueprint **đã tồn tại** (hoặc vừa được Owner duyệt trong Phase đó).  
- Agent **không được** tự sinh SoT mới «cho tiện».  
- **Thiếu SoT → dừng và báo Owner.** Không đoán, không bịa Catalog.

### 0.3 Lazy Loading (mục tiêu của cả lộ trình)

1. **Không tải** nếu chưa cần.  
2. **Không gắn lên màn hình** nếu chưa dùng.  
3. **Không preload** Feature của trang khác.  
4. **Không preload** Widget đã tắt Placement.  
5. **Không preload** thứ chỉ dành cho người đã đăng nhập (khi đang là khách).

### 0.4 Dependency — ai được nhờ ai

| Từ ↓ | Được phép nhờ |
|------|----------------|
| **App Shell** | Chỉ Shell (và nền tảng dùng chung đã thuộc Shell) |
| **Page Definition** | Shell |
| **Page Feature** | Shell + Page Definition |
| **Widget** | Widget Runtime / pipeline Widget (không nhờ Page Feature / không nhờ «trang» lung tung) |

**Cấm ví dụ:**

- Page Definition **không** import Feature  
- Feature **không** import Widget Runtime  
- Widget **không** import Page (Definition / Feature)

Vi phạm bảng này → Audit / Gate **FAIL**.

### 0.5 Regression — Phase sau không được sửa ngược Phase trước

- Một Phase **PASS** = đóng băng kết quả Phase đó.  
- Phase sau **không được** tiện tay sửa đối tượng của Phase trước (vd Phase C **không** sửa Header).  
- Muốn sửa lại → Owner mở **Regression Task** riêng (nêu rõ đối tượng + lý do). Không «sửa ké».

### 0.6 Rollback — một trang FAIL thì dừng Phase

Nếu trong lúc thi công / kiểm tra lại:

1. **Một trang FAIL** → **rollback toàn bộ Phase hiện tại** (không giữ nửa chừng).  
2. **Không** chuyển sang Phase tiếp.  
3. Cập nhật backlog.  
4. Sửa lại theo plan đã duyệt (hoặc chỉnh plan nếu Owner đồng ý).  
5. Chạy lại Audit / Acceptance của Phase đó.

---

## 1. Vì sao làm việc này (tiếng người)

Hệ thống đã có **đường tải Widget** khá ổn: Admin tắt widget → widget đó không tải.

Nhưng trên mỗi trang còn 3 loại việc khác nhau:

| Loại | Bạn thấy trên màn hình | Ví dụ |
|------|------------------------|--------|
| **App Shell** | Khung dùng chung mọi trang | Header, menu, thông báo, hộp đăng nhập… |
| **Page Definition** | Nhận diện / khung trang | Tiêu đề, mô tả, breadcrumb, tab cố định, SEO… |
| **Page Feature** | Việc làm riêng của trang | Feed Cộng đồng, chat, form hồ sơ, landing Thành viên… |
| **Widget** *(đã có pipeline)* | Ô tiện ích Admin đặt | Heatmap, Watchlist, Top 10… |

**Vấn đề còn lại:** App Shell và Page Definition gần ổn nhưng còn backlog. **Page Feature chưa có đường tải riêng** — nên tắt hết widget vẫn có thể kéo theo nhiều thứ của Feature.

---

## 2. Thứ tự tải Runtime (không để Agent đoán)

Thứ tự **bắt buộc** khi mở một trang:

```text
Browser
  ↓
App Shell
  ↓
Route Registry
  ↓
Page Registry
  ↓
Page Definition
  ↓
Page Feature
  ↓
Widget Runtime          ← nhánh Widget (Placement → Host → …)
  ↓
Widget Template
  ↓
Design System
  ↓
Render
```

Sau khi đã biết **Page** nào:

Ba nhánh nội dung **độc lập** (cùng đổ về Render), nhưng **không đảo thứ tự khởi động** ở trên:

```text
Page
  ├─ Page Definition  → … → Render
  ├─ Page Feature     → … → Render
  └─ Widget Pipeline  → PagePublished → Placement → Host
                        → Permission → tải resource → Widget
                        → Template → Design System → Render
```

- **Page Definition** — chỉ metadata / nhận diện trang  
- **Page Feature** — chỉ nội dung đặc thù trang  
- **Widget Pipeline** — chỉ widget theo Placement (đã theo RL-1.0)

---

## 3. Hiện trạng đã chốt (không mở lại tranh luận)

| Nhánh | Hiện trạng | Danh sách đối tượng |
|-------|------------|---------------------|
| **App Shell** | Đã chuẩn hóa phần lớn; còn backlog dependency dùng chung | Catalog lập ở Phase A · tham chiếu audit canvas |
| **Page Definition** | Đã có đường Manifest → vẽ tiêu đề/mô tả; còn backlog hardcode trùng | Owner = **Page** trong audit 80 |
| **Page Feature** | **Chưa** có kiến trúc tải riêng | Owner = **Page Feature** trong audit 80 |
| **Widget Pipeline** | **Đã xong** theo RL-1.0 | Host / Placement / Runtime — không làm lại trừ Regression Task / Gate |

**Nguồn danh sách đặc thù:** canvas *Audit — 80 nội dung đặc thù (Owner)*.

---

## 4. Luật chơi chung (bắt buộc)

1. **Phase 0 trước** mọi Phase sửa code.  
2. **Làm theo Phase:** 0 → A → B → C → Gate → MR.  
3. **Mỗi Phase A/B/C:** Inventory → Audit mọi trang (chỉ backlog) → Plan → Thi công → **Acceptance PASS** mới sang Phase sau.  
4. **Không bỏ sót trang.**  
5. **App Shell tối ưu theo đối tượng dùng chung** (không dọn theo trang rồi trang khác kéo ngược).  
6. **Widget Pipeline không đụng** ngoài Regression Task / Gate regression.  
7. Agent **chỉ làm Phase khi Owner chỉ thị rõ**.  
8. Tuân thủ toàn bộ **§0 Invariant**.

---

## 5. Sơ đồ tổng

```text
Phase 0 — Baseline (READ ONLY)     ← đóng băng bằng chứng
    ↓
Phase A — App Shell
    ↓ (Exit Criteria A đủ — Acceptance PASS + quản trị)
Phase B — Page Definition
    ↓ (Acceptance B PASS mọi trang)
Phase C — Page Feature (C1 → C2 → migrate)
    ↓ (Acceptance C PASS)
Gate — Technical Gate + Architecture Gate
    ↓ (cả hai PASS + ghi nhận Performance trước/sau)
MR / Merge
```

---

## 6. Phase 0 — Baseline (READ ONLY)

### Mục tiêu
Đóng băng **mốc hiện tại** trước khi tối ưu — để so sánh và rollback có chỗ dựa.

### Làm gì (không sửa code)

| Việc | Output tiếng người |
|------|---------------------|
| Freeze Inventory hiện tại | Ảnh chụp danh sách đối tượng / trang |
| Freeze Dependency graph | Ai nhờ ai (Shell / Page / Feature / Widget) |
| Freeze Loading graph | Thứ tự / thứ gì đang tải khi mở trang |
| Freeze Owner inventory | Ai sở hữu gì (gắn audit 80) |
| Freeze số lượng JS / CSS | Đếm file / request liên quan (ghi số) |
| Freeze Performance baseline | Đo trước: xem §14 |

### Deliverable Phase 0 (bắt buộc)

**Một file kết quả (Owner):** `docs/runtime-opt/Phase0.md`  
Gồm đủ: Baseline tổng · Inventory/Owner · Dependency graph · Loading graph · Performance baseline.

> Quy ước: mỗi Phase (0/A/B/C/Gate) trả **một file** trong `docs/runtime-opt/` — không tách nhiều file cùng Phase.

### Acceptance Phase 0

PASS nếu:

- ✓ Đủ nội dung trong `Phase0.md` (Inventory · Dependency · Loading · Performance · ngày giờ / phạm vi)  
- ✓ Owner duyệt «đủ làm mốc»  

Sau PASS mới được bắt đầu / tiếp tục Phase A.

**Không sửa code trong Phase 0.**

---

## 7. Phase A — App Shell

### Mục tiêu
Hoàn thiện khung dùng chung mọi trang — tối ưu **theo đối tượng**, không theo trang.

### Scope Boundary (Allowed / Not Allowed)

| | Nghĩa | Phase A |
|--|-------|---------|
| **Allowed** | Được sửa | App Shell Objects · Infra phục vụ Shell · Resource của Shell |
| **Not Allowed** | Không được sửa | Page Definition · Page Feature · Widget Pipeline / Runtime |

### Out of Scope (khác Not Allowed)

Có thể **thấy** vấn đề khi audit Shell — nhưng Phase A **cố tình bỏ qua** (để B/C/Gate hoặc task riêng):

- Không refactor kiến trúc Feature  
- Không đổi Widget Runtime  
- Không migrate Definition  
- Không tối ưu Business Logic  
- Không đổi API Contract  

**Không được thêm hardcode mới nếu chưa có Human phê duyệt.**

> Allowed = được sửa · Not Allowed = không được sửa · Out of Scope = thấy vấn đề nhưng cố tình bỏ qua.

### Bước

1. **Inventory** → App Shell Catalog (đầy đủ, không sơ sót)  
2. **Audit mọi trang** → thiếu / thừa / trùng / sai owner / tải sớm sai — **chỉ backlog**  
3. **Optimization Plan** theo từng đối tượng  
4. **Thi công** (khi Owner duyệt plan)  
5. **Acceptance** mọi trang  
6. **Exit Criteria** → mới được đóng Phase A  

### Deliverable Phase A

**Một file kết quả (Owner):** `docs/runtime-opt/PhaseA.md`  
Gồm: Catalog · Audit · Backlog · Plan · Acceptance · Exit · Evidence (sau thi công).

> Quy ước: mỗi Phase = một file · neo tư liệu Phase 0 (`Phase0.md`) khi làm A.

### Acceptance Phase A (kỹ thuật — PASS nghĩa là gì)

PASS **chỉ khi đủ tất cả**:

- ✓ Catalog đầy đủ (Owner duyệt)  
- ✓ Không còn owner sai (Shell vs trang)  
- ✓ Không còn gắn trùng (duplicate mount)  
- ✓ Không còn dependency trùng không cần thiết  
- ✓ Không phát sinh regression (UI Shell mọi trang)  
- ✓ Mọi trang trong phạm vi **cùng dùng App Shell** đã chuẩn (không trang nào tự ôm Shell)  
- ✓ Đủ deliverable Phase A  
- ✓ Mọi trang trong danh sách §15 đã được audit và ghi kết quả  
- ✓ Single Entry · Single Owner · Single Mount  

**Một trang FAIL → Rollback Rule §0.5.**

### Exit Criteria Phase A (quản trị — được phép đóng Phase)

Acceptance ≠ Exit. Acceptance = kỹ thuật. Exit = quản trị.

Phase A **chỉ được đóng** khi đủ tất cả:

- ✓ Verification PASS  
- ✓ Evidence Report sinh mới  
- ✓ Không còn Critical  
- ✓ High còn lại đã được Owner chấp nhận (defer / accept risk ghi rõ)  
- ✓ Regression = 0  

Thiếu một mục Exit → chưa đóng Phase A · chưa sang B.

### Điều kiện sang Phase B
Exit Criteria A đủ + Owner cho phép.

---

## 8. Phase B — Page Definition

### Mục tiêu
Mọi nhận diện / metadata trang: **Khai báo trang → Vẽ → Xong.** Không hardcode trùng.

### Bước
Inventory Catalog → Audit mọi trang → Plan → Thi công → Acceptance.

### Deliverable Phase B

| File | Nội dung |
|------|----------|
| `docs/runtime-opt/PhaseB-PageDefinitionCatalog.md` | Catalog (Title, Description, Breadcrumb, SEO, Tabs…) |
| `docs/runtime-opt/PhaseB-PageDefinitionAudit.md` | Audit mọi trang |
| `docs/runtime-opt/PhaseB-PageDefinitionBacklog.md` | Backlog |
| `docs/runtime-opt/PhaseB-OptimizationPlan.md` | Plan |
| `docs/runtime-opt/PhaseB-EvidenceReport.md` | Bằng chứng trước/sau |

### Acceptance Phase B

PASS **chỉ khi đủ tất cả**:

- ✓ Catalog đầy đủ (Owner duyệt)  
- ✓ Không còn tự vẽ trùng tiêu đề / mô tả / tab / hero thuộc Definition  
- ✓ Mọi Page Definition đi từ khai báo trang → render  
- ✓ Không sai owner (Definition không ôm Feature / Widget)  
- ✓ Không duplicate mount / dependency Definition  
- ✓ Không regression nhận diện trang  
- ✓ Đủ deliverable Phase B  
- ✓ Mọi trang §15 đã audit  

**FAIL một trang → Rollback Phase B.**

### Điều kiện sang Phase C
Acceptance B PASS + Owner cho phép.

---

## 9. Phase C — Page Feature

### C1 — Inventory & Audit
Catalog Feature theo trang + audit (owner, dependency, css, js, store, api, route).

### C2 — Thiết kế Feature Runtime rồi migrate
Kiến trúc mới (RL-1.0 chưa có), ví dụ hướng:

```text
Page Feature
  → Feature Manifest
  → Feature Loader
  → Dependency Feature
  → Store Feature (nếu cần)
  → Feature Runtime
  → Template → Design System → Render
```

### Deliverable Phase C

| File | Nội dung |
|------|----------|
| `docs/runtime-opt/PhaseC-PageFeatureCatalog.md` | Catalog Feature theo trang |
| `docs/runtime-opt/PhaseC-PageFeatureAudit.md` | Audit C1 |
| `docs/runtime-opt/PhaseC-PageFeatureBacklog.md` | Backlog |
| `docs/runtime-opt/PhaseC-FeatureRuntimeArchitecture.md` | Kiến trúc C2 (Owner duyệt trước migrate) |
| `docs/runtime-opt/PhaseC-OptimizationPlan.md` | Plan migrate từng Feature |
| `docs/runtime-opt/PhaseC-EvidenceReport.md` | Bằng chứng trước/sau |

### Acceptance Phase C

PASS **chỉ khi đủ tất cả**:

- ✓ Catalog Feature đầy đủ theo mọi trang §15  
- ✓ Kiến trúc Feature Runtime đã được Owner duyệt  
- ✓ Mọi Feature trong Catalog đã migrate (hoặc trạng thái Owner chốt rõ)  
- ✓ Feature không còn «ôm cục» tải khi không cần  
- ✓ Ownership Feature rõ; không shared ownership  
- ✓ Không vi phạm Dependency Rule §0.4  
- ✓ Không regression Feature / không đụng Shell–Definition (trừ Regression Task)  
- ✓ Đủ deliverable Phase C  

**FAIL → Rollback Phase C.**

### Điều kiện sang Gate
Acceptance C PASS + Owner cho phép.

---

## 10. Gate cuối — hai cửa (trước MR)

**Không merge** nếu thiếu một cửa.

### 10.1 Technical Gate (kỹ thuật tải / trùng)

| # | Tiêu chí |
|---|----------|
| T1 | Không duplicate JS không cần thiết |
| T2 | Không duplicate CSS không cần thiết |
| T3 | Không eager load sai |
| T4 | Không cross-import lung tung (đối chiếu §0.4) |
| T5 | Widget Pipeline không regression |
| T6 | Request / transferred có ghi nhận trước–sau (§14) |

### 10.2 Architecture Gate (kiến trúc / sở hữu)

| # | Tiêu chí |
|---|----------|
| A1 | App Shell Acceptance còn PASS |
| A2 | Page Definition Acceptance còn PASS |
| A3 | Page Feature Acceptance còn PASS |
| A4 | Ownership invariant (§0.1) — không multi-owner |
| A5 | Dependency graph sạch, khớp SoT |
| A6 | Loading graph khớp thứ tự §2 |
| A7 | Catalog / Inventory đủ và khớp thực tế |
| A8 | Không có SoT «tự sinh» ngoài quy trình |

### 10.3 Performance — ghi nhận trước / sau (không bắt buộc số cứng)

Gate **bắt buộc ghi nhận** (baseline Phase 0 vs sau tối ưu), không đặt target cứng trong SoT này:

| Chỉ số | Ghi trước | Ghi sau |
|--------|-----------|---------|
| Số JS liên quan | ✓ | ✓ |
| Số CSS liên quan | ✓ | ✓ |
| Request count | ✓ | ✓ |
| Transferred size | ✓ | ✓ |
| Blocking time (nếu đo được) | ✓ | ✓ |
| LCP | ✓ | ✓ |
| FCP | ✓ | ✓ |

Owner quyết định «có chấp nhận mức cải thiện» trước khi mở MR.

### Deliverable Gate

| File | Nội dung |
|------|----------|
| `docs/runtime-opt/Gate-TechnicalReport.md` | Technical Gate |
| `docs/runtime-opt/Gate-ArchitectureReport.md` | Architecture Gate |
| `docs/runtime-opt/Gate-PerformanceBeforeAfter.md` | Performance trước/sau |

**Cả Technical + Architecture PASS (+ Owner duyệt Performance) → mới MR.**

---

## 11. Gắn với Audit 80

| Owner trong audit 80 | Phase |
|----------------------|-------|
| Đối tượng App Shell (lập Catalog A) | **A** |
| **Page** | **B** |
| **Page Feature** | **C** |
| Widget Host / Placement / Runtime | Gate regression / Regression Task |
| Không đặc thù (inventory cũ) | Ngoài lộ trình Feature; Widget theo RL-1.0 |

---

## 12. Phạm vi trang (không bỏ sót)

Nhà · Thị trường · Cộng đồng · Dòng tiền · Thành viên · Hỏi đáp · Tài khoản · Tin nhắn · Danh sách cổ phiếu / ngành / hệ sinh thái / câu chuyện · Chi tiết mã / ngành / hệ sinh thái / câu chuyện · *(+ trang Sitemap khác nếu có)*

**Thiếu một trang trong Audit / Acceptance của Phase = chưa PASS Phase đó.**

---

## 13. Cách Owner ra lệnh

| Bạn nói | Agent làm |
|---------|-----------|
| «Bắt đầu Phase 0» | Freeze baseline + deliverable §6 · **không sửa code** |
| «Bắt đầu Phase A» | Chỉ khi Phase 0 PASS |
| «Duyệt plan A / thi công A» | Thi công theo plan đã duyệt |
| «Bắt đầu Phase B» | Chỉ khi Exit Criteria A đủ (Acceptance PASS + quản trị) |
| «Bắt đầu Phase C» | Chỉ khi Acceptance B PASS |
| «Chạy Gate» | Chỉ khi Acceptance C PASS |
| «Mở Regression Task: …» | Được sửa đối tượng Phase đã PASS theo phạm vi task |

---

## 14. Performance baseline (chi tiết)

- **Trước mọi tối ưu:** ghi trong Phase 0.  
- **Sau mỗi Phase (khuyến nghị)** và **bắt buộc ở Gate:** ghi lại cùng bộ chỉ số §10.3.  
- Không bịa số. Không đặt «phải giảm X%» trong SoT này — Owner chốt khi xem báo cáo.

---

## 15. Không làm khi chưa được chỉ thị

- Không thi công A/B/C khi chưa xong Phase 0 (trừ Owner nói rõ bỏ qua — phải ghi lý do)  
- Không tự tạo SoT mới  
- Không tự merge / MR  
- Không sửa Phase đã PASS khi chưa có Regression Task  

---

## 16. Thư mục deliverable (chuẩn)

Tất cả file Phase/Gate mặc định nằm dưới `docs/runtime-opt/`.

**Quy ước Owner:** mỗi Phase = **một file** kết quả (`Phase0.md`, `PhaseA.md`, …) — không tách nhiều file cùng Phase.

Agent **không** tạo thêm thư mục SoT gốc repo trừ khi Owner yêu cầu.

---

**Chữ ký ghi nhận:** Phase 0 PASS (`Phase0.md`) · Phase A làm lại từ đầu (`PhaseA.md`) neo N0 · chờ Owner duyệt Plan trước thi công.
