# Báo cáo hiện trạng — Affiliate Public Identity & Path Decorators

**Ngày audit:** 2026-07-27  
**Phạm vi:** Toàn task (Spec → G0 → P0–P5) + đối chiếu code Production/local  
**Production:** https://iflux.vn  
**Thư mục task:** `docs/250726_Affiliate Public Identity & Path Decorators/`

---

## 0. Tóm tắt điều hành (Owner)

| Câu hỏi | Trả lời ngắn |
|---------|----------------|
| **Task này là gì?** | Migrate **Referral Transport** từ `?ref=` sang **Path Decorators** `/{publicId}/path` — **không** đổi business attribution (first-touch, hoa hồng, payout). |
| **Làm tới đâu?** | **P0 → P2 PASS** (Identity + Incoming Resolver). **P3 → P5 chưa mở.** |
| **Đang làm gì?** | **Không có phase execution đang chạy** — chờ Owner giao **Execute Phase P3 only**. |
| **Outgoing share URL hiện tại?** | Vẫn **`?ref=`** qua Share Foundation (`share-action-store.js`) — đúng trạng thái sau P2, **chưa** P3. |
| **Incoming path URL?** | **Đã sống** — `/{IFL…}/cong-dong` → nginx rewrite + `affiliate-resolver.js` + cookie/context. |
| **Mục tiêu cuối task?** | Share outgoing = path; legacy `?ref=` capture vẫn OK (P4); cleanup query outgoing khi Owner approve P5 policy. |

**Tiến độ ước lượng:** ~**45%** task chính (5 phase execution: 2/5 xong; G0 + predecessor ?ref= Foundation ≈ thêm ~15% → **~60% hành trình tổng** nếu tính cả Share query migration trước đó).

---

## 1. Mục tiêu cuối cùng (Task Objective)

Plan FINAL — [`05-Plan-Migrate-Affiliate-Referral-Query-to-Path-Decorators.md`](05-Plan-Migrate-Affiliate-Referral-Query-to-Path-Decorators.md) §1:

| Outcome | Mô tả | Trạng thái |
|---------|--------|------------|
| **O1** | Một user registered → một `publicId` (= `referral_code`), immutable | ✅ P1 PASS |
| **O2** | Transport `/IFL…/cong-dong` thay `?ref=` | 🟡 Incoming ✅ · Outgoing 🔲 P3 |
| **O3** | First-touch / `referred_by` / signup không đổi | ✅ Giữ nguyên (chưa regression P3+) |
| **O4** | 100% share URL qua Share Foundation, không duplicate builder | 🟡 Foundation owner ✅ · path decorate 🔲 P3 |

**Definition of Done task** (Plan §9): checklist Identity + URL + Runtime + Attribution + SEO + Ownership — **chưa tick đủ** (chờ P3–P5).

---

## 2. SoT & Governance (authority stack)

### 2.1 Authority (bắt buộc tuân)

| Cấp | Tài liệu | Vai trò với task |
|-----|----------|------------------|
| 1 | [`docs/SoT — iFlux Product Architecture (V2).md`](../SoT%20%E2%80%94%20iFlux%20Product%20Architecture%20(V2).md) | Share = capability chung; Entity một canonical URL; Affiliate = decorator Share |
| 2 | [`03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md`](03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md) v1.1 | **APPROVED** — pattern `IFL…`, resolver, path contract |
| 3 | [`04-G0-Engineering-Change-Record.md`](04-G0-Engineering-Change-Record.md) | **APPROVED** ECR-AFF-PATH-2026-07-25 — Change Surface / Impact / Rollback |
| 4 | Plan Migrate v1.0 FINAL | Phase P0–P5 execution |
| 5 | [`docs/SoT — Engineering Change Governance.md`](../SoT%20%E2%80%94%20Engineering%20Change%20Governance.md) | CG-001 Modify Foundation · CG-012 justify Resolver CREATE |
| 6 | [`docs/SoT — Plan Phase Governance.md`](../SoT%20%E2%80%94%20Plan%20Phase%20Governance.md) PG-1.0 | Mỗi phase: evidence + exit trước phase sau |

### 2.2 SoT chi phối (Plan §4.3)

| SoT | Ràng buộc |
|-----|-----------|
| **IP-001** / IA-1.0 | Guest share = URL sạch, không bịa mã |
| **PS-1.0** | Cookie `iflux_ref_code` = transport; `referred_by` = server authority |
| **Article Metadata contract** | canonical / og:url **không** chứa `ref` hay `publicId` |
| **UR-001 / CG** | Modify Share Foundation — không parallel URL builder |

### 2.3 Predecessor (track trước, cùng domain)

| Plan | Trạng thái |
|------|------------|
| [`06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md`](06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md) | Query `?ref=` qua Foundation — **Production migrated** (Audit 2026-07-25) · **DoD giấy chưa đóng hẳn** |
| [`01-Audit-Affiliate-Share-Capability-2026-07-25.md`](01-Audit-Affiliate-Share-Capability-2026-07-25.md) | AS-IS evidence predecessor |

