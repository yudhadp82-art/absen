const { Context7 } = require('./context7');

function isContext7Configured() {
  return Boolean(process.env.CONTEXT7_API_KEY);
}

function createContext7Client() {
  return new Context7({
    apiKey: process.env.CONTEXT7_API_KEY,
    mcpUrl: process.env.CONTEXT7_MCP_URL
  });
}

function validateContext7Request(body = {}) {
  const mode = body.mode === 'docs' ? 'docs' : 'resolve';
  const libraryName = typeof body.libraryName === 'string' ? body.libraryName.trim() : '';
  const libraryId = typeof body.libraryId === 'string' ? body.libraryId.trim() : '';
  const query = typeof body.query === 'string' ? body.query.trim() : '';

  if (!query) {
    return { error: 'Field "query" wajib diisi' };
  }

  if (mode === 'docs' && !libraryId && !libraryName) {
    return { error: 'Field "libraryId" atau "libraryName" wajib diisi untuk mode docs' };
  }

  if (mode === 'resolve' && !libraryName) {
    return { error: 'Field "libraryName" wajib diisi untuk mode resolve' };
  }

  return { mode, libraryName, libraryId, query };
}

async function executeContext7Request(input) {
  const context7 = createContext7Client();

  if (input.mode === 'resolve') {
    const libraries = await context7.resolveLibraryId(input.libraryName, input.query);
    return {
      success: true,
      mode: input.mode,
      data: libraries,
      count: libraries.length
    };
  }

  if (input.libraryId) {
    const docs = await context7.queryDocs(input.libraryId, input.query);
    return {
      success: true,
      mode: input.mode,
      libraryId: input.libraryId,
      data: docs,
      count: docs.length
    };
  }

  const library = await context7.searchLibrary(input.libraryName, input.query);

  if (!library) {
    return {
      success: true,
      mode: input.mode,
      library: null,
      data: [],
      count: 0
    };
  }

  const docs = await context7.queryDocs(library.id, input.query);
  return {
    success: true,
    mode: input.mode,
    library,
    libraryId: library.id,
    data: docs,
    count: docs.length
  };
}

module.exports = {
  isContext7Configured,
  validateContext7Request,
  executeContext7Request
};
