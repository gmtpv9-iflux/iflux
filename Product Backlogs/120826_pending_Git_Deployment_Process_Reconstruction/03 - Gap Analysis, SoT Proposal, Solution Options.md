# 03 — Gap Analysis · SoT Candidate · Solution Options & Trade-offs

| | |
|--|--|
| **Task** | Git & Deployment Process Reconstruction |
| **Gate** | Gate 0 → chuẩn bị input cho Gate 1 |
| **Implementation** | `NOT AUTHORIZED` — tài liệu này **chỉ đề xuất**, không quyết định, không code, không đổi Production/Staging |
| **Input** | [`02 - Mandatory Audit Evidence.md`](./02%20-%20Mandatory%20Audit%20Evidence.md) |
| **Owner phải làm gì với tài liệu này** | Đọc Gap Analysis → chọn 1 phương án cho mỗi Solution Decision (SD-01…SD-05) → chốt → agent mới được lập `05 - Plan.md` và bắt đầu implement theo Gate 1→5 của BRD |

---

## Phần A — Gap Analysis (BR-01 → BR-19 vs Current State)

Ký hiệu mức độ gap: 🔴 **CRITICAL** (vi phạm trực tiếp, chưa có gì) · 🟠 **PARTIAL** (có một phần) · 🟢 **OK** (đã đạt, giữ nguyên).

| BR | Yêu cầu | Current state (evidence: doc 02) | Gap |
|---|---|---|---|
| **BR-01** | Git là SoT; Production truy nguyên được về 1 Git revision | Production/Backend **không phải git checkout** (`git status` → not a git repository). Không SHA nào gắn với deployed state. | 🔴 CRITICAL |
| **BR-02** | Staging bắt buộc trước Production | `SoT — Deployment.md` P-01 hiện Owner-lock ngược lại: *"Production là mặc định, Staging chỉ khi yêu cầu rõ"* | 🔴 CRITICAL — mâu thuẫn trực tiếp với chính sách đang khoá |
| **BR-03** | Staging deploy tự động qua CI/CD | Không CI/CD nào tồn tại (AU-01.F) | 🔴 CRITICAL |
| **BR-04** | Production cần Human Approval, không tự động promote | Hiện tại **không có "Production branch"** nên khái niệm "promote" chưa tồn tại; deploy = rsync tay trực tiếp, không qua bước approval nào ngoài việc Owner đọc report | 🔴 CRITICAL (nhưng thực chất *hiện tại "an toàn" theo kiểu khác*: mọi deploy đều do Agent thực hiện sau khi Owner đọc/duyệt trong chat — chỉ là **không có audit trail hệ thống**, xem BR-17) |
| **BR-05** | Production deploy tự động qua CI/CD sau promote | Không có | 🔴 CRITICAL |
| **BR-06** | Decommission hoàn toàn quy trình cũ, không giữ song song | Chưa đụng tới — đúng theo yêu cầu "chưa authorize implementation" | ⏳ Chờ Gate 3 |
| **BR-07** | Không SSH password cho deployment | 100% đang dùng SSH root password, không key, `authorized_keys` trống (AU-03) | 🔴 CRITICAL — vi phạm nặng nhất |
| **BR-08** | Production có Release Identity (SHA, branch, timestamp) | Không có gì ngoài mtime file | 🔴 CRITICAL |
| **BR-09** | Deployment reproducible, không phụ thuộc máy Local/session | Deploy hiện tại **phụ thuộc hoàn toàn** vào máy Agent/local đang mở, gõ lệnh SSH/rsync tay | 🔴 CRITICAL |
| **BR-10** | Production phải đúng release đã Staging-verify | Không có Staging thật để verify (AU-06/AU-08: Staging dùng chung backend+DB với Production) | 🔴 CRITICAL |
| **BR-11** | Deployment có Health check + Application verification, không chỉ dựa exit code | Đã có smoke test **thủ công** (`curl /health`, hard refresh) theo `SoT — Deployment.md` §9 — nhưng không tự động, không block khi fail | 🟠 PARTIAL |
| **BR-12** | Rollback theo Git revision/artifact xác định | Rollback hiện tại = "rsync lại file cũ từ local/agent" (`SoT — Deployment.md` §10) — không dựa trên SHA cụ thể nào, phụ thuộc việc Agent còn giữ đúng bản cũ trên máy | 🟠 PARTIAL (có decision tree tốt, nhưng thiếu định danh chính xác) |
| **BR-13** | Deployment state reconcile — không zombie file | Đã xảy ra thật (P0 cleanup phải dọn `_quarantine_zombie_*`, `backend/backend/` lồng, file `.bak.*` — hệ quả của rsync không reconciliation) | 🔴 CRITICAL |
| **BR-14** | Deployment boundary rõ ràng (app/env/secret/runtime/persistent/system) | **Đã đúng một phần quan trọng**: `storage/media`, Postgres, Redis đã tách khỏi app code tree từ đầu (AU-04) | 🟠 PARTIAL — phần persistent data đã tốt; phần backup/secret/env config thì chưa |
| **BR-15** | Backup ngoài live deployment scope | `/var/www/iflux/backups/` đang nằm **trong** `/var/www/iflux/` (AU-07) — vi phạm trực tiếp | 🔴 CRITICAL (residual, nhỏ hơn về khối lượng nhưng vẫn là vi phạm nguyên văn) |
| **BR-16** | Mọi artifact có lifecycle rõ (LIVE/ARCHIVE/RUNTIME/PERSISTENT/TEMP) | Chưa có quy ước chính thức; P0 cleanup gần đây đã áp dụng đúng tinh thần này lần đầu (`/root/deploy-cleanup-20260812/`) nhưng chưa chuẩn hoá thành policy | 🟠 PARTIAL |
| **BR-17** | Audit trail: Who/What/SHA/When/Staging result/Production result | Không có hệ thống nào ghi nhận — chỉ có lịch sử chat với Owner | 🔴 CRITICAL |
| **BR-18** | Tách Release Decision (Human) vs Deployment Execution (CI/CD) | Hiện tại **cả hai đều do Agent thực hiện thủ công** theo yêu cầu Owner trong chat — không có tách bạch hệ thống | 🔴 CRITICAL |
| **BR-19** | Một deployment path chính thức duy nhất | Hiện tại đúng là "duy nhất" (chỉ có rsync/SSH) — nhưng đó chính là con đường mà BRD muốn thay thế, không phải con đường mục tiêu | 🔴 CRITICAL theo nghĩa "duy nhất nhưng sai kiến trúc" |

