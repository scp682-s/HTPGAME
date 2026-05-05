const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, WidthType, BorderStyle, ShadingType, VerticalAlign } = require('docx');
const fs = require('fs');

// 定义边框样式
const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

// 创建表头单元格
function createHeaderCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: "D9D9D9", type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20 })]
    })]
  });
}

// 创建普通单元格
function createCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text, size: 20 })]
    })]
  });
}

// 列宽定义（总宽度9360 DXA，即6.5英寸）
const colWidths = {
  序号: 600,
  AI工具: 1400,
  使用环节: 1600,
  关键提示词: 1800,
  AI回复: 1200,
  人工修改: 1200,
  采纳比例: 1560
};

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // 标题
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "中国大学生计算机设计大赛", bold: true, size: 32 })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [new TextRun({ text: "AI工具使用说明(2026年版)", bold: true, size: 28 })]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "作品编号：         作品名称：心宇宙重塑：房树人图像趣测", size: 22 })]
      }),

      // 表格
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: Object.values(colWidths),
        rows: [
          // 表头第一行
          new TableRow({
            children: [
              createHeaderCell("序号", colWidths.序号),
              createHeaderCell("AI工具的名称、版本、访问方式（网页、API或客户端），使用时间", colWidths.AI工具),
              createHeaderCell("使用AI工具的环节与目的（立项构思、文献综述、语言润色、内容生成、图表优化、代码编程、数据分析等）", colWidths.使用环节),
              createHeaderCell("关键提示词", colWidths.关键提示词),
              createHeaderCell("AI回复的关键内容（在此简要说明，并在附录中给出佐证）", colWidths.AI回复),
              createHeaderCell("AI回复的人工修改说明", colWidths.人工修改),
              createHeaderCell("采纳比例与说明", colWidths.采纳比例)
            ]
          }),

          // 数据行1
          new TableRow({
            children: [
              createCell("1", colWidths.序号),
              createCell("deepseek-chat，网页端，2026年2月15日 14:30-15:00", colWidths.AI工具),
              createCell("代码调试：解决房树人拼图游戏自动跳转到网易云音乐的问题", colWidths.使用环节),
              createCell("我的房树人拼图游戏为什么会自动跳转到网易云音乐，在我关闭了edge某个禁止自动跳转的选项之后，关闭前就是偶尔打不开网易云那个小窗口，不过现在手机上倒是挺正常的，自由打开", colWidths.关键提示词),
              createCell("AI分析了iframe加载网易云官网时的重定向问题，提供了三种解决方案：使用外链播放器、移除iframe、添加sandbox属性限制", colWidths.AI回复),
              createCell("采纳了方案二（移除网易云iframe），因为本地播放器功能已完整", colWidths.人工修改),
              createCell("AI生成内容为问题诊断和解决方案建议，非代码生成，采纳率100%", colWidths.采纳比例)
            ]
          }),

          // 数据行2
          new TableRow({
            children: [
              createCell("2", colWidths.序号),
              createCell("deepseek-chat，网页端，2026年3月8日 10:15-10:45", colWidths.AI工具),
              createCell("代码编程：将Flask后端改为Node.js实现，用于在Vercel上部署AI心理报告生成功能", colWidths.使用环节),
              createCell("这个flask我搞不明白，在vercel上部署的时候老是失败，换nodejs把", colWidths.关键提示词),
              createCell("AI提供了完整的Node.js后端实现方案，包括项目结构、API函数代码、环境变量配置、前端调用代码等", colWidths.AI回复),
              createCell("根据项目实际情况调整了API路径、环境变量配置，优化了错误处理逻辑", colWidths.人工修改),
              createCell("AI生成代码占后端总代码量的70%，经人工重构和调试后采纳率85%", colWidths.采纳比例)
            ]
          }),

          // 数据行3
          new TableRow({
            children: [
              createCell("3", colWidths.序号),
              createCell("deepseek-chat，网页端，2026年4月10日 16:50-17:15", colWidths.AI工具),
              createCell("技术选型：为心理疗愈和心理报告分析功能选择合适的免费大模型API", colWidths.使用环节),
              createCell("deepseek免费api接口推荐", colWidths.关键提示词),
              createCell("AI提供了详细的免费API对比表格，包括DeepSeek官方、NVIDIA NIM、阿里云百炼、百度千帆等平台的额度、限制和推荐度", colWidths.AI回复),
              createCell("根据项目需求选择了DeepSeek官方API作为主要方案，NVIDIA NIM作为备选", colWidths.人工修改),
              createCell("AI生成内容为技术调研和方案对比，非代码生成，采纳率100%", colWidths.采纳比例)
            ]
          })
        ]
      }),

      // 填写说明
      new Paragraph({
        spacing: { before: 480, after: 240 },
        children: [new TextRun({ text: "填写说明：", bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "1. 本文档适用于所有涉及AI工具使用的参赛作品，表格可另加行。", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "2. 参赛作品的作者，需根据实际的使用情况简明扼要地列出本作品所使用的全部AI工具的名称、版本、访问方式、使用时间、使用环节与目的、关键提示词、AI回复的关键内容、采纳和人工修改情况等。", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "3. AI回复的关键内容佐证材料，需作为本文档的附录2给出，包括但不限于：（1）关键操作截图（含时间戳，需清晰可辨）；（2）交互录屏视频（时长≤5分钟，需标注使用节点，文档为MP4格式，命名格式：AI_使用序号_作品编号.mp4）；（3）代码注释中标明AI辅助部分（如：// AI辅助生成：DeepSeek-R1-0528, 2025-11-03）", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "4. 提交时，需将本文档的PDF格式文件，以及其他佐证材料（如交互录屏视频），一并上传到作品文件夹的\"03设计与开发文档\"子文件夹中。", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "5. 本文档内容是正式参赛内容组成部分，需真实填写。如不属实，将导致奖项等级降低甚至终止本作品参加比赛。", size: 22 })]
      }),

      // 附录
      new Paragraph({
        spacing: { before: 240, after: 240 },
        children: [new TextRun({ text: "附录1：作品文件夹示例", bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "2026012345-参赛总文件夹", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "  ├── 2026012345-01作品与答辩材料", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "  ├── 2026012345-02素材与源码", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "  ├── 2026012345-03设计与开发文档", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "  └── 2026012345-04作品演示视频", size: 22 })]
      }),

      new Paragraph({
        spacing: { before: 240, after: 240 },
        children: [new TextRun({ text: "附录2：", bold: true, size: 24 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "序号1的佐证材料：", bold: true, size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "（请在此处插入截图或说明）", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "序号2的佐证材料：", bold: true, size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "（请在此处插入截图或说明）", size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: "序号3的佐证材料：", bold: true, size: 22 })]
      }),
      new Paragraph({
        spacing: { after: 240 },
        children: [new TextRun({ text: "（请在此处插入截图或说明）", size: 22 })]
      })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("4-AI工具使用说明（选用模板）（2026年版）_已填写.docx", buffer);
  console.log("文档已生成：4-AI工具使用说明（选用模板）（2026年版）_已填写.docx");
});
