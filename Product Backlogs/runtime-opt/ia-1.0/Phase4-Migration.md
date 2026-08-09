# Task 6 — Phase 4 — Migration

**Ngày:** 2026-07-24  
**SoT Governance:** PG-1.0 + PG-008 + PG-009  
**Contracts:** [`Phase2-Runtime-Contract.md`](./Phase2-Runtime-Contract.md) — **PASS**  
**Phase 3 artifact:** [`Phase3-Implementation.md`](./Phase3-Implementation.md) — Evidence ở **§0 Open Gate** (không chỉ claim)  
**Phase 4 Plan:** **PASS** — Owner 2026-07-24  
**Phase 4 Implementation Exit:** **PASS** — Owner 2026-07-24 («tiếp tục hoàn thiện Task 6»)  

**Hướng Phase (khóa):**

> Phase 4 chỉ **chuyển đổi** bề mặt / persistence AS-IS sang Interaction Feature đã ship (Phase 3).  
> **Cấm** redesign SoT / tự sửa Contract / tự sinh rule (PG-008).  
> **Cấm** viết Plan Phase 5 / 6 chi tiết tại đây (PG-009).

---

## 0. Phase 4 Open Gate (PG-001 · PG-009)

> Phase mới chỉ mở khi Prerequisite **có Evidence**, không chỉ dòng “Phase N PASS”.

```text
Phase 3 Slice PASS (Evidence)
        ↓
Phase 3 Checklist / DoD (Evidence)
        ↓
Owner PASS Phase 3 Exit
        ↓
Open Phase 4 Plan (file này)
        ↓
Owner PASS Phase 4 Plan  →  Slice Impl
```

### 0.1 Prerequisite — Phase 3 hoàn thành?

Nguồn Evidence: [`Phase3-Implementation.md`](./Phase3-Implementation.md) (§3.1 · §5.2 · §5.3 · §8 · §10).

| Prerequisite | Status | Evidence (cite) |
| --- | --- | --- |
| Phase 3 Plan PASS | ✓ | Phase3 header · §8 |
| **Slice 1** Foundation PASS | ✓ | Phase3 §3.1 — `interaction/*` + backend Summary/mutate |
| **Slice 2** Article Host PASS | ✓ | Phase3 §3.1 + **RC review bảng** (IO-03/04/06 · IA-01 · API-07 · IP-03 · IU-01/02 · IR) |
| **Slice 3** Shell tabbar Article PASS | ✓ | Phase3 §3.1 — `triggerArticleLike` / `Share`; không `bumpShare` SoT |
| Slice Phase 3 còn mở? | **Không** | Phase3 §3.1: “Slice 4+ Không mở trong Phase 3” → defer Migration |
| Deliverable §5.2 (foundation + Article) | ✓ | Traceability Matrix Phase3 §5.2 (Adapter→Catalog) |
| Checklist §5.3 Article + foundation | ✓ | Phase3 §5.3 tick; mục `/binh-luan`/stock **cố ý defer** Phase 4 |
| Prod smoke Summary API counts-only | ✓ | Phase3 §4 · §8 — `GET …/interaction/summary` · `interaction/*.js` 200 |
| Browser Article Host mount | ✓ | Phase3 §9 — summary+interactive Host, presentation sidebar, Summary API gọi |
| Deploy + CF purge | ✓ | Phase3 §8 checklist deploy |
| **Phase 3 DoD (artifact)** | ✓ | Phase3 §5.4 · §8 · §10 |
| **Owner PASS Phase 3 Exit** | ✓ | Owner 2026-07-24 — kiến trúc + governance |

**Deliverable Phase 3 đã đóng (tóm tắt):**

| Deliverable | Module neo |
| --- | --- |
| Persistence Adapter | `interaction/persistence-adapter.js` |
| API + Store + Permission | `interaction-api.js` · `interaction-store.js` · `permission.js` |
| Resolver + Host + Catalog | `presentation-resolver.js` · `interaction-host.js` · `catalog/index.js` |
| Summary/mutate backend | `backend/.../interaction.service.js` + routes |
| Article surface | `community-post-page.js` + widget boot IX |
| Shell entry Article | `iflux-web-ui.js` tabbar → Host |