### Điểm tích cực cần giữ lại (không phải viết lại từ đầu)

1. **Deploy Unit taxonomy** (Frontend/Admin/Backend/Migration/Infrastructure) trong `SoT — Deployment.md` §1 — mô hình phân loại này **vẫn hợp lệ** trong kiến trúc CI/CD mới, chỉ cần map sang pipeline stage tương ứng.
2. **Rollback decision tree theo Deploy Unit** (§10) — logic "unit nào cháy → rollback đúng unit đó, không revert cả repo" là nguyên tắc tốt, giữ nguyên tinh thần khi thiết kế CI/CD rollback.
3. **Forward-Fix cho Migration** (không down-migrate) — nguyên tắc an toàn đúng, giữ nguyên.
4. **Boundary persistent data/storage đã đúng từ đầu** — `/var/iflux/storage`, Postgres, Redis chưa bao giờ bị rsync đè, không cần sửa.
5. **`SoT — Deployment.md` chính là tài liệu as-is đầy đủ nhất hiện có** — khi viết SoT mới, nên **supersede có trích dẫn** (ghi rõ "thay thế v1.2 vì lý do X"), không xoá âm thầm, đúng Engineering Change Governance (CG-006: existing code/docs = evidence, không phải authority tuyệt đối, nhưng cũng không được bỏ qua không giải trình).

---

## Phần B — SoT Candidate (đề xuất, CHƯA khoá)

Đề xuất cấu trúc **SoT-DEPLOY-002** (supersede v1.2) — chỉ là khung, nội dung chi tiết từng dòng sẽ viết sau khi Owner chốt SD-01→SD-05:

| Domain | SoT hiện tại (v1.2, as-is) | SoT đề xuất (v2, target — chờ chốt) |
|---|---|---|
| Application source | Không định danh (rsync tay) | **Git** — mọi Production release truy nguyên về 1 SHA |
| Release intent | Không có khái niệm "release" | **Production branch** = trạng thái đã authorize chạy Production |
| Release decision | Owner ra lệnh qua chat, Agent thực thi tay | **Human-controlled promotion** (hành động rời rạc, có dấu vết — merge/tag/approve tuỳ SD-01) |
| Deployment execution | Agent gõ SSH/rsync tay | **CI/CD** (nền tảng cụ thể — SD-02) |
| Staging | Thư mục static + backend/DB **chung** Production (AU-06/08) | Environment cách ly thật (mức độ cách ly — tuỳ SD-03 và ngân sách infra Owner chấp nhận) |
| Credential | SSH root password, plaintext local file | Machine credential qua secret management, không password người (SD-04) |
| Rollback | rsync lại file cũ, không SHA cụ thể | Rollback theo Git revision / artifact xác định (SD-05) |
| Backup | Trong live tree (`/var/www/iflux/backups/`) | Ngoài live tree, có lifecycle rõ (đã có tiền lệ đúng: `/root/deploy-cleanup-*`) |
| Audit trail | Không có, chỉ có chat log | Log CI/CD (who/what SHA/when/result) — engine cụ thể tuỳ SD-02 |

**Việc supersede SoT-DEPLOY-001 v1.2 chỉ chính thức có hiệu lực sau khi Owner chốt Gate 1 và bản SoT-DEPLOY-002 đầy đủ được viết + duyệt** — tài liệu này KHÔNG tự động thay thế v1.2. Cho tới lúc đó, `SoT — Deployment.md` v1.2 **vẫn là chính sách vận hành hiệu lực** cho bất kỳ deploy nào cần làm trong lúc chờ (ví dụ: nếu Owner cần fix gấp một bug Production trong khi task này đang ở Gate 1, vẫn dùng quy trình cũ, không tự ý áp quy trình mới chưa duyệt).

---

## Phần C — Solution Options & Trade-off (SD-01 → SD-05)

### SD-01 — Git Branch Model

| Option | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. GitLab Flow (2 nhánh dài hạn: `staging`, `main`=production)** | `staging` nhận merge từ feature branch → auto-deploy Staging. `main` chỉ nhận merge từ `staging` (MR do Owner approve) → auto-deploy Production. | Đúng khớp 1:1 với target operating model trong BRD (§5). Đơn giản, ít nhánh dài hạn, dễ hiểu cho 1 Owner + Agent. | Không có "release train"/versioning rõ (có thể bổ sung bằng tag sau mỗi lần promote Production). |
| **B. GitLab Flow + Release tag** (như A, cộng thêm tag `prod-YYYYMMDD-HHMM` mỗi lần Production deploy) | Như A, cộng thêm định danh release rõ ràng hơn tên branch/SHA. | Trả lời BR-08 "trực quan" hơn cho Owner (không cần đọc SHA dài). | Thêm 1 bước thao tác nhỏ mỗi lần promote — không đáng kể. |
| **C. Trunk-based + Feature Flags** | Mọi thay đổi vào `main` trực tiếp (qua MR), dùng feature flag để tắt/mở tính năng thay vì tách nhánh môi trường. | Phù hợp team lớn, deploy rất thường xuyên. | **Không khớp với yêu cầu "Staging branch riêng, auto-deploy Staging" của BRD** — đi ngược lại §5 Target Operating Model đã nêu rõ. Phức tạp hoá không cần thiết cho quy mô 1 Owner + Agent hiện tại. |

**Nhận định (không phải quyết định):** Option A hoặc B khớp trực tiếp với chính văn bản BRD (§5 đã vẽ đúng `STAGING BRANCH` → `PRODUCTION BRANCH`). Option C không phù hợp vì BRD đã minh định mô hình 2-branch. Nếu Owner đồng ý hướng A/B, câu hỏi còn lại chỉ là "có tag hay không" — quyết định nhỏ, để Owner chọn cùng lúc.

---

### SD-02 — CI/CD Platform

