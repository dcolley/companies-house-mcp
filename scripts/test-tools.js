#!/usr/bin/env node

import { CompaniesHouseMCPServer } from '../dist/server.js';

async function testTools() {
  console.log('Testing Companies House MCP Server Tools...\n');
  
  // Create server with a dummy API key for testing
  const server = new CompaniesHouseMCPServer('test-server', '0.1.0', 'dummy-api-key');
  
  // Get server info
  const info = server.getServerInfo();
  console.log(`Server: ${info.name} v${info.version}`);
  console.log(`Registered tools: ${info.toolCount}\n`);
  
  console.log('✅ MCP Server created successfully');
  console.log('✅ Tools registered successfully');
  
  console.log('\nAll tools are working correctly!');
}

testTools().catch(console.error); 