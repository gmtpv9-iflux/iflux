# Master Verification Specification

## Layered Business Requirement → Test Case → Fix Gate → Production Acceptance

**Document Type:** Master Verification / Test Specification
**Purpose:** Kiểm thử và hoàn thiện toàn bộ Business Requirements theo thứ tự kiến trúc từ cao xuống thấp
**Execution Model:** Test → Evidence → Fix → Retest → PASS → Unlock next layer
**Status:** AUTHORITATIVE
**Implementation Rule:** Không được tự ý bỏ qua tầng hoặc chuyển sang fix tầng thấp khi tầng cao đang FAIL.
**Revision:** v1.1 (2026-08-11) — sửa BR mapping (§6) khớp `01 - Business Requirement.md` §0.1 đã khóa; bổ sung layer/test case cho BR-45 (SEO↔Affiliate boundary) và 3 điều khoản "Reviewer MUST" (HTTP↔SEO coherence, Conflict Resolution, Duplicate/Singleton) bị thiếu ở v1.0. Xem `20a - BR Coverage Gap Review (Pre-L0).md` cho chi tiết gap đã fix.

---

# 1. Mục tiêu

Tài liệu này định nghĩa **một hệ thống kiểm thử phân tầng cho toàn bộ Business Requirements**.

Mục tiêu không phải chỉ là "chạy hết test case".

Mục tiêu là:

1. Xác minh Business Requirement ở đúng tầng.
2. Phát hiện lỗi kiến trúc/foundation trước khi lỗi downstream xuất hiện.
3. Fix lỗi theo thứ tự từ cao xuống thấp.
4. Sau mỗi lần fix phải retest tầng đã sửa.
5. Chỉ khi tầng hiện tại PASS mới được mở khóa tầng tiếp theo.
6. Cho phép các lỗi downstream "trổ ra" sau khi foundation đã đúng.
7. Không patch triệu chứng ở tầng thấp khi nguyên nhân nằm ở tầng cao.
8. Kết thúc bằng Production Acceptance với evidence đầy đủ.

---

# 2. Nguyên tắc kiểm thử bắt buộc

## 2.1. Layered Verification

Không sử dụng một danh sách Test Case phẳng.

Toàn bộ hệ thống được kiểm thử theo chuỗi:

```text
L0 — Business Contract
        ↓
L1 — Architecture / Foundation
        ↓
L2 — Data / Persistence / SoT
        ↓
L3 — Application / Feature
        ↓
L4 — Runtime / Integration
        ↓
L5 — Public / SEO / External Surface
        ↓
L6 — NFR / Performance / Resilience
        ↓
L7 — Production Regression / Acceptance
```

---

## 2.2. Hard Gate

Mỗi layer là một gate.

```text
PASS → mở layer tiếp theo
FAIL → STOP → FIX → RETEST
```

Không được:

```text
L1 FAIL
   ↓
bỏ qua
   ↓
fix L4
   ↓
fix L5
```

Đây là quy trình bị cấm.

---

# 3. Quy tắc xử lý lỗi

Khi một Test Case FAIL:

### Bước 1 — Classify

Xác định lỗi thuộc:

* Business contract
* Architecture
* SoT
* Persistence
* Resolver
* API
* Runtime
* UI
* SEO/public surface
* Performance
* Regression

### Bước 2 — Tìm lowest responsible layer

Không fix ở nơi lỗi biểu hiện nếu nguyên nhân nằm ở layer cao hơn.

Ví dụ:

```text
HTML thiếu SEO title
       ↓
runtime không nhận template
       ↓
resolver không trả effective value
       ↓
SoT sai
```

Không được chỉ hardcode `<title>` trong HTML.

Root cause phải được sửa ở layer sở hữu nó.

### Bước 3 — Fix

Fix đúng owner/SoT.

### Bước 4 — Retest

Retest:

1. Test Case vừa FAIL.
2. Regression của layer.
3. Các invariant của layer.

### Bước 5 — Gate

Chỉ khi toàn bộ mandatory test của layer PASS:

```text
Lx = PASS
```

mới được mở:

```text
Lx+1
```

---

# 4. Evidence Standard

Không chấp nhận kết luận chỉ dựa trên:

* "đã kiểm tra"
* "hoạt động bình thường"
* screenshot UI đơn lẻ
* code nhìn có vẻ đúng
* local test nhưng chưa production verify

Evidence phải ưu tiên:

1. Production API response
2. Database/SoT evidence
3. HTML source
4. DOM/runtime evidence
5. Network request
6. Browser console
7. HTTP headers/status
8. Crawler/bot response
9. Performance measurement
10. Screenshot chỉ dùng làm supplementary evidence

Mỗi PASS phải trả lời được:

```text
What was tested?
Against which BR?
What was expected?
What actually happened?
What is the evidence?
Where is the evidence?
PASS/FAIL?
```

---

# 5. Global Gate Model

| Gate | Layer | Mục đích                           |
| ---- | ----- | ----------------------------------- |
| G0   | L0    | Business contract đúng             |
| G1   | L1    | Architecture/Foundation đúng       |
| G2   | L2    | Data/SoT đúng                      |
| G3   | L3    | Feature behavior đúng              |
| G4   | L4    | Runtime/Integration đúng           |
| G5   | L5    | Public/SEO surface đúng            |
| G6   | L6    | NFR/Performance/Resilience đúng    |
| G7   | L7    | Production regression & acceptance |

---

# 6. L0 — Business Contract Integrity

## Mục tiêu

Đảm bảo Business Requirements không mâu thuẫn, có owner, có SoT và có acceptance criteria rõ ràng trước khi test implementation.

## BR mapping (khớp `01 - Business Requirement.md` §0.1 — đã khóa 2026-08-09)

Áp dụng cho **toàn bộ BR registry**. Bảng dưới đây **PHẢI** dùng đúng số/tên đã khóa ở BRD §0.1 — không tự đặt lại số.

