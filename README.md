# Companies House MCP Server

> **Unofficial** UK Companies House MCP server providing AI assistants with access to UK company data.

## Overview

This is a Model Context Protocol (MCP) server that provides standardized access to the UK Companies House Public Data API. It enables AI assistants like Claude to search for companies, retrieve company profiles, officer information, filing history, and more.

**Status**: 🚧 Under Development

## Features

- 🔍 **Company Search** - Find companies by name or number
- 📊 **Company Profiles** - Detailed company information and status
- 👥 **Officer Information** - Directors and secretaries data
- 📄 **Filing History** - Recent filings and compliance activity
- 💰 **Charges** - Financial charges and securities information
- 🏢 **PSC Data** - Persons with Significant Control information
- 🔎 **Officer Search** - Find companies by director/officer name

## Installation

### Prerequisites

- Node.js 18+ 
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
git clone https://github.com/your-username/companies-house-mcp
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
```

## Usage

### With Claude Desktop

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

### Example Queries

Once connected, you can ask Claude:

- "Search for companies named Acme"
- "Get the profile for company number 12345678"
- "Who are the directors of Acme Corporation Ltd?"
- "What filings has company 12345678 made recently?"
- "Does company 12345678 have any charges against it?"

## Available Tools

| Tool | Description | Inputs |
|------|-------------|---------|
| `search_companies` | Search companies by name | query, limit, activeOnly |
| `get_company_profile` | Get detailed company info | companyNumber |
| `get_company_officers` | List company officers | companyNumber, activeOnly, limit |
| `get_filing_history` | Get filing history | companyNumber, category, limit |
| `get_company_charges` | Get company charges | companyNumber, limit |
| `get_persons_with_significant_control` | Get PSC information | companyNumber, limit |
| `search_officers` | Search officers by name | query, limit, activeOnly |

## Configuration

### Environment Variables

```bash
COMPANIES_HOUSE_API_KEY=your_api_key_here     # Required
CH_MCP_RATE_LIMIT=500                         # Optional: requests per 5 minutes
CH_MCP_CACHE_SIZE=1000                        # Optional: cache size
CH_MCP_LOG_LEVEL=info                         # Optional: logging level
```

### CLI Options

```bash
companies-house-mcp --help

Options:
  --api-key <key>        Companies House API key
  --rate-limit <num>     Max requests per 5 minutes (default: 500)
  --cache-size <num>     Max cache entries (default: 1000)
  --log-level <level>    Logging level (default: info)
  --no-cache            Disable response caching
  --version             Show version number
```

## Development

### Project Structure

```
companies-house-mcp/
├── src/
│   ├── tools/         # MCP tool implementations
│   ├── lib/           # Shared utilities
│   ├── types/         # TypeScript definitions
│   └── index.ts       # CLI entry point
├── tests/             # Test files
├── docs/              # Documentation
└── examples/          # Usage examples
```

### Key Dependencies

- **@modelcontextprotocol/sdk** - Official MCP TypeScript SDK
- **@companieshouse/api-sdk-node** - Official Companies House API client
- **zod** - Runtime type validation
- **jest** - Testing framework

### Development Scripts

```bash
npm run build         # Compile TypeScript
npm test              # Run tests
npm run test:watch    # Run tests in watch mode
npm run lint          # Lint code
npm run dev           # Development server
```

### Testing

```bash
# Unit tests
npm test

# Integration tests with real API
npm run test:integration

# Test with MCP Inspector
npm run debug
```

## API Reference

See [docs/companies-house-api-reference.md](docs/companies-house-api-reference.md) for detailed API documentation.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-tool`
3. Make your changes and add tests
4. Ensure tests pass: `npm test`
5. Submit a pull request

See [docs/development-guide.md](docs/development-guide.md) for detailed development instructions.

## Rate Limits

- **Default**: 500 requests per 5 minutes (conservative buffer)
- **Companies House Limit**: 600 requests per 5 minutes
- **Caching**: Responses cached 2-30 minutes depending on data type

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Disclaimer

This is an **unofficial** implementation. It is not affiliated with or endorsed by Companies House or the UK Government.

## Support

- 📚 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/your-username/companies-house-mcp/issues)
- 💬 [Discussions](https://github.com/your-username/companies-house-mcp/discussions)

---

**Built with ❤️ for the MCP community**