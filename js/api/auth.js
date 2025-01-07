import API_CONFIG from "/js/api/config.js";
import Crypto from "/js/utils/crypto.js";

const AuthAPI = {
    async register(username, email, password) {
        const hashedPassword = await Crypto.hashPassword(password);
        console.log(hashedPassword)

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REGISTER}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password: hashedPassword
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Registration failed');
        }

        return response.json();
    },

    async login(username, password) {
        const hashedPassword = await Crypto.hashPassword(password);

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password: hashedPassword
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Login failed');
        }

        return response.json();
    }
};

export default AuthAPI;