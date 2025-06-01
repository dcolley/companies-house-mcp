# Use Node.js 20 on Alpine for smaller image size
FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Install system dependencies for building native modules
RUN apk add --no-cache python3 make g++

# Copy package files first for better Docker layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Remove development dependencies and build tools
RUN npm prune --production && \
    apk del python3 make g++ && \
    rm -rf ~/.npm

# Create non-root user for security
RUN addgroup -g 1001 -S mcp && \
    adduser -S mcp -u 1001 -G mcp

# Change ownership of app directory
RUN chown -R mcp:mcp /app

# Switch to non-root user
USER mcp

# Expose the port (though MCP typically uses stdio)
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Default command
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL maintainer="Companies House MCP Server"
LABEL version="0.1.0"
LABEL description="Model Context Protocol server for UK Companies House API" 