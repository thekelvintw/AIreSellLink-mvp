const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;

  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
};

const base64ToUint8Array = (base64: string) => {
  const clean = base64.replace(/(\r\n|\n|\r)/gm, "");
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes;
};

const extractBase64Payload = (value: string | null | undefined) => {
  if (!value) {
    return { data: "", mimeType: "image/png" };
  }

  const match = value.match(/^data:(.*?);base64,(.*)$/);
  if (match) {
    return {
      mimeType: match[1] || "image/png",
      data: match[2] || "",
    };
  }

  return { data: value, mimeType: "image/png" };
};

export async function onRequestPost({ request, env }: { request: Request; env: any }) {
  try {
    const apiKey = env.CLIPDROP_API_KEY;
    if (!apiKey) {
      return Response.json(
        { success: false, message: "缺少 ClipDrop API Key" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { imageBase64, mimeType = "image/png" } = body || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return Response.json(
        { success: false, message: "缺少 imageBase64" },
        { status: 400 }
      );
    }

    const payload = extractBase64Payload(imageBase64);
    const imageBytes = base64ToUint8Array(payload.data);

    const clipdropResponse = await fetch("https://clipdrop-api.co/cleanup/v1", {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "x-api-key": apiKey,
      },
      body: imageBytes,
    });

    if (!clipdropResponse.ok) {
      const detail = await clipdropResponse.text();
      return Response.json(
        {
          success: false,
          message: "clipdrop_error",
          detail,
          status: clipdropResponse.status,
        },
        { status: clipdropResponse.status }
      );
    }

    const resultBuffer = await clipdropResponse.arrayBuffer();
    const resultBase64 = arrayBufferToBase64(resultBuffer);

    return Response.json({
      success: true,
      base64: resultBase64,
      mimeType: mimeType || "image/png",
    });
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        message: "去背失敗",
        error: error?.message || "unknown_error",
      },
      { status: 500 }
    );
  }
}

