// ========================================
// Local Storage Management
// ========================================

const Storage = {
    /**
     * Save employee info to local storage
     */
    saveEmployeeInfo(id, name) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.EMPLOYEE_ID, id);
        localStorage.setItem(CONFIG.STORAGE_KEYS.EMPLOYEE_NAME, name);
    },

    /**
     * Get employee info from local storage
     */
    getEmployeeInfo() {
        return {
            id: localStorage.getItem(CONFIG.STORAGE_KEYS.EMPLOYEE_ID) || '',
            name: localStorage.getItem(CONFIG.STORAGE_KEYS.EMPLOYEE_NAME) || ''
        };
    },

    /**
     * Save location to local storage
     */
    saveLocation(location) {
        localStorage.setItem(
            CONFIG.STORAGE_KEYS.LAST_LOCATION,
            JSON.stringify(location)
        );
    },

    /**
     * Get location from local storage
     */
    getLocation() {
        const locationStr = localStorage.getItem(CONFIG.STORAGE_KEYS.LAST_LOCATION);
        return locationStr ? JSON.parse(locationStr) : null;
    },

    /**
     * Clear location from local storage
     */
    clearLocation() {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.LAST_LOCATION);
    },

    /**
     * Save today's history to local storage
     */
    saveTodayHistory(history) {
        const today = new Date().toISOString().split('T')[0];
        const key = `${CONFIG.STORAGE_KEYS.TODAY_HISTORY}_${today}`;
        localStorage.setItem(key, JSON.stringify(history));
    },

    /**
     * Get today's history from local storage
     */
    getTodayHistory() {
        const today = new Date().toISOString().split('T')[0];
        const key = `${CONFIG.STORAGE_KEYS.TODAY_HISTORY}_${today}`;
        const historyStr = localStorage.getItem(key);
        return historyStr ? JSON.parse(historyStr) : [];
    },

    /**
     * Clear all data
     */
    clearAll() {
        Object.values(CONFIG.STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
