/**
 * Page Manifest — Thị trường (/market)
 * Host sidebar/main trống mặc định; widget không đặc thù chỉ qua PagePublished Placement.
 */

export default {
  pageKey: 'market',
  path: '/thi-truong',
  title: 'Thị trường',
  intro: 'Tổng quan thị trường.',
  documentTitle: '',
  sections: [
    { key: 'sidebar', label: 'Sidebar thị trường', visible: true, layout: 'stack' },
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'grid-12' }
  ],
  /* Widget chỉ qua Widget Placement (PagePublished) — không slot tĩnh. */
  widgets: []
};
