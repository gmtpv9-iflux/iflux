# 05 — Plan (Execution Index)

# Community Article Detail Optimization & Entity Auto-Linking

| | |
|--|--|
| **Task ID** | `090826_Community_Article_Detail_Optimization_Entity_Auto_Linking` |
| **BRD** | [`01-BRD.md`](01-BRD.md) — LOCKED · BR-AD-03 + **BR-AD-12/13 AMENDED** · **46 Req** |
| **Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — rev. B++ |
| **SoT** | [`03-SoT.md`](03-SoT.md) — OWNER ABSOLUTE LOCKED |
| **Solution** | [`04-Solution.md`](04-Solution.md) — OWNER ABSOLUTE LOCKED · Amd A + Amd B |
| **Document** | Plan — execution index (README §2.6) · **không redesign · không code cho đến Owner LOCK Plan** |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER LOCKED** (2026-08-09 — Owner «tiến hành đi») |
| **Implementation** | ✅ **AUTHORIZED** — đúng WP-0…11 · cấm redesign Solution |

> Plan chỉ **index + WP + owner file + verify + rollback**.  
> Architecture đọc Solution. **Cấm** rút gộp atomic Req. Checklist = **46/46** hàng.

---

## 0. Impact Analysis (CG-005) — trước WP

| | |
|--|--|
| **Feature** | Article Detail entity auto-link + sidebar/attribution/related/layout |
| **Current owners** | Ingest: `rss-ingest.service.js` · Article: `community-articles.service.js` · Feed related: `community-feed.service.js` · FE Detail: `community-post-page.js` + `community-ui.js` + `community-store.js` + bridge |
| **Storage/API** | `community_posts.payload` (`tickers`/`sectors`/`ecosystems` string[]) · `GET /articles/:idOrSlug` · `GET /feed?related_to=` · Master `stocks` / `ecosystems` via `stocks.ecosystem_id` |
| **Decision** | **Modify existing** (payload+IDs · XOR · ingest · FE consumer) · **Delete** FE/RSS authority paths · **Reuse** `related_to` · **N/A** Sector auto-pipeline (BR-AD-12 OUT) |
| **Cấm** | New relationship tables trừ discovery buộc Owner · Hybrid Model A content authority · Sector auto-membership |

### WP-0 discovery (occurrence binding shape — chốt trước WP-2)

Canonical persist trên **existing** payload (không bảng mới mặc định):

```text
payload.tickers[]              ← stock membership codes (+ optional ids nếu discovery đủ)
payload.ecosystems[]           ← eco membership slugs/ids sau ≥3 gate
payload.entity_occurrences[]   ← binding: entity_kind, entity_id/code, matched_text, anchor/offset metadata, body_version
```

Nếu existing JSONB không đáp ứng idempotency/re-process → STOP → Solution Amendment (không tự tạo table).

### Attribution field map (WP-4/5)

```text
author     ← upstream author thật (không VCCorp holding meta)
publisher  ← publisher riêng (không = tier_label)
provider   ← vendor/provider (CafeF / VCCorp.vn holding → đây)
vendor     ← optional alias provider khi meta holding
dates      ← published_at / updated_at độc lập
```

---

## 1. Work packages (thứ tự bắt buộc)

