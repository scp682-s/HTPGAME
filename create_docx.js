const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType,
        PageBreak, TableOfContents } = require('docx');
const fs = require('fs');

// 定义边框样式
const border = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const borders = { top: border, bottom: border, left: border, right: border };

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "宋体", size: 24 } // 12pt 默认
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "黑体" },
        paragraph: {
          spacing: { before: 240, after: 240 },
          outlineLevel: 0,
          alignment: AlignmentType.CENTER
        }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 28, bold: true, font: "黑体" },
        paragraph: {
          spacing: { before: 180, after: 180 },
          outlineLevel: 1
        }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "黑体" },
        paragraph: {
          spacing: { before: 160, after: 160 },
          outlineLevel: 2
        }
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: {
          width: 11906,   // A4宽度
          height: 16838   // A4高度
        },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    children: [
      // 封面
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 240 },
        children: [new TextRun({ text: "中国大学生计算机设计大赛", size: 36, bold: true, font: "黑体" })]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 1440 },
        children: [new TextRun({ text: "软件开发类作品文档简要要求", size: 32, bold: true, font: "黑体" })]
      }),

      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: "作品编号：　　　　　　　　　　　　　　　　　　　", size: 28, font: "宋体" })]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "作品名称：　　　　心宇宙重塑：房树人图像趣拼　　　", size: 28, font: "宋体" })]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "作　　者：　　　　　曾帅洋　蹇佳成　梁杰　　　　", size: 28, font: "宋体" })]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "版本编号：　　　　　   V 1.0　　　　 　　　　", size: 28, font: "宋体" })]
      }),

      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: "填写日期：", size: 28, font: "宋体" })]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 1440 },
        children: [new TextRun({ text: "2026/3/31", size: 28, font: "宋体" })]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // 目录
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("目录")]
      }),

      new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-3" }),

      new Paragraph({ children: [new PageBreak()] }),

      // 第一章 需求分析
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第一章 需求分析")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("在社会经济高速发展的当下，生活节奏加快、竞争压力增大，心理健康问题已成为全球性社会热点。根据世界卫生组织（WHO）2025年9月发布的最新数据，全球超过10亿人患有精神障碍，每7人中就有1人受其困扰，其中焦虑症和抑郁症最为常见，仅2021年全球就有3.59亿焦虑症患者和2.8亿抑郁症患者，且这类疾病已成为导致长期残疾的第二大原因，给个人和社会带来巨大负担。")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("聚焦我国，心理健康问题同样形势严峻。《2023年度中国精神心理健康》蓝皮书数据显示，中国成人抑郁风险检出率达 10.6%；国际权威期刊《英国精神病学杂志》2025 年 1 月发布的研究表明，1990-2021年间，我国抑郁症患病人数增幅达54%，从3440万跃升至 5310 万，焦虑症患病人数增幅为 31.2%，其中 10-19 岁青少年焦虑患病率达 4.5%，为各年龄组最高，55 岁以上老年人抑郁率达 6.5%，是总人群的 1.7 倍。此外，最新调查显示我国成年人各类精神疾病（不包含痴呆）的终生患病率为 16.6%，由精神障碍造成的疾病负担占所有非传染性疾病负担的 13%，但接受正规治疗的患者比例不足10%。")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("但传统心理健康服务面临诸多瓶颈：专业心理咨询资源稀缺且服务门槛高，普通大众难以获得便捷、低成本的心理支持；经典的房树人测验（HTP）作为投射性心理评估工具，虽能通过房屋、树木、人物三元素的绘画分析，揭示个体潜意识中的自我概念、情感状态与人际关系模式，且已有研究证实其 50 项绘画特征中 39 项可显著预测精神障碍，具备科学的评估基础，但该测验依赖专业分析师解读，存在评估标准主观、解读周期长等问题，无法满足大众日常化、轻量化的心理调节需求。")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("与此同时，游戏化疗愈已成为心理健康服务的重要发展方向。北京师范大学相关研究指出，游戏作为直接作用于人类心理、情绪与认知的媒介形式，在缓解焦虑、改善注意力缺失等方面已展现出明确且显著的干预效果，全球已有 10 款数字疗法游戏获批用于治疗焦虑、抑郁等疾病。拼图游戏作为其中的典型代表，其疗愈价值已得到实证支撑——Mind Lab International 2017年的研究显示，拼图可使压力水平降低28%，印度一项 2026 年 3 月发布的随机临床试验也证实，拼图游戏能有效降低儿童在医疗操作中的焦虑和疼痛感。但现有拼图类产品多以娱乐为核心，缺乏心理学理论支撑，仅能满足休闲需求，无法实现心理减压与自我觉察的深层价值。")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("在此背景下，将房树人测验的心理学内核与拼图游戏的互动性、娱乐性相结合，开发一款兼具趣味性与心理疗愈功能的软件，成为解决大众日常心理健康需求的有效途径。")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("现经调研显示,目前市面上存在的传统网页拼图游戏存在题材单一、缺乏心理学价值、难度固定、移动端体验差、隐私保护不足等问题,分析结果如表 1所示。")]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "表 1 竞品分析", bold: true })]
      }),

      // 竞品分析表格
      new Table({
        width: { size: 9026, type: WidthType.DXA },
        columnWidths: [2256, 3385, 3385],
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "对比维度", bold: true })]
                })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "竞品（传统网页拼图）", bold: true })]
                })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [new TextRun({ text: "本作品", bold: true })]
                })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("题材特色")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("网络图片、游戏图片")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("房树人心理投射主题图")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("心理学价值")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("无心理学理论支撑")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("深度融合HTP测验理论")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("难度灵活性")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("固定难度或少量选项")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("多级难度+三种增强词条")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("图片来源")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("固定内置图片")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("内置主题图+自定义上传")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("隐私保护")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("需上传服务器")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("纯前端处理，本地运行")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("移动端体验")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("PC移植，操作不便")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("原生触摸交互设计")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("使用门槛")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("需搜索、可能注册")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("打开网址即用")] })]
              }),
            ]
          }),
          new TableRow({
            children: [
              new TableCell({
                borders,
                width: { size: 2256, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("心理引导")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("无")] })]
              }),
              new TableCell({
                borders,
                width: { size: 3385, type: WidthType.DXA },
                margins: { top: 80, bottom: 80, left: 120, right: 120 },
                children: [new Paragraph({ children: [new TextRun("内置问卷，引导自我觉察")] })]
              }),
            ]
          }),
        ]
      }),

      new Paragraph({ children: [new PageBreak()] }),

      // 第二章 概要设计
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun("第二章 概要设计")]
      }),

      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [new TextRun("2.1 系统架构")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun("本系统采用前后端分离的B/S（浏览器/服务器）架构。前端采用纯HTML5+CSS3+JavaScript实现，后端基于Node.js+Express框架，数据层使用SQLite数据库。整体采用三层架构设计，包含表现层（UI界面）、业务逻辑层（游戏核心逻辑+后端API）、数据层（SQLite数据库+本地存储），架构如图 1所示。")]
      }),

      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "图 1 系统架构图", bold: true })]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "前端层：", bold: true })]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun("- 用户界面：HTML5 Canvas绘图、响应式布局、触摸交互")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun("- 客户端逻辑：拼图游戏控制、图片处理、音乐播放")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun("- 本地存储：LocalStorage保存用户配置和游戏进度")]
      }),

      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "后端层：", bold: true })]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun("- Web服务器：Express框架，端口3001")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun("- 核心模块：")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60, left: 720 },
        children: [new TextRun("  - 拼图引擎（puzzle_engine.js）：服务端状态管理、游戏逻辑验证")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60, left: 720 },
        children: [new TextRun("  - 图片校验（image_validator.js）：房树人三要素检测")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60, left: 720 },
        children: [new TextRun("  - 数据分析（analytics_store.js）：用户行为记录与分析")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60, left: 720 },
        children: [new TextRun("  - 管理员功能（admin-healing.js）：数据导出、权限管理")]
      }),

      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun("- API接口：RESTful API设计，支持CORS跨域")]
      }),

      // 继续添加更多内容...
      new Paragraph({
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "注：由于文档内容较长，此处仅展示部分章节。完整文档将包含所有章节内容。", italics: true, color: "666666" })]
      }),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("中国大学生计算机设计大赛作品信息摘要_完整版.docx", buffer);
  console.log("文档创建成功！");
});
