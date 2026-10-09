/**
 * WGT-HOME-PAGE — Trang Cá nhân (/ca-nhan, pageKey 'home')
 * Merge Trang chủ cũ (Dashboard tùy chỉnh) + Tài khoản cũ (/tai-khoan) — xem
 * docs/SoT — Trang chủ = Cộng đồng, Cá nhân = Trang chủ cũ + Tài khoản cũ (Migration V1).md
 *
 * Bố cục 3 cột (buildPageFrame rightSidebar:true):
 *  - Sidebar trái (3/12): card Hồ sơ (profile-bind.js, y nguyên profile.html, rút gọn — owner
 *    yêu cầu 2026-10-03: nhãn → icon, bỏ Vai trò/Quốc gia/Tham gia) + Widget Host trung lập
 *    ([data-ifx-hub-sidebar-canvas] — dashboard-engine.js renderSidebarStack): chỉ vẽ đúng
 *    những gì layout đã lưu, không tự thêm widget nào mặc định — owner chốt 2026-10: Watchlist
 *    đã có ở Tùy chỉnh/Dashboard, Sidebar không cần giữ bản riêng nào nữa.
 *  - Main (7/12): 5 tab — Dashboard | Affiliate | Liên kết thẻ | Riêng tư | Mật khẩu. 4 tab sau
 *    migrate VERBATIM từ User_Web/account/profile.html (giữ nguyên id/data-attribute), chạy qua
 *    CHÍNH runtime/account-feature-boot.js (đã tổng quát hoá cho context composite) — không viết
 *    lại logic nghiệp vụ Affiliate/Thanh toán/Riêng tư/Bảo mật.
 *  - Sidebar phải (2/12): card Gói cước & ưu đãi (tách khỏi card Hồ sơ) + Hoạt động gần đây +
 *    Widget host Admin publishKey 'dashboard' section 'sidebar-right' (chỗ cho Template
 *    "Promotion" — Phase 3, hiện trống tới khi Admin đặt widget).
 *
 * Trang luôn yêu cầu đăng nhập (AUTH_PAGES.home — runtime/page-keys.js) — không còn phiên bản
 * vãng lai riêng (trước đây mountGuest()).
 */
import { buildPageFrame, applyHubLayout } from '../../runtime/app-shell.js?v=7b8f128322';
import { mountPageWidgets } from '../../runtime/page-widgets.js?v=f23703a85b';
import { ensureSequence } from '../../runtime/legacy-bridge.js?v=dec30759da';

var ASSET = '/User_Web/iflux-web-ui/';
export const meta = { id: 'WGT-HOME-PAGE', title: 'Cá nhân' };

/* Deps Watchlist + dashboard-engine — cùng khai báo với widgets/home-dashboard/index.js
   (ensureSequence bỏ qua script đã có global, không tải đôi khi user mở tab Dashboard). */
var SIDEBAR_DEPS = [
  { global: 'IfluxWidgetRegistry', src: ASSET + 'widget-registry.js?v=90088910d4' },
  { global: 'IfluxDashboardEngine', src: ASSET + 'dashboard-engine.js?v=f338081af6' },
  { global: 'IfluxWatchlistStore', src: ASSET + 'watchlist-store.js?v=f604e76323' },
  { global: 'IfluxWatchlistTaxonomy', src: ASSET + 'watchlist-taxonomy.js?v=ce814925e7' },
  { global: 'IfluxHeartAction', src: '/design_system/04_components/29_follow/follow.js?v=r20261002a' },
  { global: 'IfluxWatchlistUI', src: ASSET + 'watchlist-ui.js?v=7c1f5a3c0d' },
  { global: 'IfluxWatchlistBlock', src: ASSET + 'watchlist-block.js?v=02655cb8cf' }
];

/* Card Hồ sơ — y nguyên profile.html (.ix-profile-sidebar), bind bởi profile-bind.js
   (IfluxProfileSidebar) qua account-feature-boot.js, không viết lại. Ở Sidebar TRÁI, trên
   Watchlist (owner yêu cầu 2026-10-03) — scope [data-ifx-profile-sidebar] độc lập vị trí DOM,
   chỉ cần tồn tại ĐÚNG 1 lần trong trang (profile-bind.js dùng querySelector, không phải All). */
