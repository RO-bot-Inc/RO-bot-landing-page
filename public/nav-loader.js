// Navigation loader script
document.addEventListener('DOMContentLoaded', async function() {
    const navPlaceholder = document.getElementById('navigation-placeholder');
    if (navPlaceholder) {
        try {
            const response = await fetch('/navigation-component.html');
            const navHTML = await response.text();

            // Insert the HTML directly
            navPlaceholder.innerHTML = navHTML;

            // Find the x-data element
            const alpineComponent = navPlaceholder.querySelector('[x-data]');

            // Initialize Alpine on the component
            if (window.Alpine && alpineComponent) {
                // Alpine 3.x initialization
                window.Alpine.initTree(alpineComponent);
            }

        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }
});