class BottomSheet {
    constructor() {
        this.sheet = document.querySelector('.bottom-sheet');
        this.handle = document.querySelector('.sheet-handle');
        this.content = document.querySelector('.sheet-content');
        
        if (!this.sheet || !this.handle || !this.content) {
            console.error('Required bottom sheet elements not found');
            return;
        }

        // Calculate dimensions
        this.sheetHeight = this.sheet.offsetHeight;
        this.peekHeight = 80; // Height when collapsed
        
        // Add backdrop
        this.createBackdrop();
        
        // Initialize in collapsed state
        this.sheet.style.transform = `translateY(calc(100% - ${this.peekHeight}px))`;
        this.sheet.style.transition = 'transform 0.3s ease-out';
        this.backdrop.style.opacity = '0';
        this.backdrop.style.transition = 'opacity 0.3s ease-out';
    }

    createBackdrop() {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'sheet-backdrop';
        this.backdrop.style.position = 'fixed';
        this.backdrop.style.top = '0';
        this.backdrop.style.left = '0';
        this.backdrop.style.right = '0';
        this.backdrop.style.bottom = '0';
        this.backdrop.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.backdrop.style.opacity = '0';
        this.backdrop.style.pointerEvents = 'none';
        document.body.appendChild(this.backdrop);

        this.backdrop.addEventListener('click', () => {
            this.collapse();
        });
    }

    expand() {
        if (!this.sheet) return;
        this.sheet.style.transform = 'translateY(0)';
        this.backdrop.style.opacity = '0.5';
        this.backdrop.style.pointerEvents = 'auto';
    }

    collapse() {
        if (!this.sheet) return;
        this.sheet.style.transform = `translateY(calc(100% - ${this.peekHeight}px))`;
        this.backdrop.style.opacity = '0';
        this.backdrop.style.pointerEvents = 'none';
    }

    getState() {
        if (!this.sheet) return 'collapsed';
        const transform = this.sheet.style.transform;
        return transform === 'translateY(0px)' ? 'expanded' : 'collapsed';
    }
}

export default BottomSheet;