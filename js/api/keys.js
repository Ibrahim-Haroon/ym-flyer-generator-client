import Storage from "/js/utils/storage.js";
import UI from "/js/utils/ui.js";
import API_CONFIG from "/js/api/config.js";

const KeysAPI = {
    async getAvailableKeys() {
        const auth = Storage.getAuth();
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER}/${auth.userId}/api-keys`,
            {
                headers: UI.addAuthHeader()
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to fetch API keys');
        }

        return response.json();
    },

    async updateKeys(textProviders, imageProviders) {
        const auth = Storage.getAuth();
        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.USER}/${auth.userId}/api-keys`,
            {
                method: 'PUT',
                headers: UI.addAuthHeader({
                    'Content-Type': 'application/json'
                }),
                body: JSON.stringify({
                    text_providers: textProviders,
                    image_providers: imageProviders
                })
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update API keys');
        }

        return response.json();
    }
};

export default KeysAPI;