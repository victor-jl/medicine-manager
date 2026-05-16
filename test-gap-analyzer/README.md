# 自动化测试缺口分析工具

## 📖 概述

**test-gap-analyzer** 是一款智能化的测试缺口分析工具，旨在帮助开发团队系统性地识别代码覆盖率缺口，并在潜在风险对产品稳定性造成实质影响之前，自动生成针对性的测试用例来填补这些缺口。

### 核心价值

- **主动式质量保障**：在缺陷影响用户之前发现并修复
- **智能化测试生成**：基于代码变更和风险评估自动生成测试
- **持续集成友好**：可无缝集成到 CI/CD 流水线
- **多维度分析**：从提交历史、复杂度、依赖关系等多角度评估风险

## 🎯 核心功能

### 1. 代码变更检测
- 自动分析最近 N 天的 Git 提交记录
- 智能识别提交类型（新功能、Bug修复、重构等）
- 追踪变更文件及其影响范围
- 检测核心模块的变更

### 2. 覆盖率缺口分析
- 自动扫描源代码，识别未测试文件
- 评估代码复杂度（异步操作、数据解析、错误处理等）
- 检测测试覆盖不足的模块
- 识别关键业务路径

### 3. 风险优先级评估
基于以下因素计算风险评分：
- 是否为新增逻辑路径
- 是否为 Bug 修复提交
- 是否涉及核心模块
- 代码复杂度等级
- 是否为业务关键流程
- 下游影响范围

### 4. 智能测试生成
根据识别的缺口自动生成测试用例：
- 单元测试
- 边界条件测试
- 异常处理测试
- 集成场景测试

### 5. 多格式报告
生成详细的分析报告：
- **Markdown**：便于阅读和分享
- **JSON**：便于程序化处理
- **HTML**：可视化展示

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd test-gap-analyzer

# 安装依赖
npm install

# 全局安装（可选）
npm install -g
```

### 基本使用

```bash
# 快速分析（使用默认配置）
npm run quick

# 完整分析
npm run analyze

# 指定分析天数
npx test-gap-analyzer analyze --days 14

# 干运行模式（只分析，不生成测试）
npx test-gap-analyzer analyze --dry-run

# 生成特定格式报告
npx test-gap-analyzer analyze --format markdown
```

### CLI 命令详解

```bash
# 分析最近7天的变更
test-gap-analyzer analyze -d 7

# 自定义输出目录
test-gap-analyzer analyze -o ./my-reports

# 使用配置文件
test-gap-analyzer analyze -c ./config.json

# 详细输出模式
test-gap-analyzer analyze -v

# 排除特定文件
test-gap-analyzer analyze --exclude "**/vendor/**,**/test/**"

