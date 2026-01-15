# Installing Kingsman in Antigravity IDE

This guide covers installing the Kingsman extension in Antigravity IDE (VS Code fork).

---

## Option 1: Install from Marketplace (Recommended)

The easiest way to install Kingsman is directly from the Extensions view.

### Steps

1. Open **Antigravity IDE**
2. Press `Ctrl+Shift+X` to open Extensions
3. In the search box, type: **Kingsman**
4. Find "Kingsman" by `nilhan-demel`
5. Click **Install**
6. Reload window if prompted

### Alternative Search Terms

- `Kingsman`
- `nilhan-demel.kingsman`
- `@ext:nilhan-demel.kingsman`

---

## Option 2: Install from VSIX

If the marketplace is not available or you need a specific version.

### Download the Extension

1. Go to [Kingsman Releases](https://github.com/Nilhan-DeMel/Kingsman/releases)
2. Download `kingsman-<version>.vsix` from the latest release

### Install via GUI

1. Open **Antigravity IDE**
2. Open Extensions view: `Ctrl+Shift+X`
3. Click the **⋯** (More Actions) button in the top-right
4. Select **"Install from VSIX…"**
5. Navigate to and select the downloaded `.vsix` file
6. Click **Reload** if prompted

### Install via Command Palette

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type: `Extensions: Install from VSIX`
3. Select the command
4. Navigate to and select the `.vsix` file
5. Reload window if prompted

### Install via Command Line

```bash
antigravity --install-extension <path>/kingsman-0.1.1.vsix
# Or
code --install-extension <path>/kingsman-0.1.1.vsix
```

---

## Verify Installation

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type: `Kingsman`
3. You should see: **"Kingsman: Google Search"**
4. Select the command
5. Enter a search query (e.g., "typescript tutorial")
6. ✅ Your default browser should open Google Search with your query

---

## Troubleshooting

### Extension not appearing in marketplace search

- Antigravity uses Open VSX by default
- Try searching: `@ext:nilhan-demel.kingsman`
- Check Antigravity settings for marketplace URL

### Command not appearing

- Reload the window: `Ctrl+Shift+P` → `Developer: Reload Window`
- Check Extensions panel: ensure Kingsman is enabled
- Check Output panel: `View` → `Output` → select "Extension Host"

### Browser doesn't open

- Check the console log for the URL: `Help` → `Toggle Developer Tools` → Console
- Look for: `[Kingsman] Opening search URL: https://google.com/search?q=...`
- Verify default browser settings in your OS

---

## Uninstall

1. Open Extensions view: `Ctrl+Shift+X`
2. Find **Kingsman** in the installed extensions
3. Click the gear icon → **Uninstall**
4. Reload window if prompted

---

## Update the Extension

### From Marketplace

Updates are automatic or can be triggered via Extensions view.

### From VSIX

1. Download the new VSIX from [Releases](https://github.com/Nilhan-DeMel/Kingsman/releases)
2. Follow the same install steps (will overwrite existing version)
3. Reload window
