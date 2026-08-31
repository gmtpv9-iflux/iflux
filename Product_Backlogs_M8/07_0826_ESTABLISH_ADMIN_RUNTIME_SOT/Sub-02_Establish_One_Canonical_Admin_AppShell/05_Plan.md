# 05_Plan — Establish One Canonical Admin AppShell

| Field | Value |
|---|---|
| Platform | Admin |
| Module | Admin Platform |
| Task | `Sub-02_Establish_One_Canonical_Admin_AppShell` |
| Tên tài liệu | `05_Plan.md` |
| Status | **OWNER APPROVED** (rev 2 · 2026-08-31 · sửa dependency PUBLIC/FRAGMENT atomic; architecture Solution rev 6 không đổi) |
| Parent | [`04_Solution.md`](04_Solution.md) **rev 6 OWNER APPROVED** · [`03_PRD.md`](03_PRD.md) · [`02_Audit.md`](02_Audit.md) |
| Conform | SOL-01 → SOL-10 · OD-01 → OD-10 |
| Không | Code trong bước này · Product Requirement mới · thiết kế lại AppShell · migrate nghiệp vụ page · đổi Domain SoT · rename `Admin_Design_system` · invent fallback `.ix-content` |

Plan trả lời: **làm gì, thứ tự nào, verify thế nào, khi nào STOP.**  
Architecture chỉ lấy từ Solution. Lệch Solution = FAIL phase.

---

# 0. Architecture lock (không thiết kế lại)

Giữ nguyên Solution §1 · §2b · SOL-02:

```text
AppShell
├── Sidebar / Menu          persistent
└── Main Area
    ├── Header              persistent + sticky (Global + Page Header)
    └── Main Content        persistent host · scroll owner
```

`persistent` ≠ `sticky`.  
Header width = Main Area. Cấm Header full-width sibling Sidebar.  
Page Description = retired (`PAGE_DESCRIPTION_VISIBLE = 0`).  
Một runtime: evolve `IfluxAdminAppShell`. Không V2.

Kỹ thuật scroll (trong ownership Solution): Main Content = overflow/scroll container; Header không nằm trong hộp cuộn đó → cả Global + Page Header giữ trên Main Area. Cấm đảo ownership.

F3H / F8 / sticky / scroll / cleanup 0 consumer: giữ nguyên Solution. Plan chỉ đổi **thứ tự bật**.

---

# 0b. Blocker đã sửa (rev 1 → rev 2)

Rev 1 FAIL: P1/P3 bật FRAGMENT_SOURCE + extract-only `[data-admin-page]` toàn cục **trước** P6 convert page → page legacy không mount.

Rev 2: **không** đổi SOL. Đổi ORDER + activation.

```text
CẤM (rev 1)
  bật rewrite mọi file-backed PAGES
  bật extract-only [data-admin-page] global
      ↓
  rồi mới gỡ chrome / gắn marker ở P6

BẮT BUỘC (rev 2)
  convert page/batch → fragment + [data-admin-page]
      ↓
  verify marker
      ↓
  bật PUBLIC/FRAGMENT + extract TARGET chỉ route đó
      ↓
  verify refresh + internal nav
      ↓
  CONTINUE batch sau
```

Không invent selector mới. Route chưa allowlist = giữ `collectPageOwned` **AS-IS** (Solution §5 AS-IS). Route đã allowlist = TARGET extract (Solution §5 TARGET). `.ix-content` không phải cơ chế migration.

---

# 1. Trace PLAN ← SOL

Mỗi SOL có đúng PLAN item. Phase chỉ **gom** item theo dependency — không bỏ, không thêm SOL.

