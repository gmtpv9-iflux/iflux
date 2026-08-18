# BRD — Git & Deployment Process Reconstruction

## Controlled Release & Automated Deployment

**Task:** Git & Deployment Process Reconstruction
**Status:** `OPEN — MANDATORY AUDIT / ARCHITECTURE`
**Implementation Authorization:** `NOT AUTHORIZED`
**Primary Execution Agent:** Cursor
**Owner Authority:** Architecture / Release Gate / Production Cutover

---

# 1. Executive Summary

iFlux cần thay thế hoàn toàn quy trình deployment hiện tại — vốn phụ thuộc vào Local machine, manual deployment, rsync và SSH trực tiếp vào Production — bằng một **controlled Git-based release process**.

Target operating model:

```text
LOCAL
  │
  │ Push / promote
  ▼
STAGING BRANCH
  │
  │ Automatic CI/CD
  ▼
STAGING
  │
  │ Test / Audit
  ▼
HUMAN RELEASE GATE
  │
  │ Promote approved release
  ▼
PRODUCTION BRANCH
  │
  │ Automatic CI/CD
  ▼
PRODUCTION
```

Business principle:

> **Human quyết định release nào được phép đi Production. CI/CD thực thi deployment.**

Task này **không nhằm cải tiến quy trình deployment cũ**, mà nhằm **decommission hoàn toàn quy trình cũ và thay thế bằng operating model mới**.

---

# 2. Business Context

Quy trình deployment lịch sử của iFlux có mô hình gần với:

```text
Local
  ↓
rsync / manual deployment
  ↓
Production
  ↓
SSH / server-side operations
```

Production application không phải Git checkout và đã từng được cập nhật bằng rsync một chiều, không có target-state reconciliation đầy đủ.

Audit Production gần đây đã xác nhận:

> Runtime Production hiện tại chỉ có **một backend process và một nginx runtime**. Vấn đề không phải nhiều runtime version chạy song song.

Vấn đề thực tế là:

```text
Legacy deployment process
        ↓
One-way synchronization
        ↓
No target-state reconciliation
        ↓
Production filesystem residue
```

Điều này từng dẫn tới:

* legacy application files tồn tại trên Production;
* legacy public files có thể tiếp tục truy cập được;
* Production không có Git revision identity rõ ràng;
* deployment phụ thuộc vào thao tác thủ công;
* tồn tại SSH/manual deployment path;
* khó xác định chính xác release nào đang chạy;
* khó audit deployment history;
* khó rollback theo release identity;
* lỗi cũ có thể tái xuất hiện thông qua filesystem residue.

---

# 3. Business Problem

Hệ thống hiện tại thiếu một **controlled release mechanism**.

Deployment đang phụ thuộc quá nhiều vào:

> filesystem state + server access + manual operation

thay vì:

> Git-controlled release state + automated deployment.

Business cần chuyển từ:

```text
"Deploy code lên server"
```

sang:

```text
"Promote một release đã được kiểm chứng
 và để hệ thống tự triển khai"
```

---

# 4. Business Objective

Task phải tạo ra một operating model trong đó:

1. Developer làm việc tại Local.
2. Revision được đưa vào **Staging branch**.
3. Staging branch thay đổi → **CI/CD tự động deploy Staging**.
4. Staging được test/audit.
5. Khi Staging PASS, **Owner/authorized release actor chủ động promote release** sang Production.
6. Production branch thay đổi → **CI/CD tự động deploy Production**.
7. Không còn application deployment bằng SSH/manual deployment.
8. Production release luôn có Git revision identity.
9. Production release phải là **chính release/revision đã được Staging verify**.
10. Deployment không tạo hoặc giữ lại legacy application residue.
11. Release có audit trail.
12. Release có rollback mechanism.
13. Quy trình không phụ thuộc developer machine hoặc thao tác filesystem thủ công.

---

# 5. Target Operating Model

