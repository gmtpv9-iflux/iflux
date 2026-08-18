# Plan — Migrate Affiliate Referral from Query Decorators to Path Decorators

| Trường | Giá trị |
|--------|---------|
| **Phiên bản** | **v1.0 FINAL** |
| **Status** | **Approved for Implementation** |
| **Implementation** | **NOT STARTED** — giao **từng phase**; bắt đầu bằng **P0 only** khi Owner yêu cầu |
| **Thư mục task** | `docs/250726_Affiliate Public Identity & Path Decorators/` |
| **Solution Spec** | `03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md` v1.1 — **APPROVED** (Owner 2026-07-25) |
| **Ngữ cảnh** | `01-Audit-Affiliate-Share-Capability-2026-07-25.md` |
| **Governance** | **ECR-AFF-PATH-2026-07-25** · Decision: **APPROVED** (Owner 2026-07-25) |
| **G0 artifact** | `04-G0-Engineering-Change-Record.md` |

> Không thêm solution mới. Governance đã khóa. Agent **không** phân tích lại solution — chỉ thi công theo phase được giao.

---

# 0. Header khóa

> **Task này thay đổi Referral Transport Layer từ Query Decorators (`?ref=`) sang Path Decorators (`/{publicId}/path`). Không thay đổi Referral Attribution Business Rule.**

Agent **không** được tự: đổi first-touch / `referred_by` / commission / tạo `affiliate_codes` / đăng ký Page `/{affiliate}/…`.

---

# 1. Task Objective (outcome)

Không chỉ “migrate query → path”. Sau khi task **hoàn thành**, phải đạt:

## O1 — Chuẩn hóa Affiliate Identity

**Đạt được:** Một User registered → một Public Identity duy nhất → dùng chung cho Share + Referral.

| Acceptance | |
|------------|--|
| **Tại thời điểm migration:** 100% registered user **active** có `referral_code` (= `publicId`) trên Production DB | ☐ |
| **Sau migration:** mọi user mới tạo luôn được cấp `publicId` lúc đăng ký | ☐ |
| `publicId = referral_code` (không cột/bảng affiliate riêng) | ☐ |
| UUID **không** xuất hiện trong URL affiliate | ☐ |

## O2 — Chuyển Referral Transport sang Path Decorators

**Đạt được:** Từ `/cong-dong?ref=IFL9552M` → `/IFL9552M/cong-dong`.

| Acceptance | |
|------------|--|
| Resolver nhận diện path affiliate | ☐ |
| Route canonical vẫn `/cong-dong` (và path tương ứng) | ☐ |
| Không tạo Page mới / không route explosion | ☐ |

## O3 — Không thay đổi Attribution Business Rule

**Đạt được:** Hành vi referral trước và sau giống nhau.

| Acceptance | |
|------------|--|
| First-touch giữ nguyên | ☐ |
| `referred_by` không đổi logic | ☐ |
| Signup flow không bị ảnh hưởng | ☐ |

## O4 — Share Capability là owner duy nhất (outgoing URL)

**Đạt được:** Không còn Widget/Page tự ghép ref / path.

| Acceptance | |
|------------|--|
| 100% share URL đi qua Share Foundation | ☐ |
| Không duplicate URL builder | ☐ |

---

# 2. Scope / Non-scope

| Trong scope | Ngoài scope |
|-------------|-------------|
| Referral **Transport** (`?ref=` → `/{publicId}/path`) | Hoa hồng, payout, fraud |
| Public Identity (`publicId := referral_code`) | Đổi first-touch / last-touch |
| Resolver + Share decorate path (sau Resolver) | Page Registry `/{affiliate}/…` |
| Backward compat `?ref=` trong migration | Cột/bảng `affiliate_code` mới |

---

# 3. Trạng thái & vị trí gate

```
Solution Spec v1.1:               APPROVED (Owner 2026-07-25)
Architecture Review:              PASS
Engineering Change Governance:    APPROVED — ECR-AFF-PATH-2026-07-25 (Owner 2026-07-25)
Implementation Plan:              FINAL — Approved for Implementation
P0 Freeze:                        PASS — 07-P0-Freeze-Note.md (2026-07-25)
P1 Identity:                      PASS — Owner 2026-07-25
P2 Resolver:                      PASS — Owner 2026-07-26
Code P3–P5:                       NOT STARTED
```