| PLAN | SOL | Việc Plan (không đổi kiến trúc) | Phase |
| --- | --- | --- | --- |
| **PLAN-01** | SOL-01 | Evolve `IfluxAdminAppShell`. Một shell document. Không V2. Giữ `navigate` / `BOOT_ID` / Page Host identity. | P1 |
| **PLAN-02** | SOL-02 | Layout Sidebar \| Main Area. Header ngoài Host, persistent + sticky cả region. Main Content = scroll owner. | P2 |
| **PLAN-03** | SOL-03 | Sidebar persist + `syncActive`. Visual item = DS `.ifx-nav-*`. Không side-nav structure mới trong DS. | P2 |
| **PLAN-04** | SOL-04 | Page Header owner + DS compose + `setPageHeader` + epoch clear. Writers sau default. Test / paint chỉ route đã convert. | P3 · P5 · P6 |
| **PLAN-05** | SOL-05 | Host chỉ fragment. Extract TARGET `[data-admin-page]` **theo allowlist**. Guard code P1; bật extract theo atomic unit. | P1(code) · P3 · P4 · P6 |
| **PLAN-06** | SOL-06 | Shell load Canonical DS + `platform/admin` layout. Không copy DS vào `iflux-admin-ui`. | P2 |
| **PLAN-07** | SOL-07 | Hội tụ 5 Page Header impl + 5 F8 nav + gỡ 97 chrome copy. Convert **trước** rewrite cùng batch. Cleanup **chỉ** VERIFIED + `ACTIVE_CONSUMER = 0`. | P3 · P4 · P6 · P7 |
| **PLAN-08** | SOL-08 | Auth = EC-02 (không AppShell). F8 đủ evidence Admin → hội tụ. Pattern ngoài PAGES = không hội tụ. | P1 (Auth rào) · P6 (F8) |
| **PLAN-09** | SOL-09 | PUBLIC `/admin/*` = shell document. FRAGMENT `/Admin_Design_system/app/{file}` = fragment. Resolver + 302 + fetch reject shell. **Bật rewrite theo allowlist, không global trước fragment.** | P1(infra) · P3 · P4 · P6 |
| **PLAN-10** | SOL-10 | `#req-search` / `#adm-search` đổi mount → Page Host. Δ API/query/debounce/semantics = 0. Chỉ sau 3 page F3H đã convert. | P4 |

```text
P0  Baseline inventory
P1  PLAN-01 · PLAN-05(guard code) · PLAN-08(Auth rào) · PLAN-09(infra)
    ALLOWLIST = ∅ · AS-IS extract mọi route sống · 0 rewrite PAGES
P2  PLAN-02 · PLAN-03 · PLAN-06
    Page Header slots tồn tại; KHÔNG paint title/bc trừ route allowlist
P3  Atomic canary: PLAN-07(convert) → PLAN-05(extract) → PLAN-09(rewrite)
    + PLAN-04(default+epoch) test trên canary đã convert
P4  Atomic F3H 3 page rồi PLAN-10 remount
P5  PLAN-04(writers) chỉ module mà mọi consumer đã allowlist
P6  Atomic remaining batches + F8 + writers còn lại
P7  PLAN-07(cleanup 0 consumer)
P8  Final verify SOL-01 → SOL-10
```

Gate: phase sau **chỉ** mở khi phase trước PASS.  
Trong P3/P4/P6: batch sau **chỉ** mở khi atomic unit batch trước PASS.  
Cấm: code hết rồi mới test.  
Cấm: gộp convert của batch N với rewrite của batch N+1.

---

# 2. Global RULE

1. Không tạo `IfluxAdminAppShellV2` / process thứ hai.
2. Không Header full-width trên Sidebar.
3. Không chỉ sticky Global Header.
4. Không `PageHeaderState.description` / không `.ifx-page-title > p` trên Header.
5. Không fetch PUBLIC làm fragment.
6. Không copy DS CSS vào `iflux-admin-ui/components.css`.
7. Không đổi Domain SoT / namespace / API store / form-filter-search **semantics**.
8. Không gỡ chrome hàng loạt một commit mù.
9. Không xóa artifact khi `ACTIVE_CONSUMER > 0` hoặc chưa VERIFIED.
10. Lệch Solution → STOP, không “cải tiến”.
11. Không bật rewrite / extract TARGET cho `routeKey` khi file tương ứng chưa có `[data-admin-page]`.
12. Không bật extract-only `[data-admin-page]` **global** khi còn route sống phụ thuộc AS-IS `collectPageOwned`.
13. Không invent fallback `.ix-content` (hay selector mới) trong Plan hoặc code.
14. Canonical Page Header (title/bc/actions) **chỉ paint** khi `routeKey ∈ ALLOWLIST`. Cấm canonical Header + local leftover title/bc cùng lúc.

**Chờ Owner (mọi phase):** PRD/Solution mâu thuẫn mới; cần Product decision; fail không sửa được trong RULE; muốn mở rộng scope.

---

# 3. Safety / rollback (dùng xuyên suốt)

## 3.1 Route rewrite (PLAN-09)

| | Rule |
| --- | --- |
| Allowlist | `CANONICAL_ROUTE_ALLOWLIST` = tập `routeKey` **đã** convert + verify marker. Rewrite PUBLIC→shell **chỉ** key trong list. |
| Canary trước | Atomic unit đầu = **một** `routeKey` file-backed đã persist. Default canary = `users-list` (`/admin/users/list` nếu khớp `PAGES`). Đổi canary = Owner. |
| Dual-path | Rewrite mới **thêm** rule cho key vừa tốt nghiệp. Không xóa rule cũ của key khác. Không “mở rộng mọi file-backed PAGES” sau canary. |
| Marker | PUBLIC document **bắt buộc** `[data-admin-shell-document]`. Fragment **bắt buộc** `[data-admin-page]`. |
| Fetch guard | `navigate` fetch FRAGMENT **chỉ** khi `routeKey ∈ ALLOWLIST`. Body có shell marker → **reject**, không mount. |
| 302 | GET fragment URL trên browser → PUBLIC **chỉ** key đã allowlist. Fetch sau 302 **không** trúng PUBLIC. |
| Auth | `/Admin_Design_system/auth/login.html` **không** vào `/admin/*` shell. |

