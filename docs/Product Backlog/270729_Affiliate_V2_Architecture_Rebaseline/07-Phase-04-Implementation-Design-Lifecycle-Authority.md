# Phase 4 · Step 2 — Implementation Design  
## Platform Identity Lifecycle Authority

**Date:** 2026-07-29  
**Status:** **ACCEPT** v1.2 (+ Event Source · Verification Plan ACCEPT Reviewer) — Runtime evidence còn lại trước Phase 4 PASS  
**Step:** 2 PASS · 3 PASS · 4 Plan ACCEPT · Runtime ☐  
**Neo Discovery:** [`06-Phase-04-Discovery-Audit-Lifecycle-Authority.md`](06-Phase-04-Discovery-Audit-Lifecycle-Authority.md)  
**Neo:** SoT §6 · BR-16 · BR-18 · BR-20 · PI-10 · PI-13 · PI-19 · PI-21 · Solution §5.1 · §6 · BD-00 · BD-06 · BD-08  

---

# 0. Business Rule khóa (input Design)

| ID | Rule |
|----|------|
| **BD-06 / BR-18** | **Guest** enter Owner URL khác → **replace** Active Owner (mọi hop: luôn Owner **cuối**) |
| **BD-08 / BR-20** | **Logged in Self = A** enter Owner URL B → Active Owner **vẫn = A** |
| **SoT §6** | Identity Created / Login → Transfer Self; Logout → deactivate |
| **BD-00** | Lifecycle Authority = Platform Identity (Subject Owner = User) |
| **PI-10** | Navigation Context = **runtime projection** — không = Authority |

**Cấm Design:** Đẻ BR mới · đổi Scope sang Phase 5 Writer/AR · kết luận `isLoggedIn` skip = bug · để NC tự quyết business transition.

---

# 0.1 Khóa responsibility — Candidate ≠ Active Owner

```text
Incoming Owner URL
        ↓
Path Capture → Candidate (Public Identity reference)     ← ≠ Active Owner
        ↓
Lifecycle Authority (pnc-lifecycle) quyết định Transition
        ↓
Active Owner (business) cập nhật theo Rule BD-06 / BD-08
        ↓
Navigation Context = projection phản ánh Active Owner     ← không tự quyết
```

**Cấm hiểu:**

```text
Sai:  Incoming URL → Active Owner
Đúng: Incoming URL → Candidate → Lifecycle quyết định → Active Owner → NC mirror
```

Path Capture (`affiliate-resolver`) trong Phase 4 **chỉ** cung cấp candidate (emit) — **không** đồng nghĩa Active Owner. Persist Attribution vẫn AS-IS (Phase 5 demote Authority).

---

# 1. Mapping Audit → Solution → SoT

| Gap / Transition | Disposition | Design action |
|------------------|-------------|-----------------|
| **T1** Guest attach B | ✅ AS-IS | Lifecycle `create` projection khi `!existing` |
| **T2** Guest A → URL B replace | ❌ P4-G01 | **Fix** — Lifecycle `replaceGuestOwner` |
| **T2+** Guest A→B→C→D→E | BD-06 | Mỗi hop replace → Active = **cuối** (E) |
| **T3** Register → Self | ✅ hướng | Keep `onSessionEstablished` register |
| **T4** Login → Self | ✅ hướng | Keep `onSessionEstablished` login |
| **T5** Logged-in A · URL B | ✅ BD-08 | **Keep** `isLoggedIn() return` — verify only |
| **T6** Logout deactivate | ✅ hướng | Keep `onLogout` |
| **P4-G02** | CLOSED | Không sửa như bug |
| **P4-G03** Capture persist AR | Defer | Phase 5/9 — Capture vẫn = candidate signal |
| **P4-G04** Lifecycle facade | Minimal | `pnc-lifecycle` = Lifecycle gate; **không** rename file P4 |
| **P4-G05** Vocabulary | Docs/Phase 11 | Comment tối thiểu |
| **P4-G06** Register AR read | Out | Phase 5 |

---

# 2. State Transition Matrix (Lifecycle — khóa trước code)

**Active Owner states (Phase 4):**

| State | Ý nghĩa |
|-------|---------|
| **None** | Không có Active Owner (Guest chưa enter Owner URL · sau Logout) |
| **Guest {X}** | Active Owner = Public Identity X · chưa Authenticated Self |
| **Self {U}** | User đã login · Active Owner = Public Identity của user U |

**Event Source (ai được phép phát sinh transition):**

