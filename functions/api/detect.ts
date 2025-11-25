export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json({ ok: false, error: "缺少 imageBase64" }, { status: 400 });
    }

    const API_KEY = env.VITE_API_KEY;
    if (!API_KEY) {
      return Response.json({ ok: false, error: "後端沒拿到 VITE_API_KEY" }, { status: 500 });
    }

    const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
        {
          parts: [
            { text: "請分析圖片並列出可能的商品名稱（名詞即可）：" },
            {
              inline_data: {
                data: base64,
                mime_type: "image/jpeg"
              }
            }
          ]
        }
      ]
    };

    const aiRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await aiRes.json();

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const items = text.split('\n').map(l => l.trim()). filter(Boolean);

    return Response.json({ ok: true, items });

  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "AI 錯誤" },
      { status: 500 }
    );
  }
}
