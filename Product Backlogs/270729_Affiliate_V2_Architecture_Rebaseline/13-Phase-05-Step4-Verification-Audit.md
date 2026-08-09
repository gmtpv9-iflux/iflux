    # Phase 5 · Step 4 — Verification Audit

**Date:** 2026-07-29  
**Status:** Step 4 closed for **product AC** — xem Errata §7 · Final PASS chờ Owner tại [`14b-Phase-05-Acceptance.md`](14b-Phase-05-Acceptance.md)  
**Scope:** Independent Verification cho Phase 5 Step 3 — **không** dựa vào self-report của implementation  
**Design:** [`11-Phase-05-Implementation-Design-Identity-Context.md`](11-Phase-05-Implementation-Design-Identity-Context.md)  
**Change List:** [`12-Phase-05-Step3-Change-List.md`](12-Phase-05-Step3-Change-List.md)  
**AC Gap Classification:** [`14-Phase-05-AC-Gap-Classification.md`](14-Phase-05-AC-Gap-Classification.md)  
**Task 3 artifacts:** `.tmp/phase5-task3/` (2026-07-29)

---

## 0. Verdict Matrix

Kết luận hiện tại: **chưa đủ điều kiện ký Final PASS Phase 5** — tách rõ technical / business / process; Task 3 đã bổ sung evidence (không sửa implementation).

| Area | Result | Note |
|------|--------|------|
| Architecture compliance | PASS | Không phát hiện lỗi kiến trúc trong phạm vi đã grep/probe |
| Cleanup verification | PASS | `getCodeForIdentityCreation` đã biến mất; caller cũ không còn |
| Runtime projection | PASS | Direct Owner URL và refresh chứng minh `IfluxIdentityContext` + `NavigationContext` hoạt động |
| Semantic verification | PARTIAL → **FAIL (multi-tab)** | Cross-tab sau Logout: Tab khác giữ projection `authenticated`/`self` dù `loggedIn=false` (§4.7.5) |
| Business verification | PARTIAL | Register/Login/Logout/Share logged-in/Multi-account PASS; Guest Share **MISMATCH**; Social OAuth **Chrome FAIL / Safari PASS** (frontend GIS — backend ruled out); Multi-tab **FAIL** |
| Process / Recovery Point | **DEVIATION — Accepted by Owner** | Gate 0 không replay; Owner chấp nhận process deviation (§3.3) |

### Overall

**Phase 5 chưa đủ điều kiện để ký Final PASS.** Nguyên nhân sau Task 3:

- **FAIL:** multi-tab logout contamination (ActiveOwner/`NavigationContext` stale trên tab khác)
- **MISMATCH:** Guest Share không dùng Active Owner từ Identity Context (emit Product URL)
- **Social OAuth:** verdict automation “BLOCKED” **đã thu hồi** — Owner matrix Chrome **FAIL** / Safari **PASS**; backend OAuth **ruled out**; fail locus frontend GIS activation — xem [`15-Social-OAuth-Chrome-Fail-Localization-Audit.md`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md)
- **Process:** Gate 0 = Process Deviation — **Accepted by Owner** (không yêu cầu Recovery Point replay)

Register · Login Self · Logout (single-tab) · Share logged-in · Multi-account User C: **PASS** theo evidence.

---

## 0.1 Alignment Review — Brief / SoT / AC / Solution

Đối chiếu nhanh với tầng khóa của chương trình:

| Layer | Focus cần bám | Audit status |
|------|----------------|--------------|
| **Business Requirement Brief** | Public Identity là địa chỉ công khai; Owner URL = distribution representation; Product phải bám invariant nghiệp vụ thay vì page checklist | **PARTIAL** — audit đã chuyển sang evidence-first, nhưng vẫn cần thêm tầng Business Invariants |
| **SoT** | Một thời điểm chỉ có một Public Identity đang hiệu lực; mọi capability phải tham chiếu cùng Public Identity; Affiliate không sở hữu Identity | **PARTIAL** — cleanup/read path khá sát, nhưng business transition và cross-capability consistency chưa đủ evidence production |
| **Acceptance Criteria** | Không dual read authority; một runtime Identity Context contract; Attribution không là Identity authority | **PASS / PARTIAL** — grep cleanup PASS, semantic/business evidence còn PARTIAL |
| **Solution** | Identity Context contract duy nhất; Navigation Context là runtime projection; consumer đọc cùng context | **PASS / PARTIAL** — architecture path đúng, production consumer behavior chưa chứng minh hết |

Review conclusion:

