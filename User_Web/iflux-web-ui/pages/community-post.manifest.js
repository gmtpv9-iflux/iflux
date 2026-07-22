/**
 * Page Manifest — Bài viết cộng đồng (/cong-dong/bai-viet)
 */
export default {
  pageKey: 'communityPost',
  path: '/cong-dong/bai-viet',
  title: 'Bài viết cộng đồng',
  documentTitle: 'Bài viết · iFlux',
  renderPageHead: false,
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
    lazyModule: '/User_Web/iflux-web-ui/widgets/community-post-page/index.js?v=phaseCW120260721c',
    css: [
      '/User_Web/iflux-web-ui/community.css',
      '/User_Web/iflux-web-ui/block-templates.css'
    ]
  }]
};