| Option | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. GitLab CI/CD (GitLab.com SaaS Runner)** | Dùng chính GitLab đang lưu repo (`gitlab.com:gm.tpv9/iflux.git`) — thêm `.gitlab-ci.yml`, dùng Shared Runner của GitLab.com hoặc self-hosted Runner cài trên server hiện tại. | **Không cần thêm nền tảng/tài khoản mới** — repo đã ở GitLab. Native branch protection + MR approval + CI Variables (secret) đã có sẵn trong hệ sinh thái GitLab, khớp `.cursor/rules/gitlab-workflow.mdc` đang áp dụng. Có GitLab MCP server đã tích hợp sẵn trong workspace (hiện lỗi kết nối — cần Owner fix auth) để Agent thao tác PR/CI qua tool có sẵn. | Cần xác nhận GitLab.com Shared Runner có đang bật cho repo (private project free tier có giới hạn CI minutes/tháng) — 🔴 cần kiểm tra ở Gate 1 qua GitLab UI (agent hiện chưa gọi được GitLab API). |
| **B. Self-hosted GitLab Runner cài trực tiếp trên server 103.x** | Cài `gitlab-runner` ngay trên server đang chạy Production/Staging, đăng ký với repo GitLab. | Không phụ thuộc CI minutes SaaS; Runner có sẵn quyền truy cập filesystem server (không cần SSH key riêng cho CI). | Runner nằm cùng server Production — SSH key của Runner nếu bị lộ ảnh hưởng trực tiếp server đang chạy — cần cách ly quyền (user riêng, không root) mới an toàn. |
| **C. Bên thứ 3 (GitHub Actions, CircleCI…)** | Chuyển hoặc mirror repo sang nền tảng khác để dùng CI. | Nhiều tính năng có sẵn. | **Không cần thiết** — repo đã ở GitLab, thêm nền tảng mới chỉ làm tăng surface quản lý, đi ngược "Modify-First" (rule luôn-áp-dụng của workspace: ưu tiên sửa/dùng cái đã có, không tạo mới nếu không bắt buộc). |

**Nhận định:** Option A (GitLab CI/CD trên GitLab.com) khớp nhất với hạ tầng đã có (repo đã ở GitLab, MCP GitLab đã cấu hình sẵn trong workspace dù đang lỗi auth). Option B chỉ nên chọn nếu Option A bị chặn bởi giới hạn CI minutes. Option C không có lý do để chọn ở quy mô hiện tại.

---

### SD-03 — Deployment Mechanism

| Option | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. Controlled `rsync --delete` trong boundary đã được chứng minh an toàn** | CI/CD job SSH vào server, `rsync -az --delete` **chỉ** trong các sub-path Deploy Unit đã khai (ví dụ `User_Web/`, `Admin_Design_system/`, `backend/src/`) — **loại trừ rõ** `storage/`, `backups` (sau khi đã di dời ra ngoài), `.env`, `node_modules`. | Gần với thói quen vận hành hiện tại → ít rủi ro "học lại từ đầu". Đã có Deploy Unit boundary từ SoT cũ để tái sử dụng làm exclude-list. | Nếu boundary khai sai/thiếu 1 lần → có thể xoá nhầm dữ liệu thật (đây chính là điều BRD §30 cảnh báo — chỉ dùng nếu đủ 6 điều kiện đã liệt kê). |
| **B. Atomic release directory + symlink** (`/var/www/iflux/releases/<sha>/`, symlink `current` → bản mới nhất, giữ N bản cũ) | Deploy = giải nén/copy bản mới vào thư mục riêng, đổi symlink; rollback = đổi symlink về thư mục cũ (tức khắc, không cần rsync ngược). | Rollback **cực nhanh** và **chính xác theo SHA** (đúng BR-12). Không có khái niệm "xoá nhầm" vì mỗi release là thư mục riêng, immutable. | Cần sửa nginx `root` để trỏ qua symlink `current` (Deploy Unit Infrastructure phải đổi 1 lần); tốn thêm dung lượng đĩa cho N bản giữ lại (chấp nhận được — app hiện chỉ 29M–39M). |
| **C. Artifact-based (build → package → deploy artifact, ví dụ `.tar.gz`/Docker image) qua registry** | CI build ra artifact có version, server chỉ pull & chạy artifact đó. | Chuẩn công nghiệp, tách biệt hoàn toàn build/runtime. | Backend hiện KHÔNG có bước build (Node thuần, không bundler) — thêm artifact/registry là **thêm abstraction không cần thiết** cho quy mô hiện tại (vi phạm tinh thần Modify-First nếu không có lý do rõ). Có thể là bước sau (Docker đã có `Dockerfile` sẵn trong repo — nhưng Production hiện không dùng Docker, đổi sang Docker là quyết định lớn hơn phạm vi BRD này). |

