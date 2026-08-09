# 00 — README · Community Article Detail Optimization & Entity Auto-Linking

| | |
|--|--|
| **Task ID** | `090826_Community_Article_Detail_Optimization_Entity_Auto_Linking` |
| **Status** | 🔴 Verification COMPLETE · **NOT ALL PASS** (21 PASS · 17 PARTIAL · 8 FAIL) · blocked P0 precision |
| **Surface** | User Web Article Detail · `/cong-dong/bai-viet/:slug` |
| **Module** | Cộng đồng · RSS Ingestion · Entity Resolution |
| **Governance** | [`Product Backlogs/README.md`](../README.md) |
| **Date** | 2026-08-09 |

## Tài liệu

| # | File | Status |
|---|------|--------|
| 01 | [`01-BRD.md`](01-BRD.md) | 🔒 OWNER LOCKED · **BR-AD-03** + **BR-AD-12/13 AMENDED** (Sector OUT · Eco ≥3 · 46 Req) |
| 02 | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) | 🔍 COMPLETE rev. **B++** · checklist 46/46 |
| 03 | [`03-SoT.md`](03-SoT.md) | 🔒 **OWNER ABSOLUTE LOCKED** · cascade BR-AD-12/13 |
| 04 | [`04-Solution.md`](04-Solution.md) | 🔒 **OWNER ABSOLUTE LOCKED** · Amd A + **Amd B** (= BR cascade) |
| 05 | [`05-Plan.md`](05-Plan.md) | 🔒 **OWNER LOCKED** · checklist 46/46 · Impl AUTHORIZED |
| 06 | [`06-Verification-Evidence.md`](06-Verification-Evidence.md) | 🔴 COMPLETE · **NOT ALL PASS** · 46/46 hàng A/B/C |

## Thứ tự bắt buộc

```text
BRD (Owner LOCK + AMEND)
 ↓
Mandatory Audit (đối chứng BR đã amend)
 ↓
SoT (OWNER ABSOLUTE LOCKED + cascade)
 ↓
Solution (Absolute Locked + Amd B)
 ↓
Plan
 ↓
Implementation
 ↓
Verification A/B/C
```

## Traceability (README §2) — đầy đủ atomic

```text
BRD §10.1 Registry — 46 Req ID (BR-AD-01…16 + BR-AD-13.THRESH)
        ↓
Audit §1 Checklist — 46/46 hàng (form README §2.3) + AUD-AD-01…14 evidence
        ↓
SoT §1A/§1B — 46/46 Req (form README §2.4) — ABSOLUTE LOCKED
        ↓
Solution §0.1 SOL-AD-* + §0.2 Checklist — 46/46 Req (form README §2.5)
        ↓
Plan Checklist §2 — **46/46** Req (form README §2.6) — LOCKED
        ↓
Verification §2 — **46/46** Req (form README §3.0.3) — NOT ALL PASS
```

**Coverage verify (2026-08-09):** BRD 46 · Audit 46 · SoT 46 · Solution 46 · Plan 46 · Verification 46 · missing = 0.  
**Acceptance:** ❌ blocked — P0 false-positive ticker (`TIN`/`THU`/…) · xem [`06-Verification-Evidence.md`](06-Verification-Evidence.md).

## Nguyên tắc (đã khóa — đối chứng chuỗi)

> Market Master = entity **identity**; Article Record = **membership**.  
> `community_posts` = domain; Article API = read contract (không SoT thứ hai).  
> Frontend = consumer — **không** invent entity/author/publisher; DOM ≠ content SoT.  
> Attribution: Author ≠ Publisher ≠ Vendor ≠ Membership Tier; `VCCorp.vn` ≠ default author.  
> Precision-first · Empty sidebar omit · Related self-exclude.  
> **BR-AD-12 AMEND:** Sector **OUT OF SCOPE** (không auto-link/persist).  
> **BR-AD-13.THRESH:** Eco chỉ khi **≥3** mã thuộc Eco được nhắc · 1 mã ≠ Eco dù trùng tên.  
> Membership task này: `stocks[]` + `ecosystems[]`.

## Liên quan

- List/lazy-load (đã ship, verification riêng): [`../080826_Community_Article_List_Category_LazyLoad/`](../080826_Community_Article_List_Category_LazyLoad/)
- Market Master / Stocks SoT: [`../080826_Market_Domain_Source_of_Truth_Governance/`](../080826_Market_Domain_Source_of_Truth_Governance/)
