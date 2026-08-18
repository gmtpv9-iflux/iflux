# Phase C — NO_EP-2 PASS · `users.list`

**Ngày:** 2026-07-26 · **ĐÓNG**  
**Kế hoạch:** [`PhaseC-NOEP2-Plan.md`](./PhaseC-NOEP2-Plan.md)  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒

---

## Scope

| | |
|--|--|
| **Page** | `users.list` |
| **Permissions** | `view` · `create` · `edit` · `export` · `grant_premium` · `reset_password` |
| **Routes** | **7** |
| **Out of scope** | `subscription.*` · `community.*` · `market.*` · `stories.*` · `users.detail` / `users.subscription` · mọi page khác |

---

## Progress tổng (sau C2)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **31.8%** |
| NO_EP còn lại | **144** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **11** |
| Remaining | **59** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước C2                 62
  ↓ sau C2                   67   (+5)
NO_EP
  ↓ trước                   149
  ↓ sau                     144
```

## Delta tổng

```text
211 keys → 56 (A/B) → 62 (C1) → 67 (C2) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **29.4% → 31.8%** · NO_EP **149 → 144**

---

## Route Coverage — PASS

| Module | Routes | FAIL |
|--------|-------:|-----:|
| `users.list` | **7** | **0** |

---

## Permission Coverage — PASS

**NO_EP cụm: 5 → 0** · 6/6 key page enforce (`view` từ trước).

---

## Regression — PASS

| Role | Export | Grant Premium | Reset Password | Edit |
|------|--------|---------------|----------------|------|
| Admin | 200 | 200 | 200 | 200 |
| Marketing | 200 | 200 | 403 | 200 |
| Visitor | 403 | 403 | 403 | 403 |

---

## Issue found — PASS

**Không.**

---

Cụm Danh sách người dùng. Backlog: [`Audit-NOEP-DEAD-List.md`](./Audit-NOEP-DEAD-List.md).
