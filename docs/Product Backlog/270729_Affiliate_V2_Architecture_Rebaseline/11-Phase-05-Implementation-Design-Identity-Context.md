# Phase 5 · Step 2 — Implementation Design  
## Identity Context Projection

**Date:** 2026-07-29  
**Status:** ACCEPT — Step 3 opened · implementation completed local 2026-07-29  
**Neo Discovery:** [`10-Phase-05-Discovery-Audit-Identity-Context.md`](10-Phase-05-Discovery-Audit-Identity-Context.md) **ACCEPT**  
**Neo:** Solution §5.2 · §5.4 · SoT PI-10 · PI-15 · BD-05 · R-AUTH-01 · R-CAP-01 · CG-011 / CG-012  
**Owner decisions:** Thin helper · deprecate `getCodeForIdentityCreation` (no proxy) · `isPathCapturedAttribution` = Transport Flag only  

**REWORK trigger:** New File Creation Governance — Design trước đó đề xuất `identity-context.js` **không** có chứng minh Modify Existing fail → **REJECT Create New**.

---

# 0. Engineering Rule — New File Creation Governance (program-wide)

**Nguyên tắc:** **Replace, không Accumulate.** Modify Existing trước · Create New sau.

File mới **chỉ** khi **đồng thời** thỏa:

| # | Điều kiện | Phase 5 `identity-context.js`? |
|---|-----------|--------------------------------|
| 1 | Discovery Audit khu vực + chứng minh module hiện tại **không** mở rộng hợp lý | **FAIL** — xem §1 |
| 2 | Architecture: responsibility mới **chưa** thuộc module hiện có; không SoT/Authority/Facade trùng | **FAIL** — read Active Owner **đã** thuộc projection NC |
| 3 | Replacement Plan: migration + callers + cleanup + **xóa** cũ | N/A nếu không tạo file — cleanup vẫn bắt buộc với **AR API cũ** |
| 4 | Verification: không dual implementation / abstraction thừa | Create New sẽ **thêm** layer file + boot inject **không cần** |

**Nếu không chứng minh được → Modify Existing · cấm Create New.**

---

# 1. New File Audit — `identity-context.js` vs `navigation-context.js`

## 1.1 Câu hỏi bắt buộc

| # | Câu hỏi | Trả lời |
|---|---------|---------|
| Q1 | Vì sao không export helper ngay trong `navigation-context.js`? | **Có thể và phải.** File đã sở hữu Active Owner projection (`activeContext` / `getContext`). `getActiveOwner()` = **read façade mỏng** trên cùng SoT projection — không responsibility mới. |
| Q2 | Nếu tạo `identity-context.js`, responsibility mới là gì? | Chỉ: đọc NC → trả `ownerPublicId`. **Đó không phải responsibility mới** — thuộc Identity Context Projection contract mà **NC đã là projection store** (PI-10). File mới = **Facade trùng** / abstraction layer thừa. |
| Q3 | Sau khi tạo file mới sẽ xóa file/API nào? | Design cũ: **không** xóa `navigation-context.js` · **không** thay file — chỉ thêm file. Vi phạm “Replace, không Accumulate” và “không chấp nhận thêm file mới nhưng vẫn giữ file cũ” theo nghĩa accumulate facade. |

## 1.2 Chứng minh Modify Existing đủ

```text
AS-IS ownership:
  navigation-context.js  = Navigation Context projection (create / replace / get / transfer / deactivate)
  affiliate-resolver.js  = Transport + (sai) Identity-read APIs

TO-BE (Modify):
  navigation-context.js  += export read contract:
      IfluxIdentityContext.getActiveOwner()
      (optional alias trên cùng file — không file thứ hai)
  affiliate-resolver.js  -= getCodeForIdentityCreation (xóa)
                         ~ isPathCapturedAttribution = Transport Flag only
```

