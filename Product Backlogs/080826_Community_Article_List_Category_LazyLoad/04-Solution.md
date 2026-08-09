# 04 — Solution

# Community Article List · Category Filter · Progressive Lazy Load

| | |
|--|--|
| **Task ID** | `080826_Community_Article_List_Category_LazyLoad` |
| **BRD** | [`01-BRD.md`](01-BRD.md) |
| **Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — Owner Approved |
| **SoT** | [`03-SoT.md`](03-SoT.md) — **OWNER LOCKED** |
| **Document** | Approved way of solving — architecture decisions |
| **Date** | 2026-08-08 |
| **Status** | 🔒 **OWNER LOCKED** (2026-08-08) — sau 4 bổ sung reviewer hẹp |
| **Implementation** | ❌ CẤM cho đến khi Plan khóa |

> Solution chọn **cách** thỏa BR + SoT trong hiện trạng Audit.  
> **Không** bắt đầu bằng “sửa `limit=36` → `50`”.  
> CSS / dead-code cleanup / cache bump = Plan/Impl detail sau các quyết định dưới đây.

---

## Architecture (khóa)

```text
Filter UI (tabs: ALL | CATEGORY:uuid)
        ↓
Feed Query Context
        ↓
Progressive Acquisition (page IO + buffer)
        ↓
Section Composer (A ≤5 → B ≤6 per Batch)
        ↓
Common Card Renderer (IfluxCommunityUI)
```

Một pipeline cho mọi Filter State. Cấm nhánh renderer/acquisition theo tab.

---

## Five mandatory Solution decisions

### SOL-CAL-01 — End-of-Data contract

| | |
|--|--|
| **SoT** | SOT-CAL-10 |
| **Decision** | **Không** dùng `total === cards.length` như COUNT tổng. **Không** bắt buộc đổi `total` thành `COUNT(*)` trong task này. |
| **Contract** | Response feed bổ sung boolean **`has_more`** (tên field cố định cho task). Semantics: `has_more === true` ⟺ còn ít nhất một article thỏa **cùng Query Context** sau page vừa trả. |
| **Invariant (khóa)** | `has_more` và `offset` được đánh giá trên **cùng filter + cùng deterministic ordering** của feed. Trong một acquisition session, ordering phải ổn định đủ để continuation **không duplicate/skip** article do thứ tự không xác định. (Không redesign API — chỉ khóa semantics; ordering hiện hữu Audit: `ORDER BY COALESCE(published_at, created_at) DESC` — giữ ổn định trong session.) |
| **Server rule (chọn)** | Khi query page `limit=L`, source lấy tối đa `L+1` hàng khớp filter; trả `L` card; `has_more = (có hàng thứ L+1)`. `total` giữ nguyên semantics hiện tại (page length) hoặc bỏ phụ thuộc phía client — client **chỉ** tin `has_more` + `cards.length` cho continuation. **Không** ép `total` → `COUNT(*)`. |
| **Client rule** | End-of-Data khi `has_more === false` **và** buffer Composer đã cạn (không còn bài chưa compose). |
| **CẤM** | Suy hết data vì hết ngày Store / vì đã render N batch / vì hard-cap UI. |

### SOL-CAL-02 — Pagination / continuation

| | |
|--|--|
| **SoT** | SOT-CAL-04 |
| **Decision** | Continuation = **`offset` + `limit`** trên `GET /community/feed` (đã có), gắn **một** state object theo Query Context. |
| **State shape (logical)** | `FeedContinuation { offset: number, hasMore: boolean }` — reset khi đổi Filter State (SOL-CAL-05). |
| **Page size IO** | `FEED_PAGE_SIZE` = **50** (BE max hiện tại — Audit V5). Đây là **IO page**, không phải Batch capacity 11. |
| **Why not “chỉ đổi 36→50”** | 36/50 chỉ là kích thước hydrate một lần; thiếu continuation + `has_more` + buffer + Composer batch vẫn FAIL BR. |
| **Cursor** | Không dùng cursor opaque trong task này (offset đủ; tránh scope creep). |

### SOL-CAL-03 — Batch acquisition

