import { CommandManager } from "/js/utils/command.js";
import Storage from "/js/utils/storage.js";

class CanvasManager {
    constructor() {
        this.backgroundImage = document.getElementById('backgroundImage');
        this.editorElements = document.getElementById('editorElements');
        this.commandManager = new CommandManager();
        this.observers = new Set();
        
        this.state = {
            selectedElement: null,
            elements: new Map(),
            safeAreas: [],
            setSafeAreas: (areas) => {
                this.state.safeAreas = areas;
                this.notifyObservers();
            },
            addObserver: (observer) => {
                this.observers.add(observer);
            },
            removeObserver: (observer) => {
                this.observers.delete(observer);
            },
            getSelectedElement: () => {
                return this.state.selectedElement;
            },
        };

        // Load background image from session storage
        const imageData = Storage.get('currentEditImage');
        if (imageData) {
            this.backgroundImage.src = imageData.dataUrl;
            // Wait for image to load before initializing
            this.backgroundImage.onload = () => {
                this.initialize();
            };
        } else {
            console.error('No image data found in storage');
        }
    }

    notifyObservers() {
        this.observers.forEach(observer => {
            if (typeof observer === 'function') {
                observer(this.state);
            }
        });
    }

    selectElement(element) {
        if (this.state.selectedElement) {
            this.state.selectedElement.classList.remove('selected');
        }
        element.classList.add('selected');
        this.state.selectedElement = element;
        this.notifyObservers();
    }

    clearSelection() {
        if (this.state.selectedElement) {
            this.state.selectedElement.classList.remove('selected');
            this.state.selectedElement = null;
            this.notifyObservers();
        }
    }

    initialize() {
        // Only analyze if we have a valid image
        if (this.backgroundImage.complete && this.backgroundImage.naturalWidth > 0) {
            this.analyzeBackgroundImage();
        }

        // Initialize controls
        this.initializeControls();

        // Initialize element container for touch events
        this.editorElements.addEventListener('touchstart', (e) => {
            const element = e.target.closest('.editor-element');
            if (element) {
                this.selectElement(element);
            } else {
                this.clearSelection();
            }
        });
    }

    async analyzeBackgroundImage() {
        try {
            // Create a canvas to analyze the image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = this.backgroundImage.naturalWidth;
            canvas.height = this.backgroundImage.naturalHeight;

            ctx.drawImage(this.backgroundImage, 0, 0);

            // Get image data for analysis
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

            // Analyze brightness to determine text placement areas
            const brightAreas = this.analyzeBrightness(imageData);
            this.state.setSafeAreas(brightAreas);
        } catch (error) {
            console.error('Error analyzing background image:', error);
        }
    }

    analyzeBrightness(imageData) {
        // Simple brightness analysis - can be enhanced later
        const brightAreas = [];
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;
        const blockSize = 20;

        for (let y = 0; y < height; y += blockSize) {
            for (let x = 0; x < width; x += blockSize) {
                let brightness = 0;
                let count = 0;

                // Calculate average brightness for this block
                for (let by = 0; by < blockSize && y + by < height; by++) {
                    for (let bx = 0; bx < blockSize && x + bx < width; bx++) {
                        const i = ((y + by) * width + (x + bx)) * 4;
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];
                        brightness += (r + g + b) / 3;
                        count++;
                    }
                }

                const averageBrightness = brightness / count;
                if (averageBrightness > 200) { // Threshold for "bright" areas
                    brightAreas.push({
                        x: x,
                        y: y,
                        width: blockSize,
                        height: blockSize
                    });
                }
            }
        }

        return brightAreas;
    }

    initializeControls() {
        // Undo button
        document.querySelector('.btn-undo').addEventListener('click', () => {
            this.commandManager.undo();
        });

        // Redo button
        document.querySelector('.btn-redo').addEventListener('click', () => {
            this.commandManager.redo();
        });

        // Reset button
        document.querySelector('.btn-reset').addEventListener('click', () => {
            this.clearSelection();
            this.editorElements.innerHTML = '';
            this.state.elements.clear();
            this.commandManager.clear();
        });
    }

    addElement(element, type) {
        const id = `element-${Date.now()}`;
        element.dataset.id = id;
        element.classList.add('editor-element', `${type}-element`);
        
        this.editorElements.appendChild(element);
        this.state.elements.set(id, {
            element: element,
            type: type
        });
        this.notifyObservers();

        return element;
    }

    removeElement(element) {
        const id = element.dataset.id;
        element.remove();
        this.state.elements.delete(id);
        if (this.state.selectedElement === element) {
            this.clearSelection();
        }
        this.notifyObservers();
    }
}

export default CanvasManager;