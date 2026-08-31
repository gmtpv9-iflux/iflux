# User Profile — Legacy clone 100%

**Date:** 2026-08-31  
**Source:** `464b0d3` isolate (sau forensic clone `b0e182d`, trước Canonical apply)  
**Dest:** `patterns/user-profile/`  
**DS:** không đụng `01`–`05`

| File | Hash = `464b0d3` |
|---|---|
| `index.html` | `84d821b` |
| `user-profile.css` | `8e120a8` |
| `user-profile.js` | `e0d789c` |

Markup `.ix-profile-grid` → modal = Admin Legacy; khác duy nhất AppShell wrapper (`</main>`…).  
0 `.ifx-*`. 0 link `design_system/`. Edit modal giữ. Tabs / open-close modal PASS.

```
LEGACY_CLONE_VISUAL_DELTA   = 0
LEGACY_CLONE_BEHAVIOR_DELTA = 0
DESIGN_SYSTEM_TOUCHED       = 0
```

Chưa migration. Nghiệm thu: [https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=user-profile](https://staging.iflux.vn/ui_tooling/workbench/?area=patterns&pattern=user-profile)
