# Phase 7 · Step 3 — Implementation Change List

**Date:** 2026-07-30  
**Status:** DONE · deployed Production + purged Cloudflare (see §Deploy)  
**Design:** [`35-Phase-07-Implementation-Design-Share-Boundary.md`](35-Phase-07-Implementation-Design-Share-Boundary.md) ✅ **ACCEPT / PASS**  
**Locks:** P7-DQ-01 · **02=A Self** · **03=A no Writer** · Brief §6B Native Share Sheet · P7-API-01 `executeShare`  
**Business Goal:** Logged-in → Native Share Sheet → Self URL `/IFL{Self}/…`

**Cache buster:** `?v=p7ShareSheet20260730`

---

## Change List

| File | Action | Summary |
|------|--------|---------|
| `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` | Modify | Self-only `getOutgoingAffiliateRef`; `resolveShareRef` ignore foreign ref; Guest / no Self → `SHARE_LOGIN_REQUIRED` trên `buildShareUrl` / affiliate path |
| `Admin_Design_system/iflux-admin-ui/foundation/share-action.js` | Modify | `requireShareLogin` · `shareViaNativeSheet` · **`executeShare`** (P7-API-01); Sheet-first rồi copy/Insight fallback; **không** gọi Writer |
| `User_Web/iflux-web-ui/interaction/permission.js` | Modify | Guest `share_url` → **LoginRequired** (P7-DQ-01; supersedes Guest Allow cũ) |
| `User_Web/iflux-web-ui/interaction/catalog/index.js` | Modify | `handleShareUrlClick` → Login + `executeShare`; cache Foundation `p7ShareSheet20260730` |
| `User_Web/iflux-web-ui/iflux-web-ui.js` | Modify | Lazy Share click: Guest → `requireAuth`; load Foundation `p7ShareSheet20260730` |
| `User_Web/iflux-web-ui/interaction/boot.js` | Modify | Share store cache buster |
| `User_Web/iflux-web-ui/runtime/share-feature-boot.js` | Modify | Share store cache buster |
| `User_Web/iflux-web-ui/runtime/shell-boot.js` | Modify | `iflux-web-ui.js?v=p7ShareSheet20260730` |
| `User_Web/iflux-web-ui/insight-share-store.js` | Modify | Stub → Foundation store `p7ShareSheet20260730` |
| `User_Web/iflux-web-ui/insight-share-ui.js` | Modify | Stub → Foundation `share-action.js?v=p7ShareSheet20260730` |

**Không sửa:** `runtime/shell-url-writer.js` · Identity Context · Program Gate / §6A · Attribution / Phase 8+

---

## P7-API-01 / Boundary compliance

```text
Share entry     → IfluxShareAction.executeShare (primary)
Native Sheet    → navigator.share({ url: Self Owner URL })
Guest           → LoginRequired / requireAuth — không emit Share artifact
Self only       → getOutgoingAffiliateRef = Auth.referral_code
≠ Writer        → Share không gọi IfluxShellUrlWriter.navigate
```

---

## Deploy

| Step | Status |
|------|--------|
| rsync → Production web root | ✅ 2026-07-30 |
| Cloudflare purge | ✅ CF_OK |

---

## Next

→ Step 4 Verification Audit ✅ [`37-Phase-07-Step4-Verification-Audit.md`](37-Phase-07-Step4-Verification-Audit.md)  
→ Step 5 Phase Acceptance (khi Owner mở)

---

*Phase 7 Step 3 Change List · 2026-07-30*
