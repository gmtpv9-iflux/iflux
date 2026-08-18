# 05 — Plan · Public Identity Platform Re-baseline (sau Foundation)

**Date:** 2026-07-29  
**Status:** **LOCKED v1.2.1** — Brief §6A · **Program End-to-End Business Verification Gate** · Phase 5 **PASS** · Phase 6 Discovery **OPEN**  
**Program:** Affiliate V2 Architecture Re-baseline  
**Business Intent:** [`Business requirement brief.md`](Business%20requirement%20brief.md) — LOCKED (+ §6A 2026-07-30)  
**Maps:** [`04-Solution.md`](04-Solution.md) LOCKED v1.4 · [`02-SoT.md`](02-SoT.md) · E.7 BD-00…07 Accepted · [`28-BR-E2E-Owner-Context-Preservation-Traceability-Audit.md`](28-BR-E2E-Owner-Context-Preservation-Traceability-Audit.md) LOCKED  

**Chuỗi:**

```text
Brief → Audit → Objective → SoT → Acceptance → Solution → Plan (file này) → Implementation
```

**Quy tắc Plan:**

* Chỉ **map** Solution → phase/work — **không** sửa SoT / Brief / đẻ Business Rule mới  
* Không code cho đến khi phase tương ứng **Owner mở** và AC phase Pass  
* **BD-06** (*Owner Context Replacement*) · **BD-07** (*Owner URL SEO Role*) = **Accepted** tại Audit E.7 — không còn deferred OD-OWN-REPLACE / OD-SEO-CRAWL

---

# 0. Foundation Compliance Gate (Audit Brief)

Đối chiếu toàn bộ artifact với **Business Requirement Brief** (mục tiêu cao nhất).

| Brief yêu cầu | Evidence phục vụ | Artifact | Kết luận |
|---------------|------------------|----------|----------|
| User sở hữu Public Address trên iflux.vn | BD-00 · BR-16 · PI-16 · Solution §4–5.1 | Brief · E.7 · SoT · Solution | ✅ |
| Public Identity ≠ chỉ Affiliate/Referral | BD-01 · PI-14 · Objective v1.1 · Solution spine | SoT · Objective · Solution | ✅ |
| Product URL vs Owner URL — hai class, một resource | BD-02 · BR-06 · PI-06 · Solution §5.3 | Brief · SoT · Solution | ✅ |
| Canonical / SEO Authority = Product URL | BR-05 · BD-02 · Solution SEO | Brief · SoT · Solution · Audit E.4 | ✅ |
| Owner URL = distribution (Share/Ads/QR/branding) | BR-06 · BR-12 · Solution Share artifact | Brief · SoT · Solution | ✅ |
| Owner Context → preserve Owner trên link cần duy trì context; Product URL vẫn sống | BD-03 · BR-17 · PI-18 · Solution §5.3·§6 | Brief §8–9 · SoT · Solution | ✅ |
| **§6A End-to-End Owner Context Preservation** (Share→Open→…→Attribution; môi trường được hỗ trợ) | Solution §5.3 Principle E2E · Plan **Program End-to-End Business Verification Gate** · contribution từng Phase | Brief §6A · §11 | ✅ **Docs LOCKED** — Gate runtime chưa chạy → **Final Program PASS** chưa được ký · **cấm** tuyên bố kênh phân phối “hỗ trợ đầy đủ” trước Gate |
| Enter Owner URL khác ⇒ replace Active Owner Context; Attribution riêng | BD-06 · BR-18 · PI-19 | E.7 · SoT · Solution | ✅ |
| Owner URL ≠ SEO Asset; SEO Authority = Product URL | BD-07 · BR-19 · PI-20 | E.7 · SoT · Solution | ✅ |
| Một Active Owner / trải nghiệm · Transfer sau Identity Created | SoT §6 · Solution §6 | Brief §7 · SoT · Solution | ✅ |
| Storage ≠ Business Authority | BD-05 · Solution Roles | Brief §9 · SoT · Audit | ✅ |
| Affiliate chỉ consumer | BR-04 · Solution §5.5–5.6 | Brief §10 · SoT · Solution | ✅ |
| Không bug-fix cookie/Register làm đích | Objective §7 · Audit §A | Objective · Audit | ✅ |

| Artifact | Vai trò | Phục vụ Brief? | Status |
|----------|---------|----------------|--------|
| **Brief** | Business Intent | SoT | LOCKED |
| **00 Audit** | Evidence · Conflict · Runtime · Business Model · BD | ✅ | §A–E PASS · E.7 Accepted |
| **01 Objective** | Mục tiêu Re-baseline Identity Platform | ✅ | v1.1 (nên LOCK cùng Foundation) |
| **02 SoT** | Luật Product | ✅ | LOCKED v1.3 |
| **03 Acceptance** | Chứng minh Foundation | ✅ | LOCKED · Foundation PASS |
| **04 Solution** | Map SoT → Architecture Target | ✅ v1.2 (BD-06/07) | **LOCKED** |

**Gate kết luận:** Foundation **đủ phục vụ Brief** → được mở **Plan**.  
**Còn mở (không chặn Plan):** Phase 1 Inventory (1A Capability · 1B Ownership: PNC/AR/storage) · rename semantic · SEO kỹ thuật crawl/index (sau BD-07).

---

# 1. Mục tiêu Plan

Chuyển Architecture Target (`04-Solution`) thành chuỗi phase có:

* Acceptance Criteria theo phase  
* **§2 Execution Rule** (Discovery → Design → Implement → Verify → Accept) cho mọi phase có Code  
* **§2.1 New File Creation Governance** (Modify Existing trước · Create New chỉ khi đủ chứng minh + cleanup)  
* Owner mở từng Step → Pass → bước sau  

**Không** implement “vá Affiliate” như đích; đích = Public Identity Platform theo Solution.

---

