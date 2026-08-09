# 05 — Implementation Evidence · Slice 2 (Desktop Consumer)

**Date:** 2026-07-27  
**Status:** **PASS — Slice 2**  
**Prerequisite:** Slice 1 PASS · [`05-Implementation-Evidence-Slice1.md`](05-Implementation-Evidence-Slice1.md) rev.2  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.3 §3 · AC-NAV-01 · AC-NAV-02

---

## 1. Scope

| Task | File | Status |
|------|------|--------|
| 2.1 Hydrate `.ix-profile-tabs` from resolver | `account/profile.html` + `account-feature-boot.js` | ✅ |
| 2.2 Remove hardcoded tab labels | `account/profile.html` | ✅ |
| 2.3 Generic renderer loop (AC-NAV-02) | `account-feature-boot.js` | ✅ |

**Out of scope:** mobile bottom (Slice 3) · UserHub · `profile-panels.html` (hub IA)

---

## 2. Consumer chain (desktop)

```text
IfluxNavRegistry.accountProfile
        ↓
IfluxAppShell.resolveNavigationItems('accountProfile', ctx)
        ↓
renderAccountProfileTabs()  — account-feature-boot.js
        ↓
[data-ifx-account-profile-tabs] → <button data-ix-profile-tab="…">
        ↓
PatternUserProfile.init() — existing click/panel wiring (unchanged)
```

---

## 3. AC mapping

### AC-NAV-01 — Single model definition (desktop path)

Desktop tabs on `/tai-khoan` consume **same Registry** as resolver:

| Registry label | Rendered tab |
|----------------|--------------|
| Timeline | Timeline |
| Affiliate | Affiliate |
| Liên kết thẻ | Liên kết thẻ |
| Riêng tư | Riêng tư |
| Mật khẩu | Mật khẩu |

*(Replaces legacy hardcoded: "Tài khoản thanh toán" / "Quyền riêng tư" / "Bảo mật" — intentional SoT §3 alignment.)*

### AC-NAV-02 — Renderer agnostic

`renderAccountProfileTabs()` **only** reads `NavigationItem[]`:

- `it.tabId` → `data-ix-profile-tab`
- `it.label` → text node
- `it.icon` → `<i class="ti …">`
- `it.active` → `.active` class

**No** business label strings in renderer source.

---

## 4. Files changed

| File | Change |
|------|--------|
| `User_Web/account/profile.html` | Empty mount `[data-ifx-account-profile-tabs]` · cache bust |
| `User_Web/iflux-web-ui/runtime/account-feature-boot.js` | `renderAccountProfileTabs()` · call before ProfileView init |

**Unchanged:** tab panels (`#tab-timeline` …) · `PatternUserProfile` · `profile-view.js` · mobile tabbar

### Idempotent hydrate

`renderAccountProfileTabs()` gọi **`mount.replaceChildren()`** trước khi render — mỗi lần chạy **thay thế toàn bộ** nội dung mount, không append.

| Rủi ro | Cách xử lý |
|--------|------------|
| Duplicate DOM | `replaceChildren()` xóa hết node cũ |
| Duplicate listener trên tab desktop | Listener gắn bởi `PatternUserProfile.init()` — gọi **một lần** sau hydrate (boot order: render → ProfileView → PatternUserProfile) |
| Re-hydrate SPA / partial reload | Gọi lại `renderAccountProfileTabs()` an toàn về DOM; nếu cần re-bind click → phải gọi lại `PatternUserProfile.init()` (hiện boot một lần / full page) |

---

## 5. Verify (Production · https://iflux.vn/tai-khoan)

```javascript
// Labels from Registry (not HTML)
[...document.querySelectorAll('[data-ifx-account-profile-tabs] .ix-profile-tab')]
  .map(b => b.textContent.trim());
// → ['Timeline','Affiliate','Liên kết thẻ','Riêng tư','Mật khẩu']

// Matches resolver
IfluxAppShell.resolveNavigationItems('accountProfile', IfluxAppShell.resolveNavigationContext())
  .map(i => i.label);
// → same array
```

**Guest / other profile** (`?user=<otherId>`): only Timeline tab rendered (resolver `ownOnly` filter).

---

## 6. Slice 2 sign-off

```
Slice 2 — Desktop Consumer
Status: PASS
Next:   Slice 3 — Mobile Consumer
```

---

*Evidence Slice 2 — 2026-07-27*
