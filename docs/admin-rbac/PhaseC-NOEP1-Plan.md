# Phase C — NO_EP-1 · Build API

**Trạng thái:** ✅ **PASS / ĐÓNG** (2026-07-26) — [`PhaseC-NOEP1-PASS.md`](./PhaseC-NOEP1-PASS.md)  
**Cụm:** `subscription.transactions`  
**Mục tiêu:** 6 key NO_EP → 0 (enforce Server + UI gate) — **đã đạt**  
**Mẫu báo cáo:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md)  
**SoT:** Không bỏ/ẩn checkbox Matrix · xây endpoint + `requirePermission`

## Keys trong cụm

| Key | Việc |
|-----|------|
| `subscription.transactions.export` | GET export danh sách đơn |
| `subscription.transactions.refund` | POST hoàn tiền (→ status refunded) |
| `subscription.transactions.status_pending` | Đổi trạng thái → pending |
| `subscription.transactions.status_approved` | Đổi trạng thái → approved |
| `subscription.transactions.status_paid` | Đổi trạng thái → paid |
| `subscription.transactions.status_refunded` | Đổi trạng thái → refunded |

Đã enforce từ trước (không đụng): view · create · edit · cancel · approve_payment · status_rejected.

## Exit

- PATCH đổi status bắt buộc đúng `status_*` (không chỉ `edit`)
- Export / Refund có MW + nút UI `data-ix-perm`
- Evidence: Role thiếu quyền → 403
- Cập nhật Audit list: cụm này NO_EP = 0
