class SettingsManager {
    constructor(homePage) {
        this.homePage = homePage;
        this.modal = document.getElementById('settingsModal');
        this.textKeysContainer = document.getElementById('textProviderKeys');
        this.imageKeysContainer = document.getElementById('imageProviderKeys');
        this.saveButton = document.getElementById('saveSettings');

        this.providers = {
            text: [],
            image: []
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Close button
        this.modal.querySelector('.close-modal').addEventListener('click', () => {
            UI.hideModal('settingsModal');
        });

        // Save button
        this.saveButton.addEventListener('click', () => this.saveSettings());

        // Close on outside click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                UI.hideModal('settingsModal');
            }
        });

        // Key visibility toggle delegation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.toggle-visibility')) {
                const input = e.target.previousElementSibling;
                input.type = input.type === 'password' ? 'text' : 'password';
                e.target.textContent = input.type === 'password' ? '👁️' : '👁️‍🗨️';
            }
        });
    }

    async initialize() {
        try {
            const [availableProviders, userKeys] = await Promise.all([
                FlyerAPI.getAvailableProviders(),
                KeysAPI.getAvailableKeys()
            ]);

            this.providers = availableProviders;
            this.renderProviderKeys(userKeys.providers);
        } catch (error) {
            alert('Failed to load provider settings: ' + error.message);
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