# Cursor IDE Setup Guide

## Essential Settings Configuration

### 1. Enable Key Features
```
Settings > Features > Chat & Composer
✅ Enable Agent Mode (default mode)
✅ Enable YOLO Mode
✅ Enable long context model (Claude 3.5 Sonnet)
```

### 2. YOLO Mode Configuration
**Location**: Settings > Features > Chat & Composer > YOLO Mode Settings

**Recommended Prompt**:
```
Test commands are always allowed: npm test, jest, vitest, yarn test
Build commands are allowed: npm run build, tsc, yarn build
Package management: npm install, yarn add, npm ci
File operations: mkdir, touch, cp, mv (but not rm -rf)
Git operations: git add, git commit, git status, git diff
```

**Allow List** (optional):
```
npm, yarn, git, mkdir, touch, tsc, jest, vitest
```

### 3. Model Selection
**Primary Model**: Claude 3.5 Sonnet (best for most tasks)
**Fallback**: o1-mini (for complex logical problems)
**MAX Mode**: Available for complex tasks (200 tool calls vs 25)

### 4. Rules for AI (Global Settings)
**Location**: Settings > General > Rules for AI

**Recommended Global Rules**:
```
You are a senior developer focused on clean, maintainable code across multiple languages.

Code Standards:
- Use TypeScript strict mode for TS projects
- Use proper type hints and formatting for Python projects
- Prefer functional programming patterns where appropriate
- Write comprehensive tests for all functions
- Use async/await over promises in async code
- Include proper error handling

Documentation & Structure:
- Maintain high-quality documentation that stays current
- Create modular, componentized code structures
- Keep dependencies and environment management clean
- Write clear README files and API documentation

Communication:
- Be concise and direct
- Provide working code, not pseudocode
- Explain complex logic with inline comments
- Suggest improvements when you see them

Testing:
- Write tests first when implementing new features
- Test both success and error cases
- Use descriptive test names
- Maintain high test coverage
```

### 5. Index Management
**Location**: Settings > Features > Codebase Indexing

✅ **Enable codebase indexing**
✅ **Auto-sync on file changes**
✅ **Index node_modules** (for better autocomplete)

**Manual resync**: Use Command Palette > "Resync Codebase Index" when creating/deleting many files

---

## Recommended Extensions

### Essential Extensions
1. **Prettier - Code formatter**
   - Auto-format on save
   - Consistent code style across team
   - Built-in TypeScript support

2. **ESLint**
   - Real-time linting
   - Catches errors before runtime
   - Enforces coding standards

3. **GitLens** Alternative: **Git Graph**
   - **Git Graph** is free and provides excellent visualization
   - Shows branch history, commits, and merges
   - Less intrusive than GitLens premium prompts
   - Right-click any file > "Git Graph: View Git Graph"

4. **Thunder Client** or **REST Client**
   - Test APIs directly in VS Code
   - Useful for testing Companies House API
   - Alternative to Postman

### TypeScript Development
1. **Auto Rename Tag**
   - Automatically renames paired HTML/JSX tags
   
2. **Bracket Pair Colorizer** (built into Cursor)
   - Already enabled by default
   
3. **Path Intellisense**
   - Autocomplete for file paths in imports

### Optional Quality-of-Life Extensions
1. **Color Highlight**
   - Shows color previews in CSS/code
   
2. **Todo Tree**
   - Highlights TODO/FIXME comments
   - Useful for tracking work items

3. **Error Lens**
   - Shows errors inline in code
   - Faster error identification

4. **Python Extension** (if working with Python)
   - Official Python extension by Microsoft
   - Includes IntelliSense, debugging, formatting
   - Works well with Cursor's AI features

---

## Project-Specific Configuration

### 1. Create .cursor/rules Directory
**Location**: Project root > `.cursor/rules/`

