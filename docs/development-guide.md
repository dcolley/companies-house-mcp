# Cursor Development Tasks - Companies House MCP Server

## Pre-Development Setup

### 1. Environment Setup
```bash
# Create project directory
mkdir companies-house-mcp
cd companies-house-mcp

# Initialize project
npm init -y

# Install dependencies
npm install @modelcontextprotocol/sdk @companieshouse/api-sdk-node zod commander
npm install --save-dev typescript @types/node jest @types/jest ts-jest eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser prettier

# Get Companies House API key
# Visit: https://developer.company-information.service.gov.uk/
# Sign up and create an API key
```

### 2. Project Structure Creation
```bash
# Create directory structure
mkdir -p src/{tools,lib,types} tests/{unit,integration,__fixtures__} docs examples scripts

# Create initial files
touch src/index.ts src/server.ts
touch tsconfig.json jest.config.js package.json README.md
```

## Cursor Agent Tasks

### Task 1: Project Foundation Setup ✅
**Prompt for Cursor Agent**:
```
Set up a TypeScript Node.js project for a Companies House MCP server. 

Requirements:
- Configure TypeScript with strict mode
- Set up Jest for testing with TypeScript support
- Configure ESLint and Prettier
- Create package.json with proper scripts (build, test, dev, lint)
- Set up basic project structure in src/ and tests/
- Create tsconfig.json with ESM output

Use the attached Companies House API documentation as reference for the project context.
Write tests first, then implementation.
```

**Expected Outputs**:
- Configured `package.json` with all scripts
- `tsconfig.json` with proper TypeScript config
- `jest.config.js` for testing setup
- `.eslintrc.json` and `.prettierrc` for code quality
- Basic directory structure

**Completion Status**: ✅
- All configuration files created and working
- Project structure established
- Build and test scripts operational
- ESM modules configured correctly

### Task 2: Core MCP Server Infrastructure ✅
**Prompt for Cursor Agent**:
```
Create the basic MCP server infrastructure using @modelcontextprotocol/sdk.

Requirements:
- Create src/server.ts that initializes an MCP server
- Set up proper TypeScript types in src/types/
- Create a CLI entry point in src/index.ts with commander for argument parsing
- Include environment variable support for COMPANIES_HOUSE_API_KEY
- Add comprehensive error handling and logging
- Write tests for the server initialization

Follow the MCP TypeScript SDK documentation patterns.
The server should register tools but not implement them yet (that's next task).
```

**Expected Outputs**:
- `src/server.ts` - MCP server class
- `src/index.ts` - CLI entry point
- `src/types/mcp.ts` - TypeScript interfaces
- Basic test files
- Environment variable handling

**Completion Status**: ✅
- Basic MCP server implementation in place
- CLI interface with commander
- TypeScript types defined
- Test structure established
- Some tests failing but core functionality working

### Task 3: Companies House API Client Wrapper ✅
**Prompt for Cursor Agent**:
```
Create a wrapper around @companieshouse/api-sdk-node with proper error handling and TypeScript types.

Requirements:
- Create src/lib/client.ts that wraps the Companies House SDK
- Add proper TypeScript interfaces in src/types/companies-house.ts
- Include rate limiting (500 requests per 5 minutes default)
- Add response caching using in-memory LRU cache
- Create comprehensive error handling that converts API errors to user-friendly messages
- Write extensive tests including mocks for the API responses

Use the Companies House API documentation I provided as reference.
Test all error scenarios: 404, 401, 429, 500, network errors.
```

**Expected Outputs**:
- `src/lib/client.ts` - API client wrapper
- `src/lib/rate-limiter.ts` - Rate limiting implementation
- `src/lib/cache.ts` - Response caching
- `src/types/companies-house.ts` - API response types
- Comprehensive test coverage

**Completion Status**: ✅
- API client wrapper with rate limiting and caching implemented
- TypeScript interfaces for all API responses defined
- Error handling with user-friendly messages
- Comprehensive test suite with mocks
- All tests passing

### Task 4: First Tool Implementation (search_companies)
**Status**: ✅

**Prompt for Cursor Agent**:
```
Implement the search_companies MCP tool with full testing.

Requirements:
- Create src/tools/search-companies.ts
- Use Zod for input validation (query: string, limit?: number, activeOnly?: boolean)
- Return formatted text responses, not raw JSON
- Handle all error cases gracefully (validation errors, API errors, no results)
- Format response as: "**COMPANY NAME** (No. 12345678)\nStatus: Active\nIncorporated: Date"
- Write comprehensive tests including edge cases
- Register the tool in the MCP server

The response should be conversational and easy for AI assistants to work with.
Test with real API calls to Companies House (use a test company number like 00006400).
```

**Expected Outputs**:
- `src/tools/search-companies.ts` - Tool implementation ✅
- `tests/unit/tools/search-companies.test.ts` - Unit tests ✅
- `src/server.ts` - Updated to register tool ✅
- `tests/unit/server.test.ts` - Updated server tests ✅
- `tests/integration/mcp-server.test.ts` - Integration tests ✅

**Implementation Notes**:
- Implemented search_companies tool with Zod validation
- Added comprehensive error handling
- Created unit and integration tests
- Updated server to register tool
- Fixed all TypeScript and linter errors
- Tested with real Companies House API
- Formatted responses for AI readability

### Task 5: Company Profile Tool Implementation
**Status**: In Progress

**Prompt for Cursor Agent**:
```
Implement the get_company_profile MCP tool following the same patterns as search_companies.

Requirements:
- Create src/tools/get-company-profile.ts
- Input: companyNumber (string, validated as 8-character format)
- Output: Formatted company profile with key information
- Include: company name, number, status, incorporation date, registered address, accounts info
- Handle dormant/dissolved companies appropriately
- Use the same error handling and testing patterns as search_companies
- Register the tool in the MCP server

Format the response to be informative but concise, highlighting the most relevant business information.
```

