# POST-DEPLOY + FINAL architecture lock

**Date:** 2026-08-28  
**Commit deployed:** `fc4b3cf`  
**Mode:** Phase 11 smoke/regression only → Phase 12 lock  
**Không:** sửa architecture · rebuild Chat · canonicalize Auth · sửa User Profile visual

SoT: [`docs/SoT — Canonical UI Architecture (Design System ↔ Pattern).md`](../../../../../../../docs/SoT%20—%20Canonical%20UI%20Architecture%20(Design%20System%20↔%20Pattern).md)  
Plan: [`31_ds_pattern_separation_plan.md`](31_ds_pattern_separation_plan.md)  
PRE-SHIP: [`32_pre_ship_report.md`](32_pre_ship_report.md)

```
PRE_SHIP = PASS
POST_DEPLOY = PASS
ARCHITECTURE_LOCK = PASS
ARCHITECTURE_READY_FOR_CHAT_REBUILD = YES
```

---

## Phase 11 evidence

| Check | Result |
|---|---|
| `/patterns/user-profile/` | 200 |
| `/patterns/auth/login.html` | 200 |
| Catalog: auth, charts, chat, form-add, order-detail, order-list, referrals, table-list, user-profile, wizard | 200 |
| Auth `register` / `forgot` / `verify-2fa` | 200 |
| Workbench `?area=design-system&section=components` | 200 · title `Design System · Components` |
| Workbench `?area=patterns&pattern=*` | iframe `https://staging.iflux.vn/patterns/<id>/` |
| Auth 4 state iframe | `/patterns/auth/{login,register,forgot,verify-2fa}.html` |
| Alias `?module=patterns&pattern=user-profile` | normalize → `?area=patterns&pattern=user-profile` |
| Alias `?module=sandbox&section=components` | normalize → `?area=design-system&section=components` |
| Hard refresh table-list | vẫn `area=patterns` + iframe `/patterns/table-list/` |
| History back / forward | tokens ↔ table-list |
| Old path `/design_system/references/patterns/<id>/` | **301** → `/patterns/<id>/` (10 id + auth login.html) |
| `/patterns/README.md` + `design_system/README.md` | 200 — root `/patterns/` có trên release |
| `/patterns/` directory listing | 403 (không index; không phải thiếu copy) |

Workbench JS staging: `normalizeArea`, `p.set('area'`, `patternFrame.src = '/patterns/' + id + '/' + file`, không `references/patterns`.

### User Profile visual

| Artifact | Staging vs `fc4b3cf` |
|---|---|
| `user-profile.css` | byte-equal |
| `user-profile.js` | byte-equal |
| `index.html` source | equal trừ **infra sẵn có**: Cloudflare email-protect + inject `User_Web` runtime scripts vào `<head>` |

Direct + Workbench iframe: `h1` = `Chi tiết người dùng`, `.ix-profile-grid` có, CSS DS resolve `/design_system/…`.

`USER_PROFILE_REGRESSION_STAGING` = **PASS** (delta do path migration = 0).

### Chat

Chỉ path: `/patterns/chat/` 200 · Workbench iframe `/patterns/chat/`. Không đánh giá visual W07.

---

## POST_DEPLOY_GATES

| Gate | |
|---|---|
| `STAGING_PATTERNS_RESOLVE` | **PASS** |
| `STAGING_OLD_PATH_REDIRECT` | **PASS** |
| `STAGING_DEPLOY_COPY` | **PASS** |
| `WORKBENCH_ROUTING_STAGING` | **PASS** |
| `USER_PROFILE_REGRESSION_STAGING` | **PASS** |
| `PATTERN_ROUTE_REGRESSION_STAGING` | **PASS** |
| **POST_DEPLOY** | **PASS** |

---

## Phase 12 — FINAL

| Gate | |
|---|---|
| `ARCHITECTURE_LOCK` | **PASS** |
| `ARCHITECTURE_READY_FOR_CHAT_REBUILD` | **YES** |

Chat rebuild sau lock: 4 phase (clone → isolate → mapping audit → reuse) + ownership 4 bậc:

1. Design System existing  
2. Design System missing generic contract  
3. Pattern local  
4. Exclude / runtime  

Cấm thêm rule `reference-layers.css`.

STOP.