var PROFILE_CARD_HTML = `
<div class="ix-profile-sidebar" data-ifx-profile-sidebar>
  <div class="ix-card ix-mb-24">
    <div class="ix-profile-hero" data-ifx-profile-hero>
      <div class="ifx-profile-avatar-wrap">
        <div class="ix-profile-avatar" id="ifx-profile-avatar" data-bind="avatar">…</div>
        <button type="button" class="ifx-profile-avatar-edit" id="btn-change-avatar" data-ifx-own-only title="Đổi ảnh đại diện" aria-label="Đổi ảnh đại diện"><i class="ti ti-camera"></i></button>
        <input type="file" id="ifx-avatar-input" accept="image/jpeg,image/png,image/webp,image/gif" hidden data-ifx-own-only />
      </div>

      <div class="ifx-profile-name-row">
        <div class="ix-profile-name"><span data-bind="display_name">—</span></div>
        <span class="ix-chip ix-chip-primary ifx-profile-tier-chip" data-ifx-tier-inline><span data-bind="tier_label">—</span></span>
      </div>

      <div class="ifx-profile-public-actions" data-ifx-public-only hidden>
        <button type="button" class="ix-btn ix-btn-primary ix-btn-sm" id="btn-follow-user">Theo dõi</button>
        <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="btn-friend-user"><i class="ti ti-user-plus" style="font-size:14px"></i> Kết bạn</button>
        <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" id="btn-message-user"><i class="ti ti-message" style="font-size:14px"></i> Nhắn tin</button>
        <button type="button" class="ix-btn ix-btn-outline ix-btn-sm ifx-btn-block" id="btn-block-user"><i class="ti ti-ban" style="font-size:14px"></i> Chặn</button>
      </div>

      <div class="ix-profile-stats" data-ifx-privacy="stats">
        <div class="ix-profile-stat">
          <div class="ix-profile-stat-value"><span data-bind="posts">—</span></div>
          <div class="ix-profile-stat-label">Bài viết</div>
        </div>
        <div class="ix-profile-stat">
          <div class="ix-profile-stat-value"><span data-bind="followers">—</span></div>
          <div class="ix-profile-stat-label">Người theo dõi</div>
        </div>
        <div class="ix-profile-stat">
          <div class="ix-profile-stat-value"><span data-bind="following">—</span></div>
          <div class="ix-profile-stat-label">Đang theo dõi</div>
        </div>
      </div>
    </div>

    <div style="padding:0 20px 20px">
      <div data-ifx-side-view>
        <ul class="ix-detail-list">
          <li data-ifx-privacy="username"><span class="ix-detail-label ifx-label-icon" title="Tên đăng nhập"><i class="ti ti-at"></i></span><span class="ix-detail-val">@<span data-bind="username">—</span></span></li>
          <li data-ifx-own-only><span class="ix-detail-label ifx-label-icon" title="Email"><i class="ti ti-mail"></i></span><span class="ix-detail-val"><span data-bind="email">—</span></span></li>
          <li data-ifx-privacy="status"><span class="ix-detail-label ifx-label-icon" title="Trạng thái"><i class="ti ti-activity"></i></span><span class="ix-chip ix-chip-success" style="font-size:11px" data-bind="status_label">—</span></li>
          <li data-ifx-own-only><span class="ix-detail-label ifx-label-icon" title="Số điện thoại"><i class="ti ti-phone"></i></span><span class="ix-detail-val"><span data-bind="phone">—</span></span></li>
          <li data-ifx-privacy="bio"><span class="ix-detail-label ifx-label-icon" title="Giới thiệu"><i class="ti ti-info-circle"></i></span><span class="ix-detail-val" style="font-size:13px;line-height:1.5"><span data-bind="bio">—</span></span></li>
        </ul>
        <div style="display:flex;gap:10px;margin-top:16px" data-ifx-own-only>
          <button type="button" class="ix-btn ix-btn-primary" style="flex:1" data-ifx-side-edit-open>
            <i class="ti ti-edit" style="font-size:13px"></i> Chỉnh sửa hồ sơ
          </button>
        </div>
      </div>

      <div data-ifx-side-edit hidden data-ifx-own-only>
        <div style="font-size:14px;font-weight:600;color:var(--ix-text-primary);margin-bottom:12px">Chỉnh sửa hồ sơ</div>
        <div class="ix-form-group"><label class="ix-label">Họ tên</label><input type="text" class="ix-input" data-bind-input="display_name" /></div>
        <div class="ix-form-group"><label class="ix-label">Tên đăng nhập</label><input type="text" class="ix-input" data-bind-input="username" /></div>
        <div class="ix-form-group"><label class="ix-label">Email</label><input type="email" class="ix-input" data-bind-input="email" /></div>
        <div class="ix-form-group"><label class="ix-label">Số điện thoại</label><input type="text" class="ix-input" data-bind-input="phone" /></div>
        <div class="ix-form-group"><label class="ix-label">Giới thiệu</label><textarea class="ix-input" rows="3" data-bind-input="bio" style="resize:vertical"></textarea></div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <button type="button" class="ix-btn ix-btn-primary" style="flex:1" id="btn-save-profile"><i class="ti ti-device-floppy" style="font-size:14px"></i> Lưu</button>
          <button type="button" class="ix-btn ix-btn-ghost" data-ifx-side-edit-cancel><i class="ti ti-x" style="font-size:13px"></i> Hủy</button>
        </div>
      </div>
    </div>
  </div>
</div>`;

