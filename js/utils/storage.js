const Storage = {
    set: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
    },

    get: (key) => {
        const item = localStorage.getItem(key);
        try {
            return item ? JSON.parse(item) : null;
        } catch {
            return null;
        }
    },

    remove: (key) => {
        localStorage.removeItem(key);
    },

    clear: () => {
        localStorage.clear();
    },

    // Authentication specific
    setAuth: (token, userId) => {
        Storage.set('auth', { token, userId, timestamp: Date.now() });
    },

    getAuth: () => {
        const auth = Storage.get('auth');
        if (!auth) return null;

        // Check if token is expired (24 hours)
        const isExpired = Date.now() - auth.timestamp > 24 * 60 * 60 * 1000;
        if (isExpired) {
            Storage.remove('auth');
            return null;
        }

        return auth;
    },

    // Image caching
    cacheImage: (path, dataUrl) => {
        const cache = Storage.get('imageCache') || {};
        cache[path] = {
            dataUrl,
            timestamp: Date.now()
        };
        Storage.set('imageCache', cache);
    },

    getCachedImage: (path) => {
        const cache = Storage.get('imageCache') || {};
        const image = cache[path];
        if (!image) return null;

        // Cache for 24 hours
        if (Date.now() - image.timestamp > 24 * 60 * 60 * 1000) {
            delete cache[path];
            Storage.set('imageCache', cache);
            return null;
        }

        return image.dataUrl;
    }
};