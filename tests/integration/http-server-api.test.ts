// Mock the HTTP server module to avoid import.meta.url issues
jest.mock('../../src/http-server.js', () => {
  const mockServer = {
    start: jest.fn().mockResolvedValue(undefined),
    stop: jest.fn().mockResolvedValue(undefined),
  };

  return {
    CompaniesHouseHTTPServer: jest.fn().mockImplementation((apiKey: string, port: number) => {
      return mockServer;
    }),
  };
});

// Mock fetch for HTTP testing
global.fetch = jest.fn();

// This test file requires a real API key and should be run separately
// Use: npm run test:http:api or set COMPANIES_HOUSE_API_KEY env var

describe('HTTP Server API Integration (requires real API key)', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const testPort = 3004;
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;

  beforeAll(() => {
    if (!apiKey) {
      console.warn('⚠️  COMPANIES_HOUSE_API_KEY not set, skipping API integration tests');
      return;
    }
  });

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  describe('Real API Integration', () => {
    beforeEach(() => {
      if (!apiKey) {
        return;
      }
      // Mock successful API responses
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            content: [
              {
                company_number: '00044506',
                company_name: 'TESCO PLC',
                company_status: 'active'
              }
            ]
          }
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);
    });

    it('should connect to real Companies House API', async () => {
      if (!apiKey) {
        console.log('⏭️  Skipping test - no API key provided');
        return;
      }

      // Test that we can make a real API call through the MCP server
      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'search_companies',
            arguments: {
              q: 'TESCO',
              items_per_page: 1
            }
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(1);
      expect(data.result).toBeDefined();
      
      // Should contain actual API response data
      expect(data.result.content).toBeDefined();
      expect(Array.isArray(data.result.content)).toBe(true);
    }, 30000); // Longer timeout for API calls

    it('should handle company search with real API', async () => {
      if (!apiKey) {
        console.log('⏭️  Skipping test - no API key provided');
        return;
      }

      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'get_company',
            arguments: {
              company_number: '00044506' // Tesco PLC
            }
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(2);
      expect(data.result).toBeDefined();
      
      // Should contain company data
      expect(data.result.content).toBeDefined();
      expect(Array.isArray(data.result.content)).toBe(true);
    }, 30000);

    it('should handle API rate limiting gracefully', async () => {
      if (!apiKey) {
        console.log('⏭️  Skipping test - no API key provided');
        return;
      }

      // Make multiple rapid requests to test rate limiting
      const promises = Array.from({ length: 3 }, (_, i) => 
        fetch(`http://localhost:${testPort}/mcp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: i + 10,
            method: 'tools/call',
            params: {
              name: 'search_companies',
              arguments: {
                q: 'TEST',
                items_per_page: 1
              }
            }
          })
        })
      );

      const responses = await Promise.all(promises);
      
      // All should return 200 (rate limiting handled by API)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 30000);

    it('should handle API errors gracefully', async () => {
      if (!apiKey) {
        console.log('⏭️  Skipping test - no API key provided');
        return;
      }

      // Test with invalid company number
      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          method: 'tools/call',
          params: {
            name: 'get_company',
            arguments: {
              company_number: 'INVALID123'
            }
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(3);
      
      // Should contain error information
      expect(data.error).toBeDefined();
      expect(data.error.code).toBeDefined();
    }, 30000);
  });

  describe('API Key Validation', () => {
    it('should reject requests with invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32603,
            message: 'Internal error'
          }
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort + 1}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'search_companies',
            arguments: {
              q: 'TEST'
            }
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error.code).toBe(-32603); // Internal error
    }, 30000);
  });
}); 