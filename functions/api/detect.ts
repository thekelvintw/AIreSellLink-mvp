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

/**
 * 清洗和规范化商品名称数组
 * 移除括号、斜杠、编号前缀等，只保留干净的商品名称
 */
function normalizeItems(rawItems: string[]): string[] {
  return rawItems
    .map(s => s.trim())
    // 去掉包在 () 裡的一整串
    .map(s => s.replace(/^\((.*)\)$/, "$1"))
    // 如果裡面有「 / 」就只取第一個
    .map(s => s.split(/[／/]/)[0].trim())
    // 去掉開頭的編號、符號（1.、- 、• 之類）
    .map(s => s.replace(/^[\d\-•\.\s]+/, ""))
    // 去掉開頭的「原因：」「根據...」等說明文字
    .map(s => s.replace(/^(原因：|根據.*?[，,]\s*|因為.*?[，,]\s*)/i, ""))
    // 過濾太短或明顯不是名稱的
    .filter(s => s.length >= 2)
    // 去重
    .filter((s, idx, arr) => arr.indexOf(s) === idx)
    // 只留前三個
    .slice(0, 3);
}

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
              text: `請你根據圖片判斷商品的可能名稱，給我三個候選。

輸出格式：
- 儘量用繁體中文
- 不要解釋
- 不要加 Markdown
- 只輸出 JSON，格式如下：
{"items": ["選項一", "選項二", "選項三"]}

重要：每個選項只能是商品名稱，不要包含原因說明、標點符號 ()、/、- 之前的修飾語。`
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
    let rawItems: string[] = [];

    // 若回傳 JSON 格式且為陣列
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          rawItems = parsed;
        } else if (parsed.items && Array.isArray(parsed.items)) {
          rawItems = parsed.items;
        }
      } catch (e) {
        // JSON parse 失敗，使用 fallback
        // 將文字按逗號或換行拆成最多三個選項
        rawItems = text.split(/[\n,；]/).map(s => s.trim()).filter(s => s).slice(0, 3);
      }
    }

    // 如果仍然沒有 items，使用文字內容做一個選項
    if (rawItems.length === 0 && text) {
      rawItems = [text];
    }

    // 清洗和规范化商品名称
    let items = normalizeItems(rawItems);

    // 如果清洗後还是没有，返回默认值
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
