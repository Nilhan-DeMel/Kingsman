/**
 * Kingsman Store - Webview Panel
 * Main store UI with search, results, and installation
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getPat, storePat, deletePat } from '../secrets/GitHubAuth';
import * as SkillRunner from '../backend/SkillRunner';
import { getGlobalSkillsPath, getStagingPath, getRegistryPath, getCachePath, ensureAllDirectories } from '../backend/Paths';
import type { WebviewMessage, WebviewResponse, SearchResponse, InspectionResult, StageResponse, InstallResponse, ListResponse } from '../types/contracts';

export class StorePanel {
    public static currentPanel: StorePanel | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.webview.html = this._getHtmlContent();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        this._panel.webview.onDidReceiveMessage(
            (message) => this._handleMessage(message),
            null,
            this._disposables
        );
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (StorePanel.currentPanel) {
            StorePanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'kingsmanStore',
            'Kingsman Skill Store',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        StorePanel.currentPanel = new StorePanel(panel, extensionUri);
    }

    public dispose(): void {
        StorePanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const d = this._disposables.pop();
            if (d) d.dispose();
        }
    }

    private async _handleMessage(message: WebviewMessage): Promise<void> {
        const respond = (success: boolean, data?: unknown, error?: string) => {
            const response: WebviewResponse = { type: 'response', id: message.id, success, data, error };
            this._panel.webview.postMessage(response);
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
                    const result = await SkillRunner.install(
                        stagedId,
                        getStagingPath(),
                        getGlobalSkillsPath(),
                        getRegistryPath(),
                        conversionPlan
                    );
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

    private _getHtmlContent(): string {
        const webview = this._panel.webview;
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
            --container-padding: 20px;
            --card-padding: 16px;
            --border-radius: 8px;
        }
        body {
            padding: var(--container-padding);
            font-family: var(--vscode-font-family);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
        }
        .tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 8px;
        }
        .tab {
            padding: 8px 16px;
            cursor: pointer;
            border: none;
            background: none;
            color: var(--vscode-foreground);
            border-radius: var(--border-radius);
        }
        .tab.active {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        .search-container {
            display: flex;
            gap: 8px;
            margin-bottom: 20px;
        }
        .search-input {
            flex: 1;
            padding: 10px 16px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: var(--border-radius);
            font-size: 14px;
        }
        .search-btn {
            padding: 10px 20px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: var(--border-radius);
            cursor: pointer;
        }
        .search-btn:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .results-grid {
            display: grid;
            gap: 16px;
        }
        .result-card {
            padding: var(--card-padding);
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: var(--border-radius);
            border: 1px solid var(--vscode-panel-border);
        }
        .result-card:hover {
            border-color: var(--vscode-focusBorder);
        }
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        .card-title {
            font-weight: bold;
            font-size: 16px;
            color: var(--vscode-textLink-foreground);
        }
        .card-meta {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        .card-desc {
            margin-bottom: 12px;
            font-size: 13px;
        }
        .card-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }
        .btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
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
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
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
            padding: 40px;
            color: var(--vscode-descriptionForeground);
        }
        .spinner {
            border: 3px solid var(--vscode-editor-background);
            border-top: 3px solid var(--vscode-button-background);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            animation: spin 1s linear infinite;
            margin: 0 auto 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        .modal-overlay.show {
            display: flex;
        }
        .modal {
            background: var(--vscode-editor-background);
            border-radius: var(--border-radius);
            padding: 24px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid var(--vscode-panel-border);
        }
        .modal h2 {
            margin-top: 0;
        }
        .modal-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 20px;
        }
        .risk-section {
            margin: 16px 0;
            padding: 12px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: var(--border-radius);
        }
        .risk-item {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 4px 0;
            font-size: 13px;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: var(--vscode-descriptionForeground);
        }
        .settings-section {
            margin-top: 20px;
            padding: 16px;
            background: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: var(--border-radius);
        }
        .rate-limit {
            position: absolute;
            top: var(--container-padding);
            right: var(--container-padding);
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
            background: var(--vscode-editor-inactiveSelectionBackground);
            padding: 4px 8px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="rate-limit" id="rateLimit" style="display: none;">
        API: <span id="rateLimitCount">-</span>
    </div>
    
    <div class="header">
        <h1>🎩 Kingsman Skill Store</h1>
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="search">Search</button>
        <button class="tab" data-tab="installed">Installed</button>
        <button class="tab" data-tab="settings">Settings</button>
    </div>
    
    <div id="searchTab">
        <div class="search-container">
            <input type="text" class="search-input" id="searchInput" 
                   placeholder="Search GitHub for skills, e.g., 'convert pdf to text', 'code review'" />
            <button class="search-btn" id="searchBtn">Search</button>
        </div>
        
        <div id="searchLoading" class="loading" style="display: none;">
            <div class="spinner"></div>
            Searching GitHub...
        </div>
        
        <div id="searchResults" class="results-grid"></div>
        
        <div id="searchEmpty" class="empty-state">
            <h2>🔍 Search for Skills</h2>
            <p>Enter a natural language query to find skills from GitHub repositories.</p>
            <p style="font-size: 12px; color: var(--vscode-descriptionForeground);">Note: HuggingFace support planned for v0.3.</p>
        </div>
    </div>
    
    <div id="installedTab" style="display: none;">
        <div id="installedLoading" class="loading" style="display: none;">
            <div class="spinner"></div>
            Loading installed skills...
        </div>
        
        <div id="installedList" class="results-grid"></div>
        
        <div id="installedEmpty" class="empty-state">
            <h2>📦 No Skills Installed</h2>
            <p>Search and install skills to see them here.</p>
        </div>
    </div>
    
    <div id="settingsTab" style="display: none;">
        <div class="settings-section">
            <h3>GitHub Personal Access Token</h3>
            <p style="font-size: 13px; color: var(--vscode-descriptionForeground);">
                A PAT improves search rate limits (10 → 30 req/min) and enables code search.
            </p>
            <div style="margin-top: 12px;">
                <input type="password" class="search-input" id="patInput" 
                       placeholder="ghp_xxxxxxxxxxxx" style="max-width: 400px;" />
                <button class="btn btn-primary" id="savePatBtn">Save PAT</button>
                <button class="btn btn-secondary" id="clearPatBtn">Clear</button>
            </div>
            <p id="patStatus" style="font-size: 12px; margin-top: 8px;"></p>
        </div>
    </div>
    
    <div class="modal-overlay" id="inspectModal">
        <div class="modal">
            <h2 id="modalTitle">Inspect Repository</h2>
            <div id="modalContent"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modalClose">Close</button>
                <button class="btn btn-primary" id="modalStage" style="display: none;">Stage for Install</button>
                <button class="btn btn-primary" id="modalInstall" style="display: none;">Approve & Install</button>
            </div>
        </div>
    </div>
    
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        let pendingRequests = {};
        let currentInspection = null;
        let currentStagedId = null;
        
        // Message handling
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
        
        // SECURITY: Escape HTML to prevent XSS from untrusted repo data
        function escapeHtml(str) {
            if (!str) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        
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
                    '<div class="empty-state"><p>Error: ' + err.message + '</p></div>';
            } finally {
                document.getElementById('searchLoading').style.display = 'none';
            }
        }
        
        function renderResults(data) {
            const container = document.getElementById('searchResults');
            
            if (!data.results || data.results.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No results found. Try different keywords.</p></div>';
                return;
            }
            
            container.innerHTML = data.results.map(r => \`
                <div class="result-card" data-repo="\${escapeHtml(r.id)}">
                    <div class="card-header">
                        <div>
                            <span class="card-title">\${escapeHtml(r.name)}</span>
                            <span class="card-meta">by \${escapeHtml(r.owner)}</span>
                        </div>
                        <div>
                            \${r.hasSkillMd ? '<span class="badge badge-a">Skill ✓</span>' : ''}
                            \${r.stars ? '<span class="card-meta">⭐ ' + r.stars + '</span>' : ''}
                        </div>
                    </div>
                    <div class="card-desc">\${escapeHtml(r.description) || 'No description'}</div>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="quickCheck('\${escapeHtml(r.id)}')">Quick Check</button>
                        <button class="btn btn-secondary" onclick="inspect('\${escapeHtml(r.id)}')">Inspect</button>
                        <button class="btn btn-primary" onclick="stageAndInstall('\${escapeHtml(r.id)}')">Stage & Install</button>
                        <button class="btn btn-secondary" onclick="openExternal('https://github.com/\${escapeHtml(r.id)}')">GitHub</button>
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
                let badge = '';
                if (result.category === 'A') badge = '<span class="badge badge-a">A: Ready</span>';
                else if (result.category === 'B') badge = '<span class="badge badge-b">B: Convertible</span>';
                else badge = '<span class="badge badge-c">C: Not Suitable</span>';
                
                badge += ' <span class="badge badge-' + result.riskReport.level + '">' + result.riskReport.level + ' risk</span>';
                
                actionsDiv.innerHTML = badge + \`
                    <button class="btn btn-secondary" onclick="inspect('\${repo}')">Details</button>
                    \${result.category !== 'C' ? '<button class="btn btn-primary" onclick="stageAndInstall(\\'' + repo + '\\')">Install</button>' : ''}
                \`;
            } catch (err) {
                actionsDiv.innerHTML = '<span style="color: var(--vscode-errorForeground);">Error: ' + err.message + '</span>';
            }
        }
        
        async function inspect(repo) {
            document.getElementById('modalTitle').textContent = 'Inspecting ' + repo + '...';
            document.getElementById('modalContent').innerHTML = '<div class="loading"><div class="spinner"></div></div>';
            document.getElementById('inspectModal').classList.add('show');
            document.getElementById('modalStage').style.display = 'none';
            document.getElementById('modalInstall').style.display = 'none';
            
            try {
                const result = await sendMessage('inspect', { repo });
                currentInspection = result;
                renderInspection(result);
            } catch (err) {
                document.getElementById('modalContent').innerHTML = '<p style="color: var(--vscode-errorForeground);">Error: ' + err.message + '</p>';
            }
        }
        
        function renderInspection(data) {
            document.getElementById('modalTitle').textContent = data.id;
            
            let catLabel = { A: 'Already a Skill', B: 'Convertible', C: 'Not Suitable' }[data.category];
            
            let html = \`
                <div style="margin-bottom: 16px;">
                    <span class="badge badge-\${data.category.toLowerCase()}" style="font-size: 14px;">\${data.category}: \${catLabel}</span>
                    <span style="margin-left: 8px;">Confidence: \${data.confidence}%</span>
                </div>
                <p>\${data.explanation}</p>
            \`;
            
            if (data.skills && data.skills.length > 0) {
                html += '<h4>Skills Found:</h4><ul>';
                data.skills.forEach(s => {
                    html += '<li><strong>' + (s.name || 'unnamed') + '</strong> - ' + (s.description || 'No description') + '</li>';
                });
                html += '</ul>';
            }
            
            if (data.conversionPlan) {
                html += \`
                    <div class="risk-section">
                        <h4>Conversion Plan</h4>
                        <p><strong>Proposed name:</strong> \${data.conversionPlan.proposedName}</p>
                        <p><strong>Keep:</strong> \${data.conversionPlan.keep.join(', ')}</p>
                        <p><strong>Ignore:</strong> \${data.conversionPlan.ignore.join(', ')}</p>
                        <p><strong>Dependencies:</strong> \${data.conversionPlan.dependencies.join(', ') || 'None'}</p>
                    </div>
                \`;
            }
            
            html += \`
                <div class="risk-section">
                    <h4>Risk Report <span class="badge badge-\${data.riskReport.level}">\${data.riskReport.level}</span></h4>
            \`;
            
            if (data.riskReport.binaries.length > 0) {
                html += '<div class="risk-item">⚠️ Binaries: ' + data.riskReport.binaries.join(', ') + '</div>';
            }
            if (data.riskReport.scripts.length > 0) {
                html += '<div class="risk-item">📜 Scripts: ' + data.riskReport.scripts.join(', ') + '</div>';
            }
            if (data.riskReport.npmHooks.length > 0) {
                html += '<div class="risk-item">⚙️ npm hooks: ' + data.riskReport.npmHooks.join(', ') + '</div>';
            }
            if (data.riskReport.suspiciousPatterns.length > 0) {
                html += '<div class="risk-item">🚨 Suspicious: ' + data.riskReport.suspiciousPatterns.join(', ') + '</div>';
            }
            if (data.riskReport.level === 'low' && data.riskReport.binaries.length === 0 && data.riskReport.scripts.length === 0) {
                html += '<div class="risk-item">✅ No significant risks detected</div>';
            }
            
            html += '</div>';
            
            document.getElementById('modalContent').innerHTML = html;
            
            if (data.category !== 'C') {
                document.getElementById('modalStage').style.display = 'inline-block';
                document.getElementById('modalStage').onclick = () => stageFromModal(data.id);
            }
        }
        
        async function stageFromModal(repo) {
            document.getElementById('modalStage').textContent = 'Staging...';
            document.getElementById('modalStage').disabled = true;
            
            try {
                const result = await sendMessage('stage', { repo });
                currentStagedId = result.stagedId;
                
                document.getElementById('modalStage').style.display = 'none';
                document.getElementById('modalInstall').style.display = 'inline-block';
                document.getElementById('modalInstall').textContent = 'Approve & Install: ' + result.skillName;
                document.getElementById('modalInstall').onclick = () => installFromModal(result.stagedId);
                
                document.getElementById('modalContent').innerHTML += \`
                    <div class="risk-section" style="background: var(--vscode-inputValidation-infoBackground); border: 1px solid var(--vscode-inputValidation-infoBorder);">
                        <h4>✅ Staged Successfully</h4>
                        <p>Skill name: <strong>\${result.skillName}</strong></p>
                        <p>Click "Approve & Install" to install to global skills folder.</p>
                    </div>
                \`;
            } catch (err) {
                document.getElementById('modalContent').innerHTML += \`
                    <div class="risk-section" style="background: var(--vscode-inputValidation-errorBackground);">
                        <p>Staging failed: \${err.message}</p>
                    </div>
                \`;
            } finally {
                document.getElementById('modalStage').textContent = 'Stage for Install';
                document.getElementById('modalStage').disabled = false;
            }
        }
        
        async function installFromModal(stagedId) {
            document.getElementById('modalInstall').textContent = 'Installing...';
            document.getElementById('modalInstall').disabled = true;
            
            try {
                const conversionPlan = currentInspection?.conversionPlan 
                    ? JSON.stringify(currentInspection.conversionPlan) 
                    : undefined;
                    
                const result = await sendMessage('install', { stagedId, conversionPlan });
                
                document.getElementById('modalContent').innerHTML += \`
                    <div class="risk-section" style="background: var(--vscode-inputValidation-infoBackground); border: 1px solid var(--vscode-inputValidation-infoBorder);">
                        <h4>🎉 Installed Successfully!</h4>
                        <p>Skill: <strong>\${result.skillName}</strong></p>
                        <p>Path: \${result.skillPath}</p>
                    </div>
                \`;
                
                document.getElementById('modalInstall').style.display = 'none';
                currentInspection = null;
                currentStagedId = null;
            } catch (err) {
                document.getElementById('modalContent').innerHTML += \`
                    <div class="risk-section" style="background: var(--vscode-inputValidation-errorBackground);">
                        <p>Installation failed: \${err.message}</p>
                    </div>
                \`;
            } finally {
                document.getElementById('modalInstall').textContent = 'Approve & Install';
                document.getElementById('modalInstall').disabled = false;
            }
        }
        
        async function stageAndInstall(repo) {
            await inspect(repo);
        }
        
        function openExternal(url) {
            sendMessage('openExternal', { url });
        }
        
        // Modal close
        document.getElementById('modalClose').addEventListener('click', () => {
            document.getElementById('inspectModal').classList.remove('show');
            currentInspection = null;
            currentStagedId = null;
        });
        
        // Installed tab
        async function loadInstalled() {
            document.getElementById('installedLoading').style.display = 'block';
            document.getElementById('installedList').innerHTML = '';
            document.getElementById('installedEmpty').style.display = 'none';
            
            try {
                const result = await sendMessage('listInstalled', {});
                renderInstalled(result);
            } catch (err) {
                document.getElementById('installedList').innerHTML = 
                    '<div class="empty-state"><p>Error loading installed skills</p></div>';
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
                    <div class="card-header">
                        <span class="card-title">\${s.skillName}</span>
                        <span class="card-meta">Installed \${new Date(s.installedAt).toLocaleDateString()}</span>
                    </div>
                    <div class="card-desc">
                        <a href="#" onclick="openExternal('\${s.sourceUrl}'); return false;">\${s.sourceUrl}</a>
                    </div>
                    <div class="card-actions">
                        <button class="btn btn-secondary" onclick="openExternal('file://\${s.installPath.replace(/\\\\/g, '/')}')">Open Folder</button>
                        <button class="btn btn-secondary" onclick="uninstallSkill('\${s.skillName}')">Uninstall</button>
                    </div>
                </div>
            \`).join('');
        }
        
        async function uninstallSkill(name) {
            if (!confirm('Are you sure you want to uninstall ' + name + '?')) return;
            
            try {
                await sendMessage('uninstall', { skillName: name });
                loadInstalled();
            } catch (err) {
                alert('Uninstall failed: ' + err.message);
            }
        }
        
        // Settings
        document.getElementById('savePatBtn').addEventListener('click', async () => {
            const pat = document.getElementById('patInput').value.trim();
            if (!pat) return;
            
            await sendMessage('setPat', { pat });
            document.getElementById('patInput').value = '';
            loadPatStatus();
        });
        
        document.getElementById('clearPatBtn').addEventListener('click', async () => {
            await sendMessage('setPat', { pat: null });
            loadPatStatus();
        });
        
        async function loadPatStatus() {
            try {
                const result = await sendMessage('getPat', {});
                document.getElementById('patStatus').textContent = result.hasPat 
                    ? '✅ PAT configured: ' + result.patPreview 
                    : '⚠️ No PAT configured (limited rate limits)';
            } catch (err) {
                document.getElementById('patStatus').textContent = 'Error checking PAT status';
            }
        }
        
        // Initial load
        loadPatStatus();
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
