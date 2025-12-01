function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export default {
  async fetch(request, env) {
    // --- CORS 預檢 ---
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(),
        },
      });
    }

    try {
      const formData = await request.formData();
      const file = formData.get("image_file");

      if (!file) {
        return new Response(
          JSON.stringify({ success: false, message: "No file received" }),
          {
            status: 400,
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
            },
          }
        );
      }

      // forward 到 ClipDrop
      const clipForm = new FormData();
      clipForm.append("image_file", file);

      const response = await fetch("https://clipdrop-api.co/cleanup/v1", {
        method: "POST",
        headers: {
          "x-api-key": env.CLIPDROP_API_KEY,
        },
        body: clipForm,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            success: false,
            message: "ClipDrop API error",
            detail: errorText,
          }),
          {
            status: 500,
            headers: {
              ...corsHeaders(),
              "Content-Type": "application/json",
            },
          }
        );
      }

      const blob = await response.blob();

      return new Response(blob, {
        headers: {
          ...corsHeaders(),
          "Content-Type": "image/png",
        },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Worker error",
          error: err.toString(),
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders(),
            "Content-Type": "application/json",
          },
        }
      );
    }
  },
};
