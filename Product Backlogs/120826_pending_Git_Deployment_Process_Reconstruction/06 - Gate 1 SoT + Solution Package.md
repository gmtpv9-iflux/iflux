# 06 — Gate 1 SoT + Solution Package (chờ Owner approve)

| | |
|--|--|
| **Input** | `01`+`01a` (BRD+BR-23), `02` (Audit Gate0), `03` (Gap/Options round 1), `04` (Owner Architecture Decisions), `05` (Audit A→G) |
| **Trạng thái** | **Package đề xuất — CHƯA phải Solution cuối.** Chờ Owner chốt các mục còn mở ở Phần C. |
| **Implementation** | `NOT AUTHORIZED` |
| **Nguyên tắc** | Không lặp lại các điểm Owner đã chốt cứng ở `04` — tài liệu này chỉ: (1) tổng hợp SoT thành 1 khung nhìn duy nhất, (2) thu hẹp các Solution Option còn mở dựa trên bằng chứng audit mới ở `05`, (3) trình bày STAGING ISOLATION PLAN theo đúng yêu cầu BR-23. |

---

## Phần A — SoT-DEPLOY-002 (candidate, supersede v1.2 CHỈ sau Gate 4 — theo đúng chỉ đạo mục 12 của `04`)

| Domain | v1.2 (as-is, vẫn hiệu lực hiện tại) | v2.0 candidate (sau cutover) |
|---|---|---|
| Application source | Không định danh — rsync tay | **GitHub** (`gitlab.com:gm.tpv9/iflux` → migrate giữ nguyên history) |
| Release intent | Không có khái niệm | **`production` branch (protected)** |
| Release decision | Owner ra lệnh qua chat, Agent thực thi tay | **Human-controlled promotion** — cơ chế cụ thể: PR merge `staging→production` do Owner approve, hoặc GitHub Environment "production" gắn Required Reviewer (2 lựa chọn không loại trừ nhau — có thể dùng cả hai lớp) |
| Deployment execution | Agent gõ SSH/rsync | **GitHub Actions** |
| Staging | Dùng chung backend+DB Production (**đã xác nhận là gap chặn — BR-23**) | Backend riêng + DB riêng + storage path riêng + email credential riêng (xem Phần B) |
| Credential | SSH root password, plaintext local file | Non-root deploy identity, self-hosted Runner (outbound-only) **hoặc** SSH key least-privilege — GitHub Actions Secrets (Environment-scoped) |
| Deployment mechanism | rsync tay, không boundary formal | Atomic release directory + symlink (candidate mạnh nhất — xem Phần C.1) |
| Rollback | rsync lại file cũ, không SHA | Đổi symlink `current` → release cũ theo SHA đã biết |
| Backup | `/var/www/iflux/backups/` (SAI — trong live tree) | Ngoài live tree, ví dụ `/var/backups/iflux-releases/` hoặc tương đương ngoài web root |
| Audit trail | Chat log | GitHub Actions run log + GitHub Deployments API (ghi SHA/thời gian/kết quả) |
| `Deployment.md` | v1.2 = current legacy, còn hiệu lực | v2.0 chỉ chính thức sau Gate 4 PASS |

---

## Phần B — STAGING ISOLATION PLAN (đầu ra bắt buộc của BR-23)

> Trả lời câu hỏi bắt buộc: **Staging có thể test một release mà không làm thay đổi Production state, ngoại trừ integration đã kiểm soát rõ, hay không?**

### B.1 Bảng isolation theo từng side-effect đã audit (doc `05` mục A)

