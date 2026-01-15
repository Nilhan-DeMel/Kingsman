#!/usr/bin/env node
/**
 * Kingsman Installer Skill
 * Skill staging, installation, registry, and uninstallation
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createUnzip } from 'zlib';

// ============================================
// CLI ARGUMENT PARSING
// ============================================
function parseArgs(args) {
    const result = { command: null };
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (['stage', 'install', 'list', 'uninstall', 'cleanup'].includes(arg)) {
            result.command = arg;
        } else if (arg === '--repo' && args[i + 1]) result.repo = args[++i];
        else if (arg === '--staged-id' && args[i + 1]) result.stagedId = args[++i];
        else if (arg === '--staging-dir' && args[i + 1]) result.stagingDir = args[++i];
        else if (arg === '--skills-dir' && args[i + 1]) result.skillsDir = args[++i];
        else if (arg === '--registry-path' && args[i + 1]) result.registryPath = args[++i];
        else if (arg === '--target' && args[i + 1]) result.target = args[++i];
        else if (arg === '--name' && args[i + 1]) result.name = args[++i];
        else if (arg === '--pat' && args[i + 1]) result.pat = args[++i];
        else if (arg === '--conversion-plan' && args[i + 1]) result.conversionPlan = args[++i];
    }
    return result;
}

// ============================================
// FILE UTILITIES
// ============================================
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function copyDirRecursive(src, dest) {
    ensureDir(dest);
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

function deleteDirRecursive(dir) {
    if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
    }
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ============================================
// REGISTRY
// ============================================
function loadRegistry(registryPath) {
    try {
        if (fs.existsSync(registryPath)) {
            return JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        }
    } catch (e) { /* ignore */ }
    return { skills: [] };
}

function saveRegistry(registryPath, registry) {
    ensureDir(path.dirname(registryPath));
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
}

// ============================================
// DOWNLOAD
// ============================================
function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = createWriteStream(destPath);

        const request = https.get(url, {
            headers: { 'User-Agent': 'Kingsman-Installer/0.1.0' }
        }, (response) => {
            // Handle redirects
            if (response.statusCode === 302 || response.statusCode === 301) {
                file.close();
                fs.unlinkSync(destPath);
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Download failed: ${response.statusCode}`));
                return;
            }

            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });

        request.on('error', (err) => {
            fs.unlinkSync(destPath);
            reject(err);
        });
    });
}

async function extractZip(zipPath, destDir) {
    // Simple extraction using tar command (works on Windows with Git Bash or WSL)
    // For pure Node, we'd need a zip library
    const { exec } = await import('child_process');

    return new Promise((resolve, reject) => {
        // Try PowerShell Expand-Archive
        const cmd = `powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`;
        exec(cmd, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// ============================================
// STAGE COMMAND
// ============================================
async function stageRepo(repo, stagingDir, pat) {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
        throw new Error('Invalid repo format. Use "owner/repo"');
    }

    ensureDir(stagingDir);

    const stagedId = generateId();
    const stageDir = path.join(stagingDir, stagedId);
    ensureDir(stageDir);

    // Download zip
    const zipUrl = `https://github.com/${owner}/${repoName}/archive/refs/heads/main.zip`;
    const zipPath = path.join(stageDir, 'repo.zip');

    try {
        await downloadFile(zipUrl, zipPath);
    } catch (e) {
        // Try master branch
        const masterUrl = `https://github.com/${owner}/${repoName}/archive/refs/heads/master.zip`;
        await downloadFile(masterUrl, zipPath);
    }

    // Extract
    await extractZip(zipPath, stageDir);

    // Find extracted folder (GitHub names it repo-branch)
    const entries = fs.readdirSync(stageDir);
    const extractedDir = entries.find(e =>
        e !== 'repo.zip' && fs.statSync(path.join(stageDir, e)).isDirectory()
    );

    if (!extractedDir) {
        throw new Error('Failed to find extracted directory');
    }

    const sourcePath = path.join(stageDir, extractedDir);

    // Check for existing SKILL.md
    const skillMdPath = path.join(sourcePath, 'SKILL.md');
    const hasSkillMd = fs.existsSync(skillMdPath);

    // Determine skill name
    let skillName = repoName.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 64);

    if (hasSkillMd) {
        const content = fs.readFileSync(skillMdPath, 'utf8');
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        if (nameMatch) {
            skillName = nameMatch[1].trim();
        }
    }

    // Clean up zip
    fs.unlinkSync(zipPath);

    // Write staging info
    const info = {
        stagedId,
        repo,
        skillName,
        sourcePath,
        hasSkillMd,
        stagedAt: new Date().toISOString()
    };
    fs.writeFileSync(path.join(stageDir, 'staging-info.json'), JSON.stringify(info, null, 2));

    return info;
}

// ============================================
// INSTALL COMMAND
// ============================================
async function installSkill(stagedId, stagingDir, skillsDir, registryPath, conversionPlanJson) {
    // Load staging info
    const stageDir = path.join(stagingDir, stagedId);
    const infoPath = path.join(stageDir, 'staging-info.json');

    if (!fs.existsSync(infoPath)) {
        throw new Error(`Staged skill not found: ${stagedId}`);
    }

    const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));

    // If no SKILL.md and we have a conversion plan, generate it
    if (!info.hasSkillMd && conversionPlanJson) {
        const plan = JSON.parse(conversionPlanJson);
        const skillMdContent = plan.skillMdProposal || `---
name: ${info.skillName}
description: Converted skill from ${info.repo}
---

# ${info.skillName}

Skill converted from GitHub repository.

## Source

${info.repo}
`;
        fs.writeFileSync(path.join(info.sourcePath, 'SKILL.md'), skillMdContent);
    }

    // Ensure skills directory exists
    ensureDir(skillsDir);

    // Destination path
    const destPath = path.join(skillsDir, info.skillName);

    // Check for existing
    if (fs.existsSync(destPath)) {
        // Remove existing for update
        deleteDirRecursive(destPath);
    }

    // Copy skill
    copyDirRecursive(info.sourcePath, destPath);

    // Update registry
    const registry = loadRegistry(registryPath);

    // Remove existing entry if updating
    registry.skills = registry.skills.filter(s => s.skillName !== info.skillName);

    const entry = {
        skillName: info.skillName,
        sourceUrl: `https://github.com/${info.repo}`,
        installedAt: new Date().toISOString(),
        installPath: destPath,
        stagedId
    };
    registry.skills.push(entry);

    saveRegistry(registryPath, registry);

    // Clean up staging
    deleteDirRecursive(stageDir);

    return {
        installed: true,
        skillName: info.skillName,
        skillPath: destPath,
        registryEntry: entry
    };
}

