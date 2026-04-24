import crypto from 'crypto';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// 配置常量
const CUSTOM_IMAGE_MAX_MB = 10;
const CUSTOM_IMAGE_MAX_BYTES = CUSTOM_IMAGE_MAX_MB * 1024 * 1024;
const BAILIAN_IMAGE_MAX_MB = 4;
const BAILIAN_IMAGE_MAX_BYTES = BAILIAN_IMAGE_MAX_MB * 1024 * 1024;
const IMAGE_VALIDATION_CACHE_TTL_SECONDS = 3600; // 1小时缓存
const DEFAULT_BAILIAN_VISION_MODELS = ['qwen-vl-max', 'qwen-vl-plus'];

// 缓存
const IMAGE_VALIDATION_CACHE = new Map();

// 百炼客户端
let bailianClient = null;

function getBailianClient() {
  if (!bailianClient) {
    const apiKey = process.env.BAILIAN_API_KEY || process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new Error('未配置 BAILIAN_API_KEY（或 DASHSCOPE_API_KEY）');
    }
    bailianClient = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
    });
  }
  return bailianClient;
}

function isBuiltinImage(imageSource) {
  const str = String(imageSource || '');
  return str.startsWith('photo/') && /^photo\/\d+\.(?:png|jpg|jpeg|webp)$/i.test(str);
}

function isDataImage(imageSource) {
  return typeof imageSource === 'string' && imageSource.startsWith('data:image/');
}

function extractDataImagePayload(imageSource) {
  if (!isDataImage(imageSource)) {
    throw new Error('仅支持 image/* 数据URL');
  }

  const [head, ...rest] = imageSource.split(',');
  if (rest.length === 0) {
    throw new Error('图片数据格式不正确');
  }

  const payload = rest.join(',');
  const mimeMatch = head.match(/^data:(image\/[a-zA-Z0-9.+-]+)(;.*)?$/i);
  if (!mimeMatch) {
    throw new Error('图片MIME类型不合法');
  }

  const params = head.split(';').slice(1).map(p => p.trim().toLowerCase());
  if (!params.includes('base64')) {
    throw new Error('仅支持 base64 编码的图片数据');
  }

  let raw;
  try {
    raw = Buffer.from(payload, 'base64');
  } catch (e) {
    throw new Error(`图片base64解析失败: ${e.message}`);
  }

  if (raw.length === 0) {
    throw new Error('图片内容为空');
  }

  if (raw.length > CUSTOM_IMAGE_MAX_BYTES) {
    throw new Error(`图片过大，最大支持 ${CUSTOM_IMAGE_MAX_MB}MB`);
  }

  return { mimeType: mimeMatch[1].toLowerCase(), raw };
}

function prepareImageForBailian(mimeType, raw) {
  // 简化版：如果图片小于4MB直接返回，否则报错
  if (raw.length <= BAILIAN_IMAGE_MAX_BYTES) {
    return { mimeType, raw };
  }
  throw new Error(`图片大于 ${BAILIAN_IMAGE_MAX_MB}MB，请先压缩后重试`);
}

function cleanupImageValidationCache() {
  const now = Date.now();
  for (const [key, val] of IMAGE_VALIDATION_CACHE.entries()) {
    if (now - val.ts > IMAGE_VALIDATION_CACHE_TTL_SECONDS * 1000) {
      IMAGE_VALIDATION_CACHE.delete(key);
    }
  }
}

function getCachedImageValidation(imageHash) {
  cleanupImageValidationCache();
  const hit = IMAGE_VALIDATION_CACHE.get(imageHash);
  return hit ? { ...hit.result } : null;
}

function setCachedImageValidation(imageHash, result) {
  IMAGE_VALIDATION_CACHE.set(imageHash, {
    ts: Date.now(),
    result: { ...result }
  });
}

function parseJsonFromText(text) {
  const raw = String(text || '').trim();
  if (!raw) {
    throw new Error('模型返回为空');
  }

  // 优先直接解析
  try {
    return JSON.parse(raw);
  } catch (e) {
    // 尝试提取JSON代码块
    const fenced = raw.match(/```(?:json)?\s*(\{.*?\})\s*```/s);
    if (fenced) {
      try {
        return JSON.parse(fenced[1]);
      } catch (e2) {}
    }

    // 尝试提取首个对象
    const match = raw.match(/\{.*\}/s);
    if (match) {
      return JSON.parse(match[0]);
    }
  }

  throw new Error('无法从模型输出中解析JSON');
}

