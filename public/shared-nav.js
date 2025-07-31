
// Universal Navigation JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu functionality
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const hamburgerOverlay = document.getElementById('hamburger-overlay');

    if (hamburgerBtn && hamburgerMenu && hamburgerOverlay) {
        // Toggle hamburger menu
        hamburgerBtn.addEventListener('click', function() {
            toggleHamburgerMenu();
        });

        // Close menu when clicking overlay
        hamburgerOverlay.addEventListener('click', function() {
            closeHamburgerMenu();
        });

        // Close menu when clicking menu items
        const menuItems = document.querySelectorAll('.hamburger-menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                closeHamburgerMenu();
            });
        });

        // Close menu on escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeHamburgerMenu();
            }
        });
    }

    // Smooth scroll functionality for anchor links
    const smoothScrollLinks = document.querySelectorAll('[data-smooth-scroll]');
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

    function toggleHamburgerMenu() {
        hamburgerBtn.classList.toggle('active');
        hamburgerMenu.classList.toggle('active');
        hamburgerOverlay.classList.toggle('active');

        // Prevent body scroll when menu is open
        if (hamburgerMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function closeHamburgerMenu() {
        hamburgerBtn.classList.remove('active');
        hamburgerMenu.classList.remove('active');
        hamburgerOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
});
// Hamburger menu functionality
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
        hamburgerBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburgerBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
});