| Tiêu chí “không thể mở rộng NC” | Evidence |
|----------------------------------|----------|
| NC đã quá tải / god module? | Không — thêm ~5–15 dòng read helper |
| Read contract cần lifecycle riêng? | Không — chỉ đọc `activeContext` |
| Register “không được biết NC”? | Đạt bằng **tên API** `IfluxIdentityContext` export từ **cùng file** — caller không gọi `create`/`transfer`/`getContext`; **không** cần file vật lý riêng |
| Boot/nginx cần script mới? | Không nếu Modify Existing |

**Quyết định Design:** **Không tạo** `runtime/identity-context.js`.  
**Modify** `runtime/navigation-context.js`.

---

# Appendix A — Existing Owner Audit (bắt buộc)

## A.1 Responsibility hiện tại của `navigation-context.js`

Evidence trực tiếp từ file:

```text
Projection only:
  create / replaceProjection / getContext / transfer / deactivate
Business Transition Authority:
  IfluxPncLifecycle (không phải navigation-context.js)
Storage:
  activeContext session projection + returnTo
Contract:
  getContext() trả frozen clone; cấm mutate exported context
```

`navigation-context.js` hiện **đã sở hữu** projection Active Owner runtime, không phải chỉ “navigation helper” chung chung. `activeContext.ownerPublicId` là read source hiện tại của projection.

## A.2 Export hiện tại

Current export surface:

| Export | Vai trò |
|--------|---------|
| `create` / `createContext` | tạo projection |
| `replaceProjection` | mirror update guest projection |
| `getContext` | đọc full projection |
| `transfer` / `transferOwnership` | chuyển owner sang Self |
| `deactivate` / `deactivateContext` | clear projection |
| `setReturnTo` / `getReturnTo` / `consumeReturnTo` | navigation return flow |

Kết luận: file đã có đủ owner boundary cho **read** và **projection shape**; thiếu duy nhất một read façade mỏng để consumers không phải kéo full context.

## A.3 `getContext()` đang được dùng ở đâu

Evidence grep hiện tại:

| File | Mục đích dùng `getContext()` |
|------|-------------------------------|
| `runtime/pnc-lifecycle.js` | lifecycle đọc projection hiện có trước khi create / replace / transfer |
| `runtime/shell-url-writer.js` | writer đọc `ownerPublicId` để decorate URL |

Không có evidence cho consumer Identity bên Register/Social/Auth đang gọi `getContext()` trực tiếp.

## A.4 Vì sao `getActiveOwner()` chỉ là read façade

`getActiveOwner()` dự kiến chỉ làm:

```text
ctx = getContext()
return ctx?.ownerPublicId || ''
```

Nó:

| Tiêu chí | Kết luận |
|----------|----------|
| Có state mới? | Không |
| Có storage mới? | Không |
| Có authority mới? | Không |
| Có lifecycle mới? | Không |
| Có parse URL / đọc AR / cookie? | Không |
| Có projection shape mới? | Không |

Vì vậy `getActiveOwner()` = **read façade trên capability đã tồn tại**, không phải capability mới.

---

# Appendix B — Extension Audit

## B.1 Có giới hạn kỹ thuật nào khiến không thể thêm helper vào `navigation-context.js`?

**Không có evidence giới hạn kỹ thuật.**

Lý do:

| Check | Evidence | Kết luận |
|-------|----------|----------|
| Module format | File dùng global IIFE, không ES import/export | Thêm 1 helper nội bộ + export global là khả thi |
| Data access | `activeContext` và `getContext()` đã ở cùng file | Không cần dependency mới |
| Scope change | Helper chỉ read `ownerPublicId` | Không làm đổi owner boundary |

## B.2 Có circular dependency không?

**Không.**

AS-IS dependency shape:

```text
pnc-lifecycle.js      -> global.IfluxNavigationContext
shell-url-writer.js   -> global.IfluxNavigationContext
navigation-context.js -> không phụ thuộc pnc-lifecycle / shell-url-writer
```

Nếu thêm `global.IfluxIdentityContext = { getActiveOwner }` **trong cùng file**, không xuất hiện dependency edge mới giữa file với file.

## B.3 Có boot-order issue không?

**Không có boot-order issue mới khi Modify Existing.**

