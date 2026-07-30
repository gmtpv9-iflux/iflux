# SoT — Resource Loading Strategy (Task 4)

**Trạng thái:** SoT **v1.6** · Plan-trước-Thi-công bắt buộc (§0.13) · chờ Owner duyệt v1.6 + Plan Phase 0  
**Nguồn thống nhất:** Consume Task 3 (`SoT — Trình tự tối ưu Runtime`) · Exit 0/A/B/C PASS · PSI / Coverage / Network (Owner cung cấp)  
**Người ra lệnh từng Phase:** Owner (bạn). Agent **không** tự nhảy Phase.  
**Deliverable Phase:** `docs/runtime-opt/loading/Phase*.md` · `Gate.md` (một Phase = một file)  
**Review v1.5:** Consumer Mapping · Dependency Depth · Cost Profile (Transfer cứng / Parse·Execute·Memory soft) · Phase B = Architecture Design · Consumer Drift Gate  
**v1.6:** **Plan bắt buộc trước mọi Phase** (§0.13) — bám sát SoT · Owner duyệt Plan → mới «Thi công»  

---

## MỤC ĐÍCH TỔNG THỂ (đọc trước mọi Phase)

Phần này **bắt buộc đứng đầu** mọi tài liệu / file Phase Task 4.

### Đích đến của Task 4

Chuẩn hóa và tối ưu **chiến lược tải tài nguyên** trên User Web:

- đúng **đối tượng** (ai được nhận resource)  
- đúng **thời điểm** (Loading Policy)  
- đúng **nhu cầu** (Necessity + Usage từ PSI/Coverage)  
- đúng **đơn vị tải** (Resource Architecture — tách/ghép khoa học)

**Khi xong Gate + MR:** Policy Catalog + Architecture Catalog khớp Runtime (Drift = 0) · không eager/duplicate sai · không regression Ownership/Runtime Task 3.

### Hai trụ SoT (thiếu một trụ → không đạt mục tiêu)

| Trụ | Trả lời | Catalog |
|-----|---------|---------|
| **1. Loading Policy** | *Khi nào / điều kiện nào* được tải? | §2 |
| **2. Resource Architecture** | *Cắt / ghép / coupling thế nào* để phân phối tải? | §3 |

```text
Justification + Necessity + Usage
+ Consumer Mapping + Dependency Depth + Cost
        ↓
Resource Architecture
        ↓
Loading Policy
        ↓
Implementation
```

### Hành trình các Phase

| Phase | Nhắm vào | Mục đích trong hành trình |
|-------|----------|---------------------------|
| **0 · Baseline** | Catalog trang + PSI Owner | Đóng băng phạm vi URL + list JS/CSS chặn hiển thị |
| **A · Loading Analysis** | Từng resource (theo trang có PSI) | Depth · Consumers · Cost · Necessity · Policy gợi ý · split? |
| **B · Architecture Design** | Đơn vị tải | Architecture Catalog (§3) — Unit · Slab · Satellite · Coupling |
| **C · Loading Plan** | Policy + wave | Policy Catalog (§2) + thứ tự thi công |
| **D · Implementation** | Code Production | Thực thi hai Catalog |
| **Gate · Verification** | Drift = 0 | Policy · Architecture · **Consumer** Drift = 0 → MR |

**Thứ tự bắt buộc:** 0 → A → B → C → D → Gate → MR.

### Task 4 không làm lại Task 3

| Task 3 đã chốt (consume) | Task 4 |
|--------------------------|--------|
| Ownership · Dependency · Manifest · Feature Runtime | **Không** Audit / thiết kế lại |
| Chuỗi Inventory → Owner → Dep → Manifest | **Thay bằng** Baseline → Loading Analysis → … |

Task 3 trả lời *hệ thống là gì / ai own*. Task 4 trả lời *vì sao tải / dùng bao nhiêu / tách & Policy thế nào* — input chính = **Google PageSpeed (Owner gửi đủ mỗi trang)**.

**Cấm** đặt tên Phase «Audit» (Agent sẽ lặp Task 3).

### Luật chơi chung (nhắc ngắn)

1. **§0 Invariant** đứng đầu mọi Phase file.  
2. **Scope:** Allowed / Not Allowed / Out of Scope.  
3. **Gate** chỉ Loading Policy + Resource Architecture — không Gate Business / UI / Permission / Ownership lại.  
4. **Một Phase = một file.**  
5. Mỗi nội dung trang mới: Owner gửi **PSI Package** (JS/CSS chặn hiển thị đủ) — §0.12 · §14.  
6. Agent **không** tự nhảy Phase.  
7. **Trước mọi Phase:** Agent **lập Plan** bám sát SoT → Owner **duyệt Plan** → mới **«Thi công»** (§0.13). Cấm thi công khi chưa có Plan đã duyệt.

Chi tiết khung làm việc · phân biệt Analysis · câu hỏi SoT: §4 · §5 · §6.

---

## 0. Invariant xuyên suốt (luật không được phá)

### 0.1 Không đổi Owner

- Một resource vẫn **một Owner** (SoT Runtime Task 3 §0.1).  
- Đổi Policy **không** được kéo theo đổi Owner (vd không «lazy nên chuyển `block-templates` sang Feature»).  
- Phát hiện đổi Owner trong thi công Task 4 → **Phase FAIL** · rollback Phase.

### 0.2 Không đổi Dependency Rule

- Feature vẫn chỉ nhờ Shell + Definition.  
- Widget vẫn qua Widget Pipeline.  
- Cấm «tối ưu tải» bằng cách import chéo phá §0.4 Runtime.

### 0.3 Không tự sinh SoT mới

- Agent chỉ tiêu thụ SoT này + Catalog Policy Owner đã duyệt trong Phase.  
- Thiếu Policy cho một resource class → **dừng · báo Owner** — không đoán Idle vs Click.

### 0.4 Task 4 được đổi Loading Strategy + Resource Architecture

Được phép:

- Đổi **khi nào** gọi `loadScript` / `import()` / idle chain / click handler (**Policy**).  
- Đổi **đơn vị tải**: tách/ghép file hoặc module *phục vụ tải* theo Architecture Catalog (**Resource Architecture** §3).  
- Tách Startup → Idle / Auth / Route / Click / … theo Policy gắn trên từng đơn vị.  
- Thêm guard «chưa đủ điều kiện Policy → không tải».

**Cấm** nhân tiện:

- Sửa Business Logic · công thức Widget · Permission / Entitlement nghiệp vụ · API Contract · copy UI · Placement Admin.  
- Đổi Runtime Owner / Dependency Rule Task 3.  
- Tự tách/ghép ngoài Architecture Catalog (§0.8 · §3).

### 0.5 Không phá kết quả Task 3

- Phase A/B/C Runtime **PASS** = đóng băng Ownership / Definition / Feature Runtime.  
- Task 4 **không** sửa Header nghiệp vụ, PD title pipeline, Feature Manifest schema, State Machine — trừ **Regression Task** Owner mở riêng.  
- Regression loading (tải trùng vì sai strategy) = **đúng phạm vi** Task 4.

### 0.6 Rollback

Một trang / một nhóm resource FAIL Acceptance Phase hiện tại:

1. Rollback **toàn bộ Phase hiện tại**.  
2. Không sang Phase sau.  
3. Cập nhật Backlog.  
4. Sửa theo Plan đã duyệt (hoặc chỉnh Plan nếu Owner đồng ý).  
5. Chạy lại Verification / Acceptance Phase đó.

### 0.7 Policy trước Code

Không được viết loader mới khi resource **chưa** có dòng trong Policy Catalog (Phase C trở đi) và unit trong Architecture Catalog (Phase B trở đi).  
Policy + Architecture đích = SoT; code chỉ *thực thi* (Phase D).