> **APPROACH: ACCEPT**  
> Audit đã trưởng thành hơn vì tách rõ technical correctness, business correctness, process compliance.  
> Tuy nhiên để ký Phase 5, audit phải chứng minh thêm các **business invariants** của hệ thống, không chỉ coverage theo flow/page.

---

## 0.2 Business Invariants Verification

Business Requirement của chương trình này được mô tả bằng **invariant hệ thống**. Vì vậy verification cần map vào invariant thay vì chỉ liệt kê flow.

| Invariant | Basis | Result | Note |
|-----------|-------|--------|------|
| Exactly one Active Owner | Brief §1–§3 · SoT §3–§4 | PASS (single-tab) / **FAIL (multi-tab after logout)** | Single-tab + multi-account PASS (§4.6 · §4.7.3); multi-tab Tab2 giữ `IFLNU6MH` sau logout Tab1 (§4.7.5) |
| Owner Replacement | BD-06 · Solution Goal table | PASS (multi-account) / **FAIL (multi-tab reopen)** | A→B→logout→C→Login C PASS; Tab2 reopen Owner C sau logout vẫn không replace stale Self (§4.7.5) |
| Context Consistency | SoT §2–§5 · Solution §5.2 | PARTIAL | Register/Login/Multi-account PASS; Guest Share không đọc Identity Context; Social: Safari PASS / Chrome FAIL (pre-token GIS) |
| Representation Consistency | Brief §2–§3 · Solution Goal table | PASS (logged-in) / **MISMATCH (Guest)** | Logged-in Share = Owner URL Self/C; Guest Share = Product URL dù ActiveOwner có giá trị (§4.7.4) |
| Transition Consistency | SoT §3 · Solution §5.1/§5.2 | PASS (single-tab multi-account) | Guest A → Login B → Logout → Owner C → Login C PASS (§4.7.3) |
| Attribution Independence | BD-04 · BD-05 · Solution Goal table | PASS / PARTIAL | API owner-read cũ đã xóa; semantic multi-tab storage còn FAIL riêng |

Business conclusion:

Single-tab Identity Context transitions + multi-account **PASS**. Final PASS Phase 5 **bị chặn** bởi multi-tab FAIL + Guest Share MISMATCH + Social OAuth E2E chưa chạy xong (blocked).

---

## 1. Independent grep evidence

### 1.1 `rg -n "getCodeForIdentityCreation" User_Web`

```text
No matches found
```

Kết luận: API cũ và caller cũ theo tên này đã biến mất.

### 1.2 `rg -n "readActive\\(" User_Web`

```text
User_Web/iflux-web-ui/runtime/affiliate-resolver.js
  103:  function readActive() {
  122:  /** UI lock only — path capture flag; not the same as readActive() (cookie/LS fallback). */
```

Kết luận: `readActive()` chỉ còn implementation nội bộ trong `affiliate-resolver.js`; không có runtime caller ngoài file.

### 1.3 `rg -n "IfluxIdentityContext" User_Web`

```text
User_Web/iflux-web-ui/loyalty-affiliate-store.js
  478:    var IC = global.IfluxIdentityContext;

User_Web/iflux-web-ui/social-auth/social-login-usecase.js
  10:    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
  11:      return IfluxIdentityContext.getActiveOwner() || null;

User_Web/iflux-web-ui/auth.js
  452:    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
  453:      return IfluxIdentityContext.getActiveOwner() || '';

User_Web/iflux-web-ui/auth-register-init.js
  3:  if (window.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
  4:    return IfluxIdentityContext.getActiveOwner() || '';

User_Web/iflux-web-ui/runtime/navigation-context.js
  221:  global.IfluxIdentityContext = {
```

Kết luận: đúng 1 implementation + 4 callers đã nằm trong Inventory.

### 1.4 `rg -n "getActiveOwner" User_Web`

```text
User_Web/iflux-web-ui/runtime/navigation-context.js
  123:  function getActiveOwner() {
  222:    getActiveOwner: getActiveOwner

User_Web/iflux-web-ui/social-auth/social-login-usecase.js
  10:    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
  11:      return IfluxIdentityContext.getActiveOwner() || null;

User_Web/iflux-web-ui/loyalty-affiliate-store.js
  479:    if (IC && IC.getActiveOwner) {
  480:      return IC.getActiveOwner() || '';

User_Web/iflux-web-ui/auth-register-init.js
  3:  if (window.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
  4:    return IfluxIdentityContext.getActiveOwner() || '';

User_Web/iflux-web-ui/auth.js
  451:  function getActiveOwnerCode() {
  452:    if (global.IfluxIdentityContext && IfluxIdentityContext.getActiveOwner) {
  453:      return IfluxIdentityContext.getActiveOwner() || '';
  476:      var fromCtx = getActiveOwnerCode();
```

