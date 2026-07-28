# P1 — Public Identity Readiness Report

| Trường | Giá trị |
|--------|---------|
| **Phase** | P1 — Public Identity Readiness |
| **Task** | Affiliate Public Identity & Path Decorators |
| **Plan** | v1.0 FINAL — Approved for Implementation |
| **Governance** | ECR-AFF-PATH-2026-07-25 **APPROVED** |
| **Owner deliverable** | Identity |
| **Date** | 2026-07-25 |
| **Technical verdict** | **Technical PASS** |
| **Owner stamp** | **APPROVED / P1 PASS** — Owner 2026-07-25 · mở P2 |

---

## Objective (Plan)

Đảm bảo mọi registered user có Public Identity ổn định **trước** khi URL path expose (P2+).

Contract khóa: `publicId := referral_code` · AFF-ID-002 / ADR-AFF-006 · không cột `affiliate_code` mới.

---

## 0. Public Identity Contract (khóa cho P2+)

Đây là **Public Contract** duy nhất của Affiliate Identity. Consumer từ **P2 trở đi** bắt buộc tuân thủ.

| Layer | Field | Vai trò |
|-------|--------|---------|
| **Public contract** | `publicId` | Định danh công khai Affiliate / Share / Path — **canonical** |
| **Persistence** | `users.referral_code` | Cột DB lưu giá trị; **không** phải public contract |
| **Internal id** | `id` / `id_internal` | UUID nội bộ — **không** dùng trên URL affiliate |

### Quy tắc contract

```
publicId  =  Public Identity contract duy nhất của Affiliate
Persistence field  =  referral_code
Public API field   =  publicId

Consumer từ P2 trở đi MUST consume publicId.
Không được phụ thuộc trực tiếp referral_code.
```

| Rule | Nội dung |
|------|----------|
| C1 | `publicId` là Public Identity contract **duy nhất** cho Affiliate |
| C2 | Persistence = cột `referral_code` (không đổi schema / không cột `affiliate_code`) |
| C3 | Public API / runtime consumer (P2+) MUST đọc **`publicId`** |
| C4 | Phụ thuộc trực tiếp `referral_code` trong consumer mới = **FORBIDDEN** |
| C5 | Field `referral_code` trên response cũ = **backward compatibility only** (xem §0.1) |

### 0.0 Affiliate Identifier Pattern — **SoT duy nhất**

Chuẩn nhận diện `publicId` trên path / validator — **một SoT** (Identity Contract).  
Nginx / Resolver / docs **MUST** implement theo đây; **không** tự định nghĩa pattern riêng.

| | |
|--|--|
| **SoT** | Affiliate Public Identity Contract (P1 §0) · khóa Spec **APPROVED** + ECR-AFF-PATH-2026-07-25 (Identity `publicId := referral_code`, validate `IFL…`) |
| **Generator (Spec)** | `genReferralCode()` = `'IFL' +` 5 ký tự alnum (Spec §0.1) |
| **Storage bound (G0 / DB)** | `users.referral_code` **VARCHAR(20) UNIQUE** nullable |
| **Validator shape (derived)** | Segment đầu là affiliate khi khớp identity đã cấp: prefix `IFL` + thân alnum, **không vượt** VARCHAR(20) · **không** trùng reserved slug Spec §6.3 |

Đổi pattern = **đổi Identity Contract** (P1/Spec/G0) trước — rồi mới sync implementation. Evidence phase **không** là nơi định nghĩa chuẩn.

Lý do: đây là contract cho **P2 / P3 / P4**. P1 khóa bằng tài liệu — **không** yêu cầu đổi code thêm trong review này.

### 0.1 API Compatibility Matrix

