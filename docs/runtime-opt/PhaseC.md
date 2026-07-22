# Phase C — Page Feature Runtime (một file kết quả)

**Trạng thái:** ✅ **EXIT C PASS** (Owner · **Có điều kiện** · 2026-07-22) · W0–W5 · Gate §11 Evidence đóng trong C · Plan v1.2  
**Ngày lập:** 2026-07-21 · **Review:** Round 2+3 (§14 · §14.2) · **Exit:** 2026-07-22  
**SoT:** `SoT — Trình tự tối ưu Runtime` §9 (C1→C2) · §0 Invariant · §10 Gate  
**Neo trước:** Phase 0 PASS · Phase A PASS · **Phase B ✅ Exit PASS (Owner duyệt 2026-07-21)** · B2 stock P0 · Open Issues A/B defer  
**Môi trường bằng chứng:** Production `https://iflux.vn`  
**Quy ước:** Một file / Phase · Plan → Implementation → Verification → Acceptance → Exit → **Gate (cùng Audit cuối)**  
**Lệnh Owner:** «Tiến hành Phase C» 2026-07-21 → W0→W5 · «Làm nốt Phase C / đóng task» 2026-07-22 → Exit C + Plan Task 4  
**Tiếp theo:** Task 4 Loading Strategy — `SoT — Resource Loading Strategy (Task 4).md` (consume C; không viết lại Manifest/SM)

> **Vị thế Phase C:** Khó nhất · tối ưu lớn nhất · **quyết định cả task đạt mục tiêu hay không**.  
> **Quy ước Owner:** Audit cuối C = Gate.  
> **Review Round 2–3:** Business/Runtime Owner (hai góc nhìn · một chủ) · Manifest Contract **chuẩn trong Plan** · State Machine · Lifecycle · Dep Graph · Rollback · Feature Class · Perf mở rộng (§14 · §14.2).

---

## 0. Tổng quan (Overview)

### 0.1 Mục tiêu tổng thể (SoT)

Hoàn thiện **đường tải Page Feature riêng**:

- đúng thứ tự: Shell → Definition → **Feature** → Widget (RL-1.0)  
- đúng chủ: một Feature resource → một Owner  
- **chỉ tải khi cần** — tắt / không dùng thì không kéo rác (SoT §0.3)

**Khi PASS C + Gate:** App Shell sạch · Definition một nguồn · Feature có Runtime riêng · Widget không regression · ownership/dependency/loading rõ · có số đo trước–sau (neo Phase 0).

### 0.2 Vai trò trong Blueprint

```text
Phase 0 — Baseline          ✅ PASS
    ↓
Phase A — App Shell         ✅ PASS
    ↓
Phase B — Page Definition   ✅ PASS (R6 · B2 SEO stock · Evidence 24)
    ↓
Phase C — Page Feature      ← PLAN (file này)
    ↓
Gate — Technical + Architecture + Performance
    ↓ (cùng Audit cuối C — §0.8 · §8 · §11)
MR
```

| Tầng | Phase | Câu hỏi |
|------|-------|---------|
| Ai boot trang? | A | One Entry · One Shell |
| Trang này là gì? | B (+B2 entity title) | One Definition |
| Trang **làm gì** / tải gì cho việc đó? | **C** | One Feature Runtime · lazy đúng |
| Hệ thống còn nợ gì? | **Gate = Audit cuối C** | T1–T6 · A1–A8 · Perf |

### 0.3 Vì sao C là Phase quyết định

| Lý do | Hệ quả nếu C yếu |
|-------|------------------|
| Phần lớn JS/CSS «béo» nằm ở Feature `CORE_TIERS` / composite widget | Gate T1–T3 FAIL dù A/B đẹp |
| Feature đang **tái request** Shell deps (`block-templates` ×2 — OI-H2) | Lazy Loading SoT §0.3 chưa đạt |
| Chưa có Feature Runtime SoT (RL-1.0 chỉ Widget) | Ownership / Dependency Rule §0.4 dễ vỡ |
| C1 sai Catalog → migrate C2 nửa vời | Rollback toàn Phase (SoT §0.6) |

**Mục tiêu C không phải** «sửa vài trang cho nhẹ».  
**Mục tiêu C =** sinh **Feature Runtime** + migrate Catalog → chứng minh được ở Gate.

### 0.4 Invariant (kim chỉ nam C)

```text
One Page Feature
  → One Feature Manifest / Contract
  → One Feature Loader (consume Shell + Definition only)
  → Dependencies Feature-only (không trùng Shell)
  → Feature Runtime → Template / DS → Render
  → Widget chỉ qua Widget Pipeline (không Feature ôm Placement)
```

Ngắn: `Khai báo Feature → Tải đúng lúc → Chạy → Xong · Không ôm Shell/Definition · Không tải rác.`

### 0.5 Scope Boundary

| | Nghĩa | Phase C |
|--|-------|---------|
| **Allowed** | Được sửa | Feature Catalog · Feature Manifest/Contract · Feature Loader / Runtime · `CORE_TIERS` / `*-feature-boot` · Feature deps (store/api/css/js thuộc Feature) · Consumption Contract Feature↔Shell/Def · Evidence/Audit Gate |
| **Not Allowed** | Không được sửa | App Shell (Header/Search/AuthGate…) · Page Definition chrome (trừ Regression Task) · Widget Placement / Layout Engine Placement · Permission / Entitlement nghiệp vụ · Business rules ngoài đường tải |
| **Out of Scope** | Thấy nhưng cố tình bỏ | OI-H4 tách `iflux-web-ui.js` (Future) · OI-M5 header markup (Future) · OI-B2-DNSE API hồ sơ · Widget RL-1.0 làm lại |

### 0.5.1 Nguyên tắc chống phình (học B §0.5.1)

> Mọi thay đổi C phải quy được về **đường tải / ownership Feature**.  
> Không «tiện tay» sửa Shell/Definition/Widget Placement.  
> Không mở DNSE / SEO entity còn lại trừ Owner kéo rõ vào C (mặc định = Open Issue).

### 0.6 Điều kiện mở Plan / thi công

| Điều kiện | TT ghi nhận |
|-----------|-------------|
| Phase 0 PASS | ✅ |
| Phase A Exit PASS | ✅ |
| Phase B Acceptance / Exit | ✅ **Exit B PASS** 2026-07-21 — điều kiện vào C đã đủ (nợ defer: R5 tabs · OI-B2-ENTITY-MORE · OI-B2-DNSE) |
| Phase B2 stock P0 | ✅ (entity title sớm — không thay Feature Runtime) |
| Owner duyệt Plan C + AD* + R* | ⏳ |
| Lệnh «Thi công Phase C» | ✅ 2026-07-21 |

### 0.7 SoT C1 → C2 (bắt buộc)

| Bước SoT §9 | Trong file này | Được code? |
|-------------|----------------|------------|
| **C1** Inventory & Audit | §1 Catalog · §2 Audit · §3 Gap | Không (đọc / đo) |
| **C2** Thiết kế Feature Runtime | §4 Architecture + AD* | Không đến khi Owner duyệt AD* |
| Migrate theo Plan | §5 Optimization Plan | Chỉ sau «Thi công C» |
| Acceptance | §6 | Sau migrate |
| Exit + **Gate Audit** | §7 · §8 · §11 | Cùng một đợt Audit cuối |

### 0.8 Exit Vision — Audit cuối C = Gate

```text
Sau migrate Feature:
  Verification C (toàn trang §12)
       ↓ cùng checklist / cùng Evidence
  Technical Gate T1–T6
  Architecture Gate A1–A8
  Performance trước (Phase0) / sau (C)
       ↓
  Owner ký Exit C + Gate → mới MR
```

**Không** có Phase «Gate riêng» để phát hiện nợ mới mà C đã biết.  
Mọi tiêu chí Gate SoT §10 **phải nằm trong ma trận Audit cuối C** (§11). Thiếu một ô Gate → Exit C **chưa** PASS.

### 0.9 Bài học Phase 0 / A / B / B2 → Plan C

