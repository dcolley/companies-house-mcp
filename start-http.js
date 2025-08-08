#!/usr/bin/env node
// Wrapper script to start the Companies House MCP server
// This ensures the process name is correct for the isMainModule check

// Set the process name to include 'companies-house-mcp'
process.argv[1] = 'companies-house-mcp';

// Import and run the main application
import('./dist/index.js'); 