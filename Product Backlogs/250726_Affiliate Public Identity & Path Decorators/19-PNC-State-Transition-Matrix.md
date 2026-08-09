# PNC — State Transition Matrix

**Date:** 2026-07-27  
**Status:** **LOCKED** — SoT duy nhất cho ownership transitions  
**ADR:** [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md)  
**Use:** B2 lifecycle · B3 URL prepend · QR/campaign/deep-link mở rộng sau = **thêm dòng**, không sửa ADR

---

## 1. Nguyên tắc

**Navigation Context được định nghĩa bởi `Owner` (ownerPublicId), không phải Guest/Auth.**

| Owner | Ý nghĩa | User session (tham khảo) |
|-------|---------|---------------------------|
| **`none`** | Không Navigation Context | Guest · chưa mở link referrer |
| **`IFL111`** | Namespace referrer | Thường là guest |
| **`IFL999`** | Namespace Self (account) | Authenticated · có publicId |

Cùng user guest có thể: `Owner=none` **hoặc** `Owner=IFL111` tùy cách vào site.

### Domain Object (rev.4.2 — LOCKED)

NavigationContext **không phải UI state**:

- `getContext()` → **frozen clone** · consumer cấm mutate
- Chỉ transitions: **`create()` · `transfer()` · `deactivate()`**
- **Idempotent:** same-owner `create` · same-self `transfer` · `deactivate(null)` → no-op (§4)
- Cấm `ctx.ownerPublicId = …` — mọi thay đổi qua lifecycle gate (audit/analytics sau này)

---

## 2. B2 vs B3 — tách trách nhiệm

| Layer | Slice | Verify |
|-------|-------|--------|
| **Lifecycle / Owner state** | **B2** | `Shell.getContext().ownerPublicId` · persist reload/back |
| **URL bar + link prepend** | **B3** | `Routes.to()` · `hrefFor()` · address bar `/IFL999/...` |

**B2 PASS:** Owner state đúng · **không** yêu cầu mọi internal link đã prepend.

**Trạng thái tạm sau login (B2-only deploy):** `Owner=IFL999` · bar có thể vẫn `/cong-dong` — **chấp nhận** cho đến B3.

**B3 PASS:** Owner + URL bar + internal links nhất quán.

---

## 3. Navigation Invariants (B2 → B3)

> **Mục đích:** Giải thích rõ trạng thái **cố ý không đồng bộ** ở B2 — tránh debug nhầm là bug.

### INV-1 — Owner vs Address Bar (phase-dependent)

| Phase | Invariant | Ví dụ hợp lệ |
|-------|-----------|--------------|
| **B2 (lifecycle only)** | `NavigationContext.ownerPublicId` **≠** address bar prefix **được phép** | Owner `IFL999` · bar `/cong-dong` |
| **B3+ (Application Zone, context active)** | address bar prefix **==** `NavigationContext.ownerPublicId` | Owner `IFL999` · bar `/IFL999/cong-dong` |

**B2 intentionally inconsistent** — URL chưa prepend · Owner state đã đúng.  
**B3** mới đồng bộ URL và Owner trong Application Zone.

### INV-2 — Exclusion Zone (mọi phase)

Trong Exclusion Zone (Auth · OAuth · Payment · Admin): address bar **luôn sạch** (không publicId prefix) — Owner **persist** trong Shell store.

### INV-3 — No Context

Khi `getContext() === null`: address bar **không** có publicId prefix · internal links **không** prepend.

### INV-4 — Single URL Writer funnel (B3+)

Mọi ghi address bar + sinh internal link Application Zone **phải** đi qua Shell URL Writer API — xem [`23-B3-Core-Navigation-Scope-Lock.md`](23-B3-Core-Navigation-Scope-Lock.md) §3 · **cấm** writer song song.

### INV-5 — Application URL composition (B3+ — LOCKED)

```text
Application URL = Canonical Path + NavigationContext + Zone Policy
```

| Thành phần | Source |
|------------|--------|
| **Canonical Path** | `normalizePath()` — caller **chỉ** truyền canonical |
| **NavigationContext** | `getContext().ownerPublicId` |
| **Zone Policy** | `isApplicationZone(path)` — centralized trong Writer |

**Pipeline:**

```text
Canonical Path → ShellUrlWriter.decorate() → Final URL / Address Bar
```

**CẤM:** caller truyền path đã prepend (`/IFL111/cong-dong`) · caller tự ghép prefix · export public prepend API.

QR · Campaign · Email (future) → thêm Context source · **không** sửa công thức INV-5.

### INV-6 — Consumer canonical-only (B4+ — LOCKED)

Consumer **chỉ** truyền Canonical Path — xem B4 MR-2 · [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md).

### INV-7 — Canonical Route không chứa Owner (LOCKED)

