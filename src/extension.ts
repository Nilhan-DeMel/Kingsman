import * as vscode from 'vscode';

// Legacy imports (existing functionality)
import * as fs from 'fs';
import * as path from 'path';

// Store imports
import { StorePanel } from './store/StorePanel';
import { initSecretStorage, getPat } from './secrets/GitHubAuth';
import { bootstrapSkills, needsBootstrap } from './backend/Bootstrap';
import { ensureAllDirectories, getGlobalSkillsPath, getStagingPath, getRegistryPath, getCachePath } from './backend/Paths';
import * as SkillRunner from './backend/SkillRunner';

// Output channel for logging
let outputChannel: vscode.OutputChannel;

// ============================================
// URL GENERATION (Legacy)
// ============================================

function generateSearchUrl(query: string): string {
    const config = vscode.workspace.getConfiguration('kingsman');
    const baseUrl = config.get<string>('searchBaseUrl', 'https://www.google.com/search?q=');
    const encodedQuery = encodeURIComponent(query.trim());
    return `${baseUrl}${encodedQuery}`;
}

function log(message: string): void {
    console.log(message);
    if (outputChannel) {
        outputChannel.appendLine(message);
    }
}

async function writeArtifact(query: string, url: string, customPath?: string): Promise<string> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        throw new Error('No workspace folder open');
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const artifactDir = customPath
        ? path.dirname(path.join(workspaceRoot, customPath))
        : path.join(workspaceRoot, '.kingsman', 'skills', 'google_search');
    const artifactPath = customPath
        ? path.join(workspaceRoot, customPath)
        : path.join(artifactDir, 'latest.json');

    if (!fs.existsSync(artifactDir)) {
        fs.mkdirSync(artifactDir, { recursive: true });
    }

    const artifact = {
        query: query,
        url: url,
        timestamp: new Date().toISOString(),
        source: 'kingsman'
    };

    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), 'utf8');

    return artifactPath;
}