| BR | § BRD | Tên |
|----|-------|-----|
| BR-01 | §5 | Automatic SEO by Default |
| BR-02 | §6 | Field Ownership Classification |
| BR-03 | §7 | Global Website SEO |
| BR-04 | §8 | Website Identity |
| BR-05 | §9 | Favicon / Site Icon |
| BR-06 | §10 | Page SEO Contract (+ HTTP Status / coherent URL policy) |
| BR-07 | §11 | Coverage — Mandatory |
| BR-08 | §12 | Dynamic Entity SEO |
| BR-09 | §13 | SEO Template Engine |
| BR-10 | §14 | SEO Rule Engine (+ Conflict Resolution) |
| BR-11 | §15 | Canonical — Automatic |
| BR-12 | §16 | Canonical Edge Cases |
| BR-13 | §17 | Robots — Automatic |
| BR-14 | §18 | Sitemap — Automatic |
| BR-15 | §19 | OpenGraph — Automatic |
| BR-16 | §20 | Twitter/X — Derived |
| BR-17 | §21 | Default Image Fallback |
| BR-18 | §22 | Image SEO |
| BR-19 | §23 | Description Automation |
| BR-20 | §24 | Title Automation |
| BR-21 | §25 | Structured Data |
| BR-22 | §26 | Breadcrumb |
| BR-23 | §27 | Internal Linking |
| BR-24 | §28 | Slug & URL |
| BR-25 | §29 | Redirect Management |
| BR-26 | §30 | Pagination |
| BR-27 | §31 | Multi-language Readiness |
| BR-28 | §32 | SEO Preview |
| BR-29 | §33 | SEO Health / Quality Gate (+ Conflict/Duplicate ERROR) |
| BR-30 | §34 | SEO Versioning |
| BR-31 | §35 | SEO Source Traceability |
| BR-32 | §36 | SEO CMS |
| BR-33 | §37 | SEO Permission |
| BR-34 | §38 | SEO Source of Truth — Mandatory (+ Singleton metadata §38.1) |
| BR-35 | §39 | Human vs Crawler Consistency |
| BR-36 | §40 | Search Engine / SERP Representation |
| BR-37 | §44 | SEO-ready by Default |
| BR-45 | §45 | SEO vs Affiliate / Public Identity Boundary — **LOCKED** |
| BR-46 | §46 | Compatibility Requirements |
| BR-47 | §47 | Reuse Requirement |
| BR-48 | §48 | Non-Functional Requirements |
| BR-SC | §50 | Success Criteria (verification index, SC-01…SC-32) |

**Lưu ý:** đây là registry authoritative duy nhất. Agent không tự tạo BR mới, không tự đặt lại số, không gộp/bỏ BR nào ở trên khi gắn nhãn Test Case (mục 43).

---

## L0-TC-01 — BR completeness

**Test:**

* Mọi BR đều có ID.
* Mọi BR có business intent.
* Mọi BR có acceptance criteria.
* Mọi BR có owner.
* Mọi BR có SoT.
* Mọi BR có test coverage (map được tới ít nhất 1 layer L1–L7 ở dưới).

**Expected:**

Không có BR "mồ côi" — đặc biệt BR-45/46/47/48/BR-SC không được bỏ ngỏ như một nhóm "mở rộng" chung.

**Gate:** BLOCKING

---

## L0-TC-02 — BR contradiction

Kiểm tra:

* inheritance
* override
* fallback
* precedence
* ownership
* runtime behavior

**Expected:**

Không có hai BR yêu cầu hành vi mâu thuẫn.

**Gate:** BLOCKING

---

## L0-TC-03 — SoT declaration

Mỗi business field phải xác định:

```text
Owner
↓
Persistence
↓
Resolver
↓
Runtime consumer
↓
Public output
```

**Expected:** Single authoritative source.

---

## L0-TC-04 — Acceptance criteria completeness

Mỗi BR phải có:

```text
Given
When
Then
Evidence
```

---

## L0 Exit Gate

```text
ALL BUSINESS CONTRACTS VALID
ALL BRs MAPPED (BR-01..BR-37, BR-45..BR-48, BR-SC)
ALL SoTs DECLARED
NO CONTRADICTION
NO ORPHAN BR
```

→ Unlock L1.

---

# 7. L1 — Architecture / Foundation

## Mục tiêu

Xác minh nền tảng trước khi kiểm thử feature.

Đây là layer quan trọng nhất về thứ tự.

Nếu L1 FAIL, **không được chạy fix downstream theo kiểu symptom patch**.

---

## L1-A — Ownership

### L1-TC-01 — Single Owner

Kiểm tra:

* component
* metadata
* shell
* runtime
* SEO
* navigation
* sidebar
* API contract

**Expected:**

Một capability chỉ có một canonical owner.

---

## L1-TC-02 — Duplicate implementation detection

Search:

* duplicate DOM
* duplicate JS
* duplicate CSS
* duplicate bootstrap
* duplicate resolver
* duplicate API logic
* legacy implementation

**Expected:**

Legacy residue không được hoạt động như một owner thứ hai.

**Ghi chú:** đây là duplicate ở tầng **code/owner** (ai sinh ra metadata). Duplicate ở tầng **rendered output** (bao nhiêu `<title>` xuất hiện trong 1 HTML) là một lỗi khác, xem L5-TC-11 (§38.1).

---

# 8. L1-B — App Shell

Áp dụng cho AppShell requirements.

### L1-TC-03 — Canonical AppShell

Verify:

```text
Page
 ↓
AppShell
 ↓
Section
 ↓
Widget Host
```

**Expected:**

Page không tự tạo AppShell clone.

---

### L1-TC-04 — Header ownership

Verify:

* topnav
* brand/logo
* navigation
* header runtime
* header state

**Expected:**

Một canonical header owner.

---

### L1-TC-05 — Persistent shell behavior

MPA architecture vẫn phải bảo đảm:

* shell contract nhất quán
* không có duplicate shell implementation
* navigation không tạo legacy header song song
* shell state không bị page-owned implementation override ngoài contract

---

### L1-TC-06 — Sidebar ownership

Verify:

* Left Sidebar
* Right Sidebar
* Section registration
* page-owned sidebar
* canonical `ensureSections`

**Expected:**

Không có page/widget tự bypass canonical section API nếu capability thuộc AppShell.

---

# 9. L1-C — Runtime Foundation

### L1-TC-07 — Bootstrap ownership

