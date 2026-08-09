# 09 — BR-11 Verification A/B/C · IA 3 trang + Import ≠ Apply

**Ngày:** 2026-08-08  
**Môi trường:** Production (`iflux.vn`)  
**Governance:** [`Product Backlogs/README.md`](../README.md) §3.0 / §3.5 / Rule 6  
**BRD:** [`01-Business-Requirements.md`](01-Business-Requirements.md) §16 BR-11 (reopen LOCK)

---

## 0. Cleanup audit (nhân bản / thừa / code cũ chi phối)

| Phát hiện | Kết luận | Xử lý |
|-----------|----------|--------|
| `AdmWaveD.initRssSync` / `initRssSchema` không còn HTML call-site | Dead code Wave D stub | **Comment DEAD** trong `admin-wave-d-pages.js` |
| `POST /imports` & `/imports/from-source` vẫn có thể gọi path auto-apply cũ | Code cũ **còn chi phối** nếu không ép defer | **`runImport` luôn `deferApply=true`** (Owner LOCK) |
| `finalStatus` khai báo trong `try` → ReferenceError khi return | Bug chặn Import (failed_sources) | **Fix scope** `let finalStatus` ngoài try — verified |
| UI MDM cũ (Conflict/History thường trực trên 1 trang) | Đã tách 3 trang | Không còn trên `sources.html` |
| Nhân bản page JS | 1 file `sources-page.js` × 3 mode | **Không** clone module |
| Auto-apply nhánh trong `applyCandidateStock` | Còn trong file nhưng **không chạy** vì defer luôn true | Giữ commented-path semantics qua `if (deferApply)`; nhánh else unreachable từ API công khai |

**Verdict cleanup:** Không nhân bản capability. Đã cắt dead Wave-D RSS stub + chặn path auto-apply cũ còn chi phối. Bug `finalStatus` đã sửa trước khi chốt evidence.

---

## 1. Atomic BR checklist (BR-11 reopen)

| BR | Atomic ID | Requirement | Acceptance intent | Evidence A | Evidence B | Evidence C | Evidence location | Gap | Status |
|----|-----------|-------------|-------------------|------------|------------|------------|-------------------|-----|--------|
| BR-11 | BR-11.IA-01 | IA 3 trang: Nguồn · Cấu trúc CP · Lịch sử — không Đồng bộ danh mục | Nav + route 200 đúng HTML | PASS — nav 3 children; routes 200 titles đúng | N/A | PASS — curl pages | §2.1 | — | **PASS** |
| BR-11 | BR-11.IA-02 | Conflict Review không thường trực trên trang cấu trúc | Chỉ offcanvas | PASS — `offcanvas-mdm-conflict` + không panel History trên structure | N/A | PASS — HTML markers | §2.1 | — | **PASS** |
| BR-11 | BR-11.IMP-01 | Import ≠ Apply — Import không ghi Master | Master unchanged sau Import | PASS — `options.deferApply=true` forced in `runImport` | PASS — HPG trước/sau Import giống nhau | PASS — sync-all `defer_apply:true`, conflicts pending | §2.2 | — | **PASS** |
| BR-11 | BR-11.IMP-02 | Import mở phân loại / Conflict chờ | conflicts pending + import `partial` | PASS — API conflicts | PASS — `pending_conf=4`, import status partial | PASS — summary conflict_count=4 | §2.2 | — | **PASS** |
| BR-11 | BR-11.REV-01 | Reject selected không Apply dòng đó | name giữ nguyên sau Reject+Apply | N/A | PASS — `name_rejected=1`; name Master giữ | PASS — reject-batch + apply applied=3 | §2.2 | — | **PASS** |
| BR-11 | BR-11.APP-01 | Apply ghi Master các dòng còn lại | exchange/cap đổi sau Apply | N/A | PASS — HPG → UPCOM\|12345\|small sau Apply | PASS — apply applied=3 | §2.2 | — | **PASS** |
| BR-11 | BR-11.HIS-01 | History completed chỉ sau Apply | `imports?completed=1` chứa success | PASS — history page only | PASS — import → success | PASS — history-has-applied 1 | §2.2 | — | **PASS** |
| BR-11 | BR-11.AUD-01 | Audit Apply sau Apply | audit result=applied gắn import | PASS — audit table trên history page | PASS — `audit_apply` count >0 | PASS — API `/audit` | §2.2 | — | **PASS** |

---

## 2. Evidence raw (reproduce)

### 2.1 Static / Runtime UI (A + C page)

```text
200 | Nguồn Market data | /admin/thi-truong/data-sources
200 | Đồng bộ cấu trúc + Import / Sync + Conflict Review offcanvas | /admin/thi-truong/dong-bo-cau-truc-co-phieu
200 | Lịch sử đồng bộ | /admin/thi-truong/lich-su-dong-bo
200 | RSS catalog restored (rss-map-tbody, no AdmWaveD) | /admin/cong-dong/dong-bo-danh-muc
Nav registry: market-stock-schema · market-sync-history · Nguồn Market data
```

### 2.2 Import ≠ Apply probe (B + C) — import `b15051ea-4870-40c6-86ec-dd17ff8dd29e`

| Step | Result |
|------|--------|
| B-before HPG | `Tập đoàn Hòa Phát\|HOSE\|99999.00\|large` |
| C-import | `defer_apply=true`, `ok_sources=1`, `conflict_count=4`, `import_ids=[b15051ea-…]` |
| B-after-import | **identical** to before → `MASTER_UNCHANGED_AFTER_IMPORT=YES` |
| B pending | `pending_conf=4` |
| C-reject name | `rejected=1` |
| C-apply | `applied=3` |
| B-after-apply | `Tập đoàn Hòa Phát\|UPCOM\|12345.00\|small` |
| NAME_KEPT_AFTER_REJECT | **True** |
| EXCHANGE_APPLIED / CAP_APPLIED | **True** |
| C-history `completed=1` | import status `success` present |

**Ghi chú vận hành:** Sau probe, HPG Master đã **restore** lại `HOSE / 99999 / large` để không để dữ liệu test bẩn Production.

---

## 3. Final Acceptance

| Gate | Result |
|------|--------|
| Mọi atomic BR-11 reopen trong bảng §1 | **PASS** |
| Soft-pass? | **Không** — có DB before/after + API body |
| Cleanup dead/influencing old path | **Done** (Wave-D RSS stub commented; defer forced) |
| Final Acceptance | **PASS** cho phạm vi BR-11 IA + Import≠Apply (reopen 2026-08-08) |

### Phạm vi chưa đóng trong task Market Domain tổng

Các BR ngoài BR-11 (Stock Master đầy đủ, DNSE live adapter auth, Sector/Ecosystem, …) **không** được tuyên bố DONE bởi checklist này — chỉ đóng **BR-11 reopen** (IA + Import≠Apply + History/Audit sau Apply).

---

## 4. Files chạm (implementation + cleanup)

- `Admin_Design_system/app/data/sources.html` · `dong-bo-cau-truc-co-phieu.html` · `lich-su-dong-bo.html` · `sources-page.js`
- `Admin_Design_system/iflux-admin-ui/iflux-admin-nav-registry.js` · `iflux-admin-routes.js` · `admin-rbac-client.js` · `admin-wave-d-pages.js`
- `backend/src/modules/market/market-mdm.service.js` · `market-mdm.routes.js`
- `infra/nginx-iflux-production-locations.conf` (+ live nginx snippets)
- Docs: `01` BR-11 · `00-README` · `08` · **this file `09`**