# 2. Execution Rule — mọi Phase có Code

Áp dụng cho Phase **4 · 5 · 6 · 7 · 8 · 9 · 10 (nếu có code) · 11 · 12 · 13**.

Mỗi phase triển khai đi đúng chu trình — **không** nhảy bước; **không** code ở Step 1–2.

```text
Step 1 Discovery Audit (AS-IS)
        ↓ Gate: Owner mở Step 2
Step 2 Implementation Design
        ↓ Gate: Owner duyệt Design
Step 3 Gate 0 — Recovery Point
        ↓ Gate: recovery point thành công
Step 3 Implementation
        ↓
Step 4 Verification Audit (TO-BE)
        ↓
Step 5 Phase Acceptance (PASS / FAIL)
```

### Step 1 — Discovery Audit (AS-IS)

* Audit hiện trạng **đúng phạm vi phase**  
* Thu thập evidence · xác định owner hiện tại  
* Dual authority · shadow implementation · legacy path  
* **Không code**

**Output:** Audit Report · Evidence · Gap list  

**Gate:** Owner mở Step 2.

### Step 2 — Implementation Design

* Mapping Audit → Solution → SoT  
* Thiết kế cách sửa · Impact Analysis · File Inventory · Rollback (nếu cần)  
* **Không** tạo Business Rule mới · **không** đổi Scope  
* **Bắt buộc** áp dụng **§2.1 New File Creation Governance** nếu Design đề xuất file mới  

**Output:** Implementation Design · Impact Analysis · File Inventory · Rollback Strategy  

**Gate:** Owner duyệt Design.

### Step 3 Gate 0 — Recovery Point

Áp dụng bắt buộc cho phase có **multi-file replace / xóa API / migrate caller**.

Trước khi sửa bất kỳ file nào của Step 3:

1. Working tree phải sạch  
   `git status = clean`
2. Tạo recovery point  
   `commit` hoặc `tag` hoặc `branch` riêng cho Step 3
3. Ghi lại metadata recovery point  
   `commit hash` · `branch` · `timestamp`
4. Chỉ sau khi recovery point thành công mới được bắt đầu Step 3

Workflow chuẩn:

```text
Step 2 ACCEPT
↓
git status sạch
↓
commit/tag baseline
↓
branch riêng cho Step 3
↓
implement
↓
Step 3 PASS
↓
Step 4 Verification
↓
merge
```

Nếu rollback:

1. ưu tiên quay về recovery point này  
2. sau đó mới verify rollback theo phase Appendix / Rollback Verification

**Cấm:** code trước recovery point; rollback tay nhiều file khi chưa thử quay về recovery point.

### §2.1 New File Creation Governance (toàn chương trình)

**Nguyên tắc:** **Replace, không Accumulate.** Mặc định **Modify Existing** trước · **Create New** sau.

File mới chỉ khi **đồng thời** thỏa:

| # | Điều kiện |
|---|-----------|
| 1 | **Discovery:** audit khu vực · chứng minh module hiện tại **không** mở rộng hợp lý · vì sao Modify fail |
| 2 | **Architecture:** responsibility mới **chưa** thuộc module hiện có · không SoT / Authority / Facade trùng |
| 3 | **Replacement:** migration · callers chuyển · cleanup · **xóa** module/API cũ sau migration — **cấm** “thêm mới + giữ cũ” |
| 4 | **Verification:** không còn caller cũ · không dual implementation · không abstraction layer thừa |

**Không chứng minh được → Modify Existing · Design Create New = REJECT.**

Áp dụng mọi Phase có Code (4+). Phase 5: Create `identity-context.js` **REJECT** — Modify `navigation-context.js` (xem Design `11`).

### Step 3 — Implementation

* Code đúng Design · không mở rộng phạm vi · không sửa ngoài Scope  

**Output:** Commit · Change List  

### Step 4 — Verification Audit (TO-BE)

* Audit lại toàn bộ Scope · so sánh trước/sau · Evidence  
* Không còn Dual Authority / Shadow · đúng BRD / SoT / Solution  

**Output:** Verification Report · PASS / FAIL · Evidence  

### Step 5 — Phase Acceptance

Chỉ **PASS** khi đồng thời:

| # | Điều kiện |
|---|-----------|
| 1 | BRD đạt (trong phạm vi phase) |
| 2 | SoT đạt |
| 3 | Solution đúng |
| 4 | Không còn Shadow |
| 5 | Không còn Dual Authority (trong phạm vi phase) |
| 6 | Đầy đủ Evidence |
| 7 | Reviewer/Owner Accept |

**Cấm:** Code trước khi Owner mở Step 3; Design đẻ BR mới; Verification bỏ qua Dual Authority; Accept thiếu Evidence.

---

# 3. Roadmap phases


## Phase 0 — Lock Solution & Plan baseline

| | |
|--|--|
| **Mục tiêu** | Khóa `04-Solution` v1.1; Plan này làm SoT vận hành phase |
| **AC** | Solution không còn “Platform owns Public Identity”; có Subject Owner / Lifecycle Authority; BD-03 preserve-context; AC-T2/T3 mapping đủ |
| **Deliverable** | Solution **LOCKED** · Plan DRAFT→Owner Accept Plan |
| **Code** | Không |
| **Status** | ☐ Owner Accept Plan |

---

## Phase 1 — Public Identity Boundary Audit (docs)

Hai mặt **bắt buộc** trong cùng phase — **không** audit theo page:

| Mặt | Câu hỏi trung tâm | Đơn vị |
|-----|-------------------|--------|
| **1A Capability Boundary** | Capability nào tiêu thụ / tạo / biểu diễn Identity? | Capability |
| **1B Architecture Ownership** | Component kiến trúc nào đang **giữ / tranh** Authority? | Architectural component |

