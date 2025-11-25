type CopyResult = {
  resaleStyle: string;
  brandStyle: string;
};

const fallbackCopy: CopyResult = {
  resaleStyle: "這是轉售風格文案範例，請自行調整內容。",
  brandStyle: "這是品牌風格文案範例，請自行調整內容。",
};

const buildPrompt = (itemName: string, reason: string, officialUrl: string) => `你是一位幫台灣二手賣家寫商品文案的助手。
請根據下列資訊產生兩段文案：

1. 轉售風格：像在二手社團貼文的口語口吻，約 80～120 字。
2. 品牌風格：偏官方介紹、電商商品頁風格，約 80～120 字。

輸出格式請嚴格遵守以下分隔線（不要加入其他說明、不要加入程式碼區塊）：

===RESELL===
（轉售風格文案）
===BRAND===
（品牌風格文案）

商品名稱：${itemName || "（未提供）"}
AI 辨識資訊：${reason || "（未提供）"}
官方連結：${officialUrl || "（無）"}`;

const parseCopyResponse = (text: string): CopyResult => {
  if (!text) return { ...fallbackCopy };

  const cleaned = text.replace(/```[\s\S]*?```/g, "").trim();
  const [resellSegment, brandSegment] = cleaned.split("===BRAND===");
  const resaleStyle = resellSegment?.split("===RESELL===")[1]?.trim() || "";
  const brandStyle = brandSegment?.trim() || "";

  if (!resaleStyle && !brandStyle) {
    return { ...fallbackCopy };
  }

  return {
    resaleStyle: resaleStyle || fallbackCopy.resaleStyle,
    brandStyle: brandStyle || fallbackCopy.brandStyle,
  };
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
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((part: any) => part?.text || "").join("\n").trim();
    const result = parseCopyResponse(text);
    return Response.json(result);
  } catch (error: any) {
    return Response.json(
      { error: "generate_copy_failed", detail: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}