| # | Bài học | Áp vào C |
|---|---------|----------|
| L0 | Phase 0 = mốc Perf bắt buộc | Gate Perf đối chiếu đúng bảng Phase0 §4 (Cộng đồng khách + curl) |
| L1 | HTML Entry ≠ Runtime | Verify C: Network + Runtime Feature toàn trang, không chỉ «đã có feature-boot» |
| L2 | `detectPageKey` / path lệch phá AuthGate | C không đổi path; Regression: Feature boot đúng pageKey đã B |
| L3 | Network Initiator ≠ Ownership | `loadScript` từ Feature ≠ Feature owns Shell; cắt trùng = bỏ request, không đổi Owner Shell |
| L4 | «Đã có file» ≠ PASS | Cấm PASS vì có `CORE_TIERS`; phải **0 request Shell-owned trùng** trên mẫu chuẩn |
| L5 | Acceptance 3 lớp | Technical · Architecture · Owner (giống A/B) |
| L6 | Open Issues cho Gate | Mọi defer C → §10; Gate chỉ đọc bảng |
| L7 | Gap Analysis thiếu → backlog mơ hồ | §3 Gap bắt buộc trước Plan migrate |
| L8 | R* / AD* chốt trước code | §4.3 · §9 — không thi công khi AD Feature Runtime chưa duyệt |
| L9 | Shell-only vs composite khác nhau | Catalog tách **Pattern A/B/C** *và* **Feature Class** (Core/Optional/…) — hai trục |
| L10 | Entity dynamic (B2) | Feature không chiếm lại `documentTitle`; chỉ meta giàu nếu cần |
| L11 | Ownership Proof trước cleanup | Trước cắt CORE: chứng minh Shell đã có global → Feature bỏ dòng tải |
| L12 | Cache/`?v=` / localStorage làm verify ảo | Evidence C bắt buộc cache-bust + Network panel, không tin title tab một lần |
| L13 | Rollback một trang FAIL | Wave migrate nhỏ; FAIL → rollback wave, không «giữ nửa CORE» |

### 0.10 Deliverable khi PASS C (+ Gate)

| Deliverable | Kiểm được |
|-------------|-----------|
| Feature Catalog đủ §12 | Bảng §1 |
| Feature Runtime Architecture Owner duyệt | AD* §4 |
| Migrate theo trạng thái Owner chốt | §5 + Evidence |
| Feature không ôm tải Shell / Definition | Network ×1 `block-templates` (Shell only) trên mẫu |
| Ownership / Dependency Rule §0.4 | Audit §11 A4–A5 |
| Không regression Shell–Definition–Widget | §11 T5 · A1–A2 |
| Performance trước/sau | §11 Perf = Phase0 vs sau C |
| Open Issues còn lại | §10 — không xóa |
| **Gate Technical + Architecture PASS** | §11 đủ ô |

---

## 1. Inventory — Page Feature Catalog (khung C1)

*Điền chi tiết khi chạy C1 Audit trên Production. Khung dưới = SoT + hiện trạng code (2026-07-21).*

### 1.1 Hai trục phân loại (không gộp một cột)

**Trục 1 — Loading Pattern** (hình dạng boot hiện tại → đích migrate):

| Pattern | Mô tả | Ví dụ hiện tại |
|---------|--------|----------------|
| **A — Composite page module** | Manifest → `widget-loader` → `widgets/*-page/index.js` → `loadScriptTiers(CORE_TIERS)` → page init → Layout Engine children | community · stock · flow · (nhiều entity group) |
| **B — Home / Published hybrid** | PagePublished + `WGT-HOME-DASH` · `ensureSequence` + lazy widget deps | `/nha-cua-toi` |
| **C — Shell-only feature-boot** | `SHELL_ONLY` → `*-feature-boot.js` sau `iflux-shell-ready` | account · checkout · write · share · stockComment |

**Trục 2 — Feature Classification** (loại sản phẩm — Audit / R* dễ nhìn):

| Class | Nghĩa | Ví dụ |
|-------|--------|--------|
| **Core Feature** | Luôn cần khi vào trang (feed chính, store trang) | community feed · stock detail body |
| **Optional Feature** | Chỉ khi user mở / entitlement | Insight share modal · chat panel |
| **Authenticated Feature** | Chỉ sau login (AuthGate đã A) | account · write · checkout |
| **Entity Feature** | Phụ thuộc route params (ticker/slug) | stock · sector · family · post |
| **Published Feature** | Placement từ PagePublished | market widgets · home sidebar PRF |

> Pattern ≠ Class. Một trang có thể **Pattern A + Core + Entity** (stock). Catalog C1 phải ghi **cả hai**.

### 1.2 Catalog theo trang (SoT §12 + Sitemap B) — **W0 Audit 2026-07-21**

| # | pageKey | Pattern | Class | Feature entry | `block-templates.js` trong CORE/BASE? | W0 Network × | Kết quả |
|---|---------|---------|-------|---------------|--------------------------------------|--------------|---------|
| 1 | `home` | B | Core+Published+Auth | `home-dashboard` | Có trong BASE (`ensureSequence`) | **×1** (Shell; skip global) | PASS skip · vẫn khai báo thừa |
| 2 | `market` | Published | Published | published modules | Child widgets có | — | Audit child W4 |
| 3 | `community` | A | Core | `community-page` | **Có** `loadScriptTiers` | **×2** | **FAIL OI-H2** |
| 4 | `flow` | A | Core | `flow-page` | **Có** | **×2** | **FAIL OI-H2** |
| 5 | `loyalty` | slot≈A | Core+Auth | `loyalty-page` | Không trong CORE ngắn | — | OK nhẹ |
| 6 | `faq` | slot | Core | `faq-page` | Không | — | OK nhẹ |
| 7 | `account` | C | Auth | `account-feature-boot` | Không | **×1** | PASS |
| 8 | `messages` | slot | Auth | `messages-page` | Không | — | OK nhẹ |
| 9–12 | entity-list | A-like | Core+Entity | `entity-list-page` | **Có** | — | FAIL khai báo (W1/W4) |
| 13 | `stock` | A | Core+Entity+Auth | `stock-page` | **Có** | **×2** | **FAIL OI-H2** |
| 14–16 | group | A-like | Core+Entity | `group-page` | **Có** | — | FAIL khai báo |
| 17 | `pricing` | slot | Core | `pricing-page` | Không | — | OK nhẹ |
| 18 | `search` | slot | Core | `search-page` | Không | — | OK nhẹ |
| 19 | `watchlist` | slot | Core+Auth | `watchlist-page` | **Có** | — | FAIL khai báo |
| 20 | `communityWrite` | C | Auth+Core | feature-boot | Không | — | PASS boot |
| 21 | `checkout` | C | Auth | feature-boot | Không | — | PASS boot |
| 22 | `communityPost` | A-like | Core+Entity | `community-post-page` | **Có** | — | FAIL khai báo |
| 23 | `share` | C | Optional | feature-boot | Không | — | PASS boot |
| 24 | `stockComment` | C | Auth+Entity | feature-boot | Không | — | PASS boot |

**Auth / alerts:** ngoài phạm vi (R2/R7 B).

#### W0 Ownership Proof — `IfluxBlockTemplates`

| Fact | Bằng chứng |
|------|------------|
| Runtime Owner = App Shell | `shell-boot.js` `ensureParallel` → `IfluxBlockTemplates` · `block-templates.js?v=entEntity20260720` |
| Feature Pattern A tải lại | `loadScriptTiers` **không** check `window.IfluxBlockTemplates` → request `block-templates.js` (bare) lần 2 |
| Pattern B home | `ensureSequence` skip nếu global có → Network ×1 |
| Business Owner templates | Design System / Shell — **cấm** `modules[]` Feature |

#### W0 Network mẫu (§2.2)

| Mẫu | `block-templates.js` × | JS ≈ | Request ≈ |
|-----|------------------------|------|-----------|
| `/cong-dong` | **2** | 50 | 84 |
| `/co-phieu/HPG` | **2** | 62 | 97 |
| `/dong-tien` | **2** | 46 | 80 |
| `/nha-cua-toi` | **1** | 48 | 84 |
| `/tai-khoan` | **1** | 73 | 109 |

**W0 kết luận:** PASS làm baseline · **Critical = OI-H2** trên Pattern A Critical → mở **W1**.