| Side-effect | Trạng thái hiện tại | Target isolation | Mức bắt buộc |
|---|---|---|---|
| **Database** | Dùng chung DB `iflux` (Production) | Tạo DB `iflux_staging` mới, **KHÔNG clone dữ liệu thật** — apply schema sạch qua `npm run migrate` (đã có sẵn mechanism, chỉ chưa chạy trên DB mới) | 🔴 BẮT BUỘC — blocking BR-23 |
| **Database credentials** | `.env` Production dùng 1 user Postgres | User Postgres riêng cho `iflux_staging`, quyền chỉ trên DB đó | 🔴 BẮT BUỘC |
| **Backend process** | Dùng chung PM2 process `iflux-api` | Process PM2 thứ 2 (ví dụ `iflux-api-staging`), `.env` riêng trỏ `iflux_staging`, PORT riêng (ví dụ giữ 3001 cho prod, dùng port khác cho staging — đã có sẵn ý định trong `.env.staging.example`) | 🔴 BẮT BUỘC |
| **Storage/media path** | Dùng chung `/var/iflux/storage` | Path riêng, ví dụ `/var/iflux/storage-staging/` | 🔴 BẮT BUỘC |
| **Email (SMTP/Resend)** | Dùng chung credential thật — **rủi ro gửi mail thật cho user thật khi test** | Credential Staging riêng (sandbox mode nếu provider hỗ trợ) hoặc chuyển provider sang "log-only, không gửi thật" khi `APP_ENV=staging` | 🔴 BẮT BUỘC (mới phát hiện, nghiêm trọng hơn dự kiến ban đầu) |
| **Affiliate payout** | Không có gọi cổng thanh toán tự động (đã xác nhận qua code) — chỉ là DB record | Tự động an toàn **nếu** DB đã tách (không cần thêm việc riêng ngoài mục DB ở trên) | ✅ Giải quyết cùng lúc với DB isolation |
| **Redis/Cache** | Dùng chung 1 instance | Có thể dùng chung tạm thời với **DB Redis index riêng** (Redis hỗ trợ `SELECT <db_number>` 0-15) hoặc prefix key riêng theo `APP_ENV` | 🟠 Khuyến nghị, không blocking tuyệt đối (rủi ro thấp, đã đánh giá ở `05`) |
| **Queue** | In-memory shell, chưa kết nối broker thật | Không cần xử lý riêng — mỗi process (Production/Staging) có bộ nhớ riêng, không thể "lẫn" nhau vì chưa phải broker chung | ✅ Không cần hành động |
| **Cron/Scheduler** | Dùng chung PM2 process | Kèm theo mục Backend process riêng — Staging có `SCHEDULER_ENABLED` cấu hình độc lập (khuyến nghị: **tắt** ingest job thật cho Staging trừ khi Owner muốn test riêng, để giảm gọi API ngoài trùng lặp) | 🟠 Khuyến nghị |
| **DNSE (market data ngoài)** | Dùng chung credential | Nếu DNSE không có sandbox: khuyến nghị **để trống credential DNSE ở Staging** (tính năng tự tắt theo code `isConfigured()` đã có sẵn — không cần code mới) | 🟠 Khuyến nghị |

### B.2 Nguyên tắc đã Owner chốt, tái xác nhận ở Plan

- **Không** clone/migrate database ngay bây giờ (chỉ audit + lập plan — đã làm ở B.1).
- Isolation có thể nằm trên **cùng server vật lý** hiện tại (không bắt buộc server riêng) — nhưng logical/data/credential isolation phải **thật, verify được**.
- Sau khi implement B.1 đầy đủ → mới công nhận Staging là "release gate hợp lệ" cho BR-02/BR-03/BR-10.

### B.3 Việc CHƯA làm (đúng theo chỉ đạo — chỉ audit + plan ở bước này)

Tạo DB `iflux_staging`, tạo PM2 process thứ 2, sửa nginx, tạo credential riêng — **tất cả đều là Implementation, chờ Gate 1 approve xong mới làm**, không thực hiện trong tài liệu này.

---

## Phần C — Các mục còn mở, cần Owner chốt để đóng Gate 1

Owner đã chốt rất chi tiết ở `04` (15 điểm) — phần lớn SD đã có **hướng ưu tiên rõ** (ví dụ SD-03 "ưu tiên artifact-based/atomic nếu tương thích"). Dựa trên audit mới ở `05`, dưới đây là các mục cụ thể hoá còn cần Owner xác nhận cuối để Plan có thể viết chi tiết bước thực thi:

### C.1 — Deployment Mechanism (SD-03) cụ thể hoá

Bằng chứng `05.C`: backend nhỏ (1.9M code, 82M node_modules), frontend static nhỏ (29-39M), không có bước build/bundler. → **Atomic release directory + symlink** là lựa chọn khớp nhất với quy mô hiện tại, đồng thời thoả trực tiếp yêu cầu Owner mục 7 ("ưu tiên artifact-based/atomic") và mục 9 (rollback theo release đã biết tốt) mà **không cần** thêm Docker/registry (vượt nhu cầu hiện tại).

→ Đề xuất: **Atomic release directory (`/var/www/iflux/releases/<sha>/` + symlink `current`) cho Frontend/Admin; cho Backend tương tự (`/var/iflux/backend-releases/<sha>/` + symlink, PM2 trỏ theo symlink)**.