**RC review đã PASS (Slice 2 — đại diện surface ship):** RC-IO-03/04/06 · RC-IA-01 · RC-API-07 · RC-IP-03 · RC-IU-01/02 · RC-IR-01…03 — bảng Phase3 §3.1.

**Còn mở sau Phase 3 (đúng Migration — không phải Slice Phase 3 dở):** `/binh-luan` dual · stock LS · IR-05 comments → Scope Phase 4.

### 0.2 Gate verdict

| Điều kiện mở Phase 4 Plan | Kết quả |
| --- | --- |
| Evidence Phase 3 Slice + Deliverable + Checklist + Prod | **Đủ trong artifact Phase 3** |
| Owner PASS Phase 3 Exit | **✓** Owner 2026-07-24 |
| Owner PASS Phase 4 Plan | **✓** Owner 2026-07-24 — Slice Impl được mở |

> **Bottom-sheet chrome:** **không** block Phase 4 DoD / Gate (Owner 2026-07-24). Host đã support presentation; UI chrome = phase UI sau.

---

## 1. Overview

### Task Objective

Chuẩn hóa Interaction Feature theo SoT → Contract → Implementation → Migration: một Feature · Catalog · nhiều Host · Summary ≠ Interactive · PS-1.0 · Runtime sẵn sàng.

### Task Roadmap

| Phase | Objective | Status |
| --- | --- | --- |
| Phase 0 | Audit Baseline · Quan sát | DONE |
| Phase 1 | SoT Architecture · Quyết định | PASS |
| Phase 2 | Runtime Contract · Chuẩn hóa | PASS |
| Phase 3 | Implementation · Hiện thực | **PASS (Owner Exit)** |
| **Phase 4** | **Migration · Chuyển đổi** | **PASS Exit** — 2026-07-24 |
| Phase 5 | Loading & KPI · Tối ưu | **PASS Exit** — [`Phase5-Loading.md`](./Phase5-Loading.md) |
| Phase 6 | Exit · Xác nhận | **PASS** — [`Phase6-Exit.md`](./Phase6-Exit.md) · **Task COMPLETE** |

### Current Phase

**Phase 4 — Migration:** đưa bề mặt còn AS-IS (`/binh-luan`, stock comments LS, dual stack, IR hygiene comments) về đúng RC-* đã khóa bằng Phase 3 foundation.

### Phase Contribution

```text
Task Complete
  ↑ Phase 6 Exit PASS
  ↑ Phase 5 Loading/KPI PASS
  ↑ Phase 4 Migration DoD Exit PASS
  ↑ Phase 3 Impl PASS
  ↑ Phase 2 Contract PASS
  ↑ Phase 1 SoT LOCKED
```

**Phase 4–6 đã đóng.** Xem [`Phase6-Exit.md`](./Phase6-Exit.md).

---

## 2. Objective

> **Foundation đã ship (Phase 3). Phase 4 chỉ migrate AS-IS → Host/API/PS-compliant — không redesign kiến trúc.**
>
> **PG-008 (Owner nhắc):** thiếu API/Contract trong Migration → **STOP** → Update SoT → Regenerate RC → mới code tiếp. Cấm tiện tay sửa Contract/SoT rồi code.

Mục tiêu kiểm chứng được:

1. `/binh-luan` Interactive qua `IfluxInteractionHost` (không dual community/stock UI stack).  
2. Stock comments **không** còn LS authoritative (`iflux_stock_comments_v6`) — API SoT + Adapter (RC-PS-02/04).  
3. Dừng tái diễn Phase 0 IR trên comments: market seed thừa · `hydrateFromApi(100)` mù · collateral `stock-comments-ui` (RC-IR-05).  
4. Mỗi Slice review **PASS theo RC-*** trước khi tuyên bố Phase 4 Exit.

---

## 3. Scope

