# 01 — BRD · Community Article Detail Optimization & Entity Auto-Linking

| | |
|--|--|
| **Task** | [`00-README.md`](00-README.md) |
| **Product** | iFlux |
| **Module** | Cộng đồng · Article Detail · RSS Ingestion · Entity Resolution |
| **Trang** | `/cong-dong/bai-viet/:slug` (kèm path decorator affiliate nếu có) |
| **Loại** | Business Requirement Document |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **BRD LOCKED** · **BR-AD-03 AMENDED** · **BR-AD-12/13 AMENDED** (Sector OUT · Eco ≥3) — Owner 2026-08-09 |
| **Governance** | [`Product Backlogs/README.md`](../README.md) |

---

## 1. Business Objective

Chuẩn hóa trang chi tiết bài viết Community để:

1. Chỉ hiển thị các sidebar block khi bài viết thực sự có entity tương ứng.
2. Tối ưu không gian đọc, để content và hình ảnh sử dụng chiều ngang hợp lý.
3. Hiển thị attribution/byline **đúng theo dữ liệu nguồn thực tế** của bài viết (không hard-code / fallback publisher cố định).
4. Loại chính bài viết hiện tại khỏi danh sách bài viết liên quan.
5. Chuẩn hóa cơ chế tự động nhận diện và liên kết:
   - Cổ phiếu (Stock) — auto-link + persist
   - Hệ sinh thái (Ecosystem) — auto-link + persist **chỉ khi ≥3 mã cổ phiếu thuộc Eco được nhắc**
   - **Ngành (Sector) — OUT OF SCOPE task này** (không auto-link / derive / persist)

Việc auto-link (Stock + Ecosystem đủ điều kiện) phải được xử lý **ngay tại thời điểm RSS ingestion**, lưu kết quả vào bài viết, thay vì phụ thuộc vào renderer lúc người dùng mở bài.

---

## 2. Business Context

```text
                    RSS
                     │
                     ▼
               Article Ingestion
                     │
                     ▼
          Entity Resolution Pipeline
             ┌──────────┴──────────┐
             ▼                     ▼
           Stocks            Ecosystems†
             │                     │
             └──────────┬──────────┘
                        ▼
                Persist Article
                        │
                        ▼
                 Article Detail
```

† Ecosystem chỉ persist khi **≥3** distinct constituent stock codes thuộc Eco đó được nhắc rõ.  
**Sector = OUT OF SCOPE** (BR-AD-12 AMEND).

**Authority sau normalize:**

```text
RSS = source input
Database / Domain model (Admin quản trị) = Source of Truth
Frontend Store / cache = consumption only — không phải SoT thứ hai
```

---

## 3. Business Requirements

### BR-AD-01 — Conditional Sidebar Entity Blocks

Trang Article Detail hiện có các block nhỏ hiển thị danh sách:

- Cổ phiếu liên quan
- Ngành liên quan *(UI có thể còn; **pipeline auto-membership Sector = OUT OF SCOPE** — BR-AD-12 AMEND)*
- Hệ sinh thái liên quan

#### Requirement

Mỗi block chỉ được render khi bài viết có ít nhất một **membership** entity hợp lệ tương ứng.

Ví dụ (sau AMEND BR-AD-12/13):

```text
Bài viết
├── Stocks: VIC, VHM, VRE
└── Ecosystems: VIC  (chỉ vì ≥3 mã thuộc Eco VIC)
```

→ Hiển thị block Cổ phiếu + Hệ sinh thái. **Không** yêu cầu block Ngành từ auto-pipeline.

Nếu:

```text
Stocks: VIC
Ecosystems: []   ← 1 mã ≠ Eco (BR-AD-13.THRESH)
```

→ Chỉ hiển thị block Cổ phiếu.

#### Cấm

Không được render:

- empty block
- placeholder block
- title block không có item
- khoảng trống giả do block rỗng

---

### BR-AD-02 — Article Content Width

Nội dung bài viết phải tận dụng không gian đọc hợp lý trên Article Detail.

#### Requirement

- Text content không được bị giới hạn bởi một vùng width quá hẹp nếu layout hiện tại không có lý do UX rõ ràng.
- Hình ảnh trong nội dung phải sử dụng chiều ngang phù hợp với content container.
- Không được tồn tại một vùng lớn bên phải article content mà không có lý do layout.
- Desktop / tablet / mobile phải giữ layout ổn định.

#### Cấm

Không được giải quyết bằng cách phá global layout hoặc global container của toàn User Web.

CSS phải được scope trong Article Detail ownership.

---

### BR-AD-03 — Article Attribution & Date Lineage

> **Owner AMEND 2026-08-09 — thu hồi cách hiểu cũ.**  
> Không còn yêu cầu “xóa toàn bộ cụm VCCorp.vn / CafeF / Đăng / Cập nhật”.  
> Nguyên nhân Owner muốn xử lý: attribution hiện có dấu hiệu hard-code/fallback sai — có trường hợp bài viết luôn hiển thị `VCCorp.vn` / `CafeF` dù source/author thực tế không phải như vậy.

Article Detail phải hiển thị attribution/byline **đúng theo dữ liệu nguồn thực tế của bài viết**.

#### Requirement

1. Không được hard-code `VCCorp.vn`, `CafeF` hoặc bất kỳ publisher/author cụ thể nào trong Article Detail renderer.
2. Attribution phải có lineage rõ ràng:

```text
RSS/source input
    → ingestion
    → community_posts / payload
    → Article API
    → Article Detail runtime
    → UI
```

3. Nếu bài viết có source/author hợp lệ → hiển thị đúng source/author đó.
4. Nếu không có source/author hợp lệ → **không được tự suy diễn hoặc fallback sang một publisher/author cố định**.
5. `Đăng` / `Cập nhật` phải được đánh giá riêng với attribution:

   * nếu timestamp hợp lệ → có thể tiếp tục hiển thị;
   * không được coi timestamp là một phần của publisher attribution.
