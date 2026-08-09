# Phase 0 — Baseline · PLAN (Task 4 · Loading Strategy)

**Trạng thái:** 📋 **PLAN** · chờ Owner **review + duyệt** (SoT §0.13)  
**SoT:** `SoT — Resource Loading Strategy (Task 4).md` **v1.6** · §7 · §0.12 · §0.13 · §14  
**Môi trường:** Production User Web `https://iflux.vn`  
**Phạm vi Plan này:** chỉ Phase 0 — **không** thi công · **không** Analysis · **không** sửa code

> Theo SoT **§0.13**: Plan → Owner duyệt → «Thi công Phase 0» → mới ghi Evidence / Exit.  
> Bản thi công sớm trước §0.13 **không** tính Exit — Evidence chỉ khóa sau khi Plan này được duyệt + lệnh Thi công.

---

## 0. Neo Plan (bám SoT)

### Đích Task 4 (nhắc)
Mỗi resource tải đúng đối tượng · thời điểm · nhu cầu · đơn vị kiến trúc (Policy + Resource Architecture).

### Đích Phase 0 (SoT §7) — Plan này chỉ làm đúng 2 việc sau khi duyệt
1. Đóng băng **Catalog trang phạm vi §14** (đủ, không bỏ sót).  
2. Với trang Owner mở: đóng băng bằng chứng từ **PSI Package** (§0.12) — ít nhất neo `/cong-dong`.

### Hành trình (Plan chỉ mở Phase 0)

| Phase | Mục đích | TT Plan |
|-------|----------|---------|
| **0 Baseline** | Catalog + PSI đóng băng | **PLAN — review** |
| A … Gate | Theo SoT | Chưa lập Plan |

### Tài liệu tham chiếu

| Vai trò | Tài liệu |
|---------|----------|
| **SoT bắt buộc** | Task 4 SoT **v1.6** (§0.13 Plan gate · §7 Phase 0) |
| Consume | Task 3 Exit · Catalog 24 trang Phase C |
| Không làm lại | Audit Ownership / Manifest / State Machine |

### Invariant Phase 0 (SoT §0 + §7)
- Không đổi Owner / Dependency Task 3  
- Không tự bịa list JS/CSS blocking  
- Không Analysis Depth / Consumers / Cost / Policy gợi ý (để Phase A)  
- Mỗi trang sau = một **PSI Package** Owner mới  
- **Không thi công** khi Plan này chưa Owner duyệt  

### Scope Boundary (SoT)

| | Phase 0 |
|--|---------|
| **Allowed** | Khóa Catalog §14 · Ghi Evidence từ PSI Package Owner · Nhãn sơ bộ blocking/unused/partial · Cột TT PSI/Baseline |
| **Not Allowed** | Sửa Production · Loading Analysis đầy đủ · Architecture/Policy Catalog đích · Split/defer code · Thi công khi Plan chưa duyệt |
| **Out of Scope** | Cloudflare beacon · Backend · Audit Task 3 |

---

## 1. Deliverable khi Thi công (sau duyệt Plan)

1. Catalog trang phạm vi — bảng §2 khóa đủ 24 dòng.  
2. Quy ước PSI §6 ghi nhận (đã có từ SoT v1.5).  
3. Evidence trang neo `/cong-dong` — blocking JS+CSS (+ unused nếu Owner gửi) trong §4.  
4. Acceptance §7 + chữ ký Owner Exit.

**Không** trong Phase 0: Analysis Sheet · Architecture Catalog · đổi Runtime.

---

## 2. Catalog trang — khung Plan (khóa khi Thi công)

Neo SoT §14.2 · `iflux-routes.js` / `path-base.js`. Cột TT = ⬜ đến khi Thi công.