**Rollback rewrite:** gỡ `routeKey` khỏi allowlist + revert rule rewrite của **đúng** key. Giữ file fragment. `git revert` commit rewrite của batch. Fail unit → rollback unit **trước** batch sau.

## 3.2 Shell / fragment boundary (PLAN-05 · PLAN-09)

| | Rule |
| --- | --- |
| Hai đường — Solution §5, không selector mới | `routeKey ∉ ALLOWLIST` → `collectPageOwned` **AS-IS** (`main.ix-main` children trừ `.ix-navbar`). `routeKey ∈ ALLOWLIST` → TARGET: chỉ `[data-admin-page]`. |
| Cấm | Extract `.ix-content` như migration. Guess selector. Bật TARGET extract khi file chưa có marker. |
| Reject | Trên allowlist: fetch shell hoặc thiếu `[data-admin-page]` → không mount, log, STOP unit. Ngoài allowlist: không áp reject-thiếu-marker (vẫn AS-IS). |
| Rollback extract | Gỡ key khỏi allowlist → route trở lại AS-IS extract. Không “đoán” selector mới. |

Khi **mọi** route Admin sống (file-backed PAGES + F8 đã hội tụ) ∈ ALLOWLIST: đường AS-IS = 0 consumer → xóa ở P7, không trước.

## 3.3 Markup hàng loạt (PLAN-07)

| | Rule |
| --- | --- |
| Batch | Một cụm graph trong [`04_Admin_Migration_Dependency.md`](../04_Admin_Migration_Dependency.md). Không 97 file một lần. |
| Việc được phép | Gỡ chrome/header/intro DOM. Gắn `[data-admin-page]`. **Không** đổi API/store/body nghiệp vụ. CLEANUP-BLOCKED page **vẫn gỡ header** (header ≠ store). |
| Thứ tự trong batch | Convert + verify marker **trước** enable rewrite/extract. Không ngược. |
| Verify từng batch | Persist + không dual header + `PAGE_DESCRIPTION_VISIBLE = 0` trên page batch **sau** enable. |
| Rollback batch | `git revert` commit convert **và** commit rewrite/allowlist của batch. Không xóa artifact shared. |

## 3.4 Cleanup (P7 only)

```text
replace consumer
    ↓
VERIFIED (AC batch)
    ↓
ACTIVE_CONSUMER = 0
    ↓
delete artifact
```

`REPLACED ≠ VERIFIED`. Chưa verify = chưa delete.

## 3.5 Atomic unit (bắt buộc P3 · P4 · P6)

Một page hoặc một cụm graph = **một** unit. Không tách enable sang phase khác.

```text
1 CONVERT   gỡ ix-layout / ix-navbar / local title/bc/actions-header / description
            page file = fragment + [data-admin-page]
2 VERIFY    marker có · chrome shell không còn trong file
3 ENABLE    thêm routeKey vào ALLOWLIST
            rewrite PUBLIC→shell chỉ các key đó
            navigate: fetch FRAGMENT + extract TARGET chỉ các key đó
4 VERIFY    refresh PUBLIC · internal nav · fetch PUBLIC = reject
            Page Header canonical only (0 leftover title/bc trong Host)
5 PASS unit → CONTINUE unit sau
  FAIL      → rollback unit (§3.1 + §3.3) · STOP batch · không mở key mới
```

**Chứng minh không bật fetch canonical sớm**

| Thời điểm | ALLOWLIST | Fetch TARGET / rewrite PUBLIC→shell | Extract |
| --- | --- | --- | --- |
| P0 · P1 · P2 | `∅` | 0 file-backed PAGES | AS-IS mọi route sống |
| Sau P3 PASS | `{canary}` only | chỉ canary | TARGET canary · AS-IS còn lại |
| Sau P4 PASS | canary ∪ 3 F3H | chỉ các key đó | TARGET các key đó · AS-IS còn lại |
| Mỗi unit P6 | ∪ batch vừa PASS | chỉ key đã PASS unit | TARGET ⊆ ALLOWLIST |
| P6 PASS | mọi Admin identity sống (PAGES file + F8 hội tụ) | đủ set sống | AS-IS consumer = 0 |
| P7 | không thêm key | không đổi rewrite | xóa AS-IS extract **chỉ** khi 0 consumer |

Invariant (mọi commit):