*Cần Owner xác nhận: đồng ý hướng này, hay muốn audit thêm phương án artifact/Docker trước khi chốt?*

### C.2 — Credential/Runner (SD-04) cụ thể hoá

Bằng chứng `05.D`: outbound tới GitHub thông suốt, không firewall chặn, `sudo` sẵn có. → **Self-hosted GitHub Actions Runner cài trực tiếp trên server, chạy bằng user riêng least-privilege (không phải root)** là lựa chọn triệt để nhất theo đúng câu Owner "GitHub Actions → controlled deployment mechanism → environment" — vì **loại bỏ hoàn toàn** nhu cầu SSH (không cần key, không cần password) cho application deployment.

→ Đề xuất: **Self-hosted Runner, user Linux riêng (ví dụ `iflux-deploy`), không có quyền `sudo`, chỉ có quyền ghi đúng các path Deploy Unit đã khai (ACL/chown), PM2 process Production/Staging cũng nên chuyển sang chạy bằng user này (không còn `root`) — đây là mở rộng hợp lý dù ngoài phạm vi chữ nghĩa BRD, nhưng cùng tinh thần least-privilege.**

*Cần Owner xác nhận: đồng ý Self-hosted Runner (không SSH), hay vẫn muốn phương án SSH key + user riêng (để dễ debug/can thiệp tay hơn)?*

### C.3 — GitHub repo/org

*Cần Owner cho biết: GitHub account/organization đích để tạo repo mirror (ví dụ cá nhân Owner, hay tổ chức riêng cho iFlux)? Repo private hay internal?*

### C.4 — Human Release Gate cụ thể hoá

Candidate ở `05.F`: GitHub Environment `production` + Required Reviewer, cộng với branch protection trên `production` (không cho phép auto-merge từ `staging`, chỉ nhận merge qua PR có approve).

*Cần Owner xác nhận: người duyệt (Required Reviewer) là chính Owner, hay có thêm người khác?*

### C.5 — Baseline commit cho cutover (theo bằng chứng `05.B`)

Local working tree hiện tại (kể cả phần uncommitted) phản ánh Production gần nhất hơn Git HEAD 43-commit cũ. Đề xuất hướng xử lý (chưa quyết, chỉ nêu phương án):

- **Bước 1 (không nằm trong scope BRD này, nhưng là điều kiện tiên quyết kỹ thuật):** rà soát 82 file uncommitted-nhưng-chưa-thấy-trên-Production (có thể là tàn dư task đã bỏ, ví dụ Sidebar Scroll) → dọn sạch trước khi tạo baseline commit.
- **Bước 2:** sau khi sạch, tạo 1 commit rõ ràng ghi chú "reconciliation baseline — đồng bộ Local↔Production trước khi migrate GitHub", **không** giả vờ đây là lịch sử thật của từng thay đổi cũ.
- **Bước 3:** migrate `git clone --mirror` + `push --mirror` sang GitHub, giữ nguyên toàn bộ 43 commit cũ + commit reconciliation mới.

*Cần Owner xác nhận: đồng ý hướng này, hay muốn cách xử lý baseline khác (ví dụ giữ nguyên divergence, xử lý sau cutover)?*

---

## Phần D — Trạng thái Gate (LỊCH SỬ — xem Phần E để có quyết định cuối)

```text
Gate 0 — Mandatory Audit                    → COMPLETE (02, 05)
Owner Architecture / SoT Decision           → COMPLETE (04) — phần lớn
Gate 1 — SoT & Solution cụ thể hoá cuối     → CHỜ Owner trả lời Phần C (C.1→C.5)
Implementation                              → NOT AUTHORIZED
```

---

## Phần E — GATE 1 CLOSED — Owner Final Decision (2026-08-12)

Owner đã chốt C.1→C.5 trực tiếp. Ghi nhận nguyên văn, đây là quyết định **cuối cùng** cho Gate 1 (không mở lại trừ khi có bằng chứng mới bắt buộc):

### C.1 — Deployment Mechanism → **Atomic Release Directory + Symlink**

- Không Docker/Registry ở phase này — chưa có business/technical justification tương xứng.
- Áp dụng cho cả Frontend, Admin, Backend.
- Flow: `Git SHA → GitHub Actions → prepare release → /releases/<SHA>/ → verify → atomic switch current → /releases/<SHA> → health check`.
- Rollback: `current` → previous known-good release (switch symlink, **không** copy backup file).
- **Bắt buộc có retention policy** — không để `/releases/` tích luỹ vô hạn (Plan phải định nghĩa số lượng release giữ lại).

