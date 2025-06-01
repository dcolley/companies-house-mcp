# MCP Server Testing & Development Guide

## Testing Strategy Overview

There are **three main approaches** to testing your MCP server during development:

1. **Unit Testing** - Test individual tool logic (Jest)
2. **MCP Protocol Testing** - Test the server as an MCP client would (MCP Inspector)
3. **Integration Testing** - Test with real AI clients (Ollama with llama3.1:8b)

---

## 1. Unit Testing with Jest

### Purpose
Test your tool logic, API client, error handling, and utilities in isolation.

### Setup
```bash
npm install --save-dev jest @types/jest ts-jest
```

**jest.config.js**:
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

### Example Test Structure
```typescript
// tests/tools/search-companies.test.ts
import { searchCompanies } from '../../src/tools/search-companies';
import { mockApiClient } from '../__mocks__/api-client';

describe('searchCompanies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return formatted company results', async () => {
    // Arrange
    mockApiClient.search.companies.mockResolvedValue({
      httpStatusCode: 200,
      resource: {
        items: [
          {
            title: 'ACME CORPORATION LTD',
            company_number: '12345678',
            company_status: 'active'
          }
        ],
        total_results: 1
      }
    });

    // Act
    const result = await searchCompanies({ query: 'acme' });

    // Assert
    expect(result.content[0].text).toContain('ACME CORPORATION LTD');
    expect(result.content[0].text).toContain('12345678');
  });

  it('should handle API errors gracefully', async () => {
    // Arrange
    mockApiClient.search.companies.mockRejectedValue(
      new Error('API Rate Limited')
    );

    // Act
    const result = await searchCompanies({ query: 'test' });

    // Assert
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('Error: API Rate Limited');
  });
});
```

### Run Unit Tests
```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # With coverage report
```

---

## 2. MCP Protocol Testing

### Using MCP Inspector (Recommended)

**MCP Inspector** is the official debugging tool for MCP servers. It provides a web interface to test your server's tools directly.

#### Installation & Setup
```bash
# Install MCP Inspector globally
npm install -g @modelcontextprotocol/inspector

# Or use npx (no installation)
npx @modelcontextprotocol/inspector
```

#### Running Your Server with Inspector
```bash
# Start your MCP server in one terminal
npm run dev

# In another terminal, start inspector
mcp-inspector

# Or combined (if your package.json has a debug script)
npm run debug
```

#### Inspector Features
- **Tool Discovery** - See all registered tools and their schemas
- **Tool Testing** - Call tools with custom inputs and see formatted outputs
- **Protocol Validation** - Ensures your server follows MCP specification
- **Error Debugging** - Clear error messages when tools fail
- **Real-time Updates** - Restart server and inspector refreshes automatically

#### Example Debug Workflow
1. Start your server: `npm run dev`
2. Open inspector: `npx @modelcontextprotocol/inspector`
3. Navigate to `http://localhost:3000` (or shown URL)
4. See your tools listed with descriptions
5. Click a tool, fill in test inputs, click "Call Tool"
6. Review the formatted response and debug any issues

### Creating Test Fixtures
**tests/__fixtures__/companies-house-responses.json**:
```json
{
  "searchCompaniesSuccess": {
    "httpStatusCode": 200,
    "resource": {
      "items": [
        {
          "title": "ACME CORPORATION LTD",
          "company_number": "12345678",
          "company_status": "active",
          "date_of_creation": "2019-03-15"
        }
      ],
      "total_results": 1
    }
  },
  "companyNotFound": {
    "httpStatusCode": 404,
    "message": "Company not found"
  }
}
```

---

## 3. Integration Testing with AI Clients

### Option A: Claude Desktop (Recommended for Final Testing)

#### Setup Configuration
**~/.config/Claude/claude_desktop_config.json**:
```json
{
  "mcpServers": {
    "companies-house-dev": {
      "command": "node",
      "args": ["./dist/index.js"],
      "cwd": "/path/to/your/companies-house-mcp",
      "env": {
        "COMPANIES_HOUSE_API_KEY": "your_test_api_key"
      }
    }
  }
}
```

#### Testing Workflow
1. Build your server: `npm run build`
2. Restart Claude Desktop
3. Check for MCP tools indicator in Claude UI
4. Test with natural language:
   ```
   "Search for companies named Acme"
   "Get the profile for company number 12345678"
   "Who are the directors of Acme Corporation?"
   ```

#### Debugging Claude Integration
- Check Claude Desktop logs (Help > Show Logs)
- Verify server starts successfully
- Ensure API key is valid
- Test tools individually before complex queries

## 3. Integration Testing with Ollama

### Setup Ollama
```bash
# Install Ollama (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Install llama3.1:8b model
ollama pull llama3.1:8b

# Start Ollama service
ollama serve
```

### Simple Test Client Script
**scripts/test-mcp.js**:
```javascript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testMCPServer() {
  console.log('Testing MCP Server...');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./dist/index.js'],
    env: {
      COMPANIES_HOUSE_API_KEY: process.env.COMPANIES_HOUSE_API_KEY
    }
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    
    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:', tools.tools.map(t => t.name));

    // Test a simple tool
    const result = await client.callTool({
      name: 'search_companies',
      arguments: { query: 'test', limit: 5 }
    });
    
    console.log('Tool result:', result.content[0].text);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

testMCPServer();
```

### Run Integration Test
```bash
# Set your API key
export COMPANIES_HOUSE_API_KEY=your_api_key

# Build and test
npm run build
node scripts/test-mcp.js
```

---

## Using Your MCP Server in Other Projects

### Method 1: NPM Package (After Publishing)
```bash
# In any project
npm install companies-house-mcp

# Use in code
npx companies-house-mcp --api-key YOUR_KEY
```

### Method 2: Local Development
```bash
# Clone your repo
git clone https://github.com/your-username/companies-house-mcp
cd companies-house-mcp
npm install
npm run build

# Link globally for testing
npm link

# In another project
npm link companies-house-mcp
```

### Method 3: Direct Integration
**In another project's MCP client config**:
```json
{
  "mcpServers": {
    "companies-house": {
      "command": "node",
      "args": ["/absolute/path/to/companies-house-mcp/dist/index.js"],
      "env": {
        "COMPANIES_HOUSE_API_KEY": "${COMPANIES_HOUSE_API_KEY}"
      }
    }
  }
}
```

---

## Quick Testing Checklist

### Before Each Development Session
- [ ] API key is set in environment
- [ ] Server builds without errors (`npm run build`)
- [ ] Unit tests pass (`npm test`)
- [ ] Server starts successfully (`node dist/index.js`)

### After Implementing New Features
- [ ] Tool appears in MCP Inspector
- [ ] Tool accepts expected inputs
- [ ] Tool returns properly formatted responses
- [ ] Error cases are handled gracefully
- [ ] Tests cover new functionality

### Before Pushing Changes
- [ ] All tests pass with coverage >90%
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without warnings
- [ ] Integration test with Ollama works
- [ ] Documentation is updated

This simplified approach focuses on practical testing with your preferred tools while maintaining high quality standards.