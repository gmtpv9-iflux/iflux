# Restore Baseline — Identity `community` → `news` / `article`

| Field | Value |
|---|---|
| Task | `05_0826_User_Web_Identity_Migration_Community_to_News` |
| Date | 2026-08-20 |
| Status | **LOCKED — restore ready trước implement** |

Kênh rollback: revert Git → push GitHub → CI. Không rsync. Không GitLab. Không SSH ghi runtime.

## SHA trước task 05

| Môi trường | Branch | SHA đầy đủ | Ghi chú |
|---|---|---|---|
| Staging | `staging` | `373e82192297dc7242f44b785e1b6159db35f324` | Task 04 display/URL Tin tức đã lên Staging |
| Production | `production` | `87c805d8db6f60c0a617919a0fb8e47122687844` | **Không đụng** task 05 |

Parent Staging: `0bf83d20457249c905c7991b8f8d62081a6aec87` (trước task 04). Rollback task 05 **không** tự rollback task 04.

## Rollback target (về SHA trên)

```text
pageKey / route / detect / SEO / entitlement / composition = community
Folder User_Web/community/
Entity tab key = news
SoT Community Layer sở hữu Post (bản trước task 05)
Admin /admin/cong-dong          leftover 301 → /admin/news (Owner mở 2026-08-20)
URL User Web /tin-tuc           không đổi
Production                      không đổi
```

## Cách rollback Staging

```text
git checkout 373e82192297dc7242f44b785e1b6159db35f324 -- <files task 05>
```

hoặc revert commit task 05 khi đã commit. Cấm mixed state app / nginx / SEO.

## Cấm

- Rollback Production (P8 chưa mở).
- Rollback nhầm về `0bf83d2` (mất display Tin tức).
- Rsync / sửa tay runtime.
