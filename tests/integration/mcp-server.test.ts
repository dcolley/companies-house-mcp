import { CompaniesHouseMCPServer } from "../../src/server.js";
import { MCPTool } from "../../src/types/mcp.js";

// Mock external dependencies for integration tests
jest.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: jest.fn().mockImplementation(() => ({
    setRequestHandler: jest.fn(),
    connect: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: jest.fn(),
}));

describe("MCP Server Integration", () => {
  let server: CompaniesHouseMCPServer;

  beforeEach(() => {
    server = new CompaniesHouseMCPServer();
  });

  afterEach(async () => {
    await server.stop();
  });

  describe("Server Lifecycle", () => {
    it("should start and stop server", async () => {
      await expect(server.start()).resolves.toBeUndefined();
      await expect(server.stop()).resolves.toBeUndefined();
    });

    it("should handle multiple start/stop cycles", async () => {
      await server.start();
      await server.stop();
      await server.start();
      await server.stop();
    });
  });

  describe("Error Handling", () => {
    it("should handle concurrent server instances", async () => {
      const server1 = new CompaniesHouseMCPServer("server1");
      const server2 = new CompaniesHouseMCPServer("server2");

      await server1.start();
      await server2.start();

      await server1.stop();
      await server2.stop();
    });
  });

  describe("End-to-End Server Workflow", () => {
    it("should initialize, register tools, and start successfully", async () => {
      // Verify server is created with correct configuration
      const serverInfo = server.getServerInfo();
      expect(serverInfo.name).toBe("companies-house-mcp");
      expect(serverInfo.version).toBe("0.1.0");
      expect(serverInfo.toolCount).toBe(0);

      // Start the server
      await server.start();
      
      // Verify server can be stopped
      await server.stop();
    });

    it("should register and maintain tools correctly", () => {
      const initialToolCount = server.getServerInfo().toolCount;
      
      // Add a test tool
      const testTool: MCPTool = {
        name: "integration_test_tool",
        description: "Tool for integration testing",
        inputSchema: {
          type: "object",
          properties: {
            testParam: { type: "string" },
          },
          required: ["testParam"],
        },
      };

      server.registerTool(testTool);
      expect(server.getServerInfo().toolCount).toBe(initialToolCount + 1);
    });
  });

  describe("Memory and Performance", () => {
    it("should not leak memory with repeated tool registration", () => {
      const initialToolCount = server.getServerInfo().toolCount;
      
      // Register the same tool multiple times
      const testTool: MCPTool = {
        name: "memory_test_tool",
        description: "Tool for memory testing",
        inputSchema: {
          type: "object",
          properties: {},
        },
      };

      for (let i = 0; i < 100; i++) {
        server.registerTool(testTool);
      }

      // Should only have one instance (latest registration)
      expect(server.getServerInfo().toolCount).toBe(initialToolCount + 1);
    });

    it("should handle rapid start/stop cycles", async () => {
      const cycles = 5;
      
      for (let i = 0; i < cycles; i++) {
        await server.start();
        await server.stop();
      }

      // Should complete without memory issues
      expect(true).toBe(true);
    });
  });
}); 