# Task 6 — Phase 0 — Interaction Audit Baseline

**Ngày:** 2026-07-24 (cập nhật PG-007 Artifact Structure)  
**SoT Governance:** [`docs/SoT — Plan Phase Governance.md`](../SoT%20—%20Plan%20Phase%20Governance.md) (PG-1.0)  
**Tham chiếu:** Plan IA-1.0 · PS-1.0 DRAFT · §7.1 Presentation Matrix **LOCKED**

---

## 1. Overview

### Task Objective

Chuẩn hóa toàn bộ **Interaction Feature** theo SoT:

- một Feature  
- một Component Catalog  
- nhiều Presentation Host  
- không hydrate Summary  
- tuân thủ PS-1.0  
- sẵn sàng Runtime Implementation  

### Task Roadmap

| Phase | Objective (vai trò trong hoàn thành Task 6) |
| --- | --- |
| **Phase 0** | Audit Baseline — khóa hiện trạng Interaction làm đầu vào SoT |
| **Phase 1** | Hoàn thiện SoT (IO / IA / IP / IU / IR + PS reference) |
| **Phase 2** | Runtime Contract (Summary ≠ Interactive; Host; Resolver) |
| **Phase 3** | API & Store |
| **Phase 4** | Migration (legacy store / LS / dual UI) |
| **Phase 5** | Loading (IR-001 — 0 Store init Summary) |
| **Phase 6** | Exit (Architecture + Technical gate → được Impl rộng) |

### Current Phase

**Phase 0** — Audit Baseline.

**Objective (ngắn):** Khóa hiện trạng Interaction → Baseline cho Phase 1 SoT. Không sửa code.

**Output (ngắn):** Inventory · Gap · Violation (theo SoT Owner) · Presentation AS-IS · Ownership AS-IS · Loading Baseline. Chi tiết → §5 Deliverables.

### Phase Contribution

```text
Task 6 Complete
        ↑
Phase 6 Exit
        ↑
…
        ↑
Phase 1 viết SoT trên Baseline
        ↑
Phase 0 Exit = Audit Complete
        ↑
(Implementation chưa được phép)
```

---

## 2. Objective

Khóa Baseline của toàn bộ Interaction Architecture **trước khi** bất kỳ SoT đầy đủ hoặc Runtime nào được viết / thi công.

---

## 3. Scope

Phạm vi **sẽ rà** trong Phase 0 (chưa phải kết quả):

| # | Scope item | Hỏi gì |
| --- | --- | --- |
| S1 | Domain | Có Interaction Feature chưa? Surface × kind? Boundary với Follow / Insight / Feature-like? |
| S2 | Permission | Guest/User hành vi AS-IS trên comment / like / share? |
| S3 | Presentation Host | Host nào tồn tại? Khớp §7.1? Ai quyết định mobile? |
| S4 | Store / Ownership | Store nào sở hữu comment/like? Ai mount action? |
| S5 | Persistence | LS / mem / API — authoritative source? |
| S6 | API | Endpoint Interaction nào có / wire / thiếu? |
| S7 | Loading | Bundle & hydrate trên Summary vs Interactive / `/binh-luan`? |
| S8 | Counter | Ai sở hữu số like/comment/share trên Summary? |

---

## 4. Evidence

### 4.1 Vocabulary AS-IS

| Khái niệm SoT (TO-BE) | AS-IS |
| --- | --- |
| Interaction Feature | **Không** đóng gói |
| InteractionStore / CommentStore | **Không có** |
| Summary / Interactive | Hành vi ngầm (feed số vs Detail bind) — không mode chính thức |
| Presentation Resolver / Interaction Host | **Không có** |
| InteractionActionBar | **Không có** — mobile = `ARTICLE_TABS` Shell |

### 4.2 Surface × Interaction matrix

**S** = Summary · **I** = Interactive · **Adj** = domain liền kề

