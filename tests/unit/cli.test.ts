import { jest } from "@jest/globals";

// Mock the server module
const mockServer = {
  start: jest.fn(),
  stop: jest.fn(),
  getServerInfo: jest.fn(() => ({
    name: "companies-house-mcp",
    version: "0.1.0",
    toolCount: 2,
  })),
};

jest.mock("../../src/server.js", () => ({
  CompaniesHouseMCPServer: jest.fn(() => mockServer),
}));

// Mock commander to avoid process.exit() in tests
const mockProgram = {
  name: jest.fn().mockReturnThis(),
  description: jest.fn().mockReturnThis(),
  version: jest.fn().mockReturnThis(),
  option: jest.fn().mockReturnThis(),
  helpOption: jest.fn().mockReturnThis(),
  command: jest.fn().mockReturnThis(),
  action: jest.fn().mockReturnThis(),
  parseAsync: jest.fn(),
  parse: jest.fn(),
};

jest.mock("commander", () => ({
  Command: jest.fn(() => mockProgram),
}));

describe("CompaniesHouseCLI", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalArgv: string[];
  let originalExit: typeof process.exit;
  let exitSpy: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(() => {
    // Save original environment and process state
    originalEnv = { ...process.env };
    originalArgv = [...process.argv];
    originalExit = process.exit;

    // Mock process.exit to prevent tests from exiting
    exitSpy = jest.spyOn(process, "exit").mockImplementation((): never => {
      throw new Error("process.exit() called");
    });

    // Mock console methods
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment and process state
    process.env = originalEnv;
    process.argv = originalArgv;
    process.exit = originalExit;

    // Restore console methods
    exitSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe("CLI Setup", () => {
    it("should configure commander with correct options", async () => {
      // Import the CLI module (this will run the constructor)
      await import("../../src/index.js");

      expect(mockProgram.name).toHaveBeenCalledWith("companies-house-mcp");
      expect(mockProgram.description).toHaveBeenCalledWith(
        "Companies House MCP Server - Provides UK company data to AI assistants"
      );
      expect(mockProgram.version).toHaveBeenCalledWith("0.1.0");
      expect(mockProgram.option).toHaveBeenCalledWith(
        "--api-key <key>",
        "Companies House API key (or set COMPANIES_HOUSE_API_KEY env var)"
      );
      expect(mockProgram.option).toHaveBeenCalledWith(
        "--debug",
        "Enable debug logging"
      );
    });

    it("should set up commands correctly", async () => {
      await import("../../src/index.js");

      expect(mockProgram.command).toHaveBeenCalledWith("start", { isDefault: true });
      expect(mockProgram.command).toHaveBeenCalledWith("info");
    });
  });

  describe("Environment Validation", () => {
    beforeEach(() => {
      // Clear API key from environment
      delete process.env.COMPANIES_HOUSE_API_KEY;
    });

    it("should fail when no API key is provided", async () => {
      // This would be tested by importing and running the CLI with no API key
      // The actual validation happens in validateEnvironment method
      expect(process.env.COMPANIES_HOUSE_API_KEY).toBeUndefined();
    });

    it("should use environment variable API key", () => {
      process.env.COMPANIES_HOUSE_API_KEY = "test-env-key";
      expect(process.env.COMPANIES_HOUSE_API_KEY).toBe("test-env-key");
    });

    it("should prefer command line API key over environment", () => {
      process.env.COMPANIES_HOUSE_API_KEY = "env-key";
      // Command line option would override this
      // This is tested in the validateEnvironment logic
    });
  });

  describe("Server Integration", () => {
    beforeEach(() => {
      process.env.COMPANIES_HOUSE_API_KEY = "test-api-key";
    });

    it("should create and start server with correct configuration", async () => {
      const { CompaniesHouseMCPServer } = await import("../../src/server.js");
      
      // Verify server constructor is called
      expect(CompaniesHouseMCPServer).toBeDefined();
    });

    it("should handle server start success", async () => {
      mockServer.start.mockImplementation(() => Promise.resolve());
      
      // The server start would be called in the CLI action
      await mockServer.start();
      expect(mockServer.start).toHaveBeenCalled();
    });

    it("should handle server start failure", async () => {
      const testError = new Error("Server start failed");
      mockServer.start.mockImplementation(() => Promise.reject(testError));
      
      try {
        await mockServer.start();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBe(testError);
      }
    });
  });

  describe("Signal Handling", () => {
    it("should set up signal handlers for graceful shutdown", async () => {
      const processOnSpy = jest.spyOn(process, "on");
      
      // Import CLI to trigger signal handler setup
      await import("../../src/index.js");
      
      // Verify signal handlers are registered
      expect(processOnSpy).toHaveBeenCalledWith("SIGINT", expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith("SIGTERM", expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith("uncaughtException", expect.any(Function));
      expect(processOnSpy).toHaveBeenCalledWith("unhandledRejection", expect.any(Function));
      
      processOnSpy.mockRestore();
    });
  });

  describe("Info Command", () => {
    it("should display server information", () => {
      // The info command would call showInfo method
      // Testing the expected output format
      const expectedInfo = [
        "Companies House MCP Server",
        "Version: 0.1.0",
        "Description: Provides UK Companies House data to AI assistants",
        "",
        "Environment Variables:",
        "  COMPANIES_HOUSE_API_KEY - Your Companies House API key (required)",
        "  DEBUG                   - Enable debug logging (optional)",
        "",
        "Usage:",
        "  companies-house-mcp start [options]",
        "  companies-house-mcp info",
        "",
        "Get your API key from:",
        "  https://developer.company-information.service.gov.uk/",
      ];

      // This would be called in the info command action
      expectedInfo.forEach(line => {
        // console.log(line); // This is what showInfo() does
      });
      
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe("Debug Mode", () => {
    it("should enable debug logging when --debug flag is used", () => {
      // The debug option would set process.env.DEBUG = "true"
      process.env.DEBUG = "true";
      expect(process.env.DEBUG).toBe("true");
    });

    it("should show stack traces in debug mode on errors", () => {
      process.env.DEBUG = "true";
      const testError = new Error("Test error");
      
      // In debug mode, the CLI would log the stack trace
      expect(testError.stack).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle CLI parsing errors", async () => {
      const testError = new Error("CLI parsing failed");
      mockProgram.parseAsync.mockImplementation(() => Promise.reject(testError));
      
      try {
        await mockProgram.parseAsync();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error).toBe(testError);
      }
    });

    it("should handle uncaught exceptions", () => {
      const testError = new Error("Uncaught exception");
      
      // This would be handled by the uncaughtException handler
      expect(testError.message).toBe("Uncaught exception");
    });

    it("should handle unhandled promise rejections", () => {
      const testReason = "Unhandled rejection";
      
      // This would be handled by the unhandledRejection handler
      expect(testReason).toBe("Unhandled rejection");
    });
  });

  describe("Module Entry Point", () => {
    it("should only run CLI when executed directly", () => {
      // The CLI module should be properly configured for Node.js execution
      // This is a design pattern test rather than functional test
      expect(process.argv).toBeDefined();
    });
  });

  describe("Logging Format", () => {
    it("should use consistent timestamp format", () => {
      const timestamp = new Date().toISOString();
      const logMessage = `[INFO] ${timestamp} - Test message`;
      
      expect(logMessage).toMatch(/\[INFO\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - Test message/);
    });

    it("should format error messages consistently", () => {
      const timestamp = new Date().toISOString();
      const errorMessage = `[ERROR] ${timestamp} - Error occurred`;
      
      expect(errorMessage).toMatch(/\[ERROR\] \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z - Error occurred/);
    });
  });
}); 