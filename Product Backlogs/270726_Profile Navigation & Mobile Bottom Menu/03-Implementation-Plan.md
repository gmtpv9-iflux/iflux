# 03 — Implementation Plan · Profile Navigation & Mobile Bottom Menu

**Date:** 2026-07-27 (rev.3)  
**Status:** **GO — Implementation OPEN**  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.3 **LOCKED**  
**Audit:** [`04-AppShell-BottomMenu-Audit.md`](04-AppShell-BottomMenu-Audit.md)

---

## 0. Entry gate

| Gate | Status |
|------|--------|
| Phase A PASS | ✅ |
| SoT rev.3 (P1–P3 · AC-NAV-01/02 · F3 · UserHub deferred) | ✅ |
| **Slice 1 GO** | ✅ |

---

## Vertical slice order

```text
Slice 1 — Navigation Resolution
        ↓
Slice 2 — Desktop Consumer
        ↓
Slice 3 — Mobile Consumer
        ↓
Slice 4 — Regression
```

---

## Slice 1 — Navigation Resolution

**Mục tiêu:** Resolver + Registry · **UI chưa đổi**.

| # | Task | File | Done when |
|---|------|------|-----------|
| 1.1 | Add `IfluxNavRegistry.accountProfile[]` | `iflux-platform-boot.js` | 5 items · SoT §3 |
| 1.2 | **Account route recognition** (F3) | `IfluxAppShell.activePage()` and/or context | `/tai-khoan` → account context |
| 1.3 | `resolveNavigationContext()` | `IfluxAppShell` | route → context kind |
| 1.4 | `currentNavigationModel()` | `IfluxAppShell` | → `{ modelId: 'accountProfile', … }` on account |
| 1.5 | `resolveNavigationItems(modelId)` | `IfluxAppShell` | → `NavigationItem[]` |
| 1.6 | Dev verify (console) | — | model resolves · **0 UI diff** |

**Exit criterion (LOCKED):**

```text
currentNavigationModel()
        ↓
accountProfile
        ↓
NavigationItem[] (5 items, correct labels)
```

UI unchanged · grep chưa require desktop/mobile consume.

---

## Slice 2 — Desktop Consumer

| # | Task | File |
|---|------|------|
| 2.1 | Hydrate `.ix-profile-tabs` from `resolveNavigationItems('accountProfile')` | `profile.html` + boot |
| 2.2 | Remove hardcoded labels (keep `tabId`) | `account/profile.html` |
| 2.3 | Renderer = generic loop only (AC-NAV-02) | profile boot module |

**Exit:** AC-NAV-01 desktop · AC-NAV-02 PASS on desktop path.

---

## Slice 3 — Mobile Consumer

| # | Task | File |
|---|------|------|
| 3.1 | `renderNavigationItems(items, { surface:'bottom' })` | `iflux-web-ui.js` |
| 3.2 | Wire `currentNavigationModel()` → bottom host | same |
| 3.3 | Tap → `switchTab(tabId)` · sync active | `hub-page.js` hook |
| 3.4 | No hardcoded account labels in renderer (AC-NAV-02) | grep gate |

**Exit:** Mobile `/tai-khoan` bottom = same `NavigationItem[]` · AC-NAV-01 PASS.

---

## Slice 4 — Regression & Navigation Lifecycle Validation

| Check | Expected |
|-------|----------|
| Home / Market / Community | `primary` model · bottom unchanged |
| Entity detail | `context` bottom |
| Article mobile | article IX slot |
| Account desktop + mobile | `accountProfile` |
| Route switching lifecycle | mode correct · 1 tabbar · no duplicate listeners |
| Active state | resolver → bottom sync (URL SoT) |
| Listener leak | `innerHTML=''` idempotent |
| Safe-area | account reuses default host CSS |
| UserHub | **unchanged** (deferred) |
| F5 URL mix | **unchanged** (architecture debt) |

Deliverable: [`05-Implementation-Evidence-Slice4.md`](05-Implementation-Evidence-Slice4.md)

---

## Impact Analysis (CG-005)

```
Feature: accountProfile Navigation Model + NavigationItem renderer
Decision: Modify Registry + AppShell resolver · Desktop/Mobile consumers
Frozen: routes · tab ids · UserHub IA · F5 URLs
Deferred: UserHub consume accountProfile (Different IA)
```

---

## AC mapping

| AC | Slice |
|----|-------|
| AC-NAV-01 | 2 + 3 |
| AC-NAV-02 | 2 + 3 |
| AC-NAV-03 | 3 (reuse host) |
| AC-NAV-04 | 4 |
| AC-NAV-05 | all |

---

*rev.3 — Slice 1 includes F3 account route recognition.*