---

## 3. Roadmap phase & tiến độ

```
Spec ✅ → G0 ✅ → Plan FINAL ✅
    → P0 PASS ✅ → P1 PASS ✅ → P2 PASS ✅
    → P3 NOT STARTED → P4 NOT STARTED → P5 NOT STARTED
```

| Phase | Owner domain | Deliverable | Verdict | Ngày |
|-------|--------------|-------------|---------|------|
| **G0** | Change Governance | `04-G0-Engineering-Change-Record.md` | ✅ APPROVED | 2026-07-25 |
| **P0** | Share + Platform Runtime | `07-P0-Freeze-Note.md` | ✅ PASS | 2026-07-25 |
| **P1** | Identity | `08-P1-Public-Identity-Readiness-Report.md` | ✅ PASS | 2026-07-25 |
| **P2** | Platform Runtime | `09-P2-Resolver-Evidence-Report.md` | ✅ PASS | 2026-07-26 |
| **P3** | Share Capability | Share output → path decorate | 🔲 **NOT STARTED** | — |
| **P4** | Web Runtime | Compat + Preview validation | 🔲 NOT STARTED | — |
| **P5** | Share + Platform | Remove query outgoing (policy Owner) | 🔲 NOT STARTED | — |

**Gate khóa:** **Cấm P3 trước P2** — P2 đã PASS → **đủ điều kiện mở P3** khi Owner giao.

**Index chuẩn:** [`00-README.md`](00-README.md)

---

## 4. Audit hiện trạng code (2026-07-27)

### 4.1 Identity (P1 — đã làm)

| Hạng mục | Evidence | Verdict |
|----------|----------|---------|
| `publicId := referral_code` | Spec + P1 report | ✅ |
| Immutability DB | `backend/migrations/025_public_identity_immutable.sql` — trigger reject mutation | ✅ |
| Pattern `IFL[A-Z0-9]{5,17}` | `affiliate-resolver.js` L9 · P1 §0.0 | ✅ |
| API expose | `GET /me` + Admin customer alias (P1 report) | ✅ |
| Không bảng `affiliate_codes` riêng | G0 FORBIDDEN | ✅ |

### 4.2 Incoming — Resolver (P2 — đã làm)

| Hạng mục | File / config | Verdict |
|----------|---------------|---------|
| Client resolver | `User_Web/iflux-web-ui/runtime/affiliate-resolver.js` | ✅ |
| Nginx inject + rewrite | `infra/nginx-iflux-production-locations.conf` — `sub_filter` + IFL rewrite | ✅ Deployed |
| Không HTTP 301/302 strip | P2 evidence — `replaceState` + nginx internal rewrite | ✅ |
| Attribution bootstrap | Cookie `iflux_ref_code` + LS + `iflux_aff_context_v1` | ✅ |
| Page Runtime canonical only | Resolver chạy trước `path-base.js` / shell-boot | ✅ |
| `?ref=` incoming vẫn sống | `loyalty-affiliate-store.js` `captureRefFromUrl()` | ✅ |

### 4.3 Outgoing — Share (P3 — **chưa làm**)

| Hạng mục | Hiện trạng | Plan yêu cầu P3 |
|----------|------------|-----------------|
| `decorateAffiliateRef()` | `share-action-store.js` L74–86 — **`?ref=` query** | Path `/{publicId}/path` |
| `buildShareUrl()` output | Login + code → URL có `?ref=` | Login → `https://iflux.vn/IFL…/cong-dong` |
| Guest share | Canonical sạch | ✅ đã đúng (giữ) |
| Community `share_url` | `interaction/catalog/index.js` → `buildShareUrl` | Cần verify sau P3 path |
| Widget / Insight share | `share-action-store.js` + `createShare` | Cùng Foundation — 1 chỗ sửa P3 |

### 4.4 Fallback / ad-hoc còn sót (P4/P5 cleanup)

| Vị trí | Mùi | Phase xử lý |
|--------|-----|-------------|
| `loyalty-affiliate-store.js` L96 | Fallback `?ref=` nếu thiếu Foundation | P5 cleanup |
| `runtime/share-feature-boot.js` L37 | Redirect `/chia-se` → `/nha-cua-toi?ref=` | P4 compat hoặc P3 path |
| `_bak/share-affiliate-20260725-153345/` | Backup pre-change | Archive — không runtime |

### 4.5 grep nhanh — duplicate builder

```text
Outgoing ?ref= decorate (active):
  Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js  ← owner duy nhất (đúng)
  User_Web/.../loyalty-affiliate-store.js L96                          ← fallback (P5)
  User_Web/.../runtime/share-feature-boot.js L37                       ← feature redirect (P4)

Không thấy Widget/Page tự ghép ref ngoài Foundation (trừ fallback trên).
```

---

## 5. Kiến trúc AS-IS vs TO-BE

### AS-IS (Production 27/07)

