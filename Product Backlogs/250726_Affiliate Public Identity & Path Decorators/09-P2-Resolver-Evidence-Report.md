# P2 — Affiliate Resolver · Evidence Report

| Trường | Giá trị |
|--------|---------|
| **Phase** | P2 — Resolver |
| **Task** | Affiliate Public Identity & Path Decorators |
| **Plan** | v1.0 FINAL |
| **Governance** | ECR-AFF-PATH-2026-07-25 · CG-012 CREATE |
| **Owner deliverable** | Platform Runtime |
| **Date** | 2026-07-25 · Evidence bổ sung 2026-07-26 |
| **Prerequisite** | P1 **PASS** (Owner 2026-07-25) |
| **Technical verdict** | **Technical PASS** |
| **Owner stamp** | **APPROVED / P2 PASS** — Owner 2026-07-26 |

---

## Objective (Plan)

Runtime nhận `/{publicId}/{route}` → validate pattern → attribution context → **internal rewrite** sang canonical. Page Runtime nhận **canonical pathname only**. **Không** 301/302. `?ref=` vẫn sống.

---

## 0. Ownership Matrix

| Owner | Owns | MUST NOT |
|-------|------|----------|
| **Affiliate Resolver** (Platform Runtime) | Affiliate path detection · attribution **bootstrap** (cookie/context) · canonical strip (`replaceState` + nginx rewrite) | Resolve business rules · lookup referral owner · modify Share URL · đổi `referred_by` |
| **Page Runtime** | Routing · rendering theo canonical path | Biết / parse prefix affiliate |
| **Share Foundation** | Outgoing decoration (vẫn `?ref=` đến P3) | Incoming resolve |
| **Loyalty / Growth** | Attribution **persistence** pipeline (`iflux_ref_code` → register → `referred_by`) · tiếp tục capture `?ref=` | Sở hữu path rewrite |

### Resolver MUST NOT

- resolve business rules (first-touch ownership / commission)
- lookup referral owner (Identity validate tồn tại — ngoài P2 AC; parity với `?ref=`)
- modify share URL / `decorateAffiliateRef`

```
Affiliate URL
      ↓
Resolver          ← owns detect + bootstrap + strip
      ↓
Canonical Path
      ↓
Page Runtime      ← owns route + render only
```

---

## 1. Architecture (AS-BUILT)

| Layer | Mechanism |
|-------|-----------|
| Nginx | Pattern gate `IFL…` + `rewrite … last` → URI canonical (không đổi Location HTTP) |
| Client Resolver | `runtime/affiliate-resolver.js` — inject **trước** `path-base.js` |
| Growth capture | Loyalty `captureRefFromUrl` — `?ref=` / `?r=` + path fallback |
| Share outgoing | **Không đổi** (P3) |

### Canonical Public Identifier

```
publicId is the only public referral identifier.

Consumers MUST NOT depend on internal referral_code format.
Persistence field remains users.referral_code (P1 contract).
```

### Browser URL lifecycle

```
Browser request
      ↓
/IFL77JXA/cong-dong          ← visible URL lúc gửi
      ↓
nginx internal rewrite       ← serve HTML của /cong-dong · HTTP 200 · no Location
      ↓
receive HTML
      ↓
affiliate-resolver.js        ← detect publicId · cookie · context
      ↓
history.replaceState
      ↓
visible URL = /cong-dong     ← Page Runtime bootstrap chỉ thấy canonical
```

Page Runtime receives **canonical pathname only**. Affiliate path is **fully consumed** before Page Runtime bootstrap.

### Resolver Execution Order

```
affiliate-resolver.js     (sub_filter inject #1 — sync)
        ↓
path-base.js              (sub_filter inject #2 — <base> theo canonical)
        ↓
page bootstrap            (detectPageKey / shell-boot)
        ↓
widget runtime
```

Không race: Resolver chạy blocking trong `<head>` trước mọi script page.

---

## 2. Affiliate Identifier — tham chiếu SoT (không định nghĩa tại Evidence)

Evidence **không** sở hữu regex/pattern.

| | |
|--|--|
| **SoT (1)** | **Affiliate Identifier Pattern** — `08-P1-Public-Identity-Readiness-Report.md` §0.0 · Spec APPROVED · ECR-AFF-PATH-2026-07-25 (Identity / validate `IFL…`) |
| **P2 role** | Implement + chứng minh gate tuân thủ SoT |

```
Affiliate Identifier Contract
Pattern: See P1 §0.0 Affiliate Identifier Pattern (SoT)
         + ECR-AFF-PATH-2026-07-25 (Identity TO-BE / Resolver validate IFL…)
```

### Conformance samples (evidence only — không phải định nghĩa chuẩn)

| Sample | Kỳ vọng theo SoT | Quan sát P2 |
|--------|------------------|-------------|
| `IFL77JXA` / `IFL9552M` | Khớp identity `IFL…` đã cấp | Coi là affiliate · rewrite |
| `ABC123` | Không phải Public Identity | **Không** affiliate · HTTP 404 |
| Slug `cong-dong` / `co-phieu` | Reserved / không phải publicId | Không match affiliate gate |

Negative AC Plan: `GET /ABC123/cong-dong` → không affiliate → **404** — **PASS**.

---

## 3. Cookie / attribution policy (AS-IS)

| Item | Value |
|------|--------|
| Cookie | `iflux_ref_code` |
| localStorage | `iflux_ref_code` · flag `iflux_ref_from_link=1` |
| Context (AFF-008) | `iflux_aff_context_v1` |
| TTL | 30 ngày · `path=/` · `SameSite=Lax` |

**Policy (P2):**

```
Cookie policy follows current ?ref= behavior.
No behavioral change introduced by Resolver.
```

