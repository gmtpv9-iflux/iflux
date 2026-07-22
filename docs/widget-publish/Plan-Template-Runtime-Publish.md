# Plan — Template · Runtime Implementation · Publish (đa Runtime · Web-first)

**Trạng thái:** ✅ **CLOSED (Owner 2026-07-22)** — mục tiêu Publish đạt · Wave 4 Hard = task migration độc lập (không block đóng)  
**Ngày lập:** 2026-07-22 · **Đóng:** 2026-07-22  
**Neo SoT:** `SoT — Widget Definition.md` · Architectural Review Publish `display.module`  
**Artifact shape đã chốt:** **A** — mỗi Runtime một **Widget Published (Runtime)** riêng  
**Deliverable đã có:**  
- Wave R → `docs/widget-publish/Runtime-Architecture-Proposal-Web.md` (**APPROVED**)  
- Wave 0 → `docs/widget-publish/Wave0-Inventory.md` (**APPROVED** + Gap Classification A/B/C)  
- Wave 1 → Gap A map · FLW-001 Resolved  
- Wave 2 → SoT General+Implementation · UI Runtime tabs · Gate Ready/Draft  
- Wave 3 → `resolveRuntimeImplementation` + `runtime-implementations.js` (map = facade) · Gap B ESM Ready  
- Wave 4 soft → gate script; legacy/lazyModule giữ (Wave 4 Hard = ngoài Task này)  
**Không thuộc Plan này:** Task 3 Runtime Opt · Task 4 Loading Strategy · Wave 4 Hard migrate  

---

## 0. Mục tiêu tiếng người

Admin thêm Template / Widget / Publish Placement **không** còn lỗi mơ hồ `Publish thiếu display.module` vì quên map tay.

Đích kiến trúc:

