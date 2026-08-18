# 05 — Implementation Evidence · Slice 3 (Mobile Consumer) — rev.2

**Date:** 2026-07-27  
**Status:** **PASS — Slice 3 completion (Owner IA rev.4)**  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.4 · AC-NAV-01 · AC-NAV-02 · AC-NAV-03 · **AC-NAV-06**

---

## 1. Owner correction — mobile IA (không phải bug kỹ thuật)

Trước rev.2: tab row + bottom menu **trùng chức năng** trên mobile.

Sau rev.2 (Phase 1):

```text
Desktop:  Header → Tabs → Content (+ sidebar)
Mobile:   Header → Content (+ sidebar chỉ Timeline) → Bottom Nav
```

**Cấm:** `NavigationItem[] → Desktop Tabs → Bottom` cùng hiện trên mobile.

---

## 2. Implementation

| Item | File |
|------|------|
| Mobile không hydrate tab row | `account-feature-boot.js` · `renderAccountProfileTabs()` |
| Ẩn tab row CSS backup | `profile.css` · `[data-ifx-account-profile]` |
| Bottom → `IfluxAccountProfileNav.switchTab()` | `iflux-web-ui.js` · `renderTabbar` account mode |
| Sidebar Timeline-only mobile | `syncAccountMobileLayout()` + CSS `[data-ifx-account-view="sub"]` |
| URL/active SoT | `syncAccountProfileTabUrl` + resolver |

**API:**

```javascript
IfluxAccountProfileNav.switchTab(tabId);  // URL + panel + layout + bottom sync
IfluxAccountProfileNav.isMobileNav();     // width ≤ 1023.98
```

---

## 3. AC-NAV-06 verify (mobile · https://iflux.vn/tai-khoan)

```javascript
window.innerWidth <= 1023; // DevTools mobile

document.querySelector('[data-ifx-account-profile-tabs]').children.length;
// → 0 (không hydrate tab buttons)

getComputedStyle(document.querySelector('[data-ifx-account-profile-tabs]')).display;
// → 'none'

document.getElementById('ifx-mobile-tabbar').getAttribute('data-ifx-tabbar-mode');
// → 'account'

// Affiliate: sidebar ẩn
IfluxAccountProfileNav.switchTab('tab-affiliate');
document.querySelector('.ix-profile-sidebar').hidden; // true

// Timeline: sidebar hiện
IfluxAccountProfileNav.switchTab('tab-timeline');
document.querySelector('.ix-profile-sidebar').hidden; // false
```

Desktop (>1024px): tab row hiện · bottom mode primary/context khác trang.

---

## 4. Phase 2 deferred (Owner)

Route-per-destination (`/tai-khoan/affiliate`, …) · `NavigationItem.href` · deep link — **chưa implement**.

Phase 1 dùng `?tab=` + panel switch (đủ refresh/bookmark cơ bản).

---

## 5. Slice 3 sign-off

```
Slice 3 — Mobile Consumer (completion)
Status: PASS rev.2
Next:   Slice 4 — Regression & Navigation Lifecycle Validation
```

---

*Evidence Slice 3 rev.2 — 2026-07-27*
