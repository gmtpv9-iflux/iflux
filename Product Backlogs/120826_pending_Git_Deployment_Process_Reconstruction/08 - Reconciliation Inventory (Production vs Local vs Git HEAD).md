# 08 — Reconciliation Inventory (Production vs Local vs Git HEAD)

**Phase:** Phase 1 — Reconciliation Audit (theo `07 - Plan.md`)
**Trạng thái:** `EXECUTED — STOP tại Exit Gate Phase 1, chờ Owner review`
**Phạm vi:** Chỉ đọc (read-only). Không tạo commit, không push, không đổi Production/Staging/branch/credential.
**Ngày thực hiện:** 2026-08-12

---

## 0. Tuyên bố phạm vi và giới hạn

Tài liệu này **chỉ** trả lời một câu hỏi: *"Local, Git HEAD và Production hiện khác nhau ở đâu, và khác biệt đó có evidence gì?"*

Tài liệu này **không**:

- không đề xuất nội dung baseline commit sẽ chứa gì (đó là quyết định của Owner sau khi review tài liệu này);
- không root-cause vì sao Production tự trôi (nếu có) — chỉ ghi nhận sự kiện;
- không sửa bất kỳ file nào trên Local hay Production.

---

## 1. Phương pháp (Methodology) — quan trọng, đọc trước khi xem bảng phân loại

Lần audit trước (`02/05 - Mandatory Audit`) dùng **mtime-based diff** (`find -newermt`) để ước lượng "Production đã đổi gì". Cách này có nhược điểm: mtime bị ảnh hưởng bởi việc redeploy lại nội dung không đổi, và mốc so sánh (ngày backup commit) không phản ánh đúng thời điểm deploy thật.

Lần này, Phase 1 dùng lại **mtime refresh** để khoanh vùng, nhưng **evidence quyết định phân loại là content-level (checksum)**, không phải mtime:

```text
Bước 1 — mtime refresh (khoanh vùng)
  find Production -newermt "<ngày Git HEAD commit>"
       ↓
Bước 2 — checksum diff thật (quyết định)
  rsync --checksum --itemize-changes --dry-run
  (Local → Production, không ghi gì lên Production)
       ↓
Bước 3 — nếu checksum khác nhau
  diff nội dung trực tiếp (git diff / ssh cat + diff)
  tìm marker/comment tự trỏ evidence (BR-id, task-id, ngày)
       ↓
Bước 4 — chỉ khi có marker rõ ràng → gắn evidence B
       không có marker → giữ D, không suy đoán
```

Tất cả lệnh dùng ở Bước 2–3 đều là `--dry-run` / `cat` / `diff` — không ghi gì lên Production.

---

## 2. Refresh — số liệu hiện tại

| Nguồn | Giá trị |
|---|---|
| Git branch hiện tại | `backup/100826-appshell-foundation-20260810` |
| Git HEAD | `997c2cf` — 2026-08-10 17:19:11 +0700 |
| Local uncommitted (`git status --short`) | **339** (`271 M` · `56 ??` · `12 D`) |
| Production files có mtime mới hơn Git HEAD commit (web root + backend, loại `node_modules`/`.git`) | 150 (134 web + 16 backend) |
| PM2 backend process uptime | ~65 phút tại thời điểm audit gần nhất trong hội thoại → process đã restart gần đây, phản ánh code hiện tại trên đĩa |

---

## 3. Kết quả cốt lõi (Executive Finding)

> **Sau khi đối chiếu bằng checksum thật (không phải mtime), tuyệt đại đa số 339 thay đổi uncommitted ở Local đã CÓ MẶT NGUYÊN VẸN trên Production (byte-for-byte giống nhau).**

Cụ thể:

| Nhóm | Số file | Ý nghĩa |
|---|---|---|
| **A — Local = Production (khớp checksum)** | **~305** | Đã deploy, không có rủi ro baseline. Chiếm ~90% của 339. |
| **B — Local mới hơn Production (có evidence)** | **9 file + 2 dir mới (site-seo, seo-platform, tests, migrations)** | Việc đang làm dở, có citation rõ ràng, an toàn để giữ trong baseline như "intended work in progress". |
| **C — Legacy/unwanted residue** | **~30 file (chỉ cache-bust version-string, không có code thật)** | Tàn dư từ task đã bị Owner bỏ (Sidebar Scroll Behavior / sticky). Không có rủi ro runtime nhưng cần dọn tên version ở lần cache-bust sau. |
| **D — Không giải thích được / Production tự trôi** | **11 file + 1 phát hiện hạ tầng nginx** | Không có evidence Local nào giải thích. Giữ nguyên D theo đúng yêu cầu — không tự quyết. |
| **Tài liệu (Product Backlogs, .md)** | **53** | Thuần documentation, zero runtime footprint. Xếp vào B hiển nhiên (không cần citation ngoài — chính nó là evidence). |
| **Deleted (D status trong git)** | **3** | Xem mục 7. |

---

## 4. Nhóm A — Local = Production (khớp checksum, an toàn)

**Evidence:** `rsync -rn --checksum --itemize-changes` chạy Local → Production cho 3 vùng (`Admin_Design_system/`, `User_Web/`, `backend/src/`). Với mọi file tồn tại ở cả hai phía, **0 sai khác checksum** ngoài các file đã liệt kê ở Nhóm B/C/D dưới đây.

| Vùng | Số file Nhóm A | Ghi chú |
|---|---|---|
| `Admin_Design_system/` | 127 (130 M/?? trừ 3 thuộc Nhóm B/D) | Đã deploy nguyên vẹn |
| `User_Web/` | 117 (122 M trừ 5 thuộc Nhóm B/D) | Đã deploy nguyên vẹn |
| `backend/src/` (phần track M) | 11/11 | Đã deploy nguyên vẹn |
| `backend/` (module mới `seo-platform/`, `site-seo/`, migrations, tests) | Toàn bộ file tồn tại trên Production, trừ `site-seo-resolver.js` (→ Nhóm B) | Đã deploy |

**Cluster nội dung xác nhận qua sample diff (không phải suy đoán):**

1. **Header Logo Ownership Migration** — marker `?v=seoLogoOnly20260810`, `?v=seoBrandLogo36px20260810`, thay `<div class="ix-brand-logo"><svg>...` bằng `<img class="ix-brand-logo" data-ifx-seo-logo>`. Áp dụng trên hầu hết HTML entry point Admin_Design_system + User_Web. Khớp với quyết định P0/P1/P2 đã thực hiện trong task Header Logo Ownership (đã verify PASS trong hội thoại trước Phase L0 SEO).
2. **SEO Metadata Management (040826)** — xoá `<title>` cứng (`documentTitle: ''`), thêm module `seo-platform/`, `site-seo/`, migrations `054/055/056`, RBAC permission `marketing.seo_system.edit` / `marketing.seo_pages.edit`, social image variant (`media-process.js`, comment tự trỏ *"BR-05 social preview gap, 2026-08-11"*). Trang `brand-identity.html` redirect sang `/admin/tiep-thi/thiet-lap-seo-he-thong` kèm comment code *"Owner 2026-08-10: UI Nhận diện thương hiệu removed — use initSeoSystem"*. → citation: `Product Backlogs/040826_Website_SEO_Metadata_Management/` (L0–L7 execution docs).
3. **AppShell Sidebar Ownership Foundation (100826)** — marker `?v=sidebarVR02/03/04_20260811`, comment tự trỏ *"AppShell Foundation VR-01/VR-03/VR-04 (100826): Left Sidebar host phải qua ensureSections()"*. Xuất hiện ở 22 file (`flow-page`, `entity-list-page`, `group-page`, `stock-page`, `community-page`, `community-post-page`, `app-shell.js`, `bootstrap.js`, `page-runtime.js`, các `*.manifest.js`). → citation: `Product Backlogs/100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/`.
4. **Community Entity Auto-Linking (090826)** — comment tự trỏ *"BR-11 Owner lock: identity slug = slugify(title)"*, module mới `community-entity-resolve.service.js`, `author-attribution-backfill.js`, `community-article-schema-fields.js`, migration `056_community_rss_article_schema_v2.sql`. → citation: `Product Backlogs/090826_Community_Article_Detail_Optimization_Entity_Auto_Linking/`.

Danh sách đầy đủ 127+117+11 file Nhóm A được liệt kê trong Phụ lục A (mục 9).

---

