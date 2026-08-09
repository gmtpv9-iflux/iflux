# Navigation Conformance Report

**Date:** 2026-07-27 (rev.5 — B5 Owner sign-off · doc numbering 00–45)  
**Status:** **B4 CODE COMPLETE** · **B4.5 soak parallel** · **B5 CLOSED**  
**Purpose:** Bằng chứng kiến trúc — 100% consumer đi qua `Routes → Writer → Lifecycle → Context`  
**Governance:** MR-1 · MR-2 · [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md) · [`34-B4.5-Stabilization-Scope-Lock.md`](34-B4.5-Stabilization-Scope-Lock.md) · [`35-B5-SEO-Share-Scope-Lock.md`](35-B5-SEO-Share-Scope-Lock.md)

---

## 1. Pipeline mục tiêu (post-B4)

```text
Consumer (canonical only)
        ↓
Routes.to() / navigate()
        ↓
ShellUrlWriter.decorate()
        ↓
Lifecycle (transitions only)
        ↓
NavigationContext
```

**Không consumer nào đi tắt** · **không consumer nào biết Owner.**

---

## 2. Invariants sau B3 (Application Zone)

| Phase | Owner vs URL bar |
|-------|------------------|
| B2 only (closed) | Owner ≠ bar **được phép tạm** |
| **B3+ (active)** | **Owner == bar prefix** trong Application Zone |

Nếu sau B3 còn `Owner=IFL999` + bar `/cong-dong` (clean) trong app zone → **bug**, không còn "expected".

### INV-7 — Canonical Route không chứa Owner (LOCKED)

```text
Owner:     IFL9552M
Bar:       /IFL9552M/cong-dong
Canonical: /cong-dong          ← normalize · route registry · SEO · analytics
```

**Cấm** dùng `/IFL9552M/cong-dong` làm route nội bộ · registry key · SEO canonical. Mọi reader (`normalizePath`, App Router input) phải strip Owner trước khi resolve.

---

## 3. Consumer conformance matrix

| Consumer | Wave | Writer only | Hardcode href | Owner access | decorate() | Status |
|----------|------|---------------|---------------|--------------|------------|--------|
| **Shell header** (`hrefFor`) | Core B3 | ✅ | 0 | 0 | 0 | **PASS** |
| **Shell sidebar / topnav** | Core B3 | ✅ | 0 | 0 | 0 | **PASS** |
| **Routes.to / auth redirect** | Core B3 | ✅ | 0 | 0 | 0 | **PASS** |
| **Widget loyalty** | W1 | ✅ | 0 | 0 | 0 | **PASS** |
| **Widget pricing** | W1 | ✅ | 0 | 0 | 0 | **PASS** |
| **Widget FAQ** | W1 | ✅ | 0 | 0 | 0 | **PASS** |
| **Widget messages** | W1 | ✅ | 0 | 0 | 0 | **PASS** |
| **loyalty-page.js** (W1 dep) | W1 | ✅ navigate | 0 | 0 | 0 | **PASS** |
| **community-page.js** | W2 | ✅ | 0 | 0 | 0 | **PASS** |
| **community-write-page.js** | W2 | ✅ | 0 | 0 | 0 | **PASS** |
| **community-post-page.js** | W2 | ✅ navigate | 0 | 0 | 0 | **PASS** |
| **iflux-web-ui.js** | W3 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **iflux-guest-shell.js** | W3 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **iflux-header-search.js** | W3 | ✅ followHref | 0 | 0 | 0 | **PASS** (B4.3) |
| **runtime/account-feature-boot.js** | W4 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **runtime/share-feature-boot.js** | W4 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **entity-pretty-url-redirect.js** | W4 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **stock-comment-page.js** | W4 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **iflux-pricing-modal.js** | W4 | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **google-onetap.js** | W4+ | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **profile-view.js** | W4+ | ✅ navigate | 0 | 0 | 0 | **PASS** (B4.3) |
| **cau-chuyen-list-page.js** | W4+ | ✅ forCanonical | 0 | 0 | 0 | **PASS** (B4.3) |
| **Static HTML brand href** | W5 | — | ⚠️ batch | — | — | **OPTIONAL** |

**Legend:** ✅ PASS · ⚠️ audit flagged · — chưa migrate · ⏸ paused pending B4.1

---

## 2.1 Checkpoint B4.1 — Identity Context Boundary

**Status:** ⏸ **Wave 3 PAUSED** → ✅ **RESUMED + PASS (B4.3)** · audit [`27-B4.1-Identity-Context-Boundary-Audit.md`](27-B4.1-Identity-Context-Boundary-Audit.md) · fix B4.2 + B4.3

Phát hiện Production: entity detail (`/co-phieu/MSN`) · article detail (`/cong-dong/bai-viet/*`) **không kế thừa** Owner prefix — root cause **consumer bypass** (`IfluxSeoUrl.*Href`) + **timing gap** `syncBarWithOwner` trước `IfluxRoutes` load.

B4 Wave 1–2 = page-scoped migration · **chưa chứng minh** identity xuyên hệ thống.

### Exit criteria identity (mới)

| ID | Rule |
|----|------|
| **AC-ID-CONTEXT-001** | Identity MUST NOT depend on Page — mọi Application Zone route + links inherit Owner |
| **AC-ID-CONTEXT-002** | Thêm public route mới MUST NOT require per-page decoration change (funnel API) |
| **AC-ID-CONTEXT-003** | 100% public href consumers funnel Writer — 0 SeoUrl raw → `<a>` |

