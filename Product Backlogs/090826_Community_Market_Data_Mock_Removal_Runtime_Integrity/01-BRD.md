# 01 — Business Requirement Document

# Community Market Data — Remove Mock Data & Runtime Market Data Integrity

|                    |                                                               |
| ------------------ | ------------------------------------------------------------- |
| **Task ID**        | `090826_Community_Market_Data_Mock_Removal_Runtime_Integrity` |
| **Date**           | 2026-08-09                                                    |
| **Status**         | 🔒 **OWNER LOCKED** · rev. B (BR-19/20) · 2026-08-09           |
| **Priority**       | **P0 — Data Integrity**                                       |
| **Domain**         | Community / Market Data                                       |
| **Related Domain** | Market Runtime / Stock / Sector / Ecosystem                   |
| **Implementation** | ✅ **AUTHORIZED** — WP-0…7 (Plan LOCKED) |

---

# 0. Governance Gate

```text
Business Requirement
        ↓
Mandatory Audit
        ↓
Owner APPROVE Audit
        ↓
SoT Governance
        ↓
Solution
        ↓
Plan
        ↓
Owner LOCK Plan
        ↓
Implementation
```

### Quy tắc khóa

* BRD này chỉ xác định **Business Requirement và Outcome**.
* BRD này không khóa implementation cụ thể.
* Không được xem `mock-market.js`, `IfluxMockMarket`, `IfluxMarketQuotes` hoặc bất kỳ file/function nào là Solution authority tại BRD gate.
* Mandatory Audit phải xác minh toàn bộ consumer và ownership trước khi Solution được khóa.
* Không được chỉ sửa Community rồi tuyên bố mock data đã bị loại bỏ khỏi hệ thống nếu vẫn còn consumer thực tế sử dụng mock market data.
* Không được thay mock bằng một nguồn giả khác.
* Không được xóa CSS/class chỉ vì tên chứa “mock” hoặc vì nằm trong file từng gắn mock — phải **trace consumer → DOM/class → CSS** rồi mới DELETE | REUSE | PROMOTE.
* **Implementation = NOT AUTHORIZED**.

---

# 1. Business Context

iFlux hiện đã có khả năng kết nối tới **runtime market quote** để lấy dữ liệu thị trường thực.

Tuy nhiên, một số giao diện vẫn có khả năng sử dụng dữ liệu market mock/seed thay vì dữ liệu runtime thực.

Đặc biệt tại Community, hiện tượng được phát hiện là giá và mức tăng/giảm hiển thị trên Article/Community UI không khớp với dữ liệu runtime thực tế.

Ví dụ đối chiếu đã phát hiện:

| Mã  |      Mock data |   Runtime API |
| --- | -------------: | ------------: |
| FPT | 128.5 · +1.45% | 70.8 · +0.14% |
| HPG | 28.45 · +2.57% |   22 · +0.69% |
| VHM |  42.8 · +0.71% |   73 · −5.32% |

Phát hiện ban đầu cho thấy:

```text
IfluxMockMarket
      ↓
mock stock snapshot
      ↓
Community consumer
      ↓
price / change displayed
```

trong khi runtime market data đã tồn tại:

```text
IfluxMarketQuotes
      ↓
/api/market/runtime/quotes
      ↓
real runtime quote
```

Vấn đề vì vậy không còn là "thiếu kết nối market data", mà là **ownership/source-of-truth của market data tại consumer layer chưa được chuẩn hóa**.

### Evidence liên quan (không khóa Solution)

| Evidence | Ghi chú |
|----------|---------|
| Article sidebar TCB/VCB hiện đúng số Mock seed (28.9 / 92.1) trong khi runtime khác | Data integrity — CONFIRMED trước BRD |
| HDB/CMC trống vì không nằm trong mock seed | Cùng root cause fallback Mock |
| Hotfix Community 2026-08-09 | Chỉ cắt Mock **fallback** trên Community stock chip/sidebar — **không** đóng BR-15 toàn hệ thống |

---

# 2. Problem Statement

## 2.1 Mock market data vẫn tồn tại trong runtime consumer path

Hệ thống vẫn có các mock/seed market data có khả năng cung cấp:

* stock price;
* stock change;
* stock performance;
* sector performance;
* ecosystem/group performance;
* market snapshot;
* các market-derived values khác.

Một số consumer vẫn có thể đọc các giá trị này trực tiếp hoặc fallback về mock khi runtime data chưa có.

---

## 2.2 Community có thể hiển thị dữ liệu không phản ánh thị trường thực

Đặc biệt với Article Detail:

```text
Article
 ↓
Entity / Stock
 ↓
Market card
 ↓
Price / Change
```

