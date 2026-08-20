# 05_Plan — Chuẩn hóa “Nhà của tôi” → “Trang chủ”

| Field | Value |
|---|---|
| Platform | User Web · Admin · Database · Routing · SEO |
| Module | User Web Page Identity |
| Task | `03_0826_User_Web_Chuẩn_hóa_Trang_chủ` |
| Tên tài liệu | `05_Plan.md` |
| Status | **OWNER LOCKED — Plan** · Implementation in progress |
| Owner | Requester + Product/Architecture Owner |
| Parent | `04_Solution.md` (OWNER LOCKED) |
| Serves | `01_Request.md` · `03_PRD.md` (FR-01–06 · AC-01–20) |

> Plan chỉ **WHEN / WHAT FILE / VERIFY**. Không đổi WHAT (PRD) hay HOW (Solution).  
> Không implement từ tài liệu này cho đến khi Owner mở Implementation.

---

## 0. Phạm vi khóa

```text
Request  →  Nhà của tôi → Trang chủ
            /nha-cua-toi → /trang-chu
            / → /trang-chu
PRD      →  FR + AC + Governance
Solution →  authority map · landing ownership · routing strategy · không EN · không public/private
```

**RULE toàn Plan**

- Modify-first. Không tạo page, helper, registry, `/admin/trang-chu/`, pageKey `trang-chu`.
- Giữ `home` / `dashboard`, folder `User_Web/home/`, widget host, user-data section `dashboard`.
- Không đổi Community / Market identity, URL, content, widget.
- Không đổi post-login → Cộng đồng.
- `/home` = leftover → `/trang-chu` (không phải canonical EN).
- Authority Conflict Rule (Solution §2): representation ngoài map → **STOP → Owner**.
- Deploy = push GitHub (`staging` / `production`). Không rsync. Không GitLab. Không SSH leftover Live.

```text
PHASE → IMPLEMENT → LOCAL VERIFY → PASS? → CONTINUE
                              └── NO → STOP → FIX → VERIFY LẠI
```

Cấm code hết rồi mới test.

---

## 1. Traceability (Request → PRD → Solution → Phase)

| Request | FR | AC | Solution | Phase |
|---|---|---|---|---|
| Display Trang chủ | FR-01 | AC-02, AC-03 | §2 catalog/nav/composition | P1 |
| Canonical `/trang-chu/` | FR-02 | AC-03, AC-05 | §2 route/slug/manifest | P2 |
| `/` → `/trang-chu/` | FR-03 | AC-04 | §3 landing ownership + §4 routing | P2 + P3 |
| Đồng bộ representation | FR-04 | AC-06–13 | §2 + §5 + §6 | P1–P5 |
| Legacy `/nha-cua-toi` | FR-05 | AC-10 | §4 outcome 3 | P3 |
| Giữ page/widget/logic | FR-06 | AC-01, AC-05, AC-14–16 | §0 GIỮ | P0 + P6 |
| Không đổi Cộng đồng/Thị trường | — | AC-17, AC-18 | §8 | P6 |
| Cùng page cuối | — | AC-20 | §1 diagram | P7–P8 |

Non-goals PRD §4 = cấm mọi phase.

---

## 2. STOP / CONTINUE / Owner

**CONTINUE** chỉ khi PASS của phase đạt.

**STOP → Owner** nếu:

- Representation ngoài Authority Map (Solution §2).
- Phải đổi `page_key` / user-data / widget `pages`.
- Phải đổi Community / Market / post-login destination.
- Phải bật locale EN hoặc public content.
- V2 Experience bị revert mà không rõ có được sửa lại.
- Production CI dùng nginx file **không** nằm trong map → không đoán, hỏi Owner.

**STOP → FIX** (không cần Owner): test/AC phase fail, lệch Solution, thiếu evidence.

### Rollback — một state, mọi layer đồng bộ

Cấm mixed state: app đã rollback mà nginx/root/SEO vẫn target `/trang-chu` (hoặc ngược lại).

**State target** khi rollback = **baseline P0** (trước P1), trừ khi Owner chỉ định state khác:

```text
Display     Nhà của tôi
Canonical   /nha-cua-toi
Landing     community  ·  /  →  /cong-dong
Leftover    /home → /nha-cua-toi
HOME crumb  /cong-dong   (như trước task)
Identity    home / dashboard   (không đổi — không cần rollback key)
```

**Layer phải revert cùng lúc** về state target:

| Layer | Về baseline |
|---|---|
| Application (route, slug, detect, nav, manifest, catalog, composition, internal refs) | Có |
| Root document `User_Web/index.html` | Có |
| Routing / Nginx (canonical `/trang-chu`, 301 `/` `/index.html` leftover) | Có |
| SEO code + DB representation (nếu P4 đã apply) | Có |

**RULE**

- Rollback = revert Git **đủ commit** để mọi layer trên cùng một state. Không revert app rồi “giữ nginx mới”.
- Chưa push: revert local đủ P1–P* đã làm.
- Đã push Staging/Production: revert/roll release **cùng bộ** app + nginx snippet CI đang serve.
- Không để location `/trang-chu` sống một mình sau khi app đã về `/nha-cua-toi`.

---

## P0 — Preflight

**Scope:** không sửa product code. Khóa baseline.

**Làm**

1. Xác nhận V2 Experience: `/trang-chu` Trang chủ · `/` landing cùng page. Nếu revert → sửa lại đúng Solution (đã khóa), không invent.
2. Xác nhận dual file boot: `User_Web/iflux-web-ui/iflux-platform-boot.js` và `User_Web/iflux-platform-boot.js` — nếu nội dung route trùng, P2 sửa **cả hai**.
3. Xác nhận nginx Production: file Git mà CI production copy. Staging = `infra/staging-1/iflux-staging-app.conf`. Worktree này có `infra/nginx-iflux-production-locations.conf` — **chỉ** dùng nếu đúng file CI production; không thì STOP Owner.
4. Baseline: `pageKey` home/dashboard; `/` → `/cong-dong`; `/nha-cua-toi` serve home; post-login = community.

**RULE:** không implement.

| | |
|---|---|
| AC phase | P0-1 V2 đúng target · P0-2 boot pair xác định · P0-3 nginx Git xác định |
| Verify | Đọc file; ghi 3 dòng evidence vào Implementation log |
| PASS | 3 mục trên + không mở scope |
| STOP | Nginx production authority không rõ |
| CONTINUE | P1 |

---

## P1 — Display + Admin/Composition representation

**Serves:** FR-01, FR-04 · AC-02, AC-06, AC-08 · D4, D6

**Sửa (modify only · giữ key)**

| File | Việc |
|---|---|
| `pages/home.manifest.js` | `path: /trang-chu` · title/documentTitle Trang chủ · `pageKey: home` |
| `page-settings-catalog.js` `PAGE-DASH` | title Trang chủ · slug/path `/trang-chu` · key `dashboard` |
| `Admin_Design_system/data/page-composition.json` | title + documentTitle Trang chủ · `path: /trang-chu` · `pageKey: dashboard` (**D4**) |
| `backend/scripts/data/page-composition.json` | Cùng D4 |
| `iflux-platform-boot.js` (cả bản trùng) | **Chỉ nav label** Trang chủ ở P1 — chưa chuyển landing (P2) |
| `iflux-entitlements.js` | label Trang chủ · key `dashboard` |
| `iflux-staging-allowlist.json` | label Trang chủ |
| `iflux-onboarding.js` · `onboarding.service.js` | title bước `target_key: home` → Trang chủ |

**Không:** widget `pages: ['dashboard']` · Admin `/admin/cong-dong` · `/admin/thi-truong`.

**Local verify**

- Grep authority P1: không còn “Nhà của tôi” / `/nha-cua-toi` trên **chính các file trên** (trừ comment lịch sử nếu không phải representation).
- Key `home`/`dashboard` còn.

| | |
|---|---|
| AC | AC-02 (một phần) · AC-06 · AC-08 (catalog/composition/manifest) |
| PASS | Display + path composition = Trang chủ / `/trang-chu`; key giữ |
| STOP | Muốn đổi pageKey |
| CONTINUE | P2 |

