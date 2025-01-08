class TouchHandler {
    constructor(editorManager) {
        this.editor = editorManager;
        this.touchState = {
            active: false,
            startX: 0,
            startY: 0,
            lastX: 0,
            lastY: 0,
            startRotation: 0,
            startScale: 1,
            touchPoints: new Map()
        };

        this.selectedElement = null;
        this.transformType = null; // 'move', 'rotate', 'scale'
        this.snapThreshold = 5; // pixels for snap detection

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        const canvas = document.querySelector('.editor-canvas');

        // Touch events
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));

        // Mouse events for desktop testing
        canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.touchState.active = true;

        // Store all touch points
        Array.from(e.touches).forEach(touch => {
            this.touchState.touchPoints.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        });

        if (e.touches.length === 1) {
            // Single touch - Move or select
            const touch = e.touches[0];
            this.handleSingleTouchStart(touch);
        } else if (e.touches.length === 2) {
            // Double touch - Rotate/Scale
            this.handleDoubleTouchStart(e.touches);
        }

        this.showTouchFeedback(e.touches[0].clientX, e.touches[0].clientY);
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (!this.touchState.active) return;

        // Update stored touch points
        Array.from(e.touches).forEach(touch => {
            this.touchState.touchPoints.set(touch.identifier, {
                x: touch.clientX,
                y: touch.clientY
            });
        });

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleSingleTouchMove(touch);
        } else if (e.touches.length === 2) {
            this.handleDoubleTouchMove(e.touches);
        }
    }

    handleTouchEnd(e) {
        // Remove ended touch points
        Array.from(e.changedTouches).forEach(touch => {
            this.touchState.touchPoints.delete(touch.identifier);
        });

        if (this.touchState.touchPoints.size === 0) {
            this.touchState.active = false;
            this.finishTransformation();
        }
    }

    handleSingleTouchStart(touch) {
        this.touchState.startX = touch.clientX;
        this.touchState.startY = touch.clientY;
        this.touchState.lastX = touch.clientX;
        this.touchState.lastY = touch.clientY;

        const element = this.findTouchedElement(touch.clientX, touch.clientY);
        if (element) {
            this.selectedElement = element;
            this.transformType = 'move';
            this.editor.selectElement(element);
        } else {
            this.editor.clearSelection();
        }
    }

    handleDoubleTouchStart(touches) {
        const [touch1, touch2] = touches;
        this.touchState.startRotation = this.calculateRotation(touch1, touch2);
        this.touchState.startScale = this.calculateDistance(touch1, touch2);
        this.transformType = 'rotate-scale';
    }

    handleSingleTouchMove(touch) {
        if (!this.selectedElement || !this.transformType) return;

        const deltaX = touch.clientX - this.touchState.lastX;
        const deltaY = touch.clientY - this.touchState.lastY;

        if (this.transformType === 'move') {
            this.moveElement(this.selectedElement, deltaX, deltaY);
        }

        this.touchState.lastX = touch.clientX;
        this.touchState.lastY = touch.clientY;
    }

    handleDoubleTouchMove(touches) {
        if (!this.selectedElement || this.transformType !== 'rotate-scale') return;

        const [touch1, touch2] = touches;
        const currentRotation = this.calculateRotation(touch1, touch2);
        const currentScale = this.calculateDistance(touch1, touch2);

        const rotationDelta = currentRotation - this.touchState.startRotation;
        const scaleFactor = currentScale / this.touchState.startScale;

        this.transformElement(this.selectedElement, rotationDelta, scaleFactor);
    }

    // Mouse event handlers for desktop testing
    handleMouseDown(e) {
        if (e.button !== 0) return; // Only handle left click
        this.touchState.active = true;
        this.handleSingleTouchStart({
            clientX: e.clientX,
            clientY: e.clientY
        });
    }

    handleMouseMove(e) {
        if (!this.touchState.active) return;
        this.handleSingleTouchMove({
            clientX: e.clientX,
            clientY: e.clientY
        });
    }

    handleMouseUp() {
        if (!this.touchState.active) return;
        this.touchState.active = false;
        this.finishTransformation();
    }

    // Helper methods
    calculateRotation(touch1, touch2) {
        return Math.atan2(
            touch2.clientY - touch1.clientY,
            touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
    }

    calculateDistance(touch1, touch2) {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    findTouchedElement(x, y) {
        // Implement hit testing logic here
        const elements = document.querySelectorAll('.editor-element');
        return Array.from(elements).find(element => {
            const rect = element.getBoundingClientRect();
            return x >= rect.left && x <= rect.right &&
                y >= rect.top && y <= rect.bottom;
        });
    }

    moveElement(element, deltaX, deltaY) {
        const currentTransform = new DOMMatrix(getComputedStyle(element).transform);
        const newX = currentTransform.e + deltaX;
        const newY = currentTransform.f + deltaY;

        // Check for snapping
        const snappedPosition = this.checkSnapping(element, newX, newY);

        element.style.transform = `translate(${snappedPosition.x}px, ${snappedPosition.y}px) 
                                 rotate(${currentTransform.rotation}deg) 
                                 scale(${currentTransform.scale})`;
    }

    transformElement(element, rotation, scale) {
        const currentTransform = new DOMMatrix(getComputedStyle(element).transform);

        element.style.transform = `translate(${currentTransform.e}px, ${currentTransform.f}px) 
                                 rotate(${rotation}deg) 
                                 scale(${scale})`;
    }

    checkSnapping(element, x, y) {
        const elementRect = element.getBoundingClientRect();
        const canvasRect = document.querySelector('.editor-canvas').getBoundingClientRect();

        // Center snapping
        const centerX = canvasRect.width / 2;
        const elementCenterX = elementRect.width / 2;

        if (Math.abs(x + elementCenterX - centerX) < this.snapThreshold) {
            x = centerX - elementCenterX;
            this.showSnapIndicator('vertical', centerX);
        }

        // Add more snapping logic for other elements and edges

        return { x, y };
    }

    showSnapIndicator(direction, position) {
        let indicator = document.querySelector('.snap-indicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.className = 'snap-indicator';
            document.querySelector('.editor-canvas').appendChild(indicator);
        }

        indicator.classList.add(direction, 'visible');
        if (direction === 'vertical') {
            indicator.style.left = `${position}px`;
        } else {
            indicator.style.top = `${position}px`;
        }

        // Remove indicator after animation
        setTimeout(() => {
            indicator.remove();
        }, 1000);
    }

    showTouchFeedback(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;

        document.body.appendChild(ripple);

        // Remove after animation
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    finishTransformation() {
        if (this.selectedElement && this.transformType) {
            // Save the final state for undo/redo
            this.editor.saveState();
        }

        this.transformType = null;

        // Hide all snap indicators
        document.querySelectorAll('.snap-indicator').forEach(indicator => {
            indicator.remove();
        });
    }
}

export default TouchHandler;