// Simple Authentication & Usage Tracking System
class UserManager {
    constructor() {
        this.init();
    }

    init() {
        this.checkUserStatus();
        this.setupAuthUI();
    }

    // Check if user exists and their subscription status
    checkUserStatus() {
        const userData = this.getUserData();
        
        if (!userData.userId) {
            // New user - create free trial
            this.createFreeTrialUser();
        }
        
        this.updateUIBasedOnStatus(userData);
    }

    // Create new free trial user
    createFreeTrialUser() {
        const userData = {
            userId: this.generateUserId(),
            email: '',
            subscriptionType: 'free',
            generationsToday: 0,
            generationsTotal: 0,
            lastUsed: new Date().toDateString(),
            trialStarted: new Date().toISOString(),
            isSubscribed: false,
            freeGenerationsLimit: 5
        };
        
        localStorage.setItem('hookUserData', JSON.stringify(userData));
        return userData;
    }

    // Get user data from localStorage
    getUserData() {
        const stored = localStorage.getItem('hookUserData');
        if (stored) {
            const userData = JSON.parse(stored);
            
            // Reset daily counter if new day
            if (userData.lastUsed !== new Date().toDateString()) {
                userData.generationsToday = 0;
                userData.lastUsed = new Date().toDateString();
                localStorage.setItem('hookUserData', JSON.stringify(userData));
            }
            
            return userData;
        }
        return { userId: null };
    }

    // Check if user can generate hooks
    canGenerate() {
        const userData = this.getUserData();
        
        if (userData.isSubscribed) {
            return { allowed: true, reason: 'subscribed' };
        }
        
        if (userData.generationsToday < userData.freeGenerationsLimit) {
            return { allowed: true, reason: 'free_trial', remaining: userData.freeGenerationsLimit - userData.generationsToday };
        }
        
        return { 
            allowed: false, 
            reason: 'limit_reached',
            limit: userData.freeGenerationsLimit
        };
    }

    // Record a generation
    recordGeneration() {
        const userData = this.getUserData();
        userData.generationsToday += 1;
        userData.generationsTotal += 1;
        localStorage.setItem('hookUserData', JSON.stringify(userData));
        
        this.updateUIBasedOnStatus(userData);
    }

    // Update UI based on user status
    updateUIBasedOnStatus(userData) {
        const statusInfo = this.canGenerate();
        
        // Create or update status bar
        this.createStatusBar(statusInfo, userData);
        
        // Show upgrade prompt if needed
        if (!statusInfo.allowed) {
            this.showUpgradeModal();
        }
    }

    // Create status bar in header
    createStatusBar(statusInfo, userData) {
        const existingStatus = document.getElementById('user-status-bar');
        if (existingStatus) existingStatus.remove();

        const statusBar = document.createElement('div');
        statusBar.id = 'user-status-bar';
        
        if (userData.isSubscribed) {
            statusBar.innerHTML = `
                <div class="bg-green-500 text-white px-4 py-2 text-sm">
                    ✨ PRO MEMBER - Unlimited Generations
                </div>
            `;
        } else if (statusInfo.allowed) {
            statusBar.innerHTML = `
                <div class="bg-blue-500 text-white px-4 py-2 text-sm flex justify-between items-center">
                    <span>🎁 Free Trial: ${statusInfo.remaining} generations left today</span>
                    <button onclick="userManager.showUpgradeModal()" class="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-xs font-bold">
                        UPGRADE $1/month
                    </button>
                </div>
            `;
        } else {
            statusBar.innerHTML = `
                <div class="bg-red-500 text-white px-4 py-2 text-sm flex justify-between items-center">
                    <span>⚠️ Daily limit reached (${userData.freeGenerationsLimit} free generations)</span>
                    <button onclick="userManager.showUpgradeModal()" class="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded text-xs font-bold">
                        UPGRADE NOW $1/month
                    </button>
                </div>
            `;
        }

        // Insert after navigation
        const nav = document.querySelector('nav');
        nav.insertAdjacentElement('afterend', statusBar);
    }

    // Show upgrade modal
    showUpgradeModal() {
        const modal = document.createElement('div');
        modal.id = 'upgrade-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
                <div class="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-crown text-white text-2xl"></i>
                </div>
                
                <h3 class="font-poppins font-bold text-2xl text-gray-900 mb-4">
                    Upgrade to Pro
                </h3>
                
                <p class="text-gray-600 mb-6">
                    Get unlimited hook generations for just <strong>$1/month</strong>
                </p>
                
                <div class="bg-blue-50 rounded-lg p-4 mb-6">
                    <h4 class="font-semibold text-gray-900 mb-2">Pro Benefits:</h4>
                    <ul class="text-sm text-gray-700 text-left space-y-1">
                        <li>✅ Unlimited daily generations</li>
                        <li>✅ All 4 generation methods</li>
                        <li>✅ Priority API access (faster)</li>
                        <li>✅ Export & save features</li>
                        <li>✅ No ads or limitations</li>
                    </ul>
                </div>
                
                <div class="space-y-3">
                    <button id="start-subscription" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
                        Start Pro Subscription - $1/month
                    </button>
                    
                    <button onclick="userManager.closeUpgradeModal()" class="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors">
                        Maybe Later
                    </button>
                </div>
                
                <p class="text-xs text-gray-500 mt-4">
                    Cancel anytime. No hidden fees.
                </p>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Handle subscription button
        document.getElementById('start-subscription').addEventListener('click', () => {
            this.initializePayment();
        });
    }

    // Close upgrade modal
    closeUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) modal.remove();
    }

    // Initialize payment (Stripe integration)
    async initializePayment() {
        try {
            const userData = this.getUserData();
            
            // Get email from user (you can add an email input to the modal)
            const email = prompt('Enter your email address for billing:');
            if (!email) return;

            // Create Stripe checkout session
            const response = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userData.userId,
                    email: email
                })
            });

            const { sessionId, url } = await response.json();

            if (url) {
                // Redirect to Stripe Checkout
                window.location.href = url;
            } else {
                throw new Error('Failed to create checkout session');
            }

        } catch (error) {
            console.error('Payment initialization failed:', error);
            
            // For testing/demo purposes, offer simulation
            if (confirm('Payment setup in progress. Simulate successful payment for demo?')) {
                this.upgradeToProUser();
            }
        }
    }

    // Upgrade user to Pro
    upgradeToProUser() {
        const userData = this.getUserData();
        userData.isSubscribed = true;
        userData.subscriptionType = 'pro';
        userData.subscriptionDate = new Date().toISOString();
        
        localStorage.setItem('hookUserData', JSON.stringify(userData));
        
        this.closeUpgradeModal();
        this.updateUIBasedOnStatus(userData);
        
        // Show success message
        this.showSuccessMessage('🎉 Welcome to Pro! You now have unlimited generations.');
    }

    // Show success message
    showSuccessMessage(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // Generate unique user ID
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Setup authentication UI
    setupAuthUI() {
        // Add login/register buttons if needed
        // This is where you'd add email collection for better user tracking
    }

    // Admin function to view user stats
    getUserStats() {
        const userData = this.getUserData();
        console.log('User Statistics:', userData);
        return userData;
    }
}

// Initialize user manager
const userManager = new UserManager();