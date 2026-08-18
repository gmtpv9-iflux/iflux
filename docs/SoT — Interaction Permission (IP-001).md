# SoT — Interaction Permission Boundary (IP-001)

**Mã:** IP-001  
**Feature:** Interaction  
**Trạng thái:** Architecture — **Q3 KHÓA** (Guest Share URL-only Allow)  
**Ngày:** 2026-07-24  
**Baseline facts:** Phase 0 §4.6 · V-IP-01 · V-IP-02

> **Nơi duy nhất** chứa ma trận Guest / User / (Premium…) cho Interaction.  
> IA-001 / IU-001 chỉ gọi `Permission.resolve(...)` → UI state.

---

## 1. Mục đích

Một Permission Engine boundary cho Interaction actions.  
Entitlement (`hasBlock` / plan) là **input** nếu Product bật — không hardcode trong Component.

---

## 2. Contract

```text
Permission.resolve({
  actor,          // guest | user | …
  action,         // view_summary | comment | reply | like | bookmark | share_url | share_bump | reaction
  target,         // post | comment | …
  entitlement?    // optional plan/blocks
}) →
  Allow | LoginRequired | NoPermission | ReadOnly
```

IU map state → CTA (đăng nhập / khóa / ẩn / enable).

---

## 3. Matrix — **KHÓA Q3** (Owner 2026-07-24)

| Action | Guest | User (đã đăng nhập) | Ghi chú |
| --- | --- | --- | --- |
| `view_summary` | YES | YES | Counts-only |
| `comment` | LoginRequired | YES* | *+ entitlement nếu có |
| `reply` | LoginRequired | YES* | |
| `like` | LoginRequired | YES* | TO-BE API (AS-IS mem) |
| `bookmark` | LoginRequired | YES* | Targets = Bookmark Ext |
| `share_url` | **YES** | YES | **Q3 KHÓA** — Guest Share URL-only; ≠ business Interaction |
| `share_bump` | LoginRequired | YES* | Share **counter** = business → API + Summary |
| `reaction` | LoginRequired | YES* | v1 optional |

\* YES* = Allow trừ khi Entitlement chặn.

### Q3 — lý do khóa (Owner)

```text
Share URL  ≠  Business Interaction
```

- Guest Share URL-only: **Allow** (SEO · viral · không đụng business state).  
- Analytics (nếu cần) = endpoint riêng — **không** bắt đăng nhập chỉ để copy/share URL.  
- `share_bump` (counter) vẫn LoginRequired / User + API.

---

## 4. AS-IS → TO-BE (Phase 0)

| AS-IS | TO-BE |
| --- | --- |
| Early-return guest comment trong UI | `LoginRequired` từ IP |
| Shell/page tự quyết | Component chỉ render theo resolve |
| Chưa `hasBlock` chứng minh cho comment | IP + Entitlement catalog (Impl) |

---

## 5. Ngoài scope IP-001

- Watchlist Follow permission (Watchlist / Auth riêng)  
- Admin moderation RBAC (Admin SoT)  
- Insight Export permission  

---

## Exit IP-001

- [x] Contract `Permission.resolve`  
- [x] Guest `share_url` = YES (**Q3 KHÓA**)  
- [ ] Entitlement comment/like gắn catalog (Impl)  
- [x] Phase 1 Architecture Draft PASS  