6. Không được sửa/xóa dữ liệu nguồn chỉ để làm UI hết lỗi.
7. Không được tạo thêm một source/fallback riêng ở frontend.

#### Acceptance intent

Các bài từ những source khác nhau phải hiển thị attribution tương ứng với dữ liệu thực tế; không có trường hợp source A nhưng UI luôn hiện `VCCorp.vn / CafeF`.

#### Lưu ý

Không kết luận “xóa byline” chỉ vì attribution hiện tại sai. Giữ / sửa / omit từng field → **SoT + Solution** sau khi Audit xác định lineage (AUD-AD-13).

---

### BR-AD-04 — Related Articles Must Exclude Current Article

Danh sách bài viết liên quan bên dưới Article Detail không được hiển thị chính bài viết đang đọc.

#### Requirement

Nếu:

```text
Current Article = Article A
```

thì Related Articles phải loại:

```text
Article A
```

khỏi kết quả trước khi render.

Không được chỉ dựa vào CSS hoặc ẩn item sau khi render.

#### Acceptance

Với mọi Article Detail có related articles:

```text
currentArticle.id NOT IN renderedRelatedArticleIds
```

---

### BR-AD-05 — Stock Entity Authority

Cơ chế auto-link cổ phiếu phải lấy **bảng Stocks hiện hành** làm Source of Truth.

Chỉ những mã:

```text
ticker ∈ Stocks
```

mới được phép trở thành stock entity/link tự động.

#### Cấm

Không được coi:

- ticker xuất hiện trong RSS
- ticker do RSS provider tự nhận diện
- danh sách mã hard-code trong frontend
- danh sách mã trong một file JS riêng

là authority.

---

### BR-AD-06 — Detect Stock Ticker In Article Content

Khi RSS ingestion xử lý bài viết, hệ thống phải kiểm tra nội dung bài viết để phát hiện ticker hợp lệ.

Ví dụ:

```text
HPG đang đẩy mạnh xuất khẩu thép...
```

Nếu `HPG` tồn tại trong Stocks:

```text
HPG → /co-phieu/HPG
```

thì `HPG` phải được nhận diện là stock entity và tự động gắn link.

#### Requirement

Khi phát hiện ticker:

1. Verify ticker tồn tại trong Stocks.
2. Verify occurrence trong content.
3. Tạo stock entity/link.
4. Persist kết quả theo cơ chế ingestion.
5. Article Detail sử dụng kết quả đã được xử lý.

---

### BR-AD-07 — Detect Listed Company Name

Hệ thống phải phát hiện tên doanh nghiệp niêm yết xuất hiện trong nội dung.

Ví dụ:

```text
Tập đoàn Hòa Phát tiếp tục đẩy mạnh xuất khẩu thép...
```

Nếu Stocks có:

```text
ticker = HPG
company_name = Tập đoàn Hòa Phát
```

thì ingestion phải biến nội dung thành:

```text
Tập đoàn Hòa Phát (HPG) tiếp tục đẩy mạnh xuất khẩu thép...
```

Trong đó:

```text
HPG
└── link → /co-phieu/HPG
```

#### Authority

Company name → ticker phải được resolve từ **Stocks**.

Không hard-code mapping:

```text
"Hòa Phát" → HPG
```

trong frontend hoặc ingestion logic nếu mapping đó không xuất phát từ Stocks.

---

### BR-AD-08 — Multiple Stock Matches

Một bài viết có thể chứa nhiều doanh nghiệp/mã hợp lệ.

Ví dụ:

```text
HPG và HSG cùng hưởng lợi...
```

hoặc:

```text
Tập đoàn Hòa Phát ... trong khi Vinamilk ...
```

Nếu cả hai doanh nghiệp tồn tại trong Stocks:

→ Link **tất cả entity hợp lệ được phát hiện**.

Không giới hạn:

```text
1 article = 1 stock
```

và không chọn duy nhất entity đầu tiên.

---

### BR-AD-09 — VND False-positive Rule

Ticker:

```text
VND
```

có khả năng trùng với đơn vị tiền tệ.

Ví dụ:

```text
9.000 VND
100.000 VND
giá trị 50.000 VND
```

#### Requirement

Các occurrence của `VND` thuộc ngữ cảnh đơn vị tiền tệ phải **không được auto-link thành cổ phiếu VND**.

Đặc biệt:

```text
[number] + whitespace + VND
```

phải được coi là currency usage.

Ví dụ:

```text
9.000 VND
```

→ `VND` không link.

Trong khi occurrence thực sự là ticker:

```text
VND tăng mạnh hôm nay
```

có thể được nhận diện là ticker nếu thỏa các rule context khác.

---

### BR-AD-10 — HCM False-positive Rule

Ticker:

```text
HCM
```

có khả năng trùng với Hồ Chí Minh.

#### Requirement

Không auto-link `HCM` khi nó nằm trong ngữ cảnh:

```text
TP HCM
TP.HCM
TP. HCM
Thành phố Hồ Chí Minh
Thành phố HCM
```

hoặc các biến thể tương đương được xác định trong Solution.

Ví dụ:

```text
TP.HCM tiếp tục...
```

→ `HCM` không được link thành cổ phiếu.

Trong khi:

```text
HCM tăng mạnh trong phiên...
```

có thể được nhận diện là ticker nếu thỏa context rule.

---

### BR-AD-11 — Entity Detection Must Be Ingestion-Time

Stock/entity detection phải được thực hiện tại:

```text
RSS
 ↓
Ingestion
 ↓
Entity Detection / Resolution
 ↓
Article persistence
 ↓
Article Detail render
```

Không dùng:

```text
Article Detail render
 ↓
scan text
 ↓
guess entity
```

làm cơ chế chính.

#### Lý do

Kết quả entity detection phải trở thành dữ liệu đã được chuẩn hóa của bài viết và không phụ thuộc vào frontend renderer.

