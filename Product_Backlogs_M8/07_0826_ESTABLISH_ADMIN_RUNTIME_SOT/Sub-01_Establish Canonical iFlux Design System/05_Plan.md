# 05 — PLAN THI CÔNG SUB-01: ESTABLISH CANONICAL iFLUX DESIGN SYSTEM

| | |
| --- | --- |
| Task | `07_0826_ESTABLISH_ADMIN_RUNTIME_SOT / Sub-01_Establish Canonical iFlux Design System` |
| Căn cứ | `01_Request.md` (13 Owner Decision) · `04_Solution.md` (**APPROVED 2026-08-26** — không mở lại quyết định đã khóa) · `docs/SoT — Admin Runtime (AR-001).md` v1.2 |
| Scope | **ESTABLISH + VERIFY + LOCK** một Canonical Design System hoàn chỉnh, độc lập. **KHÔNG migration Admin/User Web page nào trong Sub-01.** |
| Deploy & test | Cuối mỗi phase = commit + push branch `staging` → CI deploy → Owner test trên `https://staging.iflux.vn/...` (URL ghi rõ ở từng phase) |
| Trạng thái | **P1 = PASS / OWNER APPROVED (2026-08-26)** · P2 mở sau khi Owner chốt phần bổ sung P2 (§P2 dưới) |

---

## 0. Scope — Sub-01 chịu trách nhiệm gì và KHÔNG chịu trách nhiệm gì

Sub-01 là **sub-task nền tảng** của chương trình `07_0826_ESTABLISH_ADMIN_RUNTIME_SOT`. Mục tiêu duy nhất:

```text
Current patterns + current DS evidence  (audit/classification đã hoàn tất)
        ↓
Canonical Token SoT → Foundation → Primitives → Components → Patterns
        ↓
Canonical Sandbox / Visual Acceptance
        ↓
VERIFY → OWNER LOCK
        ↓
CANONICAL DESIGN SYSTEM READY FOR MIGRATION      ← DỪNG Ở ĐÂY
```

**Thuộc Sub-01:** tạo ra chuẩn (P1–P8) + regression của chính Design System + Migration Contract bàn giao (§4).

**KHÔNG thuộc Sub-01 (downstream — §5):**

- Migration từng Admin/User Web page (Sub-02+, mỗi scope có Audit riêng theo SOP).
- Full platform inventory + full system regression (thuộc migration program).
- Xóa Legacy DS (sub-task cleanup cuối chương trình, chỉ sau khi mọi migration COMPLETE).

Trạng thái cuối:

```text
SUB-01 COMPLETE  = CANONICAL DESIGN SYSTEM ESTABLISHED + VERIFIED + LOCKED
PROGRAM COMPLETE = các platform đã migrate + full regression + legacy cleanup   (không phải Sub-01)
```

---

## 1. Plan thực thi Sub-01 (P1 → P8, không nhảy phase)

```text
P1  Token Pipeline          JSON SoT + generator tự động
P2  Foundation              typography · spacing · layout · utilities
                            + icons + adapters/web/theme.js
P3  Primitives              building blocks generic + navigation primitives
P4  Components              reusable structured UI + Chat Family + Timeline Family
P5  Patterns                page-header · data-list · record-detail · entity-form
                            · conversation · order-history
P6  Canonical Sandbox       rewrite 9 baseline patterns
                            0 inline · 0 legacy naming · 0 Admin dependency
P7  DS Regression           component catalog + 9/9 visual parity
                            6 viewport canonical × 2 theme + automated governance checks
P8  CANONICAL LOCK          Owner acceptance · ghi SoT status
                            Legacy DS = FROZEN · Canonical DS = READY_FOR_MIGRATION
END SUB-01
```

Gate: mỗi phase có **DoD** và **Owner test**; phase sau chỉ mở khi phase trước PASS. Evidence từng phase ghi `gates/P<x>.md` trong folder Sub-01.

### P1 — Token Pipeline

**Việc làm**

1. `design_system/tokens/source/`: `color.json` · `typography.json` · `spacing.json` · `radius.json` · `shadow.json` · `motion.json` · `breakpoints.json` (SoT 5 mốc: `sm 480 · md 768 · lg 1024 · xl 1280 · 2xl 1440`; base < 480px). Giá trị lấy nguyên từ bộ token `--ifx-*` hiện hành — không đổi visual.
2. `design_system/scripts/build-tokens.*` (Node tối thiểu): JSON → `tokens/generated/css/` (`primitives.css` · `semantic.css` · `themes/dark.css` · `themes/light.css`), header `DO NOT EDIT — GENERATED FROM TOKEN SOURCE`.
3. Chạy generator, diff từng biến với bộ token đang chạy — lệch = bug generator, cấm sửa tay output.

