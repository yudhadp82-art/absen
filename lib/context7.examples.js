/**
 * Context7 Library Usage Examples
 * Demonstrates how to use Context7 as a library in your application
 */

const { Context7, createContext7 } = require('./context7');

// Configuration
const CONFIG = {
    apiKey: 'ctx7sk-90392380-5918-4360-841f-93e51cdcd880', // Replace with your API key
    mcpUrl: 'https://mcp.context7.com/mcp'
};

// Initialize Context7 client
const context7 = new Context7(CONFIG);

// ========================================
// Example 1: Basic Library Search
// ========================================
async function basicLibrarySearch() {
    console.log('🔍 Example 1: Basic Library Search\n');

    try {
        const libraries = await context7.resolveLibraryId(
            'React',
            'How to use hooks for state management'
        );

        console.log('Found libraries:', libraries.length);
        libraries.forEach((lib, index) => {
            console.log(`\n${index + 1}. ${lib.name}`);
            console.log(`   ID: ${lib.id}`);
            console.log(`   Score: ${lib.score}`);
            console.log(`   Reputation: ${lib.reputation}`);
            console.log(`   Snippets: ${lib.snippets}`);
            console.log(`   Description: ${lib.description.substring(0, 80)}...`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// ========================================
// Example 2: Get Best Library Match
// ========================================
async function getBestLibraryMatch() {
    console.log('\n🎯 Example 2: Get Best Library Match\n');

    try {
        const bestLibrary = await context7.searchLibrary(
            'Express.js',
            'Authentication middleware setup'
        );

        if (bestLibrary) {
            console.log('✅ Best match found:');
            console.log(`   Name: ${bestLibrary.name}`);
            console.log(`   ID: ${bestLibrary.id}`);
            console.log(`   Score: ${bestLibrary.score}`);
            console.log(`   Reputation: ${bestLibrary.reputation}`);
            console.log(`   Description: ${bestLibrary.description}`);
        } else {
            console.log('❌ No matching library found');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// ========================================
// Example 3: Get Documentation
// ========================================
async function getLibraryDocumentation() {
    console.log('\n📚 Example 3: Get Documentation\n');

    try {
        const docs = await context7.getDocumentation(
            'React',
            'useEffect hook with cleanup'
        );

        console.log(`Found ${docs.length} documentation sections:\n`);

        docs.forEach((doc, index) => {
            console.log(`\n${index + 1}. ${doc.title}`);
            if (doc.source) {
                console.log(`   Source: ${doc.source}`);
            }

            console.log('   Content:');
            doc.content.forEach(item => {
                if (item.type === 'code') {
                    console.log('   📄 Code Example:');
                    console.log('   ' + '-'.repeat(50));
                    console.log('   ' + item.content.split('\n').map(line => '   ' + line).join('\n'));
                    console.log('   ' + '-'.repeat(50));
                } else if (item.type === 'text') {
                    console.log(`   📝 ${item.content.substring(0, 100)}...`);
                }
            });
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// ========================================
// Example 4: Integration with Express.js
// ========================================
async function expressIntegration() {
    console.log('\n🌐 Example 4: Express.js Integration\n');

    const express = require('express');
    const app = express();

    // Context7 endpoint
    app.get('/api/search-docs', async (req, res) => {
        try {
            const { library, query } = req.query;

            if (!library || !query) {
                return res.status(400).json({
                    success: false,
                    error: 'Library and query parameters are required'
                });
            }

            const docs = await context7.getDocumentation(library, query);

            res.json({
                success: true,
                data: docs,
                count: docs.length
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    console.log('✅ Express.js API endpoint created: /api/search-docs');
}

// ========================================
// Example 5: Employee Attendance Integration
// ========================================
async function employeeAttendanceIntegration() {
    console.log('\n👥 Example 5: Employee Attendance Integration\n');

    try {
        // Search for Express.js documentation for authentication
        const docs = await context7.getDocumentation(
            'Express.js',
            'JWT authentication middleware implementation'
        );

        console.log('✅ Found authentication documentation:');
        docs.forEach(doc => {
            console.log(`\n${doc.title}`);
            doc.content.filter(item => item.type === 'text').forEach(item => {
                console.log(`  ${item.content.substring(0, 120)}`);
            });
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// ========================================
// Example 6: Multiple Library Comparison
// ========================================
async function compareLibraries() {
    console.log('\n⚖️ Example 6: Compare Multiple Libraries\n');

    try {
        // Search for both React and Vue documentation
        const reactDocs = await context7.getDocumentation('React', 'component lifecycle');
        const vueDocs = await context7.getDocumentation('Vue', 'component lifecycle');

        console.log('📊 Comparison Results:');
        console.log(`\nReact: ${reactDocs.length} documentation sections found`);
        console.log(`Vue: ${vueDocs.length} documentation sections found`);

        // Compare snippet counts
        const reactLibs = await context7.searchLibrary('React', 'component lifecycle');
        const vueLibs = await context7.searchLibrary('Vue', 'component lifecycle');

        if (reactLibs && vueLibs) {
            console.log(`\nReact Library Score: ${reactLibs.score}`);
            console.log(`Vue Library Score: ${vueLibs.score}`);
            console.log(`React Snippets: ${reactLibs.snippets}`);
            console.log(`Vue Snippets: ${vueLibs.snippets}`);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// ========================================
// Example 7: Factory Pattern Usage
// ========================================
async function factoryPatternUsage() {
    console.log('\n🏭 Example 7: Factory Pattern Usage\n');

    // Create multiple Context7 instances with different configs
    const prodClient = new Context7({
        apiKey: process.env.CONTEXT7_PROD_KEY,
        mcpUrl: 'https://mcp.context7.com/mcp'
    });

    const devClient = new Context7({
        apiKey: process.env.CONTEXT7_DEV_KEY,
        mcpUrl: 'https://mcp.context7.com/mcp'
    });

    console.log('✅ Multiple Context7 instances created');
    console.log('   Production Client: Ready');
    console.log('   Development Client: Ready');
}

// ========================================
// Example 8: Advanced Usage with Error Handling
// ========================================
async function advancedUsage() {
    console.log('\n⚡ Example 8: Advanced Usage with Error Handling\n');

    try {
        // First, check available tools
        const tools = await context7.getTools();
        console.log(`📦 Available tools: ${tools.length}`);
        tools.forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description.substring(0, 60)}...`);
        });

        // Initialize connection
        const initResult = await context7.initialize();
        console.log('🔌 Connection initialized:');
        console.log(`   Protocol: ${initResult.protocolVersion}`);
        console.log(`   Server: ${initResult.serverInfo.name} v${initResult.serverInfo.version}`);
        console.log(`   Description: ${initResult.serverInfo.description}`);

        // Search and get documentation in one call
        const query = 'How to implement OAuth 2.0';
        const bestLib = await context7.searchLibrary('Express.js', query);

        if (bestLib) {
            console.log(`\n📚 Best match: ${bestLib.name}`);
            const docs = await context7.queryDocs(bestLib.id, query);

            console.log(`📄 Found ${docs.length} documentation sections`);
            docs.forEach((doc, i) => {
                console.log(`\n${i + 1}. ${doc.title}`);
                if (doc.source) {
                    console.log(`   📍 Source: ${doc.source}`);
                }

                const codeExamples = doc.content.filter(c => c.type === 'code');
                if (codeExamples.length > 0) {
                    console.log(`   💻 ${codeExamples.length} code example(s)`);
                }
            });
        }
    } catch (error) {
        if (error.message.includes('API key is required')) {
            console.error('❌ Context7 API key not configured');
            console.error('   Please set CONTEXT7_API_KEY environment variable');
        } else {
            console.error('❌ Error:', error.message);
        }
    }
}

// ========================================
// Run All Examples
// ========================================
async function runAllExamples() {
    console.log('🚀 Context7 Library Examples\n');
    console.log('='.repeat(50));

    // Run examples sequentially
    await basicLibrarySearch();
    await getBestLibraryMatch();
    await getLibraryDocumentation();
    await employeeAttendanceIntegration();
    await compareLibraries();
    await advancedUsage();

    console.log('\n✅ All examples completed successfully!');
    console.log('='.repeat(50));
}

// ========================================
// Main Entry Point
// ========================================
if (require.main === module) {
    // Run specific example
    const example = process.argv[2];

    switch (example) {
        case 'basic':
            basicLibrarySearch();
            break;
        case 'best-match':
            getBestLibraryMatch();
            break;
        case 'docs':
            getLibraryDocumentation();
            break;
        case 'express':
            expressIntegration();
            break;
        case 'attendance':
            employeeAttendanceIntegration();
            break;
        case 'compare':
            compareLibraries();
            break;
        case 'advanced':
            advancedUsage();
            break;
        case 'all':
        default:
            runAllExamples();
    }
}

// Export functions for programmatic use
module.exports = {
    basicLibrarySearch,
    getBestLibraryMatch,
    getLibraryDocumentation,
    expressIntegration,
    employeeAttendanceIntegration,
    compareLibraries,
    factoryPatternUsage,
    advancedUsage,
    runAllExamples
};