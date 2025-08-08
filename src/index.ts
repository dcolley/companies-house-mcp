#!/usr/bin/env node

import { Command } from 'commander';
import { CompaniesHouseMCPServer } from './server.js';
import { CompaniesHouseHTTPServer } from './http-server.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get package.json info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const VERSION = packageJson.version;
const NAME = packageJson.name;
const DESCRIPTION = packageJson.description;

// Global server instance for cleanup
let serverInstance: CompaniesHouseMCPServer | null = null;
let httpServerInstance: CompaniesHouseHTTPServer | null = null;

class CompaniesHouseCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
    this.setupSignalHandlers();
    this.setupErrorHandlers();
  }

  private setupCommands(): void {
    this.program
      .name(NAME)
      .description(DESCRIPTION)
      .version(VERSION);

    this.program
      .option('--api-key <key>', 'Companies House API key (or set COMPANIES_HOUSE_API_KEY env var)')
      .option('--debug', 'Enable debug logging');

    // Start command (default) - STDIO transport
    this.program
      .command('start', { isDefault: true })
      .description('Start the MCP server with STDIO transport')
      .action(async options => {
        await this.startServer(options);
      });

    // HTTP server command
    this.program
      .command('serve-http')
      .description('Start the MCP server with HTTP transport')
      .option('--api-key <key>', 'Companies House API key (or set COMPANIES_HOUSE_API_KEY env var)')
      .option('--port <port>', 'HTTP port (default: 3000)', '3000')
      .action(async options => {
        await this.startHTTPServer(options);
      });

    // Info command
    this.program
      .command('info')
      .description('Show server information')
      .action(() => {
        this.showInfo();
      });
  }

  private setupSignalHandlers(): void {
    process.on('SIGINT', this.handleShutdown);
    process.on('SIGTERM', this.handleShutdown);
  }

  private setupErrorHandlers(): void {
    process.on('uncaughtException', error => {
      this.logError('Uncaught Exception:', error);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      this.logError('Unhandled Rejection at:', promise, 'reason:', reason);
      if (process.env.DEBUG) {
        console.error('Stack trace:', reason);
      }
      process.exit(1);
    });
  }

  private handleShutdown = async (): Promise<void> => {
    console.log('\nReceived shutdown signal. Shutting down gracefully...');
    
    // Stop HTTP server if running
    if (httpServerInstance) {
      try {
        await httpServerInstance.stop();
        this.logInfo('HTTP server stopped successfully');
      } catch (error) {
        this.logError('Error stopping HTTP server:', error);
      }
    }
    
    // Stop STDIO server if running
    if (serverInstance) {
      try {
        await serverInstance.stop();
        this.logInfo('STDIO server stopped successfully');
      } catch (error) {
        this.logError('Error stopping STDIO server:', error);
      }
    }
    
    process.exit(0);
  };

  private async startServer(options: any): Promise<void> {
    try {
      // Handle debug option
      if (options.debug || this.program.opts().debug) {
        process.env.DEBUG = 'true';
        this.logInfo('Debug mode enabled');
      }

      // Get API key
      const apiKey =
        options.apiKey || this.program.opts().apiKey || process.env.COMPANIES_HOUSE_API_KEY;
      if (!apiKey) {
        this.logError(
          'Companies House API key is required. Provide it via --api-key or COMPANIES_HOUSE_API_KEY environment variable.'
        );
        process.exit(1);
      }

      // Create and start server
      serverInstance = new CompaniesHouseMCPServer(NAME, VERSION, apiKey);
      await serverInstance.start();
    } catch (error) {
      this.logError(
        'Error starting server:',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      if (process.env.DEBUG && error instanceof Error) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  private async startHTTPServer(options: any): Promise<void> {
    try {
      // Handle debug option
      if (options.debug || this.program.opts().debug) {
        process.env.DEBUG = 'true';
        this.logInfo('Debug mode enabled');
      }

      // Get API key
      const apiKey =
        options.apiKey || this.program.opts().apiKey || process.env.COMPANIES_HOUSE_API_KEY;
      if (!apiKey) {
        this.logError(
          'Companies House API key is required. Provide it via --api-key or COMPANIES_HOUSE_API_KEY environment variable.'
        );
        process.exit(1);
      }

      // Get port
      const port = parseInt(options.port) || 3000;

      // Create and start HTTP server
      httpServerInstance = new CompaniesHouseHTTPServer(apiKey, port);
      await httpServerInstance.start();
    } catch (error) {
      this.logError(
        'Error starting HTTP server:',
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
      if (process.env.DEBUG && error instanceof Error) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  private showInfo(): void {
    const info = [
      'Companies House MCP Server',
      `Version: ${VERSION}`,
      `Description: ${DESCRIPTION}`,
      '',
      'Environment Variables:',
      '  COMPANIES_HOUSE_API_KEY - Your Companies House API key (required)',
      '  DEBUG                   - Enable debug logging (optional)',
      '',
      'Usage:',
      '  companies-house-mcp start [options]                    - Start with STDIO transport',
      '  companies-house-mcp serve-http [options]               - Start with HTTP transport',
      '  companies-house-mcp info                               - Show this information',
      '',
      'HTTP Server Options:',
      '  --port <port>                                          - HTTP port (default: 3000)',
      '',
      'Get your API key from:',
      '  https://github.com/aicayzer/companies-house-mcp',
    ];

    info.forEach(line => console.log(line));
  }

  private logInfo(message: string): void {
    console.error(`[INFO] ${new Date().toISOString()} - ${message}`);
  }

  private logError(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }

  public async run(): Promise<void> {
    await this.program.parseAsync(process.argv);
  }
}

// Only run if this module is executed directly
// Check if this file is being run directly (not imported)
// Avoid running during tests or when imported as a module
const isMainModule = process.argv[1]?.includes('companies-house-mcp') && 
  !process.argv[0]?.includes('jest') &&
  process.env.NODE_ENV !== 'test';

if (isMainModule) {
  const cli = new CompaniesHouseCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}