### 0.8 Catalog Ownership — ai được gán Policy *và* Architecture tải

**SoT duy nhất quyết chiến lược tải + hình dạng đơn vị tải:**

| Catalog | Quyết định |
|---------|------------|
| **Loading Policy Catalog** (§2) | Policy (Startup / Idle / …) |
| **Resource Architecture Catalog** (§3) | Đơn vị tải · coupling · tách/ghép |

| Ai | Policy | Resource Architecture |
|----|--------|------------------------|
| Hai Catalog trên (+ Owner duyệt) | ✓ | ✓ |
| Feature / Widget / HTML | ✗ tự đổi | ✗ tự `import` / tách file «cho tiện» |
| Agent thi công | Chỉ *thực thi* Catalog đã duyệt | Chỉ *thực thi* |

Runtime Owner (Task 3) **tiêu thụ** cả hai Catalog — không ban hành.  
Vi phạm → Drift FAIL.

### 0.9 Policy Change Rule (tương đương Regression Rule Task 3)

**Cấm tự ý nặng Policy** (làm tải sớm / rộng hơn), ví dụ:

```text
Click  → Startup   ✗
Idle   → Startup   ✗
Hover  → Startup   ✗
Viewport / Widget Mount → Startup   ✗
Auth+Click → Auth+Startup (bỏ Click)   ✗
```

**Chỉ được đổi Policy khi đủ cả ba:**

1. **Loading Analysis** (Justification + Necessity + Usage/Coverage + ảnh hưởng trang mẫu)  
2. **Evidence** (PSI / Network / call stack trước–sau)  
3. **Owner approve** (cập nhật Catalog §2)

Đổi **nhẹ hơn** (Startup → Idle/Click/Route…) vẫn phải qua Catalog + Owner — hướng mặc định khi Necessity = Later/Never-on-startup.

### 0.9b Architecture Change Rule

**Cấm** tự tách/ghép/đổi coupling đơn vị tải ngoài Catalog §3.

Đổi Architecture (vd tách `mock-market` khỏi Startup slab Cộng đồng) chỉ khi:

1. Loading Analysis: Justification + Necessity + Usage (PSI/Coverage)  
2. Bản ghi Architecture đích trong §3 (unit map)  
3. Policy gắn lại từng unit (§2)  
4. Owner approve  
5. Evidence Network/PSI sau đổi

**Cấm:** cắt file vì «nặng» khi chưa có dòng Architecture Catalog.

### 0.10 Chuỗi bắt buộc — Architecture là trụ, không phải bước phụ

```text
Network thấy resource
    ↓
Dependency Depth + Consumer Mapping
    ↓
Necessity + Usage + Cost (Transfer…)
    ↓
Resource Architecture (§3) — Architecture Design
    ↓
Loading Policy (§2)
    ↓
Implementation
```

**Cấm:** thấy nặng → xóa/defer mù.  
**Cấm:** có Policy «nên Click» nhưng Architecture vẫn một file béo buộc Startup cả cục.  
**Cấm:** «phân phối khoa học» khi chưa có Architecture Catalog.

### 0.11 Scope Boundary (Task 4)

| | Nghĩa | Ví dụ trong / ngoài |
|--|-------|---------------------|
| **Allowed** | Được sửa | Loading Policy · **Resource Architecture (unit/coupling phục vụ tải)** · Lazy/defer/split theo Catalog · Guard Route/Auth/Click/… · **Loading Analysis** trên PSI/Coverage/Network · Evidence · Phase deliverable |
| **Not Allowed** | Không được sửa | Business Logic · Widget Formula · Permission nghiệp vụ · API Contract · UI/DS · Runtime Ownership · Dependency Rule Task 3 · Manifest schema · State Machine · PD renderer · Feature/Widget/HTML tự đổi Policy/Architecture |
| **Out of Scope** | Thấy nhưng cố tình bỏ qua | Backend/CDN/ảnh · Cloudflare beacon · OI-H4 trừ Owner kéo · OI-RT-MOUNT · PJAX đầy đủ · Đổi Placement Admin |

> **Out of Scope ≠ Not Allowed:** Not Allowed = cấm đụng. Out of Scope = được nhìn thấy trong Analysis, ghi Backlog Future, **không** thi công trừ Owner mở rộng Scope.

### 0.12 Owner PSI Package — bắt buộc trước mỗi nội dung trang

**Nội dung** = một trang (hoặc một nhóm URL cùng `pageKey`) trong **Catalog trang phạm vi §14** đang được mở để Baseline / Loading Analysis / Implementation / Verification.

| Thành phần gói Owner (tối thiểu) | Bắt buộc? |
|----------------------------------|-----------|
| URL công khai đầy đủ (vd `https://iflux.vn/cong-dong`) | Có |
| `pageKey` / tên trang khớp Catalog §14 | Có |
| View **Google PageSpeed Insights** — danh sách **JS và CSS đã chặn hiển thị (render-blocking) đầy đủ**, không cắt bớt | **Có** |
| (Khuyến nghị) PSI: unused / dùng một phần / ước tính tiết kiệm | Nên có |
| (Khuyến nghị) Coverage / Network paste | Tuỳ Owner |

```text
Owner chọn trang trong Catalog §14
    ↓
Owner gửi PSI Package (blocking JS/CSS đủ)
    ↓
Agent mới làm Baseline / Analysis / Impl / Verify trang đó
```

**Cấm:** Agent tự suy list blocking hoặc tối ưu trang chưa có PSI Package.  
**Cấm:** Dùng PSI trang A làm bằng chứng cho trang B.  
**Cấm:** Bắt đầu «nội dung mới» khi Catalog §14 chưa có dòng trang đó (trừ Owner thêm vào Catalog trước).

### 0.13 Plan trước Thi công — bắt buộc mọi Phase

Áp dụng cho **mọi** Phase Task 4: **0 · A · B · C · D · Gate**.

```text
Owner ra lệnh mở Phase (vd «Lập Plan Phase 0»)
    ↓
Agent lập Plan trong docs/runtime-opt/loading/Phase*.md
    · bám sát đúng mục tiêu / Input / Làm gì / Cấm / Acceptance SoT của Phase đó
    · Status = PLAN · chưa Evidence thi công
    ↓
Owner review + duyệt Plan («Duyệt Plan Phase X» / chỉnh Plan)
    ↓
Owner ra lệnh «Thi công Phase X» (+ PSI Package nếu Phase/trang yêu cầu §0.12)
    ↓
Agent thi công đúng Plan đã duyệt · cập nhật cùng file Phase (Evidence · Acceptance)
    ↓
Owner Exit PASS → mới mở Plan Phase sau
```

| Bắt buộc trong Plan | Nội dung |
|---------------------|----------|
| Neo SoT | Số mục SoT Phase đó (vd Phase 0 = §7 · §0.12 · §14) |
| Đích Phase | Khớp cột «Mục đích» hành trình SoT — không tự đổi scope |
| Scope Boundary | Allowed / Not Allowed / Out of Scope |
| Deliverable | Đúng output SoT (vd P0 = Catalog + Evidence PSI) |
| Acceptance | Checklist copy từ SoT Phase · không tự nới |
| Việc Agent sẽ làm | Checklist thi công cụ thể · **không** Analysis/Impl vượt Phase |
| Cấm / Rủi ro | Ghi rõ (vd P0 cấm sửa code · cấm tự bịa blocking) |
| Lệnh Owner tiếp | Duyệt Plan → Thi công → Exit |

