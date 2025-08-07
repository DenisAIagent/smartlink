import { logToDebug } from './debug.js';
import { loginUser } from './api.js';

const loginForm = document.getElementById('login-form');
const passwordInput = document.getElementById('password');
const strengthBar = document.getElementById('strength-bar');

// --- Password Strength Indicator ---
passwordInput.addEventListener('input', () => {
    const pass = passwordInput.value;
    let score = 0;
    if (pass.length > 8) score++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^a-zA-Z0-9]/.test(pass)) score++;

    const width = (score / 4) * 100;
    let color;
    switch (score) {
        case 0:
        case 1:
            color = '#cf6679'; // Weak
            break;
        case 2:
            color = '#f0c420'; // Medium
            break;
        case 3:
        case 4:
            color = '#03dac6'; // Strong
            break;
        default:
            color = '#333';
    }

    strengthBar.style.width = `${width}%`;
    strengthBar.style.backgroundColor = color;
});

// --- JWT Decoder Helper ---
function decodeJwt(token) {
    try {
        // Decode the payload part of the JWT
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        logToDebug('JWT Error', 'Failed to decode JWT.', true);
        return null;
    }
}

// --- Login Form Submission Handler ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    const rememberMe = e.target['remember-me'].checked;

    const requestBody = { email, password };
    logToDebug('Network Request', `POST /api/auth/login\nBody: ${JSON.stringify(requestBody, null, 2)}`);

    try {
        const responseBody = await loginUser(email, password);

        logToDebug(`Network Response (200)`, JSON.stringify(responseBody, null, 2));

        const accessToken = responseBody.accessToken;
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem('accessToken', accessToken);
        logToDebug('JWT Stored', `Access token stored in ${rememberMe ? 'localStorage' : 'sessionStorage'}.`);

        const decodedToken = decodeJwt(accessToken);
        if (decodedToken) {
            logToDebug('JWT Decoded', JSON.stringify(decodedToken, null, 2));
        }

        logToDebug('Redirect', 'Login successful. Redirecting to dashboard...');

        // Redirect to dashboard on success
        setTimeout(() => {
            window.location.href = '/dashboard.html';
        }, 500);

    } catch (error) {
        const status = error.status || 'N/A';
        const body = error.body ? JSON.stringify(error.body, null, 2) : 'No response body.';
        logToDebug(`Network Response (${status})`, body, true);
        logToDebug('Authentication Error', error.message, true);
    }
});

// Initial log to show the system is ready
logToDebug('System', 'Login page initialized. Modules loaded.');
