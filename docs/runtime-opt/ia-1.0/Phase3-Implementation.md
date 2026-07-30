# Task 6 — Phase 3 — Implementation (API & Store)

**Ngày:** 2026-07-24  
**SoT Governance:** PG-1.0 + **PG-008** + **PG-009 Implementation Slice**  
**Contracts:** [`Phase2-Runtime-Contract.md`](./Phase2-Runtime-Contract.md) — **PASS**  
**Phase 3 Implementation Exit:** **PASS** — Owner 2026-07-24  
**Phase 3 Plan:** **PASS (Governance + Direction)** — Owner 2026-07-24  

**Owner điều kiện mở Phase 3:**

> Phase 3 chỉ được triển khai theo các **RC-*** đã khóa. Nếu Impl phát hiện cần đổi Contract → truy SoT thiếu/sai chưa; sửa SoT trước → cập nhật Contract → mới tiếp tục Impl. **Tuyệt đối không** để Implementation tự sửa Contract hoặc tự sinh quy tắc mới.

---

## 1. Overview

### Task Objective

Chuẩn hóa Interaction Feature theo SoT → Contract → Implementation: một Feature · Catalog · nhiều Host · Summary ≠ Interactive · PS-1.0 · Runtime sẵn sàng.

### Task Roadmap

| Phase | Objective | Status |
| --- | --- | --- |
| Phase 0 | Audit Baseline · Quan sát | DONE |
| Phase 1 | SoT Architecture · Quyết định | PASS |
| Phase 2 | Runtime Contract · Chuẩn hóa | PASS |
| **Phase 3** | **Implementation · Hiện thực** | **PASS (Owner Exit)** |
| Phase 4 | Migration · Chuyển đổi | **Plan OPEN** — [`Phase4-Migration.md`](./Phase4-Migration.md) |
| Phase 5 | Loading & KPI · Tối ưu | **Chưa mở** — không viết Plan trước |
| Phase 6 | Exit · Xác nhận | **Chưa mở** — Exit Scorecard chỉ sau P4+P5 PASS |

### Current Phase

**Phase 3 — Implementation** theo **Implementation Slice** (PG-009).  
Không thiết kế chi tiết Phase 4 / 5 / 6 tại đây.

### Phase Contribution

```text
Task Complete
  ↑ … (Phase 4+ chỉ khi Owner mở)
  ↑ Phase 3 Impl RC-* DoD Exit   ← PASS
  ↑ Phase 2 Contract PASS
  ↑ Phase 1 SoT LOCKED
```

---

## 2. Objective

Triển khai code **đúng** Runtime Contract — không redesign.

> **Architecture + Contract đã khóa. Phase 3 chỉ Implementation theo RC-*. Mọi thay đổi luật → SoT trước, rồi Contract, rồi mới code.**

### Implementation Slice (PG-009)

Đơn vị nhỏ nhất trong Phase 3. Mỗi Slice có: **Scope · RC áp dụng · Deliverable · Definition of Done**.  
Phase 3 DoD Exit = các Slice bắt buộc PASS + Checklist §5.3 trên bề mặt đã ship — **không** = compile.

---

## 3. Scope

| # | Scope Impl | RC bắt buộc |
| --- | --- | --- |
| S1 | Persistence Adapter hooks cho Interaction | RC-PS-01…04 |
| S2 | `InteractionStore` + Summary projection refresh | RC-API-04 · RC-API-07 · RC-IA-04 |
| S3 | Summary API counts-only (backend + client) | RC-API-01 · RC-API-07 |
| S4 | Thread/mutation API paths | RC-API-02 · RC-API-03 |
| S5 | Resolver + Host + `mountInteraction` | RC-IO-01…08 |
| S6 | Permission.resolve wire | RC-IP-01…03 |
| S7 | Catalog stubs presentation-agnostic | RC-IU-01…05 |
| S8 | Loading Summary 0 Store init (Host summary path) | RC-IR-01…03 · RC-IA-01 |

**Không** trong Phase 3: full migrate LS (để Phase 4 khi mở) · KPI lock (để Phase 5 khi mở) · Exit Scorecard (Phase 6 khi mở).

---

## 3.1 Slices (theo dõi)

### Slice 1 — Foundation (skeleton)

| | |
| --- | --- |
| **Scope** | Adapter · API client · Store · Permission · Resolver · Host · Catalog · Summary/mutate backend |
| **RC** | RC-PS-* · RC-API-01/03/04/07 · RC-IP-* · RC-IO-01…08 · RC-IU-01…05 · RC-IA-01 |
| **Deliverable** | `User_Web/iflux-web-ui/interaction/*` + `backend/.../interaction.service.js` + routes |
| **DoD** | Module load được; checklist skeleton §8; **không** yêu cầu gắn Page |
| **Status** | **PASS (skeleton)** — 2026-07-24 |