```text
Conflict không chỉ ở capability:

Identity Authority  →  ?  →  Navigation  →  URL Writer  →  Storage

PNC · AR · cookie · localStorage · referral store · URL parser
= architectural component ownership — không phải capability, không phải page.
```

| | |
|--|--|
| **Neo** | Brief · Audit E.1 · §D runtime · B-CAP-02 · Solution §5 · §8 Roles · BD-00…07 |
| **Cấm** | Inventory “page nào gắn IFLxxx”; audit decorate/cookie/`?ref` theo page như vòng cũ |
| **Code** | Không |
| **Status** | ☐ |

---

### 1A — Capability Boundary Audit

**Mục tiêu:** Xác định mọi consumer đọc / tạo / truyền / biểu diễn Public Identity theo capability.

```text
Sai:  Page → community / stock / article / register
Đúng: Capability → Role (Authority|Consumer|Representation|Transport|…)
```

URL decoration = **infrastructure** (Representation Writer), không phải page responsibility.

#### Scope — 3 lớp (không trộn)

| Lớp | Capability | Vai trò điển hình (TO-BE) |
|-----|------------|---------------------------|
| **Core** | Platform Identity · Navigation · Share · Register · Login/Auth · Affiliate Attribution · Commission | Authority / Consumer / Representation / Result — theo SoT |
| **Product** | Community · Stock · Article · Membership | Consumer (+ Representation khi flow yêu cầu) — **không** Identity Owner |
| **Distribution / Integration** | QR · Ads · Deeplink · Notification · OAuth · Payment | Transport / channel — **không** sở hữu Identity |

#### Matrix (mỗi capability)

| Concern | Câu hỏi |
|---------|---------|
| Identity Consumer | Có cần biết Owner không? |
| Authority | Có đang **quyết định** Owner không? |
| Representation | Có **tạo** Owner URL / Product URL không? |
| Transport | Có **truyền** Owner Context không? |
| Storage | Có giữ state mang **business meaning** không? |
| Transition | Có **tự đổi** Owner không? |

#### Deliverable 1A — Capability Inventory

```text
Capability
  Role:        Authority | Consumer | Representation | Transport | Temporary | …
  Reads:       Public Identity | Navigation Context | Attribution Result | none
  Writes:      none | representation | business result | …
  Forbidden:   Identity authority | dual Authority | storage-as-Authority | …
  AS-IS gap → TO-BE contract → Phase implement map
```

---

### 1B — Architecture Ownership Audit

**Mục tiêu:** Xác định **ai owns** từng mắt xích kiến trúc Identity — phát dual Authority / storage-as-Authority / parser-as-Authority trước khi implement P0.

```text
Chuỗi bắt buộc audit:

Identity Authority
       ↓
Identity Context / Navigation projection
       ↓
URL Writer / Path Capture / Parse
       ↓
Storage / Transport (cookie · LS · referral store · …)
```

#### Component inventory (AS-IS — ví dụ neo Audit §D; bổ sung khi gặp)

| Component (runtime) | Concern kiến trúc | Câu hỏi ownership |
|---------------------|-------------------|-------------------|
| Platform Identity / Lifecycle | Identity Authority | Ai **được** quyết định Owner / Transition? |
| PNC / Navigation Context | Projection | Mirror Context hay đang bị dùng như Authority? |
| AR / Affiliate Context / referral store | Attribution vs Identity | Có đang tranh Identity Authority với PNC không? |
| App URL Writer / Path Decorators | Representation | Một writer hay nhiều đường viết URL? |
| Path Capture / URL parser | Transport / Parse | Candidate only hay đang resolve Authority? |
| cookie · localStorage · session | Storage / Transport | Technical restore hay Business SoT (vi phạm BD-05)? |
| Register / Social read path | Consumer boundary | Đọc Context hay đọc AR/storage làm Authority? |

#### Matrix (mỗi component)

| Concern | Câu hỏi |
|---------|---------|
| Declared owner | Module/capability nào **nên** own (TO-BE theo Solution §5 · §8)? |
| Actual owner | Runtime hiện **ai** write/read như Authority? |
| Authority? | Component này có đang **quyết định** Owner / Identity không? |
| Dual? | Có ≥2 component cùng mang Identity Authority không? |
| Allowed role | Authority · Mirror · Representation · Transport · Temporary · Forbidden |
| Migration | Keep · Rewrite role · Demote → Transport · Delete · Map Phase 4+ |

#### Deliverable 1B — Architecture Ownership Map

```text
Component
  Architectural slot:  Identity Authority | Context/NC | Writer | Capture/Parse | Storage | …
  TO-BE owner:         (Solution Role)
  AS-IS owner:         (module / store / path)
  Allowed role:        Authority | Mirror | Representation | Transport | Temporary | Forbidden
  Conflict:            dual Authority | storage-as-Authority | parser-as-Authority | none
  Disposition:         Keep | Rewrite | Demote | Delete → Phase N
```

**Cấm 1B:** Biến ownership map thành page crawl. Component có thể **được gọi từ nhiều page** — vẫn đếm **một** component.

---

### AC Phase 1 (1A + 1B)

1. **1A:** Inventory đủ 3 lớp; mỗi capability có Role / Reads / Writes / Forbidden.  
2. **1B:** Ownership map đủ chuỗi Authority → Context → Writer → Storage; mỗi component có TO-BE vs AS-IS · Allowed role · Conflict · Disposition.  
3. **Không** bảng “page A dùng mã gì”.  
4. Phân biệt Capability (1A) vs Architectural component (1B) — PNC/AR/cookie **không** gọi là Product Capability.  
5. Gap map sang Phase 4+; **không** đề xuất BR mới ngoài SoT/Brief.  
6. Dual Authority / storage-as-Authority (nếu còn) ghi nhận rõ → chặn Pass Phase 1 nếu chưa có Disposition.

---

## Phase 2 — Owner Decisions (BD-06 · BD-07) — **PASS**