```text
┌─────────────────┐
│   LOCAL DEV     │
└────────┬────────┘
         │
         │ Git revision
         ▼
┌─────────────────┐
│ STAGING BRANCH  │
└────────┬────────┘
         │
         │ AUTOMATIC
         ▼
┌─────────────────┐
│     STAGING     │
└────────┬────────┘
         │
         │ Test / Audit
         ▼
┌─────────────────────────┐
│ HUMAN RELEASE GATE      │
│ Approve / Promote       │
└────────┬────────────────┘
         │
         │ Controlled promotion
         ▼
┌─────────────────┐
│ PRODUCTION      │
│ BRANCH          │
└────────┬────────┘
         │
         │ AUTOMATIC
         ▼
┌─────────────────┐
│   PRODUCTION    │
└─────────────────┘
```

## Core principle

```text
Git revision
     ↓
CI/CD
     ↓
Environment
```

Không phải:

```text
Developer
     ↓
SSH
     ↓
Server
     ↓
Manual deployment
```

---

# 6. Business Requirements

## BR-01 — Git là Source of Truth

Application source phải có Git làm Source of Truth.

Production filesystem không được là source độc lập của application code.

Mọi Production application release phải truy nguyên được về một Git revision cụ thể.

---

## BR-02 — Staging là bắt buộc trước Production

Mọi release thông thường phải đi qua Staging trước Production.

Standard flow:

```text
Local
 ↓
Staging branch
 ↓
Staging
 ↓
Test / Audit
 ↓
Human release approval
 ↓
Production branch
 ↓
Production
```

Không được có standard flow:

```text
Local → Production
```

---

## BR-03 — Staging Deployment phải tự động

Khi Staging branch nhận một revision hợp lệ:

> CI/CD phải tự động deploy revision đó lên Staging.

Developer không cần SSH vào Staging để deploy application.

---

## BR-04 — Production Release phải có Human Approval

Production không được tự động promote/merge từ Staging.

Việc cho phép một release đi Production phải là hành động có chủ đích của Owner/authorized release actor.

Expected:

```text
Staging PASS
     ↓
Human release action
     ↓
Production release
```

CI/CD không được tự quyết định rằng Staging PASS là đủ để tự động phát hành Production.

---

## BR-05 — Production Deployment phải tự động

Sau khi một release hợp lệ được promote vào Production branch:

> CI/CD phải tự động deploy release đó lên Production.

Không yêu cầu người vận hành SSH vào Production để chạy application deployment.

---

# 7. BR-06 — Bắt buộc thay thế toàn bộ quy trình deployment hiện tại

Quy trình deployment hiện tại phải được **decommission hoàn toàn** và thay thế bằng process mới.

Không được:

* chỉ thêm CI/CD bên cạnh process cũ;
* giữ SSH deployment làm fallback;
* giữ manual rsync làm fallback;
* giữ legacy deployment script như một application deployment path;
* duy trì hai application deployment mechanisms chính thức song song.

Migration phải theo nguyên tắc:

```text
CURRENT PROCESS
      ↓
AUDIT
      ↓
DECOMMISSION
      ↓
NEW PROCESS
      ↓
VERIFY
```

Không phải:

```text
CURRENT PROCESS
      ↓
PATCH
      ↓
NEW PROCESS
```

---

# 8. BR-07 — Không Deployment bằng SSH Password

Application deployment không được phụ thuộc vào SSH password của con người.

Không được lưu hoặc sử dụng deployment password trong:

* Git repository;
* source code;
* deployment scripts;
* CI configuration;
* committed `.env`;
* documentation;
* agent instructions;
* plaintext files.

Nếu implementation cần machine-to-machine credential:

> Credential phải được quản lý bởi secure secret management / CI environment và không được exposed cho developer hoặc commit vào source.

SSH có thể vẫn tồn tại cho:

* system administration;
* infrastructure maintenance;
* incident response;
* break-glass access.

Nhưng các hoạt động đó phải được phân loại là **server administration**, không phải application deployment.

---

# 9. BR-08 — Production phải có Release Identity

Production phải xác định được tối thiểu:

* repository;
* Production branch;
* Git commit SHA;
* deployment timestamp;
* release/build identifier nếu có.

Owner phải có thể trả lời:

> "Production hiện đang chạy revision nào?"

mà không cần kiểm tra shell history hoặc đoán từ filesystem.

---

# 10. BR-09 — Deployment phải Reproducible

