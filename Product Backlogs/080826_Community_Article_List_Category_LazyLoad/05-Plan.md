# 05 — Plan (Execution Index)

# Community Article List · Category Filter · Progressive Lazy Load

| | |
|--|--|
| **Task ID** | `080826_Community_Article_List_Category_LazyLoad` |
| **BRD** | [`01-BRD.md`](01-BRD.md) — LOCKED |
| **Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — Owner Approved |
| **SoT** | [`03-SoT.md`](03-SoT.md) — OWNER LOCKED |
| **Solution** | [`04-Solution.md`](04-Solution.md) — **OWNER LOCKED** |
| **Document** | Plan — execution index (README §2.6) · **không code · không redesign** |
| **Date** | 2026-08-08 |
| **Status** | 🔒 **OWNER LOCKED** (2026-08-08) — Owner xác nhận · Implementation theo WP-0…7 |
| **Implementation** | ✅ AUTHORIZED — đúng WP/Solution · cấm tự cải tiến kiến trúc |

> Plan chỉ **index + thứ tự + owner file + verify + rollback**.  
> Chi tiết architecture đọc Solution. CẤM bắt đầu bằng “đổi limit 36→50”.

---

## Work packages (thứ tự bắt buộc)

| WP | Tên | Solution | Owner files (dự kiến) | Depends |
|----|-----|----------|----------------------|---------|
| **WP-0** | Single acquisition call-site | SOL-CAL-07 | `widgets/community-page/index.js`, `iflux-community-api-bridge.js`, list controller | — |
| **WP-1** | `has_more` + stable ordering | SOL-CAL-01 · SOL-CAL-02 | `community-feed.service.js`, `community.routes.js` (response), ApiBridge | WP-0 contract |
| **WP-2** | Query Context + ALL + reset | SOL-CAL-05 | `community-page.js` (tabs/state) | — (có thể song song WP-1) |
| **WP-3** | Buffer + progressive acquire (no preload) | SOL-CAL-03 | `community-daily-feed.js` (`IfluxDailyFeed`) — **một** owner | WP-1 |
| **WP-4** | Composer A/B + partial + Experts sibling | SOL-CAL-04 | `community-daily-feed.js`, `community.css` (scoped only nếu cần) | WP-3 |
| **WP-5** | Error batch UX | SOL-CAL-08 | list controller + shell | WP-3 |
| **WP-6** | DELETE legacy news scroll | SOL-CAL-06 | `community-page.js` (+ mọi consumer nếu có) | WP-4 ổn định |
| **WP-7** | Deploy Prod + CF purge + Verification A/B/C | — | Production | WP-1…6 |

### WP-4 — Experts placement (khóa từ Solution)

```text
Category Tabs
    ↓
Experts block (1 lần, nếu entitlement cho phép)
    ↓
Article Batch 1: A → B
    ↓
Article Batch 2: A → B
    ↓ …
```

CẤM `A → Experts → B`.

### WP-3 — Buffer / trigger (khóa từ Solution)

```text
Acquire chỉ khi cần Batch (initial hoặc gần cuối viewport)
→ Buffer đủ → Compose một Batch → Render
→ Không hút pages vì has_more=true
```

Trigger UI: **IntersectionObserver** trên sentinel cuối list (khóa).

### WP-6 — DELETE gate (bắt buộc)

```text
rg symbols → confirm no consumer → delete → rg lại → smoke
```

Symbols: `loadNewsPage`, `applyNewsLoad`, `bindInfiniteScroll`, `renderNewsHero`, `appendNewsGrid`, `ensureMounts`, `NEWS_HERO_COUNT`, `NEWS_PAGE_SIZE`, `[data-ifx-com-news-grid]`.

---

## Plan Checklist — form README §2.6

