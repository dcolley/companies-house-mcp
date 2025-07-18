# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-18

### Added
- Initial release of Companies House MCP Server
- **Company Search** - Search for UK companies by name or number
- **Company Profiles** - Get detailed company information and status
- **Officer Information** - Retrieve directors and secretaries data
- **Filing History** - Access recent filings and documents
- **Company Charges** - View outstanding charges and mortgages
- **PSC Data** - Get Persons with Significant Control information
- **Officer Search** - Search for officers across all companies
- Support for verbose/compact response modes
- Built-in rate limiting (500 requests per 5 minutes)
- Response caching for improved performance
- Comprehensive error handling and user-friendly error messages
- Full TypeScript support with strict type checking
- Extensive test coverage (115+ tests)
- Docker support for containerized deployment
- GitHub Actions workflow for automated npm publishing

### Features
- **7 MCP Tools** providing comprehensive access to UK Companies House data
- **Dual Response Modes**: Compact (default) and verbose for detailed information
- **Pagination Support**: Handle large datasets with proper pagination
- **Input Validation**: Comprehensive Zod schemas for all tool parameters
- **Error Handling**: Graceful handling of API errors with user-friendly messages
- **Performance Optimizations**: Built-in caching and rate limiting
- **Professional Documentation**: Complete API reference and usage examples

### Technical Details
- Built with TypeScript and Model Context Protocol (MCP) SDK
- Uses Companies House REST API v4
- Supports Node.js 18+
- Zero external dependencies in production (except MCP SDK)
- Comprehensive test suite with unit and integration tests
- Clean architecture with separation of concerns

### Documentation
- Complete README with installation and usage instructions
- Detailed API reference documentation
- Testing guide with examples
- Docker deployment guide
- GitHub Actions CI/CD pipeline

[1.0.0]: https://github.com/modelcontextprotocol/companies-house-mcp/releases/tag/v1.0.0 