Một release được xác định bởi Git revision và/hoặc immutable artifact phải có khả năng được triển khai lại một cách có kiểm soát.

Deployment không được phụ thuộc vào:

* developer machine;
* local filesystem;
* SSH session;
* shell history;
* filesystem residue;
* file còn sót từ deployment trước;
* thao tác thủ công không được governance.

---

# 11. BR-10 — Production phải promote đúng release đã được Staging verify

Production release phải là **chính release/revision đã được deploy và verify thành công trên Staging**.

Expected:

```text
Git revision A
      ↓
Staging
      ↓
Test PASS
      ↓
Human promotion
      ↓
Production
```

Không được xảy ra:

```text
Git revision A
      ↓
Staging PASS

Git revision B
      ↓
Production
```

trong cùng một release flow nếu Revision B chưa trải qua controlled verification/release process tương ứng.

---

# 12. BR-11 — Deployment phải có Verification

Mỗi automated deployment phải có verification.

Tối thiểu:

```text
Deploy
  ↓
Health check
  ↓
Application verification
  ↓
PASS / FAIL
```

Deployment không được coi là thành công chỉ vì deployment command trả về exit code `0`.

---

# 13. BR-12 — Rollback phải xác định được

Production phải có khả năng rollback về một release/revision đã biết.

Rollback phải dựa trên:

* Git revision;
* immutable artifact;
* hoặc controlled release mechanism.

Không được phụ thuộc vào:

```text
"copy lại mấy file backup cũ trên server"
```

---

# 14. BR-13 — Deployment State phải được Reconcile

Deployment phải bảo đảm target application state phản ánh release state được deploy.

Nếu một application file không còn thuộc release hiện tại thì deployment mechanism phải có cơ chế đảm bảo file đó không tiếp tục tồn tại như một legacy application artifact trong deployment scope.

Mục tiêu:

```text
Release state
      ↓
Deployment
      ↓
Target application state
```

Không phải:

```text
Release N
   +
Release N-1 residue
   +
Release N-2 residue
   +
random backup files
```

---

# 15. BR-14 — Deployment Boundary phải được kiểm soát

Deployment phải phân biệt rõ:

### Application-owned

Application code thuộc release.

### Environment configuration

Environment-specific configuration được quản lý riêng.

### Secrets

Không thuộc application source deployment.

### Runtime-generated data

Không được deployment tùy ý xóa.

### Persistent data

Không thuộc application cleanup.

### System configuration

Không được application deployment tự ý overwrite/xóa ngoài boundary được phê duyệt.

---

# 16. BR-15 — Backup không được nằm trong Live Deployment Scope

Backup phải được lưu bên ngoài application/configuration live tree.

Không được sử dụng:

```text
*.bak
*.bak.*
*_old*
_quarantine*
```

như backup convention trong deployment scope.

Backup phải được archive ở location ngoài live tree, ví dụ:

```text
/root/<purpose>-backup-<date>/
```

---

# 17. BR-16 — Legacy Artifacts phải có Lifecycle

Mọi artifact phát sinh trong deployment/migration/backup phải thuộc một lifecycle category rõ ràng:

```text
LIVE
ARCHIVE
RUNTIME-GENERATED
PERSISTENT DATA
TEMPORARY
```

Không được có các artifact không có owner/lifecycle rõ ràng tồn tại trong live deployment scope.

---

# 18. BR-17 — Auditability

Release system phải tạo audit trail cho:

```text
Who
 ↓
Promoted what
 ↓
Git revision
 ↓
When
 ↓
Staging verification result
 ↓
Production deployment result
```

Phải phân biệt rõ:

> **Release decision** = Human

và:

> **Deployment execution** = CI/CD.

---

# 19. BR-18 — Separation of Release Decision and Deployment Execution

Release authority:

```text
Human
```

Deployment execution:

```text
CI/CD
```

Expected:

```text
Staging PASS
      ↓
Human promotion
      ↓
Production branch
      ↓
CI/CD
      ↓
Production
```

Không:

```text
Staging PASS
      ↓
CI/CD tự merge Production
      ↓
Production
```

---

