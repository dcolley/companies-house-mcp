# Contributing to Companies House MCP Server

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, track issues and feature requests, and accept pull requests.

### Getting Started

1. **Fork the repository** and clone your fork locally
2. **Install dependencies**: `npm install`
3. **Set up environment**: Copy `.env.example` to `.env` and add your Companies House API key
4. **Run tests**: `npm test` to ensure everything works
5. **Build the project**: `npm run build`

### Development Workflow

1. Create a new branch from `main`: `git checkout -b feature/your-feature-name`
2. Make your changes, following our coding standards
3. Add or update tests for your changes
4. Ensure all tests pass: `npm test`
5. Ensure linting passes: `npm run lint`
6. Commit your changes with a clear commit message
7. Push to your fork and submit a pull request

## Coding Standards

### TypeScript Guidelines

- **Strict mode**: All code must pass TypeScript strict mode
- **Types first**: Define interfaces before implementation
- **No `any` types**: Use proper typing or `unknown` if necessary
- **Document public APIs**: Use JSDoc comments for public methods

### Code Style

We use ESLint and Prettier for consistent code formatting:

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Fix auto-fixable linting errors
npm run format      # Format code with Prettier
```

### File Structure

```
src/
├── tools/          # MCP tool implementations
├── lib/            # Shared utilities and clients
├── types/          # TypeScript type definitions
└── index.ts        # CLI entry point

tests/
├── unit/           # Unit tests mirroring src/
├── integration/    # Integration tests
└── __fixtures__/   # Test data and mocks
```

## MCP Tool Development

### Creating a New Tool

1. **Create the tool class** in `src/tools/your-tool.ts`:

```typescript
import { MCPTool } from "../types/mcp.js";
import { z } from "zod";

const InputSchema = z.object({
  param: z.string().describe("Parameter description"),
});

export class YourTool implements MCPTool {
  name = "your_tool";
  description = "Brief description of what the tool does";
  inputSchema = InputSchema;

  async execute(args: z.infer<typeof InputSchema>) {
    // Validate input
    const { param } = InputSchema.parse(args);
    
    // Implementation here
    
    return {
      content: [{
        type: "text" as const,
        text: "Formatted response text"
      }]
    };
  }
}
```

2. **Register the tool** in `src/server.ts`
3. **Write comprehensive tests** in `tests/unit/tools/your-tool.test.ts`
4. **Update documentation** as needed

### Tool Guidelines

- **Input validation**: Always use Zod schemas for validation
- **Error handling**: Return user-friendly error messages
- **Response formatting**: Format for human readability, not raw JSON
- **Rate limiting**: Use the shared client for API calls
- **Caching**: Leverage caching where appropriate

## Testing

We maintain high test coverage with both unit and integration tests.

### Writing Tests

- **Unit tests**: Test individual functions and classes in isolation
- **Integration tests**: Test end-to-end workflows
- **Mocking**: Use Jest mocks for external dependencies
- **Coverage**: Aim for >90% test coverage

### Test Structure

```typescript
describe("ToolName", () => {
  describe("Input Validation", () => {
    it("should validate required parameters", () => {
      // Test validation logic
    });
  });

  describe("Response Formatting", () => {
    it("should format response correctly", () => {
      // Test response formatting
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      // Test error scenarios
    });
  });
});
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:watch          # Run tests in watch mode
npm run test:coverage       # Run tests with coverage report
```

## Documentation

### API Documentation

- **Tool descriptions**: Clear, concise descriptions of what each tool does
- **Parameter documentation**: Document all parameters with types and examples
- **Response examples**: Show typical response formats
- **Error scenarios**: Document common error cases

### Code Documentation

- **JSDoc comments**: Document public methods and complex logic
- **README updates**: Keep README current with new features
- **Type definitions**: Use descriptive names and comments

## Pull Request Process

1. **Ensure tests pass**: All existing and new tests must pass
2. **Update documentation**: Include relevant documentation updates
3. **Follow commit conventions**: Use clear, descriptive commit messages
4. **Small, focused PRs**: Keep pull requests focused on a single feature/fix
5. **Link issues**: Reference any related issues in the PR description

### Commit Message Format

We follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(tools): add search_officers tool`
- `fix(api): handle rate limiting correctly`
- `docs(readme): update installation instructions`

## Issue Reporting

### Bug Reports

Include:
- **Description**: Clear description of the bug
- **Steps to reproduce**: Minimal steps to reproduce the issue
- **Expected behavior**: What you expected to happen
- **Actual behavior**: What actually happened
- **Environment**: Node.js version, OS, API key status
- **Logs**: Relevant error messages or logs

### Feature Requests

Include:
- **Use case**: Describe the problem you're trying to solve
- **Proposed solution**: How you think it should work
- **Alternatives considered**: Other solutions you've considered
- **Additional context**: Screenshots, mockups, or examples

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

## Questions?

Don't hesitate to ask questions in:
- GitHub Discussions for general questions
- GitHub Issues for bug reports and feature requests
- Pull Request comments for code-specific questions

Thank you for contributing! 🎉 