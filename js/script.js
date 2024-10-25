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


document.addEventListener("DOMContentLoaded", function() {
    // Define the links and main content container
    const homeLink = document.getElementById('home-link');
    const shopLink = document.getElementById('shop-link');
    const cartLink = document.getElementById('cart-link');
    const contactLink = document.getElementById('contact-link');
    const mainContent = document.getElementById('main-content');

    // Function to fetch and load content into main-content
    function loadContent(url) {
        fetch(url)
            .then(response => response.text())
            .then(data => {
                mainContent.innerHTML = data;
            })
            .catch(error => {
                console.error('Error loading page content:', error);
                mainContent.innerHTML = '<p>Error loading page content.</p>';
            });
    }

    // Event listeners for the navigation links
    homeLink.addEventListener('click', function(e) {
        e.preventDefault();
        loadContent('home.html');  // You can also load from a hardcoded section if you want to keep Home in the same page
    });

    shopLink.addEventListener('click', function(e) {
        e.preventDefault();
        loadContent('shop.html');  // Load the shop content dynamically
    });

    cartLink.addEventListener('click', function(e) {
        e.preventDefault();
        loadContent('cart.html');  // Load the cart content dynamically
    });

    contactLink.addEventListener('click', function(e) {
        e.preventDefault();
        loadContent('contactus.html');  // Load the contact content dynamically
    });
});

  const swiper = new Swiper('.swiper-container', {
    slidesPerView: 2, // Default for small screens
    spaceBetween: 10,
    loop: false, // Disable looping so it stops at the end
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    scrollbar: {
      el: '.swiper-scrollbar',
      hide: false,  // Show scrollbar permanently
      draggable: true, // Make the scrollbar draggable
    },
    breakpoints: {
      640: {
        slidesPerView: 3,
        spaceBetween: 20,
      },
      1024: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
    simulateTouch: true, // Enable touch gestures for swiping
    grabCursor: true,    // Show grabbing cursor to indicate the slider can be swiped
  });

  // Wait for the DOM content to be fully loaded before running the script
  document.addEventListener("DOMContentLoaded", function () {
    const mainContent = document.getElementById('main-content');
    const cartIconCount = document.getElementById('cart-count');
    const cartIconTotal = document.getElementById('cart-total-amount');

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
                if (page === 'cart') {
                    displayCart();  // Display the cart items if cart page is loaded
                }
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
        loadContent('shop');
    });

    document.getElementById('cart-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadContent('cart');  // Load the cart page dynamically
    });

    document.getElementById('contact-link').addEventListener('click', function (e) {
        e.preventDefault();
        loadContent('contact');
    });

    // Function to update cart icon with total items and amount
    function updateCartIcon() {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let totalCount = 0;
        let totalAmount = 0;

        cart.forEach(item => {
            totalCount += item.quantity;
            totalAmount += item.price * item.quantity;
        });

        cartIconCount.textContent = totalCount;  // Update cart item count
        cartIconTotal.textContent = `Ksh ${totalAmount.toLocaleString()}`;  // Update total amount
    }

    // Function to add item to cart (for demo purposes, you can customize this)
    function addToCart(productName, price, quantity = 1) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        let itemIndex = cart.findIndex(item => item.productName === productName);

        // If the item is already in the cart, update quantity
        if (itemIndex > -1) {
            cart[itemIndex].quantity += quantity;
        } else {
            cart.push({ productName, price, quantity });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartIcon();  // Update the cart icon after adding item
    }

    // Function to display cart items on the cart page
    function displayCart() {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');

        // Clear the cart container before injecting new items
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-500">Your cart is empty.</p>';
            cartTotal.textContent = 'Ksh 0';
            return;
        }

        let total = 0;

        cart.forEach((item, index) => {
            total += item.price * item.quantity;

            cartItemsContainer.innerHTML += `
                <div class="flex items-center justify-between mb-6 border-b pb-4">
                    <div class="flex items-center space-x-4">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-700">${item.productName}</h4>
                            <p class="text-sm text-gray-500">Quantity: ${item.quantity}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <p class="text-lg font-semibold text-gray-900">Ksh ${item.price * item.quantity}</p>
                        <button class="text-red-500 hover:underline" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            `;
        });

        cartTotal.textContent = `Ksh ${total.toLocaleString()}`;
    }

    // Function to remove an item from the cart
    window.removeFromCart = function (index) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCart();  // Re-display cart after removing item
        updateCartIcon();  // Update cart icon
    };

    // Initialize cart icon on page load
    updateCartIcon();

    // Example of adding items to cart (you can call this from a product page or button click)
    // Example usage: addToCart('Product 1', 74500, 1);
});

  // Hamburger and Categories Dropdown Functionality
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileCategoriesMenu = document.getElementById('mobile-categories-menu');
  const categoryDropdownToggle = document.getElementById('category-dropdown-toggle');
  const categoryDropdownMenu = document.getElementById('category-dropdown-menu');

  // Toggle mobile menu when hamburger button is clicked
  hamburgerBtn.addEventListener('click', () => {
    mobileCategoriesMenu.classList.toggle('hidden'); // Show or hide the all the categories
  });

  // Function to toggle dropdown visibility
  function toggleDropdown(activeDropdownId, otherDropdownId) {
    const activeDropdown = document.getElementById(activeDropdownId);
    const otherDropdown = document.getElementById(otherDropdownId);
    
    // Check if the active dropdown is currently hidden
    if (activeDropdown.classList.contains('hidden')) {
      // Show the active dropdown
      activeDropdown.classList.remove('hidden');
      
      // Hide the other dropdown if it's open
      if (!otherDropdown.classList.contains('hidden')) {
        otherDropdown.classList.add('hidden');
      }
    } else {
      // Hide the active dropdown if it was already open
      activeDropdown.classList.add('hidden');
    }
  }

  const searchButton = document.getElementById('search-btn');
