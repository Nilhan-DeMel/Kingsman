# Changelog

All notable changes to the Kingsman extension will be documented in this file.

## [0.2.1] - 2026-01-15

### Security

- Agent `store.install` command now requires explicit user confirmation modal
- Added `escapeHtml` sanitization for all user-provided data in search results
- Fixed potential XSS via repository descriptions

### Changed

- Clarified UI: HuggingFace support planned for v0.3 (not currently implemented)
- Search placeholder and loading text updated to reflect GitHub-only source

## [0.2.0] - 2026-01-15

### Added

- **Skill Store** - IDE-native skill discovery, inspection, and installation
  - `Kingsman: Skill Store` command opens store webview
  - Natural language search for skills on GitHub
  - Quick Check for category classification (A/B/C)
  - Risk scanning (binaries, scripts, suspicious patterns)
  - Stage & Install workflow with explicit approval
  - Installed skills management
  - GitHub PAT support for improved rate limits

- **Agent API Commands**
  - `kingsman.store.search` - Search for skills (returns JSON)
  - `kingsman.store.inspect` - Inspect a repository
  - `kingsman.store.stage` - Stage for installation
  - `kingsman.store.install` - Install staged skill
  - `kingsman.store.listInstalled` - List installed skills
  - `kingsman.store.uninstall` - Remove a skill

- **Bundled Backend Skills**
  - `kingsman-search` - Multi-source discovery
  - `kingsman-inspector` - Classification and risk analysis
  - `kingsman-installer` - Installation and registry

### Changed

- Description updated to reflect Skill Store functionality
- Keywords updated for discoverability

## [0.1.2] - 2026-01-15

### Added

- **Agent Skill Bridge** - Programmatic access for AI agents
- New commands for agents (no UI prompts):
  - `kingsman.googleSearchUrl` - Returns URL only
  - `kingsman.googleSearchWriteArtifact` - Returns URL + writes artifact
  - `kingsman.googleSearchOpenAndWrite` - Opens browser + writes artifact
- MCP skill server (`skills/kingsman-mcp/`) for Model Context Protocol agents
- Artifact file output at `.kingsman/skills/google_search/latest.json`
- `SKILLS.md` documentation for agent integration
- Dedicated OutputChannel logging for agents

## [0.1.1] - 2026-01-15

### Changed

- Published to Open VSX marketplace for Antigravity IDE installation
- Added extension icon
- Updated metadata for marketplace compatibility

## [0.1.0] - 2026-01-14

### Added

- Initial release of Kingsman extension
- **Kingsman: Google Search** command - opens Google Search in default browser
- Configurable search base URL via `kingsman.searchBaseUrl` setting
- Input validation for search queries
- Console logging of search URLs for debugging