| Surface | Like | Fav | Share | Comment | Follow | Mode | Store |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Feed cards `/cong-dong` | S | — | S | S | Adj | Summary-only | CommunityStore |
| Featured / compact | S | — | S | S | — | Summary | CommunityStore |
| Daily / experts / trending | S/Adj | — | Adj | S | **I** Heart | Hỗn hợp | Community + Watchlist |
| Article Detail | **I** | **I** | **I** | **I** sidebar | — | Interactive | CommunityStore |
| Mobile bottom bar | **I** | — | **I** | → page | — | Entry; không sheet | Shell → Community |
| `/binh-luan` (+ scoped) | —/S | — | — | **I** | — | Page nặng | Community + Stock |
| Stock / entity chat | — | — | — | **I** | **I** | Entity LS | StockStore + Heart |
| Messages / Account boot | — | — | — | kéo UI | — | Collateral | boot deps |
| Watchlist / Search / Home | — | — | — | — | **I** | Follow ≠ like | WatchlistStore |
| Insight share / Feature-like | — | — | Adj | — | — | Ngoài IA | Foundation / feature UI |

**Kết luận evidence:** không surface đạt Summary = 0 Interactive bundle + 0 Store init; feed sống trong store đã hydrate; `ti-heart` collision Follow vs like; Favorite chỉ Detail.

### 4.3 Presentation Host AS-IS vs §7.1

§7.1 khóa: Desktop sidebar primary; Mobile `bar → sheet → (khi cần) page`; Component cấm `if (isMobile)`.

| Mode | Desktop AS-IS | Mobile AS-IS | §7.1 |
| --- | --- | --- | --- |
| sidebar | Mount post-page | Không mount ≤768 + CSS hide | Desktop ≈ |
| bottom-bar | — | Shell → like/share/comments | Entry ≈ |
| bottom-sheet | — | **Không có** | **Lệch** |
| page `/binh-luan` | Optional có | **Primary thực tế** | Mobile lệch (phải Secondary) |

Neo: `community-post-page.js` (`isPhoneCommentsSurface` / `matchMedia`); `community.css` ≤768; `iflux-web-ui.js` + `ARTICLE_TABS`.

### 4.4 Store / Ownership / Persistence

| Owner | Dữ liệu | Authoritative AS-IS |
| --- | --- | --- |
| `IfluxCommunityStore` | Post comments | API + mem |
| `IfluxCommunityStore` | Like / Fav / Share | **Memory only** |
| `IfluxStockStore` | Entity comments | **LS** `iflux_stock_comments_v6` |
| Watchlist + Heart | Follow | LS + sync (ngoài IA lõi) |

Keys: `iflux_community_v1` (catalog; posts purged) · `iflux_stock_comments_v6` (**SoT LS**).

### 4.5 Counter sources

| Counter | Hiển thị | Mutation | Sync |
| --- | --- | --- | --- |
| likes / fav / shares | Feed/Detail/badge | mem | Không API |
| comments | Feed/Detail | API total / length | Có thể lệch hydrate |
| stock comments | Entity | LS length | Local |
| interest / relevance | — | API có, **không wire** article UI | — |

Không có Counter Owner = Summary projection.

### 4.6 Permission facts (chưa matrix)

| Action | Guest | User |
| --- | --- | --- |
| Xem stats | Có | Có |
| Gửi comment | Early-return nếu không user | API POST |
| Like / Fav | Mem nếu có uid | Mem |
| Share URL | Không bắt buộc login | Giống |
| Heart Follow | `requireAuth` một số page | Sync |

### 4.7 API

| Endpoint | Wire UI Interaction? |
| --- | --- |
| `GET/POST …/comments` | **Có** |
| Like / fav / share post | **Không tồn tại** |
| `/content/interest` · `/relevance` | Client có; không gọi từ article toggle |

### 4.8 Domain boundary