- Resolver chỉ **bootstrap cùng cookie/store** mà Loyalty đã dùng cho `?ref=`.  
- **Không** đổi first-touch / last-touch / overwrite rule của attribution pipeline.  
- Server `referred_by` (O3) — **không đụng**.

Ghi nhận kỹ thuật (không phải rule mới): path valid theo SoT Identifier mới ghi cookie — tương đương query `?ref=` hợp lệ đã capture trước P2.

---

## 4. Acceptance Criteria

### Functional

| Case | PASS khi | Evidence | Kết quả |
|------|----------|----------|---------|
| `GET /IFL77JXA/cong-dong` | resolve · canonical `/cong-dong` | curl HTTP **200** · HTML Cộng đồng · browser URL → `/cong-dong` | **PASS** |
| Rewrite | Internal only — **không** 301/302 | `curl -sI` → 200, không `Location` | **PASS** |
| Attribution | context ghi được | cookie + LS `IFL77JXA` · `iflux_aff_context_v1` | **PASS** |
| Page Runtime | nhận canonical pathname only | `location.pathname=/cong-dong` sau resolve | **PASS** |

### Negative

| Case | PASS khi | Evidence | Kết quả |
|------|----------|----------|---------|
| `GET /ABC123/cong-dong` | không coi affiliate | HTTP **404** | **PASS** |

### Unknown route (sau rewrite)

| Case | Flow | Evidence | Kết quả |
|------|------|----------|---------|
| `GET /IFL77JXA/not-found` | rewrite → `/not-found` → **404** | curl HTTP **404** · no `Location` | **PASS** |
| `GET /IFL77JXA/abcxyz` | rewrite → `/abcxyz` → **404** | curl HTTP **404** | **PASS** |

Affiliate strip vẫn chạy; 404 thuộc **canonical route** — không leak “user tồn tại” qua mã giả kiểu `ABC123`.

### Regression

| Case | PASS khi | Evidence | Kết quả |
|------|----------|----------|---------|
| `GET /cong-dong` | như trước | HTTP **200** | **PASS** |
| `?ref=` | vẫn capture | `/cong-dong?ref=IFL77JXA` → **200** | **PASS** |
| Deep link `GET /IFL77JXA/co-phieu/HPG` | rewrite → `/co-phieu/HPG` · no HTTP redirect sang canonical | curl **200** · no `Location` · HTML inject Resolver; browser auth gate (nếu có) dùng `return=%2Fco-phieu%2FHPG` (**canonical**, không còn `IFL…`) · cookie vẫn `IFL77JXA` | **PASS** |

**Technical Phase P2 Verdict: Technical PASS · Owner Review Pending**

---

## 5. Browser evidence

### 5.1 Community path (2026-07-25)

Request: `https://iflux.vn/IFL77JXA/cong-dong`

```json
{
  "path": "/cong-dong",
  "resolve": {
    "affiliate": { "publicId": "IFL77JXA", "valid": true },
    "canonicalPath": "/cong-dong",
    "attribution": {
      "referrerPublicId": "IFL77JXA",
      "landingPath": "/cong-dong"
    }
  },
  "ls": "IFL77JXA",
  "cookieSnippet": "IFL77JXA"
}
```

### 5.2 Deep link stock (2026-07-26)

Request: `https://iflux.vn/IFL77JXA/co-phieu/HPG`

| Bước | Quan sát |
|------|----------|
| HTTP first hop | **200** · no `Location` · body có `affiliate-resolver` |
| Sau client auth gate (guest) | URL ` /dang-nhap?return=%2Fco-phieu%2FHPG ` — return = **canonical** |
| Attribution | `iflux_ref_code=IFL77JXA` vẫn còn |

→ Resolver đã consume affiliate **trước** Page/auth; deep link không bị kẹt ở Community-only.

---

## 6. Files changed (P2)

| File | Action |
|------|--------|
| `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | **CREATE** |
| `infra/nginx-iflux-production-locations.conf` | Affiliate rewrite + inject Resolver trước path-base |
| `User_Web/iflux-web-ui/loyalty-affiliate-store.js` | Path `publicId` fallback trong `captureRefFromUrl` (giữ `?ref=`) |
| Production `/etc/nginx/snippets/iflux-prod-app.conf` | Deploy + reload |
| CF purge | Key URLs + resolver asset |
| `docs/…/09-P2-Resolver-Evidence-Report.md` | Evidence bổ sung Ownership / Order / Regex / Unknown+Deep link |

**Không đụng:** Share Foundation / `decorateAffiliateRef` / attribution business rule / `referred_by`.

---

## 7. Explicit non-scope (P2)

- [ ] P3 Share path switch  
- [ ] P4 Preview matrix  
- [ ] P5 Deprecate `?ref=`  
- [ ] Đổi first-touch / `referred_by`  
- [ ] Đổi cookie overwrite → first-touch-only trên `iflux_ref_code` (ngoài P2 — attribution business rule)  

---

## 8. Owner decision

Checklist đóng gate:

- [ ] Boundary preserved  
- [ ] Single ownership maintained  
- [ ] No business logic leakage  
- [ ] No routing ownership violation  

| | |
|--|--|
| **Owner stamp** | Owner |
| **Date** | 2026-07-26 |
| **Decision** | ☑ **PASS** · ☐ FAIL |

```
Owner Verdict
PASS
Boundary preserved.
Single ownership maintained.
No business logic leakage.
No routing ownership violation.
Ready to execute Phase P3.
```

Sau Owner **P2 PASS** → được phép giao **Execute Phase P3 only**.

---

*P2 Resolver Evidence — 2026-07-26 — Owner **P2 PASS** · sẵn sàng P3.*
