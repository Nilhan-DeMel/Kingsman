# Kingsman

A minimal VS Code extension for quick Google keyword searches directly from your editor.

## Features

- **Kingsman: Google Search** - Opens Google Search in your default browser with your query

## Installation

### From Source (Development)

1. Clone this repository:

   ```bash
   git clone <repository-url>
   cd Kingsman
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Compile the extension:

   ```bash
   npm run compile
   ```

4. Open the folder in VS Code/Antigravity IDE and press `F5` to launch the Extension Development Host.

### From VSIX Package

1. Build the VSIX package:

   ```bash
   npm install -g @vscode/vsce
   vsce package
   ```

2. Install the generated `.vsix` file:
   - In VS Code: `Extensions` → `...` → `Install from VSIX...`
   - Or via command line: `code --install-extension kingsman-0.1.0.vsix`

## Usage

1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type `Kingsman: Google Search`
3. Enter your search query
4. Your default browser opens with Google Search results

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `kingsman.searchBaseUrl` | `https://www.google.com/search?q=` | Base URL for search queries |

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode (auto-compile on changes)
npm run watch

# Launch Extension Development Host
# Press F5 in VS Code
```

## Building & Packaging

```bash
# Install vsce globally
npm install -g @vscode/vsce

# Create VSIX package
vsce package
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.