```
Spec ✅ → G0 ✅ → Plan FINAL ✅ → P0 PASS ✅ → P1 PASS ✅ → P2 PASS ✅ → P3 → …
                                                                              CHƯA MỞ
```

---

# 4. Input vs Governance SoT stack

## 4.1 Input (đã có trong thư mục task)

- Spec Affiliate Identity & Path Decorators v1.1  
- Audit Affiliate Share Capability 2026-07-25 (**evidence**, không phải SoT mới)

## 4.2 Governance requirement (gate)

```
MUST execute Engineering Change Governance (Phase G0)
before implementation start.

Governance chưa PASS trong task này.
Không coi SoT Governance như input đã hoàn thành.
```

## 4.3 SoT / Rule chi phối task này (bắt buộc consume)

Rà soát `docs/SoT*` + Cursor rules — các nguồn sau **chi phối định hướng**. G0 và mọi phase phải không trái chúng.

### A. Authority / Product (cao nhất)

| SoT / Rule | Chi phối gì với task này | Bắt buộc |
|------------|--------------------------|----------|
| **SoT — iFlux Product Architecture (V2)** | Entity = **một Canonical URL**; Share = capability chung; không nhân đôi Page theo user; Identity domain | **MUST** |
| **`.cursor/rules/sot-product-architecture-v2.mdc`** | Affiliate là **decorator của Share Foundation**; Loyalty = mã + capture; **cấm** nhét vào Article Metadata / canonical / OG | **MUST** |
| **`.cursor/rules/viet-hoa-ngon-ngu.mdc`** | Path/slug công khai tiếng Việt; không English path mới; alias cũ chỉ redirect | **MUST** (Resolver không phá slug Việt) |

### B. Change / Process governance

| SoT / Rule | Chi phối | Bắt buộc |
|------------|----------|----------|
| **SoT — Engineering Change Governance** | CG-001/002/005/012… · Impact trước Plan · Modify trước Create · Cleanup · **G0 gate** | **MUST** (chạy G0) |
| **`.cursor/rules/engineering-change-governance.mdc`** | Agent không implement khi thiếu Impact / ownership | **MUST** |
| **SoT — Plan Phase Governance (PG-1.0)** | Mỗi phase: Overview → Objective → Scope → Evidence → Deliverables → Exit… khi **thi công** phase | **MUST** khi vào P0–P5 (sau Plan FINAL) |

### C. Share / Interaction / Permission

| SoT | Chi phối | Bắt buộc |
|-----|----------|----------|
| **SoT — Interaction Permission (IP-001)** | Guest `share_url` = **Allow** (URL-only); ≠ `share_bump` business | **MUST** (Guest → canonical sạch, không bịa mã) |
| **SoT — Interaction Feature (IA-1.0)** | Q3 Guest Share URL-only khóa | **MUST** (cùng IP-001) |
| **SoT — Interaction Domain (IA-001)** | `share` vs Insight Export; Share counter ≠ Share URL | **SHOULD** (không lẫn transport với counter API) |
| **SoT — Interaction Ownership (IO-001)** | Shell/Page không tự làm owner Interaction/share bind lung tung | **SHOULD** |

### D. Persistence / Attribution transport client

| SoT | Chi phối | Bắt buộc |
|-----|----------|----------|
| **SoT — Persistence & Client Storage (PS-1.0)** | Cookie/session chỉ transport tạm; **business** (`referred_by`) = server/API; không coi cookie là SoT commission | **MUST** (giữ O3: cookie = context, không đổi attribution rule) |

### E. Widget Share (ranh giới — đừng nhầm)

| SoT | Chi phối | Bắt buộc |
|-----|----------|----------|
| **SoT — Widget Definition** (§ Share / Phân quyền chia sẻ) | Widget có thể có link share riêng; quyền có thể đọc **mã Affiliate trên link** | **SHOULD** — path decorate entity **không** thay Widget Share landing; không tạo Widget/Page affiliate song song |

### F. SEO / Metadata (contract đang sống — chưa có file SoT Metadata riêng)