- **Một Template ID** (SoT #3) — không nhân bản `TMP-…-WEB` / `TMP-…-MOBILE`
- Template khai báo **Supported Runtime** + **Runtime Implementation** (do Developer/Build đăng ký — Admin **không** nhập path module)
- **Publish(runtime đích)** resolve Implementation → sinh **Widget Published (Web|Mobile|…)** (phương án A)
- Runtime chỉ đọc Artifact của mình
- Mở rộng Runtime mới không sửa Publish core

---

## 1. Đánh giá bổ sung Reviewer (cập nhật Plan)

| # | Ý Reviewer | Đánh giá | Xử lý trong Plan |
|---|------------|----------|------------------|
| 1 | Wave 1: «Runtime đang Publish» thay vì hardcode chữ Web trong mục tiêu | **Hợp lý** | Cập nhật wording Wave 1 |
| 2 | Wave 2: làm rõ **General** (Name, Description, Capability, Schema, Preview Data) | **Hợp lý** | Cập nhật § Wave 2 + UI |
| 3 | Đổi API tên `resolveRuntimeImplementation(template, runtime)` | **Hợp lý** | Cập nhật Wave 3 |
| 4 | **Wave 2.5 Runtime Registry** (WEB/MOBILE/… không hardcode string) | **Hợp lý có điều kiện** | Đưa vào Plan như **Gate sau Proposal** — không invent trước khi có *Runtime Architecture Proposal (Web-first)* chứng minh cần thiết (chính Reviewer cũng cấm thêm Registry nếu chưa chứng minh) |
| 5 | Preview → **Runtime Preview** theo tab | **Hợp lý** | Wave 2 UI |
| 6 | Template thiếu Implementation → **Draft**, Widget không chọn được | **Hợp lý** | Wave 2 Gate Authoring |
| 7 | **Admin không nhập** entry/assets — Developer/Build đăng ký Implementation | **Hợp lý · bắt buộc** | Ownership §2 · Wave 2–3 |
| 8 | UI Template: General trái · Runtime tabs + Preview \| Runtime Implement | **Hợp lý** · Owner chốt 2026-07-22: Admin **chỉ xem** Ready/Draft trên Runtime Implement | **§5** · Wave 2 |
| 9 | Task riêng: *Runtime Architecture Proposal (Web-first)* — audit, không code | **Hợp lý · làm trước Wave 2.5 / trước invent Runtime** | **Wave R** (proposal) trước Wave 2.5 |

### Quá mức / chưa làm ngay

| Ý | Lý do |
|---|--------|
| Implement full Mobile/Desktop/AI Runtime ngay | Ngoài phạm vi Web-first; Plan chỉ **chừa chỗ** |
| Tự invent Runtime Library / Mapping / SoT mới trước Proposal | Reviewer cấm; dễ Cursor tự thiết kế |
| Admin nhập `display.module` | Ownership sai — **không** đưa vào Plan như giải pháp |

---

## 2. Ownership đã chốt

| Ai | Sở hữu | Không sở hữu |
|----|--------|--------------|
| **Admin** | Template General (tên, mô tả, schema, capability, preview data nghiệp vụ) · chọn Template ở Tầng 4 · Placement · Permission | Path entry, assets kỹ thuật, version build |
| **Developer / Build** | Runtime Implementation (entry, assets, version, deps) · đăng ký Ready theo Runtime | Nghiệp vụ Widget content |
| **Publish Pipeline** | Join Template + Implementation(Runtime đích) → **Widget Published (Runtime)** · validate Ready | Không invent module · không resolve ở User Runtime |
| **Runtime (Web…)** | Đọc Artifact của mình · render | Không resolve Template · không đọc SoT Admin |

---

## 3. Artifact shape (đã chốt A)

```text
Publish(runtime = WEB)
  → Widget Published (Web)     { display.module, … chỉ Web }

Publish(runtime = MOBILE)
  → Widget Published (Mobile)  { … chỉ Mobile }
```

- Version / phát hành **độc lập** từng Runtime  
- **Không** Artifact B nhồi mọi Runtime vào một JSON  

---

## 4. Chuỗi resolve (đích)

```text
Widget Definition (templateRef)
        │
        ▼
Template SoT (1 ID)
  ├── General
  └── runtimes / Implementations (Developer đăng ký)
        │
        ▼
resolveRuntimeImplementation(template, runtime)
        │
        ▼
Widget Published (runtime)
        │
        ▼
Runtime chỉ đọc Artifact đó
```

Validation Publish:

1. Template hỗ trợ `runtime` đích?  
2. Implementation Ready (có entry/build đăng ký)?  
→ Không → Reject: *«Runtime {X} chưa sẵn sàng cho Template …»* (không dùng message mơ hồ `display.module thiếu` làm SoT).

---

## 5. UI Mẫu giao diện (đã chốt Owner 2026-07-22)

**Trang danh sách Template:** giữ nguyên.

**Trong từng Template** — layout 2 cột:

```text
┌──────────────────────────┬────────────────────────────────────────────┐
│ Cột trái · GENERAL       │ Cột phải · RUNTIME                         │
│ (giữ nguyên thông tin    │ Tabs: [Web●] [Mobile] [Windows] [AI] …     │
│  hiện tại)               │ Web = mặc định                             │
│                          │                                            │
│ Name · Description ·     │ Modes (2 nút nhỏ, cạnh hàng tab):          │
│ Capability · Schema ·    │   [Preview●]  [Runtime Implement]          │
│ Preview Data (nghiệp vụ) │   Preview = mặc định                       │
│                          │                                            │
│                          │ Nội dung theo tab Runtime + mode:          │
│                          │   Preview → live / screenshot theo Runtime │
│                          │   Runtime Implement → CHỈ XEM (review)     │
└──────────────────────────┴────────────────────────────────────────────┘
```

### Mode «Runtime Implement» (cột phải)

| Ai | Được làm gì |
|----|-------------|
| **Admin** | **Chỉ review / đối chiếu** — không sửa entry, assets, path |
| **Developer / Build** | Sở hữu và cập nhật Implementation (ngoài form nghiệp vụ Admin; đăng ký Ready qua Build) |

**Hai trạng thái hiển thị (bắt buộc):**

| Status | Ý nghĩa |
|--------|---------|
| **Ready** | Runtime đang chọn đã có Implementation đăng ký đủ → Widget / Publish được dùng |
| **Draft** (hoặc «Chưa có Runtime») | Chưa Ready → Tầng 4 **không** chọn Template này cho Runtime đó; Publish reject rõ |

Nhãn UI có thể giữ «Runtime Implement» (Owner) với chú thích *chỉ xem*; hoặc «Trạng thái Runtime» — nội dung = Ready/Draft + metadata read-only (version…), **không** form nhập module.

### Khớp ownership

- Admin: General + Preview + **xem** Ready/Draft.  
- Developer: sửa Implementation.  
- Không: Admin gõ `display.module` / đường file trên màn này. 

---

## 6. Các Wave thi công (Work Breakdown)

> **Wave** = phạm vi công việc + Exit (WBS).  
> **Thứ tự thi công** = **§6.5 Roadmap** — không dùng danh sách Wave như lịch làm việc tùy ý.

> Một Wave = một Exit rõ. **Owner ra lệnh từng Wave.** Agent làm đúng **Step trong §6.5**, không nhảy Wave/Step.

### Wave R — Runtime Architecture Proposal (Web-first) · **READ ONLY**

**Neo:** Task Reviewer — *Runtime Architecture Proposal*  
**Làm:** Audit Web Runtime hiện tại · Boundary · Contract tối thiểu · Multi-runtime strategy · Share Runtime là gì · Risk · Recommendation  
**Cấm:** Code · refactor · thêm SoT/Registry/Mapping/Manifest mới nếu chưa trả lời đủ 5 câu Owner của Reviewer  
**Deliverable:** file proposal riêng (vd `docs/widget-publish/Runtime-Architecture-Proposal-Web.md`)  
**Exit:** Owner + Reviewer duyệt proposal → mới được thiết kế Wave 2.5 Registry (nếu proposal chứng minh cần)

**Quan hệ Plan:** Wave R chạy **song song hoặc ngay trước Wave 2**; **bắt buộc trước Wave 2.5**.

---

### Wave 0 — Inventory Production

**Làm:** Inventory Template + `templateRef` Widget **Production** (không chỉ seed) · đối chiếu Publish map / legacy / ESM  
**Deliverable:** Risk matrix `PUBLISH_OK` / `LEGACY_ONLY` / `WILL_FAIL` / unused  
**Exit:** Có danh sách gap ưu tiên trang Critical  
**Cấm:** Đổi SoT · cắt legacy · invent Registry  

---

### Wave 1 — Đóng gap vận hành (Runtime đang Publish)

**Mục tiêu (đã chỉnh Reviewer):**  
> Mọi Template **đang dùng** phải có **Runtime Implementation** cho **Runtime đang Publish** (hiện tại = Web).

**Proxy hiện trạng (bắt buộc ghi nhớ):**  
Trong Wave 1, Implementation(Web) **được đại diện bởi** `template-runtime-map.js`. Đây là **cầu nối tạm**, **không phải kiến trúc đích**. Đích Plan: Runtime Implementation → Publish → Artifact (Wave 2–3); Wave 3 sunset map.

**Làm:**

- **Step 1:** Xác minh `WGT-FLW-001` (`Unknown → Verification → Resolved`) — xem `Wave0-Inventory.md` §2.1; **không block** Gap A  
- Đăng ký / bổ sung Implementation Web qua map tạm (Developer/Build — không Admin gõ path trên UI nghiệp vụ) cho **Gap A**  
- Preflight Publish: thiếu Ready → reject message rõ  
- Legacy cửa 2–3: **giữ tạm**, có danh sách sunset  
- Gap B (gồm RANK-PERF / FLOW-SUMMARY nếu Resolved = seed): **không** code ESM trừ Owner mở scope  

**Exit:** Publish Placement trang Critical không còn class fail vì thiếu Implementation Web (Gap A) · FLW-001 đã Resolved  
**Cấm:** Cắt legacy · bắt buộc mọi Runtime khác · coi `template-runtime-map` = Runtime Implementation đích  

**Trạng thái thi công 2026-07-22:** ✅ **DONE** — Gap A đã map trên Production (`iflux-api` restart); FLW-001 Resolved → Gap B (không map); cửa 2 giữ.

---

### Wave 2 — SoT Template + UI General / Runtime (Web-first)

**Làm:**

- Cập nhật SoT: Template = General + Supported Runtime + Implementations (Developer); Artifact = Widget Published (Runtime)  
- UI theo **§5 đã chốt Owner:** cột trái General · cột phải tabs Runtime + modes Preview | Runtime Implement (Admin **chỉ xem** Ready/Draft)  
- Gate Authoring: Runtime đang Publish (Web) chưa **Ready** → coi Template **Draft** với Runtime đó · Widget không chọn  
- Developer đăng ký Implementation qua Build — **không** form nhập entry trên UI Admin  

**Exit:** SoT + UI §5 khớp ownership; Admin review được Ready/Draft; không còn nhập module trên Mẫu giao diện  

**Trạng thái thi công 2026-07-22:** ✅ **DONE**

---

### Wave 2.5 — Runtime Registry (chỉ sau Wave R duyệt)

**Điều kiện vào:** Wave R Recommendation **chứng minh** cần Registry (trả lời đủ 5 câu Reviewer).  
**Làm:** Catalog Runtime ids ổn định (`WEB` · `MOBILE` · …) — Publish/UI đọc Registry, không hardcode rải rác  
**Nếu Wave R kết luận chưa cần:** hoãn; dùng enum tối thiểu trong SoT Template cho Web-only  

**Exit:** Thêm Runtime mới = thêm dòng Registry + Implementation — không sửa Publish core  

**Trạng thái:** ⏭ **BỎ QUA** (Wave R: chưa cần Registry)

---

### Wave 3 — Publish Pipeline một nguồn

**Làm:**

- API/hàm: **`resolveRuntimeImplementation(template, runtime)`** (không đặt tên `resolveTemplate` cho bước này)  
- Publish luôn nhận `runtime` đích (mặc định giai đoạn này = Web)  
- Đóng **Widget Published (Web)** từ Implementation Ready  
- Sunset `template-runtime-map.js` (đọc SoT / artifact đăng ký Build — không map tay từng lần Admin thêm Template)  

**Exit:** Admin thêm Template + Developer đăng ký Web Ready → Publish không cần sửa code map  

**Trạng thái thi công 2026-07-22:** ✅ **DONE** — `runtime-implementations.js` = nguồn; map = facade; Gap B 6 TMP Ready

---

### Wave 4 — Cắt debt + Gate CI

**Làm:** Tắt legacy / `lazyModule` sau migrate · Gate CI: mọi `templateRef` dùng trên Placement có Implementation Ready cho Runtime Publish  
**Exit:** Một cửa Implementation; message fail rõ Runtime  

**Trạng thái thi công 2026-07-22:** 🟡 **SOFT DONE** — Gate CI `gate-web-implementations.js` (15/15 Ready). **Chưa cắt cứng** legacy/lazyModule (Placement cũ vẫn cần cửa 2–3). Cắt cứng = lệnh Owner riêng sau migrate.

---

## 6.5 Roadmap thực hiện Task (thứ tự thi công)

> **Wave (§6)** = phân chia phạm vi / Work Breakdown (cái gì thuộc gói nào).  
> **Roadmap (§6.5)** = **thứ tự bắt buộc** khi thi công (làm A rồi mới B).  
> Agent **cấm** nhảy lung tung (vd sửa Publish → sửa UI → Registry → quay Inventory).

### Roadmap cấp cao (toàn chương trình)

```text
Step 1  Đọc SoT + Plan này (Artifact A · ownership · UI §5 · NO-GO)
        │
        ▼
Step 2  Wave R — Audit / Proposal Runtime Architecture (Web-first) · READ ONLY
        │         (có thể song song Step 3; BẮT BUỘC trước Step 7 Registry)
        ▼
Step 3  Wave 0 — Audit / Inventory Production (Template · Widget · map · legacy)
        │
        ▼
Step 4  Wave 1 — Đóng gap Runtime đang Publish (Web) · giữ legacy tạm
        │
        ▼
Step 5  Wave 2 — Chuẩn hóa SoT Template (General + Runtime Implementation)
        │
        ▼
Step 6  Wave 2 (tiếp) — UI Mẫu giao diện §5 (General | tabs Runtime | Preview / Runtime Implement chỉ xem)
        │         (SoT chữ ký xong mới UI — không UI trước SoT)
        ▼
Step 7  Wave 2.5 — Runtime Registry  ← CHỈ NẾU Wave R chứng minh cần; không thì BỎ QUA
        │
        ▼
Step 8  Wave 3 — Publish: resolveRuntimeImplementation(template, runtime) + sunset map tay
        │
        ▼
Step 9  Wave 4 — Cắt debt (legacy / lazyModule) + Gate / CI
```

**Ánh xạ Step ↔ Wave**

| Step | Wave | Ghi chú thứ tự |
|------|------|----------------|
| 1 | — | Đọc trước mọi thi công |
| 2 | R | Proposal · không code product |
| 3 | 0 | Inventory · không sửa Publish/UI |
| 4 | 1 | Gap Web trước SoT/UI lớn |
| 5 → 6 | 2 | **SoT trước · UI sau** trong cùng Wave 2 |
| 7 | 2.5 | Tùy điều kiện Wave R |
| 8 | 3 | Publish một nguồn **sau** SoT/UI |
| 9 | 4 | Cắt debt **cuối cùng** |

### Thứ tự *trong* từng Wave (bắt buộc khi Owner mở Wave đó)

**Wave R**

1. Đọc SoT Widget + Plan §0–5  
2. Audit code Web Runtime / Publish boundary hiện tại  
3. Viết Proposal (Contract · Multi-runtime · Share · Risk · 5 câu Owner)  
4. **Dừng** — chờ duyệt · **không** code  

**Wave 0**

1. Inventory Production (store thật)  
2. Đối chiếu catalog / map / legacy / ESM  
3. Xuất risk matrix + ưu tiên Critical  
4. **Dừng** — Exit 0 · **không** sửa Publish/UI/SoT  

**Wave 1**

1. Lấy danh sách gap từ Wave 0 (Critical trước)  
2. Đăng ký Implementation cho Runtime đang Publish (Web) — Developer/Build  
3. Preflight Publish (message Ready / chưa sẵn sàng)  
4. Smoke Publish trang Critical · ghi Evidence  
5. Ghi danh sách sunset legacy — **chưa cắt**  
6. **Dừng** — Exit 1  

**Wave 2**

1. Cập nhật SoT chữ (General · Runtime Implementation · Artifact A · ownership)  
2. Owner duyệt chữ SoT  
3. UI §5 (cột General · tabs Runtime · Preview | Runtime Implement chỉ xem · Ready/Draft)  
4. Gate Tầng 4: chưa Ready → không chọn  
5. **Dừng** — Exit 2 · **chưa** rewrite Publish core (đó là Wave 3)  

**Wave 2.5** (nếu có)

1. Xác nhận Wave R cho phép Registry  
2. Thiết kế Registry tối thiểu  
3. Trỏ UI/Publish đọc Registry — **không** hardcode rải rác  

**Wave 3**

1. Implement `resolveRuntimeImplementation(template, runtime)`  
2. Publish nhận `runtime` đích (mặc định Web)  
3. Đóng Widget Published (Web) từ Implementation Ready  
4. Sunset / thay `template-runtime-map` bằng nguồn SoT/Build  
5. Regression Publish Critical  

**Wave 4**

1. Tắt cửa legacy / lazyModule  
2. Gate / CI  
3. Evidence Exit + chữ ký Owner  

### Cấm trên Roadmap

- Làm Step 8 (Publish) trước Step 3–4 (Inventory + gap)  
- Làm Step 6 (UI) trước Step 5 (SoT chữ)  
- Làm Step 7 (Registry) trước Step 2 (Wave R duyệt)  
- Làm Step 9 (cắt debt) trước Step 8 ổn định  
- Quay lại Inventory như “cứu” sau khi đã sửa Publish lung tung  

---

## 7. NO-GO (bổ sung Roadmap)

```text
Roadmap §6.5 = thứ tự thi công bắt buộc
Wave §6      = phạm vi / Exit từng gói
```

Thứ tự Wave trên Roadmap:

```text
R → 0 → 1 → 2 (SoT rồi UI) → 2.5? → 3 → 4
```

| NO-GO | Lý do |
|-------|--------|
| Artifact shape **B** | Đã chốt A |
| Nhân Template ID theo Runtime | Phá SoT một Template |
| Admin nhập entry/module path | Sai ownership |
| Invent Registry trước Wave R | Reviewer cấm invent |
| Nhảy Wave / đảo Step Roadmap | Rủi ro Production · Plan fail |
| Code Mobile Runtime trong Plan này | Web-first |
| Wave = Roadmap (lẫn hai khái niệm) | Agent dễ làm lung tung |

---

## 8. Liên quan lỗi hiện tại (ngắn)

| Bug | Mô tả | Plan |
|-----|--------|------|
| A | Mất `templateRef` → `TMP-LEGACY` | Đã vá (manifest/bridge) — giữ regression check Wave 1 |
| B | Publish không consume Template → Implementation | Wave 1–3 giải quyết triệt để |

Vá từng `TMP-*` vào `template-runtime-map` = **tạm** đến hết Wave 1–3, không phải đích.

---

## 9. Deliverable theo Wave (file)

| Wave | File kết quả (dự kiến) |
|------|-------------------------|
| R | `docs/widget-publish/Runtime-Architecture-Proposal-Web.md` |
| 0 | `docs/widget-publish/Wave0-Inventory.md` |
| 1 | `docs/widget-publish/Wave1-Gap-Closure.md` |
| 2 | Cập nhật SoT + ghi nhận UI trong Wave2.md |
| 2.5 | (nếu có) Runtime Registry SoT nhỏ |
| 3–4 | Wave3.md · Wave4-Gate.md |

**File Plan này:** `docs/widget-publish/Plan-Template-Runtime-Publish.md` (nguồn review Owner/Reviewer).

---

## 10. Lệnh Owner tiếp theo

1. Reviewer + Owner **duyệt Plan** (gồm **§6 Wave** + **§6.5 Roadmap**).  
2. **«Thi công Wave R»** = Roadmap Step 2 (Proposal · không code).  
3. **«Thi công Wave 0»** = Roadmap Step 3 (Inventory).  
4. Tiếp Step 4… theo Roadmap — **không** đảo thứ tự.

---

## 11. Pre-flight Plan READY?

| Tiêu chí | Có? |
|----------|-----|
| Artifact A chốt | ✓ |
| Template 1 ID + General / Runtime Preview | ✓ · **§5 UI Owner chốt 2026-07-22** |
| Ownership Admin ≠ Developer Implementation | ✓ |
| Wave 1 wording Runtime đang Publish | ✓ |
| `resolveRuntimeImplementation` | ✓ |
| **§6.5 Roadmap ≠ Wave (WBS)** | ✓ |
| Wave 2.5 Registry có điều kiện Wave R | ✓ |
| Không invent Runtime/code trong Plan | ✓ |
| Một file Plan review được | ✓ |

**Kết luận:** Plan **READY for Reviewer/Owner review** — chưa thi công Wave.

---

**Chữ ký lập Plan:** Agent · 2026-07-22  
**UI §5 chốt:** Owner · 2026-07-22 (General trái · Runtime tabs + Preview | Runtime Implement chỉ xem · Ready/Draft)  
**Chờ duyệt:** Owner · Reviewer (các Wave còn lại)  
**Neo:** Architectural Review Publish · Artifact A · ownership Implementation Build · Runtime Architecture Proposal trước invent Registry.
