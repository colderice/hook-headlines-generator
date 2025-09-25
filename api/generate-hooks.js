// API endpoint for generating hooks and headlines
// This would be deployed as a serverless function or backend service

/**
 * Generate Hooks API Endpoint
 * 
 * This endpoint receives form data from the frontend and securely calls the GPT API
 * to generate compelling hooks and headlines based on the user's input method.
 * 
 * Security Features:
 * - API key is stored securely on server side
 * - Input validation and sanitization
 * - Rate limiting (implement with your hosting provider)
 * - CORS configuration for your domain only
 */

// Example implementation for Vercel/Netlify Functions or Express.js

const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // Set in your environment variables
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// CORS configuration - update with your domain
const ALLOWED_ORIGINS = [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:3000', // For development
];

/**
 * Main handler function
 */
async function handler(req, res) {
    // CORS headers
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Validate and sanitize input
        const validatedData = validateInput(req.body);
        
        // Generate GPT prompt based on method
        const prompt = generatePrompt(validatedData);
        
        // Call GPT API with retry logic
        const gptResponse = await callGPTWithRetry(prompt, validatedData.method);
        
        // Parse and format the response
        const hooks = parseGPTResponse(gptResponse, validatedData.method);
        
        // Return successful response
        return res.status(200).json({
            success: true,
            hooks: hooks,
            method: validatedData.method,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error generating hooks:', error);
        
        return res.status(500).json({
            success: false,
            error: 'Failed to generate hooks. Please try again.',
            timestamp: new Date().toISOString()
        });
    }
}

/**
 * Validate and sanitize input data
 */
function validateInput(body) {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid request body');
    }

    const { method } = body;
    
    if (!method || !['brief', 'raw-idea', 'draft-optimization', 'content-analysis'].includes(method)) {
        throw new Error('Invalid or missing method');
    }

    // Sanitize all string inputs
    const sanitized = {};
    for (const [key, value] of Object.entries(body)) {
        if (typeof value === 'string') {
            // Basic sanitization - remove potentially harmful content
            sanitized[key] = value
                .trim()
                .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
                .replace(/javascript:/gi, '') // Remove javascript: URLs
                .slice(0, 5000); // Limit length
        } else {
            sanitized[key] = value;
        }
    }

    // Method-specific validation
    switch (method) {
        case 'brief':
            if (!sanitized['content-type'] || !sanitized['platform'] || !sanitized['goal'] || !sanitized['topic']) {
                throw new Error('Missing required fields for brief method');
            }
            break;
        case 'raw-idea':
            if (!sanitized['raw-idea']) {
                throw new Error('Missing raw idea field');
            }
            break;
        case 'draft-optimization':
            if (!sanitized['current-draft']) {
                throw new Error('Missing current draft field');
            }
            break;
        case 'content-analysis':
            if (!sanitized['content-piece']) {
                throw new Error('Missing content piece field');
            }
            break;
    }

    return sanitized;
}

/**
 * Generate GPT prompt based on input method and data
 */
function generatePrompt(data) {
    const baseInstruction = `You are an expert copywriter specializing in creating compelling hooks and headlines for digital content. Your expertise includes understanding audience psychology, conversion optimization, and platform-specific content strategies.

Generate 10 unique, high-converting hooks and headlines that:
- Capture immediate attention
- Create curiosity and urgency  
- Are tailored for the specific audience (SMB owners, coaches, trainers, course creators)
- Use proven psychological triggers
- Are optimized for the specified platform
- Avoid clichés and generic language

Return only the hooks/headlines, numbered 1-10, without additional commentary.`;

    let specificPrompt = '';

    switch (data.method) {
        case 'brief':
            specificPrompt = `
METHOD: Brief-based Generation

CONTENT TYPE: ${data['content-type']}
PLATFORM: ${data['platform']}
GOAL: ${data['goal']}
TOPIC: ${data['topic']}

Create hooks/headlines that align perfectly with this brief and are optimized for ${data['platform']}.`;
            break;

        case 'raw-idea':
            specificPrompt = `
METHOD: Raw Idea Transformation

RAW IDEA: "${data['raw-idea']}"
${data.audience ? `TARGET AUDIENCE: ${data.audience}` : ''}
${data.tone ? `DESIRED TONE: ${data.tone}` : ''}

Transform this raw, unpolished idea into polished, compelling hooks that maintain the core message while adding structure and emotional appeal.`;
            break;

        case 'draft-optimization':
            specificPrompt = `
METHOD: Draft Optimization

CURRENT DRAFT: "${data['current-draft']}"
${data.issues ? `ISSUES TO ADDRESS: ${data.issues}` : ''}
${data['optimization-goal'] ? `OPTIMIZATION GOAL: ${data['optimization-goal']}` : ''}
${data.format ? `CONTENT FORMAT: ${data.format}` : ''}

Optimize and enhance this existing headline using rhetorical layering, emotional triggers, and platform-specific framing. Create variations that address the identified issues.`;
            break;

        case 'content-analysis':
            specificPrompt = `
METHOD: Content Analysis & Hook Extraction

CONTENT PIECE: "${data['content-piece']}"
${data['content-format'] ? `CONTENT TYPE: ${data['content-format']}` : ''}
${data.checkboxes && data.checkboxes.length > 0 ? `PREFERRED HOOK STYLES: ${data.checkboxes.join(', ')}` : ''}

Analyze this content and extract the most compelling insights, then create hooks that highlight these key points and draw readers into the full content.`;
            break;
    }

    return `${baseInstruction}\n${specificPrompt}`;
}

