# Kingsman

A minimal VS Code extension for quick Google keyword searches - with agent skill support.

## Features

- **Kingsman: Google Search** - Opens Google Search in your default browser
- **Agent-friendly commands** - Programmatic access for AI agents (no UI prompts)
- **MCP skill server** - Model Context Protocol integration for multi-agent systems

## Installation

### From Antigravity/VS Code Marketplace

1. Open Extensions (`Ctrl+Shift+X`)
2. Search: **Kingsman**
3. Click **Install**

**Marketplace:** [Open VSX](https://open-vsx.org/extension/nilhan-demel/kingsman)

### From VSIX

Download from [GitHub Releases](https://github.com/Nilhan-DeMel/Kingsman/releases).

## Usage

### Human Users

1. `Ctrl+Shift+P` → **Kingsman: Google Search**
2. Enter query
3. Browser opens with results

### AI Agents

See [SKILLS.md](SKILLS.md) for full agent integration documentation.

**Quick start:**

```
Call: kingsman.googleSearchWriteArtifact
Args: { "query": "your search" }
Read: .kingsman/skills/google_search/latest.json
```

## Agent Commands

| Command | Description |
|---------|-------------|
| `kingsman.googleSearchUrl` | Returns URL only (no browser) |
| `kingsman.googleSearchWriteArtifact` | Returns URL + writes artifact file |
| `kingsman.googleSearchOpenAndWrite` | Opens browser + writes artifact |

## MCP Server (Optional)

For agents supporting Model Context Protocol:

```bash
# Install MCP server dependencies
cd skills/kingsman-mcp
npm install
```

Register in `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "kingsman-search": {
      "command": "node",
      "args": ["path/to/Kingsman/skills/kingsman-mcp/index.js"]
    }
  }
}
```

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `kingsman.searchBaseUrl` | `https://www.google.com/search?q=` | Base URL for searches |

## Development

```bash
npm install
npm run compile
npm run package
```

## License

MIT - see [LICENSE](LICENSE)

## Changelog

See [CHANGELOG.md](CHANGELOG.md)
