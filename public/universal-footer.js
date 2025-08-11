
// Universal Footer - Just include this script on any page
(function() {
  const footerHTML = `
    <style>
      #universal-footer {
        background: #0F1108;
        color: #64758B;
        padding: 4rem 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #universal-footer .footer-container {
        max-width: 1280px;
        margin: 0 auto;
        padding: 0 1rem;
      }
      #universal-footer .footer-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 2rem;
        margin-bottom: 3rem;
      }
      #universal-footer .footer-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      #universal-footer h3 {
        color: white;
        font-weight: 600;
        font-size: 1.125rem;
        margin: 0;
        font-family: 'Montserrat', sans-serif;
      }
      #universal-footer p {
        color: #64758B;
        font-size: 0.875rem;
        line-height: 1.5;
        margin: 0;
      }
      #universal-footer ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      #universal-footer a {
        color: #64758B;
        text-decoration: none;
        font-size: 0.875rem;
        transition: color 0.15s ease;
      }
      #universal-footer a:hover {
        color: white;
      }
      #universal-footer .footer-bottom {
        border-top: 1px solid #374151;
        padding-top: 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
      }
      #universal-footer .footer-bottom-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
        justify-content: center;
      }
      #universal-footer .location-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #64758B;
        font-size: 0.875rem;
      }
      #universal-footer .nc-icon {
        height: 1rem;
        width: 1rem;
      }
      #universal-footer .copyright {
        color: #64758B;
        font-size: 0.875rem;
      }
      #universal-footer .social-links {
        display: flex;
        gap: 1rem;
      }
      #universal-footer .social-links a {
        color: #64758B;
        transition: color 0.15s ease;
      }
      #universal-footer .social-links a:hover {
        color: white;
      }
      #universal-footer .social-links svg {
        height: 1.25rem;
        width: 1.25rem;
        fill: currentColor;
      }
      @media (max-width: 768px) {
        #universal-footer .footer-grid {
          grid-template-columns: 1fr;
        }
        #universal-footer .footer-bottom {
          flex-direction: column;
          text-align: center;
          gap: 1rem;
        }
        #universal-footer .footer-bottom-content {
          order: 1;
        }
        #universal-footer .social-links {
          order: 2;
        }
      }
    </style>
    <footer id="universal-footer">
      <div class="footer-container">
        <div class="footer-grid">
          <!-- RO-bot -->
          <div class="footer-section">
            <h3>RO-bot</h3>
            <p>AI-powered assistance for automotive technicians.</p>
            <p>hello@ro-bot.io</p>
          </div>

          <!-- Product -->
          <div class="footer-section">
            <h3>Product</h3>
            <ul>
              <li><a href="/#solution-features">Features</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="https://celestial-xenon-221.notion.site/RO-bot-Setup-1f2d29c34d6480078746e6c15ad834f7" target="_blank" rel="noopener noreferrer">Setup</a></li>
            </ul>
          </div>

          <!-- Resources -->
          <div class="footer-section">
            <h3>Resources</h3>
            <ul>
              <li><a href="/blog">Blog</a></li>
              <li><a href="mailto:hello@ro-bot.io">Contact</a></li>
            </ul>
          </div>

          <!-- Legal -->
          <div class="footer-section">
            <h3>Legal</h3>
            <ul>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <!-- Bottom section -->
        <div class="footer-bottom">
          <div class="footer-bottom-content">
            <div class="copyright">
              © 2025 RO-bot. All rights reserved.
            </div>
            <div class="location-info">
              <img src="/misc assets/north_carolina_icon.svg" alt="North Carolina" class="nc-icon">
              RO-bot is proudly built in Durham, North Carolina
            </div>
          </div>
          <div class="social-links">
            <a href="#" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill-rule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clip-rule="evenodd"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  `;

  // Insert footer at the very end of body
  document.body.insertAdjacentHTML('beforeend', footerHTML);
})();
