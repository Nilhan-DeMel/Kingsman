# Kingsman v0.2.0 — Research Notes

**Date:** 2026-01-15
**Purpose:** Ground truth for Skill Store implementation

---

## 0.1 Antigravity Skill Discovery Paths

### Verified Paths (Windows)

| Scope | Path | Status |
|-------|------|--------|
| **Workspace Skills** | `<workspace>/.agent/skills/<skill-name>/` | ✓ Confirmed via system prompt |
| **Global Skills** | `~/.gemini/antigravity/skills/<skill-name>/` | Needs creation (does not exist yet) |
| **Legacy Claude** | `.claude/skills/` | Compatible (converts on install) |
| **Legacy Copilot** | `.github/skills/` | Compatible (converts on install) |

### Evidence

1. **System Prompt Extract** (visible in my context):
   > "Skills are folders of instructions... Each skill folder contains:
   > - **SKILL.md** (required): The main instruction file with YAML frontmatter (name, description)"

2. **File System Check:**
   - `~/.gemini/antigravity/skills/` does NOT exist on Nilhan's system
   - Kingsman will be the first to create and populate it

### Design Implication

- Kingsman must **create** `~/.gemini/antigravity/skills/` if missing
- Use subfolder `~/.gemini/antigravity/skills/.kingsman/` for staging + registry

---

## 0.2 Agent Skills Standard (SKILL.md)

### Source: [agentskills.io/specification](https://agentskills.io/specification)

### Required Structure

```
skill-name/
└── SKILL.md      # Required
```

### SKILL.md Format

```yaml
---
name: skill-name
description: A description of what this skill does and when to use it.
---

# Skill Instructions

Step-by-step instructions, examples, edge cases...
```

### YAML Frontmatter Fields

| Field | Required | Constraints |
|-------|----------|-------------|
| `name` | **Yes** | 1-64 chars, lowercase a-z + hyphens, must match folder name |
| `description` | **Yes** | 1-1024 chars, describe what + when to use |
| `license` | No | Short license identifier |
| `compatibility` | No | 1-500 chars, environment requirements |
| `metadata` | No | Key-value pairs for custom properties |
| `allowed-tools` | No | Space-delimited pre-approved tools |

### Name Validation Rules

- Lowercase alphanumeric + hyphens only
- No leading/trailing hyphens
- No consecutive hyphens (`--`)
- Must match parent directory name

### Adoption

- GitHub Copilot: `.github/skills/` or `~/.copilot/skills/`
- Anthropic Claude: `.claude/skills/` or `~/.claude/skills/`
- Antigravity: `<workspace>/.agent/skills/` or `~/.gemini/antigravity/skills/`

### Design Implication

- Must validate SKILL.md YAML on inspection
- Normalize folder names to kebab-case
- Generate wrapper SKILL.md for convertible repos

---

## 0.3 Webview Feasibility

### Source: [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)

### Architecture

```
┌─────────────────────┐     postMessage()      ┌─────────────────────┐
│   Extension Host    │ ───────────────────────▶│      Webview        │
│   (TypeScript)      │◀─────────────────────── │      (HTML/JS)      │
└─────────────────────┘     postMessage()      └─────────────────────┘
```

### Key APIs

```typescript
// Create panel
const panel = vscode.window.createWebviewPanel(
  'kingsmanSkillStore',
  'Kingsman Skill Store',
  vscode.ViewColumn.One,
  { enableScripts: true }
);

// Extension → Webview
panel.webview.postMessage({ type: 'searchResults', data: results });

// Webview → Extension
panel.webview.onDidReceiveMessage(message => {
  switch (message.type) {
    case 'search': handleSearch(message.query); break;
    case 'install': handleInstall(message.repoUrl); break;
  }
});
```

### Security

- Webviews run in isolated iframe
- No direct filesystem access (must go through extension)
- Content Security Policy recommended
- `enableScripts: true` required for interactivity

### Design Implication

- Build HTML/CSS/JS for store UI
- Use message passing for all actions
- Extension handles all GitHub API calls and file operations

---

## 0.4 Search Sources & APIs

### 1. GitHub Code Search API

**Endpoint:** `GET https://api.github.com/search/code`

**Query:** `filename:SKILL.md`

**Example:**

```
GET /search/code?q=agent+filename:SKILL.md
```

**Rate Limits:**

- Unauthenticated: 10 requests/minute
- Authenticated (PAT): 30 requests/minute

**Response Fields:**

```json
{
  "items": [
    {
      "name": "SKILL.md",
      "repository": {
        "full_name": "owner/repo",
        "html_url": "...",
        "stargazers_count": 123,
        "updated_at": "2026-01-01T..."
      }
    }
  ]
}
```

### 2. GitHub Repository Search API

**Endpoint:** `GET https://api.github.com/search/repositories`

**Query:** `topic:agent-skills` or `"SKILL.md" in:readme`

**Better for:** Finding skill collections/repos

### 3. agentskills.io Directory

**Status:** No public API found
**Alternative:** Scrape or maintain curated list

### 4. Anthropic Skills Repo

**URL:** <https://github.com/anthropics/skills>
**Use:** Canonical examples, can be directly installed

### Design Implication

- Primary source: GitHub Code Search (`filename:SKILL.md`)
- Secondary: GitHub Repo Search (topic/readme search)
- Optional: Curated list for "Featured Skills"
- Recommend GitHub PAT for higher rate limits

---

## 0.5 Compatibility Detection Logic

### Classification

| Category | Criteria |
|----------|----------|
| **A: Already a Skill** | Has `SKILL.md` at root OR in `.claude/skills/**` OR `.github/skills/**` OR `.agent/skills/**` |
| **B: Convertible** | Has `README.md` + clear purpose + license, but no SKILL.md |
| **C: Not Suitable** | No docs, unclear purpose, contains only binaries, or flagged patterns |

### Risk Patterns to Flag

- `*.exe`, `*.dll`, `*.so` binaries
- `postinstall` scripts in package.json
- Shell scripts with `curl|sh`, `wget|bash`
- Obfuscated code
- Network requests to unknown hosts

### Design Implication

- Implement file scanner for risk patterns
- Generate risk score (Low/Medium/High)
- Require explicit approval for Medium/High

---

## Summary: Design Implications

1. **Create global skills directory** at `~/.gemini/antigravity/skills/` on first use
2. **Validate SKILL.md** against agentskills.io spec (name + description required)
3. **Normalize folder names** to kebab-case matching skill name
4. **Support legacy paths** (.claude/skills, .github/skills) by converting on install
5. **Use Webview** with bidirectional message passing
6. **Prefer GitHub Code Search** (`filename:SKILL.md`) + optional PAT
7. **Staging + Approval gate** before copying to active skills folder
8. **Risk Report** for scripts/binaries/suspicious patterns

---

## References

| Topic | Source |
|-------|--------|
| Agent Skills Spec | <https://agentskills.io/specification> |
| What are Skills | <https://agentskills.io/what-are-skills> |
| Example Skills | <https://github.com/anthropics/skills> |
| GitHub Code Search API | <https://docs.github.com/en/rest/search/search?apiVersion=2022-11-28#search-code> |
| VS Code Webview API | <https://code.visualstudio.com/api/extension-guides/webview> |
| VS Code SecretStorage | <https://code.visualstudio.com/api/references/vscode-api#SecretStorage> |