/* Canvas dưới card Hồ sơ là Widget Host trung lập ([data-ifx-hub-sidebar-canvas] —
   dashboard-engine.js renderSidebarStack): chỉ vẽ đúng layout đã lưu, không tự thêm widget nào
   mặc định (Watchlist đã bỏ khỏi SIDEBAR_DEFAULT — owner chốt 2026-10, xem widget-registry.js). */
var SIDEBAR_LEFT_HTML =
  PROFILE_CARD_HTML +
  '<div class="ifx-hub-sidebar-canvas" data-ifx-hub-sidebar-canvas></div>';

/* Gói cước & ưu đãi — tách riêng khỏi card Hồ sơ (card Hồ sơ đã dời sang Sidebar trái), ở lại
   Sidebar phải. Binding qua profile-bind.js dùng querySelectorAll toàn trang cho khối này
   ([data-ifx-plan-promo]/.ix-plan-card), không phụ thuộc vị trí DOM — tách ra an toàn. */
var PLAN_PROMO_HTML = `
<div class="ix-card ix-plan-card ix-mb-24" data-ifx-own-only data-ifx-plan-promo>
  <div class="ix-card-body">
    <div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:8px;margin-bottom:16px">
      <span class="ix-chip ix-chip-primary"><span data-bind="plan_name">—</span></span>
      <div class="ix-plan-price" data-bind="plan_price"><span class="ix-plan-price-cur">₫</span><span class="ix-plan-price-num">—</span><span class="ix-plan-price-per">/tháng</span></div>
    </div>
    <div data-ifx-plan-features></div>
    <div style="margin:16px 0 8px">
      <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--ix-text-muted);margin-bottom:6px">
        <span>Chu kỳ thanh toán</span><span style="color:var(--ix-text-primary);font-weight:600"><span data-bind="plan_days">—</span></span>
      </div>
      <div style="height:6px;background:rgba(105,108,255,.2);border-radius:3px;overflow:hidden">
        <div data-bind="plan_progress" style="width:0%;height:100%;background:var(--ix-accent);border-radius:3px"></div>
      </div>
    </div>
    <a href="/goi-cuoc" class="ix-btn ix-btn-primary" data-ifx-plan-upgrade style="width:100%;margin-top:8px;display:flex;align-items:center;justify-content:center;gap:6px">
      <i class="ti ti-arrow-up-circle" style="font-size:13px"></i> Nâng cấp Premium
    </a>
  </div>
</div>`;

/* Hoạt động gần đây — chỉ tiêu đề + thời gian tương đối (bỏ avatar, xếp dọc — owner yêu cầu
   2026-10-03). Nội dung thật do profile-activity-page.js render vào [data-ifx-hub-activity]. */
var ACTIVITY_HTML = '<div class="ix-card"><div class="ix-card-header"><div class="ix-card-title">Hoạt động gần đây</div></div>' +
  '<div class="ix-card-body" style="padding-top:0"><div id="ifx-profile-activity" data-ifx-hub-activity></div></div></div>';

var TAB_DASHBOARD_HTML = '<div id="tab-dashboard" class="ix-tab-content" data-ix-profile-panel="tab-dashboard" data-ifx-own-only></div>';

