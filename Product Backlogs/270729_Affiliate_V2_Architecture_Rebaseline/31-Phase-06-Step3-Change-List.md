# Phase 6 · Step 3 — Implementation Change List

**Date:** 2026-07-30  
**Status:** DONE · deployed Production + purged Cloudflare (see §Deploy)  
**Design:** [`30-Phase-06-Implementation-Design-URL-Representation-Writer.md`](30-Phase-06-Implementation-Design-URL-Representation-Writer.md) ✅ **PASS**  
**Locks:** P6-API-01 · P6-DQ-01=A · 02=B · 03=A · 04=C · không đụng `isApplicationZone` auth strip · không Share Foundation  

**Cache buster:** `?v=p6Writer20260730`

---

## Change List

| File | Action | Summary |
|------|--------|---------|
| `User_Web/iflux-web-ui/auth.js` | Modify | `shellNavigate` = thin alias Writer; `redirectAfterAuth` / cross-tab logged-in → `Writer.navigate` (DQ-03 · P6-API-01); auth-zone login still `location.replace` (DQ-02 allowlist) |
| `User_Web/iflux-web-ui/auth-login-init.js` | Modify | Emergency `/cong-dong` → `Writer.navigate` |
| `User_Web/iflux-web-ui/runtime/share-feature-boot.js` | Modify | Navigate home → Writer first (bỏ Href.navigate ưu tiên) |
| `User_Web/iflux-web-ui/runtime/account-feature-boot.js` | Modify | `consumerNavigate` → Writer only |
| `User_Web/iflux-web-ui/iflux-guest-shell.js` | Modify | `consumerNavigate` → Writer only |
| `User_Web/iflux-web-ui/iflux-web-ui.js` | Modify | `appNavigate` → Writer only |
| `User_Web/iflux-web-ui/iflux-pricing-modal.js` | Modify | `consumerNavigate` → Writer only |
| `User_Web/iflux-web-ui/profile-view.js` | Modify | Message path → Writer.navigate |
| `User_Web/iflux-web-ui/stock-comment-page.js` | Modify | Redirect → Writer.navigate |
| `User_Web/iflux-web-ui/widgets/pricing-page/index.js` | Modify | Comment P6-API-01 (đã Writer) |
| `User_Web/iflux-web-ui/loyalty-affiliate.js` | Modify | Absolute URL allowlist; path → Writer.navigate |
| `User_Web/iflux-web-ui/runtime/iflux-href.js` | Modify | Document `navigate` = thin alias Writer |
| `User_Web/iflux-web-ui/runtime/shell-boot.js` | Modify | Cache buster auth + web-ui |
| `User_Web/iflux-web-ui/runtime/auth-login-boot.js` | Modify | Cache buster |
| `User_Web/iflux-web-ui/runtime/auth-register-boot.js` | Modify | Cache buster auth.js |
| `User_Web/iflux-web-ui/runtime/auth-otp-boot.js` | Modify | Cache buster auth.js |
| `User_Web/share/index.html` | Modify | share-feature-boot cache buster |
| `User_Web/account/profile.html` | Modify | account-feature-boot cache buster |

**Không sửa:** `runtime/shell-url-writer.js` zone policy · `share-action-store.js` · Identity Context

---

## P6-API-01 compliance

```text
Internal app navigation → IfluxShellUrlWriter.navigate(canonical, opts)
Href string            → IfluxHref.forCanonical (unchanged)
shellNavigate / IfluxHref.navigate → thin alias Writer only
```

---

## Deploy

| Step | Status |
|------|--------|
| rsync → Production web root | ✅ 2026-07-30 |
| Cloudflare purge | ✅ CF_OK |

---

## Next

→ Step 4 Verification Audit (P6-V-B1…B5 · P6-V-R1…R6)

---

*Phase 6 Step 3 Change List · 2026-07-30*
