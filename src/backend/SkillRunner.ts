/**
 * Kingsman Store - Skill Backend Runner
 * Spawns bundled skill CLIs and parses JSON output
 */

import * as path from 'path';
import * as vscode from 'vscode';
import { spawn } from 'child_process';
import { getGlobalSkillsPath, ensureAllDirectories } from './Paths';
import type { SearchResponse, InspectionResult, StageResponse, InstallResponse, ListResponse, UninstallResponse } from '../types/contracts';

// ============================================
// SKILL NAMES
// ============================================

const SKILLS = {
    search: 'kingsman-search',
    inspector: 'kingsman-inspector',
    installer: 'kingsman-installer'
} as const;

type SkillName = typeof SKILLS[keyof typeof SKILLS];

// ============================================
// SKILL RUNNER
// ============================================

interface RunOptions {
    timeout?: number;  // milliseconds
}

/**
 * Run a skill CLI and return parsed JSON output
 */
export async function runSkill<T>(
    skillName: SkillName,
    args: string[],
    options: RunOptions = {}
): Promise<T> {
    const skillPath = path.join(getGlobalSkillsPath(), skillName, 'index.js');
    const timeout = options.timeout || 60000;

    return new Promise((resolve, reject) => {
        const child = spawn('node', [skillPath, ...args], {
            cwd: path.dirname(skillPath),
            timeout,
            env: { ...process.env }
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });

        child.on('error', (error) => {
            reject(new Error(`Failed to run ${skillName}: ${error.message}`));
        });

        child.on('close', (code) => {
            // Try to parse stdout first (success case)
            if (stdout.trim()) {
                try {
                    const result = JSON.parse(stdout);
                    resolve(result);
                    return;
                } catch (e) {
                    // Continue to error handling
                }
            }

            // Try to parse stderr (error case)
            if (stderr.trim()) {
                try {
                    const errorResult = JSON.parse(stderr);
                    if (errorResult.error) {
                        reject(new Error(errorResult.error));
                        return;
                    }
                } catch (e) {
                    // Not JSON error
                }
            }

            if (code !== 0) {
                reject(new Error(`${skillName} exited with code ${code}: ${stderr || stdout}`));
            } else {
                reject(new Error(`${skillName} produced no valid output`));
            }
        });
    });
}

// ============================================
// TYPED SKILL METHODS
// ============================================

/**
 * Search for skills
 */
export async function search(
    query: string,
    pat?: string,
    cacheDir?: string
): Promise<SearchResponse> {
    const args = ['search', '--query', query];
    if (pat) args.push('--pat', pat);
    if (cacheDir) args.push('--cache-dir', cacheDir);

    return runSkill<SearchResponse>(SKILLS.search, args);
}

/**
 * Inspect a repository
 */
export async function inspect(
    repo: string,
    pat?: string
): Promise<InspectionResult> {
    const args = ['inspect', '--repo', repo];
    if (pat) args.push('--pat', pat);

    return runSkill<InspectionResult>(SKILLS.inspector, args);
}

/**
 * Stage a repository for installation
 */
export async function stage(
    repo: string,
    stagingDir: string,
    pat?: string
): Promise<StageResponse> {
    const args = ['stage', '--repo', repo, '--staging-dir', stagingDir];
    if (pat) args.push('--pat', pat);

    return runSkill<StageResponse>(SKILLS.installer, args, { timeout: 120000 });
}

/**
 * Install a staged skill
 */
export async function install(
    stagedId: string,
    stagingDir: string,
    skillsDir: string,
    registryPath: string,
    conversionPlan?: string
): Promise<InstallResponse> {
    const args = [
        'install',
        '--staged-id', stagedId,
        '--staging-dir', stagingDir,
        '--skills-dir', skillsDir,
        '--registry-path', registryPath
    ];
    if (conversionPlan) args.push('--conversion-plan', conversionPlan);

    return runSkill<InstallResponse>(SKILLS.installer, args);
}

/**
 * List installed skills
 */
export async function listInstalled(registryPath: string): Promise<ListResponse> {
    return runSkill<ListResponse>(SKILLS.installer, ['list', '--registry-path', registryPath]);
}

/**
 * Uninstall a skill
 */
export async function uninstall(
    skillName: string,
    skillsDir: string,
    registryPath: string
): Promise<UninstallResponse> {
    const args = [
        'uninstall',
        '--name', skillName,
        '--skills-dir', skillsDir,
        '--registry-path', registryPath
    ];

    return runSkill<UninstallResponse>(SKILLS.installer, args);
}

/**
 * Check if all required skills are installed
 */
export function areSkillsInstalled(): boolean {
    const globalPath = getGlobalSkillsPath();

    for (const skill of Object.values(SKILLS)) {
        const skillPath = path.join(globalPath, skill, 'index.js');
        try {
            require('fs').accessSync(skillPath);
        } catch {
            return false;
        }
    }

    return true;
}