/* ── TAB: AFFILIATE — y nguyên profile.html #tab-affiliate ── */
var TAB_AFFILIATE_HTML = `
<div id="tab-affiliate" class="ix-tab-content" data-ix-profile-panel="tab-affiliate" data-ifx-own-only data-ifx-aff-root data-ifx-aff-state="loading">

  <div class="ix-card ix-mb-24 ifx-aff-ref-bar">
    <div class="ix-card-body">
      <div class="ifx-aff-ref-head">
        <div class="ifx-aff-ref-title">
          <div class="ix-stat-icon accent" style="width:32px;height:32px;font-size:14px"><i class="ti ti-share"></i></div>
          <div>
            <div style="font-size:14px;font-weight:600;color:var(--ix-text-primary)">Liên kết & mã giới thiệu</div>
            <div style="font-size:12px;color:var(--ix-text-muted);margin-top:2px">Chia sẻ để nhận hoa hồng affiliate</div>
          </div>
        </div>
        <div class="ifx-aff-ref-layers">
          <span class="ix-layer-pill"><span class="ix-layer-f0">F0</span> <strong data-ifx-aff-rate="f0">—%</strong></span>
          <span class="ix-layer-pill"><span class="ix-layer-f1">F1</span> <strong data-ifx-aff-rate="f1">—%</strong></span>
          <span class="ix-layer-pill"><span class="ix-layer-f2">F2</span> <strong data-ifx-aff-rate="f2">—%</strong></span>
        </div>
      </div>
      <div class="ifx-aff-ref-fields">
        <div class="ifx-aff-ref-field">
          <label class="ix-label">Liên kết giới thiệu</label>
          <div class="ix-ref-row" style="margin-top:0">
            <input class="ix-ref-input" readonly value="" id="ref-link" />
            <button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ix-copy-ref="ref-link">
              <i class="ti ti-copy" style="font-size:13px"></i> Sao chép
            </button>
          </div>
        </div>
        <div class="ifx-aff-ref-field ifx-aff-ref-field--code">
          <label class="ix-label">Mã giới thiệu</label>
          <div class="ix-ref-row" style="margin-top:0">
            <input class="ix-ref-input" readonly value="" id="ref-code" style="font-size:15px;font-weight:700;letter-spacing:2px;text-align:center" />
            <button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ix-copy-ref="ref-code">
              <i class="ti ti-copy" style="font-size:13px"></i> Sao chép
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="ix-card ix-mb-24 ifx-aff-loading" data-ifx-aff-loading>
    <div class="ix-card-body ifx-aff-loading__body">Đang tải dữ liệu affiliate…</div>
  </div>

  <div class="ifx-aff-data-pane" data-ifx-aff-data-pane hidden>

  <div class="ix-card ix-mb-24" style="padding:0">
    <div class="ix-aff-summary">
      <div class="ix-aff-sum-item">
        <div class="ix-aff-sum-val ix-aff-sum-accent" data-ifx-aff-sum="total">—</div>
        <div class="ix-aff-sum-label">Tổng thu nhập (tất cả)</div>
      </div>
      <div class="ix-aff-sum-item">
        <div class="ix-aff-sum-val ix-aff-sum-unpaid" data-ifx-aff-sum="unpaid">—</div>
        <div class="ix-aff-sum-label">Chờ thanh toán</div>
      </div>
      <div class="ix-aff-sum-item">
        <div class="ix-aff-sum-val" data-ifx-aff-sum="signups">—</div>
        <div class="ix-aff-sum-label">Tổng giới thiệu (F0+F1+F2)</div>
      </div>
      <div class="ix-aff-sum-item">
        <div class="ix-aff-sum-val ix-aff-sum-conv" data-ifx-aff-sum="conv">—</div>
        <div class="ix-aff-sum-label">Tỷ lệ chuyển đổi</div>
      </div>
    </div>

    <div class="ix-layer-info">
      <span style="font-size:12px;color:var(--ix-text-muted);font-weight:500">Tỷ lệ hoa hồng:</span>
      <div class="ix-layer-pill"><span class="ix-layer-f0">F0</span> <strong data-ifx-aff-rate="f0">—%</strong> — bạn giới thiệu trực tiếp</div>
      <div class="ix-layer-pill"><span class="ix-layer-f1">F1</span> <strong data-ifx-aff-rate="f1">—%</strong> — F0 của bạn giới thiệu</div>
      <div class="ix-layer-pill"><span class="ix-layer-f2">F2</span> <strong data-ifx-aff-rate="f2">—%</strong> — F1 của bạn giới thiệu</div>
    </div>

    <div class="ifx-aff-payout-bar">
      <div class="ifx-aff-payout-bar__balance">
        Số dư khả dụng: <strong data-ifx-aff-balance>—</strong>
        <span class="ifx-aff-payout-bar__min">(min. rút <span data-ifx-aff-min-payout>—</span>)</span>
      </div>
      <button type="button" class="ix-btn ix-btn-success ix-btn-sm" data-ifx-aff-payout disabled aria-disabled="true">
        <i class="ti ti-cash" style="font-size:13px"></i> Rút hoa hồng
      </button>
    </div>
  </div>

  <div class="ix-card ix-mb-24">
    <div class="ix-card-header"><div class="ix-card-title">Tổng quan mạng giới thiệu</div></div>
    <div class="ix-card-body">
      <div id="ifx-aff-network-grid" class="ifx-aff-network-grid"></div>
    </div>
  </div>

  <div class="ix-card ix-mb-24">
    <div class="ix-table-toolbar">
      <div>
        <div style="font-size:14px;font-weight:600;color:var(--ix-text-primary)">Danh sách thành viên</div>
        <div style="font-size:12px;color:var(--ix-text-muted);margin-top:2px">Thành viên trong hệ thống giới thiệu F0 · F1 · F2 của bạn</div>
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select class="ix-input" id="aff-members-layer" style="width:auto;min-width:140px;padding:6px 10px;font-size:13px">
          <option value="">Tất cả lớp</option>
          <option value="F0">F0 — Trực tiếp</option>
          <option value="F1">F1 — Cấp 2</option>
          <option value="F2">F2 — Cấp 3</option>
        </select>
        <div class="ix-table-search" style="margin:0"><i class="ti ti-search"></i><input type="search" placeholder="Tìm thành viên…" data-ifx-aff-members-search autocomplete="off" /></div>
      </div>
    </div>
    <div class="ix-table-responsive">
      <table class="ix-table" id="aff-members-table">
        <thead><tr>
          <th>Ngày tham gia</th>
          <th>Thành viên</th>
          <th>Lớp</th>
          <th>Trạng thái</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div id="ifx-aff-members-pager" style="padding:12px 16px 4px;display:flex;justify-content:center"></div>
  </div>

  <div class="ix-card">
    <div class="ix-table-toolbar">
      <div style="font-size:14px;font-weight:600;color:var(--ix-text-primary)">Lịch sử hoa hồng</div>
      <div style="display:flex;gap:8px;align-items:center">
        <div class="ix-table-search" style="margin:0"><i class="ti ti-search"></i><input type="search" placeholder="Tìm hoa hồng…" data-ifx-aff-commission-search autocomplete="off" /></div>
        <button type="button" class="ix-btn ix-btn-outline ix-btn-sm" disabled aria-disabled="true" title="Đang triển khai"><i class="ti ti-download" style="font-size:12px"></i> Xuất</button>
      </div>
    </div>
    <div class="ix-table-responsive">
      <table class="ix-table" id="aff-table">
        <thead><tr>
          <th>Ngày</th>
          <th>Người được giới thiệu</th>
          <th>Lớp</th>
          <th>Sản phẩm</th>
          <th>Giá trị đơn</th>
          <th>Hoa hồng</th>
          <th>Trạng thái</th>
        </tr></thead>
        <tbody></tbody>
      </table>
    </div>
    <div id="ifx-aff-commission-pager" style="padding:12px 16px 4px;display:flex;justify-content:center"></div>
  </div>

  </div>
</div>`;

