# Phase 6 · Step 2 — Implementation Design  
## URL Representation Writer · BD-03

**Date:** 2026-07-30  
**Status:** ✅ **ACCEPT / PASS** · Step 3 Implementation **DONE** · [`31-Phase-06-Step3-Change-List.md`](31-Phase-06-Step3-Change-List.md)  
**Neo Discovery:** [`29-Phase-06-Discovery-Audit-URL-Representation-Writer.md`](29-Phase-06-Discovery-Audit-URL-Representation-Writer.md) ✅ **ACCEPT**  
**Neo:** Solution §5.3 · BR-11 · BR-17 · BD-03 · Plan Phase 6 · R-URL-01 · R-URL-03 · R-OWN-01 · CG-011 / §2.1  
**Owner decisions (LOCKED):** P6-DQ-01=**A** · P6-DQ-02=**B** · P6-DQ-03=**A** · P6-DQ-04=**C**  
**Review comments (LOCKED):** **P6-API-01** · Allowlist **evidence-only**  
**Cache buster:** `p6Writer20260730`  

**§6A:** Contribution only (preserve Owner trên link app) · **không** Pass §6A · **không** Final Program PASS · **không** tuyên bố kênh phân phối.

---

# 0. Engineering Rule — New File Creation Governance

**Modify Existing** `runtime/shell-url-writer.js` (+ callers tối thiểu).  
**Cấm** tạo `url-writer-v2.js` / parallel Writer / helper file chỉ để đổi policy.

| # | Điều kiện Create New | Phase 6? |
|---|----------------------|----------|
| 1 | Module hiện tại không mở rộng hợp lý | **FAIL** — Writer đã có decorate / navigate / zone |
| 2 | Responsibility mới chưa thuộc module hiện có | **FAIL** — Representation write = Writer |
| 3–4 | Replacement + no dual | N/A nếu Modify |

**Quyết định Design:** **Không tạo file Writer mới.**

---

# 1. Map Owner Decisions → Design

| DQ | Khóa | Design implication |
|----|------|-------------------|
| **P6-DQ-01 A** | Writer đọc **NC projection** | Giữ `getOwnerPublicId()` ← `IfluxNavigationContext.getContext()` · **cấm** gọi `IfluxIdentityContext.getActiveOwner()` trong Writer |
| **P6-DQ-02 B** | Auth **không** mặc định prefix; preserve qua **restore** khi Business Flow cần | **Giữ** `isApplicationZone` false cho auth/oauth/payment/logout. Restore Representation sau auth qua **P6-API-01** (DQ-03) |
| **P6-DQ-03 A** | Post-login restore Owner Representation nếu Context còn | Mọi redirect app sau Login → **chỉ** `IfluxShellUrlWriter.navigate(canonical)` · sửa hardcode `/cong-dong` |
| **P6-DQ-04 C** | Hybrid migrate P0 + allowlist hẹp | §4 — allowlist **không** chứa giả định |

### Layering (khóa)

```text
Identity Authority → Identity Context → Navigation Context (projection) → Shell URL Writer
```

---

# 1A. P6-API-01 — Single entrypoint (Review comment #1 · LOCKED)

**Nội dung khóa:**

> Step 3 phải dùng **đúng một entrypoint** cho mọi **internal app navigation** (đổi `location` trong app zone).

| Vai trò | API **duy nhất** được phép | Cấm |
|---------|----------------------------|-----|
| **Internal navigation** (đổi trang trong app) | **`IfluxShellUrlWriter.navigate(canonical, opts)`** | `location.href` / `location.replace` / `location.assign` trực tiếp tới app path |
| | | Gọi `IfluxRoutes.to(...)` rồi `location.*` |
| | | Gọi `IfluxHref.forCanonical(...)` rồi `location.*` |
| | | Mỗi file tự viết `shellNavigate` / helper song song **khác** Writer |

**Thin wrapper nội bộ (được phép tối đa một):**

Nếu `auth.js` còn `shellNavigate`, Step 3 **bắt buộc**:

```text
shellNavigate(canonical, opts)
  → chỉ gọi IfluxShellUrlWriter.navigate(canonical, opts)
  → không decorate riêng · không Routes.to · không location.* fallback khi Writer có mặt
```

Wrapper = alias, **không** = entrypoint thứ hai. Callers Step 3 migrate ưu tiên gọi **`IfluxShellUrlWriter.navigate` trực tiếp**.

**Không nhầm với sinh `href` (không đổi location):**

