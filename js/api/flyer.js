import Storage from "/js/utils/storage.js";
import UI from "/js/utils/ui.js";
import API_CONFIG from "/js/api/config.js";

const FlyerAPI = {
    async generateBackground(colorPalette, textProvider, imageProvider) {
        const auth = Storage.getAuth();
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FLYER}/${auth.userId}`, {
            method: 'POST',
            headers: UI.addAuthHeader({
                'Content-Type': 'application/json'
            }),
            body: JSON.stringify({
                color_palette: colorPalette,
                text_model_provider: textProvider,
                image_model_provider: imageProvider
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Generation failed');
        }

        return response.json();
    },

    async getBackground(imagePath) {
        const auth = Storage.getAuth();
        // Ensure the path starts with a slash if it doesn't already
        const normalizedPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

        const response = await fetch(
            `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.FLYER}/${auth.userId}${normalizedPath}`,
            {
                headers: UI.addAuthHeader()
            }
        );

        if (!response.ok) {
            console.error('Failed to fetch image:', response.status, response.statusText);
            const errorText = await response.text();
            console.error('Error details:', errorText);
            throw new Error(`Failed to fetch image: ${response.status}`);
        }

        return response.blob();
    },

    async getAvailableProviders() {
        const auth = Storage.getAuth();
        const responses = await Promise.all([
            fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROVIDER}/${auth.userId}/text`, {
                headers: UI.addAuthHeader()
            }),
            fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PROVIDER}/${auth.userId}/image`, {
                headers: UI.addAuthHeader()
            })
        ]);

        if (!responses.every(r => r.ok)) {
            throw new Error('Failed to fetch providers');
        }

        const [textProviders, imageProviders] = await Promise.all(
            responses.map(r => r.json())
        );

        return {
            text: textProviders.providers,
            image: imageProviders.providers
        };
    }
};

export default FlyerAPI;