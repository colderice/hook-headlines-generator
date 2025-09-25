// Hook & Headlines Generator - Main JavaScript File
class HookHeadlineGenerator {
    constructor() {
        this.currentMethod = null;
        this.isGenerating = false;
        this.init();
    }

    init() {
        this.bindEventListeners();
        this.setupMethodCards();
    }

    bindEventListeners() {
        // Method selection cards
        document.querySelectorAll('.input-method-card').forEach(card => {
            card.addEventListener('click', (e) => this.selectMethod(e));
        });

        // Result action buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'copy-all-btn') this.copyAllResults();
            if (e.target.id === 'generate-more-btn') this.generateMore();
            if (e.target.id === 'start-over-btn') this.startOver();
        });

        // Close toast on click
        document.addEventListener('click', (e) => {
            if (e.target.closest('#success-toast')) {
                this.hideToast();
            }
        });
    }

    setupMethodCards() {
        // Add hover effects and accessibility
        document.querySelectorAll('.input-method-card').forEach(card => {
            card.setAttribute('tabindex', '0');
            card.setAttribute('role', 'button');
            
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectMethod(e);
                }
            });
        });
    }

    selectMethod(e) {
        const card = e.currentTarget;
        const method = card.dataset.method;
        
        // Remove active state from all cards
        document.querySelectorAll('.input-method-card').forEach(c => c.classList.remove('active'));
        
        // Add active state to clicked card
        card.classList.add('active');
        
        this.currentMethod = method;
        this.showForm(method);
    }

    showForm(method) {
        const formContainer = document.getElementById('form-container');
        const formContent = document.getElementById('form-content');
        
        // Generate form based on method
        const formHTML = this.generateFormHTML(method);
        formContent.innerHTML = formHTML;
        
        // Show container with animation
        formContainer.classList.remove('hidden');
        formContainer.classList.add('form-slide-in');
        
        // Smooth scroll to form
        setTimeout(() => {
            formContainer.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);

        // Bind form events
        this.bindFormEvents();
    }

    generateFormHTML(method) {
        const methodConfig = this.getMethodConfig(method);
        
        return `
            <div class="text-center mb-8">
                <div class="w-20 h-20 ${methodConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="${methodConfig.icon} ${methodConfig.iconColor} text-3xl"></i>
                </div>
                <h3 class="font-poppins font-bold text-3xl text-gray-900 mb-3">${methodConfig.title}</h3>
                <p class="text-lg text-gray-600 max-w-2xl mx-auto">${methodConfig.description}</p>
            </div>

            <form id="hook-form" class="max-w-4xl mx-auto">
                ${this.generateFormFields(method)}
                
                <div class="text-center mt-8">
                    <button type="submit" class="btn-primary px-8 py-4 text-white font-semibold rounded-xl text-lg inline-flex items-center">
                        <i class="fas fa-magic mr-3"></i>
                        Generate My Hooks & Headlines
                    </button>
                </div>
            </form>

            <div class="mt-12 p-6 bg-blue-50 rounded-xl border border-blue-200">
                <h4 class="font-semibold text-gray-900 mb-3 flex items-center">
                    <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                    Pro Tip for ${methodConfig.shortTitle}
                </h4>
                <p class="text-gray-700">${methodConfig.proTip}</p>
            </div>
        `;
    }

    generateFormFields(method) {
        switch(method) {
            case 'brief':
                return `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Content Type *</label>
                            <select id="content-type" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required>
                                <option value="">Select content type...</option>
                                <option value="blog-post">Blog Post</option>
                                <option value="social-media">Social Media Post</option>
                                <option value="email">Email Subject</option>
                                <option value="video">Video Title</option>
                                <option value="course">Course Title</option>
                                <option value="webinar">Webinar Title</option>
                                <option value="podcast">Podcast Episode</option>
                                <option value="ad">Advertisement</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Platform *</label>
                            <select id="platform" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" required>
                                <option value="">Select platform...</option>
                                <option value="linkedin">LinkedIn</option>
                                <option value="facebook">Facebook</option>
                                <option value="instagram">Instagram</option>
                                <option value="twitter">Twitter/X</option>
                                <option value="youtube">YouTube</option>
                                <option value="email">Email</option>
                                <option value="website">Website/Blog</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Goal/Objective *</label>
                        <input type="text" id="goal" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., Drive engagement, Generate leads, Build authority" required>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Topic/Subject *</label>
                        <textarea id="topic" rows="4" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Describe your topic in detail..." required></textarea>
                    </div>
                `;
            
            case 'raw-idea':
                return `
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Your Raw Idea *</label>
                        <textarea id="raw-idea" rows="6" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="Dump your messy, unpolished idea here. Don't worry about structure or perfection - just get it all out!" required></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Target Audience</label>
                            <input type="text" id="audience" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500" placeholder="e.g., Small business owners, New entrepreneurs">
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Desired Tone</label>
                            <select id="tone" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent-500 focus:border-accent-500">
                                <option value="">Select tone...</option>
                                <option value="professional">Professional</option>
                                <option value="casual">Casual & Friendly</option>
                                <option value="bold">Bold & Provocative</option>
                                <option value="inspiring">Inspiring</option>
                                <option value="humorous">Humorous</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>
                `;
            
            case 'draft-optimization':
                return `
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Current Headline/Hook *</label>
                        <textarea id="current-draft" rows="4" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-success-500 focus:border-success-500" placeholder="Paste your existing headline or hook here..." required></textarea>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">What's Not Working? (Optional)</label>
                        <textarea id="issues" rows="3" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-success-500 focus:border-success-500" placeholder="e.g., Too generic, not engaging enough, doesn't convey urgency..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Optimization Goal</label>
                            <select id="optimization-goal" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-success-500 focus:border-success-500">
                                <option value="">Select goal...</option>
                                <option value="increase-engagement">Increase Engagement</option>
                                <option value="improve-clarity">Improve Clarity</option>
                                <option value="add-urgency">Add Urgency</option>
                                <option value="boost-curiosity">Boost Curiosity</option>
                                <option value="strengthen-emotional-appeal">Strengthen Emotional Appeal</option>
                                <option value="make-more-specific">Make More Specific</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Content Format</label>
                            <select id="format" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-success-500 focus:border-success-500">
                                <option value="">Select format...</option>
                                <option value="social-post">Social Media Post</option>
                                <option value="email-subject">Email Subject Line</option>
                                <option value="blog-title">Blog Post Title</option>
                                <option value="video-title">Video Title</option>
                                <option value="ad-headline">Ad Headline</option>
                            </select>
                        </div>
                    </div>
                `;
            
            case 'content-analysis':
                return `
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Your Content Piece *</label>
                        <textarea id="content-piece" rows="8" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500" placeholder="Paste your paragraph, tweet, script excerpt, or any content piece here. I'll analyze it and create multiple hook options..." required></textarea>
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-semibold text-gray-700 mb-2">Content Type</label>
                        <select id="content-format" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                            <option value="">Select content type...</option>
                            <option value="paragraph">Article/Blog Paragraph</option>
                            <option value="tweet">Tweet/Social Post</option>
                            <option value="script">Video/Audio Script</option>
                            <option value="email">Email Content</option>
                            <option value="intro">Introduction/Opening</option>
                            <option value="story">Story/Case Study</option>
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Hook Styles Wanted</label>
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input type="checkbox" name="hook-styles" value="question" class="mr-2 rounded border-gray-300">
                                    <span class="text-sm">Question-based hooks</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" name="hook-styles" value="statistic" class="mr-2 rounded border-gray-300">
                                    <span class="text-sm">Statistic/Number hooks</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" name="hook-styles" value="controversial" class="mr-2 rounded border-gray-300">
                                    <span class="text-sm">Controversial statements</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" name="hook-styles" value="story" class="mr-2 rounded border-gray-300">
                                    <span class="text-sm">Story-based hooks</span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Number of Variations</label>
                            <select id="variation-count" class="form-input w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                                <option value="5">5 variations</option>
                                <option value="10" selected>10 variations</option>
                                <option value="15">15 variations</option>
                                <option value="20">20 variations</option>
                            </select>
                        </div>
                    </div>
                `;
            
            default:
                return '<p class="text-center text-gray-500">Please select a method to continue.</p>';
        }
    }

    getMethodConfig(method) {
        const configs = {
            'brief': {
                title: '🎯 Create From Brief',
                shortTitle: 'Brief Method',
                description: 'Provide specific details about your content type, platform, goal, and topic for targeted hook generation.',
                bgColor: 'bg-primary-100',
                icon: 'fas fa-bullseye',
                iconColor: 'text-primary-600',
                proTip: 'The more specific you are about your goal and audience, the more targeted and effective your hooks will be. Include pain points or desired outcomes for best results.'
            },
            'raw-idea': {
                title: '💡 Transform Raw Ideas',
                shortTitle: 'Raw Idea Method',
                description: 'Share your unpolished thoughts and ideas - I\'ll help structure them into compelling hooks and headlines.',
                bgColor: 'bg-accent-100',
                icon: 'fas fa-lightbulb',
                iconColor: 'text-accent-600',
                proTip: 'Don\'t worry about grammar or structure - just brain-dump everything! The messier and more authentic your idea, the more unique hooks we can create.'
            },
            'draft-optimization': {
                title: '✍️ Optimize Your Draft',
                shortTitle: 'Draft Optimization',
                description: 'Already have a headline or hook? I\'ll use rhetorical layering and platform-specific framing to make it irresistible.',
                bgColor: 'bg-success-100',
                icon: 'fas fa-edit',
                iconColor: 'text-success-600',
                proTip: 'Tell me exactly what\'s not working with your current version. Is it too boring? Not specific enough? Missing urgency? This helps me focus the optimization.'
            },
            'content-analysis': {
                title: '🔁 Extract From Content',
                shortTitle: 'Content Analysis',
                description: 'Share any content piece and I\'ll generate multiple high-converting hook and headline options from it.',
                bgColor: 'bg-purple-100',
                icon: 'fas fa-sync-alt',
                iconColor: 'text-purple-600',
                proTip: 'The best hooks often come from buried insights in your content. Share your strongest paragraphs or most compelling points for maximum impact.'
            }
        };
        
        return configs[method] || {};
    }

    bindFormEvents() {
        const form = document.getElementById('hook-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        if (this.isGenerating) return;
        
        const formData = this.collectFormData();
        
        if (!this.validateFormData(formData)) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        this.isGenerating = true;
        this.showLoading();
        
        try {
            // Simulate API call for now - replace with actual GPT API call
            const results = await this.generateHooks(formData);
            this.displayResults(results);
        } catch (error) {
            console.error('Error generating hooks:', error);
            this.showToast('Error generating hooks. Please try again.', 'error');
        } finally {
            this.isGenerating = false;
            this.hideLoading();
        }
    }

    collectFormData() {
        const formData = {
            method: this.currentMethod,
            timestamp: new Date().toISOString()
        };

        // Collect all form inputs
        const form = document.getElementById('hook-form');
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox') {
                if (!formData.checkboxes) formData.checkboxes = [];
                if (input.checked) {
                    formData.checkboxes.push(input.value);
                }
            } else {
                formData[input.id] = input.value;
            }
        });

        return formData;
    }

    validateFormData(formData) {
        // Basic validation - check required fields based on method
        const requiredFields = {
            'brief': ['content-type', 'platform', 'goal', 'topic'],
            'raw-idea': ['raw-idea'],
            'draft-optimization': ['current-draft'],
            'content-analysis': ['content-piece']
        };

        const required = requiredFields[formData.method] || [];
        
        return required.every(field => formData[field] && formData[field].trim() !== '');
    }

    async generateHooks(formData) {
        try {
            // Call the actual API endpoint
            const response = await fetch('/api/generate-hooks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'Failed to generate hooks');
            }

            return data.hooks;
            
        } catch (error) {
            console.error('API call failed:', error);
            
            // Fallback to sample results if API fails
            console.log('Falling back to sample results...');
            return this.generateSampleResults(formData);
        }
    }

    generateSampleResults(formData) {
        // Generate sample results based on method
        const samples = {
            'brief': [
                "The Hidden Truth About [Topic] That [Target Audience] Don't Want You to Know",
                "Why 97% of [Industry] Experts Are Wrong About [Main Point]",
                "The 5-Minute [Solution] That's Changing How [Audience] Think About [Problem]",
                "Stop [Common Mistake] and Start [Better Approach] (Results in 30 Days)",
                "The [Industry] Secret That Turned [Type of Person] Into [Desired Outcome]"
            ],
            'raw-idea': [
                "What Everyone Gets Wrong About [Your Core Idea]",
                "The Counterintuitive Truth Behind [Your Main Point]",
                "Why [Popular Belief] Is Actually Hurting Your [Goal]",
                "[Number] Shocking Facts About [Your Topic] That Will Change Your Mind",
                "The [Adjective] Reality of [Your Subject] (And What to Do Instead)"
            ],
            'draft-optimization': [
                "OPTIMIZED: " + (formData['current-draft'] || 'Your headline') + " → Enhanced Version",
                "IMPROVED: " + (formData['current-draft'] || 'Your headline') + " → More Compelling Version",
                "REFRAMED: " + (formData['current-draft'] || 'Your headline') + " → Curiosity-Driven Version",
                "STRENGTHENED: " + (formData['current-draft'] || 'Your headline') + " → Emotionally-Charged Version",
                "REFINED: " + (formData['current-draft'] || 'Your headline') + " → Action-Oriented Version"
            ],
            'content-analysis': [
                "The One Thing About [Main Topic] That Changes Everything",
                "[Number] Reasons Why [Key Point] Matters More Than You Think",
                "What [Target Audience] Really Need to Know About [Subject]",
                "The Surprising Truth Behind [Main Claim]",
                "How [Key Insight] Can Transform Your [Desired Outcome]"
            ]
        };

        return samples[formData.method] || samples['brief'];
    }

    displayResults(results) {
        const resultsSection = document.getElementById('results-section');
        const resultsContent = document.getElementById('results-content');
        
        let resultsHTML = '';
        
        results.forEach((result, index) => {
            resultsHTML += `
                <div class="result-item bg-white/10 rounded-xl p-6 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center mb-2">
                                <span class="bg-accent-500 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">
                                    #${index + 1}
                                </span>
                                <span class="text-gray-300 text-sm">Hook Option</span>
                            </div>
                            <p class="text-white text-lg leading-relaxed">"${result}"</p>
                        </div>
                        <button class="copy-btn ml-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" data-text="${result}" title="Copy this hook">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        resultsContent.innerHTML = resultsHTML;
        
        // Bind copy buttons
        resultsContent.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.copyText(btn.dataset.text);
                this.animateCopyButton(btn);
            });
        });
        
        // Show results section
        resultsSection.classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    }

    copyText(text) {
        navigator.clipboard.writeText(text).then(() => {
            this.showToast('Hook copied to clipboard!');
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Hook copied to clipboard!');
        });
    }

    copyAllResults() {
        const results = document.querySelectorAll('.result-item p');
        const allText = Array.from(results).map((p, i) => `${i + 1}. ${p.textContent.replace(/"/g, '')}`).join('\n\n');
        
        this.copyText(allText);
        this.showToast('All hooks copied to clipboard!');
    }

    animateCopyButton(button) {
        button.classList.add('copy-success');
        const icon = button.querySelector('i');
        const originalClass = icon.className;
        
        icon.className = 'fas fa-check';
        
        setTimeout(() => {
            icon.className = originalClass;
            button.classList.remove('copy-success');
        }, 1500);
    }

    generateMore() {
        // Re-submit the current form data to generate more results
        const form = document.getElementById('hook-form');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }

    startOver() {
        // Reset the application state
        this.currentMethod = null;
        
        // Hide all sections
        document.getElementById('form-container').classList.add('hidden');
        document.getElementById('results-section').classList.add('hidden');
        
        // Remove active state from all cards
        document.querySelectorAll('.input-method-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showToast('Ready for a new generation!');
    }

    showLoading() {
        document.getElementById('loading-overlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('success-toast');
        const messageEl = document.getElementById('toast-message');
        
        messageEl.textContent = message;
        
        // Update style based on type
        if (type === 'error') {
            toast.className = toast.className.replace('bg-success-500', 'bg-red-500');
        } else {
            toast.className = toast.className.replace('bg-red-500', 'bg-success-500');
        }
        
        toast.classList.remove('hidden');
        toast.classList.add('toast-slide-in');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            this.hideToast();
        }, 3000);
    }

    hideToast() {
        const toast = document.getElementById('success-toast');
        toast.classList.add('toast-slide-out');
        
        setTimeout(() => {
            toast.classList.add('hidden');
            toast.classList.remove('toast-slide-in', 'toast-slide-out');
        }, 300);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new HookHeadlineGenerator();
});

// Service Worker registration (for PWA capabilities)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(registrationError => console.log('SW registration failed'));
    });
}