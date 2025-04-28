document.addEventListener('DOMContentLoaded', function() {
    // Initialize the navigation
    initNav();
    // Initialize FAQ accordions
    initFAQ();
    // Initialize adblock detection
    initAdblockDetection();
});

/**
 * Initializes the responsive navigation
 */
function initNav() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-links');

    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a nav link
        document.querySelectorAll('.nav-links a').forEach(n => n.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
        }));
    }
}

/**
 * Initializes the FAQ accordion functionality
 */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        if (question) {
            question.addEventListener('click', () => {
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        }
    });
}

/**
 * Initializes modal functionality
 * @param {string} modalId - The ID of the modal to initialize
 */
function initModal(modalId) {
    const modal = document.getElementById(modalId);
    
    if (!modal) return;
    
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal;
    
    // Show modal function
    window.showModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    };
    
    // Close modal function
    window.closeModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    };
    
    // Close when clicking close button
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeModal(modalId);
        });
    }
    
    // Close when clicking outside modal content
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(modalId);
            }
        });
    }
}

/**
 * Copies text to clipboard
 * @param {string} text - The text to copy to clipboard
 * @param {Function} callback - Optional callback after copy
 */
function copyToClipboard(text, callback) {
    navigator.clipboard.writeText(text).then(() => {
        if (callback && typeof callback === 'function') {
            callback();
        }
    }).catch(err => {
        console.error('Could not copy text: ', err);
    });
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Check if toast container exists, if not create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '1000';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Style the toast
    toast.style.backgroundColor = type === 'success' ? '#28a745' : 
                                type === 'error' ? '#dc3545' : 
                                type === 'warning' ? '#ffc107' : '#17a2b8';
    toast.style.color = type === 'warning' ? '#212529' : 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '4px';
    toast.style.marginBottom = '10px';
    toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Fade in
    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

/**
 * Form validation helper
 * @param {HTMLFormElement} form - The form to validate
 * @returns {boolean} - True if form is valid, false otherwise
 */
function validateForm(form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.required && !input.value.trim()) {
            markInvalid(input, 'This field is required');
            isValid = false;
        } else if (input.type === 'email' && input.value.trim() && !isValidEmail(input.value)) {
            markInvalid(input, 'Please enter a valid email');
            isValid = false;
        } else if (input.dataset.minLength && input.value.length < parseInt(input.dataset.minLength)) {
            markInvalid(input, `This field must be at least ${input.dataset.minLength} characters`);
            isValid = false;
        } else {
            markValid(input);
        }
    });
    
    return isValid;
}

/**
 * Mark form input as invalid
 * @param {HTMLElement} input - The input element
 * @param {string} message - Error message
 */
function markInvalid(input, message) {
    const parent = input.parentNode;
    let errorSpan = parent.querySelector('.error-message');
    
    input.classList.add('error');
    
    if (!errorSpan) {
        errorSpan = document.createElement('span');
        errorSpan.className = 'error-message';
        errorSpan.style.color = '#dc3545';
        errorSpan.style.fontSize = '0.8rem';
        errorSpan.style.marginTop = '5px';
        errorSpan.style.display = 'block';
        parent.appendChild(errorSpan);
    }
    
    errorSpan.textContent = message;
}

/**
 * Mark form input as valid
 * @param {HTMLElement} input - The input element
 */
function markValid(input) {
    const parent = input.parentNode;
    const errorSpan = parent.querySelector('.error-message');
    
    input.classList.remove('error');
    
    if (errorSpan) {
        parent.removeChild(errorSpan);
    }
}

/**
 * Validate email format
 * @param {string} email - The email to validate
 * @returns {boolean} - True if email is valid
 */
function isValidEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Format number with commas for thousands
 * @param {number} num - The number to format
 * @returns {string} - Formatted number
 */
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/**
 * Dynamic date helpers
 */
function getRelativeTimeString(date) {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSecs < 60) {
        return 'just now';
    } else if (diffInMins < 60) {
        return `${diffInMins} minute${diffInMins > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(date).toLocaleDateString(undefined, options);
    }
}

/**
 * Initializes adblock detection using the adblock-detector.js
 */
function initAdblockDetection() {
    if (typeof detectAdblock === 'function') {
        detectAdblock();
    }
}
