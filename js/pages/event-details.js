class EventDetailsPage {
    constructor() {
        // Only initialize if we're on the event-details page
        if (!document.querySelector('.event-details-container')) {
            return;
        }
        
        this.form = document.getElementById('eventDetailsForm');
        this.logoInput = document.getElementById('logoInput');
        this.logoPreview = document.getElementById('logoPreview');
        this.logoDropzone = document.getElementById('logoDropzone');
        this.uploadedLogos = [];
        
        this.maxLogos = 5;
        this.maxLogoSize = 5 * 1024 * 1024; // 5MB
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Logo upload handling
        this.logoInput.addEventListener('change', (e) => this.handleLogoSelect(e));
        
        // Drag and drop handling
        this.logoDropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.logoDropzone.classList.add('drag-over');
        });
        
        this.logoDropzone.addEventListener('dragleave', () => {
            this.logoDropzone.classList.remove('drag-over');
        });
        
        this.logoDropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.logoDropzone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            this.handleLogoFiles(Array.from(files));
        });

        // Click to upload
        this.logoDropzone.addEventListener('click', () => {
            this.logoInput.click();
        });
    }

    async handleLogoSelect(e) {
        const files = Array.from(e.target.files);
        await this.handleLogoFiles(files);
        // Reset input to allow selecting the same file again
        this.logoInput.value = '';
    }

    async handleLogoFiles(files) {
        const validFiles = files.filter(file => {
            // Check file type
            if (!file.type.match(/image\/(jpeg|png)/i)) {
                alert(`${file.name} is not a valid image file (PNG or JPEG only)`);
                return false;
            }
            
            // Check file size
            if (file.size > this.maxLogoSize) {
                alert(`${file.name} is too large (max 5MB)`);
                return false;
            }
            
            return true;
        });

        if (this.uploadedLogos.length + validFiles.length > this.maxLogos) {
            alert(`Maximum ${this.maxLogos} logos allowed`);
            return;
        }

        for (const file of validFiles) {
            try {
                const logoData = await this.processLogoFile(file);
                this.uploadedLogos.push(logoData);
                this.updateLogoPreview();
            } catch (error) {
                console.error('Error processing logo:', error);
                alert(`Error processing ${file.name}`);
            }
        }
    }

    async processLogoFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        file,
                        dataUrl: e.target.result,
                        width: img.width,
                        height: img.height
                    });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    updateLogoPreview() {
        this.logoPreview.innerHTML = this.uploadedLogos.map((logo, index) => `
            <div class="logo-preview-item">
                <img src="${logo.dataUrl}" alt="Logo ${index + 1}">
                <button type="button" class="remove-logo" data-index="${index}">×</button>
            </div>
        `).join('');

        // Add remove button listeners
        this.logoPreview.querySelectorAll('.remove-logo').forEach(button => {
            button.addEventListener('click', () => {
                const index = parseInt(button.dataset.index);
                this.uploadedLogos.splice(index, 1);
                this.updateLogoPreview();
            });
        });
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            title: this.form.eventTitle.value,
            location: this.form.eventLocation.value,
            time: this.form.eventTime.value,
            speaker: this.form.eventSpeaker.value,
            topic: this.form.eventTopic.value,
            food: this.form.eventFood.value,
            logos: this.uploadedLogos
        };

        // Store form data in session storage
        sessionStorage.setItem('eventDetails', JSON.stringify(formData));
        
        // Navigate to editor
        window.location.href = 'editor.html';
    }
}

// Initialize only when DOM is loaded and we're on the right page
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.event-details-container')) {
        new EventDetailsPage();
    }
});