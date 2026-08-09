# ABH-11 — Net Complexity & Consumer Justification

**Status:** **APPROVED — Owner 2026-07-27**  
**Governance:** CG-005 · CG-012 (why new file?) · ABH-09 amendment

---

## 0. LOC alone không đủ

Task ABH phải **giảm coupling và complexity** — không chỉ báo Removed/Added LOC.

Mỗi phase exit (E5, E6) **bắt buộc** bảng metrics §2.

---

## 1. No single-consumer abstraction

**Cấm** tạo module/reader/facade mới chỉ phục vụ **1 call-site** (trừ Owner exception).

| Ví dụ | Verdict |
|-------|---------|
| `PlansRuntimeReader` chỉ shell-boot dùng | **FAIL** — không đủ lý do |
| shell + pricing + checkout + entitlements + auth dùng | **OK** |

Amendment API mới (ABH-09 §4): liệt kê **≥2 consumer** active hoặc Owner ghi exception + lý do.

---

## 2. Complexity table — bắt buộc mỗi phase

Copy vào `E5-Evidence-Report.md` / `Exit-Regression-Report.md`:

| Metric | E4 Before | E4 After (actual) | E5 Target | E6 Target |
|--------|-----------|-------------------|-----------|-----------|
| Runtime globals (shell boot) | PlansStore, PLW, EntitlementCatalog, … | PlansRuntimeReader, L4RuntimeReader, EntitlementCatalog, WidgetLibraryCatalog facade | −EntitlementCatalog | −facade or shim ≤3 |
| Admin `app/subscription/*.js` loaded on shell | 2 (Plans+Entitlement) | 1 (Entitlement) | **0** | **0** |
| Admin `platform-layers-widgets.js` on shell | 1 | **0** | **0** | **0** |
| Reader public API keys (whitelist) | — | PRR 6 · L4R 8 · Facade §ABH-09 | unchanged | sunset facade |
| Dependency edges Runtime→Admin Store | 3 | 1 | 0 | 0 |
| Shell JS download (Network, `/home` cold) | plans-store + PLW + entitlement | readers + entitlement | −entitlement-catalog.js | −facade deps |
| Second caches (`_meta` + snapshot) | — | WIDGET_SPECS ⚠️ | no new | **1 cache only** |

### Cách đo (evidence)

```bash
# Runtime globals after boot — DevTools paste
Object.keys(window).filter(k => /Plans|L4|Entitlement|WidgetLibrary/i.test(k))

# Network — filter plans-store | platform-layers | entitlement-catalog | plans-runtime-reader

# Dependency edges — grep shell-boot ensureParallel active entries
rg "global:" User_Web/iflux-web-ui/runtime/shell-boot.js
```

**Shell bundle MB:** DevTools Network → sum JS transferred boot path (ghi số trong report).

---

## 3. E4 baseline (Owner reference)

| Metric | Before E4 | After E4 |
|--------|-----------|----------|
| PlansStore on shell | ✅ load | ❌ |
| PlatformLayersWidgets on shell | ✅ load (~2299 LOC) | ❌ |
| PlansRuntimeReader | — | ✅ (~163 LOC) |
| L4RuntimeReader | — | ✅ (~206 LOC) |
| EntitlementCatalog on shell | ✅ | ✅ (E5 removes) |
| WidgetLibraryCatalog facade | via PLW | via L4Reader (compat ABH-10) |
| PlansRuntimeReader consumers | — | **≥8** ✅ |
| Network: plans-store.js | 1 req | **0** |
| Network: platform-layers-widgets.js | 1 req | **0** |

---

## 4. Phase PASS rule

Phase **FAIL** nếu:

- Complexity table thiếu
- Metric **xấu hơn** baseline không có Owner justification (vd. thêm Admin module on shell)
- Chỉ báo LOC net mà không có globals/edges/Network

---

## 5. Liên kết ABH-09

- API mới: **consumer map ≥2** (§1) + không mega-method
- **Không** dùng max method count làm KPI

---

*ABH-11 — đo architecture quality, không chỉ dòng code.*
