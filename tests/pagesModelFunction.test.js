import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/models/face-parsing-resnet18.onnx.js';

function context(method = 'GET', headers = {}) {
  const calls = [];
  const bytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  const bucket = {
    async head(key) {
      calls.push(['head', key]);
      return { size: bytes.length, httpEtag: '"model-etag"' };
    },
    async get(key, options) {
      calls.push(['get', key, options]);
      const start = options?.range?.offset ?? 0;
      const length = options?.range?.length ?? bytes.length;
      return { body: bytes.slice(start, start + length) };
    },
  };
  return {
    calls,
    request: new Request('https://example.pages.dev/models/face-parsing-resnet18.onnx', { method, headers }),
    env: { FACE_MODEL_BUCKET: bucket },
  };
}

test('serves model metadata to HEAD without downloading the body', async () => {
  const ctx = context('HEAD');
  const response = await onRequest(ctx);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), '10');
  assert.equal(await response.text(), '');
  assert.equal(ctx.calls.length, 1);
});

test('serves the full model with immutable caching', async () => {
  const ctx = context();
  const response = await onRequest(ctx);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal((await response.arrayBuffer()).byteLength, 10);
});

test('supports a single byte range', async () => {
  const ctx = context('GET', { Range: 'bytes=2-4' });
  const response = await onRequest(ctx);
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), 'bytes 2-4/10');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [2, 3, 4]);
  assert.deepEqual(ctx.calls[1][2], { range: { offset: 2, length: 3 } });
});

test('rejects unsatisfiable ranges and unsupported methods', async () => {
  const rangeResponse = await onRequest(context('GET', { Range: 'bytes=10-' }));
  assert.equal(rangeResponse.status, 416);
  assert.equal(rangeResponse.headers.get('content-range'), 'bytes */10');
  const methodResponse = await onRequest(context('POST'));
  assert.equal(methodResponse.status, 405);
  assert.equal(methodResponse.headers.get('allow'), 'GET, HEAD');
});
