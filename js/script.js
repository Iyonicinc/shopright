// JavaScript for dropdown functionality

// Get all dropdown buttons
const dropdowns = document.querySelectorAll('.dropdown');

// Add click event to each dropdown
dropdowns.forEach(dropdown => {
    const dropdownButton = dropdown.querySelector('.dropdown-btn');
    const dropdownContent = dropdown.querySelector('.dropdown-content');

    dropdownButton.addEventListener('click', (e) => {
        e.preventDefault(); // Prevent the default anchor click behavior
        // Toggle the visibility of the dropdown content
        dropdownContent.classList.toggle('show');
    });

    // Close the dropdown if the user clicks outside of it
    window.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdownContent.classList.remove('show');
        }
    });
});

// Optional: Close dropdowns when the user presses 'Esc'
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        dropdowns.forEach(dropdown => {
            const dropdownContent = dropdown.querySelector('.dropdown-content');
            dropdownContent.classList.remove('show');
        });
    }
});

// JavaScript for "Add to Cart" functionality
document.addEventListener('DOMContentLoaded', () => {
    // Get all 'Add to Cart' buttons
    const addToCartButtons = document.querySelectorAll('.add-to-cart');

    // Loop through each button and add a click event listener
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            alert('Product added to cart!');
        });
    });
});
