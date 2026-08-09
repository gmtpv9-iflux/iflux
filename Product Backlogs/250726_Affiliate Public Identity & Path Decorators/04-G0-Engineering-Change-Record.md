# G0 — Engineering Change Record

| Trường | Giá trị |
|--------|---------|
| **Change ID** | ECR-AFF-PATH-2026-07-25 |
| **Feature / Task** | Migrate Affiliate Referral from Query Decorators to Path Decorators |
| **Thư mục task** | `docs/250726_Affiliate Public Identity & Path Decorators/` |
| **Phase** | G0 — Engineering Change Governance (CG-005) |
| **Ngày** | 2026-07-25 |
| **Agent** | Cursor (Impact Analysis only — **không code**) |
| **Consumed** | Spec v1.1 · Audit 2026-07-25 · SoT Engineering Change Governance |
| **Plan neo** | `05-Plan-Migrate-Affiliate-Referral-Query-to-Path-Decorators.md` |

---

## Record Status

| | |
|--|--|
| **Technical Review** | **PASS** — Impact / Decision / Rollback / Risk đủ nội dung |
| **Governance Decision** | **APPROVED** |
| **Implementation** | **NOT STARTED** — chỉ mở sau Plan FINAL · giao từng phase (P0 trước) |

> Technical Review PASS + Governance Decision **APPROVED**. G0 gate **đã đóng**.

### Owner stamp (đã ký)

```
Decision:   APPROVED
Approved by: Owner
Date:        2026-07-25
Notes:       Owner duyệt nội bộ theo review hợp lệ hóa G0.
             Spec formal APPROVE vẫn là dependency riêng trước Plan FINAL nếu chưa đóng.
```

### Dependency còn lại trước Plan FINAL / code

1. ~~Spec v1.1 formal APPROVE~~ ✅ Owner 2026-07-25  
2. ~~Đóng Plan FINAL~~ ✅ (cùng ngày)  
3. Predecessor Plan `?ref=` §9 — khuyến nghị ghi nhận còn mở (không chặn)  

**Tiếp theo:** Owner giao **P0 only**.

---

## 0. Change summary (một câu)

Đổi **Referral Transport Layer** từ Query Decorators (`?ref=`) sang Path Decorators (`/{publicId}/path`), với `publicId := referral_code`. **Không** đổi Attribution Business Rule (`referred_by` / first-touch).

---

## 1. Impact Analysis (CG-005)

### 1.1 Feature block

```
Feature:     Affiliate Referral Transport — Query → Path Decorators
Authority:   Product Architecture V2 + Spec Affiliate Identity Path Decorators v1.1
Evidence:    01-Audit-Affiliate-Share-Capability-2026-07-25.md
```

### 1.2 Surfaces bị ảnh hưởng (đầy đủ)

#### A. Share Foundation — outgoing decorate

| | |
|--|--|
| **Current owner** | Share Capability / Foundation |
| **Files** | `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` (`IfluxShareFoundation`) · UI `share-action.js` |
| **Functions** | `buildShareUrl`, `decorateAffiliateRef`, `normalizeShareUrl`, `getOutgoingAffiliateRef`, `createShare`, `buildReferralHomeUrl` |
| **Consumers** | Community `share_url` · Insight Widget share · Loyalty `buildReferralLink` · Auth `syncReferralLink` |
| **Storage/API** | Không persist; đọc `IfluxAuth.getUser().referral_code` |
| **AS-IS (Audit)** | Decorate `?ref=CODE` trên canonical sạch |
| **TO-BE** | Decorate path `/{publicId}/…` (P3, sau Resolver) |
| **Decision** | **MODIFY** |

#### B. Loyalty — incoming capture referral

| | |
|--|--|
| **Current owner** | Loyalty / Growth capture |
| **Files** | `User_Web/iflux-web-ui/loyalty-affiliate-store.js` · `loyalty-affiliate.js` (UI) |
| **Functions** | `captureRefFromUrl`, cookie `iflux_ref_code`, `buildReferralLink` (delegate Foundation; còn fallback query) |
| **Consumers** | Auth register / social · `/chia-se` boot · mọi trang load Loyalty |
| **Storage/API** | Cookie + LS session; **không** authoritative `referred_by` (PS-1.0) |
| **AS-IS** | Parse `?ref=` / `?r=` |
| **TO-BE** | Thêm capture từ path prefix; giữ query trong migration (P4) |
| **Decision** | **MODIFY** |