/**
 * Call GPT API with retry logic
 */
async function callGPTWithRetry(prompt, method, retries = MAX_RETRIES) {
    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4', // or 'gpt-3.5-turbo' for cost optimization
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert copywriter and marketing strategist specializing in creating compelling hooks and headlines that convert.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8, // Allow for creativity
                max_tokens: 1000,
                top_p: 0.9,
                frequency_penalty: 0.5, // Reduce repetition
                presence_penalty: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`GPT API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error('Invalid GPT API response format');
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error(`GPT API call failed (attempt ${MAX_RETRIES - retries + 1}):`, error);
        
        if (retries > 0) {
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return callGPTWithRetry(prompt, method, retries - 1);
        }
        
        throw error;
    }
}

/**
 * Parse and format GPT response into array of hooks
 */
function parseGPTResponse(gptContent, method) {
    try {
        // Split by lines and filter out empty ones
        const lines = gptContent.split('\n').filter(line => line.trim() !== '');
        
        // Extract numbered hooks (look for patterns like "1.", "1:", "1 -", etc.)
        const hooks = lines
            .filter(line => /^\d+[\.\:\-\)]\s/.test(line.trim()))
            .map(line => {
                // Remove the number prefix and clean up
                return line.replace(/^\d+[\.\:\-\)]\s*/, '').trim();
            })
            .filter(hook => hook.length > 0);

        // If we couldn't parse numbered hooks, try to extract meaningful lines
        if (hooks.length === 0) {
            const meaningfulLines = lines
                .filter(line => {
                    const trimmed = line.trim();
                    return trimmed.length > 20 && // Minimum length
                           !trimmed.toLowerCase().startsWith('here') && // Skip instruction lines
                           !trimmed.toLowerCase().includes('hook') && // Skip meta references
                           trimmed !== trimmed.toUpperCase(); // Skip all-caps lines
                })
                .slice(0, 10); // Limit to 10

            if (meaningfulLines.length > 0) {
                return meaningfulLines;
            }
        }

        // Ensure we have at least some hooks
        if (hooks.length === 0) {
            throw new Error('No valid hooks found in GPT response');
        }

        // Limit to 10 hooks and clean up formatting
        return hooks.slice(0, 10).map(hook => {
            // Remove quotes if the entire hook is wrapped in them
            if ((hook.startsWith('"') && hook.endsWith('"')) || 
                (hook.startsWith("'") && hook.endsWith("'"))) {
                hook = hook.slice(1, -1);
            }
            return hook.trim();
        });

    } catch (error) {
        console.error('Error parsing GPT response:', error);
        
        // Fallback: return method-specific default hooks
        return getDefaultHooks(method);
    }
}

/**
 * Fallback default hooks if GPT parsing fails
 */
function getDefaultHooks(method) {
    const fallbacks = {
        'brief': [
            "The Secret Strategy That's Transforming How Businesses Grow",
            "Why 90% of Entrepreneurs Are Doing This Wrong (And How to Fix It)",
            "The 10-Minute Method That Doubled My Results",
            "Stop Following This Outdated Advice (Try This Instead)",
            "The Hidden Truth About Success That Nobody Talks About"
        ],
        'raw-idea': [
            "The Counterintuitive Approach That Changes Everything",
            "What Most People Get Wrong About This Topic",
            "The Simple Truth That Will Shift Your Perspective",
            "Why Everything You've Been Told Is Backwards",
            "The One Thing That Makes All the Difference"
        ],
        'draft-optimization': [
            "Your Optimized Headline: More Compelling Version",
            "Enhanced Hook: Attention-Grabbing Variation",
            "Improved Version: Curiosity-Driven Approach",
            "Strengthened Hook: Emotional Impact Version",
            "Refined Headline: Action-Oriented Format"
        ],
        'content-analysis': [
            "The Key Insight That Changes How You Think About This",
            "What This Really Means for Your Success",
            "The Hidden Pattern Most People Miss",
            "Why This Matters More Than You Think",
            "The Surprising Truth Behind These Results"
        ]
    };

    return fallbacks[method] || fallbacks['brief'];
}

// Export for different platforms
module.exports = handler; // For Express.js/Node.js
exports.default = handler; // For Vercel
exports.handler = handler; // For Netlify Functions

// For testing
if (typeof window === 'undefined' && require.main === module) {
    console.log('Hook Generator API endpoint ready for deployment');
}