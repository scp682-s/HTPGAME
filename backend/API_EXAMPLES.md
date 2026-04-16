# 其他AI API集成示例

## 1. 阿里云通义千问

```python
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import dashscope
from dashscope import Generation

app = Flask(__name__)
CORS(app)

# 设置API Key
dashscope.api_key = os.environ.get("QWEN_API_KEY")

SYSTEM_PROMPT = """你的系统提示词..."""

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.get_json()
        image_source = data.get("imageSource", "")
        
        # 验证图片来源
        if image_source.startswith("data:image") or image_source.startswith("blob:"):
            return jsonify({
                "error": "不支持分析用户上传的图片"
            }), 403
        
        game_data = data.get("gameData", {})
        
        user_message = f"""
用户选择的图片：{image_source}
游戏数据：{game_data}
请基于以上游戏行为数据生成心理分析报告。
"""
        
        # 调用通义千问API
        response = Generation.call(
            model='qwen-turbo',
            messages=[
                {'role': 'system', 'content': SYSTEM_PROMPT},
                {'role': 'user', 'content': user_message}
            ],
            result_format='message'
        )
        
        if response.status_code == 200:
            report = response.output.choices[0].message.content
            return jsonify({
                "success": True,
                "report": report
            }), 200
        else:
            return jsonify({
                "error": "生成报告失败",
                "message": response.message
            }), 500
            
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

**依赖安装**:
```bash
pip install dashscope
```

## 2. 智谱AI (ChatGLM)

```python
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from zhipuai import ZhipuAI

app = Flask(__name__)
CORS(app)

client = ZhipuAI(api_key=os.environ.get("ZHIPU_API_KEY"))

SYSTEM_PROMPT = """你的系统提示词..."""

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.get_json()
        image_source = data.get("imageSource", "")
        
        # 验证图片来源
        if image_source.startswith("data:image") or image_source.startswith("blob:"):
            return jsonify({
                "error": "不支持分析用户上传的图片"
            }), 403
        
        game_data = data.get("gameData", {})
        
        user_message = f"""
用户选择的图片：{image_source}
游戏数据：{game_data}
请基于以上游戏行为数据生成心理分析报告。
"""
        
        # 调用智谱AI
        response = client.chat.completions.create(
            model="glm-4",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        report = response.choices[0].message.content
        
        return jsonify({
            "success": True,
            "report": report
        }), 200
            
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

**依赖安装**:
```bash
pip install zhipuai
```

## 3. 百度文心一言

```python
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import qianfan

app = Flask(__name__)
CORS(app)

# 设置API Key
os.environ["QIANFAN_ACCESS_KEY"] = os.environ.get("QIANFAN_AK")
os.environ["QIANFAN_SECRET_KEY"] = os.environ.get("QIANFAN_SK")

SYSTEM_PROMPT = """你的系统提示词..."""

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.get_json()
        image_source = data.get("imageSource", "")
        
        # 验证图片来源
        if image_source.startswith("data:image") or image_source.startswith("blob:"):
            return jsonify({
                "error": "不支持分析用户上传的图片"
            }), 403
        
        game_data = data.get("gameData", {})
        
        user_message = f"""
用户选择的图片：{image_source}
游戏数据：{game_data}
请基于以上游戏行为数据生成心理分析报告。
"""
        
        # 调用文心一言
        chat_comp = qianfan.ChatCompletion()
        resp = chat_comp.do(
            model="ERNIE-Bot-4",
            messages=[
                {"role": "user", "content": SYSTEM_PROMPT + "\n\n" + user_message}
            ]
        )
        
        report = resp["result"]
        
        return jsonify({
            "success": True,
            "report": report
        }), 200
            
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

**依赖安装**:
```bash
pip install qianfan
```

## 4. OpenAI (需付费)

```python
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

SYSTEM_PROMPT = """你的系统提示词..."""

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.get_json()
        image_source = data.get("imageSource", "")
        
        # 验证图片来源
        if image_source.startswith("data:image") or image_source.startswith("blob:"):
            return jsonify({
                "error": "不支持分析用户上传的图片"
            }), 403
        
        game_data = data.get("gameData", {})
        
        user_message = f"""
用户选择的图片：{image_source}
游戏数据：{game_data}
请基于以上游戏行为数据生成心理分析报告。
"""
        
        # 调用OpenAI
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        report = response.choices[0].message.content
        
        return jsonify({
            "success": True,
            "report": report
        }), 200
            
    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

## API对比

| API | 免费额度 | 价格 | 中文能力 | 注册难度 | 推荐度 |
|-----|---------|------|---------|---------|--------|
| DeepSeek | 500万tokens | 1元/百万tokens | ⭐⭐⭐⭐⭐ | 简单 | ⭐⭐⭐⭐⭐ |
| 通义千问 | 100万tokens | 0.8元/千tokens | ⭐⭐⭐⭐⭐ | 中等 | ⭐⭐⭐⭐ |
| 智谱AI | 1000万tokens | 5元/百万tokens | ⭐⭐⭐⭐ | 简单 | ⭐⭐⭐⭐⭐ |
| 文心一言 | 有限 | 12元/千tokens | ⭐⭐⭐⭐⭐ | 中等 | ⭐⭐⭐ |
| OpenAI | 无 | $0.03/1K tokens | ⭐⭐⭐ | 困难 | ⭐⭐ |

## 推荐使用顺序

1. **DeepSeek** - 最推荐，免费额度多，价格便宜，中文好
2. **智谱AI** - 免费额度最多，适合开发测试
3. **通义千问** - 阿里云背书，稳定可靠
4. **文心一言** - 百度出品，中文能力强但价格较高
5. **OpenAI** - 需要国际信用卡，不推荐国内使用
