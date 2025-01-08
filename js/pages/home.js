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
        // Clear any existing gallery first
        const existingGallery = document.querySelector('.image-gallery');
        if (existingGallery) {
            existingGallery.innerHTML = '';
        }

        const gallery = document.createElement('div');
        gallery.className = 'image-gallery';

        for (const path of paths) {
            try {
                const blob = await FlyerAPI.getBackground(path);
                const imageUrl = URL.createObjectURL(blob);
                
                const item = document.createElement('div');
                item.className = 'gallery-item';
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = "Generated background";
                item.appendChild(img);

                // Add click event listener to both the container and image
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.showImagePreview(imageUrl, path);
                });
                
                gallery.appendChild(item);
            } catch (error) {
                console.error('Error loading image:', error);
            }
        }

        // Replace existing gallery
        if (existingGallery) {
            existingGallery.replaceWith(gallery);
        } else {
            document.querySelector('.main-container').appendChild(gallery);
        }
    }

    showImagePreview(imageUrl, path) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content preview-content">
                <span class="close-modal">&times;</span>
                <img id="modalImage" src="${imageUrl}" alt="Preview">
                <div class="preview-actions">
                    <button class="btn btn-primary" id="downloadBtn">Download</button>
                    <button class="btn btn-secondary" id="customizeBtn">Customize</button>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
        
        // Force reflow and add active class for animation
        setTimeout(() => modal.classList.add('active'), 10);
        
        // Event listeners
        modal.querySelector('.close-modal').onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };
        
        modal.querySelector('#downloadBtn').onclick = () => this.downloadImage(imageUrl);
        modal.querySelector('#customizeBtn').onclick = () => {
            sessionStorage.setItem('selectedBackground', path);
            window.location.href = 'event-details.html';
        };
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            }
        };
    }
    
    // Add download method if not exists
    async downloadImage(imageUrl) {
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'flyer-background.png';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Download failed:', error);
            alert('Failed to download image');
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