Nếu consumer đọc mock snapshot thay vì runtime market data thì người dùng có thể nhìn thấy:

```text
Ticker đúng
+
Market value sai
```

Đây là **data integrity issue**, không phải chỉ là UI issue.

---

## 2.3 Sector / Ecosystem cũng có nguy cơ sử dụng mock-derived performance

Phát hiện hiện tại cho thấy stock không phải consumer duy nhất.

Các group/entity consumer có thể đang lấy performance từ mock snapshot thay vì dữ liệu runtime/aggregate thực.

Vì vậy business requirement phải bao phủ:

```text
Stock
Sector
Ecosystem
```

nhưng không mặc định rằng cả ba phải sử dụng cùng một cách tính.

**Cách tính/aggregation cụ thể phải được Mandatory Audit và SoT xác định.**

---

# 3. Business Objective

## O1 — Remove Mock Market Data Authority

Loại bỏ mock market data khỏi vai trò **runtime market-data authority** của hệ thống.

Sau khi hoàn thành:

```text
Mock data
   ≠
Market runtime authority
```

---

## O2 — Real Market Data First

Các market values được hiển thị cho người dùng phải có nguồn từ market runtime/data authority đã được SoT xác định.

Đặc biệt:

* Stock price;
* Stock change;
* Stock performance;
* Market-derived performance.

---

## O3 — Không fallback sang giá giả

Khi runtime market data chưa available:

```text
NO REAL DATA
      ↓
empty / unavailable state
```

không được:

```text
NO REAL DATA
      ↓
mock price
```

Business requirement không chấp nhận việc hiển thị một giá trị giả nhưng trông giống dữ liệu thật.

---

## O4 — Community không được tự làm Market Data Authority

Community chỉ được:

```text
consume authoritative market data
```

không được tự:

* seed giá;
* tự duy trì price catalog;
* tự tạo performance snapshot;
* tự dùng mock taxonomy để thay thế market runtime;
* tự suy diễn giá khi runtime không có.

---

## O5 — Loại bỏ Mock Market Data trên toàn bộ hệ thống

Mục tiêu không chỉ là Community.

Mandatory Audit phải xác định **toàn bộ consumer đang sử dụng mock market data**, bao gồm nhưng không giới hạn:

```text
Community
Market
Dashboard
Watchlist
Heatmap
Breadth
Rankings
Flow
Entity pages
Search
Header widgets
Other market widgets
```

Sau khi hoàn thành, mock market data không còn là runtime source cho các surface production.

---

## O6 — Không làm mất trải nghiệm khi runtime chưa hydrate

Việc loại bỏ mock không đồng nghĩa với việc UI được phép:

* crash;
* render `undefined`;
* hiển thị layout hỏng;
* hiển thị số 0 giả;
* hiển thị giá cũ không rõ nguồn.

Phải có **explicit unavailable/empty state** phù hợp với contract UI sau khi Solution được xác định.

---

# 4. Scope

## 4.1 In Scope

### A. Stock market data

Audit và chuẩn hóa nguồn:

* price;
* change;
* change percentage;
* quote snapshot;
* market status/availability nếu consumer sử dụng.

---

### B. Sector market data

Audit toàn bộ sector performance/value đang sử dụng mock.

Business requirement:

> Sector không được lấy performance từ mock seed.

Nguồn authoritative và cách aggregate sector performance sẽ được xác định qua Audit/SoT.

---

### C. Ecosystem market data

Audit toàn bộ ecosystem/group performance/value đang sử dụng mock.

Business requirement:

> Ecosystem không được lấy performance từ mock seed.

Nguồn constituent và aggregation phải dựa trên market/master data thật theo SoT.

---

### D. Community Article Detail

Community Article Detail phải:

* sử dụng market data authoritative;
* không hiển thị mock price;
* không hiển thị mock change;
* không fallback về mock snapshot;
* không tự tạo market value.

---

### E. Community List / Feed / Trending

Audit các market values xuất hiện trong:

* article cards;
* feed;
* trending;
* sidebar;
* entity cards;
* stock cards;
* sector cards;
* ecosystem cards.

---

### F. Mock consumer inventory

Phải inventory toàn bộ consumer của mock market data trước implementation.

Audit phải xác định:

```text
Mock provider
      ↓
Consumers
      ↓
Data fields consumed
      ↓
Current fallback behavior
      ↓
Replacement authority
```

---

### G. Existing mock data assets

Phạm vi audit bao gồm:

* mock market modules;
* hard-coded stock catalogs;
* sector snapshots;
* ecosystem/group snapshots;
* mock quote providers;
* fallback functions;
* test/demo data nếu có khả năng leak vào production runtime.

