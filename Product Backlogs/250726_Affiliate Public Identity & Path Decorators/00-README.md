# Task — Affiliate Public Identity & Path Decorators

**Thư mục:** `docs/250726_Affiliate Public Identity & Path Decorators/`  
**Quy ước:** `DDMMYY_Tên task` · file con = `NN-Tên-file.md` (số thứ tự 00–45)

---

## Trạng thái chuẩn

| Hạng mục | Status |
|----------|--------|
| Spec v1.1 | **APPROVED** — Owner 2026-07-25 |
| G0 ECR-AFF-PATH-2026-07-25 | **APPROVED** — Owner 2026-07-25 |
| Plan | **v1.0 FINAL** — Approved for Implementation |
| **P0 Freeze** | **PASS** — [`07-P0-Freeze-Note.md`](07-P0-Freeze-Note.md) |
| **P1 Identity** | **PASS** — [`08-P1-Public-Identity-Readiness-Report.md`](08-P1-Public-Identity-Readiness-Report.md) |
| **P2 Resolver** | **PASS** — [`09-P2-Resolver-Evidence-Report.md`](09-P2-Resolver-Evidence-Report.md) |
| **P3 Share path decorate** | **PASS** — [`11-P3-Evidence-Report.md`](11-P3-Evidence-Report.md) |
| **P4 Compat + Preview** | **PASS** — [`13-P4-Evidence-Report.md`](13-P4-Evidence-Report.md) |
| **P5 Legacy query removal** | **PASS** — [`15-P5-Legacy-Removal-Report.md`](15-P5-Legacy-Removal-Report.md) |
| **ADR-AFF-007 PNC** | **APPROVED** — [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md) |
| **B1 Foundation** | **PASS** — [`20-B1-Foundation-Evidence-Report.md`](20-B1-Foundation-Evidence-Report.md) |
| **B2 Lifecycle** | **PASS / CLOSED** — [`22-B2-Lifecycle-Evidence-Report.md`](22-B2-Lifecycle-Evidence-Report.md) |
| **B3 Core Nav** | **PASS** — [`24-B3-Core-Navigation-Evidence-Report.md`](24-B3-Core-Navigation-Evidence-Report.md) |
| **B4 Consumer Migration** | **CODE COMPLETE** — [`32-B4.3-Consumer-Audit-Report.md`](32-B4.3-Consumer-Audit-Report.md) |
| **B4.5 Stabilization** | **Parallel soak** — [`34-B4.5-Stabilization-Scope-Lock.md`](34-B4.5-Stabilization-Scope-Lock.md) |
| **B5 SEO/Share** | **PASS — Owner sign-off 2026-07-27** — [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) |

```
Spec ✅ → G0 ✅ → Plan FINAL ✅ → P0–P5 PASS ✅ (Phase A transport)
                                              ↓
                              B0 + B0+ Discovery ✅
                                              ↓
                              ADR-AFF-007 APPROVED ✅
                                              ↓
                              Phase B B1 → B3 ✅
                                              ↓
                              B4 Consumer Migration ✅
                                              ↓
                              B4.5 Stabilization (soak parallel)
                                              ↓
                              B5 SEO/Share ✅ CLOSED
```

**Phase A (P0–P5):** **CLOSED**  
**Phase B (PNC):** B4 **COMPLETE** · B5 **CLOSED** · B4.5 soak parallel

---

## Danh mục tài liệu (00–45)

