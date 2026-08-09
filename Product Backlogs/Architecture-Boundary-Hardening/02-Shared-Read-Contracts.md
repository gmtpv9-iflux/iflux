# ABH E0 — Shared Read Contracts (Frozen)

**Path:** `shared/runtime-read/`  
**Rule:** AB-07 — Read Adapter only. No God Module.

---

## AB-07 Allowed / Forbidden

| ✅ Allowed | ❌ Forbidden |
|------------|--------------|
| Read | Save |
| Projection | Publish |
| Index | Hydrate (write path) |
| Lookup | Notify / Sync / Merge |
| GET HTTP | localStorage |
| Immutable return values | Dependency on WGS Store/Service |
| Stateless functions | Event mutate |

---

## 1. WidgetRegistryReader

**File:** `shared/runtime-read/widget-registry-reader.js`

```typescript
// Frozen surface — do NOT extend without Owner review
interface WidgetRegistryEntry {
  widgetId: string;
  title: string;
  category: string;
  capability?: string;
  templateRef?: string;
}

WidgetRegistryReader.list(): Promise<WidgetRegistryEntry[]>
WidgetRegistryReader.get(widgetId: string): Promise<WidgetRegistryEntry | null>
WidgetRegistryReader.widgetIds(): Promise<string[]>
WidgetRegistryReader.isKnown(widgetId: string): Promise<boolean>
```

**Data source (by loader context):**

- Admin: projection from L4 Owner (adapter inject at load time — reader itself does not import L4 Store)
- Runtime: GET published widget catalog snapshot when available

**Must not add:** `getPlacement()`, `getTemplate()`, `saveWidget()`, `publish()`, `hydrate()`, `notify()`, `sync()`

---

## 2. PlacementWidgetIndexReader

**File:** `shared/runtime-read/placement-widget-index-reader.js`

```typescript
interface PlacementWidgetIndex {
  updatedAt: string;
  byPage: Record<string, string[]>;  // pageKey → widgetIds enabled on published page
  allEnabled: string[];               // dedupe union
}

PlacementWidgetIndexReader.fetch(): Promise<PlacementWidgetIndex>
PlacementWidgetIndexReader.listEnabledWidgetIds(): Promise<string[]>
PlacementWidgetIndexReader.byPage(pageKey: string): Promise<string[]>
```

**HTTP:** `GET /api/placement-widget-index`

**Server builder:** `backend/src/modules/widget-publish/placement-widget-index.service.js`

- Reads **only** current PagePublished rows (`artifact-store.getCurrentPage` / list all pages)
- Extracts `placements[].widgetId` or `widgetRefs[].widgetId`
- Does **not** read PageSettingsStore, draft, or Admin JS

---

## 3. PlansRuntimeReader

**File:** `shared/runtime-read/plans-runtime-reader.js`

```typescript
PlansRuntimeReader.load(): Promise<void>   // GET /api/plans/runtime once, memory cache
PlansRuntimeReader.getPlan(tier: string): object | null
PlansRuntimeReader.listTiers(): string[]
PlansRuntimeReader.isReady(): boolean
```

**Must not:** localStorage, PATCH, PUT, merge local-over-remote, expose save APIs.

---

## 4. L4RuntimeReader

**File:** `shared/runtime-read/l4-runtime-reader.js`

```typescript
L4RuntimeReader.load(): Promise<void>
L4RuntimeReader.getDefinition(widgetId: string): object | null
L4RuntimeReader.resolveWidgetCopy(widgetId: string): object | null
L4RuntimeReader.entitlementMeta(widgetId: string): object | null
L4RuntimeReader.widgetIds(): string[]
```

**Must not:** `migrateStoreOnce`, persist, `notifyPropagate`, save L4.

---

## 5. Backend API — Placement Widget Index

**Route:** `GET /api/placement-widget-index`  
**Auth:** Admin JWT `subscription.entitlements.view` (Permission UI); optional public read TBD — default Admin-only  
**Response:**

```json
{
  "ok": true,
  "data": {
    "updatedAt": "2026-07-27T...",
    "byPage": { "home": ["WGT-..."], "market": ["WGT-..."] },
    "allEnabled": ["WGT-..."]
  },
  "etag": "..."
}
```

**Invalidation:** Rebuilt on each GET from current published artifacts (no separate cache Owner).

---

## Acceptance — Shared Read Models (Reviewer addition)

Every file under `shared/runtime-read/` must:

- [ ] immutable exports (no mutable module state except read-through cache with explicit `load()`)
- [ ] read-only API surface
- [ ] stateless per call (cache is read cache only)
- [ ] no localStorage / sessionStorage
- [ ] no CustomEvent dispatch that triggers writes
- [ ] no publish / sync / hydrate / merge
- [ ] no `import` or `require` of WGS Store (PlansStore, PageSettingsStore, PlatformLayersWidgets save paths)

**Lint gate (E6):** script greps + AB-07 checklist in Exit report.
