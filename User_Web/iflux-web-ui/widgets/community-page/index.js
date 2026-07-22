/**
 * WGT-COM-PAGE — Composite Cộng đồng
 *
 * Phase C W3: Feature Manifest + Runtime (NOT_LOADED→READY→DISPOSED).
 * W1/W2: Shell owns templates + market platform — không trong modules[].
 */
import { createFeatureRuntime } from '../../runtime/feature-runtime.js?v=phaseCW5gate20260721';
import { mountPublishedWidgets } from '../../runtime/mount-published-widgets.js?v=phase4Pub20260716b';
import featureManifest from '../../features/community.manifest.js?v=phaseCW5gate20260721';

export const meta = { id: 'WGT-COM-PAGE', title: 'Cộng đồng' };

var featureRt = null;

async function mountFromHostTree(root) {
  if (!root || !window.IfluxPageLayoutEngine) {
    if (window.console && console.warn) {
      console.warn('[WGT-COM-PAGE] thiếu Layout Engine');
    }
    if (window.IfluxCommunityPage && IfluxCommunityPage.syncEmptyHostChrome) {
      IfluxCommunityPage.syncEmptyHostChrome(root);
    }
    return;
  }
  var tree = await IfluxPageLayoutEngine.buildHostTree(root, 'community');
  if (window.IfluxBlockGate && IfluxBlockGate.apply) IfluxBlockGate.apply('community');

  if (tree && tree.length) {
    await mountPublishedWidgets(tree, { logPrefix: '[WGT-COM-PAGE]' });
  } else if (window.console && console.warn) {
    console.warn('[WGT-COM-PAGE] Host Tree rỗng — chưa có placements Published');
  }

  if (window.IfluxCommunityPage && IfluxCommunityPage.syncEmptyHostChrome) {
    IfluxCommunityPage.syncEmptyHostChrome(root);
  }
}

function isCollectionIndexPath() {
  var path = String((typeof location !== 'undefined' && location.pathname) || '').replace(/\/+$/, '') || '/';
  return path === '/cong-dong/chu-de' ||
    path === '/cong-dong/tac-gia' ||
    path === '/cong-dong/danh-muc';
}

function applyCommunity(root) {
  if (window.IfluxCommunityPage && IfluxCommunityPage.init) IfluxCommunityPage.init();
  if (window.IfluxInsightShare && IfluxInsightShare.patchAll) IfluxInsightShare.patchAll(root || document);
}

export async function mount(el) {
  el.innerHTML = '<div data-ifx-community-feed></div>';
  featureRt = createFeatureRuntime(featureManifest);
  await featureRt.boot({
    init: function () {
      /* modules đã nạp — sync shell UI nếu cần */
      if (window.IfluxWebUI && IfluxWebUI.syncTopnav) IfluxWebUI.syncTopnav();
    }
  });

  var indexOnly = isCollectionIndexPath();
  function onPlans() {
    applyCommunity(el);
    if (!indexOnly) mountFromHostTree(el);
  }
  function onRemount() {
    if (!indexOnly) mountFromHostTree(el);
  }
  applyCommunity(el);
  if (!indexOnly) await mountFromHostTree(el);
  if (indexOnly) {
    setTimeout(function () {
      var path = String(location.pathname || '').replace(/\/+$/, '');
      var titles = {
        '/cong-dong/chu-de': 'Danh sách chủ đề · iFlux',
        '/cong-dong/tac-gia': 'Danh sách tác giả · iFlux',
        '/cong-dong/danh-muc': 'Danh sách danh mục · iFlux'
      };
      if (titles[path] && window.IfluxPageDefinition && IfluxPageDefinition.applyPatch) {
        IfluxPageDefinition.applyPatch({ documentTitle: titles[path] });
      }
      document.querySelectorAll('.ifx-rt-page-head').forEach(function (node) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
      });
    }, 0);
  }
  document.addEventListener('iflux-plans-updated', onPlans);
  document.addEventListener('iflux-community-remount-widgets', onRemount);
  return {
    unmount: function () {
      document.removeEventListener('iflux-plans-updated', onPlans);
      document.removeEventListener('iflux-community-remount-widgets', onRemount);
      if (featureRt) {
        featureRt.dispose();
        featureRt = null;
      }
      if (el) el.innerHTML = '';
    }
  };
}

export function unmount(el) {
  if (featureRt) {
    try { featureRt.dispose(); } catch (e) { /* ignore */ }
    featureRt = null;
  }
  if (el) el.innerHTML = '';
}
