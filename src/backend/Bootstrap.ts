/**
 * Kingsman Store - Bootstrap
 * Copies bundled skills to global skills folder on first run
 */

import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { getGlobalSkillsPath, ensureDirectory, getBundledSkillsPath } from './Paths';

// ============================================
// BUNDLED SKILLS
// ============================================

const BUNDLED_SKILLS = [
    'kingsman-search',
    'kingsman-inspector',
    'kingsman-installer'
];

// ============================================
// BOOTSTRAP FUNCTIONS
// ============================================

/**
 * Copy a directory recursively
 */
function copyDirRecursive(src: string, dest: string): void {
    ensureDirectory(dest);

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Check if a skill needs to be installed or updated
 */
function needsInstall(skillName: string, bundledPath: string, globalPath: string): boolean {
    const destPath = path.join(globalPath, skillName);

    // If destination doesn't exist, needs install
    if (!fs.existsSync(destPath)) {
        return true;
    }

    // Check version comparison
    try {
        const bundledPkg = JSON.parse(
            fs.readFileSync(path.join(bundledPath, skillName, 'package.json'), 'utf8')
        );
        const installedPkg = JSON.parse(
            fs.readFileSync(path.join(destPath, 'package.json'), 'utf8')
        );

        // Simple version comparison (bundled is newer if different)
        if (bundledPkg.version !== installedPkg.version) {
            return true;
        }
    } catch {
        // If we can't read packages, assume needs install
        return true;
    }

    return false;
}

/**
 * Bootstrap all bundled skills to global skills folder
 * Returns list of skills that were installed/updated
 */
export async function bootstrapSkills(extensionPath: string): Promise<string[]> {
    const bundledPath = getBundledSkillsPath(extensionPath);
    const globalPath = getGlobalSkillsPath();

    // Ensure global skills directory exists
    ensureDirectory(globalPath);

    const installed: string[] = [];

    for (const skillName of BUNDLED_SKILLS) {
        const srcPath = path.join(bundledPath, skillName);

        // Check if bundled skill exists
        if (!fs.existsSync(srcPath)) {
            console.warn(`[Kingsman] Bundled skill not found: ${skillName}`);
            continue;
        }

        // Check if needs install
        if (needsInstall(skillName, bundledPath, globalPath)) {
            const destPath = path.join(globalPath, skillName);

            // Remove existing if present
            if (fs.existsSync(destPath)) {
                fs.rmSync(destPath, { recursive: true, force: true });
            }

            // Copy skill
            copyDirRecursive(srcPath, destPath);
            installed.push(skillName);

            console.log(`[Kingsman] Installed skill: ${skillName}`);
        }
    }

    return installed;
}

/**
 * Check if bootstrap is needed
 */
export function needsBootstrap(extensionPath: string): boolean {
    const bundledPath = getBundledSkillsPath(extensionPath);
    const globalPath = getGlobalSkillsPath();

    for (const skillName of BUNDLED_SKILLS) {
        if (needsInstall(skillName, bundledPath, globalPath)) {
            return true;
        }
    }

    return false;
}

/**
 * Show bootstrap notification to user
 */
export async function promptBootstrap(extensionPath: string): Promise<boolean> {
    if (!needsBootstrap(extensionPath)) {
        return true; // Already bootstrapped
    }

    const response = await vscode.window.showInformationMessage(
        'Kingsman needs to install backend skills for the Skill Store. Install now?',
        'Install',
        'Later'
    );

    if (response === 'Install') {
        try {
            const installed = await bootstrapSkills(extensionPath);
            if (installed.length > 0) {
                vscode.window.showInformationMessage(
                    `Kingsman installed ${installed.length} backend skills.`
                );
            }
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(
                `Failed to install backend skills: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            return false;
        }
    }

    return false;
}
