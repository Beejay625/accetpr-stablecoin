# Auto-Commit Script Guide

This project includes two auto-commit scripts to help you automatically commit changes with intelligent commit messages.

## 🚀 Quick Start

### Using NPM Scripts (Recommended)

```bash
# Auto-commit with smart message generation
npm run commit

# Interactive mode - prompts before committing
npm run commit:interactive

# Dry run - see what would be committed
npm run commit:dry

# Watch mode - continuously monitor for changes
npm run commit:watch

# Simple bash script versions
npm run commit:simple
npm run commit:simple:interactive
npm run commit:simple:watch
```

### Direct Script Usage

```bash
# Node.js version (more features)
node auto-commit.js [options]

# Bash version (simpler, faster)
./auto-commit.sh [options]
```

## 📋 Features

### Smart Commit Messages
The scripts automatically generate commit messages based on the types of files changed:

- **Features**: `feat: update feature implementation` (controllers, services, routes, providers)
- **Fixes**: `fix: update implementation` (middleware, utils, db)
- **Documentation**: `docs: update documentation` (docs/ directory only)
- **Configuration**: `config: update configuration` (package.json, tsconfig.json, etc.)
- **Tests**: `test: update test files` (test/, spec/ directories)
- **General**: `chore: auto-commit changes` (other files)

### File Filtering
Automatically excludes files based on `.gitignore` and common patterns:
- `node_modules/`
- `dist/`
- `.env` files
- `.DS_Store`
- Log files
- Cache directories
- `*.js` files (JavaScript files)
- `*.md` files (Markdown documentation files)

### Watch Mode
Continuously monitor your repository for changes and auto-commit them:
```bash
# Check every 5 seconds (default)
npm run commit:watch

# Custom interval (10 seconds)
node auto-commit.js --watch --interval=10000
```

## 🔧 Configuration

### Node.js Script Options

```bash
node auto-commit.js [options]

Options:
  --dry-run, -d     Show what would be committed without actually committing
  --interactive, -i Prompt before committing
  --status, -s      Show git status after committing
  --watch, -w       Watch mode - continuously monitor for changes
  --interval=ms     Set watch interval in milliseconds (default: 5000)
  --help, -h        Show help message
```

### Bash Script Options

```bash
./auto-commit.sh [options]

Options:
  -i, --interactive    Prompt before committing
  -d, --dry-run        Show what would be committed without committing
  -m, --message MSG    Use custom commit message
  -w, --watch [SEC]    Watch mode - auto-commit every SEC seconds (default: 5)
  -h, --help           Show help message
```

## 📝 Examples

### Basic Usage
```bash
# Make some changes to your code
echo "// New feature" >> src/controllers/newController.ts

# Auto-commit with smart message
npm run commit
# Output: feat: update newController.ts
```

### Interactive Mode
```bash
# Prompt before committing
npm run commit:interactive
# Shows: "Do you want to proceed with this commit? (y/N): "
```

### Custom Commit Message
```bash
# Use your own message
./auto-commit.sh -m "feat: add new authentication middleware"
```

### Watch Mode
```bash
# Start watching for changes
npm run commit:watch

# Make changes in another terminal
echo "// New code" >> src/services/newService.ts

# Script automatically detects and commits the change
# Output: feat: update newService.ts
```

### Dry Run
```bash
# See what would be committed without actually committing
npm run commit:dry

# Shows all changed files and the commit message that would be used
```

## 🎯 Use Cases

### Development Workflow
1. **During Development**: Use watch mode to automatically commit changes as you work
2. **Before Testing**: Use interactive mode to review and commit changes before running tests
3. **Code Reviews**: Use dry run to see what changes will be committed before pushing

### CI/CD Integration
```bash
# In your build pipeline
npm run commit:dry  # Check for uncommitted changes
npm run commit      # Commit any remaining changes
```

### Team Collaboration
- **Feature Branches**: Use watch mode during feature development
- **Hotfixes**: Use interactive mode for quick fixes
- **Documentation**: Auto-commit documentation updates

## ⚙️ Advanced Configuration

### Customizing Commit Message Patterns

Edit the `CONFIG.patterns` object in `auto-commit.js`:

```javascript
patterns: {
  feature: ['src/controllers/', 'src/services/', 'src/routes/'],
  fix: ['src/middleware/', 'src/utils/'],
  // Add your own patterns
  custom: ['src/custom/']
}
```

### Customizing Excluded Files

Edit the `CONFIG.exclude` array in `auto-commit.js`:

```javascript
exclude: [
  'node_modules/',
  'dist/',
  '.env',
  '*.js',           // Exclude JavaScript files
  '*.md',           // Exclude Markdown files
  'your-custom-directory/',
  '*.custom-extension'
]
```

## 🚨 Important Notes

### Git Safety
- The scripts respect your `.gitignore` file
- They won't commit files that are already staged for a different commit
- Use `--dry-run` to preview changes before committing

### Watch Mode Considerations
- Watch mode runs continuously until stopped (Ctrl+C)
- It only commits when there are actual changes
- Be careful not to leave it running on production systems

### Commit History
- Each auto-commit creates a new commit in your git history
- Consider squashing commits before merging to main branch
- Use interactive mode for important changes that need review

## 🔍 Troubleshooting

### Common Issues

1. **"Not in a git repository"**
   - Make sure you're in the project root directory
   - Ensure the directory is initialized with `git init`

2. **Permission denied on shell script**
   ```bash
   chmod +x auto-commit.sh
   ```

3. **Node.js script not found**
   - Make sure you're in the project directory
   - Check that `auto-commit.js` exists

4. **No changes to commit**
   - This is normal when there are no uncommitted changes
   - The script will exit successfully with a message

### Debug Mode
Add `--dry-run` to any command to see what would happen without making changes.

## 📚 Integration with IDE

### VS Code Tasks
Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Auto Commit",
      "type": "shell",
      "command": "npm run commit",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
```

### Git Hooks
You can integrate with git hooks for automated workflows:

```bash
# In .git/hooks/post-commit
#!/bin/bash
echo "Changes committed successfully!"
```

## 🤝 Contributing

Feel free to customize these scripts for your specific needs:

1. Fork the scripts
2. Modify the configuration
3. Add new features
4. Share improvements with the team

---

**Happy coding! 🎉**
