// Wait for the DOM content to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function () {
    // Reference to the main content div
    const mainContent = document.getElementById('main-content');

    // Function to load content dynamically using fetch()
    function loadContent(page) {
        fetch(`pages/${page}.html`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error loading page');
                }
                return response.text();
            })
            .then(data => {
                mainContent.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading content:', error);
                mainContent.innerHTML = '<p>Error loading page content.</p>';
            });
    }

    // Event listeners for navigation links
    document.getElementById('home-link').addEventListener('click', function (e) {
        e.preventDefault();
        mainContent.innerHTML = `
            <h1 class="text-3xl font-bold mb-4">Welcome to Shop Right</h1>
            <p class="text-lg">This is the homepage of your online store.</p>
        `;
    });

    document.getElementById('shop-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadContent('shop');  // Load shop.html dynamically
    });

    document.getElementById('cart-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadContent('cart');  // Load cart.html dynamically
    });

    document.getElementById('contact-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadContent('contact');  // Load contact.html dynamically
    });
});
