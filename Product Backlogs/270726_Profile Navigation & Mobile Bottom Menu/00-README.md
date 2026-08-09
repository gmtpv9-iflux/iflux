# 00 — README · Profile Navigation & Mobile Bottom Menu

**Date:** 2026-07-27 (rev.3)  
**Folder:** `docs/Product Backlog/270726_Profile Navigation & Mobile Bottom Menu/`

---

## Trạng thái

| Item | Status |
|------|--------|
| Phase A Discovery | ✅ PASS |
| SoT rev.3 | ✅ **LOCKED** |
| Slice 1 Navigation Resolution | ✅ **PASS** |
| Slice 2 Desktop Consumer | ✅ **PASS** |
| Slice 3 Mobile Consumer | 🔄 **PASS rev.2** (IA completion) |
| Slice 4 Regression & Lifecycle | ⏳ Pending Owner sign-off |

---

## Danh mục

| # | File |
|---|------|
| 00 | [`00-README.md`](00-README.md) |
| 01 | [`01-Solution.md`](01-Solution.md) rev.3 |
| 02 | [`02-SoT.md`](02-SoT.md) rev.3 **LOCKED** |
| 03 | [`03-Implementation-Plan.md`](03-Implementation-Plan.md) rev.3 |
| 04 | [`04-AppShell-BottomMenu-Audit.md`](04-AppShell-BottomMenu-Audit.md) |
| 05 | Slice 1–4: [`05-Implementation-Evidence-Slice1.md`](05-Implementation-Evidence-Slice1.md) · [Slice2](05-Implementation-Evidence-Slice2.md) · [Slice3](05-Implementation-Evidence-Slice3.md) · [Slice4](05-Implementation-Evidence-Slice4.md) |

---

## Owner lock (rev.3)

1. **Model ≠ Registry** — Model là khái niệm · Registry là storage.
2. **F3** account route recognition = **Slice 1 prerequisite**.
3. **AC-NAV-02** — renderer chỉ `NavigationItem[]`.
4. **UserHub** — Deferred · Different IA.
5. **F5** — LOW architecture debt · out of scope.

---

## Slice order

```
Navigation Resolution → Desktop Consumer → Mobile Consumer → Regression
```

---

*Slice 3 IA completion deployed — Slice 4 validation pending.*
