/**
 * Context7 Library for Documentation Search
 * Provides up-to-date documentation and code examples for libraries and frameworks
 *
 * @version 1.0.0
 * @author Claude Code
 */

class Context7 {
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.CONTEXT7_API_KEY;
        this.mcpUrl = config.mcpUrl || 'https://mcp.context7.com/mcp';
        this.requestId = 100;

        if (!this.apiKey) {
            throw new Error('Context7 API key is required');
        }
    }

    /**
     * Make request to Context7 MCP server
     * @param {string} method - MCP method name
     * @param {object} params - Method parameters
     * @returns {Promise<object>} MCP response
     */
    async callMCP(method, params = {}) {
        const payload = {
            jsonrpc: '2.0',
            id: this.requestId++,
            method: method,
            params: params
        };

        try {
            const response = await fetch(this.mcpUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json, text/event-stream',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.message || 'Context7 API Error');
            }

            return data.result;
        } catch (error) {
            console.error('Context7 MCP Error:', error);
            throw error;
        }
    }

    /**
     * Resolve library name to Context7-compatible library ID
     * @param {string} libraryName - Library name to search for
     * @param {string} query - Contextual query for ranking
     * @returns {Promise<Array>} Array of matching libraries
     */
    async resolveLibraryId(libraryName, query) {
        try {
            const result = await this.callMCP('tools/call', {
                name: 'resolve-library-id',
                arguments: {
                    libraryName: libraryName,
                    query: query
                }
            });

            if (result && result.content && result.content[0]) {
                const text = result.content[0].text;
                return this.parseLibraryResults(text);
            }

            return [];
        } catch (error) {
            console.error('Error resolving library ID:', error);
            throw error;
        }
    }

    /**
     * Parse library results from MCP response
     * @param {string} text - Raw response text
     * @returns {Array} Array of parsed library objects
     */
    parseLibraryResults(text) {
        const libraries = [];
        const sections = text.split('----------');

        sections.forEach(section => {
            const lines = section.trim().split('\n').filter(line => line.trim());
            if (lines.length > 0) {
                const library = {};
                lines.forEach(line => {
                    if (line.includes('Context7-compatible library ID:')) {
                        library.id = line.split(':').pop().trim();
                    } else if (line.includes('Title:')) {
                        library.name = line.split(':').pop().trim();
                    } else if (line.includes('Description:')) {
                        library.description = line.split(':').slice(1).join(':').trim();
                    } else if (line.includes('Code Snippets:')) {
                        library.snippets = parseInt(line.split(':').pop().trim());
                    } else if (line.includes('Source Reputation:')) {
                        library.reputation = line.split(':').pop().trim();
                    } else if (line.includes('Benchmark Score:')) {
                        library.score = parseFloat(line.split(':').pop().trim());
                    }
                });

                if (library.id && library.name) {
                    libraries.push(library);
                }
            }
        });

        return libraries;
    }

    /**
     * Query documentation for a specific library
     * @param {string} libraryId - Context7-compatible library ID
     * @param {string} query - Documentation query
     * @returns {Promise<Array>} Array of documentation sections
     */
    async queryDocs(libraryId, query) {
        try {
            const result = await this.callMCP('tools/call', {
                name: 'query-docs',
                arguments: {
                    libraryId: libraryId,
                    query: query
                }
            });

            if (result && result.content && result.content[0]) {
                const text = result.content[0].text;
                return this.parseDocumentationResults(text);
            }

            return [];
        } catch (error) {
            console.error('Error querying documentation:', error);
            throw error;
        }
    }

    /**
     * Parse documentation results from MCP response
     * @param {string} text - Raw response text
     * @returns {Array} Array of parsed documentation objects
     */
    parseDocumentationResults(text) {
        const docs = [];
        const sections = text.split('--------------------------------');

        sections.forEach(section => {
            const lines = section.trim().split('\n').filter(line => line.trim());
            if (lines.length > 0) {
                const doc = {
                    title: lines[0].replace('###', '').trim(),
                    content: []
                };

                let inCodeBlock = false;
                let codeBlock = '';

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i];

                    if (line.includes('Source:')) {
                        doc.source = line.replace('Source:', '').trim();
                    } else if (line.trim().startsWith('```')) {
                        if (inCodeBlock) {
                            doc.content.push({ type: 'code', content: codeBlock });
                            codeBlock = '';
                            inCodeBlock = false;
                        } else {
                            inCodeBlock = true;
                        }
                    } else if (inCodeBlock) {
                        codeBlock += line + '\n';
                    } else if (line.trim() && !line.startsWith('###')) {
                        doc.content.push({ type: 'text', content: line.trim() });
                    }
                }

                if (doc.title || doc.content.length > 0) {
                    docs.push(doc);
                }
            }
        });

        return docs;
    }

    /**
     * Search for libraries and return best match
     * @param {string} libraryName - Library name to search
     * @param {string} query - Contextual query
     * @returns {Promise<object>} Best matching library
     */
    async searchLibrary(libraryName, query) {
        try {
            const libraries = await this.resolveLibraryId(libraryName, query);

            if (libraries.length === 0) {
                return null;
            }

            // Return best match based on score and reputation
            return libraries.reduce((best, current) => {
                if (!best) return current;

                const currentScore = current.score || 0;
                const bestScore = best.score || 0;

                if (currentScore > bestScore) {
                    return current;
                } else if (currentScore === bestScore) {
                    // Prefer higher reputation
                    const reputationPriority = { 'High': 3, 'Medium': 2, 'Low': 1, 'Unknown': 0 };
                    const currentRep = reputationPriority[current.reputation] || 0;
                    const bestRep = reputationPriority[best.reputation] || 0;
                    return currentRep > bestRep ? current : best;
                }

                return best;
            }, null);
        } catch (error) {
            console.error('Error searching library:', error);
            throw error;
        }
    }

    /**
     * Get documentation for library with best match
     * @param {string} libraryName - Library name
     * @param {string} query - Documentation query
     * @returns {Promise<Array>} Documentation results
     */
    async getDocumentation(libraryName, query) {
        try {
            const library = await this.searchLibrary(libraryName, query);

            if (!library) {
                return [];
            }

            return await this.queryDocs(library.id, query);
        } catch (error) {
            console.error('Error getting documentation:', error);
            throw error;
        }
    }

    /**
     * Initialize Context7 MCP connection
     * @returns {Promise<object>} Server information
     */
    async initialize() {
        try {
            const result = await this.callMCP('initialize', {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'Context7-Client',
                    version: '1.0.0'
                }
            });

            return {
                protocolVersion: result.protocolVersion,
                serverInfo: result.serverInfo,
                capabilities: result.capabilities
            };
        } catch (error) {
            console.error('Error initializing Context7:', error);
            throw error;
        }
    }

    /**
     * Get available tools
     * @returns {Promise<Array>} Array of available tools
     */
    async getTools() {
        try {
            const result = await this.callMCP('tools/list');
            return result.tools || [];
        } catch (error) {
            console.error('Error getting tools:', error);
            throw error;
        }
    }
}

/**
 * Factory function to create Context7 instance
 * @param {object} config - Configuration options
 * @returns {Context7} Context7 instance
 */
function createContext7(config = {}) {
    return new Context7(config);
}

module.exports = { Context7, createContext7 };