**Cấm:**
- Thi công Phase khi **chưa** có Plan đã Owner duyệt.  
- «Làm luôn» khi Owner chỉ gửi PSI / chỉ hỏi — PSI ≠ lệnh thi công; phải có Plan duyệt + «Thi công».  
- Plan lệch SoT (đổi tên Phase «Audit», nhảy Architecture khi đang P0, Analysis Depth trong Plan P0…).  
- Gộp Plan nhiều Phase vào một lần duyệt (một Plan = một Phase).  
- Đánh dấu Phase PASS / Exit khi mới ở trạng thái PLAN.

**Ngoại lệ hẹp:** Owner nói rõ «Thi công luôn, bỏ qua Plan» cho Phase đó — ghi chú ngoại lệ trong file Phase. Mặc định = **không** bỏ qua.

**Quan hệ với §0.12:** Plan Phase / Plan trang **và** PSI Package (khi cần) đều bắt buộc theo đúng Phase — thiếu một trong hai khi SoT yêu cầu → **không** thi công.

---

## 1. Vì sao làm Task 4 (tiếng người)

Task 3 đã trả lời: **ai sở hữu** và **ai được nhờ ai** khi tải.

Vẫn còn câu hỏi mở trên Production:

> Resource này có **cần tải ngay** không, hay chỉ khi Member / đúng route / đúng widget / khi user click?  
> Và: **tại sao** nó có mặt trên trang này — có lý do thật hay chỉ vì ghép stack?

### 1.1 Neo Network — `/cong-dong` (trang chủ hiện tại · Owner paste 2026-07-22)

Danh sách đã tải **không** đồng nghĩa «Cộng đồng cần hết». Nhiều mục nặng nhất là **nền tảng / market / trùng cache**, không phải thân feed.

| Nhóm quan sát | Ví dụ trên Network | Gợi ý Task 4 (chưa kết luận đích) |
|---------------|--------------------|-----------------------------------|
| **Nặng + nghi ngờ nhu cầu trang** | `iflux-market-seed-data` ~27 KB · `mock-market` ~16 KB · `platform-layers-widgets` ~22 KB · registry/taxonomy/seo | Justification = Route Shell `MARKET_PLATFORM_PAGES` gồm `community` — Necessity phải hỏi: *tin tức có cần seed/mock ngay Startup?* |
| **Đúng hướng Feature Cộng đồng** | `community-store` · `community-ui` · `community-page` · `community-daily-feed` · `community-geo-ai` | Justification = Feature Route — Usage/Necessity tách «core feed» vs phụ |
| **Shell tối thiểu hợp lý** | `auth` · `platform-boot` · `api-bundle` · `block-templates` · guest/entitlements | Thường Startup — vẫn ghi Justification |
| **Duplicate strategy** | `legacy-bridge.js` **nhiều `?v=`** (lazyAll… · phaseCW3 · phaseB2 · phaseCW2…) | Drift/duplicate — Gate T2 + Backlog bridge |
| **Search trên Cộng đồng** | `iflux-header-search` | Slot header — deps market có thể đã Startup sẵn thay vì Focus-only |
| **Ngoài phạm vi sản phẩm** | `cloudflareinsights.com/beacon` | Out of Scope CDN |

**Bài học từ neo này (bắt buộc vào Baseline / Loading Analysis):**

1. Tìm **lý do tải** (Justification) từ call stack + Ownership Task 3 đã biết — **không** Audit lại Community.  
2. Có lý do ≠ Need Now — dùng **PSI / Coverage** (% thừa · dùng một phần · chặn LCP).  
3. Có cần một phần → **Architecture Design** tách unit — không xóa cả file mù.

### 1.2 Ví dụ AS-IS khác (code)

| Hiện tượng | Ý nghĩa cho Task 4 |
|------------|-------------------|
| `shell-boot` `ensureParallel` nạp platform + auth + entitlements + `block-templates` mọi trang bootstrap | Nhiều thứ đang **Startup** — có cái đúng, có cái có thể Idle/Auth |
| Market stack Route theo `MARKET_PLATFORM_PAGES` — FAQ ×0 nhưng **Cộng đồng = có** | Route đã có — Catalog phải hỏi Necessity Cộng đồng, không chỉ «đã page-gate» |
| Chuông: Idle · Tin nhắn header: Click | Pattern đúng hướng — khóa bằng Catalog + Change Rule |
| Feature vẫn kéo watchlist-ui / profile-users trên Cộng đồng | Justification trong Manifest modules[] — Necessity từng module |

**Mục tiêu:** Catalog Policy + Justification/Necessity → phân phối lại theo kiến trúc đã chốt — không «tối ưu cảm tính».

---

## 2. Loading Policy Catalog (SoT trung tâm)

### 2.1 Bảng Policy (chuẩn)

| Policy | Khi nào được tải | Không được tải khi |
|--------|------------------|--------------------|
| **Startup** | Bắt buộc có ngay để trang nhận diện / auth / shell tối thiểu sống | Resource chỉ phục vụ panel phụ / route khác / widget tắt |
| **Idle** | Sau khi trang ổn định (vd `requestIdleCallback` / defer sau first paint) | Chặn critical path nội dung trang |
| **Hover** | Hover đủ ngưỡng (mặc định **200ms**) trên trigger | Mọi lần chỉ hover qua nhanh; không Startup |
| **Click** | User click (hoặc tương đương activate) trigger | Prefetch cả trang chỉ vì có nút trên DOM |
| **Auth** | Chỉ khi đã đăng nhập (Member) — có thể kết hợp Idle/Click | Khách / đã logout |
| **Route** | Chỉ khi `pageKey` / path thuộc allowlist của resource | Trang ngoài allowlist (vd FAQ không kéo market seed) |
| **Widget Mount** | Chỉ khi Placement/Host thực sự mount widget đó | Placement tắt / host trống |
| **Viewport** | Khi resource (hoặc host) vào viewport (IntersectionObserver / sentinel) | Còn dưới fold / chưa scroll tới |
| **Focus** | User focus vào control (ô tìm…) — họ hàng **Click** / interaction | Prefetch chỉ vì control có trên DOM |

**Kết hợp Policy:** một resource có thể có **nhiều điều kiện đồng thời** (vd `Auth + Idle`, `Route + Startup`, `Auth + Click`). Catalog ghi đủ; thiếu một điều kiện → **không tải**.

### 2.2 Ví dụ thật trên iFlux (AS-IS) — không phải ví dụ giả

> Cột **AS-IS** = hành vi Production/code hiện tại. **Đích Task 4** có thể khác sau Loading Analysis — không được coi AS-IS = đúng.

