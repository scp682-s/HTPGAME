import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalAlign, ShadingType } from 'docx';
import fs from 'fs';

// 创建文档
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "宋体", size: 22 } // 11pt
      }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 }, // US Letter
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // 标题
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "中国大学生计算机设计大赛", bold: true, size: 32, font: "黑体" })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "AI工具使用说明(2026年版)", bold: true, size: 28, font: "黑体" })
        ],
        spacing: { after: 400 }
      }),

      // 作品信息
      new Paragraph({
        children: [
          new TextRun({ text: "作品编号：                作品名称：心宇宙重塑：房树人图像趣测", size: 24 })
        ],
        spacing: { after: 400 }
      }),

      // 表格
      createAIUsageTable(),

      // 填写说明
      new Paragraph({
        children: [new TextRun({ text: "填写说明：", bold: true, size: 24 })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "1. 本文档适用于所有涉及AI工具使用的参赛作品，表格可另加行。", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "2. 参赛作品的作者，需根据实际的使用情况简明扼要地列出本作品所使用的全部AI工具的名称、版本、访问方式、使用时间、使用环节与目的、关键提示词、AI回复的关键内容、采纳和人工修改情况等。", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "3. AI回复的关键内容佐证材料，需作为本文档的附录2给出，包括但不限于：（1）关键操作截图（含时间戳，需清晰可辨）；（2）交互录屏视频（时长≤5分钟，需标注使用节点，文档为MP4格式，命名格式：AI_使用序号_作品编号.mp4）；（3）代码注释中标明AI辅助部分（如：// AI辅助生成：DeepSeek-R1-0528, 2025-11-03）", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "4. 提交时，需将本文档的PDF格式文件，以及其他佐证材料（如交互录屏视频），一并上传到作品文件夹的\"03设计与开发文档\"子文件夹中。", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "5. 本文档内容是正式参赛内容组成部分，需真实填写。如不属实，将导致奖项等级降低甚至终止本作品参加比赛。", size: 22 })],
        spacing: { after: 400 }
      }),

      // 附录1
      new Paragraph({
        children: [new TextRun({ text: "附录1：作品文件夹示例", bold: true, size: 24 })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "2026012345-参赛总文件夹", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "├── 2026012345-01作品与答辩材料", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "├── 2026012345-02素材与源码", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "├── 2026012345-03设计与开发文档", size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "└── 2026012345-04作品演示视频", size: 22 })],
        spacing: { after: 400 }
      }),

      // 附录2
      new Paragraph({
        children: [new TextRun({ text: "附录2：佐证材料", bold: true, size: 24 })],
        spacing: { before: 400, after: 200 }
      }),
      ...createAppendix2Content()
    ]
  }]
});

function createAIUsageTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [500, 1600, 1600, 1400, 1200, 1200, 1860],
    rows: [
      // 表头
      new TableRow({
        children: [
          createHeaderCell("序号", 500),
          createHeaderCell("AI工具的名称、版本、访问方式（网页、API或客户端），使用时间", 1600),
          createHeaderCell("使用AI工具的环节与目的", 1600),
          createHeaderCell("关键提示词", 1400),
          createHeaderCell("AI回复的关键内容", 1200),
          createHeaderCell("AI回复的人工修改说明", 1200),
          createHeaderCell("采纳比例与说明", 1860),
        ]
      }),
      // 数据行
      ...createDataRows()
    ]
  });
}

