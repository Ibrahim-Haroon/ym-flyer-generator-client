class EditorControls {
    constructor(canvasManager, bottomSheet) {
        this.canvasManager = canvasManager;
        this.bottomSheet = bottomSheet;
        this.activeTab = 'text';
        this.contextMenu = null;

        this.initialize();
    }

    initialize() {
        // Initialize tab switching
        this.initializeTabs();

        // Initialize FAB menu
        this.initializeFAB();

        // Initialize quick actions
        this.initializeQuickActions();

        // Initialize keyboard shortcuts
        this.initializeKeyboardShortcuts();

        // Initialize context menu handling
        this.initializeContextMenu();

        // Listen for selection changes
        if (this.canvasManager && this.canvasManager.state) {
            this.canvasManager.state.addObserver(this.handleStateChange.bind(this));
        }
    }

    initializeTabs() {
        const tabBar = document.querySelector('.tab-bar');
        const tabs = tabBar?.querySelectorAll('.tab-item');
        
        if (!tabs) return;

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    switchTab(tabId) {
        if (!tabId) return;

        // Update tab buttons
        document.querySelectorAll('.tab-item').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(pane => {
            pane.classList.toggle('active', pane.dataset.tab === tabId);
        });

        this.activeTab = tabId;

        // Expand bottom sheet when switching tabs
        if (this.bottomSheet) {
            this.bottomSheet.expand();
        }
    }

    initializeFAB() {
        const fab = document.querySelector('.fab-button');
        if (!fab || !this.bottomSheet) return;

        fab.addEventListener('click', () => {
            const currentState = this.bottomSheet.getState();
            if (currentState === 'collapsed') {
                this.bottomSheet.expand();
            } else {
                this.bottomSheet.collapse();
            }
        });
    }

    initializeQuickActions() {
        const actionButtons = `
            <div class="quick-actions">
                <button class="btn-icon" data-action="delete" aria-label="Delete">🗑️</button>
                <button class="btn-icon" data-action="duplicate" aria-label="Duplicate">📋</button>
                <button class="btn-icon" data-action="bring-forward" aria-label="Bring Forward">⬆️</button>
                <button class="btn-icon" data-action="send-backward" aria-label="Send Backward">⬇️</button>
            </div>
        `;

        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'quick-actions-container';
        actionsContainer.innerHTML = actionButtons;
        document.querySelector('.editor-canvas').appendChild(actionsContainer);

        actionsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('[data-action]');
            if (button) {
                this.handleQuickAction(button.dataset.action);
            }
        });
    }

    initializeContextMenu() {
        document.addEventListener('contextmenu', (e) => {
            if (this.canvasManager.state.getSelectedElement()) {
                e.preventDefault();
                this.showContextMenu(e.clientX, e.clientY);
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                this.hideContextMenu();
            }
        });

        // Hide on scroll
        document.addEventListener('scroll', () => {
            this.hideContextMenu();
        });
    }

    showContextMenu(x, y) {
        this.hideContextMenu();

        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="menu-item" data-action="delete">Delete</div>
            <div class="menu-item" data-action="duplicate">Duplicate</div>
            <div class="menu-item" data-action="bring-forward">Bring Forward</div>
            <div class="menu-item" data-action="send-backward">Send Backward</div>
        `;

        // Adjust position to keep menu in viewport
        const menuWidth = 200; // Approximate width
        const menuHeight = 160; // Approximate height
        const adjustedX = Math.min(x, window.innerWidth - menuWidth);
        const adjustedY = Math.min(y, window.innerHeight - menuHeight);

        menu.style.left = `${adjustedX}px`;
        menu.style.top = `${adjustedY}px`;

        document.body.appendChild(menu);
        this.contextMenu = menu;

        menu.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            if (action) {
                this.handleQuickAction(action);
                this.hideContextMenu();
            }
        });
    }

    hideContextMenu() {
        if (this.contextMenu) {
            this.contextMenu.remove();
            this.contextMenu = null;
        }
    }

    handleQuickAction(action) {
        const selectedElement = this.canvasManager.state.getSelectedElement();
        if (!selectedElement) return;

        switch (action) {
            case 'delete':
                this.canvasManager.removeElement(selectedElement.id);
                break;
            case 'duplicate':
                this.duplicateElement(selectedElement);
                break;
            case 'bring-forward':
                this.changeElementOrder(selectedElement, 1);
                break;
            case 'send-backward':
                this.changeElementOrder(selectedElement, -1);
                break;
        }
    }

    duplicateElement(element) {
        const clone = element.element.cloneNode(true);
        clone.style.transform = this.offsetTransform(element.element.style.transform);

        this.canvasManager.addElement(clone, element.type);
    }

    offsetTransform(transform) {
        // Add slight offset to duplicated elements
        const matrix = new DOMMatrix(transform);
        return `translate(${matrix.e + 20}px, ${matrix.f + 20}px) 
                rotate(${matrix.rotation}deg) 
                scale(${matrix.scale})`;
    }

    changeElementOrder(element, direction) {
        const container = document.querySelector('.editor-elements');
        const elements = Array.from(container.children);
        const index = elements.indexOf(element.element);
        const newIndex = index + direction;

        if (newIndex >= 0 && newIndex < elements.length) {
            if (direction > 0) {
                container.insertBefore(
                    element.element,
                    elements[newIndex].nextSibling
                );
            } else {
                container.insertBefore(
                    element.element,
                    elements[newIndex]
                );
            }
        }
    }

    handleStateChange(state) {
        // Show/hide quick actions based on selection
        const quickActions = document.querySelector('.quick-actions-container');
        if (quickActions) {
            const hasSelection = !!state.selectedElement;
            quickActions.classList.toggle('visible', hasSelection);
            
            if (hasSelection) {
                const element = state.selectedElement;
                const rect = element.getBoundingClientRect();

                // Position quick actions above the selected element
                quickActions.style.top = `${rect.top - quickActions.offsetHeight - 8}px`;
                quickActions.style.left = `${rect.left + (rect.width - quickActions.offsetWidth) / 2}px`;
            }
        }
    }

    initializeKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    this.handleQuickAction('delete');
                    break;
                case 'd':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.handleQuickAction('duplicate');
                    }
                    break;
                case 'ArrowUp':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.handleQuickAction('bring-forward');
                    }
                    break;
                case 'ArrowDown':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        this.handleQuickAction('send-backward');
                    }
                    break;
                case 'Escape':
                    this.hideContextMenu();
                    this.bottomSheet.collapse();
                    break;
            }
        });
    }
}

export default EditorControls;