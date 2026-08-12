CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 14 — Implementation GO (Scoped)

# Epic 040826 · Owner GO 2026-08-10

| | |
|--|--|
| **Status** | 🔓 **GO AUTHORIZED** — scoped only · **P0–P4 DONE** (see [`15`](15%20-%20Implementation%20GO%20Evidence.md)) |
| **Execution SoT** | [`05 - Plan.md`](05%20-%20Plan.md) **Rev A.2** (PD-11…24) |
| **Governing** | SoT **B.3** · Solution **D.1.2** · Register [`12`](12%20-%20Governance%20Deviation%20Register.md) · Audit [`13`](13%20-%20Audit%20Delta%20Owner%20Final%20Decision.md) |
| **Verification log** | [`15 - Implementation GO Evidence.md`](15%20-%20Implementation%20GO%20Evidence.md) (per phase) |

---

## 0. Hard rules

```text
Plan A.2 = SoT thi công.
Chỉ thực hiện PD đã authorize trong GO này.
Không tự mở scope.
Không viết lại BRD.
```

### CẤM tuyệt đối (dù thấy FAIL)

| Forbidden | Why |
|-----------|-----|
| Singleton architecture redesign / claim BR-34.4 PASS | Detector ≠ architecture PASS |
| BR-01.3 Automatic-by-Default “PASS project” / UX rewrite ngoài PD | Chỉ E2E sau wave; không tự sửa |
| Breadcrumb / SOL-BC | Wave C DEFER |
| Versioning / Rollback | Foundation NOTSTART |
| WATCH / SEARCH SEO or shell | Lock #2 |
| GSC / SERP “fix” bằng cách đổi architecture | Evidence sau ổn định; không thay Arch verify |
| Gộp ALT + Social JPEG/PNG | Tracks tách |
| Pipeline SEO riêng cho Zalo | Existing shell only |
| Invent redirect/canonical ngoài D-SEO-12 / D-SEO-13 | SoT B.3 |

---

## 1. Authorized scope — thứ tự bắt buộc

Sau **mỗi** nhóm: Production verification → ghi evidence vào `15`.  
**Full BRD Conformance** chỉ chạy **cuối** toàn bộ P0–P4.

### P0 — Verify / close existing authorized code

| # | Work | Plan PD | Solution |
|---|------|---------|----------|
| 1 | Homepage `/` identity = Community · Clean `/cong-dong` · anti-duplicate (canon / og:url / SD / sitemap / shell / SPA) | PD-11 | D.1.2 §A |
| 2 | `former_slugs` + HTTP 301 → current Clean article URL · 404 unknown | PD-14 | D.1.2 §F |

**Mode:** Verify Production + code. Fix **chỉ** nếu lệch SoT B.3 / Solution D.1.2 trong 2 hạng mục trên. KEEP code nếu đã đúng.

### P1 — Cleanup

| # | Work | Plan PD |
|---|------|---------|
| 3 | Page-level favicon API / store / resolver → **global-only** | PD-13 |

### P2 — Crawler

| # | Work | Plan PD |
|---|------|---------|
| 4 | Zalo = crawler via **existing** hub `418` / shell · article path align existing architecture · no separate pipeline | PD-17 |

### P3 — Social

| # | Work | Plan PD |
|---|------|---------|
| 5 | Social / OG image **JPEG/PNG** output (absolute URL already OK) | PD-20 social half |

**Note:** Nếu Solution detail còn mỏng — amend Solution tối thiểu trong scope format, rồi code. **Không** đụng ALT.

### P4 — Accessibility / SEO (ALT only)

| # | Work | Plan PD |
|---|------|---------|
| 6 | Image ALT — đúng Solution/Plan **riêng** ALT · **không** gộp social format | PD-20 ALT half |

Trước code P4: xác nhận/ghi Solution ALT slice tối thiểu nếu chưa đủ (không mở Social).

---

## 2. Out of scope (explicit)

- PD-12 UI “generated vs override” polish (trừ khi blocker P0–P4)
- PD-15 entity template rebuild (KEEP/consume — không rewrite trừ P0 verify)
- PD-16 Article description refactor
- PD-18 Breadcrumb
- PD-19 Pagination (N/A)
- PD-21 Versioning
- PD-22 WATCH/SEARCH
- PD-23 Singleton architecture
- PD-24 GSC ops

---

## 3. Exit criteria

| Phase | Exit |
|-------|------|
| P0 | Evidence: `/` + `/cong-dong` one Clean identity; former slug 301; unknown 404 |
| P1 | Evidence: page favicon cannot override global in effective/head |
| P2 | Evidence: Zalo UA gets shell/OG on hub + article per existing architecture |
| P3 | Evidence: social/OG consumable JPEG or PNG (or governed fallback) absolute URL 200 |
| P4 | Evidence: ALT SoT path on agreed surfaces (per ALT Solution slice) |
| Wave end | Full BRD Conformance rerun → report (không tự claim PASS ngoài evidence) |

---

## 4. Deploy

Production only · purge Cloudflare sau frontend/nginx/backend thay đổi · không Staging mặc định.

**GO issued by Owner instruction 2026-08-10 — agent MUST follow this file + Plan A.2.**
