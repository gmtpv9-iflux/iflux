# Phase 4 · Step 1 — Discovery Audit (AS-IS)  
## Platform Identity Lifecycle Authority

**Date:** 2026-07-29  
**Program:** Affiliate V2 Architecture Re-baseline  
**Phase:** 4 — Platform Identity Lifecycle Authority (P0)  
**Step:** 1 Discovery Audit — **DONE** (docs only · **không code**)  
**Neo Plan:** [`05-Plan.md`](05-Plan.md) §2 Execution Rule · Phase 4  
**Neo Solution:** [`04-Solution.md`](04-Solution.md) §5.1 · §6 · BD-00 · BD-06  
**Neo SoT:** [`02-SoT.md`](02-SoT.md) §6 · BR-16 · BR-18 · PI-13 · PI-19  
**Evidence base:** [`00-Audit-Context.md`](00-Audit-Context.md) §D + re-verify runtime 2026-07-29  

**Gate tiếp:** Owner mở **Step 2 — Implementation Design** (không Design/Code trước Gate).

---

# 1. Scope Step 1 (Phase 4 only)

**Trong phạm vi**

| Concern | TO-BE (Solution / SoT) |
|---------|------------------------|
| Enter Owner URL | Business Event → Lifecycle Authority gắn / **replace** Active Owner (BD-06) |
| Identity Created | Event kích hoạt Transition Guest→Self (Platform Identity) |
| Login | Event kích hoạt Transition — **không** tạo Identity Authority |
| Logout | Deactivate Owner Context theo Rule |
| Path Capture | **Candidate / lookup input only** — không Authority |

**Ngoài phạm vi Phase 4** (ghi nhận, không Design ở Step 1)

* Identity Context contract đầy đủ / Register đọc AR (→ Phase 5)  
* App URL Writer / preserve Owner trên mọi link (→ Phase 6)  
* Share decorate (→ Phase 7) · Parse hợp nhất (→ Phase 8) · Attribution ledger (→ Phase 9)

---

# 2. AS-IS Lifecycle map (evidence)

```text
Guest mở /IFL{sharer}/…
        │
        ▼
affiliate-resolver.resolve()          ← Path Capture + Attribution persist
  → storeAttribution + storeContextOnce
  → emit iflux-incoming-referrer
        │
        ▼
pnc-shell-bridge → pnc-lifecycle.onIncomingReferrer
  → NavigationContext.create(ownerPublicId=sharer)   ← chỉ khi CHƯA có context
  → nếu isLoggedIn(): return (bỏ qua incoming)       ← **khớp BD-08** (không bug)
  → nếu đã có Owner Guest khác: return (KHÔNG replace) ← lệch BD-06 Guest (P4-G01)
        │
        ▼
(parallel) Register/Social → AR.getCodeForIdentityCreation  ← Authority path riêng (Phase 5)
        │
        ▼
Identity Created (server) → referred_by
        │
        ▼
auth.js → IfluxPncLifecycle.onSessionEstablished
  → NavigationContext.transfer|create(self)          ← Guest→Self OK hướng
        │
        ▼
Logout → onLogout → NavigationContext.deactivate     ← OK hướng
```

---

# 3. Ownership hiện tại (AS-IS)

| Concern | Module / API | Vai trò AS-IS | TO-BE Phase 4 |
|---------|--------------|---------------|---------------|
| Path Capture / parse Owner URL | `runtime/affiliate-resolver.js` `resolve` · `parseAffiliatePath` | Capture + **persist Attribution** + emit event | Transport / candidate only |
| Emit enter Owner | `iflux-incoming-referrer` · `__IFLUX_INITIAL_CONTEXT_EVENT__` | Bridge input | Candidate signal |
| Bridge | `runtime/pnc-shell-bridge.js` | Forward → lifecycle | Keep as wiring |
| Enter / create / ignore replace | `runtime/pnc-lifecycle.js` `onIncomingReferrer` | **De-facto Lifecycle gate** nhưng **first-touch lock** | Platform Identity Lifecycle — **replace** (BD-06) |
| Session transfer | `pnc-lifecycle.js` `onSessionEstablished` ← `auth.js` | Transfer/create self | Keep event trigger; Authority = Platform Identity rule |
| Logout | `pnc-lifecycle.js` `onLogout` ← `auth.js` | Deactivate | Keep |
| Domain store | `runtime/navigation-context.js` | create / transfer / deactivate + sessionStorage | Mirror / Temporary (Phase 5 chi tiết) |
| Self Public Id | `user.referral_code` via `selfPublicId()` | Field storage AS-IS | Public Identity representation (semantic Phase 11) |
| Auth | `auth.js` | Gọi lifecycle — **không** own Identity store | Event trigger only ✅ hướng |

**Kết luận owner AS-IS:** Không có module tên “Platform Identity Lifecycle Authority”. **PNC lifecycle + Affiliate Resolver** đang chia việc Transition / Capture; Resolver còn mang Attribution Authority side-effect.

