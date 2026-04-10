# Context7 Library - Dokumentasi API Library

Library JavaScript untuk mengakses up-to-date dokumentasi dan code examples dari berbagai libraries dan frameworks menggunakan Context7 MCP API.

## 🚀 Installation

```bash
# No installation required - just require the library
const { Context7, createContext7 } = require('./lib/context7');
```

## 📦 Usage

### Basic Setup

```javascript
const { Context7 } = require('./lib/context7');

// Initialize with API key
const context7 = new Context7({
    apiKey: 'ctx7sk-your-api-key-here'
});
```

### Environment Variables

```bash
# Set API key as environment variable
export CONTEXT7_API_KEY=ctx7sk-your-api-key-here

# Or create .env file
echo "CONTEXT7_API_KEY=ctx7sk-your-api-key-here" > .env
```

### Configuration Options

```javascript
const context7 = new Context7({
    apiKey: 'ctx7sk-your-api-key-here',  // Required
    mcpUrl: 'https://mcp.context7.com/mcp'  // Optional: custom MCP URL
});
```

## 🎯 Main Methods

### `resolveLibraryId(libraryName, query)`

Cari dan dapatkan Context7-compatible library ID.

```javascript
const libraries = await context7.resolveLibraryId(
    'React',
    'How to use hooks for state management'
);

// Returns: Array of matching libraries
console.log(libraries);
```

### `searchLibrary(libraryName, query)`

Cari library dan dapatkan match terbaik.

```javascript
const bestLibrary = await context7.searchLibrary(
    'Express.js',
    'Authentication middleware setup'
);

// Returns: Best matching library object
console.log(bestLibrary);
```

### `queryDocs(libraryId, query)`

Ambil dokumentasi untuk library spesifik.

```javascript
const docs = await context7.queryDocs(
    '/websites/react_dev',
    'useEffect hook with cleanup'
);

// Returns: Array of documentation sections
console.log(docs);
```

### `getDocumentation(libraryName, query)`

Metode shortcut untuk mencari dan mengambil dokumentasi.

```javascript
const docs = await context7.getDocumentation(
    'React',
    'useState examples'
);

// Combines search and query in one call
```

## 📚 Response Formats

### Library Object

```javascript
{
    id: '/websites/react_dev',           // Context7-compatible library ID
    name: 'React',                          // Library name
    description: 'React is a JavaScript...',  // Library description
    snippets: 5724,                      // Number of code examples
    reputation: 'High',                     // Source reputation
    score: 90.05                          // Quality score (0-100)
    versions: ['v18.3.1', 'v19.1.1']  // Available versions
}
```

### Documentation Object

```javascript
{
    title: 'useState Hook - Counter Example',  // Section title
    source: 'https://react.dev/...',          // Documentation source
    content: [
        {
            type: 'text',                      // Content type: 'text' or 'code'
            content: 'This React component...'  // Content text or code
        }
    ]
}
```

## 🔌 Advanced Usage

### Express.js API Integration

```javascript
const express = require('express');
const { Context7 } = require('./lib/context7');

const app = express();
const context7 = new Context7({
    apiKey: process.env.CONTEXT7_API_KEY
});

// API endpoint for documentation search
app.get('/api/search-docs', async (req, res) => {
    try {
        const { library, query } = req.query;

        if (!library || !query) {
            return res.status(400).json({
                success: false,
                error: 'Library and query are required'
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
```

### Multiple Instances (Factory Pattern)

```javascript
const { Context7 } = require('./lib/context7');

// Create multiple instances for different environments
const prodClient = new Context7({
    apiKey: process.env.CONTEXT7_PROD_KEY
});

const devClient = new Context7({
    apiKey: process.env.CONTEXT7_DEV_KEY
});

// Use different instances for different needs
const prodDocs = await prodClient.getDocumentation('React', 'hooks');
const devDocs = await devClient.getDocumentation('React', 'hooks');
```

## 🎨 Examples

### Basic Usage

```javascript
const { Context7 } = require('./lib/context7');

const context7 = new Context7({
    apiKey: process.env.CONTEXT7_API_KEY
});

// Search for libraries
const libraries = await context7.resolveLibraryId('React', 'hooks');
console.log(`Found ${libraries.length} libraries`);

// Get best match
const bestLibrary = await context7.searchLibrary('Express.js', 'middleware');
console.log(`Best match: ${bestLibrary.name}`);

// Get documentation
const docs = await context7.getDocumentation('React', 'useState');
console.log(`Found ${docs.length} documentation sections`);
```

### Employee Attendance Integration

```javascript
const { Context7 } = require('./lib/context7');

const context7 = new Context7({
    apiKey: process.env.CONTEXT7_API_KEY
});

// Get authentication documentation for employee system
const authDocs = await context7.getDocumentation(
    'Express.js',
    'JWT authentication middleware'
);

// Use documentation to implement features
authDocs.forEach(doc => {
    console.log(`Feature: ${doc.title}`);
    // Implement based on documentation
});
```

## 🧪 Testing

### Run Examples

```bash
# Run all examples
node lib/context7.examples.js all

# Run specific example
node lib/context7.examples.js basic
node lib/context7.examples.js docs
node lib/context7.examples.js express
```