| Phương án | Ảnh hưởng boot |
|-----------|----------------|
| Modify Existing | `navigation-context.js` giữ nguyên file / vị trí boot; chỉ thêm export cùng lúc với `IfluxNavigationContext` |
| Create New | phải thêm script mới và đảm bảo load **sau** `navigation-context.js`, trước callers |

Vì runtime hiện là global-script, Create New **tạo** boot-order problem mới; Modify Existing thì không.

## B.4 Có conflict responsibility không?

**Không.**

| Module | Responsibility đúng |
|--------|----------------------|
| `navigation-context.js` | projection store + read projection |
| `pnc-lifecycle.js` | business transition authority |
| `affiliate-resolver.js` | path/transport parsing; không nên là Identity read authority |

`getActiveOwner()` nằm đúng bên projection read. Nếu đặt file mới, responsibility sẽ duplicate “projection read façade” đã thuộc owner hiện có.

## B.5 Kết luận Extension Audit

Không có bằng chứng về technical limit, circular dependency, boot-order blocker, hay responsibility conflict.  
**Kết luận chuẩn:** **Modify Existing là phương án chuẩn.**

---

# Appendix C — Replacement Audit

## C.1 Inventory cái sẽ bị xóa sau migration

| Item | Loại | Trạng thái hiện tại | TO-BE |
|------|------|---------------------|-------|
| `IfluxAffiliateResolver.getCodeForIdentityCreation` | API | còn export | **Xóa** |
| `auth-register-init.js` caller | caller A | dùng AR | chuyển sang `IfluxIdentityContext.getActiveOwner()` |
| `social-auth/social-login-usecase.js` caller | caller B | dùng AR | chuyển sang `getActiveOwner()` |
| `auth.js` referral helper | caller C | dùng AR | chuyển sang `getActiveOwner()` |
| `loyalty-affiliate-store.js` | caller D | dùng AR | chuyển sang `getActiveOwner()` |

## C.2 Baseline grep hiện tại (AS-IS)

Evidence grep hiện tại cho `getCodeForIdentityCreation`:

| File | Observation |
|------|-------------|
| `runtime/affiliate-resolver.js` | định nghĩa + export API |
| `auth-register-init.js` | caller A |
| `social-auth/social-login-usecase.js` | caller B |
| `auth.js` | caller C |
| `loyalty-affiliate-store.js` | caller D |

**Baseline kết luận:** hiện có **4 caller runtime** + **1 implementation owner**. Replacement **chưa hoàn thành** ở Step 2; đây là target cleanup cho Step 3–4.

## C.3 Replacement definition (Gate Step 4)

Chỉ được gọi là **Replacement** khi đồng thời đạt:

1. 4 callers trên đã migrate sang `IfluxIdentityContext.getActiveOwner()`
2. `getCodeForIdentityCreation` bị xóa khỏi `affiliate-resolver.js`
3. Grep `getCodeForIdentityCreation` trên `User_Web/**/*.js` cho kết quả:

```text
Expected:
0 caller
0 implementation export
```

Nếu grep còn match bất kỳ caller/export nào thì **không** được claim Replacement.

---

# Appendix D — Complexity Comparison

| Tiêu chí | Modify Existing | Create New |
|----------|-----------------|------------|
| File mới | `0` | `+1` |
| Boot | `0` | `+1` |
| Inject | `0` | `+1` |
| Maintenance | thấp | cao |
| Responsibility | giữ nguyên owner hiện có | duplicate façade |
| Dependency edge mới | `0` | `+1` logical edge NC -> Identity file |
| Cleanup required | chỉ dọn AR API cũ | vừa dọn AR vừa nuôi thêm file mới |

**Kết luận bắt buộc:** **Modify thắng Create.**

---

# Appendix E — Gate

Design **chưa** được tự động mở Step 3 chỉ vì đổi quyết định từ Create sang Modify.  
Step 3 chỉ được mở khi Owner chấp nhận toàn bộ evidence bắt buộc của file này (A–K).

Gate logic:

| Gate | Điều kiện |
|------|-----------|
| REWORK → đủ điều kiện review | Có Appendix A–K với evidence thật |
| ACCEPT Design | Owner chấp nhận A–K + scope + cleanup plan |
| Mở Step 3 | Chỉ sau khi Design = **ACCEPT** |