### Slice 2 — Article Detail Host wire

| | |
| --- | --- |
| **Scope** | Gắn `IfluxInteractionHost` trên trang bài viết; Resolver chọn sidebar vs fallback `/binh-luan`; bỏ `matchMedia` trong page Component |
| **RC** | RC-IO-03/04/06/07/08 · RC-IA-01/02 · RC-IP-01…03 · RC-API-07 · RC-IU-01/02 · RC-IR-01…03 |
| **Deliverable** | `community-post-page.js` + widget load `interaction/boot.js` + Host multi-mount + Catalog action dùng `ifx-com-action` |
| **DoD** | Review RC dưới; Summary không init Interactive; không CommunityStore like/share authoritative trên surface bài |
| **Status** | **PASS** — 2026-07-24 (deploy Prod + Summary API smoke) |

#### Slice 2 — RC review

| RC | Kết quả |
| --- | --- |
| RC-IO-03/06 | `mountInteraction` chỉ từ Host trong `mountInteractionHosts` |
| RC-IO-04 | `resolvePresentation()` → Resolver; **không** `matchMedia` |
| RC-IA-01 | Summary mount không `initInteractive`; like Summary chỉ `runMutation` |
| RC-API-07 | Counter qua `refreshProjection` / event `iflux-ix-projection` |
| RC-IP-03 | `share_url` Guest Allow; like/favorite LoginRequired |
| RC-IU-01/02 | Catalog không nhánh presentation / không matchMedia |
| RC-IR-01…03 | Summary path không load thread |

### Slice 3 — Article Shell tabbar (mobile entry)

| | |
| --- | --- |
| **Scope** | Bottom bar like/share/comments trên bài → click IX Host / `share_url`; không `CommunityStore.bumpShare` |
| **RC** | RC-IO-06 (Shell không owner mount) · RC-IP-03 · RC-API-07 |
| **Deliverable** | `iflux-web-ui.js` `triggerArticleLike` / `triggerArticleShare` |
| **DoD** | Tabbar ủy quyền nút Host; không bump mem SoT |
| **Status** | **PASS** — 2026-07-24 |

### Slice 4+ 

Không mở trong Phase 3. `/binh-luan` dual stack · stock LS → **khi Owner mở Phase 4 Migration**.

---

## 4. Evidence

| Nguồn | Dùng |
| --- | --- |
| Phase2 RC-* PASS | Luật Impl |
| Prod smoke 2026-07-24 | `GET /api/community/interaction/summary` counts-only · `interaction/*.js` HTTP 200 |
| PG-008 / PG-009 | Contract + Slice |

---

## 5. Deliverables

### 5.1 Scope → Evidence → Deliverable

| Scope | Evidence | Deliverable |
| --- | --- | --- |
| S1–S4 | RC-API · RC-PS | Store + Summary API + mutation paths |
| S5 | RC-IO | Resolver + Host + mount |
| S6 | RC-IP | Permission gate |
| S7 | RC-IU | Catalog presentation-agnostic |
| S8 | RC-IR | Summary boot không hydrate/store |

### 5.2 Traceability Matrix (Deliverable → RC → SoT)

Code Review → RC → SoT — trace ngay.

| Deliverable | Module / neo (Impl) | RC | SoT |
| --- | --- | --- | --- |
| Persistence Adapter | `interaction/persistence-adapter.js` → `IfluxInteractionPersistence` | RC-PS-01…04 | PS-1.0 |
| InteractionStore | `interaction/interaction-store.js` → `IfluxInteractionStore` | RC-API-04 · RC-API-07 · RC-IA-04 | IA-003 · IA-001 |
| Summary API (client) | `interaction/interaction-api.js` (+ backend route) | RC-API-01 · RC-API-07 | IA-003 |
| Thread / mutation API | `interaction-api.js` + community comments routes | RC-API-02 · RC-API-03 | IA-003 |
| Presentation Resolver | `interaction/presentation-resolver.js` → `IfluxInteractionPresentationResolver` | RC-IO-01 · RC-IO-04 · RC-IO-05 | IO-001 |
| Interaction Host | `interaction/interaction-host.js` → `IfluxInteractionHost` | RC-IO-02 · RC-IO-03 · RC-IO-06…08 | IO-001 |
| `mountInteraction` | export **chỉ** từ Host | RC-IO-03 · RC-IO-06 | IO-001 |
| Permission Gate | `interaction/permission.js` → `IfluxInteractionPermission` | RC-IP-01…03 | IP-001 |
| Catalog (SummaryBar, ActionBar, List, Composer…) | `interaction/catalog/*.js` | RC-IU-01…05 | IU-001 |
| Summary Loading path | Host `mode:'summary'` + IR rules trong boot | RC-IR-01…05 · RC-IA-01 | IR-001 · IA-002 |
| Bottom-sheet / sidebar / page | **Host only** set presentation — Catalog agnostic | RC-IO-07 · RC-IU-01 | IO-001 · IU-001 §7.1 |