| | |
|--|--|
| **Mục tiêu** | Khóa hai Business Decision còn mở trước đây (`OD-OWN-REPLACE` · `OD-SEO-CRAWL`) thành **BD-06** · **BD-07** tại Audit E.7 |
| **BD-06** | *Owner Context Replacement* — Enter Owner URL của Identity khác ⇒ **replace** Active Owner Context ngay; Attribution xử lý riêng (≠ giữ Owner cũ) |
| **BD-07** | *Owner URL SEO Role* — Owner URL = Public Distribution Representation, **không** phải SEO Asset; SEO Authority duy nhất = Product URL; crawl/index kỹ thuật **deferred** (không khóa noindex trong BD) |
| **AC** | ✅ Ghi Accepted tại Audit E.7 · SoT BR-18/19 · PI-19/20 · Solution map — **không** đẻ implementation SEO trong Business Decision |
| **Code** | Không |
| **Status** | ✅ **PASS** 2026-07-29 |

**Ghi chú ký hiệu:** BD = Business Decision (khóa tại Audit E.7). OD = Owner Decision (mã tạm trước khi Accept thành BD).

---

## Phase 3 — Product Architecture / ADR Re-baseline (docs)

| | |
|--|--|
| **Mục tiêu** | **Supersede** kiến trúc cũ bằng architecture baseline mới: đồng bộ Product Architecture cấp sản phẩm với Public Identity Platform **trước** khi đổi runtime — **không** phải “viết lại tài liệu cho đẹp” |
| **Neo** | `02-SoT.md` · `04-Solution.md` · Audit R-* / documentary ADR disposition · BD-00…07 |
| **Code** | Không |
| **DB / rename runtime** | Không |
| **Status** | ☐ |

### Bản chất Phase 3

```text
Audit Finding  +  Solution Target  +  SoT
                    ↓
            Architecture Decision (docs baseline)
```

**Chốt:** Identity Architecture trên giấy đủ ổn định để Phase 4–6 migrate runtime theo đúng ownership.  
**Không chốt:** database · rename table/code · cookie · URL runtime · data migration (thuộc phase implement).

```text
Trước (supersede):     Affiliate → Referral Identity → URL decorator → Attribution
Sau (baseline mới):    User owns Public Identity → Owner URL (Representation)
                         → consumed by Affiliate / Share / Ads / QR / Community / …
```

---

### Phạm vi 1 — Product Architecture V2 (Identity Architecture)

Cập nhật / bổ sung chương Identity theo mô hình:

| | |
|--|--|
| Subject Owner | User |
| Public Identity | Public Address (Business SoT) |
| Lifecycle Authority | Platform Identity |
| Representation | Owner URL · Product URL |
| Consumers | Affiliate · Share · Ads · QR · Community · … — **không** Identity Authority |

Affiliate **không** còn là Identity Authority trong architecture docs.

---

### Phạm vi 2 — ADR review (phân loại — không tạo ADR mới hàng loạt)

| Trạng thái | Ý nghĩa |
|------------|---------|
| **Keep** | Quyết định cũ vẫn đúng dưới Public Identity Platform |
| **Rewrite** | Giữ mục tiêu / concern nhưng đổi ownership · boundary · vocabulary |
| **Archive** | Quyết định cũ không còn áp dụng — không dẫn dắt implement mới |

**Ví dụ disposition (neo Audit documentary — hoàn thiện trong phase):**

| ADR / artifact cũ | Hướng |
|-------------------|--------|
| “Affiliate Public Identity” | **Archive** hoặc **Rewrite** → Public Identity Platform |
| Path Decorators / referral path decorator | **Rewrite** → Owner URL Representation (không nhất thiết bỏ concern) |
| Affiliate Context stored in cookie | **Rewrite** → Transport state ≠ Business Authority (BD-05) |
| Exclusion strip / auth strip như luật Product | **Rewrite** theo BD-03 · BD-06 |
| PNC = User Identity / dual PNC vs Affiliate Context Authority | **Rewrite** → Navigation Context = projection; một Identity Authority |

Mỗi ADR **Rewrite** / ADR mới (nếu bắt buộc) phải **link** SoT BR/PI hoặc Solution section — không tự đẻ luật.

---

### Phạm vi 3 — Vocabulary migration (docs kiến trúc)

**Cấm** còn dẫn dắt trong architecture docs (Product Architecture · ADR active · SoT pointer):

| Cấm | Thay bằng |
|-----|-----------|
| Affiliate Identity · Referral Identity | **Public Identity** |
| Affiliate URL owns user | User owns Identity · Owner URL = Representation |
| Affiliate Context = Identity Authority | **Attribution** (+ Transport nếu storage) · Identity Context / Owner Context |

Lý do: vocabulary cũ → developer code sai boundary.

*(Rename symbol runtime / table = Phase 11 Semantic migration — **không** Phase 3.)*

---

### Ngoài phạm vi Phase 3 (cấm)

| Không làm | Thuộc |
|-----------|--------|
| Đổi database / migration data | Implement sau |
| Rename table · rename code symbol | Phase 11 (optional) / implement |
| Sửa cookie · localStorage · URL runtime | Phase 4–6 · 9 |
| Capability Inventory / Ownership Map | Phase 1 (1A · 1B) |
| Đẻ Business Rule mới | Cấm — chỉ map SoT/Solution/E.7 |

---

### Acceptance Criteria Phase 3