| Nguồn | Chi phối | Bắt buộc |
|-------|----------|----------|
| **Article Metadata contract** (thực thi: `resolveArticleMetadata` + Pipeline A/B; neo trong predecessor Plan + Audit) | `canonical` / `og:url` / schema **không** chứa `ref` hay `publicId` | **MUST** |
| Gap | Chưa có file `SoT — Article Metadata` độc lập trong `docs/` | G0 ghi nhận; **không** invent SoT mới trong task này trừ Owner yêu cầu |

### G. Không chi phối trực tiếp (không nhét vào gate task này)

| SoT | Lý do bỏ qua / soft |
|-----|---------------------|
| Resource Loading Strategy (Task 4) | Loading script — không đổi transport URL |
| Trình tự tối ưu Runtime (3 Phase) | Runtime shell ownership — Resolver có thể đụng Platform Runtime nhưng SoT đó không khóa affiliate |
| UI Relocation (UR-001) | Di chuyển UI — ngoài scope |
| Follow & Notification Domain | Không phải referral transport |
| Interaction API Store / UI / Runtime / IR-001 | Trừ khi đụng `share_bump` API — task này không đổi counter |
| Topic Engine | Ngoài scope |
| Product Architecture **V1** | Archive — **cấm** dùng làm nguồn |

## 4.4 G0 phải verify SoT stack

Trong Engineering Change Record, mục ràng buộc tối thiểu:

```
[ ] Product V2 — Canonical URL / không Page theo user
[ ] Share decorator ownership (Foundation) — Cursor rule V2
[ ] IP-001 / IA-1.0 — Guest share URL-only
[ ] PS-1.0 — cookie ≠ referred_by authority
[ ] Metadata contract — canonical/OG sạch
[ ] Engineering Change — CG-005 Impact + CG-001 Modify
[ ] PG-1.0 — sẽ áp khi chạy phase (sau FINAL)
[ ] Việt hóa URL — Resolver không phá slug SoT
```

---

# 5. Predecessor

```
Extend Share Capability Affiliate URL Decorators (?ref= trên Production)
        →  Plan này = migrate transport contract (Modify cùng owner)
        →  chuẩn mới /{publicId}/path
```

Không phủ nhận code đã làm · không parallel system · Owner Acceptance predecessor §9 vẫn mở (Audit).

---

# 6. Deliverables theo phase (tổng)

| Phase | Deliverable | Owner |
|-------|-------------|-------|
| **G0** | Engineering Change Record | Change Owner (Owner + Agent theo Governance) |
| **P0** | Freeze note | Share Capability + Platform Runtime |
| **P1** | Public Identity readiness report | **Identity** |
| **P2** | Resolver capability + evidence | **Platform Runtime** |
| **P3** | Share contract migrated | **Share Capability** |
| **P4** | Compatibility + Preview validation report | **Web Runtime** (+ Share nếu đụng decorate) |
| **P5** | Cleanup report | **Share Capability + Platform Runtime** |

Mỗi deliverable chỉ được sửa / đóng trong đúng Owner domain — cấm Cursor sửa nhầm module ngoài Owner.

---

# 7. Phase G0 — Engineering Change Governance

> Governance gate. **Không** phải code phase.

### Objective

Xác nhận thay đổi được phép triển khai theo Engineering Change Governance (CG-005): impact + decision + rollback đủ để APPROVE trước khi Plan FINAL và code.

### Tasks

1. Consume Spec v1.1 + Audit (không audit lại từ đầu những gì đã khóa).  
2. Khóa Change Surface + Decision (Modify / Create / Forbidden / No change).  
3. Điền Impact Surface checklist tối thiểu.  
4. Định nghĩa Rollback theo phase.  
5. Xuất Engineering Change Record → Owner ký APPROVED / REJECTED.

### Change Surface (khóa)

| Surface | Decision |
|---------|----------|
| Share Foundation / `decorateAffiliateRef` | **MODIFY** → path (P3) |
| Loyalty capture | **MODIFY** (path + giữ `?ref=` P4) |
| Auth / `referred_by` | **REUSE** — NO CHANGE |
| Resolver | **CREATE** (CG-012) |
| Page Registry `/{IFL}/…` | **FORBIDDEN** |
| Affiliate table / `affiliate_code` | **FORBIDDEN** |
| Attribution first-touch | **NO CHANGE** |

### Impact Surface checklist