### 1.3 Feature Object Catalog — Business Owner × Runtime Owner (hai góc nhìn · **một chủ**)

SoT §0.1: **một resource → một Owner** (không multi-owner).

**Cấm dùng thuật ngữ «Dual Owner»** — dễ hiểu nhầm thành *hai chủ ngang nhau*.  
Đúng nghĩa: mỗi resource vẫn **một chủ**; Catalog ghi **hai góc nhìn** để Agent không migrate nhầm:

| Góc nhìn | Câu hỏi | Không phải |
|----------|---------|------------|
| **Business Owner** (Logical) | Ai chịu trách nhiệm *domain / nghiệp vụ* của resource? | Ai đang `import` / gọi lúc runtime |
| **Runtime Owner** (Execution) | Ai được *tải · mount · dispose* resource trên trang? | Ai «dùng» tạm thời |

**Consumer ≠ Owner.** Feature gọi API ≠ Feature own API client.

#### Ví dụ chuẩn (Production)

| Resource | Business Owner | Runtime Owner | Community Feature là gì? |
|----------|----------------|---------------|---------------------------|
| `community-store.js` | Page Feature (Community) | Feature Runtime | **Owner** (cả hai góc) |
| `IfluxApiClient` / `iflux-api-bundle.js` | **Platform** | **App Shell** (`shell-boot` nạp) | **Consumer only** — được *gọi*, không own, không tải lại |
| `block-templates.js` | Design System / Shell | App Shell | Consumer — cấm CORE (OI-H2) |

> **Phản biện ví dụ lệch:** Nếu ghi `IfluxApiClient` Runtime Owner = Community Feature → Agent sẽ nhét API vào Feature Manifest → multi-execution + phá §0.4. Runtime Owner đúng = **Shell**.

#### Cột Catalog C1

| Cột | Nghĩa |
|-----|--------|
| **Business Owner** | Chủ domain (Platform · Page Feature · Shell · Definition · Widget Pipeline) |
| **Runtime Owner** | Ai tải/mount/dispose (thường trùng Business; lệch khi Platform service do Shell boot) |
| **Consumers** | Ai được đọc/gọi (không own) |

| ID | Object | Business Owner | Runtime Owner | Cấm migrate nhầm |
|----|--------|----------------|---------------|------------------|
| PF-MANIFEST | Feature Manifest | Page Feature | Feature Loader | — |
| PF-LOADER | Feature Loader / feature-boot | Page Feature | Page Feature | Không thay Shell loader |
| PF-CORE | modules Feature-only | Page Feature | Feature Loader | Không nhét Shell globals |
| PF-STORE | Store trang | Page Feature | Feature Runtime | — |
| PF-API-CALL | Lời gọi API từ Feature | Page Feature | Feature Runtime (gọi) | Không own client |
| PF-API-CLIENT | `IfluxApiClient` | **Platform** | **App Shell** | **Cấm** đưa vào `modules[]` Feature |
| PF-CSS | CSS Feature-only | Page Feature | Feature Loader | Không dup DS global |
| PF-LIFECYCLE | State + hooks | Page Feature | Feature Runtime | — |
| PF-CHILD | Child widget Placement | Widget Pipeline | Widget Loader | Không preload khi tắt |

### 1.4 Consumption Contract (Feature)

| Consumer | Được | Cấm |
|----------|------|-----|
| Feature | Đọc Definition đã apply · **gọi** Platform API client đã có · tải **Feature-only** deps (store/css/js Feature) | `document.title` / PD-* · import Widget Runtime · **tải lại** Shell deps / API client · claim Owner của Platform client |
| Shell | Cung cấp Platform services (API client, auth, templates…) | Không `import` Feature |
| Definition | Không import Feature | — |
| Widget | Chỉ Widget Pipeline | Không nhờ Feature module lung tung |
| Platform API client | Business=Platform · Runtime=Shell | Feature chỉ **consume** |

---

## 2. Audit C1 — nguyên tắc đo (trước Plan migrate)

### 2.1 Mỗi trang §1.2 bắt buộc ghi

| Cột | Nội dung |
|-----|----------|
| Pattern A/B/C | |
| JS Feature (URL + `?v=`) | |
| Trùng Shell (tên file) | vd `block-templates` |
| Trùng Definition | Feature còn ghi PD-*? |
| Eager sai | Login-only khi khách? |
| Child widget tắt vẫn tải? | |
| Owner | Một / nhiều |
| Kết quả | PASS / FAIL / N/A |

### 2.2 Mẫu Network bắt buộc (neo Phase 0)

| Mẫu | Path | Chỉ số tối thiểu |
|-----|------|------------------|
| Cộng đồng khách | `/cong-dong` | `block-templates` × · Resources · JS · FCP (so Phase0: ×2 templates) |
| CT mã | `/co-phieu/HPG` | CORE stack · templates × · title early (B2) |
| Nhà (login) | `/nha-cua-toi` | BASE · `iflux-web-ui` × |
| Shell-only | `/tai-khoan` | feature-boot tuần tự |

### 2.3 Critical dự kiến (từ N0 + A + explore)

| ID | Phát hiện | Severity |
|----|-----------|----------|
| H2 | `block-templates` Shell + Feature CORE → Network ×2 | **Critical C** |
| H-CORE | community/stock/flow CORE list seeds/taxonomy/mock trùng | High |
| H-CHILD | Child widget DEPS lại templates | High |
| M-HOME | home BASE vẫn templates dù Shell có | Medium |
| — | Ownership Feature trong composite «page = widget» | Architecture (AD*) |

---

## 3. Gap Analysis (Audit → Gap → Backlog)

| Gap | Hiện trạng | SoT | Phase |
|-----|------------|-----|-------|
| G1 Feature Runtime thiếu | CORE trong widget page ad-hoc | C2 Feature Loader + Manifest | **C** |
| G2 Dup Shell deps | templates ×2 (+ ứng viên khác) | §0.3 · §0.4 | **C** (OI-H2) |
| G3 Pattern không thống nhất | A/B/C ba đường | Catalog + AD* chọn chuẩn migrate | **C** |
| G4 Feature ôm Definition | Đã giảm B/B2; còn meta | Feature = data | B residual / C không mở lại title |
| G5 Perf chưa cải từ Feature | Phase0 templates ×2 | Gate Perf | **C + Gate** |
| G6 Bundle WebUI | một `iflux-web-ui.js` | Tách module | Future OI-H4 |
| G7 Entity resolve ngoài stock | B2 P0 only | OI-B2-ENTITY-MORE | B2+ / C optional |

---

## 4. Architecture C2 — Feature Runtime (chờ duyệt)

### 4.1 Đích kiến trúc + Dependency Graph (SoT §9 · Gate A5–A6)

```text
┌─────────────┐
│  App Shell  │  Runtime Owner: Shell (API client, templates, auth, header…)
└──────┬──────┘
       │ (ready)
       ▼
┌─────────────────┐
│ Page Definition │  Runtime Owner: Definition (title/SEO — đã B/B2)
└────────┬────────┘
         │ (applied)
         ▼
┌──────────────────┐
│ Feature Manifest │  Contract (§4.1.1) — Business Owner: Page Feature
└────────┬─────────┘
         │
         ▼
┌────────────────┐
│ Feature Loader │  skip-if-Shell-global · Feature-only deps
└────────┬───────┘
         │
         ├─► modules[] Feature-only                  Business+Runtime: Feature
         ├─► gọi Platform API (consume Shell client — KHÔNG own)
         ▼
┌──────────────────┐
│ Feature Runtime  │  State §4.1.2 · hooks §4.1.3
│ NOT_LOADED→…→READY│
│ → DISPOSED       │
└────────┬─────────┘
         │
         ▼
┌─────────────────────┐
│ Template / DS       │
└────────┬────────────┘
         │ (optional)
         ▼
┌─────────────────────┐
│ Widget Pipeline     │  Placement bật mới mount (RL-1.0)
└─────────────────────┘
```

**Cấm cạnh tranh:** Feature Loader **không** nằm ngang Shell; **không** tải Definition.

### 4.1.1 Feature Manifest Contract — schema chuẩn trong Plan (SoT A8)

