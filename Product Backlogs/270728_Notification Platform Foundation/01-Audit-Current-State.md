# 01 — Audit · Hiện trạng Notification Platform (Implementation)

**Date:** 2026-07-28  
**Loại:** **Implementation audit** — đã **đủ**, không mở rộng grep/evidence/file list  
**Task:** Notification Platform Foundation  

> **Architecture audits (bước tiếp theo — trước SoT LOCK):**  
> [`02-Ownership-Audit.md`](02-Ownership-Audit.md) · [`03-Boundary-Audit.md`](03-Boundary-Audit.md) · [`04-Variable-Contract-Audit.md`](04-Variable-Contract-Audit.md) · [`05-Runtime-Flow-Audit.md`](05-Runtime-Flow-Audit.md) → [`06-Platform-SoT.md`](06-Platform-SoT.md)

**Mục đích:** Tái hiện ngữ cảnh implementation — đang có gì, chưa có gì.  
**Legacy template detail:** [`../270727/04-Template-SoT-Audit.md`](../270727_Affiliate%20Members%20Table%20%26%20Referral%20Welcome%20Notification/04-Template-SoT-Audit.md)

---

## 1. Executive summary

| Khía cạnh | Hiện trạng | Đánh giá |
|-----------|------------|----------|
| **Kiến trúc mục tiêu** | Chưa có Notification Platform (Type · Dispatcher · Rule · Template DB SoT) | ❌ Cần xây |
| **Admin UX mẫu thông báo** | ADM-SYS-003 — UX tốt, Owner muốn **giữ nguyên** | ✅ Giữ UI, đổi data layer |
| **Template SoT** | 3 hệ song song (catalog JS · localStorage · DB stub) | ❌ Vi phạm SoT đơn nguồn |
| **Notification Type registry** | Chỉ có `caseId` trong catalog JS — không phải entity độc lập | ❌ Thiếu |
| **Backend inbox** | `user_inbox_notifications` + API cursor — FN-001 partial | ⚠️ Có nền, chưa có Dispatcher |
| **Backend subscriber** | `fn-subscriber.js` hardcode title/body — không đọc template | ⚠️ Anti-pattern cần migrate |
| **User Web in-app** | Client-side render + localStorage cache + sync server | ⚠️ Hybrid legacy |
| **Admin save template** | `announcements-page.js` relative path → **404 Production** | ❌ Blocker P0 |
| **Preference per user** | Chưa có server field cho toggle domain (Affiliate…) | ❌ Thiếu |
| **Push / Email / Campaign** | Wave C stub DB + Admin pages — tách khỏi template case | ⚠️ Giữ stub; không nhét vào Platform v1 |

**Kết luận:** Hệ thống có **UX Admin thân thiện** và **inbox API cơ bản**, nhưng **không có platform foundation**. Mọi domain tự render/copy string — thêm notification mới = sửa nhiều chỗ, không có registry + dispatch thống nhất.

---

