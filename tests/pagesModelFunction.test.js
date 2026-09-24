import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/models/face-parsing-resnet18.onnx.js';

function context(method = 'GET', headers = {}) {
  return {
    request: new Request('https://example.pages.dev/models/face-parsing-resnet18.onnx', { method, headers }),
  };
}

async function withFetch(handler, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = handler;
  try {
    await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

test('proxies model metadata for HEAD without a body', async () => {
  let received;
  await withFetch(async (url, options) => {
    received = { url, options };
    return new Response(null, { headers: { 'Content-Length': '53205364', ETag: '"model-v1"' } });
  }, async () => {
    const response = await onRequest(context('HEAD'));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-length'), '53205364');
    assert.equal(await response.text(), '');
  });
  assert.match(received.url, /^https:\/\/raw\.githubusercontent\.com\//);
  assert.equal(received.options.method, 'HEAD');
});

test('streams model responses with bounded browser caching', async () => {
  await withFetch(async () => new Response(new Uint8Array([1, 2, 3]), {
    headers: { 'Content-Length': '3', ETag: '"model-v1"' },
  }), async () => {
    const response = await onRequest(context());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=3600, must-revalidate');
    assert.equal((await response.arrayBuffer()).byteLength, 3);
  });
});

test('forwards single byte-range requests and partial responses', async () => {
  let receivedHeaders;
  await withFetch(async (_url, options) => {
    receivedHeaders = options.headers;
    return new Response(new Uint8Array([2, 3, 4]), {
      status: 206,
      headers: { 'Content-Length': '3', 'Content-Range': 'bytes 2-4/10', 'Accept-Ranges': 'bytes' },
    });
  }, async () => {
    const response = await onRequest(context('GET', { Range: 'bytes=2-4' }));
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), 'bytes 2-4/10');
    assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [2, 3, 4]);
  });
  assert.equal(receivedHeaders.get('Range'), 'bytes=2-4');
});

test('passes conditional requests through and rejects unsupported methods', async () => {
  let receivedHeaders;
  await withFetch(async (_url, options) => {
    receivedHeaders = options.headers;
    return new Response(null, { status: 304, headers: { ETag: '"model-v1"' } });
  }, async () => {
    const response = await onRequest(context('GET', { 'If-None-Match': '"model-v1"' }));
    assert.equal(response.status, 304);
    assert.equal(await response.text(), '');
  });
  assert.equal(receivedHeaders.get('If-None-Match'), '"model-v1"');

  const methodResponse = await onRequest(context('POST'));
  assert.equal(methodResponse.status, 405);
  assert.equal(methodResponse.headers.get('allow'), 'GET, HEAD');
});
