---
name: kingsman-installer
description: Skill staging, installation, registry management, and uninstallation
---

# Kingsman Installer

A backend skill for Kingsman that handles the full skill installation lifecycle.

## Purpose

Manage skill installation:

- Stage repositories in quarantine area
- Normalize skill structure and generate SKILL.md
- Install to global or workspace skills folder
- Maintain registry of installed skills
- Handle updates and uninstallation

## Usage

### CLI Interface

```bash
# Stage a repository
node index.js stage --repo "owner/repo" --staging-dir /path --pat $PAT

# Install a staged skill
node index.js install --staged-id xxx --target global --skills-dir /path

# List installed skills
node index.js list --registry-path /path/registry.json

# Uninstall a skill
node index.js uninstall --name skill-name --skills-dir /path --registry-path /path/registry.json

# Cleanup staging
node index.js cleanup --staging-dir /path
```

### Commands

#### stage

Downloads repository to staging area without installing.

**Input**: `--repo`, `--staging-dir`, `--pat`
**Output**: `{ stagedId, path, skillName, ... }`

#### install

Copies staged skill to skills folder and updates registry.

**Input**: `--staged-id`, `--target`, `--skills-dir`, `--registry-path`
**Output**: `{ installed: true, skillPath, registryEntry }`

#### list

Lists all installed skills from registry.

**Input**: `--registry-path`
**Output**: `{ skills: [...] }`

#### uninstall

Removes skill folder and registry entry.

**Input**: `--name`, `--skills-dir`, `--registry-path`
**Output**: `{ uninstalled: true }`

## Safety Features

- Downloads to quarantine staging area first
- Does not execute any scripts during installation
- Creates MANUAL_REVIEW_REQUIRED.md for medium/high risk skills
- Preserves original source URL for auditing

## Dependencies

- Node.js 18+
- File system access to skills directories
