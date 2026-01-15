/**
 * Kingsman Store - GitHub Authentication
 * Manages PAT storage via VS Code SecretStorage
 */

import * as vscode from 'vscode';

const SECRET_KEY = 'kingsman.github-pat';

let secretStorage: vscode.SecretStorage | null = null;

/**
 * Initialize secret storage
 */
export function initSecretStorage(context: vscode.ExtensionContext): void {
    secretStorage = context.secrets;
}

/**
 * Store GitHub PAT securely
 */
export async function storePat(pat: string): Promise<void> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    await secretStorage.store(SECRET_KEY, pat);
}

/**
 * Retrieve stored GitHub PAT
 */
export async function getPat(): Promise<string | undefined> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    return secretStorage.get(SECRET_KEY);
}

/**
 * Delete stored GitHub PAT
 */
export async function deletePat(): Promise<void> {
    if (!secretStorage) {
        throw new Error('Secret storage not initialized');
    }
    await secretStorage.delete(SECRET_KEY);
}

/**
 * Check if PAT is stored
 */
export async function hasPat(): Promise<boolean> {
    const pat = await getPat();
    return pat !== undefined && pat.length > 0;
}

/**
 * Prompt user to enter PAT
 */
export async function promptForPat(): Promise<string | undefined> {
    const pat = await vscode.window.showInputBox({
        prompt: 'Enter your GitHub Personal Access Token',
        placeHolder: 'ghp_xxxxxxxxxxxx',
        password: true,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return 'Please enter a valid PAT';
            }
            if (!value.startsWith('ghp_') && !value.startsWith('github_pat_')) {
                return 'PAT should start with ghp_ or github_pat_';
            }
            return null;
        }
    });

    if (pat) {
        await storePat(pat);
        vscode.window.showInformationMessage('GitHub PAT saved securely.');
    }

    return pat;
}

/**
 * Get PAT or prompt for it
 */
export async function getOrPromptPat(): Promise<string | undefined> {
    let pat = await getPat();

    if (!pat) {
        pat = await promptForPat();
    }

    return pat;
}
