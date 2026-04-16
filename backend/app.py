import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 初始化Flask应用
app = Flask(__name__)
CORS(app)  # 允许跨域请求

# 延迟初始化客户端
client = None

def get_client():
    """获取或创建OpenAI客户端"""
    global client
    if client is None:
        client = OpenAI(
            api_key=os.environ.get("DEEPSEEK_API_KEY"),
            base_url="https://api.deepseek.com"
        )
    return client

# 系统提示词
SYSTEM_PROMPT = """
# 角色
你是一位经验丰富、富有同理心的专业儿童心理分析师，擅长通过房树人（HTP）测验解读绘画者的心理状态，并生成专业、易懂、支持性的评估报告。

# 任务
我将提供一段用户在拼图游戏中的行为数据，数据包含其[拼图的整体布局、房屋、树木和人物的完成顺序、每块拼图放置的时间间隔，以及对某一部分的修改次数]。
请你仔细分析这些行为数据，并生成一份包含以下四个部分的心理评估报告。

# 重要限制
**严格禁止**：不得对用户上传的自定义图片进行任何分析或评论。只能分析游戏提供的四张标准房树人图像（photo/1.png, photo/2.png, photo/3.jpg, photo/4.jpg）以及用户在拼图过程中的操作行为数据。

# 报告结构与分析要求
请严格遵循以下结构生成报告：

1. **整体观察**：分析用户的整体完成时间、拼图过程中的犹豫程度（由时间间隔推断）和整体情绪倾向。
2. **细节解读**：
   - **房屋**：分析其结构稳定性、复杂性，投射用户对"家庭"的看法和安全感。
   - **树木**：分析其生命力、树冠与树干的比例等，反映用户的成长状态和内在生命力。
   - **人物**：分析其完整性、情绪表达，投射用户的自我认知和人际状态。
3. **核心洞察**：整合整体和细节信息，总结用户当前最主要的心理特征、情绪状态或潜在需求（2-3个要点）。
4. **温馨建议**：基于以上分析，提供1-2条具体、可操作、积极正向的引导或鼓励。

# 输出格式
请以Markdown格式输出报告，使用友好的语气，避免使用任何诊断性术语，强调"观察"和"可能反映了"。不要出现可能引发焦虑或贴标签的词汇。
"""

# 允许分析的图片列表（只有这些图片可以被分析）
ALLOWED_IMAGES = [
    'photo/1.png',
    'photo/2.png',
    'photo/3.jpg',
    'photo/4.jpg'
]

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查接口"""
    return jsonify({"status": "ok", "message": "Backend is running"}), 200

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    """生成心理分析报告"""
    try:
        # 1. 获取请求数据
        data = request.get_json()

        if not data:
            return jsonify({"error": "请求数据为空"}), 400

        # 2. 验证图片来源（重要安全检查）
        image_source = data.get("imageSource", "")

        # 检查是否为用户上传的图片
        if image_source.startswith("data:image") or image_source.startswith("blob:"):
            return jsonify({
                "error": "不支持分析用户上传的图片",
                "message": "为保护隐私和确保分析准确性，本系统仅支持分析游戏提供的标准房树人图像。"
            }), 403

        # 检查是否为允许的图片
        if image_source not in ALLOWED_IMAGES:
            return jsonify({
                "error": "图片来源不合法",
                "message": "只能分析游戏提供的四张标准房树人图像。"
            }), 403

        # 3. 获取游戏数据
        game_data = data.get("gameData", {})

        if not game_data:
            return jsonify({"error": "游戏数据为空"}), 400

        # 4. 构建用户消息
        user_message = f"""
用户选择的图片：{image_source}

游戏数据：
- 完成时间：{game_data.get('completionTime', '未知')}
- 移动步数：{game_data.get('moveCount', 0)}
- 难度等级：{game_data.get('difficulty', '未知')}
- 拼图顺序：{game_data.get('pieceOrder', '未记录')}
- 操作时间间隔：{game_data.get('timeIntervals', '未记录')}
- 修改次数：{game_data.get('modificationCount', 0)}

请基于以上游戏行为数据生成心理分析报告。
"""

        # 5. 调用DeepSeek API
        api_client = get_client()
        response = api_client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_message}
            ],
            stream=False,
            temperature=0.7,
            max_tokens=2000
        )

        report = response.choices[0].message.content

        # 6. 返回结果
        return jsonify({
            "success": True,
            "report": report,
            "imageSource": image_source,
            "timestamp": time.time()
        }), 200

    except Exception as e:
        app.logger.error(f"生成报告时出错: {str(e)}")
        return jsonify({
            "error": "生成报告失败",
            "message": str(e)
        }), 500

@app.route('/api/validate-image', methods=['POST'])
def validate_image():
    """验证图片是否可以被分析"""
    try:
        data = request.get_json()
        image_source = data.get("imageSource", "")

        # 检查是否为用户上传的图片
        if image_source.startswith("data:image") or image_source.startswith("blob:"):
            return jsonify({
                "valid": False,
                "message": "不支持分析用户上传的图片"
            }), 200

        # 检查是否为允许的图片
        if image_source in ALLOWED_IMAGES:
            return jsonify({
                "valid": True,
                "message": "图片可以被分析"
            }), 200
        else:
            return jsonify({
                "valid": False,
                "message": "只能分析游戏提供的标准房树人图像"
            }), 200

    except Exception as e:
        return jsonify({
            "error": "验证失败",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # 检查API密钥
    if not os.environ.get("DEEPSEEK_API_KEY"):
        print("警告: 未设置 DEEPSEEK_API_KEY 环境变量")

    # 启动服务器
    app.run(host='0.0.0.0', port=5000, debug=True)