Owner đã khóa evidence A–K và mở Step 3. File này là SoT Design cho implementation Phase 5.

---

# Appendix F — Module Size Audit

## F.1 Baseline size của `navigation-context.js`

Evidence AS-IS:

| Metric | Baseline |
|--------|----------|
| Current LOC | `216` |
| Function count | `14` |
| Public export count (`IfluxNavigationContext`) | `14` |
| State vars | `2` (`activeContext`, `returnToCanonical`) |
| Storage keys | `1` (`iflux_pnc_domain_v1`, lưu pack context + returnTo) |
| Cross-file public dependencies | `3` soft runtime hooks (`IfluxAffiliateResolver`, `IfluxNormalizePath`, `IfluxRoutes`) |

## F.2 Current responsibilities

Current responsibilities của module:

1. Giữ projection state của Active Owner (`activeContext`)
2. Expose projection read/write primitives (`create`, `replaceProjection`, `getContext`, `transfer`, `deactivate`)
3. Persist / restore projection vào session storage
4. Giữ `returnTo` flow gắn cùng navigation projection

## F.3 Delta nếu thêm `getActiveOwner()`

| Metric | Delta |
|--------|-------|
| Function count | `+1` |
| Public export count | `+1` (`IfluxIdentityContext.getActiveOwner`) |
| State vars | `+0` |
| Storage keys | `+0` |
| Cross-file dependency | `+0` |
| New module/file | `+0` |

## F.4 Size conclusion

`getActiveOwner()` là extension rất nhỏ: **+1 function / +1 export / +0 state / +0 storage / +0 dependency**.  
Không có evidence cho thấy module vượt ownership boundary hoặc bị đẩy thành “god module” bởi delta này.

**Kết luận:** `navigation-context.js` **vẫn nằm trong giới hạn responsibility** sau khi thêm `getActiveOwner()`.

---

# Appendix G — Shadow Read Audit

## G.1 Repo-wide grep baseline (User Web runtime scope)

| Pattern | Files matched | Ý nghĩa |
|---------|---------------|---------|
| `ownerPublicId` | `runtime/navigation-context.js`, `runtime/pnc-lifecycle.js`, `runtime/shell-url-writer.js` | Projection owner field đang tập trung trong runtime PNC path |
| `getContext(` | `runtime/navigation-context.js`, `runtime/pnc-lifecycle.js`, `runtime/shell-url-writer.js` | Read full projection hiện chỉ ở runtime |
| `readActive(` | `runtime/affiliate-resolver.js` | AR vẫn còn self-contained owner read API |
| `iflux_aff_context_v1` | `runtime/affiliate-resolver.js` | Attribution context storage key |
| `iflux_ref_code` | `runtime/affiliate-resolver.js`, `auth.js`, `loyalty-affiliate-store.js` | Legacy ref storage touchpoints |
| `getActiveOwner` | *No match* | API mới chưa tồn tại ở AS-IS |

## G.2 Shadow risk interpretation

| Area | Baseline | Design action |
|------|----------|---------------|
| Runtime projection read | tập trung ở PNC / lifecycle / writer | Giữ nguyên owner runtime path |
| Identity-read cho Register/Social/Auth/LAS | hiện đi qua `getCodeForIdentityCreation` của AR | **Migrate toàn bộ** sang `IfluxIdentityContext.getActiveOwner()` |
| Legacy storage touchpoints | `iflux_ref_code`, `iflux_aff_context_v1` còn tồn tại | Giữ cho transport/attribution, **cấm** dùng làm Active Owner read |

## G.3 Shadow-read conclusion

Audit này chưa thấy “15 chỗ đọc lung tung”, nhưng có **1 shadow read subsystem rõ ràng**: `affiliate-resolver.js` + các callers dùng `getCodeForIdentityCreation`.  
Đó chính là target replacement của Phase 5.

---

# Appendix H — Cleanup Verification Plan

## H.1 Before → After definition

