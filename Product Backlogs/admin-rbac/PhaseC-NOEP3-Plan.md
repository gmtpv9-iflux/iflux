# Phase C — NO_EP-3 · `community.stories`

**Trạng thái:** ✅ **PASS / ĐÓNG** — [`PhaseC-NOEP3-PASS.md`](./PhaseC-NOEP3-PASS.md)  
**Cụm:** `community.stories` (Kiểm duyệt chủ đề) — **chỉ 1 page**  
**Mục tiêu:** 6 key NO_EP → 0 — **đã đạt**  
**Mẫu:** [`PhaseC-Report-Template.md`](./PhaseC-Report-Template.md) 🔒

## Keys

| Key | Endpoint |
|-----|----------|
| `edit` | `PATCH /api/community/admin/stories/posts/:id` |
| `delete` | `DELETE …/stories/posts/:id` |
| `publish` | `POST …/publish` |
| `feature_post` | `POST …/feature` |
| `pin_post` | `POST …/pin` |
| `lock_post` | `POST …/lock` |

Đã có: `view` (`GET /admin/chu-de`, `GET /admin/stories/posts`).