**Expected Outputs**:
- `src/tools/get-company-profile.ts` - Tool implementation
- `tests/unit/tools/get-company-profile.test.ts` - Unit tests
- `src/server.ts` - Updated to register tool
- `tests/unit/server.test.ts` - Updated server tests
- `tests/integration/mcp-server.test.ts` - Integration tests

**Implementation Notes**:
- Implementing get_company_profile tool with Zod validation
- Following same patterns as search_companies tool
- Using Companies House API client for data fetching
- Adding comprehensive error handling
- Writing unit and integration tests

### Task 6: Officers Tool Implementation
**Prompt for Cursor Agent**:
```
Implement the get_company_officers MCP tool.

Requirements:
- Create src/tools/get-company-officers.ts
- Input: companyNumber (string), activeOnly (boolean, default true), limit (number, default 35)
- Output: List of officers with names, roles, appointment dates
- Handle pagination for companies with many officers
- Show resignation dates for former officers when activeOnly is false
- Include officer addresses (but be mindful of privacy)
- Follow the same patterns as previous tools

Format as a clean list showing current directors and their key information.
```

**Expected Outputs**:
- `src/tools/get-company-officers.ts`
- Pagination support
- Privacy-conscious data handling
- Comprehensive testing

### Task 7: Filing History Tool Implementation
**Prompt for Cursor Agent**:
```
Implement the get_filing_history MCP tool.

Requirements:
- Create src/tools/get-filing-history.ts
- Input: companyNumber (string), category (optional string), limit (number, default 25)
- Output: Recent filings with dates, types, and descriptions
- Group by category (accounts, confirmation statements, etc.)
- Show filing dates and when documents are overdue
- Highlight the most recent and important filings
- Handle pagination for companies with extensive filing history

Focus on making the compliance status clear and actionable.
```

**Expected Outputs**:
- `src/tools/get-filing-history.ts`
- Category filtering
- Overdue status highlighting
- User-friendly compliance information

### Task 8: Remaining Tools (Charges, PSCs, Officer Search)
**Prompt for Cursor Agent**:
```
Implement the final three MCP tools: get_company_charges, get_persons_with_significant_control, and search_officers.

Requirements:
- Create src/tools/get-company-charges.ts
- Create src/tools/get-persons-with-significant-control.ts  
- Create src/tools/search-officers.ts
- Follow the same patterns as previous tools
- For PSCs: be mindful of personal data, focus on business-relevant control information
- For charges: highlight security details and status
- For officer search: return officer names with their current appointments
- Register all tools in the MCP server

Ensure all tools have consistent error handling, input validation, and response formatting.
```

**Expected Outputs**:
- Three complete tool implementations
- Consistent API across all tools
- Full test coverage
- All tools registered and working

### Task 9: Integration Testing & CLI Polish
**Prompt for Cursor Agent**:
```
Create integration tests and polish the CLI interface.

Requirements:
- Create scripts/test-mcp.js for testing the MCP server with a real client
- Add comprehensive CLI help and error messages
- Implement proper exit codes and signal handling
- Add version command and configuration validation
- Create integration tests that verify all tools work together
- Add performance logging (response times, cache hit rates)
- Ensure graceful shutdown and resource cleanup

Test the complete MCP server workflow from startup to tool execution.
```

**Expected Outputs**:
- Integration test script
- Polished CLI interface
- Performance monitoring
- Graceful error handling

### Task 10: Documentation & Packaging
**Prompt for Cursor Agent**:
```
Create comprehensive documentation and prepare for NPM publishing.

Requirements:
- Write a complete README.md with installation, usage, and examples
- Create API documentation for all tools
- Add CHANGELOG.md and CONTRIBUTING.md
- Set up GitHub Actions for CI/CD (testing, linting, publishing)
- Configure package.json for NPM publishing with proper keywords
- Create example Claude Desktop configuration
- Add troubleshooting guide and FAQ

Ensure the package is ready for production use and community adoption.
```

**Expected Outputs**:
- Complete documentation set
- NPM-ready package configuration
- CI/CD pipeline
- Usage examples

## Development Environment Variables

Create a `.env` file (do not commit this):
```bash
COMPANIES_HOUSE_API_KEY=your_api_key_here
```

## Testing Commands

```bash
# Run during development
npm test              # Unit tests
npm run test:watch    # Watch mode
npm run build         # TypeScript compilation
npm run lint          # ESLint check
npm run dev           # Development server

# Integration testing
npm run test:integration  # Full MCP server test
node scripts/test-mcp.js  # Manual testing script
```

## File Structure After Completion

```
companies-house-mcp/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── server.ts             # MCP server implementation
│   ├── tools/                # Individual MCP tools
│   │   ├── search-companies.ts
│   │   ├── get-company-profile.ts
│   │   ├── get-company-officers.ts
│   │   ├── get-filing-history.ts
│   │   ├── get-company-charges.ts
│   │   ├── get-persons-with-significant-control.ts
│   │   └── search-officers.ts
│   ├── lib/                  # Shared utilities
│   │   ├── client.ts         # Companies House API wrapper
│   │   ├── rate-limiter.ts   # Rate limiting
│   │   ├── cache.ts          # Response caching
│   │   └── errors.ts         # Error handling
│   └── types/                # TypeScript definitions
│       ├── companies-house.ts
│       └── mcp.ts
├── tests/                    # Test files
├── docs/                     # Documentation
├── examples/                 # Usage examples
├── scripts/                  # Development scripts
├── dist/                     # Compiled output
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

Each task is designed to be completed in a single Cursor Agent session, with clear requirements and expected outputs. The tasks build on each other, so complete them in order.