| # | Scope Migration | Violation / RC neo |
| --- | --- | --- |
| S1 | Wire `/binh-luan` → Interaction Host (mode interactive · presentation `page` / sheet khi Resolver) | V-IO-01/02 · V-IA-03 · RC-IO-* · RC-IU-* |
| S2 | Gỡ dual stack community-ui + stock-comments-ui trên comments surface — Catalog một nguồn | V-IA-03 · RC-IU-01 |
| S3 | IR hygiene comments page: bỏ MARKET thừa · hydrate mù · collateral boot | V-IR-01 · V-IR-03 · **RC-IR-05** |
| S4 | Stock comments: ngừng ghi LS SoT · đọc/ghi qua API + Store · purge key | V-PS-01 · **RC-PS-02 · RC-PS-04** |
| S5 | Cutover / compat: dual-read tạm (nếu cần) → single path → verify Prod | PG-009 DoD |

**Không** trong Phase 4: khóa KPI Q1 80KB/700ms (Phase 5) · Exit Scorecard (Phase 6) · đổi Guest matrix / §7.1 / kinds.

---

## 3.1 Implementation Slices (PG-009)

Mỗi Slice: **Scope · RC · Deliverable · DoD · Evidence trong artifact này**.  
Chỉ mở Slice N+1 khi Slice N PASS (trừ Owner cho phép parallel có điều kiện).

### Slice board (nguồn sự thật tiến độ)

| Slice | Tên | Status |
| --- | --- | --- |
| **4.1** | Comments Page Host wire | **PASS** — 2026-07-24 |
| **4.2** | Dual stack collapse | **PASS** — 2026-07-24 |
| **4.3** | IR hygiene (RC-IR-05) | **PASS** — 2026-07-24 |
| **4.4** | Stock comments LS → API | **PASS** — Exit Owner 2026-07-24 |
| **4.5** | Cutover + Phase 4 Exit | **PASS** — Owner 2026-07-24 |

```text
Phase 4 Migration
  ✓ Slice 4.1
  ✓ Slice 4.2
  ✓ Slice 4.3
```text
  ✓ Slice 4.1–4.4
  ✓ Slice 4.5
```

> Slice 4.4 Exit PASS → Slice 4.5 PASS → Phase 4 Exit PASS.
```

### Slice 4.1 — Comments Page Host wire

| | |
| --- | --- |
| **Scope** | `comments-page.js` + `comments-feature-boot.js` gắn `interaction/boot.js` · `mountInteraction` interactive; Resolver quyết định presentation; Page không `matchMedia` chọn host |
| **RC** | RC-IO-03/04/06/07/08 · RC-IA-02 · RC-IP-* · RC-API-02/03/07 · RC-IU-01/02 · RC-IR-04 |
| **Deliverable** | `/binh-luan` (mọi scope post/stock/…) mount Host; thread scoped `target`; composer/list qua Catalog |
| **DoD** | Review RC; không CommunityStore/StockStore UI++ counter; Summary≠Interactive giữ |
| **Status** | **PASS** — 2026-07-24 (post Host · Prod verify) |

#### Slice 4.1 — RC review

| RC | Kết quả |
| --- | --- |
| RC-IO-03/06 | `mountInteraction` từ Page → Host; Widget không mount |
| RC-IO-04 | Resolver `preferPage` / `forcePage` → presentation `page`; không matchMedia trong Catalog |
| RC-IA-02 | mode `interactive` + `initInteractive` + `loadThread` scoped target |
| RC-API-02/07 | Thread qua Store/API; counter qua `iflux-ix-projection` |
| RC-IU-01 | Catalog agnostic; markup `ifx-com-*` |
| RC-IR-04 | Thread hydrate scoped target (post) |
| PG-008 | Entity scopes chưa API → **giữ AS-IS** tới 4.4 (không bịa endpoint) |

**Evidence Prod:** `/…/binh-luan` post — Host interactive · presentation=page · không `[data-ifx-com-comments]` dual. |

### Slice 4.2 — Dual stack collapse