| Hiện tượng | Ngoài / trong IA |
| --- | --- |
| Heart Follow | Ngoài kinds; tránh collision icon |
| Insight Share | Export ≠ share counter bài |
| Feature-request like | Product Feedback |
| Bookmark targets | Kind IA; targets = Extension |
| URL `/binh-luan` multi-scope | Một `pageKey: comments` |

### 4.9 Loading / Runtime

- `MARKET_PLATFORM_PAGES.comments` → market seed ~240KB+  
- Boot: community-store + stock-store + stock-comments-ui + community-ui + comments-page  
- Luôn `hydrateFromApi({ limit: 100 })`  
- Collateral: account / messages kéo `stock-comments-ui`  
- Composer shared; dual community vs stock-comments stacks; không ActionBar chung  

### 4.10 Evidence index (file neo)

| Chủ đề | File |
| --- | --- |
| Article + skip sidebar | `community-post-page.js` |
| Feed Summary stats | `community-ui.js` |
| Like/fav/share mem | `community-store.js` |
| Mobile bar | `iflux-web-ui.js`, `iflux-platform-boot.js` |
| CSS ≤768 | `community.css` |
| Comments boot + hydrate | `runtime/comments-feature-boot.js` |
| Market on comments | `runtime/shell-boot.js` |
| Stock LS | `stock-store.js` |
| Heart Follow | `foundation/heart-action.js` |
| Comments API | `backend/.../community.routes.js` |
| Interest client | `iflux-api-bundle.js` |
| SEO comments | `seo-url.js` |
| Storage keys | `User_App/shared/storage-keys.json` |

---

## 5. Deliverables

### 5.1 Mapping Scope → Evidence → Deliverable

| Scope | Evidence | Deliverable |
| --- | --- | --- |
| S1 Domain | §4.1 · §4.2 · §4.8 | Domain / Surface Catalog |
| S2 Permission | §4.6 | Permission Facts Report (input IP-001) |
| S3 Presentation | §4.3 | Presentation Matrix AS-IS |
| S4 Store / Ownership | §4.4 | Ownership Report |
| S5 Persistence | §4.4 | Persistence Usage Report |
| S6 API | §4.7 | API Inventory |
| S7 Loading | §4.9 | Runtime / Loading Baseline |
| S8 Counter | §4.5 | Counter Ownership Notes |
| (xuyên suốt) | §4 toàn bộ | **Violation Report** (§5.2) · Inventory Catalog |

### 5.2 Violation Report (theo SoT Owner)

#### PS — Persistence (PS-1.0)

| ID | Mô tả |
| --- | --- |
| **V-PS-01** | `iflux_stock_comments_v6` = localStorage authoritative business data |
| **V-PS-02** | Like / Favorite / Share bài = memory mutation; không API business SoT |

#### IO — Interaction Ownership (IO-001)

| ID | Mô tả |
| --- | --- |
| **V-IO-01** | Không Interaction Host / Presentation Resolver; Shell tự bind `ARTICLE_TABS` like/share/comments |
| **V-IO-02** | Không caller hợp lệ duy nhất cho `mountInteraction` — page/widget/boot tự gắn |

#### IU — UI / Presentation (IU-001 · §7.1)

| ID | Mô tả |
| --- | --- |
| **V-IU-01** | Mobile không có bottom-sheet; đang `bar → page` (lệch Primary Interactive) |
| **V-IU-02** | Component/`matchMedia` + CSS ≤768 quyết định ẩn sidebar — cấm `if (isMobile)` trong Component |

#### IR — Resource Loading (IR-001)

| ID | Mô tả |
| --- | --- |
| **V-IR-01** | `comments ∈ MARKET_PLATFORM_PAGES` + luôn `hydrateFromApi({ limit: 100 })` trên `/binh-luan` |
| **V-IR-02** | Summary-like feed vẫn sống trong CommunityStore đã hydrate (không đạt 0 Store init) |
| **V-IR-03** | Collateral boot (account/messages) kéo `stock-comments-ui` ngoài surface Interactive chính |

