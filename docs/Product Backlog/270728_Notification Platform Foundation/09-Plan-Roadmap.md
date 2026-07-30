# 09 — Plan & Roadmap · Notification Platform Foundation

**Date:** 2026-07-28  
**Trạng thái:** Plan v6 — **D1-rev ✅ SHIPPED 2026-07-28** · **D5 authorized** (chạy regression)  
**Phụ thuộc:** [`06-Platform-SoT.md`](06-Platform-SoT.md) ✅ · [`PhaseD-D3-Exit-Evidence.md`](PhaseD-D3-Exit-Evidence.md) ✅

---

## 1. Mục tiêu tổng thể

### 1.1 Business Outcome (LOCKED)

**Sau khi Notification Platform Foundation hoàn thành, Product có thể yêu cầu thêm notification business mới mà không phải xây lại hạ tầng.**

Các ví dụ sau chỉ là **consumers** của Platform — không phải scope bắt buộc ship hết trong task này:

| Domain | Ví dụ notification (consumer) |
|--------|-------------------------------|
| **Affiliate** | Thành viên mới đăng ký · Có người mua gói qua affiliate · Hoa hồng được cộng · Hoa hồng bị hủy |
| **Community** | Người theo dõi đăng bài · Trả lời bình luận · Thích bài viết |
| **Orders** | Thanh toán thành công · Thanh toán thất bại · Gói sắp hết hạn |
| **Alert** | Cảnh báo kích hoạt |
| **System** | Broadcast hệ thống |

---

### 1.2 Success Definition (LOCKED)

> Sau khi Notification Platform Foundation hoàn thành:
>
> 1. **Product** có thể yêu cầu thêm bất kỳ notification business nào (Affiliate, Community, Orders, Alert…) **mà không thiết kế lại hệ thống**.
> 2. **Admin** chỉnh **tiêu đề** và **nội dung** trong **Thiết lập mẫu thông báo** (ADM-SYS-003) — không sửa code.
> 3. **User** bật/tắt **từng notification type** (`type_code`) tại **Tài khoản → Quyền riêng tư** — `preference_group` chỉ section header · v1 không trang riêng. *(D1-rev 2026-07-28 — supersede bucket-level)*
> 4. **Developer** chỉ cần đăng ký Notification Type + hook business event → `NotificationDispatcher.dispatch()` — không tạo manager/API/Admin page/App Shell mới.

**Product promise (LOCKED):**

> Sau khi Platform hoàn thành, Product **chỉ cần mô tả**: sự kiện · người nhận · nội dung (seed) · biến · `preference_bucket` — Developer triển khai **consumer slice** mà **không thiết kế lại** Notification Platform.

---

### 1.3 Acceptance theo vai trò

#### Product Acceptance

Product cung cấp cho Developer (mỗi notification mới):

| Input | Mô tả |
|-------|--------|
| Notification Type | Code + mô tả trigger |
| Trigger | Business event xảy ra khi nào |
| Người nhận | Ai nhận (rule resolve recipients) |
| Variables | Biến template (`member`, `actor`…) |
| Bucket mặc định | `preference_bucket` + default ON/OFF |

→ Developer **không** thiết kế lại Platform.

#### Admin Acceptance (v1 — align [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md))

| Admin làm được | v1 |
|----------------|-----|
| Sửa tiêu đề · nội dung mẫu | ✅ |
| Xem merge tags · Preview | ✅ |
| Khôi phục mặc định (seed) | ✅ |
| Bật/tắt template (kill switch UI) | ❌ **v2** — v1 template `enabled` read-only / Developer seed |

#### User Acceptance (v1 — align [`06-Platform-SoT.md`](06-Platform-SoT.md) §3.5)

| User làm được | v1 |
|---------------|-----|
| Bật/tắt theo nhóm: Affiliate · Community · Follow · Alert · System | ✅ tại **Quyền riêng tư** |
| Trang「Thiết lập thông báo」riêng | ❌ v2 — v1 = section trong Quyền riêng tư |
| Bật/tắt từng notification type | ❌ v1 |

#### Developer Acceptance

Khi Product: *「Affiliate cần thêm thông báo X」* → Developer:

1. Đăng ký Notification Type (+ `preference_bucket`)
2. Seed template mặc định
3. Hook `dispatch()` tại business event

**Không cần:** Notification Manager mới · bảng mới (trừ migration Platform một lần) · API consumer riêng · trang Admin mới · sửa App Shell bell.

#### Platform Isolation Acceptance (LOCKED — chứng minh Foundation thành công)

**Ví dụ:** Product yêu cầu *「Affiliate — thông báo khi F1 mua Membership」*.

