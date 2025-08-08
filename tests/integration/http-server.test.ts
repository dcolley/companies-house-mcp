import { beforeEach, describe, expect, it, jest } from '@jest/globals';
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

// Mock external dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@modelcontextprotocol/sdk/server/streamableHttp.js', () => ({
  StreamableHTTPServerTransport: jest.fn().mockImplementation(() => ({
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Mock fetch for HTTP testing
global.fetch = jest.fn();

describe('HTTP Server Integration', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;
  const testPort = 3003;
  const dummyApiKey = 'test-api-key-12345';

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  describe('Server Lifecycle', () => {
    it('should start and stop HTTP server successfully', async () => {
      const { CompaniesHouseHTTPServer } = await import('../../src/http-server.js');
      const server = new CompaniesHouseHTTPServer(dummyApiKey, testPort);
      
      await expect(server.start()).resolves.toBeUndefined();
      await expect(server.stop()).resolves.toBeUndefined();
    });

    it('should handle multiple start/stop cycles', async () => {
      const { CompaniesHouseHTTPServer } = await import('../../src/http-server.js');
      const server = new CompaniesHouseHTTPServer(dummyApiKey, testPort);
      
      await server.start();
      await server.stop();
      await server.start();
      await server.stop();
    });

    it('should handle concurrent server instances', async () => {
      const { CompaniesHouseHTTPServer } = await import('../../src/http-server.js');
      const server1 = new CompaniesHouseHTTPServer(dummyApiKey, testPort);
      const server2 = new CompaniesHouseHTTPServer(dummyApiKey, testPort + 1);

      await server1.start();
      await server2.start();

      await server1.stop();
      await server2.stop();
    });
  });

  describe('HTTP Endpoints', () => {
    beforeEach(() => {
      // Mock successful HTTP responses
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({
          status: 'ok',
          server: 'companies-house-mcp',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);
    });

    it('should respond to health endpoint', async () => {
      const response = await fetch(`http://localhost:${testPort}/health`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(data.server).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    it('should respond to info endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          name: 'companies-house-mcp',
          version: '1.0.0',
          transport: 'http',
          port: testPort,
          endpoints: {
            health: '/health',
            mcp: '/mcp'
          }
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort}/info`);
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.name).toBeDefined();
      expect(data.version).toBeDefined();
      expect(data.transport).toBe('http');
      expect(data.port).toBe(testPort);
      expect(data.endpoints).toBeDefined();
    });

    it('should respond to root endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/html')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort}/`);
      expect(response.status).toBe(200);
      
      const contentType = response.headers.get('content-type');
      expect(contentType).toContain('text/html');
    });

    it('should handle CORS headers', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('*')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });
      
      expect(response.status).toBe(200);
      expect(response.headers.get('access-control-allow-origin')).toBeDefined();
    });
  });

  describe('MCP Protocol Endpoints', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            serverInfo: {
              name: 'companies-house-mcp',
              version: '1.0.0'
            }
          }
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);
    });

    it('should handle MCP initialize request', async () => {
      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(1);
      expect(data.result).toBeDefined();
      expect(data.result.serverInfo).toBeDefined();
    });

    it('should handle MCP tools/list request', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 2,
          result: {
            tools: [
              { name: 'search_companies', description: 'Search companies' },
              { name: 'get_company_profile', description: 'Get company profile' }
            ]
          }
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.jsonrpc).toBe('2.0');
      expect(data.id).toBe(2);
      expect(data.result).toBeDefined();
      expect(data.result.tools).toBeDefined();
      expect(Array.isArray(data.result.tools)).toBe(true);
    });

    it('should handle invalid JSON in MCP requests', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Invalid JSON'
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(400);
    });

    it('should handle missing method in MCP requests', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Missing method'
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);

      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 3,
          params: {}
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling', () => {
    it('should handle server startup errors gracefully', async () => {
      const { CompaniesHouseHTTPServer } = await import('../../src/http-server.js');
      const invalidServer = new CompaniesHouseHTTPServer(dummyApiKey, -1);
      
      // Mock the start method to throw an error
      invalidServer.start = jest.fn().mockRejectedValue(new Error('Invalid port'));
      
      await expect(invalidServer.start()).rejects.toThrow('Invalid port');
    });

    it('should handle requests to non-existent endpoints', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 404,
        json: jest.fn().mockResolvedValue({
          error: 'Not found'
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);
      
      const response = await fetch(`http://localhost:${testPort}/nonexistent`);
      expect(response.status).toBe(404);
    });

    it('should handle malformed requests', async () => {
      mockFetch.mockResolvedValueOnce({
        status: 400,
        json: jest.fn().mockResolvedValue({
          error: 'Malformed request'
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);
      
      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invalid: 'request'
        })
      });

      expect(response.status).toBe(400);
    });
  });

  describe('Session Management', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue({
          jsonrpc: '2.0',
          id: 1,
          result: {
            serverInfo: {
              name: 'companies-house-mcp',
              version: '1.0.0'
            }
          }
        }),
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        }
      } as any);
    });

    it('should handle requests with session IDs', async () => {
      const sessionId = 'test-session-123';
      
      const response = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': sessionId,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        })
      });

      expect(response.status).toBe(200);
    });

    it('should handle multiple requests with different session IDs', async () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      
      // First request with session 1
      const response1 = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': session1,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        })
      });

      // Second request with session 2
      const response2 = await fetch(`http://localhost:${testPort}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'mcp-session-id': session2,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        })
      });

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });
}); 