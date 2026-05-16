#!/usr/bin/env node

const { Command } = require('commander');
const TestGapAnalyzer = require('../src/index');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('test-gap-analyzer')
  .description('自动化测试缺口分析工具 - 检测代码覆盖率缺口并生成测试')
  .version('1.0.0')
  .option('-d, --days <number>', '分析最近多少天的提交', '7')
  .option('-o, --output <directory>', '输出报告的目录', './test-report')
  .option('-c, --config <file>', '配置文件路径', null)
  .option('-f, --format <format>', '报告格式 (markdown|json|html|all)', 'all')
  .option('--include <patterns>', '包含的文件模式 (逗号分隔)', '**/*.js')
  .option('--exclude <patterns>', '排除的文件模式 (逗号分隔)', '**/node_modules/**,**/h5/**')
  .option('--min-risk <score>', '最小风险评分阈值', '0')
  .option('--dry-run', '只分析不生成测试', false)
  .option('-v, --verbose', '详细输出模式', false);

program
  .command('analyze')
  .description('执行测试缺口分析')
  .action(async (options) => {
    try {
      const config = loadConfig(options);

      if (options.verbose) {
        console.log('🔍 测试缺口分析工具');
        console.log('='.repeat(50));
        console.log('配置:', JSON.stringify(config, null, 2));
        console.log('='.repeat(50), '\n');
      }

      const analyzer = new TestGapAnalyzer(config);
      const results = await analyzer.run();

      if (!options.dryRun) {
        console.log('✅ 分析完成！');
        console.log('\n报告已生成:');
        console.log(`  - Markdown: ${config.outputDir}/latest-report.md`);
        console.log(`  - JSON: ${config.outputDir}/latest-report.json`);
        console.log(`  - HTML: ${config.outputDir}/latest-report.html`);
      } else {
        console.log('✅ 干运行完成（未生成测试）');
        console.log(`\n发现 ${results.coverageGaps?.length || 0} 个覆盖率缺口`);
        console.log(`评估了 ${results.riskAssessments?.length || 0} 个风险项`);
      }

      const exitCode = (results.riskAssessments || []).filter(
        a => a.riskLevel === 'critical' || a.riskLevel === 'high'
      ).length > 0 ? 1 : 0;

      process.exit(exitCode);
    } catch (error) {
      console.error('❌ 分析失败:', error.message);
      if (options.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

program
  .command('quick')
  .description('快速分析（使用默认配置）')
  .action(async () => {
    try {
      const config = {
        analysisDays: 7,
        outputDir: './test-report',
        includePatterns: ['**/*.js'],
        excludePatterns: ['**/node_modules/**', '**/h5/**', '**/*.wxml', '**/*.wxss']
      };

      console.log('⚡ 快速分析模式\n');
      const analyzer = new TestGapAnalyzer(config);
      const results = await analyzer.run();

      console.log('\n✅ 快速分析完成！');

      process.exit(0);
    } catch (error) {
      console.error('❌ 分析失败:', error.message);
      process.exit(1);
    }
  });

program
  .command('report')
  .description('基于现有结果生成报告')
  .option('-i, --input <file>', '输入的JSON结果文件')
  .action(async (options) => {
    try {
      if (!options.input) {
        console.error('❌ 请指定输入文件: --input <file>');
        process.exit(1);
      }

      const results = JSON.parse(fs.readFileSync(options.input, 'utf-8'));
      const { generateReport } = require('../src/reporter');

      console.log('📝 生成报告...\n');
      const reportPaths = await generateReport(results, { outputDir: './test-report' });

      console.log('\n✅ 报告生成完成！');
      console.log(`  Markdown: ${reportPaths.markdown}`);
      console.log(`  JSON: ${reportPaths.json}`);
      console.log(`  HTML: ${reportPaths.html}`);
    } catch (error) {
      console.error('❌ 报告生成失败:', error.message);
      process.exit(1);
    }
  });

function loadConfig(options) {
  let fileConfig = {};

  if (options.config) {
    const configPath = path.resolve(options.config);
    if (fs.existsSync(configPath)) {
      fileConfig = require(configPath);
    } else {
      console.warn(`⚠️ 配置文件不存在: ${configPath}`);
    }
  }

  const cliConfig = {
    analysisDays: parseInt(options.days) || 7,
    outputDir: options.output || './test-report',
    includePatterns: options.include ? options.include.split(',') : ['**/*.js'],
    excludePatterns: options.exclude ? options.exclude.split(',') : ['**/node_modules/**'],
    minRiskScore: parseFloat(options.minRisk) || 0,
    dryRun: options.dryRun || false,
    verbose: options.verbose || false,
    format: options.format || 'all'
  };

  return { ...fileConfig, ...cliConfig };
}

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}
