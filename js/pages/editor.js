import BottomSheet from "/js/editor/bottom-sheet.js";
import CanvasManager from "/js/editor/canvas-manager.js";
import TextEditor from "/js/editor/text-editor.js";
import LogoHandler from "/js/editor/logo-handler.js";
import EditorControls from "/js/editor/editor-controls.js";

class EditorPage {
    constructor() {
        this.initialize();
    }

    async initialize() {
        await this.initializeComponents();
        this.initializeTabBar();
        this.initializeButtons();
    }

    initializeTabBar() {
        const tabBar = document.querySelector('.tab-bar');
        const tabs = document.querySelectorAll('.tab-item');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Remove active class from all tabs and contents
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // Add active class to clicked tab and corresponding content
                tab.classList.add('active');
                const contentId = tab.dataset.tab;
                document.querySelector(`.tab-content[data-tab="${contentId}"]`).classList.add('active');
            });
        });
    }

    initializeButtons() {
        // Initialize Apply Text button
        const applyTextBtn = document.getElementById('applyText');
        if (applyTextBtn) {
            applyTextBtn.addEventListener('click', () => {
                this.textEditor.applyTextChanges();
            });
        }

        // Initialize Apply Logos button
        const applyLogosBtn = document.getElementById('applyLogos');
        if (applyLogosBtn) {
            applyLogosBtn.addEventListener('click', () => {
                this.logoHandler.applyLogos();
            });
        }

        // Initialize style controls
        const fontSizeSlider = document.querySelector('.font-size-slider');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                document.querySelector('.font-size-value').textContent = `${value}px`;
                if (this.textEditor) {
                    this.textEditor.applyStyle('fontSize', `${value}px`);
                }
            });
        }

        // Initialize font style buttons
        document.querySelectorAll('.font-style-buttons .btn-icon').forEach(btn => {
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                if (this.textEditor) {
                    const style = btn.dataset.style;
                    if (style === 'bold') {
                        this.textEditor.applyStyle('fontWeight', btn.classList.contains('active') ? 'bold' : 'normal');
                    } else if (style === 'italic') {
                        this.textEditor.applyStyle('fontStyle', btn.classList.contains('active') ? 'italic' : 'normal');
                    }
                }
            });
        });
    }

    async initializeComponents() {
        this.bottomSheet = new BottomSheet();
        this.canvasManager = new CanvasManager();
        this.textEditor = new TextEditor(this.canvasManager);
        this.logoHandler = new LogoHandler(this.canvasManager);
        this.editorControls = new EditorControls(this.canvasManager, this.bottomSheet);
    }
}

// Initialize the editor page
document.addEventListener('DOMContentLoaded', () => {
    new EditorPage();
});
