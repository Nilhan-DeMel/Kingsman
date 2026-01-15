# Kingsman v0.2.0 — Implementation Plan

**Goal:** Transform Kingsman into a "Skill Store + Installer" for Antigravity Agent Skills.

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           KINGSMAN EXTENSION                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐   │
│  │   SkillStore     │    │   SkillInspector │    │   SkillInstaller │   │
│  │   WebviewProvider│    │                  │    │                  │   │
│  └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘   │
│           │                       │                       │             │
│           └───────────────────────┼───────────────────────┘             │
│                                   ▼                                      │
│                     ┌─────────────────────────┐                         │
│                     │     GitHubService       │                         │
│                     │  (Search API + Download)│                         │
│                     └─────────────────────────┘                         │
│                                   │                                      │
└───────────────────────────────────┼──────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
    ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
    │   GitHub API    │   │  Staging Folder │   │  Skills Folder  │
    │  (search/code)  │   │    ~/.gemini/   │   │   ~/.gemini/    │
    │                 │   │ antigravity/    │   │ antigravity/    │
    │                 │   │ skills/.staging/│   │ skills/<name>/  │
    └─────────────────┘   └─────────────────┘   └─────────────────┘
```

---

## Data Flows

### Flow 1: Search → Display

```
User clicks "Kingsman: Skill Store"
       │
       ▼
┌─────────────────────────────────────┐
│   Webview Panel Opens               │
│   - Search bar                      │
│   - Source dropdown (GitHub Code,   │
│     GitHub Repo, Featured)          │
└─────────────────────────────────────┘
       │
       │ User types query, clicks Search
       ▼
┌─────────────────────────────────────┐
│   postMessage({ type: 'search',     │
│     query: '...', source: '...' })  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Extension: GitHubService.search() │
│   - GET /search/code or /search/    │
│     repositories                    │
│   - Parse response                  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   postMessage({ type: 'results',    │
│     items: [...] })                 │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Webview renders result list       │
│   - Name, stars, updated, snippet   │
└─────────────────────────────────────┘
```

### Flow 2: Inspect → Stage → Approve → Install

```
User selects repo, clicks [Inspect]
       │
       ▼
┌─────────────────────────────────────┐
│   SkillInspector.analyze(repoUrl)   │
│   - Download repo ZIP to temp       │
│   - Scan for SKILL.md locations     │
│   - Classify: A (skill) / B         │
│     (convertible) / C (unsuitable)  │
│   - Generate risk report            │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Display inspection results:       │
│   - Classification badge            │
│   - Skills found (list)             │
│   - Risk report (scripts, binaries) │
│   - [Stage Download] button         │
└─────────────────────────────────────┘
       │
       │ User clicks [Stage Download]
       ▼
┌─────────────────────────────────────┐
│   SkillInstaller.stage(repoUrl)     │
│   - Download ZIP to staging:        │
│     ~/.gemini/antigravity/skills/   │
│     .kingsman-staging/<repo-id>/    │
│   - Extract                         │
│   - Run normalizer                  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│   Display staged skill:             │
│   - Skill name, description         │
│   - Files included                  │
│   - FINAL Risk Report               │
│   - Install location picker:        │
│     [Global] [Workspace]            │
│   - [Approve & Install] button      │
└─────────────────────────────────────┘
       │
       │ User clicks [Approve & Install]
       ▼
┌─────────────────────────────────────┐
│   SkillInstaller.install(staged)    │
│   - Copy from staging to:           │
│     ~/.gemini/antigravity/skills/   │
│     <skill-name>/                   │
│   - Add to registry.json            │
│   - Delete staging folder           │
│   - Show success notification       │
└─────────────────────────────────────┘
```

---

## Threat Model + Safety Gates

### Threats

| Threat | Impact | Mitigation |
|--------|--------|------------|
| T1: Malicious scripts executed | Code execution, data theft | **Never auto-execute.** Scripts only listed in risk report. |
| T2: PAT leaked | GitHub account compromise | Use VS Code SecretStorage, never store in files. |
| T3: Overwrite existing skill | User loses customizations | Check existing, require confirm for overwrite. |
| T4: Install to wrong location | Agent can't find skill | Validate path before install, test discovery. |
| T5: Rate limit abuse | GitHub blocks IP | Cache results, show rate limit status, recommend PAT. |
| T6: Typosquatting skill names | User installs malicious skill | Show full repo URL, star count, last update for verification. |

### Safety Gates

| Gate | Location | Action |
|------|----------|--------|
| G1: Staging Quarantine | After download | All downloads go to `.kingsman-staging/` first |
| G2: Risk Report | Before install | Show scripts, binaries, suspicious patterns |
| G3: Explicit Approval | Before install | User must click "Approve & Install" |
| G4: Overwrite Confirm | If skill exists | Dialog: "Skill X exists. Overwrite?" |
| G5: PAT Prompt | On first search | "Add GitHub PAT for higher rate limits?" (optional) |

---

## File Structure (New)

```
src/
├── extension.ts              # Entry point (existing)
├── webview/
│   ├── SkillStoreProvider.ts # Webview panel provider
│   └── store.html            # Store UI HTML template
├── services/
│   ├── GitHubService.ts      # GitHub API client
│   ├── SkillInspector.ts     # Compatibility analyzer
│   └── SkillInstaller.ts     # Stage + normalize + install
├── models/
│   ├── Skill.ts              # Skill metadata interface
│   ├── InspectionReport.ts   # Compatibility report
│   └── RiskReport.ts         # Security scan results
└── utils/
    ├── SkillValidator.ts     # SKILL.md YAML validation
    ├── PathUtils.ts          # Global/workspace path helpers
    └── ZipDownloader.ts      # Download + extract ZIP