| WP | Tên | Solution | Owner files | Depends |
|----|-----|----------|-------------|---------|
| **WP-0** | Impact + occurrence payload shape | Q8 · SOL-AD-06 | discovery → ghi Plan | — |
| **WP-1** | Modify `ARTICLE_ENTITY_XOR` → allow `tickers∪ecosystems`; không ghi Sector | A.6.1 · Amd B | `backend/.../community-articles.service.js` `normalizeArticleInput` + Admin consumers | WP-0 |
| **WP-2** | Ingest Stock resolve vs Master + occurrence binding; bỏ RSS dict authority; VND/HCM precision | SOL-AD-01…06 · 09…11 | `rss-ingest.service.js` + market-master read | WP-1 |
| **WP-3** | Eco derive từ `stocks.ecosystem_id` / Master; gate **≥3**; anti name-match | BR-AD-13.THRESH · SOL-AD-07 | ingest + `market-master.service.js` | WP-2 |
| **WP-4** | Attribution: omit author null; VCCorp→vendor/provider; dates tách; no fixed fallback | Q3/Q6 · BR-AD-03 | ingest author mapping | WP-2 |
| **WP-5** | Article API expose tickers/ecosystems + bindings; no invent | SOL-AD-08 | `community-articles.service.js` `getArticle`/`rowToArticle` | WP-3 · WP-4 |
| **WP-6** | FE Detail: body từ binding; `Name (TICKER)` presentation; no overwrite raw body | Q1/Q2 · SOL-AD-13/14 | `community-store.js` · `community-post-page.js` | WP-5 |
| **WP-7** | Sidebar omit empty; Sector omit; giữ `72ch`; expand main when empty aside | BR-AD-01/02 · Q7 | `community-ui.js` · `community.css` · post-page | WP-6 |
| **WP-8** | Related = `related_to` only; exclude current; gỡ DailyFeed dual path Related | Q4 · BR-AD-04 | bridge · post-page · `community-feed.service.js` | WP-6 |
| **WP-9** | DELETE/disable FE authority Detail (`FALLBACK_TICKERS`/MockMarket/`aggregateMemberships` taxonomy-as-membership) | SOL-AD-15 | store · ui · taxonomy Detail call-sites | WP-6 |
| **WP-10** | Backfill batch controlled (cùng WP-2/3); idempotent | SOL-AD-20 | ingest/admin batch existing | WP-5 |
| **WP-11** | Prod deploy + CF purge + Verification A/B/C evidence | README §3 | Production | WP-7…10 |

```text
WP-0 → WP-1 → WP-2 → WP-3 → WP-5 → WP-6 → WP-7/8/9 → WP-11
                 ↘ WP-4 ↗              ↘ WP-10 ↗
```

---

## 2. Plan Checklist — form README §2.6 (**46/46 atomic — không rút gọn**)

