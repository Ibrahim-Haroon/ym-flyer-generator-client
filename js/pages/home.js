class HomePage {
    constructor() {
        // Initialize state
        this.sessionImages = [];
        this.selectedProviders = {
            text: null,
            image: null
        };
        this.settings = new SettingsManager(this);
        this.init();
    }

    async init() {
        UI.checkAuth();
        await this.setupProviders();
        this.initializeEventListeners();
        this.initializeTheme();
    }

    async setupProviders() {
        try {
            const [availableProviders, userProviders] = await Promise.all([
                FlyerAPI.getAvailableProviders(),
                KeysAPI.getAvailableKeys()
            ]);

            // Reset selected providers when refreshing the setup
            this.selectedProviders = {
                text: null,
                image: null
            };

            this.renderProviders('textProviders', availableProviders.text, userProviders.providers.text);
            this.renderProviders('imageProviders', availableProviders.image, userProviders.providers.image);
        } catch (error) {
            console.error('Error setting up providers:', error);
            alert(error.message);
        }
    }

    renderProviders(containerId, providers, userProviders) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        // Normalize provider arrays to lowercase for comparison
        const normalizedUserProviders = (userProviders || []).map(p => p.toLowerCase());

        container.innerHTML = providers.map(provider => {
            const normalizedProvider = provider.toLowerCase();
            const isEnabled = normalizedUserProviders.includes(normalizedProvider);

            return `
                <div class="provider-option ${isEnabled ? '' : 'disabled'}"
                     data-provider="${normalizedProvider}">
                    ${provider.charAt(0).toUpperCase() + provider.slice(1)}
                </div>
            `;
        }).join('');

        // Attach event listeners only to enabled providers
        container.querySelectorAll('.provider-option:not(.disabled)').forEach(el => {
            el.addEventListener('click', (e) => this.handleProviderSelection(e));
        });
    }

    handleProviderSelection(e) {
        // Find the provider group container
        const providerGroup = e.target.closest('.provider-group');
        if (!providerGroup) {
            console.error('Provider group not found');
            return;
        }

        // Determine type based on heading text
        const heading = providerGroup.querySelector('h3');
        if (!heading) {
            console.error('Provider group heading not found');
            return;
        }

        const type = heading.textContent.toLowerCase().includes('text') ? 'text' : 'image';
        const provider = e.target.dataset.provider;

        if (!provider) {
            console.error('Provider data attribute not found');
            return;
        }

        // Update selection UI
        providerGroup.querySelectorAll('.provider-option').forEach(el => {
            el.classList.remove('selected');
        });
        e.target.classList.add('selected');

        // Update selected providers state
        this.selectedProviders[type] = provider;
        console.log('Updated providers:', this.selectedProviders);
    }

    async handleGeneration() {
        const colorPalette = document.getElementById('colorPalette').value.trim();
        const generateBtn = document.getElementById('generateBtn');

        // Validate inputs
        if (!colorPalette) {
            alert('Please enter a color palette');
            return;
        }

        if (!this.selectedProviders.text || !this.selectedProviders.image) {
            alert('Please select both text and image providers');
            return;
        }

        try {
            // Disable button and show progress
            generateBtn.disabled = true;
            this.showProgress();

            const result = await FlyerAPI.generateBackground(
                colorPalette,
                this.selectedProviders.text,
                this.selectedProviders.image
            );

            await this.loadGeneratedImages(result.background_paths);
        } catch (error) {
            console.error('Generation error:', error);
            alert(error.message);
        } finally {
            // Re-enable button and hide progress
            generateBtn.disabled = false;
            this.hideProgress();
        }
    }

    showProgress() {
        const progress = document.getElementById('generationProgress');
        if (progress) {
            progress.style.display = 'block';
            const fill = progress.querySelector('.progress-fill');
            if (fill) {
                fill.style.width = '100%';
            }
        }
    }

    hideProgress() {
        const progress = document.getElementById('generationProgress');
        if (progress) {
            progress.style.display = 'none';
            const fill = progress.querySelector('.progress-fill');
            if (fill) {
                fill.style.width = '0';
            }
        }
    }

    async loadGeneratedImages(paths) {
        for (const path of paths) {
            try {
                const blob = await FlyerAPI.getBackground(path);
                const dataUrl = await this.blobToDataURL(blob);

                // Cache the image
                Storage.cacheImage(path, dataUrl);

                // Add to session images
                this.sessionImages.unshift({ path, dataUrl });

                // Update gallery
                this.updateGallery();
            } catch (error) {
                console.error(`Failed to load image: ${path}`, error);
            }
        }
    }

    blobToDataURL(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    updateGallery() {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;

        gallery.innerHTML = this.sessionImages.map(image => `
            <div class="gallery-item" data-path="${image.path}">
                <img src="${image.dataUrl}" alt="Generated background">
            </div>
        `).join('');

        // Add click handlers
        gallery.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => this.showImagePreview(item.dataset.path));
        });
    }

    showImagePreview(path) {
        const image = this.sessionImages.find(img => img.path === path);
        if (!image) return;

        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        if (!modal || !modalImage) return;

        modalImage.src = image.dataUrl;
        UI.showModal('imageModal');

        // Set up download handler
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = image.dataUrl;
                link.download = `flyer-${Date.now()}.png`;
                link.click();
            };
        }
    }

    initializeEventListeners() {
        // Generation
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => this.handleGeneration());
        }

        // Bottom navigation
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Theme toggle
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) {
            themeSwitch.addEventListener('change', (e) => {
                const theme = e.target.checked ? 'dark' : 'light';
                document.body.setAttribute('data-theme', theme);
                Storage.set('theme', theme);
            });
        }

        // Settings button
        const settingsButton = document.querySelector('[data-page="settings"]');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => this.showSettings());
        }

        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) UI.hideModal(modal.id);
            });
        });
    }

    initializeTheme() {
        const theme = Storage.get('theme') || 'light';
        document.body.setAttribute('data-theme', theme);
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) {
            themeSwitch.checked = theme === 'dark';
        }
    }

    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.dataset.page;

        // Update navigation UI
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Handle page switching
        switch(page) {
            case 'settings':
                this.showSettings();
                break;
            case 'gallery':
                this.updateGallery();
                break;
            case 'generate':
                // Already on generation view
                break;
        }
    }

    async showSettings() {
        UI.showModal('settingsModal');
        await this.settings.initialize();
    }
}

// Initialize the home page when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HomePage();
});