const searchIcon = document.getElementById('search-icon');
const searchContent = document.getElementById('search-content');
const searchInput = document.getElementById('search-input');
const resultsContainer = document.getElementById('search-results');

// Sample item list (replace with your actual items)
const itemList = [
    { name: 'HP EliteBook 840' },
    { name: 'Dell XPS 13' },
    { name: 'MacBook Air' },
    { name: 'Lenovo ThinkPad' }
];

// Event listener to toggle search input display and icon
searchButton.addEventListener('click', function() {
    // Toggle visibility of search content
    searchContent.classList.toggle('hidden');

    // Toggle icon between search and cancel
    if (!searchContent.classList.contains('hidden')) {
        searchIcon.classList.remove('fa-search'); // Change to cancel icon
        searchIcon.classList.add('fa-times'); // Use the cancel icon
        searchInput.focus(); // Focus the input when opened
        displayResults(); // Show results based on current input
    } else {
        searchIcon.classList.remove('fa-times'); // Change back to search icon
        searchIcon.classList.add('fa-search'); // Use the search icon
        searchInput.value = ''; // Clear the input when hiding
        resultsContainer.innerHTML = ''; // Clear results when hiding
    }
});

// Function to display filtered results
function displayResults() {
    const input = searchInput.value.trim().toLowerCase();

    // Clear previous results
    resultsContainer.innerHTML = '';

    // Check if input is empty
    if (!input) {
        resultsContainer.innerHTML = '<p class="text-red-500">Please search for something.</p>';
        return; // Exit if there's no input
    }

    // Filter items based on input
    const filteredItems = itemList.filter(item => 
        item.name.toLowerCase().includes(input)
    );

    // Display results or message
    if (filteredItems.length > 0) {
        filteredItems.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.textContent = item.name; // Assuming each item has a name property
            resultsContainer.appendChild(itemElement);
        });
    } else {
        resultsContainer.innerHTML = '<p class="text-red-500">We found 0 matches.</p>';
    }
}

// Event listener for input changes (real-time filtering)
searchInput.addEventListener('input', displayResults);