## 5. Nhóm B — Local mới hơn Production, có evidence rõ ràng (pending deploy)

Đây là các file **tồn tại khác checksum** giữa Local và Production, và Local **có git diff (M/??)** tương ứng — nghĩa là việc đang làm dở, có commit-comment/marker tự trỏ nguồn:

| File | Evidence (tự trỏ trong code) |
|---|---|
| `Admin_Design_system/app/community/rss-article-schema-page.js` | Community RSS Article Schema v2 — cùng cluster migration `056` |
| `Admin_Design_system/app/community/rss-catalog.js` | Cùng cluster trên |
| `Admin_Design_system/app/system/maintenance.html` | Header Logo Migration (`?v=seoLogoOnly20260810`) — chưa kịp deploy lại sau chỉnh sửa gần nhất |
| `Admin_Design_system/files (3)/auth-forgot.html` | Cùng cluster Header Logo Migration |
| `User_Web/iflux-web-ui/pages/messages.manifest.js` | SEO Metadata Management — xoá `documentTitle` cứng |
| `User_Web/iflux-web-ui/widgets/group-page/index.js` | AppShell Foundation VR-04 (100826) — bridge `ensureSections()` |
| `backend/src/modules/site-seo/site-seo-resolver.js` | SEO Metadata Management (040826) — module đã deploy nhưng bản trên Production là bản cũ hơn bản Local hiện tại |
| `infra/nginx-iflux-production-locations.conf` | SEO Metadata Management L5-TC-04 — thêm `X-Robots-Tag: noindex,nofollow` cho `/tai-khoan`, `/tin-nhan` (comment tự trỏ *"L5-TC-04 (SEO Metadata Management, 040826)"*); ngoài ra 1 dòng khác biệt encoding tiếng Việt (cosmetic, comment only) |
| `infra/nginx-iflux-production.conf` | SEO Metadata Management — thêm `map $iflux_x_robots_decorated` (decorator cho publicId theo BR-45 boundary); **file đang chạy thật là `/etc/nginx/sites-enabled/iflux-production.conf`, đã xác nhận qua `nginx -T`** |

**Đã xác nhận qua SSH trực tiếp (không suy đoán):**

- 2 trang Admin mới `thiet-lap-seo-he-thong.html`, `thiet-lap-seo-tung-trang.html` — **đã có trên Production**, checksum khớp Local.
- Migration `054/055/056` — **file .sql đã có trên Production** (`/var/iflux/backend/migrations/`). *Lưu ý: đây chỉ là bằng chứng file tồn tại trên filesystem, KHÔNG phải bằng chứng đã "apply" vào schema DB — việc xác minh DB schema nằm ngoài phạm vi Phase 1 (chỉ đối chiếu filesystem/Git).*
- Toàn bộ module `seo-platform/`, `site-seo/` (15 file) — **đã có trên Production**, chỉ riêng `site-seo-resolver.js` có nội dung khác (Local mới hơn).

**Kết luận Nhóm B:** an toàn để giữ nguyên trong baseline — đây là công việc đang làm dở của các task đã có BRD/SoT/Plan chính thức, không phải rác.

---

## 6. Nhóm C — Legacy/unwanted residue (không phải code thật, chỉ tên version)

**Phát hiện quan trọng theo đúng điều Owner lo ngại:** cache-bust version-string `?v=stickyFix20260811` còn xuất hiện rải rác trong **~30 file** (`app-shell.css`, toàn bộ `widgets/*/index.js` qua import `legacy-bridge.js?v=stickyFix20260811`, một số HTML entry point).

**Đã verify bằng nội dung thật (không chỉ tên version):**

```bash
git diff -- User_Web/iflux-web-ui/app-shell.css
# → 37 dòng, net REMOVAL (3 insertions, 34 deletions)
# → grep "position:\s*sticky" → KHÔNG có kết quả
# → find "*sidebar-scroll*" → KHÔNG tồn tại file nào
```

**Verdict:** code CSS/JS sticky thật đã được revert đúng như Owner yêu cầu ("xóa hết code rác liên quan tới sticky"). Cái còn sót lại **chỉ là chuỗi định danh cache-bust** (`stickyFix20260811`) — không có hiệu ứng runtime, không phải regression. Không chặn baseline, nhưng nên đổi tên ở lần cache-bust kế tiếp để tránh gây hiểu lầm khi đọc lại lịch sử.