#### IA — Domain (IA-001)

| ID | Mô tả |
| --- | --- |
| **V-IA-01** | Không Counter Owner = Interaction Summary projection; mỗi surface đọc/ghi `stats` tại chỗ |
| **V-IA-02** | `ti-heart` dùng cho article like và Watchlist Follow (kind/semantics collision) |
| **V-IA-03** | Không Interaction Feature / kinds vocabulary runtime; dual comment stack community vs stock |

#### IP — Permission (IP-001)

| ID | Mô tả |
| --- | --- |
| **V-IP-01** | Permission ad-hoc trong UI (early-return guest comment); chưa Permission Engine / matrix SoT |
| **V-IP-02** | Guest share / like policy chưa khóa (Q3); entitlement comment chưa chứng minh qua `hasBlock` |

---

## 6. Gap

| Gap | SoT / lớp | Phase xử lý dự kiến |
| --- | --- | --- |
| Không Feature / Store / Host / Resolver | IO · IA · IU | Phase 1–2 |
| Mobile bar→page; thiếu sheet | IU | Phase 1 SoT + Impl sau |
| Like/fav/share không API | IA · PS · API | Phase 3 |
| Stock comments LS SoT | PS | Phase 1 + Phase 4 Migration |
| Counter không Summary Owner | IA | Phase 1–3 |
| Comments market + hydrate 100 | IR | Phase 5 |
| Interest/relevance unwired | API / Analytics | Phase 3+ (Owner) |
| IP-001 matrices / entitlement | IP | Phase 1 |
| Reply tree / realtime / offline | IA mở rộng | Backlog sau v1 |
| Admin moderation deep-dive | — | Backlog (Out Phase 0) |
| Home/Search article ActionBar Summary | IA / IU | Phase 1 nếu mở rộng surface |

---

## 7. Out of Scope

- Không sửa code  
- Không đổi UI / API  
- Không migrate / tối ưu hiệu năng  
- Không tạo Store mới  
- Không khóa Guest YES/NO matrix trong IA (thuộc IP-001)  
- Không deep-dive Admin moderation UI  

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Inventory đủ cho Phase 1 viết SoT | Đạt |
| Gap phân loại | Đạt (§6) |
| Ownership AS-IS rõ | Đạt (§4.4 · §5) |
| Presentation Host thống kê | Đạt (§4.3) |
| Violation nhóm theo SoT Owner | Đạt (§5.2) |
| Baseline Scope→Evidence→Deliverable | Đạt |
| Không đổi Runtime / Business Logic | Đạt |

Checklist:

- [x] Inventory Complete  
- [x] Ownership Complete  
- [x] Presentation Inventory Complete  
- [x] Gap Complete  
- [x] Violation Report SoT-first  
- [x] Không thay đổi Runtime  
- [x] Không sửa Business Logic  

---

## 9. Open Items

1. IO-001 doc + neo Presentation Resolver (Q4)  
2. PS-1.0 Owner duyệt + TTL Summary 30s  
3. Q3 Guest share URL-only → IP-001  
4. Q1 KPI 80KB / 700ms  
5. Summary API counts-only  
6. Admin ↔ InteractionStore boundary  
7. Architecture Review formal PASS (phụ thuộc 1–2 + clean IA)  

---

## 10. Phase Verdict

Phase 0 **Baseline đủ** cho Phase 1 viết SoT: bề mặt, host, owner, PS/IU/IR/IA/IP violations đã gắn đúng SoT Owner.

Lệch lớn nhất so với SoT đã khóa: **V-IU-01/02** (sheet / `matchMedia`) · **V-PS-01** (stock LS) · **V-IA-01** (Counter) · **V-IR-01** (`/binh-luan` hydrate+market).

**Next:** Phase 1 SoT — không Impl Runtime cho đến Architecture Review PASS + SoT Owner duyệt.
