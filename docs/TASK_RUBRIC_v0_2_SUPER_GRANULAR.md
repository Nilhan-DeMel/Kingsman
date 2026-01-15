# Kingsman v0.2.x - Super Granular Task Rubric

## Task Index

| Phase | Tasks | Description |
|-------|-------|-------------|
| 0 | T001-T005 | Setup & Foundation |
| 1 | T010-T019 | Bundled Skills Structure |
| 2 | T020-T029 | kingsman-search Skill |
| 3 | T030-T039 | kingsman-inspector Skill |
| 4 | T040-T049 | kingsman-installer Skill |
| 5 | T050-T059 | Extension Commands |
| 6 | T060-T079 | Webview Store |
| 7 | T080-T089 | Integration & Polish |
| 8 | T090-T099 | Documentation & Release |

---

## Phase 0: Setup & Foundation

### T001: Create Feature Branch

| Field | Value |
|-------|-------|
| Goal | Create feature branch for v0.2.x development |
| Files | N/A |
| Steps | `git checkout -b feature/kingsman-skill-store-v0.2` |
| Acceptance | Branch exists, clean working tree |
| Evidence | `git branch --show-current` |
| Risk | Low |
| Rollback | `git checkout main && git branch -D feature/...` |

### T002: Create Directory Structure

| Field | Value |
|-------|-------|
| Goal | Create all required source directories |
| Files | `src/store/`, `src/commands/`, `src/backend/`, `src/secrets/`, `src/types/`, `bundled-skills/` |
| Steps | Create directories with proper nesting |
| Acceptance | All directories exist |
| Evidence | `dir` listing |
| Risk | Low |
| Rollback | Delete created directories |

### T003: Update package.json for v0.2.0

| Field | Value |
|-------|-------|
| Goal | Bump version, add new commands, update metadata |
| Files | `package.json` |
| Steps | Update version, add 7 new commands to contributes, add dependencies |
| Acceptance | Valid JSON, npm validates successfully |
| Evidence | `npm run compile` succeeds |
| Risk | Medium (breaking changes) |
| Rollback | Git revert |

### T004: Create TypeScript Types (contracts.ts)

| Field | Value |
|-------|-------|
| Goal | Define shared TypeScript interfaces for JSON contracts |
| Files | `src/types/contracts.ts` |
| Steps | Define SearchResult, InspectionResult, RiskReport, RegistryEntry interfaces |
| Acceptance | Compiles without errors |
| Evidence | `tsc` succeeds |
| Risk | Low |
| Rollback | Delete file |

### T005: Create Paths.ts

| Field | Value |
|-------|-------|
| Goal | Implement path resolution for global/workspace skills |
| Files | `src/backend/Paths.ts` |
| Steps | Implement getGlobalSkillsPath, getWorkspaceSkillsPath, getKingsmanDataPath, ensureDirectories |
| Acceptance | Paths resolve correctly on Windows |
| Evidence | Unit test or manual verification |
| Risk | Medium (platform-specific) |
| Rollback | Delete file |

---

## Phase 1: Bundled Skills Structure

### T010: Create kingsman-search SKILL.md

| Field | Value |
|-------|-------|
| Goal | Create skill manifest for search backend |
| Files | `bundled-skills/kingsman-search/SKILL.md` |
| Steps | Write YAML frontmatter + markdown body |
| Acceptance | Valid SKILL.md format, name matches folder |
| Evidence | File exists with correct frontmatter |
| Risk | Low |
| Rollback | Delete file |

### T011: Create kingsman-search package.json

| Field | Value |
|-------|-------|
| Goal | Node package manifest for search skill |
| Files | `bundled-skills/kingsman-search/package.json` |
| Steps | Define name, version, main, dependencies (node-fetch if needed) |
| Acceptance | Valid JSON, npm install works |
| Evidence | `npm install` in skill folder |
| Risk | Low |
| Rollback | Delete file |

### T012: Create kingsman-inspector SKILL.md