| AC | Tiêu chí | Pass |
|----|----------|------|
| **AC-1** | Identity Architecture trong Product Architecture V2 phản ánh **User-owned** Public Identity + Platform Lifecycle Authority | ☐ |
| **AC-2** | Affiliate **không** còn là Identity Authority trong architecture docs | ☐ |
| **AC-3** | Mọi ADR / architecture artifact liên quan Identity · URL · Context · Attribution trong scope Program được phân loại **Keep / Rewrite / Archive** | ☐ |
| **AC-4** | Vocabulary **Public Identity / Owner URL / Owner Context / Attribution** thống nhất trong docs **active** (không Archive) | ☐ |
| **AC-5** | Mỗi ADR Rewrite hoặc ADR mới có **link** tới SoT và/hoặc Solution decision | ☐ |
| **AC-6** | **Không** phát sinh Business Rule mới ngoài SoT / E.7 | ☐ |
| **AC-7** | Evidence: không có thay đổi runtime/DB trong diff Phase 3 | ☐ |
| **AC-8** | **Không** còn Architecture/ADR **chính thức** (active) mâu thuẫn với Architecture Baseline mới. Mọi di sản kiến trúc trong scope phải Keep · Rewrite · hoặc Archive — **cấm** trạng thái “vừa đúng vừa sai” / baseline mới song song baseline cũ | ☐ |

**Ý nghĩa AC-8 (supersede):** Không đủ khi chỉ thêm PA V2 + ADR mới đúng. Developer **không** được còn đọc 15 ADR cũ “Affiliate Context / Referral Identity / Path Decorator Authority” như tài liệu còn hiệu lực. Archive phải rõ ràng (status / pointer / không còn trong active set).

---

### Deliverable

1. **Product Architecture V2** (updated) — chương Identity theo baseline mới  
2. **ADR Disposition Matrix** (file/bảng trong Program — audit nhanh sau này):

| Cột | Nội dung |
|-----|----------|
| **ADR** | Tên / path artifact cũ |
| **Status** | Keep · Rewrite · Archive |
| **Reason** | Vì sao (neo SoT / Solution / BD / R-*) |
| **Replacement** | Artifact / khái niệm thay thế (nếu Rewrite/Archive) |

**Ví dụ dạng matrix:**

| ADR | Status | Reason | Replacement |
|-----|--------|--------|-------------|
| Affiliate Context (Identity Authority) | Archive | Dual Authority vs BD-00 · BD-01 | Public Identity Platform + Attribution Result |
| Path Decorator (referral authority) | Rewrite | Representation ≠ Authority | Owner URL Representation |
| Referral Authority / Affiliate Public Identity | Archive | Sai semantic | Platform Identity (Lifecycle) · User (Subject Owner) |
| Cookie = Business SoT | Rewrite | BD-05 | Transport / recovery only |

3. **Vocabulary lock note** — danh sách cấm / thay thế trong docs active  
4. **Active vs Archive index** — developer biết ADR nào còn hiệu lực (phục vụ AC-8)

### Chuỗi sau Phase 3 (sạch)

```text
Brief → Audit → Objective → SoT → Acceptance → Solution → Plan
    → Product Architecture V2
    → ADR Disposition Matrix
    → Implementation (Phase 4+)
```

Developer **không** tự suy luận “ADR nào còn hiệu lực?” — Matrix + Archive status là SoT vận hành docs.

### Quan hệ phase

```text
Phase 1 (1A·1B)  → biết capability/component vi phạm
Phase 3          → supersede toàn bộ di sản kiến trúc (AC-8) — không song song baseline
Phase 4–6        → runtime migrate theo baseline + inventory
```

Sau Phase 3: **chưa** mở code chỉ vì docs xong — cần Phase 1 inventory (nếu chưa Pass) + Owner mở phase runtime. Không thêm vòng audit lớn ngoài Plan.

---

## Phase 4 — Platform Identity Lifecycle Authority — P0

| | |
|--|--|
| **Mục tiêu** | Tập trung Transition (enter Owner URL · Identity Created · Login · Logout) vào **Lifecycle Authority**; Path Capture chỉ cung cấp **Public Identity candidate** — không phải Authority |
| **Neo** | Solution §5.1 · §6 · BD-00 · BD-06 |
| **AC (phase)** | URL không phải Authority; Login/Auth không tạo Identity Authority; Transfer Guest→Self theo SoT §6; Enter Owner URL khác ⇒ replace (BD-06); Path Capture = lookup input only |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ✅ **PASS** 2026-07-29 · Owner Accept · mở Phase 5 · [`09b-Phase-04-Acceptance-PASS.md`](09b-Phase-04-Acceptance-PASS.md) |

| Step | Output | Status |
|------|--------|--------|
| 1 Discovery Audit | Report · Evidence · Gap | ✅ |
| 2 Implementation Design | Design · Impact · Inventory · Rollback · State Machine | ✅ ACCEPT |
| 3 Implementation | Commit · Change List | ✅ |
| 4 Verification Audit | Verification Report | ✅ Plan ACCEPT · Owner PASS |
| 5 Phase Acceptance | PASS / FAIL | ✅ **PASS** |

**Neo BD Phase 4:** BD-06 Guest replace · BD-08 Self precedence.

---

## Phase 5 — Identity Context Projection — P0

| | |
|--|--|
| **Mục tiêu** | Một **Identity Context contract**; **Navigation Context = runtime projection**; Register/Social/Login **chỉ** đọc Context — hết AR/storage làm Authority (R-AUTH-01 · R-CAP-01) |
| **Neo Solution** | §5.2 · §5.4 · §8 · §10 |
| **AC** | Không dual read Authority; Register/Social evidence chỉ Context; attribution storage tối đa Transport/Flag; NC ≠ User Identity; NC ≠ URL state |
| **Verification (Business)** | Mọi capability trong scope **đọc** cùng Active Owner / Identity Context — không verify href (Phase 6) |
| **§6A contribution** | Register / Login (và Social caller) đọc Identity Context khi Context đã có trong phiên — **không** verify Share→Open→IAB E2E |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ✅ **PASS** 2026-07-30 · Owner Accept · mở Phase 6 · [`14b-Phase-05-Acceptance.md`](14b-Phase-05-Acceptance.md) |