| | |
| --- | --- |
| **Scope** | Xóa ownership cũ trên surface Interaction (post): một boot · một Catalog · Owner = Interaction Feature |
| **RC** | RC-IU-01 · RC-IO-06 · RC-IA-03 |
| **Deliverable** | `comments-feature-boot.js` tách `IX_FEATURE` vs `ENTITY_LEGACY`; Article widget bỏ `comment-composer` |
| **DoD** | 4 câu hỏi Owner (reviewer) — bảng dưới |
| **Status** | **PASS** — 2026-07-24 |

#### Slice 4.2 — Owner checklist (reviewer)

| # | Câu hỏi | Kết quả (post surface) |
| --- | --- | --- |
| 1 | Hai UI comment cùng surface? | **Không** — chỉ Host/Catalog (`[data-ifx-ix-interactive]`) |
| 2 | Hai boot path cùng khởi tạo? | **Không** — post chỉ `IX_FEATURE` (không nạp stock-comments-ui / community-ui / comment-composer) |
| 3 | Hai Catalog/Composer/List? | **Không** — list+composer qua `IfluxInteractionCatalog` |
| 4 | Owner comments = Interaction Feature? | **Có** — Page cấm fallback stack cũ nếu thiếu Host |
| — | Entity scopes | Legacy **riêng** tới 4.4 — **không** mount Host song song (PG-008) |

**Evidence (re-verify 2026-07-24 — sau khi đứng máy):**

| Nguồn | Kết quả |
| --- | --- |
| Code `IX_FEATURE` array | Chỉ sync + community-store + interaction/boot + comments-page — **không** stock-comments-ui / composer / community-ui |
| Code `ENTITY_LEGACY` | Chỉ load khi `scope ≠ post` |
| CDN HTML + boot | `ixP4s4220260724` |
| Article widget | `comment-composer` = 0 |
| Headless Chrome DOM (post `/binh-luan`) | Q1–Q4 **True**: Host interactive · không dual DOM · không legacy scripts · `base` → `/User_Web/comments/` |

**Fix kèm re-verify (unblock Guest trên `/binh-luan`):** `canAccessPage('comments')` → `community` · path-base/seo-url `binh-luan` → comments dir. Trước đó GuestShell redirect → `/thi-truong` nên browser evidence bị nhiễu.

### Slice 4.3 — IR hygiene trên comments (+ collateral)

| | |
| --- | --- |
| **Scope** | Tuân **RC-IR-05**: `comments` không kéo market seed thừa; không `hydrateFromApi({limit:100})` mù; account/messages không kéo `stock-comments-ui` khi không có Interactive surface |
| **RC** | RC-IR-04 · **RC-IR-05** · RC-IO-06 |
| **DoD** | Evidence Before→After + Deliverable + Checklist dưới — **đủ trong artifact** (không chỉ chat) |
| **Status** | **PASS** — 2026-07-24 (artifact + Headless Prod) |
| **Ranh giới Phase 5** | Đo KPI số KB/ms và khóa Q1 = **Phase 5** |

#### Slice 4.3 — Deliverable → RC

| Deliverable | Module / neo | RC | Status |
| --- | --- | --- | --- |
| Comments boot hygiene | `shell-boot.js` (`comments` → MARKET_CORE) · `comments-feature-boot.js` | **RC-IR-05** | **PASS** |
| Scoped article resolve (không hydrate 100) | `comments-page.js` fetch article; boot không gọi `hydrateFromApi` | **RC-IR-05** · RC-IR-04 | **PASS** |
| Messages collateral cleanup | `widgets/messages-page/index.js` | **RC-IR-05** | **PASS** |
| Account lazy stock-comments | `account-feature-boot.js` · `profile-page.js` `ensureStockCommentsUi` | **RC-IR-05** | **PASS** |
| Không regress IX Host | Headless `/binh-luan` post còn `data-ifx-ix-host` | RC-IO · RC-IR-04 | **PASS** |

#### Slice 4.3 — Evidence (Before → After)

