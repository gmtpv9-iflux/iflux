# P3 — Share Path Decorate Evidence Report

**Phase:** P3 — Share Output Switch  
**Date:** 2026-07-27  
**Owner decision:** GO P3 (idempotent + preserve query/hash acceptance)  
**Scope lock:** Chỉ sửa `decorateAffiliateRef()` trong Share Foundation — không đụng resolver, auth, signup, loyalty capture, cookie, payout, nginx, routing.

---

## 1. Change summary

| Item | Detail |
|------|--------|
| **Owner file** | `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` |
| **Function** | `decorateAffiliateRef()` — query `?ref=` → path prefix `/{publicId}/…` |
| **Regex** | `PUBLIC_ID_RE = /^IFL[A-Z0-9]{5,17}$/` (khớp P2 resolver) |
| **Cache bust** | `shareAffP3_20260727` (consumers Share Foundation) |

### Acceptance — Idempotent decorate

`decorate(url) === decorate(decorate(url))` — không double prefix `/IFL…/IFL…/`.

### Acceptance — Preserve URL components

Chỉ đổi **pathname**; giữ origin · protocol · port · query (trừ strip `ref`/`r`) · hash.

---

## 2. Input / Output evidence

Ref code dùng trong test: `IFL9552M`

| Input | Output |
|-------|--------|
| `/cong-dong` | `/IFL9552M/cong-dong` |
| `/community/post/123` | `/IFL9552M/community/post/123` |
| `https://iflux.vn/cong-dong` | `https://iflux.vn/IFL9552M/cong-dong` |
| `https://iflux.vn/cong-dong?a=1` | `https://iflux.vn/IFL9552M/cong-dong?a=1` |
| `https://iflux.vn/cong-dong?a=1#abc` | `https://iflux.vn/IFL9552M/cong-dong?a=1#abc` |
| `/IFL9552M/cong-dong` | `/IFL9552M/cong-dong` |

**Idempotent:** PASS — tất cả input trên, `decorate(decorate(u)) === decorate(u)`.

**Strip legacy query on decorate:**  
`https://iflux.vn/cong-dong?ref=OLD&a=1#x` → `https://iflux.vn/IFL9552M/cong-dong?a=1#x`

---

## 2b. Edge-case verification (post-deploy)

Ref code: `IFL9552M` · Verified against `share-action-store.js` on Production CDN (`shareAffP3_20260727`).

### 2b.1 URL encode — không double encode

| Input | Output | Result |
|-------|--------|--------|
| `/bai-viet/đầu-tư` | `/IFL9552M/bai-viet/đầu-tư` | **PASS** |
| `/bai-viet/%C4%91%E1%BA%A7u-t%C6%B0` | `/IFL9552M/bai-viet/%C4%91%E1%BA%A7u-t%C6%B0` | **PASS** — giữ nguyên encoding segment, không thêm `%25` |
| `https://iflux.vn/bai-viet/%C4%91%E1%BA%A7u-t%C6%B0` | `https://iflux.vn/IFL9552M/bai-viet/đầu-tư` | **PASS** — `URL.pathname` decode một lần (browser contract), prefix không re-encode |

### 2b.2 Root path

| Input | Output | Result |
|-------|--------|--------|
| `/` | `/IFL9552M/` | **PASS** |
| `https://iflux.vn/` | `https://iflux.vn/IFL9552M/` | **PASS** |
| `https://iflux.vn` (no trailing slash) | `https://iflux.vn/IFL9552M/` | **PASS** |
| Idempotent `decorate('/IFL9552M/')` | `/IFL9552M/` | **PASS** |

### 2b.3 Query cleanup — chỉ remove `ref` và `r`

| Input | Output | Result |
|-------|--------|--------|
| `…/cong-dong?a=1&ref=OLD&b=2` | `…/IFL9552M/cong-dong?a=1&b=2` | **PASS** |
| `…/cong-dong?r=abc&a=1` | `…/IFL9552M/cong-dong?a=1` | **PASS** |
| `…/cong-dong?ref=OLD` | `…/IFL9552M/cong-dong` | **PASS** — query rỗng sau strip |

### 2b.4 PublicId validation — guest / chưa hydrate

Input cố định: `https://iflux.vn/cong-dong?a=1`

| `refCode` | Output | Exception | Result |
|-----------|--------|-----------|--------|
| `""` | canonical sạch (không decorate) | none | **PASS** |
| `null` | canonical sạch | none | **PASS** |
| `INVALID` | canonical sạch | none | **PASS** |
| `ifl123` (lowercase / sai format) | canonical sạch | none | **PASS** |
| `IFL12` (quá ngắn) | canonical sạch | none | **PASS** |

**Tổng edge-case:** 16/16 **PASS**

---

## 3. Grep `?ref=` — outgoing share

```bash
rg '\?ref=|searchParams\.(set|append)\(['\''"]ref' --glob '*.js'
```

| Location | Classification | P3 action |
|----------|----------------|-----------|
| `share-action-store.js` | Outgoing decorate | **REMOVED** — path prefix only |
| `loyalty-affiliate-store.js` L96 | Fallback khi SF chưa load | **P5** — giữ nguyên |
| `share-feature-boot.js` L37 | Redirect `/chia-se` compat | **P4** — giữ nguyên |
| `interaction/catalog/index.js` | Comment only | N/A |
| `_bak/...` | Backup archive | N/A |

**Verdict:** Không còn outgoing share mới tạo `?ref=` từ Share Foundation.

---

## 4. Files changed (P3 scope)

| File | Change |
|------|--------|
| `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` | `decorateAffiliateRef()` path decorate |
| `User_Web/iflux-web-ui/interaction/boot.js` | `?v=shareAffP3_20260727` |
| `User_Web/iflux-web-ui/interaction/catalog/index.js` | cache bust |
| `User_Web/iflux-web-ui/iflux-web-ui.js` | cache bust |
| `User_Web/iflux-web-ui/insight-share-store.js` | cache bust |
| `User_Web/iflux-web-ui/runtime/share-feature-boot.js` | share-action-store cache bust only |
| `User_Web/iflux-web-ui/widgets/community-post-page/index.js` | boot cache bust |

**Không sửa:** `affiliate-resolver.js`, `loyalty-affiliate-store.js`, nginx, auth, signup.

---

## 5. Regression checklist (P2 incoming)

| Check | Expected |
|-------|----------|
| `/IFL9552M/cong-dong` resolve | Resolver strip prefix → `/cong-dong` |
| Incoming `?ref=` legacy | `captureRefFromUrl` vẫn hoạt động (P4) |
| Guest share | `buildShareUrl` không ref → canonical sạch |
| Login share | Path `/{publicId}/…` qua Foundation |

---

## 6. Status

| Gate | Result |
|------|--------|
| Scope lock | **PASS** |
| Idempotent decorate | **PASS** |
| Preserve query/hash | **PASS** |
| URL encode (no double encode) | **PASS** |
| Root path `/` | **PASS** |
| Query cleanup `ref`/`r` only | **PASS** |
| Invalid / empty publicId | **PASS** |
| No outgoing `?ref=` (Foundation) | **PASS** |
| Deploy Production | **PASS** — 2026-07-27 · CDN purge |

**P3: PASS** — Owner sign-off 2026-07-27 (edge-case verification §2b).
