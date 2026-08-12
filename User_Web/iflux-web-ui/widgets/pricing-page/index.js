/**
 * WGT-PRICING-PAGE — Composite Gói cước
 * Page Feature HTML + deps theo tầng → IfluxPricingPage.init().
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=stickyFix20260811';

var ASSET = '/User_Web/iflux-web-ui/';

export const meta = { id: 'WGT-PRICING-PAGE', title: 'Gói cước' };

function routeUrl(key) {
  var R = typeof window !== 'undefined' && window.IfluxRoutes;
  if (R && R.to) return R.to(key);
  var fb = { faq: '/hoi-dap' };
  return fb[key] || '/';
}

function applyConsumerLinks(root) {
  if (!root) return;
  root.querySelectorAll('[data-route-key]').forEach(function (a) {
    a.href = routeUrl(a.getAttribute('data-route-key'));
  });
  root.querySelectorAll('[data-route-canonical]').forEach(function (a) {
    var path = a.getAttribute('data-route-canonical');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      /* P6-API-01 — internal nav chỉ Writer.navigate */
      var W = window.IfluxShellUrlWriter;
      if (W && W.navigate) W.navigate(path);
      else location.href = path;
    });
    a.href = '#';
  });
}

var CORE_TIERS = [
  [ASSET + 'iflux-plans-catalog.js'],
  [ASSET + 'pricing-page.js']
];

var LAYOUT_HTML =
  '<div class="ifx-pricing-banner" id="ifxPricingBanner" style="display:none">' +
    '<i class="ti ti-info-circle"></i>' +
    '<div><strong>Nâng cấp tài khoản</strong><br><span id="ifxPricingBannerText"></span></div>' +
  '</div>' +
  '<div style="text-align:center;padding:16px 0 32px">' +
    '<div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--ix-accent);margin-bottom:8px">iFlux Premium</div>' +
    '<h1 class="ix-page-title" style="margin-bottom:8px">Chọn gói phù hợp với bạn</h1>' +
    '<p style="font-size:15px;color:var(--ix-text-muted);max-width:520px;margin:0 auto 24px;line-height:1.6">Tất cả các gói bao gồm phân tích chuyên sâu, tín hiệu cổ phiếu, và truy cập cộng đồng chuyên gia.</p>' +
    '<div class="ix-billing-segments" id="billing-segments">' +
      '<button type="button" class="ix-billing-seg" data-cycle="monthly">Hàng tháng</button>' +
      '<button type="button" class="ix-billing-seg active" data-cycle="annual">Hàng năm <span class="ix-save-badge">Tiết kiệm</span></button>' +
      '<button type="button" class="ix-billing-seg" data-cycle="lifetime">Trọn đời</button>' +
    '</div>' +
  '</div>' +
  '<div class="ix-plan-grid ix-mb-24" id="ifx-plan-grid"></div>' +
  '<div class="ix-card ix-mb-24">' +
    '<div class="ix-card-header"><div class="ix-card-title">So sánh chi tiết các gói</div></div>' +
    '<div class="ix-card-body" style="padding:0">' +
      '<div class="ix-scroll-x">' +
        '<table class="ix-compare-table">' +
          '<thead id="ifx-compare-head"></thead>' +
          '<tbody id="ifx-compare-body"></tbody>' +
        '</table>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="ix-mb-24">' +
    '<h3 style="font-size:20px;font-weight:700;color:var(--ix-text-primary);margin-bottom:6px;text-align:center">Câu hỏi thường gặp</h3>' +
    '<p style="text-align:center;font-size:13px;color:var(--ix-text-muted);margin-bottom:0">Không tìm thấy câu trả lời? <a class="ix-link" href="#" data-route-key="faq">Xem trang FAQ</a> hoặc <a class="ix-link" href="mailto:support@iflux.vn">liên hệ chúng tôi</a></p>' +
    '<div class="ix-faq-grid ix-mt-6">' +
      '<div class="ix-accordion" data-single>' +
        '<div class="ix-accordion-item open">' +
          '<button type="button" class="ix-accordion-trigger">Tôi có thể đổi gói sau khi đăng ký không? <i class="ti ti-chevron-down ix-accordion-arrow"></i></button>' +
          '<div class="ix-accordion-body">Có. Bạn có thể nâng cấp hoặc hạ cấp bất kỳ lúc nào. Khi nâng cấp, hệ thống tính phần chênh lệch theo ngày còn lại trong chu kỳ hiện tại.</div>' +
        '</div>' +
        '<div class="ix-accordion-item">' +
          '<button type="button" class="ix-accordion-trigger">Phương thức thanh toán nào được hỗ trợ? <i class="ti ti-chevron-down ix-accordion-arrow"></i></button>' +
          '<div class="ix-accordion-body">iFlux hỗ trợ thẻ Visa/Mastercard, chuyển khoản ngân hàng, MoMo, VNPay và VNPT Pay. Tất cả giao dịch được mã hóa SSL.</div>' +
        '</div>' +
      '</div>' +
      '<div class="ix-accordion" data-single>' +
        '<div class="ix-accordion-item">' +
          '<button type="button" class="ix-accordion-trigger">Chính sách hoàn tiền? <i class="ti ti-chevron-down ix-accordion-arrow"></i></button>' +
          '<div class="ix-accordion-body">Hoàn tiền 100% trong vòng 7 ngày nếu bạn chưa sử dụng quá 50% quota tháng.</div>' +
        '</div>' +
        '<div class="ix-accordion-item">' +
          '<button type="button" class="ix-accordion-trigger">Elite có thể dùng thử không? <i class="ti ti-chevron-down ix-accordion-arrow"></i></button>' +
          '<div class="ix-accordion-body">Liên hệ team iFlux để được dùng thử Elite 14 ngày miễn phí cho tổ chức/quỹ đầu tư.</div>' +
        '</div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div class="ix-card" style="background:linear-gradient(135deg,rgba(27,53,135,.15) 0%,rgba(27,53,135,.05) 100%);border-color:rgba(27,53,135,.2)">' +
    '<div class="ix-card-body" style="text-align:center;padding:40px">' +
      '<h3 style="font-size:20px;font-weight:700;color:var(--ix-text-primary);margin-bottom:8px">Chưa chắc chắn?</h3>' +
      '<p style="font-size:14px;color:var(--ix-text-muted);margin-bottom:20px;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.6">Bắt đầu với gói Premium 1 tháng. Hoàn tiền 100% trong 7 ngày — không hỏi thêm câu nào.</p>' +
      '<a href="#" data-route-canonical="/tai-khoan/thanh-toan?plan=premium&amp;cycle=monthly" class="ix-btn ix-btn-primary ix-btn-lg" id="cta-bottom-premium">Bắt đầu dùng Premium →</a>' +
    '</div>' +
  '</div>';

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  applyConsumerLinks(el);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
if (window.IfluxPricingPage) IfluxPricingPage.init();
  return {
    unmount: function () { if (el) el.innerHTML = ''; }
  };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