| BR | Req ID | Audit | SoT | Solution | Plan / Action | Status |
|----|--------|-------|-----|----------|---------------|--------|
| BR-AD-01 | BR-AD-01.STOCK | AUD-AD-01 · AUD-AD-08 · AUD-AD-14 | SOT-AD-20 · SOT-AD-06 | SOL-AD-16 Sidebar Conditional · SOL-AD-06 Persist Membership | WP-7: Modify community-ui.js / community-post-page.js — Stock card chỉ khi tickers.length≥1 từ API membership; omit khi 0. Verify C: bài không ticker không có Stock card | PENDING |
| BR-AD-01 | BR-AD-01.SECTOR | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | **Amd B** — Sector OUT OF SCOPE (no auto-link/persist); sidebar omit khi không có membership | WP-1+WP-7+WP-9: OUT pipeline — không persist Sector; DELETE/disable aggregateMemberships→Sector card trên Detail; omit khi không membership. Verify: ingest mới không ghi payload.sectors; empty Sector không mount | PENDING |
| BR-AD-01 | BR-AD-01.ECO | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | SOL-AD-16 · **Amd B** Eco ≥3 threshold trước persist/hiển thị | WP-3+WP-5+WP-7: Eco card chỉ khi ecosystems.length≥1 sau THRESH persist; omit khi []. Verify C: VIC-only → không Eco card; VIC+VHM+VRE ∈ Eco → có Eco card | PENDING |
| BR-AD-01 | BR-AD-01.EMPTY | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | SOL-AD-16 Sidebar Conditional | WP-7: Xóa/omit .ifx-com-side-empty placeholder cho Stock/Sector/Eco/Chủ đề empty; không title-only card. Verify C: không placeholder | PENDING |
| BR-AD-02 | BR-AD-02.WIDTH | AUD-AD-01 · AUD-AD-10 | SOT-AD-21 | SOL-AD-17 · **Amd A Q7** giữ `72ch` baseline | WP-7: Giữ 72ch baseline (community.css); expand main within contract khi aside empty — không bỏ max-width. Verify C desktop | PENDING |
| BR-AD-02 | BR-AD-02.IMG | AUD-AD-01 | SOT-AD-21 | SOL-AD-17 · **Amd A Q7** follow content container | WP-7: Ảnh follow content container (không 100vw). Verify C ảnh trong body | PENDING |
| BR-AD-02 | BR-AD-02.ASIDE | AUD-AD-01 · AUD-AD-10 | SOT-AD-21 | SOL-AD-17 Layout Content-State | WP-7: Khi không sidebar content → không giữ vùng phải ảo (layout content-state). Verify C | PENDING |
| BR-AD-02 | BR-AD-02.RWD | AUD-AD-10 | SOT-AD-21 | SOL-AD-17 Layout Content-State | WP-7+WP-11: Breakpoints aside hiện có; Evidence C desktop/tablet/mobile | PENDING |
| BR-AD-02 | BR-AD-02.SCOPE | AUD-AD-08 | SOT-AD-21 | SOL-AD-17 Layout Content-State | WP-7: Chỉ sửa scoped community.css / Detail classes — cấm global User Web CSS. Verify rg scope | PENDING |
| BR-AD-03 | BR-AD-03.1 | AUD-AD-13 | SOT-AD-14 · SOT-AD-15 | SOL-AD-10 VCCorp / No Fixed Fallback | WP-4+WP-6: Confirm/xóa hard-code CafeF/VCCorp trong Detail renderer; byline chỉ từ API. Verify A: rg literals | PENDING |
| BR-AD-03 | BR-AD-03.2 | AUD-AD-13 · AUD-AD-03 | SOT-AD-02 · SOT-AD-13 | SOL-AD-09 Attribution Canonical · SOL-AD-08 API | WP-4+WP-5: Lineage RSS→ingest→community_posts→getArticle→UI; field map trong Impact. Verify B sample rows | PENDING |
| BR-AD-03 | BR-AD-03.3 | AUD-AD-13 | SOT-AD-13 · SOT-AD-15 | SOL-AD-09 · **Amd A Q6** VCCorp≠author | WP-4+WP-6: Author/publisher hợp lệ hiển thị đúng (vd. VietStock). Verify C sample | PENDING |
| BR-AD-03 | BR-AD-03.4 | AUD-AD-13 | SOT-AD-15 · SOT-AD-14 | SOL-AD-10 · **Amd A Q3** omit author | WP-4+WP-6: author=null → omit author UI; cấm fallback provider/VCCorp/Thành viên làm author. Verify C CafeF missing author | PENDING |
| BR-AD-03 | BR-AD-03.5 | AUD-AD-13 · AUD-AD-03 | SOT-AD-17 | SOL-AD-12 Dates Independent | WP-4+WP-6: Đăng/Cập nhật chỉ từ timestamps; tách khỏi publisher. Verify C | PENDING |
| BR-AD-03 | BR-AD-03.6 | AUD-AD-13 | SOT-AD-02 | SOL-AD-09 · SOL-AD-08 (không xóa DB để fix UI) | WP-4+WP-10: Cấm xóa/sửa DB chỉ để hết lỗi UI; backfill chỉ re-resolve canonical. Verify: không DELETE byline data | PENDING |
| BR-AD-03 | BR-AD-03.7 | AUD-AD-13 · AUD-AD-06 | SOT-AD-15 · SOT-AD-18 | SOL-AD-10 · SOL-AD-14 Runtime Consumer | WP-6+WP-9: Xóa FE invent author/publisher fallback trên Detail. Verify A: không fallback strings | PENDING |
| BR-AD-04 | BR-AD-04.1 | AUD-AD-01 · AUD-AD-09 | SOT-AD-22 | SOL-AD-18 · **Amd A Q4** `related_to` | WP-8: Related = related_to only; exclude current trước render (community-feed.service.js + bridge/post-page). Verify C self ∉ related | PENDING |
| BR-AD-04 | BR-AD-04.2 | AUD-AD-09 | SOT-AD-22 | SOL-AD-18 exclude before render (not CSS-hide) | WP-8: Không CSS-hide self; exclude ở query/merge. Verify A: không hide-by-CSS path | PENDING |
| BR-AD-04 | BR-AD-04.ACC | AUD-AD-01 | SOT-AD-22 | SOL-AD-18 · **Amd A Q4** | WP-8: Enforce current.id ∉ relatedIds (BE + FE defensive). Verify C | PENDING |
| BR-AD-05 | BR-AD-05.AUTH | AUD-AD-02 · AUD-AD-05 · AUD-AD-11 · AUD-AD-12 | SOT-AD-03 | SOL-AD-01 · SOL-AD-02 Ticker vs `stocks` | WP-2: Ingest resolve ticker chỉ vs Master stocks (market-master / DB). Verify A path + B ticker ∈ stocks | PENDING |
| BR-AD-05 | BR-AD-05.BAN | AUD-AD-04 · AUD-AD-06 | SOT-AD-23 | SOL-AD-15 Legacy Authority Removal | WP-2+WP-9: Ngừng RSS hardcoded dict + FE FALLBACK_TICKERS/MockMarket làm authority Detail. Verify A: rg dead call-sites Detail | PENDING |
| BR-AD-06 | BR-AD-06.1 | AUD-AD-05 | SOT-AD-07 | SOL-AD-01 · SOL-AD-02 verify ∈ Stocks | WP-2: ticker ∈ stocks trước persist membership. Verify ingest sample | PENDING |
| BR-AD-06 | BR-AD-06.2 | AUD-AD-05 | SOT-AD-07 | SOL-AD-01 occurrence validation | WP-2: Verify occurrence trong body/title trước bind. Verify false-positive skipped | PENDING |
| BR-AD-06 | BR-AD-06.3 | AUD-AD-05 | SOT-AD-08 | SOL-AD-06 · SOL-AD-13 · **Amd A Q1** occurrence binding | WP-2+WP-6: Persist occurrence binding → deterministic presentation link (không FE guess). Verify C linked body | PENDING |
| BR-AD-06 | BR-AD-06.4 | AUD-AD-05 · AUD-AD-03 | SOT-AD-06 · SOT-AD-19 | SOL-AD-06 Persist Membership (Model B) | WP-0+WP-2: Persist membership + binding trên existing payload (+ IDs). Verify B payload shape | PENDING |
| BR-AD-06 | BR-AD-06.5 | AUD-AD-05 · AUD-AD-07 | SOT-AD-07 · SOT-AD-18 | SOL-AD-14 · **Amd A Q1** render từ binding | WP-6: Detail render từ persisted binding only — cấm linkifyTickersInHtml primary resolve. Verify A call-graph | PENDING |
| BR-AD-07 | BR-AD-07.1 | AUD-AD-05 | SOT-AD-12 · SOT-AD-03 | SOL-AD-03 · **Amd A Q2** Name (TICKER) presentation | WP-2+WP-6: Company-name resolve → presentation Name (TICKER); không ghi đè raw body_html. Verify C | PENDING |
| BR-AD-07 | BR-AD-07.2 | AUD-AD-04 · AUD-AD-06 | SOT-AD-23 | SOL-AD-15 no hardcoded company authority | WP-2+WP-9: Cấm company→ticker hardcode dict authority; chỉ stocks.company_name. Verify A | PENDING |
| BR-AD-08 | BR-AD-08.1 | AUD-AD-05 · AUD-AD-04 | SOT-AD-07 · SOT-AD-09 | SOL-AD-01 · SOL-AD-22 multi-match | WP-2: Persist mọi RESOLVED stock hợp lệ; không cap=1 (nới cap normalize nếu chặn multi). Verify B multi-ticker | PENDING |
| BR-AD-09 | BR-AD-09.CUR | AUD-AD-04 · AUD-AD-06 | SOT-AD-10 | SOL-AD-04 VND currency no-link | WP-2: Context rule currency [number]+VND → DO NOT LINK. Verify sample | PENDING |
| BR-AD-09 | BR-AD-09.TK | AUD-AD-04 | SOT-AD-10 · SOT-AD-09 | SOL-AD-04 VND ticker context rules | WP-2: Ticker VND chỉ khi context stock đủ (Solution rules). Verify sample | PENDING |
| BR-AD-10 | BR-AD-10.GEO | AUD-AD-04 · AUD-AD-06 | SOT-AD-11 | SOL-AD-05 HCM geo no-link | WP-2: TP.HCM / biến thể → DO NOT LINK HCM. Verify sample | PENDING |
| BR-AD-10 | BR-AD-10.TK | AUD-AD-04 | SOT-AD-11 · SOT-AD-09 | SOL-AD-05 HCM ticker context rules | WP-2: Ticker HCM chỉ khi context stock đủ. Verify sample | PENDING |
| BR-AD-11 | BR-AD-11.INGEST | AUD-AD-05 · AUD-AD-14 | SOT-AD-07 | SOL-AD-01 · SOL-AD-19 ingest-time resolution | WP-2+WP-3: Detection/resolve/persist tại ingest; Detail chỉ consume. Verify A ownership | PENDING |
| BR-AD-11 | BR-AD-11.BAN | AUD-AD-07 · AUD-AD-05 | SOT-AD-18 | SOL-AD-14 · SOL-AD-15 remove FE primary resolver | WP-6+WP-9: Cấm FE scan/guess primary trên Detail. Verify A | PENDING |
| BR-AD-12 | BR-AD-12.MODEL | AUD-AD-12 · AUD-AD-14 | SOT-AD-04 OUT | **BR-AD-12 AMEND / Amd B** — không auto-link/derive/persist Sector | OUT OF SCOPE: WP-1/2/3 không implement Sector auto-link/derive/persist. Verify A: không Sector write path mới | N/A — OUT OF SCOPE + verify |
| BR-AD-12 | BR-AD-12.AUTH | AUD-AD-02 · AUD-AD-11 | SOT-AD-04 | **BR-AD-12 AMEND** — Master identity ngoài task; cấm auto-membership | WP-9: Cấm Sector Master/taxonomy làm auto-membership Detail; Master sectors identity ngoài task. Verify A: no Detail Sector derive | N/A — OUT OF SCOPE + verify |
| BR-AD-13 | BR-AD-13.MODEL | AUD-AD-12 · AUD-AD-14 | SOT-AD-05 · SOT-AD-06 | SOL-AD-07 · **BR-AD-13 AMEND** Eco model | WP-3: Eco detect→Master→persist→API→render (cùng foundation Stock). Verify B ecosystems[] khi đủ THRESH | PENDING |
| BR-AD-13 | BR-AD-13.AUTH | AUD-AD-02 · AUD-AD-11 | SOT-AD-05 | SOL-AD-07 Ecosystem Master identity | WP-3: Identity Eco = Master ecosystems + constituents stocks.ecosystem_id. Verify A read Master | PENDING |
| BR-AD-13 | BR-AD-13.THRESH | AUD-AD-14 · AUD-AD-12 | SOT-AD-05 · SOT-AD-09 | SOL-AD-07 · INV-ECO-01/02 — Eco ≥3; 1 mã ≠ Eco | WP-3: Gate ≥3 distinct constituent codes; 1 mã / trùng tên Eco → không persist Eco. Verify C: VIC-only fail · VIC+VHM+VRE pass | PENDING |
| BR-AD-14 | BR-AD-14.PIPE | AUD-AD-04 · AUD-AD-14 | SOT-AD-07 | SOL-AD-01 Common Entity Resolution Pipeline | WP-2+WP-3: Một Entity Resolution foundation (Stock+Eco); Sector ngoài pipeline. Verify A shared path | PENDING |
| BR-AD-14 | BR-AD-14.BAN | AUD-AD-08 · AUD-AD-04 | SOT-AD-01 | SOL-AD-01 · SOL-AD-15 no 3 independent authorities | WP-2/3/6: Không 2 renderer Stock/Eco độc lập hoàn toàn nếu reuse foundation. Verify A | PENDING |
| BR-AD-15 | BR-AD-15.PREC | AUD-AD-04 · AUD-AD-06 | SOT-AD-09 | SOL-AD-22 Precision / Ambiguity | WP-2: Default DO NOT LINK khi ambiguous. Verify samples | PENDING |
| BR-AD-15 | BR-AD-15.SCOPE | AUD-AD-04 | SOT-AD-09 · SOT-AD-10 · SOT-AD-11 | SOL-AD-04 · SOL-AD-05 · SOL-AD-22 | WP-2: Áp dụng VND/HCM/tên thường/viết tắt/địa danh trong cùng precision rules. Verify samples | PENDING |
| BR-AD-16 | BR-AD-16.SAFE | AUD-AD-09 | SOT-AD-24 | SOL-AD-21 Existing Article Safety | WP-6+WP-10: Preserve HTML/links/images/media/metadata; Model B không phá raw body. Verify C regression | PENDING |
| BR-AD-16 | BR-AD-16.SEO | AUD-AD-09 | SOT-AD-24 | SOL-AD-21 SEO/affiliate/URL safety | WP-6+WP-11: Không đổi canonical/SEO/affiliate decorators/Article URL. Verify C URL + share | PENDING |