Kết luận: `getActiveOwner()` chưa bị rename tản mát sang các API khác trong scope grep này.

### 1.5 `rg -n "ownerPublicId" User_Web`

```text
User_Web/iflux-web-ui/runtime/pnc-lifecycle.js
  47:    if (existing.ownerPublicId === incoming) return existing;
  49:      ownerPublicId: incoming,
  67:      if (existing.ownerPublicId === incoming) return;
  73:      ownerPublicId: incoming,
  89:      if (existing.ownerPublicId === selfId && existing.state === 'authenticated') return;
  93:        ownerPublicId: selfId,

User_Web/iflux-web-ui/runtime/navigation-context.js
  36:      ownerPublicId: ctx.ownerPublicId,
  79:      if (pack && pack.context && pack.context.ownerPublicId) {
  103:    var owner = String(opts.ownerPublicId || '').trim().toUpperCase();
  105:    if (activeContext && activeContext.ownerPublicId === owner) {
  109:      ownerPublicId: owner,
  125:    if (!ctx || !ctx.ownerPublicId) return '';
  126:    return String(ctx.ownerPublicId).trim().toUpperCase();
  135:    var owner = String(opts.ownerPublicId || '').trim().toUpperCase();
  138:    if (activeContext.ownerPublicId === owner) return clone(activeContext);
  139:    var from = activeContext.ownerPublicId;
  141:      ownerPublicId: owner,
  158:    if (activeContext.ownerPublicId === selfId && activeContext.state === 'authenticated') {
  161:    var from = activeContext.ownerPublicId;
  163:      ownerPublicId: selfId,

User_Web/iflux-web-ui/runtime/shell-url-writer.js
  77:    if (!ctx || !ctx.ownerPublicId) return null;
  78:    return String(ctx.ownerPublicId).trim().toUpperCase();
```

Kết luận: `ownerPublicId` hiện tập trung ở runtime path (`navigation-context` / `pnc-lifecycle` / `shell-url-writer`). Không thấy Register/Social/Auth/LAS đọc `ownerPublicId` trực tiếp ngoài `IfluxIdentityContext`.

---

## 2. Semantic audit

Mục tiêu semantic audit: chứng minh không chỉ “xóa tên hàm cũ”, mà còn không còn đường runtime khác đọc Owner từ AR/cookie/storage trong scope Phase 5.

### 2.1 Storage / cookie / session grep

`rg -n "document\\.cookie" User_Web`

```text
User_Web/iflux-web-ui/runtime/affiliate-resolver.js
  43:      document.cookie =
  86:      var match = document.cookie.match(new RegExp('(?:^|; )' + REF_COOKIE + '=([^;]*)'));
  138:      document.cookie = REF_COOKIE + '=;path=/;expires=Thu, 01 Jan 1970 00:00:00 GMT';
```

`rg -n "localStorage" User_Web`

```text
User_Web/iflux-web-ui/runtime/affiliate-resolver.js
  52:      global.localStorage.setItem(REF_STORAGE, publicId);
  53:      global.localStorage.setItem(REF_FROM_LINK_KEY, '1');
  62:      var existing = global.localStorage.getItem(CTX_KEY);
  70:      global.localStorage.setItem(
  95:      var ls = global.localStorage.getItem(REF_STORAGE);
  106:      var raw = global.localStorage.getItem(CTX_KEY);
  125:      return global.localStorage.getItem(REF_FROM_LINK_KEY) === '1';
  133:      global.localStorage.removeItem(REF_STORAGE);
  134:      global.localStorage.removeItem(REF_FROM_LINK_KEY);
  135:      global.localStorage.removeItem(CTX_KEY);

... nhiều localStorage touchpoint khác ngoài Phase 5 scope (theme, notification, watchlist, interaction, profile, pricing, stock, orders ...)
```

`rg -n "sessionStorage" User_Web`

