// Context7 Documentation Integration
const Context7 = {
    apiKey: 'ctx7sk-90392380-5918-4360-841f-93e51cdcd880',
    mcpUrl: 'https://mcp.context7.com/mcp',
    requestId: 100,

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
            console.log('Context7 MCP Response:', data);

            if (data.error) {
                throw new Error(data.error.message || 'Context7 API Error');
            }

            return data.result;
        } catch (error) {
            console.error('Context7 MCP Error:', error);
            throw error;
        }
    },

    async resolveLibraryId(libraryName, query) {
        try {
            App.showLoading('Mencari library...');

            const result = await this.callMCP('tools/call', {
                name: 'resolve-library-id',
                arguments: {
                    libraryName: libraryName,
                    query: query
                }
            });

            App.hideLoading();

            if (result && result.content && result.content[0]) {
                const text = result.content[0].text;
                return this.parseLibraryResults(text);
            }

            return [];
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
            return [];
        }
    },

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
    },

    async queryDocs(libraryId, query) {
        try {
            App.showLoading('Mengambil dokumentasi...');

            const result = await this.callMCP('tools/call', {
                name: 'query-docs',
                arguments: {
                    libraryId: libraryId,
                    query: query
                }
            });

            App.hideLoading();

            if (result && result.content && result.content[0]) {
                const text = result.content[0].text;
                return this.parseDocumentationResults(text);
            }

            return [];
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
            return [];
        }
    },

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
    },

    async searchLibrary() {
        const libraryName = document.getElementById('context7LibraryName').value.trim();
        const query = document.getElementById('context7Query').value.trim();

        if (!libraryName || !query) {
            App.showToast('Nama library dan query wajib diisi!', 'error');
            return;
        }

        const libraries = await this.resolveLibraryId(libraryName, query);

        const resultsContainer = document.getElementById('context7LibraryResults');
        const libraryResultsCard = document.getElementById('libraryResultsCard');

        libraryResultsCard.style.display = 'block';

        if (libraries.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>❌ Tidak ditemukan library yang cocok</p>
                </div>
            `;
            return;
        }

        resultsContainer.innerHTML = libraries.map(lib => `
            <div class="context7-library-card" onclick="Context7.selectLibrary('${lib.id}', '${lib.name.replace(/'/g, "\\'")}')">
                <div class="library-header">
                    <h4>${lib.name}</h4>
                    <div class="library-score">
                        <span class="score-badge score-${lib.score >= 80 ? 'high' : lib.score >= 60 ? 'medium' : 'low'}">
                            ${lib.score.toFixed(1)}
                        </span>
                    </div>
                </div>
                <p class="library-description">${lib.description}</p>
                <div class="library-meta">
                    <span class="meta-item">
                        <span class="meta-icon">📚</span>
                        ${lib.snippets} snippets
                    </span>
                    <span class="meta-item">
                        <span class="meta-icon">⭐</span>
                        ${lib.reputation}
                    </span>
                    <span class="meta-item">
                        <span class="meta-icon">🆔</span>
                        ${lib.id}
                    </span>
                </div>
            </div>
        `).join('');
    },

    async selectLibrary(libraryId, libraryName) {
        document.getElementById('selectedLibraryId').value = libraryId;
        document.getElementById('selectedLibraryName').textContent = libraryName;
        document.getElementById('selectedLibraryCard').style.display = 'block';

        const query = document.getElementById('context7Query').value.trim();
        const docs = await this.queryDocs(libraryId, query);

        const docsContainer = document.getElementById('context7DocsResults');
        const docsResultsCard = document.getElementById('docsResultsCard');

        docsResultsCard.style.display = 'block';

        if (docs.length === 0) {
            docsContainer.innerHTML = `
                <div class="empty-state">
                    <p>❌ Tidak ditemukan dokumentasi untuk query ini</p>
                </div>
            `;
            return;
        }

        docsContainer.innerHTML = docs.map(doc => `
            <div class="context7-doc-card">
                <h4 class="doc-title">${doc.title}</h4>
                ${doc.source ? `<p class="doc-source">Source: ${doc.source}</p>` : ''}
                <div class="doc-content">
                    ${doc.content.map(item => {
                        if (item.type === 'code') {
                            return `<pre class="code-block"><code>${this.escapeHtml(item.content)}</code></pre>`;
                        } else {
                            return `<p class="text-block">${this.escapeHtml(item.content)}</p>`;
                        }
                    }).join('')}
                </div>
            </div>
        `).join('');
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    clearResults() {
        document.getElementById('context7LibraryResults').innerHTML = '';
        document.getElementById('context7DocsResults').innerHTML = '';
        document.getElementById('selectedLibraryName').textContent = '-';
        document.getElementById('selectedLibraryId').value = '';

        // Hide result cards
        document.getElementById('selectedLibraryCard').style.display = 'none';
        document.getElementById('libraryResultsCard').style.display = 'none';
        document.getElementById('docsResultsCard').style.display = 'none';
    }
};