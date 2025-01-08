const Crypto = {
    /**
     * Creates a 60-character hash that matches the server's expectations
     * Note: This is a simplified version for development purposes
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password + "saltysalt"); // Add a static salt
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        // Take first 57 chars and append $2a$ to match expected format and length
        return '$2a' + hashHex.slice(0, 57);
    },

    /**
     * Validates password requirements:
     * - At least 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one number
     */
    validatePassword(password) {
        if (typeof password !== 'string') return false;
        return /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$/.test(password);
    }
};

export default Crypto;