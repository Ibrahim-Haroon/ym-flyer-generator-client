const UI = {
    checkAuth() {
        const auth = Storage.getAuth();
        if (!auth) {
            window.location.href = '/index.html';
            return null;
        }
        return auth;
    },

    addAuthHeader(headers = {}) {
        const auth = this.checkAuth();
        if (!auth) return headers;

        return {
            ...headers,
            'Authorization': `Bearer ${auth.token}`
        };
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.style.display = 'block';

        // Close on outside click
        const handleOutsideClick = (e) => {
            if (e.target === modal) {
                this.hideModal(modalId);
                modal.removeEventListener('click', handleOutsideClick);
            }
        };

        modal.addEventListener('click', handleOutsideClick);
    },

    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    },

    createProviderKeyInput(provider, type, value = '', disabled = false) {
        return `
            <div class="provider-key-group">
                <label for="${type}-${provider}-key">${provider}</label>
                <div class="key-input-group">
                    <input type="password" 
                           id="${type}-${provider}-key"
                           class="input ${disabled ? 'disabled' : ''}"
                           placeholder="Enter API Key"
                           value="${value}"
                           ${disabled ? 'disabled' : ''}>
                    <button class="btn-icon toggle-visibility" type="button">
                        👁️
                    </button>
                </div>
            </div>
        `;
    },

    validateInput(input, validationFn, errorMessage) {
        const isValid = validationFn(input.value);
        input.setCustomValidity(isValid ? '' : errorMessage);
        return isValid;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};