---

### BR-AD-12 — Sector Auto-Link / Membership — **OUT OF SCOPE (Owner AMEND)**

> **Owner AMEND 2026-08-09.**  
> Thu hồi yêu cầu auto-link / derive / persist **Ngành (Sector)** trong task này.

```text
Sector is explicitly OUT OF SCOPE for this task and shall not be
auto-linked, derived, or persisted by this task’s Solution.
```

* Market Master `sectors` vẫn tồn tại ngoài task (identity domain khác).  
* Article Detail **không** được sinh Sector membership từ pipeline của task này.  
* Block sidebar Ngành: nếu không có membership hợp lệ → omit (BR-AD-01.SECTOR); pipeline mới **không** tạo membership đó.  
* Không tạo rule Sector riêng theo category UI — vì **không implement** Sector auto-link trong scope.

---

### BR-AD-13 — Extend Same Model To Ecosystem — **AMENDED (Owner)**

> **Owner AMEND 2026-08-09** — bổ sung anti-duplication + ngưỡng tối thiểu.

Cơ chế entity detection / membership tương tự Stock phải được áp dụng cho **Hệ sinh thái**, với authority = danh sách Hệ sinh thái hiện hành.

#### BR-AD-13.THRESH — Minimum membership (bắt buộc)

```text
An Ecosystem may only be derived/persisted when at least 3 distinct
constituent stock codes belonging to that Ecosystem are explicitly
mentioned in the Article.

A single stock-code mention, even when its name matches an Ecosystem
name, MUST NOT by itself create an Ecosystem association.

Stock association and Ecosystem association are not mutually exclusive,
but the Ecosystem association is subject to the ≥3 constituent-stock threshold.
```

Ví dụ:

```text
"VIC tăng mạnh..."
→ Stock: VIC ✓ · Ecosystem: ✗

"VIC, VHM và VRE cùng tăng..."  (3 mã ∈ Eco VIC)
→ Stock: VIC, VHM, VRE ✓ · Ecosystem: VIC ✓
```

Khi đủ điều kiện:

```text
Article
 ↓
Ecosystem entity (sau ≥3 rule)
 ↓
Ecosystem link / membership persist
```

Không hard-code danh sách ecosystem trong renderer.

---

### BR-AD-14 — Common Entity Resolution Pipeline — **AMENDED scope**

Trong **scope task này**, Stock và Ecosystem dùng chung nguyên tắc Entity Resolution Pipeline:

```text
Article Content
      ↓
Entity Detection
      ↓
Authority Lookup (stocks / ecosystems Master)
      ↓
Entity Resolution (+ Eco ≥3 gate)
      ↓
Persist Article Entity References (stocks[] + ecosystems[])
      ↓
Article Detail
```

**Sector không thuộc pipeline auto-link của task này** (BR-AD-12 OUT OF SCOPE).

Không được tạo Stock renderer / Ecosystem renderer hoàn toàn độc lập nếu reuse được cùng foundation.

---

### BR-AD-15 — No Incorrect Auto-link

Auto-link phải ưu tiên **precision** hơn recall.

Nếu hệ thống không đủ chắc chắn occurrence là entity hợp lệ:

```text
KHÔNG LINK
```

thay vì link nhầm.

Đặc biệt áp dụng cho:

- VND
- HCM
- tên doanh nghiệp có thể trùng từ ngữ thông thường
- viết tắt
- acronym
- tên địa danh

---

### BR-AD-16 — Existing Article Safety

Việc thay đổi entity detection không được làm hỏng:

- nội dung HTML hiện tại
- existing links
- images
- formatting
- embedded media
- article metadata
- canonical / SEO metadata
- affiliate/share decorators

Task này không thay đổi canonical hoặc Article URL.

---

## 4. Expected Result

Sau khi hoàn thành, Article Detail phải có behavior:

### Pipeline

```text
                    RSS
                     │
                     ▼
               Article Ingestion
                     │
                     ▼
          Entity Resolution Pipeline
             ┌──────────┴──────────┐
             ▼                     ▼
           Stocks            Ecosystems (≥3)
             │                     │
             └──────────┬──────────┘
                        ▼
                Persist Article
                        │
                        ▼
                 Article Detail
```

*(Sector OUT OF SCOPE — BR-AD-12 AMEND)*

### Article Detail (UI)

```text
┌─────────────────────────────────────────────┐
│ Article title                               │
│                                             │
│ Hero image                                  │
│                                             │
│ Article content                             │
│                                             │
│ Hòa Phát (HPG) ...                          │
│          └── HPG → /co-phieu/HPG            │
│                                             │
│ ...                                         │
└─────────────────────────────────────────────┘

Sidebar:

[Cổ phiếu]       ← chỉ xuất hiện nếu có
  HPG
  HSG

[Ngành]          ← chỉ xuất hiện nếu có
  Thép

[Hệ sinh thái]   ← chỉ xuất hiện nếu có
  ...

Related Articles:
  Article B
  Article C
  Article D
  ...
  ❌ Current Article
```

### Không còn / không được

```text
❌ empty Stock block
❌ empty Sector block (omit; task **không** auto-sinh Sector — BR-AD-12)
❌ empty Ecosystem block
❌ Ecosystem từ 1 mã / trùng tên Eco (thiếu ≥3 constituent — BR-AD-13.THRESH)
❌ attribution hard-code / fallback publisher cố định (vd. luôn VCCorp.vn / CafeF)
❌ khoảng content width bất hợp lý
❌ current article lặp lại trong Related
❌ HCM → link khi là TP.HCM
❌ VND → link khi là 9.000 VND
❌ chỉ nhận diện một stock trong bài
❌ phụ thuộc RSS provider đã tự link sẵn
❌ runtime source thứ hai thay thế Domain DB cho field Article Detail
```

---

## 5. Governance / Implementation Order

Task này **không được code-first**.