| Vai trò | API khóa | Ghi chú |
|---------|----------|---------|
| Sinh chuỗi URL cho `<a href>` / attribute | **`IfluxHref.forCanonical(canonical)`** | Thin → `Writer.decorate` — **không** dùng để navigate |
| Lấy public path route (canonical, chưa navigate) | `IfluxRoutes.to(key, { skipDecorate: true })` hoặc `route.public` | Chỉ lấy **canonical**; navigate = `Writer.navigate(canonical)` |

```text
ĐÚNG:
  Writer.navigate('/cong-dong')
  Writer.navigate(IfluxRoutes.to('community', { skipDecorate: true }))

SAI:
  location.href = IfluxRoutes.to('community')
  location.replace(IfluxHref.forCanonical('/cong-dong'))
  location.href = '/cong-dong'
```

**AC bổ sung:** **AC-D7** · **P6-V-R4** (grep entrypoint).

---

# 2. Target behavior (TO-BE)

## 2.1 Decorate (không đổi contract công khai)

```text
decorate(canonical):
  if !isApplicationZone → return canonical
  owner = NC.getContext().ownerPublicId
  if !owner → return canonical
  return /{owner}{canonical}
```

**Không** đổi: Auth zone vẫn không prepend URL trên trang Auth (DQ-02 B).  
**Không** sửa `isApplicationZone` để prepend auth.

## 2.2 Post-auth Representation restore (P6-G04 · DQ-03 · P6-API-01)

```text
Active Owner Context còn hiệu lực
        +
Redirect tới app destination (vd. /cong-dong)
        ↓
IfluxShellUrlWriter.navigate('/cong-dong')   ← P6-API-01 duy nhất
        ↓
/{ActiveOwner}/cong-dong
```

**Không** tạo Context mới — chỉ Representation từ Context hiện có.

## 2.3 Zone policy (P6-G01 · DQ-02)

| Zone | Decorate prepend? | Preserve Context bằng |
|------|-------------------|------------------------|
| App public | **Yes** nếu có Owner | `Writer.navigate` / `IfluxHref.forCanonical` |
| Auth pages | **No** | returnTo + restore sau Login qua `Writer.navigate` |
| OAuth / callback / payment / logout | **No** | Flow-specific; không đẻ BR mới |
| External http(s) | **No** | Allowlist (evidence) |

---

# 3. Impact Analysis (CG-005)

| Feature | Current owner | Files | Functions | Consumers | Decision |
|---------|---------------|-------|-----------|-----------|----------|
| App URL decorate | `shell-url-writer.js` | Writer · Href · Routes | `decorate` · `isApplicationZone` · `navigate` | Routes · Href · UI | **Modify** callers → **P6-API-01**; zone auth strip **giữ** |
| Post-auth redirect | `auth.js` · `auth-login-init.js` | `redirectAfterAuth` · cross-tab · emergency | **→** `Writer.navigate` | Login / session | **Modify** |
| Href generation | `iflux-href.js` | `forCanonical` | Pages / widgets | **Reuse** — chỉ sinh href |
| Bypass location.* | Nhiều file | §4 | Nav ad-hoc | **Migrate** P0 · **Allowlist** evidence-only |

**Storage/API:** không đổi Identity / Attribution storage.

---

# 4. Bypass Inventory (P6-DQ-04)

## 4.1 P0 — **Migrate** → **chỉ** `IfluxShellUrlWriter.navigate`

| File | AS-IS | TO-BE (P6-API-01) |
|------|-------|-------------------|
| `auth-login-init.js` L54 · L61 | `location.href = '/cong-dong'` | `IfluxShellUrlWriter.navigate('/cong-dong')` |
| `auth.js` `handleCrossTabAuthSync` L807 · L811 | `location.replace(appHomePath())` | `Writer.navigate('/cong-dong')` (hoặc canonical community `skipDecorate`) — **không** `location.replace(Routes.to(...))` |
| `auth.js` `redirectAfterAuth` | `shellNavigate` / fallback `location.replace` | `shellNavigate` = alias Writer **hoặc** gọi `Writer.navigate` trực tiếp; fallback `location.*` **chỉ** khi `!IfluxShellUrlWriter` (dev/file) |
| `share-feature-boot.js` | `location.replace('/nha-cua-toi')` | `Writer.navigate('/nha-cua-toi')` |
| `account-feature-boot.js` | `location.replace(canonical)` | `Writer.navigate(canonical)` nếu app-zone |
| `iflux-guest-shell.js` | `location.replace(canonical)` | `Writer.navigate(canonical)` |
| `iflux-web-ui.js` · `loyalty-page.js` · `community-post-page.js` · `iflux-pricing-modal.js` · `widgets/pricing-page` · `profile-view.js` · `stock-comment-page.js` | Fallback `location.href = canonical` | Có Writer → **bắt buộc** `navigate`; không Writer → fallback dev only |
| `loyalty-affiliate.js` (internal app URL) | `location.href = url` | Nếu URL cùng origin app-zone → **Migrate** `Writer.navigate(canonical)`; external → §4.2 |
| `stock-pretty-url-redirect.js` | `location.replace` file bootstrap | Step 3: nếu còn live trên public path → **Migrate** hoặc **Allowlist** với evidence “legacy file bootstrap only / không public Owner URL” |