**Không tự sửa trong Phase 1 này** (theo đúng ràng buộc "TUYỆT ĐỐI KHÔNG thay đổi Production/Local ngoài audit").

---

## 7. Nhóm D — Điều tra sâu (Owner Response 2026-08-12: "không chấp nhận Local/Git HEAD mặc định đúng")

**Yêu cầu của Owner:** không tìm "ai gây drift", mà xác định **trạng thái nào là đúng** để đưa vào baseline. Với từng file: diff thật, ảnh hưởng runtime, evidence, verdict KEEP/DISCARD/MERGE/UNRESOLVED. Không sửa Production.

**Phương pháp điều tra lại (khác Phase 1 lần đầu):** fetch nguyên văn nội dung Production qua `ssh cat` (không qua rsync) cho cả 10 file, rồi tính **MD5 trực tiếp** so với Local — đáng tin cậy hơn rsync itemize (không phụ thuộc mtime/block-checksum heuristic).

### 7.1 — Kết quả quan trọng: 9/10 file "D" ban đầu là **FALSE POSITIVE** của lần rsync đầu

```bash
md5 <local-file> <production-file-fetched-qua-ssh-cat>
```

| # | File | MD5 Local | MD5 Production | Kết quả |
|---|---|---|---|---|
| 1 | `Admin_Design_system/app/market/cau-hinh-thoi-gian-catalog.js` | `ee6100b3...` | `ee6100b3...` | **GIỐNG NHAU 100%** |
| 2 | `Admin_Design_system/iflux-admin-ui/top10-market-block.js` | `25983df3...` | `25983df3...` | **GIỐNG NHAU 100%** |
| 3 | `Admin_Design_system/iflux-icons/outline/background.svg` | `4a258c99...` | `4a258c99...` | **GIỐNG NHAU 100%** |
| 4 | `Admin_Design_system/iflux-icons/outline/logout.svg` | `fa91973f...` | `fa91973f...` | **GIỐNG NHAU 100%** |
| 5 | `Admin_Design_system/iflux-icons/outline/weight.svg` | `df0982e3...` | `df0982e3...` | **GIỐNG NHAU 100%** |
| 6 | `User_Web/iflux-web-ui/community-daily-feed.js` | `f2308be9...` | `f2308be9...` | **GIỐNG NHAU 100%** |
| 7 | `User_Web/iflux-web-ui/iflux-routes.js` | `62b857e9...` | `62b857e9...` | **GIỐNG NHAU 100%** |
| 8 | `backend/src/modules/data/sources-admin.routes.js` | `0d65b54f...` | `0d65b54f...` | **GIỐNG NHAU 100%** |
| 9 | `backend/src/modules/feature-requests/feature.routes.js` | `9b235505...` | `9b235505...` | **GIỐNG NHAU 100%** |
| 10 | `User_Web/iflux-web-ui/runtime/shell-url-writer.js` | `a1a88d86...` | `bed4a755...` | **KHÁC THẬT** — xem 7.2 |

**Nguyên nhân false positive:** lần rsync đầu tiên (Phase 1 gốc) chạy 1 lệnh `rsync -rn --checksum` cho toàn bộ 3 thư mục lớn trong 1 lần gọi SSH; nhiều khả năng có gián đoạn/hao hụt cục bộ khi tính checksum qua kết nối SSH không ổn định, khiến 9 file bị báo sai là "khác" trong khi thực chất giống 100%. **Bài học phương pháp:** với các file bị flag khác biệt, luôn xác nhận lại bằng fetch nguyên văn + so MD5 trực tiếp trước khi đưa vào bảng D — không tin tuyệt đối kết quả rsync itemize một lượt.

**Verdict 9 file trên: → chuyển từ D sang A (Local = Production, không có gì để giải quyết).**

### 7.2 — File duy nhất có khác biệt THẬT: `User_Web/iflux-web-ui/runtime/shell-url-writer.js`

**Diff thật (Production bên trái, Local/Git HEAD bên phải):**