| # | pageKey | URL công khai | Nhóm | TT PSI | TT Baseline |
|---|---------|---------------|------|--------|-------------|
| 1 | `home` | `/nha-cua-toi` | Auth · Published | ⬜ | ⬜ |
| 2 | `market` | `/thi-truong` | Published | ⬜ | ⬜ |
| 3 | `community` | `/cong-dong` | Core · **neo** | ◐ PSI đã gửi · chờ khóa khi Thi công | ⬜ |
| 4 | `flow` | `/dong-tien` | Core | ⬜ | ⬜ |
| 5 | `loyalty` | `/thanh-vien` | Auth | ⬜ | ⬜ |
| 6 | `faq` | `/hoi-dap` | Lean · đối chứng | ⬜ | ⬜ |
| 7 | `account` | `/tai-khoan` | Auth · Pattern C | ⬜ | ⬜ |
| 8 | `messages` | `/tin-nhan` | Auth | ⬜ | ⬜ |
| 9 | `stocks` | `/co-phieu` | Entity list | ⬜ | ⬜ |
| 10 | `sectors` | `/nganh` | Entity list | ⬜ | ⬜ |
| 11 | `ecosystems` | `/he-sinh-thai` | Entity list | ⬜ | ⬜ |
| 12 | `cauChuyen` | `/cau-chuyen` | Entity list | ⬜ | ⬜ |
| 13 | `stock` | `/co-phieu/{ticker}` | Entity · Auth | ⬜ | ⬜ |
| 14 | `sector` | `/nganh/{slug}` | Entity detail | ⬜ | ⬜ |
| 15 | `family` | `/he-sinh-thai/{slug}` | Entity detail | ⬜ | ⬜ |
| 16 | `cauChuyenDetail` | `/cau-chuyen/{slug}` | Entity detail | ⬜ | ⬜ |
| 17 | `pricing` | `/goi-cuoc` | Lean · đối chứng | ⬜ | ⬜ |
| 18 | `search` | `/tim-kiem` | Core | ⬜ | ⬜ |
| 19 | `watchlist` | `/theo-doi` | Auth | ⬜ | ⬜ |
| 20 | `communityWrite` | `/cong-dong/viet-bai` | Auth | ⬜ | ⬜ |
| 21 | `checkout` | `/User_Web/account/checkout.html` | Auth | ⬜ | ⬜ |
| 22 | `communityPost` | `/cong-dong/bai-viet/{ref}` | Entity công khai | ⬜ | ⬜ |
| 23 | `share` | `/chia-se` | Optional · lean | ⬜ | ⬜ |
| 24 | `stockComment` | `/User_Web/stock/comment.html` | Auth · Entity | ⬜ | ⬜ |

**Mẫu đối chứng sau P0 (không làm trong P0):** 1 Core nặng · 1 Lean · 1 Auth — mỗi cái một PSI riêng.

---

## 3. Owner PSI Package (SoT §0.12)

| Thành phần | Bắt buộc? | Input sẵn (chưa khóa Evidence) |
|------------|-----------|--------------------------------|
| URL | Có | `https://iflux.vn/cong-dong` |
| `pageKey` | Có | `community` |
| JS chặn hiển thị đủ | Có | ✅ Owner paste 2026-07-22 |
| CSS chặn hiển thị đủ | Có | ✅ Owner paste 2026-07-22 |
| Unused / tiết kiệm ước tính | Nên | ✅ unused JS + **830 ms** chặn hiển thị |

**Khi Thi công:** Agent **chỉ** chép nguyên gói Owner vào §4 — không tự thêm/bớt URL blocking.

---

## 4. Evidence — placeholder (điền khi Thi công)

### 4.1 `/cong-dong` (`community`)

| Hạng mục | TT Plan |
|----------|---------|
| PSI Package Owner | ◐ đã nhận chat — **chưa** khóa vào Baseline đến khi Thi công |
| Bảng resource Baseline | ⬜ |
| Nhãn blocking / unused / partial | ⬜ |

**Khi Thi công sẽ ghi 3 bảng:**
- **4.1.A** JS chặn hiển thị (từ audit «Yêu cầu chặn hiển thị»)  
- **4.1.B** CSS chặn hiển thị (cùng audit)  
- **4.1.C** JS unused (nếu Owner đã gửi)  

**Tóm tắt input Owner (tham chiếu Plan — chưa = Evidence khóa):**

