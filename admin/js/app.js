// Main App Logic
const App = {
    init() {
        console.log('Admin Dashboard initialized');
        if (typeof Reports !== 'undefined' && typeof Reports.initializeRangeFilters === 'function') {
            Reports.initializeRangeFilters();
        }
        Dashboard.load();
    },
    showLoading(text) {
        document.getElementById('loadingText').textContent = text;
        document.getElementById('loadingOverlay').style.display = 'flex';
    },
    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    },
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMsg = document.getElementById('toastMessage');
        toastMsg.textContent = message;
        toast.style.backgroundColor = '#ffffff';
        toast.style.color = '#111111';
        toast.style.border = '1px solid #e2e8f0';
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);
    }
};
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