| Resource / nhóm | Owner (Task 3) | Policy AS-IS | Bằng chứng code / hành vi |
|-----------------|----------------|--------------|---------------------------|
| `iflux-platform-boot.js` · `iflux-api-bundle.js` · `auth.js` · entitlements · `iflux-guest-shell.js` · `block-templates.js` | App Shell | **Startup** | `shell-boot.js` `ensureParallel` mọi `bootShell` |
| `iflux-header-search.js` | App Shell | **Startup + DOM slot** | Chỉ nạp nếu có `[data-ifx-header-search]` |
| Market platform (`iflux-market-seed-data`, ecosystem seeds, registry, taxonomy, mock, `seo-url`) | App Shell (Runtime) | **Route** (`MARKET_PLATFORM_PAGES`) | Có trên `/cong-dong` · `/co-phieu/…`; **×0** trên `/hoi-dap` · gói cước · loyalty · share |
| `platform-layers-widgets.js` | App Shell | **Startup** (mọi boot) | `ensureParallel` — neo Network Cộng đồng ~22 KB |
| `iflux-web-ui.js` (menu user + idle chain) | App Shell | **Auth** rồi mới Idle extras | `IfluxAuth.isLoggedIn()` mới `ensureParallel` WebUI |
| `inapp-notifications.js` · `iflux-user-notifications-ui.js` | App Shell | **Auth + Idle** | `ifxDeferIdle(loadUserNotifications)` trong `iflux-web-ui.js` |
| `profile-chat-store.js` · `iflux-header-messages-ui.js` | App Shell | **Auth + Click** (ưu tiên) | Listener click `[data-ifx-messages-btn]`; comment: không idle kéo chat mọi trang |
| `google-onetap.js` / pricing modal / onboarding (chuỗi WebUI) | App Shell | **Idle** (+ điều kiện auth/guest tùy script) | Defer idle trong WebUI |
| Page Definition (`page-definition.js` qua bootstrap) | Page Definition | **Startup** (sau Shell, trước Feature) | Thứ tự Runtime Task 3 — **không đổi thứ tự lớp** |
| Feature modules Critical A (`community-store`, `community-page`, … qua Manifest) | Page Feature | **Route** (+ trang đó Startup Feature) | `feature-runtime` / composite chỉ trên pageKey tương ứng |
| `lazyChildren` widget ids trong Manifest | Feature khai báo / Widget mount | **Widget Mount** (không preload) | `feature-runtime`: lazyChildren **không** preload |
| Widget implementation (`widgets/*/index.js`) | Widget Pipeline | **Widget Mount** | `widget-loader.js` `import(slot.lazyModule)` khi có slot Placement |
| Market deps ô tìm (seed → mock → taxonomy → stock-mentions) khi trang **không** sẵn market | App Shell (Search) | **Focus** | `iflux-header-search.js` `ensureDeps` khi focus/showRecent |
| Feed scroll sentinel (`data-ifx-lazy-sentinel` stock/entity list) | Feature / list UI | **Viewport** (chủ yếu **data** trang sau) | `stock-scroll-feed.js` · `entity-list-page.js` |
| Hover 200ms có tên Policy | — | **Chưa có** loader chuẩn «hover 200ms» trên header | Gap Catalog |
| `legacy-bridge.js` multi-`?v=` | Infra | **Duplicate Drift** AS-IS | Neo Network Cộng đồng — nhiều version song song |

### 2.3 Quy tắc gán Policy (Agent không đoán)

1. Nếu thiếu resource → **không dùng được first paint / auth / shell tối thiểu** → ứng viên **Startup**.  
2. Nếu chỉ Member dùng → phải có **Auth** (có thể + Idle/Click).  
3. Nếu chỉ một cụm trang dùng → **Route**.  
4. Nếu Admin tắt Placement là hết nhu cầu → **Widget Mount**.  
5. Nếu user chưa tương tác thì không cần → **Click** / **Hover** / **Focus**.  
6. Nếu dưới fold / list dài → xét **Viewport**.  
7. Nếu «nên có sớm nhưng không chặn nội dung» → **Idle**.  
8. Xung đột hai Policy → ghi Backlog; **Owner chốt** trước thi công (§0.8–0.9).

### 2.4 Load Justification — vì sao bị kéo vào trang?

Mỗi dòng Analysis **bắt buộc** có Justification ngắn **và** Dependency Depth (§2.8). Justification một câu ≠ thay Depth.

| Mã Justification | Nghĩa | Ví dụ thật |
|------------------|-------|------------|
| **J-SHELL-MIN** | Shell tối thiểu boot | `auth.js`, `guest-shell` |
| **J-ROUTE-GATE** | Allowlist `pageKey` / path | Market stack vì `community ∈ MARKET_PLATFORM_PAGES` |
| **J-FEATURE-CORE** | Module trong Feature Manifest `modules[]` Startup trang | `community-store.js` |
| **J-FEATURE-COUPLE** | Kéo theo vì ghép tier/deps, chưa chứng minh Need Now | `watchlist-ui` trên Cộng đồng (nếu Analysis xác nhận) |
| **J-WIDGET-MOUNT** | Placement/Host mount | `widgets/community-page/index.js` |
| **J-SLOT-DOM** | Có slot markup | `iflux-header-search` |
| **J-AUTH-GATE** | Chỉ sau login | `iflux-web-ui.js` |
| **J-INTERACT** | Click/Hover/Focus/Idle handler | Tin nhắn header Click |
| **J-DUP-CACHE** | Tải lại / multi-`?v=` không cần | `legacy-bridge` nhiều version |
| **J-EXTERNAL** | Bên thứ ba | Cloudflare beacon |
| **J-UNKNOWN** | Chưa truy được call stack | Phase 0/A phải giảm về 0 trước Exit trang |

Có Justification **không** đủ để giữ Startup — phải qua §2.5 Necessity **và** §2.7–2.9 (Consumers · Depth · Cost).

### 2.5 Necessity — trang này có cần không?

| Necessity | Nghĩa | Hướng Policy mặc định |
|-----------|-------|------------------------|
| **Need Now** | Thiếu là trang hỏng / sai nhận diện / không auth được *ngay* | Startup (hoặc Route+Startup) |
| **Need Later** | Cần trong phiên nhưng sau tương tác / idle / scroll | Idle / Click / Hover / Focus / Viewport |
| **Need Never** (trên trang mẫu) | Không phục vụ trang này | Không tải — siết Route / bỏ couple / tách module |

**Cấm** gán Necessity chỉ theo Route. Phải đối chiếu **Consumers** (§2.7): resource có thể Need Never với *Feature Community* nhưng Need Later với *Header Search* trên cùng URL.

Ví dụ neo `/cong-dong`:

| Resource | Justification (AS-IS) | Consumers (đúng) | Necessity cần Analysis | Không được làm ngay |
|----------|----------------------|------------------|------------------------|---------------------|
| `community-store` | J-FEATURE-CORE | Community Feed / store | Need Now (tin tức) | Xóa store |
| `iflux-market-seed-data` ~27 KB | J-ROUTE-GATE | ? Search Focus / Mentions — **không** = «Community» | ? Later / Never cho feed | Xóa Owner Shell |
| `mock-market` ~16 KB | J-ROUTE-GATE | Header Search · Mentions · … | ? | Idle mù → Search chết |
| `platform-layers-widgets` ~22 KB | J-SHELL-MIN (?) | ? | ? | Defer không Analysis |
| `legacy-bridge` ×4 `?v=` | J-DUP-CACHE | Infra | Need Never (bản trùng) | — |

### 2.6 Usage trước phân phối

Khi Necessity = Need Later **một phần** file, hoặc nghi ngờ couple:

1. Chỉ ra **ký hiệu / CSS class / API** thực sự gọi trên trang mẫu (static reference tối thiểu; Coverage = soft).  
2. Phần không dùng → ứng viên **Architecture Design** (§3 / Phase B) tách unit + Policy (§2).  
3. Không có Usage tối thiểu → **không** được «băm file» trong Implementation.

### 2.7 Consumer Mapping — resource phục vụ *ai* (không phải chỉ Route nào)

**Route ≠ Consumer.**

| | Route | Consumer |
|--|-------|----------|
| Câu hỏi | Trang / `pageKey` nào đang mở? | **Module / UI nào** thực sự *gọi / phụ thuộc* resource? |
| Ví dụ sai | `mock-market` → Consumer = Community | Chỉ vì URL `/cong-dong` |
| Ví dụ đúng | URL = Cộng đồng | Consumers = **Header Search** · Stock Mentions · Symbol Resolver (nếu Analysis chứng minh) |

**Cột bắt buộc** trên Analysis Sheet (và sau đó Architecture Catalog):