| Step | Output | Status |
|------|--------|--------|
| 1 Discovery Audit | Report · Evidence · Gap · Allowed Reader Matrix | ✅ ACCEPT |
| 2 Implementation Design | Design · Impact · Inventory · Rollback · §2.1 New File Gate | ✅ ACCEPT |
| 3 Implementation | Commit · Change List | ✅ DONE · deployed Production |
| 4 Verification Audit | Verification Report | ✅ DONE — product AC met ([`14`](14-Phase-05-AC-Gap-Classification.md)) |
| 5 Phase Acceptance | PASS / FAIL | ✅ **PASS** · [`14b`](14b-Phase-05-Acceptance.md) |

---

## Phase 6 — URL Representation Writer · BD-03 — P0

| | |
|--|--|
| **Mục tiêu** | Một App URL Writer; **preserve Owner** trên link **cần duy trì Owner Context**; **Product URL vẫn tồn tại**; giảm direct `location.*` (R-URL-01 · R-OWN-01 · R-URL-03) |
| **Neo** | Solution §5.3 · BR-11 · BR-17 · BD-03 · Brief §8–§9 |
| **AC** | (1) Writer phân biệt: Owner URL representation khi cần Owner Context · Product URL khi resource/business flow yêu cầu Product URL — **không** áp dụng prefix Owner toàn cục. (2) Auth exclusion AS-IS không còn là luật Product cho link cần preserve. (3) Các flow chuyển tiếp cần duy trì Owner Context (ví dụ authentication/callback/payment **nếu Business Flow yêu cầu**) phải có cơ chế restore phù hợp — **không** biến OAuth/payment thành Business Rule từ Plan. |
| **Verification (Business Representation)** | **P6-V-B1…B5** — Login → link/menu/widget/href = Owner URL Active; Guest B→Login C → `/IFLC/…`; `querySelectorAll('a[href]')` — neo [`09`](09-Phase-04-Step4-Verification-Audit.md) §4 (chuyển từ Phase 4) · chi tiết khi mở Phase 6 Step 4 |
| **§6A contribution** | Preserve Owner trên **điều hướng / link do app sinh** khi cần duy trì Context (BD-03) — **không** thay Program End-to-End Business Verification Gate |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ✅ **PASS** 2026-07-30 · Owner Accept · mở Phase 7 · [`33-Phase-06-Acceptance.md`](33-Phase-06-Acceptance.md) |

---

## Phase 7 — Share boundary — P1

| | |
|--|--|
| **Mục tiêu** | Share chỉ tạo Share artifact Owner URL; không decorate application navigation (R-URL-02) |
| **Neo** | Solution §5.3 · BR-12 |
| **AC** | Evidence: share path ≠ App Writer path |
| **§6A contribution** | Share tạo đúng Owner URL artifact — **không** đủ một mình để Pass §6A (Brief: chỉ Share đúng URL ≠ thành công) |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | Step 1 Discovery ✅ **ACCEPT** · Step 2 Design ✅ **ACCEPT/PASS** [`35`](35-Phase-07-Implementation-Design-Share-Boundary.md) · Step 3 [`36`](36-Phase-07-Step3-Change-List.md) ✅ · Step 4 Verification ✅ **PASS** [`37`](37-Phase-07-Step4-Verification-Audit.md) · Step 5 Acceptance **OPEN** |

---

## Phase 8 — Representation Parse contract — P1

| | |
|--|--|
| **Mục tiêu** | Một Parse contract cho Owner URL shape (R-RES-01 · R-RESP-01) |
| **AC** | Không 8 bản regex độc lập mang Authority |
| **§6A contribution** | Parse Owner URL Representation khi còn đủ để gắn Context lúc **mở / vào** app — phụ thuộc Representation còn tồn tại đến entry |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ☐ |

---

## Phase 9 — Attribution Result boundary — P1

| | |
|--|--|
| **Mục tiêu** | Attribution Result được xác lập theo **Business Rule đã khóa trong SoT**; **không** bị client thay đổi sau khi xác lập; Commission chỉ consume Result (ngoài Identity core) |
| **Neo** | SoT BR-07 · BR-08 · PI-08 · Solution §5.5–5.6 |
| **AC** | Không Commission→Identity/URL; Register không storage Authority; Plan **không** tự khóa thời điểm capture (vd. “chỉ sau Identity Created”) ngoài SoT đã Accept |
| **§6A contribution** | Attribution Result khi Context còn hiệu lực đến thời điểm nghiệp vụ — **không** thay Gate E2E |
| **Code** | Có (phạm vi Attribution boundary; Commission chỉ boundary) — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ☐ |

---

## Phase 10 — SEO boundary verify — P2

| | |
|--|--|
| **Mục tiêu** | Verify prod: canonical/OG = Product URL; sitemap không Owner URL; áp dụng **BD-07** (*Owner URL ≠ SEO Asset*) — chọn cơ chế kỹ thuật SEO (noindex / robots / exclusion…) ở phase này, **không** diễn giải lại Business Decision |
| **Neo** | Audit E.4 · BD-02 · BD-07 · BR-19 · PI-20 |
| **AC** | Evidence crawl/meta/sitemap; SEO Authority = Product URL |
| **Code** | Chỉ nếu cần noindex/robots — nếu có code → **§2 Execution Rule** |
| **Execution** | Docs/verify trước; code path theo Execution Rule nếu mở |
| **Status** | ☐ |

---

## Phase 11 — Semantic migration (optional) — P2

| | |
|--|--|
| **Mục tiêu** | Rename vocabulary/docs/module theo Public Identity / Owner URL (B-SEM-01) — **không** đổi Business meaning |
| **AC** | Không đổi Subject Owner / Lifecycle; migration checklist; không dual name lâu dài |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ☐ |

---

## Phase 12 — Capability rollout (QR · Ads · Deeplink · Notification) — P2

