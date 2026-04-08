// ========================================
// GPS Location Management
// ========================================

const LocationManager = {
    currentLocation: null,

    /**
     * Check if geolocation is supported
     */
    isSupported() {
        return 'geolocation' in navigator;
    },

    /**
     * Request location permission and get current position
     */
    async getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!this.isSupported()) {
                reject(new Error('Geolocation tidak didukung di browser ini'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: new Date().toISOString()
                    };

                    this.currentLocation = location;
                    Storage.saveLocation(location);
                    resolve(location);
                },
                (error) => {
                    let errorMessage = 'Gagal mengambil lokasi';

                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Izin lokasi ditolak. Silakan enable location access di browser settings.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Waktu habis untuk mengambil lokasi. Coba lagi.';
                            break;
                    }

                    reject(new Error(errorMessage));
                },
                CONFIG.LOCATION
            );
        });
    },

    /**
     * Watch position changes
     */
    watchPosition(onSuccess, onError) {
        if (!this.isSupported()) {
            onError(new Error('Geolocation tidak didukung'));
            return null;
        }

        return navigator.geolocation.watchPosition(
            (position) => {
                const location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    timestamp: new Date().toISOString()
                };

                this.currentLocation = location;
                onSuccess(location);
            },
            onError,
            CONFIG.LOCATION
        );
    },

    /**
     * Clear watch
     */
    clearWatch(watchId) {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
        }
    },

    /**
     * Get distance between two coordinates (in meters)
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    },

    /**
     * Format coordinates for display
     */
    formatCoordinate(coord, type) {
        const degrees = Math.abs(coord);
        const direction = type === 'lat'
            ? (coord >= 0 ? 'N' : 'S')
            : (coord >= 0 ? 'E' : 'W');

        return `${degrees.toFixed(6)}° ${direction}`;
    }
};