| Hiện tượng | Trước (Phase0 / pre-4.3) | Sau (Slice 4.3) |
| --- | --- | --- |
| `comments ∈ MARKET_PLATFORM_PAGES` | Có → load seed + registry + ecosystem | **Không** — chỉ `MARKET_CORE` (seo + mock + taxonomy) |
| `hydrateFromApi({ limit: 100 })` trên comments boot | Có (mù) | **Không** — resolve bài scoped trong `comments-page` |
| Messages preload `stock-comments-ui` / composer / stock-store | Có (eager tier) | **Không** — không tải khi không phải comment surface |
| Account eager `stock-comments-ui` + preload `getComments(HPG/VCB/FPT)` | Có | **Không eager** — lazy khi timeline; không preload 3 mã |
| Market seed trên DOM `/binh-luan` post | Có (PLATFORM) | **Không** — Headless: không `iflux-market-seed-data` / registry / ecosystem-seeds |
| Interaction Host trên `/binh-luan` post | Có (4.1) | **Giữ** — không regress |

**Evidence kỹ thuật (Prod · 2026-07-24):**

| Nguồn | Kết quả |
| --- | --- |
| Code `MARKET_PLATFORM_PAGES` | Không còn `comments: 1` |
| Code `MARKET_CORE_PAGES` | Có `comments: 1` |
| Code `comments-feature-boot.js` | Không gọi `hydrateFromApi`; chỉ ghi chú RC-IR-05 |
| Headless Chrome DOM post `/binh-luan` | Title Bình luận · boot `ixP4s4320260724` · Host IX · không seed/registry · không `stock-comments-ui` |
| `messages-page/index.js` | Không eager path `stock-comments-ui.js` (chỉ comment RC) |
| `account-feature-boot.js` | Không eager path; không `getComments` preload |

#### Slice 4.3 — Checklist (DoD Slice)

- [x] Không market seed / registry / ecosystem trên Critical Path comments (**RC-IR-05**)  
- [x] Không `hydrateFromApi(100)` mù trên comments boot (**RC-IR-05**)  
- [x] Không collateral eager `stock-comments-ui` trên Messages (**RC-IR-05**)  
- [x] Account: không eager stock-comments + không preload HPG·VCB·FPT; lazy khi timeline (**RC-IR-05**)  
- [x] Không regress Interaction Host trên `/binh-luan` post (**RC-IO**)  
- [x] PG-008: không sửa Contract / không tự sinh rule  

### Slice 4.4 — Stock comments LS → API SoT

| | |
| --- | --- |
| **Scope** | `stock-store.js` / entity `/binh-luan` / stock comment surfaces: business qua Interaction API+Store; **cấm** ghi mới authoritative `iflux_stock_comments_v6` (**RC-PS-04** · **RC-API-12**) |
| **RC** | **RC-PS-01…04** · **RC-API-08…12** · RC-API-02/03/07 · RC-IO-* |
| **Deliverable** | Canonical Thread API + Store dual-read/migrate; entity scopes Host; alias post giữ |
| **DoD** | RC-PS-04 / RC-API-12 trên surface đã ship; entity `/binh-luan` qua Host (không dual LS UI) |
| **Status** | **PASS** — Exit Owner 2026-07-24 · Q-4.4-A…D · RC-API-08…12 |

#### Slice 4.4 — Owner PASS Q-4.4 (KHÓA)

| # | Quyết định | Status |
| --- | --- | --- |
| **Q-4.4-A** | Thread target v1 = `post\|stock\|sector\|family\|story` (+ alias). Platform `(entityType, entityId)`. **Không** gộp Follow/Watchlist. Registry **ĐÓNG** | **PASS** |
| **Q-4.4-B** | Canonical `/api/interaction/v1/threads/{type}/{id}/…`; payload `body`+`image?`; `parentId` optional; alias post bắt buộc | **PASS** |
| **Q-4.4-C** | Summary counts-only: likes/comments/shares (+ favorites/views nếu có). Không `participantCount` DoD 4.4 | **PASS** |
| **Q-4.4-D** | WRITE chỉ API từ Impl 4.4; dual-read API→LS; migrate one-shot; purge key sau Phase 4 Exit | **PASS** |

