/**
 * Context7 Library Simple Test
 * Quick test to verify Context7 library is working correctly
 */

const { Context7 } = require('./context7');

// Test configuration
const CONFIG = {
    apiKey: process.env.CONTEXT7_API_KEY
};

async function runTests() {
    console.log('🧪 Context7 Library Test Suite\n');
    console.log('='.repeat(50));

    try {
        if (!CONFIG.apiKey) {
            throw new Error('CONTEXT7_API_KEY belum diset');
        }

        const context7 = new Context7(CONFIG);

        // Test 1: Initialize connection
        console.log('\n✅ Test 1: Initialize Connection');
        const initResult = await context7.initialize();
        console.log(`   Protocol: ${initResult.protocolVersion}`);
        console.log(`   Server: ${initResult.serverInfo.name} v${initResult.serverInfo.version}`);
        console.log('   ✅ Connection successful!');

        // Test 2: Get available tools
        console.log('\n✅ Test 2: Get Available Tools');
        const tools = await context7.getTools();
        console.log(`   Found ${tools.length} tools`);
        tools.forEach(tool => {
            console.log(`   - ${tool.name}`);
        });
        console.log('   ✅ Tools retrieved successfully!');

        // Test 3: Resolve library ID
        console.log('\n✅ Test 3: Resolve Library ID');
        const libraries = await context7.resolveLibraryId('React', 'hooks');
        console.log(`   Found ${libraries.length} React libraries`);
        if (libraries.length > 0) {
            console.log(`   Best match: ${libraries[0].name}`);
            console.log(`   Score: ${libraries[0].score}`);
            console.log('   ✅ Library resolution successful!');
        }

        // Test 4: Search best library
        console.log('\n✅ Test 4: Search Best Library');
        const bestLibrary = await context7.searchLibrary('Express.js', 'middleware');
        if (bestLibrary) {
            console.log(`   Best match: ${bestLibrary.name}`);
            console.log(`   Reputation: ${bestLibrary.reputation}`);
            console.log(`   Snippets: ${bestLibrary.snippets}`);
            console.log('   ✅ Best match found!');
        }

        // Test 5: Get documentation
        console.log('\n✅ Test 5: Get Documentation');
        const docs = await context7.getDocumentation('React', 'useState');
        console.log(`   Found ${docs.length} documentation sections`);
        if (docs.length > 0) {
            console.log(`   First section: ${docs[0].title}`);
            console.log(`   Content items: ${docs[0].content.length}`);
            console.log('   ✅ Documentation retrieved successfully!');
        }

        // All tests passed
        console.log('\n' + '='.repeat(50));
        console.log('✅ ALL TESTS PASSED!');
        console.log('='.repeat(50));
        console.log('\n🎉 Context7 Library is working correctly!');

    } catch (error) {
        console.error('\n' + '='.repeat(50));
        console.error('❌ TEST FAILED!');
        console.error('='.repeat(50));
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    runTests();
}
