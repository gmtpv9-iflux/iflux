# 01 — Solution · Profile Navigation & Mobile Bottom Menu

**Date:** 2026-07-27 (rev.3)  
**Status:** **APPROVED — Slice 1 GO**  
**SoT:** [`02-SoT.md`](02-SoT.md) rev.3 **LOCKED**

---

## 1. Pipeline (LOCKED)

```text
Route → Navigation Context → Navigation Model → Navigation Registry → AppShell → Renderers
```

- **Model** = khái niệm (`accountProfile`)
- **Registry** = nơi lưu definition (có thể đổi sang API sau)
- **Renderer** = chỉ `NavigationItem[]` (AC-NAV-02)

---

## 2. Vertical slice

| Slice | Name |
|-------|------|
| 1 | **Navigation Resolution** — Registry + F3 route + `currentNavigationModel()` · UI unchanged |
| 2 | **Desktop Consumer** |
| 3 | **Mobile Consumer** — bottom thay tab · AC-NAV-06 |
| 4 | **Regression** |

---

## 3. AC summary

| AC | Rule |
|----|------|
| AC-NAV-01 | Desktop + Mobile cùng Registry definition |
| AC-NAV-02 | Renderer không hardcode business labels |
| AC-NAV-03 | Single bottom host |
| AC-NAV-04 | No regress primary/context/article |
| AC-NAV-05 | Routes/tab ids frozen (Phase 1 · `?tab=`) |
| AC-NAV-06 | Mobile bottom thay tab row · sidebar Timeline-only |

---

## 4. Deferred

| Item | Reason |
|------|--------|
| UserHub consume `accountProfile` | Different IA |
| F5 URL `/tai-khoan` vs `/account/*` | Architecture debt · LOW |

---

*rev.3 — aligned Owner pre-Slice-1 review.*