| Được sửa | Cấm sửa |
|----------|---------|
| Consumer **Affiliate** (Type seed + hook `dispatch()`) | Dispatcher |
| | Inbox service / API contract |
| | Admin template system (ADM-SYS-003) |
| | Template DB schema (trừ seed row mới) |
| | Preference system |
| | Rule Engine |
| | App Shell bell UI |

**PASS:** PR/slice chỉ touch domain consumer + migration seed Type — **không** file Platform core trừ seed script.

---

### 1.4 Mục tiêu kỹ thuật (supporting)

Xây nền tảng modular monolith sống 5–10 năm:

- Platform **không thuộc domain nào**
- Retire 3-system template legacy · ownership/boundary enforced

**Platform v1 PASS khi (kỹ thuật + §1.2):**

- [ ] §1.2 Success Definition — 4 bullet Product/Admin/User/Developer
- [ ] Template Admin = DB SoT · Save/Restore/Preview đúng [`08`](08-Admin-UX-Contract.md)
- [ ] Type registry workflow (seed → Admin list)
- [ ] User preference buckets API + UI Quyền riêng tư
- [ ] ≥2 **proof consumers** qua `dispatch()` only (Affiliate + FN-001)
- [ ] Legacy paths **removed**
- [ ] **Platform Isolation Acceptance** — ví dụ §1.3 (F1 mua Membership)
- [ ] [`10-Developer-Guide-Add-Consumer.md`](10-Developer-Guide-Add-Consumer.md) published (Phase D)
- [ ] Scope guards [`06`](06-Platform-SoT.md) §8

---

Mọi Phase B/C/D **bắt buộc** theo thứ tự — **cấm** Audit xong code luôn:

```text
X0 — Discovery Audit (+ Impact Analysis)
        ↓
X1 — Solution Proposal          ← deliverable riêng · Owner review "hướng xử lý"
        ↓
X2 — Owner Decision             ← approve · không code trước
        ↓
X3 — Implementation
        ↓
X4 — Cleanup                    ← deliverable · PASS condition
        ↓
X5 — Verification / Regression
        ↓
Architecture Drift Audit        ← PASS mới sang phase tiếp
        ↓
Phase PASS
```

*(X = B | C | D — cùng numbering B0…B5, C0…C5, D0…D5)*

**Solution Proposal** — template bắt buộc (markdown trong task folder, vd. `PhaseB-Solution-Proposal.md`):

```text
## Solution Proposal — Phase B

### Reuse
- backend/src/modules/notifications/inbox.service.js — …

### Modify
- announcements-page.js — wire API …

### Migrate
- catalog.js CASES → notification_types seed …

### Delete
- localStorage runtime …

### Migration
- Schema · one-time import · ON CONFLICT …

### Owner decisions needed
- [ ] notif_templates Wave C: deprecate vs merge

### Out of scope this phase
- …
```

**STOP:** Không X3 Implementation trước **Owner approve X1 + X2 sign-off**.

**Architecture Drift Audit** — checklist cuối mỗi phase (PASS/FAIL):

| Drift check | FAIL nếu |
|-------------|----------|
| Dual SoT | catalog/localStorage **và** DB cùng runtime |
| Dual owner | 2 API/UI template song song |
| Shadow module | `v2_` · `new_` · parallel dispatcher |
| Legacy path | `pushReferralSignup` / hardcode copy còn production |
| Scope creep | queue · preference matrix · template history |

**FAIL → không sang phase tiếp** — fix trong cùng phase.

**Tham chiếu:** [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md) CG-005 · CG-020 · CG-030.

**Evidence Phase A (Discovery đã xong):**

