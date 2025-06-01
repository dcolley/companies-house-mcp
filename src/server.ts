// MCP server implementation for Companies House
// This will be implemented in Task 2

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPTool } from './types/mcp.js';
import { CompaniesHouseClient } from './lib/client.js';
import { SearchCompaniesTool } from './tools/search-companies.js';
import { GetCompanyProfileTool } from './tools/get-company-profile.js';
import { GetCompanyOfficersTool } from './tools/get-company-officers.js';
import { GetFilingHistoryTool } from './tools/get-filing-history.js';
import { GetCompanyChargesTool } from './tools/get-company-charges.js';
import { GetPersonsWithSignificantControlTool } from './tools/get-persons-with-significant-control.js';
import { SearchOfficersTool } from './tools/search-officers.js';

export class CompaniesHouseMCPServer {
  private server: Server;
  private tools: Map<string, MCPTool> = new Map();
  private client: CompaniesHouseClient | undefined;

  constructor(
    private serverName: string = 'companies-house-mcp',
    private version: string = '0.1.0',
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

      // Register all tools
      this.registerTool(new GetCompanyProfileTool(this.client));
      this.registerTool(new GetCompanyOfficersTool(this.client));
      this.registerTool(new GetFilingHistoryTool(this.client));
      this.registerTool(new GetCompanyChargesTool(this.client));
      this.registerTool(new GetPersonsWithSignificantControlTool(this.client));
      this.registerTool(new SearchOfficersTool(this.client));

      // Register legacy SearchCompaniesTool separately
      const searchTool = new SearchCompaniesTool(apiKey);
      this.tools.set(searchTool.getName(), {
        name: searchTool.getName(),
        description: searchTool.getDescription(),
        inputSchema: searchTool.getParameterSchema() as any,
        execute: async (args: any) => {
          const result = await searchTool.execute(args);
          return {
            content: result.content.map(item => ({
              type: 'text' as const,
              text: item.text,
            })),
            ...(result.isError ? { isError: result.isError } : {}),
          };
        },
      });
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
          inputSchema: tool.inputSchema,
        })),
      };
    });

    // Handle call_tool requests
    this.server.setRequestHandler(CallToolRequestSchema, async request => {
      const { name, arguments: args } = request.params;

      if (!this.tools.has(name)) {
        throw new McpError(ErrorCode.MethodNotFound, `Tool '${name}' not found`);
      }

      try {
        const tool = this.tools.get(name)!;
        return await tool.execute(args);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        throw new McpError(
          ErrorCode.InternalError,
          `Error executing tool '${name}': ${errorMessage}`
        );
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

      this.logInfo('MCP server started successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logError(`Failed to start MCP server: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Stop the MCP server gracefully
   */
  public async stop(): Promise<void> {
    try {
      this.logInfo('Stopping MCP server...');
      await this.server.close();
      this.logInfo('MCP server stopped successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logError(`Error stopping MCP server: ${errorMessage}`);
      throw error;
    }
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
