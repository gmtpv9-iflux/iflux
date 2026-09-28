/**
 * Page Manifest — Cộng đồng (/community)
 * Composite: 1 widget "page" tự dựng layout feed + widget dedicated bên trong.
 * Widget dedicated (SoT Product Composition): WGT-NEWS-001, WGT-NEWS-TOPIC-TOP,
 * WGT-MKT-006, WGT-NEWS-002 — render trong composite theo đúng entitlement/block gate.
 */

export default {
  pageKey: 'news',
  /* App Shell: class <main> + CSS riêng của trang (nạp khi vào trang — tải đầy đủ lẫn điều hướng mềm). */
  mainClass: 'ifx-main--community',
  css: [],
  path: '/tin-tuc',
  title: 'Tin tức',
  intro: 'Tin tức, bài viết chuyên gia và thảo luận từ cộng đồng nhà đầu tư — cập nhật theo mã, ngành và chủ đề bạn quan tâm.',
  documentTitle: '',
  composite: true,
  sections: [
    { key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }
  ],
  widgets: [
    {
      id: 'WGT-NEWS-PAGE',
      title: 'Tin tức',
      section: 'main',
      position: 0,
      span: 12,
      enabled: true,
      locked: true,
      lazyModule: '/User_Web/iflux-web-ui/widgets/news-page/index.js?v=r20260928q',
      /* Chỉ CSS của feed tin (news.css tự đủ cho card tin). widget-shell / block-templates không có
         quy tắc nào dùng trên trang này — không nạp. Heart CSS = Foundation trong gói global. */
      css: ['/User_Web/iflux-web-ui/news.css?v=r20260928n']
    }
  ]
};
