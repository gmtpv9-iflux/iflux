# Wave R — Runtime Architecture Proposal (Web-first)

**Trạng thái:** 📋 **PROPOSAL** · chờ Owner + Reviewer duyệt  
**Ngày:** 2026-07-22  
**Phạm vi:** Phân tích + đề xuất · **KHÔNG code · KHÔNG refactor · KHÔNG thêm SoT/Registry**  
**Neo Plan:** `docs/widget-publish/Plan-Template-Runtime-Publish.md` §6 Wave R · §6.5 Step 2  
**SoT:** `SoT — Widget Definition.md`

---

## 1. Audit Runtime hiện tại (Web)

### 1.1 Thành phần đang đóng vai trò Web Runtime

| Thành phần | File | Trách nhiệm |
|------------|------|-------------|
| Entry | `User_Web/iflux-web-ui/runtime/bootstrap.js` | `pageKey` → Shell → Manifest → `bootPage` / shell-only |
| App Shell | `shell-boot.js` · `app-shell.js` | Auth, Entitlements, chrome, sections |
| Page mount | `page-runtime.js` | Published path **hoặc** static widget slots |
| Layout từ Artifact | `page-layout-engine.js` | `GET /api/pages/:key` → Host Tree |
| Mount Artifact | `mount-published-widgets.js` | `import(display.module)` → `mount(host, ctx)` |
| Static / composite | `widget-loader.js` | `import(slot.lazyModule)` (manifest, không Artifact) |
| Feature | `feature-runtime.js` + `widgets/*-page` | Feature boot; một số tự gọi Layout Engine |
| Bridge script | `legacy-bridge.js` | Nạp classic script/CSS theo yêu cầu module |

### 1.2 Chuỗi HTML → Render (Web hôm nay)

```text
HTML tĩnh + [data-ifx-page-runtime] + bootstrap.js
    → bootShell
    → resolveManifest (static ± PagePublished)
    → bootPage
         ├─ published: Layout Engine → mountPublishedWidgets(display.module)
         └─ composite: widget-loader(lazyModule) → Feature → (có thể) mountPublishedWidgets
```

### 1.3 Đâu là Runtime vs Publish (ranh giới)

| | Resolve Template? | Sở hữu `display.module` |
|--|-------------------|-------------------------|
| **Publish** (Admin bridge + backend `resolvers.js`) | **Có** (map / legacy / lazyModule debt) | **Ghi** vào WidgetPublished |
| **User Web Runtime** | **Không** (grep User_Web: không `resolveTemplate`) | **Chỉ đọc** Artifact |

Publish maps (`template-runtime-map.js`, `legacy-runtime-map.js`) ghi chú: *chỉ Publish/Seed — không dùng User Web Runtime*.

### 1.4 Phần chỉ dành Web hôm nay

- ESM dưới `/User_Web/iflux-web-ui/widgets/*/index.js`
- URL `display.module` tuyệt đối site path
- `import()` trình duyệt + `mount(el, ctx)`

### 1.5 Phần đang trộn / dual-path (gap, không invent SoT)

1. Composite page vẫn hardcode `lazyModule` (cộng đồng, flow…).  
2. Home: sidebar PagePublished; Main/PRF còn static / catalog.  
3. Publish còn chấp nhận `lazyModule` debt khi Template map thiếu.  
4. `dependencies` kiểu script trên Artifact **không** được `mount-published-widgets` nạp — module tự `loadScriptTiers`.

---

## 2. Runtime Boundary (đề xuất giữ)

```text
Authoring (4 SoT) → Publish(runtime) → Widget Published (Runtime) → Runtime đọc Artifact → Renderer
```

| Bên trong Runtime (Web) | Ngoài Runtime |
|-------------------------|---------------|
| Bootstrap, Shell, Layout Engine, mount `display.module`, Entitlement host hooks | Template catalog, Template→Implementation resolve, Placement Authoring, Permission SoT Admin |
| Feature page boot (envelope) | Business Logic / Data Provider (Core) |

**Owner Runtime Web:** đội User Web / Runtime Engine (tiêu thụ Artifact).  
**Không Owner:** đường dẫn module (Developer đăng ký qua Build → Publish đóng vào Artifact).

---

## 3. Runtime Responsibility

Runtime Web **chỉ**:

1. Đọc **Widget Published (Web)** / PagePublished (embed widgets).  
2. Tạo Host theo Placement.  
3. Kiểm Permission trên host (engine đã có).  
4. `import(display.module)` + load stylesheet deps đã đóng trong Artifact.  
5. Gọi `mount` / `unmount`.

Runtime Web **không**:

- Resolve Template / Implementation  
- Đọc Admin SoT trực tiếp  
- Sửa Artifact  
- Invent module khi thiếu  

---

## 4. Runtime Contract tối thiểu (Web)

Một Runtime Web cần từ Artifact để render Widget:

| Field | Bắt buộc? | Ghi chú |
|-------|-----------|---------|
| `id` | Có | Host key |
| `display.module` | **Có** | URL ESM `import()` |
| `dependencies[]` (stylesheet) | Nên | Mount helper chỉ load CSS hôm nay |
| Placement `config` / `span` / `section` | Nên | Host + ctx |
| `permission.blocks` | Nên | Gate host |
| `content` / metadata | Tuỳ module | Module đọc qua `ctx.artifact` |