| Cột | Nội dung |
|-----|----------|
| `routePageKey` | Trang đang đo (từ §14) |
| `consumers[]` | Danh sách consumer thật (Header Search, Community Feed, Watchlist UI, …) |
| `consumerEvidence` | File/hàm gọi (đọc code Task 3 — không Audit Owner lại) |

```text
FAIL tư duy:
  mock-market trên /cong-dong → Need Later → Idle
  → Header Search chết (thiếu Consumer Mapping)

ĐÚNG:
  mock-market
  Consumers: Header Search, …
  → Need Later *theo Search Focus* · hoặc giữ trong slab Search
  → Không Idle cắt mà không gắn lại Consumer
```

**Trước mọi Split/Idle/Never:** liệt kê `consumers[]` đủ — thiếu → không đổi Policy nặng về Later/Never.

### 2.8 Dependency Depth — Trigger → Importer → Consumer → Resource

Network/PSI thường chỉ thấy **lá** (`market-seed`). Lý do thật là chuỗi:

```text
Trigger     (route boot / user focus / click)
    ↓
Importer    (shell-boot · feature-runtime · ensureDeps …)
    ↓
Consumer    (header-search · community-store …)
    ↓
Resource    (mock-market · market-seed …)
```

Ví dụ thật:

```text
Trigger:   mở /cong-dong + có slot search (hoặc focus search)
Importer:  shell-boot MARKET_PLATFORM_PAGES[community]  và/hoặc  header-search.ensureDeps
Consumer:  IfluxHeaderSearch / mentions
Resource:  iflux-market-seed-data → … → mock-market
```

**Analysis Sheet bắt buộc** (với resource blocking / large / partial từ PSI):

| Cột | Bắt buộc? |
|-----|-----------|
| `trigger` | Có |
| `importer` | Có |
| `consumers[]` | Có (§2.7) |
| `resource` | Có |
| Depth ≥ 2 bậc khi có couple | Có với blocking/large |

Justification một dòng **không** thay Depth. Depth **không** = Audit Ownership Task 3 — chỉ lần theo *ai import để tải*.

### 2.9 Cost Profile — không chỉ KB

| Chỉ số | Nghĩa | Bắt buộc Gate? | Nguồn thường dùng |
|--------|-------|----------------|-------------------|
| **Transfer** | Bytes tải (KB) | **Có** khi Network/PSI có | Network · PSI |
| **Parse** | Thời gian parse JS | Soft | Performance / DevTools |
| **Execute / Eval** | Thời gian chạy | Soft | Performance |
| **Memory** | Heap / giữ bộ nhớ | Soft | Memory panel (nếu Owner đo) |

**Phản biện / điều kiện:** file 3 KB có thể Execute 100 ms — đúng. Nhưng PSI Owner thường **không** đưa Parse/Execute/Memory. Gate **không** FAIL cứng vì thiếu Parse/Execute trừ khi Owner đã cung cấp số trong PSI Package / Performance paste.  
**Bắt buộc:** ghi Transfer (+ đánh dấu Cost nghi ngờ nếu Coverage/blocking cao dù KB nhỏ).  
**Khuyến nghị:** bổ sung Parse/Execute khi Owner gửi Performance timing.

Analysis Sheet: cột `transferKB` · `costNote` (optional parse/exec/mem).

---

## 3. Resource Architecture Catalog (trụ SoT thứ hai)

> **Policy** nói *khi nào tải*. **Resource Architecture** nói *cái gì là một đơn vị tải* và *vì sao A kéo B*.  
> Thiếu trụ này → Task 4 chỉ gắn nhãn Idle/Click lên file béo nguyên khối — **không** phân phối khoa học được.

### 3.1 Định nghĩa

| Thuật ngữ | Nghĩa |
|-----------|--------|
| **Load Unit** | Đơn vị nhỏ nhất Catalog cho phép tải độc lập (1 file, 1 ESM chunk, 1 slab đã đặt tên) |
| **Coupling** | Quan hệ «tải A ⇒ buộc tải B» (cùng `ensureParallel`, cùng `modules[]` tier, cùng import) |
| **Slab** | Nhóm unit luôn tải cùng nhau theo Architecture (vd market platform slab) |
| **Satellite** | Unit tách được, gắn Policy khác core (vd search-deps Focus; chat Click) |

Resource Architecture **không** thay Runtime Owner (Task 3). Nó chỉ mô tả *hình dạng tải*.

### 3.2 Pattern Architecture (chuẩn gán)

| Pattern | Nghĩa | Ví dụ thật AS-IS / đích |
|---------|--------|-------------------------|
| **RA-ATOMIC** | 1 file = 1 Load Unit | `auth.js`, `community-store.js` |
| **RA-SLAB** | Nhiều file luôn Startup/Route cùng lúc | Market slab: seed + ecosystem + registry + taxonomy + mock + seo (`MARKET_PLATFORM_PAGES`) |
| **RA-FACADE** | Entry mỏng Startup; body lazy theo Policy | WebUI: `iflux-web-ui.js` Auth rồi Idle/Click satellites |
| **RA-CORE+SAT** | Core Need Now + satellites Later | Feature Cộng đồng: store/ui/page = core; geo-ai / watchlist-ui = ứng viên sat sau Analysis |
| **RA-MOUNT** | Unit chỉ tồn tại khi Widget/Host mount | `widgets/*/index.js` + child deps |
| **RA-DUP** | Cùng bare path nhiều version — Architecture lỗi | `legacy-bridge.js` multi-`?v=` trên `/cong-dong` |

### 3.3 Catalog cột bắt buộc (Phase B — Architecture Design)

Mỗi Load Unit / Slab trong phạm vi:

| Cột | Nội dung |
|-----|----------|
| `unitId` | ID ổn định (vd `RU-MKT-SLAB`, `RU-COM-STORE`) |
| `members[]` | File/path thuộc unit |
| `pattern` | RA-* (§3.2) |
| `runtimeOwner` | Consume Task 3 (Shell / Feature / …) — **không đổi** |
| `couplesTo[]` | Unit khác bị kéo theo (nếu có) |
| `consumers[]` | **Consumer Mapping** §2.7 — ai dùng unit |
| `depth` | Trigger → Importer → Consumer → Resource (§2.8) |
| `justification` | §2.4 |
| `necessityByPage` | §2.5 theo mẫu (+ theo consumer) |
| `costTransferKB` | §2.9 — bắt buộc khi có số |
| `costNote` | Parse/Execute/Memory nếu Owner đo (soft) |
| `policyTarget` | §2 — Policy đích của **unit này** |
| `splitFrom` / `mergeInto` | Nếu đổi Architecture so với AS-IS |

**Luật:** một Policy gắn trên **unit**, không gắn mơ hồ lên «cả trang».

### 3.4 Ví dụ neo `/cong-dong` → hướng Architecture (chưa chốt — sau Analysis / Architecture Design)

| unitId (đề xuất Analysis) | members (AS-IS) | Pattern AS-IS | Vấn đề | Hướng Architecture (sau Necessity) |
|---------------------------|-----------------|---------------|--------|-------------------------------------|
| `RU-SHELL-MIN` | platform-boot, api, auth, entitlements, guest, templates… | RA-SLAB Startup | Cần giữ tối thiểu | Giữ slab; siết member thừa |
| `RU-MKT-SLAB` | seed ~27 KB, mock ~16 KB, registry, taxonomy, seo, ecosystem | RA-SLAB Route(community) | Nặng; Necessity ? trên tin tức | Tách sat Focus/search **hoặc** bỏ `community` khỏi allowlist nếu Never |
| `RU-PLAT-LAYERS` | `platform-layers-widgets` ~22 KB | RA-ATOMIC trong Shell Startup | Necessity ? | Coverage/Usage → giữ / Idle / Route hẹp |
| `RU-COM-CORE` | community-store, ui, page, daily-feed… | RA-CORE (+ couple) | Đúng hướng trang | Siết sat (geo-ai, watchlist-*) |
| `RU-SEARCH` | header-search (+ có thể đã dùng MKT slab) | RA-FACADE / Focus | Deps đã Startup sẵn | Architecture: search-deps = sat Focus, không nhét Startup Cộng đồng |
| `RU-BRIDGE` | legacy-bridge nhiều `?v=` | RA-DUP | Drift | Một version / một unit |

