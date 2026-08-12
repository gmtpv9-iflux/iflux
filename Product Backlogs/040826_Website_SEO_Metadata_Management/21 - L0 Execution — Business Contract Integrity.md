# 21 — L0 Execution: Business Contract Integrity

**Layer:** L0 (theo `20 - Master Verification Specification.md` v1.1)
**Input:** `01 - Business Requirement.md` (§0 BR Checklist, khóa 2026-08-09) + `03 - Governing SoT.md` (rev. B.3, OWNER LOCKED 2026-08-10) + governance chain `02, 09, 11, 12, 13`.
**Nguyên tắc:** L0 kiểm tra **tính nhất quán của bộ hồ sơ nghiệp vụ đã có**, không phát sinh nghiệp vụ mới. Phần lớn công việc L0 (BR completeness, SoT declaration, contradiction resolution) **đã được thực hiện trong chain governance 01→02→03→09→11→12→13** trước khi task này (Master Verification) bắt đầu — L0 ở đây là xác nhận lại (re-validate), không phải làm lại từ đầu.

---

## L0-TC-01 — BR completeness

**Test:** mọi BR (BR-01…BR-37, BR-45…BR-48, BR-SC) có ID / business intent / acceptance criteria / owner / SoT / test coverage.

**Evidence:**

* `01 - Business Requirement.md` §0.1 (map § → BR) + §0.2 (Atomic Req ID, ~115+ dòng) — mọi BR có ID và § nguồn.
* `03 - Governing SoT.md` §D.1–§D.3 (dòng 303–374) — bảng đối chiếu **từng BR/Req ID** → Audit finding (`AUD-xx`) → SoT section (`§`) → Decision (`D-SEO-xx`) → trạng thái `LOCKED`. Đã cover đầy đủ BR-01…BR-48 + phân nhánh atomic (BR-06.3/06.4, BR-10.2, BR-29.2/29.3, BR-34.4, BR-45.0…45.7…).

**Kết quả:**

| Nhóm BR | Có ID | Có Owner/SoT (đối chiếu §D.1–D.3) | Có test coverage (đối chiếu doc 20 v1.1) |
|---|---|---|---|
| BR-01…BR-14 | ✅ | ✅ (§D.1) | ✅ L0/L1/L2/L3 |
| BR-15…BR-37 | ✅ | ✅ (§D.2) | ✅ L2/L3/L5 (đã bổ sung BR-23/30/31 ở doc 20 v1.1 §22/§13/§13) |
| BR-45…BR-48, BR-SC | ✅ | ✅ (§D.3) | ✅ (đã bổ sung L1-TC-11/12, L5-TC-10, L6-TC-06/07, L7-TC-04 ở doc 20 v1.1) |

**"Owner"** trong ngữ cảnh L0 = SoT section chịu trách nhiệm (không phải tên người) — đúng với cách BRD/SoT vận hành (BR-02.D "System Only" ownership). Không có BR nào thiếu dòng trong §D.1–D.3.

**Acceptance criteria format:** BRD dùng văn phong "MUST / MUST NOT / khóa" thay vì template Given/When/Then literal — đây là **format khác, không phải thiếu nội dung** (mỗi § đều có: điều kiện áp dụng, hành vi bắt buộc, ví dụ invalid). Chấp nhận là tương đương GWT về nội dung.

**Kết luận L0-TC-01: PASS.** Không có BR mồ côi.

---

## L0-TC-02 — BR contradiction

**Test:** kiểm tra inheritance/override/fallback/precedence/ownership/runtime behavior giữa các BR không mâu thuẫn.

**Evidence:** `03 - Governing SoT.md` §A "Gate (Governance)" + §C "Decision Registry" (D-SEO-01…D-SEO-13) — registry này **tồn tại chính vì mục đích này**: mỗi Decision giải quyết một điểm mà nhiều BR/§ giao nhau có thể hiểu khác nhau (ví dụ D-SEO-11 giải quyết mâu thuẫn tiềm ẩn giữa BR-06.3/06.4/BR-10.2/BR-29.2 về HTTP↔robots↔canonical↔sitemap; D-SEO-01/02 giải quyết ranh giới BR-45 vs BR-12/46/47).

Ngoài ra, chain `11 - Full BRD Conformance Challenge Review.md`, `12 - Governance Deviation Register.md`, `13 - Audit Delta Owner Final Decision.md` là các vòng review độc lập đã rà lại toàn bộ BRD tìm mâu thuẫn trước khi Owner khóa SoT rev. B.3 — không phát hiện contradiction chưa xử lý (mọi deviation đã có Owner decision ghi trong `13`).

**Kết luận L0-TC-02: PASS** (dựa trên Decision Registry đã khóa; không phát hiện contradiction mới trong lần rà soát này).

---

## L0-TC-03 — SoT declaration

**Test:** mỗi field có chuỗi Owner → Persistence → Resolver → Runtime consumer → Public output, và là single authoritative source.

**Evidence:** `03 - Governing SoT.md` các § nghiệp vụ (§3 SEO Contract, §4 Metadata Resolution Order, §6–§16 field-level policy, §25/§25.1 Rendering Contract + Singleton) mô tả rõ chain này cho từng field. Đặc biệt:

* §4 "Metadata Resolution Order" = chain Owner→Resolver dùng chung cho mọi field.
* §25/§25.1 = Runtime consumer → Public output, khóa singleton (đúng BR-34.4/§38.1).
* §D-SEO-03 "One SEO Contract / One authority" = tuyên bố single-source tường minh, map BR-34/BR-06/BR-32.

**Kết luận L0-TC-03: PASS.**

---

## L0-TC-04 — Acceptance criteria completeness

Đã giải trình ở L0-TC-01 (format MUST/MUST NOT + ví dụ invalid tương đương GWT). Không lặp lại.

**Kết luận L0-TC-04: PASS.**

---

## L0 Exit Gate

```text
ALL BUSINESS CONTRACTS VALID     → PASS (§D.1–D.3, Decision Registry)
ALL BRs MAPPED                   → PASS (BR-01..37, 45..48, SC — đối chiếu 01 §0 + 03 §D)
ALL SoTs DECLARED                → PASS (03 §3/§4/§25)
NO CONTRADICTION                  → PASS (03 §C Decision Registry + 11/12/13 đã đóng)
NO ORPHAN BR                      → PASS
```

## **L0 = PASS → Unlock L1.**

---

## Lưu ý mang sang L1

* Governance hiện tại (`03` header) ghi: **"Implementation ❌ STOPPED cho items chưa Owner GO sau Plan alignment."** Nghĩa là không phải toàn bộ BR đã được implement — chỉ các wave đã có Owner GO (`14 - Implementation GO Scoped.md`, `17 - Wave GO Conformance Snapshot.md`) mới được coi là "đã triển khai, chờ verify". L1–L7 phải test đúng phạm vi đã GO, không giả định toàn bộ BRD đã implement.
* L1 (Architecture/Foundation) là layer **đầu tiên cần audit code/runtime thật** (không chỉ đối chiếu tài liệu như L0) — bao gồm cả phần Header/App Shell đã audit riêng ở `Product Backlogs/110826_App_Shell_Header_Persistent_Shell_Audit/` (P0+P1+P2 đã deploy). L1 sẽ tái sử dụng evidence đó cho L1-TC-03/04/05, không làm lại từ đầu.