```text
User_Web/iflux-web-ui/runtime/navigation-context.js
  61:        global.sessionStorage.removeItem(STORAGE_KEY);
  64:      global.sessionStorage.setItem(
  76:      var raw = global.sessionStorage.getItem(STORAGE_KEY);

User_Web/iflux-web-ui/auth.js
  674:      var id = sessionStorage.getItem(TAB_ID_KEY);
  677:        sessionStorage.setItem(TAB_ID_KEY, id);
  1004:      sessionStorage.setItem(PENDING_ONBOARDING_KEY, '1');
  1010:      return sessionStorage.getItem(PENDING_ONBOARDING_KEY) === '1';
  1018:      sessionStorage.removeItem(PENDING_ONBOARDING_KEY);
  1024:      sessionStorage.setItem(PENDING_VERIFY_KEY, JSON.stringify(data || {}));
  1035:      var raw = sessionStorage.getItem(PENDING_VERIFY_KEY);
  1044:      sessionStorage.removeItem(PENDING_VERIFY_KEY);

... sessionStorage touchpoint khác ngoài Phase 5 owner-read scope (auth-social, pricing modal, onboarding)
```

### 2.2 Storage / cookie touchpoints còn lại

Grep baseline trước đó cho `iflux_ref_code` và `iflux_aff_context_v1` cho thấy:

- `runtime/affiliate-resolver.js` vẫn sở hữu storage/cookie path
- `auth.js` và `loyalty-affiliate-store.js` còn giữ literal `iflux_ref_code`

Đánh giá:

| File | Vai trò semantic | Kết luận |
|------|------------------|----------|
| `runtime/affiliate-resolver.js` | transport / attribution storage internals | **Allowed** nếu không là runtime Owner Read authority |
| `auth.js` | còn literal cookie key trong module lớn Auth | cần audit tiếp nếu có logic owner-read qua key này ngoài scope grep hiện tại |
| `loyalty-affiliate-store.js` | còn literal storage key | cần audit tiếp nếu literal này chỉ phục vụ referral storage, không phục vụ Active Owner read |

### 2.3 Reconstruct-owner grep

`rg -n -i "buildOwner|resolveOwner|deriveOwner|parseOwner|extractOwner|ownerFromCookie|ownerFromReferral" User_Web`

```text
No matches found
```

Kết luận: không thấy explicit helper theo các tên reconstruct Owner phổ biến.

### 2.4 Semantic conclusion

Trong scope grep đã chạy, **không còn API runtime nào tên cũ** trả Active Owner từ AR/storage.  
Grep `document.cookie` / `localStorage` / `sessionStorage` cho thấy:

- touchpoint owner-related hiện còn tập trung chủ yếu ở `runtime/affiliate-resolver.js` và `runtime/navigation-context.js`
- ngoài ra có nhiều storage touchpoint khác toàn hệ thống nhưng **không tự động** là Owner Read

Vì vậy semantic audit **chưa đủ để ký PASS tuyệt đối**, nhưng cũng **không phát hiện ngay** một shadow owner-read authority mới ngoài runtime path đã biết.

=> **Semantic verification: PARTIAL**

---

## 3. Recovery Point / Gate 0 audit

### 3.1 Git evidence

`git branch --show-current`

```text
feature/google-login-rebuild
```

`git log -1 --format='%H %cI %s'`

```text
d57fa47afa3d93ddb73e686ebbb862b08664e595 2026-07-28T20:52:18+07:00 docs(auth): point README to WP7 and RV-1 evidence status
```

`git status --short`

```text
Working tree dirty with extensive unrelated modifications and untracked files across Admin, User Web, backend, docs, infra.
```

### 3.2 Gate 0 verdict

Không có evidence cho:

- `git status clean` trước Step 3
- recovery point commit/tag/branch được tạo riêng cho Step 3
- timestamp recovery point được ghi lại

=> **Process Deviation:** Gate 0 Recovery Point **không được chứng minh đã thỏa**.

Ghi chú: đây là **deviation về quy trình**, không tự động đồng nghĩa với technical failure của code đã deploy.

### 3.3 Owner disposition (Task 3 — 2026-07-29)

**Process Deviation — Accepted by Owner.**

- Không replay Gate 0.
- Không yêu cầu tạo Recovery Point mới.
- Không làm lại workflow Step 3 vì lý do Gate 0.
- Deviation được **ghi nhận và chấp nhận** ở tầng process; không nâng/hạ technical verdict từ riêng mục này.

---

## 4. Production browser/runtime evidence

### 4.1 Probe setup

Headless Chromium production probe chạy trên domain `https://iflux.vn` với flow:

1. Guest mở Owner URL `https://iflux.vn/IFLMVN10/cong-dong`
2. Điều hướng sang `https://iflux.vn/dang-ky`
3. Refresh trang đăng ký
4. Tab thứ hai mở trực tiếp `https://iflux.vn/dang-ky`
5. Tab thứ hai mở lại Owner URL rồi quay về `https://iflux.vn/dang-ky`

