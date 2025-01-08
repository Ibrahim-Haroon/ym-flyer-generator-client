
class LogoHandler {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.uploadedLogos = new Map();
        this.maxLogos = 5;
        
        this.uploadArea = document.querySelector('.upload-area');
        this.logoInput = document.querySelector('#logoInput');
        this.logoPreview = document.querySelector('.logo-preview');
        
        if (!this.uploadArea || !this.logoInput || !this.logoPreview) {
            console.error('Required logo handler elements not found');
            return;
        }

        this.initialize();
    }

    initialize() {
        // File input change handler
        this.logoInput?.addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // Drag and drop handlers
        this.uploadArea?.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadArea.classList.add('dragover');
        });

        this.uploadArea?.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('dragover');
        });

        this.uploadArea?.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // Click to upload
        this.uploadArea?.addEventListener('click', () => {
            this.logoInput?.click();
        });
    }

    handleFileSelect(files) {
        if (!files) return;

        // Check if we can add more logos
        if (this.uploadedLogos.size + files.length > this.maxLogos) {
            alert(`Maximum ${this.maxLogos} logos allowed`);
            return;
        }

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedLogos.set(file.name, {
                    dataUrl: e.target.result,
                    file: file
                });
                this.updatePreview();
            };
            reader.readAsDataURL(file);
        });
    }

    updatePreview() {
        if (!this.logoPreview) return;

        this.logoPreview.innerHTML = Array.from(this.uploadedLogos.entries())
            .map(([name, data]) => `
                <div class="logo-preview-item">
                    <button class="logo-preview-remove" data-name="${name}">×</button>
                    <img src="${data.dataUrl}" alt="${name}">
                </div>
            `).join('');

        // Add remove handlers
        this.logoPreview.querySelectorAll('.logo-preview-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.uploadedLogos.delete(btn.dataset.name);
                this.updatePreview();
            });
        });
    }
}

export default LogoHandler;