| API / Surface | `referral_code` (hoặc alias cũ) | `publicId` | Status |
|---------------|-------------------------------|------------|--------|
| `GET /me` | Có — cùng giá trị với `publicId` | ✔ | **Canonical** — consumer mới MUST dùng `publicId` |
| Admin Users API (`rowToCustomer`) | `affiliate` (alias legacy UI) | ✔ `publicId` | **Canonical** — `publicId` là contract; `affiliate` = UI/compat |
| `GET /referrals/sync` | Có trên `members[]` / `users[]` | ✗ chưa expose | **Backward compatibility only** — Future consumers MUST use `publicId` (bổ sung alias thuộc phase sau nếu cần; **không** trong P1 doc-only) |
| `GET /referral/validate/:code` | Response field `code` (= persistence lookup) | ✗ chưa expose | **Backward compatibility only** — validate path param; Future MUST treat value as `publicId` semantics |
| `POST /register` body `referral_code` | Incoming **referrer** code (không phải own identity) | — | Input attribution — **không** phải expose own `publicId` |
| `POST /social` body `referral_code` | Incoming **referrer** code | — | Input attribution — như trên |
| `PUT /profile` | Không nhận / không ghi `publicId` / `referral_code` | — | Mutation **FORBIDDEN** (AFF-ID-002) |
| Login / register success user blob | Không trả own code | — | N/A |

**Traceability note:** Mọi surface còn trả `referral_code` / `code` / `affiliate` mà chưa có `publicId` = **backward compatibility only**. Future consumers (P2+) **MUST** use `publicId`.

---

## 1. Production evidence (2026-07-25)

| Metric | Kết quả |
|--------|---------|
| `users` total | **14** |
| `account_status = active` | **14** |
| `referral_code` NULL/blank | **0** |
| Distinct non-blank codes | **14** |
| Duplicate codes | **0** |
| Cột `affiliate_code` | **Không có** |
| Backfill rows thực thi | **0** (không còn NULL — N/A, migration idempotent) |
| Trigger `trg_users_referral_code_immutable` | **Có** |
| Function `iflux_prevent_referral_code_mutation` | **Có** |

### Trigger proof (Production)

```
UPDATE users SET referral_code='IFLXTEST' WHERE id='1488dd5f-…';
→ ERROR: publicId/referral_code is immutable after creation (AFF-ID-002)
→ mã sau UPDATE vẫn = IFL77JXA (không đổi)
```

---

## 2. Tasks vs Plan § P1

| Task | Status | Evidence |
|------|--------|----------|
| Audit `referral_code IS NULL` (registered) | **DONE** | 0 blank trên 14 active |
| Backfill missing → generate `publicId` | **N/A / DONE** | Không có row cần backfill; script `025_public_identity_immutable.sql` sẵn sàng idempotent |
| Verify uniqueness | **DONE** | 0 duplicate |
| Lock mutation AFF-ID-002 | **DONE** | DB trigger + không `SET referral_code` trong app update paths |
| Expose `{ id_internal, publicId }` | **DONE** | `GET /me` + Admin `rowToCustomer` alias — xem §0.1 |

---

## 3. Acceptance Criteria (Plan) — đối chiếu

| AC | PASS khi | Kết quả | Ghi chú |
|----|----------|---------|---------|
| Coverage | 100% registered **active** có `referral_code` / `publicId` | **PASS** | 14/14 active |
| New users | User mới luôn được cấp lúc đăng ký | **PASS** | `genReferralCode()` + INSERT; collision policy §3.1 |
| Mapping | `publicId = referral_code` | **PASS** | Persistence = `referral_code`; public contract = `publicId` (§0) |
| Unique | Không duplicate | **PASS** | 0 dup |
| Immutable (1) API không expose mutation `publicId` | **PASS** | `PUT /profile` chỉ `nickname` / `display_name` / `phone` |
| Immutable (2) Admin UI không có edit action | **PASS** | Detail: read-only; form thêm: regen **chỉ trước khi lưu user mới** |
| Immutable (3) Backend reject mọi update `publicId` | **PASS** | Trigger DB reject; app không UPDATE cột này |
| Immutable (4) Migration không regenerate mã đã cấp | **PASS** | `025` chỉ backfill NULL/blank; không đụng mã đã có |
| Guest | `NULL` vẫn hợp lệ | **PASS** | Guest không phải row `users` registered |
| No new column | Không `affiliate_code` / affiliate table | **PASS** | Không thêm |

**Technical Phase P1 Verdict: Technical PASS · Owner Review Pending**

---

## 3.1 Generator Collision Policy

Nguồn sự thật runtime (dẫn chiếu code — **không** đổi behavior trong doc review này):

- `genReferralCode()` — `backend/src/modules/legacy-auth/auth.service.js`
- Insert loops: `createUserFromPending` · `createSocialUser` (cùng file)

### Flow (AS-IS)

