/**
 * Kingsman Store - Webview View Provider
 * Provides the Skill Store webview in the Activity Bar sidebar
 */

import * as vscode from 'vscode';
import { getPat, storePat, deletePat } from '../secrets/GitHubAuth';
import * as SkillRunner from '../backend/SkillRunner';
import { getGlobalSkillsPath, getStagingPath, getRegistryPath, getCachePath, ensureAllDirectories } from '../backend/Paths';
import type { WebviewMessage, WebviewResponse } from '../types/contracts';

export class SkillStoreViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'kingsman.skillStoreView';

    private _view?: vscode.WebviewView;

    constructor(private readonly _extensionUri: vscode.Uri) { }

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        _context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlContent(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(
            (message) => this._handleMessage(message, webviewView.webview)
        );
    }

    private async _handleMessage(message: WebviewMessage, webview: vscode.Webview): Promise<void> {
        const respond = (success: boolean, data?: unknown, error?: string) => {
            const response: WebviewResponse = { type: 'response', id: message.id, success, data, error };
            webview.postMessage(response);
        };

        try {
            ensureAllDirectories();
            const pat = await getPat();

            switch (message.type) {
                case 'search': {
                    const { query } = message.payload as { query: string };
                    const result = await SkillRunner.search(query, pat, getCachePath());
                    respond(true, result);
                    break;
                }

                case 'inspect': {
                    const { repo } = message.payload as { repo: string };
                    const result = await SkillRunner.inspect(repo, pat);
                    respond(true, result);
                    break;
                }

                case 'stage': {
                    const { repo } = message.payload as { repo: string };
                    const result = await SkillRunner.stage(repo, getStagingPath(), pat);
                    respond(true, result);
                    break;
                }

                case 'install': {
                    const { stagedId, conversionPlan } = message.payload as { stagedId: string; conversionPlan?: string };
                    // Show confirmation dialog
                    const confirm = await vscode.window.showWarningMessage(
                        `Kingsman: Install skill from staged ID "${stagedId}"?`,
                        { modal: true, detail: 'This will copy files to your global skills folder. Only install from sources you trust.' },
                        'Install',
                        'Cancel'
                    );
                    if (confirm !== 'Install') {
                        respond(true, { cancelled: true });
                        break;
                    }
                    const result = await SkillRunner.install(
                        stagedId,
                        getStagingPath(),
                        getGlobalSkillsPath(),
                        getRegistryPath(),
                        conversionPlan
                    );
                    vscode.window.showInformationMessage(`Kingsman: Installed skill "${result.skillName}"`);
                    respond(true, result);
                    break;
                }

                case 'listInstalled': {
                    const result = await SkillRunner.listInstalled(getRegistryPath());
                    respond(true, result);
                    break;
                }

                case 'uninstall': {
                    const { skillName } = message.payload as { skillName: string };
                    const result = await SkillRunner.uninstall(
                        skillName,
                        getGlobalSkillsPath(),
                        getRegistryPath()
                    );
                    respond(true, result);
                    break;
                }

                case 'setPat': {
                    const { pat: newPat } = message.payload as { pat: string };
                    if (newPat) {
                        await storePat(newPat);
                        respond(true, { patSet: true });
                    } else {
                        await deletePat();
                        respond(true, { patSet: false });
                    }
                    break;
                }

                case 'getPat': {
                    const hasPat = pat !== undefined && pat.length > 0;
                    respond(true, { hasPat, patPreview: hasPat ? pat.slice(0, 8) + '...' : null });
                    break;
                }

                case 'openExternal': {
                    const { url } = message.payload as { url: string };
                    await vscode.env.openExternal(vscode.Uri.parse(url));
                    respond(true);
                    break;
                }

                default:
                    respond(false, null, `Unknown message type: ${message.type}`);
            }
        } catch (error) {
            respond(false, null, error instanceof Error ? error.message : 'Unknown error');
        }
    }

    private _getHtmlContent(webview: vscode.Webview): string {
        const nonce = getNonce();

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; script-src 'nonce-${nonce}'; style-src ${webview.cspSource} 'unsafe-inline';">
    <title>Kingsman Skill Store</title>
    <style>
        :root {
            --container-padding: 12px;
            --card-padding: 12px;
            --border-radius: 6px;
        }
        body {
            padding: var(--container-padding);
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-sideBar-background);
            font-size: 13px;
        }
        .header {
            margin-bottom: 12px;
        }
        .header h2 {
            margin: 0 0 8px 0;
            font-size: 14px;
        }
        .tabs {
            display: flex;
            gap: 4px;
            margin-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        .tab {
            padding: 4px 8px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--vscode-foreground);
            border-radius: 4px;
            font-size: 12px;
        }
        .tab.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .search-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
            margin-bottom: 12px;
        }
        .search-input {
            width: 100%;
            padding: 6px 8px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
            font-size: 12px;
            box-sizing: border-box;
        }
        .search-btn {
            padding: 6px 12px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        }
        .results-grid {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .result-card {
            padding: var(--card-padding);
            background-color: var(--vscode-editor-background);
            border-radius: var(--border-radius);
            border: 1px solid var(--vscode-panel-border);
        }
        .card-title {
            font-weight: bold;
            font-size: 13px;
            color: var(--vscode-textLink-foreground);
        }
        .card-meta {
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
        .card-desc {
            margin: 6px 0;
            font-size: 12px;
        }
        .card-actions {
            display: flex;
            gap: 4px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 4px 8px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }
        .btn-primary {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .btn-secondary {
            background-color: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: bold;
        }
        .badge-a { background-color: #28a745; color: white; }
        .badge-b { background-color: #ffc107; color: black; }
        .badge-c { background-color: #dc3545; color: white; }
        .badge-low { background-color: #28a745; color: white; }
        .badge-medium { background-color: #ffc107; color: black; }
        .badge-high { background-color: #dc3545; color: white; }
        .loading {
            text-align: center;
            padding: 20px;
            color: var(--vscode-descriptionForeground);
        }
        .spinner {
            border: 2px solid var(--vscode-editor-background);
            border-top: 2px solid var(--vscode-button-background);
            border-radius: 50%;
            width: 16px;
            height: 16px;
            animation: spin 1s linear infinite;
            margin: 0 auto 8px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .empty-state {
            text-align: center;
            padding: 20px 10px;
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
        }
        .settings-section {
            margin-top: 12px;
            padding: 12px;
            background: var(--vscode-editor-background);
            border-radius: var(--border-radius);
        }
        .settings-section h4 {
            margin: 0 0 8px 0;
            font-size: 13px;
        }
        .rate-limit {
            font-size: 10px;
            color: var(--vscode-descriptionForeground);
            background: var(--vscode-editor-background);
            padding: 4px 6px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="rate-limit" id="rateLimit" style="display: none;">
        API: <span id="rateLimitCount">-</span> remaining
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="search">Search</button>
        <button class="tab" data-tab="installed">Installed</button>
        <button class="tab" data-tab="settings">Settings</button>
    </div>
    
    <div id="searchTab">
        <div class="search-container">
            <input type="text" class="search-input" id="searchInput" 
                   placeholder="Search skills on GitHub..." />
            <button class="search-btn" id="searchBtn">Search</button>
        </div>
        
        <div id="searchLoading" class="loading" style="display: none;">
            <div class="spinner"></div>
            Searching...
        </div>
        
        <div id="searchResults" class="results-grid"></div>
        
        <div id="searchEmpty" class="empty-state">
            <p>Enter a query to find skills</p>
            <p style="font-size: 10px;">HuggingFace: v0.3</p>
        </div>
    </div>
    
    <div id="installedTab" style="display: none;">
        <div id="installedLoading" class="loading" style="display: none;">
            <div class="spinner"></div>
        </div>
        <div id="installedList" class="results-grid"></div>
        <div id="installedEmpty" class="empty-state">
            <p>No skills installed</p>
        </div>
    </div>
    
    <div id="settingsTab" style="display: none;">
        <div class="settings-section">
            <h4>GitHub PAT</h4>
            <p style="font-size: 11px; color: var(--vscode-descriptionForeground); margin-bottom: 8px;">
                Improves rate limits and enables code search.
            </p>
            <input type="password" class="search-input" id="patInput" placeholder="ghp_xxx" style="margin-bottom: 6px;" />
            <div style="display: flex; gap: 4px;">
                <button class="btn btn-primary" id="savePatBtn">Save</button>
                <button class="btn btn-secondary" id="clearPatBtn">Clear</button>
            </div>
            <p id="patStatus" style="font-size: 11px; margin-top: 6px;"></p>
        </div>
    </div>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let pendingRequests = {};
        let currentInspection = null;
        
        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        
        function sendMessage(type, payload) {
            return new Promise((resolve, reject) => {
                const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
                pendingRequests[id] = { resolve, reject };
                vscode.postMessage({ type, id, payload });
            });
        }
        
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'response' && pendingRequests[message.id]) {
                const { resolve, reject } = pendingRequests[message.id];
                delete pendingRequests[message.id];
                if (message.success) {
                    resolve(message.data);
                } else {
                    reject(new Error(message.error));
                }
            }
        });
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const tabName = tab.dataset.tab;
                document.getElementById('searchTab').style.display = tabName === 'search' ? 'block' : 'none';
                document.getElementById('installedTab').style.display = tabName === 'installed' ? 'block' : 'none';
                document.getElementById('settingsTab').style.display = tabName === 'settings' ? 'block' : 'none';
                
                if (tabName === 'installed') loadInstalled();
                if (tabName === 'settings') loadPatStatus();
            });
        });
        
        // Search
        document.getElementById('searchBtn').addEventListener('click', doSearch);
        document.getElementById('searchInput').addEventListener('keypress', e => {
            if (e.key === 'Enter') doSearch();
        });
        
        async function doSearch() {
            const query = document.getElementById('searchInput').value.trim();
            if (!query) return;
            
            document.getElementById('searchLoading').style.display = 'block';
            document.getElementById('searchResults').innerHTML = '';
            document.getElementById('searchEmpty').style.display = 'none';
            
            try {
                const result = await sendMessage('search', { query });
                renderResults(result);
                
                if (result.rateLimitRemaining !== undefined) {
                    document.getElementById('rateLimit').style.display = 'block';
                    document.getElementById('rateLimitCount').textContent = result.rateLimitRemaining;
                }
            } catch (err) {
                document.getElementById('searchResults').innerHTML = 
                    '<div class="empty-state"><p>Error: ' + escapeHtml(err.message) + '</p></div>';
            } finally {
                document.getElementById('searchLoading').style.display = 'none';
            }
        }
        
        function renderResults(data) {
            const container = document.getElementById('searchResults');
            
            if (!data.results || data.results.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No results found</p></div>';
                return;
            }
            
            container.innerHTML = data.results.slice(0, 10).map(r => \`
                <div class="result-card" data-repo="\${escapeHtml(r.id)}">
                    <div><span class="card-title">\${escapeHtml(r.name)}</span> <span class="card-meta">by \${escapeHtml(r.owner)}</span></div>
                    \${r.hasSkillMd ? '<span class="badge badge-a">Skill</span>' : ''}
                    \${r.stars ? '<span class="card-meta">⭐' + r.stars + '</span>' : ''}
                    <div class="card-desc">\${escapeHtml(r.description) || 'No description'}</div>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="quickCheck('\${escapeHtml(r.id)}')">Check</button>
                        <button class="btn btn-primary" onclick="stageAndInstall('\${escapeHtml(r.id)}')">Install</button>
                    </div>
                </div>
            \`).join('');
        }
        
        async function quickCheck(repo) {
            const card = document.querySelector(\`[data-repo="\${repo}"]\`);
            if (!card) return;
            
            const actionsDiv = card.querySelector('.card-actions');
            actionsDiv.innerHTML = '<span class="loading"><div class="spinner"></div></span>';
            
            try {
                const result = await sendMessage('inspect', { repo });
                let badge = result.category === 'A' ? '<span class="badge badge-a">Ready</span>'
                          : result.category === 'B' ? '<span class="badge badge-b">Convertible</span>'
                          : '<span class="badge badge-c">Not Suitable</span>';
                badge += ' <span class="badge badge-' + result.riskReport.level + '">' + result.riskReport.level + '</span>';
                
                actionsDiv.innerHTML = badge + (result.category !== 'C' ? 
                    ' <button class="btn btn-primary" onclick="stageAndInstall(\\'' + escapeHtml(repo) + '\\')">Install</button>' : '');
            } catch (err) {
                actionsDiv.innerHTML = '<span style="color: var(--vscode-errorForeground);">Error</span>';
            }
        }
        
        async function stageAndInstall(repo) {
            const card = document.querySelector(\`[data-repo="\${repo}"]\`);
            if (card) {
                const actionsDiv = card.querySelector('.card-actions');
                actionsDiv.innerHTML = '<span class="loading"><div class="spinner"></div></span> Staging...';
            }
            
            try {
                const stageResult = await sendMessage('stage', { repo });
                const installResult = await sendMessage('install', { stagedId: stageResult.stagedId });
                if (installResult.cancelled) {
                    if (card) card.querySelector('.card-actions').innerHTML = 'Cancelled';
                } else {
                    if (card) card.querySelector('.card-actions').innerHTML = '<span class="badge badge-a">Installed!</span>';
                }
            } catch (err) {
                if (card) card.querySelector('.card-actions').innerHTML = '<span style="color: var(--vscode-errorForeground);">' + escapeHtml(err.message) + '</span>';
            }
        }
        
        // Installed tab
        async function loadInstalled() {
            document.getElementById('installedLoading').style.display = 'block';
            document.getElementById('installedList').innerHTML = '';
            document.getElementById('installedEmpty').style.display = 'none';
            
            try {
                const result = await sendMessage('listInstalled', {});
                renderInstalled(result);
            } catch (err) {
                document.getElementById('installedList').innerHTML = '<div class="empty-state"><p>Error</p></div>';
            } finally {
                document.getElementById('installedLoading').style.display = 'none';
            }
        }
        
        function renderInstalled(data) {
            const container = document.getElementById('installedList');
            
            if (!data.skills || data.skills.length === 0) {
                document.getElementById('installedEmpty').style.display = 'block';
                return;
            }
            
            container.innerHTML = data.skills.map(s => \`
                <div class="result-card">
                    <span class="card-title">\${escapeHtml(s.skillName)}</span>
                    <div class="card-meta">\${new Date(s.installedAt).toLocaleDateString()}</div>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="uninstallSkill('\${escapeHtml(s.skillName)}')">Uninstall</button>
                    </div>
                </div>
            \`).join('');
        }
        
        async function uninstallSkill(name) {
            try {
                await sendMessage('uninstall', { skillName: name });
                loadInstalled();
            } catch (err) {
                alert('Uninstall failed: ' + err.message);
            }
        }
        
        // Settings
        async function loadPatStatus() {
            try {
                const result = await sendMessage('getPat', {});
                document.getElementById('patStatus').textContent = result.hasPat 
                    ? 'PAT saved: ' + result.patPreview 
                    : 'No PAT configured';
            } catch (err) {
                document.getElementById('patStatus').textContent = 'Error';
            }
        }
        
        document.getElementById('savePatBtn').addEventListener('click', async () => {
            const pat = document.getElementById('patInput').value.trim();
            if (!pat) return;
            try {
                await sendMessage('setPat', { pat });
                document.getElementById('patInput').value = '';
                loadPatStatus();
            } catch (err) {
                alert('Save failed: ' + err.message);
            }
        });
        
        document.getElementById('clearPatBtn').addEventListener('click', async () => {
            try {
                await sendMessage('setPat', { pat: '' });
                loadPatStatus();
            } catch (err) {
                alert('Clear failed: ' + err.message);
            }
        });
    </script>
</body>
</html>`;
    }
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
