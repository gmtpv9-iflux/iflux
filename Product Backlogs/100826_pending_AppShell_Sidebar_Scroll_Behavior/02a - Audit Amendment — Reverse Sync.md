# 02a — Audit Amendment — Reverse Sync / INV-11·12 / BR-AUD.H

| | |
| --- | --- |
| **Task ID** | `100826_AppShell_Sidebar_Scroll_Behavior` |
| **Document** | Mandatory Audit **Amendment** (BRD Reverse Sync amendment) |
| **Status** | 🔒 **AMENDMENT COMPLETE** (2026-08-10) |
| **Amends** | [`02 - Audit`](02%20-%20Audit%20—%20AppShell%20Sidebar%20Scroll%20Behavior.md) v1 |
| **Input BR** | BRD §23 atomic: **BR-01.3 · BR-04.1–5 · BR-AUD.H** · INV-11 · INV-12 · AC-04 · §16.H |
| **Authority** | Audit không đổi BRD · không khóa Solution / boundary công thức |
| **Evidence date** | 2026-08-10 · Production `iflux.vn` Playwright 1280×800 |

---

## 0. Why this amendment

BRD được **AMENDED** sau Audit v1: khóa Reverse Synchronization Boundary, Synchronized Return, INV-11 / INV-12, AC-04 mới, §16.H matrix.

Governance: Audit Checklist phải map **mọi** BR atomic. Amendment này bổ sung các dòng còn thiếu — **không** thay inventory / scroll-context / route matrix đã PASS-AS-IS ở `02`.

```text
BR Checklist (amended)
        ↓
02a maps BR-01.3 · BR-04.* · BR-AUD.H
        ↓
SoT (03) reconcile — đã có SOt-10 / §15 Reverse Sync (Owner LOCKED)
        ↓
Solution
```

---

## 1. Method — baseline vs target

Với mỗi dòng BR-04 / §16.H:

| Layer | Meaning |
| --- | --- |
| **CURRENT** | Behavior đo được hôm nay (chưa có viewport-following AppShell) |
| **TARGET** | Semantic BRD sau khi capability được implement (Verification) |
| **Status** | **GAP** nếu CURRENT ≠ TARGET capability; **PASS-AS-IS** chỉ khi CURRENT đã thỏa semantic *và* không cần capability mới |

**Nguyên tắc:** Không được đánh PASS BR-04 chỉ vì Sidebar `position:static` luôn giữ `docTop` — đó là document-flow thuần, **không** phải viewport-following + delayed reverse.

---

## 2. Runtime evidence (Amendment probe)

Đo `docTop ≈ getBoundingClientRect().top + scrollY` (document-relative top).

### 2.1 Community right — `.ifx-com-feed-sidebar` (Case C · page-owned)

| Metric | Value |
| --- | --- |
| baseline `docTop` | **80** |
| after full cycle `docTop` | **80** (`docTopPreserved: true`) |
| `position` throughout | **static** |
| `followingStateDetected` | **false** |
| deep scrollY=1200 | vpTop **−1120** (rời viewport); docTop vẫn 80 |
| height | **1020** > vh 800 |

### 2.2 Flow left — `.ifx-flow-market-sidebar` (Case C · widget-owned)

| Metric | Value |
| --- | --- |
| baseline `docTop` | **161** |
| after full cycle | **161** preserved |
| `position` | **static** always |
| `followingStateDetected` | **false** |
| height | **889** |

### 2.3 Market left — `.ifx-mkt-sidebar` (Case A · **AppShell-owned**)

| Metric | Value |
| --- | --- |
| baseline `docTop` | **80** |
| after full cycle | **80** preserved |
| `position` | **static** |
| `followingStateDetected` | **false** |
| docH | **800** (= vh) — **không** scroll được sâu trên guest session → §16.H deep-down **chưa tái hiện** trên SB-AS-MKT guest |

### 2.4 Fast vs slow (community / flow)

Tại cùng `scrollY` đích (~800 community / max flow): `docTop` + `position` **giống nhau** giữa slow step và fast jump — kỳ vọng với document-flow thuần; **không** chứng minh target reverse-sync state machine.

---

## 3. §16.H Reverse Sync Matrix — CURRENT baseline

| Test | CURRENT observed | TARGET (BRD) | Status |
| --- | --- | --- | --- |
| Scroll down → reverse ngay | Không jump kiểu following→top; luôn document-flow | Giữ viewport-following đoạn đầu reverse; không jump | **GAP** (chưa có following state để giữ) |
| Scroll down sâu → reverse | Community/Flow: docTop không đổi; sidebar cuốn theo document (có thể rời view) | Giữ following đến Reverse Sync Boundary; không jump | **GAP** |
| Scroll down → reverse → scroll up hết | `docTop` về đúng baseline (80 / 161) vì **chưa từng** following | Sidebar + Main cùng về document position **như chưa từng following** *sau* khi đã following | **GAP** capability; **PASS-AS-IS** chỉ với document-flow thuần (không đủ AC-04) |
| Scroll down → reverse → lại scroll down | Không state machine → không “lỗi state”; cũng không re-enter following | State ổn định; re-enter following đúng trigger 24px | **GAP** |
| Scroll rất nhanh | Đồng bộ document-flow; không following | Không mất sync trong following/reverse | **GAP** (target path) |
| Scroll chậm từng bước | Giống fast về docTop/position | Semantics tương đương | **PARTIAL** (baseline giống; target chưa có) |
| Sidebar ngắn | Market guest short; Main ngắn → không deep scroll | PASS theo AC sau impl | **PARTIAL** evidence |
| Sidebar cao / > viewport | Flow 889 · Community 1020 — Case C đo được | PASS theo AC sau impl | **PASS-AS-IS** geometry; **GAP** behavior |

