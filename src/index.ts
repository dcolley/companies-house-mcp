#!/usr/bin/env node

import { Command } from 'commander';
import { CompaniesHouseMCPServer } from './server.js';

// Global server instance for cleanup
let serverInstance: CompaniesHouseMCPServer | null = null;

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
      .name('companies-house-mcp')
      .description('Companies House MCP Server - Provides UK company data to AI assistants')
      .version('1.0.1');

    this.program
      .option('--api-key <key>', 'Companies House API key (or set COMPANIES_HOUSE_API_KEY env var)')
      .option('--debug', 'Enable debug logging');

    // Start command (default)
    this.program
      .command('start', { isDefault: true })
      .description('Start the MCP server')
      .action(async options => {
        await this.startServer(options);
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
    if (serverInstance) {
      try {
        await serverInstance.stop();
        this.logInfo('Server stopped successfully');
      } catch (error) {
        this.logError('Error stopping server:', error);
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
      serverInstance = new CompaniesHouseMCPServer('companies-house-mcp', '1.0.1', apiKey);
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

  private showInfo(): void {
    const info = [
      'Companies House MCP Server',
      'Version: 1.0.1',
      'Description: Provides UK Companies House data to AI assistants',
      '',
      'Environment Variables:',
      '  COMPANIES_HOUSE_API_KEY - Your Companies House API key (required)',
      '  DEBUG                   - Enable debug logging (optional)',
      '',
      'Usage:',
      '  companies-house-mcp start [options]',
      '  companies-house-mcp info',
      '',
      'Get your API key from:',
      '  https://developer.company-information.service.gov.uk/',
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
const isMainModule = import.meta.url === `file://${process.argv[1]}` || 
  process.argv[1]?.includes('companies-house-mcp');

if (isMainModule) {
  const cli = new CompaniesHouseCLI();
  cli.run().catch(error => {
    console.error('CLI Error:', error);
    process.exit(1);
  });
}
