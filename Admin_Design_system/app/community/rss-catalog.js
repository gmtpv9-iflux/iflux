/* ADM-COM-RSS — Catalog Nguồn RSS / Đồng bộ danh mục / Cấu trúc bài viết */
(function (global) {
  'use strict';
  if (global.IfluxRssCatalog) return;

  var PROVIDERS = [
    {
      id: 'cafef',
      name: 'CafeF',
      description: 'Nguồn tin tài chính · chứng khoán · doanh nghiệp (cafef.vn). RSS chuyên mục ổn định.',
      website: 'https://cafef.vn',
      rssIndex: 'https://cafef.vn/rss.chn',
      status: 'active'
    },
    {
      id: 'vietstock',
      name: 'VietStock',
      description: 'Nguồn nhận định · phái sinh · ETF · trái phiếu · hàng hóa (vietstock.vn).',
      website: 'https://vietstock.vn',
      rssIndex: 'https://vietstock.vn/rss',
      status: 'active'
    },
    {
      id: 'baodautu',
      name: 'Báo Đầu Tư',
      description: 'Nguồn vĩ mô · chính sách · quốc tế · địa ốc (baodautu.vn). Channel RSS có URL nhưng hiện đang trống tin — tạm không map danh mục iFlux.',
      website: 'https://baodautu.vn',
      rssIndex: 'https://baodautu.vn/rssMain.html',
      status: 'warning'
    }
  ];

  /**
   * status:
   *  - active: URL hợp lệ và feed có <item>
   *  - empty: URL tồn tại nhưng 0 item (không lấy được tin qua RSS)
   *  - inactive: tắt mapping
   */
  var CATEGORY_MAPPINGS = [
    {
      id: 'map-tin-thi-truong',
      ifluxCategory: 'Tin thị trường',
      ifluxCategorySlug: 'tin-thi-truong',
      providerId: 'cafef',
      providerName: 'CafeF',
      sourceCategory: 'Thị trường chứng khoán',
      rssUrl: 'https://cafef.vn/thi-truong-chung-khoan.rss',
      status: 'active',
      itemCountHint: 50
    },
    {
      id: 'map-doanh-nghiep',
      ifluxCategory: 'Doanh nghiệp',
      ifluxCategorySlug: 'doanh-nghiep',
      providerId: 'cafef',
      providerName: 'CafeF',
      sourceCategory: 'Doanh nghiệp',
      rssUrl: 'https://cafef.vn/doanh-nghiep.rss',
      status: 'active',
      itemCountHint: 50
    },
    {
      id: 'map-ngan-hang',
      ifluxCategory: 'Ngân hàng',
      ifluxCategorySlug: 'ngan-hang',
      providerId: 'cafef',
      providerName: 'CafeF',
      sourceCategory: 'Tài chính - ngân hàng',
      rssUrl: 'https://cafef.vn/tai-chinh-ngan-hang.rss',
      status: 'active',
      itemCountHint: 50
    },
    {
      id: 'map-kinh-te-vi-mo',
      ifluxCategory: 'Kinh tế vĩ mô',
      ifluxCategorySlug: 'kinh-te-vi-mo',
      providerId: 'cafef',
      providerName: 'CafeF',
      sourceCategory: 'Kinh tế vĩ mô - Đầu tư',
      rssUrl: 'https://cafef.vn/vi-mo-dau-tu.rss',
      status: 'active',
      itemCountHint: 50,
      note: 'Thay Báo Đầu Tư (RSS trống). CafeF khớp chuyên mục hơn VietStock Vĩ mô.'
    },
    {
      id: 'map-dau-tu-cong',
      ifluxCategory: 'Đầu tư công & Chính sách',
      ifluxCategorySlug: 'dau-tu-cong-chinh-sach',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Chính sách',
      rssUrl: 'https://vietstock.vn/143/chung-khoan/chinh-sach.rss',
      status: 'active',
      itemCountHint: 20,
      note: 'Thay Báo Đầu Tư (RSS trống). CafeF không có chuyên mục Chính sách riêng.'
    },
    {
      id: 'map-phan-tich-y-kien',
      ifluxCategory: 'Phân tích & Nhận định',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Ý kiến chuyên gia',
      rssUrl: 'https://vietstock.vn/145/chung-khoan/y-kien-chuyen-gia.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-phan-tich-thi-truong',
      ifluxCategory: 'Phân tích & Nhận định',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Nhận định thị trường',
      rssUrl: 'https://vietstock.vn/1636/nhan-dinh-phan-tich/nhan-dinh-thi-truong.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-phan-tich-co-ban',
      ifluxCategory: 'Phân tích & Nhận định',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Phân tích cơ bản',
      rssUrl: 'https://vietstock.vn/582/nhan-dinh-phan-tich/phan-tich-co-ban.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-phan-tich-ky-thuat',
      ifluxCategory: 'Phân tích & Nhận định',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Phân tích kỹ thuật',
      rssUrl: 'https://vietstock.vn/585/nhan-dinh-phan-tich/phan-tich-ky-thuat.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-etf',
      ifluxCategory: 'ETF & Quỹ đầu tư',
      ifluxCategorySlug: 'etf-quy-dau-tu',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'ETF và các quỹ',
      rssUrl: 'https://vietstock.vn/3358/chung-khoan/etf-va-cac-quy.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-phai-sinh',
      ifluxCategory: 'Phái sinh',
      ifluxCategorySlug: 'phai-sinh',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Chứng khoán phái sinh',
      rssUrl: 'https://vietstock.vn/4186/chung-khoan/chung-khoan-phai-sinh.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-chung-quyen',
      ifluxCategory: 'Chứng quyền',
      ifluxCategorySlug: 'chung-quyen',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Chứng quyền',
      rssUrl: 'https://vietstock.vn/4308/chung-khoan/chung-quyen.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-trai-phieu',
      ifluxCategory: 'Trái phiếu',
      ifluxCategorySlug: 'trai-phieu',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Trái phiếu',
      rssUrl: 'https://vietstock.vn/785/chung-khoan/thi-truong-trai-phieu.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-ma-tang-von',
      ifluxCategory: 'M&A / IPO / Tăng vốn',
      ifluxCategorySlug: 'ma-ipo-tang-von',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Tăng vốn - M&A',
      rssUrl: 'https://vietstock.vn/764/doanh-nghiep/tang-von-m-a.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-ma-ipo',
      ifluxCategory: 'M&A / IPO / Tăng vốn',
      ifluxCategorySlug: 'ma-ipo-tang-von',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'IPO - Cổ phần hóa',
      rssUrl: 'https://vietstock.vn/746/doanh-nghiep/ipo-co-phan-hoa.rss',
      status: 'active',
      itemCountHint: 20
    },
    {
      id: 'map-hang-hoa',
      ifluxCategory: 'Hàng hóa',
      ifluxCategorySlug: 'hang-hoa',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Hàng hóa',
      rssUrl: 'https://vietstock.vn/2/hang-hoa.rss',
      status: 'active',
      itemCountHint: 30
    },
    {
      id: 'map-tai-chinh-ca-nhan',
      ifluxCategory: 'Tài chính cá nhân',
      ifluxCategorySlug: 'tai-chinh-ca-nhan',
      providerId: 'vietstock',
      providerName: 'VietStock',
      sourceCategory: 'Tài chính cá nhân',
      rssUrl: 'https://vietstock.vn/4259/tai-chinh-ca-nhan.rss',
      status: 'active',
      itemCountHint: 30
    },
    {
      id: 'map-kinh-te-quoc-te',
      ifluxCategory: 'Kinh tế quốc tế',
      ifluxCategorySlug: 'kinh-te-quoc-te',
      providerId: 'cafef',
      providerName: 'CafeF',
      sourceCategory: 'Tài chính quốc tế',
      rssUrl: 'https://cafef.vn/tai-chinh-quoc-te.rss',
      status: 'active',
      itemCountHint: 50,
      note: 'Thay Báo Đầu Tư (RSS trống). VietStock Thế giới cũng dùng được nếu cần bổ sung.'
    },
    {
      id: 'map-bat-dong-san',
      ifluxCategory: 'Bất động sản',
      ifluxCategorySlug: 'bat-dong-san',
      providerId: 'cafef',
      providerName: 'CafeF',
      sourceCategory: 'Bất động sản',
      rssUrl: 'https://cafef.vn/bat-dong-san.rss',
      status: 'active',
      itemCountHint: 50,
      note: 'Thay Báo Đầu Tư (RSS trống). CafeF BĐS ổn định hơn; VietStock có feed dự phòng.'
    }
  ];

  /**
   * ARTICLE_FIELD_MAP — ĐÃ GỠ (2026-08-10).
   * SoT schema bài = community_rss_schema (DB) qua GET /admin/metadata/rss-article-schema.
   * Contract key: backend/src/modules/community/community-article-schema-fields.js
   * Trang: rss-article-schema-page.js → GET /admin/community-ops/rss-article-schema
   */

  function statusLabel(code) {
    if (code === 'active') return 'Đang hoạt động';
    if (code === 'empty') return 'RSS trống';
    if (code === 'warning') return 'Cảnh báo';
    if (code === 'inactive') return 'Tắt';
    return code || '—';
  }

  function statusChipClass(code) {
    if (code === 'active') return 'ix-chip ix-chip-success';
    if (code === 'empty' || code === 'warning') return 'ix-chip ix-chip-warning';
    if (code === 'inactive') return 'ix-chip';
    return 'ix-chip';
  }

  global.IfluxRssCatalog = {
    PROVIDERS: PROVIDERS,
    CATEGORY_MAPPINGS: CATEGORY_MAPPINGS,
    statusLabel: statusLabel,
    statusChipClass: statusChipClass
  };
})(typeof window !== 'undefined' ? window : this);