/* ── TAB: LIÊN KẾT THẺ (Thanh toán) — y nguyên profile.html #tab-payment ── */
var TAB_PAYMENT_HTML = `
<div id="tab-payment" class="ix-tab-content" data-ix-profile-panel="tab-payment" data-ifx-own-only>
    <form id="ifx-mine-payment-form" class="ifx-mine-payment-stack">
      <div class="ix-card ix-mb-24">
        <div class="ix-card-header"><div class="ix-card-title">Thanh toán gói cước</div></div>
        <div class="ix-card-body">
          <p style="font-size:13px;color:var(--ix-text-muted);margin:0 0 16px;line-height:1.5">Phương thức mặc định khi mua hoặc gia hạn gói Premium / Elite.</p>
          <div class="ifx-pay-method-row">
            <label class="ifx-pay-method-opt"><input type="radio" name="payMethod" value="card" data-pay-field="payMethod" checked /> <span><i class="ti ti-credit-card"></i> Thẻ tín dụng / Ghi nợ</span></label>
            <label class="ifx-pay-method-opt"><input type="radio" name="payMethod" value="momo" data-pay-field="payMethod" /> <span><i class="ti ti-wallet"></i> MoMo</span></label>
            <label class="ifx-pay-method-opt"><input type="radio" name="payMethod" value="transfer" data-pay-field="payMethod" /> <span><i class="ti ti-building-bank"></i> Chuyển khoản</span></label>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
            <div class="ix-form-group"><label class="ix-label">Loại thẻ</label><input type="text" class="ix-input" placeholder="Visa, Mastercard…" data-pay-field="cardBrand" /></div>
            <div class="ix-form-group"><label class="ix-label">4 số cuối thẻ</label><input type="text" class="ix-input" placeholder="1234" maxlength="4" data-pay-field="cardLast4" /></div>
          </div>
        </div>
      </div>
      <div class="ix-card ix-mb-24">
        <div class="ix-card-header"><div class="ix-card-title">Nhận hoa hồng Affiliate</div></div>
        <div class="ix-card-body">
          <p style="font-size:13px;color:var(--ix-text-muted);margin:0 0 16px;line-height:1.5">Tài khoản ngân hàng để iFlux chuyển hoa hồng referral khi bạn yêu cầu rút tiền.</p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div class="ix-form-group"><label class="ix-label">Ngân hàng</label><input type="text" class="ix-input" placeholder="VD: Vietcombank" data-pay-field="bankName" /></div>
            <div class="ix-form-group"><label class="ix-label">Chi nhánh</label><input type="text" class="ix-input" placeholder="Tùy chọn" data-pay-field="bankBranch" /></div>
            <div class="ix-form-group"><label class="ix-label">Số tài khoản</label><input type="text" class="ix-input" placeholder="0123456789" data-pay-field="bankAccount" /></div>
            <div class="ix-form-group"><label class="ix-label">Chủ tài khoản</label><input type="text" class="ix-input" placeholder="NGUYEN VAN A" data-pay-field="bankHolder" /></div>
          </div>
        </div>
      </div>
      <button type="submit" class="ix-btn ix-btn-primary"><i class="ti ti-device-floppy" style="font-size:14px"></i> Lưu tài khoản thanh toán</button>
    </form>
  </div>`;