**DoD:** JSON = nguồn duy nhất; generator deterministic (chạy lại ra output y hệt); 0 giá trị lệch.

**Owner test (UI):** `https://staging.iflux.vn/design_system/sandbox/index.html` — trang catalog sandbox, phase này mở mục **Tokens**: bảng màu primitive/semantic, thang spacing, thang chữ; đổi Dark/Light thấy theme đổi. (Catalog này lớn dần theo các phase sau.)

**Kết quả: P1 = PASS / OWNER APPROVED (2026-08-26).** Evidence `gates/P1.md`. Hai điểm Owner khóa khi duyệt P1:

1. **Breakpoint SoT LOCK:**

```text
tokens/source/breakpoints.json   = BREAKPOINT SOT DUY NHẤT (writable)
tokens/generated/js/breakpoints.js = READONLY GENERATED OUTPUT
tokens/generated/css/*             = READONLY GENERATED OUTPUT
```

   Cấm: sửa tay breakpoint trong JS · tạo thêm breakpoint source khác · hardcode breakpoint tùy ý trong component/page · dùng JS generated như nguồn định nghĩa thứ hai.

2. **Phạm vi chứng minh của P1:** P1 chỉ chứng minh Token Pipeline (SoT tồn tại, generator đúng, breakpoint JS nhận diện viewport, sandbox hiển thị active breakpoint). **P1 CHƯA phải acceptance của responsive layout** — responsive layout là acceptance của P2 (Responsive Playground bên dưới).

### P2 — Foundation (bổ sung requirement Owner 2026-08-26 — LOCKED)

**Việc làm:** `foundation/reset.css` · `fonts.css` · `typography.css` (REUSE hệ `ifx-fs-*`) · `layout.css` + `utilities.css` (mobile-first, hấp thụ nhóm inline layout generic theo Solution §8) · `icons/vendor/tabler/` về local · `adapters/web/theme.js` (data-theme + localStorage `ifx-theme` + browser preference — Foundation không đụng DOM) · **Responsive/Breakpoint Playground** (bắt buộc, bên dưới).

#### P2.a — Responsive / Breakpoint Playground (Owner Acceptance Surface)

Đặt tại `https://staging.iflux.vn/design_system/sandbox/index.html`. Đây là bề mặt nghiệm thu responsive foundation của Owner — hiển thị tối thiểu:

1. **Viewport width hiện tại.**
2. **Breakpoint active** theo hệ đã LOCK: `BASE < 480 · sm ≥ 480 · md ≥ 768 · lg ≥ 1024 · xl ≥ 1280 · 2xl ≥ 1440`.
3. **Breakpoint marker:** thấy rõ toàn bộ mốc `BASE | 480 | 768 | 1024 | 1280 | 1440` và mốc đang active.
4. **Container demo:** mobile container · padding/gutter · max-width behavior (nếu có) · thay đổi ở từng breakpoint.
5. **Responsive Grid demo** (layout thật): `BASE 1 cột → md 2 cột → lg 3 cột → 2xl 4 cột` — Owner resize browser thấy layout đổi thật.
6. **Stack/Inline demo:** mobile xếp dọc `A/B/C` → desktop xếp ngang `A B C` — chứng minh layout primitive mobile-first.
7. **Gap/spacing demo:** spacing/gap consume canonical spacing token — không hardcode.
8. **Typography responsive:** chỉ làm nếu typography contract thực sự có responsive behavior; nếu không → ghi rõ `N/A — Typography dùng fixed token scale, responsive do composition quyết định`. Không tạo responsive typography chỉ để có demo.
9. **Dark/Light:** Playground test được trên cả hai theme.
10. **JS chỉ hiển thị viewport + breakpoint active.** Layout responsive phải do **canonical CSS mobile-first rules** điều khiển. CẤM `JS detect md → JS đổi class/layout` để giả lập responsive — Owner phải đang test CSS responsive thực sự.

#### P2.b — Responsive Acceptance Matrix

Verify đủ **6 viewport: 360 / 480 / 768 / 1024 / 1280 / 1440 × Dark/Light**. Tại mỗi tổ hợp kiểm: không overflow ngang ngoài intentional scroll · container đúng · grid đúng · spacing đúng · typography không vỡ · icon không méo · theme đúng · **breakpoint label khớp với layout đang render**. Evidence ghi `gates/P2.md`.

#### P2.c — Utilities (rule đã khóa, nhắc lại cho P2)