| | |
|--|--|
| **SoT** | SOT-CAL-05 · SOT-CAL-09 |
| **Decision** | **Buffered acquisition**: IO pages (≤50) đổ vào **ordered buffer** của Query Context; Composer **consume** từng Feed Batch (A+B, ≤11 positions) từ buffer. |
| **Buffer semantics** | `API page = 50` · `Composer batch ≤ 11` · `Buffer = đã acquire nhưng chưa compose`. Buffer **không** = preload toàn bộ feed. |
| **CẤM preload** | **Không** được tiếp tục acquire chỉ vì `has_more=true` đến khi hết dataset. Acquire chỉ khi Composer/viewport **cần** batch tiếp (buffer không đủ cho Batch kế / gần cuối nội dung đã render). |
| **Flow** | Buffer đủ Batch tiếp → Compose → Render → gần cuối rendered → Acquire tiếp **nếu cần** và `has_more`. |
| **Initial** | Đảm bảo đủ data cho Batch 1: nếu buffer < nhu cầu compose và `has_more`, fetch page tiếp cho đến đủ Batch 1 hoặc End-of-Data. Compose + render Batch 1 (A rồi B). **Dừng acquire** sau khi đủ Batch 1 (không hút thêm pages “cho vui”). |
| **Progressive** | Trigger UI = Plan (sentinel/IntersectionObserver). Chưa End-of-Data + cần Batch mới → refill buffer tối thiểu → compose **một** Batch → append. Không hard-cap số batch. |
| **Unit cấm** | Không còn day-reveal như unit acquisition (Audit V2). Calendar day grouping **không** điều khiển lazy. |
| **Dedup** | Buffer/compose theo `article.id`; không append id đã render trong cùng Query Context. |
| **In-flight** | Một acquisition in-flight / context; bỏ qua scroll trùng; hủy/ignore kết quả nếu Filter State đã đổi (generation token). |

### SOL-CAL-04 — Composer A/B + partial

| | |
|--|--|
| **SoT** | SOT-CAL-06…09 · SOT-CAL-11 · SOT-CAL-07/08 |
| **Decision** | **Modify** owner list surface hiện tại (`community-daily-feed.js` / `IfluxDailyFeed`) — **đổi unit** từ day-block sang Section A/B Composer; giữ mount point `[data-ifx-com-daily-feed]` (hoặc alias ổn định). **Không** tạo renderer thứ hai song song. |
| **Section A (đủ 5)** | item[0] → featured (large); item[1..4] → compact side; **không** đổ phần dư vào cùng section. Reuse `.ifx-com-hero` / `featuredPostHtml` / `compactPostHtml`. |
| **Section B (đủ 6)** | đúng 6 → `.ifx-com-feed-grid` + `postCardHtml`. Reuse grid 3 cột hiện có. |
| **Partial** | A = `min(N,5)` thực có — side chỉ render card thật, **xóa** nhánh `ifx-com-side-empty` chiếm chỗ. Nếu A có 1 bài: chỉ featured, side trống/không mount empty. B = `min(rest,6)` chỉ card thật; nếu 0 → không render section B. |
| **Sequence** | Luôn A rồi B trong một Batch; Batch tiếp lại A rồi B. Không đổi theo category. |
| **Experts block** | Leaderboard “Chuyên gia nổi bật” = **sibling content**, **không** thuộc Article Composer / Batch A+B. |
| **Experts placement (khóa cho Plan)** | Plan **phải** chọn thứ tự DOM: `Category Tabs → Experts (1 lần, optional theo entitlement) → Article Batch stream (A→B→A→B…)`. **CẤM** `A → Experts → B` hoặc chèn Experts giữa các Batch. Experts không phá semantic initial A+B. |

### SOL-CAL-05 — Category reset + ALL

| | |
|--|--|
| **SoT** | SOT-CAL-02 · SOT-CAL-03 · SOT-CAL-12 |
| **Filter State** | `ALL` \| `CATEGORY:<uuid>` |
| **ALL** | Không gửi `category_id`. Cùng Acquisition + Composer. Tab UI «Tất cả» bắt buộc có. |
| **CATEGORY** | Gửi `category_id=<uuid>`. Featured tabs từ API `featured=1` như hiện tại. |
| **Default** | **`ALL`** khi không có URL collection/filter khác (ticker/chủ đề/… giữ hành vi filter path hiện có — ngoài featured tabs). |
| **On change** | (1) bump generation (2) abort/ignore in-flight (3) clear buffer + rendered list + continuation (4) set Query Context (5) Initial Acquisition + compose Batch 1. Cấm leakage / kế thừa offset. |
| **UI** | Modify `featuredCatsTabsHtml` — prepend tab Tất cả; active theo Filter State; **không** navigate route riêng. |

