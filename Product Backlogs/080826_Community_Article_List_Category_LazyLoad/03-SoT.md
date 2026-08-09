# 03 — Source of Truth (Authority)

# Community Article List · Category Filter · Progressive Lazy Load

| | |
|--|--|
| **Task ID** | `080826_Community_Article_List_Category_LazyLoad` |
| **BRD** | [`01-BRD.md`](01-BRD.md) — BR-CAL-01…16 (bất biến) |
| **Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — Owner Approved |
| **Document** | SoT — khóa **Authority / Semantics** (không phải Solution / không phải code) |
| **Date** | 2026-08-08 |
| **Status** | 🔒 **OWNER LOCKED** (2026-08-08) — sau chỉnh SOT-CAL-01 / SOT-CAL-16 theo reviewer |
| **Implementation** | ❌ CẤM đến khi Solution & Plan khóa |

> SoT trả lời: **authority nào phải đúng** để thỏa BR trong bối cảnh Audit.  
> SoT **không** chọn API field cụ thể, IntersectionObserver, file rename, hay cách sửa `total`.

---

## Core Principle (khóa)

```text
Filter chọn Dataset
Composer quyết định Layout (Section A/B)
Progressive Loader quyết định Acquisition
Tất cả Filter State (ALL + CATEGORY:<uuid>) dùng chung Composer + Loader contract
```

```text
Selected Category  →  Feed Query Context  →  Initial Acquisition
        →  Section Composer (A then B)  →  Progressive Acquisition (A+B batches)
        →  còn data theo End-of-Data Authority → tiếp tục
```

**CẤM (ở mọi tầng dưới):** `if (category === 'all') renderOldFeed(); else renderNewFeed();`  
hoặc bất kỳ nhánh tạo renderer/layout/acquisition **khác nhau** theo tab.

---

## SoT Checklist (mỗi Authority · trace BR)