| Event | Source (được phép) | Entry API Lifecycle | Cấm gọi từ |
|-------|--------------------|---------------------|------------|
| enter Owner URL (Candidate) | **Path Capture** → bridge → Lifecycle · **cũng** khi history popstate re-parse pathname | `onIncomingReferrer` → `replaceGuestOwner` / `create` | Page · Writer · Share · AR `readActive` · NC trực tiếp |
| Register → Self | **Auth** (session established, reason register) | `onSessionEstablished` | Capture · Writer |
| Login → Self | **Auth** (session established, reason login) | `onSessionEstablished` | Capture · Writer |
| Logout → None | **Auth** | `onLogout` | Capture · Writer |

`replaceGuestOwner` / `replaceProjection` **không** phải public product API cho page — chỉ Lifecycle gate sau Candidate từ Path Capture (hoặc test harness).

**Allowed transitions (Lifecycle Authority quyết định):**

| # | Current State | Event | Source | Next State | Neo |
|---|---------------|-------|--------|------------|-----|
| 1 | None | enter Owner URL B | Path Capture | Guest B | BD-06 · T1 |
| 2 | Guest A | enter Owner URL B (B ≠ A) | Path Capture | Guest B | BD-06 · T2 · last-wins |
| 3 | Guest B | enter Owner URL C (…→E) | Path Capture | Guest C (…→E) | BD-06 · T2c |
| 4 | Guest B | Register → Self C | Auth | Self C | SoT §6 · T3 |
| 5 | Guest B | Login tài khoản A | Auth | Self A | SoT §6 · T4 |
| 6 | Self C | Logout | Auth | None | SoT §6 · T6 |
| 7 | Self C | enter Owner URL D | Path Capture | **Self C** (no-op) | BD-08 · T5 |
| 8 | Guest B | Refresh trên Owner URL B | Path Capture + session mirror | Guest B | Representation bền |
| 9 | Guest B | History Back/Forward → Owner URL A | Path Capture (re-parse pathname) | Guest A | URL ↔ Active đồng bộ |
| 10 | None (tab mới) | Deep link / mở Owner URL B | Path Capture | Guest B | Không phụ thuộc tab cũ |

**Cấm (bất kỳ implementation nào đi vào đây = FAIL Phase 4):**

| Current | Event | Next (cấm) | Lý do |
|---------|-------|------------|-------|
| Self C | enter Owner URL D | Guest D | BD-08 — không hạ Self xuống Guest vì URL |
| Self C | enter Owner URL B | Self B | BD-08 — không đổi Self sang Owner của URL khác |
| Self C | enter Owner URL D | None | Không deactivate chỉ vì mở Owner URL |
| Guest A | enter Owner URL B | Guest A (giữ first-touch) | Trái BD-06 last-wins |
| None / Guest | (không có Auth Register/Login) | Self * | Self chỉ sau Register/Login |

```text
        enter B          enter C/D/E (last-wins)
None ──────────► Guest B ──────────────► Guest E
                   │
                   │ Register/Login (Auth)
                   ▼
                 Self U ──enter Owner X──► Self U (giữ)
                   │
                   │ Logout (Auth)
                   ▼
                 None
```

Step 3 **chỉ** được hiện thực hóa các mũi tên Allowed; Verification Step 4 bắt buộc chứng minh không đi vào hàng Cấm.

---

# 3. Target behavior (Lifecycle only)

```text
onIncomingOwnerCandidate(candidatePublicId):   // Candidate ≠ Active Owner
  if !candidate → return
  if isLoggedIn() → return                     // BD-08 — Lifecycle quyết định: không apply
  if !getProjection() →
       Lifecycle → NC.create(guest, candidate) // T1 — Active := candidate
  if getProjection().owner == candidate → return
  // Guest (hoặc chưa authenticated self): BD-06 — luôn replace
  Lifecycle.replaceGuestOwner(candidate, reason=enter_owner_url)
       → NC.replaceProjection(...)             // chỉ mirror; không tự quyết
```

```text
onSessionEstablished(user):
  selfId = Public Identity của user (AS-IS field)
  Lifecycle → transfer|create authenticated self   // T3 · T4

onLogout:
  Lifecycle → NC.deactivate                        // T6
```

---

# 4. Implementation approach (Modify existing — CG)

**Quyết định engineering:** Modify `pnc-lifecycle.js` (Lifecycle Authority runtime) + thin **projection update** trên `navigation-context.js`.  
**Không** tạo `PlatformIdentityManager.js` (CG-011/012).

### 3.1 Responsibility split (Review A — bắt buộc)

