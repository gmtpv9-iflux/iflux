'use strict';

/**
 * Mapping Danh mục iFlux ↔ RSS nguồn (đồng bộ với Admin rss-catalog.js).
 * Chỉ các feed status=active.
 */
module.exports = {
  PROVIDER_NAMES: {
    cafef: 'CafeF',
    vietstock: 'VietStock',
    baodautu: 'Báo Đầu Tư'
  },
  MAPPINGS: [
    {
      id: 'map-tin-thi-truong',
      ifluxCategorySlug: 'tin-thi-truong',
      ifluxCategory: 'Tin thị trường',
      providerId: 'cafef',
      sourceCategory: 'Thị trường chứng khoán',
      rssUrl: 'https://cafef.vn/thi-truong-chung-khoan.rss'
    },
    {
      id: 'map-doanh-nghiep',
      ifluxCategorySlug: 'doanh-nghiep',
      ifluxCategory: 'Doanh nghiệp',
      providerId: 'cafef',
      sourceCategory: 'Doanh nghiệp',
      rssUrl: 'https://cafef.vn/doanh-nghiep.rss'
    },
    {
      id: 'map-ngan-hang',
      ifluxCategorySlug: 'ngan-hang',
      ifluxCategory: 'Ngân hàng',
      providerId: 'cafef',
      sourceCategory: 'Tài chính - ngân hàng',
      rssUrl: 'https://cafef.vn/tai-chinh-ngan-hang.rss'
    },
    {
      id: 'map-kinh-te-vi-mo',
      ifluxCategorySlug: 'kinh-te-vi-mo',
      ifluxCategory: 'Kinh tế vĩ mô',
      providerId: 'cafef',
      sourceCategory: 'Kinh tế vĩ mô - Đầu tư',
      rssUrl: 'https://cafef.vn/vi-mo-dau-tu.rss'
    },
    {
      id: 'map-dau-tu-cong',
      ifluxCategorySlug: 'dau-tu-cong-chinh-sach',
      ifluxCategory: 'Đầu tư công & Chính sách',
      providerId: 'vietstock',
      sourceCategory: 'Chính sách',
      rssUrl: 'https://vietstock.vn/143/chung-khoan/chinh-sach.rss'
    },
    {
      id: 'map-phan-tich-y-kien',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      ifluxCategory: 'Phân tích & Nhận định',
      providerId: 'vietstock',
      sourceCategory: 'Ý kiến chuyên gia',
      rssUrl: 'https://vietstock.vn/145/chung-khoan/y-kien-chuyen-gia.rss'
    },
    {
      id: 'map-phan-tich-thi-truong',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      ifluxCategory: 'Phân tích & Nhận định',
      providerId: 'vietstock',
      sourceCategory: 'Nhận định thị trường',
      rssUrl: 'https://vietstock.vn/1636/nhan-dinh-phan-tich/nhan-dinh-thi-truong.rss'
    },
    {
      id: 'map-phan-tich-co-ban',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      ifluxCategory: 'Phân tích & Nhận định',
      providerId: 'vietstock',
      sourceCategory: 'Phân tích cơ bản',
      rssUrl: 'https://vietstock.vn/582/nhan-dinh-phan-tich/phan-tich-co-ban.rss'
    },
    {
      id: 'map-phan-tich-ky-thuat',
      ifluxCategorySlug: 'phan-tich-nhan-dinh',
      ifluxCategory: 'Phân tích & Nhận định',
      providerId: 'vietstock',
      sourceCategory: 'Phân tích kỹ thuật',
      rssUrl: 'https://vietstock.vn/585/nhan-dinh-phan-tich/phan-tich-ky-thuat.rss'
    },
    {
      id: 'map-etf',
      ifluxCategorySlug: 'etf-quy-dau-tu',
      ifluxCategory: 'ETF & Quỹ đầu tư',
      providerId: 'vietstock',
      sourceCategory: 'ETF và các quỹ',
      rssUrl: 'https://vietstock.vn/3358/chung-khoan/etf-va-cac-quy.rss'
    },
    {
      id: 'map-phai-sinh',
      ifluxCategorySlug: 'phai-sinh',
      ifluxCategory: 'Phái sinh',
      providerId: 'vietstock',
      sourceCategory: 'Chứng khoán phái sinh',
      rssUrl: 'https://vietstock.vn/4186/chung-khoan/chung-khoan-phai-sinh.rss'
    },
    {
      id: 'map-chung-quyen',
      ifluxCategorySlug: 'chung-quyen',
      ifluxCategory: 'Chứng quyền',
      providerId: 'vietstock',
      sourceCategory: 'Chứng quyền',
      rssUrl: 'https://vietstock.vn/4308/chung-khoan/chung-quyen.rss'
    },
    {
      id: 'map-trai-phieu',
      ifluxCategorySlug: 'trai-phieu',
      ifluxCategory: 'Trái phiếu',
      providerId: 'vietstock',
      sourceCategory: 'Trái phiếu',
      rssUrl: 'https://vietstock.vn/785/chung-khoan/thi-truong-trai-phieu.rss'
    },
    {
      id: 'map-ma-tang-von',
      ifluxCategorySlug: 'ma-ipo-tang-von',
      ifluxCategory: 'M&A / IPO / Tăng vốn',
      providerId: 'vietstock',
      sourceCategory: 'Tăng vốn - M&A',
      rssUrl: 'https://vietstock.vn/764/doanh-nghiep/tang-von-m-a.rss'
    },
    {
      id: 'map-ma-ipo',
      ifluxCategorySlug: 'ma-ipo-tang-von',
      ifluxCategory: 'M&A / IPO / Tăng vốn',
      providerId: 'vietstock',
      sourceCategory: 'IPO - Cổ phần hóa',
      rssUrl: 'https://vietstock.vn/746/doanh-nghiep/ipo-co-phan-hoa.rss'
    },
    {
      id: 'map-hang-hoa',
      ifluxCategorySlug: 'hang-hoa',
      ifluxCategory: 'Hàng hóa',
      providerId: 'vietstock',
      sourceCategory: 'Hàng hóa',
      rssUrl: 'https://vietstock.vn/2/hang-hoa.rss'
    },
    {
      id: 'map-tai-chinh-ca-nhan',
      ifluxCategorySlug: 'tai-chinh-ca-nhan',
      ifluxCategory: 'Tài chính cá nhân',
      providerId: 'vietstock',
      sourceCategory: 'Tài chính cá nhân',
      rssUrl: 'https://vietstock.vn/4259/tai-chinh-ca-nhan.rss'
    },
    {
      id: 'map-kinh-te-quoc-te',
      ifluxCategorySlug: 'kinh-te-quoc-te',
      ifluxCategory: 'Kinh tế quốc tế',
      providerId: 'cafef',
      sourceCategory: 'Tài chính quốc tế',
      rssUrl: 'https://cafef.vn/tai-chinh-quoc-te.rss'
    },
    {
      id: 'map-bat-dong-san',
      ifluxCategorySlug: 'bat-dong-san',
      ifluxCategory: 'Bất động sản',
      providerId: 'cafef',
      sourceCategory: 'Bất động sản',
      rssUrl: 'https://cafef.vn/bat-dong-san.rss'
    }
  ]
};
