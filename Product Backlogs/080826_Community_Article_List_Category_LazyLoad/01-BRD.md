# 01 — BRD · Community Article List Display, Category Filtering & Progressive Lazy Load

| | |
|--|--|
| **Task** | [`00-README.md`](00-README.md) |
| **Product** | iFlux |
| **Module** | Cộng đồng |
| **Trang** | `/cong-dong` |
| **Loại** | Business Requirement Document |
| **Date** | 2026-08-08 |
| **Status** | 🔒 **BRD LOCKED** — Audit/SoT/Solution/Plan Locked · Implementation WP-0…7 shipped (Prod) · chờ Verification Evidence |
| **Governance** | [`Product Backlogs/README.md`](../README.md) |

---

## 1. Business Objective

Chuẩn hóa cách hiển thị danh sách bài viết trên trang **Cộng đồng**, đồng thời đảm bảo danh sách bài viết:

1. Có cấu trúc section rõ ràng, nhất quán.
2. Có thể lọc theo **Danh mục nổi bật** ở đầu trang.
3. Khi lọc danh mục, cùng một hệ thống section/layout được tái sử dụng để hiển thị đúng các bài thuộc danh mục được chọn.
4. Hỗ trợ **progressive lazy load** liên tục khi người dùng scroll.
5. Không bị giới hạn bởi một hard limit về tổng số bài ở tầng giao diện hoặc logic lazy-load.
6. Không làm vỡ layout khi: số bài không đủ section · category ít/nhiều bài · đổi category · lazy-load nhiều lần · dữ liệu thiếu · viewport khác nhau.
7. Xác định nguyên nhân tình trạng hiện tại khi danh sách bị giới hạn số lượng và/hoặc lazy-load không hoạt động đúng.

---

## 2. Business Context

Trang Cộng đồng có **Danh mục nổi bật** phía trên danh sách bài viết (tab/filter).

```text
            [Danh mục A] [Danh mục B] …
                         ↓
                   Article Dataset
                         ↓
                 Article List Renderer
```

Chọn danh mục **không** tạo layout riêng. Category = điều kiện lọc dữ liệu. Một **Article List Renderer / Section Composer thống nhất** render kết quả.

> Category Filter = Data/Query concern.  
> Section Layout = Presentation concern.  
> Lazy Load = Data Acquisition concern.

Ba concern phải tách biệt — tránh duplicate và tránh thêm category làm vỡ cấu trúc article list.

---

## 3. Current-State Problem To Be Audited

Có dấu hiệu danh sách bài viết Community đang bị giới hạn số lượng; lazy-load cần xác minh lại (có hoạt động không, nằm đâu, hard limit FE/BE/API/DB/pagination/cursor/tầng trung gian, regression, tương thích category filter).

**Không giả định nguyên nhân trước Audit.**

Mandatory Audit phải trace:

```text
Category UI → Filter State → Article Query → API → Backend
→ Repository / DB → Pagination / Cursor / Limit → Response
→ Lazy Loader → Section Composer → Article Renderer
```

Audit xác định Current State + Root Cause trước SoT và Solution.

---

## 4. Target Article Layout

### 4.1. Section Pattern A — 5 bài

```text
┌──────────────────────┬──────────────────────┐
│                      │  Small Article       │
│   Large Article      ├──────────────────────┤
│       6/12            │  Small Article       │
│                      ├──────────────────────┤
│                      │  Small Article       │
│                      ├──────────────────────┤
│                      │  Small Article       │
└──────────────────────┴──────────────────────┘
```

- Tổng: **5** articles · Large **6/12** · 4 small trong **6/12** còn lại.
- Bố trí theo design/layout hiện hữu sau Audit (ownership DOM/CSS/widget).
- Không hard-code article cụ thể vào layout.

### 4.2. Section Pattern B — 6 bài

```text
┌────────────┬────────────┬────────────┐
│  4/12      │  4/12      │  4/12      │
├────────────┼────────────┼────────────┤
│  4/12      │  4/12      │  4/12      │
└────────────┴────────────┴────────────┘
```

- Tổng: **6** · mỗi ô **4/12** · lưới **3×2**.
- Reuse layout/widget/component hiện hữu nếu đủ; không tạo hệ card/grid mới nếu đã có.

---

## 5. Section Sequence

```text
Section A → Section B → Section A → Section B → …
```

Không đổi pattern theo category. Category chỉ đổi dataset.

---

## 6. Initial Load

Mở trang Community — **initial = 2 section đầu**:

```text
Section A (5) + Section B (6) = 11 articles
```

(khi dataset đủ). Không hiểu initial là “vài card rồi mới ghép section sau”.

