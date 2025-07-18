# Companies House MCP Server Documentation

Welcome to the Companies House MCP Server documentation. This server provides AI assistants with access to UK Companies House public data through the Model Context Protocol (MCP).

## Quick Start

1. **Install the server**: `npm install -g companies-house-mcp`
2. **Get your API key**: [Companies House Developer Portal](https://developer.company-information.service.gov.uk/)
3. **Configure Claude**: Add the server to your MCP configuration
4. **Start searching**: Ask Claude about UK companies!

## Documentation

### Core Documentation
- **[API Reference](companies-house-api-reference.md)** - Complete tool specifications and examples
- **[Testing Guide](testing-guide.md)** - How to test the server and run the test suite

### Getting Started
- **[Installation](installation.md)** - Installation and setup instructions
- **[Tools Reference](tools.md)** - Complete tool documentation and examples

## Available Tools

| Tool | Description |
|------|-------------|
| `search_companies` | Search for companies by name or number |
| `get_company_profile` | Get detailed company information |
| `get_company_officers` | List company directors and secretaries |
| `get_filing_history` | View recent company filings |
| `get_company_charges` | Check company charges and mortgages |
| `get_persons_with_significant_control` | Get PSC information |
| `search_officers` | Search for officers by name |

## Features

- **🔍 Comprehensive Search** - Find companies and officers across the UK
- **📊 Detailed Profiles** - Get complete company information including status, addresses, and key dates
- **👥 Officer Information** - Access current and historical director/secretary data
- **📄 Filing History** - View recent accounts, returns, and other filings
- **💰 Financial Data** - Check charges, mortgages, and security interests
- **🏢 Control Structure** - Understand ownership through PSC data
- **⚡ High Performance** - Built-in caching and rate limiting
- **🛡️ Robust Error Handling** - Graceful handling of API issues

## Response Modes

All tools support two response modes:

- **Compact** (default): Essential information only
- **Verbose**: Complete details with additional context

## Support

- **Issues**: [GitHub Issues](https://github.com/aicayzer/companies-house-mcp/issues)
- **Discussions**: [GitHub Discussions](https://github.com/aicayzer/companies-house-mcp/discussions)
- **API Documentation**: [Companies House API](https://developer.company-information.service.gov.uk/)

## Contributing

We welcome contributions! Please see the main repository for contributing guidelines.

## License

This project is licensed under the MIT License. 