### 3.5 Quan hệ Policy ↔ Architecture

```text
Sai:  Policy(Click) trên file 40KB vẫn chứa Need Now + Never  → không tách được
Đúng: Architecture tách Need Now | Need Later thành 2 unit
      → Policy(Startup) unit A · Policy(Click) unit B
```

Gate kiểm **ba** Drift: Policy · Architecture · **Consumer** (§12).

### 3.6 Không phải Resource Architecture Task 4

| Việc | Vì sao không |
|------|----------------|
| Đổi Owner Shell→Feature | Task 3 Ownership |
| Viết lại Feature Manifest schema / State Machine | Task 3 Runtime |
| Đổi API / Permission / Widget formula | Business |
| Micro-frontend / bundler mới chỉ vì «đẹp» | Out of Scope trừ Owner mở |

---

## 4. Consume Task 3 — không mang quyết định kỹ thuật sang viết lại

| Mang sang Task 4 | Không mang |
|------------------|------------|
| Framework quản trị: §0 · Scope · 1 file/Phase · Gate hẹp · Owner ra lệnh | Chuỗi **Audit** Inventory→Owner→Dep→Manifest |
| Ownership bảng để *đọc consumer* (không audit lại) | Viết lại State Machine / Manifest schema |
| Dependency graph để *không import chéo* | Dual Owner bài tập mới |
| Evidence PSI / Coverage / Network làm **Baseline** | «Làm lại Feature Runtime» |
| Open Issues sai thời điểm tải / unit béo | Open Issue Ownership thuần trừ Owner kéo |

---

## 5. Luật chơi chung (bắt buộc)

1. **Baseline trước** mọi Analysis / Implementation / code.  
2. Làm theo Phase: **0 Baseline → A Loading Analysis → B Architecture Design → C Loading Plan → D Implementation → Gate**.  
3. Mỗi Phase: **Lập Plan (§0.13) → Owner duyệt Plan → Thi công → Acceptance PASS** mới sang Phase sau.  
4. **Không** mở Audit kiến trúc Task 3.  
5. Agent **chỉ** thi công Phase / trang khi: Owner chỉ thị «Thi công» + Plan đã duyệt + **PSI Package** (§0.12) nếu trang đó yêu cầu.  
6. Tuân thủ **§0** (gồm **§0.13 Plan trước Thi công**).  
7. Gate không kiểm Business / UI / Permission / Ownership lại.  
8. **Không Implementation** khi unit chưa có Architecture Catalog + Policy chưa gắn.  
9. **Catalog trang §14** thống kê đủ phạm vi trước khi tối ưu lan — mỗi trang một lần mở nội dung = một PSI Package mới.

---

## 6. Hành trình các Phase

```text
Mỗi Phase:
  Plan (§0.13) → Owner duyệt → Thi công → Exit PASS
    ↓
Phase 0 — Baseline
    ↓  PSI · Coverage · Network · Waterfall (đóng băng)
Phase A — Loading Analysis
    ↓  từng resource: vì sao · consumer · % dùng · Policy gợi ý · split?
Phase B — Architecture Design
    ↓  Architecture Catalog (§3) chốt
Phase C — Loading Plan
    ↓  Policy Catalog (§2) + thứ tự wave thi công
Phase D — Implementation
    ↓  thực thi Catalog
Gate — Verification
    ↓  Policy Drift=0 · Architecture Drift=0 · Consumer Drift=0
MR
```

| Phase | Tên | Input | Output | File | Gate Plan |
|-------|-----|-------|--------|------|-----------|
| **0** | **Baseline** | PSI / Coverage / Network / Waterfall | Bảng resource + chỉ số đóng băng | `loading/Phase0.md` | §0.13 |
| **A** | **Loading Analysis** | Baseline + Ownership Task 3 (đọc) | Analysis Sheet: Depth · Consumers · Cost · Necessity · Policy gợi ý · Split? | `loading/PhaseA.md` | §0.13 |
| **B** | **Architecture Design** | Analysis Sheet | Architecture Catalog đích | `loading/PhaseB.md` | §0.13 |
| **C** | **Loading Plan** | Architecture Catalog | Policy Catalog + wave plan | `loading/PhaseC.md` | §0.13 |
| **D** | **Implementation** | Hai Catalog + Plan | Code + Evidence sau | `loading/PhaseD.md` | §0.13 |
| **Gate** | **Verification** | Phase D Evidence | Drift×3 = 0 · chữ ký Owner | `loading/Gate.md` | §0.13 |

> **Một Phase = một file.** **Cấm** tên Phase «Audit».  
> **Cấm** thi công khi Plan Phase chưa Owner duyệt (§0.13).

---

## 7. Phase 0 — Baseline (READ ONLY)

### Mục tiêu
(1) Đóng băng **Catalog trang phạm vi §14** (thống kê đủ).  
(2) Với **từng** trang Owner mở: đóng băng bằng chứng từ **PSI Package** (§0.12) trước Analysis.

### Trước thi công
- [ ] Plan Phase 0 trong `loading/Phase0.md` đã lập · **Owner duyệt** (§0.13)  
- [ ] Owner ra lệnh **«Thi công Phase 0 Task 4»**

### Input
- Catalog trang §14.  
- Với trang đang làm: **Owner PSI Package** — danh sách **JS/CSS chặn hiển thị đầy đủ** từ Google PageSpeed Insights.  
- (Khuyến nghị) Coverage / Network.

### Làm gì
- Điền / khóa bảng §14 (URL · pageKey · nhóm · cột TT PSI).  
- Với trang có PSI Package: ghi bảng resource blocking (+ unused/partial nếu Owner gửi).  
- Gắn nhãn sơ bộ: *blocking* · *unused* · *partial*.  
- **Không sửa code.** Không Analysis sâu.

### Cấm
Inventory Ownership · Dependency · Manifest · tự bịa list blocking · làm trang ngoài §14 · dùng PSI trang A cho trang B · thi công khi Plan chưa duyệt (§0.13).

### Acceptance
- [ ] Catalog §14 đủ trang phạm vi (khớp Sitemap Task 3 / Phase C — không bỏ sót)  
- [ ] Quy ước «mỗi nội dung trang mới = một PSI Package mới» đã ghi · Owner xác nhận  
- [ ] Ít nhất một trang neo (vd `/cong-dong`) đã có PSI Package đủ blocking JS/CSS trong Evidence  
- [ ] Owner duyệt Baseline khung  

### Exit
PASS khung Catalog + quy ước PSI.  
**Mỗi trang tiếp theo:** Owner gửi PSI Package → Agent bổ sung Baseline dòng trang → mới Analysis trang đó.  
**Phase A:** chỉ sau Exit P0 + **Plan Phase A** đã duyệt (§0.13).

---

## 8. Phase A — Loading Analysis

### Mục tiêu
Từng resource trên **một trang đã có PSI Package** → chuỗi Analysis. **Không** Audit kiến trúc Task 3.

### Điều kiện vào Analysis một trang
- [ ] Plan Phase A đã Owner duyệt (§0.13) + lệnh thi công Analysis  
- [ ] Trang ∈ Catalog §14  
- [ ] Owner đã gửi PSI Package đủ (§0.12)  
- [ ] Baseline dòng trang đã ghi Evidence  
- [ ] Exit Phase 0 PASS (khung) 