/* ── TAB: RIÊNG TƯ — y nguyên profile.html #tab-privacy ── */
var TAB_PRIVACY_HTML = `
<div id="tab-privacy" class="ix-tab-content" data-ix-profile-panel="tab-privacy" data-ifx-own-only>
    <div class="ix-card ix-mb-24">
      <div class="ix-card-header"><div class="ix-card-title">Quyền riêng tư hồ sơ</div></div>
      <div class="ix-card-body">
        <p style="font-size:13px;color:var(--ix-text-muted);margin:0 0 20px;line-height:1.55">Chọn thông tin nào người khác được xem khi truy cập hồ sơ công khai của bạn. Mặc định tất cả đều ẩn — chỉ hiển thị tên và ảnh đại diện.</p>
        <div class="ifx-privacy-cols">
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ix-text-primary);margin-bottom:10px"><i class="ti ti-eye" style="font-size:14px;color:var(--ix-accent)"></i> Luôn hiển thị công khai</div>
            <ul class="ifx-privacy-static-list" id="ifx-privacy-always-public"></ul>
          </div>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--ix-text-primary);margin-bottom:10px"><i class="ti ti-lock" style="font-size:14px;color:var(--ix-text-muted)"></i> Không bao giờ hiển thị</div>
            <ul class="ifx-privacy-static-list" id="ifx-privacy-always-private"></ul>
          </div>
        </div>
      </div>
    </div>
    <div class="ix-card ix-mb-24">
      <div class="ix-card-header" style="justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div class="ix-card-title">Thiết lập hiển thị</div>
        <button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-save-privacy><i class="ti ti-device-floppy" style="font-size:13px"></i> Lưu thay đổi</button>
      </div>
      <div class="ix-card-body" style="padding-top:0">
        <div id="ifx-privacy-settings"></div>
      </div>
    </div>
    <div class="ix-card">
      <div class="ix-card-header" style="justify-content:space-between;flex-wrap:wrap;gap:10px">
        <div class="ix-card-title">Thiết lập thông báo</div>
        <button type="button" class="ix-btn ix-btn-primary ix-btn-sm" data-ifx-save-privacy><i class="ti ti-device-floppy" style="font-size:13px"></i> Lưu thay đổi</button>
      </div>
      <div class="ix-card-body" style="padding-top:0">
        <p class="ifx-notif-pref-intro">Bật/tắt từng thông báo in-app. Nhóm chỉ để dễ đọc — mỗi loại độc lập.</p>
        <div id="ifx-notification-settings"></div>
      </div>
    </div>
  </div>`;