// ============================================
// LIST COMMAND
// ============================================
function listInstalled(registryPath) {
    const registry = loadRegistry(registryPath);

    // Verify each skill still exists
    const verified = registry.skills.filter(s => {
        if (s.installPath && fs.existsSync(s.installPath)) {
            return true;
        }
        return false;
    });

    return { skills: verified };
}

// ============================================
// UNINSTALL COMMAND
// ============================================
function uninstallSkill(skillName, skillsDir, registryPath) {
    const registry = loadRegistry(registryPath);

    const entry = registry.skills.find(s => s.skillName === skillName);
    if (!entry) {
        throw new Error(`Skill not found in registry: ${skillName}`);
    }

    // Remove directory
    const skillPath = entry.installPath || path.join(skillsDir, skillName);
    if (fs.existsSync(skillPath)) {
        deleteDirRecursive(skillPath);
    }

    // Update registry
    registry.skills = registry.skills.filter(s => s.skillName !== skillName);
    saveRegistry(registryPath, registry);

    return { uninstalled: true, skillName };
}

// ============================================
// CLEANUP COMMAND
// ============================================
function cleanupStaging(stagingDir) {
    if (fs.existsSync(stagingDir)) {
        const entries = fs.readdirSync(stagingDir);
        let cleaned = 0;

        for (const entry of entries) {
            const entryPath = path.join(stagingDir, entry);
            const infoPath = path.join(entryPath, 'staging-info.json');

            if (fs.existsSync(infoPath)) {
                const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
                const stagedTime = new Date(info.stagedAt).getTime();
                const age = (Date.now() - stagedTime) / 1000 / 60 / 60; // hours

                // Clean up if older than 24 hours
                if (age > 24) {
                    deleteDirRecursive(entryPath);
                    cleaned++;
                }
            }
        }

        return { cleaned };
    }
    return { cleaned: 0 };
}

// ============================================
// MAIN
// ============================================
async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.command) {
        console.error(JSON.stringify({ error: 'Missing command. Use: stage, install, list, uninstall, cleanup' }));
        process.exit(1);
    }

    try {
        let result;

        switch (args.command) {
            case 'stage':
                if (!args.repo || !args.stagingDir) {
                    throw new Error('Missing --repo or --staging-dir');
                }
                result = await stageRepo(args.repo, args.stagingDir, args.pat);
                break;

            case 'install':
                if (!args.stagedId || !args.stagingDir || !args.skillsDir || !args.registryPath) {
                    throw new Error('Missing required arguments for install');
                }
                result = await installSkill(
                    args.stagedId,
                    args.stagingDir,
                    args.skillsDir,
                    args.registryPath,
                    args.conversionPlan
                );
                break;

            case 'list':
                if (!args.registryPath) {
                    throw new Error('Missing --registry-path');
                }
                result = listInstalled(args.registryPath);
                break;

            case 'uninstall':
                if (!args.name || !args.skillsDir || !args.registryPath) {
                    throw new Error('Missing --name, --skills-dir, or --registry-path');
                }
                result = uninstallSkill(args.name, args.skillsDir, args.registryPath);
                break;

            case 'cleanup':
                if (!args.stagingDir) {
                    throw new Error('Missing --staging-dir');
                }
                result = cleanupStaging(args.stagingDir);
                break;

            default:
                throw new Error(`Unknown command: ${args.command}`);
        }

        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}

main();