#### C. Auth / `referred_by`

| | |
|--|--|
| **Current owner** | Backend Auth + FE register payload |
| **Files** | `backend/src/modules/legacy-auth/auth.service.js` · `auth.js` / register inits |
| **Functions** | Persist `referral_code`, `referred_by`; `resolveRegistrationRefCode` |
| **Consumers** | Signup email / social |
| **Storage/API** | DB `users.referred_by` (UUID FK) · `users.referral_code` |
| **AS-IS / TO-BE** | First-touch pipeline cookie → registration → `referred_by` **không đổi rule** |
| **Decision** | **NO CHANGE** (Attribution Business Rule) · **REUSE** persistence |

#### D. Identity / `referral_code` / `publicId`

| | |
|--|--|
| **Current owner** | Identity / Auth service |
| **Files** | `auth.service.js` `genReferralCode()` · migration `001_init.sql` (`referral_code UNIQUE`) |
| **Functions** | Insert-time generate `IFL…` |
| **Consumers** | Share outgoing · Loyalty UI · Profile |
| **Storage/API** | `users.referral_code` VARCHAR(20) UNIQUE nullable |
| **TO-BE** | `publicId := referral_code`; AFF-ID-002 immutable; backfill registered null (P1) |
| **Decision** | **MODIFY** (contract + enforcement immutable + backfill) — **FORBIDDEN** tạo cột/bảng `affiliate_code` mới |

#### E. Routing / Runtime Resolver

| | |
|--|--|
| **Current owner** | *(chưa có)* — Page / nginx route theo slug Việt |
| **Files (dự kiến P2)** | Platform Runtime Affiliate Resolver (+ nginx/snippet nếu cần) — **chưa tạo** |
| **Functions** | Validate `IFL…` · emit attribution context · **internal rewrite** → canonical |
| **Consumers** | Mọi deep link affiliate path |
| **AS-IS** | Không parse `/{publicId}/path` |
| **TO-BE** | Capability mới trước Page Router (Spec §6) |
| **Decision** | **CREATE** (CG-012 bên dưới) |

#### F. Page Registry

| | |
|--|--|
| **Current owner** | Product / Page Definition |
| **AS-IS** | Pages: `/cong-dong`, `/nha-cua-toi`, … |
| **TO-BE forbidden** | Đăng ký Page `/{affiliate}/cong-dong` per user |
| **Decision** | **FORBIDDEN** (affiliate route trong Page Registry) · Page composition = **NO CHANGE** |

#### G. Pipeline A/B Preview / Metadata

| | |
|--|--|
| **Current owner** | Web Runtime + `resolveArticleMetadata` (`community-articles.service.js`) |
| **Files** | Backend article metadata · nginx bot/human pipe · SPA head inject |
| **AS-IS (Audit)** | `canonical` / `og:url` **không** chứa `ref` |
| **TO-BE** | Affiliate path vẫn emit meta **sạch** (không `publicId` trong OG/canonical) |
| **Decision** | **MODIFY** chỉ nếu cần hiểu affiliate URL rồi emit SoT sạch · contract Metadata = **NO CHANGE** (cấm nhét affiliate vào meta) |

#### H. CDN / cache

| | |
|--|--|
| **Current owner** | Deploy / Cloudflare |
| **AS-IS (Audit)** | Fingerprint `?v=shareAff20260725`; residual manifest `feedDto20260724` (R1) |
| **TO-BE** | Cache bust khi P3 Modify Foundation; purge CF sau deploy |
| **Decision** | **MODIFY** (version / purge ops) — không đổi product rule |

#### I. Community / Widget share consumers

| | |
|--|--|
| **Current owner** | Interaction catalog · Insight share UI |
| **Files** | `User_Web/iflux-web-ui/interaction/catalog/index.js` · foundation share UI · `share-feature-boot.js` |
| **AS-IS (Audit)** | Community `share_url` → Foundation; feed card **không** share action |
| **TO-BE** | Tiếp tục **chỉ gọi** Foundation — không tự decorate path |
| **Decision** | **REUSE** call path · **FORBIDDEN** consumer tự ghép `?ref=` / `/{publicId}/` |

