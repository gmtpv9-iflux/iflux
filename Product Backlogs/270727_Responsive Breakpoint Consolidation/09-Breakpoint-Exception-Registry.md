# 09 — Breakpoint Exception Registry

**Date:** 2026-07-27 (rev.6)  
**Status:** **COMPLETE — exceptions empty (all MAP)**  
**Authority:** Owner-only additions · mọi px ngoài Foundation **phải** có row ở đây  
**SoT px values:** [`02-SoT.md`](02-SoT.md) §1 · `layout.css` only

**Populate from:** approved **Phase C Decision Matrix** rows (EXCEPTION / NO MAPPING · KEEP) — **not** 04b draft alone.

---

## 1. Mục đích

`Decision = EXCEPTION` hoặc `NO MAPPING · KEEP` **không đủ** — phải đăng ký registry để:

- GR-BP-01 / GR-BP-02 có whitelist rõ
- CI audit [`11-CI-Breakpoint-Audit.md`](11-CI-Breakpoint-Audit.md) không false-positive
- Tránh Exception thành bãi rác vô hạn

**Rule:** Không row trong registry → **cấm** literal px đó trong code (CI fail).

---

## 2. Schema (bắt buộc mỗi exception)

| Field | Required | Mô tả |
|-------|----------|--------|
| **ID** | ✅ | `EXC-520` · `EXC-900-PRICING` |
| **Semantic** | ✅ | `alert-form-narrow` · `pricing-grid-compact` |
| **Value (px)** | ✅ | Giá trị được phép (vd. `520`) |
| **Foundation map** | ✅ if MAP partial | Token target · hoặc `—` nếu NO MAPPING |
| **Reason** | ✅ | Business / technical |
| **Owner** | ✅ | Module owner |
| **Files (scope)** | ✅ | Danh sách file được phép dùng px này |
| **Consumers** | ✅ | CSS · JS · both |
| **Expiry** | ✅ | ISO date · **max 6 tháng** initial term |
| **Review due** | auto | Expiry − 30 days → flag in audit |
| **Replacement** | optional | Token/semantic khi migrate |
| **Approved** | ✅ | Owner · date |

---

## 2.1 TTL policy (LOCKED)

| Rule | |
|------|--|
| **TTL-1** | Exception mới: **Expiry bắt buộc** · default **≤ 6 tháng** từ Approved |
| **TTL-2** | **30 ngày trước Expiry** → Owner review: **renew** · **migrate** · **remove** |
| **TTL-3** | Quá Expiry không renew → **CI fail** (remove from JSON hoặc migrate code) |
| **TTL-4** | Renew tối đa **+6 tháng**/lần · lý do ghi trong §3 |
| **TTL-5** | Không exception vô hạn trừ Owner explicit **EXC-PERMANENT** + lý do architecture |

**Mục tiêu:** registry không thành bãi rác sau 3 năm.

---

## 3. Active exceptions

| ID | Semantic | px | Foundation map | Owner | Files | Expiry | Approved |
|----|----------|-----|----------------|-------|-------|--------|----------|
| EXC-1200-ADMIN-SHELL | admin-shell-drawer / desktop | 1199.98 · 1200 | — | Admin Shell | components.css · iflux-admin-ui.js | 2027-01-27 | ✅ hotfix 2026-07-27 |

*(Phase C GO: 66 rows MAP to Foundation — no EXCEPTION / KEEP rows required.)*

---

## 4. Ví dụ (pattern — not approved)

### EXC-520 — alert form narrow

| Field | Value |
|-------|-------|
| ID | `EXC-520` |
| Semantic | `alert-form-narrow` |
| px | `520` |
| Foundation map | `—` (NO MAPPING) |
| Reason | Alert form 1-col — không có token giữa xs–sm |
| Owner | Alerts |
| Files | `User_Web/iflux-web-ui/alerts.css` |
| Consumers | CSS |
| Expiry | Review 2027-01-27 (6mo) |
| Replacement | `bp-sm` nếu DS thêm token? |
| Approved | ⏳ |

### EXC-900-PRICING — pricing grid

| Field | Value |
|-------|-------|
| ID | `EXC-900-PRICING` |
| Semantic | `pricing-grid-compact` |
| px | `900` |
| Foundation map | `—` or `bp-lg` (Owner) |
| Reason | Plan card grid 2→1 — feature layout |
| Owner | Subscription · Pricing |
| Files | `User_Web/iflux-web-ui/pricing.css` |
| Consumers | CSS |
| Expiry | **Required** — e.g. 2027-01-27 |
| Approved | ⏳ |

---

## 5. Machine-readable (CI)

CI đọc: [`breakpoint-exceptions.json`](breakpoint-exceptions.json) — **sync với bảng §3** khi Owner approve.

Agent **cấm** thêm exception chỉ trong JSON mà không cập nhật §3 + Owner sign.

---

## 6. Gate

- [ ] Mọi `REVIEW` → `EXCEPTION` / `KEEP` trong 04b có row §3
- [ ] `breakpoint-exceptions.json` synced
- [ ] CI [`scripts/check-breakpoints.py`](../../scripts/check-breakpoints.py) PASS with registry

---

*Exception registry — empty until Phase C.*