| | |
|--|--|
| **Mục tiêu** | Đóng gap B-CAP-02 theo Phase 1 (1A distribution · 1B Writer/Capture ownership) — consumer Context + Owner URL khi cần distribution (không gắn mã từng page) |
| **AC** | Từng capability: đọc Context · không Authority riêng |
| **§6A contribution** | Kênh distribution / deeplink trong scope Phase 12 đọc Context + Owner URL khi cần — danh mục “môi trường được hỗ trợ” cho Program End-to-End Business Verification Gate do Product khóa riêng · **không** tuyên bố hỗ trợ đầy đủ trước khi Gate PASS |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ☐ |

---

## Phase 13 — Cleanup & regression — P1

| | |
|--|--|
| **Mục tiêu** | Xóa dual Authority path; dead code Exclusion-as-law; regression Guest/Owner/Register/Login/Share/SEO |
| **AC** | Checklist Brief Success §11 (trừ quyền xác nhận §6A E2E — thuộc Program Gate); không residual Affiliate-as-Identity-SoT |
| **Code** | Có — sau Owner mở Step 3 |
| **Execution** | Theo **§2 Execution Rule** (Step 1→5) |
| **Status** | ☐ |

---

# 3A. Program End-to-End Business Verification Gate

*(Brief §6A · §11 · Solution §5.3 Architecture Principle E2E — **không** phải Phase mới · **không** phải capability mới.)*

**Tên đầy đủ:** **Program End-to-End Business Verification Gate**  
*(Cổng xác nhận **hành trình nghiệp vụ** End-to-End — **không** phải cổng kiểm thử kỹ thuật / unit test.)*

### Vai trò

| | |
|--|--|
| **Là gì** | **Điều kiện nghiệm thu nghiệp vụ Program** (Acceptance) — chứng minh Owner Context được bảo toàn End-to-End trên hành trình Business |
| **Không phải** | Phase capability · Phase 7B · thay thế P5–P12 · checklist kỹ thuật đơn lẻ |
| **Quyền xác nhận §6A** | **Chỉ Gate này** được tuyên bố Brief §6A / §11 E2E bullets đã hoàn thành |
| **Pass từng Phase** | **Không** đồng nghĩa Program đã đáp ứng §6A |
| **Final Program PASS** | **Chỉ được ký** sau khi Gate này **PASS** |
| **Kênh phân phối** | **Không** được tuyên bố Facebook / Zalo / QR / Ads / Email / … đã **hỗ trợ đầy đủ** cho đến khi Gate này hoàn tất |

### Hành trình bắt buộc PASS

```text
Owner URL
      │
      ▼
Share
      │
      ▼
Open (Browser / In-App Browser được sản phẩm tuyên bố hỗ trợ)
      │
      ▼
Navigation
      │
      ▼
Register hoặc Login
      │
      ▼
Affiliate Attribution
      │
      ▼
Owner Transition (nếu có — Business Event hợp lệ)
```

| Journey step | Phải PASS |
|--------------|-----------|
| Share | ✅ |
| Open Browser | ✅ |
| Open In-App Browser (trong danh mục **supported**) | ✅ |
| Navigation | ✅ |
| Register | ✅ |
| Login | ✅ |
| Attribution | ✅ |
| Owner Transition (khi có) | ✅ đúng Business Event — không mất Context “oan” trước đó |

Nếu **bất kỳ** bước nào làm mất Owner Context **trước khi** hoàn tất nghiệp vụ phụ thuộc Owner (và chưa có Business Event hợp lệ đổi Context) → **Program chưa được coi là hoàn thành**.

### Quy định khóa (Owner / Reviewer — 2026-07-30)

1. **Final Program PASS** chỉ được ký **sau khi** **Program End-to-End Business Verification Gate** PASS.  
2. **Không** tuyên bố các kênh phân phối (Facebook, Zalo, QR, Ads, Email, và kênh khác trong danh mục Product) đã được **hỗ trợ đầy đủ** cho đến khi Gate này hoàn tất.  
3. Pass từng Phase capability = contribution only — **không** thay Gate.

### Contribution map (slice — không đủ một mình)

| Phase | Đóng góp vào §6A (verify slice) |
|-------|----------------------------------|
| P4 | Lifecycle / transition hợp lệ |
| P5 | Register / Login đọc Identity Context |
| P6 | Navigation / app link preserve |
| P7 | Share artifact đúng Owner URL |
| P8 | Parse khi Representation còn |
| P9 | Attribution khi Context còn |
| P12 | Distribution consumers trong scope |
| P13 | Regression Brief §11 (không thay Gate Business) |
| **Program End-to-End Business Verification Gate** | **Xác nhận §6A hoàn thành** · điều kiện **Final Program PASS** |

### Khi nào chạy

Sau khi các Phase capability liên quan đã có Pass evidence đủ để ghép journey — **trước** ký **Final Program PASS**.

---

# 4. Thứ tự bắt buộc

```text
Phase 0 (Lock Solution/Plan)
    → 1 Boundary Audit (1A Capability · 1B Architecture Ownership · không page)
    → 2 Owner Decisions BD-06 (*Replace Owner Context*) · BD-07 (*Owner URL ≠ SEO Asset*) — **PASS**
    → 3 Product Architecture / ADR Re-baseline (docs · supersede · không code)
    → 4 Lifecycle Authority          ⎫  Authority tạo state
    → 5 Identity Context Projection  ⎬  Projection phản ánh state
    → 6 URL Representation Writer    ⎭  Representation biểu diễn state
    → 7 Share · 8 Parse · 9 Attribution
    → 10 SEO · 11 Semantic · 12 Capability gaps
    → 13 Cleanup
    → **Program End-to-End Business Verification Gate** (Brief §6A — Business Acceptance, không phải Phase)
```