```text
Before
  4 callers dùng getCodeForIdentityCreation
  1 implementation export trong affiliate-resolver.js

↓ Step 3 migrate

After
  0 callers dùng getCodeForIdentityCreation
  0 implementation export getCodeForIdentityCreation

↓ Verification

  No dead code
  No dead export
  No dead helper
```

## H.2 Verification checks bắt buộc sau Step 3

| Check | Expected |
|-------|----------|
| `rg "getCodeForIdentityCreation"` | `0 caller` + `0 export` |
| `rg "readActive\\("` ngoài `affiliate-resolver.js` | không có runtime caller mới |
| `rg "getActiveOwner"` | chỉ match implementation + approved callers |
| `rg "IfluxIdentityContext"` | chỉ match implementation + approved callers |

## H.3 Cleanup conclusion

Chỉ khi 4 bước trong chain trên đều đạt mới được kết luận là **Replacement hoàn tất**.  
Nếu còn export cũ, helper cũ, hoặc caller cũ thì Design verification phải **FAIL**.

---

# Appendix I — Impact Radius

## I.1 Files reading Owner / owner-like path

| File | Baseline role | Step 3 action |
|------|---------------|---------------|
| `runtime/navigation-context.js` | owner projection source | **Modify** — thêm `getActiveOwner` + `IfluxIdentityContext` |
| `runtime/pnc-lifecycle.js` | lifecycle đọc/ghi projection | Untouched |
| `runtime/shell-url-writer.js` | writer đọc `ownerPublicId` từ `getContext()` | Untouched (Phase 6 mới xét unify) |
| `runtime/affiliate-resolver.js` | AR read/storage path | **Modify** — xóa `getCodeForIdentityCreation`; sửa flag |
| `auth-register-init.js` | Register caller | **Modify** |
| `social-auth/social-login-usecase.js` | Social caller | **Modify** |
| `auth.js` | Auth referral helper | **Modify** |
| `loyalty-affiliate-store.js` | LAS caller | **Modify** |

## I.2 Radius conclusion

In-scope Step 3 impact radius = **6 file modify trực tiếp**:

1. `runtime/navigation-context.js`
2. `runtime/affiliate-resolver.js`
3. `auth-register-init.js`
4. `social-auth/social-login-usecase.js`
5. `auth.js`
6. `loyalty-affiliate-store.js`

Untouched nhưng đã audit:

1. `runtime/pnc-lifecycle.js`
2. `runtime/shell-url-writer.js`

Nếu trong lúc implement grep phát hiện caller mới ngoài danh sách này thì **phải cập nhật audit + sửa luôn**, không được bỏ sót.

---

# Appendix J — Rollback Verification

## J.1 Rollback target state

Rollback hợp lệ phải đưa runtime về đúng baseline trước Step 3:

| Check | Expected after rollback |
|-------|--------------------------|
| `rg "getCodeForIdentityCreation"` | `4 callers` + `1 implementation export` |
| `rg "getActiveOwner"` | `0 callers` |
| `rg "IfluxIdentityContext"` | `0 callers` |

## J.2 Rollback note

Rollback không chỉ là “revert callers”, mà phải verify lại grep để chắc chắn state quay đúng AS-IS baseline.

---

# Appendix K — Step 3 Implementation Gate

Appendix này **không** thêm kiến trúc mới. Mục đích duy nhất là khóa điều kiện để được phép nói “Step 3 đã xong”.

## K.0 Step 3 Gate 0 — Recovery Point

Gate 0 này xảy ra **trước khi sửa bất kỳ file nào** trong Inventory.

| Check | Required |
|------|----------|
| Working tree | `git status = clean` |
| Recovery point | `commit` hoặc `tag` hoặc `branch` riêng cho Step 3 |
| Metadata | ghi lại `commit hash` · `branch` · `timestamp` |
| Start permission | chỉ bắt đầu Step 3 sau khi recovery point thành công |

Workflow bắt buộc:

```text
Step 2 ACCEPT
↓
git status sạch
↓
commit/tag baseline
↓
branch riêng cho Step 3
↓
implement
↓
Step 3 PASS
↓
Step 4 Verification
↓
merge
```

