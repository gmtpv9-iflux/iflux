# 04 — Owner Architecture Decisions (Gate 1 Input)

| | |
|--|--|
| **Task** | Git & Deployment Process Reconstruction |
| **Nature** | Ghi nhận nguyên văn quyết định kiến trúc của Owner — **KHÔNG phải Solution/Plan cuối**, chỉ là input đã chốt để Mandatory Audit tiếp tục đúng hướng |
| **Implementation** | Vẫn `NOT AUTHORIZED` |
| **Horizon** | Owner xác nhận: đây là tái kiến trúc dài hạn (10 năm), không phải patch quy trình hiện tại |

Owner đã chốt 2 vòng quyết định. Vòng 2 (dưới đây) **thay thế/làm rõ thêm** một phần vòng 1 (SD-02 đổi từ "chưa rõ hosting" → chốt hẳn GitHub + chiến lược migration có thứ tự).

---

## 1. Git Hosting — CHỐT

- **GitHub = target Git hosting platform.**
- **GitHub Actions = CI/CD platform.**
- **GitLab hiện tại vẫn là Source of Truth trong suốt quá trình migration.** Không xoá, không sửa GitLab.
- GitLab chỉ chuyển thành **migration source / historical archive** **sau khi** GitHub migration + Production cutover đã verify đầy đủ.
- **Cấm** duy trì GitLab và GitHub như hai Source of Truth cạnh tranh sau cutover.
- Trước migration, bắt buộc audit: Git history, branches, tags, remotes, CI config, Git LFS/submodules (nếu có), local-only/uncommitted state, deployment-related files, quan hệ giữa Git state và Production filesystem hiện tại.
- **Cấm** "copy source hiện tại rồi init Git repo mới" — phải **preserve và verify** toàn bộ lịch sử Git khi migrate.

## 2. Git Source of Truth — CHỐT

- Sau cutover: **GitHub repository = Git Source of Truth.**
- **Production filesystem KHÔNG bao giờ là Source of Truth** — chỉ là deployed state của một Git revision/artifact đã biết.
- **Cấm** commit ngược trạng thái filesystem Production hiện tại vào Git chỉ để "khớp cho xong".
- Divergence Production/Git hiện tại phải được xử lý như **một quyết định reconciliation/cutover riêng**, không phải Git clone đơn giản.

## 3. Branch Model — CHỐT (SD-01 giải quyết xong)

```text
staging → human-controlled promotion → production
```

- `staging`: nhánh integration/release-candidate — push trigger CI/CD — validate xong tự động deploy Staging.
- `production`: nhánh protected — thay đổi cần **human-controlled promotion rõ ràng** — **cấm** tự động merge từ `staging` — thay đổi vào `production` tự động trigger deploy Production.
- Normal release path:

```text
Local → staging branch → auto deploy Staging → test/audit → Human release approval → production branch → auto deploy Production
```

- **Không có normal path Local → Production.**

## 4. Release Authority vs Deployment Execution — CHỐT

- **Human = Release Authority. CI/CD = Deployment Executor.**
- CI/CD **cấm** tự quyết định Staging PASS = đủ điều kiện lên Production.

```text
Staging PASS → Human promotion/approval → production branch → CI/CD deploy → Production
```

## 5. Staging Environment — CHỐT (mức yêu cầu, chưa chốt cách làm)

- Staging **phải** là môi trường validation thật sự độc lập.
- Gap hiện tại (Staging dùng chung backend/DB Production) = **critical architecture gap** (đã nâng thành BR-23, xem `01a`).
- Tối thiểu phải audit + thiết lập isolation cho: application/backend, database, Redis/cache, queues/workers, media/uploads, cron/scheduled jobs, WebSocket, external API, payment/financial, affiliate, email/notification, side-effect integration khác.
- Target concept:

```text
STAGING APP → STAGING DATA
PRODUCTION APP → PRODUCTION DATA
```

- Hạ tầng vật lý **có thể** dùng chung server nếu security/operational isolation đủ tốt — nhưng logical/data/credential isolation phải **thật và verify được**.

## 6. Credential Architecture — CHỐT (mức yêu cầu, chưa chốt cách làm)

- Bỏ SSH root password khỏi application deployment.
- **Cấm** chỉ đổi root password → root SSH key rồi coi là xong.
- Target: machine-to-machine deployment identity, least privilege, secret management, không plaintext credential trong repo/docs, không password do developer quản lý, không secret commit vào source.
- Hướng ưu tiên dài hạn: `GitHub Actions → controlled deployment mechanism → environment`.
- Nếu SSH vẫn cần về kỹ thuật: dùng **dedicated restricted deployment identity** (không phải root), quyền/lệnh giới hạn chặt, credential do CI quản lý.
- SSH có thể giữ lại cho: server administration, incident response, break-glass — nhưng **SSH không còn là application deployment path**.

## 7. Deployment Mechanism — CHỐT (mức yêu cầu, chưa chốt cách làm)