| Nhóm | Số mục (ước từ paste Owner) | Ghi chú Plan |
|------|------------------------------|--------------|
| JS blocking | 1 (`path-base.js`) | Chỉ ghi khi Thi công |
| CSS blocking | ~19 (icons + Admin tokens + shell…) | Chỉ ghi khi Thi công |
| JS unused | ~35 (seed · platform-layers · mock · …) | Nhãn sơ bộ; Analysis = Phase A |
| Out of Scope | Cloudflare beacon | Không tối ưu trong Task 4 |

### 4.2 Trang khác
Thêm khi Owner gửi PSI + (sau Exit P0) lệnh Baseline/Analysis trang đó.

---

## 5. Checklist Agent khi «Thi công Phase 0» (sau duyệt Plan)

1. [ ] Xác nhận Plan này = **Đã duyệt** Owner.  
2. [ ] Khóa Catalog §2 (slug Production; checkout/stockComment = file path Task 3).  
3. [ ] Ghi §4.1 từ PSI Cộng đồng đã gửi — đủ dòng blocking JS+CSS (+ unused).  
4. [ ] Cập nhật cột TT PSI / Baseline `community` = ✅.  
5. [ ] Không sửa code · không Analysis Depth/Consumers/Policy.  
6. [ ] Báo Owner Acceptance §7 → chờ **Exit P0**.

---

## 6. Quy ước Owner

> Mỗi nội dung trang mới trong Catalog §2: Owner gửi PSI blocking JS/CSS đầy đủ trước Baseline/Analysis trang đó.

| | TT |
|--|-----|
| Quy ước SoT | ✅ v1.5+ |
| Plan Phase 0 | ⬜ chờ Owner duyệt Plan này |
| PSI neo Cộng đồng | ✅ đã gửi 2026-07-22 (input sẵn) |

---

## 7. Acceptance Phase 0 (sau Thi công — SoT §7)

- [ ] Catalog §2 đủ 24 trang  
- [ ] Quy ước PSI ghi + Owner xác nhận  
- [ ] Neo `community` có PSI Package blocking JS+CSS đủ trong §4  
- [ ] Không đổi Production trong P0  
- [ ] Owner duyệt Exit P0  

**Exit P0 PASS →** mới **Lập Plan Phase A** (§0.13) — không nhảy Analysis khi chưa có Plan A.

---

## 8. Rủi ro Plan

| ID | Mô tả | Xử lý |
|----|-------|--------|
| P0-NO-PLAN | Thi công trước duyệt Plan | **Đã xảy ra** → rollback về PLAN này; chờ duyệt |
| P0-PSI-PARTIAL | PSI cắt bớt | Từ chối khóa Baseline trang |
| P0-SCOPE-CREEP | Analysis / tách file trong P0 | Cấm — chỉ Phase A+ |
| P0-SLUG | URL lệch | Khóa theo routes; chỉnh Catalog nếu Owner phát hiện |

---

## 9. Lệnh Owner (review Plan này)

1. Đọc SoT **v1.6** §0.13 + Plan này (§0–§5 · §7).  
2. **«Duyệt Plan Phase 0»** (hoặc chỉnh Plan).  
3. **«Thi công Phase 0 Task 4»** → Agent khóa Catalog + §4 Evidence.  
4. **«Exit P0 PASS»** → **«Lập Plan Phase A»**.

---

## 10. Pre-flight Plan READY?

| Tiêu chí | Có? |
|----------|-----|
| Khớp SoT §7 Phase 0 | ✓ |
| Khớp SoT §0.13 (chỉ PLAN, chưa thi công) | ✓ |
| Catalog khung 24 trang | ✓ |
| PSI Package rule + input Cộng đồng ghi nhận | ✓ |
| Scope READ ONLY | ✓ |
| Không nhảy Analysis/Architecture | ✓ |
| Một file | ✓ |

**Kết luận:** Plan Phase 0 **READY for Owner review** — chưa Thi công · chưa Exit.

---

**Chữ ký lập Plan:** Agent · 2026-07-22  
**SoT:** v1.6 (§0.13) — chờ Owner duyệt SoT + Plan  
**PSI input:** Owner · `/cong-dong` · 2026-07-22 (chưa khóa Evidence)  
**Neo:** Không lặp Task 3 · không thi công vượt Plan.