---

### H. Mock CSS / Class / HTML / JS artifacts (dead-code)

Phạm vi audit + removal gồm mọi artifact UI chỉ phục vụ mock market:

```text
mock data
  → mock widget / renderer
  → mock DOM / class
  → mock CSS
```

**Bắt buộc** inventory theo chuỗi **consumer → DOM/class → CSS** trước khi DELETE | REUSE | PROMOTE.  
**Cấm** “xóa tất cả CSS trong file mock” hoặc xóa chỉ vì tên class chứa `mock`.

---

### I. Design System ownership khi reuse

Nếu class/primitive còn cần cho runtime UI thật nhưng đang nằm trong mock/legacy CSS:

```text
MIGRATE ownership → Design System (SoT UI)
  → consumer dùng class/token DS
  → DELETE legacy location
```

Không preserve dependency vào Mock CSS. Không bulk-promote toàn bộ mock CSS sang DS.

---

# 5. Out of Scope

BRD này không tự động yêu cầu:

* thay đổi market data provider;
* thay đổi API contract của market backend nếu Audit không chứng minh cần;
* thay đổi cách tính giá;
* thay đổi business definition của price/change;
* thay đổi Stock Master;
* thay đổi Sector Master;
* thay đổi Ecosystem Master;
* redesign Community UI;
* xây dựng market data platform mới;
* tạo database/table mới;
* thay đổi SEO;
* thay đổi Affiliate;
* thay đổi Article entity resolution;
* chuyển máy móc toàn bộ CSS/file mock sang Design System (chỉ promote primitive có giá trị runtime thật — xem BR-20).

Các thay đổi trên chỉ được đưa vào Solution nếu Audit chứng minh dependency bắt buộc.

---

# 6. Business Requirements

## BR-01 — No Mock Market Price in Production Runtime

Production UI không được hiển thị stock price lấy từ mock/seed market data.

```text
Displayed Stock Price
        ↓
Authoritative Runtime Market Data
```

Không chấp nhận:

```text
Runtime unavailable
        ↓
Mock price
```

---

## BR-02 — No Mock Stock Change

Stock change/change percentage hiển thị cho người dùng phải đến từ authoritative market runtime/data source.

Không được sử dụng mock:

* `change`;
* `change_pct`;
* `percentChange`;
* hoặc field tương đương.

---

## BR-03 — No Mock Sector Performance

Sector performance/value hiển thị production không được lấy từ hard-coded/mock sector snapshot.

---

## BR-04 — No Mock Ecosystem Performance

Ecosystem performance/value hiển thị production không được lấy từ hard-coded/mock ecosystem snapshot.

---

## BR-05 — Runtime Authority

Market runtime/data authority phải được xác định rõ cho từng loại dữ liệu:

| Data                  | Required authority                |
| --------------------- | --------------------------------- |
| Stock price           | Market runtime authority          |
| Stock change          | Market runtime authority          |
| Stock change %        | Market runtime authority          |
| Sector performance    | SoT-defined real-data aggregation |
| Ecosystem performance | SoT-defined real-data aggregation |

Tên service/API cụ thể chỉ được khóa sau Audit/SoT.

---

## BR-06 — No Mock Fallback

Nếu authoritative runtime data unavailable:

```text
Unavailable
```

thay vì:

```text
Mock value
```

Không được âm thầm fallback từ real → mock.

---

## BR-07 — No Fake Zero

Khi market value chưa có dữ liệu thật, hệ thống không được biến trạng thái:

```text
unknown
```

thành:

```text
0
```

nếu `0` có thể được người dùng hiểu là giá trị thực.

---

## BR-08 — No Hard-coded Production Market Catalog

Không được sử dụng hard-coded/mock catalog làm authority cho market value production.

Identity/taxonomy data nếu có use case riêng phải được phân biệt rõ với market value.

```text
Identity
    ≠
Market Quote
```

---

## BR-09 — Community Consumer Only

Community consumer phải consume data từ authoritative source.

Community không được:

* tự seed quote;
* tự maintain mock quote;
* tự calculate fake price;
* tự fallback mock;
* tự override runtime quote bằng mock.

---

## BR-10 — Source Consistency

Một ticker xuất hiện trên nhiều Community surfaces phải lấy market value từ cùng một authoritative source/contract.

Ví dụ:

```text
Article Detail
Article Card
Trending
Stock Card
```

không được hiển thị các giá khác nhau chỉ vì mỗi component đọc một mock snapshot riêng.

---

## BR-11 — Freshness

Market values phải tuân theo freshness contract của runtime market data.

