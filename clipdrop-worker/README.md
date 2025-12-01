# ClipDrop Worker

Cloudflare Worker 提供 ClipDrop Cleanup API 代理服务。

## 部署

1. 登录 Cloudflare：
   ```bash
   wrangler login
   ```

2. 设置环境变量（在 Cloudflare Dashboard 或使用 wrangler）：
   ```bash
   wrangler secret put CLIPDROP_API_KEY
   ```

3. 部署：
   ```bash
   wrangler deploy
   ```

## 使用

POST 请求到 Worker URL，包含 `image_file` 字段：

```bash
curl -X POST https://your-worker.your-subdomain.workers.dev \
  -F "image_file=@/path/to/image.jpg"
```

响应：
```json
{
  "success": true,
  "data": "data:image/png;base64,..."
}
```