### Chuỗi mỗi resource

```text
Resource (vd mock-market.js)  ← từ PSI blocking / list Owner
    ↓ Dependency Depth: Trigger → Importer → Consumer → Resource
    ↓ Consumers[]              (Route ≠ Consumer — §2.7)
    ↓ Cost: Transfer (+ Parse/Execute/Mem nếu có — §2.9)
    ↓ Usage %                  (Coverage / PSI)
    ↓ Necessity                (theo Consumer, không chỉ Route)
    ↓ Có nên Startup?
    ↓ Policy gợi ý?
    ↓ Split?                   (gợi ý Architecture Design)
```

### Ví dụ đúng

```text
mock-market.js
  Depth: boot /cong-dong → shell-boot MARKET_PLATFORM | header-search.ensureDeps
         → Consumer: Header Search (… Mentions nếu có)
         → Resource: mock-market
  Consumers: [Header Search, …]     ← KHÔNG ghi «Community»
  Transfer: ~16 KB
  Necessity: Later theo Focus Search (không Idle cắt mù)
  Policy gợi ý: Focus / giữ sat Search — không gán Need Never chỉ vì «không phải feed»
  Split?: tách khỏi Startup feed Community nếu Architecture Design chốt

community-store.js
  → Consumers: [Community Feed / store]
  → Need Now · Route+Startup core
```

### Output
**Analysis Sheet theo trang** — bắt buộc cột: Depth · `consumers[]` · Transfer · Necessity · Policy gợi ý · Split?  
(+ costNote soft).

### Cấm
- Audit Ownership / Dependency / Manifest như Task 3  
- Sửa Production · Chốt Catalog cuối (để B/C)  
- Analysis khi thiếu PSI Package trang đó  
- Gán Consumer = Route · Idle/Never khi `consumers[]` trống  

### Acceptance (theo trang)
- [ ] Sheet đủ resource blocking (+ large/partial) từ PSI trang đó  
- [ ] Mọi dòng blocking/large có `consumers[]` + Depth  
- [ ] Transfer ghi được; Parse/Execute soft nếu chưa đo  
- [ ] Không «Audit lại Owner»  
- [ ] Owner duyệt Analysis trang → mở trang khác (PSI mới) hoặc sang B khi Owner chốt đủ mẫu  

---

## 9. Phase B — Architecture Design

### Mục tiêu
Analysis → **Architecture Catalog** (§3): Load Unit · Slab · Satellite · Coupling · gắn `consumers[]`.

> Tên cũ «Resource Distribution» dễ hiểu nhầm = triển khai. Phase này là **thiết kế kiến trúc tải** (khớp trụ Resource Architecture).

### Làm gì
- Split? = có → `unitId` / `members[]` / pattern RA-* · **giữ consumers[]** trên unit.  
- Siết couple thừa · RA-DUP → một version.  
- **Chưa** gắn Policy cuối (mang gợi ý sang C).

### Acceptance
- [ ] Architecture Catalog đủ cột §3.3 (kể cả consumers · depth · transfer)  
- [ ] Mọi split có căn Usage/Analysis A + không bỏ sót Consumer  
- [ ] Owner duyệt → sang C  

---

## 10. Phase C — Loading Plan

### Mục tiêu
**Policy đích** (§2) trên từng unit + **wave Implementation**.

### Làm gì
- Policy từng `unitId`.  
- Wave: Shell/platform trước · Feature/Widget sau (hoặc theo Owner).  
- Change Rules §0.9 / §0.9b.  
- Mặc định **chưa** code.

### Acceptance
- [ ] Policy Catalog khớp Architecture  
- [ ] Wave + rollback rõ  
- [ ] Owner duyệt → sang D  

---

## 11. Phase D — Implementation

### Mục tiêu
Thực thi Architecture + Policy đã duyệt trên Production.

| Allowed | Not Allowed |
|---------|-------------|
| Thời điểm tải · tách/ghép unit theo Catalog B/C | Đổi Owner · Manifest schema · Business · invent unit |

### Acceptance
- [ ] Evidence Network/PSI sau từng wave  
- [ ] Không Drift so Catalog trên mẫu đã làm  
- [ ] Regression đường tải Task 3 = 0  

### Exit
PASS → Gate.

---

## 12. Gate — Verification

**Không** Gate Business / UI / Permission / Ownership lại.

### 12.1 Technical

| # | Tiêu chí |
|---|----------|
| T1 | Không tải sai Policy |
| T2 | Không duplicate / multi-`?v=` thừa |
| T3–T5 | Route / Auth / Widget Mount đúng Catalog |
| T6 | PSI/Network P0 vs sau — Owner chấp nhận |
| **T7** | **Policy Drift = 0** |
| **T8** | **Architecture Drift = 0** |
| **T9** | **Consumer Drift = 0** — Runtime không tải thêm nhánh ngoài `consumers[]` / Depth đã Catalog |

### 12.2 Architecture Gate

| # | Tiêu chí |
|---|----------|
| A1 | Có Baseline · Analysis Sheet (Consumers·Depth·Cost) · Architecture Catalog · Policy Catalog |
| A2 | Runtime khớp Policy + Architecture + **Consumer Catalog** |
| A3 | Không đổi Owner / Dependency Task 3 |
| A4 | Catalog Ownership §0.8 |
| A5 | Không regression lớp Task 3 |
| A6 | Change Rules có dấu vết |
| A7 | Split/defer: Analysis → Architecture Design → Plan → Impl |
| A8 | Không Idle/Never khi `consumers[]` trống trên resource đã đổi Policy |

### 12.3 Consumer Drift — định nghĩa Fail

```text
FAIL Consumer Drift ⇔
  Catalog: Consumer C → Resource R (đúng depth)
  ∧ Runtime: cùng trigger nhưng kéo thêm resource ngoài Catalog
    (vd Search → mock-market Catalog
        Runtime còn kéo seed+taxonomy+registry+watchlist+community-store không nằm consumers/depth)

Hoặc:
  Catalog: consumers[] = [Header Search]
  ∧ Implementation Idle cắt R
  ∧ Header Search vẫn cần R → hỏng Consumer
```

### 12.4 Deliverable
**Một file:** `docs/runtime-opt/loading/Gate.md`.

---

## 13. Open Issues & quan hệ Task 3

| ID / chủ đề | Xử lý Task 4? |
|-------------|----------------|
| PSI: thừa · partial · blocking | **Có** — Baseline → Analysis |
| Market slab Cộng đồng | **Có** — Analysis → Architecture Design |
| `legacy-bridge` multi-`?v=` | **Có** — RA-DUP |
| Lặp Audit Ownership/Manifest | **Cấm** |
| OI-RT-MOUNT / R-C3 / beacon / OI-H4 | Out of Scope |

---

## 14. Catalog trang phạm vi tối ưu + quy ước PSI Owner

### 14.1 Mục đích
Thống kê **đủ** mọi trang trong phạm vi Task 4 **trước** khi tối ưu lan.  
Mỗi lần Owner mở **một nội dung trang mới** → gửi **PSI Package đầy đủ** (JS/CSS chặn hiển thị) → Agent mới làm.

### 14.2 Catalog trang (SoT Runtime §12 + Phase C Catalog — neo Task 3)

