// Navigation loader script
document.addEventListener('DOMContentLoaded', async function() {
    const navPlaceholder = document.getElementById('navigation-placeholder');
    if (navPlaceholder) {
        try {
            const response = await fetch('/navigation-component.html');
            const navHTML = await response.text();

            // Create a temporary container
            const temp = document.createElement('div');
            temp.innerHTML = navHTML;

            // Get the nav element
            const nav = temp.querySelector('nav');

            // Replace the placeholder with the nav element
            navPlaceholder.replaceWith(nav);

            // For Alpine 3.x that's already initialized
            if (window.Alpine && window.Alpine.version) {
                // We need to manually initialize the component
                const navData = nav.getAttribute('x-data');
                if (navData) {
                    // Evaluate the x-data expression
                    const data = eval(`(${navData})`);

                    // Initialize Alpine on this element
                    window.Alpine.data('navigation', () => data);
                    window.Alpine.initTree(nav);
                }
            }

        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }
});