# Google Authentication Capability — Discovery Audit (AS-IS)

**Date:** 2026-07-28  
**Rev:** 1.2 — Out of Scope / Open Questions + Owner lock OD-DISC  
**Status:** 🔒 **DISCOVERY LOCKED** · Owner APPROVED 2026-07-28 · **NO CODE**  
**Freeze baseline:** `AFFILIATE_GOLDEN` · `affiliate-e2e-pass-20260728` · commit `b539a95` · branch `release/affiliate-golden`  
**Work branch (chưa implement):** `feature/google-login-rebuild`  
**ECG:** CG-005 · CG-030 — Discovery đóng; Phase 2 Solution Design mở  
**Next:** [01-Solution-Design-Google-Authentication-Capability.md](01-Solution-Design-Google-Authentication-Capability.md)

**Related evidence:**  
- [10-Google-Login-Affiliate-Runtime-Trace-Audit.md](../Affiliate%20Attribution%20Capability/10-Google-Login-Affiliate-Runtime-Trace-Audit.md)  
- [09-Code-Regression-Audit-After-Google-Login.md](../Affiliate%20Attribution%20Capability/09-Code-Regression-Audit-After-Google-Login.md)

---

## 0. Phạm vi Discovery (LOCKED)

### Discovery trả lời

```text
Hệ thống hiện tại đang như thế nào?
```

- Inventory  
- Ownership (AS-IS)  
- Runtime (AS-IS)  
- Dependency / Coupling  
- Existing problems (có evidence)  
- **Capability Boundary** của Google Authentication (SoT ranh giới — Owner lock)  
- **Vì sao** Google Login phải tồn tại như Capability riêng (từ evidence AS-IS)

### Discovery không trả lời

```text
Hệ thống nên như thế nào?
```

**Cấm trong file này:** Solution Design · module split · migration · REPLACE/EXTEND · work package · chọn `prompt` / `renderButton` / OAuth2 · kiến trúc TO-BE · “capability chain” implement.

```text
CẤM sửa bất kỳ dòng code nào
cho đến khi Owner duyệt Discovery
VÀ mở riêng phase Solution Design
VÀ mở riêng phase Plan
VÀ mở riêng phase Implement.
```

---

## 1. Capability Boundary — Google Authentication (SoT ranh giới)

> Đây là **ranh giới capability** (Owner SoT), không phải Solution Design module.  
> Dùng để phân biệt “Google làm gì” vs “thứ khác làm gì” khi đọc AS-IS.

### 1.1 Trách nhiệm duy nhất (client boundary)

```text
Browser
   │
   ▼
Google SDK (GIS)
   │
   ▼
id_token
```

**Hết (phía client).**  
Google Authentication Capability chỉ chịu trách nhiệm lấy **proof of Google identity** (`id_token`) từ Google SDK trong browser.

**Lưu ý Owner (OD-DISC-02):**  
- **Client boundary** = §1.1 (Browser → SDK → `id_token`).  
- **Verify `id_token`** (chữ ký Google · audience · expiry) thuộc **Identity backend** — không thuộc Google Capability client, không thuộc Affiliate.

### 1.2 Google không được biết / không được sở hữu

| Concern | Thuộc capability khác |
|---------|------------------------|
| Verify `id_token` (server) | Identity backend |
| Session / JWT / `establishSession` | Session / Auth |
| Redirect sau login | Shell / Auth page policy |
| Affiliate Context / `referral_code` / Attribution | Affiliate |
| User create / link / profile | Identity |
| Password | Password |
| OTP / email verify | OTP / Register |
| Notification / ReferralCreated emit | Notification / Attribution |

### 1.3 Vì sao Google Login phải tồn tại như Capability riêng?

Không chỉ vì “`auth-social.js` là god file”. God file là **triệu chứng**. Lý do capability:

