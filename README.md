# Companies House MCP Server

## Features

- 🔍 **Company Search** - Find companies by name or number
- 📊 **Company Profiles** - Detailed company information and status
- 👥 **Officer Information** - Directors and secretaries data
- 📄 **Filing History** - Recent filings and documents
- 💰 **Charges** - Outstanding charges and mortgages
- 🏢 **PSC Data** - Persons with Significant Control
- 🔎 **Officer Search** - Find officers across companies

### Response Modes

All tools support a `verbose` parameter for detailed or compact responses:
- **Compact mode** (default): Essential information only
- **Verbose mode**: Full details including all available fields

## Installation

### Prerequisites

- Node.js 18 or higher
- Companies House API key (free from [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk/))

### Quick Start

```bash
# Install globally
npm install -g companies-house-mcp

# Run with your API key
companies-house-mcp --api-key YOUR_API_KEY
```

### Development Setup

```bash
# Clone repository
git clone https://github.com/aicayzer/companies-house-mcp
cd companies-house-mcp

# Install dependencies
npm install

# Set up environment
echo "COMPANIES_HOUSE_API_KEY=your_api_key_here" > .env

# Build project
npm run build

# Run tests
npm test

# Start development server
npm run dev

# Start HTTP server for testing
npm run test:http
```

## CLI Commands

The server provides several CLI commands:

```bash
# Start with STDIO transport (default)
companies-house-mcp start --api-key YOUR_API_KEY

# Start with HTTP transport
companies-house-mcp serve-http --api-key YOUR_API_KEY --port 3000

# Show server information
companies-house-mcp info

# Enable debug logging
companies-house-mcp start --api-key YOUR_API_KEY --debug
```

## Usage

### STDIO Transport (Default)

The server runs with STDIO transport by default, suitable for integration with Claude Desktop and other MCP clients.

#### With Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "companies-house": {
      "command": "npx",
      "args": ["-y", "companies-house-mcp"],
      "env": {
        "COMPANIES_HOUSE_API_KEY": "${COMPANIES_HOUSE_API_KEY}"
      }
    }
  }
}
```

#### Running Locally with Direct Path

For local development, you can point Claude directly to your local build:

```json
{
  "mcpServers": {
    "companies-house": {
      "command": "node",
      "args": ["/path/to/your/companies-house-mcp/dist/index.js", "--api-key", "YOUR_API_KEY_HERE"]
    }
  }
}
```

### HTTP Transport

The server also supports HTTP transport for web-based integrations and testing.

#### Start HTTP Server

```bash
# Start HTTP server on default port (3000)
companies-house-mcp serve-http --api-key YOUR_API_KEY

# Start HTTP server on custom port
companies-house-mcp serve-http --api-key YOUR_API_KEY --port 8080
```

#### HTTP Endpoints

Once running, the HTTP server provides the following endpoints:

- `GET /` - Server information and usage
- `GET /health` - Health check
- `GET /info` - Server details and tool information
- `POST /mcp` - MCP protocol endpoint

#### Testing HTTP Server

```bash
# Test the HTTP server functionality (manual script)
npm run test:http

# Run integration tests (no API key required)
npm run test:http:integration

# Run API integration tests (requires API key)
npm run test:http:api

# Or manually test endpoints
curl http://localhost:3000/health
curl http://localhost:3000/info
```

#### Using with HTTP Clients

You can integrate the HTTP server with any MCP-compatible client that supports HTTP transport:

```bash
# Example: Test MCP endpoint
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "test-client",
        "version": "1.0.0"
      }
    }
  }'
