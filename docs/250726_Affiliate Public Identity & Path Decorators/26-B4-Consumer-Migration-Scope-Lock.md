# B4 — Consumer Migration · Scope Lock

**Date:** 2026-07-27 (rev.3 — MR-2 Canonical-only input)  
**Status:** **GO** — migration-only · Owner GO Wave 1  
**Audit:** [`25-B4-Pre-Migration-Audit.md`](25-B4-Pre-Migration-Audit.md)  
**Predecessor:** B3 **PASS / FROZEN**

---

## 0. GO condition (LOCKED)

> **B4 chỉ được là migration — tuyệt đối không sinh thêm logic.**

Vi phạm = reject PR/wave · rollback wave đó.

---

## 1. Vai trò B4

> **Xóa toàn bộ hardcode href / raw location — chuyển sang Consumer API duy nhất.**

B4 = **Consumer Migration** — không chỉ widget:

* widgets
* page JS
* guest shell
* feature boot
* search
* header helpers

```text
B1  Foundation
        ↓
B2  Lifecycle
        ↓
B3  Writer (ShellUrlWriter.decorate)
        ↓
B4  Consumer Migration    ← slice này
        ↓
B4.5  Stabilization — [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md) all green
        ↓
B5  SEO + Share cleanup
```

---

## 2. Product rules (unchanged — B3 đã ship)

| # | Rule |
|---|------|
| 1 | Referrer gửi `iflux.vn/IFL111/...` |
| 2 | Guest đi khắp site → `/IFL111/...` |
| 3 | Register/Login → Owner `IFL111` → `IFL999` |
| 4 | Sau auth → mọi link `/IFL999/...` |

B4 đảm bảo **mọi consumer** tuân — không sửa ownership model.

---

## 3. Migration Rule MR-1 (LOCKED)

**Consumer chỉ được gọi:**

| API | Dùng khi |
|-----|----------|
| `IfluxRoutes.to(key, opts)` | Sinh href / URL decorated |
| `IfluxShellUrlWriter.navigate(canonical, opts)` | Programmatic nav |
| `IfluxShellUrlWriter.replacePath(canonical, opts)` | Bar sync (hiếm · shell-owned) |

**Consumer KHÔNG BAO GIỜ:**

| CẤM | Lý do |
|-----|-------|
| prepend `/IFLxxx/` | Writer owns decorate |
| `normalizePath()` / strip prefix | Reader · không phải consumer |
| `getContext()` / đọc `NavigationContext` | Lifecycle layer |
| `if (owner) …` / `ownerPublicId` | Consumer phải **"ngu"** |
| `createContext` / `transferOwnership` | B2 only |
| `decorate()` trực tiếp | Writer internal |
| `IfluxNormalizePath` | B1 Reader |

**Reject ngay cả khi chạy đúng:**

```javascript
// ❌ CẤM — dù output đúng
const owner = getContext().ownerPublicId;
href = '/' + owner + '/cong-dong';

// ✅ ĐÚNG
href = IfluxRoutes.to('community');
```

---

## 3.1 Migration Rule MR-2 — Canonical-only input (LOCKED)

> **Consumer chỉ biết Canonical Path — không bao giờ truyền path đã có Owner prefix.**

Pipeline đầy đủ:

```text
Consumer          canonical only (/cong-dong · route key)
        ↓
Routes.to(key)    → canonical public path
        ↓
Writer.decorate() → gắn Owner prefix (nếu zone + context)
        ↓
Final URL         (/IFL111/cong-dong · /IFL999/cong-dong · …)
```

**Consumer được phép truyền:**

| Input | Ví dụ |
|-------|-------|
| Route key | `Routes.to('community')` |
| Canonical path | `navigate('/cong-dong')` · `navigate('/co-phieu/HPG')` |

**Cấm tuyệt đối:**

```javascript
// ❌ CẤM — path đã prepend hoặc ghép owner
navigate('/IFL111/cong-dong');
navigate('/IFL999/co-phieu/HPG');
navigate(ctx.owner + '/cong-dong');
href = '/IFL111' + canonical;

// ✅ ĐÚNG
navigate('/cong-dong');
Routes.to('stocks');  // hoặc navigate('/co-phieu/HPG')
```

**Hệ quả kiến trúc:** Đổi format prefix sau này (vd. `/u/IFL111/...` · `/@IFL111/...`) → **chỉ sửa Writer** · consumer **không** đụng.

MR-2 là invariant input của MR-1 — vi phạm MR-2 = vi phạm Dependency Rule.

---

## 4. Consumer Dependency Rule (LOCKED)

```text
Consumer (widget · page · feature)
        │  canonical only (MR-2)
        ↓
Routes.to() / hrefFor
        ↓
ShellUrlWriter.decorate()
        ↓
Lifecycle (transitions)
        ↓
NavigationContext
```

**CẤM dependency ngược:**

```text
Consumer ──✗──► NavigationContext
Consumer ──✗──► ShellUrlWriter internals (decorate private)
Consumer ──✗──► normalizePath
```

→ QR · Campaign · Email · Deep-link sau này chỉ thêm **Context source** — consumer **không** sửa.

---

## 5. CẤM đụng (module frozen)