---

## Supporting decisions (sau 5 mục trên)

### SOL-CAL-06 — Legacy progressive disposition

| | |
|--|--|
| **SoT** | SOT-CAL-16 — Decision Required |
| **Decision** | **`DELETE`** dead path (không NEUTRALIZE). |
| **Rationale** | Path unreachable (Audit V9); Delete khớp BR-CAL-14 / CG cleanup. |
| **Plan gate (bắt buộc trước khi xóa)** | Không xóa chỉ vì “shell hiện tại không gọi”. Plan/Impl phải: (1) search all references repo · (2) confirm no consumer · (3) delete dead functions/constants · (4) search lại symbol · (5) build/runtime smoke. Symbols tối thiểu: `loadNewsPage`, `applyNewsLoad`, `bindInfiniteScroll`, `renderNewsHero`, `appendNewsGrid`, `ensureMounts`, `NEWS_HERO_COUNT`, `NEWS_PAGE_SIZE`, `[data-ifx-com-news-grid]`. |

### SOL-CAL-07 — Data Provider / hydrate

| | |
|--|--|
| **SoT** | SOT-CAL-01 · SOT-CAL-04 |
| **Decision** | `IfluxCommunityApiBridge.loadFeed` hỗ trợ `offset`, trả/ghi nhận `has_more`. WGT-COM-PAGE **không** còn là “hydrate 36 rồi xong”: Initial Acquisition thuộc list controller (page/DailyFeed successor) theo Query Context — widget boot chỉ bootstrap tối thiểu hoặc ủy quyền list controller (Plan chọn một call-site duy nhất để tránh double-fetch). |
| **Store** | Solution **được phép** giữ cache Store; **render** chỉ từ buffer/stream của Query Context hiện hành (SOT-CAL-01 semantics). Cách lọc/ghi Store = impl detail miễn không render lệch context. |

### SOL-CAL-08 — Error batch

| | |
|--|--|
| **SoT** | SOT-CAL-15 |
| **Decision** | Giữ DOM batch đã render. Set `loadError` trên context; ẩn auto-trigger loop khi error; cho phép **một** retry khi user scroll lại sentinel hoặc bấm «Thử lại» (Plan chọn UX). Không clear list. |

### SOL-CAL-09 — CSS / responsive

| | |
|--|--|
| **SoT** | SOT-CAL-13 · SOT-CAL-14 |
| **Decision** | Reuse `.ifx-com-hero`, `.ifx-com-feed-grid`, breakpoints hiện có. Chỉ thêm/sửa CSS **scoped Community** nếu Composer partial cần (vd. side cột khi 0–4 items) — **không** global override. Verification phải cover tổ hợp partial (SOT-CAL-14). |

---

## Solution Checklist — form README §2.5 (`BR | Audit | SoT | Solution | Status`)

> Shared Solution component được reference nhiều hàng BR — **không gộp mất hàng**.  
> Nhiều SoT cho một BR → **nhiều hàng** (không gộp `SOT-A/B` trong một cell làm mất trace).

