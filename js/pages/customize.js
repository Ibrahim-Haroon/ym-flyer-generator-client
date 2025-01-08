class CustomizePage {
    constructor() {
        // Only initialize if we're on the editor page
        if (!document.querySelector('.editor-container')) {
            console.error('Editor container not found');
            return;
        }
        
        this.canvas = document.getElementById('editorCanvas');
        if (!this.canvas) {
            console.error('Editor canvas not found');
            return;
        }
        
        console.log('Initializing editor...');
        
        this.selectedElement = null;
        this.isDragging = false;
        this.isResizing = false;
        this.dragOffset = { x: 0, y: 0 };
        
        // Canvas dimensions (matching backend)
        this.canvasWidth = 800;
        this.canvasHeight = 1000;
        
        this.elements = {
            title: null,
            location: null,
            time: null,
            speaker: null,
            topic: null,
            food: null,
            logos: []
        };
        
        this.initializeEventListeners();
        this.setupCanvasScale();
    
        // Add background image loading with error handling
        this.loadBackground().catch(err => console.error('Background loading error:', err));
        this.loadEventDetails();
    }

    setupCanvasScale() {
        // Set fixed dimensions and scale
        this.canvas.style.width = `${this.canvasWidth}px`;
        this.canvas.style.height = `${this.canvasHeight}px`;
        this.canvas.style.transform = `scale(1)`;
        this.canvas.style.transformOrigin = 'center';
    }

    initializeEventListeners() {
        // Touch events for dragging
        if (this.canvas) {
            this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
            this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
        }

        // Color picker events
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) {
            const updateColor = (e) => {
                if (this.selectedElement) {
                    this.selectedElement.style.color = e.target.value;
                }
            };
            
            colorPicker.addEventListener('input', updateColor);
            colorPicker.addEventListener('change', updateColor);
        }

        // Font size slider events
        const fontSizeSlider = document.getElementById('fontSizeSlider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                if (this.selectedElement) {
                    this.selectedElement.style.fontSize = `${e.target.value}px`;
                    const fontSizeValue = document.getElementById('fontSizeValue');
                    if (fontSizeValue) {
                        fontSizeValue.textContent = `${e.target.value}px`;
                    }
                }
            });
        }

        const textTool = document.getElementById('textTool');
        if (textTool) {
            textTool.addEventListener('click', () => {
                // Toggle text editing tools
                colorPicker.classList.toggle('hidden');
                fontSizeSlider.classList.toggle('hidden');
            });
        }
    
        const imageTool = document.getElementById('imageTool');
        if (imageTool) {
            imageTool.addEventListener('click', () => {
                // Handle image tool click
                if (this.selectedElement && this.selectedElement.classList.contains('logo-element')) {
                    colorPicker.classList.add('hidden');
                    fontSizeSlider.classList.remove('hidden');
                }
            });
        }
    
        const fontTool = document.getElementById('fontTool');
        if (fontTool) {
            fontTool.addEventListener('click', () => {
                // Toggle font size slider
                fontSizeSlider.classList.toggle('hidden');
                colorPicker.classList.add('hidden');
            });
        }

        // Download button
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.handleDownload());
        }

        // Window resize listener for canvas scaling
        window.addEventListener('resize', () => this.setupCanvasScale());
    }

    createTextElement(text, type) {
        const element = document.createElement('div');
        element.className = 'canvas-element text-element';
        element.textContent = text;
        element.dataset.type = type;
        
        // Add resize handles
        this.addResizeHandles(element);
        
        return element;
    }

    addResizeHandles(element) {
        const corners = ['nw', 'ne', 'se', 'sw'];
        corners.forEach(corner => {
            const handle = document.createElement('div');
            handle.className = `resize-handle ${corner}`;
            handle.addEventListener('touchstart', (e) => this.handleResizeStart(e, element, corner));
            element.appendChild(handle);
        });
    }

    handleTouchStart(e) {
        const touch = e.touches[0];
        const element = e.target.closest('.canvas-element');
        
        if (element) {
            this.selectedElement = element;
            this.isDragging = true;
            
            const rect = element.getBoundingClientRect();
            this.dragOffset = {
                x: touch.clientX - rect.left,
                y: touch.clientY - rect.top
            };
            
            // Highlight selected element
            document.querySelectorAll('.canvas-element').forEach(el => {
                el.classList.remove('selected');
            });
            element.classList.add('selected');
        }
    }

    handleTouchMove(e) {
        if (!this.isDragging || !this.selectedElement) return;
        
        const touch = e.touches[0];
        const newX = touch.clientX - this.dragOffset.x;
        const newY = touch.clientY - this.dragOffset.y;
        
        this.selectedElement.style.left = `${newX}px`;
        this.selectedElement.style.top = `${newY}px`;
    }

    handleTouchEnd() {
        this.isDragging = false;
    }

    async saveDesign() {
        const canvasData = this.canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = canvasData;
        link.download = 'final-preview.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async loadBackground() {
        const backgroundPath = sessionStorage.getItem('selectedBackground');
        if (!backgroundPath) {
            console.error('No background selected');
            return;
        }

        try {
            const blob = await FlyerAPI.getBackground(backgroundPath);
            const imageUrl = URL.createObjectURL(blob);
            this.canvas.style.backgroundImage = `url(${imageUrl})`;
            this.canvas.style.backgroundSize = `${this.canvasWidth}px ${this.canvasHeight}px`;
            this.canvas.style.backgroundPosition = 'center';
            this.canvas.style.backgroundRepeat = 'no-repeat';
        } catch (error) {
            console.error('Error loading background:', error);
            alert('Failed to load background image');
        }
    }

    loadEventDetails() {
        const details = JSON.parse(sessionStorage.getItem('eventDetails'));
        if (!details) return;

        // Create and position text elements
        const elements = [
            { text: details.title, type: 'title', y: 100 },
            { text: details.topic, type: 'topic', y: 200 },
            { text: details.speaker, type: 'speaker', y: 300 },
            { text: new Date(details.time).toLocaleString(), type: 'time', y: 400 },
            { text: details.location, type: 'location', y: 500 }
        ];

        if (details.food) {
            elements.push({ text: details.food, type: 'food', y: 600 });
        }

        elements.forEach(({ text, type, y }) => {
            const element = this.createTextElement(text, type);
            element.style.left = '50%';
            element.style.top = `${y}px`;
            element.style.transform = 'translateX(-50%)';
            this.canvas.appendChild(element);
        });

        // Add logos if any
        if (details.logos && details.logos.length > 0) {
            this.addLogos(details.logos);
        }
    }

    addLogos(logos) {
        const startY = 700; // Starting Y position for logos
        const spacing = 100; // Vertical spacing between logos
        
        logos.forEach((logo, index) => {
            const container = document.createElement('div');
            container.className = 'canvas-element logo-element';
            
            const img = document.createElement('img');
            img.src = logo.dataUrl;
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            
            container.appendChild(img);
            container.style.left = '50%';
            container.style.top = `${startY + (index * spacing)}px`;
            container.style.transform = 'translateX(-50%)';
            
            this.addResizeHandles(container);
            this.canvas.appendChild(container);
        });
    }

    async handleDownload() {
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Generating...';

        try {
            // Remove selection highlight and resize handles before capture
            document.querySelectorAll('.canvas-element').forEach(el => {
                el.classList.remove('selected');
            });
            document.querySelectorAll('.resize-handle').forEach(handle => {
                handle.style.display = 'none';
            });

            // Capture the canvas
            const canvas = await html2canvas(this.canvas, {
                scale: 2, // Higher quality
                useCORS: true, // Allow cross-origin images
                allowTaint: true,
                backgroundColor: null
            });

            // Restore resize handles
            document.querySelectorAll('.resize-handle').forEach(handle => {
                handle.style.display = 'block';
            });

            // Create download link
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = 'flyer.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png');

        } catch (error) {
            console.error('Error generating image:', error);
            alert('Failed to generate image');
        } finally {
            downloadBtn.disabled = false;
            downloadBtn.textContent = 'Download Flyer';
        }
    }

    handleResizeStart(e, element, corner) {
        e.stopPropagation(); // Prevent dragging when resizing
        this.isResizing = true;
        this.selectedElement = element;
        this.resizeCorner = corner;
        
        const touch = e.touches[0];
        this.startPos = {
            x: touch.clientX,
            y: touch.clientY,
            width: element.offsetWidth,
            height: element.offsetHeight
        };
        
        document.addEventListener('touchmove', this.handleResizeMove.bind(this));
        document.addEventListener('touchend', this.handleResizeEnd.bind(this));
    }

    handleResizeMove(e) {
        if (!this.isResizing || !this.selectedElement) return;
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.startPos.x;
        const deltaY = touch.clientY - this.startPos.y;
        
        let newWidth = this.startPos.width;
        let newHeight = this.startPos.height;
        
        // Handle different corners
        switch (this.resizeCorner) {
            case 'se':
                newWidth += deltaX;
                newHeight += deltaY;
                break;
            case 'sw':
                newWidth -= deltaX;
                newHeight += deltaY;
                this.selectedElement.style.left = `${this.startPos.x + deltaX}px`;
                break;
            case 'ne':
                newWidth += deltaX;
                newHeight -= deltaY;
                this.selectedElement.style.top = `${this.startPos.y + deltaY}px`;
                break;
            case 'nw':
                newWidth -= deltaX;
                newHeight -= deltaY;
                this.selectedElement.style.left = `${this.startPos.x + deltaX}px`;
                this.selectedElement.style.top = `${this.startPos.y + deltaY}px`;
                break;
        }
        
        // Apply minimum dimensions
        newWidth = Math.max(50, newWidth);
        newHeight = Math.max(20, newHeight);
        
        this.selectedElement.style.width = `${newWidth}px`;
        this.selectedElement.style.height = `${newHeight}px`;
        
        // For text elements, adjust text wrapping
        if (this.selectedElement.classList.contains('text-element')){
            this.selectedElement.style.whiteSpace = 'normal';
            this.selectedElement.style.wordWrap = 'break-word';
        }
    }

    handleResizeEnd() {
        this.isResizing = false;
        document.removeEventListener('touchmove', this.handleResizeMove);
        document.removeEventListener('touchend', this.handleResizeEnd);
    }
}

// Initialize only when DOM is loaded and we're on the right page
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.editor-container')) {
        new CustomizePage();
    }
});