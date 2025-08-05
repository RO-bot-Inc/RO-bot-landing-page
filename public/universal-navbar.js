
// Universal Navbar - Just include this script on any page
(function() {
  const navHTML = `
    <style>
      #universal-navbar {
        background: white;
        border-bottom: 1px solid #e5e7eb;
        position: sticky;
        top: 0;
        z-index: 1000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #universal-navbar .nav-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      #universal-navbar .logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
        color: #1f2937;
        font-size: 1.5rem;
        font-weight: 500;
      }
      #universal-navbar .logo img {
        height: 40px;
      }
      #universal-navbar .nav-links {
        display: flex;
        gap: 3rem;
        align-items: center;
      }
      #universal-navbar .nav-links a {
        text-decoration: none;
        color: #4b5563;
        font-size: 1rem;
        transition: color 0.3s;
        position: relative;
      }
      #universal-navbar .nav-links a:hover {
        color: #2A9D8F;
      }
      #universal-navbar .nav-links a:not(.book-demo)::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 0;
        height: 2px;
        background: #2A9D8F;
        transition: width 0.3s;
      }
      #universal-navbar .nav-links a:not(.book-demo):hover::after {
        width: 100%;
      }
      #universal-navbar .book-demo {
        background: white;
        color: #C63006 !important;
        padding: 0.6rem 1.5rem;
        border: 2px solid #C63006;
        border-radius: 6px;
        font-weight: 500;
        transition: all 0.3s;
      }
      #universal-navbar .book-demo:hover {
        background: #C63006;
        color: white !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(198, 48, 6, 0.2);
      }
      #universal-navbar .mobile-menu-btn {
        display: none;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
      }
      #universal-navbar .mobile-menu-btn svg {
        width: 24px;
        height: 24px;
        stroke: #4b5563;
      }
      @media (max-width: 768px) {
        #universal-navbar .nav-container {
          padding: 1rem;
        }
        #universal-navbar .nav-links {
          display: none;
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          flex-direction: column;
          padding: 1rem;
          gap: 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          border-top: 1px solid #e5e7eb;
        }
        #universal-navbar .nav-links.show {
          display: flex;
        }
        #universal-navbar .nav-links a {
          padding: 1rem;
          width: 100%;
          text-align: center;
          border-bottom: 1px solid #f3f4f6;
        }
        #universal-navbar .nav-links a:last-child {
          border-bottom: none;
          margin-top: 0.5rem;
        }
        #universal-navbar .mobile-menu-btn {
          display: block;
        }
      }
    </style>
    <nav id="universal-navbar">
      <div class="nav-container">
        <a href="/" class="logo">
          <img src="/Color logo - no background.svg" alt="RO-bot">
          <span>RO-bot</span>
        </a>
        <div class="nav-links" id="nav-links">
          <a href="/about">About</a>
          <a href="/blog">Blog</a>
          <a href="/support">Support</a>
          <a href="https://app.ro-bot.io">Login</a>
          <a href="/#waitlist-form" class="book-demo">Book Demo</a>
        </div>
        <button class="mobile-menu-btn" id="mobile-menu-btn">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </nav>
  `;

  // Insert navbar at the very beginning of body
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Simple mobile menu toggle
  document.getElementById('mobile-menu-btn').addEventListener('click', function() {
    document.getElementById('nav-links').classList.toggle('show');
  });
})();