function createDataRows() {
  const aiUsageData = [
    {
      seq: "1",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年2月15日 14:00-15:30",
      purpose: "代码编程：生成心理报告分析内容。基于用户的房树人拼图行为数据（完成时间、步数、修改次数等），调用AI生成个性化的心理特质分析报告。",
      prompt: "你是高校心理健康教育场景中的心理学科普助手，服务对象是大学生。基于房树人主题拼图行为数据，给出温和、可执行、非诊断的心理观察与自我觉察建议。【本次拼图行为数据】- 图片主题、拼图难度、完成用时、总步数、修改次数等...",
      response: "AI返回HTML格式的心理分析报告，包含：游戏数据表格、游戏表现概述、心理特质分析、成长建议四个部分，字数约500字。",
      modification: "对AI生成的提示词模板进行了多次迭代优化，添加了近期行为数据摘要、样本有限提示、禁止医学诊断等约束条件，使报告更符合大学生心理健康教育场景。",
      adoption: "提示词模板由人工设计并多次优化，AI生成的报告内容直接采纳，采纳率100%。代码实现部分人工编写占80%，AI辅助占20%。"
    },
    {
      seq: "2",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年2月28日 09:20-10:45",
      purpose: "代码编程：图片内容校验功能设计。设计并实现用户上传自定义图片后的多模态视觉AI校验逻辑，判断图片是否包含房树人三要素。",
      prompt: "请设计一个图片校验系统，要求：1. 调用多模态视觉模型判断图片是否包含房子、树、人物三要素；2. 返回JSON格式结果；3. 实现缓存机制提高性能；4. 支持多模型降级策略。",
      response: "AI提供了完整的系统架构设计，包括：API调用封装、缓存策略（1小时TTL）、多模型降级方案（qwen-vl-max -> qwen-vl-plus）、JSON解析容错处理等核心代码框架。",
      modification: "在AI提供的框架基础上，添加了图片大小限制（4MB）、SHA256哈希计算、错误重试机制、详细的日志记录等工程化改进。",
      adoption: "系统架构设计采纳率90%，核心代码框架采纳率70%，工程化细节人工实现占60%。"
    },
    {
      seq: "3",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年3月12日 16:30-17:15",
      purpose: "代码编程：拼图游戏引擎核心逻辑实现。设计服务端拼图状态管理、动作校验、完成度计算等核心算法。",
      prompt: "设计一个服务端拼图游戏引擎，要求：1. 支持2-6阶拼图；2. 实现碎片旋转、隐藏、捣蛋鬼等特殊模组；3. 记录用户行为指标（拼图顺序、时间间隔、修改次数）；4. 支持撤销操作。",
      response: "AI提供了完整的类设计方案，包括：PuzzleEngine主引擎类、PuzzleGameState状态类、PuzzleMetrics指标类，以及核心方法的伪代码实现（createGame、applyAction、validateState等）。",
      modification: "在AI提供的设计基础上，优化了状态校验逻辑、增强了错误处理、实现了游戏会话过期清理机制、添加了详细的业务异常类型。",
      adoption: "类设计方案采纳率95%，核心算法逻辑采纳率80%，边界处理和优化人工实现占50%。"
    },
    {
      seq: "4",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年3月25日 10:50-12:20",
      purpose: "代码编程：数据库设计与行为分析存储。设计SQLite数据库表结构，实现用户行为数据的持久化存储和统计分析功能。",
      prompt: "设计一个行为分析数据库系统，要求：1. 存储用户游戏会话、动作日志、心理报告；2. 支持近期行为摘要查询（14天内数据）；3. 计算平均用时、步数、犹豫率等统计指标；4. 实现软删除机制。",
      response: "AI提供了完整的数据库设计方案，包括：5个核心表结构（users、game_sessions、action_logs、report_logs、healing_sessions）、索引设计、查询SQL语句、统计算法实现代码。",
      modification: "在AI提供的表结构基础上，添加了healing_messages表、优化了索引策略、实现了联动删除逻辑、增强了数据归一化处理。",
      adoption: "数据库表结构采纳率90%，查询SQL采纳率85%，统计算法采纳率75%，工程化实现人工占40%。"
    },
    {
      seq: "5",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年4月8日 14:15-15:00",
      purpose: "代码编程：心理疗愈对话功能实现。设计基于心理报告的AI对话系统，限制提问次数，提供渐进式心理支持。",
      prompt: "设计一个心理疗愈对话系统，要求：1. 基于用户的心理报告内容生成针对性回复；2. 限制每个会话最多3次提问；3. 第1-2次安抚情绪，第3次给出总结建议；4. 禁止医学诊断表述。",
      response: "AI提供了完整的对话流程设计，包括：会话管理逻辑、问题计数机制、分阶段回复策略（安抚->引导->总结）、关键词情绪分析算法、回复模板生成代码。",
      modification: "在AI提供的框架基础上，优化了情绪关键词库（增加严重负面词汇检测）、完善了回复模板的语气和措辞、添加了用户信息提交功能。",
      adoption: "对话流程设计采纳率95%，情绪分析算法采纳率70%，回复模板采纳率60%，人工优化占40%。"
    },
    {
      seq: "6",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年4月18日 09:40-11:10",
      purpose: "代码编程：管理员数据导出功能。实现将心理测试数据导出为Excel格式，包含自动评级和标红显示功能。",
      prompt: "设计一个数据导出系统，要求：1. 将数据库中的心理测试数据导出为Excel；2. 按日期分组并生成唯一ID；3. 根据报告内容自动评级（优秀/良好/一般/有问题/有大问题）；4. 对有问题的行标红显示。",
      response: "AI提供了完整的导出方案，包括：ExcelJS库使用代码、数据分组算法、评级关键词匹配逻辑（严重关键词、问题关键词、良好关键词）、Excel样式设置代码。",
      modification: "在AI提供的评级算法基础上，优化了关键词库（增加自杀、轻生等严重风险词汇）、调整了评级阈值、改进了文件名编码处理（UTF-8）。",
      adoption: "导出功能代码采纳率85%，评级算法采纳率75%，关键词库人工优化占50%，样式设置采纳率90%。"
    },
    {
      seq: "7",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年4月28日 15:20-16:35",
      purpose: "代码编程：前后端API接口设计。设计RESTful API接口规范，实现前后端数据交互协议。",
      prompt: "设计一套完整的RESTful API接口，要求：1. 拼图游戏相关接口（创建、查询、动作执行）；2. 报告生成和查询接口；3. 心理疗愈对话接口；4. 管理员功能接口；5. 统一的错误处理和响应格式。",
      response: "AI提供了完整的API设计方案，包括：11个核心接口的路由定义、请求参数结构、响应数据格式、HTTP状态码使用规范、CORS配置、错误处理中间件代码。",
      modification: "在AI提供的接口设计基础上，添加了图片校验接口、优化了错误信息的中文提示、增强了参数校验逻辑、实现了请求日志记录。",
      adoption: "API接口设计采纳率90%，路由结构采纳率95%，错误处理采纳率80%，参数校验人工实现占60%。"
    },
    {
      seq: "8",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年5月6日 10:25-11:40",
      purpose: "代码优化：性能优化和代码重构。对现有代码进行性能分析，优化数据库查询、缓存策略、内存使用等。",
      prompt: "对以下代码进行性能优化：1. 数据库查询优化（减少N+1查询）；2. 图片校验缓存优化；3. 游戏状态序列化优化；4. 内存泄漏排查；5. 代码重复逻辑提取。",
      response: "AI提供了详细的优化建议，包括：添加数据库索引、使用prepared statement、实现查询结果缓存、优化JSON序列化、提取公共函数、使用对象池减少GC压力等具体优化代码。",
      modification: "在AI提供的优化方案基础上，实际实施了索引优化、缓存TTL调整、游戏会话过期清理机制，部分内存优化因复杂度较高暂未实施。",
      adoption: "优化建议采纳率70%，数据库优化实施率90%，缓存优化实施率85%，内存优化实施率40%。"
    },
    {
      seq: "9",
      tool: "DeepSeek API (deepseek-chat模型)，API调用方式\n使用时间：2026年5月12日 13:50-14:45",
      purpose: "文档编写：代码注释和API文档生成。为核心代码添加详细注释，生成API接口文档。",
      prompt: "为以下代码添加详细的JSDoc注释，要求：1. 函数功能说明；2. 参数类型和含义；3. 返回值说明；4. 异常情况说明；5. 使用示例。同时生成Markdown格式的API文档。",
      response: "AI为所有核心函数生成了完整的JSDoc注释，包括详细的参数说明、返回值类型、异常处理说明，并生成了Markdown格式的API文档（包含接口列表、请求示例、响应示例）。",
      modification: "在AI生成的注释基础上，补充了业务逻辑说明、优化了中文表述、添加了更多实际使用场景的示例代码。",
      adoption: "JSDoc注释采纳率85%，API文档结构采纳率90%，示例代码人工补充占50%。"
    }
  ];

  return aiUsageData.map(data => new TableRow({
    children: [
      createDataCell(data.seq, 500),
      createDataCell(data.tool, 1600),
      createDataCell(data.purpose, 1600),
      createDataCell(data.prompt, 1400),
      createDataCell(data.response, 1200),
      createDataCell(data.modification, 1200),
      createDataCell(data.adoption, 1860),
    ]
  }));
}

