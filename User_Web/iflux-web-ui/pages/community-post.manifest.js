/**
 * Page Manifest — Bài viết cộng đồng (/cong-dong/bai-viet)
 */
export default {
  pageKey: 'communityPost',
  path: '/cong-dong/bai-viet',
  title: 'Bài viết cộng đồng',
  documentTitle: '',
  composite: true,
  sections: [{ key: 'main', label: 'Nội dung chính', visible: true, layout: 'stack' }],
  widgets: [{
    id: 'WGT-COM-POST-PAGE',
    title: 'Bài viết cộng đồng',
    section: 'main',
    position: 0,
    span: 12,
    enabled: true,
    locked: true,
    lazyModule: '/User_Web/iflux-web-ui/widgets/community-post-page/index.js?v=comQuoteRuntime20260809',
    css: [
      '/User_Web/iflux-web-ui/community.css?v=bodyFill20260809',
      '/User_Web/iflux-web-ui/block-templates.css'
    ]
  }]
};