Verify:

* bootShell
* bootPage
* page runtime
* shell runtime

**Expected:**

Mỗi runtime có owner rõ ràng.

---

### L1-TC-08 — SHELL_ONLY pages

Đối với các page:

* account
* checkout
* comments
* write
* share
* stockComment

Verify contract:

```text
SHELL_ONLY
```

không bị đánh đồng với page runtime đầy đủ.

---

# 10. L1-D — API / Security Foundation

### L1-TC-09 — API contract

Verify:

* route
* method
* auth
* response contract
* error contract

---

### L1-TC-10 — Authorization boundary

Verify:

* JWT
* RBAC
* server enforcement
* permission catalog

**Expected:**

Không tin client-side permission như security boundary.

---

# 11. L1-E — SEO / Affiliate-Public Identity Boundary Ownership (BR-45)

**Mục tiêu:** BR-45 là boundary bị Owner khóa nặng nhất trong toàn BRD (nhắc lại 5 lần ở Final Owner Mandate §52). Đây là kiểm tra **kiến trúc/thứ tự resolution**, trước khi test hành vi public surface (L5-TC-10).

### L1-TC-11 — Resolution order (BR-45.4)

Verify thứ tự xử lý request thực tế trong code (router/middleware/resolver), không chỉ đọc doc:

```text
Request (có thể có publicId / ?ref= / ?r= / decorator)
        ↓
Affiliate / Public Identity Resolver
  (capture attribution + resolve identity — KHÔNG bị SEO preempt)
        ↓
Content / Entity resolved
        ↓
SEO Contract resolve theo Clean Public URL
```

**Expected:**

* SEO layer (canonical/robots/redirect/normalize) **không** chạy trước hoặc thay thế Affiliate/Public Identity Resolver.
* SEO layer không xóa/làm mất `publicId`, referral context, attribution cookie/context.

**Gate:** BLOCKING (S2/S4 Stop-the-Line nếu FAIL — xem §41 mục Stop-the-Line).

---

### L1-TC-12 — Ownership separation

Verify:

* SEO Platform ownership (canonical/robots/sitemap/OG/SD cho Clean Public URL) và Affiliate/Public Identity ownership (attribution/context/navigation cho publicId/ref URL) là **hai owner khác nhau**, không lẫn code.
* SEO Platform **không** chiếm sửa Affiliate/Public Identity resolver (BR-47/§45.7) trừ khi có defect SEO-boundary + Owner approve.

**Expected:** không tìm thấy code SEO tự ý redirect/normalize URL mang `publicId`/`?ref=`/`?r=` trước khi Affiliate resolver chạy.

---

# 12. L1 Exit Gate

Không mở L2 nếu còn:

* duplicate owner
* architecture bypass
* broken ownership
* broken shell contract
* security boundary failure
* broken foundational runtime
* unresolved canonical/legacy conflict
* **SEO preempt Affiliate/Public Identity resolution (BR-45.4) — L1-TC-11 FAIL**

---

# 13. L2 — Data / Persistence / SoT

## Mục tiêu

Xác minh dữ liệu trước khi kiểm thử UI.

---

## L2-TC-01 — Persistence

Verify:

```text
Admin input
 ↓
Validation
 ↓
DB persistence
 ↓
Read-back
```

Expected:

Giá trị được lưu đúng và đọc lại đúng.

---

## L2-TC-02 — SoT

Verify từng field:

```text
Global
Page
Article
Entity
Runtime
```

Expected:

Không có competing source.

---

## L2-TC-03 — Effective resolver

Resolver precedence phải được xác minh.

Ví dụ:

```text
Article
  >
Page
  >
Global
  >
Fallback
```

Test:

1. chỉ Global
2. Global + Page
3. Global + Page + Article
4. override
5. unset
6. fallback

---

## L2-TC-04 — Template persistence

Verify dynamic template (BR-09):

```text
Admin saved template
        ↓
DB
        ↓
effective resolver
        ↓
runtime
```

Không được để bootstrap JS phá template trước khi resolver xử lý.

---

## L2-TC-05 — Default / fallback

Verify:

* unset
* empty
* invalid
* inherited
* override
* fallback

---

## L2-TC-06 — Asset model (BR-17)

Verify:

* GLOBAL asset
* PAGE asset
* OG image
* OG image ALT
* social metadata
* **thứ tự fallback chain đúng: Entity Image → Page Default Image → Global Default OG Image (§21)**
* không để broken image / empty image / invalid image URL ở bất kỳ bước fallback nào

Expected:

Không hardcode asset ngoài SoT.

---

## L2-TC-07 — HTTP ↔ SEO Coherence (BR-06.3/06.4, §10.1 — Reviewer MUST)

Verify resolver trả **cùng lúc** HTTP status và SEO metadata coherent cho từng URL state:

| HTTP Status | Robots kỳ vọng | Sitemap eligibility kỳ vọng |
|---|---|---|
| 200 | theo rule engine (index/noindex) | theo rule engine |
| 301/302 | redirect policy — không tự index nguồn | không đưa URL nguồn vào sitemap |
| 404 | not indexable (`noindex`) | not eligible |
| 410 | not indexable (`noindex`) | not eligible |

**Test case invalid MUST bị resolver chặn hoặc surfaced SEO Health ERROR:**

* HTTP 404 + `index,follow` + sitemap eligible
* HTTP 410 + indexable / sitemap eligible
* HTTP 301/302 + canonical/sitemap/OG/SD vẫn giữ identity URL nguồn như trang độc lập

**Gate:** BLOCKING (đây là 1 trong 3 điều khoản "Reviewer MUST" khóa cùng ngày 2026-08-09 với BRD).

---

## L2-TC-08 — Conflict Resolution Matrix (BR-10.2, §14.1 — Reviewer MUST)

Verify SEO Platform có **deterministic conflict-resolution policy** cho tổ hợp:

```text
HTTP status × redirect × canonical × robots/indexability × sitemap eligibility × OG URL × structured-data URL × internal SEO target
```

**Test tối thiểu các tổ hợp invalid liệt kê tại BRD §14.1 — phải bị resolver ngăn hoặc surfaced SEO Health ERROR, không được "im lặng":**

