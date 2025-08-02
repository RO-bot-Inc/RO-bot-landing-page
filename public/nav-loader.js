
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
            
            // Initialize Alpine.js on the nav element
            if (window.Alpine) {
                window.Alpine.initTree(nav);
            }
        } catch (error) {
            console.error('Failed to load navigation:', error);
        }
    }
});
