import { GoogleGenAI, Type, Modality } from "@google/genai";

const API_KEY = import.meta.env.VITE_API_KEY;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("VITE_API_KEY 環境變數未設定，AI 呼叫會使用模擬結果");
}

export const detectItem = async (base64Image: string): Promise<string[]> => {
  try {
    if (!ai) {
      console.warn("AI client not initialized. Using mock result.");
      return ["模擬產品 A", "模擬產品 B", "模擬產品 C"];
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: '分析這張產品圖片。請辨識出物品並提供 3 個可能的具體名稱（使用繁體中文）。以 JSON 字串陣列的格式回傳結果。例如：`["Nike Air Force 1 \'07", "白色皮革運動鞋", "經典籃球鞋"]`',
          },
        ],
      },
       config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    });
    const jsonText = response.text.trim();
    const candidates = JSON.parse(jsonText);
    return Array.isArray(candidates) ? candidates : [];
  } catch (error) {
    console.error("Error detecting item:", error);
    // Return mock data on failure
    return ["模擬產品 A", "模擬產品 B", "模擬產品 C"];
  }
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
      model: 'gemini-2.5-flash',
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
      model: 'gemini-2.5-flash',
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
        model: 'gemini-2.5-flash-image',
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