Share Foundation · Loyalty capture · Auth `referred_by` · Community `share_url` · nginx/routing · Pipeline A/B · Identity · CDN/cache — thiếu surface → Record chưa APPROVE.

### Hard Constraints (copy Spec + SoT stack)

```
Resolver MUST exist before Share Output Switch.
Resolver MUST NOT redirect (internal rewrite only).
No Attribution Business Rule change.
?ref= remains supported during migration.
publicId immutable.
Canonical / og:url NEVER contain publicId or ref.   ← Metadata contract + Product V2
Guest share_url Allow without fabricated code.      ← IP-001
Cookie attribution ≠ referred_by authority.       ← PS-1.0
Modify Share Foundation — no parallel builder.      ← Engineering Change CG-001/002
```

### Deliverable

`G0-Engineering-Change-Record` (trong thư mục task)

### Acceptance Criteria

| | PASS khi |
|--|----------|
| Record tồn tại | Có Decision / Impact / Rollback |
| Decision | `APPROVED` (Owner) |
| Evidence | Dựa Audit + Spec, không reinvent inventory |
| Plan | Được phép đóng FINAL chỉ sau G0 APPROVED |

---

# 8. Migration phases P0–P5

Hai lớp: **G0** = governance · **P0–P5** = execution.  
**Cấm:** P3 trước P2.

---

## P0 — Freeze Current Referral Transport

### Objective

Ổn định transport AS-IS (`?ref=`) và **cấm** thêm URL builder song song trước khi đổi chuẩn.

### Tasks

- Khóa Freeze từ evidence Audit (consumers đã biết).  
- Cấm tạo helper/builder decorate mới.  
- Ghi Freeze note.

### Deliverable

Freeze note — Owner: **Share Capability + Platform Runtime**

### Acceptance Criteria

| | PASS khi |
|--|----------|
| AS-IS | `?ref=` vẫn hoạt động như Audit |
| No parallel | Không có builder URL affiliate mới |
| No share change | Share output chưa chuyển path |

---

## P1 — Public Identity Readiness

### Objective

Đảm bảo mọi **registered user** có Public Identity ổn định **trước** khi URL path expose ra ngoài.

### Tasks

- Audit `referral_code IS NULL` (registered only).  
- Backfill missing → generate `publicId`.  
- Verify uniqueness.  
- Lock mutation (AFF-ID-002: cấm user/admin/migration regenerate).  
- Expose contract `{ id_internal, publicId }` nếu cần API.

### Deliverable

Public Identity readiness report — Owner: **Identity**

### Acceptance Criteria

| | PASS khi |
|--|----------|
| Coverage (migration) | 100% registered user **active** tại thời điểm P1 có `referral_code` / `publicId` trên Production |
| New users | User tạo sau P1 luôn được cấp `publicId` lúc đăng ký |
| Mapping | `publicId = referral_code` |
| Unique | Không duplicate |
| Immutable (ADR-AFF-006) — **bắt buộc đủ 4** | (1) API **không** expose mutation `publicId` · (2) Admin UI **không** có edit action · (3) Backend **reject** mọi update `publicId` · (4) Migration script **không** regenerate mã đã cấp |
| Guest | `NULL` vẫn hợp lệ |
| No new column | Không `affiliate_code` / affiliate table |

---

## P2 — Resolver

### Objective

Runtime nhận `/{publicId}/{route}` → validate → attribution context → **internal rewrite** sang canonical → Page chỉ thấy canonical path. Không tạo Page mới.

**Khóa rewrite (Spec):**

```
Resolver MUST NOT redirect affiliate URL (không 301/302 sang canonical).
Resolver = internal rewrite only.
```

Request `/IFL9552M/cong-dong` → xử lý nội bộ như `/cong-dong` (rewrite), **không** HTTP redirect.
### Tasks

- CREATE Affiliate Resolver (đã justify G0).  
- Validator Public Identity (`IFL…` / pattern Spec).  
- Emit attribution context; strip prefix bằng **internal rewrite** (không redirect).  
- Giữ `?ref=` song song (chưa tắt).

### Deliverable

Resolver capability + evidence resolve — Owner: **Platform Runtime**

### Acceptance Criteria

**Functional**

