# Testing Guide - Companies House MCP Server

## Overview

This guide outlines the testing strategy for the Companies House MCP Server. Tests are organized into three categories: unit, integration, and contract tests.

## Test Structure

```
tests/
├── unit/           # Test individual functions and classes
├── integration/    # Test with real Companies House API
├── contract/       # Test MCP protocol compliance
└── fixtures/       # Shared test data
    └── companies.json
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit        # Unit tests only
npm run test:integration # Integration tests only
npm run test:coverage    # Generate coverage report

# Run tests in watch mode
npm run test:watch
```

## Test Categories

### Unit Tests
Test individual components in isolation with mocked external dependencies.

**What to test:**
- Pure functions (formatters, validators)
- Business logic within tools
- Error handling scenarios
- Edge cases

**Example:**
```typescript
// tests/unit/lib/cache.test.ts
describe('Cache', () => {
  it('should store and retrieve values', () => {
    const cache = new Cache(100);
    cache.set('key', 'value', 60);
    expect(cache.get('key')).toBe('value');
  });

  it('should respect TTL', async () => {
    const cache = new Cache(100);
    cache.set('key', 'value', 1); // 1 second TTL
    await new Promise(resolve => setTimeout(resolve, 1100));
    expect(cache.get('key')).toBeNull();
  });
});
```

### Integration Tests
Test actual API interactions using known company numbers.

**Known Test Companies:**
- `02050399` - ZENITH PRINT (UK) LIMITED (active, has PSCs and charges)
- `00006400` - MARINE AND GENERAL MUTUAL LIFE ASSURANCE SOCIETY
- `00445790` - TESCO PLC
- `12345678` - Invalid (for error testing)

**Note:** The `get_company_officers` endpoint may return API service errors for some companies. Tests should handle this gracefully.

**Example:**
```typescript
// tests/integration/search-companies.test.ts
describe('Search Companies Integration', () => {
  const client = new CompaniesHouseClient(process.env.COMPANIES_HOUSE_API_KEY!);

  it('should find Tesco when searching', async () => {
    const results = await client.searchCompanies('tesco', 5);
    
    expect(results).toContainEqual(
      expect.objectContaining({
        companyNumber: '00445790',
        title: expect.stringContaining('TESCO'),
        companyStatus: 'active'
      })
    );
  });

  it('should handle company not found', async () => {
    await expect(client.getCompanyProfile('99999999'))
      .rejects.toThrow('Resource not found');
  });
});
```

### Contract Tests
Verify MCP protocol compliance and tool behavior.

**What to test:**
- Tool registration and discovery
- Input schema validation
- Response format compliance
- Error response format

**Example:**
```typescript
// tests/contract/mcp-compliance.test.ts
describe('MCP Protocol Compliance', () => {
  let server: CompaniesHouseMCPServer;

  beforeEach(() => {
    server = new CompaniesHouseMCPServer('test', '1.0.0', 'test-key');
  });

  it('should expose tools with proper schema', () => {
    const tools = server.getTools();
    
    tools.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool.inputSchema).toMatchObject({
        type: 'object',
        properties: expect.any(Object),
        required: expect.any(Array)
      });
    });
  });
});
```

## Test Patterns

### Mocking External Dependencies

Only mock external services, never internal modules:

```typescript
// ✅ Good - Mock external API
jest.mock('node-fetch');

// ❌ Bad - Don't mock internal modules
jest.mock('../../../src/lib/client');
```

### Using Fixtures

Store common test data in fixtures:

```json
// tests/fixtures/companies.json
{
  "searchResults": [
    {
      "companyNumber": "00445790",
      "title": "TESCO PLC",
      "companyStatus": "active",
      "companyType": "plc",
      "dateOfCreation": "1947-11-27"
    }
  ],
  "companyProfile": {
    "company_name": "TESCO PLC",
    "company_number": "00445790",
    "company_status": "active",
    "type": "plc",
    "date_of_creation": "1947-11-27",
    "registered_office_address": {
      "address_line_1": "Tesco House",
      "postal_code": "EN14 5HW",
      "locality": "Welwyn Garden City",
      "country": "United Kingdom"
    }
  }
}
```

### Testing Error Scenarios

Always test error paths:

```typescript
describe('Error Handling', () => {
  it('should handle 401 unauthorized', async () => {
    const client = new CompaniesHouseClient('invalid-key');
    
    await expect(client.searchCompanies('test'))
      .rejects.toThrow('Invalid Companies House API key');
  });

  it('should format errors for MCP', async () => {
    const tool = new SearchCompaniesTool('invalid-key');
    const result = await tool.execute({ query: 'test' });
    
    expect(result).toEqual({
      isError: true,
      content: [{
        type: 'text',
        text: expect.stringContaining('Error:')
      }]
    });
  });
});
```

## Best Practices

### 1. Test Behavior, Not Implementation
Focus on what the code does, not how it does it:

```typescript
// ✅ Good - Tests behavior
it('should return formatted company data', async () => {
  const result = await tool.execute({ companyNumber: '00445790' });
  expect(result.content[0].text).toContain('TESCO PLC');
  expect(result.content[0].text).toContain('Status: active');
});

// ❌ Bad - Tests implementation details
it('should call formatAddress method', () => {
  // Don't test internal method calls
});
```

### 2. Use Descriptive Test Names
Test names should describe the scenario and expected outcome:

```typescript
// ✅ Good
it('should return empty array when no companies match search query', async () => {

// ❌ Bad
it('search test', () => {
```

### 3. Keep Tests Independent
Each test should be able to run in isolation:

```typescript
describe('CompaniesHouseClient', () => {
  let client: CompaniesHouseClient;

  beforeEach(() => {
    // Fresh instance for each test
    client = new CompaniesHouseClient('test-key');
  });

  afterEach(() => {
    // Cleanup if needed
    jest.clearAllMocks();
  });
});
```

### 4. Test Edge Cases
Don't just test the happy path:

```typescript
describe('Pagination', () => {
  it('should handle empty results', async () => {
    const results = await client.searchCompanies('xyzxyzxyz123');
    expect(results).toEqual([]);
  });

  it('should respect limit parameter', async () => {
    const results = await client.searchCompanies('limited', 5);
    expect(results.length).toBeLessThanOrEqual(5);
  });

  it('should handle maximum limit', async () => {
    const results = await client.searchCompanies('test', 100);
    expect(results.length).toBeLessThanOrEqual(100);
  });
});
```

## Environment Setup

For integration tests, set up your environment:

```bash
# .env.test
COMPANIES_HOUSE_API_KEY=your_test_api_key

# Or use environment variable
export COMPANIES_HOUSE_API_KEY=your_test_api_key
```

## Continuous Integration

Tests run automatically on:
- Every pull request to `develop`
- Every push to `develop` or `main`

Failed tests will block merging.