Không dùng 526 inline styles làm lý do mở rộng utilities hàng loạt. P2 chỉ tạo utility/layout primitive **thực sự generic**. Classification tiếp tục: generic layout → Foundation/Primitive · reusable semantic UI → Component (P3/P4) · pattern composition → Pattern (P5) · artifact-specific → local ownership · hack → DROP/REWRITE. `utilities.css` không được trở thành `misc.css` / `fix.css` / `legacy.css` / `override.css` trá hình.

#### P2.d — Chống scope creep

P2 chỉ xây Foundation. CẤM trong P2: rewrite 9 patterns hoàn chỉnh · migrate Admin page · migrate User Web page · sửa business UI · sửa Admin runtime · tạo component business · cleanup Design System legacy. Các việc đó thuộc phase/sub-task sau.

**DoD (P2 chỉ PASS khi đủ cả 4):**

```text
Foundation implementation PASS
+ Responsive Playground PASS
+ 6 viewport × 2 theme PASS (matrix P2.b)
+ Owner nhìn trực tiếp trên sandbox và xác nhận
```

**Owner test (UI):** [sandbox Foundation](https://staging.iflux.vn/design_system/sandbox/?section=foundation) — tab Foundation → Responsive Playground: bấm **AUTO | 360 | 480 | 768 | 1024 | 1280 | 1440** (iframe isolation, không resize browser thủ công) → Dark/Light + reload persist → Icon Catalog (Source = Canonical = 331, Missing = 0). Catalog đã tách tab; P3 chưa mở.

**Kết quả technical: PASS** (viewport × span độc lập, grid 72/72, container ladder 16/16/20/24/32/32, max 1280 @1440 margin 80×2, icons missing=0). **OWNER UI ACCEPTANCE = PENDING**. P3 chưa mở.

### P3 — Primitives

**Việc làm:** `button` · `chip` · `badge` · `avatar` (size variants thay 15 inline width/height) · `alert` · `progress` + **navigation primitives** (`nav-item/icon/label/group/divider` + states — KHÔNG side-nav/top-bar; platform navigation KHÔNG triển khai ở Sub-01). Naming `ifx-*`, mobile-first, chỉ dùng token generated.

**DoD:** mỗi primitive có demo đủ variant/state; 0 màu hardcode; 0 media query ngoài 5 mốc.

**Owner test (UI):** catalog → mục **Primitives**: từng primitive đủ variant, hover/active/disabled, 2 theme.

### P4 — Components

**Việc làm:** REWRITE từng family theo Solution §2.3, CSS/JS colocate; JS tách từ `iflux-admin-ui.js` theo Solution §2.5 (pagination · drawer · modal · toast · dropdown · tabs); `chart-adapter.js` màu theo semantic token; **Chat Family + Timeline Family** + wizard theo Owner Decision #4.

Thứ tự (đơn giản → phức tạp, lỗi lộ sớm): card → stat → breadcrumb → form → table → pagination → drawer → action-bar → modal → toast → dropdown → tabs → search → timeline → wizard → chat → chart.

**DoD:** mỗi component 1 trang demo; JS 0 phụ thuộc Admin runtime/business; chart đổi theme tự đổi màu; đủ component để phủ toàn bộ visual capability của 9 patterns.

**Owner test (UI):** catalog → mục **Components**: mỗi family một trang, tôi báo từng cụm xong để Owner duyệt lần lượt.

### P5 — Patterns

**Việc làm:** `page-header` (breadcrumb + title + description + action slot + optional stats — AR-001 §25) · `data-list` · `record-detail` · `entity-form` · `conversation` · `order-history` — đúng classification đã khóa (Page Header = Pattern).

**DoD:** pattern chỉ compose primitives/components; đúng chuẩn UI AR-001 Phần III.

**Owner test (UI):** catalog → mục **Patterns**: từng pattern với dữ liệu generic.

### P6 — Canonical Sandbox (rewrite 9 baseline patterns)

**Việc làm:** rewrite 9 file `Admin_Design_system/patterns/*.html` → `design_system/sandbox/patterns/*.html`: markup `ifx-*` · **0 inline style** (526 inline theo cây quyết định Solution §8) · demo data generic · bỏ `admin-auth.js`/`admin-view-gate.js` · sidebar/header = chrome demo cục bộ sandbox dựng từ nav primitives. **Không sửa bản gốc** (baseline so sánh — chưa xóa trong Sub-01).

**DoD:** 9/9 mở được · 0 inline · 0 `.ix-*` · 0 Admin runtime dependency.

**Owner test (UI):** mở cạnh nhau từng cặp:

```text
Baseline : https://staging.iflux.vn/Admin_Design_system/patterns/<x>.html
Candidate: https://staging.iflux.vn/design_system/sandbox/patterns/<x>.html
```

### P7 — Design System Regression (regression của CHÍNH DS, không phải hệ thống)

**Việc làm**

1. **Visual parity 9/9:** so từng cặp baseline/candidate ở **6 viewport canonical: 360 / 480 / 768 / 1024 / 1280 / 1440** × Dark/Light; screenshot evidence vào `gates/P7.md`. Sai khác chỉ được phép ở chỗ baseline vốn lỗi (liệt kê rõ từng điểm).
2. **Component catalog regression:** toàn bộ trang catalog (tokens/foundation/primitives/components/patterns) qua cùng ma trận viewport × theme.
3. **Automated governance checks** (script, chạy được lại): 0 inline style · 0 `.ix-*` · 0 media query ngoài 5 mốc · 0 tham chiếu Admin runtime/business trong `design_system/` · generated CSS khớp generator (chạy lại + diff).
4. Chốt `entries/admin.css|js` + `entries/web.css|js` + `manifests/` (contract consume theo capability).

**DoD:** 9/9 parity PASS toàn bộ tổ hợp + governance checks PASS. **Gate Owner duyệt trước khi LOCK.**

**Owner test (UI):** bảng evidence `gates/P7.md` (từng tổ hợp có screenshot) + tự mở xác suất vài cặp URL đối chiếu mắt thường.

### P8 — CANONICAL LOCK (kết thúc Sub-01)

**Việc làm**

1. Owner acceptance → ghi status vào `03_SoT.md` của task cha + `gates/P8.md`:

```text
CANONICAL_DS = LOCKED
READY_FOR_PLATFORM_MIGRATION

Canonical DS = ONLY TARGET FOR NEW MIGRATION
Legacy DS    = FROZEN · EXISTING CONSUMERS ONLY · MIGRATION SOURCE ONLY
               · NO NEW FEATURE / NO NEW STYLE · CHƯA XÓA
```

   (Hai bộ tạm cùng tồn tại **không phải hai SoT** — Canonical đã là SoT; Legacy chỉ là dependency chờ các sub-task migration sau giải phóng.)

2. **Bàn giao Migration Contract** (§4) — deliverable bắt buộc của P8.

**DoD:** văn bản LOCK có xác nhận Owner; Migration Contract hoàn chỉnh. **END SUB-01.**

---

## 2. Definition of Done Sub-01 (20 điểm — nghiệm thu tại P8)

1. `design_system/` là Canonical Design System độc lập.
2. Token JSON là SoT (generated CSS = readonly artifact).
3. Canonical naming chỉ dùng `ifx-*`.
4. Mobile-first + breakpoint SoT (5 mốc) đã hoạt động.
5. Light/Dark hoạt động.
6. Foundation đầy đủ.
7. Primitive đầy đủ cho capability hiện có.
8. Component đủ phủ toàn bộ visual capability của patterns.
9. Chat + Timeline là Component Family theo quyết định Owner.
10. Pattern canonical dựng đúng classification (Page Header = Pattern).
11. Navigation: Global DS chỉ chứa generic primitives; platform navigation chưa triển khai ở Sub-01.
12. 9/9 baseline patterns render lại bằng Canonical DS.
13. 9/9 đạt Visual Acceptance.
14. 0 inline presentation trong canonical patterns.
15. 0 legacy `.ix-*` trong canonical DS.
16. 0 Admin runtime dependency trong canonical DS.
17. 0 business dependency trong Global DS.
18. CSS/JS có ownership và colocation đúng.
19. Production consumption contract theo capability đã định nghĩa (entries + manifests).
20. Canonical DS được Owner LOCK.

---

## 3. Legacy tại thời điểm Sub-01 kết thúc

**KHÔNG xóa gì trong Sub-01:** DS bundle hiện hữu, Web CSS cũ, Admin UI cũ, compatibility aliases, legacy pattern source còn consumer — tất cả giữ nguyên, chuyển trạng thái **FROZEN** tại P8. Ngoại lệ duy nhất: artifact nào audit chứng minh là phần nội bộ sandbox/DS và **hoàn toàn 0 consumer ngoài Sub-01** thì được dọn trong task.

Cleanup toàn cục là **sub-task cuối chương trình** (§5), chỉ chạy sau: all migration COMPLETE → full regression PASS → 0 consumer evidence → DELETE → post-delete regression PASS.

---

## 4. Migration Contract — deliverable bàn giao của Sub-01

Để các task sau **consume chuẩn, không tự diễn giải / không tạo DS mới**, P8 bàn giao file contract (đặt tại `design_system/CONTRACT.md`, tham chiếu từ `gates/P8.md`) gồm:

1. Canonical directory. 2. Token contract (JSON SoT, generated readonly). 3. Naming contract (`ifx-*`). 4. Dependency graph (một chiều). 5. Responsive/breakpoint contract (5 mốc, mobile-first, `/* bp:* */`). 6. Theme contract (semantic tokens; web adapter). 7. Primitive/Component/Pattern rules (ranh giới đã khóa). 8. Navigation ownership rule (primitives = Global; structure = Platform). 9. Capability loading contract (entries + manifests). 10. CSS/JS placement rules (colocation, ownership). 11. Legacy compatibility rule (FROZEN/MIGRATION-ONLY). 12. Visual acceptance baseline (ma trận 6 viewport × 2 theme + governance checks). 13. Prohibited patterns (0 inline, 0 `.ix-*` mới, 0 số breakpoint lạ, 0 sửa generated, 0 DS song song).

---

## 5. Downstream roadmap — CHỈ THAM CHIẾU, không phải scope Sub-01

Các yêu cầu Owner 26-08 về test từng page Admin/User Web, sub-sub-task 5–10 page, full regression, post-cleanup regression **giữ nguyên ở cấp chương trình lớn** — nằm ở các giai đoạn sau:

```text
Sub-01  ESTABLISH CANONICAL DS → LOCK                        (task này)
        ↓
Sub-02+ ADMIN / USER WEB / PLATFORM / MODULE MIGRATION
        · mỗi scope: Scope Freeze → Audit riêng từng page
          (Runtime · DOM ownership · Data/Domain SoT · Page Host ·
           CSS/JS ownership · DS consumption · Responsive · Theme ·
           Interaction · Legacy dependency)
        · AS-IS → AR-001/Canonical DS comparison → Gap Analysis
          → Domain SoT Gate (nếu có) → Solution → Migration → Verify
          → Cleanup → Accept
        · KHÔNG suy từ Sub-01 rằng page chỉ cần đổi CSS
        · KHÔNG audit một page rồi suy ra page khác
        ↓
FULL SYSTEM REGRESSION  (Admin + User Web, full platform inventory
        + regression matrix — lập tại đúng sub-task đó, không phải Sub-01)
        ↓ 100% PASS + 0 consumer legacy evidence
FINAL SUB-TASK: LEGACY DESIGN SYSTEM CLEANUP
        DELETE legacy DS / duplicate foundation / compatibility / old patterns
        ↓
POST-DELETE FULL REGRESSION → PROGRAM COMPLETE = ONE iFLUX DESIGN SYSTEM
```

---

## 6. Rủi ro & cách chặn (trong scope Sub-01)

| Rủi ro | Chặn bằng |
| --- | --- |
| Generated CSS bị sửa tay | Header DO NOT EDIT + P7 chạy lại generator và diff — lệch = FAIL gate |
| Code mới lọt vào DS cũ trong lúc build | Invariant FROZEN công bố tại P8. P1–P7 không được thay đổi runtime/page production ngoài scope; code canonical chủ yếu nằm trong `design_system/`, các thay đổi tooling/config/documentation liên quan trực tiếp được phép nếu có ownership rõ và được ghi evidence |
| Parity "nhìn có vẻ giống" | P7 ép ma trận cặp URL × 6 viewport × 2 theme, screenshot từng tổ hợp |
| Scope creep sang migration page | §0 + §5: mọi việc đụng page thật ngoài sandbox = ngoài scope, dừng và báo Owner |
| Solution chưa trả lời một điểm thi công | CG-030: dừng, nêu phương án, chờ Owner — không tự bịa |

---

## 7. Điểm dừng bắt buộc (Owner gate)

```text
Duyệt Plan này              → mở P1                          [DONE — P1 PASS/APPROVED 26-08]
Cuối P2 (Responsive Playground + matrix) → Owner nhìn trực tiếp trên sandbox
                              và xác nhận thì P2 mới PASS     [Owner gate bổ sung 26-08]
Cuối P7 (parity + checks)   → Owner duyệt trước khi LOCK
P8 LOCK + Migration Contract → END SUB-01; mở Sub-02+ là quyết định riêng của Owner
```

Ngoài các điểm trên, các phase còn lại chạy liên tục; cuối mỗi phase tôi báo kết quả + URL test để Owner xem, không chờ approve từng phase trừ khi Owner yêu cầu.
