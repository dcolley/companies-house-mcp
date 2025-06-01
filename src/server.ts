// MCP server implementation for Companies House
// This will be implemented in Task 2

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { MCPTool } from "./types/mcp.js";
import { CompaniesHouseClient } from "./lib/client.js";
import { GetCompanyProfileTool } from "./tools/get-company-profile.js";

export class CompaniesHouseMCPServer {
  private server: Server;
  private tools: Map<string, MCPTool> = new Map();
  private client: CompaniesHouseClient | undefined;

  constructor(
    private serverName: string = "companies-house-mcp",
    private version: string = "0.1.0",
    apiKey?: string
  ) {
    this.server = new Server(
      {
        name: serverName,
        version: version,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    if (apiKey) {
      this.client = new CompaniesHouseClient(apiKey);
      this.registerTool(new GetCompanyProfileTool(this.client));
    }

    this.setupRequestHandlers();
  }

  private setupRequestHandlers(): void {
    // Handle list_tools requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Array.from(this.tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: "object",
            properties: {
              companyNumber: {
                type: "string",
                description: "8-character company number (e.g., '00006400')",
                pattern: "^[0-9A-Z]{8}$"
              }
            },
            required: ["companyNumber"]
          }
        }))
      };
    });

    // Handle call_tool requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.tools.has(name)) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found`);
      }

      try {
        const tool = this.tools.get(name)!;
        return await tool.execute(args);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        throw new McpError(ErrorCode.InternalError, `Error executing tool '${name}': ${errorMessage}`);
      }
    });
  }

  /**
   * Register a new tool with the MCP server
   */
  public registerTool(tool: MCPTool): void {
    this.tools.set(tool.name, tool);
    this.logInfo(`Registered tool: ${tool.name}`);
  }

  /**
   * Register multiple tools at once
   */
  public registerTools(tools: MCPTool[]): void {
    tools.forEach(tool => this.registerTool(tool));
  }

  /**
   * Start the MCP server
   */
  public async start(): Promise<void> {
    try {
      this.logInfo(`Starting ${this.serverName} v${this.version}`);

      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      
      this.logInfo("MCP server started successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logError(`Failed to start MCP server: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Stop the MCP server gracefully
   */
  public async stop(): Promise<void> {
    try {
      this.logInfo("Stopping MCP server...");
      await this.server.close();
      this.logInfo("MCP server stopped successfully");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      this.logError(`Error stopping MCP server: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Register placeholder tools for testing
   * These will be replaced with actual implementations in subsequent tasks
   */
  private registerPlaceholderTools(): void {
    const placeholderTools: MCPTool[] = [
      {
        name: "search_companies",
        description: "Search for UK companies by name",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Company name or keywords to search for",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return (default: 20, max: 100)",
              minimum: 1,
              maximum: 100,
            },
            activeOnly: {
              type: "boolean",
              description: "Only return active companies (default: true)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_company_profile",
        description: "Get detailed profile information for a specific company",
        inputSchema: {
          type: "object",
          properties: {
            companyNumber: {
              type: "string",
              description: "8-character company number (e.g., '00006400')",
              pattern: "^[0-9A-Z]{8}$",
            },
          },
          required: ["companyNumber"],
        },
      },
    ];

    this.registerTools(placeholderTools);
  }

  /**
   * Logging utilities
   */
  private logInfo(message: string): void {
    console.error(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  private logError(message: string): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`);
  }

  private logDebug(message: string): void {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${new Date().toISOString()} - ${message}`);
    }
  }

  /**
   * Get server information
   */
  public getServerInfo(): { name: string; version: string; toolCount: number } {
    return {
      name: this.serverName,
      version: this.version,
      toolCount: this.tools.size,
    };
  }
} 