---

# 4. Evidence chi tiết

## 4.1 Enter Owner URL — không replace (Gap P4-G01 · BD-06)

**File:** `User_Web/iflux-web-ui/runtime/pnc-lifecycle.js`  
**Hàm:** `onIncomingReferrer`

```text
if (existing) {
  if (existing.ownerPublicId === incoming) return;
  return;   // ← có Owner A, vào Owner URL B → KHÔNG đổi
}
```

**Quan sát:** First-touch lock trên Navigation Context.  
**TO-BE:** BD-06 / BR-18 / PI-19 — replace Active Owner Context ngay; Attribution xử lý riêng.

## 4.2 Enter Owner URL khi đã login — bỏ qua path (**không** mặc định = bug · BD-08)

**Cùng hàm:** `if (isLoggedIn()) return;`

**Quan sát:** User đã login không nhận Transition từ Owner URL incoming.  
**Business Rule (Owner Accept 2026-07-29):** **BD-08 / BR-20 / PI-21** — Logged in Self = A mở Owner URL B → Active Owner **vẫn = A**.  

**Kết luận Discovery (amended):** Hành vi `isLoggedIn() → không replace` **khớp BD-08** nếu Self đã xác lập. **Không** ghi là bug chỉ từ hiện tượng này.  

**Việc còn lại:** Verify matrix đầy đủ (bảng Transition §4.7) — implementation có đúng **toàn bộ** rule Guest vs Self hay không (Gap chỉ còn chỗ lệch Guest replace / Transfer / Logout).

---

## 4.7 Transition matrix — AS-IS vs Rule (BD-06 · BD-08 · SoT §6)

| # | Transition (Business) | Rule | AS-IS evidence | Match? |
|---|----------------------|------|----------------|--------|
| T1 | Guest · chưa Owner · mở Owner URL B | Active = B | `onIncomingReferrer` → `create(B)` khi `!existing` | ✅ |
| T2 | Guest · Owner A · mở Owner URL B | Active = B (replace BD-06) | `existing` khác B → `return` | ❌ **P4-G01** |
| T3 | Guest · Owner B · Đăng ký → Self | Active = Self | `onSessionEstablished` reason register → `transfer(self)` | ✅ hướng |
| T4 | Guest · Owner B · Login A | Active = A | `onSessionEstablished` reason login → `transfer(A)` | ✅ hướng |
| T5 | Logged in Self A · mở Owner URL B | Active = A (BD-08) | `isLoggedIn() return` | ✅ **không bug** |
| T6 | Logout | Deactivate | `onLogout` → `deactivate` | ✅ hướng |

**P4-G02 (cũ):** Đổi disposition → **CLOSED / Not a defect** dưới BD-08. Thay bằng verify-only checklist T5 ở Step 4 Verification.

## 4.3 Path Capture ≠ candidate only (Gap P4-G03)

**File:** `runtime/affiliate-resolver.js` `resolve()`

* `storeAttribution(publicId)`  
* `storeContextOnce(resolved)` → LS `iflux_aff_context_v1` (+ cookie/LS fallback qua `readActive`)  
* `emitInitialContextEvent`

**Quan sát:** Path Capture **vừa** signal PNC **vừa** ghi Attribution storage mang business read path (Register).  
**TO-BE Phase 4:** Capture = candidate/lookup. Demote storage-as-Authority thuộc Phase 5/9 — Phase 4 Design phải **không phá** boundary nhưng **không** mở rộng Scope Phase 5 trừ khi Owner mở rộng.

## 4.4 Identity Created / Login transfer (Partial OK · Gap P4-G04 semantic)

**Files:** `auth.js` (~907) → `onSessionEstablished` · `pnc-lifecycle.js` transfer/create self  

**Quan sát:** Login/Register session → chuyển PNC sang `self` (`referral_code`). Hướng Guest→Self **đúng event**.  
**Gap:** Auth/PNC là implementation owner; chưa có Platform Identity Authority layer; Register vẫn có thể đọc AR song song (Phase 5).  
**Login ≠ Identity Authority:** Auth chỉ gọi lifecycle — **không** tự set Owner ngoài hook — Partial PASS hướng BD-00 Login principle.

## 4.5 Logout (Partial OK)

**Files:** `auth.js` (~1468) → `onLogout` → `NavigationContext.deactivate`  

**Quan sát:** Deactivate context khi logout — khớp hướng Solution §6.  
**Gap:** Naming/ADR PNC; không có Platform Identity facade.

## 4.6 Dual Authority / Shadow / Legacy (trong scope Lifecycle)

