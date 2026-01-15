# Installing Kingsman in Antigravity IDE

This guide covers installing Kingsman and using the Skill Store in Antigravity IDE.

---

## Installation

### Option 1: From Marketplace (Recommended)

1. Open **Antigravity IDE**
2. Press `Ctrl+Shift+X` (Extensions)
3. Search: **Kingsman**
4. Click **Install**
5. Reload window if prompted

### Option 2: From VSIX

1. Download from [GitHub Releases](https://github.com/Nilhan-DeMel/Kingsman/releases)
2. Extensions → ⋯ → "Install from VSIX…"
3. Select the downloaded file

---

## Using the Skill Store

### Open the Store

1. Press `Ctrl+Shift+P`
2. Type: **Kingsman: Skill Store**
3. Press Enter

### Search for Skills

1. Enter a natural language query:
   - "text to speech"
   - "convert pdf to markdown"
   - "web scraping tool"
2. Click **Search**

### Install a Skill

1. **Quick Check** - See if it's skill-ready (A/B/C classification)
2. **Inspect** - View detailed risk report
3. **Stage & Install** - Download and approve
4. **Approve & Install** - Confirm installation

### View Installed Skills

1. Click the **Installed** tab
2. See all skills with source and install date
3. **Uninstall** to remove

### Configure GitHub PAT (Optional)

A Personal Access Token improves search rate limits:

1. Click **Settings** tab
2. Enter your GitHub PAT (starts with `ghp_`)
3. Click **Save PAT**

---

## Verify Installation

1. Press `Ctrl+Shift+P`
2. Type: **Kingsman**
3. You should see:
   - **Kingsman: Skill Store**
   - **Kingsman: Google Search**

---

## Where Skills Are Installed

| Target | Path |
|--------|------|
| Global | `%USERPROFILE%\.gemini\antigravity\skills\` |
| Workspace | `<workspace>\.agent\skills\` |

### Example

After installing a skill named `pdf-converter`:

```
~/.gemini/antigravity/skills/pdf-converter/
├── SKILL.md
├── package.json
└── index.js
```

---

## Troubleshooting

### Skills not appearing

1. Reload window: `Ctrl+Shift+P` → "Developer: Reload Window"
2. Check the global skills folder exists
3. Check Output panel: View → Output → "Kingsman"

### Rate limit exceeded

1. Configure a GitHub PAT in Settings tab
2. Wait for rate limit reset (shown in UI)

### Installation failed

1. Check staging folder: `%USERPROFILE%\.gemini\antigravity\.kingsman\staging\`
2. Manually delete failed staging attempts
3. Try again

---

## Uninstall

1. Open Extensions view: `Ctrl+Shift+X`
2. Find **Kingsman**
3. Click gear icon → **Uninstall**
