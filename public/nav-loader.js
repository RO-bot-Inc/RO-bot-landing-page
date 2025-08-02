
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
                } else if (alpineComponent) {
                    // If Alpine isn't ready yet, try again in a moment
                    setTimeout(initializeNav, 100);
                }
            };
            
            // Multiple initialization strategies for reliability
            if (window.Alpine) {
                // Alpine is already loaded
                setTimeout(initializeNav, 50);
            } else {
                // Wait for Alpine to load with multiple fallbacks
                document.addEventListener('alpine:init', initializeNav);
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        if (window.Alpine) {
                            initializeNav();
                        }
                    }, 100);
                });
                // Additional fallback - check periodically for Alpine
                let attempts = 0;
                const checkAlpine = setInterval(() => {
                    if (window.Alpine || attempts > 50) {
                        clearInterval(checkAlpine);
                        if (window.Alpine) {
                            initializeNav();
                        }
                    }
                    attempts++;
                }, 100);
            }
            
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }
});
