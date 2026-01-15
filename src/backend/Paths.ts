/**
 * Kingsman Store - Path Resolution
 * Handles path detection for global and workspace skills directories
 */

import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';

// ============================================
// PATH CONSTANTS
// ============================================

const GLOBAL_SKILLS_SUBPATH = '.gemini/antigravity/skills';
const KINGSMAN_DATA_SUBPATH = '.gemini/antigravity/.kingsman';
const WORKSPACE_SKILLS_SUBPATH = '.agent/skills';

// ============================================
// PATH RESOLUTION
// ============================================

/**
 * Get the global skills directory path
 * Default: %USERPROFILE%/.gemini/antigravity/skills/
 */
export function getGlobalSkillsPath(): string {
    // Check if overridden in settings
    const config = vscode.workspace.getConfiguration('kingsman');
    const customPath = config.get<string>('globalSkillsPath');

    if (customPath && fs.existsSync(customPath)) {
        return customPath;
    }

    // Default path
    return path.join(os.homedir(), GLOBAL_SKILLS_SUBPATH);
}

/**
 * Get the workspace skills directory path
 * Default: <workspace>/.agent/skills/
 */
export function getWorkspaceSkillsPath(): string | null {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        return null;
    }

    return path.join(workspaceFolders[0].uri.fsPath, WORKSPACE_SKILLS_SUBPATH);
}

/**
 * Get the Kingsman data directory path
 * Contains: staging/, registry.json, cache/, logs/
 */
export function getKingsmanDataPath(): string {
    return path.join(os.homedir(), KINGSMAN_DATA_SUBPATH);
}

/**
 * Get specific Kingsman subdirectory paths
 */
export function getStagingPath(): string {
    return path.join(getKingsmanDataPath(), 'staging');
}

export function getCachePath(): string {
    return path.join(getKingsmanDataPath(), 'cache');
}

export function getRegistryPath(): string {
    return path.join(getKingsmanDataPath(), 'registry.json');
}

export function getLogsPath(): string {
    return path.join(getKingsmanDataPath(), 'logs');
}

/**
 * Get bundled skills path (within extension)
 */
export function getBundledSkillsPath(extensionPath: string): string {
    return path.join(extensionPath, 'bundled-skills');
}

// ============================================
// DIRECTORY MANAGEMENT
// ============================================

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectory(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

/**
 * Ensure all required Kingsman directories exist
 */
export function ensureAllDirectories(): void {
    ensureDirectory(getGlobalSkillsPath());
    ensureDirectory(getKingsmanDataPath());
    ensureDirectory(getStagingPath());
    ensureDirectory(getCachePath());
    ensureDirectory(getLogsPath());
}

/**
 * Get the path for a specific skill in the global skills directory
 */
export function getSkillPath(skillName: string, target: 'global' | 'workspace' = 'global'): string | null {
    if (target === 'global') {
        return path.join(getGlobalSkillsPath(), skillName);
    } else {
        const workspacePath = getWorkspaceSkillsPath();
        return workspacePath ? path.join(workspacePath, skillName) : null;
    }
}

/**
 * Check if a skill is installed
 */
export function isSkillInstalled(skillName: string, target: 'global' | 'workspace' = 'global'): boolean {
    const skillPath = getSkillPath(skillName, target);
    return skillPath !== null && fs.existsSync(skillPath);
}

/**
 * Validate skill name format
 * Must be lowercase with hyphens, 1-64 characters
 */
export function isValidSkillName(name: string): boolean {
    return /^[a-z0-9][a-z0-9-]{0,63}$/.test(name);
}
