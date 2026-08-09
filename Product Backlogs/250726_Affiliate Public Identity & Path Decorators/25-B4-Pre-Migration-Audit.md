# B4 — Pre-Migration Audit (URL Writer funnel inventory)

**Date:** 2026-07-27  
**Status:** **LOCKED** — input cho B4 migration  
**Reviewer:** Pre-B4 repo audit (phân loại trước khi sửa)  
**Scope:** `User_Web/` · patterns: `href="/…"` · `location.*` · `history.*State`

---

## 1. Mục đích

B4 **chỉ migration** — không phát minh logic mới. Audit này liệt kê mọi điểm còn bypass `ShellUrlWriter` để B4 làm việc theo checklist, không vừa tìm vừa sửa.

**Phân loại:**

| Tag | Ý nghĩa | B4 action |
|-----|---------|-----------|
| ✅ **Core** | Đã funnel qua Writer / Routes.to decorate | Giữ nguyên |
| ⚠️ **B4** | Widget · feature · page JS/HTML — cần migrate | `Routes.to()` / `IfluxShellUrlWriter.navigate()` |
| ❌ **External** | mailto · https ngoài · deeplink provider | Không đụng |
| ❌ **OAuth** | Redirect ra Google/provider | Không đụng |
| ❌ **Auth/Exclusion** | OTP · verify · login.html relative | Không đụng (Exclusion Zone) |
| ❌ **Payment** | Checkout/thanh-toan (Owner defer B6) | Audit only · defer |
| ❌ **Assets** | `/User_Web/` · fonts · CSS preload | Không đụng |
| ❌ **Legacy shim** | One-shot 301 HTML · entity redirect | Không đụng (nginx/SEO) |
| 👁 **Read-only** | Đọc `location.href` · không navigate | Không đụng (B5 Share/SEO) |

---

## 2. ✅ Core — đã funnel (B3)

| Module | Pattern | Ghi chú |
|--------|---------|---------|
| `runtime/shell-url-writer.js` | `location.replace/assign` | **Single Writer** — duy nhất ghi bar có decorate |
| `iflux-platform-boot.js` | `Routes.to()` → `decorate()` | hrefFor delegate |
| `iflux-routes.js` | `Routes.to()` → `decorate()` | |
| `auth.js` | `shellNavigate()` · `redirectAfterAuth` | Post-login canonical funnel |
| `iflux-platform-boot.js` | `hrefFor()` | Shell header/sidebar |

**Còn lại trong auth.js (Core partial — fallback paths):**

| Line area | Pattern | B4 note |
|-----------|---------|---------|
| `handleCrossTabAuthSync` | `location.replace(appHomePath())` | `appHomePath()` → `Routes.to()` decorated ✅ |
| `requireAuth` | `loginWithReturn` | Exclusion URL ✅ |
| Fallback branches | `location.replace` khi không có Writer | Giữ fallback · hiếm |

---

## 3. ⚠️ B4 — Widget / Feature (migration targets)

### 3.1 Hardcode `href="/…"` trong JS (ưu tiên cao)

| File | Count | Ví dụ | Migrate → |
|------|-------|-------|-----------|
| `community-page.js` | 5 | `href="/cong-dong"` | `Routes.to('community')` |
| `widgets/loyalty-page/index.js` | 4 | `/nha-cua-toi?tab=affiliate` | `Routes.to('home')` + query |
| `widgets/pricing-page/index.js` | 2 | `/tai-khoan/thanh-toan?...` | route key + query |
| `widgets/faq-page/index.js` | 2 | `/goi-cuoc` · `/thanh-vien` | `Routes.to('pricing')` |
| `widgets/messages-page/index.js` | 1 | `/nha-cua-toi` | `Routes.to('home')` |
| `community-write-page.js` | 1 | `/cong-dong` | `Routes.to('community')` |
| `cau-chuyen-list-page.js` | 1 | `/cong-dong` | `Routes.to('community')` |

### 3.2 `location.href/replace` — app navigation (ưu tiên cao)

| File | Pattern | Migrate → |
|------|---------|-----------|
| `iflux-web-ui.js` | `location.href = '/tai-khoan'` | `Routes.to('account')` hoặc `navigate` |
| `iflux-web-ui.js` | `messagesPageHref()` · pricing · home | Audit fn · funnel Routes.to |
| `iflux-guest-shell.js` | `location.replace(firstGuestPageUrl())` | `navigate(canonical)` · `firstGuestPageUrl` → Routes |
| `iflux-pricing-modal.js` | `location.href = pricingUrl()` | `Routes.to('pricing')` |
| `community-post-page.js` | `location.href = href` | `navigate(canonical)` |
| `stock-comment-page.js` | `location.replace(href)` | `navigate(canonical)` |
| `runtime/account-feature-boot.js` | `location.replace('/tin-nhan...')` | `Routes.to('messages')` |
| `runtime/share-feature-boot.js` | `location.replace('/nha-cua-toi')` | `Routes.to('home')` |
| `entity-pretty-url-redirect.js` | `location.replace(path)` | `navigate(canonical)` |
| `stock-pretty-url-redirect.js` | legacy file paths | `Routes.to()` |
| `loyalty-page.js` | `AFFILIATE_PROFILE` href | `Routes.to('home')` + tab |
| `loyalty-affiliate.js` | `location.href = url` | Verify url source · funnel if app path |
| `google-onetap.js` | `location.href = to` | `navigate` if app path |
| `iflux-header-search.js` | `location.href = active.getAttribute('href')` | Ensure search results use Routes.to |

