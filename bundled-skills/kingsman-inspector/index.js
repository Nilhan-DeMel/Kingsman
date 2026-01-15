#!/usr/bin/env node
/**
 * Kingsman Inspector Skill
 * Repository inspection, classification, risk analysis, and conversion planning
 */

import * as https from 'https';

// ============================================
// CLI ARGUMENT PARSING
// ============================================
function parseArgs(args) {
    const result = { command: 'inspect' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--repo' && args[i + 1]) result.repo = args[++i];
        else if (args[i] === '--pat' && args[i + 1]) result.pat = args[++i];
        else if (args[i] === 'inspect') result.command = 'inspect';
    }
    return result;
}

// ============================================
// GITHUB API CLIENT
// ============================================
function githubRequest(endpoint, pat) {
    return new Promise((resolve, reject) => {
        const headers = {
            'User-Agent': 'Kingsman-Inspector/0.1.0',
            'Accept': 'application/vnd.github.v3+json'
        };
        if (pat) headers['Authorization'] = `token ${pat}`;

        const options = {
            hostname: 'api.github.com',
            path: endpoint,
            method: 'GET',
            headers
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ data: JSON.parse(data), status: res.statusCode });
                } catch (e) {
                    reject(new Error(`JSON parse error: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

async function fetchFileContent(owner, repo, path, pat) {
    try {
        const response = await githubRequest(`/repos/${owner}/${repo}/contents/${path}`, pat);
        if (response.status === 200 && response.data.content) {
            return Buffer.from(response.data.content, 'base64').toString('utf8');
        }
    } catch (e) { /* ignore */ }
    return null;
}

// ============================================
// SKILL.MD DETECTION
// ============================================
const SKILL_PATHS = [
    'SKILL.md',
    '.agent/skills',
    '.claude/skills',
    '.github/skills'
];

async function findSkillMd(owner, repo, tree, pat) {
    const skills = [];

    for (const item of tree) {
        if (item.path.endsWith('SKILL.md')) {
            const content = await fetchFileContent(owner, repo, item.path, pat);
            if (content) {
                const skillInfo = parseSkillMd(content, item.path);
                if (skillInfo) skills.push(skillInfo);
            }
        }
    }

    return skills;
}

function parseSkillMd(content, filePath) {
    // Parse YAML frontmatter
    const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (!match) return null;

    const frontmatter = match[1];
    const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
    const descMatch = frontmatter.match(/^description:\s*(.+)$/m);

    return {
        path: filePath.replace('/SKILL.md', '') || '.',
        name: nameMatch ? nameMatch[1].trim() : null,
        description: descMatch ? descMatch[1].trim() : null
    };
}

// ============================================
// RISK SCANNING
// ============================================
const BINARY_EXTENSIONS = ['.exe', '.dll', '.so', '.dylib', '.bin', '.app', '.msi', '.pkg'];
const SCRIPT_EXTENSIONS = ['.sh', '.bash', '.ps1', '.bat', '.cmd'];
const SUSPICIOUS_PATTERNS = [
    /curl\s+.*\|\s*(bash|sh)/i,
    /wget\s+.*\|\s*(bash|sh)/i,
    /powershell.*-enc/i,
    /base64.*\|\s*(bash|sh)/i,
    /eval\s*\(/i,
    /\$\(curl/i,
    /\$\(wget/i
];

function scanTree(tree) {
    const binaries = [];
    const scripts = [];

    for (const item of tree) {
        const ext = '.' + item.path.split('.').pop().toLowerCase();

        if (BINARY_EXTENSIONS.includes(ext)) {
            binaries.push(item.path);
        }
        if (SCRIPT_EXTENSIONS.includes(ext)) {
            scripts.push(item.path);
        }
    }

    return { binaries, scripts };
}

async function scanPackageJson(owner, repo, pat) {
    const content = await fetchFileContent(owner, repo, 'package.json', pat);
    if (!content) return { npmHooks: [] };

    try {
        const pkg = JSON.parse(content);
        const hooks = [];
        const dangerousHooks = ['preinstall', 'postinstall', 'preuninstall', 'postuninstall'];

        for (const hook of dangerousHooks) {
            if (pkg.scripts && pkg.scripts[hook]) {
                hooks.push(hook);
            }
        }

        return { npmHooks: hooks };
    } catch (e) {
        return { npmHooks: [] };
    }
}

async function scanForPatterns(owner, repo, scripts, pat) {
    const suspicious = [];

    for (const scriptPath of scripts.slice(0, 5)) { // Limit to 5 scripts
        const content = await fetchFileContent(owner, repo, scriptPath, pat);
        if (content) {
            for (const pattern of SUSPICIOUS_PATTERNS) {
                if (pattern.test(content)) {
                    suspicious.push({
                        file: scriptPath,
                        pattern: pattern.toString()
                    });
                    break;
                }
            }
        }
    }

    return suspicious;
}

function calculateRiskLevel(binaries, scripts, suspiciousPatterns, npmHooks) {
    if (binaries.length > 0 || suspiciousPatterns.length > 0) return 'high';
    if (scripts.length > 0 || npmHooks.length > 0) return 'medium';
    return 'low';
}

// ============================================
// CLASSIFICATION
// ============================================
async function classify(owner, repo, tree, skills, readme, license, pat) {
    // Category A: Has SKILL.md
    if (skills.length > 0) {
        return {
            category: 'A',
            confidence: 95,
            explanation: `Repository contains ${skills.length} valid SKILL.md file(s)`
        };
    }

    // Check convertibility
    const hasReadme = readme !== null;
    const hasLicense = license !== null;
    const hasCode = tree.some(f =>
        f.path.endsWith('.js') ||
        f.path.endsWith('.ts') ||
        f.path.endsWith('.py') ||
        f.path.endsWith('.sh')
    );

    // Category B: Convertible
    if (hasReadme && hasCode) {
        const confidence = 60 + (hasLicense ? 15 : 0) + (tree.length < 100 ? 10 : 0);
        return {
            category: 'B',
            confidence: Math.min(confidence, 90),
            explanation: 'Repository has README, code, and can be wrapped as a skill'
        };
    }

    // Category C: Not suitable
    return {
        category: 'C',
        confidence: 70,
        explanation: 'Repository lacks documentation or clear purpose for skill conversion'
    };
}

// ============================================
// CONVERSION PLAN
// ============================================
function generateConversionPlan(owner, repo, tree, readme, repoInfo) {
    // Propose skill name
    const proposedName = repo.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 64);

    // Determine what to keep
    const keep = ['README.md'];
    const ignore = ['.github/', '.git/', 'tests/', 'test/', '__tests__/', 'node_modules/', '.vscode/'];

    const srcFiles = tree.filter(f =>
        f.path.endsWith('.js') ||
        f.path.endsWith('.ts') ||
        f.path.endsWith('.py')
    ).map(f => f.path);

    if (srcFiles.length > 0) keep.push(...srcFiles.slice(0, 10));

    // Dependencies
    const dependencies = [];
    if (tree.some(f => f.path === 'package.json')) dependencies.push('node');
    if (tree.some(f => f.path === 'requirements.txt' || f.path === 'setup.py')) dependencies.push('python');

    // Generate SKILL.md proposal
    const description = repoInfo.description || 'Converted skill from ' + owner + '/' + repo;
    const skillMdProposal = `---
name: ${proposedName}
description: ${description.slice(0, 200)}
---

# ${repo}

${description}

## When to Use

Use this skill when you need functionality from the ${repo} repository.

## How to Run

See the original repository for usage instructions.

## Dependencies

${dependencies.length > 0 ? dependencies.map(d => `- ${d}`).join('\n') : '- None'}

## Source

Converted from: https://github.com/${owner}/${repo}
`;

    return {
        proposedName,
        keep,
        ignore,
        dependencies,
        skillMdProposal
    };
}

// ============================================
// MAIN INSPECT
// ============================================
async function inspect(repoFullName, pat) {
    const [owner, repo] = repoFullName.split('/');
    if (!owner || !repo) {
        throw new Error('Invalid repo format. Use "owner/repo"');
    }

    // Fetch repo info
    const repoResponse = await githubRequest(`/repos/${owner}/${repo}`, pat);
    if (repoResponse.status !== 200) {
        throw new Error(`Repository not found: ${repoFullName}`);
    }
    const repoInfo = repoResponse.data;

    // Fetch file tree
    const branch = repoInfo.default_branch || 'main';
    const treeResponse = await githubRequest(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, pat);
    const tree = treeResponse.status === 200 ? (treeResponse.data.tree || []) : [];

    // Find SKILL.md files
    const skills = await findSkillMd(owner, repo, tree, pat);

    // Fetch README
    const readme = await fetchFileContent(owner, repo, 'README.md', pat);

    // Risk scanning
    const { binaries, scripts } = scanTree(tree);
    const { npmHooks } = await scanPackageJson(owner, repo, pat);
    const suspiciousPatterns = await scanForPatterns(owner, repo, scripts, pat);
    const riskLevel = calculateRiskLevel(binaries, scripts, suspiciousPatterns, npmHooks);

    // Classification
    const classification = await classify(owner, repo, tree, skills, readme, repoInfo.license, pat);

    // Conversion plan (for Category B)
    const conversionPlan = classification.category === 'B'
        ? generateConversionPlan(owner, repo, tree, readme, repoInfo)
        : null;

    return {
        id: repoFullName,
        ...classification,
        skills,
        conversionPlan,
        riskReport: {
            level: riskLevel,
            binaries,
            scripts,
            suspiciousPatterns: suspiciousPatterns.map(p => p.file + ': ' + p.pattern),
            npmHooks
        },
        repoInfo: {
            stars: repoInfo.stargazers_count,
            license: repoInfo.license?.spdx_id || null,
            lastUpdated: repoInfo.updated_at
        }
    };
}

// ============================================
// MAIN
// ============================================
async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.repo) {
        console.error(JSON.stringify({ error: 'Missing --repo argument' }));
        process.exit(1);
    }

    try {
        const result = await inspect(args.repo, args.pat);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}

main();
