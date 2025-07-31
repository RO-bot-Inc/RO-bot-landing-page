
// Shared Hamburger Menu Functionality
function initializeHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const hamburgerClose = document.getElementById('hamburger-close');
    const hamburgerOverlay = document.getElementById('hamburger-overlay');
    const body = document.body;
    
    if (!hamburgerBtn || !hamburgerClose || !hamburgerOverlay) return;
    
    function openMenu() {
        hamburgerBtn.classList.add('active');
        hamburgerOverlay.classList.add('active');
        body.classList.add('hamburger-open');
    }
    
    function closeMenu() {
        hamburgerBtn.classList.remove('active');
        hamburgerOverlay.classList.remove('active');
        body.classList.remove('hamburger-open');
    }
    
    // Open menu
    hamburgerBtn.addEventListener('click', openMenu);
    
    // Close menu
    hamburgerClose.addEventListener('click', closeMenu);
    
    // Close menu when clicking overlay
    hamburgerOverlay.addEventListener('click', (e) => {
        if (e.target === hamburgerOverlay) {
            closeMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && hamburgerOverlay.classList.contains('active')) {
            closeMenu();
        }
    });
    
    // Close menu when clicking nav items
    const navItems = document.querySelectorAll('.hamburger-nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', closeMenu);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeHamburgerMenu);
