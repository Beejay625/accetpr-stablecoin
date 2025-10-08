#!/usr/bin/env node

/**
 * Auto-commit script for StableStack Backend
 * 
 * This script automatically commits changes to git with intelligent commit messages
 * based on the types of files changed. It respects .gitignore and provides
 * options for different commit behaviors.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Commit message templates
  messages: {
    feature: 'feat: {description}',
    fix: 'fix: {description}',
    docs: 'docs: {description}',
    style: 'style: {description}',
    refactor: 'refactor: {description}',
    test: 'test: {description}',
    chore: 'chore: {description}',
    default: 'chore: auto-commit changes'
  },
  
  // File patterns for different commit types
  patterns: {
    feature: ['src/controllers/', 'src/services/', 'src/routes/', 'src/providers/'],
    fix: ['src/middleware/', 'src/utils/', 'src/db/'],
    docs: ['docs/'],
    style: ['src/', '*.ts'],
    test: ['test/', 'spec/', '*.test.', '*.spec.'],
    config: ['package.json', 'tsconfig.json', '.eslintrc', 'nodemon.json', 'prisma/schema.prisma']
  },
  
  // Files to always exclude
  exclude: [
    'node_modules/',
    'dist/',
    '.env',
    '.DS_Store',
    '*.log',
    '.cache/',
    '.tmp/',
    '*.js',
    '*.md'
  ]
};

class AutoCommit {
  constructor() {
    this.projectRoot = process.cwd();
    this.gitRoot = this.findGitRoot();
  }

  findGitRoot() {
    try {
      const result = execSync('git rev-parse --show-toplevel', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      return result.trim();
    } catch (error) {
      console.error('❌ Not in a git repository');
      process.exit(1);
    }
  }

  getChangedFiles() {
    try {
      const result = execSync('git status --porcelain', { 
        encoding: 'utf8',
        cwd: this.gitRoot 
      });
      
      const files = result
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
          const status = line.substring(0, 2).trim();
          const file = line.substring(3);
          return { status, file };
        })
        .filter(({ file }) => !this.shouldExcludeFile(file));
      
      return files;
    } catch (error) {
      console.error('❌ Failed to get git status:', error.message);
      return [];
    }
  }

  shouldExcludeFile(filePath) {
    return CONFIG.exclude.some(pattern => {
      if (pattern.endsWith('/')) {
        return filePath.includes(pattern);
      }
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(filePath);
      }
      return filePath.includes(pattern);
    });
  }

  categorizeChanges(files) {
    const categories = {
      feature: [],
      fix: [],
      docs: [],
      style: [],
      test: [],
      config: [],
      other: []
    };

    files.forEach(({ file }) => {
      let categorized = false;
      
      for (const [category, patterns] of Object.entries(CONFIG.patterns)) {
        if (patterns.some(pattern => file.includes(pattern.replace(/\//g, '')))) {
          categories[category].push(file);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        categories.other.push(file);
      }
    });

    return categories;
  }

  generateCommitMessage(categories) {
    const nonEmptyCategories = Object.entries(categories).filter(([_, files]) => files.length > 0);
    
    if (nonEmptyCategories.length === 0) {
      return CONFIG.messages.default;
    }

    if (nonEmptyCategories.length === 1) {
      const [category, files] = nonEmptyCategories[0];
      const description = this.generateDescription(files, category);
      return CONFIG.messages[category].replace('{description}', description);
    }

    // Multiple categories - create a more general message
    const descriptions = nonEmptyCategories.map(([category, files]) => {
      return `${category} (${files.length} files)`;
    });
    
    return `chore: update ${descriptions.join(', ')}`;
  }

  generateDescription(files, category) {
    if (files.length === 1) {
      const fileName = path.basename(files[0]);
      return `update ${fileName}`;
    }
    
    if (files.length <= 3) {
      return `update ${files.map(f => path.basename(f)).join(', ')}`;
    }
    
    return `update ${files.length} ${category} files`;
  }

  async commitChanges(message) {
    try {
      console.log('📝 Staging changes...');
      execSync('git add .', { cwd: this.gitRoot });
      
      console.log(`💾 Committing: ${message}`);
      execSync(`git commit -m "${message}"`, { cwd: this.gitRoot });
      
      console.log('✅ Changes committed successfully!');
      return true;
    } catch (error) {
      console.error('❌ Failed to commit:', error.message);
      return false;
    }
  }

  showStatus() {
    try {
      console.log('\n📊 Current Git Status:');
      execSync('git status --short', { 
        cwd: this.gitRoot,
        stdio: 'inherit' 
      });
    } catch (error) {
      console.error('Failed to show git status:', error.message);
    }
  }

  async run(options = {}) {
    console.log('🚀 Auto-commit script starting...\n');
    
    const files = this.getChangedFiles();
    
    if (files.length === 0) {
      console.log('✨ No changes to commit!');
      return;
    }

    console.log(`📋 Found ${files.length} changed files:`);
    files.forEach(({ status, file }) => {
      console.log(`  ${status} ${file}`);
    });

    const categories = this.categorizeChanges(files);
    const message = this.generateCommitMessage(categories);
    
    console.log(`\n📝 Generated commit message: ${message}`);
    
    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be committed');
      return;
    }

    if (options.interactive) {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to proceed with this commit? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (!answer.toLowerCase().startsWith('y')) {
        console.log('❌ Commit cancelled');
        return;
      }
    }

    const success = await this.commitChanges(message);
    
    if (success && options.showStatus) {
      this.showStatus();
    }
  }

  // Watch mode - continuously monitor for changes
  async watch(interval = 5000) {
    console.log(`👀 Watching for changes every ${interval}ms...`);
    console.log('Press Ctrl+C to stop\n');
    
    let lastCommitHash = this.getLastCommitHash();
    
    const watchInterval = setInterval(async () => {
      const currentHash = this.getLastCommitHash();
      const files = this.getChangedFiles();
      
      if (files.length > 0) {
        console.log(`\n🔄 Changes detected at ${new Date().toLocaleTimeString()}`);
        await this.run({ interactive: false, showStatus: false });
        lastCommitHash = this.getLastCommitHash();
      }
    }, interval);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n👋 Stopping auto-commit watcher...');
      clearInterval(watchInterval);
      process.exit(0);
    });
  }

  getLastCommitHash() {
    try {
      const result = execSync('git rev-parse HEAD', { 
        encoding: 'utf8',
        cwd: this.gitRoot 
      });
      return result.trim();
    } catch (error) {
      return null;
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const autoCommit = new AutoCommit();
  
  const options = {
    dryRun: args.includes('--dry-run'),
    interactive: args.includes('--interactive') || args.includes('-i'),
    showStatus: args.includes('--status') || args.includes('-s'),
    watch: args.includes('--watch') || args.includes('-w')
  };

  const watchInterval = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
  const interval = watchInterval ? parseInt(watchInterval) : 5000;

  if (options.watch) {
    await autoCommit.watch(interval);
  } else {
    await autoCommit.run(options);
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Auto-commit script for StableStack Backend

Usage: node auto-commit.js [options]

Options:
  --dry-run, -d     Show what would be committed without actually committing
  --interactive, -i Prompt before committing
  --status, -s      Show git status after committing
  --watch, -w       Watch mode - continuously monitor for changes
  --interval=ms     Set watch interval in milliseconds (default: 5000)
  --help, -h        Show this help message

Examples:
  node auto-commit.js                    # Auto-commit with smart message
  node auto-commit.js --interactive     # Prompt before committing
  node auto-commit.js --dry-run         # See what would be committed
  node auto-commit.js --watch           # Watch for changes every 5 seconds
  node auto-commit.js --watch --interval=10000  # Watch every 10 seconds
`);
  process.exit(0);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = AutoCommit;