| Layer | Owns | Không được |
|-------|------|------------|
| **Lifecycle** (`IfluxPncLifecycle`) | Quyết định Transition: attach · **replaceGuestOwner** · transfer Self · deactivate; enforce BD-06/08 | — |
| **Navigation Context** | **Projection only**: `create` · `replaceProjection` · `transfer` · `deactivate` — phản ánh Active Owner | **Tự quyết** business replace / BD |

```text
IfluxPncLifecycle.replaceGuestOwner(candidateId, opts)
        ↓  (business decision BD-06)
IfluxNavigationContext.replaceProjection({ ownerPublicId, state: 'guest', source, … })
```

**Cấm:** Đặt `NavigationContext.replaceOwner()` như Authority transition — NC không “replace Owner” theo nghĩa business.

| Option | Mô tả | Chọn |
|--------|-------|------|
| **A′ (đề xuất)** | Lifecycle.`replaceGuestOwner` → NC.`replaceProjection` | ✅ |
| B | Lifecycle: deactivate + create | Fallback nếu không muốn API projection mới |
| ~~A cũ~~ | NC.`replaceOwner` tự quyết | ❌ Reject — sai PI-10 |

### 3.2 Change `onIncomingReferrer` (Lifecycle)

AS-IS:

```text
if (existing && existing.owner != incoming) return;  // first-touch lock — sai BD-06 Guest
```

TO-BE:

```text
if (existing && existing.owner != incoming)
  → IfluxPncLifecycle.replaceGuestOwner(incoming, { reason: 'enter_owner_url' });
     // internally → NC.replaceProjection(...)
```

Giữ:

```text
if (isLoggedIn()) return;  // BD-08 — business rule, không bug
```

### 3.3 `replaceProjection` (NC — mirror only)

* Cập nhật `ownerPublicId` (+ optional `replaced: { from, at, reason }` session metadata).  
* **Không** đọc `isLoggedIn` / **không** enforce BD-06/08 (caller Lifecycle đã enforce).  
* Guard kỹ thuật tối thiểu: reject invalid publicId shape — không phải Business Rule.

### 3.4 Không đổi

| Module | Lý do |
|--------|-------|
| `auth.js` hooks | T3/T4/T6 đã đúng hướng |
| `affiliate-resolver` persist | P4-G03 → Phase 5; emit = **Candidate** only về mặt Lifecycle |
| `shell-url-writer` | Phase 6 |
| Register AR read | Phase 5 |

---

# 5. Impact / Risk Analysis

| Concern | Impact |
|---------|--------|
| Guest A→B (một hop) | Active Owner = B (BD-06) |
| **Guest A→B→C→D→E** (chuỗi) | Mỗi enter Owner URL mới → Lifecycle replace → Active Owner **luôn = cuối** (E). Đây là behavior mới so với first-touch lock AS-IS — **bắt buộc verify** |
| Logged-in mở link B | Context giữ Self (BD-08); bar có thể lệch Representation → Phase 6 |
| Attribution vs Owner | Candidate/AR storage có thể ≠ Active Owner sau multi-hop Guest — đúng BD-04; Phase 5 |
| Session restore | `restoreSessionIfLoggedIn` ưu tiên Self |
| Writer sync | Sau Lifecycle replace → `syncBarWithOwner` nếu có (không viết Writer mới) |

**Risk — chuỗi Guest (Review B):**

```text
Guest Active=A
  → /IFLB…  → Active=B
  → /IFLC…  → Active=C
  → /IFLD…  → Active=D
  → /IFLE…  → Active=E   // luôn last-wins (BD-06)
```

Nếu implement nhầm first-touch hoặc “chỉ replace một lần” → FAIL BRD.

---

# 6. File Inventory (Step 3)

| File | Action | Diff ý |
|------|--------|--------|
| `User_Web/iflux-web-ui/runtime/pnc-lifecycle.js` | **Modify** | `replaceGuestOwner` (Lifecycle decision) · `onIncomingReferrer` dùng nó · BD-06/08 comments · giữ `isLoggedIn` skip |
| `User_Web/iflux-web-ui/runtime/navigation-context.js` | **Modify** | `replaceProjection` (**mirror only** — không business replace) |
| `User_Web/iflux-web-ui/runtime/pnc-shell-bridge.js` | Verify only | Candidate event wiring |
| `User_Web/iflux-web-ui/auth.js` | Verify only | T3/T4/T6 |

**Không tạo file mới.**

---

# 7. Rollback Strategy

