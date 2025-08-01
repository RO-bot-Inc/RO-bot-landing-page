

// Universal Navigation JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu functionality
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (hamburgerBtn && mobileMenu) {
        // Toggle hamburger menu
        hamburgerBtn.onclick = function() {
            console.log('Hamburger clicked!');
            const isActive = hamburgerBtn.classList.contains('active');

            if (isActive) {
                closeHamburgerMenu();
            } else {
                openHamburgerMenu();
            }
        };

        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!hamburgerBtn.contains(event.target) && !mobileMenu.contains(event.target)) {
                closeHamburgerMenu();
            }
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

    function toggleHamburgerMenu() {
        const isActive = hamburgerBtn.classList.contains('active');
        
        if (isActive) {
            closeHamburgerMenu();
        } else {
            openHamburgerMenu();
        }
    }

    function openHamburgerMenu() {
        hamburgerBtn.classList.add('active');
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('show');

        // Prevent body scroll when menu is open
        document.body.style.overflow = 'hidden';
    }

    function closeHamburgerMenu() {
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('show');
        mobileMenu.classList.add('hidden');

        // Restore body scroll
        document.body.style.overflow = '';
    }
});

