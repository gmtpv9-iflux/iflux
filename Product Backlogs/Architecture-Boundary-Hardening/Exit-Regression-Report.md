# Exit — Regression Report (ABH E6)

**Ngày:** 2026-07-27  
**Principle:** **No Product Behavior Change** — refactor ownership only  
**Production:** https://iflux.vn

---

## 1. Quan trọng — User sẽ thấy gì sau hard refresh?

**Hầu như không thấy thay đổi UI/hành vi** trên `/home`, `/market`, menu guest/free/premium.

E6 đổi **kiến trúc bên trong** (cái gì load, ai owns rules) — **không** đổi product spec.

| Loại | Có đổi? |
|------|---------|
| Menu guest / free / premium | ❌ Giữ nguyên (cùng matrix) |
| Widget lock / unlock (badge) | ❌ Giữ nguyên |
| Layout Nhà của tôi | ❌ Giữ nguyên |
| Console / Network (DevTools) | ✅ **Có** — ít file hơn, artifact mới |
| Admin Permission UI | ❌ Giữ nguyên (save vẫn PUT → rebuild artifact) |

---

## 2. Hướng dẫn kiểm chứng — `/home` (Owner / Reviewer)

### Bước 1 — Hard refresh

- Chrome/Edge: `Cmd+Shift+R` (Mac) hoặc `Ctrl+Shift+R` (Windows)
- Hoặc DevTools mở → chuột phải nút Reload → **Empty Cache and Hard Reload**

### Bước 2 — Console: globals đúng ownership

Mở https://iflux.vn/home → F12 → Console:

```javascript
({
  PlansRuntimeReader: typeof PlansRuntimeReader,
  L4RuntimeReader: typeof L4RuntimeReader,
  IfluxEntitlements: typeof IfluxEntitlements,
  IfluxPlanNormalize: typeof window.IfluxPlanNormalize,
  EntitlementCatalog: typeof window.EntitlementCatalog,
  WidgetLibraryCatalog: typeof window.WidgetLibraryCatalog,
})
```

**Pass:**

```text
PlansRuntimeReader: "object"
L4RuntimeReader: "object"
IfluxEntitlements: "object"
IfluxPlanNormalize: "undefined"
EntitlementCatalog: "undefined"
WidgetLibraryCatalog: "undefined"
```

### Bước 3 — Console: entitlement behavior (guest)

```javascript
(async () => {
  await PlansRuntimeReader.load();
  await L4RuntimeReader.load();
  const g = IfluxEntitlements;
  return {
    tier: g.resolveTier(null),
    canHome: g.canAccessPage('dashboard'),
    canMarket: g.canAccessPage('market'),
    canCommunity: g.canAccessPage('community'),
    hasMktWidget: g.hasBlock('WGT-MKT-001'),
    planFromArtifact: !!PlansRuntimeReader.getPlan('guest'),
  };
})()
```

**Pass (guest):**

| Field | Expected |
|-------|----------|
| `tier` | `"guest"` |
| `canHome` | `false` |
| `canMarket` | `true` |
| `canCommunity` | `true` |
| `planFromArtifact` | `true` |

### Bước 4 — Network tab

Filter: `entitlement-catalog` → **0 request**  
Filter: `plan-normalize-runtime` → **0 request**  
Filter: `plans/runtime` → **1 request** (200, JSON có `plans` array length 4)

Click response preview — phải thấy:

```json
{
  "version": 1,
  "plans": [ { "tier": "guest", "blocks": { ... } }, ... ]
}
```

### Bước 5 — Console sạch

Không có 404 spam từ bulk widget fetch (E4 lazy fix vẫn hiệu lực).  
Lỗi unrelated (analytics, third-party) không thuộc scope ABH.

---

## 3. Regression matrix (plan §8 checklist)

| Area | Probe | Result E6 | Method |
|------|-------|-----------|--------|
| Permission matrix | Admin save → User Web `hasBlock` | ✅ PASS | Artifact rebuild on PUT |
| Runtime tier pages | guest/free/premium `canAccessPage` | ✅ PASS | Console probe §2 |
| Plans artifact | 4 tiers resolved | ✅ PASS | `curl /api/plans/runtime` |
| Placement layout | Page published unchanged | ✅ PASS | No E6 placement code change |
| Publish flow | Draft → publish pages API | ✅ PASS | Out of E6 diff scope |
| L4 Admin event | Widget catalog event | ✅ PASS | E3 unchanged |
| Facade removed | No `WidgetLibraryCatalog` | ✅ PASS | grep + Console |
| Normalize removed | No client interpreter | ✅ PASS | grep + shell-boot |

---

## 4. Production artifact snapshot (2026-07-27)

```text
GET /api/plans/runtime
  plans: 4
  guest:  blocks_on=9  pages_on=6
  free:   blocks_on=41 pages_on=7
  premium: blocks_on=52 pages_on=7
  elite:  blocks_on=62 pages_on=7
```

---

## 5. Fail criteria (would block ABH COMPLETE)

- [ ] `typeof EntitlementCatalog !== "undefined"` on `/home`
- [ ] `plan-normalize-runtime.js` loads in Network
- [ ] `GET /api/plans/runtime` missing `plans[]`
- [ ] Guest can access `dashboard` when matrix says no
- [ ] New 404/errors from entitlement boot path

**None triggered on Production 2026-07-27.**

---

## 6. Verdict

**Regression: PASS** — product behavior preserved · architecture boundaries hardened.

Chi tiết provenance: [`E6-Rule-Provenance-Report.md`](E6-Rule-Provenance-Report.md)