| SoT | Authority | Semantics khóa | Audit ref | BR |
|-----|-----------|----------------|-----------|-----|
| **SOT-CAL-01** | Feed Dataset Authority | **Dataset được render** trên `/cong-dong` phải thuộc **Feed Query Context** hiện hành (SOT-CAL-02) sau Acquisition hợp lệ (SOT-CAL-04/05). SoT **không** quy định Store có được giữ lịch sử hay không, cũng **không** quy định lọc ở tầng nào — đó là Solution. | V1, Trace Map | BR-CAL-06, 07, 08 |
| **SOT-CAL-02** | Category Filter State Authority | Category Filter tạo **Feed Query Context** duy nhất cho session UI. Context là input của Initial + Progressive Acquisition + Composer. **Không** phải ownership layout. | V6, V7, §2.D | BR-CAL-07, 08, 09, 10 |
| **SOT-CAL-03** | `ALL` semantics | State `ALL` = không áp `category_id` vào query. Cùng Feed Query pipeline, cùng Composer, cùng Progressive Acquisition với `CATEGORY:<uuid>`. UI «Tất cả» chỉ là biểu hiện của state này. | V6 · GAP-CAL-ALL-TAB | BR-CAL-10, 07, 08 |
| **SOT-CAL-04** | Feed Pagination / Cursor Authority | Phải tồn tại **continuation token/state** gắn với Query Context (offset, cursor, hoặc tương đương — **Solution chọn**). State này cho phép batch N+1 sau batch N trong cùng context. Artificial hard-cap tổng số bài ở UI/loader **không** được là End-of-Data. | V1, V4, V5 | BR-CAL-05, 06 |
| **SOT-CAL-05** | Progressive Acquisition Authority | Acquisition unit = **Feed Batch** = nhu cầu dữ liệu cho **một** cặp Section A+B (tối đa 11 vị trí). Initial = Batch 1. Scroll/tiếp = Batch 2, 3, … Không giới hạn số batch khi End-of-Data = false. **Không** lấy “ngày lịch” làm unit acquisition (Audit: day-reveal ≠ BRD). | V2, V3 | BR-CAL-04, 05, 06 |
| **SOT-CAL-06** | Section Composer Authority | Composer nhận **ordered article stream** của Query Context hiện tại và **chỉ** phát ra sequence Section A → Section B → A → B… Không đổi pattern theo category. Một Composer cho mọi Filter State. | V3 | BR-CAL-03, 07, 08 |
| **SOT-CAL-07** | Section A semantics | Khi đủ ≥5 bài cho slot A: Section A = **đúng 5** · 1 large (6/12) + 4 small (cột 6/12 còn lại), theo ownership layout DS đã Audit (`.ifx-com-hero*` / card UI). Không hard-code bài cụ thể. Khi thiếu → SOT-CAL-11. | AUD-CAL-01 · A3 | BR-CAL-01 |
| **SOT-CAL-08** | Section B semantics | Khi đủ ≥6 bài cho slot B: Section B = **đúng 6** · lưới 3×2 · mỗi ô 4/12 (ownership `.ifx-com-feed-grid` / card UI). Không hard-code bài. Khi thiếu → SOT-CAL-11. | AUD-CAL-02 · A3 | BR-CAL-02 |
| **SOT-CAL-09** | Batch = A+B semantics | **1 Feed Batch** = Section A (≤5) + Section B (≤6) = tối đa **11 article positions** (layout/capacity của Composer — **không** bắt buộc kích thước mỗi API request). Initial = Batch 1; mỗi progressive step = một Batch tiếp. | Owner lock-in §3 | BR-CAL-04, 05 |
| **SOT-CAL-10** | End-of-Data Authority | End-of-Data = **không còn article** thỏa Query Context hiện tại từ **source authority** (API/DB qua Acquisition). **Không** suy End-of-Data từ: (a) hết ngày trong Store, (b) hết batch UI giả, (c) hard-cap 36, (d) riêng mình field `total === cards.length` như COUNT tổng — Audit chỉ ghi hiện trạng field này; **SoT không bắt buộc** đổi `total` thành COUNT(*). Solution phải chọn contract tín hiệu continuation/`has_more`/cursor sao cho End-of-Data đúng SOT-CAL-10. | V4 · Owner lock-in §5 | BR-CAL-05, 06, 16 |
| **SOT-CAL-11** | Partial Data Authority | Composer: nhận N bài còn lại → A lấy **min(N,5)** → B lấy **min(còn lại,6)** → chỉ render phần thực có. Bảng chuẩn: 11+ → 5+6; 8 → 5+3; 5 → 5+0; 3 → 3+0; 0 → end. **CẤM** placeholder / empty card / `ifx-com-side-empty` (hoặc tương đương) để ép đủ slot. | V8 · Owner lock-in §4 | BR-CAL-11 |
| **SOT-CAL-12** | Category Reset Authority | Đổi Filter State → bắt buộc reset: Query Context · dataset đã acquire · continuation state (SOT-CAL-04) · rendered section/batch counter · in-flight acquisition. Sau reset: acquire + compose **Batch 1** của context mới. CẤM kế thừa cursor/data context cũ; CẤM append lẫn category. | V7 · §2.D | BR-CAL-09, 16 |
| **SOT-CAL-13** | Renderer / UI Ownership | (1) Filter UI = Community shell featured-tabs slot — chỉ biểu hiện Filter State. (2) Section A/B list mount = **một** Community list owner (hiện Daily Feed surface; rename = Solution). (3) Cards = `IfluxCommunityUI` hiện hữu — reuse, không fork theo category. (4) CSS hero/grid = `community.css` scoped — cấm override global để vá Community. | AUD-CAL-13 · A2 · V10 | BR-CAL-13, 08, 14 |
| **SOT-CAL-14** | Responsive / Layout Stability Authority | Layout phải ổn định trên desktop / tablet / mobile cho **tổ hợp partial thực tế** (full A+B, partial B, only A, partial A) — không chỉ “có media query”. Append batch không được phá section đã render; không horizontal overflow ngoài chủ đích; category tabs không làm vỡ trang. Evidence visual = Verification sau Impl. | AUD-CAL-12 · Owner lock-in §4 | BR-CAL-12, 16 |
| **SOT-CAL-15** | Error / failed batch behavior | Một batch Acquisition lỗi: **không** xóa/phá các section đã render đúng; **không** để request loop vô hạn; trạng thái lỗi/retry phải cô lập theo Query Context hiện tại. Chi tiết UX retry = Solution. | AUD-CAL-16 | BR-CAL-16 |
| **SOT-CAL-16** | Dead legacy pagination disposition | Path dead `loadNewsPage` / `bindInfiniteScroll` / news-grid mounts (Audit V9) **không** được là progressive authority cạnh tranh. Authority khóa: **không được có hai progressive mechanisms cạnh tranh**. `Disposition = DELETE \| NEUTRALIZE` — **Solution MUST decide one before Implementation.** | V9 · GAP-CAL-DEAD-NEWS | BR-CAL-14, 15 |

---

## SoT Checklist — form README §2.4 (`BR | Audit | SoT | Status`)

> Mỗi mapping SoT = **một hàng**. Shared SoT được reference nhiều BR — **không gộp mất hàng BR**.  
> Chi tiết semantics từng `SOT-CAL-*`: bảng Authority phía trên.

