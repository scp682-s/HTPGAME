import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, WidthType, BorderStyle, VerticalAlign } from 'docx';
import fs from 'fs';

// 创建文档
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Arial", size: 24 } // 12pt
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
          new TextRun({ text: "中国大学生计算机设计大赛", bold: true, size: 32 })
        ],
        spacing: { after: 200 }
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "AI工具使用说明(2026年版)", bold: true, size: 28 })
        ],
        spacing: { after: 400 }
      }),

      // 作品信息
      new Paragraph({
        children: [
          new TextRun({ text: "作品编号：                作品名称：心宇宙重塑：房树人图像趣测" })
        ],
        spacing: { after: 400 }
      }),

      // 表格
      createAIUsageTable(),

      // 填写说明
      new Paragraph({
        children: [new TextRun({ text: "填写说明：", bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "1. 本文档适用于所有涉及AI工具使用的参赛作品，表格可另加行。" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "2. 参赛作品的作者，需根据实际的使用情况简明扼要地列出本作品所使用的全部AI工具的名称、版本、访问方式、使用时间、使用环节与目的、关键提示词、AI回复的关键内容、采纳和人工修改情况等。" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "3. AI回复的关键内容佐证材料，需作为本文档的附录2给出，包括但不限于：（1）关键操作截图（含时间戳，需清晰可辨）；（2）交互录屏视频（时长≤5分钟，需标注使用节点，文档为MP4格式，命名格式：AI_使用序号_作品编号.mp4）；（3）代码注释中标明AI辅助部分（如：// AI辅助生成：DeepSeek-R1-0528, 2025-11-03）" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "4. 提交时，需将本文档的PDF格式文件，以及其他佐证材料（如交互录屏视频），一并上传到作品文件夹的\"03设计与开发文档\"子文件夹中。" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "5. 本文档内容是正式参赛内容组成部分，需真实填写。如不属实，将导致奖项等级降低甚至终止本作品参加比赛。" })],
        spacing: { after: 400 }
      }),

      // 附录1
      new Paragraph({
        children: [new TextRun({ text: "附录1：作品文件夹示例", bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "2026012345-参赛总文件夹" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "├── 2026012345-01作品与答辩材料" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "├── 2026012345-02素材与源码" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "├── 2026012345-03设计与开发文档" })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "└── 2026012345-04作品演示视频" })],
        spacing: { after: 400 }
      }),

      // 附录2
      new Paragraph({
        children: [new TextRun({ text: "附录2：", bold: true })],
        spacing: { before: 400, after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "序号1的佐证材料：", bold: true })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "见代码文件 api_backup/generate_report.js 第1-196行，使用DeepSeek API生成心理报告的完整实现代码。" })],
        spacing: { after: 200 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "序号2的佐证材料：", bold: true })],
        spacing: { after: 100 }
      }),
      new Paragraph({
        children: [new TextRun({ text: "见代码文件 image_validator.js 第157-239行，使用阿里云百炼多模态视觉模型进行图片要素校验的完整实现代码。" })],
        spacing: { after: 200 }
      }),
    ]
  }]
});

function createAIUsageTable() {
  const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const borders = { top: border, bottom: border, left: border, right: border };

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [600, 1800, 1800, 1500, 1200, 1200, 1260],
    rows: [
      // 表头
      new TableRow({
        children: [
          createHeaderCell("序号", 600),
          createHeaderCell("AI工具的名称、版本、访问方式（网页、API或客户端），使用时间", 1800),
          createHeaderCell("使用AI工具的环节与目的（立项构思、文献综述、语言润色、内容生成、图表优化、代码编程、数据分析等）", 1800),
          createHeaderCell("关键提示词", 1500),
          createHeaderCell("AI回复的关键内容（在此简要说明，并在附录中给出佐证）", 1200),
          createHeaderCell("AI回复的人工修改说明", 1200),
          createHeaderCell("采纳比例与说明", 1260),
        ]
      }),
      // 第1行数据
      new TableRow({
        children: [
          createDataCell("1", 600),
          createDataCell("DeepSeek API (deepseek-chat模型)，API调用方式，2025年10月-2026年4月", 1800),
          createDataCell("代码编程：生成心理报告分析内容。基于用户的房树人拼图行为数据（完成时间、步数、修改次数等），调用AI生成个性化的心理特质分析报告。", 1800),
          createDataCell("你是高校心理健康教育场景中的心理学科普助手，服务对象是大学生。你的工作是基于房树人主题拼图行为数据，给出温和、可执行、非诊断的心理观察与自我觉察建议。【本次拼图行为数据】- 图片主题：${image_name} - 拼图难度：${grid_size} x ${grid_size} - 完成用时：${minutes}分${seconds}秒 - 总步数：${moves} - 修改次数：${modification_count}...", 1500),
          createDataCell("AI返回HTML格式的心理分析报告，包含：游戏数据表格、游戏表现概述、心理特质分析、成长建议四个部分，字数约500字。", 1200),
          createDataCell("对AI生成的提示词模板进行了多次迭代优化，添加了近期行为数据摘要、样本有限提示、禁止医学诊断等约束条件，使报告更符合大学生心理健康教育场景。", 1200),
          createDataCell("提示词模板由人工设计并多次优化，AI生成的报告内容直接采纳，采纳率100%。代码实现部分人工编写占80%，AI辅助占20%。", 1260),
        ]
      }),
      // 第2行数据
      new TableRow({
        children: [
          createDataCell("2", 600),
          createDataCell("阿里云百炼/通义千问视觉模型 (qwen-vl-max, qwen-vl-plus)，API调用方式，2025年11月-2026年4月", 1800),
          createDataCell("代码编程：图片内容校验。用户上传自定义图片后，调用多模态视觉AI判断图片是否同时包含\"房子、树、人物\"三个要素，确保符合房树人心理测验要求。", 1800),
          createDataCell("你是图片要素审核器。任务：判断图片中是否同时存在\"房子、树、人物\"三种元素。只输出JSON，不要任何解释性文字。请判断图片是否包含以下元素：house(房子)、tree(树)、person(人物)。输出JSON格式：{\\\"house\\\":true/false,\\\"tree\\\":true/false,\\\"person\\\":true/false,\\\"all_present\\\":true/false,\\\"reason\\\":\\\"不超过40字\\\"}", 1500),
          createDataCell("AI返回JSON格式的校验结果，包含house、tree、person三个布尔值，all_present总体判断，以及reason说明（如\\\"图片包含房子、树木和人物\\\"或\\\"缺少人物元素\\\"）。", 1200),
          createDataCell("添加了图片大小限制（4MB）、缓存机制（1小时）、多模型降级策略（qwen-vl-max失败后尝试qwen-vl-plus）、JSON解析容错等工程化改进。", 1200),
          createDataCell("核心校验逻辑由AI完成，采纳率100%。周边工程代码（缓存、降级、错误处理）人工编写占70%，AI辅助占30%。", 1260),
        ]
      }),
    ]
  });
}

function createHeaderCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
    shading: { fill: "D9D9D9", type: 0 },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
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
    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, left: { style: BorderStyle.SINGLE, size: 1, color: "000000" }, right: { style: BorderStyle.SINGLE, size: 1, color: "000000" } },
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        children: [new TextRun({ text, size: 20 })]
      })
    ]
  });
}

// 生成文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("4-AI工具使用说明（选用模板）（2026年版）_已填写.docx", buffer);
  console.log("文档生成成功！");
});