function toBool(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  const txt = String(value || '').trim().toLowerCase();
  return ['true', '1', 'yes', 'y', '是', '有', '包含', '存在'].includes(txt);
}

function getBailianVisionModels() {
  const custom = (process.env.BAILIAN_VISION_MODEL || '').trim();
  if (custom) {
    const models = custom.split(',').map(m => m.trim()).filter(m => m);
    if (models.length > 0) return models;
  }
  return DEFAULT_BAILIAN_VISION_MODELS;
}

async function checkCustomImageWithBailian(imageSource) {
  const { mimeType, raw } = extractDataImagePayload(imageSource);
  const imageHash = crypto.createHash('sha256').update(raw).digest('hex');

  const cached = getCachedImageValidation(imageHash);
  if (cached) return cached;

  const { mimeType: preparedMime, raw: preparedRaw } = prepareImageForBailian(mimeType, raw);
  const preparedSource = `data:${preparedMime};base64,${preparedRaw.toString('base64')}`;

  const clientMM = getBailianClient();
  let lastErr = null;
  let parsed = null;

  for (const modelName of getBailianVisionModels()) {
    try {
      const response = await clientMM.chat.completions.create({
        model: modelName,
        messages: [
          {
            role: 'system',
            content: '你是图片要素审核器。任务：判断图片中是否同时存在"房子、树、人物"三种元素。只输出JSON，不要任何解释性文字。'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '请判断图片是否包含以下元素：house(房子)、tree(树)、person(人物)。输出JSON格式：{"house":true/false,"tree":true/false,"person":true/false,"all_present":true/false,"reason":"不超过40字"}'
              },
              {
                type: 'image_url',
                image_url: { url: preparedSource }
              }
            ]
          }
        ],
        temperature: 0,
        max_tokens: 180,
        stream: false
      });

      const content = response.choices[0].message.content;
      parsed = parseJsonFromText(content);
      if (typeof parsed === 'object' && parsed !== null) {
        parsed._model = modelName;
        break;
      }
    } catch (e) {
      lastErr = e;
      continue;
    }
  }

  if (typeof parsed !== 'object' || parsed === null) {
    if (lastErr) {
      throw new Error(`图片要素校验失败: ${lastErr.message}`);
    }
    throw new Error('图片要素校验失败: 模型未返回可解析结果');
  }

  const house = toBool(parsed.house);
  const tree = toBool(parsed.tree);
  const person = toBool(parsed.person);
  const allPresent = toBool(parsed.all_present) && house && tree && person;
  const reason = String(parsed.reason || '').trim().slice(0, 120);

  const result = {
    valid: allPresent,
    isCustom: true,
    elements: { house, tree, person },
    allPresent,
    reason,
    imageId: imageHash.slice(0, 16),
    model: parsed._model || '',
    message: allPresent
      ? '图片校验通过，已检测到房子、树、人物三种元素。'
      : '图片缺少房子、树、人物中的至少一种元素。'
  };

  setCachedImageValidation(imageHash, result);
  return result;
}

export async function validateImageSource(imageSource) {
  // 内置图片直接通过
  if (isBuiltinImage(imageSource)) {
    return {
      valid: true,
      isCustom: false,
      allPresent: true,
      elements: { house: true, tree: true, person: true },
      imageId: '',
      message: '内置房树人图像，可直接使用。'
    };
  }

  // blob地址无法校验
  if (String(imageSource || '').startsWith('blob:')) {
    return {
      valid: false,
      isCustom: true,
      allPresent: false,
      elements: { house: false, tree: false, person: false },
      imageId: '',
      message: '浏览器临时blob地址无法在服务端校验，请改为文件上传后生成的图片数据。'
    };
  }

  // data:image 格式，调用多模态校验
  if (isDataImage(imageSource)) {
    try {
      return await checkCustomImageWithBailian(imageSource);
    } catch (e) {
      return {
        valid: false,
        isCustom: true,
        allPresent: false,
        elements: { house: false, tree: false, person: false },
        imageId: '',
        message: `图片校验服务暂不可用：${e.message.slice(0, 120)}`
      };
    }
  }

  // 其他格式不合法
  return {
    valid: false,
    isCustom: false,
    allPresent: false,
    elements: { house: false, tree: false, person: false },
    imageId: '',
    message: '图片来源不合法。请选择内置图片，或上传包含房子、树、人物三要素的图片。'
  };
}