Thứ tự bắt buộc:

```text
BRD
 ↓
Mandatory Audit
 ↓
SoT
 ↓
Solution
 ↓
Plan
 ↓
Implementation
 ↓
Verification
```

Đặc biệt Audit phải truy được:

1. Sidebar blocks đang được quyết định ở đâu.
2. Article content width đang bị giới hạn bởi owner nào.
3. Attribution/byline (publisher, author, tier_label, Đăng/Cập nhật) — lineage từng field; `VCCorp.vn` / `CafeF` đến từ đâu (AUD-AD-13).
4. Related Articles query/composer đang lấy current article ở đâu.
5. Cơ chế RSS hiện tại đã auto-link `HCM`, `VND`, ticker và company name như thế nào.
6. Entity/link hiện được lưu ở đâu hay chỉ được transform lúc render.
7. Stocks / Sectors / Ecosystems hiện tại có những field nào đủ dùng làm authority.
8. Có cơ chế entity resolution nào đã tồn tại cần reuse hay không.
9. Auto-link hiện tại có đang đến từ RSS provider, ingestion pipeline, backend hay frontend.
10. Những bài viết cũ đã ingest trước khi rule mới áp dụng sẽ được xử lý thế nào — **không tự động quyết định ở BRD**, để Audit/SoT/Solution xác định.

### Scope boundary

Không tự động mở rộng task sang:

- sửa Article Metadata model
- SEO/canonical
- URL architecture
- thay đổi Category model
- thay đổi Stocks/Industry/Ecosystem data model

trừ khi Audit chứng minh đây là dependency bắt buộc.

---

## 6. Mandatory Audit Scope — Article Detail · Single Source of Truth & Runtime Integrity

### Mục tiêu Audit bổ sung

Article Detail hiện có dấu hiệu không nhất quán về:

- runtime loading
- data acquisition
- data fields
- entity references
- rendering
- legacy code
- duplicated logic
- hard-coded values
- RSS-derived values
- frontend/local state

Đây là **Audit hypothesis**, chưa được coi là Root Cause.

Mandatory Audit phải xác minh toàn bộ chuỗi Article Detail để đảm bảo sau khi task hoàn thành:

```text
                    ADMIN
                      │
                      ▼
              DATABASE / SoT
                      │
          ┌───────────┼───────────┐
          ▼           ▼           ▼
       Article      Stocks      Taxonomy
       Entity       Industry    Ecosystem
          │           │           │
          └───────────┼───────────┘
                      ▼
                API / Service
                      │
                      ▼
              Article Detail
                      │
                      ▼
                   Render
```

**Không được tồn tại một nguồn dữ liệu song song có authority tương đương Database/Domain SoT.**

---

### AUD-AD-01 — Article Detail Runtime Source Map

Audit phải trace toàn bộ runtime loading của Article Detail.

Phải xác định:

1. HTML shell được load từ đâu.
2. JavaScript nào boot Article Detail.
3. Các JS nào được load trực tiếp / gián tiếp.
4. API nào được gọi.
5. API nào trả Article.
6. API nào trả Stocks / Industry / Ecosystem.
7. Có request nào bị gọi trùng.
8. Có data nào được fetch nhưng không sử dụng.
9. Có script/module legacy nào vẫn được load.
10. Có runtime fallback/mock/static data nào tham gia vào Article Detail.

#### Acceptance

Phải có một Runtime Dependency Map rõ ràng:

```text
Article Detail
 ├── Shell
 ├── Runtime
 ├── Article API
 ├── Entity APIs
 ├── Related Articles
 └── UI Renderer
```

Mỗi node phải có owner xác định.

---

### AUD-AD-02 — Database / Admin Authority Trace

Audit phải xác định **Admin đang quản trị dữ liệu Article Detail ở đâu**.

Đối với từng domain:

| Domain | Phải xác định |
|--------|----------------|
| Article | table / record / service |
| Stock | table / registry / service |
| Industry | table / registry / service |
| Ecosystem | table / registry / service |
| Article ↔ Entity | relation / metadata / payload / derived data |
| Related Article | query / relation / ranking / service |

Mục tiêu là trả lời:

> Khi Admin thay đổi dữ liệu, Article Detail lấy đúng dữ liệu đó từ đâu?

---

### AUD-AD-03 — Field Lineage Audit

Không chỉ audit API response.

Mỗi field quan trọng trên Article Detail phải truy ngược:

```text
UI field
 ↓
Renderer
 ↓
API response
 ↓
Service
 ↓
Database field
```

Ví dụ:

```text
Article title
Article author
Article source
Article published_at
Article updated_at
Article content
Stocks
Industries
Ecosystems
Related Articles
```

#### Phải phát hiện

- field trùng nghĩa
- field legacy
- field fallback
- field được transform nhiều lần
- field lấy từ nhiều source
- field hard-code
- field chỉ tồn tại ở frontend nhưng không có authority tương ứng
- cùng một thông tin nhưng có nhiều tên field/schema khác nhau

#### Acceptance

Mỗi displayed data field phải có **một authoritative lineage**.

Nếu một field có nhiều candidate sources, Audit phải đánh dấu:

```text
CONFLICT
```

và không tự chọn source ở Audit.

---

### AUD-AD-04 — Duplicate / Conflict Detection

Audit phải inventory các cơ chế có thể tạo cùng một dữ liệu.

Đặc biệt kiểm tra:

```text
Database
API
Store
localStorage
mock data
RSS payload
frontend constants
hard-coded HTML
hard-coded JS
derived runtime state
```

Ví dụ nếu Stock list có thể đến từ:

```text
DB → API → Store
```

nhưng đồng thời:

```text
mock-market.js
```

cũng có một danh sách Stocks khác, phải ghi nhận rõ:

```text
DUAL SOURCE
```

Audit không được tự coi hai nguồn này là tương đương.

---

### AUD-AD-05 — RSS vs Database Authority

