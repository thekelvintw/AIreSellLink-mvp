import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// CORS：開發先全開，之後再收緊
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

// 上傳設定
const upload = multer({ dest: 'uploads/' });

// 去背 API
app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '沒有上傳圖片' });
    }

    const apiKey = process.env.CLIPDROP_API_KEY;

    if (!apiKey) {
      console.error('CLIPDROP_API_KEY 未設定');
      return res.status(500).json({ success: false, message: '後端未設定 ClipDrop API key' });
    }

    const imageBuffer = fs.readFileSync(req.file.path);

    // 呼叫 ClipDrop Cleanup API
    const response = await axios.post(
      'https://clipdrop-api.co/cleanup/v1',
      imageBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-api-key': apiKey,
        },
        responseType: 'arraybuffer',
      }
    );

    // 將結果存為檔案
    const outPath = path.join(uploadsDir, `no-bg-${Date.now()}.png`);
    fs.writeFileSync(outPath, response.data);

    // 回傳前端可用的 URL
    const filename = path.basename(outPath);
    res.json({ success: true, url: `/uploads/${filename}` });
  } catch (err) {
    console.error('clipdrop error:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: '去背失敗', error: err.message });
  } finally {
    // 刪除原始上傳檔案
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

// 靜態服務去背後檔案
app.use('/uploads', express.static(uploadsDir));

app.listen(PORT, () => {
  console.log(`Remove-BG proxy server running on port ${PORT}`);
});
