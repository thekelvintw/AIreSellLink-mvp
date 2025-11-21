import express from 'express';
import multer from 'multer';
import axios from 'axios';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

dotenv.config();

const { REMOVE_BG_API_KEY } = process.env;

if (!REMOVE_BG_API_KEY) {
  console.warn("REMOVE_BG_API_KEY 未設定，去背功能會失敗");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 確保 uploads 資料夾存在
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({ dest: uploadsDir });

const app = express();

// 啟用 CORS - 允許所有來源（開發環境）
app.use(cors({
  origin: true, // 允許所有來源
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: '沒有上傳圖片' });
    }

    const filePath = req.file.path;
    const formData = new FormData();
    formData.append('image_file', fs.createReadStream(filePath));
    formData.append('size', 'auto');

    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      formData,
      {
        headers: {
          'X-Api-Key': REMOVE_BG_API_KEY,
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer'
      }
    );

    const outFileName = `no-bg-${Date.now()}.png`;
    const outFilePath = path.join(uploadsDir, outFileName);
    fs.writeFileSync(outFilePath, response.data);

    // 清理上傳的原始檔案
    fs.unlinkSync(filePath);

    // 若你要用 URL，可部署並公開這 uploads 資料夾，暫時給 local 回傳：
    const publicUrl = `/uploads/${outFileName}`;

    res.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('remove-bg error:', error);
    res.status(500).json({ 
      success: false, 
      message: '去背失敗', 
      error: error.message 
    });
  }
});

// 靜態服務 uploads 資料夾
app.use('/uploads', express.static(uploadsDir));

// 添加調試路由（放在 PORT 定義之後）
const PORT = process.env.PORT || 5000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, () => {
  console.log(`Remove-BG proxy server running on port ${PORT}`);
});
