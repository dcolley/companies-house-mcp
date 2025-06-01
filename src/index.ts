#!/usr/bin/env node

import { Command } from "commander";
import { CompaniesHouseMCPServer } from "./server.js";

interface CLIOptions {
  apiKey?: string;
  debug?: boolean;
  version?: boolean;
}

class CompaniesHouseCLI {
  private program: Command;
  private server?: CompaniesHouseMCPServer;

  constructor() {
    this.program = new Command();
    this.setupCLI();
    this.setupSignalHandlers();
  }

  private setupCLI(): void {
    this.program
      .name("companies-house-mcp")
      .description("Companies House MCP Server - Provides UK company data to AI assistants")
      .version("0.1.0");

    this.program
      .option("--api-key <key>", "Companies House API key (or set COMPANIES_HOUSE_API_KEY env var)")
      .option("--debug", "Enable debug logging")
      .option("--no-version-check", "Skip version compatibility check")
      .helpOption("-h, --help", "Display help information");

    this.program
      .command("start", { isDefault: true })
      .description("Start the MCP server")
      .action(async (options: CLIOptions) => {
        await this.startServer(options);
      });

    this.program
      .command("info")
      .description("Show server information")
      .action(() => {
        this.showInfo();
      });
  }

  private setupSignalHandlers(): void {
    const gracefulShutdown = async (signal: string) => {
      console.error(`\n[INFO] ${new Date().toISOString()} - Received ${signal}, shutting down gracefully...`);
      
      if (this.server) {
        try {
          await this.server.stop();
        } catch (error) {
          console.error(`[ERROR] Error during shutdown: ${error}`);
          process.exit(1);
        }
      }
      
      process.exit(0);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      console.error(`[ERROR] ${new Date().toISOString()} - Uncaught exception:`, error);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason, promise) => {
      console.error(`[ERROR] ${new Date().toISOString()} - Unhandled rejection at:`, promise, "reason:", reason);
      process.exit(1);
    });
  }

  private validateEnvironment(options: CLIOptions): string {
    // Check for API key
    const apiKey = options.apiKey || process.env.COMPANIES_HOUSE_API_KEY;
    
    if (!apiKey) {
      console.error(`[ERROR] Companies House API key is required.`);
      console.error(`        Set COMPANIES_HOUSE_API_KEY environment variable or use --api-key option.`);
      console.error(`        Get your API key from: https://developer.company-information.service.gov.uk/`);
      process.exit(1);
    }

    // Set environment variables for the server
    process.env.COMPANIES_HOUSE_API_KEY = apiKey;
    
    if (options.debug) {
      process.env.DEBUG = "true";
    }

    return apiKey;
  }

  private async startServer(options: CLIOptions): Promise<void> {
    try {
      // Validate environment and configuration
      this.validateEnvironment(options);

      console.error(`[INFO] ${new Date().toISOString()} - Initializing Companies House MCP Server...`);
      
      // Create and start the MCP server
      this.server = new CompaniesHouseMCPServer();
      
      const serverInfo = this.server.getServerInfo();
      console.error(`[INFO] ${new Date().toISOString()} - Server: ${serverInfo.name} v${serverInfo.version}`);
      console.error(`[INFO] ${new Date().toISOString()} - Tools registered: ${serverInfo.toolCount}`);
      
      await this.server.start();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error(`[ERROR] ${new Date().toISOString()} - Failed to start server: ${errorMessage}`);
      
      if (options.debug && error instanceof Error) {
        console.error(`[DEBUG] Stack trace:`, error.stack);
      }
      
      process.exit(1);
    }
  }

  private showInfo(): void {
    console.log("Companies House MCP Server");
    console.log("Version: 0.1.0");
    console.log("Description: Provides UK Companies House data to AI assistants");
    console.log("");
    console.log("Environment Variables:");
    console.log("  COMPANIES_HOUSE_API_KEY - Your Companies House API key (required)");
    console.log("  DEBUG                   - Enable debug logging (optional)");
    console.log("");
    console.log("Usage:");
    console.log("  companies-house-mcp start [options]");
    console.log("  companies-house-mcp info");
    console.log("");
    console.log("Get your API key from:");
    console.log("  https://developer.company-information.service.gov.uk/");
  }

  public async run(): Promise<void> {
    try {
      await this.program.parseAsync(process.argv);
    } catch (error) {
      console.error(`[ERROR] CLI error: ${error}`);
      process.exit(1);
    }
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new CompaniesHouseCLI();
  cli.run().catch((error) => {
    console.error(`[ERROR] Failed to start CLI: ${error}`);
    process.exit(1);
  });
} 