| # | pageKey | URL công khai (chuẩn) | Nhóm | TT PSI (Owner) | TT Baseline | TT Analysis |
|---|---------|----------------------|------|----------------|-------------|-------------|
| 1 | `home` | `https://iflux.vn/nha-cua-toi` | Auth · Published | ⬜ | ⬜ | ⬜ |
| 2 | `market` | `https://iflux.vn/thi-truong` | Published | ⬜ | ⬜ | ⬜ |
| 3 | `community` | `https://iflux.vn/cong-dong` | Core công khai · **neo** | ◐ PSI Owner đã gửi 2026-07-22 · chờ Plan P0 duyệt + Thi công | ⬜ | ⬜ |
| 4 | `flow` | `https://iflux.vn/dong-tien` | Core | ⬜ | ⬜ | ⬜ |
| 5 | `loyalty` | `https://iflux.vn/thanh-vien` (hoặc slug SoT hiện hành) | Auth | ⬜ | ⬜ | ⬜ |
| 6 | `faq` | `https://iflux.vn/hoi-dap` | Lean | ⬜ | ⬜ | ⬜ |
| 7 | `account` | `https://iflux.vn/tai-khoan` | Auth · Pattern C | ⬜ | ⬜ | ⬜ |
| 8 | `messages` | `https://iflux.vn/tin-nhan` | Auth | ⬜ | ⬜ | ⬜ |
| 9 | `stocks` | `https://iflux.vn/co-phieu` | Entity list | ⬜ | ⬜ | ⬜ |
| 10 | `sectors` | `https://iflux.vn/nganh` | Entity list | ⬜ | ⬜ | ⬜ |
| 11 | `ecosystems` | `https://iflux.vn/he-sinh-thai` | Entity list | ⬜ | ⬜ | ⬜ |
| 12 | `cauChuyen` / `chuDe` | `https://iflux.vn/cau-chuyen` (và slug chủ đề SoT) | Entity list | ⬜ | ⬜ | ⬜ |
| 13 | `stock` | `https://iflux.vn/co-phieu/{ticker}` vd `/co-phieu/HPG` | Entity detail · Auth | ⬜ | ⬜ | ⬜ |
| 14–16 | `sector` · `family` · `cauChuyenDetail` | Chi tiết ngành / HST / câu chuyện | Entity detail | ⬜ | ⬜ | ⬜ |
| 17 | `pricing` | `https://iflux.vn/goi-cuoc` | Lean | ⬜ | ⬜ | ⬜ |
| 18 | `search` | `https://iflux.vn/tim-kiem` | Core | ⬜ | ⬜ | ⬜ |
| 19 | `watchlist` | `https://iflux.vn/theo-doi` | Auth | ⬜ | ⬜ | ⬜ |
| 20 | `communityWrite` | URL viết bài SoT | Auth | ⬜ | ⬜ | ⬜ |
| 21 | `checkout` | URL checkout SoT | Auth | ⬜ | ⬜ | ⬜ |
| 22 | `communityPost` | `https://iflux.vn/cong-dong/bai-viet/...` | Entity · công khai | ⬜ | ⬜ | ⬜ |
| 23 | `share` | URL chia sẻ SoT | Optional · lean | ⬜ | ⬜ | ⬜ |
| 24 | `stockComment` | URL bình luận mã SoT | Auth · Entity | ⬜ | ⬜ | ⬜ |

> Cột URL lấy theo slug Việt SoT hiện hành; lệch path → sửa Catalog trước khi xin PSI.  
> **Thiếu một trang trong Catalog = chưa đủ phạm vi Task 4** (trừ Owner gạch Out of Scope có chữ ký).

**Mẫu đối chứng bắt buộc khi làm wave lớn:** ít nhất 1 trang Core nặng (`community` hoặc `stock`) · 1 trang Lean (`faq` / `pricing`) · 1 trang Auth — mỗi mẫu một PSI Package riêng.

### 14.3 Quy trình mở nội dung trang mới (bắt buộc)

```text
1. Owner chọn dòng trong §14.2
2. Owner chạy Google PageSpeed Insights trên URL đó
3. Owner gửi vào chat / Evidence:
     - URL
     - pageKey
     - Danh sách ĐẦY ĐỦ JS chặn hiển thị
     - Danh sách ĐẦY ĐỦ CSS chặn hiển thị
     - (nên) unused / partial
4. Agent ghi Baseline dòng trang + cập nhật cột TT PSI = ✅
5. Agent mới Loading Analysis (Phase A) cho trang đó
6. Sang trang khác → lặp từ bước 1 (PSI mới, không tái sử dụng)
```

### 14.4 Chữ ký Owner trên quy ước
Owner xác nhận khi duyệt SoT / Baseline: *«Mỗi nội dung trang mới tôi sẽ cung cấp view PSI blocking JS/CSS đầy đủ trước khi Agent làm.»*

---

## 15. Lệnh Owner (gợi ý)

1. Đọc **hai trụ · §0.12 · §0.13 · §2.7–2.9 · §14 · Loading Analysis ≠ Audit**.  
2. Duyệt SoT **v1.6** (Plan trước Thi công).  
3. **«Lập Plan Phase 0»** → Agent viết Plan trong `loading/Phase0.md` → Owner **«Duyệt Plan Phase 0»**.  
4. (Có thể gửi trước) **PSI Package** trang neo (vd Cộng đồng).  
5. **«Thi công Phase 0 Task 4»** → Agent khóa Catalog + ghi Evidence theo Plan đã duyệt.  
6. **«Exit P0 PASS»** → **«Lập Plan Phase A»** → duyệt → **«Analysis trang community»** (thi công A).  
7. Mỗi trang / Phase tiếp: **Plan → duyệt → Thi công** (+ PSI đủ khi cần).  
8. Sau đủ mẫu: Plan B → C → D → Gate (cùng quy tắc §0.13).

---

## 16. Review — Consumer · Depth · Cost · Architecture Design · Consumer Drift (2026-07-22)

| # | Điểm Reviewer | Kết luận Agent | Phản biện / điều kiện | SoT |
|---|---------------|----------------|----------------------|-----|
| **1** Consumer Mapping | **Đồng ý** | SoT đã có chữ «consumer» trong chuỗi A nhưng **yếu** — dễ ghi Consumer=Route. Bổ sung §2.7 + cột bắt buộc | §2.7 · Sheet · Catalog |
| **2** Dependency Depth | **Đồng ý** | Network chỉ thấy lá — đúng neo seed/mock Cộng đồng | §2.8 |
| **3** Cost Profile | **Đồng ý có điều kiện** | Transfer **cứng**. Parse/Execute/Memory **soft** đến khi Owner gửi Performance — tránh Gate FAIL vì thiếu tooling | §2.9 |
| **4** Phase B → Architecture Design | **Đồng ý** | «Distribution» nghe triển khai | Phase B rename |
| **5** Consumer Drift Gate | **Đồng ý** | Khóa Idle cắt chết Search | T9 · §12.3 |

---

## 17. Pre-flight — SoT READY?

| Tiêu chí | Có? |
|----------|-----|
| Hai trụ Policy + Resource Architecture | ✓ |
| Loading Analysis · không Audit Task 3 | ✓ |
| Catalog trang + PSI Owner mỗi nội dung | ✓ |
| **Consumer Mapping · Depth · Cost** | ✓ |
| Phase B = **Architecture Design** | ✓ |
| Drift×3 (Policy · Architecture · Consumer) | ✓ |
| Một Phase = một file | ✓ |
| **Plan trước Thi công mọi Phase (§0.13)** | ✓ |

**Kết luận:** SoT Task 4 **v1.6** — chờ Owner duyệt v1.6 + Plan Phase 0.

---

**Chữ ký:** Agent · 2026-07-22 · … → v1.5 → **v1.6 (§0.13 Plan trước Thi công)**  
**Neo:** PSI theo trang · Task 3 Exit · Plan gate mọi Phase.