| # | Evidence AS-IS | Hệ quả nếu không tách |
|---|----------------|------------------------|
| 1 | Google proof = **SDK ngoài + credential riêng** (`accounts.google.com/gsi/client` → `response.credential`). Không dùng chung Password/OTP. | Vá Google trong cùng file với Password/Affiliate → regression xuyên capability (đã xảy ra). |
| 2 | **Hai entry GIS** độc lập: `auth-social.js` (icon) + `google-onetap.js` (One Tap) — cùng SDK, khác redirect/Affiliate wiring. | Không có một biên Google → hành vi mobile/desktop/FedCM không thống nhất. |
| 3 | Affiliate SoT đã khóa: Context = AR · Attribution = backend. Google chỉ được **cung cấp id_token** vào Identity contract. | Khi Google layer gọi AR / nhớ remember / redirect → sửa Google = đụng Affiliate (đã chứng minh bằng googleProxy era). |
| 4 | Provider khác (Apple / Facebook / Zalo) dùng **SDK/token khác** nhưng hiện chung file với Google. | Không có Google Capability riêng → không thể thay/sửa Google mà không đụng provider khác + Affiliate. |
| 5 | Freeze `AFFILIATE_GOLDEN` đã tách được **Affiliate regression** khỏi **Google UX fail** trên evidence runtime. | Hai capability khác nhau trên thực tế vận hành — code chưa phản ánh biên đó. |

**Kết luận Discovery:** Google Login **phải** được coi là Capability riêng vì ownership proof (`id_token`) và blast radius đã tách khỏi Affiliate/Password trên evidence — trong khi **code AS-IS vẫn gộp** chúng.

---

## 2. Inventory (AS-IS @ freeze)

### 2.1 File liên quan trực tiếp Google / Social

| File | Lines (freeze workspace) | Vai trò quan sát được |
|------|--------------------------|------------------------|
| `User_Web/iflux-web-ui/auth-social.js` | **322** | GIS Google + Apple/FB/Zalo + UI bind + Affiliate re-read + remember + bridge Auth |
| `User_Web/iflux-web-ui/google-onetap.js` | **147** | GIS One Tap riêng + Affiliate read + redirect/navigate riêng |
| `User_Web/iflux-web-ui/auth.js` | **1662** | `loginWithSocial` · session · Affiliate inject/clear · redirect · password login |
| `User_Web/iflux-web-ui/auth-login-init.js` | (page) | Bind social · Affiliate init · redirect onSuccess · password form |
| `User_Web/iflux-web-ui/auth-register-init.js` | (page) | Tương tự register |
| `User_Web/pages/dang-nhap` / login HTML | — | `#btn-google` icons |
| Backend `auth.routes.js` | — | `POST /auth/social` |
| Backend `auth.service.js` | — | verify social · identity · attribution · password · OTP cùng module |

### 2.2 Symbols trong `auth-social.js` (freeze)

| Symbol | Concern quan sát |
|--------|------------------|
| `resolveSocialApiBase` · `fetchSocialConfigDirect` · `loadConfig` | Config multi-provider |
| `loadScript` | SDK loader dùng chung |
| `initGoogle` · `loginGoogle` | **Google GIS** |
| `loginApple` · `loginFacebook` · `loginZalo` · `handleZaloCallback` | Provider khác |
| `affiliateCodeForSocial` | **Affiliate** |
| `bindSocialButtons` | **UI** + remember + affiliate opts |
| `finishSocialLogin` · `ensureAuth` | Bridge → Session/Identity client |
| `initPage` | Page orchestration |

### 2.3 Symbols Google One Tap

| Symbol / hành vi | Concern |
|------------------|---------|
| GIS `initialize` + `prompt` | Google |
| `getCodeForIdentityCreation` | Affiliate |
| `IfluxAuth.loginWithSocial` | Session/Identity bridge |
| `IfluxHref.navigate` / reload | Redirect (khác path login) |

---

## 3. Ownership map (AS-IS — ai đang cầm gì)