RSS là **input/source ingestion**, không phải Domain SoT.

Audit phải xác định:

```text
RSS payload
     ↓
Ingestion
     ↓
Normalization
     ↓
Database
```

hay hiện tại đang có:

```text
RSS
 ↓
Article HTML
 ↓
Frontend render
```

hoặc:

```text
RSS HTML
 ↓
stored raw HTML
 ↓
render nguyên trạng
```

#### Đặc biệt audit

- RSS đã chứa `<a>` tới ticker hay chưa.
- Ai tạo `<a href="/co-phieu/HCM">`.
- Link được tạo trước hay sau khi lưu DB.
- Ticker/company name được resolve ở đâu.
- RSS có thể đưa vào ticker không tồn tại trong Stocks hay không.
- Article Detail có tin trực tiếp vào RSS-generated HTML hay không.

#### Authority rule

```text
RSS = source input
Database = normalized domain authority
```

Không được để RSS trở thành một Domain SoT song song.

---

### AUD-AD-06 — Runtime Data Must Not Bypass Domain SoT

Audit phải kiểm tra Article Detail có trường hợp:

```text
UI
 ↓
hard-coded value
```

hoặc:

```text
UI
 ↓
RSS raw value
```

hoặc:

```text
UI
 ↓
frontend mock
```

thay vì:

```text
UI
 ↓
API
 ↓
Domain Service
 ↓
Database
```

hay không.

Các trường hợp bypass phải được ghi evidence cụ thể.

---

### AUD-AD-07 — Store / Cache Authority

Nếu Article Detail sử dụng:

- Store
- cache
- localStorage
- session state
- in-memory state

Audit phải phân biệt:

```text
CACHE
```

với:

```text
SOURCE OF TRUTH
```

Cache chỉ được coi là bản sao có thể invalidate/reload.

Không được để:

```text
DB ≠ Store
```

mà UI coi Store là authority độc lập.

---

### AUD-AD-08 — Article Detail Code Ownership

Audit phải inventory các owner hiện tại của:

- Article shell
- Article content
- Article header
- Sidebar
- Related Articles
- Entity links
- Entity blocks
- RSS transformation
- Article API
- Article Store
- CSS

Mục tiêu:

```text
ONE CONCERN
      ↓
ONE CLEAR OWNER
```

Nếu nhiều module cùng render một concern, phải ghi:

```text
MULTIPLE OWNERS
```

Nếu một module làm quá nhiều concern không liên quan, phải ghi:

```text
MIXED RESPONSIBILITY
```

---

### AUD-AD-09 — Dead / Legacy Article Code

Audit phải tìm:

- unused functions
- unreachable render path
- legacy API calls
- duplicate renderer
- old field names
- old entity mapping
- obsolete CSS
- duplicate CSS selectors
- unused Store state
- deprecated RSS transformation
- fallback logic không còn cần thiết

#### Cấm

Không xóa code trong Mandatory Audit chỉ vì “trông giống code thừa”.

Audit chỉ:

```text
IDENTIFY
EVIDENCE
CLASSIFY
```

Disposition:

```text
DELETE / KEEP / MERGE / REFACTOR
```

để Solution/Plan quyết định.

---

### AUD-AD-10 — Runtime Loading Integrity

Ngoài correctness của data, phải audit performance/runtime.

Cần kiểm tra:

```text
Article Detail initial load
 ├── critical JS
 ├── non-critical JS
 ├── duplicate JS
 ├── API waterfall
 ├── duplicate API request
 ├── blocking request
 ├── late render
 └── unnecessary entity fetch
```

#### Acceptance

Article Detail không được load một module/API chỉ vì một legacy path mà không còn sử dụng.

Nếu có duplicate request:

```text
API A
API A
```

phải ghi rõ caller nào tạo request.

Không được chỉ ghi:

> Trang load chậm.

Phải trace được:

```text
caller → request → response → consumer
```

---

### AUD-AD-11 — Admin → DB → API → User Web Consistency

Audit phải thực hiện ít nhất một đối chiếu thực tế:

```text
Admin
   ↓
Database
   ↓
API
   ↓
Article Detail
```

cho các entity chính.

Ví dụ:

```text
Admin Stocks
      ↓
Database Stocks
      ↓
Stock API
      ↓
Article Detail sidebar / article links
```

Nếu Admin hiển thị:

```text
HPG
HSG
VND
HCM
...
```

nhưng User Web chỉ thấy một subset không có lý do rõ ràng, phải ghi:

```text
CONSISTENCY GAP
```

và truy nguyên nguyên nhân.

---

### AUD-AD-12 — Single Source of Truth Verdict

Mandatory Audit cuối cùng phải đưa ra verdict cho từng domain:

| Domain | Admin | DB | API | Runtime | Article Detail | Verdict |
|--------|-------|----|-----|---------|----------------|---------|
| Article | ? | ? | ? | ? | ? | PENDING |
| Stocks | ? | ? | ? | ? | ? | PENDING |
| Industry | ? | ? | ? | ? | ? | PENDING |
| Ecosystem | ? | ? | ? | ? | ? | PENDING |
| Article Entity Links | ? | ? | ? | ? | ? | PENDING |
| Related Articles | ? | ? | ? | ? | ? | PENDING |

#### Mục tiêu cuối cùng

Sau Audit phải trả lời được:

> **Database nào / table nào / domain registry nào là authority cho từng loại dữ liệu mà Article Detail hiển thị, và runtime hiện tại có đang bypass, duplicate hoặc conflict với authority đó hay không?**

---

### AUD-AD-13 — Attribution / Byline Source-of-Truth Audit

Audit phải truy nguyên **từng field đang tạo ra cụm attribution dưới hero**, tối thiểu:

```text
RSS raw/source
→ rss-ingest.service
→ community_posts row/payload
→ community article API response
→ normalize/store transform
→ community-post-page renderer
→ final DOM
```

