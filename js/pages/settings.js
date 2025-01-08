class SettingsManager {
    constructor() {
        // Initialize containers after DOM is loaded
        this.textKeysContainer = document.getElementById('textKeysContainer');
        this.imageKeysContainer = document.getElementById('imageKeysContainer');
        this.saveButton = document.getElementById('saveSettingsBtn');
        this.providers = {
            text: [],
            image: []
        };
    }

    async initialize() {
        try {
            const [availableProviders, userKeys] = await Promise.all([
                FlyerAPI.getAvailableProviders(),
                KeysAPI.getAvailableKeys()
            ]);

            this.providers = availableProviders;
            if (this.textKeysContainer && this.imageKeysContainer) {
                this.renderProviderKeys(userKeys.providers);
            }
        } catch (error) {
            console.error('Failed to load provider settings:', error);
        }
    }

    renderProviderKeys(userKeys) {
        // Render text providers
        this.textKeysContainer.innerHTML = this.providers.text
            .map(provider => UI.createProviderKeyInput(
                provider,
                'text',
                userKeys.text.includes(provider) ? '********' : '',
                false
            ))
            .join('');

        // Render image providers
        this.imageKeysContainer.innerHTML = this.providers.image
            .map(provider => UI.createProviderKeyInput(
                provider,
                'image',
                userKeys.image.includes(provider) ? '********' : '',
                false
            ))
            .join('');
    }

    async saveSettings() {
        const textProviders = {};
        const imageProviders = {};

        // Collect text provider keys
        this.providers.text.forEach(provider => {
            const input = document.getElementById(`text-${provider}-key`);
            if (input && input.value && input.value !== '********') {
                textProviders[provider] = input.value;
            }
        });

        // Collect image provider keys
        this.providers.image.forEach(provider => {
            const input = document.getElementById(`image-${provider}-key`);
            if (input && input.value && input.value !== '********') {
                imageProviders[provider] = input.value;
            }
        });

        try {
            this.saveButton.disabled = true;
            await KeysAPI.updateKeys(textProviders, imageProviders);

            alert('Settings saved successfully');
            UI.hideModal('settingsModal');

            // Refresh providers on the main page
            await this.homePage.setupProviders();
        } catch (error) {
            alert('Failed to save settings: ' + error.message);
        } finally {
            this.saveButton.disabled = false;
        }
    }
}

// Initialize settings only when needed (when settings modal is opened)
document.addEventListener('DOMContentLoaded', () => {
    const settingsManager = new SettingsManager();
    
    // Initialize settings when settings modal is opened
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            UI.showModal('settingsModal');
            settingsManager.initialize();
        });
    }
});