---

## P2 — Route SoT + landing ownership + slug/detect

**Serves:** FR-02, FR-03 · AC-03–05 · Solution §2–§3 · D5

**Thứ tự bắt buộc** (tránh gãy nav Community): **cùng commit** chuyển landing ownership **và** public path.

**Authority (đã khóa — Plan không tự quyết):**

| Hành vi | Khóa tại | Plan làm |
|---|---|---|
| Landing owner của Root `/` = `home`; community không còn owner | Solution §3 | Gỡ landing khỏi community; gán home |
| `KEY_ALIASES.root` / `landing` = `home` | Solution §2 Route SoT | Sửa alias cho khớp owner |
| `detectRoute('/')` = home | Solution §2 | `/` detect = home |
| Return path từ `/` hoặc `/guest` → canonical home `/trang-chu` | Solution §3 “Return path…” | Sửa `loginWithReturn` đúng câu đó |
| Post-login vẫn `to('community')` | Solution §3 · PRD Non-goals | **Không đổi** |

Nếu Implementation thấy hành vi Root/`loginWithReturn` **khác** đoạn Solution §2–§3 → **STOP → Owner**. Không invent alias mới.

| File | Việc |
|---|---|
| `iflux-platform-boot.js` (+ bản trùng) | `ROUTES.home.public = /trang-chu` · landing owner = home · alias + `detectRoute('/')` + `loginWithReturn` **đúng bảng authority trên** · regex path nhận `/trang-chu` (+ leftover) → `dashboard`/`home` |
| `iflux-routes.js` | Cùng public + landing owner = home (**D5**) |
| `iflux-public-slugs.js` | `/trang-chu` → `User_Web/home/` · leftover `/nha-cua-toi` và `/home` → `/trang-chu` · `USER_PUBLIC['/']` → home |
| `path-base.js` | `/trang-chu` → `User_Web/home/` |
| `runtime/bootstrap.js` · `runtime/soft-navigation.js` | Detect `/trang-chu` (+ leftover) → `home` |

**Không:** đổi `to('community')` sau login; không `auth: false` trên home.

**Local verify**

- `landing` owner chỉ trên `home`, không trên `community`/`market`.
- `to('community')` (không canonical) **không** ra `/`.
- `to('home', { canonical: true })` = `/trang-chu`.
- Auth post-login vẫn `to('community')`.

| | |
|---|---|
| AC | AC-03, AC-04 (app) · AC-05 · AC-17 (nav community còn `/cong-dong`) |
| PASS | Ownership đúng + community URL sống |
| STOP | Nav community resolve `/` |
| CONTINUE | P3 |

---

## P3 — Routing layer

**Serves:** FR-02, FR-03, FR-05 · AC-03, AC-04, AC-10 · Solution §4 (4 outcome)

**File**

- Staging: `infra/staging-1/iflux-staging-app.conf`
- Production: file P0-3 đã chốt (cùng strategy)
- Physical entry: `User_Web/index.html` (xem dưới)

**Ba thứ không được gộp thành Page Identity** (PRD §2.2 · Solution §3–§4: `/` không phải canonical thứ hai):

| Thứ | Là gì | Việc P3 |
|---|---|---|
| `User_Web/index.html` | Physical entry / document trên disk | Nội dung document resolve tới Canonical URL `/trang-chu` — **không** tạo page mới |
| `/index.html` | Public URL (zombie/quarantine hiện 301 `/cong-dong`) | Routing: 301 `/trang-chu` |
| `/` | Root route | Landing owner `home` (P2) + routing resolve tới Canonical `/trang-chu` |

Không biến `/`, `/index.html`, hay file `index.html` thành technical Page Identity.

**Location (convention hiện có: `location =` + `$is_args$args`)**