| BR | Audit | SoT | Solution | Plan / Action | Status |
|----|-------|-----|----------|---------------|--------|
| BR-CAL-01 | AUD-CAL-01 | SOT-CAL-07 | SOL-CAL-04 | WP-4 compose Section A (1+4) | PENDING |
| BR-CAL-01 | AUD-CAL-01 | SOT-CAL-06 | SOL-CAL-04 | WP-4 Composer owner | PENDING |
| BR-CAL-02 | AUD-CAL-02 | SOT-CAL-08 | SOL-CAL-04 | WP-4 compose Section B (3×2) | PENDING |
| BR-CAL-02 | AUD-CAL-02 | SOT-CAL-06 | SOL-CAL-04 | WP-4 Composer owner | PENDING |
| BR-CAL-03 | AUD-CAL-03 | SOT-CAL-06 | SOL-CAL-04 | WP-4 sequence A→B only | PENDING |
| BR-CAL-03 | AUD-CAL-03 | SOT-CAL-09 | SOL-CAL-04 | WP-4 Batch = A+B | PENDING |
| BR-CAL-04 | AUD-CAL-04 | SOT-CAL-09 | SOL-CAL-03 | WP-3 Initial Batch 1 only | PENDING |
| BR-CAL-04 | AUD-CAL-04 | SOT-CAL-05 | SOL-CAL-03 | WP-3 Initial acquire đủ Batch 1 | PENDING |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-05 | SOL-CAL-03 | WP-3 Progressive Batch + sentinel | PENDING |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-09 | SOL-CAL-03 | WP-3/4 mỗi step = A+B | PENDING |
| BR-CAL-05 | AUD-CAL-05 | SOT-CAL-10 | SOL-CAL-01 | WP-1 `has_more` End-of-Data | PENDING |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-04 | SOL-CAL-02 | WP-1 offset continuation · page 50 | PENDING |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-10 | SOL-CAL-01 | WP-1 không dùng total làm COUNT | PENDING |
| BR-CAL-06 | AUD-CAL-06 | SOT-CAL-01 | SOL-CAL-07 | WP-0 single call-site / context render | PENDING |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-02 | SOL-CAL-05 | WP-2 Filter State + tabs | PENDING |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-01 | SOL-CAL-05/07 | WP-0 + WP-2 | PENDING |
| BR-CAL-07 | AUD-CAL-07 | SOT-CAL-06 | SOL-CAL-04 | WP-4 common Composer | PENDING |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-02 | SOL-CAL-05 | WP-2 no per-cat branch | PENDING |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-06 | SOL-CAL-04 | WP-4 | PENDING |
| BR-CAL-08 | AUD-CAL-08 | SOT-CAL-13 | SOL-CAL-04/05 | WP-2/4 ownership | PENDING |
| BR-CAL-09 | AUD-CAL-09 | SOT-CAL-12 | SOL-CAL-05 | WP-2 reset generation/buffer/offset | PENDING |
| BR-CAL-10 | AUD-CAL-10 | SOT-CAL-03 | SOL-CAL-05 | WP-2 tab Tất cả · default ALL | PENDING |
| BR-CAL-11 | AUD-CAL-11 | SOT-CAL-11 | SOL-CAL-04 | WP-4 xóa side-empty · partial render | PENDING |
| BR-CAL-12 | AUD-CAL-12 | SOT-CAL-14 | SOL-CAL-09 | WP-4/7 responsive Evidence C | PENDING |
| BR-CAL-13 | AUD-CAL-13 | SOT-CAL-13 | SOL-CAL-04/05/09 | WP-2/4/9 scoped CSS only | PENDING |
| BR-CAL-14 | AUD-CAL-14 | SOT-CAL-13 | SOL-CAL-04 | WP-4 reuse cards/grid | PENDING |
| BR-CAL-14 | AUD-CAL-14 | SOT-CAL-16 | SOL-CAL-06 | WP-6 DELETE + inventory gate | PENDING |
| BR-CAL-15 | AUD-CAL-15 | SOT-CAL-16 | SOL-CAL-06 | WP-6 (sau Audit PASS) | PENDING |
| BR-CAL-15 | AUD-CAL-15 | — | N/A | — · Audit duty đã xong | N/A |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-12 | SOL-CAL-05 | WP-2 isolation | PENDING |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-15 | SOL-CAL-08 | WP-5 error/retry | PENDING |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-10 | SOL-CAL-01 | WP-1 | PENDING |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-14 | SOL-CAL-09 | WP-7 layout stability C | PENDING |
| BR-CAL-16 | AUD-CAL-16 | SOT-CAL-05 | SOL-CAL-03 | WP-3 dedup / in-flight | PENDING |

---

## Verification map (sau Impl — README §3.0)

| BR nhóm | Evidence A | Evidence B | Evidence C |
|---------|------------|------------|------------|
| 01–04 Composer / initial | DOM section A/B structure · code path | N/A hoặc sample feed rows | `/cong-dong` initial = A rồi B khi đủ data |
| 05–06 Progressive / no hard cap | acquisition + has_more code | optional COUNT vs has_more sanity | scroll ≥3 batch; API offset tăng; hết khi has_more false |
| 07–10 Category / ALL / reset | tabs HTML · Filter State | N/A | ALL vs CATEGORY; switch không leakage |
| 11 Partial | không `ifx-com-side-empty` | N/A | category ít bài không placeholder |
| 12 Responsive | CSS scoped | N/A | desktop/tablet/mobile partial combos |
| 13–14 Ownership / DELETE | rg no dead symbols · no dual path | N/A | smoke `/cong-dong` |
| 15 | — | — | Audit already PASS |
| 16 NFR | in-flight/generation | N/A | no loop; error giữ list; no dup id |

---

## Rollback (nếu Impl fail)

1. Revert WP đã ship (git / deploy previous community + feed service).  
2. Không để half-state: Composer mới + hydrate 36 cũ song song.  
3. CF purge sau rollback frontend.

---

## Anti-patterns (Plan/Impl)

```text
❌ Đổi limit 36→50 rồi đóng
❌ Preload toàn feed vì has_more
❌ Experts giữa A và B
❌ DELETE legacy không inventory/rg
❌ if (all) oldPath else newPath
❌ Global CSS ngoài community.css
❌ Đổi total → COUNT(*) (ngoài scope Solution)
```

---

## Quyết định cứng (Owner Locked)

1. List owner = `community-daily-feed.js` / `IfluxDailyFeed`
2. WGT-COM-PAGE bỏ hydrate `limit:36`; Initial Acquisition = list controller
3. Trigger = IntersectionObserver trên sentinel
4. Error = giữ DOM + «Thử lại» / re-intersect sentinel
5. Experts = sibling trước article stream
6. DELETE legacy = inventory 5 bước bắt buộc

## Gate

```text
05 Plan — OWNER LOCKED
        ↓
Implementation WP-0…7 (không redesign)
        ↓
Verification A/B/C → Evidence
```
