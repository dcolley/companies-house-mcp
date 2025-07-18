#!/usr/bin/env node

/**
 * Integration test script for Companies House MCP Server
 * 
 * This script tests the MCP server with real API calls to verify
 * end-to-end functionality. Requires a valid Companies House API key.
 */

import { spawn } from 'child_process';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';

class MCPTester {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.serverProcess = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '[INFO]',
      success: '[PASS]',
      error: '[FAIL]',
      warn: '[WARN]'
    }[type];
    
    console.log(`${prefix} ${timestamp} - ${message}`);
  }

  async startServer() {
    this.log('Starting MCP server...');
    
    try {
      this.serverProcess = spawn('node', ['dist/index.js'], {
        env: {
          ...process.env,
          COMPANIES_HOUSE_API_KEY: this.apiKey
        },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Handle server output
      this.serverProcess.stdout.on('data', (data) => {
        console.log(`SERVER: ${data.toString()}`);
      });

      this.serverProcess.stderr.on('data', (data) => {
        console.error(`SERVER ERROR: ${data.toString()}`);
      });

      // Wait for server to start
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      this.log('MCP server started successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to start server: ${error.message}`, 'error');
      return false;
    }
  }

  async stopServer() {
    if (this.serverProcess) {
      this.log('Stopping MCP server...');
      this.serverProcess.kill('SIGTERM');
      
      await new Promise(resolve => {
        this.serverProcess.on('exit', resolve);
        setTimeout(() => {
          this.serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);
      });
      
      this.log('MCP server stopped', 'success');
    }
  }

  async sendMCPMessage(message) {
    return new Promise((resolve, reject) => {
      if (!this.serverProcess) {
        reject(new Error('Server not running'));
        return;
      }

      let responseData = '';
      
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.serverProcess.stdout.once('data', (data) => {
        clearTimeout(timeout);
        responseData = data.toString();
        try {
          const response = JSON.parse(responseData);
          resolve(response);
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${responseData}`));
        }
      });

      this.serverProcess.stdin.write(JSON.stringify(message) + '\n');
    });
  }

  async testTool(toolName, args, expectedKeys = []) {
    this.log(`Testing tool: ${toolName}`);
    
    try {
      const message = {
        jsonrpc: "2.0",
        id: Math.random().toString(36),
        method: "tools/call",
        params: {
          name: toolName,
          arguments: args
        }
      };

      const response = await this.sendMCPMessage(message);
      
      if (response.error) {
        throw new Error(`Tool error: ${response.error.message}`);
      }

      if (!response.result) {
        throw new Error('No result in response');
      }

      // Validate response structure
      if (!response.result.content || !Array.isArray(response.result.content)) {
        throw new Error('Invalid response structure');
      }

      if (response.result.content.length === 0) {
        throw new Error('Empty response content');
      }

      // Check for expected content
      const textContent = response.result.content[0].text;
      if (!textContent || textContent.includes('Error:')) {
        throw new Error(`Tool returned error: ${textContent}`);
      }

      // Validate expected keys if provided
      for (const key of expectedKeys) {
        if (!textContent.includes(key)) {
          this.log(`Warning: Expected content '${key}' not found in response`, 'warn');
        }
      }

      this.log(`Tool ${toolName} passed`, 'success');
      this.testResults.passed++;
      return true;
      
    } catch (error) {
      this.log(`Tool ${toolName} failed: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.errors.push({
        tool: toolName,
        error: error.message,
        args
      });
      return false;
    }
  }

  async runToolTests() {
    this.log('Starting tool tests...');

    // Test cases for each tool
    const tests = [
      {
        name: 'search_companies',
        args: { query: 'test', limit: 5 },
        expectedKeys: ['Status:', 'Incorporated:']
      },
      {
        name: 'get_company_profile', 
        args: { companyNumber: '02050399' },
        expectedKeys: ['Status', 'Incorporated']
      },
      {
        name: 'get_company_officers',
        args: { companyNumber: '00445790', limit: 5 },
        expectedKeys: ['Officers', 'Appointed:']
      },
      {
        name: 'get_filing_history',
        args: { companyNumber: '02050399', limit: 5 },
        expectedKeys: ['Document ID:']
      },
      {
        name: 'get_company_charges',
        args: { companyNumber: '02050399' },
        expectedKeys: ['Charges for']
      },
      {
        name: 'get_persons_with_significant_control',
        args: { companyNumber: '02050399' },
        expectedKeys: ['Persons with Significant Control']
      },
      {
        name: 'search_officers',
        args: { query: 'smith', limit: 5 },
        expectedKeys: ['Officer Search Results']
      }
    ];

    for (const test of tests) {
      await this.testTool(test.name, test.args, test.expectedKeys);
      
      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async testListTools() {
    this.log('Testing list_tools endpoint...');
    
    try {
      const message = {
        jsonrpc: "2.0",
        id: "test-list",
        method: "tools/list"
      };

      const response = await this.sendMCPMessage(message);
      
      if (response.error) {
        throw new Error(`List tools error: ${response.error.message}`);
      }

      if (!response.result || !response.result.tools) {
        throw new Error('No tools in response');
      }

      const toolCount = response.result.tools.length;
      if (toolCount !== 7) {
        throw new Error(`Expected 7 tools, got ${toolCount}`);
      }

      this.log(`List tools passed - found ${toolCount} tools`, 'success');
      this.testResults.passed++;
      return true;
      
    } catch (error) {
      this.log(`List tools failed: ${error.message}`, 'error');
      this.testResults.failed++;
      this.testResults.errors.push({
        tool: 'list_tools',
        error: error.message
      });
      return false;
    }
  }

  async runAllTests() {
    this.log('='.repeat(60));
    this.log('Companies House MCP Server Integration Tests');
    this.log('='.repeat(60));

    try {
      // Build the project first
      this.log('Building project...');
      await new Promise((resolve, reject) => {
        const buildProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
        buildProcess.on('exit', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Build failed with code ${code}`));
          }
        });
      });

      // Start server
      if (!(await this.startServer())) {
        throw new Error('Failed to start server');
      }

      // Run tests
      await this.testListTools();
      await this.runToolTests();

    } finally {
      // Stop server
      await this.stopServer();
    }

    // Print results
    this.printResults();
  }

  printResults() {
    this.log('='.repeat(60));
    this.log('TEST RESULTS');
    this.log('='.repeat(60));
    
    this.log(`Total tests: ${this.testResults.passed + this.testResults.failed}`);
    this.log(`Passed: ${this.testResults.passed}`, 'success');
    this.log(`Failed: ${this.testResults.failed}`, this.testResults.failed > 0 ? 'error' : 'success');

    if (this.testResults.errors.length > 0) {
      this.log('\nFAILED TESTS:');
      this.testResults.errors.forEach((error, index) => {
        this.log(`${index + 1}. ${error.tool}: ${error.error}`, 'error');
        if (error.args) {
          this.log(`   Args: ${JSON.stringify(error.args)}`);
        }
      });
    }

    const success = this.testResults.failed === 0;
    this.log(`\nOverall result: ${success ? 'PASS' : 'FAIL'}`, success ? 'success' : 'error');
    
    process.exit(success ? 0 : 1);
  }
}

// Main execution
async function main() {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  
  if (!apiKey) {
    console.error('Error: COMPANIES_HOUSE_API_KEY environment variable is required');
    console.error('Get your free API key from: https://developer.company-information.service.gov.uk/');
    process.exit(1);
  }

  const tester = new MCPTester(apiKey);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, shutting down...');
    await tester.stopServer();
    process.exit(0);
  });

  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('Integration test failed:', error.message);
    await tester.stopServer();
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 