### Unit Testing

```javascript
const { Context7 } = require('./lib/context7');

const context7 = new Context7({
    apiKey: 'test-api-key'
});

// Test library search
async function testLibrarySearch() {
    const result = await context7.resolveLibraryId('React', 'hooks');
    console.assert(Array.isArray(result), 'Result should be array');
    console.assert(result.length > 0, 'Should find React libraries');
}

// Test documentation query
async function testDocumentationQuery() {
    const result = await context7.queryDocs(
        '/websites/react_dev',
        'useState'
    );
    console.assert(Array.isArray(result), 'Result should be array');
    console.assert(result.length > 0, 'Should find documentation');
}
```

## 📖 API Reference

### Constructor

```javascript
new Context7(config)
```

**Parameters:**
- `config.apiKey` (string, required): Context7 API key
- `config.mcpUrl` (string, optional): Custom MCP URL (default: 'https://mcp.context7.com/mcp')

**Throws:**
- Error jika API key tidak disediakan

### Methods

#### `async resolveLibraryId(libraryName, query)`

Parameters:
- `libraryName` (string, required): Library name untuk dicari
- `query` (string, required): Contextual query untuk ranking

Returns: `Promise<Array>` of library objects

#### `async searchLibrary(libraryName, query)`

Parameters:
- `libraryName` (string, required): Library name untuk dicari
- `query` (string, required): Contextual query

Returns: `Promise<object>` of best matching library atau null

#### `async queryDocs(libraryId, query)`

Parameters:
- `libraryId` (string, required): Context7-compatible library ID
- `query` (string, required): Documentation query

Returns: `Promise<Array>` of documentation objects

#### `async getDocumentation(libraryName, query)`

Parameters:
- `libraryName` (string, required): Library name
- `query` (string, required): Documentation query

Returns: `Promise<Array>` of documentation objects

#### `async initialize()`

Returns: `Promise<object>` dengan connection info

#### `async getTools()`

Returns: `Promise<Array>` of available tools

## 🐛 Error Handling

```javascript
const { Context7 } = require('./lib/context7');

const context7 = new Context7({
    apiKey: process.env.CONTEXT7_API_KEY
});

try {
    const docs = await context7.getDocumentation('React', 'useState');
    console.log('Success:', docs);
} catch (error) {
    if (error.message.includes('API key is required')) {
        console.error('Please set CONTEXT7_API_KEY environment variable');
    } else if (error.message.includes('Context7 API Error')) {
        console.error('API Error:', error.message);
    } else {
        console.error('Unexpected error:', error.message);
    }
}
```

## 🔧 Configuration

### Environment Variables

```bash
# Required
CONTEXT7_API_KEY=ctx7sk-your-api-key-here

# Optional
CONTEXT7_MCP_URL=https://mcp.context7.com/mcp
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:context7": "node lib/context7.examples.js all"
  }
}
```

## 📊 Performance

- **Speed**: ~200-500ms per query (tergantung pada kompleksitas)
- **Caching**: Context7 mengelola caching otomatik
- **Rate Limiting**: Ikuti rate limits dari Context7 API
- **Error Handling**: Automatic retry untuk transient errors

## 🔒 Security

### API Key Management

```javascript
// ✅ GOOD: Use environment variables
const context7 = new Context7({
    apiKey: process.env.CONTEXT7_API_KEY
});

// ❌ BAD: Hardcode API key
const context7 = new Context7({
    apiKey: 'ctx7sk-secret-key-here'
});
```

### Best Practices

1. **Selalu gunakan environment variables** untuk API keys
2. **Implement error handling** untuk network failures
3. **Gunakan rate limiting** jika mengakses dari server
4. **Cache results** jika data tidak sering berubah
5. **Validasi input** sebelum mengirim ke API

## 🌍 Supported Libraries

Context7 mendukung dokumentasi untuk berbagai libraries:

- **Frontend**: React, Vue, Angular, Svelte, Solid, Alpine.js
- **Backend**: Express.js, FastAPI, NestJS, Django, Spring Boot
- **Database**: PostgreSQL, MySQL, MongoDB, Redis
- **Tools**: Webpack, Vite, TypeScript, ESLint, Prettier
- **Cloud**: Vercel, AWS, Google Cloud, Azure, Supabase
- **Framework**: Next.js, Nuxt, Astro, Remix, Gatsby

## 📄 License

MIT License - Free untuk penggunaan komersial dan personal

## 🤝 Contributing

Untuk berkontribusi:
1. Fork repository
2. Buat feature branch
3. Commit perubahan
4. Push ke branch
5. Open Pull Request

## 📞 Support

Untuk bantuan:
- Context7 Documentation: https://context7.com/docs
- Context7 Dashboard: https://context7.com/dashboard
- GitHub Issues: https://github.com/context7/mcp/issues

## 🔄 Version History

### v1.0.0 (Current)
- Initial release
- Basic Context7 MCP integration
- Library search dan documentation query
- Error handling dan validation
- Example implementations

---

**Made with ❤️ menggunakan Context7 API**
*Up-to-date documentation, selalu!*