# BR Coverage Gap Review — trước khi mở L0

**Mục đích:** Rà soát `20 - Master Verification Specification.md` đối chiếu `01 - Business Requirement.md` (§0 BR Checklist Registry + §5–§52), theo đúng yêu cầu Owner: xác nhận đủ ngữ cảnh/mục tiêu trước khi tiến hành L0.
**Kết luận ngắn:** **CHƯA đủ.** Doc 20 có cấu trúc layer rất tốt (L0→L7, Hard Gate, Evidence Standard, Stop-the-Line) nhưng **BR mapping bị sai số** và **thiếu hẳn 1 nhóm BR bị Owner LOCK nặng nhất trong BRD**. Nếu chạy L0 ngay với doc 20 hiện tại, **chính L0-TC-01 (BR completeness) và L0-TC-02 (no BR contradiction) của doc 20 sẽ tự FAIL** — vì mapping BR sai và có BR mồ côi.

---

## 1. Lỗi số BR — mapping trong doc 20 §6 sai lệch registry thật

BRD `01` đã khóa lại số BR ngày 2026-08-09 (header: *"đánh số BR Checklist Registry (§0)"*). Doc 20 (viết sau, 2026-08-11) vẫn dùng một bộ số **cũ/khác**, lệch từ BR-09 trở đi:

| BR # | Doc 20 §6 ghi | BRD §0.1 thực tế (đã khóa) |
|---|---|---|
| BR-09 | "SEO Rule Engine" | **SEO Template Engine** (§13) |
| BR-10 | "Canonical" | **SEO Rule Engine** (+Conflict Resolution) (§14) |
| BR-11 | "Robots" | **Canonical — Automatic** (§15) |
| BR-12 | "Sitemap" | **Canonical Edge Cases** (§16) |
| BR-13 | "OpenGraph" | **Robots — Automatic** (§17) |
| BR-14 | "Twitter/X" | **Sitemap — Automatic** (§18) |
| BR-15 | "Image SEO" | **OpenGraph — Automatic** (§19) |
| BR-16 | "Title Automation" | **Twitter/X — Derived** (§20) |
| BR-17 | "Structured Data" | **Default Image Fallback** (§21) |
| BR-18 | "Slug Governance" | **Image SEO** (§22) |
| BR-19 | "Redirect" | **Description Automation** (§23) |
| BR-20 | "Pagination" | **Title Automation** (§24) |
| BR-21 | "Multi-language" | **Structured Data** (§25) |
| BR-22 | "SEO Preview" | **Breadcrumb** (§26) |
| BR-23 | "SEO Health / Quality Gate" | **Internal Linking** (§27) |
| BR-24 | "SEO SoT" | **Slug & URL** (§28) |
| BR-25+ | "Các BR mở rộng trong registry hiện hành" (bỏ ngỏ) | BR-25…BR-48 + BR-SC có tên/§ rõ ràng, không "mở rộng mơ hồ" |

**Hệ quả:** nếu Test Case Registry (mục 38 doc 20) gắn `BR-x` theo cách hiểu này, toàn bộ report PASS/FAIL sẽ **trỏ nhầm BR** — ví dụ một lỗi Canonical thật ra sẽ bị gắn nhãn "BR-11 Robots" hoặc "BR-10 Canonical" (nhầm cả tên lẫn số) khi báo cáo lên Owner.

**Fix bắt buộc:** đồng bộ lại toàn bộ §6 doc 20 đúng theo BRD §0.1 (37 BR chính + BR-45..48 + BR-SC), dùng đúng tên/số đã khóa — không tự đặt lại số.

---

## 2. Gap nghiêm trọng nhất — BR-45 (SEO ↔ Affiliate/Public Identity Boundary) không có layer riêng

BRD khóa BR-45 (§45, 7 sub-clause 45.1–45.7) là điều khoản bị nhắc **lặp lại nhiều lần nhất trong toàn bộ BRD** — xuất hiện tường minh 5 lần trong Final Owner Mandate (§52), có SC riêng (SC-21…SC-24, §50), có yêu cầu Audit riêng (§41 "SEO vs Affiliate/Public Identity URL Variants — BẮT BUỘC"), và là điều kiện **"Không refactor Affiliate/Public Identity trong Epic SEO"** nếu không chứng minh defect.

Rà doc 20 toàn văn (đọc trực tiếp, không dùng grep vì grep bị lỗi false-negative trên file này — xem Ghi chú kỹ thuật cuối tài liệu): **chỉ có 2 dòng đơn lẻ nhắc tới việc này**, không có layer/section riêng:

- `L5-TC-03 — Canonical` (§27 doc20): *"Không được để: `?ref=` / `?r=` / tracking params / public identity decorator làm canonical."*
- `L5-TC-04 — Robots` (§28 doc20): test items gồm `?ref=`, `publicId path`.

**Thiếu hoàn toàn** so với yêu cầu BRD §45/§41:

| Yêu cầu BRD | Có trong doc 20? |
|---|---|
| §45.4 — Affiliate/Public Identity Resolver phải hoàn tất **trước** SEO redirect/normalize (thứ tự resolution) | ❌ Không có test nào verify thứ tự này |
| §45.6/§41 — URL Variant Matrix đầy đủ: Clean / `/{publicId}/...` / `?ref=` / `?r=` / decorator khác × (Attribution → SEO Eligibility → Canonical → Sitemap Eligibility → Robots) | ❌ Không có ma trận, chỉ có 2 dòng rời rạc |
| §45.3 — publicId/ref **không** vào sitemap | ❌ L5-TC-05 Sitemap không có dòng loại trừ này |
| §45.3 — publicId/ref **không** tạo OG/Structured Data identity riêng | ❌ L5-TC-06/L5-TC-08 không có dòng loại trừ này |
| §45.5 — sau khi resolve, metadata phải theo Clean Public URL (không theo URL mang publicId) | ❌ Không test riêng |
| SC-21…SC-24 (verification index cho §45) | ❌ Không xuất hiện trong "BR Verification Matrix" (mục 40 doc 20) |

**Đây là gap nặng nhất** vì BRD coi đây là **boundary bị khóa** — nếu không test, có nguy cơ Epic SEO âm thầm vi phạm điều khoản quan trọng nhất mà không ai biết cho tới khi Owner tự kiểm tra tay.

**Fix bắt buộc:** thêm 1 layer/section riêng, khuyến nghị `L1-E — SEO/Affiliate Boundary` (ownership/resolution-order, thuộc Architecture) **và** `L5-TC-10 — URL Variant Matrix` (Public surface, đúng như BRD §45.6 yêu cầu) — không gộp chung vào Canonical/Robots như hiện tại.

---

## 3. Gap — 3 điều khoản "Reviewer MUST" khóa cùng ngày 2026-08-09 chưa có test case riêng

BRD header ghi rõ: *"Reviewer MUST: HTTP Status trong SEO Contract (§10); Conflict Resolution giữa SEO signals (§14/§33); Duplicate/Singleton metadata (§38) · LOCKED cùng ngày."* Đây là 3 điều khoản được Reviewer **đặc biệt yêu cầu bổ sung** — mức độ ưu tiên cao nhất trong toàn BRD, nhưng doc 20 chưa có test case tường minh cho cả 3:

| Điều khoản | BR/§ | Doc 20 có test tường minh? |
|---|---|---|
| HTTP Status ↔ robots/canonical/sitemap phải coherent (200/301/302/404/410 policy; cấm ví dụ "404 + index,follow + sitemap eligible") | BR-06.3/06.4, §10.1 | ❌ Không — L3-B/L5-TC-04 không test tổ hợp HTTP status × robots × sitemap |
| Conflict Resolution deterministic giữa HTTP/redirect/canonical/robots/sitemap/OG-URL/SD-URL — trạng thái mâu thuẫn phải bị ngăn hoặc SEO Health ERROR | BR-10.2, §14.1 | ❌ Không |
| Duplicate/Singleton SEO tags (`<title>`, meta description, canonical, og:url/title/description, primary OG image, Twitter primary) trong 1 rendered document phải = SEO Health ERROR | BR-29.3/BR-34.4, §38.1 | ❌ Không — `L1-TC-02 Duplicate implementation` chỉ test duplicate **code/owner**, không test duplicate **rendered tag** trong 1 HTML output — hai lỗi khác nhau |

**Fix bắt buộc:** thêm test case tường minh, khuyến nghị:
- `L2-TC-07 — HTTP↔SEO Coherence` (data/resolver layer, vì đây là resolver phải enforce)
- `L2-TC-08 — Conflict Resolution Matrix` (test các tổ hợp invalid liệt kê tại BRD §14.1: 301+canonical=old, noindex+sitemap-eligible, canonical≠SD-url, redirect≠canonical, 404+index+sitemap)
- `L5-TC-11 — Singleton Tag Audit` (fetch raw HTML, đếm số lần xuất hiện `<title>`, `meta[name=description]`, `link[rel=canonical]`, `og:url`, `og:title`, `og:description` — phải đúng 1)

---

## 4. Gap — BR hoàn toàn không xuất hiện trong doc 20

| BR | Tên | Ghi chú |
|---|---|---|
| BR-23 | Internal Linking (§27) | Không xuất hiện ở bất kỳ layer nào |
| BR-30 | SEO Versioning (§34: history/before/after/user/timestamp/rollback) | Không xuất hiện |
| BR-31 | SEO Source Traceability (§35: Field→Value→Source→Template→Rule→Override→Version→UpdatedAt) | Không xuất hiện (L2-TC-02 SoT chỉ test "competing source", không test traceability record) |
| BR-46 | Compatibility Requirements (§46: không phá Public Identity/Affiliate/Entity Registry/RBAC/Design System/routing) | Không xuất hiện như layer riêng (L7-TC-04 chỉ nói "legacy residue", không named-system compatibility check) |

## 5. Gap — BR có mention nhưng không đủ như BRD yêu cầu

