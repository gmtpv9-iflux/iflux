# B3 — Core Navigation Funnel · Scope Lock

**Date:** 2026-07-27 (rev.2 — Canonical + Writer funnel)  
**Status:** **PRE-IMPL** — chờ Owner GO B3  
**ADR:** [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md) §9 · §14  
**Matrix:** [`19-PNC-State-Transition-Matrix.md`](19-PNC-State-Transition-Matrix.md) §3 Navigation Invariants · **INV-5**  
**Predecessor:** B2 **CLOSED** — không mở rộng thêm trừ hotfix

---

## 1. Mục tiêu B3

Đồng bộ **Application Zone URL** với **NavigationContext.ownerPublicId** — khóa **Single URL Writer** với **một nguồn quyết định prepend duy nhất**.

| B2 (đã xong) | B3 (slice này) |
|--------------|----------------|
| `getContext().ownerPublicId` đúng · persist | address bar prefix == Owner (INV-1 B3) |
| bar có thể sạch (INV-1 B2) | URL Writer funnel · zone policy |
| lifecycle only | internal links + navigate qua Writer |

**Invariant sau B3:** Matrix **INV-1** + **INV-5** — Application URL = Canonical + Context + Zone Policy.

---

## 2. Domain invariant — Canonical Path only (LOCKED)

> **Caller chỉ truyền Canonical Path; chỉ URL Writer mới được quyền gắn hoặc bỏ Owner prefix.**

Mọi URL Application Zone được sinh từ:

```text
Canonical Path  +  NavigationContext  +  Zone Policy
        ↓                  ↓                    ↓
   normalizePath()    getContext()      isApplicationZone()
        ↓                  ↓                    ↓
              Shell URL Writer.decorate()
                        ↓
                   Final URL / Address Bar
```

### 2.1 Caller contract (CẤM vi phạm)

| Đúng | Sai |
|------|-----|
| `navigate('/cong-dong')` | `navigate('/IFL111/cong-dong')` |
| `Routes.to('community')` → Writer decorate | Caller tự ghép `/IFL111/` |
| `replacePath('/co-phieu/HPG')` | `replacePath('/IFL999/co-phieu/HPG')` |

**Caller hoàn toàn không biết prefix** — không được parse publicId · không được prepend/strip.

### 2.2 INV-5 (Matrix §3)

```text
Application URL = Canonical Path + NavigationContext + Zone Policy
```

- **Canonical Path** → `normalizePath()` (Single URL Reader)
- **NavigationContext** → `getContext().ownerPublicId`
- **Zone Policy** → `isApplicationZone(path)` (centralized)

QR · Campaign · Email mở rộng sau **không** sửa kiến trúc này — chỉ thêm Context source.

---

## 3. Shell URL Writer — kiến trúc (LOCKED)

> **Một module · một chỗ quyết định prepend** — không rải logic vào 4 API.

### 3.1 Pipeline

```text
Routes.to(key)          ──┐
hrefFor(routeKey)       ──┤
navigate(canonical)     ──┼──►  ShellUrlWriter.decorate(canonical)
replacePath(canonical)  ──┘              │
                                           ▼
                                    Final URL
```

**`Routes.to()` KHÔNG tự prepend.** Nó sinh canonical public path → gọi `decorate()` trước khi trả về (hoặc trả canonical + flag — implementation detail; **quyết định prepend chỉ trong `decorate()`**).

### 3.2 Public API (duy nhất cho consumer)

| API | Input | Output |
|-----|-------|--------|
| **`IfluxRoutes.to(key, opts)`** | route key | decorated URL (internal: canonical → decorate) |
| **`IfluxAppShell.hrefFor(routeKey)`** | route key | delegate `Routes.to({ canonical: true })` |
| **`Shell.navigate(canonical, opts)`** | **canonical path** | ghi address bar qua decorate + location |
| **`Shell.replacePath(canonical, opts)`** | **canonical path** | `replaceState` qua decorate |

**CẤM export public:**

- ~~`Shell.prependOwnerPath()`~~ → **`_decorateCanonical()` private internal only**
- Không module nào được gọi prepend/strip trực tiếp

### 3.3 Private internal — `ShellUrlWriter.decorate(canonical)`

**Single decision point** — duy nhất nơi quyết định có gắn Owner prefix hay không:

```text
INPUT:  canonical path (đã normalizePath)

READ:   ctx = getContext()
        zone = isApplicationZone(canonical)

IF     !ctx || !zone || ctx.state rules → strip
       → return canonical

ELSE   → return /{ctx.ownerPublicId}{canonical}
```

### 3.4 Zone Policy — `isApplicationZone(path)` (LOCKED)

**Centralized** — Writer owns zone check · **cấm** từng caller tự `if`.

| Zone | Prepend? | Ví dụ |
|------|----------|-------|
| **Application** | ✅ (nếu context active) | `/cong-dong` · `/co-phieu/HPG` · `/chu-de/...` |
| **Exclusion** | ❌ | Auth · OAuth · Payment · Admin |
| **Infrastructure** | ❌ | `/api/*` · `/assets/*` · `/User_Web/*` · `/favicon.ico` · `/robots.txt` · `/sitemap.xml` |
| **External** | ❌ | `https://` · `mailto:` · CDN absolute |

Implementation có thể delegate `IfluxRoutes.detectRoute(path).zone === 'app'` + denylist infrastructure — **logic chỉ trong Writer module**.

