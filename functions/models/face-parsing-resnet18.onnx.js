const MODEL_URL =
  'https://raw.githubusercontent.com/MDMinhajul-Islam/go_go_gorgeous/main/public/models/face-parsing-resnet18.onnx';

export async function onRequest({ request }) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }

  const upstreamHeaders = new Headers();
  for (const header of ['Range', 'If-None-Match', 'If-Modified-Since']) {
    const value = request.headers.get(header);
    if (value) upstreamHeaders.set(header, value);
  }

  const upstream = await fetch(MODEL_URL, { method: request.method, headers: upstreamHeaders });
  const headers = new Headers({
    'Cache-Control': 'public, max-age=3600, must-revalidate',
    'Content-Type': 'application/octet-stream',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const header of ['Accept-Ranges', 'Content-Length', 'Content-Range', 'ETag', 'Last-Modified']) {
    const value = upstream.headers.get(header);
    if (value) headers.set(header, value);
  }

  if (!upstream.ok && upstream.status !== 304) {
    return new Response('Face model temporarily unavailable', {
      status: upstream.status === 404 ? 404 : upstream.status === 416 ? 416 : 502,
      headers,
    });
  }

  return new Response(request.method === 'HEAD' || upstream.status === 304 ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}