Nếu rollback:

1. ưu tiên quay về recovery point  
2. sau đó mới verify Appendix J

## K.1 Exit Criteria theo từng file trong Inventory

| File | Step 3 sửa gì | Exit Criteria bắt buộc |
|------|---------------|------------------------|
| `runtime/navigation-context.js` | thêm `getActiveOwner()` + `global.IfluxIdentityContext` | có đúng **1** read API mới; `+0` state; `+0` storage; không tạo file `identity-context.js` |
| `runtime/affiliate-resolver.js` | xóa `getCodeForIdentityCreation`; sửa `isPathCapturedAttribution` | grep file = **0** `getCodeForIdentityCreation`; export biến mất; `isPathCapturedAttribution` không còn phụ thuộc `readActive()` để quyết Owner |
| `auth-register-init.js` | migrate Register sang Identity Context | grep file = **0** `getCodeForIdentityCreation`; grep file = **0** owner read từ AR/storage |
| `social-auth/social-login-usecase.js` | migrate Social sang Identity Context | grep file = **0** `getCodeForIdentityCreation`; grep file = **0** owner read từ AR/storage |
| `auth.js` | bỏ AR owner-read helper | grep file = **0** `getCodeForIdentityCreation`; grep file = **0** `readActive(` dùng cho Active Owner |
| `loyalty-affiliate-store.js` | migrate LAS sang Identity Context | grep file = **0** `getCodeForIdentityCreation`; không còn Active Owner read từ AR/storage |

## K.2 Unexpected Caller Policy (P0)

Trong Step 3, nếu grep xuất hiện caller / owner-read path **ngoài Inventory hiện tại**:

```text
STOP implementation
↓
Không tiếp tục code
↓
Update Discovery
Update Impact Radius
Update Cleanup / Verification plan
↓
Owner approve
↓
Mới được implement tiếp
```

Rule này áp dụng cho:

- caller mới của `getCodeForIdentityCreation`
- caller mới của `readActive(`
- owner read mới qua storage key / cookie key
- caller mới của `getContext()` ngoài runtime path đã audit

**Cấm** “tiện tay sửa luôn” caller mới rồi coi như cùng scope. Đó là shadow implementation.

## K.3 Implementation Completion Checklist

Step 3 chỉ được đóng khi checklist này **PASS toàn bộ**:

| Check | Pass |
|-------|------|
| `caller = 0` cho `getCodeForIdentityCreation` | ☐ |
| `export = 0` cho `getCodeForIdentityCreation` | ☐ |
| `helper cũ = 0` (không còn AR owner-read helper trong scope migrate) | ☐ |
| `file mới = 0` (`identity-context.js` không tồn tại) | ☐ |
| grep Active Owner đúng: runtime callers đọc qua `IfluxIdentityContext.getActiveOwner()` | ☐ |
| rollback grep PASS theo Appendix J | ☐ |
| AC-D0 → AC-D8 PASS | ☐ |

## K.4 Step 3 / Step 4 Gate

**Không được mở Step 4 Verification** nếu Appendix K chưa PASS.  
Step 3 “code xong” nhưng checklist K.3 chưa đạt thì vẫn xem là **chưa hoàn tất implementation**.

---

# 2. Scope / cấm

| In | Out |
|----|-----|
| Thống nhất **đọc** Active Owner | Lifecycle **write** (Phase 4) |
| Register / Social / Auth / LAS callers | Writer href / menu (Phase 6) |
| Demote / **xóa** AR Identity-read API | Attribution Result ledger (Phase 9) |
| Allowed Reader Matrix | Create file mới không chứng minh |

**Business claim sau PASS:** Capability trong scope đọc cùng Active Owner qua Identity Context API.  
**Không claim:** mọi link = `/IFLA/…`.

---

# 3. Allowed Reader Matrix

## 3.0 Definition of "Owner Read"

**Owner Read** = mọi đoạn code **đọc / suy ra / lấy** `ownerPublicId` (hoặc equivalent owner identity value) **để quyết định Active Owner / identity hiện hành** cho runtime behavior.

