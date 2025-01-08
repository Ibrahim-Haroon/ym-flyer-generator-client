import { StyleCommand, ElementCommand, BatchCommand } from '/js/utils/command.js';

class TextEditor {
    constructor(canvasManager) {
        this.canvasManager = canvasManager;
        this.textFields = {
            title: document.getElementById('titleText'),
            location: document.getElementById('locationText'),
            time: document.getElementById('timeText'),
            speaker: document.getElementById('speakerText'),
            topic: document.getElementById('topicText'),
            food: document.getElementById('foodText')
        };

        this.initialize();
    }

    initialize() {
        // Set up text input handlers
        document.getElementById('applyText').addEventListener('click', () => {
            this.applyTextChanges();
        });

        // Set up style controls
        this.initializeStyleControls();
    }

    initializeStyleControls() {
        // Font size slider
        const fontSizeSlider = document.querySelector('.font-size-slider');
        const fontSizeValue = document.querySelector('.font-size-value');

        fontSizeSlider.addEventListener('input', (e) => {
            fontSizeValue.textContent = `${e.target.value}px`;
            this.applyStyle('fontSize', `${e.target.value}px`);
        });

        // Font style buttons
        document.querySelectorAll('.font-style-buttons .btn-icon').forEach(btn => {
            btn.addEventListener('click', () => {
                const style = btn.dataset.style;
                btn.classList.toggle('active');

                if (style === 'bold') {
                    this.applyStyle('fontWeight', btn.classList.contains('active') ? 'bold' : 'normal');
                } else if (style === 'italic') {
                    this.applyStyle('fontStyle', btn.classList.contains('active') ? 'italic' : 'normal');
                }
            });
        });
    }

    applyTextChanges() {
        const commands = [];
        const existingElements = new Set();

        // Process each text field
        Object.entries(this.textFields).forEach(([type, input]) => {
            if (!input.value.trim()) return;

            // Check if element already exists
            const existing = this.findExistingTextElement(type);
            if (existing) {
                existingElements.add(existing.dataset.editorId);
                commands.push(new StyleCommand(
                    existing,
                    'textContent',
                    existing.textContent,
                    input.value
                ));
            } else {
                const element = this.createTextElement(type, input.value);
                commands.push(new ElementCommand(
                    document.querySelector('.editor-elements'),
                    element,
                    'add'
                ));
            }
        });

        // Remove any text elements that are no longer needed
        document.querySelectorAll('.text-element').forEach(element => {
            const id = element.dataset.editorId;
            if (!existingElements.has(id)) {
                commands.push(new ElementCommand(
                    document.querySelector('.editor-elements'),
                    element,
                    'remove'
                ));
            }
        });

        // Execute all commands as a batch
        if (commands.length > 0) {
            this.canvasManager.executeCommand(new BatchCommand(commands));
        }

        // Auto-arrange elements
        this.arrangeTextElements();
    }

    createTextElement(type, content) {
        const element = document.createElement('div');
        element.className = `text-element ${type}-text`;
        element.textContent = content;

        // Apply default styles based on type
        this.applyDefaultStyles(element, type);

        return element;
    }

    applyDefaultStyles(element, type) {
        const styles = {
            title: {
                fontSize: '24px',
                fontWeight: 'bold'
            },
            location: {
                fontSize: '18px'
            },
            time: {
                fontSize: '18px'
            },
            speaker: {
                fontSize: '20px',
                fontStyle: 'italic'
            },
            topic: {
                fontSize: '20px'
            },
            food: {
                fontSize: '18px'
            }
        };

        Object.entries(styles[type]).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }

    findExistingTextElement(type) {
        return document.querySelector(`.text-element.${type}-text`);
    }

    applyStyle(property, value) {
        const selectedElement = this.canvasManager.state.getSelectedElement();
        if (!selectedElement || !selectedElement.element.classList.contains('text-element')) {
            return;
        }

        const command = new StyleCommand(
            selectedElement.element,
            property,
            selectedElement.element.style[property],
            value
        );

        this.canvasManager.executeCommand(command);
    }

    arrangeTextElements() {
        const safeAreas = this.canvasManager.state.getSafeAreas();
        const elements = document.querySelectorAll('.text-element');

        if (!safeAreas || elements.length === 0) return;

        // Find the best area for text placement
        const bestArea = this.findBestTextArea(safeAreas, elements);

        // Calculate positions within the best area
        const positions = this.calculateTextPositions(bestArea, elements);

        // Apply positions
        elements.forEach((element, index) => {
            const position = positions[index];
            if (position) {
                element.style.transform = `translate(${position.x}px, ${position.y}px)`;
            }
        });
    }

    findBestTextArea(safeAreas, elements) {
        // Implement logic to find the best area based on brightness analysis
        // This should use the results from the background image analysis
        return safeAreas[0]; // Placeholder
    }

    calculateTextPositions(area, elements) {
        const positions = [];
        let currentY = area.top;
        const centerX = area.left + (area.right - area.left) / 2;

        elements.forEach(element => {
            const rect = element.getBoundingClientRect();
            positions.push({
                x: centerX - rect.width / 2,
                y: currentY
            });
            currentY += rect.height + 10; // Add spacing between elements
        });

        return positions;
    }
}

export default TextEditor;