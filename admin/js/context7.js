// Context7 UI Integration
const Context7UI = {
    async resolveLibraryId(libraryName, query) {
        try {
            App.showLoading('Mencari library...');

            const response = await API.request('/context7', {
                method: 'POST',
                body: JSON.stringify({
                    mode: 'resolve',
                    libraryName,
                    query
                })
            });
            App.hideLoading();

            return response.data || [];
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
            return [];
        }
    },

    async queryDocs(libraryId, query) {
        try {
            App.showLoading('Mengambil dokumentasi...');

            const response = await API.request('/context7', {
                method: 'POST',
                body: JSON.stringify({
                    mode: 'docs',
                    libraryId,
                    query
                })
            });
            App.hideLoading();

            return response.data || [];
        } catch (error) {
            App.hideLoading();
            App.showToast(error.message, 'error');
            return [];
        }
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
            <div class="context7-library-card" onclick="Context7UI.selectLibrary('${lib.id}', '${lib.name.replace(/'/g, "\\'")}')">
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

window.Context7 = Context7UI;