**Coverage:** **46/46** Req ID từ BRD §10.1. Missing = 0.  
**Status meaning:** `PENDING` = chưa Impl · `N/A — OUT OF SCOPE + verify` = BR-AD-12 (không build Sector auto; vẫn phải verify không sinh).

---

## 3. Verification map (sau Impl — README §3.0)

| BR nhóm | Evidence A (code/path) | Evidence B (DB/API) | Evidence C (Prod UI) |
|---------|------------------------|---------------------|----------------------|
| BR-AD-01.* | sidebar mount/omit call-sites | payload tickers/ecosystems | empty cards gone; VIC-only no Eco card |
| BR-AD-02.* | community.css 72ch + layout | N/A | desktop/tablet/mobile width |
| BR-AD-03.* | byline fields; no hard-code | author/publisher/provider samples | omit author; VietStock OK; no VCCorp default |
| BR-AD-04.* | related_to only; exclude | feed related response | current ∉ related |
| BR-AD-05…08 · 11 · 14 | ingest Master path; no FE primary | membership + occurrences | body links from persist |
| BR-AD-07.1 | presentation renderer | N/A | Name (TICKER) linked |
| BR-AD-09/10/15 | precision rules ingest | N/A | VND currency / TP.HCM no-link |
| BR-AD-12.* | no Sector write/derive | sectors not filled by pipeline | Sector card omit |
| BR-AD-13.* | Eco ≥3 gate | ecosystems[] samples | VIC-only ✗ · 3 mã ✓ |
| BR-AD-16.* | Model B raw body intact | N/A | SEO/URL/affiliate OK |