### 4.2 Browser output (excerpt)

```json
{
  "owner": "IFLMVN10",
  "directOwner": {
    "href": "https://iflux.vn/IFLMVN10/cong-dong",
    "activeOwner": "IFLMVN10",
    "navContext": {
      "ownerPublicId": "IFLMVN10",
      "source": "incoming-path",
      "state": "guest"
    },
    "lockedFlag": true
  },
  "registerFromOwner": {
    "href": "https://iflux.vn/dang-ky",
    "activeOwner": "IFLMVN10",
    "lockedFlag": false,
    "referralValue": "",
    "referralReadOnly": false,
    "hintText": "Mã từ link trước đó không còn hợp lệ — bạn có thể đăng ký không cần mã hoặc nhập mã khác."
  },
  "registerRefresh": {
    "href": "https://iflux.vn/dang-ky",
    "activeOwner": "IFLMVN10",
    "lockedFlag": false,
    "referralValue": ""
  },
  "secondTabDirectRegister": {
    "href": "https://iflux.vn/dang-ky",
    "activeOwner": "",
    "navContext": null
  }
}
```

### 4.3 Production interpretation

| Case | Evidence | Verdict |
|------|----------|---------|
| Direct Owner URL | `activeOwner = IFLMVN10` trong `IfluxIdentityContext` và `navContext.ownerPublicId` | **PASS** |
| Register after Owner URL (`IFLMVN10`) | `activeOwner` giữ projection; field trống sau validate fail | **Invalid fixture** (xem §4.5) — không phải mapping bug |
| Refresh on Register | `activeOwner` vẫn giữ `IFLMVN10` | **PASS** cho projection persistence |
| Second tab direct register | `activeOwner = ''`, `navContext = null` | **Evidence only**; chưa kết luận business PASS/FAIL |

### 4.4 Critical note (superseded by §4.5)

Probe đầu dùng `IFLMVN10` → API `valid:false`. Kết luận ban đầu *Unable to distinguish* đã được đóng ở §4.5 bằng Owner hợp lệ.

---

### 4.5 Gap Closure Task 1 — Register E2E (2026-07-29)

**Artifact:** `.tmp/phase5-reg-e2e/register-e2e-evidence.json` (+ screenshots A–D)  
**Không sửa implementation** trong task này.

#### Fixture contrast

| Code | API `/api/auth/referral/validate/...` | Verdict |
|------|----------------------------------------|---------|
| `IFLMVN10` | `{"valid":false,"code":"IFLMVN10"}` | **Invalid production fixture** |
| `IFLNU6MH` | `{"valid":true,"code":"IFLNU6MH","displayName":"WP7 Runtime",...}` | **Valid Owner Public ID** |

#### Register E2E với Owner hợp lệ (`IFLNU6MH`)

| Case | Evidence | Verdict |
|------|----------|---------|
| Owner URL | `activeOwner = IFLNU6MH` · `navContext.ownerPublicId = IFLNU6MH` · `hasGetCodeForIdentityCreation = false` | PASS |
| Register after Owner | `referralValue = IFLNU6MH` · `readOnly = true` · class `is-ref-locked` · hint «Giới thiệu bởi WP7 Runtime» · `lockedFlag = true` | **PASS** |
| Register refresh | cùng `activeOwner` + field locked giữ `IFLNU6MH` | PASS |
| Direct Register (không Owner) | `activeOwner = ''` · field trống · không lock | Evidence baseline OK |

#### Phân biệt Case A vs Case B

| Hypothesis | Evidence | Kết luận |
|------------|----------|----------|
| **A. Invalid fixture** | `IFLMVN10` API `valid:false`; Register clear field + hint «không còn hợp lệ» trong khi `activeOwner` vẫn giữ projection | **Đúng** — probe cũ không phải runtime mapping bug |
| **B. Runtime mapping bug** | Với `IFLNU6MH` hợp lệ: Identity Context → prefill → lock → validate network PASS | **Không còn support** — Register path đọc Active Owner đúng |

**Register E2E business verdict: PASS**  
(Identity Context read + Register consumer mapping; không claim full signup submit/OTP/create-user.)

---

### 4.6 Gap Closure Task 2 — Login / Logout / Social / Share (2026-07-29)