---

## 7. Progressive Lazy Load

Sau initial: mỗi lần tiếp tục tải = **2 section tiếp theo** (A+B). Không giới hạn số batch bởi hard limit UI. Còn data → scroll tiếp tục load; hết data → dừng tự nhiên.

---

## 8. No Hard Limit Requirement

Cấm artificial hard cap kiểu `MAX_ARTICLES` / `MAX_SECTIONS` / `MAX_PAGE` chặn progressive loading khi source còn dữ liệu.

Vẫn được dùng page / offset / cursor / batch / limit-per-request — miễn chuỗi batch chạy đến hết dữ liệu.

---

## 9. Category Filter

Danh mục nổi bật phía trên Article List. Category = filter → Filtered Dataset → Section Composer → A/B…

**Không** tạo renderer/layout riêng theo category. Mọi category dùng chung Article List Renderer · Section Composer · Section A/B · Lazy Load.

### 9.1. Category change

Reset: dataset · lazy-load state · section sequence · pagination/cursor. Không giữ article category trước. Load lại **2 section đầu** của category mới. Không leakage / không kế thừa cursor cũ.

### 9.2. «Tất cả»

`Category = ALL` là filter state hợp lệ; section + lazy-load giống các category khác.

---

## 10. Insufficient Articles / Partial Section

Không đủ 5/6/11 bài → **không** placeholder/bài rỗng phá grid. Graceful degradation theo Design System — chi tiết Solution sau Audit.

---

## 11. Responsive / Layout Safety

Desktop · tablet · mobile: không horizontal overflow ngoài chủ đích · không phá grid/card · không layout shift nghiêm trọng khi append batch · tab category không overflow toàn trang.

---

## 12. DOM / CSS / Widget Ownership Safety

Không tùy tiện thêm CSS / override global. Audit ownership: DOM · CSS · Grid · Card · Section · Category tab · Lazy-load controller. Không regression Market/Dashboard/component dùng chung. CSS mới (nếu cần) phải có ownership + scope rõ.

---

## 13. Existing Implementation Reuse

Trước code mới: inventory card/widget · section/grid · category tab · lazy-load · pagination/cursor · API · filter · empty/end state. Không duplicate nếu reuse/refactor được.

---

## 14. BR Checklist (atomic — immutable)

| BR ID | Requirement | Priority |
|-------|-------------|----------|
| **BR-CAL-01** | Section A (đủ data): 5 bài · 1 large 6/12 · 4 small 6/12 theo layout DS hiện hữu sau Audit. | Must |
| **BR-CAL-02** | Section B (đủ data): 6 bài · lưới 3×2 · mỗi bài 4/12 theo layout DS hiện hữu sau Audit. | Must |
| **BR-CAL-03** | Sequence cố định A→B→A→B… — không đổi theo category. | Must |
| **BR-CAL-04** | Initial load (đủ data) = đúng 2 section đầu A+B (= 11 bài), cấu trúc section đầy đủ. | Must |
| **BR-CAL-05** | Progressive lazy load: mỗi batch tiếp = A+B; tiếp tục khi còn data; hết data thì dừng. | Must |
| **BR-CAL-06** | Không artificial total hard limit (UI/lazy-loader/tầng trung gian) chặn load khi source còn bài. Pagination/cursor/limit-per-request vẫn được phép. | Must |
| **BR-CAL-07** | Featured category filter phía trên list; chỉ lọc dataset; common renderer/composer/lazy-load. | Must |
| **BR-CAL-08** | Không layout/renderer riêng theo từng category. | Must |
| **BR-CAL-09** | Category change: reset dataset + lazy state + section sequence + pagination/cursor; load lại A+B category mới; không leakage / không kế thừa cursor cũ. | Must |
| **BR-CAL-10** | Tab/state **Tất cả** (`ALL`) hợp lệ; cùng cơ chế section + lazy-load. | Must |
| **BR-CAL-11** | Insufficient/partial section: không empty/placeholder phá visual/grid; graceful theo DS. | Must |
| **BR-CAL-12** | Responsive desktop/tablet/mobile: không overflow/broken grid; append batch không phá section đã render. | Must |
| **BR-CAL-13** | Ownership DOM/CSS/widget/section/tab/lazy-load được Audit; không global CSS gây regression ngoài phạm vi. | Must |
| **BR-CAL-14** | Reuse implementation hiện hữu khi đủ; không duplicate mechanism. | Must |
| **BR-CAL-15** | Mandatory Audit (trước SoT/Solution/Code) xác định current limit + lazy-load location/behavior/root cause trên full flow Category→…→Renderer. | Must |
| **BR-CAL-16** | NFR: performance (không load all lúc đầu) · no infinite request loop · no duplicate append · state isolation theo category · error batch không phá list · layout stability khi append. | Must |

