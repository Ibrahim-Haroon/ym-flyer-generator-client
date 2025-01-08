class Command {
    execute() {
        throw new Error('execute() must be implemented');
    }

    undo() {
        throw new Error('undo() must be implemented');
    }
}

// Move element command
class MoveCommand extends Command {
    constructor(element, oldPosition, newPosition) {
        super();
        this.element = element;
        this.oldPosition = { ...oldPosition };
        this.newPosition = { ...newPosition };
    }

    execute() {
        this.applyTransform(this.newPosition);
    }

    undo() {
        this.applyTransform(this.oldPosition);
    }

    applyTransform({ x, y }) {
        const currentTransform = new DOMMatrix(getComputedStyle(this.element).transform);
        this.element.style.transform = `translate(${x}px, ${y}px) rotate(${currentTransform.rotation}deg) scale(${currentTransform.scale})`;
    }
}

// Transform element command (rotation/scale)
class TransformCommand extends Command {
    constructor(element, oldTransform, newTransform) {
        super();
        this.element = element;
        this.oldTransform = { ...oldTransform };
        this.newTransform = { ...newTransform };
    }

    execute() {
        this.applyTransform(this.newTransform);
    }

    undo() {
        this.applyTransform(this.oldTransform);
    }

    applyTransform({ rotation, scale }) {
        const currentTransform = new DOMMatrix(getComputedStyle(this.element).transform);
        this.element.style.transform = `translate(${currentTransform.e}px, ${currentTransform.f}px) rotate(${rotation}deg) scale(${scale})`;
    }
}

// Style change command
class StyleCommand extends Command {
    constructor(element, property, oldValue, newValue) {
        super();
        this.element = element;
        this.property = property;
        this.oldValue = oldValue;
        this.newValue = newValue;
    }

    execute() {
        this.element.style[this.property] = this.newValue;
    }

    undo() {
        this.element.style[this.property] = this.oldValue;
    }
}

// Add/Remove element command
class ElementCommand extends Command {
    constructor(parentElement, element, action) {
        super();
        this.parentElement = parentElement;
        this.element = element;
        this.action = action; // 'add' or 'remove'
        this.position = null; // For remove, store position in parent
    }

    execute() {
        if (this.action === 'add') {
            this.parentElement.appendChild(this.element);
        } else {
            this.position = Array.from(this.parentElement.children).indexOf(this.element);
            this.element.remove();
        }
    }

    undo() {
        if (this.action === 'add') {
            this.element.remove();
        } else {
            const nextSibling = this.parentElement.children[this.position];
            this.parentElement.insertBefore(this.element, nextSibling);
        }
    }
}

// Batch command for multiple operations
class BatchCommand extends Command {
    constructor(commands) {
        super();
        this.commands = commands;
    }

    execute() {
        this.commands.forEach(command => command.execute());
    }

    undo() {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}

// Command manager to handle undo/redo stack
class CommandManager {
    constructor() {
        this.undoStack = [];
        this.redoStack = [];
        this.maxStackSize = 50; // Limit stack size to prevent memory issues
    }

    execute(command) {
        command.execute();
        this.undoStack.push(command);
        this.redoStack = []; // Clear redo stack

        // Limit stack size
        if (this.undoStack.length > this.maxStackSize) {
            this.undoStack.shift();
        }

        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.undoStack.length === 0) return;

        const command = this.undoStack.pop();
        command.undo();
        this.redoStack.push(command);

        this.updateUndoRedoButtons();
    }

    redo() {
        if (this.redoStack.length === 0) return;

        const command = this.redoStack.pop();
        command.execute();
        this.undoStack.push(command);

        this.updateUndoRedoButtons();
    }

    clear() {
        this.undoStack = [];
        this.redoStack = [];
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.querySelector('.btn-undo');
        const redoBtn = document.querySelector('.btn-redo');

        if (undoBtn) {
            undoBtn.disabled = this.undoStack.length === 0;
        }
        if (redoBtn) {
            redoBtn.disabled = this.redoStack.length === 0;
        }
    }
}

export {
    Command,
    MoveCommand,
    TransformCommand,
    StyleCommand,
    ElementCommand,
    BatchCommand,
    CommandManager
};