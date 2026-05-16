const fs = require('fs');
const path = require('path');

function calculateRiskScore(gap, categorizedChanges) {
  let score = gap.riskScore || 10;

  const factors = {
    isNewFeature: false,
    isBugFix: false,
    isCoreModule: false,
    hasComplexLogic: false,
    isBusinessCritical: false,
    hasDownstreamImpact: false
  };

  if (categorizedChanges.newLogicPaths.some(c => c.file === gap.file)) {
    factors.isNewFeature = true;
    score *= 1.3;
  }

  if (categorizedChanges.bugFixes.some(c => c.file === gap.file)) {
    factors.isBugFix = true;
    score *= 1.4;
  }

  if (categorizedChanges.coreModules.some(c => c.file === gap.file)) {
    factors.isCoreModule = true;
    score *= 1.5;
  }

  if (gap.complexity && gap.complexity.level === 'high') {
    factors.hasComplexLogic = true;
    score *= 1.2;
  }

  const businessCriticalPatterns = [
    /medicine|drug|patient/i,
    /record|take|prescription/i,
    /ocr|recognize|identify/i,
    /api|request|response/i
  ];

  if (businessCriticalPatterns.some(p => p.test(gap.relativePath))) {
    factors.isBusinessCritical = true;
    score *= 1.3;
  }

  if (gap.downstreamAffected && gap.downstreamAffected.requires > 2) {
    factors.hasDownstreamImpact = true;
    score *= 1.2;
  }

  return Math.round(score * 10) / 10;
}

function getRiskLevel(score) {
  if (score >= 20) return 'critical';
  if (score >= 15) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
}

function identifyRiskFactors(gap, categorizedChanges) {
  const factors = [];

  if (gap.complexity && gap.complexity.level === 'critical') {
    factors.push({
      factor: 'criticalComplexity',
      description: '代码复杂度极高，缺乏测试覆盖可能导致严重问题',
      impact: '可能导致关键功能在边界条件下失效'
    });
  }

  if (categorizedChanges.newLogicPaths.some(c => c.file === gap.file)) {
    factors.push({
      factor: 'newFeature',
      description: '新增功能路径',
      impact: '新逻辑未被测试验证，可能存在未发现的功能缺陷'
    });
  }

  if (categorizedChanges.bugFixes.some(c => c.file === gap.file)) {
    factors.push({
      factor: 'bugFix',
      description: 'Bug修复提交',
      impact: '修复后可能引入新的问题或未完全解决问题'
    });
  }

  if (categorizedChanges.coreModules.some(c => c.file === gap.file)) {
    factors.push({
      factor: 'coreModule',
      description: '核心模块变更',
      impact: '影响下游多个模块，需要确保向后兼容性'
    });
  }

  if (gap.complexity && gap.complexity.factors) {
    for (const factor of gap.complexity.factors) {
      if (factor.factor === 'highAsyncUsage') {
        factors.push({
          factor: 'asyncComplexity',
          description: '大量异步操作',
          impact: '异步处理错误可能导致数据不一致或竞态条件'
        });
      }
      if (factor.factor === 'dataParsing') {
        factors.push({
          factor: 'parsingRisk',
          description: '数据解析逻辑',
          impact: '解析错误可能导致应用崩溃或显示错误数据'
        });
      }
      if (factor.factor === 'heavyValidation') {
        factors.push({
          factor: 'validationComplexity',
          description: '复杂验证逻辑',
          impact: '验证规则变更可能影响数据完整性和安全性'
        });
      }
    }
  }

  const patterns = {
    parse: /parse|JSON\.parse|parseInt|parseFloat/,
    async: /async|await|Promise/,
    auth: /auth|permission|login|token/,
    validate: /valid|check|verify/,
    error: /catch|throw|error/
  };

  const fileContent = gap._cachedContent || (gap.file && fs.existsSync(gap.file) ? fs.readFileSync(gap.file, 'utf-8') : '');

  for (const [name, pattern] of Object.entries(patterns)) {
    if (fileContent && pattern.test(fileContent)) {
      factors.push({
        factor: name,
        description: `包含${name}相关的复杂逻辑`,
        impact: `${name}相关逻辑需要充分测试`
      });
    }
  }

  return factors;
}

function generateRecommendations(gap, riskLevel) {
  const recommendations = [];

  if (riskLevel === 'critical' || riskLevel === 'high') {
    recommendations.push({
      type: 'test',
      priority: 'immediate',
      description: '必须立即生成测试用例'
    });

    recommendations.push({
      type: 'coverage',
      priority: 'immediate',
      description: '需要达到80%以上的代码覆盖率'
    });
  }

  if (gap.complexity && gap.complexity.factors) {
    for (const factor of gap.complexity.factors) {
      if (factor.factor === 'dataParsing') {
        recommendations.push({
          type: 'edgeCase',
          priority: 'high',
          description: '测试各种输入格式和异常情况'
        });
      }
      if (factor.factor === 'highAsyncUsage') {
        recommendations.push({
          type: 'async',
          priority: 'high',
          description: '测试异步操作的错误处理和超时情况'
        });
      }
    }
  }

  recommendations.push({
    type: 'integration',
    priority: 'medium',
    description: '考虑添加集成测试验证模块间交互'
  });

  return recommendations;
}

function shouldGenerateTest(riskLevel, gap) {
  if (riskLevel === 'critical') return true;
  if (riskLevel === 'high' && gap.isInChangeSet) return true;
  if (riskLevel === 'medium' && gap.priority === 'high') return true;
  return false;
}

function categorizeTestPriority(assessments) {
  const categorized = {
    critical: [],
    high: [],
    medium: [],
    low: []
  };

  for (const assessment of assessments) {
    categorized[assessment.riskLevel].push(assessment);
  }

  return categorized;
}

async function assessRiskPriority(gaps, config) {
  console.log('   评估风险优先级...');

  const categorizedChanges = config.changes || {
    newLogicPaths: [],
    bugFixes: [],
    coreModules: [],
    complexLogic: []
  };

  const assessments = [];

  for (const gap of gaps) {
    const score = calculateRiskScore(gap, categorizedChanges);
    const riskLevel = getRiskLevel(score);
    const riskFactors = identifyRiskFactors(gap, categorizedChanges);
    const recommendations = generateRecommendations(gap, riskLevel);

    assessments.push({
      gap,
      score,
      riskLevel,
      riskFactors,
      recommendations,
      shouldGenerateTest: shouldGenerateTest(riskLevel, gap)
    });
  }

  const sortedAssessments = assessments.sort((a, b) => b.score - a.score);
  const categorized = categorizeTestPriority(sortedAssessments);

  console.log(`   评估完成：${categorized.critical.length} 个严重，${categorized.high.length} 个高风险`);

  return {
    assessments: sortedAssessments,
    categorized,
    summary: {
      critical: categorized.critical.length,
      high: categorized.high.length,
      medium: categorized.medium.length,
      low: categorized.low.length,
      shouldGenerateTests: sortedAssessments.filter(a => a.shouldGenerateTest).length
    }
  };
}

module.exports = {
  calculateRiskScore,
  assessRiskPriority,
  getRiskLevel,
  identifyRiskFactors,
  generateRecommendations,
  shouldGenerateTest,
  categorizeTestPriority
};
