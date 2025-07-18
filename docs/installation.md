# Installation

## Prerequisites

- Node.js 18 or higher
- Companies House API key (free from [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk/))

## Install via npm

```bash
npm install -g companies-house-mcp
```

## Install from source

```bash
git clone https://github.com/aicayzer/companies-house-mcp.git
cd companies-house-mcp
npm install
npm run build
npm link
```

## Configuration

### Environment Variables

Create a `.env` file or set environment variables:

```bash
COMPANIES_HOUSE_API_KEY=your_api_key_here
DEBUG=false
```

### MCP Client Setup

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "companies-house": {
      "command": "companies-house-mcp",
      "args": ["--api-key", "your_api_key_here"]
    }
  }
}
```

## Verification

Test the installation:

```bash
companies-house-mcp --help
```

The server should start and register 7 tools for Companies House data access. 