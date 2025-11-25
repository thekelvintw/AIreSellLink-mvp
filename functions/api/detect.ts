export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json({ ok: false, error: "No imageBase64 provided" }, { status: 400 });
    }

    const API_KEY = env.GEMINI_API_KEY;
    if (!API_KEY) {
      return Response.json({ ok: false, error: "後端沒拿到 GEMINI_API_KEY" }, { status: 500 });
    }

    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent";

    const result = await fetch(url + `?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: "請辨識圖片內容，回傳3個最接近的商品名稱，格式為純JSON，例如：{items:['咖啡隨行杯','鋼杯','水壺']}" },
              { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
            ]
          }
        ]
      })
    });

    const data = await result.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let items: string[] = [];
    try {
      const parsed = JSON.parse(text);
      items = parsed.items || [];
    } catch (e) {
      items = [text];
    }

    return Response.json({ ok: true, items });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "AI 錯誤" },
      { status: 500 }
    );
  }
}