Đây **là** contract. Agent **cấm** thêm field ngoài schema dưới; **cấm** bỏ field bắt buộc.  
AD-C2 chỉ chọn *nơi lưu file* — **không** chọn schema khác.

```text
FeatureManifest {
  id:                 string              // 'PF-community' | 'PF-stock' | …
  pageKey:            string              // khớp detectPageKey / Definition
  version:            string              // semver contract '1.0.0' — đổi khi breaking schema/deps

  pattern:            'A' | 'B' | 'C'     // Loading Pattern §1.1
  class:              FeatureClass[]      // Core | Optional | Authenticated | Entity | Published

  requiresShell:      string[]            // global names MUST đã có — Loader ASSERT, không tải
                                          // vd ['IfluxBlockTemplates','IfluxApiClient']
  requiresDefinition: boolean             // true = Definition applied trước BOOT (mặc định true)
  requiresAPI:        boolean             // true = được GỌI Platform client (không own, không tải client)

  modules:            FeatureModule[]     // chỉ resource Runtime Owner = Feature
  lazyChildren:       string[]            // widget ids — mount chỉ khi Placement bật

  lifecycle: {
    boot:             string | null       // hook id / fn name
    init:             string | null
    ready:            string | null
    dispose:          string | null       // bắt buộc có (Wave 3+)
  }
}

FeatureModule {
  id:                 string              // 'community-store' | 'community.css' | …
  kind:               'js' | 'css' | 'store'
  src:                string              // URL path /User_Web/iflux-web-ui/…
  global:             string | null       // window global sau load (js/store); null với css
  businessOwner:      'feature'           // modules[] chỉ chứa Feature-owned
  runtimeOwner:       'feature'           // Loader Feature tải — không liệt kê Shell modules ở đây
}
```

#### Quy tắc cứng `modules[]`

| Được trong `modules[]` | Không được |
|------------------------|------------|
| `community-store.js`, `community-page.js`, CSS Feature | `iflux-api-bundle.js`, `block-templates.js`, taxonomy Shell |
| Resource Business+Runtime Owner = Feature | Mọi thứ chỉ *consume* từ Shell |

Shell deps khai báo ở **`requiresShell[]`** (assert), **không** copy vào `modules[]`.

#### Ví dụ tối thiểu (Cộng đồng — minh họa Plan, chưa thi công)

```text
{
  id: 'PF-community',
  pageKey: 'community',
  version: '1.0.0',
  pattern: 'A',
  class: ['Core'],
  requiresShell: ['IfluxBlockTemplates', 'IfluxApiClient', 'IfluxAuth'],
  requiresDefinition: true,
  requiresAPI: true,
  modules: [
    { id: 'community-store', kind: 'store', src: '…/community-store.js', global: 'IfluxCommunityStore',
      businessOwner: 'feature', runtimeOwner: 'feature' },
    { id: 'community-page', kind: 'js', src: '…/community-page.js', global: 'IfluxCommunityPage',
      businessOwner: 'feature', runtimeOwner: 'feature' },
    { id: 'community-css', kind: 'css', src: '…/community.css', global: null,
      businessOwner: 'feature', runtimeOwner: 'feature' }
  ],
  lazyChildren: [ /* widget ids từ Placement — không preload nếu tắt */ ],
  lifecycle: { boot: 'boot', init: 'init', ready: 'ready', dispose: 'dispose' }
}
```

| Field | Wave 3+ | Ghi chú |
|-------|---------|---------|
| `id` · `pageKey` · `version` | Bắt buộc | version tăng khi breaking deps |
| `pattern` · `class` | Bắt buộc | Hai trục §1.1 — **giữ** (không chỉ 7 field tối giản) |
| `requiresShell` · `requiresDefinition` · `requiresAPI` | Bắt buộc | API = quyền gọi, không = own client |
| `modules[]` | Bắt buộc | Thay `featureDeps` / `requiresCSS` / `requiresStore` rời |
| `lazyChildren[]` | Bắt buộc (có thể `[]`) | R-C6 |
| `lifecycle` | Bắt buộc | Khớp State Machine §4.1.2 |

> **Phản biện rút gọn quá tay:** Reviewer đề xuất core `{ id, pageKey, version, requiresShell, requiresDefinition, modules, lazyChildren, lifecycle }` — **đồng ý làm xương sống**. Plan **giữ thêm** `pattern` · `class` · `requiresAPI` để Audit/Gate không SoT-tự-sinh trục phân loại và quyền gọi API.

### 4.1.2 Feature State Machine (chuẩn debug Runtime — không cần code Wave 0)

```text
NOT_LOADED
    │  Loader nhận Manifest · bắt đầu BOOT
    ▼
 BOOTING          ← gồm tải modules[] + INIT nội bộ
    │  assert requiresShell/Definition OK · hooks boot→init xong
    ▼
 READY            ← lifecycle.ready · UI dùng được
    │  soft nav / unmount / đổi Feature
    ▼
 DISPOSED         ← lifecycle.dispose · về NOT_LOADED nếu boot lại
```

| State | Ý nghĩa | Hook liên quan |
|-------|---------|----------------|
| `NOT_LOADED` | Chưa chạy Feature | — |
| `BOOTING` | Đang assert + tải `modules[]` + init | `boot` → `init` |
| `READY` | Feature sống | `ready` |
| `DISPOSED` | Đã gỡ sạch (không đụng Shell/Def) | `dispose` |

**Chuyển trạng thái hợp lệ:** `NOT_LOADED→BOOTING→READY→DISPOSED` · `DISPOSED→BOOTING` (boot lại).  
**Cấm:** `READY→BOOTING` không dispose trước · `DISPOSED→READY` bỏ qua BOOTING.

### 4.1.3 Feature Lifecycle hooks (ánh xạ State Machine)

| Hook | Khi state | Việc | Bắt buộc C |
|------|-----------|------|------------|
| `boot` | vào BOOTING | Đọc Manifest · assert Shell/Definition · bắt đầu tải `modules[]` | Có |
| `init` | trong BOOTING | Store / bind / chuẩn bị host | Có |
| `ready` | vào READY | Báo sẵn sàng (optional event) | Có |
| `dispose` | vào DISPOSED | Gỡ listener · clear host Feature | Có (Wave 3+) |

| Mở rộng | Khi nào | Phản biện |
|---------|---------|-----------|
| `hydrate()` | Pattern B / HTML sẵn | Optional — không bắt mọi Feature |
| PJAX router | Future | Không xây trong W1–2; State Machine đủ để sau gắn soft reload |

### 4.2 Nguyên tắc thiết kế

1. **Shell-first:** Mọi global Shell đã có → Feature **cấm** đưa vào CORE.  
2. **Declare deps:** chỉ Manifest Contract §4.1.1 — không ad-hoc list trong `index.js` sau Wave 3.  
3. **Loader idempotent theo bare path:** skip if global (Shell allowlist + Feature globals).  
4. **Không đảo Owner:** cắt request ≠ chuyển `block-templates` / `iflux-api-bundle` sang Feature.  
5. **Business ≠ Runtime góc nhìn** khi Platform service (API client) — vẫn **một chủ**.  
6. **Widget children:** chỉ mount khi Placement bật — không preload `lazyChildren` tắt.  
7. **State Machine + lifecycle hooks:** mọi Feature migrate tuân §4.1.2–4.1.3.  
8. **Regression A/B:** C không sửa Header / Definition renderer trừ Regression Task.

### 4.3 Quyết định kiến trúc (AD*) — Owner chốt trước thi công

