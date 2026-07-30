/**
 * WGT-FAQ-PAGE — Composite Câu hỏi thường gặp (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-FAQ-PAGE', title: 'Câu hỏi thường gặp' };

function routeUrl(key) {
  var R = typeof window !== 'undefined' && window.IfluxRoutes;
  if (R && R.to) return R.to(key);
  var fb = { pricing: '/goi-cuoc', membership: '/thanh-vien', loyalty: '/thanh-vien' };
  return fb[key] || '/';
}

function applyConsumerLinks(root) {
  if (!root) return;
  root.querySelectorAll('[data-route-key]').forEach(function (a) {
    a.href = routeUrl(a.getAttribute('data-route-key'));
  });
}

var CORE_TIERS = [
  [ASSET + 'faq-store.js'],
  [ASSET + 'faq-page.js']
];

var LAYOUT_HTML = `<div class="ifx-faq-hero">
      <div class="ifx-faq-hero__eyebrow">Hỗ trợ</div>
      <h1 class="ifx-faq-hero__title">Câu hỏi thường gặp</h1>
      <p class="ifx-faq-hero__sub">Tìm câu trả lời nhanh về tài khoản, gói cước, dữ liệu thị trường và chương trình Membership.</p>
      <div class="ifx-faq-search">
        <div class="ix-search">
          <i class="ti ti-search"></i>
          <input type="search" data-ifx-faq-search placeholder="Tìm câu hỏi… (ví dụ: hoàn tiền, Elite, watchlist)" aria-label="Tìm FAQ" />
        </div>
      </div>
      <div class="ifx-faq-cats" data-ifx-faq-cats></div>
    </div>

    <div data-ifx-faq-list data-ifx-ent-block="BLK-FAQ-LIST"></div>

    <div class="ifx-faq-support" data-ifx-ent-block="BLK-FAQ-SUPPORT">
      <div class="ix-card">
        <div class="ix-card-body">
          <h3>Chưa tìm thấy câu trả lời?</h3>
          <p>Đội ngũ iFlux sẵn sàng hỗ trợ qua email hoặc xem thêm tại trang Gói cước &amp; Membership.</p>
          <div class="ifx-faq-support__actions">
            <a href="mailto:support@iflux.vn" class="ix-btn ix-btn-primary"><i class="ti ti-mail"></i> support@iflux.vn</a>
            <a href="#" data-route-key="pricing" class="ix-btn ix-btn-outline"><i class="ti ti-crown"></i> Gói cước</a>
            <a href="#" data-route-key="membership" class="ix-btn ix-btn-outline"><i class="ti ti-gift"></i> Membership</a>
          </div>
        </div>
      </div>
    </div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  applyConsumerLinks(el);
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
if (window.IfluxFaqPage) IfluxFaqPage.init();
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('faq');
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