## 4.2 Allowlist — **evidence-only** (Review comment #2 · LOCKED)

**Cấm** wording: “kỳ vọng” · “probably” · “maybe” · “assumed decorated”.

Mỗi hàng allowlist phải có **một** trong hai:

| Gate | Nghĩa |
|------|--------|
| **EVIDENCE** | Bằng chứng đã có (grep / runtime) chứng minh không phải internal app navigation thiếu Owner Representation |
| **VERIFY@S4** | Bắt buộc Pass ở Step 4 với case ID; **FAIL → chuyển Migrate** (không giữ allowlist) |

| File / pattern | Phân loại | Evidence / Verify rule |
|----------------|-----------|------------------------|
| `location.*` tới **external** `http(s)` (`redirectAfterAuth` absolute; mail deeplink ngoài origin) | Allowlist | **EVIDENCE:** URL `^https?:` ngoài origin app — ngoài Writer responsibility |
| `auth-social.js` OAuth provider redirect | Allowlist | **EVIDENCE:** hop tới IdP / OAuth callback — không app Representation |
| `auth.js` → `verify-otp.html` · `auth-forgot-init` → `login.html` · `auth-otp-init` auth HTML | Allowlist | **EVIDENCE:** relative auth-zone file hop (DQ-02 — không prefix Auth URL) |
| `auth.js` `requireAuth` → `loginWithReturn` | Allowlist | **EVIDENCE:** vào Auth zone; preserve = returnTo state, không prefix login URL |
| `history.replaceState` **hash-only** / không đổi Owner path segment | Allowlist | **EVIDENCE:** chỉ `#…` hoặc query UI; pathname Owner không đổi |
| `iflux-staging-gate.js` | Allowlist | **EVIDENCE:** infra staging gate — ngoài Product Representation |
| `iflux-header-search.js` `location.href = active.getAttribute('href')` | **VERIFY@S4** — **không** allowlist “kỳ vọng” | **P6-V-R5:** (1) Grep mọi generator gắn `href` cho search results **phải** `IfluxHref.forCanonical` · (2) Runtime sample: với Active Owner, mọi `href` trong dropdown có Owner prefix đúng. **FAIL → Migrate:** click dùng `Writer.navigate(normalizePath(href))` (strip rồi navigate canonical) |
| `loyalty-affiliate.js` | **VERIFY@S4** per URL | External/payment → Allowlist EVIDENCE; same-origin app → **Migrate** (không để “có thể”) |
| `stock-pretty-url-redirect.js` | **VERIFY@S4** | Chứng minh không còn trên public Owner journey **hoặc** Migrate |

**Rule:** Mục mới vào allowlist **chỉ** khi có EVIDENCE hoặc VERIFY@S4 ID; cấm assumption.

## 4.3 `history.replaceState` (P6-G03)

| Owner | Action |
|-------|--------|
| `shell-url-writer.replacePath` | Keep — Writer owns Representation bar |
| Hash-only / query cleanup UI | Allowlist + EVIDENCE |
| `iflux-platform-boot.js` path normalize | **VERIFY@S4 P6-V-R6** — nếu strip Owner → **FAIL** · phải `Writer.syncBarWithOwner` / `replacePath` |

---

# 5. Change Plan (Step 3 — **OPEN**)

**Thứ tự:**

1. Chuẩn hóa **P6-API-01**: mọi internal nav → `IfluxShellUrlWriter.navigate`; `shellNavigate` = alias only.  
2. Harden `redirectAfterAuth` / cross-tab / emergency — DQ-03.  
3. Migrate toàn bộ §4.1.  
4. Không đụng `isApplicationZone` auth strip (DQ-02).  
5. Không đụng Share — Phase 7.  
6. Change List + deploy Production + CF purge.  
7. Step 4: P6-V-B* · P6-V-R* (gồm R4/R5/R6).

