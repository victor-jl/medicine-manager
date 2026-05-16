const fs = require('fs');
const path = require('path');

function findTestFiles(sourceDir = process.cwd()) {
  const testPatterns = [
    '**/*.test.js',
    '**/*.spec.js',
    '**/__tests__/**/*.js',
    '**/test/**/*.js',
    '**/tests/**/*.js'
  ];

  const testFiles = [];

  for (const pattern of testPatterns) {
    const glob = require('glob');
    const matches = glob.sync(pattern, { cwd: sourceDir, absolute: true });
    testFiles.push(...matches);
  }

  return [...new Set(testFiles)];
}

function parseExistingTests(testFiles) {
  const parsed = {};

  for (const file of testFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(process.cwd(), file);

    const describeBlocks = content.match(/describe\s*\(['"]([^'"]+)['"]/g) || [];
    const itBlocks = content.match(/it\s*\(['"]([^'"]+)['"]/g) || [];
    const testBlocks = content.match(/test\s*\(['"]([^'"]+)['"]/g) || [];

    parsed[relativePath] = {
      file,
      exists: true,
      describeCount: describeBlocks.length,
      testCount: itBlocks.length + testBlocks.length,
      describeNames: describeBlocks.map(b => b.match(/['"]([^'"]+)['"]/)[1]),
      testNames: [...itBlocks, ...testBlocks].map(b => b.match(/['"]([^'"]+)['"]/)[1])
    };
  }

  return parsed;
}

function extractFunctions(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const functions = [];

  const patterns = [
    {
      name: 'functionDeclaration',
      regex: /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g
    },
    {
      name: 'arrowFunction',
      regex: /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g
    },
    {
      name: 'method',
      regex: /(\w+)\s*\([^)]*\)\s*\{/g
    }
  ];

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    while ((match = regex.exec(content)) !== null) {
      if (!['if', 'for', 'while', 'switch', 'catch'].includes(match[1])) {
        functions.push({
          name: match[1],
          type: pattern.name
        });
      }
    }
  }

  return [...new Map(functions.map(f => [f.name, f])).values()];
}

function analyzeComplexity(filePath) {
  if (!fs.existsSync(filePath)) {
    return { score: 0, level: 'unknown', factors: [] };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const factors = [];

  const asyncCount = (content.match(/async\s+/g) || []).length;
  if (asyncCount > 3) {
    factors.push({ factor: 'highAsyncUsage', weight: 2, count: asyncCount });
  }

  const promiseCount = (content.match(/Promise/g) || []).length;
  if (promiseCount > 2) {
    factors.push({ factor: 'multiplePromises', weight: 1.5, count: promiseCount });
  }

  const errorHandling = (content.match(/catch\s*\(|throw\s+new\s+Error|reject\(/g) || []).length;
  if (errorHandling > 2) {
    factors.push({ factor: 'complexErrorHandling', weight: 1.2, count: errorHandling });
  }

  const validation = (content.match(/if\s*\([^)]*(?:===|!==|==|!=|valid|check)/g) || []).length;
  if (validation > 3) {
    factors.push({ factor: 'heavyValidation', weight: 1.3, count: validation });
  }

  const parseCount = (content.match(/(?:parse|JSON\.parse|parseInt|parseFloat)/g) || []).length;
  if (parseCount > 1) {
    factors.push({ factor: 'dataParsing', weight: 1.4, count: parseCount });
  }

  const linesOfCode = content.split('\n').length;
  const cyclomaticComplexity = factors.reduce((sum, f) => sum + f.count * f.weight, 0) +
                               Math.floor(linesOfCode / 100);

  let level = 'low';
  if (cyclomaticComplexity > 15) level = 'critical';
  else if (cyclomaticComplexity > 10) level = 'high';
  else if (cyclomaticComplexity > 5) level = 'medium';

  return {
    score: cyclomaticComplexity,
    level,
    factors,
    linesOfCode
  };
}

function detectCoverageGaps(sourceFiles, existingTests, categorizedChanges) {
  const gaps = [];

  for (const file of sourceFiles) {
    const relativePath = path.relative(process.cwd(), file);
    const hasTest = existingTests[relativePath];
    const complexity = analyzeComplexity(file);
    const functions = extractFunctions(file);

    const isInChangeSet = categorizedChanges.newLogicPaths.some(c => c.file === file) ||
                         categorizedChanges.bugFixes.some(c => c.file === file) ||
                         categorizedChanges.coreModules.some(c => c.file === file);

    if (!hasTest) {
      const riskScore = calculateGapRiskScore(complexity, isInChangeSet, functions.length);
      gaps.push({
        file,
        relativePath,
        reason: determineGapReason(complexity, isInChangeSet),
        riskScore,
        riskLevel: getRiskLevel(riskScore),
        complexity,
        functions: functions.map(f => f.name),
        isInChangeSet,
        priority: isInChangeSet ? 'high' : 'medium'
      });
    } else if (hasTest.testCount < functions.length * 0.5) {
      gaps.push({
        file,
        relativePath,
        reason: 'insufficientTestCoverage',
        riskScore: complexity.score * 0.5,
        riskLevel: getRiskLevel(complexity.score * 0.5),
        complexity,
        functions: functions.filter(f => !hasTest.testNames.includes(f.name)).map(f => f.name),
        isInChangeSet,
        priority: 'medium'
      });
    }
  }

  return gaps.sort((a, b) => b.riskScore - a.riskScore);
}

function calculateGapRiskScore(complexity, isInChangeSet, functionCount) {
  let score = complexity.score;

  if (isInChangeSet) {
    score *= 1.5;
  }

  if (functionCount > 10) {
    score *= 1.2;
  }

  return Math.round(score * 10) / 10;
}

function getRiskLevel(score) {
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

function determineGapReason(complexity, isInChangeSet) {
  if (complexity.level === 'critical') {
    return 'criticalComplexityNoTest';
  }
  if (complexity.level === 'high') {
    return 'highComplexityNoTest';
  }
  if (isInChangeSet) {
    return 'changedFileNoTest';
  }
  return 'noTestFound';
}

function identifyCriticalPaths(gaps, categorizedChanges) {
  const criticalPaths = [];

  for (const change of categorizedChanges.coreModules) {
    const gap = gaps.find(g => g.file === change.file);
    if (gap) {
      criticalPaths.push({
        ...gap,
        reason: 'coreModuleChanged',
        impact: 'high',
        downstreamAffected: detectDownstreamUsage(change.file)
      });
    }
  }

  return criticalPaths;
}

function detectDownstreamUsage(file) {
  const sourceDir = path.dirname(file);
  const content = fs.readFileSync(file, 'utf-8');

  const requireMatch = content.match(/require\s*\(['"]([^'"]+)['"]\)/g) || [];
  const importMatch = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];

  return {
    requires: requireMatch ? requireMatch.length : 0,
    imports: importMatch ? importMatch.length : 0
  };
}

async function analyzeCoverageGaps(config) {
  console.log('   扫描源文件...');

  const glob = require('glob');
  const sourceFiles = [];

  for (const pattern of config.includePatterns) {
    const matches = glob.sync(pattern, {
      cwd: process.cwd(),
      absolute: true,
      ignore: config.excludePatterns
    });
    sourceFiles.push(...matches);
  }

  const uniqueSourceFiles = [...new Set(sourceFiles)];
  console.log(`   发现 ${uniqueSourceFiles.length} 个源文件`);

  console.log('   分析现有测试...');
  const testFiles = findTestFiles();
  const existingTests = parseExistingTests(testFiles);
  console.log(`   发现 ${testFiles.length} 个测试文件`);

  const categorizedChanges = config.changes?.categorized || {
    newLogicPaths: [],
    bugFixes: [],
    coreModules: [],
    complexLogic: []
  };

  console.log('   检测覆盖率缺口...');
  const gaps = detectCoverageGaps(uniqueSourceFiles, existingTests, categorizedChanges);
  const criticalPaths = identifyCriticalPaths(gaps, categorizedChanges);

  return {
    gaps,
    criticalPaths,
    existingTests,
    summary: {
      totalSourceFiles: uniqueSourceFiles.length,
      testedFiles: Object.keys(existingTests).length,
      untestedFiles: uniqueSourceFiles.length - Object.keys(existingTests).length,
      highPriorityGaps: gaps.filter(g => g.priority === 'high').length,
      criticalPathsCount: criticalPaths.length
    }
  };
}

module.exports = {
  findTestFiles,
  parseExistingTests,
  extractFunctions,
  analyzeComplexity,
  detectCoverageGaps,
  identifyCriticalPaths,
  analyzeCoverageGaps
};