### 1.3 Data flow (AS-IS → TO-BE transport only)

```
AS-IS Outgoing:  User.referral_code → Foundation.decorate(?ref=) → shareUrl
AS-IS Incoming:  ?ref= → Loyalty cookie → register → referred_by (UUID)

TO-BE Outgoing:  User.publicId (=referral_code) → Foundation.decorate(/{publicId}/) → shareUrl
TO-BE Incoming:  /{publicId}/path → Resolver rewrite + context → Loyalty/Growth session
                 + ?ref= legacy (P4) → same cookie → same referred_by rule
```

### 1.4 UI entry points (Audit §5 — không inventory lại)

1. Community Chia sẻ → Foundation  
2. Insight Widget → Foundation  
3. Profile / Loyalty copy → Foundation (+ fallback)  
4. Auth `referral_link` → Loyalty → Foundation  
5. `/chia-se` → incoming capture  
6. Feed card → không phải share  
7. Register / social → incoming  

### 1.5 Evidence (Audit)

CDN `shareAff20260725` · unit contract guest sạch / login `?ref=` · metadata `hasRef=false` · Owner Acceptance predecessor chưa đóng giấy.

---

## 2. Change Decision Matrix

| Surface | Decision | Ghi chú |
|---------|----------|---------|
| Share Foundation / `buildShareUrl` / `decorateAffiliateRef` | **MODIFY** | Query → path ở **P3 only** (sau P2) |
| Loyalty `captureRefFromUrl` | **MODIFY** | Thêm path; giữ `?ref=` P4 |
| Loyalty `buildReferralLink` fallback ad-hoc | **MODIFY** / cleanup | Ép qua Foundation (CG-001) |
| Auth / `referred_by` / first-touch | **NO CHANGE** | O3 / ADR-AFF-004 |
| Identity `referral_code` → `publicId` contract | **MODIFY** | P1 backfill + immutable enforcement |
| Cột / bảng `affiliate_code` | **FORBIDDEN** | ADR-AFF-001 |
| UUID trên URL affiliate | **FORBIDDEN** | Spec / UX |
| Affiliate Resolver | **CREATE** | CG-012 — xem §2.1 |
| Page Registry `/{affiliate}/…` | **FORBIDDEN** | Spec §13 |
| Page Runtime / Widget biết referral | **FORBIDDEN** | ADR-AFF-005 |
| Metadata canonical / OG chứa ref/publicId | **FORBIDDEN** | Metadata contract |
| Consumer tự decorate | **FORBIDDEN** | O4 |
| Attribution Business Rule | **NO CHANGE** | |
| Pipeline A/B meta SoT | **REUSE** contract; **MODIFY** wiring nếu cần resolve path | Không đổi schema meta |
| CDN fingerprint / purge | **MODIFY** (ops) | |
| Predecessor `?ref=` transport | **MIGRATE** (phase) | Không parallel lâu dài; P5 + Owner Deprecation Policy |

### 2.1 CG-012 — Justification CREATE Resolver

```
Why cannot modify existing file alone?
  Không có module nào hiện parse segment đầu IFL… → strip → canonical.
  Page Router / nginx chỉ biết slug Page SoT — không phải Affiliate Resolver.

Existing owner:  (none for this capability)
New owner:       Platform Runtime — Affiliate Resolver

Why not put in Share Foundation?
  Share = outgoing URL build. Incoming resolve + rewrite = Runtime gate trước Page.

Why not Page Registry entries?
  FORBIDDEN — route explosion; trái Product V2 Canonical URL.
```

**CREATE Resolver = APPROVE về nguyên tắc** (Architecture Review + Plan). Implementation chỉ sau Record Owner `APPROVED`.

### 2.2 Hard constraints (khóa)

```
Resolver MUST exist before Share Output Switch.     (P2 → P3)
Resolver MUST NOT redirect (internal rewrite only).
No Attribution Business Rule change.
?ref= remains supported during migration.
publicId immutable (AFF-ID-002 / ADR-AFF-006).
Canonical / og:url NEVER contain publicId or ref.
Guest share_url Allow without fabricated code (IP-001).
Cookie ≠ referred_by authority (PS-1.0).
No parallel Share / Affiliate URL builder (CG-001/002).
```

