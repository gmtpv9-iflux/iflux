# 11 — CI Breakpoint Audit · Long-term enforcement

**Date:** 2026-07-27 (rev.6)  
**Status:** **v1 regex — Slice 6 · AST roadmap Phase 2**  
**Script:** [`scripts/check-breakpoints.py`](../../../scripts/check-breakpoints.py)  
**Exceptions:** [`breakpoint-exceptions.json`](breakpoint-exceptions.json) + [`09`](09-Breakpoint-Exception-Registry.md)

---

## 1. Mục đích

Giữ repo sạch sau migration — ngăn px ad-hoc mọc lại.

**Fail CI** nếu responsive literal ngoài Foundation + Exception (scoped).

---

## 2. v1 — Regex scanner (hiện tại)

**Phát hiện được:**

| Pattern | Example |
|---------|---------|
| `@media (max-width: Npx)` | `@media (max-width: 900px)` |
| `@container` | `@container (max-width: 720px)` |
| `innerWidth <= N` | `window.innerWidth <= 960` |
| `DRAWER_MAX = N` | `var DRAWER_MAX = 1023.98` |
| `matchMedia('…Npx…')` | literal trong string |

**Không phát hiện (known gaps — v1):**

```js
const TABLET = 900;
if (innerWidth <= TABLET) { ... }

const MOBILE_QUERY = '(max-width: 960px)';
matchMedia(MOBILE_QUERY);

const bp = getBreakpoint('tablet'); // indirect
```

→ **Không coi v1 là đủ** cho AC-BP-08 long-term alone · bổ sung AST Phase 2.

---

## 3. Roadmap — v2 AST scan (post-migration)

| Phase | Capability |
|-------|------------|
| **v1** (Slice 6) | Regex literals · constants `*_MAX` · matchMedia strings |
| **v2** (backlog) | Trace `const X = 900` → `innerWidth <= X` |
| **v2** | Ban new `innerWidth` / `matchMedia` outside approved abstraction module |
| **v2** | Expired Exception TTL fail (read Expiry from JSON) |

Owner mở v2 sau Phase F PASS hoặc khi bypass phát hiện trong audit.

---

## 4. Forbidden (GR-BP-02) — policy layer

Regardless of scanner version, **policy** cấm magic numbers in consumers. v1 CI = best-effort; v2 closes gaps.

**Allowed:**

- Foundation in `layout.css`
- Runtime abstraction module (Owner-approved path in 10)
- Exception-scoped files in 09/JSON
- Layout Constraint — excluded from scan

---

## 5. Usage

```bash
python3 scripts/check-breakpoints.py
# exit=0 PASS · exit=1 FAIL
```

**Baseline pre-migration:** expected **66** violations (04b) · exit=1.

---

## 6. CI integration (Slice 6)

| Step | When | Status |
|------|------|--------|
| Local `breakpoint-audit` | Every commit / MR | ✅ `scripts/check-breakpoints.py` PASS on main working tree |
| GitLab `breakpoint-audit` job | MR Phase E+ | ⏳ Backlog — no `.gitlab-ci.yml` in repo yet |
| Phase F gate | exit 0 + exceptions TTL valid | ✅ PASS 2026-07-27 |
| v2 AST | separate task after F | ⏳ Roadmap §3 |

---

## 7. Phase F checklist

- [x] v1 PASS on working tree (66→0)
- [x] Known v1 gaps documented in slice evidence
- [x] v2 AST on roadmap (§3)
- [x] PR test: raw `900px` without exception → fail (verified by script)

---

*CI rev.6 — v1 regex honest limits · AST roadmap.*
