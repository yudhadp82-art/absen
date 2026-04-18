// Admin Dashboard Configuration
const CONFIG = {
    API_BASE_URL: window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : `${window.location.origin}/api`,
    ITEMS_PER_PAGE: 50,
    APP: { NAME: 'Admin Dashboard', VERSION: '1.0.0' }
};
