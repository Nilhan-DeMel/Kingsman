# Kingsman v0.2.x - Super Granular Implementation Plan

## Overview

Transform Kingsman into an IDE-native "Skill Store + Skill Converter + Skill Installer" for Antigravity Agents.

## Version

- Current: v0.1.2
- Target: v0.2.0

## Architecture

### Design Principle: Thin Extension + Skill Backends

```
Kingsman Extension (thin UI layer)
    │
    ├── Webview (Skill Store UI)
    │
    └── Commands (vscode.commands)
            │
            └── child_process.spawn
                    │
    ┌───────────────┼───────────────┐
    ▼               ▼               ▼
kingsman-search  kingsman-inspector  kingsman-installer
(global skill)   (global skill)      (global skill)
```

### Data Flow

```
User Input → NL Expansion → GitHub API → Ranking → Results
                                            │
                                            ▼
                                    Inspect (on demand)
                                            │
                                            ▼
                                    Category A/B/C + Risk
                                            │
                                            ▼
                                    Stage (download + quarantine)
                                            │
                                            ▼
                                    User Approval (MANDATORY)
                                            │
                                            ▼
                                    Install to global/workspace
```

---

## Directory Structure

### Extension Source (`src/`)

```
src/
├── extension.ts              # Main entry + command registration
├── store/
│   ├── StorePanel.ts         # Webview panel controller
│   ├── webview/
│   │   ├── index.html        # Store UI template
│   │   ├── store.css         # Themeable styles
│   │   └── store.js          # UI logic (message passing)
│   └── messages.ts           # Webview message types
├── commands/
│   ├── search.ts             # kingsman.store.search
│   ├── inspect.ts            # kingsman.store.inspect
│   ├── stage.ts              # kingsman.store.stage
│   ├── install.ts            # kingsman.store.install
│   ├── list.ts               # kingsman.store.listInstalled
│   └── uninstall.ts          # kingsman.store.uninstall
├── backend/
│   ├── SkillRunner.ts        # Spawns skill CLIs
│   ├── Bootstrap.ts          # Installs bundled skills
│   └── Paths.ts              # Path resolution
├── secrets/
│   └── GitHubAuth.ts         # PAT storage via SecretStorage
└── types/
    └── contracts.ts          # Shared JSON schemas
```

### Bundled Skills (`bundled-skills/`)

```
bundled-skills/
├── kingsman-search/
│   ├── SKILL.md
│   ├── package.json
│   └── index.js
├── kingsman-inspector/
│   ├── SKILL.md
│   ├── package.json
│   └── index.js
└── kingsman-installer/
    ├── SKILL.md
    ├── package.json
    └── index.js
```

### Runtime Data (`%USERPROFILE%\.gemini\antigravity\`)

```
.gemini/antigravity/
├── skills/                   # Global skills
│   ├── kingsman-search/
│   ├── kingsman-inspector/
│   ├── kingsman-installer/
│   └── <user-installed>/
└── .kingsman/
    ├── staging/              # Quarantine area
    ├── registry.json         # Installed skills DB
    ├── cache/                # Search cache
    └── logs/
```

---

## Threat Model & Safety Gates

### Threat 1: Malicious Code Execution

**Mitigation:**

- All downloads go to staging/ first
- Risk scanner checks for binaries, scripts, suspicious patterns
- No auto-execution; user must click "Approve & Install"
- MANUAL_REVIEW_REQUIRED.md created for medium/high risk

### Threat 2: Token Exposure

**Mitigation:**

- GitHub PAT stored in VS Code SecretStorage (encrypted)
- Never written to files or logs
- UI shows masked token status

### Threat 3: Path Traversal

**Mitigation:**

- All paths validated against allowed roots
- Skill names sanitized (kebab-case only)

### Threat 4: Remote Code Injection (Webview)

**Mitigation:**

- Strict CSP: no inline scripts, no remote scripts
- Message passing for all communication
- asWebviewUri for local resources

---

## JSON Contracts (Skill CLI)

### kingsman-search CLI

```bash
node index.js search --query "text to speech" --pat $TOKEN
```

**Output:**

```json
{
  "results": [
    {
      "id": "owner/repo",
      "name": "repo-name",
      "description": "...",
      "stars": 123,
      "hasSkillMd": true,
      "skillPaths": ["path/to/skill"],
      "source": "github-code|github-repo",
      "score": 0.92
    }
  ],
  "rateLimitRemaining": 28,
  "cached": false
}
```

### kingsman-inspector CLI

```bash
node index.js inspect --repo "owner/repo" --pat $TOKEN
```

**Output:**

```json
{
  "category": "A|B|C",
  "confidence": 85,
  "explanation": "Repository contains valid SKILL.md at root",
  "skills": [...],
  "conversionPlan": {...},
  "riskReport": {...}
}
```

### kingsman-installer CLI

```bash
node index.js stage --repo "owner/repo" --staging-dir "/path"
node index.js install --staged-id "xxx" --target global
node index.js list
node index.js uninstall --name "skill-name"
```

---

## Webview UI Components

### Search View

- Search input (placeholder: "Find skills, e.g. 'convert pdf to text'")
- Filter pills: Source (All/GitHub/HuggingFace), License, "Skill-ready only"
- Results grid with cards
- Rate limit badge (shows X/Y remaining)

### Result Card

- Icon (folder/github)
- Name + Owner
- Stars badge
- Last updated
- Description snippet
- Category badge (A/B/C) - shown after quick-check
- Buttons: Quick Check, Inspect, Stage

### Inspect Panel

- Category badge (large)
- Confidence meter (0-100)
- Explanation text
- Conversion Plan accordion:
  - Keep files
  - Ignore files
  - Dependencies
  - Proposed SKILL.md
- Risk Report section:
  - Level badge (low/medium/high)
  - Findings list
- "Stage & Install" button (disabled if high risk without override)

### Installed Tab

- List of installed skills from registry.json
- Each row: Name, Source, Installed date, Actions (Open, Update, Uninstall)

---

## Implementation Phases

### Phase 1: Foundation

- Create bundled skills structure
- Implement Paths.ts
- Implement Bootstrap.ts
- Implement SkillRunner.ts

### Phase 2: Search Skill

- Implement kingsman-search CLI
- Query expansion
- GitHub API calls
- Caching

### Phase 3: Inspector Skill

- Implement kingsman-inspector CLI
- Repo analysis
- Category classification
- Risk scanning

### Phase 4: Installer Skill

- Implement kingsman-installer CLI
- Stage/Install/Uninstall
- Registry management

### Phase 5: Extension Commands

- Implement all vscode.commands
- Wire to skill backends

### Phase 6: Webview Store

- Create StorePanel.ts
- Build HTML/CSS/JS
- Message passing
- Theme integration

### Phase 7: Integration & Polish

- Error handling
- Loading states
- User feedback

### Phase 8: Docs & Release

- Update README, CHANGELOG
- Build VSIX
- Publish to Open VSX
