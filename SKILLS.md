# Using Kingsman as an Agent Skill

Kingsman provides multiple interfaces for agents to generate Google Search URLs programmatically.

## Quick Start

**Recommended for Antigravity agents:**

```
Call VS Code command: kingsman.googleSearchWriteArtifact
Arguments: { "query": "your search query" }
Read result from: .kingsman/skills/google_search/latest.json
```

---

## Option A: Artifact-Based (Recommended)

Best for agents that can invoke VS Code commands and read workspace files.

### Command

```
kingsman.googleSearchWriteArtifact
```

### Input

```json
{
  "query": "typescript best practices",
  "artifactPath": ".kingsman/skills/google_search/latest.json"  // optional
}
```

### Output

Returns:

```json
{
  "url": "https://www.google.com/search?q=typescript%20best%20practices",
  "artifactPath": "/workspace/.kingsman/skills/google_search/latest.json"
}
```

### Artifact File Schema

Location: `.kingsman/skills/google_search/latest.json`

```json
{
  "query": "typescript best practices",
  "url": "https://www.google.com/search?q=typescript%20best%20practices",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "source": "kingsman"
}
```

### Agent Prompt Snippet

```
To search Google for information:
1. Execute VS Code command `kingsman.googleSearchWriteArtifact` with arguments:
   {"query": "<your search query>"}
2. Read the result from `.kingsman/skills/google_search/latest.json`
3. The URL in the artifact is ready to present to the user or open in browser
```

---

## Option B: Direct URL Return

For agents that can capture command return values.

### Command

```
kingsman.googleSearchUrl
```

### Input

```json
{
  "query": "typescript best practices"
}
```

### Output

Returns directly:

```json
{
  "url": "https://www.google.com/search?q=typescript%20best%20practices"
}
```

---

## Option C: MCP Tool Server

For agents that support Model Context Protocol.

### Registration

Add to `~/.gemini/antigravity/mcp_config.json`:

```json
{
  "mcpServers": {
    "kingsman-search": {
      "command": "node",
      "args": ["C:/full/path/to/Kingsman/skills/kingsman-mcp/index.js"]
    }
  }
}
```

### First-Time Setup

```bash
cd skills/kingsman-mcp
npm install
```

### Tool

```
kingsman-search.google_search_url
```

### Input

```json
{
  "query": "typescript best practices"
}
```

### Output

```json
{
  "url": "https://www.google.com/search?q=typescript%20best%20practices",
  "query": "typescript best practices",
  "timestamp": "2026-01-15T12:00:00.000Z",
  "source": "kingsman-mcp"
}
```

---

## All Commands Reference

| Command | Use Case | UI Prompts | Returns |
|---------|----------|------------|---------|
| `kingsman.googleSearch` | Human user | Yes (input box) | Opens browser |
| `kingsman.googleSearchUrl` | Agent (simple) | No | `{url}` |
| `kingsman.googleSearchWriteArtifact` | Agent (file-based) | No | `{url, artifactPath}` |
| `kingsman.googleSearchOpenAndWrite` | Agent + browser | No | `{url, artifactPath, opened}` |

---

## Logging

All agent commands log to the **Kingsman** OutputChannel:

- View → Output → Select "Kingsman"
- Format: `[Kingsman] commandName: details`

---

## URL Encoding

All queries are properly encoded using `encodeURIComponent()`:

- Spaces → `%20`
- Special chars → URL-safe equivalents
- Unicode → UTF-8 percent-encoded