```text
∀ routeKey ∈ ALLOWLIST:
    file(PAGES.file) có [data-admin-page]
    và đã VERIFY bước 2 trước ENABLE bước 3

∀ routeKey ∉ ALLOWLIST:
    không rewrite PUBLIC→shell-only
    không fetch FRAGMENT_SOURCE như kênh canonical
    không extract-only [data-admin-page]
    không reject-thiếu-marker
```

Grep/check trước ENABLE: `routeKey` định enable ⊆ file đã có marker. Vi phạm = không merge unit.

---

# 4. Phases

Mọi phase: implement → local verify → PASS? → CONTINUE / STOP.

Evidence ghi ngắn trong folder Sub-02 `gates/P<n>.md` **khi thi công** (không tạo gate lúc viết Plan).

---

## P0 — Baseline (không đổi architecture)

**Scope:** Inventory AS-IS để đo P1+. Không implement layout/route/header.

**RULE:** Chỉ đọc + ghi số. Không sửa runtime.

**AC**
- Có list: `BOOT_ID` / persist Global Header + Sidebar trên 1 internal nav.
- Có list: 97 chrome copy · 5 Page Header impl · 5 F8 nav · F3H `#req-search` `#adm-search` · Auth path.
- `PAGES.file = null` (F8/hub) được liệt kê.
- Có list file-backed `PAGES` (ứng viên allowlist sau này). Default canary `users-list` xác định được `file` + PUBLIC path.

**Test:** Mở 1 Admin persist page; nav nội bộ; ghi recreate Header/Sidebar (AS-IS).

**Evidence:** Bảng count khớp Audit (hoặc delta ghi rõ). Screenshot không bắt buộc.

**PASS:** Inventory đủ để P3 canary + P6 batch.

**STOP:** Không xác định được canary `routeKey` / fragment file.

**CONTINUE:** P1.

---

## P1 — Runtime + infra + Auth — **không bật** kênh canonical  
**PLAN-01 · PLAN-05(guard code) · PLAN-08(Auth rào) · PLAN-09(infra)**

**Scope**
1. Một shell HTML template: `[data-admin-shell-document]`. Evolve `IfluxAdminAppShell` — cùng identity, không V2.
2. Resolver **code**: `publicHref → matchKey → PAGES.file → fragmentHref`. Chưa gắn rewrite sống.
3. Guard **code**: reject body có shell marker; extract TARGET `[data-admin-page]` — **chỉ gọi khi allowlist**. `ALLOWLIST = ∅`.
4. Dual-path rewrite **cơ sở** (file config) sẵn. Rule sống cho file-backed PAGES = **0**.
5. Auth login **không** vào shell.

**Không:** Bật rewrite bất kỳ `PAGES`. Bật extract TARGET global. Layout sticky (P2). `setPageHeader` paint (P3). Gỡ 97 copy. Cleanup. Đổi semantics page. Invent `.ix-content`.

**RULE:** Mọi route sống giữ AS-IS extract (Solution §5 AS-IS). Fetch không bao giờ PUBLIC. Không recursive 302. P1 FAIL nếu một `routeKey` PAGES vào allowlist hoặc bị rewrite shell-only.

**AC**
- `IfluxAdminAppShellV2` = 0.
- `ALLOWLIST = ∅`.
- 0 file-backed `PAGES` có rewrite PUBLIC→shell-only.
- 0 route sống bị reject vì thiếu `[data-admin-page]`.
- Navigate AS-IS 2 page persist: vẫn mount (legacy full-document extract).
- Auth URL không render Sidebar \| Main Area.
- Internal nav: AppShell không reboot (`BOOT_ID` giữ).

**Test**
- Refresh 2 PUBLIC AS-IS (không phải shell-only).
- Sidebar click: hành vi extract AS-IS, page hiện.
- Mở login → không AppShell 3-cột.
- Diff: không rule rewrite PAGES.

**Evidence:** ALLOWLIST dump `∅` · 2 page AS-IS mount · Auth screenshot · list rewrite rules = 0 PAGES.

**PASS:** Mọi AC. Infra tồn tại nhưng **chưa** kích hoạt kênh canonical.

**STOP:** Một page legacy không mount; rewrite PAGES lọt; extract TARGET global; runtime thứ hai; Auth vào `/admin`.

**CONTINUE:** P2. **Cấm** “mở rộng rewrite mọi file-backed PAGES” ở cuối P1.

**Rollback:** Revert infra commits. AS-IS navigate giữ như P0.

---

## P2 — Layout + DS + Sidebar visual  
**PLAN-02 · PLAN-03 · PLAN-06**

**Scope**
1. `platform/admin` layout: Sidebar \| Main Area; Header (Global + Page Header container trống/slots) **trong** Main Area.
2. Sticky: cả Header region. Scroll owner = Main Content.
3. Shell document load Canonical DS + platform layout. Không `@import` copy vào `ix-*`.
4. Sidebar `syncActive` giữ. Item visual `.ifx-nav-item` / icon / label (không DS side-nav structure).
5. Global Header: env/avatar/logout. Search F3H **chưa** đổi mount (P4).
6. Page Header slots **không paint** title/bc/actions (`ALLOWLIST` vẫn `∅`).

