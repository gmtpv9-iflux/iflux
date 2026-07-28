# Google Authentication Capability — Solution Design (NO CODE)

**Date:** 2026-07-28  
**Rev:** 1.2 — Owner lock + UseCase mỏng · IdentityProof immutable · VerifiedIdentity · Registry · Redirect ownership  
**Phase:** 2 — Solution Design  
**Status:** 🔒 **SOLUTION LOCKED** · Owner APPROVED 2026-07-28 · **NO CODE**  
**Prerequisite:** [00-Architecture-Discovery-Audit.md](00-Architecture-Discovery-Audit.md) 🔒  
**Next:** [02-Delete-Inventory-Migration.md](02-Delete-Inventory-Migration.md) ▶️ Phase 3  
**Affiliate baseline:** `AFFILIATE_GOLDEN` · OD-AFF-01…09 · AC-17

---

## 0. North star

```text
Thiết kế Social Authentication Architecture
để Google (và provider sau) không bao giờ phá Affiliate.
```

Google phase này = **provider đầu tiên** chứng minh architecture — không tối ưu one-off Google.

---

## 1. Authentication hierarchy (OD-SOL-08 ✅ Option A)

```text
Authentication Capability
├── Password
├── OTP
├── Redirect Policy                    ← Authentication OWNS (OD-SOL-12)
└── Social Authentication Capability
        ├── ProviderRegistry           ← OD-SOL-13
        │     ├── GoogleProvider       ← v1 adapter
        │     ├── AppleProvider        ← later
        │     ├── FacebookProvider
        │     └── ZaloProvider
        │
        └── SocialLoginUseCase         ← orchestration only (không God Service)
                │
                ▼
         IdentityProof (immutable)
                │
                ▼
Identity Capability
        ├── VerifierRegistry           ← OD-SOL-13
        │     ├── GoogleIdTokenVerifier → VerifiedIdentity
        │     └── …
        ├── find / create / merge / login
        └── emit IdentityCreated | IdentityAuthenticated
                │
                ├── Session Capability
                ├── Affiliate Attribution (IdentityCreated only)
                └── Notification (consumes Attribution)
```

---

## 2. Layers — chống God Service v2 (OD-SOL-09 amended)

| Layer | Role | Được làm | Cấm |
|-------|------|----------|-----|
| **Provider (Adapter)** | SDK → `IdentityProof` | GIS / Apple SDK… | AR · remember · session · redirect · mutate proof |
| **ProviderRegistry** | `resolve(provider) → Provider` | Đăng ký provider | Business logic |
| **SocialLoginUseCase** | **Orchestration only** | Gọi registry · nhận proof · đọc AR **một lần** · gọi Identity API với proof + referral_code? + remember_me? (remember từ **Page input**) · ủy Session · ủy Redirect | GIS · verify · Attribution write · DB |
| **SocialAuthApplication** (nếu còn tên facade) | Thin entry từ UI | Delegate → UseCase | Không tích lũy logic |
| **Session Capability** | `establishSession` | Token / TTL | AR · GIS |
| **Redirect Policy** | Post-auth navigate | `redirectAfterAuth` | Provider-specific |
| **Identity + VerifierRegistry** | Verify → domain · identity ops | `VerifiedIdentity` → user | GIS UX |

```text
Page UI
  → SocialLoginUseCase.execute({ provider, remember_me })
       → ProviderRegistry.resolve(provider).getProof()   // IdentityProof
       → AR.getCodeForIdentityCreation()                 // UseCase only
       → Identity API({ proof, referral_code?, remember_me? })
       → Session.establish(...)
       → RedirectPolicy.execute(?return=)
```

**Rule:** Application/UseCase **chỉ orchestration**. Business verify / user / affiliate write **không** nằm đây.

---

## 3. IdentityProof — immutable (OD-SOL-10 ✅ + rule)

```text
IdentityProof = {
  provider: string,
  kind: 'id_token' | 'access_token' | 'authorization_code' | 'identity_token',
  value: string,
  meta?: object   // optional, frozen with proof
}
```

**Rules:**

```text
created once by Provider
never mutate
never append
never rewrite
forward only
```

Vi phạm = bug class (token swap / referral smuggling qua proof).

---

## 4. Verifier → VerifiedIdentity (OD-SOL-11 ✅ amended)

Verifier **không** trả User · **không** biết database.

```text
VerifiedIdentity = {
  provider: string,
  subject: string,          // provider user id (sub)
  email?: string,
  email_verified?: boolean,
  display_name?: string,
  raw_claims?: object       // optional debug; not SoT for write
}
```