---

## 4. Grep gate summary (migrated scope)

Chạy sau mỗi wave — kết quả **phải 0** trong scope đã migrate:

| Check | W1 widgets | W2 | W3 | W4 | Full B4 |
|-------|------------|----|----|-----|---------|
| M2 hardcode `href="/app…"` | **0** | | | | |
| M7 `ownerPublicId` | **0** | | | | |
| M8 `getContext\|createContext\|transfer` | **0** | | | | |
| M9 `normalizePath` | **0** | | | | |
| M10 `decorate(` | **0** | | | | |
| M11 `/IFL[A-Z0-9]{5,}` in source | **0** | | | | |

---

## 5. Completion criteria (B4 CLOSED → B4.5 → B5)

| # | Criterion | Status |
|---|-----------|--------|
| C1 | Matrix §3 — mọi row **PASS** hoặc **EXCLUDED** | ✅ |
| C2 | Grep M2 + M7–M11 = **0** consumer scope (excl. frozen/core) | ✅ entry snapshot |
| C3 | MR-1 + MR-2 manual review PASS | ✅ |
| C4 | B2 G1–G7 + B3 N1–N10 không regress | ✅ soak watch |
| C5 | **B4.5 Stabilization** soak (parallel · §4.1 locked) | ⏳ parallel |
| C6 | AC-NAV-ROOT (§6) PASS trên Production | ✅ + soak watch |
| **B5** | SEO + Share cleanup | ✅ **CLOSED** — Owner 2026-07-27 · [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) |

→ **B5 CLOSED** Owner 2026-07-27 · Writer/Context/Lifecycle **0 diff** · B4.5 soak tiếp tục.

---

## 6. AC-NAV-ROOT — `/{publicId}` → Home (Community)

> Use case affiliate phổ biến: `https://iflux.vn/IFL9552M` = trang chủ trong namespace referrer.

### Expected behavior (B3+)

| Step | Result |
|------|--------|
| Open `/IFL9552M` | Nội dung = **Community (Home)** |
| NavigationContext | `ownerPublicId = IFL9552M` · `state = guest` |
| Internal links | `/IFL9552M/cong-dong` … (Writer decorate) |
| SEO canonical | **sạch** — không publicId (B5) |

### Resolution stack (hiện trạng)

```text
nginx
  ↓
Resolver (parseAffiliatePath)
  ↓
normalizePath
  ↓
App Router
  ↓
Community
  ↓
B3 Writer (decorate · bar sync · INV-1)
```

| Layer | Rule |
|-------|------|
| **nginx** | `^/IFL…$` → internal rewrite `/` → `community/index.html` |
| **Resolver** | `parseAffiliatePath('/IFL9552M')` → `{ publicId, canonicalPath: '/' }` |
| **normalizePath** | strip prefix → `/` (INV-7) |
| **App Router** | canonical `/` → Community landing (`bootstrap` pageKey) |
| **B3 Writer** | links prepend Owner · bar sync per INV-1 |

**Không thuộc PNC lifecycle** — thuộc **route resolution + rewrite**. Gap nếu fail = nginx/path-base/bootstrap, không sửa Context.

**Hotfix 2026-07-27:** `bootstrap.detectPageKey()` phải normalize pathname trước khi match — raw `/IFL9552M` trả `null` → shell/widgets không mount.

### Verify (Production)

```gherkin
Given  Guest · no prior context
When   Open https://iflux.vn/IFL9552M
Then   Page renders Community feed/shell
And    getContext().ownerPublicId = IFL9552M
And    Header links use /IFL9552M/... prefix

Given  Guest opened /IFL9552M · Community rendered
When   click logo · sidebar · breadcrumb · browser refresh
Then   every destination remains under /IFL9552M/... namespace
And    Owner stays IFL9552M until explicit deactivate/logout
```

---

## 7. Update log

| Date | Wave | Change |
|------|------|--------|
| 2026-07-27 | W1 | loyalty · pricing · faq · messages PASS |
| | | AC-NAV-ROOT documented · conformance report created |
| 2026-07-27 | Hotfix | INV-7 · App Router stack · extended AC-NAV-ROOT navigation |
| | | `bootstrap.detectPageKey` normalize fix for `/{publicId}` |
| 2026-07-27 | W2 | community-page · write · post-page PASS |
| 2026-07-27 | B4.1 | Identity Context Boundary Audit · Wave 3 PAUSED · AC-ID-CONTEXT-001..003 |
| 2026-07-27 | B4.3 | Wave 3 + W4 programmatic nav PASS · [`32-B4.3-Consumer-Audit-Report.md`](32-B4.3-Consumer-Audit-Report.md) |
| 2026-07-27 | Hotfix | Affiliate referral link → `/{publicId}` only (`affRoot2_20260727`) · Owner confirmed |
| 2026-07-27 | **B5** | **GO — ACTIVE** · [`35-B5-SEO-Share-Scope-Lock.md`](35-B5-SEO-Share-Scope-Lock.md) |
| 2026-07-27 | B4.5 §4.1 | Soak tạm khóa: route model · Writer · Context · middleware · SEO (parallel) |
| 2026-07-27 | **B5 WP-4** | Closure PASS · grep + SEO/share/nav regression · Writer/Context 0 diff |
| 2026-07-27 | **B5 sign-off** | Owner PASS · doc renumber 00–45 · [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) §12 |

---

*B4 migration **CODE COMPLETE** · B4.5 soak parallel · **B5 CLOSED**.*