1. Revert 2 file JS.  
2. Không migration DB.  
3. Session field optional `replaced` — rollback = revert code / clear `iflux_pnc_domain_v1`.

---

# 8. Out of Scope (cấm trôi vào Step 3)

* Demote `readActive` / Register Authority  
* App URL Writer / auth exclusion  
* Rename symbols / PlatformIdentityManager  
* Đổi SEO / Attribution ledger  
* Thay BD-08 · để NC owns Lifecycle  

---

# 9. Verification Plan (preview Step 4)

| ID | Case | Expect |
|----|------|--------|
| V-T1 | Guest sạch → `/IFLB/…` | Active Owner = B |
| V-T2 | Guest A → `/IFLB/…` | Active Owner = B |
| **V-T2c** | Guest A→B→C→D→E (chuỗi Owner URL) | Active Owner = **E** (last-wins BD-06) |
| V-T3 | Guest B → Register | Active = Self |
| V-T4 | Guest B → Login A | Active = A |
| V-T5 | Login A → `/IFLB/…` | Active = A |
| V-T6 | Logout | Deactivated |
| V-DA | Logged-in không đi vào `replaceGuestOwner` | Evidence path |
| V-CAN | Candidate emit ≠ Active trước Lifecycle | Evidence: Capture/event vs Context sau Lifecycle |
| V-RESP | NC không chứa `isLoggedIn` / BD trong `replaceProjection` | Evidence code |
| V-SM | Không xảy ra Self→Guest / Self→Self(khác) / Guest first-touch lock | So với bảng Cấm §2 |
| **V-B1…B6a–d** | Business State — expect tường minh (Back→A, Forward→B, Refresh giữ, Deep link parse) | [`09`](09-Phase-04-Step4-Verification-Audit.md) §3 |
| **V-B7** | **BR:** chỉ Lifecycle Authority mutate Active Owner · Evidence AS-IS: sole caller = `pnc-lifecycle` (không khóa tên file như BR) | [`09`](09-Phase-04-Step4-Verification-Audit.md) §3.2 |
| **P6-V-B*** | Business Representation — href/menu/widget | **Phase 6** |

---

# 10. AC Design (Gate Owner)

| AC | Tiêu chí | Pass |
|----|----------|------|
| AC-D1 | Design map đủ T1–T6 + BD-06/08 | ✅ |
| AC-D2 | P4-G01: Lifecycle.`replaceGuestOwner` → NC.`replaceProjection` (không NC owns replace) | ✅ |
| AC-D3 | P4-G02 không bị “fix” như bug | ✅ |
| AC-D4 | P4-G03 deferred; **Candidate ≠ Active Owner** khóa trong Design | ✅ |
| AC-D5 | File Inventory + Rollback | ✅ |
| AC-D6 | Không BR mới · không Scope creep | ✅ |
| AC-D7 | Không file Platform Identity mới thừa | ✅ |
| AC-D8 | Risk/verify chuỗi Guest A→…→E last-wins | ✅ |
| **AC-D9** | **State Transition Matrix** (§2) khóa Allowed + Cấm — Step 3 chỉ hiện thực hóa Allowed | ✅ Owner 2026-07-29 |

**Design ACCEPT** → mở **Step 3 Implementation**.


---

# 11. Owner Gate — Step 2 → Step 3

Reviewer: **mở Step 3** sau khi tick AC-D1…**D9** trên Design **v1.2**.

**REWORK v1.2:** State Transition Matrix (Allowed + Cấm + diagram).  
**REWORK v1.1:** Responsibility · Candidate≠Active · V-T2c.

**Sau Owner Accept Design →** Step 3 chỉ 2 file JS · code **không** tự quyết transition ngoài §2.

---

## Changelog Design v1.2.1

* Event Source cột (Path Capture · Auth) — ai được phép phát sinh transition.  
* AC-D1…D9 **PASS** · Step 3 mở.

## Changelog Design v1.2

* Thêm **§2 State Transition Matrix** (None / Guest / Self · Allowed · Cấm).  
* AC-D9 · V-SM.  
* Cấm Self→Guest D · Self C→Self B · Guest first-touch giữ A.

## Changelog Design v1.1

* Reject NC.`replaceOwner` như Authority.  
* Lifecycle.`replaceGuestOwner` → NC.`replaceProjection`.  
* Thêm V-T2c / risk A→E.  
* Khóa Candidate ≠ Active Owner.

---

*Phase 4 Step 2 · Implementation Design · **v1.2** · chờ Owner tick AC-D1…D9 → Step 3*
