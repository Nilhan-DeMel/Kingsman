import * as vscode from 'vscode';

/**
 * Called when the extension is activated.
 * Registers the Kingsman: Google Search command.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('Kingsman extension is now active!');

    // Register the Google Search command
    const disposable = vscode.commands.registerCommand('kingsman.googleSearch', async () => {
        // Prompt user for search query
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

        // User cancelled the input
        if (query === undefined) {
            return;
        }

        // Get the base URL from configuration
        const config = vscode.workspace.getConfiguration('kingsman');
        const baseUrl = config.get<string>('searchBaseUrl', 'https://www.google.com/search?q=');

        // Encode the query and construct the full URL
        const encodedQuery = encodeURIComponent(query.trim());
        const searchUrl = `${baseUrl}${encodedQuery}`;

        // Log the URL for evidence/debugging
        console.log(`[Kingsman] Opening search URL: ${searchUrl}`);

        // Open the URL in the default browser
        try {
            const uri = vscode.Uri.parse(searchUrl);
            const success = await vscode.env.openExternal(uri);

            if (success) {
                vscode.window.showInformationMessage(`Searching for: ${query}`);
            } else {
                vscode.window.showErrorMessage('Failed to open browser. Please try again.');
            }
        } catch (error) {
            console.error('[Kingsman] Error opening URL:', error);
            vscode.window.showErrorMessage(`Failed to open search: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    context.subscriptions.push(disposable);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
    console.log('Kingsman extension deactivated.');
}