**Dependency P0:** Authority → Projection → Representation.  
**§6A:** Pass từng Phase = contribution only · **Program End-to-End Business Verification Gate** = quyền xác nhận Brief §6A · điều kiện **Final Program PASS**.  
**Cấm tuyên bố kênh phân phối “hỗ trợ đầy đủ”** trước khi Gate PASS.  
**Cấm:** nhảy Phase 4+ trước Phase 0–1; code trước Owner mở **Step 3**; Plan tự đẻ Business Rule ngoài SoT/Brief; bỏ qua **§2 Execution Rule**; Create New file không vượt **§2.1**.

---

# 5. Acceptance Plan (meta)

Plan được coi **PASS vận hành** khi:

1. Owner Accept Plan (Phase 0).  
2. Từng phase có AC · Pass evidence.  
3. Không phase nào sửa Brief/SoT trái E.7.  
4. Implementation chỉ map Solution.  
5. Brief Success Criteria (§11) có checklist regression ở Phase 13.  
6. **Program End-to-End Business Verification Gate PASS** trước khi ký **Final Program PASS** (Brief §6A / §11 E2E).  
7. **Không** tuyên bố kênh phân phối (Facebook, Zalo, QR, Ads, Email, …) đã hỗ trợ đầy đủ cho đến khi Gate đó PASS.

---

# 6. Ký nhận

| Vai trò | Plan | Ngày | Ký |
|---------|------|------|-----|
| Reviewer | ACCEPT / REWORK | | ☐ |
| Owner | **ACCEPT** Plan base | (Phase 0 lịch sử) | ☑ |
| Owner | **ACCEPT** amendment v1.2 (§6A · Program End-to-End Business Verification Gate) | 2026-07-30 | ☑ |
| Owner | **ACCEPT** wording v1.2.1 (tên Gate Business · Final Program PASS · cấm tuyên bố kênh) · Phase 5 **PASS** | 2026-07-30 | ☑ |

**ACCEPT Plan →** được mở Phase 1 — Boundary Audit **1A + 1B** (docs · không page).  
**REWORK →** sửa Plan — không code.

**Amendment v1.2 / v1.2.1 LOCKED:** Phase 5 **PASS** · Phase 6 **PASS** · Phase 7 Step 4 Verification **PASS** · Step 5 Acceptance **OPEN** · Pass Phase ≠ Pass §6A · **Final Program PASS** chỉ sau Program End-to-End Business Verification Gate · **cấm** tuyên bố kênh phân phối “hỗ trợ đầy đủ” trước Gate.  

---

## Changelog v1.1 (Review trước LOCK)

1. NC = **runtime projection** — không gọi “representation” (Representation = Owner/Product URL).  
2. Phase 6 AC: Writer phân biệt Owner URL vs Product URL — **không** prefix toàn cục.  
3. OAuth/payment/callback: chỉ restore **nếu Business Flow yêu cầu** — không biến thành BR từ Plan.  
4. Phase 9: Attribution theo SoT đã khóa — Plan không tự khóa thời điểm capture.  
5. Đổi thứ tự P0: Lifecycle Authority → Identity Context Projection → URL Representation Writer.  
6. Phase 1 → **Capability Boundary Audit**: 3 lớp Core / Product / Distribution·Integration; matrix Role·Reads·Writes·Forbidden; **cấm** audit theo page.  
7. Phase 1 thêm **1B Architecture Ownership Audit**: chuỗi Authority → Context → Writer → Storage; component PNC/AR/cookie/LS/parser — TO-BE vs AS-IS · dual Authority.  
8. Phase 2 **PASS**: BD-06 Replace Owner Context · BD-07 Owner URL ≠ SEO Asset (không khóa noindex trong BD).  
9. Phase 3 → **ADR / Product Architecture Re-baseline**: supersede baseline; Keep/Rewrite/Archive; **AC-8**; ADR Disposition Matrix.  
10. **§2 Execution Rule** bắt buộc mọi phase có Code (Discovery → Design → Implement → Verify → Accept).  
10b. **§2.1 New File Creation Governance** — Modify Existing trước; Create New chỉ khi đủ Discovery + Architecture + Replacement + Verification.  
11. Phase 4 Step 1 Discovery **DONE** (amended BD-08) · Step 2 Design **DRAFT** — [`07-Phase-04-Implementation-Design-Lifecycle-Authority.md`](07-Phase-04-Implementation-Design-Lifecycle-Authority.md).  
12. **BD-08** Authenticated Self precedence; refine BD-06 = Guest replace only.

## Changelog v1.2 (Brief §6A — 2026-07-30)

13. Solution §5.3: Architecture Principle **End-to-End Owner Context Preservation** (không đổi Spine).  
14. Plan **§3A Program End-to-End Business Verification Gate** — Acceptance Program · không Phase mới.  
15. P5/P6/P7/P8/P9/P12/P13: ghi **§6A contribution**; Pass Phase ≠ Pass §6A.  
16. Foundation Gate + Acceptance Plan meta: trace Brief §6A.  
17. **Owner ACCEPT / LOCK** amendment v1.2 — 2026-07-30.

## Changelog v1.2.1 (Reviewer wording — 2026-07-30)

18. Đổi tên Gate → **Program End-to-End Business Verification Gate** (nghiệm thu hành trình nghiệp vụ, không phải kiểm thử kỹ thuật).  
19. **Final Program PASS** chỉ sau Gate Business PASS.  
20. **Cấm** tuyên bố kênh phân phối (Facebook, Zalo, QR, Ads, Email, …) hỗ trợ đầy đủ trước khi Gate hoàn tất.  
21. Phase 5 **Final PASS** · mở Phase 6 Discovery.

---

*Plan map Solution · phục vụ Brief · không đẻ luật mới · Execution Rule · §2.1 New File Governance · §6A = Program End-to-End Business Verification Gate · **LOCKED v1.2.1**.*