**Nhận định:** Option B (Atomic release + symlink) là lựa chọn **cân bằng nhất** — giải quyết trực tiếp BR-12 (rollback theo revision) và BR-13 (state reconciliation, vì mỗi release là thư mục sạch, không tích lũy residue) mà không cần đổi toàn bộ runtime model (vẫn PM2, vẫn Node thuần, vẫn Nginx). Option A rẻ nhất nhưng rủi ro cao nhất nếu làm sai boundary. Option C đúng nhưng vượt phạm vi cần thiết hiện tại.

---

### SD-04 — Credential Architecture

| Option | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. SSH key riêng cho CI/CD (deploy user không phải root) + GitLab CI/CD Variables (masked/protected) lưu private key** | Tạo user Linux riêng (ví dụ `deploy`) chỉ có quyền ghi vào path Deploy Unit đã khai, không có quyền root. CI dùng SSH key (không password) lưu trong GitLab CI Variable (masked). | Trực tiếp thoả BR-07 (không password) + tách "application deployment" (`deploy` user, quyền hẹp) khỏi "server administration" (root, vẫn giữ cho break-glass). Không cần hạ tầng mới. | Cần setup 1 lần: tạo user, generate SSH keypair, giới hạn quyền (`chown`/ACL đúng path), test kỹ trước khi tắt password login cho user này. |
| **B. Như A, nhưng thêm giới hạn `authorized_keys` bằng `command=` restriction (chỉ cho phép chạy rsync, không cho shell tự do)** | Siết chặt hơn A — key CI chỉ thực thi được đúng 1 lệnh rsync đã định trước. | An toàn nhất — dù key CI bị lộ cũng không thể chạy lệnh tuỳ ý trên server. | Phức tạp hơn khi cần mở rộng thêm lệnh mới (phải sửa `authorized_keys` mỗi lần thêm capability) — cần cân nhắc so với tốc độ phát triển hiện tại (nhiều thay đổi/ngày). |
| **C. Giữ SSH password nhưng đổi sang secret manager (Vault/1Password CLI) chỉ để KHÔNG lưu plaintext trong file local** | Không đổi cơ chế password, chỉ đổi nơi lưu. | Ít việc phải làm nhất. | **Không thoả BR-07** — BRD nói rõ "Application deployment không được phụ thuộc vào SSH password của con người", không phải "password ở đâu". Không giải quyết root cause (`PasswordAuthentication yes`, root login, authorized_keys trống). |

**Nhận định:** Option A là mức tối thiểu bắt buộc để thoả BR-07 đúng nghĩa. Option B là nâng cấp an toàn hơn nếu Owner muốn, đánh đổi bằng tốc độ mở rộng chậm hơn. Option C **không đạt** yêu cầu BRD, chỉ nêu để loại trừ minh bạch.

---

### SD-05 — Rollback Architecture

