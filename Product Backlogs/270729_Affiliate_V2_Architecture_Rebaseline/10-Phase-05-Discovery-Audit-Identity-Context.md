# Phase 5 · Step 1 — Discovery Audit (AS-IS)  
## Identity Context Projection

**Date:** 2026-07-29  
**Status:** Step 1 **ACCEPT** (Reviewer) · Allowed Reader Matrix ✅ · Owner Design decisions khóa · tiếp Step 2 [`11-Phase-05-Implementation-Design-Identity-Context.md`](11-Phase-05-Implementation-Design-Identity-Context.md)
  
**Phase:** 5 — Identity Context Projection (P0)  
**Neo Plan:** [`05-Plan.md`](05-Plan.md) · Phase 4 PASS [`09b-Phase-04-Acceptance-PASS.md`](09b-Phase-04-Acceptance-PASS.md)  
**Neo Solution:** §5.2 · §5.4 · §8 · §10 · R-AUTH-01 · R-CAP-01  
**Neo SoT:** BR-03 · PI-10 · PI-15 · BD-05  

**Gate tiếp:** Owner mở Step 2 Implementation Design.

---

# 1. Scope Phase 5

**Trong phạm vi**

| Concern | TO-BE |
|---------|--------|
| Identity Context contract | Một nguồn đọc Active Owner / Public Identity đang hiệu lực |
| Navigation Context | **Runtime projection** (không = User Identity · không = URL state · không = Representation) |
| Register / Social / Login consumers | **Chỉ** đọc Context — hết AR/storage làm Authority |
| Attribution storage | Tối đa Transport / Flag (BD-05) — không Business SoT Identity |

**Ngoài phạm vi**

| Concern | Phase |
|---------|-------|
| Lifecycle Transition / write Active Owner | Phase 4 (PASS) |
| App URL Writer / href / menu Owner URL | Phase 6 |
| Attribution Result ledger / Commission | Phase 9 |
| SEO | Phase 10 |

**Business claim sau Phase 5 PASS:** Mọi capability trong scope **đọc** cùng Active Owner / Identity Context — không dual Authority.  
**Không claim:** mọi link = `/IFLA/…`.

---

# 2. AS-IS — Dual read (evidence)

```text
Navigation / Writer
        ↓
IfluxNavigationContext.getContext().ownerPublicId     ← Active Owner projection

Register / Social / auth body referral
        ↓
IfluxAffiliateResolver.getCodeForIdentityCreation()
        ↓
readActive() → LS iflux_aff_context_v1  OR  cookie/LS iflux_ref_code
```

Neo Audit: **R-AUTH-01** · **R-CAP-01**.

---

# 3. Ownership / consumers (AS-IS)

| Consumer | Đọc gì hôm nay | Vai trò AS-IS | TO-BE Phase 5 |
|----------|----------------|---------------|---------------|
| `shell-url-writer.js` | `IfluxNavigationContext.getContext()` | Consume projection | Keep (Representation = Phase 6) |
| `pnc-lifecycle.js` | `getContext()` | Lifecycle write path | Keep (Phase 4) |
| `auth-register-init.js` | `AR.getCodeForIdentityCreation` · `isPathCapturedAttribution` | Identity/referral UI Authority qua AR | **Đọc Context** (Active Owner) |
| `social-login-usecase.js` | `AR.getCodeForIdentityCreation` | referral body | **Đọc Context** |
| `auth.js` | `AR.getCodeForIdentityCreation` · `clearContext` | register/social code + clear storage | **Đọc Context**; clear = transport only |
| `loyalty-affiliate-store.js` | `AR.getCodeForIdentityCreation` | LAS referral helper | **Đọc Context** hoặc Attribution Result (không Identity Authority) |

---

# 4. Evidence chi tiết

## 4.1 Register — AR làm Authority (Gap P5-G01)

**File:** `User_Web/iflux-web-ui/auth-register-init.js`  
`getCodeForIdentityCreation()` / path flag — không đọc `IfluxNavigationContext`.

## 4.2 Social — AR (Gap P5-G02)

**File:** `social-auth/social-login-usecase.js` — cùng AR API.

## 4.3 auth.js referral helper (Gap P5-G03)

**File:** `auth.js` ~452 — `getCodeForIdentityCreation` cho body; `clearContext` sau success.

## 4.4 AR `readActive` = storage Authority path (Gap P5-G04)

**File:** `runtime/affiliate-resolver.js`  
`readActive` = CTX LS **hoặc** cookie/LS fallback — dual với PNC (R-AUTH-01).

## 4.5 Writer đã đọc Context (Partial OK)

**File:** `shell-url-writer.js` `getOwnerPublicId()` → `getContext()` — đúng hướng consume; verify Representation = Phase 6.

## 4.6 Không có Identity Context contract công khai

Không có API kiểu `IfluxIdentityContext.getActiveOwner()` — consumers biết PNC vs AR riêng (Gap P5-G05 semantic/contract).

---

# 5. Dual Authority / Shadow / Legacy

