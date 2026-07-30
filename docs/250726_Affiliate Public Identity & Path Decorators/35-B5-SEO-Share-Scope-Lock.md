# B5 — SEO + Share Cleanup · Scope Lock

**Date:** 2026-07-27  
**Status:** **GO — ACTIVE**  
**Predecessor:** B4 migration **CODE COMPLETE** · B4.3 PASS · affiliate root `/{publicId}` Owner confirmed  
**Parallel:** B4.5 soak **tiếp tục** — [`34-B4.5-Stabilization-Scope-Lock.md`](34-B4.5-Stabilization-Scope-Lock.md) §4 tạm khóa  
**ADR:** [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md) §14 B5 · B-HIGH-2

**Governance:** MR-1 · MR-2 · [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md)

---

## 0. GO condition (LOCKED)

> **B5 = metadata + share consumer cleanup — KHÔNG đụng navigation core đã soak.**

Owner **B5 GO** 2026-07-27 — mở song song B4.5 observation (không phá soak).

---

## 1. Vai trò B5

```text
B4  Consumer nav funnel (Writer decorate · DOM · programmatic)  ✅
B4.5  Soak — giữ nguyên core · quan sát regress              ⏳ parallel
B5  SEO metadata sạch + Share outgoing funnel còn sót         ← slice này
B6  Edge cases (payment · QR · campaign · email)                ⏳ sau B5
```

| In scope | Out of scope |
|----------|--------------|
| Canonical / `og:url` / schema **không** chứa `publicId` / `ref` | Đổi route model |
| Share outgoing qua Share Foundation · không `location.href` thô | Sửa **Writer** (`shell-url-writer.js`) |
| Audit + fix **metadata consumers** · HTML static batch (W5 optional) | Sửa **Context** / **Lifecycle** |
| `/chia-se` redirect · referral display đồng bộ root `/{publicId}` | Middleware decoration layer mới |
| Evidence: P4 matrix regressed · grep share bypass | Thay đổi `affiliate-resolver` parse contract |

---

## 2. Frozen — CẤM trong B5 (và B4.5 soak)

| ❌ Cấm | Lý do |
|--------|--------|
| Đổi **route model** / registry ownership | Soak + INV-7 · App Router đã khóa |
| Sửa **`shell-url-writer.js`** (Writer) | B3 CLOSED · single decorate point |
| Sửa **`navigation-context.js`** · **`pnc-lifecycle.js`** | B2 CLOSED |
| Thêm **middleware decoration** mới (nginx sub_filter PNC inject ngoài cache bust) | Phá baseline soak |
| Mở rộng **`IfluxSeoUrl`** với Owner identity | B4.2 — SeoUrl = canonical only |
| Consumer prepend `/IFLxxx/` | MR-1 · Writer owns decorate |

**SEO trong B5** = đảm bảo **output meta sạch** (Pipeline A/B · Article Metadata contract) — **không** đổi cách Writer decorate navigation URL.

---

## 3. B4.5 parallel — tạm khóa (Owner LOCKED)

Trong thời gian soak **song song B5**, **không** làm ở nhánh soak observation:

| ❌ | |
|----|---|
| Đổi route model | |
| Sửa Writer | |
| Sửa Context | |
| Thêm middleware decoration mới | |
| Tối ưu SEO canonical | → thuộc **B5 slice riêng** · evidence tách · không trộn soak sign-off |

Hotfix soak: **consumer-only** · ghi 1 dòng Evidence · không gộp vào B5 PR nếu là regress nav.

---

## 4. Work packages (B5)

### WP-1 — SEO / Metadata audit (read-side)

**Owner:** Article Metadata · community post · entity pages · nginx static head

| Task | Decision |
|------|----------|
| Re-run P4 preview matrix (FB/Zalo UA) | Verify PASS · ghi Evidence |
| `link[rel=canonical]` · `og:url` · JSON-LD | **MUST NOT** contain `publicId` / `?ref=` |
| Bar URL có prefix · meta vẫn canonical sạch | INV-7 + ADR AC metadata |
| Fix gap (nếu có) | **Modify metadata resolver / HTML inject only** — không Writer |

**Reference:** [`13-P4-Evidence-Report.md`](13-P4-Evidence-Report.md) · ADR AC metadata §16

