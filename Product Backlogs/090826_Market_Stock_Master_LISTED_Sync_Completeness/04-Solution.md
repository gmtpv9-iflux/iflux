# 04 — Solution (PROPOSED)

# Stock Master · LISTED Sync Completeness (Pagination + Identity Authority)

| | |
|--|--|
| **Task ID** | `090826_Market_Stock_Master_LISTED_Sync_Completeness` |
| **Document** | Solution — cách giải quyết (chưa Implementation) |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER LOCKED** · Impl shipped · Verify PASS 2026-08-09 |
| **Parent** | Market Domain SoT [`../080826_Market_Domain_Source_of_Truth_Governance/`](../080826_Market_Domain_Source_of_Truth_Governance/) |
| **Evidence** | KSF / HNX truncation · ~487 mã LISTED miss tên khi reproduce bug |

> **Không** “sửa KSF”. KSF = evidence một lỗi hàng loạt (HNX + UPCOM).  
> **Không** ép Sector-union bổ sung tên — đó là che triệu chứng.

---

## 0. Chuỗi nguyên nhân (đã khóa bằng reproduce)

```text
VNDirect LISTED (authority identity + name metadata)
      ↓
pagination theo từng exchange (HOSE → HNX → UPCOM)
      ↓
❌ Object.keys(seen).length >= totalElements
   (seen = tích lũy 3 sàn; totalElements = của 1 sàn)
      ↓
HNX / UPCOM bị cắt sớm → page tiếp không đọc
      ↓
mã hợp lệ (vd. KSF) không vào LISTED candidate (có companyName/shortName)
      ↓
sector-union chỉ bổ sung ticker (name/short_name cố ý = null)
      ↓
ticker có / thiếu / stub metadata
      ↓
quote path ensureStockRow(ticker, ticker) có thể tạo row
   name=ticker · exchange mặc định HOSE (sai với HNX)
```

**Reproduce (2026-08-09, Production origin):**

| Path | LISTED có tên | Ghi chú |
|------|--------------:|---------|
| Buggy (code hiện tại) | ~823 | HNX break page 1; UPCOM break giữa chừng |
| Correct (đếm theo sàn) | ~1 167 | Đủ trang |
| Delta miss | **~487** | HNX ~199 · UPCOM ~218 · HOSE lệch ~70 |
| KSF trong miss LISTED-named | **Có** (buggy) | VNDirect `code:KSF` đủ tên; floor **HNX** |

---

## 1. Mục tiêu Solution

Đảm bảo **Stock Master không bỏ sót mã hợp lệ do pagination**, đồng thời:

1. **Bảo toàn đầy đủ metadata** từ nguồn LISTED chính thức khi mã đi qua LISTED.
2. **Không** để fallback / sector-union / quote path tạo **identity sai**.
3. Re-sync **idempotent**.
4. Có **reconciliation** LISTED ↔ Master (missing codes) — audit **mọi exchange**, không chỉ KSF.

---

## 2. Nguyên tắc (Authority)

| Nguồn / Path | Vai trò | Được phép |
|--------------|---------|-----------|
| **VNDirect LISTED** (`type:STOCK~status:LISTED~floor:*`) | **Authority** identity + `name` / `short_name` / `english_name` / `exchange` / `isin` | Ghi / cập nhật metadata tên + sàn |
| **Sector-union** (L2 codeList) | **Supplementary discovery only** | Thêm ticker còn thiếu **không** đặt tên; không overwrite name từ null |
| **Quote / price ingest** | Price state only | **Cấm** tạo Stock Master identity đầy đủ; tối đa “price-orphan” tách biệt hoặc skip insert Master |
| **MDM Import Apply** | Apply trusted fields theo SoT BR-11 | Không drop `short_name` / `english_name` khi LISTED candidate có giá trị |

### Non-goals

- Không enrich tên từ sector map / heuristic / hardcode “Sunshine”.
- Không one-off UPDATE KSF.
- Không đổi SoT ownership Sector/Eco trong task này.
- Không gỡ mock quote UI (task riêng — Owner đã mở hướng khác).

---

## 3. Workstream A — Pagination · **MUST FIX**

### A.1 Defect

**File:** `backend/src/modules/market/market-source-adapters.js` → `loadVndirectListedCandidates`

```js
// SAI: seen tích lũy 3 sàn; total = totalElements của sàn hiện tại
if (total != null && Object.keys(seen).length >= total) break;
```

### A.2 Fix (Modify existing — không abstraction mới)

Trong vòng `for (floor of HOSE|HNX|UPCOM)`:

- Đếm **local** theo sàn: `floorSeen` / `namedThisFloor`.
- Điều kiện dừng trang:  
  `rows.length < pageSize` **hoặc**  
  `floorTotal != null && namedThisFloor >= floorTotal`.
- `seen` global chỉ để **dedupe ticker** giữa các sàn — **không** dùng làm ngưỡng so với `totalElements`.

### A.3 Acceptance A