* HTTP 301 + canonical = old URL + sitemap = old URL
* `noindex` + sitemap eligible
* canonical = A + structured-data url = B
* redirect → B + canonical → C
* HTTP 404 + `index,follow` + sitemap eligible

**Expected:** resolver có bảng ưu tiên rõ ràng (không để mỗi layer/page tự suy đoán), evidence là response API/resolver output, không phải chỉ đọc code.

**Gate:** BLOCKING (2/3 điều khoản "Reviewer MUST").

---

## L2-TC-09 — SEO Source Traceability (BR-31, §35)

Mỗi resolved field phải truy nguyên được record:

```text
Field
Value
Source (SEO_TEMPLATE / MANUAL_OVERRIDE / GLOBAL_DEFAULT / …)
Template
Rule
Override (YES/NO)
Version
Updated At
```

**Expected:** với tối thiểu SEO Title, Meta Description, Canonical, Robots, OG Image — resolver/API trả được đủ record trên, không chỉ trả giá trị cuối cùng "trắng" (không rõ nguồn).

**Test:** lấy 1 field manual override, 1 field auto-resolve từ template, 1 field fallback — xác nhận `source` khác nhau đúng.

---

## L2-TC-10 — SEO Versioning & Rollback (BR-30, §34)

Verify history cho: Title, Description, Canonical, Robots, OG, Structured Data, Template, Rule.

**Test:**

1. Thay đổi 1 field → có record before/after/user/timestamp/version.
2. Rollback về version trước → giá trị effective quay lại đúng version cũ.
3. History không bị mất khi field bị override nhiều lần liên tiếp.

---

# 14. L2 Exit Gate

PASS khi:

```text
Persistence PASS
SoT PASS
Resolver PASS
Precedence PASS
Fallback PASS
Template PASS
Asset model PASS
HTTP↔SEO Coherence PASS      (L2-TC-07 — Reviewer MUST)
Conflict Resolution PASS      (L2-TC-08 — Reviewer MUST)
Source Traceability PASS      (L2-TC-09)
Versioning/Rollback PASS      (L2-TC-10)
```

---

# 15. L3 — Application / Feature Behavior

## Mục tiêu

Chỉ bắt đầu test feature sau khi foundation và data layer PASS.

---

# 16. L3-A — Global SEO

Mapping:

* BR-03
* BR-04
* BR-05

### Test Cases

* Website name
* Website description
* Default SEO title
* Default meta description
* favicon (đầy đủ chain: favicon.ico, PNG, `link rel=icon`, Apple Touch, Manifest — BR-05.1)
* default OG image
* default OG image ALT
* inheritance

Expected:

Global setting được sử dụng đúng khi page-level setting không override.

---

# 17. L3-B — Page SEO

Mapping:

* BR-06
* BR-07
* BR-08
* BR-09

Test:

* page config
* title — validate empty / duplicate / quá dài / quá ngắn / invalid characters (BR-20)
* description — validate empty / quá ngắn / quá dài / duplicate / HTML / quality threshold; nếu không tạo được description chất lượng → phải có **SEO Warning**, không âm thầm sinh nội dung rác (BR-19)
* canonical
* robots
* OG
* Twitter
* templates
* token resolution
* fallback

---

# 18. L3-C — Article SEO

Test:

* article title
* article description
* article SEO override
* OG image
* OG image ALT
* canonical
* structured data
* slug
* author/category/topic
* publication metadata

---

# 19. L3-D — Entity SEO

Test toàn bộ entity surfaces (BR-07 — Coverage, đủ theo §11):

* stock
* sector
* ecosystem
* story
* author
* category
* topic
* **tag** (BR-07.TAG)
* **collection** (BR-07.COLL)

Mỗi entity phải verify:

```text
Persistence
 ↓
Resolver
 ↓
HTML
 ↓
Canonical
 ↓
Robots
 ↓
OG
 ↓
Structured Data
```

---

# 20. L3-E — URL / Slug / Redirect

Mapping:

* BR-24
* BR-25
* BR-26
* BR-27

Test:

* clean URL
* slug uniqueness
* slug normalize (lowercase / whitespace / Unicode / special characters / reserved words / collision — BR-24)
* slug change → 301 → new canonical
* redirect (301/302/410) — không tạo redirect loop, redirect chain, canonical/redirect conflict (BR-25)
* old URL
* pagination (`?page=2/3`): title/description/canonical/robots/sitemap eligibility/internal linking đều phải resolve riêng theo policy loại collection, không dùng 1 rule chung cho mọi collection (BR-26)
* language variant
* canonical

---

# 21. L3-F — Admin UX / SEO CMS / Permission / Health

Mapping:

* BR-28 (SEO Preview)
* BR-29 (SEO Health / Quality Gate)
* BR-32 (SEO CMS)
* BR-33 (SEO Permission)

Verify:

* field visibility
* field ownership
* inherited state
* fallback indicator
* **SEO Preview dùng cùng metadata resolution engine với production — không phải logic riêng (BR-28)**
* validation
* save
* read-back
* error handling
* **cấu trúc SEO CMS**: khu vực Admin quản lý Global SEO / Website Identity / Templates / Rules / Default Images / Verification / Sitemap / Robots / Redirects / SEO Audit / SEO Health tồn tại và hoạt động (BR-32)
* **SEO Health feature thật sự phát hiện đúng lỗi mẫu**: Missing Title, Missing Description, Duplicate Title, Duplicate Description, Missing Canonical, Broken Canonical, Missing OG, Broken OG Image, Invalid Structured Data, Orphan Page, Redirect Loop/Chain, Conflicting SEO signals, Duplicate singleton tags — phân loại đúng ERROR/WARNING/INFO (BR-29)
* **SEO Permission catalog** (`seo.view`, `seo.edit`, `seo.publish`, `seo.settings.manage`, `seo.redirect.manage`, `seo.robots.manage`, `seo.sitemap.manage`, `seo.audit.view`, `seo.version.rollback`) không duplicate permission key hiện hữu (BR-33)

UI chỉ PASS khi behavior phía dưới đã PASS.

---

# 22. L3-G — Internal Linking (BR-23)

