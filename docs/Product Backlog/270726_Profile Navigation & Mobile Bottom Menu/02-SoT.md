# 02 — SoT · Profile Navigation & Mobile Bottom Menu

**Date:** 2026-07-27 (rev.4 — Owner mobile IA)  
**Status:** **LOCKED — Owner 2026-07-27**  
**Prerequisite:** [`04-AppShell-BottomMenu-Audit.md`](04-AppShell-BottomMenu-Audit.md) — Phase A **PASS**  
**Solution:** [`01-Solution.md`](01-Solution.md)

---

## 0. Owner lock — nguyên tắc bắt buộc

| # | Nguyên tắc | Status |
|---|------------|--------|
| **P1** | **Navigation Model** (khái niệm) chọn qua context — AppShell render theo model, không `if (home) if (account)` | ✅ LOCKED |
| **P2** | Desktop Tabs + Mobile Bottom **consume cùng một model definition** (qua Registry) | ✅ LOCKED · AC-NAV-01 |
| **P3** | Renderer chỉ consume **`NavigationItem[]`** — không business labels trong renderer | ✅ LOCKED · AC-NAV-02 |

---

## 1. Pipeline kiến trúc (LOCKED)

```text
Route
  ↓
Navigation Context        ← route + page state → context kind
  ↓
Navigation Model          ← KHÁI NIỆM: model id được chọn (accountProfile · primary · …)
  ↓
Navigation Registry       ← NƠI LƯU definition (hôm nay: IfluxNavRegistry · mai: API/manifest)
  ↓
AppShell resolver         ← currentNavigationModel() → NavigationItem[]
  ↓
AppShell Renderer         ← Header · Bottom Tabbar · Desktop Tabs
```

### 1.1 Phân tách Model vs Registry

| Khái niệm | Vai trò | Đổi được? |
|-----------|---------|-----------|
| **Navigation Model** | Id logic · contract resolver (`accountProfile`, `primary`, …) | SoT ổn định |
| **Navigation Registry** | Storage của definition arrays | Có thể đổi sang API/manifest — SoT không đổi |
| **NavigationItem** | Output resolved cho renderer | `{ key, label, icon, tabId, active, href, … }` |

**Renderer không biết** “Timeline”, “Affiliate”, “Mật khẩu” — chỉ loop `NavigationItem[]`.

---

## 2. Model catalog (task này)

| Model id (khái niệm) | Registry key (AS-IS) | Context trigger |
|----------------------|----------------------|-----------------|
| `primary` | `IfluxNavRegistry.primary` | App zone default |
| `context` | `IfluxNavRegistry.context[entityType]` | Entity detail |
| `accountProfile` | `IfluxNavRegistry.accountProfile` | `/tai-khoan` · own profile |
| *(future)* `membership` | TBD | route membership |

### 2.1 AS-IS code (không refactor toàn bộ trong task)

Branch `getNavMode()` + `if primary/context/article` giữ nguyên.  
Task này thêm **`accountProfile`** qua pipeline mới; wrapper map tạm sang renderer cũ được phép.

---

## 3. Registry definition — `accountProfile` (LOCKED)

```javascript
// IfluxNavRegistry.accountProfile — single SoT for labels + structure
accountProfile: [
  { key: 'timeline',  tabId: 'tab-timeline',  label: 'Timeline',     icon: 'ti-timeline' },
  { key: 'affiliate', tabId: 'tab-affiliate', label: 'Affiliate',    icon: 'ti-affiliate',    ownOnly: true },
  { key: 'payment',   tabId: 'tab-payment',   label: 'Liên kết thẻ', icon: 'ti-credit-card',  ownOnly: true },
  { key: 'privacy',   tabId: 'tab-privacy',   label: 'Riêng tư',     icon: 'ti-shield-lock',  ownOnly: true },
  { key: 'security',  tabId: 'tab-security',  label: 'Mật khẩu',     icon: 'ti-lock',         ownOnly: true }
]
```

| Field | Rule |
|-------|------|
| `tabId` | Giữ — map `data-ix-profile-tab` |
| `label` | Single SoT — desktop + mobile |
| Route / path | **Frozen** — không đổi trong task |

---

## 4. Acceptance Criteria

### AC-NAV-01 — Single model definition (Owner LOCKED)

Desktop Tabs và Mobile Bottom consume **cùng Registry definition** `accountProfile`.

| Desktop | Mobile |
|---------|--------|
| Timeline | Timeline |
| Affiliate | Affiliate |
| Liên kết thẻ | Liên kết thẻ |
| Riêng tư | Riêng tư |
| Mật khẩu | Mật khẩu |

**Cấm:** hai danh sách khai báo độc lập.

### AC-NAV-02 — Renderer agnostic (Owner LOCKED)

AppShell renderer **không được** hardcode business labels (`Timeline`, `Affiliate`, `Mật khẩu`, …).

