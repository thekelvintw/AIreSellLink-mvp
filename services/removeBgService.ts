const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

export interface RemoveBgResponse {
  success: boolean;
  url?: string;
  message?: string;
  error?: string;
}

export const removeBackground = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image_file', file);

  const response = await fetch(`${BACKEND_URL}/api/remove-bg`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = '去背失敗';
    try {
      const error = await response.json();
      errorMessage = error.message || error.error || errorMessage;
    } catch (e) {
      // 如果回應不是 JSON，使用狀態碼
      errorMessage = `去背失敗 (HTTP ${response.status})`;
    }
    throw new Error(errorMessage);
  }

  const data: RemoveBgResponse = await response.json();
  
  if (!data.success || !data.url) {
    throw new Error(data.message || '去背失敗');
  }

  // 返回完整的 URL
  return `${BACKEND_URL}${data.url}`;
};