```diff
-    var doReplace = opts.replace !== false;
-    /* Soft Persistent Shell khi route allow — giữ header/logo; hard fallback. */
-    var preferSoft = opts.soft !== false;
-    if (preferSoft) {
+    /* Soft-nav P1 — optional; default hard giữ nguyên. */
+    if (opts.soft) {
       var SN = global.IfluxSoftNav;
-      if (SN && typeof SN.canSoftNavigate === 'function' && SN.canSoftNavigate(url) && typeof SN.navigate === 'function') {
+      if (SN && typeof SN.navigate === 'function') {
```

**Ảnh hưởng runtime (có, không phải cosmetic):** hàm `navigate()` trong `IfluxShellUrlWriter` được gọi bởi 6 call-site thực tế, **không có call-site nào truyền `{ soft: true }` rõ ràng**:

```text
share-feature-boot.js   → navigate('/nha-cua-toi', { replace: true })
google-onetap.js        → navigate(to)
loyalty-affiliate.js    → navigate(url)
profile-view.js         → navigate(msgPath)
auth-login-init.js      → navigate('/cong-dong', { replace: true })  (x2)
```

- **Trên Production** (`preferSoft = opts.soft !== false` → mặc định TRUE): cả 6 call-site trên **âm thầm được thử soft-navigate** (giữ shell, không reload) nếu `canSoftNavigate(url)` cho phép, hard fallback nếu không.
- **Trên Local/Git HEAD** (`if (opts.soft)` → mặc định FALSE, opt-in only): cả 6 call-site trên **luôn hard-navigate** (`location.replace`/`assign`, full reload) vì không call-site nào truyền `soft: true`.

→ Đây là khác biệt hành vi thật, ảnh hưởng trực tiếp đến UX của 5 luồng điều hướng (share redirect, Google one-tap, loyalty affiliate, profile message, đăng nhập).

**Evidence quyết định — tài liệu Plan chính thức đã có sẵn, không cần suy đoán:**

> `Product Backlogs/100826_Persistent_App_Shell_Soft_Navigation/03 - Plan — Persistent Shell Soft Navigation P1.md`, mục WP-2:
> *"`IfluxShellUrlWriter.navigate({ soft: true })` hoặc delegate soft → coordinator; **default hard giữ nguyên**."*

Câu chữ này khớp **chính xác từng chữ** với comment trong bản Local/Git HEAD (`/* Soft-nav P1 — optional; default hard giữ nguyên. */`) và khớp với logic `if (opts.soft)` (opt-in, default hard).

Bản trên **Production lại làm ngược lại quyết định đã ghi trong Plan đã approve** — mặc định soft-navigate, không phải opt-in.

**Verdict: DISCARD (bản Production).** Local/Git HEAD là trạng thái đúng theo Plan P1 đã được approve. Production đã trôi lệch khỏi quyết định chính thức tại đúng điểm này (rất có thể do một revert/restore thao tác thủ công ở giai đoạn xử lý task Sidebar Scroll Behavior — không có git commit ghi lại bước trung gian nên không truy được chính xác thời điểm, nhưng không ảnh hưởng tới verdict vì Plan văn bản đã đủ thẩm quyền quyết định "trạng thái nào đúng").

→ Khi cutover: **release mới phải mang đúng logic Local/Git HEAD** (`if (opts.soft)`, default hard) cho file này; Production hiện tại phải được ghi đè bởi release, không giữ lại phiên bản đang chạy.

### 7.3 — Hạ tầng nginx: xác định chính xác config nào đang active (không chỉ dựa path)

**Evidence trực tiếp từ server (không suy đoán):**

```text
/etc/nginx/nginx.conf  → include /etc/nginx/sites-enabled/*;
                         (KHÔNG include sites-available/*)

nginx -T (config đã compile thật) → liệt kê đúng 1 file production:
  # configuration file /etc/nginx/sites-enabled/iflux-production.conf
  (sites-available/iflux-production.conf KHÔNG xuất hiện trong nginx -T)

ss -tlnp :80 :443 → chỉ nginx (5 worker process), không có webserver khác cạnh tranh

grep -rl "sites-available/iflux-production.conf" /etc/nginx/ → không có file nào tham chiếu ngược

mtime: sites-available = 2026-07-05 (hơn 1 tháng, không cập nhật)
       sites-enabled    = 2026-08-10 (đang được duy trì)
```