- **Không** giả định rsync là kiến trúc cuối chỉ vì hiện tại đang dùng rsync.
- Phải audit + so sánh: immutable artifact deployment, atomic release directory, controlled rsync, cơ chế tương đương khác.
- Hướng ưu tiên dài hạn: **artifact-based hoặc atomic deployment** nếu tương thích hạ tầng hiện tại.
- `rsync --delete` chỉ được dùng nếu Mandatory Audit chứng minh deployment boundary an toàn — **không bao giờ** dùng `--delete` ngoài boundary đã audit rõ.
- Persistent data, runtime-generated data, secrets, system config **không bao giờ** được lọt vào destructive sync.

## 8. Production Release Identity — CHỐT

Mỗi lần deploy Production phải expose/ghi nhận tối thiểu: Git commit SHA, branch/release identifier, deployment ID, deployment timestamp, CI/CD workflow/run identifier.

Owner phải trả lời được **"Production đang chạy revision nào?"** mà **không** dựa vào: mtime file, shell history, lịch sử rsync trước đó, tên file backup, đoán filesystem.

## 9. Rollback — CHỐT (mức yêu cầu, chưa chốt cách làm)

- Rollback phải dựa trên **release/revision/artifact đã biết là tốt**.
- **Cấm** dựa vào: copy tay file `.bak`, tìm thư mục cũ trên server, restore filesystem snapshot tuỳ ý.
- Ưu tiên cơ chế release/artifact/atomic-release rollback.
- Rollback phải được **test trước khi** Production cutover cuối cùng.

## 10. Backup / Live Tree Governance — CHỐT

- Backup **cấm** nằm trong live application/configuration deployment scope. Cấm: `*.bak`, `*.old`, `_quarantine*`, thư mục backup, archive deploy tạm nằm trong live web/app/config tree.
- Backup phải ở archive/recovery location **tách biệt**.
- Nginx block legacy pattern có thể dùng làm defense-in-depth, **không** được coi là giải pháp cleanup/deployment chính.

## 11. Legacy Deployment Process — CHỐT

- Quy trình SSH/manual/rsync hiện tại **không** là kiến trúc mục tiêu. **Cấm** chỉ cải tiến rồi giữ song song làm official path.
- Trình tự bắt buộc: `AUDIT → DESIGN → IMPLEMENT NEW CI/CD → VERIFY → DECOMMISSION OLD → PRODUCTION CUTOVER → FINAL AUDIT`.
- Sau cutover: không Local→Production, không manual rsync app, không SSH application deployment, không official manual fallback path. Emergency SSH access phải phân loại riêng là server administration/break-glass.

## 12. Deployment Documentation — CHỐT (khớp quyết định trước, tái xác nhận)

- **Không** thay `Deployment.md v1.2` sớm. Nó vẫn là tài liệu quy trình legacy trong suốt migration.
- Sau Production cutover thành công: `v1.2` → ARCHIVED/DEPRECATED → tài liệu deployment mới trở thành Deployment SoT.

## 13. SoT Model sau Cutover — CHỐT (khung, chi tiết implement sau)

| Domain | SoT sau cutover |
|---|---|
| Application source | GitHub |
| Release intent | Protected `production` branch / approved promotion |
| Deployment execution | GitHub Actions |
| Environment secrets | Secure CI/CD/environment secret store |
| Production application state | Deployed artifact/release |
| Persistent data | Environment-owned storage |
| Backup | External archive/recovery storage |
| Production filesystem | **KHÔNG** phải Source of Truth |

## 14. Current-State Fact — Owner đã xác nhận đọc audit doc 02

- Production hiện có divergence lớn so với Git (hàng trăm file đã sửa không có commit tương ứng).
- **Cấm** giả định filesystem Production hiện tại = một Git revision sạch.
- **Cấm** convert Production thành Git baseline mới một cách mù quáng.
- **Cấm** overwrite/reconcile Production trước khi chiến lược migration/cutover được thiết kế + approve rõ ràng.
- Đây là **migration/reconciliation problem**, không phải Git clone đơn giản.

## 15. Next Action — CHỐT

- **Chưa implement gì** trong toàn bộ 14 điểm trên.
- Ghi nhận là Owner Architecture Decisions / SoT decisions (chính là tài liệu này).
- Tiếp tục Mandatory Audit, ưu tiên theo thứ tự:

```text
A. Staging isolation
B. Production/Git reconciliation strategy
C. Deployment boundary
D. Credential/deployment identity
E. GitLab → GitHub migration
F. CI/CD architecture
G. Rollback mechanism
```

- Sau đó mới tổng hợp **Gate 1 SoT + Solution package**.
- Implementation chỉ bắt đầu sau khi Gate 1 được approve.

**Governance rule (Owner nhắc lại):**

```text
BRD → Mandatory Audit → Owner Architecture/SoT Decision → Solution → Plan → Implementation → Verification
```

Không bỏ qua gate. Không tự ý đưa ra quyết định implementation làm thay đổi đáng kể các quyết định này mà không quay lại xin approve.

---

**Trạng thái:** Quyết định kiến trúc đã ghi nhận đầy đủ. Audit A→G đang tiếp tục (xem `02 - Mandatory Audit Evidence.md` phần bổ sung / hoặc doc audit mới nếu tách riêng). Implementation: `NOT AUTHORIZED`.