| # | File | Vai trò |
|---|------|---------|
| 00 | [`00-README.md`](00-README.md) | Index task |
| 01 | [`01-Audit-Affiliate-Share-Capability-2026-07-25.md`](01-Audit-Affiliate-Share-Capability-2026-07-25.md) | AS-IS audit |
| 02 | [`02-Affiliate-Status-Audit-Report.md`](02-Affiliate-Status-Audit-Report.md) | Status snapshot |
| 03 | [`03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md`](03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md) | Spec APPROVED |
| 04 | [`04-G0-Engineering-Change-Record.md`](04-G0-Engineering-Change-Record.md) | G0 APPROVED |
| 05 | [`05-Plan-Migrate-Affiliate-Referral-Query-to-Path-Decorators.md`](05-Plan-Migrate-Affiliate-Referral-Query-to-Path-Decorators.md) | Plan FINAL |
| 06 | [`06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md`](06-Plan-Extend-Share-Capability-Affiliate-URL-Decoration.md) | Share plan |
| 07 | [`07-P0-Freeze-Note.md`](07-P0-Freeze-Note.md) | P0 deliverable |
| 08 | [`08-P1-Public-Identity-Readiness-Report.md`](08-P1-Public-Identity-Readiness-Report.md) | P1 deliverable |
| 09 | [`09-P2-Resolver-Evidence-Report.md`](09-P2-Resolver-Evidence-Report.md) | P2 deliverable |
| 10 | [`10-P3-Pre-Implementation-Audit.md`](10-P3-Pre-Implementation-Audit.md) | P3 pre-audit |
| 11 | [`11-P3-Evidence-Report.md`](11-P3-Evidence-Report.md) | P3 deliverable |
| 12 | [`12-P4-Pre-Implementation-Audit.md`](12-P4-Pre-Implementation-Audit.md) | P4 pre-audit |
| 13 | [`13-P4-Evidence-Report.md`](13-P4-Evidence-Report.md) | P4 deliverable |
| 14 | [`14-P5-Pre-Implementation-Audit.md`](14-P5-Pre-Implementation-Audit.md) | P5 pre-audit |
| 15 | [`15-P5-Legacy-Removal-Report.md`](15-P5-Legacy-Removal-Report.md) | P5 deliverable |
| 16 | [`16-B0-Architecture-Discovery-Audit.md`](16-B0-Architecture-Discovery-Audit.md) | B0 discovery |
| 17 | [`17-B0-URL-Ownership-Navigation-Pipeline-Audit.md`](17-B0-URL-Ownership-Navigation-Pipeline-Audit.md) | B0+ pipeline |
| 18 | [`18-ADR-AFF-007-Personal-Navigation-Context.md`](18-ADR-AFF-007-Personal-Navigation-Context.md) | ADR PNC |
| 19 | [`19-PNC-State-Transition-Matrix.md`](19-PNC-State-Transition-Matrix.md) | Transition SoT |
| 20 | [`20-B1-Foundation-Evidence-Report.md`](20-B1-Foundation-Evidence-Report.md) | B1 PASS |
| 21 | [`21-B2-Lifecycle-Scope-Lock.md`](21-B2-Lifecycle-Scope-Lock.md) | B2 scope |
| 22 | [`22-B2-Lifecycle-Evidence-Report.md`](22-B2-Lifecycle-Evidence-Report.md) | B2 PASS |
| 23 | [`23-B3-Core-Navigation-Scope-Lock.md`](23-B3-Core-Navigation-Scope-Lock.md) | B3 scope |
| 24 | [`24-B3-Core-Navigation-Evidence-Report.md`](24-B3-Core-Navigation-Evidence-Report.md) | B3 PASS |
| 25 | [`25-B4-Pre-Migration-Audit.md`](25-B4-Pre-Migration-Audit.md) | B4 pre-audit |
| 26 | [`26-B4-Consumer-Migration-Scope-Lock.md`](26-B4-Consumer-Migration-Scope-Lock.md) | B4 scope |
| 27 | [`27-B4.1-Identity-Context-Boundary-Audit.md`](27-B4.1-Identity-Context-Boundary-Audit.md) | B4.1 audit |
| 28 | [`28-B4.2-Consumer-Href-Funnel-Scope-Lock.md`](28-B4.2-Consumer-Href-Funnel-Scope-Lock.md) | B4.2 scope |
| 29 | [`29-B4.2-Consumer-Href-Funnel-Evidence-Report.md`](29-B4.2-Consumer-Href-Funnel-Evidence-Report.md) | B4.2 evidence |
| 30 | [`30-B4-W1-Consumer-Migration-Evidence-Report.md`](30-B4-W1-Consumer-Migration-Evidence-Report.md) | B4 W1 |
| 31 | [`31-B4-W2-Consumer-Migration-Evidence-Report.md`](31-B4-W2-Consumer-Migration-Evidence-Report.md) | B4 W2 |
| 32 | [`32-B4.3-Consumer-Audit-Report.md`](32-B4.3-Consumer-Audit-Report.md) | B4.3 PASS |
| 33 | [`33-Navigation-Conformance-Report.md`](33-Navigation-Conformance-Report.md) | Living conformance |
| 34 | [`34-B4.5-Stabilization-Scope-Lock.md`](34-B4.5-Stabilization-Scope-Lock.md) | B4.5 soak |
| 35 | [`35-B5-SEO-Share-Scope-Lock.md`](35-B5-SEO-Share-Scope-Lock.md) | B5 scope lock |
| 36 | [`36-B5-Pre-Implementation-Audit.md`](36-B5-Pre-Implementation-Audit.md) | B5 pre-audit |
| 37 | [`37-B5-WP1-SEO-Evidence-Report.md`](37-B5-WP1-SEO-Evidence-Report.md) | WP-1 PASS |
| 38 | [`38-B5-WP2-Pre-Implementation-Audit.md`](38-B5-WP2-Pre-Implementation-Audit.md) | WP-2 pre-audit |
| 39 | [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) | **B5 closure + Owner sign-off** |
| 40 | [`40-B5-WP4-Grep-Audit.md`](40-B5-WP4-Grep-Audit.md) | WP-4 Step 1 |
| 41 | [`41-B5-WP4-SEO-Regression.md`](41-B5-WP4-SEO-Regression.md) | WP-4 Step 2 |
| 42 | [`42-B5-WP4-Share-Regression.md`](42-B5-WP4-Share-Regression.md) | WP-4 Step 3 |
| 43 | [`43-B5-WP4-Navigation-Regression.md`](43-B5-WP4-Navigation-Regression.md) | WP-4 Step 4 |
| 44 | [`44-B5-Article-IX-Desktop-Sidebar-Audit.md`](44-B5-Article-IX-Desktop-Sidebar-Audit.md) | IX sidebar audit |
| 45 | [`45-B5-Interaction-Ownership-Audit.md`](45-B5-Interaction-Ownership-Audit.md) | IX ownership audit |

---

## Bước tiếp theo (sau B5 sign-off)

1. **B4.5** — soak parallel (§4.1 locked)
2. **B5.4** — Entity/List SSR Canonical
3. **B5.5** — JSON-LD SSR
4. **B5.6** — Hợp nhất SEO apply
5. **B6** — Payment · QR · Campaign · Email

Monitor Production:

- **A — Path incoming:** volume `/IFL…/…`
- **B — Path health:** 404/500/loop trên affiliate prefix
