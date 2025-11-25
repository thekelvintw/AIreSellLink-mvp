import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = import.meta.env.VITE_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("VITE_API_KEY 環境變數未設定，AI 呼叫會使用模擬結果");
}

/**
 * 將 File 轉換為 base64 字串
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * 透過後端 API 辨識商品圖片
 * @param imageBase64 - 圖片的 base64 字串（可包含 data URL prefix）
 * @returns 商品名稱陣列
 */
export const detectItem = async (imageBase64: string): Promise<string[]> => {
  try {
    const resp = await fetch("/api/detect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ imageBase64 })
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({ error: "未知錯誤" }));
      throw new Error("AI 辨識錯誤: " + (errorData.error || `HTTP ${resp.status}`));
    }

    const json = await resp.json();
    if (!json.ok) {
      throw new Error("AI 辨識錯誤: " + (json.error || "未知錯誤"));
    }

    return json.items as string[];
  } catch (error) {
    console.error("Error detecting item:", error);
    throw error;
  }
};

/**
 * 透過後端 API 辨識商品圖片（使用 File 物件）
 * @param file - 圖片檔案
 * @returns 商品名稱陣列
 */
export const detectItemFromFile = async (file: File): Promise<string[]> => {
  const imageBase64 = await fileToBase64(file);
  return detectItem(imageBase64);
};

export const generateCopy = async (itemLabel: string): Promise<{ brandStyle: string; resaleStyle: string }> => {
  try {
    if (!ai) {
      console.warn("AI client not initialized. Using mock result.");
      return {
        brandStyle: "這是模擬的品牌風格文案，專業且注重細節。",
        resaleStyle: "嘿！這東西超讚的，狀況良好，快來看看！",
      };
    }
     const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Given the product name "${itemLabel}", write two versions of a sales description in Traditional Chinese. The first, 'brandStyle', should be professional and highlight features, like an official brand website. The second, 'resaleStyle', should be friendly and casual, suitable for a second-hand marketplace.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            brandStyle: { type: Type.STRING },
            resaleStyle: { type: Type.STRING },
          },
          required: ["brandStyle", "resaleStyle"],
        },
      },
    });

    const jsonText = response.text.trim();
    const copy = JSON.parse(jsonText);
    return copy;
  } catch (error) {
    console.error("Error generating copy:", error);
    return {
      brandStyle: "這是模擬的品牌風格文案，專業且注重細節。",
      resaleStyle: "嘿！這東西超讚的，狀況良好，快來看看！",
    };
  }
};

export const suggestPrice = async (itemLabel: string): Promise<{ min: number; max: number }> => {
  try {
    if (!ai) {
      console.warn("AI client not initialized. Using mock result.");
      return { min: 500, max: 1500 };
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Based on the product "${itemLabel}", suggest a reasonable price range in TWD for selling it second-hand.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            min: { type: Type.NUMBER },
            max: { type: Type.NUMBER },
          },
          required: ["min", "max"],
        },
      },
    });

    const jsonText = response.text.trim();
    const priceHint = JSON.parse(jsonText);
    return priceHint;
  } catch (error) {
    console.error("Error suggesting price:", error);
    return { min: 500, max: 1500 };
  }
};

export const enhanceImage = async (base64Image: string): Promise<string> => {
  try {
    if (!ai) {
      console.warn("AI client not initialized. Returning original image.");
      return base64Image;
    }
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: {
            parts: [
                {
                    inlineData: { data: base64Image, mimeType: 'image/jpeg' },
                },
                { text: 'Take the main object in this image, professionally remove the background, and place it on a clean, bright, neutral light grey background (#F5F5F5). The object should be well-lit and centered.' },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data in response");

  } catch (error) {
    console.error("Error enhancing image:", error);
    return base64Image; // Return original on error
  }
};