---

## 4. Rollback

1. Revert WP đã ship (git + deploy previous BE/FE).  
2. Không half-state: binding mới + FE vẫn FALLBACK dual authority.  
3. CF purge sau rollback frontend.  
4. Backfill: dừng batch; bài đã re-process giữ payload an toàn (idempotent).

---

## 5. Anti-patterns (Plan/Impl)

```text
❌ Rút gọn/gộp atomic Req trong checklist
❌ Hybrid Model A = content authority
❌ Ghi đè raw body_html bằng presentation
❌ Stock mention 1 mã → Ecosystem cùng tên
❌ Auto-link/persist Sector (BR-AD-12 OUT)
❌ Giữ ARTICLE_ENTITY_XOR Stock XOR Ecosystem
❌ Related dual path DailyFeed + related_to
❌ FE FALLBACK_TICKERS / MockMarket / taxonomy-as-membership Detail
❌ Bỏ 72ch chỉ vì sidebar empty
❌ New relationship tables không Owner approve
❌ Implementation trước Owner LOCK Plan
```

---

## 6. Quyết định cứng (từ Solution — Plan không đổi)

1. Model B + occurrence binding  
2. `Name (TICKER)` presentation · không overwrite raw body  
3. Author omit khi null · VCCorp holding ≠ author  
4. Related = `related_to` only + exclude  
5. Sector OUT OF SCOPE · Eco ≥3 constituent  
6. Multi-membership = `stocks[]` + `ecosystems[]` · Modify XOR  
7. `72ch` baseline  
8. Payload arrays + IDs first  

Discovery conflict → STOP → Solution Amendment → Owner.

---

## 7. Gate

```text
[x] BRD / Audit / SoT / Solution Absolute Locked
[x] 05-Plan.md OPEN (checklist 46/46)
[x] Owner LOCK 05-Plan («tiến hành đi» 2026-08-09)
[x] Implementation WP-0…11 (shipped core path 2026-08-09)
[x] Smoke resolve: VIC-only → Eco∅ · VIC+VHM+VRE → Eco vingroup
[x] Verification Evidence A/B/C documented — [`06-Verification-Evidence.md`](06-Verification-Evidence.md)
[ ] Final Acceptance ALL PASS — ❌ blocked P0 precision (TIN/THU false-positive)
```

**Verification COMPLETE · Acceptance NOT READY — xem 06 §4 P0 trước khi re-backfill / đóng task.**

---

*Plan OWNER LOCKED 2026-08-09. Task: [`00-README.md`](00-README.md).*