```text
STOP (đã đóng)
  → Update SoT (IA-001 §6b · IA-003 §3b–3d)     ✓
  → Regenerate RC (RC-API-08…12)                 ✓
  → Owner PASS delta                             ✓ 2026-07-24
  → mở lại Slice 4.4 Impl                        ← hiện tại
```

#### Slice 4.4 — PG-008 STOP Gate (lịch sử — đã đóng)

> Migration từng thiếu Contract/API → STOP. Đã Update SoT + RC + Owner PASS — **không** còn quyền tự sinh Contract ngoài RC-API-08…12.

| Hạng mục | Sau PASS |
| --- | --- |
| IA-003 Thread + target matrix | **Đủ** — IA-001 §6b · IA-003 §3b |
| Backend / client AS-IS post-only | **Impl 4.4** mở rộng theo RC-API-08…12 |
| LS `iflux_stock_comments_v6` | Dual-read + cấm WRITE mới; purge ở 4.5 |

#### Slice 4.4 — Checklist (Impl)

- [x] Rà SoT / RC trước Impl (**PG-008**)  
- [x] Owner PASS Q-4.4-A…D → Update SoT → RC  
- [x] Impl canonical Thread + Summary cho registry (`/api/interaction/v1` · bảng `interaction_comments`)  
- [x] Alias post giữ hoạt động (canonical → fallback community)  
- [x] Entity `/binh-luan` → Host + Store (dual-read · migrate one-shot)  
- [x] **CẤM** ghi mới authoritative LS trên surface IX (`setAuthoritativeWriteEnabled(false)`)  
- [x] Evidence Prod 2026-07-24 — API summary/thread stock 200; FE boot `ix44b20260724`; CF purge  
- [x] **Owner PASS Exit 4.4** — Owner “tiếp tục” 2026-07-24 → mở Slice 4.5

#### Slice 4.4 — Exit Evidence Pack (2026-07-24) — **PASS**

| # | Tiêu chí Owner | Evidence | Verdict |
| --- | --- | --- | --- |
| E1–E5 | Exit pack 4.4 | Xem bảng E1–E5 phía trên | **PASS** (Owner tiếp tục) |

```text
Slice 4.4
Implementation  ✅ PASS
Exit            ✅ PASS (Owner 2026-07-24)
```

### Slice 4.5 — Cutover + Phase 4 Exit (purge / retire LS)

| | |
| --- | --- |
| **Scope** | Xóa dual-read · CTA entity pages → `/binh-luan` · WRITE off + warn · purge key có guard · gỡ `stock-comments-ui` khỏi load path · No Regression Matrix · DoD Phase 4 |
| **RC** | RC-API-12 · RC-PS-04 · RC-IR-05 |
| **Status** | **PASS** — `ix45Purge20260724` + auth fix · Owner Exit 2026-07-24 |

#### Slice 4.5 — No Regression Matrix

| Surface | Kỳ vọng | Tick |
| --- | --- | --- |
| Article `/binh-luan` | Không đổi (Host + API post) | [x] giữ Phase 3/4.2 |
| Stock `/binh-luan` | API Host | [x] Prod smoke 2026-07-24 |
| Sector `/binh-luan` | API Host | [x] API+FE path (auth UI) |
| Family `/binh-luan` | API Host | [x] API+FE path |
| Story `/binh-luan` | API Host | [x] API+FE path |
| Stock page | CTA → `/binh-luan` | [x] code+manifest (auth gate) |
| Group page | CTA → `/binh-luan` | [x] code+widget (auth gate) |
| Profile | Empty state | [x] |

#### Retire key + Rollback

> **`iflux_stock_comments_v6` chính thức RETIRED.**  
> Không đọc · không ghi · không migrate client · không restore · không rollback từ LS.

```text
Rollback FE: restore build trước ix45 (vd. ix44b)
Không restore LocalStorage / không rollback key đã retire
Dữ liệu authoritative = API
```

#### Definition of Done (Phase 4) — khóa

