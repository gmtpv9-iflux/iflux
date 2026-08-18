l
Tạo community-posts.html

Tạo community-posts.html
bash

cat > /home/claude/vuexy-system/community-posts.html << 'HTMLEOF'
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cộng đồng — Bài viết — iFlux</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.x/dist/tabler-icons.min.css" />
  <link rel="stylesheet" href="iflux-admin-ui.css" />
  <link rel="stylesheet" href="supplement.css" />
  <style>
    /* ── Post card ─────────────────────────────────────────── */
    .ix-post-card {
      display: flex;
      flex-direction: column;
      height: 100%;
      transition: transform .15s, box-shadow .15s;
      cursor: pointer;
    }
    .ix-post-card:hover {
      transform: translateY(-2px);
      box-shadow: var(--ix-shadow);
    }
    .ix-post-thumb {
      width: 100%; aspect-ratio: 16/9;
      background: var(--ix-bg-hover);
      border-radius: var(--ix-radius) var(--ix-radius) 0 0;
      overflow: hidden;
      position: relative;
      display: flex; align-items: center; justify-content: center;
    }
    .ix-post-thumb-icon {
      font-size: 48px; color: var(--ix-text-muted); opacity: .4;
    }
    .ix-post-thumb-story {
      position: absolute; top: 10px; left: 10px;
      background: rgba(27,53,135,.85);
      color: #fff;
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px;
      padding: 3px 8px; border-radius: 20px;
      backdrop-filter: blur(4px);
    }
    .ix-post-body { padding: 16px; flex: 1; display: flex; flex-direction: column; }
    .ix-post-title {
      font-size: 14px; font-weight: 700;
      color: var(--ix-text-primary);
      line-height: 1.4; margin-bottom: 6px;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
      transition: color .12s;
    }
    .ix-post-card:hover .ix-post-title { color: var(--ix-accent); }
    .ix-post-excerpt {
      font-size: 12px; color: var(--ix-text-muted);
      line-height: 1.6; flex: 1;
      display: -webkit-box; -webkit-line-clamp: 2;
      -webkit-box-orient: vertical; overflow: hidden;
      margin-bottom: 12px;
    }
    .ix-post-stocks {
      display: flex; flex-wrap: wrap; gap: 4px;
      margin-bottom: 12px;
    }
    .ix-stock-tag {
      font-size: 10px; font-weight: 700;
      padding: 2px 7px; border-radius: 4px;
      border: 1px solid var(--ix-border);
      color: var(--ix-text-secondary);
      background: var(--ix-bg-hover);
      font-family: monospace; letter-spacing: .3px;
      cursor: pointer; transition: all .12s;
    }
    .ix-stock-tag:hover { border-color: var(--ix-accent); color: var(--ix-accent); background: var(--ix-accent-soft); }
    .ix-stock-tag.up   { border-color: rgba(0,166,126,.3); color: var(--ix-success); background: var(--ix-success-soft); }
    .ix-stock-tag.down { border-color: rgba(232,48,74,.3);  color: var(--ix-danger);  background: var(--ix-danger-soft); }
    .ix-post-meta {
      display: flex; align-items: center; justify-content: space-between;
      padding-top: 10px; border-top: 1px solid var(--ix-border);
      font-size: 11px; color: var(--ix-text-muted);
    }
    .ix-post-author { display: flex; align-items: center; gap: 6px; }
    .ix-post-author-avatar {
      width: 22px; height: 22px; border-radius: 50%;
      background: var(--ix-accent-soft);
      color: var(--ix-accent); font-size: 9px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .ix-post-stats { display: flex; gap: 10px; }
    .ix-post-stat { display: flex; align-items: center; gap: 3px; }

    /* ── Hero search banner (from Academy) ─────────────────── */
    .ix-community-hero {
      background: var(--ix-bg-card);
      border: 1px solid var(--ix-border);
      border-radius: var(--ix-radius-lg);
      padding: 28px 32px;
      display: flex; align-items: center;
      justify-content: space-between;
      gap: 24px; flex-wrap: wrap;
      margin-bottom: 24px;
    }
    .ix-hero-left { flex: 1; min-width: 280px; }
    .ix-hero-title {
      font-size: 22px; font-weight: 800;
      color: var(--ix-text-primary); margin-bottom: 4px;
    }
    .ix-hero-sub {
      font-size: 13px; color: var(--ix-text-muted);
      margin-bottom: 16px; line-height: 1.6;
    }
    .ix-hero-search {
      display: flex; gap: 8px; max-width: 480px;
    }
    .ix-hero-icon {
      font-size: 80px; color: var(--ix-accent); opacity: .15;
      flex-shrink: 0; line-height: 1;
    }

    /* ── Story filter tabs ──────────────────────────────────── */
    .ix-story-tabs {
      display: flex; gap: 6px; flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .ix-story-tab {
      display: flex; align-items: center; gap: 5px;
      padding: 6px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 500;
      border: 1px solid var(--ix-border);
      background: none; cursor: pointer;
      color: var(--ix-text-secondary);
      font-family: var(--ix-font);
      transition: all .12s;
      white-space: nowrap;
    }
    .ix-story-tab:hover { border-color: var(--ix-accent); color: var(--ix-accent); }
    .ix-story-tab.active {
      background: var(--ix-accent); border-color: var(--ix-accent);
      color: #fff;
    }
    .ix-story-tab-count {
      background: rgba(255,255,255,.2);
      border-radius: 10px; padding: 0 5px;
      font-size: 10px;
    }
    .ix-story-tab:not(.active) .ix-story-tab-count {
      background: var(--ix-bg-hover);
      color: var(--ix-text-muted);
    }

    /* ── Promo cards (bottom) ───────────────────────────────── */
    .ix-promo-card {
      border-radius: var(--ix-radius-lg);
      padding: 24px;
      display: flex; align-items: center;
      justify-content: space-between; gap: 16px;
      flex-wrap: wrap;
    }
    .ix-promo-primary { background: rgba(27,53,135,.12); border: 1px solid rgba(27,53,135,.2); }
    .ix-promo-orange  { background: rgba(242,101,34,.1);  border: 1px solid rgba(242,101,34,.2); }
    .ix-promo-icon { font-size: 56px; opacity: .25; line-height: 1; }
  </style>
</head>
<body>
<div class="ix-root">
  <div class="ix-layout">
    <!-- Sidebar -->
    <aside class="ix-sidebar">
      <div class="ix-brand">
        <div class="ix-brand-logo"><svg width="18" height="18" viewBox="0 0 32 22" fill="white"><path fill-rule="evenodd" d="M0 0v6.85c0 0-.13 2.16 1.98 3.99L13.69 22l6.09-.08L18.8 9.88l-2.31-2.71L9.24 0H0z"/><path fill-rule="evenodd" d="M7.7 16.44L23.66 0H32v6.88c0 0-.17 2.29-1.34 3.52L19.78 22h-6.09L7.7 16.44z"/></svg></div>
        <span class="ix-brand-name">iFlux</span>
      </div>
      <nav class="ix-menu">
        <a href="index.html" class="ix-menu-item"><i class="ti ti-smart-home ix-menu-icon"></i><span class="ix-menu-label">Dashboard</span></a>
        <div class="ix-menu-header">Cộng đồng</div>
        <div class="ix-menu-item active"><i class="ti ti-layout-grid ix-menu-icon"></i><span class="ix-menu-label">Bài viết</span></div>
        <a href="community-post-detail.html" class="ix-menu-item"><i class="ti ti-article ix-menu-icon"></i><span class="ix-menu-label">Chi tiết bài viết</span></a>
        <a href="chat.html" class="ix-menu-item"><i class="ti ti-messages ix-menu-icon"></i><span class="ix-menu-label">Tin nhắn</span></a>
        <a href="user-profile.html" class="ix-menu-item"><i class="ti ti-user ix-menu-icon"></i><span class="ix-menu-label">Hồ sơ</span></a>
        <div class="ix-menu-header">Chủ đề</div>
        <a href="#" class="ix-menu-item"><i class="ti ti-building-bank ix-menu-icon"></i><span class="ix-menu-label">Ngân hàng</span><span class="ix-menu-badge">12</span></a>
        <a href="#" class="ix-menu-item"><i class="ti ti-building ix-menu-icon"></i><span class="ix-menu-label">Bất động sản</span><span class="ix-menu-badge">8</span></a>
        <a href="#" class="ix-menu-item"><i class="ti ti-device-laptop ix-menu-icon"></i><span class="ix-menu-label">Công nghệ</span><span class="ix-menu-badge">15</span></a>
        <a href="#" class="ix-menu-item"><i class="ti ti-flame ix-menu-icon"></i><span class="ix-menu-label">Dầu khí</span><span class="ix-menu-badge">6</span></a>
      </nav>
    </aside>

    <main class="ix-main">
      <header class="ix-navbar">
        <div class="ix-search"><i class="ti ti-search"></i><input type="text" placeholder="Tìm bài viết, chủ đề, cổ phiếu..." /></div>
        <div class="ix-nav-actions">
          <button class="ix-btn ix-btn-primary ix-btn-sm"><i class="ti ti-pencil" style="font-size:13px"></i> Viết bài</button>
          <button class="ix-nav-btn"><i class="ti ti-bell"></i><span class="ix-nav-dot"></span></button>
          <div class="ix-avatar" style="cursor:pointer">VM</div>
        </div>
      </header>

      <div class="ix-content">
        <!-- Hero banner -->
        <div class="ix-community-hero">
          <div class="ix-hero-left">
            <div class="ix-hero-title">Cộng đồng iFlux 📈</div>
            <div class="ix-hero-sub">Phân tích, chủ đề thị trường và tín hiệu đầu tư từ cộng đồng chuyên gia.<br>Mỗi bài viết gắn với một chủ đề — mỗi chủ đề gắn với cổ phiếu thực.</div>
            <div class="ix-hero-search">
              <input type="search" class="ix-input" placeholder="Tìm chủ đề, mã CP, phân tích..." style="flex:1" />
              <button class="ix-btn ix-btn-primary"><i class="ti ti-search" style="font-size:14px"></i></button>
            </div>
          </div>
          <div class="ix-hero-icon"><i class="ti ti-chart-candle"></i></div>
        </div>

        <!-- Story filter tabs -->
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px">
          <div class="ix-story-tabs" id="story-tabs">
            <button class="ix-story-tab active" data-story="all">Tất cả <span class="ix-story-tab-count">86</span></button>
            <button class="ix-story-tab" data-story="ai">🤖 AI Việt Nam <span class="ix-story-tab-count">15</span></button>
            <button class="ix-story-tab" data-story="bank">🏦 Tăng vốn NH <span class="ix-story-tab-count">12</span></button>
            <button class="ix-story-tab" data-story="ev">🔋 EV xe điện <span class="ix-story-tab-count">9</span></button>
            <button class="ix-story-tab" data-story="bds">🏘 Căn hộ TP.HCM <span class="ix-story-tab-count">8</span></button>
            <button class="ix-story-tab" data-story="fdi">🌐 FDI 2026 <span class="ix-story-tab-count">7</span></button>
            <button class="ix-story-tab" data-story="steel">⚙️ Xuất khẩu thép <span class="ix-story-tab-count">6</span></button>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-shrink:0">
            <select class="ix-input ix-select" style="width:auto;font-size:12px;padding:6px 10px">
              <option>Mới nhất</option>
              <option>Phổ biến nhất</option>
              <option>Nhiều bình luận</option>
              <option>Được yêu thích</option>
            </select>
            <label class="ix-auth-check" style="font-size:12px;white-space:nowrap">
              <input type="checkbox" class="ix-checkbox" /> Chỉ Pro
            </label>
          </div>
        </div>

        <!-- Post grid -->
        <div class="ix-grid ix-grid-3 ix-mb-24" id="post-grid">

          <!-- Post 1 -->
          <div class="ix-card ix-post-card" onclick="location.href='community-post-detail.html'">
            <div class="ix-post-thumb">
              <i class="ti ti-chart-candle ix-post-thumb-icon"></i>
              <span class="ix-post-thumb-story">🤖 AI Việt Nam</span>
              <div style="position:absolute;top:10px;right:10px"><span class="ix-chip ix-chip-primary" style="font-size:10px;padding:2px 7px">Pro</span></div>
            </div>
            <div class="ix-post-body">
              <div class="ix-post-title">FPT và cuộc đua AI: Định giá bao nhiêu là hợp lý khi chủ đề còn dài?</div>
              <div class="ix-post-excerpt">Với doanh thu AI vượt 2,000 tỷ trong Q1, FPT đang được market định giá PE 35x. Phân tích DCF thuần túy cho thấy chủ đề này có thể còn xa hơn nhiều...</div>
              <div class="ix-post-stocks">
                <span class="ix-stock-tag up">FPT +2.1%</span>
                <span class="ix-stock-tag">FPT-IS</span>
                <span class="ix-stock-tag">VNG</span>
              </div>
              <div class="ix-post-meta">
                <div class="ix-post-author">
                  <div class="ix-post-author-avatar">TN</div>
                  <span>Trần Nguyên</span>
                  <span>·</span><span>2h trước</span>
                </div>
                <div class="ix-post-stats">
                  <div class="ix-post-stat"><i class="ti ti-heart" style="font-size:13px;color:var(--ix-danger)"></i> 142</div>
                  <div class="ix-post-stat"><i class="ti ti-message-circle" style="font-size:13px;color:var(--ix-text-muted)"></i> 38</div>
                  <div class="ix-post-stat"><i class="ti ti-share" style="font-size:13px;color:var(--ix-text-muted)"></i> 21</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Post 2 -->
          <div class="ix-card ix-post-card" onclick="location.href='community-post-detail.html'">
            <div class="ix-post-thumb" style="background:rgba(0,166,126,.08)">
              <i class="ti ti-building-bank ix-post-thumb-icon" style="color:var(--ix-success)"></i>
              <span class="ix-post-thumb-story">🏦 Tăng vốn NH</span>
            </div>
            <div class="ix-post-body">
              <div class="ix-post-title">VCB tăng vốn 83,557 tỷ: Ai hưởng lợi nhất trong hệ sinh thái Vietcombank?</div>
              <div class="ix-post-excerpt">Kế hoạch tăng vốn của VCB không chỉ tác động đến cổ đông hiện hữu. Nhìn sâu vào danh mục cho vay và tỷ lệ NIM có thể thấy...</div>
              <div class="ix-post-stocks">
                <span class="ix-stock-tag up">VCB +1.3%</span>
                <span class="ix-stock-tag">CTG</span>
                <span class="ix-stock-tag down">BID -0.5%</span>
              </div>
              <div class="ix-post-meta">
                <div class="ix-post-author">
                  <div class="ix-post-author-avatar" style="background:var(--ix-success-soft);color:var(--ix-success)">LM</div>
                  <span>Lê Minh</span>
                  <span>·</span><span>5h trước</span>
                </div>
                <div class="ix-post-stats">
                  <div class="ix-post-stat"><i class="ti ti-heart-filled" style="font-size:13px;color:var(--ix-danger)"></i> 89</div>
                  <div class="ix-post-stat"><i class="ti ti-message-circle" style="font-size:13px;color:var(--ix-text-muted)"></i> 24</div>
                  <div class="ix-post-stat"><i class="ti ti-share" style="font-size:13px;color:var(--ix-text-muted)"></i> 15</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Post 3 -->
          <div class="ix-card ix-post-card" onclick="location.href='community-post-detail.html'">
            <div class="ix-post-thumb" style="background:rgba(255,171,0,.08)">
              <i class="ti ti-car ix-post-thumb-icon" style="color:var(--ix-warning)"></i>
              <span class="ix-post-thumb-story">🔋 EV xe điện</span>
              <div style="position:absolute;top:10px;right:10px"><span class="ix-chip ix-chip-primary" style="font-size:10px;padding:2px 7px">Pro</span></div>
            </div>
            <div class="ix-post-body">
              <div class="ix-post-title">VinFast sau khi mất 85% giá trị: Bẫy giá rẻ hay cơ hội thật sự?</div>
              <div class="ix-post-excerpt">VFS từ $93 xuống dưới $4 trong 18 tháng. Dòng tiền âm 2.4 tỷ USD. Nhưng đơn đặt hàng 2026 vẫn tăng 40%. Đây là bài toán khó...</div>
              <div class="ix-post-stocks">
                <span class="ix-stock-tag down">VFS -3.2%</span>
                <span class="ix-stock-tag">VHM</span>
              </div>
              <div class="ix-post-meta">
                <div class="ix-post-author">
                  <div class="ix-post-author-avatar" style="background:var(--ix-warning-soft);color:var(--ix-warning)">PK</div>
                  <span>Phạm Khoa</span>
                  <span>·</span><span>1 ngày</span>
                </div>
                <div class="ix-post-stats">
                  <div class="ix-post-stat"><i class="ti ti-heart" style="font-size:13px;color:var(--ix-danger)"></i> 214</div>
                  <div class="ix-post-stat"><i class="ti ti-message-circle" style="font-size:13px;color:var(--ix-text-muted)"></i> 67</div>
                  <div class="ix-post-stat"><i class="ti ti-share" style="font-size:13px;color:var(--ix-text-muted)"></i> 44</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Post 4 -->
          <div class="ix-card ix-post-card" onclick="location.href='community-post-detail.html'">
            <div class="ix-post-thumb" style="background:rgba(3,195,236,.08)">
              <i class="ti ti-building ix-post-thumb-icon" style="color:var(--ix-info)"></i>
              <span class="ix-post-thumb-story">🏘 Căn hộ TP.HCM</span>
            </div>
            <div class="ix-post-body">
              <div class="ix-post-title">Nghị quyết tháo gỡ pháp lý BĐS: 5 doanh nghiệp hưởng lợi trực tiếp nhất</div>
              <div class="ix-post-excerpt">Sau khi Nghị quyết 18-NQ/TW được thông qua, danh mục pháp lý của VHM, NVL, KDH đang được "unblock" dần. Mô hình định giá NAV...</div>
              <div class="ix-post-stocks">
                <span class="ix-stock-tag up">VHM +3.8%</span>
                <span class="ix-stock-tag up">NVL +5.2%</span>
                <span class="ix-stock-tag up">KDH +1.9%</span>
                <span class="ix-stock-tag">DXG</span>
              </div>
              <div class="ix-post-meta">
                <div class="ix-post-author">
                  <div class="ix-post-author-avatar" style="background:var(--ix-info-soft);color:var(--ix-info)">HT</div>
                  <span>Hoàng Thanh</span>
                  <span>·</span><span>2 ngày</span>
                </div>
                <div class="ix-post-stats">
                  <div class="ix-post-stat"><i class="ti ti-heart" style="font-size:13px;color:var(--ix-danger)"></i> 178</div>
                  <div class="ix-post-stat"><i class="ti ti-message-circle" style="font-size:13px;color:var(--ix-text-muted)"></i> 52</div>
                  <div class="ix-post-stat"><i class="ti ti-share" style="font-size:13px;color:var(--ix-text-muted)"></i> 33</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Post 5 -->
          <div class="ix-card ix-post-card" onclick="location.href='community-post-detail.html'">
            <div class="ix-post-thumb" style="background:rgba(232,48,74,.08)">
              <i class="ti ti-flame ix-post-thumb-icon" style="color:var(--ix-danger)"></i>
              <span class="ix-post-thumb-story">⚙️ Xuất khẩu thép</span>
            </div>
            <div class="ix-post-body">
              <div class="ix-post-title">Hòa Phát và chu kỳ thép: Tại sao đây vẫn là trade ngắn hạn chứ chưa phải dài hạn</div>
              <div class="ix-post-excerpt">HPG đang hưởng lợi từ spread thép-coke giãn rộng. Nhưng capacity Dung Quất 2 thêm 4.6 triệu tấn vào H2/2025 có thể đổi chiều...</div>
              <div class="ix-post-stocks">
                <span class="ix-stock-tag down">HPG -0.8%</span>
                <span class="ix-stock-tag">NKG</span>
                <span class="ix-stock-tag">HSG</span>
              </div>
              <div class="ix-post-meta">
                <div class="ix-post-author">
                  <div class="ix-post-author-avatar" style="background:var(--ix-danger-soft);color:var(--ix-danger)">AN</div>
                  <span>Anh Nguyên</span>
                  <span>·</span><span>3 ngày</span>
                </div>
                <div class="ix-post-stats">
                  <div class="ix-post-stat"><i class="ti ti-heart-filled" style="font-size:13px;color:var(--ix-danger)"></i> 96</div>
                  <div class="ix-post-stat"><i class="ti ti-message-circle" style="font-size:13px;color:var(--ix-text-muted)"></i> 31</div>
                  <div class="ix-post-stat"><i class="ti ti-share" style="font-size:13px;color:var(--ix-text-muted)"></i> 18</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Post 6 -->
          <div class="ix-card ix-post-card" onclick="location.href='community-post-detail.html'">
            <div class="ix-post-thumb" style="background:rgba(27,53,135,.08)">
              <i class="ti ti-world ix-post-thumb-icon" style="color:var(--ix-accent)"></i>
              <span class="ix-post-thumb-story">🌐 FDI 2026</span>
            </div>
            <div class="ix-post-body">
              <div class="ix-post-title">Samsung rót thêm $4 tỷ vào Thái Nguyên: Chuỗi cung ứng nào được kéo theo?</div>
              <div class="ix-post-excerpt">Vệ tinh của Samsung tại Việt Nam có 14 nhà cung ứng niêm yết. SVC, IMP, PLC đang lọt vào vùng mua theo mô hình tăng trưởng...</div>
              <div class="ix-post-stocks">
                <span class="ix-stock-tag up">SVC +4.1%</span>
                <span class="ix-stock-tag">PLC</span>
                <span class="ix-stock-tag up">IMP +1.2%</span>
              </div>
              <div class="ix-post-meta">
                <div class="ix-post-author">
                  <div class="ix-post-author-avatar">VL</div>
                  <span>Violet Long</span>
                  <span>·</span><span>4 ngày</span>
                </div>
                <div class="ix-post-stats">
                  <div class="ix-post-stat"><i class="ti ti-heart" style="font-size:13px;color:var(--ix-danger)"></i> 134</div>
                  <div class="ix-post-stat"><i class="ti ti-message-circle" style="font-size:13px;color:var(--ix-text-muted)"></i> 45</div>
                  <div class="ix-post-stat"><i class="ti ti-share" style="font-size:13px;color:var(--ix-text-muted)"></i> 29</div>
                </div>
              </div>
            </div>
          </div>

        </div><!-- /post-grid -->

        <!-- Pagination -->
        <div class="ix-pagination ix-mb-24">
          <span class="ix-pagination-info">Hiển thị 1–6 / 86 bài viết</span>
          <button class="ix-page-btn" disabled><i class="ti ti-chevron-left" style="font-size:13px"></i></button>
          <button class="ix-page-btn active">1</button>
          <button class="ix-page-btn">2</button>
          <button class="ix-page-btn">3</button>
          <span style="color:var(--ix-text-muted);padding:0 4px;font-size:13px">...</span>
          <button class="ix-page-btn">15</button>
          <button class="ix-page-btn"><i class="ti ti-chevron-right" style="font-size:13px"></i></button>
        </div>

        <!-- Promo cards (bottom, from Academy) -->
        <div class="ix-grid ix-grid-2">
          <div class="ix-promo-card ix-promo-primary">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--ix-accent);margin-bottom:6px">Trở thành Creator Pro</div>
              <div style="font-size:13px;color:var(--ix-text-secondary);margin-bottom:16px;line-height:1.6">Đăng ký Pro để viết phân tích chuyên sâu, gắn tín hiệu cổ phiếu và nhận hoa hồng affiliate từ bài viết của bạn.</div>
              <button class="ix-btn ix-btn-primary ix-btn-sm" onclick="ixToast('Đang chuyển đến trang nâng cấp...','info')">Nâng cấp Pro →</button>
            </div>
            <div class="ix-promo-icon"><i class="ti ti-crown" style="color:var(--ix-accent)"></i></div>
          </div>
          <div class="ix-promo-card ix-promo-orange">
            <div>
              <div style="font-size:15px;font-weight:700;color:var(--iflux-orange);margin-bottom:6px">Bài viết nổi bật tuần</div>
              <div style="font-size:13px;color:var(--ix-text-secondary);margin-bottom:16px;line-height:1.6">Top 10 bài viết được yêu thích và chia sẻ nhiều nhất. Cập nhật hàng tuần dựa trên tương tác cộng đồng.</div>
              <button class="ix-btn ix-btn-sm" style="background:var(--iflux-orange);color:#fff;border:none" onclick="ixToast('Đang tải bảng xếp hạng...','success')">Xem bảng xếp hạng →</button>
            </div>
            <div class="ix-promo-icon"><i class="ti ti-trophy" style="color:var(--iflux-orange)"></i></div>
          </div>
        </div>

      </div><!-- /content -->
    </main>
  </div>
</div>

<script src="iflux-admin-ui.js"></script>
<script src="supplement.js"></script>
<script>
// Story tab filter
document.querySelectorAll('.ix-story-tab').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.ix-story-tab').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    ixToast('Lọc: ' + btn.textContent.trim().split('\n')[0], 'info');
  });
});
</script>
</body>
</html>
HTMLEOF
echo "post-list done"
Output

post-list done