---

## 4. Không thuộc URL Writer (CẤM app-zone navigation)

| Pattern | Lý do |
|---------|--------|
| `window.location.href = …` | Bypass decorate |
| `window.location.assign` / `replace` | Bypass decorate |
| `history.pushState` / `replaceState` trực tiếp | Bypass decorate |
| `<a href="/cong-dong">` hardcode | Bypass Routes funnel |
| Caller truyền path đã prepend `/IFLxxx/...` | Vi phạm §2.1 |
| Feature/widget tự ghép `/IFLxxx/` | Dual writer |
| **Resolver** | Parse + emit only (B1) |
| **Share Foundation** | Read context · B5 owns outgoing |

**Ngoại lệ hợp lệ:**

- OAuth redirect ra provider
- External URL · mailto · tel
- Exclusion Zone entry — bar sạch (Owner persist B2)
- Legacy 301 one-shot (nginx)
- Hash-only `#fragment` — pathname unchanged

---

## 5. Single URL Reader (không đổi — B1)

| API | Contract |
|-----|----------|
| `IfluxNormalizePath(path)` | Pure read · strip prefix · **không** mutate bar/context/history |

Routing · auth gate · detectRoute **đọc** canonical qua normalizePath.

Writer **đọc** context + zone · **ghi** decorated URL — không đảo vai trò.

---

## 6. Scope IN

| Hạng mục | Chi tiết |
|----------|----------|
| **`ShellUrlWriter` module** | CREATE · `decorate()` · `isApplicationZone()` |
| **`Routes.to()` funnel** | canonical → decorate (không prepend inline) |
| **`hrefFor()`** | qua Routes.to |
| **`Shell.navigate()` / `replacePath()`** | canonical in · decorated out |
| Post-login bar sync | `replacePath(returnTo)` — returnTo đã canonical (B2) |
| Post-logout | deactivate + navigate canonical |
| Exclusion enter/exit | strip via zone policy · prepend on re-enter app |
| INV-1 B3 · INV-5 | bar == Owner trong app zone |

---

## 7. Scope OUT (cấm scope creep)

| Hạng mục | Slice |
|----------|-------|
| Widget hardcode href migration | **B4** |
| Share never location.href | **B5** |
| SEO canonical / og:url | **B5** |
| QR / campaign / email sources | Matrix §6 reserved |
| Payment/checkout chi tiết | **B6** |
| B2 lifecycle changes | **CẤM** |
| Export `prependOwnerPath` public | **CẤM** |

---

## 8. B3 PASS Gate (URL assertions)

| Gate | Scenario | Verify |
|------|----------|--------|
| **N1** | Guest Owner IFL111 · nav community | `navigate('/cong-dong')` → bar `/IFL111/cong-dong` |
| **N2** | Auth Owner IFL999 · nav stocks | `Routes.to('stocks')` → `/IFL999/co-phieu` |
| **N3** | Login from IFL111 guest | `replacePath('/cong-dong')` → bar `/IFL999/cong-dong` |
| **N4** | Logout | bar `/cong-dong` · no prefix |
| **N5** | Exclusion `/dang-nhap` | bar sạch · Owner persist |
| **N6** | Foreign link IFL999 on `/IFL111/...` | next nav → Self prefix |
| **N7** | INV-1 B3 | app zone · context active → bar prefix == Owner |
| **N8** | INV-5 | mọi final URL = decorate(canonical) · không caller prepend |
| **N9** | Zone policy | `/api/foo` · `/favicon.ico` → **không** prepend |
| **N10** | Writer grep | 0 public `prependOwnerPath` · 0 app-zone raw `location.replace` ngoài Shell.navigate |

*B2 G1–G7 không regress.*

---

## 9. Pre-impl audit checklist

- [ ] Owner GO B3 rev.2
- [ ] `ShellUrlWriter` module design chốt (file: `shell-url-writer.js` hoặc extend runtime)
- [ ] `grep prependOwnerPath|IFL[A-Z0-9]{5}` trong callers
- [ ] `grep location\.(href|replace|assign)` inventory
- [ ] Verify `Routes.to` không duplicate decorate logic sau refactor
- [ ] Không sửa B2 lifecycle

---

## 10. Rủi ro chính

> Nếu prepend rải vào `Routes.to` + `navigate` + `replacePath` + widgets → sửa rule phải sửa 4 nơi.  
> **Rev.2 khóa:** chỉ `ShellUrlWriter.decorate()` quyết định.

Hot spots (B0+): `auth.js` · `iflux-guest-shell.js` · widget hardcode → funnel `navigate(canonical)`.

---

## 11. Deliverables

1. `shell-url-writer.js` (or equivalent) — decorate + isApplicationZone
2. Routes.to / navigate / replacePath funnel
3. `24-B3-Core-Navigation-Evidence-Report.md`
4. Grep: INV-5 · N8 · N10 PASS
5. Production deploy + CF purge

---

## Gate decision

| | |
|---|---|
| **B3 OPEN?** | ✅ PASS — deployed 2026-07-27 |
| **B2** | ✅ CLOSED |
| **Blocker trước code** | Canonical-only caller contract + single decorate() |

---

*Rev.2: Canonical Path invariant · ShellUrlWriter.decorate() single decision · isApplicationZone() · INV-5 · private prepend.*