- Interaction chỉ còn một nguồn dữ liệu duy nhất (API).
- Không còn code path đọc hoặc ghi `iflux_stock_comments_v6` (key **retired**).
- Mọi điểm truy cập bình luận điều hướng tới Comments Host (`/binh-luan`) hoặc Host trực tiếp.
- LocalStorage không còn authoritative storage.
- Phase 5 được phép phát triển **không** duy trì tương thích LS.

**Backlog (không chặn DoD trừ Owner bắt buộc):** bottom-sheet chrome đầy đủ (V-IU-01).

---

## 4. Evidence

| Nguồn | Dùng |
| --- | --- |
| Phase0 §4.3–4.9 · §5.2 | AS-IS dual · LS · IR · Violation ID (baseline) |
| Phase2 RC-IR-05 · RC-PS-04 | Luật migrate bắt buộc |
| Phase3 Host/API/Catalog | Neo Impl tái sử dụng |
| **Slice Evidence §3.1** | **Nguồn sự thật tiến độ Phase 4** (4.1–4.3 PASS) |

### 4.1 Evidence snapshot — còn lại sau Slice 4.3

| Hiện tượng | Status sau 4.3 | Target |
| --- | --- | --- |
| Boot comments dual + hydrate 100 | **Đã đóng** (4.1–4.3) | — |
| `comments ∈ MARKET_PLATFORM` | **Đã đóng** (4.3 → CORE) | — |
| Messages/Account eager stock-comments | **Đã đóng** (4.3) | — |
| LS SoT `iflux_stock_comments_v6` | **RETIRED** (4.5) | RC-API-12 |
| Entity scopes trên `/binh-luan` | **Host + API** (Impl 4.4) | RC-API-08…12 |
| Article Detail Host | Giữ (Phase 3) | Không regress |

---

## 5. Deliverables

### 5.1 Scope → Evidence → Deliverable

| Scope | Evidence | Deliverable |
| --- | --- | --- |
| S1 Host `/binh-luan` | Phase0 presentation · comments-page | Comments Host wire + boot IX |
| S2 Dual stack | Phase0 §4.9 · V-IA-03 | Single Catalog path |
| S3 IR hygiene | V-IR-01/03 · RC-IR-05 | Shell/feature boot clean |
| S4 Stock LS | V-PS-01 · RC-PS-04 | API SoT + purge |
| S5 Cutover | Deploy + smoke | Phase 4 Exit evidence |

### 5.2 Traceability Matrix (Deliverable → RC → SoT)

| Deliverable | Module / neo | RC | SoT |
| --- | --- | --- | --- |
| Comments Host | `comments-page.js` + `interaction/*` | RC-IO-* · RC-IA-02 · RC-IR-04 | IO-001 · IA-002 |
| Dual collapse | boot FEATURE · Catalog | RC-IU-01 · RC-IO-06 | IU-001 · IA-001 |
| IR comments clean | `shell-boot.js` · feature boots | **RC-IR-05** | IR-001 |
| Stock migrate | `stock-store` / stock comment page → API+Store | **RC-PS-02/04** · RC-API-* | PS-1.0 · IA-003 |
| Purge key | Adapter + storage catalog | RC-PS-04 | PS-1.0 |

### 5.3 Migration invariant checklist (gate)

- [x] `/binh-luan` (post) mount Host Interactive; không dual feed/composer (**RC-IO · RC-IU**) — Slice 4.1–4.2  
- [x] Không `matchMedia` / Component chọn presentation trên Catalog (**RC-IU-02**) — Slice 4.1–4.2  
- [x] Counter Projection Refresh trên surface IX (không UI++ authoritative) (**RC-API-07**) — Slice 4.1  
- [x] `comments` không market seed thừa + không hydrate 100 mù (**RC-IR-05**) — Slice 4.3  
- [x] account/messages không eager `stock-comments-ui` ngoài surface (**RC-IR-05**) — Slice 4.3  
- [x] Không ghi mới authoritative `iflux_stock_comments_v6` (**RC-PS-04**) — **Slice 4.4–4.5** (key **RETIRED**)  
- [x] Article Detail Phase 3 **không regress** — giữ qua 4.1–4.3  
- [x] PG-008: không sửa Contract / không tự sinh rule — giữ  