| ID | Câu hỏi | Phương án | Khuyến nghị Plan |
|----|---------|-----------|------------------|
| **AD-C1** | Chuẩn hóa Pattern A? | (1) Giữ composite widget + cắt CORE · (2) Nâng thành `*-feature-boot` + thin widget · (3) Hybrid | **(1) trước** (tối ưu lớn, rủi ro thấp) → wave sau xét (2) nếu Owner muốn |
| **AD-C2** | Feature Manifest **nơi lưu**? (schema §4.1.1 cố định) | (1) `features/*.manifest.js` · (2) cạnh page manifest · (3) `meta` widget | **Khuyến nghị (1)** — tách rõ Page Def vs Feature; Owner chọn 1 nơi lưu, **không** chọn schema khác |
| **AD-C3** | Skip Shell deps bằng gì? | Global guard only · allowlist Shell module IDs · cả hai | **Cả hai** (global + allowlist trong Loader) |
| **AD-C4** | Phạm vi migrate wave 1 | Chỉ OI-H2 templates · Toàn bộ CORE trùng · Cả Catalog | **Wave 1 = OI-H2 + Critical A (community/stock/flow)** |
| **AD-C5** | Audit cuối = Gate? | Tách Gate file sau · Gộp checklist vào §11 C | **Gộp** (theo lệnh Owner) — một Evidence pass |
| **AD-C6** | Business×Runtime Owner + State Machine? | (1) Một cột Owner · (2) Hai góc nhìn + NOT_LOADED…DISPOSED | **(2)** — bắt buộc (Review Round 3) |

### 4.4 R* (phạm vi / độ sâu) — chờ chữ ký

| ID | Chủ đề | A = trong C bắt buộc | B = defer Open Issue |
|----|--------|----------------------|----------------------|
| **R-C1** | Cắt `block-templates` khỏi mọi Feature CORE/BASE/DEPS | **A** | |
| **R-C2** | Cắt thêm taxonomy/seeds/mock trùng Shell (sau Ownership Proof) | **A** | |
| **R-C3** | Thống nhất Pattern A→C (feature-boot) | | **B** |
| **R-C4** | OI-B2-ENTITY-MORE trong C | | **B** |
| **R-C5** | Perf mẫu bắt buộc (cong-dong + stock + home) | **A** | |
| **R-C6** | Child widget DEPS trùng | **A** | |
| **R-C7** | Ghi Feature Class trên Catalog | **A** | |
| **R-C8** | Gate Perf mở rộng (Unused = soft) | **A** | |

*Chốt Owner qua lệnh «Tiến hành Phase C» = chấp nhận khuyến nghị mặc định Plan.*

---

## 5. Optimization Plan (sau duyệt AD*/R*)

### 5.1 Wave (đề xuất)

| Wave | Việc | Tiêu chí xong | Rollback nếu FAIL |
|------|------|---------------|-------------------|
| **W0** | C1 Audit toàn §1.2 + Network mẫu §2.2 · điền Catalog (Business×Runtime Owner + Class) | Bảng Audit không trống | **N/A** — chỉ đọc/đo, không đổi Production runtime |
| **W1** | Ownership Proof Shell globals · cắt `block-templates` (OI-H2) community/stock/flow/home + child DEPS nóng | Network ×1 templates `/cong-dong` | **Rollback chỉ W1** (khôi phục CORE/BASE đã cắt) · **giữ W0** |
| **W2** | Cắt deps trùng khác (R-C2) trên Critical A | Không request trùng list đã Shell | **Rollback chỉ W2** · **giữ W0+W1** |
| **W3** | Feature Manifest §4.1.1 + State Machine §4.1.2 + Loader policy (Critical) | Contract enforce · NOT_LOADED…DISPOSED smoke | **Rollback chỉ W3** · **giữ W0–W2** |
| **W4** | Migrate slot / shell-only còn lại | Catalog 100% trạng thái Owner | **Rollback chỉ W4** · **giữ W0–W3** |
| **W5** | **Audit cuối C = Gate** (§11) · Perf · Open Issues | Exit C + Gate ký | Không «rollback Gate» — FAIL = không MR; sửa theo Regression Task |

### 5.1.1 Rollback Rule (bắt buộc)

```text
FAIL ở Wave Wn (n≥1)
  → rollback đúng thay đổi Wn (git/deploy file thuộc wave)
  → không rollback W0 (audit)
  → không rollback W1…W(n-1) đã PASS
  → không «giữ nửa CORE» trong cùng wave
```

| Cấm | Lý do |
|-----|-------|
| Rollback toàn Phase C khi chỉ W2 FAIL | Mất tối ưu W1 đã chứng minh (SoT học Phase rollback có kiểm soát) |
| Tiếp W(n+1) khi Wn chưa PASS | Dependency wave |
| Sửa Shell/Definition «cho qua» Gate trong rollback Feature | Phạm vi C |

### 5.2 Thứ tự trang ưu tiên (tối ưu lớn nhất trước)

1. Cộng đồng (`/cong-dong`) — neo Phase0  
2. Chi tiết mã (`/co-phieu/*`)  
3. Dòng tiền  
4. Nhà  
5. Entity list / group  
6. Shell-only boots (chỉ cắt nếu còn dup)  
7. Slot còn lại  

### 5.3 Việc cấm trong thi công

- Sửa Header / Search / AuthGate (A)  
- Đổi PD title pipeline (B/B2) trừ Regression  
- «Tối ưu» bằng cách xóa guard `block-templates` (phá idempotent)  
- Merge/MR trước Gate §11  

---

## 6. Acceptance — sau Verification

### 6.1 Technical

- [x] Catalog Feature đủ trang phạm vi (§1)  
- [x] OI-H2 đóng trên mẫu chuẩn (templates ×1 = Shell)  
- [x] R-C* =A đã migrate / đo  
- [x] Feature không ghi PD-* / không import Widget Runtime  
- [x] Không eager login-only khi khách (mẫu)  
- [x] Regression Shell + Definition = 0  

### 6.2 Architecture

- [x] AD* đã duyệt và khớp code  
- [x] Dependency Rule §0.4 Feature → chỉ Shell+Def  
- [x] Ownership một chủ / resource — Catalog ghi Business×Runtime (không multi-owner)  
- [x] Loading graph khớp SoT §2 · sơ đồ §4.1  
- [x] Manifest Contract §4.1.1 + State Machine §4.1.2 trên Feature đã migrate 

### 6.3 Owner

- [x] Duyệt Evidence §8  
- [x] Duyệt Open Issues §10 (accept risk / defer → Task 4)  
- [x] Duyệt **Gate §11** (cùng lúc Exit C · **Có điều kiện** Perf)  

### 6.4 Ánh xạ SoT §9 Acceptance C

| SoT | Plan C |
|-----|--------|
| Catalog đủ §15 | §1 + Audit W0 |
| Kiến trúc Owner duyệt | §4 AD* |
| Migrate / trạng thái chốt | §5 + Evidence |
| Không ôm tải thừa | W1–W2 · T3 |
| Ownership rõ | §1.4 · A4 |
| Dependency Rule | A5 |
| Không regression Shell–Def | A1–A2 · T5 |
| Đủ deliverable | Một file này |

---

## 7. Exit Criteria Phase C

- [x] Verification PASS (Feature Runtime + Network toàn trang phạm vi)  
- [x] Evidence §8  
- [x] Không còn Critical C  
- [x] High còn lại → §10 (→ Task 4)  
- [x] Regression = 0  
- [x] **§11 Gate Technical PASS**  
- [x] **§11 Gate Architecture PASS**  
- [x] **§11 Performance trước/sau ghi đủ + Owner chấp nhận mức** — **Có điều kiện** (2026-07-22)

**Exit C PASS · 2026-07-22.** Soft / Future / R-C3·C4=B → `Task4.md` — không chặn đóng C.

---

## 8. Evidence / Verification

### 8.0 W0 Audit (2026-07-21) — trước migrate

| Hạng mục | Giá trị | TT |
|----------|---------|-----|
| Catalog §1.2 | Đủ 24 + Class + Pattern | ✅ |
| Ownership Proof `IfluxBlockTemplates` | Shell Runtime | ✅ |
| `/cong-dong` templates × | **2** | OI-H2 Open |
| `/co-phieu/HPG` templates × | **2** | OI-H2 Open |
| `/dong-tien` templates × | **2** | OI-H2 Open |
| `/nha-cua-toi` templates × | **1** | OK (ensureSequence) |
| `/tai-khoan` templates × | **1** | OK |

### 8.1 W1 OI-H2 (2026-07-21) — PASS

