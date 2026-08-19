# BR Checklist — Media Image Platform (Task 04)

| | |
|--|--|
| **Nguồn** | [`01_BRD.md`](01_BRD.md) **LOCKED** — chữ dưới đây **copy từ BRD**, không diễn giải lại |
| **Governance** | Product Backlogs Governance — BR Checklist Backbone + Forward Traceability + A/B/C |
| **Bất biến** | Cấm gộp hàng · cấm đổi meaning · cấm PASS cả BR vì một phần |
| **Status hàng** | điền khi verify: `PASS` · `PARTIAL` · `FAIL` · `NOT EVIDENCED` · `N/A` |

Forward map: Audit `02`/`02b` · SoT `03` · Solution `04` · Plan `05` (cột dưới). Evidence A/B/C: gate phase + Final Verification.

**Không** gộp BR-03 thành “producer-neutral”.

---

# 1. BR-01 — Canonical Media Platform

BRD §3: *“iFlux phải có một canonical Media Image Platform dùng chung… Platform chịu trách nhiệm:”*

| BR | Req ID | Requirement (chữ BRD) | SoT | Solution | Plan phase | Status |
|---|---|---|---|---|---|---|
| BR-01 | BR-01.01 | ingest | §3 | §22–§25 ingest/adapters | P2 · P7 | NOT EVIDENCED |
| BR-01 | BR-01.02 | validate | §3 / security | §29 | P2 | PASS |
| BR-01 | BR-01.03 | normalize | §4 Master | §4 Master | P2 | PASS |
| BR-01 | BR-01.04 | optimize | §27 Format | §4–§5 · profiles | P2 · P3 | PASS |
| BR-01 | BR-01.05 | generate derivatives | §6 Registry | §7–§8 generate | P3 · P5 | PASS |
| BR-01 | BR-01.06 | register metadata | §2 identity | §20 DB | P0 · P1 | NOT EVIDENCED |
| BR-01 | BR-01.07 | resolve delivery | §10 Resolver | §16–§17 | P4 · P8 | PASS |
| BR-01 | BR-01.08 | regenerate | §13 Auto regen | §10–§15 jobs | P5 · P6 | PASS |
| BR-01 | BR-01.09 | lifecycle management | §3 lifecycle | §9 profile · asset status | P1 · P5 · P6 | PASS |
| BR-01 | BR-01.10 | cleanup | §14 Raw | §23–§24 + clock | P5 · P7 · P9 | NOT EVIDENCED |
| BR-01 | BR-01.11 | observability | §36 SoT AC-17 | **§32 metrics khóa** | **P5b implement · P10 verify only** | NOT EVIDENCED |

BR-01 **không** PASS cho đến khi **cả 11** hàng PASS riêng.

---

# 2. BR-02 — RSS Image Optimization

BRD §3: *“RSS image phải được xử lý qua Media Platform thay vì lưu source RSS như permanent delivery asset.”* + lifecycle.

| BR | Req ID | Requirement (chữ BRD) | SoT | Solution | Plan phase | Status |
|---|---|---|---|---|---|---|
| BR-02 | BR-02.00 | RSS image phải được xử lý qua Media Platform thay vì lưu source RSS như permanent delivery asset | §3 · §22 | §22 adapter | P7 | NOT EVIDENCED |
| BR-02 | BR-02.01 | Temporary Raw Input | §3 | §23 raw | P2 · P7 | PASS |
| BR-02 | BR-02.02 | Validate / Detect | §29 | §29 | P2 | NOT EVIDENCED |
| BR-02 | BR-02.03 | Normalize / Optimize | §4 | §4 | P2 | NOT EVIDENCED |
| BR-02 | BR-02.04 | Canonical Media Asset | §2 | §20 | P1 · P2 | NOT EVIDENCED |
| BR-02 | BR-02.05 | Generate Required Derivatives | §6 | §7 · **§30 async** | P3 · **P5 worker** | PASS |
| BR-02 | BR-02.06 | Verify | §3 | VERIFY job | P5 | PASS |
| BR-02 | BR-02.07 | Bind Consumer | §10 | §16 · adapters | P7 · P8 | NOT EVIDENCED |
| BR-02 | BR-02.08 | Raw Cleanup | §14 | §24 24h/7d | P7 clock · P9 | NOT EVIDENCED |

---

# 3. BR-03 — Multiple Image Producers

BRD §3 — **từng hàng, không gộp.**