---

## 15. Acceptance Criteria (đóng BR — khi Implementation + Evidence)

| # | Tiêu chí | BR |
|---|----------|-----|
| AC-01 | Section A đúng 5 / 6+4 khi đủ data | BR-CAL-01 |
| AC-02 | Section B đúng 6 · 3×2 · 4/12 khi đủ data | BR-CAL-02 |
| AC-03 | Initial = A+B (=11) khi đủ data | BR-CAL-04 |
| AC-04 | Scroll: A+B → A+B → … đến hết data | BR-CAL-05 |
| AC-05 | Chứng minh không dừng vì artificial hard cap khi source còn bài | BR-CAL-06 |
| AC-06 | Category X chỉ hiện dataset X | BR-CAL-07 |
| AC-07 | Category nhiều bài: scroll nhiều batch không kẹt batch đầu | BR-CAL-05, 07 |
| AC-08 | Đổi category: reset đúng state + load A+B mới | BR-CAL-09 |
| AC-09 | Không cross-category leakage | BR-CAL-09 |
| AC-10 | Ít bài: layout graceful, không broken empty card | BR-CAL-11 |
| AC-11 | Desktop/tablet/mobile không overflow/broken grid | BR-CAL-12 |
| AC-12 | Không regression component/CSS/API dùng chung ngoài scope | BR-CAL-13, 14 |
| AC-13 | Audit kết luận rõ lazy-load hiện tại + root cause limit | BR-CAL-15 |
| AC-14 | Evidence: initial 2 sections · batch tiếp · category filter/switch · end-of-data · responsive · no duplicate | BR-CAL-* |

---

## 16. Audit Requirements (tóm tắt — checklist Audit sinh từ §14)

**A. UI** — DOM Community · article list · category UI · card/widget · section/grid · responsive.  
**B. Data** — API · params · category filter · page/offset/cursor · limit · backend/DB · response meta.  
**C. Lazy load** — impl · trigger · batch size · end-of-data · error · duplicate/concurrent · hard limit.  
**D. Category + lazy load** — reset state khi đổi category.  
**E. Regression** — thay đổi Community trước đây có làm mất lazy-load / đổi limit / renderer / script / DOM / category behavior.

---

## 17. SoT / Solution / NFR (sau Audit PASS)

SoT tối thiểu: data source · query/filter · category state · pagination/cursor · lazy-load · section composition · card ownership · responsive ownership · end-of-data · category-switch reset.

Solution chứng minh pipeline:

```text
Category Filter → Filtered Dataset → Progressive Loader (2 sections/batch)
→ Section Composer → Common Article Renderer
```

NFR: Performance · Stability (no loop) · Duplicate prevention · State isolation · Error recovery · Layout stability.

---

## 18. Out of Scope

- Đổi business rule Article · Metadata · SEO canonical · URL bài.
- Đổi Category data model trừ khi Audit chứng minh bắt buộc (ghi dependency).
- Viết lại toàn bộ Community · thay DS · framework FE mới · backend architecture không liên quan.

---

## 19. Mandatory Governance Gate

```text
BRD → Mandatory Audit → Audit PASS → SoT → Solution & Plan
→ Implementation → Verification → Evidence
```

**CẤM** `BRD → Code`. Không sửa `limit` / `page` / `offset` / `cursor` / lazy-load / CSS / API trước Current State + Root Cause.

---

## 20. Definition of Done

- [ ] BRD khóa
- [ ] Mandatory Audit hoàn tất · root cause limit + lazy-load hiện tại xác định
- [ ] SoT · Solution & Plan phê duyệt
- [ ] Section A/B · initial 2 sections · progressive 2 sections/batch
- [ ] Không artificial total hard limit
- [ ] Category filter + lazy-load + switch reset
- [ ] Insufficient data không vỡ layout
- [ ] Desktop/tablet/mobile PASS
- [ ] Không regression · không duplicate article · end-of-data đúng
- [ ] Evidence đủ AC · docs cập nhật cho AI/Developer sau này

---

## 21. Core Principle

> **Danh mục chỉ lọc Dataset. Section chỉ Composition. Lazy Load chỉ Progressive Data Acquisition.**

```text
Featured Categories Filter → Filtered Dataset → Progressive Loader (2 sections/batch)
→ Section Composer → Section A (5) | Section B (6) → Common Article Card/Renderer
```

**Đây là BRD, chưa phải Solution.** Page/offset/cursor · IntersectionObserver · API cụ thể — quyết định **sau Mandatory Audit**.