BRD không khóa thời gian refresh cụ thể.

Mandatory Audit/SoT phải xác định:

* snapshot;
* cache;
* polling;
* streaming;
* stale threshold;
* unavailable state.

---

## BR-12 — Market Data Availability State

UI phải phân biệt tối thiểu:

```text
REAL VALUE
UNAVAILABLE
```

Không được biến `UNAVAILABLE` thành mock value.

---

## BR-13 — Sector/Ecosystem Aggregation Integrity

Sector/Ecosystem performance phải được tính từ constituent market data thật theo authority được SoT xác định.

Không được dùng:

```text
hard-coded group performance
```

làm production authority.

---

## BR-14 — No Consumer-Specific Mock Authority

Không được có tình trạng:

```text
Community → Mock
Market → Runtime
Dashboard → Mock
```

nếu cùng biểu diễn một market fact.

Cùng một business fact phải có authority nhất quán.

---

## BR-15 — Mock Removal Completeness

Sau implementation, phải chứng minh mock market data không còn được production runtime consumer sử dụng.

Không chỉ:

```text
Community không dùng mock
```

mà phải audit toàn bộ consumer inventory.

---

## BR-16 — Test/Demo Isolation

Mock data nếu vẫn cần cho:

* unit test;
* integration test;
* local development;
* demo;

phải được cô lập khỏi production runtime.

```text
Test Mock
    ≠
Production Market Data
```

---

## BR-17 — No Silent Regression

Một consumer mới không được tự import/use mock market provider để giải quyết vấn đề thiếu runtime data.

Phải có architecture boundary ngăn việc này hoặc verification tương đương.

---

## BR-18 — Data Integrity Over Visual Completeness

Khi không có market data thật:

> **Không có số liệu đúng tốt hơn hiển thị số liệu giả.**

UI completeness không được ưu tiên hơn market data correctness.

---

## BR-19 — Mock Asset & Dead-Code Removal

Sau khi chuyển consumer sang runtime Market/Entity data, mọi **mock-data producer**, **mock-data consumer**, và artifact **CSS / JS / HTML** chỉ phục vụ mock phải được xác định và **DELETE / disable có kiểm chứng**.

Không được giữ mock implementation dưới dạng **fallback ngầm**.

### Phân biệt ownership (bắt buộc)

```text
Mock data ownership  ≠  UI component ownership
```

Một `.stock-card` / `.price` / `.change` / `.entity-card` / `.ifx-stock-head*` **có thể không phải mock CSS** dù trước đây dữ liệu đi qua Mock.

### Atomic requirements

| Req ID | Requirement |
|--------|-------------|
| **BR-19.TRACE** | Trước mọi DELETE/REUSE/KEEP: trace **consumer → DOM/class → CSS** (evidence). Cấm quyết định chỉ theo tên file/class. |
| **BR-19.DEL** | Artifact chỉ phục vụ mock (producer / consumer / class / CSS / HTML chỉ cho mock UI đã bỏ) → **DELETE**. Không giữ “cho chắc”. |
| **BR-19.KEEP** | Class/CSS còn consumer runtime thật → **MUST KEEP / REUSE** (không xóa). |
| **BR-19.NONAME** | Cấm xóa CSS/class chỉ vì tên chứa `mock` hoặc vì từng nằm cạnh mock. |
| **BR-19.NOFALL** | Sau chuyển runtime: mock producer còn được gọi / mock còn là authority cho price·change·sector·eco = **FAIL**. |

### Acceptance (BR-19)

| Check | Fail khi |
|-------|----------|
| Mock producer còn được gọi (Prod) | FAIL |
| Mock price/change còn là authority | FAIL |
| Mock taxonomy/sector/eco data còn là authority | FAIL |
| CSS/class chỉ phục vụ deleted mock UI còn tồn tại | FAIL |
| CSS/class còn consumer runtime thật bị xóa | FAIL |
| Xóa CSS chỉ dựa trên tên “mock” | FAIL |

---

## BR-20 — Reuse → Promote to Design System (SoT UI)

**Nguyên tắc khóa:**

> **Reuse → Promote to SoT, not Preserve in Legacy.**

Nếu một UI primitive / component / class đang nằm trong Mock/Legacy nhưng được xác định là cần dùng bởi runtime thật:

1. **Không** tiếp tục tạo dependency vào Mock CSS / legacy location.
2. Phải chuyển **ownership** về Design System trước (hoặc ngay trong cùng Plan) khi consumer thật sử dụng.
3. Không tạo class mới nếu Design System đã có primitive tương đương → **REUSE DS**.
4. Chỉ promote primitive có **giá trị runtime thật** — **cấm** bulk-migrate toàn bộ mock CSS sang DS.