### C.2 — Credential / Runner → **Self-hosted GitHub Actions Runner, loại bỏ hoàn toàn SSH khỏi application deployment**

- `iflux-deploy` (hoặc tương đương): không root, không sudo, không SSH password, chỉ quyền trên deployment boundary đã khai, không quyền tuỳ ý sửa hệ thống.
- **Deployment identity ≠ Runtime identity** — **không** tự động chuyển PM2 runtime user sang user deploy chỉ vì Runner dùng user đó. Tách biệt rõ, trừ khi có lý do kỹ thuật bắt buộc khác (nếu phát sinh, phải quay lại hỏi Owner).
- **Staging Runner và Production Runner = 2 identity/label riêng** — để workflow không thể chạy nhầm Production deployment trên Staging runner hoặc ngược lại.
- GitHub Environment `production` vẫn có approval gate (không đổi bởi quyết định Runner).
- Security principle chốt: không còn `Developer→SSH→Production`; không còn `CI→SSH root password→Production`. Thay bằng `GitHub→Protected workflow→Approved Production Environment→Dedicated self-hosted Production Runner→Controlled deployment boundary`.

### C.3 — GitHub Repository → **GitHub cá nhân/tổ chức Owner hiện có, KHÔNG tạo account mới**

- Repository: **Private**, GitHub hiện có của Owner = Git SoT chính thức.
- GitLab (`gitlab.com:gm.tpv9/iflux`) = **legacy source repository trong giai đoạn migration**, không phải SoT sau cutover.
- Migration: `GitLab → migration/mirror (giữ history) → GitHub → GitHub trở thành SoT`.
- **Không xoá GitLab ngay.** Sau cutover verify xong → GitLab chuyển **archive/read-only** một khoảng thời gian (giữ lịch sử + khả năng rollback migration nếu phát hiện vấn đề).
- **Không dual-write lâu dài** giữa GitLab và GitHub.

### C.4 — Human Release Gate → **Owner = Required Reviewer cho Production, 2 lớp bảo vệ**

```text
staging → PR (staging→production) → Owner approval → production branch → GitHub Actions → Production Environment (Required Reviewer) → deploy
```

- **Branch protection** (trên `production`) **+ Environment protection** (GitHub Environment `production` có Required Reviewer) — cả hai lớp, không phải một trong hai.
- **Không** bật auto-merge `staging → production`. Human luôn là Release Authority; CI/CD chỉ là Execution Authority.

### C.5 — Baseline Commit → **KHÔNG commit toàn bộ working tree mù quáng — bắt buộc Owner review trước**

**Nguyên tắc khoá quan trọng nhất của C.5:** *"Baseline reconciliation là migration activity, không phải business feature, và không được tự ý commit."* Agent **cấm tự quyết định** "thấy Local giống Production nên commit hết".

Trình tự bắt buộc:

```text
Phase 1 — Reconciliation
  Agent lập inventory divergence: Production ↔ Local ↔ Git HEAD
  Phân loại mỗi divergence: A (chắc chắn đang chạy Production) /
                             B (chắc chắn là intended current work) /
                             C (legacy/unwanted) /
                             D (chưa xác định)
        ↓
  Agent report danh sách cho Owner
        ↓
  Owner review các phần ambiguous (D, và bất kỳ A/B/C Owner muốn xem lại)
        ↓
Phase 2 — Clean baseline (CHỈ sau khi Owner approve)
  Production state + Owner-approved intended local state → Reconciliation baseline
  Tạo 1 commit rõ ràng, ví dụ: "chore: establish Git deployment reconciliation baseline"
  Commit KHÔNG giả vờ tái tạo lịch sử — chỉ đánh dấu điểm bắt đầu Owner xác nhận
        ↓
Phase 3 — GitHub migration
  Existing Git history + Reconciliation baseline → GitHub
  Giữ nguyên lịch sử cũ — KHÔNG rewrite history chỉ để "đẹp"
```

---

## Phần F — Bảng khoá kiến trúc tổng thể (Owner Final)

