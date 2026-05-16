const fs = require('fs');
const path = require('path');

function generateMarkdownReport(results, config) {
  let report = `# 测试缺口分析报告\n\n`;
  report += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

  report += `## 📊 执行摘要\n\n`;
  report += `- 分析的提交数: ${results.analyzedCommits?.length || 0}\n`;
  report += `- 发现的覆盖率缺口: ${results.coverageGaps?.length || 0}\n`;
  report += `- 评估的风险项: ${results.riskAssessments?.length || 0}\n`;
  report += `- 生成的测试数: ${results.generatedTests?.length || 0}\n\n`;

  report += `## 📈 变更分析\n\n`;
  if (results.analyzedCommits && results.analyzedCommits.length > 0) {
    const patterns = results.analyzedCommits.patterns || {};
    report += `### 提交类型分布\n\n`;
    report += `- ✨ 新功能: ${patterns.feature?.length || 0} 个\n`;
    report += `- 🐛 Bug修复: ${patterns.bugfix?.length || 0} 个\n`;
    report += `- 🔄 重构: ${patterns.refactor?.length || 0} 个\n`;
    report += `- 📝 其他: ${patterns.chore?.length || 0} 个\n\n`;

    report += `### 最近提交\n\n`;
    for (const commit of results.analyzedCommits.slice(0, 5)) {
      report += `#### ${commit.hash.substring(0, 7)}\n\n`;
      report += `- **作者**: ${commit.author}\n`;
      report += `- **日期**: ${new Date(commit.timestamp * 1000).toLocaleDateString('zh-CN')}\n`;
      report += `- **消息**: ${commit.message}\n`;
      report += `- **文件**:\n`;
      for (const file of commit.files.slice(0, 3)) {
        report += `  - \`${path.relative(process.cwd(), file)}\`\n`;
      }
      report += `\n`;
    }
  } else {
    report += `暂无提交数据（使用模拟数据进行分析）\n\n`;
  }

  report += `## 🎯 覆盖率缺口\n\n`;
  if (results.coverageGaps && results.coverageGaps.length > 0) {
    report += `### 高优先级缺口\n\n`;
    const highPriorityGaps = results.coverageGaps.filter(g => g.priority === 'high');
    for (const gap of highPriorityGaps.slice(0, 5)) {
      report += `#### ${gap.relativePath}\n\n`;
      report += `- **风险评分**: ${gap.riskScore || 'N/A'}\n`;
      report += `- **风险等级**: ${gap.riskLevel || 'unknown'}\n`;
      report += `- **原因**: ${gap.reason}\n`;
      if (gap.complexity) {
        report += `- **复杂度**: ${gap.complexity.level}\n`;
        report += `- **代码行数**: ${gap.complexity.linesOfCode}\n`;
      }
      if (gap.functions && gap.functions.length > 0) {
        report += `- **待测试函数**: ${gap.functions.join(', ')}\n`;
      }
      report += `\n`;
    }
  } else {
    report += `未发现明显的覆盖率缺口\n\n`;
  }

  report += `## ⚠️ 风险评估\n\n`;
  if (results.riskAssessments && results.riskAssessments.length > 0) {
    report += `### 风险分布\n\n`;
    const critical = results.riskAssessments.filter(a => a.riskLevel === 'critical');
    const high = results.riskAssessments.filter(a => a.riskLevel === 'high');
    const medium = results.riskAssessments.filter(a => a.riskLevel === 'medium');
    const low = results.riskAssessments.filter(a => a.riskLevel === 'low');

    report += `- 🔴 严重: ${critical.length} 个\n`;
    report += `- 🟠 高危: ${high.length} 个\n`;
    report += `- 🟡 中危: ${medium.length} 个\n`;
    report += `- 🟢 低危: ${low.length} 个\n\n`;

    if (critical.length > 0) {
      report += `### 严重风险项\n\n`;
      for (const assessment of critical.slice(0, 3)) {
        report += `#### ${assessment.gap?.relativePath || '未知文件'}\n\n`;
        report += `- **风险评分**: ${assessment.score}\n`;
        report += `- **风险因素**:\n`;
        if (assessment.riskFactors) {
          for (const factor of assessment.riskFactors) {
            report += `  - ${factor.factor}: ${factor.description}\n`;
          }
        }
        report += `- **建议**:\n`;
        if (assessment.recommendations) {
          for (const rec of assessment.recommendations) {
            report += `  - [${rec.priority}] ${rec.description}\n`;
          }
        }
        report += `\n`;
      }
    }
  } else {
    report += `未发现需要立即处理的风险\n\n`;
  }

  report += `## ✍️ 生成的测试\n\n`;
  if (results.generatedTests && results.generatedTests.length > 0) {
    report += `### 测试文件列表\n\n`;
    report += `| 测试名称 | 文件路径 | 优先级 | 估计行数 |\n`;
    report += `|---------|---------|--------|----------|\n`;
    for (const test of results.generatedTests) {
      report += `| ${test.name} | \`${test.file}\` | ${test.priority} | ${test.linesOfCode || 'N/A'} |\n`;
    }
    report += `\n`;
  } else {
    report += `未生成新的测试\n\n`;
  }

  report += `## ✅ 验证结果\n\n`;
  if (results.validationResults) {
    report += `- 验证总数: ${results.validationResults.summary?.total || 0}\n`;
    report += `- 有效测试: ${results.validationResults.summary?.valid || 0}\n`;
    report += `- 无效测试: ${results.validationResults.summary?.invalid || 0}\n`;
    report += `- 不稳定测试: ${results.validationResults.summary?.unstable || 0}\n\n`;

    if (results.validationResults.validations) {
      const invalidTests = results.validationResults.validations.filter(v => !v.overall);
      if (invalidTests.length > 0) {
        report += `### 需要修复的测试\n\n`;
        for (const validation of invalidTests) {
          report += `#### ${validation.testName}\n\n`;
          if (validation.structure?.issues) {
            report += `- **结构问题**: ${validation.structure.issues.join(', ')}\n`;
          }
          if (validation.determinism?.issues) {
            report += `- **不确定性问题**: ${validation.determinism.issues.join(', ')}\n`;
          }
          report += `\n`;
        }
      }
    }
  } else {
    report += `暂无验证数据\n\n`;
  }

  report += `## 📋 建议措施\n\n`;
  const urgentCount = (results.riskAssessments || []).filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length;
  if (urgentCount > 0) {
    report += `### 立即行动\n\n`;
    report += `1. 优先处理 ${urgentCount} 个高风险缺口\n`;
    report += `2. 为核心模块（utils/ocr.js, utils/baidu-ocr.js）添加测试\n`;
    report += `3. 为新增的药品有效期格式化功能编写边界测试\n`;
    report += `4. 为服药记录相关操作添加集成测试\n\n`;
  }

  if ((results.validationResults?.summary?.unstable || 0) > 0) {
    report += `### 稳定性改进\n\n`;
    report += `1. 修复 ${results.validationResults.summary.unstable} 个不稳定测试\n`;
    report += `2. 移除对 Math.random() 的依赖\n`;
    report += `3. 使用固定的测试数据而非动态生成\n\n`;
  }

  report += `### 持续改进\n\n`;
  report += `1. 将测试缺口分析集成到 CI/CD 流程\n`;
  report += `2. 定期运行本工具检测新的覆盖率缺口\n`;
  report += `3. 遵循测试驱动开发实践\n`;
  report += `4. 确保所有核心模块达到 80% 以上的测试覆盖率\n\n`;

  return report;
}