# 20. BR-19 — Standard Deployment Path phải duy nhất

Sau migration phải có một application deployment path chính thức:

```text
Git
 ↓
CI/CD
 ↓
Environment
```

Không được tồn tại nhiều deployment paths chính thức cạnh nhau.

Legacy path phải được decommission.

Break-glass server administration nếu tồn tại phải nằm ngoài application deployment governance.

---

# 21. Mandatory Audit

**Implementation chưa được authorized trước khi Audit hoàn tất.**

## AU-01 — Git Audit

Audit:

* repository;
* remote;
* branches;
* current branch strategy;
* commit history;
* branch protection;
* tags;
* existing CI/CD;
* deployment-related files;
* ignored/untracked deployment artifacts.

**Output:**

`Git Governance Baseline`

---

## AU-02 — Current Deployment Entry Point Audit

Inventory toàn bộ deployment entry points:

* shell scripts;
* npm scripts;
* Makefiles;
* rsync;
* SSH;
* CI workflows;
* cron;
* PM2 commands;
* server-side deployment scripts;
* manual runbooks;
* documentation;
* agent instructions.

**Output:**

`Deployment Entry Point Inventory`

---

## AU-03 — SSH / Credential Audit

Xác định:

* SSH deployment paths;
* SSH passwords;
* SSH keys;
* CI secrets;
* server credentials;
* plaintext credentials;
* credential locations;
* scripts sử dụng credentials;
* repository/documentation credential exposure.

**Output:**

`Deployment Security & Credential Risk Register`

---

## AU-04 — Deployment Boundary Audit

Phân loại filesystem của Staging và Production:

```text
Git-owned
Artifact-owned
Environment configuration
Secrets
Runtime-generated
Persistent data
System configuration
Temporary
Archive
```

Xác định chính xác application deployment scope.

**Output:**

`Deployment Boundary Matrix`

---

## AU-05 — State Reconciliation Audit

Xác định cơ chế cần thiết để đảm bảo:

```text
Release state
     =
Target application state
```

và tránh:

```text
Deleted source file
       ↓
Zombie Production file
```

**Output:**

`Target-State Reconciliation Decision`

---

## AU-06 — Staging Audit

Audit:

* server;
* runtime;
* application source;
* configuration;
* data;
* secrets;
* Nginx;
* PM2;
* deployment capability;
* environment parity với Production.

**Output:**

`Staging Readiness Report`

---

## AU-07 — Production Audit

Audit:

* PM2;
* Nginx;
* application directories;
* persistent directories;
* runtime-generated files;
* environment files;
* deployment paths;
* SSH access;
* current runtime identity;
* remaining legacy artifacts.

**Output:**

`Production Deployment Baseline`

---

## AU-08 — Staging / Production Parity Audit

Xác định:

* application parity;
* runtime parity;
* configuration differences;
* infrastructure differences;
* persistent data differences;
* secret differences;
* deployment differences.

Mục tiêu:

> Staging phải là environment hợp lệ để validate Production release.

---

# 22. Existing Production Cleanup — P0

P0 Production Cleanup đã hoàn thành.

Backup:

```text
/root/deploy-cleanup-20260812/
```

Đã xử lý:

1. `_quarantine_zombie_20260724183745/`
2. legacy flat-root files;
3. nested `backend/backend/`;
4. legacy `backend/app.js`;
5. duplicate payout files;
6. orphan nginx configuration;
7. 89 `.bak.*` nginx backups;
8. các temporary/backup artifacts đã xác minh là residue.

Verification:

* legacy public paths → `404`;
* Cloudflare cache đã purge;
* PM2 `online`;
* không downtime;
* `nginx -t` PASS;
* current application routes vẫn `200`;
* không regression.

**P0 = PASS / CLOSED.**

P0 cleanup là **migration prerequisite**, không phải business outcome cuối cùng.

---

# 23. Root Cause

Root cause được ghi nhận:

> Production deployment hiện tại không có cơ chế bảo đảm target filesystem state phản ánh chính xác release state.

Contributing factors:

