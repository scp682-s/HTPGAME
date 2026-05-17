const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, LevelFormat, PageBreak } = require('docx');
const fs = require('fs');

// 读取markdown文件
const mdContent = fs.readFileSync('答辩问题预测与准备.md', 'utf-8');
const lines = mdContent.split('\n');

const children = [];

// 解析markdown并转换为docx段落
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 一级标题 (# )
  if (line.startsWith('# ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun(line.substring(2))]
    }));
  }
  // 二级标题 (## )
  else if (line.startsWith('## ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [new TextRun(line.substring(3))]
    }));
  }
  // 三级标题 (### )
  else if (line.startsWith('### ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_3,
      children: [new TextRun(line.substring(4))]
    }));
  }
  // 四级标题 (#### )
  else if (line.startsWith('#### ')) {
    children.push(new Paragraph({
      heading: HeadingLevel.HEADING_4,
      children: [new TextRun(line.substring(5))]
    }));
  }
  // 分隔线
  else if (line.trim() === '---') {
    children.push(new Paragraph({
      border: {
        bottom: {
          style: BorderStyle.SINGLE,
          size: 6,
          color: "CCCCCC"
        }
      },
      children: [new TextRun("")]
    }));
  }
  // 列表项
  else if (line.startsWith('- ')) {
    const text = line.substring(2);
    const textRuns = [];

    // 处理加粗文本 **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        textRuns.push(new TextRun(text.substring(lastIndex, match.index)));
      }
      textRuns.push(new TextRun({ text: match[1], bold: true }));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      textRuns.push(new TextRun(text.substring(lastIndex)));
    }

    if (textRuns.length === 0) {
      textRuns.push(new TextRun(text));
    }

    children.push(new Paragraph({
      bullet: { level: 0 },
      children: textRuns
    }));
  }
  // 表格行（简单处理）
  else if (line.startsWith('|')) {
    // 跳过表格，保持简单
    continue;
  }
  // 空行
  else if (line.trim() === '') {
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }
  // 普通段落
  else {
    const textRuns = [];
    const text = line;

    // 处理加粗文本 **text**
    const boldRegex = /\*\*(.+?)\*\*/g;
    let lastIndex = 0;
    let match;

    while ((match = boldRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        textRuns.push(new TextRun(text.substring(lastIndex, match.index)));
      }
      textRuns.push(new TextRun({ text: match[1], bold: true }));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      textRuns.push(new TextRun(text.substring(lastIndex)));
    }

    if (textRuns.length === 0 && text.length > 0) {
      textRuns.push(new TextRun(text));
    }

    if (textRuns.length > 0) {
      children.push(new Paragraph({ children: textRuns }));
    }
  }
}

// 创建文档
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: "宋体",
          size: 28  // 14pt = 四号字
        }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 36,  // 18pt = 小二号
          bold: true,
          font: "黑体",
          color: "000000"
        },
        paragraph: {
          spacing: { before: 480, after: 240 },
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
        run: {
          size: 32,  // 16pt = 三号
          bold: true,
          font: "黑体",
          color: "000000"
        },
        paragraph: {
          spacing: { before: 360, after: 180 },
          outlineLevel: 1
        }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 30,  // 15pt = 小三号
          bold: true,
          font: "黑体",
          color: "000000"
        },
        paragraph: {
          spacing: { before: 240, after: 120 },
          outlineLevel: 2
        }
      },
      {
        id: "Heading4",
        name: "Heading 4",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: {
          size: 28,  // 14pt = 四号
          bold: true,
          font: "黑体",
          color: "000000"
        },
        paragraph: {
          spacing: { before: 180, after: 120 },
          outlineLevel: 3
        }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: {
          width: 11906,   // A4
          height: 16838
        },
        margin: {
          top: 1440,
          right: 1440,
          bottom: 1440,
          left: 1440
        }
      }
    },
    children: children
  }]
});

// 保存文档
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("答辩问题预测与准备.docx", buffer);
  console.log("✓ 文档创建成功：答辩问题预测与准备.docx");
  console.log("✓ 正文字体：宋体四号");
  console.log("✓ 标题层级：一级（黑体小二号居中）、二级（黑体三号）、三级（黑体小三号）、四级（黑体四号）");
});
