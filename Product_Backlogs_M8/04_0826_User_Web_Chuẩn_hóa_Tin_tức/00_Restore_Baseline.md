# Restore Baseline — Chuẩn hóa “Cộng đồng” → “Tin tức”

| Field | Value |
|---|---|
| Task | `04_0826_User_Web_Chuẩn_hóa_Tin_tức` |
| Date | 2026-08-20 |
| Status | **LOCKED — restore ready** |

Kênh: revert Git → push GitHub → CI. Không rsync. Không GitLab.

| Môi trường | Branch | SHA đầy đủ |
|---|---|---|
| Staging | `staging` | `0bf83d20457249c905c7991b8f8d62081a6aec87` |
| Production | `production` | `87c805d8db6f60c0a617919a0fb8e47122687844` |

Rollback target: Display Cộng đồng · `/cong-dong` (+ cây) · leftover `/community` → `/cong-dong` · landing `/` → `/trang-chu` không đổi · identity `community` · Admin `/admin/cong-dong`.

Cấm mixed state app/nginx/SEO.