1. Production không Git-track application state.
2. Historical deployment sử dụng one-way rsync.
3. Không có target-state reconciliation đầy đủ.
4. Backup từng được đặt trong live tree.
5. Legacy artifacts không có lifecycle governance.
6. Application deployment và server administration chưa được tách biệt.

---

# 24. Source of Truth

Sau khi task hoàn thành, SoT phải được phân lớp:

| Domain               | Source of Truth                            |
| -------------------- | ------------------------------------------ |
| Application source   | Git                                        |
| Staging release      | Staging Git revision / release artifact    |
| Production release   | Production Git revision / release artifact |
| Release intent       | Controlled Git promotion                   |
| Release decision     | Human-controlled promotion                 |
| Deployment execution | CI/CD                                      |
| Environment secrets  | Secure secret management                   |
| Persistent data      | Environment-owned storage                  |
| Runtime state        | Environment runtime                        |
| Backup               | External archive                           |
| Deployment process   | Version-controlled CI/CD configuration     |

---

# 25. SoT-01 — Git Is Not Production

Production filesystem không phải Source of Truth.

Các directory như:

```text
/var/www/iflux/production
/var/iflux/backend
```

chỉ là **deployed state**.

Không được sử dụng Production filesystem như source để phát triển hoặc release.

---

# 26. SoT-02 — Production Branch Represents Release Intent

Production branch đại diện cho release state đã được authorized để chạy Production.

Production branch không được tự động nhận code chỉ vì Staging deployment PASS.

Production promotion phải là controlled human action.

---

# 27. SoT-03 — CI/CD Is Deployment Executor

CI/CD thực hiện:

```text
Git revision
 ↓
Build / Validate
 ↓
Deploy
 ↓
Health check
 ↓
Report
```

CI/CD không phải Release Authority.

---

# 28. SoT-04 — Production Must Be Traceable

Mỗi Production state phải truy nguyên:

```text
Production
   ↓
Deployment ID
   ↓
Git SHA
   ↓
Production release
   ↓
Human release action
   ↓
Staging verification
```

Không được cần dựa vào:

* shell history;
* file timestamp;
* server directory history;
* backup filename;
* "lần rsync gần nhất".

---

# 29. Solution Decisions — Chưa được tự quyết

Sau Mandatory Audit mới được chốt:

## SD-01 — Git Branch Model

Ví dụ:

* Staging branch;
* Production branch;
* feature branches;
* PR strategy;
* protection rules;
* promotion mechanism.

**Không được tự suy ra implementation từ BRD.**

---

## SD-02 — CI/CD Platform

Xác định platform phù hợp với repository/infrastructure hiện tại.

---

## SD-03 — Deployment Mechanism

Các khả năng cần đánh giá:

* controlled rsync;
* `rsync --delete` trong safe boundary;
* artifact deployment;
* clean target deployment;
* atomic release directory;
* immutable artifact;
* mechanism tương đương.

Không được chọn chỉ vì deployment cũ đang dùng rsync.

---

## SD-04 — Credential Architecture

Xác định machine-to-machine authentication và secret management.

Không được đưa SSH password vào deployment process.

---

## SD-05 — Rollback Architecture

Xác định rollback bằng:

* previous Git revision;
* immutable artifact;
* atomic release;
* hoặc mechanism tương đương.

---

# 30. Important Implementation Constraint

**Không được thực hiện task này theo cách:**

```text
Current Local → Production rsync
       ↓
thêm --delete
       ↓
DONE
```

Đó không phải target architecture.

`rsync --delete` chỉ được sử dụng nếu Audit chứng minh:

1. deployment scope chính xác;
2. persistent data nằm ngoài scope;
3. runtime-generated data được bảo vệ;
4. environment configuration được phân loại;
5. rollback khả thi;
6. security model phù hợp.

Nếu artifact-based hoặc atomic deployment tốt hơn thì phải sử dụng solution đó.

---

# 31. Workstreams

```text
W0 — Mandatory Current-State Audit
        ↓
W1 — Production Cleanup
        ↓
W2 — Git / Environment Architecture
        ↓
W3 — Deployment Boundary & State Reconciliation
        ↓
W4 — CI/CD Architecture
        ↓
W5 — Legacy SSH / Manual Deployment Decommission
        ↓
W6 — Staging Implementation
        ↓
W7 — Production Migration
        ↓
W8 — Final Security / Deployment Audit
```