## 2. Sơ đồ hiện trạng (as-is)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                         ADMIN (3 luồng tách rời)                        │
├─────────────────────────────────────────────────────────────────────────┤
│ ADM-SYS-003  announcements.html                                         │
│   catalog.js (23 CASES) + templates-store.js → localStorage           │
│   announcements-page.js → bind UI (404 trên Production — relative)    │
│   + AdmWaveC.initTemplates() → bảng notif_templates API (stub khác)   │
├─────────────────────────────────────────────────────────────────────────┤
│ ADM-NOTIF-*  push / in-app / email / history                            │
│   notif_campaigns · notif_history (Wave C stub — chiến dịch broadcast)  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ (không nối)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         RUNTIME (phân mảnh)                             │
├─────────────────────────────────────────────────────────────────────────┤
│ A. Client-only path (Affiliate referral, orders demo…)                  │
│    loyalty-affiliate-store → inapp-notifications.pushReferralSignup     │
│    → system-notification-templates-store.render('USER_AFF_REFERRAL')      │
│    → localStorage override ?? catalog.defaultTitle                      │
│    → hardcode fallback 'Referral mới' nếu render fail                   │
├─────────────────────────────────────────────────────────────────────────┤
│ B. Server path (FN-001 partial — Follow/Community)                      │
│    Event bus → fn-subscriber.js → inbox.pushToUser                      │
│    title/body HARDCODE trong subscriber (không đọc template)            │
│    template_code = caseId legacy (USER_COMM_POST, USER_WL_TAGGED_POST…) │
├─────────────────────────────────────────────────────────────────────────┤
│ C. Legacy sync                                                            │
│    user_data.notifications_json (010) + client localStorage mirror      │
│    user_inbox_notifications (024) — server inbox FN-001                 │
└─────────────────────────────────────────────────────────────────────────┘
```

**Vấn đề cốt lõi:** Không có **Notification Type** entity, không có **Dispatcher**, không có **Template DB SoT** — mỗi luồng tự quyết title/body.

---

## 3. Inventory — Đang có gì

### 3.1 Admin UI

| Asset | Path | Vai trò | Ghi chú |
|-------|------|---------|---------|
| **ADM-SYS-003** | `Admin_Design_system/app/system/announcements.html` | Thiết lập mẫu thông báo | UX **giữ nguyên** |
| Page logic | `announcements-page.js` | Bind list case · expand · Lưu/Khôi phục | **404** — path relative trên pretty URL |
| Catalog | `iflux-admin-ui/system-notification-catalog.js` | 23 CASES + 36 MERGE_TAGS | Duplicate bản User Web |
| Template store | `iflux-admin-ui/system-notification-templates-store.js` | localStorage `iflux_sys_notif_templates_v1` | **Không phải SoT** |
| Wave C table | `admin-wave-c-pages.js` → `initTemplates()` | GET/PATCH `/admin/notifications/templates` | Stub 2 row — **không map** NOTIF-USER-* |
| Campaign pages | `app/notifications/{push,in-app,email,history}.html` | Chiến dịch broadcast | Wave C — **ngoài** template case v1 |
| Nav | `iflux-admin-nav-registry.js` | Menu Thông báo + Thiết lập mẫu | OK |

**Catalog CASES (23):** NOTIF-USER-001…015, NOTIF-SYS-001…007, NOTIF-ADM-001…002 — đủ nhóm Gói đăng ký · Membership · Cộng đồng · Cảnh báo · Hệ thống · Vận hành Admin · Theo dõi · Tương tác.

### 3.2 User Web

| Asset | Path | Vai trò |
|-------|------|---------|
| In-app store | `inapp-notifications.js` | Push local + sync server; TYPE_META hardcode |
| Template render | `system-notification-templates-store.js` | Client render từ catalog + localStorage |
| Catalog mirror | `system-notification-catalog.js` | Duplicate Admin |
| Bell UI | `iflux-user-notifications-ui.js` | App Shell owner (FN-001 Plan) |
| Affiliate hook | `loyalty-affiliate-store.js` | `pushReferralSignup(referrerId)` — 1 upline only |
| Data sync | `iflux-user-data-sync.js` | Mirror notifications_json |

**Loading (Task 4):** `inapp-notifications.js` + `iflux-user-notifications-ui.js` — Auth + Idle chain (`resource-loading-audit-community.md`).

### 3.3 Backend

| Asset | Path | Vai trò |
|-------|------|---------|
| Inbox service | `backend/src/modules/notifications/inbox.service.js` | summary · list cursor · pushToUser · dedupe |
| User API | `notifications.routes.js` | `GET /notifications`, mark read |
| FN subscriber | `fn-subscriber.js` | Bus → hardcoded title/body → inbox |
| Wave C admin | `ai-notif-admin.service.js` | CRUD `notif_templates`, campaigns, history |
| Routes | `ai-notif-admin.routes.js` | `/admin/notifications/*` |

### 3.4 Database (migrations)

| Migration | Bảng | Nội dung |
|-----------|------|----------|
| `010_notifications_messages.sql` | `user_data.notifications_json` | Legacy JSONB client mirror |
| `024_fn_follow_notifications.sql` | `user_inbox_notifications`, `user_follows` | Inbox FN-001 + dedupe index |
| `033_wave_c_ai_notif.sql` | `notif_templates`, `notif_campaigns`, `notif_history` | Wave C stub — **không** chứa NOTIF-USER-007 |

**Schema inbox hiện tại:**

```sql
user_inbox_notifications (
  id, user_id, template_code, title, body, icon, href, dedupe_key, read_at, created_at
)
```

→ Có `template_code` nhưng **không FK** tới type/template registry; title/body snapshot tại insert.

### 3.5 RBAC

| Permission cluster | Pages |
|--------------------|-------|
| `notifications.push` | view · create · edit · publish |
| `notifications.in_app` | view · create · edit · publish |
| `notifications.email` | view · create · edit · publish |
| `notifications.history` | view |
| `notifications.templates` | view · edit |

ADM-SYS-003 dùng perm `notifications.templates.*` qua Wave C stub — cần map lại khi Platform API mới.

---

## 4. Inventory — Chưa có gì

| Thành phần Platform | Trạng thái | Ghi chú |
|---------------------|------------|---------|
| **Notification Type** entity (DB + registry) | ❌ | Chỉ `caseId` trong catalog JS |
| **Notification Template** SoT server | ❌ | localStorage + catalog |
| **Notification Dispatcher** service | ❌ | Domain gọi trực tiếp inbox/render |
| **Rule Engine** (enabled · preference · channel) | ❌ | |
| **Notification Preference** server | ❌ | Toggle Affiliate chưa có field |
| **Template render server-side** | ❌ | Client `render()` hoặc hardcode subscriber |
| **Variable validation** | ❌ | Merge tags chỉ UI copy |
| **Version / audit Admin edit** | ❌ | |
| **Developer seed workflow** | ❌ | Không có migration Type + ON CONFLICT |
| **CI guard** Type phải có template | ❌ | |
| **Unified Admin API** cho ADM-SYS-003 | ❌ | 2 API/UI template song song |

---

## 5. Anti-patterns phát hiện (cần điều chỉnh)

Theo [`docs/SoT — Engineering Change Governance.md`](../../SoT%20—%20Engineering%20Change%20Governance.md):

| # | Anti-pattern | Rule vi phạm | Hướng xử lý Platform |
|---|--------------|--------------|----------------------|
| AP-1 | 3 nguồn template (catalog · localStorage · `notif_templates`) | CG-002 duplicate SoT | **Một** SoT DB; catalog → seed-only; retire localStorage runtime |
| AP-2 | `fn-subscriber` hardcode title/body | CG-011 workaround | Subscriber → `Dispatcher.dispatch(typeCode, vars)` |
| AP-3 | `pushReferralSignup` client render + hardcode fallback | CG-010 cosmetic / hardcode SoT | Backend dispatch @ signup; client nhận DTO đã render |
| AP-4 | 2 UI template Admin (ADM-SYS-003 + Wave C table) | CG-002 | Retire/merge bảng `adm-notif-tpl-tbody` |
| AP-5 | Duplicate catalog Admin + User Web | CG-002 | User Web **không** đọc catalog runtime; server DTO |
| AP-6 | `announcements-page.js` 404 | Blocker vận hành | Fix absolute path **trước** Phase B wire API |
| AP-7 | Business gọi `IfluxInAppNotifications.*` trực tiếp | FN-001 Plan § Event publish | Bus hoặc Dispatcher — domain emit type |

**Cấm (Engineering Change):**

- Tạo Platform mới rồi `display:none` catalog cũ mà không retire
- Thêm file helper chỉ để đổi label NOTIF-USER-007
- Thiết kế platform xoay quanh một Type (Affiliate-only migration)
- Admin「+ Thêm mẫu」không có Type/trigger

---

## 6. Mapping catalog CASES → Platform Type (draft)

Catalog hiện có **caseId** (`USER_AFF_REFERRAL`) ≠ **type code platform** (`AFFILIATE_REFERRAL_SUCCESS`). Migration seed cần map cả hai + `admin_code` (`NOTIF-USER-007`).

| Nhóm catalog | Số case | Platform category | Giai đoạn seed |
|--------------|---------|-------------------|----------------|
| Gói đăng ký · User | 5 | `orders` | Phase B seed |
| Membership · User | 2 | `affiliate` | Phase B seed |
| Cộng đồng · User | 2 | `community` | Phase B seed |
| Cảnh báo · User | 1 | `alert` | Phase B seed |
| Alert Hệ thống · Broadcast | 7 | `system` | Phase B seed |
| Theo dõi · User | 3 | `follow` | Phase B seed |
| Tương tác · User | 2 | `interaction` | Phase B seed |
| Vận hành · Admin | 2 | `admin_ops` | Phase B seed (channel khác) |

**FN-001 subscriber đã wired (hardcode):** `USER_COMM_POST`, `USER_WL_TAGGED_POST`, follow share, entity comment, comment liked/reply — cần migrate Phase D từng domain.

---

## 7. Luồng runtime chi tiết (evidence)

### 7.1 Affiliate referral (client path)

```text
loyalty-affiliate-store.applyReferralFromServer
  → IfluxInAppNotifications.pushReferralSignup(referrerId, data)
  → renderTpl('USER_AFF_REFERRAL', vars)
  → localStorage ?? catalog.defaultTitle
  → fallback hardcode 'Referral mới'
```

- Chỉ **1 referrer trực tiếp** — chưa F0/F1/F2
- Không check preference server
- Không qua backend inbox (client-only path)

### 7.2 Community post published (server path)

```text
Event bus → fn-subscriber.onPostPublished
  → inbox.pushToUser({ templateCode: 'USER_COMM_POST', title: 'Bài viết mới', body: hardcoded… })
```

- Template catalog **NOTIF-USER-008** không được đọc
- Admin sửa mẫu **không ảnh hưởng** notification thực tế

### 7.3 Inbox API (User Web consumer)

```text
GET /notifications/summary → unreadCount
GET /notifications?cursor&limit → items[]
POST /notifications/:id/read
```

- DTO: `{ id, templateCode, title, body, icon, href, read, createdAt }`
- Align FN-001 Plan — cursor+limit, không full dump ✅

---

## 8. Wave C stub — phạm vi và ranh giới

**Giữ nguyên giai đoạn Platform v1** — không merge vào Type registry:

| Bảng | Mục đích | Quan hệ Platform |
|------|----------|------------------|
| `notif_campaigns` | Chiến dịch push/in-app/email broadcast | Khác **event-driven template** |
| `notif_history` | Log phát sóng campaign | Audit campaign |
| `notif_templates` (Wave C) | 2 seed generic | **Retire** hoặc migrate schema → `notification_templates` Platform |

Admin pages `ADM-NOTIF-002…005` = vận hành campaign — **không** thay ADM-SYS-003.

---

## 9. Cần làm gì — tóm tắt theo Platform layers

| Layer | Hiện có | Cần làm |
|-------|---------|---------|
| **Type Registry** | catalog CASES (JS) | DB `notification_types` + seed migration |
| **Template System** | localStorage + catalog | DB `notification_templates` + Admin API |
| **Dispatcher** | — | Service `dispatch({ typeCode, recipientUserId, variables })` |
| **Rule Engine** | — | enabled · preference · channel · dedupe |
| **Preference** | — | DB + API per user (Owner H1) |
| **Delivery** | inbox.pushToUser | Wrap trong Dispatcher; log optional |
| **Admin UX** | announcements.html | Wire API; fix JS 404; retire Wave C duplicate table |
| **User Web** | bell + inbox API | Nhận DTO server; retire client template render |
| **Domain integration** | fn-subscriber hardcode; affiliate client | Phase D — emit type |

---

## 10. Blockers & prerequisites

| # | Blocker | Phase | Effort |
|---|---------|-------|--------|
| B1 | `announcements-page.js` 404 Production | Pre-B | S — absolute path |
| B2 | Không có schema `notification_types` / `notification_templates` | B | M — migration |
| B3 | fn-subscriber + inapp-notifications bypass template SoT | D | L — migrate từng domain |
| B4 | Duplicate 3 template systems | B | M — retire plan |
| B5 | Owner chưa LOCK Platform SoT (`06-Platform-SoT.md`) + audits 02–05 | A | S — review |

---

## 11. Checklist audit PASS (trước khi đóng Platform v1)

### Phase B — Template System

- [ ] Admin Lưu mẫu → reload **mọi browser** → title giữ (DB SoT)
- [ ] Catalog default đổi **không** ghi đè row Admin đã lưu
- [ ] Không còn runtime đọc `iflux_sys_notif_templates_v1`
- [ ] Bảng Wave C duplicate **retired** trên announcements page
- [ ] 23 catalog CASES seeded vào `notification_types` + templates

### Phase C — Type Registry

- [ ] Developer thêm type mới → seed → Admin thấy case mới **không deploy frontend**
- [ ] CI/guard: type without template = fail

### Phase D — Consumer Integration (mẫu Affiliate)

- [ ] `AFFILIATE_REFERRAL_SUCCESS` emit @ signup backend
- [ ] Không hardcode `'Referral mới'` production path
- [ ] Preference server gate trước dispatch
- [ ] fn-subscriber ít nhất 1 case migrated qua Dispatcher (proof pattern)

---

## 12. Files reference (audit inventory)

### Admin

- `Admin_Design_system/app/system/announcements.html`
- `Admin_Design_system/app/system/announcements-page.js`
- `Admin_Design_system/iflux-admin-ui/system-notification-catalog.js`
- `Admin_Design_system/iflux-admin-ui/system-notification-templates-store.js`
- `Admin_Design_system/iflux-admin-ui/admin-wave-c-pages.js`
- `Admin_Design_system/app/notifications/*.html`

### User Web

- `User_Web/iflux-web-ui/inapp-notifications.js`
- `User_Web/iflux-web-ui/system-notification-catalog.js`
- `User_Web/iflux-web-ui/system-notification-templates-store.js`
- `User_Web/iflux-web-ui/iflux-user-notifications-ui.js`
- `User_Web/iflux-web-ui/loyalty-affiliate-store.js`

### Backend

- `backend/src/modules/notifications/inbox.service.js`
- `backend/src/modules/notifications/fn-subscriber.js`
- `backend/src/modules/notifications/notifications.routes.js`
- `backend/src/modules/ai/ai-notif-admin.service.js`
- `backend/migrations/010_*.sql`, `024_*.sql`, `033_*.sql`

---

*Audit v1 — Notification Platform Foundation — 2026-07-28.*