| Check | Pass khi |
|-------|----------|
| HNX pages | Fetch đủ tới `totalElements` (không break page 1 sau HOSE) |
| UPCOM pages | Tương tự |
| HOSE | Không regression |
| Candidate LISTED có tên | Count ≈ full LISTED union (± nhiễu API); **KSF ∈ LISTED-named** với `short_name` = “CTCP Tập đoàn Sunshine” (evidence, không phải scope fix) |
| Audit 3 sàn | Báo cáo missing-vs-source theo HOSE/HNX/UPCOM |

---

## 4. Workstream B — Metadata write completeness · **MUST AUDIT → FIX nếu confirmed**

### B.1 Write-path inventory (Audit evidence 2026-08-09)

| Path | File / fn | Ghi `short_name` / `english_name`? | Rủi ro |
|------|-----------|-----------------------------------|--------|
| **LISTED → ensureStockRow (fallback universe)** | `market-price-sync.service.js` `ensureStockRow` + `syncInstrumentUniverseFromVndirectList` | **Không** — INSERT chỉ `(ticker, name, exchange)`; `ON CONFLICT DO NOTHING` | Candidate LISTED đủ tên vẫn **mất** short/english khi đi fallback |
| **Quote / price fill** | `ensureStockRow(ticker, ticker)` (~line 250) | **Không**; `name=ticker`; exchange default **HOSE** | Tạo identity stub sai sàn (KSF case) |
| **MDM new INSERT** | `market-mdm.service.js` INSERT new | INSERT không kèm short/english; sau đó `handleField` **có** apply nếu candidate có giá trị | OK **nếu** candidate đến từ LISTED đủ tên; **fail** nếu candidate sector-null |
| **MDM handleField** | cùng file | Có — chỉ khi `incoming` non-empty | Không tự bịa tên từ sector |
| **Sector-union candidate** | `market-source-adapters.js` | **Cố ý** `name/short_name = null` | Đúng nếu chỉ discovery; **sai** nếu trở thành authority ghi tên |

### B.2 Verdict Audit B (đề xuất)

| ID | Kết luận | Decision |
|----|----------|----------|
| **B-W1** | Fallback `ensureStockRow` **làm mất** metadata LISTED | **DEFECT confirmed** → FIX |
| **B-W2** | Quote path **tạo** Master row stub sai | **DEFECT confirmed** → FIX |
| **B-W3** | MDM `handleField` có khả năng giữ short/english khi LISTED đủ | Không phải gốc miss KSF; phụ thuộc A |
| **B-W4** | Sector-union null name | **By design** — giữ; không mở rộng thành đặt tên |

→ **A+B không cảm tính:** A MUST FIX; B-W1 + B-W2 đã có evidence → **đưa vào Plan FIX cùng đợt với A** (gọi là **A + B_confirmed**). B-W3 chỉ verify sau A.

### B.3 Fix hướng (Modify existing — khi Owner LOCK Plan)

**B-W1 — `ensureStockRow` / fallback universe**

- Mở rộng signature (hoặc overload nội bộ) nhận optional `{ short_name, english_name, exchange, isin }` từ LISTED candidate.
- `INSERT` đủ cột metadata khi có.
- `ON CONFLICT`: **fill-only** nếu Master đang null/stub (`name = ticker` hoặc `short_name IS NULL`) — không đè giá trị Admin/iFlux-owned đã có (tuân BR-11 trust).
- Sector-union candidate (`name == null`): chỉ `ensure` ticker+exchange nếu thật sự thiếu row; **không** ghi `name = ticker` nếu có thể hoãn tới LISTED; nếu bắt buộc có row thì đánh dấu nguồn `discovery=sector` (field/note hiện có hoặc audit log) — **không** coi là identity hoàn chỉnh.

**B-W2 — Quote path**

- **Cấm** `ensureStockRow(ticker, ticker)` tạo identity đầy đủ.
- Option (chọn 1 khi Plan):
  - **Q1 (ưu tiên):** Chỉ upsert `stock_prices`; nếu ticker chưa có trong `stocks` → **không insert** Master (log miss_master).
  - **Q2:** Insert “price-pending” tách policy (status riêng) — chỉ nếu Owner muốn quote không fail; vẫn **không** set exchange=HOSE mặc định không nguồn.

Khuyến nghị Solution: **Q1** — Master identity chỉ từ LISTED/MDM Apply.

---

## 5. Workstream C — Reconciliation · MUST (sau A)

### C.1 Job / command (Modify existing sync run — không SoT song song)

Sau mỗi universe sync (hoặc admin action “Reconcile LISTED”):

1. Load full LISTED codes + metadata theo 3 sàn (pagination đúng A).
2. Diff vs `stocks` (active):
   - `missing_in_master` = LISTED − Master
   - `stub_identity` = Master có ticker ∈ LISTED nhưng `short_name` null **và** LISTED có shortName / hoặc `name` ∈ {ticker, null}
   - `exchange_mismatch` = Master.exchange ≠ LISTED.floor
