import AuthAPI from "/js/api/auth.js";
import Storage from "/js/utils/storage.js";
import Crypto from "/js/utils/crypto.js";

class AuthPage {
    constructor() {
        this.loginForm = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.authTabs = document.querySelectorAll('.auth-tab');

        this.initializeEventListeners();
        this.checkAuthState();
    }

    initializeEventListeners() {
        // Tab switching
        this.authTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Form submissions
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));

        // Password validation
        document.getElementById('registerPassword').addEventListener('input', (e) => {
            const password = e.target.value;
            const isValid = Crypto.validatePassword(password);
            e.target.setCustomValidity(isValid ? '' : PASSWORD_REQUIREMENTS);
        });
    }

    switchTab(tab) {
        this.authTabs.forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tab);
        });

        this.loginForm.style.display = tab === 'login' ? 'flex' : 'none';
        this.registerForm.style.display = tab === 'register' ? 'flex' : 'none';
    }

    async handleLogin(e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await AuthAPI.login(username, password);
            Storage.setAuth(response.token, response.id);
            window.location.href = '/home.html';
        } catch (error) {
            alert(error.message);
        }
    }

    async handleRegister(e) {
        e.preventDefault();

        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        if (!Crypto.validatePassword(password)) {
            alert(PASSWORD_REQUIREMENTS);
            return;
        }

        try {
            const response = await AuthAPI.register(username, email, password);
            Storage.setAuth(response.token, response.user.id);
            window.location.href = '/home.html';
        } catch (error) {
            alert(error.message);
        }
    }

    checkAuthState() {
        const auth = Storage.getAuth();
        if (auth) {
            window.location.href = '/home.html';
        }
    }
}

// Initialize the auth page
document.addEventListener('DOMContentLoaded', () => {
    new AuthPage();
});

export default AuthPage;