Route nội bộ · registry · SEO · analytics **luôn** dùng canonical đã strip Owner:

```text
Bar:       /IFL9552M/cong-dong
Canonical: /cong-dong
```

**Cấm** propagate path có publicId prefix vào `detectRoute` / App Router / PagePublished key mà chưa qua `normalizePath()`.

### AC-NAV-ROOT — `/{publicId}` → Home (Community)

```gherkin
When   Open /IFL9552M (publicId only)
Then   Content = Community (Home) · Owner = IFL9552M
And    nginx rewrite + Resolver canonicalPath '/' (see Conformance Report §6)
```

---

## 4. State Transition Matrix (core)

| Current Owner | Event | New Owner | Shell API (B2) | URL Writer (B3+) |
|---------------|-------|-----------|----------------|------------------|
| `none` | Open `/IFL111/...` (incoming-path) | `IFL111` | `createContext` · activate | Giữ bar referrer (B1+) · prepend links **B3** |
| `none` | Direct `/cong-dong` (no referrer) | `none` | — | — |
| `IFL111` | In-app navigate / reload / back / forward | `IFL111` | persist restore · popstate | prepend **B3** |
| `IFL111` | Register success | `IFL999` | `transferOwnership` · reason=register | `replaceState` / prepend **B3** |
| `IFL111` | Login (account IFL999) | `IFL999` | `transferOwnership` · reason=login | **B3** |
| `IFL999` | Navigate / reload / back / forward | `IFL999` | persist · popstate | prepend **B3** |
| `IFL999` | Logout | `none` | `deactivateContext` | strip bar **B3** |
| `IFL999` | Open `/IFL222/...` (foreign) | `IFL999` | ignore owner change · capture attribution | Self prefix on nav **B3** |
| `IFL111` | Enter Exclusion Zone (`/dang-nhap`) | `IFL111` | persist · save `returnTo` | strip bar (zone) **B2+B3** |
| `IFL111` | OAuth callback → login IFL999 | `IFL999` | `transferOwnership` + restore returnTo | `/IFL999{returnTo}` **B3** |

---

## 5. Transition idempotency (LOCKED)

| API | Condition | Result |
|-----|-----------|--------|
| `create(owner)` | active owner === owner | no-op · preserve `createdAt` |
| `create(owner)` | active owner !== owner | lifecycle gate skips (no override) |
| `transfer(self)` | owner === self · authenticated | no-op |
| `deactivate()` | no context | safe no-op |
| `setReturnTo(path)` | path in Exclusion Zone | reject · null |

---

## 6. Mở rộng (reserved — thêm dòng khi Owner mở)

| Current Owner | Event | New Owner | Source tag | Shell API |
|---------------|-------|-----------|------------|-----------|
| `none` | QR scan `IFL111` | `IFL111` | `qr` | `createContext` |
| `none` | Email campaign link | `IFL111` | `email` | `createContext` |
| `none` | Deep link | `IFL111` | `deep-link` | `createContext` |
| `none` | Push notification open | TBD | `campaign` | TBD |

→ Chỉ thêm row · **không** sửa core matrix §3.

---

## 7. Persistence (requirement — không ràng buộc mechanism)

> Navigation Context **MUST** survive **reload · back · forward** within one browser session (same Owner unless transition event).

Persistence mechanism = **implementation detail** (memory · sessionStorage · BroadcastChannel · cookie · IndexedDB…).

Phase B implementation có thể dùng sessionStorage — **đổi mechanism không đòi sửa ADR.**

---

## 8. Map → B2 PASS Gate (G1–G7)

| Gate | Matrix rows | B2 verify | B3 verify |
|------|-------------|-----------|-----------|
| **G1** | IFL111 · nav/reload/back/forward | `getContext().ownerPublicId === IFL111` | bar/links IFL111 |
| **G2** | IFL111 → register → IFL999 | Owner IFL999 after transfer + reload | bar IFL999 |
| **G3** | IFL111 → login → IFL999 | Owner IFL999 · referred_by unchanged | bar IFL999 |
| **G4** | IFL999 → logout → back | Owner none · no resurrect | bar clean |
| **G5** | Exclusion + OAuth | Owner IFL999 · returnTo | bar IFL999 path |
| **G6** | IFL999 open IFL222 | Owner stays IFL999 | nav IFL999 |
| **G7** | IFL999 open IFL111 · **F5 refresh** | Owner stays IFL999 | bar foreign path OK until B3 |

---

## 9. References

- ADR §4 NavigationContext object  
- [`21-B2-Lifecycle-Scope-Lock.md`](21-B2-Lifecycle-Scope-Lock.md) — B2 PASS (state only)  
- [`23-B3-Core-Navigation-Scope-Lock.md`](23-B3-Core-Navigation-Scope-Lock.md) — B3 URL Writer · PASS gate  

---

*SoT transition — append-only for new sources.*
