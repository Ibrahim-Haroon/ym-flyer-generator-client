const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    ENDPOINTS: {
        REGISTER: '/users/register',
        LOGIN: '/users/login',
        USER: '/users',
        FLYER: '/flyer',
        PROVIDER: '/llm_provider'
    }
};

const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$/;
const PASSWORD_REQUIREMENTS = 'Password must contain at least 8 characters, one uppercase letter, and one number';

export default API_CONFIG;