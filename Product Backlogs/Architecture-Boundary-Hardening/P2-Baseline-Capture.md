# P2 Baseline Capture — Production

**Captured:** 2026-07-27 (before ABH E2 deploy)  
**Environment:** Production (`https://iflux.vn`)  
**Algorithm:** `placement.enabled !== false` AND `widgetId ∈ widget_current_versions`

---

## P2 — Filter "Chỉ Widget đang Bật"

| Metric | Value |
|--------|-------|
| **p2EnabledCount** | **19** |
| l4WidgetCount | 32 |
| publishedPageCount | 8 |

### allEnabled (frozen set)

```
WGT-COM-004
WGT-CUS-001
WGT-FLW-001
WGT-FLW-EX_TM_HST_IN
WGT-FLW-EX_TM_IN
WGT-FLW-EX_TM_SECTOR_IN
WGT-FLW-EX_TM_STORY_IN
WGT-FLW-STAT_HST
WGT-FLW-STAT_SECTOR
WGT-FLW-STAT_STOCK
WGT-FLW-STAT_STORY
WGT-MKT-001
WGT-MKT-002
WGT-MKT-006
WGT-MKT-007
WGT-MKT-008
WGT-TOP-001
WGT-TOP-002
WGT-TOP-003
```

Full JSON: [`P2-Baseline-Production.json`](P2-Baseline-Production.json)

---

## Parity gate (post E2 deploy)

- [ ] `GET /api/placement-widget-index` → `allEnabled.length === 19`
- [ ] Set equality vs `allEnabled` above
- [ ] Entitlements matrix filter "enabled" → **19 rows**

---

## Re-capture command (server)

```bash
node /tmp/capture-p2-baseline.js
```

Script: aggregate from `page_current_versions` + L4 intersect (same as index builder).