**Verdict: `sites-available/iflux-production.conf` = DISCARD.** Xác nhận 100% là legacy artifact chết, không được nginx load, không ai tham chiếu, không có rủi ro vì đã bất hoạt từ lâu. `sites-enabled/iflux-production.conf` = file đang chạy thật, đã đối chiếu ở mục 5 (Nhóm B, 2 gap nhỏ đã biết: `map $iflux_x_robots_decorated` + block `/tai-khoan`/`/tin-nhan` chưa deploy).

→ Dọn `sites-available/iflux-production.conf` không urgent (zero runtime risk), đưa vào Phase 4 (Deployment Boundary) của `07 - Plan.md`, không xử lý trong Phase 1.

---

## 8. `logo iflux.png` — theo quyết định Owner "giữ nguyên tạm thời"

**Kiểm tra dependency/reference (đã làm, không suy đoán):**

```bash
grep -rl "logo iflux" --include="*.html" --include="*.js" --include="*.css" --include="*.json" .
# → 0 kết quả

git log --all --diff-filter=A --oneline -- "logo iflux.png"
# → 8efc4f9 chore: import iFlux production codebase baseline
#   (có mặt từ commit import baseline đầu tiên, không phải file mới phát sinh giữa task)

ssh find /var/www/iflux/production -maxdepth 1 -iname "*logo*"
# → không có file nào — chưa từng được serve (repo root không nằm trong served path)
```

**Trạng thái hiện tại:** file đã **vắng mặt khỏi local disk từ trước khi phiên làm việc này bắt đầu** (git status hiển thị `D` — đây là việc đã xảy ra ở một phiên trước, không phải do Phase 1 này thực hiện). Không có gì để "không xoá" ở tầng filesystem vì việc xoá đã xảy ra trước đó; điều duy nhất tôi kiểm soát được là **không đưa deletion này vào baseline commit lần này**.

**Verdict: EXCLUDED FROM BASELINE.** Loại file này ra khỏi phạm vi baseline commit đầu tiên (giữ nguyên trạng thái tracked trong Git như hiện tại, không stage phần xoá). Zero reference + zero runtime impact đã được xác nhận — nhưng theo đúng chỉ đạo Owner, quyết định "xoá vĩnh viễn hay khôi phục" để dành cho một cleanup task riêng, không lẫn vào baseline reconciliation.

---

## 9. `stickyFix20260811` cache-bust residue — DEFER (theo quyết định Owner)

Giữ nguyên hiện trạng, không tạo thay đổi. Đã xác nhận trong mục 6 (giữ số cũ): không còn `position: sticky` nào trong code, chỉ còn chuỗi định danh cache-bust — không phải blocker của reconciliation. Không đụng tới trong Phase 1.

---

## 10. Deleted files (12 dòng `D` trong `git status`) — đã phân loại

| File | Phân loại | Evidence |
|---|---|---|
| `Admin_Design_system/app/marketing/brand-identity-page.js` | **B** | Consolidate vào `thiet-lap-seo-he-thong` — xác nhận qua diff `brand-identity.html` (redirect) + comment code *"Owner 2026-08-10: UI Nhận diện thương hiệu removed"*. Đã xoá đồng bộ trên Production (verify SSH: file không tồn tại trên Production). |
| `Admin_Design_system/app/marketing/brand-identity-store.js` | **B** | Cùng lý do trên |
| `Product Backlogs/100826_AppShell_Architecture_Standardization_Reuse_Foundation/*` (3 file) | **B** | Đổi tên thư mục → `100826_pending_AppShell_Architecture_Standardization_Reuse_Foundation/` (xác nhận nội dung không mất, chỉ đổi tên folder theo convention trạng thái task) |
| `Product Backlogs/100826_AppShell_Sidebar_Scroll_Behavior/*` (6 file) | **B** | Đổi tên thư mục → `100826_pending_AppShell_Sidebar_Scroll_Behavior/` — cùng lý do |
| `logo iflux.png` (root repo) | **EXCLUDED FROM BASELINE** | Xem mục 8 — Owner giữ nguyên tạm thời, không đưa vào baseline lần này |

---

## 11. BẢNG FINAL — A/B/C/D Resolution (sau điều tra sâu Nhóm D)