| Quyết định | Owner decision |
|---|---|
| Git SoT | **GitHub** |
| GitLab | Legacy → archive sau migration (không xoá ngay, không dual-write lâu dài) |
| Repo | Private, GitHub hiện có của Owner |
| Branch | `staging` → `production` |
| Staging deploy | Automatic (sau khi Staging Isolation hoàn thành — xem BR-23/Phần B) |
| Production promotion | Human (PR + approval) |
| Production reviewer | Owner |
| Production deploy | Automatic sau khi promote |
| CI/CD | GitHub Actions |
| Runner | Self-hosted, 2 identity/label riêng (Staging/Production) |
| SSH password | Loại bỏ hoàn toàn khỏi application deployment |
| SSH application deployment | Loại bỏ hoàn toàn (SSH chỉ còn cho server administration/break-glass) |
| Deployment identity vs Runtime identity | **Tách biệt** — không gộp PM2 runtime user với deploy user |
| Deploy model | Atomic release directory + symlink (`/releases/<SHA>/` + `current`) |
| Retention | Bắt buộc có policy giới hạn số release giữ lại |
| Rollback | Switch về previous known-good release (không copy `.bak`) |
| Production identity | Git SHA + deployment ID + timestamp + workflow run ID |
| Staging DB/backend/storage | Riêng hoàn toàn (BR-23) |
| Staging email | Không gửi email thật |
| Backup | Ngoài live tree |
| Old deployment process | Decommission — **chỉ tại Production Cutover, sau khi pipeline mới PASS đầy đủ** |
| `Deployment.md` v1.2 | Giữ hiệu lực đến Gate 4, chỉ supersede sau Cutover PASS |
| Baseline | Reconciliation có Owner approval từng bước (A/B/C/D), không tự ý commit |

---

## Phần G — Trạng thái Gate (FINAL)

```text
Gate 0 — Mandatory Audit                    → COMPLETE
Owner Architecture / SoT Decision           → COMPLETE
Gate 1 — SoT & Solution                     → ✅ CLOSED (Phần E, 2026-08-12)
Implementation                              → NOT AUTHORIZED (chờ 07 - Plan.md + Owner approve Plan)
```

**Không có thay đổi nào được thực hiện đối với GitHub/GitLab/Production/Staging trong bước đóng Gate 1 này.** Tiếp theo: `07 - Plan.md`.

---

## Phần H — Target State Architecture: Production hiện tại = Reference, không phải SoT (bổ sung, Owner Clarification 2026-08-12)

**Bổ sung này không mở lại Gate 1** (Phần E–G vẫn giữ nguyên hiệu lực) — đây là làm rõ thêm một điểm quan trọng phát sinh từ Phase 1 Reconciliation Audit (`08`): **"Production mới" được tạo ra như thế nào, và Production hiện tại đóng vai trò gì trong quá trình đó.**

### H.1 — Nguyên tắc cốt lõi

> **Mục tiêu của task KHÔNG phải là bê nguyên toàn bộ filesystem Production hiện tại thành Source of Truth.**

- **Production hiện tại** = evidence/reference để đối chiếu (dùng trong Reconciliation Audit, `08`) — **không phải authority** tự động đúng chỉ vì "đang chạy".
- **Baseline** = trạng thái sản phẩm đúng, chỉ hình thành sau khi: (1) reconciliation từng điểm khác biệt Production↔Local↔Git HEAD, và (2) Owner xác nhận từng điểm mơ hồ dựa trên **evidence có thẩm quyền cao hơn** (BRD/SoT/Plan đã approve) — không dựa trên "cái gì đang chạy" đơn thuần. Ví dụ điển hình: file `shell-url-writer.js` — Production đang chạy một logic soft-navigation sai lệch với quyết định đã ghi trong `Product Backlogs/100826_Persistent_App_Shell_Soft_Navigation/03 - Plan.md` (WP-2: *"default hard giữ nguyên"*) → verdict là **DISCARD bản Production**, dù nó đang "chạy thật". Xem `08` mục 7.2 để có full evidence.
- Sau khi baseline được xác nhận:
  - **GitHub** = Source of Truth cho application code.
  - **Staging** = Release Validation Environment (môi trường xác minh release trước khi lên Production).
  - **Current Production Infrastructure** = sẽ trở thành **Target Production Environment** của kiến trúc mới — hạ tầng vật lý/VPS **giữ nguyên**, không cần server mới; chỉ tầng vận hành deployment được tái cấu trúc.
- Legacy residue / unexplained drift (đã audit ở `08`, Nhóm C/D) **không được mặc nhiên đưa vào baseline** chỉ vì đang tồn tại trên Production — mỗi item phải qua đúng quy trình evidence → verdict (KEEP/DISCARD/MERGE/UNRESOLVED) như đã áp dụng ở `08`.

