#!/usr/bin/env node
/**
 * Kingsman Search Skill
 * Multi-source skill discovery with natural language expansion
 */

import { createRequire } from 'module';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

// ============================================
// CLI ARGUMENT PARSING
// ============================================
function parseArgs(args) {
    const result = { command: 'search' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--query' && args[i + 1]) result.query = args[++i];
        else if (args[i] === '--pat' && args[i + 1]) result.pat = args[++i];
        else if (args[i] === '--cache-dir' && args[i + 1]) result.cacheDir = args[++i];
        else if (args[i] === 'search') result.command = 'search';
    }
    return result;
}

// ============================================
// NATURAL LANGUAGE QUERY EXPANSION
// ============================================
const EXPANSIONS = {
    'text to speech': ['tts', 'text-to-speech', 'speech-synthesis', 'voice'],
    'speech to text': ['stt', 'speech-to-text', 'transcription', 'whisper'],
    'code review': ['code-analysis', 'linting', 'static-analysis', 'code-quality'],
    'web scraping': ['web-scraper', 'crawler', 'html-parser', 'scraper'],
    'pdf': ['pdf-parser', 'pdf-to-text', 'document'],
    'image': ['image-processing', 'vision', 'ocr', 'computer-vision'],
    'database': ['sql', 'database-query', 'data-access'],
    'api': ['rest-api', 'http-client', 'api-client'],
    'file': ['file-system', 'file-manager', 'fs'],
    'git': ['github', 'version-control', 'git-operations'],
    'test': ['testing', 'unit-test', 'test-runner'],
    'deploy': ['deployment', 'ci-cd', 'devops'],
    'convert': ['converter', 'transformation', 'format'],
    'search': ['finder', 'lookup', 'query'],
    'generate': ['generator', 'create', 'build'],
    'analyze': ['analyzer', 'analysis', 'parser']
};

function expandQuery(nlQuery) {
    const lower = nlQuery.toLowerCase().trim();
    const expanded = [nlQuery];

    for (const [key, synonyms] of Object.entries(EXPANSIONS)) {
        if (lower.includes(key)) {
            expanded.push(...synonyms);
        }
    }

    // Add skill-specific qualifiers
    return {
        original: nlQuery,
        expanded: [...new Set(expanded)],
        codeSearchQuery: `${expanded.join(' OR ')} filename:SKILL.md`,
        repoSearchQuery: `${expanded.join(' OR ')} topic:agent-skills OR "SKILL.md" in:readme`
    };
}

