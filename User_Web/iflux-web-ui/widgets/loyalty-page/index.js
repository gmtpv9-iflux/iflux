/**
 * WGT-LOY-PAGE — Composite Chương trình thành viên (Blueprint Phase D)
 */
import { loadScriptTiers, loadScript } from '../../runtime/legacy-bridge.js?v=phaseCW420260721';

var ASSET = '/User_Web/iflux-web-ui/';
var ADMIN = '/Admin_Design_system/iflux-admin-ui/';

export const meta = { id: 'WGT-LOY-PAGE', title: 'Chương trình thành viên' };

var CORE_TIERS = [
  [ASSET + 'loyalty-page.js']
];

var LAYOUT_HTML = `<h1 class="ix-page-title">Chương trình thành viên</h1>
    <p class="ifx-page-intro">Chương trình thành viên iFlux — affiliate, insight card và quyền lợi khi biến tri thức đầu tư thành tài sản số.</p>

    <div class="ifx-loyalty-tabs">
      <button type="button" class="ifx-loyalty-tab active" data-ifx-loyalty-tab="tab-membership-intro"><i class="ti ti-sparkles"></i> Giới thiệu</button>
      <button type="button" class="ifx-loyalty-tab" data-ifx-loyalty-goto="/account/affiliate"><i class="ti ti-affiliate"></i> Đi đến Affiliate</button>
    </div>

    <div id="tab-membership-intro" class="ifx-loyalty-panel active">

      <section class="ifx-mship-hero ifx-mship-hero--split">
        <div class="ifx-mship-hero__copy">
          <div class="ifx-mship-hero__badge"><i class="ti ti-sparkles"></i> iFlux Membership</div>
          <h1 class="ifx-mship-hero__title">Xây dựng tài sản số từ tri thức đầu tư của bạn</h1>
          <p class="ifx-mship-hero__sub">iFlux không chỉ là nền tảng phân tích dòng tiền — biến kiến thức, kinh nghiệm và góc nhìn đầu tư thành tài sản số có giá trị lâu dài.</p>
          <div class="ifx-mship-hero__actions">
            <a href="/nha-cua-toi?tab=affiliate" class="ix-btn ix-btn-primary ix-btn-lg"><i class="ti ti-affiliate"></i> Vào bảng Affiliate</a>
            <a href="/goi-cuoc" class="ix-btn ix-btn-outline ix-btn-lg"><i class="ti ti-crown"></i> Xem gói cước</a>
          </div>
          <div class="ifx-mship-hero__stats">
            <div class="ifx-mship-stat"><i class="ti ti-arrows-exchange"></i><div><strong>Realtime</strong><span>Dòng tiền thông minh</span></div></div>
            <div class="ifx-mship-stat"><i class="ti ti-share-3"></i><div><strong>1 chạm</strong><span>Insight Card + QR</span></div></div>
            <div class="ifx-mship-stat"><i class="ti ti-infinity"></i><div><strong>Affiliate</strong><span>Hoa hồng 3 tầng</span></div></div>
          </div>
        </div>
        <div class="ifx-mship-hero__visual" aria-hidden="true">
          <div class="ifx-mship-mock ifx-mship-mock--hero">
            <div class="ifx-mship-mock__chrome">
              <span></span><span></span><span></span>
              <em>iFlux · Smart Money · SHB</em>
            </div>
            <div class="ifx-mship-mock__body">
              <div class="ifx-mship-mock__metric">
                <small>Lệnh &gt; 1 tỷ hôm nay</small>
                <strong>38.4%</strong>
                <span class="up"><i class="ti ti-trending-up"></i> +6.2 vs 5 phiên</span>
              </div>
              <div class="ifx-mship-mock__bars">
                <div style="--h:72%"><i></i><label>Mua TM</label></div>
                <div style="--h:48%"><i></i><label>Bán TM</label></div>
                <div style="--h:88%"><i></i><label>Mua CT</label></div>
                <div style="--h:35%"><i></i><label>Bán CT</label></div>
              </div>
              <div class="ifx-mship-mock__heatmap">
                <span class="g"></span><span class="g"></span><span class="y"></span><span class="r"></span>
                <span class="y"></span><span class="g"></span><span class="g"></span><span class="y"></span>
                <span class="r"></span><span class="y"></span><span class="g"></span><span class="g"></span>
              </div>
            </div>
            <div class="ifx-mship-mock__float ifx-mship-mock__float--share">
              <i class="ti ti-qrcode"></i> Insight Card
            </div>
          </div>
        </div>
      </section>

      <section class="ifx-mship-intro ix-card">
        <div class="ix-card-body">
          <p class="ifx-mship-intro__lead">Khác với mạng xã hội truyền thống, mỗi bài viết và mỗi dữ liệu bạn chia sẻ trên iFlux đều có thể <strong>tiếp tục mang lại giá trị theo thời gian</strong> qua:</p>
          <div class="ifx-mship-intro__pillars">
            <div class="ifx-mship-intro__pillar">
              <div class="ifx-mship-intro__pillar-icon"><i class="ti ti-users"></i></div>
              <strong>Community</strong>
              <span>Cộng đồng theo dõi &amp; tương tác</span>
            </div>
            <div class="ifx-mship-intro__pillar">
              <div class="ifx-mship-intro__pillar-icon"><i class="ti ti-world-search"></i></div>
              <strong>SEO</strong>
              <span>Được tìm thấy lâu dài</span>
            </div>
            <div class="ifx-mship-intro__pillar">
              <div class="ifx-mship-intro__pillar-icon"><i class="ti ti-hierarchy-3"></i></div>
              <strong>Knowledge Graph</strong>
              <span>Liên kết CP · ngành · chủ đề</span>
            </div>
          </div>
        </div>
      </section>

      <div class="ifx-mship-journey ifx-mship-journey--timeline">

        <!-- Bước 1 -->
        <article class="ifx-mship-step-block ix-card ifx-mship-step-block--wide" id="mship-step-1">
          <div class="ifx-mship-step-block__marker"><i class="ti ti-chart-dots-3"></i></div>
          <div class="ix-card-body">
            <div class="ifx-mship-step-block__label">Bước 1</div>
            <h2 class="ifx-mship-step-block__title">Tạo ra giá trị mà nhà đầu tư thực sự cần</h2>
            <p class="ifx-mship-step-block__lead">iFlux cung cấp dữ liệu đặc thù mà rất ít nền tảng có thể hiển thị theo thời gian thực — khiến người đọc có cảm giác <em>“À, cái này mình chưa từng thấy ở nơi khác.”</em></p>

            <div class="ifx-mship-value-grid">
              <div class="ifx-mship-value-card">
                <div class="ifx-mship-value-card__icon"><i class="ti ti-arrows-exchange"></i></div>
                <h3>1. Nhìn thấy dòng tiền mà thị trường đang hành động</h3>
                <ul>
                  <li>Smart Money Flow</li>
                  <li>Active Buy / Active Sell</li>
                  <li>Money Flow Coefficient</li>
                  <li>Theo dõi chủ thể</li>
                </ul>
              </div>
              <div class="ifx-mship-value-card">
                <div class="ifx-mship-value-card__icon"><i class="ti ti-bolt"></i></div>
                <h3>2. Phát hiện cơ hội nhanh hơn thị trường</h3>
                <ul>
                  <li>Ranking đa chiều</li>
                  <li>Heatmap thông minh</li>
                  <li>Alert theo dòng tiền</li>
                  <li>Theo dõi ngành, họ CP &amp; chủ đề</li>
                </ul>
              </div>
              <div class="ifx-mship-value-card">
                <div class="ifx-mship-value-card__icon"><i class="ti ti-share-3"></i></div>
                <h3>3. Chia sẻ &amp; xây thương hiệu cá nhân</h3>
                <ul>
                  <li>Chia sẻ biểu đồ, bảng xếp hạng, Heatmap</li>
                  <li>Viết phân tích trên Community</li>
                  <li>Xây dựng cộng đồng người theo dõi</li>
                </ul>
              </div>
              <div class="ifx-mship-value-card ifx-mship-value-card--accent">
                <div class="ifx-mship-value-card__icon"><i class="ti ti-coin"></i></div>
                <h3>4. Biến tri thức thành nguồn thu nhập</h3>
                <ul>
                  <li>Affiliate</li>
                  <li>Chuyên gia</li>
                  <li>Nội dung Premium</li>
                  <li>Cộng đồng trả phí</li>
                </ul>
              </div>
            </div>

            <p class="ifx-mship-step-block__note">Nhiều dữ liệu cho phép bạn <strong>tự định nghĩa ngưỡng thống kê</strong> theo góc nhìn đầu tư riêng — và dùng chính chúng để tạo phân tích mà cộng đồng thực sự muốn đọc.</p>

            <div class="ifx-mship-details-wrap">
              <p class="ifx-mship-details-wrap__title"><i class="ti ti-microscope"></i> Chi tiết công cụ — những gì khiến iFlux khác biệt</p>
              <div class="ifx-mship-details">

                <details class="ifx-mship-detail">
                  <summary><span class="ifx-mship-detail__ico"><i class="ti ti-chart-arrows-vertical"></i></span> Dòng tiền thông minh (Smart Money Flow)</summary>
                  <div class="ifx-mship-detail__body">
                    <p>Không chỉ biết cổ phiếu tăng hay giảm. iFlux cho bạn biết:</p>
                    <ul>
                      <li>Bao nhiêu % giá trị giao dịch hôm nay đến từ lệnh trên <strong>500 triệu, 1 tỷ, 2 tỷ, 5 tỷ…</strong> (tùy chỉnh ngưỡng)</li>
                      <li>Dòng tiền lớn đang mua chủ động hay bán chủ động</li>
                      <li>Dòng tiền lớn xuất hiện liên tục hay chỉ một giao dịch đơn lẻ</li>
                      <li>So sánh Smart Money giữa hôm nay, 5 phiên và 20 phiên</li>
                    </ul>
                  </div>
                </details>

                <details class="ifx-mship-detail">
                  <summary><span class="ifx-mship-detail__ico"><i class="ti ti-arrows-left-right"></i></span> Active Buy / Active Sell</summary>
                  <div class="ifx-mship-detail__body">
                    <ul>
                      <li>Bao nhiêu tiền được mua chủ động vs bán chủ động</li>
                      <li>Chênh lệch Money Flow theo thời gian thực</li>
                      <li>Bên mua hay bên bán đang chiếm ưu thế</li>
                    </ul>
                  </div>
                </details>

                <details class="ifx-mship-detail">
                  <summary><span class="ifx-mship-detail__ico"><i class="ti ti-percentage"></i></span> Money Flow Coefficient</summary>
                  <div class="ifx-mship-detail__body">
                    <ul>
                      <li>Hệ số dòng tiền theo cổ phiếu, ngành, họ cổ phiếu, chủ đề đầu tư</li>
                      <li>Phát hiện dòng tiền dịch chuyển trước khi giá phản ánh đầy đủ</li>
                    </ul>
                  </div>
                </details>

                <details class="ifx-mship-detail">
                  <summary><span class="ifx-mship-detail__ico"><i class="ti ti-trophy"></i></span> Top Money Flow Rankings</summary>
                  <div class="ifx-mship-detail__body">
                    <p>Không chỉ Top tăng giá — iFlux có nhiều bảng xếp hạng:</p>
                    <ul>
                      <li>Top CP hút / rút tiền mạnh nhất · Top ngành · Top họ · Top chủ đề</li>
                      <li>Top Smart Money · Top Money Flow Coefficient · Top đột biến dòng tiền · Top thanh khoản bất thường</li>
                    </ul>
                  </div>
                </details>

                <details class="ifx-mship-detail">
                  <summary><span class="ifx-mship-detail__ico"><i class="ti ti-layout-grid"></i></span> Heatmap thế hệ mới</summary>
                  <div class="ifx-mship-detail__body">
                    <p>Đổi Heatmap theo: giá trị GD, dòng tiền chủ động, Smart Money, MFC, khối lượng, biến động, tỷ lệ hấp thụ, điểm sức mạnh. Diện tích ô phản ánh vốn hóa hoặc chỉ số khác tùy chế độ.</p>
                  </div>
                </details>

                <details class="ifx-mship-detail">
                  <summary><span class="ifx-mship-detail__ico"><i class="ti ti-brain"></i></span> Theo dõi Chủ thể · Ranking · Theo dõi · Alert · Story</summary>
                  <div class="ifx-mship-detail__body">
                    <p><strong>Chủ thể:</strong> Cá nhân, Tổ chức, Tự doanh, Nước ngoài, Smart Money — biết ai mua/bán và cường độ từng nhóm.</p>
                    <p><strong>Ranking:</strong> Xếp theo giá, % tăng giảm, Money Flow, Smart Money, thanh khoản, sức mạnh, hấp thụ, momentum…</p>
                    <p><strong>Theo dõi thông minh:</strong> Theo dõi Money Flow, Smart Money, Alert, Heatmap &amp; Ranking riêng, biến động realtime.</p>
                    <p><strong>Alert:</strong> Smart Money xuất hiện, Money Flow đảo chiều, vượt ngưỡng, chủ thể đổi chiều, lọt Top, ngành/họ hút tiền, tín hiệu bất thường.</p>
                    <p><strong>Story Intelligence:</strong> CP kết nối tin tức, phân tích chuyên gia, bài cộng đồng, chủ đề, họ, ngành, doanh nghiệp liên quan — từ dữ liệu đến ngữ cảnh một màn hình.</p>
                    <p><strong>Portfolio Intelligence:</strong> Danh mục hút/mất dòng tiền, sức mạnh từng CP, phân bổ ngành, rủi ro tập trung, hiệu suất theo thời gian.</p>
                  </div>
                </details>

              </div>
            </div>
          </div>
        </article>

        <!-- Bước 2 -->
        <article class="ifx-mship-step-block ix-card ifx-mship-step-block--split">
          <div class="ifx-mship-step-block__marker"><i class="ti ti-share-3"></i></div>
          <div class="ix-card-body ifx-mship-step-block__grid">
            <div class="ifx-mship-step-block__content">
              <div class="ifx-mship-step-block__label">Bước 2</div>
              <h2 class="ifx-mship-step-block__title">Chia sẻ dễ dàng tới mọi nền tảng</h2>
              <p>Hầu hết khối dữ liệu trên iFlux đều chia sẻ chỉ bằng <strong>một thao tác</strong>. Người xem được đưa đến đúng vị trí biểu đồ hoặc khối dữ liệu — mỗi liên kết gắn mã Affiliate của bạn.</p>
              <ul class="ifx-mship-step-block__list">
                <li><i class="ti ti-check"></i> Người đọc khám phá được dữ liệu</li>
                <li><i class="ti ti-check"></i> Người đọc đăng ký tài khoản</li>
                <li><i class="ti ti-check"></i> Người đọc nâng cấp Membership</li>
              </ul>
              <p class="ifx-mship-step-block__foot">→ Ghi nhận về hệ thống cộng tác viên của bạn.</p>
            </div>
            <div class="ifx-mship-mock ifx-mship-mock--share" aria-hidden="true">
              <div class="ifx-mship-mock__card-head"><i class="ti ti-photo-share"></i> iFlux · Insight Card</div>
              <div class="ifx-mship-mock__card-img"></div>
              <div class="ifx-mship-mock__card-foot">
                <span class="ifx-mship-mock__qr"><i class="ti ti-qrcode"></i></span>
                <span>Quét để xem · ref MINH10</span>
              </div>
              <div class="ifx-mship-mock__socials">
                <i class="ti ti-brand-facebook"></i>
                <i class="ti ti-brand-telegram"></i>
                <i class="ti ti-brand-zalo"></i>
              </div>
            </div>
          </div>
        </article>

        <!-- Bước 3 -->
        <article class="ifx-mship-step-block ix-card ifx-mship-step-block--split">
          <div class="ifx-mship-step-block__marker"><i class="ti ti-users"></i></div>
          <div class="ix-card-body ifx-mship-step-block__grid ifx-mship-step-block__grid--reverse">
            <div class="ifx-mship-step-block__content">
              <div class="ifx-mship-step-block__label">Bước 3</div>
              <h2 class="ifx-mship-step-block__title">Xây dựng cộng đồng người theo dõi</h2>
              <p>Mỗi bài viết, nhận định hoặc chia sẻ đều giúp bạn xây tệp người theo dõi riêng.</p>
              <ul class="ifx-mship-step-block__list">
                <li><i class="ti ti-check"></i> Theo dõi và đọc phân tích của bạn</li>
                <li><i class="ti ti-check"></i> Nhận thông báo khi bạn đăng bài</li>
                <li><i class="ti ti-check"></i> Đăng ký thành viên cộng đồng của bạn</li>
              </ul>
              <p class="ifx-mship-step-block__foot">Xây dựng <strong>thương hiệu cá nhân</strong> trong đầu tư.</p>
            </div>
            <div class="ifx-mship-mock ifx-mship-mock--community" aria-hidden="true">
              <div class="ifx-mship-mock__avatars">
                <span>A</span><span>B</span><span>C</span><span>+128</span>
              </div>
              <div class="ifx-mship-mock__feed">
                <div><i class="ti ti-heart"></i> 42 theo dõi mới</div>
                <div><i class="ti ti-bell"></i> Thông báo bài viết</div>
                <div><i class="ti ti-message"></i> Phân tích SHB · Smart Money</div>
              </div>
            </div>
          </div>
        </article>

        <!-- Bước 4 -->
        <article class="ifx-mship-step-block ix-card ifx-mship-step-block--split">
          <div class="ifx-mship-step-block__marker"><i class="ti ti-certificate"></i></div>
          <div class="ix-card-body ifx-mship-step-block__grid">
            <div class="ifx-mship-step-block__content">
              <div class="ifx-mship-step-block__label">Bước 4</div>
              <h2 class="ifx-mship-step-block__title">Trở thành Chuyên gia</h2>
              <p>Khi hoàn tất xác minh, bạn đăng ký trở thành <strong>Chuyên gia</strong> trên iFlux:</p>
              <ul class="ifx-mship-step-block__list">
                <li><i class="ti ti-check"></i> Nội dung chỉ dành cho thành viên</li>
                <li><i class="ti ti-check"></i> Phân tích chuyên sâu &amp; quyền truy cập follower</li>
                <li><i class="ti ti-check"></i> Dữ liệu cao cấp chỉ hiển thị khi bạn cho phép</li>
              </ul>
              <div class="ifx-mship-pillar__example">
                <i class="ti ti-lock-access"></i> Premium · Danh mục đầu tư · Góc nhìn chuyên gia · Thống kê độc quyền
              </div>
            </div>
            <div class="ifx-mship-mock ifx-mship-mock--expert" aria-hidden="true">
              <div class="ifx-mship-mock__badge"><i class="ti ti-certificate"></i> Chuyên gia iFlux</div>
              <div class="ifx-mship-mock__lock-row"><i class="ti ti-lock"></i> Nội dung members-only</div>
              <div class="ifx-mship-mock__lock-row"><i class="ti ti-chart-pie"></i> Top danh mục lợi nhuận</div>
              <div class="ifx-mship-mock__lock-row"><i class="ti ti-file-analytics"></i> Bài phân tích Premium</div>
            </div>
          </div>
        </article>

        <!-- Bước 5 -->
        <article class="ifx-mship-step-block ix-card ifx-mship-step-block--highlight ifx-mship-step-block--split">
          <div class="ifx-mship-step-block__marker"><i class="ti ti-books"></i></div>
          <div class="ix-card-body ifx-mship-step-block__grid ifx-mship-step-block__grid--reverse">
            <div class="ifx-mship-step-block__content">
              <div class="ifx-mship-step-block__label">Bước 5</div>
              <h2 class="ifx-mship-step-block__title">Tích lũy tài sản trí tuệ</h2>
              <p>Nội dung trên iFlux không chỉ nằm trong bảng tin. Mỗi bài viết được:</p>
              <ul class="ifx-mship-step-block__list">
                <li><i class="ti ti-link"></i> Liên kết CP, ngành, họ, chủ đề</li>
                <li><i class="ti ti-link"></i> Hiển thị trong Community</li>
                <li><i class="ti ti-link"></i> Tìm thấy qua SEO lâu dài</li>
              </ul>
              <p class="ifx-mship-step-block__foot">Thư viện tri thức đầu tư <strong>mang tên chính bạn</strong>.</p>
            </div>
            <div class="ifx-mship-mock ifx-mship-mock--graph" aria-hidden="true">
              <div class="ifx-mship-mock__node ifx-mship-mock__node--center"><i class="ti ti-user-star"></i> Bạn</div>
              <div class="ifx-mship-mock__node" style="--x:18%;--y:20%"><i class="ti ti-chart-candle"></i> SHB</div>
              <div class="ifx-mship-mock__node" style="--x:78%;--y:18%"><i class="ti ti-building-bank"></i> Ngân hàng</div>
              <div class="ifx-mship-mock__node" style="--x:12%;--y:72%"><i class="ti ti-news"></i> Tin tức</div>
              <div class="ifx-mship-mock__node" style="--x:82%;--y:70%"><i class="ti ti-search"></i> SEO</div>
            </div>
          </div>
        </article>

      </div>

      <section class="ifx-mship-revenue ix-card">
        <div class="ix-card-body">
          <h2 class="ifx-mship-revenue__title"><i class="ti ti-chart-bar"></i> Thu nhập đến từ đâu?</h2>
          <p>Tùy cấp độ tham gia, nguồn doanh thu có thể đến từ:</p>
          <div class="ifx-mship-revenue__grid">
            <span class="ifx-mship-revenue__chip"><i class="ti ti-affiliate"></i> Hoa hồng giới thiệu</span>
            <span class="ifx-mship-revenue__chip"><i class="ti ti-lock-access"></i> Nội dung thành viên</span>
            <span class="ifx-mship-revenue__chip"><i class="ti ti-users"></i> Cộng đồng theo dõi</span>
            <span class="ifx-mship-revenue__chip"><i class="ti ti-handshake"></i> Cộng tác viên</span>
            <span class="ifx-mship-revenue__chip"><i class="ti ti-certificate"></i> Chương trình Chuyên gia</span>
            <span class="ifx-mship-revenue__chip"><i class="ti ti-chart-pie"></i> Chia sẻ doanh thu</span>
          </div>
          <p class="ifx-mship-disclaimer">Thu nhập phụ thuộc vào chất lượng nội dung, mức độ đóng góp, quy mô cộng đồng và các chương trình hiện hành của iFlux; <strong>không được đảm bảo trước</strong> và sẽ khác nhau giữa từng cá nhân.</p>
        </div>
      </section>

      <section class="ifx-mship-cta ix-card">
        <div class="ix-card-body">
          <div class="ifx-mship-cta__icon" aria-hidden="true"><i class="ti ti-rocket"></i></div>
          <h3>Bắt đầu hành trình Membership</h3>
          <p>Lấy link Affiliate, chia sẻ Insight Card và theo dõi hoa hồng ngay trên Hồ sơ của bạn.</p>
          <a href="/nha-cua-toi?tab=affiliate" class="ix-btn ix-btn-primary ix-btn-lg"><i class="ti ti-arrow-right"></i> Mở tab Affiliate trong Hồ sơ</a>
        </div>
      </section>

      <section class="ifx-mship-support ix-card">
        <div class="ix-card-body ifx-mship-support__grid">
          <div class="ifx-mship-support__copy">
            <div class="ifx-mship-support__badge"><i class="ti ti-headset"></i> Hỗ trợ Membership</div>
            <h2 class="ifx-mship-support__title">Cần tư vấn thêm?</h2>
            <p>Đội ngũ iFlux sẵn sàng giải đáp về chương trình Membership, Affiliate, Chuyên gia và cách tối ưu thu nhập từ tri thức đầu tư của bạn.</p>
            <p class="ifx-mship-support__note"><i class="ti ti-clock"></i> Phản hồi trong giờ hành chính · Thứ 2 – Thứ 6, 8:30 – 17:30</p>
          </div>
          <div class="ifx-mship-support__channels">
            <div class="ifx-mship-support__hotline">
              <div class="ifx-mship-support__hotline-head"><i class="ti ti-phone"></i> Hotline / Zalo</div>
              <div class="ifx-mship-support__people">
                <div class="ifx-mship-support__person">
                  <span class="ifx-mship-support__person-avatar">SP</span>
                  <div class="ifx-mship-support__person-info">
                    <strong>Stephen Phạm</strong>
                    <span>0949 003 999</span>
                  </div>
                  <div class="ifx-mship-support__person-actions">
                    <a href="tel:+84949003999" class="ifx-mship-support__person-btn" title="Gọi điện"><i class="ti ti-phone"></i></a>
                    <a href="https://zalo.me/0949003999" target="_blank" rel="noopener noreferrer" class="ifx-mship-support__person-btn ifx-mship-support__person-btn--zalo" title="Chat Zalo"><i class="ti ti-brand-zalo"></i></a>
                  </div>
                </div>
                <div class="ifx-mship-support__person">
                  <span class="ifx-mship-support__person-avatar">CH</span>
                  <div class="ifx-mship-support__person-info">
                    <strong>Clara Hà</strong>
                    <span>0931 719 777</span>
                  </div>
                  <div class="ifx-mship-support__person-actions">
                    <a href="tel:+84931719777" class="ifx-mship-support__person-btn" title="Gọi điện"><i class="ti ti-phone"></i></a>
                    <a href="https://zalo.me/0931719777" target="_blank" rel="noopener noreferrer" class="ifx-mship-support__person-btn ifx-mship-support__person-btn--zalo" title="Chat Zalo"><i class="ti ti-brand-zalo"></i></a>
                  </div>
                </div>
                <div class="ifx-mship-support__person">
                  <span class="ifx-mship-support__person-avatar">JC</span>
                  <div class="ifx-mship-support__person-info">
                    <strong>Jenny Chou</strong>
                    <span>0966 370 333</span>
                  </div>
                  <div class="ifx-mship-support__person-actions">
                    <a href="tel:+84966370333" class="ifx-mship-support__person-btn" title="Gọi điện"><i class="ti ti-phone"></i></a>
                    <a href="https://zalo.me/0966370333" target="_blank" rel="noopener noreferrer" class="ifx-mship-support__person-btn ifx-mship-support__person-btn--zalo" title="Chat Zalo"><i class="ti ti-brand-zalo"></i></a>
                  </div>
                </div>
              </div>
            </div>
            <a href="mailto:support@iflux.vn?subject=Tư%20vấn%20Membership%20iFlux" class="ifx-mship-support__channel">
              <span class="ifx-mship-support__channel-icon"><i class="ti ti-mail"></i></span>
              <span class="ifx-mship-support__channel-text">
                <strong>Email hỗ trợ</strong>
                <span>support@iflux.vn</span>
              </span>
              <i class="ti ti-chevron-right ifx-mship-support__channel-arrow"></i>
            </a>
            <a href="/hoi-dap" class="ifx-mship-support__channel">
              <span class="ifx-mship-support__channel-icon ifx-mship-support__channel-icon--info"><i class="ti ti-help-circle"></i></span>
              <span class="ifx-mship-support__channel-text">
                <strong>FAQ</strong>
                <span>Câu hỏi thường gặp — gói cước, thanh toán &amp; nền tảng</span>
              </span>
              <i class="ti ti-chevron-right ifx-mship-support__channel-arrow"></i>
            </a>
          </div>
        </div>
      </section>
    </div>`;

export async function mount(el) {
  el.innerHTML = LAYOUT_HTML;
  await loadScriptTiers(CORE_TIERS);
  /* AS-SEARCH: App Shell Entry (shell-boot) — không tải từ composite. */
  if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
if (window.IfluxLoyaltyPage) IfluxLoyaltyPage.init();
  return { unmount: function () { if (el) el.innerHTML = ''; } };
}

export function unmount(el) {
  if (el) el.innerHTML = '';
}