Current status:

```text
W0 — Mandatory Audit        → IN PROGRESS
W1 — Production Cleanup     → PASS / CLOSED
W2+                         → NOT AUTHORIZED
```

---

# 32. Migration Principle

Không migrate bằng cách sửa tiếp legacy deployment process.

Migration phải:

```text
AUDIT OLD
    ↓
DESIGN NEW
    ↓
APPROVE NEW
    ↓
IMPLEMENT NEW
    ↓
VERIFY NEW
    ↓
DECOMMISSION OLD
    ↓
FINAL AUDIT
```

Tại thời điểm cutover:

> Old SSH/manual application deployment phải bị loại khỏi deployment operating model.

---

# 33. Acceptance Criteria

## A. Business Operating Model

* [ ] Developer/authorized contributor có thể đưa revision vào Staging branch.
* [ ] Staging branch thay đổi → Staging tự động deploy.
* [ ] Không cần SSH để deploy Staging.
* [ ] Staging được test/audit trước Production.
* [ ] Staging PASS không tự động deploy Production.
* [ ] Production promotion yêu cầu human action.
* [ ] Production branch thay đổi → Production tự động deploy.
* [ ] Không còn Local → Production deployment path chính thức.

---

## B. Release Integrity

* [ ] Production release là revision/release đã được Staging verify.
* [ ] Production có Git SHA/release identity.
* [ ] Production release có deployment timestamp/ID.
* [ ] Có audit trail cho promotion và deployment.
* [ ] Release có rollback mechanism.

---

## C. Security

* [ ] Không có SSH password trong deployment process.
* [ ] Không có Production deployment credential plaintext trong repository.
* [ ] Developer không cần SSH vào Production để deploy application.
* [ ] Legacy SSH/manual deployment path đã bị decommission.
* [ ] Không có manual deployment fallback chính thức.

---

## D. Deployment Integrity

* [ ] Deployment scope được định nghĩa.
* [ ] Persistent data nằm ngoài destructive application deployment scope.
* [ ] Runtime-generated data được bảo vệ.
* [ ] Environment secrets được quản lý riêng.
* [ ] Deleted application files không để lại zombie artifacts trong deployment scope.
* [ ] Backup không nằm trong live deployment scope.
* [ ] Deployment không phụ thuộc filesystem residue.

---

## E. Verification

* [ ] Automated deployment có health check.
* [ ] Application verification PASS sau deployment.
* [ ] Deployment failure được báo rõ.
* [ ] Rollback đã được test.
* [ ] Staging deployment đã được verify.
* [ ] Production deployment đã được verify.

---

# 34. Negative Acceptance Tests

Đây là các test bắt buộc để chứng minh old behavior đã thực sự bị loại bỏ.

### NAT-01 — Local → Production

```text
Developer
   ↓
attempt legacy Local → Production deployment
```

**Expected:**

```text
NOT AVAILABLE / NOT A VALID DEPLOYMENT PATH
```

---

### NAT-02 — Staging PASS không tự promote Production

```text
Staging
   ↓
PASS
   ↓
No human promotion
```

**Expected:**

```text
Production MUST NOT change
```

---

### NAT-03 — SSH deployment

```text
Developer
   ↓
SSH Production
   ↓
manual application deployment
```

**Expected:**

```text
NOT A VALID APPLICATION DEPLOYMENT METHOD
```

---

### NAT-04 — Legacy file accumulation

```text
Release A
   ↓
remove application file
   ↓
Release B
```

**Expected:**

```text
Removed file MUST NOT remain
as a live application artifact
```

---

### NAT-05 — Release identity

Sau Production deployment:

```text
Inspect Production release identity
```

**Expected:**

```text
Production Git SHA
=
approved release
=
Staging-verified release
```

---

# 35. Governance Gates

## Gate 0 — Mandatory Audit

Output:

* Current-state architecture;
* deployment inventory;
* security audit;
* Git audit;
* environment audit;
* deployment boundary.

**Implementation:** NOT AUTHORIZED.

---

## Gate 1 — SoT & Solution