### WP-2 — Share outgoing funnel (consumer) · **GO — Pre-Audit complete**

**Owner:** Share Foundation · interaction catalog · remaining bypass

**Funnel rule (LOCKED):**

```text
canonicalUrl (A — sạch)  →  buildShareUrl(affiliate)  →  shareUrl (B — /IFL…/…)
```

**Không** dùng SEO canonical làm URL share cuối khi intent affiliate.

**Pre-Audit:** [`38-B5-WP2-Pre-Implementation-Audit.md`](38-B5-WP2-Pre-Implementation-Audit.md)

| Consumer | Issue | Target |
|----------|-------|--------|
| `interaction/catalog/index.js` | Fallback `location.href` (C) | Explicit A → Foundation |
| `loyalty-affiliate.js` | `location.href` open affiliate URL | navigate funnel (excl. copy) |
| `runtime/share-feature-boot.js` | post-capture redirect | `IfluxHref.navigate` — align §5 Owner |
| `iflux-web-ui.js` ensureShareAction | lazy load | verify only |
| `community-ui.shareUrl` | dead export | delete |

**Rule:** Outgoing share URL = Share Foundation `buildShareUrl` / `decorateAffiliateRef` · incoming = Loyalty capture (frozen path-only).

### WP-3 — W5 Static HTML (OPTIONAL)

| Item | Note |
|------|------|
| Auth back links `href="/cong-dong"` | Reconcile via `IfluxHref` inject hook hoặc batch — không block B5 PASS |
| Topnav brand `href="/nha-cua-toi"` in legacy HTML | Shell reconcile / B4.2 hook — optional batch |

### WP-4 — Evidence + grep

| Gate | Target |
|------|--------|
| Share `location.href` outgoing (excl. auth/mail) | **0** hoặc EXCLUDED documented |
| Meta publicId leak (sample matrix) | **0** |
| Writer/Context diff | **0** files |

Deliverable: `B5-SEO-Share-Evidence-Report.md`

---

## 5. Acceptance criteria (B5 PASS)

| ID | Criterion |
|----|-----------|
| **AC-B5-SEO-001** | Article + community sample: canonical & `og:url` **không** chứa `IFL…` prefix / `ref=` |
| **AC-B5-SEO-002** | Preview matrix FB/Zalo ≥ 4/4 PASS (P4 regressed) |
| **AC-B5-SHR-001** | Outgoing share/referral display dùng Foundation path decorate · affiliate root = `/{publicId}` |
| **AC-B5-SHR-002** | Không share consumer mới `location.href` tới app-zone URL (grep gate) |
| **AC-B5-REG-001** | B3 Writer + B2 Lifecycle grep/diff **0** · soak S1–S15 không regress |
| **AC-B5-FROZEN** | §2 frozen list — **0** vi phạm |

---

## 6. Dependency graph

```text
Metadata pipeline (read)     Share Foundation (outgoing)
         │                              │
         └──────────┬───────────────────┘
                    ▼
            Consumer modify only
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
Writer          Context        Route model
 FROZEN          FROZEN          FROZEN
```

---

## 7. Deliverables

1. Pre-audit: `36-B5-Pre-Implementation-Audit.md` ✅
2. WP-1 evidence: `37-B5-WP1-SEO-Evidence-Report.md` ✅
3. WP-2 pre-audit: `38-B5-WP2-Pre-Implementation-Audit.md` ✅
4. Code WP-2: after funnel matrix lock
5. `39-B5-WP2-Share-Evidence-Report.md` (post-implement)
6. Update [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md) · README status

---

## Gate decision

| | |
|---|---|
| **B5 GO?** | ✅ **YES — CLOSED** (Owner sign-off 2026-07-27) |
| **B4.5 soak** | ⏳ Parallel · §3 tạm khóa enforced |
| **B5 WP-4** | ✅ PASS — closure evidence 2026-07-27 |
| **B5 Owner sign-off** | ✅ **PASS — 2026-07-27** |
| **B6** | ⏳ After B5 — **OPEN when Owner giao** |

---

*B5 chứng minh SEO/Share tách khỏi navigation decorate — core PNC không đổi.*