// ============================================
// GITHUB API CLIENT
// ============================================
function githubRequest(endpoint, pat) {
    return new Promise((resolve, reject) => {
        const headers = {
            'User-Agent': 'Kingsman-Search/0.1.0',
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
                    const json = JSON.parse(data);
                    resolve({
                        data: json,
                        rateLimit: {
                            remaining: parseInt(res.headers['x-ratelimit-remaining'] || '0'),
                            limit: parseInt(res.headers['x-ratelimit-limit'] || '0'),
                            reset: parseInt(res.headers['x-ratelimit-reset'] || '0')
                        },
                        status: res.statusCode
                    });
                } catch (e) {
                    reject(new Error(`JSON parse error: ${e.message}`));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// ============================================
// SEARCH FUNCTIONS
// ============================================
async function searchCodeForSkillMd(query, pat) {
    const encoded = encodeURIComponent(query);
    try {
        const response = await githubRequest(`/search/code?q=${encoded}&per_page=30`, pat);
        if (response.status !== 200) {
            return { items: [], error: response.data.message, rateLimit: response.rateLimit };
        }
        return {
            items: (response.data.items || []).map(item => ({
                id: item.repository.full_name,
                name: item.repository.name,
                owner: item.repository.owner.login,
                description: item.repository.description || '',
                path: item.path,
                source: 'github-code-search',
                hasSkillMd: true,
                skillPaths: [item.path.replace('/SKILL.md', '')]
            })),
            rateLimit: response.rateLimit
        };
    } catch (e) {
        return { items: [], error: e.message, rateLimit: { remaining: 0 } };
    }
}

async function searchRepos(query, pat) {
    const encoded = encodeURIComponent(query);
    try {
        const response = await githubRequest(`/search/repositories?q=${encoded}&sort=stars&per_page=30`, pat);
        if (response.status !== 200) {
            return { items: [], error: response.data.message, rateLimit: response.rateLimit };
        }
        return {
            items: (response.data.items || []).map(item => ({
                id: item.full_name,
                name: item.name,
                owner: item.owner.login,
                description: item.description || '',
                stars: item.stargazers_count,
                forks: item.forks_count,
                lastUpdated: item.updated_at,
                license: item.license?.spdx_id || null,
                source: 'github-repo-search',
                hasSkillMd: false,
                skillPaths: []
            })),
            rateLimit: response.rateLimit
        };
    } catch (e) {
        return { items: [], error: e.message, rateLimit: { remaining: 0 } };
    }
}

// ============================================
// RANKING
// ============================================
function rankResults(results) {
    return results.map(r => {
        let score = 0;

        // Skill-ready boost
        if (r.hasSkillMd) score += 50;

        // Stars (log scale)
        if (r.stars) score += Math.min(Math.log10(r.stars + 1) * 10, 30);

        // Recent update boost
        if (r.lastUpdated) {
            const daysSinceUpdate = (Date.now() - new Date(r.lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 30) score += 10;
            else if (daysSinceUpdate < 180) score += 5;
        }

        // License boost
        if (r.license && ['MIT', 'Apache-2.0', 'BSD-3-Clause', 'ISC'].includes(r.license)) {
            score += 5;
        }

        return { ...r, score: Math.round(score) / 100 };
    }).sort((a, b) => b.score - a.score);
}

// ============================================
// CACHING
// ============================================
function getCacheKey(query) {
    return Buffer.from(query).toString('base64').replace(/[/+=]/g, '_');
}

function checkCache(cacheDir, query) {
    if (!cacheDir) return null;
    const cachePath = path.join(cacheDir, `${getCacheKey(query)}.json`);
    try {
        if (fs.existsSync(cachePath)) {
            const cached = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            const age = (Date.now() - cached.timestamp) / 1000 / 60;
            if (age < 10) {
                return { ...cached.data, cached: true };
            }
        }
    } catch (e) { /* ignore */ }
    return null;
}

function writeCache(cacheDir, query, data) {
    if (!cacheDir) return;
    try {
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const cachePath = path.join(cacheDir, `${getCacheKey(query)}.json`);
        fs.writeFileSync(cachePath, JSON.stringify({ timestamp: Date.now(), data }));
    } catch (e) { /* ignore */ }
}

// ============================================
// MAIN SEARCH
// ============================================
async function search(query, pat, cacheDir) {
    // Check cache first
    const cached = checkCache(cacheDir, query);
    if (cached) return cached;

    const expanded = expandQuery(query);

    // Run searches in parallel
    const [codeResults, repoResults] = await Promise.all([
        searchCodeForSkillMd(expanded.codeSearchQuery, pat),
        searchRepos(expanded.repoSearchQuery, pat)
    ]);

    // Merge and deduplicate
    const seen = new Set();
    const merged = [];

    for (const item of [...codeResults.items, ...repoResults.items]) {
        if (!seen.has(item.id)) {
            seen.add(item.id);
            merged.push(item);
        }
    }

    const ranked = rankResults(merged);

    const result = {
        results: ranked,
        rateLimitRemaining: Math.min(
            codeResults.rateLimit?.remaining || 100,
            repoResults.rateLimit?.remaining || 100
        ),
        cached: false,
        query: expanded.original,
        expandedTerms: expanded.expanded
    };

    // Cache results
    writeCache(cacheDir, query, result);

    return result;
}

// ============================================
// MAIN
// ============================================
async function main() {
    const args = parseArgs(process.argv.slice(2));

    if (!args.query) {
        console.error(JSON.stringify({ error: 'Missing --query argument' }));
        process.exit(1);
    }

    try {
        const result = await search(args.query, args.pat, args.cacheDir);
        console.log(JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(JSON.stringify({ error: e.message }));
        process.exit(1);
    }
}

main();
