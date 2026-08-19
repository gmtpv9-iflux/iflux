# 08 — Removal Audit: Task 04

| | |
|--|--|
| **Ngày** | 2026-08-19 |
| **Release Staging** | `4008e13` |
| **Phương pháp** | Surgical restore shared owners từ contract `30ee7d5^` — **không** `git reset` |
| **Production / leftover 05** | **Không** mutation |

---

# 1. Git / staging

| Check | Evidence | Result |
|---|---|---|
| Branch | `staging` → `github` `4008e13` | PASS |
| Không reset dải 04 | `git revert`/`reset` không dùng; `checkout 30ee7d5^ --` 4 file media owner | PASS |
| Không push `production` | chỉ `git push github staging` | PASS |
| Diff không chứa 05/06 / workflows | commit `4008e13` 13 file: media + nav + catalog + 058/059 + plan | PASS |
| CỔNG URL còn | nav-registry header còn 1 dòng | PASS |

---

# 2. Application code

| Artifact | After |
|---|---|
| `createAssetFromBuffer` | sync `normalizeAndVariants` · `original`/`delivery`/`thumbnail`/`social` · `status=active` |
| `resolveMedia` / profile CRUD / `processQueuedMediaJobs` | **0** (grep js/html) |
| Routes `/profiles*` · `resolve/:profile` | **404** |
| Page Quy chuẩn | file xóa · nav group xóa |
| Catalog `media.*` | `flattenPermissions` = `[]` |
| Consumer dirty hunk | discarded (`import` / SEO / `community-ui` không `resolveMedia`) |

---

# 3. DB `iflux_staging` (059)

| Before | After |
|---|---|
| `media_image_profiles` 7 rows | bảng **DROP** |
| variant `media-*` 17 rows | **0** |
| perm `media.*` | **0** |
| cột `cleanup_eligible_at` / `master_variant_id` / … | **DROP** |
| `043` `media_assets` / `variants` / `usages` / `jobs` / `sources` | **còn** |
| job GENERATE/VERIFY/… | **DELETE 45** · còn **0** |

`iflux_production_next` / leftover `iflux`: **không** chạy 059.

---

# 4. Disk Staging

17 file `*-media-*@*` xóa. Role `original`/`delivery`/`thumbnail`/`social` không đụng hàng loạt.

---

# 5. Smoke

| ID | Case | Result |
|---|---|---|
| S1 | RSS 0 sharp/resize | **PASS** |
| S2 | Upload | **201 · 62ms** · `mas_mszjdq9f_5bd32495` · `active` · `reused: false` · role `original`+`delivery`+`thumbnail` · 0 GENERATE |
| S3 | Import owner | `createAssetFromBuffer` · 0 `resolveMedia` · `publish-check` 200 |
| S4 | Processing | `normalizeAndVariants` lại có; sync trong upload |
| S5 | VERIFY→READY | **Âm PASS** · 0 job VERIFY còn · asset mới `active` |
| S6 | `resolveMedia` / `/profiles` | **Âm PASS** · hàm 0 · HTTP **404** · SEO dùng `resolveSocialCompatibleImage` |
| S7 | Consumer | SEO không `resolveMedia` · delivery URL cũ còn · page `/admin/library/image-profiles` **404** (cả HTTPS) |

---

# 6. 05 / 06 — OUT OF SCOPE — UNCHANGED

| Task | Được phép trong removal? | Đã đụng? | Kết luận |
|---|---|---|---|
| `05_180826_Legacy_Rollback_Backup_and_Retirement` | Không đọc/ghi leftover `:3001` · `/var/www/iflux/production` · `/var/iflux/backend` · `/var/iflux/storage` · DB `iflux` | **Không** | **OUT OF SCOPE — UNCHANGED** |
| `06_180826_Git_Environment_Identity_Standardization` | Chỉ dùng kênh `push staging`. Không đổi workflow, default, ruleset, `production` | **Không** (không sửa `.github/`) | **OUT OF SCOPE — UNCHANGED** |

Removal **đi trên** identity 05/06. Không rollback 05/06.

---

# 7. Decision

**Task 04 application + Staging schema/disk = removed.**  
05/06 = **OUT OF SCOPE — UNCHANGED**.