**Rollback:** revert diff · không schema.

---

# 6. Acceptance Criteria Design (AC-D)

| ID | Tiêu chí |
|----|----------|
| **AC-D0** | Không file Writer mới (§0) |
| **AC-D1** | Writer Owner source = NC only (DQ-01) |
| **AC-D2** | Auth URL không bắt buộc prefix (DQ-02); zone auth strip giữ |
| **AC-D3** | Post-login / post-auth app redirect restore Owner Representation khi Context còn (DQ-03) |
| **AC-D4** | P0 bypass migrated; allowlist §4.2 evidence-only (DQ-04) |
| **AC-D5** | Không Share / không §6A Gate claim |
| **AC-D6** | P6-V-B1…B5 trong Verification Plan |
| **AC-D7** | **P6-API-01** — internal navigation chỉ `IfluxShellUrlWriter.navigate` |

### Verification cases (Step 4)

| ID | Case | PASS khi |
|----|------|----------|
| **P6-V-B1** | Login A → Community/Stock/… | Link app-zone = `/IFLA/…` |
| **P6-V-B2** | Guest B → Login C | Navigation links = `/IFLC/…` (không stale B) |
| **P6-V-B3** | Click menu/card/breadcrumb/widget | Không mất Owner trên URL sinh ra |
| **P6-V-B4** | Đang có Owner Context | Không sinh Product URL trần cho link nội bộ app cần Context |
| **P6-V-B5** | `querySelectorAll('a[href]')` sample | Không href sai Owner |
| **P6-V-R1** | Post-login default community | `…/IFL{Active}/cong-dong` nếu Context còn (DQ-03) |
| **P6-V-R2** | Grep P0 migrate list | Không hardcode app `location.href='/cong-dong'` ngoài allowlist EVIDENCE |
| **P6-V-R3** | Writer không import/call `IfluxIdentityContext` | Grep PASS |
| **P6-V-R4** | **P6-API-01** | Grep: không còn pattern migrate-list gọi `location.(href\|replace)` tới app path khi Writer có mặt; navigate path = `IfluxShellUrlWriter.navigate` |
| **P6-V-R5** | Header search href | Generators dùng `IfluxHref.forCanonical` **hoặc** click migrate `Writer.navigate` — **không** assumption |
| **P6-V-R6** | platform-boot replaceState | Không strip Active Owner khỏi pathname |

---

# 7. Out of scope (nhắc lại)

| Mục | Owner |
|-----|-------|
| Guest Share / Share Foundation | Phase 7 |
| Parse hợp nhất | Phase 8 |
| Program End-to-End Business Verification Gate | Plan §3A |
| Tuyên bố FB / Zalo / QR / Ads / Email hỗ trợ đầy đủ | Sau Gate Business PASS |

---

# 8. Step 2 Acceptance

| Check | Status |
|-------|--------|
| Map P6-DQ-01…04 | ✅ |
| Impact Analysis | ✅ |
| Bypass migrate + allowlist evidence-only | ✅ |
| **P6-API-01** single navigate entrypoint | ✅ LOCKED §1A |
| AC-D0…D7 + P6-V-* | ✅ |
| New File Gate | ✅ Modify Existing |
| Review comments #1 #2 | ✅ Đã khóa trước Step 3 |
| Không code (trước Step 3) | ✅ |

| Vai trò | Quyết định | Ngày | Ký |
|---------|------------|------|-----|
| Reviewer | **ACCEPT WITH COMMENTS** → comments **LOCKED** | 2026-07-30 | ☑ |
| Owner | **ACCEPT / PASS Step 2** | 2026-07-30 | ☑ |

**PASS Step 2 →** **được mở Step 3 Implementation** (chưa code đến khi Owner/agent bắt đầu Step 3).

---

## Changelog — Accept with comments (2026-07-30)

1. **P6-API-01:** Internal app navigation = chỉ `IfluxShellUrlWriter.navigate`.  
2. Allowlist: bỏ assumption (“kỳ vọng”); mỗi mục = EVIDENCE hoặc VERIFY@S4 (FAIL → Migrate).  
3. `iflux-header-search` → VERIFY@S4 **P6-V-R5**, không allowlist giả định.  
4. AC-D7 · P6-V-R4/R5/R6.

---

*Phase 6 Step 2 Design · **ACCEPT / PASS** 2026-07-30 · P6-API-01 LOCKED · allowlist evidence-only · được mở Step 3*