### Flow (business — không khóa file cụ thể)

```text
Remove Mock
     ↓
Inventory CSS / Class / Component
     ↓
Is it still used by runtime?
     ├── NO → DELETE (BR-19)
     │
     └── YES
          ↓
   Existing DS equivalent?
     ├── YES → REUSE DS
     │
     └── NO → PROMOTE to Design System
                    ↓
             register as SoT UI
                    ↓
             migrate consumers
                    ↓
             delete legacy location
```

### Atomic requirements

| Req ID | Requirement |
|--------|-------------|
| **BR-20.OWNER** | Phân biệt mock-data ownership vs UI-component ownership khi classify. |
| **BR-20.PROMOTE** | Class/CSS cần runtime nhưng đang ở mock/legacy → **MIGRATE ownership → Design System**; không preserve-in-place dưới mock. |
| **BR-20.REUSE-DS** | Đã có DS equivalent → **REUSE DS**; **cấm** tạo class ad-hoc mới. |
| **BR-20.NOBULK** | Cấm chuyển máy móc toàn bộ CSS mock sang DS; chỉ promote primitive có consumer runtime thật. |
| **BR-20.MIGRATE** | Sau promote: migrate consumers sang DS → **DELETE** legacy CSS/class location (không dual-owner). |

### Acceptance (BR-20)

| Check | Fail khi |
|-------|----------|
| Runtime consumer vẫn phụ thuộc Mock CSS sau “reuse” | FAIL |
| Tạo class mới dù DS đã có primitive tương đương | FAIL |
| Bulk copy mock CSS vào DS không có consumer/runtime justification | FAIL |
| Promote xong nhưng legacy location vẫn là owner song song không kế hoạch xóa | FAIL |

---

# 7. Business Rules

## Rule 1 — Real Data Authority

```text
Market Runtime / Authoritative Market Data
                ↓
             Consumer
                ↓
              UI
```

---

## Rule 2 — Mock Prohibited

```text
Mock
 ↓
Production market value
```

**CẤM.**

---

## Rule 3 — No Real → Mock Fallback

```text
Real unavailable
      ↓
Unavailable state
```

không phải:

```text
Real unavailable
      ↓
Mock
```

---

## Rule 4 — Identity ≠ Quote

Stock identity có thể đến từ Master:

```text
Ticker
Company name
Exchange
...
```

nhưng:

```text
Price
Change
Change %
```

phải đến từ market-data authority.

---

## Rule 5 — Group Performance

```text
Real constituent market data
          ↓
Sector/Ecosystem aggregation
          ↓
Consumer
```

Không dùng snapshot hard-code làm authority.

---

## Rule 6 — Trace before DELETE | REUSE | PROMOTE

```text
Consumer
   ↓
DOM / class
   ↓
CSS / token / DS
   ↓
DELETE | REUSE DS | PROMOTE to DS
```

Cấm xóa theo tên. Cấm giữ dead mock CSS “cho chắc”.

---

## Rule 7 — Reuse → Promote to SoT UI

```text
Runtime cần primitive
        ↓
DS đã có? → REUSE
        ↓ không
PROMOTE vào Design System
        ↓
Consumer → DS
        ↓
DELETE legacy / mock CSS location
```

---

# 8. Mandatory Audit Requirement

Trước Solution phải có Mandatory Audit đầy đủ.

## AUDIT-01 — Mock Inventory

Inventory toàn bộ:

* mock market modules;
* mock providers;
* mock snapshots;
* hard-coded price;
* hard-coded change;
* hard-coded sector performance;
* hard-coded ecosystem performance.

---

## AUDIT-02 — Consumer Inventory

Tìm toàn bộ consumer của mock market provider.

Phải lập mapping:

| Mock source | Consumer | Data used | Production? | Replacement |
| ----------- | -------- | --------- | ----------- | ----------- |

---

## AUDIT-03 — Community Runtime Path

Trace:

```text
Community UI
 → store
 → service/bridge
 → market data provider
 → API
```

Xác định chính xác tại đâu:

* runtime quote được ưu tiên;
* mock fallback xảy ra;
* mock trở thành primary;
* snapshot được hydrate.

---

## AUDIT-04 — Stock Quote Evidence

Đối chiếu một số ticker:

```text
Mock
vs
Runtime API
vs
Displayed UI
```

Phải chứng minh source thực tế của displayed value.

---

## AUDIT-05 — Sector Path

Trace:

```text
Sector UI
 → consumer
 → performance source
```

Xác định có đang đọc mock snapshot hay không.