| Concern | Owner đúng (semantic / SoT khác đã khóa) | Owner **thực tế trong code** |
|---------|------------------------------------------|------------------------------|
| Google GIS (icon path) | Google Auth boundary (§1) | `auth-social.js` |
| Google GIS (One Tap) | Google Auth boundary (§1) | `google-onetap.js` (file thứ hai) |
| Apple / Facebook / Zalo | Provider khác | Cùng `auth-social.js` |
| UI icon row bind | Auth page UI | `auth-social.bindSocialButtons` + HTML |
| Affiliate Context read | `affiliate-resolver` | Gọi từ social / onetap / auth / login-init |
| Affiliate Attribution write | Backend Attribution | `auth.service` trong cùng auth module |
| Identity social | Backend Identity | `socialLoginOrRegister` / `createSocialUser` |
| Session | Auth Session | `IfluxAuth.establishSession` + JWT |
| Profile hydrate | Auth | `authMe` sau social |
| Remember me | Session policy | Truyền qua `auth-social` opts |
| Redirect sau login page | Shell / Auth | `redirectAfterAuth` (login-init) |
| Redirect sau One Tap | Shell / Auth | **Tự navigate** trong `google-onetap.js` |
| Password | Password | `auth.js` / routes / security page — **không** trong GIS, nhưng cùng Auth surface |
| OTP | OTP / Register | register / verify — **không** trong GIS |

### 3.1 Sơ đồ ownership AS-IS (hiện trạng)

```text
┌─────────────────────────────────────────┐
│           auth-social.js                │
│  GIS · Apple · FB · Zalo                │
│  UI bind · Affiliate re-read · remember │
│  finishSocialLogin → IfluxAuth          │
└───────────────────┬─────────────────────┘
                    │
  ┌─────────────────┼─────────────────┐
  ▼                 ▼                 ▼
google-onetap.js   auth-*-init.js    auth.js
(GIS lần 2         (page · redirect  (session ·
 + Affiliate       · Affiliate)       Affiliate
 + redirect riêng)                     · profile)
                    │
                    ▼
             POST /auth/social
                    │
                    ▼
             auth.service.js
        Identity + Attribution + …
```

**Phát hiện:** Không có biên code tương ứng §1. Google proof bị nhúng trong social mega-module + One Tap song song + call-site Affiliate.

---

## 4. Runtime flow (AS-IS) — từng bước · ai đang chạy

### 4.1 Path A — Icon Google `/dang-nhap` (freeze Affiliate-era)

```text
1. Click #btn-google
   → UI: HTML + auth-social.bindSocialButtons
2. affiliateCodeForSocial()
   → Affiliate Context (gọi từ social layer)
3. loginGoogle() → GIS initialize + prompt()
   → Google SDK (code nằm trong auth-social)
4. credential → response.credential (id_token)
   → Google SDK
5. finishSocialLogin('google', { id_token }, opts)
   → bridge Auth client
6. auth.js có thể inject referral_code nếu thiếu
   → Auth làm việc Affiliate
7. POST /auth/social { provider, id_token, referral_code?, remember_me? }
8. verify + socialLoginOrRegister
   → Identity + Attribution (+ notify) cùng backend auth
9. JWT + establishSession + authMe
   → Session / Profile
10. clearAffiliateContextAfterConsume (điều kiện)
   → Affiliate Context (gọi từ Auth)
11. onSuccess → redirectAfterAuth
   → Auth page / Shell
```

### 4.2 Path B — Google One Tap

```text
google-onetap.js
  → GIS prompt
  → id_token
  → AR.getCodeForIdentityCreation()
  → IfluxAuth.loginWithSocial
  → POST /auth/social (như Path A từ bước 7)
  → navigate/reload  (không dùng cùng redirect path với login page)
```

### 4.3 Path không phải Google (đối chiếu biên)

| Flow | Entry | Google tham gia? |
|------|-------|------------------|
| Email + password | `/dang-nhap` form | Không |
| Register + OTP | register / verify-email | Không |
| Affiliate capture `/IFL…` | AR on load | Không (trước Google) |
| Affiliate write `referred_by` | Backend sau IdentityCreated | Không (sau Identity) |

---

## 5. Dependency & Coupling (AS-IS)

### 5.1 Ma trận file × concern

