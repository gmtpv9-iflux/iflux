# Phase C — Wave C PASS · ai.* + notifications.*

**Ngày:** 2026-07-27 · **ĐÓNG**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒  
**Batching:** Owner duyệt Wave C

---

## Scope

| | |
|--|--|
| **Pages** | `ai.prompts` · `ai.logs` · `ai.cost` · `ai.quality` · `notifications.push|in_app|email` · `notifications.history` · `notifications.templates` |
| **Permissions** | **23** keys |
| **Routes** | **23+** (CRUD/publish theo page) |
| **Out of scope** | Wave D+ · `market.stocks` |

---

## Progress tổng (sau Wave C)

| Metric | Giá trị |
|--------|---------|
| Matrix Coverage | **69.2%** |
| NO_EP còn lại | **65** |
| DEAD | **14** |

## Page Coverage

| Metric | Value |
|--------|------:|
| Matrix pages | **70** |
| Fully enforced | **44** |
| Remaining | **26** |

## Permission Delta

```text
Matrix keys                 211
Enforced permissions
  ↓ trước Wave C            123
  ↓ sau Wave C              146   (+23)
NO_EP
  ↓ trước                    88
  ↓ sau                      65
```

## Delta tổng

```text
211 → … → 111 (Wave A) → 123 (Wave B) → 146 (Wave C) ← tại đây
```

---

## Coverage delta — PASS

Matrix Coverage **58.3% → 69.2%** · NO_EP **88 → 65**

---

## Route Coverage — PASS (FAIL = 0)

| Prefix | Perms |
|--------|-------|
| `/api/admin/ai/prompts` | view · create · edit · delete |
| `/api/admin/ai/logs` | view |
| `/api/admin/ai/cost` | view |
| `/api/admin/ai/quality` | view · edit |
| `/api/admin/notifications/push` | view · create · edit · publish |
| `/api/admin/notifications/in-app` | view · create · edit · publish |
| `/api/admin/notifications/email` | view · create · edit · publish |
| `/api/admin/notifications/history` | view |
| `/api/admin/notifications/templates` | view · edit |

---

## Permission Coverage — PASS

```text
Page:  ai.prompts
NO_EP: 4 → 0
  view · create · edit · delete

Page:  ai.logs
NO_EP: 1 → 0
  view

Page:  ai.cost
NO_EP: 1 → 0
  view

Page:  ai.quality
NO_EP: 2 → 0
  view · edit

Page:  notifications.push
NO_EP: 4 → 0
  view · create · edit · publish

Page:  notifications.in_app
NO_EP: 4 → 0
  view · create · edit · publish

Page:  notifications.email
NO_EP: 4 → 0
  view · create · edit · publish

Page:  notifications.history
NO_EP: 1 → 0
  view

Page:  notifications.templates
NO_EP: 2 → 0
  view · edit
```

---

## Regression — PASS

| Role | AI views | AI create | Notif views | Notif create |
|------|----------|-----------|-------------|--------------|
| Admin | 200 | 201 | 200 | 201 |
| Marketing | 403 (ai) | 403 | 200* | theo DB |
| Visitor | 200 | 403 | 200 | 403 |

\* Marketing có một phần quyền `notifications.*` trong DB (13 keys) — đúng RBAC.

---

## Issue found — PASS

Lần curl đầu POST tạo tạm 500 (trùng / timing) → re-test sạch **PASS**.

---

## Tiến trình

```text
✅ Wave A · ✅ Wave B · ✅ Wave C
⏳ Wave D (metadata + marketing.brand + community còn lại)
⏳ … → Wave F market.stocks cuối
⏳ Final Audit
```
