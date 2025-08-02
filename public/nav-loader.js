
// Navigation loader script
document.addEventListener('DOMContentLoaded', async function() {
    const navPlaceholder = document.getElementById('navigation-placeholder');
    if (navPlaceholder) {
        try {
            const response = await fetch('/navigation-component.html');
            const navHTML = await response.text();
            
            // Insert the HTML directly
            navPlaceholder.innerHTML = navHTML;
            
            // Function to initialize the navigation
            const initializeNav = () => {
                const alpineComponent = navPlaceholder.querySelector('[x-data]');
                if (alpineComponent && window.Alpine) {
                    // Force the initial state to be closed
                    alpineComponent.setAttribute('x-data', '{ mobileMenuOpen: false }');
                    window.Alpine.initTree(alpineComponent);
                }
            };
            
            // If Alpine is already loaded, initialize immediately
            if (window.Alpine) {
                initializeNav();
            } else {
                // Otherwise, wait for Alpine to load
                document.addEventListener('alpine:init', initializeNav);
                // Also try when the script loads (for defer scripts)
                window.addEventListener('load', () => {
                    if (window.Alpine) {
                        initializeNav();
                    }
                });
            }
            
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }
});
