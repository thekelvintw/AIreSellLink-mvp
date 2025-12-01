import { fileToBase64 } from '../utils/fileUtils';

const WORKER_URL = import.meta.env.VITE_CLIPDROP_WORKER_URL || 'https://clipdrop-worker.kelvin-aiesec.workers.dev';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL; // 保留本地后端支持

export interface RemoveBgResponse {
  success: boolean;
  url?: string;
  data?: string; // Worker 返回的 base64 data URL
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

  // 优先使用 Worker，如果没有配置则使用本地后端
  const apiUrl = WORKER_URL || (BACKEND_URL ? `${BACKEND_URL}/api/remove-bg` : null);
  
  if (!apiUrl) {
    console.warn('未配置去背服务 URL，使用原图');
    const base64 = await fileToBase64(file);
    return { base64, usedFallback: true };
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.warn('remove-bg 回傳非 2xx，將使用原圖繼續');
      throw new Error(`HTTP ${response.status}`);
    }

    // Worker 返回 blob (image/png)，本地后端返回 JSON
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('image/png')) {
      // Worker 返回的是 blob，转换为 base64
      const blob = await response.blob();
      const base64 = await fileToBase64(new File([blob], 'no-bg.png', { type: 'image/png' }));
      return {
        base64,
        usedFallback: false,
      };
    }

    // 本地后端返回 JSON 格式
    const data: RemoveBgResponse = await response.json();
    
    if (!data.success) {
      console.warn('remove-bg 回傳失敗，將使用原圖繼續', data);
      throw new Error(data.message || '無效的去背回應');
    }

    // 本地后端返回格式：{ success: true, url: "/uploads/..." }
    if (data.url && BACKEND_URL) {
      return {
        url: `${BACKEND_URL}${data.url}`,
        usedFallback: false,
      };
    }

    throw new Error('無效的去背回應格式');
  } catch (error) {
    console.error('remove-bg 服務呼叫失敗，使用原圖繼續', error);
    const base64 = await fileToBase64(file);
    return {
      base64,
      usedFallback: true,
    };
  }
};