Chốt:

* Git SoT;
* branch model;
* environment model;
* deployment boundary;
* release gate;
* CI/CD architecture;
* credential model;
* rollback model;
* deployment mechanism.

**Owner approval required.**

---

## Gate 2 — Staging Implementation

Implement:

```text
Staging branch
      ↓
Automatic CI/CD
      ↓
Staging
```

Không migrate Production deployment yet.

**Verification required.**

---

## Gate 3 — Production Migration Plan

Phải xác nhận:

* old process decommission;
* credential migration;
* deployment boundary;
* Production cutover;
* rollback;
* recovery;
* verification.

**Owner approval required.**

---

## Gate 4 — Production Cutover

Thực hiện:

```text
Decommission old deployment
          ↓
Enable new deployment
          ↓
Production release
          ↓
Health verification
```

---

## Gate 5 — Final Audit

Verify toàn bộ target operating model.

---

# 36. Definition of Done

Task chỉ DONE khi:

```text
LOCAL
  ↓
STAGING BRANCH
  ↓
AUTOMATIC DEPLOY
  ↓
STAGING
  ↓
TEST / AUDIT
  ↓
HUMAN RELEASE GATE
  ↓
PRODUCTION BRANCH
  ↓
AUTOMATIC DEPLOY
  ↓
PRODUCTION
```

đồng thời:

```text
OLD SSH / MANUAL DEPLOYMENT
            ↓
       DECOMMISSIONED
            ↓
      NO LONGER VALID
```

và:

```text
Production
    ↓
Known Git revision
    ↓
Staging-verified release
    ↓
Auditable deployment
    ↓
Rollback available
```

và:

```text
No legacy application accumulation
No deployment password
No developer SSH deployment
No uncontrolled Production release
```

---

# 37. Final Business Outcome

Sau task này, deployment iFlux không còn là:

> **một thao tác server**

mà trở thành:

> **một controlled software delivery process.**

```text
CODE
  ↓
GIT
  ↓
AUTOMATED STAGING
  ↓
TEST
  ↓
HUMAN RELEASE APPROVAL
  ↓
PRODUCTION GIT RELEASE
  ↓
AUTOMATED PRODUCTION
```

Kết quả business phải đạt:

**Controlled — Traceable — Auditable — Reproducible — Rollbackable — Secure — Không phụ thuộc SSH — Không tích lũy filesystem residue.**

---

# 38. Instruction to Cursor

Cursor phải xử lý task theo thứ tự:

```text
1. READ THIS BRD
        ↓
2. DO NOT IMPLEMENT
        ↓
3. PERFORM MANDATORY AUDIT
        ↓
4. PRODUCE EVIDENCE
        ↓
5. IDENTIFY GAPS
        ↓
6. PROPOSE SoT
        ↓
7. PROPOSE SOLUTION OPTIONS
        ↓
8. IDENTIFY TRADE-OFFS
        ↓
9. WAIT FOR OWNER DECISION
        ↓
10. ONLY THEN IMPLEMENT
```

### Cursor MUST NOT

* tự ý thay đổi Production deployment;
* tự ý thêm `rsync --delete`;
* tự ý migrate Production;
* tự ý tạo branch architecture mới;
* tự ý chọn CI/CD architecture mà chưa audit;
* tự ý lưu credential;
* tự ý giữ legacy deployment như fallback;
* tự ý coi P0 cleanup là hoàn thành toàn bộ task.

### Cursor MUST

* audit trước implementation;
* phân biệt **BR / Audit / SoT / Solution / Plan / Implementation**;
* cung cấp evidence cho mọi architectural claim;
* bảo đảm Production cutover có rollback;
* chứng minh old deployment path đã được decommission;
* chứng minh target operating model bằng acceptance tests.

---

## Status

**OPEN — MANDATORY AUDIT / ARCHITECTURE**

**Implementation:** `NOT AUTHORIZED`

**P0 Production Cleanup:** `PASS / CLOSED`

**Current Gate:** `Gate 0 — Mandatory Audit`

**Primary Execution Agent:** Cursor

**Owner Authority:** Architecture / Release Gate / Production Cutover Approval