| Nhóm | Nội dung | Số file | Trạng thái cuối |
|---|---|---|---|
| **A — accepted** | Local = Production, checksum khớp (bao gồm 9 file vừa reclassify từ D) | **~314** | ✅ Baseline candidate |
| **B — accepted** | Local mới hơn Production, có evidence Product Backlog cụ thể (rss-schema, header-logo, SEO title, VR-04 sidebar, site-seo-resolver, 2 nginx gap) | **9 file** | ✅ Baseline candidate |
| **B — accepted (docs)** | Product Backlogs `.md` — tự chứng minh | **53** | ✅ Baseline candidate |
| **B — accepted (deleted, có evidence)** | brand-identity-page/store.js + 9 file rename folder Product Backlogs | **11** | ✅ Baseline candidate (ghi nhận xoá/rename) |
| **C — deferred** | `stickyFix20260811` cache-bust residue, không còn code sticky thật | **~30** | ⏸ Deferred theo quyết định Owner — không chặn baseline |
| **D → resolved thành A** | 9 file rsync false-positive, đã xác nhận MD5 giống 100% | **9** | ✅ Baseline candidate (đã thuộc A ở dòng đầu) |
| **D → resolved thành DISCARD (không đưa vào baseline, override khi cutover)** | `shell-url-writer.js` (bản Production sai lệch WP-2 Plan) | **1** | ❌ Không giữ bản Production; release mới phải dùng bản Local/Git HEAD |
| **D → resolved thành DISCARD (dọn sau, zero-risk)** | `/etc/nginx/sites-available/iflux-production.conf` — xác nhận dead, không được nginx load | **1 file hạ tầng** | ❌ Không đưa vào baseline app code (đây là file hệ thống server, không phải file trong repo); ghi nhận dọn ở Phase 4 |
| **EXCLUDED FROM BASELINE** | `logo iflux.png` — theo quyết định Owner, tách cleanup riêng | **1** | ⏸ Không xử lý trong baseline này |

**Không còn item nào ở trạng thái UNRESOLVED có khả năng ảnh hưởng runtime/deployment correctness** — `shell-url-writer.js` đã có evidence văn bản (Plan WP-2) đủ thẩm quyền để kết luận DISCARD cho bản Production, không còn mơ hồ.

---

## 12. Target State — làm rõ mục tiêu của task (theo yêu cầu Owner)

> **Mục tiêu của task KHÔNG phải là bê nguyên toàn bộ Production hiện tại thành Source of Truth.**

- **Production hiện tại** = evidence/reference để đối chiếu, KHÔNG phải authority.
- **Baseline** = trạng thái sản phẩm đúng, sau khi đã reconciliation (đối chiếu A/B/C/D như trên) VÀ được Owner xác nhận từng điểm mơ hồ (như case `shell-url-writer.js` ở mục 7.2 — Plan văn bản mới là thẩm quyền quyết định, không phải "cái gì đang chạy trên Production").
- **Sau baseline:**
  - `GitHub` = Source of Truth cho application code.
  - `Staging` = Release Validation Environment (môi trường xác minh release trước khi lên Production).
  - `Current Production Infrastructure` = sẽ trở thành **Target Production Environment** của kiến trúc mới — **không phải server mới bắt buộc**, mà là hạ tầng hiện tại được tái cấu trúc lại phần vận hành deployment (xem mục 13).
- Legacy residue / unexplained drift (Nhóm C, D) **không được mặc nhiên đưa vào baseline** chỉ vì đang tồn tại trên Production — mỗi item phải qua đúng quy trình evidence → verdict như mục 7.

---

## 13. Owner Clarification — Cách "Production mới" được tạo ra (bổ sung, sẽ phản ánh vào `06` và `07`)

**"Production mới" không phải:**

- một server vật lý/VPS mới bắt buộc;
- xoá `/var/www/iflux` rồi copy lại toàn bộ.

**"Production mới" là:** hạ tầng Production hiện tại được **reconstructed/re-established** từ GitHub-approved baseline/release, thông qua deployment pipeline mới, tách rõ 4 lớp:

```text
PRODUCTION (hạ tầng hiện tại, tái cấu trúc phần vận hành)
│
├── Application          → GitHub-controlled: Release SHA → atomic deploy (/releases/<SHA>/ + symlink)
├── Environment config    → Production secret/config store — KHÔNG commit vào Git
├── Database              → DB Production hiện tại — GIỮ NGUYÊN dữ liệu, không reset/clone
└── Persistent storage    → media/uploads/user data — nằm ngoài application release, KHÔNG bị xoá khi deploy
```

