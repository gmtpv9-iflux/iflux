# 00 — README · Market Domain Source of Truth & Data Governance

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Status** | ✅ **BR-11 reopen PASS** — Verification [`09`](09-BR11-IA-Import-Apply-Verification-ABC.md) (A/B/C). Task Market Domain tổng: các BR ngoài BR-11 chưa đóng. |
| **BRD SoT** | [`01-Business-Requirements.md`](01-Business-Requirements.md) — BR-11 revised |
| **Cascade** | [`08-BR11-Import-Operation-Cascade.md`](08-BR11-Import-Operation-Cascade.md) |
| **Verification** | [`09-BR11-IA-Import-Apply-Verification-ABC.md`](09-BR11-IA-Import-Apply-Verification-ABC.md) |
| **Governance** | [`Product Backlogs/README.md`](../README.md) |

## IA (Owner LOCK)

```text
Quản lý Nguồn Dữ liệu
 ├── Nguồn Market data
 ├── Đồng bộ cấu trúc cổ phiếu   ← Import/Sync → Conflict Review (offcanvas)
 └── Lịch sử đồng bộ            ← History + Audit sau Apply
```

## Tài liệu

| # | File | Status |
|---|------|--------|
| 01 | [`01-Business-Requirements.md`](01-Business-Requirements.md) | BR-11 Import≠Apply LOCK |
| 02–04 | Audit / SoT / Solution | Cascade theo BR-11 mới |
| 05 | Checklist soft-pass | SUPERSEDED |
| 07 | Verification pre-remodel | Historical |
| 08 | Import Operation cascade | Active |

## Done khi

```text
3 trang IA live
+ Import mở Conflict Review (không ghi Master)
+ Reject selected → Apply → Master
+ History + Audit chỉ sau Apply
+ A/B/C evidence PASS
```