```
Generate  (genReferralCode → IFL + 5 chars)
    ↓
INSERT users.referral_code
    ↓
Conflict? (Postgres unique_violation 23505 trên referral_code)
    ↓ yes
Retry     (regen + continue)  — max 5 attempts (i = 0..4)
    ↓
… (lặp)
    ↓
Max retry exhausted
    ↓
Abort     → throw Error statusCode 500
            ("Could not create user" / "Could not create social user")
    ↓
Log       → không có getLogger().error/.fatal riêng cho nhánh collision exhaustion
            (failure nổi qua HTTP 500 / error middleware AS-IS)
```

| Tham số | Giá trị AS-IS |
|---------|----------------|
| Generator | `'IFL' + Math.random().toString(36).slice(2, 7).toUpperCase()` |
| Max retry (runtime) | **5** attempts / insert path |
| On conflict | Regen + retry |
| On abort | HTTP **500** — tạo user thất bại |
| Critical log riêng | **Chưa có** dedicated “Log Critical” cho exhaustion — ghi nhận AS-IS; không sửa code trong P1 doc-only |

### Migration backfill collision (riêng — `025_public_identity_immutable.sql`)

Chỉ áp dụng khi còn NULL/blank (P1 Production: **0** row):

```
Generate candidate → UPDATE → unique_violation → retry → max 20 → RAISE EXCEPTION
```

---

## 4. Files changed (P1)

| File | Action |
|------|--------|
| `backend/migrations/025_public_identity_immutable.sql` | **CREATE** + applied Production |
| `backend/src/modules/legacy-auth/auth.service.js` | Comment AFF-ID-002 trên `genReferralCode` |
| `backend/src/modules/legacy-auth/auth.routes.js` | `/me` → `publicId`, `id_internal` |
| `backend/src/modules/admin-users/admin-users.service.js` | `publicId`, `id_internal` alias |
| `Admin_Design_system/app/users/list.html` | Nhãn create-time + title regen |
| `docs/…/08-P1-Public-Identity-Readiness-Report.md` | Deliverable — cập nhật contract / matrix / collision / migration summary (doc-only) |

Share Foundation / Resolver / attribution / `?ref=` — **không đụng** (đúng scope P1).

Doc-only review này: **không** sửa Share · Resolver · referral transport · API behavior · DB schema · `referral_code` · migration mới.

---

## 5. Explicit non-scope (P1)

- [ ] P2 Affiliate Resolver / path rewrite  
- [ ] P3 Share path decorate  
- [ ] P4 Compat / preview  
- [ ] P5 Deprecate `?ref=`  
- [ ] Đổi `referred_by` / first-touch rule  
- [ ] Bổ sung `publicId` vào mọi response legacy (`/referrals/sync`, validate) — ngoài scope P1 AC; ghi nhận compat matrix §0.1  

---

## 6. Migration Summary

Migration: `025_public_identity_immutable.sql` · Production 2026-07-25

| Metric | Count | Ý nghĩa |
|--------|------:|---------|
| **Rows scanned** | **14** | Toàn bộ `users` tại thời điểm P1 |
| **Rows updated** | **0** | Không có NULL/blank cần backfill |
| **Rows generated** | **0** | Không sinh mã mới |
| **Rows skipped** | **14** | Đã có `referral_code` non-blank — bỏ qua (unchanged) |
| **Rows unchanged** | **14** | Tương đương skipped — mã giữ nguyên (ADR-AFF-006) |

```
Migration Summary (P1 Production)

Rows scanned:    14
Rows updated:     0
Rows generated:   0
Rows skipped:    14
Rows unchanged:  14
```

Ngoài ra migration tạo / thay trigger immutability (DDL) — không tính vào row counts ở trên.

---

## 7. Owner decision

Checklist review cuối (trước stamp):

- [ ] Technical PASS  
- [ ] Contract rõ ràng (§0 — `publicId` canonical)  
- [ ] Traceability đầy đủ (§0.1 · §3.1 · §6)  

Sau khi Owner stamp:

```
P1 PASS → được phép giao Execute Phase P2 only
```

Nếu Owner reject: ghi lý do vào section này; không mở P2.

| | |
|--|--|
| **Owner stamp** | Owner |
| **Date** | 2026-07-25 |
| **Decision** | ☑ **PASS** · ☐ FAIL |

---

*P1 Public Identity Readiness Report — 2026-07-25 — Owner **P1 PASS** · Execute Phase P2 opened.*