Mapping: BR-23 (§27)

Verify:

* internal link được sinh dựa trên entity identity (ví dụ `VCB → /co-phieu/vcb`, `Ngân hàng → Sector`)
* không tạo link tới private entity / draft / noindex entity / invalid URL

**Expected:** internal linking foundation tồn tại và không trỏ tới nội dung không nên index.

---

# 23. L3 Exit Gate

Mọi mandatory business flow phải PASS.

Không chấp nhận:

```text
UI looks correct
```

nếu:

```text
API/SoT/Resolver FAIL
```

---

# 24. L4 — Runtime / Integration

## Mục tiêu

Xác minh toàn bộ chain chạy đúng trong browser và production runtime.

---

## L4-TC-01 — API → Runtime

Verify:

```text
API response
 ↓
bootstrap
 ↓
resolver
 ↓
DOM
```

---

## L4-TC-02 — Runtime token resolution

Test:

* literal text
* template token
* multiple tokens
* missing token
* unknown token
* fallback

---

## L4-TC-03 — Navigation

Verify:

* first load
* second page
* cross-page navigation
* shell
* header
* sidebar
* runtime state

---

## L4-TC-04 — Duplicate request

Network audit:

* duplicate API
* duplicate bootstrap
* duplicate metadata fetch
* duplicate asset load

Expected:

Không có request dư thừa do competing owners.

---

## L4-TC-05 — Error handling

Test:

* API 4xx
* API 5xx
* timeout
* empty response
* malformed response
* missing config

Expected:

Runtime degrade đúng contract, không crash toàn page.

---

# 25. L4 Exit Gate

PASS khi:

```text
Runtime PASS
Integration PASS
Navigation PASS
Network PASS
Error handling PASS
No duplicate owner execution
```

---

# 26. L5 — Public / SEO / External Surface

## Mục tiêu

Đây là lớp đặc biệt quan trọng vì UI PASS không chứng minh crawler PASS.

---

# 27. L5-TC-01 — Human HTML

Fetch production HTML.

Verify:

* `<title>`
* meta description
* canonical
* robots
* OG
* Twitter
* favicon
* structured data

---

# 28. L5-TC-02 — First HTML / Bot

Không chỉ kiểm tra DOM sau JS.

Phải kiểm tra:

```text
raw response HTML
```

và xác minh metadata có trong first HTML khi BR yêu cầu.

Đặc biệt với:

* stock
* sector
* ecosystem
* story
* article
* author
* category
* topic

---

# 29. L5-TC-03 — Canonical

Verify:

```text
clean canonical
```

Không được để:

```text
?ref=
?r=
tracking params
public identity decorator
```

làm canonical.

---

# 30. L5-TC-04 — Robots

Test:

* indexable page
* noindex page
* `?ref=`
* publicId path
* private surface
* admin
* checkout
* account
* `robots.txt` — tồn tại, syntax hợp lệ, không block nhầm URL cần index
* `X-Robots-Tag` HTTP header — test cho URL type cần noindex qua header (không chỉ meta tag)
* Googlebot / Bingbot — không giả định 1 policy cho mọi bot nếu BR yêu cầu khác nhau

---

# 31. L5-TC-05 — Sitemap

Verify:

* sitemap exists
* valid XML
* correct URLs
* no invalid URL
* no duplicate URL
* new content enters automatically
* indexability consistent
* **`/{publicId}/...`, `?ref=`, `?r=` KHÔNG xuất hiện trong sitemap (BR-45.3)**

---

# 32. L5-TC-06 — OpenGraph

Verify:

* og:title
* og:description
* og:url
* og:type
* og:image
* og:image:alt
* **`og:url` luôn là Clean Public URL, không bao giờ mang `publicId`/`?ref=`/`?r=` (BR-45.5)**

---

# 33. L5-TC-07 — Twitter/X

Verify corresponding metadata and fallback behavior.

---

# 34. L5-TC-08 — Structured Data

Verify:

* schema type
* required properties
* URL
* name
* image
* author
* date
* breadcrumb where applicable — **breadcrumb UI và breadcrumb JSON-LD phải dùng cùng resolved hierarchy (BR-22, §26)**
* **structured-data URL (`@id`/`url`/`mainEntityOfPage`) luôn là Clean Public URL, không mang `publicId`/referral (BR-45.5)**

---

# 35. L5-TC-09 — Google-facing verification

Production verification:

* Search Console
* sitemap status
* URL inspection where required
* rendered/indexable HTML
* crawlability

Google indexing itself is not treated as the only correctness signal; source/runtime evidence remains authoritative for implementation correctness.

---

# 36. L5-TC-10 — URL Variant Matrix (BR-45, §45.6/§41 — Mandatory)

**Đây là test bắt buộc riêng cho boundary SEO ↔ Affiliate/Public Identity — không được gộp chung vào Canonical/Robots/Sitemap ở trên.**

Với tối thiểu 1 content mẫu (ví dụ 1 bài viết Community), test đủ ma trận:

| URL Variant | Attribution Behavior | SEO Eligibility | Canonical | Sitemap Eligibility | Robots |
|---|---|---|---|---|---|
| Clean Public URL | N/A | Eligible (theo rule engine) | = chính nó | Eligible nếu policy cho phép | theo rule engine |
| `/{publicId}/...` | Phải resolve attribution đúng | KHÔNG eligible riêng | Trỏ về Clean Public URL | KHÔNG eligible | `noindex` nếu crawler truy cập được |
| `?ref=...` | Phải giữ attribution/context | KHÔNG eligible riêng | Trỏ về Clean Public URL | KHÔNG eligible | `noindex` nếu crawler truy cập được |
| `?r=...` | Phải giữ attribution/context | KHÔNG eligible riêng | Trỏ về Clean Public URL | KHÔNG eligible | `noindex` nếu crawler truy cập được |
| decorator khác (nếu có trên Production) | Phải giữ attribution/context | KHÔNG eligible riêng | Trỏ về Clean Public URL | KHÔNG eligible | `noindex` nếu crawler truy cập được |

**Evidence bắt buộc:** curl/response thật cho từng variant (không chỉ đọc code) — HTTP status, `<link rel=canonical>`, `og:url`, structured-data URL, `X-Robots-Tag`/meta robots, có/không có trong sitemap.