| BR | Audit | SoT | Trạng thái |
|----|-------|-----|------------|
| BR-CAL-01 | AUD-CAL-01 | SOT-CAL-07 Section A semantics | LOCKED |
| BR-CAL-01 | AUD-CAL-01 | SOT-CAL-06 Section Composer Authority | LOCKED |
| BR-CAL-02 | AUD-CAL-02 | SOT-CAL-08 Section B semantics | LOCKED |
| BR-CAL-02 | AUD-CAL-02 | SOT-CAL-06 Section Composer Authority | LOCKED |
| BR-CAL-03 | AUD-CAL-03 | SOT-CAL-06 Section Composer Authority | LOCKED |
| BR-CAL-03 | AUD-CAL-03 | SOT-CAL-09 Batch = A+B semantics | LOCKED |
| BR-CAL-04 | AUD-CAL-04 | SOT-CAL-09 Batch = A+B semantics | LOCKED |
| BR-CAL-04 | AUD-CAL-04 | SOT-CAL-05 Progressive Acquisition Authority | LOCKED |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-05 Progressive Acquisition Authority | LOCKED |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-09 Batch = A+B semantics | LOCKED |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-10 End-of-Data Authority | LOCKED |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-04 Feed Pagination / Cursor Authority | LOCKED |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-10 End-of-Data Authority | LOCKED |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-01 Feed Dataset Authority | LOCKED |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-02 Category Filter State Authority | LOCKED |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-01 Feed Dataset Authority | LOCKED |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-06 Section Composer Authority | LOCKED |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-02 Category Filter State Authority | LOCKED |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-06 Section Composer Authority | LOCKED |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-13 Renderer / UI Ownership | LOCKED |
| BR-CAL-09 | AUD-CAL-09 | SOT-CAL-12 Category Reset Authority | LOCKED |
| BR-CAL-10 | AUD-CAL-10 | SOT-CAL-03 `ALL` semantics | LOCKED |
| BR-CAL-11 | AUD-CAL-11 | SOT-CAL-11 Partial Data Authority | LOCKED |
| BR-CAL-12 | AUD-CAL-12 | SOT-CAL-14 Responsive / Layout Stability Authority | LOCKED |
| BR-CAL-13 | AUD-CAL-13 | SOT-CAL-13 Renderer / UI Ownership | LOCKED |
| BR-CAL-14 | AUD-CAL-14 | SOT-CAL-13 Renderer / UI Ownership | LOCKED |
| BR-CAL-14 | AUD-CAL-14 | SOT-CAL-16 Dead legacy pagination disposition | LOCKED |
| BR-CAL-15 | AUD-CAL-15 | SOT-CAL-16 Dead legacy pagination disposition | LOCKED |
| BR-CAL-15 | AUD-CAL-15 | — (Audit duty Owner Approved — không authority mới ngoài SOT-CAL-16 hỗ trợ cleanup) | N/A — lý do: BR-CAL-15 = Mandatory Audit đã PASS ở tầng Audit |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-12 Category Reset Authority | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-15 Error / failed batch behavior | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-10 End-of-Data Authority | LOCKED |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-14 Responsive / Layout Stability Authority | LOCKED |

---

## Explicit Non-Decisions (Solution mới được chọn)

SoT **cố ý không** khóa các mục sau — tránh tầng thấp redesign / hotfix sớm:

| Chủ đề | Vì sao chưa khóa ở SoT |
|--------|------------------------|
| Đổi `total` API thành `COUNT(*)` | Audit = hiện trạng; End-of-Data = SOT-CAL-10; Solution chọn tín hiệu |
| Offset vs cursor vs `has_more` field | Thuộc SOT-CAL-04 “continuation exists”; shape = Solution |
| IntersectionObserver vs scroll sentinel | Trigger UI = Solution; unit vẫn Batch A+B |
| Giữ tên `IfluxDailyFeed` hay rename | Ownership surface = SOT-CAL-13; naming = Solution |
| Limit-per-request cụ thể (11, 22, 50…) | **11 = Composer capacity**, không = API size bắt buộc. Fetch 50→buffer→compose 11 hoặc fetch 11/lần đều có thể hợp lệ nếu không vi phạm SOT-CAL-04/05/10 |
| Default tab = ALL hay featured[0] | `ALL` **phải tồn tại** (SOT-CAL-03); default selection = Solution/Product UI (không được bỏ ALL) |
| `Disposition` legacy path | SoT chỉ cấm dual progressive; **DELETE vs NEUTRALIZE** = Solution (SOT-CAL-16) |

---

## Conflict with Current State (từ Audit — không override BR)

| Hiện trạng (Audit) | SoT yêu cầu | Hướng xử lý tầng dưới |
|--------------------|-------------|------------------------|
| Day-reveal lazy | Batch = A+B acquisition | Solution thay unit |
| limit 36 một lần | Continuation đến End-of-Data | Solution + có thể API meta |
| Không tab ALL | SOT-CAL-03 | Solution UI + state |
| `ifx-com-side-empty` | SOT-CAL-11 cấm placeholder ép slot | Solution Composer |
| Dead NEWS_* path | SOT-CAL-16 disposition | Solution cleanup |
| `total = cards.length` | Không bắt buộc COUNT; phải có End-of-Data đúng | Solution contract |

---

## Gate

```text
SoT (document này) — OWNER LOCKED
        ↓
04 Solution  ← End-of-Data · continuation · batch acquisition · Composer A/B+partial · Category reset+ALL
        ↓
05 Plan
        ↓
Implementation
```

**CẤM bắt đầu Solution/Impl bằng “đổi `limit=36` → `50`”** — đó là symptom, không phải architecture.
