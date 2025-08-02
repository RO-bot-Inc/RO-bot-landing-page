

// Universal Navigation JavaScript - Alpine.js powered navigation

    // Smooth scroll functionality for anchor links
    const smoothScrollLinks = document.querySelectorAll('a[href*="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');

            // Only handle internal anchor links
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            } else if (href && href.includes('#')) {
                // Handle cross-page anchor links
                const [page, anchor] = href.split('#');
                if (window.location.pathname === page || page === '') {
                    e.preventDefault();
                    const targetElement = document.getElementById(anchor);
                    if (targetElement) {
                        targetElement.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }
            }
        });
    });

// Sticky positioning is now handled in index.html after navigation loads

// Fix Book Demo button hover state
document.addEventListener('DOMContentLoaded', function() {
    const bookDemoButtons = document.querySelectorAll('a[href="/#waitlist-form"]');
    
    bookDemoButtons.forEach(button => {
        // Only apply to buttons with the brand-orange classes
        if (button.classList.contains('text-brand-orange')) {
            button.addEventListener('mouseenter', function() {
                this.style.backgroundColor = '#C63006';
                this.style.color = 'white';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.backgroundColor = '';
                this.style.color = '';
            });
        }
    });
});