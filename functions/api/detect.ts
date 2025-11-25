import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return Response.json({ ok: false, error: "缺少 imageBase64" }, { status: 400 });
    }

    const apiKey = env.VITE_API_KEY;
    if (!apiKey) {
      return Response.json({ ok: false, error: "API Key 未設定（env.VITE_API_KEY）" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
你是二手商品賣家助手，請從圖片中辨識出可能的商品名稱（名詞即可）：
`;
    const imageData = imageBase64.replace("data:image/jpeg;base64,", "");

    const result = await model.generateContent([
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: imageData,
              mimeType: "image/jpeg",
            },
          },
        ],
      },
    ]);

    const text = result.response.text() || "";
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l);

    return Response.json({
      ok: true,
      items: lines,
    });
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err?.message || "AI 處理錯誤" },
      { status: 500 }
    );
  }
}
