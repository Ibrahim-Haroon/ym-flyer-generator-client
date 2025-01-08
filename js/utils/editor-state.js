class EditorState {
    constructor() {
        this.state = {
            selectedElement: null,
            elements: new Map(), // Map of element IDs to their states
            initialStates: new Map(), // Store initial states for reset
            backgroundImage: null
        };

        // Initialize canvas dimensions
        this.canvasDimensions = {
            width: 0,
            height: 0
        };

        this.observers = new Set();
    }

    // State management
    getState() {
        return { ...this.state };
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyObservers();
    }

    // Element management
    addElement(element, type) {
        const id = this.generateId();
        element.dataset.editorId = id;

        const elementState = {
            id,
            type,
            element,
            position: { x: 0, y: 0 },
            transform: { rotation: 0, scale: 1 },
            style: this.captureElementStyle(element)
        };

        this.state.elements.set(id, elementState);
        this.initialStates.set(id, { ...elementState });
        this.notifyObservers();

        return id;
    }

    removeElement(id) {
        const element = this.state.elements.get(id);
        if (element) {
            this.state.elements.delete(id);
            this.initialStates.delete(id);
            if (this.state.selectedElement === id) {
                this.state.selectedElement = null;
            }
            this.notifyObservers();
        }
    }

    updateElement(id, updates) {
        const element = this.state.elements.get(id);
        if (element) {
            this.state.elements.set(id, { ...element, ...updates });
            this.notifyObservers();
        }
    }

    // Selection management
    setSelectedElement(id) {
        this.state.selectedElement = id;
        this.notifyObservers();
    }

    getSelectedElement() {
        return this.state.selectedElement ?
            this.state.elements.get(this.state.selectedElement) :
            null;
    }

    // Background management
    setBackgroundImage(imageUrl) {
        this.state.backgroundImage = imageUrl;
        this.notifyObservers();
    }

    // Canvas dimensions
    setCanvasDimensions(width, height) {
        this.canvasDimensions = { width, height };
        this.notifyObservers();
    }

    getCanvasDimensions() {
        return { ...this.canvasDimensions };
    }

    // Reset functionality
    reset() {
        this.state.elements.forEach((state, id) => {
            const initialState = this.initialStates.get(id);
            if (initialState) {
                this.applyElementState(state.element, initialState);
                this.state.elements.set(id, { ...initialState });
            }
        });
        this.notifyObservers();
    }

    // Observer pattern
    addObserver(observer) {
        this.observers.add(observer);
    }

    removeObserver(observer) {
        this.observers.delete(observer);
    }

    notifyObservers() {
        this.observers.forEach(observer => observer(this.getState()));
    }

    // Helper methods
    generateId() {
        return `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    captureElementStyle(element) {
        const computed = window.getComputedStyle(element);
        return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontStyle: computed.fontStyle,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            opacity: computed.opacity
        };
    }

    applyElementState(element, state) {
        // Apply position and transform
        element.style.transform = `
            translate(${state.position.x}px, ${state.position.y}px)
            rotate(${state.transform.rotation}deg)
            scale(${state.transform.scale})
        `;

        // Apply styles
        Object.entries(state.style).forEach(([property, value]) => {
            element.style[property] = value;
        });
    }

    // Export/Import state
    exportState() {
        const exportableState = {
            elements: Array.from(this.state.elements.entries()),
            backgroundImage: this.state.backgroundImage,
            canvasDimensions: this.canvasDimensions
        };
        return JSON.stringify(exportableState);
    }

    importState(stateJson) {
        try {
            const importedState = JSON.parse(stateJson);
            this.state.elements = new Map(importedState.elements);
            this.state.backgroundImage = importedState.backgroundImage;
            this.canvasDimensions = importedState.canvasDimensions;
            this.notifyObservers();
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }

    // Utility methods for element positioning
    getElementCenter(id) {
        const element = this.state.elements.get(id);
        if (!element) return null;

        const rect = element.element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    getElementBounds(id) {
        const element = this.state.elements.get(id);
        if (!element) return null;

        return element.element.getBoundingClientRect();
    }

    isElementInBounds(id) {
        const bounds = this.getElementBounds(id);
        if (!bounds) return false;

        return bounds.left >= 0 &&
            bounds.right <= this.canvasDimensions.width &&
            bounds.top >= 0 &&
            bounds.bottom <= this.canvasDimensions.height;
    }
}

export default EditorState;