**Không:** Writers `setPageHeader` (P5). Gỡ page chrome (P3+). Bật rewrite/extract. Dual header.

**RULE:** Cấm Header full-width trên Sidebar. Cấm chỉ sticky Global Header. Hierarchy mobile: overlay Sidebar, không đưa Header lên trên cột Sidebar như sibling full-width. Cấm default `setPageHeader` trên route AS-IS.

**AC**
- DOM hierarchy khớp Solution §1 (Sidebar sibling Main Area; Header child Main Area).
- Header width = Main Area (không đè Sidebar).
- Sidebar cột full-height AppShell.
- Cuộn fragment/nội dung dài: Header region (Global; Page Header **container**) giữ; chỉ Main Content cuộn.
- Internal nav: Header container + Sidebar không recreate.
- Page Header title/bc **trống** trên route AS-IS (local leftover trong Host vẫn AS-IS — chưa hội tụ).
- 0 copy `.ifx-page-header` rules vào `iflux-admin-ui/components.css`.
- Theme adapter DS `data-theme` trên shell.
- `ALLOWLIST` vẫn `∅`.

**Test:** Desktop 1024+. Cuộn Host. Nav nội bộ + `BOOT_ID`. Đo geometry Header vs Sidebar. 1 page AS-IS: không thấy title AppShell chồng title local như hai header owner.

**Evidence:** DOM tree · screenshot desktop · ghi chú viewport. Mobile overlay nếu làm: evidence hierarchy không đảo.

**PASS:** Mọi AC. SOL-02 frame không còn “Header trên Sidebar”.

**STOP:** Layout SAI frame; Page Header trôi khi cuộn; DS bị copy vào legacy CSS; paint title canonical trên page chưa convert.

**CONTINUE:** P3.

**Rollback:** Revert `platform/admin` + shell CSS/HTML layout commits. Runtime P1 giữ. ALLOWLIST vẫn `∅`.

---

## P3 — Atomic canary + Page Header contract  
**PLAN-07(convert canary) · PLAN-05(extract canary) · PLAN-09(rewrite canary) · PLAN-04(default+epoch)**

**Scope — đúng thứ tự §3.5, default canary `users-list` (đổi = Owner)**
1. CONVERT canary: gỡ chrome/header/intro; file = fragment + `[data-admin-page]`.
2. VERIFY marker trên file canary.
3. ENABLE: `ALLOWLIST = {canary}` · rewrite + fetch FRAGMENT + extract TARGET **chỉ** canary.
4. Page Header: compose DS `.ifx-page-header` · breadcrumb · `.ifx-page-title > h1` · actions. `setPageHeader` + epoch. Default `trailFor` + title registry. **Không** description.
5. Mỗi `navigate` canary: `pageEpoch++` → clear actions → unmount/cleanup → default header → fetch/mount.
6. Test Header **chỉ** trên canary đã convert.

**Không:** Rewrite/extract page khác. Đổi page JS writers hàng loạt (P5). Gỡ 97 file. Cleanup (P7). Invent fallback.

**RULE:** §3.5. Page canary không `getElementById` Header. Action bind epoch. `PAGE_DESCRIPTION_VISIBLE = 0`. Route ∉ allowlist: AS-IS extract + **không** paint Page Header.

**AC**
- File canary có `[data-admin-page]` **trước** commit enable (evidence thứ tự).
- `ALLOWLIST = {canary}` only.
- Canary PUBLIC GET = shell only (`[data-admin-shell-document]`).
- Canary `navigate` fetch = fragment (`[data-admin-page]`).
- Fetch canary PUBLIC URL = reject (không mount).
- Browser GET fragment canary → PUBLIC (302 sau enable).
- 1 page **không** allowlist: vẫn mount AS-IS; không bị reject-thiếu-marker.
- `PAGE_HEADER_CONTAINER_RECREATE = 0` trên internal nav (canary ↔ page AS-IS).
- Canary: default title + crumb đúng `routeKey`; actions empty; 0 `.ifx-page-title > p`.
- Canary: **0** local leftover title/bc trong Host (không dual header).
- Extract canary không kéo Header/Sidebar vào Host.

**Test**
- Thứ tự git/diff: convert → verify → enable, không ngược.
- Refresh canary PUBLIC → shell rồi fragment.
- Sidebar: canary = fetch fragment; page ngoài list = AS-IS.
- DevTools canary: fetch URL ≠ PUBLIC path.
- Nav canary → AS-IS → canary: header text chỉ hiện trên canary; container identity giữ.
- Epoch: action canary không chạy sau khi rời page.
- Rollback diễn tập rewrite canary (gỡ allowlist + revert rule) **một lần** rồi bật lại.

