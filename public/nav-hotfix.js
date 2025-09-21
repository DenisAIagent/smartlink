// Navigation Hotfix - Force menu standardization
(function() {
    'use strict';

    function standardizeNavigation() {
        // Find all navigation containers
        const navContainers = document.querySelectorAll('nav, .nav, .nav-menu');

        navContainers.forEach(nav => {
            // Check if this is an old-style navigation with li elements
            const listItems = nav.querySelectorAll('li.nav-item');

            if (listItems.length > 0) {
                console.log('🔧 Hotfix: Converting old navigation structure');

                // Create new navigation structure
                const newNav = document.createElement('nav');
                newNav.className = 'nav-menu';
                newNav.setAttribute('role', 'navigation');
                newNav.setAttribute('aria-label', 'Navigation principale');

                // Convert each li to direct a element
                listItems.forEach(li => {
                    const link = li.querySelector('a');
                    if (link) {
                        // Create new link
                        const newLink = document.createElement('a');
                        newLink.href = link.href;
                        newLink.className = 'nav-item';

                        // Check if it's active
                        if (link.classList.contains('active') || li.classList.contains('active')) {
                            newLink.classList.add('active');
                            newLink.setAttribute('aria-current', 'page');
                        }

                        // Get text content (remove icon)
                        const textContent = link.textContent.trim();

                        // Create span for text
                        const span = document.createElement('span');
                        span.textContent = textContent;
                        newLink.appendChild(span);

                        // Copy onclick if exists
                        if (link.getAttribute('onclick')) {
                            newLink.setAttribute('onclick', link.getAttribute('onclick'));
                        }

                        newNav.appendChild(newLink);
                    }
                });

                // Replace old navigation
                nav.parentNode.replaceChild(newNav, nav);
                console.log('✅ Navigation structure standardized');
            }
        });

        // Remove any remaining icons/emojis from navigation text
        document.querySelectorAll('.nav-item span').forEach(span => {
            const text = span.textContent;
            // Remove common emojis/icons
            const cleanText = text.replace(/[📊🔗✨⚙️🚪➕📈]/g, '').trim();
            if (cleanText !== text) {
                span.textContent = cleanText;
                console.log('🧹 Removed emoji from:', text, '→', cleanText);
            }
        });
    }

    // Run immediately if DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', standardizeNavigation);
    } else {
        standardizeNavigation();
    }

    // Also run on window load as fallback
    window.addEventListener('load', standardizeNavigation);

    console.log('🔧 Navigation hotfix loaded');
})();