---

## AUDIT-06 — Ecosystem Path

Trace:

```text
Ecosystem UI
 → consumer
 → constituent source
 → performance source
```

Xác định có đang đọc mock snapshot hay không.

---

## AUDIT-07 — Fallback Matrix

Inventory toàn bộ fallback:

```text
Runtime missing
    ↓
What happens?
```

Phân loại:

* real cache;
* stale real cache;
* mock;
* hard-coded;
* zero;
* undefined;
* empty;
* other.

---

## AUDIT-08 — Production Boundary

Xác định mock module có bị production bundle/runtime load trực tiếp hay gián tiếp.

Phải xác định:

* import;
* manifest dependency;
* shell requirement;
* dynamic loading;
* initialization;
* global singleton;
* consumer call-site.

---

## AUDIT-09 — Group Aggregation

Xác định Sector/Ecosystem performance hiện được tạo từ:

* mock;
* runtime;
* database;
* cached aggregation;
* combination.

Không được suy luận từ tên function.

---

## AUDIT-10 — Real Data Readiness

Xác minh runtime market API hiện đã đáp ứng đủ dữ liệu cần thiết cho consumer.

Phải xác định:

* available fields;
* freshness;
* coverage;
* missing ticker behavior;
* unavailable behavior.

---

## AUDIT-11 — Existing Mock Dependency

Xác định những consumer nào sẽ bị ảnh hưởng nếu mock market data bị loại bỏ.

Phân loại:

```text
REMOVE
REPLACE
KEEP — TEST ONLY
KEEP — NON-MARKET IDENTITY ONLY
```

---

## AUDIT-12 — Mock Data Leakage

Tìm các trường hợp mock value có thể đi vào:

* DOM;
* API response;
* store;
* cache;
* global state;
* generated payload.

---

## AUDIT-13 — Regression Surface

Xác định toàn bộ production surfaces cần verify sau removal:

```text
Community
Market
Dashboard
Watchlist
Heatmap
Breadth
Ranking
Flow
Entity pages
Search
Header
Other widgets
```

Danh sách cuối cùng phải dựa trên code evidence.

---

## AUDIT-14 — Data Integrity Verdict

Audit phải kết luận:

| Finding                         | Verdict                   |
| ------------------------------- | ------------------------- |
| Community dùng mock price       | CONFIRMED / NOT CONFIRMED |
| Community dùng mock change      | CONFIRMED / NOT CONFIRMED |
| Sector dùng mock performance    | CONFIRMED / NOT CONFIRMED |
| Ecosystem dùng mock performance | CONFIRMED / NOT CONFIRMED |
| Mock fallback tồn tại           | CONFIRMED / NOT CONFIRMED |
| Runtime authority đã đủ         | CONFIRMED / NOT CONFIRMED |
| Production mock dependency      | CONFIRMED / NOT CONFIRMED |
| Test-only mock isolation        | CONFIRMED / NOT CONFIRMED |

---

## AUDIT-15 — CSS / Class / DOM Artifact Inventory (BR-19)

Inventory toàn bộ class/CSS/HTML gắn với mock market surfaces.

Phải lập mapping **từng hàng**:

| Class / selector | CSS file (owner hôm nay) | DOM / renderer consumer | Production runtime còn dùng? | Decision candidate |
| ---------------- | ------------------------ | ----------------------- | ---------------------------- | ------------------ |

Decision candidate chỉ được một trong:

```text
DELETE
REUSE (runtime — giữ vị trí tạm đến BR-20)
PROMOTE → DS
KEEP — TEST ONLY
NOT EVIDENCED
```

**Cấm** kết luận DELETE chỉ vì tên chứa `mock`.  
**Cấm** kết luận KEEP chỉ vì “từng nằm trong mock.css”.

---

## AUDIT-16 — Design System Equivalent & Promote Candidates (BR-20)

Với mọi class **REUSE / PROMOTE** từ AUDIT-15:

| Class | Runtime consumer | DS equivalent tồn tại? | Gap | Promote / Reuse path |
| ----- | ---------------- | ---------------------- | --- | -------------------- |

Phải xác định:

* Admin DS (`ix-*` / `--ix-*`) vs User Web DS (`ifx-*` / `--ifx-*`) ownership;
* class đang nằm ngoài DS SoT (ad-hoc trong `community.css` / `stock.css` / …);
* primitive nào **đủ điều kiện promote** (có consumer runtime) vs **không promote** (mock-only → DELETE theo BR-19).

Verdict bắt buộc:

| Finding | Verdict |
|---------|---------|
| Có file CSS riêng chỉ-mock | CONFIRMED / NOT CONFIRMED |
| Class runtime nằm ngoài DS | CONFIRMED / NOT CONFIRMED |
| DS equivalent đã có cho market chip/price/change | CONFIRMED / NOT CONFIRMED / PARTIAL |
| Full consumer→class→CSS matrix đủ để DELETE an toàn | CONFIRMED / NOT CONFIRMED |

---

# 9. Acceptance Criteria — Business Level

## AC-01 — Stock

Một ticker có runtime quote hợp lệ:

```text
Displayed price = runtime price
Displayed change = runtime change
```

Không lấy mock.

---

## AC-02 — Runtime unavailable

Khi runtime không có quote:

```text
Displayed = unavailable/empty state
```

Không hiển thị mock.

---

## AC-03 — Sector

Sector performance không còn lấy từ mock seed trong production.

---

## AC-04 — Ecosystem

Ecosystem performance không còn lấy từ mock seed trong production.

---

## AC-05 — Community

Community Article Detail và các Community market surfaces không sử dụng mock market values.

---

## AC-06 — Cross-surface consistency

Cùng một market fact trên các surface phải có cùng authoritative source.

---

## AC-07 — Mock production isolation

Không còn production consumer sử dụng mock market data làm source.

---

## AC-08 — Test isolation

Nếu mock vẫn tồn tại cho testing/local development, mock không được load vào production runtime.

---

## AC-09 — No fake fallback

Không có path:

```text
runtime unavailable → mock
```

---

## AC-10 — No visual regression

Removal mock không được làm:

* crash;
* broken layout;
* undefined value leak;
* invalid UI;
* fake zero;
* stale mock display.

---

## AC-11 — Mock-only assets deleted (BR-19)

Sau removal:

* không còn producer/consumer mock làm authority;
* không còn CSS/class **chỉ** phục vụ mock UI đã xóa;
* không xóa nhầm class còn runtime consumer;
* không xóa CSS chỉ vì tên “mock”.

---

## AC-12 — Reuse promoted to Design System (BR-20)

Sau reuse:

* runtime consumer **không** còn phụ thuộc Mock CSS / legacy mock location;
* dùng DS equivalent nếu đã có; nếu chưa có thì primitive đã được **promote + register** trong Design System;
* không bulk-copy mock CSS vào DS;
* legacy location của primitive đã promote được xóa theo plan (không dual-owner vô hạn).

---

# 10. Non-Goals

BRD này không yêu cầu:

* tạo market data provider mới;
* thay đổi provider hiện tại;
* thay đổi thuật toán tính giá;
* thay đổi business definition của sector/ecosystem;
* redesign toàn bộ Community;
* xây dựng lại Market module;
* thay đổi Stock Master identity;
* thay đổi Article entity resolution;
* thay đổi SEO/affiliate.

---

# 11. Definition of Done — BRD

BRD chỉ được Owner LOCK khi:

* [x] Business problem rõ.
* [x] Mock removal objective rõ.
* [x] Stock/Sector/Ecosystem scope rõ.
* [x] Community scope rõ.
* [x] Production vs Test mock boundary rõ.
* [x] Mock asset / dead-code removal (BR-19) rõ — trace trước khi xóa.
* [x] Reuse → Promote to Design System (BR-20) rõ — không preserve-in-mock.
* [x] Business Requirements không khóa implementation cụ thể.
* [x] Mandatory Audit coverage đầy đủ (kể cả AUDIT-15/16).
* [x] Acceptance Criteria đo được (kể cả AC-11/12).
* [x] Không yêu cầu thay provider nếu chưa có Audit evidence.
* [x] Không code.
* [x] Implementation = `NOT AUTHORIZED`.

---

# 12. Governance Status

| Phase                         | Status |
| ----------------------------- | ------ |
| **01 — Business Requirement** | 🔒 **LOCKED** · rev. B · Owner 2026-08-09 |
| **02 — Mandatory Audit**      | ✅ **APPROVED** · rev. B · Owner 2026-08-09 |
| **03 — SoT Governance**       | 🔒 **OWNER LOCKED** — [`03-SoT.md`](03-SoT.md) · D1–D7 |
| **04 — Solution**             | 🔒 **OWNER LOCKED** — [`04-Solution.md`](04-Solution.md) |
| **05 — Plan**                 | 🔒 **OWNER LOCKED** — [`05-Plan.md`](05-Plan.md) |
| **Implementation**            | ✅ **AUTHORIZED** — WP-0…7 |

> **Cấm:** Audit APPROVED → Solution OPEN → tự xử lý G-CSS-01/02 trong implementation.  
> GAP Audit = **SoT/Solution inputs**, không = soft-pass Implementation.