/* ── TAB: BẢO MẬT (Mật khẩu) — y nguyên profile.html #tab-security ── */
var TAB_SECURITY_HTML = `
<div id="tab-security" class="ix-tab-content" data-ix-profile-panel="tab-security" data-ifx-own-only>
    <div class="ix-card ix-mb-24">
      <div class="ix-card-header"><div class="ix-card-title">Đổi mật khẩu</div></div>
      <div class="ix-card-body">
        <div id="ifx-security-no-password" class="ix-alert ix-alert-info" hidden style="margin:0 0 16px">
          <i class="ti ti-info-circle ix-alert-icon"></i>
          <div class="ix-alert-body">
            Tài khoản đăng nhập bằng mạng xã hội — chưa có mật khẩu email. Tính năng đặt mật khẩu sẽ được bổ sung sau.
          </div>
        </div>
        <form id="ifx-security-password-form" autocomplete="off" style="display:flex;flex-direction:column;gap:16px;max-width:480px">
          <div class="ix-form-group">
            <label class="ix-label" for="ifx-sec-current">Mật khẩu hiện tại</label>
            <div class="ix-input-password-wrap">
              <input type="password" id="ifx-sec-current" class="ix-input" data-sec-field="current" autocomplete="current-password" placeholder="············" required />
              <button type="button" class="ix-input-password-toggle" data-ix-toggle-password="ifx-sec-current" aria-label="Hiện mật khẩu"><i class="ti ti-eye-off"></i></button>
            </div>
          </div>
          <div class="ix-form-group">
            <label class="ix-label" for="ifx-sec-new">Mật khẩu mới</label>
            <div class="ix-input-password-wrap">
              <input type="password" id="ifx-sec-new" class="ix-input" data-sec-field="new" autocomplete="new-password" placeholder="············" minlength="8" required />
              <button type="button" class="ix-input-password-toggle" data-ix-toggle-password="ifx-sec-new" aria-label="Hiện mật khẩu"><i class="ti ti-eye-off"></i></button>
            </div>
            <div class="ifx-field-hint" style="font-size:12px;color:var(--ix-text-muted);margin-top:6px">Ít nhất 8 ký tự</div>
          </div>
          <div class="ix-form-group">
            <label class="ix-label" for="ifx-sec-confirm">Xác nhận mật khẩu mới</label>
            <div class="ix-input-password-wrap">
              <input type="password" id="ifx-sec-confirm" class="ix-input" data-sec-field="confirm" autocomplete="new-password" placeholder="············" minlength="8" required />
              <button type="button" class="ix-input-password-toggle" data-ix-toggle-password="ifx-sec-confirm" aria-label="Hiện mật khẩu"><i class="ti ti-eye-off"></i></button>
            </div>
          </div>
          <div>
            <button type="submit" class="ix-btn ix-btn-primary" data-ifx-save-password><i class="ti ti-device-floppy" style="font-size:13px"></i> Lưu mật khẩu</button>
          </div>
        </form>
      </div>
    </div>
    <div class="ix-card">
      <div class="ix-card-header"><div class="ix-card-title">Xác thực hai yếu tố (2FA)</div></div>
      <div class="ix-card-body">
        <div class="ix-alert ix-alert-info" style="margin:0">
          <i class="ti ti-info-circle ix-alert-icon"></i>
          <div class="ix-alert-body">
            <strong>Sắp có</strong> — Xác thực hai yếu tố đang được triển khai.
          </div>
        </div>
      </div>
    </div>
  </div>`;

function mainHtml() {
  return (
    '<div class="ix-profile-tabs" data-ifx-account-profile-tabs></div>' +
    TAB_DASHBOARD_HTML + TAB_AFFILIATE_HTML + TAB_PAYMENT_HTML + TAB_PRIVACY_HTML + TAB_SECURITY_HTML
  );
}

async function mountDashboardTab(panelEl) {
  if (!panelEl || panelEl._ifxMounted) return;
  panelEl._ifxMounted = true;
  var mod = await import('../home-dashboard/index.js?v=c00e891045');
  await mod.mount(panelEl);
}

/* Watchlist KHÔNG mount cứng riêng ở đây và KHÔNG còn mặc định trong canvas Sidebar nữa (Owner
   chốt 2026-10: Tùy chỉnh/Dashboard đã có Watchlist, Sidebar chỉ là Widget Host trung lập —
   dashboard-engine.js retireWatchlistFromSidebar dọn layout cũ nếu còn sót). Trước đây mount
   thẳng IfluxWatchlistBlock vào 1 div riêng [data-ifx-hub-watchlist] NGOÀI hệ layout — đã gỡ. */