| File | Google | Other OAuth | UI | Affiliate | Session | Redirect | Password | OTP |
|------|:------:|:-----------:|:--:|:---------:|:-------:|:--------:|:--------:|:---:|
| `auth-social.js` | ● | ● | ● | ● | ○ | ○ | | |
| `google-onetap.js` | ● | | | ● | ○ | ● | | |
| `auth-login-init.js` | ○ | ○ | ● | ● | ○ | ● | ● | |
| `auth-register-init.js` | ○ | ○ | ● | ● | ○ | ● | ● | ○ |
| `auth.js` | ○ | ○ | | ● | ● | ● | ● | ○ |
| `auth.service.js` | ● verify | ● | | ● | via routes | | ● | ● |
| `affiliate-resolver.js` | | | | ● | | | | |

● = implement · ○ = gọi/wire

### 5.2 Coupling nóng trong `auth-social.js`

Cùng một file đang chứa:

1. OAuth / GIS Google  
2. OAuth Apple / Facebook / Zalo  
3. UI binding  
4. Affiliate re-read  
5. Remember me pass-through  
6. Bridge Session/Identity (`finishSocialLogin`)

Redirect không nằm trực tiếp trong file nhưng **coupled qua callback** page/One Tap.

### 5.3 Dependency graph (quan sát)

```text
login.html ──► auth-social ──► GIS Google
                 │         ──► Apple/FB/Zalo
                 │         ──► affiliate-resolver (read)
                 └──► auth.js ──► POST /auth/social
                                   │
google-onetap ──► GIS Google       ▼
       │                    auth.service
       ├──► affiliate-resolver     (identity + attribution)
       └──► auth.js ──► redirect riêng
```

---

## 6. Existing problems (có evidence)

| ID | Vấn đề AS-IS | Evidence |
|----|--------------|----------|
| P1 | Google không có biên code khớp Capability Boundary §1 | GIS + Affiliate + UI + remember trong `auth-social`; One Tap file thứ hai |
| P2 | Sửa Google đụng Affiliate | googleProxy / hack era; audit 09 · runtime 10 (Affiliate Path C không chứng minh PASS khi Google layer nhiễu) |
| P3 | Hai runtime Google (icon vs One Tap) | `auth-social` + `google-onetap` — redirect/Affiliate wiring khác nhau |
| P4 | Affiliate Context đọc ≥4 call-sites | social · onetap · auth · login-init |
| P5 | Backend auth module gộp Identity + Attribution + Password + OTP | `auth.service.js` / routes |
| P6 | Không có Single Source of Truth cho “Google Login” | Hai GIS entry; không module/owner tên Google |
| P7 | UX Google mobile fail đã bị xử lý kiểu vá trên file lai | Owner đã reject; freeze khôi phục Affiliate-era, **chưa** giải Google UX |

**Không giải trong Discovery.** Chỉ ghi nhận.

---

## 7. De-facto SoT hiện tại (AS-IS — nơi sự thật đang nằm)

| Concern | Nơi sự thật / logic đang chạy hôm nay | Trùng / lệch so với §1? |
|---------|----------------------------------------|-------------------------|
| Google `id_token` issuance | GIS trong `auth-social` **và** `google-onetap` | Lệch — hai chỗ |
| Affiliate Context | `affiliate-resolver` (đúng SoT) nhưng **đọc từ nhiều layer** | SoT đúng · call-site lệch |
| Affiliate Attribution | Backend auth.service | Đúng chỗ write · module gộp |
| Session | `IfluxAuth` + JWT | Không thuộc Google — nhưng bridge từ social |
| Password | login form + password APIs | Tách flow · cùng Auth surface |
| OTP | register / verify | Tách flow |
| Redirect | login-init **và** onetap | Hai policy |

---

## 8. Câu hỏi Owner — trả lời Discovery (không Solution)

| # | Câu hỏi | Trả lời AS-IS |
|---|---------|---------------|
| 1 | Google sở hữu những gì? | **Boundary SoT (§1):** chỉ Browser → Google SDK → `id_token`. **Code AS-IS:** không khớp — còn UI, Affiliate, remember, multi-provider, bridge session. |
| 2 | Auth sở hữu những gì (AS-IS)? | Session, profile hydrate, redirect (một phần), orchestration login/register, và đang ôm Affiliate inject + social bridge. |
| 3 | Affiliate đọc ở đâu? | SoT: AR. Call-sites: social / onetap / auth / login-init. |
| 4 | OTP đọc ở đâu? | Register / verify-email / OTP store — không trong GIS. |
| 5 | Password đọc ở đâu? | Login password + change-password + security — không trong GIS. |
| 6 | Runtime ownership? | §4. |
| 7 | Coupling? | §5 — `auth-social.js` là điểm nóng. |
| 8 | Vì sao Capability riêng? | §1.3 — evidence blast radius + proof type + dual GIS + Affiliate SoT. |