**Gate:** BLOCKING (đây là boundary bị Owner khóa — §45, SC-21…SC-24).

---

# 37. L5-TC-11 — Singleton Tag Audit (§38.1 — Reviewer MUST)

Fetch raw rendered HTML production cho mỗi page type (Home, Article, Stock, Sector, Community…), đếm số lần xuất hiện:

```text
<title>                  → phải = 1
meta[name=description]   → phải = 1
link[rel=canonical]      → phải = 1
meta[property=og:url]    → phải = 1
meta[property=og:title]  → phải = 1
meta[property=og:description] → phải = 1
primary OG image         → governed (không mâu thuẫn)
Twitter primary fields   → governed (không mâu thuẫn)
```

**Expected:** không có trường hợp 2 `<title>` hoặc 2 `<meta name="description">` cùng render trong 1 document (rủi ro thực tế do nhiều pipeline HTML + JS + SPA + Node + Nginx cùng ghi).

**Nếu FAIL:** SEO Health = ERROR (nếu ảnh hưởng correctness), classify theo §41 Defect Classification, tìm layer chịu trách nhiệm (thường là L1-TC-02 code-level, không phải patch bằng cách xoá DOM node ở HTML).

**Gate:** BLOCKING (3/3 điều khoản "Reviewer MUST").

---

# 38. L5-TC-12 — Human vs Crawler Consistency Diff (BR-35, §39)

So sánh trực tiếp kết quả L5-TC-01 (Human HTML) và L5-TC-02 (First HTML/Bot) cho **cùng URL**:

* title, description, canonical, robots, OG, Twitter, structured data phải khớp giữa 2 pipeline (trừ khác biệt được BR cho phép, ví dụ nội dung progressive-enhance)
* Không giả định Pipeline A (Bot/OG) = Pipeline B (SPA/Human) chỉ vì cả hai đều "PASS" riêng lẻ ở L5-TC-01/02.

**Expected:** liệt kê rõ field nào khác nhau (nếu có) và lý do được BR cho phép hay không.

---

# 39. L5 Exit Gate

Không PASS nếu:

* first HTML thiếu required metadata
* canonical sai
* robots sai
* sitemap sai
* OG sai
* structured data sai
* public/private indexing boundary sai
* **URL Variant Matrix (L5-TC-10) FAIL — publicId/ref trở thành SEO identity**
* **Singleton Tag Audit (L5-TC-11) FAIL — duplicate rendered tag**
* **Human vs Crawler diff (L5-TC-12) FAIL không giải thích được**

---

# 40. L6 — NFR / Performance / Resilience

Chỉ test sau khi functional correctness đã PASS.

---

## L6-TC-01 — Initial load

Measure:

* TTFB
* FCP
* LCP
* JS execution
* total request count
* transfer size

---

## L6-TC-02 — Navigation cost

Verify:

* repeated shell loading
* repeated JS
* repeated CSS
* repeated API
* duplicate metadata fetch

---

## L6-TC-03 — AppShell efficiency

Verify:

* header implementation count
* header network cost
* shell bootstrap cost
* repeated shell initialization

---

## L6-TC-04 — SEO runtime cost

Verify metadata resolution không tạo:

* blocking request không cần thiết
* duplicate API
* unnecessary client-side work

---

## L6-TC-05 — Failure resilience

Test:

* API unavailable
* cache miss
* stale cache
* slow API
* partial response
* retry

---

## L6-TC-06 — Consistency & Determinism (BR-48.CONSIST/DETERM)

Test:

* Cùng URL gọi lại nhiều lần (cùng data state) → cùng SEO metadata (determinism).
* Clean URL và các Affiliate/publicId variant của cùng content → resolve về cùng 1 Clean canonical, không tạo SEO identity thứ hai (consistency, phụ thuộc L5-TC-10 PASS).

---

## L6-TC-07 — Observability (BR-48.OBS)

Verify truy được đủ chuỗi:

```text
URL → Page Type → Entity → Template → Rule → Resolved Metadata → Renderer
```

và với Affiliate/Public Identity variant:

```text
Request URL Variant → Attribution resolved? → Clean Public URL → SEO Contract
```

(dựa trên evidence của L2-TC-09 Source Traceability + L5-TC-10 URL Variant Matrix).

---

## L6 Exit Gate

Performance phải đạt NFR đã được BR/plan định nghĩa.

Không dùng "nhanh hơn trước" làm acceptance criterion nếu chưa có threshold.

---

# 41. L7 — Production Regression & Acceptance

Đây là tầng cuối.

---

## L7-TC-01 — Full smoke

Test toàn bộ critical surfaces:

```text
Home
Market
Money Flow
Community
Membership
FAQ
Article
Stock
Sector
Ecosystem
Story
Author
Tag
Collection
Search/Listing
Account
Checkout
Write
Comments
Share
Admin
```

---

## L7-TC-02 — Cross-feature regression

Verify:

```text
Admin change
 ↓
DB
 ↓
Resolver
 ↓
Runtime
 ↓
HTML
 ↓
SEO
 ↓
Sitemap / public surface
```

---

## L7-TC-03 — Production regression

Sau mỗi deployment:

1. Smoke
2. Critical API
3. Critical HTML
4. SEO
5. Authentication
6. Navigation
7. Performance sanity

---

## L7-TC-04 — No regression from legacy migration + Compatibility (BR-46)

Search lại:

* old owner
* duplicate implementation
* old HTML
* old JS
* old API call
* old hardcoded metadata
* legacy shell

Expected:

Legacy residue không còn functional authority.

**Compatibility check tường minh (BR-46, §46) — verify SEO implementation KHÔNG phá:**

* Public Identity resolution
* Affiliate Referral / attribution capture
* Clean Canonical URL policy
* Community Article architecture
* Entity Registry
* RBAC
* Design System (không tạo class/CSS/token ngoài DS)
* Existing routing
* Existing product architecture

---

# 42. Final Acceptance Gate

Chỉ được kết luận:

```text
RELEASE ACCEPTED
```

khi:

