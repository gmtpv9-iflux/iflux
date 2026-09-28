# DS Single Authority — implement W0–W5

**Plan:** [`43_ds_single_authority_plan.md`](43_ds_single_authority_plan.md)  
**SoT đã amend:** [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)  
**README:** [`design_system/README.md`](../../../../../../../design_system/README.md) — **không sửa**

```
THIRD_PARTY_INSIDE_DESIGN_SYSTEM        = 0
NON_AUTHORITY_FILE_INSIDE_DESIGN_SYSTEM = 0
README_AMEND_REQUIRED                   = NO
SOT_CANONICAL_UI_AMEND_REQUIRED         = NO (đã amend)
NUMBERED_HIERARCHY                      = FULL
READY_FOR_IMPLEMENTATION                = DONE (local)
CHAT_COVERAGE_42                        = 95% — chưa thuộc wave này
```

`design_system/` chỉ còn `README.md` + `01_tokens` … `05_widgets`.  
Tabler = `/vendor/tabler/`. Tooling = `/ui_tooling/`. Theme boot = `/adapters/web/theme.js`.  
`design_system/index.html` đã xóa. Nginx `/design_system/` → `/ui_tooling/workbench/`.

Chưa push Staging. Chưa chạy Chat mapping 42 (W6).
