# ABH E0 — Event Catalog

**Phase:** E3 prep  
**Principle:** WS-3 — no direct L4 → EntitlementCatalog.refresh()

---

## iflux-widget-catalog-changed

**Dispatched by:** L4 Owner (`platform-layers-widgets.js`) after widget definition save/delete  
**Subscribers:** Admin Permission UI only (`entitlements.html`, optional `plan-edit.html`)  
**Runtime (User Web):** must NOT subscribe (no Admin entitlement refresh on public shell)

### Payload

```typescript
interface WidgetCatalogChangedDetail {
  source: 'layer4';
  action: 'save' | 'delete' | 'bulk';
  widgetIds?: string[];
  at: string;  // ISO timestamp
}
```

### Dispatch (E3 implementation)

```javascript
document.dispatchEvent(new CustomEvent('iflux-widget-catalog-changed', {
  detail: { source: 'layer4', action: 'save', widgetIds: [id], at: new Date().toISOString() }
}));
```

### Subscribe (Admin only)

```javascript
document.addEventListener('iflux-widget-catalog-changed', function () {
  if (window.EntitlementCatalog && EntitlementCatalog.refreshBlocksCatalog) {
    EntitlementCatalog.refreshBlocksCatalog();
  }
});
```

---

## Events NOT allowed on shared/runtime-read

Readers must **not** dispatch:

- `iflux-plans-updated` (PlansStore legacy)
- Any event that triggers save/publish/hydrate

---

## Existing events (unchanged behavior)

| Event | Owner | Runtime impact |
|-------|-------|------------------|
| `iflux-plans-updated` | PlansStore (Admin) | Guest shell re-check access — replace with reader cache invalidation in E4 |
| `iflux-tier-changed` | User auth | Out of scope ABH |

---

## Placement index refresh (E2)

Permission UI refetches `GET /api/placement-widget-index` on:

- Matrix page open
- After Admin page publish success (existing publish callback)

No client cross-WGS event required for MVP.
