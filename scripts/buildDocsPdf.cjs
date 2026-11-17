const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browserPath = fs.existsSync(edgePath) ? edgePath : (fs.existsSync(chromePath) ? chromePath : null);

if (!browserPath) {
  console.error('Neither Edge nor Chrome browser binary found!');
  process.exit(1);
}

const mdPath = path.resolve(__dirname, '..', 'docs', 'INTERNSHIP_DOCUMENTATION.md');
const outPdfPath = path.resolve(__dirname, '..', 'docs', 'INTERNSHIP_DOCUMENTATION.pdf');
const tempHtmlPath = path.resolve(__dirname, '..', 'docs', 'INTERNSHIP_DOCUMENTATION_TEMP.html');

console.log('Reading:', mdPath);
const md = fs.readFileSync(mdPath, 'utf8');

// Custom Markdown to styled HTML converter
function markdownToHtml(markdown) {
  const lines = markdown.split(/\r?\n/);
  let html = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeContent = [];
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  function flushTable() {
    if (!inTable) return;
    let tableHtml = '<div class="table-wrapper"><table><thead><tr>';
    tableHeaders.forEach(th => {
      tableHtml += `<th>${th.trim()}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    tableRows.forEach(row => {
      tableHtml += '<tr>';
      row.forEach(td => {
        tableHtml += `<td>${inlineFormat(td.trim())}</td>`;
      });
      tableHtml += '</tr>';
    });
    tableHtml += '</tbody></table></div>';
    html.push(tableHtml);
    inTable = false;
    tableHeaders = [];
    tableRows = [];
  }

  function inlineFormat(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\\text\{₹\}/g, '₹')
      .replace(/\$\\text\{₹\}\$/g, '₹')
      .replace(/\$([^\$]+)\$/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Code blocks
    if (line.trim().startsWith('```')) {
      flushTable();
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
        codeContent = [];
      } else {
        inCodeBlock = false;
        const escaped = codeContent.join('\n')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        html.push(`<div class="code-container"><div class="code-header">${codeBlockLang || 'Code'}</div><pre><code>${escaped}</code></pre></div>`);
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    // Horizontal Rule
    if (line.trim() === '---' || line.trim() === '***') {
      flushTable();
      html.push('<hr class="divider" />');
      continue;
    }

    // Tables
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const parts = line.split('|').slice(1, -1);
      if (!inTable) {
        inTable = true;
        tableHeaders = parts;
      } else if (parts.every(p => /^[\s\-:]+$/.test(p))) {
        // separator line, skip
      } else {
        tableRows.push(parts);
      }
      continue;
    } else {
      flushTable();
    }

    // Headings
    if (line.startsWith('# ')) {
      html.push(`<h1 class="doc-title">${inlineFormat(line.slice(2))}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      html.push(`<h2 class="section-title">${inlineFormat(line.slice(3))}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      html.push(`<h3 class="subsection-title">${inlineFormat(line.slice(4))}</h3>`);
      continue;
    }
    if (line.startsWith('#### ')) {
      html.push(`<h4 class="h4-title">${inlineFormat(line.slice(5))}</h4>`);
      continue;
    }

    // Blockquotes
    if (line.startsWith('> ')) {
      html.push(`<blockquote class="callout">${inlineFormat(line.slice(2))}</blockquote>`);
      continue;
    }

    // Bullet points
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const content = line.trim().slice(2);
      html.push(`<li class="bullet-item">${inlineFormat(content)}</li>`);
      continue;
    }

    // Numbered list
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      html.push(`<li class="numbered-item" value="${numMatch[1]}">${inlineFormat(numMatch[2])}</li>`);
      continue;
    }

    // Empty line
    if (!line.trim()) {
      continue;
    }

    // Paragraph
    html.push(`<p>${inlineFormat(line)}</p>`);
  }

  flushTable();
  return html.join('\n');
}

const bodyContent = markdownToHtml(md);

