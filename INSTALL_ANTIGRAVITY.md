# Installing Kingsman in Antigravity IDE

This guide covers installing the Kingsman extension in Antigravity IDE (VS Code fork).

## Download the Extension

1. Go to [Kingsman Releases](https://github.com/Nilhan-DeMel/Kingsman/releases)
2. Download `kingsman-0.1.0.vsix` from the latest release

---

## Install via GUI (Recommended)

1. Open **Antigravity IDE**
2. Open Extensions view: `Ctrl+Shift+X`
3. Click the **⋯** (More Actions) button in the top-right of the Extensions panel
4. Select **"Install from VSIX…"**
5. Navigate to and select `kingsman-0.1.0.vsix`
6. Click **Reload** if prompted

---

## Install via Command Palette

1. Press `Ctrl+Shift+P` to open Command Palette
2. Type: `Extensions: Install from VSIX`
3. Select the command
4. Navigate to and select `kingsman-0.1.0.vsix`
5. Reload window if prompted

---

## Install via Command Line

```bash
# Replace <path> with actual path to the VSIX file
antigravity --install-extension <path>/kingsman-0.1.0.vsix

# Or if using code command
code --install-extension <path>/kingsman-0.1.0.vsix
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

### Command not appearing

- Reload the window: `Ctrl+Shift+P` → `Developer: Reload Window`
- Check Extensions panel: ensure Kingsman is enabled
- Check Output panel: `View` → `Output` → select "Extension Host" for errors

### Browser doesn't open

- Check the console log for the URL: `Help` → `Toggle Developer Tools` → Console
- Look for: `[Kingsman] Opening search URL: https://google.com/search?q=...`
- Verify default browser settings in your OS

### Extension conflicts

- Disable other extensions temporarily to test
- Check for duplicate command registrations

---

## Uninstall

1. Open Extensions view: `Ctrl+Shift+X`
2. Find **Kingsman** in the installed extensions
3. Click the gear icon → **Uninstall**
4. Reload window if prompted

---

## Update the Extension

1. Download the new VSIX from [Releases](https://github.com/Nilhan-DeMel/Kingsman/releases)
2. Follow the same install steps (will overwrite existing version)
3. Reload window
