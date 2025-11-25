const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const extractBase64Payload = (value: string) => {
  const match = value.match(/^data:(.*?);base64,(.*)$/);
  if (match) {
    return {
      mimeType: match[1] || "image/jpeg",
      data: match[2],
    };
  }
  return {
    mimeType: "image/jpeg",
    data: value,
  };
};

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let base64Payload: string | null = null;
    let payloadMime = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const image = formData.get("image");

      if (image instanceof File) {
        const buffer = await image.arrayBuffer();
        base64Payload = arrayBufferToBase64(buffer);
        payloadMime = image.type || payloadMime;
      } else if (typeof image === "string") {
        const extracted = extractBase64Payload(image);
        payloadMime = extracted.mimeType;
        base64Payload = extracted.data;
      } else {
        const fallback = formData.get("imageBase64");
        if (typeof fallback === "string") {
          const extracted = extractBase64Payload(fallback);
          payloadMime = extracted.mimeType;
          base64Payload = extracted.data;
        }
      }
    } else {
      try {
        const { imageBase64 } = await request.json();
        if (typeof imageBase64 === "string") {
          const extracted = extractBase64Payload(imageBase64);
          payloadMime = extracted.mimeType;
          base64Payload = extracted.data;
        }
      } catch {
        // ignore parse error
      }
    }

    if (!base64Payload) {
      return Response.json({ ok: false, error: "No image provided" }, { status: 400 });
    }

    const API_KEY = env.GEMINI_API_KEY || env.VITE_API_KEY;
    if (!API_KEY) {
      return Response.json({ ok: false, error: "後端找不到 Gemini API Key" }, { status: 500 });
    }

    const modelName = "gemini-2.5-flash";
    
    // 按照官方文档格式构建 payload
    const payload = {
      contents: [
        {
          parts: [
            {
              inline_data: {
                mime_type: payloadMime,
                data: base64Payload
              }
            },
            {
              text: "請辨識這張商品圖片，回傳最接近的商品名稱。"
            }
          ]
        }
      ]
    };

    const result = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    if (!result.ok) {
      const errorText = await result.text();
      return Response.json(
        { ok: false, error: errorText || `API 錯誤: ${result.status}` },
        { status: result.status }
      );
    }

    const data = await result.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 解析返回的商品名称
    let items: string[] = [];
    try {
      // 尝试解析 JSON 格式
      const parsed = JSON.parse(text);
      items = parsed.items || (Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      // 如果不是 JSON，尝试按行分割
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      items = lines.length > 0 ? lines : [text];
    }

    // 确保至少返回一个结果
    if (items.length === 0) {
      items = ["未辨識到商品"];
    }

    return Response.json({ ok: true, items });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "AI 錯誤" },
      { status: 500 }
    );
  }
}