**Evidence:** File canary marker · ALLOWLIST dump · Network canary · page ngoài list vẫn sống · DOM Header canary · Host children = fragment only · 0 leftover title/bc.

**PASS:** Mọi AC. Invariant §3.5 giữ.

**STOP:** Enable trước marker; dual header trên canary; page ngoài list chết vì extract TARGET; fetch trả shell; 302 loop; paint Header trên AS-IS.

**CONTINUE:** P4. **Cấm** thêm PAGES vào allowlist ở cuối P3.

**Rollback:** §3.5 FAIL → revert convert canary + gỡ allowlist + revert rewrite canary. P2 layout giữ.

---

## P4 — Atomic F3H rồi remount search  
**PLAN-07(convert 3 page) · PLAN-05 · PLAN-09 · PLAN-10**

**Scope**
1. Atomic unit §3.5 cho đúng 3 page: partnership (`#req-search`), features (`#adm-search`), bugs (`#adm-search`).
2. Sau 3 page ∈ ALLOWLIST: chuyển node search từ Global Header → Page Host. Cùng id, listener, `q=`, debounce, semantics.

**Không:** Đưa search vào Page Header actions. Không đổi endpoint/placeholder nghiệp vụ. Không rewrite page khác.

**RULE:** Δ behavior/API/data = 0. Chỉ chỗ mount. Convert 3 page **xong và PASS unit** trước remount. Header test trên 3 page đã convert (0 leftover title/bc).

**AC**
- 3 file có `[data-admin-page]` trước enable từng key (hoặc một unit 3 key nếu cùng commit tuần tự convert→verify→enable).
- ALLOWLIST = `{canary} ∪ {3 F3H}` only.
- 3 page: PUBLIC shell + fetch fragment + reject PUBLIC + 0 dual header.
- Node search không còn trong Global Header trên 3 page đó.
- Node nằm trong Host khi page đó active; unmount khi rời page.
- Query/debounce/kết quả như AS-IS (so P0).
- Page khác không lộ 2 search đó trên Header.
- Route ngoài allowlist: AS-IS extract vẫn mount.

**Test:** Atomic 3 page (refresh + internal nav). Gõ search 3 page; so network + kết quả baseline P0.

**Evidence:** ALLOWLIST dump · 3 marker · HAR 1 query · DOM mount path · screenshot Header không còn search.

**PASS:** 3 unit PASS + Δ semantics = 0.

**STOP:** Remount trước convert; đổi API/param; search biến mất; search dính Header mọi page; dual header; enable key chưa marker.

**CONTINUE:** P5.

**Rollback:** Remount lại vị trí P0 nếu PLAN-10 fail. Fail convert: rollback từng key F3H (§3.5). Không giữ behavior search mới.

---

## P5 — `setPageHeader` writers (consumer đã allowlist)  
**PLAN-04(writers)**

**Scope (không migrate nghiệp vụ):**
- Chỉ module mà **mọi** page consumer đã ∈ ALLOWLIST (canary + F3H nếu khớp; Kit/compose **không** switch global nếu còn consumer AS-IS).
- AdminPageKit: ngừng ghi title/bc vào Header; title → `setPageHeader`. **Gỡ** `#adm-page-intro` — **chỉ** khi mọi kit page đã allowlist; nếu chưa → **hoãn P6** cùng batch kit.
- `fillBreadcrumb` / compose (`chu-de-detail-page` / `sources-page.fillPageChrome` / moderation) → `setPageHeader` **chỉ** khi page đó đã convert.
- Dynamic title/crumb sau data: chỉ nếu `epoch === pageEpoch`.

**Không:** Gỡ `ix-layout` 97 file. Không xóa `fillBreadcrumb` file (P7). Không switch writer làm chết page AS-IS.

**RULE:** Không `innerHTML` Header từ page. Intro retired trên page đã convert. Writer shared không đổi nếu còn consumer ∉ ALLOWLIST.

**AC**
- Kit/compose đã switch: không overwrite `#adm-page-bc` / `#adm-page-title` như owner Header.
- `#adm-page-intro` = 0 trên page đã convert trong scope P5.
- `PAGE_DESCRIPTION_VISIBLE = 0` trên page scope.
- Page AS-IS còn lại: vẫn mount; không regress vì P5.

**Test:** Page đã convert trong P3/P4 (+ kit nếu đủ điều kiện). Nav + refresh. 1 page AS-IS smoke.

**Evidence:** Grep writer · list page P5 · list hoãn P6.

**PASS:** Writers đủ điều kiện đã chuyển; phần thiếu consumer = **hoãn P6** (không tự Exclusion).

