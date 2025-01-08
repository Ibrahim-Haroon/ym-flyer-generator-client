class ColorPicker {
    constructor(container) {
        this.container = container;
        this.wheel = container.querySelector('.color-wheel');
        this.selector = document.createElement('div');
        this.selector.className = 'color-selector';
        this.wheel.appendChild(this.selector);

        this.opacitySlider = container.querySelector('.opacity-slider');
        this.preview = container.querySelector('.color-preview');
        this.recentColors = [];
        this.maxRecentColors = 10;

        this.currentColor = { h: 0, s: 100, l: 50, a: 1 };
        this.onChange = null;

        this.initializeEvents();
        this.updateColorPreview();
    }

    initializeEvents() {
        // Wheel events
        this.wheel.addEventListener('mousedown', this.handleWheelMouseDown.bind(this));
        this.wheel.addEventListener('touchstart', this.handleWheelTouchStart.bind(this));

        // Opacity events
        this.opacitySlider.addEventListener('input', this.handleOpacityChange.bind(this));

        // Prevent default touch behaviors
        this.wheel.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    }

    handleWheelMouseDown(e) {
        e.preventDefault();
        this.updateColorFromEvent(e);

        const handleMouseMove = (e) => {
            e.preventDefault();
            this.updateColorFromEvent(e);
        };

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            this.addToRecentColors(this.getCurrentColor());
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    handleWheelTouchStart(e) {
        e.preventDefault();
        this.updateColorFromEvent(e.touches[0]);

        const handleTouchMove = (e) => {
            e.preventDefault();
            this.updateColorFromEvent(e.touches[0]);
        };

        const handleTouchEnd = () => {
            this.wheel.removeEventListener('touchmove', handleTouchMove);
            this.wheel.removeEventListener('touchend', handleTouchEnd);
            this.addToRecentColors(this.getCurrentColor());
        };

        this.wheel.addEventListener('touchmove', handleTouchMove);
        this.wheel.addEventListener('touchend', handleTouchEnd);
    }

    updateColorFromEvent(e) {
        const rect = this.wheel.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const x = e.clientX - rect.left - centerX;
        const y = e.clientY - rect.top - centerY;

        // Calculate angle and distance from center
        const angle = Math.atan2(y, x);
        const distance = Math.min(Math.sqrt(x * x + y * y), centerX);

        // Convert to HSL
        this.currentColor.h = ((angle * 180 / Math.PI) + 360) % 360;
        this.currentColor.s = (distance / centerX) * 100;

        this.updateColorPreview();
        this.updateSelector(x + centerX, y + centerY);
    }

    handleOpacityChange(e) {
        this.currentColor.a = e.target.value / 100;
        this.updateColorPreview();
    }

    updateSelector(x, y) {
        this.selector.style.left = `${x}px`;
        this.selector.style.top = `${y}px`;
    }

    updateColorPreview() {
        const color = this.getCurrentColor();
        this.preview.style.backgroundColor = color;
        this.opacitySlider.style.color = this.getCurrentColor(1); // Full opacity for gradient

        if (this.onChange) {
            this.onChange(color);
        }
    }

    getCurrentColor(overrideAlpha = null) {
        const { h, s, l, a } = this.currentColor;
        const alpha = overrideAlpha !== null ? overrideAlpha : a;
        return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    }

    addToRecentColors(color) {
        if (!this.recentColors.includes(color)) {
            this.recentColors.unshift(color);
            if (this.recentColors.length > this.maxRecentColors) {
                this.recentColors.pop();
            }
            this.updateRecentColorsUI();
        }
    }

    updateRecentColorsUI() {
        const recentContainer = this.container.querySelector('.recent-colors');
        if (!recentContainer) return;

        recentContainer.innerHTML = this.recentColors
            .map(color => `
                <div class="color-swatch" 
                     style="background-color: ${color}"
                     data-color="${color}">
                </div>
            `).join('');

        // Add click events to swatches
        recentContainer.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                const color = swatch.dataset.color;
                // Parse HSLA color and update current color
                const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%,?\s*([0-9.]*)?\)/);
                if (match) {
                    this.currentColor.h = parseInt(match[1]);
                    this.currentColor.s = parseInt(match[2]);
                    this.currentColor.l = parseInt(match[3]);
                    this.currentColor.a = match[4] ? parseFloat(match[4]) : 1;
                    this.updateColorPreview();
                }
            });
        });
    }

    setColor(color) {
        // Parse color string and update currentColor
        const match = color.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%,?\s*([0-9.]*)?\)/);
        if (match) {
            this.currentColor.h = parseInt(match[1]);
            this.currentColor.s = parseInt(match[2]);
            this.currentColor.l = parseInt(match[3]);
            this.currentColor.a = match[4] ? parseFloat(match[4]) : 1;
            this.updateColorPreview();

            // Update selector position
            const angle = this.currentColor.h * Math.PI / 180;
            const radius = (this.currentColor.s / 100) * (this.wheel.offsetWidth / 2);
            const centerX = this.wheel.offsetWidth / 2;
            const centerY = this.wheel.offsetHeight / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            this.updateSelector(x, y);
        }
    }
}

// Export for use in other modules
export default ColorPicker;