# 05 — Implementation Evidence · Slice 1 (Navigation Resolution)

**Date:** 2026-07-27  
**Status:** **PASS — Slice 1** (Owner sign-off pending immutability + unified API evidence)  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.3  
**Plan:** [`03-Implementation-Plan.md`](03-Implementation-Plan.md) § Slice 1  
**Evidence rev:** 2

---

## 1. Scope delivered

| DoD item | Status | Evidence |
|----------|--------|----------|
| Account route recognition | ✅ | `activePage()` → `'account'` on `/tai-khoan` · `isAccountProfileRoute()` |
| `resolveNavigationContext()` | ✅ | `kind: 'account' \| 'entity' \| 'app'` |
| `currentNavigationModel()` → `accountProfile` | ✅ | On `/tai-khoan` own profile |
| `resolveNavigationItems()` → `NavigationItem[]` | ✅ | All models · §4 + §5 |
| Registry `accountProfile` | ✅ | 5 items · SoT §3 labels locked |
| UI unchanged | ✅ | **Only** `iflux-platform-boot.js` + cache bust `shell-boot.js` |
| Primary / Context / Article no regress | ✅ | §3 |

---

## 2. Files changed

| File | Change |
|------|--------|
| `User_Web/iflux-web-ui/iflux-platform-boot.js` | Registry `accountProfile` · resolver pipeline · AppShell APIs |
| `User_Web/iflux-web-ui/runtime/shell-boot.js` | Cache bust `navSlice1_20260727` |

**Not touched (Slice 2/3):** `profile.html` · `iflux-web-ui.js` · `hub-page.js`

---

## 3. Resolver regression (Exit Gate)

| Model | Verify | Expected |
|-------|--------|----------|
| **primary** | `resolveNavigationItems('primary')` vs `getPrimaryNav()` | Same `key, label, href, active, icon` (tabId `''`) |
| **context** | `resolveNavigationItems('context', ctx)` vs `getContextNav(entityType)` | Same keys/labels/active |
| **article** | `/cong-dong/bai-viet/…` | `entityType === 'communityPost'` · 3 tabs Thích/Bình luận/Chia sẻ |

---

## 4. Immutability evidence (Owner audit)

### 4.1 Implementation (code — không chỉ freeze array)

```692:701:User_Web/iflux-web-ui/iflux-platform-boot.js
  function freezeNavItem(item) {
    return Object.freeze({
      key: item.key,
      label: item.label,
      href: item.href != null ? item.href : '',
      active: !!item.active,
      icon: item.icon || '',
      tabId: item.tabId || ''
    });
  }
```

```937:937:User_Web/iflux-web-ui/iflux-platform-boot.js
    return Object.freeze(items);
```

**Contract:** mỗi item qua `freezeNavItem()` → `Object.freeze` **trước** khi đưa vào array; array cuối cùng cũng `Object.freeze`.

`currentNavigationModel()` return object cũng frozen (modelId + context + items).

### 4.2 Automated audit (Production file · Node VM · 2026-07-27)

File audited: `/var/www/iflux/production/User_Web/iflux-web-ui/iflux-platform-boot.js`

| Check | `Object.isFrozen(items)` | `Object.isFrozen(items[0])` | Count |
|-------|--------------------------|-----------------------------|-------|
| `accountProfile` via `currentNavigationModel()` | **true** | **true** | 5 |
| `resolveNavigationItems('primary')` | **true** | **true** | 4 (guest) |
| `resolveNavigationItems('context')` stock | **true** | **true** | 5 |
| article (`communityPost`) | **true** | **true** | 3 |

**Mutation guard:**

| Action | Result |
|--------|--------|
| `items.push({…})` on frozen array | `TypeError: Cannot add property … object is not extensible` |
| `items[0].label = 'HACK'` on frozen item | Value **unchanged** (`Timeline` → `Timeline`) |

### 4.3 Console verify (browser · https://iflux.vn/tai-khoan)

```javascript
const items = IfluxAppShell.currentNavigationModel().items;

Object.isFrozen(items);      // true
Object.isFrozen(items[0]);   // true

items.push({ key: 'hack' });           // TypeError (strict) hoặc length unchanged
items[0].label = 'HACK';               // label vẫn 'Timeline'
```

---

## 5. Unified API — all models return `NavigationItem[]`

Mọi model id đều qua **cùng một** `resolveNavigationItems(modelId, ctx?)` và trả về cùng contract:

```javascript
{ key, label, href, active, icon, tabId }
```

| Call | Route (test) | Count | Shape |
|------|--------------|-------|-------|
| `resolveNavigationItems('primary')` | `/thi-truong` | 4 (guest) / 5 (logged in) | ✅ 6 keys · frozen |
| `resolveNavigationItems('context', ctx)` | `/co-phieu/HPG` | 5 | ✅ 6 keys · frozen |
| `resolveNavigationItems('accountProfile', ctx)` | `/tai-khoan` | 5 | ✅ 6 keys · frozen |
| `currentNavigationModel().items` | auto model | per route | ✅ same pipeline |

### Console verify

**Primary** (https://iflux.vn/thi-truong):

```javascript
const p = IfluxAppShell.resolveNavigationItems('primary');
Object.isFrozen(p) && Object.isFrozen(p[0]);  // true, true
p[0]; // { key, label, href, active, icon, tabId: '' }
```

**Context** (entity detail, e.g. stock):

```javascript
const ctx = IfluxAppShell.resolveNavigationContext();
const c = IfluxAppShell.resolveNavigationItems('context', ctx);
Object.isFrozen(c) && Object.isFrozen(c[0]);  // true, true
c.map(i => i.key);  // ['news','info','trading','events','comments'] on stock
```

**Account** (https://iflux.vn/tai-khoan):

```javascript
IfluxAppShell.currentNavigationModel().modelId;  // 'accountProfile'
IfluxAppShell.currentNavigationModel().items.map(i => i.label);
// ['Timeline','Affiliate','Liên kết thẻ','Riêng tư','Mật khẩu']
```

---

## 6. UI unchanged criterion

Slice 1 adds **resolver APIs only**. Renderers still call `getPrimaryNav()` / `getContextNav()` / existing `syncMobileTabbar()` branches.

Screenshot before/after → **identical** (no DOM/CSS/text/active/click changes).

---

## 7. Owner notes applied

| Note | Implementation |
|------|----------------|
| Immutable `NavigationItem[]` | `freezeNavItem` + `Object.freeze(items)` — **array và từng object đều frozen** |
| Model not tied to renderer | `modelIdForContext(ctx)` from `resolveNavigationContext()` only |
| No AppShell refactor | `getNavMode()` · `getPrimaryNav()` · `getContextNav()` **unchanged** |
| Branch primary/context/article preserved | Article = `context` + `communityPost` entity (AS-IS) |

---

## 8. Slice 1 sign-off

```
Slice 1 — Navigation Resolution
Status: PASS (evidence rev.2)
Gate:   Immutability ✅ · Unified API ✅ · UI unchanged ✅ · Regression ✅
Next:   Slice 2 — Desktop Consumer (Owner GO after sign-off)
```

### Slice 2 guard (preview — not in scope Slice 1)

```
Navigation Registry → resolveNavigationItems() → Desktop Tabs render
```

**Cấm** sửa label trực tiếp trong HTML; mục tiêu Slice 2 là **xóa hardcode**, consume `NavigationItem[]`.

---

*Evidence rev.2 — 2026-07-27*