Audit phải xác định rõ:

| Field | UI hiển thị | Source hiện tại | DB field | Ingest owner | FE transform | Hard-code/fallback | SoT |
|-------|-------------|-----------------|----------|--------------|--------------|--------------------|-----|
| Publisher/source | ? | ? | ? | ? | ? | ? | ? |
| Author | ? | ? | ? | ? | ? | ? | ? |
| Tier label | ? | ? | ? | ? | ? | ? | ? |
| Published date | ? | ? | ? | ? | ? | ? | ? |
| Updated date | ? | ? | ? | ? | ? | ? | ? |

#### Audit bắt buộc kiểm tra

1. Tìm tất cả literal/string liên quan: `VCCorp`, `CafeF`, `VCCorp.vn`, `author`, `display_name`, `tier_label`, `published_at`, `updated_at`, attribution/byline/source/publisher.
2. Xác định giá trị `VCCorp.vn / CafeF` hiện nay đến từ đâu: RSS input · ingestion default · DB · API · FE hard-code · fallback · vendor HTML.
3. Lấy production sample **≥ 3 bài có source/author khác nhau** — đối chiếu RSS/source thực tế vs DB vs API vs final Article Detail DOM.
4. Nếu DB đúng mà UI sai → xác định FE transform/fallback gây sai.
5. Nếu DB sai từ ingestion → xác định ingestion/default mapping gây sai.
6. Nếu RSS không cung cấp source/author → xác định hệ thống đang fallback từ đâu.
7. Kiểm tra overlap/conflict field (`author.display_name`, `author.name`, `source`, `publisher`, `tier_label`, `vendor`) → ghi nhận để SoT chọn **một field canonical**.
8. Xác định `tier_label` thuộc attribution hay metadata khác bị renderer ghép vào byline.
9. **Không** kết luận “xóa byline” chỉ vì attribution hiện tại sai.

#### Maps to

**BR-AD-03** (amended).

---

### AUD-AD-14 — Article Detail Runtime/Data SoT Integrity

Audit phải kiểm tra Article Detail theo nguyên tắc:

```text
Admin / Domain DB
      ↓
      API
      ↓
Article Detail Runtime
      ↓
      UI
```

**Không được có runtime source thứ hai có khả năng thay thế dữ liệu DB.**

Audit phải inventory:

* hard-coded entity/source data;
* frontend fallback dictionaries;
* MockMarket;
* derived entity data;
* duplicated API fetch;
* duplicated Store transforms;
* renderer-side data invention;
* legacy fields;
* conflicting payload fields;
* duplicate ownership.

Phân loại mỗi nguồn:

```text
AUTHORITATIVE | DERIVED | CACHE | TRANSFORM | FALLBACK | LEGACY | DUPLICATE
```

Đặc biệt kiểm tra:

> Nếu Admin đã cấu hình một entity/source trong DB, Article Detail có lấy đúng giá trị đó qua API hay runtime lại tự suy diễn từ một nguồn khác?

#### Acceptance của AUD-AD-14

Audit phải tạo được một **Field Lineage Matrix** cho các field chính của Article Detail:

```text
UI Field
→ Renderer
→ Runtime object
→ API response
→ DB field
→ DB table
→ Admin owner
→ Classification
```

Mục tiêu: sau Audit + SoT, mỗi field quan trọng chỉ có **một authoritative source**.

#### Maps to

BR-AD-03 + BR-AD-05…14 + AUD-AD-03/04/06 (mở rộng integrity toàn Article Detail).

---

## 7. Governance Boundary (Audit)

Mandatory Audit **không được mặc định kết luận**:

> “Article Detail đang có code rác và database là SoT.”

Thay vào đó phải chứng minh bằng evidence:

```text
Hypothesis
    ↓
Runtime Trace
    ↓
Data Lineage
    ↓
Source Comparison
    ↓
Conflict Detection
    ↓
Root Cause
```

Sau Audit mới khóa:

```text
SoT
 ↓
Solution
 ↓
Plan
```

---

## 8. Target Architecture sau task

Mục tiêu cuối cùng của task là:

```text
                 ┌───────────────┐
                 │     ADMIN     │
                 │ configuration │
                 └───────┬───────┘
                         │
                         ▼
              ┌────────────────────┐
              │ DATABASE / DOMAIN  │
              │   SOURCE OF TRUTH  │
              └──────────┬─────────┘
                         │
                         ▼
                ┌────────────────┐
                │ API / SERVICES │
                └───────┬────────┘
                        │
                        ▼
               ┌─────────────────┐
               │ ARTICLE DETAIL  │
               │     RUNTIME     │
               └───────┬─────────┘
                       │
                       ▼
                    RENDER
```

**Admin không phải một database khác.** Admin là nơi quản trị; **Database/Domain model mà Admin đang quản trị mới là authority**.

Frontend Store/cache chỉ là consumption/cache layer, không được trở thành SoT thứ hai.

RSS cũng chỉ là ingestion input, không phải authority sau khi dữ liệu đã được normalize vào domain.

---

## 9. Acceptance Principle

Sau khi hoàn thành toàn bộ task, một thay đổi hợp lệ trong Admin/Database phải có đường đi rõ ràng:

```text
Admin change
     ↓
Database
     ↓
API/Service
     ↓
Article Detail
```

và **không cần sửa một danh sách hard-code, mock, frontend mapping hoặc một nguồn dữ liệu thứ hai** để Article Detail phản ánh thay đổi đó.

---

## 10. BR Checklist (immutable backbone)

> Form [`Product Backlogs/README.md`](../README.md) **§2.1** — BR + **atomic Req ID** là xương sống.  
> Tầng dưới (Audit / SoT / Solution / Plan / Verification) **phải trả lời đủ từng Req ID** — không gộp, không bỏ dòng, không đổi meaning.

### 10.0 Summary (BR level)

