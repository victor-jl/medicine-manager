const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function getRecentCommits(days = 7) {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const output = execSync(
      `git log --since="${since.toISOString()}" --pretty=format:"%H|%an|%ae|%at|%s" --name-only`,
      { encoding: 'utf-8' }
    );

    const commits = [];
    const commitBlocks = output.split('\n\n');

    for (const block of commitBlocks) {
      const lines = block.trim().split('\n');
      if (lines.length === 0) continue;

      const headerParts = lines[0].split('|');
      if (headerParts.length < 5) continue;

      const [hash, author, email, timestamp, message] = headerParts;
      const files = lines.slice(1).filter(f => f.trim());

      commits.push({
        hash,
        author,
        email,
        timestamp: parseInt(timestamp),
        message,
        date: new Date(parseInt(timestamp) * 1000),
        files: files.map(f => path.join(process.cwd(), f))
      });
    }

    return commits;
  } catch (error) {
    console.warn('无法获取Git历史，使用模拟数据:', error.message);
    return generateMockCommits();
  }
}

function generateMockCommits() {
  const mockFiles = [
    'pages/add/add.js',
    'pages/index/index.js',
    'pages/records/records.js',
    'pages/detail/detail.js',
    'utils/ocr.js',
    'utils/baidu-ocr.js'
  ];

  return [
    {
      hash: 'abc123def456',
      author: '开发者A',
      email: 'dev@example.com',
      timestamp: Date.now() - 86400000,
      date: new Date(Date.now() - 86400000),
      message: 'feat: 新增药品有效期格式化功能',
      files: ['utils/date.js', 'pages/add/add.js'].map(f => path.join(process.cwd(), f))
    },
    {
      hash: 'def456abc789',
      author: '开发者B',
      email: 'dev2@example.com',
      timestamp: Date.now() - 172800000,
      date: new Date(Date.now() - 172800000),
      message: 'fix: 修复服药记录重复提交问题',
      files: ['pages/records/records.js', 'pages/detail/detail.js'].map(f => path.join(process.cwd(), f))
    },
    {
      hash: 'ghi789jkl012',
      author: '开发者C',
      email: 'dev3@example.com',
      timestamp: Date.now() - 259200000,
      date: new Date(Date.now() - 259200000),
      message: 'feat: 优化OCR识别结果提取逻辑',
      files: ['utils/ocr.js', 'utils/baidu-ocr.js'].map(f => path.join(process.cwd(), f))
    }
  ];
}

function analyzeChangePatterns(commits) {
  const patterns = {
    feature: [],
    bugfix: [],
    refactor: [],
    chore: [],
    unknown: []
  };

  for (const commit of commits) {
    const message = commit.message.toLowerCase();

    if (message.includes('feat') || message.includes('feature') || message.includes('新增') || message.includes('功能')) {
      patterns.feature.push(commit);
    } else if (message.includes('fix') || message.includes('bug') || message.includes('修复')) {
      patterns.bugfix.push(commit);
    } else if (message.includes('refactor') || message.includes('重构')) {
      patterns.refactor.push(commit);
    } else if (message.includes('chore') || message.includes('docs') || message.includes('style')) {
      patterns.chore.push(commit);
    } else {
      patterns.unknown.push(commit);
    }
  }

  return patterns;
}

function detectChangedFunctions(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const functions = [];

  const functionPatterns = [
    /(?:async\s+)?function\s+(\w+)\s*\(/g,
    /(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/g,
    /const\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>)/g
  ];

  for (const pattern of functionPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      functions.push(match[1]);
    }
  }

  return [...new Set(functions)];
}

function categorizeChanges(commits) {
  const categorized = {
    newLogicPaths: [],
    bugFixes: [],
    coreModules: [],
    complexLogic: [],
    businessCritical: []
  };

  const coreModules = ['utils/ocr.js', 'utils/baidu-ocr.js', 'utils/ai.js'];
  const complexPatterns = [
    /parse|validate|check/i,
    /async|await|Promise/i,
    /auth|permission|permission/i,
    /error|catch|throw/i
  ];

  for (const commit of commits) {
    for (const file of commit.files) {
      const relativePath = path.relative(process.cwd(), file);
      const isCoreModule = coreModules.some(m => file.includes(m));
      const fileContent = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '';
      const isComplex = complexPatterns.some(p => p.test(fileContent));

      if (isCoreModule) {
        categorized.coreModules.push({ commit, file });
      }

      if (isComplex) {
        categorized.complexLogic.push({ commit, file });
      }

      if (commit.message.includes('feat') || commit.message.includes('新增')) {
        categorized.newLogicPaths.push({ commit, file });
      }

      if (commit.message.includes('fix') || commit.message.includes('修复')) {
        categorized.bugFixes.push({ commit, file });
      }
    }
  }

  return categorized;
}

async function analyzeRecentChanges(config) {
  console.log(`   分析最近 ${config.analysisDays} 天的代码变更...`);

  const commits = getRecentCommits(config.analysisDays);
  const patterns = analyzeChangePatterns(commits);
  const categorized = categorizeChanges(commits);

  return {
    commits,
    patterns,
    categorized,
    summary: {
      total: commits.length,
      features: patterns.feature.length,
      bugfixes: patterns.bugfix.length,
      refactors: patterns.refactor.length,
      newLogicPaths: categorized.newLogicPaths.length,
      coreModules: categorized.coreModules.length,
      complexLogic: categorized.complexLogic.length
    }
  };
}

module.exports = {
  getRecentCommits,
  analyzeChangePatterns,
  detectChangedFunctions,
  categorizeChanges,
  analyzeRecentChanges
};
