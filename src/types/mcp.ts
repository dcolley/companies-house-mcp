// MCP-related TypeScript interfaces
// This will be implemented in Task 2

import { z } from 'zod';

export interface MCPRequest {
  method: string;
  params?: any;
}

/**
 * MCP Tool interface
 */

interface MCPToolResponse {
  isError?: boolean;
  content: Array<{
    type: string;
    text: string;
    params?: Record<string, unknown>;
  }>;
}

export interface MCPToolSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

/**
 * MCP Tool interface compatible with the MCP SDK
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: MCPToolSchema;
  execute(args: Record<string, unknown>): Promise<MCPToolResponse>;
}

export type MCPResponse = MCPToolResponse;

export interface MCPServer {
  name: string;
  version: string;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPLoggingLevel {
  level: 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';
}

export interface MCPInitializeRequest {
  protocolVersion: string;
  capabilities: {
    roots?: {
      listChanged?: boolean;
    };
    sampling?: {};
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface MCPInitializeResponse {
  protocolVersion: string;
  capabilities: {
    logging?: {};
    tools?: {
      listChanged?: boolean;
    };
    resources?: {
      subscribe?: boolean;
      listChanged?: boolean;
    };
  };
  serverInfo: {
    name: string;
    version: string;
  };
}
