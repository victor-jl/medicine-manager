const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function validateTestSyntax(testFile) {
  try {
    require.resolve(testFile);
    return { valid: true, errors: [] };
  } catch (error) {
    return {
      valid: false,
      errors: [error.message]
    };
  }
}

function checkDependencies(testFile) {
  const content = fs.readFileSync(testFile, 'utf-8');
  const dependencies = [];

  const requireMatches = content.match(/require\s*\(['"]([^'"]+)['"]\)/g) || [];
  const importMatches = content.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g) || [];

  requireMatches.forEach(match => {
    const dep = match.match(/require\s*\(['"]([^'"]+)['"]\)/)[1];
    if (!dependencies.includes(dep)) {
      dependencies.push(dep);
    }
  });

  importMatches.forEach(match => {
    const dep = match.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/)[1];
    if (!dependencies.includes(dep)) {
      dependencies.push(dep);
    }
  });

  return {
    total: dependencies.length,
    list: dependencies,
    hasExternalDeps: dependencies.some(d => !d.startsWith('.') && !d.startsWith('/'))
  };
}

function validateTestStructure(testFile) {
  const content = fs.readFileSync(testFile, 'utf-8');
  const issues = [];

  const hasDescribe = /describe\s*\(/ .test(content);
  const hasIt = /it\s*\(/ .test(content) || /test\s*\(/ .test(content);
  const hasExpect = /expect\s*\(/ .test(content);

  if (!hasDescribe) {
    issues.push('测试缺少 describe 块');
  }

  if (!hasIt) {
    issues.push('测试缺少 it 或 test 块');
  }

  if (!hasExpect) {
    issues.push('测试缺少 expect 断言');
  }

  const describeCount = (content.match(/describe\s*\(/g) || []).length;
  const itCount = (content.match(/it\s*\(|test\s*\(/g) || []).length;

  if (itCount === 0) {
    issues.push('没有实际的测试用例');
  }

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      describeBlocks: describeCount,
      testBlocks: itCount,
      hasAssertions: hasExpect
    }
  };
}

function checkTestDeterminism(testFile) {
  const content = fs.readFileSync(testFile, 'utf-8');
  const issues = [];

  const hasMathRandom = /Math\.random\(\)/ .test(content);
  const hasDateNow = /Date\.now\(\)/ .test(content);
  const hasNewDate = /new\s+Date\(\)/ .test(content);
  const hasHardcodedTimestamp = /\d{13}/ .test(content);

  if (hasMathRandom) {
    issues.push('测试使用 Math.random() 可能导致不确定性');
  }

  if ((hasDateNow || hasNewDate) && !hasHardcodedTimestamp) {
    issues.push('测试使用动态日期可能受系统时间影响');
  }

  const hasAsyncSetTimeout = /setTimeout\s*\(/ .test(content);
  if (hasAsyncSetTimeout) {
    issues.push('测试使用 setTimeout 可能导致异步问题');
  }

  return {
    deterministic: issues.length === 0,
    issues
  };
}

async function runTestFile(testFile) {
  try {
    const result = execSync(`npm test -- "${testFile}"`, {
      encoding: 'utf-8',
      timeout: 30000,
      stdio: 'pipe'
    });

    return {
      success: true,
      output: result,
      duration: 0
    };
  } catch (error) {
    return {
      success: false,
      output: error.stdout || error.message,
      error: error.stderr || '',
      duration: 0
    };
  }
}

async function validateGeneratedTests(tests) {
  console.log('   验证生成的测试...\n');

  const validations = [];

  for (const test of tests) {
    console.log(`   验证: ${test.name}`);

    const syntaxValidation = validateTestSyntax(test.file);
    const structureValidation = validateTestStructure(test.file);
    const determinismCheck = checkTestDeterminism(test.file);
    const dependencies = checkDependencies(test.file);

    const validation = {
      testName: test.name,
      file: test.file,
      syntax: syntaxValidation,
      structure: structureValidation,
      determinism: determinismCheck,
      dependencies,
      overall: syntaxValidation.valid &&
               structureValidation.valid &&
               determinismCheck.deterministic
    };

    validations.push(validation);

    if (validation.overall) {
      console.log(`     ✓ 语法正确`);
      console.log(`     ✓ 结构正确`);
      console.log(`     ✓ 确定性良好`);
    } else {
      if (!syntaxValidation.valid) {
        console.log(`     ✗ 语法错误: ${syntaxValidation.errors.join(', ')}`);
      }
      if (!structureValidation.valid) {
        console.log(`     ✗ 结构问题: ${structureValidation.issues.join(', ')}`);
      }
      if (!determinismCheck.deterministic) {
        console.log(`     ⚠ 不确定性问题: ${determinismCheck.issues.join(', ')}`);
      }
    }

    console.log('');
  }

  return validations;
}

async function validateCoverage(tests) {
  console.log('   检查测试覆盖情况...\n');

  const coverageResults = [];

  for (const test of tests) {
    const testContent = fs.readFileSync(test.file, 'utf-8');

    const coveredFunctions = [];
    const patterns = [
      /describe\s*\(['"]([^'"]+)['"]/g,
      /it\s*\(['"]([^'"]+)['"]/g,
      /test\s*\(['"]([^'"]+)['"]/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(testContent)) !== null) {
        coveredFunctions.push(match[1]);
      }
    }

    coverageResults.push({
      testName: test.name,
      coveredFunctions: [...new Set(coveredFunctions)],
      totalFunctions: coveredFunctions.length,
      estimatedCoverage: Math.min(100, coveredFunctions.length * 10)
    });
  }

  return coverageResults;
}

async function runTests(tests) {
  console.log('   运行测试套件...\n');

  const results = [];

  for (const test of tests) {
    console.log(`   运行: ${test.name}`);

    const result = await runTestFile(test.file);

    results.push({
      testName: test.name,
      file: test.file,
      ...result
    });

    if (result.success) {
      console.log(`     ✓ 通过`);
    } else {
      console.log(`     ✗ 失败`);
    }

    console.log('');
  }

  const summary = {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    passRate: (results.filter(r => r.success).length / results.length * 100).toFixed(2)
  };

  console.log(`   测试结果: ${summary.passed}/${summary.total} 通过 (${summary.passRate}%)`);

  return { results, summary };
}

function generateTestManifest(tests) {
  return {
    generatedAt: new Date().toISOString(),
    totalTests: tests.length,
    tests: tests.map(t => ({
      name: t.name,
      file: t.file,
      priority: t.priority,
      estimatedLines: t.linesOfCode || 0
    }))
  };
}

async function testRunner(tests) {
  console.log('📋 测试运行器\n');

  console.log('阶段1: 验证测试语法和结构');
  const validations = await validateGeneratedTests(tests);

  console.log('阶段2: 检查测试覆盖');
  const coverage = await validateCoverage(tests);

  const manifest = generateTestManifest(tests);

  return {
    validations,
    coverage,
    manifest,
    summary: {
      total: validations.length,
      valid: validations.filter(v => v.overall).length,
      invalid: validations.filter(v => !v.overall).length,
      unstable: validations.filter(v => !v.determinism.deterministic).length
    }
  };
}

module.exports = {
  validateTestSyntax,
  validateTestStructure,
  checkTestDeterminism,
  validateGeneratedTests,
  validateCoverage,
  runTests,
  testRunner
};