| Case | PASS khi |
|------|----------|
| `GET /IFL9552M/cong-dong` | resolve success · `canonicalPath=/cong-dong` |
| Rewrite | **Internal rewrite only** — **không** 301/302 redirect sang `/cong-dong` |
| Attribution | context ghi được (session/server theo Spec) |
| Page Runtime | không “biết” affiliate prefix |

**Negative**

| Case | PASS khi |
|------|----------|
| `GET /ABC123/cong-dong` (không phải publicId) | **không** coi là affiliate · không leak user tồn tại |

**Regression**

| Case | PASS khi |
|------|----------|
| `GET /cong-dong` | vẫn hoạt động như trước |
| `?ref=` | vẫn capture (chưa P5) |

---

## P3 — Share Output Switch

### Objective

Share Foundation trở thành nơi **duy nhất** sinh share URL chuẩn path — chỉ **sau** khi P2 sống.

### Tasks

- MODIFY `buildShareUrl` / `decorateAffiliateRef` → path.  
- Guest → canonical sạch.  
- Login + publicId → `/{publicId}/…`.  
- Không tạo file builder song song.

### Deliverable

Share contract migrated (+ fingerprint/cache bust nếu cần) — Owner: **Share Capability**

### Acceptance Criteria

| | PASS khi |
|--|----------|
| Login share | URL dạng `/{publicId}/path` |
| Guest share | canonical · không path/ref bịa |
| Owner | 100% qua Foundation (O4) |
| Gate | P2 đã PASS trước khi merge P3 |
| No parallel | Không helper Widget/Page tự decorate |

---

## P4 — Backward Compatibility (+ Preview)

### Objective

Link `?ref=` cũ vẫn attribution được trong migration; SEO/Preview không bị phá bởi path mới.

### Tasks

- Loyalty tiếp tục capture `?ref=` / `?r=`.  
- (Tuỳ chọn) normalize query → path.  
- Verify Pipeline A/B: canonical + OG **sạch** (không publicId / ref trong meta).  
- Ma trận preview tối thiểu (Zalo/FB × affiliate path × bài viết) nếu đụng article URL.

### Deliverable

Compatibility + Preview validation report — Owner: **Web Runtime**

### Acceptance Criteria

| | PASS khi |
|--|----------|
| Legacy query | `?ref=IFL…` vẫn capture / signup mapping |
| Canonical | không chứa publicId |
| OG | `og:url` sạch |
| Social preview — **minimum validation (không mở toàn site)** | Đủ 4 mẫu: (1) 1 community URL · (2) 1 article deep link · (3) Zalo · (4) Facebook — PASS trên 4 mẫu này |
| Attribution rule | không đổi (O3) |

---

## P5 — Remove Query Decorators (chuẩn user-referral)

### Objective

Path là chuẩn referral user; deprecate `?ref=` làm chuẩn (cleanup CG-020/021) khi đủ evidence.

### Tasks

- Deprecate query decorate làm chuẩn outgoing.  
- Cleanup fallback ad-hoc còn sót (Audit).  
- Giữ query chỉ nếu SoT riêng (campaign) — ghi rõ.  
- Cleanup report.

### Deliverable

Cleanup report — Owner: **Share Capability + Platform Runtime**

### Acceptance Criteria

| | PASS khi |
|--|----------|
| Chuẩn outgoing | Path Decorators |
| No duplicate builder | PASS |
| **Deprecation gate** | Owner đã **APPROVE** *Query Referral Deprecation Policy* (giữ capture / redirect / tắt — Owner quyết, agent **không** tự xóa `?ref=`) |
| Evidence | P2–P4 đã PASS trước cleanup |

---

# 9. Final Definition of Done (Task Acceptance)

Task **PASS** khi toàn bộ checklist sau ✓:

### Identity

- [ ] Registered user có Public Identity  
- [ ] Public Identity immutable — đủ 4 điều kiện P1 (API / Admin UI / Backend reject / no regenerate)  
- [ ] Không tạo affiliate table / `affiliate_code`  
- [ ] UUID không trên URL affiliate  
- [ ] O1: 100% registered active tại migration + user mới luôn có publicId  

### URL

- [ ] Share URL mới dùng path  
- [ ] URL cũ `?ref=` vẫn hoạt động theo P4 + Deprecation Policy (Owner)  
- [ ] Không route explosion / không Page `/{affiliate}/…`  