Renderer chỉ:

```javascript
renderNavigationItems(items: NavigationItem[], surface)
```

Business knowledge nằm trong **Registry + resolver** only.

### AC-NAV-03 — Single bottom host

Chỉ `#ifx-mobile-tabbar`.

### AC-NAV-04 — Regression existing navigation

Primary · Context · Article bottom — không regress.

### AC-NAV-05 — Route frozen

Tab ids · `/tai-khoan` · panel ids — không đổi trong Phase 1.

### AC-NAV-06 — Mobile bottom thay tab (Owner rev.4 · Slice 3 completion)

Khi `currentNavigationModel().modelId === 'accountProfile'` và viewport **`≤1023.98px`**:

| Rule | Status |
|------|--------|
| Ẩn `.ix-profile-tabs` / `[data-ifx-account-profile-tabs]` | ✅ LOCKED |
| Bottom Navigation = **consumer duy nhất** của `NavigationItem[]` trên mobile | ✅ LOCKED |
| Không proxy-click tab desktop ẩn — `IfluxAccountProfileNav.switchTab(tabId)` | ✅ LOCKED |
| Panel content giữ nguyên · `switchTab` / URL `?tab=` SoT active | ✅ LOCKED |
| Sidebar (`.ix-profile-sidebar`) **chỉ** trên Timeline mobile | ✅ LOCKED |
| Desktop tabs **không đổi** | ✅ LOCKED |

**Interaction model (cùng Registry · UX khác):**

```text
Desktop:  NavigationItem[] → Desktop Tabs → switchTab (panels)
Mobile:   NavigationItem[] → Bottom Nav → switchTab (panels) · không tab row
```

**Phase 2 (deferred):** mỗi mục → route riêng (`/tai-khoan/affiliate`, …) · `NavigationItem.href` · deep link.

---

## 5. Consumer chain (target)

```text
Navigation Registry (accountProfile)
        ↓
Desktop Tabs
        ↓
Mobile Bottom
        ↓
UserHub drawer          ← ideal: cùng definition
```

### UserHub — Deferred

| Item | Status |
|------|--------|
| UserHub consume `accountProfile` | **Deferred** |
| Reason | **Different IA** — drawer nhóm Membership / Bảo mật & Quyền riêng tư, không phải tab bar 1:1 |
| Rule | **Cấm** copy label thủ công — khi mở phase sau phải consume Registry hoặc shared resolver |

*(Audit F4 — label drift risk)*

---

## 6. Slice 1 prerequisite — F3 (LOCKED)

`activePage()` **không** nhận diện account route = **blocker**, không phải finding phụ.

Slice 1 **bắt buộc** gồm:

| Deliverable | Mục tiêu |
|-------------|----------|
| Account route recognition | `activePage()` hoặc context resolver nhận `/tai-khoan` |
| `resolveNavigationContext()` | route → context |
| `currentNavigationModel()` | → `accountProfile` on account route |
| Registry `accountProfile[]` | definition |
| `resolveNavigationItems(modelId)` | → `NavigationItem[]` |

**Exit Slice 1 (UI unchanged):**

```text
currentNavigationModel()  →  { modelId: 'accountProfile', items: NavigationItem[] }
```

Console/dev verify PASS · **0** UI diff.

---

## 7. Ownership

| Layer | Owner |
|-------|-------|
| Registry definitions | `IfluxNavRegistry` (implementation of Navigation Registry) |
| Model selection | `IfluxAppShell.currentNavigationModel()` |
| Item resolution | `IfluxAppShell.resolveNavigationItems()` |
| Renderers | `iflux-web-ui.js` · profile boot — **NavigationItem[] only** |
| Profile content | Page `/tai-khoan` |

---

## 8. Architecture debt (documented · không sửa task)

| ID | Severity | Item |
|----|----------|------|
| F5 | **LOW** | UserHub href mix `/tai-khoan` vs `/account/*` — URL consistency debt |

---

## 9. Frozen

| ❌ Cấm |
|--------|
| Renderer hardcode tab labels (AC-NAV-02) |
| Dual list desktop/mobile (AC-NAV-01) |
| Second bottom `<nav>` |
| Fix F5 URL mix trong task này |
| Refactor toàn primary/context → model (backlog) |

---

## 10. Owner decisions

| ID | Decision | Date |
|----|----------|------|
| P1–P3 | Model / Registry split · AC-NAV-01 · AC-NAV-02 | ✅ 2026-07-27 |
| F3 in Slice 1 | Account route recognition = prerequisite | ✅ 2026-07-27 |
| UserHub | Deferred · Different IA | ✅ 2026-07-27 |
| F5 | LOW architecture debt · out of scope | ✅ 2026-07-27 |

---

*SoT rev.3 LOCKED — sẵn sàng Slice 1 Navigation Resolution.*