| Field | Value |
|-------|-------|
| Goal | Create skill manifest for inspector backend |
| Files | `bundled-skills/kingsman-inspector/SKILL.md` |
| Steps | Write YAML frontmatter + markdown body |
| Acceptance | Valid SKILL.md format |
| Evidence | File exists |
| Risk | Low |
| Rollback | Delete file |

### T013: Create kingsman-inspector package.json

| Field | Value |
|-------|-------|
| Goal | Node package manifest for inspector skill |
| Files | `bundled-skills/kingsman-inspector/package.json` |
| Steps | Define package metadata and dependencies |
| Acceptance | Valid JSON |
| Evidence | File exists |
| Risk | Low |
| Rollback | Delete file |

### T014: Create kingsman-installer SKILL.md

| Field | Value |
|-------|-------|
| Goal | Create skill manifest for installer backend |
| Files | `bundled-skills/kingsman-installer/SKILL.md` |
| Steps | Write YAML frontmatter + markdown body |
| Acceptance | Valid SKILL.md format |
| Evidence | File exists |
| Risk | Low |
| Rollback | Delete file |

### T015: Create kingsman-installer package.json

| Field | Value |
|-------|-------|
| Goal | Node package manifest for installer skill |
| Files | `bundled-skills/kingsman-installer/package.json` |
| Steps | Define package metadata |
| Acceptance | Valid JSON |
| Evidence | File exists |
| Risk | Low |
| Rollback | Delete file |

---

## Phase 2: kingsman-search Skill

### T020: Implement query expansion

| Field | Value |
|-------|-------|
| Goal | Expand NL queries into search terms |
| Files | `bundled-skills/kingsman-search/index.js` |
| Steps | Create expandQuery function with term mappings |
| Acceptance | "text to speech" → ["tts", "text-to-speech", ...] |
| Evidence | Test output |
| Risk | Low |
| Rollback | Revert function |

### T021: Implement GitHub code search

| Field | Value |
|-------|-------|
| Goal | Search for SKILL.md files via GitHub API |
| Files | `bundled-skills/kingsman-search/index.js` |
| Steps | Call /search/code with filename:SKILL.md |
| Acceptance | Returns results with file matches |
| Evidence | API response |
| Risk | Medium (rate limits) |
| Rollback | N/A |

### T022: Implement GitHub repo search

| Field | Value |
|-------|-------|
| Goal | Search repositories via GitHub API |
| Files | `bundled-skills/kingsman-search/index.js` |
| Steps | Call /search/repositories with topic filters |
| Acceptance | Returns repo list |
| Evidence | API response |
| Risk | Medium (rate limits) |
| Rollback | N/A |

### T023: Implement result ranking

| Field | Value |
|-------|-------|
| Goal | Score and rank search results |
| Files | `bundled-skills/kingsman-search/index.js` |
| Steps | Boost skill-first, factor stars/forks/recency |
| Acceptance | Results sorted by score |
| Evidence | Sorted output |
| Risk | Low |
| Rollback | N/A |

### T024: Implement caching

| Field | Value |
|-------|-------|
| Goal | Cache search results for 10 minutes |
| Files | `bundled-skills/kingsman-search/index.js` |
| Steps | File-based cache with TTL |
| Acceptance | Repeated queries return cached results |
| Evidence | cached: true in output |
| Risk | Low |
| Rollback | Disable caching |

### T025: Implement CLI interface

| Field | Value |
|-------|-------|
| Goal | Parse CLI args and output JSON |
| Files | `bundled-skills/kingsman-search/index.js` |
| Steps | Parse --query, --pat, --cache-dir args |
| Acceptance | Valid JSON output to stdout |
| Evidence | Run CLI manually |
| Risk | Low |
| Rollback | N/A |

---

## Phase 3: kingsman-inspector Skill

### T030: Implement repo metadata fetch

| Field | Value |
|-------|-------|
| Goal | Fetch repository info from GitHub |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | GET /repos/:owner/:repo |
| Acceptance | Returns repo metadata |
| Evidence | API response |
| Risk | Low |
| Rollback | N/A |

### T031: Implement file tree fetch

| Field | Value |
|-------|-------|
| Goal | Get repository file listing |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | GET /repos/:owner/:repo/git/trees/:branch?recursive=1 |
| Acceptance | Returns file paths |
| Evidence | Tree output |
| Risk | Low |
| Rollback | N/A |