**STOP:** Page tự dựng Header DOM mới. Switch Kit/shared khi còn consumer AS-IS.

**CONTINUE:** P6.

**Rollback:** Revert writer commits theo file; allowlist + layout P2–P4 giữ.

---

## P6 — Atomic remaining + F8 + writers còn  
**PLAN-07(replace+verify) · PLAN-08(F8) · PLAN-05 · PLAN-09 · PLAN-04(writers hoãn)**

**Scope**
1. Mỗi cụm graph còn lại: **một** atomic unit §3.5. Convert → verify marker → enable → verify nav/header.
2. Writers hoãn từ P5: switch **trong** unit khi mọi consumer cụm đã allowlist.
3. Năm F8 nav identity: mỗi identity (hoặc nhóm Owner cho phép) = unit: gán `PAGES.file` + fragment + `[data-admin-page]` + PUBLIC `/admin/...` rồi mới rewrite/302. Slug cũ `/Admin_Design_system/*.html` → 302 PUBLIC. **Không** Exclusion.
4. Pattern HTML **không** PAGES: không hội tụ.
5. Auth: không đụng.

**RULE:** §3.3 · §3.5. Một cụm / một F8 identity mỗi unit. Verify unit trước unit sau. Không enable key chưa marker. Không dual header.

**AC (mỗi unit)**
- Convert + marker **trước** ENABLE (evidence thứ tự).
- ALLOWLIST tăng **đúng** key unit; không nhảy cóc.
- `PAGE_LOCAL_APPSHELL_MARKUP = 0` trên file unit.
- Dual header = 0 trên page unit.
- Persist Sidebar + Header container.
- Refresh PUBLIC + internal nav + 1 deep link.
- Route chưa unit: AS-IS vẫn mount.
- F8 unit: mở từ Sidebar = cùng AppShell, không chrome tĩnh cạnh.
- `PAGE_DESCRIPTION_VISIBLE = 0`.

**AC (hết P6)**
- Mọi Admin identity sống ∈ ALLOWLIST.
- 0 file-backed PAGES còn AS-IS extract.
- 5 Page Header impl hội tụ về 1 owner (module + `setPageHeader`).
- `PAGE_HEADER_ACTIVE_IMPLEMENTATION = 1`.
- 5 F8 nav hội tụ.
- Pattern ngoài PAGES không bị ép shell.
- Đường AS-IS extract: sẵn sàng 0 consumer (xóa ở P7, không ở P6).

**Test:** Mỗi unit: §3.5 bước 4. F8: 5 item Hướng dẫn. Invariant §3.5 cuối P6.

**Evidence:** File list từng unit · grep `ix-layout` còn · ALLOWLIST cuối = set sống · F8 `file` + PUBLIC path.

**PASS:** Mọi unit VERIFIED. 97 copies = 0 **hoặc** leftover có Owner list (không đoán).

**STOP:** Fetch shell; dual chrome; F8 vẫn `file:null` + static chrome; đụng Auth; enable trước marker; page chưa convert chết.

**CONTINUE:** P7 **chỉ** khi P6 PASS.

**Rollback:** §3.5 từng unit. F8: revert `file` + rewrite 302 + gỡ allowlist key.

---

## P7 — Cleanup 0 consumer  
**PLAN-07(cleanup)**

**Scope — xóa chỉ khi VERIFIED + `ACTIVE_CONSUMER = 0`:**
- `collectPageOwned` AS-IS (sau P6: 0 route dùng).
- `fillBreadcrumb` → `#adm-page-bc` khi 0 id.
- AdminPageKit đoạn title/bc/intro.
- `sources-page.fillPageChrome` crumb/title.
- CSS `.ix-page-title` / `.ix-breadcrumb` **nếu** 0 consumer (kể cả leftover).
- Chrome tĩnh F8 đã hội tụ.

**Không xóa:** Auth login. `ix-*` **trong Host** còn nghiệp vụ (GOV-14) — không phải AppShell chrome. Shared store/page JS (CLEANUP-BLOCKED) — không phải header.

**RULE:** Grep toàn `design_system` + `Admin_Design_system` trước delete. Consumer > 0 → không xóa.

**AC**
- Mỗi artifact xóa: evidence `ACTIVE_CONSUMER = 0`.
- Shell + 3 canary/F3H page + 1 F8: không regress.
- AC-07 AppShell: 0 chrome `ix-layout` / `ix-navbar` / `#adm-page-bc` trên shell/header.

**Test:** Grep + smoke nav.

**Evidence:** Grep output trước/sau · commit delete riêng từng artifact (hoặc nhóm 0-consumer đã chứng minh).

**PASS:** Cleanup list Solution §10 đã xử lý hoặc còn **blocked** có consumer (ghi, không xóa).

