CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 19 — Wave C Audit · Breadcrumb (SOL-BC)

| | |
|--|--|
| **Date** | 2026-08-11 ~01:20 +07 |
| **Mode** | READ-ONLY audit — **không** code · **không** deploy · **không** mở Singleton/Versioning/WATCH/GSC |
| **Authority** | BRD `01` BR-22.1 · SC-09 · SoT B.3 §15 · Solution §23 + Appendix **H SOL-BC** · Plan PD-18 |
| **Scope** | Wave C Breadcrumb only |
| **Out of scope** | Singleton redesign · Versioning · WATCH/SEARCH · GSC/SERP · Soft-nav entity |

---

## A. Executive verdict (Wave C)

```text
PASS (scoped) — with PARTIAL residuals documented
```

| Req | Wave C verdict | Note |
|-----|----------------|------|
| **BR-22.1** | **PASS** (bot / Clean / Contract) | Hierarchy → `BreadcrumbList` First HTML on indexable Clean shells |
| **SC-09** | **PASS** (scoped) | Auto-resolve từ route/entity trên Contract + bot emit |
| Visible + JSON-LD cùng hierarchy | **PARTIAL** | Community SPA aligned; stock/sector/eco **chưa** có visible nav từ cùng model |
| Human hub First HTML LD | **N/A → Singleton DEFER** | Không claim Wave C đóng Singleton |

**Không bẽ Solution:** SOL-BC một module → Contract → head-renderer; Clean URL only; Home Clean = `/cong-dong` (D-SEO-12); không PID trong crumb `item`.

---

## B. SoT / Solution checklist

| Requirement | Authority | Evidence | Result |
|-------------|-----------|----------|--------|
| Generate từ route/entity hierarchy | SoT §15 · Sol §23 | `breadcrumb.js` + bot probes | **PASS** |
| One model → Visible + JSON-LD | SoT §15 · Sol §23 | Module một hierarchy; Community SPA nav/LD aligned; entity detail thiếu visible | **PARTIAL** |
| Không 2 ownership systems | SoT §15 | Platform Contract owns bot LD; SPA community reuse cùng chuỗi Trang chủ→… | **PASS** (community) / **PARTIAL** (entity UI) |
| Clean Public URL targets | Sol §23.1 · SOL-BC H | Probe: 0 `/IFL…` trong `item` trên Clean | **PASS** |
| Home Clean `/cong-dong` | D-SEO-12 · SOL-BC H | Bot `/` và `/cong-dong`: `Trang chủ→/cong-dong` | **PASS** |
| Không mở Singleton / Versioning / WATCH / GSC | Owner locks | Audit không đụng | **PASS** (scope) |

---

## C. Production probes (2026-08-11)

Googlebot vs Human First HTML.

| Surface | Bot BreadcrumbList | Human First HTML | PID in items |
|---------|-------------------|------------------|--------------|
| `/` | Trang chủ → `/cong-dong` | NONE | 0 |
| `/cong-dong` | Trang chủ → `/cong-dong` | NONE | 0 |
| `/thi-truong` | Trang chủ → Thị trường | NONE | 0 |
| `/dong-tien` | Trang chủ → Dòng tiền | NONE | 0 |
| `/goi-cuoc` | Trang chủ → Gói cước | NONE | 0 |
| `/co-phieu/HPG` | Trang chủ → Thị trường → Cổ phiếu → HPG | NONE | 0 |
| `/nganh/ngan-hang` | … → Ngành → Ngân hàng | NONE | 0 |
| `/he-sinh-thai/vin` | … → Hệ sinh thái → vin | NONE | 0 |
| Clean bài viết | Trang chủ → {title} | **Có** (aligned Clean) | 0 |
| Decorated `/IFL…/cong-dong/bai-viet/…` | **NONE** (noindex; không emit LD indexUniverse) | NONE | — |

### Decorated Affiliate (không FAIL Wave C)

Probe bot trên URL `/IFL1TQGM/…/bai-viet/…`:

- `robots: noindex,nofollow`
- Canonical / `og:url` = **Clean** bài viết
- **Không** emit `BreadcrumbList` / WebPage LD (head-renderer chỉ LD khi `indexUniverse`)

Đúng Solution §23.1: không lấy decorated làm SEO graph identity. Breadcrumb trên **Clean** bài viết đã PASS.

---

## D. Hierarchy vs Solution example

Solution example stock:

```text
Trang chủ → Thị trường → Cổ phiếu → VCB
```

Production HPG bot: **khớp pattern**.

Article: Trang chủ (`/cong-dong`) → title — **không** nhân đôi Cộng đồng cùng URL (D-SEO-12 Homepage = Community Clean). Khớp SOL-BC H.

---

## E. Residuals (không tự mở GO)

| Residual | Class | Owner position |
|----------|-------|----------------|
| Human hub First HTML không có BreadcrumbList | Singleton / Option A | **DEFER** Singleton — không claim Wave C |
| Visible breadcrumb stock/sector/eco chưa consume SOL-BC | SoT “display + LD” fleet | **PARTIAL** — cần GO riêng nếu Owner muốn UI entity |
| Leaf eco label `vin` (slug) thay vì tên hiển thị | Quality | **PARTIAL** nhỏ — hints/name resolve |
| Community SPA vẫn inject LD client (cùng hierarchy) | Dual emit path SPA vs bot | Chấp nhận Wave C; Singleton DEFER nếu coi multi-pipeline |

---

## F. Solution integrity (không bẽ)

| Check | Result |
|-------|--------|
| Vẫn một SOL-BC module | **OK** `seo-platform/breadcrumb.js` |
| Contract.breadcrumb + head emit | **OK** |
| Không Affiliate/PID làm crumb target | **OK** |
| Không redesign Singleton trong Wave C | **OK** |
| PD-18 / Appendix H status | Wave C shipped — audit xác nhận bot Clean |

---

## G. Kết luận gửi Owner

1. **Wave C Breadcrumb đạt BR-22.1 / SC-09 trong phạm vi Contract + bot First HTML Clean.**  
2. **Không phá Solution SOL-BC / Clean URL / D-SEO-12.**  
3. Residual Visible entity + Human hub LD = **ngoài Wave C** (Singleton DEFER / GO UI riêng).  
4. **Không** tự mở Singleton · Versioning · WATCH/SEARCH · GSC từ audit này.

```text
STOP & REPORT — Wave C Breadcrumb audit complete
```