| BR | Thiếu gì so với BRD |
|---|---|
| BR-07 (Coverage) | L3-D/L7-TC-01 thiếu **Tag**, **Collection** — 2/20 entity/URL type liệt kê ở BRD §11 không thấy trong danh sách test |
| BR-13 (Robots) | Không test `robots.txt` file, không test `X-Robots-Tag` HTTP header, không phân biệt Googlebot/Bingbot |
| BR-17 (Default Image Fallback) | Không test đúng thứ tự 3-tier fallback (Entity→Page Default→Global Default) và "no broken/empty image" |
| BR-18 (Image SEO) | Không test width/height/format/aspect-ratio tự động lấy đúng |
| BR-19/BR-20 (Description/Title Automation) | Không test validation rule (quá ngắn/quá dài/duplicate/HTML/quality threshold) và hành vi "SEO Warning" khi không tạo được description chất lượng |
| BR-29 (SEO Health) | Bản thân **feature SEO Health** (trang/API health-check) không được verify tồn tại + hoạt động đúng — chỉ có defect-classification mô tả cách xử lý lỗi, không có test "SEO Health có phát hiện đúng lỗi mẫu không" |
| BR-32 (SEO CMS) | Không test cấu trúc khu Admin > System > SEO Settings có đủ sub-area (Global/Identity/Templates/Rules/DefaultImages/Verification/Sitemap/Robots/Redirects/Audit/Health) |
| BR-33 (SEO Permission) | L1-TC-10 chỉ test authz chung; không test cụ thể catalog `seo.*` permission keys có bị duplicate với permission hiện hữu không |
| BR-35 (Human vs Crawler Consistency) | L5-TC-01/02 test riêng Human HTML và Bot HTML nhưng không có test **diff 2 pipeline** để xác nhận consistency (đúng yêu cầu §39 "không giả định Pipeline A = Pipeline B") |
| BR-48 (NFR) | Consistency/Determinism/Observability/Auditability/Rollback không có test tường minh (đa số phụ thuộc BR-45/30/31 đang thiếu ở trên) |
| BR-SC | Không có bước tổng hợp cuối cùng đối chiếu SC-01…SC-32 (mục 40 doc20 "BR Verification Matrix" chỉ mẫu BR-01..04, không nhắc BR-SC) |

---

## 6. Điểm đã làm tốt (không cần sửa)

- Cấu trúc layer L0→L7, Hard Gate, Stop-the-Line, Evidence Standard, Defect Classification: chất lượng tốt, đúng tinh thần "root cause trước symptom" mà toàn bộ governance repo đang yêu cầu.
- L3-A/B/C/D/E/F bao phủ tốt phần lõi (Global/Page/Article/Entity SEO + URL/Slug/Redirect + Admin UX).
- L4 (Runtime), L6 (NFR core: performance/resilience), L7 (Production regression) — cấu trúc hợp lý, không cần đổi khung.
- Tách riêng L5-TC-01 (Human HTML) và L5-TC-02 (First HTML/Bot) — đúng tinh thần BR-35, chỉ thiếu bước diff giữa 2 kết quả.

---

## 7. Đề xuất xử lý

Không tự sửa doc 20 ngay (đây là tài liệu Owner vừa tạo, đánh dấu AUTHORITATIVE) — cần Owner chốt hướng:

1. **Sửa số BR ở §6** cho khớp BRD §0.1 (bắt buộc, không có phương án khác — đây là lỗi khách quan).
2. **Thêm layer/test case cho BR-45** (khuyến nghị L1-E + L5-TC-10 URL Variant Matrix) — bắt buộc vì đây là boundary khóa cao nhất.
3. **Thêm 3 test case cho "Reviewer MUST" (§10.1/§14.1/§38.1)** — khuyến nghị L2-TC-07, L2-TC-08, L5-TC-11.
4. **Thêm coverage cho BR-23/30/31/46** — tối thiểu ghi nhận layer nào chịu trách nhiệm (có thể gộp vào layer có sẵn, không nhất thiết tạo layer mới).
5. Các gap "nhẹ" ở mục 5 — có thể bổ sung như sub-bullet trong TC hiện có, không cần cấu trúc mới.

Owner chọn: (a) tôi sửa trực tiếp doc 20 theo 5 điểm trên rồi mới mở L0, hay (b) Owner tự sửa/duyệt lại doc 20 trước, hay (c) chấp nhận rủi ro và mở L0 với doc 20 hiện tại (không khuyến nghị, vì L0-TC-01/02 của chính doc 20 sẽ tự FAIL với các gap này).

---

### Ghi chú kỹ thuật

Trong quá trình rà soát, công cụ `grep`/ripgrep báo **false-negative** trên file `20 - Master Verification Specification.md` (không tìm thấy các cụm từ chắc chắn có trong file khi đọc trực tiếp, ví dụ "breadcrumb", "?ref="). Đã chuyển sang đọc trực tiếp toàn văn 1692 dòng để đảm bảo kết luận chính xác — không dựa vào kết quả grep cho file này.
