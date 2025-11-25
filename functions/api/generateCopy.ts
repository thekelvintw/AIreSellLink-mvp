const fallbackCopy = {
  resell: "這是轉售風格文案範例，請自行調整內容。",
  brand: "這是品牌風格文案範例，請自行調整內容。",
};

const buildPrompt = (itemName: string, reason: string, officialUrl: string) => `
你是一位幫台灣二手賣家寫商品文案的中文助手。
請根據以下資訊，輸出兩段文案：
- 商品名稱：${itemName || "（未提供）"}
- AI 辨識依據說明：${reason || "（未提供）"}
- 官方商品連結：${officialUrl || "（沒有提供）"}

1）「轉售風格」：像一般人賣二手商品的口吻，生活化、誠實說明使用狀況，約 80～120 字，繁體中文。
2）「品牌風格」：偏官方介紹，重點放在材質、設計與特色，約 80～120 字，繁體中文。

請只輸出 JSON，格式如下（不要加反引號、不要加說明文字）：
{
  "resell": "轉售風格文案",
  "brand": "品牌風格文案"
}
`;

const parseCopyResponse = (text: string) => {
  if (!text) return { ...fallbackCopy };
  try {
    const parsed = JSON.parse(text);
    return {
      resell: parsed.resell || parsed.resale || fallbackCopy.resell,
      brand: parsed.brand || parsed.brandStyle || fallbackCopy.brand,
    };
  } catch {
    const parts = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
    return {
      resell: parts[0] || fallbackCopy.resell,
      brand: parts[1] || parts[0] || fallbackCopy.brand,
    };
  }
};

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const apiKey = env.GEMINI_API_KEY || env.VITE_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing Gemini API Key" }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const itemName = body?.itemName ?? "";
    const reason = body?.reason ?? "";
    const officialUrl = body?.officialUrl ?? "";

    if (!itemName) {
      return Response.json({ error: "缺少商品名稱" }, { status: 400 });
    }

    const model = "gemini-2.5-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: buildPrompt(itemName, reason, officialUrl) }] }],
        }),
      }
    );

    if (!response.ok) {
      const detail = await response.text();
      return Response.json({ error: "gemini_error", detail }, { status: 500 });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
    const result = parseCopyResponse(text);
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: "generate_copy_failed", detail: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

