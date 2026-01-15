# Kingsman

A minimal VS Code extension for quick Google keyword searches directly from your editor.

## Features

- **Kingsman: Google Search** - Opens Google Search in your default browser with your query

## Installation

### From Antigravity/VS Code Marketplace (Recommended)

1. Open Antigravity IDE or VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for **"Kingsman"** or **"nilhan-demel.kingsman"**
4. Click **Install**
5. Reload window if prompted

**Marketplace Links:**

- [Open VSX](https://open-vsx.org/extension/nilhan-demel/kingsman) (Antigravity default)

### From VSIX File

1. Download `kingsman-<version>.vsix` from [Releases](https://github.com/Nilhan-DeMel/Kingsman/releases)
2. In VS Code/Antigravity:
   - Open Extensions view (`Ctrl+Shift+X`)
   - Click `⋯` → **Install from VSIX…**
   - Select the downloaded file
3. Reload window if prompted

**For Antigravity IDE users:** See [INSTALL_ANTIGRAVITY.md](INSTALL_ANTIGRAVITY.md) for detailed instructions.

### From Source (Development)

```bash
git clone https://github.com/Nilhan-DeMel/Kingsman.git
cd Kingsman
npm install
npm run compile
```

Press `F5` to launch the Extension Development Host.

## Usage

1. Open Command Palette: `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
2. Type: `Kingsman: Google Search`
3. Enter your search query
4. Your default browser opens Google Search results

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `kingsman.searchBaseUrl` | `https://www.google.com/search?q=` | Base URL for search queries |

## Development

```bash
npm install       # Install dependencies
npm run compile   # Compile TypeScript
npm run watch     # Watch mode
npm run package   # Build VSIX
```

## Publishing

### To Open VSX (Antigravity Marketplace)

```bash
npx ovsx publish kingsman-<version>.vsix -p $OVSX_PAT
```

### To VS Code Marketplace

```bash
npx vsce publish -p $VSCE_PAT
```

## License

MIT License - see [LICENSE](LICENSE)

## Changelog

See [CHANGELOG.md](CHANGELOG.md)
