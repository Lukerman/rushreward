document.addEventListener('DOMContentLoaded', function() {
    // Initialize tab switching
    initAuthTabs();
    
    // Initialize form submission
    initAuthForms();
    
    // Check for URL parameters that might indicate errors or redirects
    checkURLParams();
});

/**
 * Initialize the authentication tabs (login/register)
 */
function initAuthTabs() {
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            // Hide all forms
            forms.forEach(form => {
                form.style.display = 'none';
            });
            
            // Show the appropriate form
            const formId = tab.getAttribute('data-form');
            const form = document.getElementById(formId);
            if (form) {
                form.style.display = 'block';
            }
        });
    });
}

/**
 * Initialize the login and registration forms
 */
function initAuthForms() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(loginForm)) {
                return;
            }
            
            const formData = {
                username: loginForm.querySelector('[name="username"]').value,
                password: loginForm.querySelector('[name="password"]').value
            };
            
            loginUser(formData);
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            if (!validateForm(registerForm)) {
                return;
            }
            
            // Check if passwords match
            const password = registerForm.querySelector('[name="password"]').value;
            const confirmPassword = registerForm.querySelector('[name="confirm_password"]').value;
            
            if (password !== confirmPassword) {
                const confirmInput = registerForm.querySelector('[name="confirm_password"]');
                markInvalid(confirmInput, 'Passwords do not match');
                return;
            }
            
            const formData = {
                username: registerForm.querySelector('[name="username"]').value,
                email: registerForm.querySelector('[name="email"]').value,
                password: password,
                referral: registerForm.querySelector('[name="referral"]') ? 
                          registerForm.querySelector('[name="referral"]').value : ''
            };
            
            registerUser(formData);
        });
    }
}

/**
 * Login user by sending credentials to the server
 * @param {Object} formData - User login credentials
 */
function loginUser(formData) {
    // Show loading state
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    
    fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Login failed. Please check your credentials.');
        }
        return response.json();
    })
    .then(data => {
        // Login successful, redirect to dashboard
        window.location.href = '/dashboard';
    })
    .catch(error => {
        showToast(error.message, 'error');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

/**
 * Register user by sending registration data to the server
 * @param {Object} formData - User registration data
 */
function registerUser(formData) {
    // Show loading state
    const submitBtn = document.querySelector('#register-form button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
    
    fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                throw new Error(err.message || 'Registration failed. Please try again.');
            });
        }
        return response.json();
    })
    .then(data => {
        // Registration successful, redirect to dashboard
        window.location.href = '/dashboard';
    })
    .catch(error => {
        showToast(error.message, 'error');
        
        // Reset button
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    });
}

/**
 * Check URL parameters for errors or actions
 */
function checkURLParams() {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check for error messages
    const error = urlParams.get('error');
    if (error) {
        showToast(decodeURIComponent(error), 'error');
    }
    
    // Check for success messages
    const success = urlParams.get('success');
    if (success) {
        showToast(decodeURIComponent(success), 'success');
    }
    
    // Check if we should display registration form
    const register = urlParams.get('register');
    if (register === 'true') {
        // Switch to registration tab
        const registerTab = document.querySelector('[data-form="register-form"]');
        if (registerTab) {
            registerTab.click();
        }
        
        // If there's a referral code, fill it in
        const referral = urlParams.get('ref');
        if (referral) {
            const referralInput = document.querySelector('[name="referral"]');
            if (referralInput) {
                referralInput.value = referral;
            }
        }
    }
}