### H.2 — "Production mới" được tạo ra như thế nào (làm rõ, tránh hiểu nhầm)

**"Production mới" KHÔNG có nghĩa:**

- một server/VPS vật lý mới bắt buộc;
- xoá `/var/www/iflux` (và `/var/iflux/backend`) rồi copy lại toàn bộ từ đầu.

**"Production mới" là:** hạ tầng Production hiện tại được **reconstructed/re-established** — tầng Application được đưa về từ GitHub-approved baseline/release qua deployment pipeline mới (Phase 6/8 của `07`), còn 3 tầng còn lại (Environment config, Database, Persistent storage) **giữ nguyên, không reset**.

### H.3 — Phân tách 4 lớp của Production (bắt buộc, áp dụng cho toàn bộ Phase 6–8 của `07`)

```text
PRODUCTION (hạ tầng hiện tại — KHÔNG đổi server, chỉ tái cấu trúc vận hành)
│
├── Application
│      └── GitHub-controlled: Release SHA → GitHub Actions → atomic deploy
│          (/releases/<SHA>/ + symlink `current` — theo C.1 đã chốt ở Phần E)
│
├── Environment config / Secrets
│      └── Production secret/config store (`.env` Production, credential DB/SMTP/DNSE...)
│          KHÔNG commit vào Git, KHÔNG nằm trong Application release
│
├── Database
│      └── DB Production hiện tại — GIỮ NGUYÊN dữ liệu thật.
│          "Reconstruct application state" TUYỆT ĐỐI KHÔNG có nghĩa là reset/clone DB Production.
│
└── Persistent storage
       └── media/uploads/user-generated content — nằm NGOÀI phạm vi Application release,
           deployment KHÔNG được xoá/động vào khi deploy release mới.
```

**Ranh giới bắt buộc khi viết Phase 6/8 chi tiết (`07`):**

1. Chỉ **tầng Application** đi qua luồng GitHub → Release SHA → atomic deploy. 3 tầng còn lại **không** thuộc phạm vi "release" và không bị deployment mechanism chạm vào.
2. Deploy Unit (path mà `iflux-deploy` Runner được cấp quyền ghi — theo C.2 Phần E) phải khai rõ **loại trừ** Environment config/secrets, Database, Persistent storage — không nằm trong `/releases/<SHA>/`.
3. File không thuộc release (theo baseline GitHub đã Owner approve) **không được tiếp tục tồn tại như một phần ngầm của serving state** — đây là cách chính xác để "dọn residue", khác với việc chỉ đơn giản thêm code mới lên trên đống cũ.

### H.4 — Luồng cutover đầy đủ (bổ sung chi tiết cho Phase 6/8 của `07`)

```text
Reconciled + Owner-approved baseline (từ `08`, Nhóm A + B accepted — xem `08` mục 11)
               ↓
            GitHub — production branch / SHA
               ↓
       GitHub Actions (Runner label `production`, theo C.2)
               ↓
      Production release → /releases/<SHA>/         ◄── CHỈ tầng Application
               ↓
         verify + health check
               ↓
      atomic symlink switch (current → /releases/<SHA>/)
               ↓
      Production traffic
```

- Trước cutover: Production hiện tại chỉ là **legacy runtime/reference environment** — dùng để đối chiếu (đúng như vai trò nó đã đóng trong `08`), không phải authority.
- Sau khi release mới verify + cutover PASS (Exit Gate Phase 8 của `07`): hạ tầng Production hiện tại **chính thức trở thành Production của kiến trúc mới** — từ đó chỉ nhận release từ GitHub-controlled CI/CD, không còn đường deploy thủ công nào khác (đúng SoT-DEPLOY-002 ở Phần A).
- **Database và Persistent storage không nằm trong phạm vi "reset" ở bất kỳ bước nào của cutover** — đây là ràng buộc cứng, áp dụng cho toàn bộ Phase 6–9 của `07`.

**Trạng thái:** đã ghi nhận vào SoT (`06`). Chi tiết thực thi tương ứng đã được phản ánh vào `07 - Plan.md` Phase 1 (điều kiện baseline), Phase 6 (Production CI/CD — deploy unit boundary), và Phase 8 (Production Cutover — 4-layer preservation). **Chưa thay đổi bất kỳ gì trên Production/Staging/GitHub/GitLab.**