**Artifact:** `.tmp/phase5-task2/task2-evidence.json` (+ screenshots T2-1 / T2-3 / T2-5)  
**Credential:** `wp7.runtime.1785246163@iflux.test` (Self Public ID `IFLNU6MH`)  
**Guest Owner A:** `IFLVJALL`  
**Không sửa implementation.**

#### Login transition

| Case | Evidence fields | Verdict |
|------|-----------------|---------|
| Guest Owner A | `snaps.guestA.activeOwner` = `"IFLVJALL"` · `href` = `…/IFLVJALL/cong-dong` | PASS baseline |
| Login → Self | `snaps.afterLogin.loggedIn` = `true` · `activeOwner` = `"IFLNU6MH"` · `userReferral` = `"IFLNU6MH"` · `href` = `…/IFLNU6MH/cong-dong` | **PASS** |
| Writer decorate | `snaps.afterLogin2.decoratedCongDong` = `"/IFLNU6MH/cong-dong"` | PASS |

#### Logout transition

| Case | Evidence fields | Verdict |
|------|-----------------|---------|
| After logout | `snaps.afterLogout.loggedIn` = `false` · `activeOwner` = `""` · `nav` = `null` · `href` = `…/cong-dong` | **PASS** (Active Owner cleared) |

#### Share (logged-in)

| Case | Evidence fields | Verdict |
|------|-----------------|---------|
| Product canonical giữ sạch | `shareProbe.canonicalUrl` = `"https://iflux.vn/cong-dong"` | PASS |
| Share URL = Owner URL Self | `shareProbe.shareUrl` = `"https://iflux.vn/IFLNU6MH/cong-dong"` · `ref` = `"IFLNU6MH"` | **PASS** |
| Không duplicate / không Product-as-share | `shareUrl` ≠ bare Product path; prefix đúng 1 Public ID | PASS |

#### Social

| Case | Evidence fields | Verdict |
|------|-----------------|---------|
| Source mapping Identity Context | `socialSourceCheck.hasIdentityContext` = `true` · `hasGetActiveOwner` = `true` · `hasGetCodeForIdentityCreation` = `false` | **PASS** (source) |
| Social OAuth E2E (Google/Apple/…) | không có OAuth complete trong probe | **INSUFFICIENT EVIDENCE** |

#### Task 2 mapping → audit updates

| Kết luận | Evidence | Audit fields updated |
|----------|----------|----------------------|
| Guest A → Login Self replaces Active Owner | `task2-evidence.json` `guestA` / `afterLogin` | Transition Consistency · Exactly one Active Owner |
| Logout clears Active Owner | `afterLogout` | Transition Consistency |
| Share logged-in Owner URL | `shareLoggedIn.shareProbe` | Representation Consistency |
| Social source IdentityContext | `socialSourceCheck` | Context Consistency (source only) |
| Social OAuth E2E | — | **không** nâng PASS — xem §4.7.2 |

---

### 4.7 Gap Closure Task 3 — Remaining Verification (2026-07-29)

**Không sửa implementation.** Chỉ thu evidence + cập nhật audit này.  
**Index:** `.tmp/phase5-task3/task3-summary.json`

| Probe | Artifact | Verdict |
|-------|----------|---------|
| Gate 0 | §3.3 | **Process Deviation — Accepted by Owner** (no replay) |
| Social OAuth E2E | Owner matrix + [`15-…Chrome-Fail-Localization-Audit.md`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md); probe artifacts chỉ còn phụ (automation) | **Chrome FAIL / Safari PASS** — prior BLOCKED **retracted** |
| Login User C (multi-account) | `multi-account-evidence.json` · `multi-account-navcontext-supplement.json` · screenshots `ma-*.png` | **PASS** |
| Guest Share | `guest-share-evidence.json` · `gs-1-owner-url.png` | **MISMATCH** vs Brief/SoT Representation (Active Owner unused) |
| Multi-tab | `multi-tab-evidence.json` · `multi-tab-navcontext-supplement.json` · screenshots `mt-*.png` | **FAIL** — cross-tab logout contamination |

#### 4.7.1 Gate 0

Không replay. Giữ **Process Deviation — Accepted by Owner** (§3.3).

#### 4.7.2 Social OAuth E2E — **CORRECTED** (Owner matrix + Chrome 150 measurement)

**Prior Task 3 `BLOCKED / INSUFFICIENT` retracted.**  
**Prior framing RC-A “DOM/button không render” as primary retracted** — xem [`15`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md) rev 2.

**Owner matrix**

