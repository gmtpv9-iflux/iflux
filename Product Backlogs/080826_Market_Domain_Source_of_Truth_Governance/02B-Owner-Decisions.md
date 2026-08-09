# 02B — Owner Decisions (Pre-SoT Lock Inputs)

| | |
|--|--|
| **Task ID** | `080826_Market_Domain_Source_of_Truth_Governance` |
| **Status** | `OWNER LOCKED` |
| **Date** | 2026-08-08 |
| **Basis** | Mandatory Audit + Pre-SoT Verification + Owner confirmation |
| **Purpose** | Khóa quyết định nghiệp vụ trước khi viết `03 — SoT Governance` |
| **Not** | Solution · Implementation · Full re-audit |

---

## OD-01 — Stock lifecycle: `status` canonical

| | |
|--|--|
| **Decision** | **YES** — `stocks.status` là canonical Stock lifecycle của iFlux. |
| **Action** | `stocks.is_active` phải được **reconcile / deprecate** (không còn dual authority). |
| **Evidence** | Admin Stocks runtime dùng `status`; Prod conflict SSI (`status=active`, `is_active=false`); external providers không ghi 2 field. |
| **SoT** | LOCK trong `03` |

---

## OD-02 — Tách “Ngưỡng lô” ≠ “Nhóm vốn hóa”

| Concept | Vai trò |
|---------|---------|
| **Ngưỡng lô** (`lot_threshold` / `market_lot_config`) | Large-lot / trade-value logic — **giữ riêng** |
| **Nhóm vốn hóa** (Capitalization Group) | Classification `Large` / `Medium` / `Small` — **business attribute riêng** |

Không dùng `lot_threshold` / `market_lot_config` để đại diện Cap Group.

---

## OD-03 — Capitalization Group (không classification engine)

| | |
|--|--|
| **Decision** | **Không** xây Cap Group classification engine (Market Cap + threshold → L/M/S) trong phạm vi task này. |
| **Intake** | Nếu External Data Source đang được chọn (Trusted cho field này) cung cấp Cap Group → tiếp nhận vào Market Master qua sync/import governed. |
| **Conflict** | Source khác mang giá trị khác → **không** auto-overwrite → Data Comparison / Conflict Review → Admin Apply/Reject. |
| **Admin UI** | Stocks Create/Edit: cho phép chọn **Large / Medium / Small**. `Small` bao gồm Small và nhỏ hơn nếu nguồn có (vd. Micro). |
| **Không audit thêm** | Không cần công thức L/M/S riêng của iFlux. |

**SoT implication:** Cap Group = Market Master Data Attribute; có thể nhận từ External Source theo field-level trust; iFlux DB là SoT sau Apply; không tự tính lại trong scope hiện tại.

---

## OD-04 — Field-level source governance (không provider-level authority)

| | |
|--|--|
| **Decision** | **Không** chọn một Provider duy nhất làm authoritative cho toàn Market Domain. |
| **Model** | **Field-level source governance** qua **Market Data Management / External Data Source Management**. |
| **SoT** | **iFlux Market Master Database** = Source of Truth của Market Master Data. External Providers = Data Providers (candidate data). |
| **Per field** | Biết: source đang dùng · trạng thái source · Trusted/Authoritative? · giá trị hiện tại · diff khi sync · Admin accept? |
| **Market Cap / Cap Group** | Cùng nguyên tắc — không cần audit “VNDirect vs DNSE phải là authoritative”. |

Áp dụng cho mọi external providers (DNSE, VNDirect, SSI, FiinPro, …) — BR-11A.

---

## OD-05 — Divisor: bỏ

| | |
|--|--|
| **Decision** | **Bỏ** `divisor` khỏi Market Master SoT / DB và các consumer Admin liên quan. |
| **Evidence** | Không có runtime calc index dùng divisor; chỉ Admin CRUD + schema + docs. |
| **SoT** | LOCK removal; Solution phải plan migrate/remove (không DROP trước Solution APPROVED). |

---

## OD-06 — Sector → Add Stocks

| | |
|--|--|
| **Decision** | **Không phải Owner decision mới.** |
| **Status** | **Requirement đã có trong BRD** (Workflow B) → Audit phát hiện **implementation gap** (Ecosystem có; Sector chưa). |
| **Action** | Solution/Implementation **bắt buộc** bổ sung để đạt BR — cùng converge `stocks.sector_id`. |

---

## OD-07 — Public Read Path

| | |
|--|--|
| **Decision** | Target đã có trong BRD: Public Frontend Master Data → **Internal API → PostgreSQL Market SoT**. |
| **Current gap** | Mock / Registry / seeds (Audit confirmed). |
| **Action** | Migration trong Implementation Plan — không cần quyết lại. |

---

## OD-08 — Trusted Source Apply Policy (scale hàng nghìn mã)

| | |
|--|--|
| **Decision** | **Trusted Source → Auto-Apply for New / Non-Conflicting Data; Admin Approval Required Only for Conflicts.** |
| **Auto Apply** | Entity mới; field Master đang trống (fill); Trusted cho đúng field. |
| **No Action** | Incoming = Current Master. |
| **Admin Review** | Incoming ≠ Current (non-empty) → Apply/Reject trước Override. |
| **Missing** | Không auto-delete / không clear iFlux-owned. |
| **Không** | Trusted ≠ bắt Admin xác nhận từng mã khi không conflict. |
| **SoT** | LOCK §2.5 / §16 / §17 trong `03` |

Áp dụng toàn bộ Market Data Management Import — gồm Cap Group.

---

## Mapping → SoT document `03`

| OD | SoT section expected |
|----|----------------------|
| OD-01 | Field Ownership — Stock.status; deprecate is_active |
| OD-02 | Separate entities: Lot Threshold vs Cap Group |
| OD-03 | Cap Group ownership + intake + Admin editable enum |
| OD-04 | Read/Write authority; External Source field trust matrix |
| OD-05 | Divisor = DELETE from SoT |
| OD-06 | Relationship workflows (gap → must implement) |
| OD-07 | Canonical read path Public FE |
| OD-08 | Trusted Source Auto-Apply / Conflict-only Review |

---

## Explicitly closed (no further Owner Q)

- External Source Governance scope → OD-04 + BR-11A  
- “Market Cap authoritative provider?” → **invalid question** under field-level model  
- Cap Group formula engine → **out of scope**
