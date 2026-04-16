import os
from flask import Flask, request, jsonify
from openai import OpenAI

# 初始化Flask应用
app = Flask(__name__)

# 初始化OpenAI客户端 (DeepSeek API)
# 注意：这里读取了名为 'DEEPSEEK_API_KEY' 的环境变量
client = OpenAI(
    api_key=os.environ.get("DEEPSEEK_API_KEY"),
    base_url="https://api.deepseek.com"
)

@app.route('/api/generate-report', methods=['POST'])
def generate_report():
    # 1. 从请求中获取前端传来的游戏数据
    data = request.get_json()
    user_data = data.get("gameData", "用户没有提供游戏数据")

    # 2. 定义系统指令（System Prompt）
    system_prompt = """
# 角色
你是一位经验丰富、富有同理心的专业儿童心理分析师，擅长通过房树人（HTP）测验解读绘画者的心理状态，并生成专业、易懂、支持性的评估报告。

# 任务
我将提供一段用户在拼图游戏中的行为数据，数据包含其[拼图的整体布局、房屋、树木和人物的完成顺序、每块拼图放置的时间间隔，以及对某一部分的修改次数]。
请你仔细分析这些行为数据，并生成一份包含以下四个部分的心理评估报告。

# 报告结构与分析要求
请严格遵循以下结构生成报告：

1. **整体观察**：分析用户的整体完成时间、拼图过程中的犹豫程度（由时间间隔推断）和整体情绪倾向。
2. **细节解读**：
   - **房屋**：分析其结构稳定性、复杂性，投射用户对“家庭”的看法和安全感。
   - **树木**：分析其生命力、树冠与树干的比例等，反映用户的成长状态和内在生命力。
   - **人物**：分析其完整性、情绪表达，投射用户的自我认知和人际状态。
3. **核心洞察**：整合整体和细节信息，总结用户当前最主要的心理特征、情绪状态或潜在需求（2-3个要点）。
4. **温馨建议**：基于以上分析，提供1-2条具体、可操作、积极正向的引导或鼓励。

# 输出格式
请以Markdown格式输出报告，使用友好的语气，避免使用任何诊断性术语，强调“观察”和“可能反映了”。不要出现可能引发焦虑或贴标签的词汇。
"""

    # 3. 调用 DeepSeek API
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_data}
            ],
            stream=False
        )
        report = response.choices[0].message.content
        return jsonify({"report": report}), 200
    except Exception as e:
        # 如果出错，返回错误信息
        return jsonify({"error": str(e)}), 500