3. Ghi vào `market_data_sync_runs` (hoặc change-set/audit hiện có) — **không** silent.
4. Apply fill theo policy A/B (idempotent).

### C.2 Acceptance C

| Metric | Pass |
|--------|------|
| `missing_in_master` sau sync | 0 với LISTED STOCK (trừ mã Owner exclude có chủ đích) |
| `exchange_mismatch` với LISTED | 0 sau reconcile (hoặc queue conflict MDM) |
| Báo cáo theo **HOSE / HNX / UPCOM** | Bắt buộc trong evidence |

---

## 6. Sector-union — giữ đúng vai trò

| Được | Không được |
|------|------------|
| Phát hiện ticker có trong ngành nhưng chưa thấy ở LISTED page (edge) | Gán `companyName` / short từ bất kỳ nguồn nào khác LISTED |
| Bổ sung `sector_code` / mcap nếu có | Overwrite name/short/english đang có |
| | “Fix Sunshine” bằng sector |

Nếu sau A mà sector-union vẫn thấy ticker không có trong LISTED → **ghi nhận anomaly** (delisted/filter), không tự đặt tên.

---

## 7. Solution components (SOL registry)

| SOL | Component | Maps | Priority |
|-----|-----------|------|----------|
| **SOL-MS-01** | Pagination per-exchange complete | A | MUST FIX |
| **SOL-MS-02** | LISTED = identity + name authority | A + B | MUST |
| **SOL-MS-03** | Sector-union supplementary only | A boundary | MUST (no behavior change sang đặt tên) |
| **SOL-MS-04** | ensureStockRow / fallback preserve LISTED metadata | B-W1 | FIX (audit confirmed) |
| **SOL-MS-05** | Quote path không tạo stub identity | B-W2 | FIX (audit confirmed) |
| **SOL-MS-06** | Idempotent re-sync + reconcile report 3 sàn | C | MUST sau A |

---

## 8. Implementation order (đề xuất Plan)

```text
1. SOL-MS-01  Fix pagination (A)
2. SOL-MS-05  Chặn quote stub identity (B-W2) — giảm tạo rác khi test
3. SOL-MS-04  ensureStockRow / fallback fill LISTED metadata (B-W1)
4. Re-run universe sync (idempotent)
5. SOL-MS-06  Reconciliation report HOSE/HNX/UPCOM + stub/exchange mismatch
6. Verification A/B/C — toàn exchange; KSF chỉ là một hàng evidence
```

**Không** ship step “UPDATE stocks SET … WHERE ticker='KSF'”.

---

## 9. Verification (README §3.0 — 3 lớp)

Mọi check **bắt buộc** tách theo exchange.

| Layer | Evidence |
|-------|----------|
| **A Code** | Diff pagination; ensureStockRow/quote path; sector-union vẫn null name |
| **B DB** | Sau sync: count LISTED∩Master; stub count; KSF + mẫu HNX/UPCOM có short_name từ VNDirect; exchange khớp floor |
| **C Runtime** | `loadCandidates('vndirect_finfo')` → KSF (và mẫu) có name/short từ LISTED; reconcile missing_in_master=0 (hoặc giải trình) |

Soft-pass một mã = **FAIL** gate.

---

## 10. Trả lời Owner: A hay A+B?

| | |
|--|--|
| **A** | MUST FIX — không bàn |
| **B** | MUST AUDIT — **đã audit sơ bộ trong §4** |
| **B-W1, B-W2** | Evidence **confirmed defect** → đưa vào Plan **FIX cùng đợt A** (= **A + B_confirmed**) |
| **B cảm tính “mọi metadata path”** | Không — chỉ fix path đã chứng minh |

**Khuyến nghị Solution:** Owner LOCK **A + B_confirmed (W1+W2)** + **C reconcile**.  
Sector đặt tên = **REJECTED**.

---

## 11. Gate

```text
[ ] Owner LOCK Solution này
[ ] Plan checklist (atomic) + Verification map 3 sàn
[ ] Implementation theo §8
[ ] Re-sync + reconcile evidence
[ ] Không có hotfix KSF-only trong diff
```

---

## 12. Files dự kiến đụng (sau LOCK — chưa code)

| File | Change |
|------|--------|
| `backend/src/modules/market/market-source-adapters.js` | Pagination per-floor (A) |
| `backend/src/modules/market/market-price-sync.service.js` | ensureStockRow metadata; bỏ/quote stub (B) |
| `backend/src/modules/market/market-mdm.service.js` | Chỉ nếu audit thêm gap trên INSERT new (B-W3 verify) |
| Sync run / reconcile | Báo cáo missing (C) — ưu tiên extend `market_data_sync_runs` / log hiện có |

**Existing owner:** market price-sync + source-adapters + MDM.  
**Why modify existing:** defect trong pagination/write path hiện có — không tạo sync engine mới.

---

*Solution PROPOSED 2026-08-09 · chờ Owner LOCK trước Implementation.*