```text
OUTGOING (share đi) — vẫn query era
  User login → Share Foundation.buildShareUrl()
           → canonical + ?ref=OUTGOING_CODE

INCOMING — dual transport (migration)
  A) /IFL77JXA/cong-dong  → Resolver → cookie → replaceState → /cong-dong
  B) /cong-dong?ref=IFL…  → Loyalty captureRefFromUrl → cookie

ATTRIBUTION (unchanged)
  cookie → register payload → referred_by (server)
```

### TO-BE (sau task PASS)

```text
OUTGOING
  Share Foundation → /{publicId}/vi-path  (P3)

INCOMING
  Path primary · ?ref= legacy capture (P4) · deprecate query outgoing (P5 + Owner policy)

SEO
  canonical / og:url luôn sạch (đã đúng · re-verify P4)
```

---

## 6. Ownership matrix (khóa)

| Layer | Owner | Làm gì | Không làm |
|-------|-------|--------|-----------|
| **Share Foundation** | DS Foundation `share-action-store.js` | Outgoing URL decorate | Incoming resolve |
| **Affiliate Resolver** | Platform Runtime `affiliate-resolver.js` | Path detect + bootstrap + strip | Business rules · share URL |
| **Loyalty Store** | `loyalty-affiliate-store.js` | Ref capture · cookie · register | Build system share URL |
| **Auth / Backend** | `referred_by` pipeline | First-touch persist | Transport format |
| **Metadata** | Article API / Pipeline A/B | canonical sạch | Không ref/publicId |

---

## 7. Đang làm gì / không làm gì

### Đang làm

- **Không có** — task ở trạng thái **chờ Owner giao P3**.
- P2 đã deploy Production (`affResP2_20260725`, nginx sub_filter).

### Không được làm (Plan khóa)

- Mở P4/P5 trước P3
- Tạo Page Registry `/{affiliate}/…`
- Tạo bảng `affiliate_code` riêng
- Đổi first-touch / commission / payout
- Parallel URL builder ngoài Foundation
- Phân tích lại solution (Agent) — chỉ thi công phase được giao

---

## 8. Bước tiếp theo (khi Owner giao)

### P3 — Share Output Switch (scope kế tiếp)

**Objective:** MODIFY `decorateAffiliateRef` / `buildShareUrl` → path `/{publicId}/…`

**Touch points tối thiểu:**

1. `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js`
2. Cache bust (`shareAff*` → fingerprint mới)
3. Regression: Community share · Widget insight · Home referral link · Guest sạch
4. Deliverable: evidence P3 + cập nhật contract comment (query → path)

**Acceptance (Plan §P3):**

- Login share → `/{publicId}/path`
- Guest → canonical không ref/path bịa
- 100% qua Foundation
- Không helper song song

### Sau P3

| Phase | Việc |
|-------|------|
| **P4** | Legacy `?ref=` capture · OG/canonical verify · preview Zalo/FB × 4 mẫu |
| **P5** | Deprecate query outgoing · cleanup fallback · **cần Owner APPROVE Query Deprecation Policy** |

---

## 9. Rủi ro & phụ thuộc

| Rủi ro | Mức | Mitigation |
|--------|-----|------------|
| P3 đổi URL share → link cũ `?ref=` vẫn OK (P4) | Trung bình | Không tắt query capture đến P5 |
| Social preview cache path mới | Trung bình | P4 minimum 4 mẫu |
| CDN cache Foundation cũ | Thấp | Purge + fingerprint sau P3 |
| Nginx IFL pattern false positive | Thấp | P2 negative test `ABC123/...` |
| ABH / entitlement | Không liên quan | Tách track |

---

## 10. Checklist Owner — quyết định nhanh

- [ ] **Giao Execute Phase P3 only** — bắt đầu path outgoing share
- [ ] Hoặc **P4 trước** — chỉ nếu muốn evidence compat trước (Plan không khuyến nghị)
- [ ] **Đóng predecessor** — Plan `?ref=` Foundation: ký DoD Audit §8 nếu coi query era đã xong
- [ ] **Sau P4** — soạn *Query Referral Deprecation Policy* trước P5

---

## 11. Tài liệu tham chiếu (index)

| File | Loại |
|------|------|
| `00-README.md` | Index trạng thái |
| `03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md` | Spec APPROVED |
| `05-Plan-Migrate-Affiliate-Referral-Query-to-Path-Decorators.md` | Plan FINAL |
| `04-G0-Engineering-Change-Record.md` | Governance APPROVED |
| `07-P0-Freeze-Note.md` | P0 deliverable |
| `08-P1-Public-Identity-Readiness-Report.md` | P1 deliverable |
| `09-P2-Resolver-Evidence-Report.md` | P2 deliverable |
| `01-Audit-Affiliate-Share-Capability-2026-07-25.md` | Predecessor AS-IS |
| `06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md` | Predecessor ?ref= |

---

*Báo cáo này là snapshot audit — reproduce: grep `share-action-store`, `affiliate-resolver`, `?ref=` theo §4.*