| Location | Việc |
|---|---|
| `= /trang-chu` (+ trailing nếu page khác đang có) | Canonical mới — kế thừa behavior `/nha-cua-toi` hiện tại: SPA `User_Web/home/index.html` · SEO shell `pageKey=dashboard` · `path=/trang-chu` |
| `= /nha-cua-toi` | 301 `/trang-chu` — không còn serve HTML |
| `= /home` · `^~ /home/` | 301 đích `/trang-chu` (leftover) |
| `User_Web/home/index.html` · `hub.html` | 301 `/trang-chu` |
| `= /index.html` | 301 `/trang-chu` (thôi `/cong-dong`) |
| Regex slug list | Thêm `trang-chu`; **giữ** `nha-cua-toi` |

**Không:** đổi `location = /cong-dong` / `/thi-truong` (trừ việc không còn là đích của `/`). Không promote `/home` thành EN.

**Local verify** (sau khi có môi trường nginx; nếu chưa deploy thì review conf + index.html)

- `/trang-chu` → home HTML · `pageKey=dashboard`
- `/` và `/index.html` → 301 `/trang-chu`
- `/nha-cua-toi?ref=X` · `/home?ref=X` → 301 `/trang-chu?ref=X`
- `/cong-dong` · `/thi-truong` vẫn serve đúng page

| | |
|---|---|
| AC | AC-03, AC-04, AC-10, AC-17, AC-18 |
| PASS | 4 outcome Solution §4 |
| STOP | Community/Market location bị sửa ngoài đích `/` |
| CONTINUE | P4 |

---

## P4 — SEO + Database representation

**Serves:** FR-04 · AC-07, AC-11–13 · Solution §6–7

| File / object | Việc |
|---|---|
| `seo-contract.js` | `dashboard → /trang-chu` |
| `seo-platform.service.js` | map `/trang-chu` → `dashboard` · **giữ** map leftover `/nha-cua-toi` → `dashboard` |
| `breadcrumb.js` | `HOME = { name: 'Trang chủ', path: '/trang-chu' }` |
| Migration mới (số tiếp theo, vd. `060_…`) | `UPDATE page_seo_configs` WHERE `page_key = 'dashboard'` — `seoTitle` Trang chủ \| iFlux. **Không đổi page_key.** Không sửa seed `055`. |
| `page_published_versions` artifact | Nếu JSON còn “Nhà của tôi” / path cũ: UPDATE JSON hoặc republish từ composition đã P1 — **giữ key `dashboard`** |
| Sitemap static | Không thêm `/trang-chu`. Nếu còn `/nha-cua-toi` thì gỡ (Audit: hiện không có). |
| `UTILITY_NOINDEX` | **Không đổi** |

**Local verify**

- Canonical code `/trang-chu` · HOME crumb không `/cong-dong`
- `page_key` vẫn `dashboard`
- noindex giữ

| | |
|---|---|
| AC | AC-07, AC-11, AC-12, AC-13 |
| PASS | Representation SEO + DB đúng; key giữ |
| STOP | Muốn index page hoặc đổi page_key |
| CONTINUE | P5 |

---

## P5 — Internal representation (Audit list)

**Serves:** FR-04, FR-05 · AC-09 · Solution §5

**Nhóm → file**

| Nhóm | File |
|---|---|
| Brand / Home | Mọi `User_Web/**/*.html` đang `href="/nha-cua-toi"` (home, market, flow, community, faq, share, loyalty, stock, sector, family, account, checkout, messages, watchlist, search, comments, cau-chuyen, pricing, write, post, comment) → `/trang-chu` |
| Deep links | `loyalty-page.js` · `widgets/loyalty-page/index.js` `?tab=affiliate` · `fb.home` |
| Brand / fallback JS | `share-feature-boot.js` · `iflux-web-ui.js` fallback · `widgets/messages-page` `fb.home` |
| Allowlist path | `runtime/shell-url-writer.js` thêm `/trang-chu` (leftover `/nha-cua-toi` có thể giữ nhận diện) |
| Breadcrumb UI | messages-page “Nhà của tôi” → Trang chủ |
| Copy semantic page | `faq-store.js` câu watchlist **nêu tên page** → Trang chủ |
| Admin copy của User Web page | `bugs.html` / `features.html` **chỉ nếu** mô tả chính page này |