### T032: Implement SKILL.md detection

| Field | Value |
|-------|-------|
| Goal | Find SKILL.md files in repo |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | Search for SKILL.md at root and common paths |
| Acceptance | Returns list of skill paths |
| Evidence | Detected paths |
| Risk | Low |
| Rollback | N/A |

### T033: Implement category classification

| Field | Value |
|-------|-------|
| Goal | Classify as A/B/C with confidence |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | A if SKILL.md exists, B if convertible, C otherwise |
| Acceptance | Returns category + confidence |
| Evidence | Classification output |
| Risk | Low |
| Rollback | N/A |

### T034: Implement binary detection

| Field | Value |
|-------|-------|
| Goal | Find binary files in repo |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | Match *.exe,*.dll, *.so, etc. |
| Acceptance | Returns binaries list |
| Evidence | Risk report |
| Risk | Low |
| Rollback | N/A |

### T035: Implement script detection

| Field | Value |
|-------|-------|
| Goal | Find shell scripts in repo |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | Match *.sh,*.ps1, *.bat files |
| Acceptance | Returns scripts list |
| Evidence | Risk report |
| Risk | Low |
| Rollback | N/A |

### T036: Implement suspicious pattern scan

| Field | Value |
|-------|-------|
| Goal | Detect dangerous command patterns |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | Regex for curl|bash, wget|sh, etc. |
| Acceptance | Returns pattern matches |
| Evidence | Risk report |
| Risk | Low |
| Rollback | N/A |

### T037: Implement conversion plan generator

| Field | Value |
|-------|-------|
| Goal | Generate SKILL.md proposal for Category B |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | Create keep/ignore lists, generate frontmatter |
| Acceptance | Returns proposedName + skillMdProposal |
| Evidence | Conversion plan JSON |
| Risk | Low |
| Rollback | N/A |

### T038: Implement CLI interface

| Field | Value |
|-------|-------|
| Goal | CLI for inspector skill |
| Files | `bundled-skills/kingsman-inspector/index.js` |
| Steps | Parse --repo, --pat args |
| Acceptance | Valid JSON output |
| Evidence | CLI execution |
| Risk | Low |
| Rollback | N/A |

---

## Phase 4: kingsman-installer Skill

### T040: Implement repo download

| Field | Value |
|-------|-------|
| Goal | Download repo as zip |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Download from GitHub archive URL |
| Acceptance | Zip file in staging/ |
| Evidence | File exists |
| Risk | Medium |
| Rollback | Delete staging |

### T041: Implement zip extraction

| Field | Value |
|-------|-------|
| Goal | Extract downloaded zip |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Use Node's zlib/tar or simple extraction |
| Acceptance | Files extracted |
| Evidence | Directory listing |
| Risk | Low |
| Rollback | Delete extracted |

### T042: Implement skill normalization

| Field | Value |
|-------|-------|
| Goal | Normalize folder name to match skill name |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Rename folder per SKILL.md name field |
| Acceptance | Folder matches name |
| Evidence | Directory name |
| Risk | Low |
| Rollback | N/A |

### T043: Implement conversion for Category B

| Field | Value |
|-------|-------|
| Goal | Generate SKILL.md for convertible repos |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Write SKILL.md from plan |
| Acceptance | Valid SKILL.md created |
| Evidence | File content |
| Risk | Medium |
| Rollback | Delete generated |

### T044: Implement install to global

| Field | Value |
|-------|-------|
| Goal | Copy skill to global skills folder |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Copy from staging to global path |
| Acceptance | Skill folder exists in global |
| Evidence | Directory listing |
| Risk | Medium |
| Rollback | Delete installed |

### T045: Implement registry update

| Field | Value |
|-------|-------|
| Goal | Add entry to registry.json |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Read/write JSON with new entry |
| Acceptance | Entry in registry |
| Evidence | registry.json content |
| Risk | Low |
| Rollback | Remove entry |

### T046: Implement uninstall