| BR | Audit | SoT | Solution | Status |
|----|-------|-----|----------|--------|
| BR-CAL-01 | AUD-CAL-01 | SOT-CAL-07 | SOL-CAL-04 Section A | LOCKED |
| BR-CAL-01 | AUD-CAL-01 | SOT-CAL-06 | SOL-CAL-04 Composer | LOCKED |
| BR-CAL-02 | AUD-CAL-02 | SOT-CAL-08 | SOL-CAL-04 Section B | LOCKED |
| BR-CAL-02 | AUD-CAL-02 | SOT-CAL-06 | SOL-CAL-04 Composer | LOCKED |
| BR-CAL-03 | AUD-CAL-03 | SOT-CAL-06 | SOL-CAL-04 sequence | LOCKED |
| BR-CAL-03 | AUD-CAL-03 | SOT-CAL-09 | SOL-CAL-04 Batch A+B compose | LOCKED |
| BR-CAL-04 | AUD-CAL-04 | SOT-CAL-09 | SOL-CAL-03 Initial Batch 1 | LOCKED |
| BR-CAL-04 | AUD-CAL-04 | SOT-CAL-05 | SOL-CAL-03 Initial Acquisition | LOCKED |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-05 | SOL-CAL-03 Progressive Batch | LOCKED |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-09 | SOL-CAL-03 Progressive Batch | LOCKED |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-10 | SOL-CAL-01 End-of-Data `has_more` | LOCKED |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-04 | SOL-CAL-02 offset continuation | LOCKED |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-10 | SOL-CAL-01 End-of-Data `has_more` | LOCKED |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-01 | SOL-CAL-07 Data Provider / context render | LOCKED |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-02 | SOL-CAL-05 Category Filter State | LOCKED |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-01 | SOL-CAL-05 + SOL-CAL-07 | LOCKED |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-06 | SOL-CAL-04 common Composer | LOCKED |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-02 | SOL-CAL-05 common path | LOCKED |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-06 | SOL-CAL-04 common Composer | LOCKED |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-13 | SOL-CAL-04/05 ownership | LOCKED |
| BR-CAL-09 | AUD-CAL-09 | SOT-CAL-12 | SOL-CAL-05 Category reset | LOCKED |
| BR-CAL-10 | AUD-CAL-10 | SOT-CAL-03 | SOL-CAL-05 ALL state + tab | LOCKED |
| BR-CAL-11 | AUD-CAL-11 | SOT-CAL-11 | SOL-CAL-04 partial · xóa side-empty | LOCKED |
| BR-CAL-12 | AUD-CAL-12 | SOT-CAL-14 | SOL-CAL-09 CSS scoped + Verification C | LOCKED |
| BR-CAL-13 | AUD-CAL-13 | SOT-CAL-13 | SOL-CAL-04/05/09 ownership | LOCKED |
| BR-CAL-14 | AUD-CAL-14 | SOT-CAL-13 | SOL-CAL-04 reuse cards/grid | LOCKED |
| BR-CAL-14 | AUD-CAL-14 | SOT-CAL-16 | SOL-CAL-06 Disposition = **DELETE** | LOCKED |
| BR-CAL-15 | AUD-CAL-15 | SOT-CAL-16 | SOL-CAL-06 DELETE legacy (hỗ trợ sau Audit PASS) | LOCKED |
| BR-CAL-15 | AUD-CAL-15 | — | N/A — lý do: Mandatory Audit duty đã Owner Approved; không Solution behavior mới ngoài SOL-CAL-06 | N/A |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-12 | SOL-CAL-05 reset / isolation | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-15 | SOL-CAL-08 Error batch | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-10 | SOL-CAL-01 End-of-Data | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-14 | SOL-CAL-09 layout stability | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-05 | SOL-CAL-03 dedup / in-flight | LOCKED |

---

## Explicit anti-patterns (cấm trong Plan/Impl)

```text
❌ Chỉ đổi DEFAULT_FEED_LIMIT 36 → 50 rồi đóng task
❌ if (all) oldDailyFeed else newComposer
❌ Giữ day-reveal song song với A/B
❌ Dùng total làm COUNT để dừng/load
❌ Placeholder ép đủ 5/6/11
❌ Hai infinite-scroll paths
❌ Sửa global CSS ngoài community.css / ix-tabs đã load
```

---

## Out of Solution scope (giữ Audit/BRD)

- Đổi Article Metadata / SEO / URL bài  
- Đổi Category data model  
- Viết lại toàn bộ Community page  
- Cursor-based pagination (trừ khi Owner mở lại)  
- Đổi `total` → COUNT(*) (không bắt buộc; đã có `has_more`)

---

## Reviewer lock-in (4 điểm hẹp — đã bổ sung)

1. SOL-CAL-01 — deterministic ordering invariant cho `has_more` / offset  
2. SOL-CAL-03 — buffer ≠ preload toàn bộ; acquire theo nhu cầu Composer/viewport  
3. SOL-CAL-04 — Experts = sibling trước article stream; cấm xen giữa A/B  
4. SOL-CAL-06 — DELETE chỉ sau reference inventory + post-delete symbol scan (Plan)

## Gate

```text
04 Solution — OWNER LOCKED
        ↓
05 Plan (execution index BR-CAL-01…16 — không code)
        ↓
Implementation → Verification A/B/C → Evidence
```