**Mandatory acceptance (deep → reverse → top):**

| Surface | Có thể chạy deep scroll? | CURRENT | TARGET status |
| --- | --- | --- | --- |
| Community right | YES | docTop preserved; sidebar leaves viewport | **GAP** (no following) |
| Flow left | YES (doc ngắn hơn) | docTop preserved | **GAP** |
| AppShell Market left | NO (guest Main ngắn) | N/A deep | **FINDING** — cần Main dài (published / login) khi Verify |

---

## 4. Reverse Synchronization Boundary — Audit note (không hard-code)

| Question | Audit answer |
| --- | --- |
| Boundary có tồn tại trong code hiện tại? | **Không** — không state, không named boundary |
| Input geometry cần cho Solution | Header **56px**; content top ~**80px**; scroll = **window/html/body**; Sidebar H biến thiên (Market ~355 · Flow ~889 · Com-R ~1020); `align-items: start` trên grid layout |
| BRD cho phép hard-code boundary? | **Không** — Solution xác định từ geometry trên |

---

## 5. BR Checklist rows (Amendment only)

| BR | Atomic | Audit Check | Evidence | Status |
| --- | --- | --- | --- | --- |
| BR-01 | BR-01.3 | Objective 2: reversible geometry-aware relationship đã có trong runtime? | Chỉ document-flow một chiều cuốn theo scroll; không following ↔ synchronized return | **GAP** |
| BR-04 | BR-04.1 | Reverse giữ viewport-following đoạn đầu? | `followingStateDetected: false` mọi probe | **GAP** |
| BR-04 | BR-04.2 | Reverse Sync Boundary concept hiện hữu trong hệ thống? | Không module/state; SoT 03 đã khóa concept ở authority layer | **GAP** (runtime) · concept **SoT-ready** |
| BR-04 | BR-04.3 | Sau boundary: Sidebar+Main đồng bộ document-relative? | Chưa có boundary → chưa có transition | **GAP** |
| BR-04 | BR-04.4 | Full cycle = document position như chưa từng following | Hiện `docTop` luôn ổn vì **không** following — **không** chứng minh AC-04 sau following | **GAP** (AC-04) |
| BR-04 | BR-04.5 | INV-12 no historical drift under following | Drift không phát sinh vì không activate following; target vẫn bắt buộc khi có following | **GAP** (capability) · baseline document-flow **không drift** |
| INV-11 | — | Reversible document position sau chu kỳ có following | Chưa test được path có following | **GAP** |
| INV-12 | — | No permanent alteration of document position by following | Như trên | **GAP** |
| BR-AUD | BR-AUD.H | Matrix §16.H baseline recorded | §3 this document | **PASS-AS-IS** (audit deliverable) · Verification sau impl vẫn bắt buộc |

---

## 6. Compatibility findings (bổ sung)

| ID | Finding |
| --- | --- |
| F-06 | Trên document-flow thuần, `docTop` ổn định qua reverse/full-cycle — **dễ nhầm** với INV-11 PASS. Verification MUST chứng minh sau **đã** enter viewport-following. |
| F-07 | AppShell Market guest Main ngắn → không đủ để mandatory deep-down test trên SB-AS-MKT. Verify cần Main dài hơn Sidebar. |
| F-08 | Community/Flow Case C tốt cho reverse probes nhưng **không** AppShell-owned (xem Audit v1 / SoT). Solution không được lấy page sticky làm AppShell SoT. |
| F-09 | SoT `03` đã khóa Delayed Reverse + Reverse Sync Boundary + reversible position — **khớp** BR amendment. Amendment này **không** xung đột SoT; Solution phải implement đúng SoT+BR, không đổi SoT. |

---

## 7. Amendment DoD

* [x] Map BR-01.3  
* [x] Map BR-04.1–5 · INV-11 · INV-12  
* [x] §16.H matrix CURRENT baseline  
* [x] Mandatory deep→reverse→top evidence (community/flow) + Market limitation noted  
* [x] Reverse Sync Boundary: confirmed absent in runtime; geometry inputs listed  
* [x] Không khóa HOW / công thức boundary  
* [x] Không đánh PASS giả từ document-flow thuần  

**Audit (v1 + 02a) đủ để Solution phase** với SoT 03 đã LOCKED.  
**Cấm** Implementation trước Solution + Plan.