| Environment | Result |
|-------------|--------|
| Chrome Desktop (current / Guest / new Profile / Incognito) | **FAIL** |
| Safari Desktop (cùng máy) | **PASS** |
| Mobile | **PASS** |
| Chrome — lần đăng ký Google đầu (lịch sử) | **PASS** → user `gm.icosoft@gmail.com` |

Hệ quả: loại backend; loại storage một profile; **không** lấy “lifecycle sau 1 login trong cùng profile” làm RC chính.

**Measurement (Chrome 150 · `.tmp/phase5-task3/chrome-selector-proof/` · audit [`15`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md) rev 4)**

**Measured failure point (proven):**

> `clickOffscreenGoogleActivator()` returned `false` because the current selector did not find a clickable element in the accessible light DOM.  
> The reason why the selector did not match has **not** yet been established.

| Fact | Result |
|------|--------|
| `querySelector → null → return false` | Proven |
| Light DOM snapshot: no `[role=button]` / `div[tabindex]`; iframe GIS present | Proven |
| iframe cross-origin (parent cannot inspect) | Proven |
| “Selector incompatible / FedCM = Root Cause” | **Not declared** — Observed Compatibility Gap only |
| Safari DOM parity dump | **Open** — reviewer gate còn lại |

**Full write-up:** [`15-Social-OAuth-Chrome-Fail-Localization-Audit.md`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md) §Glossary + §A + §5–§6  

**Implementation mapping (Priority 1 — LOCKED):** [`16-Google-Login-Implementation-Mapping-Audit.md`](16-Google-Login-Implementation-Mapping-Audit.md)  
→ Production Login = `auth-social.js?v=googleProxy20260728` (`clickOffscreen*`). Local `google-provider.js` (`prompt`) **không** phải bundle đang chạy.

#### 4.7.3 Login User C (multi-account transition)

**Flow:** Guest → Owner A (`IFLVJALL`) → Login User B (`IFLNU6MH`) → Logout → Owner C (`IFLNFLAU`) → Login User C.

**Users:**
- B: `wp7.runtime.1785246163@iflux.test` / Self `IFLNU6MH`
- C: tạo qua Production register API (evidence `userC-*.json`) · Self `IFLNFLAU` · `phase5.task3.c.1785319675@iflux.test`

| Checkpoint | Evidence | Verdict |
|------------|----------|---------|
| Guest Owner A | `activeOwner=IFLVJALL` · NC `incoming-path`/`guest` | PASS |
| Login B | `activeOwner=IFLNU6MH` · NC `self`/`authenticated` · transferred from `IFLVJALL` · Share `…/IFLNU6MH/cong-dong` | PASS |
| Logout B | `activeOwner=""` · NC `null` · `loggedIn=false` | PASS |
| Guest Owner C path | `activeOwner=IFLNFLAU` · NC `incoming-path`/`guest` | PASS |
| Login C | `activeOwner=IFLNFLAU` · NC `self`/`authenticated` · email User C · Share `…/IFLNFLAU/cong-dong` · `ref=IFLNFLAU` | **PASS** |
| Stale A/B sau Login C | `staleA=false` · `staleB=false` · `exactlyOneActiveOwner_after_C=true` | **PASS** |

**Multi-account verdict: PASS**

#### 4.7.4 Guest Share

**Flow:** Guest → mở Owner URL `https://iflux.vn/IFLVJALL/cong-dong` → Share Foundation `buildShareUrl({canonicalUrl:'https://iflux.vn/cong-dong'})`.

| Field | Observed |
|-------|----------|
| `shareUrl` | `https://iflux.vn/cong-dong` (Product URL — **không** Owner prefix) |
| `canonicalUrl` | `https://iflux.vn/cong-dong` |
| `ref` / `outgoingAffiliateRef` | `""` |
| `IfluxIdentityContext.getActiveOwner()` | `IFLVJALL` |
| `IfluxAuth.getUser().referral_code` | `null` (Guest) |
| Nguồn Public ID cho decorate | **chỉ** `Auth.referral_code` (Foundation) — **không** đọc Identity Context |

**So sánh Business Requirement / SoT Representation:** Share là bề mặt phân phối Owner URL; Active Owner đang hiệu lực = `IFLVJALL` nhưng Share emit Product URL.

**Verdict: MISMATCH** (không nâng PASS). Evidence không suy diễn nguyên nhân product intent ngoài quan sát Foundation `getOutgoingAffiliateRef`.

#### 4.7.5 Multi-tab

**Setup:** cùng browser context (localStorage auth dùng chung; PNC `sessionStorage` theo tab).  
Tab1 Owner A `IFLVJALL` · Tab2 Owner path `IFLNFLAU` · Tab1 Login User B · Tab2 Refresh · Tab1 Logout · Tab2 Refresh.

