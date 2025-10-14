// MDMC Admin Interface - JavaScript principal

class MDMCAdmin {
    constructor() {
        // Configuration dynamique basée sur l'environnement
        if (window.MDMC_CONFIG) {
            this.config = window.MDMC_CONFIG;
            console.log('✅ Using MDMC_CONFIG from config.js:', this.config);
        } else {
            this.config = {
                API_BASE_URL: this.detectBackendUrl(),
                ENVIRONMENT: 'development'
            };
            console.warn('⚠️ MDMC_CONFIG not found, using fallback:', this.config);
        }

        this.init();
        console.log('🔧 MDMC Admin initialized with config:', this.config);
    }

    detectBackendUrl() {
        // Détection automatique de l'URL backend
        const hostname = window.location.hostname;
        if (hostname.includes('mdmcmusicads.com')) {
            return `https://${hostname}`; // Use same domain for admin interface
        }
        if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
            return 'http://localhost:3003'; // Fixed: Use correct local port
        }
        // Fallback pour Railway et autres environnements
        return `https://${hostname}`; // Use current domain as fallback
    }

    init() {
        this.setupEventListeners();
        this.loadUserSession();
        this.highlightCurrentPage();
        
        // Auto-refresh des stats toutes les 30 secondes sur le dashboard
        if (window.location.pathname.includes('dashboard')) {
            setInterval(() => this.refreshStats(), 30000);
        }
    }

    setupEventListeners() {
        // Navigation active
        document.addEventListener('DOMContentLoaded', () => {
            this.highlightCurrentPage();
        });

        // Forms auto-save
        document.querySelectorAll('.auto-save').forEach(form => {
            form.addEventListener('input', this.debounce(() => {
                this.autoSave(form);
            }, 1000));
        });

        // Confirmation pour actions destructives
        document.querySelectorAll('.confirm-action').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const message = btn.dataset.confirmMessage || 'Êtes-vous sûr de vouloir continuer ?';
                if (!confirm(message)) {
                    e.preventDefault();
                }
            });
        });
    }

    highlightCurrentPage() {
        const currentPath = window.location.pathname;
        document.querySelectorAll('.admin-nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === currentPath || 
                (currentPath.includes(link.getAttribute('href')) && link.getAttribute('href') !== '/')) {
                link.classList.add('active');
            }
        });
    }

    // API Helpers
    async apiCall(endpoint, options = {}) {
        const url = `${this.config.API_BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Important pour les cookies
        };

        // Ajouter token si disponible (backup via localStorage)
        const token = localStorage.getItem('authToken');
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }

        console.log('🌐 API Call:', url, options.method || 'GET');
        if (options.body) {
            console.log('📤 Request payload:', JSON.parse(options.body));
        }
        
        try {
            const response = await fetch(url, { ...defaultOptions, ...options });
            
            if (!response.ok) {
                // Récupérer le message d'erreur du serveur si possible
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // Ignorer les erreurs de parsing JSON
                }
                throw new Error(errorMessage);
            }

            const data = await response.json();
            console.log('✅ API Response:', data);
            return data;
        } catch (error) {
            console.error('❌ API Error:', error);
            this.showNotification(`Erreur: ${error.message}`, 'danger');
            throw error;
        }
    }

    // Notifications
    showNotification(message, type = 'info', duration = 5000) {
        // Retirer les anciennes notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `alert alert-${type} notification`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.2rem; cursor: pointer;">&times;</button>
            </div>
        `;

        document.body.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                notification.remove();
            }, duration);
        }
    }

    // Loading states
    showLoading(element, text = 'Chargement...') {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <div class="loading"></div>
                <span>${text}</span>
            </div>
        `;
        loading.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        element.style.position = 'relative';
        element.appendChild(loading);
    }

    hideLoading(element) {
        const loading = element.querySelector('.loading-overlay');
        if (loading) {
            loading.remove();
        }
    }

    // Form helpers
    validateForm(form) {
        let isValid = true;
        const requiredFields = form.querySelectorAll('[required]');

        requiredFields.forEach(field => {
            field.classList.remove('is-invalid', 'is-valid');
            
            if (!field.value.trim()) {
                field.classList.add('is-invalid');
                this.showFieldError(field, 'Ce champ est requis');
                isValid = false;
            } else {
                field.classList.add('is-valid');
                this.clearFieldError(field);
            }
        });

        // Validation spécifique par type
        form.querySelectorAll('input[type="email"]').forEach(email => {
            if (email.value && !this.isValidEmail(email.value)) {
                email.classList.add('is-invalid');
                this.showFieldError(email, 'Format email invalide');
                isValid = false;
            }
        });

        form.querySelectorAll('input[type="url"]').forEach(url => {
            if (url.value && !this.isValidUrl(url.value)) {
                url.classList.add('is-invalid');
                this.showFieldError(url, 'Format URL invalide');
                isValid = false;
            }
        });

        return isValid;
    }

    showFieldError(field, message) {
        this.clearFieldError(field);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback';
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        field.parentNode.appendChild(errorDiv);
    }

    clearFieldError(field) {
        const existingError = field.parentNode.querySelector('.invalid-feedback');
        if (existingError) {
            existingError.remove();
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    // Session management
    loadUserSession() {
        const user = localStorage.getItem('adminUser');
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                this.updateUserDisplay();
            } catch (error) {
                console.error('Erreur session utilisateur:', error);
                localStorage.removeItem('adminUser');
            }
        }
    }

    updateUserDisplay() {
        if (this.currentUser) {
            const userElements = document.querySelectorAll('.user-name');
            userElements.forEach(el => {
                el.textContent = this.currentUser.name || 'Admin';
            });
        }
    }

    // Auto-save functionality
    autoSave(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const saveKey = `autosave_${form.id || 'form'}_${Date.now()}`;
        localStorage.setItem(saveKey, JSON.stringify(data));
        
        this.showNotification('Brouillon sauvegardé', 'info', 2000);
    }

    // Stats refresh
    async refreshStats() {
        try {
            const stats = await this.apiCall('/api/stats/dashboard');
            this.updateStatsDisplay(stats);
        } catch (error) {
            console.error('Erreur actualisation stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        if (stats.data) {
            Object.entries(stats.data).forEach(([key, value]) => {
                const element = document.querySelector(`[data-stat="${key}"]`);
                if (element) {
                    element.textContent = value;
                }
            });
        }
    }

    // Utility functions
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

    formatDate(date, options = {}) {
        const defaultOptions = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options })
            .format(new Date(date));
    }

    formatNumber(number, locale = 'fr-FR') {
        return new Intl.NumberFormat(locale).format(number);
    }

    // File upload helper
    async uploadFile(file, endpoint = '/api/upload') {
        const formData = new FormData();
        formData.append('file', file);

        return await this.apiCall(endpoint, {
            method: 'POST',
            body: formData,
            headers: {} // Remove Content-Type to let browser set it with boundary
        });
    }

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copié dans le presse-papiers', 'success', 2000);
        } catch (error) {
            // Fallback pour navigateurs plus anciens
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Copié dans le presse-papiers', 'success', 2000);
        }
    }

    // Debug helper pour inspecter les données
    debugData(label, data) {
        console.group(`🔍 DEBUG: ${label}`);
        console.log('Type:', typeof data);
        console.log('Data:', data);
        if (data && typeof data === 'object') {
            console.log('Keys:', Object.keys(data));
            if (Array.isArray(data)) {
                console.log('Length:', data.length);
                if (data.length > 0) {
                    console.log('First item:', data[0]);
                }
            }
        }
        console.groupEnd();
    }
}

// Styles pour les animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialisation globale
window.mdmcAdmin = new MDMCAdmin();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MDMCAdmin;
}