### 2.3 SoT stack verify (Plan §4.4)

- [x] Product V2 — Canonical URL / không Page theo user — **acknowledged**  
- [x] Share decorator ownership (Foundation) — **acknowledged**  
- [x] IP-001 / IA-1.0 Guest share URL-only — **acknowledged**  
- [x] PS-1.0 cookie ≠ referred_by — **acknowledged**  
- [x] Metadata contract canonical/OG sạch — **acknowledged** (file SoT Metadata độc lập: **GAP** đã ghi, không invent)  
- [x] Engineering Change CG-005 Impact + CG-001 Modify — **this Record**  
- [x] PG-1.0 — áp khi thi công phase sau FINAL — **acknowledged**  
- [x] Việt hóa URL — Resolver validator `IFL…` không nuốt slug Việt — **acknowledged**  

---

## 3. Rollback Strategy

| Phase | Trigger rollback | Hành động | Không được làm |
|-------|------------------|-----------|----------------|
| **P2 Resolver** | Resolve lỗi / conflict slug / leak | Tắt Resolver capability; path không còn coi là affiliate | Đụng `referred_by` |
| **P3 Share switch** | Share URL path gãy / Preview lệch | Revert Foundation decorate → `?ref=` query | Tạo builder song song “tạm” |
| **P4–P5 Legacy `?ref=`** | Path chưa đủ evidence | Giữ capture `?ref=`; **không** xóa query | Tự deprecate trước Owner *Query Referral Deprecation Policy* |

**Nguyên tắc:** Rollback chỉ **Transport**. Attribution persistence (`referred_by`) **không** rollback / không rewrite lịch sử.

---

## 4. Risk Assessment

| ID | Risk | Mức | Mitigation (Plan/Spec) |
|----|------|-----|------------------------|
| RK1 | **Route conflict** — segment đầu nhầm slug Việt / fake code | Cao | Validator `IFL…`; negative AC P2; reserved namespace Spec |
| RK2 | **Duplicate builder** — path builder song song Foundation | Cao | CG-001/002; MODIFY only `share-action-store.js`; P5 cleanup |
| RK3 | **SEO / social preview** lệch khi path affiliate | Cao | Meta sạch; P4 minimum: 1 community + 1 article + Zalo + FB; **no 301 strip** |
| RK4 | **Backward compatibility** — link `?ref=` cũ chết | Cao | P4 giữ capture; P5 chỉ sau Owner Deprecation Policy |
| RK5 | **publicId migration** — null registered / đổi mã | Cao | P1 backfill active registered; AFF-ID-002 đủ 4 điều kiện; ADR-AFF-006 |
| RK6 | P3 trước P2 | Cao | Hard gate Plan |
| RK7 | Cursor **301 redirect** thay rewrite | Cao | P2 AC MUST NOT redirect |
| RK8 | Cache residual (Audit R1 manifest) | Trung | Bump version + CF purge khi deploy P3 |
| RK9 | Sửa nhầm domain (Identity vs Share vs Runtime) | Cao | Deliverable Owner cột Plan §6 |
| RK10 | Đổi first-touch / commission “tiện tay” | Cao | Header khóa Plan; Decision NO CHANGE |

---

## 5. Implementation Surface Preview (non-binding)

> Chỉ xác định **ownership boundary** / bề mặt sẽ đụng khi thi công.  
> **Không** phải scope thi công G0 · **không** phải implementation checklist · **không** ủy quyền tạo/sửa file.

| Action (dự kiến sau APPROVED) | Target (preview) |
|-------------------------------|------------------|
| MODIFY | `share-action-store.js` (P3) |
| MODIFY | `loyalty-affiliate-store.js` (P2/P4 capture path) |
| MODIFY | Identity/auth generate + immutable reject (P1) |
| CREATE | Affiliate Resolver module + nginx/runtime wiring (P2) — CG-012 |
| MODIFY | Metadata/nginx wiring nếu cần (P4) — meta SoT không đổi |
| FORBIDDEN | `affiliate_code` column/table · Page Registry affiliate pages · parallel `*-affiliate-builder.js` |

---

## 6. Removal / Deprecation (preview)