| Moment | Tab1 | Tab2 | Note |
|--------|------|------|------|
| Before login | AO `IFLVJALL` · NC guest | AO `IFLNFLAU` · NC guest | isolated PNC OK |
| After Tab1 Login B + Tab2 refresh | AO `IFLNU6MH` · loggedIn true | AO `IFLNU6MH` · loggedIn true · NC `self`/`authenticated` | expected shared auth transfer |
| After Tab1 Logout + Tab2 refresh | AO `""` · NC `null` · loggedIn false | **AO `IFLNU6MH`** · **NC vẫn `self`/`authenticated`** · **loggedIn false** | **contamination** |
| Tab2 reopen `/IFLNFLAU/cong-dong` sau logout | — | AO vẫn **`IFLNU6MH`** · NC authenticated không replace | **BD-06 replace không xảy ra** (projection authenticated orphan) |

Share Tab2 sau logout refresh: `shareUrl=https://iflux.vn/cong-dong` (Guest Auth) trong khi Identity ActiveOwner vẫn `IFLNU6MH`.

**Verdict: FAIL — CROSS_TAB_LOGOUT_CONTAMINATION**

---

## 5. Coverage gaps

Sau Task 3:

| Item | Status |
|------|--------|
| Social OAuth E2E | **CORRECTED** — Chrome FAIL / Safari PASS; localization [`15`](15-Social-OAuth-Chrome-Fail-Localization-Audit.md); prior BLOCKED retracted |
| Login User C | **DONE PASS** (§4.7.3) |
| Guest Share | **DONE — MISMATCH** (§4.7.4) |
| Multi-tab | **DONE — FAIL** (§4.7.5) |
| Gate 0 | **Accepted by Owner** (§3.3) |

Open for Phase 5 Final PASS: fix/verify multi-tab logout contamination; quyết định Guest Share (Identity Context vs Auth Self) — ngoài phạm vi “chỉ evidence” của Task 3; Social E2E khi có điều kiện OAuth thật.

---

## 6. Final audit disposition

| Area | Result |
|------|--------|
| Architecture compliance | PASS |
| Cleanup verification | PASS |
| Runtime projection | PASS (single-tab / multi-account) |
| Semantic verification | **FAIL** trên multi-tab logout (stale authenticated projection) |
| Business verification | PARTIAL — multi-account PASS; Guest Share MISMATCH; Social Chrome FAIL/Safari PASS; multi-tab FAIL |
| Process / Recovery Point | **DEVIATION — Accepted by Owner** |

### Final decision (historical Task 3 — 2026-07-29)

**Phase 5 chưa đủ điều kiện để ký Final PASS** *nếu* lấy multi-tab FAIL + Guest Share MISMATCH + Social Chrome FAIL làm blocker sản phẩm.

Đã PASS (giữ):

1. Register E2E Owner hợp lệ — §4.5  
2. Login / Logout / Share logged-in (single-tab) — §4.6  
3. Multi-account User B → User C — §4.7.3  
4. Social OAuth trên **Safari** — Owner verified (§4.7.2 corrected)  

---

## 7. Errata — AC alignment (2026-07-30)

Sau [`14-Phase-05-AC-Gap-Classification.md`](14-Phase-05-AC-Gap-Classification.md) + Plan amendment §6A / **Program End-to-End Business Verification Gate**:

| Mục trong Step 4 | Vai trò với Final PASS Phase 5 |
|------------------|--------------------------------|
| Multi-tab FAIL | **Không** AC Phase 5 — residual / follow-up |
| Guest Share MISMATCH | **Phase 7** — không chặn P5 |
| Social Chrome FAIL | Ngoài AC P5 (source/caller đã met) |
| Gate 0 | Process Deviation — Owner đã Accept |
| Product AC Plan + AC-D* + P5-V-* | **Met** — đủ để mở Step 5 Acceptance |

**Disposition Step 4 (product):** Verification **DONE** cho AC Phase 5.  
**Final PASS:** chờ Owner ký [`14b-Phase-05-Acceptance.md`](14b-Phase-05-Acceptance.md).  
**§6A:** chỉ **Program End-to-End Business Verification Gate** — Pass Phase 5 ≠ Pass §6A · Final Program PASS chỉ sau Gate.

---

*Verification Audit này là audit độc lập; không copy kết luận của Step 3. Evidence-first · Task 3 2026-07-29 · Errata AC 2026-07-30.*