```

---

## Task Rubric

| # | Task | Est (hrs) | Inputs | Outputs | Evidence | Risk | Rollback |
|---|------|-----------|--------|---------|----------|------|----------|
| **Phase 2** |
| 2.1 | Create feature/skill-store branch | 0.1 | main | New branch | `git branch -a` | Low | Delete |
| 2.2 | Add /docs/ folder | 0.1 | Root | /docs/ | `ls docs/` | Low | Revert |
| **Phase 3** |
| 3.1 | Create SkillStoreProvider.ts | 1.0 | API docs | Webview class | Compiles | Low | Delete |
| 3.2 | Create store.html template | 1.5 | UI reqs | HTML/CSS/JS | Renders | Med | Revert |
| 3.3 | Register command | 0.2 | package.json | Command | In palette | Low | Revert |
| 3.4 | Message passing | 0.5 | Provider | Bidirectional | Logs | Low | Revert |
| 3.5 | GitHubService.ts | 1.0 | API docs | Service | Test passes | Med | Delete |
| 3.6 | Integrate search | 0.5 | Service, UI | Works E2E | Screenshot | Low | Revert |
| **Phase 4** |
| 4.1 | SkillInspector.ts | 1.5 | Spec | Inspector | Report gen | Med | Delete |
| 4.2 | Classification logic | 1.0 | Spec | A/B/C | Tests pass | Med | Revert |
| 4.3 | Risk scanner | 1.0 | Patterns | RiskReport | Detects flags | Med | Revert |
| 4.4 | Save report JSON | 0.3 | Report | File | Exists | Low | Delete |
| 4.5 | Display in UI | 0.5 | Report | UI | Screenshot | Low | Revert |
| **Phase 5** |
| 5.1 | ZipDownloader.ts | 0.5 | Node APIs | Util | Works | Low | Delete |
| 5.2 | SkillInstaller.ts | 1.5 | Spec | Installer | Stages | Med | Delete |
| 5.3 | Create staging folder | 0.2 | PathUtils | Folder | Exists | Low | Delete |
| 5.4 | Normalization | 1.0 | Spec | Normalized | Valid SKILL.md | Med | Revert |
| 5.5 | Approval UI | 0.5 | Report | Modal | Screenshot | Low | Revert |
| 5.6 | Final install | 0.5 | Staged | Active | Discoverable | High | Uninstall |
| 5.7 | registry.json | 0.5 | Events | Updated | Shows skills | Low | Delete |
| 5.8 | List command | 0.3 | Registry | QuickPick | Works | Low | Revert |
| **Phase 6** |
| 6.1 | SKILLS_STORE.md | 0.5 | Features | Doc | Complete | Low | Revert |
| 6.2 | Update README | 0.3 | Features | Updated | Accurate | Low | Revert |
| **Phase 7** |
| 7.1-7.6 | Tests | 1.4 | Code | VSIX, tests | Pass | Low | - |
| **Phase 8** |
| 8.1-8.5 | Release | 0.8 | VSIX | Published | v0.2.0 | Med | Unpublish |

**Total:** ~16 hours

---

## Success Criteria

1. ✓ "Kingsman: Skill Store" opens Webview
2. ✓ Search returns repos with SKILL.md
3. ✓ Inspection classifies A/B/C correctly
4. ✓ Risk report shows scripts/binaries
5. ✓ Staging folder receives skill
6. ✓ Approval required before install
7. ✓ Installed skill in `~/.gemini/antigravity/skills/`
8. ✓ Agent can use installed skill
9. ✓ Published to Open VSX as v0.2.0

---

*Plan created: 2026-01-15*