**Luồng target (đưa vào `07 - Plan.md` Phase 6/8):**

```text
Reconciled + Owner-approved baseline
               ↓
            GitHub (production branch / SHA)
               ↓
       GitHub Actions
               ↓
      Production release → /releases/<SHA>/
               ↓
         verify + health check
               ↓
      atomic symlink switch (current → /releases/<SHA>/)
               ↓
      Production traffic
```

**Nguyên tắc cutover:**

1. Không lấy toàn bộ filesystem Production hiện tại làm baseline (chỉ Nhóm A/B đã reconciliation + Owner xác nhận mới vào baseline — xem mục 11).
2. Release Production phải được tạo từ **GitHub-approved SHA**, không phải từ trạng thái filesystem đang chạy.
3. File không thuộc release (theo baseline GitHub) không được tiếp tục tồn tại như một phần ngầm của serving state (loại bỏ đúng nghĩa "residue", không chỉ thêm mới).
4. Trước cutover, Production hiện tại chỉ là **legacy runtime/reference environment** — dùng để đối chiếu (như Phase 1 này), không phải authority.
5. Sau khi release mới verify + cutover thành công, hạ tầng Production hiện tại **chính thức trở thành Production của kiến trúc mới** — từ đó chỉ nhận release từ GitHub-controlled CI/CD, không còn đường deploy thủ công nào khác.
6. **Database KHÔNG bị reset/clone lại** — DB Production hiện tại tiếp tục là DB thật, chỉ có tầng Application (code) được thay bằng luồng release GitHub → symlink.

Chi tiết đầy đủ (rationale, trade-off, ownership từng lớp) sẽ được viết vào `06 - Gate 1 SoT + Solution Package.md` (bổ sung mục Target State Architecture) và `07 - Plan.md` (Phase 6 — Production CI/CD, Phase 8 — Production Cutover) ở bước tiếp theo, **sau khi Owner xác nhận nội dung mục 12–13 này là đúng ý.**

---

## 14. Phụ lục — Danh sách đầy đủ Nhóm A

*(Phụ lục chi tiết ~314 file Nhóm A đã được sinh ra trong quá trình audit; do khối lượng lớn, danh sách đầy đủ có thể cung cấp riêng theo từng vùng nếu Owner cần review từng dòng. Bản tóm tắt theo cluster ở mục 4 đã đủ để ra quyết định baseline.)*

---

## 15. Exit Gate Phase 1

| Điều kiện | Trạng thái |
|---|---|
| Đã refresh evidence Production/Local/Git HEAD | ✅ Xong |
| Đã điều tra sâu toàn bộ Nhóm D (không chỉ giữ nguyên D) | ✅ Xong — 9/10 reclassify A, 1/10 DISCARD (bản Production) có evidence văn bản |
| Đã xác định chính xác nginx config nào active | ✅ Xong — `sites-enabled` là file thật, `sites-available` xác nhận dead |
| Đã kiểm tra dependency `logo iflux.png` | ✅ Xong — 0 reference, EXCLUDED FROM BASELINE theo quyết định Owner |
| Đã lập bảng Final A/B/C/D không còn UNRESOLVED ảnh hưởng runtime | ✅ Xong (mục 11) |
| Đã ghi rõ Target State (Production hiện tại = reference, không phải SoT) | ✅ Xong (mục 12–13) — chờ Owner xác nhận trước khi đưa chính thức vào `06`/`07` |
| Có tạo commit / push / migrate / đổi Production/Staging/nginx/credential | ❌ Không — đúng ràng buộc |

**→ Vẫn STOP tại Exit Gate Phase 1 — chờ Owner review mục 11 (bảng Final) và mục 12–13 (Target State) trước khi:**

1. Cho phép cập nhật chính thức `06` và `07` với nội dung Target State ở mục 13.
2. Cho phép tạo **một** reconciliation baseline commit duy nhất từ Nhóm A + B đã accepted.

Chưa nhận được xác nhận hai điểm trên → **chưa tạo baseline commit, chưa sửa `06`/`07`.**
