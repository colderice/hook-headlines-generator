/**
 * Authentication Module for Hook & Headlines Generator Pro
 * Handles user registration, login, trial limits, and session management
 */

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.trialLimit = 1; // Free trial allows 1 hook generation
        this.init();
    }

    init() {
        this.bindEvents();
        this.checkAuthState();
        this.updateUI();
    }

    bindEvents() {
        // Modal controls
        document.getElementById('signupBtn').addEventListener('click', () => this.showSignupModal());
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('heroStartBtn').addEventListener('click', () => this.handleHeroStart());
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal());
        document.getElementById('modalBackdrop').addEventListener('click', () => this.hideModal());

        // Form submissions
        document.getElementById('signupForm').addEventListener('submit', (e) => this.handleSignup(e));
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));

        // Form toggle
        document.getElementById('toggleAuthForm').addEventListener('click', () => this.toggleAuthForm());

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());

        // Hook generation forms - add trial check
        document.querySelectorAll('.method-form').forEach(form => {
            form.addEventListener('submit', (e) => this.checkTrialLimit(e));
        });
    }

    checkAuthState() {
        const userData = localStorage.getItem('hookGenerator_user');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.isAuthenticated = true;
                this.updateLastLogin();
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('hookGenerator_user');
            }
        }
    }

    async updateLastLogin() {
        if (this.currentUser) {
            try {
                const response = await fetch('tables/users/' + this.currentUser.id, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        last_login: new Date().toISOString()
                    })
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    this.currentUser = updatedUser;
                    localStorage.setItem('hookGenerator_user', JSON.stringify(updatedUser));
                }
            } catch (error) {
                console.error('Error updating last login:', error);
            }
        }
    }

    showSignupModal() {
        document.getElementById('modalTitle').textContent = 'Get Started Free';
        document.getElementById('signupForm').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('toggleAuthForm').textContent = 'Already have an account? Sign in';
        document.getElementById('authModal').classList.remove('hidden');
        document.querySelector('.modal-content').classList.add('modal-enter');
    }

    showLoginModal() {
        document.getElementById('modalTitle').textContent = 'Welcome Back';
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('signupForm').classList.add('hidden');
        document.getElementById('toggleAuthForm').textContent = "Don't have an account? Sign up free";
        document.getElementById('authModal').classList.remove('hidden');
        document.querySelector('.modal-content').classList.add('modal-enter');
    }

    hideModal() {
        document.getElementById('authModal').classList.add('hidden');
        this.clearFormErrors();
    }

    toggleAuthForm() {
        const signupForm = document.getElementById('signupForm');
        const loginForm = document.getElementById('loginForm');
        const toggleBtn = document.getElementById('toggleAuthForm');
        const modalTitle = document.getElementById('modalTitle');

        if (signupForm.classList.contains('hidden')) {
            // Show signup form
            signupForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
            modalTitle.textContent = 'Get Started Free';
            toggleBtn.textContent = 'Already have an account? Sign in';
        } else {
            // Show login form
            loginForm.classList.remove('hidden');
            signupForm.classList.add('hidden');
            modalTitle.textContent = 'Welcome Back';
            toggleBtn.textContent = "Don't have an account? Sign up free";
        }
        this.clearFormErrors();
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;

        if (!this.validateSignupForm(name, email, password)) {
            return;
        }

        try {
            // Check if user already exists
            const existingUserResponse = await fetch(`tables/users?search=${encodeURIComponent(email)}`);
            const existingUserData = await existingUserResponse.json();

            if (existingUserData.data && existingUserData.data.length > 0) {
                this.showFormError('signupEmail', 'An account with this email already exists');
                return;
            }

            // Create new user
            const userData = {
                email: email,
                name: name,
                password_hash: await this.hashPassword(password),
                trial_uses_remaining: this.trialLimit,
                is_premium: false,
                signup_date: new Date().toISOString(),
                last_login: new Date().toISOString(),
                total_hooks_generated: 0
            };

            const response = await fetch('tables/users', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const newUser = await response.json();
                this.currentUser = newUser;
                this.isAuthenticated = true;
                localStorage.setItem('hookGenerator_user', JSON.stringify(newUser));
                
                this.hideModal();
                this.updateUI();
                this.showToast('success', 'Account created successfully! Welcome to Hook Generator Pro!');
            } else {
                throw new Error('Failed to create account');
            }
        } catch (error) {
            console.error('Signup error:', error);
            this.showToast('error', 'Failed to create account. Please try again.');
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (!this.validateLoginForm(email, password)) {
            return;
        }

        try {
            const response = await fetch(`tables/users?search=${encodeURIComponent(email)}`);
            const userData = await response.json();

            if (!userData.data || userData.data.length === 0) {
                this.showFormError('loginEmail', 'No account found with this email');
                return;
            }

            const user = userData.data[0];
            const isPasswordValid = await this.verifyPassword(password, user.password_hash);

            if (!isPasswordValid) {
                this.showFormError('loginPassword', 'Incorrect password');
                return;
            }

            this.currentUser = user;
            this.isAuthenticated = true;
            localStorage.setItem('hookGenerator_user', JSON.stringify(user));
            
            this.hideModal();
            this.updateUI();
            this.updateLastLogin();
            this.showToast('success', `Welcome back, ${user.name}!`);
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('error', 'Failed to sign in. Please try again.');
        }
    }

    logout() {
        this.currentUser = null;
        this.isAuthenticated = false;
        localStorage.removeItem('hookGenerator_user');
        this.updateUI();
        this.showToast('info', 'You have been signed out');
    }

    updateUI() {
        const userInfo = document.getElementById('userInfo');
        const authButtons = document.getElementById('authButtons');
        const userName = document.getElementById('userName');
        const trialCounter = document.getElementById('trialCounter');

        if (this.isAuthenticated && this.currentUser) {
            // Show user info, hide auth buttons
            userInfo.classList.remove('hidden');
            userInfo.classList.add('flex');
            authButtons.classList.add('hidden');

            // Update user info
            userName.textContent = this.currentUser.name;
            
            if (this.currentUser.is_premium) {
                trialCounter.textContent = 'Premium';
                trialCounter.className = 'ml-2 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium';
            } else {
                const remaining = this.currentUser.trial_uses_remaining || 0;
                trialCounter.textContent = `${remaining} free use${remaining !== 1 ? 's' : ''} left`;
                trialCounter.className = remaining > 0 ? 
                    'ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium' :
                    'ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium';
            }
        } else {
            // Show auth buttons, hide user info
            userInfo.classList.add('hidden');
            userInfo.classList.remove('flex');
            authButtons.classList.remove('hidden');
        }

        this.updateTrialWarning();
    }

    updateTrialWarning() {
        const trialWarning = document.getElementById('trialWarning');
        
        if (!this.isAuthenticated || (!this.currentUser.is_premium && this.currentUser.trial_uses_remaining <= 0)) {
            trialWarning.classList.remove('hidden');
        } else {
            trialWarning.classList.add('hidden');
        }
    }

    handleHeroStart() {
        if (!this.isAuthenticated) {
            this.showSignupModal();
        } else {
            // Scroll to the generator
            document.querySelector('main').scrollIntoView({ behavior: 'smooth' });
        }
    }

    async checkTrialLimit(e) {
        if (!this.isAuthenticated) {
            e.preventDefault();
            this.showSignupModal();
            this.showToast('warning', 'Please sign up to generate hooks');
            return false;
        }

        if (!this.currentUser.is_premium && this.currentUser.trial_uses_remaining <= 0) {
            e.preventDefault();
            this.showSignupModal();
            this.showToast('warning', 'Trial limit reached. Sign up for unlimited access!');
            return false;
        }

        return true;
    }

    async decrementTrialUse() {
        if (this.currentUser && !this.currentUser.is_premium && this.currentUser.trial_uses_remaining > 0) {
            try {
                const updatedData = {
                    trial_uses_remaining: this.currentUser.trial_uses_remaining - 1,
                    total_hooks_generated: (this.currentUser.total_hooks_generated || 0) + 1
                };

                const response = await fetch('tables/users/' + this.currentUser.id, {
                    method: 'PATCH',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(updatedData)
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    this.currentUser = updatedUser;
                    localStorage.setItem('hookGenerator_user', JSON.stringify(updatedUser));
                    this.updateUI();
                }
            } catch (error) {
                console.error('Error updating trial usage:', error);
            }
        }
    }

    async logUsage(hookType, inputText, generatedHooks) {
        if (this.currentUser) {
            try {
                const logData = {
                    user_id: this.currentUser.id,
                    hook_type: hookType,
                    input_text: inputText,
                    generated_hooks: JSON.stringify(generatedHooks),
                    timestamp: new Date().toISOString(),
                    ip_address: 'N/A' // Would be set by backend in real app
                };

                await fetch('tables/usage_logs', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(logData)
                });
            } catch (error) {
                console.error('Error logging usage:', error);
            }
        }
    }

    validateSignupForm(name, email, password) {
        let isValid = true;

        if (!name || name.length < 2) {
            this.showFormError('signupName', 'Name must be at least 2 characters');
            isValid = false;
        }

        if (!this.isValidEmail(email)) {
            this.showFormError('signupEmail', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password || password.length < 6) {
            this.showFormError('signupPassword', 'Password must be at least 6 characters');
            isValid = false;
        }

        return isValid;
    }

    validateLoginForm(email, password) {
        let isValid = true;

        if (!this.isValidEmail(email)) {
            this.showFormError('loginEmail', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            this.showFormError('loginPassword', 'Password is required');
            isValid = false;
        }

        return isValid;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showFormError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('error-border');
        
        // Remove existing error message
        const existingError = field.parentNode.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-sm text-red-600 mt-1';
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);

        // Clear error on input
        field.addEventListener('input', () => {
            field.classList.remove('error-border');
            const errorMsg = field.parentNode.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }, { once: true });
    }

    clearFormErrors() {
        document.querySelectorAll('.error-border').forEach(field => {
            field.classList.remove('error-border');
        });
        document.querySelectorAll('.error-message').forEach(msg => {
            msg.remove();
        });
    }

    async hashPassword(password) {
        // Simple hash for demo - in production use proper password hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(password + 'hook_generator_salt');
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async verifyPassword(password, hash) {
        const passwordHash = await this.hashPassword(password);
        return passwordHash === hash;
    }

    showToast(type, message) {
        const toast = document.getElementById('toast');
        const icon = document.getElementById('toastIcon');
        const messageEl = document.getElementById('toastMessage');
        
        // Set icon based on type
        const icons = {
            success: '<i class="fas fa-check-circle text-green-500"></i>',
            error: '<i class="fas fa-exclamation-circle text-red-500"></i>',
            warning: '<i class="fas fa-exclamation-triangle text-yellow-500"></i>',
            info: '<i class="fas fa-info-circle text-blue-500"></i>'
        };
        
        icon.innerHTML = icons[type] || icons.info;
        messageEl.textContent = message;
        
        toast.className = `fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm toast-${type}`;
        toast.classList.remove('hidden');
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 5000);
        
        // Close button
        document.getElementById('closeToast').addEventListener('click', () => {
            toast.classList.add('hidden');
        }, { once: true });
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});