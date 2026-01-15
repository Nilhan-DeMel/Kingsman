#!/usr/bin/env node
/**
 * Kingsman MCP Server
 * Provides a google_search_url tool for agents via Model Context Protocol
 * 
 * Usage: Register in mcp_config.json:
 * {
 *   "kingsman-search": {
 *     "command": "node",
 *     "args": ["path/to/Kingsman/skills/kingsman-mcp/index.js"]
 *   }
 * }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Default search base URL
const DEFAULT_BASE_URL = 'https://www.google.com/search?q=';

/**
 * Generate a Google Search URL for the given query
 */
function generateSearchUrl(query, baseUrl = DEFAULT_BASE_URL) {
    const encodedQuery = encodeURIComponent(query.trim());
    return `${baseUrl}${encodedQuery}`;
}

// Create MCP server
const server = new Server(
    {
        name: 'kingsman-search',
        version: '0.1.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'google_search_url',
                description: 'Generate a Google Search URL for a query. Returns the URL without opening a browser.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'The search query to encode'
                        },
                        baseUrl: {
                            type: 'string',
                            description: 'Optional custom base URL (default: https://www.google.com/search?q=)'
                        }
                    },
                    required: ['query']
                }
            }
        ]
    };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'google_search_url') {
        const query = args?.query;
        const baseUrl = args?.baseUrl || DEFAULT_BASE_URL;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({ error: 'Missing or invalid query parameter' })
                    }
                ],
                isError: true
            };
        }

        const url = generateSearchUrl(query, baseUrl);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        url: url,
                        query: query,
                        timestamp: new Date().toISOString(),
                        source: 'kingsman-mcp'
                    })
                }
            ]
        };
    }

    return {
        content: [
            {
                type: 'text',
                text: JSON.stringify({ error: `Unknown tool: ${name}` })
            }
        ],
        isError: true
    };
});

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[kingsman-mcp] Server started');
}

main().catch((error) => {
    console.error('[kingsman-mcp] Fatal error:', error);
    process.exit(1);
});
