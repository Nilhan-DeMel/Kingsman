---
name: kingsman-inspector
description: Repository inspection, category classification, risk scanning, and conversion planning
---

# Kingsman Inspector

A backend skill for Kingsman that analyzes repositories for skill compatibility and safety.

## Purpose

Inspect any GitHub repository and:

- Classify as A (already skill), B (convertible), or C (not suitable)
- Generate confidence score and explanation
- Scan for security risks (binaries, scripts, suspicious patterns)
- Create conversion plan for Category B repos

## Usage

### CLI Interface

```bash
node index.js inspect --repo "owner/repo" --pat $GITHUB_PAT
```

### Input Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `--repo` | Yes | Repository in "owner/repo" format |
| `--pat` | No | GitHub Personal Access Token |

### Output (JSON to stdout)

```json
{
  "id": "owner/repo",
  "category": "A|B|C",
  "confidence": 85,
  "explanation": "Repository contains valid SKILL.md at root",
  "skills": [
    {"path": ".", "name": "skill-name", "description": "..."}
  ],
  "conversionPlan": {
    "proposedName": "converted-skill",
    "keep": ["src/", "README.md"],
    "ignore": ["tests/", ".github/"],
    "dependencies": ["node"],
    "skillMdProposal": "---\nname: ...\ndescription: ...\n---"
  },
  "riskReport": {
    "level": "low|medium|high",
    "binaries": ["path/to/file.exe"],
    "scripts": ["install.sh"],
    "suspiciousPatterns": [],
    "npmHooks": ["postinstall"]
  }
}
```

## Classification Rules

### Category A: Already a Skill

- SKILL.md exists at repo root
- OR SKILL.md exists in .agent/skills/, .claude/skills/, .github/skills/

### Category B: Convertible

- Has clear README with purpose
- Has permissive license or no license
- Contains code/scripts that could be wrapped
- Not binary-only

### Category C: Not Suitable

- Binary-only repository
- No clear purpose
- Highly specialized/complex with no documentation

## Risk Levels

- **Low**: No binaries, no dangerous scripts, no npm hooks
- **Medium**: Has scripts or npm hooks
- **High**: Binaries present, suspicious patterns, or dangerous commands

## Dependencies

- Node.js 18+
- GitHub API access
