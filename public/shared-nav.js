

// Universal Navigation JavaScript

// BACKUP - Original functions preserved for rollback
function openHamburgerMenu_BACKUP() {
    // Store current scroll position
    const scrollY = window.scrollY;
    
    hamburgerBtn.classList.add('active');
    mobileMenu.classList.remove('hidden');
    mobileMenu.classList.add('show');
    
    // Prevent body scroll while preserving position
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
}

function closeHamburgerMenu_BACKUP() {
    hamburgerBtn.classList.remove('active');
    mobileMenu.classList.remove('show');
    mobileMenu.classList.add('hidden');
    
    // Get the stored scroll position
    const scrollY = parseInt(document.body.style.top || '0') * -1;
    
    // CRITICAL: Set scroll position BEFORE removing fixed position
    // This uses scrollTo with behavior: 'instant' to ensure no animation
    window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: 'instant'
    });
    
    // NOW remove the fixed positioning after scroll is set
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
}

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
        console.log('Opening menu...');
        hamburgerBtn.classList.add('active');
        mobileMenu.classList.remove('hidden');
        mobileMenu.classList.add('show');
        
        // Use body-scroll-lock with reserveScrollBarGap option to prevent layout shift
        if (window.bodyScrollLock && window.bodyScrollLock.disableBodyScroll) {
            console.log('✓ Disabling body scroll');
            // Pass options to preserve the scrollbar gap and allow touch move on nav
            window.bodyScrollLock.disableBodyScroll(document.body, {
                reserveScrollBarGap: true,
                allowTouchMove: (el) => {
                    // Allow scrolling on the nav element itself
                    while (el && el !== document.body) {
                        if (el.tagName === 'NAV') {
                            return true;
                        }
                        el = el.parentElement;
                    }
                    return false;
                }
            });
        } else {
            console.log('✗ body-scroll-lock not available');
        }
    }

    function closeHamburgerMenu() {
        console.log('Closing menu...');
        hamburgerBtn.classList.remove('active');
        mobileMenu.classList.remove('show');
        mobileMenu.classList.add('hidden');
        
        // Re-enable scrolling
        if (window.bodyScrollLock && window.bodyScrollLock.enableBodyScroll) {
            console.log('✓ Enabling body scroll');
            window.bodyScrollLock.enableBodyScroll(document.body);
        } else {
            console.log('✗ body-scroll-lock not available');
        }
    }
});

// Sticky positioning is now handled in index.html after navigation loads