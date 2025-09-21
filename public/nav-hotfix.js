/*
🔧 HOTFIX NAVIGATION - Script de correction automatique
🎯 Convertit automatiquement l'ancienne structure vers la nouvelle
⚡ Se lance au chargement de la page pour corriger la navigation
*/

(function() {
    'use strict';

    // Attendre que le DOM soit chargé
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔧 Navigation Hotfix - Démarrage...');

        // Chercher l'ancienne structure ul.nav-menu
        const oldNavMenu = document.querySelector('ul.nav-menu');
        if (!oldNavMenu) {
            console.log('✅ Navigation moderne déjà présente');
            return;
        }

        console.log('🔄 Conversion ancienne structure vers nouvelle...');

        // Créer la nouvelle structure nav.nav-menu
        const newNav = document.createElement('nav');
        newNav.className = 'nav-menu';
        newNav.setAttribute('role', 'navigation');
        newNav.setAttribute('aria-label', 'Navigation principale');

        // Mappeur des liens
        const linkMap = {
            '/pages/dashboard.html': { text: 'Dashboard', active: false },
            '/pages/list-smartlinks.html': { text: 'SmartLinks', active: false },
            '/pages/create-smartlink.html': { text: 'Créer SmartLink', active: false },
            '/pages/settings.html': { text: 'Settings', active: false }
        };

        // Détecter la page active
        const currentPath = window.location.pathname;
        if (linkMap[currentPath]) {
            linkMap[currentPath].active = true;
        } else if (currentPath.includes('smartlink')) {
            linkMap['/pages/list-smartlinks.html'].active = true;
        }

        // Créer les nouveaux liens
        Object.entries(linkMap).forEach(([href, config]) => {
            const link = document.createElement('a');
            link.href = href;
            link.className = 'nav-item' + (config.active ? ' active' : '');
            if (config.active) {
                link.setAttribute('aria-current', 'page');
            }

            const span = document.createElement('span');
            span.textContent = config.text;
            link.appendChild(span);

            newNav.appendChild(link);
        });

        // Ajouter le lien de déconnexion
        const logoutLink = document.createElement('a');
        logoutLink.href = '#';
        logoutLink.className = 'nav-item';
        logoutLink.onclick = function() {
            if (typeof logout === 'function') logout();
        };

        const logoutSpan = document.createElement('span');
        logoutSpan.textContent = 'Déconnexion';
        logoutLink.appendChild(logoutSpan);
        newNav.appendChild(logoutLink);

        // Remplacer l'ancienne navigation
        oldNavMenu.parentNode.replaceChild(newNav, oldNavMenu);

        console.log('✅ Navigation convertie avec succès!');

        // Ajouter les styles CSS si nécessaires
        addNavigationStyles();
    });

    function addNavigationStyles() {
        // Vérifier si les styles sont déjà présents
        if (document.getElementById('nav-hotfix-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'nav-hotfix-styles';
        styles.textContent = `
            .nav-menu a.nav-item {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                text-decoration: none;
                color: var(--gray-medium, #999999);
                border-radius: var(--border-radius, 12px);
                transition: var(--transition, all 0.3s ease);
                font-weight: 500;
                position: relative;
                margin-bottom: 8px;
            }

            .nav-menu a.nav-item:hover,
            .nav-menu a.nav-item.active {
                background: rgba(229, 9, 20, 0.08);
                color: var(--primary, #E50914);
                transform: translateX(4px);
            }

            .nav-menu a.nav-item.active::before {
                content: '';
                position: absolute;
                left: 0;
                top: 50%;
                transform: translateY(-50%);
                width: 3px;
                height: 24px;
                background: var(--primary, #E50914);
                border-radius: 2px;
            }
        `;

        document.head.appendChild(styles);
        console.log('✅ Styles de navigation ajoutés');
    }
})();