| BR | Req ID | Requirement (chữ BRD) | SoT | Solution | Plan phase | Status |
|---|---|---|---|---|---|---|
| BR-03 | BR-03.01 | Media Platform không được thiết kế riêng cho RSS | §2 · §32 | §22 · §25–§26 | P7 ingest API | NOT EVIDENCED |
| BR-03 | BR-03.02 | Producer **RSS / News** phải có thể sử dụng cùng canonical media lifecycle | §32 | §22 | P7 RSS adapter | NOT EVIDENCED |
| BR-03 | BR-03.03 | Producer **Admin Upload / Import** phải có thể sử dụng cùng canonical media lifecycle | §32 | §25 | P7 upload + import | NOT EVIDENCED |
| BR-03 | BR-03.04 | Producer **Future Community User Upload** phải có thể sử dụng cùng canonical media lifecycle | §32 | §26 readiness | P7 ingest contract | NOT EVIDENCED |
| BR-03 | BR-03.05 | Community user upload là **future** consumer/producer requirement của platform; implementation cụ thể có thể được thực hiện ở task Community tương ứng | §26 Out of Scope UI | §26 no Community UI | P7: **không** UI; chỉ contract | NOT EVIDENCED |

Shared artifact (một `createAssetFromBuffer` / ingest API) được **reference** trên BR-03.02–.04 — **không** gộp thành một hàng PASS.

BR-03.05 PASS khi: không xây Community upload UI **và** ingest không phụ thuộc RSS (chữ “future… task Community”).

---

# 4. Điều khoản BRD §4–§24 (Req ID từ số mục + bullet BRD)

Không invent requirement. ID = vị trí trong BRD.

