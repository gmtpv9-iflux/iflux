# Exit — Security Regression Report (ABH E6)

**Ngày:** 2026-07-27  
**Scope:** API exposure · Runtime attack surface · Admin write paths

---

## 1. Attack surface reduced

| Before | After | Security effect |
|--------|-------|-----------------|
| Admin `EntitlementCatalog` (~790 LOC) downloaded to every User Web visitor | **Not loaded** | Smaller client bundle · Admin logic not exposed to guest |
| Client-side `normalizePlan` (business rules in browser) | **Removed** | Rules not inspectable/tamperable in DevTools override path |
| `WidgetLibraryCatalog` facade (duplicate metadata surface) | **Removed** | Single read path · less confused trust boundary |
| Dual cache `_meta` + `WIDGET_SPECS` | **`_meta` only** | No stale snapshot bypass |

---

## 2. API routes — no new anonymous write

| Route | Method | Auth E6 | Change |
|-------|--------|---------|--------|
| `/api/plans/runtime` | GET | Public read | Response now includes `plans[]` (read-only) |
| `/api/plans/runtime` | PUT | Admin `subscription.entitlements.edit` | Rebuilds artifact via `writeRuntimeFile` — **same guard** |
| `/api/widgets/:id` | GET | Public/lazy | Unchanged |
| `/api/placement-widget-index` | GET | Admin context | Unchanged E2 |

```bash
# Verify PUT still guarded (expect 401/403 without admin session)
curl -sS -o /dev/null -w "%{http_code}" -X PUT https://iflux.vn/api/plans/runtime \
  -H "Content-Type: application/json" -d '{"overrides":{}}'
# → non-200 (401/403)
```

---

## 3. Runtime trust boundary

| Data | Trust source | Client may mutate? |
|------|--------------|-------------------|
| `plans[].blocks` | Server-published artifact | ❌ Read only |
| `plans[].pages` | Server-published artifact | ❌ Read only |
| L4 widget metadata | GET `/api/widgets/:id` | ❌ Read only |
| User tier | `IfluxAuth` session | ✅ Session (OUT OF SCOPE ABH) |

**Fail-open:** `IfluxEntitlements` returns `null` plan for non-guest missing data — không grant premium by default.

---

## 4. Sensitive paths not exposed on User Web

| Path pattern | User Web load |
|--------------|---------------|
| `Admin_Design_system/app/subscription/*` | **0** |
| `Admin_Design_system/app/system/platform-layers-widgets.js` | **0** on shell |
| Admin RBAC matrix editors | Admin routes only |

---

## 5. CDN / cache

- Cloudflare purge executed post-deploy 2026-07-27
- `shell-boot.js` cache buster `abhE620260727` forces new reader chain
- Plans API: `cache: no-store` on client fetch

---

## 6. Known out-of-scope (not regressions)

| Item | Track |
|------|-------|
| `auth.js` client tier grant | RO-01–05 separate |
| Anonymous write to entitlements beyond PUT guard | Pre-existing backend RBAC |
| Widget artifact 404 for unpublished widgets | Lazy fetch marks missing — no escalation |

---

## 7. Verdict

**Security regression: PASS** — attack surface reduced · no new anonymous write · published artifact read-only on Runtime.
