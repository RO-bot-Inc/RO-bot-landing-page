
document.addEventListener('DOMContentLoaded', () => {
  const waitlistLinks = document.querySelectorAll('a[href="#waitlist-form"]');
  
  waitlistLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const form = document.getElementById('waitlist-form');
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