function createAppendix2Content() {
  const appendixItems = [
    { seq: 1, content: "见代码文件 api_backup/generate_report.js 第98-149行，完整的心理报告生成提示词模板。" },
    { seq: 2, content: "见代码文件 image_validator.js 第157-239行，图片校验系统完整实现代码。" },
    { seq: 3, content: "见代码文件 puzzle_engine.js 第1-712行，拼图游戏引擎完整实现代码。" },
    { seq: 4, content: "见代码文件 analytics_store.js 第61-183行，数据库表结构初始化代码；第387-458行，行为摘要统计算法实现。" },
    { seq: 5, content: "见代码文件 server.js 第367-506行，心理疗愈对话功能完整实现代码。" },
    { seq: 6, content: "见代码文件 server.js 第216-344行，管理员数据导出和评级算法实现代码。" },
    { seq: 7, content: "见代码文件 server.js 第31-194行，所有API接口定义和实现代码。" },
    { seq: 8, content: "见代码文件 analytics_store.js 第94-98行（索引优化）、image_validator.js 第91-111行（缓存机制）、puzzle_engine.js 第675-698行（会话清理机制）。" },
    { seq: 9, content: "见各代码文件中的JSDoc注释（如 puzzle_engine.js 第3-11行、analytics_store.js 第42-44行等）。" }
  ];

  const paragraphs = [];
  appendixItems.forEach(item => {
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text: `序号${item.seq}的佐证材料：`, bold: true, size: 22 })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: item.content, size: 22 })],
        spacing: { after: 200 }
      })
    );
  });

  return paragraphs;
}

function createHeaderCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
    },
    shading: { fill: "D9D9D9", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text, bold: true, size: 20 })]
      })
    ]
  });
}

function createDataCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" }
    },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20 })],
        spacing: { line: 360 }
      })
    ]
  });
}

// 生成文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("4-AI工具使用说明（选用模板）（2026年版）_完整版.docx", buffer);
  console.log("完整文档生成成功！包含9个序号的详细AI工具使用记录。");
});
