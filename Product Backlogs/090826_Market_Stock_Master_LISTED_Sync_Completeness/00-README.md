# 00 — README · Stock Master LISTED Sync Completeness

| | |
|--|--|
| **Task ID** | `090826_Market_Stock_Master_LISTED_Sync_Completeness` |
| **Status** | 🟢 Impl shipped · Verify evidence PASS (Prod 2026-08-09) |
| **Surface** | Market Stock Master · VNDirect LISTED ingest |
| **Parent SoT** | [`../080826_Market_Domain_Source_of_Truth_Governance/`](../080826_Market_Domain_Source_of_Truth_Governance/) |
| **Date** | 2026-08-09 |

## Tài liệu

| # | File | Status |
|---|------|--------|
| 04 | [`04-Solution.md`](04-Solution.md) | 🔒 LOCKED · A + B-W1/W2 + C |
| 05 | [`05-Plan.md`](05-Plan.md) | 🔒 LOCKED · Impl AUTHORIZED |
| 06 | [`06-Verification-Evidence.md`](06-Verification-Evidence.md) | 🟢 PASS (3 sàn) |

## Scope

```text
IN:  BR-MS-01…07 (pagination, LISTED authority, no quote stub, reconcile)
OUT: B-W3 MDM · mock Community quotes (task riêng) · hotfix KSF-only
```

## Evidence snapshot (Prod)

- LISTED identity candidates: **1361**
- Reconcile: missing=**0** · exchange_mismatch=**0** · stub=**5** (UPCOM, source cũng thiếu short)
- KSF (evidence): name/short/english/isin đúng · exchange **HNX**