| BR | Priority | Acceptance intent (tóm tắt) | Atomic count |
|----|----------|------------------------------|--------------|
| **BR-AD-01** | Must | Sidebar entity chỉ render khi ≥1; không empty/placeholder | 4 |
| **BR-AD-02** | Must | Content/ảnh width hợp lý; aside có lý do; RWD; CSS scope | 5 |
| **BR-AD-03** | Must | Attribution lineage đúng; cấm hard-code/fixed fallback; dates riêng | 7 |
| **BR-AD-04** | Must | Related exclude current trước render | 3 |
| **BR-AD-05** | Must | Stock authority = `stocks`; cấm RSS/FE hard-code làm authority | 2 |
| **BR-AD-06** | Must | Ingestion detect ticker ∈ Stocks → persist → Detail dùng kết quả | 5 |
| **BR-AD-07** | Must | Company name → `(TICKER)` từ Stocks | 2 |
| **BR-AD-08** | Must | Nhiều entity hợp lệ — link tất cả | 1 |
| **BR-AD-09** | Must | VND currency context không auto-link | 2 |
| **BR-AD-10** | Must | HCM địa danh / TP.HCM không auto-link | 2 |
| **BR-AD-11** | Must | Entity detection ingestion-time; cấm FE làm cơ chế chính | 2 |
| **BR-AD-12** | Must | Sector auto-link/membership **OUT OF SCOPE** task này | 2 |
| **BR-AD-13** | Must | Ecosystem model + authority HST + **≥3 constituent threshold** | 3 |
| **BR-AD-14** | Must | Common pipeline Stock+Eco (Sector ngoài scope) | 2 |
| **BR-AD-15** | Must | Precision > recall | 2 |
| **BR-AD-16** | Must | Không phá HTML/SEO/affiliate/URL hiện có | 2 |
| | | **Tổng atomic Req ID** | **46** |

### 10.1 BR Checklist Registry — atomic (bất biến)

| BR | Req ID | Requirement (chữ BRD) |
|----|--------|------------------------|
| BR-AD-01 | **BR-AD-01.STOCK** | Block Cổ phiếu chỉ render khi ≥1 stock entity hợp lệ |
| BR-AD-01 | **BR-AD-01.SECTOR** | Block Ngành chỉ render khi ≥1 sector membership hợp lệ; task **không** sinh Sector membership (BR-AD-12 OUT) → omit khi không có |
| BR-AD-01 | **BR-AD-01.ECO** | Block Hệ sinh thái chỉ render khi ≥1 ecosystem membership hợp lệ (sau BR-AD-13.THRESH) |
| BR-AD-01 | **BR-AD-01.EMPTY** | Cấm empty / placeholder / title-only / khoảng trống giả do block rỗng |
| BR-AD-02 | **BR-AD-02.WIDTH** | Text content không bị width quá hẹp không có lý do UX |
| BR-AD-02 | **BR-AD-02.IMG** | Ảnh nội dung dùng chiều ngang phù hợp content container |
| BR-AD-02 | **BR-AD-02.ASIDE** | Không vùng lớn bên phải article nếu không có lý do layout |
| BR-AD-02 | **BR-AD-02.RWD** | Desktop / tablet / mobile giữ layout ổn định |
| BR-AD-02 | **BR-AD-02.SCOPE** | CSS scope Article Detail; không phá global User Web layout |
| BR-AD-03 | **BR-AD-03.1** | Không hard-code `VCCorp.vn` / `CafeF` / publisher/author cụ thể trong Article Detail renderer |
| BR-AD-03 | **BR-AD-03.2** | Attribution có lineage RSS/source → ingest → `community_posts` → Article API → runtime → UI |
| BR-AD-03 | **BR-AD-03.3** | Có source/author hợp lệ → hiển thị đúng source/author đó |
| BR-AD-03 | **BR-AD-03.4** | Không có source/author hợp lệ → không suy diễn / fallback publisher-author cố định |
| BR-AD-03 | **BR-AD-03.5** | `Đăng` / `Cập nhật` đánh giá riêng; timestamp ≠ publisher attribution |
| BR-AD-03 | **BR-AD-03.6** | Không sửa/xóa dữ liệu nguồn chỉ để UI hết lỗi |
| BR-AD-03 | **BR-AD-03.7** | Không tạo source/fallback riêng ở frontend |
| BR-AD-04 | **BR-AD-04.1** | Related phải loại current article trước khi render |
| BR-AD-04 | **BR-AD-04.2** | Không chỉ CSS/ẩn item sau khi đã nhận result sai |
| BR-AD-04 | **BR-AD-04.ACC** | Invariant: `currentArticle.id ∉ relatedArticleIds` |
| BR-AD-05 | **BR-AD-05.AUTH** | Auto-link stock authority = bảng Stocks hiện hành |
| BR-AD-05 | **BR-AD-05.BAN** | Cấm RSS provider / FE hard-code / JS dict làm Stock authority |
| BR-AD-06 | **BR-AD-06.1** | Ingestion verify ticker ∈ Stocks |
| BR-AD-06 | **BR-AD-06.2** | Ingestion verify occurrence trong content |
| BR-AD-06 | **BR-AD-06.3** | Tạo stock entity/link khi hợp lệ |
| BR-AD-06 | **BR-AD-06.4** | Persist kết quả theo cơ chế ingestion |
| BR-AD-06 | **BR-AD-06.5** | Article Detail dùng kết quả đã persist (không guess lại) |
| BR-AD-07 | **BR-AD-07.1** | Detect tên DN niêm yết → resolve từ Stocks → `Name (TICKER)` với TICKER link |
| BR-AD-07 | **BR-AD-07.2** | Cấm hardcoded company→ticker dictionary làm authority |
| BR-AD-08 | **BR-AD-08.1** | Link tất cả stock/entity hợp lệ được phát hiện; không cap = 1 |
| BR-AD-09 | **BR-AD-09.CUR** | `[number] + VND` (currency) không auto-link |
| BR-AD-09 | **BR-AD-09.TK** | Occurrence ticker VND chỉ link nếu đủ context rule (Solution khóa) |
| BR-AD-10 | **BR-AD-10.GEO** | TP.HCM / Thành phố Hồ Chí Minh / biến thể địa danh không auto-link HCM |
| BR-AD-10 | **BR-AD-10.TK** | Occurrence ticker HCM chỉ link nếu đủ context rule (Solution khóa) |
| BR-AD-11 | **BR-AD-11.INGEST** | Entity detection tại ingestion-time (RSS → resolve → persist → render) |
| BR-AD-11 | **BR-AD-11.BAN** | Cấm scan/guess lúc Article Detail render làm cơ chế chính |
| BR-AD-12 | **BR-AD-12.MODEL** | **OUT OF SCOPE** — không auto-link / derive / persist Sector trong task này |
| BR-AD-12 | **BR-AD-12.AUTH** | Sector Master (`sectors`) tồn tại ngoài task; **cấm** dùng làm target auto-membership của task này |
| BR-AD-13 | **BR-AD-13.MODEL** | Áp dụng entity model (detect→Master→persist→render) cho Ecosystem |
| BR-AD-13 | **BR-AD-13.AUTH** | Authority Ecosystem identity = danh sách Hệ sinh thái hiện hành |
| BR-AD-13 | **BR-AD-13.THRESH** | Eco chỉ derive/persist khi ≥3 distinct constituent stock codes thuộc Eco được nhắc rõ; 1 mã (kể cả trùng tên Eco) ≠ Eco membership |
| BR-AD-14 | **BR-AD-14.PIPE** | Stock + Ecosystem dùng chung nguyên tắc Entity Resolution Pipeline (Sector ngoài scope) |
| BR-AD-14 | **BR-AD-14.BAN** | Không renderer/cơ chế Stock vs Eco hoàn toàn độc lập nếu reuse được foundation |
| BR-AD-15 | **BR-AD-15.PREC** | Precision > recall; không chắc → không link |
| BR-AD-15 | **BR-AD-15.SCOPE** | Áp dụng đặc biệt VND, HCM, tên DN thường, viết tắt, địa danh |
| BR-AD-16 | **BR-AD-16.SAFE** | Không phá HTML / existing links / images / formatting / embedded media / article metadata |
| BR-AD-16 | **BR-AD-16.SEO** | Không phá canonical / SEO / affiliate-share decorators / Article URL |