| Deprecated | Condition |
|------------|-----------|
| `?ref=` làm **chuẩn** outgoing user-referral | P5 + **Owner APPROVE** Query Referral Deprecation Policy |
| Loyalty fallback tự ghép `?ref=` khi thiếu SF | Khi Foundation load path ổn (P3+) |

---

## 7. Gate ordering (khóa)

```
Owner APPROVE Spec
        →
Owner APPROVE this Record (Decision=APPROVED)
        →
Plan FINAL
        →
P0 Freeze → P1 Identity → P2 Resolver → P3 Share → P4 Compat → P5 Cleanup
```

**Cấm:** code / Resolver / đổi URL / Modify Foundation / migration DB **trước** `Decision=APPROVED`.

---

## 8. Recommendation to Owner

| Câu hỏi | Trả lời Agent |
|---------|----------------|
| Đủ Impact Analysis CG-005? | **Có** (consume Audit + Spec) |
| Decision matrix khớp Spec? | **Có** |
| Rollback đủ? | **Có** — không đụng `referred_by` |
| Risk có mitigation? | **Có** |
| **Technical recommendation** | Đã chuyển thành Owner Decision — xem stamp **APPROVED** |
| Governance Decision hiện tại | **APPROVED** (Owner 2026-07-25) |

### Owner stamp

```
Decision:   APPROVED
Approved by: Owner
Date:        2026-07-25
Notes:       Duyệt hợp lệ hóa G0 — mở điều kiện đóng Plan FINAL (theo yêu cầu Owner riêng).
```

---

## 9. G0 vs Task Objective — đánh giá hoàn thành vai trò

### Task Objective (O1–O4) — G0 **không** đạt outcome

| Outcome task | G0 làm gì? |
|--------------|------------|
| O1 Public Identity | Chỉ **khóa decision** Identity MODIFY / FORBIDDEN cột mới — **chưa** backfill |
| O2 Path transport | Chỉ **khóa** Resolver CREATE + Share MODIFY + thứ tự P2→P3 — **chưa** Resolver/Share |
| O3 Attribution không đổi | **Khóa** NO CHANGE — đúng vai trò G0 |
| O4 Share owner duy nhất | **Khóa** FORBIDDEN consumer decorate — đúng vai trò G0 |

→ G0 **không** “hoàn thành task”. G0 chỉ **hợp lệ hóa quyền đổi**.

### Vai trò G0 — checklist nội dung

| Việc thuộc G0 | Trạng thái |
|---------------|------------|
| Impact Analysis CG-005 (surfaces) | **Đủ** |
| Change Decision Matrix + hard constraints | **Đủ** |
| CG-012 Resolver CREATE justification | **Đủ** |
| Rollback theo phase (không đụng `referred_by`) | **Đủ** |
| Risk + mitigation | **Đủ** |
| Consume Spec + Audit + Governance SoT | **Đủ** |
| SoT stack acknowledge | **Đủ** |
| Governance Decision Owner stamp | **APPROVED** — Owner 2026-07-25 |
| Spec Owner formal APPROVE (dependency) | Kiểm tra / đóng riêng trước Plan FINAL |

| **Kết luận vai trò** | Technical Review **PASS** · Governance Decision **APPROVED** (Owner 2026-07-25). G0 **đã đóng**. Tiếp theo: Spec stamp (nếu chưa) → Plan FINAL (khi Owner yêu cầu) → P0 only. |
### Ý kiến bổ sung (không bắt buộc để Technical Review PASS)

1. **Không cần** viết lại Audit / Spec trong G0.  
2. **Không cần** đo `% NULL referral_code` Production trong G0 — thuộc **P1** deliverable.  
3. **Optional (Owner):** một dòng trong stamp ghi nhận predecessor Plan `?ref=` §9 vẫn mở — tránh nhầm “task affiliate cũ đã PASS”.  
4. **Optional (sau G0 APPROVED):** đồng bộ Cursor rule còn trỏ Plan `?ref=` cũ ở path cũ — cleanup docs pointer, không phải blocker G0.  
5. **Cấm** mở rộng G0 thành design Resolver/API chi tiết — đó là P2/Plan thi công.

---

*G0 Engineering Change Record — ECR-AFF-PATH-2026-07-25 — không kèm code change.*
