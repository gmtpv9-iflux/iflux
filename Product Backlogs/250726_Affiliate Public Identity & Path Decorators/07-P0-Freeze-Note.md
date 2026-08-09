# P0 — Freeze Note · Current Referral Transport

| Trường | Giá trị |
|--------|---------|
| **Phase** | P0 — Freeze Current Referral Transport |
| **Task** | Migrate Affiliate Referral from Query Decorators to Path Decorators |
| **Plan** | v1.0 FINAL — Approved for Implementation |
| **Governance** | ECR-AFF-PATH-2026-07-25 **APPROVED** |
| **Owner deliverable** | Share Capability + Platform Runtime |
| **Date** | 2026-07-25 |
| **Code change** | **Không** — P0 chỉ khóa vận hành / evidence |

---

## Objective (Plan)

Ổn định transport AS-IS (`?ref=`) và **cấm** thêm URL builder song song trước khi đổi chuẩn (P1+).

---

## 1. Freeze declaration

Kể từ stamp P0:

1. Transport referral user **chuẩn tạm thời** trên Production = Query Decorator `?ref=` (như Audit 2026-07-25).  
2. **Cấm** tạo file / helper / module mới để build affiliate share URL (path hoặc query) song song với Share Foundation.  
3. **Cấm** Modify `decorateAffiliateRef` / `buildShareUrl` sang path trong P0 (chỉ ở **P3**, sau P2).  
4. **Cấm** tạo Affiliate Resolver trong P0 (chỉ **P2**).  
5. **Cấm** đổi Attribution Business Rule / `referred_by` / first-touch.  
6. Residual đã biết trong Audit (Loyalty fallback, manifest cache) = **đóng băng AS-IS** — cleanup thuộc phase sau, không “sửa tiện” trong P0.

---

## 2. Locked AS-IS ownership (consume Audit — không inventory lại)

| Chiều | Owner | Mechanism |
|-------|--------|-----------|
| Outgoing share URL | Share Foundation `share-action-store.js` | `buildShareUrl` → `decorateAffiliateRef` → `?ref=` |
| Incoming capture | Loyalty `loyalty-affiliate-store.js` | `captureRefFromUrl` → cookie `iflux_ref_code` |
| Persist attribution | Auth backend | `referred_by` — **NO CHANGE** trong task này |
| Community share | `interaction/catalog` | Gọi Foundation — không tự decorate |
| Identity code | `users.referral_code` | = future `publicId` — P1 |

### Entry points bị đóng băng (Audit §5)

1. Community Chia sẻ → Foundation  
2. Insight Widget → Foundation  
3. Profile / Loyalty `buildReferralLink` → Foundation (+ fallback query nếu thiếu SF)  
4. Auth `referral_link` → Loyalty  
5. `/chia-se` → incoming redirect giữ `?ref=`  
6. Feed card → không phải share action  
7. Register / social → incoming  

---

## 3. Parallel builder scan (P0 verification)

| Candidate | Kết quả |
|-----------|---------|
| `share-action-store.js` `decorateAffiliateRef` | **Owner hợp lệ** — query decorate AS-IS |
| `loyalty-affiliate-store.js` `buildReferralLink` | Prefer Foundation; **fallback** home+`?ref=` (Audit R2 — residual **đóng băng**, không sửa P0) |
| `share-feature-boot.js` `/chia-se` | Incoming redirect `?ref=` — **không** phải outgoing Share builder mới |
| File kiểu `*-affiliate-builder.js` / `path-affiliate*` / `AffiliateResolver` | **Không tìm thấy** trong User_Web / Admin Foundation (P0) |
| Path decorate `/{IFL}/…` trong Share Foundation | **Chưa có** — đúng P0 (No share change to path) |

**No parallel:** Không có builder URL affiliate **mới** được thêm trong P0. Residual fallback cũ = đã có trước Freeze — ghi nhận, không expand.

---

## 4. Acceptance Criteria

| AC | PASS khi | Kết quả |
|----|----------|---------|
| AS-IS | `?ref=` vẫn là transport outgoing qua Foundation như Audit | **PASS** — không đổi Foundation |
| No parallel | Không có builder URL affiliate mới | **PASS** — scan §3 |
| No share change | Share output chưa chuyển path | **PASS** — `decorateAffiliateRef` vẫn set query `ref` |

**Phase P0 Verdict: PASS**

---

## 5. Files changed (P0)

| File | Action |
|------|--------|
| `docs/250726_Affiliate Public Identity & Path Decorators/07-P0-Freeze-Note.md` | **CREATE** (deliverable này) |
| `docs/…/00-README.md` | UPDATE status P0 PASS |
| Production / Share Foundation / Loyalty / Auth | **Không đụng** |

---

## 6. Evidence summary

| Evidence | Nguồn |
|----------|--------|
| Ownership + entry points + CDN fingerprint | Audit-Affiliate-Share-Capability-2026-07-25 |
| Gate P0 trước P1–P5 | Plan FINAL § P0 |
| G0 decisions (MODIFY Share chỉ P3, CREATE Resolver P2) | ECR-AFF-PATH-2026-07-25 |
| Local code confirm decorate = query | `share-action-store.js` L74–86 (P0 read-only) |

---

## 7. Explicit non-scope (P0)

- [ ] P1 Public Identity / backfill  
- [ ] P2 Resolver  
- [ ] P3 Share path switch  
- [ ] P4 Preview matrix  
- [ ] P5 Deprecate `?ref=`  
- [ ] Modify Share Foundation  
- [ ] Change attribution / `referred_by`  

---

## 8. Next phase

P0 **PASS** → Owner có thể giao:

```
Execute Phase P1 only — Public Identity Readiness
```

---

*P0 Freeze Note — 2026-07-25 — Phase PASS · no implementation code.*