### 5.3 Impl invariant checklist (gate code review)

- [x] Không `CommunityStore.stats++` authoritative trên **Article Detail** (**RC-API-07**)  
- [x] Không `mountInteraction` từ Widget (**RC-IO-03 · RC-IO-06**)  
- [x] Không `matchMedia` / `if (presentation)` trong Catalog (**RC-IU-01 · RC-IU-02**)  
- [x] Summary mode 0 Interactive init trên Host summary (**RC-IA-01**)  
- [x] Summary payload không `comments:[]` — smoke Prod (**RC-API-01**)  
- [x] Guest `share_url` Allow; like/favorite LoginRequired (**RC-IP-03**)  
- [x] Adapter cấm key stock comments (**RC-PS-04**)  
- [ ] `/binh-luan` + stock comments dual — **ngoài Phase 3** (Phase 4 khi mở)  

---

## 5.4 Definition of Done (Phase 3)

> **Compile ≠ Done.**  
> Phase 3 hoàn thành khi Deliverable Interaction (§5.2) trên **surface đã ship (Article Detail + foundation)** review **PASS theo RC-*** và Checklist §5.3 (trừ mục defer Phase 4).

| Done khi | Không đủ để Done |
| --- | --- |
| Slice 1–3 PASS + Traceability | Chỉ có skeleton không gắn Page |
| Checklist §5.3 tick trên Article | “Tạm CommunityStore like” trên bài |
| Summary API counts-only Prod | Impl tự sửa Contract |
| PG-008 giữ | Hợp thức hóa AS-IS `/binh-luan` trong Phase 3 |

**Phase 3 Implementation Exit** = Owner/reviewer xác nhận DoD trên.  
**Phase 3 Plan PASS** ≠ Implementation Exit PASS (đã tách từ trước).

---

## 6. Gap

| Gap | Ghi chú |
| --- | --- |
| `/binh-luan` vẫn market+hydrate + dual stack | **Chưa mở Phase 4** — không làm trong Phase 3 |
| Stock comments LS | **Chưa mở Phase 4** |
| Bottom-sheet chrome (không chỉ fallback page) | Host presentation sẵn; UI sheet có thể Slice sau / Phase UI — không chặn DoD foundation |
| Chunk Summary tách bundle | Khi mở Phase 5 |

---

## 7. Out of Scope

- Sửa SoT / RC-* trong lúc code “cho tiện”  
- Thêm kind / đổi Guest matrix / đổi §7.1  
- **Viết Plan / Scorecard Phase 4 · 5 · 6** (PG-009)  
- Full LS migration / KPI lock / Exit Scorecard trong Phase 3  

---

## 8. Exit

| Tiêu chí | Status |
| --- | --- |
| Phase 3 Plan | **PASS** |
| Traceability · DoD · PG-009 | **Đạt** |
| Slice 1 Foundation | **PASS** |
| Slice 2 Article Host | **PASS** |
| Slice 3 Shell tabbar Article | **PASS** |
| Checklist §5.3 (Article + foundation) | **PASS** |
| Prod deploy + Summary API smoke | **PASS** 2026-07-24 |
| Phase 3 Implementation Exit | **PASS** — Owner 2026-07-24 |

Checklist deploy:

- [x] `interaction/*` trên Production  
- [x] `community-post-page.js` + widget boot IX  
- [x] Backend `interaction.service` + routes; pm2 restart  
- [x] Cloudflare purge  

---

## 9. Open Items

1. Owner hard refresh một bài trên https://iflux.vn — xác nhận UI Host (**đã verify browser 2026-07-24**: summary+interactive Host mount, Summary API, boot IX)  
2. Phase 4 Plan đã mở — chờ Owner PASS Plan rồi Slice (`Phase4-Migration.md`)  
3. Backlog sheet chrome (presentation `bottom-sheet` đầy đủ) — sau Phase 3 Exit ok  

---

## 10. Phase Verdict

**Phase 3 Implementation: PASS (DoD)** — Evidence cho Gate mở Phase 4:

| Mục | Evidence |
| --- | --- |
| Slice 1–3 | §3.1 Status PASS |
| Deliverable §5.2 | Module path + RC + SoT |
| Checklist §5.3 | Article + foundation tick (defer `/binh-luan`/stock) |
| Prod | §4 · §8 deploy + Summary API · browser Host mount |
| Owner formal PASS Exit | **PASS** — Owner 2026-07-24 |

**Phase 4 Plan:** [`Phase4-Migration.md`](./Phase4-Migration.md) — **chưa** Owner PASS Plan; Open Gate bắt buộc trước khi PASS Plan.
