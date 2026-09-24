const MODEL_KEY = 'models/face-parsing-resnet18.onnx';

export async function onRequest({ request, env }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const metadata = await env.FACE_MODEL_BUCKET.head(MODEL_KEY);
  if (!metadata) return new Response('Model not found', { status: 404 });

  const headers = new Headers({
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=3600, must-revalidate',
    'Content-Type': 'application/octet-stream',
    'ETag': metadata.httpEtag,
    'X-Content-Type-Options': 'nosniff',
  });

  const etags = request.headers.get('If-None-Match')?.split(',').map((tag) => tag.trim()) ?? [];
  const currentEtag = metadata.httpEtag;
  if (etags.includes('*') || etags.some((tag) => tag.replace(/^W\//, '') === currentEtag)) {
    return new Response(null, { status: 304, headers });
  }

  if (request.method === 'HEAD') {
    headers.set('Content-Length', String(metadata.size));
    return new Response(null, { headers });
  }

  const rangeHeader = request.headers.get('Range');
  if (rangeHeader) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    if (!match || (!match[1] && !match[2])) {
      headers.set('Content-Range', `bytes */${metadata.size}`);
      return new Response(null, { status: 416, headers });
    }

    const suffixLength = match[1] ? null : Number(match[2]);
    const start = match[1] ? Number(match[1]) : Math.max(0, metadata.size - suffixLength);
    const requestedEnd = match[2] ? Number(match[2]) : metadata.size - 1;
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(requestedEnd) ||
        start < 0 || start >= metadata.size || requestedEnd < start) {
      headers.set('Content-Range', `bytes */${metadata.size}`);
      return new Response(null, { status: 416, headers });
    }

    const end = Math.min(requestedEnd, metadata.size - 1);
    const length = end - start + 1;
    const object = await env.FACE_MODEL_BUCKET.get(MODEL_KEY, {
      range: { offset: start, length },
    });
    if (!object) return new Response('Model not found', { status: 404 });
    headers.set('Content-Length', String(length));
    headers.set('Content-Range', `bytes ${start}-${end}/${metadata.size}`);
    return new Response(object.body, { status: 206, headers });
  }

  const object = await env.FACE_MODEL_BUCKET.get(MODEL_KEY);
  if (!object) return new Response('Model not found', { status: 404 });
  headers.set('Content-Length', String(metadata.size));
  return new Response(object.body, { headers });
}