### Runtime

- [ ] Resolver hoạt động (functional + negative + regression)  
- [ ] Resolver = **internal rewrite only** (không 301 strip)  
- [ ] Page Runtime không biết affiliate  

### Attribution

- [ ] First-touch không đổi  
- [ ] Signup / `referred_by` mapping không đổi  

### SEO

- [ ] Canonical sạch  
- [ ] OG sạch  
- [ ] Social preview PASS — minimum: 1 community + 1 article + Zalo + Facebook  

### Ownership

- [ ] Không còn duplicate builder  
- [ ] Widget/Page không tự decorate  
- [ ] 100% share URL qua Foundation  
- [ ] Deliverables đóng đúng Owner domain (§6)  

### Governance

- [ ] G0 Engineering Change Record = APPROVED  
- [ ] Plan FINAL đã đóng trước code  
- [ ] Deliverables G0–P5 có trong thư mục task  
- [ ] P5: Owner APPROVE Query Referral Deprecation Policy  

---

# 10. Rollback

| Phase | Rollback |
|-------|----------|
| P2 | Tắt Resolver · path không resolve → không coi affiliate |
| P3 | Revert Share Foundation → decorate query |
| P4–P5 | Giữ `?ref=` capture · không xóa query trước Owner Deprecation Policy |

Rollback = Transport cũ. **Không** đụng `referred_by`.

---

# 11. Risk

| Risk | Mức | Mitigation |
|------|-----|------------|
| P3 trước P2 | Cao | Hard gate trong Plan + G0 |
| Dual builder lâu dài | Cao | CG-001/002 · P5 cleanup |
| Nhầm UUID = publicId | Cao | Spec ADR · AC O1 |
| Slug Việt vs `IFL…` | Cao | Validator chặt · negative AC P2 |
| Cursor làm **301 redirect** thay rewrite | Cao | P2 AC: MUST NOT redirect |
| Preview/OG lệch path | Cao | P4 minimum 4 mẫu |
| Tự xóa `?ref=` | Cao | P5 Owner Deprecation Policy |
| Sửa nhầm domain | Cao | Deliverable **Owner** cột §6 |
| Audit lại từ đầu | Trung | G0 consume Audit |
| Đổi Attribution “tiện tay” | Cao | Header khóa · O3 |

---

# 12. Bộ tài liệu task (không thêm artifact thiết kế)

| Artifact | Vai trò |
|----------|---------|
| Solution Spec v1.1 | Kiến trúc / ADR |
| Audit | **Evidence** ngữ cảnh |
| Implementation Plan (file này) | Thi công + AC + **Governance SoT stack §4.3** |
| SoT / Rules ở `docs/` + `.cursor/rules/` | Chi phối — **consume**, không copy vào thư mục task |

**Không** tạo thêm: Architecture doc riêng · Technical design riêng · API spec riêng · SoT Article Metadata mới (trừ Owner yêu cầu).

Chi tiết SoT chi phối: **§4.3**.

---

# 13. Impact Analysis (CG-005)

Khóa bởi **G0 ECR-AFF-PATH-2026-07-25 APPROVED**. Chi tiết đầy đủ trong `04-G0-Engineering-Change-Record.md`.

```
Feature: Affiliate Referral Transport — Query → Path
Outgoing owner: Share Foundation
Incoming owner: Loyalty
Decision: Modify Share + Loyalty | Create Resolver | Reuse Attribution | Forbidden Page/affiliate_code
```

---

# 14. Bước tiếp theo

1. ~~Spec APPROVE~~ ✅ Owner 2026-07-25  
2. ~~G0 APPROVE~~ ✅ ECR-AFF-PATH-2026-07-25  
3. ~~Plan FINAL~~ ✅  
4. ~~Owner giao P0~~ ✅ → **P0 PASS** (`07-P0-Freeze-Note.md`)  
5. Owner giao: **Execute Phase P1 only**  
6. P1 PASS → P2 → … → P5  

**Cấm:** phân tích lại solution · P2–P5 khi chưa được giao · Modify Share Foundation trước P3 · đổi attribution.

---

*Plan v1.0 FINAL — Approved for Implementation · Governance ECR-AFF-PATH-2026-07-25 APPROVED.*
