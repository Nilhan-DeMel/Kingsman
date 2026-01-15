# Kingsman MCP Server

A minimal MCP (Model Context Protocol) server that provides a `google_search_url` tool for agents.

## Installation

```bash
cd skills/kingsman-mcp
npm install
```

## Usage

### Register in Antigravity

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "kingsman-search": {
      "command": "node",
      "args": ["C:/path/to/Kingsman/skills/kingsman-mcp/index.js"]
    }
  }
}
```

Restart Antigravity to load the new MCP server.

### Tool: google_search_url

**Description**: Generate a Google Search URL for a query.

**Input**:

```json
{
  "query": "typescript best practices",
  "baseUrl": "https://www.google.com/search?q="  // optional
}
```

**Output**:

```json
{
  "url": "https://www.google.com/search?q=typescript%20best%20practices",
  "query": "typescript best practices",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "source": "kingsman-mcp"
}
```

## Agent Usage Example

```
Use the kingsman-search.google_search_url tool to generate a search URL:
- query: "VS Code extension development"

The tool will return a properly encoded Google Search URL that you can:
1. Present to the user
2. Open via vscode.env.openExternal
3. Store for later reference
```
