# Phase 5 · Step 3 — Implementation Change List

**Date:** 2026-07-29  
**Status:** DONE · deployed Production + purged Cloudflare 2026-07-29  
**Design:** [`11-Phase-05-Implementation-Design-Identity-Context.md`](11-Phase-05-Implementation-Design-Identity-Context.md) ACCEPT  

---

## Change List

| File | Action | Summary |
|------|--------|---------|
| `User_Web/iflux-web-ui/runtime/navigation-context.js` | Modify | +`getActiveOwner()`; export `global.IfluxIdentityContext` cùng file; không thêm state/storage/dependency |
| `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | Modify | xóa `getCodeForIdentityCreation`; `isPathCapturedAttribution()` chỉ còn đọc transport flag |
| `User_Web/iflux-web-ui/auth-register-init.js` | Modify | Register đọc Active Owner qua `IfluxIdentityContext.getActiveOwner()` |
| `User_Web/iflux-web-ui/social-auth/social-login-usecase.js` | Modify | Social flow bỏ AR owner-read; dùng `getActiveOwner()` |
| `User_Web/iflux-web-ui/auth.js` | Modify | Auth referral helper bỏ `getCodeForIdentityCreation`; dùng Active Owner từ Identity Context |
| `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | Modify | LAS bỏ AR owner-read; dùng Active Owner từ Identity Context |

---

## Cleanup delta

| Item | Before | After |
|------|--------|-------|
| `getCodeForIdentityCreation` callers | 4 | **0** |
| `getCodeForIdentityCreation` export | 1 | **0** |
| `identity-context.js` file | 0 | **0** (không tạo) |
| `readActive()` runtime callers ngoài AR | có risk dual-read | **0** |

---

## Gate evidence

| Check | Result |
|------|--------|
| `rg "getCodeForIdentityCreation"` | **0 match** |
| `rg "readActive\\("` | chỉ còn implementation trong `affiliate-resolver.js` |
| `rg "IfluxIdentityContext"` | chỉ implementation + approved callers |
| `ReadLints` các file đổi | **No linter errors** |

---

## Scope note

**Không đụng:** `runtime/pnc-lifecycle.js` · `runtime/shell-url-writer.js` · Writer representation Phase 6.