```text
L0 PASS
AND
L1 PASS
AND
L2 PASS
AND
L3 PASS
AND
L4 PASS
AND
L5 PASS
AND
L6 PASS
AND
L7 PASS
```

---

# 43. Master Test Case Registry

Agent phải duy trì registry theo format:

| ID        | Layer | BR   | Test            | Expected  | Evidence       | Status | Blocking    |
| --------- | ----- | ---- | --------------- | --------- | -------------- | ------ | ----------- |
| TC-L0-001 | L0    | BR-x | BR completeness | Complete  | BR registry    |        | YES         |
| TC-L1-001 | L1    | BR-x | Single owner    | One owner | Code/runtime   |        | YES         |
| TC-L1-002 | L1    | BR-x | Duplicate owner | None      | Search/runtime |        | YES         |
| TC-L1-011 | L1    | BR-45 | Resolution order | Affiliate before SEO | Code/runtime | | YES |
| TC-L2-001 | L2    | BR-x | Persistence     | Correct   | DB/API         |        | YES         |
| TC-L2-002 | L2    | BR-x | Resolver        | Correct   | API            |        | YES         |
| TC-L2-007 | L2    | BR-06 | HTTP↔SEO coherence | Correct | API/resolver | | YES |
| TC-L2-008 | L2    | BR-10 | Conflict resolution | Deterministic | API/resolver | | YES |
| TC-L3-001 | L3    | BR-x | Feature flow    | PASS      | UI/API         |        | YES         |
| TC-L4-001 | L4    | BR-x | Runtime         | PASS      | DOM/network    |        | YES         |
| TC-L5-001 | L5    | BR-x | First HTML      | Correct   | curl/source    |        | YES         |
| TC-L5-002 | L5    | BR-x | Canonical       | Correct   | HTML           |        | YES         |
| TC-L5-010 | L5    | BR-45 | URL Variant Matrix | Clean URL only = SEO identity | curl/source | | YES |
| TC-L5-011 | L5    | BR-34 | Singleton tag audit | Exactly 1 per tag | curl/source | | YES |
| TC-L6-001 | L6    | BR-x | Performance     | Threshold | Measurement    |        | CONDITIONAL |
| TC-L7-001 | L7    | BR-x | Regression      | PASS      | Production     |        | YES         |

**ID/BR trong bảng trên phải dùng đúng số ở §6 (v1.1) — không dùng lại numbering cũ của v1.0.**

---

# 44. BR → Layer Mapping Rule

Một BR có thể xuất hiện ở nhiều layer.

Ví dụ:

```text
BR-09 SEO Template Engine
```

không chỉ có một test.

Nó phải được verify xuyên tầng:

```text
L0
  BR definition valid

L1
  template ownership valid

L2
  template persistence + resolver valid (L2-TC-04)

L3
  admin behavior valid (L3-B)

L4
  runtime token application valid (L4-TC-02)

L5
  rendered HTML valid

L6
  resolution does not create unacceptable cost

L7
  production regression PASS
```

Ví dụ khác — **BR-45 xuyên tầng:**

```text
L0   BR-45 definition + SC-21..24 valid, không mồ côi
L1   L1-TC-11/12 — resolution order + ownership separation
L5   L5-TC-10 — URL Variant Matrix
L6   L6-TC-06 — consistency (variant → cùng canonical)
L7   L7-TC-04 — compatibility, không phá Affiliate architecture
```

Do đó:

> **BR coverage ≠ một Test Case.**

Một BR chỉ được coi là VERIFIED khi toàn bộ mandatory layer của BR đó PASS.

---

# 45. BR Verification Matrix

Agent phải lập matrix cuối cùng theo format, **bao gồm cả BR-45..48 và BR-SC** (không được bỏ ngỏ):

| BR    | L0   | L1   | L2   | L3   | L4   | L5   | L6   | L7   | Overall  |
| ----- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | -------- |
| BR-01 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | VERIFIED |
| BR-02 | PASS | PASS | PASS | PASS | PASS | N/A  | N/A  | PASS | VERIFIED |
| BR-03 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | VERIFIED |
| BR-04 | PASS | PASS | PASS | PASS | PASS | PASS | PASS | PASS | VERIFIED |
| ...   |      |      |      |      |      |      |      |      |          |
| BR-37 |      |      |      |      |      |      |      |      |          |
| BR-45 |      | (L1-TC-11/12) |  |  |  | (L5-TC-10) | (L6-TC-06) | (L7-TC-04) |  |
| BR-46 |      |      |      |      |      |      |      | (L7-TC-04) |  |
| BR-47 | N/A (process/governance — audited ở doc 02/04, không phải runtime test) |  |  |  |  |  |  |  | N/A |
| BR-48 |      | | | | | | (L6-TC-06/07) | |  |
| BR-SC |  đối chiếu SC-01…SC-32 sau khi tất cả BR-01..48 VERIFIED — không PASS riêng, chỉ là index tổng hợp |  |  |  |  |  |  |  |  |

Quy tắc:

```text
Overall = VERIFIED
```

chỉ khi mọi mandatory cell PASS.

---

# 46. Defect Classification

Mỗi defect phải có:

```text
DEFECT-ID
BR-ID
Layer
Test Case
Observed
Expected
Root Cause
Owner
Fix
Retest
Evidence
Status
```

Ví dụ:

```text
DEFECT:
SEO metadata absent from first HTML

BR:
Dynamic SEO / Public HTML

Observed:
DOM contains title after JS execution

Expected:
Required metadata available in first HTML

Root Cause:
Runtime/template pipeline does not expose effective metadata
before HTML generation

Layer:
L5 symptom
L2/L4 root cause

Action:
Fix root owner, not HTML symptom
```

---

# 47. Stop-the-Line Rules

Agent phải STOP khi phát hiện:

### S1 — Architecture failure

Ví dụ:

* duplicate owner
* competing implementation
* page bypass canonical shell
* legacy code still authoritative

### S2 — SoT failure

Ví dụ:

* DB không phải authoritative source
* frontend hardcode giá trị
* resolver không có precedence rõ ràng
* **SEO layer preempt Affiliate/Public Identity resolver (BR-45.4)**

### S3 — Security failure