| BR | Req ID | Requirement (chữ BRD) | SoT | Solution | Plan | Status |
|---|---|---|---|---|---|---|
| BRD-04 | BRD-04.01 | Mỗi hình ảnh được quản lý phải có một canonical Media Asset identity | §2 | §20 | P0 · P1 | PASS |
| BRD-04 | BRD-04.02 | Master / canonical processing representation (thuộc asset) | §4 | §4–§5 | P2 | PASS |
| BRD-04 | BRD-04.03 | Derivative không được trở thành các asset độc lập không thể truy ngược về Media Asset | §2 | §20 variants | P1 · P3 | PASS |
| BRD-04 | BRD-04.04 | Mỗi derivative xác định được: Media Asset | §2 | `asset_id` | P0 · P1 | PASS |
| BRD-04 | BRD-04.05 | Mỗi derivative xác định được: Image Profile | §6 | `profile_version_id` | P1 · P3 | PASS |
| BRD-04 | BRD-04.06 | Mỗi derivative xác định được: generation state/version | §14 | version + status | P1 · P5 | PASS |
| BRD-04 | BRD-04.07 | Mỗi derivative xác định được: physical representation | §18 | storage_key / url | P2 · P3 | PASS |
| BRD-05 | BRD-05.01 | Hệ thống phải có một Image Profile Registry tập trung | §6 | §6–§8 · bảng profiles | P1 | PASS |
| BRD-05 | BRD-05.02 | Profile mô tả: profile key | §6 | registry | P1 | PASS |
| BRD-05 | BRD-05.03 | Profile mô tả: purpose | §6 | `purpose` | P1 | PASS |
| BRD-05 | BRD-05.04 | Profile mô tả: width | §6 | version.width | P1 | PASS |
| BRD-05 | BRD-05.05 | Profile mô tả: height hoặc max dimension | §6 | height / max_width | P1 | PASS |
| BRD-05 | BRD-05.06 | Profile mô tả: crop mode | §6 | crop | P1 | PASS |
| BRD-05 | BRD-05.07 | Profile mô tả: format | §6 | format | P1 | PASS |
| BRD-05 | BRD-05.08 | Profile mô tả: quality | §6 | quality | P1 | PASS |
| BRD-05 | BRD-05.09 | Profile mô tả: status | §6 | status | P1 · P6 | PASS |
| BRD-05 | BRD-05.10 | Profile mô tả: version nếu cần | §6 | versions table | P1 | PASS |
| BRD-06 | BRD-06.01 | Image Profile phải được quản lý tập trung trong Admin | §24–§25 | §33 | P6 | PASS |
| BRD-06 | BRD-06.02 | Module **Quản lý Thư viện** | §24 | §33 | P6 | PASS |
| BRD-06 | BRD-06.03 | Feature **Quy chuẩn hình ảnh** | §25 | §33 | P6 | PASS |
| BRD-06 | BRD-06.04 | Đặt bên trên module **Quản lý giao diện** | §24 | §33 | P6 | PASS |
| BRD-06 | BRD-06.05 | Danh sách Media Asset/Library **không thuộc implementation hiện tại** | §26 | §33 no listing | P6 | PASS |
| BRD-06 | BRD-06.06 | Admin: **tạo profile** | §13 · AC-19 | §34 `manage` = tạo/sửa/lifecycle/version | **P6 create** | PASS |
| BRD-06 | BRD-06.07 | Admin: **xem profile** | §25 | `media.profile.view` | P6 | PASS |
| BRD-06 | BRD-06.08 | Admin: **thay đổi trạng thái** | §14 lifecycle | DRAFT/ACTIVE/DEPRECATED/RETIRED | P6 | PASS |
| BRD-06 | BRD-06.09 | Admin: **quản lý chuẩn hình ảnh** | §25 | edit spec/version | P6 | PASS |
| BRD-06 | BRD-06.10 | Admin: **kích hoạt profile mới** | §13 | ACTIVE → async jobs | P6 · P5 | PASS |
| BRD-07 | BRD-07.01 | Media Platform phải hỗ trợ regeneration | §13 | §10–§15 | P5 | PASS |
| BRD-07 | BRD-07.02 | Regeneration không được phụ thuộc vào RSS raw source sau khi raw source đã được cleanup | §12 | master-only regen | P2 · P5 | PASS |
| BRD-07 | BRD-07.03 | Nếu nguồn không đủ fidelity: xác định rõ giới hạn, không âm thầm tạo derivative chất lượng thấp | §12 | `REGENERATION_UNAVAILABLE` | P5 | PASS |
| BRD-08 | BRD-08.01 | Profile mới được tạo/activated → identify applicable assets → generate missing → verify → ready (không bắt buộc sync) | §13 | §10 · §30 | P5 · P6 | PASS |
| BRD-09 | BRD-09.01 | Consumer phải yêu cầu image thông qua profile/purpose (không tự xử lý theo module) | §10 | §16 | P4 · P8 | NOT EVIDENCED |
| BRD-10 | BRD-10.01 | Physical filename không phải business contract | §18 | §18 | P4 · P8 | PASS |
| BRD-10 | BRD-10.02 | Existing URL phải được bảo toàn trong migration ở mức cần thiết để không làm mất media reference | §20 | compatibility | P4 · P9 | NOT EVIDENCED |
| BRD-11 | BRD-11.01 | Compact → compact derivative | Audit-03 · §9 | `media-compact` | P8 | NOT EVIDENCED |
| BRD-11 | BRD-11.02 | Card → card derivative | §9 | `media-card` | P8 | NOT EVIDENCED |
| BRD-11 | BRD-11.03 | Hero → hero derivative | §9 | `media-hero` | P8 | NOT EVIDENCED |
| BRD-11 | BRD-11.04 | Detail → detail derivative | §9 · Owner: cùng hero file | `media-hero` alias | P4 · P8 | PASS |
| BRD-11 | BRD-11.05 | OG → social/OG derivative | §9 | `media-og` | P8 | NOT EVIDENCED |
| BRD-11 | BRD-11.06 | Không mặc định một full-size delivery cho mọi context nếu derivative phù hợp đã tồn tại | §10 | resolver | P8 | NOT EVIDENCED |
| BRD-13 | BRD-13.01 | Platform phải có một format strategy thống nhất (không generate mọi format runtime hỗ trợ) | §27 | WebP + JPEG OG, no AVIF seed | P1 · P3 | PASS |
| BRD-14 | BRD-14.01 | Raw RSS = temporary processing input, không phải permanent delivery media | §3 | §23 | P2 · P7 | NOT EVIDENCED |
| BRD-14 | BRD-14.02 | Raw chỉ cleanup sau: decode + canonical + required derivatives + metadata + references + integrity + completed + không còn dependency | §14 | AND-gate | P7 · P9 | NOT EVIDENCED |
| BRD-14 | BRD-14.03 | Nếu fail: DO NOT DELETE RAW; giữ để retry/recovery theo retention | §20 | 7d failure | P7 clock | NOT EVIDENCED |
| BRD-15 | BRD-15.01 | Sau raw cleanup, regeneration dùng canonical representation; không thiết kế regenerate → download lại RSS URL | §12 | master | P5 | PASS |
| BRD-17 | BRD-17.01 | Existing media: Audit → Classification → Dry Run → Completeness → Migration → Verification → Cleanup | § / Solution §35 | P9 | P9 | NOT EVIDENCED |
| BRD-17 | BRD-17.02 | Không bulk delete originals · không copy leftover · không coi DB clone là file · không xóa chỉ vì số lượng | Audit | P9 locks | P9 | NOT EVIDENCED |
| BRD-18 | BRD-18.01 | Xác định được: duplicate · orphan · missing derivative · missing physical file · unused derivative · incomplete asset | §23 usage | jobs/metrics | P5b · P9 | NOT EVIDENCED |
| BRD-18 | BRD-18.02 | Historical missing files 27.632 = preservation/clone gap, không tự động xử lý trong task này | Owner | P9 class G | P9 | NOT EVIDENCED |
| BRD-19 | BRD-19.01 | Retry cùng một source không được tạo vô hạn Asset A / copy / copy 2 | §15 | fingerprint + unique | P2 · P5 | PASS |
| BRD-20 | BRD-20.01 | Xử lý an toàn invalid/corrupted/unsupported/oversized/decoder/conversion/disk/DB/derivative/partial/reference/cleanup failure | §29 | validate + jobs | P2 · P5 | NOT EVIDENCED |
| BRD-20 | BRD-20.02 | Không được: Raw deleted → derivative incomplete | §14 | AND-gate | P7 · P9 | NOT EVIDENCED |
| BRD-21 | BRD-21.01 | Image processing không được biến RSS ingestion hoặc future Community upload thành bottleneck | §30 | **§30 Persist→Queue→Worker** | **P2 persist-only · P5 worker** | PASS |
| BRD-22 | BRD-22.01 | Chống MIME spoof · extension spoof · malicious · bomb · oversized · path traversal · arbitrary write · executable · SSRF | §29 | §29 | P2 | PASS |
| BRD-23 | BRD-23.01 | Quan sát được: received · success/failure · derivative · regeneration · cleanup · retry · latency · storage · derivative count · orphan/incomplete | §32 SoT | **§32 metric names** | **P5b** | NOT EVIDENCED |
| BRD-24 | BRD-24.01 | Admin module **Quản lý Thư viện**; Quy chuẩn là feature nền tảng đầu tiên; danh sách hình ảnh không thuộc task | §24 | §33 | P6 | NOT EVIDENCED |

