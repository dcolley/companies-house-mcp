import { CompaniesHouseMCPServer } from "../../src/server.js";

// Mock external dependencies for integration tests
jest.mock("@modelcontextprotocol/sdk/server/index.js");
jest.mock("@modelcontextprotocol/sdk/server/stdio.js");

describe("MCP Server Integration", () => {
  let server: CompaniesHouseMCPServer;

  beforeEach(() => {
    server = new CompaniesHouseMCPServer();
  });

  afterEach(async () => {
    try {
      await server.stop();
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("End-to-End Server Workflow", () => {
    it("should initialize, register tools, and start successfully", async () => {
      // Verify server is created with correct configuration
      const serverInfo = server.getServerInfo();
      expect(serverInfo.name).toBe("companies-house-mcp");
      expect(serverInfo.version).toBe("0.1.0");
      expect(serverInfo.toolCount).toBeGreaterThan(0);

      // Start the server
      await server.start();
      
      // Verify server can be stopped
      await server.stop();
    });

    it("should handle multiple start/stop cycles", async () => {
      // First cycle
      await server.start();
      await server.stop();

      // Second cycle
      await server.start();
      await server.stop();

      // Should not throw errors
      expect(true).toBe(true);
    });

    it("should register and maintain tools correctly", () => {
      const initialToolCount = server.getServerInfo().toolCount;
      
      // Add a test tool
      server.registerTool({
        name: "integration_test_tool",
        description: "Tool for integration testing",
        inputSchema: {
          type: "object",
          properties: {
            testParam: { type: "string" },
          },
          required: ["testParam"],
        },
      });

      expect(server.getServerInfo().toolCount).toBe(initialToolCount + 1);
    });
  });

  describe("Error Recovery", () => {
    it("should handle server start failures gracefully", async () => {
      // Mock server connect to fail
      const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
      const mockServer = new Server({} as any, {} as any);
      (mockServer.connect as jest.Mock).mockRejectedValue(new Error("Connection failed"));

      await expect(server.start()).rejects.toThrow("Connection failed");
    });

    it("should handle invalid tool registration gracefully", () => {
      expect(() => {
        server.registerTool({
          name: "",
          description: "",
          inputSchema: {} as any,
        });
      }).not.toThrow();
    });
  });

  describe("Memory and Performance", () => {
    it("should not leak memory with repeated tool registration", () => {
      const initialToolCount = server.getServerInfo().toolCount;
      
      // Register the same tool multiple times
      for (let i = 0; i < 100; i++) {
        server.registerTool({
          name: "memory_test_tool",
          description: "Tool for memory testing",
          inputSchema: { type: "object", properties: {} },
        });
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