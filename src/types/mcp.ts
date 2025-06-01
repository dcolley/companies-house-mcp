// MCP-related TypeScript interfaces
// This will be implemented in Task 2

export interface MCPRequest {
  method: string;
  params?: any;
}

export interface MCPResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

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
  level: "debug" | "info" | "notice" | "warning" | "error" | "critical" | "alert" | "emergency";
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