| Module | Slice |
|--------|-------|
| `navigation-context.js` | B2 CLOSED |
| `pnc-lifecycle.js` | B2 CLOSED |
| `shell-url-writer.js` | B3 CLOSED — cấm thêm public prepend API |
| `iflux-normalize-path.js` | B1 Reader |
| `affiliate-resolver.js` | B1 parse + emit |
| `transferOwnership` / lifecycle hooks | B2 |

B4 **chỉ sửa consumer files** (audit ⚠️ tag).

---

## 6. Scope IN

| Hạng mục | Migrate → |
|----------|-----------|
| Hardcode `href="/…"` | `IfluxRoutes.to(key)` |
| `location.href/replace` app nav | `IfluxShellUrlWriter.navigate(canonical)` |
| Waves W1–W4 | Per audit §7 |
| Query params | Canonical path + query · không prepend thủ công |

```javascript
// Trước
'<a href="/cong-dong">'
window.location.href = '/tai-khoan';

// Sau (MR-1)
'<a href="' + IfluxRoutes.to('community') + '">'
IfluxShellUrlWriter.navigate('/tai-khoan');
```

---

## 7. Scope OUT

| Hạng mục | Slice |
|----------|-------|
| OAuth · Auth/OTP · Payment | Excluded (audit) |
| Legacy HTML 301 · Assets | Excluded |
| Share/SEO `location.href` read | B5 |
| Writer/Context/Lifecycle logic | **CẤM** |

---

## 8. Migration waves

| Wave | Scope | Deliverable |
|------|-------|-------------|
| **W1** | `widgets/*` (loyalty · pricing · faq · messages) | deploy + wave evidence |
| **W2** | community-page · write · post-page | deploy + evidence |
| **W3** | iflux-web-ui · guest-shell · header-search | deploy + evidence |
| **W4** | runtime/*-boot · entity/stock · loyalty-page | deploy + evidence |
| **W5** | Static HTML brand (optional) | manual |

Mỗi wave: **deploy → grep gate → evidence → mới wave tiếp** · có rollback plan.

---

## 9. B4 PASS Gate

| Gate | Verify |
|------|--------|
| **M1** | Audit ⚠️ items Wave 1–4 = 0 (trừ excluded) |
| **M2** | `grep 'href=\"/(cong-dong\|nha-cua-toi\|co-phieu\|tai-khoan)'` trong consumers migrated → 0 |
| **M3** | No diff Writer/Context/Lifecycle/normalizePath |
| **M4** | Guest IFL111 · consumer CTA → prefixed URL |
| **M5** | Auth IFL999 · consumer CTA → Self prefix |
| **M6** | B2 G1–G7 + B3 N1–N10 không regress |
| **M7** | Consumer **grep `ownerPublicId`** → **0** (widgets + migrated pages) |
| **M8** | Consumer **grep `getContext\|createContext\|transferOwnership`** → **0** |
| **M9** | Consumer **grep `normalizePath\|IfluxNormalizePath`** → **0** |
| **M10** | Consumer **grep `decorate(`** → **0** |
| **M11** | Consumer **grep `/IFL[A-Z0-9]{5,}`** trong navigate/to/href → **0** (MR-2) |
| **MR-1** | Manual review: no prepend · no owner if · Routes/navigate only |
| **MR-2** | Manual review: input luôn canonical · không path đã prepend |

### Grep commands (B4 evidence)

```bash
# M2 — hardcode app href
rg 'href="/(cong-dong|nha-cua-toi|co-phieu|tai-khoan|goi-cuoc|thanh-vien)' User_Web/iflux-web-ui/widgets/ User_Web/iflux-web-ui/*-page.js

# M7–M10 — consumer không biết tầng dưới
rg 'ownerPublicId|getContext|createContext|transferOwnership' User_Web/iflux-web-ui/widgets/ User_Web/iflux-web-ui/community*.js
rg 'normalizePath|IfluxNormalizePath' User_Web/iflux-web-ui/widgets/
rg 'decorate\(' User_Web/iflux-web-ui/widgets/ User_Web/iflux-web-ui/community*.js

# M11 — MR-2: consumer không truyền path đã prepend
rg '/IFL[A-Z0-9]{5,}|"IFL[A-Z0-9]{5,}' User_Web/iflux-web-ui/widgets/ User_Web/iflux-web-ui/community*.js
# Kết quả migrated scope: 0 (trừ comment/string test fixture nếu có — audit ghi rõ)
```

---

## 10. B4.5 Stabilization (post-B4 · pre-B5)

Sau B4 waves xong — **không vào B5 ngay.**

| | |
|---|---|
| **Duration** | 2–3 ngày Production soak |
| **Watch** | CTA chết · menu sót · popup href cũ · foreign link nav |
| **Action** | Hotfix consumer-only · không mở Writer/Context |
| **Exit** | Owner sign-off → B5 OPEN |

---

## 11. Deliverables

1. Code waves W1–W4
2. `B4-Consumer-Migration-Evidence-Report.md` (final)
3. Grep M1–M11 + MR-1/MR-2 checklist
4. Update [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md)
5. Production deploy + CF purge per wave

---

## Gate decision

| | |
|---|---|
| **B4 GO?** | ✅ YES — **migration-only** · MR-1 · MR-2 · Dependency Rule |
| **Start** | **Wave 1** (widgets) |
| **B3** | ✅ FROZEN |
| **B5** | ⏳ After B4.5 Stabilization |

---

*Rev.3: MR-2 Canonical-only input · Grep M11 · prefix format change = Writer-only.*
