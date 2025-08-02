
// Universal Navigation Loader
document.addEventListener('DOMContentLoaded', function() {
    fetch('/navigation-component.html')
        .then(response => response.text())
        .then(html => {
            document.getElementById('navigation-placeholder').innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading navigation:', error);
        });
});