Ví dụ Owner Read:

- lấy Owner để prefill Register / Social / Auth / LAS
- lấy Owner để quyết định request body / payload identity flow
- lấy Owner để quyết định runtime navigation / current identity context

**Không tính là Owner Read**:

- log
- debug
- unit test / test fixture
- comment
- type / typedef / interface shape chỉ để mô tả
- document / markdown / audit text

Rule này dùng để đọc AC-D8 và mọi grep verification của Phase 5.  
Reviewer **không** được đánh fail AC-D8 chỉ vì grep match text/debug/test không tham gia quyết định Active Owner runtime.

| Capability | Được đọc | Forbidden |
|------------|----------|-----------|
| Register | `IfluxIdentityContext.getActiveOwner()` | `AR.readActive` · `getCodeForIdentityCreation` · cookie/LS làm Owner |
| Social | `getActiveOwner()` | AR storage / cookie / LS làm Owner |
| Auth referral helper | `getActiveOwner()` | AR `getCodeForIdentityCreation` |
| Writer | Identity Context API (AS-IS có thể vẫn `NC.getContext` — Phase 6 optional unify) | URL bar / AR Authority |
| Widget / consumers | `getActiveOwner()` | cookie · sessionStorage attribution · AR |
| Share | `getActiveOwner()` (owner share) | cookie/LS Identity SoT |
| LAS | Identity Context **hoặc** Attribution Result | AR như Owner Authority |
| UI lock “từ link” | `isPathCapturedAttribution` (**Transport Flag**) | Flag quyết định Owner |

---

# 4. Target architecture (Read path)

```text
Lifecycle (Phase 4) ──write──► Navigation Context (cùng file)
                                      │
                                      ├── IfluxNavigationContext.*   (projection mutate / get full)
                                      └── IfluxIdentityContext.getActiveOwner()  ← read contract (Modify Existing)
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
               Register           Social             Auth / LAS
```

**Không** thêm hộp `identity-context.js` giữa NC và consumers.

```text
isPathCapturedAttribution  = Transport Flag only
                             ≠ Active Owner ≠ Authority
```

---

# 5. Implementation approach (CG — Modify Existing)

## 5.1 Read contract trên `navigation-context.js`

| | |
|--|--|
| **Existing owner / file** | `User_Web/iflux-web-ui/runtime/navigation-context.js` |
| **Why cannot Create New** | §1 — responsibility đã thuộc projection; Create New = Facade trùng + accumulate |
| **Modify** | Thêm `getActiveOwner()` → `String(getContext()?.ownerPublicId \|\| '').trim()` |
| **Export** | `global.IfluxIdentityContext = { getActiveOwner }` **cùng file** (read-only surface) |
| **Cấm** | mutate · đọc AR/cookie · parse URL Authority |

Register “không import NC mutation”: gọi `IfluxIdentityContext` — không gọi `IfluxNavigationContext.create/transfer`. Cùng script load; **không** file mới.

## 5.2 Callers — migrate thẳng (không proxy)

| File | AS-IS | TO-BE |
|------|-------|-------|
| `auth-register-init.js` | `getCodeForIdentityCreation` | `IfluxIdentityContext.getActiveOwner()`; lock UI = `isPathCapturedAttribution` |
| `social-login-usecase.js` | AR getCode… | `getActiveOwner()` |
| `auth.js` | AR getCode… | `getActiveOwner()` |
| `loyalty-affiliate-store.js` | AR getCode… | `getActiveOwner()` (Identity) |

## 5.3 Replacement / Cleanup (AR — bắt buộc)

| Item | Action |
|------|--------|
| `IfluxAffiliateResolver.getCodeForIdentityCreation` | **Xóa** export + implementation (sau migrate callers) |
| Proxy AR → IdentityContext | **Cấm** |
| `readActive` | Forbidden Owner read; giữ internal Transport nếu Capture cần — không dùng Register/Social |
| `isPathCapturedAttribution` | Chỉ `iflux_ref_from_link === '1'` — **không** phụ thuộc `readActive()` để suy Owner |
| `identity-context.js` | **Không tạo** |
| Dual read Register | **Không còn** sau migrate |

