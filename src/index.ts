#!/usr/bin/env node

import { Command } from "commander";
import { CompaniesHouseMCPServer } from "./server.js";

const program = new Command();

program
  .name("companies-house-mcp")
  .description("Companies House MCP Server")
  .version("0.1.0");

program
  .option("-p, --port <number>", "Port to run the server on", "3000")
  .option("-k, --api-key <string>", "Companies House API key")
  .action(async (options) => {
    try {
      const apiKey = options.apiKey || process.env.COMPANIES_HOUSE_API_KEY;
      if (!apiKey) {
        console.error("Error: Companies House API key is required. Provide it via --api-key or COMPANIES_HOUSE_API_KEY environment variable.");
        process.exit(1);
      }

      const port = parseInt(options.port, 10);
      const server = new CompaniesHouseMCPServer(apiKey);

      // Handle graceful shutdown
      process.on("SIGINT", async () => {
        console.log("\nReceived SIGINT. Shutting down gracefully...");
        await server.stop();
        process.exit(0);
      });

      process.on("SIGTERM", async () => {
        console.log("\nReceived SIGTERM. Shutting down gracefully...");
        await server.stop();
        process.exit(0);
      });

      await server.start(port);
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : "An unexpected error occurred");
      process.exit(1);
    }
  });

program.parse(); 