| Field | Value |
|-------|-------|
| Goal | Remove installed skill |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Delete folder + remove registry entry |
| Acceptance | Skill removed |
| Evidence | Folder gone, registry updated |
| Risk | Medium |
| Rollback | N/A (data loss) |

### T047: Implement list installed

| Field | Value |
|-------|-------|
| Goal | List all installed skills |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Read registry.json |
| Acceptance | Returns array of skills |
| Evidence | JSON output |
| Risk | Low |
| Rollback | N/A |

### T048: Implement CLI interface

| Field | Value |
|-------|-------|
| Goal | CLI for installer skill |
| Files | `bundled-skills/kingsman-installer/index.js` |
| Steps | Parse stage/install/uninstall/list commands |
| Acceptance | Valid JSON output |
| Evidence | CLI execution |
| Risk | Low |
| Rollback | N/A |

---

## Phase 5: Extension Commands

### T050: Create SkillRunner.ts

| Field | Value |
|-------|-------|
| Goal | Spawn skill CLIs and parse JSON output |
| Files | `src/backend/SkillRunner.ts` |
| Steps | Implement runSkill(skillName, args) |
| Acceptance | Returns parsed JSON |
| Evidence | Test call |
| Risk | Medium |
| Rollback | Delete file |

### T051: Create Bootstrap.ts

| Field | Value |
|-------|-------|
| Goal | Copy bundled skills to global on first run |
| Files | `src/backend/Bootstrap.ts` |
| Steps | Check if skills exist, copy if missing |
| Acceptance | Skills in global folder |
| Evidence | Directory listing |
| Risk | Medium |
| Rollback | Delete copied |

### T052: Create GitHubAuth.ts

| Field | Value |
|-------|-------|
| Goal | Manage PAT via SecretStorage |
| Files | `src/secrets/GitHubAuth.ts` |
| Steps | Implement store/get/delete PAT |
| Acceptance | PAT stored securely |
| Evidence | get returns stored value |
| Risk | Low |
| Rollback | Delete secret |

### T053: Implement kingsman.store.search command

| Field | Value |
|-------|-------|
| Goal | Register search command |
| Files | `src/commands/search.ts` |
| Steps | Call kingsman-search via SkillRunner |
| Acceptance | Returns search results |
| Evidence | Command execution |
| Risk | Low |
| Rollback | Unregister command |

### T054: Implement kingsman.store.inspect command

| Field | Value |
|-------|-------|
| Goal | Register inspect command |
| Files | `src/commands/inspect.ts` |
| Steps | Call kingsman-inspector via SkillRunner |
| Acceptance | Returns inspection result |
| Evidence | Command execution |
| Risk | Low |
| Rollback | Unregister command |

### T055: Implement kingsman.store.stage command

| Field | Value |
|-------|-------|
| Goal | Register stage command |
| Files | `src/commands/stage.ts` |
| Steps | Call kingsman-installer stage via SkillRunner |
| Acceptance | Returns staged path |
| Evidence | Command execution |
| Risk | Medium |
| Rollback | Delete staged |

### T056: Implement kingsman.store.install command

| Field | Value |
|-------|-------|
| Goal | Register install command |
| Files | `src/commands/install.ts` |
| Steps | Call kingsman-installer install via SkillRunner |
| Acceptance | Skill installed |
| Evidence | Directory exists |
| Risk | Medium |
| Rollback | Uninstall |

### T057: Implement kingsman.store.listInstalled command

| Field | Value |
|-------|-------|
| Goal | Register list command |
| Files | `src/commands/list.ts` |
| Steps | Call kingsman-installer list via SkillRunner |
| Acceptance | Returns registry |
| Evidence | Command execution |
| Risk | Low |
| Rollback | N/A |

### T058: Implement kingsman.store.uninstall command

| Field | Value |
|-------|-------|
| Goal | Register uninstall command |
| Files | `src/commands/uninstall.ts` |
| Steps | Call kingsman-installer uninstall via SkillRunner |
| Acceptance | Skill removed |
| Evidence | Command execution |
| Risk | Medium |
| Rollback | N/A |

---

## Phase 6: Webview Store

### T060: Create StorePanel.ts skeleton