**STOP:** Xóa sớm; break sibling CLEANUP-BLOCKED.

**CONTINUE:** P8.

**Rollback:** `git revert` delete commit. Không “sửa tạm” artifact đã xóa.

---

## P8 — Final verify SOL-01 → SOL-10

**Scope:** Không feature mới. Chạy lại AC theo SOL.

| SOL | Verify nhanh |
| --- | --- |
| SOL-01 | 1 runtime · 1 shell document · không V2 |
| SOL-02 | Hierarchy + sticky cả Header + scroll Host + không full-width Header |
| SOL-03 | Sidebar persist · `syncActive` · DS nav items |
| SOL-04 | 1 owner · `setPageHeader` · epoch · 0 description · 0 dual header |
| SOL-05 | Extract fragment only trên mọi route sống · cleanup unmount |
| SOL-06 | DS trên shell · 0 copy vào `ix-*` chrome |
| SOL-07 | 1 impl · 0 local header copy · cleanup chỉ 0 consumer |
| SOL-08 | Auth ngoài shell · F8 hội tụ · pattern ngoài PAGES không ép |
| SOL-09 | PUBLIC≠FRAGMENT · reject · 302 không loop · không fetch canonical page chưa fragment |
| SOL-10 | F3H trên Host · Δ semantics = 0 |

**AC:** `PAGE_HEADER_GLOBAL_OWNER = 1` · `PAGE_LOCAL_HEADER_COPY_COUNT = 0` · `PAGE_DESCRIPTION_VISIBLE = 0` · `APPSHELL_REBOOT = 0` trên internal nav.

**Test:** Desktop refresh + 3 internal nav + 1 F3H page + 1 F8 + login + 1 leftover pattern ngoài PAGES.

**Evidence:** Checklist SOL-01…10 signed trong `gates/P8.md` (khi thi công).

**PASS:** 10/10 SOL.

**STOP:** Bất kỳ SOL FAIL.

**CONTINUE:** Sub-02 implementation complete → `06_Verify.md` (ngoài Plan này).

---

# 5. Local vs phase vs final

| Mức | Khi | Ai |
| --- | --- | --- |
| Local verify | Sau implement **trong** phase / **trong** atomic unit | Agent: AC + Test phase/unit |
| Phase verify | Trước CONTINUE | AC + Evidence đủ · Owner test Staging nếu phase đụng URL/rewrite (P3, P4, P6; P2 layout) |
| Final verify | P8 | Toàn SOL-01…10 |

Deploy: commit + push `staging` khi phase đụng runtime visible. Không deploy cleanup P7 trước P6 PASS. Không deploy rewrite key chưa có marker.

---

# 6. Owner test (Staging) — khi thi công

Không tự mở URL lúc viết Plan. Khi implement:

- P1: login + 2 page AS-IS vẫn vào (chưa shell-only).
- P2: layout + cuộn Header sticky; không dual title trên AS-IS.
- P3: canary PUBLIC + fragment + 1 page ngoài allowlist.
- P4: 3 page F3H.
- P6: 1 page mỗi unit + 5 F8.

---

# 7. Coverage gate Plan

```text
SOL-01 → PLAN-01 → P1
SOL-02 → PLAN-02 → P2
SOL-03 → PLAN-03 → P2
SOL-04 → PLAN-04 → P3 + P5 + P6
SOL-05 → PLAN-05 → P1(code) + P3 + P4 + P6
SOL-06 → PLAN-06 → P2
SOL-07 → PLAN-07 → P3 + P4 + P6 + P7
SOL-08 → PLAN-08 → P1 + P6
SOL-09 → PLAN-09 → P1(infra) + P3 + P4 + P6
SOL-10 → PLAN-10 → P4 (sau convert 3 page)
Orphan SOL = 0
Product Requirement mới = 0
Fallback .ix-content = 0
Rewrite trước fragment = 0
Extract TARGET global khi còn AS-IS consumer = 0
```

---

# 8. Cấm (Plan không làm)

- Thiết kế lại AppShell / thêm vùng / thêm slot description.
- Business page migration (form/table/filter semantics).
- Domain SoT / `Admin_Design_system → admin`.
- Cleanup trước VERIFIED.
- Bỏ phase / gộp P6+P7 / gộp convert batch N với rewrite batch N+1.
- Agent đoán Exclusion F8 hoặc canary khác nếu Owner chưa đổi.
- Bật rewrite mọi file-backed PAGES trước từng page có canonical fragment.
- Bật global extract-only `[data-admin-page]` khi còn route AS-IS.
- Invent fallback `.ix-content`.
- Test / paint Page Header trên page chưa convert.

---

STOP. `05_Plan.md` rev 2. Không code. Chờ Owner review nếu Owner muốn đọc lại; theo chỉ thị sửa đúng = Plan approved.