---

## 9. Gate Discovery — Owner Sign-off

| ID | Quyết định | Status |
|----|------------|--------|
| **OD-DISC-01** | Discovery AS-IS (§2–7) đủ inventory / ownership / runtime / coupling / problems | ✅ **APPROVE** 2026-07-28 |
| **OD-DISC-02** | Capability Boundary §1 **LOCKED** — client = Browser → SDK → `id_token`; verify thuộc Identity backend; Google không biết Session/Redirect/Affiliate/User/Password/OTP/Notification | ✅ **APPROVE** 2026-07-28 (kèm lưu ý §1.1) |
| **OD-DISC-03** | Lý do tách Capability (§1.3) chấp nhận | ✅ **APPROVE** 2026-07-28 |
| **OD-DISC-04** | Mở **Phase 2 — Solution Design (NO CODE)** | ✅ **APPROVE** 2026-07-28 |
| **OD-DISC-05** | Cấm code / cấm vá Production đến khi Plan APPROVED | ✅ **APPROVE** 2026-07-28 |

**PASS Discovery:** ✅ LOCKED. Không quay lại Discovery trừ khi Solution Design phát hiện **evidence AS-IS mới** thiếu.

---

## 10. Out of Scope / Open Questions

> Không phải Solution. Chỉ liệt kê câu hỏi còn mở để **Phase 2 Solution Design** xử lý / Owner chốt.  
> Mục đích: tránh phải mở lại Discovery vì thiếu phạm vi.

| ID | Open Question | Ghi chú |
|----|---------------|---------|
| **OQ-01** | FedCM có phải **target chính thức** của Google Capability không? | Ảnh hưởng UX mobile / `prompt` behavior |
| **OQ-02** | Có tiếp tục hỗ trợ **Google One Tap** không? | AS-IS: file `google-onetap.js` song song icon path |
| **OQ-03** | **Mobile WebView** (Zalo / Facebook in-app browser) có nằm trong scope Google Capability không? | Khác browser thường; có thể ngoài GIS |
| **OQ-04** | Tiếp tục **Google Identity Services (GIS)** hay cân nhắc **OAuth Authorization Code + PKCE** trong tương lai? | Không chốt technique trong Discovery |
| **OQ-05** | Apple / Facebook / Zalo rebuild cùng phase Google hay **sau** (Google-first)? | AS-IS chung `auth-social.js` |
| **OQ-06** | Redirect sau auth: One Tap và Login page **một policy** bắt buộc ngay phase này? | AS-IS hai path |

**Out of scope Discovery (đã rõ):**

- Sửa / deploy Production  
- Vá googleProxy / hidden button  
- Đổi Affiliate SoT (`AFFILIATE_GOLDEN`)  
- Delete Inventory chi tiết · Implementation Plan · Code  

---

## 11. Phase map (con trỏ)

| Phase | Deliverable | Status |
|-------|-------------|--------|
| **1 — Discovery** | File này | 🔒 **LOCKED** |
| **2 — Solution Design** | `01-Solution-Design-…md` | ▶️ **MỞ** (NO CODE) |
| **3 — Delete Inventory / Migration** | Doc riêng | Chờ Solution APPROVED |
| **4 — Implementation Plan** | Doc riêng | Chờ sau Phase 3 |
| **5 — Implement** | `feature/google-login-rebuild` | Chờ Plan APPROVED · không đụng `release/affiliate-golden` |

---

## 12. Non-goals (Discovery)

- Không Solution Design trong file này (đã chuyển Phase 2).  
- Không chọn GIS technique tại đây (→ OQ-01…04).  
- Không sửa / deploy Production.  
- Không đổi Affiliate SoT đã freeze.

---

*Discovery Audit rev 1.2 — LOCKED. Phase 2 Solution Design.*