| Field | Value |
|-------|-------|
| Goal | Webview panel controller |
| Files | `src/store/StorePanel.ts` |
| Steps | Create/reveal panel, set HTML |
| Acceptance | Panel opens |
| Evidence | Visual |
| Risk | Low |
| Rollback | Delete file |

### T061: Create webview HTML template

| Field | Value |
|-------|-------|
| Goal | Store UI structure |
| Files | `src/store/webview/index.html` |
| Steps | Create search bar, results area, installed tab |
| Acceptance | Valid HTML |
| Evidence | Panel displays |
| Risk | Low |
| Rollback | Delete file |

### T062: Create webview CSS (themeable)

| Field | Value |
|-------|-------|
| Goal | Style store UI |
| Files | `src/store/webview/store.css` |
| Steps | Use VS Code CSS variables |
| Acceptance | Matches IDE theme |
| Evidence | Visual |
| Risk | Low |
| Rollback | Delete file |

### T063: Create webview JS (message passing)

| Field | Value |
|-------|-------|
| Goal | UI logic |
| Files | `src/store/webview/store.js` |
| Steps | Handle search, display results, trigger commands |
| Acceptance | Interactive UI |
| Evidence | Click actions work |
| Risk | Medium |
| Rollback | Delete file |

### T064: Implement CSP

| Field | Value |
|-------|-------|
| Goal | Content Security Policy |
| Files | `src/store/StorePanel.ts` |
| Steps | Set strict CSP meta tag |
| Acceptance | No console CSP errors |
| Evidence | DevTools |
| Risk | Low |
| Rollback | Weaken CSP |

### T065: Implement search UI

| Field | Value |
|-------|-------|
| Goal | Search bar with filters |
| Files | `src/store/webview/store.js` |
| Steps | Wire input to postMessage |
| Acceptance | Search triggers |
| Evidence | Results appear |
| Risk | Low |
| Rollback | N/A |

### T066: Implement results display

| Field | Value |
|-------|-------|
| Goal | Show result cards |
| Files | `src/store/webview/store.js` |
| Steps | Render cards dynamically |
| Acceptance | Cards display |
| Evidence | Visual |
| Risk | Low |
| Rollback | N/A |

### T067: Implement quick check button

| Field | Value |
|-------|-------|
| Goal | Trigger inspection inline |
| Files | `src/store/webview/store.js` |
| Steps | Call inspect, update card |
| Acceptance | Category badge appears |
| Evidence | Visual |
| Risk | Low |
| Rollback | N/A |

### T068: Implement inspect panel

| Field | Value |
|-------|-------|
| Goal | Show detailed inspection |
| Files | `src/store/webview/store.js` |
| Steps | Slide-out or modal panel |
| Acceptance | Details visible |
| Evidence | Visual |
| Risk | Low |
| Rollback | N/A |

### T069: Implement stage button

| Field | Value |
|-------|-------|
| Goal | Trigger staging |
| Files | `src/store/webview/store.js` |
| Steps | Call stage, show progress |
| Acceptance | Staged status |
| Evidence | UI update |
| Risk | Medium |
| Rollback | Delete staged |

### T070: Implement approve & install UI

| Field | Value |
|-------|-------|
| Goal | Confirm before install |
| Files | `src/store/webview/store.js` |
| Steps | Show risk report, require click |
| Acceptance | Install only after approval |
| Evidence | User interaction |
| Risk | CRITICAL |
| Rollback | N/A |

### T071: Implement installed tab

| Field | Value |
|-------|-------|
| Goal | Show installed skills |
| Files | `src/store/webview/store.js` |
| Steps | Fetch registry, display list |
| Acceptance | Skills listed |
| Evidence | Visual |
| Risk | Low |
| Rollback | N/A |

### T072: Implement PAT input UI

| Field | Value |
|-------|-------|
| Goal | Allow user to set PAT |
| Files | `src/store/webview/store.js` |
| Steps | Settings section with input |
| Acceptance | PAT stored |
| Evidence | API calls work |
| Risk | Low |
| Rollback | N/A |

---

## Phase 7: Integration & Polish