Ví dụ:

* authorization chỉ enforced client-side
* route không server-enforced

### S4 — Public SEO failure

Ví dụ:

* canonical sai
* private page indexable
* first HTML thiếu required metadata
* **`/{publicId}/...` hoặc `?ref=`/`?r=` trở thành canonical/sitemap/OG/SD identity (BR-45)**
* **duplicate singleton tag trong 1 rendered document (§38.1)**

### S5 — Data integrity failure

Ví dụ:

* Admin save nhưng read-back khác
* resolver trả sai value

Khi gặp Stop-the-Line:

```text
STOP CURRENT DOWNSTREAM TEST
↓
CLASSIFY
↓
FIND ROOT OWNER
↓
FIX
↓
RETEST CURRENT LAYER
↓
REOPEN DOWNSTREAM
```

---

# 48. Không được Fix Theo Symptom

Các pattern sau bị cấm:

```text
SEO sai
→ hardcode title vào HTML
```

```text
Header duplicate
→ hide bằng CSS
```

```text
API gọi 2 lần
→ debounce để che duplicate owner
```

```text
Wrong canonical
→ replace string trong DOM
```

```text
First HTML thiếu metadata
→ inject metadata sau load
```

```text
publicId/?ref= lọt vào canonical/sitemap
→ filter ở tầng render thay vì sửa resolver (BR-45)
```

```text
Duplicate <title> trong HTML
→ xoá 1 tag bằng JS sau load thay vì sửa owner đang emit 2 lần (§38.1)
```

Nếu root cause ở tầng cao:

> Fix tầng cao.

---

# 49. Execution Order

Agent phải thực hiện chính xác:

```text
PHASE 0
Freeze BR / SoT / Acceptance
        ↓
PHASE 1
L0 Verification
        ↓
GATE 0
        ↓
PHASE 2
L1 Architecture Verification (bao gồm L1-E SEO/Affiliate boundary)
        ↓
GATE 1
        ↓
PHASE 3
L2 Data / SoT / Resolver (bao gồm HTTP↔SEO coherence, Conflict Resolution, Traceability, Versioning)
        ↓
GATE 2
        ↓
PHASE 4
L3 Feature Verification (bao gồm Internal Linking, SEO CMS/Health/Permission)
        ↓
GATE 3
        ↓
PHASE 5
L4 Runtime / Integration
        ↓
GATE 4
        ↓
PHASE 6
L5 Public / SEO (bao gồm URL Variant Matrix, Singleton Audit, Human-vs-Crawler diff)
        ↓
GATE 5
        ↓
PHASE 7
L6 NFR (bao gồm Consistency/Determinism/Observability)
        ↓
GATE 6
        ↓
PHASE 8
L7 Production Regression (bao gồm Compatibility BR-46)
        ↓
GATE 7
        ↓
FINAL ACCEPTANCE
```

---

# 50. Rule khi một layer có nhiều lỗi

Không yêu cầu đoán trước tất cả lỗi downstream.

Ví dụ:

```text
L1
 ├─ FAIL A
 ├─ FAIL B
 └─ FAIL C
```

Fix A/B/C.

Sau khi L1 PASS:

```text
L2
 ├─ FAIL D
 ├─ FAIL E
 └─ FAIL F
```

Đây là hành vi **mong muốn**.

Không cần cố "dự đoán và sửa trước" tất cả lỗi L2 khi L1 chưa PASS.

---

# 51. Definition of Done cho mỗi Layer

Một layer chỉ DONE khi:

* tất cả mandatory Test Case PASS
* defect blocking = 0
* root cause đã xử lý
* regression layer PASS
* evidence đầy đủ
* SoT không thay đổi ngoài kiểm soát
* architecture invariant không bị phá
* production verification hoàn tất nếu layer yêu cầu production evidence

---

# 52. Definition of Done toàn hệ thống

Toàn bộ task/epic chỉ DONE khi:

```text
[✓] Every BR mapped (BR-01..37, BR-45..48, BR-SC)
[✓] Every BR has test coverage
[✓] Every mandatory layer PASS
[✓] No blocking defect
[✓] SoT verified
[✓] Architecture verified
[✓] Data verified
[✓] Feature verified
[✓] Runtime verified
[✓] Public surface verified
[✓] NFR verified
[✓] Production regression verified
[✓] SEO/Affiliate boundary verified (BR-45 — L1-TC-11/12, L5-TC-10, L6-TC-06, L7-TC-04)
[✓] Evidence archived
```

---

# 53. Final Instruction to Agent

**Do not treat this document as a checklist to execute all tests in parallel.**

This is a **layered verification and remediation protocol**.

The required behavior is:

```text
TEST CURRENT LAYER
        ↓
IF FAIL
        ↓
STOP
        ↓
IDENTIFY ROOT CAUSE
        ↓
FIX CURRENT / RESPONSIBLE OWNER
        ↓
RETEST
        ↓
PASS CURRENT LAYER
        ↓
UNLOCK NEXT LAYER
```

The agent must not:

* skip a gate;
* fix downstream symptoms while an upstream architectural failure remains;
* declare a BR verified from a single UI test;
* use screenshot-only evidence for architectural/data claims;
* modify SoT without documenting the change;
* create duplicate owners to make a test pass;
* hardcode values to bypass resolver behavior;
* mark a layer PASS while blocking defects remain;
* treat BR-45 (SEO/Affiliate boundary) as covered by a single line item inside Canonical/Robots tests — it requires its own L1-TC-11/12 and L5-TC-10 evidence;
* skip L2-TC-07/08/L5-TC-11 (the three "Reviewer MUST" items locked 2026-08-09) — these are BLOCKING, not optional.

The final deliverable must contain:

1. **BR → Layer Matrix**
2. **Complete Test Case Registry**
3. **Execution Result**
4. **Defect Registry**
5. **Fix/Retest Evidence**
6. **Layer Gate Results**
7. **Final Production Acceptance**

The desired outcome is not merely:

> "All test cases were executed."

The desired outcome is:

> **"Every Business Requirement has been verified through the appropriate architectural, data, runtime, public-surface, performance and production layers, with each layer passing its gate before the next layer was opened."**
