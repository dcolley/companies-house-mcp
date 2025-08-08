import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer, Server as HttpServer } from 'http';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CompaniesHouseMCPServer } from './server.js';

// Get package.json info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const VERSION = packageJson.version;
const NAME = packageJson.name;
const DESCRIPTION = packageJson.description;

const SESSION_ID_HEADER_NAME = 'mcp-session-id';

export class CompaniesHouseHTTPServer {
  private app: express.Application;
  private mcpServer: CompaniesHouseMCPServer;
  private server: Server;
  private port: number;
  private httpServer: HttpServer | null = null;
  private transports: Record<string, StreamableHTTPServerTransport> = {};

  constructor(apiKey: string, port: number = 3000) {
    this.port = port;
    this.mcpServer = new CompaniesHouseMCPServer(NAME, VERSION, apiKey);
    this.server = this.mcpServer.getServer();
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'ok', 
        server: NAME,
        version: VERSION,
        timestamp: new Date().toISOString()
      });
    });

    // Server info endpoint
    this.app.get('/info', (req: Request, res: Response) => {
      const serverInfo = this.mcpServer.getServerInfo();
      res.json({
        ...serverInfo,
        transport: 'http',
        port: this.port,
        endpoints: {
          health: `/health`,
          mcp: `/mcp`
        }
      });
    });

    // MCP endpoint using proper StreamableHTTPServerTransport
    this.app.post('/mcp', async (req: Request, res: Response) => {
      await this.handlePostRequest(req, res);
    });

    // Root endpoint with usage information
    this.app.get('/', (req: Request, res: Response) => {
      res.sendFile(join(__dirname, 'html', 'index.html'));
    });
  }

  async handlePostRequest(req: Request, res: Response) {
    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    console.log('Request session ID:', sessionId);
    console.log('Available sessions:', Object.keys(this.transports));

    try {
      // Reuse existing transport
      if (sessionId && this.transports[sessionId]) {
        console.log('Using existing transport for session:', sessionId);
        transport = this.transports[sessionId];
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // Create new transport for initialize requests
      if (!sessionId && this.isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            // Store the transport by session ID
            console.log(`Session initialized: ${sessionId}`);
            let newSessionId = sessionId;
            this.transports[newSessionId] = transport;
            console.log('Stored transport for session:', newSessionId);
          }
        });

        await (this.server as any).connect(transport);
        await transport.handleRequest(req, res, req.body);

        return;
      }

      res.status(400).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32600,
          message: 'Bad Request: invalid session ID or method.'
        }
      });
    } catch (error) {
      console.error('Error handling MCP request:', error);
      res.status(500).json({
        jsonrpc: '2.0',
        id: req.body?.id || null,
        error: {
          code: -32603,
          message: 'Internal server error.'
        }
      });
    }
  }

  private isInitializeRequest(body: any): boolean {
    return body && body.method === 'initialize';
  }

  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer = createServer(this.app);
      this.httpServer.listen(this.port, () => {
        console.log(`🚀 Companies House MCP HTTP server running on port ${this.port}`);
        console.log(`📊 Health check: http://localhost:${this.port}/health`);
        console.log(`ℹ️  Server info: http://localhost:${this.port}/info`);
        console.log(`🔗 MCP endpoint: http://localhost:${this.port}/mcp`);
        console.log(`🌐 Root: http://localhost:${this.port}/`);
        resolve();
      });
    });
  }

  public async stop(): Promise<void> {
    // Close all active transports
    for (const transport of Object.values(this.transports)) {
      try {
        await transport.close();
      } catch (error) {
        console.error('Error closing transport:', error);
      }
    }
    this.transports = {};

    // Close HTTP server
    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(() => {
          console.log('HTTP server stopped gracefully');
          resolve();
        });
      });
    }
  }
}

// Main execution block for running the HTTP server directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY;
  const port = parseInt(process.env.PORT || '3000');
  
  if (!apiKey) {
    console.error('❌ COMPANIES_HOUSE_API_KEY environment variable is required');
    console.error('Please set it in your .env file or export it in your shell');
    process.exit(1);
  }
  
  const server = new CompaniesHouseHTTPServer(apiKey, port);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
  
  // Start the server
  server.start().catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  });
}