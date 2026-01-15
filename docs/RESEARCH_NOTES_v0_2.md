# Research Notes - Kingsman v0.2.x Skill Store

## 1. Antigravity Skills Specification

### Path Discovery (Verified on this machine)

- **Global skills path**: `%USERPROFILE%\.gemini\antigravity\skills\` (to be created)
- **Workspace skills path**: `<workspace>\.agent\skills\`
- **MCP config**: `%USERPROFILE%\.gemini\antigravity\mcp_config.json` (exists)

### SKILL.md Format (agentskills.io canonical spec)

```yaml
---
name: skill-name  # lowercase, hyphens, 1-64 chars, must match folder name
description: Short description of the skill
---

# Skill Name

Markdown body with instructions...
```

**Rules**:

- Folder name MUST match `name` in frontmatter
- Name: lowercase letters, numbers, hyphens only
- Length: 1-64 characters
- Required frontmatter: `name`, `description`

## 2. GitHub API Rate Limits

### Authenticated (with PAT)

| Endpoint | Rate Limit |
|----------|------------|
| REST API general | 5,000 req/hour |
| Search API (repos) | 30 req/min |
| Search API (code) | 10 req/min |
| GraphQL | 5,000 points/hour |

### Unauthenticated

| Endpoint | Rate Limit |
|----------|------------|
| REST API general | 60 req/hour |
| Search API | 10 req/min |

### Implementation Strategy

- Cache search results for 10 minutes
- Exponential backoff on 403 responses
- Display rate limit status in UI
- Degrade gracefully without PAT

## 3. GitHub Search Queries

### Code Search (for SKILL.md files)

```
GET /search/code?q=filename:SKILL.md+<keywords>
```

- Requires authentication
- Returns file matches with repository context

### Repository Search

```
GET /search/repositories?q=<keywords>+topic:agent-skills
GET /search/repositories?q=<keywords>+in:readme
```

### NL Query Expansion (No LLM)

```javascript
const expansions = {
  "text to speech": ["tts", "text-to-speech", "speech-synthesis"],
  "code review": ["code-analysis", "linting", "static-analysis"],
  "web scraping": ["web-scraper", "crawler", "html-parser"],
  // ... more mappings
};
```

## 4. VS Code Webview Security

### Content Security Policy (Required)

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'none'; 
               img-src ${webview.cspSource} https:; 
               script-src ${webview.cspSource}; 
               style-src ${webview.cspSource} 'unsafe-inline';">
```

### Resource Loading

- Use `webview.asWebviewUri()` for local resources
- Set `localResourceRoots` to restrict access
- No remote script injection

### Best Practices

- Themeable (use VS Code CSS variables)
- Keyboard navigable (WCAG 2.1)
- No inline scripts (use message passing)

## 5. VS Code SecretStorage

### API

```typescript
const secret = context.secrets;
await secret.store('github-pat', token);
const token = await secret.get('github-pat');
await secret.delete('github-pat');
```

- Encrypted at rest
- Scoped to extension
- No file access needed

## 6. Risk Detection Patterns

### Binaries

```
*.exe, *.dll, *.so, *.dylib, *.bin, *.app
```

### Dangerous Scripts

```regex
curl.*\|.*bash
wget.*\|.*sh
powershell.*-enc
base64.*\|.*sh
eval\s*\(
```

### npm Hooks

```json
// package.json risky fields
"preinstall", "postinstall", "preuninstall", "postuninstall"
```

## 7. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                  Kingsman Extension                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │              Webview (Skill Store UI)            │    │
│  │  - Search bar + filters                          │    │
│  │  - Results list                                  │    │
│  │  - Inspect panel                                 │    │
│  │  - Installed tab                                 │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                    postMessage                           │
│                         │                                │
│  ┌─────────────────────────────────────────────────┐    │
│  │            Command API (vscode.commands)         │    │
│  │  - kingsman.store.search                         │    │
│  │  - kingsman.store.inspect                        │    │
│  │  - kingsman.store.stage                          │    │
│  │  - kingsman.store.install                        │    │
│  │  - kingsman.store.listInstalled                  │    │
│  │  - kingsman.store.uninstall                      │    │
│  └─────────────────────────────────────────────────┘    │
│                         │                                │
│                   child_process.spawn                    │
│                         │                                │
└─────────────────────────┼────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│ kingsman-   │  │ kingsman-   │  │ kingsman-   │
│ search      │  │ inspector   │  │ installer   │
│ (skill)     │  │ (skill)     │  │ (skill)     │
└─────────────┘  └─────────────┘  └─────────────┘
     │                 │                 │
     └─────────────────┴─────────────────┘
                       │
              Global Skills Folder
        %USERPROFILE%\.gemini\antigravity\skills\
```

## 8. Data Directory Structure

```
%USERPROFILE%\.gemini\antigravity\
├── skills/                      # Global skills folder
│   ├── kingsman-search/         # Search skill
│   │   ├── SKILL.md
│   │   └── index.js
│   ├── kingsman-inspector/      # Inspector skill
│   │   ├── SKILL.md
│   │   └── index.js
│   ├── kingsman-installer/      # Installer skill
│   │   ├── SKILL.md
│   │   └── index.js
│   └── <user-installed-skills>/ # User's installed skills
├── .kingsman/                   # Kingsman data
│   ├── staging/                 # Downloaded repos awaiting approval
│   ├── registry.json            # Installed skills registry
│   ├── cache/                   # Search result cache
│   └── logs/                    # Operation logs
└── mcp_config.json              # Existing MCP config
```

## 9. JSON Contracts

### Search Result

```json
{
  "id": "owner/repo",
  "name": "repo-name",
  "owner": "owner",
  "description": "...",
  "stars": 123,
  "forks": 45,
  "lastUpdated": "2026-01-15T00:00:00Z",
  "license": "MIT",
  "hasSkillMd": true,
  "skillPaths": [".claude/skills/my-skill"],
  "source": "github-code-search",
  "score": 0.85
}
```

### Inspection Result

```json
{
  "id": "owner/repo",
  "category": "A|B|C",
  "confidence": 85,
  "explanation": "...",
  "skills": [
    {"path": ".", "name": "skill-name", "description": "..."}
  ],
  "conversionPlan": {
    "proposedName": "converted-skill",
    "keep": ["src/", "README.md"],
    "ignore": ["tests/", ".github/"],
    "dependencies": ["node"],
    "skillMdProposal": "..."
  },
  "riskReport": {
    "level": "low|medium|high",
    "binaries": [],
    "scripts": ["install.sh"],
    "suspiciousPatterns": [],
    "npmHooks": []
  }
}
```

### Registry Entry

```json
{
  "skillName": "my-skill",
  "sourceUrl": "https://github.com/owner/repo",
  "installedAt": "2026-01-15T00:00:00Z",
  "version": "v1.0.0",
  "riskLevel": "low",
  "installTarget": "global|workspace",
  "skillPath": "/path/to/skill"
}
```

## 10. References

- [GitHub REST API Search](https://docs.github.com/en/rest/search)
- [VS Code Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- [VS Code SecretStorage](https://code.visualstudio.com/api/references/vscode-api#SecretStorage)
- [Agent Skills Spec](https://agentskills.io) (canonical)