| ID | Pattern | Evidence |
|----|---------|----------|
| **P5-DA-01** | Nav/Writer đọc PNC; Register/Social đọc AR | R-AUTH-01 · R-CAP-01 |
| **P5-DA-02** | `readActive` cookie/LS fallback ≠ path capture | Audit Register pack |
| **P5-SH-01** | Storage mang business meaning Identity cho Register | BD-05 conflict |
| **P5-LG-01** | Naming `getCodeForIdentityCreation` / Affiliate Resolver | Phase 11 optional |

---

# 6. Gap list

| ID | Severity | Gap | TO-BE | Scope |
|----|----------|-----|-------|-------|
| **P5-G01** | P0 | Register prefill/lock/body từ AR | Đọc Active Owner từ Identity Context / NC | In |
| **P5-G02** | P0 | Social body từ AR | Đọc Context | In |
| **P5-G03** | P0 | auth.js referral helper từ AR | Đọc Context | In |
| **P5-G04** | P0 | `readActive` dual storage Authority | Demote → Transport/Flag; Identity read ≠ AR | In (boundary) |
| **P5-G05** | P1 | Thiếu contract đọc Active Owner thống nhất | Một read API / convention (modify existing — không module mới thừa) | In Design |
| **P5-G06** | P2 | LAS vẫn AR | Map Context hoặc Attribution-only | Design |
| **P5-G07** | — | Writer href Owner URL | **Out → Phase 6** | Out |

---

# 7. File Inventory (candidates Step 2)

| File | Touch Phase 5? |
|------|----------------|
| `auth-register-init.js` | **Yes** |
| `social-auth/social-login-usecase.js` | **Yes** |
| `auth.js` (referral read/clear) | **Yes** (minimal) |
| `runtime/affiliate-resolver.js` | Maybe — demote read path / document Transport |
| `loyalty-affiliate-store.js` | Maybe |
| `runtime/navigation-context.js` | Read API only nếu Design thêm helper trên existing |
| `runtime/shell-url-writer.js` | **No** (Phase 6) |
| `runtime/pnc-lifecycle.js` | **No** mutate (Phase 4) |

---

# 8. Mapping → Solution / SoT

| Gap | Solution | SoT |
|-----|----------|-----|
| P5-G01…03 | §5.2 · §5.4 consumers đọc Context | PI-15 · BR-03 |
| P5-G04 | Roles: storage Transport | BD-05 · BR-08 boundary |
| P5-G05 | Identity Context contract | PI-10 NC = projection |

---

# 10. Allowed Reader Matrix (bổ sung Reviewer — chuẩn review Phase 5)

| Capability | Được đọc (TO-BE) | Không được đọc (Forbidden) |
|------------|------------------|----------------------------|
| Register | Identity Context (Active Owner) | `AR.readActive` · cookie · LS attribution · parse URL ad-hoc làm Authority |
| Social | Identity Context | cookie · LS · `AR.readActive` / `getCodeForIdentityCreation` |
| Auth (referral body helper) | Identity Context | LS · cookie · AR storage Authority |
| Writer | Identity Context (qua contract hoặc tương đương) | URL bar làm Authority · AR storage |
| Widget / app consumers cần Owner | Identity Context | cookie · sessionStorage attribution · AR |
| Share | Identity Context (owner của người share — concern Share; không AR storage Authority) | sessionStorage / cookie làm Identity SoT |
| LAS | Identity Context **hoặc** Attribution Result (sau khi Result xác lập) — **không** AR làm Identity Authority | `readActive` như Owner |
| Lifecycle | NC projection (write path Phase 4) | — |

**Review sau implement:** grep Forbidden APIs trên callers Register/Social/Auth/Widget — vi phạm = FAIL Phase 5.

---

# 11. Câu hỏi Design — **Owner chốt** (2026-07-29)

| # | Câu hỏi | Owner Decision |
|---|---------|----------------|
| 1 | Register đọc thẳng PNC hay helper? | **Thin helper** `IdentityContext.getActiveOwner()` → NC — Register **không** biết NavigationContext |
| 2 | `getCodeForIdentityCreation`? | **Không proxy** — deprecate → callers đổi IdentityContext → **xóa API** |
| 3 | `isPathCapturedAttribution`? | **Giữ** = **Transport Flag** only — **không bao giờ** quyết định Owner |

---

# 12. Step 1 Acceptance

| Check | Status |
|-------|--------|
| Scope = Context read / dual Authority | ✅ |
| Evidence Register/Social/AR | ✅ |
| Out of scope Writer rõ | ✅ |
| Allowed Reader Matrix | ✅ (bổ sung) |
| Owner Design decisions §11 | ✅ |
| Không code | ✅ |

**Step 1 COMPLETE · ACCEPT (Reviewer).** → Step 2 Design [`11-Phase-05-Implementation-Design-Identity-Context.md`](11-Phase-05-Implementation-Design-Identity-Context.md).

---

*Phase 5 Step 1 · Discovery ACCEPT · 2026-07-29*
