# Changelog

All notable changes to the Kingsman extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