# 生成多种格式报告
test-gap-analyzer analyze -f all
```

## ⚙️ 配置选项

### 配置文件结构

```json
{
  "analysisDays": 7,
  "outputDir": "./test-report",
  "includePatterns": ["**/*.js"],
  "excludePatterns": [
    "**/node_modules/**",
    "**/h5/**",
    "**/*.wxml",
    "**/*.wxss"
  ],
  "riskThresholds": {
    "critical": 80,
    "high": 60,
    "medium": 40,
    "low": 20
  },
  "testGeneration": {
    "enabled": true,
    "minPriority": "medium",
    "maxTestsPerFile": 10
  },
  "reportFormats": ["markdown", "json", "html"],
  "validation": {
    "checkDeterminism": true,
    "checkDependencies": true,
    "minCoverageTarget": 0.8
  }
}
```

### 配置项说明

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `analysisDays` | number | 7 | 分析最近多少天的提交 |
| `outputDir` | string | ./test-report | 报告输出目录 |
| `includePatterns` | array | ["**/*.js"] | 包含的文件模式 |
| `excludePatterns` | array | - | 排除的文件模式 |
| `riskThresholds` | object | - | 风险等级阈值 |
| `testGeneration.enabled` | boolean | true | 是否启用测试生成 |
| `testGeneration.minPriority` | string | medium | 最小测试优先级 |
| `validation.checkDeterminism` | boolean | true | 检查测试确定性 |
| `validation.minCoverageTarget` | number | 0.8 | 最低覆盖率目标 |

## 📊 报告示例

### 执行摘要

```
📊 执行摘要
- 分析的提交数: 5
- 发现的覆盖率缺口: 8
- 评估的风险项: 8
- 生成的测试数: 12
```

### 风险分布

```
⚠️ 风险分布
🔴 严重: 2 个
🟠 高危: 3 个
🟡 中危: 2 个
🟢 低危: 1 个
```

## 🔍 分析维度

### 优先级划分

#### 高优先级（必须测试）
1. **新增逻辑路径**：新功能未被测试验证
2. **Bug修复提交**：修复后可能引入新问题
3. **核心模块变更**：影响下游多个模块
4. **复杂解析逻辑**：数据解析错误可能导致系统故障

#### 中优先级（建议测试）
5. **涉及权限校验**：权限验证逻辑
6. **并发操作**：异步处理和竞态条件
7. **业务关键流程**：核心业务流程

#### 低优先级（可选测试）
8. **配置变更**：非关键配置
9. **文档更新**：仅文档修改

### 复杂度评估因素

- **异步操作密度**：async/await 和 Promise 使用
- **错误处理复杂度**：catch、throw、reject 使用
- **验证逻辑**：数据验证和检查
- **解析操作**：JSON.parse、parseInt 等
- **代码行数**：文件规模

## 📝 生成测试示例

### 单元测试示例

```javascript
describe('extractMedicineName', () => {
  test('应从包含药品关键词的文本中正确提取药品名称', () => {
    const input = '阿莫西林胶囊 0.5g×24粒';
    const result = extractMedicineName(input);
    expect(result).toBeTruthy();
  });

  test('应处理空字符串输入', () => {
    const result = extractMedicineName('');
    expect(result).toBe('');
  });
});
```

### 边界测试示例

```javascript
describe('边界条件', () => {
  test('应处理过长的输入文本', () => {
    const input = '阿莫西林'.repeat(100);
    const result = extractMedicineName(input);
    expect(result).toBeTruthy();
  });

  test('应处理特殊字符', () => {
    const input = '药品名称: @#$%^&*()';
    const result = extractMedicineName(input);
    expect(result).toBeTruthy();
  });
});
```

## 🔧 集成指南

### CI/CD 集成示例

#### GitHub Actions

```yaml
name: Test Gap Analysis
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Run test gap analysis
        run: npm run analyze
      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: test-gap-report
          path: test-report/
```

#### GitLab CI

```yaml
test-gap-analysis:
  stage: test
  script:
    - npm install
    - npm run analyze
  artifacts:
    paths:
      - test-report/
    expire_in: 1 week
```

## 🎓 使用场景

### 场景 1：常规代码审查
每次 PR 合并后自动运行，确保持续的质量保障。

### 场景 2：发布前检查
在重要版本发布前进行全面的测试缺口扫描。

### 场景 3：技术债务清理
识别历史遗留的未测试代码，制定补测计划。

### 场景 4：回归测试增强
为高风险模块补充测试，减少回归风险。

## 📈 最佳实践

1. **定期运行**：建议在每次代码合并后运行
2. **关注高优先级缺口**：优先处理严重和高风险项
3. **持续改进**：根据报告调整测试策略
4. **团队协作**：分享报告，共同讨论改进方案
5. **指标追踪**：记录覆盖率变化趋势

## 🛠️ 故障排除

### 常见问题

**Q: 如何处理"未找到 Git 历史"警告？**
A: 这通常发生在新仓库或缺少提交历史的情况下。工具会自动使用模拟数据进行演示分析。

**Q: 生成的测试无法运行怎么办？**
A: 检查以下内容：
- 是否安装了必要的依赖（jest、babel 等）
- 路径是否正确
- mock 配置是否正确

**Q: 如何跳过某些文件？**
A: 在配置文件的 `excludePatterns` 中添加相应的模式。

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！