### T080: Wire webview to commands

| Field | Value |
|-------|-------|
| Goal | Message passing to command APIs |
| Files | `src/store/StorePanel.ts` |
| Steps | Handle message types |
| Acceptance | Commands execute |
| Evidence | Results flow |
| Risk | Medium |
| Rollback | N/A |

### T081: Add loading states

| Field | Value |
|-------|-------|
| Goal | Show progress indicators |
| Files | `src/store/webview/store.js` |
| Steps | Spinners/skeletons |
| Acceptance | No frozen UI |
| Evidence | Visual |
| Risk | Low |
| Rollback | N/A |

### T082: Add error handling

| Field | Value |
|-------|-------|
| Goal | Show errors gracefully |
| Files | Various |
| Steps | Try/catch, error messages |
| Acceptance | No crashes |
| Evidence | Error displays |
| Risk | Medium |
| Rollback | N/A |

### T083: Add rate limit display

| Field | Value |
|-------|-------|
| Goal | Show remaining API calls |
| Files | `src/store/webview/store.js` |
| Steps | Display from search response |
| Acceptance | Badge updates |
| Evidence | Visual |
| Risk | Low |
| Rollback | N/A |

---

## Phase 8: Documentation & Release

### T090: Update package.json version

| Field | Value |
|-------|-------|
| Goal | Bump to v0.2.0 |
| Files | `package.json` |
| Steps | Change version field |
| Acceptance | Valid version |
| Evidence | npm validates |
| Risk | Low |
| Rollback | Revert |

### T091: Update CHANGELOG.md

| Field | Value |
|-------|-------|
| Goal | Document v0.2.0 changes |
| Files | `CHANGELOG.md` |
| Steps | Add entry |
| Acceptance | Entry exists |
| Evidence | File content |
| Risk | Low |
| Rollback | Revert |

### T092: Update README.md

| Field | Value |
|-------|-------|
| Goal | Document Skill Store |
| Files | `README.md` |
| Steps | Add usage section |
| Acceptance | Instructions clear |
| Evidence | Review |
| Risk | Low |
| Rollback | Revert |

### T093: Update INSTALL_ANTIGRAVITY.md

| Field | Value |
|-------|-------|
| Goal | Add store install guide |
| Files | `INSTALL_ANTIGRAVITY.md` |
| Steps | Add step-by-step |
| Acceptance | Guide complete |
| Evidence | Review |
| Risk | Low |
| Rollback | Revert |

### T094: Commit all changes

| Field | Value |
|-------|-------|
| Goal | Clean commit history |
| Files | All |
| Steps | Logical commits |
| Acceptance | History readable |
| Evidence | git log |
| Risk | Low |
| Rollback | Reset |

### T095: Merge to main

| Field | Value |
|-------|-------|
| Goal | Merge feature branch |
| Files | All |
| Steps | git merge |
| Acceptance | Clean merge |
| Evidence | git log |
| Risk | Medium |
| Rollback | Revert merge |

### T096: Build VSIX

| Field | Value |
|-------|-------|
| Goal | Create distributable |
| Files | `kingsman-0.2.0.vsix` |
| Steps | npm run package |
| Acceptance | VSIX created |
| Evidence | File exists |
| Risk | Low |
| Rollback | N/A |

### T097: Create GitHub release

| Field | Value |
|-------|-------|
| Goal | Publish release |
| Files | N/A |
| Steps | gh release create |
| Acceptance | Release exists |
| Evidence | GitHub URL |
| Risk | Low |
| Rollback | Delete release |

### T098: Publish to Open VSX

| Field | Value |
|-------|-------|
| Goal | Extension available |
| Files | N/A |
| Steps | npx ovsx publish |
| Acceptance | Listing updated |
| Evidence | API response |
| Risk | Low |
| Rollback | N/A |

### T099: Create WALKTHROUGH.md

| Field | Value |
|-------|-------|
| Goal | Document completion |
| Files | `docs/WALKTHROUGH.md` |
| Steps | Evidence collection |
| Acceptance | Complete |
| Evidence | File |
| Risk | Low |
| Rollback | N/A |
