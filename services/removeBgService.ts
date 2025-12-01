import { fileToBase64 } from '../utils/fileUtils';

const LOCAL_BACKEND_URL = import.meta.env.VITE_BACKEND_URL?.trim();

export interface RemoveBgResponse {
  success: boolean;
  url?: string;
  base64?: string;
  mimeType?: string;
  message?: string;
  error?: string;
}

export interface RemoveBgResult {
  url?: string;
  base64?: string;
  mimeType?: string;
  usedFallback: boolean;
}

const callLocalRemoveBg = async (file: File): Promise<RemoveBgResult> => {
  if (!LOCAL_BACKEND_URL) {
    throw new Error('LOCAL_BACKEND_URL 未設定');
  }

  const formData = new FormData();
  formData.append('image_file', file);

  const response = await fetch(`${LOCAL_BACKEND_URL}/api/remove-bg`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`local remove-bg HTTP ${response.status}`);
  }

  const data: RemoveBgResponse = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'local remove-bg 回應失敗');
  }

  if (data.url) {
    return {
      url: data.url.startsWith('http')
        ? data.url
        : `${LOCAL_BACKEND_URL}${data.url}`,
      mimeType: data.mimeType || 'image/png',
      usedFallback: false,
    };
  }

  if (data.base64) {
    return {
      base64: data.base64,
      mimeType: data.mimeType || 'image/png',
      usedFallback: false,
    };
  }

  throw new Error('local remove-bg 回應缺少 url/base64');
};

const callEdgeRemoveBg = async (file: File): Promise<RemoveBgResult> => {
  const base64 = await fileToBase64(file);

  const response = await fetch('/api/remove-bg', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: base64,
      mimeType: file.type || 'image/png',
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`edge remove-bg HTTP ${response.status}: ${detail}`);
  }

  const data: RemoveBgResponse = await response.json();
  if (!data.success || !data.base64) {
    throw new Error(data.message || 'edge remove-bg 回應無 base64');
  }

  return {
    base64: data.base64,
    mimeType: data.mimeType || 'image/png',
    usedFallback: false,
  };
};

export const removeBackground = async (file: File): Promise<RemoveBgResult> => {
  try {
    if (LOCAL_BACKEND_URL) {
      return await callLocalRemoveBg(file);
    }

    return await callEdgeRemoveBg(file);
  } catch (error) {
    console.error('remove-bg 服務呼叫失敗，使用原圖繼續', error);
    const base64 = await fileToBase64(file);
    return {
      base64,
      mimeType: file.type || 'image/png',
      usedFallback: true,
    };
  }
};