async function mountSidebarCanvas() {
  await ensureSequence(SIDEBAR_DEPS);
  if (window.IfluxWatchlistStore && IfluxWatchlistStore.ensureSeedFromDemo) {
    try { IfluxWatchlistStore.ensureSeedFromDemo(); } catch (e) { /* ignore */ }
  }
  /* Canvas kéo-thả ([data-ifx-hub-sidebar-canvas]) hiện ngay layout đã lưu — không chờ user mở
     tab Dashboard mới thấy (IfluxDashboardEngine.init() chỉ chạy khi tab Dashboard mount). */
  if (window.IfluxDashboardEngine && IfluxDashboardEngine.refreshSidebar) {
    IfluxDashboardEngine.refreshSidebar();
  }
}

async function mountActivity(panelEl) {
  if (!panelEl || panelEl._ifxMounted) return;
  panelEl._ifxMounted = true;
  await ensureSequence([
    { global: 'IfluxProfileActivityStore', src: ASSET + 'profile-activity-store.js?v=9de816eae4' },
    { global: 'IfluxProfileActivityPage', src: ASSET + 'profile-activity-page.js?v=ab7cee155c' }
  ]);
  if (window.IfluxProfileActivityPage) IfluxProfileActivityPage.init();
}

export async function mount(el) {
  /* profile.css: hầu hết style tab Affiliate/Thanh toán/Riêng tư/Bảo mật (responsive ≤1024px)
     chỉ áp dụng trong [data-ifx-account-profile] — gắn lên .ifx-app (khung SPA dùng chung mọi
     trang) khi vào trang này, gỡ khi rời đi, để không rò style sang trang khác sau soft-nav. */
  var app = document.querySelector('.ifx-app');
  if (app) app.setAttribute('data-ifx-account-profile', '');

  var frame = buildPageFrame(el, { rightSidebar: true, sidebarLabel: 'Theo dõi & Tiện ích' });
  applyHubLayout(el);
  var rightAside = el.querySelector('.ifx-shell-sidebar-right');
  frame.rightSidebarContent = rightAside ? rightAside.querySelector('.ifx-shell-sidebar-content') : null;

  frame.sidebarContent.innerHTML = SIDEBAR_LEFT_HTML;
  if (frame.rightSidebarContent) frame.rightSidebarContent.innerHTML = PLAN_PROMO_HTML + ACTIVITY_HTML;
  frame.mainContent.innerHTML = mainHtml();

  /* Cầu nối cho account-feature-boot.js (activateAccountProfilePanel) mount lazy tab Dashboard
     khi được chọn — tab Dashboard không nằm trong CORE_SCRIPTS/registry nghiệp vụ tài khoản. */
  window.IfluxHomeDashboardTab = { ensureMounted: mountDashboardTab };

  mountSidebarCanvas();

  var activityPanel = frame.rightSidebarContent && frame.rightSidebarContent.querySelector('[data-ifx-hub-activity]');
  if (activityPanel) mountActivity(activityPanel);

  /* Widget Placement Admin — publishKey 'dashboard' (giữ nguyên key cũ), chỉ còn host ở Sidebar
     phải (section 'sidebar-right', chỗ cho Template "Promotion" — Phase 3). Sidebar trái/Main do
     trang tự dựng, không qua Admin Widget Placement nữa. */
  await mountPageWidgets(el, 'dashboard', { gateKey: 'home', sectionFilter: ['sidebar-right'] });

  /* Toàn bộ nghiệp vụ Affiliate/Thanh toán/Riêng tư/Bảo mật/Hồ sơ — chạy nguyên runtime cũ,
     không viết lại. Module chỉ tự boot() khi KHÔNG ở context composite (xem account-feature-
     boot.js) — ở đây tự gọi boot() mỗi lần mount() để bind đúng DOM mới dựng (soft-nav rebuild
     lại markup mỗi lần ghé trang, boot() gọi lại an toàn vì loadScriptsSequential cache theo src). */
  var accountBoot = await import('../../runtime/account-feature-boot.js?v=220f0529fd');
  if (accountBoot && accountBoot.boot) await accountBoot.boot();

  return {
    unmount: function () {
      if (app) app.removeAttribute('data-ifx-account-profile');
      window.IfluxHomeDashboardTab = null;
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  var app = document.querySelector('.ifx-app');
  if (app) app.removeAttribute('data-ifx-account-profile');
  window.IfluxHomeDashboardTab = null;
  if (el) el.innerHTML = '';
}