**Module contract:** `export async function mount(el, ctx)` · optional `unmount` · optional `meta`.

Không mô tả Flutter/Mobile — chỉ contract Web hiện tại.

---

## 5. Share Runtime

**Kết luận:** Share **không** phải Runtime độc lập hôm nay.

- Cùng Web bootstrap + `SHELL_ONLY`  
- `share-feature-boot.js` → attribution → redirect `/nha-cua-toi`  
- Không mount WidgetPublished / không snapshot Artifact renderer  

**Định hướng Plan:** Share có thể trở thành Runtime riêng sau (Artifact Share) — **chưa** bắt buộc trong Web-first; khi mở = thêm Implementation trên Template + Publish(runtime=share), không sửa Shell Web core nếu contract giữ nguyên.

---

## 6. Multi-runtime strategy (chỉ mô tả mở rộng)

| | |
|--|--|
| **Giữ nguyên** | 4 SoT · Runtime chỉ đọc Artifact · Template 1 ID · Artifact shape **A** (mỗi Runtime một Artifact) |
| **Mở rộng** | Template + Runtime Implementation (Developer) · Publish(`runtime`) · `resolveRuntimeImplementation` |
| **Bổ sung khi cần** | Runtime id ổn định (enum hoặc Registry — xem §8) · UI tab Preview theo Runtime |
| **Không cần sửa** | User Web mount helper nếu Artifact Web vẫn có `display.module` |

---

## 7. Quan hệ SoT (giữ nguyên 4 SoT)

```text
Permission · Placement · Template · Widget Definition
        │
        ▼
Publish(runtime)  →  resolveRuntimeImplementation
        │
        ▼
Widget Published (Web | Mobile | …)   // shape A
        │
        ▼
Runtime tương ứng chỉ đọc Artifact đó
```

Không SoT thứ 5.

---

## 8. Có đề xuất Runtime Registry không?

**Khuyến nghị Wave này: CHƯA invent Registry.**

| Câu hỏi bắt buộc (Reviewer) | Trả lời |
|-----------------------------|---------|
| 1. Owner là ai? | Nếu có: Product/Platform Runtime catalog — **chưa chứng minh cần tách entity** |
| 2. Trùng SoT nào? | Có nguy cơ trùng “Supported Runtime” trên Template |
| 3. Sinh tự động được không? | Enum tối thiểu `WEB` trong SoT/Plan đủ cho Web-first |
| 4. Business Requirement? | Đa Runtime = BR; **Registry riêng** = tối ưu vận hành khi ≥3 Runtime active |
| 5. Bỏ đi hệ thống còn chạy? | **Có** — Web Publish hiện tại chạy không cần Registry |

→ **Wave 2.5 Registry = HOÃN** đến khi có ≥2 Runtime Publish thật hoặc Reviewer chứng minh thêm.  
Wave gần: hardcode/`runtime: 'web'` có kiểm soát trong Publish API.

---

## 9. Risk

| Risk | Mức | Ghi chú |
|------|-----|---------|
| Dual path lazyModule vs Artifact | Trung | Wave 1–3 dần thu về Artifact |
| Cắt legacy sớm | Cao | Plan cấm đến Wave 4 |
| Invent Registry sớm | Trung | Tránh — §8 |
| Share hiểu nhầm là Runtime đủ | Thấp | Document rõ redirect |
| Script deps không trong mount helper | Trung | Module tự load — chấp nhận tạm |

---

## 10. Recommendation (ký Reviewer)

1. **Giữ** ranh giới: Template/Implementation resolve = Publish; Web Runtime = Artifact consumer.  
2. **Chốt** Artifact A + `resolveRuntimeImplementation(template, runtime)`.  
3. **Không** thêm Registry / SoT mới trong Wave R–2.  
4. **Thu hẹp** dual-path (lazyModule composite) theo Roadmap sau khi gap Implementation Web đóng.  
5. **Share:** giữ Web envelope; mở Runtime Share sau khi có Artifact Share — không block Web-first.  
6. **Hợp Plan §6.5:** sau duyệt Proposal → Wave 0/1 (Inventory + gap); UI/SoT Wave 2; Publish Wave 3.

---

## 11. Deliverable checklist (Wave R)

- [x] Audit Runtime hiện tại  
- [x] Runtime Boundary  
- [x] Runtime Responsibility  
- [x] Runtime Contract (Web tối thiểu)  
- [x] Multi-runtime Strategy  
- [x] Share Runtime đánh giá  
- [x] Relationship 4 SoT  
- [x] 5 câu Owner cho Registry → **không invent**  
- [x] Risk · Recommendation  

**Exit Wave R:** chờ Owner + Reviewer duyệt Proposal này.

---

**Chữ ký:** Agent · 2026-07-22 · Wave R READ ONLY  
**Evidence code:** bootstrap · page-runtime · mount-published-widgets · resolvers.js · share-feature-boot
