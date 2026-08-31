# Plan 43 vs README — compliance 44 (Owner accepted, có điều kiện)

**Plan đã khóa:** [`43_ds_single_authority_plan.md`](43_ds_single_authority_plan.md)  
**README:** [`design_system/README.md`](../../../../../../../design_system/README.md) — **không amend**

```
COMPLIANCE_44                         = ACCEPTED
THIRD_PARTY_INSIDE_DESIGN_SYSTEM      = 0
NON_AUTHORITY_FILE_INSIDE_DESIGN_SYSTEM = 0
README_AMEND_REQUIRED                 = NO
SOT_CANONICAL_UI_AMEND_REQUIRED       = YES
NUMBERED_HIERARCHY                    = FULL
READY_FOR_IMPLEMENTATION              = YES
```

---

## Điều kiện Owner (đã đưa vào plan 43)

- README đúng target → không amend.  
- Chỉ amend `docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`.  
- Coverage 95% Chat = gap task 42, không phải restructure.  
- `design_system/index.html` **xóa**. Redirect `/design_system/` = nginx/router ngoài DS.  
- Numbering **full** subfolder.  
- Tabler source → `/vendor/tabler/`. Không `02_foundation/02_icons/01_vendor/01_tabler/`.  
- `02_icons/icons.css` = contract iFlux `.ifx-icon*` ; Foundation consume `/vendor/tabler/`.

---

STOP. Chưa implement.
