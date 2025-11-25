export async function onRequestPost({ request }: { request: Request }) {
  const body = await request.json().catch(() => ({}));

  return Response.json({
    ok: true,
    received: body,
    msg: 'Cloudflare Worker 已成功啟動（之後會在這裡加 AI）'
  });
}