§12 (audit evidence sizes), §16 (SoT khóa size), §25 In Scope narrative, §26–27 Out of Scope / Non-Goals: **không** thành Req “phải làm” — đã phản ánh ở hàng “không thuộc implementation” / ngoài plan.

---

# 5. AC map (không thay BR hàng)

| AC BRD | Phục vụ Req ID chính |
|---|---|
| AC-01 | BR-02.00 · BR-03.02 |
| AC-02 | BR-03.03 |
| AC-03 | BR-03.04 · BR-03.05 |
| AC-04 | BRD-04.01 |
| AC-05 | BRD-05.01 |
| AC-06 | BRD-09.01 |
| AC-07 | BRD-06.* |
| AC-08 | BRD-08.01 · BRD-06.10 |
| AC-09 | BRD-07.02 |
| AC-10 | BR-01.07 · BRD-09.01 |
| AC-11 | BRD-10.01 |
| AC-12 | BRD-11.02 |
| AC-13 | BRD-11.04 |
| AC-14 | BRD-11.05 |
| AC-15 | BRD-14.02 |
| AC-16 | BRD-14.03 · BRD-20.02 |
| AC-17 | BRD-19.01 |
| AC-18 | BRD-17.01 |
| AC-19 | BRD-10.02 |
| AC-20 | BRD-10.02 |
| AC-21 | BRD-17 · P9 Before+After |
| AC-22 | BRD-11 · P9/P10 delivery measure |

---

# 6. Create-profile authority (không STOP)

| Tầng | Chữ | Conflict? |
|---|---|---|
| BRD §6 | “tạo profile” trong tối thiểu Admin | — |
| SoT §13 | “Khi Admin tạo một profile mới” → job | Không |
| SoT AC-19 | “Admin có thể tạo/sửa/quản lý profile theo RBAC” | Không |
| Solution §34 | `media.profile.manage` = **tạo/sửa/lifecycle/version** | Không |
| Solution initial 5 | Seed registry ban đầu | **Không** xóa create |
| Plan (cũ) | Page chỉ list/status/regen | **Plan gap** — sửa Plan P6, không sửa BRD/SoT/Solution |

**Decision:** không STOP. P6 phải implement create (và edit/lifecycle) đúng `manage`. 5 profile = seed, không phải trần capability.

---

# 7. Luật điền Status

PASS chỉ khi A + B + C (lớp áp dụng) reproduce được.

Cấm: code có = PASS · API 200 = PASS · job table tồn tại = async PASS · log JSON = observability PASS · Plan DONE = BR DONE · “BR-03 có nền” = các hàng BR-03 DONE.