```

## Available Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `search_companies` | Search companies by name | `query`, `limit`, `activeOnly`, `verbose` |
| `get_company_profile` | Get detailed company info | `companyNumber`, `verbose` |
| `get_company_officers` | List company officers | `companyNumber`, `activeOnly`, `limit`, `verbose` |
| `get_filing_history` | Get filing history | `companyNumber`, `category`, `limit`, `startIndex`, `verbose` |
| `get_company_charges` | Get company charges | `companyNumber`, `limit`, `startIndex`, `verbose` |
| `get_persons_with_significant_control` | Get PSC information | `companyNumber`, `limit`, `startIndex`, `verbose` |
| `search_officers` | Search officers by name | `query`, `limit`, `startIndex`, `verbose` |

### Pagination

Tools that return multiple results support pagination:
- `limit`: Number of results per page (max 100)
- `startIndex`: Starting position for results

## Example Queries

Once connected to Claude, you can ask:

- "Search for companies named Tesco"
- "Get the profile for company number 00445790"
- "Who are the directors of company 00445790?"
- "Show me recent filings for company 00445790 in verbose mode"
- "Does company 00445790 have any outstanding charges?"

## Configuration

### Environment Variables

```bash
COMPANIES_HOUSE_API_KEY=your_api_key_here  # Required
DEBUG=true                                 # Enable debug logging (optional)
```

### Rate Limiting

- Default: 500 requests per 5 minutes
- Automatic rate limiting prevents API quota exceeded errors
- Responses are cached to reduce API calls

## Docker Support

### Quick Start with Docker Compose

The easiest way to run the HTTP server with Docker:

```bash
# Copy the environment template
cp docker.env.example .env

# Edit .env and add your API key
# COMPANIES_HOUSE_API_KEY=your_api_key_here

# Start the HTTP server
docker compose up -d

# Check the logs
docker compose logs -f

# Test the server
curl http://localhost:3000/health
```

### Manual Docker Build

A Dockerfile is included for containerized deployment:

```bash
# Build image
docker build -t companies-house-mcp .

# Run HTTP server container
docker run -d \
  --name companies-house-mcp \
  -p 3000:3000 \
  -e COMPANIES_HOUSE_API_KEY=your_key \
  companies-house-mcp \
  node dist/index.js serve-http
```

### Docker Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPANIES_HOUSE_API_KEY` | Required | Your Companies House API key |
| `MCP_PORT` | 3000 | Port to expose the HTTP server |
| `DEBUG` | false | Enable debug logging |
| `CH_MCP_RATE_LIMIT` | 500 | Rate limit (requests per 5 minutes) |
| `CH_MCP_CACHE_SIZE` | 1000 | Cache size for responses |
| `CH_MCP_LOG_LEVEL` | info | Logging level |

## Development

### Running Tests

```bash
npm test          # Run all tests
npm run test:unit # Run unit tests only
npm run test:int  # Run integration tests
```

#### Integration Tests

Note: Integration tests require a valid Companies House API key. To run integration tests:

```bash
COMPANIES_HOUSE_API_KEY=your_api_key npm run test:integration
```

Some tests may be skipped if:
- No Companies House API key is provided in the environment
- The runtime doesn't support the Fetch API

### Code Quality

```bash
npm run lint      # Check code style
npm run typecheck # Check TypeScript types
npm run format    # Format code
```

#### ESLint Configuration

This project uses ESLint v9 with the new flat configuration format. The configuration is in `eslint.config.js`.

### Project Structure

```
companies-house-mcp/
├── src/
│   ├── tools/         # MCP tool implementations
│   ├── lib/           # Core utilities (client, cache, rate limiter)
│   ├── types/         # TypeScript type definitions
│   └── index.ts       # CLI entry point
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── fixtures/      # Test data
```

## Troubleshooting

### Debug Mode

Enable debug logging to troubleshoot issues:

```bash
DEBUG=true companies-house-mcp --api-key YOUR_KEY
```

### Common Issues

1. **"Invalid API Key"** - Verify your API key is correct and active
2. **"Rate limit exceeded"** - Wait a few minutes, the server has built-in rate limiting
3. **"Company not found"** - Check the company number format (8 characters, padded with zeros)

## Contributing

Contributions are welcome! Please ensure:
- All tests pass (`npm test`)
- Code is properly typed (no `any` types)
- Follow the existing code style
- Add tests for new features

## Support

- 📚 [MCP Documentation](https://modelcontextprotocol.io)
- 🐛 [Report Issues](https://github.com/aicayzer/companies-house-mcp/issues)

---

Built with the Model Context Protocol SDK