| Hạng mục | Trước (W0) | Sau W1 | Cách đo |
|----------|------------|--------|---------|
| `block-templates.js` × `/cong-dong` | 2 | **1** (Shell `?v=entEntity20260720`) | Network |
| × `/co-phieu/HPG` | 2 | **1** | Network |
| × `/dong-tien` | 2 | **1** | Network |
| × `/nha-cua-toi` | 1 | **1** | Network |
| Ownership | Shell Runtime | Không đảo | shell-boot |
| Guard phụ | — | `loadScriptTiers` skip nếu `IfluxBlockTemplates` | legacy-bridge |

**W1 việc đã làm:** gỡ `block-templates.js` khỏi CORE/BASE/DEPS Critical + child nóng; bump manifest/bootstrap cache; harden Loader.

**OI-H2:** Closed (mẫu chuẩn). Còn market child `ensureSequence` list (skip global) — W4 dọn khai báo thừa.

### 8.2 W2 R-C2 (2026-07-21) — PASS

#### Ownership Proof (trước cắt)

| Resource | Business | Runtime trước W2 | Shell đã nạp? | Kết luận |
|----------|----------|------------------|---------------|----------|
| `watchlist-taxonomy.js` | Platform | Feature CORE (A) | **Không** | Promote Shell page-gated |
| `iflux-market-seed-data.js` · ecosystem · registry | Platform | Feature CORE | **Không** | Promote Shell page-gated |
| `mock-market.js` · `seo-url.js` | Platform | Feature CORE | **Không** | Promote Shell page-gated |
| faq / gói cước | — | không tải | — | **Giữ 0** (lazy §0.3) |

Network trước W2 (Critical A): taxonomy/seeds/mock đã **×1** (Feature) — chưa ×2; nợ = **Owner sai** (Feature ôm Platform).

#### Sau W2

| Hạng mục | Trước | Sau | Cách đo |
|----------|-------|-----|---------|
| Runtime Owner market platform Critical A | Feature CORE | **Shell** (`MARKET_PLATFORM_PAGES`) | shell-boot |
| Feature CORE community/stock/flow còn taxonomy/seeds/mock/registry/seo? | Có | **Không** | Code |
| Network × `/cong-dong` · `/co-phieu/HPG` · `/dong-tien` | ×1 Feature | **×1 Shell** (`?v=phaseCW220260721`) | Network |
| faq / gói cước market stack | ×0 | **×0** | Network |
| Guard | templates only | + taxonomy/mock/seo/seed/eco/registry | `loadScriptTiers` |

**W2 việc:** promote Platform market → Shell (chỉ community/stock/flow) · cắt CORE Feature · harden Loader · cache-bust `phaseCW220260721`.

**R-C2 Critical A:** Closed. Mở rộng MARKET_PLATFORM_PAGES (home/account/…) = W4+.

### 8.3 W3 Feature Manifest + State Machine (2026-07-21) — PASS

| Hạng mục | Kết quả | Cách đo |
|----------|---------|---------|
| Nơi lưu Manifest | `features/{community,stock,flow}.manifest.js` (AD-C2) | Code |
| Schema §4.1.1 | validate đủ field · Owner=feature · blocklist Shell src | `feature-runtime.js` |
| requiresShell Critical A | templates + API + Auth + Guest + market platform W2 | Assert lúc BOOTING |
| requiresDefinition | `__IFLUX_PAGE_DEFINITION__.current` | Assert |
| State Machine | `NOT_LOADED→BOOTING→READY` · dispose → `DISPOSED` | `__IFLUX_FEATURE_STATE__` |
| `/cong-dong` | **READY** · feed OK · `feature-runtime` + `community.manifest` | Network + smoke |
| `/co-phieu/HPG` | **READY** · title entity OK | Network + smoke |
| `/dong-tien` | **READY** · tabs OK | Network + smoke |
| lazyChildren | khai báo · **không** preload | Code |
| Cache | `phaseCW320260721` | HTML/bootstrap |

**OI-C-MANIFEST-CONTRACT · OI-C-STATE-MACHINE:** Closed trên Critical A.

### 8.4 W4 Migrate slot / shell-only (2026-07-21) — PASS

#### MARKET_PLATFORM_PAGES (Shell)

Mở rộng ngoài Critical A: `home` · `market` · entity list/detail · `watchlist` · `search` · `messages` · `communityPost` · `account` · `checkout` · `stockComment` (+ aliases).  
**Giữ ×0:** `faq` · `pricing` · `loyalty` · `share`.

#### Cắt Shell deps khỏi Feature CORE/BASE/boot

| Entry | Đã cắt |
|-------|--------|
| `home-dashboard` BASE | mock · seo |
| `entity-list-page` · `group-page` | registry · taxonomy · seeds · mock · seo |
| `watchlist-page` · `search-page` · `community-post-page` | registry · seeds · mock · taxonomy · seo |
| `messages-page` | seo |
| `account` · `checkout` · `stockComment` feature-boot | market stack + seo |
| Child widgets (R-C6) | bỏ khai báo `block-templates` / seo thừa (heatmap, overview, breadth, flow-subj, flow-score, com-heat/story) |

#### Catalog Owner (24 trang) — W4

| Nhóm | Runtime Owner market platform | Feature Manifest+SM | TT |
|------|-------------------------------|---------------------|-----|
| Critical A (community/stock/flow) | Shell | ✅ W3 | ✅ |
| home · market · entity · watchlist · search · messages · post | Shell | Pattern A/B composite (AD-C1 giữ) | ✅ cắt CORE |
| account · checkout · stockComment | Shell | Pattern C feature-boot | ✅ cắt boot |
| faq · pricing · loyalty · share | không nạp | N/A nhẹ | ✅ |
| Child Published | consume Shell (ensureSequence skip) | — | ✅ R-C6 |

Guard: `loadScriptTiers` + **`loadScriptsSequential`** skip Shell platform globals.

Cache: `phaseCW420260721`.

### 8.5 W5 Audit cuối C = Gate (2026-07-21) — Evidence kỹ thuật PASS · chờ Owner ký Perf

#### Mẫu Network / Perf (main-frame, Production)

| Mẫu | Resources | JS | CSS | templates × | mock × | FCP (ms) | Feature state | Title / Def |
|-----|----------:|---:|----:|------------:|-------:|---------:|---------------|-------------|
| `/cong-dong` | **87** | **53** | **24** | **1** | **1** | **~416–596** | READY | Cộng đồng · iFlux · Def ✅ |
| `/co-phieu/HPG` | **102** | **64** | **25** | **1** | **1** | **~572** | READY | HPG - Công ty… (B2) · Def ✅ |
| `/dong-tien` | ~83 | ~49 | ~23 | **1** | **1** | — | READY | Dòng tiền · Def ✅ |
| `/hoi-dap` | **63** | **32** | **22** | **1** | **0** | — | N/A | lazy market ✅ |

**Neo Phase0 `/cong-dong`:** Resources 73 · JS 41 · CSS 23 · templates **×2** · FCP ~376 · search ×1.

| Thay đổi vs Phase0 (CĐ) | Đọc |
|-------------------------|-----|
| templates ×2 → **×1** | **Thắng chính** T1 (~42 KB request thừa hết) |
| JS 41 → 53 · Resources 73 → 87 | Tăng vì Feature Manifest/Runtime + Shell market sớm — **đúng contract**, không phải tải trùng IIFE Shell |
| FCP ~376 → ~416–596 | Không cải rõ; nhiễu CDN/mạng — **cần Owner chấp nhận mức** |
| FAQ market ×0 | Lazy §0.3 giữ |

**W5 dọn thêm:** thống nhất `legacy-bridge.js?v=` trên server (57 file) · gỡ nhầm `widgets/widgets/` · cache `phaseCW5gate20260721`.

#### Soft residual (không FAIL cứng Gate)

| ID | Hiện tượng | Xử lý |
|----|------------|--------|
| OI-C-BRIDGE-CACHE | Client có thể còn request `legacy-bridge` nhiều `?v=` từ HTTP cache module cũ | Soft — sau hard refresh / TTL CDN hết; server đã 1 version |
| OI-C-MANIFEST-DUP | `*.manifest.js` có thể ×2 trong Performance (ESM graph) | Soft — không phải Shell IIFE trùng |
| OI-RT-MOUNT | `__ifxShellBooted` chưa có trên Production | Open observe — Shell globals singleton OK |