**Create**: `typescript-node-mcp.mdc`
```markdown
---
description: TypeScript Node.js MCP server development guidelines
globs: ["*.ts", "*.js"]
alwaysApply: true
---

# TypeScript MCP Server Guidelines

## Project Structure
- Use `src/` for source code
- Use `tests/` for test files
- Use `dist/` for compiled output

## Code Standards
- All functions must have TypeScript types
- Use Zod for runtime validation
- Export interfaces for all tool inputs
- Include JSDoc comments for public APIs

## MCP Patterns
- Tools return: `{ content: [{ type: "text", text: "..." }] }`
- Use async/await throughout
- Handle all error cases gracefully
- Cache responses appropriately

## Testing
- Write tests first (TDD approach)
- Test success and error paths
- Use descriptive test names
- Mock external API calls
```

### 2. Configure Workspace Settings
**Location**: `.vscode/settings.json` (create if doesn't exist)

```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true
  },
  "jest.jestCommandLine": "npm test"
}
```

---

## Key Keyboard Shortcuts

### Agent Mode
- **Cmd/Ctrl + I**: Open Agent Mode (primary interface)
- **Cmd/Ctrl + K**: Quick code edit/generation
- **Cmd/Ctrl + L**: Open Chat Mode

### File Navigation
- **Cmd/Ctrl + P**: Quick file open
- **Cmd/Ctrl + Shift + P**: Command palette
- **Cmd/Ctrl + `**: Toggle terminal

### Code Actions
- **Cmd/Ctrl + .**: Show code actions/quick fixes
- **F2**: Rename symbol
- **Cmd/Ctrl + F12**: Go to implementation

---

## Git Integration Setup

### 1. Configure Git Graph Extension
**After installing Git Graph**:
- Right-click in Explorer > "Git Graph: View Git Graph"
- Pin the Git Graph tab for easy access
- Configure in settings for better visualization

### 2. Built-in Git Features
Cursor includes excellent built-in Git support:
- **Source Control panel** (Cmd/Ctrl + Shift + G)
- **Inline blame annotations** (toggle in settings)
- **Diff viewing** (click modified files)
- **Branch switching** (bottom status bar)

---

## Performance Optimization

### 1. Exclude Large Directories
**Location**: Settings > Files > Exclude

Add patterns:
```
**/node_modules
**/dist
**/build
**/.next
**/coverage
```

### 2. TypeScript Performance
**Location**: Settings > TypeScript

✅ **Enable semantic highlighting**
✅ **Enable inlay hints** (for parameter names)
🔳 **Disable TypeScript surveys** (reduces notifications)

### 3. Cursor-Specific Performance
- **Limit agent conversation length** (start fresh conversations for new topics)
- **Use specific file references** (@filename.ts) rather than broad context
- **Break large tasks** into smaller, focused prompts

---

## Troubleshooting Common Issues

### Agent Mode Not Working
1. Check model selection (bottom-left dropdown)
2. Verify YOLO mode is enabled if needed
3. Restart Cursor IDE
4. Clear conversation and start fresh

### Extensions Not Loading
1. Check extension compatibility with Cursor
2. Some VS Code extensions may not work perfectly
3. Try disabling conflicting extensions
4. Check Cursor's extension marketplace first

### Performance Issues
1. Disable unused extensions
2. Close unnecessary files/tabs
3. Restart IDE periodically
4. Check if indexing is running (bottom status bar)

### Git Integration Problems
1. Ensure Git is installed globally
2. Check Git config (user.name, user.email)
3. Verify repository is properly initialized
4. Use terminal for complex Git operations if needed

---

## Daily Workflow Tips

### 1. Start Each Session Clean
- Commit all changes before starting
- Close unnecessary tabs
- Start with specific, focused tasks

### 2. Use Agent Mode Effectively
- Be specific about requirements
- Reference existing files with @filename
- Break complex tasks into steps
- Let Agent Mode run tests and iterate

### 3. Leverage Context
- Use .cursor/rules for project guidelines
- Reference documentation in prompts
- Include relevant files in conversation context
- Use notepads for reusable prompts

### 4. Testing Integration
- Set up npm scripts for easy testing
- Use Agent Mode to write tests first
- Enable auto-test running in YOLO mode
- Review test output in integrated terminal

This setup provides a solid foundation for professional TypeScript development with excellent AI assistance while maintaining clean, maintainable code standards.