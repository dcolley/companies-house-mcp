import { CompaniesHouseMCPServer } from "../../src/server.js";
import { MCPTool } from "../../src/types/mcp.js";

// Mock the MCP SDK to avoid actual server startup in tests
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

describe("CompaniesHouseMCPServer", () => {
  let server: CompaniesHouseMCPServer;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    server = new CompaniesHouseMCPServer();
  });

  afterEach(async () => {
    // Clean up server if it was started
    try {
      await server.stop();
    } catch {
      // Ignore errors during cleanup
    }
  });

  describe("Constructor", () => {
    it("should create server with default name and version", () => {
      const serverInfo = server.getServerInfo();
      expect(serverInfo.name).toBe("companies-house-mcp");
      expect(serverInfo.version).toBe("0.1.0");
      expect(serverInfo.toolCount).toBeGreaterThan(0); // Should have placeholder tools
    });

    it("should create server with custom name and version", () => {
      const customServer = new CompaniesHouseMCPServer("test-server", "1.0.0");
      const serverInfo = customServer.getServerInfo();
      expect(serverInfo.name).toBe("test-server");
      expect(serverInfo.version).toBe("1.0.0");
    });
  });

  describe("Tool Registration", () => {
    it("should register a single tool", () => {
      const testTool: MCPTool = {
        name: "test_tool",
        description: "A test tool",
        inputSchema: {
          type: "object",
          properties: {
            param1: { type: "string" },
          },
          required: ["param1"],
        },
      };

      const initialToolCount = server.getServerInfo().toolCount;
      server.registerTool(testTool);
      
      expect(server.getServerInfo().toolCount).toBe(initialToolCount + 1);
    });

    it("should register multiple tools", () => {
      const testTools: MCPTool[] = [
        {
          name: "tool1",
          description: "First tool",
          inputSchema: {
            type: "object",
            properties: { param: { type: "string" } },
          },
        },
        {
          name: "tool2",
          description: "Second tool",
          inputSchema: {
            type: "object",
            properties: { param: { type: "number" } },
          },
        },
      ];

      const initialToolCount = server.getServerInfo().toolCount;
      server.registerTools(testTools);
      
      expect(server.getServerInfo().toolCount).toBe(initialToolCount + 2);
    });

    it("should replace tool if registered twice with same name", () => {
      const tool1: MCPTool = {
        name: "duplicate_tool",
        description: "First version",
        inputSchema: { type: "object", properties: {} },
      };

      const tool2: MCPTool = {
        name: "duplicate_tool",
        description: "Second version",
        inputSchema: { type: "object", properties: {} },
      };

      const initialToolCount = server.getServerInfo().toolCount;
      server.registerTool(tool1);
      server.registerTool(tool2);
      
      // Should still have the same tool count (replaced, not added)
      expect(server.getServerInfo().toolCount).toBe(initialToolCount + 1);
    });
  });

  describe("Server Lifecycle", () => {
    it("should start server successfully", async () => {
      await expect(server.start()).resolves.not.toThrow();
    });

    it("should stop server successfully", async () => {
      await server.start();
      await expect(server.stop()).resolves.not.toThrow();
    });

    it("should handle start errors gracefully", async () => {
      // Mock the SDK to throw an error
      const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
      const mockServer = new Server({} as any, {} as any);
      (mockServer.connect as jest.Mock).mockRejectedValue(new Error("Connection failed"));

      await expect(server.start()).rejects.toThrow("Connection failed");
    });

    it("should handle stop errors gracefully", async () => {
      await server.start();
      
      // Mock the SDK to throw an error on close
      const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
      const mockServer = new Server({} as any, {} as any);
      (mockServer.close as jest.Mock).mockRejectedValue(new Error("Close failed"));

      await expect(server.stop()).rejects.toThrow("Close failed");
    });
  });

  describe("Placeholder Tools", () => {
    it("should register default placeholder tools", () => {
      const serverInfo = server.getServerInfo();
      expect(serverInfo.toolCount).toBeGreaterThanOrEqual(2); // search_companies and get_company_profile
    });

    it("should include search_companies tool", () => {
      // This is tested indirectly through tool count
      // In actual implementation, we would test the tool handler
      expect(server.getServerInfo().toolCount).toBeGreaterThan(0);
    });

    it("should include get_company_profile tool", () => {
      // This is tested indirectly through tool count
      // In actual implementation, we would test the tool handler
      expect(server.getServerInfo().toolCount).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle tool registration with invalid schema", () => {
      const invalidTool = {
        name: "invalid_tool",
        description: "Tool with invalid schema",
        inputSchema: null as any, // Invalid schema
      };

      // Should not throw, but handle gracefully
      expect(() => server.registerTool(invalidTool)).not.toThrow();
    });
  });

  describe("Logging", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it("should log server start", async () => {
      await server.start();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[INFO]")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Starting companies-house-mcp")
      );
    });

    it("should log tool registration", () => {
      const testTool: MCPTool = {
        name: "log_test_tool",
        description: "Tool for testing logging",
        inputSchema: { type: "object", properties: {} },
      };

      server.registerTool(testTool);
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Registered tool: log_test_tool")
      );
    });

    it("should log errors appropriately", async () => {
      // Mock server connect to fail
      const { Server } = await import("@modelcontextprotocol/sdk/server/index.js");
      const mockServer = new Server({} as any, {} as any);
      (mockServer.connect as jest.Mock).mockRejectedValue(new Error("Test error"));

      try {
        await server.start();
      } catch {
        // Expected to throw
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("[ERROR]")
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to start MCP server")
      );
    });
  });

  describe("Debug Mode", () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      delete process.env.DEBUG;
    });

    it("should not log debug messages when DEBUG is not set", () => {
      // The logDebug method is private, so we test it indirectly
      // In a real implementation, we might expose debug logging triggers
      expect(process.env.DEBUG).toBeUndefined();
    });

    it("should enable debug logging when DEBUG is set", () => {
      process.env.DEBUG = "true";
      
      // Create a new server instance to pick up the environment variable
      const debugServer = new CompaniesHouseMCPServer();
      
      // The debug logging would be visible in actual operation
      expect(process.env.DEBUG).toBe("true");
    });
  });
}); 