// ============================================
// ACTIVATION
// ============================================

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    // Initialize output channel
    outputChannel = vscode.window.createOutputChannel('Kingsman');
    log('[Kingsman] Extension activating...');

    // Initialize secret storage for PAT
    initSecretStorage(context);

    // Ensure directories exist
    ensureAllDirectories();

    // Bootstrap skills if needed
    if (needsBootstrap(context.extensionPath)) {
        log('[Kingsman] Backend skills need bootstrapping...');
        try {
            const installed = await bootstrapSkills(context.extensionPath);
            if (installed.length > 0) {
                log(`[Kingsman] Installed backend skills: ${installed.join(', ')}`);
            }
        } catch (error) {
            log(`[Kingsman] Bootstrap error: ${error}`);
        }
    }

    // ========================================
    // LEGACY COMMANDS (Google Search)
    // ========================================

    const googleSearchCmd = vscode.commands.registerCommand('kingsman.googleSearch', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Enter your search query',
            placeHolder: 'e.g., TypeScript best practices',
            validateInput: (value: string) => {
                if (!value || value.trim().length === 0) {
                    return 'Please enter a search query';
                }
                return null;
            }
        });

        if (query === undefined) return;

        const searchUrl = generateSearchUrl(query);
        log(`[Kingsman] Opening search URL: ${searchUrl}`);

        try {
            const uri = vscode.Uri.parse(searchUrl);
            const success = await vscode.env.openExternal(uri);
            if (success) {
                vscode.window.showInformationMessage(`Searching for: ${query}`);
            } else {
                vscode.window.showErrorMessage('Failed to open browser.');
            }
        } catch (error) {
            log(`[Kingsman] Error: ${error}`);
            vscode.window.showErrorMessage(`Failed to open search: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    const googleSearchUrlCmd = vscode.commands.registerCommand(
        'kingsman.googleSearchUrl',
        async (args?: { query: string }): Promise<{ url: string } | undefined> => {
            const query = args?.query;
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                log('[Kingsman] googleSearchUrl: Missing or invalid query parameter');
                return undefined;
            }
            const url = generateSearchUrl(query);
            log(`[Kingsman] googleSearchUrl: ${url}`);
            return { url };
        }
    );

    const googleSearchWriteArtifactCmd = vscode.commands.registerCommand(
        'kingsman.googleSearchWriteArtifact',
        async (args?: { query: string; artifactPath?: string }): Promise<{ url: string; artifactPath: string } | undefined> => {
            const query = args?.query;
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                log('[Kingsman] googleSearchWriteArtifact: Missing or invalid query parameter');
                return undefined;
            }
            try {
                const url = generateSearchUrl(query);
                const artifactPath = await writeArtifact(query, url, args?.artifactPath);
                log(`[Kingsman] googleSearchWriteArtifact: URL=${url}`);
                log(`[Kingsman] googleSearchWriteArtifact: Artifact written to ${artifactPath}`);
                return { url, artifactPath };
            } catch (error) {
                log(`[Kingsman] googleSearchWriteArtifact error: ${error}`);
                return undefined;
            }
        }
    );

    const googleSearchOpenAndWriteCmd = vscode.commands.registerCommand(
        'kingsman.googleSearchOpenAndWrite',
        async (args?: { query: string }): Promise<{ url: string; artifactPath: string; opened: boolean } | undefined> => {
            const query = args?.query;
            if (!query || typeof query !== 'string' || query.trim().length === 0) {
                log('[Kingsman] googleSearchOpenAndWrite: Missing or invalid query parameter');
                return undefined;
            }
            try {
                const url = generateSearchUrl(query);
                const artifactPath = await writeArtifact(query, url);
                const uri = vscode.Uri.parse(url);
                const opened = await vscode.env.openExternal(uri);
                log(`[Kingsman] googleSearchOpenAndWrite: URL=${url}, opened=${opened}`);
                return { url, artifactPath, opened };
            } catch (error) {
                log(`[Kingsman] googleSearchOpenAndWrite error: ${error}`);
                return undefined;
            }
        }
    );

    // ========================================
    // SKILL STORE COMMANDS
    // ========================================

    const openStoreCmd = vscode.commands.registerCommand('kingsman.store.open', () => {
        StorePanel.createOrShow(context.extensionUri);
    });

    const storeSearchCmd = vscode.commands.registerCommand(
        'kingsman.store.search',
        async (args?: { query: string; filters?: object }): Promise<object | undefined> => {
            if (!args?.query) {
                log('[Kingsman] store.search: Missing query');
                return undefined;
            }
            try {
                const pat = await getPat();
                const result = await SkillRunner.search(args.query, pat, getCachePath());
                log(`[Kingsman] store.search: Found ${result.results?.length || 0} results`);
                return result;
            } catch (error) {
                log(`[Kingsman] store.search error: ${error}`);
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    );

    const storeInspectCmd = vscode.commands.registerCommand(
        'kingsman.store.inspect',
        async (args?: { repo: string }): Promise<object | undefined> => {
            if (!args?.repo) {
                log('[Kingsman] store.inspect: Missing repo');
                return undefined;
            }
            try {
                const pat = await getPat();
                const result = await SkillRunner.inspect(args.repo, pat);
                log(`[Kingsman] store.inspect: ${args.repo} -> ${result.category}`);
                return result;
            } catch (error) {
                log(`[Kingsman] store.inspect error: ${error}`);
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    );

    const storeStageCmd = vscode.commands.registerCommand(
        'kingsman.store.stage',
        async (args?: { repo: string }): Promise<object | undefined> => {
            if (!args?.repo) {
                log('[Kingsman] store.stage: Missing repo');
                return undefined;
            }
            try {
                const pat = await getPat();
                const result = await SkillRunner.stage(args.repo, getStagingPath(), pat);
                log(`[Kingsman] store.stage: ${args.repo} -> ${result.stagedId}`);
                return result;
            } catch (error) {
                log(`[Kingsman] store.stage error: ${error}`);
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    );

    const storeInstallCmd = vscode.commands.registerCommand(
        'kingsman.store.install',
        async (args?: { stagedId: string; target?: 'global' | 'workspace'; conversionPlan?: string; userApproved?: boolean }): Promise<object | undefined> => {
            if (!args?.stagedId) {
                log('[Kingsman] store.install: Missing stagedId');
                return undefined;
            }

            // SECURITY: Require explicit user approval for all installs
            // Agents cannot bypass this - they must set userApproved which triggers the dialog
            if (!args.userApproved) {
                const confirm = await vscode.window.showWarningMessage(
                    `Kingsman: Install skill from staged ID "${args.stagedId}"?`,
                    { modal: true, detail: 'This will copy files to your global skills folder. Only install from sources you trust.' },
                    'Install',
                    'Cancel'
                );
                if (confirm !== 'Install') {
                    log('[Kingsman] store.install: User cancelled');
                    return { cancelled: true };
                }
            }

            try {
                const result = await SkillRunner.install(
                    args.stagedId,
                    getStagingPath(),
                    getGlobalSkillsPath(),
                    getRegistryPath(),
                    args.conversionPlan
                );
                log(`[Kingsman] store.install: ${result.skillName} installed`);
                vscode.window.showInformationMessage(`Kingsman: Installed skill "${result.skillName}"`);
                return result;
            } catch (error) {
                log(`[Kingsman] store.install error: ${error}`);
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    );

    const storeListCmd = vscode.commands.registerCommand(
        'kingsman.store.listInstalled',
        async (): Promise<object | undefined> => {
            try {
                const result = await SkillRunner.listInstalled(getRegistryPath());
                log(`[Kingsman] store.listInstalled: ${result.skills?.length || 0} skills`);
                return result;
            } catch (error) {
                log(`[Kingsman] store.listInstalled error: ${error}`);
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    );

    const storeUninstallCmd = vscode.commands.registerCommand(
        'kingsman.store.uninstall',
        async (args?: { skillName: string }): Promise<object | undefined> => {
            if (!args?.skillName) {
                log('[Kingsman] store.uninstall: Missing skillName');
                return undefined;
            }
            try {
                const result = await SkillRunner.uninstall(
                    args.skillName,
                    getGlobalSkillsPath(),
                    getRegistryPath()
                );
                log(`[Kingsman] store.uninstall: ${args.skillName} uninstalled`);
                return result;
            } catch (error) {
                log(`[Kingsman] store.uninstall error: ${error}`);
                return { error: error instanceof Error ? error.message : 'Unknown error' };
            }
        }
    );

    // Register all commands
    context.subscriptions.push(
        // Legacy
        googleSearchCmd,
        googleSearchUrlCmd,
        googleSearchWriteArtifactCmd,
        googleSearchOpenAndWriteCmd,
        // Store
        openStoreCmd,
        storeSearchCmd,
        storeInspectCmd,
        storeStageCmd,
        storeInstallCmd,
        storeListCmd,
        storeUninstallCmd,
        outputChannel
    );

    log('[Kingsman] Extension activated successfully');
}

export function deactivate(): void {
    console.log('Kingsman extension deactivated.');
}