const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Nestora — Technical Documentation & Internship Submission</title>
<style>
  @page {
    size: A4;
    margin: 18mm 16mm 18mm 16mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 10.5pt;
    line-height: 1.55;
    margin: 0;
    padding: 0;
  }

  .cover-banner {
    background: linear-gradient(135deg, #064e3b 0%, #0f766e 50%, #0284c7 100%);
    color: #ffffff;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 25px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  }

  .cover-tag {
    display: inline-block;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.4);
    color: #ffffff;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 4px 10px;
    border-radius: 20px;
    margin-bottom: 12px;
  }

  .cover-title {
    font-size: 22pt;
    font-weight: 800;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
    line-height: 1.2;
    color: #ffffff;
  }

  .cover-subtitle {
    font-size: 12.5pt;
    font-weight: 400;
    margin: 0 0 16px 0;
    color: #ccfbf1;
  }

  .cover-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    font-size: 9pt;
    color: #e2e8f0;
    border-top: 1px solid rgba(255,255,255,0.25);
    padding-top: 12px;
  }

  .cover-meta span strong {
    color: #ffffff;
  }

  .doc-title {
    display: none; /* Already rendered in cover */
  }

  h2.section-title {
    font-size: 14pt;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #0f766e;
    padding-bottom: 5px;
    margin-top: 28px;
    margin-bottom: 14px;
    page-break-after: avoid;
    break-after: avoid;
    display: flex;
    align-items: center;
  }

  h3.subsection-title {
    font-size: 11.5pt;
    font-weight: 700;
    color: #0f766e;
    margin-top: 18px;
    margin-bottom: 8px;
    page-break-after: avoid;
    break-after: avoid;
  }

  h4.h4-title {
    font-size: 10.5pt;
    font-weight: 700;
    color: #334155;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
    break-after: avoid;
  }

  p {
    margin: 0 0 10px 0;
    color: #334155;
    text-align: justify;
  }

  strong {
    color: #0f172a;
    font-weight: 600;
  }

  .inline-code {
    background: #f1f5f9;
    color: #0f766e;
    padding: 1.5px 5px;
    border-radius: 4px;
    font-family: "Cascadia Code", "Fira Code", Consolas, Courier, monospace;
    font-size: 8.8pt;
    border: 1px solid #e2e8f0;
  }

  .table-wrapper {
    margin: 14px 0;
    overflow-x: auto;
    page-break-inside: avoid;
    break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9pt;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
  }

  th {
    background: #f8fafc;
    color: #0f172a;
    font-weight: 700;
    text-align: left;
    padding: 8px 10px;
    border: 1px solid #cbd5e1;
    border-bottom: 2px solid #94a3b8;
  }

  td {
    padding: 7px 10px;
    border: 1px solid #e2e8f0;
    color: #334155;
    vertical-align: top;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .code-container {
    margin: 14px 0;
    border-radius: 8px;
    border: 1px solid #334155;
    background: #0f172a;
    page-break-inside: avoid;
    break-inside: avoid;
    overflow: hidden;
  }

  .code-header {
    background: #1e293b;
    color: #94a3b8;
    font-size: 8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 5px 12px;
    border-bottom: 1px solid #334155;
  }

  pre {
    margin: 0;
    padding: 12px 14px;
    overflow-x: auto;
    font-family: "Cascadia Code", "Fira Code", Consolas, Courier, monospace;
    font-size: 8.2pt;
    line-height: 1.45;
    color: #f1f5f9;
  }

  code {
    font-family: inherit;
  }

  .divider {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }

  .callout {
    background: #f0fdf4;
    border-left: 4px solid #10b981;
    padding: 10px 14px;
    margin: 12px 0;
    border-radius: 0 6px 6px 0;
    color: #065f46;
    font-size: 9.5pt;
  }

  li {
    margin-bottom: 5px;
    color: #334155;
  }

  li.bullet-item {
    margin-left: 18px;
    list-style-type: square;
  }

  li.numbered-item {
    margin-left: 20px;
    list-style-type: decimal;
  }

  .badge-metric {
    display: inline-block;
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    padding: 2px 8px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 8.5pt;
  }

  .footer-stamp {
    margin-top: 35px;
    border-top: 2px solid #cbd5e1;
    padding-top: 12px;
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    color: #64748b;
  }

  a {
    color: #0284c7;
    text-decoration: none;
  }
</style>
</head>
<body>

<div class="cover-banner">
  <div class="cover-tag">Internship Assessment Submission & Technical Documentation</div>
  <div class="cover-title">Nestora — Full-Stack Property Rental Platform</div>
  <div class="cover-subtitle">Enterprise MERN System for Kerala Residential & Commercial Real Estate</div>
  <div class="cover-meta">
    <span><strong>Domain:</strong> Kerala Metropolitan Markets (Kochi, Trivandrum, Kozhikode, Thrissur)</span>
    <span><strong>Tech Stack:</strong> React 18, Vite 5, Node.js 18+, Express, MongoDB, Tailwind CSS</span>
    <span><strong>Verification:</strong> 97/97 Automated Test Suites Passing (100%)</span>
    <span><strong>Role Engine:</strong> Renter, Owner, Platform Administrator</span>
  </div>
</div>

${bodyContent}

<div class="footer-stamp">
  <div><strong>Nestora Engineering Team</strong> • Official Technical Documentation</div>
  <div>Generated on ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>

</body>
</html>
`;

fs.writeFileSync(tempHtmlPath, fullHtml, 'utf8');
console.log('HTML written to:', tempHtmlPath);

console.log('Executing browser headless print to PDF via:', browserPath);
try {
  execFileSync(browserPath, [
    '--headless',
    '--disable-gpu',
    '--run-all-compositor-stages-before-draw',
    `--print-to-pdf=${outPdfPath}`,
    tempHtmlPath
  ]);
  const stats = fs.statSync(outPdfPath);
  console.log('SUCCESS! PDF generated successfully at:', outPdfPath);
  console.log('File size:', stats.size, 'bytes');
  // cleanup temp file
  fs.unlinkSync(tempHtmlPath);
} catch (err) {
  console.error('Failed to generate PDF:', err.message);
  process.exit(1);
}