**Không:** comment widget-registry; Community Layer URL; FAQ không gọi page; Product Backlogs lịch sử.

**Local verify**

- Grep live `User_Web/` + `Admin_Design_system/` + `backend/src`: không còn **generate** `/nha-cua-toi` cho canonical/brand (leftover map/301 được phép).
- Không còn active “Nhà của tôi” cho page này.

| | |
|---|---|
| AC | AC-02 (đủ) · AC-09 |
| PASS | Không generate URL cũ; copy page đã Trang chủ |
| STOP | Hit representation ngoài map |
| CONTINUE | P6 |

---

## P6 — Integrity gate (trước deploy)

**Serves:** FR-06 · AC-01, AC-05, AC-14–19

**Verify không sửa thêm** (fail → rollback **đủ layer** về baseline P0, §2)

- Không pageKey/`trang-chu` identity mới
- Folder `User_Web/home/` · widget id/host/`pages: dashboard` giữ
- `/cong-dong` `/thi-truong` identity/URL/content không đổi
- Post-login vẫn community
- Diff: không abstraction/page mới (AC-19)
- V2 không revert

| | |
|---|---|
| AC | AC-01, AC-05, AC-14–19 |
| PASS | Checklist trên |
| STOP | Diff vượt Solution |
| CONTINUE | P7 |

---

## P7 — Staging (push `staging` → CI)

**Serves:** AC-03, AC-04, AC-10, AC-17, AC-18, AC-20 (Staging)

**Làm:** commit P1–P5 trên worktree Staging · push `github/staging` · CI deploy. Không rsync.

**Test / evidence** (tên miền Staging)

| Test | PASS |
|---|---|
| GET `/trang-chu` | 200 · HTML `User_Web/home/` |
| GET `/` · `/index.html` | 301 `/trang-chu` · destination `home/dashboard` |
| GET `/nha-cua-toi` · `/home` (+ `?ref=`) | 301 `/trang-chu` (query giữ) |
| GET `/cong-dong` · `/thi-truong` | đúng page, không đổi identity |
| Nav | Trang chủ · Cộng đồng `/cong-dong` |
| Login rồi | vẫn Cộng đồng (không đổi post-login) |
| Admin catalog | `dashboard` · Trang chủ · không `/admin/trang-chu` |
| SEO | canonical `/trang-chu` · crumb HOME `/trang-chu` · noindex giữ |

| | |
|---|---|
| AC | AC-20 một phần (Staging) |
| PASS | Mọi test trên |
| STOP | CI fail hoặc AC lệch |
| CONTINUE | P8 khi Owner cho phép Production |

---

## P8 — Production evidence (push `production` → CI)

**Serves:** thu thập evidence live trên iflux.vn cho `06_Verify`.  
**Không** phải Final Acceptance. Plan không đóng task.

```text
P8  →  Production evidence  →  06_Verify  →  Final Acceptance
```

Cùng diff (hoặc merge) lên branch `production` · CI. Không SSH leftover.

Lặp **bảng test P7** trên **iflux.vn**. Ghi evidence (status, Location, destination page).

| | |
|---|---|
| PASS phase | Bảng test P7 thu đủ trên Production; không lệch Staging |
| STOP | CI fail hoặc Production lệch Staging — rollback đủ layer (§2) |
| CONTINUE | Giao evidence P7+P8 cho `06_Verify.md` |

`06_Verify` đối chiếu Solution §10 · AC-01–20 · sơ đồ Solution §1. **Final Acceptance chỉ ở `06_Verify`.**

---

## 3. Evidence pack (cho `06_Verify`)

Mỗi AC trong Solution §10 cần evidence P7 (Staging) và P8 (Production). Thiếu evidence = `06_Verify` chưa được phép PASS. Plan không tự chấm Final Acceptance.

---

## 4. Ngoài Plan (cấm)

Mọi mục Solution §8 + PRD Non-goals. Không “tiện thể” EN, public homepage, đổi post-login, index SEO, rename folder.

---

## 5. Decision gate

Plan không mở Product decision mới.

Implementation **không bắt đầu** cho đến Owner mở. Bắt đầu = P0.