| Option | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **A. Rollback = redeploy Git SHA cũ qua lại pipeline CI/CD (re-run job với ref cũ)** | Không cần giữ bản build sẵn — rollback tức là "chạy lại CI/CD với commit cũ". | Đơn giản, không cần hạ tầng thêm. | Chậm hơn (phải build/deploy lại từ đầu — nhưng app nhỏ 29-39M nên không đáng kể); phụ thuộc pipeline vẫn chạy được lúc cần rollback (nếu CI đang down thì rollback cũng kẹt). |
| **B. Rollback = đổi symlink `current` sang release directory cũ đã giữ lại (gắn với SD-03 Option B)** | Tức khắc, không cần build lại, không phụ thuộc CI đang sống hay không. | Nhanh nhất, đáng tin cậy nhất khi có sự cố (đúng lúc cần rollback là lúc hệ thống có thể đang bất ổn). | Cần SD-03 chọn Option B (Atomic release) làm tiền đề — 2 quyết định này nên đi cùng nhau. |
| **C. Rollback = restore từ backup Ops (giống cách đang làm hiện tại)** | Giữ nguyên cách cũ (`SoT — Deployment.md` §10) | Không cần học gì mới. | **Không thoả BR-12** (không dựa trên Git revision xác định) — đây chính là gap đang muốn xoá bỏ, không nên chọn làm target. |

**Nhận định:** Option B phụ thuộc trực tiếp vào lựa chọn SD-03. Nếu Owner chọn SD-03 = Option B (Atomic release), thì SD-05 = Option B là hệ quả tự nhiên, không cần chọn riêng. Nếu Owner chọn SD-03 = Option A (rsync boundary), thì SD-05 nên là Option A. Option C bị loại trừ vì không đạt BR-12.

---

## Phần D — Câu hỏi Owner cần trả lời để mở Gate 1

Không tự suy đoán — liệt kê đúng các quyết định cần Owner chốt (theo `engineering-change-governance` CG-030: khi chưa đủ thông tin → trao đổi solution, chờ Owner chốt):

| # | Câu hỏi | Vì sao cần hỏi |
|---|---|---|
| 1 | **SD-01**: Chọn GitLab Flow 2-branch (A) hay có tag release thêm (B)? | Quyết định cấu trúc branch nền tảng cho mọi bước sau |
| 2 | **SD-02**: Dùng GitLab.com Shared Runner (A) hay cài Runner riêng trên server (B)? | Cần biết trước khi viết `.gitlab-ci.yml` — 2 hướng khác nhau về setup |
| 3 | **SD-03**: Atomic release + symlink (B) hay tiếp tục rsync có boundary (A)? | Ảnh hưởng trực tiếp tới cách Nginx trỏ root và cách rollback hoạt động |
| 4 | **SD-04**: Deploy user riêng + SSH key thường (A) hay thêm `command=` restriction (B)? | Ảnh hưởng mức độ an toàn vs tốc độ mở rộng sau này |
| 5 | **Staging thật (AU-06/AU-08 gap)**: Owner có đồng ý đầu tư dựng Staging **thật** (backend + DB `iflux_staging` riêng, tách khỏi Production) không, hay chấp nhận một mô hình nhẹ hơn (ví dụ Staging chỉ test Frontend/Admin static, Backend luôn test bằng cách khác)? | Đây là gap nặng nhất và tốn effort nhất — cần quyết định business trước khi lên Plan chi tiết, vì ảnh hưởng ngân sách/hạ tầng (có cần thêm 1 backend process/port riêng, DB riêng không) |
| 6 | Có cần supersede chính thức `SoT — Deployment.md` v1.2 ngay ở Gate 1, hay giữ v1.2 làm quy trình "song song hợp pháp" cho tới khi Gate 4 (Production Cutover) hoàn tất? | BR-06 yêu cầu decommission hoàn toàn, không giữ 2 quy trình chính thức song song — nhưng cần biết **thời điểm** cutover để không làm gián đoạn khả năng fix-gấp Production trong lúc build Staging/CI/CD mới |
| 7 | `iflux_legacy_pre202607` DB — giữ (Archive) hay có kế hoạch xoá riêng? (không nằm trong scope BRD này nhưng phát hiện trong audit) | Ghi nhận, không block Gate 1, chỉ cần Owner biết |

---

## Trạng thái cuối tài liệu này

```text
Gate 0 — Mandatory Audit           → COMPLETE (doc 02)
Gate 0 — Gap/SoT/Solution/Trade-off → COMPLETE (doc này)
Gate 1 — SoT & Solution (chốt)      → CHỜ OWNER trả lời Phần D
Implementation                      → NOT AUTHORIZED
```

**Không có thay đổi nào được thực hiện đối với Git, Production, Staging trong quá trình soạn tài liệu này.**