function generateJSONReport(results, config) {
  return JSON.stringify({
    metadata: {
      generatedAt: new Date().toISOString(),
      analyzerVersion: '1.0.0',
      config: config
    },
    summary: {
      analyzedCommits: results.analyzedCommits?.length || 0,
      coverageGaps: results.coverageGaps?.length || 0,
      riskAssessments: results.riskAssessments?.length || 0,
      generatedTests: results.generatedTests?.length || 0
    },
    commits: results.analyzedCommits || [],
    coverageGaps: results.coverageGaps || [],
    riskAssessments: (results.riskAssessments || []).map(a => ({
      file: a.gap?.relativePath,
      riskScore: a.score,
      riskLevel: a.riskLevel,
      riskFactors: a.riskFactors,
      recommendations: a.recommendations,
      shouldGenerateTest: a.shouldGenerateTest
    })),
    generatedTests: results.generatedTests || [],
    validation: results.validationResults
  }, null, 2);
}

function generateHTMLReport(results, config) {
  let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>测试缺口分析报告</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
            color: #667eea;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
            margin-top: 0;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            color: #666;
            font-size: 0.9em;
        }
        .risk-critical { color: #dc3545; font-weight: bold; }
        .risk-high { color: #fd7e14; font-weight: bold; }
        .risk-medium { color: #ffc107; font-weight: bold; }
        .risk-low { color: #28a745; font-weight: bold; }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background: #667eea;
            color: white;
        }
        tr:hover {
            background: #f5f5f5;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: bold;
        }
        .badge-critical { background: #dc3545; color: white; }
        .badge-high { background: #fd7e14; color: white; }
        .badge-medium { background: #ffc107; color: #333; }
        .badge-low { background: #28a745; color: white; }
        .timestamp {
            color: #999;
            font-size: 0.9em;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 测试缺口分析报告</h1>
        <p class="timestamp">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>`;

  html += `
    <div class="section">
        <h2>📊 执行摘要</h2>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${results.analyzedCommits?.length || 0}</div>
                <div class="stat-label">分析的提交</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.coverageGaps?.length || 0}</div>
                <div class="stat-label">覆盖率缺口</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.riskAssessments?.length || 0}</div>
                <div class="stat-label">风险评估项</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${results.generatedTests?.length || 0}</div>
                <div class="stat-label">生成的测试</div>
            </div>
        </div>
    </div>`;

  html += `
    <div class="section">
        <h2>⚠️ 风险分布</h2>
        <div class="stats">`;

  const riskCounts = {
    critical: (results.riskAssessments || []).filter(a => a.riskLevel === 'critical').length,
    high: (results.riskAssessments || []).filter(a => a.riskLevel === 'high').length,
    medium: (results.riskAssessments || []).filter(a => a.riskLevel === 'medium').length,
    low: (results.riskAssessments || []).filter(a => a.riskLevel === 'low').length
  };

  html += `
            <div class="stat-card">
                <div class="stat-value risk-critical">${riskCounts.critical}</div>
                <div class="stat-label">严重风险</div>
            </div>
            <div class="stat-card">
                <div class="stat-value risk-high">${riskCounts.high}</div>
                <div class="stat-label">高危风险</div>
            </div>
            <div class="stat-card">
                <div class="stat-value risk-medium">${riskCounts.medium}</div>
                <div class="stat-label">中危风险</div>
            </div>
            <div class="stat-card">
                <div class="stat-value risk-low">${riskCounts.low}</div>
                <div class="stat-label">低危风险</div>
            </div>
        </div>
    </div>`;

  if (results.coverageGaps && results.coverageGaps.length > 0) {
    html += `
    <div class="section">
        <h2>🎯 覆盖率缺口详情</h2>
        <table>
            <thead>
                <tr>
                    <th>文件路径</th>
                    <th>风险等级</th>
                    <th>风险评分</th>
                    <th>优先级</th>
                </tr>
            </thead>
            <tbody>`;

    for (const gap of results.coverageGaps.slice(0, 10)) {
      const riskClass = `risk-${gap.riskLevel || 'low'}`;
      html += `
                <tr>
                    <td><code>${gap.relativePath || gap.file}</code></td>
                    <td><span class="badge badge-${gap.riskLevel || 'low'}">${gap.riskLevel || 'unknown'}</span></td>
                    <td class="${riskClass}">${gap.riskScore || 'N/A'}</td>
                    <td>${gap.priority || 'medium'}</td>
                </tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>`;
  }

  if (results.generatedTests && results.generatedTests.length > 0) {
    html += `
    <div class="section">
        <h2>✍️ 生成的测试</h2>
        <table>
            <thead>
                <tr>
                    <th>测试名称</th>
                    <th>文件路径</th>
                    <th>优先级</th>
                    <th>估计行数</th>
                </tr>
            </thead>
            <tbody>`;

    for (const test of results.generatedTests) {
      html += `
                <tr>
                    <td>${test.name}</td>
                    <td><code>${test.file}</code></td>
                    <td><span class="badge badge-${test.priority === 'high' ? 'high' : 'medium'}">${test.priority}</span></td>
                    <td>${test.linesOfCode || 'N/A'}</td>
                </tr>`;
    }

    html += `
            </tbody>
        </table>
    </div>`;
  }

  html += `
    <div class="section">
        <h2>📋 建议措施</h2>
        <ul>`;

  const urgentCount = (results.riskAssessments || []).filter(a => a.riskLevel === 'critical' || a.riskLevel === 'high').length;
  if (urgentCount > 0) {
    html += `
            <li>立即处理 <strong>${urgentCount} 个高风险缺口</strong></li>`;
  }
  if (results.generatedTests?.length > 0) {
    html += `
            <li>审阅并运行生成的 ${results.generatedTests.length} 个测试</li>`;
  }
  html += `
            <li>将测试缺口分析集成到 CI/CD 流程</li>
            <li>确保核心模块达到 80% 以上的测试覆盖率</li>
        </ul>
    </div>
</body>
</html>`;

  return html;
}

async function generateReport(results, config) {
  console.log('   生成报告...\n');

  const outputDir = config.outputDir || './test-report';
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const markdownReport = generateMarkdownReport(results, config);
  const jsonReport = generateJSONReport(results, config);
  const htmlReport = generateHTMLReport(results, config);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const markdownPath = path.join(outputDir, `report-${timestamp}.md`);
  const jsonPath = path.join(outputDir, `report-${timestamp}.json`);
  const htmlPath = path.join(outputDir, `report-${timestamp}.html`);

  fs.writeFileSync(markdownPath, markdownReport);
  fs.writeFileSync(jsonPath, jsonReport);
  fs.writeFileSync(htmlPath, htmlReport);

  console.log(`   ✓ Markdown 报告: ${markdownPath}`);
  console.log(`   ✓ JSON 报告: ${jsonPath}`);
  console.log(`   ✓ HTML 报告: ${htmlPath}`);

  const latestMarkdown = path.join(outputDir, 'latest-report.md');
  const latestJson = path.join(outputDir, 'latest-report.json');
  const latestHtml = path.join(outputDir, 'latest-report.html');

  fs.writeFileSync(latestMarkdown, markdownReport);
  fs.writeFileSync(latestJson, jsonReport);
  fs.writeFileSync(latestHtml, htmlReport);

  console.log(`   ✓ 最新报告链接已更新\n`);

  return {
    markdown: markdownPath,
    json: jsonPath,
    html: htmlPath,
    latest: {
      markdown: latestMarkdown,
      json: latestJson,
      html: latestHtml
    }
  };
}

module.exports = {
  generateMarkdownReport,
  generateJSONReport,
  generateHTMLReport,
  generateReport
};