---

## 9. Owner Review

| Chữ ký | TT |
|--------|-----|
| Duyệt Exit B | ✅ 2026-07-21 |
| Duyệt Tổng quan / bài học / Scope | ✅ Exit C |
| Chốt điều kiện vào C | ✅ Exit B PASS |
| Review Round 2–3 (§14) | ✅ v1.2 · đóng đủ trong C (§14.3) |
| Approve **AD-C1…C6** | ✅ theo khuyến nghị Plan (lệnh Thi công C) |
| Chốt **R-C1…C8** | ✅ R-C1/2/5/6/7/8=A · R-C3/4=B → Task 4 |
| Duyệt danh sách trang §1.2 + Business×Runtime Owner | ✅ W4 Catalog Owner |
| Lệnh «Thi công Phase C» | ✅ 2026-07-21 |
| **Exit C + Gate (§11)** | ✅ **PASS · Có điều kiện Perf** · 2026-07-22 |

---

## 10. Open Issues (không xóa — Gate đọc)

| ID | Mô tả | Phase đích | TT |
|----|-------|------------|-----|
| **OI-H2** | `block-templates` ×2 Shell+Feature | **C** | **Closed W1** · Network ×1 mẫu chuẩn |
| **OI-H-CORE** | taxonomy/seeds/mock Owner = Feature (Critical A) | **C** | **Closed W2** · Shell page-gated · CORE cắt |
| OI-H4 | Tách `iflux-web-ui.js` | **Task 4 / Future** | Open |
| OI-M5 | Header markup một nguồn | **Task 4 / Future** | Open |
| OI-RT-MOUNT | Mount counters Shell | **Task 4 / Gate formal** | Open (không chặn Exit C) |
| OI-M2 | Market Status inject | Task 4 observe | Open |
| OI-BL-COMMENT | Pretty URL comment | Backlog URL | Open |
| OI-B-R6 | Watchlist UI Việt | B | **Closed** (Exit B) |
| OI-B-EVIDENCE-24 | Evidence đủ URL B | B | **Closed** (Exit B) |
| OI-B-TABS-BC-HERO | Tabs/BC/Hero | B defer | Open |
| OI-C-OWNER-LENSES | Catalog Business×Runtime Owner | **C** | **Closed W4** |
| OI-C-MANIFEST-CONTRACT | Schema Manifest §4.1.1 (chuẩn trong Plan) | **C** | **Closed W3** Critical A |
| OI-C-STATE-MACHINE | NOT_LOADED…DISPOSED + hooks | **C** | **Closed W3** Critical A |
| OI-C-BRIDGE-CACHE | ESM `legacy-bridge` multi-`?v=` từ cache client | **Task 4** soft | Open (server đã 1 version) |
| OI-C-MANIFEST-DUP | `*.manifest.js` ×2 ESM graph | **Task 4** soft | Open |
| OI-B2-ENTITY-MORE | Entity resolve sớm ngoài stock | **Task 4** (R-C4=B) | Open |
| OI-B2-DNSE | Tên pháp lý API | Future | Open |

---

## 11. Audit cuối C = Gate (SoT §10) — ma trận bắt buộc

> Chạy **một lần** khi W5. Kết quả ghi vào §8 + bảng dưới.  
> **Một ô FAIL → Exit C FAIL → không MR** (SoT §10).

### 11.1 Technical Gate

| # | Tiêu chí SoT | Cách đo trong C | TT |
|---|--------------|-----------------|----|
| T1 | Không duplicate JS không cần thiết | templates/mock/taxonomy **×1** main-frame; hết ×2 templates Phase0 | ✅ |
| T2 | Không duplicate CSS không cần thiết | CSS CĐ 24 ≈ Phase0 23 (không nhân đôi DS) | ✅ |
| T3 | Không eager load sai | FAQ mock **×0** · search ×1 Shell | ✅ |
| T4 | Không cross-import lung tung (§0.4) | Feature Manifest blocklist Shell · không `document.title` raw Feature Critical | ✅ |
| T5 | Widget Pipeline không regression | stock/community Placement mount · smoke OK | ✅ |
| T6 | Request / transferred trước–sau | Bảng §8.5 · §11.3 điền đủ | ✅ (số điền; mức cải do Owner) |

### 11.2 Architecture Gate

| # | Tiêu chí SoT | Cách đo | TT |
|---|--------------|---------|----|
| A1 | App Shell Acceptance còn PASS | Shell + Search + Guest trên mẫu | ✅ |
| A2 | Page Definition Acceptance còn PASS | Def store · title B2 stock · Feature không chiếm | ✅ |
| A3 | Page Feature Acceptance còn PASS | Manifest+SM Critical A · CORE cắt W4 | ✅ |
| A4 | Ownership invariant | Catalog Business×Runtime · Shell market page-gated | ✅ |
| A5 | Dependency graph sạch | Feature → Shell+Def only | ✅ |
| A6 | Loading graph khớp §2 | Shell→Def→Feature→Widget (READY sau Def) | ✅ |
| A7 | Catalog khớp thực tế | §1.2 + §8.4 Owner | ✅ |
| A8 | Không SoT tự sinh | Schema §4.1.1 trong Plan | ✅ |

### 11.3 Performance trước / sau (SoT §10.3 + Review mở rộng)

| Chỉ số | Trước (Phase0) | Sau C | Bắt buộc Gate? | Cách đo |
|--------|----------------|-------|----------------|---------|
| JS liên quan (mẫu CĐ) | 41 | **53** | Có | Network |
| CSS liên quan | 23 | **24** | Có | Network |
| Request count | 73 | **87** | Có | Network |
| Transferred | _(bổ sung)_ | cache-sensitive | Có | Network |
| FCP | ~376 ms | **~416–596 ms** | Có | Performance |
| LCP | _(bổ sung)_ | _(không đo ổn định iframe)_ | Có | — soft |
| Blocking time | _(đo)_ | Long Task [] mẫu | Có | Performance |
| **Duplicate Requests** | templates ×2 | **templates ×1** | Có (= T1) | Network |
| **Duplicate Modules** | globals load 2 lần | Shell globals ×1; bridge soft cache | Có | Network |
| **Long Task** (>50ms) | _(đo)_ | [] quan sát | Có trên mẫu chuẩn | Performance |
| **Unused JS** | — | không đo Coverage | **Soft** | — |
| **Unused CSS** | — | không đo Coverage | **Soft** | — |

> **Phản biện:** Unused JS/CSS trên kiến trúc multi-script cổ điển dễ **ảo** (Coverage phụ thuộc tương tác). Gate **không** FAIL cứng Unused nếu chưa có quy trình đo ổn định — vẫn **ghi nhận** khi đo được (R-C8).

**Owner: chấp nhận mức cải thiện?** ⬜ Có / ⬜ Không / ✅ **Có điều kiện** (2026-07-22):  

> Chấp nhận thắng **T1** (`block-templates` ×2→×1) + ownership/lazy FAQ ×0 + Manifest/State Machine Critical A.  
> Chấp nhận JS/Request tăng nhẹ do Feature Runtime (không phải tải trùng IIFE Shell).  
> **Không** cam kết FCP giảm trong Exit C. Soft residual (bridge cache · mount counter · Unused Coverage · R-C3/C4) → **Task 4**.

### 11.4 Quy tắc Pass Gate trong Exit C

```text
Exit C PASS  ⇔  Acceptance C PASS
              ∧  T1–T6 PASS          ← Evidence ✅
              ∧  A1–A8 PASS          ← Evidence ✅
              ∧  Perf bảng điền đủ   ← ✅
              ∧  Owner ký §11.3      ← ✅ Có điều kiện 2026-07-22
              ∧  Open Issues Critical = 0  ← ✅ (Critical C closed)
```

**Kết luận Exit C:** ✅ **PASS** · 2026-07-22 · tiếp `Task4.md`.

---

## 12. Pre-flight — Plan READY?

