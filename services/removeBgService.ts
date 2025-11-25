import { fileToBase64 } from '../utils/fileUtils';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export interface RemoveBgResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

export interface RemoveBgResult {
  url?: string;
  base64?: string;
  usedFallback: boolean;
}

export const removeBackground = async (file: File): Promise<RemoveBgResult> => {
  const formData = new FormData();
  formData.append('image_file', file);

  try {
    const response = await fetch(`${BACKEND_URL}/api/remove-bg`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.warn('remove-bg 回傳非 2xx，將使用原圖繼續');
      throw new Error(`HTTP ${response.status}`);
    }

    const data: RemoveBgResponse = await response.json();
    
    if (!data.success || !data.url) {
      console.warn('remove-bg 回傳資料不完整，將使用原圖繼續', data);
      throw new Error(data.message || '無效的去背回應');
    }

    return {
      url: `${BACKEND_URL}${data.url}`,
      usedFallback: false,
    };
  } catch (error) {
    console.error('remove-bg 服務呼叫失敗，使用原圖繼續', error);
    const base64 = await fileToBase64(file);
    return {
      base64,
      usedFallback: true,
    };
  }
};