## 5.4 Writer

Không đổi Phase 5. Phase 6 optional: Writer → `getActiveOwner` thay `getContext` trực tiếp.

---

# 6. Impact Analysis

| Concern | Impact |
|---------|--------|
| Register / Social | Owner từ Identity Context API trên NC file |
| R-AUTH-01 | Đóng khi callers migrated + `getCode…` **xóa** |
| Boot / nginx | **Không** thêm script file mới |
| Abstraction | **Không** tăng layer file |

---

# 7. File Inventory (Step 3) — Replace, không Accumulate

| File | Action | Cleanup |
|------|--------|---------|
| `runtime/navigation-context.js` | **Modify** — `getActiveOwner` + `IfluxIdentityContext` | — |
| `runtime/identity-context.js` | **Không tạo** | — |
| `auth-register-init.js` | **Modify** | Bỏ AR Identity-read |
| `social-auth/social-login-usecase.js` | **Modify** | Bỏ AR |
| `auth.js` | **Modify** | Bỏ AR |
| `loyalty-affiliate-store.js` | **Modify** | Bỏ AR |
| `runtime/affiliate-resolver.js` | **Modify** | **Xóa** `getCodeForIdentityCreation`; fix Transport Flag |
| `shell-url-writer.js` / `pnc-lifecycle.js` | No | — |

---

# 8. Rollback

1. Revert callers + bỏ `IfluxIdentityContext` export + restore AR `getCode…` nếu cần.  
2. Không DB migration.

---

# 9. Verification Plan (preview Step 4)

| ID | Case | Expect |
|----|------|--------|
| **P5-V-B1** | Guest Active=B · Register | Prefill/body = **B** từ `getActiveOwner` — không cookie stale |
| **P5-V-B2** | Guest B → Login/Register C | Consumers đọc **C** |
| **P5-V-B3** | Self A | `getActiveOwner() = A` — không AR storage |
| **P5-V-R1** | Matrix | Grep Register/Social/Auth: **không** `getCodeForIdentityCreation` / `readActive` Owner |
| **P5-V-R2** | Cleanup | `getCodeForIdentityCreation` **không** còn trên AR export |
| **P5-V-R3** | Flag | Transport only — không quyết Owner |
| **P5-V-R4** | New File Governance | **Không** tồn tại `identity-context.js`; không dual Identity read module |

Không verify Phase 6 href/menu.

---

# 10. AC Design (Gate Owner)

| AC | Tiêu chí | Pass |
|----|----------|------|
| AC-D0 | New File Governance: Create `identity-context.js` **REJECT**; Modify NC **chứng minh** §1 + Appendix A–D | ☐ |
| AC-D1 | Allowed Reader Matrix | ☐ |
| AC-D2 | `IfluxIdentityContext` từ **cùng** `navigation-context.js` — caller không dùng NC mutate / AR Owner-read | ☐ |
| AC-D3 | Không proxy — **xóa** `getCodeForIdentityCreation` | ☐ |
| AC-D4 | `isPathCapturedAttribution` = Transport Flag only | ☐ |
| AC-D5 | File Inventory: **0** file Identity mới; Cleanup AR rõ | ☐ |
| AC-D6 | Không Writer / Lifecycle write scope | ☐ |
| AC-D7 | Verification P5-V-B* / P5-V-R* (+ R4 no new file) | ☐ |
| AC-D8 | Sau migrate không còn runtime caller nào có **Owner Read** từ AR/storage; chỉ còn **1 runtime Owner Read path**: `IfluxIdentityContext.getActiveOwner()` (grep repo chứng minh theo định nghĩa §3.0) | ☐ |

---

# 11. Owner Gate

**Owner ACCEPT Design →** mở Step 3 theo Inventory §7.

**REWORK tiếp nếu:** thiếu evidence Appendix A–D; vẫn muốn file mới mà không vượt §0; hoặc muốn proxy AR.

---

*Phase 5 Step 2 · Implementation Design · DRAFT REWORK appendix complete · New File Governance · 2026-07-29*