| ID | Pattern | Evidence |
|----|---------|----------|
| **P4-DA-01** | Transition enter: PNC first-touch vs BD-06 replace | `onIncomingReferrer` early return |
| **P4-DA-02** | Capture path vs Lifecycle path | Resolver persist AR **và** emit PNC |
| **P4-DA-03** | Client identity read dual (nav vs attribution) | PNC `ownerPublicId` · AR `readActive` — neo R-AUTH-01 / R-CAP-01 (chủ yếu Phase 5) |
| **P4-SH-01** | Shadow: không Platform Identity module | Lifecycle nằm rải `pnc-lifecycle` + `affiliate-resolver` + `auth.js` hooks |
| **P4-LG-01** | Legacy ADR-AFF-007 / “Incoming Referrer” naming | Comment header `pnc-lifecycle.js` |
| **P4-LG-02** | Logged-in ignore Owner URL | `isLoggedIn() return` — **conform BD-08** (không legacy bug) |

---

# 5. Gap list (Phase 4)

| ID | Severity | Gap | Neo TO-BE | Ghi chú Scope |
|----|----------|-----|-----------|---------------|
| **P4-G01** | P0 | Enter Owner URL B khi đang A **không replace** | BD-06 · BR-18 · PI-19 · Solution §6 | **In scope** Step 2–3 |
| **P4-G02** | — | ~~Logged-in ignore incoming~~ | BD-08 | **CLOSED** — khớp BR; verify T5 ở Step 4 |
| **P4-G03** | P0 | Path Capture persist Attribution như Authority side-effect | Path Capture = candidate only | Phase 4: tách signal lifecycle khỏi authority persist **hoặc** giới hạn Design “capture emits candidate only”; full AR demote → Phase 5/9 |
| **P4-G04** | P1 | Không có Platform Identity Lifecycle Authority rõ (facade/policy) | BD-00 · Solution §5.1 | **In scope** — có thể = rewrite ownership `pnc-lifecycle` thành Lifecycle gate map SoT (không rename bắt buộc ở P4) |
| **P4-G05** | P1 | Vocabulary “referrer / affiliate-resolver” trên enter path | Public Identity candidate | Docs/Phase 11; runtime comment tối thiểu nếu đụng file |
| **P4-G06** | P2 | Dual read Register AR (liên quan Identity Created) | Consumers đọc Context | **Out → Phase 5** (ghi nhận only) |

---

# 6. File Inventory (AS-IS — candidates cho Step 2)

| File | Role AS-IS | Touch Phase 4? |
|------|------------|----------------|
| `User_Web/iflux-web-ui/runtime/pnc-lifecycle.js` | Enter / session / logout gate | **Yes** — primary |
| `User_Web/iflux-web-ui/runtime/navigation-context.js` | Domain create/transfer/deactivate | Likely (API replace?) |
| `User_Web/iflux-web-ui/runtime/pnc-shell-bridge.js` | Event wiring | Maybe |
| `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | Capture + AR persist + emit | **Yes** nếu demote capture side-effect trong P4 |
| `User_Web/iflux-web-ui/auth.js` | Session/logout hooks | Verify only / minimal |
| `User_Web/iflux-web-ui/runtime/shell-url-writer.js` | Decorate sau context | **Out** Phase 6 (verify không phá) |

---

# 7. Mapping Audit → Solution → SoT (preview — không phải Design)

| Gap | Solution | SoT |
|-----|----------|-----|
| P4-G01 | §6 Guest Enter Owner URL → replace | BR-18 · PI-19 · §6.2 · BD-06 |
| P4-G02 | CLOSED — BD-08 Self precedence | BR-20 · PI-21 |
| P4-G03 | Path Capture = Transport / candidate | §5.3 · BD-00 |
| P4-G04 | §5.1 Lifecycle Authority = Platform Identity | BR-16 · PI-13 |

**Cấm Step 1:** Không đề xuất API mới / file mới ngoài việc liệt kê gap.

---

# 8. Step 1 Acceptance (Discovery)

| Check | Status |
|-------|--------|
| Phạm vi = Lifecycle Authority only | ✅ |
| Evidence file/API có path | ✅ |
| Owner AS-IS xác định | ✅ |
| Dual / Shadow / Legacy ghi nhận | ✅ |
| Gap list có severity + scope in/out | ✅ |
| Transition matrix T1–T6 vs BD-06/08 | ✅ (amended) |
| Không code | ✅ |
| Không đẻ Business Rule | ✅ |

**Step 1 kết luận:** Discovery Audit **COMPLETE** (amended BD-08).  

**Gate Step 2:** Owner đã chốt BD-08 → Design trên Guest replace / Self precedence.

---

# 9. Đề nghị Owner (Gate) — cập nhật

1. ✅ BD-08 Accepted — Self login không replace.  
2. ✅ Mở Step 2 Implementation Design trên rule này.  
3. Design mặc định: **P4-G01 in scope**; P4-G03 demote tối thiểu / defer Phase 5 trừ khi Owner mở rộng.

---

## Amendment log

| Ngày | Thay đổi |
|------|----------|
| 2026-07-29 | BD-08 · P4-G02 CLOSED · Transition matrix T1–T6 · refine BD-06 Guest-only |

---

*Phase 4 Step 1 · Discovery only · amended BD-08 · 2026-07-29*
