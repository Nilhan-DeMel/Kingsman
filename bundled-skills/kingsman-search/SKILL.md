---
name: kingsman-search
description: Multi-source skill discovery with natural language search and GitHub integration
---

# Kingsman Search

A backend skill for Kingsman that provides multi-source discovery of agent skills.

## Purpose

Search for agent skills across:

- GitHub repositories with SKILL.md files
- GitHub repositories tagged with agent-skills
- General repositories that could be converted to skills

## Usage

### CLI Interface

```bash
node index.js search --query "text to speech" --pat $GITHUB_PAT --cache-dir /path/to/cache
```

### Input Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--query` | Yes | Natural language search query |
| `--pat` | No | GitHub Personal Access Token (improves rate limits) |
| `--cache-dir` | No | Directory for caching results (default: ./cache) |

### Output (JSON to stdout)

```json
{
  "results": [
    {
      "id": "owner/repo",
      "name": "repo-name",
      "owner": "owner",
      "description": "Repository description",
      "stars": 123,
      "forks": 45,
      "lastUpdated": "2026-01-15T00:00:00Z",
      "license": "MIT",
      "hasSkillMd": true,
      "skillPaths": ["path/to/skill"],
      "source": "github-code-search",
      "score": 0.92
    }
  ],
  "rateLimitRemaining": 28,
  "cached": false
}
```

## Features

- **Natural Language Expansion**: Expands common terms (e.g., "text to speech" → "tts OR text-to-speech")
- **Multi-Source Search**: Combines GitHub code search and repository search
- **Smart Ranking**: Prioritizes skill-ready repos, then by stars/recency
- **Caching**: 10-minute cache to reduce API calls
- **Rate Limit Aware**: Reports remaining quota

## Dependencies

- Node.js 18+
- GitHub API access (optional PAT for higher limits)
