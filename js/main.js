/**
 * Main Application Logic for Hook & Headlines Generator Pro
 * Handles hook generation, UI interactions, and integration with auth system
 */

class HookGenerator {
    constructor() {
        this.currentMethod = 'brief';
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateMethodDisplay();
    }

    bindEvents() {
        // Method selection
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectMethod(e));
        });

        // Form submissions
        document.getElementById('briefForm').addEventListener('submit', (e) => this.handleGeneration(e, 'brief'));
        document.getElementById('rawIdeaForm').addEventListener('submit', (e) => this.handleGeneration(e, 'raw_idea'));
        document.getElementById('draftForm').addEventListener('submit', (e) => this.handleGeneration(e, 'draft_optimization'));
        document.getElementById('contentForm').addEventListener('submit', (e) => this.handleGeneration(e, 'content_analysis'));
    }

    selectMethod(e) {
        // Update active button
        document.querySelectorAll('.method-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.classList.remove('border-brand-200', 'bg-brand-50');
            btn.classList.add('border-gray-200');
        });
        
        e.currentTarget.classList.add('active');
        e.currentTarget.classList.add('border-brand-200', 'bg-brand-50');
        e.currentTarget.classList.remove('border-gray-200');

        // Update current method
        this.currentMethod = e.currentTarget.dataset.method;
        this.updateMethodDisplay();
    }

    updateMethodDisplay() {
        // Hide all forms
        document.querySelectorAll('.method-form').forEach(form => {
            form.classList.add('hidden');
        });

        // Show selected form
        const activeForm = document.getElementById(this.currentMethod + 'Form');
        if (activeForm) {
            activeForm.classList.remove('hidden');
            activeForm.classList.add('fade-in');
        }
    }

    async handleGeneration(e, method) {
        e.preventDefault();

        // Check authentication and trial limits
        if (!window.authManager || !window.authManager.checkTrialLimit(e)) {
            return;
        }

        if (this.isGenerating) {
            return;
        }

        this.isGenerating = true;
        this.showLoading();

        try {
            const inputData = this.collectInputData(method);
            if (!inputData) {
                throw new Error('Please fill in all required fields');
            }

            const hooks = await this.generateHooks(method, inputData);
            
            if (hooks && hooks.length > 0) {
                this.displayResults(hooks);
                
                // Decrement trial use and log usage
                await window.authManager.decrementTrialUse();
                await window.authManager.logUsage(method, JSON.stringify(inputData), hooks);
                
                window.authManager.showToast('success', `Generated ${hooks.length} compelling hooks!`);
            } else {
                throw new Error('No hooks were generated. Please try again.');
            }

        } catch (error) {
            console.error('Generation error:', error);
            window.authManager.showToast('error', error.message);
        } finally {
            this.isGenerating = false;
            this.hideLoading();
        }
    }

    collectInputData(method) {
        switch (method) {
            case 'brief':
                const contentType = document.getElementById('contentType').value;
                const platform = document.getElementById('platform').value;
                const goal = document.getElementById('goal').value;
                const topic = document.getElementById('topic').value;

                if (!contentType || !platform || !goal || !topic) {
                    return null;
                }

                return { contentType, platform, goal, topic };

            case 'raw_idea':
                const rawIdea = document.getElementById('rawIdea').value.trim();
                return rawIdea ? { rawIdea } : null;

            case 'draft_optimization':
                const draftHeadline = document.getElementById('draftHeadline').value.trim();
                return draftHeadline ? { draftHeadline } : null;

            case 'content_analysis':
                const contentPiece = document.getElementById('contentPiece').value.trim();
                return contentPiece ? { contentPiece } : null;

            default:
                return null;
        }
    }

    async generateHooks(method, inputData) {
        // Generate hooks using GPT API
        try {
            const response = await fetch('api/generate-hooks.js', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    method: method,
                    data: inputData
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            return result.hooks;
        } catch (error) {
            console.error('API Error:', error);
            
            // Fallback to demo hooks for development
            return this.generateDemoHooks(method, inputData);
        }
    }

    generateDemoHooks(method, inputData) {
        // Demo hooks for development/testing
        const demoHooks = {
            brief: [
                "🚨 STOP scrolling: This will change how you think about " + (inputData.topic || "business"),
                "The #1 mistake every " + (inputData.contentType?.replace('_', ' ') || "content creator") + " makes (and how to fix it)",
                "I used to struggle with " + (inputData.topic || "this") + ". Here's what changed everything:",
                "WARNING: Most " + (inputData.platform || "social media") + " advice is dead wrong. Here's why:",
                "3 seconds. That's how long you have to grab attention. Here's how:"
            ],
            raw_idea: [
                "🔥 Hot take: " + (inputData.rawIdea?.substring(0, 50) || "Your idea") + "... (here's why)",
                "Everyone thinks " + (inputData.rawIdea?.substring(0, 40) || "this") + " but they're missing the point",
                "I just realized something that will blow your mind about " + (inputData.rawIdea?.substring(0, 30) || "this topic"),
                "Plot twist: " + (inputData.rawIdea?.substring(0, 50) || "What you think you know") + " is backwards",
                "The uncomfortable truth about " + (inputData.rawIdea?.substring(0, 40) || "this") + " that nobody talks about"
            ],
            draft_optimization: [
                "🚨 " + (inputData.draftHeadline || "Your headline") + " (Why this changes everything)",
                "BREAKING: " + (inputData.draftHeadline || "Your headline") + " - The data will shock you",
                "❌ " + (inputData.draftHeadline || "Your headline") + " → ✅ Here's what works instead",
                "Everyone's talking about '" + (inputData.draftHeadline || "your topic") + "' but missing this crucial point",
                "The real story behind " + (inputData.draftHeadline || "your headline") + " (it's not what you think)"
            ],
            content_analysis: [
                "🎯 The hidden psychology behind this " + (inputData.contentPiece?.substring(0, 30) || "content") + " (thread)",
                "I analyzed " + (inputData.contentPiece?.substring(0, 40) || "this content") + " and found 3 genius tactics",
                "Why " + (inputData.contentPiece?.substring(0, 50) || "this approach") + " works so well (breakdown)",
                "🧠 The neuroscience of why " + (inputData.contentPiece?.substring(0, 40) || "this") + " grabs attention",
                "Steal this: The exact formula used in " + (inputData.contentPiece?.substring(0, 30) || "viral content")
            ]
        };

        return demoHooks[method] || demoHooks.brief;
    }

    displayResults(hooks) {
        const resultsSection = document.getElementById('results');
        const container = document.getElementById('hooksContainer');

        // Clear previous results
        container.innerHTML = '';

        // Create hook cards
        hooks.forEach((hook, index) => {
            const hookCard = this.createHookCard(hook, index);
            container.appendChild(hookCard);
        });

        // Show results section
        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    createHookCard(hook, index) {
        const card = document.createElement('div');
        card.className = 'hook-card fade-in';
        card.style.animationDelay = `${index * 0.1}s`;
        
        card.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h3 class="text-lg font-semibold text-gray-900">Hook #${index + 1}</h3>
                <button class="copy-btn p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors" 
                        data-hook="${hook.replace(/"/g, '&quot;')}" title="Copy to clipboard">
                    <i class="fas fa-copy"></i>
                </button>
            </div>
            <p class="text-gray-800 leading-relaxed mb-4 text-lg">${hook}</p>
            <div class="flex items-center justify-between text-sm text-gray-500">
                <span class="bg-gray-100 px-2 py-1 rounded-full">
                    ${hook.length} characters
                </span>
                <span class="flex items-center">
                    <i class="fas fa-chart-line mr-1"></i>
                    High engagement potential
                </span>
            </div>
        `;

        // Add copy functionality
        const copyBtn = card.querySelector('.copy-btn');
        copyBtn.addEventListener('click', () => this.copyToClipboard(hook, copyBtn));

        return card;
    }

    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            
            // Update button appearance
            const icon = button.querySelector('i');
            const originalClass = icon.className;
            
            icon.className = 'fas fa-check';
            button.classList.add('copied');
            
            setTimeout(() => {
                icon.className = originalClass;
                button.classList.remove('copied');
            }, 2000);

            window.authManager.showToast('success', 'Hook copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            window.authManager.showToast('error', 'Failed to copy. Please select and copy manually.');
        }
    }

    showLoading() {
        document.getElementById('loading').classList.remove('hidden');
        document.getElementById('results').classList.add('hidden');
        
        // Disable all generate buttons
        document.querySelectorAll('.generate-btn').forEach(btn => {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
        });
    }

    hideLoading() {
        document.getElementById('loading').classList.add('hidden');
        
        // Re-enable all generate buttons
        document.querySelectorAll('.generate-btn').forEach(btn => {
            btn.disabled = false;
            const originalText = {
                'briefForm': 'Generate Hooks',
                'rawIdeaForm': 'Transform Idea',
                'draftForm': 'Optimize Hook',
                'contentForm': 'Extract Hooks'
            };
            
            const formId = btn.closest('form').id;
            btn.innerHTML = `<i class="fas fa-magic mr-2"></i>${originalText[formId] || 'Generate Hooks'}`;
        });
    }

    // Utility methods
    validateForm(formData) {
        for (const [key, value] of Object.entries(formData)) {
            if (!value || (typeof value === 'string' && !value.trim())) {
                return false;
            }
        }
        return true;
    }

    clearForm(method) {
        const form = document.getElementById(method + 'Form');
        if (form) {
            form.reset();
        }
    }

    // Analytics and tracking
    trackGeneration(method, inputData, hooks) {
        // Track usage for analytics
        if (window.gtag) {
            gtag('event', 'hook_generated', {
                event_category: 'engagement',
                event_label: method,
                value: hooks.length
            });
        }

        console.log('Hook generation tracked:', {
            method,
            inputLength: JSON.stringify(inputData).length,
            hooksGenerated: hooks.length,
            timestamp: new Date().toISOString()
        });
    }
}

// Keyboard shortcuts and accessibility
document.addEventListener('keydown', (e) => {
    // Escape key to close modal
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (!modal.classList.contains('hidden')) {
            window.authManager.hideModal();
        }
    }
    
    // Ctrl/Cmd + Enter to submit forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeForm = document.querySelector('.method-form:not(.hidden)');
        if (activeForm) {
            const submitBtn = activeForm.querySelector('button[type="submit"]');
            if (submitBtn && !submitBtn.disabled) {
                submitBtn.click();
            }
        }
    }
});

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.hookGenerator = new HookGenerator();
    
    // Add some demo functionality for development
    if (window.location.search.includes('demo=true')) {
        console.log('Demo mode enabled - using fallback hooks');
    }
});

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}