```text
IdentityProof
  → VerifierRegistry.resolve(provider).verify(proof)
  → VerifiedIdentity
  → IdentityService.find | create | merge | login
  → User + is_new
```

Boundary leak nếu Verifier query/insert `users`.

---

## 5. Registries (OD-SOL-13 ✅)

**Client**

```text
ProviderRegistry.resolve('google') → GoogleProvider
```

**Backend**

```text
VerifierRegistry.resolve('google') → GoogleIdTokenVerifier
```

**Cấm** `switch(provider)` trong UseCase / Identity orchestration. Thêm Apple = register adapter + verifier — **diff orchestration = 0** (ngoài registration line).

AS-IS `social-auth.service.js` đang `switch` — Phase 3/4 **REPLACE** bằng registry (không EXTEND switch).

---

## 6. Redirect Policy ownership (OD-SOL-12 ✅ clarified)

| | |
|--|--|
| **Owner** | **Authentication Capability** |
| **API** | Một: `redirectAfterAuth` / `AuthRedirectPolicy.execute` |
| **Không thuộc** | Session (chỉ establish) · Shell (chỉ URL helper) · Page (chỉ gọi policy) · Google/Provider |
| **Callers** | SocialLoginUseCase · Password login success · OTP success — cùng policy |
| **Cấm** | Per-provider navigate · `google-onetap` self-navigate |

---

## 7. Affiliate isolation (giữ)

| Layer | Biết Affiliate? |
|-------|-----------------|
| Google Provider | **Không** |
| ProviderRegistry | **Không** |
| SocialLoginUseCase | **Chỉ** `getCodeForIdentityCreation` tại Identity contract |
| Identity / Verifier | **Không** (Attribution riêng sau IdentityCreated) |
| AR / Attribution | SoT Affiliate |

AC: AC-GGL-AFF-* · AC-SOC-* (Solution rev 1.1) giữ nguyên.

---

## 8. OQ defaults (đã khóa)

| OD | Quyết định | Status |
|----|------------|--------|
| OD-SOL-01 FedCM | Best-effort · không bar ship | ✅ |
| OD-SOL-02 One Tap | **BỎ** trong rebuild | ✅ |
| OD-SOL-03 WebView | Out of scope v1 | ✅ |
| OD-SOL-04 GIS v1 | Chưa PKCE | ✅ |
| OD-SOL-05 | Google-first implement · Social architecture sẵn | ✅ |
| OD-SOL-06 | Redirect một policy | ✅ |

---

## 9. Owner Decisions — LOCKED

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-SOL-00** | Architecture chấp nhận | ✅ APPROVE |
| **OD-SOL-01** | FedCM default | ✅ APPROVE |
| **OD-SOL-02** | Bỏ One Tap đợt rebuild | ✅ APPROVE |
| **OD-SOL-03** | WebView OOS | ✅ APPROVE |
| **OD-SOL-04** | GIS v1 | ✅ APPROVE |
| **OD-SOL-05** | Google-first | ✅ APPROVE |
| **OD-SOL-06** | Redirect một policy | ✅ APPROVE |
| **OD-SOL-07** | Mở Phase 3 Delete Inventory | ✅ APPROVE (sau lock 08–13) |
| **OD-SOL-08** | Google = provider đầu tiên của Social Auth (Option A) | ✅ APPROVE |
| **OD-SOL-09** | Provider=Adapter · UseCase=orchestration only (không God Service) | ✅ APPROVE |
| **OD-SOL-10** | IdentityProof + **immutable** | ✅ APPROVE |
| **OD-SOL-11** | Verifier → **VerifiedIdentity** (không User/DB) | ✅ APPROVE |
| **OD-SOL-12** | Redirect Policy **owned by Authentication Capability** | ✅ APPROVE |
| **OD-SOL-13** | **ProviderRegistry** + **VerifierRegistry** — cấm switch trong orchestration | ✅ APPROVE |

**PASS Solution:** 🔒 LOCKED. Phase 3 mở. Vẫn **NO CODE** đến Implementation Plan APPROVED (OD-DISC-05).

---

## 10. Non-goals / Next

- Không code trong Phase 2/3 docs.  
- Phase 3: Delete Inventory symbol-level.  
- Phase 4: Implementation Plan + WP + regression vs `AFFILIATE_GOLDEN`.

---

*Solution Design rev 1.2 — LOCKED. Phase 3 Delete Inventory.*
