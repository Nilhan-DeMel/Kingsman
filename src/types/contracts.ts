/**
 * Kingsman Store - TypeScript Contracts
 * Shared type definitions for extension and skill communication
 */

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchResult {
    id: string;                    // "owner/repo"
    name: string;                  // Repository name
    owner: string;                 // Repository owner
    description: string;           // Repository description
    stars?: number;                // Star count
    forks?: number;                // Fork count
    lastUpdated?: string;          // ISO date
    license?: string | null;       // SPDX license ID
    hasSkillMd: boolean;           // Has SKILL.md file
    skillPaths: string[];          // Paths to skill folders
    source: 'github-code-search' | 'github-repo-search' | 'huggingface';
    score: number;                 // Ranking score (0-1)
}

export interface SearchResponse {
    results: SearchResult[];
    rateLimitRemaining: number;
    cached: boolean;
    query: string;
    expandedTerms: string[];
    error?: string;
}

// ============================================
// INSPECTION TYPES
// ============================================

export type CategoryType = 'A' | 'B' | 'C';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface SkillInfo {
    path: string;                  // Path within repo
    name: string | null;           // Skill name from frontmatter
    description: string | null;    // Skill description
}

export interface ConversionPlan {
    proposedName: string;          // Suggested skill folder name
    keep: string[];                // Files/folders to keep
    ignore: string[];              // Files/folders to ignore
    dependencies: string[];        // Required runtime deps
    skillMdProposal: string;       // Generated SKILL.md content
}

export interface RiskReport {
    level: RiskLevel;
    binaries: string[];            // Binary file paths
    scripts: string[];             // Script file paths
    suspiciousPatterns: string[];  // Dangerous pattern matches
    npmHooks: string[];            // npm lifecycle hooks
}

export interface InspectionResult {
    id: string;                    // "owner/repo"
    category: CategoryType;
    confidence: number;            // 0-100
    explanation: string;
    skills: SkillInfo[];
    conversionPlan: ConversionPlan | null;
    riskReport: RiskReport;
    repoInfo?: {
        stars: number;
        license: string | null;
        lastUpdated: string;
    };
    error?: string;
}

// ============================================
// INSTALLER TYPES
// ============================================

export interface StagingInfo {
    stagedId: string;
    repo: string;
    skillName: string;
    sourcePath: string;
    hasSkillMd: boolean;
    stagedAt: string;
}

export interface StageResponse {
    stagedId: string;
    repo: string;
    skillName: string;
    sourcePath: string;
    hasSkillMd: boolean;
    stagedAt: string;
    error?: string;
}

export interface InstallResponse {
    installed: boolean;
    skillName: string;
    skillPath: string;
    registryEntry: RegistryEntry;
    error?: string;
}

export interface RegistryEntry {
    skillName: string;
    sourceUrl: string;
    installedAt: string;
    installPath: string;
    stagedId?: string;
    version?: string;
    riskLevel?: RiskLevel;
}

export interface Registry {
    skills: RegistryEntry[];
}

export interface ListResponse {
    skills: RegistryEntry[];
    error?: string;
}

export interface UninstallResponse {
    uninstalled: boolean;
    skillName: string;
    error?: string;
}

// ============================================
// WEBVIEW MESSAGE TYPES
// ============================================

export type WebviewMessageType =
    | 'search'
    | 'inspect'
    | 'stage'
    | 'install'
    | 'listInstalled'
    | 'uninstall'
    | 'setPat'
    | 'getPat'
    | 'openExternal';

export interface WebviewMessage {
    type: WebviewMessageType;
    id: string;                    // Request ID for response matching
    payload?: unknown;
}

export interface WebviewResponse {
    type: 'response';
    id: string;                    // Matching request ID
    success: boolean;
    data?: unknown;
    error?: string;
}

// ============================================
// COMMAND ARGS
// ============================================

export interface SearchArgs {
    query: string;
    filters?: {
        source?: 'all' | 'github' | 'huggingface';
        skillOnly?: boolean;
        license?: string;
    };
}

export interface InspectArgs {
    repo: string;                  // "owner/repo"
}

export interface StageArgs {
    repo: string;
}

export interface InstallArgs {
    stagedId: string;
    target: 'global' | 'workspace';
    conversionPlan?: ConversionPlan;
}

export interface UninstallArgs {
    skillName: string;
}