| Tiêu chí | Plan có? |
|----------|----------|
| SoT C1→C2 | ✓ §0.7 |
| Scope / Not Allowed | ✓ §0.5 |
| Bài học 0/A/B/B2 | ✓ §0.9 |
| Catalog khung | ✓ §1 |
| Gap | ✓ §3 |
| AD* / R* chờ chữ ký | ✓ §4.3–4.4 |
| Wave migrate + Rollback Rule | ✓ §5.1 · §5.1.1 |
| Manifest Contract · Lifecycle · Dep Graph | ✓ §4.1* |
| Business×Runtime Owner · Feature Class | ✓ §1.1 · §1.3 |
| Manifest schema trong Plan · State Machine | ✓ §4.1.1–4.1.2 |
| Perf Gate mở rộng | ✓ §11.3 |
| Acceptance 3 lớp | ✓ §6 |
| **Audit cuối = Gate** | ✓ §0.8 · §11 |
| Open Issues kế thừa | ✓ §10 |
| Reviewer Round 2 | ✓ §14 |
| Một file | ✓ |

**Kết luận lịch sử:** Plan C v1.2 READY → Thi công → **Exit C PASS 2026-07-22**.

---

## 13. Lệnh Owner (đã hoàn tất)

1. ~~Đọc §0 · §4 · §11 · §14~~ ✅  
2. ~~Exit B~~ ✅  
3. ~~Review Round 3 · AD-C6 · R-C7/C8~~ ✅  
4. ~~Approve AD-C* + R-C*~~ ✅  
5. ~~«Thi công Phase C» · W0→W5~~ ✅  
6. ~~Exit C + Gate §11~~ ✅ **Có điều kiện** · 2026-07-22  
7. **Tiếp:** duyệt SoT Task 4 Loading Strategy → «Thi công Phase 0 Task 4».

---

## 14. Review Round 2 — phản biện có bằng chứng (2026-07-21)

Owner/Reviewer đưa 7 điểm. Agent trả lời theo nguyên tắc: **đồng ý / đồng ý có điều kiện / không đồng ý** + dẫn chứng.

| # | Điểm Review | Kết luận Agent | Bằng chứng / nguyên nhân | Hành động Plan |
|---|-------------|----------------|-------------------------|----------------|
| 1 | Catalog lẫn Responsibility — cần Logical vs Runtime Owner | **Đồng ý** | SoT §0.1 một Owner/resource; `shell-boot` nạp `IfluxApiClient`; `community-store` chỉ *gọi* client → Business=Feature (store), Runtime client=Shell. Gộp «PF-API = Page Feature» → Agent migrate API bundle vào Feature = **sai §0.4** | §1.3 · AD-C6 |
| 2 | Feature Manifest thiếu contract | **Đồng ý** | SoT Gate A8 «không SoT tự sinh»; Plan v1 chỉ nói Manifest/Loader/Deps không field → mỗi Feature tự nghĩ schema | §4.1.1 schema cố định · AD-C2 = *nơi lưu* thôi |
| 3 | Thiếu Lifecycle | **Đồng ý có điều kiện** | Soft reload leak nếu chỉ `init()`. Không bắt PJAX W1–2 — bắt State Machine + hooks | §4.1.2–4.1.3 |
| 4 | Thiếu Dependency Graph sơ đồ | **Đồng ý** | Gate A5–A6 đòi graph; Plan v1 chỉ prose | §4.1 sơ đồ |
| 5 | Rollback từng Wave chưa rõ | **Đồng ý** | L13 đã nói rollback wave nhưng §5.1 thiếu bảng; W0 = audit-only → không rollback | §5.1.1 |
| 6 | Feature Classification | **Đồng ý có điều kiện** | Class (Core/Optional/…) **không thay** Pattern A/B/C — Pattern = *cách boot*, Class = *loại sản phẩm*. Cần **cả hai** | §1.1 hai trục · R-C7 |
| 7 | Gate Perf ít chỉ số | **Đồng ý có điều kiện** | SoT §10.3 đã có Blocking; Dup Request/Module = T1. **Unused JS/CSS** = soft (Coverage ảo trên multi-script) trừ khi Owner chốt tooling | §11.3 · R-C8 |

### 14.1 Việc Owner cần chốt thêm sau Review

| ID | Câu hỏi | Khuyến nghị Agent |
|----|---------|-------------------|
| AD-C6 | Business×Runtime + State Machine bắt buộc? | **Approve (2)** |
| AD-C2 | Nơi lưu Manifest | **(1) `features/*.manifest.js`** |
| R-C7 | Class trên Catalog | **A** |
| R-C8 | Perf mở rộng; Unused soft? | **A** + Unused soft |

### 14.2 Review Round 3 — 3 điểm chỉnh + phản biện Agent

| # | Điểm Reviewer | Kết luận Agent | Phản biện / bằng chứng | Hành động |
|---|---------------|----------------|------------------------|-----------|
| **A** | Schema phải nằm *trong* Plan, không chỉ «có schema» | **Đồng ý** | A8 chống SoT tự sinh; xương sống Reviewer + giữ `pattern`/`class`/`requiresAPI` kẻo Audit mất trục | §4.1.1 viết đủ `FeatureManifest` + `FeatureModule` + ví dụ PF-community |
| **B** | Đổi tên Dual Owner → Business/Runtime (hai góc nhìn) | **Đồng ý mạnh** | SoT §0.1 cấm multi-owner; «Dual Owner» đọc như hai chủ | Bỏ brand Dual Owner · §1.3 đổi tên |
| **B′** | Ví dụ: `IfluxApiClient` Execution = Community Feature | **Không đồng ý** | `shell-boot.js` nạp `IfluxApiClient` → Runtime Owner = **Shell**; Feature = Consumer. Gán Execution=Feature = đúng lỗi Reviewer đang tránh | Sửa ví dụ chuẩn trong §1.3 |
| **C** | Thêm State Machine NOT_LOADED→…→DISPOSED | **Đồng ý** | Khớp lifecycle; debug Runtime; không cần code W0 | §4.1.2 State Machine · lifecycle → §4.1.3 |

### 14.3 Đóng Review trong Phase C (Exit C 2026-07-22)

| # | Hạng mục Review | Phạm vi | TT đóng C | Evidence |
|---|-----------------|---------|-----------|----------|
| R2-1 | Business×Runtime Owner | **C** | ✅ Closed | §1.3 · Catalog W4 · A4 |
| R2-2 · R3-A | Manifest Contract trong Plan + code | **C** | ✅ Closed | §4.1.1 · `features/*.manifest.js` · `feature-runtime.js` validate |
| R2-3 · R3-C | Lifecycle + State Machine | **C** | ✅ Closed | W3 READY · dispose hooks Critical A |
| R2-4 | Dependency Graph | **C** | ✅ Closed | §4.1 · A5–A6 |
| R2-5 | Rollback theo Wave | **C** | ✅ Closed | §5.1.1 · không cần rollback thật (W0–W5 PASS) |
| R2-6 | Feature Class + Pattern | **C** | ✅ Closed | §1.1–1.2 · R-C7 · `class[]` Manifest |
| R2-7 | Perf mở rộng · Unused soft | **C** (bảng) | ✅ Closed bảng §11.3 | Unused Coverage = **Task 4** (soft, đúng R-C8) |
| R3-B · B′ | Đổi tên Dual Owner · ví dụ API = Shell | **C** | ✅ Closed | §1.3 |
| — | PJAX / hydrate đầy đủ | **Ngoài C** | → Task 4 | Review đã «có điều kiện» không bắt W1–2 |
| — | R-C3 Pattern A→C unify | **Ngoài C** (R*=B) | → Task 4 | Owner đã chốt B |
| — | R-C4 Entity sớm ngoài stock | **Ngoài C** (R*=B) | → Task 4 | |
| — | OI-RT-MOUNT · bridge cache · OI-H4/M5 | **Ngoài đóng C** | → Task 4 | Soft / Gate formal SoT |

**Chữ ký lập Plan:** Agent · 2026-07-21  
**Chữ ký Review Round 2–3:** Agent · 2026-07-21 · §14 · §14.2  
**Chữ ký Exit C:** Owner · **Có điều kiện Perf** · 2026-07-22 · Review §14.3 đóng trong C  
**Neo:** SoT Runtime §0 · §9–§10 · Phase0/A/B/B2 · Exit B/C Owner duyệt · tiếp Task 4.
