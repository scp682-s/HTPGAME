// Vercel Serverless Function - 校验图片
import { validateImageSource } from '../image_validator.js';

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { imageSource } = req.body;
    const check = await validateImageSource(imageSource);
    res.json({ success: true, data: check });
  } catch (error) {
    console.error('图片校验失败:', error);
    res.status(500).json({ success: false, error: '图片校验失败: ' + error.message });
  }
}
