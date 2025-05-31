# Quick Start - Project Setup & Repository Organization

## Immediate Setup Steps

### 1. Create Project & Install Dependencies
```bash
# Create project directory
mkdir companies-house-mcp
cd companies-house-mcp

# Initialize npm project
npm init -y

# Install core dependencies
npm install @modelcontextprotocol/sdk @companieshouse/api-sdk-node zod commander

# Install development dependencies
npm install --save-dev typescript @types/node jest @types/jest ts-jest eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier

# Create basic directory structure
mkdir -p src/{tools,lib,types} tests/{unit,integration,__fixtures__} docs examples scripts
```

### 2. Get Companies House API Key
1. Visit: https://developer.company-information.service.gov.uk/
2. Create a free account
3. Generate an API key
4. Save it securely (you'll need it for testing)

### 3. Environment Setup
```bash
# Create environment file (DO NOT COMMIT THIS)
echo "COMPANIES_HOUSE_API_KEY=your_actual_api_key_here" > .env

# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*

# Build outputs
dist/
build/

# Environment variables
.env
.env.local

# IDE files
.vscode/settings.json
.cursor/

# Testing
coverage/

# Logs
*.log

# OS generated
.DS_Store
Thumbs.db
EOF
```

## Repository Organization

### Documents to Include in Your Repo

From our conversation, include these in your repository:

#### `/docs` folder:
1. **`companies-house-api-reference.md`** - Copy the "Companies House API & SDK Reference" artifact
2. **`development-guide.md`** - Copy the "Cursor Development Tasks" artifact  
3. **`testing-guide.md`** - Copy the "MCP Server Testing & Development Guide" artifact

#### Root level:
1. **`README.md`** - Will be created in Task 10, but use the design document as reference
2. **`.cursorrules`** - Create this with TypeScript/MCP specific rules

#### `examples/` folder:
1. **`claude-desktop-config.json`** - Example configuration for users
2. **`basic-usage.js`** - Simple usage examples

### Cursor Rules File

Create `.cursorrules` in your project root:

```markdown
# Companies House MCP Server Development

## Project Context
This is a TypeScript Node.js MCP server providing access to UK Companies House public data.
It's designed to be the reference implementation for Companies House integration with AI assistants.

## Key Dependencies
- @modelcontextprotocol/sdk - Official MCP TypeScript SDK
- @companieshouse/api-sdk-node - Official Companies House API client
- zod - Runtime type validation
- jest - Testing framework

## Code Standards
- Use TypeScript strict mode
- Write tests first (TDD approach)
- All MCP tools return: { content: [{ type: "text", text: "formatted response" }] }
- Handle errors gracefully with user-friendly messages
- Use async/await throughout
- Cache API responses appropriately (5-30 minutes depending on data type)

## Response Format
- Return conversational, formatted text (not raw JSON)
- Use clear headings: **COMPANY NAME** (No. 12345678)
- Include key business information: status, dates, addresses
- Handle missing data gracefully
- No emojis - use clean, professional formatting

## Error Handling
- Validate inputs with Zod schemas
- Convert API errors to user-friendly messages
- Return errors as: { isError: true, content: [{ type: "text", text: "Error: description" }] }
- Test all error scenarios: 404, 401, 429, validation errors

## Testing Approach
- Unit tests for all functions
- Mock Companies House API responses
- Test success and error paths
- Use descriptive test names
-