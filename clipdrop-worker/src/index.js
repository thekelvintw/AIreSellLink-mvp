/**
 * ClipDrop Cleanup API Worker
 * 提供图片去背服务
 */

export default {
  async fetch(request, env) {
    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 只允许 POST 请求
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, message: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          } 
        }
      );
    }

    try {
      // 获取 API Key
      const apiKey = env.CLIPDROP_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, message: 'CLIPDROP_API_KEY not configured' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 获取上传的图片
      const formData = await request.formData();
      const imageFile = formData.get('image_file');

      if (!imageFile || !(imageFile instanceof File)) {
        return new Response(
          JSON.stringify({ success: false, message: 'No image file provided' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 读取图片为 ArrayBuffer
      const imageBuffer = await imageFile.arrayBuffer();

      // 调用 ClipDrop Cleanup API
      const clipdropResponse = await fetch('https://clipdrop-api.co/cleanup/v1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-api-key': apiKey,
        },
        body: imageBuffer,
      });

      if (!clipdropResponse.ok) {
        const errorText = await clipdropResponse.text();
        console.error('ClipDrop API error:', clipdropResponse.status, errorText);
        return new Response(
          JSON.stringify({
            success: false,
            message: 'ClipDrop API failed',
            error: `HTTP ${clipdropResponse.status}: ${errorText}`,
          }),
          { status: clipdropResponse.status, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // 获取去背后的图片
      const resultBuffer = await clipdropResponse.arrayBuffer();

      // 将结果转换为 base64
      const base64 = arrayBufferToBase64(resultBuffer);
      const mimeType = 'image/png';

      // 返回 base64 数据
      return new Response(
        JSON.stringify({
          success: true,
          data: `data:${mimeType};base64,${base64}`,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          },
        }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Internal server error',
          error: error.message,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};

/**
 * 将 ArrayBuffer 转换为 base64 字符串
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