---

# 13. Owner Decision

### Owner LOCK + Audit APPROVE (2026-08-09)

> **LOCK BRD rev. B.**  
> **APPROVE Mandatory Audit rev. B.** Audit 28/28 Req đã hoàn tất và đủ evidence để mở Phase 03 — SoT. Các GAP còn lại (G-CSS-01/02/03, G-AGG-01) được giữ nguyên là **SoT/Solution inputs**, không được soft-pass hoặc tự diễn giải thành Implementation authorization. Đặc biệt, không DELETE CSS/class theo tên “mock”; mọi REUSE/PROMOTE phải qua ownership + consumer→DOM→CSS trace và DS-equivalent mapping theo BR-19/BR-20.

**Implementation / remove mock / clean CSS / migrate DS = NOT AUTHORIZED** cho đến Owner LOCK Plan.

### Business decision cần khóa

> **Loại bỏ mock market data khỏi production runtime.**

Từ thời điểm task này được triển khai:

```text
Stock
Sector
Ecosystem
      ↓
Real / authoritative market data
```

Không còn:

```text
Real unavailable
      ↓
Mock value
```

Thay vào đó:

```text
Real unavailable
      ↓
Explicit unavailable state
```

Mock chỉ được phép tồn tại nếu phục vụ **test/local/demo isolation**, và tuyệt đối không được làm production market-data authority.

### Đặc biệt

**Không chỉ sửa Community.**

Community là nơi phát hiện vấn đề và là một scope quan trọng, nhưng Mandatory Audit phải xác định toàn bộ production consumers của mock market data để task đạt mục tiêu thực sự:

> **Production không còn phụ thuộc mock market data.**

```text
BRD
 ↓
Mandatory Audit
 ↓
Inventory toàn bộ Mock consumers
 ↓
Xác định Runtime Authority
 ↓
SoT
 ↓
Solution
 ↓
Plan
 ↓
Implementation
```

**Implementation = NOT AUTHORIZED.**

---

# 14. BR Checklist Registry (xương sống bất biến — README §2.1)

> Req ID = khóa traceability cho Audit / SoT / Solution / Plan / Verification.  
> Không tầng nào dưới được bỏ / gộp / đổi meaning.

| BR | Req ID | Requirement (chữ BRD §6) |
|----|--------|---------------------------|
| BR-01 | BR-01 | No Mock Market Price in Production Runtime |
| BR-02 | BR-02 | No Mock Stock Change |
| BR-03 | BR-03 | No Mock Sector Performance |
| BR-04 | BR-04 | No Mock Ecosystem Performance |
| BR-05 | BR-05 | Runtime Authority |
| BR-06 | BR-06 | No Mock Fallback |
| BR-07 | BR-07 | No Fake Zero |
| BR-08 | BR-08 | No Hard-coded Production Market Catalog |
| BR-09 | BR-09 | Community Consumer Only |
| BR-10 | BR-10 | Source Consistency |
| BR-11 | BR-11 | Freshness |
| BR-12 | BR-12 | Market Data Availability State |
| BR-13 | BR-13 | Sector/Ecosystem Aggregation Integrity |
| BR-14 | BR-14 | No Consumer-Specific Mock Authority |
| BR-15 | BR-15 | Mock Removal Completeness |
| BR-16 | BR-16 | Test/Demo Isolation |
| BR-17 | BR-17 | No Silent Regression |
| BR-18 | BR-18 | Data Integrity Over Visual Completeness |
| BR-19 | BR-19.TRACE | Trace consumer→DOM/class→CSS trước DELETE\|REUSE\|KEEP |
| BR-19 | BR-19.DEL | DELETE artifact chỉ phục vụ mock |
| BR-19 | BR-19.KEEP | KEEP/REUSE class còn runtime consumer |
| BR-19 | BR-19.NONAME | Cấm xóa CSS chỉ vì tên “mock” |
| BR-19 | BR-19.NOFALL | Cấm mock fallback ngầm sau chuyển runtime |
| BR-20 | BR-20.OWNER | Phân biệt mock-data ownership ≠ UI-component ownership |
| BR-20 | BR-20.PROMOTE | Reuse → Promote ownership vào Design System |
| BR-20 | BR-20.REUSE-DS | Có DS equivalent → REUSE DS; cấm class mới thừa |
| BR-20 | BR-20.NOBULK | Cấm bulk-migrate mock CSS sang DS |
| BR-20 | BR-20.MIGRATE | Migrate consumers → DELETE legacy location |

**Tổng:** **28** Req ID (18 + 5 BR-19 + 5 BR-20).