# Kingsman

A Skill Store for Antigravity agents - discover, inspect, and install skills from GitHub.

## Features

### 🎩 Skill Store

- **Natural Language Search** - Find skills like "convert pdf to text" or "web scraping"
- **Quick Check** - Classify repositories as A (ready), B (convertible), or C (not suitable)
- **Risk Scanning** - Detect binaries, scripts, and suspicious patterns before install
- **One-Click Install** - Stage, approve, and install skills to global folder

### 🔍 Google Search (Legacy)

- Quick Google keyword searches from your editor

## Installation

### From Marketplace

1. Open Extensions (`Ctrl+Shift+X`)
2. Search: **Kingsman**
3. Click **Install**

**Marketplace:** [Open VSX](https://open-vsx.org/extension/nilhan-demel/kingsman)

## Usage

### Skill Store

1. Press `Ctrl+Shift+P`
2. Type: **Kingsman: Skill Store**
3. Search for skills using natural language
4. Click **Quick Check** to classify a repository
5. Click **Inspect** for detailed analysis
6. Click **Stage & Install** to install

### Google Search

1. Press `Ctrl+Shift+P`
2. Type: **Kingsman: Google Search**
3. Enter your query

## Agent API

All store commands are available for AI agents:

```typescript
// Search for skills
await vscode.commands.executeCommand('kingsman.store.search', { query: "text to speech" });

// Inspect a repository
await vscode.commands.executeCommand('kingsman.store.inspect', { repo: "owner/repo" });

// Stage for installation
await vscode.commands.executeCommand('kingsman.store.stage', { repo: "owner/repo" });

// Install staged skill
await vscode.commands.executeCommand('kingsman.store.install', { stagedId: "xxx" });

// List installed skills
await vscode.commands.executeCommand('kingsman.store.listInstalled');

// Uninstall a skill
await vscode.commands.executeCommand('kingsman.store.uninstall', { skillName: "my-skill" });
```

## Directories

| Path | Purpose |
|------|---------|
| `~/.gemini/antigravity/skills/` | Global skills folder |
| `~/.gemini/antigravity/.kingsman/` | Kingsman data (staging, registry, cache) |
| `<workspace>/.agent/skills/` | Workspace skills |

## Commands

| Command | Description |
|---------|-------------|
| `Kingsman: Skill Store` | Open the Skill Store webview |
| `Kingsman: Google Search` | Search Google (opens browser) |
| `kingsman.store.search` | Agent: Search for skills |
| `kingsman.store.inspect` | Agent: Inspect repository |
| `kingsman.store.stage` | Agent: Stage for install |
| `kingsman.store.install` | Agent: Install staged skill |
| `kingsman.store.listInstalled` | Agent: List installed |
| `kingsman.store.uninstall` | Agent: Uninstall skill |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `kingsman.searchBaseUrl` | `https://www.google.com/search?q=` | Google search URL |
| `kingsman.globalSkillsPath` | `~/.gemini/antigravity/skills` | Custom skills folder |

## License

MIT - see [LICENSE](LICENSE)

## Changelog

See [CHANGELOG.md](CHANGELOG.md)