| Audit | File |
|-------|------|
| Implementation | [`01-Audit-Current-State.md`](01-Audit-Current-State.md) |
| Ownership | [`02-Ownership-Audit.md`](02-Ownership-Audit.md) |
| Boundary | [`03-Boundary-Audit.md`](03-Boundary-Audit.md) |
| Variables | [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |
| Runtime | [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) |

---

## 3. Implementation Priority (LOCKED)

> Ưu tiên chỉnh sửa · cấu trúc lại · xóa/comment legacy — **không** tạo 2 phiên bản · 2 owner.

Khi audit phát hiện nhiều cách xử lý, **bắt buộc** theo thứ tự:

| # | Strategy | Ví dụ Notification |
|---|----------|-------------------|
| 1 | **Reuse** existing module | Mở rộng `backend/src/modules/notifications/` · `inbox.service.js` |
| 2 | **Refactor** ownership | `fn-subscriber.js` → gọi `dispatch()` thay hardcode |
| 3 | **Re-ownership** (move responsibility) | Template SoT: catalog → DB, Admin wire API |
| 4 | **Migrate** data one-time | localStorage override → import DB |
| 5 | **Delete** obsolete code | Retire `pushReferralSignup` production path |
| 6 | **Comment** legacy tạm thời | Chỉ khi migration rủi ro — **phải có exit trong cùng phase** |
| 7 | **Create new** module | Chỉ khi Owner ghi nhận "cannot reuse" trong Impact Analysis |

**Nguyên tắc bắt buộc:**

- Không **dual implementation** (CG-010).
- Không **dual ownership** (CG-002).
- Không **shadow module** (`v2_` · `new_` · parallel API).
- Không temporary solution **không có exit date / phase PASS criteria**.
- **Cleanup là điều kiện PASS** — không phải optional follow-up.

---

## 4. Roadmap tổng quan · map Business Outcome

```text
Phase A  ✅ SoT + audits — định nghĩa "success" §1.2
Phase B  Template + Admin copy     → Admin Acceptance · Product input (template)
Phase C  Type Registry workflow    → Developer Acceptance · Product→Dev handoff
Phase D  Dispatcher + preferences  → User Acceptance · proof consumers (≥2)
         + Consumer Integration    → Business Outcome **demonstrated**, không ship hết ví dụ §1.1
```

| Phase | Đóng góp vào Success §1.2 |
|-------|---------------------------|
| **A** | Contract: ai làm gì · scope guard |
| **B** | Admin #2 · nền Type/Template DB |
| **C** | Product #1 · Developer #1–3 (quy trình) |
| **D** | User #3 · Developer proof · 2+ domain consumers |

**Sau task PASS:** Thêm notification mới (vd. Hoa hồng bị hủy) = **slice Consumer** nhỏ (Type seed + dispatch hook) — **không** phase Platform mới.

---

## 5. Pre-flight (trước Phase B code)

| # | Hạng mục | Trạng thái |
|---|----------|------------|
| PF-1…4 | LOCK audits 02–05 | ✅ |
| PF-5 | LOCK [`06-Platform-SoT.md`](06-Platform-SoT.md) | ✅ 2026-07-28 |
| PF-6 | Fix `announcements-page.js` 404 | ✅ B3.4 absolute path |
| PF-7 | Impact Analysis (CG-005) | ✅ B0 |
| PF-8 | Solution Proposal | ✅ B1 |
| PF-9 | Owner Decision B2 | ✅ LOCKED |
| PF-10 | B5 Exit Report | ✅ [`PhaseB-B5-Exit-Report.md`](PhaseB-B5-Exit-Report.md) |
| PF-11 | B6 Production regression | ✅ [`PhaseB-B6-Functional-Regression.md`](PhaseB-B6-Functional-Regression.md) |

**STOP:** Không **B3 Implementation** trước **B0 PASS + B1 approved + B2 Owner Decision**.

---

## 6. Phase A — ✅ HOÀN THÀNH

**2026-07-28** — Platform SoT · scope guards · `preference_bucket` · UI Quyền riêng tư · Admin UX contract §5–§8.

---

## 7. Phase B — Template System

**Mục tiêu phase:** Template SoT = PostgreSQL; ADM-SYS-003 wire API; **legacy removed** trong cùng phase.

### 7.0 Cấu trúc phase (template B/C/D — LOCKED)

```text
X0 — Discovery Audit (+ Impact Analysis)
X1 — Solution Proposal
X2 — Owner Decision
X3 — Implementation
X4 — Cleanup
X5 — Architecture Verification (+ B5 Exit Report)
X6 — Functional Regression (Production)
     → Phase PASS
```

**Phase B không PASS khi chỉ xong code** — cần **B6 Production** sau deploy.

---

### B0 — Discovery Audit (+ Impact Analysis)

**Audit checklist:**

| Hạng mục | Câu hỏi | Evidence hiện có |
|----------|---------|------------------|
| **Ownership** | Ai own template SoT hôm nay? | [`01-Audit`](01-Audit-Current-State.md) §2–3 |
| **Dependency** | Admin/User/catalog/Wave C ai gọi ai? | §2 as-is diagram |
| **Duplicate** | 3 hệ template — merge path? | §2 · [`270727/04-Template-SoT-Audit`](../270727_Affiliate%20Members%20Table%20%26%20Referral%20Welcome%20Notification/04-Template-SoT-Audit.md) |
| **Data migration** | localStorage override · seed source | §3.2 · §8.5 |
| **Impact** | Files reuse/migrate/delete | [`01-Audit`](01-Audit-Current-State.md) §9 · §12 |

**Deliverable B0:**

- Impact Analysis table (CG-005): mỗi component → Reuse | Modify | Migrate | Delete
- Evidence gaps (nếu có) — **không code**

**Exit B0:** Impact Analysis complete · sẵn sàng viết Solution Proposal.

---

### B1 — Solution Proposal (deliverable riêng — STOP nếu thiếu)

**File:** `PhaseB-Solution-Proposal.md` (hoặc tương đương trong task folder).

**Template bắt buộc:**

| Section | Nội dung |
|---------|----------|
| **Reuse** | Module/file giữ nguyên owner |
| **Modify** | Wire API · extend schema |
| **Migrate** | localStorage → DB · catalog seed |
| **Delete** | Retire list + timing |
| **Migration** | Schema · one-time import · rollback note |
| **Owner decisions needed** | Open questions cho B2 |

**Exit B1:** Owner reviewed proposal — **chưa code**.

---

### B2 — Owner Decision (STOP nếu thiếu)

| Quyết định | Cần chốt trước B3 |
|------------|-------------------|
| □ Approve Solution Proposal B1 | Sign-off hướng xử lý |
| □ Schema | `notification_types` · `notification_templates` — reuse/migrate `notif_templates` Wave C? |
| □ Naming | `preference_bucket` · `type_code` · API paths |
| □ Seed source | catalog.js 23 CASES · ON CONFLICT DO NOTHING |
| □ Admin API | GET/PATCH contract align [`08`](08-Admin-UX-Contract.md) Save/Restore |
| □ Cleanup list | Wave C table · localStorage · catalog runtime — xóa gì, khi nào |
| □ Restore default | Seed column / seed reference strategy |

**Nếu thiếu bất kỳ ô → STOP implementation** (CG-030).

---

### B3 — Implementation

| # | Deliverable | Priority hint |
|---|-------------|---------------|
| B3.1 | DB migration (reuse connection module) | Modify/extend |
| B3.2 | Seed 23 types + templates + `preference_bucket` map | Migrate |
| B3.3 | Admin API GET types · GET/PATCH template | Extend notifications module |
| B3.4 | Wire `announcements-page.js` + fix PF-6 path | Modify |
| B3.5 | Dispatcher skeleton read template DB | Reuse inbox module |

---

### B4 — Cleanup (deliverable — PASS condition)

**Phase B không PASS nếu chưa xóa:**

- [ ] Runtime read `iflux_sys_notif_templates_v1`
- [ ] Admin Save bind localStorage (phải API only)
- [ ] `adm-notif-tpl-tbody` + `AdmWaveC.initTemplates()` on announcements page
- [ ] Dual template API (Wave C stub vs Platform API) — **một** API owner

---

### B5 — Architecture Verification (+ Exit Report)

**Local/repo grep + boundary ownership** — không thay thế Production test.

| Deliverable | File |
|-------------|------|
| Grep gate + boundary | [`PhaseB-B5-Architecture-Verification.md`](PhaseB-B5-Architecture-Verification.md) |
| Exit Report (pre-deploy) | [`PhaseB-B5-Exit-Report.md`](PhaseB-B5-Exit-Report.md) |

**Boundary grep bắt buộc:**

- `notification_templates` / `notification_types` — **chỉ** `modules/notifications/`
- `notif_templates` — **không** runtime read (DDL legacy OK)

**Exit B5:** Architecture PASS local + Owner approve Exit Report → **được deploy**.

---

### B6 — Functional Regression (Production)

| Test | PASS |
|------|------|
| Migrate 037 + seed 23 types | ⏳ Production |
| Admin list/save/restore/preview | ⏳ [`PhaseB-B6-Functional-Regression.md`](PhaseB-B6-Functional-Regression.md) |
| Cross-browser DB persistence | ⏳ |
| Preview server · không dispatch | ⏳ |
| Checklist [`01-Audit`](01-Audit-Current-State.md) §11 Phase B | ⏳ |

**Exit B6 → Phase B PASS** — không sang Phase C trước B6.

---

### Phase B — Architecture Drift Audit (subset of B5)

| Check | PASS | FAIL |
|-------|------|------|
| localStorage template runtime | Không còn read/write production | Còn `iflux_sys_notif_templates_v1` |
| catalog.js runtime SoT | Chỉ seed script / không Admin bind | Admin vẫn đọc catalog |
| Dual owner template | Một API + DB SoT | Wave C stub + Platform API song song |
| Shadow module | Không `v2_`/`new_` template path | Parallel implementation |

**FAIL → không sang Phase C.**

---

### Phase B — Forbidden

- Không thêm bảng mới nếu **reuse/migrate** được (`notif_templates` decision trước)
- Không **dual owner** template (catalog + DB runtime)
- Không adapter Push/Email/FCM/SMTP/queue
- Không `notification_template_revisions` · preference matrix
- Không abstraction "chuẩn bị Phase C"
- Không feature flag trừ khi Owner ghi risk + exit trong B2
- Không `display:none` giữ legacy UI (CG-010)

---

### Phase B — Risks

| Risk | Mitigation |
|------|------------|
| Admin override mất khi migrate | One-time import · ON CONFLICT DO NOTHING seed |
| Legacy path vẫn chạy song song | B4 cleanup checklist = PASS gate |
| `announcements-page.js` 404 | PF-6 trước B3.4 |
| Optimistic conflict Admin save | `version` 409 — §8.2 SoT |
| Agent tạo table schema enterprise | B2 Owner sign-off + §3 Priority #7 gate |
| Agent code sau Audit bỏ qua Proposal | B1 deliverable + STOP gate §2 |

---

### Phase B — Deliverables summary

```text
✓ Impact Analysis (B0)
✓ Solution Proposal + Owner approve (B1–B2)
✓ Template DB + seed (B3)
✓ Admin API + ADM-SYS-003 wired (B3)
✓ Legacy template storage REMOVED (B4)
✓ Regression evidence (B5)
✓ Architecture Drift Audit PASS
```

---

## 8. Phase C — Type Registry

**Mục tiêu:** Developer workflow thêm Type — Admin auto-list — **retire Admin catalog runtime** — guard type↔template.

### 8.0 Cấu trúc (align Phase B)

```text
C0 — Discovery Audit (+ Impact Analysis)
C1 — Solution Proposal
C2 — Owner Decision
C3 — Implementation
C4 — Cleanup
C5 — Architecture Verification (+ Exit Report)
C6 — Functional Regression (Production)
     → Phase C PASS
```

**Deliverables C0–C2:** [`PhaseC-C0-Discovery-Audit.md`](PhaseC-C0-Discovery-Audit.md) · [`PhaseC-Solution-Proposal.md`](PhaseC-Solution-Proposal.md) · [`PhaseC-C2-Owner-Decision.md`](PhaseC-C2-Owner-Decision.md)

---

### C0 — Discovery Audit (+ Impact Analysis)

- ✅ Seed duplicate catalog vs seed-data · CI gaps · MERGE_TAGS temp B
- Deliverable: [`PhaseC-C0-Discovery-Audit.md`](PhaseC-C0-Discovery-Audit.md)

### C1 — Solution Proposal

- Single seed SoT · validate script · retire Admin catalog · smoke type
- Deliverable: [`PhaseC-Solution-Proposal.md`](PhaseC-Solution-Proposal.md)

### C2 — Owner Decision

- □ Approve C1 · OD-C1…C5
- Deliverable: [`PhaseC-C2-Owner-Decision.md`](PhaseC-C2-Owner-Decision.md)

### C3 — Implementation

| # | Slice |
|---|--------|
| C3.1 | `variable-alias.js` extract |
| C3.2 | `validate-notification-seed.js` |
| C3.3 | `PLATFORM_SMOKE_TEST` seed |
| C3.4 | announcements tag panel API-only |
| C3.5 | `PhaseC-Developer-Seed-Workflow.md` |

### C4 — Cleanup (PASS condition)

- [ ] Admin announcements **không** load `system-notification-catalog.js`
- [ ] `catalog.js` CASES/MERGE_TAGS **comment retired** (Admin)
- [ ] No duplicate type SoT (JS catalog + DB)

### C5 — Architecture Verification (+ Exit Report)

- Grep: no catalog on ADM-SYS-003 · seed-data single SoT
- Exit Report: `PhaseC-C5-Exit-Report.md` (post C3 — template)

### C6 — Functional Regression (Production)

- [ ] Seed smoke type only → Admin sees NOTIF-PLT-000 · no FE deploy
- [ ] validate script blocks bad seed
- [ ] Tag panel from API

### Phase C — Architecture Drift Audit

| Check | FAIL nếu |
|-------|----------|
| catalog runtime SoT | Admin/FE vẫn đọc catalog làm source |
| Duplicate type definition | JS catalog + DB cùng authoritative |
| Type without template | Seed thiếu template row |

**FAIL → không sang Phase D.**

### Forbidden (Phase C)

- Admin UI create Type · per-type preference · template history

### Risks

| Risk | Mitigation |
|------|------------|
| Type without template | C5 guard · seed ON CONFLICT |
| Developer skips variables contract | [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) |

---

## 9. Phase D — Consumer Integration

**Mục tiêu:** Dispatcher full · consumers emit type · legacy client paths **deleted** · **Developer Guide** published.

### 9.0 Cấu trúc (rev Owner 2026-07-28)

```text
D0 — Discovery Audit (+ Impact Analysis)
D1 — Solution Proposal + Owner Decision   ← 1 file (đề xuất + quyết định)
D2 — Implementation
D3 — Cleanup
D4 — Architecture Verification (+ Exit Report)
D5 — Functional Regression (Production)
     → Phase D PASS
```

**Deliverables D0–D1:** [`PhaseD-D0-Discovery-Audit.md`](PhaseD-D0-Discovery-Audit.md) · [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md)

*Phase B/C giữ workflow C1/C2 tách file — Phase D trở đi gộp D1.*

---

### D0 — Discovery Audit (per consumer slice)

- ✅ Seed duplicate catalog vs seed-data · CI gaps · MERGE_TAGS temp B
- ✅ **Runtime Ownership Matrix** (§2) — pipeline stage owner/input/output/forbidden
- Deliverable: [`PhaseD-D0-Discovery-Audit.md`](PhaseD-D0-Discovery-Audit.md)

### D1 — Solution Proposal + Owner Decision (single file) ✅ PASS 2026-07-28

- Slice plan: Platform core · Affiliate **F0 only** · FN-001 proof · preference · inbox wire
- **Architecture locks (Owner rev):** Pure Orchestrator · immutable variables · `sendInApp()` · dispatch contract · Type API contract · inbox cutover D3
- Owner decisions OD-D0…OD-D13 — [`PhaseD-D1-Solution-And-Owner-Decision.md`](PhaseD-D1-Solution-And-Owner-Decision.md) ✅
- **Điều chỉnh Owner:** OD-D3 **F0 only** Phase D · F1/F2 follow-up sau Platform PASS (Affiliate Enhancement · task 270727)
- **Exit:** ✅ Owner sign-off — **D2 authorized**

### D2 — Implementation ✅ COMPLETE 2026-07-28

Exit evidence: [`PhaseD-D2-Exit-Evidence.md`](PhaseD-D2-Exit-Evidence.md)

| # | Deliverable |
|---|-------------|
| D2.1 | Migration 038 · preference · renderer · delivery-channel · dispatcher orchestrator |

**D2.1 PASS criteria** (slice exit — không chờ D4):

- [ ] `dispatcher.js` × connection / query / db
- [ ] `dispatcher.js` × business `typeCode` branch
- [ ] `dispatcher.js` × `inbox.pushToUser` trực tiếp
- [ ] Chỉ `delivery-channel.js` gọi `pushToUser` (OD-D14)
- [ ] Chỉ `dispatcher.js` import `delivery-channel.js`
- [ ] Renderer pure — không DB · không biết type business
- [ ] `preference.service` chỉ `(userId, bucket)` — không `typeCode`
- [ ] Xóa `dispatcher.renderTemplateString` re-export

| D2.2 | Preference API + **User UI** switches tại **Quyền riêng tư** (§1.3 User Acceptance) |
| D2.3 | Affiliate consumer slice — **F0 only** (direct referrer @ signup) |
| D2.4 | FN-001 proof subscriber (≥1 case) |
| D2.5 | **[`10-Developer-Guide-Add-Consumer.md`](10-Developer-Guide-Add-Consumer.md)** — How to add Notification Consumer |

**Developer Guide — outline bắt buộc:**

```text
1. Register Notification Type (seed migration)
2. Seed default template (title · body · variables · preference_bucket)
3. Hook business event → NotificationDispatcher.dispatch({ typeCode, recipientUserId, variables })
4. Verify: Admin edit copy · User bucket toggle · inbox receives
5. Done — không sửa Platform core
```

*Community · Orders · Membership · Alert · System đọc guide này — không hỏi lại workflow.*

### D3 — Cleanup ✅ PASS 2026-07-28

Exit evidence: [`PhaseD-D3-Exit-Evidence.md`](PhaseD-D3-Exit-Evidence.md)

**Retire rule (OD-D7):** Chỉ xóa khi **zero production consumer → grep PASS → delete** — không retire chỉ vì "đến D3".

**Affiliate slice không PASS nếu còn:**

- [ ] `IfluxInAppNotifications.pushReferralSignup` production path
- [ ] `IfluxSystemNotificationTemplates.render` cho referral production
- [ ] Hardcode `'Referral mới'` fallback
- [ ] Affiliate module `import` / call `inbox.pushToUser` directly

**FN-001 slice:** hardcoded title/body removed for migrated case(s).

### D4 — Architecture Verification (+ Exit Report)

**Deliverable:** [`PhaseD-D4-Architecture-Verification.md`](PhaseD-D4-Architecture-Verification.md)

**Merge gates (Owner 2026-07-28 — bắt buộc):**

| Gate | PASS khi |
|------|----------|
| **Gate 1** | `dispatcher.js` × `connection` × `query` × `db` · × business `typeCode` branch |
| **Gate 1b** | Chỉ `dispatcher.js` → `delivery-channel.js` · chỉ delivery-channel → `pushToUser` (OD-D14) |
| **Gate 2** | Không module Domain gọi `renderTemplate()` · `renderPreview()` · `renderTpl()` ngoài Platform |
| **Gate 3** | Sau D3 cutover: không còn path `localStorage → Notification SoT` cho migrated types (grep PASS) |
| **Gate 4** | `CLIENT_LOCAL_TYPES` — explicit allowlist · documented owner · migrated type blocked · sole SoT file (`client-local-notification-types.js`) |

**Catalog registry (runtime vs source):**

| Trạng thái | D3 | D4 |
|------------|----|----|
| Runtime retired | ✅ boot consumer = 0 | grep verify |
| Source retired | — | Deprecated header · deletion post-D5 |

**FAIL Gate 4:** thêm notification mới chỉ vào client array ngoài SoT file.

---

### D1-rev — Naming UX + Preference Model (Owner 2026-07-28)

**Trạng thái:** ⏸ **CHỜ OWNER SIGN-OFF** — **D5 BLOCKED** · **chưa code**

**Deliverable:** [`PhaseD-D1-rev-Preference-Model-Owner-Decision.md`](PhaseD-D1-rev-Preference-Model-Owner-Decision.md)

**Hai track độc lập:**

| Track | Nội dung | Contract |
|-------|----------|----------|
| **A — Naming** | Tên mẫu vs Tiêu đề/Nội dung · Admin list = `name` · User label = `name` | [`08-Admin-UX-Contract.md`](08-Admin-UX-Contract.md) |
| **B — Preference** | Toggle per `type_code` · `preference_group` = category only | [`11-User-Preference-UI-Contract.md`](11-User-Preference-UI-Contract.md) · [`06-Platform-SoT.md`](06-Platform-SoT.md) §3.5 |

**Không implement Migration 039 trước sign-off.**

---

### D5 — Production Regression

**Deliverable:** [`PhaseD-D5-Regression-Checklist.md`](PhaseD-D5-Regression-Checklist.md)

**Double-send mandatory (R3 · R4):**

| Case | Expected |
|------|----------|
| Affiliate signup @ referral | **1** server inbox row · **0** client `referral_signup` mới |
| Followed user posts | **1** server `COMMUNITY_POST_FROM_FOLLOWING` · **0** client `community_post` mới |

---

**User Acceptance PASS (§1.3):**

- [ ] Tab Quyền riêng tư hiển thị switches bucket (Affiliate · Community · …)
- [ ] Toggle OFF → không dispatch types thuộc bucket · inbox không nhận mới
- [ ] Multi-device sync (server preference)

**Affiliate consumer PASS khi (Phase D = F0 only):**

- [ ] ✓ Affiliate **không** import / gọi `inbox.pushToUser`
- [ ] ✓ Affiliate **không** render template client-side
- [ ] ✓ Affiliate **không** hardcode title/body
- [ ] ✓ Affiliate chỉ `dispatch(typeCode, variables)` hoặc publish → platform subscriber
- [ ] ✓ **F0 upline only** @ signup when `affiliate_notifications` ON
- [ ] ✓ Preference OFF → no dispatch · table row still updates
- [ ] ✓ Admin title change → **new** notifications only (§6 Admin contract)
- [ ] ✓ Legacy paths **retired** (zero consumer + grep PASS)
- [ ] ✓ No double-send

**Out of scope Phase D (follow-up Affiliate Enhancement):**

- F1/F2 upline traversal · multi-recipient dedupe chain @ signup

**Platform Isolation Acceptance (§1.3):**

- [ ] Ví dụ *「F1 mua Membership」* — chỉ Affiliate consumer touched · Platform core unchanged

**Platform PASS khi:** ≥2 consumers above pattern + Developer Guide published + checklist [`01-Audit`](01-Audit-Current-State.md) §11 Phase D.

### Phase D — Architecture Drift Audit

| Check | FAIL nếu |
|-------|----------|
| Client template SoT | Domain render title/body client-side |
| Direct inbox bypass | Consumer gọi `inbox.pushToUser` |
| Hardcode copy production | `'Referral mới'` hoặc fn-subscriber hardcode còn path migrated |
| Dual dispatch | Client push + server dispatch cùng event |
| `*NotificationManager` mới | Manager ngoài Platform module |

**FAIL → task không PASS.**

### Forbidden (Phase D)

- Client-side template SoT
- `OrderService.sendNotification()` pattern
- Queue/worker for dispatch v1
- Feature flag permanent dual path
- New `*NotificationManager` outside App Shell

### Risks

| Risk | Mitigation |
|------|------------|
| Double-send (client + server) | D4 retire client path in same PR |
| fn-subscriber + dispatcher duplicate | Migrate case-by-case · delete old branch |
| Preference not checked | Rule engine unit path + D5 test |
| Consumer slice mở rộng Platform | §1.3 Platform Isolation + Developer Guide |

---

## 10. Timeline gợi ý

| Giai đoạn | Nội dung |
|-----------|----------|
| Tuần 1 | PF-6·7·8 · **B0–B2** (Audit → Proposal → Owner) |
| Tuần 1–2 | **B3–B5** + Drift Audit |
| Tuần 2 | **C0–C2** → **C3–C5** + Drift Audit |
| Tuần 2–3 | **D0–D2** → **D3–D5** + Drift Audit · Developer Guide |
| Tuần 3 | Production deploy · CF purge · regression report |

---

## 11. Out of scope v1

[`06-Platform-SoT.md`](06-Platform-SoT.md) §8 · per-type preference · template history · push/email adapters · Kafka · dual-write · Admin create Type UI.

---

## 12. Liên kết task

| Task | Vai trò |
|------|---------|
| **270728** | Platform |
| **270727** | Consumer — Affiliate |
| **FN-001** | Consumer — Follow/Community |

---

## 13. Rà soát alignment Phase ↔ Mục tiêu §1.2

**Kết luận:** Lộ trình phase **không lệch hướng** — B→C→D là đường tới Business Outcome. Có **3 điểm cần hiểu đúng** (không phải lỗi plan):

### ✅ Khớp

| Mục tiêu | Phase phụ trách | Ghi chú |
|----------|-----------------|---------|
| Admin sửa copy | **B** | ADM-SYS-003 wire DB |
| Product thêm type không rebuild | **C** + slice sau **D** | C = quy trình; mỗi notification mới = consumer slice nhỏ |
| Developer chỉ Type + dispatch | **C** proof + **D** pattern | |
| User bucket ON/OFF | **D** | API + Quyền riêng tư UI — **không** thuộc B |
| Platform dispatch end-to-end | **D** | Dispatcher full |
| Ví dụ §1.1 (hoa hồng hủy, order fail…) | **Sau task** | Chỉ cần Type seed + hook — không phase mới |

### ⚠️ Chỗ dễ hiểu nhầm (đã align SoT)

| Diễn đạt Product | SoT v1 thực tế | Ghi trong Plan |
|------------------|----------------|----------------|
| User trang「Thiết lập thông báo」riêng | **Quyền riêng tư** (`/tai-khoan`) | §1.3 — v2 nếu tách trang |
| Admin bật/tắt template | Read-only v1 [`08`](08-Admin-UX-Contract.md) §5 | §1.3 — v2 |
| Ship hết ví dụ Affiliate/Community/Orders | Chỉ **≥2 proof consumers** | §1.1 + D4 — đủ chứng minh outcome |

### 🔧 Điều chỉnh Plan v6 (review kiến trúc)

1. **§2** — Governance 8 bước: Discovery → Impact → **Solution Proposal** → Owner → Implement → Cleanup → Regression → **Drift Audit**.
2. **§7–9** — Renumber B0–B5 / C0–C5 / D0–D5 (Proposal tách riêng khỏi Audit).
3. **§1.2** — Product promise (mô tả event/recipient/content/biến/bucket → Developer slice).
4. **§1.3** — Platform Isolation Acceptance (F1 mua Membership — chỉ sửa consumer).
5. **D3.5** — Developer Guide deliverable [`10-Developer-Guide-Add-Consumer.md`](10-Developer-Guide-Add-Consumer.md).
6. **Mỗi phase** — Architecture Drift Audit PASS/FAIL gate trước phase tiếp.
7. **D1 Owner sign-off 2026-07-28** — F0 only Phase D · D4 merge gates 1–3 · OD-D7 retire condition.

### 🔧 Điều chỉnh nhỏ đã áp dụng (v5)

1. **§1.2–1.4** — Business Outcome + Acceptance 4 vai trò làm mục tiêu đầu.
2. **§4** — Map phase → Success bullets.
3. **D3.2 / D5** — Ghi rõ User UI Quyền riêng tư (trước chỉ nói API).
4. **PASS checklist §1.4** — Thêm User preference UI.

### ❌ Không lệch — cố ý out of phase

| Hạng mục | Lý do không nhét B/C |
|----------|----------------------|
| Push/Email | Scope guard §8.3 |
| Per-type user toggle | Product decision v1 |
| Admin template kill switch UI | v2 |
| Migrate 23 consumers | Incremental post-Platform |
| Trang User riêng ngoài Quyền riêng tư | v2 |

**Verdict:** Phase B/C/D vẫn đúng thứ tự. Task **Foundation** = platform + **2 proof consumers** + **full acceptance path** (Admin · User · Developer workflow) — không phải catalog đủ mọi notification §1.1.

---

*Plan v6 — Solution Proposal gate · Drift Audit · Developer Guide · Platform Isolation Acceptance — 2026-07-28.*
