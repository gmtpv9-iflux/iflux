# SoT — Interaction Resource Loading (IR-001)

**Mã:** IR-001  
**Feature:** Interaction  
**Trạng thái:** DRAFT — Architecture  
**Ngày:** 2026-07-24  
**Baseline:** Phase 0 V-IR-01…03  
**Tham chiếu:** IO-001 · IA-002 · RL / Shell loading principles

---

## 1. Mục đích

Summary **không** kéo Interactive bundle; **không** init InteractionStore.  
Interactive chỉ load khi Host Interactive mount (sau Resolver).

---

## 2. Luật cứng (K5 / Summary)

| Mode | Interactive bundle | InteractionStore init | Hydrate thread / feed bulk |
| --- | --- | --- | --- |
| **Summary** | **0** | **0** | **CẤM** `hydrateFromApi` feed/thread |
| **Interactive** | Có (Feature boot Host) | Có (theo IA-002) | Thread/target scoped — không market seed thừa |

Summary chỉ được:

- đọc Summary projection (counts) đã có từ Page/Feature nhẹ, hoặc  
- fetch **counts-only** Summary API (TTL theo PS-007)

---

## 3. Interactive load boundaries

| Được | Không |
| --- | --- |
| Mount Host → load Catalog + Store cho **target** hiện tại | `comments ∈ MARKET_PLATFORM_PAGES` kéo market seed ~240KB+ chỉ để bình luận |
| Lazy sheet bundle trên mobile | Luôn `hydrateFromApi({ limit: 100 })` trước khi biết thread |
| Page `/binh-luan` = fallback host — load Interactive **scoped** | Collateral account/messages kéo `stock-comments-ui` nếu không có surface |

Map: **V-IR-01** · **V-IR-02** · **V-IR-03**.

---

## 4. Owner load

| Resource | Owner tải |
| --- | --- |
| Summary counts client | Page Feature / Summary adapter — không Interaction Interactive boot |
| Interactive Panel + Store | Interaction Host path (IO) |
| Market seed / registry | Chỉ page cần market — **không** bắt buộc `pageKey: comments` |

---

## 5. KPI (Q1 — **chưa khóa**)

| KPI | Status Owner |
| --- | --- |
| Interactive entry ≤ 80KB / 700ms | **NFR** — đợi **Phase 5 Loading**; không chặn Phase 2 |

IR-001 không tự khóa số — đo ở Phase 5 / Exit.

---

## Exit IR-001

- [x] Summary = 0 bundle + 0 Store init  
- [x] Cấm hydrate feed bulk trên Summary / comments page sai owner  
- [x] Map V-IR Phase 0  
- [x] Q1 KPI hoãn Phase 5 (Owner)  
- [ ] Đo Phase 5  
- [x] Phase 1 Architecture Draft PASS  
