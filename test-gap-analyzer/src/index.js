#!/usr/bin/env node

const { analyzeRecentChanges } = require('./change-detector');
const { analyzeCoverageGaps } = require('./coverage-analyzer');
const { generateTests } = require('./test-generator');
const { assessRiskPriority } = require('./risk-assessor');
const { runTests, validateCoverage } = require('./test-runner');
const { generateReport } = require('./reporter');

class TestGapAnalyzer {
  constructor(config = {}) {
    this.config = {
      analysisDays: config.analysisDays || 7,
      outputDir: config.outputDir || './test-report',
      includePatterns: config.includePatterns || ['**/*.js'],
      excludePatterns: config.excludePatterns || [
        '**/node_modules/**',
        '**/h5/**',
        '**/*.wxml',
        '**/*.wxss'
      ],
      riskThresholds: {
        critical: 80,
        high: 60,
        medium: 40,
        low: 20
      },
      ...config
    };

    this.results = {
      analyzedCommits: [],
      coverageGaps: [],
      riskAssessments: [],
      generatedTests: [],
      validationResults: []
    };
  }

  async run() {
    console.log('🔍 开始测试缺口分析...\n');

    console.log('📊 第一阶段：检测代码变更');
    const changes = await analyzeRecentChanges(this.config);
    this.results.analyzedCommits = changes.commits || [];
    console.log(`   ✓ 分析了 ${this.results.analyzedCommits.length} 个提交\n`);

    console.log('📈 第二阶段：分析覆盖率缺口');
    const gaps = await analyzeCoverageGaps({ ...this.config, changes });
    this.results.coverageGaps = gaps.gaps || [];
    console.log(`   ✓ 发现 ${this.results.coverageGaps.length} 个潜在缺口\n`);

    console.log('⚖️ 第三阶段：评估风险优先级');
    const assessments = await assessRiskPriority(this.results.coverageGaps, this.config);
    this.results.riskAssessments = assessments.assessments || [];
    console.log(`   ✓ 评估了 ${this.results.riskAssessments.length} 个风险项\n`);

    console.log('✍️ 第四阶段：生成测试');
    const tests = await generateTests(this.results.riskAssessments, this.config);
    this.results.generatedTests = tests || [];
    console.log(`   ✓ 生成了 ${this.results.generatedTests.length} 个测试\n`);

    console.log('✅ 第五阶段：验证测试');
    const validation = await validateCoverage(this.results.generatedTests);
    this.results.validationResults = validation || [];
    console.log(`   ✓ 验证完成\n`);

    console.log('📝 第六阶段：生成报告');
    const report = await generateReport(this.results, this.config);
    console.log(`   ✓ 报告已生成\n`);

    return this.results;
  }
}

module.exports = TestGapAnalyzer;