### 5.4 Definition of Done (Phase 4)

> **Compile ≠ Done.**  
> Phase 4 PASS khi Slice 4.1–4.5 PASS + Checklist §5.3 tick + Evidence Prod.

| Done khi | Không đủ |
| --- | --- |
| Host trên `/binh-luan` + dual collapsed | Chỉ thêm IX boot song song dual cũ |
| LS stock comments hết authoritative | “Tạm giữ LS + mirror API” vô hạn |
| RC-IR-05 comments + collateral | Chỉ bỏ 1 trong 3 (market / hydrate / collateral) |
| Review cite `RC-*-nn` | “Chạy được là xong” |

---

## 6. Gap

| Gap | Ghi chú |
| --- | --- |
| **Entity Thread API + target matrix** | **Đã khóa** — IA-001 §6b · IA-003 · RC-API-08…12 · **Impl 4.4** |
| Backend chỉ `post`/`article` | `interaction.service` `IX_TARGET_UNSUPPORTED` |
| Bottom-sheet chrome (V-IU-01) | Backlog — không chặn DoD trừ Owner bắt buộc |
| Feed Summary vẫn CommunityStore stats | Ngoài Migration Interactive; Phase 5/IR nếu Owner mở |
| KPI Q1 số đo | **Phase 5** |

---

## 7. Out of Scope

- Redesign Ownership / Permission / §7.1 / Domain kinds  
- Sửa RC-* “cho tiện migrate” (PG-008)  
- **Plan / Scorecard Phase 5 · 6** chi tiết  
- Khóa Q1 KPI · Exit Scorecard toàn Task  
- Hợp thức hóa AS-IS dual / LS như SoT  

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Phase 4 Plan (Governance + Direction + Slices) | **PASS** — Owner 2026-07-24 |
| Traceability · DoD · PG-009 | Đạt (định nghĩa + Slice Evidence trong §3.1) |
| Slice 4.1 Host wire | **PASS** |
| Slice 4.2 Dual collapse | **PASS** |
| Slice 4.3 IR-05 hygiene | **PASS** (artifact đầy đủ) |
| Slice 4.4 Stock LS → API | **PASS** (Exit Owner 2026-07-24) |
| Slice 4.5 Cutover + Exit | **PASS** — Owner 2026-07-24 |
| Phase 4 Implementation Exit | **PASS** — Owner 2026-07-24 |

Khi Owner PASS Phase 4 Exit → mở Plan Phase 5. → **đã mở** [`Phase5-Loading.md`](./Phase5-Loading.md).

---

## 9. Open Items

1. ~~Owner PASS Phase 3 Exit~~ · ~~Owner PASS Phase 4 Plan~~ — **xong**  
2. ~~Slice 4.1–4.3 artifact PASS~~ — **xong**  
3. ~~Q-4.4-A…D + Update SoT + RC-API-08…12~~ — **PASS** 2026-07-24  
4. ~~Slice 4.4 Impl + Exit~~ — **PASS** 2026-07-24  
5. ~~Slice 4.5 Cutover~~ — **PASS** 2026-07-24  
6. ~~Owner PASS Phase 4 Implementation Exit~~ — **PASS** 2026-07-24  
7. Bottom-sheet chrome — **không block** Phase 4  
8. ~~Không mở Plan Phase 5 trước Phase 4 DoD Exit~~ — **Phase 5–6 PASS · Task COMPLETE**

---

## 10. Phase Verdict

**Phase 4 Implementation Exit: PASS** (Owner 2026-07-24).

```text
Phase 4
  ✓ Slice 4.1–4.5
  ✓ Phase 4 Exit
  ✓ Phase 5 Exit
  ✓ Phase 6 Exit
→ Task 6 COMPLETE
```

**Next:** không còn Slice Task 6. Backlog UI (bottom-sheet chrome) ngoài scope. **Không** tái sinh `iflux_stock_comments_v6`.
