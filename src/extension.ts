import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Output channel for agent-readable logs
let outputChannel: vscode.OutputChannel;

/**
 * Generates a Google Search URL for the given query
 */
function generateSearchUrl(query: string): string {
    const config = vscode.workspace.getConfiguration('kingsman');
    const baseUrl = config.get<string>('searchBaseUrl', 'https://www.google.com/search?q=');
    const encodedQuery = encodeURIComponent(query.trim());
    return `${baseUrl}${encodedQuery}`;
}

/**
 * Logs to both console and OutputChannel for agent visibility
 */
function log(message: string): void {
    console.log(message);
    if (outputChannel) {
        outputChannel.appendLine(message);
    }
}

/**
 * Writes artifact JSON to workspace for agent consumption
 */
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

    // Ensure directory exists
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

/**
 * Called when the extension is activated.
 */
export function activate(context: vscode.ExtensionContext): void {
    // Create output channel for agent visibility
    outputChannel = vscode.window.createOutputChannel('Kingsman');
    log('[Kingsman] Extension activated');

    // ========================================
    // COMMAND 1: Interactive Google Search (for humans)
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

        if (query === undefined) {
            return;
        }

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

    // ========================================
    // COMMAND 2: Get URL only (for agents - no UI)
    // ========================================
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

    // ========================================
    // COMMAND 3: Write artifact file (for agents)
    // ========================================
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

    // ========================================
    // COMMAND 4: Open URL and write artifact (combined)
    // ========================================
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
                
                // Also open in browser
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

    context.subscriptions.push(
        googleSearchCmd,
        googleSearchUrlCmd,
        googleSearchWriteArtifactCmd,
        googleSearchOpenAndWriteCmd,
        outputChannel
    );
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
    console.log('Kingsman extension deactivated.');
}