### 3.3 Static HTML `href="/…"` (brand · fallback nav)

| Pattern | Files | B4 note |
|---------|-------|---------|
| `<a href="/nha-cua-toi" class="ifx-topnav-brand">` | ~15 page templates | Shell `hrefFor` đã paint JS — HTML fallback B4 batch |
| `<a href="/cong-dong">` | auth/login.html · index.html | `Routes.to('community')` khi render hoặc shell-only |

**Chiến lược HTML:** Ưu tiên **JS-rendered shell** đã decorate · static HTML chỉ sửa nếu load trước shell boot.

---

## 4. ❌ Không thuộc B4

### OAuth

| File | Pattern |
|------|---------|
| `auth-social.js` | `window.location.href = url` (Google OAuth) |

### Auth / Exclusion Zone

| File | Pattern |
|------|---------|
| `auth-otp-init.js` | `location.replace('register.html')` |
| `auth-login-init.js` | `location.href = '/cong-dong'` post-demo |
| `auth-forgot-init.js` | `location.href = 'login.html'` |
| `auth.js` | `verify-otp.html` |

### Payment (defer B6)

| File | Pattern |
|------|---------|
| `widgets/pricing-page/index.js` | `/tai-khoan/thanh-toan?plan=...` | Policy Owner defer |

### External / Deeplink

| File | Pattern |
|------|---------|
| `iflux-mail-deeplink.js` | external `link.url` |
| `widgets/pricing-page` | `mailto:support@iflux.vn` |

### Legacy one-shot redirect (SEO/nginx)

| File | Pattern |
|------|---------|
| `User_Web/index.html` | `location.replace('/cong-dong')` |
| `User_Web/stories/index.html` | → `/chu-de` |
| `community/cong-dong/*/` stubs | → `/cong-dong/bai-viet/...` |
| `alerts/index.html` | legacy file redirect |

### Assets / Infrastructure

| Pattern | Ví dụ |
|---------|-------|
| `href="/User_Web/..."` | CSS/JS preload |
| `href="/Admin_Design_system/..."` | DS assets |
| `href="/api/..."` | API |

### Read-only (B5 Share/SEO)

| File | Pattern |
|------|---------|
| `community-ui.js` | `location.href` canonical read |
| `community-post-page.js` | SEO canonical fallback |
| `interaction/catalog/index.js` | Share URL read |
| `hub-page.js` · `profile-chat-page.js` | URL parse + hash `replaceState` only |

### Staging / Dev

| File | Pattern |
|------|---------|
| `iflux-staging-gate.js` | staging redirect |

---

## 5. history.pushState / replaceState

| File | Tag | Ghi chú |
|------|-----|---------|
| `runtime/shell-url-writer.js` | ✅ Core | Writer-owned |
| `auth-social.js` | ❌ OAuth | Strip query post-callback |
| `community-post-page.js` | 👁 Hash | `#comment-id` only — pathname unchanged |
| `hub-page.js` | ⚠ B4 | Query sync — verify không bypass decorate |
| `profile-chat-page.js` | ⚠ B4 | Query sync — verify |

---

## 6. Tổng hợp số lượng (ước lượng)

| Tag | Files (approx) | Occurrences (approx) |
|-----|----------------|----------------------|
| ✅ Core | 5 | ~15 (Writer + Routes funnel) |
| ⚠️ B4 migrate | **~18 JS** + HTML batch | **~45** |
| ❌ Excluded | ~25 | ~40 |
| 👁 Read-only | 4 | ~8 |

---

## 7. B4 migration order (đề xuất)

```text
Wave 1  widgets/* (loyalty · pricing · faq · messages)
Wave 2  community-page.js · community-write · community-post-page
Wave 3  iflux-web-ui.js · iflux-guest-shell.js · header-search
Wave 4  runtime/*-feature-boot.js · entity/stock redirects
Wave 5  Static HTML brand href (nếu cần · low priority — shell paint)
```

---

## 8. B4 CẤM đụng

Per reviewer + ADR:

- `NavigationContext` · lifecycle · `transferOwnership`
- `ShellUrlWriter` · `decorate()` · `isApplicationZone`
- `normalizePath` / `IfluxNormalizePath`
- Resolver · PNC bridge · affiliate capture

B4 **chỉ** thay caller → `Routes.to()` / `IfluxShellUrlWriter.navigate(canonical)`.

**Governance (rev.3):** MR-1 · **MR-2 (canonical-only input)** · Dependency Rule · Grep M7–M11 — xem [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md).

---

## 9. PASS gate preview (B4)

| Gate | Verify |
|------|--------|
| W1 | Zero ⚠️ B4 items in Wave 1 files |
| W2 | `grep href=\"/(cong-dong\|nha-cua-toi)` trong widgets → 0 |
| W3 | No new `location.replace` app paths ngoài Writer + excluded |
| W4 | Guest IFL111 · widget links → `/IFL111/...` |
| W5 | Auth IFL999 · widget links → `/IFL999/...` |

---

*B4 entry: Owner GO Wave 1 — [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md) rev.2.*