### Audit slice registry (AUD-AD-01…14)

> Registry các Audit slice bắt buộc.  
> **Bảng Audit Checklist form README §2.3** (mỗi **Req ID** một hàng + Status + Evidence A/B/C) nằm tại [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) §1 — sinh từ Registry §10.1, không từ code inventory.

| Audit ID | Maps to | Intent |
|----------|---------|--------|
| **AUD-AD-01** | BR-AD-01…16, runtime | Runtime Source Map + owner từng node |
| **AUD-AD-02** | BR-AD-05,12,13 | Admin/DB authority trace theo domain |
| **AUD-AD-03** | BR-AD-03,05…13 | Field lineage; CONFLICT nếu đa source |
| **AUD-AD-04** | BR-AD-05,14,15 | Duplicate / DUAL SOURCE inventory |
| **AUD-AD-05** | BR-AD-05…11 | RSS vs DB authority; ai tạo `<a>` |
| **AUD-AD-06** | BR-AD-02,03,11 | Bypass Domain SoT (hard-code / raw RSS / mock) |
| **AUD-AD-07** | BR-AD-11 | Store/cache ≠ SoT |
| **AUD-AD-08** | BR-AD-01…04,14 | Code ownership / MULTIPLE OWNERS |
| **AUD-AD-09** | BR-AD-16 | Dead/legacy IDENTIFY only — không xóa trong Audit |
| **AUD-AD-10** | BR-AD-02, runtime | Loading integrity / duplicate API |
| **AUD-AD-11** | BR-AD-05,12,13 | Admin→DB→API→UI consistency sample |
| **AUD-AD-12** | All | SoT Verdict table theo domain |
| **AUD-AD-13** | BR-AD-03 (amended) | Attribution/byline field lineage; ≥3 Prod samples; không kết luận “xóa byline” |
| **AUD-AD-14** | All + SoT integrity | Runtime/Data SoT Integrity + Field Lineage Matrix; cấm runtime source thứ hai |

---

## 11. Owner Decision Gate

| Gate | Điều kiện |
|------|-----------|
| **BRD LOCK** | Owner xác nhận BR-AD-01…16 + atomic Req ID (§10.1) + AUD-AD-01…14 |
| **BR-AD-03 AMEND** | Owner 2026-08-09 — thu hồi “xóa toàn bộ byline”; chuyển sang attribution lineage |
| **BR-AD-12 / BR-AD-13 AMEND** | Owner 2026-08-09 — Sector **OUT OF SCOPE**; Ecosystem **≥3 constituent** + anti name-match; + Req **BR-AD-13.THRESH** → **46** atomic |
| **Mở Audit** | Chỉ sau BRD LOCK |
| **Mở Solution/Plan/Code** | Chỉ sau Audit Owner Approved + SoT + Solution LOCK |

**Open decisions (không chốt ở BRD):**

- Backfill bài cũ đã ingest trước rule mới — để Audit/SoT/Solution.
- Chi tiết biến thể ngữ cảnh HCM/VND ngoài ví dụ BR — để Solution sau Audit.
- Giữ / sửa / omit từng field attribution (sau AUD-AD-13) — **SoT/Solution**, không chốt ở BRD.

---

*BRD OWNER LOCKED 2026-08-09 · BR-AD-03 AMENDED · **BR-AD-12/13 AMENDED** (Sector OUT · Eco ≥3) 2026-08-09. Cascade → Audit → SoT → Solution. Cấm Implementation trước Plan approve.*
