'use strict';

const assert = require('node:assert/strict');
const Module = require('node:module');
const path = require('node:path');
const test = require('node:test');

function loadMediaProcessWithSharpStub(sourceSize) {
  const generated = new Map();
  const resizeCalls = [];
  let outputId = 0;

  function sharpStub(input) {
    const pipeline = { resizeOptions: null, outputFormat: 'webp' };
    return {
      resize: function (width, height, options) {
        pipeline.resizeOptions = width && typeof width === 'object'
          ? Object.assign({}, width)
          : Object.assign({ width, height }, options);
        resizeCalls.push(pipeline.resizeOptions);
        return this;
      },
      flatten: function () { return this; },
      jpeg: function () { pipeline.outputFormat = 'jpeg'; return this; },
      webp: function () { pipeline.outputFormat = 'webp'; return this; },
      toBuffer: async function () {
        const buf = Buffer.from('generated-' + (++outputId));
        const o = pipeline.resizeOptions;
        const ratio = o.fit === 'inside'
          ? Math.min(1, o.width / sourceSize.width, o.height ? o.height / sourceSize.height : 1)
          : null;
        generated.set(buf, ratio == null
          ? { width: o.width, height: o.height }
          : { width: Math.round(sourceSize.width * ratio), height: Math.round(sourceSize.height * ratio) });
        return buf;
      },
      metadata: async function () {
        return generated.get(input) || sourceSize;
      }
    };
  }

  const target = path.resolve(__dirname, '../../src/modules/media/media-process.js');
  delete require.cache[target];
  const originalLoad = Module._load;
  Module._load = function (request, parent, isMain) {
    if (request === 'sharp') return sharpStub;
    return originalLoad.call(this, request, parent, isMain);
  };
  let mediaProcess;
  try {
    mediaProcess = require(target);
  } finally {
    Module._load = originalLoad;
  }
  return { mediaProcess, resizeCalls };
}

test('cover profiles use requested dimensions and preserve detail image at max width 1280', async () => {
  const profiles = require('../../src/modules/media/cover-image-profiles').COVER_IMAGE_PROFILES;
  assert.deepEqual(profiles.map(({ key, width, height }) => [key, width, height]), [
    ['cover_thumb', 240, 184],
    ['cover_card', 720, 405],
    ['cover_hero', 880, 550],
    ['cover_detail', 1280, undefined],
    ['cover_social', 1200, 630]
  ]);

  const largeSource = loadMediaProcessWithSharpStub({ width: 2000, height: 1200 });
  const largeVariants = await largeSource.mediaProcess.generateCoverVariants(Buffer.from('source'));
  const detail = largeVariants.find((variant) => variant.role === 'cover_detail');
  assert.deepEqual([detail.width, detail.height], [1280, 768]);
  assert.equal(largeSource.resizeCalls[3].fit, 'inside');
  assert.equal(largeSource.resizeCalls[3].withoutEnlargement, true);
  assert.deepEqual([largeVariants[1].width, largeVariants[1].height], [720, 405]);
  assert.deepEqual([largeVariants[2].width, largeVariants[2].height], [880, 550]);

  const smallSource = loadMediaProcessWithSharpStub({ width: 800, height: 600 });
  const smallVariants = await smallSource.mediaProcess.generateCoverVariants(Buffer.from('source'));
  const smallDetail = smallVariants.find((variant) => variant.role === 'cover_detail');
  assert.deepEqual([smallDetail.width, smallDetail.height], [800, 600]);

  const wideSource = loadMediaProcessWithSharpStub({ width: 1920, height: 1080 });
  const wideVariants = await wideSource.mediaProcess.generateCoverVariants(Buffer.from('source'));
  const wideDetail = wideVariants.find((variant) => variant.role === 'cover_detail');
  assert.deepEqual([wideDetail.width, wideDetail.height], [1280, 720]);
  assert.equal(wideSource.resizeCalls[3].height, undefined);
  assert.equal(wideSource.resizeCalls[3].withoutEnlargement, true);
});

test('detail-only generation skips the other cover roles', async () => {
  const source = loadMediaProcessWithSharpStub({ width: 1920, height: 1080 });
  const variants = await source.mediaProcess.generateCoverVariants(Buffer.from('source'), ['cover_detail']);
  assert.deepEqual(variants.map((variant) => variant.role), ['cover_detail']);
  assert.equal(source.resizeCalls.length, 1);
});

test('article body image URLs prefer cover_detail while cover URL remains delivery', () => {
  const mediaImport = require('../../src/modules/media/media-import.service');
  const html = '<p><img src="https://source.test/a.jpg"></p>';
  const replaced = mediaImport.replaceImgSrcs(html, {
    'https://source.test/a.jpg': {
      media_url: '/media/a-delivery.webp',
      asset_id: 'mas_1',
      variants: { cover_detail: '/media/a-cover_detail.webp' }
    }
  }, 'cover_detail');
  assert.match(replaced, /src="\/media\/a-cover_detail\.webp"/);
  assert.match(replaced, /data-media-asset-id="mas_1"/);
});
